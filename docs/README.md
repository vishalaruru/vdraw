# 📚 vish.al Studio — Documentation Portal

Welcome to the central documentation portal for **vish.al Intelligent Architecture Studio**. This directory contains all technical guides, architectural internals, executive summaries, FAQs, and contribution workflows.

---

## 🗺️ Documentation Directory

| Document | Format | Target Audience | Description |
| :--- | :---: | :--- | :--- |
| **[Executive Summary Dashboard](EXECUTIVE_SUMMARY.html)** | Interactive HTML | Executives, Leads & Architects | Comprehensive 6-pillar analysis for every studio module (What, How to work, Why, Motive, How it helps, Why use this). |
| **[System Documentation & User Guide](SYSTEM_DOCUMENTATION.md)** | Markdown | All Users & Developers | Complete operational manual, feature walk-throughs, and 15 visual snapshots. |
| **[Architecture Internals & Bridge](ARCHITECTURE_INTERNALS.md)** | Technical Spec | Core Contributors | Detailed technical breakdown of the `postMessage` protocol, DOM topology parser, and SLA DFS algorithms. |
| **[Frequently Asked Questions (FAQ)](FAQ.md)** | Q&A | Users & Evaluators | Privacy, air-gapped usage, cloud compatibility, and Draw.io desktop interoperability. |
| **[Contributing Guide](CONTRIBUTING.md)** | Guide | Open-Source Contributors | How to set up local dev, add new security linter rules, cloud components, and FinOps pricing models. |

---

## 📸 Visual Snapshots Index

All visual snapshots are captured at high resolution from live enterprise cloud architectures on the canvas:

- [`01_app_overview.png`](screenshots/01_app_overview.png) — Full studio overview with Enterprise Multi-Cloud architecture on canvas.
- [`02_ai_menu.png`](screenshots/02_ai_menu.png) — AI Architecture Suite dropdown.
- [`03_align_flow_menu.png`](screenshots/03_align_flow_menu.png) — Align & Flow layout and packet simulation dropdown.
- [`04_security_menu.png`](screenshots/04_security_menu.png) — Security & Resilience audit dropdown.
- [`05_iac_docs_menu.png`](screenshots/05_iac_docs_menu.png) — IaC & Documentation dropdown.
- [`06_misc_menu.png`](screenshots/06_misc_menu.png) — Miscellaneous tools dropdown (FinOps, SLA, ERD, History).
- [`07_export_menu.png`](screenshots/07_export_menu.png) — Save & Standalone HTML export dropdown.
- [`08_prompt_modal.png`](screenshots/08_prompt_modal.png) — Prompt to Architecture generation modal.
- [`09_cost_estimator_modal.png`](screenshots/09_cost_estimator_modal.png) — Cloud Cost & FinOps multi-cloud estimator.
- [`10_sla_latency_modal.png`](screenshots/10_sla_latency_modal.png) — Latency, SLA & Availability calculator modal.
- [`11_threat_model_modal.png`](screenshots/11_threat_model_modal.png) — STRIDE Threat Modeling modal.
- [`12_command_palette.png`](screenshots/12_command_palette.png) — Command Palette (`⌘K`) launcher.
- [`13_audit_drawer.png`](screenshots/13_audit_drawer.png) — Security & SOLID Architecture Audit drawer with Auto-Fix.
- [`14_sql_erd_modal.png`](screenshots/14_sql_erd_modal.png) — SQL DDL & Prisma to ERD generator modal.
- [`15_iac_reverse_modal.png`](screenshots/15_iac_reverse_modal.png) — Reverse IaC code-to-diagram modal.

---

## 💡 Quick Tips
- To preview the **Executive Summary Dashboard**, simply open [`docs/EXECUTIVE_SUMMARY.html`](EXECUTIVE_SUMMARY.html) directly in any modern browser.
- For deep code dive into React state hooks and iframe synchronization, see [`src/components/DrawioEditor.tsx`](../src/components/DrawioEditor.tsx).
