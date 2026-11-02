import { ExtractedDiagram, ThemePreset } from '../types/diagram';
import { parseDrawioXmlToDiagram } from './diagramXmlParser';

export interface LayoutOptions {
  mode?:
    | 'smart-beautify'
    | 'distribute-horizontal'
    | 'distribute-vertical'
    | 'align-left'
    | 'align-center'
    | 'align-right'
    | 'align-top'
    | 'align-middle'
    | 'align-bottom'
    | 'flow-left-to-right'
    | 'flow-top-to-bottom';
  theme?: ThemePreset;
}

interface NodeCell {
  cell: Element;
  geo: Element;
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  isRailOrBanner: boolean;
  isTallBracket: boolean;
}

interface EdgeCell {
  cell: Element;
  id: string;
  source: string;
  target: string;
  label: string;
}

/**
 * Extracts and parses all vertex and edge elements from a Draw.io XML DOM document.
 */
function extractCellsFromDoc(doc: Document): { nodes: NodeCell[]; edges: EdgeCell[] } {
  const vertexElements = Array.from(doc.querySelectorAll('mxCell[vertex="1"]'));
  const nodes: NodeCell[] = [];

  for (const cell of vertexElements) {
    const id = cell.getAttribute('id') || cell.parentElement?.getAttribute('id') || '';
    if (id === '0' || id === '1') continue;

    let geo = cell.querySelector('mxGeometry');
    if (!geo) {
      geo = doc.createElement('mxGeometry');
      geo.setAttribute('as', 'geometry');
      cell.appendChild(geo);
    }

    const x = parseFloat(geo.getAttribute('x') || '100');
    const y = parseFloat(geo.getAttribute('y') || '100');
    const w = parseFloat(geo.getAttribute('width') || '140');
    const h = parseFloat(geo.getAttribute('height') || '60');

    const value = cell.getAttribute('value') || cell.getAttribute('label') || '';
    const cleanLabel = value.replace(/<[^>]*>/g, '').trim();

    // Identify wide banner / backbone bus (e.g. Dots Stream, Kafka bus)
    const isRailOrBanner = w >= 450 || /stream|bus|kafka|backbone/i.test(cleanLabel);
    // Identify tall vertical brackets (e.g. BFF, Gateway stack)
    const isTallBracket = h >= 400;

    nodes.push({ cell, geo, id, label: cleanLabel, x, y, w, h, isRailOrBanner, isTallBracket });
  }

  const edgeElements = Array.from(doc.querySelectorAll('mxCell[edge="1"]'));
  const edges: EdgeCell[] = [];

  for (const cell of edgeElements) {
    const id = cell.getAttribute('id') || '';
    const source = cell.getAttribute('source') || '';
    const target = cell.getAttribute('target') || '';
    const label = cell.getAttribute('value') || cell.getAttribute('label') || '';
    if (source && target) {
      edges.push({ cell, id, source, target, label });
    }

    // Clean stale manual waypoints (<Array as="points">) so the connector line doesn't detour through old dragged coordinates
    const geo = cell.querySelector('mxGeometry');
    const stalePoints = geo?.querySelector('Array[as="points"]');
    if (stalePoints) {
      stalePoints.remove();
    }

    // Standardize orthogonal connector routing with rounded 90-degree corners
    let style = cell.getAttribute('style') || '';
    if (!style.includes('edgeStyle=orthogonalEdgeStyle')) {
      style = `edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;${style}`;
      cell.setAttribute('style', style);
    }
  }

  return { nodes, edges };
}

/**
 * Commits updated node coordinates back to the DOM mxGeometry elements.
 */
function commitNodeGeometries(nodes: NodeCell[]) {
  for (const n of nodes) {
    n.geo.setAttribute('x', String(Math.round(n.x)));
    n.geo.setAttribute('y', String(Math.round(n.y)));
    n.geo.setAttribute('width', String(Math.round(n.w)));
    n.geo.setAttribute('height', String(Math.round(n.h)));
  }
}

/**
 * 1. SMART BEAUTIFY & DECONFLICT ENGINE:
 * Implements edge-aware peer re-anchoring, column clustering, vertical stack deconfliction,
 * column horizontal spacing, peer connector straightening, and wide backbone isolation.
 * GUARANTEE: Zero data loss. Preserves 100% of links and brings displaced nodes back to connected peers.
 */
function applySmartBeautify(nodes: NodeCell[], edges: EdgeCell[]) {
  const standardNodes = nodes.filter((n) => !n.isRailOrBanner && !n.isTallBracket);
  if (standardNodes.length === 0) return;

  // Step 0: Edge-Aware Peer Re-Anchoring
  // If a node was manually dragged far away from all the nodes it is linked to (e.g. MFL Digestor moved to far left),
  // bring it back adjacent to the peer it connects to, rather than letting it be absorbed into an unrelated column!
  for (const n of standardNodes) {
    // Find all connected edges (ignoring wide backbone bus like Dots Stream)
    const connectedEdges = edges.filter((e) => e.source === n.id || e.target === n.id);
    const peerIds = connectedEdges.map((e) => (e.source === n.id ? e.target : e.source));
    const peerNodes = standardNodes.filter((p) => peerIds.includes(p.id));

    if (peerNodes.length > 0) {
      const avgPeerX = peerNodes.reduce((sum, p) => sum + p.x, 0) / peerNodes.length;

      // If displaced by more than 280px from all its connected peers:
      if (Math.abs(n.x - avgPeerX) > 280) {
        const primaryPeer = peerNodes[0];
        const isSourceOfPeer = edges.some((e) => e.source === n.id && e.target === primaryPeer.id);

        if (isSourceOfPeer) {
          // Upstream feeder: place slightly to the left or above the peer
          n.x = Math.max(60, primaryPeer.x - (n.w + 60));
          n.y = Math.max(60, primaryPeer.y - (n.h + 30));
        } else {
          // Downstream receiver: place to the right of the peer
          n.x = primaryPeer.x + (primaryPeer.w + 60);
          n.y = primaryPeer.y;
        }
      }
    }
  }

  // Snap all nodes to 20px grid
  for (const n of standardNodes) {
    n.x = Math.round(n.x / 20) * 20;
    n.y = Math.round(n.y / 20) * 20;
    n.w = Math.round(Math.max(n.w, 70) / 10) * 10;
    n.h = Math.round(Math.max(n.h, 30) / 10) * 10;
  }

  // 1. Group nodes into Columns based on horizontal center proximity (|midX_a - midX_b| <= 60)
  const columns: NodeCell[][] = [];
  const visited = new Set<string>();

  // Sort nodes left to right to seed columns systematically
  const sortedByX = [...standardNodes].sort((a, b) => a.x + a.w / 2 - (b.x + b.w / 2));

  for (const seed of sortedByX) {
    if (visited.has(seed.id)) continue;
    const seedMidX = seed.x + seed.w / 2;
    const col: NodeCell[] = [];

    for (const other of sortedByX) {
      if (visited.has(other.id)) continue;
      const otherMidX = other.x + other.w / 2;
      if (Math.abs(otherMidX - seedMidX) <= 60) {
        col.push(other);
        visited.add(other.id);
      }
    }

    if (col.length > 0) {
      columns.push(col);
    }
  }

  // 2. Sort columns from left to right
  columns.sort((colA, colB) => {
    const avgA = colA.reduce((sum, n) => sum + n.x, 0) / colA.length;
    const avgB = colB.reduce((sum, n) => sum + n.x, 0) / colB.length;
    return avgA - avgB;
  });

  // 3. In each Column:
  // - Align left or center
  // - Sort top to bottom by Y
  // - Eliminate all vertical overlap with guaranteed spacing
  for (const col of columns) {
    const colX = Math.round(Math.min(...col.map((n) => n.x)) / 20) * 20;
    col.sort((a, b) => a.y - b.y);

    let currentY = Math.round(col[0].y / 20) * 20;
    for (let i = 0; i < col.length; i++) {
      const node = col[i];
      node.x = colX;

      // Spacing gap: compact (20px) for small rail buttons (h <= 45), 45px for standard microservices
      const gapY = node.h <= 45 ? 20 : 45;

      if (i > 0) {
        currentY = Math.max(currentY, Math.round(node.y / 20) * 20);
      }
      node.y = currentY;
      currentY += node.h + gapY;
    }
  }

  // 4. Ensure Columns do not overlap horizontally (minimum 80px gap between column boundaries)
  const MIN_COL_GAP_X = 80;
  for (let c = 1; c < columns.length; c++) {
    const prevCol = columns[c - 1];
    const currCol = columns[c];

    const prevColMaxRight = Math.max(...prevCol.map((n) => n.x + n.w));
    const currColMinLeft = Math.min(...currCol.map((n) => n.x));

    const requiredLeft = Math.round((prevColMaxRight + MIN_COL_GAP_X) / 20) * 20;
    if (currColMinLeft < requiredLeft) {
      const shiftX = requiredLeft - currColMinLeft;
      for (const n of currCol) {
        n.x += shiftX;
      }
    }
  }

  // 5. Straighten Peer Connector Lines:
  // If node A in Col K connects to node B in Col K+1 and vertical distance |dy| <= 35, align Y centers
  for (const edge of edges) {
    const sNode = standardNodes.find((n) => n.id === edge.source);
    const tNode = standardNodes.find((n) => n.id === edge.target);
    if (sNode && tNode) {
      const dy = Math.abs(sNode.y + sNode.h / 2 - (tNode.y + tNode.h / 2));
      if (dy > 0 && dy <= 35) {
        const targetCenterY = Math.round((sNode.y + sNode.h / 2) / 20) * 20;
        tNode.y = targetCenterY - Math.round(tNode.h / 2);
      }
    }
  }

  // 6. Global Bounding Box & Backbone Bus / Bracket Positioning
  const allStandardLeft = Math.min(...standardNodes.map((n) => n.x));
  const allStandardRight = Math.max(...standardNodes.map((n) => n.x + n.w));
  const allStandardMaxY = Math.max(...standardNodes.map((n) => n.y + n.h));
  const allStandardMinY = Math.min(...standardNodes.map((n) => n.y));

  // Position tall brackets (e.g. BFF)
  const tallBrackets = nodes.filter((n) => n.isTallBracket);
  tallBrackets.forEach((bracket, idx) => {
    bracket.x = Math.round((allStandardRight + 80 + idx * (bracket.w + 40)) / 20) * 20;
    bracket.y = Math.round(allStandardMinY / 20) * 20;
    bracket.h = Math.max(bracket.h, allStandardMaxY - allStandardMinY);
  });

  // Position wide backbones (e.g. Dots Stream) along the bottom
  const banners = nodes.filter((n) => n.isRailOrBanner);
  banners.forEach((banner, idx) => {
    banner.x = Math.round(allStandardLeft / 20) * 20;
    banner.y = Math.round((allStandardMaxY + 70 + idx * (banner.h + 30)) / 20) * 20;
    banner.w = Math.max(banner.w, allStandardRight - allStandardLeft + 120);
  });
}

/**
 * 2. DRAW.IO DISTRIBUTE ENGINE:
 * Distributes nodes with uniform equidistant spacing horizontally or vertically.
 * Reference: https://www.drawio.com/docs/manual/shapes/arrange-align-shapes/
 */
function applyDistribute(nodes: NodeCell[], direction: 'horizontal' | 'vertical') {
  const eligible = nodes.filter((n) => !n.isRailOrBanner && !n.isTallBracket);
  if (eligible.length < 3) return;

  if (direction === 'horizontal') {
    // Sort left to right
    eligible.sort((a, b) => a.x - b.x);
    const leftAnchor = eligible[0].x;
    const lastNode = eligible[eligible.length - 1];
    const rightAnchor = lastNode.x + lastNode.w;

    const totalNodeWidth = eligible.reduce((sum, n) => sum + n.w, 0);
    const totalSpan = rightAnchor - leftAnchor;
    let gap = (totalSpan - totalNodeWidth) / (eligible.length - 1);

    // If gap is too cramped or overlapping, enforce generous minimum 80px gap
    if (gap < 60) {
      gap = 80;
    }

    let currentX = leftAnchor;
    for (let i = 0; i < eligible.length; i++) {
      eligible[i].x = Math.round(currentX / 20) * 20;
      currentX += eligible[i].w + gap;
    }
  } else {
    // Sort top to bottom
    eligible.sort((a, b) => a.y - b.y);
    const topAnchor = eligible[0].y;
    const lastNode = eligible[eligible.length - 1];
    const bottomAnchor = lastNode.y + lastNode.h;

    const totalNodeHeight = eligible.reduce((sum, n) => sum + n.h, 0);
    const totalSpan = bottomAnchor - topAnchor;
    let gap = (totalSpan - totalNodeHeight) / (eligible.length - 1);

    // If gap is too cramped or overlapping, enforce minimum gap (25px for buttons, 45px for services)
    if (gap < 20) {
      gap = eligible.some((n) => n.h <= 45) ? 25 : 45;
    }

    let currentY = topAnchor;
    for (let i = 0; i < eligible.length; i++) {
      eligible[i].y = Math.round(currentY / 20) * 20;
      currentY += eligible[i].h + gap;
    }
  }
}

/**
 * 3. DRAW.IO ALIGN ENGINE:
 * Aligns shapes to left, center, right, top, middle, or bottom.
 * Reference: https://www.drawio.com/docs/manual/shapes/arrange-align-shapes/
 */
function applyAlign(
  nodes: NodeCell[],
  alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
) {
  const eligible = nodes.filter((n) => !n.isRailOrBanner && !n.isTallBracket);
  if (eligible.length < 2) return;

  const minX = Math.min(...eligible.map((n) => n.x));
  const maxX = Math.max(...eligible.map((n) => n.x + n.w));
  const midX = (minX + maxX) / 2;

  const minY = Math.min(...eligible.map((n) => n.y));
  const maxY = Math.max(...eligible.map((n) => n.y + n.h));
  const midY = (minY + maxY) / 2;

  for (const n of eligible) {
    switch (alignment) {
      case 'left':
        n.x = Math.round(minX / 20) * 20;
        break;
      case 'center':
        n.x = Math.round((midX - n.w / 2) / 20) * 20;
        break;
      case 'right':
        n.x = Math.round((maxX - n.w) / 20) * 20;
        break;
      case 'top':
        n.y = Math.round(minY / 20) * 20;
        break;
      case 'middle':
        n.y = Math.round((midY - n.h / 2) / 20) * 20;
        break;
      case 'bottom':
        n.y = Math.round((maxY - n.h) / 20) * 20;
        break;
    }
  }
}

/**
 * 4. DRAW.IO HIERARCHICAL FLOW LAYOUT ENGINE (DAG Sugiyama):
 * Automatically assigns nodes to hierarchical ranks based on edge directions
 * (Sources on left/top, processing services in middle, datastores/BFF on right).
 */
function applyHierarchicalFlow(
  nodes: NodeCell[],
  edges: EdgeCell[],
  orientation: 'left-to-right' | 'top-to-bottom'
) {
  const standardNodes = nodes.filter((n) => !n.isRailOrBanner && !n.isTallBracket);
  if (standardNodes.length === 0) return;

  // In-degree & Out-degree calculation
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const n of standardNodes) {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  }

  for (const e of edges) {
    if (inDegree.has(e.target) && inDegree.has(e.source)) {
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
      adj.get(e.source)?.push(e.target);
    }
  }

  // Assign ranks
  const ranks = new Map<string, number>();
  const queue: string[] = [];

  for (const n of standardNodes) {
    if (inDegree.get(n.id) === 0) {
      ranks.set(n.id, 0);
      queue.push(n.id);
    }
  }

  // Fallback if graph is cyclic
  if (queue.length === 0) {
    ranks.set(standardNodes[0].id, 0);
    queue.push(standardNodes[0].id);
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currRank = ranks.get(curr) || 0;
    const neighbors = adj.get(curr) || [];

    for (const nbr of neighbors) {
      const existingRank = ranks.get(nbr);
      if (existingRank === undefined || existingRank < currRank + 1) {
        ranks.set(nbr, currRank + 1);
        queue.push(nbr);
      }
    }
  }

  // Ensure all nodes have a rank
  for (const n of standardNodes) {
    if (!ranks.has(n.id)) ranks.set(n.id, 0);
  }

  const maxRank = Math.max(...Array.from(ranks.values()), 0);
  const rankGroups: NodeCell[][] = Array.from({ length: maxRank + 1 }, () => []);

  for (const n of standardNodes) {
    const r = ranks.get(n.id) || 0;
    rankGroups[r].push(n);
  }

  if (orientation === 'left-to-right') {
    let currentX = 60;
    for (const group of rankGroups) {
      if (group.length === 0) continue;
      const colWidth = Math.max(...group.map((n) => n.w));

      let currentY = 60;
      for (const node of group) {
        node.x = currentX;
        node.y = currentY;
        const gapY = node.h <= 45 ? 20 : 45;
        currentY += node.h + gapY;
      }

      currentX += colWidth + 100; // 100px generous column gap
    }
  } else {
    let currentY = 60;
    for (const group of rankGroups) {
      if (group.length === 0) continue;
      const rowHeight = Math.max(...group.map((n) => n.h));

      let currentX = 60;
      for (const node of group) {
        node.x = currentX;
        node.y = currentY;
        currentX += node.w + 80;
      }

      currentY += rowHeight + 80;
    }
  }

  // Position tall brackets and wide backbones
  const allRight = Math.max(...standardNodes.map((n) => n.x + n.w));
  const allMaxY = Math.max(...standardNodes.map((n) => n.y + n.h));
  const allMinY = Math.min(...standardNodes.map((n) => n.y));

  for (const bracket of nodes.filter((n) => n.isTallBracket)) {
    bracket.x = allRight + 80;
    bracket.y = allMinY;
    bracket.h = Math.max(bracket.h, allMaxY - allMinY);
  }

  for (const banner of nodes.filter((n) => n.isRailOrBanner)) {
    banner.x = 60;
    banner.y = allMaxY + 80;
    banner.w = Math.max(banner.w, allRight);
  }
}

/**
 * Universal Draw.io Layout & Beautifier Gateway.
 * GUARANTEE: Zero data loss. 100% of nodes, IDs, custom attributes, labels, and edges are preserved.
 */
export async function beautifyDiagramXml(
  currentXml: string,
  options?: LayoutOptions | ThemePreset,
  _apiKey?: string
): Promise<{ diagram: ExtractedDiagram; xml: string }> {
  if (!currentXml || !currentXml.includes('<mxGraphModel')) {
    const empty = parseDrawioXmlToDiagram(currentXml);
    return { diagram: empty, xml: currentXml };
  }

  const mode: LayoutOptions['mode'] =
    typeof options === 'object' && options?.mode ? options.mode : 'smart-beautify';

  if (typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(currentXml, 'text/xml');

      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        throw new Error('XML parsing error in beautifier');
      }

      const { nodes, edges } = extractCellsFromDoc(doc);
      if (nodes.length === 0) {
        const fallback = parseDrawioXmlToDiagram(currentXml);
        return { diagram: fallback, xml: currentXml };
      }

      switch (mode) {
        case 'distribute-horizontal':
          applyDistribute(nodes, 'horizontal');
          break;
        case 'distribute-vertical':
          applyDistribute(nodes, 'vertical');
          break;
        case 'align-left':
        case 'align-center':
        case 'align-right':
        case 'align-top':
        case 'align-middle':
        case 'align-bottom':
          applyAlign(nodes, mode.replace('align-', '') as any);
          break;
        case 'flow-left-to-right':
          applyHierarchicalFlow(nodes, edges, 'left-to-right');
          break;
        case 'flow-top-to-bottom':
          applyHierarchicalFlow(nodes, edges, 'top-to-bottom');
          break;
        case 'smart-beautify':
        default:
          applySmartBeautify(nodes, edges);
          break;
      }

      // Write back updated coordinates to XML
      commitNodeGeometries(nodes);

      const serializer = new XMLSerializer();
      const cleanedXml = serializer.serializeToString(doc);
      const parsedDiagram = parseDrawioXmlToDiagram(cleanedXml);

      return {
        diagram: parsedDiagram,
        xml: cleanedXml,
      };
    } catch (domErr) {
      console.warn('DOMParser beautifier failed, using fallback:', domErr);
    }
  }

  const parsed = parseDrawioXmlToDiagram(currentXml);
  return {
    diagram: parsed,
    xml: currentXml,
  };
}
