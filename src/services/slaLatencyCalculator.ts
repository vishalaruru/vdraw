/**
 * Latency, SLA & Availability Calculator for vish.al Intelligent Architecture Studio
 * Computes composite system uptime, downtime budgets, P50/P95/P99 latencies, and critical paths.
 */

import { ParsedTopology } from './architectureAuditor';

export interface ComponentSlaProfile {
  name: string;
  category: 'dns_cdn' | 'load_balancer' | 'api_gateway' | 'compute' | 'database' | 'cache' | 'queue' | 'auth_external' | 'storage';
  availabilityPct: number; // e.g. 99.99
  latencyP50Ms: number;
  latencyP95Ms: number;
  latencyP99Ms: number;
  isAsyncQueue?: boolean;
}

export interface PathHop {
  nodeId: string;
  label: string;
  category: string;
  availabilityPct: number;
  latencyP50Ms: number;
  latencyP95Ms: number;
  latencyP99Ms: number;
  isBottleneck?: boolean;
}

export interface CriticalPathResult {
  pathHops: PathHop[];
  totalP50Ms: number;
  totalP95Ms: number;
  totalP99Ms: number;
  compositeAvailabilityPct: number;
}

export interface SlaCalculationReport {
  overallCompositeAvailability: number; // e.g. 99.85
  allowedDowntimeYear: string;
  allowedDowntimeMonth: string;
  allowedDowntimeDay: string;
  slaTier: 'Three Nines (99.9%)' | 'Four Nines (99.99%)' | 'Two Nines (99%)' | 'Sub-Optimal (<99%)';
  meetsTarget4Nines: boolean;
  criticalPath: CriticalPathResult;
  allComponents: {
    id: string;
    label: string;
    profile: ComponentSlaProfile;
  }[];
  bottleneckNode?: {
    label: string;
    latencyMs: number;
    reason: string;
  };
  recommendations: string[];
}

export function inferComponentSlaProfile(label: string, type: string = ''): ComponentSlaProfile {
  const text = (label + ' ' + type).toLowerCase();

  // DNS & CDN
  if (text.includes('route53') || text.includes('dns') || text.includes('cloud dns')) {
    return { name: 'Route53 / DNS', category: 'dns_cdn', availabilityPct: 100.0, latencyP50Ms: 5, latencyP95Ms: 12, latencyP99Ms: 20 };
  }
  if (text.includes('cloudfront') || text.includes('cdn') || text.includes('akamai') || text.includes('fastly')) {
    return { name: 'CDN / CloudFront', category: 'dns_cdn', availabilityPct: 99.9, latencyP50Ms: 12, latencyP95Ms: 35, latencyP99Ms: 65 };
  }

  // Load Balancer
  if (text.includes('alb') || text.includes('load balancer') || text.includes('nlb') || text.includes('elb') || text.includes('ingress')) {
    return { name: 'Application Load Balancer', category: 'load_balancer', availabilityPct: 99.99, latencyP50Ms: 3, latencyP95Ms: 8, latencyP99Ms: 15 };
  }

  // API Gateway
  if (text.includes('api gateway') || text.includes('apigateway') || text.includes('kong') || text.includes('apigee') || text.includes('gateway')) {
    return { name: 'API Gateway', category: 'api_gateway', availabilityPct: 99.95, latencyP50Ms: 8, latencyP95Ms: 22, latencyP99Ms: 45 };
  }

  // Caching
  if (text.includes('redis') || text.includes('memcached') || text.includes('elasticache') || text.includes('cache')) {
    return { name: 'In-Memory Cache (Redis)', category: 'cache', availabilityPct: 99.99, latencyP50Ms: 1.5, latencyP95Ms: 3.5, latencyP99Ms: 8 };
  }

  // Databases
  if (text.includes('dynamodb') || text.includes('firestore') || text.includes('cosmos') || text.includes('nosql')) {
    return { name: 'NoSQL / DynamoDB', category: 'database', availabilityPct: 99.999, latencyP50Ms: 5, latencyP95Ms: 12, latencyP99Ms: 25 };
  }
  if (text.includes('aurora') || text.includes('spanner')) {
    return { name: 'Aurora Multi-AZ DB', category: 'database', availabilityPct: 99.99, latencyP50Ms: 8, latencyP95Ms: 20, latencyP99Ms: 40 };
  }
  if (text.includes('rds') || text.includes('postgres') || text.includes('mysql') || text.includes('sql') || text.includes('database') || text.includes('db')) {
    return { name: 'Relational Database (RDS)', category: 'database', availabilityPct: 99.95, latencyP50Ms: 15, latencyP95Ms: 38, latencyP99Ms: 75 };
  }

  // Object Storage
  if (text.includes('s3') || text.includes('bucket') || text.includes('blob') || text.includes('gcs')) {
    return { name: 'Object Storage (S3)', category: 'storage', availabilityPct: 99.99, latencyP50Ms: 20, latencyP95Ms: 50, latencyP99Ms: 90 };
  }

  // Asynchronous Message Queues
  if (text.includes('sqs') || text.includes('queue') || text.includes('pubsub') || text.includes('sns') || text.includes('eventbridge')) {
    return { name: 'Message Queue / SQS (Async)', category: 'queue', availabilityPct: 99.99, latencyP50Ms: 2, latencyP95Ms: 5, latencyP99Ms: 10, isAsyncQueue: true };
  }
  if (text.includes('kafka') || text.includes('msk') || text.includes('kinesis') || text.includes('rabbitmq')) {
    return { name: 'Streaming Bus (Kafka / MSK)', category: 'queue', availabilityPct: 99.95, latencyP50Ms: 6, latencyP95Ms: 16, latencyP99Ms: 30, isAsyncQueue: true };
  }

  // Compute / Microservices
  if (text.includes('lambda') || text.includes('serverless') || text.includes('cloud function')) {
    return { name: 'Serverless Function (Lambda)', category: 'compute', availabilityPct: 99.95, latencyP50Ms: 35, latencyP95Ms: 95, latencyP99Ms: 220 };
  }
  if (text.includes('ecs') || text.includes('eks') || text.includes('k8s') || text.includes('kubernetes') || text.includes('docker') || text.includes('service') || text.includes('microservice') || text.includes('api')) {
    return { name: 'Container Microservice (ECS/EKS)', category: 'compute', availabilityPct: 99.99, latencyP50Ms: 20, latencyP95Ms: 45, latencyP99Ms: 85 };
  }
  if (text.includes('ec2') || text.includes('vm') || text.includes('compute')) {
    return { name: 'Virtual Machine (EC2)', category: 'compute', availabilityPct: 99.95, latencyP50Ms: 25, latencyP95Ms: 55, latencyP99Ms: 110 };
  }

  // Third-party Auth / External
  if (text.includes('auth0') || text.includes('cognito') || text.includes('stripe') || text.includes('payment') || text.includes('third party') || text.includes('external')) {
    return { name: 'Third-Party SaaS API', category: 'auth_external', availabilityPct: 99.9, latencyP50Ms: 65, latencyP95Ms: 160, latencyP99Ms: 340 };
  }

  // General default enterprise service
  return { name: 'Enterprise Service', category: 'compute', availabilityPct: 99.9, latencyP50Ms: 18, latencyP95Ms: 40, latencyP99Ms: 80 };
}

function formatDowntimeDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours < 24) return `${hours}h ${minutes}m`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days}d ${remHours}h`;
}

export function calculateArchitectureSla(topology: ParsedTopology): SlaCalculationReport {
  const { nodes, edges } = topology;

  if (nodes.length === 0) {
    return {
      overallCompositeAvailability: 99.99,
      allowedDowntimeYear: '52m 36s',
      allowedDowntimeMonth: '4m 23s',
      allowedDowntimeDay: '8.6s',
      slaTier: 'Four Nines (99.99%)',
      meetsTarget4Nines: true,
      criticalPath: {
        pathHops: [],
        totalP50Ms: 0,
        totalP95Ms: 0,
        totalP99Ms: 0,
        compositeAvailabilityPct: 99.99,
      },
      allComponents: [],
      recommendations: ['Add architectural components to calculate end-to-end composite availability and latency.'],
    };
  }

  const allComponents = nodes.map((n) => ({
    id: n.id,
    label: n.label || 'Component',
    profile: inferComponentSlaProfile(n.label, n.type),
  }));

  // Build Adjacency Graph
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  nodes.forEach((n) => {
    adj.set(n.id, []);
    inDegree.set(n.id, 0);
  });

  edges.forEach((e) => {
    if (adj.has(e.source) && adj.has(e.target)) {
      adj.get(e.source)!.push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
  });

  // Find root nodes (inDegree === 0, or user/client, or first node)
  let rootNodes = nodes.filter((n) => (inDegree.get(n.id) || 0) === 0);
  if (rootNodes.length === 0) rootNodes = [nodes[0]];

  // Find Longest Critical Path by Latency (DFS)
  let bestPath: string[] = [];
  let maxLatency = -1;

  function dfs(currId: string, currentPath: string[], currentLatency: number) {
    const nextList = adj.get(currId) || [];
    if (nextList.length === 0 || currentPath.length > 8) {
      if (currentLatency > maxLatency) {
        maxLatency = currentLatency;
        bestPath = [...currentPath];
      }
      return;
    }
    for (const nextId of nextList) {
      if (!currentPath.includes(nextId)) {
        const nextComp = allComponents.find((c) => c.id === nextId);
        const addedLatency = nextComp ? nextComp.profile.latencyP95Ms : 20;
        dfs(nextId, [...currentPath, nextId], currentLatency + addedLatency);
      }
    }
  }

  rootNodes.forEach((root) => {
    const rootComp = allComponents.find((c) => c.id === root.id);
    const initLatency = rootComp ? rootComp.profile.latencyP95Ms : 10;
    dfs(root.id, [root.id], initLatency);
  });

  if (bestPath.length === 0) {
    bestPath = nodes.slice(0, Math.min(nodes.length, 5)).map((n) => n.id);
  }

  // Construct Critical Path Hops
  let totalP50 = 0;
  let totalP95 = 0;
  let totalP99 = 0;
  let pathProductAvailability = 1.0;

  const pathHops: PathHop[] = bestPath.map((nodeId) => {
    const comp = allComponents.find((c) => c.id === nodeId);
    const profile = comp ? comp.profile : inferComponentSlaProfile('Service');
    const label = comp ? comp.label : 'Node';

    totalP50 += profile.latencyP50Ms;
    totalP95 += profile.latencyP95Ms;
    totalP99 += profile.latencyP99Ms;

    pathProductAvailability *= profile.availabilityPct / 100.0;

    return {
      nodeId,
      label,
      category: profile.category,
      availabilityPct: profile.availabilityPct,
      latencyP50Ms: profile.latencyP50Ms,
      latencyP95Ms: profile.latencyP95Ms,
      latencyP99Ms: profile.latencyP99Ms,
    };
  });

  // Identify Bottleneck
  let highestLatency = -1;
  let bottleneckHop: PathHop | null = null;
  for (const h of pathHops) {
    if (h.latencyP95Ms > highestLatency) {
      highestLatency = h.latencyP95Ms;
      bottleneckHop = h;
    }
  }

  if (bottleneckHop) {
    bottleneckHop.isBottleneck = true;
  }

  // Calculate Overall Composite Availability
  // Series product of distinct component tiers in request path
  const compositeAvailability = Math.max(90.0, Math.min(99.999, pathProductAvailability * 100));

  // Compute allowed downtime
  const unavailRatio = (100 - compositeAvailability) / 100;
  const downtimeSecsYear = unavailRatio * 365.25 * 24 * 3600;
  const downtimeSecsMonth = downtimeSecsYear / 12;
  const downtimeSecsDay = downtimeSecsYear / 365.25;

  let slaTier: SlaCalculationReport['slaTier'] = 'Three Nines (99.9%)';
  if (compositeAvailability >= 99.99) slaTier = 'Four Nines (99.99%)';
  else if (compositeAvailability >= 99.9) slaTier = 'Three Nines (99.9%)';
  else if (compositeAvailability >= 99.0) slaTier = 'Two Nines (99%)';
  else slaTier = 'Sub-Optimal (<99%)';

  // Recommendations
  const recommendations: string[] = [];
  if (bottleneckHop) {
    recommendations.push(
      `Optimize ${bottleneckHop.label} (${highestLatency}ms P95): Add caching or read-replicas to reduce tail latency.`
    );
  }
  if (compositeAvailability < 99.95) {
    recommendations.push(
      'Composite SLA is below 99.95%: Convert synchronous serial calls to asynchronous message queues (SQS / Kafka) to decouple failure domains.'
    );
  }
  const hasDb = allComponents.some((c) => c.profile.category === 'database');
  const hasCache = allComponents.some((c) => c.profile.category === 'cache');
  if (hasDb && !hasCache) {
    recommendations.push(
      'Add Redis / ElastiCache layer: In-memory caching reduces direct database read load by up to 85% and cuts P95 latency by ~20ms.'
    );
  }
  const hasCdn = allComponents.some((c) => c.profile.category === 'dns_cdn');
  if (!hasCdn && nodes.length > 2) {
    recommendations.push(
      'Introduce Edge CDN (CloudFront): Terminate TLS at the edge to accelerate global user requests and lower origin compute load.'
    );
  }

  return {
    overallCompositeAvailability: parseFloat(compositeAvailability.toFixed(3)),
    allowedDowntimeYear: formatDowntimeDuration(downtimeSecsYear),
    allowedDowntimeMonth: formatDowntimeDuration(downtimeSecsMonth),
    allowedDowntimeDay: formatDowntimeDuration(downtimeSecsDay),
    slaTier,
    meetsTarget4Nines: compositeAvailability >= 99.99,
    criticalPath: {
      pathHops,
      totalP50Ms: totalP50,
      totalP95Ms: totalP95,
      totalP99Ms: totalP99,
      compositeAvailabilityPct: parseFloat(compositeAvailability.toFixed(3)),
    },
    allComponents,
    bottleneckNode: bottleneckHop
      ? {
          label: bottleneckHop.label,
          latencyMs: highestLatency,
          reason: `Consumes ${Math.round((highestLatency / Math.max(1, totalP95)) * 100)}% of total request path duration`,
        }
      : undefined,
    recommendations,
  };
}
