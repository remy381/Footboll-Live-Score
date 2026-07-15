class EspWebInstallButton extends HTMLElement {
  async connectedCallback() {
    // Lädt das Skript direkt über ein alternatives, blockadesicheres CDN
    const { EspWebInstallButton: Button } = await import("https://esm.run");
    const instance = new Button();
    instance.manifest = this.getAttribute("manifest");
    
    // Buttons in den Shadow DOM einfügen
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
    this.shadowRoot.appendChild(instance);
  }
}
customElements.define("esp-web-install-button", EspWebInstallButton);
