import { ExtractedDiagram, DiagramNode, DiagramEdge } from '../types/diagram';

export type DiagramFormat = 'erd' | 'uml';

export interface EntityField {
  name: string;
  type: string;
  isPk: boolean;
  isFk: boolean;
  fkTarget?: string;
  nullable?: boolean;
}

export interface EntityMethod {
  name: string;
  returnType: string;
  params?: string;
  visibility: '+' | '-' | '#';
}

export interface ParsedEntity {
  id: string;
  name: string;
  fields: EntityField[];
  methods?: EntityMethod[];
}

export interface EntityRelation {
  id: string;
  sourceTable: string;
  targetTable: string;
  sourceCol: string;
  targetCol: string;
  cardinality: '1:1' | '1:N' | 'N:M';
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Builds the official Draw.io stackLayout swimlane XML for ERD and UML class diagrams.
 * Every column is rendered as an explicit child cell (parent=tableId) so columns
 * are 100% visible, fully interactive, and never sanitized or hidden.
 */
function buildDrawioXmlFromEntities(
  entities: ParsedEntity[],
  relations: EntityRelation[],
  format: DiagramFormat
): string {
  const diagramTitle = format === 'erd' ? 'Database ERD Diagram' : 'UML Class Diagram';
  const diagramId = 'erd_' + Math.random().toString(36).substring(2, 9);

  let cellsXml = '        <mxCell id="0" />\n        <mxCell id="1" parent="0" />\n';

  // Compute topological positions so primary entities appear on left, downstream on right
  const inDegreeMap = new Map<string, number>();
  entities.forEach((e) => inDegreeMap.set(e.name.toLowerCase(), 0));
  relations.forEach((r) => {
    const cur = inDegreeMap.get(r.targetTable.toLowerCase()) || 0;
    inDegreeMap.set(r.targetTable.toLowerCase(), cur + 1);
  });

  // Sort entities: most referenced (primary) tables first
  const sortedEntities = [...entities].sort((a, b) => {
    const inA = inDegreeMap.get(a.name.toLowerCase()) || 0;
    const inB = inDegreeMap.get(b.name.toLowerCase()) || 0;
    return inB - inA;
  });

  // Layout parameters
  const cardWidth = 260;
  const startX = 80;
  const startY = 80;
  const gapX = 100;
  const gapY = 80;

  const positions = new Map<string, { x: number; y: number; width: number; height: number }>();

  // Determine grid coordinates (2 or 3 columns)
  const columns = sortedEntities.length <= 4 ? 2 : 3;

  sortedEntities.forEach((entity, idx) => {
    const col = idx % columns;
    const row = Math.floor(idx / columns);

    const rowCount = format === 'erd' ? entity.fields.length : entity.fields.length + 3;
    const height = Math.max(130, 38 + rowCount * 25 + 10);

    const x = startX + col * (cardWidth + gapX);
    const y = startY + row * (240 + gapY);

    positions.set(entity.id, { x, y, width: cardWidth, height });
  });

  // 1. Render relationship edges FIRST so they dock behind nodes cleanly
  relations.forEach((rel) => {
    const sourceEntity = entities.find((e) => e.name.toLowerCase() === rel.sourceTable.toLowerCase());
    const targetEntity = entities.find((e) => e.name.toLowerCase() === rel.targetTable.toLowerCase());

    if (!sourceEntity || !targetEntity) return;

    let edgeStyle = '';
    let edgeLabel = '';

    if (format === 'erd') {
      // Crow's foot notation (Mandatory one to many)
      edgeStyle =
        'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;' +
        'startArrow=ERmand;startFill=0;endArrow=ERmany;endFill=0;' +
        'strokeColor=#475569;strokeWidth=1.5;fontColor=#334155;fontSize=10;';
      edgeLabel = `1:N (${rel.sourceCol} &rarr; ${rel.targetCol})`;
    } else {
      // UML Association / Dependency
      edgeStyle =
        'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;' +
        'endArrow=open;endFill=0;strokeColor=#2563eb;strokeWidth=1.5;fontColor=#1e3a8a;fontSize=10;';
      edgeLabel = `1 .. * (${rel.sourceCol})`;
    }

    cellsXml += `        <mxCell id="${escapeXml(rel.id)}" value="${escapeXml(edgeLabel)}" style="${edgeStyle}" edge="1" parent="1" source="${escapeXml(sourceEntity.id)}" target="${escapeXml(targetEntity.id)}">\n`;
    cellsXml += `          <mxGeometry relative="1" as="geometry" />\n`;
    cellsXml += `        </mxCell>\n`;
  });

  // 2. Render entity tables and their child rows
  sortedEntities.forEach((entity) => {
    const pos = positions.get(entity.id) || { x: startX, y: startY, width: cardWidth, height: 160 };

    if (format === 'erd') {
      const headerHeight = 28;
      const rowHeight = 24;
      const totalHeight = headerHeight + entity.fields.length * rowHeight;

      // Draw.io native ERD table swimlane
      const tableStyle =
        'swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;' +
        `startSize=${headerHeight};horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;` +
        'collapsible=1;marginBottom=0;whiteSpace=wrap;html=1;fillColor=#1e293b;strokeColor=#0f172a;' +
        'fontColor=#ffffff;strokeWidth=1.5;rounded=1;arcSize=6;shadow=1;';

      const tableTitle = entity.name.toUpperCase();

      cellsXml += `        <mxCell id="${escapeXml(entity.id)}" value="${escapeXml(tableTitle)}" style="${tableStyle}" vertex="1" parent="1">\n`;
      cellsXml += `          <mxGeometry x="${pos.x}" y="${pos.y}" width="${pos.width}" height="${totalHeight}" as="geometry" />\n`;
      cellsXml += `        </mxCell>\n`;

      // Render each column row as a child cell inside the table
      entity.fields.forEach((f, idx) => {
        const rowY = headerHeight + idx * rowHeight;
        const bg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';

        let rowLabel = '';
        if (f.isPk) {
          rowLabel = `<b><font color="#b45309">PK</font></b> | <b>${f.name}</b> : <font color="#64748b">${f.type.toUpperCase()}</font>`;
        } else if (f.isFk) {
          rowLabel = `<b><font color="#2563eb">FK</font></b> | <b>${f.name}</b> : <font color="#64748b">${f.type.toUpperCase()}</font>`;
        } else {
          rowLabel = `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| ${f.name} : <font color="#64748b">${f.type.toUpperCase()}</font>`;
        }

        const rowStyle =
          `text;strokeColor=none;fillColor=${bg};align=left;verticalAlign=middle;` +
          'spacingLeft=8;spacingRight=8;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];' +
          'portConstraint=eastwest;whiteSpace=wrap;html=1;fontSize=11;';

        const rowId = `${entity.id}_col_${f.name}`;
        cellsXml += `        <mxCell id="${escapeXml(rowId)}" value="${escapeXml(rowLabel)}" style="${rowStyle}" vertex="1" parent="${escapeXml(entity.id)}">\n`;
        cellsXml += `          <mxGeometry y="${rowY}" width="${pos.width}" height="${rowHeight}" as="geometry" />\n`;
        cellsXml += `        </mxCell>\n`;
      });
    } else {
      // UML Class Diagram Swimlane Stack
      const headerHeight = 36;
      const rowHeight = 22;
      const attrCount = entity.fields.length;
      const methods = entity.methods || [
        { name: `get${capitalize(entity.name)}ById`, returnType: capitalize(entity.name), params: 'id: UUID', visibility: '+' },
        { name: `save`, returnType: 'Promise<Boolean>', params: '', visibility: '+' },
        { name: `delete`, returnType: 'Promise<Void>', params: '', visibility: '+' },
      ];
      const methodCount = methods.length;
      const totalHeight = headerHeight + attrCount * rowHeight + 8 + methodCount * rowHeight;

      const classStyle =
        'swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;' +
        `startSize=${headerHeight};horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;` +
        'collapsible=1;marginBottom=0;whiteSpace=wrap;html=1;fillColor=#2563eb;strokeColor=#1d4ed8;' +
        'fontColor=#ffffff;strokeWidth=1.5;rounded=1;arcSize=6;shadow=1;';

      const classTitle = `&laquo;Entity&raquo;&lt;br/&gt;&lt;b&gt;${capitalize(entity.name)}&lt;/b&gt;`;

      cellsXml += `        <mxCell id="${escapeXml(entity.id)}" value="${classTitle}" style="${classStyle}" vertex="1" parent="1">\n`;
      cellsXml += `          <mxGeometry x="${pos.x}" y="${pos.y}" width="${pos.width}" height="${totalHeight}" as="geometry" />\n`;
      cellsXml += `        </mxCell>\n`;

      let currentY = headerHeight;

      // Attributes
      entity.fields.forEach((f) => {
        const typeStr = f.type.charAt(0).toUpperCase() + f.type.slice(1);
        const attrLabel = `+ ${f.name} : <font color="#64748b">${typeStr}</font>`;
        const attrStyle =
          'text;strokeColor=none;fillColor=#ffffff;align=left;verticalAlign=middle;' +
          'spacingLeft=8;spacingRight=8;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];' +
          'portConstraint=eastwest;whiteSpace=wrap;html=1;fontColor=#0f172a;fontSize=11;';

        cellsXml += `        <mxCell id="${escapeXml(entity.id)}_attr_${escapeXml(f.name)}" value="${escapeXml(attrLabel)}" style="${attrStyle}" vertex="1" parent="${escapeXml(entity.id)}">\n`;
        cellsXml += `          <mxGeometry y="${currentY}" width="${pos.width}" height="${rowHeight}" as="geometry" />\n`;
        cellsXml += `        </mxCell>\n`;
        currentY += rowHeight;
      });

      // Divider line between attributes and methods
      const divStyle =
        'line;strokeWidth=1;fillColor=none;align=left;verticalAlign=middle;' +
        'spacingTop=-1;spacingLeft=3;spacingRight=3;rotatable=0;labelPosition=right;' +
        'points=[];portConstraint=eastwest;strokeColor=#cbd5e1;';
      cellsXml += `        <mxCell id="${escapeXml(entity.id)}_divider" value="" style="${divStyle}" vertex="1" parent="${escapeXml(entity.id)}">\n`;
      cellsXml += `          <mxGeometry y="${currentY}" width="${pos.width}" height="8" as="geometry" />\n`;
      cellsXml += `        </mxCell>\n`;
      currentY += 8;

      // Methods
      methods.forEach((m) => {
        const methodLabel = `${m.visibility} ${m.name}(${m.params || ''}): <font color="#64748b">${m.returnType}</font>`;
        const methodStyle =
          'text;strokeColor=none;fillColor=#f8fafc;align=left;verticalAlign=middle;' +
          'spacingLeft=8;spacingRight=8;overflow=hidden;rotatable=0;points=[[0,0.5],[1,0.5]];' +
          'portConstraint=eastwest;whiteSpace=wrap;html=1;fontColor=#166534;fontSize=11;';

        cellsXml += `        <mxCell id="${escapeXml(entity.id)}_m_${escapeXml(m.name)}" value="${escapeXml(methodLabel)}" style="${methodStyle}" vertex="1" parent="${escapeXml(entity.id)}">\n`;
        cellsXml += `          <mxGeometry y="${currentY}" width="${pos.width}" height="${rowHeight}" as="geometry" />\n`;
        cellsXml += `        </mxCell>\n`;
        currentY += rowHeight;
      });
    }
  });

  return `<mxfile host="Electron" modified="${new Date().toISOString()}" agent="DrawioERDGenerator/2.0" version="24.0.0">
  <diagram name="${escapeXml(diagramTitle)}" id="${diagramId}">
    <mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1600" pageHeight="1200" background="#ffffff" math="0" shadow="0">
      <root>
${cellsXml}      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}

/**
 * Deterministically parses SQL DDL into entities and relations
 */
export function parseSqlSchema(sql: string): { entities: ParsedEntity[]; relations: EntityRelation[] } {
  const entities: ParsedEntity[] = [];
  const relations: EntityRelation[] = [];

  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"']?[a-zA-Z0-9_]+[`"']?)\s*\(([\s\S]*?)\);/gi;
  let match;

  while ((match = tableRegex.exec(sql)) !== null) {
    const rawTableName = match[1].replace(/[`"']/g, '').trim();
    const body = match[2];

    const fields: EntityField[] = [];
    const inlinePks: string[] = [];

    // Check for table-level PRIMARY KEY (col1, col2)
    const tablePkRegex = /PRIMARY\s+KEY\s*\(([^)]+)\)/i;
    const tablePkMatch = tablePkRegex.exec(body);
    if (tablePkMatch) {
      tablePkMatch[1].split(',').forEach((c) => inlinePks.push(c.trim().replace(/[`"']/g, '')));
    }

    const lines = body
      .split('\n')
      .map((l) => l.trim().replace(/,$/, ''))
      .filter((l) => l.length > 0 && !l.startsWith('--') && !l.startsWith('/*'));

    lines.forEach((line) => {
      // Skip table-level constraints
      if (/^(PRIMARY\s+KEY|FOREIGN\s+KEY|CONSTRAINT|UNIQUE\s+INDEX|KEY)/i.test(line)) {
        return;
      }

      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        const colName = parts[0].replace(/[`"']/g, '');
        const colType = parts[1].replace(/[,;)]/g, '');
        const upperLine = line.toUpperCase();

        const isPk = upperLine.includes('PRIMARY KEY') || inlinePks.includes(colName);
        const isFk = upperLine.includes('REFERENCES');
        const nullable = !upperLine.includes('NOT NULL') && !isPk;

        fields.push({
          name: colName,
          type: colType || 'VARCHAR',
          isPk,
          isFk,
          nullable,
        });
      }
    });

    const entityId = `erd_${rawTableName.toLowerCase()}`;
    entities.push({
      id: entityId,
      name: rawTableName,
      fields: fields.length > 0 ? fields : [{ name: 'id', type: 'UUID', isPk: true, isFk: false }],
    });

    // Extract Foreign Key references: FOREIGN KEY (col) REFERENCES table(target_col)
    const fkRegex = /FOREIGN\s+KEY\s*\(([`"']?[a-zA-Z0-9_]+[`"']?)\)\s+REFERENCES\s+([`"']?[a-zA-Z0-9_]+[`"']?)\s*(?:\(([`"']?[a-zA-Z0-9_]+[`"']?)\))?/gi;
    let fkMatch;
    while ((fkMatch = fkRegex.exec(body)) !== null) {
      const sourceCol = fkMatch[1].replace(/[`"']/g, '');
      const targetTable = fkMatch[2].replace(/[`"']/g, '');
      const targetCol = (fkMatch[3] || 'id').replace(/[`"']/g, '');

      // Mark the field as FK
      const foundField = fields.find((f) => f.name.toLowerCase() === sourceCol.toLowerCase());
      if (foundField) foundField.isFk = true;

      relations.push({
        id: `rel_${rawTableName}_${targetTable}_${Math.random().toString(36).substring(2, 6)}`,
        sourceTable: rawTableName,
        targetTable,
        sourceCol,
        targetCol,
        cardinality: '1:N',
      });
    }
  }

  return { entities, relations };
}

/**
 * Deterministically parses Prisma Schema into entities and relations
 */
export function parsePrismaSchema(prisma: string): { entities: ParsedEntity[]; relations: EntityRelation[] } {
  const entities: ParsedEntity[] = [];
  const relations: EntityRelation[] = [];

  const modelRegex = /model\s+([a-zA-Z0-9_]+)\s*\{([\s\S]*?)\}/gi;
  let match;

  while ((match = modelRegex.exec(prisma)) !== null) {
    const modelName = match[1].trim();
    const body = match[2];

    const fields: EntityField[] = [];

    const lines = body
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('//') && !l.startsWith('@@'));

    lines.forEach((line) => {
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        const fieldName = parts[0];
        const fieldType = parts[1];

        // Skip relation helper arrays e.g. "orders Order[]"
        if (fieldType.endsWith('[]')) {
          return;
        }

        const isPk = line.includes('@id');
        const isFk = line.includes('@relation');
        const nullable = fieldType.endsWith('?');

        fields.push({
          name: fieldName,
          type: fieldType.replace('?', ''),
          isPk,
          isFk,
          nullable,
        });

        // Parse @relation(fields: [userId], references: [id])
        if (isFk) {
          const relationMatch = /@relation\([^)]*fields:\s*\[([^\]]+)\][^)]*references:\s*\[([^\]]+)\]/i.exec(line);
          if (relationMatch) {
            const sourceCol = relationMatch[1].trim();
            const targetCol = relationMatch[2].trim();
            const targetTable = fieldType.replace('?', '');

            relations.push({
              id: `rel_${modelName}_${targetTable}_${Math.random().toString(36).substring(2, 6)}`,
              sourceTable: modelName,
              targetTable,
              sourceCol,
              targetCol,
              cardinality: '1:N',
            });
          }
        }
      }
    });

    entities.push({
      id: `erd_${modelName.toLowerCase()}`,
      name: modelName,
      fields: fields.length > 0 ? fields : [{ name: 'id', type: 'String', isPk: true, isFk: false }],
    });
  }

  return { entities, relations };
}

/**
 * Main export: parses SQL DDL or Prisma schema into full professional ERD or UML diagrams
 */
export async function parseSqlOrPrismaToErd(
  schemaText: string,
  schemaType: 'sql' | 'prisma',
  format: DiagramFormat = 'erd'
): Promise<{ diagram: ExtractedDiagram; xml: string }> {
  let parsed: { entities: ParsedEntity[]; relations: EntityRelation[] };

  if (schemaType === 'prisma') {
    parsed = parsePrismaSchema(schemaText);
  } else {
    parsed = parseSqlSchema(schemaText);
  }

  // Fallback defaults if schema text had no detectable tables
  if (parsed.entities.length === 0) {
    parsed.entities = [
      {
        id: 'erd_users',
        name: 'users',
        fields: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false },
          { name: 'email', type: 'VARCHAR(255)', isPk: false, isFk: false },
          { name: 'created_at', type: 'TIMESTAMP', isPk: false, isFk: false },
        ],
      },
      {
        id: 'erd_orders',
        name: 'orders',
        fields: [
          { name: 'id', type: 'UUID', isPk: true, isFk: false },
          { name: 'user_id', type: 'UUID', isPk: false, isFk: true },
          { name: 'total_amount', type: 'NUMERIC(10,2)', isPk: false, isFk: false },
          { name: 'status', type: 'VARCHAR(50)', isPk: false, isFk: false },
        ],
      },
    ];

    parsed.relations = [
      {
        id: 'rel_orders_users',
        sourceTable: 'orders',
        targetTable: 'users',
        sourceCol: 'user_id',
        targetCol: 'id',
        cardinality: '1:N',
      },
    ];
  }

  const xml = buildDrawioXmlFromEntities(parsed.entities, parsed.relations, format);

  // Return compatible ExtractedDiagram object
  const diagramNodes: DiagramNode[] = parsed.entities.map((e, idx) => ({
    id: e.id,
    label: e.name,
    shape: 'rectangle',
    x: 80 + idx * 300,
    y: 80,
    width: 260,
    height: 160,
  }));

  const diagramEdges: DiagramEdge[] = parsed.relations.map((r) => ({
    id: r.id,
    source: `erd_${r.sourceTable.toLowerCase()}`,
    target: `erd_${r.targetTable.toLowerCase()}`,
    label: `${r.sourceCol} -> ${r.targetCol}`,
  }));

  return {
    diagram: {
      title: format === 'erd' ? 'Database ERD Diagram' : 'UML Class Diagram',
      nodes: diagramNodes,
      edges: diagramEdges,
    },
    xml,
  };
}
