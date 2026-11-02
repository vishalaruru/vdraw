export type ShapeKind =
  | 'rectangle'
  | 'rounded'
  | 'rhombus'
  | 'cylinder'
  | 'ellipse'
  | 'parallelogram'
  | 'actor'
  | 'cloud'
  | 'container'
  | 'document';

export interface DiagramNode {
  id: string;
  label: string;
  shape: ShapeKind;
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor?: string;
  strokeColor?: string;
  fontColor?: string;
  fontSize?: number;
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  style?: 'orthogonal' | 'curved' | 'straight';
  strokeColor?: string;
  dashed?: boolean;
}

export interface ExtractedDiagram {
  title: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  rawXml?: string;
}

export type ThemePreset =
  | 'modern-indigo'
  | 'classic-drawio'
  | 'emerald-nature'
  | 'amber-warm'
  | 'minimalist-mono';

