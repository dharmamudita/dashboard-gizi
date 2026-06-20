import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import StatusEmoji, { StatusEmojiMini } from '../components/StatusEmoji';
import { statusKeseluruhan } from '../utils/zScoreCalculator';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';

export default function HasilPerhitungan({ user }) {
  const location = useLocation();
  const [data, setData] = useState(location.state?.data || null);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [childFilter, setChildFilter] = useState(location.state?.data?.nama || '');

  // Fetch daftar anak untuk dropdown dari database 'anak'
  useEffect(() => {
    if (!user?.email) return;
    const unsub = onSnapshot(query(collection(db, "anak"), where("userEmail", "==", user.email)), (snapshot) => {
      const dbData = snapshot.docs.map(doc => doc.data().nama);
      setProfiles(dbData);
      
      // Auto-select anak pertama jika tidak ada pilihan
      if (dbData.length > 0 && !childFilter) {
        setChildFilter(dbData[0]);
      } else if (dbData.length === 0) {
        setLoading(false); // Berhenti loading jika memang belum ada anak terdaftar
      }
    });
    return () => unsub();
  }, [user]);

  // Fetch data pengukuran terakhir berdasarkan anak yang dipilih dari dropdown
  useEffect(() => {
    if (!user?.email || !childFilter) return;

    // Jika datang dari halaman riwayat dan namanya sama, pakai data yang dilempar agar lebih cepat
    if (location.state?.data && location.state.data.nama === childFilter) {
      setData(location.state.data);
      setLoading(false);
      return;
    }

    const fetchLatest = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "pengukuran"), 
          where("userEmail", "==", user.email),
          where("nama", "==", childFilter),
          orderBy("timestamp", "desc"),
          limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setData({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        } else {
          setData(null);
        }
      } catch (error) {
        console.error("Error fetching latest data", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLatest();
  }, [user, childFilter]);

  if (loading) {
    return <div className="py-20 text-center text-teal-600 font-medium animate-pulse">Menarik data analisis terbaru...</div>;
  }

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4"/>
        </svg>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Anak Terdaftar</h2>
        <p className="text-gray-500 text-sm mb-6 max-w-sm">Silakan daftarkan anak Bunda terlebih dahulu di menu Pendaftaran Anak.</p>
        <Link to="/input" className="inline-flex justify-center items-center rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-500">
          Daftarkan Anak
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Hasil Analisis Gizi</h1>
            <div className="text-sm text-gray-500 mt-1 flex items-center">
              Laporan terbaru untuk:
              <select 
                value={childFilter} 
                onChange={e => setChildFilter(e.target.value)}
                className="ml-2 block rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-teal-600 sm:text-sm sm:leading-6 font-bold bg-white"
              >
                {profiles.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-xl shadow-sm border border-gray-200">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Data Pengukuran</h2>
          <p className="text-gray-500 text-sm max-w-sm">Anak bernama "{childFilter}" belum memiliki riwayat pengukuran dari alat ESP32.</p>
        </div>
      </div>
    );
  }

  const hasil = data.hasil;
  const overall = statusKeseluruhan(hasil);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Hasil Analisis Gizi</h1>
          <div className="text-sm text-gray-500 mt-1 flex items-center">
            Laporan terbaru untuk: 
            <select 
              value={childFilter} 
              onChange={e => setChildFilter(e.target.value)}
              className="ml-2 block rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-teal-600 sm:text-sm sm:leading-6 font-bold bg-white"
            >
              {profiles.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <Link to="/riwayat" className="text-sm font-medium text-teal-600 hover:text-teal-700 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
          Kembali ke Riwayat
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Conclusion) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center text-center h-full">
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-widest mb-1">Status Keseluruhan</h2>
            <p className="text-xs text-gray-500 mb-8">Berdasarkan rasio WHO</p>
            
            <div className="mb-8 w-full flex justify-center">
              <StatusEmoji activeStatus={overall} size="xl" showLabels={true} animated={true} singleMode={true} />
            </div>
            
            <div className={`w-full mt-auto p-4 rounded-lg border ${
              overall === 'happy' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
              overall === 'neutral' ? 'bg-amber-50 border-amber-200 text-amber-800' : 
              'bg-red-50 border-red-200 text-red-800'
            }`}>
              <p className="font-bold text-lg">{hasil.stunting.description}</p>
            </div>
          </div>
        </div>

        {/* Right Column (Metrics Breakdown) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50">
              <h3 className="text-base font-semibold leading-6 text-gray-900">Rincian Indikator</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
              
              {/* TB/U */}
              <div className="p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Tinggi Badan / Umur</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{hasil.inputTB} <span className="text-sm font-medium text-gray-500">cm</span></p>
                  </div>
                  <StatusEmojiMini status={hasil.stunting.emoji} size={32} />
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center border border-gray-100">
                  <span className="text-xs font-medium text-gray-600">Z-Score</span>
                  <span className="font-bold text-gray-900">{hasil.zScoreTBU > 0 ? '+' : ''}{hasil.zScoreTBU}</span>
                </div>
              </div>

              {/* BB/U */}
              <div className="p-6 flex flex-col justify-between border-t sm:border-t-0 border-gray-200">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Berat Badan / Umur</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{hasil.inputBB} <span className="text-sm font-medium text-gray-500">kg</span></p>
                  </div>
                  <StatusEmojiMini status={hasil.beratBadan.emoji} size={32} />
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center border border-gray-100">
                  <span className="text-xs font-medium text-gray-600">Z-Score</span>
                  <span className="font-bold text-gray-900">{hasil.zScoreBBU > 0 ? '+' : ''}{hasil.zScoreBBU}</span>
                </div>
              </div>
              
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-gray-200 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
              
              {/* LK/U */}
              <div className="p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Lingkar Kepala / Umur</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{hasil.inputLK} <span className="text-sm font-medium text-gray-500">cm</span></p>
                  </div>
                  <StatusEmojiMini status={hasil.zScoreLKU >= -2 ? 'happy' : hasil.zScoreLKU >= -3 ? 'neutral' : 'sad'} size={32} />
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center border border-gray-100">
                  <span className="text-xs font-medium text-gray-600">Z-Score</span>
                  <span className="font-bold text-gray-900">{hasil.zScoreLKU > 0 ? '+' : ''}{hasil.zScoreLKU}</span>
                </div>
              </div>

              {/* Suhu */}
              <div className="p-6 flex flex-col justify-between border-t sm:border-t-0 border-gray-200">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Suhu Tubuh</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{hasil.inputSuhu} <span className="text-sm font-medium text-gray-500">°C</span></p>
                  </div>
                  <StatusEmojiMini status={hasil.suhuTubuh.emoji} size={32} />
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center border border-gray-100">
                  <span className="text-xs font-medium text-gray-600">Status</span>
                  <span className="font-bold text-gray-900">{hasil.inputSuhu >= 36.0 && hasil.inputSuhu <= 37.5 ? 'Normal' : 'Abnormal'}</span>
                </div>
              </div>
              
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
               <h3 className="text-sm font-semibold text-gray-900">Catatan Matematis</h3>
            </div>
            <div className="px-6 py-4">
              <code className="text-xs text-gray-600 block leading-relaxed font-mono bg-gray-50 p-4 rounded-md border border-gray-100">
                // Standar Deviasi (SD) WHO untuk umur {hasil.umurBulan} bulan<br/><br/>
                Z(TB/U) = ({hasil.inputTB} - {hasil.medianTBU}) / SD = <span className="font-bold text-gray-900">{hasil.zScoreTBU}</span><br/>
                Z(BB/U) = ({hasil.inputBB} - {hasil.medianBBU}) / SD = <span className="font-bold text-gray-900">{hasil.zScoreBBU}</span><br/>
                Z(LK/U) = ({hasil.inputLK} - {hasil.medianLKU}) / SD = <span className="font-bold text-gray-900">{hasil.zScoreLKU}</span>
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
