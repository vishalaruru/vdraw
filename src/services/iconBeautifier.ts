export interface IconMatchItem {
  id: string;
  originalLabel: string;
  matchedTechnology: string;
  provider: 'AWS' | 'GCP' | 'Azure' | 'Kubernetes' | 'Database' | 'DevOps' | 'SaaS';
  currentStyle: string;
  newStyle: string;
  badgeColor: string;
  category: string;
  targetW: number;
  targetH: number;
  selected: boolean;
}

interface IconDefinition {
  name: string;
  provider: IconMatchItem['provider'];
  badgeColor: string;
  category: string;
  pattern: RegExp;
  style: string;
  width: number;
  height: number;
}

const ICON_DEFINITIONS: IconDefinition[] = [
  // --- AWS Infrastructure ---
  {
    name: 'AWS DynamoDB',
    provider: 'AWS',
    badgeColor: '#3B48CC',
    category: 'NoSQL Database',
    pattern: /\bdynamodb\b|\bdynamo\b/i,
    style: 'shape=mxgraph.aws4.dynamodb;fillColor=#3B48CC;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'AWS S3 Bucket',
    provider: 'AWS',
    badgeColor: '#7AA116',
    category: 'Object Storage',
    pattern: /\bs3\b|\bs3\s*bucket\b|\bobject\s*storage\b|\borca\s*s3\b|\bdazn\s*s3\b/i,
    style: 'shape=mxgraph.aws4.bucket_with_objects;fillColor=#7AA116;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'AWS Lambda',
    provider: 'AWS',
    badgeColor: '#ED7100',
    category: 'Serverless Compute',
    pattern: /\blambda\b|\bserverless\s*func|\bfaas\b/i,
    style: 'shape=mxgraph.aws4.lambda;fillColor=#ED7100;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'AWS EC2 Instance',
    provider: 'AWS',
    badgeColor: '#ED7100',
    category: 'Compute',
    pattern: /\bec2\b|\bvm\s*instance\b|\bvirtual\s*machine\b/i,
    style: 'shape=mxgraph.aws4.instance;fillColor=#ED7100;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'AWS RDS Database',
    provider: 'AWS',
    badgeColor: '#3B48CC',
    category: 'Relational Database',
    pattern: /\brds\b|\baurora\b|\brds\s*postgres|\brds\s*mysql/i,
    style: 'shape=mxgraph.aws4.rds;fillColor=#3B48CC;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'AWS API Gateway',
    provider: 'AWS',
    badgeColor: '#E7157B',
    category: 'API & Gateway',
    pattern: /\bapi\s*gateway\b|\bapigw\b/i,
    style: 'shape=mxgraph.aws4.api_gateway;fillColor=#E7157B;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'AWS CloudFront CDN',
    provider: 'AWS',
    badgeColor: '#AAB7B8',
    category: 'Content Delivery',
    pattern: /\bcloudfront\b|\bcdn\b|\bfastly\b|\bakamai\b/i,
    style: 'shape=mxgraph.aws4.cloudfront;fillColor=#AAB7B8;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'AWS SQS Message Queue',
    provider: 'AWS',
    badgeColor: '#E7157B',
    category: 'Message Queue',
    pattern: /\bsqs\b|\bdead\s*letter\b|\bdlq\b/i,
    style: 'shape=mxgraph.aws4.sqs;fillColor=#E7157B;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'AWS SNS Notifications',
    provider: 'AWS',
    badgeColor: '#E7157B',
    category: 'Pub/Sub Notification',
    pattern: /\bsns\b|\bnotification\s*service\b/i,
    style: 'shape=mxgraph.aws4.sns;fillColor=#E7157B;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'AWS ECS / Fargate',
    provider: 'AWS',
    badgeColor: '#ED7100',
    category: 'Container Orchestration',
    pattern: /\becs\b|\bfargate\b|\beks\b/i,
    style: 'shape=mxgraph.aws4.ecs;fillColor=#ED7100;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'AWS Route 53 DNS',
    provider: 'AWS',
    badgeColor: '#8C4FFF',
    category: 'Networking & DNS',
    pattern: /\broute\s*53\b|\broute53\b|\bdns\b/i,
    style: 'shape=mxgraph.aws4.route_53;fillColor=#8C4FFF;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'AWS Cognito Auth',
    provider: 'AWS',
    badgeColor: '#E7157B',
    category: 'Security & Identity',
    pattern: /\bcognito\b|\bauth0\b|\bkeycloak\b/i,
    style: 'shape=mxgraph.aws4.cognito;fillColor=#E7157B;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'AWS WAF / Shield',
    provider: 'AWS',
    badgeColor: '#E7157B',
    category: 'Perimeter Security',
    pattern: /\bwaf\b|\bshield\b|\bddos\b/i,
    style: 'shape=mxgraph.aws4.waf;fillColor=#E7157B;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'AWS EventBridge',
    provider: 'AWS',
    badgeColor: '#E7157B',
    category: 'Event Bus',
    pattern: /\beventbridge\b|\bevent\s*bus\b/i,
    style: 'shape=mxgraph.aws4.eventbridge;fillColor=#E7157B;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'AWS CloudWatch Telemetry',
    provider: 'AWS',
    badgeColor: '#E7157B',
    category: 'Monitoring & Logs',
    pattern: /\bcloudwatch\b|\bmetrics\b|\btelemetry\b/i,
    style: 'shape=mxgraph.aws4.cloudwatch;fillColor=#E7157B;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'AWS Secrets Manager',
    provider: 'AWS',
    badgeColor: '#E7157B',
    category: 'Key Management',
    pattern: /\bsecrets?\s*manager\b|\bkms\b|\bhashicorp\s*vault\b/i,
    style: 'shape=mxgraph.aws4.secrets_manager;fillColor=#E7157B;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'AWS ElastiCache',
    provider: 'AWS',
    badgeColor: '#3B48CC',
    category: 'In-Memory Cache',
    pattern: /\belasticache\b|\bmemcached\b/i,
    style: 'shape=mxgraph.aws4.elasticache;fillColor=#3B48CC;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'AWS Kinesis Stream',
    provider: 'AWS',
    badgeColor: '#8C4FFF',
    category: 'Streaming Data',
    pattern: /\bkinesis\b/i,
    style: 'shape=mxgraph.aws4.kinesis;fillColor=#8C4FFF;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },

  // --- Databases & Streaming Engines ---
  {
    name: 'PostgreSQL Database',
    provider: 'Database',
    badgeColor: '#336791',
    category: 'SQL Database',
    pattern: /\bpostgres\b|\bpostgresql\b|\bpsql\b|\busers?\s*db\s*\(postgresql\)/i,
    style: 'shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#336791;strokeColor=#1A3752;fontColor=#ffffff;whiteSpace=wrap;html=1;fontStyle=1;',
    width: 120,
    height: 70,
  },
  {
    name: 'Redis In-Memory Cache',
    provider: 'Database',
    badgeColor: '#DC382D',
    category: 'Cache',
    pattern: /\bredis\b/i,
    style: 'shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#DC382D;strokeColor=#731610;fontColor=#ffffff;whiteSpace=wrap;html=1;fontStyle=1;',
    width: 120,
    height: 70,
  },
  {
    name: 'Apache Kafka Event Cluster',
    provider: 'Database',
    badgeColor: '#231F20',
    category: 'Message Broker',
    pattern: /\bkafka\b/i,
    style: 'rounded=1;arcSize=20;fillColor=#231F20;strokeColor=#000000;fontColor=#ffffff;whiteSpace=wrap;html=1;fontStyle=1;',
    width: 140,
    height: 60,
  },
  {
    name: 'MongoDB Document DB',
    provider: 'Database',
    badgeColor: '#47A248',
    category: 'NoSQL Database',
    pattern: /\bmongo\b|\bmongodb\b/i,
    style: 'shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#47A248;strokeColor=#1E4620;fontColor=#ffffff;whiteSpace=wrap;html=1;fontStyle=1;',
    width: 120,
    height: 70,
  },
  {
    name: 'Snowflake Data Warehouse',
    provider: 'Database',
    badgeColor: '#29B5E8',
    category: 'Analytics Warehouse',
    pattern: /\bsnowflake\b/i,
    style: 'shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#29B5E8;strokeColor=#11556C;fontColor=#ffffff;whiteSpace=wrap;html=1;fontStyle=1;',
    width: 130,
    height: 70,
  },
  {
    name: 'OpenSearch / Elasticsearch',
    provider: 'Database',
    badgeColor: '#005571',
    category: 'Search Engine',
    pattern: /\bopensearch\b|\belasticsearch\b|\bopen\s*search\b/i,
    style: 'shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#005571;strokeColor=#003344;fontColor=#ffffff;whiteSpace=wrap;html=1;fontStyle=1;',
    width: 125,
    height: 70,
  },
  {
    name: 'Database Engine',
    provider: 'Database',
    badgeColor: '#4F46E5',
    category: 'SQL / NoSQL',
    pattern: /\bdatabase\b|\bpostgres\b|\bmysql\b/i,
    style: 'shape=cylinder3;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#4F46E5;strokeColor=#3730A3;fontColor=#ffffff;whiteSpace=wrap;html=1;fontStyle=1;',
    width: 120,
    height: 65,
  },

  // --- Kubernetes & Containers ---
  {
    name: 'Kubernetes Pod',
    provider: 'Kubernetes',
    badgeColor: '#326CE5',
    category: 'Workload',
    pattern: /\bk8s\s*pod\b|\bpod\b|\bapp\s*pod\b/i,
    style: 'shape=mxgraph.kubernetes.icon;prIcon=pod;fillColor=#326CE5;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'Kubernetes Ingress',
    provider: 'Kubernetes',
    badgeColor: '#326CE5',
    category: 'Traffic Routing',
    pattern: /\bk8s\s*ingress\b|\bingress\s*controller\b|\bingress\b/i,
    style: 'shape=mxgraph.kubernetes.icon;prIcon=ing;fillColor=#326CE5;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'Kubernetes Service',
    provider: 'Kubernetes',
    badgeColor: '#326CE5',
    category: 'Networking',
    pattern: /\bk8s\s*svc\b|\bk8s\s*service\b|\bclusterip\b/i,
    style: 'shape=mxgraph.kubernetes.icon;prIcon=svc;fillColor=#326CE5;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'Kubernetes Deployment',
    provider: 'Kubernetes',
    badgeColor: '#326CE5',
    category: 'Workload Controller',
    pattern: /\bk8s\s*deployment\b|\bdeployment\b/i,
    style: 'shape=mxgraph.kubernetes.icon;prIcon=deploy;fillColor=#326CE5;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'Docker Engine',
    provider: 'DevOps',
    badgeColor: '#2496ED',
    category: 'Containerization',
    pattern: /\bdocker\b/i,
    style: 'rounded=1;arcSize=15;fillColor=#2496ED;strokeColor=#12588F;fontColor=#ffffff;whiteSpace=wrap;html=1;fontStyle=1;',
    width: 130,
    height: 60,
  },

  // --- Google Cloud (GCP) ---
  {
    name: 'Google BigQuery',
    provider: 'GCP',
    badgeColor: '#4285F4',
    category: 'Data Analytics',
    pattern: /\bbigquery\b/i,
    style: 'shape=mxgraph.gcp2.bigquery;fillColor=#4285F4;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'Google Cloud Pub/Sub',
    provider: 'GCP',
    badgeColor: '#4285F4',
    category: 'Messaging',
    pattern: /\bpub\s*\/?\s*sub\b/i,
    style: 'shape=mxgraph.gcp2.pub_sub;fillColor=#4285F4;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'Google Cloud Run',
    provider: 'GCP',
    badgeColor: '#4285F4',
    category: 'Serverless Container',
    pattern: /\bcloud\s*run\b/i,
    style: 'shape=mxgraph.gcp2.cloud_run;fillColor=#4285F4;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'Google Cloud Platform',
    provider: 'GCP',
    badgeColor: '#4285F4',
    category: 'Cloud Provider',
    pattern: /\bgoogle\b|\bgcp\b/i,
    style: 'shape=mxgraph.gcp2.compute_engine;fillColor=#4285F4;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },

  // --- Azure ---
  {
    name: 'Azure Cosmos DB',
    provider: 'Azure',
    badgeColor: '#0072C6',
    category: 'Globally Distributed DB',
    pattern: /\bcosmos\b|\bcosmos\s*db\b/i,
    style: 'shape=mxgraph.azure.cosmos_db;fillColor=#0072C6;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'Azure Blob Storage',
    provider: 'Azure',
    badgeColor: '#0072C6',
    category: 'Object Storage',
    pattern: /\bazure\s*blob\b/i,
    style: 'shape=mxgraph.azure.blob_storage;fillColor=#0072C6;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'Azure AKS Cluster',
    provider: 'Azure',
    badgeColor: '#0072C6',
    category: 'Managed Kubernetes',
    pattern: /\baks\b/i,
    style: 'shape=mxgraph.azure.kubernetes_services;fillColor=#0072C6;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },

  // --- Specialized SaaS & Third-Party Platforms ---
  {
    name: 'Cloudflare CDN & WAF',
    provider: 'DevOps',
    badgeColor: '#F38020',
    category: 'Edge & Security',
    pattern: /\bcloudflare\b/i,
    style: 'ellipse;shape=cloud;fillColor=#F38020;strokeColor=#C65905;fontColor=#ffffff;whiteSpace=wrap;html=1;fontStyle=1;',
    width: 135,
    height: 70,
  },
  {
    name: 'Conviva Video Analytics',
    provider: 'SaaS',
    badgeColor: '#5A32A3',
    category: 'Video Telemetry',
    pattern: /\bconviva\b/i,
    style: 'rounded=1;arcSize=15;fillColor=#5A32A3;strokeColor=#3A1F6E;fontColor=#ffffff;whiteSpace=wrap;html=1;fontStyle=1;',
    width: 125,
    height: 60,
  },
  {
    name: 'Bitmovin / MediaConvert Transcoder',
    provider: 'SaaS',
    badgeColor: '#009688',
    category: 'Video Processing',
    pattern: /\bbitmovin\b|\bmediaconvert\b|\btranscoder\b/i,
    style: 'rounded=1;arcSize=15;fillColor=#009688;strokeColor=#00695C;fontColor=#ffffff;whiteSpace=wrap;html=1;fontStyle=1;',
    width: 145,
    height: 60,
  },
  {
    name: 'DRM License Proxy (Widevine / FairPlay)',
    provider: 'SaaS',
    badgeColor: '#607D8B',
    category: 'Content Protection',
    pattern: /\bdrm\b|\bwidevine\b|\bfairplay\b|\bplayready\b|\baxinom\b/i,
    style: 'shape=mxgraph.aws4.shield;fillColor=#607D8B;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'Video Packager',
    provider: 'SaaS',
    badgeColor: '#0D9488',
    category: 'Media Packaging',
    pattern: /\bpackager\b/i,
    style: 'rounded=1;arcSize=15;fillColor=#0D9488;strokeColor=#0F766E;fontColor=#ffffff;whiteSpace=wrap;html=1;fontStyle=1;',
    width: 120,
    height: 60,
  },
  {
    name: 'Player / Frontend Client',
    provider: 'SaaS',
    badgeColor: '#F43F5E',
    category: 'Client Application',
    pattern: /\bplayer\b|\bfrontend\b|\bweb\s*client\b|\bbrowser\b/i,
    style: 'rounded=1;arcSize=15;fillColor=#F43F5E;strokeColor=#BE123C;fontColor=#ffffff;whiteSpace=wrap;html=1;fontStyle=1;',
    width: 130,
    height: 60,
  },
];

/**
 * Checks whether an element is a background grouping container box or boundary banner.
 * Containers and rail banners must NEVER have their shapes or geometry altered.
 */
function isContainerOrBanner(cell: Element): boolean {
  const geo = cell.querySelector('mxGeometry');
  const w = parseFloat(geo?.getAttribute('width') || '0');
  const h = parseFloat(geo?.getAttribute('height') || '0');
  const style = cell.getAttribute('style') || '';
  const val = (cell.getAttribute('value') || cell.getAttribute('label') || '').toLowerCase();

  if (style.includes('swimlane') || style.includes('shape=container') || style.includes('group')) {
    return true;
  }
  // Large background boundaries (e.g. EU Central 1, Backend Services)
  if (w >= 350 && h >= 160 && /central|backend|routing|app|vpc|zone|container|cluster/i.test(val)) {
    return true;
  }
  // Backbone banners (e.g. Data Stream rail)
  if (w >= 450 || /stream|bus|backbone/i.test(val)) {
    return true;
  }
  return false;
}

/**
 * Scans the current Draw.io diagram XML and detects nodes matching cloud infrastructure
 * and third-party systems. Returns a list of candidates for review or instant application.
 */
export function detectIconMatches(xml: string): IconMatchItem[] {
  if (!xml || (!xml.includes('<mxGraphModel') && !xml.includes('<diagram'))) {
    return [];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const vertexElements = Array.from(doc.querySelectorAll('mxCell[vertex="1"]'));
  const matches: IconMatchItem[] = [];

  for (const cell of vertexElements) {
    if (isContainerOrBanner(cell)) continue;

    const id = cell.getAttribute('id') || cell.parentElement?.getAttribute('id') || '';
    if (!id || id === '0' || id === '1') continue;

    const rawValue = cell.getAttribute('value') || cell.getAttribute('label') || '';
    const cleanLabel = rawValue.replace(/<[^>]*>/g, '').replace(/&#xa;/g, ' ').replace(/[\r\n\t]+/g, ' ').trim();
    if (!cleanLabel) continue;

    const currentStyle = cell.getAttribute('style') || '';

    // Check against icon catalog
    for (const def of ICON_DEFINITIONS) {
      if (def.pattern.test(cleanLabel)) {
        // Skip if already has this exact shape
        if (currentStyle.includes(def.style.slice(0, 30))) {
          break;
        }

        matches.push({
          id,
          originalLabel: cleanLabel,
          matchedTechnology: def.name,
          provider: def.provider,
          currentStyle,
          newStyle: def.style,
          badgeColor: def.badgeColor,
          category: def.category,
          targetW: def.width,
          targetH: def.height,
          selected: true,
        });
        break; // matched best definition
      }
    }
  }

  return matches;
}

/**
 * Replaces matched generic nodes with official cloud and third-party stencil icons.
 * CRITICAL SAFETY RULES:
 * 1. 100% of all arrows, edges, waypoints, sources, targets, and styles remain completely untouched.
 * 2. Unmatched nodes, containers, and banners are ignored and preserved as-is.
 * 3. Node centers (centerX, centerY) are strictly preserved so edge dockings remain seamlessly aligned.
 */
export function beautifyIconsInXml(
  xml: string,
  selectedIds?: string[]
): { xml: string; updatedCount: number; matches: IconMatchItem[] } {
  if (!xml || (!xml.includes('<mxGraphModel') && !xml.includes('<diagram'))) {
    return { xml, updatedCount: 0, matches: [] };
  }

  const matches = detectIconMatches(xml);
  const idsToUpdate = new Set(selectedIds || matches.map((m) => m.id));

  if (idsToUpdate.size === 0) {
    return { xml, updatedCount: 0, matches };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const matchLookup = new Map<string, IconMatchItem>();
  for (const m of matches) {
    if (idsToUpdate.has(m.id)) {
      matchLookup.set(m.id, m);
    }
  }

  let updatedCount = 0;
  const vertexElements = Array.from(doc.querySelectorAll('mxCell[vertex="1"]'));

  for (const cell of vertexElements) {
    const id = cell.getAttribute('id') || cell.parentElement?.getAttribute('id') || '';
    const match = matchLookup.get(id);
    if (!match) continue;

    // Update style with official stencil shape
    cell.setAttribute('style', match.newStyle);

    // Keep center coordinate perfectly anchored
    const geo = cell.querySelector('mxGeometry');
    if (geo) {
      const origX = parseFloat(geo.getAttribute('x') || '100');
      const origY = parseFloat(geo.getAttribute('y') || '100');
      const origW = parseFloat(geo.getAttribute('width') || '120');
      const origH = parseFloat(geo.getAttribute('height') || '60');

      const centerX = origX + origW / 2;
      const centerY = origY + origH / 2;

      const newW = match.targetW;
      const newH = match.targetH;
      const newX = Math.round(centerX - newW / 2);
      const newY = Math.round(centerY - newH / 2);

      geo.setAttribute('x', String(newX));
      geo.setAttribute('y', String(newY));
      geo.setAttribute('width', String(newW));
      geo.setAttribute('height', String(newH));
    }

    updatedCount++;
  }

  const serializer = new XMLSerializer();
  const updatedXml = serializer.serializeToString(doc);

  return { xml: updatedXml, updatedCount, matches };
}
