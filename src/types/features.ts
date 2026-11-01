export interface DiagramTab {
  id: string;
  title: string;
  xml: string;
  modifiedAt: number;
}

export interface DiagramVersionSnapshot {
  id: string;
  tabId: string;
  timestamp: number;
  label: string;
  xml: string;
  nodeCount: number;
}

export interface PromptGenerationRequest {
  prompt: string;
  theme?: string;
  diagramType?: 'architecture' | 'flowchart' | 'sequence' | 'mindmap';
}

