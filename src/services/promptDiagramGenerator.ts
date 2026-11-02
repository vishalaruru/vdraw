import { ExtractedDiagram, ThemePreset } from '../types/diagram';
import { synthesizeDrawioXml } from './diagramSynthesizer';
import { normalizeAndEnhanceDiagram } from './diagramLayoutOptimizer';

const PROMPT_ENGINE_INSTRUCTIONS = `You are a Principal Cloud Architecture and Diagram Engineer for draw.io (Vdraw).
Your job is to convert natural language architectural descriptions, flowcharts, or system briefs into pristine, publication-grade enterprise architecture models in pure JSON.

### ARCHITECTURAL RULES & TIER MAPPING:
1. TIER CLUSTERING (Left-to-Right Columnar Flow):
   - TIER 1 (Far Left, x ≈ 80): End-user clients, mobile apps, web browsers. Always use shape "actor".
   - TIER 2 (x ≈ 340): Integration layer, SDKs, API Gateways, Edge proxies, Matchers. Use shape "rounded".
   - TIER 3 (x ≈ 640): Orchestration, Microservices, Domain APIs, Business Logic services. Use shape "rectangle".
   - TIER 4 (Far Right, x ≈ 940): External Providers, Third-party APIs, SaaS, Cloud Data Streams. Use shape "cloud".
   - DEPENDENCIES & CONFIG (x matching target service): Configuration, Secret Vaults, Settings modules. Use shape "rectangle". Place directly below the service they configure.

2. STRICT CONNECTOR FIDELITY & ANTI-MISWIRING:
   - Carefully trace every source -> target connection explicitly specified in the prompt.
   - If the prompt states "Place 'Config' as a dependency for 'MFL Service'", create an edge where source is 'Config' and target is 'MFL Service' (NOT to any other node like 'DOTS Stream'!).
   - Connector labels: Use the exact label requested (e.g. "standard communication", "HTTPS", "REST", "Bi-directional"). Never duplicate words or output repeating phrases.

3. VISUAL ARCHETYPES:
   - "actor" for Users, Mobile Clients, Web Browsers (width: 100, height: 110)
   - "rounded" for SDKs, API Gateways (width: 150, height: 60)
   - "rectangle" for Domain Services, APIs, Configs (width: 160, height: 65)
   - "cloud" for External Providers, Third Parties, External Streams (width: 160, height: 75)
   - "cylinder" for Databases, persistent caches (width: 120, height: 75)

Output strictly valid JSON matching this schema:
{
  "title": "Diagram Title",
  "orientation": "left-to-right",
  "nodes": [
    {
      "id": "node_1",
      "label": "Component Label",
      "shape": "rectangle|rounded|cylinder|rhombus|cloud|actor",
      "x": 80,
      "y": 140,
      "width": 150,
      "height": 65,
      "fillColor": "#DAE8FC",
      "strokeColor": "#6C8EBF"
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "node_1",
      "target": "node_2",
      "label": "Protocol or Action",
      "style": "orthogonal"
    }
  ]
}
Do NOT output markdown backticks or conversational filler.`;

export async function generateDiagramFromPrompt(
  prompt: string,
  theme: ThemePreset = 'modern-indigo',
  apiKey?: string
): Promise<{ diagram: ExtractedDiagram; xml: string }> {
  const envKey = (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } })?.env?.VITE_GEMINI_API_KEY || '';
  const storedKey = (typeof localStorage !== "undefined" ? localStorage.getItem("GEMINI_API_KEY") : "") || "";
  const cleanStored = storedKey.includes("AIzaSyBCdBG4Cu") ? "" : storedKey;
  const cleanPassed = (apiKey && !apiKey.includes("AIzaSyBCdBG4Cu")) ? apiKey : "";
  const keyToUse = cleanPassed || envKey || cleanStored;

  const candidateModels = [
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-flash-lite-latest',
  ];

  let lastError = '';

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
                  { text: PROMPT_ENGINE_INSTRUCTIONS },
                  { text: `User Architecture Prompt:\n${prompt}` },
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

      const parsed: ExtractedDiagram = JSON.parse(raw);

      // Determine orientation preference from prompt
      const isLtr = !prompt.toLowerCase().includes('top-to-bottom');
      const enhancedDiagram = normalizeAndEnhanceDiagram(parsed, {
        orientation: isLtr ? 'left-to-right' : 'top-to-bottom',
        alignTiers: true,
        applyHarmonizedColors: true,
      });

      const xml = synthesizeDrawioXml(enhancedDiagram, theme);
      return { diagram: enhancedDiagram, xml };
    } catch (err) {
      lastError = String(err);
    }
  }

  if (lastError) {
    console.warn('Prompt generator models failed, using local fallback:', lastError);
  }

  // Offline / deterministic fallback if API is not reachable
  const fallback = generateFallbackDiagramFromPrompt(prompt);
  const normalizedFallback = normalizeAndEnhanceDiagram(fallback, {
    orientation: 'left-to-right',
    alignTiers: true,
    applyHarmonizedColors: true,
  });
  const fallbackXml = synthesizeDrawioXml(normalizedFallback, theme);
  return { diagram: normalizedFallback, xml: fallbackXml };
}

/**
 * Intelligent deterministic fallback that extracts components and relationships from prompt text.
 */
function generateFallbackDiagramFromPrompt(prompt: string): ExtractedDiagram {
  // Extract quoted strings or capitalized components
  const quotedMatches = Array.from(prompt.matchAll(/'([^']+)'|"([^"]+)"/g)).map((m) => m[1] || m[2]);
  const uniqueNames = Array.from(new Set(quotedMatches)).filter((s) => s.length > 1 && !/standard communication|left-to-right/i.test(s));

  if (uniqueNames.length === 0) {
    uniqueNames.push('Client', 'API Gateway', 'Core Service', 'Database');
  }

  const nodes = uniqueNames.map((name, idx) => ({
    id: `node_${idx + 1}`,
    label: name,
    shape: 'rectangle' as const,
    x: 80 + (idx % 4) * 260,
    y: 140 + Math.floor(idx / 4) * 160,
    width: 150,
    height: 65,
  }));

  const edges = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      id: `edge_${i + 1}`,
      source: nodes[i].id,
      target: nodes[i + 1].id,
      label: 'standard communication',
      style: 'orthogonal' as const,
    });
  }

  return {
    title: 'Generated Architecture Flow',
    nodes,
    edges,
  };
}
