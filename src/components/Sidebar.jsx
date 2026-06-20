import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const NAV = [
  { path: '/', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a2 2 0 002-2v-4a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 002 2' },
  { path: '/input', label: 'Input Data', icon: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z' },
  { path: '/hasil', label: 'Hasil Analisis', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { path: '/riwayat', label: 'Riwayat Pengukuran', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
];

export default function Sidebar({ isOpen, close }) {
  const [liveSensor, setLiveSensor] = useState({ terhubung: false });

  useEffect(() => {
    const sensorRef = doc(db, "esp32_buffer", "device_01");
    const unsubscribe = onSnapshot(sensorRef, (docSnap) => {
      if (docSnap.exists()) {
        setLiveSensor({ terhubung: true });
      } else {
        setLiveSensor({ terhubung: false });
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-30 w-64 bg-teal-900 text-teal-100 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col flex-shrink-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 bg-teal-950 flex-shrink-0">
        <div className="w-8 h-8 rounded bg-teal-800 flex items-center justify-center mr-3 border border-teal-700">
          <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <div>
          <span className="text-white text-base font-bold tracking-wide">Antropometri</span>
          <span className="block text-teal-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">Dashboard</span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <p className="px-3 text-xs font-bold text-teal-600 uppercase tracking-widest mb-4">Menu Utama</p>
        {NAV.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={close}
            className={({ isActive }) => `
              flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${isActive ? 'bg-teal-800 text-white' : 'text-teal-300 hover:bg-teal-800/50 hover:text-white'}
            `}
          >
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Connection Status */}
      <div className="p-4 mt-auto">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-teal-950 border border-teal-800">
          <span className="relative flex h-3 w-3 flex-shrink-0">
            {liveSensor.terhubung && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${liveSensor.terhubung ? 'bg-emerald-500' : 'bg-gray-500'}`}></span>
          </span>
          <div>
            <p className="text-[11px] font-medium text-teal-300">Status Sensor</p>
            <p className={`text-xs font-semibold mt-0.5 ${liveSensor.terhubung ? 'text-white' : 'text-gray-400'}`}>
              {liveSensor.terhubung ? 'Terhubung' : 'Terputus'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
