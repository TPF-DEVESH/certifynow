
import React from 'react';
import { PRICING_PLANS as DEFAULT_PLANS } from '../constants';

interface LandingPageProps {
  onNavigate: (page: string) => void;
  plans?: any[];
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, plans = DEFAULT_PLANS }) => {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8">
            Bulk <span className="text-indigo-600">Certificate</span> Generator & Email Automation
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            Automate your certification workflow in minutes. Upload your template, add your recipient list, and let CertiFlow handle the rest. No more manual editing.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={() => onNavigate('signup')}
              className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-xl transform hover:-translate-y-1 transition-all"
            >
              Start Generating for Free
            </button>
            <button 
              onClick={() => onNavigate('pricing')}
              className="px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-sm"
            >
              View Pricing
            </button>
          </div>
          
          <div className="mt-20 relative">
             <img 
               src="https://picsum.photos/seed/certiflow/1200/600" 
               alt="Dashboard Preview" 
               className="rounded-2xl shadow-2xl border border-gray-100 mx-auto"
             />
             <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg border border-gray-100 hidden lg:block">
               <div className="flex items-center space-x-3">
                 <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                   <i className="fas fa-check-circle text-2xl"></i>
                 </div>
                 <div>
                   <p className="text-sm font-bold text-gray-900">500+ Certificates</p>
                   <p className="text-xs text-gray-500">Generated in 2 minutes</p>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose CertiFlow?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Powerful features designed to save hours of manual work for event organizers and educators in India.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: 'fa-wand-magic-sparkles', title: 'Dynamic Generation', desc: 'Automatically place names on your PDF or Image templates with pixel-perfect precision.' },
              { icon: 'fa-envelope-open-text', title: 'Mass Emailing', desc: 'Send personalized emails to all recipients with their unique certificates attached.' },
              { icon: 'fa-server', title: 'Custom SMTP', desc: 'Premium users can use their own SMTP servers to ensure maximum deliverability and branding.' }
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                  <i className={`fas ${f.icon} text-2xl`}></i>
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <i className="fas fa-certificate text-indigo-400 mr-2 text-2xl"></i>
              <span className="text-2xl font-bold">CertiFlow</span>
            </div>
            <div className="flex space-x-8 text-gray-400">
              <button onClick={() => onNavigate('admin-login')} className="hover:text-white transition-colors text-sm font-bold opacity-50 hover:opacity-100 uppercase tracking-widest">Admin Access</button>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500">
            &copy; 2024 CertiFlow (Redac.in). Made for bulk certificate generation in India.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
