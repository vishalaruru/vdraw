import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  Upload,
  Sparkles,
  Download,
  Image as ImageIcon,
  RotateCcw,
  Check,
  Trash2,
  History,
  Wand2,
  Undo2,
  Redo2,
  ShieldCheck,
  Radar,
  FileText,
  Activity,
  Command,
  Plus,
  Coins,
  Flame,
  Presentation,
  Table,
  FileInput,
  FileOutput,
  MessagesSquare,
  ChevronDown,
  Layers,
  FileCode,
  Timer,
  Globe,
  LayoutGrid,
  MoveHorizontal,
  MoveVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowRight,
} from 'lucide-react';
import { DrawioEditor, DrawioEditorHandle } from './components/DrawioEditor';
import { ImageToDiagramModal } from './components/ImageToDiagramModal';
import { PromptToDiagramModal } from './components/PromptToDiagramModal';
import { ReversePromptModal } from './components/ReversePromptModal';
import { ExportCodeModal } from './components/ExportCodeModal';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { WorkspaceTabs } from './components/WorkspaceTabs';
import { ArchitectureAuditDrawer } from './components/ArchitectureAuditDrawer';
import { DiagramCopilotBar } from './components/DiagramCopilotBar';
import { TechSpecModal } from './components/TechSpecModal';
import { TrafficSimulatorBar } from './components/TrafficSimulatorBar';
import { ReverseIacModal } from './components/ReverseIacModal';
import { CostEstimatorModal } from './components/CostEstimatorModal';
import { ChaosSimulatorBar } from './components/ChaosSimulatorBar';
import { ThreatModelModal } from './components/ThreatModelModal';
import { SqlToErdModal } from './components/SqlToErdModal';
import { PresentationModeOverlay } from './components/PresentationModeOverlay';
import { CommandPaletteModal, CommandItem } from './components/CommandPaletteModal';
import { SlaLatencyModal } from './components/SlaLatencyModal';
import { clearDiagramCache } from './services/diagramCache';
import { beautifyDiagramXml, LayoutOptions } from './services/diagramBeautifier';
import { saveDiagramVersion, getAllVersions } from './services/versionHistory';
import { auditArchitectureDiagram, ArchitectureAuditResult, SecurityFinding, extractTopologyFromXml } from './services/architectureAuditor';
import { generateTechSpecDocument } from './services/docGenerator';
import { modifyDiagramWithCopilot } from './services/diagramCopilot';
import { enableTrafficSimulation, disableTrafficSimulation, SimulationMode } from './services/trafficSimulator';
import { simulateBlastRadius, applyChaosStyling, resetChaosStyling, BlastRadiusResult } from './services/chaosSimulator';
import { applyPresentationSpotlight } from './services/presentationSpotlight';
import { calculateArchitectureSla, SlaCalculationReport } from './services/slaLatencyCalculator';
import { generateStandaloneInteractiveHtml } from './services/standaloneHtmlGenerator';
import { DiagramTab, DiagramVersionSnapshot } from './types/features';

const DEFAULT_BLANK_XML = `<mxfile host="Electron" version="24.0.0">
  <diagram name="Page-1" id="page-1">
    <mxGraphModel dx="1600" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="0" pageScale="1" pageWidth="0" pageHeight="0" background="#ffffff" scrollbars="1">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

export const App: React.FC = () => {
  const editorRef = useRef<DrawioEditorHandle>(null);

  // Tabs state (#6)
  const [tabs, setTabs] = useState<DiagramTab[]>(() => {
    try {
      const saved = localStorage.getItem('vdraw_workspace_tabs_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse saved tabs', e);
    }
    return [
      {
        id: 'tab_default',
        title: 'Untitled Diagram',
        xml: DEFAULT_BLANK_XML,
        modifiedAt: Date.now(),
      },
    ];
  });

  const [activeTabId, setActiveTabId] = useState<string>(() => {
    try {
      const savedActiveId = localStorage.getItem('vdraw_active_tab_id_v1');
      if (savedActiveId && tabs.some((t) => t.id === savedActiveId)) {
        return savedActiveId;
      }
    } catch (e) {
      console.error('Failed to read active tab id', e);
    }
    return tabs[0]?.id || 'tab_default';
  });

  // Current XML initialized from active tab
  const [currentXml, setCurrentXml] = useState<string>(() => {
    const active = tabs.find((t) => t.id === activeTabId);
    return active?.xml || DEFAULT_BLANK_XML;
  });

  // Modals state
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false); // #1
  const [isReversePromptOpen, setIsReversePromptOpen] = useState(false); // Reverse Prompt
  const [isExportCodeOpen, setIsExportCodeOpen] = useState(false); // #3
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false); // #4

  // Advanced Architecture Features (#1, #2, #6)
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [auditResult, setAuditResult] = useState<ArchitectureAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const [isCopilotBarOpen, setIsCopilotBarOpen] = useState(false);

  const [isTechSpecOpen, setIsTechSpecOpen] = useState(false);
  const [techSpecDoc, setTechSpecDoc] = useState('');
  const [isGeneratingSpec, setIsGeneratingSpec] = useState(false);

  // Efficiency Features: Reverse IaC, Command Palette, Traffic Simulation, Cost Estimator
  const [isReverseIacOpen, setIsReverseIacOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSimulatingTraffic, setIsSimulatingTraffic] = useState(false);
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('nominal');
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);

  // Advanced Engineering Features: Chaos Blast Radius, Threat Model, SQL ERD, Presentation Mode (#1, #2, #3, #5)
  const [isChaosActive, setIsChaosActive] = useState(false);
  const [chaosTargetNodeId, setChaosTargetNodeId] = useState('');
  const [chaosResult, setChaosResult] = useState<BlastRadiusResult | null>(null);
  const [isThreatModelOpen, setIsThreatModelOpen] = useState(false);
  const [isSqlErdOpen, setIsSqlErdOpen] = useState(false);
  const [isPresentationActive, setIsPresentationActive] = useState(false);
  const [presentationBaseXml, setPresentationBaseXml] = useState<string>('');
  const [isSlaModalOpen, setIsSlaModalOpen] = useState(false);
  const [slaReport, setSlaReport] = useState<SlaCalculationReport | null>(null);
  const [isExportingHtml, setIsExportingHtml] = useState(false);
  const [openSubMenu, setOpenSubMenu] = useState<'ai' | 'align' | 'security' | 'iac' | 'misc' | 'export' | null>(null);
  const subMenuRef = useRef<HTMLDivElement>(null);

  // Close sub-menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (subMenuRef.current && !subMenuRef.current.contains(e.target as Node)) {
        setOpenSubMenu(null);
      }
    };
    if (openSubMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openSubMenu]);

  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [isBeautifying, setIsBeautifying] = useState(false); // #2
  const [versions, setVersions] = useState<DiagramVersionSnapshot[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync tabs and active tab to localStorage
  useEffect(() => {
    localStorage.setItem('vdraw_workspace_tabs_v1', JSON.stringify(tabs));
  }, [tabs]);

  useEffect(() => {
    localStorage.setItem('vdraw_active_tab_id_v1', activeTabId);
  }, [activeTabId]);

  // Alert user before refreshing / leaving to prevent accidental loss
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Load versions
  useEffect(() => {
    setVersions(getAllVersions());
  }, []);

  const handleXmlChange = (xml: string) => {
    setCurrentXml(xml);
    setTabs((prev) => {
      const updated = prev.map((t) =>
        t.id === activeTabId ? { ...t, xml, modifiedAt: Date.now() } : t
      );
      localStorage.setItem('vdraw_workspace_tabs_v1', JSON.stringify(updated));
      return updated;
    });
  };

  // Rename tab
  const handleRenameTab = (id: string, newTitle: string) => {
    setTabs((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, title: newTitle } : t));
      localStorage.setItem('vdraw_workspace_tabs_v1', JSON.stringify(updated));
      return updated;
    });
    showToast(`Renamed tab to "${newTitle}" ✓`);
  };

  // Handle Switching Tabs (#6)
  const handleSelectTab = (id: string) => {
    const target = tabs.find((t) => t.id === id);
    if (!target) return;
    setActiveTabId(id);
    editorRef.current?.loadXml(target.xml);
    setCurrentXml(target.xml);
  };

  const handleNewTab = () => {
    const newId = 'tab_' + Date.now().toString(36);
    const newTab: DiagramTab = {
      id: newId,
      title: `Diagram ${tabs.length + 1}`,
      xml: DEFAULT_BLANK_XML,
      modifiedAt: Date.now(),
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
    editorRef.current?.loadXml(DEFAULT_BLANK_XML);
    setCurrentXml(DEFAULT_BLANK_XML);
    showToast(`Created ${newTab.title}`);
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const remaining = tabs.filter((t) => t.id !== id);
    setTabs(remaining);
    if (activeTabId === id) {
      const next = remaining[remaining.length - 1];
      setActiveTabId(next.id);
      editorRef.current?.loadXml(next.xml);
      setCurrentXml(next.xml);
    }
  };

  // Push state to undo history
  const pushUndoState = (xml: string) => {
    setUndoStack((prev) => [...prev.slice(-20), xml]);
    setRedoStack([]); // Clear redo upon new action
  };

  // Insert Diagram (From Image AI or Prompt AI)
  const handleInsertDiagram = (xml: string, mode: 'replace' | 'merge' = 'replace') => {
    pushUndoState(currentXml);

    // Save version snapshot before applying (#4)
    saveDiagramVersion(activeTabId, currentXml, 'Before AI Import');
    setVersions(getAllVersions());

    if (mode === 'replace') {
      editorRef.current?.loadXml(xml);
      setCurrentXml(xml);
      showToast('Rendered diagram on canvas');
    } else {
      editorRef.current?.appendXml(xml);
      showToast('Appended diagram below');
    }
  };

  // AI Beautifier & Auto-Layout (#2)
  const handleBeautifyCanvas = async (
    mode: LayoutOptions['mode'] = 'smart-beautify',
    label = 'Auto-Align & Beautify'
  ) => {
    try {
      const xmlToProcess = (await editorRef.current?.getCurrentXml()) || currentXml;
      if (!xmlToProcess || xmlToProcess.length < 200) {
        showToast('Canvas is empty');
        return;
      }

      pushUndoState(xmlToProcess);

      setIsBeautifying(true);
      showToast(`Applying ${label}...`);

      // Save version snapshot before layout change
      saveDiagramVersion(activeTabId, xmlToProcess, `Before ${label}`);
      setVersions(getAllVersions());

      const { xml: cleanedXml } = await beautifyDiagramXml(xmlToProcess, { mode });
      editorRef.current?.loadXml(cleanedXml);
      setCurrentXml(cleanedXml);
      showToast(`${label} applied cleanly!`);
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Layout failed');
    } finally {
      setIsBeautifying(false);
    }
  };

  // 1-Click Undo Handler
  const handleUndo = () => {
    if (undoStack.length === 0) {
      showToast('Nothing to undo');
      return;
    }
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, currentXml]);

    editorRef.current?.loadXml(previous);
    setCurrentXml(previous);
    showToast('Undo: Reverted changes');
  };

  // 1-Click Redo Handler
  const handleRedo = () => {
    if (redoStack.length === 0) {
      showToast('Nothing to redo');
      return;
    }
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, currentXml]);

    editorRef.current?.loadXml(next);
    setCurrentXml(next);
    showToast('Redo: Restored changes');
  };

  const handleExportXml = async () => {
    try {
      const xml = (await editorRef.current?.getCurrentXml()) || currentXml;
      const activeTab = tabs.find((t) => t.id === activeTabId);
      const cleanTitle = (activeTab?.title || 'vdraw').trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'vdraw';
      const filename = `${cleanTitle}-${new Date().toISOString().slice(0, 10)}.drawio`;
      const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Downloaded ${filename} to your Downloads folder! ✓`);
    } catch (err) {
      console.error(err);
      showToast('Failed to export XML');
    }
  };

  const handleExportFormat = (format: 'png' | 'svg') => {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    const cleanTitle = (activeTab?.title || 'vdraw').trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'vdraw';
    const filename = `${cleanTitle}-${new Date().toISOString().slice(0, 10)}.${format}`;
    showToast(`Generating high-resolution ${format.toUpperCase()}...`);
    editorRef.current?.exportDiagram(format, filename);
  };

  // Feature #2: Latency, SLA & Availability Calculator
  const handleOpenSlaCalculator = async () => {
    try {
      const xmlToProcess = (await editorRef.current?.getCurrentXml()) || currentXml;
      const topology = extractTopologyFromXml(xmlToProcess);
      const report = calculateArchitectureSla(topology);
      setSlaReport(report);
      setIsSlaModalOpen(true);
    } catch (err) {
      console.error('Failed to calculate SLA', err);
      showToast('Error calculating SLA and latency profile');
    }
  };

  // Feature #4: Shareable Interactive Standalone HTML Export
  const handleExportStandaloneHtml = async () => {
    setIsExportingHtml(true);
    showToast('Generating standalone interactive architecture viewer...');
    try {
      const xmlToProcess = (await editorRef.current?.getCurrentXml()) || currentXml;
      const topology = extractTopologyFromXml(xmlToProcess);
      const sla = calculateArchitectureSla(topology);
      const svg = (await editorRef.current?.getSvgData()) || '';
      const activeTab = tabs.find((t) => t.id === activeTabId);
      const title = activeTab?.title || 'Architecture Diagram';

      const html = generateStandaloneInteractiveHtml({
        title,
        svgContent:
          svg ||
          `<svg width="900" height="600" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg"><rect width="900" height="600" fill="#f8fafc" rx="12"/><text x="450" y="300" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="bold" font-size="22" fill="#334155">${title}</text></svg>`,
        topology,
        slaReport: sla,
      });

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-interactive.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      showToast(`Exported standalone interactive HTML: "${a.download}" ✓`);
    } catch (err) {
      console.error('Failed to export interactive HTML', err);
      showToast('Error generating interactive HTML export');
    } finally {
      setIsExportingHtml(false);
    }
  };

  const handleClearCanvas = () => {
    if (confirm('Clear canvas?')) {
      saveDiagramVersion(activeTabId, currentXml, 'Before Canvas Clear');
      setVersions(getAllVersions());
      editorRef.current?.loadXml(DEFAULT_BLANK_XML);
      setCurrentXml(DEFAULT_BLANK_XML);
      showToast('Canvas cleared');
    }
  };

  const handleClearCache = () => {
    const count = clearDiagramCache();
    showToast(`Cleared ${count} cached diagram(s)`);
  };

  // Feature #1: Architecture Security & Resilience Audit
  const handleAuditDiagram = async () => {
    try {
      const xmlToProcess = (await editorRef.current?.getCurrentXml()) || currentXml;
      if (!xmlToProcess || xmlToProcess.length < 200) {
        showToast('Canvas is empty');
        return;
      }
      setIsAuditing(true);
      setIsAuditDrawerOpen(true);
      const result = await auditArchitectureDiagram(xmlToProcess);
      setAuditResult(result);
      showToast(`Audit complete: Score ${result.overallScore}/100`);
    } catch (err) {
      console.error(err);
      showToast('Audit failed');
    } finally {
      setIsAuditing(false);
    }
  };

  // Feature #2: Diagram Copilot Apply
  const handleCopilotApply = (newXml: string, summary: string) => {
    pushUndoState(currentXml);
    saveDiagramVersion(activeTabId, currentXml, `Copilot: ${summary.slice(0, 30)}`);
    setVersions(getAllVersions());
    editorRef.current?.loadXml(newXml);
    setCurrentXml(newXml);
    showToast(`Copilot applied: ${summary}`);
  };

  // Feature #6: Tech Spec & ADR Document Generator
  const handleGenerateTechSpec = async () => {
    try {
      const xmlToProcess = (await editorRef.current?.getCurrentXml()) || currentXml;
      if (!xmlToProcess || xmlToProcess.length < 200) {
        showToast('Canvas is empty');
        return;
      }
      setIsGeneratingSpec(true);
      setIsTechSpecOpen(true);
      const doc = await generateTechSpecDocument(xmlToProcess);
      setTechSpecDoc(doc);
      showToast('Architecture Spec & ADR generated!');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate spec');
    } finally {
      setIsGeneratingSpec(false);
    }
  };

  // Feature #1: Auto-Fix Finding in Audit Drawer
  const handleAutoFixAuditFinding = async (finding: SecurityFinding) => {
    try {
      const xmlToProcess = (await editorRef.current?.getCurrentXml()) || currentXml;
      showToast(`Auto-fixing ${finding.title}...`);
      const prompt = `Auto-fix architecture finding: ${finding.title}. Remediate: ${finding.recommendation}. Affected components: ${finding.affectedComponents.join(', ')}. Ensure the new component is inserted and cleanly connected without crossing lines.`;
      const { xml: newXml, explanation } = await modifyDiagramWithCopilot(xmlToProcess, prompt);

      pushUndoState(currentXml);
      saveDiagramVersion(activeTabId, currentXml, `Auto-Fix: ${finding.title}`);
      setVersions(getAllVersions());
      editorRef.current?.loadXml(newXml);
      setCurrentXml(newXml);
      showToast(`Auto-Fix applied: ${explanation.slice(0, 40)}`);

      // Automatically re-run audit on fixed architecture
      setIsAuditing(true);
      const updatedAudit = await auditArchitectureDiagram(newXml);
      setAuditResult(updatedAudit);
      setIsAuditing(false);
    } catch (err) {
      console.error(err);
      showToast('Auto-Fix failed');
      setIsAuditing(false);
    }
  };

  // Feature #6: Traffic Flow Simulator
  const handleToggleTrafficSimulation = async (targetMode?: SimulationMode) => {
    const xmlToProcess = (await editorRef.current?.getCurrentXml()) || currentXml;
    if (!xmlToProcess || xmlToProcess.length < 200) {
      showToast('Canvas is empty');
      return;
    }

    if (isSimulatingTraffic && !targetMode) {
      handleStopTrafficSimulation();
      return;
    }

    const m = targetMode || simulationMode;
    setSimulationMode(m);
    const animatedXml = enableTrafficSimulation(xmlToProcess, m);
    editorRef.current?.loadXml(animatedXml);
    setCurrentXml(animatedXml);
    setIsSimulatingTraffic(true);
    showToast(`Simulating ${m.toUpperCase()} traffic flow`);
  };

  const handleStopTrafficSimulation = async () => {
    const xmlToProcess = (await editorRef.current?.getCurrentXml()) || currentXml;
    const cleanXml = disableTrafficSimulation(xmlToProcess);
    editorRef.current?.loadXml(cleanXml);
    setCurrentXml(cleanXml);
    setIsSimulatingTraffic(false);
    showToast('Traffic simulation stopped');
  };

  // Feature #1: Chaos Engineering Blast Radius
  const topologyNodes = useMemo(() => extractTopologyFromXml(currentXml).nodes, [currentXml]);

  const handleStartChaos = async (targetId?: string) => {
    const xmlToProcess = (await editorRef.current?.getCurrentXml()) || currentXml;
    const nodes = extractTopologyFromXml(xmlToProcess).nodes;
    if (nodes.length === 0) {
      showToast('Canvas has no components to test');
      return;
    }

    const target = targetId || nodes.find((n) => n.type === 'database')?.id || nodes[0].id;
    setChaosTargetNodeId(target);

    try {
      const result = simulateBlastRadius(xmlToProcess, target);
      setChaosResult(result);
      const chaosXml = applyChaosStyling(xmlToProcess, result);
      editorRef.current?.loadXml(chaosXml);
      setCurrentXml(chaosXml);
      setIsChaosActive(true);
      showToast(`Chaos Injected: [${result.failedNode.label}] Outage!`);
    } catch (err) {
      console.error(err);
      showToast('Chaos simulation failed');
    }
  };

  const handleSelectChaosTarget = async (nodeId: string) => {
    setChaosTargetNodeId(nodeId);
    handleStartChaos(nodeId);
  };

  const handleStopChaos = async () => {
    const xmlToProcess = (await editorRef.current?.getCurrentXml()) || currentXml;
    const cleanXml = resetChaosStyling(xmlToProcess);
    editorRef.current?.loadXml(cleanXml);
    setCurrentXml(cleanXml);
    setIsChaosActive(false);
    setChaosResult(null);
    showToast('Chaos Monkey stopped. System restored.');
  };

  // Feature #5: Presentation & Architecture Walkthrough Mode
  const handleStartPresentation = async () => {
    let xmlToProcess = currentXml;
    if (!xmlToProcess || xmlToProcess.length < 200) {
      xmlToProcess = (await editorRef.current?.getCurrentXml()) || currentXml;
    }
    if (!xmlToProcess || xmlToProcess.length < 150) {
      showToast('Canvas is empty. Add components to present.');
      return;
    }
    setPresentationBaseXml(xmlToProcess);
    setIsPresentationActive(true);
    showToast('Starting Architecture Walkthrough Mode');
  };

  const handlePresentationFocus = (nodeIds: string[], isOverview?: boolean) => {
    const base = presentationBaseXml || currentXml;
    if (!base || base.length < 50) return;
    const spotlightXml = applyPresentationSpotlight(base, nodeIds, isOverview);
    editorRef.current?.loadXml(spotlightXml);
  };

  const handleStopPresentation = async () => {
    if (presentationBaseXml) {
      editorRef.current?.loadXml(presentationBaseXml);
      setCurrentXml(presentationBaseXml);
      setPresentationBaseXml('');
    }
    setIsPresentationActive(false);
    showToast('Exited Walkthrough Mode. Canvas restored.');
  };

  // Purge any stale revoked API key from browser localStorage on startup
  useEffect(() => {
    try {
      const stored = localStorage.getItem('GEMINI_API_KEY');
      if (stored && stored.includes('AIzaSyBCdBG4Cu')) {
        localStorage.removeItem('GEMINI_API_KEY');
      }
    } catch {
      // Ignore
    }
  }, []);

  // Global Keyboard Shortcuts (Cmd+K, Cmd+S, Cmd+Z, Cmd+Shift+Z) (#2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      // Cmd+K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Cmd+S / Ctrl+S (Save .drawio)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleExportXml();
        return;
      }

      if (isInput) return;

      // Cmd+Shift+Z / Cmd+Y (Redo)
      if (
        (e.metaKey || e.ctrlKey) &&
        ((e.shiftKey && e.key.toLowerCase() === 'z') || e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Cmd+Z (Undo)
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentXml, undoStack, redoStack, activeTabId]);

  // Command Palette Items (#2)
  const commandItems: CommandItem[] = useMemo(() => [
    {
      id: 'cmd_reverse_prompt',
      title: 'Architecture → AI Prompt (Reverse Prompt)',
      subtitle: 'Extract reproducible AI prompt, RFC specification & Mermaid flow from canvas',
      category: 'AI & Analysis',
      icon: <Sparkles className="w-4 h-4 text-purple-600" />,
      action: () => setIsReversePromptOpen(true),
    },
    {
      id: 'cmd_audit',
      title: 'Run Security & SOLID Audit',
      subtitle: 'Zero-Trust, SPOF, and Well-Architected Framework Linter',
      category: 'AI & Analysis',
      icon: <ShieldCheck className="w-4 h-4 text-rose-500" />,
      action: handleAuditDiagram,
    },
    {
      id: 'cmd_cost_estimate',
      title: 'Estimate Cloud Cost & FinOps Savings',
      subtitle: 'AWS, GCP, Azure retail pricing breakdown & budget optimization',
      category: 'AI & Analysis',
      icon: <Coins className="w-4 h-4 text-emerald-500" />,
      action: () => setIsCostModalOpen(true),
    },
    {
      id: 'cmd_chaos_simulation',
      title: 'Chaos Monkey & Blast Radius Simulator',
      subtitle: 'Inject component outages to test cascading failure resilience',
      category: 'Simulation & IaC',
      icon: <Flame className="w-4 h-4 text-rose-500" />,
      action: () => handleStartChaos(),
    },
    {
      id: 'cmd_threat_model',
      title: 'STRIDE Threat Modeling & Attack Surface',
      subtitle: 'Analyze Spoofing, Tampering, Info Disclosure, and DoS vectors',
      category: 'AI & Analysis',
      icon: <Radar className="w-4 h-4 text-purple-600" />,
      action: () => setIsThreatModelOpen(true),
    },
    {
      id: 'cmd_presentation_mode',
      title: 'Interactive Presentation Walkthrough',
      subtitle: 'Step-by-step architecture presentation slide deck',
      category: 'Documentation',
      icon: <Presentation className="w-4 h-4 text-amber-500" />,
      action: () => handleStartPresentation(),
    },
    {
      id: 'cmd_sql_erd',
      title: 'Database Schema to ERD Visualizer',
      subtitle: 'Import SQL DDL or Prisma schema into Entity Relationship Diagrams',
      category: 'Simulation & IaC',
      icon: <Table className="w-4 h-4 text-emerald-500" />,
      action: () => setIsSqlErdOpen(true),
    },
    {
      id: 'cmd_sla_latency',
      title: 'Latency, SLA & Availability Calculator',
      subtitle: 'Calculate composite uptime, downtime budget & critical latency bottlenecks',
      category: 'AI & Analysis',
      icon: <Timer className="w-4 h-4 text-teal-500" />,
      action: handleOpenSlaCalculator,
    },
    {
      id: 'cmd_export_html',
      title: 'Export Standalone Interactive HTML',
      subtitle: 'Self-contained offline viewer with pan, zoom, search & inspector',
      category: 'Documentation',
      icon: <Globe className="w-4 h-4 text-orange-500" />,
      action: handleExportStandaloneHtml,
    },
    {
      id: 'cmd_autofix_flow',
      title: 'Simulate Request Traffic Flow',
      subtitle: 'Live animated SVG pulse visualization across components',
      category: 'Simulation & IaC',
      icon: <Activity className="w-4 h-4 text-emerald-500" />,
      action: () => handleToggleTrafficSimulation(),
    },
    {
      id: 'cmd_reverse_iac',
      title: 'Reverse IaC: Code to Architecture Diagram',
      subtitle: 'Import Terraform HCL, Docker Compose, or Kubernetes YAML',
      category: 'Simulation & IaC',
      icon: <FileInput className="w-4 h-4 text-[#f08705]" />,
      action: () => setIsReverseIacOpen(true),
    },
    {
      id: 'cmd_conversational_draw',
      title: 'Conversational Draw (Chat to Edit)',
      subtitle: 'Modify & evolve architecture diagram using natural language',
      category: 'AI & Analysis',
      icon: <MessagesSquare className="w-4 h-4 text-amber-500" />,
      action: () => setIsCopilotBarOpen((prev) => !prev),
    },
    {
      id: 'cmd_beautify',
      title: 'Auto-Align & Clean Layout',
      subtitle: 'Enforce orthogonal routing & neat spacing',
      category: 'AI & Analysis',
      icon: <Sparkles className="w-4 h-4 text-indigo-500" />,
      action: handleBeautifyCanvas,
    },
    {
      id: 'cmd_tech_spec',
      title: 'Generate Architecture Spec & ADR',
      subtitle: 'Export markdown documentation for Notion, Confluence, and GitHub',
      category: 'Documentation',
      icon: <FileText className="w-4 h-4 text-indigo-500" />,
      action: handleGenerateTechSpec,
    },
    {
      id: 'cmd_prompt',
      title: 'Prompt to Architecture',
      subtitle: 'Generate full architecture flowcharts from text descriptions',
      category: 'AI & Analysis',
      icon: <Wand2 className="w-4 h-4 text-[#f08705]" />,
      action: () => setIsPromptModalOpen(true),
    },
    {
      id: 'cmd_upload',
      title: 'Upload Diagram Image / Screenshot',
      subtitle: 'Vision AI extracts shapes and connectors',
      category: 'AI & Analysis',
      icon: <Upload className="w-4 h-4 text-indigo-500" />,
      action: () => setIsImageModalOpen(true),
    },
    {
      id: 'cmd_export_code',
      title: 'Export to Terraform & Mermaid.js',
      subtitle: 'Generate Infrastructure as Code (HCL & Compose)',
      category: 'Simulation & IaC',
      icon: <FileOutput className="w-4 h-4 text-indigo-500" />,
      action: () => setIsExportCodeOpen(true),
    },
    {
      id: 'cmd_history',
      title: 'Version & Revision History',
      subtitle: 'Restore previous diagram snapshots',
      category: 'History',
      icon: <History className="w-4 h-4 text-emerald-500" />,
      action: () => setIsVersionHistoryOpen(true),
    },
    {
      id: 'cmd_save',
      title: 'Save .drawio File',
      subtitle: 'Download XML diagram file',
      category: 'Canvas & Export',
      shortcut: '⌘S',
      icon: <Download className="w-4 h-4 text-slate-700" />,
      action: handleExportXml,
    },
    {
      id: 'cmd_png',
      title: 'Export High-Resolution PNG',
      subtitle: 'Download 2x retina PNG to Downloads folder',
      category: 'Canvas & Export',
      icon: <ImageIcon className="w-4 h-4 text-slate-700" />,
      action: () => handleExportFormat('png'),
    },
    {
      id: 'cmd_new_tab',
      title: 'Create New Diagram Tab',
      subtitle: 'Open an independent boundless canvas tab',
      category: 'Canvas & Export',
      icon: <Plus className="w-4 h-4 text-[#f08705]" />,
      action: handleNewTab,
    },
    {
      id: 'cmd_undo',
      title: 'Undo Last Action',
      subtitle: 'Revert last change',
      category: 'Canvas & Export',
      shortcut: '⌘Z',
      icon: <Undo2 className="w-4 h-4 text-amber-600" />,
      action: handleUndo,
    },
    {
      id: 'cmd_redo',
      title: 'Redo Undone Action',
      subtitle: 'Re-apply changes',
      category: 'Canvas & Export',
      shortcut: '⇧⌘Z',
      icon: <Redo2 className="w-4 h-4 text-emerald-600" />,
      action: handleRedo,
    },
    {
      id: 'cmd_clear_cache',
      title: 'Clear AI Cache',
      subtitle: 'Wipe cached SHA-256 vision hashes',
      category: 'Canvas & Export',
      icon: <Trash2 className="w-4 h-4 text-rose-500" />,
      action: handleClearCache,
    },
    {
      id: 'cmd_clear_canvas',
      title: 'Clear Canvas',
      subtitle: 'Reset active diagram to blank',
      category: 'Canvas & Export',
      icon: <RotateCcw className="w-4 h-4 text-rose-500" />,
      action: handleClearCanvas,
    },
  ], [currentXml, isSimulatingTraffic, simulationMode, activeTabId]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#fbfbfb] font-sans antialiased text-[#333333]">
      {/* Top Professional Header Bar */}
      <header
        className={`h-20 bg-[#fbfbfb] border-b border-[#e5e5e5] px-4 flex items-center justify-between z-20 select-none transition-all duration-300 ${
          isPresentationActive ? 'hidden' : ''
        }`}
      >
        {/* Left: vish.al Prominent Brand Logo + Integrated Workspace Tabs */}
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Prominent Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer group select-none shrink-0" title="vish.al — Intelligent Architecture Studio">
            <div className="h-[70px] w-auto p-1 bg-[#101012] rounded-xl border border-slate-800 shadow-md flex items-center justify-center overflow-hidden">
              <img
                src="/logo.jpg"
                alt="vish.al"
                className="h-full w-auto max-h-[66px] object-contain transition-transform group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center text-2xl font-black tracking-tight text-slate-900 leading-none">
                <span>vish</span>
                <span className="text-[#f08705] flex items-center">
                  .al
                  <span className="relative flex items-center justify-center ml-1">
                    <Sparkles className="w-4 h-4 text-[#f08705] animate-pulse drop-shadow-[0_0_8px_rgba(240,135,5,0.7)]" />
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  </span>
                </span>
              </div>
              <span className="text-[9.5px] font-bold text-slate-400 tracking-wider uppercase mt-1 leading-tight">
                Intelligent<br />Architecture Studio
              </span>
            </div>
          </div>

          <div className="w-[1px] h-10 bg-slate-200 mx-1 hidden sm:block shrink-0" />

          {/* Integrated Workspace Tabs (Renamable & Persistent) */}
          <WorkspaceTabs
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={handleSelectTab}
            onNewTab={handleNewTab}
            onCloseTab={handleCloseTab}
            onRenameTab={handleRenameTab}
            className="max-w-[280px] sm:max-w-[360px]"
          />

          {/* Real-time Auto-save Badge */}
          <div
            className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[10px] font-semibold text-emerald-700 select-none shadow-2xs shrink-0"
            title="Auto-saved to local browser storage in real time"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Auto-saved</span>
          </div>
        </div>

        {/* Right: Grouped Sub-Menus & Actions */}
        <div ref={subMenuRef} className="flex items-center gap-1.5 text-[12px] shrink-0">
          {/* Undo Button */}
          {undoStack.length > 0 && (
            <button
              type="button"
              onClick={handleUndo}
              title="Undo last change (⌘Z)"
              className="flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-[5px] text-[11px] font-semibold transition-all animate-in fade-in duration-150 cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden xl:inline">Undo</span>
            </button>
          )}

          {/* Redo Button */}
          {redoStack.length > 0 && (
            <button
              type="button"
              onClick={handleRedo}
              title="Redo undone change (⇧⌘Z)"
              className="flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-[5px] text-[11px] font-semibold transition-all animate-in fade-in duration-150 cursor-pointer"
            >
              <Redo2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden xl:inline">Redo</span>
            </button>
          )}

          {/* Group 1: AI (Upload, Conversational, Prompt) with gif/motion */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenSubMenu(openSubMenu === 'ai' ? null : 'ai')}
              className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] text-[12px] font-bold transition-all border cursor-pointer ${
                openSubMenu === 'ai'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent shadow-xs ring-1 ring-orange-300'
                  : 'bg-gradient-to-r from-orange-50 via-amber-50/60 to-indigo-50/60 hover:from-orange-100 hover:to-indigo-100 text-slate-800 border-orange-200/90 shadow-2xs'
              }`}
              title="AI Studio: Vision Upload, Prompt to Architecture, Conversational Draw"
            >
              <div className="relative flex items-center justify-center">
                <Sparkles className={`w-3.5 h-3.5 ${openSubMenu === 'ai' ? 'text-white' : 'text-[#f08705]'} animate-pulse`} />
                <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500"></span>
                </span>
              </div>
              <span className="tracking-tight">AI</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-150 ${
                  openSubMenu === 'ai' ? 'rotate-180 text-white' : 'text-slate-400'
                }`}
              />
            </button>

            {openSubMenu === 'ai' && (
              <div className="absolute right-0 mt-1.5 w-80 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                  <span>vish.al Generative Engine</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                    v2.0
                  </span>
                </div>

                {/* 1. Upload Diagram Image with scanning laser motion */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenSubMenu(null);
                    setIsImageModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-orange-50/70 transition-colors group cursor-pointer"
                >
                  <div className="relative w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-200 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                    <Upload className="w-4 h-4 text-orange-600" />
                    {/* Animated scanning laser motion */}
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-scan-line" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-bold text-slate-800 group-hover:text-orange-700">
                        Upload Diagram Image
                      </span>
                      <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-orange-100 text-orange-700 rounded">
                        Vision
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Whiteboard sketch or architecture screenshot to nodes
                    </div>
                  </div>
                </button>

                {/* 2. Prompt to Architecture with glowing wand motion */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenSubMenu(null);
                    setIsPromptModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-amber-50/70 transition-colors group cursor-pointer"
                >
                  <div className="relative w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-200 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                    <Wand2 className="w-4 h-4 text-amber-600 animate-ai-glow" />
                    <Sparkles className="w-2.5 h-2.5 text-amber-500 absolute top-1 right-1 animate-ping" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-bold text-slate-800 group-hover:text-amber-700">
                        Prompt to Architecture
                      </span>
                      <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-amber-100 text-amber-700 rounded">
                        GenAI
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Generate cloud topologies from natural language
                    </div>
                  </div>
                </button>

                {/* 3. Conversational Draw with soundwave audio motion */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenSubMenu(null);
                    setIsCopilotBarOpen((prev) => !prev);
                  }}
                  className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors group cursor-pointer ${
                    isCopilotBarOpen ? 'bg-indigo-50/80 hover:bg-indigo-100/70' : 'hover:bg-indigo-50/70'
                  }`}
                >
                  <div className="relative w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-200 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                    <MessagesSquare className="w-4 h-4 text-indigo-600" />
                    {/* Animated soundwave bars */}
                    <div className="absolute bottom-1 right-1 flex items-end gap-0.5 h-2.5">
                      <span className="w-0.5 bg-indigo-500 rounded-full animate-soundwave-1" />
                      <span className="w-0.5 bg-indigo-500 rounded-full animate-soundwave-2" />
                      <span className="w-0.5 bg-indigo-500 rounded-full animate-soundwave-3" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-bold text-slate-800 group-hover:text-indigo-700">
                          Conversational Draw
                        </span>
                        <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-indigo-100 text-indigo-700 rounded">
                          Chat
                        </span>
                      </div>
                      {isCopilotBarOpen && (
                        <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-indigo-600 text-white rounded">
                          OPEN
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Evolve & refactor components via interactive dialogue
                    </div>
                  </div>
                </button>

                {/* 4. Architecture to AI Prompt (Reverse Prompt) */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenSubMenu(null);
                    setIsReversePromptOpen(true);
                  }}
                  className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-purple-50/70 transition-colors group cursor-pointer border-t border-slate-100/80"
                >
                  <div className="relative w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-200 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <div className="absolute inset-0 bg-purple-400/10 animate-ping rounded-lg pointer-events-none" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-bold text-slate-800 group-hover:text-purple-700">
                        Architecture → AI Prompt
                      </span>
                      <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-purple-100 text-purple-700 rounded">
                        Reverse AI
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Extract reproducible prompt & RFC spec from canvas
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Group 2: Align & Simulate */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenSubMenu(openSubMenu === 'align' ? null : 'align')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] text-[12px] font-semibold transition-all border cursor-pointer ${
                openSubMenu === 'align'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent shadow-xs ring-1 ring-emerald-300'
                  : isSimulatingTraffic
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-600 shadow-xs animate-pulse'
                  : 'bg-gradient-to-r from-emerald-50 via-teal-50/80 to-green-50/80 hover:from-emerald-100 hover:to-teal-100 text-emerald-900 border-emerald-200/90 shadow-2xs'
              }`}
              title="Align & Flow: Auto-Align, Traffic Simulation"
            >
              <Activity className={`w-3.5 h-3.5 ${openSubMenu === 'align' || isSimulatingTraffic ? 'text-white' : 'text-emerald-600'}`} />
              <span className="hidden sm:inline">Align & Flow</span>
              {isSimulatingTraffic && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-150 ${
                  openSubMenu === 'align' ? 'rotate-180 text-white' : 'text-emerald-700/60'
                }`}
              />
            </button>

            {openSubMenu === 'align' && (
              <div className="absolute right-0 mt-1.5 w-76 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Draw.io Arrange, Align & Layout
                </div>

                {/* 1. Auto-Align & Deconflict */}
                <button
                  type="button"
                  disabled={isBeautifying}
                  onClick={() => {
                    setOpenSubMenu(null);
                    handleBeautifyCanvas('smart-beautify', 'Auto-Align & Beautify');
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-emerald-50/70 transition-colors group cursor-pointer disabled:opacity-50"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-slate-800 group-hover:text-emerald-700">
                      {isBeautifying ? 'Aligning Layout...' : 'Auto-Align & Beautify'}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Deconflict overlaps, balance columns & snap grid
                    </div>
                  </div>
                </button>

                {/* 2. Hierarchical Flow (Left-to-Right) */}
                <button
                  type="button"
                  disabled={isBeautifying}
                  onClick={() => {
                    setOpenSubMenu(null);
                    handleBeautifyCanvas('flow-left-to-right', 'Left-to-Right Flow');
                  }}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-emerald-50/70 transition-colors group cursor-pointer disabled:opacity-50"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-slate-800 group-hover:text-blue-700">
                      Horizontal Flow (Left ➔ Right)
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Sugiyama DAG layered columns (Draw.io Layout)
                    </div>
                  </div>
                </button>

                {/* 3. Hierarchical Flow (Top-to-Bottom) */}
                <button
                  type="button"
                  disabled={isBeautifying}
                  onClick={() => {
                    setOpenSubMenu(null);
                    handleBeautifyCanvas('flow-top-to-bottom', 'Top-to-Bottom Flow');
                  }}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-emerald-50/70 transition-colors group cursor-pointer disabled:opacity-50"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <LayoutGrid className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-slate-800 group-hover:text-indigo-700">
                      Vertical Flow (Top ➔ Bottom)
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Sequential top-down hierarchical ranks
                    </div>
                  </div>
                </button>

                <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-t border-slate-100 mt-1">
                  Equidistant Spacing (Distribute)
                </div>

                {/* 4. Distribute Horizontally */}
                <button
                  type="button"
                  disabled={isBeautifying}
                  onClick={() => {
                    setOpenSubMenu(null);
                    handleBeautifyCanvas('distribute-horizontal', 'Distribute Horizontally');
                  }}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-slate-50 transition-colors group cursor-pointer disabled:opacity-50"
                >
                  <MoveHorizontal className="w-4 h-4 text-slate-500 group-hover:text-slate-800 ml-1.5" />
                  <span className="text-[12px] font-medium text-slate-700 group-hover:text-slate-900">
                    Distribute Horizontally
                  </span>
                </button>

                {/* 5. Distribute Vertically */}
                <button
                  type="button"
                  disabled={isBeautifying}
                  onClick={() => {
                    setOpenSubMenu(null);
                    handleBeautifyCanvas('distribute-vertical', 'Distribute Vertically');
                  }}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-slate-50 transition-colors group cursor-pointer disabled:opacity-50"
                >
                  <MoveVertical className="w-4 h-4 text-slate-500 group-hover:text-slate-800 ml-1.5" />
                  <span className="text-[12px] font-medium text-slate-700 group-hover:text-slate-900">
                    Distribute Vertically
                  </span>
                </button>

                <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-t border-slate-100 mt-1">
                  Quick Align
                </div>

                {/* 6. Align Rows */}
                <div className="px-3 py-1 grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenSubMenu(null);
                      handleBeautifyCanvas('align-left', 'Align Left');
                    }}
                    className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <AlignLeft className="w-3 h-3" />
                    Left
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenSubMenu(null);
                      handleBeautifyCanvas('align-center', 'Align Center');
                    }}
                    className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <AlignCenter className="w-3 h-3" />
                    Center
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenSubMenu(null);
                      handleBeautifyCanvas('align-right', 'Align Right');
                    }}
                    className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <AlignRight className="w-3 h-3" />
                    Right
                  </button>
                </div>

                <div className="px-3 py-1 grid grid-cols-3 gap-1 pb-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenSubMenu(null);
                      handleBeautifyCanvas('align-top', 'Align Top');
                    }}
                    className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    Top
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenSubMenu(null);
                      handleBeautifyCanvas('align-middle', 'Align Middle');
                    }}
                    className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    Middle
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenSubMenu(null);
                      handleBeautifyCanvas('align-bottom', 'Align Bottom');
                    }}
                    className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    Bottom
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  {/* Traffic Simulation */}
                  <button
                    type="button"
                    onClick={() => {
                      setOpenSubMenu(null);
                      handleToggleTrafficSimulation();
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors group cursor-pointer ${
                      isSimulatingTraffic ? 'bg-emerald-50 hover:bg-emerald-100/70' : 'hover:bg-emerald-50/70'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                      isSimulatingTraffic ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                      <Activity className={`w-4 h-4 ${isSimulatingTraffic ? 'text-white animate-pulse' : 'text-emerald-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-[12px] font-semibold ${isSimulatingTraffic ? 'text-emerald-700' : 'text-slate-800 group-hover:text-emerald-700'}`}>
                          Simulate Traffic Flow
                        </span>
                        {isSimulatingTraffic && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-600 text-white">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        Animate live packet requests along connections
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Group 3: Security & Resilience */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenSubMenu(openSubMenu === 'security' ? null : 'security')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] text-[12px] font-semibold transition-all border cursor-pointer ${
                openSubMenu === 'security'
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white border-transparent shadow-xs ring-1 ring-rose-300'
                  : isChaosActive
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white border-rose-700 shadow-xs animate-pulse font-semibold'
                  : 'bg-gradient-to-r from-rose-50 via-pink-50/80 to-red-50/80 hover:from-rose-100 hover:to-pink-100 text-rose-900 border-rose-200/90 shadow-2xs'
              }`}
              title="Security & Resilience (Audit, Threats, Chaos)"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${openSubMenu === 'security' || isChaosActive ? 'text-white' : 'text-rose-500'}`} />
              <span>Security</span>
              {isChaosActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              )}
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-150 ${
                  openSubMenu === 'security' ? 'rotate-180 text-white' : 'text-rose-700/60'
                }`}
              />
            </button>

            {openSubMenu === 'security' && (
              <div className="absolute right-0 mt-1.5 w-68 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Security & Resilience
                </div>

                {/* 1. Security & SOLID Audit */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenSubMenu(null);
                    handleAuditDiagram();
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-rose-50/70 transition-colors group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-slate-800 group-hover:text-rose-700">Security & SOLID Audit</div>
                    <div className="text-[11px] text-slate-500 truncate">Zero-trust, SPOF & Well-Architected review</div>
                  </div>
                </button>

                {/* 2. STRIDE Threat Model */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenSubMenu(null);
                    setIsThreatModelOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-purple-50/70 transition-colors group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Radar className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-slate-800 group-hover:text-purple-700">STRIDE Threat Model</div>
                    <div className="text-[11px] text-slate-500 truncate">Attack surface vectors & countermeasures</div>
                  </div>
                </button>

                {/* 3. Chaos Simulator */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenSubMenu(null);
                    if (isChaosActive) {
                      handleStopChaos();
                    } else {
                      handleStartChaos();
                    }
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors group cursor-pointer ${
                    isChaosActive ? 'bg-rose-50 hover:bg-rose-100/70' : 'hover:bg-amber-50/70'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                    isChaosActive ? 'bg-rose-600 text-white' : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    <Flame className={`w-4 h-4 ${isChaosActive ? 'text-white animate-bounce' : 'text-amber-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-[12px] font-semibold ${isChaosActive ? 'text-rose-700' : 'text-slate-800 group-hover:text-amber-700'}`}>
                        Chaos Simulator
                      </span>
                      {isChaosActive && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-rose-600 text-white">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">Inject failures & test blast radius</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Group 4: IaC & Docs */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenSubMenu(openSubMenu === 'iac' ? null : 'iac')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] text-[12px] font-semibold transition-all border cursor-pointer ${
                openSubMenu === 'iac'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-transparent shadow-xs ring-1 ring-indigo-300'
                  : 'bg-gradient-to-r from-indigo-50 via-blue-50/80 to-sky-50/80 hover:from-indigo-100 hover:to-blue-100 text-indigo-900 border-indigo-200/90 shadow-2xs'
              }`}
              title="IaC & Docs (Import IaC, Export IaC, Spec)"
            >
              <FileInput className={`w-3.5 h-3.5 ${openSubMenu === 'iac' ? 'text-white' : 'text-indigo-600'}`} />
              <span>IaC & Docs</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-150 ${
                  openSubMenu === 'iac' ? 'rotate-180 text-white' : 'text-indigo-700/60'
                }`}
              />
            </button>

            {openSubMenu === 'iac' && (
              <div className="absolute right-0 mt-1.5 w-68 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Infrastructure & Documentation
                </div>

                {/* 1. Import Reverse IaC */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenSubMenu(null);
                    setIsReverseIacOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-amber-50/70 transition-colors group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileInput className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-slate-800 group-hover:text-amber-700">Import IaC</div>
                    <div className="text-[11px] text-slate-500 truncate">Reverse Terraform, Compose, K8s to diagram</div>
                  </div>
                </button>

                {/* 2. Export IaC & Code */}
                <button
                  type="button"
                  onClick={async () => {
                    setOpenSubMenu(null);
                    const xml = (await editorRef.current?.getCurrentXml()) || currentXml;
                    setCurrentXml(xml);
                    setIsExportCodeOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-indigo-50/70 transition-colors group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileOutput className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-slate-800 group-hover:text-indigo-700">Export IaC & Code</div>
                    <div className="text-[11px] text-slate-500 truncate">Terraform HCL, Mermaid.js & Compose</div>
                  </div>
                </button>

                {/* 3. Tech Spec & ADR */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenSubMenu(null);
                    handleGenerateTechSpec();
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-blue-50/70 transition-colors group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-slate-800 group-hover:text-blue-700">Architecture Spec & ADR</div>
                    <div className="text-[11px] text-slate-500 truncate">Generate system technical specification</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Group 5: Miscellaneous (Cost, ERD, History, ⌘K, Present) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenSubMenu(openSubMenu === 'misc' ? null : 'misc')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] text-[12px] font-semibold transition-all border cursor-pointer ${
                openSubMenu === 'misc'
                  ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white border-transparent shadow-xs ring-1 ring-purple-300'
                  : 'bg-gradient-to-r from-purple-50 via-fuchsia-50/80 to-violet-50/80 hover:from-purple-100 hover:to-fuchsia-100 text-purple-900 border-purple-200/90 shadow-2xs'
              }`}
              title="Miscellaneous: Cost, Latency & SLA, ERD, History, ⌘K, Present"
            >
              <Layers className={`w-3.5 h-3.5 ${openSubMenu === 'misc' ? 'text-white' : 'text-purple-600'}`} />
              <span>Misc</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-150 ${
                  openSubMenu === 'misc' ? 'rotate-180 text-white' : 'text-purple-700/60'
                }`}
              />
            </button>

            {openSubMenu === 'misc' && (
              <div className="absolute right-0 mt-1.5 w-68 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Miscellaneous Tools
                </div>

                {/* 1. Cloud Cost & FinOps */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenSubMenu(null);
                    setIsCostModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-emerald-50/70 transition-colors group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Coins className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-slate-800 group-hover:text-emerald-700">
                      Cloud Cost & FinOps
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      AWS, GCP & Azure pricing breakdown
                    </div>
                  </div>
                </button>

                {/* 2. Latency, SLA & Availability */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenSubMenu(null);
                    handleOpenSlaCalculator();
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-teal-50/70 transition-colors group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Timer className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-semibold text-slate-800 group-hover:text-teal-700">
                        Latency & SLA
                      </span>
                      <span className="px-1.5 py-0.2 text-[9px] font-bold bg-teal-100 text-teal-800 rounded">
                        99.99%
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Composite availability, P95 & bottleneck tracer
                    </div>
                  </div>
                </button>

                {/* 3. SQL / Prisma to ERD */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenSubMenu(null);
                    setIsSqlErdOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-emerald-50/70 transition-colors group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Table className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-slate-800 group-hover:text-emerald-700">
                      SQL / Prisma to ERD
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Database tables & relationships visualizer
                    </div>
                  </div>
                </button>

                {/* 3. Version History */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenSubMenu(null);
                    setVersions(getAllVersions());
                    setIsVersionHistoryOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-slate-100 transition-colors group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <History className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-slate-800 group-hover:text-slate-900">
                      Revision History
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Time-travel restore & snapshot versions
                    </div>
                  </div>
                </button>

                {/* 4. Presentation Mode */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenSubMenu(null);
                    handleStartPresentation();
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-blue-50/70 transition-colors group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Presentation className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-slate-800 group-hover:text-blue-700">
                      Presentation Mode
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Architecture spotlight & slide tour
                    </div>
                  </div>
                </button>

                {/* 5. Command Palette */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenSubMenu(null);
                    setIsCommandPaletteOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-amber-50/70 transition-colors group cursor-pointer border-t border-slate-100"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Command className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-slate-800 group-hover:text-amber-700">
                        Command Palette
                      </span>
                      <span className="px-1.5 py-0.2 rounded font-mono text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        ⌘K
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Search actions, tools & shortcuts
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Group 6: Save & Export (Save, PNG, SVG) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenSubMenu(openSubMenu === 'export' ? null : 'export')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] text-[12px] font-semibold transition-all border cursor-pointer ${
                openSubMenu === 'export'
                  ? 'bg-slate-800 text-white border-transparent shadow-xs ring-1 ring-slate-400'
                  : 'bg-gradient-to-r from-slate-100 via-gray-100/90 to-zinc-100 hover:from-slate-200 hover:to-gray-200 text-slate-800 border-slate-300/80 shadow-2xs'
              }`}
              title="Save & Export (Save .drawio, PNG, SVG)"
            >
              <Download className={`w-3.5 h-3.5 ${openSubMenu === 'export' ? 'text-white' : 'text-slate-700'}`} />
              <span>Export</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-150 ${
                  openSubMenu === 'export' ? 'rotate-180 text-white' : 'text-slate-500'
                }`}
              />
            </button>

            {openSubMenu === 'export' && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Save & Export Diagram
                </div>

                {/* 1. Save .drawio */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenSubMenu(null);
                    handleExportXml();
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-slate-100 transition-colors group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Download className="w-4 h-4 text-slate-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-slate-800 group-hover:text-slate-900">
                      Save .drawio
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Editable source file format
                    </div>
                  </div>
                </button>

                {/* 2. PNG */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenSubMenu(null);
                    handleExportFormat('png');
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-slate-100 transition-colors group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ImageIcon className="w-4 h-4 text-slate-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-slate-800 group-hover:text-slate-900">
                      Export PNG
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      High-resolution 2x raster image
                    </div>
                  </div>
                </button>

                {/* 3. SVG */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenSubMenu(null);
                    handleExportFormat('svg');
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-slate-100 transition-colors group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileCode className="w-4 h-4 text-slate-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-slate-800 group-hover:text-slate-900">
                      Export SVG
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Vector graphics for docs and web
                    </div>
                  </div>
                </button>

                {/* 4. Standalone Interactive HTML Export */}
                <button
                  type="button"
                  disabled={isExportingHtml}
                  onClick={() => {
                    setOpenSubMenu(null);
                    handleExportStandaloneHtml();
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-orange-50/70 transition-colors group cursor-pointer disabled:opacity-50"
                >
                  <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Globe className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-semibold text-slate-800 group-hover:text-orange-700">
                        {isExportingHtml ? 'Generating...' : 'Interactive HTML'}
                      </span>
                      <span className="px-1.5 py-0.2 text-[9px] font-bold bg-orange-100 text-orange-800 rounded">
                        Shareable
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Offline viewer with pan, zoom & inspector
                    </div>
                  </div>
                </button>

                {/* Canvas utilities divider */}
                <div className="my-1 border-t border-slate-100" />

                <div className="flex items-center justify-between px-3 py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenSubMenu(null);
                      handleClearCache();
                    }}
                    title="Clear Diagram Cache"
                    className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3 text-rose-500" />
                    <span>Clear Cache</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOpenSubMenu(null);
                      handleClearCanvas();
                    }}
                    title="Clear Canvas"
                    className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 text-rose-500" />
                    <span>Clear Canvas</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Draw.io Editor Canvas */}
      <main className="flex-1 relative overflow-hidden">
        <DrawioEditor
          ref={editorRef}
          initialXml={currentXml}
          onXmlChange={handleXmlChange}
          onExportSuccess={(_, filename) => {
            showToast(`Downloaded ${filename} to your Downloads folder! ✓`);
          }}
        />
      </main>

      {/* Image-to-Diagram Upload Modal */}
      <ImageToDiagramModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onInsertDiagram={handleInsertDiagram}
      />

      {/* Feature #1: Prompt to Diagram Modal */}
      <PromptToDiagramModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        onInsertDiagram={handleInsertDiagram}
      />

      {/* Feature: Architecture to AI Prompt (Reverse Prompt) */}
      <ReversePromptModal
        isOpen={isReversePromptOpen}
        onClose={() => setIsReversePromptOpen(false)}
        xml={currentXml}
        onInsertDiagram={(xml, mode) => handleInsertDiagram(xml, mode)}
      />

      {/* Feature #3: Export Code Modal */}
      <ExportCodeModal
        isOpen={isExportCodeOpen}
        onClose={() => setIsExportCodeOpen(false)}
        xml={currentXml}
      />

      {/* Feature #4: Version History Modal */}
      <VersionHistoryModal
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        versions={versions}
        onRestoreVersion={(xml) => {
          editorRef.current?.loadXml(xml);
          setCurrentXml(xml);
          showToast('Restored diagram version snapshot');
        }}
        onRefreshVersions={() => setVersions(getAllVersions())}
      />

      {/* Feature #1: Architecture Security Audit Drawer */}
      <ArchitectureAuditDrawer
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
        auditResult={auditResult}
        isLoading={isAuditing}
        onAutoFix={handleAutoFixAuditFinding}
      />

      {/* Feature #2: Interactive Architecture Copilot Command Bar */}
      <DiagramCopilotBar
        isOpen={isCopilotBarOpen}
        onClose={() => setIsCopilotBarOpen(false)}
        currentXml={currentXml}
        onApplyChanges={handleCopilotApply}
      />

      {/* Feature #6: Architecture Tech Spec & ADR Modal */}
      <TechSpecModal
        isOpen={isTechSpecOpen}
        onClose={() => setIsTechSpecOpen(false)}
        markdownDoc={techSpecDoc}
        isLoading={isGeneratingSpec}
      />

      {/* Feature #6: Traffic Flow Simulator Floating Control */}
      <TrafficSimulatorBar
        isActive={isSimulatingTraffic}
        mode={simulationMode}
        onModeChange={(m) => handleToggleTrafficSimulation(m)}
        onStop={handleStopTrafficSimulation}
      />

      {/* Feature #4: Reverse IaC Modal */}
      <ReverseIacModal
        isOpen={isReverseIacOpen}
        onClose={() => setIsReverseIacOpen(false)}
        onInsertDiagram={handleInsertDiagram}
      />

      {/* Feature #2: Command Palette Modal */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={commandItems}
      />

      {/* Cloud Cost & FinOps Estimator Modal */}
      <CostEstimatorModal
        isOpen={isCostModalOpen}
        onClose={() => setIsCostModalOpen(false)}
        xml={currentXml}
      />

      {/* Feature #1: Chaos Engineering Blast Radius Floating Control */}
      <ChaosSimulatorBar
        isActive={isChaosActive}
        nodes={topologyNodes}
        selectedNodeId={chaosTargetNodeId}
        result={chaosResult}
        onSelectNode={handleSelectChaosTarget}
        onStop={handleStopChaos}
      />

      {/* Feature #2: STRIDE Threat Modeling Modal */}
      <ThreatModelModal
        isOpen={isThreatModelOpen}
        onClose={() => setIsThreatModelOpen(false)}
        xml={currentXml}
      />

      {/* Feature #3: SQL DDL / Prisma to ERD Visualizer Modal */}
      <SqlToErdModal
        isOpen={isSqlErdOpen}
        onClose={() => setIsSqlErdOpen(false)}
        onInsertDiagram={handleInsertDiagram}
      />

      {/* Feature #5: Presentation & Architecture Walkthrough Mode Overlay */}
      <PresentationModeOverlay
        isActive={isPresentationActive}
        xml={presentationBaseXml || currentXml}
        onClose={handleStopPresentation}
        onFocusComponents={handlePresentationFocus}
      />

      {/* Feature #2: Latency, SLA & Availability Calculator Modal */}
      {slaReport && (
        <SlaLatencyModal
          isOpen={isSlaModalOpen}
          onClose={() => setIsSlaModalOpen(false)}
          report={slaReport}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] text-white text-[12px] font-medium rounded-md shadow-lg border border-[#3a3a3a] animate-in fade-in slide-in-from-bottom-1 duration-150">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
