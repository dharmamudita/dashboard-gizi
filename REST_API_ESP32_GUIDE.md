# Panduan Integrasi ESP32 ke Web Antropometri Pintar

Dokumen ini ditujukan untuk **Hardware/C++ Programmer** yang memprogram alat ukur ESP32. Arsitektur web telah diubah sehingga alat fisik Anda kini menjadi **Pusat Kendali Utama**.

## Alur Kerja Alat ESP32
1. Saat alat dinyalakan, alat harus **Menarik (GET)** daftar nama anak dari Firestore REST API.
2. Tampilkan daftar nama tersebut di layar LCD/OLED agar bidan bisa memilih.
3. Setelah bidan memilih nama (misal: "Rizki") dan melakukan pengukuran, alat **Mengirim (PATCH)** data pengukuran + nama anak ke _Buffer Firebase_.
4. Web secara gaib akan menangkap data tersebut, menghitung nilai gizinya, dan menyimpannya secara permanen.

---

## 1. Cara Menarik (GET) Daftar Anak

Gunakan `HTTP GET` ke URL REST API Firebase Anda.

**URL Endpoint:**
```
https://firestore.googleapis.com/v1/projects/dashboard-4a21c/databases/(default)/documents/anak
```

**Contoh Response JSON dari Firebase:**
Alat harus mem-*parsing* JSON ini untuk mengambil _array_ `nama` untuk ditampilkan di LCD.
```json
{
  "documents": [
    {
      "name": "projects/dashboard-4a21c/databases/(default)/documents/anak/ID_UNIK",
      "fields": {
        "nama": { "stringValue": "Dede Rizki" },
        "jenisKelamin": { "stringValue": "L" },
        "tanggalLahir": { "stringValue": "2024-01-01" },
        "userEmail": { "stringValue": "emailbunda@gmail.com" }
      }
    }
  ]
}
```
*(Catatan: Anda bisa memfilter berdasarkan email klinik jika perlu dengan menambahkan parameter query `structuredQuery` pada REST API).*

---

## 2. Cara Mengirim Data & Memicu Penyimpanan Otomatis

Setelah bidan mengukur tinggi dan berat badan "Dede Rizki", alat ESP32 harus mengirim (*Update/Patch*) data tersebut ke lokasi _Buffer_ perangkat.

**URL Endpoint:**
```
https://firestore.googleapis.com/v1/projects/dashboard-4a21c/databases/(default)/documents/esp32_buffer/device_01?updateMask.fieldPaths=status&updateMask.fieldPaths=selectedNama&updateMask.fieldPaths=selectedEmail&updateMask.fieldPaths=tinggiBadan&updateMask.fieldPaths=beratBadan&updateMask.fieldPaths=lingkarKepala&updateMask.fieldPaths=suhuTubuh
```

**Method:** `PATCH`

**Payload JSON yang harus dikirim ESP32:**
*(PENTING: Nilai `status` WAJIB diset menjadi `"SAVE_TRIGGERED"`)*
```json
{
  "fields": {
    "status": { "stringValue": "SAVE_TRIGGERED" },
    "selectedNama": { "stringValue": "Dede Rizki" },
    "selectedEmail": { "stringValue": "emailbunda@gmail.com" },
    "tinggiBadan": { "doubleValue": 85.5 },
    "beratBadan": { "doubleValue": 12.4 },
    "lingkarKepala": { "doubleValue": 48.0 },
    "suhuTubuh": { "doubleValue": 36.5 }
  }
}
```

### Penjelasan Variabel:
- `status`: **(WAJIB)** Harus dikirim dengan nilai `"SAVE_TRIGGERED"`. String inilah yang memicu Web App yang sedang terbuka di laptop untuk bereaksi.
- `selectedNama`: **(WAJIB)** Nama anak yang dipilih di alat.
- `selectedEmail`: **(WAJIB)** Email milik akun Bunda dari anak tersebut (yang ditarik dari fungsi GET sebelumnya). Ini memastikan keamanan agar data tidak nyasar ke web/akun orang lain jika ada 10 Bunda yang login bersamaan.

Dengan menggunakan metode ini, beban komputasi Z-Score WHO yang sangat berat telah dipindahkan ke laptop/web, sehingga ESP32 Anda bisa bekerja dengan sangat ringan dan cepat!
