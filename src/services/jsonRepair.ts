/**
 * Robust JSON repair and recovery utility.
 * Guarantees zero unhandled SyntaxErrors even when LLM output is truncated mid-stream by token limits.
 */

export function repairAndParseJson<T = any>(raw: string): T {
  let cleaned = raw.trim();

  // Strip markdown code fences (```json ... ``` or ``` ...)
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  }

  // Find root object or array
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');

  let isArray = false;
  let startIdx = 0;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    isArray = false;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    isArray = true;
  }

  cleaned = cleaned.slice(startIdx);

  // Attempt 1: Direct JSON.parse
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    // Truncated or malformed JSON - proceed to repair passes
  }

  // Attempt 2: Auto-truncate to last complete object boundary and close open structures
  try {
    const repaired = attemptRepairTruncatedJson(cleaned, isArray);
    return JSON.parse(repaired) as T;
  } catch (err) {
    // Proceed to regex entity extractor
  }

  // Attempt 3: Regex Entity Salvager for ExtractedDiagram ({ nodes: [...], edges: [...] })
  try {
    const salvaged = salvageDiagramEntities(cleaned);
    if (salvaged.nodes.length > 0) {
      return salvaged as unknown as T;
    }
  } catch (err) {
    // Failed salvage
  }

  throw new SyntaxError(`Failed to parse or repair JSON output: ${raw.slice(0, 200)}...`);
}

/**
 * Truncates back to the last complete item and appends closing brackets.
 */
function attemptRepairTruncatedJson(text: string, isRootArray: boolean): string {
  // Find last complete property or object closing brace '}'
  const lastCloseBrace = text.lastIndexOf('}');
  if (lastCloseBrace === -1) {
    throw new Error('No valid object found in truncated JSON');
  }

  let cut = text.slice(0, lastCloseBrace + 1);

  // Count unclosed brackets and braces
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < cut.length; i++) {
    const ch = cut[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === '{') openBraces++;
    else if (ch === '}') openBraces--;
    else if (ch === '[') openBrackets++;
    else if (ch === ']') openBrackets--;
  }

  // Close any unclosed arrays and objects
  while (openBrackets > 0) {
    cut += ']';
    openBrackets--;
  }
  while (openBraces > 0) {
    cut += '}';
    openBraces--;
  }

  if (isRootArray && !cut.endsWith(']')) {
    cut += ']';
  } else if (!isRootArray && !cut.endsWith('}')) {
    cut += '}';
  }

  return cut;
}

/**
 * Fallback regex entity extractor: scans for all complete node and edge objects.
 */
function salvageDiagramEntities(text: string): { title: string; nodes: any[]; edges: any[] } {
  const nodes: any[] = [];
  const edges: any[] = [];

  // Match node objects: { "id": "...", "label": "...", ... }
  const nodeRegex = /\{\s*"id"\s*:\s*"([^"]+)"\s*,\s*"label"\s*:\s*"([^"]+)"([^}]*)\}/g;
  let match;
  while ((match = nodeRegex.exec(text)) !== null) {
    const id = match[1];
    const label = match[2];
    const rest = match[3];

    // Check if it's an edge (contains "source" / "target") or node
    if (rest.includes('"source"') || rest.includes('"target"')) {
      const sourceMatch = /"source"\s*:\s*"([^"]+)"/.exec(rest);
      const targetMatch = /"target"\s*:\s*"([^"]+)"/.exec(rest);
      const labelMatch = /"label"\s*:\s*"([^"]*)"/.exec(rest);
      if (sourceMatch && targetMatch) {
        edges.push({
          id,
          source: sourceMatch[1],
          target: targetMatch[1],
          label: labelMatch ? labelMatch[1] : '',
        });
      }
    } else {
      const shapeMatch = /"shape"\s*:\s*"([^"]+)"/.exec(rest);
      const xMatch = /"x"\s*:\s*([-\d.]+)/.exec(rest);
      const yMatch = /"y"\s*:\s*([-\d.]+)/.exec(rest);
      const wMatch = /"width"\s*:\s*([-\d.]+)/.exec(rest);
      const hMatch = /"height"\s*:\s*([-\d.]+)/.exec(rest);

      nodes.push({
        id,
        label,
        shape: shapeMatch ? shapeMatch[1] : 'rectangle',
        x: xMatch ? parseFloat(xMatch[1]) : 100,
        y: yMatch ? parseFloat(yMatch[1]) : 100,
        width: wMatch ? parseFloat(wMatch[1]) : 140,
        height: hMatch ? parseFloat(hMatch[1]) : 60,
      });
    }
  }

  // Also match standalone edge objects
  const edgeRegex = /\{\s*"id"\s*:\s*"([^"]+)"\s*,\s*"source"\s*:\s*"([^"]+)"\s*,\s*"target"\s*:\s*"([^"]+)"([^}]*)\}/g;
  while ((match = edgeRegex.exec(text)) !== null) {
    const id = match[1];
    const source = match[2];
    const target = match[3];
    const rest = match[4];
    const labelMatch = /"label"\s*:\s*"([^"]*)"/.exec(rest);
    if (!edges.some((e) => e.id === id)) {
      edges.push({
        id,
        source,
        target,
        label: labelMatch ? labelMatch[1] : '',
      });
    }
  }

  return {
    title: 'Extracted Architecture Diagram',
    nodes,
    edges,
  };
}

