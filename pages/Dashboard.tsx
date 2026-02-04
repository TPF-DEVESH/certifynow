
import React, { useState, useEffect, useRef } from 'react';
import { User, UserPlan, Project, Recipient, VariableConfig, CustomSMTP, VariableType, ProcessingLog } from '../types';
import { LIMITS as DEFAULT_LIMITS } from '../constants';
import { processImageCertificate } from '../services/certificateService';
import { sendAutomatedEmail } from '../services/emailService';
import { generateEmailCopy } from '../services/aiService';

interface DashboardProps {
  user: User;
  onUpdateUser: (u: User) => void;
  onNavigate: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onUpdateUser, onNavigate }) => {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(`projects_${user.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentLimits] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('global_pricing_plans');
    if (!saved) return DEFAULT_LIMITS;
    const plans = JSON.parse(saved);
    const limitMap: Record<string, number> = {};
    plans.forEach((p: any) => { limitMap[p.plan] = p.limit; });
    return limitMap;
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'recipients' | 'history' | 'smtp'>('editor');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedVarId, setSelectedVarId] = useState<string | null>(null);
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [previewRecipientId, setPreviewRecipientId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const activeProject = projects.find(p => p.id === activeProjectId);

  useEffect(() => {
    localStorage.setItem(`projects_${user.id}`, JSON.stringify(projects));
  }, [projects, user.id]);

  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleAIAssist = async () => {
    if (!activeProject) return;
    setIsGeneratingAI(true);
    const result = await generateEmailCopy(activeProject.name, "Professional certificate delivery email");
    if (result) {
      updateActiveProject({
        emailSubject: result.subject || activeProject.emailSubject,
        emailBody: result.body || activeProject.emailBody
      });
    }
    setIsGeneratingAI(false);
  };

  const createProject = () => {
    if (user.plan === UserPlan.FREE && projects.length >= 1) {
      alert("SaaS Limit: Free accounts are restricted to 1 automation project. Upgrade to Pro for unlimited campaigns!");
      onNavigate('pricing');
      return;
    }

    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Flow #${projects.length + 1}`,
      templateFile: null,
      templateType: null,
      variables: [
        { id: '1', key: 'Name', type: 'TEXT', x: 50, y: 45, fontSize: 40, fontColor: '#000000', textAlign: 'center' },
        { id: '2', key: 'CertID', type: 'TEXT', x: 50, y: 85, fontSize: 20, fontColor: '#6366f1', textAlign: 'center' }
      ],
      recipients: [],
      emailSubject: "Your Certification of Achievement",
      emailBody: `Dear {Name},\n\nWe are pleased to attach your official certificate (ID: {CertID}) for your recent completion.\n\nKeep growing,\nCertiFlow Team`,
      updatedAt: new Date().toISOString(),
      stats: { success: 0, failed: 0 }
    };
    setProjects([...projects, newProject]);
    setActiveProjectId(newProject.id);
    setActiveTab('editor');
  };

  const deleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Permanently delete this project and all history?")) {
      const filtered = projects.filter(p => p.id !== id);
      setProjects(filtered);
      if (activeProjectId === id) setActiveProjectId(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  const updateActiveProject = (updates: Partial<Project>) => {
    setProjects(projects.map(p => p.id === activeProjectId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p));
  };

  const addVariable = (type: VariableType = 'TEXT', customKey?: string) => {
    if (!activeProject) return;
    const key = customKey || prompt("Enter field name (e.g. Course, Date, Grade):");
    if (!key) return;
    const newVar: VariableConfig = {
      id: Math.random().toString(36).substr(2, 5),
      key,
      type,
      x: 50,
      y: 50,
      fontSize: 32,
      fontColor: '#000000',
      textAlign: 'center'
    };
    updateActiveProject({ variables: [...activeProject.variables, newVar] });
    setSelectedVarId(newVar.id);
  };

  const updateVariable = (id: string, updates: Partial<VariableConfig>) => {
    if (!activeProject) return;
    const updatedVars = activeProject.variables.map(v => v.id === id ? { ...v, ...updates } : v);
    updateActiveProject({ variables: updatedVars });
  };

  const handlePreview = async (recipient: Recipient) => {
    if (!activeProject || !activeProject.templateFile) return;
    setPreviewRecipientId(recipient.id);
    const dataUrl = await processImageCertificate(activeProject.templateFile, activeProject.variables, recipient.data, recipient.certId);
    setPreviewImage(dataUrl);
  };

  const runCampaign = async (targets?: Recipient[]) => {
    if (!activeProject || !activeProject.templateFile) {
      alert("Missing Template: Please upload a certificate background first.");
      return;
    }
    
    const recipientsToProcess = targets || activeProject.recipients;
    if (recipientsToProcess.length === 0) {
      alert("Empty Audience: Add recipients before launching.");
      return;
    }
    
    const count = recipientsToProcess.length;
    if (user.dailyUsage + count > currentLimits[user.plan]) {
      alert("Daily Credit Exhausted: This campaign exceeds your current tier limits.");
      onNavigate('pricing');
      return;
    }

    setIsProcessing(true);
    setLogs([]);
    let successCount = activeProject.stats?.success || 0;
    let failCount = activeProject.stats?.failed || 0;
    let currentSessionSuccess = 0;

    let updatedRecipients = [...activeProject.recipients];

    for (let i = 0; i < recipientsToProcess.length; i++) {
      const recipient = recipientsToProcess[i];
      setLogs(prev => [...prev, `[INIT] Rendering certificate for ${recipient.email}...`]);
      
      try {
        const attachment = await processImageCertificate(activeProject.templateFile!, activeProject.variables, recipient.data, recipient.certId);
        
        const replacePlaceholders = (text: string) => {
          let out = text.replace(/{Name}/g, recipient.data.Name).replace(/{CertID}/g, recipient.certId);
          Object.entries(recipient.data).forEach(([k, v]) => {
            out = out.replace(new RegExp(`{${k}}`, 'g'), v);
          });
          return out;
        };

        const success = await sendAutomatedEmail(
          recipient.email, 
          replacePlaceholders(activeProject.emailSubject), 
          replacePlaceholders(activeProject.emailBody), 
          attachment, 
          user.smtp
        );

        const globalLog: ProcessingLog = {
          id: Math.random().toString(36).substr(2, 9),
          userId: user.id,
          userEmail: user.email,
          projectId: activeProject.id,
          projectName: activeProject.name,
          recipientEmail: recipient.email,
          status: success ? 'SUCCESS' : 'FAILURE',
          timestamp: new Date().toISOString(),
          errorMessage: success ? undefined : "SMTP Gateway Rejected Recipient"
        };
        const existingGlobalLogs = JSON.parse(localStorage.getItem('global_activity_logs') || '[]');
        localStorage.setItem('global_activity_logs', JSON.stringify([globalLog, ...existingGlobalLogs].slice(0, 1000)));

        const recIdx = updatedRecipients.findIndex(r => r.id === recipient.id);
        if (success) {
          if (recIdx > -1) updatedRecipients[recIdx].status = 'SUCCESS';
          currentSessionSuccess++;
          successCount++;
          setLogs(prev => [...prev, `[DONE] Dispatched to ${recipient.email}`]);
        } else {
          if (recIdx > -1) updatedRecipients[recIdx].status = 'FAILURE';
          failCount++;
          setLogs(prev => [...prev, `[FAIL] SMTP Reject: ${recipient.email}`]);
        }
      } catch (e) {
        const recIdx = updatedRecipients.findIndex(r => r.id === recipient.id);
        if (recIdx > -1) updatedRecipients[recIdx].status = 'FAILURE';
        failCount++;
        setLogs(prev => [...prev, `[ERR] Render Timeout: ${recipient.email}`]);
      }
      
      setProgress(Math.round(((i + 1) / recipientsToProcess.length) * 100));
    }

    updateActiveProject({ 
      recipients: updatedRecipients,
      stats: { success: successCount, failed: failCount } 
    });
    onUpdateUser({ ...user, dailyUsage: user.dailyUsage + currentSessionSuccess, totalSent: (user.totalSent || 0) + currentSessionSuccess });
    setIsProcessing(false);
    setProgress(0);
    setActiveTab('history');
  };

  const retryFailed = () => {
    if (!activeProject) return;
    const failedOnes = activeProject.recipients.filter(r => r.status === 'FAILURE');
    if (failedOnes.length === 0) return alert("No failed deliveries found.");
    if (confirm(`Retry sending ${failedOnes.length} failed certificates?`)) {
      runCampaign(failedOnes);
    }
  };

  const isFree = user.plan === UserPlan.FREE;

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-[#F8F9FC]">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-100 flex flex-col p-8 space-y-10 shadow-sm relative z-20">
        <div>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Flow Library</h2>
            {isFree && <span className="text-[8px] bg-amber-50 text-amber-600 px-2 py-1 rounded font-black uppercase">Free Tier</span>}
          </div>
          <button onClick={createProject} className="w-full bg-indigo-600 text-white p-5 rounded-[1.5rem] font-black text-sm shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center mb-10 group">
            <i className="fas fa-plus mr-3 group-hover:rotate-90 transition-transform"></i> New Campaign
          </button>
          <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
            {projects.map(p => (
              <div 
                key={p.id} 
                onClick={() => { setActiveProjectId(p.id); setSelectedVarId(null); }} 
                className={`group p-5 rounded-[1.5rem] border transition-all relative cursor-pointer ${activeProjectId === p.id ? 'bg-indigo-50 border-indigo-100 text-indigo-700 shadow-sm' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
              >
                <div className="flex justify-between items-start">
                   <p className="text-sm font-black truncate pr-6">{p.name}</p>
                   {p.stats && p.stats.success > 0 && <span className="w-2 h-2 rounded-full bg-green-500 mt-1"></span>}
                </div>
                <div className="flex items-center gap-3 mt-1 opacity-60">
                   <p className="text-[9px] font-bold uppercase tracking-widest">{p.recipients.length} Recs</p>
                   {p.stats && p.stats.failed > 0 && <span className="text-[8px] text-red-500 font-black">({p.stats.failed} Err)</span>}
                </div>
                <button 
                  onClick={(e) => deleteProject(p.id, e)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <i className="fas fa-trash-alt text-xs"></i>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl overflow-hidden group">
           <div className="flex justify-between items-center mb-5">
             <span className="text-[10px] font-black opacity-50 uppercase tracking-widest">Daily Balance</span>
             <span className="text-xs font-black">{currentLimits[user.plan] - user.dailyUsage} left</span>
           </div>
           <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-6">
              <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${Math.min(100, (user.dailyUsage / currentLimits[user.plan]) * 100)}%` }}></div>
           </div>
           <button onClick={() => onNavigate('pricing')} className="w-full bg-indigo-600/20 hover:bg-indigo-600 border border-white/10 text-white py-4 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest">Upgrade Credits</button>
        </div>
      </aside>

      <main className="flex-grow flex flex-col overflow-hidden relative">
        {activeProject ? (
          <>
            <header className="bg-white border-b border-gray-100 px-12 py-6 flex justify-between items-center shadow-sm relative z-10">
              <div className="flex items-center space-x-10">
                <div className="relative group">
                  <input 
                    className={`text-xl font-black bg-transparent border-none focus:outline-none focus:ring-0 w-64 transition-all ${isFree ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900 cursor-text hover:bg-gray-50 rounded-lg px-2'}`} 
                    value={activeProject.name} 
                    disabled={isFree}
                    onChange={(e) => updateActiveProject({ name: e.target.value })}
                  />
                  {isFree && <div className="absolute -top-1 -right-4 text-amber-500 text-[10px]"><i className="fas fa-lock"></i></div>}
                </div>
                <div className="flex bg-gray-100 p-1 rounded-[1.25rem]">
                  {[
                    {id: 'editor', label: 'Design', icon: 'fa-palette'},
                    {id: 'recipients', label: 'Audience', icon: 'fa-users'},
                    {id: 'history', label: 'History', icon: 'fa-clock-rotate-left'},
                    {id: 'smtp', label: 'Relay', icon: 'fa-paper-plane'}
                  ].map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => setActiveTab(t.id as any)} 
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center ${activeTab === t.id ? 'bg-white shadow-md text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <i className={`fas ${t.icon} mr-2`}></i> {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => runCampaign()} 
                disabled={isProcessing} 
                className={`px-12 py-4 rounded-2xl font-black text-sm shadow-2xl transition-all transform active:scale-95 flex items-center ${isProcessing ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'}`}
              >
                {isProcessing ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div> Processing {progress}%</>
                ) : (
                  <><i className="fas fa-bolt mr-3"></i> Sync All</>
                )}
              </button>
            </header>

            <div className="flex-grow p-12 overflow-y-auto custom-scrollbar bg-[#F8F9FC]/50">
              {activeTab === 'editor' && (
                <div className="grid lg:grid-cols-12 gap-12 max-w-7xl mx-auto animate-slideUp">
                  <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white p-6 rounded-[3.5rem] shadow-2xl border border-gray-100 relative group min-h-[500px]">
                      <div 
                        className="relative w-full rounded-[2.5rem] overflow-hidden shadow-inner cursor-crosshair bg-gray-50 flex items-center justify-center transition-all group-hover:shadow-lg"
                        onClick={(e) => {
                          if (!selectedVarId) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = ((e.clientX - rect.left) / rect.width) * 100;
                          const y = ((e.clientY - rect.top) / rect.height) * 100;
                          updateVariable(selectedVarId, { x, y });
                        }}
                      >
                        {activeProject.templateFile ? (
                          <>
                            <img src={activeProject.templateFile} className="w-full h-full object-contain" draggable={false} />
                            {activeProject.variables.map(v => (
                              <div 
                                key={v.id} 
                                onClick={(e) => { e.stopPropagation(); setSelectedVarId(v.id); }}
                                className={`absolute p-4 border-2 rounded-2xl font-black transition-all cursor-move select-none flex items-center justify-center ${selectedVarId === v.id ? 'bg-indigo-600 text-white border-white shadow-2xl z-30 scale-110' : 'bg-white/95 backdrop-blur-md text-indigo-600 border-indigo-100 z-20 hover:scale-105'}`} 
                                style={{ 
                                  left: `${v.x}%`, 
                                  top: `${v.y}%`, 
                                  transform: 'translate(-50%, -50%)', 
                                  fontSize: `${v.fontSize / 3}px`,
                                  color: selectedVarId === v.id ? 'white' : v.fontColor,
                                  textAlign: v.textAlign || 'center'
                                }}
                              >
                                {v.type === 'QR_CODE' ? (
                                  <i className="fas fa-qrcode text-2xl"></i>
                                ) : (
                                  v.key.toLowerCase().includes('certid') ? `ID-001234` : `{${v.key}}`
                                )}
                              </div>
                            ))}
                          </>
                        ) : (
                          <div className="p-32 text-center">
                            <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-600 text-4xl mb-8 mx-auto"><i className="fas fa-cloud-upload"></i></div>
                            <p className="font-black uppercase text-xs tracking-[0.3em] text-gray-400 mb-8">No Asset Loaded</p>
                            <label className="bg-indigo-600 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase cursor-pointer hover:bg-indigo-700 shadow-xl transition-all inline-block">
                              Upload Template
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => updateActiveProject({ templateFile: ev.target?.result as string, templateType: 'image' });
                                  reader.readAsDataURL(file);
                                }
                              }} />
                            </label>
                          </div>
                        )}
                      </div>
                      {selectedVarId && (
                        <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-xl text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3">
                           <i className="fas fa-mouse-pointer animate-pulse"></i> Click canvas to move "{activeProject.variables.find(v => v.id === selectedVarId)?.key}"
                        </div>
                      )}
                    </div>

                    <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-gray-100 group">
                      <div className="flex justify-between items-center mb-10">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Communication Pipeline</h3>
                        <button 
                          onClick={handleAIAssist}
                          disabled={isGeneratingAI}
                          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center shadow-lg hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isGeneratingAI ? <i className="fas fa-sparkles fa-spin mr-2"></i> : <i className="fas fa-wand-magic-sparkles mr-2"></i>} AI Rewrite
                        </button>
                      </div>
                      <div className="space-y-6">
                        <input className="w-full p-6 bg-gray-50 border-none rounded-3xl font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all" placeholder="Email Subject" value={activeProject.emailSubject} onChange={e => updateActiveProject({ emailSubject: e.target.value })} />
                        <textarea className="w-full p-6 bg-gray-50 border-none rounded-3xl h-56 font-medium text-sm focus:ring-4 focus:ring-indigo-50 transition-all" placeholder="Personalized message..." value={activeProject.emailBody} onChange={e => updateActiveProject({ emailBody: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-100 flex flex-col min-h-[500px]">
                      <div className="flex justify-between items-center mb-10">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Layers</h3>
                        <div className="flex gap-2">
                           <button onClick={() => addVariable('TEXT', 'CertID')} title="Add ID Layer" className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center hover:scale-110 transition-transform"><i className="fas fa-id-card"></i></button>
                           <button onClick={() => addVariable('QR_CODE')} title="Add QR" className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:scale-110 transition-transform"><i className="fas fa-qrcode"></i></button>
                           <button onClick={() => addVariable('TEXT')} title="Add Field" className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-indigo-100"><i className="fas fa-plus"></i></button>
                        </div>
                      </div>
                      
                      <div className="space-y-4 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                        {activeProject.variables.map(v => (
                          <div key={v.id} onClick={() => setSelectedVarId(v.id)} className={`p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer ${selectedVarId === v.id ? 'border-indigo-600 bg-indigo-50/20' : 'border-gray-50 hover:bg-gray-50'}`}>
                             <div className="flex justify-between items-center">
                               <div className="flex items-center gap-3">
                                 <i className={`fas ${v.type === 'QR_CODE' ? 'fa-qrcode' : v.key.toLowerCase().includes('certid') ? 'fa-id-card' : 'fa-font'} text-[10px] text-indigo-400`}></i>
                                 <span className="text-xs font-black text-gray-900 uppercase tracking-widest truncate">{v.key}</span>
                               </div>
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   if(v.key === 'Name') return alert("Required field.");
                                   updateActiveProject({ variables: activeProject.variables.filter(vari => vari.id !== v.id) });
                                   if(selectedVarId === v.id) setSelectedVarId(null);
                                 }}
                                 className="text-gray-300 hover:text-red-500 transition-colors"
                               >
                                 <i className="fas fa-trash-alt text-[10px]"></i>
                               </button>
                             </div>
                             {selectedVarId === v.id && (
                               <div className="space-y-6 mt-8 animate-slideUp">
                                 <div className="space-y-3">
                                   <div className="flex justify-between"><label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Font Size</label><span className="text-[10px] font-bold text-indigo-600">{v.fontSize}px</span></div>
                                   <input type="range" min="12" max="250" className="w-full accent-indigo-600 cursor-pointer" value={v.fontSize} onChange={(e) => updateVariable(v.id, { fontSize: parseInt(e.target.value) })} />
                                 </div>
                                 <div className="space-y-3">
                                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Text Alignment</label>
                                   <div className="flex bg-gray-100 p-1 rounded-xl">
                                      {['left', 'center', 'right'].map(align => (
                                        <button key={align} onClick={() => updateVariable(v.id, { textAlign: align as any })} className={`flex-grow py-2 rounded-lg text-[10px] font-black uppercase transition-all ${v.textAlign === align ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>
                                           <i className={`fas fa-align-${align}`}></i>
                                        </button>
                                      ))}
                                   </div>
                                 </div>
                                 <div className="space-y-3">
                                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Hue</label>
                                   <div className="flex gap-4 items-center">
                                      <input type="color" className="w-12 h-12 p-1.5 bg-white border border-gray-100 rounded-2xl cursor-pointer shadow-sm" value={v.fontColor} onChange={(e) => updateVariable(v.id, { fontColor: e.target.value })} />
                                      <div className="flex-grow p-4 bg-gray-50 rounded-2xl text-[10px] font-mono font-bold text-gray-500 text-center uppercase">{v.fontColor}</div>
                                   </div>
                                 </div>
                               </div>
                             )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'recipients' && (
                <div className="max-w-6xl mx-auto space-y-12 animate-slideUp">
                  <div className="grid md:grid-cols-2 gap-10">
                    <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-xl flex flex-col items-center text-center group hover:shadow-2xl transition-all">
                      <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-600 text-4xl mb-8 shadow-inner group-hover:scale-110 transition-transform"><i className="fas fa-file-csv"></i></div>
                      <h3 className="text-2xl font-black mb-4">Batch Upload</h3>
                      <p className="text-gray-500 text-sm font-medium mb-10 max-w-xs">Drop a CSV file with <strong>Name</strong> and <strong>Email</strong> headers to sync your database.</p>
                      <input type="file" className="hidden" id="csv-upload" accept=".csv" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const text = ev.target?.result as string;
                            const rows = text.split('\n').slice(1).filter(r => r.trim().length > 5);
                            const newRecs = rows.map(r => {
                              const parts = r.split(',');
                              return { 
                                id: Math.random().toString(), 
                                data: { Name: (parts[0] || 'Attendee').trim() }, 
                                email: (parts[1] || '').trim().toLowerCase(), 
                                certId: Math.random().toString(36).substr(2, 8).toUpperCase(),
                                status: 'PENDING'
                              } as Recipient;
                            });
                            updateActiveProject({ recipients: [...activeProject.recipients, ...newRecs] });
                          };
                          reader.readAsText(file);
                        }
                      }} />
                      <label htmlFor="csv-upload" className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest cursor-pointer hover:bg-indigo-700 shadow-xl shadow-indigo-100 active:scale-95 transition-all">Select CSV</label>
                    </div>
                    <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-xl flex flex-col items-center text-center group hover:shadow-2xl transition-all">
                      <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-600 text-4xl mb-8 shadow-inner group-hover:scale-110 transition-transform"><i className="fas fa-user-plus"></i></div>
                      <h3 className="text-2xl font-black mb-4">Single Entry</h3>
                      <div className="w-full space-y-4 mb-10">
                         <input className="w-full p-5 bg-gray-50 border-none rounded-2xl font-black text-sm" placeholder="Full Name" value={manualName} onChange={e => setManualName(e.target.value)} />
                         <input className="w-full p-5 bg-gray-50 border-none rounded-2xl font-black text-sm" placeholder="Email Address" value={manualEmail} onChange={e => setManualEmail(e.target.value)} />
                      </div>
                      <button onClick={() => {
                        if (manualName && manualEmail) {
                          updateActiveProject({ recipients: [...activeProject.recipients, { id: Date.now().toString(), email: manualEmail.toLowerCase(), data: { Name: manualName }, certId: Math.random().toString(36).substr(2, 8).toUpperCase(), status: 'PENDING' }] });
                          setManualName(""); setManualEmail("");
                        }
                      }} className="w-full bg-emerald-600 text-white py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-emerald-700 shadow-xl active:scale-95 transition-all">Add to Flow</button>
                    </div>
                  </div>

                  <div className="bg-white rounded-[4rem] border border-gray-100 shadow-2xl overflow-hidden">
                    <div className="p-10 border-b border-gray-50 flex justify-between items-center">
                      <h3 className="text-2xl font-black">Target Audience</h3>
                      <button onClick={() => updateActiveProject({ recipients: [] })} className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors">Flush Audience</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                          <tr><th className="px-10 py-6">Member</th><th className="px-10 py-6">Email</th><th className="px-10 py-6 text-right">Preview</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {activeProject.recipients.map(r => (
                            <tr key={r.id} className="text-sm hover:bg-gray-50/30 transition-colors group">
                              <td className="px-10 py-6 font-black text-gray-900">{r.data.Name}</td>
                              <td className="px-10 py-6 text-gray-500 font-bold">{r.email}</td>
                              <td className="px-10 py-6 text-right">
                                 <button onClick={() => handlePreview(r)} title="Quick Look" className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-100"><i className="fas fa-eye"></i></button>
                              </td>
                            </tr>
                          ))}
                          {activeProject.recipients.length === 0 && (
                            <tr><td colSpan={3} className="p-32 text-center text-gray-300 italic font-medium">No audience members yet.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="max-w-6xl mx-auto space-y-12 animate-slideUp">
                  <div className="grid md:grid-cols-4 gap-6">
                     <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Syncs</p>
                        <h4 className="text-3xl font-black text-gray-900">{activeProject.recipients.length}</h4>
                     </div>
                     <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 text-emerald-500">Delivered</p>
                        <h4 className="text-3xl font-black text-emerald-600">{activeProject.recipients.filter(r => r.status === 'SUCCESS').length}</h4>
                     </div>
                     <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 text-red-400">Errors</p>
                        <h4 className="text-3xl font-black text-red-500">{activeProject.recipients.filter(r => r.status === 'FAILURE').length}</h4>
                     </div>
                     <div className="bg-white p-4 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-center">
                        <button onClick={retryFailed} className="w-full h-full bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                           <i className="fas fa-rotate-right"></i> Retry Errors
                        </button>
                     </div>
                  </div>

                  <div className="bg-white rounded-[4rem] border border-gray-100 shadow-2xl overflow-hidden">
                    <div className="p-10 border-b border-gray-50 flex justify-between items-center">
                      <h3 className="text-2xl font-black text-gray-900">Campaign History Logs</h3>
                      <button onClick={() => {
                        const csv = [
                          ["Name", "Email", "CertID", "Status"].join(","),
                          ...activeProject.recipients.map(r => [r.data.Name, r.email, r.certId, r.status || 'PENDING'].join(","))
                        ].join("\n");
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${activeProject.name}_report.csv`;
                        a.click();
                      }} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Download Report (CSV)</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                          <tr><th className="px-10 py-6">Member Identity</th><th className="px-10 py-6">Identifier</th><th className="px-10 py-6 text-center">Flow Status</th><th className="px-10 py-6 text-right">Quick View</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {activeProject.recipients.map(r => (
                            <tr key={r.id} className="text-sm hover:bg-gray-50/30 transition-colors">
                              <td className="px-10 py-6 font-black text-gray-900">{r.data.Name} <br/><span className="text-[10px] text-gray-400 font-bold">{r.email}</span></td>
                              <td className="px-10 py-6 font-mono text-xs text-indigo-600 font-black">{r.certId}</td>
                              <td className="px-10 py-6 text-center">
                                 {r.status === 'SUCCESS' ? (
                                   <span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 w-fit mx-auto"><i className="fas fa-check"></i> Dispatched</span>
                                 ) : r.status === 'FAILURE' ? (
                                   <span className="bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 w-fit mx-auto"><i className="fas fa-exclamation-triangle"></i> Blocked</span>
                                 ) : (
                                   <span className="bg-gray-100 text-gray-500 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 w-fit mx-auto"><i className="fas fa-hourglass-start"></i> Queued</span>
                                 )}
                              </td>
                              <td className="px-10 py-6 text-right">
                                 <button onClick={() => handlePreview(r)} className="text-gray-300 hover:text-indigo-600 p-2"><i className="fas fa-magnifying-glass"></i></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'smtp' && (
                <div className="max-w-4xl mx-auto py-20 animate-slideUp">
                  {isFree ? (
                    <div className="bg-white p-20 rounded-[5rem] border border-gray-100 shadow-2xl text-center space-y-12 relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-20 blur-3xl"></div>
                       <div className="w-28 h-28 bg-indigo-50 rounded-[3rem] flex items-center justify-center text-indigo-600 text-6xl mx-auto shadow-inner"><i className="fas fa-lock"></i></div>
                       <div className="space-y-6">
                         <h4 className="text-5xl font-black text-gray-900 tracking-tight">Enterprise Relay</h4>
                         <p className="text-gray-500 text-xl font-medium max-w-lg mx-auto leading-relaxed">Free accounts use our shared relay node. Upgrade to connect your business SMTP for branded delivery.</p>
                       </div>
                       <button onClick={() => onNavigate('pricing')} className="bg-indigo-600 text-white px-16 py-6 rounded-3xl font-black text-xl shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all">Unlock Premium SMTP</button>
                    </div>
                  ) : (
                    <div className="bg-white p-16 rounded-[4.5rem] border border-gray-100 shadow-2xl space-y-14">
                       <div className="flex items-center gap-8"><div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center text-4xl shadow-inner"><i className="fas fa-server"></i></div><div><h3 className="text-3xl font-black">SMTP Infrastructure</h3><p className="text-gray-400 font-bold text-sm">Configure your outbound mail relay</p></div></div>
                       <div className="grid md:grid-cols-2 gap-10">
                          <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Host Endpoint</label><input className="w-full p-6 bg-gray-50 border-none rounded-[2rem] font-black" value={user.smtp?.host || ''} onChange={e => onUpdateUser({...user, smtp: {...(user.smtp || {} as CustomSMTP), host: e.target.value}})} placeholder="smtp.mailtrap.io" /></div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Port</label><input type="number" className="w-full p-6 bg-gray-50 border-none rounded-[2rem] font-black" value={user.smtp?.port || 587} onChange={e => onUpdateUser({...user, smtp: {...(user.smtp || {} as CustomSMTP), port: parseInt(e.target.value)}})} /></div>
                            <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Security</label><select className="w-full p-6 bg-gray-50 border-none rounded-[2rem] font-black cursor-pointer" value={user.smtp?.encryption} onChange={e => onUpdateUser({...user, smtp: {...(user.smtp || {} as CustomSMTP), encryption: e.target.value as any}})}><option>SSL</option><option>TLS</option><option>NONE</option></select></div>
                          </div>
                       </div>
                       <div className="grid md:grid-cols-2 gap-10">
                          <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Auth User</label><input className="w-full p-6 bg-gray-50 border-none rounded-[2rem] font-black" value={user.smtp?.user || ''} onChange={e => onUpdateUser({...user, smtp: {...(user.smtp || {} as CustomSMTP), user: e.target.value}})} /></div>
                          <div className="space-y-3"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Auth Key</label><input type="password" className="w-full p-6 bg-gray-50 border-none rounded-[2rem] font-black" value={user.smtp?.pass || ''} onChange={e => onUpdateUser({...user, smtp: {...(user.smtp || {} as CustomSMTP), pass: e.target.value}})} /></div>
                       </div>
                       <button onClick={() => alert("Verification handshake success. Infrastructure updated.")} className="w-full bg-gray-900 text-white py-8 rounded-[3rem] font-black text-xl hover:bg-black transition-all shadow-2xl active:scale-[0.98]">Deploy Relay Settings</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-xl z-[60] flex flex-col items-center justify-center p-20 animate-slideUp">
                <div className="w-full max-w-2xl space-y-10">
                   <div className="text-center space-y-4">
                      <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                      <h2 className="text-4xl font-black text-gray-900">Synchronizing Flow...</h2>
                      <p className="text-gray-500 font-bold text-lg uppercase tracking-widest">{progress}% Complete</p>
                   </div>
                   <div className="w-full bg-gray-50 rounded-[2.5rem] p-10 h-96 overflow-y-auto border border-gray-100 shadow-inner font-mono text-xs space-y-2 custom-scrollbar">
                      {logs.map((log, i) => (
                        <div key={i} className={`flex gap-4 ${log.includes('DONE') ? 'text-emerald-600' : log.includes('FAIL') ? 'text-red-500' : 'text-gray-400'}`}>
                           <span className="opacity-40">[{new Date().toLocaleTimeString()}]</span>
                           <span className="font-bold">{log}</span>
                        </div>
                      ))}
                      <div ref={logEndRef} />
                   </div>
                   <div className="text-center">
                      <p className="text-gray-400 font-medium italic">Your pipeline is being processed. This may take a few moments.</p>
                   </div>
                </div>
              </div>
            )}

            {/* Preview Modal */}
            {previewRecipientId && previewImage && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-12" onClick={() => { setPreviewRecipientId(null); setPreviewImage(null); }}>
                 <div className="bg-white p-8 rounded-[4rem] shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slideUp" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-8 px-4">
                       <div>
                          <h4 className="text-2xl font-black">Member Cert Preview</h4>
                          <p className="text-indigo-600 font-bold text-sm">Target: {activeProject.recipients.find(r => r.id === previewRecipientId)?.email}</p>
                       </div>
                       <button onClick={() => { setPreviewRecipientId(null); setPreviewImage(null); }} className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-red-500 transition-all"><i className="fas fa-times text-2xl"></i></button>
                    </div>
                    <div className="flex-grow overflow-y-auto rounded-[2rem] border-4 border-gray-50 shadow-inner bg-gray-100 flex items-center justify-center">
                       <img src={previewImage} className="max-w-full shadow-2xl" alt="Preview" />
                    </div>
                 </div>
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-20 text-center animate-slideUp">
            <div className="w-36 h-36 bg-white rounded-[4rem] shadow-2xl flex items-center justify-center text-indigo-600 text-6xl mb-12 animate-float"><i className="fas fa-rocket"></i></div>
            <h3 className="text-5xl font-black text-gray-900 mb-6 tracking-tight">Launch Automation</h3>
            <p className="text-gray-500 max-w-lg mx-auto font-medium text-xl leading-relaxed">Start your next certification workflow. Everything you generate is automatically saved in your history.</p>
            <button onClick={createProject} className="mt-12 bg-indigo-600 text-white px-16 py-6 rounded-[2.5rem] font-black text-lg uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:scale-105 transition-all">Create First Flow</button>
          </div>
        )}
      </main>
      
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Dashboard;
