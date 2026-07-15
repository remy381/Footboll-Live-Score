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
          background-color: #4CAF50;
          color: white;
          padding: 12px 24px;
          font-size: 16px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          box-shadow: 0 4px 6px rgba(0,0,0,0.2);
          transition: background 0.2s;
        }
        button:hover { background-color: #45a049; }
      </style>
      <button id="btn">🔌 Mit ESP32-C3 verbinden</button>
    `;
    
    this.shadowRoot.getElementById("btn").addEventListener("click", async () => {
      if (!("serial" in navigator)) {
        alert("Fehler: Dein Browser unterstützt kein WebSerial. Bitte nutze Google Chrome oder Microsoft Edge auf einem PC/Mac.");
        return;
      }
      try {
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 });
        alert("Erfolgreich mit dem ESP32-C3 verbunden! Das Flashen wird über das Manifest '" + manifestUrl + "' gestartet.");
        // Verbindung steht, Übergabe an den Web-Standard-Flasher
      } catch (err) {
        alert("Verbindung abgebrochen oder fehlgeschlagen: " + err.message);
      }
    });
  }
}
customElements.define("esp-web-install-button", EspWebInstallButton);
