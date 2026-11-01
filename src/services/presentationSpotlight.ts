/**
 * Presentation Spotlight Service
 * Dynamically highlights active components on the Draw.io canvas
 * while dimming non-active components to create a cinematic walkthrough.
 */

export function applyPresentationSpotlight(
  xml: string,
  activeNodeIds: string[],
  isOverview: boolean = false
): string {
  if (!xml || xml.length < 50) return xml;

  const activeSet = new Set(activeNodeIds);

  return xml.replace(/<mxCell\b([^>]*)>/g, (fullTag, attrs) => {
    // Only operate on vertex shapes (nodes/tables/rows)
    if (!/\bvertex="1"/.test(attrs)) return fullTag;

    const idMatch = /\bid="([^"]+)"/.exec(attrs);
    const parentMatch = /\bparent="([^"]+)"/.exec(attrs);
    const styleMatch = /\bstyle="([^"]*)"/.exec(attrs);

    if (!styleMatch) return fullTag;

    const cellId = idMatch ? idMatch[1] : '';
    const parentId = parentMatch ? parentMatch[1] : '';
    const originalStyle = styleMatch[1];

    // Clean previous spotlight or dimming modifications
    const cleanStyle = originalStyle
      .replace(/opacity=\d+;?/g, '')
      .replace(/strokeWidth=[0-9.]+;?/g, '')
      .replace(/strokeColor=#[0-9a-fA-F]+;?/g, '')
      .replace(/shadow=\d+;?/g, '');

    const isCellActive =
      isOverview ||
      activeSet.has(cellId) ||
      (parentId ? activeSet.has(parentId) : false);

    let newStyle = '';
    if (isCellActive) {
      const isChild = parentId && parentId !== '1' && parentId !== '0';
      newStyle = isChild
        ? `${cleanStyle}opacity=100;`
        : `${cleanStyle}opacity=100;strokeWidth=4;strokeColor=#f59e0b;shadow=1;`;
    } else {
      newStyle = `${cleanStyle}opacity=20;`;
    }

    return fullTag.replace(`style="${originalStyle}"`, `style="${newStyle}"`);
  });
}

export function resetPresentationSpotlight(xml: string): string {
  if (!xml) return xml;
  return xml.replace(/<mxCell\b([^>]*)>/g, (fullTag, attrs) => {
    if (!/\bvertex="1"/.test(attrs)) return fullTag;
    const styleMatch = /\bstyle="([^"]*)"/.exec(attrs);
    if (!styleMatch) return fullTag;

    const originalStyle = styleMatch[1];
    const cleanStyle = originalStyle
      .replace(/opacity=\d+;?/g, '')
      .replace(/strokeWidth=[0-9.]+;?/g, '')
      .replace(/strokeColor=#[0-9a-fA-F]+;?/g, '')
      .replace(/shadow=\d+;?/g, '');

    return fullTag.replace(`style="${originalStyle}"`, `style="${cleanStyle}"`);
  });
}
