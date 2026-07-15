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
        statusDiv.innerText = "Bitte wähle deinen ESP32-C3 im Pop-up aus...";
        const port = await navigator.serial.requestPort();
        
        statusDiv.innerText = "Verbinde mit ESP32-C3...";
        await port.open({ baudRate: 115200 });

        statusDiv.innerText = "Lese Konfiguration (manifest.json)...";
        const response = await fetch(manifestUrl);
        const manifest = await response.json();
        
        // Holt den Pfad der Firmware aus der JSON
        let firmwarePath = "firmware.bin";
        if (manifest.builds && manifest.builds[0] && manifest.builds[0].parts && manifest.builds[0].parts[0]) {
          firmwarePath = manifest.builds[0].parts[0].path;
        }

        statusDiv.innerText = `Lade Firmware-Datei (${firmwarePath})...`;
        const fwResponse = await fetch(firmwarePath);
        if (!fwResponse.ok) throw new Error("Firmware-Datei konnte nicht geladen werden.");
        const fwBuffer = await fwResponse.arrayBuffer();
        const data = new Uint8Array(fwBuffer);

        statusDiv.innerText = "💥 Flashen gestartet... Bereite Datenübertragung vor...";
        btn.disabled = true;

        const writer = port.writable.getWriter();
        
        // Wir senden die Binärdaten in kleinen, verdaulichen Paketen (Chunks) an den ESP32-C3
        const chunkSize = 1024;
        for (let i = 0; i < data.length; i += chunkSize) {
          const chunk = data.slice(i, i + chunkSize);
          await writer.write(chunk);
          
          const prozent = Math.min(100, Math.round(((i + chunk.length) / data.length) * 100));
          statusDiv.innerText = `⚡ Schreibe Firmware: ${prozent}%... Bitte warten.`;
        }

        writer.releaseLock();
        await port.close();

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
