import { extractTopologyFromXml, ParsedTopologyNode } from './architectureAuditor';

export type CloudProvider = 'aws' | 'gcp' | 'azure';

export interface CostLineItem {
  id: string;
  componentName: string;
  cloudService: string;
  instanceTypeOrTier: string;
  monthlyCost: number;
  category: 'Compute' | 'Database' | 'Storage' | 'Networking' | 'Caching & Queues' | 'Security & Observability';
  notes: string;
}

export interface FinOpsSavingTip {
  id: string;
  title: string;
  description: string;
  estimatedMonthlySavings: number;
  difficulty: 'Easy (Config)' | 'Medium (Refactor)' | 'Advanced (Architectural)';
}

export interface CostEstimateResult {
  provider: CloudProvider;
  region: string;
  currency: string;
  monthlyTotal: number;
  annualTotal: number;
  lineItems: CostLineItem[];
  savingsTips: FinOpsSavingTip[];
  summary: string;
}

// Standard Baseline Cloud Pricing Catalogs (Normalized across AWS / GCP / Azure)
const BASELINE_CATALOG: Record<CloudProvider, Record<string, { service: string; tier: string; cost: number; category: CostLineItem['category'] }>> = {
  aws: {
    perimeter: { service: 'AWS WAF v2 + CloudFront', tier: 'Global Edge + Core Rules', cost: 28.00, category: 'Security & Observability' },
    gateway: { service: 'Application Load Balancer (ALB)', tier: 'Standard (1 ALB + 15 LCU)', cost: 24.50, category: 'Networking' },
    client: { service: 'CloudFront CDN Hosting / S3 Website', tier: 'Edge Distribution (100GB Out)', cost: 8.50, category: 'Networking' },
    service: { service: 'AWS ECS Fargate / EKS', tier: '2 vCPU, 4GB RAM (2 Tasks)', cost: 58.40, category: 'Compute' },
    database: { service: 'Amazon RDS PostgreSQL (Multi-AZ)', tier: 'db.r6g.large (2 vCPU, 16GB, 100GB gp3)', cost: 182.50, category: 'Database' },
    cache: { service: 'Amazon ElastiCache Redis', tier: 'cache.t4g.medium (2 Nodes Multi-AZ)', cost: 48.20, category: 'Caching & Queues' },
    queue: { service: 'Amazon SQS + SNS', tier: 'Standard + FIFO (10M requests/mo)', cost: 4.80, category: 'Caching & Queues' },
    dlq: { service: 'Amazon SQS Dead-Letter Queue', tier: 'Standard SQS Storage', cost: 1.20, category: 'Caching & Queues' },
    object_storage: { service: 'Amazon S3 Standard', tier: '500 GB Storage + Lifecycle', cost: 11.50, category: 'Storage' },
    auth: { service: 'AWS Cognito User Pools', tier: 'Up to 25,000 MAU', cost: 15.00, category: 'Security & Observability' },
    telemetry: { service: 'Amazon CloudWatch + X-Ray', tier: 'Logs Ingestion + Metrics Alarms', cost: 18.00, category: 'Security & Observability' },
    secret_vault: { service: 'AWS Secrets Manager + KMS', tier: '10 Secrets + Customer Managed Key', cost: 5.00, category: 'Security & Observability' },
    vpc_endpoint: { service: 'AWS PrivateLink VPC Endpoints', tier: '2 Interface Endpoints (S3/ECR)', cost: 14.40, category: 'Networking' },
    connection_pool: { service: 'Amazon RDS Proxy', tier: 'Managed Database Connection Multiplexer', cost: 21.60, category: 'Database' },
    circuit_breaker: { service: 'AWS App Mesh / Envoy Proxy', tier: 'Service Mesh Control Plane', cost: 12.00, category: 'Compute' },
  },
  gcp: {
    perimeter: { service: 'Google Cloud Armor + Cloud CDN', tier: 'Edge Security Policy', cost: 24.00, category: 'Security & Observability' },
    gateway: { service: 'Google Cloud Load Balancing', tier: 'Global External HTTPS LB', cost: 22.00, category: 'Networking' },
    client: { service: 'Firebase / Cloud Storage Static', tier: 'CDN Edge Delivery', cost: 7.50, category: 'Networking' },
    service: { service: 'Google Cloud Run / GKE Autopilot', tier: '2 vCPU, 4GB RAM (Scale-to-Zero)', cost: 46.20, category: 'Compute' },
    database: { service: 'Google Cloud SQL PostgreSQL (HA)', tier: 'db-custom-2-15360 (High Availability)', cost: 168.00, category: 'Database' },
    cache: { service: 'Google Cloud Memorystore Redis', tier: 'Standard Tier (5 GB High Availability)', cost: 44.00, category: 'Caching & Queues' },
    queue: { service: 'Google Cloud Pub/Sub', tier: 'Standard Message Ingestion (50GB)', cost: 5.00, category: 'Caching & Queues' },
    dlq: { service: 'Google Cloud Pub/Sub Dead-Letter Topic', tier: 'Storage & Retries', cost: 1.00, category: 'Caching & Queues' },
    object_storage: { service: 'Google Cloud Storage', tier: 'Standard Storage (500 GB)', cost: 10.00, category: 'Storage' },
    auth: { service: 'Google Identity Platform', tier: 'OAuth2 / OIDC Auth', cost: 12.00, category: 'Security & Observability' },
    telemetry: { service: 'Google Cloud Operations (Stackdriver)', tier: 'Logs & Metrics Ingestion', cost: 16.00, category: 'Security & Observability' },
    secret_vault: { service: 'Google Secret Manager', tier: '10 Secrets + KMS Encryption', cost: 4.50, category: 'Security & Observability' },
    vpc_endpoint: { service: 'Private Service Connect', tier: 'Internal Google APIs Endpoint', cost: 12.00, category: 'Networking' },
    connection_pool: { service: 'Cloud SQL Auth Proxy / PgBouncer', tier: 'Connection Pooling Container', cost: 14.00, category: 'Database' },
    circuit_breaker: { service: 'Traffic Director / Istio Mesh', tier: 'Managed Envoy Control Plane', cost: 10.00, category: 'Compute' },
  },
  azure: {
    perimeter: { service: 'Azure Front Door + WAF', tier: 'Standard Profile + Managed Rules', cost: 35.00, category: 'Security & Observability' },
    gateway: { service: 'Azure Application Gateway', tier: 'Standard v2 (1 Instance)', cost: 26.50, category: 'Networking' },
    client: { service: 'Azure Static Web Apps', tier: 'Standard Plan', cost: 9.00, category: 'Networking' },
    service: { service: 'Azure Container Apps / AKS', tier: '2 vCPU, 4GB RAM Dedicated', cost: 54.00, category: 'Compute' },
    database: { service: 'Azure Database for PostgreSQL Flexible', tier: 'General Purpose (D2s_v5, Zone-Redundant)', cost: 174.00, category: 'Database' },
    cache: { service: 'Azure Cache for Redis', tier: 'Standard C1 (1 GB High Availability)', cost: 49.50, category: 'Caching & Queues' },
    queue: { service: 'Azure Service Bus', tier: 'Standard Messaging Tier', cost: 10.00, category: 'Caching & Queues' },
    dlq: { service: 'Azure Service Bus Dead-Letter Queue', tier: 'Included in Service Bus', cost: 0.50, category: 'Caching & Queues' },
    object_storage: { service: 'Azure Blob Storage', tier: 'Hot Tier LRS (500 GB)', cost: 10.50, category: 'Storage' },
    auth: { service: 'Microsoft Entra External ID', tier: 'Up to 25k MAU', cost: 16.00, category: 'Security & Observability' },
    telemetry: { service: 'Azure Monitor & Application Insights', tier: '5GB Daily Data Ingestion', cost: 19.00, category: 'Security & Observability' },
    secret_vault: { service: 'Azure Key Vault', tier: 'Standard HSM Key Vault', cost: 4.00, category: 'Security & Observability' },
    vpc_endpoint: { service: 'Azure Private Endpoint', tier: 'PrivateLink Service Attachment', cost: 11.00, category: 'Networking' },
    connection_pool: { service: 'PgBouncer / Azure Flex Proxy', tier: 'Multiplexing Buffer', cost: 15.00, category: 'Database' },
    circuit_breaker: { service: 'Azure Open Service Mesh', tier: 'Managed Envoy Sidecars', cost: 12.00, category: 'Compute' },
  },
};

const REGIONAL_MULTIPLIERS: Record<string, number> = {
  'us-east-1': 1.0, // Baseline US East
  'us-west-2': 1.02,
  'eu-west-1': 1.08,
  'ap-south-1': 0.92, // Mumbai discount
  'ap-southeast-1': 1.05,
};

export async function estimateDiagramCost(
  xml: string,
  provider: CloudProvider = 'aws',
  region: string = 'us-east-1',
  apiKey?: string
): Promise<CostEstimateResult> {
  const DEFAULT_KEY = '';
  const envKey =
    (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } })?.env
      ?.VITE_GEMINI_API_KEY || '';
  const keyToUse = apiKey || localStorage.getItem('GEMINI_API_KEY') || envKey || DEFAULT_KEY;

  const topology = extractTopologyFromXml(xml);

  // If Gemini API is accessible, request enhanced live FinOps breakdown
  const candidateModels = [
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
  ];

  const COST_PROMPT = `You are a Principal Cloud FinOps Specialist and Certified Solutions Architect for ${provider.toUpperCase()}.
Analyze this software architecture topology (${topology.nodes.length} nodes, ${topology.edges.length} connections).
Estimate the realistic monthly cloud cost breakdown in ${region} using official ${provider.toUpperCase()} public retail pricing.

Component Nodes:
${topology.nodes.map((n) => `- [${n.label}] (Type: ${n.type})`).join('\n')}

Connections:
${topology.edges.map((e) => `- ${e.source} -> ${e.target} (${e.label || 'standard'})`).join('\n')}

Provide realistic component-level sizing, monthly cost in USD, and 3 actionable FinOps cost-optimization recommendations.
Return strictly a valid JSON object matching:
{
  "provider": "${provider}",
  "region": "${region}",
  "currency": "USD",
  "monthlyTotal": 482.50,
  "annualTotal": 5790.00,
  "summary": "Concise summary of architecture expenditure drivers.",
  "lineItems": [
    {
      "id": "item_1",
      "componentName": "Primary PostgreSQL",
      "cloudService": "Amazon RDS PostgreSQL (Multi-AZ)",
      "instanceTypeOrTier": "db.r6g.large (2 vCPU, 16GB)",
      "monthlyCost": 182.50,
      "category": "Database",
      "notes": "Includes Multi-AZ synchronous standby"
    }
  ],
  "savingsTips": [
    {
      "id": "tip_1",
      "title": "Adopt Aurora Serverless v2 for Non-Peak Autoscaling",
      "description": "Switching provisioned RDS to Aurora Serverless v2 enables scaling down to 0.5 ACU during idle off-hours.",
      "estimatedMonthlySavings": 65.00,
      "difficulty": "Medium (Refactor)"
    }
  ]
}
Do NOT include markdown backticks or conversational text.`;

  for (const model of candidateModels) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
          keyToUse.trim()
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: COST_PROMPT }],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) continue;
      const data = await response.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) continue;

      const parsed = JSON.parse(raw) as CostEstimateResult;
      if (parsed.monthlyTotal && parsed.lineItems?.length > 0) {
        return parsed;
      }
    } catch {
      // Fallback to deterministic catalog
    }
  }

  // Deterministic Catalog Estimator Fallback
  return calculateDeterministicCost(topology.nodes, provider, region);
}

function calculateDeterministicCost(
  nodes: ParsedTopologyNode[],
  provider: CloudProvider,
  region: string
): CostEstimateResult {
  const multiplier = REGIONAL_MULTIPLIERS[region] || 1.0;
  const catalog = BASELINE_CATALOG[provider];
  const lineItems: CostLineItem[] = [];

  const countedTypes = new Map<string, number>();

  nodes.forEach((n, idx) => {
    const typeKey = n.type in catalog ? n.type : 'service';
    const entry = catalog[typeKey] || catalog.service;
    const count = (countedTypes.get(typeKey) || 0) + 1;
    countedTypes.set(typeKey, count);

    // Apply incremental discount for multiple similar nodes (e.g. read replicas or clustered services)
    const discountFactor = count > 1 ? 0.85 : 1.0;
    const cost = Math.round(entry.cost * multiplier * discountFactor * 100) / 100;

    lineItems.push({
      id: `cost_${idx}_${n.id}`,
      componentName: n.label,
      cloudService: entry.service,
      instanceTypeOrTier: entry.tier,
      monthlyCost: cost,
      category: entry.category,
      notes: count > 1 ? `Cluster member #${count} (15% bulk reserved discount)` : 'Primary provisioned baseline',
    });
  });

  const monthlyTotal = Math.round(lineItems.reduce((acc, item) => acc + item.monthlyCost, 0) * 100) / 100;
  const annualTotal = Math.round(monthlyTotal * 12 * 100) / 100;

  const savingsTips: FinOpsSavingTip[] = [];

  // Generate intelligent FinOps recommendations based on component composition
  if (nodes.some((n) => n.type === 'database')) {
    savingsTips.push({
      id: 'tip_db_serverless',
      title: 'Transition Stateful Database to Serverless Auto-Pause',
      description: 'Switching provisioned 24/7 DB instances to Aurora Serverless v2 or Cloud SQL Serverless auto-scales down compute during nighttime and weekends.',
      estimatedMonthlySavings: Math.round(monthlyTotal * 0.22),
      difficulty: 'Medium (Refactor)',
    });
  }

  if (nodes.some((n) => n.type === 'service')) {
    savingsTips.push({
      id: 'tip_compute_savings_plan',
      title: 'Commit to 1-Year Compute Savings Plans (38% Discount)',
      description: 'Applying 1-year No-Upfront Compute Savings Plans on steady-state containers or VMs reduces hourly compute rates by up to 38%.',
      estimatedMonthlySavings: Math.round(monthlyTotal * 0.18),
      difficulty: 'Easy (Config)',
    });
  }

  if (nodes.some((n) => n.type === 'cache')) {
    savingsTips.push({
      id: 'tip_cache_offload',
      title: 'Increase Cache TTL to Lower Database IOPS & CPU Sizing',
      description: 'Extending Redis key TTL by 15 minutes offloads 35% of repetitive read queries, permitting down-sizing the primary database tier.',
      estimatedMonthlySavings: Math.round(monthlyTotal * 0.12),
      difficulty: 'Easy (Config)',
    });
  }

  return {
    provider,
    region,
    currency: 'USD',
    monthlyTotal,
    annualTotal,
    lineItems,
    savingsTips,
    summary: `Estimated ${provider.toUpperCase()} architecture run-rate in ${region}: $${monthlyTotal.toFixed(2)}/mo ($${annualTotal.toFixed(2)}/yr) across ${lineItems.length} cloud resources. Potential FinOps savings of up to $${savingsTips.reduce((a, b) => a + b.estimatedMonthlySavings, 0)}/mo identified.`,
  };
}

