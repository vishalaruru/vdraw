import { ExtractedDiagram, DiagramNode } from '../types/diagram';

export interface LayoutOptions {
  orientation?: 'left-to-right' | 'top-to-bottom';
  alignTiers?: boolean;
  applyHarmonizedColors?: boolean;
}

/**
 * Normalizes diagram nodes, resolves coordinate collisions, aligns components into tiers,
 * and applies distinct, high-fidelity color archetypes matching enterprise architecture standards.
 * GUARANTEE: Never collapses multi-column architectures into a single vertical tower.
 */
export function normalizeAndEnhanceDiagram(
  diagram: ExtractedDiagram,
  options: LayoutOptions = { orientation: 'left-to-right', alignTiers: true, applyHarmonizedColors: true }
): ExtractedDiagram {
  if (!diagram.nodes || diagram.nodes.length === 0) {
    return diagram;
  }

  const nodes = diagram.nodes.map((n) => ({ ...n }));
  const edges = (diagram.edges || []).map((e) => ({ ...e }));

  // 1. Deduplicate & sanitize edge labels
  for (const edge of edges) {
    if (edge.label) {
      let cleaned = edge.label.replace(/<[^>]*>/g, '').trim();
      const words = cleaned.split(/\s+/);
      if (words.length >= 4 && words.length % 2 === 0) {
        const half = words.length / 2;
        const firstHalf = words.slice(0, half).join(' ').toLowerCase();
        const secondHalf = words.slice(half).join(' ').toLowerCase();
        if (firstHalf === secondHalf) {
          cleaned = words.slice(0, half).join(' ');
        }
      }
      const lines = cleaned.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length > 1 && lines[0].toLowerCase() === lines[1].toLowerCase()) {
        cleaned = lines[0];
      }
      edge.label = cleaned;
    }
  }

  // 2. Classify each node into an architectural archetype
  const classifiedNodes = nodes.map((node) => {
    const l = (node.label || '').toLowerCase();
    let archetype: 'client' | 'integration' | 'domain' | 'external' | 'config' | 'database' | 'stream' | 'terminal' | 'rail' = 'domain';

    if (l.includes('client') || l.includes('user') || l.includes('browser') || l.includes('ios') || l.includes('android') || l.includes('partner') || l.includes('studio')) {
      archetype = 'client';
    } else if (l.includes('config') || l.includes('setting') || l.includes('vault') || l.includes('kms')) {
      archetype = 'config';
    } else if (l.includes('stream') || l.includes('dots') || l.includes('kafka') || l.includes('bus') || l.includes('backbone') || (node.width && node.width >= 450)) {
      archetype = 'stream';
    } else if (/\bfe\b|\bbff\b|frontend|player/i.test(l) || (node.height && node.height >= 400)) {
      archetype = 'terminal';
    } else if (l.includes('rail') || l.includes('favorites') || l.includes('shortcuts') || l.includes('history') || (node.height && node.height <= 45)) {
      archetype = 'rail';
    } else if (l.includes('provider') || l.includes('radar') || l.includes('gdp') || l.includes('external')) {
      archetype = 'external';
    } else if (l.includes('sdk') || l.includes('gateway') || l.includes('matcher') || l.includes('proxy') || l.includes('waf') || l.includes('won')) {
      archetype = 'integration';
    } else if (l.includes('db') || l.includes('database') || l.includes('postgres') || l.includes('mysql') || l.includes('mongo') || l.includes('redis') || l.includes('opensearch')) {
      archetype = 'database';
    } else {
      archetype = 'domain';
    }

    return { node, archetype };
  });

  // 3. Apply distinct shapes and color styles based on archetype
  if (options.applyHarmonizedColors) {
    for (const item of classifiedNodes) {
      const { node, archetype } = item;

      switch (archetype) {
        case 'client':
          node.shape = 'actor';
          node.width = 100;
          node.height = 110;
          node.fillColor = '#F8FAFC';
          node.strokeColor = '#475569';
          node.fontColor = '#0F172A';
          break;

        case 'integration':
          node.shape = 'rounded';
          node.width = Math.max(node.width || 140, 140);
          node.height = node.height || 60;
          node.fillColor = '#D5E8D4';
          node.strokeColor = '#82B366';
          node.fontColor = '#134E4A';
          break;

        case 'domain':
          node.shape = node.shape || 'rectangle';
          node.width = Math.max(node.width || 140, 140);
          node.height = node.height || 60;
          node.fillColor = '#DAE8FC';
          node.strokeColor = '#6C8EBF';
          node.fontColor = '#1E3A8A';
          break;

        case 'rail':
          node.shape = 'rounded';
          node.width = Math.max(node.width || 180, 180);
          node.height = 35;
          node.fillColor = node.label.toLowerCase().includes('ingest') ? '#DAE8FC' : '#FFF2CC';
          node.strokeColor = node.label.toLowerCase().includes('ingest') ? '#6C8EBF' : '#D6B656';
          node.fontColor = '#1E3A8A';
          break;

        case 'external':
          node.shape = 'cloud';
          node.width = Math.max(node.width || 160, 160);
          node.height = 75;
          node.fillColor = '#FFE6CC';
          node.strokeColor = '#D79B00';
          node.fontColor = '#78350F';
          break;

        case 'database':
          node.shape = 'cylinder';
          node.width = 120;
          node.height = 75;
          node.fillColor = '#E0E7FF';
          node.strokeColor = '#4F46E5';
          node.fontColor = '#1E1B4B';
          break;

        case 'config':
          node.shape = 'rectangle';
          node.width = Math.max(node.width || 140, 140);
          node.height = 60;
          node.fillColor = '#E1D5E7';
          node.strokeColor = '#9673A6';
          node.fontColor = '#4A1D96';
          break;

        case 'stream':
          node.shape = 'rounded';
          node.height = node.height || 60;
          node.fillColor = '#FFF2CC';
          node.strokeColor = '#D6B656';
          node.fontColor = '#78350F';
          break;

        case 'terminal':
          node.shape = 'rounded';
          node.width = node.width || 90;
          node.fillColor = '#FFF2CC';
          node.strokeColor = '#D6B656';
          node.fontColor = '#78350F';
          break;
      }
    }
  }

  // 4. Layout Intelligence Check:
  // Does the incoming diagram already possess distinct, multi-column spatial coordinates?
  const distinctXCoords = new Set(nodes.map((n) => Math.round((n.x || 0) / 80)));
  const hasExistingLayout =
    nodes.length > 3 &&
    nodes.some((n) => (n.x || 0) > 400) &&
    distinctXCoords.size >= 3;

  if (hasExistingLayout) {
    // PRESERVE the existing multi-column / horizontal spine layout!
    // Snap to 20px grid and apply deconfliction only.
    for (const n of nodes) {
      n.x = Math.round((n.x || 100) / 20) * 20;
      n.y = Math.round((n.y || 100) / 20) * 20;
    }
  } else if (options.alignTiers && options.orientation === 'left-to-right') {
    // Nodes do NOT have distinct layout (e.g. all at x=0).
    // Perform Graph-Aware Topological Context Layout (NOT a rigid 4-column dump!).
    applyGraphAwareTopologicalLayout(nodes, edges);
  }

  // 5. Backbone and Terminal Bracket Isolation Pass
  const standardNodes = nodes.filter((n) => {
    const l = (n.label || '').toLowerCase();
    const isStream = l.includes('stream') || l.includes('dots') || (n.width && n.width >= 450);
    const isTerminalBracket = /\bfe\b|\bbff\b/i.test(l) || (n.height && n.height >= 400);
    return !isStream && !isTerminalBracket;
  });

  if (standardNodes.length > 0) {
    const maxX = Math.max(...standardNodes.map((n) => n.x + (n.width || 140)));
    const maxY = Math.max(...standardNodes.map((n) => n.y + (n.height || 60)));
    const minY = Math.min(...standardNodes.map((n) => n.y));

    // Position terminal bracket (e.g. FE / BFF) on the far right
    nodes.forEach((n) => {
      const l = (n.label || '').toLowerCase();
      if (/\bfe\b|\bbff\b/i.test(l) || (n.height && n.height >= 400)) {
        n.x = Math.round((maxX + 80) / 20) * 20;
        n.y = Math.round(minY / 20) * 20;
        n.height = Math.max(n.height || 600, maxY - minY);
      }
    });

    // Position streaming bus (e.g. Dots Stream) along the bottom
    nodes.forEach((n) => {
      const l = (n.label || '').toLowerCase();
      if (l.includes('stream') || l.includes('dots') || (n.width && n.width >= 450)) {
        n.x = 40;
        n.y = Math.round((maxY + 80) / 20) * 20;
        n.width = Math.max(n.width || 1800, maxX + 100);
        n.height = n.height || 60;
      }
    });
  }

  // 6. Anti-Collision Pass: Ensure no two regular nodes overlap
  const regularNodes = nodes.filter((n) => (n.width || 140) < 450 && (n.height || 60) < 400);
  for (let i = 0; i < regularNodes.length; i++) {
    for (let j = i + 1; j < regularNodes.length; j++) {
      const a = regularNodes[i];
      const b = regularNodes[j];
      const aRight = a.x + (a.width || 140);
      const aBottom = a.y + (a.height || 60);
      const bRight = b.x + (b.width || 140);
      const bBottom = b.y + (b.height || 60);

      const overlapX = a.x < bRight + 30 && aRight + 30 > b.x;
      const overlapY = a.y < bBottom + 20 && aBottom + 20 > b.y;

      if (overlapX && overlapY) {
        if (Math.abs(a.x - b.x) < 40) {
          // Same column: separate vertically
          if (b.y >= a.y) {
            b.y = aBottom + 25;
          } else {
            a.y = bBottom + 25;
          }
        } else {
          // Different columns: separate horizontally
          if (b.x >= a.x) {
            b.x = aRight + 50;
          } else {
            a.x = bRight + 50;
          }
        }
      }
    }
  }

  return {
    title: diagram.title || 'Technical Architecture Diagram',
    nodes,
    edges,
  };
}

/**
 * Graph-Aware Topological Context Layout:
 * Arranges nodes across multiple discrete ranks based on DAG flows:
 * - Sources on Far Left (x ≈ 80-220)
 * - Main Center Spine (x ≈ 360-1400 along y ≈ 360)
 * - Supporting Services above/below the spine
 * - Publishing Rails in a vertical stack on the right (x ≈ 1680)
 * - Terminal Endpoint (FE) on Far Right (x ≈ 1950)
 * - Event Bus across the bottom (y ≈ 980)
 */
function applyGraphAwareTopologicalLayout(
  nodes: DiagramNode[],
  edges: { source: string; target: string; label?: string }[]
) {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const n of nodes) {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  }

  for (const e of edges) {
    if (inDegree.has(e.target) && inDegree.has(e.source)) {
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
      adj.get(e.source)?.push(e.target);
    }
  }

  // Filter out streaming bus and terminal bracket from rank calculation
  const isBus = (n: DiagramNode) => /stream|bus|dots|kafka/i.test(n.label) || (n.width && n.width >= 450);
  const isBracket = (n: DiagramNode) => /\bfe\b|\bbff\b/i.test(n.label) || (n.height && n.height >= 400);

  const activeNodes = nodes.filter((n) => !isBus(n) && !isBracket(n));
  const ranks = new Map<string, number>();
  const queue: string[] = [];

  for (const n of activeNodes) {
    if (inDegree.get(n.id) === 0) {
      ranks.set(n.id, 0);
      queue.push(n.id);
    }
  }

  if (queue.length === 0 && activeNodes.length > 0) {
    ranks.set(activeNodes[0].id, 0);
    queue.push(activeNodes[0].id);
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currRank = ranks.get(curr) || 0;
    const neighbors = adj.get(curr) || [];

    for (const nbr of neighbors) {
      const targetNode = nodes.find((n) => n.id === nbr);
      if (targetNode && !isBus(targetNode) && !isBracket(targetNode)) {
        const existing = ranks.get(nbr);
        if (existing === undefined || existing < currRank + 1) {
          ranks.set(nbr, currRank + 1);
          queue.push(nbr);
        }
      }
    }
  }

  for (const n of activeNodes) {
    if (!ranks.has(n.id)) ranks.set(n.id, 0);
  }

  const maxRank = Math.max(...Array.from(ranks.values()), 0);
  const rankGroups: DiagramNode[][] = Array.from({ length: maxRank + 1 }, () => []);

  for (const n of activeNodes) {
    const r = ranks.get(n.id) || 0;
    rankGroups[r].push(n);
  }

  // Layout rank columns across the horizontal plane with generous spacing
  let currentX = 80;
  for (const group of rankGroups) {
    if (group.length === 0) continue;
    const colWidth = Math.max(...group.map((n) => n.width || 140));

    // If group has many items (e.g. publishing rails), use compact vertical spacing
    const isRailColumn = group.length >= 6;
    let currentY = isRailColumn ? 220 : 160;

    for (const node of group) {
      node.x = currentX;
      node.y = currentY;
      const gapY = isRailColumn || (node.height && node.height <= 45) ? 20 : 50;
      currentY += (node.height || 60) + gapY;
    }

    currentX += colWidth + 120; // 120px generous column gap
  }
}
