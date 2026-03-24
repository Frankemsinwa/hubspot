import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { auth } from './firebase';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import CampaignEditor from './components/CampaignEditor';
import Analytics from './components/Analytics';
import HotspotRenderer from './components/HotspotRenderer';
import DomainManagement from './components/DomainManagement';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for mock user in local storage
    const mockUser = localStorage.getItem('mock_user');
    if (mockUser) {
      setUser(JSON.parse(mockUser));
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen bg-zinc-950 text-white">Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/login" element={!user ? <Auth /> : <Navigate to="/" />} />
        <Route path="/campaigns/:id/edit" element={user ? <CampaignEditor /> : <Navigate to="/login" />} />
        <Route path="/campaigns/:id/analytics" element={user ? <Analytics /> : <Navigate to="/login" />} />
        <Route path="/domains" element={user ? <DomainManagement /> : <Navigate to="/login" />} />
        <Route path="/embed/:id" element={<HotspotRenderer />} />
      </Routes>
    </BrowserRouter>
  );
}
