import { LitElement, html, css } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { classMap } from 'lit/directives/class-map.js';

class LitFormBuilder extends LitElement {
  static properties = {
    formData: { type: Object },
    currentPage: { type: Number },
    prefix: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
    }

    .form-container {
      background-color: #f0f0f0;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .progress-bar {
      height: 4px;
      background-color: #e0e0e0;
      border-radius: 2px;
      margin-bottom: 20px;
    }

    .progress {
      height: 100%;
      background-color: #4caf50;
      border-radius: 2px;
      transition: width 0.3s ease;
    }

    .page-container {
      min-height: 300px;
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.3s ease, transform 0.3s ease;
    }

    .page-container.active {
      opacity: 1;
      transform: translateY(0);
    }

    .field {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }

    input[type="text"],
    input[type="email"],
    input[type="number"],
    textarea,
    select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 16px;
    }

    textarea {
      height: 100px;
      resize: vertical;
    }

    .navigation {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
    }

    button {
      padding: 10px 20px;
      background-color: #4caf50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      transition: background-color 0.3s ease;
    }

    button:hover {
      background-color: #45a049;
    }

    button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }

    .page-numbers {
      display: flex;
      justify-content: center;
      margin-top: 10px;
    }

    .page-number {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background-color: #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 5px;
      cursor: pointer;
    }

    .page-number.active {
      background-color: #4caf50;
      color: white;
    }
  `;

  constructor() {
    super();
    this.formData = { pages: [] };
    this.currentPage = 0;
    this.prefix = 'set:';
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadFormData();
    this.loadProgress();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    super.attributeChangedCallback(name, oldValue, newValue);
    if (name.startsWith('action:')) {
      const action = name.split(':')[1];
      this.handleAction(action);
    } else if (name.startsWith(this.prefix)) {
      const field = name.slice(this.prefix.length);
      this.setFieldValue(field, newValue);
    }
  }

  loadFormData() {
    const formDataString = this.getAttribute('form-data');
    if (formDataString) {
      try {
        this.formData = JSON.parse(formDataString);
        this.requestUpdate();
      } catch (error) {
        console.error('Error parsing form data:', error);
      }
    }
  }

  loadProgress() {
    const savedProgress = sessionStorage.getItem('formProgress');
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      this.currentPage = progress.currentPage;
      this.formData = progress.formData;
      this.requestUpdate();
    }
  }

  saveProgress() {
    const progress = {
      currentPage: this.currentPage,
      formData: this.formData
    };
    sessionStorage.setItem('formProgress', JSON.stringify(progress));
  }

  render() {
    return html`
      <div class="form-container">
        ${this.renderProgressBar()}
        ${this.renderCurrentPage()}
        ${this.renderNavigation()}
        ${this.renderPageNumbers()}
      </div>
    `;
  }

  renderProgressBar() {
    const progress = ((this.currentPage + 1) / this.formData.pages.length) * 100;
    return html`
      <div class="progress-bar">
        <div class="progress" style="width: ${progress}%"></div>
      </div>
    `;
  }

  renderCurrentPage() {
    const page = this.formData.pages[this.currentPage];
    if (!page) return html``;

    return html`
      <div class="page-container active">
        ${repeat(page.fields, (field) => field.id, (field) => this.renderField(field))}
      </div>
    `;
  }

  renderField(field) {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return html`
          <div class="field">
            <label for="${field.id}">${field.label}</label>
            <input
              type="${field.type}"
              id="${field.id}"
              name="${field.id}"
              value="${field.value || ''}"
              @input=${(e) => this.handleFieldChange(field.id, e.target.value)}
              required=${field.required}
            >
          </div>
        `;
      case 'textarea':
        return html`
          <div class="field">
            <label for="${field.id}">${field.label}</label>
            <textarea
              id="${field.id}"
              name="${field.id}"
              @input=${(e) => this.handleFieldChange(field.id, e.target.value)}
              required=${field.required}
            >${field.value || ''}</textarea>
          </div>
        `;
      case 'select':
        return html`
          <div class="field">
            <label for="${field.id}">${field.label}</label>
            <select
              id="${field.id}"
              name="${field.id}"
              @change=${(e) => this.handleFieldChange(field.id, e.target.value)}
              required=${field.required}
            >
              ${field.options.map(option => html`
                <option value="${option.value}" ?selected=${option.value === field.value}>
                  ${option.label}
                </option>
              `)}
            </select>
          </div>
        `;
      case 'radio':
        return html`
          <div class="field">
            <fieldset>
              <legend>${field.label}</legend>
              ${field.options.map(option => html`
                <label>
                  <input
                    type="radio"
                    name="${field.id}"
                    value="${option.value}"
                    ?checked=${option.value === field.value}
                    @change=${(e) => this.handleFieldChange(field.id, e.target.value)}
                    required=${field.required}
                  >
                  ${option.label}
                </label>
              `)}
            </fieldset>
          </div>
        `;
      case 'checkbox':
        return html`
          <div class="field">
            <label>
              <input
                type="checkbox"
                id="${field.id}"
                name="${field.id}"
                ?checked=${field.value}
                @change=${(e) => this.handleFieldChange(field.id, e.target.checked)}
                required=${field.required}
              >
              ${field.label}
            </label>
          </div>
        `;
      default:
        return html`<p>Unsupported field type: ${field.type}</p>`;
    }
  }

  renderNavigation() {
    return html`
      <div class="navigation">
        <button
          @click=${() => this.navigateToPage(0)}
          ?disabled=${this.currentPage === 0}
        >
          First
        </button>
        <button
          @click=${this.previousPage}
          ?disabled=${this.currentPage === 0}
        >
          Previous
        </button>
        <button
          @click=${this.nextPage}
          ?disabled=${this.currentPage === this.formData.pages.length - 1}
        >
          Next
        </button>
        <button
          @click=${() => this.navigateToPage(this.formData.pages.length - 1)}
          ?disabled=${this.currentPage === this.formData.pages.length - 1}
        >
          Last
        </button>
        <button
          @click=${this.submitForm}
          ?disabled=${this.currentPage !== this.formData.pages.length - 1}
        >
          Submit
        </button>
      </div>
    `;
  }

  renderPageNumbers() {
    return html`
      <div class="page-numbers">
        ${this.formData.pages.map((_, index) => html`
          <div
            class="page-number ${this.currentPage === index ? 'active' : ''}"
            @click=${() => this.navigateToPage(index)}
          >
            ${index + 1}
          </div>
        `)}
      </div>
    `;
  }

  handleFieldChange(fieldId, value) {
    const currentPage = this.formData.pages[this.currentPage];
    const fieldIndex = currentPage.fields.findIndex(field => field.id === fieldId);
    if (fieldIndex !== -1) {
      currentPage.fields[fieldIndex].value = value;
      this.requestUpdate();
      
      // Dispatch event for field change
      const changeEvent = new CustomEvent('field-change', {
        detail: { fieldId, value },
        bubbles: true,
        composed: true
      });
      this.dispatchEvent(changeEvent);

      // Save progress
      this.saveProgress();
    }
  }

  previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updateActivePageClass();
      this.saveProgress();
    }
  }

  nextPage() {
    if (this.currentPage < this.formData.pages.length - 1) {
      this.currentPage++;
      this.updateActivePageClass();
      this.saveProgress();
    }
  }

  navigateToPage(pageIndex) {
    if (pageIndex >= 0 && pageIndex < this.formData.pages.length) {
      this.currentPage = pageIndex;
      this.updateActivePageClass();
      this.saveProgress();
    }
  }

  updateActivePageClass() {
    const pageContainer = this.shadowRoot.querySelector('.page-container');
    if (pageContainer) {
      pageContainer.classList.remove('active');
      setTimeout(() => {
        pageContainer.classList.add('active');
      }, 50);
    }
  }

  submitForm() {
    const formData = this.formData.pages.flatMap(page => page.fields);
    const event = new CustomEvent('form-submit', { detail: formData, bubbles: true, composed: true });
    this.dispatchEvent(event);
  }

  handleAction(action) {
    switch (action) {
      case 'submit':
        this.submitForm();
        break;
      case 'next':
        this.nextPage();
        break;
      case 'previous':
        this.previousPage();
        break;
      case 'first':
        this.navigateToPage(0);
        break;
      case 'last':
        this.navigateToPage(this.formData.pages.length - 1);
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }

  setFieldValue(fieldId, value) {
    for (const page of this.formData.pages) {
      const field = page.fields.find(f => f.id === fieldId);
      if (field) {
        field.value = value;
        this.requestUpdate();
        this.saveProgress();
        break;
      }
    }
  }
}

customElements.define('lit-form-builder', LitFormBuilder);
