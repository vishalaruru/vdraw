# vish.al Intelligent Architecture Studio

> Cloud-Native Diagramming, AI Synthesis, Zero-Trust Security, FinOps Costing & SLA Reliability Workbench

![Studio Overview](docs/screenshots/01_app_overview.png)

**`vish.al` Intelligent Architecture Studio** supercharges Draw.io into an enterprise-grade software engineering workbench. Beyond standard diagramming, it incorporates an AI synthesis pipeline, security and SOLID linters, FinOps multi-cloud pricing calculators, SLA/latency critical-path modeling, and zero-dependency standalone HTML exports.

📖 **[Read the Full System Documentation & Visual Guide (docs/SYSTEM_DOCUMENTATION.md)](docs/SYSTEM_DOCUMENTATION.md)**

---

## 🚀 Key Feature Suites & Menu Re-design

| Pastel Menu Group | Color Theme | Included Capabilities |
| :--- | :--- | :--- |
| **`AI`** | Amber / Orange Pastel | **Upload Image / Sketch** (Gemini Vision AI), **Conversational Draw** (Chat Copilot), **Prompt to Architecture** |
| **`Align & Flow`** | Teal / Emerald Pastel | **Auto-Align & Beautify** (Force-directed layout cleaning), **Simulate Traffic Flow** (Animated SVG pulse packets) |
| **`Security`** | Rose / Pink Pastel | **Security & SOLID Audit** (Zero-Trust & SPOF linter with Auto-Fix), **STRIDE Threat Model**, **Chaos Simulator** |
| **`IaC & Docs`** | Indigo / Blue Pastel | **Import Reverse IaC** (Terraform, Compose, K8s), **Export IaC** (HCL, Docker, Mermaid), **Architecture Spec & ADR** |
| **`Misc`** | Purple / Violet Pastel | **Cloud Cost & FinOps** (AWS/GCP/Azure breakdown), **Latency & SLA Calculator**, **SQL / Prisma to ERD**, **Revision History**, **Presentation Mode**, **Command Palette (`⌘K`)** |
| **`Export`** | Slate / Zinc Pastel | **Save .drawio XML**, **Export PNG**, **Export SVG**, **Interactive Standalone HTML** (offline viewer) |

---

## 📸 Visual Snapshots

| Feature | Screenshot |
| :--- | :--- |
| **AI Menu** | ![AI Menu](docs/screenshots/02_ai_menu.png) |
| **Latency, SLA & Downtime Calculator** | ![SLA & Latency](docs/screenshots/10_sla_latency_modal.png) |
| **Cloud Cost & FinOps Estimator** | ![Cost Estimator](docs/screenshots/09_cost_estimator_modal.png) |
| **STRIDE Threat Modeling** | ![Threat Model](docs/screenshots/11_threat_model_modal.png) |
| **Security & SOLID Audit Drawer** | ![Audit Drawer](docs/screenshots/13_audit_drawer.png) |
| **Command Palette (`⌘K`)** | ![Command Palette](docs/screenshots/12_command_palette.png) |
| **Database SQL / Prisma to ERD** | ![SQL to ERD](docs/screenshots/14_sql_erd_modal.png) |
| **Reverse IaC (Terraform / Compose / K8s)** | ![Reverse IaC](docs/screenshots/15_iac_reverse_modal.png) |

---

## 🛠️ Quickstart

### 1. Prerequisites
- Node.js 18+
- Modern Web Browser (Chrome, Safari, Edge, Firefox)

### 2. Setup & Installation
```bash
git clone https://github.com/vishalaruru/vdraw.git
cd vdraw
npm install
cp .env.example .env
# Add your Gemini API key to .env:
# VITE_GEMINI_API_KEY=your_gemini_api_key_here
npm run dev
```

The application will run at **`http://localhost:6173`**.

---

## 🧩 Architectural Foundations

- **Host App:** React 19 + TypeScript + Vite + TailwindCSS + Lucide Icons.
- **Canvas Engine:** Embedded Draw.io runtime utilizing asynchronous `postMessage` protocol for XML synchronization, SVG rasterization, and bidirectional command invocation.
- **AI Processing:** Multimodal Google Gemini API with fallback heuristic algorithms for offline or air-gapped usage.
- **Topology Graph Parser:** Custom XML DOM parser extracting node classifications, network boundaries, and edge directions into an adjacency matrix for FinOps and SLA calculations.

---

Distributed under the MIT License. Built with ❤️ for cloud architects and software engineers.
