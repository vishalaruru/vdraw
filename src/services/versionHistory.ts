import { DiagramVersionSnapshot } from '../types/features';
import { parseXmlBasic } from './codeGenerators';

const VERSION_STORAGE_KEY = 'vdraw_diagram_versions_v1';

export function saveDiagramVersion(tabId: string, xml: string, label?: string): DiagramVersionSnapshot {
  const versions = getAllVersions();
  const { nodes } = parseXmlBasic(xml);

  const newSnapshot: DiagramVersionSnapshot = {
    id: 'ver_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    tabId,
    timestamp: Date.now(),
    label: label || `Snapshot (${nodes.length} elements)`,
    xml,
    nodeCount: nodes.length,
  };

  const updated = [newSnapshot, ...versions].slice(0, 30);
  try {
    localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save version:', err);
  }
  return newSnapshot;
}

export function getAllVersions(): DiagramVersionSnapshot[] {
  try {
    const raw = localStorage.getItem(VERSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getVersionsForTab(tabId: string): DiagramVersionSnapshot[] {
  return getAllVersions().filter((v) => v.tabId === tabId || !v.tabId);
}

export function clearAllVersions(): void {
  localStorage.removeItem(VERSION_STORAGE_KEY);
}

