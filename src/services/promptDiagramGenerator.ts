import { ExtractedDiagram, ThemePreset } from '../types/diagram';
import { synthesizeDrawioXml } from './diagramSynthesizer';
import { normalizeAndEnhanceDiagram } from './diagramLayoutOptimizer';
import { repairAndParseJson } from './jsonRepair';

const PROMPT_ENGINE_INSTRUCTIONS = `You are a Principal Cloud Architecture and Diagram Engineer for draw.io (Vdraw).
Your job is to convert natural language architectural descriptions, flowcharts, or system briefs into pristine, publication-grade enterprise architecture models in pure JSON.

### ENTERPRISE ARCHITECTURE SPATIAL LAYOUT RULES (LEFT-TO-RIGHT WITH HIGHWAY SPINE):
1. STARTING POINTS / UPSTREAM SOURCES (Far Left, x ≈ 40 - 240):
   - Position end-user clients, mobile apps ('actor'), upstream media/partner ingestion ('rounded'/'rectangle'), and content providers on the far left.
   - For example: 'Entertainment Planning', 'Gracenote', 'IMDB', 'Sports Provider' at x ≈ 40-200.

2. PRIMARY HORIZONTAL PROCESSING HIGHWAY / SPINE (Center Left-to-Right Row, y ≈ 360):
   - Lay out the sequential transformation chain along the horizontal center row (y ≈ 350-380) from left to right.
   - x starts around 230 and increments by 160-180px for each successive step:
     e.g., Pre MEL Parser (x: 230, y: 360) ➔ DAZN MEL (x: 400, y: 360) ➔ DCMS (x: 580, y: 360) ➔ OCA (x: 740, y: 360) ➔ DAZN FEEDS (x: 900, y: 360) ➔ Kinesis (x: 1080, y: 360) ➔ Producers (x: 1240, y: 360) ➔ Ingest (x: 1420, y: 360).
   - NEVER collapse the sequential pipeline into a vertical column! They must flow horizontally along y ≈ 360.

3. SUPPORT SERVICES & ORCHESTRATION (Above & Below Center Spine):
   - Place upstream rights & management (e.g. WON, VDP) in the upper tier (y ≈ 60 - 200).
   - Place metadata, entitlements, search indices (e.g. OpenSearch, Entitlement, SAM) directly above or below the spine node they connect to (y ≈ 240 - 280).
   - Place configuration dependencies (e.g. Config, Discovery Config) directly adjacent to the node they configure.

4. PUBLISHING RAILS / FEATURE STACKS (Tidy Vertical Column on the Right, x ≈ 1680):
   - When a diagram contains parallel feature rails, channels, or menu rows (e.g. Rail, Slate, Event, EPG, Favorites, Stats, Search, etc.):
     Stack them vertically in a neat column at x ≈ 1680 with y starting around 240 and incrementing by 45px per item (height: 35, width: 180).

5. TERMINAL CONSUMER / ENDPOINT BRACKET (Far Right, x ≈ 1950 - 2000):
   - Position terminal endpoints ('FE', 'BFF', 'Client App') at the far right as a tall bracket collecting inputs from the publishing rails:
     x ≈ 2000, y ≈ 260, width ≈ 90, height ≈ 680.

6. EVENT STREAMING BACKBONE (Horizontal Bus along the Bottom, y ≈ 1000):
   - Position event buses, Kafka clusters, and data lakes ('Dots Stream', 'Data Stream') as a wide banner across the entire bottom:
     x ≈ 40, y ≈ 1000, width ≈ 1950, height ≈ 60.

7. STRICT CONNECTOR FIDELITY:
   - Carefully connect every source -> target specified in the prompt.
   - All connectors must use 'orthogonal' routing.

8. VISUAL ARCHETYPES:
   - "actor" for Users, Mobile Clients, Web Browsers (width: 100, height: 110)
   - "rounded" for SDKs, API Gateways, Rails (width: 140-180, height: 35-60)
   - "rectangle" for Domain Services, APIs, Configs (width: 140-160, height: 60-65)
   - "cloud" for External Providers, Third Parties, External Streams (width: 160, height: 75)
   - "cylinder" for Databases, search indices (width: 100-120, height: 65-75)

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
    'gemini-flash-lite-latest',
    'gemini-3-flash-preview',
    'gemini-3.5-flash',
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
              maxOutputTokens: 16384,
            },
          }),
          signal: AbortSignal.timeout(60000),
        }
      );

      if (!response.ok) {
        lastError = `HTTP ${response.status} from ${model}`;
        continue;
      }

      const data = await response.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) continue;

      const parsed: ExtractedDiagram = repairAndParseJson<ExtractedDiagram>(raw);

      // Determine orientation preference from prompt
      const isLtr = !prompt.toLowerCase().includes('top-to-bottom');
      const enhancedDiagram = normalizeAndEnhanceDiagram(parsed, {
        orientation: isLtr ? 'left-to-right' : 'top-to-bottom',
        alignTiers: false, // PRESERVE the model's generated spatial layout without forcing a 1-column dump!
        applyHarmonizedColors: true,
      });

      const xml = synthesizeDrawioXml(enhancedDiagram, theme);
      return {
        diagram: enhancedDiagram,
        xml,
      };
    } catch (err) {
      lastError = String(err);
    }
  }

  throw new Error(`Failed to generate diagram from prompt: ${lastError || 'All models failed'}`);
}
