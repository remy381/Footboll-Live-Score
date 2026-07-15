class EspWebInstallButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  async connectedCallback() {
    const manifestUrl = this.getAttribute("manifest");
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

      try {
        statusDiv.style.color = "#4CAF50";
        statusDiv.innerText = "Lade Installer-Modul von ESPHome...";
        
        // Lädt den Installer von der unblockbaren ESPHome-Infrastruktur
        const { ESPLoader } = await import("https://github.io");
        
        statusDiv.innerText = "Bitte wähle deinen ESP32-C3 im Pop-up aus...";
        const port = await navigator.serial.requestPort();
        
        statusDiv.innerText = "Verbinde mit ESP32-C3...";
        // Holt sich das Transport-Modul direkt aus dem geladenen Paket
        const transport = new (window.Transport || (await import("https://github.io")).Transport)(port);
        const esploader = new ESPLoader(transport, 115200, null);
        await esploader.main();

        statusDiv.innerText = "Lese Konfiguration (manifest.json)...";
        const response = await fetch(manifestUrl);
        const manifest = await response.json();
        
        // Holt den Pfad dynamisch aus der JSON-Struktur
        const firmwarePath = manifest.builds[0].parts[0].path;

        statusDiv.innerText = `Lade Firmware-Datei (${firmwarePath})...`;
        const fwResponse = await fetch(firmwarePath);
        const fwBuffer = await fwResponse.arrayBuffer();

        statusDiv.innerText = "💥 Flashen gestartet! Bitte das Browserfenster NICHT schließen...";
        btn.disabled = true;

        // Schreibt die Firmware auf die Adresse 0x0
        await esploader.writeFlash([{ data: new Uint8Array(fwBuffer), address: 0x0 }]);

        statusDiv.innerText = "✅ Erfolgreich geflasht! Du kannst das Kabel jetzt trennen.";
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

