// NTC -> GPIO34 | LED (PWM) -> GPIO18 | Buzzer -> GPIO19 | Paro -> GPIO4
const int PIN_NTC = 34, PIN_LED = 18, PIN_BUZZER = 19, PIN_STOP = 4;

// Calibración (dos puntos conocidos)
const float T_FRIO = 5.0,  ADC_FRIO = 3800.0;
const float T_CALIENTE = 95.0, ADC_CALIENTE = 500.0;

const float T_MIN = 15.0, T_MAX = 50.0, T_ALARMA = 40.0;

bool emergencia = false;
bool botonPrevio = HIGH;
unsigned long ultimoRebote = 0, ultimoPrint = 0;

float leerTemperatura() {
  long suma = 0;
  for (int i = 0; i < 16; i++) suma += analogRead(PIN_NTC);  // promedio
  float adc = suma / 16.0;
  return T_FRIO + (ADC_FRIO - adc) * (T_CALIENTE - T_FRIO) / (ADC_FRIO - ADC_CALIENTE);
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_STOP, INPUT_PULLUP);
  pinMode(PIN_BUZZER, OUTPUT);
  ledcAttach(PIN_LED, 5000, 8);   // 5 kHz, 8 bits
  analogReadResolution(12);
}

void loop() {
  // Paro de emergencia: cada pulsación alterna (con antirrebote)
  bool boton = digitalRead(PIN_STOP);
  if (boton == LOW && botonPrevio == HIGH && millis() - ultimoRebote > 50) {
    emergencia = !emergencia;
    ultimoRebote = millis();
  }
  botonPrevio = boton;

  float temp = leerTemperatura();
  int duty = 0;
  bool alarma = false;

  if (!emergencia && temp >= T_MIN && temp <= T_MAX) {
    duty = (int)((temp - T_MIN) / (T_MAX - T_MIN) * 255.0);
    alarma = (temp > T_ALARMA);
  }

  ledcWrite(PIN_LED, duty);

  if (alarma && (millis() % 1000 < 500)) tone(PIN_BUZZER, 2000);
  else noTone(PIN_BUZZER);

  if (millis() - ultimoPrint > 500) {
    ultimoPrint = millis();
    Serial.printf("T=%.1f C  PWM=%d  alarma=%d  emergencia=%d\n",
                  temp, duty, alarma, emergencia);
  }
}
