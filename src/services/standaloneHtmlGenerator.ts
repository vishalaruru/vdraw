/**
 * Shareable Interactive HTML Standalone Generator for vish.al Intelligent Architecture Studio
 * Generates a self-contained, zero-dependency HTML file with pan, zoom, dark mode, search, and component inspector.
 */

import { ParsedTopology } from './architectureAuditor';
import { SlaCalculationReport } from './slaLatencyCalculator';

interface GenerateStandaloneHtmlOptions {
  title: string;
  svgContent: string;
  topology: ParsedTopology;
  slaReport?: SlaCalculationReport;
}

export function generateStandaloneInteractiveHtml(options: GenerateStandaloneHtmlOptions): string {
  const { title, svgContent, topology, slaReport } = options;
  const nodesJson = JSON.stringify(topology.nodes);
  const edgesJson = JSON.stringify(topology.edges);
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} — vish.al Interactive Architecture</title>
  <style>
    :root {
      --bg: #f8fafc;
      --surface: #ffffff;
      --text: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --primary: #f08705;
      --primary-hover: #d97706;
      --accent: #6366f1;
    }
    [data-theme="dark"] {
      --bg: #090d16;
      --surface: #111827;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --border: #1f2937;
      --primary: #f59e0b;
      --primary-hover: #fbbf24;
      --accent: #818cf8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      user-select: none;
    }
    header {
      height: 56px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      z-index: 20;
    }
    .brand-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-badge {
      background: #111827;
      color: #fff;
      font-weight: 900;
      font-size: 13px;
      padding: 4px 8px;
      border-radius: 6px;
      letter-spacing: -0.5px;
    }
    .logo-badge span { color: var(--primary); }
    .doc-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--text);
      max-width: 280px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 12px;
      background: rgba(240, 135, 5, 0.12);
      color: var(--primary);
      font-weight: 600;
    }
    .actions-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .search-input {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 12px;
      color: var(--text);
      outline: none;
      width: 180px;
      transition: all 0.2s;
    }
    .search-input:focus {
      border-color: var(--primary);
      width: 240px;
    }
    .btn {
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;
    }
    .btn:hover { background: var(--border); }
    .btn-primary {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }
    .btn-primary:hover { background: var(--primary-hover); }
    
    #viewport {
      flex: 1;
      position: relative;
      overflow: hidden;
      cursor: grab;
      background-image: radial-gradient(var(--border) 1px, transparent 1px);
      background-size: 24px 24px;
    }
    #viewport.dragging { cursor: grabbing; }
    #canvas-container {
      position: absolute;
      top: 0;
      left: 0;
      transform-origin: 0 0;
      will-change: transform;
    }
    #canvas-container svg {
      display: block;
      filter: drop-shadow(0 10px 25px rgba(0, 0, 0, 0.05));
    }
    .floating-controls {
      position: absolute;
      bottom: 20px;
      right: 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      z-index: 10;
    }
    .control-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: transparent;
      color: var(--text);
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-bottom: 1px solid var(--border);
    }
    .control-btn:last-child { border-bottom: none; }
    .control-btn:hover { background: var(--bg); }

    /* Side Inspector Drawer */
    #inspector {
      position: absolute;
      top: 0;
      right: -360px;
      width: 340px;
      height: 100%;
      background: var(--surface);
      border-left: 1px solid var(--border);
      box-shadow: -4px 0 25px rgba(0, 0, 0, 0.1);
      transition: right 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 30;
      display: flex;
      flex-direction: column;
    }
    #inspector.open { right: 0; }
    .inspector-header {
      padding: 16px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .inspector-body {
      padding: 16px;
      overflow-y: auto;
      flex: 1;
      font-size: 13px;
    }
    .info-card {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
    }
    .info-label {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 4px;
    }
    .info-value {
      font-weight: 600;
      color: var(--text);
    }
    .dimmed { opacity: 0.15 !important; transition: opacity 0.2s; }
    .highlighted { filter: drop-shadow(0 0 12px var(--primary)); }
  </style>
</head>
<body>
  <header>
    <div class="brand-group">
      <div class="logo-badge">vish<span>.al</span></div>
      <div class="doc-title">${escapeHtml(title)}</div>
      <div class="badge">${topology.nodes.length} Components</div>
      ${slaReport ? `<div class="badge" style="background: rgba(16, 185, 129, 0.12); color: #059669;">${slaReport.overallCompositeAvailability}% SLA</div>` : ''}
    </div>

    <div class="actions-group">
      <input type="text" id="search-box" class="search-input" placeholder="Search architecture...">
      <button class="btn" id="theme-btn">🌙 Dark Mode</button>
      <button class="btn" id="fit-btn">⛶ Fit View</button>
      <button class="btn btn-primary" id="download-btn">⬇ Export SVG</button>
    </div>
  </header>

  <div id="viewport">
    <div id="canvas-container">
      ${svgContent}
    </div>

    <div class="floating-controls">
      <button class="control-btn" id="zoom-in" title="Zoom In">+</button>
      <button class="control-btn" id="zoom-out" title="Zoom Out">−</button>
      <button class="control-btn" id="zoom-reset" title="Reset (100%)">1:1</button>
    </div>

    <!-- Component Inspector Drawer -->
    <div id="inspector">
      <div class="inspector-header">
        <h3 id="insp-title" style="font-size: 14px; font-weight: 800;">Component Details</h3>
        <button id="close-inspector" style="background: none; border: none; font-size: 18px; cursor: pointer; color: var(--text-muted);">&times;</button>
      </div>
      <div class="inspector-body">
        <div class="info-card">
          <div class="info-label">Name / Label</div>
          <div class="info-value" id="insp-name">—</div>
        </div>
        <div class="info-card">
          <div class="info-label">Inferred Architecture Tier</div>
          <div class="info-value" id="insp-type">—</div>
        </div>
        <div class="info-card">
          <div class="info-label">Connected Connections</div>
          <div class="info-value" id="insp-connections">—</div>
        </div>
        <div class="info-card">
          <div class="info-label">Diagram Source</div>
          <div class="info-value" style="font-size: 11px; color: var(--text-muted);">
            Generated with vish.al Intelligent Architecture Studio on ${generatedDate}
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const nodes = ${nodesJson};
    const edges = ${edgesJson};

    // Pan & Zoom Engine
    const viewport = document.getElementById('viewport');
    const container = document.getElementById('canvas-container');
    let scale = 1;
    let translateX = 50;
    let translateY = 50;
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    function applyTransform() {
      container.style.transform = \`translate(\${translateX}px, \${translateY}px) scale(\${scale})\`;
    }

    viewport.addEventListener('mousedown', (e) => {
      if (e.target.closest('#inspector') || e.target.closest('.floating-controls')) return;
      isDragging = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      viewport.classList.add('dragging');
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      applyTransform();
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
      viewport.classList.remove('dragging');
    });

    // Wheel Zoom
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      const rect = viewport.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newScale = Math.min(Math.max(scale * zoomFactor, 0.15), 5.0);
      translateX = mouseX - (mouseX - translateX) * (newScale / scale);
      translateY = mouseY - (mouseY - translateY) * (newScale / scale);
      scale = newScale;
      applyTransform();
    }, { passive: false });

    // Zoom Controls
    document.getElementById('zoom-in').onclick = () => { scale = Math.min(scale * 1.25, 5); applyTransform(); };
    document.getElementById('zoom-out').onclick = () => { scale = Math.max(scale / 1.25, 0.15); applyTransform(); };
    document.getElementById('zoom-reset').onclick = () => { scale = 1; translateX = 50; translateY = 50; applyTransform(); };

    // Fit View
    function fitView() {
      const svg = container.querySelector('svg');
      if (!svg) return;
      const svgRect = svg.getBoundingClientRect();
      const vpRect = viewport.getBoundingClientRect();
      const padding = 60;
      const scaleX = (vpRect.width - padding * 2) / (svg.viewBox?.baseVal?.width || svgRect.width / scale);
      const scaleY = (vpRect.height - padding * 2) / (svg.viewBox?.baseVal?.height || svgRect.height / scale);
      scale = Math.min(scaleX, scaleY, 1.2);
      translateX = (vpRect.width - (svg.viewBox?.baseVal?.width || svgRect.width) * scale) / 2;
      translateY = (vpRect.height - (svg.viewBox?.baseVal?.height || svgRect.height) * scale) / 2;
      applyTransform();
    }
    document.getElementById('fit-btn').onclick = fitView;
    window.addEventListener('load', fitView);

    // Dark/Light Theme
    const themeBtn = document.getElementById('theme-btn');
    let isDark = false;
    themeBtn.onclick = () => {
      isDark = !isDark;
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      themeBtn.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    };

    // Component Inspector
    const inspector = document.getElementById('inspector');
    const inspName = document.getElementById('insp-name');
    const inspType = document.getElementById('insp-type');
    const inspConnections = document.getElementById('insp-connections');
    document.getElementById('close-inspector').onclick = () => inspector.classList.remove('open');

    // Click interactive nodes in SVG
    const svgElements = container.querySelectorAll('g[id], text');
    svgElements.forEach((el) => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const textContent = el.textContent?.trim();
        const matchedNode = nodes.find(n => n.label && textContent && (n.label.includes(textContent) || textContent.includes(n.label))) || {
          label: textContent || 'Architecture Component',
          type: 'Cloud Component',
          id: el.id
        };

        inspName.textContent = matchedNode.label;
        inspType.textContent = matchedNode.type || 'Infrastructure Node';
        
        // Find connected
        const connectedEdges = edges.filter(ed => ed.source === matchedNode.id || ed.target === matchedNode.id);
        inspConnections.textContent = \`\${connectedEdges.length} connected dependencies\`;
        
        inspector.classList.add('open');
      });
    });

    // Search and Filter
    const searchBox = document.getElementById('search-box');
    searchBox.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const allText = container.querySelectorAll('text, g');
      if (!q) {
        allText.forEach(el => el.classList.remove('dimmed', 'highlighted'));
        return;
      }
      allText.forEach(el => {
        const text = el.textContent?.toLowerCase() || '';
        if (text.includes(q)) {
          el.classList.remove('dimmed');
          el.classList.add('highlighted');
        } else {
          el.classList.add('dimmed');
          el.classList.remove('highlighted');
        }
      });
    });

    // Export SVG
    document.getElementById('download-btn').onclick = () => {
      const svg = container.querySelector('svg');
      if (!svg) return;
      const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '${escapeHtml(title.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}.svg';
      a.click();
    };

    setTimeout(fitView, 100);
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

