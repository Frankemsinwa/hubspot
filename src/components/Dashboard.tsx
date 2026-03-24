import { useState, useEffect, useRef } from 'react';
import { Campaign, Domain } from '../types';
import { Plus, Globe, Image as ImageIcon, BarChart3, Trash2, ExternalLink, Settings, LogOut, X, Upload, Link as LinkIcon } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

// Mock Data Storage Helper
const storage = {
  get: (key: string) => JSON.parse(localStorage.getItem(key) || '[]'),
  set: (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data)),
};

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', imageUrl: '' });
  const [uploadMethod, setUploadMethod] = useState<'url' | 'upload'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = () => {
      const mockUser = localStorage.getItem('mock_user');
      if (!mockUser) {
        navigate('/login');
        return;
      }
      const user = JSON.parse(mockUser);
      
      const allCampaigns = storage.get('campaigns');
      const allDomains = storage.get('domains');
      
      setCampaigns(allCampaigns.filter((c: any) => c.userId === user.uid));
      setDomains(allDomains.filter((d: any) => d.userId === user.uid));
      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCampaign({ ...newCampaign, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    const mockUser = localStorage.getItem('mock_user');
    if (!mockUser || !newCampaign.imageUrl) return;
    const user = JSON.parse(mockUser);

    const campaign: Campaign = {
      id: Math.random().toString(36).substr(2, 9),
      name: newCampaign.name,
      imageUrl: newCampaign.imageUrl,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      hotspots: []
    };

    const allCampaigns = storage.get('campaigns');
    storage.set('campaigns', [...allCampaigns, campaign]);
    
    setIsModalOpen(false);
    setNewCampaign({ name: '', imageUrl: '' });
    navigate(`/campaigns/${campaign.id}/edit`);
  };

  const deleteCampaign = (id: string) => {
    const allCampaigns = storage.get('campaigns');
    const updated = allCampaigns.filter((c: any) => c.id !== id);
    storage.set('campaigns', updated);
    setCampaigns(campaigns.filter(c => c.id !== id));
  };

  const signOut = () => {
    localStorage.removeItem('mock_user');
    window.location.reload();
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">ClickSIP</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/domains" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                Domains
              </Link>
              <button 
                onClick={signOut}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> New Campaign
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard title="Active Domains" value={domains.length} icon={Globe} color="blue" />
          <StatCard title="Total Campaigns" value={campaigns.length} icon={ImageIcon} color="indigo" />
          <StatCard title="Total Engagement" value="2.4k" icon={BarChart3} color="emerald" />
        </div>

        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Your Campaigns</h2>
            <p className="text-slate-500 mt-1">Manage and track your interactive content.</p>
          </div>
        </div>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {campaigns.map((campaign) => (
            <motion.div 
              key={campaign.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300"
            >
              <div className="aspect-video relative overflow-hidden bg-slate-100">
                <img 
                  src={campaign.imageUrl} 
                  alt={campaign.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <Link 
                    to={`/campaigns/${campaign.id}/edit`}
                    className="p-3 bg-white text-slate-900 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-lg"
                    title="Edit Campaign"
                  >
                    <Settings className="w-5 h-5" />
                  </Link>
                  <Link 
                    to={`/campaigns/${campaign.id}/analytics`}
                    className="p-3 bg-white text-slate-900 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-lg"
                    title="View Analytics"
                  >
                    <BarChart3 className="w-5 h-5" />
                  </Link>
                  <a 
                    href={`/embed/${campaign.id}`}
                    target="_blank"
                    className="p-3 bg-white text-slate-900 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-lg"
                    title="Preview"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">{campaign.name}</h3>
                    <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-medium">ID: {campaign.id}</p>
                  </div>
                  <button 
                    onClick={() => deleteCampaign(campaign.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          
          {campaigns.length === 0 && (
            <div className="col-span-full py-24 text-center bg-white border-2 border-dashed border-slate-200 rounded-3xl">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No campaigns yet</h3>
              <p className="text-slate-500 mb-6 max-w-xs mx-auto">Start by creating your first interactive shoppable image campaign.</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="text-blue-600 font-bold hover:text-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create your first campaign
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Create Campaign Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">New Campaign</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
                <form onSubmit={handleCreateCampaign} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Campaign Name</label>
                    <input 
                      type="text" 
                      required
                      value={newCampaign.name}
                      onChange={e => setNewCampaign({...newCampaign, name: e.target.value})}
                      placeholder="Summer Collection 2024"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-4">Campaign Image</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                      <button
                        type="button"
                        onClick={() => setUploadMethod('upload')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${uploadMethod === 'upload' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        <Upload className="w-4 h-4" /> Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadMethod('url')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${uploadMethod === 'url' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        <LinkIcon className="w-4 h-4" /> URL
                      </button>
                    </div>

                    {uploadMethod === 'upload' ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="relative aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all overflow-hidden group"
                      >
                        {newCampaign.imageUrl ? (
                          <>
                            <img src={newCampaign.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-sm font-bold">Change Image</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-slate-300 mb-2" />
                            <span className="text-sm font-bold text-slate-400">Click to upload image</span>
                            <span className="text-[10px] text-slate-300 mt-1 uppercase tracking-widest">PNG, JPG up to 5MB</span>
                          </>
                        )}
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <input 
                        type="url" 
                        required={uploadMethod === 'url'}
                        value={newCampaign.imageUrl}
                        onChange={e => setNewCampaign({...newCampaign, imageUrl: e.target.value})}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    )}
                  </div>

                  <button 
                    type="submit"
                    disabled={!newCampaign.name || !newCampaign.imageUrl}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                  >
                    Create Campaign
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: any, icon: any, color: string }) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 mb-6">
        <div className={`p-3 rounded-2xl ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-sm font-bold uppercase tracking-widest text-slate-400">{title}</span>
      </div>
      <div className="text-4xl font-black text-slate-900">{value}</div>
    </div>
  );
}
