# Changelog

All notable changes to **vish.al Intelligent Architecture Studio** are documented here.
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - 2026-11-02

### 🚀 Added

#### 1. Official Cloud & Web-Augmented Icon Beautifier
- **3-Tier Brand & Cloud Recognition Engine (`src/services/iconBeautifier.ts`)**:
  - **Tier 1 (Official Cloud Stencils)**: Local catalog of official stencils for AWS (S3, RDS, Lambda, DynamoDB, API Gateway, SQS, CloudFront, Service/Data Catalog, EC2, ECS, etc.), GCP, Azure, Kubernetes, and Web Clients.
  - **Tier 2 (Vector Tech Stacks via SimpleIcons)**: 3,000+ developer and infrastructure tool SVGs (PostgreSQL, MySQL, Redis, Apache Kafka, Docker, MongoDB, Snowflake, Datadog, Stripe, Auth0, Twilio, Cloudflare, Sentry, Prometheus, Grafana, etc.).
  - **Tier 3 (AI + Web Search Grounding via Google High-Res Brand Favicon CDN)**: Multimodal Gemini classification to recognize specialized B2B software vendors, OTT media streaming platforms (Conviva, Bitmovin, Axinom, DAZN), and proprietary SaaS, fetching official 128px high-resolution logos (`https://t2.gstatic.com/faviconV2?url=...&size=128`).
- **Interactive Icon Preview & Customization Modal (`src/components/IconBeautifierModal.tsx`)**:
  - Live logo thumbnail previews next to each detected component.
  - Source transparency badges: `[Web]` vs `[Local / Provider]`.
  - Filter by cloud provider and search query.
  - Interactive `🌐 Search Web Logos` button with real-time loading feedback to dynamically discover brand logos for unmatched canvas nodes.
- **Strict Zero Data Loss & Docking Preservation Guarantee**:
  - 100% of arrows, orthogonal routes, waypoints, edge sources/targets, and labels are preserved.
  - Geometric center anchoring: new shapes are mathematically centered ($\text{newX} = \text{centerX} - \frac{\text{newW}}{2}$), keeping connector docking points aligned.
  - Unmatched flow nodes, condition diamonds, and container boundaries are skipped without modification.

#### 2. Architecture-to-Prompt (Reverse Prompt Engineering) Engine (`src/services/architectureToPrompt.ts`)
- Reverse-engineers any canvas diagram into a comprehensive, unambiguous natural language prompt, RFC engineering specification, and Mermaid flowchart.
- **16k Token Output & JSON Recovery**: Robust token handling with streaming/large-context recovery to prevent truncation on large architectures.
- **1-Click "Test & Re-Synthesize"**: Instant validation loop allowing architects to re-generate the architecture from the extracted prompt.

---

### 🛠️ Fixed & Improved

#### 1. Conversational Diagram Copilot (`src/services/diagramCopilot.ts`)
- **Directional Grammar Awareness**:
  - Phrases with `"to"` (e.g., `"Add Web to User Enters Credentials"`) or `"before"`/`"above"` correctly position the new component upstream and direct the arrow `New ➔ Anchor`.
  - Phrases with `"from"`, `"after"`, or `"right of"` position downstream and direct the arrow `Anchor ➔ New`.
- **Fuzzy Anchor Resolution**:
  - Resolves partial name queries (e.g., `"Add Catalog to display Error..."` automatically finds and connects to `"Display Error & Increment Attempts"`).
- **Reverse Arrow Command**:
  - Added support for flipping edge direction via natural language (`"reverse arrow between [A] and [B]"`).
- **Comprehensive Draw Suite**:
  - Insert, connect, rename, replace, move, and delete nodes conversationally.

#### 2. Deterministic Layout Beautifier (`src/services/diagramBeautifier.ts`)
- **Infinite Loop Prevention**: Resolved recursion hangs in hierarchical flow cycle ranking by constructing an acyclic spanning tree before assigning node ranks.
- **Obstacle Avoidance Gutters**: Connectors route along obstacle-free gutters around intermediate nodes, preventing lines from cutting through node bodies.
- **Perimeter Edge Docking**: Forces arrows to dock at shape boundaries rather than converging at internal node origins.
- **DOM Layer Reordering**: Connectors are serialized underneath vertex shapes in the mxGraph XML tree, ensuring labels and icons are never obstructed.

#### 3. Security & Resilience UI Polish
- **Security & SOLID Audit Drawer (`src/components/ArchitectureAuditDrawer.tsx`)**:
  - Pinned category tabs (`Critical`, `Security`, `Reliability & DLQ`, `SOLID`, `Performance`) to the top of the panel, ensuring permanent visibility and one-click filtering regardless of scroll position.
- **Chaos Monkey Simulator (`src/components/ChaosSimulatorBar.tsx`)**:
  - Clamped max width (`max-w-xl`) to prevent bar stretching on wide displays.
  - Added drag-and-drop repositioning across the canvas.
  - Filtered container and boundary nodes from target selection dropdowns.

#### 4. Vision AI & Auth Hardening
- **Layer 2 Shape Traversal**: Correctly traverses multi-layer Draw.io diagrams to extract all shapes and connectors.
- **Sub-Second Native Metadata Extraction**: Eliminates vision buffering timeouts with 12s fallback guards and model escalation (`gemini-flash-lite-latest` ➔ `gemini-3-flash-preview`).
- **Auth Hardening**: Enforces `.env` API key precedence and automatically purges revoked legacy keys from `localStorage`.

