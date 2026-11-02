import { ExtractedDiagram, ThemePreset, DiagramNode, DiagramEdge } from '../types/diagram';
import { synthesizeDrawioXml } from './diagramSynthesizer';
import { parseDrawioXmlToDiagram } from './diagramXmlParser';
import { normalizeAndEnhanceDiagram } from './diagramLayoutOptimizer';

const COPILOT_SYSTEM_INSTRUCTIONS = `You are a Principal Architecture Copilot for draw.io (Vdraw).
You receive the CURRENT DIAGRAM state as a structured list of components (nodes) and connections (edges), plus a natural language user instruction.

Your task is to apply the user's requested edit with 100% precision while strictly obeying these rules:

### RULE 1: STRICT INTENT HANDLING (ANTI-ACCIDENTAL-RENAME & FULL ACTION SUITE)
- INTENT: RENAME (e.g., "Rename Pre MEL Parser to Ingest Parser", "Change name of X to Y", "Relabel X as Y"):
  * Find the specific node matching the user's request.
  * Update ONLY its label to the new requested name.
  * Keep its ID, coordinates, shape, and all connected edges completely intact.
  * Do NOT rename or alter any other node!

- INTENT: MOVE (e.g., "Move DCMS down", "Move X up by 80px", "Move Ingest below Producers"):
  * Update only the (x, y) coordinates of the target node.
  * If moving relative to another node (e.g. "below Y"), place it at (Y.x, Y.y + Y.height + 60).
  * If moving up/down/left/right, adjust x or y by 60-100px.

- INTENT: REMOVE / DELETE (e.g., "Remove legacy parser", "Delete Redis"):
  * Remove only the specified node and any edges touching it.
  * Keep all other nodes and edges untouched.

- INTENT: REPLACE / SWAP (e.g., "Replace MySQL with PostgreSQL"):
  * Update the label and archetype of the specified node. Keep its position and connected edges intact.

- INTENT: CONNECT (e.g., "Connect DCMS to Dots Stream", "Wire A to B via gRPC"):
  * Add a new directed edge between source and target without modifying existing node labels.

- INTENT: ADD / INSERT NODE (e.g., "Add Redis cache", "Put Cloudflare in front of Web Client"):
  * YOU MUST PRESERVE EVERY SINGLE EXISTING NODE WITH ITS ORIGINAL ID, LABEL, AND SHAPE.
  * Generate a NEW node with a unique ID (e.g. "node_new_1") and the exact requested label.
  * Position it logically and add the necessary connecting edge.

### RULE 2: OUTPUT FORMAT
Output strictly valid JSON matching this schema:
{
  "explanation": "Clear, concise 1-sentence confirmation of the action taken (e.g. 'Renamed Pre MEL Parser to Ingest Parser')",
  "nodes": [
    { "id": "id", "label": "Label", "shape": "rectangle|rounded|cylinder|rhombus|cloud|actor", "x": 100, "y": 100, "width": 150, "height": 65, "fillColor": "#EEF2FF", "strokeColor": "#6366F1" }
  ],
  "edges": [
    { "id": "edge_id", "source": "node_1", "target": "node_2", "label": "Protocol/Action", "style": "orthogonal" }
  ]
}
Do NOT return markdown backticks or conversational filler. Output only raw JSON.`;

export async function modifyDiagramWithCopilot(
  currentXml: string,
  userInstruction: string,
  theme: ThemePreset = 'modern-indigo',
  apiKey?: string
): Promise<{ diagram: ExtractedDiagram; xml: string; explanation: string }> {
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
              maxOutputTokens: 8192,
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

      const cleanedJson = extractCleanJson(raw);
      const parsed: ExtractedDiagram & { explanation?: string } = JSON.parse(cleanedJson);

      // Sanity check: if user asked to add, verify no existing nodes were dropped
      const lowerInstr = userInstruction.toLowerCase();
      if ((lowerInstr.includes('add') || lowerInstr.includes('insert')) && !lowerInstr.includes('remove') && !lowerInstr.includes('delete')) {
        const newLabels = new Set(parsed.nodes.map((n) => n.label.toLowerCase()));
        for (const oldNode of existingDiagram.nodes) {
          if (!newLabels.has(oldNode.label.toLowerCase())) {
            parsed.nodes.push(oldNode);
          }
        }
      }

      const enhanced = normalizeAndEnhanceDiagram(parsed, {
        orientation: 'left-to-right',
        alignTiers: false,
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
    console.warn('Copilot AI models error, using deterministic local engine:', lastError);
  }

  // Deterministic local engine: handles Rename, Move, Remove, Replace, Connect, Add
  const fallbackResult = applyLocalCopilotEdit(existingDiagram, userInstruction);
  const fallbackXml = synthesizeDrawioXml(fallbackResult.diagram, theme);
  return {
    diagram: fallbackResult.diagram,
    xml: fallbackXml,
    explanation: fallbackResult.explanation,
  };
}

/**
 * Strips markdown code fences (```json ... ```) and extracts valid JSON block.
 */
function extractCleanJson(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

/**
 * Deterministic local execution engine supporting:
 * - Rename / Change Label: "rename [X] to [Y]"
 * - Move: "move [X] up/down/left/right", "move [X] below [Y]"
 * - Remove / Delete: "remove [X]", "delete [X]"
 * - Replace: "replace [X] with [Y]"
 * - Connect: "connect [A] to [B]"
 * - Add / Insert: "add [X] below [Y]"
 */
function applyLocalCopilotEdit(
  diagram: ExtractedDiagram,
  instruction: string
): { diagram: ExtractedDiagram; explanation: string } {
  const nodes: DiagramNode[] = diagram.nodes.map((n) => ({ ...n }));
  const edges: DiagramEdge[] = diagram.edges.map((e) => ({ ...e }));
  const instr = instruction.trim();

  // Helper: Fuzzy find node by label
  const findNode = (name: string): DiagramNode | undefined => {
    const clean = name.toLowerCase().replace(/['"]/g, '').trim();
    return (
      nodes.find((n) => n.label.toLowerCase() === clean) ||
      nodes.find((n) => n.label.toLowerCase().includes(clean)) ||
      nodes.find((n) => clean.includes(n.label.toLowerCase()))
    );
  };

  // 1. INTENT: RENAME (e.g. "Rename Pre MEL Parser to Ingest Parser", "Change name of X to Y")
  const renameMatch = /(?:rename|relabel|change\s+name\s+of)\s+(?:node\s+)?['"]?(.+?)['"]?\s+to\s+['"]?(.+?)['"]?$/i.exec(instr);
  if (renameMatch) {
    const targetName = renameMatch[1].trim();
    const newName = renameMatch[2].trim();
    const node = findNode(targetName);

    if (node) {
      const oldName = node.label;
      node.label = newName;
      return {
        diagram: { ...diagram, nodes, edges },
        explanation: `Renamed '${oldName}' to '${newName}'.`,
      };
    }
  }

  // 2. INTENT: MOVE (e.g. "Move DCMS down", "Move X up by 80px", "Move Ingest below Producers")
  const moveRelativeMatch = /move\s+(?:node\s+)?['"]?(.+?)['"]?\s+(below|above|after|before)\s+['"]?(.+?)['"]?$/i.exec(instr);
  if (moveRelativeMatch) {
    const targetName = moveRelativeMatch[1].trim();
    const position = moveRelativeMatch[2].toLowerCase();
    const anchorName = moveRelativeMatch[3].trim();

    const node = findNode(targetName);
    const anchor = findNode(anchorName);

    if (node && anchor) {
      if (position === 'below') {
        node.x = anchor.x;
        node.y = anchor.y + anchor.height + 60;
      } else if (position === 'above') {
        node.x = anchor.x;
        node.y = Math.max(20, anchor.y - node.height - 60);
      } else if (position === 'after') {
        node.x = anchor.x + anchor.width + 80;
        node.y = anchor.y;
      } else if (position === 'before') {
        node.x = Math.max(20, anchor.x - node.width - 80);
        node.y = anchor.y;
      }
      return {
        diagram: { ...diagram, nodes, edges },
        explanation: `Moved '${node.label}' ${position} '${anchor.label}'.`,
      };
    }
  }

  const moveDirectionMatch = /move\s+(?:node\s+)?['"]?(.+?)['"]?\s+(up|down|left|right)(?:\s+by\s+(\d+)(?:px)?)?$/i.exec(instr);
  if (moveDirectionMatch) {
    const targetName = moveDirectionMatch[1].trim();
    const direction = moveDirectionMatch[2].toLowerCase();
    const amount = moveDirectionMatch[3] ? parseInt(moveDirectionMatch[3], 10) : 80;

    const node = findNode(targetName);
    if (node) {
      if (direction === 'up') node.y = Math.max(20, node.y - amount);
      else if (direction === 'down') node.y += amount;
      else if (direction === 'left') node.x = Math.max(20, node.x - amount);
      else if (direction === 'right') node.x += amount;

      return {
        diagram: { ...diagram, nodes, edges },
        explanation: `Moved '${node.label}' ${direction} by ${amount}px.`,
      };
    }
  }

  // 3. INTENT: REMOVE / DELETE (e.g. "Remove legacy parser", "Delete Redis")
  const removeMatch = /(?:remove|delete|drop|cut)\s+(?:node\s+)?['"]?(.+?)['"]?$/i.exec(instr);
  if (removeMatch) {
    const targetName = removeMatch[1].trim();
    const node = findNode(targetName);

    if (node) {
      const remainingNodes = nodes.filter((n) => n.id !== node.id);
      const remainingEdges = edges.filter((e) => e.source !== node.id && e.target !== node.id);
      return {
        diagram: { ...diagram, nodes: remainingNodes, edges: remainingEdges },
        explanation: `Removed component '${node.label}' and its connections.`,
      };
    }
  }

  // 4. INTENT: REPLACE (e.g. "Replace MySQL with PostgreSQL")
  const replaceMatch = /replace\s+(?:node\s+)?['"]?(.+?)['"]?\s+with\s+['"]?(.+?)['"]?$/i.exec(instr);
  if (replaceMatch) {
    const oldName = replaceMatch[1].trim();
    const newName = replaceMatch[2].trim();
    const node = findNode(oldName);

    if (node) {
      const previous = node.label;
      node.label = newName;
      return {
        diagram: { ...diagram, nodes, edges },
        explanation: `Replaced '${previous}' with '${newName}'.`,
      };
    }
  }

  // 5. INTENT: CONNECT (e.g. "Connect DCMS to Dots Stream", "Wire A to B via gRPC")
  const connectMatch = /(?:connect|wire|link)\s+(?:node\s+)?['"]?(.+?)['"]?\s+to\s+['"]?(.+?)['"]?(?:\s+via\s+['"]?(.+?)['"]?)?$/i.exec(instr);
  if (connectMatch) {
    const sName = connectMatch[1].trim();
    const tName = connectMatch[2].trim();
    const edgeLabel = connectMatch[3]?.trim() || 'standard communication';

    const sNode = findNode(sName);
    const tNode = findNode(tName);

    if (sNode && tNode) {
      edges.push({
        id: `edge_${Date.now()}`,
        source: sNode.id,
        target: tNode.id,
        label: edgeLabel,
        style: 'orthogonal',
      });

      return {
        diagram: { ...diagram, nodes, edges },
        explanation: `Connected '${sNode.label}' ➔ '${tNode.label}' via "${edgeLabel}".`,
      };
    }
  }

  // 6. INTENT: ADD / INSERT (e.g. "Add Redis cache", "Insert Config below MFL")
  const addMatch = /(?:add|insert|create)\s+(?:a\s+|an\s+)?['"]?(.+?)['"]?(?:\s+(below|above|after|before|to)\s+['"]?(.+?)['"]?)?$/i.exec(instr);
  if (addMatch) {
    const newNodeName = addMatch[1].trim();
    const position = addMatch[2]?.toLowerCase();
    const targetAnchorName = addMatch[3]?.trim();

    const anchorNode = targetAnchorName ? findNode(targetAnchorName) : nodes[nodes.length - 1];
    const newNodeId = `node_${Date.now()}`;

    let x = 400;
    let y = 300;

    if (anchorNode) {
      if (position === 'below') {
        x = anchorNode.x;
        y = anchorNode.y + anchorNode.height + 60;
      } else if (position === 'above') {
        x = anchorNode.x;
        y = Math.max(20, anchorNode.y - 120);
      } else if (position === 'before') {
        x = Math.max(20, anchorNode.x - 220);
        y = anchorNode.y;
      } else {
        // after / default
        x = anchorNode.x + anchorNode.width + 80;
        y = anchorNode.y;
      }
    }

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
    explanation: `Could not interpret instruction "${instruction}". Try: "Rename [A] to [B]", "Move [A] up/down", "Connect [A] to [B]", "Delete [A]", or "Add [A]".`,
  };
}
