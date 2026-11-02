import { ExtractedDiagram, ThemePreset, DiagramNode, DiagramEdge } from '../types/diagram';
import { synthesizeDrawioXml } from './diagramSynthesizer';
import { parseDrawioXmlToDiagram } from './diagramXmlParser';
import { normalizeAndEnhanceDiagram } from './diagramLayoutOptimizer';

const COPILOT_SYSTEM_INSTRUCTIONS = `You are a Principal Architecture Copilot for draw.io (Vdraw).
You receive the CURRENT DIAGRAM state as a structured list of components (nodes) and connections (edges), plus a natural language user instruction.

Your task is to apply the user's requested edit with 100% precision while strictly obeying these rules:

### RULE 1: STRICT INTENT HANDLING (ANTI-ACCIDENTAL-RENAME)
- INTENT: ADD / INSERT NODE (e.g., "Add Redis cache", "Add node Config below MFL", "Put Cloudflare in front of Web Client"):
  * CRITICAL: YOU MUST PRESERVE EVERY SINGLE EXISTING NODE WITH ITS ORIGINAL ID, LABEL, AND SHAPE.
  * NEVER rename or overwrite an existing node when the user asks to add or insert something!
  * Generate a NEW node with a unique ID (e.g. "node_new_1") and the exact requested label.
  * Connect the new node logically as specified by the user.

- INTENT: RENAME (e.g., "Rename X to Y", "Change name of X to Y"):
  * ONLY alter a node's label if the user explicitly instructs to rename or change its name.

- INTENT: CONNECT / REWIRE (e.g., "Connect X to Y", "Wire A through B to C"):
  * Add the new edge(s) without altering any node labels.

- INTENT: DELETE / REMOVE (e.g., "Remove legacy service", "Delete Redis"):
  * Remove only the specified node and any edges touching it.

### RULE 2: SMART COORDINATES
- If adding a node "between A and B", calculate its (x, y) coordinates halfway between A and B.
- If adding a node "below A", place it at (A.x, A.y + A.height + 80).
- If adding a node "in front of A", place it at (A.x - 220, A.y).
- If adding a node "after B", place it at (B.x + 220, B.y).

### RULE 3: OUTPUT FORMAT
Output strictly valid JSON matching this schema:
{
  "explanation": "Clear, concise 1-sentence confirmation of the action taken (e.g. 'Added Redis Cache between API Gateway and PostgreSQL')",
  "nodes": [
    { "id": "id", "label": "Label", "shape": "rectangle|rounded|cylinder|rhombus|cloud|actor", "x": 100, "y": 100, "width": 150, "height": 65, "fillColor": "#EEF2FF", "strokeColor": "#6366F1" }
  ],
  "edges": [
    { "id": "edge_id", "source": "node_1", "target": "node_2", "label": "Protocol/Action", "style": "orthogonal" }
  ]
}
Do NOT return markdown backticks or conversational filler.`;

export async function modifyDiagramWithCopilot(
  currentXml: string,
  userInstruction: string,
  theme: ThemePreset = 'modern-indigo',
  apiKey?: string
): Promise<{ diagram: ExtractedDiagram; xml: string; explanation: string }> {
  // Parse existing diagram to provide structured context to the LLM
  const existingDiagram = parseDrawioXmlToDiagram(currentXml);

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

  // Clean structured context representation
  const contextPayload = {
    existingNodesCount: existingDiagram.nodes.length,
    existingNodes: existingDiagram.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      shape: n.shape,
      x: n.x,
      y: n.y,
      width: n.width,
      height: n.height,
    })),
    existingEdges: existingDiagram.edges.map((e) => {
      const sNode = existingDiagram.nodes.find((n) => n.id === e.source);
      const tNode = existingDiagram.nodes.find((n) => n.id === e.target);
      return {
        id: e.id,
        sourceId: e.source,
        sourceLabel: sNode?.label || e.source,
        targetId: e.target,
        targetLabel: tNode?.label || e.target,
        label: e.label || '',
      };
    }),
    userEditInstruction: userInstruction,
  };

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
                  { text: COPILOT_SYSTEM_INSTRUCTIONS },
                  { text: JSON.stringify(contextPayload, null, 2) },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
            signal: AbortSignal.timeout(12000),
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

      // Verify that no existing nodes were accidentally dropped if user asked to "add"
      const lowerInstr = userInstruction.toLowerCase();
      if ((lowerInstr.includes('add') || lowerInstr.includes('insert') || lowerInstr.includes('put')) && !lowerInstr.includes('remove') && !lowerInstr.includes('delete')) {
        // Ensure all previous nodes exist in the updated diagram
        const newLabels = new Set(parsed.nodes.map((n) => n.label.toLowerCase()));
        for (const oldNode of existingDiagram.nodes) {
          if (!newLabels.has(oldNode.label.toLowerCase())) {
            // Restore missing node
            parsed.nodes.push(oldNode);
          }
        }
      }

      const enhanced = normalizeAndEnhanceDiagram(parsed, {
        orientation: 'left-to-right',
        alignTiers: false, // preserve customized manual placement from copilot
        applyHarmonizedColors: true,
      });

      const xml = synthesizeDrawioXml(enhanced, theme);
      return {
        diagram: enhanced,
        xml,
        explanation: parsed.explanation || 'Applied modifications cleanly.',
      };
    } catch (err) {
      lastError = String(err);
    }
  }

  if (lastError) {
    console.warn('Copilot AI models failed, using local rule fallback:', lastError);
  }

  // Local rule-based fallback if offline
  const fallbackResult = applyLocalCopilotEdit(existingDiagram, userInstruction);
  const fallbackXml = synthesizeDrawioXml(fallbackResult.diagram, theme);
  return {
    diagram: fallbackResult.diagram,
    xml: fallbackXml,
    explanation: fallbackResult.explanation,
  };
}

/**
 * Deterministic local fallback for common editing patterns (Add node, connect).
 */
function applyLocalCopilotEdit(
  diagram: ExtractedDiagram,
  instruction: string
): { diagram: ExtractedDiagram; explanation: string } {
  const nodes: DiagramNode[] = [...diagram.nodes];
  const edges: DiagramEdge[] = [...diagram.edges];
  const instr = instruction.trim();

  // Pattern: "Add [Name]" or "Add [Name] below [Target]"
  const addMatch = /(?:add|insert|create)\s+(?:a\s+|an\s+)?([a-zA-Z0-9_\s-]+?)(?:\s+(?:below|after|before|to)\s+([a-zA-Z0-9_\s-]+))?$/i.exec(instr);
  if (addMatch) {
    const newNodeName = addMatch[1].trim();
    const targetAnchor = addMatch[2]?.trim();

    const anchorNode = targetAnchor
      ? nodes.find((n) => n.label.toLowerCase().includes(targetAnchor.toLowerCase()))
      : nodes[nodes.length - 1];

    const newNodeId = `node_${Date.now()}`;
    const x = anchorNode ? anchorNode.x : 400;
    const y = anchorNode ? anchorNode.y + 120 : 300;

    const newNode: DiagramNode = {
      id: newNodeId,
      label: newNodeName,
      shape: 'rectangle',
      x,
      y,
      width: 150,
      height: 65,
      fillColor: '#DAE8FC',
      strokeColor: '#6C8EBF',
    };

    nodes.push(newNode);

    if (anchorNode) {
      edges.push({
        id: `edge_${Date.now()}`,
        source: anchorNode.id,
        target: newNodeId,
        label: 'standard communication',
        style: 'orthogonal',
      });
    }

    return {
      diagram: { ...diagram, nodes, edges },
      explanation: `Added new component '${newNodeName}' without altering existing nodes.`,
    };
  }

  return {
    diagram,
    explanation: 'Unable to parse instruction. Please specify e.g. "Add Redis cache below API Gateway".',
  };
}
