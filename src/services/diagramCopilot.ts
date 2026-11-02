import { ExtractedDiagram, ThemePreset } from '../types/diagram';
import { synthesizeDrawioXml } from './diagramSynthesizer';

const COPILOT_INSTRUCTIONS = `You are an interactive AI Architecture Copilot for draw.io (Vdraw).
The user wants to iteratively modify or evolve their current diagram via natural language instructions
(e.g., "Add Redis cache between API Gateway and DB", "Put Cloudflare in front of the web client", "Remove legacy parser", "Add an alert SNS topic").

Rules:
1. Preserve all existing nodes and connections that the user did not ask to remove or change.
2. Incorporate the requested additions, removals, or layout modifications cleanly.
3. Compute sensible (x, y) coordinates for new elements so they integrate seamlessly without overlapping.
4. Ensure edges use orthogonal connection styles and logical arrow routing.

Return the updated complete diagram strictly as valid JSON:
{
  "title": "Diagram Title",
  "explanation": "Short 1-sentence summary of changes made",
  "nodes": [
    { "id": "node_id", "label": "Label", "shape": "rectangle|rounded|cylinder|rhombus|cloud|actor", "x": 100, "y": 100, "width": 150, "height": 65, "fillColor": "#EEF2FF", "strokeColor": "#6366F1" }
  ],
  "edges": [
    { "id": "edge_id", "source": "node_1", "target": "node_2", "label": "Label", "style": "orthogonal" }
  ]
}
Do NOT return markdown backticks or conversational filler.`;

export async function modifyDiagramWithCopilot(
  currentXml: string,
  userInstruction: string,
  theme: ThemePreset = 'modern-indigo',
  apiKey?: string
): Promise<{ diagram: ExtractedDiagram; xml: string; explanation: string }> {
  const envKey = (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } })?.env?.VITE_GEMINI_API_KEY || '';
  const storedKey = (typeof localStorage !== "undefined" ? localStorage.getItem("GEMINI_API_KEY") : "") || "";
  const cleanStored = storedKey.includes("AIzaSyBCdBG4Cu") ? "" : storedKey;
  const cleanPassed = (apiKey && !apiKey.includes("AIzaSyBCdBG4Cu")) ? apiKey : "";
  const keyToUse = cleanPassed || envKey || cleanStored;

  const candidateModels = [
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite',
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
                  { text: COPILOT_INSTRUCTIONS },
                  { text: `Current Diagram XML:\n${currentXml.slice(0, 15000)}\n\nUser Edit Instruction:\n${userInstruction}` },
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

      const parsed: ExtractedDiagram & { explanation?: string } = JSON.parse(raw);
      const xml = synthesizeDrawioXml(parsed, theme);
      return {
        diagram: parsed,
        xml,
        explanation: parsed.explanation || 'Updated diagram elements based on your instructions.',
      };
    } catch (err) {
      lastError = String(err);
    }
  }

  throw new Error(`Copilot modification failed: ${lastError}`);
}

