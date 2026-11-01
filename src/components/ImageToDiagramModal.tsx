import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Key,
  Layers,
  Palette,
  FileCode2,
  RefreshCw,
  Database,
  History,
  Monitor,
  Camera,
} from 'lucide-react';
import { captureScreenRegion, captureCameraPhoto } from '../services/screenCapture';
import { ExtractedDiagram, ThemePreset } from '../types/diagram';
import { synthesizeDrawioXml, THEME_PALETTES } from '../services/diagramSynthesizer';
import { analyzeDiagramImage } from '../services/geminiVision';
import { SAMPLE_FLOWCHARTS, SampleFlowchartItem } from '../services/sampleDiagrams';
import {
  getRecentCachedDiagrams,
  computeImageHash,
  getCachedDiagram,
  clearDiagramCache,
  CachedDiagramEntry,
} from '../services/diagramCache';

interface ImageToDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertDiagram: (xml: string, mode: 'replace' | 'merge') => void;
}

export const ImageToDiagramModal: React.FC<ImageToDiagramModalProps> = ({
  isOpen,
  onClose,
  onInsertDiagram,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<{
    file?: File;
    dataUrl: string;
    name: string;
  } | null>(null);

  const [theme, setTheme] = useState<ThemePreset>('modern-indigo');
  const [insertMode, setInsertMode] = useState<'replace' | 'merge'>('replace');
  const [apiKey, setApiKey] = useState<string>(() => {
    return (
      localStorage.getItem('GEMINI_API_KEY') ||
      (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } })?.env?.VITE_GEMINI_API_KEY ||
      ''
    );
  });
  const [showKeyInput, setShowKeyInput] = useState(false);

  const [status, setStatus] = useState<'idle' | 'analyzing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [generatedDiagram, setGeneratedDiagram] = useState<ExtractedDiagram | null>(null);
  const [generatedXml, setGeneratedXml] = useState<string>('');
  const [xmlPreviewOpen, setXmlPreviewOpen] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const [recentCached, setRecentCached] = useState<CachedDiagramEntry[]>([]);

  // Load recent cache history on modal open
  useEffect(() => {
    if (isOpen) {
      setRecentCached(getRecentCachedDiagrams());
    }
  }, [isOpen]);

  // Modern dialog control
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  // Clipboard paste listener
  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileSelect(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const handleFileSelect = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setSelectedImage({
        file,
        dataUrl,
        name: file.name,
      });

      // Instantly check if this exact image is already in our cache layer!
      try {
        const hash = await computeImageHash(file);
        const cached = getCachedDiagram(hash);
        if (cached) {
          setGeneratedDiagram(cached.diagram);
          const xml = synthesizeDrawioXml(cached.diagram, theme);
          setGeneratedXml(xml);
          setStatus('success');
          setIsFromCache(true);
          setStatusMessage(`Loaded from Cache Layer (${cached.diagram.nodes.length} Shapes, ${cached.diagram.edges.length} Connectors)`);
          return;
        }
      } catch (err) {
        console.warn('Cache lookup failed:', err);
      }

      setStatus('idle');
      setGeneratedDiagram(null);
      setGeneratedXml('');
      setIsFromCache(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        handleFileSelect(file);
      }
    }
  };

  const handleSelectSample = (sample: SampleFlowchartItem) => {
    setSelectedImage({
      dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(sample.previewSvg)}`,
      name: sample.name + '.svg',
    });
    setGeneratedDiagram(sample.diagram);
    const xml = synthesizeDrawioXml(sample.diagram, theme);
    setGeneratedXml(xml);
    setStatus('success');
    setIsFromCache(false);
    setStatusMessage(`Loaded sample: ${sample.name}`);
  };

  const handleSelectCached = (entry: CachedDiagramEntry) => {
    setSelectedImage({
      dataUrl: entry.imagePreviewUrl || '',
      name: entry.fileName,
    });
    setGeneratedDiagram(entry.diagram);
    const xml = synthesizeDrawioXml(entry.diagram, theme);
    setGeneratedXml(xml);
    setStatus('success');
    setIsFromCache(true);
    setStatusMessage(`Loaded from Cache (${entry.diagram.nodes.length} Shapes, ${entry.diagram.edges.length} Connectors)`);
  };

  const handleProcessImage = async (forceBypassCache: boolean = false) => {
    if (!selectedImage) return;

    setStatus('analyzing');
    setStatusMessage(forceBypassCache ? 'Re-analyzing image with Gemini Vision AI...' : 'Analyzing diagram layout, shapes, text, and connectors...');

    try {
      let diagram: ExtractedDiagram;

      if (selectedImage.file) {
        const result = await analyzeDiagramImage(selectedImage.file, apiKey, forceBypassCache);
        diagram = result.diagram;
        setIsFromCache(result.fromCache || false);
        setStatusMessage(result.message || 'Diagram structure extracted!');
      } else if (generatedDiagram) {
        diagram = generatedDiagram;
      } else {
        throw new Error('No valid image data to analyze.');
      }

      setGeneratedDiagram(diagram);
      const xml = synthesizeDrawioXml(diagram, theme);
      setGeneratedXml(xml);
      setStatus('success');
      setRecentCached(getRecentCachedDiagrams());
    } catch (err: unknown) {
      console.error(err);
      setStatus('error');
      setStatusMessage(err instanceof Error ? err.message : 'Failed to analyze image');
    }
  };

  const handleApplyToCanvas = () => {
    if (!generatedXml) {
      if (generatedDiagram) {
        const xml = synthesizeDrawioXml(generatedDiagram, theme);
        onInsertDiagram(xml, insertMode);
        onClose();
      }
      return;
    }
    onInsertDiagram(generatedXml, insertMode);
    onClose();
  };

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('GEMINI_API_KEY', apiKey.trim());
    } else {
      localStorage.removeItem('GEMINI_API_KEY');
    }
    setShowKeyInput(false);
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      onClose={onClose}
      className="modal-dialog fixed inset-0 m-auto p-0 max-w-4xl w-[92vw] max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900"
    >
      <div className="flex flex-col h-full max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Architecture &amp; Flowchart Vision AI
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  Cache Layer Active
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Upload architecture diagrams, screenshots, or flowcharts. Re-uploads instantly load from cache.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Options Bar (API Key & Theme) */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-slate-700">Visual Theme:</span>
              <select
                value={theme}
                onChange={(e) => {
                  const newTheme = e.target.value as ThemePreset;
                  setTheme(newTheme);
                  if (generatedDiagram) {
                    setGeneratedXml(synthesizeDrawioXml(generatedDiagram, newTheme));
                  }
                }}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Object.entries(THEME_PALETTES).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowKeyInput(!showKeyInput)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-colors ${
                  apiKey
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                {apiKey ? 'Gemini Key Configured ✓' : 'Add Gemini API Key (Optional)'}
              </button>
            </div>
          </div>

          {/* API Key Drawer */}
          {showKeyInput && (
            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-950">
                  Google Gemini Multimodal API Key:
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Get a free key from Google AI Studio &rarr;
                </a>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Paste your AI Studio Gemini API Key here..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 bg-white border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                >
                  Save Key
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Key is stored securely in your browser&apos;s localStorage / .env.
              </p>
            </div>
          )}

          {/* Upload Area / Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              selectedImage
                ? 'border-indigo-400 bg-indigo-50/20'
                : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            {selectedImage ? (
              <div className="flex flex-col md:flex-row items-center gap-6 justify-center">
                <div className="relative group max-w-[280px] max-h-[180px] rounded-xl overflow-hidden shadow-md border border-slate-200">
                  <img
                    src={selectedImage.dataUrl}
                    alt="Uploaded preview"
                    className="w-full h-full object-contain bg-white"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                    Click to replace
                  </div>
                </div>
                <div className="text-left space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-slate-800 text-sm">{selectedImage.name}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Ready for Vision AI extraction or cached instant render.
                  </p>
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Change File
                    </button>
                    {isFromCache && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProcessImage(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-medium hover:bg-indigo-100"
                        title="Re-run Gemini AI without using cached results"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Re-run Live AI
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center shadow-inner">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">
                    Drop your architecture or flowchart image here, or{' '}
                    <span className="text-indigo-600 hover:underline">browse</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports PNG, JPG, WebP, SVG, and clipboard paste (<kbd className="px-1.5 py-0.5 rounded bg-slate-100 border text-[10px] font-mono">Cmd+V</kbd>)
                  </p>
                </div>

                {/* Instant Capture Buttons (#3) */}
                <div className="pt-2 flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setStatusMessage('Capturing screen region...');
                        const file = await captureScreenRegion();
                        handleFileSelect(file);
                      } catch (err) {
                        console.warn(err);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <Monitor className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Capture Screen Window</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setStatusMessage('Accessing whiteboard camera...');
                        const file = await captureCameraPhoto();
                        handleFileSelect(file);
                      } catch (err) {
                        console.warn(err);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#f08705]" />
                    <span>Take Whiteboard Photo</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Recent Cached Diagrams (Instant Load) */}
          {recentCached.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-indigo-600" />
                  Recent Cached Diagrams ({recentCached.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    clearDiagramCache();
                    setRecentCached([]);
                  }}
                  className="text-[11px] text-slate-400 hover:text-rose-600"
                >
                  Clear Cache
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {recentCached.map((item) => (
                  <button
                    key={item.imageHash}
                    type="button"
                    onClick={() => handleSelectCached(item)}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-xs text-left transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">
                      {item.diagram.nodes.length}n
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-800 truncate group-hover:text-indigo-600">
                        {item.diagram.title || item.fileName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.diagram.nodes.length} nodes &bull; {item.diagram.edges.length} edges
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Sample Flowcharts (Instant Test) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Or load pre-made sample diagrams
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SAMPLE_FLOWCHARTS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className="flex flex-col text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md transition-all group"
                >
                  <div
                    className="w-full h-24 mb-2 rounded-lg overflow-hidden border border-slate-100 flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: sample.previewSvg }}
                  />
                  <span className="font-semibold text-xs text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {sample.name}
                  </span>
                  <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {sample.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Status Message */}
          {status !== 'idle' && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-3 ${
                status === 'analyzing'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                  : status === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              {status === 'analyzing' && (
                <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              )}
              {status === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              )}
              {status === 'error' && (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <div className="flex-1 font-medium">{statusMessage}</div>
            </div>
          )}

          {/* Diagram Preview Details if Generated */}
          {generatedDiagram && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Extracted: {generatedDiagram.nodes.length} Shapes &bull; {generatedDiagram.edges.length} Connectors
                    {isFromCache && (
                      <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 rounded font-semibold">
                        Cached
                      </span>
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setXmlPreviewOpen(!xmlPreviewOpen)}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  {xmlPreviewOpen ? 'Hide XML' : 'Inspect Draw.io XML'}
                </button>
              </div>

              {xmlPreviewOpen && (
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {generatedXml}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center gap-4 text-xs">
            <span className="font-semibold text-slate-700">Canvas Mode:</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="insertMode"
                value="replace"
                checked={insertMode === 'replace'}
                onChange={() => setInsertMode('replace')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span>Replace Page</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="insertMode"
                value="merge"
                checked={insertMode === 'merge'}
                onChange={() => setInsertMode('merge')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span>Append / Merge</span>
            </label>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            {status !== 'success' ? (
              <button
                type="button"
                disabled={!selectedImage || status === 'analyzing'}
                onClick={() => handleProcessImage(false)}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Sparkles className="w-4 h-4" />
                {status === 'analyzing' ? 'Converting...' : 'Convert Image to Diagram'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplyToCanvas}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                Render on Draw.io Canvas
              </button>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
};
