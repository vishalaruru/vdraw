# 🤝 Contributing to vish.al Studio

Thank you for your interest in contributing to **vish.al Intelligent Architecture Studio**! We welcome community contributions, bug fixes, new security rules, and feature enhancements.

---

## 🛠️ Development Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/vishalaruru/vdraw.git
cd vdraw

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Start local development server
npm run dev
```

The app will be accessible at `http://localhost:6173`.

---

## 🧩 How to Extend the Studio

### 1. Adding a New Security Linter Rule
Security rules live in [`src/services/architectureAuditor.ts`](../src/services/architectureAuditor.ts).
To add a new rule:
1. Inspect nodes and edges using `extractTopologyFromXml(xml)`.
2. Add your check function returning a `SecurityFinding` object:
```typescript
{
  id: 'sec_new_rule',
  title: 'Missing TLS on Ingress',
  severity: 'high',
  category: 'Zero-Trust',
  description: 'Unencrypted HTTP traffic detected on edge listener.',
  remediation: 'Attach an ACM certificate or enforce HTTPS redirect on the ALB.',
}
```

### 2. Adding Cloud Provider Pricing / Sizing
Cloud pricing models live in [`src/services/costEstimator.ts`](../src/services/costEstimator.ts).
You can add regional pricing tiers for EC2, RDS, Cloud Run, BigQuery, or Azure SQL by expanding the provider catalog dictionary.

### 3. Adding New Cloud Icons & Components
Pre-made cloud component presets live in [`src/services/cloudComponents.ts`](../src/services/cloudComponents.ts).
Define the XML cell style, default dimensions, vendor category (AWS, GCP, Azure, CNCF), and label.

---

## 🧪 Code Quality & Build Verification

Before submitting a Pull Request, ensure that TypeScript compilation and the Vite production build pass without errors:

```bash
# Run TypeScript check and Vite build
npm run build
```

---

## 📝 Pull Request Guidelines

1. Create a descriptive feature branch: `git checkout -b feature/my-cool-feature`
2. Follow standard TypeScript formatting and maintain modular service boundaries.
3. Commit with semantic messages (e.g., `feat: add Snowflake pricing model to FinOps estimator`).
4. Push to your fork and submit a Pull Request to `main`.
