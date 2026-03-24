import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Campaign, Hotspot, AnalyticsEvent, Lead } from '../types';
import { ShoppingCart, Play, Mail, X, ExternalLink, Phone, Info, CheckCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Mock Data Storage Helper
const storage = {
  get: (key: string) => JSON.parse(localStorage.getItem(key) || '[]'),
  set: (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data)),
};

export default function HotspotRenderer() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [loading, setLoading] = useState(true);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!id) return;
    const fetchData = () => {
      const allCampaigns = storage.get('campaigns');
      const found = allCampaigns.find((c: any) => c.id === id);
      if (found) {
        setCampaign(found);
        trackEvent('view');
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const trackEvent = (type: 'view' | 'click' | 'cta') => {
    if (!id) return;
    const event: AnalyticsEvent = {
      id: Math.random().toString(36).substr(2, 9),
      campaignId: id,
      eventType: type,
      timestamp: new Date().toISOString(),
      metadata: { hotspotId: activeHotspot?.id }
    };
    const allEvents = storage.get('analytics_events');
    storage.set('analytics_events', [...allEvents, event]);
  };

  const handleHotspotClick = (hotspot: Hotspot) => {
    setActiveHotspot(hotspot);
    trackEvent('click');
  };

  const handleLeadSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    const formData = new FormData(e.currentTarget);
    const lead: Lead = {
      id: Math.random().toString(36).substr(2, 9),
      campaignId: id,
      email: formData.get('email') as string,
      name: formData.get('name') as string,
      timestamp: new Date().toISOString()
    };
    const allLeads = storage.get('leads');
    storage.set('leads', [...allLeads, lead]);
    setLeadCaptured(true);
    trackEvent('cta');
    setTimeout(() => {
      setActiveHotspot(null);
      setLeadCaptured(false);
    }, 2000);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    // Dragging logic
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.min(Math.max(prev * delta, 1), 5));
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!campaign) return <div className="p-8 text-center text-slate-500 font-bold">Campaign not found.</div>;

  const getFilterString = (filters: any) => {
    if (!filters) return '';
    return `
      brightness(${1 + (filters.brightness || 0)}) 
      contrast(${100 + (filters.contrast || 0)}%) 
      blur(${filters.blur || 0}px) 
      hue-rotate(${filters.hue || 0}deg)
      saturate(${1 + (filters.saturation || 0)})
      opacity(${filters.opacity ?? 1})
      ${filters.grayscale ? 'grayscale(100%)' : ''} 
      ${filters.sepia ? 'sepia(100%)' : ''} 
      ${filters.invert ? 'invert(100%)' : ''}
    `.replace(/\s+/g, ' ').trim();
  };

  const globalFilterStyle = {
    filter: getFilterString(campaign.filters)
  };

  return (
    <div 
      className="relative w-full h-screen bg-slate-50 overflow-hidden flex items-center justify-center font-sans cursor-default select-none" 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Zoom Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-white/50">
        <button 
          onClick={() => setZoom(prev => Math.max(prev - 0.2, 1))}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
        >
          <X className="w-4 h-4 rotate-45" />
        </button>
        <span className="text-[10px] font-black text-slate-400 w-12 text-center uppercase tracking-widest">
          {Math.round(zoom * 100)}%
        </span>
        <button 
          onClick={() => setZoom(prev => Math.min(prev + 0.2, 5))}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
        >
          <PlusIcon type="default" />
        </button>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <button 
          onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}
          className="px-3 py-2 hover:bg-slate-100 rounded-xl transition-colors text-[10px] font-black text-slate-600 uppercase tracking-widest"
        >
          Reset
        </button>
      </div>

      <div 
        className="relative inline-block shadow-2xl rounded-3xl overflow-hidden transition-transform duration-75 ease-out"
        style={{
          transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
          cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
        }}
      >
        <img 
          src={campaign.imageUrl} 
          alt={campaign.name} 
          className="max-w-full max-h-screen object-contain"
          style={globalFilterStyle}
          referrerPolicy="no-referrer"
        />

        {/* Radius Effects Layer */}
        {campaign.hotspots?.filter(h => h.radius && h.radius > 0).map(h => {
          const hotspotFilter = getFilterString(h.filters);
          if (!hotspotFilter) return null;
          
          return (
            <div 
              key={`radius-${h.id}`}
              className="absolute inset-0 pointer-events-none"
              style={{
                clipPath: `circle(${h.radius}px at ${h.x}px ${h.y}px)`,
                WebkitClipPath: `circle(${h.radius}px at ${h.x}px ${h.y}px)`
              }}
            >
              <img 
                src={campaign.imageUrl} 
                alt="" 
                className="w-full h-full object-contain"
                style={{ filter: hotspotFilter }}
                referrerPolicy="no-referrer"
              />
            </div>
          );
        })}

        {campaign.filters?.vignette && campaign.filters.vignette > 0 && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle, transparent ${100 - (campaign.filters.vignette * 100)}%, rgba(0,0,0,${campaign.filters.vignette}) 100%)`
            }}
          />
        )}

        {/* Hotspots Layer */}
        <div className="absolute inset-0">
          {campaign.hotspots?.map((h) => {
            const isHoverTrigger = h.triggerType === 'hover';

            return (
              <button
                key={h.id}
                onClick={() => !isHoverTrigger && handleHotspotClick(h)}
                onMouseEnter={() => isHoverTrigger && handleHotspotClick(h)}
                className="absolute w-10 h-10 -ml-5 -mt-5 flex items-center justify-center group transition-transform duration-75 ease-out"
                style={{ 
                  left: `${h.x}px`, 
                  top: `${h.y}px`,
                }}
              >
                {h.pulseAnimation !== false && (
                  <div 
                    className="absolute inset-0 rounded-full animate-ping opacity-20 group-hover:opacity-40 transition-opacity"
                    style={{ backgroundColor: h.backgroundColor || '#2563eb' }}
                  ></div>
                )}
                <div 
                  className="relative w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ 
                    backgroundColor: h.backgroundColor || '#2563eb',
                    color: h.iconColor || '#ffffff'
                  }}
                >
                  <PlusIcon type={h.type} />
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none translate-y-2 group-hover:translate-y-0">
                  <div className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
                    {h.title}
                  </div>
                  <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mt-1"></div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Overlay Modal */}
        <AnimatePresence>
          {activeHotspot && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-50"
              onClick={() => setActiveHotspot(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div 
                      className="p-3 rounded-2xl"
                      style={{ 
                        backgroundColor: `${activeHotspot.backgroundColor || '#2563eb'}15`,
                        color: activeHotspot.backgroundColor || '#2563eb'
                      }}
                    >
                      <ActionIcon type={activeHotspot.type} />
                    </div>
                    <button onClick={() => setActiveHotspot(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  <div className="flex justify-between items-baseline mb-2">
                    <h3 className="text-2xl font-black text-slate-900">{activeHotspot.title}</h3>
                    {activeHotspot.price && (
                      <span className="text-lg font-black text-blue-600">{activeHotspot.price}</span>
                    )}
                  </div>
                  
                  <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                    {activeHotspot.description || (activeHotspot.type === 'signup_form' 
                      ? 'Join our exclusive mailing list to get early access to new collections and special offers.' 
                      : 'Experience this product in detail. Click the button below to learn more or purchase.')}
                  </p>

                  {activeHotspot.type === 'signup_form' ? (
                    leadCaptured ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-emerald-50 text-emerald-600 p-6 rounded-2xl flex flex-col items-center text-center gap-3"
                      >
                        <CheckCircle className="w-10 h-10" />
                        <div className="font-black uppercase tracking-widest text-xs">Success!</div>
                        <p className="font-bold">You're on the list.</p>
                      </motion.div>
                    ) : (
                      <form onSubmit={handleLeadSubmit} className="space-y-4">
                        <input 
                          type="text" 
                          name="name" 
                          required 
                          placeholder="Your Name"
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                        />
                        <input 
                          type="email" 
                          name="email" 
                          required 
                          placeholder="Email Address"
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                        />
                        <button 
                          type="submit"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                          {activeHotspot.ctaText || 'Subscribe Now'} <ArrowRight className="w-4 h-4" />
                        </button>
                      </form>
                    )
                  ) : (
                    <a 
                      href={activeHotspot.action.value} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={() => trackEvent('cta')}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      {activeHotspot.ctaText || (activeHotspot.type === 'product' ? 'Shop Now' : 'Learn More')} <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PlusIcon({ type }: { type: string }) {
  switch (type) {
    case 'video': return <Play className="w-3 h-3 fill-current" />;
    case 'signup_form': return <Mail className="w-3 h-3" />;
    case 'product': return <ShoppingCart className="w-3 h-3" />;
    default: return <Info className="w-3 h-3" />;
  }
}

function ActionIcon({ type }: { type: string }) {
  switch (type) {
    case 'product': return <ShoppingCart className="w-6 h-6" />;
    case 'video': return <Play className="w-6 h-6 fill-current" />;
    case 'signup_form': return <Mail className="w-6 h-6" />;
    default: return <Info className="w-6 h-6" />;
  }
}
