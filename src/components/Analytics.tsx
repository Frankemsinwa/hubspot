import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnalyticsEvent, Lead, Campaign } from '../types';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ArrowLeft, Users, MousePointer2, TrendingUp, Download, Calendar, Mail, ExternalLink, Filter } from 'lucide-react';
import { motion } from 'motion/react';

// Mock Data Storage Helper
const storage = {
  get: (key: string) => JSON.parse(localStorage.getItem(key) || '[]'),
};

export default function Analytics() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = () => {
      const allCampaigns = storage.get('campaigns');
      const allEvents = storage.get('analytics_events');
      const allLeads = storage.get('leads');

      const foundCampaign = allCampaigns.find((c: any) => c.id === id);
      if (!foundCampaign) {
        navigate('/');
        return;
      }

      setCampaign(foundCampaign);
      setEvents(allEvents.filter((e: any) => e.campaignId === id));
      setLeads(allLeads.filter((l: any) => l.campaignId === id));
      setLoading(false);
    };
    fetchData();
  }, [id, navigate]);

  const views = events.filter(e => e.eventType === 'view').length;
  const clicks = events.filter(e => e.eventType === 'click').length;
  const leadCount = leads.length;
  const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : '0';

  // Group events by day for chart
  const dailyData = events.reduce((acc: any[], event) => {
    const date = new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing[event.eventType] = (existing[event.eventType] || 0) + 1;
    } else {
      acc.push({ date, [event.eventType]: 1 });
    }
    return acc;
  }, []).slice(-7);

  const exportLeads = () => {
    const csv = [
      ['Name', 'Email', 'Timestamp'],
      ...leads.map(l => [l.name, l.email, l.timestamp])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `leads_${id}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/')} 
              className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">{campaign?.name} Analytics</h1>
              <p className="text-slate-500 font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Last 7 Days Performance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
              <Filter className="w-4 h-4" /> Filter
            </button>
            <button 
              onClick={exportLeads}
              className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-200 active:scale-[0.98]"
            >
              <Download className="w-4 h-4" /> Export Leads
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Views" value={views} icon={Users} color="blue" trend="+12%" />
          <StatCard title="Clicks" value={clicks} icon={MousePointer2} color="indigo" trend="+5%" />
          <StatCard title="CTR" value={`${ctr}%`} icon={TrendingUp} color="emerald" trend="+2%" />
          <StatCard title="Leads" value={leadCount} icon={Mail} color="rose" trend="+8%" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-xl shadow-blue-100/50">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" /> Engagement Trends
              </h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div> Views
                </div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div> Clicks
                </div>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="colorView" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorClick" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="view" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorView)" />
                  <Area type="monotone" dataKey="click" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorClick)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Leads Section */}
          <div className="lg:col-span-1 bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-xl shadow-blue-100/50">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-900">Recent Leads</h3>
              <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                <ExternalLink className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              {leads.slice(0, 6).map(lead => (
                <motion.div 
                  key={lead.id} 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                >
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-blue-600 shadow-sm">
                    {lead.name?.[0] || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 truncate">{lead.name || 'Anonymous'}</div>
                    <div className="text-xs font-medium text-slate-400 truncate">{lead.email}</div>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                    {new Date(lead.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </motion.div>
              ))}
              {leads.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-bold text-sm">No leads captured yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend }: { title: string, value: any, icon: any, color: string, trend: string }) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-6">
        <div className={`p-4 rounded-2xl ${colors[color]} group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg">
          {trend}
        </div>
      </div>
      <div className="text-sm font-black uppercase tracking-[0.2em] text-slate-300 mb-2">{title}</div>
      <div className="text-4xl font-black text-slate-900">{value}</div>
    </div>
  );
}
