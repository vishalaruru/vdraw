import { ExtractedDiagram, DiagramNode, DiagramEdge, ShapeKind } from '../types/diagram';

/**
 * Robust Draw.io XML parser that extracts complete nodes, edges, geometries, and styles.
 */
export function parseDrawioXmlToDiagram(xml: string): ExtractedDiagram {
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];

  if (!xml || !xml.includes('<mxGraphModel')) {
    return { title: 'Empty Diagram', nodes: [], edges: [] };
  }

  // Extract diagram title if present
  const titleMatch = /<diagram\b[^>]*\bname="([^"]*)"/.exec(xml);
  const title = titleMatch ? titleMatch[1] : 'Architecture Diagram';

  // Extract vertex cells (nodes)
  // Matching <mxCell ... vertex="1" ...> optionally with self-closing or child mxGeometry
  const cellRegex = /<mxCell\b([^>]*\bvertex="1"[^>]*)>([\s\S]*?)<\/mxCell>|<mxCell\b([^>]*\bvertex="1"[^>]*)\/>/g;
  let match;
  const nodeLookup = new Map<string, DiagramNode>();

  while ((match = cellRegex.exec(xml)) !== null) {
    const attrs = match[1] || match[3] || '';
    const inner = match[2] || '';

    const idMatch = /\bid="([^"]+)"/.exec(attrs);
    if (!idMatch || idMatch[1] === '0' || idMatch[1] === '1') continue;
    const id = idMatch[1];

    // Parent check: ignore inner swimlane headers/table columns
    const parentMatch = /\bparent="([^"]+)"/.exec(attrs);
    if (parentMatch && parentMatch[1] !== '1' && parentMatch[1] !== '0') {
      // If parent is not root layer, skip inner cells
      continue;
    }

    const valueMatch = /\bvalue="([^"]*)"/.exec(attrs);
    const rawVal = valueMatch ? valueMatch[1] : '';
    const cleanLabel = rawVal
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#xa;/g, ' ')
      .replace(/<[^>]*>/g, '')
      .trim();

    const styleMatch = /\bstyle="([^"]*)"/.exec(attrs);
    const style = styleMatch ? styleMatch[1] : '';

    // Geometry extraction
    let x = 100;
    let y = 100;
    let width = 140;
    let height = 60;

    const geoMatch = /<mxGeometry\b([^>]*)\/?>/.exec(inner);
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

    // Determine shape archetype from style
    let shape: ShapeKind = 'rectangle';
    if (style.includes('shape=umlActor')) shape = 'actor';
    else if (style.includes('shape=cloud')) shape = 'cloud';
    else if (style.includes('shape=cylinder3')) shape = 'cylinder';
    else if (style.includes('rhombus')) shape = 'rhombus';
    else if (style.includes('rounded=1')) shape = 'rounded';
    else if (style.includes('shape=parallelogram')) shape = 'parallelogram';

    // Color extraction
    const fillMatch = /\bfillColor=([^;]+)/.exec(style);
    const strokeMatch = /\bstrokeColor=([^;]+)/.exec(style);
    const fontMatch = /\bfontColor=([^;]+)/.exec(style);

    const node: DiagramNode = {
      id,
      label: cleanLabel || `Component ${nodes.length + 1}`,
      shape,
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
      fillColor: fillMatch ? fillMatch[1] : undefined,
      strokeColor: strokeMatch ? strokeMatch[1] : undefined,
      fontColor: fontMatch ? fontMatch[1] : undefined,
    };

    nodes.push(node);
    nodeLookup.set(id, node);
  }

  // Extract edges
  const edgeRegex =
    /<mxCell\b([^>]*\bedge="1"[^>]*)>([\s\S]*?)<\/mxCell>|<mxCell\b([^>]*\bedge="1"[^>]*)\/>/g;
  while ((match = edgeRegex.exec(xml)) !== null) {
    const attrs = match[1] || match[3] || '';

    const idMatch = /\bid="([^"]+)"/.exec(attrs);
    const sourceMatch = /\bsource="([^"]+)"/.exec(attrs);
    const targetMatch = /\btarget="([^"]+)"/.exec(attrs);

    if (!sourceMatch || !targetMatch) continue;

    const valueMatch = /\bvalue="([^"]*)"/.exec(attrs);
    const rawVal = valueMatch ? valueMatch[1] : '';
    const cleanLabel = rawVal
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#xa;/g, ' ')
      .replace(/<[^>]*>/g, '')
      .trim();

    const styleMatch = /\bstyle="([^"]*)"/.exec(attrs);
    const style = styleMatch ? styleMatch[1] : '';
    let edgeStyle: 'orthogonal' | 'curved' | 'straight' = 'orthogonal';
    if (style.includes('curved=1')) edgeStyle = 'curved';
    else if (!style.includes('edgeStyle=orthogonalEdgeStyle')) edgeStyle = 'straight';

    edges.push({
      id: idMatch ? idMatch[1] : `edge_${edges.length + 1}`,
      source: sourceMatch[1],
      target: targetMatch[1],
      label: cleanLabel,
      style: edgeStyle,
    });
  }

  return { title, nodes, edges };
}
