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
  const cellRegex = /<mxCell\b([^>]*\bvertex="1"[^>]*)>([\s\S]*?)<\/mxCell>|<mxCell\b([^>]*\bvertex="1"[^>]*)\/>/g;
  let match;
  while ((match = cellRegex.exec(xml)) !== null) {
    const attrs = match[1] || match[3] || '';
    const inner = match[2] || '';
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

    const valueMatch = /\bvalue="([^"]*)"/.exec(attrs) || /\blabel="([^"]*)"/.exec(attrs);
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
 * Organizes components into granular engineering architectural tiers.
 */
export function categorizeTiers(nodes: EnhancedTopologyNode[]): ArchitectureTier[] {
  const tierCategories: { name: string; types: string[]; items: string[] }[] = [
    { name: 'CLIENT & UPSTREAM INGESTION TIER', types: ['client', 'perimeter'], items: [] },
    { name: 'INTEGRATION & GATEWAY TIER', types: ['gateway', 'connection_pool', 'circuit_breaker'], items: [] },
    { name: 'CORE PIPELINE & DOMAIN SERVICES TIER', types: ['compute', 'auth'], items: [] },
    { name: 'ASYNC MESSAGING & STREAMING TIER', types: ['queue', 'dlq'], items: [] },
    { name: 'EXTERNAL PROVIDERS & DATA TIER', types: ['database', 'cache', 'object_storage'], items: [] },
    { name: 'CONFIGURATION & MANAGEMENT TIER', types: ['secret_vault', 'vpc_endpoint', 'telemetry'], items: [] },
  ];

  for (const node of nodes) {
    const l = node.label.toLowerCase();
    if (l.includes('client') || l.includes('user') || l.includes('browser') || l.includes('ios') || l.includes('android') || l.includes('partner') || l.includes('studio') || l.includes('showcase') || l.includes('imdb')) {
      tierCategories[0].items.push(node.label);
    } else if (l.includes('sdk') || l.includes('matcher') || l.includes('gateway') || l.includes('proxy') || l.includes('waf') || l.includes('won')) {
      tierCategories[1].items.push(node.label);
    } else if (l.includes('stream') || l.includes('dots') || l.includes('radar') || l.includes('gdp') || l.includes('provider') || l.includes('queue') || l.includes('kafka')) {
      tierCategories[3].items.push(node.label);
    } else if (l.includes('config') || l.includes('vault') || l.includes('setting') || l.includes('page manager') || l.includes('indexer')) {
      tierCategories[5].items.push(node.label);
    } else if (l.includes('db') || l.includes('database') || l.includes('opensearch') || l.includes('s3') || l.includes('storage') || l.includes('redis') || l.includes('snowflake')) {
      tierCategories[4].items.push(node.label);
    } else {
      tierCategories[2].items.push(node.label);
    }
  }

  return tierCategories
    .filter((cat) => cat.items.length > 0)
    .map((cat) => ({ name: cat.name, components: Array.from(new Set(cat.items)) }));
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
 * Deterministic local synthesis engine: Generates a complete, exhaustive, publication-grade prompt.
 * GUARANTEE: Mentions 100% of all components and 100% of all data flows without truncating.
 */
export function synthesizeDeterministicPrompt(topology: EnhancedTopology): ArchitecturePromptResult {
  const nodeCount = topology.nodes.length;
  const edgeCount = topology.edges.length;
  const tiers = categorizeTiers(topology.nodes);

  const nodeLabels = topology.nodes.map((n) => n.label);
  const primaryService = nodeLabels.find((l) => /service|pipeline|workflow|platform|dazn|mfl/i.test(l)) || nodeLabels[0] || 'Enterprise';
  const title = `${primaryService} Architecture Flow`;
  const summary = `Comprehensive enterprise architecture diagram containing ${nodeCount} components organized across ${tiers.length} architectural tiers with ${edgeCount} explicit data flow connections.`;

  // Build the Comprehensive Prompt containing ALL components and ALL data flows
  const promptLines: string[] = [
    `Create a high-fidelity technical architecture diagram with a '${topology.orientation}' orientation.`,
    `The diagram must visualize a complete enterprise system comprising ${nodeCount} components and ${edgeCount} explicit data flow connections:`,
    '',
    '### ARCHITECTURAL TIERS & COMPONENT MANIFEST:',
  ];

  tiers.forEach((tier, idx) => {
    promptLines.push(`${idx + 1}. ${tier.name}:`);
    promptLines.push(`   - Components: ${tier.components.map((c) => `'${c}'`).join(', ')}`);
  });

  promptLines.push('', '### STEP-BY-STEP DATA FLOW CONNECTIONS:');
  if (topology.edges.length > 0) {
    topology.edges.forEach((e, idx) => {
      const protocolStr = e.label ? ` via "${e.label}"` : '';
      promptLines.push(`${idx + 1}. Connect '${e.sourceLabel}' to '${e.targetLabel}'${protocolStr}.`);
    });
  } else {
    promptLines.push('Connect upstream ingestion services to processing services down to datastores.');
  }

  // Detect wide buses (e.g. Dots Stream)
  const streamingNodes = topology.nodes.filter((n) => /stream|bus|dots/i.test(n.label));
  if (streamingNodes.length > 0) {
    promptLines.push(
      '',
      '### STREAMING BUS & DATA LAKE:',
      `- Position ${streamingNodes.map((s) => `'${s.label}'`).join(', ')} as a horizontal event streaming backbone along the bottom.`
    );
  }

  // Detect configuration nodes
  const configNodes = topology.nodes.filter((n) => /config|setting|vault/i.test(n.label));
  if (configNodes.length > 0) {
    promptLines.push(
      '',
      '### CONFIGURATION & DEPENDENCIES:',
      `- Place ${configNodes.map((c) => `'${c.label}'`).join(', ')} as configuration dependencies adjacent to core services.`
    );
  }

  promptLines.push(
    '',
    '### VISUAL STYLING & DIRECTIVES:',
    "- Use distinct icons & styles: 'actor' for human clients/partners, 'rounded' for SDKs/Gateways, 'rectangle' for core services, 'cloud' for external providers and streaming buses, 'cylinder' for databases.",
    "- Maintain clean left-to-right columnar flow with generous spacing between components (min 80px horizontal gap).",
    "- Ensure all connecting arrows use clean orthogonal 90-degree routing without overlapping boxes."
  );

  const reconstructionPrompt = promptLines.join('\n');

  // Build the System Spec Markdown (RFC Document)
  const specLines: string[] = [
    `# Technical Architecture Specification: ${title}`,
    '',
    `**Status:** Verified Enterprise Architecture Baseline  `,
    `**Orientation:** ${topology.orientation.toUpperCase()}  `,
    `**Components:** ${nodeCount} | **Data Flow Hops:** ${edgeCount} | **Tiers:** ${tiers.length}  `,
    '',
    '## 1. Executive Summary',
    summary,
    '',
    '## 2. Component Inventory by Tier',
  ];

  tiers.forEach((tier) => {
    specLines.push(`### ${tier.name} (${tier.components.length} Components)`);
    tier.components.forEach((c) => {
      specLines.push(`- **\`${c}\`**: Active service in domain.`);
    });
    specLines.push('');
  });

  specLines.push('## 3. Comprehensive Data Flow & Communication Matrix');
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
 * Analyzes the full topology graph and generates a natural language architecture prompt.
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
    'gemini-flash-lite-latest',
    'gemini-3-flash-preview',
    'gemini-3.5-flash',
  ];

  const topologyContext = JSON.stringify({
    totalComponentsCount: topology.nodes.length,
    totalConnectionsCount: topology.edges.length,
    orientation: topology.orientation,
    allNodes: topology.nodes.map((n) => ({ id: n.id, label: n.label, type: n.type })),
    allEdges: topology.edges.map((e) => ({
      from: e.sourceLabel,
      to: e.targetLabel,
      label: e.label || 'standard communication',
    })),
  });

  const promptInstructions = `You are a Principal Cloud Architect and AI Prompt Engineer for draw.io (Vdraw).
Analyze the following extracted architecture topology graph (${topology.nodes.length} components, ${topology.edges.length} connections):
${topologyContext}

Your mission:
Generate an EXHAUSTIVE, production-grade natural language AI PROMPT such that when any engineer or AI diagram generator reads it, they can re-generate this exact architecture flow with 100% fidelity.

CRITICAL COMPLETENESS RULES:
1. YOU MUST MENTION EVERY SINGLE COMPONENT FROM THE INPUT TOPOLOGY. Never omit, compress, or summarize components away!
2. Group all components into logical Architectural Tiers (e.g. Ingestion, Processing Pipeline, Infrastructure, Delivery Rails, Event Streaming, Configuration).
3. Under each tier, explicitly enumerate ALL component names in quotes.
4. Enumerate ALL step-by-step data flow hops connecting components: "Connect 'A' to 'B' via [Label]".
5. Provide clear visual layout and grouping instructions (e.g. processing spine in center, publishing rails in vertical stack on right, streaming backbone at bottom).

Output a valid JSON object matching this exact schema:
{
  "title": "Authoritative System Title (e.g. 'DAZN Ingestion, Processing & Rail Publishing Pipeline')",
  "summary": "2-3 sentences explaining the architectural intent, flow direction, and functional purpose.",
  "reconstructionPrompt": "The complete, detailed, non-truncated reconstruction prompt containing every component and connection.",
  "systemSpecMarkdown": "An engineering RFC specification in GitHub-flavored markdown with: 1. Overview, 2. Complete Tier Breakdown, 3. Step-by-Step Data Flow Table, 4. Resilience & Security Analysis.",
  "tiers": [
    { "name": "TIER NAME", "components": ["Comp1", "Comp2"] }
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
              maxOutputTokens: 8192,
            },
            signal: AbortSignal.timeout(60000),
          }),
        }
      );

      if (!response.ok) continue;

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) continue;

      let cleaned = content.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
      }
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleaned = cleaned.slice(firstBrace, lastBrace + 1);
      }

      const parsed = JSON.parse(cleaned);
      if (parsed.reconstructionPrompt) {
        // Completeness Verification: Ensure AI model didn't summarize away components
        let mentionedCount = 0;
        for (const node of topology.nodes) {
          if (parsed.reconstructionPrompt.toLowerCase().includes(node.label.toLowerCase())) {
            mentionedCount++;
          }
        }

        let promptToUse = parsed.reconstructionPrompt;
        // If diagram has >= 5 components and AI prompt mentioned less than 70% of them,
        // use the guaranteed 100% exhaustive deterministic prompt so the user never receives a truncated 4-line prompt.
        if (topology.nodes.length >= 5 && mentionedCount / topology.nodes.length < 0.7) {
          console.warn(
            `AI reconstructionPrompt was incomplete (${mentionedCount}/${topology.nodes.length} nodes mentioned). Using exhaustive prompt.`
          );
          promptToUse = deterministicResult.reconstructionPrompt;
        }

        return {
          title: parsed.title || deterministicResult.title,
          summary: parsed.summary || deterministicResult.summary,
          reconstructionPrompt: promptToUse,
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
