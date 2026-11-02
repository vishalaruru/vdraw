import { ExtractedDiagram, DiagramNode, DiagramEdge, ShapeKind } from '../types/diagram';

/**
 * Robust Draw.io XML parser that extracts complete nodes, edges, geometries, and styles.
 * Supports standard <mxCell>, wrapped <object>, and <UserObject> elements across all layer IDs.
 */
export function parseDrawioXmlToDiagram(xml: string): ExtractedDiagram {
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  if (!xml || (!xml.includes('<mxGraphModel') && !xml.includes('<diagram'))) {
    return { title: 'Empty Diagram', nodes: [], edges: [] };
  }

  // Extract diagram title if present
  const titleMatch = /<diagram\b[^>]*\bname="([^"]*)"/.exec(xml);
  const title = titleMatch ? titleMatch[1] : 'Architecture Diagram';

  // Identify root layers (e.g. id="0", or cells with parent="0" that have no geometry)
  const rootLayerIds = new Set<string>(['0']);
  const layerRegex = /<mxCell\b[^>]*\bid="([^"]+)"[^>]*\bparent="0"[^>]*\/?>/g;
  let layerMatch;
  while ((layerMatch = layerRegex.exec(xml)) !== null) {
    rootLayerIds.add(layerMatch[1]);
  }

  // Extract vertex cells (nodes)
  // Handles:
  // 1. <mxCell ... vertex="1" ...>
  // 2. <object ...><mxCell ... vertex="1" ...></object>
  // 3. <UserObject ...><mxCell ... vertex="1" ...></UserObject>
  const cellBlocks = extractCellBlocks(xml);

  const nodeLookup = new Map<string, DiagramNode>();

  for (const block of cellBlocks) {
    if (block.isVertex) {
      if (rootLayerIds.has(block.id)) continue;

      let cleanLabel = block.label
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#xa;/g, ' ')
        .replace(/<[^>]*>/g, '')
        .trim();

      // Determine shape archetype from style
      let shape: ShapeKind = 'rectangle';
      const s = block.style.toLowerCase();
      if (s.includes('shape=umlactor') || s.includes('actor')) shape = 'actor';
      else if (s.includes('shape=cloud') || s.includes('cloud')) shape = 'cloud';
      else if (s.includes('shape=cylinder3') || s.includes('cylinder')) shape = 'cylinder';
      else if (s.includes('rhombus') || s.includes('shape=rhombus')) shape = 'rhombus';
      else if (s.includes('rounded=1')) shape = 'rounded';
      else if (s.includes('shape=parallelogram')) shape = 'parallelogram';

      // Infer shape from label if style is generic
      const l = cleanLabel.toLowerCase();
      if (shape === 'rectangle') {
        if (l.includes('client') || l.includes('user') || l.includes('browser')) shape = 'actor';
        else if (l.includes('sdk') || l.includes('gateway')) shape = 'rounded';
        else if (l.includes('provider') || l.includes('stream') || l.includes('radar') || l.includes('gdp')) shape = 'cloud';
        else if (l.includes('db') || l.includes('database') || l.includes('postgres') || l.includes('redis')) shape = 'cylinder';
      }

      // Color extraction
      const fillMatch = /\bfillColor=([^;]+)/.exec(block.style);
      const strokeMatch = /\bstrokeColor=([^;]+)/.exec(block.style);
      const fontMatch = /\bfontColor=([^;]+)/.exec(block.style);

      const node: DiagramNode = {
        id: block.id,
        label: cleanLabel || `Component ${nodes.length + 1}`,
        shape,
        x: Math.round(block.x),
        y: Math.round(block.y),
        width: Math.round(Math.max(block.width || 140, 60)),
        height: Math.round(Math.max(block.height || 60, 40)),
        fillColor: fillMatch ? fillMatch[1] : undefined,
        strokeColor: strokeMatch ? strokeMatch[1] : undefined,
        fontColor: fontMatch ? fontMatch[1] : undefined,
      };

      nodes.push(node);
      nodeLookup.set(block.id, node);
    } else if (block.isEdge && block.source && block.target) {
      let cleanLabel = block.label
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#xa;/g, ' ')
        .replace(/<[^>]*>/g, '')
        .trim();

      let edgeStyle: 'orthogonal' | 'curved' | 'straight' = 'orthogonal';
      if (block.style.includes('curved=1')) edgeStyle = 'curved';
      else if (!block.style.includes('edgeStyle=orthogonalEdgeStyle')) edgeStyle = 'straight';

      edges.push({
        id: block.id,
        source: block.source,
        target: block.target,
        label: cleanLabel,
        style: edgeStyle,
      });
    }
  }

  return { title, nodes, edges };
}

interface ParsedRawBlock {
  id: string;
  isVertex: boolean;
  isEdge: boolean;
  source?: string;
  target?: string;
  label: string;
  style: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

function extractCellBlocks(xml: string): ParsedRawBlock[] {
  const blocks: ParsedRawBlock[] = [];

  // Match elements: <mxCell ...>, or <object ...><mxCell ...></object>, or <UserObject ...><mxCell ...></UserObject>
  const entityRegex = /<(mxCell|object|UserObject)\b([\s\S]*?)(?:<\/\1>|\/>)/g;
  let match;

  while ((match = entityRegex.exec(xml)) !== null) {
    const fullContent = match[0];

    // Find id
    const idMatch = /\bid="([^"]+)"/.exec(fullContent);
    if (!idMatch) continue;
    const id = idMatch[1];

    // Find vertex / edge indicator
    const isVertex = /\bvertex="1"/.test(fullContent);
    const isEdge = /\bedge="1"/.test(fullContent);
    if (!isVertex && !isEdge) continue;

    // Find label/value
    let label = '';
    const labelAttr = /\blabel="([^"]*)"/.exec(fullContent);
    const valueAttr = /\bvalue="([^"]*)"/.exec(fullContent);
    if (labelAttr) label = labelAttr[1];
    else if (valueAttr) label = valueAttr[1];

    // Find style
    let style = '';
    const styleAttr = /\bstyle="([^"]*)"/.exec(fullContent);
    if (styleAttr) style = styleAttr[1];

    // Source & Target for edges
    let source: string | undefined;
    let target: string | undefined;
    if (isEdge) {
      const sM = /\bsource="([^"]+)"/.exec(fullContent);
      const tM = /\btarget="([^"]+)"/.exec(fullContent);
      if (sM) source = sM[1];
      if (tM) target = tM[1];
    }

    // Geometry
    let x = 100;
    let y = 100;
    let width = 140;
    let height = 60;

    const geoMatch = /<mxGeometry\b([^>]*)\/?>/.exec(fullContent);
    if (geoMatch) {
      const gAttrs = geoMatch[1];
      const xM = /\bx="([^"]+)"/.exec(gAttrs);
      const yM = /\by="([^"]+)"/.exec(gAttrs);
      const wM = /\bwidth="([^"]+)"/.exec(gAttrs);
      const hM = /\bheight="([^"]+)"/.exec(gAttrs);
      if (xM) x = parseFloat(xM[1]);
      if (yM) y = parseFloat(yM[1]);
      if (wM) width = parseFloat(wM[1]);
      if (hM) height = parseFloat(hM[1]);
    }

    blocks.push({
      id,
      isVertex,
      isEdge,
      source,
      target,
      label,
      style,
      x,
      y,
      width,
      height,
    });
  }

  return blocks;
}
