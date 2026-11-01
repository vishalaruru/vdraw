import { useEffect, useRef, useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import { CloudComponentItem } from '../services/cloudComponents';

export interface DrawioEditorHandle {
  loadXml: (xml: string) => void;
  mergeXml: (xml: string) => void;
  appendXml: (xml: string) => void;
  appendCloudComponent: (comp: CloudComponentItem) => void;
  getCurrentXml: () => Promise<string>;
  getSvgData: () => Promise<string>;
  exportDiagram: (format: 'xml' | 'png' | 'svg', customFilename?: string) => void;
}

interface DrawioEditorProps {
  initialXml?: string;
  onXmlChange?: (xml: string) => void;
  onExportSuccess?: (format: string, filename: string) => void;
  className?: string;
}

function triggerFileDownload(data: string, filename: string, mimeType: string) {
  try {
    let blobUrl = '';

    if (data.startsWith('data:')) {
      const parts = data.split(',');
      const actualMime = parts[0]?.split(':')[1]?.split(';')[0] || mimeType;
      const base64Str = parts[1] || '';
      const byteCharacters = atob(base64Str);
      const byteNumbers = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteNumbers], { type: actualMime });
      blobUrl = URL.createObjectURL(blob);
    } else if (data.startsWith('<svg') || data.startsWith('<?xml')) {
      const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
      blobUrl = URL.createObjectURL(blob);
    } else {
      // Raw base64 string
      const byteCharacters = atob(data);
      const byteNumbers = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteNumbers], { type: mimeType });
      blobUrl = URL.createObjectURL(blob);
    }

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 2000);
  } catch (err) {
    console.error('File download failed, attempting direct link:', err);
    const a = document.createElement('a');
    a.href = data.startsWith('data:') ? data : `data:${mimeType};base64,${data}`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

function findMaxY(xml: string): number {
  let maxY = 0;
  const regex = /<mxGeometry[^>]*\by="(\d+)"[^>]*\bheight="(\d+)"/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const y = parseInt(match[1], 10);
    const h = parseInt(match[2], 10);
    if (y + h > maxY) maxY = y + h;
  }
  const regexSimple = /<mxGeometry[^>]*\by="(\d+)"/g;
  while ((match = regexSimple.exec(xml)) !== null) {
    const y = parseInt(match[1], 10);
    if (y > maxY) maxY = y;
  }
  return maxY;
}

function offsetXmlGeometry(xml: string, offsetY: number): string {
  if (offsetY <= 0) return xml;
  return xml.replace(/(<mxGeometry[^>]*\by=")(\d+)(")/g, (_, prefix, val, suffix) => {
    return `${prefix}${parseInt(val, 10) + offsetY}${suffix}`;
  });
}

export const DrawioEditor = forwardRef<DrawioEditorHandle, DrawioEditorProps>(
  ({ initialXml = '', onXmlChange, onExportSuccess, className = '' }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isReady, setIsReady] = useState(false);
    const xmlPromiseResolver = useRef<((xml: string) => void) | null>(null);
    const svgPromiseResolver = useRef<((svg: string) => void) | null>(null);
    const pendingExportFilenameRef = useRef<string | null>(null);

    // Keep callback refs stable across re-renders
    const onXmlChangeRef = useRef(onXmlChange);
    useEffect(() => {
      onXmlChangeRef.current = onXmlChange;
    }, [onXmlChange]);

    const onExportSuccessRef = useRef(onExportSuccess);
    useEffect(() => {
      onExportSuccessRef.current = onExportSuccess;
    }, [onExportSuccess]);

    // Infinite canvas default document (page="0", unlimited bounds)
    const defaultXml =
      initialXml ||
      `<mxfile host="Electron" agent="DrawioStudio" version="24.0.0">
  <diagram name="Infinite-Canvas" id="infinite-page">
    <mxGraphModel dx="1600" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="0" pageScale="1" pageWidth="0" pageHeight="0" background="#ffffff" scrollbars="1">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

    const currentXmlRef = useRef<string>(defaultXml);
    const lastAppendYRef = useRef<number>(100);

    const sendToEditor = useCallback((payload: Record<string, unknown>) => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(JSON.stringify(payload), '*');
      }
    }, []);

    const sendLoadDiagram = useCallback(() => {
      sendToEditor({
        action: 'load',
        xml: currentXmlRef.current,
        autosave: 1,
      });
      setIsReady(true);
    }, [sendToEditor]);

    useEffect(() => {
      const handleMessage = (evt: MessageEvent) => {
        if (!evt.data) return;

        let msg: { event?: string; xml?: string; data?: string; format?: string; message?: unknown } | null = null;

        if (typeof evt.data === 'string') {
          try {
            msg = JSON.parse(evt.data);
          } catch {
            return;
          }
        } else if (typeof evt.data === 'object') {
          msg = evt.data;
        }

        if (!msg || !msg.event) return;

        if (msg.event === 'configure') {
          // Reply to configure with all world class component libraries
          sendToEditor({
            action: 'configure',
            config: {
              defaultLibraries:
                'general;flowchart;aws4;azure;gcp2;kubernetes;cisco;uml;er;bpmn;archimate3',
              pageVisible: false,
              pageWidth: 0,
              pageHeight: 0,
              defaultFonts: ['Plus Jakarta Sans', 'Inter', 'Helvetica', 'Arial'],
            },
          });
        } else if (msg.event === 'init') {
          sendLoadDiagram();
        } else if (msg.event === 'load') {
          setIsReady(true);
        } else if (msg.event === 'save' || msg.event === 'autosave') {
          if (msg.xml) {
            currentXmlRef.current = msg.xml;
            onXmlChangeRef.current?.(msg.xml);
          }
        } else if (msg.event === 'export') {
          // If this export was requested by getCurrentXml()
          const isXmlRequest =
            msg.format === 'xml' ||
            (!msg.format && msg.xml && !msg.data) ||
            (xmlPromiseResolver.current && !msg.format && msg.data?.startsWith('<mxfile'));

          if (xmlPromiseResolver.current && isXmlRequest) {
            xmlPromiseResolver.current(msg.data || msg.xml || '');
            xmlPromiseResolver.current = null;
            return;
          }

          // If this export was requested by getSvgData()
          if (svgPromiseResolver.current && (msg.format === 'svg' || msg.data?.startsWith('<svg') || msg.data?.startsWith('data:image/svg+xml'))) {
            let svgText = msg.data || '';
            if (svgText.startsWith('data:image/svg+xml;base64,')) {
              try {
                svgText = atob(svgText.split(',')[1]);
              } catch {
                // Keep raw
              }
            } else if (svgText.startsWith('data:image/svg+xml,')) {
              svgText = decodeURIComponent(svgText.split(',')[1]);
            }
            svgPromiseResolver.current(svgText);
            svgPromiseResolver.current = null;
            return;
          }

          // Otherwise it is an image/file export (PNG, SVG)
          if (msg.data) {
            const format = msg.format || 'png';
            const filename =
              pendingExportFilenameRef.current ||
              `vdraw-${new Date().toISOString().slice(0, 10)}.${format}`;
            pendingExportFilenameRef.current = null;

            triggerFileDownload(
              msg.data,
              filename,
              format === 'png' ? 'image/png' : 'image/svg+xml'
            );
            onExportSuccessRef.current?.(format, filename);
          }
        }
      };

      window.addEventListener('message', handleMessage);

      const timer = setTimeout(() => {
        setIsReady(true);
      }, 2500);

      return () => {
        window.removeEventListener('message', handleMessage);
        clearTimeout(timer);
      };
    }, [sendToEditor, sendLoadDiagram]);

    const handleIframeLoad = () => {
      setTimeout(() => {
        sendLoadDiagram();
      }, 300);
    };

    useImperativeHandle(ref, () => ({
      loadXml: (xml: string) => {
        currentXmlRef.current = xml;
        sendToEditor({
          action: 'load',
          xml: xml,
          autosave: 1,
        });
      },
      mergeXml: (xml: string) => {
        sendToEditor({
          action: 'merge',
          xml: xml,
        });
      },
      appendXml: (xml: string) => {
        // Find the current maxY in active diagram
        const currentMaxY = findMaxY(currentXmlRef.current);
        const offset = Math.max(currentMaxY, lastAppendYRef.current) + 80;
        const adjustedXml = offsetXmlGeometry(xml, offset);

        // Update tracking pointer
        lastAppendYRef.current = offset + findMaxY(xml);

        sendToEditor({
          action: 'merge',
          xml: adjustedXml,
        });
      },
      appendCloudComponent: (comp: CloudComponentItem) => {
        const currentMaxY = findMaxY(currentXmlRef.current);
        const nextY = Math.max(currentMaxY + 60, lastAppendYRef.current + 80);
        lastAppendYRef.current = nextY + comp.height;

        const cellId = 'cloud_' + Math.random().toString(36).substring(2, 9);
        const singleCellXml = `<mxfile host="Electron" version="24.0.0">
  <diagram name="Append" id="append-id">
    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" page="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="${cellId}" value="${comp.defaultLabel}" style="${comp.style}" vertex="1" parent="1">
          <mxGeometry x="360" y="${nextY}" width="${comp.width}" height="${comp.height}" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

        sendToEditor({
          action: 'merge',
          xml: singleCellXml,
        });
      },
      getCurrentXml: () => {
        return new Promise<string>((resolve) => {
          xmlPromiseResolver.current = resolve;
          sendToEditor({
            action: 'export',
            format: 'xml',
          });
          setTimeout(() => {
            if (xmlPromiseResolver.current) {
              xmlPromiseResolver.current(currentXmlRef.current);
              xmlPromiseResolver.current = null;
            }
          }, 1500);
        });
      },
      getSvgData: () => {
        return new Promise<string>((resolve) => {
          svgPromiseResolver.current = resolve;
          sendToEditor({
            action: 'export',
            format: 'svg',
            embedXml: true,
          });
          setTimeout(() => {
            if (svgPromiseResolver.current) {
              svgPromiseResolver.current('');
              svgPromiseResolver.current = null;
            }
          }, 2000);
        });
      },
      exportDiagram: (format: 'xml' | 'png' | 'svg', customFilename?: string) => {
        pendingExportFilenameRef.current = customFilename || null;
        sendToEditor({
          action: 'export',
          format: format,
          scale: 2,
          border: 15,
          background: '#ffffff',
          embedXml: true,
        });
      },
    }));

    // Standard draw.io embed params:
    // libs=general;flowchart;aws4;azure;gcp2;kubernetes;cisco;uml;er;bpmn
    // pageVisible=0 : infinite boundless scrollable canvas
    const embedUrl =
      'https://embed.diagrams.net/?embed=1&configure=1&proto=json&spin=0&libraries=1&pageVisible=0&libs=general;flowchart;aws4;azure;gcp2;kubernetes;cisco;uml;er;bpmn';

    return (
      <div className={`relative w-full h-full bg-slate-50 overflow-hidden ${className}`}>
        {!isReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80 z-10 backdrop-blur-xs transition-opacity duration-300">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2.5"></div>
            <p className="text-slate-600 font-medium text-xs">Loading Boundless Draw.io Canvas...</p>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title="Draw.io Editor"
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          allow="clipboard-read; clipboard-write"
        />
      </div>
    );
  }
);
