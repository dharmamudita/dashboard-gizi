import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import InputData from './pages/InputData';
import HasilPerhitungan from './pages/HasilPerhitungan';
import RiwayatData from './pages/RiwayatData';
import Login from './pages/Login';
import EdgeProcessor from './components/EdgeProcessor';

function AppLayout({ children, user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fallback name parsing
  const rawName = user?.displayName || user?.email?.split('@')[0] || 'Bunda';
  const formatName = (name) => {
    if (name.toLowerCase().includes('bunda')) return name;
    return `Bunda ${name.split(' ')[0]}`;
  };
  const displayName = formatName(rawName);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <EdgeProcessor user={user} />
      {sidebarOpen && <div className="fixed inset-0 z-20 bg-gray-900/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <Sidebar isOpen={sidebarOpen} close={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 mr-2 text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-sm font-semibold text-gray-500 hidden sm:block">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {rawName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-sm text-right">
                <p className="font-medium text-gray-900 leading-none">{displayName}</p>
                <p className="text-xs text-teal-600 font-medium mt-1">Akun Orang Tua</p>
              </div>
              <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block"></div>
              <button onClick={onLogout} className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors" title="Keluar">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto pb-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => { 
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-teal-600 font-medium animate-pulse">Memuat Aplikasi...</p>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <BrowserRouter>
      <AppLayout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/input" element={<InputData user={user} />} />
          <Route path="/hasil" element={<HasilPerhitungan user={user} />} />
          <Route path="/riwayat" element={<RiwayatData user={user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
