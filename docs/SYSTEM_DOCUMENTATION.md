# vish.al Intelligent Architecture Studio — Complete System Documentation & Visual Guide

Welcome to the comprehensive technical documentation for **`vish.al` Intelligent Architecture Studio**. This document provides an elaborated breakdown of the architectural redesign of Draw.io, its pastel navigation hierarchy, AI toolchain, security and resilience linters, FinOps cost modeling, SLA and latency calculators, and standalone interactive exports.

---

## Table of Contents
1. [Executive Overview & Vision](#1-executive-overview--vision)
2. [Redesign & Studio UI Architecture](#2-redesign--studio-ui-architecture)
   - [2.1 Brand Identity & Twinkling AI Logo](#21-brand-identity--twinkling-ai-logo)
   - [2.2 Workspace Tabs, Renaming & Auto-Save](#22-workspace-tabs-renaming--auto-save)
   - [2.3 Pastel-Themed Navigation System](#23-pastel-themed-navigation-system)
   - [2.4 Draw.io Native Menu & Toolbar Preservation](#24-drawio-native-menu--toolbar-preservation)
3. [Elaborated Menu Suite & Snapshots](#3-elaborated-menu-suite--snapshots)
   - [3.1 Group 1: AI Architecture Suite](#31-group-1-ai-architecture-suite)
   - [3.2 Group 2: Align & Flow (Canvas Layout & Motion)](#32-group-2-align--flow-canvas-layout--motion)
   - [3.3 Group 3: Security & Resilience (Zero-Trust & Chaos)](#33-group-3-security--resilience-zero-trust--chaos)
   - [3.4 Group 4: IaC & Technical Documentation](#34-group-4-iac--technical-documentation)
   - [3.5 Group 5: Miscellaneous (FinOps, Latency/SLA, ERD, Presentation)](#35-group-5-miscellaneous-finops-latencysla-erd-presentation)
   - [3.6 Group 6: Save & Export (Drawio, PNG, SVG, Interactive HTML)](#36-group-6-save--export-drawio-png-svg-interactive-html)
4. [Deep-Dive Feature Modals & Engines](#4-deep-dive-feature-modals--engines)
   - [4.1 Latency, SLA & Availability Calculator](#41-latency-sla--availability-calculator)
   - [4.2 Cloud Cost & FinOps Estimator](#42-cloud-cost--finops-estimator)
   - [4.3 STRIDE Threat Modeling](#43-stride-threat-modeling)
   - [4.4 Security & SOLID Architecture Auditor](#44-security--solid-architecture-auditor)
   - [4.5 Command Palette (⌘K)](#45-command-palette-k)
   - [4.6 Database SQL / Prisma to ERD](#46-database-sql--prisma-to-erd)
   - [4.7 Reverse IaC Engine](#47-reverse-iac-engine)
5. [Architecture & Communication Flow](#5-architecture--communication-flow)

---

## 1. Executive Overview & Vision

**`vish.al` Intelligent Architecture Studio** transforms traditional, passive diagramming into an active, intelligent software engineering workbench. Beyond standard vector drawing, the studio continuously analyzes diagrams to deliver:
- **Instant AI Synthesis:** Sketch-to-diagram, natural language prompts, and conversational diagram iteration.
- **Reliability Engineering:** Serial composite availability ($A = \prod A_i$), tail-latency profiling (P50/P95/P99), and critical bottleneck detection.
- **Architectural Linting:** Automated checks for Zero-Trust boundaries, single points of failure (SPOF), and SOLID principles.
- **FinOps Intelligence:** Multi-cloud cost breakdown (AWS, GCP, Azure) and budget optimization recommendations.
- **Code & IaC Interoperability:** Bi-directional import and export between visual diagrams and Terraform, Docker Compose, Kubernetes, and SQL/Prisma schemas.

![Studio Overview](screenshots/01_app_overview.png)

---

## 2. Redesign & Studio UI Architecture

### 2.1 Brand Identity & Twinkling AI Logo
The header was elevated with a prominent branding layer:
- **Brand Emblem:** The `vish.al` badge features a high-contrast cloud architecture symbol with embedded AI sparkle motifs.
- **Brand Typography:** Bold `vish.al` headline with a gold-sparkle twinkling indicator (`AI`) and the subtitle:
  `Intelligent Architecture Studio`
- **Proportional Scaling:** Double-sized brand container seamlessly integrated without overlapping canvas tools.

### 2.2 Workspace Tabs, Renaming & Auto-Save
- **Editable Diagram Titles:** Click directly on the title tab (e.g. `Untitled Diagram`) to rename it with immediate persistence.
- **Multi-Tab Architecture:** Support for multiple diagrams within a single session via the `+` button.
- **Persistent LocalStorage Auto-Save:** Canvas state is automatically serialized and saved with debouncing.
- **Reload Protection:** Prevents accidental data loss by hooking `beforeunload` to warn the user if unsaved changes exist.

### 2.3 Pastel-Themed Navigation System
To replace cluttered toolbars with a clean design, tools are categorized into 6 pastel-themed dropdown menus:
1. **AI (Amber/Orange Pastel):** AI generation, sketch upload, and conversational copilot.
2. **Align & Flow (Teal/Emerald Pastel):** Layout beautifier and animated request packet simulation.
3. **Security (Rose/Pink Pastel):** Security & SOLID auditor, STRIDE threat modeler, and Chaos Monkey.
4. **IaC & Docs (Indigo/Blue Pastel):** Reverse IaC parser, Terraform/Mermaid exporter, and ADR technical specs.
5. **Misc (Purple/Fuchsia Pastel):** FinOps cost breakdown, Latency/SLA calculator, SQL/Prisma ERD, Revision history, Presentation mode, and `⌘K` palette.
6. **Export (Slate/Zinc Pastel):** Native Draw.io XML, PNG, SVG, and Standalone Interactive HTML.

### 2.4 Draw.io Native Menu & Toolbar Preservation
The original Draw.io menus (`File`, `Edit`, `View`, `Arrange`, `Extras`, `Help`) and toolbar controls (zoom, undo, redo, format panels) are preserved below the studio bar.

---

## 3. Elaborated Menu Suite & Snapshots

### 3.1 Group 1: AI Architecture Suite
![AI Menu](screenshots/02_ai_menu.png)

- **Upload Architecture Image / Sketch:** Employs multimodal Gemini Vision to convert whiteboard sketches, architectural screenshots, or hand-drawn notes into editable Draw.io XML shapes.
- **Conversational Draw (Copilot):** Natural language chat bar allowing users to request modifications (e.g. *"Add a Redis cache before Postgres"* or *"Wrap payment services in a private subnet"*).
- **Prompt to Architecture:** Generates complete architectures from simple natural language briefs with automatic tiering, cloud icons, and connections.

---

### 3.2 Group 2: Align & Flow (Canvas Layout & Motion)
![Align & Flow Menu](screenshots/03_align_flow_menu.png)

- **Auto-Align & Beautify:** Algorithmically adjusts node spacing, aligns peer services along horizontal/vertical grids, and removes overlapping connector paths.
- **Simulate Traffic Flow:** Injects animated SVG pulse strokes along connector paths to visualize live simulated HTTP/gRPC request flows across the system.

---

### 3.3 Group 3: Security & Resilience (Zero-Trust & Chaos)
![Security Menu](screenshots/04_security_menu.png)

- **Security & SOLID Audit:** Scans diagram nodes and edges against Zero-Trust network rules, unencrypted database boundaries, and single points of failure (SPOF).
- **STRIDE Threat Model:** Analyzes components against Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege.
- **Chaos Simulator (Blast Radius):** Simulates component outages (e.g., database failure) and highlights cascading impact paths across the diagram.

---

### 3.4 Group 4: IaC & Technical Documentation
![IaC & Docs Menu](screenshots/05_iac_docs_menu.png)

- **Import IaC:** Reverses Terraform HCL, Docker Compose YAML, and Kubernetes manifests into visual cloud topology diagrams.
- **Export IaC & Code:** Compiles the visual diagram into production-ready Terraform definitions, Docker Compose files, and Mermaid.js diagrams.
- **Architecture Spec & ADR:** Generates markdown architectural specifications and Architecture Decision Records (ADR).

---

### 3.5 Group 5: Miscellaneous (FinOps, Latency/SLA, ERD, Presentation)
![Miscellaneous Menu](screenshots/06_misc_menu.png)

- **Cloud Cost & FinOps:** Analyzes components to calculate estimated monthly run rates across AWS, GCP, and Azure with FinOps savings opportunities.
- **Latency & SLA:** Calculates end-to-end composite availability, allowed downtime budgets, P95 critical request paths, and bottleneck hops.
- **SQL / Prisma to ERD:** Generates interactive Entity Relationship Diagrams directly from SQL DDL statements or Prisma schema definitions.
- **Revision History:** Time-travel version control with one-click snapshot rollback and version diffs.
- **Presentation Mode:** Turns diagrams into interactive architectural slide decks with spotlight navigation.
- **Command Palette (`⌘K`):** Global quick-action search modal for navigating studio tools and commands.

---

### 3.6 Group 6: Save & Export (Drawio, PNG, SVG, Interactive HTML)
![Export Menu](screenshots/07_export_menu.png)

- **Save Diagram (.drawio):** Native XML format compatible with any Draw.io instance.
- **Export PNG & SVG:** High-resolution raster and scalable vector graphics.
- **Export Standalone Interactive HTML:** Bundles the diagram into a zero-dependency, self-contained offline viewer with interactive pan/zoom, search filters, and a node inspector drawer.

---

## 4. Deep-Dive Feature Modals & Engines

### 4.1 Latency, SLA & Availability Calculator
![SLA & Latency Modal](screenshots/10_sla_latency_modal.png)

```mermaid
flowchart LR
    A["Client Edge\n(CloudFront: 99.99%)"] --> B["API Gateway\n(ALB: 99.95%)"]
    B --> C["Microservice Pod\n(EKS: 99.95%)"]
    C --> D["Cache\n(Redis: 99.9%)"]
    C --> E["Primary DB\n(RDS Multi-AZ: 99.95%)"]
```

#### Reliability Metrics Calculated:
1. **Composite Availability ($A$):**
   $$A_{\text{composite}} = \prod_{i=1}^{n} A_i$$
2. **Downtime Budgets:**
   - **Yearly Downtime:** $(1 - A_{\text{composite}}) \times 365.25 \times 24 \times 3600 \text{ seconds}$
   - **Monthly Downtime:** Yearly Downtime $\div 12$
   - **Daily Downtime:** Yearly Downtime $\div 365.25$
3. **Tail Latency Profiling:** Critical path DFS computes additive network and compute latency for P50, P95, and P99 percentiles.
4. **Bottleneck Flagging:** Automatically highlights the node contributing the largest portion of total request latency.

---

### 4.2 Cloud Cost & FinOps Estimator
![Cost Estimator Modal](screenshots/09_cost_estimator_modal.png)

- **Multi-Cloud Mapping:** Normalizes diagram components into standard compute, storage, network, and database classes.
- **Provider Comparisons:** Compares estimated monthly expenditures across AWS, GCP, and Azure.
- **FinOps Optimization:** Highlights underutilized provisioned resources, idle database read replicas, and opportunities for spot/savings plans.

---

### 4.3 STRIDE Threat Modeling
![STRIDE Threat Model Modal](screenshots/11_threat_model_modal.png)

Maps architectural assets to the Microsoft STRIDE framework:
- **S**poofing: Missing identity validation on incoming edge paths.
- **T**ampering: Unauthenticated message queues or cleartext database connectors.
- **R**epudiation: Services lacking distributed trace IDs or access logs.
- **I**nformation Disclosure: Publicly accessible storage buckets or VPC egress holes.
- **D**enial of Service: Unthrottled API endpoints lacking rate-limiters.
- **E**levation of Privilege: Direct database access from frontend services without middleware.

---

### 4.4 Security & SOLID Architecture Auditor
![Security & SOLID Audit Drawer](screenshots/13_audit_drawer.png)

- Evaluates diagrams against AWS Well-Architected Framework pillars (Security, Reliability, Performance, Cost).
- Inspects network boundaries for proper VPC isolation and zero-trust segmentation.
- Validates SOLID architecture principles in software components (Single Responsibility, Interface Segregation, Dependency Inversion).
- Features one-click **"Auto-Fix"** to automatically insert recommended subnets, firewalls, and gateway nodes.

---

### 4.5 Command Palette (⌘K)
![Command Palette](screenshots/12_command_palette.png)

- Accessible anywhere via `⌘K` (macOS) or `Ctrl+K` (Windows/Linux).
- Fuzzy search indexing across all actions: AI Generation, Chaos Injection, FinOps Audits, Latency Profiles, and Export options.

---

### 4.6 Database SQL / Prisma to ERD
![SQL to ERD Modal](screenshots/14_sql_erd_modal.png)

- Parses SQL `CREATE TABLE` DDL scripts, primary keys, foreign keys, and relations.
- Parses Prisma schema models, field types, `@id`, and `@relation` attributes.
- Generates relational tables with field types, keys, and connecting relationship lines on the canvas.

---

### 4.7 Reverse IaC Engine
![Reverse IaC Modal](screenshots/15_iac_reverse_modal.png)

- Ingests Terraform `.tf` HCL, Docker Compose `docker-compose.yml`, and Kubernetes manifest YAML.
- Reconstructs visual cloud topology nodes with appropriate vendor logos, container tiers, and dependency arrows.

---

## 5. Architecture & Communication Flow

The studio communicates with the underlying Draw.io iframe using a decoupled bidirectional postMessage protocol:

```mermaid
sequenceDiagram
    autonumber
    participant Host as vish.al Studio Host
    participant Bridge as DrawioEditor Bridge
    participant Iframe as Draw.io Embedded Iframe
    participant AI as Gemini API Engine

    Host->>Bridge: User loads or imports diagram
    Bridge->>Iframe: postMessage({ action: 'load', xml })
    Iframe-->>Bridge: postMessage({ event: 'load' })
    
    Note over Host,Iframe: Continuous Auto-Save & Debounce
    Iframe->>Bridge: postMessage({ event: 'autosave', xml })
    Bridge->>Host: onSave(xml) -> localStorage persist
    
    Note over Host,AI: AI Prompt / Sketch Ingestion
    Host->>AI: Send image / text prompt
    AI-->>Host: Generated structured architecture XML
    Host->>Bridge: loadXml(generatedXml)
    Bridge->>Iframe: postMessage({ action: 'load', xml: generatedXml })
    
    Note over Host,Iframe: Reliability & SLA Analysis
    Host->>Host: extractTopologyFromXml(currentXml)
    Host->>Host: calculateArchitectureSla(nodes, edges)
    Host->>Host: Render SlaLatencyModal with critical path
```

---

*Documentation compiled and maintained for vish.al Intelligent Architecture Studio.*

