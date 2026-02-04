
import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import { User, UserPlan, PaymentConfig } from './types';
import { PRICING_PLANS as DEFAULT_PLANS } from './constants';
import { initiateStripeCheckout, loadPayPalScript } from './services/paymentService';

const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

const useHashRouter = () => {
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#home');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#home';
      setCurrentHash(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (page: string) => {
    const target = page.startsWith('#') ? page : `#${page}`;
    window.location.hash = target;
  };

  return { currentHash, navigate };
};

const App: React.FC = () => {
  const { currentHash, navigate } = useHashRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(() => sessionStorage.getItem('admin_session') === 'true');
  const [isLoading, setIsLoading] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState('');
  const [isPayLoading, setIsPayLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState<{plan: any, method: 'stripe' | 'paypal'} | null>(null);
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  
  const [plans, setPlans] = useState(() => {
    const saved = localStorage.getItem('global_pricing_plans');
    return saved ? JSON.parse(saved) : DEFAULT_PLANS;
  });

  const getPaymentConfig = (): PaymentConfig => {
    const saved = localStorage.getItem('global_payment_config');
    return saved ? JSON.parse(saved) : {
      stripe: { enabled: true, publicKey: 'pk_test_certiflow', secretKey: '' },
      paypal: { enabled: true, publicKey: 'sb-paypal-client', secretKey: '' },
      currency: 'INR'
    };
  };

  // Admin Master Password Check
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const masterPass = localStorage.getItem('platform_admin_pass') || 'admin123';
    if (adminPassInput === masterPass) {
      setIsAdminAuthorized(true);
      sessionStorage.setItem('admin_session', 'true');
      
      // Also set a mock user for the navbar
      const adminUser: User = {
        id: 'admin_master',
        email: 'admin@redac.in',
        name: 'System Admin',
        plan: UserPlan.PAID_MONTHLY,
        dailyUsage: 0,
        createdAt: new Date().toISOString()
      };
      setUser(adminUser);
      navigate('admin');
    } else {
      alert("Invalid Admin Credentials");
    }
  };

  useEffect(() => {
    const handleGoogleResponse = (response: any) => {
      setIsLoading(true);
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const email = payload.email.toLowerCase();
      const allUsersSaved = localStorage.getItem('all_users');
      const allUsers: User[] = allUsersSaved ? JSON.parse(allUsersSaved) : [];
      
      let existing = allUsers.find(u => u.email.toLowerCase() === email);
      
      const userData: User = existing ? {
        ...existing,
        name: payload.name,
        picture: payload.picture,
        lastLogin: new Date().toISOString()
      } : {
        id: payload.sub,
        email: email,
        name: payload.name,
        picture: payload.picture,
        plan: email === 'admin@redac.in' ? UserPlan.PAID_MONTHLY : UserPlan.FREE,
        dailyUsage: 0,
        totalSent: 0,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      setUser(userData);
      setIsLoading(false);
      navigate('dashboard');
    };

    if ((window as any).google && (currentHash === '#login' || currentHash === '#signup')) {
      (window as any).google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      const btn = document.getElementById("googleBtn");
      if (btn) {
        (window as any).google.accounts.id.renderButton(btn, { theme: "outline", size: "large", width: "100%", shape: "pill" });
      }
    }
  }, [currentHash]);

  useEffect(() => {
    const savedUser = localStorage.getItem('certiflow_user');
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch (e) { localStorage.removeItem('certiflow_user'); }
    }
  }, []);

  useEffect(() => {
    if (user) {
        localStorage.setItem('certiflow_user', JSON.stringify(user));
        const allUsersSaved = localStorage.getItem('all_users');
        const allUsers: User[] = allUsersSaved ? JSON.parse(allUsersSaved) : [];
        const index = allUsers.findIndex(u => u.id === user.id);
        if (index > -1) { allUsers[index] = user; } else { allUsers.push(user); }
        localStorage.setItem('all_users', JSON.stringify(allUsers));
    }
  }, [user]);

  useEffect(() => {
    if (showCheckout?.method === 'paypal' && paypalContainerRef.current) {
      const config = getPaymentConfig();
      loadPayPalScript(config.paypal.publicKey, config.currency).then(() => {
        if (window.paypal && paypalContainerRef.current) {
          paypalContainerRef.current.innerHTML = '';
          window.paypal.Buttons({
            createOrder: (data: any, actions: any) => actions.order.create({
              purchase_units: [{
                description: showCheckout.plan.name,
                amount: { currency_code: config.currency, value: showCheckout.plan.price.replace(/[^0-9.]/g, '') }
              }]
            }),
            onApprove: async (data: any, actions: any) => {
              const order = await actions.order.capture();
              handlePaymentSuccess(order.id, 'paypal');
            }
          }).render(paypalContainerRef.current);
        }
      });
    }
  }, [showCheckout]);

  const handleStripeStart = async () => {
    if (!showCheckout) return;
    setIsPayLoading(true);
    try {
      const config = getPaymentConfig();
      await initiateStripeCheckout(showCheckout.plan, config);
      setTimeout(() => handlePaymentSuccess(`STRIPE-${Math.random().toString(36).substr(2, 6).toUpperCase()}`, 'stripe'), 1500);
    } catch (err: any) {
      alert(err.message);
      setIsPayLoading(false);
    }
  };

  const handlePaymentSuccess = (txId: string, method: string) => {
    if (!user || !showCheckout) return;
    const updatedUser = { ...user, plan: showCheckout.plan.plan, planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() };
    setUser(updatedUser);
    const transactions = JSON.parse(localStorage.getItem('platform_transactions') || '[]');
    localStorage.setItem('platform_transactions', JSON.stringify([{ id: txId, userId: user.id, userEmail: user.email, planName: showCheckout.plan.name, amount: showCheckout.plan.price, method, timestamp: new Date().toISOString() }, ...transactions]));
    setIsPayLoading(false);
    setShowCheckout(null);
    alert(`Success! Upgraded to ${showCheckout.plan.name}.`);
    navigate('dashboard');
  };

  const renderContent = () => {
    const isLoginMode = currentHash === '#login';
    
    // Admin Login Screen
    if (currentHash === '#admin-login') {
      return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4 py-20">
          <div className="max-w-md w-full bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl animate-slideUp text-center border border-white/10">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-xl">
               <i className="fas fa-user-shield text-4xl"></i>
            </div>
            <h2 className="text-3xl font-black text-white mb-2">Master Admin</h2>
            <p className="text-indigo-300/60 text-sm mb-10">Restricted access portal. Please enter system master key.</p>
            <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
               <div>
                  <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-4 mb-2 block">System Key</label>
                  <input 
                    type="password" 
                    className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-center tracking-[1em]" 
                    placeholder="••••••••"
                    value={adminPassInput}
                    onChange={e => setAdminPassInput(e.target.value)}
                    required
                  />
               </div>
               <button type="submit" className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all mt-4">
                  Verify & Enter
               </button>
            </form>
            <button onClick={() => navigate('login')} className="mt-8 text-indigo-300/40 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Return to Public Portal</button>
          </div>
        </div>
      );
    }

    if (currentHash === '#login' || currentHash === '#signup') {
      return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4 py-20">
          <div className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100 animate-slideUp text-center">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl">
               <i className="fas fa-certificate text-4xl"></i>
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">{isLoginMode ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="text-gray-500 text-sm mb-10">Sign in with your Google account to manage your certificates.</p>
            <div id="googleBtn" className="google-btn-container min-h-[50px] flex items-center justify-center"></div>
            <div className="mt-12 pt-8 border-t border-gray-50 flex flex-col items-center">
               <p className="text-xs text-gray-400 font-medium mb-4">Are you a platform admin?</p>
               <button onClick={() => navigate('admin-login')} className="text-indigo-600 text-xs font-black uppercase tracking-widest hover:underline">Admin Login <i className="fas fa-arrow-right ml-1"></i></button>
            </div>
          </div>
        </div>
      );
    }

    if (currentHash === '#pricing') {
        const config = getPaymentConfig();
        return (
            <div className="max-w-7xl mx-auto px-4 py-24">
                <div className="text-center mb-20"><h1 className="text-6xl font-black mb-4 tracking-tight text-gray-900">Simple Pricing</h1><p className="text-gray-500 text-xl font-medium">No hidden fees. Scale as you grow.</p></div>
                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan: any, i: number) => (
                        <div key={i} className={`p-10 rounded-[3.5rem] border-4 flex flex-col transition-all hover:scale-[1.02] ${plan.plan === user?.plan ? 'bg-indigo-50 border-indigo-600' : 'bg-white border-gray-100 shadow-xl'}`}>
                            {plan.plan !== UserPlan.FREE && <span className="text-indigo-600 font-black text-[10px] uppercase tracking-widest mb-4 inline-block bg-indigo-100/50 px-3 py-1 rounded-full w-fit">PRO TIER</span>}
                            <h3 className="text-2xl font-black mb-1 text-gray-900">{plan.name}</h3>
                            <div className="text-5xl font-black mb-8 text-gray-900 flex items-baseline">{plan.price}<span className="text-sm font-bold text-gray-400 ml-1">/{plan.plan === UserPlan.PAID_15 ? '15d' : 'mo'}</span></div>
                            <ul className="space-y-4 mb-12 flex-grow">{plan.features.map((f: string, j: number) => (<li key={j} className="flex items-center text-sm font-bold text-gray-600"><i className="fas fa-check-circle text-indigo-500 mr-3"></i> {f}</li>))}</ul>
                            {!user ? (<button onClick={() => navigate('login')} className="w-full bg-gray-900 text-white p-5 rounded-2xl font-black hover:bg-black transition-all">Sign in to Upgrade</button>) : plan.plan === user.plan ? (<button disabled className="w-full bg-indigo-100 text-indigo-700 p-5 rounded-2xl font-black flex items-center justify-center"><i className="fas fa-check-circle mr-2"></i> Active</button>) : (<div className="space-y-3">
                                {config.stripe.enabled && (<button onClick={() => setShowCheckout({plan, method: 'stripe'})} className="w-full bg-[#635BFF] text-white p-5 rounded-2xl font-black flex items-center justify-center hover:opacity-90 shadow-lg shadow-indigo-100"><i className="fab fa-stripe text-3xl mr-2"></i> Pay with Stripe</button>)}
                                {config.paypal.enabled && (<button onClick={() => setShowCheckout({plan, method: 'paypal'})} className="w-full bg-[#FFC439] text-[#2C2E2F] p-5 rounded-2xl font-black flex items-center justify-center hover:opacity-90 shadow-lg shadow-yellow-100"><i className="fab fa-paypal text-2xl mr-2 text-[#003087]"></i> PayPal</button>)}
                            </div>)}
                        </div>
                    ))}
                </div>
                {showCheckout && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-xl">
                        <div className="bg-white w-full max-w-md rounded-[3.5rem] overflow-hidden shadow-2xl animate-slideUp">
                            <div className={`p-10 text-center text-white ${showCheckout.method === 'stripe' ? 'bg-[#635BFF]' : 'bg-[#0070BA]'}`}><h4 className="text-2xl font-black mb-1">Secure Checkout</h4><p className="opacity-90 font-bold text-sm tracking-wide">Upgrading to {showCheckout.plan.name}</p></div>
                            <div className="p-10 space-y-8"><div className="flex justify-between items-center bg-gray-50 p-8 rounded-3xl border border-gray-100"><span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Total to Pay</span><span className="text-4xl font-black text-gray-900">{showCheckout.plan.price}</span></div>
                                {showCheckout.method === 'stripe' ? (<div className="space-y-6"><button onClick={handleStripeStart} disabled={isPayLoading} className="w-full bg-[#635BFF] text-white p-6 rounded-2xl font-black text-lg hover:scale-[1.02] transition-all flex items-center justify-center shadow-2xl shadow-indigo-100">{isPayLoading ? <i className="fas fa-circle-notch fa-spin mr-3"></i> : <i className="fab fa-stripe mr-3"></i>}{isPayLoading ? 'Connecting...' : 'Continue to Stripe'}</button></div>) : (<div className="space-y-6"><div ref={paypalContainerRef} className="min-h-[150px] flex items-center justify-center bg-gray-50 rounded-3xl p-6"><div className="text-center"><i className="fas fa-spinner fa-spin text-gray-200 text-3xl mb-4"></i><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Connecting PayPal API</p></div></div></div>)}
                                <button onClick={() => setShowCheckout(null)} className="w-full text-xs font-black text-gray-300 uppercase tracking-widest hover:text-gray-500 transition-colors">Cancel Transaction</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    switch (currentHash) {
      case '#dashboard': return user ? <Dashboard user={user} onUpdateUser={setUser} onNavigate={navigate} /> : <LandingPage onNavigate={navigate} />;
      case '#admin': return (user?.email.toLowerCase() === 'admin@redac.in' || isAdminAuthorized) ? <AdminPanel /> : <LandingPage onNavigate={navigate} />;
      default: return <LandingPage onNavigate={navigate} plans={plans} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar user={user} onLogout={() => { setUser(null); setIsAdminAuthorized(false); sessionStorage.removeItem('admin_session'); localStorage.removeItem('certiflow_user'); navigate('home'); }} onNavigate={navigate} />
      <main className="flex-grow">{renderContent()}</main>
    </div>
  );
};

export default App;
