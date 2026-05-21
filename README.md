**Modul:** Interaktive Medien 4 an der Fachhochschule Graubünden (FS26)  
**Themenfeld:** IoT-Applikation zum Thema Eltern mit kleinen Kindern  
**Name des Projekts:** Snoozy
**Team Physical Computing:** Alessio Amstutz, Nicolas Egger   
**Team WebApp:** Julian Reusser, Melina Feldges
 
 
**Welches Problem im Alltag von Eltern mit kleinen Kindern wird gelöst?**

Im Alltag von Eltern und Betreuungspersonen mit kleinen Kindern entsteht oft über längere Zeit eine hohe Lärmbelastung. Besonders in Innenräumen merken Kinder häufig nicht selbst, wie laut sie sind. Dauerhafter Lärm kann zu Stress, Konzentrationsproblemen und Überforderung bei Kindern und Erwachsenen führen.
Die Lärmampel schafft eine direkte und verständliche Rückmeldung über die aktuelle Lautstärke. Kinder erkennen durch die Farben spielerisch, wann es zu laut wird und können ihr Verhalten selbstständig anpassen.

**Was ist der „Sinn und Zweck“ des Systems?**

Das Ziel des Projekts ist es, ein einfach verständliches System zur Sensibilisierung für Lautstärke zu entwickeln. Die visuelle Rückmeldung hilft dabei:
ruhige Lern- und Spielumgebungen zu fördern
Stress und Lärmbelastung zu reduzieren
Kinder spielerisch für Rücksichtnahme zu sensibilisieren
Betreuungspersonen bei der Raumüberwachung zu unterstützen
Durch die zusätzliche Datenspeicherung können Lautstärkeentwicklungen langfristig analysiert und verglichen werden.

\[*Bilder / GIFs (optional)*\]

### UX & Konzeption

*In diesem Teil werden die gemeinsamen Schritte aus der UX-Abgabe dokumentiert, damit sich hier alles vollständig an einem Ort befindet (betrifft WebApp und Physical Computing)*

* **Figma:** [Link zum Figma](http://link.zum.figma)
* **User Flow \+ Screen Flow** (Screenshot aus Figma)  
* ggf. weitere Ergänzungen
* *Welche Features waren angedacht?* 
* *Welche Features wurden nicht umgesetzt? (Warum)* Community Plattform

### Setup

* **WebApp:** [Link zur Website](http://link.zur.website)  
* **Video-Dokumentation:** [Link zum Video auf Youtube](http://link.zum.video) 

#### Installationsanleitung WebApp
Schritt-für-Schritt-Anleitung, um das Projekt zu klonen und auf einem eigenen Server zu installieren*

1. *Was benötige ich an Infrastruktur?*
   
Für das Projekt werden folgende Komponenten benötigt:
*Hardware*
* ESP32 Mikrocontroller
* INMP441 Mikrofon
* NeoPixel LED Ring (WS2812B)
* Breadboard
* Jumperkabel
* USB Kabel
* Powerbank oder USB-Netzteil
*Software / Server*
* Webserver mit PHP-Unterstützung
* MySQL oder MariaDB Datenbank
* Arduino IDE
* WLAN-Verbindung

2. *Was muss ich auf meinem Webserver installieren?*

Auf dem Webserver müssen installiert sein:
* PHP
* MySQL oder MariaDB
* Apache oder Nginx
Zusätzlich muss PHP PDO aktiviert sein, damit die Datenbankverbindung funktioniert.
Die Projektdateien werden auf den Server kopiert: 
/api/load.php
/system/config.php

3. *Wie kann ich die Datenbank importieren?*
   
In phpMyAdmin oder per SQL-Konsole folgende Tabelle erstellen:

* SQL:

CREATE TABLE messungen (
    id INT AUTO_INCREMENT PRIMARY KEY,
    gemessen_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Dezibel INT
);
4. *Wo muss ich die DB-Credentials eintragen?*

In der /system/config.php -Datei müssen die Zugangsdaten angepasst werden:
* PHP: 

$host = "localhost";
$dbname = "datenbankname";
$user = "username";
$pass = "passwort";

$pdo = new PDO(
    "mysql:host=$host;dbname=$dbname;charset=utf8",
    $user,
    $pass
);


5. *API testen*
   
Die Datei /api/load.php empfängt die Daten vom ESP32.
Test erfolgreich wenn beim Senden folgende Antwort erscheint:
"Messung gespeichert"

6. *Wie nehme ich das physische Artefakt in Betrieb?*

Im Arduino-Code folgende Werte anpassen:

const char* ssid = "WLAN_NAME";
const char* pass = "WLAN_PASSWORT";

const char* serverURL =
"http://DEINE_DOMAIN/api/load.php";

Danach den Code mit der Arduino IDE auf den ESP32 hochladen.

Zusätzlich müssen folgende Libraries installiert werden:
* Adafruit NeoPixel
* Arduino_JSON  

#### Bauanleitung Physical Computing

* ***Was muss ich wie bauen, verbinden, installieren?***  

  * *Eingesetzten Komponenten*  
      * ESP32
      * INMP441 Mikrofon
      * NeoPixel LED Ring
      * Breadboard
      * Powerbank (optional, wenn nicht am Laptop angeschlossen)

  * *Sensoren und Aktoren*  
    * Sensor: INMP441 Mikrofon
    * Aktor: NeoPixel LED Ring

  * *Programme*
    * mc.ino → Hauptprogramm auf ESP32
    * load.php → API für Datenempfang
    * config.php → Datenbankverbindung

  * *Kommunikationswege* 
    * Mikrofon → ESP32 über I2S
    * ESP32 → LED Ring über GPIO
    * ESP32 → Webserver über WLAN und HTTP POST
    * Webserver → MySQL Datenbank 

* *Steckplan*
<img width="1050" height="1036" alt="SteckplanSnoozy" src= "/img/imgREADME/SteckplanSnoozy.jpg" >
  * Mikrofon
  * VDD → 3.3V
  * GND → GND
  * SD → GPIO 13
  * SCK → GPIO 2
  * WS → GPIO 23
  * L/R → GND
  * LED Ring
  * DI → GPIO 4
  * 5V → 5V 
  * GND → GND

## technische Details

* **Projektstruktur / Code-Struktur:** \[*Hinweis: Der Code selbst muss im Repository liegen und im Kopfbereich jeder Datei eine kurze Zusammenfassung enthalten.*\]  


* **Datenschnittstelle: \[***zwischen WebApp und Physical Computing*\]  

Der ESP32 misst kontinuierlich die Lautstärke über das INMP441 Mikrofon und verarbeitet die Audiodaten lokal im Programm mc.ino. Die berechneten Dezibelwerte werden alle 60 Sekunden als JSON via HTTP POST Request an die Datei load.php auf dem Webserver gesendet.
load.php verarbeitet die empfangenen Daten und speichert sie mithilfe von config.php in der MySQL-Datenbank messungen. Die Website greift über unload.php auf dieselben Daten zu und visualisiert die aktuellen und historischen Messwerte.

Der Datenfluss verläuft somit:
Mikrofon → ESP32 → load.php → Datenbank → unload.php → Website

Das Zusammenspiel der Dateien ist im Datenflussdiagramm dargestellt.
<img width="1050" height="1036" alt="Datenfluss" src= "/img/imgREADME/Datenfluss.jpg" >

* **ERM:** \[*Erklärung und Schaubild*\]  
* **Authentifizierung:** \[*Erklärung*\]

## Known bugs

* Was funktioniert noch nicht einwandfrei?  
* Was ist uns aufgefallen bei der Entwicklung?  
* Was könnte noch verbessert werden?

## Umsetzungsprozess

* **Reflexion / Erfahrung / Lernfortschritt:** *Was haben wir gelernt? Würden wir es nochmal genauso machen? Was war gut, was war schlecht?*  
* **Herausforderungen & Lösungen:** \[*Verworfene Ansätze, Fehler, Umplanungen*\]  
* **KI-Einsatz:** *Dokumentation der verwendeten KI-Tools und deren Nutzen (KI ist nicht verboten)*  
* **Fazit:** …
