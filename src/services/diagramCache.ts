import { ExtractedDiagram } from '../types/diagram';

const CACHE_PREFIX = 'diagram_cache_v1_';
const RECENT_KEYS = 'diagram_cache_recent_keys';

export interface CachedDiagramEntry {
  cacheKey: string;
  imageHash: string;
  imagePreviewUrl?: string;
  fileName: string;
  timestamp: number;
  diagram: ExtractedDiagram;
}

// Compute a fast, reliable hash of an image's base64 or binary data
export async function computeImageHash(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Retrieve cached diagram by image hash
export function getCachedDiagram(imageHash: string): CachedDiagramEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + imageHash);
    if (!raw) return null;
    return JSON.parse(raw) as CachedDiagramEntry;
  } catch (e) {
    console.warn('Failed to read diagram cache:', e);
    return null;
  }
}

// Store diagram in cache
export function setCachedDiagram(
  imageHash: string,
  fileName: string,
  diagram: ExtractedDiagram,
  previewDataUrl?: string
): void {
  try {
    const entry: CachedDiagramEntry = {
      cacheKey: CACHE_PREFIX + imageHash,
      imageHash,
      imagePreviewUrl: previewDataUrl,
      fileName,
      timestamp: Date.now(),
      diagram,
    };

    localStorage.setItem(CACHE_PREFIX + imageHash, JSON.stringify(entry));

    // Update index of recent diagrams
    const recentRaw = localStorage.getItem(RECENT_KEYS);
    let recent: string[] = recentRaw ? JSON.parse(recentRaw) : [];
    recent = [imageHash, ...recent.filter((h) => h !== imageHash)].slice(0, 10);
    localStorage.setItem(RECENT_KEYS, JSON.stringify(recent));
  } catch (e) {
    console.warn('Failed to save diagram cache:', e);
  }
}

// Retrieve recent cached diagrams
export function getRecentCachedDiagrams(): CachedDiagramEntry[] {
  try {
    const recentRaw = localStorage.getItem(RECENT_KEYS);
    if (!recentRaw) return [];
    const keys: string[] = JSON.parse(recentRaw);
    const results: CachedDiagramEntry[] = [];
    for (const k of keys) {
      const cached = getCachedDiagram(k);
      if (cached) results.push(cached);
    }
    return results;
  } catch {
    return [];
  }
}

// Clear all cached diagrams
export function clearDiagramCache(): number {
  let count = 0;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(CACHE_PREFIX) || key === RECENT_KEYS)) {
        keysToRemove.push(key);
      }
    }
    count = keysToRemove.filter((k) => k !== RECENT_KEYS).length;
    for (const k of keysToRemove) {
      localStorage.removeItem(k);
    }
  } catch (e) {
    console.warn('Failed to clear cache:', e);
  }
  return count;
}

