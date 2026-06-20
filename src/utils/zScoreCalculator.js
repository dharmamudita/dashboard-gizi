/**
 * Z-Score Calculator berdasarkan Standar WHO
 * 
 * Referensi: WHO Child Growth Standards
 * - TB/U (Tinggi Badan / Umur) → Stunting
 * - BB/U (Berat Badan / Umur) → Underweight
 * - BB/TB (Berat Badan / Tinggi Badan) → Wasting
 * 
 * Rumus: Z = (Nilai Pengukuran - Median WHO) / SD WHO
 */

// Data referensi WHO untuk TB/U (Tinggi Badan menurut Umur) - Laki-laki
// Format: { umur_bulan: { median, sd } }
const TB_U_LAKI = {
  0: { median: 49.9, sd: 1.8931 },
  1: { median: 54.7, sd: 2.0245 },
  2: { median: 58.4, sd: 2.1006 },
  3: { median: 61.4, sd: 2.1240 },
  4: { median: 63.9, sd: 2.1363 },
  5: { median: 65.9, sd: 2.1505 },
  6: { median: 67.6, sd: 2.1719 },
  7: { median: 69.2, sd: 2.1964 },
  8: { median: 70.6, sd: 2.2212 },
  9: { median: 72.0, sd: 2.2452 },
  10: { median: 73.3, sd: 2.2669 },
  11: { median: 74.5, sd: 2.2870 },
  12: { median: 75.7, sd: 2.3065 },
  13: { median: 76.9, sd: 2.3269 },
  14: { median: 78.0, sd: 2.3487 },
  15: { median: 79.1, sd: 2.3717 },
  16: { median: 80.2, sd: 2.3956 },
  17: { median: 81.2, sd: 2.4197 },
  18: { median: 82.3, sd: 2.4438 },
  19: { median: 83.2, sd: 2.4672 },
  20: { median: 84.2, sd: 2.4900 },
  21: { median: 85.1, sd: 2.5124 },
  22: { median: 86.0, sd: 2.5348 },
  23: { median: 86.9, sd: 2.5578 },
  24: { median: 87.8, sd: 2.5816 },
  30: { median: 91.9, sd: 2.7065 },
  36: { median: 96.1, sd: 2.8495 },
  42: { median: 99.9, sd: 2.9898 },
  48: { median: 103.3, sd: 3.1175 },
  54: { median: 106.7, sd: 3.2433 },
  60: { median: 110.0, sd: 3.3697 },
};

// Data referensi WHO untuk TB/U (Tinggi Badan menurut Umur) - Perempuan
const TB_U_PEREMPUAN = {
  0: { median: 49.1, sd: 1.8627 },
  1: { median: 53.7, sd: 1.9542 },
  2: { median: 57.1, sd: 2.0362 },
  3: { median: 59.8, sd: 2.0826 },
  4: { median: 62.1, sd: 2.1175 },
  5: { median: 64.0, sd: 2.1476 },
  6: { median: 65.7, sd: 2.1757 },
  7: { median: 67.3, sd: 2.2044 },
  8: { median: 68.7, sd: 2.2347 },
  9: { median: 70.1, sd: 2.2660 },
  10: { median: 71.5, sd: 2.2969 },
  11: { median: 72.8, sd: 2.3264 },
  12: { median: 74.0, sd: 2.3541 },
  13: { median: 75.2, sd: 2.3808 },
  14: { median: 76.4, sd: 2.4070 },
  15: { median: 77.5, sd: 2.4337 },
  16: { median: 78.6, sd: 2.4607 },
  17: { median: 79.7, sd: 2.4879 },
  18: { median: 80.7, sd: 2.5145 },
  19: { median: 81.7, sd: 2.5402 },
  20: { median: 82.7, sd: 2.5651 },
  21: { median: 83.7, sd: 2.5894 },
  22: { median: 84.6, sd: 2.6133 },
  23: { median: 85.5, sd: 2.6375 },
  24: { median: 86.4, sd: 2.6622 },
  30: { median: 90.7, sd: 2.8052 },
  36: { median: 95.1, sd: 2.9695 },
  42: { median: 99.1, sd: 3.1273 },
  48: { median: 102.7, sd: 3.2671 },
  54: { median: 106.2, sd: 3.3985 },
  60: { median: 109.4, sd: 3.5263 },
};

// Data referensi WHO untuk BB/U (Berat Badan menurut Umur) - Laki-laki
const BB_U_LAKI = {
  0: { median: 3.3, sd: 0.4482 },
  1: { median: 4.5, sd: 0.5392 },
  2: { median: 5.6, sd: 0.6117 },
  3: { median: 6.4, sd: 0.6619 },
  4: { median: 7.0, sd: 0.6984 },
  5: { median: 7.5, sd: 0.7270 },
  6: { median: 7.9, sd: 0.7516 },
  7: { median: 8.3, sd: 0.7745 },
  8: { median: 8.6, sd: 0.7960 },
  9: { median: 8.9, sd: 0.8167 },
  10: { median: 9.2, sd: 0.8369 },
  11: { median: 9.4, sd: 0.8565 },
  12: { median: 9.6, sd: 0.8758 },
  13: { median: 9.9, sd: 0.8959 },
  14: { median: 10.1, sd: 0.9165 },
  15: { median: 10.3, sd: 0.9374 },
  16: { median: 10.5, sd: 0.9582 },
  17: { median: 10.7, sd: 0.9786 },
  18: { median: 10.9, sd: 0.9985 },
  19: { median: 11.1, sd: 1.0179 },
  20: { median: 11.3, sd: 1.0367 },
  21: { median: 11.5, sd: 1.0550 },
  22: { median: 11.8, sd: 1.0730 },
  23: { median: 12.0, sd: 1.0907 },
  24: { median: 12.2, sd: 1.1084 },
  30: { median: 13.3, sd: 1.1926 },
  36: { median: 14.3, sd: 1.2812 },
  42: { median: 15.3, sd: 1.3819 },
  48: { median: 16.3, sd: 1.4944 },
  54: { median: 17.3, sd: 1.6174 },
  60: { median: 18.3, sd: 1.7484 },
};

// Data referensi WHO untuk BB/U (Berat Badan menurut Umur) - Perempuan
const BB_U_PEREMPUAN = {
  0: { median: 3.2, sd: 0.4341 },
  1: { median: 4.2, sd: 0.4974 },
  2: { median: 5.1, sd: 0.5597 },
  3: { median: 5.8, sd: 0.6073 },
  4: { median: 6.4, sd: 0.6449 },
  5: { median: 6.9, sd: 0.6762 },
  6: { median: 7.3, sd: 0.7041 },
  7: { median: 7.6, sd: 0.7302 },
  8: { median: 7.9, sd: 0.7560 },
  9: { median: 8.2, sd: 0.7813 },
  10: { median: 8.5, sd: 0.8065 },
  11: { median: 8.7, sd: 0.8310 },
  12: { median: 8.9, sd: 0.8549 },
  13: { median: 9.2, sd: 0.8791 },
  14: { median: 9.4, sd: 0.9032 },
  15: { median: 9.6, sd: 0.9272 },
  16: { median: 9.8, sd: 0.9506 },
  17: { median: 10.0, sd: 0.9734 },
  18: { median: 10.2, sd: 0.9952 },
  19: { median: 10.4, sd: 1.0162 },
  20: { median: 10.6, sd: 1.0367 },
  21: { median: 10.9, sd: 1.0570 },
  22: { median: 11.1, sd: 1.0771 },
  23: { median: 11.3, sd: 1.0972 },
  24: { median: 11.5, sd: 1.1175 },
  30: { median: 12.7, sd: 1.2267 },
  36: { median: 13.9, sd: 1.3549 },
  42: { median: 15.0, sd: 1.5001 },
  48: { median: 16.1, sd: 1.6582 },
  54: { median: 17.2, sd: 1.8255 },
  60: { median: 18.2, sd: 1.9968 },
};

// Data referensi WHO untuk Lingkar Kepala menurut Umur - Laki-laki
const LK_U_LAKI = {
  0: { median: 34.5, sd: 1.1547 },
  1: { median: 37.3, sd: 1.1737 },
  2: { median: 39.1, sd: 1.1875 },
  3: { median: 40.5, sd: 1.1918 },
  4: { median: 41.6, sd: 1.1919 },
  5: { median: 42.6, sd: 1.1910 },
  6: { median: 43.3, sd: 1.1899 },
  7: { median: 44.0, sd: 1.1892 },
  8: { median: 44.5, sd: 1.1891 },
  9: { median: 45.0, sd: 1.1895 },
  10: { median: 45.4, sd: 1.1903 },
  11: { median: 45.8, sd: 1.1914 },
  12: { median: 46.1, sd: 1.1927 },
  18: { median: 47.4, sd: 1.2077 },
  24: { median: 48.3, sd: 1.2258 },
  36: { median: 49.5, sd: 1.2510 },
  48: { median: 50.3, sd: 1.2645 },
  60: { median: 50.7, sd: 1.2734 },
};

// Data referensi WHO untuk Lingkar Kepala menurut Umur - Perempuan
const LK_U_PEREMPUAN = {
  0: { median: 33.9, sd: 1.1247 },
  1: { median: 36.5, sd: 1.1320 },
  2: { median: 38.3, sd: 1.1392 },
  3: { median: 39.5, sd: 1.1422 },
  4: { median: 40.6, sd: 1.1438 },
  5: { median: 41.5, sd: 1.1449 },
  6: { median: 42.2, sd: 1.1455 },
  7: { median: 42.8, sd: 1.1462 },
  8: { median: 43.4, sd: 1.1472 },
  9: { median: 43.8, sd: 1.1484 },
  10: { median: 44.2, sd: 1.1498 },
  11: { median: 44.6, sd: 1.1514 },
  12: { median: 44.9, sd: 1.1531 },
  18: { median: 46.2, sd: 1.1665 },
  24: { median: 47.1, sd: 1.1815 },
  36: { median: 48.3, sd: 1.2023 },
  48: { median: 49.1, sd: 1.2140 },
  60: { median: 49.6, sd: 1.2225 },
};

/**
 * Interpolasi linear untuk mendapatkan nilai median dan SD di antara titik data
 */
function interpolateWHOData(dataTable, umurBulan) {
  const ages = Object.keys(dataTable).map(Number).sort((a, b) => a - b);
  
  // Jika umur persis ada di tabel
  if (dataTable[umurBulan]) {
    return dataTable[umurBulan];
  }
  
  // Cari batas atas dan bawah
  let lower = ages[0];
  let upper = ages[ages.length - 1];
  
  for (let i = 0; i < ages.length - 1; i++) {
    if (umurBulan >= ages[i] && umurBulan <= ages[i + 1]) {
      lower = ages[i];
      upper = ages[i + 1];
      break;
    }
  }
  
  // Clamp ke batas
  if (umurBulan <= ages[0]) return dataTable[ages[0]];
  if (umurBulan >= ages[ages.length - 1]) return dataTable[ages[ages.length - 1]];
  
  // Interpolasi linear
  const ratio = (umurBulan - lower) / (upper - lower);
  return {
    median: dataTable[lower].median + ratio * (dataTable[upper].median - dataTable[lower].median),
    sd: dataTable[lower].sd + ratio * (dataTable[upper].sd - dataTable[lower].sd),
  };
}

/**
 * Hitung Z-Score
 * @param {number} nilaiPengukuran - Nilai yang diukur
 * @param {number} median - Median WHO
 * @param {number} sd - Standard Deviation WHO
 * @returns {number} Z-Score
 */
function hitungZScore(nilaiPengukuran, median, sd) {
  if (sd === 0) return 0;
  return (nilaiPengukuran - median) / sd;
}

/**
 * Klasifikasi status stunting berdasarkan Z-Score TB/U
 */
export function klasifikasiStunting(zScore) {
  if (zScore < -3) {
    return {
      status: 'Sangat Pendek',
      kategori: 'severely_stunted',
      label: 'Severely Stunted',
      emoji: 'sad',
      color: 'danger',
      description: 'Anak mengalami stunting berat. Perlu penanganan medis segera.',
    };
  } else if (zScore < -2) {
    return {
      status: 'Pendek',
      kategori: 'stunted',
      label: 'Stunted',
      emoji: 'neutral',
      color: 'warning',
      description: 'Anak terindikasi stunting. Perlu perhatian khusus pada asupan gizi.',
    };
  } else if (zScore <= 3) {
    return {
      status: 'Normal',
      kategori: 'normal',
      label: 'Normal',
      emoji: 'happy',
      color: 'success',
      description: 'Tinggi badan anak sesuai dengan standar WHO. Pertahankan pola makan sehat.',
    };
  } else {
    return {
      status: 'Tinggi',
      kategori: 'tall',
      label: 'Tinggi',
      emoji: 'happy',
      color: 'success',
      description: 'Tinggi badan anak di atas rata-rata standar WHO.',
    };
  }
}

/**
 * Klasifikasi status berat badan berdasarkan Z-Score BB/U
 */
export function klasifikasiBB(zScore) {
  if (zScore < -3) {
    return {
      status: 'BB Sangat Kurang',
      kategori: 'severely_underweight',
      label: 'Severely Underweight',
      emoji: 'sad',
      color: 'danger',
    };
  } else if (zScore < -2) {
    return {
      status: 'BB Kurang',
      kategori: 'underweight',
      label: 'Underweight',
      emoji: 'neutral',
      color: 'warning',
    };
  } else if (zScore <= 1) {
    return {
      status: 'BB Normal',
      kategori: 'normal',
      label: 'Normal',
      emoji: 'happy',
      color: 'success',
    };
  } else {
    return {
      status: 'BB Lebih',
      kategori: 'overweight',
      label: 'Risiko BB Lebih',
      emoji: 'neutral',
      color: 'warning',
    };
  }
}

/**
 * Hitung umur dalam bulan dari tanggal lahir
 * @param {string|Date} tanggalLahir 
 * @returns {number} umur dalam bulan
 */
export function hitungUmurBulan(tanggalLahir) {
  const lahir = new Date(tanggalLahir);
  const sekarang = new Date();
  let bulan = (sekarang.getFullYear() - lahir.getFullYear()) * 12;
  bulan += sekarang.getMonth() - lahir.getMonth();
  if (sekarang.getDate() < lahir.getDate()) bulan--;
  return Math.max(0, bulan);
}

/**
 * Hitung semua indeks antropometri
 * @param {Object} data - Data pengukuran anak
 * @param {number} data.tinggiBadan - Tinggi badan (cm)
 * @param {number} data.beratBadan - Berat badan (kg)
 * @param {number} data.lingkarKepala - Lingkar kepala (cm)
 * @param {number} data.suhuTubuh - Suhu tubuh (°C)
 * @param {string} data.tanggalLahir - Tanggal lahir (YYYY-MM-DD)
 * @param {string} data.jenisKelamin - 'L' atau 'P'
 * @returns {Object} Hasil perhitungan
 */
export function hitungAntropometri(data) {
  const { tinggiBadan, beratBadan, lingkarKepala, suhuTubuh, tanggalLahir, jenisKelamin } = data;
  const umurBulan = hitungUmurBulan(tanggalLahir);
  
  // Pilih tabel referensi berdasarkan jenis kelamin
  const tabelTBU = jenisKelamin === 'L' ? TB_U_LAKI : TB_U_PEREMPUAN;
  const tabelBBU = jenisKelamin === 'L' ? BB_U_LAKI : BB_U_PEREMPUAN;
  const tabelLKU = jenisKelamin === 'L' ? LK_U_LAKI : LK_U_PEREMPUAN;
  
  // Dapatkan data referensi WHO
  const refTBU = interpolateWHOData(tabelTBU, umurBulan);
  const refBBU = interpolateWHOData(tabelBBU, umurBulan);
  const refLKU = interpolateWHOData(tabelLKU, umurBulan);
  
  // Hitung Z-Scores
  const zScoreTBU = hitungZScore(tinggiBadan, refTBU.median, refTBU.sd);
  const zScoreBBU = hitungZScore(beratBadan, refBBU.median, refBBU.sd);
  const zScoreLKU = hitungZScore(lingkarKepala, refLKU.median, refLKU.sd);
  
  // Klasifikasi
  const hasilStunting = klasifikasiStunting(zScoreTBU);
  const hasilBB = klasifikasiBB(zScoreBBU);
  
  // Status suhu tubuh
  let statusSuhu = { status: 'Normal', color: 'success', emoji: 'happy' };
  if (suhuTubuh < 36.0) {
    statusSuhu = { status: 'Hipotermia', color: 'warning', emoji: 'neutral' };
  } else if (suhuTubuh > 37.5) {
    statusSuhu = { status: 'Demam', color: 'danger', emoji: 'sad' };
  }
  
  return {
    umurBulan,
    // Z-Scores
    zScoreTBU: Math.round(zScoreTBU * 100) / 100,
    zScoreBBU: Math.round(zScoreBBU * 100) / 100,
    zScoreLKU: Math.round(zScoreLKU * 100) / 100,
    // Referensi WHO
    medianTBU: Math.round(refTBU.median * 10) / 10,
    medianBBU: Math.round(refBBU.median * 10) / 10,
    medianLKU: Math.round(refLKU.median * 10) / 10,
    // Klasifikasi
    stunting: hasilStunting,
    beratBadan: hasilBB,
    suhuTubuh: statusSuhu,
    // Data input
    inputTB: tinggiBadan,
    inputBB: beratBadan,
    inputLK: lingkarKepala,
    inputSuhu: suhuTubuh,
  };
}

/**
 * Tentukan status keseluruhan berdasarkan semua indikator
 */
export function statusKeseluruhan(hasil) {
  if (hasil.stunting.kategori === 'severely_stunted' || 
      hasil.beratBadan.kategori === 'severely_underweight' ||
      hasil.suhuTubuh.status === 'Demam') {
    return 'sad';
  } else if (hasil.stunting.kategori === 'stunted' || 
             hasil.beratBadan.kategori === 'underweight' ||
             hasil.suhuTubuh.status === 'Hipotermia') {
    return 'neutral';
  }
  return 'happy';
}
