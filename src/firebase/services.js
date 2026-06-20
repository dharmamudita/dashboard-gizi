import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query, 
  orderBy, 
  where,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from './config';

const COLLECTION_NAME = 'pengukuran_balita';
const CHILDREN_COLLECTION = 'data_anak';

// ============ DATA ANAK ============

/**
 * Tambah data anak baru
 */
export async function tambahAnak(dataAnak) {
  try {
    const docRef = await addDoc(collection(db, CHILDREN_COLLECTION), {
      ...dataAnak,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...dataAnak };
  } catch (error) {
    console.error('Error menambah data anak:', error);
    throw error;
  }
}

/**
 * Ambil semua data anak
 */
export async function ambilSemuaAnak() {
  try {
    const q = query(collection(db, CHILDREN_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error mengambil data anak:', error);
    throw error;
  }
}

/**
 * Ambil data anak berdasarkan ID
 */
export async function ambilAnak(id) {
  try {
    const docRef = doc(db, CHILDREN_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error mengambil data anak:', error);
    throw error;
  }
}

// ============ PENGUKURAN ============

/**
 * Simpan hasil pengukuran
 */
export async function simpanPengukuran(dataPengukuran) {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...dataPengukuran,
      timestamp: serverTimestamp(),
    });
    return { id: docRef.id, ...dataPengukuran };
  } catch (error) {
    console.error('Error menyimpan pengukuran:', error);
    throw error;
  }
}

/**
 * Ambil semua riwayat pengukuran
 */
export async function ambilSemuaPengukuran() {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error mengambil pengukuran:', error);
    throw error;
  }
}

/**
 * Ambil pengukuran berdasarkan ID anak
 */
export async function ambilPengukuranAnak(anakId) {
  try {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('anakId', '==', anakId),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error mengambil pengukuran anak:', error);
    throw error;
  }
}

/**
 * Hapus pengukuran
 */
export async function hapusPengukuran(id) {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Error menghapus pengukuran:', error);
    throw error;
  }
}

/**
 * Update pengukuran
 */
export async function updatePengukuran(id, data) {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
  } catch (error) {
    console.error('Error mengupdate pengukuran:', error);
    throw error;
  }
}

// ============ REALTIME LISTENER (untuk ESP32) ============

/**
 * Listen realtime data dari ESP32
 * ESP32 akan mengirim data ke collection 'esp32_readings'
 */
export function listenESP32Data(callback) {
  const q = query(
    collection(db, 'esp32_readings'), 
    orderBy('timestamp', 'desc'),
    limit(1)
  );
  
  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added' || change.type === 'modified') {
        callback({ id: change.doc.id, ...change.doc.data() });
      }
    });
  });
}

/**
 * Listen realtime semua pengukuran (untuk dashboard)
 */
export function listenPengukuran(callback) {
  const q = query(
    collection(db, COLLECTION_NAME), 
    orderBy('timestamp', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
}

// ============ STATISTIK ============

/**
 * Hitung statistik untuk dashboard
 */
export async function hitungStatistik() {
  try {
    const pengukuran = await ambilSemuaPengukuran();
    
    const total = pengukuran.length;
    const normal = pengukuran.filter(p => p.hasilStunting?.kategori === 'normal' || p.hasilStunting?.kategori === 'tall').length;
    const stunted = pengukuran.filter(p => p.hasilStunting?.kategori === 'stunted').length;
    const severelyStunted = pengukuran.filter(p => p.hasilStunting?.kategori === 'severely_stunted').length;
    
    return {
      total,
      normal,
      stunted,
      severelyStunted,
      persentaseNormal: total > 0 ? Math.round((normal / total) * 100) : 0,
      persentaseStunting: total > 0 ? Math.round(((stunted + severelyStunted) / total) * 100) : 0,
    };
  } catch (error) {
    console.error('Error menghitung statistik:', error);
    return { total: 0, normal: 0, stunted: 0, severelyStunted: 0, persentaseNormal: 0, persentaseStunting: 0 };
  }
}
