import { ExtractedDiagram, DiagramNode, DiagramEdge, ThemePreset } from '../types/diagram';
import { synthesizeDrawioXml } from './diagramSynthesizer';

const REVERSE_IAC_INSTRUCTIONS = `You are a Principal DevOps and Infrastructure Architect.
Convert the following Infrastructure as Code (Terraform HCL, Docker Compose YAML, or Kubernetes YAML) into a clean, modern architecture diagram layout.

Extract all infrastructure components, services, networks, databases, queues, and ingress routes.
Infer communication edges based on dependencies (e.g. 'depends_on', environment variables pointing to other services, DB connections, or VPC attachments).

Return strictly a valid JSON object matching this schema:
{
  "title": "Imported Architecture",
  "nodes": [
    {
      "id": "node_1",
      "label": "Web Client / Nginx",
      "shape": "rectangle|rounded|cylinder|rhombus|cloud|actor",
      "x": 100,
      "y": 100,
      "width": 160,
      "height": 65,
      "fillColor": "#EEF2FF",
      "strokeColor": "#6366F1"
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "node_1",
      "target": "node_2",
      "label": "HTTP / gRPC",
      "style": "orthogonal"
    }
  ]
}
Do NOT wrap in markdown backticks or include conversational text.`;

export async function parseIacToDiagramXml(
  content: string,
  iacType: 'terraform' | 'docker-compose' | 'k8s',
  theme: ThemePreset = 'modern-indigo',
  apiKey?: string
): Promise<{ diagram: ExtractedDiagram; xml: string }> {
  const envKey =
    (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } })?.env
      ?.VITE_GEMINI_API_KEY || '';
  const storedKey = (typeof localStorage !== "undefined" ? localStorage.getItem("GEMINI_API_KEY") : "") || "";
  const cleanStored = storedKey.includes("AIzaSyBCdBG4Cu") ? "" : storedKey;
  const cleanPassed = (apiKey && !apiKey.includes("AIzaSyBCdBG4Cu")) ? apiKey : "";
  const keyToUse = cleanPassed || envKey || cleanStored;

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
                  { text: REVERSE_IAC_INSTRUCTIONS },
                  { text: `IaC Type: ${iacType.toUpperCase()}\n\nContent:\n${content.slice(0, 15000)}` },
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

      const diagram = JSON.parse(raw) as ExtractedDiagram;
      const xml = synthesizeDrawioXml(diagram, theme);
      return { diagram, xml };
    } catch {
      // Try next model
    }
  }

  // Deterministic Local Fallback Parser if AI is offline
  const diagram = parseIacDeterministically(content, iacType);
  const xml = synthesizeDrawioXml(diagram, theme);
  return { diagram, xml };
}

function parseIacDeterministically(
  content: string,
  iacType: 'terraform' | 'docker-compose' | 'k8s'
): ExtractedDiagram {
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  if (iacType === 'docker-compose') {
    // Parse service blocks: "  web:\n    image: ..."
    const serviceRegex = /^\s{2}([a-zA-Z0-9_-]+):\s*$/gm;
    let match;
    let x = 100;
    let y = 100;
    while ((match = serviceRegex.exec(content)) !== null) {
      const name = match[1];
      const isDb = name.includes('db') || name.includes('postgres') || name.includes('mysql') || name.includes('mongo') || name.includes('redis');
      nodes.push({
        id: `svc_${name}`,
        label: name.toUpperCase(),
        shape: isDb ? 'cylinder' : 'rounded',
        x,
        y,
        width: 150,
        height: 60,
      });
      x += 180;
      if (x > 800) {
        x = 100;
        y += 120;
      }
    }

    // Connect sequentially if multiple
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        id: `e_${i}`,
        source: nodes[i].id,
        target: nodes[i + 1].id,
        style: 'orthogonal',
      });
    }
  } else {
    // Terraform or K8s regex
    const tfRegex = /resource\s+"([^"]+)"\s+"([^"]+)"/g;
    let match;
    let x = 100;
    let y = 100;
    while ((match = tfRegex.exec(content)) !== null) {
      const resType = match[1];
      const resName = match[2];
      const isDb = resType.includes('db') || resType.includes('rds') || resType.includes('aurora');
      nodes.push({
        id: `tf_${resName}`,
        label: `${resType.replace(/aws_/g, '')}\n(${resName})`,
        shape: isDb ? 'cylinder' : 'rounded',
        x,
        y,
        width: 160,
        height: 65,
      });
      x += 190;
      if (x > 800) {
        x = 100;
        y += 120;
      }
    }
  }

  if (nodes.length === 0) {
    nodes.push({
      id: 'n_default',
      label: 'Imported Cloud Component',
      shape: 'rounded',
      x: 200,
      y: 200,
      width: 160,
      height: 60,
    });
  }

  return {
    title: 'Imported IaC Diagram',
    nodes,
    edges,
  };
}
