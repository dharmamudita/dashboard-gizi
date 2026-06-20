import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import StatCard from '../components/StatCard';
import GrowthChart from '../components/GrowthChart';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

const badgeMap = {
  happy:   { t:'Normal', bg:'bg-emerald-100', c:'text-emerald-800' },
  neutral: { t:'Stunted', bg:'bg-amber-100', c:'text-amber-800' },
  sad:     { t:'Severe', bg:'bg-red-100', c:'text-red-800' }
};
const getBadge = (s) => badgeMap[s] || { t:'—', bg:'bg-gray-100', c:'text-gray-800' };

export default function Dashboard({ user }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [childFilter, setChildFilter] = useState('all');

  useEffect(() => {
    if (!user?.email) return;

    const q = query(
      collection(db, "pengukuran"), 
      where("userEmail", "==", user.email),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setData(dbData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching realtime data: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Ekstrak nama anak-anak yang terdaftar
  const uniqueChildren = Array.from(new Set(data.map(d => d.nama))).filter(Boolean);

  // Filter data berdasarkan anak yang dipilih
  const filteredData = childFilter === 'all' ? data : data.filter(d => d.nama === childFilter);

  // Calculate dynamic stats from FILTERED data
  const normalCount = filteredData.filter(d => ['normal', 'tall'].includes(d.hasilStunting?.kategori)).length;
  const stuntedCount = filteredData.filter(d => d.hasilStunting?.kategori === 'stunted').length;
  const severeCount = filteredData.filter(d => d.hasilStunting?.kategori === 'severely_stunted').length;
  const totalMeasurements = normalCount + stuntedCount + severeCount || 1; 

  const pie = [
    { name:'Normal', value: normalCount, color:'#10b981' },
    { name:'Stunted', value: stuntedCount, color:'#f59e0b' },
    { name:'Severely Stunted', value: severeCount, color:'#ef4444' },
  ].filter(p => p.value > 0); 

  const recent = filteredData.slice(0, 5).map(d => {
    const birth = new Date(d.tanggalLahir);
    const measured = new Date(d.timestamp);
    const diffMonths = (measured.getFullYear() - birth.getFullYear()) * 12 + (measured.getMonth() - birth.getMonth());
    
    return {
      id: d.id,
      nama: d.nama,
      umur: `${diffMonths > 0 ? diffMonths : 1} bln`,
      status: d.hasilStunting?.emoji || 'happy',
      z: d.hasil?.zScoreTBU ?? 0,
      waktu: new Date(d.timestamp).toLocaleDateString('id-ID', {day:'numeric', month:'short'})
    };
  });

  // Data Referensi Z-Score (Pita Datar)
  const chartData = [];
  for (let bulan = 0; bulan <= 60; bulan += 3) {
    let anakZScore = null;
    
    // Injeksi Z-Score Anak ke dalam chart jika memfilter 1 anak secara spesifik
    if (childFilter !== 'all' && filteredData.length > 0) {
      // Cari umur anak saat pengukuran yang paling mendekati bulan referensi (Toleransi +- 1.5 bulan)
      const closestMeasurement = filteredData.find(d => {
        const birth = new Date(d.tanggalLahir);
        const measured = new Date(d.timestamp);
        const diffMonths = Math.round((measured - birth) / (1000 * 60 * 60 * 24 * 30.44));
        return Math.abs(diffMonths - bulan) <= 1.5; 
      });
      if (closestMeasurement) anakZScore = closestMeasurement.hasil?.zScoreTBU;
    }
    
    chartData.push({
      bulan,
      plus2sd: 2,
      median: 0,
      minus2sd: -2,
      minus3sd: -3,
      anak: anakZScore
    });
  }
  
  const formatName = (name) => {
    if (!name) return 'Bunda';
    if (name.toLowerCase().includes('bunda')) return name;
    return `Bunda ${name.split(' ')[0]}`;
  };

  const displayName = formatName(user?.displayName || user?.email?.split('@')[0]);

  if (loading) {
    return <div className="py-20 text-center text-teal-600 animate-pulse font-medium">Memuat Data Secara Realtime...</div>;
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center mb-6 border-8 border-white shadow-sm">
          <svg className="w-10 h-10 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4"/></svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Selamat Datang, {displayName}!</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-8">Saat ini Bunda belum memiliki data pengukuran. Silakan tambahkan profil dan hasil pengukuran anak Bunda untuk melihat grafik pertumbuhannya.</p>
        <Link to="/input" className="rounded-lg bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-teal-500 transition-colors">
          Mulai Pengukuran Pertama
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Halo, {displayName}!</h1>
          <p className="text-sm text-gray-500 mt-1">Ini adalah ringkasan tumbuh kembang anak Bunda saat ini.</p>
        </div>
        
        {/* DROPDOWN FILTER ANAK */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500 hidden sm:inline-block">Tampilkan Data:</span>
          <select 
            value={childFilter} 
            onChange={e => setChildFilter(e.target.value)}
            className="block w-full sm:w-auto rounded-lg border-0 py-2.5 pl-4 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-teal-600 sm:text-sm sm:leading-6 font-semibold bg-white"
          >
            <option value="all">Semua Anak</option>
            {uniqueChildren.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <Link to="/input" className="inline-flex justify-center items-center px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition-colors shadow-sm whitespace-nowrap">
            <svg className="w-5 h-5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            <span className="hidden sm:inline-block">Ukur Sekarang</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title={childFilter === 'all' ? "Total Anak Terdaftar" : "Total Pengukuran"} value={childFilter === 'all' ? uniqueChildren.length : filteredData.length} sub={childFilter === 'all' ? "Telah didaftarkan" : "Kali diukur"}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>} />
        <StatCard title="Gizi Normal" value={normalCount} sub={`${Math.round((normalCount/totalMeasurements)*100)}% dari riwayat`} trend="good"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} />
        <StatCard title="Stunted" value={stuntedCount} sub="Perlu diobservasi" trend={stuntedCount > 0 ? "warn" : null}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.834-1.964-.834-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>} />
        <StatCard title="Severely Stunted" value={severeCount} sub="Butuh tindakan medis" trend={severeCount > 0 ? "bad" : null}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm p-6 relative">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">Grafik Tumbuh Kembang {childFilter !== 'all' ? `(${childFilter})` : ''}</h2>
            <p className="text-sm text-gray-500">Perbandingan riwayat tinggi anak dengan batas toleransi WHO ideal.</p>
          </div>
          {childFilter === 'all' && (
            <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm rounded-xl flex items-center justify-center p-6 text-center border border-white">
              <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 max-w-sm">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="font-bold text-gray-900">Pilih Spesifik Satu Anak</h3>
                <p className="text-sm text-gray-500 mt-1">Gunakan dropdown Filter di pojok kanan atas untuk memunculkan titik grafik pertumbuhan anak Anda secara spesifik.</p>
              </div>
            </div>
          )}
          <GrowthChart data={chartData} />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">Analisis Gizi</h2>
            <p className="text-sm text-gray-500">Riwayat status anak Bunda</p>
          </div>
          <div className="flex-1 min-h-[220px]">
            {pie.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pie} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                    {pie.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} kali`, name]} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">Tidak ada riwayat pengukuran yang mencukupi</div>
            )}
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2 text-center">
            {pie.map(p => (
              <div key={p.name}>
                <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: p.color }}></div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{p.name}</p>
                <p className="text-base font-bold text-gray-900 mt-1">{p.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Aktivitas Terakhir {childFilter !== 'all' ? `(${childFilter})` : ''}</h2>
          </div>
          <Link to="/riwayat" className="text-sm font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg transition-colors">Semua Riwayat</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 whitespace-nowrap">
            <thead className="bg-white border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Nama Anak</th>
                <th className="px-6 py-4 font-semibold">Umur (Bln)</th>
                <th className="px-6 py-4 font-semibold">Z-Score (TB/U)</th>
                <th className="px-6 py-4 font-semibold">Status Gizi</th>
                <th className="px-6 py-4 font-semibold text-right">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {recent.map((r) => {
                const b = getBadge(r.status);
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{r.nama}</td>
                    <td className="px-6 py-4">{r.umur}</td>
                    <td className="px-6 py-4 font-medium">
                      <span className={r.z >= -2 ? 'text-emerald-600' : r.z >= -3 ? 'text-amber-600' : 'text-red-600'}>
                        {r.z > 0 ? '+' : ''}{r.z}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${b.bg} ${b.c}`}>{b.t}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-400 text-xs">{r.waktu}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
