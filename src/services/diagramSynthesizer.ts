import { ExtractedDiagram, ThemePreset, ShapeKind } from '../types/diagram';

export const THEME_PALETTES: Record<
  ThemePreset,
  {
    name: string;
    defaultFill: string;
    defaultStroke: string;
    defaultFont: string;
    decisionFill: string;
    decisionStroke: string;
    dbFill: string;
    dbStroke: string;
    edgeStroke: string;
    edgeFont: string;
  }
> = {
  'modern-indigo': {
    name: 'Modern Indigo (Tech/Cloud)',
    defaultFill: '#EEF2FF',
    defaultStroke: '#6366F1',
    defaultFont: '#1E1B4B',
    decisionFill: '#FEF3C7',
    decisionStroke: '#F59E0B',
    dbFill: '#E0E7FF',
    dbStroke: '#4F46E5',
    edgeStroke: '#64748B',
    edgeFont: '#0F172A',
  },
  'classic-drawio': {
    name: 'Classic draw.io',
    defaultFill: '#DAE8FC',
    defaultStroke: '#6C8EBF',
    defaultFont: '#000000',
    decisionFill: '#FFF2CC',
    decisionStroke: '#D6B656',
    dbFill: '#D5E8D4',
    dbStroke: '#82B366',
    edgeStroke: '#666666',
    edgeFont: '#000000',
  },
  'emerald-nature': {
    name: 'Emerald Mint',
    defaultFill: '#D1FAE5',
    defaultStroke: '#10B981',
    defaultFont: '#064E3B',
    decisionFill: '#FEF08A',
    decisionStroke: '#EAB308',
    dbFill: '#CCFBF1',
    dbStroke: '#14B8A6',
    edgeStroke: '#0F766E',
    edgeFont: '#042F2E',
  },
  'amber-warm': {
    name: 'Sunset Coral',
    defaultFill: '#FFEDD5',
    defaultStroke: '#F97316',
    defaultFont: '#7C2D12',
    decisionFill: '#FEE2E2',
    decisionStroke: '#EF4444',
    dbFill: '#FFE4E6',
    dbStroke: '#F43F5E',
    edgeStroke: '#C2410C',
    edgeFont: '#431407',
  },
  'minimalist-mono': {
    name: 'Minimalist Clean',
    defaultFill: '#FFFFFF',
    defaultStroke: '#0F172A',
    defaultFont: '#0F172A',
    decisionFill: '#F8FAFC',
    decisionStroke: '#0F172A',
    dbFill: '#F1F5F9',
    dbStroke: '#0F172A',
    edgeStroke: '#0F172A',
    edgeFont: '#0F172A',
  },
};

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getShapeStyle(shape: ShapeKind, theme: (typeof THEME_PALETTES)[ThemePreset]): string {
  const base = 'whiteSpace=wrap;html=1;strokeWidth=2;';
  
  switch (shape) {
    case 'rhombus':
      return `rhombus;${base}fillColor=${theme.decisionFill};strokeColor=${theme.decisionStroke};fontColor=${theme.defaultFont};`;
    case 'rounded':
      return `rounded=1;arcSize=20;${base}fillColor=${theme.defaultFill};strokeColor=${theme.defaultStroke};fontColor=${theme.defaultFont};`;
    case 'cylinder':
      return `shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=15;${base}fillColor=${theme.dbFill};strokeColor=${theme.dbStroke};fontColor=${theme.defaultFont};`;
    case 'ellipse':
      return `ellipse;${base}fillColor=${theme.defaultFill};strokeColor=${theme.defaultStroke};fontColor=${theme.defaultFont};`;
    case 'parallelogram':
      return `shape=parallelogram;perimeter=parallelogramPerimeter;fixedSize=1;${base}fillColor=${theme.defaultFill};strokeColor=${theme.defaultStroke};fontColor=${theme.defaultFont};`;
    case 'actor':
      return `shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;strokeColor=${theme.defaultStroke};fillColor=${theme.defaultFill};fontColor=${theme.defaultFont};`;
    case 'cloud':
      return `ellipse;shape=cloud;${base}fillColor=${theme.defaultFill};strokeColor=${theme.defaultStroke};fontColor=${theme.defaultFont};`;
    case 'document':
      return `shape=document;boundedLbl=1;${base}fillColor=${theme.defaultFill};strokeColor=${theme.defaultStroke};fontColor=${theme.defaultFont};`;
    case 'container':
      return `rounded=0;whiteSpace=wrap;html=1;verticalAlign=top;align=left;spacingLeft=14;spacingTop=10;fontStyle=1;fontSize=12;dashed=0;arcSize=4;strokeWidth=1.5;`;
    case 'rectangle':
    default:
      return `rounded=0;${base}fillColor=${theme.defaultFill};strokeColor=${theme.defaultStroke};fontColor=${theme.defaultFont};`;
  }
}

export function synthesizeDrawioXml(
  diagram: ExtractedDiagram,
  themeKey: ThemePreset = 'modern-indigo'
): string {
  const theme = THEME_PALETTES[themeKey] || THEME_PALETTES['modern-indigo'];
  const diagramTitle = diagram.title || 'Converted Flowchart';
  const diagramId = 'flow_' + Math.random().toString(36).substring(2, 9);

  let cellsXml = '';

  // Base root cells (layer 0 and default parent 1)
  cellsXml += '        <mxCell id="0" />\n';
  cellsXml += '        <mxCell id="1" parent="0" />\n';

  // Partition nodes into background containers vs standard component vertices
  const isContainer = (n: any) =>
    n.shape === 'container' ||
    (n.width && n.width >= 400 && n.height && n.height >= 200 && /central|backend|routing|app|vpc/i.test(n.label));

  const containerNodes = diagram.nodes.filter(isContainer);
  const regularNodes = diagram.nodes.filter((n) => !isContainer(n));

  // 1. Render Containers FIRST so they act as background grouping panels
  for (const node of containerNodes) {
    const rawStyle = getShapeStyle('container', theme);
    let finalStyle = rawStyle;
    if (node.fillColor) finalStyle += `fillColor=${node.fillColor};`;
    if (node.strokeColor) finalStyle += `strokeColor=${node.strokeColor};`;
    if (node.fontColor) finalStyle += `fontColor=${node.fontColor};`;
    if (/routing|dashed/i.test(node.label)) finalStyle += `dashed=1;`;

    const escapedLabel = escapeXml(node.label || '');
    const width = Math.max(node.width || 400, 100);
    const height = Math.max(node.height || 200, 100);
    const x = Math.round(node.x);
    const y = Math.round(node.y);

    cellsXml += `        <mxCell id="${escapeXml(node.id)}" value="${escapedLabel}" style="${finalStyle}" vertex="1" parent="1">\n`;
    cellsXml += `          <mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry" />\n`;
    cellsXml += `        </mxCell>\n`;
  }

  // 2. Render Edges (rendered BEFORE component nodes so component shapes sit cleanly on top)
  const edgeBaseStyle =
    'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;endFill=1;jumpStyle=arc;jumpSize=6;';

  const nodeMap = new Map<string, (typeof diagram.nodes)[0]>();
  for (const n of diagram.nodes) {
    nodeMap.set(n.id, n);
  }

  for (const edge of diagram.edges) {
    let edgeStyle = edgeBaseStyle;
    if (edge.style === 'curved') {
      edgeStyle =
        'edgeStyle=orthogonalEdgeStyle;curved=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;endFill=1;jumpStyle=arc;jumpSize=6;';
    } else if (edge.style === 'straight') {
      edgeStyle = 'orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;endFill=1;jumpStyle=arc;jumpSize=6;';
    }

    edgeStyle += `strokeColor=${edge.strokeColor || theme.edgeStroke};strokeWidth=1.5;fontColor=${theme.edgeFont};`;
    if (edge.dashed) edgeStyle += 'dashed=1;';
    if (edge.label) edgeStyle += 'labelBackgroundColor=#ffffff;';

    const sNode = nodeMap.get(edge.source);
    const tNode = nodeMap.get(edge.target);

    let waypoints: { x: number; y: number }[] = [];
    if (sNode && tNode) {
      const sRight = sNode.x + sNode.width;
      const sBottom = sNode.y + sNode.height;
      const tRight = tNode.x + tNode.width;
      const tBottom = tNode.y + tNode.height;

      const isStrictlyRight = tNode.x >= sRight - 15;
      const isStrictlyLeft = sNode.x >= tRight - 15;
      const isStrictlyBelow = tNode.y >= sBottom - 15;
      const isStrictlyAbove = sNode.y >= tBottom - 15;

      const dx = (tNode.x + tNode.width / 2) - (sNode.x + sNode.width / 2);
      const dy = (tNode.y + tNode.height / 2) - (sNode.y + sNode.height / 2);

      let exitX = 1;
      let exitY = 0.5;
      let entryX = 0;
      let entryY = 0.5;

      if (isStrictlyRight && Math.abs(dy) <= Math.max(sNode.height, tNode.height) * 1.5) {
        exitX = 1;
        exitY = 0.5;
        entryX = 0;
        entryY = 0.5;
      } else if (isStrictlyBelow && Math.abs(dx) <= Math.max(sNode.width, tNode.width) * 1.2) {
        exitX = 0.5;
        exitY = 1;
        entryX = 0.5;
        entryY = 0;
      } else if (isStrictlyRight && isStrictlyBelow) {
        if (tNode.y - sBottom > tNode.x - sRight) {
          exitX = 0.5;
          exitY = 1;
          entryX = 0;
          entryY = 0.5;
        } else {
          exitX = 1;
          exitY = 0.5;
          entryX = 0.5;
          entryY = 0;
        }
      } else if (isStrictlyRight && isStrictlyAbove) {
        exitX = 1;
        exitY = 0.5;
        entryX = 0.5;
        entryY = 1;
      } else if (isStrictlyLeft) {
        exitX = 0;
        exitY = 0.5;
        entryX = 1;
        entryY = 0.5;
      } else if (isStrictlyAbove) {
        exitX = 0.5;
        exitY = 0;
        entryX = 0.5;
        entryY = 1;
      }

      // Obstacle detection along horizontal path
      if (exitX === 1 && entryX === 0 && tNode.x > sRight + 50) {
        const exitYCoord = sNode.y + exitY * sNode.height;
        const entryYCoord = tNode.y + entryY * tNode.height;

        const obstacles = regularNodes.filter(
          (n) =>
            n.id !== sNode.id &&
            n.id !== tNode.id &&
            n.x + n.width > sRight + 10 &&
            n.x < tNode.x - 10 &&
            n.y - 15 <= Math.max(exitYCoord, entryYCoord) &&
            n.y + n.height + 15 >= Math.min(exitYCoord, entryYCoord)
        );

        if (obstacles.length > 0) {
          const minObsY = Math.min(...obstacles.map((o) => o.y));
          const maxObsY = Math.max(...obstacles.map((o) => o.y + o.height));
          const topGutter = Math.min(minObsY, sNode.y, tNode.y) - 35;
          const bottomGutter = Math.max(maxObsY, sBottom, tBottom) + 35;

          const useTop = topGutter > 60 && Math.abs(exitYCoord - topGutter) <= Math.abs(exitYCoord - bottomGutter);
          const gutterY = useTop ? topGutter : bottomGutter;

          waypoints = [
            { x: sRight + 20, y: gutterY },
            { x: tNode.x - 20, y: gutterY },
          ];
          entryX = 0.5;
          entryY = useTop ? 0 : 1;
        }
      }

      edgeStyle += `exitX=${exitX};exitY=${exitY};exitDx=0;exitDy=0;entryX=${entryX};entryY=${entryY};entryDx=0;entryDy=0;`;
    }

    const escapedEdgeLabel = escapeXml(edge.label || '');

    cellsXml += `        <mxCell id="${escapeXml(edge.id)}" value="${escapedEdgeLabel}" style="${edgeStyle}" edge="1" parent="1" source="${escapeXml(edge.source)}" target="${escapeXml(edge.target)}">\n`;
    if (waypoints.length > 0) {
      cellsXml += `          <mxGeometry relative="1" as="geometry">\n            <Array as="points">\n`;
      for (const pt of waypoints) {
        cellsXml += `              <mxPoint x="${Math.round(pt.x)}" y="${Math.round(pt.y)}" />\n`;
      }
      cellsXml += `            </Array>\n          </mxGeometry>\n`;
    } else {
      cellsXml += `          <mxGeometry relative="1" as="geometry" />\n`;
    }
    cellsXml += `        </mxCell>\n`;
  }

  // 3. Render Regular Component Nodes (rendered ON TOP of edges with opaque fill)
  for (const node of regularNodes) {
    const rawStyle = getShapeStyle(node.shape, theme);
    let finalStyle = rawStyle;
    if (node.fillColor) finalStyle += `fillColor=${node.fillColor};`;
    if (node.strokeColor) finalStyle += `strokeColor=${node.strokeColor};`;
    if (node.fontColor) finalStyle += `fontColor=${node.fontColor};`;

    const escapedLabel = escapeXml(node.label || '');
    const width = Math.max(node.width || 140, 40);
    const height = Math.max(node.height || 60, 30);
    const x = Math.round(node.x);
    const y = Math.round(node.y);

    cellsXml += `        <mxCell id="${escapeXml(node.id)}" value="${escapedLabel}" style="${finalStyle}" vertex="1" parent="1">\n`;
    cellsXml += `          <mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry" />\n`;
    cellsXml += `        </mxCell>\n`;
  }

  return `<mxfile host="Electron" modified="${new Date().toISOString()}" agent="DrawioStudioVisionAI/1.0" version="24.0.0">
  <diagram name="${escapeXml(diagramTitle)}" id="${diagramId}">
    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" background="#ffffff" math="0" shadow="0">
      <root>
${cellsXml}      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}
