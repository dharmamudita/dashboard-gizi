import { useState } from 'react';
import { auth, setDisplayName } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password || (isRegister && !formData.name)) {
      setError('Mohon lengkapi semua kolom.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await setDisplayName(userCredential.user, formData.name);
        // Page will automatically reload/navigate via App.jsx's onAuthStateChanged
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        // Page will automatically navigate via onAuthStateChanged
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') setError('Email ini sudah terdaftar.');
      else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') setError('Email atau kata sandi salah.');
      else if (err.code === 'auth/weak-password') setError('Kata sandi terlalu lemah (minimal 6 karakter).');
      else setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Decorative Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-teal-100/50 blur-[100px]" />
        <div className="absolute top-[60%] -right-[10%] w-[60%] h-[60%] rounded-full bg-emerald-100/40 blur-[120px]" />
      </div>

      <div className="max-w-md w-full space-y-8 z-10 bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-xl border border-white">
        
        <div>
          <div className="mx-auto w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
            {isRegister ? 'Daftar Akun Baru' : 'Selamat Datang, Bunda'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Pantau selalu tumbuh kembang Si Kecil dengan mudah dan akurat.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 text-center font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Panggilan Bunda</label>
                <input name="name" type="text" required={isRegister} value={formData.name} onChange={handleChange} placeholder="Contoh: Bunda Sarah"
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Email</label>
              <input name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="bunda@email.com"
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kata Sandi</label>
              <input name="password" type="password" required value={formData.password} onChange={handleChange} placeholder="••••••••" minLength="6"
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <button type="submit" disabled={loading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 shadow-md transition-all active:scale-[0.98] disabled:opacity-70">
              {loading ? 'Memproses...' : (isRegister ? 'Daftar Sekarang' : 'Masuk ke Dashboard')}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isRegister ? 'Sudah punya akun? ' : 'Belum punya akun? '}
            <button onClick={() => { setIsRegister(!isRegister); setError(''); setFormData({name:'', email:'', password:''}) }} className="font-bold text-teal-600 hover:text-teal-500">
              {isRegister ? 'Masuk di sini' : 'Daftar sekarang'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
