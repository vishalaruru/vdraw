import { extractTopologyFromXml, ParsedTopologyNode } from './architectureAuditor';

export interface BlastRadiusResult {
  failedNode: ParsedTopologyNode;
  failedNodes: string[]; // IDs
  degradedNodes: string[]; // IDs
  resilientNodes: string[]; // IDs
  impactPercentage: number;
  criticality: 'Low' | 'Moderate' | 'Critical';
  summary: string;
  mitigationTip: string;
}

export function simulateBlastRadius(xml: string, targetNodeId: string): BlastRadiusResult {
  const topology = extractTopologyFromXml(xml);
  const candidates = topology.nodes.filter(
    (n) => !n.isContainer && n.type !== 'container' && n.label.trim().length > 0
  );
  const target =
    candidates.find((n) => n.id === targetNodeId) ||
    topology.nodes.find((n) => n.id === targetNodeId) ||
    candidates[0] ||
    topology.nodes[0];

  if (!target) {
    throw new Error('No target component found in diagram.');
  }

  const failedNodes = [target.id];
  const degradedNodes = new Set<string>();
  const resilientNodes = new Set<string>();

  // Build adjacency graph for incoming and outgoing edges
  const callersOf = new Map<string, string[]>(); // target -> sources (who calls target)
  const calleesOf = new Map<string, string[]>(); // source -> targets (who target calls)

  topology.edges.forEach((e) => {
    if (!callersOf.has(e.target)) callersOf.set(e.target, []);
    callersOf.get(e.target)!.push(e.source);

    if (!calleesOf.has(e.source)) calleesOf.set(e.source, []);
    calleesOf.get(e.source)!.push(e.target);
  });

  // Direct callers of the failed node will degrade unless buffered by queue/circuit-breaker
  const queueNodes = new Set(topology.nodes.filter((n) => n.type === 'queue' || n.type === 'dlq').map((n) => n.id));
  const circuitBreakerNodes = new Set(topology.nodes.filter((n) => n.type === 'circuit_breaker').map((n) => n.id));

  const directCallers = callersOf.get(target.id) || [];

  directCallers.forEach((callerId) => {
    // If separated by a queue or circuit breaker, it's resilient
    if (queueNodes.has(callerId) || circuitBreakerNodes.has(callerId)) {
      resilientNodes.add(callerId);
    } else {
      degradedNodes.add(callerId);
      // Secondary cascading callers
      const secondaryCallers = callersOf.get(callerId) || [];
      secondaryCallers.forEach((sec) => {
        if (!queueNodes.has(sec) && !circuitBreakerNodes.has(sec)) {
          degradedNodes.add(sec);
        } else {
          resilientNodes.add(sec);
        }
      });
    }
  });

  // Any downstream nodes that target calls will also be unreachable
  const downstream = calleesOf.get(target.id) || [];
  downstream.forEach((ds) => {
    degradedNodes.add(ds);
  });

  // Calculate unimpacted nodes
  topology.nodes.forEach((n) => {
    if (n.id !== target.id && !degradedNodes.has(n.id)) {
      resilientNodes.add(n.id);
    }
  });

  const total = topology.nodes.length || 1;
  const impactCount = failedNodes.length + degradedNodes.size;
  const impactPercentage = Math.min(100, Math.round((impactCount / total) * 100));

  let criticality: BlastRadiusResult['criticality'] = 'Low';
  if (impactPercentage > 60 || target.type === 'database' || target.type === 'gateway') {
    criticality = 'Critical';
  } else if (impactPercentage > 30) {
    criticality = 'Moderate';
  }

  let mitigationTip = 'Add redundant Multi-AZ standby replicas and automated failover.';
  if (target.type === 'database') {
    mitigationTip = 'Deploy Amazon Aurora Global Database with Multi-AZ replicas and Read-Replicas to absorb read traffic during primary failover.';
  } else if (target.type === 'service') {
    mitigationTip = 'Wrap downstream calls in Circuit Breakers (Resilience4j / Envoy) with fallback responses and 500ms timeouts.';
  } else if (target.type === 'gateway') {
    mitigationTip = 'Configure multi-region DNS failover via AWS Route 53 with automated health-check probes.';
  }

  return {
    failedNode: target,
    failedNodes,
    degradedNodes: Array.from(degradedNodes),
    resilientNodes: Array.from(resilientNodes),
    impactPercentage,
    criticality,
    summary: `Injecting outage into [${target.label}] causes a ${criticality.toUpperCase()} blast radius affecting ${impactPercentage}% of architecture components (${failedNodes.length} failed, ${degradedNodes.size} degraded, ${resilientNodes.size} resilient).`,
    mitigationTip,
  };
}

export function applyChaosStyling(xml: string, result: BlastRadiusResult): string {
  const failedSet = new Set(result.failedNodes);
  const degradedSet = new Set(result.degradedNodes);
  const resilientSet = new Set(result.resilientNodes);

  return xml.replace(
    /(<mxCell[^>]*\bid="([^"]+)"[^>]*\bstyle=")([^"]*)(")/g,
    (whole, prefix, id, style, suffix) => {
      // Check if vertex
      if (whole.includes('vertex="1"')) {
        let cleanStyle = style
          .replace(/fillColor=[^;]+;?/g, '')
          .replace(/strokeColor=[^;]+;?/g, '')
          .replace(/strokeWidth=[^;]+;?/g, '');

        if (!cleanStyle.endsWith(';') && cleanStyle.length > 0) cleanStyle += ';';

        if (failedSet.has(id)) {
          // Dark Red / Rose for failed
          return `${prefix}${cleanStyle}fillColor=#fee2e2;strokeColor=#e11d48;strokeWidth=3.5;fontColor=#9f1239;${suffix}`;
        } else if (degradedSet.has(id)) {
          // Amber for degraded cascading
          return `${prefix}${cleanStyle}fillColor=#fef3c7;strokeColor=#d97706;strokeWidth=2.5;fontColor=#92400e;${suffix}`;
        } else if (resilientSet.has(id)) {
          // Green for resilient
          return `${prefix}${cleanStyle}fillColor=#dcfce7;strokeColor=#16a34a;strokeWidth=2;fontColor=#166534;${suffix}`;
        }
      }

      return whole;
    }
  );
}

export function resetChaosStyling(xml: string): string {
  return xml.replace(
    /(<mxCell[^>]*\bvertex="1"[^>]*\bstyle=")([^"]*)(")/g,
    (_whole, prefix, style, suffix) => {
      const cleanStyle = style
        .replace(/fillColor=#(fee2e2|fef3c7|dcfce7);?/g, '')
        .replace(/strokeColor=#(e11d48|d97706|16a34a);?/g, '')
        .replace(/strokeWidth=(3\.5|2\.5|2);?/g, '')
        .replace(/fontColor=#(9f1239|92400e|166534);?/g, '');
      return `${prefix}${cleanStyle}${suffix}`;
    }
  );
}
