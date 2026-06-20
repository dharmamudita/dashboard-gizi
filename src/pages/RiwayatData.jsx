import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, doc, deleteDoc } from 'firebase/firestore';

export default function RiwayatData({ user }) {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;

    // FIRESTORE REALTIME LISTENER
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
      // Fallback if index missing
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filtered = data
    .filter(i => (i.nama || '').toLowerCase().includes(search.toLowerCase()))
    .filter(i => filter === 'all' || i.hasilStunting?.kategori === filter)
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.timestamp) - new Date(a.timestamp);
      if (sort === 'oldest') return new Date(a.timestamp) - new Date(b.timestamp);
      return (a.nama || '').localeCompare(b.nama || '');
    });

  const getBadge = (k) => {
    const m = {
      normal: { bg:'bg-emerald-100', c:'text-emerald-800', l:'Normal' },
      tall:   { bg:'bg-emerald-100', c:'text-emerald-800', l:'Tinggi' },
      stunted:{ bg:'bg-amber-100',   c:'text-amber-800',   l:'Stunted' },
      severely_stunted:{ bg:'bg-red-100', c:'text-red-800', l:'Severe' },
    };
    return m[k] || m.normal;
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '-';

  const del = async (id) => { 
    if(confirm('Hapus data ini secara permanen dari server?')){ 
      try {
        await deleteDoc(doc(db, "pengukuran", id));
        // No need to manually update state, onSnapshot will trigger automatically!
      } catch (error) {
        console.error("Error deleting doc", error);
        alert("Gagal menghapus data.");
      }
    }
  };
  
  const countByKat = (kat) => data.filter(d => Array.isArray(kat) ? kat.includes(d.hasilStunting?.kategori) : d.hasilStunting?.kategori === kat).length;

  if (loading) {
    return <div className="py-20 text-center text-teal-600 animate-pulse font-medium">Memuat Data Riwayat Secara Realtime...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Riwayat Pertumbuhan Si Kecil</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola dan lihat semua riwayat pengukuran anak Bunda di sini.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { id: 'normal', l:'Sehat & Normal', n: countByKat(['normal','tall']), icon: 'M5 13l4 4L19 7', color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { id: 'stunted', l:'Perlu Observasi', n: countByKat('stunted'), icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.834-1.964-.834-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z', color: 'text-amber-600', bg: 'bg-amber-100' },
          { id: 'severe', l:'Butuh Tindakan', n: countByKat('severely_stunted'), icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-red-600', bg: 'bg-red-100' },
        ].map(s => (
          <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center">
            <div className={`p-3 rounded-lg ${s.bg} ${s.color} mr-4`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.n}</p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{s.l}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input 
              type="text" placeholder="Cari nama anak Bunda..." value={search} onChange={e => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select value={filter} onChange={e => setFilter(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md shadow-sm">
              <option value="all">Semua Status</option>
              <option value="normal">Normal</option>
              <option value="stunted">Stunted</option>
              <option value="severely_stunted">Severely Stunted</option>
            </select>
            <select value={sort} onChange={e => setSort(e.target.value)} className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-md shadow-sm">
              <option value="newest">Paling Baru</option>
              <option value="oldest">Paling Lama</option>
              <option value="name">Nama A-Z</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 px-4">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <h3 className="mt-4 text-base font-bold text-gray-900">Belum ada riwayat pengukuran</h3>
            <p className="mt-1 text-sm text-gray-500">Mulai ukur dan pantau perkembangan anak Bunda sekarang.</p>
          </div>
        ) : (
          <>
            {/* Tampilan Layar Besar (Tabel) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white">
                  <tr>
                    {['Nama Anak', 'TB (cm)', 'BB (kg)', 'LK (cm)', 'Suhu', 'Z-Score (TB/U)', 'Status Gizi', 'Tanggal', ''].map((h, i) => (
                      <th key={i} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map(r => {
                    const b = getBadge(r.hasilStunting?.kategori);
                    const z = r.hasil?.zScoreTBU ?? 0;
                    return (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-800 font-bold text-xs mr-3">
                              {r.nama?.charAt(0)}
                            </div>
                            <div className="text-sm font-semibold text-gray-900">{r.nama}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.tinggiBadan}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.beratBadan}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.lingkarKepala}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.suhuTubuh}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-bold ${z >= -2 ? 'text-emerald-600' : z >= -3 ? 'text-amber-600' : 'text-red-600'}`}>
                            {z > 0 ? '+' : ''}{z}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${b.bg} ${b.c}`}>
                            {b.l}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fmt(r.timestamp)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => del(r.id)} className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors" title="Hapus Data">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Tampilan Layar HP (Kartu) */}
            <div className="block md:hidden divide-y divide-gray-200">
              {filtered.map(r => {
                const b = getBadge(r.hasilStunting?.kategori);
                const z = r.hasil?.zScoreTBU ?? 0;
                return (
                  <div key={r.id} className="p-4 bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-800 font-bold text-sm mr-3">
                          {r.nama?.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{r.nama}</div>
                          <div className="text-xs text-gray-500">{fmt(r.timestamp)}</div>
                        </div>
                      </div>
                      <button onClick={() => del(r.id)} className="text-gray-400 hover:text-red-600 p-2 rounded hover:bg-red-50 transition-colors" title="Hapus Data">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      <div className="bg-gray-50 p-2 rounded text-center border border-gray-100">
                        <div className="text-[10px] text-gray-500 font-medium">TB</div>
                        <div className="font-bold text-gray-900 text-sm">{r.tinggiBadan}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-center border border-gray-100">
                        <div className="text-[10px] text-gray-500 font-medium">BB</div>
                        <div className="font-bold text-gray-900 text-sm">{r.beratBadan}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-center border border-gray-100">
                        <div className="text-[10px] text-gray-500 font-medium">LK</div>
                        <div className="font-bold text-gray-900 text-sm">{r.lingkarKepala}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded text-center border border-gray-100">
                        <div className="text-[10px] text-gray-500 font-medium">Suhu</div>
                        <div className="font-bold text-gray-900 text-sm">{r.suhuTubuh}</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-gray-500 mb-0.5">Z-Score (TB/U)</div>
                        <span className={`text-sm font-bold ${z >= -2 ? 'text-emerald-600' : z >= -3 ? 'text-amber-600' : 'text-red-600'}`}>
                          {z > 0 ? '+' : ''}{z}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">Status Gizi</div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${b.bg} ${b.c}`}>
                          {b.l}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
