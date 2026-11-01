# ❓ Frequently Asked Questions (FAQ)

### 1. Data Privacy: Are my architecture diagrams sent to external servers?
**No.** All diagram parsing, topology graph construction, FinOps pricing estimations, and SLA calculations happen **100% locally in your browser**. 
* Diagram states are saved strictly into browser `localStorage`.
* If you use the **Vision AI Upload** or **Prompt to Architecture** features, your input is sent directly from your browser to Google's Gemini API using your personal client-side API key (`VITE_GEMINI_API_KEY`).
* If no API key is provided, the studio falls back to a **local offline heuristic generator** with zero network requests.

---

### 2. Can I use vdraw completely air-gapped or offline?
**Yes.** Once dependencies are installed, all core studio features work without an internet connection:
* Full canvas diagramming & editing.
* Auto-Align & Beautification.
* Security & SOLID Architecture Audit.
* STRIDE Threat Modeling.
* Latency & Composite SLA Availability Calculator.
* SQL / Prisma to ERD.
* Reverse IaC (Terraform, Docker Compose, Kubernetes).
* Export to native `.drawio` XML, PNG, SVG, and Standalone Interactive HTML.

---

### 3. Are the exported `.drawio` files compatible with official Draw.io and VS Code?
**Yes, 100% lossless compatibility.** 
`vish.al Intelligent Architecture Studio` generates valid, standard Draw.io XML files. You can open them in:
* Official web [diagrams.net](https://app.diagrams.net/)
* Draw.io Desktop Application (macOS, Windows, Linux)
* VS Code Draw.io Extension (`hediet.vscode-drawio`)
* Confluence & Jira Draw.io plugins

---

### 4. How does the Latency & SLA Calculator compute 99.99% availability?
The engine uses the **series reliability multiplication theorem**:
$$A_{\text{composite}} = \prod_{i=1}^{n} A_i$$
When client requests traverse from Edge (99.99%) &rarr; Ingress (99.95%) &rarr; Microservices (99.95%) &rarr; Database (99.95%), the composite availability is:
$$A = 0.9999 \times 0.9995 \times 0.9995 \times 0.9995 \approx 99.84\%$$
The calculator alerts you that despite individual components having "three nines", the composite system fails a 99.9% target unless asynchronous message queues (SQS/Kafka) or caching layers decouple the failure domains.

---

### 5. Where do the Cloud Cost & FinOps estimates come from?
The cost estimator references normalized retail hourly and monthly pricing models for compute instances, managed database clusters, object storage, and networking across:
* **AWS:** EC2, ALB, EKS, RDS Multi-AZ, S3, ElastiCache, SQS, Kafka MSK.
* **Google Cloud (GCP):** Cloud Run, GKE, Cloud SQL, BigQuery, Cloud Storage.
* **Microsoft Azure:** App Services, AKS, Azure SQL, Blob Storage, Service Bus.

---

### 6. What makes the Standalone Interactive HTML Export special?
Traditional export options (PNG/PDF) are flat, non-interactive images. If you zoom into a large architecture diagram on PNG, it becomes pixelated, and you cannot search for components.
The **Interactive HTML Export** packages:
1. The full vector SVG.
2. A pan/zoom mouse and trackpad engine.
3. A real-time component search bar.
4. An interactive node inspector drawer.
5. Dark and Light mode themes.
...all embedded inside a **single, zero-dependency `.html` file** (typically under 250KB) that opens in any browser on any device with no software installation required.

