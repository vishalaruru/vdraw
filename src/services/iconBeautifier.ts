export interface IconMatchItem {
  id: string;
  originalLabel: string;
  matchedTechnology: string;
  provider: 'AWS' | 'GCP' | 'Azure' | 'Kubernetes' | 'Database' | 'DevOps' | 'SaaS' | 'Web';
  currentStyle: string;
  newStyle: string;
  badgeColor: string;
  category: string;
  targetW: number;
  targetH: number;
  logoUrl?: string;
  source: 'local' | 'web';
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
  logoUrl?: string;
}

const ICON_DEFINITIONS: IconDefinition[] = [
  // --- Web & Client Endpoints ---
  {
    name: 'Web Client / Browser',
    provider: 'Web',
    badgeColor: '#2563EB',
    category: 'Client & Frontend',
    pattern: /\bweb\b|\bwebsite\b|\bweb\s*app\b|\bweb\s*client\b|\bbrowser\b|\bweb\s*application\b/i,
    style: 'shape=mxgraph.aws4.client;fillColor=#2563EB;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'Catalog Service',
    provider: 'AWS',
    badgeColor: '#8C4FFF',
    category: 'Analytics & Service Catalog',
    pattern: /\b(?:catalog|data\s*catalog|service\s*catalog|product\s*catalog|catalog\s*service)\b/i,
    style: 'shape=mxgraph.aws4.service_catalog;fillColor=#8C4FFF;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },

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

  // --- Databases & Streaming Engines (SimpleIcons SVG Logos) ---
  {
    name: 'PostgreSQL Database',
    provider: 'Database',
    badgeColor: '#336791',
    category: 'SQL Database',
    pattern: /\bpostgres(?:ql|\s*sql)?\b|\bpsql\b|\busers?\s*db/i,
    style: 'shape=image;image=https://cdn.simpleicons.org/postgresql/336791;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    logoUrl: 'https://cdn.simpleicons.org/postgresql/336791',
    width: 60,
    height: 60,
  },
  {
    name: 'Redis In-Memory Cache',
    provider: 'Database',
    badgeColor: '#DC382D',
    category: 'Cache',
    pattern: /\bredis\b/i,
    style: 'shape=image;image=https://cdn.simpleicons.org/redis/DC382D;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    logoUrl: 'https://cdn.simpleicons.org/redis/DC382D',
    width: 60,
    height: 60,
  },
  {
    name: 'Apache Kafka Event Cluster',
    provider: 'Database',
    badgeColor: '#231F20',
    category: 'Message Broker',
    pattern: /\bkafka\b/i,
    style: 'shape=image;image=https://cdn.simpleicons.org/apachekafka/231F20;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    logoUrl: 'https://cdn.simpleicons.org/apachekafka/231F20',
    width: 60,
    height: 60,
  },
  {
    name: 'MongoDB Document DB',
    provider: 'Database',
    badgeColor: '#47A248',
    category: 'NoSQL Database',
    pattern: /\bmongo\b|\bmongodb\b/i,
    style: 'shape=image;image=https://cdn.simpleicons.org/mongodb/47A248;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    logoUrl: 'https://cdn.simpleicons.org/mongodb/47A248',
    width: 60,
    height: 60,
  },
  {
    name: 'Snowflake Data Warehouse',
    provider: 'Database',
    badgeColor: '#29B5E8',
    category: 'Analytics Warehouse',
    pattern: /\bsnowflake\b/i,
    style: 'shape=image;image=https://cdn.simpleicons.org/snowflake/29B5E8;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    logoUrl: 'https://cdn.simpleicons.org/snowflake/29B5E8',
    width: 60,
    height: 60,
  },
  {
    name: 'OpenSearch / Elasticsearch',
    provider: 'Database',
    badgeColor: '#005571',
    category: 'Search Engine',
    pattern: /\bopensearch\b|\belasticsearch\b|\bopen\s*search\b/i,
    style: 'shape=image;image=https://cdn.simpleicons.org/opensearch/005571;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    logoUrl: 'https://cdn.simpleicons.org/opensearch/005571',
    width: 60,
    height: 60,
  },

  // --- Kubernetes & Containers ---
  {
    name: 'Kubernetes Pod',
    provider: 'Kubernetes',
    badgeColor: '#326CE5',
    category: 'Workload',
    pattern: /\bk8s\s*pod\b|\bpod\b|\bapp\s*pod\b/i,
    style: 'shape=mxgraph.kubernetes.icon;prIcon=pod;fillColor=#326CE5;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    logoUrl: 'https://cdn.simpleicons.org/kubernetes/326CE5',
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
    logoUrl: 'https://cdn.simpleicons.org/kubernetes/326CE5',
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
    logoUrl: 'https://cdn.simpleicons.org/kubernetes/326CE5',
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
    logoUrl: 'https://cdn.simpleicons.org/kubernetes/326CE5',
    width: 60,
    height: 60,
  },
  {
    name: 'Docker Engine',
    provider: 'DevOps',
    badgeColor: '#2496ED',
    category: 'Containerization',
    pattern: /\bdocker\b/i,
    style: 'shape=image;image=https://cdn.simpleicons.org/docker/2496ED;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    logoUrl: 'https://cdn.simpleicons.org/docker/2496ED',
    width: 60,
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
    logoUrl: 'https://cdn.simpleicons.org/googlecloud/4285F4',
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
    logoUrl: 'https://cdn.simpleicons.org/googlecloud/4285F4',
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
    logoUrl: 'https://cdn.simpleicons.org/googlecloud/4285F4',
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
    logoUrl: 'https://cdn.simpleicons.org/googlecloud/4285F4',
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
    style: 'shape=image;image=https://cdn.simpleicons.org/cloudflare/F38020;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    logoUrl: 'https://cdn.simpleicons.org/cloudflare/F38020',
    width: 60,
    height: 60,
  },
  {
    name: 'Conviva Video Analytics',
    provider: 'SaaS',
    badgeColor: '#5A32A3',
    category: 'Video Telemetry',
    pattern: /\bconviva\b/i,
    style: 'shape=image;image=https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://conviva.com&size=128;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    logoUrl: 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://conviva.com&size=128',
    width: 60,
    height: 60,
  },
  {
    name: 'Bitmovin Video Infrastructure',
    provider: 'SaaS',
    badgeColor: '#009688',
    category: 'Video Transcoder & Player',
    pattern: /\bbitmovin\b|\bmediaconvert\b|\btranscoder\b/i,
    style: 'shape=image;image=https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://bitmovin.com&size=128;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    logoUrl: 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://bitmovin.com&size=128',
    width: 60,
    height: 60,
  },
  {
    name: 'Axinom DRM & Media',
    provider: 'SaaS',
    badgeColor: '#0284C7',
    category: 'Content Protection & DRM',
    pattern: /\baxinom\b/i,
    style: 'shape=image;image=https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://axinom.com&size=128;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    logoUrl: 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://axinom.com&size=128',
    width: 60,
    height: 60,
  },
  {
    name: 'DRM License Proxy (Widevine / FairPlay)',
    provider: 'SaaS',
    badgeColor: '#607D8B',
    category: 'Content Protection',
    pattern: /\bdrm\b|\bwidevine\b|\bfairplay\b|\bplayready\b/i,
    style: 'shape=mxgraph.aws4.shield;fillColor=#607D8B;strokeColor=none;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    width: 60,
    height: 60,
  },
  {
    name: 'Stripe Payments',
    provider: 'SaaS',
    badgeColor: '#635BFF',
    category: 'Payment Infrastructure',
    pattern: /\bstripe\b|\bpayment\s*gateway\b/i,
    style: 'shape=image;image=https://cdn.simpleicons.org/stripe/635BFF;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    logoUrl: 'https://cdn.simpleicons.org/stripe/635BFF',
    width: 60,
    height: 60,
  },
  {
    name: 'Datadog Observability',
    provider: 'DevOps',
    badgeColor: '#6366F1',
    category: 'Monitoring & APM',
    pattern: /\bdatadog\b/i,
    style: 'shape=image;image=https://cdn.simpleicons.org/datadog/6366F1;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    logoUrl: 'https://cdn.simpleicons.org/datadog/6366F1',
    width: 60,
    height: 60,
  },
  {
    name: 'Grafana Dashboards',
    provider: 'DevOps',
    badgeColor: '#F46800',
    category: 'Visualization',
    pattern: /\bgrafana\b/i,
    style: 'shape=image;image=https://cdn.simpleicons.org/grafana/F46800;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;',
    logoUrl: 'https://cdn.simpleicons.org/grafana/F46800',
    width: 60,
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
 * and third-party systems using the local fast-path catalog.
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
    const cleanLabel = rawValue
      .replace(/<[^>]*>/g, '')
      .replace(/&#xa;/g, ' ')
      .replace(/[\r\n\t]+/g, ' ')
      .trim();
    if (!cleanLabel) continue;

    const currentStyle = cell.getAttribute('style') || '';

    // Check against icon catalog
    for (const def of ICON_DEFINITIONS) {
      if (def.pattern.test(cleanLabel)) {
        // Skip if already has this exact stencil icon shape or image
        const shapePart = def.style.split(';')[0];
        if (currentStyle.includes(shapePart)) {
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
          logoUrl: def.logoUrl,
          source: 'local',
          selected: true,
        });
        break; // matched best definition
      }
    }
  }

  return matches;
}

const KNOWN_SAAS_TECH_BRANDS: Array<{
  pattern: RegExp;
  tech: string;
  provider: IconMatchItem['provider'];
  category: string;
  badgeColor: string;
  domain?: string;
  slug?: string;
}> = [
  { pattern: /\b(?:bitmovin)\b/i, tech: 'Bitmovin', provider: 'SaaS', category: 'Video Streaming & Encoding', badgeColor: '#1F69FF', domain: 'bitmovin.com', slug: 'bitmovin' },
  { pattern: /\b(?:conviva)\b/i, tech: 'Conviva', provider: 'SaaS', category: 'Streaming Video Analytics', badgeColor: '#0054A6', domain: 'conviva.com' },
  { pattern: /\b(?:axinom)\b/i, tech: 'Axinom', provider: 'SaaS', category: 'DRM & Media Processing', badgeColor: '#2B303A', domain: 'axinom.com' },
  { pattern: /\b(?:dazn)\b/i, tech: 'DAZN', provider: 'SaaS', category: 'OTT Sports Streaming Platform', badgeColor: '#000000', domain: 'dazn.com' },
  { pattern: /\b(?:stripe)\b/i, tech: 'Stripe', provider: 'SaaS', category: 'Payment Gateway', badgeColor: '#635BFF', domain: 'stripe.com', slug: 'stripe' },
  { pattern: /\b(?:auth0)\b/i, tech: 'Auth0', provider: 'SaaS', category: 'Authentication & IDaaS', badgeColor: '#EB5424', domain: 'auth0.com', slug: 'auth0' },
  { pattern: /\b(?:twilio)\b/i, tech: 'Twilio', provider: 'SaaS', category: 'Cloud Communications / SMS', badgeColor: '#F22F46', domain: 'twilio.com', slug: 'twilio' },
  { pattern: /\b(?:datadog)\b/i, tech: 'Datadog', provider: 'DevOps', category: 'Cloud Monitoring & APM', badgeColor: '#632CA6', domain: 'datadoghq.com', slug: 'datadog' },
  { pattern: /\b(?:snowflake)\b/i, tech: 'Snowflake', provider: 'Database', category: 'Cloud Data Warehouse', badgeColor: '#29B5E8', domain: 'snowflake.com', slug: 'snowflake' },
  { pattern: /\b(?:cloudflare)\b/i, tech: 'Cloudflare', provider: 'SaaS', category: 'Edge CDN & DNS & WAF', badgeColor: '#F38020', domain: 'cloudflare.com', slug: 'cloudflare' },
  { pattern: /\b(?:fastly)\b/i, tech: 'Fastly', provider: 'SaaS', category: 'Edge Cloud & CDN', badgeColor: '#FF282D', domain: 'fastly.com', slug: 'fastly' },
  { pattern: /\b(?:akamai)\b/i, tech: 'Akamai', provider: 'SaaS', category: 'Content Delivery Network', badgeColor: '#0092D0', domain: 'akamai.com', slug: 'akamai' },
  { pattern: /\b(?:sentry)\b/i, tech: 'Sentry', provider: 'DevOps', category: 'Application Error Tracking', badgeColor: '#362D59', domain: 'sentry.io', slug: 'sentry' },
  { pattern: /\b(?:new\s*relic)\b/i, tech: 'New Relic', provider: 'DevOps', category: 'Observability & APM', badgeColor: '#008C99', domain: 'newrelic.com', slug: 'newrelic' },
  { pattern: /\b(?:grafana)\b/i, tech: 'Grafana', provider: 'DevOps', category: 'Metrics & Dashboards', badgeColor: '#F46800', domain: 'grafana.com', slug: 'grafana' },
  { pattern: /\b(?:prometheus)\b/i, tech: 'Prometheus', provider: 'DevOps', category: 'Time Series Monitoring', badgeColor: '#E6522C', domain: 'prometheus.io', slug: 'prometheus' },
  { pattern: /\b(?:splunk)\b/i, tech: 'Splunk', provider: 'DevOps', category: 'Log Analysis & SIEM', badgeColor: '#000000', domain: 'splunk.com', slug: 'splunk' },
  { pattern: /\b(?:pagerduty)\b/i, tech: 'PagerDuty', provider: 'DevOps', category: 'Incident Management', badgeColor: '#06AC38', domain: 'pagerduty.com', slug: 'pagerduty' },
  { pattern: /\b(?:launchdarkly)\b/i, tech: 'LaunchDarkly', provider: 'DevOps', category: 'Feature Management & Flags', badgeColor: '#405BFF', domain: 'launchdarkly.com', slug: 'launchdarkly' },
  { pattern: /\b(?:postman)\b/i, tech: 'Postman', provider: 'DevOps', category: 'API Platform', badgeColor: '#FF6C37', domain: 'postman.com', slug: 'postman' },
  { pattern: /\b(?:terraform)\b/i, tech: 'Terraform', provider: 'DevOps', category: 'Infrastructure as Code', badgeColor: '#844FBA', domain: 'terraform.io', slug: 'terraform' },
  { pattern: /\b(?:vault)\b/i, tech: 'HashiCorp Vault', provider: 'DevOps', category: 'Secrets Management', badgeColor: '#000000', domain: 'hashicorp.com/vault', slug: 'vault' },
  { pattern: /\b(?:argocd|argo\s*cd)\b/i, tech: 'Argo CD', provider: 'DevOps', category: 'GitOps Continuous Delivery', badgeColor: '#EF7B4D', domain: 'argoproj.github.io', slug: 'argo' },
  { pattern: /\b(?:github)\b/i, tech: 'GitHub', provider: 'DevOps', category: 'Code Repository & Actions', badgeColor: '#181717', domain: 'github.com', slug: 'github' },
  { pattern: /\b(?:gitlab)\b/i, tech: 'GitLab', provider: 'DevOps', category: 'DevSecOps Platform', badgeColor: '#FC6D26', domain: 'gitlab.com', slug: 'gitlab' },
  { pattern: /\b(?:jira)\b/i, tech: 'Jira', provider: 'SaaS', category: 'Issue & Project Tracking', badgeColor: '#0052CC', domain: 'atlassian.com/jira', slug: 'jira' },
  { pattern: /\b(?:slack)\b/i, tech: 'Slack', provider: 'SaaS', category: 'Team Communications', badgeColor: '#4A154B', domain: 'slack.com', slug: 'slack' },
  { pattern: /\b(?:sendgrid)\b/i, tech: 'Twilio SendGrid', provider: 'SaaS', category: 'Email Delivery API', badgeColor: '#1A82E2', domain: 'sendgrid.com', slug: 'twilio' },
  { pattern: /\b(?:firebase)\b/i, tech: 'Firebase', provider: 'GCP', category: 'Mobile & Web App Platform', badgeColor: '#FFCA28', domain: 'firebase.google.com', slug: 'firebase' },
  { pattern: /\b(?:supabase)\b/i, tech: 'Supabase', provider: 'Database', category: 'Open Source Firebase / Postgres', badgeColor: '#3ECF8E', domain: 'supabase.com', slug: 'supabase' },
  { pattern: /\b(?:vercel)\b/i, tech: 'Vercel', provider: 'DevOps', category: 'Frontend Cloud & Edge Hosting', badgeColor: '#000000', domain: 'vercel.com', slug: 'vercel' },
  { pattern: /\b(?:netlify)\b/i, tech: 'Netlify', provider: 'DevOps', category: 'Web App Hosting & Serverless', badgeColor: '#00C7B7', domain: 'netlify.com', slug: 'netlify' },
  { pattern: /\b(?:openai|chatgpt)\b/i, tech: 'OpenAI', provider: 'SaaS', category: 'Generative AI & LLMs', badgeColor: '#412991', domain: 'openai.com', slug: 'openai' },
  { pattern: /\b(?:anthropic|claude)\b/i, tech: 'Anthropic Claude', provider: 'SaaS', category: 'AI Research & Frontier LLMs', badgeColor: '#D97706', domain: 'anthropic.com', slug: 'anthropic' },
  { pattern: /\b(?:okta)\b/i, tech: 'Okta', provider: 'SaaS', category: 'Enterprise Identity Management', badgeColor: '#007DC1', domain: 'okta.com', slug: 'okta' },
  { pattern: /\b(?:salesforce)\b/i, tech: 'Salesforce', provider: 'SaaS', category: 'CRM & Cloud Enterprise', badgeColor: '#00A1E0', domain: 'salesforce.com', slug: 'salesforce' },
  { pattern: /\b(?:shopify)\b/i, tech: 'Shopify', provider: 'SaaS', category: 'E-Commerce Platform', badgeColor: '#7AB55C', domain: 'shopify.com', slug: 'shopify' },
  { pattern: /\b(?:segment)\b/i, tech: 'Twilio Segment', provider: 'SaaS', category: 'Customer Data Platform (CDP)', badgeColor: '#52BD95', domain: 'segment.com', slug: 'segment' },
  { pattern: /\b(?:mixpanel)\b/i, tech: 'Mixpanel', provider: 'SaaS', category: 'Product Analytics', badgeColor: '#7856FF', domain: 'mixpanel.com', slug: 'mixpanel' },
  { pattern: /\b(?:amplitude)\b/i, tech: 'Amplitude', provider: 'SaaS', category: 'Digital Analytics', badgeColor: '#1E61F0', domain: 'amplitude.com', slug: 'amplitude' },
  { pattern: /\b(?:nginx)\b/i, tech: 'Nginx', provider: 'DevOps', category: 'Reverse Proxy & Web Server', badgeColor: '#009639', domain: 'nginx.com', slug: 'nginx' },
  { pattern: /\b(?:redis)\b/i, tech: 'Redis', provider: 'Database', category: 'In-Memory Cache & Key-Value', badgeColor: '#FF4438', domain: 'redis.io', slug: 'redis' },
  { pattern: /\b(?:kafka)\b/i, tech: 'Apache Kafka', provider: 'DevOps', category: 'Distributed Event Streaming', badgeColor: '#231F20', domain: 'kafka.apache.org', slug: 'apachekafka' },
  { pattern: /\b(?:docker)\b/i, tech: 'Docker', provider: 'DevOps', category: 'Containerization', badgeColor: '#2496ED', domain: 'docker.com', slug: 'docker' },
  { pattern: /\b(?:elasticsearch|elastic\s*search)\b/i, tech: 'Elasticsearch', provider: 'Database', category: 'Search & Analytics Engine', badgeColor: '#005571', domain: 'elastic.co', slug: 'elasticsearch' },
  { pattern: /\b(?:mongodb|mongo)\b/i, tech: 'MongoDB', provider: 'Database', category: 'Document Database', badgeColor: '#47A248', domain: 'mongodb.com', slug: 'mongodb' },
  { pattern: /\b(?:rabbitmq)\b/i, tech: 'RabbitMQ', provider: 'DevOps', category: 'Message Broker', badgeColor: '#FF6600', domain: 'rabbitmq.com', slug: 'rabbitmq' },
];

/**
 * Web-Augmented Icon Search:
 * Uses AI + Web search to identify any un-matched component (companies, B2B vendors, specialized SaaS),
 * retrieves their official high-res brand logos or SimpleIcons vector URLs, and returns new matches.
 */
export async function searchWebIcons(
  xml: string,
  existingMatches: IconMatchItem[] = [],
  apiKey?: string
): Promise<IconMatchItem[]> {
  if (!xml || (!xml.includes('<mxGraphModel') && !xml.includes('<diagram'))) {
    return [];
  }

  const matchedIds = new Set(existingMatches.map((m) => m.id));
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const vertexElements = Array.from(doc.querySelectorAll('mxCell[vertex="1"]'));
  const candidateNodes: { id: string; label: string; currentStyle: string }[] = [];

  for (const cell of vertexElements) {
    if (isContainerOrBanner(cell)) continue;
    const id = cell.getAttribute('id') || cell.parentElement?.getAttribute('id') || '';
    if (!id || id === '0' || id === '1' || matchedIds.has(id)) continue;

    const rawValue = cell.getAttribute('value') || cell.getAttribute('label') || '';
    const cleanLabel = rawValue
      .replace(/<[^>]*>/g, '')
      .replace(/&#xa;/g, ' ')
      .replace(/[\r\n\t]+/g, ' ')
      .trim();
    if (!cleanLabel) continue;

    const currentStyle = cell.getAttribute('style') || '';
    if (
      currentStyle.includes('shape=mxgraph.aws4.') ||
      currentStyle.includes('shape=mxgraph.gcp2.') ||
      currentStyle.includes('shape=mxgraph.azure.') ||
      currentStyle.includes('image=')
    ) {
      continue;
    }

    candidateNodes.push({ id, label: cleanLabel, currentStyle });
  }

  if (candidateNodes.length === 0) {
    return [];
  }

  const discoveredMatches: IconMatchItem[] = [];
  const unmatchedForAi: typeof candidateNodes = [];

  // Tier 2: Instant Fast-Path SaaS & Developer Tool Matching
  for (const node of candidateNodes) {
    let matchedBrand: (typeof KNOWN_SAAS_TECH_BRANDS)[0] | undefined;
    for (const brand of KNOWN_SAAS_TECH_BRANDS) {
      if (brand.pattern.test(node.label)) {
        matchedBrand = brand;
        break;
      }
    }

    if (matchedBrand) {
      const cleanHex = matchedBrand.badgeColor.replace('#', '');
      let logoUrl = '';
      if (matchedBrand.slug) {
        logoUrl = `https://cdn.simpleicons.org/${matchedBrand.slug}/${cleanHex}`;
      } else if (matchedBrand.domain) {
        logoUrl = `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${matchedBrand.domain}&size=128`;
      }

      discoveredMatches.push({
        id: node.id,
        originalLabel: node.label,
        matchedTechnology: matchedBrand.tech,
        provider: matchedBrand.provider,
        currentStyle: node.currentStyle,
        newStyle: `shape=image;image=${logoUrl};verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;`,
        badgeColor: matchedBrand.badgeColor,
        category: matchedBrand.category,
        targetW: 60,
        targetH: 60,
        logoUrl: logoUrl || undefined,
        source: 'web',
        selected: true,
      });
    } else {
      unmatchedForAi.push(node);
    }
  }

  if (unmatchedForAi.length === 0) {
    return discoveredMatches;
  }

  // Tier 3: AI + Web Search Grounding via Gemini
  const envKey = (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } })?.env?.VITE_GEMINI_API_KEY || '';
  const storedKey = (typeof localStorage !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') : '') || '';
  const cleanStored = storedKey.includes('AIzaSyBCdBG4Cu') ? '' : storedKey;
  const cleanPassed = apiKey && !apiKey.includes('AIzaSyBCdBG4Cu') ? apiKey : '';
  const keyToUse = cleanPassed || envKey || cleanStored;

  if (!keyToUse) {
    return discoveredMatches;
  }

  const candidateModels = [
    'gemini-flash-lite-latest',
    'gemini-3-flash-preview',
    'gemini-3.5-flash',
  ];

  const prompt = `You are a Principal Cloud Architecture & Tech Brand Logo Identifier.
Analyze the following diagram component labels from a software system architecture diagram.
For each component, identify if it corresponds to an actual technology, software tool, cloud service, B2B vendor, media streaming platform, or SaaS company (for example: "Conviva" is conviva.com; "Bitmovin" is bitmovin.com; "Axinom" is axinom.com; "DAZN" is dazn.com; "Snowflake" is snowflake; "DOTS" or "MFL" could be video encoding/ingest; "Redis" is redis; etc.).

Components to analyze:
${JSON.stringify(unmatchedForAi.map((n) => ({ id: n.id, label: n.label })), null, 2)}

Return strictly valid JSON array of matched items matching this schema:
[
  {
    "id": "node id",
    "matchedTechnology": "Official Name of Tech/Product/Company",
    "provider": "AWS" | "GCP" | "Azure" | "Kubernetes" | "Database" | "DevOps" | "SaaS" | "Web",
    "category": "e.g. Video Analytics, DRM, Object Storage, Database, Transcoding",
    "badgeColor": "#hexColor",
    "simpleIconSlug": "slug on simpleicons.org (e.g. postgresql, redis, docker, snowflake, stripe, cloudflare, kubernetes) OR null if not on simpleicons",
    "websiteDomain": "clean domain without https:// (e.g. conviva.com, bitmovin.com, axinom.com, dazn.com) OR null",
    "drawioShape": "optional mxgraph stencil shape if standard AWS/GCP (e.g. shape=mxgraph.aws4.rds;) OR null"
  }
]
Only return components that represent identifiable technologies, products, or vendors. For internal flow phrases that are not technologies (e.g. "Verify Password", "Display Error", "OTP Valid?"), do NOT include them.
Output only raw JSON, no markdown formatting.`;

  for (const model of candidateModels) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
          keyToUse.trim()
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
          signal: AbortSignal.timeout(18000),
        }
      );

      if (!response.ok) continue;
      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const parsed: any[] = JSON.parse(rawText.trim());

      for (const item of parsed) {
        const origNode = unmatchedForAi.find((n) => n.id === item.id);
        if (!origNode) continue;

        let style = '';
        let logoUrl = '';
        const cleanHex = (item.badgeColor || '#6366F1').replace('#', '');

        if (item.drawioShape) {
          style = item.drawioShape;
          if (!style.includes('verticalLabelPosition')) {
            style += 'verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;';
          }
        } else if (item.simpleIconSlug) {
          logoUrl = `https://cdn.simpleicons.org/${item.simpleIconSlug}/${cleanHex}`;
          style = `shape=image;image=${logoUrl};verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;`;
        } else if (item.websiteDomain) {
          logoUrl = `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${item.websiteDomain}&size=128`;
          style = `shape=image;image=${logoUrl};verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;`;
        } else {
          continue;
        }

        discoveredMatches.push({
          id: item.id,
          originalLabel: origNode.label,
          matchedTechnology: item.matchedTechnology,
          provider: item.provider || 'SaaS',
          currentStyle: origNode.currentStyle,
          newStyle: style,
          badgeColor: item.badgeColor || '#6366F1',
          category: item.category || 'Third-Party Service',
          targetW: 60,
          targetH: 60,
          logoUrl: logoUrl || undefined,
          source: 'web',
          selected: true,
        });
      }

      return discoveredMatches;
    } catch (e) {
      console.warn(`Web icon search failed on ${model}:`, e);
    }
  }

  return discoveredMatches;
}

/**
 * Replaces matched generic nodes with official cloud and third-party stencil icons or web brand logos.
 * CRITICAL SAFETY RULES:
 * 1. 100% of all arrows, edges, waypoints, sources, targets, and styles remain completely untouched.
 * 2. Unmatched nodes, containers, and banners are ignored and preserved as-is.
 * 3. Node centers (centerX, centerY) are strictly preserved so edge dockings remain seamlessly aligned.
 */
export function beautifyIconsInXml(
  xml: string,
  selectedIds?: string[],
  customMatches?: IconMatchItem[]
): { xml: string; updatedCount: number; matches: IconMatchItem[] } {
  if (!xml || (!xml.includes('<mxGraphModel') && !xml.includes('<diagram'))) {
    return { xml, updatedCount: 0, matches: [] };
  }

  const localMatches = detectIconMatches(xml);
  const allMatches = customMatches && customMatches.length > 0 ? customMatches : localMatches;
  const idsToUpdate = new Set(selectedIds || allMatches.map((m) => m.id));

  if (idsToUpdate.size === 0) {
    return { xml, updatedCount: 0, matches: allMatches };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const matchLookup = new Map<string, IconMatchItem>();
  for (const m of allMatches) {
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

    // Update style with official stencil shape or brand image
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

  return { xml: updatedXml, updatedCount, matches: allMatches };
}
