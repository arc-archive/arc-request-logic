import { LitElement } from 'lit-element';

export class DemoTransport extends LitElement {
  static get properties() {
    return {
      enabled: { type: Boolean }
    };
  }

  constructor() {
    super();
    this._onTransportRequested = this._onTransportRequested.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('transport-request', this._onTransportRequested);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('transport-request', this._onTransportRequested);
  }
  /* global Request */
  _onTransportRequested(e) {
    if (!this.enabled) {
      return;
    }
    const request = e.detail;
    const init = {
      method: request.method,
      body: request.payload,
      headers: this._computeHeaders(request.headers),
      credentials: 'include'
    };
    let requestObj;
    try {
      requestObj = new Request(request.url, init);
    } catch (e) {
      document.body.dispatchEvent(new CustomEvent('report-response', {
        bubbles: true,
        cancelable: true,
        detail: {
          request,
          id: request.id,
          isXhr: true,
          loadingTime: 0,
          isError: true,
          error: e
        }
      }));
      return;
    }
    const tStart = Date.now();
    let tEnd;
    const responseResult = {};
    fetch(requestObj)
    .then((response) => {
      tEnd = Date.now() - tStart;
      let headers = '';
      response.headers.forEach((value, name) => {
        headers += `${name}: ${value}\n`;
      });
      responseResult.headers = headers;
      responseResult.status = response.status;
      responseResult.statusText = response.statusText;
      responseResult.url = response.url;
      return response.text();
    })
    .then((body) => {
      responseResult.payload = body;
      document.body.dispatchEvent(new CustomEvent('report-response', {
        bubbles: true,
        cancelable: true,
        detail: {
          request,
          response: responseResult,
          id: request.id,
          isXhr: true,
          loadingTime: tEnd
        }
      }));
    })
    .catch((cause) => {
      const tEnd = Date.now() - tStart;
      document.body.dispatchEvent(new CustomEvent('report-response', {
        bubbles: true,
        cancelable: true,
        detail: {
          request,
          id: request.id,
          isXhr: true,
          loadingTime: tEnd,
          isError: true,
          error: cause
        }
      }));
    });
  }

  _computeHeaders(input) {
    const headers = {};
    if (input) {
      input.split('\n').forEach((line) => {
        const parts = line.split(':');
        if (parts[1]) {
          parts[1] = parts[1].trim();
        }
        headers[parts[0]] = parts[1];
      });
    }
    return headers;
  }
}
window.customElements.define('demo-transport', DemoTransport);
