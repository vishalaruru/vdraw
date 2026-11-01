import { ExtractedDiagram } from '../types/diagram';
import { DAZN_ARCHITECTURE_DIAGRAM } from './daznExtracted';

export interface SampleFlowchartItem {
  id: string;
  name: string;
  description: string;
  diagram: ExtractedDiagram;
  previewSvg: string;
}

export const SAMPLE_FLOWCHARTS: SampleFlowchartItem[] = [
  {
    id: 'dazn-architecture',
    name: 'DAZN Ingestion & Platform Architecture (38 Components)',
    description: 'Sports Provider, Rights Mgmt, WON, Pre XML Parser, DAZN Feeds, Producers, Habit, Rails & BFF.',
    diagram: DAZN_ARCHITECTURE_DIAGRAM,
    previewSvg: `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc; border-radius:8px;">
      <rect x="20" y="30" width="70" height="25" rx="4" fill="#dae8fc" stroke="#6c8ebf" stroke-width="1.5"/>
      <text x="55" y="46" font-family="sans-serif" font-size="8" text-anchor="middle" fill="#1e3a8a">Sports Provider</text>
      <rect x="110" y="30" width="70" height="25" rx="4" fill="#dae8fc" stroke="#6c8ebf" stroke-width="1.5"/>
      <text x="145" y="46" font-family="sans-serif" font-size="8" text-anchor="middle" fill="#1e3a8a">WON Layer</text>
      <rect x="30" y="90" width="60" height="25" rx="4" fill="#fff2cc" stroke="#d6b656" stroke-width="1.5"/>
      <text x="60" y="106" font-family="sans-serif" font-size="8" text-anchor="middle" fill="#78350f">Pre XML</text>
      <rect x="110" y="90" width="60" height="25" rx="4" fill="#d5e8d4" stroke="#82b366" stroke-width="1.5"/>
      <text x="140" y="106" font-family="sans-serif" font-size="8" text-anchor="middle" fill="#14532d">DAZN XML</text>
      <rect x="190" y="90" width="60" height="25" rx="4" fill="#dae8fc" stroke="#6c8ebf" stroke-width="1.5"/>
      <text x="220" y="106" font-family="sans-serif" font-size="8" text-anchor="middle" fill="#1e3a8a">DAZN Feeds</text>
      <rect x="270" y="90" width="50" height="25" rx="4" fill="#fff2cc" stroke="#d6b656" stroke-width="1.5"/>
      <text x="295" y="106" font-family="sans-serif" font-size="8" text-anchor="middle" fill="#78350f">Habit</text>
      <rect x="340" y="60" width="45" height="100" rx="4" fill="#fff2cc" stroke="#d6b656" stroke-width="1.5"/>
      <text x="362" y="115" font-family="sans-serif" font-size="8" text-anchor="middle" fill="#78350f">BFF</text>
      <rect x="20" y="190" width="365" height="20" rx="4" fill="#fff2cc" stroke="#d6b656" stroke-width="1.5"/>
      <text x="200" y="204" font-family="sans-serif" font-size="8" text-anchor="middle" fill="#78350f">Data Stream (Kafka / Event Bus)</text>
    </svg>`,
  },
  {
    id: 'multicloud-enterprise',
    name: 'Multi-Cloud Architecture (AWS + GCP + Azure + K8s)',
    description: 'Enterprise pipeline spanning Cloudflare, AWS API Gateway, EKS Kubernetes, Kafka, GCP BigQuery & Azure Blob.',
    diagram: {
      title: 'Enterprise Multi-Cloud Architecture',
      nodes: [
        { id: 'user_traffic', label: 'Global End-User\nTraffic', shape: 'actor', x: 80, y: 150, width: 80, height: 90 },
        { id: 'cf_waf', label: 'Cloudflare Edge\nCDN & DDoS WAF', shape: 'cloud', x: 230, y: 140, width: 140, height: 80, fillColor: '#FFEDD5', strokeColor: '#F97316' },
        { id: 'aws_apigw', label: 'AWS API Gateway\n(Global Ingress)', shape: 'rounded', x: 440, y: 140, width: 150, height: 70, fillColor: '#FEE2E2', strokeColor: '#E7157B' },
        { id: 'eks_cluster', label: 'AWS EKS Cluster\n(Kubernetes Pods)', shape: 'rectangle', x: 660, y: 140, width: 160, height: 70, fillColor: '#DBEAFE', strokeColor: '#326CE5' },
        { id: 'kafka_stream', label: 'Apache Kafka\nEvent Bus Cluster', shape: 'rounded', x: 660, y: 280, width: 160, height: 60, fillColor: '#E2E8F0', strokeColor: '#0F172A' },
        { id: 'gcp_bq', label: 'Google Cloud BigQuery\nReal-Time Analytics', shape: 'cylinder', x: 900, y: 220, width: 160, height: 70, fillColor: '#E0E7FF', strokeColor: '#4285F4' },
        { id: 'azure_blob', label: 'Azure Blob Storage\nLong-Term Cold Archive', shape: 'cylinder', x: 900, y: 340, width: 160, height: 70, fillColor: '#E0F2FE', strokeColor: '#0072C6' },
      ],
      edges: [
        { id: 'c1', source: 'user_traffic', target: 'cf_waf', label: 'HTTPS / Anycast' },
        { id: 'c2', source: 'cf_waf', target: 'aws_apigw', label: 'Origin Request' },
        { id: 'c3', source: 'aws_apigw', target: 'eks_cluster', label: 'mTLS' },
        { id: 'c4', source: 'eks_cluster', target: 'kafka_stream', label: 'Publish Events' },
        { id: 'c5', source: 'kafka_stream', target: 'gcp_bq', label: 'Streaming Ingest' },
        { id: 'c6', source: 'kafka_stream', target: 'azure_blob', label: 'Daily Cold Sync' },
      ],
    },
    previewSvg: `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc; border-radius:8px;">
      <rect x="20" y="90" width="80" height="40" rx="6" fill="#ffedd5" stroke="#f97316" stroke-width="2"/>
      <text x="60" y="114" font-family="sans-serif" font-size="9" text-anchor="middle" fill="#7c2d12">Cloudflare</text>
      <path d="M100 110 L140 110" stroke="#64748b" stroke-width="2"/>
      <rect x="140" y="90" width="80" height="40" rx="6" fill="#fee2e2" stroke="#e7157b" stroke-width="2"/>
      <text x="180" y="114" font-family="sans-serif" font-size="9" text-anchor="middle" fill="#991b1b">AWS Ingress</text>
      <path d="M220 110 L260 110" stroke="#64748b" stroke-width="2"/>
      <rect x="260" y="90" width="80" height="40" rx="6" fill="#dbeafe" stroke="#326ce5" stroke-width="2"/>
      <text x="300" y="114" font-family="sans-serif" font-size="9" text-anchor="middle" fill="#1e3a8a">Kubernetes</text>
    </svg>`,
  },
  {
    id: 'auth-mfa-flow',
    name: 'User Authentication & MFA Flow',
    description: 'Login verification, password check, MFA OTP challenge, and session issuance.',
    diagram: {
      title: 'Authentication & MFA Flow',
      nodes: [
        { id: 'start', label: 'User Enters\nCredentials', shape: 'rounded', x: 260, y: 40, width: 140, height: 60 },
        { id: 'check_pwd', label: 'Verify Password\nHash in DB?', shape: 'rhombus', x: 260, y: 150, width: 140, height: 80 },
        { id: 'login_fail', label: 'Display Error &\nIncrement Attempts', shape: 'rectangle', x: 480, y: 160, width: 150, height: 60 },
        { id: 'mfa_req', label: 'Is MFA\nEnabled?', shape: 'rhombus', x: 260, y: 280, width: 140, height: 80 },
        { id: 'send_otp', label: 'Send OTP via\nSMS / Authenticator', shape: 'rectangle', x: 80, y: 290, width: 140, height: 60 },
        { id: 'verify_otp', label: 'OTP Valid?', shape: 'rhombus', x: 80, y: 400, width: 140, height: 80 },
        { id: 'issue_jwt', label: 'Issue Signed\nJWT Token & Cookie', shape: 'rounded', x: 260, y: 530, width: 160, height: 60 },
        { id: 'user_db', label: 'Users DB\n(PostgreSQL)', shape: 'cylinder', x: 480, y: 40, width: 130, height: 70 },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'check_pwd' },
        { id: 'e2', source: 'check_pwd', target: 'login_fail', label: 'Invalid' },
        { id: 'e3', source: 'check_pwd', target: 'mfa_req', label: 'Valid' },
        { id: 'e4', source: 'mfa_req', target: 'send_otp', label: 'Yes' },
        { id: 'e5', source: 'mfa_req', target: 'issue_jwt', label: 'No' },
        { id: 'e6', source: 'send_otp', target: 'verify_otp' },
        { id: 'e7', source: 'verify_otp', target: 'issue_jwt', label: 'Success' },
        { id: 'e8', source: 'verify_otp', target: 'login_fail', label: 'Failed' },
        { id: 'e9', source: 'start', target: 'user_db', dashed: true, label: 'Lookup' },
      ],
    },
    previewSvg: `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc; border-radius:8px;">
      <rect x="140" y="20" width="120" height="36" rx="6" fill="#e0e7ff" stroke="#6366f1" stroke-width="2"/>
      <text x="200" y="42" font-family="sans-serif" font-size="11" text-anchor="middle" fill="#1e1b4b">Enter Credentials</text>
      <path d="M200 56 L200 84" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
      <polygon points="200,84 250,114 200,144 150,114" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/>
      <text x="200" y="118" font-family="sans-serif" font-size="10" text-anchor="middle" fill="#78350f">Verify Hash?</text>
      <path d="M250 114 L310 114" stroke="#64748b" stroke-width="2"/>
      <rect x="310" y="96" width="70" height="36" rx="4" fill="#fee2e2" stroke="#ef4444" stroke-width="1.5"/>
      <text x="345" y="118" font-family="sans-serif" font-size="9" text-anchor="middle" fill="#991b1b">Fail</text>
      <path d="M200 144 L200 180" stroke="#64748b" stroke-width="2"/>
      <rect x="135" y="180" width="130" height="40" rx="8" fill="#d1fae5" stroke="#10b981" stroke-width="2"/>
      <text x="200" y="204" font-family="sans-serif" font-size="11" text-anchor="middle" fill="#064e3b">Issue JWT Token</text>
    </svg>`,
  },
  {
    id: 'payment-checkout',
    name: 'E-Commerce Order & Payment Pipeline',
    description: 'Shopping cart submission, inventory check, Stripe payment charging, and order storage.',
    diagram: {
      title: 'Order & Payment Pipeline',
      nodes: [
        { id: 'cart', label: 'Customer Clicks\nCheckout', shape: 'rounded', x: 220, y: 40, width: 150, height: 60 },
        { id: 'stock_chk', label: 'Item In\nStock?', shape: 'rhombus', x: 220, y: 150, width: 150, height: 80 },
        { id: 'out_of_stock', label: 'Notify Out of\nStock & Refund', shape: 'rectangle', x: 440, y: 160, width: 140, height: 60 },
        { id: 'stripe_charge', label: 'Charge Card via\nPayment Gateway', shape: 'rectangle', x: 220, y: 280, width: 150, height: 60 },
        { id: 'charge_ok', label: 'Payment\nApproved?', shape: 'rhombus', x: 220, y: 390, width: 150, height: 80 },
        { id: 'retry_payment', label: 'Prompt User for\nAlternative Card', shape: 'rectangle', x: 440, y: 400, width: 140, height: 60 },
        { id: 'order_db', label: 'Orders & Fulfillment\nDatabase', shape: 'cylinder', x: 220, y: 520, width: 160, height: 70 },
      ],
      edges: [
        { id: 'p1', source: 'cart', target: 'stock_chk' },
        { id: 'p2', source: 'stock_chk', target: 'out_of_stock', label: 'No' },
        { id: 'p3', source: 'stock_chk', target: 'stripe_charge', label: 'Yes' },
        { id: 'p4', source: 'stripe_charge', target: 'charge_ok' },
        { id: 'p5', source: 'charge_ok', target: 'retry_payment', label: 'Declined' },
        { id: 'p6', source: 'charge_ok', target: 'order_db', label: 'Approved' },
        { id: 'p7', source: 'retry_payment', target: 'stripe_charge', label: 'Retry' },
      ],
    },
    previewSvg: `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc; border-radius:8px;">
      <rect x="140" y="20" width="120" height="34" rx="6" fill="#e0e7ff" stroke="#6366f1" stroke-width="2"/>
      <text x="200" y="42" font-family="sans-serif" font-size="11" text-anchor="middle" fill="#1e1b4b">Customer Checkout</text>
      <path d="M200 54 L200 80" stroke="#64748b" stroke-width="2"/>
      <polygon points="200,80 250,110 200,140 150,110" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/>
      <text x="200" y="114" font-family="sans-serif" font-size="10" text-anchor="middle" fill="#78350f">In Stock?</text>
      <path d="M200 140 L200 170" stroke="#64748b" stroke-width="2"/>
      <rect x="130" y="170" width="140" height="34" rx="4" fill="#dbeafe" stroke="#3b82f6" stroke-width="2"/>
      <text x="200" y="192" font-family="sans-serif" font-size="11" text-anchor="middle" fill="#1e3a8a">Charge Card</text>
    </svg>`,
  },
  {
    id: 'microservices-arch',
    name: 'Event-Driven Microservices Architecture',
    description: 'Web client, API Gateway, Kafka message broker, billing & inventory workers.',
    diagram: {
      title: 'Microservices Architecture',
      nodes: [
        { id: 'client', label: 'Web / Mobile Client', shape: 'actor', x: 60, y: 170, width: 60, height: 80 },
        { id: 'apigw', label: 'API Gateway\n(Kong / Envoy)', shape: 'rounded', x: 180, y: 170, width: 140, height: 70 },
        { id: 'kafka', label: 'Kafka Event Bus\n(Pub/Sub Streams)', shape: 'cylinder', x: 380, y: 170, width: 150, height: 70 },
        { id: 'orders_svc', label: 'Order Service\n(Node.js / Express)', shape: 'rectangle', x: 590, y: 60, width: 150, height: 60 },
        { id: 'inventory_svc', label: 'Inventory Service\n(Go gRPC)', shape: 'rectangle', x: 590, y: 170, width: 150, height: 60 },
        { id: 'notifications', label: 'Email / Push Worker\n(Serverless)', shape: 'cloud', x: 590, y: 280, width: 150, height: 70 },
      ],
      edges: [
        { id: 'm1', source: 'client', target: 'apigw', label: 'HTTPS / REST' },
        { id: 'm2', source: 'apigw', target: 'kafka', label: 'Publish Event' },
        { id: 'm3', source: 'kafka', target: 'orders_svc', label: 'OrderCreated' },
        { id: 'm4', source: 'kafka', target: 'inventory_svc', label: 'ReserveStock' },
        { id: 'm5', source: 'kafka', target: 'notifications', label: 'SendConfirmation' },
      ],
    },
    previewSvg: `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc; border-radius:8px;">
      <circle cx="50" cy="110" r="16" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>
      <path d="M50 126 L50 150 M35 135 L65 135 M50 150 L35 170 M50 150 L65 170" stroke="#475569" stroke-width="2"/>
      <path d="M70 120 L110 120" stroke="#64748b" stroke-width="2"/>
      <rect x="110" y="100" width="80" height="40" rx="6" fill="#e0e7ff" stroke="#6366f1" stroke-width="2"/>
      <text x="150" y="124" font-family="sans-serif" font-size="9" text-anchor="middle" fill="#1e1b4b">API Gateway</text>
      <path d="M190 120 L230 120" stroke="#64748b" stroke-width="2"/>
      <rect x="230" y="95" width="80" height="50" rx="4" fill="#fee2e2" stroke="#ef4444" stroke-width="2"/>
      <text x="270" y="124" font-family="sans-serif" font-size="9" text-anchor="middle" fill="#7f1d1d">Kafka Broker</text>
      <path d="M310 120 L340 85 M310 120 L340 155" stroke="#64748b" stroke-width="2"/>
    </svg>`,
  },
];

