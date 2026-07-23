/* ============================================
   CodePlayground - Interactive Code Editor
   ============================================ */

class CodePlayground {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    this.options = {
      code: options.code || '',
      language: options.language || 'html',
      title: options.title || 'Code Playground',
      readOnly: options.readOnly || false,
      ...options
    };

    this.state = {
      code: this.options.code,
      consoleOpen: false,
      fullscreen: false,
      history: [this.options.code],
      historyIndex: 0
    };

    this.init();
  }

  init() {
    this.render();
    this.setupEditor();
    this.updatePreview();
  }

  render() {
    this.container.innerHTML = '';
    this.container.classList.add('playground');

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'playground-toolbar';
    toolbar.innerHTML = `
      <div class="playground-toolbar-left">
        <span class="playground-title">${this.options.title}</span>
        <span class="playground-lang-badge">${this.options.language.toUpperCase()}</span>
      </div>
      <div class="playground-toolbar-right">
        <button class="playground-btn" data-action="copy" title="Copy Code">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>Copy</span>
        </button>
        <button class="playground-btn" data-action="reset" title="Reset Code">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
          <span>Reset</span>
        </button>
        <button class="playground-btn" data-action="console" title="Toggle Console">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="4 17 10 11 4 5"></polyline>
            <line x1="12" y1="19" x2="20" y2="19"></line>
          </svg>
          <span>Console</span>
        </button>
        <button class="playground-btn" data-action="fullscreen" title="Full Screen">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
          <span>Expand</span>
        </button>
      </div>
    `;
    this.container.appendChild(toolbar);

    // Main content area
    const main = document.createElement('div');
    main.className = 'playground-main';

    // Editor panel
    const editorPanel = document.createElement('div');
    editorPanel.className = 'playground-editor-panel';
    editorPanel.innerHTML = `
      <div class="playground-panel-header">
        <span>Editor</span>
      </div>
      <div class="playground-editor" id="editor-${this.container.id}"></div>
    `;
    main.appendChild(editorPanel);

    // Divider
    const divider = document.createElement('div');
    divider.className = 'playground-divider';
    divider.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    `;
    main.appendChild(divider);

    // Preview panel
    const previewPanel = document.createElement('div');
    previewPanel.className = 'playground-preview-panel';
    previewPanel.innerHTML = `
      <div class="playground-panel-header">
        <span>Preview</span>
        <button class="playground-btn-sm" data-action="refresh" title="Refresh Preview">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
        </button>
      </div>
      <div class="playground-preview">
        <iframe id="preview-${this.container.id}" sandbox="allow-scripts allow-same-origin"></iframe>
      </div>
    `;
    main.appendChild(previewPanel);

    this.container.appendChild(main);

    // Console panel
    const consolePanel = document.createElement('div');
    consolePanel.className = 'playground-console-panel';
    consolePanel.id = `console-${this.container.id}`;
    consolePanel.style.display = 'none';
    consolePanel.innerHTML = `
      <div class="playground-panel-header">
        <span>Console</span>
        <button class="playground-btn-sm" data-action="clear-console" title="Clear Console">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="playground-console-output" id="console-output-${this.container.id}"></div>
    `;
    this.container.appendChild(consolePanel);

    // Toast notification
    const toast = document.createElement('div');
    toast.className = 'playground-toast';
    toast.id = `toast-${this.container.id}`;
    toast.textContent = 'Code copied!';
    this.container.appendChild(toast);

    // Event listeners
    this.setupEventListeners(toolbar);
  }

  setupEditor() {
    const editorEl = this.container.querySelector('.playground-editor');
    const textarea = document.createElement('textarea');
    textarea.className = 'playground-textarea';
    textarea.value = this.state.code;
    textarea.spellcheck = false;
    textarea.readOnly = this.options.readOnly;
    
    // Tab support
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
        this.state.code = textarea.value;
        this.updatePreview();
      }
    });

    textarea.addEventListener('input', () => {
      this.state.code = textarea.value;
      this.updatePreview();
    });

    editorEl.appendChild(textarea);
    this.textarea = textarea;
  }

  setupEventListeners(toolbar) {
    this.container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;

      switch (action) {
        case 'copy':
          this.copyCode();
          break;
        case 'reset':
          this.resetCode();
          break;
        case 'console':
          this.toggleConsole();
          break;
        case 'fullscreen':
          this.toggleFullscreen();
          break;
        case 'refresh':
          this.updatePreview();
          break;
        case 'clear-console':
          this.clearConsole();
          break;
      }
    });
  }

  copyCode() {
    navigator.clipboard.writeText(this.state.code).then(() => {
      this.showToast('Code copied!');
    });
  }

  resetCode() {
    this.state.code = this.options.code;
    this.textarea.value = this.state.code;
    this.updatePreview();
    this.showToast('Code reset!');
  }

  toggleConsole() {
    const consolePanel = this.container.querySelector('.playground-console-panel');
    this.state.consoleOpen = !this.state.consoleOpen;
    consolePanel.style.display = this.state.consoleOpen ? 'block' : 'none';
    
    const btn = this.container.querySelector('[data-action="console"]');
    btn.classList.toggle('active', this.state.consoleOpen);
  }

  toggleFullscreen() {
    this.state.fullscreen = !this.state.fullscreen;
    this.container.classList.toggle('playground-fullscreen', this.state.fullscreen);
    
    const btn = this.container.querySelector('[data-action="fullscreen"]');
    btn.classList.toggle('active', this.state.fullscreen);
  }

  clearConsole() {
    const output = this.container.querySelector('.playground-console-output');
    output.innerHTML = '';
  }

  logToConsole(message, type = 'log') {
    if (!this.state.consoleOpen) return;
    
    const output = this.container.querySelector('.playground-console-output');
    const entry = document.createElement('div');
    entry.className = `console-entry console-${type}`;
    entry.textContent = message;
    output.appendChild(entry);
    output.scrollTop = output.scrollHeight;
  }

  showToast(message) {
    const toast = this.container.querySelector('.playground-toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }

  updatePreview() {
    const iframe = this.container.querySelector('iframe');
    const code = this.state.code;

    let html = '';
    
    if (this.options.language === 'html') {
      html = code;
    } else if (this.options.language === 'react') {
      html = this.wrapReact(code);
    } else if (this.options.language === 'javascript') {
      html = this.wrapJS(code);
    } else if (this.options.language === 'css') {
      html = this.wrapCSS(code);
    }

    // Intercept console.log
    const consoleInterceptor = `
      <script>
        (function() {
          const originalLog = console.log;
          const originalError = console.error;
          const originalWarn = console.warn;
          
          console.log = function(...args) {
            originalLog.apply(console, args);
            window.parent.postMessage({
              type: 'console',
              method: 'log',
              args: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a))
            }, '*');
          };
          
          console.error = function(...args) {
            originalError.apply(console, args);
            window.parent.postMessage({
              type: 'console',
              method: 'error',
              args: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a))
            }, '*');
          };
          
          console.warn = function(...args) {
            originalWarn.apply(console, args);
            window.parent.postMessage({
              type: 'console',
              method: 'warn',
              args: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a))
            }, '*');
          };
          
          window.onerror = function(msg, url, line, col, error) {
            window.parent.postMessage({
              type: 'console',
              method: 'error',
              args: [msg + ' (line ' + line + ')']
            }, '*');
          };
        })();
      <\/script>
    `;

    iframe.srcdoc = html.replace('</head>', consoleInterceptor + '</head>');

    // Listen for console messages
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'console') {
        this.logToConsole(e.data.args.join(' '), e.data.method);
      }
    });
  }

  wrapReact(code) {
    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', 'Cairo', sans-serif; padding: 1rem; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${code}
    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  <\/script>
</body>
</html>`;
  }

  wrapJS(code) {
    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', 'Cairo', sans-serif; padding: 1rem; }
    #output { white-space: pre-wrap; font-family: monospace; }
  </style>
</head>
<body>
  <div id="output"></div>
  <script>
    const output = document.getElementById('output');
    const originalLog = console.log;
    console.log = function(...args) {
      originalLog.apply(console, args);
      output.textContent += args.join(' ') + '\\n';
    };
    try {
      ${code}
    } catch(e) {
      output.textContent += 'Error: ' + e.message;
    }
  <\/script>
</body>
</html>`;
  }

  wrapCSS(code) {
    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', 'Cairo', sans-serif; padding: 2rem; }
    ${code}
  </style>
</head>
<body>
  <h1>Hello World</h1>
  <p>This is a styled paragraph.</p>
  <button>Click Me</button>
  <div class="box">Box Element</div>
</body>
</html>`;
  }

  // Public methods
  getCode() {
    return this.state.code;
  }

  setCode(code) {
    this.state.code = code;
    this.textarea.value = code;
    this.updatePreview();
  }
}

// Auto-initialize all playgrounds
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-playground]').forEach(el => {
    const config = {
      code: el.dataset.code || '',
      language: el.dataset.language || 'html',
      title: el.dataset.title || 'Code Playground'
    };
    new CodePlayground(el, config);
  });
});
