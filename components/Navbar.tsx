
import React from 'react';
import { User, UserPlan } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onNavigate }) => {
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center cursor-pointer group" onClick={() => onNavigate('home')}>
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mr-3 shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
              <i className="fas fa-file-signature text-2xl"></i>
            </div>
            <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tighter">
              CraftedDocs
            </span>
          </div>

          <div className="hidden md:flex space-x-8 items-center">
            {user ? (
              <>
                <button onClick={() => onNavigate('dashboard')} className="text-gray-600 hover:text-indigo-600 font-bold text-sm">Dashboard</button>
                {user.email.toLowerCase() === 'admin@redac.in' && (
                  <button onClick={() => onNavigate('admin')} className="bg-indigo-50 text-indigo-700 px-5 py-2.5 rounded-2xl text-xs font-black border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center shadow-sm">
                    <i className="fas fa-user-shield mr-2"></i> Admin Panel
                  </button>
                )}
                <div className="h-8 w-px bg-gray-100"></div>
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-gray-900">{user.name || user.email}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest shadow-sm ${user.plan !== UserPlan.FREE ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-500'}`}>
                      {user.plan} Tier
                    </span>
                  </div>
                  {user.picture ? (
                    <img src={user.picture} className="w-10 h-10 rounded-2xl border-2 border-white shadow-md" alt="Profile" />
                  ) : (
                    <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black">
                      {user.email[0].toUpperCase()}
                    </div>
                  )}
                  <button 
                    onClick={onLogout}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2"
                    title="Logout"
                  >
                    <i className="fas fa-sign-out-alt text-lg"></i>
                  </button>
                </div>
              </>
            ) : (
              <>
                <button onClick={() => onNavigate('home')} className="text-gray-500 hover:text-indigo-600 font-bold text-sm">Features</button>
                <button onClick={() => onNavigate('pricing')} className="text-gray-500 hover:text-indigo-600 font-bold text-sm">Pricing</button>
                <button 
                  onClick={() => onNavigate('login')}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 text-sm hover:-translate-y-0.5"
                >
                  Log In
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
