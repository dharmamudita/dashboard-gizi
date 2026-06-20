#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h> 
#include <vector>        

// ====================================================================================================
// IMPORT LIBRARY SENSOR SPESIFIK (Wajib di-install di Arduino IDE)
// ====================================================================================================
#include <Wire.h>
#include "Adafruit_VL53L0X.h"   // Sensor Tinggi Badan
#include "HX711.h"              // Sensor Berat Badan (4x Loadcell)
#include <Adafruit_MLX90614.h>  // Sensor Suhu Tubuh (Infrared)
// #include "Adafruit_VL53L1X.h" // Untuk 6 Sensor Lingkar Kepala (Wajib pakai modul I2C Multiplexer TCA9548A)

// Ganti dengan konfigurasi WiFi Anda
const char* ssid = "NAMA_WIFI_ANDA";
const char* password = "PASSWORD_WIFI_ANDA";

// URL AJAIB FIREBASE REST API
const char* getUrl = "https://firestore.googleapis.com/v1/projects/dashboard-4a21c/databases/(default)/documents/anak";
const char* patchUrl = "https://firestore.googleapis.com/v1/projects/dashboard-4a21c/databases/(default)/documents/esp32_buffer/device_01?updateMask.fieldPaths=status&updateMask.fieldPaths=selectedNama&updateMask.fieldPaths=selectedEmail&updateMask.fieldPaths=tinggiBadan&updateMask.fieldPaths=beratBadan&updateMask.fieldPaths=lingkarKepala&updateMask.fieldPaths=suhuTubuh";

struct Anak {
  String nama;
  String email;
};

std::vector<Anak> daftarAnak; 
int currentIndex = 0; 

// Konfigurasi Pin
const int btnNext = 4; // Colok tombol NEXT ke Pin GPIO 4
const int btnSend = 5; // Colok tombol SIMPAN ke Pin GPIO 5

// ====================================================================================================
// INISIALISASI OBJEK SENSOR
// ====================================================================================================
Adafruit_VL53L0X sensorTinggi = Adafruit_VL53L0X();
Adafruit_MLX90614 sensorSuhu = Adafruit_MLX90614();
HX711 scale;
const int LOADCELL_DOUT_PIN = 16;
const int LOADCELL_SCK_PIN = 17;

void setup() {
  Serial.begin(115200);
  pinMode(btnNext, INPUT_PULLUP);
  pinMode(btnSend, INPUT_PULLUP);
  Wire.begin(); // Memulai jalur komunikasi I2C untuk sensor-sensor

  // Setup Sensor Suhu & Tinggi (Opsional: Hapus tanda komentar jika sensor sudah terpasang)
  /*
  if (!sensorSuhu.begin()) Serial.println("Error: MLX90614 (Suhu) tidak terdeteksi!");
  if (!sensorTinggi.begin()) Serial.println("Error: VL53L0X (Tinggi) tidak terdeteksi!");
  
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(2280.f); // Kalibrasi Loadcell Anda di sini
  scale.tare();            // Reset berat menjadi 0
  */

  Serial.println("================================");
  Serial.print("Mencari WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Berhasil Terkoneksi!");
  Serial.println("================================");

  fetchDaftarAnak();
}

void loop() {
  // Aksi Tombol NEXT (Bisa diganti Rotary Encoder)
  if (digitalRead(btnNext) == LOW) {
    delay(200); 
    if (daftarAnak.size() > 0) {
      currentIndex++;
      if (currentIndex >= daftarAnak.size()) currentIndex = 0; 
      
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

  // Aksi Tombol SIMPAN
  if (digitalRead(btnSend) == LOW) {
    delay(200); 
    if (daftarAnak.size() > 0) {
      sendDataKeWeb(daftarAnak[currentIndex]);
    } else {
      Serial.println("Gagal: Belum ada data anak di memori ESP32!");
    }
  }
}

void fetchDaftarAnak() {
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Menyadur data dari Firebase...");
    HTTPClient http;
    http.begin(getUrl);
    int httpCode = http.GET();

    if (httpCode > 0) {
      String payload = http.getString();
      DynamicJsonDocument doc(8192); 
      DeserializationError error = deserializeJson(doc, payload);

      if (error) {
        Serial.print("Error Pembacaan JSON: ");
        Serial.println(error.c_str());
        return;
      }

      daftarAnak.clear(); 
      JsonArray documents = doc["documents"];
      
      for (JsonObject document : documents) {
        String nama = document["fields"]["nama"]["stringValue"];
        String email = document["fields"]["userEmail"]["stringValue"];
        daftarAnak.push_back({nama, email});
      }
      
      Serial.print("Berhasil menemukan ");
      Serial.print(daftarAnak.size());
      Serial.println(" anak.");
    }
    http.end();
  }
}

void sendDataKeWeb(Anak anakTerpilih) {
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Membaca Sensor & Mengirim data: ");
    Serial.println(anakTerpilih.nama);
    
    // ==================================================================
    // PEMBACAAN SENSOR AKTIF (Contoh Cara Kerjanya)
    // ==================================================================
    
    // 1. Baca Tinggi Badan (VL53L0X)
    // VL53L0X_RangingMeasurementData_t measure;
    // sensorTinggi.rangingTest(&measure, false);
    // float bacaanTinggi = measure.RangeMilliMeter / 10.0; // Ubah ke CM
    float bacaanTinggi = 85.5; // (Dummy Data)
    
    // 2. Baca Berat Badan (HX711)
    // float bacaanBerat = scale.get_units(10); 
    float bacaanBerat = 12.4; // (Dummy Data)

    // 3. Baca Suhu Tubuh (MLX90614)
    // float bacaanSuhu = sensorSuhu.readObjectTempC();
    float bacaanSuhu = 36.5; // (Dummy Data)

    // 4. Baca Lingkar Kepala (Matriks 6x VL53L1X via Multiplexer)
    // (Programmer Anda harus menulis rumus algoritma keliling elips di sini)
    float bacaanLingkar = 48.0; // (Dummy Data)

    // ==================================================================

    DynamicJsonDocument doc(1024);
    JsonObject fields = doc.createNestedObject("fields");
    
    fields["status"]["stringValue"] = "SAVE_TRIGGERED";
    fields["selectedNama"]["stringValue"] = anakTerpilih.nama;
    fields["selectedEmail"]["stringValue"] = anakTerpilih.email; 
    fields["tinggiBadan"]["doubleValue"] = bacaanTinggi;
    fields["beratBadan"]["doubleValue"] = bacaanBerat;
    fields["lingkarKepala"]["doubleValue"] = bacaanLingkar;
    fields["suhuTubuh"]["doubleValue"] = bacaanSuhu;

    String jsonPayload;
    serializeJson(doc, jsonPayload);

    HTTPClient http;
    http.begin(patchUrl);
    http.addHeader("Content-Type", "application/json");
    
    int httpCode = http.PATCH(jsonPayload);
    
    if (httpCode > 0) {
      Serial.println("SUKSES DIKIRIM KE AWAN! Cek Layar Laptop.");
    } else {
      Serial.println("Gagal Mengirim!");
    }
    http.end();
  }
}
