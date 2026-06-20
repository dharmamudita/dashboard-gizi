#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h> // Pastikan Anda menginstall library "ArduinoJson" by Benoit Blanchon di Arduino IDE
#include <vector>        // Menggunakan Dynamic Array (Tanpa Batas Kuota)

// Ganti dengan konfigurasi WiFi Anda
const char* ssid = "NAMA_WIFI_ANDA";
const char* password = "PASSWORD_WIFI_ANDA";

// ====================================================================================================
// URL AJAIB FIREBASE REST API
// ====================================================================================================
// 1. URL untuk menarik (GET) daftar anak dari database tanpa batas
const char* getUrl = "https://firestore.googleapis.com/v1/projects/dashboard-4a21c/databases/(default)/documents/anak";

// 2. URL untuk menembakkan (PATCH) hasil pengukuran ke mesin penerima di Web
const char* patchUrl = "https://firestore.googleapis.com/v1/projects/dashboard-4a21c/databases/(default)/documents/esp32_buffer/device_01?updateMask.fieldPaths=status&updateMask.fieldPaths=selectedNama&updateMask.fieldPaths=selectedEmail&updateMask.fieldPaths=tinggiBadan&updateMask.fieldPaths=beratBadan&updateMask.fieldPaths=lingkarKepala&updateMask.fieldPaths=suhuTubuh";
// ====================================================================================================

struct Anak {
  String nama;
  String email;
};

// Dynamic Array penampung data (TIDAK ADA BATASAN JUMLAH ANAK)
std::vector<Anak> daftarAnak; 
int currentIndex = 0; // Kursor penunjuk anak yang sedang dipilih

// Konfigurasi Tombol Simulasi ESP32
const int btnNext = 4; // Colok tombol NEXT ke Pin GPIO 4
const int btnSend = 5; // Colok tombol SIMPAN ke Pin GPIO 5

void setup() {
  Serial.begin(115200);
  pinMode(btnNext, INPUT_PULLUP);
  pinMode(btnSend, INPUT_PULLUP);

  // 1. KONEKSI KE WIFI
  Serial.println("================================");
  Serial.print("Mencari WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Berhasil Terkoneksi!");
  Serial.println("================================");

  // 2. SEDOT DATA ANAK DARI DATABASE
  fetchDaftarAnak();
}

void loop() {
  // Aksi jika Bidan menekan tombol NEXT
  if (digitalRead(btnNext) == LOW) {
    delay(200); // Mencegah bouncing tombol
    
    if (daftarAnak.size() > 0) {
      currentIndex++;
      if (currentIndex >= daftarAnak.size()) currentIndex = 0; // Looping kembali ke anak pertama
      
      // Programmer LCD: Ganti baris Serial.print di bawah ini menjadi lcd.print()
      Serial.println("\n--- TAMPILAN LCD ---");
      Serial.print("Pilih Anak (");
      Serial.print(currentIndex + 1);
      Serial.print("/");
      Serial.print(daftarAnak.size());
      Serial.println(")");
      Serial.print("> ");
      Serial.println(daftarAnak[currentIndex].nama);
      Serial.println("--------------------");
    }
  }

  // Aksi jika Bidan menekan tombol SIMPAN / KIRIM
  if (digitalRead(btnSend) == LOW) {
    delay(200); // Mencegah bouncing tombol
    if (daftarAnak.size() > 0) {
      sendDataKeWeb(daftarAnak[currentIndex]);
    } else {
      Serial.println("Gagal: Belum ada data anak di memori ESP32!");
    }
  }
}

// ====================================================================================================
// FUNGSI INTI: MENYEDOT DATA DARI WEB (GET)
// ====================================================================================================
void fetchDaftarAnak() {
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Menyadur data dari Firebase...");
    
    HTTPClient http;
    http.begin(getUrl);
    int httpCode = http.GET();

    if (httpCode > 0) {
      String payload = http.getString();
      
      // Membongkar JSON dari Firebase
      // Jika error "No memory", besarkan angka 8192 di bawah ini!
      DynamicJsonDocument doc(8192); 
      DeserializationError error = deserializeJson(doc, payload);

      if (error) {
        Serial.print("Error Pembacaan JSON: ");
        Serial.println(error.c_str());
        return;
      }

      // Bersihkan memori array lama sebelum memasukkan yang baru
      daftarAnak.clear(); 
      
      JsonArray documents = doc["documents"];
      
      for (JsonObject document : documents) {
        String nama = document["fields"]["nama"]["stringValue"];
        String email = document["fields"]["userEmail"]["stringValue"];
        
        // Simpan ke memori alat secara dinamis (unlimited)
        daftarAnak.push_back({nama, email});
      }
      
      Serial.print("Berhasil! Menemukan ");
      Serial.print(daftarAnak.size());
      Serial.println(" data anak di database tanpa batas limit.");
      
      // Tampilkan instruksi untuk Bidan
      if (daftarAnak.size() > 0) {
        Serial.println("\nTekan tombol NEXT (Pin 4) untuk menggeser nama anak.");
        Serial.println("Tekan tombol KIRIM (Pin 5) untuk menimbang & mengirim data anak.");
        Serial.print("\n> ");
        Serial.println(daftarAnak[0].nama);
      }
      
    } else {
      Serial.print("HTTP GET Error Code: ");
      Serial.println(httpCode);
    }
    http.end();
  }
}


// ====================================================================================================
// FUNGSI INTI: MENGIRIM DATA HASIL UKUR KE WEB (PATCH)
// ====================================================================================================
void sendDataKeWeb(Anak anakTerpilih) {
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Mengukur & Mengirim data milik: ");
    Serial.println(anakTerpilih.nama);
    
    // ==================================================================
    // INTEGRASI SENSOR: Ganti angka mati di bawah ini dengan fungsi
    // pembacaan sensor Loadcell HX711, HC-SR04, dan DS18B20 Anda!
    // ==================================================================
    float bacaanSensorTinggi = 85.5;
    float bacaanSensorBerat = 12.4;
    float bacaanSensorLingkar = 48.0;
    float bacaanSensorSuhu = 36.5;

    // Merakit Paket Data JSON
    DynamicJsonDocument doc(1024);
    JsonObject fields = doc.createNestedObject("fields");
    
    fields["status"]["stringValue"] = "SAVE_TRIGGERED"; // Kunci Gaib
    fields["selectedNama"]["stringValue"] = anakTerpilih.nama;
    fields["selectedEmail"]["stringValue"] = anakTerpilih.email; // Kunci Keamanan Multi-Tenant
    fields["tinggiBadan"]["doubleValue"] = bacaanSensorTinggi;
    fields["beratBadan"]["doubleValue"] = bacaanSensorBerat;
    fields["lingkarKepala"]["doubleValue"] = bacaanSensorLingkar;
    fields["suhuTubuh"]["doubleValue"] = bacaanSensorSuhu;

    String jsonPayload;
    serializeJson(doc, jsonPayload);

    // Kirim Paket Data
    HTTPClient http;
    http.begin(patchUrl);
    http.addHeader("Content-Type", "application/json");
    
    int httpCode = http.PATCH(jsonPayload);
    
    if (httpCode > 0) {
      Serial.println("\n==============================================");
      Serial.println(" SUKSES DIKIRIM KE AWAN! ");
      Serial.println(" Silakan Minta Bidan Mengecek Layar Laptopnya.");
      Serial.println("==============================================");
    } else {
      Serial.print("Gagal Mengirim! HTTP Error Code: ");
      Serial.println(httpCode);
    }
    http.end();
  }
}
