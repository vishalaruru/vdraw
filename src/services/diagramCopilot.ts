import { ExtractedDiagram, ThemePreset, DiagramNode, DiagramEdge } from '../types/diagram';
import { synthesizeDrawioXml } from './diagramSynthesizer';
import { parseDrawioXmlToDiagram } from './diagramXmlParser';
import { normalizeAndEnhanceDiagram } from './diagramLayoutOptimizer';
import { beautifyDiagramXml } from './diagramBeautifier';
import { repairAndParseJson } from './jsonRepair';

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
  const trimmedInstr = userInstruction.trim();

  // Check for immediate local intent shortcuts (e.g. Align, Distribute, Beautify)
  const alignMatch = /align\s+(left|center|right|top|middle|bottom)/i.exec(trimmedInstr);
  if (alignMatch) {
    const alignMode = `align-${alignMatch[1].toLowerCase()}` as any;
    const beautified = await beautifyDiagramXml(currentXml, { mode: alignMode });
    return {
      diagram: beautified.diagram,
      xml: beautified.xml,
      explanation: `Aligned all components to ${alignMatch[1].toLowerCase()}.`,
    };
  }

  const distributeMatch = /distribute\s+(horizontally|vertically)/i.exec(trimmedInstr);
  if (distributeMatch) {
    const distMode = `distribute-${distributeMatch[1].toLowerCase() === 'horizontally' ? 'horizontal' : 'vertical'}` as any;
    const beautified = await beautifyDiagramXml(currentXml, { mode: distMode });
    return {
      diagram: beautified.diagram,
      xml: beautified.xml,
      explanation: `Equidistantly distributed shapes ${distributeMatch[1].toLowerCase()}.`,
    };
  }

  if (/^(?:auto-?align|beautify|clean\s+layout)$/i.test(trimmedInstr)) {
    const beautified = await beautifyDiagramXml(currentXml, { mode: 'smart-beautify' });
    return {
      diagram: beautified.diagram,
      xml: beautified.xml,
      explanation: 'Optimized diagram alignment and eliminated node overlaps.',
    };
  }

  // Check deterministic local intent first for fast & 100% reliable edits
  const localResult = applyLocalCopilotEdit(existingDiagram, trimmedInstr);
  if (localResult.handled) {
    const localXml = synthesizeDrawioXml(localResult.diagram, theme);
    return {
      diagram: localResult.diagram,
      xml: localXml,
      explanation: localResult.explanation,
    };
  }

  const envKey = (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } })?.env?.VITE_GEMINI_API_KEY || '';
  const storedKey = (typeof localStorage !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') : '') || '';
  const cleanStored = storedKey.includes('AIzaSyBCdBG4Cu') ? '' : storedKey;
  const cleanPassed = apiKey && !apiKey.includes('AIzaSyBCdBG4Cu') ? apiKey : '';
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

      const parsed: ExtractedDiagram & { explanation?: string } = repairAndParseJson<
        ExtractedDiagram & { explanation?: string }
      >(raw);

      // Verify no existing nodes were accidentally dropped when adding
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
    console.warn('Copilot AI models error, using fallback:', lastError);
  }

  // Fallback explanation if instruction was unrecognized
  const fallbackXml = synthesizeDrawioXml(localResult.diagram, theme);
  return {
    diagram: localResult.diagram,
    xml: fallbackXml,
    explanation: localResult.explanation,
  };
}


interface LocalEditResult {
  diagram: ExtractedDiagram;
  explanation: string;
  handled: boolean;
}

/**
 * Deterministic local execution engine supporting:
 * - Rename / Change Label: "rename [X] to [Y]", "relabel [X] as [Y]", "change name of [X] to [Y]"
 * - Move: "move [X] up/down/left/right [by N px]", "move [X] below/above/after/before [Y]"
 * - Remove / Delete: "remove [X]", "delete [X]"
 * - Replace: "replace [X] with [Y]", "swap [X] with [Y]"
 * - Connect: "connect [A] to [B] [via protocol]"
 * - Add / Insert: "add [X] below/above/after/before [Y]", "add [X] between [A] and [B]"
 */
function applyLocalCopilotEdit(
  diagram: ExtractedDiagram,
  instruction: string
): LocalEditResult {
  const nodes: DiagramNode[] = diagram.nodes.map((n) => ({ ...n }));
  const edges: DiagramEdge[] = diagram.edges.map((e) => ({ ...e }));
  const instr = instruction.trim();

  // Helper: Fuzzy find node by label
  const findNode = (name: string): DiagramNode | undefined => {
    const clean = name.toLowerCase().replace(/['"]/g, '').trim();
    if (!clean) return undefined;
    return (
      nodes.find((n) => n.label.toLowerCase() === clean) ||
      nodes.find((n) => n.label.toLowerCase().includes(clean)) ||
      nodes.find((n) => clean.includes(n.label.toLowerCase()))
    );
  };

  // 1. Partial/Underspecified Command Guards with Helpful Suggestions
  if (/^(?:rename|relabel)\s*(?:node|the\s+node)?$/i.test(instr)) {
    return {
      diagram,
      handled: true,
      explanation: "Please specify the node and new name (e.g. 'Rename Pre MEL Parser to Ingest Parser').",
    };
  }
  if (/^(?:move|shift)\s*(?:node|the\s+node)?$/i.test(instr)) {
    return {
      diagram,
      handled: true,
      explanation: "Please specify which node to move (e.g. 'Move Ingest below Producers' or 'Move DCMS down by 80px').",
    };
  }
  if (/^(?:delete|remove)\s*(?:node|the\s+node)?$/i.test(instr)) {
    return {
      diagram,
      handled: true,
      explanation: "Please specify which node to remove (e.g. 'Delete Redis' or 'Remove legacy parser').",
    };
  }
  if (/^(?:connect|wire|link)\s*(?:node|the\s+node)?$/i.test(instr)) {
    return {
      diagram,
      handled: true,
      explanation: "Please specify source and target (e.g. 'Connect Media Availability API to FIBA Mapper API').",
    };
  }
  if (/^(?:add|insert)\s*(?:node|the\s+node)?$/i.test(instr)) {
    return {
      diagram,
      handled: true,
      explanation: "Please specify the new node and position (e.g. 'Add Config below MFL Service').",
    };
  }

  // 2. INTENT: RENAME (e.g. "Rename Pre MEL Parser to Ingest Parser", "Change name of X to Y", "Relabel X as Y")
  const renameMatch = /(?:rename|relabel|change(?:\s+the)?\s+name\s+of|change|update\s+label\s+of)\s+(?:node\s+|the\s+node\s+)?['"]?(.+?)['"]?\s+(?:to|as|into)\s+['"]?(.+?)['"]?$/i.exec(instr);
  if (renameMatch) {
    const targetName = renameMatch[1].trim();
    const newName = renameMatch[2].trim();
    const node = findNode(targetName);

    if (node) {
      const oldName = node.label;
      node.label = newName;
      return {
        diagram: { ...diagram, nodes, edges },
        handled: true,
        explanation: `Renamed '${oldName}' to '${newName}'.`,
      };
    }
  }

  // 3. INTENT: MOVE RELATIVE (e.g. "Move Ingest below Producers", "Move X above Y", "Move X after Y")
  const moveRelativeMatch = /(?:move|shift|relocate)\s+(?:node\s+|the\s+node\s+)?['"]?(.+?)['"]?\s+(below|above|after|before|to\s+the\s+right\s+of|to\s+the\s+left\s+of)\s+['"]?(.+?)['"]?$/i.exec(instr);
  if (moveRelativeMatch) {
    const targetName = moveRelativeMatch[1].trim();
    const position = moveRelativeMatch[2].toLowerCase();
    const anchorName = moveRelativeMatch[3].trim();

    const node = findNode(targetName);
    const anchor = findNode(anchorName);

    if (node && anchor) {
      if (position.includes('below')) {
        node.x = anchor.x;
        node.y = anchor.y + anchor.height + 50;
      } else if (position.includes('above')) {
        node.x = anchor.x;
        node.y = Math.max(20, anchor.y - node.height - 50);
      } else if (position.includes('after') || position.includes('right')) {
        node.x = anchor.x + anchor.width + 80;
        node.y = anchor.y;
      } else if (position.includes('before') || position.includes('left')) {
        node.x = Math.max(20, anchor.x - node.width - 80);
        node.y = anchor.y;
      }
      return {
        diagram: { ...diagram, nodes, edges },
        handled: true,
        explanation: `Moved '${node.label}' ${position} '${anchor.label}'.`,
      };
    }
  }

  // 4. INTENT: MOVE DIRECTIONAL (e.g. "Move DCMS down", "Move X up by 80px")
  const moveDirectionMatch = /(?:move|shift)\s+(?:node\s+|the\s+node\s+)?['"]?(.+?)['"]?\s+(up|down|left|right)(?:\s+by\s+(\d+)(?:px)?)?$/i.exec(instr);
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
        handled: true,
        explanation: `Moved '${node.label}' ${direction} by ${amount}px.`,
      };
    }
  }

  // 5. INTENT: REMOVE / DELETE (e.g. "Remove legacy parser", "Delete Redis")
  const removeMatch = /(?:remove|delete|drop|cut)\s+(?:node\s+|the\s+node\s+)?['"]?(.+?)['"]?$/i.exec(instr);
  if (removeMatch) {
    const targetName = removeMatch[1].trim();
    const node = findNode(targetName);

    if (node) {
      const remainingNodes = nodes.filter((n) => n.id !== node.id);
      const remainingEdges = edges.filter((e) => e.source !== node.id && e.target !== node.id);
      return {
        diagram: { ...diagram, nodes: remainingNodes, edges: remainingEdges },
        handled: true,
        explanation: `Removed component '${node.label}' and its connections.`,
      };
    }
  }

  // 6. INTENT: REPLACE (e.g. "Replace MySQL with PostgreSQL")
  const replaceMatch = /(?:replace|swap)\s+(?:node\s+|the\s+node\s+)?['"]?(.+?)['"]?\s+with\s+['"]?(.+?)['"]?$/i.exec(instr);
  if (replaceMatch) {
    const oldName = replaceMatch[1].trim();
    const newName = replaceMatch[2].trim();
    const node = findNode(oldName);

    if (node) {
      const previous = node.label;
      node.label = newName;
      return {
        diagram: { ...diagram, nodes, edges },
        handled: true,
        explanation: `Replaced '${previous}' with '${newName}'.`,
      };
    }
  }

  // 7. INTENT: CONNECT (e.g. "Connect DCMS to Dots Stream", "Wire A to B via gRPC")
  const connectMatch = /(?:connect|wire|link)\s+(?:node\s+|the\s+node\s+)?['"]?(.+?)['"]?\s+to\s+['"]?(.+?)['"]?(?:\s+(?:via|with\s+label)\s+['"]?(.+?)['"]?)?$/i.exec(instr);
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
        handled: true,
        explanation: `Connected '${sNode.label}' ➔ '${tNode.label}' via "${edgeLabel}".`,
      };
    }
  }

  // 8. INTENT: ADD / INSERT (e.g. "Add Redis cache", "Insert Config below MFL")
  const addMatch = /(?:add|insert|create)\s+(?:a\s+|an\s+|node\s+)?['"]?(.+?)['"]?(?:\s+(below|above|after|before|to|in\s+front\s+of)\s+['"]?(.+?)['"]?)?$/i.exec(instr);
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
        y = anchorNode.y + anchorNode.height + 50;
      } else if (position === 'above') {
        x = anchorNode.x;
        y = Math.max(20, anchorNode.y - 110);
      } else if (position === 'before' || position === 'in front of') {
        x = Math.max(20, anchorNode.x - 220);
        y = anchorNode.y;
      } else {
        // after / to / default
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
      handled: true,
      explanation: `Added new component '${newNodeName}' without altering existing nodes.`,
    };
  }

  return {
    diagram,
    handled: false,
    explanation: `Could not interpret instruction "${instruction}". Try: "Rename [A] to [B]", "Move [A] down", "Connect [A] to [B]", "Delete [A]", "Align left", or "Distribute horizontally".`,
  };
}
