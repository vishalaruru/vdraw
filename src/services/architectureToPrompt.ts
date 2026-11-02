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
    { name: 'CLIENT TIER', types: ['client', 'perimeter'], items: [] },
    { name: 'INTEGRATION TIER', types: ['gateway', 'connection_pool', 'circuit_breaker'], items: [] },
    { name: 'ORCHESTRATION & DOMAIN SERVICES TIER', types: ['compute', 'auth'], items: [] },
    { name: 'ASYNC MESSAGING & STREAMING TIER', types: ['queue', 'dlq'], items: [] },
    { name: 'EXTERNAL PROVIDERS & DATA TIER', types: ['database', 'cache', 'object_storage'], items: [] },
    { name: 'CONFIGURATION & INFRASTRUCTURE TIER', types: ['secret_vault', 'vpc_endpoint', 'telemetry'], items: [] },
  ];

  const unclassified: string[] = [];

  for (const node of nodes) {
    const l = node.label.toLowerCase();
    if (l.includes('client') || l.includes('user') || l.includes('browser') || l.includes('ios') || l.includes('android')) {
      tierCategories[0].items.push(node.label);
    } else if (l.includes('sdk') || l.includes('matcher') || l.includes('gateway') || l.includes('waf') || l.includes('proxy')) {
      tierCategories[1].items.push(node.label);
    } else if (l.includes('provider') || l.includes('stream') || l.includes('radar') || l.includes('gdp') || l.includes('dots')) {
      tierCategories[4].items.push(node.label);
    } else if (l.includes('config') || l.includes('vault') || l.includes('kms') || l.includes('setting')) {
      tierCategories[5].items.push(node.label);
    } else if (l.includes('api') || l.includes('service') || l.includes('mapper') || l.includes('worker') || l.includes('mfl')) {
      tierCategories[2].items.push(node.label);
    } else {
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

  const idMap = new Map<string, string>();
  topology.nodes.forEach((n, idx) => {
    const safeId = `N${idx + 1}`;
    idMap.set(n.id, safeId);
    const safeLabel = n.label.replace(/"/g, "'");
    lines.push(`  ${safeId}["${safeLabel}"]`);
  });

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

  const nodeLabels = topology.nodes.map((n) => n.label);
  const primaryService = nodeLabels.find((l) => /service|api|app|core|order|payment|mfl|media/i.test(l)) || nodeLabels[0] || 'System';
  const title = `${primaryService} Architecture Flow`;
  const summary = `High-fidelity technical architecture diagram featuring ${nodeCount} components across ${tiers.length} architectural tiers with ${edgeCount} explicit data flow connections.`;

  // Build the High-Fidelity Prompt matching the precise user specification format:
  const promptLines: string[] = [
    `Create a high-fidelity technical architecture diagram with a '${topology.orientation}' orientation.`,
    'The diagram must visualize the following flow:',
  ];

  let stepNum = 1;
  // 1. Client Tier
  const clientTier = tiers.find((t) => t.name.includes('CLIENT'));
  if (clientTier) {
    promptLines.push(`${stepNum++}. CLIENT TIER: Position ${clientTier.components.map((c) => `'${c}'`).join(' and ')} at the far left.`);
  }

  // 2. Integration Tier
  const intTier = tiers.find((t) => t.name.includes('INTEGRATION'));
  if (intTier) {
    // Find connections from clients to integration
    const intEdges = topology.edges.filter((e) => intTier.components.includes(e.targetLabel));
    if (intEdges.length > 0) {
      const flowDesc = intEdges.map((e) => `Connect '${e.sourceLabel}' to '${e.targetLabel}'`).join('. ');
      promptLines.push(`${stepNum++}. INTEGRATION TIER: ${flowDesc}.`);
    } else {
      promptLines.push(`${stepNum++}. INTEGRATION TIER: Include ${intTier.components.map((c) => `'${c}'`).join(', ')}.`);
    }
  }

  // 3. Orchestration & Domain Services Tier
  const domainTier = tiers.find((t) => t.name.includes('ORCHESTRATION') || t.name.includes('DOMAIN'));
  if (domainTier) {
    const domainEdges = topology.edges.filter((e) => domainTier.components.includes(e.sourceLabel) || domainTier.components.includes(e.targetLabel));
    if (domainEdges.length > 0) {
      const flowDesc = domainEdges.map((e) => `Connect '${e.sourceLabel}' to '${e.targetLabel}'`).slice(0, 4).join('. ');
      promptLines.push(`${stepNum++}. DOMAIN SERVICES TIER: ${flowDesc}.`);
    } else {
      promptLines.push(`${stepNum++}. DOMAIN SERVICES TIER: Position ${domainTier.components.map((c) => `'${c}'`).join(', ')}.`);
    }
  }

  // 4. External Providers & Data Tier
  const extTier = tiers.find((t) => t.name.includes('EXTERNAL'));
  if (extTier) {
    const extEdges = topology.edges.filter((e) => extTier.components.includes(e.targetLabel));
    if (extEdges.length > 0) {
      const flowDesc = extEdges.map((e) => `Connect '${e.sourceLabel}' to '${e.targetLabel}'`).join('. ');
      promptLines.push(`${stepNum++}. EXTERNAL PROVIDERS & DATA TIER: ${flowDesc}.`);
    } else {
      promptLines.push(`${stepNum++}. EXTERNAL PROVIDERS & DATA TIER: Include ${extTier.components.map((c) => `'${c}'`).join(', ')}.`);
    }
  }

  // 5. Configuration
  const cfgTier = tiers.find((t) => t.name.includes('CONFIGURATION'));
  if (cfgTier) {
    const cfgEdges = topology.edges.filter((e) => cfgTier.components.includes(e.sourceLabel) || cfgTier.components.includes(e.targetLabel));
    if (cfgEdges.length > 0) {
      const edge = cfgEdges[0];
      const target = edge.sourceLabel === cfgTier.components[0] ? edge.targetLabel : edge.sourceLabel;
      promptLines.push(`${stepNum++}. CONFIGURATION: Place '${cfgTier.components[0]}' as a dependency for '${target}'.`);
    } else {
      promptLines.push(`${stepNum++}. CONFIGURATION: Place '${cfgTier.components[0]}' adjacent to core services.`);
    }
  }

  // Common label and icon instructions
  promptLines.push(
    "All connections must be labeled 'standard communication'.",
    "Use distinct icons for Clients ('actor'), APIs ('rounded'/'rectangle'), and External Providers ('cloud')."
  );

  const reconstructionPrompt = promptLines.join('\n');

  // Build the System Spec Markdown
  const specLines: string[] = [
    `# Technical Architecture Specification: ${title}`,
    '',
    `**Status:** Verified Architecture Baseline  `,
    `**Orientation:** ${topology.orientation.toUpperCase()}  `,
    `**Components:** ${nodeCount} | **Data Flow Hops:** ${edgeCount} | **Tiers:** ${tiers.length}  `,
    '',
    '## 1. System Overview',
    summary,
    '',
    '## 2. Component Inventory & Tiers',
  ];

  tiers.forEach((tier) => {
    specLines.push(`### ${tier.name}`);
    tier.components.forEach((c) => {
      specLines.push(`- **\`${c}\`**: Component within ${tier.name}.`);
    });
    specLines.push('');
  });

  specLines.push('## 3. Communication Matrix');
  specLines.push('| Step | Source Component | Target Component | Protocol / Action |');
  specLines.push('| :--- | :--------------- | :--------------- | :---------------- |');

  if (topology.edges.length > 0) {
    topology.edges.forEach((e, idx) => {
      specLines.push(`| ${idx + 1} | \`${e.sourceLabel}\` | \`${e.targetLabel}\` | ${e.label ? `\`${e.label}\`` : 'standard communication'} |`);
    });
  } else {
    specLines.push('| 1 | (Unconnected nodes) | - | - |');
  }

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
 * Analyzes the canvas topology graph and generates a natural language architecture prompt.
 */
export async function generateReversePromptFromDiagram(
  xml: string,
  apiKey?: string
): Promise<ArchitecturePromptResult> {
  const topology = extractEnhancedTopology(xml);

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

  const deterministicResult = synthesizeDeterministicPrompt(topology);

  const envKey = (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } })?.env?.VITE_GEMINI_API_KEY || '';
  const storedKey = (typeof localStorage !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') : '') || '';
  const cleanStored = storedKey.includes('AIzaSyBCdBG4Cu') ? '' : storedKey;
  const cleanPassed = apiKey && !apiKey.includes('AIzaSyBCdBG4Cu') ? apiKey : '';
  const keyToUse = cleanPassed || envKey || cleanStored;

  if (!keyToUse.trim()) {
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

  const promptInstructions = `You are a Principal Cloud Architect and AI Prompt Engineer.
Analyze the following extracted architecture topology graph (nodes and directed edges):
${topologyContext}

Your mission:
Generate a pristine, highly-structured natural language AI PROMPT such that when any engineer or AI diagram generator reads it, they can re-generate this exact architecture flow with 100% fidelity.

Follow this exact prompt structure:
"Create a high-fidelity technical architecture diagram with a '${topology.orientation}' orientation. The diagram must visualize the following flow:
1. CLIENT TIER: Position [Clients] at the far left.
2. INTEGRATION TIER: Connect [Clients] to [SDK/Gateway].
3. ORCHESTRATION TIER: Connect [SDK/Gateway] to [APIs].
4. DOMAIN SERVICES TIER: Connect [APIs] to [Services].
5. EXTERNAL PROVIDERS & DATA TIER: Connect [Services] to [External Providers and Data Streams].
6. CONFIGURATION: Place [Config] as a dependency for [Target Service].
All connections must be labeled 'standard communication'. Use distinct icons for Clients ('actor'), APIs ('rounded'/'rectangle'), and External Providers ('cloud')."

Output a valid JSON object matching this exact schema:
{
  "title": "A crisp, authoritative system name (e.g. 'Sports Media Orchestration & Provider Integration Pipeline')",
  "summary": "2-3 sentences explaining the architectural intent, flow direction, and functional purpose.",
  "reconstructionPrompt": "The pristine prompt formatted exactly as shown above.",
  "systemSpecMarkdown": "An engineering RFC specification in GitHub-flavored markdown with: 1. Overview, 2. Tier Breakdown, 3. Step-by-Step Data Flow Table, 4. Resilience & Security Analysis.",
  "tiers": [
    { "name": "CLIENT TIER", "components": ["iOS / Android Client", "Web Client"] }
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
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) continue;

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

  return deterministicResult;
}
