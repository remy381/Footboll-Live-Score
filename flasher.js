class EspWebInstallButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  async connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        button {
          background-color: #4CAF50; color: white; padding: 14px 28px;
          font-size: 16px; border: none; border-radius: 8px;
          cursor: pointer; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.2);
          transition: all 0.2s;
        }
        button:hover { background-color: #45a049; transform: scale(1.02); }
        button:disabled { background-color: #555; cursor: not-allowed; }
        #status { margin-top: 15px; font-weight: bold; color: #4CAF50; font-size: 0.95em; line-height: 1.4; }
      </style>
      <button id="btn">🔌 ESP32-C3 Programmieren (Flashen)</button>
      <div id="status"></div>
    `;
    
    const btn = this.shadowRoot.getElementById("btn");
    const statusDiv = this.shadowRoot.getElementById("status");

    btn.addEventListener("click", async () => {
      if (!("serial" in navigator)) {
        alert("Fehler: Dein Browser unterstützt kein WebSerial. Bitte nutze Google Chrome oder Microsoft Edge.");
        return;
      }

      let transport;
      try {
        statusDiv.style.color = "#4CAF50";
        statusDiv.innerText = "Bitte wähle deinen ESP32-C3 im Pop-up aus...";
        
        // Öffnet den Port nativ über den Browser
        const port = await navigator.serial.requestPort();
        statusDiv.innerText = "Verbinde mit Port...";
        
        // Initialisiert das Adafruit/Espressif Transport- und Loader-Modul
        transport = new window.Transport(port);
        const esploader = new window.ESPLoader({
          transport: transport,
          baudrate: 115200
        });
        
        statusDiv.innerText = "Synchronisiere mit ESP32-C3 Bootloader...";
        await esploader.main();

        statusDiv.innerText = "Lade Firmware-Datei (firmware.bin)...";
        const fwResponse = await fetch("firmware.bin?v=" + Math.random());
        if (!fwResponse.ok) throw new Error("firmware.bin im Hauptverzeichnis nicht gefunden.");
        const fwBuffer = await fwResponse.arrayBuffer();

        statusDiv.innerText = "💥 Flashen gestartet... Speicher wird überschrieben!";
        btn.disabled = true;

        // Nutzt die offizielle Methode zum Löschen und Beschreiben des ESP32-C3 Speichers ab Adresse 0x0
        await esploader.writeFlash({
          fileArray: [{ data: new Uint8Array(fwBuffer), address: 0x0 }],
          reportProgress: (fileIndex, written, total) => {
            const prozent = Math.round((written / total) * 100);
            statusDiv.innerText = `⚡ Schreibe Firmware: ${prozent}%... Bitte warten.`;
          }
        });

        statusDiv.innerText = "Resetten und Neustarten des ESP32-C3...";
        await esploader.hardReset();
        
        statusDiv.innerText = "✅ Erfolgreich geflasht! Das neue Projekt läuft jetzt.";
        btn.disabled = false;
        alert("Das Live-Score Display wurde erfolgreich programmiert!");

      } catch (err) {
        btn.disabled = false;
        statusDiv.style.color = "#ff9800";
        statusDiv.innerText = "Fehler: " + err.message;
        console.error(err);
      }
    });
  }
}
customElements.define("esp-web-install-button", EspWebInstallButton);
