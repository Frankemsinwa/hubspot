import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stage, Layer, Image as KonvaImage, Circle, Rect, Transformer } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';
import { Campaign, Hotspot, HotspotType } from '../types';
import { Save, ArrowLeft, Plus, Settings, Trash2, MousePointer2, Type, Play, Mail, ShoppingCart, ChevronRight, Layout, Eye, Sliders, Sun, Contrast, Droplets, Palette, Sparkles, Layers, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

// Mock Data Storage Helper
const storage = {
  get: (key: string) => JSON.parse(localStorage.getItem(key) || '[]'),
  set: (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data)),
};

export default function CampaignEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [filters, setFilters] = useState({
    brightness: 0,
    contrast: 0,
    blur: 0,
    grayscale: false,
    sepia: false,
    invert: false,
    hue: 0,
    saturation: 0,
    opacity: 1,
    noise: 0,
    pixelSize: 1,
    vignette: 0
  });
  const [activeTab, setActiveTab] = useState<'properties' | 'filters'>('properties');
  const [filterScope, setFilterScope] = useState<'global' | 'hotspot'>('global');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scale, setScale] = useState(1);
  const [image] = useImage(campaign?.imageUrl || '', 'anonymous');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const stageRef = useRef<any>(null);
  const imageRef = useRef<any>(null);

  useEffect(() => {
    if (!id) return;
    const fetchData = () => {
      const allCampaigns = storage.get('campaigns');
      const found = allCampaigns.find((c: any) => c.id === id);
      if (!found) {
        navigate('/');
        return;
      }
      setCampaign(found);
      setHotspots(found.hotspots || []);
      if (found.filters) {
        setFilters({ ...filters, ...found.filters });
      }
      setLoading(false);
    };
    fetchData();
  }, [id, navigate]);

  useEffect(() => {
    if (imageRef.current) {
      imageRef.current.cache();
    }
  }, [image, filters]);

  const konvaFilters = useMemo(() => {
    const f = [];
    if (filters.brightness !== 0) f.push(Konva.Filters.Brighten);
    if (filters.contrast !== 0) f.push(Konva.Filters.Contrast);
    if (filters.blur !== 0) f.push(Konva.Filters.Blur);
    if (filters.grayscale) f.push(Konva.Filters.Grayscale);
    if (filters.sepia) f.push(Konva.Filters.Sepia);
    if (filters.invert) f.push(Konva.Filters.Invert);
    if (filters.hue !== 0) f.push(Konva.Filters.HSL);
    if (filters.saturation !== 0) f.push(Konva.Filters.HSL);
    if (filters.noise > 0) f.push(Konva.Filters.Noise);
    if (filters.pixelSize > 1) f.push(Konva.Filters.Pixelate);
    return f;
  }, [filters]);

  const handleStageClick = (e: any) => {
    if (e.target === e.target.getStage()) {
      setSelectedId(null);
      return;
    }
  };

  const addHotspot = () => {
    const newHotspot: Hotspot = {
      id: Math.random().toString(36).substr(2, 9),
      x: 50,
      y: 50,
      type: 'product',
      title: 'New Hotspot',
      action: { type: 'url', value: '' }
    };
    setHotspots([...hotspots, newHotspot]);
    setSelectedId(newHotspot.id);
    setActiveTab('properties');
  };

  const updateHotspot = (id: string, updates: Partial<Hotspot>) => {
    setHotspots(hotspots.map(h => h.id === id ? { ...h, ...updates } : h));
  };

  const deleteHotspot = (id: string) => {
    setHotspots(hotspots.filter(h => h.id !== id));
    setSelectedId(null);
  };

  const saveCampaign = async () => {
    if (!campaign) return;
    setSaving(true);
    const allCampaigns = storage.get('campaigns');
    const updated = allCampaigns.map((c: any) => c.id === id ? { ...c, hotspots, filters } : c);
    storage.set('campaigns', updated);
    
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setSaving(false);
        resolve();
      }, 500);
    });
  };

  const handleMagicScan = async () => {
    if (!campaign?.imageUrl) return;
    setIsScanning(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { text: `Analyze this image: ${campaign.imageUrl}. Identify 3-5 key products or interesting objects. For each, provide a title and approximate X, Y coordinates (0-100 scale). Return as JSON array: [{title, x, y}]` }
        ],
        config: { responseMimeType: "application/json" }
      });
      
      const results = JSON.parse(response.text || '[]');
      const newHotspots: Hotspot[] = results.map((r: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        x: r.x,
        y: r.y,
        type: (['product', 'text', 'video', 'signup_form'].includes(r.type) ? r.type : 'product') as HotspotType,
        title: r.title,
        action: { type: 'url', value: '' },
        filters: {}
      }));
      
      setHotspots([...hotspots, ...newHotspots]);
      alert(`AI found ${newHotspots.length} objects!`);
    } catch (error) {
      console.error("AI Scan failed:", error);
      // Fallback: Add some random ones if AI fails (e.g. due to CORS/URL)
      const fallback: Hotspot[] = [
        { id: 'f1', x: 30, y: 40, type: 'product', title: 'Detected Item A', action: { type: 'url', value: '' }, filters: {} },
        { id: 'f2', x: 70, y: 60, type: 'product', title: 'Detected Item B', action: { type: 'url', value: '' }, filters: {} }
      ];
      setHotspots([...hotspots, ...fallback]);
    } finally {
      setIsScanning(false);
    }
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    setScale(newScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    stage.position(newPos);
  };

  const handleSaveAndPreview = async () => {
    await saveCampaign();
    window.open(`/embed/${id}`, '_blank');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  const selectedHotspot = hotspots.find(h => h.id === selectedId);

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans">
      {/* Header */}
      <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-20 shadow-sm">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/')} 
            className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900">{campaign?.name}</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Editor Mode</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleSaveAndPreview}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <Eye className="w-4 h-4" /> Preview
          </button>
          <button 
            onClick={() => saveCampaign().then(() => alert('Campaign saved successfully!'))}
            disabled={saving}
            className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200 active:scale-[0.98] disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Tools */}
        <aside className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-8 gap-6 z-10">
          <ToolButton icon={MousePointer2} active label="Select" />
          <div className="w-10 h-px bg-slate-100"></div>
          <ToolButton icon={Plus} onClick={addHotspot} label="Add" />
          <ToolButton 
            icon={Sparkles} 
            onClick={handleMagicScan} 
            label={isScanning ? "Scanning..." : "AI Magic Scan"} 
            className={isScanning ? "animate-pulse text-blue-600" : ""}
          />
          <ToolButton icon={Layout} label="Templates" />
          <ToolButton icon={Settings} label="Settings" />
        </aside>

        {/* Main Canvas Area */}
        <main 
          className="flex-1 relative bg-slate-100 overflow-hidden flex items-center justify-center p-24 mt-8"
        >
          {/* Zoom Controls */}
          <div className="absolute top-8 right-8 flex flex-col gap-2 z-20">
            <button 
              onClick={() => setScale(s => s * 1.2)}
              className="p-3 bg-white rounded-xl shadow-lg hover:bg-slate-50 text-slate-600"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setScale(s => s / 1.2)}
              className="p-3 bg-white rounded-xl shadow-lg hover:bg-slate-50 text-slate-600"
            >
              <Trash2 className="w-5 h-5 rotate-45" />
            </button>
            <button 
              onClick={() => {
                setScale(1);
                if (stageRef.current) stageRef.current.position({ x: 0, y: 0 });
              }}
              className="p-3 bg-white rounded-xl shadow-lg hover:bg-slate-50 text-slate-600 text-[10px] font-black"
            >
              100%
            </button>
          </div>

          <div 
            className="relative shadow-[0_32px_64_px_-12px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden bg-white"
          >
            {image && (
              <div className="relative">
                <Stage 
                  width={image.width} 
                  height={image.height}
                  onClick={handleStageClick}
                  onWheel={handleWheel}
                  scaleX={scale}
                  scaleY={scale}
                  ref={stageRef}
                  draggable
                >
                  <Layer>
                    <KonvaImage 
                      image={image} 
                      ref={imageRef}
                      filters={konvaFilters}
                      brightness={filters.brightness}
                      contrast={filters.contrast}
                      blurRadius={filters.blur}
                      hue={filters.hue}
                      saturation={filters.saturation}
                      opacity={filters.opacity}
                      noise={filters.noise}
                      pixelSize={filters.pixelSize}
                    />
                    {hotspots.map((h) => {
                      return (
                        <HotspotMarker 
                          key={h.id} 
                          hotspot={h} 
                          isSelected={h.id === selectedId}
                          onSelect={() => {
                            setSelectedId(h.id);
                            if (filterScope === 'hotspot') setActiveTab('filters');
                          }}
                          onChange={(newAttrs) => updateHotspot(h.id, newAttrs)}
                          image={image}
                        />
                      );
                    })}
                  </Layer>
                </Stage>
                {filters.vignette > 0 && (
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle, transparent ${100 - (filters.vignette * 100)}%, rgba(0,0,0,${filters.vignette}) 100%)`
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar: Properties & Filters */}
        <aside className="w-96 bg-white border-l border-slate-200 flex flex-col z-10">
          <div className="flex border-b border-slate-100">
            <button 
              onClick={() => setActiveTab('properties')}
              className={`flex-1 py-6 text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'properties' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Properties
            </button>
            <button 
              onClick={() => setActiveTab('filters')}
              className={`flex-1 py-6 text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'filters' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Filters
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {activeTab === 'properties' ? (
              selectedHotspot ? (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Hotspot Type</label>
                    <button 
                      onClick={() => {
                        setFilterScope('hotspot');
                        setActiveTab('filters');
                      }}
                      className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:underline"
                    >
                      <Sliders className="w-3 h-3" /> Edit Filters
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <TypeButton 
                      active={selectedHotspot.type === 'product'} 
                      onClick={() => updateHotspot(selectedHotspot.id, { type: 'product' })}
                      icon={ShoppingCart}
                      label="Product"
                    />
                    <TypeButton 
                      active={selectedHotspot.type === 'video'} 
                      onClick={() => updateHotspot(selectedHotspot.id, { type: 'video' })}
                      icon={Play}
                      label="Video"
                    />
                    <TypeButton 
                      active={selectedHotspot.type === 'signup_form'} 
                      onClick={() => updateHotspot(selectedHotspot.id, { type: 'signup_form' })}
                      icon={Mail}
                      label="Form"
                    />
                    <TypeButton 
                      active={selectedHotspot.type === 'text'} 
                      onClick={() => updateHotspot(selectedHotspot.id, { type: 'text' })}
                      icon={Type}
                      label="Text"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex justify-between">
                      Effect Radius
                      <span className="text-blue-600">{selectedHotspot.radius || 0}px</span>
                    </label>
                    <input 
                      type="range" 
                      min={0} 
                      max={300} 
                      step={1}
                      value={selectedHotspot.radius || 0}
                      onChange={e => updateHotspot(selectedHotspot.id, { radius: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Label / Title</label>
                    <input 
                      type="text" 
                      value={selectedHotspot.title}
                      onChange={e => updateHotspot(selectedHotspot.id, { title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Description</label>
                    <textarea 
                      value={selectedHotspot.description || ''}
                      onChange={e => updateHotspot(selectedHotspot.id, { description: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium h-24"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Price</label>
                      <input 
                        type="text" 
                        value={selectedHotspot.price || ''}
                        onChange={e => updateHotspot(selectedHotspot.id, { price: e.target.value })}
                        placeholder="$0.00"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">CTA Text</label>
                      <input 
                        type="text" 
                        value={selectedHotspot.ctaText || ''}
                        onChange={e => updateHotspot(selectedHotspot.id, { ctaText: e.target.value })}
                        placeholder="Buy Now"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Bg Color</label>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="color" 
                          value={selectedHotspot.backgroundColor || '#2563eb'}
                          onChange={e => updateHotspot(selectedHotspot.id, { backgroundColor: e.target.value })}
                          className="w-10 h-10 rounded-xl cursor-pointer border-none bg-transparent"
                        />
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{selectedHotspot.backgroundColor || '#2563eb'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Icon Color</label>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="color" 
                          value={selectedHotspot.iconColor || '#ffffff'}
                          onChange={e => updateHotspot(selectedHotspot.id, { iconColor: e.target.value })}
                          className="w-10 h-10 rounded-xl cursor-pointer border-none bg-transparent"
                        />
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{selectedHotspot.iconColor || '#ffffff'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${selectedHotspot.pulseAnimation ? 'bg-blue-600 animate-pulse' : 'bg-slate-300'}`} />
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Pulse Animation</span>
                    </div>
                    <button 
                      onClick={() => updateHotspot(selectedHotspot.id, { pulseAnimation: !selectedHotspot.pulseAnimation })}
                      className={`w-12 h-6 rounded-full transition-all relative ${selectedHotspot.pulseAnimation ? 'bg-blue-600' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${selectedHotspot.pulseAnimation ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Trigger Type</label>
                    <div className="flex bg-slate-50 p-1 rounded-2xl">
                      <button 
                        onClick={() => updateHotspot(selectedHotspot.id, { triggerType: 'click' })}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${selectedHotspot.triggerType === 'click' || !selectedHotspot.triggerType ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                      >
                        Click
                      </button>
                      <button 
                        onClick={() => updateHotspot(selectedHotspot.id, { triggerType: 'hover' })}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${selectedHotspot.triggerType === 'hover' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                      >
                        Hover
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Action URL</label>
                    <input 
                      type="url" 
                      value={selectedHotspot.action.value}
                      onChange={e => updateHotspot(selectedHotspot.id, { action: { ...selectedHotspot.action, value: e.target.value } })}
                      placeholder="https://..."
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div className="pt-8 border-t border-slate-100">
                    <button 
                      onClick={() => deleteHotspot(selectedHotspot.id)}
                      className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-5 h-5" /> Delete Hotspot
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-4">
                    <MousePointer2 className="w-8 h-8 text-slate-200" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Select a hotspot</h3>
                  <p className="text-slate-400 text-sm max-w-[200px] mx-auto mt-2">Click on a hotspot or add a new one to start editing properties.</p>
                </div>
              )
            ) : (
              <div className="space-y-10">
                <div className="flex bg-slate-50 p-1 rounded-2xl mb-6">
                  <button 
                    onClick={() => setFilterScope('global')}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${filterScope === 'global' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    Image
                  </button>
                  <button 
                    onClick={() => {
                      if (!selectedId) {
                        alert("Select a hotspot first to apply local filters!");
                        return;
                      }
                      setFilterScope('hotspot');
                    }}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${filterScope === 'hotspot' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    Hotspot
                  </button>
                </div>

                {filterScope === 'global' ? (
                  <div className="space-y-10">
                    <FilterSlider 
                      label="Brightness" 
                      value={filters.brightness} 
                      min={-1} 
                      max={1} 
                      step={0.01}
                      icon={Sun}
                      onChange={v => setFilters({ ...filters, brightness: v })} 
                    />
                    <FilterSlider 
                      label="Contrast" 
                      value={filters.contrast} 
                      min={-100} 
                      max={100} 
                      step={1}
                      icon={Contrast}
                      onChange={v => setFilters({ ...filters, contrast: v })} 
                    />
                    <FilterSlider 
                      label="Blur" 
                      value={filters.blur} 
                      min={0} 
                      max={20} 
                      step={0.5}
                      icon={Droplets}
                      onChange={v => setFilters({ ...filters, blur: v })} 
                    />
                    <FilterSlider 
                      label="Hue" 
                      value={filters.hue} 
                      min={0} 
                      max={360} 
                      step={1}
                      icon={Palette}
                      onChange={v => setFilters({ ...filters, hue: v })} 
                    />
                    <FilterSlider 
                      label="Saturation" 
                      value={filters.saturation} 
                      min={-2} 
                      max={2} 
                      step={0.1}
                      icon={Palette}
                      onChange={v => setFilters({ ...filters, saturation: v })} 
                    />
                    <FilterSlider 
                      label="Opacity" 
                      value={filters.opacity} 
                      min={0} 
                      max={1} 
                      step={0.01}
                      icon={Eye}
                      onChange={v => setFilters({ ...filters, opacity: v })} 
                    />
                    <FilterSlider 
                      label="Noise" 
                      value={filters.noise} 
                      min={0} 
                      max={1} 
                      step={0.01}
                      icon={Sliders}
                      onChange={v => setFilters({ ...filters, noise: v })} 
                    />
                    <FilterSlider 
                      label="Pixelate" 
                      value={filters.pixelSize} 
                      min={1} 
                      max={20} 
                      step={1}
                      icon={Layout}
                      onChange={v => setFilters({ ...filters, pixelSize: v })} 
                    />
                    <FilterSlider 
                      label="Vignette" 
                      value={filters.vignette} 
                      min={0} 
                      max={1} 
                      step={0.01}
                      icon={Palette}
                      onChange={v => setFilters({ ...filters, vignette: v })} 
                    />

                    <div className="pt-8 border-t border-slate-100">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Palette className="w-4 h-4" /> Color Effects
                      </label>
                      <div className="grid grid-cols-1 gap-4">
                        <FilterToggle 
                          label="Grayscale" 
                          active={filters.grayscale} 
                          onClick={() => setFilters({ ...filters, grayscale: !filters.grayscale })} 
                        />
                        <FilterToggle 
                          label="Sepia" 
                          active={filters.sepia} 
                          onClick={() => setFilters({ ...filters, sepia: !filters.sepia })} 
                        />
                        <FilterToggle 
                          label="Invert" 
                          active={filters.invert} 
                          onClick={() => setFilters({ ...filters, invert: !filters.invert })} 
                        />
                      </div>
                    </div>

                    <button 
                      onClick={() => setFilters({ 
                        brightness: 0, 
                        contrast: 0, 
                        blur: 0, 
                        grayscale: false, 
                        sepia: false, 
                        invert: false,
                        hue: 0,
                        saturation: 0,
                        opacity: 1,
                        noise: 0,
                        pixelSize: 1,
                        vignette: 0
                      })}
                      className="w-full py-4 bg-slate-50 text-slate-500 font-bold rounded-2xl hover:bg-slate-100 transition-all text-xs uppercase tracking-widest"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  selectedHotspot && (
                    <div className="space-y-10">
                      <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Editing Hotspot</p>
                        <p className="text-sm font-black text-slate-900">{selectedHotspot.title}</p>
                      </div>
                      
                      <FilterSlider 
                        label="Opacity" 
                        value={selectedHotspot.filters?.opacity ?? 1} 
                        min={0} 
                        max={1} 
                        step={0.01}
                        icon={Eye}
                        onChange={v => updateHotspot(selectedHotspot.id, { filters: { ...selectedHotspot.filters, opacity: v } })} 
                      />
                      <FilterSlider 
                        label="Blur" 
                        value={selectedHotspot.filters?.blur ?? 0} 
                        min={0} 
                        max={20} 
                        step={0.5}
                        icon={Droplets}
                        onChange={v => updateHotspot(selectedHotspot.id, { filters: { ...selectedHotspot.filters, blur: v } })} 
                      />
                      <FilterSlider 
                        label="Hue" 
                        value={selectedHotspot.filters?.hue ?? 0} 
                        min={0} 
                        max={360} 
                        step={1}
                        icon={Palette}
                        onChange={v => updateHotspot(selectedHotspot.id, { filters: { ...selectedHotspot.filters, hue: v } })} 
                      />

                      <div className="pt-8 border-t border-slate-100">
                        <div className="grid grid-cols-1 gap-4">
                          <FilterToggle 
                            label="Grayscale" 
                            active={!!selectedHotspot.filters?.grayscale} 
                            onClick={() => updateHotspot(selectedHotspot.id, { filters: { ...selectedHotspot.filters, grayscale: !selectedHotspot.filters?.grayscale } })} 
                          />
                          <FilterToggle 
                            label="Invert" 
                            active={!!selectedHotspot.filters?.invert} 
                            onClick={() => updateHotspot(selectedHotspot.id, { filters: { ...selectedHotspot.filters, invert: !selectedHotspot.filters?.invert } })} 
                          />
                        </div>
                      </div>

                      <button 
                        onClick={() => updateHotspot(selectedHotspot.id, { filters: {} })}
                        className="w-full py-4 bg-slate-50 text-slate-500 font-bold rounded-2xl hover:bg-slate-100 transition-all text-xs uppercase tracking-widest"
                      >
                        Reset Hotspot Filters
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ToolButton({ icon: Icon, active, onClick, label, className }: { icon: any, active?: boolean, onClick?: () => void, label: string, className?: string }) {
  return (
    <button 
      onClick={onClick}
      className={`relative group p-3 rounded-2xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'} ${className}`}
    >
      <Icon className="w-6 h-6" />
      <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap uppercase tracking-widest z-50">
        {label}
      </div>
    </button>
  );
}

function TypeButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${active ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function HotspotMarker({ hotspot, isSelected, onSelect, onChange, image }: { hotspot: Hotspot, isSelected: boolean, onSelect: () => void, onChange: (newAttrs: any) => void, image: HTMLImageElement }) {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const radiusRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected) {
      trRef.current?.nodes([shapeRef.current]);
      trRef.current?.getLayer().batchDraw();
    }
  }, [isSelected]);

  const konvaFilters = useMemo(() => {
    const f = [];
    if (hotspot.filters?.blur) f.push(Konva.Filters.Blur);
    if (hotspot.filters?.hue) f.push(Konva.Filters.HSL);
    if (hotspot.filters?.grayscale) f.push(Konva.Filters.Grayscale);
    if (hotspot.filters?.invert) f.push(Konva.Filters.Invert);
    return f;
  }, [hotspot.filters]);

  useEffect(() => {
    if (radiusRef.current) {
      radiusRef.current.cache();
    }
  }, [hotspot.radius, hotspot.filters]);

  return (
    <>
      {hotspot.radius && hotspot.radius > 0 && (
        <Circle
          x={hotspot.x}
          y={hotspot.y}
          radius={hotspot.radius}
          fillPatternImage={image}
          fillPatternOffset={{ x: hotspot.x, y: hotspot.y }}
          fillPatternRepeat="no-repeat"
          filters={konvaFilters}
          blurRadius={hotspot.filters?.blur || 0}
          hue={hotspot.filters?.hue || 0}
          opacity={hotspot.filters?.opacity ?? 1}
          listening={false}
          ref={radiusRef}
        />
      )}
      {hotspot.pulseAnimation !== false && (
        <Circle
          x={hotspot.x}
          y={hotspot.y}
          radius={18}
          fill={hotspot.backgroundColor || '#2563eb'}
          opacity={0.2}
          listening={false}
          scaleX={1.2}
          scaleY={1.2}
        />
      )}
      <Circle
        ref={shapeRef}
        x={hotspot.x}
        y={hotspot.y}
        radius={12}
        fill={hotspot.backgroundColor || '#2563eb'}
        stroke={isSelected ? '#ffffff' : (hotspot.iconColor || '#ffffff')}
        strokeWidth={3}
        draggable
        onClick={onSelect}
        onDragEnd={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        shadowBlur={10}
        shadowColor="rgba(0,0,0,0.2)"
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          enabledAnchors={[]}
          borderStroke="#2563eb"
          borderDash={[3, 3]}
        />
      )}
    </>
  );
}

function FilterSlider({ label, value, min, max, step, icon: Icon, onChange }: { label: string, value: number, min: number, max: number, step: number, icon: any, onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Icon className="w-4 h-4" /> {label}
        </label>
        <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{value}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value} 
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
    </div>
  );
}

function FilterToggle({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${active ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
    >
      <span className="text-xs font-black uppercase tracking-widest">{label}</span>
      <div className={`w-10 h-5 rounded-full relative transition-colors ${active ? 'bg-blue-600' : 'bg-slate-200'}`}>
        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${active ? 'left-6' : 'left-1'}`}></div>
      </div>
    </button>
  );
}
