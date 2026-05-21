#include <WiFi.h>
#include <HTTPClient.h>
#include <Arduino_JSON.h>
#include <driver/i2s.h>
#include <math.h>
#include <Adafruit_NeoPixel.h>

// WLAN
const char* ssid = "tinkergarden";
const char* pass = "strenggeheim";

// Server
const char* serverURL = "http://im4.julianreusser.ch/api/load.php";

// Mikrofon
#define I2S_WS   23
#define I2S_SD   13
#define I2S_SCK  2
#define I2S_PORT I2S_NUM_0

#define SAMPLE_RATE 16000
#define BITS_PER_SAMPLE I2S_BITS_PER_SAMPLE_32BIT

const int DMA_BUF_COUNT = 8;
const int DMA_BUF_LEN = 1024;
const int BUFFER_SIZE = 512;

int32_t samples[BUFFER_SIZE];

// LED Ring
#define LED_PIN 4
#define LED_COUNT 16

Adafruit_NeoPixel ring(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

// Dezibel
float smoothedSPL = 0;

const float filterFactor = 0.5;
const float DB_OFFSET = 125.0;

// Datenbank Timer
unsigned long lastTime = 0;
unsigned long timerDelay = 60000;

// WLAN Status
bool isWlanConnected = false;

void setup() {
  Serial.begin(115200);
  delay(1000);

  ring.begin();
  ring.show();

  setupMicrophone();

  connectWiFi();
}

void loop() {
  if (!is_wlan_connected()) {
    return;
  }

  float dB = getDB();

  updateRingLight(dB);

  if ((millis() - lastTime) > timerDelay) {
    lastTime = millis();

    Serial.print("dB: ");
    Serial.println(dB);

    JSONVar dataObject;
    dataObject["wert"] = round(dB);

    String jsonString = JSON.stringify(dataObject);

    Serial.print("Sende JSON: ");
    Serial.println(jsonString);

    sendToDatabase(jsonString);
  }
}

void updateRingLight(float dB) {
  if (dB < 65) {
    setRingColor(0, 255, 0);      // Grün
  } 
  else if (dB >= 65 && dB <= 85) {
    setRingColor(255, 120, 0);    // Orange
  } 
  else {
    setRingColor(255, 0, 0);      // Rot
  }
}

void setRingColor(int red, int green, int blue) {
  for (int i = 0; i < LED_COUNT; i++) {
    ring.setPixelColor(i, ring.Color(red, green, blue));
  }

  ring.show();
}

void setupMicrophone() {
  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = BITS_PER_SAMPLE,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = DMA_BUF_COUNT,
    .dma_buf_len = DMA_BUF_LEN,
    .use_apll = false
  };

  i2s_pin_config_t pin_config = {
    .mck_io_num = I2S_PIN_NO_CHANGE,
    .bck_io_num = I2S_SCK,
    .ws_io_num = I2S_WS,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = I2S_SD
  };

  if (i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL) != ESP_OK) {
    Serial.println("I2S Installation fehlgeschlagen!");
    return;
  }

  i2s_set_pin(I2S_PORT, &pin_config);
  i2s_zero_dma_buffer(I2S_PORT);

  Serial.println("Mikrofon gestartet.");
}

void connectWiFi() {
  Serial.print("Verbinde mit WLAN: ");
  Serial.println(ssid);

  WiFi.begin(ssid, pass);

  int attempts = 0;

  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("WLAN verbunden.");
    Serial.print("IP-Adresse: ");
    Serial.println(WiFi.localIP());

    isWlanConnected = true;
  } else {
    Serial.println();
    Serial.println("WLAN Verbindung fehlgeschlagen.");

    isWlanConnected = false;
  }
}

bool is_wlan_connected() {
  if (WiFi.status() != WL_CONNECTED) {
    if (isWlanConnected == true) {
      Serial.println("WLAN Verbindung verloren.");
      isWlanConnected = false;
    }

    connectWiFi();

    return false;
  }

  return true;
}

void sendToDatabase(String jsonString) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    http.begin(serverURL);
    http.addHeader("Content-Type", "application/json");

    int httpResponseCode = http.POST(jsonString);

    if (httpResponseCode > 0) {
      String response = http.getString();

      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);

      Serial.print("Response: ");
      Serial.println(response);
    } else {
      Serial.print("Fehler beim Senden: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  } else {
    Serial.println("WLAN getrennt.");
  }
}

float getDB() {
  size_t bytesRead = 0;

  esp_err_t result = i2s_read(
    I2S_PORT,
    &samples,
    sizeof(samples),
    &bytesRead,
    portMAX_DELAY
  );

  if (result == ESP_OK && bytesRead > 0) {
    int samplesCount = bytesRead / 4;
    float sumSq = 0;

    for (int i = 0; i < samplesCount; i++) {
      int32_t val = samples[i] >> 8;
      float floatSample = (float)val / 8388608.0;
      sumSq += floatSample * floatSample;
    }

    float rms = sqrt(sumSq / samplesCount);
    float db = 20.0 * log10(rms + 1e-9);
    float spl = db + DB_OFFSET;

    if (smoothedSPL == 0) {
      smoothedSPL = spl;
    } else {
      smoothedSPL = (spl * filterFactor) + (smoothedSPL * (1.0 - filterFactor));
    }

    return smoothedSPL;
  }

  delay(10);
  return smoothedSPL;
}