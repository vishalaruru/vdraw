/**
 * Extracts native embedded Draw.io XML from .drawio.png, .drawio.svg, or .xml files.
 * Draw.io embeds raw or URL-encoded <mxfile> XML directly in PNG tEXt/zTXt chunks or SVG defs.
 */
export async function tryExtractEmbeddedDrawioXml(file: File): Promise<string | null> {
  try {
    const fileName = file.name.toLowerCase();

    // 1. Text/XML/SVG files
    if (fileName.endsWith('.xml') || fileName.endsWith('.drawio') || fileName.endsWith('.svg') || file.type.includes('svg') || file.type.includes('xml')) {
      const text = await file.text();
      const match = /<mxfile\b[\s\S]*?<\/mxfile>|<mxGraphModel\b[\s\S]*?<\/mxGraphModel>/.exec(text);
      if (match) {
        return match[0];
      }
      // Check for content attribute inside svg tag
      const contentMatch = /\bcontent="([^"]+)"/.exec(text);
      if (contentMatch) {
        try {
          const decoded = decodeURIComponent(contentMatch[1]);
          if (decoded.includes('<mxfile') || decoded.includes('<mxGraphModel')) {
            return decoded;
          }
        } catch {}
      }
    }

    // 2. PNG files with embedded Draw.io metadata
    if (fileName.endsWith('.png') || file.type.includes('png')) {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // Search binary stream for <mxfile or <mxGraphModel or mxfile=
      let binary = '';
      const checkLength = Math.min(bytes.length, 1024 * 1024); // Check up to 1MB
      for (let i = 0; i < checkLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }

      // Check direct uncompressed XML
      const directMatch = /<mxfile\b[\s\S]*?<\/mxfile>|<mxGraphModel\b[\s\S]*?<\/mxGraphModel>/.exec(binary);
      if (directMatch) {
        return directMatch[0];
      }

      // Check URL-encoded tEXt chunk (e.g. mxfile=%3Cmxfile...)
      const urlMatch = /mxfile=([^&"\s\x00]+)/.exec(binary);
      if (urlMatch) {
        try {
          const decoded = decodeURIComponent(urlMatch[1]);
          if (decoded.includes('<mxfile') || decoded.includes('<mxGraphModel')) {
            return decoded;
          }
        } catch {}
      }

      // Check zTXt / compressed chunk or raw XML encoded
      const genericUrlMatch = /(%3Cmxfile[\s\S]*?%3C%2Fmxfile%3E|%3CmxGraphModel[\s\S]*?%3C%2FmxGraphModel%3E)/i.exec(binary);
      if (genericUrlMatch) {
        try {
          const decoded = decodeURIComponent(genericUrlMatch[1]);
          if (decoded.includes('<mxfile') || decoded.includes('<mxGraphModel')) {
            return decoded;
          }
        } catch {}
      }
    }
  } catch (err) {
    console.debug('tryExtractEmbeddedDrawioXml: no native embedded XML detected', err);
  }

  return null;
}
