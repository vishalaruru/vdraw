import { extractTopologyFromXml } from './architectureAuditor';

export interface ArchitectureTier {
  name: string;
  components: string[];
}

export interface ArchitecturePromptResult {
  title: string;
  summary: string;
  reconstructionPrompt: string; // The exact prompt for AI models to reproduce the diagram
  systemSpecMarkdown: string;  // Detailed engineering RFC architecture spec
  mermaidSyntax: string;       // Mermaid flowchart syntax
  nodeCount: number;
  edgeCount: number;
  tiers: ArchitectureTier[];
  isAiGenerated: boolean;
}

export interface EnhancedTopologyNode {
  id: string;
  label: string;
  type: string;
  x?: number;
  y?: number;
}

export interface EnhancedTopologyEdge {
  source: string;
  target: string;
  sourceLabel: string;
  targetLabel: string;
  label: string;
}

export interface EnhancedTopology {
  nodes: EnhancedTopologyNode[];
  edges: EnhancedTopologyEdge[];
  orientation: 'left-to-right' | 'top-to-bottom';
}

/**
 * Extracts topology including spatial coordinates to determine flow orientation.
 */
export function extractEnhancedTopology(xml: string): EnhancedTopology {
  const base = extractTopologyFromXml(xml);
  const nodeMap = new Map<string, { label: string; x?: number; y?: number }>();

  // Extract geometry
  const cellRegex = /<mxCell\b([^>]*\bvertex="1"[^>]*)>([\s\S]*?)<\/mxCell>/g;
  let match;
  while ((match = cellRegex.exec(xml)) !== null) {
    const attrs = match[1];
    const inner = match[2];
    const idMatch = /\bid="([^"]+)"/.exec(attrs);
    if (!idMatch) continue;

    const geoMatch = /<mxGeometry\b([^>]*)\/?>/.exec(inner);
    let x: number | undefined;
    let y: number | undefined;
    if (geoMatch) {
      const xM = /\bx="([^"]+)"/.exec(geoMatch[1]);
      const yM = /\by="([^"]+)"/.exec(geoMatch[1]);
      if (xM) x = parseFloat(xM[1]);
      if (yM) y = parseFloat(yM[1]);
    }

    const valueMatch = /\bvalue="([^"]*)"/.exec(attrs);
    const raw = valueMatch ? valueMatch[1].replace(/<[^>]*>/g, '').trim() : '';
    if (raw) {
      nodeMap.set(idMatch[1], { label: raw, x, y });
    }
  }

  const enhancedNodes: EnhancedTopologyNode[] = base.nodes.map((n) => {
    const geo = nodeMap.get(n.id);
    return {
      ...n,
      x: geo?.x,
      y: geo?.y,
    };
  });

  const labelLookup = new Map<string, string>();
  enhancedNodes.forEach((n) => labelLookup.set(n.id, n.label));

  const enhancedEdges: EnhancedTopologyEdge[] = base.edges.map((e) => ({
    source: e.source,
    target: e.target,
    sourceLabel: labelLookup.get(e.source) || e.source,
    targetLabel: labelLookup.get(e.target) || e.target,
    label: e.label || '',
  }));

  // Determine orientation
  let horizontalDeltas = 0;
  let verticalDeltas = 0;
  for (const edge of enhancedEdges) {
    const sNode = enhancedNodes.find((n) => n.id === edge.source);
    const tNode = enhancedNodes.find((n) => n.id === edge.target);
    if (sNode && tNode && sNode.x !== undefined && tNode.x !== undefined && sNode.y !== undefined && tNode.y !== undefined) {
      const dx = Math.abs(tNode.x - sNode.x);
      const dy = Math.abs(tNode.y - sNode.y);
      if (dx > dy) horizontalDeltas++;
      else verticalDeltas++;
    }
  }

  const orientation = horizontalDeltas >= verticalDeltas ? 'left-to-right' : 'top-to-bottom';

  return {
    nodes: enhancedNodes,
    edges: enhancedEdges,
    orientation,
  };
}

/**
 * Organizes components into standard engineering architectural tiers.
 */
export function categorizeTiers(nodes: EnhancedTopologyNode[]): ArchitectureTier[] {
  const tierCategories: { name: string; types: string[]; items: string[] }[] = [
    { name: 'Client & Edge Ingress', types: ['client', 'perimeter'], items: [] },
    { name: 'Gateway & Reverse Proxy', types: ['gateway', 'connection_pool', 'circuit_breaker'], items: [] },
    { name: 'Application & Core Microservices', types: ['compute', 'auth'], items: [] },
    { name: 'Async Messaging & Streaming', types: ['queue', 'dlq'], items: [] },
    { name: 'Persistence, Caches & Datastores', types: ['database', 'cache', 'object_storage'], items: [] },
    { name: 'Security, Vault & Observability', types: ['secret_vault', 'vpc_endpoint', 'telemetry'], items: [] },
  ];

  const unclassified: string[] = [];

  for (const node of nodes) {
    let placed = false;
    for (const cat of tierCategories) {
      if (cat.types.includes(node.type)) {
        cat.items.push(node.label);
        placed = true;
        break;
      }
    }
    if (!placed) {
      unclassified.push(node.label);
    }
  }

  if (unclassified.length > 0) {
    tierCategories[2].items.push(...unclassified);
  }

  return tierCategories
    .filter((cat) => cat.items.length > 0)
    .map((cat) => ({ name: cat.name, components: cat.items }));
}

/**
 * Generates Mermaid flowchart syntax from topology.
 */
export function generateMermaidFromTopology(topology: EnhancedTopology): string {
  const dir = topology.orientation === 'left-to-right' ? 'LR' : 'TD';
  const lines: string[] = [`flowchart ${dir}`];

  // Node declarations with clean sanitized IDs
  const idMap = new Map<string, string>();
  topology.nodes.forEach((n, idx) => {
    const safeId = `N${idx + 1}`;
    idMap.set(n.id, safeId);
    // Escape quotes
    const safeLabel = n.label.replace(/"/g, "'");
    lines.push(`  ${safeId}["${safeLabel}"]`);
  });

  // Edge declarations
  topology.edges.forEach((e) => {
    const sId = idMap.get(e.source) || e.source;
    const tId = idMap.get(e.target) || e.target;
    if (e.label) {
      const cleanEdgeLabel = e.label.replace(/"/g, "'");
      lines.push(`  ${sId} -->|"${cleanEdgeLabel}"| ${tId}`);
    } else {
      lines.push(`  ${sId} --> ${tId}`);
    }
  });

  return lines.join('\n');
}

/**
 * Deterministic local synthesis engine (100% offline, reproducible prompt).
 */
export function synthesizeDeterministicPrompt(topology: EnhancedTopology): ArchitecturePromptResult {
  const nodeCount = topology.nodes.length;
  const edgeCount = topology.edges.length;
  const tiers = categorizeTiers(topology.nodes);

  // Derive system title from prominent nodes
  const nodeLabels = topology.nodes.map((n) => n.label);
  const primaryService = nodeLabels.find((l) => /service|api|app|core|order|payment/i.test(l)) || nodeLabels[0] || 'System';
  const title = `${primaryService} Distributed Architecture`;
  const summary = `A ${nodeCount}-component cloud architecture featuring ${tiers.length} architectural tiers interconnected by ${edgeCount} explicit data flow channels.`;

  // Build the AI Reconstruction Prompt (optimized for LLMs and Draw.io prompt generators)
  const promptLines: string[] = [
    `Create a detailed cloud architecture diagram for: ${title}.`,
    '',
    '### System Components & Tiers:',
  ];

  tiers.forEach((t) => {
    promptLines.push(`- **${t.name}**: ${t.components.join(', ')}`);
  });

  promptLines.push('', '### Step-by-Step Data Flow Hops:');
  if (topology.edges.length > 0) {
    topology.edges.forEach((e, idx) => {
      const action = e.label ? ` via "${e.label}"` : '';
      promptLines.push(`${idx + 1}. [${e.sourceLabel}] ➔ [${e.targetLabel}]${action}`);
    });
  } else {
    promptLines.push('Connect components sequentially through an ingress gateway down to persistence services.');
  }

  promptLines.push(
    '',
    '### Architecture Constraints & Layout:',
    `- Flow Orientation: ${topology.orientation === 'left-to-right' ? 'Left-to-Right (Horizontal pipeline)' : 'Top-to-Bottom (Vertical multi-tier)'}`,
    '- Connectors: Orthogonal directed lines with explicit labels on interaction hops',
    '- Grouping: Clear visual separation between Edge/Ingress, Compute Services, and Datastore tiers'
  );

  const reconstructionPrompt = promptLines.join('\n');

  // Build the System Spec Markdown (RFC Engineering Document)
  const specLines: string[] = [
    `# Technical Architecture Specification: ${title}`,
    '',
    `**Status:** Active Topology Baseline  `,
    `**Generated:** ${new Date().toISOString().split('T')[0]}  `,
    `**Components:** ${nodeCount} | **Data Flow Hops:** ${edgeCount} | **Tiers:** ${tiers.length}  `,
    '',
    '## 1. System Overview',
    summary,
    '',
    '## 2. Component Inventory & Responsibility Tiers',
  ];

  tiers.forEach((tier) => {
    specLines.push(`### ${tier.name}`);
    tier.components.forEach((c) => {
      specLines.push(`- **\`${c}\`**: Component within the ${tier.name.toLowerCase()} domain.`);
    });
    specLines.push('');
  });

  specLines.push('## 3. Interaction & Communication Matrix');
  specLines.push('| Step | Source Component | Target Component | Protocol / Action |');
  specLines.push('| :--- | :--------------- | :--------------- | :---------------- |');

  if (topology.edges.length > 0) {
    topology.edges.forEach((e, idx) => {
      specLines.push(`| ${idx + 1} | \`${e.sourceLabel}\` | \`${e.targetLabel}\` | ${e.label ? `\`${e.label}\`` : 'Direct Link / RPC'} |`);
    });
  } else {
    specLines.push('| 1 | (Unconnected nodes) | - | - |');
  }

  specLines.push(
    '',
    '## 4. Visual Layout Guidance for Diagram Generation',
    `- Layout Orientation: ${topology.orientation}`,
    `- Edge routing: Orthogonal paths with arrowheads at target endpoints`,
    `- High availability: Ensure critical datastores and queue components feature failover pathways`
  );

  const systemSpecMarkdown = specLines.join('\n');
  const mermaidSyntax = generateMermaidFromTopology(topology);

  return {
    title,
    summary,
    reconstructionPrompt,
    systemSpecMarkdown,
    mermaidSyntax,
    nodeCount,
    edgeCount,
    tiers,
    isAiGenerated: false,
  };
}

/**
 * AI-Powered Reverse Prompt Engineering:
 * Sends the topology graph to Gemini to produce an articulate, engineering-grade prompt
 * that can be fed back into any LLM or the studio's diagram generator.
 */
export async function generateReversePromptFromDiagram(
  xml: string,
  apiKey?: string
): Promise<ArchitecturePromptResult> {
  const topology = extractEnhancedTopology(xml);

  // If the diagram has 0 nodes, return empty baseline
  if (topology.nodes.length === 0) {
    return {
      title: 'Empty Architecture Canvas',
      summary: 'Canvas contains no architectural shapes.',
      reconstructionPrompt: 'Please add nodes or draw an architecture diagram on the canvas first.',
      systemSpecMarkdown: '# Empty Architecture Canvas\n\nNo components detected.',
      mermaidSyntax: 'flowchart LR\n  empty["Empty Canvas"]',
      nodeCount: 0,
      edgeCount: 0,
      tiers: [],
      isAiGenerated: false,
    };
  }

  // Pre-generate deterministic baseline as instant fallback
  const deterministicResult = synthesizeDeterministicPrompt(topology);

  // API Key resolution
  const envKey = (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } })?.env?.VITE_GEMINI_API_KEY || '';
  const storedKey = (typeof localStorage !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') : '') || '';
  const cleanStored = storedKey.includes('AIzaSyBCdBG4Cu') ? '' : storedKey;
  const cleanPassed = apiKey && !apiKey.includes('AIzaSyBCdBG4Cu') ? apiKey : '';
  const keyToUse = cleanPassed || envKey || cleanStored;

  if (!keyToUse.trim()) {
    // Return deterministic offline result
    return deterministicResult;
  }

  const candidateModels = [
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-flash-lite-latest',
  ];

  const topologyContext = JSON.stringify({
    orientation: topology.orientation,
    nodes: topology.nodes.map((n) => ({ id: n.id, label: n.label, type: n.type })),
    edges: topology.edges.map((e) => ({
      from: e.sourceLabel,
      to: e.targetLabel,
      label: e.label || 'standard communication',
    })),
  });

  const promptInstructions = `You are a Principal Cloud Enterprise Architect and AI Prompt Engineer.
Analyze the following extracted architecture topology graph (nodes and directed edges):
${topologyContext}

Your mission:
Generate a pristine, highly-structured natural language AI PROMPT such that when any engineer or AI diagram generator reads it, they can re-generate this exact architecture flow with 100% fidelity.

Output a valid JSON object matching this exact schema:
{
  "title": "A crisp, authoritative system name (e.g. 'High-Throughput E-Commerce Order & Inventory Pipeline')",
  "summary": "2-3 sentences explaining the architectural intent, style (microservices, event-driven, CQRS, etc.), and functional purpose.",
  "reconstructionPrompt": "A comprehensive, beautifully formatted prompt for an AI diagram generator. It must include: System Goal, Architectural Tiers with exact component names, Explicit Step-by-Step Data Flow Hops with protocols ('[Source] -> [Target] via [Protocol: Action]'), Non-functional requirements (security, caching, queues), and Layout orientation instructions.",
  "systemSpecMarkdown": "An engineering RFC specification in GitHub-flavored markdown with: 1. Overview, 2. Tier Breakdown, 3. Step-by-Step Data Flow Table, 4. Resilience & Security Analysis.",
  "tiers": [
    { "name": "Tier Name (e.g. Ingress & Edge)", "components": ["Component1", "Component2"] }
  ]
}

DO NOT output markdown backticks around the JSON. Output only raw JSON.`;

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
                parts: [{ text: promptInstructions }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) continue;

      const parsed = JSON.parse(content);
      if (parsed.reconstructionPrompt) {
        return {
          title: parsed.title || deterministicResult.title,
          summary: parsed.summary || deterministicResult.summary,
          reconstructionPrompt: parsed.reconstructionPrompt,
          systemSpecMarkdown: parsed.systemSpecMarkdown || deterministicResult.systemSpecMarkdown,
          mermaidSyntax: deterministicResult.mermaidSyntax,
          nodeCount: topology.nodes.length,
          edgeCount: topology.edges.length,
          tiers: parsed.tiers && parsed.tiers.length > 0 ? parsed.tiers : deterministicResult.tiers,
          isAiGenerated: true,
        };
      }
    } catch {
      // Continue to next model or fallback
    }
  }

  // Graceful fallback to deterministic synthesizer
  return deterministicResult;
}
