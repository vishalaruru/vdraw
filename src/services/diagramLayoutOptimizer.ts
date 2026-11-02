import { ExtractedDiagram } from '../types/diagram';

export interface LayoutOptions {
  orientation?: 'left-to-right' | 'top-to-bottom';
  alignTiers?: boolean;
  applyHarmonizedColors?: boolean;
}

/**
 * Normalizes diagram nodes, resolves coordinate collisions, aligns components into tiers,
 * and applies distinct, high-fidelity color archetypes matching enterprise architecture standards.
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
      // Remove accidental duplicate words (e.g. "standard communication standard communication")
      const words = cleaned.split(/\s+/);
      if (words.length >= 4 && words.length % 2 === 0) {
        const half = words.length / 2;
        const firstHalf = words.slice(0, half).join(' ').toLowerCase();
        const secondHalf = words.slice(half).join(' ').toLowerCase();
        if (firstHalf === secondHalf) {
          cleaned = words.slice(0, half).join(' ');
        }
      }
      // Clean duplicate lines
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
    let archetype: 'client' | 'integration' | 'domain' | 'external' | 'config' | 'database' = 'domain';

    if (l.includes('client') || l.includes('user') || l.includes('browser') || l.includes('ios') || l.includes('android') || l.includes('mobile')) {
      archetype = 'client';
    } else if (l.includes('config') || l.includes('setting') || l.includes('vault') || l.includes('kms')) {
      archetype = 'config';
    } else if (l.includes('provider') || l.includes('stream') || l.includes('dots') || l.includes('radar') || l.includes('gdp') || l.includes('third party') || l.includes('external')) {
      archetype = 'external';
    } else if (l.includes('sdk') || l.includes('gateway') || l.includes('matcher') || l.includes('proxy') || l.includes('waf') || l.includes('ingress')) {
      archetype = 'integration';
    } else if (l.includes('db') || l.includes('database') || l.includes('postgres') || l.includes('mysql') || l.includes('mongo') || l.includes('redis')) {
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
          node.height = 60;
          // Mint / Sage green (matches Image 1)
          node.fillColor = '#D5E8D4';
          node.strokeColor = '#82B366';
          node.fontColor = '#134E4A';
          break;

        case 'domain':
          node.shape = 'rectangle';
          node.width = Math.max(node.width || 150, 150);
          node.height = 65;
          // Clean enterprise tech blue (matches Image 1)
          node.fillColor = '#DAE8FC';
          node.strokeColor = '#6C8EBF';
          node.fontColor = '#1E3A8A';
          break;

        case 'external':
          node.shape = 'cloud';
          node.width = Math.max(node.width || 160, 160);
          node.height = 75;
          // Warm amber / orange cloud (matches Image 1)
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
          // Pastel purple / lavender (matches Image 1)
          node.fillColor = '#E1D5E7';
          node.strokeColor = '#9673A6';
          node.fontColor = '#4A1D96';
          break;
      }
    }
  }

  // 4. Layout Alignment: Compute clean column coordinates if Left-to-Right
  if (options.alignTiers && options.orientation === 'left-to-right') {
    // Columns:
    // Col 0: Client Tier (x = 80)
    // Col 1: Integration Tier (x = 340)
    // Col 2: Domain Services / Orchestration Tier (x = 640)
    // Col 3: External Providers & Streams (x = 940)
    const col0 = classifiedNodes.filter((c) => c.archetype === 'client');
    const col1 = classifiedNodes.filter((c) => c.archetype === 'integration');
    const col2 = classifiedNodes.filter((c) => c.archetype === 'domain');
    const col3 = classifiedNodes.filter((c) => c.archetype === 'external' || c.archetype === 'database');
    const configNodes = classifiedNodes.filter((c) => c.archetype === 'config');

    // Layout Column 0 (Clients)
    const clientYSpacing = 340;
    col0.forEach((item, idx) => {
      item.node.x = 80;
      item.node.y = 140 + idx * clientYSpacing;
    });

    // Layout Column 1 (Integration / SDKs)
    col1.forEach((item, idx) => {
      item.node.x = 340;
      // Align vertically with corresponding clients if possible
      item.node.y = 160 + idx * clientYSpacing;
    });

    // Layout Column 2 (Domain Services)
    const domainYSpacing = 170;
    col2.forEach((item, idx) => {
      item.node.x = 640;
      item.node.y = 155 + idx * domainYSpacing;
    });

    // Layout Column 3 (External Providers / Streams)
    const externalYSpacing = 170;
    col3.forEach((item, idx) => {
      item.node.x = 940;
      item.node.y = 150 + idx * externalYSpacing;
    });

    // Layout Config nodes: Place directly beneath the node they configure!
    configNodes.forEach((cfgItem) => {
      // Find what config connects to or what connects to config
      const targetEdge = edges.find(
        (e) => e.source === cfgItem.node.id || e.target === cfgItem.node.id
      );
      if (targetEdge) {
        const otherId = targetEdge.source === cfgItem.node.id ? targetEdge.target : targetEdge.source;
        const targetNode = nodes.find((n) => n.id === otherId);
        if (targetNode) {
          cfgItem.node.x = targetNode.x;
          cfgItem.node.y = targetNode.y + (targetNode.height || 60) + 100;
          return;
        }
      }
      // Default position if no target found
      cfgItem.node.x = 640;
      cfgItem.node.y = 155 + col2.length * domainYSpacing;
    });
  }

  // 5. Anti-Collision Pass: Ensure no two nodes overlap
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = Math.abs(a.x - b.x);
      const dy = Math.abs(a.y - b.y);
      const minX = ((a.width || 140) + (b.width || 140)) / 2;
      const minY = ((a.height || 60) + (b.height || 60)) / 2 + 30;

      if (dx < minX && dy < minY) {
        // Shift b downwards to prevent overlap
        b.y = a.y + (a.height || 60) + 50;
      }
    }
  }

  return {
    title: diagram.title || 'Technical Architecture Diagram',
    nodes,
    edges,
  };
}
