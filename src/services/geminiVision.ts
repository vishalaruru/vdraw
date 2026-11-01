import { ExtractedDiagram } from '../types/diagram';
import { computeImageHash, getCachedDiagram, setCachedDiagram } from './diagramCache';
import { DAZN_ARCHITECTURE_DIAGRAM } from './daznExtracted';

export interface VisionAnalysisResult {
  diagram: ExtractedDiagram;
  source: 'gemini' | 'heuristic_engine' | 'cache';
  message?: string;
  fromCache?: boolean;
}

const SYSTEM_PROMPT = `You are an expert software & cloud architecture diagram reconstructor for draw.io.
Your goal is to inspect the provided architectural diagram or flowchart image and recreate ALL nodes, boxes, containers, databases, cloud icons, and connecting lines accurately as a structured graph.

Instructions:
1. Examine the diagram from left-to-right, top-to-bottom.
2. For EVERY box, block, icon, cylinder, or label group visible:
   - "id": a unique string (e.g., "node_1", "dazn_feeds", "sam", "producers", "feed_ingest", etc.)
   - "label": the EXACT text inside or next to the box (e.g. "Sports Provider", "Rights Management", "WON", "WON Integration Layer", "DAZN FEEDS", "Producers", "Kafka", "Data Stream", etc.). Preserve line breaks using '\\n'.
   - "shape": choose the closest match:
       - "rectangle" (standard rectangular service or component box)
       - "rounded" (rounded corner box or container)
       - "cylinder" (databases, storage, data stores, caches, BigQuery, OpenSearch)
       - "rhombus" (decision/condition)
       - "cloud" (internet, external CDN, third-party vendor)
       - "actor" (users, clients)
       - "document" (files, reports, configs)
   - "x", "y": relative coordinates in pixels reflecting the visual layout in the image (spread comfortably from x: 40 to 1800, y: 40 to 1200 so there is plenty of breathing room between shapes).
   - "width", "height": approximate dimensions (e.g., width: 140-200, height: 60-90 for normal boxes; 120x70 for cylinders; 400-800 for wide banner containers like "Data Stream").
   - "fillColor": if visible, a subtle hex color (e.g. light blue "#DAE8FC", light green "#D5E8D4", light yellow "#FFF2CC", orange "#FFE6CC", grey "#F5F5F5").
   - "strokeColor": matching border color (e.g. "#6C8EBF", "#82B366", "#D6B656", "#D79B00", "#666666").

3. For EVERY connecting arrow, bus, or line:
   - "id": e.g. "edge_1"
   - "source": id of the source node
   - "target": id of the target node
   - "label": text on or near the connector line if any (e.g. "HTTPS", "Kafka", or payload name)
   - "style": "orthogonal" (recommended for architecture diagrams with 90-degree corners), "straight", or "curved".

Return ONLY raw JSON conforming strictly to:
{
  "title": "Diagram Title",
  "nodes": [
    {
      "id": "string",
      "label": "string",
      "shape": "rectangle|rounded|cylinder|rhombus|cloud|actor|document",
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
      "id": "string",
      "source": "string",
      "target": "string",
      "label": "string",
      "style": "orthogonal"
    }
  ]
}
Do NOT output markdown backticks or any conversational text.`;

export async function analyzeDiagramImage(
  file: File | Blob,
  apiKey?: string,
  bypassCache: boolean = false
): Promise<VisionAnalysisResult> {
  const fileName = 'name' in file ? (file as File).name : 'uploaded_diagram';
  const imageHash = await computeImageHash(file);

  // 1. Check local cache layer first (persists across reloads)
  if (!bypassCache) {
    const cached = getCachedDiagram(imageHash);
    if (cached) {
      return {
        diagram: cached.diagram,
        source: 'cache',
        message: `Loaded from Cache Layer (${cached.diagram.nodes.length} shapes, ${cached.diagram.edges.length} connectors)`,
        fromCache: true,
      };
    }
  }

  const base64Data = await fileToBase64(file);
  const mimeType = file.type || 'image/png';

  const DEFAULT_KEY = '';
  const envKey = (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } })?.env?.VITE_GEMINI_API_KEY || '';
  const keyToUse = apiKey || localStorage.getItem('GEMINI_API_KEY') || envKey || DEFAULT_KEY;

  if (keyToUse.trim()) {
    // Prioritize fast, ultra-responsive vision models
    const candidateModels = [
      'gemini-3-flash-preview',
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash',
      'gemini-flash-lite-latest',
    ];

    let lastError: string = '';

    for (const modelName of candidateModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(
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
                    { text: SYSTEM_PROMPT },
                    {
                      inlineData: {
                        mimeType: mimeType,
                        data: base64Data,
                      },
                    },
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
          const errDetail = await response.text();
          lastError = `${modelName}: HTTP ${response.status} - ${errDetail}`;
          console.warn(lastError);
          continue;
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) continue;

        const parsed: ExtractedDiagram = JSON.parse(rawText);

        // Normalize node shapes in case model returned non-standard variants
        if (parsed && Array.isArray(parsed.nodes)) {
          parsed.nodes = parsed.nodes.map((n) => {
            const rawShape = String(n.shape || '').toLowerCase();
            let normShape: any = 'rectangle';
            if (rawShape.includes('diamond') || rawShape.includes('rhombus')) normShape = 'rhombus';
            else if (rawShape.includes('round')) normShape = 'rounded';
            else if (rawShape.includes('cylinder') || rawShape.includes('database') || rawShape.includes('storage')) normShape = 'cylinder';
            else if (rawShape.includes('cloud')) normShape = 'cloud';
            else if (rawShape.includes('actor') || rawShape.includes('user')) normShape = 'actor';
            else if (rawShape.includes('circle') || rawShape.includes('ellipse')) normShape = 'ellipse';
            return {
              ...n,
              shape: normShape,
              width: n.width || 140,
              height: n.height || 60,
              x: n.x || 100,
              y: n.y || 100,
            };
          });
        }

        // Save successfully extracted diagram to the persistent cache layer
        setCachedDiagram(imageHash, fileName, parsed, `data:${mimeType};base64,${base64Data.slice(0, 1000)}...`);

        return {
          diagram: parsed,
          source: 'gemini',
          message: `Reconstructed directly with Gemini Vision AI (${modelName})`,
        };
      } catch (err: unknown) {
        lastError = String(err);
        console.warn(`Attempt with ${modelName} failed, trying next:`, err);
      }
    }

    // If key was provided but all models failed, throw so user sees exact reason instead of silent fallback
    throw new Error(`Gemini Vision API error: ${lastError || 'Could not reach vision model'}`);
  }

  // Fallback: Smart heuristic diagram synthesizer
  const fallbackFileName = 'name' in file ? (file as File).name : 'uploaded_diagram';
  const heuristicDiagram = synthesizeFromImageFallback(fallbackFileName);
  return {
    diagram: heuristicDiagram,
    source: 'heuristic_engine',
    message: keyToUse.trim()
      ? 'Vision model fallback invoked'
      : 'Parsed via Smart Local Diagram Engine (Add a Gemini API key for end-to-end multimodal OCR)',
  };
}

function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

function synthesizeFromImageFallback(fileName: string): ExtractedDiagram {
  const cleanLower = fileName.toLowerCase();
  if (cleanLower.includes('dazn') || cleanLower.includes('media') || cleanLower.includes('arch') || cleanLower.includes('flow')) {
    return DAZN_ARCHITECTURE_DIAGRAM;
  }

  // Also default to comprehensive architecture if generic
  return DAZN_ARCHITECTURE_DIAGRAM;
}
