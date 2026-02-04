
import React, { useState, useEffect } from 'react';
import { User, UserPlan, CustomSMTP, ProcessingLog, PaymentConfig } from '../types';
import { LIMITS as DEFAULT_LIMITS, PRICING_PLANS as DEFAULT_PLANS } from '../constants';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('all_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [globalLogs, setGlobalLogs] = useState<ProcessingLog[]>(() => {
    const saved = localStorage.getItem('global_activity_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<any[]>(() => {
    const saved = localStorage.getItem('platform_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [globalSmtp, setGlobalSmtp] = useState<CustomSMTP>(() => {
    const saved = localStorage.getItem('global_smtp');
    return saved ? JSON.parse(saved) : { 
      host: 'smtp.certiflow.io', 
      port: 587, 
      user: 'platform@certiflow.io', 
      pass: '', 
      fromEmail: 'noreply@certiflow.io',
      fromName: 'CertiFlow Platform',
      encryption: 'TLS' 
    };
  });

  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(() => {
    const saved = localStorage.getItem('global_payment_config');
    return saved ? JSON.parse(saved) : {
      stripe: { enabled: true, publicKey: 'pk_test_certiflow_default', secretKey: 'sk_test_...' },
      paypal: { enabled: true, publicKey: 'sb-client-id-certiflow', secretKey: 'sb-secret' },
      currency: 'INR'
    };
  });

  const [pricingPlans, setPricingPlans] = useState(() => {
    const saved = localStorage.getItem('global_pricing_plans');
    return saved ? JSON.parse(saved) : DEFAULT_PLANS;
  });

  const [activeAdminTab, setActiveAdminTab] = useState<'users' | 'activity' | 'platform_smtp' | 'payments' | 'schemes' | 'revenue' | 'security'>('users');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Security tab state
  const [currentAdminPass, setCurrentAdminPass] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [confirmAdminPass, setConfirmAdminPass] = useState('');

  // Save all global states to storage whenever they change
  useEffect(() => {
    localStorage.setItem('all_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('global_activity_logs', JSON.stringify(globalLogs));
  }, [globalLogs]);

  useEffect(() => {
    localStorage.setItem('global_pricing_plans', JSON.stringify(pricingPlans));
    localStorage.setItem('global_smtp', JSON.stringify(globalSmtp));
    localStorage.setItem('global_payment_config', JSON.stringify(paymentConfig));
  }, [pricingPlans, globalSmtp, paymentConfig]);

  const saveConfiguration = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert("System configuration updated successfully. All changes are live.");
    }, 800);
  };

  const updateUserInfo = (userId: string, updates: Partial<User>) => {
    setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u));
    if (editingUser?.id === userId) {
      setEditingUser(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteUser = (userId: string) => {
    if (window.confirm("CRITICAL: Are you sure you want to delete this account?")) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      if (editingUser?.id === userId) setEditingUser(null);
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPass = localStorage.getItem('platform_admin_pass') || 'admin123';
    if (currentAdminPass !== storedPass) {
      alert("Incorrect current password.");
      return;
    }
    if (newAdminPass !== confirmAdminPass) {
      alert("New passwords do not match.");
      return;
    }
    localStorage.setItem('platform_admin_pass', newAdminPass);
    alert("Master admin password updated.");
    setCurrentAdminPass(''); setNewAdminPass(''); setConfirmAdminPass('');
  };

  const calculateTotalRevenue = () => {
    return transactions.reduce((acc, tx) => {
      const amt = parseInt(tx.amount.replace(/[^0-9]/g, '')) || 0;
      return acc + amt;
    }, 0);
  };

  const exportActivityToCSV = (clearAfter = false) => {
    if (globalLogs.length === 0) return alert("No delivery data available to export.");

    const headers = ["Timestamp", "Sender", "Project", "Recipient Email", "Status", "Errors"];
    const rows = globalLogs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.userEmail,
      log.projectName,
      log.recipientEmail,
      log.status,
      log.errorMessage || "None"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `certiflow_platform_activity_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (clearAfter) {
      if (confirm("Activity logs exported successfully. Wipe the platform history now?")) {
        setGlobalLogs([]);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 min-h-screen pb-40">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center">
            Control Center
            <span className="ml-4 px-3 py-1 bg-indigo-100 text-indigo-600 text-[10px] font-bold uppercase rounded-full tracking-widest">Administrator</span>
          </h1>
          <p className="text-gray-500 mt-1">Manage platform logic, monitor logs, and configure payment gateways.</p>
        </div>
        <div className="flex bg-gray-100 p-1.5 rounded-[1.5rem] overflow-x-auto shadow-inner no-scrollbar max-w-full">
           {[
             { id: 'users', label: 'Users', icon: 'fa-users' },
             { id: 'revenue', label: 'Financials', icon: 'fa-chart-line' },
             { id: 'activity', label: 'Logs', icon: 'fa-pulse' },
             { id: 'schemes', label: 'Plans', icon: 'fa-tags' },
             { id: 'payments', label: 'Gateways', icon: 'fa-credit-card' },
             { id: 'platform_smtp', label: 'SMTP', icon: 'fa-server' },
             { id: 'security', label: 'Auth', icon: 'fa-lock' }
           ].map(tab => (
             <button 
                key={tab.id}
                onClick={() => { setActiveAdminTab(tab.id as any); setEditingUser(null); }} 
                className={`px-5 py-3 rounded-[1.2rem] font-bold text-xs transition-all flex items-center whitespace-nowrap ${activeAdminTab === tab.id ? 'bg-white shadow-md text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
             >
                <i className={`fas ${tab.icon} mr-2`}></i> {tab.label}
             </button>
           ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {activeAdminTab === 'users' && (
          <>
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                   <div className="relative flex-grow max-w-xs">
                      <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                      <input className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 font-medium" placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                   </div>
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{filteredUsers.length} total users</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <tr><th className="px-8 py-5">Profile</th><th className="px-8 py-5 text-center">Tier</th><th className="px-8 py-5 text-center">Sent</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm font-medium text-gray-700">
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => setEditingUser(u)}>
                          <td className="px-8 py-5 flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">{u.email[0].toUpperCase()}</div> {u.email}</td>
                          <td className="px-8 py-5 text-center"><span className="bg-gray-100 px-3 py-1 rounded-full text-[10px] uppercase font-black">{u.plan}</span></td>
                          <td className="px-8 py-5 text-center font-mono">{u.totalSent || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="lg:col-span-4">
               {editingUser ? (
                 <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-2xl space-y-6 animate-slideUp">
                    <div className="flex justify-between items-center"><h3 className="text-xl font-black">Edit User</h3><button onClick={() => setEditingUser(null)} className="text-gray-300"><i className="fas fa-times-circle"></i></button></div>
                    <div>
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Override Plan</label>
                       <div className="grid grid-cols-1 gap-2">
                         {Object.values(UserPlan).map(p => (
                           <button key={p} onClick={() => updateUserInfo(editingUser.id, { plan: p })} className={`p-4 rounded-xl text-xs font-bold border text-left flex justify-between ${editingUser.plan === p ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 border-gray-100'}`}>{p} {editingUser.plan === p && <i className="fas fa-check"></i>}</button>
                         ))}
                       </div>
                    </div>
                    <button onClick={() => deleteUser(editingUser.id)} className="w-full p-4 bg-red-50 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest">Delete User</button>
                 </div>
               ) : (
                 <div className="bg-gray-50/50 rounded-[3rem] p-12 text-center border-2 border-dashed border-gray-200">
                    <i className="fas fa-mouse-pointer text-4xl text-gray-200 mb-4"></i>
                    <p className="text-gray-400 text-sm font-bold">Select user to edit</p>
                 </div>
               )}
            </div>
          </>
        )}

        {activeAdminTab === 'revenue' && (
          <div className="lg:col-span-12 space-y-8 animate-slideUp">
             <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm"><p className="text-[10px] font-black text-gray-400 uppercase mb-2">Gross Revenue</p><h2 className="text-4xl font-black text-gray-900">{paymentConfig.currency} {calculateTotalRevenue()}</h2></div>
                <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm"><p className="text-[10px] font-black text-gray-400 uppercase mb-2">Transactions</p><h2 className="text-4xl font-black text-gray-900">{transactions.length}</h2></div>
                <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm"><p className="text-[10px] font-black text-gray-400 uppercase mb-2">Avg Order</p><h2 className="text-4xl font-black text-gray-900">{paymentConfig.currency} {Math.round(calculateTotalRevenue() / (transactions.length || 1))}</h2></div>
             </div>
             <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest"><th className="px-8 py-5">Tx ID</th><th className="px-8 py-5">Customer</th><th className="px-8 py-5">Plan</th><th className="px-8 py-5 text-right">Amount</th></thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {transactions.map(tx => (
                      <tr key={tx.id}><td className="px-8 py-5 font-mono text-xs">{tx.id}</td><td className="px-8 py-5 font-bold">{tx.userEmail}</td><td className="px-8 py-5 text-gray-500 uppercase font-black text-[10px]">{tx.planName}</td><td className="px-8 py-5 text-right font-black">{tx.amount}</td></tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {activeAdminTab === 'activity' && (
          <div className="lg:col-span-12 animate-slideUp space-y-6">
            <div className="flex justify-between items-end">
               <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-12">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Logs</p>
                    <p className="text-2xl font-black">{globalLogs.length}</p>
                  </div>
                  <div className="h-10 w-px bg-gray-100"></div>
                  <div className="flex gap-3">
                     <button 
                       onClick={() => exportActivityToCSV(false)}
                       className="bg-gray-50 text-gray-700 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100 flex items-center"
                     >
                       <i className="fas fa-download mr-2"></i> Export Report
                     </button>
                     <button 
                       onClick={() => exportActivityToCSV(true)}
                       className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center"
                     >
                       <i className="fas fa-file-export mr-2"></i> Export & Clear
                     </button>
                  </div>
               </div>
               <button onClick={() => { if(confirm("Wipe all logs?")) setGlobalLogs([]); }} className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors mb-4 mr-4">Wipe Logs</button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
               <div className="overflow-x-auto max-h-[60vh] custom-scrollbar">
                 <table className="w-full text-left">
                   <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest sticky top-0 z-10 backdrop-blur-md">
                     <tr><th className="px-8 py-5">Timestamp</th><th className="px-8 py-5">Sender</th><th className="px-8 py-5">Project</th><th className="px-8 py-5">Recipient</th><th className="px-8 py-5 text-center">Outcome</th></tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50 text-xs font-medium">
                     {globalLogs.map(log => (
                       <tr key={log.id} className="hover:bg-gray-50/30 transition-colors">
                         <td className="px-8 py-4 text-gray-400">{new Date(log.timestamp).toLocaleTimeString()} <br/> <span className="text-[9px] opacity-60">{new Date(log.timestamp).toLocaleDateString()}</span></td>
                         <td className="px-8 py-4 font-bold">{log.userEmail}</td>
                         <td className="px-8 py-4">{log.projectName}</td>
                         <td className="px-8 py-4">{log.recipientEmail}</td>
                         <td className="px-8 py-4 text-center">
                           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{log.status}</span>
                         </td>
                       </tr>
                     ))}
                     {globalLogs.length === 0 && (
                       <tr><td colSpan={5} className="p-32 text-center text-gray-300 italic font-medium">No activity recorded yet.</td></tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        {activeAdminTab === 'schemes' && (
          <div className="lg:col-span-12 space-y-8 animate-slideUp">
             <div className="grid md:grid-cols-3 gap-8">
               {pricingPlans.map((plan, i) => (
                 <div key={i} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl space-y-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Display Name</label>
                      <input className="w-full p-4 bg-gray-50 border-none rounded-xl font-black text-gray-900" value={plan.name} onChange={e => {
                         const newPlans = [...pricingPlans];
                         newPlans[i].name = e.target.value;
                         setPricingPlans(newPlans);
                      }} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Price Label</label>
                         <input className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold" value={plan.price} onChange={e => {
                            const newPlans = [...pricingPlans];
                            newPlans[i].price = e.target.value;
                            setPricingPlans(newPlans);
                         }} />
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Daily Limit</label>
                         <input type="number" className="w-full p-4 bg-gray-50 border-none rounded-xl font-bold" value={plan.limit} onChange={e => {
                            const newPlans = [...pricingPlans];
                            newPlans[i].limit = parseInt(e.target.value);
                            setPricingPlans(newPlans);
                         }} />
                       </div>
                    </div>
                 </div>
               ))}
             </div>
             <button onClick={saveConfiguration} className="w-full bg-indigo-600 text-white p-7 rounded-[2.5rem] font-black text-lg shadow-2xl hover:bg-indigo-700 flex items-center justify-center">
               {isSaving ? <i className="fas fa-spinner fa-spin mr-3"></i> : <i className="fas fa-save mr-3"></i>} Save Plan Modifications
             </button>
          </div>
        )}

        {activeAdminTab === 'payments' && (
          <div className="lg:col-span-12 max-w-4xl mx-auto space-y-10 animate-slideUp">
             <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-10">
                <div className="flex items-center gap-6"><div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl"><i className="fab fa-stripe"></i></div><h3 className="text-2xl font-black">Stripe Integration</h3></div>
                <div className="grid md:grid-cols-2 gap-8">
                   <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Publishable Key</label><input className="w-full p-5 bg-gray-50 border-none rounded-2xl font-mono text-xs" value={paymentConfig.stripe.publicKey} onChange={e => setPaymentConfig({...paymentConfig, stripe: {...paymentConfig.stripe, publicKey: e.target.value}})} /></div>
                   <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Secret Key</label><input className="w-full p-5 bg-gray-50 border-none rounded-2xl font-mono text-xs" type="password" value={paymentConfig.stripe.secretKey} onChange={e => setPaymentConfig({...paymentConfig, stripe: {...paymentConfig.stripe, secretKey: e.target.value}})} /></div>
                </div>
                <div className="pt-10 border-t border-gray-50 flex items-center gap-6"><div className="w-16 h-16 bg-yellow-50 text-yellow-600 rounded-2xl flex items-center justify-center text-3xl"><i className="fab fa-paypal"></i></div><h3 className="text-2xl font-black">PayPal Integration</h3></div>
                <div className="grid md:grid-cols-2 gap-8">
                   <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Client ID</label><input className="w-full p-5 bg-gray-50 border-none rounded-2xl font-mono text-xs" value={paymentConfig.paypal.publicKey} onChange={e => setPaymentConfig({...paymentConfig, paypal: {...paymentConfig.paypal, publicKey: e.target.value}})} /></div>
                   <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Secret Key</label><input className="w-full p-5 bg-gray-50 border-none rounded-2xl font-mono text-xs" type="password" value={paymentConfig.paypal.secretKey} onChange={e => setPaymentConfig({...paymentConfig, paypal: {...paymentConfig.paypal, secretKey: e.target.value}})} /></div>
                </div>
                <div className="pt-10 border-t border-gray-50"><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Platform Currency Code (ISO)</label><input className="w-32 p-5 bg-gray-50 border-none rounded-2xl font-black text-center" value={paymentConfig.currency} onChange={e => setPaymentConfig({...paymentConfig, currency: e.target.value})} /></div>
                <button onClick={saveConfiguration} className="w-full bg-indigo-600 text-white p-7 rounded-[2.5rem] font-black text-lg shadow-2xl flex items-center justify-center"><i className="fas fa-check-circle mr-3"></i> Deploy Gateway Settings</button>
             </div>
          </div>
        )}

        {activeAdminTab === 'platform_smtp' && (
          <div className="lg:col-span-12 max-w-4xl mx-auto animate-slideUp">
             <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-10">
                <div className="flex items-center gap-6"><div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl"><i className="fas fa-server"></i></div><h3 className="text-2xl font-black">Master SMTP Pipeline</h3></div>
                <div className="grid md:grid-cols-3 gap-6">
                   <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase block">Host</label><input className="w-full p-5 bg-gray-50 border-none rounded-2xl font-bold" value={globalSmtp.host} onChange={e => setGlobalSmtp({...globalSmtp, host: e.target.value})} /></div>
                   <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase block">Port</label><input className="w-full p-5 bg-gray-50 border-none rounded-2xl font-bold" value={globalSmtp.port} onChange={e => setGlobalSmtp({...globalSmtp, port: parseInt(e.target.value)})} /></div>
                   <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase block">Encryption</label><select className="w-full p-5 bg-gray-50 border-none rounded-2xl font-bold" value={globalSmtp.encryption} onChange={e => setGlobalSmtp({...globalSmtp, encryption: e.target.value as any})}><option>SSL</option><option>TLS</option><option>NONE</option></select></div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                   <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase block">Username / Auth User</label><input className="w-full p-5 bg-gray-50 border-none rounded-2xl font-bold" value={globalSmtp.user} onChange={e => setGlobalSmtp({...globalSmtp, user: e.target.value})} /></div>
                   <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase block">Password / Token</label><input className="w-full p-5 bg-gray-50 border-none rounded-2xl font-bold" type="password" value={globalSmtp.pass} onChange={e => setGlobalSmtp({...globalSmtp, pass: e.target.value})} /></div>
                </div>
                <button onClick={saveConfiguration} className="w-full bg-indigo-600 text-white p-7 rounded-[2.5rem] font-black text-lg shadow-2xl flex items-center justify-center"><i className="fas fa-paper-plane mr-3"></i> Synchronize Master SMTP</button>
             </div>
          </div>
        )}

        {activeAdminTab === 'security' && (
          <div className="lg:col-span-12 max-w-2xl mx-auto animate-slideUp">
             <div className="bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl border border-white/10 text-white space-y-10">
                <div className="flex items-center gap-6"><div className="w-16 h-16 bg-white/10 text-white rounded-2xl flex items-center justify-center text-3xl"><i className="fas fa-lock"></i></div><h3 className="text-2xl font-black">Auth Security</h3></div>
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                   <div className="space-y-2"><label className="text-[10px] font-black text-white/40 uppercase block">Current Master Key</label><input className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl font-mono text-center tracking-[1em]" type="password" value={currentAdminPass} onChange={e => setCurrentAdminPass(e.target.value)} required /></div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2"><label className="text-[10px] font-black text-white/40 uppercase block">New Key</label><input className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl font-mono text-center tracking-[1em]" type="password" value={newAdminPass} onChange={e => setNewAdminPass(e.target.value)} required /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-white/40 uppercase block">Confirm Key</label><input className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl font-mono text-center tracking-[1em]" type="password" value={confirmAdminPass} onChange={e => setConfirmAdminPass(e.target.value)} required /></div>
                   </div>
                   <button type="submit" className="w-full bg-indigo-600 p-7 rounded-[2rem] font-black text-lg shadow-2xl hover:bg-indigo-700">Rotate Master Key</button>
                </form>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
