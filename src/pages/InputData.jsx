import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hitungAntropometri } from '../utils/zScoreCalculator';
import { db } from '../firebase';
import { collection, addDoc, doc, onSnapshot, query, where } from 'firebase/firestore';

const Field = ({ label, name, unit, formData, handleChange, errors, type='number', placeholder='0.0', disabled=false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`input-${name}`}>{label}</label>
    <div className="relative">
      <input 
        id={`input-${name}`} type={type} name={name} value={formData[name]} onChange={handleChange} placeholder={placeholder} step={type==='number' ? '0.1' : undefined} disabled={disabled}
        className={`block w-full rounded-md py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ${errors[name] ? 'ring-red-300 focus:ring-red-500 bg-red-50' : 'ring-gray-300 focus:ring-teal-600'} placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 px-3 ${unit ? 'pr-12' : ''} ${disabled ? 'bg-gray-100 text-gray-500' : ''}`}
      />
      {unit && <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"><span className="text-gray-500 sm:text-sm">{unit}</span></div>}
    </div>
    {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name]}</p>}
  </div>
);

export default function InputData({ user }) {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState('new');
  
  const [formData, setFormData] = useState({
    nama: '', tanggalLahir: '', jenisKelamin: 'L',
    tinggiBadan: '', beratBadan: '', lingkarKepala: '', suhuTubuh: '',
    sumberData: 'manual',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [liveSensor, setLiveSensor] = useState({
    tinggiBadan: 0, beratBadan: 0, lingkarKepala: 0, suhuTubuh: 0,
    terhubung: false, terakhirUpdate: null
  });

  // 1. Fetch Existing Profiles
  useEffect(() => {
    if (!user?.email) return;
    const q = query(collection(db, "pengukuran"), where("userEmail", "==", user.email));
    const unsub = onSnapshot(q, (snapshot) => {
      const map = new Map();
      snapshot.docs.forEach(doc => {
        const d = doc.data();
        if (d.nama && !map.has(d.nama)) {
          map.set(d.nama, { nama: d.nama, tanggalLahir: d.tanggalLahir, jenisKelamin: d.jenisKelamin });
        }
      });
      setProfiles(Array.from(map.values()));
    });
    return () => unsub();
  }, [user]);

  // 2. Listen to ESP32
  useEffect(() => {
    const sensorRef = doc(db, "esp32_buffer", "device_01");
    const unsubscribe = onSnapshot(sensorRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLiveSensor({
          tinggiBadan: data.tinggiBadan || 0, beratBadan: data.beratBadan || 0,
          lingkarKepala: data.lingkarKepala || 0, suhuTubuh: data.suhuTubuh || 0,
          terhubung: true, terakhirUpdate: data.timestamp ? new Date(data.timestamp) : new Date()
        });
      } else {
        setLiveSensor(prev => ({ ...prev, terhubung: false }));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleProfileChange = (e) => {
    const val = e.target.value;
    setSelectedProfile(val);
    if (val === 'new') {
      setFormData(p => ({ ...p, nama: '', tanggalLahir: '', jenisKelamin: 'L' }));
    } else {
      const prof = profiles.find(pr => pr.nama === val);
      if (prof) {
        setFormData(p => ({ ...p, nama: prof.nama, tanggalLahir: prof.tanggalLahir, jenisKelamin: prof.jenisKelamin }));
      }
    }
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!formData.nama.trim()) e.nama = 'Nama anak harus diisi';
    if (!formData.tanggalLahir) e.tanggalLahir = 'Tanggal lahir harus diisi';
    if (!formData.tinggiBadan || formData.tinggiBadan <= 0) e.tinggiBadan = 'Wajib';
    if (!formData.beratBadan  || formData.beratBadan  <= 0) e.beratBadan  = 'Wajib';
    if (!formData.lingkarKepala || formData.lingkarKepala <= 0) e.lingkarKepala = 'Wajib';
    if (!formData.suhuTubuh     || formData.suhuTubuh     <= 0) e.suhuTubuh = 'Wajib';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    
    try {
      const hasil = hitungAntropometri({
        tinggiBadan: parseFloat(formData.tinggiBadan), beratBadan: parseFloat(formData.beratBadan),
        lingkarKepala: parseFloat(formData.lingkarKepala), suhuTubuh: parseFloat(formData.suhuTubuh),
        tanggalLahir: formData.tanggalLahir, jenisKelamin: formData.jenisKelamin,
      });

      const payload = {
        userEmail: user?.email,
        nama: formData.nama, tanggalLahir: formData.tanggalLahir, jenisKelamin: formData.jenisKelamin,
        sumberData: formData.sumberData,
        tinggiBadan: parseFloat(formData.tinggiBadan), beratBadan: parseFloat(formData.beratBadan),
        lingkarKepala: parseFloat(formData.lingkarKepala), suhuTubuh: parseFloat(formData.suhuTubuh),
        hasil, hasilStunting: hasil.stunting, timestamp: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, "pengukuran"), payload);
      navigate('/hasil', { state: { data: { id: docRef.id, ...payload } } });
    } catch (error) {
      console.error("Gagal menyimpan ke Firestore", error);
      alert("Gagal menyimpan data. Periksa koneksi internet Anda.");
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleTarikDataESP32 = () => {
    if (!liveSensor.terhubung) { alert("ESP32 belum mengirim data ke cloud."); return; }
    setFormData(p => ({
      ...p,
      tinggiBadan: liveSensor.tinggiBadan.toString(), beratBadan: liveSensor.beratBadan.toString(),
      lingkarKepala: liveSensor.lingkarKepala.toString(), suhuTubuh: liveSensor.suhuTubuh.toString(),
      sumberData: 'esp32',
    }));
    setErrors({});
  };



  const isExistingProfile = selectedProfile !== 'new';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Input Pengukuran Si Kecil</h1>
        <p className="text-sm text-gray-500 mt-1">Masukkan data pengukuran anak Bunda secara manual atau sinkronisasi dengan sensor pintar ESP32.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
            
            {/* Pemilihan Profil Anak */}
            <div className="px-4 py-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-4 mb-6 gap-4">
                <h2 className="text-base font-semibold leading-7 text-gray-900">Profil Anak</h2>
                {profiles.length > 0 && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-500">Pilih Anak:</label>
                    <select value={selectedProfile} onChange={handleProfileChange} className="block w-full sm:w-auto rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-teal-600 sm:text-sm sm:leading-6 bg-white font-medium">
                      <option value="new">+ Tambah Anak Baru</option>
                      <optgroup label="Anak Anda">
                        {profiles.map(p => (
                          <option key={p.nama} value={p.nama}>{p.nama}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Nama Panggilan Anak" name="nama" type="text" placeholder="Contoh: Dede Rizki" disabled={isExistingProfile} formData={formData} handleChange={handleChange} errors={errors} />
                </div>
                <div>
                  <Field label="Tanggal Lahir" name="tanggalLahir" type="date" disabled={isExistingProfile} formData={formData} handleChange={handleChange} errors={errors} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="jenisKelamin" value="L" checked={formData.jenisKelamin === 'L'} onChange={handleChange} disabled={isExistingProfile} className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-600" />
                      <span className={`text-sm ${isExistingProfile ? 'text-gray-400' : 'text-gray-700'}`}>Laki-laki</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="jenisKelamin" value="P" checked={formData.jenisKelamin === 'P'} onChange={handleChange} disabled={isExistingProfile} className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-600" />
                      <span className={`text-sm ${isExistingProfile ? 'text-gray-400' : 'text-gray-700'}`}>Perempuan</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Pengukuran */}
            <div className="px-4 py-6 sm:p-8 border-t border-gray-200 bg-gray-50">
              <h2 className="text-base font-semibold leading-7 text-gray-900 border-b border-gray-200 pb-2 mb-6">Hasil Pengukuran Hari Ini</h2>
              <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                <Field label="Tinggi Badan" name="tinggiBadan" unit="cm" formData={formData} handleChange={handleChange} errors={errors} />
                <Field label="Berat Badan" name="beratBadan" unit="kg" formData={formData} handleChange={handleChange} errors={errors} />
                <Field label="Lingkar Kepala" name="lingkarKepala" unit="cm" formData={formData} handleChange={handleChange} errors={errors} />
                <Field label="Suhu Tubuh" name="suhuTubuh" unit="°C" formData={formData} handleChange={handleChange} errors={errors} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8 bg-white">
              <button type="submit" disabled={isSubmitting} className="rounded-md bg-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50 transition-colors">
                {isSubmitting ? 'Menyimpan ke Cloud...' : 'Simpan Data Pengukuran'}
              </button>
            </div>
          </form>
        </div>

        {/* PANEL ESP32 IOT */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6 sticky top-6">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${liveSensor.terhubung ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>
            </div>
            
            <h3 className="text-base font-semibold leading-6 text-gray-900">Sensor Pintar ESP32</h3>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Tinggi:</span>
                <span className="font-bold text-gray-900">{liveSensor.tinggiBadan} cm</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Berat:</span>
                <span className="font-bold text-gray-900">{liveSensor.beratBadan} kg</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Suhu:</span>
                <span className="font-bold text-gray-900">{liveSensor.suhuTubuh} °C</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">L. Kepala:</span>
                <span className="font-bold text-gray-900">{liveSensor.lingkarKepala} cm</span>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 mb-5">
              <div className="relative flex h-3 w-3">
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${liveSensor.terhubung ? 'bg-emerald-400 animate-ping' : 'bg-gray-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${liveSensor.terhubung ? 'bg-emerald-500' : 'bg-gray-500'}`}></span>
              </div>
              <span className={`text-sm font-medium ${liveSensor.terhubung ? 'text-emerald-600' : 'text-gray-500'}`}>
                {liveSensor.terhubung ? 'Sensor Standby (Cloud)' : 'Menunggu Alat Nyala...'}
              </span>
            </div>

            <button 
              onClick={handleTarikDataESP32} 
              disabled={!liveSensor.terhubung}
              className="w-full justify-center inline-flex items-center gap-2 rounded-md bg-white px-3 py-2.5 text-sm font-bold text-teal-700 shadow-sm ring-1 ring-inset ring-teal-600 hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Ambil Data ke Form
            </button>
            <p className="mt-3 text-xs text-center text-gray-400">
              Pilih profil anak di samping, posisikan anak di alat, lalu tekan tombol ini.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
