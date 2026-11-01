export type SimulationMode = 'nominal' | 'cache_hit' | 'surge';

export function enableTrafficSimulation(
  xml: string,
  mode: SimulationMode = 'nominal'
): string {
  const modeColors: Record<SimulationMode, string> = {
    nominal: '#10b981', // emerald green
    cache_hit: '#06b6d4', // cyan
    surge: '#f97316', // orange surge
  };

  const targetColor = modeColors[mode];

  // Modify all edge="1" cells to include flowAnimation=1 and matching pulse color
  return xml.replace(
    /(<mxCell[^>]*\bedge="1"[^>]*\bstyle=")([^"]*)(")/g,
    (_, prefix, style, suffix) => {
      let cleanStyle = style
        .replace(/flowAnimation=\d+;?/g, '')
        .replace(/strokeColor=[^;]+;?/g, '')
        .replace(/strokeWidth=[^;]+;?/g, '');

      if (!cleanStyle.endsWith(';') && cleanStyle.length > 0) {
        cleanStyle += ';';
      }

      const simStyle = `${cleanStyle}flowAnimation=1;strokeColor=${targetColor};strokeWidth=2.5;`;
      return `${prefix}${simStyle}${suffix}`;
    }
  );
}

export function disableTrafficSimulation(xml: string): string {
  // Strip flowAnimation and reset edge styles
  return xml.replace(
    /(<mxCell[^>]*\bedge="1"[^>]*\bstyle=")([^"]*)(")/g,
    (_, prefix, style, suffix) => {
      const cleanStyle = style
        .replace(/flowAnimation=\d+;?/g, '')
        .replace(/strokeColor=#(10b981|06b6d4|f97316);?/g, '')
        .replace(/strokeWidth=2\.5;?/g, '')
        .replace(/strokeWidth=3;?/g, '');
      return `${prefix}${cleanStyle}${suffix}`;
    }
  );
}

