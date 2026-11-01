import { ExtractedDiagram, ThemePreset } from '../types/diagram';
import { synthesizeDrawioXml } from './diagramSynthesizer';

const PROMPT_ENGINE_INSTRUCTIONS = `You are an expert system architect and diagram engineer for draw.io (Vdraw).
Your job is to take a natural language description of an architecture, flowchart, workflow, or system and generate a structured diagram model in pure JSON.

Follow these strict rules:
1. Identify all services, steps, databases, queues, clients, and external gateways.
2. Structure the layout with clean visual hierarchy (top-to-bottom or left-to-right), ensuring coordinates give plenty of space between boxes (e.g. x spaced by 200-240px, y spaced by 120-160px).
3. Choose appropriate shapes:
   - "rectangle" for services, workers, processors
   - "rounded" for states, start/end, API gateways
   - "cylinder" for databases, caches (Redis, Postgres, DynamoDB, BigQuery)
   - "rhombus" for conditional branches / decisions
   - "cloud" for external third parties, CDN, internet, VPC
   - "actor" for users, mobile clients, web browsers
4. Accurately assign labels to connecting arrows (e.g. "REST / HTTPS", "gRPC", "Pub/Sub", "Kafka Event", "SQL Query", "Yes", "No").
5. Use orthogonal connector styles with 90-degree elbows.

Output strictly valid JSON matching this schema:
{
  "title": "Diagram Title",
  "nodes": [
    {
      "id": "node_1",
      "label": "Component Label",
      "shape": "rectangle|rounded|cylinder|rhombus|cloud|actor",
      "x": 100,
      "y": 100,
      "width": 140,
      "height": 60,
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
Do NOT output markdown backticks or any conversational text.`;

export async function generateDiagramFromPrompt(
  prompt: string,
  theme: ThemePreset = 'modern-indigo',
  apiKey?: string
): Promise<{ diagram: ExtractedDiagram; xml: string }> {
  const DEFAULT_KEY = '';
  const envKey = (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } })?.env?.VITE_GEMINI_API_KEY || '';
  const keyToUse = apiKey || localStorage.getItem('GEMINI_API_KEY') || envKey || DEFAULT_KEY;

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
                  { text: `User Prompt: ${prompt}` },
                ],
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
        lastError = `HTTP ${response.status} from ${model}`;
        continue;
      }

      const data = await response.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) continue;

      const parsed: ExtractedDiagram = JSON.parse(raw);
      const xml = synthesizeDrawioXml(parsed, theme);
      return { diagram: parsed, xml };
    } catch (err) {
      lastError = String(err);
    }
  }

  throw new Error(`Failed to generate diagram from prompt: ${lastError}`);
}

