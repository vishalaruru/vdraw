import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Presentation,
  Shield,
  Server,
  Database,
  Layers,
  Zap,
  Play,
  Pause,
  Table,
  CheckCircle2,
  Maximize2,
} from 'lucide-react';
import { extractTopologyFromXml } from '../services/architectureAuditor';

export interface Slide {
  id: string;
  stepNumber: number;
  title: string;
  category: string;
  icon: React.ReactNode;
  narrative: string;
  components: string[];
  nodeIds: string[];
  isOverview?: boolean;
}

interface PresentationModeOverlayProps {
  isActive: boolean;
  xml: string;
  onClose: () => void;
  onFocusComponents?: (nodeIds: string[], isOverview?: boolean) => void;
}

export const PresentationModeOverlay: React.FC<PresentationModeOverlayProps> = ({
  isActive,
  xml,
  onClose,
  onFocusComponents,
}) => {
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [isAutoplaying, setIsAutoplaying] = useState(false);
  const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const topology = useMemo(() => extractTopologyFromXml(xml), [xml]);

  // Determine diagram archetype: is this an ERD/Database diagram, Cloud Infra, or General Flowchart?
  const diagramArchetype = useMemo(() => {
    const isErd =
      xml.includes('shape=table') ||
      xml.includes('erd_') ||
      topology.nodes.some(
        (n) =>
          n.label.toLowerCase().includes('table') ||
          n.label.toLowerCase().includes('user') ||
          n.label.toLowerCase().includes('order') ||
          n.label.toLowerCase().includes('payment')
      );
    if (isErd) return 'erd';

    const isCloud = topology.nodes.some(
      (n) =>
        n.type === 'gateway' ||
        n.type === 'perimeter' ||
        n.type === 'service' ||
        n.type === 'queue' ||
        n.type === 'database'
    );
    if (isCloud) return 'cloud';

    return 'general';
  }, [xml, topology]);

  // Construct automated logical presentation walkthrough adapted to diagram type
  const slides: Slide[] = useMemo(() => {
    const list: Slide[] = [];
    const allNodes = topology.nodes;

    if (allNodes.length === 0) {
      list.push({
        id: 'slide_empty',
        stepNumber: 1,
        title: 'Empty Canvas Walkthrough',
        category: 'Overview',
        icon: <Layers className="w-5 h-5 text-indigo-400" />,
        narrative: 'Your canvas is currently blank. Add components, import an architecture, or paste SQL schema to begin the presentation.',
        components: [],
        nodeIds: [],
        isOverview: true,
      });
      return list;
    }

    if (diagramArchetype === 'erd') {
      // 1. Database Overview
      list.push({
        id: 'erd_overview',
        stepNumber: 1,
        title: 'Relational Database & Domain Model Overview',
        category: 'Database Architecture',
        icon: <Table className="w-5 h-5 text-emerald-400" />,
        narrative: `High-level entity relationship architecture encompassing ${allNodes.length} core data tables and ${topology.edges.length} foreign key relational integrity constraints.`,
        components: allNodes.map((n) => cleanLabel(n.label)),
        nodeIds: allNodes.map((n) => n.id),
        isOverview: true,
      });

      // 2. Master / Identity Entities (e.g. Users, Customers, Accounts)
      const userNodes = allNodes.filter(
        (n) =>
          n.label.toLowerCase().includes('user') ||
          n.label.toLowerCase().includes('account') ||
          n.label.toLowerCase().includes('customer') ||
          n.label.toLowerCase().includes('profile')
      );
      if (userNodes.length > 0) {
        list.push({
          id: 'erd_users',
          stepNumber: list.length + 1,
          title: 'Identity, Security & Master Entities',
          category: 'Core Master Domain',
          icon: <Shield className="w-5 h-5 text-blue-400" />,
          narrative:
            'Foundational entities serving as identity anchors and primary key references across downstream business domains.',
          components: userNodes.map((n) => cleanLabel(n.label)),
          nodeIds: userNodes.map((n) => n.id),
        });
      }

      // 3. Transactional Entities (e.g. Orders, Bookings, Sessions)
      const txnNodes = allNodes.filter(
        (n) =>
          n.label.toLowerCase().includes('order') && !n.label.toLowerCase().includes('item')
      );
      if (txnNodes.length > 0) {
        list.push({
          id: 'erd_orders',
          stepNumber: list.length + 1,
          title: 'Transactional Business Events & Orders',
          category: 'Transactional Domain',
          icon: <Server className="w-5 h-5 text-indigo-400" />,
          narrative:
            'Captures core state transitions, customer purchase events, and lifecycle statuses backed by foreign key integrity.',
          components: txnNodes.map((n) => cleanLabel(n.label)),
          nodeIds: txnNodes.map((n) => n.id),
        });
      }

      // 4. Line Items / Child Relational Entities
      const itemNodes = allNodes.filter(
        (n) =>
          n.label.toLowerCase().includes('item') ||
          n.label.toLowerCase().includes('product') ||
          n.label.toLowerCase().includes('detail')
      );
      if (itemNodes.length > 0) {
        list.push({
          id: 'erd_items',
          stepNumber: list.length + 1,
          title: 'Granular Line Items & Catalog Dependencies',
          category: 'Detail & Catalog Entities',
          icon: <Layers className="w-5 h-5 text-amber-400" />,
          narrative:
            'Normalised 1:N composite child records preserving itemised breakdowns, quantities, and point-in-time pricing.',
          components: itemNodes.map((n) => cleanLabel(n.label)),
          nodeIds: itemNodes.map((n) => n.id),
        });
      }

      // 5. Payment & Settlement Entities
      const payNodes = allNodes.filter(
        (n) =>
          n.label.toLowerCase().includes('payment') ||
          n.label.toLowerCase().includes('invoice') ||
          n.label.toLowerCase().includes('transaction')
      );
      if (payNodes.length > 0) {
        list.push({
          id: 'erd_payments',
          stepNumber: list.length + 1,
          title: 'Financial Settlement & Audit Ledgers',
          category: 'Financial Ledger Domain',
          icon: <Database className="w-5 h-5 text-emerald-400" />,
          narrative:
            'Payment method records, idempotent ledger entries, and audit references verifying transactional settlement.',
          components: payNodes.map((n) => cleanLabel(n.label)),
          nodeIds: payNodes.map((n) => n.id),
        });
      }

      // If any tables weren't covered, add them to a domain entities slide
      const coveredIds = new Set(list.flatMap((s) => s.nodeIds));
      const remaining = allNodes.filter((n) => !coveredIds.has(n.id));
      if (remaining.length > 0) {
        list.push({
          id: 'erd_remaining',
          stepNumber: list.length + 1,
          title: 'Auxiliary & Reference Tables',
          category: 'Reference Domain',
          icon: <Database className="w-5 h-5 text-slate-400" />,
          narrative: 'Supporting lookup tables, relational joins, and ancillary system entities.',
          components: remaining.map((n) => cleanLabel(n.label)),
          nodeIds: remaining.map((n) => n.id),
        });
      }
    } else {
      // Cloud or General Architecture
      // Slide 1: System Overview
      list.push({
        id: 'slide_overview',
        stepNumber: 1,
        title: 'Executive Architecture Overview',
        category: 'System Topology',
        icon: <Layers className="w-5 h-5 text-indigo-400" />,
        narrative: `End-to-end distributed system topology comprising ${allNodes.length} distributed nodes and ${topology.edges.length} networked communication flows.`,
        components: allNodes.map((n) => cleanLabel(n.label)),
        nodeIds: allNodes.map((n) => n.id),
        isOverview: true,
      });

      // Slide 2: Ingress & Perimeter
      const ingressNodes = allNodes.filter(
        (n) => n.type === 'client' || n.type === 'perimeter' || n.type === 'gateway'
      );
      if (ingressNodes.length > 0) {
        list.push({
          id: 'slide_ingress',
          stepNumber: list.length + 1,
          title: 'Perimeter Defense & Ingress Gateway',
          category: 'Edge & Ingress Tier',
          icon: <Shield className="w-5 h-5 text-rose-400" />,
          narrative:
            'Public ingress perimeter with rate-limiting, WAF inspection, and TLS termination before routing to internal services.',
          components: ingressNodes.map((n) => cleanLabel(n.label)),
          nodeIds: ingressNodes.map((n) => n.id),
        });
      }

      // Slide 3: Application Compute
      const computeNodes = allNodes.filter(
        (n) => n.type === 'service' || n.type === 'auth' || n.type === 'circuit_breaker'
      );
      if (computeNodes.length > 0) {
        list.push({
          id: 'slide_compute',
          stepNumber: list.length + 1,
          title: 'Core Business Logic & Microservices',
          category: 'Compute Tier',
          icon: <Server className="w-5 h-5 text-blue-400" />,
          narrative:
            'Containerised stateless microservices managing business rules, validation, and domain orchestrations.',
          components: computeNodes.map((n) => cleanLabel(n.label)),
          nodeIds: computeNodes.map((n) => n.id),
        });
      }

      // Slide 4: Event Messaging
      const eventNodes = allNodes.filter((n) => n.type === 'queue' || n.type === 'dlq');
      if (eventNodes.length > 0) {
        list.push({
          id: 'slide_events',
          stepNumber: list.length + 1,
          title: 'Asynchronous Event-Driven Messaging',
          category: 'Messaging Tier',
          icon: <Zap className="w-5 h-5 text-amber-400" />,
          narrative:
            'Decoupled message brokers and streaming buses handling peak loads with reliable delivery and DLQ fallback.',
          components: eventNodes.map((n) => cleanLabel(n.label)),
          nodeIds: eventNodes.map((n) => n.id),
        });
      }

      // Slide 5: Stateful Persistence
      const stateNodes = allNodes.filter(
        (n) =>
          n.type === 'database' ||
          n.type === 'cache' ||
          n.type === 'object_storage' ||
          n.type === 'connection_pool'
      );
      if (stateNodes.length > 0) {
        list.push({
          id: 'slide_data',
          stepNumber: list.length + 1,
          title: 'Stateful Persistence & In-Memory Caching',
          category: 'Storage Tier',
          icon: <Database className="w-5 h-5 text-emerald-400" />,
          narrative:
            'Low-latency in-memory caching shields multi-AZ relational databases and durable object storage buckets.',
          components: stateNodes.map((n) => cleanLabel(n.label)),
          nodeIds: stateNodes.map((n) => n.id),
        });
      }

      // If nodes remain unclassified, group them into a processing slide
      const covered = new Set(list.flatMap((s) => s.nodeIds));
      const unclassified = allNodes.filter((n) => !covered.has(n.id));
      if (unclassified.length > 0 && list.length <= 2) {
        list.push({
          id: 'slide_processing',
          stepNumber: list.length + 1,
          title: 'Core System Processing Components',
          category: 'Processing Tier',
          icon: <Server className="w-5 h-5 text-slate-400" />,
          narrative: 'Primary workflow stages and operational modules driving system execution.',
          components: unclassified.map((n) => cleanLabel(n.label)),
          nodeIds: unclassified.map((n) => n.id),
        });
      }
    }

    return list;
  }, [topology, diagramArchetype]);

  const activeSlide = slides[currentSlideIdx] || slides[0];

  // Dispatch canvas spotlight event whenever the active slide changes
  useEffect(() => {
    if (isActive && activeSlide && onFocusComponents) {
      onFocusComponents(activeSlide.nodeIds, activeSlide.isOverview);
    }
  }, [isActive, currentSlideIdx, activeSlide, onFocusComponents]);

  // Autoplay functionality (advances every 5 seconds)
  useEffect(() => {
    if (isAutoplaying && isActive) {
      autoplayTimerRef.current = setInterval(() => {
        setCurrentSlideIdx((prev) => {
          if (prev >= slides.length - 1) {
            setIsAutoplaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 5000);
    } else {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    }

    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, [isAutoplaying, isActive, slides.length]);

  // Keyboard navigation (Left, Right, Escape, Space)
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        setCurrentSlideIdx((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSlideIdx((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, slides.length, onClose]);

  if (!isActive || !activeSlide) return null;

  return (
    <>
      {/* Top Floating Presenter Control HUD */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white px-5 py-2 rounded-2xl shadow-2xl border border-slate-700/80 z-50 flex items-center gap-4 text-xs animate-in slide-in-from-top-3 duration-200">
        <div className="flex items-center gap-2 font-bold text-amber-400">
          <Presentation className="w-4 h-4 text-amber-400" />
          <span>Walkthrough Mode</span>
        </div>

        <div className="h-4 w-[1px] bg-slate-700" />

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentSlideIdx(i)}
              className={`h-2 rounded-full transition-all ${
                i === currentSlideIdx ? 'w-6 bg-amber-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
              }`}
              title={`Jump to Slide ${i + 1}`}
            />
          ))}
        </div>

        <span className="text-slate-300 font-mono text-[11px] font-semibold">
          {currentSlideIdx + 1} / {slides.length}
        </span>

        <div className="h-4 w-[1px] bg-slate-700" />

        {/* Autoplay button */}
        <button
          type="button"
          onClick={() => setIsAutoplaying((p) => !p)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
            isAutoplaying ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
          title={isAutoplaying ? 'Pause Autoplay' : 'Autoplay Slides (5s intervals)'}
        >
          {isAutoplaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          <span>{isAutoplaying ? 'Playing' : 'Autoplay'}</span>
        </button>

        {/* Fullscreen button */}
        <button
          type="button"
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => {});
            } else {
              document.exitFullscreen().catch(() => {});
            }
          }}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Toggle Fullscreen Theater"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
          title="Exit Presentation Mode (ESC)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Floating Presenter Deck */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92vw] max-w-3xl bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 rounded-2xl shadow-2xl z-50 p-4 space-y-3 animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-xs">
              {activeSlide.icon}
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span>{activeSlide.category}</span>
                {activeSlide.isOverview && (
                  <span className="bg-amber-400/20 text-amber-300 text-[9px] px-1.5 py-0.2 rounded font-mono">
                    ALL NODES
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-white leading-tight">
                {activeSlide.title}
              </h3>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentSlideIdx === 0}
              onClick={() => setCurrentSlideIdx((prev) => Math.max(0, prev - 1))}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 transition-colors border border-slate-700 shadow-xs"
              title="Previous Slide (←)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              disabled={currentSlideIdx === slides.length - 1}
              onClick={() => setCurrentSlideIdx((prev) => Math.min(slides.length - 1, prev + 1))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs disabled:opacity-30 transition-colors shadow-xs"
              title="Next Slide (→ / Space)"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Narrative & Speaker Walkthrough Notes */}
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
          {activeSlide.narrative}
        </p>

        {/* Focused Component Badges */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px]">
          <span className="text-slate-400 font-semibold uppercase text-[10px]">
            Spotlight Components:
          </span>
          {activeSlide.components.slice(0, 8).map((c, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-medium flex items-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3 text-amber-400" />
              <span>{c}</span>
            </span>
          ))}
          {activeSlide.components.length > 8 && (
            <span className="text-[10px] text-slate-400 font-mono">
              +{activeSlide.components.length - 8} more
            </span>
          )}
        </div>
      </div>
    </>
  );
};

function cleanLabel(raw: string): string {
  if (!raw) return 'Component';
  // Strip HTML tags if present
  const stripped = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const firstLine = stripped.split(/[\n\r]+/)[0] || '';
  return firstLine.slice(0, 24) || 'Component';
}
