import { LitElement, html, css } from "lit";

class PromptElement extends LitElement {
  constructor() {
    super();
    this.promptText = "";
    this.response = "";
    this.loading = false;
    this.error = null;
    this.autoRun = false;
  }

  static get properties() {
    return {
      promptText: { type: String, attribute: "prompt-text" },
      response: { type: String },
      loading: { type: Boolean },
      error: { type: Object },
      // Auto-run flag can be set via the 'auto-run' attribute
      autoRun: { type: Boolean, attribute: "auto-run" },
    };
  }

  static get styles() {
    return css`
      .container {
        border: 1px solid #ccc;
        padding: 16px;
        border-radius: 8px;
        max-width: 600px;
        margin: auto;
        font-family: Arial, sans-serif;
      }
      textarea {
        width: 100%;
        height: 100px;
        padding: 8px;
        box-sizing: border-box;
        font-size: 14px;
      }
      button {
        padding: 8px 16px;
        margin-top: 8px;
        font-size: 14px;
      }
      .response {
        margin-top: 16px;
        padding: 8px;
        background-color: #f9f9f9;
        border-radius: 4px;
        min-height: 50px;
      }
      .error {
        margin-top: 16px;
        padding: 8px;
        background-color: #ffe6e6;
        border: 1px solid #ff5c5c;
        border-radius: 4px;
        color: #cc0000;
      }
      .loading {
        margin-top: 16px;
        font-style: italic;
      }
    `;
  }

  render() {
    return html`
      <div class="container">
        <h2>Prompt AI</h2>
        <textarea
          .value="${this.promptText}"
          @input="${this._onInput}"
          placeholder="Enter your prompt here..."
        ></textarea>
        <button @click="${this._sendPrompt}" ?disabled="${this.loading}">
          ${this.loading ? "Processing..." : "Send Prompt"}
        </button>

        ${this.loading ? html`<div class="loading">Loading...</div>` : ""}
        ${this.response
          ? html`<div class="response">${this.response}</div>`
          : ""}
        ${this.error
          ? html`<div class="error">Error: ${this.error.message}</div>`
          : ""}
      </div>
    `;
  }

  _onInput(event) {
    this.promptText = event.target.value;
  }

  async _sendPrompt() {
    if (!window.ai || !window.ai.languageModel) {
      this.error = new Error("Prompt API is not available.");
      return;
    }

    this.loading = true;
    this.error = null;
    this.response = "";

    // Dispatch a custom event indicating prompt start
    this.dispatchEvent(
      new CustomEvent("prompt-start", {
        detail: { prompt: this.promptText },
        bubbles: true,
        composed: true,
      })
    );

    try {
      const { available } = await ai.languageModel.capabilities();

      if (available !== "readily") {
        throw new Error("AI Language Model is not readily available.");
      }

      const session = await ai.languageModel.create();

      // Dispatch an event for session creation
      this.dispatchEvent(
        new CustomEvent("session-created", {
          detail: { session },
          bubbles: true,
          composed: true,
        })
      );

      const result = await session.prompt(this.promptText);

      this.response = result;

      // Dispatch an event for received response
      this.dispatchEvent(
        new CustomEvent("prompt-response", {
          detail: { response: result },
          bubbles: true,
          composed: true,
        })
      );
    } catch (err) {
      this.error = err;

      // Dispatch an event for errors
      this.dispatchEvent(
        new CustomEvent("prompt-error", {
          detail: { error: err },
          bubbles: true,
          composed: true,
        })
      );
    } finally {
      this.loading = false;
    }
  }

  async _sendPromptStream() {
    if (!window.ai || !window.ai.languageModel) {
      this.error = new Error("Prompt API is not available.");
      return;
    }

    this.loading = true;
    this.error = null;
    this.response = "";

    this.dispatchEvent(
      new CustomEvent("prompt-start", {
        detail: { prompt: this.promptText },
        bubbles: true,
        composed: true,
      })
    );

    try {
      const { available } = await ai.languageModel.capabilities();

      if (available !== "readily") {
        throw new Error("AI Language Model is not readily available.");
      }

      const session = await ai.languageModel.create();

      this.dispatchEvent(
        new CustomEvent("session-created", {
          detail: { session },
          bubbles: true,
          composed: true,
        })
      );

      const stream = await session.promptStreaming(this.promptText, {
        signal: null, // Add AbortSignal if needed
      });

      let accumulatedResponse = "";

      for await (const chunk of stream) {
        accumulatedResponse += chunk;
        this.response = accumulatedResponse;

        // Optionally dispatch incremental updates
        this.dispatchEvent(
          new CustomEvent("prompt-progress", {
            detail: { chunk },
            bubbles: true,
            composed: true,
          })
        );
      }

      this.dispatchEvent(
        new CustomEvent("prompt-response", {
          detail: { response: accumulatedResponse },
          bubbles: true,
          composed: true,
        })
      );
    } catch (err) {
      this.error = err;

      this.dispatchEvent(
        new CustomEvent("prompt-error", {
          detail: { error: err },
          bubbles: true,
          composed: true,
        })
      );
    } finally {
      this.loading = false;
    }
  }

  updated(changedProperties) {
    // If 'promptText' or 'autoRun' changed via attributes, handle accordingly
    if (changedProperties.has('promptText')) {
      const newPrompt = this.promptText;
      if (this.autoRun && newPrompt.trim() !== '') {
        this._sendPrompt();
      }
    }

    if (changedProperties.has('autoRun')) {
      // If autoRun is enabled and there's existing promptText, trigger send
      if (this.autoRun && this.promptText.trim() !== '') {
        this._sendPrompt();
      }
    }
  }
}

customElements.define("prompt-element", PromptElement);
