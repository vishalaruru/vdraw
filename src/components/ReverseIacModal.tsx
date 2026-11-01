import React, { useState } from 'react';
import { Code2, Sparkles, X, ArrowRight, FileCode } from 'lucide-react';
import { parseIacToDiagramXml } from '../services/reverseIacParser';

interface ReverseIacModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertDiagram: (xml: string, mode: 'replace' | 'merge') => void;
}

const SAMPLE_TERRAFORM = `# AWS Microservices Architecture
resource "aws_wafv2_web_acl" "main_waf" {
  name  = "api-perimeter-waf"
  scope = "REGIONAL"
}

resource "aws_lb" "app_alb" {
  name               = "app-load-balancer"
  load_balancer_type = "application"
  subnets            = ["subnet-1", "subnet-2"]
}

resource "aws_ecs_service" "api_backend" {
  name            = "orders-api-service"
  cluster         = "prod-cluster"
  task_definition = "task-api"
  desired_count   = 3
}

resource "aws_sqs_queue" "order_queue" {
  name                      = "order-processing-queue"
  redrive_policy            = "{\\"deadLetterTargetArn\\": \\"arn:aws:sqs:...:order-dlq\\"}"
}

resource "aws_elasticache_cluster" "redis_cache" {
  cluster_id = "api-redis-cache"
  engine     = "redis"
  node_type  = "cache.t4g.medium"
}

resource "aws_db_instance" "postgres_primary" {
  identifier     = "prod-postgres-db"
  instance_class = "db.r6g.xlarge"
  multi_az       = true
}`;

const SAMPLE_COMPOSE = `version: '3.8'
services:
  waf_gateway:
    image: traefik:v2.10
    ports:
      - "80:80"
      - "443:443"

  web_frontend:
    image: nextjs-app:latest
    depends_on:
      - api_gateway

  api_gateway:
    image: kong:3.4
    ports:
      - "8000:8000"

  orders_service:
    image: orders-backend:latest
    depends_on:
      - redis_cache
      - postgres_db
      - rabbitmq_broker

  redis_cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  rabbitmq_broker:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"

  postgres_db:
    image: postgres:15
    environment:
      POSTGRES_DB: orders_prod`;

export const ReverseIacModal: React.FC<ReverseIacModalProps> = ({
  isOpen,
  onClose,
  onInsertDiagram,
}) => {
  const [iacType, setIacType] = useState<'terraform' | 'docker-compose' | 'k8s'>('terraform');
  const [code, setCode] = useState(SAMPLE_TERRAFORM);
  const [isLoading, setIsLoading] = useState(false);
  const [insertMode, setInsertMode] = useState<'replace' | 'merge'>('replace');

  if (!isOpen) return null;

  const handleTabChange = (type: 'terraform' | 'docker-compose' | 'k8s') => {
    setIacType(type);
    if (type === 'terraform') setCode(SAMPLE_TERRAFORM);
    else if (type === 'docker-compose') setCode(SAMPLE_COMPOSE);
    else setCode(`# Kubernetes Ingress & Microservices Deployment\napiVersion: networking.k8s.io/v1\nkind: Ingress\nmetadata:\n  name: app-ingress\n---\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api-service\n---\napiVersion: v1\nkind: Service\nmetadata:\n  name: postgres-service`);
  };

  const handleGenerate = async () => {
    if (!code.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const { xml } = await parseIacToDiagramXml(code, iacType);
      onInsertDiagram(xml, insertMode);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to parse IaC into diagram');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#f08705] to-amber-500 text-white flex items-center justify-center shadow-xs">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Reverse IaC: Code to Architecture Diagram
              </h3>
              <p className="text-[11px] text-slate-500">
                Paste your Terraform HCL, Docker Compose, or Kubernetes YAML to visualize
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="flex items-center justify-between px-6 pt-3 bg-white border-b border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            {[
              { id: 'terraform', label: 'Terraform (HCL)' },
              { id: 'docker-compose', label: 'Docker Compose (YAML)' },
              { id: 'k8s', label: 'Kubernetes (YAML)' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id as 'terraform' | 'docker-compose' | 'k8s')}
                className={`px-3 py-1.5 font-semibold border-b-2 transition-colors ${
                  iacType === t.id
                    ? 'border-[#f08705] text-[#f08705]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] pb-1">
            <span className="text-slate-400 font-medium">Render:</span>
            <button
              onClick={() => setInsertMode('replace')}
              className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                insertMode === 'replace' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Replace
            </button>
            <button
              onClick={() => setInsertMode('merge')}
              className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                insertMode === 'merge' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Append
            </button>
          </div>
        </div>

        {/* Code Input Area */}
        <div className="p-6 flex-1 flex flex-col space-y-2 overflow-hidden bg-slate-50">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
            <FileCode className="w-3.5 h-3.5 text-indigo-600" />
            <span>Infrastructure Code:</span>
          </label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={isLoading}
            placeholder="Paste your Terraform HCL, docker-compose.yml or K8s YAML here..."
            className="flex-1 w-full p-3 font-mono text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f08705] leading-relaxed resize-none shadow-inner"
          />
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-slate-100 bg-white flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400">
            Automatically maps resources, databases, and dependencies.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={!code.trim() || isLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#f08705] hover:bg-[#e07b04] text-white rounded-lg font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing Architecture...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Diagram</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
