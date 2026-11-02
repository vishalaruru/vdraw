import { extractTopologyFromXml } from './architectureAuditor';
import { repairAndParseJson } from './jsonRepair';

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
  width?: number;
  height?: number;
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
  const nodeMap = new Map<string, { label: string; x?: number; y?: number; width?: number; height?: number }>();

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
    let width: number | undefined;
    let height: number | undefined;

    if (geoMatch) {
      const xM = /\bx="([^"]+)"/.exec(geoMatch[1]);
      const yM = /\by="([^"]+)"/.exec(geoMatch[1]);
      const wM = /\bwidth="([^"]+)"/.exec(geoMatch[1]);
      const hM = /\bheight="([^"]+)"/.exec(geoMatch[1]);
      if (xM) x = parseFloat(xM[1]);
      if (yM) y = parseFloat(yM[1]);
      if (wM) width = parseFloat(wM[1]);
      if (hM) height = parseFloat(hM[1]);
    }

    const valueMatch = /\bvalue="([^"]*)"/.exec(attrs) || /\blabel="([^"]*)"/.exec(attrs);
    const raw = valueMatch ? valueMatch[1].replace(/<[^>]*>/g, '').trim() : '';
    if (raw) {
      nodeMap.set(idMatch[1], { label: raw, x, y, width, height });
    }
  }

  const enhancedNodes: EnhancedTopologyNode[] = base.nodes.map((n) => {
    const geo = nodeMap.get(n.id);
    return {
      ...n,
      x: geo?.x,
      y: geo?.y,
      width: geo?.width,
      height: geo?.height,
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
 * Graph-Aware Semantic Topology Analyzer:
 * Decomposes topology into Starting Points, Center Spine Highway, Orchestration, Rails, Terminal Sinks, and Backbones.
 */
function analyzeTopologicalFlow(topology: EnhancedTopology) {
  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();
  const targetsOf = new Map<string, string[]>();

  for (const n of topology.nodes) {
    inDegree.set(n.id, 0);
    outDegree.set(n.id, 0);
    targetsOf.set(n.id, []);
  }

  for (const e of topology.edges) {
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    outDegree.set(e.source, (outDegree.get(e.source) || 0) + 1);
    targetsOf.get(e.source)?.push(e.target);
  }

  // 1. Streaming Backbone (Dots Stream, Kafka, etc.)
  const streamingNodes = topology.nodes.filter(
    (n) => /stream|bus|dots|kafka|backbone/i.test(n.label) || (n.width && n.width >= 450)
  );

  // 2. Terminal Endpoint / Sinks (FE, BFF, Frontend apps)
  const terminalNodes = topology.nodes.filter((n) => {
    const l = n.label.toLowerCase();
    return /\bfe\b|\bbff\b|frontend|client|player/i.test(l) || (n.height && n.height >= 400);
  });

  // 3. Publishing Rails (stacked vertical features)
  const railNodes = topology.nodes.filter((n) => {
    const l = n.label.toLowerCase();
    const isSmallHeight = n.height && n.height <= 45;
    const isRailNamed = /rail|slate|event|epg|waterfront|favorites|shortcut|playback|score|history|personalisation|search/i.test(l);
    return !streamingNodes.some((s) => s.id === n.id) && !terminalNodes.some((t) => t.id === n.id) && (isSmallHeight || isRailNamed);
  });

  // 4. Starting Points / Upstream Sources (in-degree 0 or far-left)
  const sourceNodes = topology.nodes.filter((n) => {
    if (streamingNodes.some((s) => s.id === n.id) || terminalNodes.some((t) => t.id === n.id) || railNodes.some((r) => r.id === n.id)) {
      return false;
    }
    const l = n.label.toLowerCase();
    const isPureSource = (inDegree.get(n.id) || 0) === 0;
    const isSourceName = /planning|partner|studio|imdb|gracenote|vam|sports provider|rights/i.test(l);
    return isPureSource || isSourceName || (n.x !== undefined && n.x < 320);
  });

  // 5. Core Processing Spine (Horizontal Highway)
  const spineCandidates = topology.nodes.filter((n) => {
    const l = n.label.toLowerCase();
    if (streamingNodes.some((s) => s.id === n.id) || terminalNodes.some((t) => t.id === n.id) || railNodes.some((r) => r.id === n.id) || sourceNodes.some((src) => src.id === n.id)) {
      return false;
    }
    return /parser|mel|dcms|oca|feeds|kinesis|firehose|producer|ingest|habit/i.test(l);
  });

  // 6. Orchestration & Support Services
  const orchestrationNodes = topology.nodes.filter((n) => {
    return (
      !streamingNodes.some((s) => s.id === n.id) &&
      !terminalNodes.some((t) => t.id === n.id) &&
      !railNodes.some((r) => r.id === n.id) &&
      !sourceNodes.some((src) => src.id === n.id) &&
      !spineCandidates.some((sp) => sp.id === n.id)
    );
  });

  return {
    sourceNodes,
    spineCandidates,
    orchestrationNodes,
    railNodes,
    terminalNodes,
    streamingNodes,
  };
}

/**
 * Deterministic local synthesis engine: Generates a complete, exhaustive, publication-grade prompt
 * with full architectural context (Starting Point, Center Spine, Rails, End Point, Bottom Backbone).
 * GUARANTEE: Mentions 100% of all components and 100% of all data flows without truncating.
 */
export function synthesizeDeterministicPrompt(topology: EnhancedTopology): ArchitecturePromptResult {
  const nodeCount = topology.nodes.length;
  const edgeCount = topology.edges.length;
  const tiers = categorizeTiers(topology.nodes);

  const nodeLabels = topology.nodes.map((n) => n.label);
  const primaryService = nodeLabels.find((l) => /service|pipeline|workflow|platform|dazn|mfl/i.test(l)) || nodeLabels[0] || 'Enterprise';
  const title = `${primaryService} Architecture Flow`;
  const summary = `Comprehensive enterprise architecture diagram containing ${nodeCount} components organized with clear starting points, a central horizontal processing highway, supporting orchestration, vertical publishing rails, and terminal consumer endpoints.`;

  const flowContext = analyzeTopologicalFlow(topology);

  // Build the Comprehensive Context-Rich Prompt
  const promptLines: string[] = [
    `Create a high-fidelity technical architecture diagram with a '${topology.orientation}' orientation.`,
    `The system visualizes an end-to-end media platform with explicit starting points, a central horizontal processing spine, supporting orchestration, vertical publishing rails, and terminal consumer endpoints (${nodeCount} components, ${edgeCount} data flows):`,
    '',
  ];

  // 1. Starting Points
  if (flowContext.sourceNodes.length > 0) {
    promptLines.push('### 1. STARTING POINTS & UPSTREAM INGESTION (Far Left, x ≈ 60-220):');
    promptLines.push(
      `- Position upstream entry sources on the far left: ${flowContext.sourceNodes.map((s) => `'${s.label}'`).join(', ')}.`
    );
    promptLines.push('');
  }

  // 2. Core Processing Spine Highway
  if (flowContext.spineCandidates.length > 0) {
    promptLines.push('### 2. CORE HORIZONTAL PROCESSING SPINE (Center Highway, Left-to-Right, y ≈ 360):');
    promptLines.push(
      `- Lay out the primary transformation pipeline sequentially along the center horizontal row: ${flowContext.spineCandidates.map((sp) => `'${sp.label}'`).join(' ➔ ')}.`
    );
    promptLines.push('- Ensure all spine nodes are aligned along the horizontal centerline with generous spacing.');
    promptLines.push('');
  }

  // 3. Orchestration & Support Services
  if (flowContext.orchestrationNodes.length > 0) {
    promptLines.push('### 3. ORCHESTRATION & SUPPORT SERVICES (Placed Above & Below Center Spine):');
    promptLines.push(
      `- Position management, content rights, and configuration dependencies: ${flowContext.orchestrationNodes.map((o) => `'${o.label}'`).join(', ')}.`
    );
    promptLines.push('');
  }

  // 4. Publishing Rails (Vertical Stack)
  if (flowContext.railNodes.length > 0) {
    promptLines.push(`### 4. PUBLISHING RAILS (Vertical Stack on the Right, x ≈ 1680):`);
    promptLines.push(
      `- Stack the following ${flowContext.railNodes.length} consumer rails in a single, neat vertical column:`
    );
    promptLines.push(`  ${flowContext.railNodes.map((r) => `'${r.label}'`).join(', ')}.`);
    promptLines.push('- Connect core ingestion and management services directly into these rails.');
    promptLines.push('');
  }

  // 5. Terminal Endpoint
  if (flowContext.terminalNodes.length > 0) {
    promptLines.push('### 5. TERMINAL DESTINATION / CONSUMER ENDPOINT (Far Right, x ≈ 1950):');
    promptLines.push(
      `- Position ${flowContext.terminalNodes.map((t) => `'${t.label}'`).join(', ')} as the tall bracketed terminal endpoint on the far right.`
    );
    promptLines.push('- Connect all publishing rails into this terminal endpoint.');
    promptLines.push('');
  }

  // 6. Streaming Backbone
  if (flowContext.streamingNodes.length > 0) {
    promptLines.push('### 6. EVENT STREAMING BACKBONE (Horizontal Bus along the Bottom, y ≈ 980):');
    promptLines.push(
      `- Position ${flowContext.streamingNodes.map((s) => `'${s.label}'`).join(', ')} as a wide horizontal streaming backbone across the entire bottom of the canvas.`
    );
    promptLines.push('- Connect downward stream taps from core processing nodes into this bus.');
    promptLines.push('');
  }

  // 7. Step-by-Step Data Flow Connections
  promptLines.push('### 7. STEP-BY-STEP DATA FLOW CONNECTIONS:');
  if (topology.edges.length > 0) {
    topology.edges.forEach((e, idx) => {
      const protocolStr = e.label ? ` via "${e.label}"` : '';
      promptLines.push(`${idx + 1}. Connect '${e.sourceLabel}' to '${e.targetLabel}'${protocolStr}.`);
    });
  } else {
    promptLines.push('Connect upstream ingestion services to processing services down to datastores.');
  }

  // 8. Visual Directives
  promptLines.push(
    '',
    '### 8. VISUAL DIRECTIVES & RENDERING GUIDELINES:',
    "- Maintain clean orthogonal 90-degree routing for all connection arrows without crossing through shapes.",
    "- Preserve clear visual separation between the horizontal center spine and the vertical publishing rails.",
    "- Use distinct pastel colors: Mint Green for Ingestion/SDKs, Tech Blue for Core Spine Services, Warm Amber for Sources & External Streams, Light Purple for Config."
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
Generate an EXHAUSTIVE, production-grade natural language AI PROMPT such that when any engineer or AI diagram generator reads it, they understand:
1. WHAT IS THE STARTING POINT (Upstream Sources & Ingestion on Far Left)
2. WHAT IS THE CORE PROCESSING HIGHWAY (Center Horizontal Spine flowing Left-to-Right)
3. WHAT ARE THE ORCHESTRATION & SUPPORT SERVICES (Positioned Above/Below Center Spine)
4. WHAT ARE THE PUBLISHING RAILS (Tidy vertical stack on the right)
5. WHAT IS THE TERMINAL DESTINATION / ENDPOINT (Tall consumer bracket on Far Right)
6. WHAT IS THE EVENT STREAMING BACKBONE (Horizontal bus along the bottom)

CRITICAL COMPLETENESS RULES:
1. YOU MUST MENTION EVERY SINGLE COMPONENT FROM THE INPUT TOPOLOGY (${topology.nodes.length} components). Never omit or summarize components away!
2. Structure the prompt into the exact semantic sections described above.
3. Enumerate ALL step-by-step data flow hops connecting components: "Connect 'A' to 'B' via [Label]".

Output a valid JSON object matching this exact schema:
{
  "title": "Authoritative System Title",
  "summary": "2-3 sentences explaining the architectural intent, starting points, processing highway, and terminal consumer.",
  "reconstructionPrompt": "The complete, detailed, non-truncated reconstruction prompt containing every component and connection organized with full context.",
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
              maxOutputTokens: 16384,
            },
            signal: AbortSignal.timeout(60000),
          }),
        }
      );

      if (!response.ok) continue;

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) continue;

      const parsed: any = repairAndParseJson(content);
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
