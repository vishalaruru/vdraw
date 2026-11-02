import { extractTopologyFromXml, ParsedTopologyNode } from './architectureAuditor';

export type StrideCategory =
  | 'Spoofing'
  | 'Tampering'
  | 'Repudiation'
  | 'Information Disclosure'
  | 'Denial of Service'
  | 'Elevation of Privilege';

export interface StrideThreat {
  id: string;
  category: StrideCategory;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  title: string;
  threatDescription: string;
  threatActor: 'External Adversary' | 'Compromised Internal Service' | 'Malicious Insider';
  affectedComponents: string[];
  mitigation: string;
}

export interface ThreatModelReport {
  overallRisk: 'Critical' | 'High' | 'Medium' | 'Low';
  totalThreats: number;
  criticalCount: number;
  threats: StrideThreat[];
  summary: string;
}

const THREAT_MODEL_PROMPT = `You are an expert Application Security & Threat Modeling Architect (CISSP, CISM).
Analyze the following architecture diagram topology according to the Microsoft STRIDE Threat Modeling framework:
- Spoofing (Identity verification gaps, forged tokens)
- Tampering (In-transit data modification, unencrypted links)
- Repudiation (Lack of non-repudiation logging or tamper-proof audit trails)
- Information Disclosure (Public database exposure, unencrypted storage)
- Denial of Service (Resource starvation, single point of failure, missing rate limits)
- Elevation of Privilege (Excessive IAM scope, missing zero-trust boundary)

Return strictly valid JSON matching this schema:
{
  "overallRisk": "High",
  "summary": "Executive summary of the attack surface and primary threat vectors.",
  "threats": [
    {
      "id": "t_1",
      "category": "Spoofing|Tampering|Repudiation|Information Disclosure|Denial of Service|Elevation of Privilege",
      "severity": "Critical|High|Medium|Low",
      "title": "Threat Title",
      "threatDescription": "Detailed scenario of how an adversary exploits this architectural gap.",
      "threatActor": "External Adversary|Compromised Internal Service|Malicious Insider",
      "affectedComponents": ["Web Client", "API Gateway"],
      "mitigation": "Concrete technical mitigation control (e.g. AWS WAF, mTLS, OIDC)."
    }
  ]
}
Do NOT include markdown backticks or conversational text.`;

export async function generateThreatModel(
  xml: string,
  apiKey?: string
): Promise<ThreatModelReport> {
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
                  { text: THREAT_MODEL_PROMPT },
                  {
                    text: `Topology: ${topology.nodes.length} nodes, ${topology.edges.length} connections.\nNodes:\n${topology.nodes
                      .map((n) => `- [${n.label}] (${n.type})`)
                      .join('\n')}\nConnections:\n${topology.edges
                      .map((e) => `- ${e.source} -> ${e.target} (${e.label || ''})`)
                      .join('\n')}\n\nXML Diagram excerpt:\n${xml.slice(0, 15000)}`,
                  },
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

      if (!response.ok) continue;
      const data = await response.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      const threats: StrideThreat[] = parsed.threats || [];
      const criticalCount = threats.filter((t) => t.severity === 'Critical').length;

      return {
        overallRisk: parsed.overallRisk || (criticalCount > 0 ? 'High' : 'Medium'),
        totalThreats: threats.length,
        criticalCount,
        threats,
        summary: parsed.summary || 'STRIDE Threat Assessment completed.',
      };
    } catch {
      // Try next model
    }
  }

  // Deterministic Local Threat Model Fallback
  return evaluateDeterministicThreats(topology.nodes);
}

function evaluateDeterministicThreats(nodes: ParsedTopologyNode[]): ThreatModelReport {
  const threats: StrideThreat[] = [];

  const types = new Set(nodes.map((n) => n.type));
  const hasWaf = types.has('perimeter');
  const hasAuth = types.has('auth');
  const hasDb = types.has('database');
  const hasVault = types.has('secret_vault');
  const hasTelemetry = types.has('telemetry');

  // Denial of Service (No WAF)
  if (!hasWaf) {
    threats.push({
      id: 'stride_dos_1',
      category: 'Denial of Service',
      severity: 'Critical',
      title: 'Volumetric Ingress Denial of Service (L7 HTTP Flood)',
      threatDescription: 'Adversaries launch HTTP/2 rapid-reset or flood requests against public ingress points, consuming container CPU and knocking down the API.',
      threatActor: 'External Adversary',
      affectedComponents: nodes.filter((n) => n.type === 'client' || n.type === 'gateway').map((n) => n.label),
      mitigation: 'Deploy AWS WAF v2 with rate-based limiting (max 2,000 req/5min) and AWS Shield Standard anti-DDoS protection.',
    });
  }

  // Spoofing (No IdP)
  if (!hasAuth) {
    threats.push({
      id: 'stride_spoof_1',
      category: 'Spoofing',
      severity: 'High',
      title: 'User Identity & Token Spoofing',
      threatDescription: 'Without a centralized OIDC identity provider, services risk accepting forged tokens or unvalidated headers from external clients.',
      threatActor: 'External Adversary',
      affectedComponents: nodes.filter((n) => n.type === 'service').map((n) => n.label),
      mitigation: 'Implement AWS Cognito or Auth0 issuing RS256 cryptographically signed JWTs validated at the perimeter API Gateway.',
    });
  }

  // Tampering (Unencrypted storage / DB)
  if (hasDb && !hasVault) {
    threats.push({
      id: 'stride_tamp_1',
      category: 'Tampering',
      severity: 'High',
      title: 'Unauthorized Database State Alteration via Stored Secrets Leak',
      threatDescription: 'Database connection strings stored in static files or environment variables can be compromised, allowing attackers to overwrite production records.',
      threatActor: 'Malicious Insider',
      affectedComponents: nodes.filter((n) => n.type === 'database').map((n) => n.label),
      mitigation: 'Store database credentials in AWS Secrets Manager with KMS Customer Managed Keys and enable IAM DB Authentication.',
    });
  }

  // Information Disclosure (Direct DB or unencrypted storage)
  if (hasDb) {
    threats.push({
      id: 'stride_info_1',
      category: 'Information Disclosure',
      severity: 'Medium',
      title: 'Data Exfiltration via Insecure Egress Pathways',
      threatDescription: 'Relational database snapshot or replica traffic traversing public internet can be intercepted if TLS 1.3 is not enforced.',
      threatActor: 'External Adversary',
      affectedComponents: nodes.filter((n) => n.type === 'database').map((n) => n.label),
      mitigation: 'Enforce sslmode=verify-full on all client connections and enable AWS KMS AES-256 storage volume encryption.',
    });
  }

  // Repudiation (No telemetry / audit logs)
  if (!hasTelemetry) {
    threats.push({
      id: 'stride_rep_1',
      category: 'Repudiation',
      severity: 'Medium',
      title: 'Untraceable Security Incidents (Absence of Immutable Audit Trail)',
      threatDescription: 'Malicious actions, privilege escalations, or data deletes cannot be definitively attributed to specific principals without tamper-proof audit trails.',
      threatActor: 'Compromised Internal Service',
      affectedComponents: ['All Services'],
      mitigation: 'Enable AWS CloudTrail with Log File Validation enabled and forward access logs to an encrypted Amazon S3 log archive.',
    });
  }

  const criticalCount = threats.filter((t) => t.severity === 'Critical').length;
  const overallRisk = criticalCount > 0 ? 'Critical' : threats.some((t) => t.severity === 'High') ? 'High' : 'Medium';

  return {
    overallRisk,
    totalThreats: threats.length,
    criticalCount,
    threats,
    summary: `Identified ${threats.length} potential attack vectors across the STRIDE model (${criticalCount} Critical, ${threats.filter((t) => t.severity === 'High').length} High). Overall attack surface risk is rated ${overallRisk}.`,
  };
}

