import { useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, collection, query, where, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { hitungAntropometri } from '../utils/zScoreCalculator';

export default function EdgeProcessor({ user }) {
  useEffect(() => {
    if (!user?.email) return;

    // Mendengarkan trigger langsung dari buffer alat ESP32
    const sensorRef = doc(db, "esp32_buffer", "device_01");
    
    const unsubscribe = onSnapshot(sensorRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Alat ESP32 akan mengirimkan status="SAVE_TRIGGERED" ketika bidan memencet tombol Simpan di alat
        if (data.status === "SAVE_TRIGGERED" && data.selectedNama) {
          try {
            console.log("Menerima instruksi simpan dari ESP32 untuk anak:", data.selectedNama);
            
            // 1. Cari profil lengkap anak di database berdasarkan nama yang dipilih di ESP32
            const q = query(
              collection(db, "anak"), 
              where("userEmail", "==", user.email), 
              where("nama", "==", data.selectedNama)
            );
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
              const anak = snapshot.docs[0].data();
              
              // 2. Otomatis hitung Z-Score berdasarkan usianya (Edge Computing)
              const hasil = hitungAntropometri({
                tinggiBadan: parseFloat(data.tinggiBadan),
                beratBadan: parseFloat(data.beratBadan),
                lingkarKepala: parseFloat(data.lingkarKepala),
                suhuTubuh: parseFloat(data.suhuTubuh),
                tanggalLahir: anak.tanggalLahir,
                jenisKelamin: anak.jenisKelamin,
              });

              // 3. Simpan permanen ke buku Riwayat Pengukuran
              const payload = {
                userEmail: user.email,
                nama: anak.nama,
                tanggalLahir: anak.tanggalLahir,
                jenisKelamin: anak.jenisKelamin,
                sumberData: 'esp32_otomatis',
                tinggiBadan: parseFloat(data.tinggiBadan),
                beratBadan: parseFloat(data.beratBadan),
                lingkarKepala: parseFloat(data.lingkarKepala),
                suhuTubuh: parseFloat(data.suhuTubuh),
                hasil,
                hasilStunting: hasil.stunting,
                timestamp: new Date().toISOString(),
              };

              await addDoc(collection(db, "pengukuran"), payload);
              
              // 4. Ubah status buffer kembali ke STANDBY agar web tidak menghitung 2 kali
              await updateDoc(sensorRef, { status: "STANDBY" });
              
              // 5. Beri tahu petugas di depan laptop
              alert(`IoT Sukses! Data tinggi/berat ${anak.nama} berhasil diterima dari alat dan disimpan ke database!`);
              
            } else {
              console.warn("Anak tidak ditemukan di database.");
              alert(`Gagal: Anak bernama ${data.selectedNama} tidak terdaftar di sistem. Harap daftarkan dulu di menu Pendaftaran Anak.`);
              await updateDoc(sensorRef, { status: "STANDBY" });
            }
          } catch (error) {
            console.error("Gagal memproses Edge Computing:", error);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Komponen ini tidak memiliki tampilan sama sekali (Ghost Component)
  return null; 
}
