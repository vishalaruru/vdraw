import React, { useState } from 'react';
import { Database, Sparkles, X, ArrowRight, Table, Layers } from 'lucide-react';
import { parseSqlOrPrismaToErd, DiagramFormat } from '../services/erdGenerator';

interface SqlToErdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertDiagram: (xml: string, mode: 'replace' | 'merge') => void;
}

const SAMPLE_SQL = `-- E-Commerce Relational Database Schema
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity INT DEFAULT 1,
    unit_price NUMERIC(10,2),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE payments (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL,
    payment_method VARCHAR(50),
    status VARCHAR(50),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);`;

const SAMPLE_PRISMA = `// Prisma Database Schema
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  orders    Order[]
  createdAt DateTime @default(now())
}

model Order {
  id          String      @id @default(uuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  items       OrderItem[]
  totalAmount Float
  status      String      @default("PENDING")
}

model OrderItem {
  id        String  @id @default(uuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id])
  productId String
  quantity  Int     @default(1)
  price     Float
}

model Payment {
  id            String @id @default(uuid())
  orderId       String
  order         Order  @relation(fields: [orderId], references: [id])
  paymentMethod String
  status        String
}`;

export const SqlToErdModal: React.FC<SqlToErdModalProps> = ({
  isOpen,
  onClose,
  onInsertDiagram,
}) => {
  const [schemaType, setSchemaType] = useState<'sql' | 'prisma'>('sql');
  const [format, setFormat] = useState<DiagramFormat>('erd');
  const [code, setCode] = useState(SAMPLE_SQL);
  const [isLoading, setIsLoading] = useState(false);
  const [insertMode, setInsertMode] = useState<'replace' | 'merge'>('replace');

  if (!isOpen) return null;

  const handleTabChange = (type: 'sql' | 'prisma') => {
    setSchemaType(type);
    setCode(type === 'sql' ? SAMPLE_SQL : SAMPLE_PRISMA);
  };

  const handleGenerate = async () => {
    if (!code.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const { xml } = await parseSqlOrPrismaToErd(code, schemaType, format);
      onInsertDiagram(xml, insertMode);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to parse database schema into ERD');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center shadow-xs">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Database Schema &bull; ERD &amp; UML Class Modeler
              </h3>
              <p className="text-[11px] text-slate-500">
                Transform SQL DDL or Prisma Schema into structured Database Tables or UML Class Diagrams
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
              { id: 'sql', label: 'SQL DDL (Postgres / MySQL)' },
              { id: 'prisma', label: 'Prisma Schema' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id as 'sql' | 'prisma')}
                className={`px-3 py-1.5 font-semibold border-b-2 transition-colors ${
                  schemaType === t.id
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Diagram Target Style: ERD vs UML */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold border border-slate-200">
            <button
              type="button"
              onClick={() => setFormat('erd')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                format === 'erd'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3 h-3 text-emerald-600" />
              <span>ERD Tables</span>
            </button>
            <button
              type="button"
              onClick={() => setFormat('uml')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                format === 'uml'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3 h-3 text-blue-600" />
              <span>UML Classes</span>
            </button>
          </div>
        </div>

        {/* Code Input */}
        <div className="p-6 flex-1 flex flex-col space-y-2 overflow-hidden bg-slate-50">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                {format === 'erd' ? 'Relational Schema DDL:' : 'Domain Class Definitions:'}
              </span>
            </label>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-slate-400 font-medium">Canvas:</span>
              <button
                onClick={() => setInsertMode('replace')}
                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                  insertMode === 'replace' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Replace
              </button>
              <button
                onClick={() => setInsertMode('merge')}
                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                  insertMode === 'merge' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Append
              </button>
            </div>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={isLoading}
            placeholder="Paste your CREATE TABLE statements or schema.prisma here..."
            className="flex-1 w-full p-3 font-mono text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed resize-none shadow-inner min-h-[220px]"
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-white flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">
            {format === 'erd'
              ? 'Generates structured database tables with PK/FK indicators and Crow’s Foot connectors.'
              : 'Generates UML class diagrams with attributes, domain operations, and associations.'}
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
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate {format === 'erd' ? 'ERD Tables' : 'Class Diagram'}</span>
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
