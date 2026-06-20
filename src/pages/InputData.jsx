import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, where, deleteDoc, doc } from 'firebase/firestore';

export default function InputData({ user }) {
  const [formData, setFormData] = useState({
    nama: '', tanggalLahir: '', jenisKelamin: 'L'
  });
  const [profiles, setProfiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    const q = query(collection(db, "anak"), where("userEmail", "==", user.email));
    const unsub = onSnapshot(q, (snapshot) => {
      const dbData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProfiles(dbData);
    });
    return () => unsub();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (profiles.length >= 30) return alert("Batas Maksimal: 1 Akun hanya dapat memiliki 30 profil anak untuk tahap testing.");
    if (!formData.nama || !formData.tanggalLahir) return alert("Lengkapi data!");
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "anak"), {
        userEmail: user.email,
        nama: formData.nama,
        tanggalLahir: formData.tanggalLahir,
        jenisKelamin: formData.jenisKelamin,
        timestamp: new Date().toISOString()
      });
      setFormData({ nama: '', tanggalLahir: '', jenisKelamin: 'L' });
    } catch (error) {
      alert("Gagal mendaftar.");
    }
    setIsSubmitting(false);
  };

  const del = async (id) => {
    if (confirm("Hapus profil anak ini? (Data riwayat pengukurannya tidak akan terhapus)")) {
      await deleteDoc(doc(db, "anak", id));
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pendaftaran Profil Anak</h1>
        <p className="text-sm text-gray-500 mt-1">Daftarkan identitas anak di sini agar namanya muncul di layar alat ESP32.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Pendaftaran */}
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden h-fit">
          <div className="bg-teal-600 px-6 py-4">
            <h2 className="text-lg font-bold text-white">Buat Profil Baru</h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Panggilan Anak</label>
              <input type="text" value={formData.nama} onChange={e=>setFormData({...formData, nama: e.target.value})} className="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6 px-3" placeholder="Contoh: Dede Rizki" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
              <input type="date" value={formData.tanggalLahir} onChange={e=>setFormData({...formData, tanggalLahir: e.target.value})} className="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6 px-3" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Kelamin</label>
              <div className="flex gap-6 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="jk" checked={formData.jenisKelamin === 'L'} onChange={()=>setFormData({...formData, jenisKelamin: 'L'})} className="h-4 w-4 text-teal-600 focus:ring-teal-600 border-gray-300" />
                  <span className="text-sm font-medium text-gray-700">Laki-laki</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="jk" checked={formData.jenisKelamin === 'P'} onChange={()=>setFormData({...formData, jenisKelamin: 'P'})} className="h-4 w-4 text-teal-600 focus:ring-teal-600 border-gray-300" />
                  <span className="text-sm font-medium text-gray-700">Perempuan</span>
                </label>
              </div>
            </div>
            <button type="submit" disabled={isSubmitting || profiles.length >= 30} className="w-full justify-center rounded-md bg-teal-600 px-3 py-3 text-sm font-bold text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
              {profiles.length >= 30 ? 'Kuota Maksimal (30 Anak) Tercapai' : isSubmitting ? 'Mendaftarkan...' : 'Daftarkan Anak ke Database'}
            </button>
          </form>
        </div>

        {/* Daftar Anak */}
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden h-fit">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Anak Terdaftar</h2>
            <p className="text-xs text-gray-500 mt-1">Nama-nama ini akan tersinkronisasi dan dapat dipilih pada layar alat ESP32.</p>
          </div>
          {profiles.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <p className="text-sm text-gray-500">Belum ada anak yang didaftarkan.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {profiles.map(p => (
                <li key={p.id} className="flex justify-between gap-x-6 px-6 py-5 hover:bg-gray-50 transition-colors">
                  <div className="flex min-w-0 gap-x-4 items-center">
                    <div className="h-12 w-12 flex-none rounded-full bg-teal-100 flex items-center justify-center font-bold text-teal-800 text-lg">
                      {p.nama.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-auto">
                      <p className="text-base font-bold leading-6 text-gray-900">{p.nama}</p>
                      <p className="mt-1 flex items-center text-xs leading-5 text-gray-500 gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${p.jenisKelamin === 'L' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                          {p.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </span>
                        <span>Lahir: {new Date(p.tanggalLahir).toLocaleDateString('id-ID')}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button onClick={()=>del(p.id)} className="text-gray-400 hover:text-red-600 p-2 rounded hover:bg-red-50 transition-colors" title="Hapus Profil">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
