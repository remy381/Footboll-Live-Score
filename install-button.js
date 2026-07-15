class EspWebInstallButton extends HTMLElement {
  async connectedCallback() {
    // Holt sich den Installer direkt und sicher von der offiziellen ESPHome-Infrastruktur
    const { EspWebInstallButton: Button } = await import("https://github.io");
    const instance = new Button();
    instance.manifest = this.getAttribute("manifest");
    
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
    this.shadowRoot.appendChild(instance);
  }
}
customElements.define("esp-web-install-button", EspWebInstallButton);
