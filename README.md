# Draw.io Studio + Vision AI (Image to Editable Diagram)

An enhanced **draw.io** clone and visual studio with an integrated **Multimodal Vision AI** pipeline. Upload any flowchart, architectural diagram, whiteboard sketch, or screenshot, and immediately transform it into native, fully interactive, editable draw.io shapes and connectors.

---

## Features

- **Full draw.io Canvas:** Complete native diagramming environment with all shapes, connectors, alignment tools, format inspector, and canvas controls.
- **Image-to-Diagram AI Engine:**
  - **Drop / Paste / Browse:** Drag & drop any image file (PNG, JPG, SVG, WebP) or paste directly from clipboard (<kbd>Cmd+V</kbd> / <kbd>Ctrl+V</kbd>).
  - **Multimodal AI Detection:** Detects flowchart symbols (processes, decisions/rhombus, database cylinders, start/end ovals, actors, clouds, inputs/outputs), extracts all labels/text, and maps orthogonal connectors.
  - **Gemini Multimodal API Support:** Seamlessly connect Google Gemini 2.5 Flash / 1.5 Flash Vision models with a single-click API key field.
  - **Smart Local Heuristic Fallback:** Generates structured diagrams even without an API key.
- **Theming & Color Palettes:**
  - *Modern Indigo (Cloud & SaaS)*
  - *Classic draw.io (Corporate Blue/Yellow)*
  - *Emerald Mint (Clean/Green)*
  - *Sunset Coral (Warm Accent)*
  - *Minimalist Clean (Monochrome)*
- **One-Click Sample Flowcharts:** Test immediately with pre-built flows:
  - User Authentication & MFA Workflow
  - E-Commerce Order & Payment Pipeline
  - Event-Driven Microservices Architecture
- **Export & Download:** Save as native `.drawio` XML, PNG, or SVG with one click.

---

## Getting Started

### 1. Install & Run Dev Server

```bash
cd /Users/VishalKumar.Aruru/draw.io_clone
npm install
npm run dev
```

The application will be live at: **`http://localhost:6173`**

### 2. Convert an Image to a Diagram

1. Click **"Upload Diagram Image"** in the top navigation bar.
2. Drag and drop your flowchart image or click to select a file.
3. Choose your preferred **Theme** and whether to **Replace Page** or **Append / Merge**.
4. Click **"Convert Image to Diagram"** &rarr; **"Render on Draw.io Canvas"**.
5. Your uploaded image is now a native, fully draggable, and editable draw.io diagram!

