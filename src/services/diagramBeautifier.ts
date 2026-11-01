const BEAUTIFIER_INSTRUCTIONS = `You are a world-class graph layout optimizer and diagram beautifier for draw.io XML models.
Your task is to take an existing draw.io XML diagram and enhance its visual layout to look like a clean, publication-ready enterprise architecture:

CRITICAL ROUTING & LAYOUT RULES:
1. ARROWS MUST NEVER OVERLAP OR SLICE ACROSS BOXES:
   - Calculate proper tiers (horizontal or vertical stages).
   - Ensure a minimum gap of 80px vertically and 100px horizontally between adjacent nodes.
   - When a node has multiple incoming or outgoing connections, position it cleanly in line with its dependencies.
2. ALIGNMENT & SPACING:
   - Align nodes onto neat grid columns or rows.
   - Standardize box sizes (e.g. width: 150-180px, height: 60-70px).
3. PRESERVE COMPLETENESS:
   - Keep ALL node labels, names, IDs, and connection relationships intact.

Return the optimized diagram strictly as valid JSON:
{
  "title": "Cleaned & Aligned Diagram",
  "nodes": [
    { "id": "node_id", "label": "Label", "shape": "rectangle|rounded|cylinder|rhombus|cloud|actor", "x": 100, "y": 100, "width": 160, "height": 65, "fillColor": "#EEF2FF", "strokeColor": "#6366F1" }
  ],
  "edges": [
    { "id": "edge_id", "source": "node_1", "target": "node_2", "label": "Label", "style": "orthogonal" }
  ]
}
Do NOT return markdown backticks or conversational text.`;

import { ExtractedDiagram, ThemePreset } from '../types/diagram';
import { synthesizeDrawioXml } from './diagramSynthesizer';

export async function beautifyDiagramXml(
  currentXml: string,
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
                  { text: BEAUTIFIER_INSTRUCTIONS },
                  { text: `Current Diagram XML:\n${currentXml.slice(0, 15000)}` },
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
      const xml = synthesizeDrawioXml(parsed, theme);
      return { diagram: parsed, xml };
    } catch (err) {
      lastError = String(err);
    }
  }

  throw new Error(`Failed to beautify diagram: ${lastError}`);
}

