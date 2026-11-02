export interface PillarScores {
  security: number;
  reliability: number;
  solidPrinciples: number;
  performance: number;
  operations: number;
}

export interface SecurityFinding {
  id: string;
  ruleId: string;
  severity: 'critical' | 'warning' | 'info' | 'good';
  category:
    | 'Security & Zero-Trust'
    | 'SOLID Principles'
    | 'Reliability (SPOF)'
    | 'Well-Architected'
    | 'Performance & Scale';
  pillar: 'Security' | 'Reliability' | 'SOLID' | 'Performance' | 'Operations';
  title: string;
  description: string;
  recommendation: string;
  affectedComponents: string[];
  nominalGap?: string;
}

export interface ArchitectureAuditResult {
  overallScore: number; // 0 to 100
  nominalStatus:
    | 'Nominal Enterprise Standard'
    | 'Sub-Nominal (Moderate Gaps)'
    | 'Critical Architectural Deficiencies';
  summary: string;
  pillarScores: PillarScores;
  findings: SecurityFinding[];
}

export interface ParsedTopologyNode {
  id: string;
  label: string;
  type: string;
  isContainer?: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface ParsedTopologyEdge {
  source: string;
  target: string;
  label: string;
}

export interface ParsedTopology {
  nodes: ParsedTopologyNode[];
  edges: ParsedTopologyEdge[];
}

import { parseDrawioXmlToDiagram } from './diagramXmlParser';

export function extractTopologyFromXml(xml: string): ParsedTopology {
  const parsed = parseDrawioXmlToDiagram(xml);
  return {
    nodes: parsed.nodes.map((n) => {
      const isContainer =
        n.shape === 'container' ||
        (n.width >= 350 && n.height >= 180) ||
        /central|backend|routing|app|vpc|zone|container|cluster/i.test(n.label);
      return {
        id: n.id,
        label: n.label,
        type: isContainer ? 'container' : classifyNodeType(n.label),
        isContainer,
        x: n.x,
        y: n.y,
        width: n.width,
        height: n.height,
      };
    }),
    edges: parsed.edges.map((e) => ({
      source: e.source,
      target: e.target,
      label: e.label || '',
    })),
  };
}

function classifyNodeType(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('waf') || l.includes('cloudflare') || l.includes('shield') || l.includes('firewall')) return 'perimeter';
  if (l.includes('gateway') || l.includes('alb') || l.includes('nlb') || l.includes('load balancer') || l.includes('kong')) return 'gateway';
  if (l.includes('client') || l.includes('user') || l.includes('browser') || l.includes('mobile') || l.includes('web app') || l.includes('frontend')) return 'client';
  if (l.includes('db') || l.includes('database') || l.includes('postgres') || l.includes('mysql') || l.includes('mongo') || l.includes('rds') || l.includes('aurora') || l.includes('dynamo')) return 'database';
  if (l.includes('dlq') || l.includes('dead letter') || l.includes('dead-letter') || l.includes('poison')) return 'dlq';
  if (l.includes('queue') || l.includes('kafka') || l.includes('sqs') || l.includes('rabbit') || l.includes('eventbridge') || l.includes('pubsub')) return 'queue';
  if (l.includes('cache') || l.includes('redis') || l.includes('memcached')) return 'cache';
  if (l.includes('proxy') || l.includes('pgbouncer') || l.includes('connection pool') || l.includes('rds proxy')) return 'connection_pool';
  if (l.includes('circuit breaker') || l.includes('breaker') || l.includes('resilience') || l.includes('mesh') || l.includes('istio') || l.includes('envoy')) return 'circuit_breaker';
  if (l.includes('kms') || l.includes('secrets') || l.includes('vault') || l.includes('parameter store') || l.includes('key vault')) return 'secret_vault';
  if (l.includes('privatelink') || l.includes('vpc endpoint') || l.includes('private link') || l.includes('private subnet')) return 'vpc_endpoint';
  if (l.includes('s3') || l.includes('bucket') || l.includes('blob') || l.includes('storage')) return 'object_storage';
  if (l.includes('auth') || l.includes('cognito') || l.includes('keycloak') || l.includes('iam') || l.includes('okta')) return 'auth';
  if (l.includes('monitor') || l.includes('cloudwatch') || l.includes('grafana') || l.includes('datadog') || l.includes('prometheus') || l.includes('opentelemetry')) return 'telemetry';
  return 'service';
}

const AUDIT_SYSTEM_INSTRUCTIONS = `You are a Principal Enterprise Cloud Security Architect and Senior Systems Reliability Assessor.
You audit software architecture diagrams against strict, objective, and mathematically grounded industry standards:
1. Zero-Trust Cloud Security Architecture (NIST 800-207, AWS Security Pillar, CIS Benchmarks).
2. SOLID Principles applied to distributed systems architecture (SRP, OCP, LSP, ISP, DIP).
3. Cloud Well-Architected Framework (Reliability, Security, Performance Efficiency, Operational Excellence, Cost Optimization).

CRITICAL EVALUATION GUIDELINES:
- BE STRICT AND SPECIFIC: Name the EXACT component labels and connections from the diagram. Vague or generic advice is unacceptable.
- NOMINAL BASELINE: A nominal production-grade system scores 100 ONLY if it satisfies all security boundaries, resilience redundancy, SOLID decoupling, and telemetry observability.

MANDATORY ENTERPRISE AUDIT RULES:
1. [SEC-WAF-01] Perimeter Ingress: Direct client/browser ingress without WAF / DDoS rate-limiting: -15 to -20 pts (Critical).
2. [SEC-DB-01] Direct DB Exposure: Direct communication from client/public network to database: -20 pts (Critical).
3. [SEC-IAM-01] Identity & Access Management: Missing centralized IdP (OAuth2/OIDC/Cognito/Auth0) and token validation: -10 pts (Warning).
4. [SEC-KMS-01] Secrets & Key Management: Missing centralized Secrets Manager (Vault, AWS Secrets Manager) and KMS encryption at rest: -8 to -10 pts (Warning).
5. [SEC-NET-01] Network Segmentation: Services connecting across networks or to storage (S3) without VPC Endpoints/PrivateLink: -8 to -10 pts (Warning).
6. [REL-SPOF-01] Single Point of Failure (SPOF): Stateful databases without Multi-AZ standby, read replicas, or automated failover: -12 to -15 pts (Critical/Warning).
7. [REL-DLQ-01] Dead-Letter Queue (DLQ): Asynchronous queues (SQS, Kafka, RabbitMQ) without a DLQ for poison pill isolation: -8 to -10 pts (Warning).
8. [REL-CB-01] Circuit Breakers & Cascading Failure: Synchronous microservice RPC chains without circuit breakers or bulkhead isolation: -8 to -10 pts (Warning).
9. [PERF-POOL-01] Database Connection Pooling: Autoscaling microservices directly connecting to DB without RDS Proxy / PgBouncer: -8 to -10 pts (Warning).
10. [PERF-CACHE-01] In-Memory Caching: High-traffic database queries unbuffered by in-memory cache (Redis/Memcached): -8 pts (Warning).
11. [SOLID-DIP-01] Dependency Inversion: Direct synchronous coupling between high-level services and slow/heavy downstreams without asynchronous message brokers: -10 pts (Warning).
12. [SOLID-SRP-01] Single Responsibility: Monolithic god-service managing multiple disparate bounded domains: -8 pts (Warning).
13. [SOLID-OCP-01] Open/Closed Principle: Inability to extend system with new consumers without modifying publisher (lack of pub/sub event bus): -6 pts (Warning).
14. [OPS-OBS-01] Operational Telemetry: Complete absence of centralized observability, logging, or tracing telemetry: -8 pts (Warning/Info).

OUTPUT FORMAT:
Return strictly a valid JSON object matching this schema with NO markdown code fences or conversational text:
{
  "overallScore": 62,
  "nominalStatus": "Sub-Nominal (Moderate Gaps)",
  "summary": "Specific 2-3 sentence executive assessment stating exact compliance gaps and strengths.",
  "pillarScores": {
    "security": 60,
    "reliability": 55,
    "solidPrinciples": 70,
    "performance": 65,
    "operations": 50
  },
  "findings": [
    {
      "id": "f_1",
      "ruleId": "SEC-WAF-01",
      "severity": "critical",
      "category": "Security & Zero-Trust",
      "pillar": "Security",
      "title": "Direct Uninspected Ingress from Client to Service",
      "description": "Component '[Client]' directly invokes '[API Service]' without a Web Application Firewall (WAF) or DDoS rate limiter.",
      "recommendation": "Deploy AWS WAF v2 or Cloudflare in front of the application ingress with OWASP Top 10 rules and token validation.",
      "affectedComponents": ["Client", "API Service"],
      "nominalGap": "Nominal standard requires Layer 7 application inspection, TLS 1.3 termination, and geographic/rate-based ingress filtering."
    }
  ]
}
nominalStatus must be one of:
- "Nominal Enterprise Standard" (score >= 85)
- "Sub-Nominal (Moderate Gaps)" (score 65 to 84)
- "Critical Architectural Deficiencies" (score < 65)`;

export async function auditArchitectureDiagram(
  xml: string,
  apiKey?: string
): Promise<ArchitectureAuditResult> {
  const envKey =
    (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } })?.env
      ?.VITE_GEMINI_API_KEY || '';
  const storedKey = (typeof localStorage !== "undefined" ? localStorage.getItem("GEMINI_API_KEY") : "") || "";
  const cleanStored = storedKey.includes("AIzaSyBCdBG4Cu") ? "" : storedKey;
  const cleanPassed = (apiKey && !apiKey.includes("AIzaSyBCdBG4Cu")) ? apiKey : "";
  const keyToUse = cleanPassed || envKey || cleanStored;

  const topology = extractTopologyFromXml(xml);

  const candidateModels = [
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
  ];

  let lastError = '';

  const topologySummary = `
Component Topology Inventory (${topology.nodes.length} nodes, ${topology.edges.length} connections):
Nodes:
${topology.nodes.map((n) => `- [${n.label}] (Type: ${n.type}, ID: ${n.id})`).join('\n')}

Edges / Connections:
${topology.edges
  .map((e) => {
    const src = topology.nodes.find((n) => n.id === e.source)?.label || e.source;
    const tgt = topology.nodes.find((n) => n.id === e.target)?.label || e.target;
    return `- [${src}] ---> [${tgt}] ${e.label ? `(Protocol/Label: "${e.label}")` : ''}`;
  })
  .join('\n')}
`;

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
                parts: [
                  { text: AUDIT_SYSTEM_INSTRUCTIONS },
                  { text: topologySummary },
                  { text: `Raw Diagram XML (first 16000 chars):\n${xml.slice(0, 16000)}` },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) {
        lastError = `HTTP ${response.status} from ${model}`;
        continue;
      }

      const data = await response.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) continue;

      const parsed = JSON.parse(raw) as ArchitectureAuditResult;

      // Validate & calibrate score to nominal status
      if (!parsed.nominalStatus) {
        if (parsed.overallScore >= 85) parsed.nominalStatus = 'Nominal Enterprise Standard';
        else if (parsed.overallScore >= 65) parsed.nominalStatus = 'Sub-Nominal (Moderate Gaps)';
        else parsed.nominalStatus = 'Critical Architectural Deficiencies';
      }

      return parsed;
    } catch (err) {
      lastError = String(err);
    }
  }

  // Deterministic Local Fallback if AI is unavailable or offline
  if (lastError) {
    console.warn('AI audit fallback to deterministic engine:', lastError);
  }
  return runDeterministicLocalAudit(topology);
}

function runDeterministicLocalAudit(topology: ParsedTopology): ArchitectureAuditResult {
  const findings: SecurityFinding[] = [];
  let score = 100;

  const nodeTypes = new Set(topology.nodes.map((n) => n.type));
  const hasWaf = nodeTypes.has('perimeter');
  const hasGateway = nodeTypes.has('gateway');
  const hasQueue = nodeTypes.has('queue');
  const hasDlq = nodeTypes.has('dlq');
  const hasCache = nodeTypes.has('cache');
  const hasDb = nodeTypes.has('database');
  const hasAuth = nodeTypes.has('auth');
  const hasVault = nodeTypes.has('secret_vault');
  const hasVpcEndpoint = nodeTypes.has('vpc_endpoint');
  const hasCircuitBreaker = nodeTypes.has('circuit_breaker');
  const hasConnectionPool = nodeTypes.has('connection_pool');
  const hasTelemetry = nodeTypes.has('telemetry');
  const hasObjectStorage = nodeTypes.has('object_storage');

  // Rule 1: Perimeter Ingress
  if (!hasWaf && !hasGateway) {
    score -= 18;
    findings.push({
      id: 'f_sec_waf',
      ruleId: 'SEC-WAF-01',
      severity: 'critical',
      category: 'Security & Zero-Trust',
      pillar: 'Security',
      title: 'Missing Perimeter Defense (WAF / Gateway)',
      description: 'The architecture allows client traffic directly into internal services without perimeter inspection or rate-limiting.',
      recommendation: 'Place an AWS WAF v2 or Cloudflare perimeter with OWASP Core Rules and an API Gateway in front of internal endpoints.',
      affectedComponents: topology.nodes.filter((n) => n.type === 'client' || n.type === 'service').map((n) => n.label),
      nominalGap: 'Nominal enterprise architectures enforce strict Layer 7 perimeter inspection and DDoS mitigation.',
    });
  }

  // Rule 2: Zero-Trust Identity
  if (!hasAuth && !hasGateway) {
    score -= 10;
    findings.push({
      id: 'f_sec_iam',
      ruleId: 'SEC-IAM-01',
      severity: 'warning',
      category: 'Security & Zero-Trust',
      pillar: 'Security',
      title: 'Missing Identity & Access Management (IAM / IdP)',
      description: 'The architecture does not depict an identity provider (OAuth2, OIDC, Cognito, Auth0) for authentication and token exchange.',
      recommendation: 'Incorporate a dedicated Identity Provider (e.g. AWS Cognito, Auth0, or Keycloak) to enforce Zero-Trust token issuance.',
      affectedComponents: topology.nodes.filter((n) => n.type === 'service').map((n) => n.label),
      nominalGap: 'Nominal Zero-Trust architecture requires centralized authentication and cryptographically signed JWT validation before services execute work.',
    });
  }

  // Rule 3: Secrets & Key Management (NEW)
  if (!hasVault) {
    score -= 8;
    findings.push({
      id: 'f_sec_kms',
      ruleId: 'SEC-KMS-01',
      severity: 'warning',
      category: 'Security & Zero-Trust',
      pillar: 'Security',
      title: 'Missing Centralized Secrets Manager & KMS Vault',
      description: 'No dedicated Key Management Service (KMS) or Secrets Manager (AWS Secrets Manager, HashiCorp Vault) is depicted for credentials and encryption-at-rest keys.',
      recommendation: 'Adopt AWS Secrets Manager or HashiCorp Vault with KMS customer-managed keys (CMK) and automated 30-day credential rotation.',
      affectedComponents: topology.nodes.filter((n) => n.type === 'database' || n.type === 'service').map((n) => n.label),
      nominalGap: 'Zero-Trust NIST 800-207 mandates encrypted secrets storage at rest with audited IAM retrieval policies.',
    });
  }

  // Rule 4: Private VPC Endpoints / Network Segmentation (NEW)
  if (!hasVpcEndpoint && (hasDb || hasObjectStorage)) {
    score -= 8;
    findings.push({
      id: 'f_sec_net',
      ruleId: 'SEC-NET-01',
      severity: 'warning',
      category: 'Security & Zero-Trust',
      pillar: 'Security',
      title: 'Missing VPC PrivateLink / Subnet Isolation',
      description: 'Internal services connect to data storage or external APIs without explicit Private Subnet isolation or VPC Gateway Endpoints.',
      recommendation: 'Deploy VPC Endpoints (AWS PrivateLink) for S3 and internal APIs, ensuring network traffic never traverses the public internet.',
      affectedComponents: topology.nodes.filter((n) => n.type === 'database' || n.type === 'object_storage').map((n) => n.label),
      nominalGap: 'Nominal cloud network architecture requires private subnets for compute and isolated subnets for databases with no direct internet route.',
    });
  }

  // Rule 5: Dead-Letter Queue (DLQ) (NEW)
  if (hasQueue && !hasDlq) {
    score -= 8;
    findings.push({
      id: 'f_rel_dlq',
      ruleId: 'REL-DLQ-01',
      severity: 'warning',
      category: 'Reliability (SPOF)',
      pillar: 'Reliability',
      title: 'Missing Dead-Letter Queue (DLQ) on Async Broker',
      description: 'Asynchronous queues exist without a dedicated Dead-Letter Queue (DLQ) for poison-message isolation and unparseable payload triage.',
      recommendation: 'Configure a redrive policy with maximum 3 receive attempts routing to an SQS DLQ with CloudWatch alarm on ApproximateNumberOfMessagesVisible.',
      affectedComponents: topology.nodes.filter((n) => n.type === 'queue').map((n) => n.label),
      nominalGap: 'Nominal enterprise event architectures mandate DLQs on all asynchronous message brokers to prevent consumer worker crash loops.',
    });
  }

  // Rule 6: Circuit Breakers & Cascading Failure Protection (NEW)
  if (!hasCircuitBreaker && topology.nodes.length >= 4) {
    score -= 8;
    findings.push({
      id: 'f_rel_cb',
      ruleId: 'REL-CB-01',
      severity: 'warning',
      category: 'Reliability (SPOF)',
      pillar: 'Reliability',
      title: 'Missing Circuit Breaker & Cascading Failure Protection',
      description: 'Chained synchronous calls between microservices lack circuit breaker mechanics, exposing the system to cascading timeout failures if downstream nodes degrade.',
      recommendation: 'Implement Circuit Breakers (Resilience4j or Envoy Service Mesh) with fallback responses and 500ms timeout cutoffs.',
      affectedComponents: topology.nodes.filter((n) => n.type === 'service').map((n) => n.label),
      nominalGap: 'Well-Architected Reliability pillar requires fault isolation bulkheads and fast-failing circuit breakers on synchronous service dependencies.',
    });
  }

  // Rule 7: Database Connection Pooling (NEW)
  if (hasDb && !hasConnectionPool && topology.nodes.length >= 3) {
    score -= 8;
    findings.push({
      id: 'f_perf_pool',
      ruleId: 'PERF-POOL-01',
      severity: 'warning',
      category: 'Performance & Scale',
      pillar: 'Performance',
      title: 'Missing Database Connection Pooling (RDS Proxy / PgBouncer)',
      description: 'Autoscaling microservices open direct database connections, risking PostgreSQL connection pool exhaustion (max_connections) during load bursts.',
      recommendation: 'Deploy AWS RDS Proxy or a PgBouncer connection multiplexer in front of the database cluster.',
      affectedComponents: topology.nodes.filter((n) => n.type === 'database').map((n) => n.label),
      nominalGap: 'Nominal enterprise performance requires managed connection pooling to prevent ephemeral container scale-outs from exhausting DB socket limits.',
    });
  }

  // Rule 8: Database Caching
  if (hasDb && !hasCache) {
    score -= 10;
    findings.push({
      id: 'f_perf_cache',
      ruleId: 'PERF-CACHE-01',
      severity: 'warning',
      category: 'Performance & Scale',
      pillar: 'Performance',
      title: 'Unbuffered Database Query Pathway',
      description: 'Relational or document databases are queried directly without an in-memory cache layer, risking connection saturation during traffic spikes.',
      recommendation: 'Implement an ElastiCache Redis or Memcached cluster with a Look-Aside or Write-Through caching pattern.',
      affectedComponents: topology.nodes.filter((n) => n.type === 'database').map((n) => n.label),
      nominalGap: 'Nominal standard requires read-heavy queries to be offloaded to an in-memory cache layer (<1ms latency).',
    });
  }

  // Rule 9: SOLID DIP Decoupling
  if (!hasQueue && topology.nodes.length > 3) {
    score -= 10;
    findings.push({
      id: 'f_solid_dip',
      ruleId: 'SOLID-DIP-01',
      severity: 'warning',
      category: 'SOLID Principles',
      pillar: 'SOLID',
      title: 'Synchronous Temporal Coupling (DIP Violation)',
      description: 'Services communicate synchronously point-to-point. High-level orchestrators are tightly coupled to downstream low-level execution.',
      recommendation: 'Introduce an asynchronous message broker (SQS, Kafka, RabbitMQ) to invert dependencies and provide backpressure buffering.',
      affectedComponents: topology.nodes.filter((n) => n.type === 'service').map((n) => n.label),
      nominalGap: 'SOLID Dependency Inversion Principle requires high-level services to rely on event abstractions, not direct downstream endpoints.',
    });
  }

  // Rule 10: SPOF on Database
  if (hasDb) {
    score -= 10;
    findings.push({
      id: 'f_rel_spof',
      ruleId: 'REL-SPOF-01',
      severity: 'warning',
      category: 'Reliability (SPOF)',
      pillar: 'Reliability',
      title: 'Potential Single Point of Failure (Single-AZ Database)',
      description: 'Primary database has no explicit Multi-AZ standby, read-replica, or automated failover topology indicated.',
      recommendation: 'Configure Amazon Aurora Global Database or Multi-AZ RDS with synchronous standby replication and read replicas.',
      affectedComponents: topology.nodes.filter((n) => n.type === 'database').map((n) => n.label),
      nominalGap: 'Nominal cloud resilience mandates Multi-AZ fault tolerance with <60s automated RTO and zero data loss (RPO = 0).',
    });
  }

  // Rule 11: Observability
  if (!hasTelemetry) {
    score -= 8;
    findings.push({
      id: 'f_ops_telemetry',
      ruleId: 'OPS-OBS-01',
      severity: 'info',
      category: 'Well-Architected',
      pillar: 'Operations',
      title: 'Absence of Centralized Observability & Telemetry',
      description: 'No distributed tracing, centralized logging, or metrics aggregation (CloudWatch, OpenTelemetry, Prometheus) is depicted.',
      recommendation: 'Integrate OpenTelemetry distributed tracing and structured log collectors across all service boundaries.',
      affectedComponents: ['All Services'],
      nominalGap: 'Well-Architected Operational Excellence pillar requires end-to-end trace propagation and automated anomaly alerts.',
    });
  }

  // Good patterns
  if (hasGateway) {
    findings.push({
      id: 'f_good_gw',
      ruleId: 'SEC-GW-OK',
      severity: 'good',
      category: 'Security & Zero-Trust',
      pillar: 'Security',
      title: 'API Gateway Ingress Decoupling',
      description: 'API Gateway abstracts internal topology and provides unified authentication and routing.',
      recommendation: 'Maintain token validation and rate-limiting quotas at the gateway tier.',
      affectedComponents: topology.nodes.filter((n) => n.type === 'gateway').map((n) => n.label),
    });
  }

  if (hasDlq) {
    findings.push({
      id: 'f_good_dlq',
      ruleId: 'REL-DLQ-OK',
      severity: 'good',
      category: 'Reliability (SPOF)',
      pillar: 'Reliability',
      title: 'Dead-Letter Queue Isolation Configured',
      description: 'Poison pill message routing is established, safeguarding worker consumers against infinite crash cycles.',
      recommendation: 'Set up CloudWatch alert notifications whenever messages arrive in the DLQ.',
      affectedComponents: topology.nodes.filter((n) => n.type === 'dlq').map((n) => n.label),
    });
  }

  const finalScore = Math.max(10, Math.min(100, score));
  let nominalStatus: ArchitectureAuditResult['nominalStatus'] = 'Nominal Enterprise Standard';
  if (finalScore < 65) nominalStatus = 'Critical Architectural Deficiencies';
  else if (finalScore < 85) nominalStatus = 'Sub-Nominal (Moderate Gaps)';

  return {
    overallScore: finalScore,
    nominalStatus,
    summary: `Strict assessment against Zero-Trust, SOLID, and Well-Architected Framework: Found ${findings.length} findings across ${topology.nodes.length} components. Current architectural posture is ${nominalStatus}.`,
    pillarScores: {
      security: hasWaf && hasGateway && hasVault ? 90 : hasWaf || hasGateway ? 70 : 45,
      reliability: hasDlq && hasCircuitBreaker ? 90 : 55,
      solidPrinciples: hasQueue ? 85 : 55,
      performance: hasCache && hasConnectionPool ? 90 : hasCache ? 70 : 50,
      operations: hasTelemetry ? 90 : 50,
    },
    findings,
  };
}
