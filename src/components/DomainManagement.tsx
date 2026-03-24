import { useState, useEffect } from 'react';
import { Domain } from '../types';
import { Globe, Plus, Trash2, CheckCircle, XCircle, ArrowLeft, ShieldCheck, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

// Mock Data Storage Helper
const storage = {
  get: (key: string) => JSON.parse(localStorage.getItem(key) || '[]'),
  set: (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data)),
};

export default function DomainManagement() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDomains = () => {
      const mockUser = localStorage.getItem('mock_user');
      if (!mockUser) {
        navigate('/login');
        return;
      }
      const user = JSON.parse(mockUser);
      const allDomains = storage.get('domains');
      setDomains(allDomains.filter((d: any) => d.userId === user.uid));
      setLoading(false);
    };
    fetchDomains();
  }, [navigate]);

  const addDomain = (e: React.FormEvent) => {
    e.preventDefault();
    const mockUser = localStorage.getItem('mock_user');
    if (!mockUser || !newDomain) return;
    const user = JSON.parse(mockUser);
    
    const domainData: Domain = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.uid,
      name: newDomain.replace(/^https?:\/\//, '').split('/')[0],
      verified: false
    };

    const allDomains = storage.get('domains');
    storage.set('domains', [...allDomains, domainData]);
    setDomains([...domains, domainData]);
    setNewDomain('');
  };

  const verifyDomain = (id: string) => {
    const allDomains = storage.get('domains');
    const updated = allDomains.map((d: any) => d.id === id ? { ...d, verified: true } : d);
    storage.set('domains', updated);
    setDomains(domains.map(d => d.id === id ? { ...d, verified: true } : d));
  };

  const deleteDomain = (id: string) => {
    const allDomains = storage.get('domains');
    const updated = allDomains.filter((d: any) => d.id !== id);
    storage.set('domains', updated);
    setDomains(domains.filter(d => d.id !== id));
  };

  const filteredDomains = domains.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 lg:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/')} 
              className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Domain Management</h1>
              <p className="text-slate-500 font-medium">Manage authorized domains for your interactive assets.</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Secure Embedding Active</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left: Add Domain Form */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-xl shadow-blue-100/50 sticky top-12">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" /> Add New Domain
              </h2>
              <form onSubmit={addDomain} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Domain Name</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input 
                      type="text" 
                      required
                      value={newDomain}
                      onChange={e => setNewDomain(e.target.value)}
                      placeholder="example.com"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-[0.98]">
                  Register Domain
                </button>
              </form>
              <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Registering a domain allows you to embed ClickSIP interactive images on that specific website. Only verified domains can host your assets.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Domains List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search registered domains..."
                className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
              />
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredDomains.map(domain => (
                  <motion.div 
                    key={domain.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white border border-slate-200 p-6 rounded-3xl flex justify-between items-center group hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300"
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${domain.verified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        <Globe className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-black text-lg text-slate-900">{domain.name}</div>
                        <div className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 mt-1">
                          {domain.verified ? (
                            <span className="text-emerald-500 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Verified</span>
                          ) : (
                            <span className="text-amber-500 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Pending Verification</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {!domain.verified && (
                        <button 
                          onClick={() => verifyDomain(domain.id)}
                          className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98]"
                        >
                          Verify
                        </button>
                      )}
                      <button 
                        onClick={() => deleteDomain(domain.id)}
                        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredDomains.length === 0 && (
                <div className="text-center py-20 bg-white/50 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-8 h-8 text-slate-200" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">No domains found</h3>
                  <p className="text-slate-500 max-w-xs mx-auto text-sm font-medium">Try searching for something else or add a new domain to get started.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
