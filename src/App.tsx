import { useState, useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import {
  Brain, Network, Layers, Bot, Shield, Play, Plus, Trash2,
  CheckCircle, XCircle, Loader2, ArrowRight, Zap, Database,
  FileText, ScrollText, Activity, ChevronDown, Target, GitBranch,
  Scale, MessageSquare, Eye, EyeOff
} from 'lucide-react';
import './index.css';

// ─── STEPS ─────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 0, label: '本体建模', sub: '领域概念建模', icon: Brain },
  { id: 1, label: '知识图谱', sub: '数据实例化', icon: Network },
  { id: 2, label: '语义层', sub: '术语映射规范', icon: Layers },
  { id: 3, label: '智能体编排', sub: '多Agent协作', icon: Bot },
  { id: 4, label: '合规引擎', sub: '监管规则检查', icon: Shield },
  { id: 5, label: '实时模拟', sub: '端到端演示', icon: Zap },
];

// ─── PRESET DATA ───────────────────────────────────────────────────────────
const PRESET_ENTITIES = [
  { id: 'customer', name: 'Customer', label: '客户', color: '#00D4AA', properties: [
    { id: 'p1', name: '身份证号', type: 'string', required: true },
    { id: 'p2', name: '姓名', type: 'string', required: true },
    { id: 'p3', name: '职业', type: 'string', required: false },
    { id: 'p4', name: '风险等级', type: 'string', required: true },
  ]},
  { id: 'account', name: 'Account', label: '账户', color: '#4A90D9', properties: [
    { id: 'p5', name: '账号', type: 'string', required: true },
    { id: 'p6', name: '开户日期', type: 'date', required: true },
    { id: 'p7', name: '账户类型', type: 'string', required: true },
    { id: 'p8', name: '余额', type: 'number', required: true },
  ]},
  { id: 'transaction', name: 'Transaction', label: '交易', color: '#9B59B6', properties: [
    { id: 'p9', name: '交易金额', type: 'number', required: true },
    { id: 'p10', name: '交易时间', type: 'date', required: true },
    { id: 'p11', name: '交易类型', type: 'string', required: true },
  ]},
  { id: 'loan_product', name: 'LoanProduct', label: '贷款产品', color: '#E67E22', properties: [
    { id: 'p12', name: '产品名称', type: 'string', required: true },
    { id: 'p13', name: '利率(%)', type: 'number', required: true },
    { id: 'p14', name: '期限(月)', type: 'number', required: true },
    { id: 'p15', name: '额度上限', type: 'number', required: true },
  ]},
  { id: 'contract', name: 'Contract', label: '合同', color: '#E74C3C', properties: [
    { id: 'p16', name: '合同编号', type: 'string', required: true },
    { id: 'p17', name: '签署日期', type: 'date', required: true },
    { id: 'p18', name: '金额', type: 'number', required: true },
    { id: 'p19', name: '状态', type: 'string', required: true },
  ]},
  { id: 'risk_assessment', name: 'RiskAssessment', label: '风险评估', color: '#F5A623', properties: [
    { id: 'p20', name: '评分', type: 'number', required: true },
    { id: 'p21', name: '评级', type: 'string', required: true },
    { id: 'p22', name: '评估日期', type: 'date', required: true },
  ]},
];

const PRESET_RELATIONS = [
  { id: 'r1', from: 'customer', to: 'account', label: '拥有', type: 'owns' },
  { id: 'r2', from: 'customer', to: 'risk_assessment', label: '参与', type: 'participatesIn' },
  { id: 'r3', from: 'account', to: 'transaction', label: '触发', type: 'triggers' },
  { id: 'r4', from: 'loan_product', to: 'contract', label: '生成', type: 'generates' },
  { id: 'r5', from: 'contract', to: 'account', label: '绑定', type: 'bindsTo' },
  { id: 'r6', from: 'customer', to: 'loan_product', label: '申请', type: 'appliesFor' },
];

const PRESET_GRAPH = {
  nodes: [
    { id: 'C001', label: '王建国', type: 'Customer', color: '#00D4AA', props: { '姓名': '王建国', '身份证': '310***********1234', '职业': '企业经营', '风险等级': 'A', '评分': '782' } },
    { id: 'C002', label: '李秀英', type: 'Customer', color: '#00D4AA', props: { '姓名': '李秀英', '身份证': '320***********5678', '职业': '教师', '风险等级': 'AA', '评分': '856' } },
    { id: 'C003', label: '张伟', type: 'Customer', color: '#00D4AA', props: { '姓名': '张伟', '身份证': '330***********9012', '职业': '工程师', '风险等级': 'B', '评分': '620' } },
    { id: 'A001', label: '活期账户-001', type: 'Account', color: '#4A90D9', props: { '账号': '6222********7890', '开户日期': '2019-03-15', '类型': '活期', '余额': '856,000元' } },
    { id: 'A002', label: '活期账户-002', type: 'Account', color: '#4A90D9', props: { '账号': '6222********3456', '开户日期': '2020-07-22', '类型': '活期', '余额': '420,000元' } },
    { id: 'A003', label: '活期账户-003', type: 'Account', color: '#4A90D9', props: { '账号': '6222********9012', '开户日期': '2018-01-08', '类型': '活期', '余额': '1,200,000元' } },
    { id: 'T001', label: '转账记录-001', type: 'Transaction', color: '#9B59B6', props: { '金额': '150,000元', '时间': '2024-11-01 09:23', '类型': '跨行转账' } },
    { id: 'T002', label: '转账记录-002', type: 'Transaction', color: '#9B59B6', props: { '金额': '88,000元', '时间': '2024-11-03 14:15', '类型': '行内转账' } },
    { id: 'T003', label: '转账记录-003', type: 'Transaction', color: '#9B59B6', props: { '金额': '320,000元', '时间': '2024-11-05 11:00', '类型': '跨行转账' } },
    { id: 'LP001', label: '企业经营贷', type: 'LoanProduct', color: '#E67E22', props: { '产品名': '企业经营贷', '利率': '4.35%', '期限': '36月', '上限': '500万' } },
    { id: 'LP002', label: '个人消费贷', type: 'LoanProduct', color: '#E67E22', props: { '产品名': '个人消费贷', '利率': '5.22%', '期限': '24月', '上限': '50万' } },
    { id: 'LP003', label: '房屋抵押贷', type: 'LoanProduct', color: '#E67E22', props: { '产品名': '房屋抵押贷', '利率': '3.85%', '期限': '240月', '上限': '1000万' } },
    { id: 'CO001', label: '合同-001', type: 'Contract', color: '#E74C3C', props: { '编号': 'HT-2024-001', '签署日期': '2024-10-20', '金额': '100万', '状态': '执行中' } },
    { id: 'CO002', label: '合同-002', type: 'Contract', color: '#E74C3C', props: { '编号': 'HT-2024-002', '签署日期': '2024-09-15', '金额': '200万', '状态': '执行中' } },
    { id: 'RA001', label: '评估-001', type: 'RiskAssessment', color: '#F5A623', props: { '评分': '82', '评级': 'A', '评估日': '2024-10-18' } },
    { id: 'RA002', label: '评估-002', type: 'RiskAssessment', color: '#F5A623', props: { '评分': '91', '评级': 'AA', '评估日': '2024-09-10' } },
  ],
  links: [
    { id: 'l1', source: 'C001', target: 'A001', label: '拥有' },
    { id: 'l2', source: 'C002', target: 'A002', label: '拥有' },
    { id: 'l3', source: 'C003', target: 'A003', label: '拥有' },
    { id: 'l4', source: 'C001', target: 'RA001', label: '参与评估' },
    { id: 'l5', source: 'C002', target: 'RA002', label: '参与评估' },
    { id: 'l6', source: 'A001', target: 'T001', label: '触发' },
    { id: 'l7', source: 'A001', target: 'T002', label: '触发' },
    { id: 'l8', source: 'A003', target: 'T003', label: '触发' },
    { id: 'l9', source: 'LP001', target: 'CO001', label: '生成' },
    { id: 'l10', source: 'LP003', target: 'CO002', label: '生成' },
    { id: 'l11', source: 'CO001', target: 'A001', label: '绑定' },
    { id: 'l12', source: 'CO002', target: 'A003', label: '绑定' },
    { id: 'l13', source: 'C001', target: 'LP001', label: '申请' },
    { id: 'l14', source: 'C003', target: 'LP003', label: '申请' },
  ],
};

const PRESET_SEMANTIC = [
  { id: 'sm1', term: '客户申请贷款', desc: '识别贷款申请意图并关联产品和合同', ops: [['Customer', '读取'], ['LoanProduct', '查询'], ['Contract', '创建']], sparql: 'PREFIX bank: <http://bank.example/ontology#>\nSELECT ?customer ?product ?contract\nWHERE {\n  ?customer bank:applyFor ?product .\n  ?product bank:generates ?contract .\n}' },
  { id: 'sm2', term: '评估客户资质', desc: '查询风险评估和信用评分', ops: [['Customer', '读取'], ['RiskAssessment', '查询'], ['Account', '核验']], sparql: 'PREFIX bank: <http://bank.example/ontology#>\nSELECT ?customer ?score ?rating\nWHERE {\n  ?customer bank:participatesIn ?assessment .\n  ?assessment bank:score ?score .\n}' },
  { id: 'sm3', term: '生成合规报告', desc: '基于合规检查生成监管报告', ops: [['Report', '生成'], ['Compliance', '校验']], sparql: 'PREFIX bank: <http://bank.example/ontology#>\nCONSTRUCT { ?report bank:status "合规" }\nWHERE {\n  ?report bank:checkedBy ?compliance .\n}' },
];

const PRESET_RULES = [
  { id: 'cr1', cat: 'KYC', name: '身份实名核验', desc: '身份证信息与公安部公民身份信息系统核验一致', threshold: '必须匹配' },
  { id: 'cr2', cat: 'KYC', name: '反洗钱名单筛查', desc: '与人民银行、联合国制裁名单匹配', threshold: '零匹配' },
  { id: 'cr3', cat: 'LOAN', name: 'LTV抵押价值比', desc: '贷款金额与抵押物评估价值比率', threshold: '≤70%' },
  { id: 'cr4', cat: 'LOAN', name: 'DSR偿债比', desc: '所有贷款月还款额不超过月收入比例', threshold: '≤50%' },
  { id: 'cr5', cat: 'LOAN', name: '贷款额度上限', desc: '单笔贷款不超过产品最高额度', threshold: '依产品' },
  { id: 'cr6', cat: 'AML', name: '大额交易报告', desc: '单笔超5万美元需上报反洗钱系统', threshold: '≥5万美元' },
  { id: 'cr7', cat: 'AML', name: '结构性交易检测', desc: '识别将大额拆分为小额规避报告行为', threshold: '7日内拆分' },
];

const AGENT_DEFS = [
  { id: 'comp', name: '理解代理', color: '#00D4AA', icon: Brain, desc: '解析自然语言，提取实体和意图' },
  { id: 'retr', name: '检索代理', color: '#4A90D9', icon: Database, desc: '基于知识图谱多跳查询' },
  { id: 'decl', name: '决策代理', color: '#E67E22', icon: Target, desc: '基于规则和本体约束推理' },
  { id: 'comp2', name: '合规代理', color: '#9B59B6', icon: Shield, desc: '审查业务步骤合规性' },
];

const AGENT_OUTPUTS: Record<string, string> = {
  comp: JSON.stringify({ intent: 'loan_application', confidence: 0.97, entities: { customer: '王建国', amount: 1000000, loanType: '企业经营贷', purpose: '扩大经营规模' }, intent_hierarchy: ['信贷申请', '企业经营贷', '大额贷款'], required_checks: ['KYC', '风险评估', '抵押评估'] }, null, 2),
  retr: JSON.stringify({ customer: { id: 'C001', name: '王建国', risk_level: 'A', credit_score: 782, existing_contracts: ['HT-2024-001'], total_exposure: 1000000 }, product: { id: 'LP001', name: '企业经营贷', max_amount: 5000000, rate: 4.35 }, risk: { score: 82, rating: 'A', dsr: 0.18 } }, null, 2),
  decl: JSON.stringify({ decision: 'APPROVE_WITH_CONDITIONS', recommended_amount: 1000000, rate: 4.35, conditions: ['抵押评估价值需≥143万(LTV=70%)', '第三方担保人审核', '贷后资金用途跟踪'], approval_probability: 0.85 }, null, 2),
  comp2: JSON.stringify({ overall_status: 'PASS', checks: [{ rule: 'KYC身份核验', status: 'PASS' }, { rule: '反洗钱名单筛查', status: 'PASS' }, { rule: 'LTV比率检查', status: 'PASS' }, { rule: 'DSR偿债比', status: 'PASS' }, { rule: '贷款额度上限', status: 'PASS' }, { rule: '资金用途合规', status: 'PASS' }], approval_ref: 'COMP-2024-1105-001' }, null, 2),
};

// ─── UTILITY ───────────────────────────────────────────────────────────────
function delay(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }

// ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'pass' | 'fail' | 'warning' | 'pending' }) {
  const cfg = {
    pass: { bg: 'bg-emerald-500/15', color: 'text-emerald-400', label: '通过', icon: '✓' },
    fail: { bg: 'bg-red-500/15', color: 'text-red-400', label: '拒绝', icon: '✗' },
    warning: { bg: 'bg-yellow-500/15', color: 'text-yellow-400', label: '人工审核', icon: '⚠' },
    pending: { bg: 'bg-gray-500/15', color: 'text-gray-400', label: '检查中', icon: '○' },
  }[status]!;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <span className={status === 'pending' ? 'animate-spin' : ''}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-[#060f1e] border border-[#2A4066] rounded-lg p-4 overflow-auto text-xs font-mono text-emerald-400 leading-relaxed whitespace-pre-wrap">
      <code>{code}</code>
    </pre>
  );
}

// ── STEP 1 ─────────────────────────────────────────────────────────────────
function OntologyEditor({ entities, setEntities, relations, setRelations }: any) {
  const [selected, setSelected] = useState<any>(null);
  const [showEntityModal, setShowEntityModal] = useState(false);
  const [showRelModal, setShowRelModal] = useState(false);
  const [newE, setNewE] = useState({ name: '', label: '', type: 'Customer' });
  const [newR, setNewR] = useState({ from: '', to: '', label: '' });
  const [ontologyJson, setOntologyJson] = useState('');

  const generate = () => {
    const jsonld = {
      '@context': { rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#', owl: 'http://www.w3.org/2002/07/owl#', bank: 'http://bank.example/ontology#' },
      '@graph': entities.map((e: any) => ({ '@id': `bank:${e.name}`, '@type': 'owl:Class', 'rdfs:label': e.label, 'rdfs:comment': `${e.label}实体类` })),
    };
    setOntologyJson(JSON.stringify(jsonld, null, 2));
  };

  const addEntity = () => {
    if (!newE.name) return;
    const colors: Record<string, string> = { Customer: '#00D4AA', Account: '#4A90D9', Transaction: '#9B59B6', LoanProduct: '#E67E22', Contract: '#E74C3C', RiskAssessment: '#F5A623' };
    const e = { id: newE.name.toLowerCase().replace(/\s+/g, '_'), name: newE.name, label: newE.label || newE.name, type: newE.type, color: colors[newE.type] || '#888', properties: [] };
    setEntities([...entities, e]);
    setNewE({ name: '', label: '', type: 'Customer' });
    setShowEntityModal(false);
  };

  const addRelation = () => {
    if (!newR.from || !newR.to) return;
    setRelations([...relations, { id: `r${Date.now()}`, from: newR.from, to: newR.to, label: newR.label, type: newR.label }]);
    setNewR({ from: '', to: '', label: '' });
    setShowRelModal(false);
  };

  const removeEntity = (id: string) => {
    setEntities(entities.filter((e: any) => e.id !== id));
    setRelations(relations.filter((r: any) => r.from !== id && r.to !== id));
    if (selected?.id === id) setSelected(null);
  };

  const typeColors: Record<string, string> = { Customer: '#00D4AA', Account: '#4A90D9', Transaction: '#9B59B6', LoanProduct: '#E67E22', Contract: '#E74C3C', RiskAssessment: '#F5A623' };

  return (
    <div className="grid grid-cols-5 gap-4 h-full">
      <div className="col-span-2 flex flex-col gap-2 overflow-auto pr-1">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">实体类</h3>
          <button onClick={() => setShowEntityModal(true)} className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/15 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/25 transition-colors">
            <Plus size={11} /> 新增
          </button>
        </div>
        {entities.map((e: any) => (
          <div key={e.id} onClick={() => setSelected(e)}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${selected?.id === e.id ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-[#2A4066] bg-[#1C2D47] hover:border-[#2D4A7A]'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
              <span className="text-sm font-mono font-medium text-gray-100">{e.label}</span>
              <span className="text-xs text-gray-500 ml-auto">{e.properties.length}属性</span>
              <button onClick={(ev: any) => { ev.stopPropagation(); removeEntity(e.id); }} className="text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
            </div>
            <span className="text-xs text-gray-500 font-mono">{e.name}</span>
          </div>
        ))}
        <div className="border-t border-[#2A4066] pt-3 mt-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">关系</h3>
            <button onClick={() => setShowRelModal(true)} className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/15 text-amber-400 rounded-lg text-xs font-medium hover:bg-amber-500/25 transition-colors">
              <Plus size={11} /> 新增
            </button>
          </div>
          {relations.map((r: any) => (
            <div key={r.id} className="flex items-center gap-1.5 py-1.5 border-b border-[#2A4066]/50 last:border-0">
              <span className="text-xs font-mono text-emerald-400">{entities.find((e: any) => e.id === r.from)?.label}</span>
              <ArrowRight size={10} className="text-gray-500" />
              <span className="text-xs text-amber-400 font-medium">{r.label}</span>
              <ArrowRight size={10} className="text-gray-500" />
              <span className="text-xs font-mono text-emerald-400">{entities.find((e: any) => e.id === r.to)?.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="col-span-3 flex flex-col gap-3 overflow-auto">
        {selected ? (
          <div className="bg-[#132035] border border-[#2A4066] rounded-xl p-5 animate-fade-slide">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selected.color }} />
              <h2 className="text-lg font-bold text-gray-100">{selected.label}</h2>
              <span className="font-mono text-xs text-gray-500 ml-auto">{selected.name}</span>
            </div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">属性定义</h4>
            <div className="space-y-1.5">
              {selected.properties.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 py-2 px-3 bg-[#0A1628] rounded-lg">
                  <span className="text-sm font-mono text-gray-100">{p.name}</span>
                  <span className="text-xs text-gray-500 ml-auto">{p.type}{p.required ? ' · 必填' : ' · 可选'}</span>
                </div>
              ))}
              {selected.properties.length === 0 && <p className="text-xs text-gray-600 italic">暂无属性定义</p>}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#132035] border border-[#2A4066] border-dashed rounded-xl">
            <div className="text-center">
              <Brain size={40} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">点击左侧实体卡片查看详情</p>
            </div>
          </div>
        )}

        <div className="bg-[#132035] border border-[#2A4066] rounded-xl p-4">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">本体关系图预览</h4>
          <svg viewBox="0 0 420 150" className="w-full h-24">
            {relations.map((r: any) => {
              const fromE = entities.find((e: any) => e.id === r.from);
              const toE = entities.find((e: any) => e.id === r.to);
              if (!fromE || !toE) return null;
              const fi = entities.indexOf(fromE); const ti = entities.indexOf(toE);
              const fx = (fi % 3) * 140 + 80; const fy = Math.floor(fi / 3) * 62 + 50;
              const tx = (ti % 3) * 140 + 80; const ty = Math.floor(ti / 3) * 62 + 50;
              return (
                <g key={r.id}>
                  <line x1={fx} y1={fy} x2={tx} y2={ty} stroke="#2A4066" strokeWidth="1.5" />
                  <text x={(fx+tx)/2} y={(fy+ty)/2-4} fill="#F5A623" fontSize="8" textAnchor="middle" fontFamily="monospace">{r.label}</text>
                </g>
              );
            })}
            {entities.map((e: any, i: number) => {
              const x = (i % 3) * 140 + 80; const y = Math.floor(i / 3) * 62 + 50;
              return (
                <g key={e.id}>
                  <circle cx={x} cy={y} r="15" fill={e.color} fillOpacity="0.15" />
                  <circle cx={x} cy={y} r="8" fill={e.color} />
                  <text x={x} y={y+21} fill="#8A9BB5" fontSize="7" textAnchor="middle" fontFamily="sans-serif">{e.label}</text>
                </g>
              );
            })}
          </svg>
        </div>

        <button onClick={generate} className="flex items-center justify-center gap-2 py-3 bg-emerald-500 text-[#0A1628] rounded-xl font-bold text-sm hover:bg-emerald-400 transition-colors">
          <FileText size={16} /> 生成 JSON-LD 本体文档
        </button>
        {ontologyJson && <CodeBlock code={ontologyJson} />}
      </div>

      {showEntityModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#132035] border border-[#2A4066] rounded-2xl p-6 w-96 shadow-2xl">
            <h3 className="text-base font-bold mb-4">新增实体类</h3>
            <div className="space-y-3">
              <div><label className="text-xs text-gray-400 block mb-1">类名 (英文)</label>
                <input value={newE.name} onChange={e => setNewE({...newE, name: e.target.value})} className="w-full bg-[#0A1628] border border-[#2A4066] rounded-lg px-3 py-2 text-sm font-mono text-gray-100 focus:outline-none focus:border-emerald-500" placeholder="e.g. Customer" /></div>
              <div><label className="text-xs text-gray-400 block mb-1">标签 (中文)</label>
                <input value={newE.label} onChange={e => setNewE({...newE, label: e.target.value})} className="w-full bg-[#0A1628] border border-[#2A4066] rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-emerald-500" placeholder="客户" /></div>
              <div><label className="text-xs text-gray-400 block mb-1">类型</label>
                <select value={newE.type} onChange={e => setNewE({...newE, type: e.target.value})} className="w-full bg-[#0A1628] border border-[#2A4066] rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-emerald-500">
                  {Object.keys(typeColors).map(t => <option key={t} value={t}>{t}</option>)}
                </select></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowEntityModal(false)} className="flex-1 py-2 border border-[#2A4066] rounded-lg text-sm text-gray-400 hover:bg-[#1C2D47]">取消</button>
              <button onClick={addEntity} className="flex-1 py-2 bg-emerald-500 text-[#0A1628] rounded-lg text-sm font-bold">确认</button>
            </div>
          </div>
        </div>
      )}

      {showRelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#132035] border border-[#2A4066] rounded-2xl p-6 w-96 shadow-2xl">
            <h3 className="text-base font-bold mb-4">新增关系</h3>
            <div className="space-y-3">
              <div><label className="text-xs text-gray-400 block mb-1">源实体</label>
                <select value={newR.from} onChange={e => setNewR({...newR, from: e.target.value})} className="w-full bg-[#0A1628] border border-[#2A4066] rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-amber-500">
                  <option value="">选择实体...</option>
                  {entities.map((e: any) => <option key={e.id} value={e.id}>{e.label}</option>)}
                </select></div>
              <div><label className="text-xs text-gray-400 block mb-1">关系名称</label>
                <input value={newR.label} onChange={e => setNewR({...newR, label: e.target.value})} className="w-full bg-[#0A1628] border border-[#2A4066] rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-amber-500" placeholder="如: 拥有" /></div>
              <div><label className="text-xs text-gray-400 block mb-1">目标实体</label>
                <select value={newR.to} onChange={e => setNewR({...newR, to: e.target.value})} className="w-full bg-[#0A1628] border border-[#2A4066] rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-amber-500">
                  <option value="">选择实体...</option>
                  {entities.map((e: any) => <option key={e.id} value={e.id}>{e.label}</option>)}
                </select></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowRelModal(false)} className="flex-1 py-2 border border-[#2A4066] rounded-lg text-sm text-gray-400 hover:bg-[#1C2D47]">取消</button>
              <button onClick={addRelation} className="flex-1 py-2 bg-amber-500 text-[#0A1628] rounded-lg text-sm font-bold">确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── STEP 2 ─────────────────────────────────────────────────────────────────
function KnowledgeGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [stats, setStats] = useState({ nodes: 16, links: 14, types: {} as Record<string, number> });

  const init = useCallback(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const { nodes, links } = PRESET_GRAPH;
    const w = svgRef.current.clientWidth || 600;
    const h = svgRef.current.clientHeight || 400;

    const tc: Record<string, number> = {};
    nodes.forEach((n: any) => { tc[n.type] = (tc[n.type] || 0) + 1; });
    setStats({ nodes: nodes.length, links: links.length, types: tc });

    svg.append('defs').append('marker').attr('id', 'arr').attr('viewBox', '0 -5 10 10')
      .attr('refX', 22).attr('refY', 0).attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
      .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#2A4066');

    const g = svg.append('g');
    d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 3])
      .on('zoom', (ev: any) => g.attr('transform', ev.transform))
      .scaleTo(svg as any, 0.75);

    const sim = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100).strength(0.4))
      .force('charge', d3.forceManyBody().strength(-250))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('collision', d3.forceCollide(25));

    const link = g.append('g').selectAll('line').data(links).join('line')
      .attr('stroke', '#2A4066').attr('stroke-width', 1.5).attr('marker-end', 'url(#arr)');
    const lbl = g.append('g').selectAll('text').data(links).join('text')
      .attr('font-size', '8').attr('fill', '#F5A623').attr('text-anchor', 'middle').attr('font-family', 'monospace').text((d: any) => d.label);

    const node = g.append('g').selectAll('g').data(nodes).join('g').attr('cursor', 'pointer')
      .call(d3.drag<any, any>()
        .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      ).on('click', (_: any, d: any) => setSelectedNode(d));

    node.append('circle').attr('r', 20).attr('fill', (d: any) => d.color).attr('fill-opacity', 0.2)
      .attr('stroke', (d: any) => d.color).attr('stroke-width', 2);
    node.append('circle').attr('r', 11).attr('fill', (d: any) => d.color);
    node.append('text').attr('dy', 30).attr('text-anchor', 'middle')
      .attr('fill', '#8A9BB5').attr('font-size', '9').attr('font-family', 'sans-serif')
      .text((d: any) => d.label.length > 10 ? d.label.slice(0, 9) + '…' : d.label);

    sim.on('tick', () => {
      link.attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y);
      lbl.attr('x', (d: any) => (d.source.x + d.target.x) / 2).attr('y', (d: any) => (d.source.y + d.target.y) / 2 - 5);
      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });
  }, []);

  useEffect(() => { init(); const r = () => init(); window.addEventListener('resize', r); return () => window.removeEventListener('resize', r); }, [init]);

  const typeColorMap: Record<string, string> = { Customer: '#00D4AA', Account: '#4A90D9', Transaction: '#9B59B6', LoanProduct: '#E67E22', Contract: '#E74C3C', RiskAssessment: '#F5A623' };

  return (
    <div className="grid grid-cols-6 gap-4 h-full">
      <div className="col-span-4 relative">
        <svg ref={svgRef} className="w-full h-full bg-[#132035] rounded-xl border border-[#2A4066]" />
        <div className="absolute top-3 left-3 bg-[#0A1628]/80 backdrop-blur border border-[#2A4066] rounded-lg px-3 py-2 flex gap-4">
          <span className="text-xs text-gray-400">节点 <span className="text-emerald-400 font-mono font-bold">{stats.nodes}</span></span>
          <span className="text-xs text-gray-400">边 <span className="text-emerald-400 font-mono font-bold">{stats.links}</span></span>
        </div>
      </div>
      <div className="col-span-2 flex flex-col gap-3 overflow-auto">
        <div className="bg-[#132035] border border-[#2A4066] rounded-xl p-4">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">类型分布</h4>
          {Object.entries(stats.types).map(([t, c]) => (
            <div key={t} className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: typeColorMap[t] || '#888' }} />
              <span className="text-xs text-gray-400 flex-1">{t}</span>
              <span className="text-xs font-mono text-gray-200">{c}</span>
            </div>
          ))}
        </div>
        <div className="bg-[#132035] border border-[#2A4066] rounded-xl p-4">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">图例</h4>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(typeColorMap).map(([t, c]) => (
              <div key={t} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                <span className="text-xs text-gray-400">{t}</span>
              </div>
            ))}
          </div>
        </div>
        {selectedNode && (
          <div className="bg-[#132035] border border-emerald-500/30 rounded-xl p-4 animate-fade-slide">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-emerald-400">{selectedNode.label}</h4>
              <button onClick={() => setSelectedNode(null)} className="text-gray-500 hover:text-gray-300"><EyeOff size={14} /></button>
            </div>
            <div className="space-y-1">
              {Object.entries(selectedNode.props || {}).map(([k, v]) => (
                <div key={k} className="flex items-start gap-2 py-1 border-b border-[#2A4066]/50 last:border-0">
                  <span className="text-xs text-gray-500 w-20 flex-shrink-0">{k}</span>
                  <span className="text-xs font-mono text-gray-200">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── STEP 3 ─────────────────────────────────────────────────────────────────
function SemanticLayer() {
  const [sel, setSel] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [sparql, setSparql] = useState('');
  const [loading, setLoading] = useState(false);
  const [matched, setMatched] = useState<string[]>([]);

  const handleParse = async () => {
    if (!query.trim()) return;
    setLoading(true); setMatched([]); setSparql('');
    await delay(400);
    const found = PRESET_SEMANTIC.filter(m => query.includes(m.term)).map(m => m.term);
    setMatched(found);
    await delay(800);
    const m = found[0] ? PRESET_SEMANTIC.find((s: any) => s.term === found[0]) : null;
    if (m) { setSel(m); setSparql(m.sparql); }
    else setSparql('// 未能匹配到已定义的语义映射\n// 请检查输入或添加新的映射规则');
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-5 gap-4 h-full">
      <div className="col-span-2 bg-[#132035] border border-[#2A4066] rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#2A4066]"><h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">业务术语映射</h4></div>
        <div className="flex-1 overflow-auto p-3 space-y-2">
          {PRESET_SEMANTIC.map(m => (
            <div key={m.id} onClick={() => { setSel(m); setSparql(m.sparql); setQuery(m.term); }}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${sel?.id === m.id ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-[#2A4066] bg-[#1C2D47] hover:border-[#2D4A7A]'}`}>
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare size={11} className="text-emerald-400" />
                <span className="text-sm font-medium text-gray-100">{m.term}</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">{m.desc}</p>
              <div className="flex flex-wrap gap-1">
                {m.ops.map((op: string[], i: number) => (
                  <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-[#1B2A4A] text-gray-400 font-mono">{op[0]}[{op[1]}]</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="col-span-3 flex flex-col gap-3">
        <div className="bg-[#132035] border border-[#2A4066] rounded-xl p-4 flex-1 flex flex-col">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Target size={13} className="text-emerald-400" /> 语义解析模拟器
          </h4>
          <div className="flex gap-2 mb-3">
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleParse()}
              placeholder="输入业务语句，如：客户申请贷款"
              className="flex-1 bg-[#0A1628] border border-[#2A4066] rounded-lg px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 font-mono" />
            <button onClick={handleParse} disabled={loading}
              className="px-4 py-2.5 bg-emerald-500 text-[#0A1628] rounded-lg text-sm font-bold hover:bg-emerald-400 disabled:opacity-50 transition-colors flex items-center gap-2">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <GitBranch size={14} />}
              解析
            </button>
          </div>
          {matched.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {matched.map(t => (
                <span key={t} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-mono animate-pulse-glow">{t} ✓</span>
              ))}
            </div>
          )}
          <div className="flex-1 bg-[#0A1628] rounded-lg border border-[#2A4066] p-3 overflow-auto">
            <p className="text-xs text-gray-500 mb-2">SPARQL 查询语句</p>
            {sparql ? <CodeBlock code={sparql} /> : <p className="text-sm text-gray-600 italic">输入语句并点击解析...</p>}
          </div>
        </div>
        {sel && (
          <div className="bg-[#132035] border border-emerald-500/30 rounded-xl p-4 animate-fade-slide">
            <h4 className="text-sm font-bold text-emerald-400 mb-3">映射详情 — {sel.term}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-2">本体操作链</p>
                {sel.ops.map((op: string[], i: number) => (
                  <div key={i} className="flex items-center gap-2 mb-1.5">
                    <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-mono">{i+1}</span>
                    <span className="text-sm font-mono text-gray-100">{op[0]}</span>
                    <ArrowRight size={11} className="text-gray-500" />
                    <span className="text-xs text-amber-400 font-mono">{op[1]}</span>
                  </div>
                ))}
              </div>
              <div><p className="text-xs text-gray-500 mb-2">SPARQL 模板</p><CodeBlock code={sel.sparql} /></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── STEP 4 ─────────────────────────────────────────────────────────────────
function AgentOrchestrator() {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [show, setShow] = useState(false);

  const run = async () => {
    setRunning(true); setDone([]); setOutputs({}); setShow(false);
    for (const agent of AGENT_DEFS) {
      setActive(agent.id);
      await delay(1800);
      setOutputs(p => ({ ...p, [agent.id]: AGENT_OUTPUTS[agent.id] }));
      setDone(p => [...p, agent.id]);
    }
    setActive(null); setRunning(false); setShow(true);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="grid grid-cols-4 gap-3">
        {AGENT_DEFS.map(ag => {
          const isActive = active === ag.id;
          const isDone = done.includes(ag.id);
          const Icon = ag.icon;
          return (
            <div key={ag.id} className={`p-4 rounded-xl border transition-all ${isActive ? 'border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/5' : isDone ? 'border-emerald-500/30 bg-[#1C2D47]' : 'border-[#2A4066] bg-[#132035]'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: ag.color + '20' }}>
                  <Icon size={16} style={{ color: ag.color }} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-100">{ag.name}</div>
                  <div className="text-xs text-gray-500">{ag.desc}</div>
                </div>
              </div>
              <div>{isDone ? <StatusBadge status="pass" />
                : isActive ? <div className="flex items-center gap-1.5"><Loader2 size={12} className="animate-spin text-emerald-400" /><span className="text-xs text-emerald-400">执行中...</span></div>
                : <span className="text-xs text-gray-600">等待执行</span>}</div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 py-2 px-4 bg-[#132035] border border-[#2A4066] rounded-xl">
        <span className="text-xs text-gray-500 flex-shrink-0 font-mono">消息总线</span>
        <div className="flex-1 flex items-center gap-1">
          {AGENT_DEFS.map((ag, i) => (
            <div key={ag.id} className="flex items-center flex-1">
              <div className="flex-1 h-px bg-[#2A4066]" />
              <div className="flex items-center gap-1 px-1">
                <span className={`w-2 h-2 rounded-full ${done.includes(ag.id) ? 'bg-emerald-400' : active === ag.id ? 'bg-amber-400 animate-pulse' : 'bg-gray-600'}`} />
                <span className="text-xs font-mono text-gray-500">{ag.name.slice(0, 2)}</span>
              </div>
              {i < AGENT_DEFS.length - 1 && <div className="flex-1 h-px bg-[#2A4066]" />}
            </div>
          ))}
        </div>
        <button onClick={run} disabled={running}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-[#0A1628] rounded-lg text-sm font-bold hover:bg-emerald-400 disabled:opacity-50 transition-colors ml-2">
          {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {running ? '运行中...' : '启动智能体'}
        </button>
      </div>

      {show && (
        <div className="grid grid-cols-2 gap-3 flex-1 overflow-auto">
          {AGENT_DEFS.map(ag => {
            const out = outputs[ag.id];
            if (!out) return null;
            return (
              <div key={ag.id} className="bg-[#132035] border border-[#2A4066] rounded-xl overflow-hidden flex flex-col animate-fade-slide">
                <div className="px-4 py-3 border-b border-[#2A4066] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-sm font-semibold text-gray-100">{ag.name}</span>
                  </div>
                  <StatusBadge status="pass" />
                </div>
                <div className="p-4 overflow-auto flex-1"><CodeBlock code={out} /></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── STEP 5 ─────────────────────────────────────────────────────────────────
function ComplianceEngine() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [report, setReport] = useState(false);

  const SIM_RESULTS = [
    { ruleId: 'cr1', status: 'pass' as const, msg: '身份证实名认证通过', detail: '姓名: 王建国 | 身份证: 310***********1234 | 人脸比对: 98.7% | 公安部系统: 匹配成功' },
    { ruleId: 'cr2', status: 'pass' as const, msg: '未命中制裁名单', detail: '人民银行制裁名单: 0匹配 | 联合国安理会名单: 0匹配 | FATF高风险地区: 0匹配' },
    { ruleId: 'cr3', status: 'pass' as const, msg: 'LTV比率检查通过', detail: '抵押物评估: 153.8万 | 贷款金额: 100万 | LTV=65.0% | 上限: 70% | 通过✓' },
    { ruleId: 'cr4', status: 'pass' as const, msg: 'DSR偿债比检查通过', detail: '月收入估算: 5.8万 | 现有月还款: 1.05万 | 本笔新增: 约2.97万 | DSR=38.1% | 上限50% | 通过✓' },
    { ruleId: 'cr5', status: 'pass' as const, msg: '贷款额度未超上限', detail: '申请金额: 100万 | 产品上限: 500万 | 当前敞口: 100万 | 总敞口(含本笔): 200万 | 通过✓' },
    { ruleId: 'cr6', status: 'pass' as const, msg: '大额交易报告', detail: '单笔100万 > 36万阈值 | 建议生成可疑交易报告(可选) | 当前状态: 已记录' },
    { ruleId: 'cr7', status: 'pass' as const, msg: '未检测到结构性交易', detail: '近7日: 3笔(15万/8.8万/32万) | 金额分散无拆分 | 评分: 0.12<0.5 | 通过✓' },
  ];

  const run = async () => {
    setRunning(true); setResults([]); setReport(false);
    for (const r of SIM_RESULTS) {
      await delay(600);
      setResults(p => [...p, r]);
    }
    setRunning(false);
  };

  const allPass = results.length === SIM_RESULTS.length && results.every((r: any) => r.status === 'pass');

  return (
    <div className="grid grid-cols-5 gap-4 h-full">
      <div className="col-span-2 flex flex-col gap-2 overflow-auto pr-1">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">监管规则库</h3>
          <button onClick={run} disabled={running}
            className="flex items-center gap-1 px-2.5 py-1 bg-red-500/15 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/25 disabled:opacity-50 transition-colors">
            {running ? <Loader2 size={11} className="animate-spin" /> : <Shield size={11} />}
            {running ? '检查中...' : '执行检查'}
          </button>
        </div>
        {PRESET_RULES.map(rule => {
          const result = results.find((r: any) => r.ruleId === rule.id);
          return (
            <div key={rule.id} className="bg-[#132035] border border-[#2A4066] rounded-xl overflow-hidden">
              <div onClick={() => setExpanded(expanded === rule.id ? null : rule.id)}
                className="p-3 cursor-pointer hover:bg-[#1C2D47] transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${rule.cat === 'KYC' ? 'bg-emerald-400' : rule.cat === 'LOAN' ? 'bg-amber-400' : 'bg-red-400'}`} />
                  <span className="text-xs font-mono text-gray-500">{rule.cat}</span>
                  <span className="text-sm font-medium text-gray-100 flex-1">{rule.name}</span>
                  {result && <StatusBadge status={result.status} />}
                  <ChevronDown size={12} className={`text-gray-500 transition-transform ${expanded === rule.id ? 'rotate-180' : ''}`} />
                </div>
                <p className="text-xs text-gray-500 ml-4">{rule.desc}</p>
                <p className="text-xs text-amber-400/70 ml-4 mt-0.5">阈值: {rule.threshold}</p>
              </div>
              {expanded === rule.id && result && (
                <div className="px-3 pb-3 animate-fade-slide">
                  <div className="bg-[#0A1628] rounded-lg p-3 text-xs text-gray-400 leading-relaxed border border-[#2A4066]/50 font-mono">
                    {result.detail}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="col-span-3 flex flex-col gap-4">
        <div className="bg-[#132035] border border-[#2A4066] rounded-xl p-5 flex-1 flex flex-col overflow-auto">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">合规检查报告</h4>
          <div className="space-y-2 flex-1">
            {!results.length && !running && (
              <div className="flex-1 flex items-center justify-center h-full">
                <div className="text-center">
                  <Shield size={48} className="text-gray-600 mx-auto mb-3 opacity-30" />
                  <p className="text-gray-500 text-sm">点击左侧"执行检查"开始合规审查</p>
                </div>
              </div>
            )}
            {running && SIM_RESULTS.map((r, i) => {
              const cur = results.find((cr: any) => cr.ruleId === r.ruleId);
              return (
                <div key={r.ruleId} className="flex items-center gap-3 py-2.5 px-4 bg-[#0A1628] rounded-lg border border-[#2A4066]/50">
                  {cur ? <><StatusBadge status={cur.status} /><span className="text-sm text-gray-100">{cur.msg}</span></>
                    : <><span className="w-6 h-6 rounded-full border-2 border-[#2A4066] flex-shrink-0 flex items-center justify-center"><span className="w-2 h-2 rounded-full bg-gray-600 animate-pulse" /></span><span className="text-sm text-gray-600">{PRESET_RULES[i]?.name}</span></>}
                </div>
              );
            })}
            {results.length === SIM_RESULTS.length && !running && results.map((r: any) => (
              <div key={r.ruleId} className="flex items-center gap-3 py-2.5 px-4 bg-[#0A1628] rounded-lg border border-[#2A4066]/50">
                <StatusBadge status={r.status} /><span className="text-sm text-gray-100">{r.msg}</span>
              </div>
            ))}
          </div>
        </div>

        {results.length === SIM_RESULTS.length && !running && (
          <div className={`rounded-xl p-5 border animate-fade-slide ${allPass ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <div className="flex items-center gap-3 mb-3">
              {allPass ? (
                <><CheckCircle size={24} className="text-emerald-400" /><div><div className="text-lg font-bold text-emerald-400">审批通过 — APPROVE</div><div className="text-sm text-gray-400 mt-0.5">所有 {results.length} 项合规检查均已通过</div></div></>
              ) : (
                <><XCircle size={24} className="text-red-400" /><div><div className="text-lg font-bold text-red-400">审批拒绝 — REJECT</div><div className="text-sm text-gray-400 mt-0.5">存在合规问题</div></div></>
              )}
            </div>
            {!report && allPass && (
              <button onClick={() => setReport(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-[#0A1628] rounded-lg text-sm font-bold hover:bg-emerald-400 transition-colors">
                <ScrollText size={14} /> 生成合规审批报告
              </button>
            )}
            {report && (
              <div className="bg-[#0A1628] rounded-lg p-4 border border-[#2A4066]/50 animate-fade-slide">
                <div className="flex items-center gap-2 mb-2">
                  <Scale size={14} className="text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-400">合规审批报告</span>
                  <span className="ml-auto text-xs text-gray-500 font-mono">COMP-2024-1105-001</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  本次贷款申请（合同编号: HT-2024-001，客户: 王建国，申请金额: 100万元，企业经营贷）已通过全部7项合规检查，符合《中华人民共和国银行业监督管理法》、《个人贷款管理暂行办法》及《金融机构大额交易和可疑交易报告管理办法》相关规定。建议进入合同签署阶段。
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── STEP 6 ─────────────────────────────────────────────────────────────────
function SimulationPanel() {
  const [input] = useState('王建国申请100万元企业经营贷，用于扩大经营规模');
  const [phase, setPhase] = useState(0);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState('');

  const phases = [
    { label: '本体定位', desc: '识别业务实体', icon: Brain, color: '#00D4AA' },
    { label: '图谱查询', desc: '获取实例数据', icon: Network, color: '#4A90D9' },
    { label: '语义解析', desc: '映射结构化操作', icon: Layers, color: '#9B59B6' },
    { label: 'Agent执行', desc: '多智能体协作', icon: Bot, color: '#E67E22' },
    { label: '合规审查', desc: '监管规则校验', icon: Shield, color: '#00D4AA' },
  ];

  const RESULTS = [
    '本体定位结果:\n• 客户 (Customer) — 识别到: 王建国\n• 贷款产品 (LoanProduct) — 识别到: 企业经营贷\n• 合同 (Contract) — 识别到: 新建合同\n• 关系链路: Customer → appliesFor → LoanProduct → generates → Contract',
    '知识图谱查询结果:\n• 客户C001 (王建国): 风险等级A, 信用评分782\n• 历史合同: 1份 (HT-2024-001, 执行中, 100万)\n• 总敞口: 100万元\n• 产品LP001: 额度上限500万, 利率4.35%',
    '语义解析结果:\n• 业务术语: "申请贷款" → 已映射\n• SPARQL查询已生成\n• 识别到3个本体操作:\n  1. Customer[读取]\n  2. LoanProduct[查询]\n  3. Contract[创建]',
    'Agent执行结果:\n• 理解代理: intent=loan_application, confidence=0.97\n• 检索代理: 获取客户及产品信息完成\n• 决策代理: APPROVE_WITH_CONDITIONS (概率85%)\n• 合规代理: 全部检查通过 ✓',
    '合规审查结论:\n✓ KYC身份核验 — PASS\n✓ 反洗钱名单筛查 — PASS\n✓ LTV比率检查 (65% ≤ 70%) — PASS\n✓ DSR偿债比检查 (38% ≤ 50%) — PASS\n✓ 贷款额度上限 — PASS\n✓ 资金用途合规 — PASS\n\n最终裁定: APPROVE\n合规报告编号: COMP-2024-1105-001',
  ];

  const run = async () => {
    setRunning(true); setPhase(0); setResult('');
    for (let i = 0; i < phases.length; i++) {
      await delay(1800);
      setPhase(i + 1);
      setResult(RESULTS[i]);
    }
    setRunning(false);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="bg-[#132035] border border-[#2A4066] rounded-xl p-5">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">输入业务场景</h4>
        <div className="flex gap-3">
          <textarea value={input} rows={2}
            placeholder="描述一笔银行业务场景..."
            className="flex-1 bg-[#0A1628] border border-[#2A4066] rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 resize-none font-mono" />
          <button onClick={run} disabled={running}
            className="px-6 py-3 bg-emerald-500 text-[#0A1628] rounded-xl font-bold text-sm hover:bg-emerald-400 disabled:opacity-50 transition-colors flex items-center gap-2 self-end">
            {running ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            {running ? '模拟运行中...' : '开始模拟'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {phases.map((p, i) => {
          const Icon = p.icon;
          const isActive = phase === i + 1;
          const isDone = phase > i + 1;
          return (
            <div key={i} className={`p-3 rounded-xl border text-center transition-all ${isActive ? 'border-emerald-500/50 bg-emerald-500/10' : isDone ? 'border-emerald-500/30 bg-[#1C2D47]' : 'border-[#2A4066] bg-[#132035]'}`}>
              <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${isActive ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: (isActive || isDone ? p.color : '#2A4066') + '20' }}>
                <Icon size={14} style={{ color: isActive || isDone ? p.color : '#4A6080' }} />
              </div>
              <div className="text-xs font-semibold text-gray-100">{p.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{p.desc}</div>
            </div>
          );
        })}
      </div>

      {result && (
        <div className="flex-1 bg-[#132035] border border-emerald-500/30 rounded-xl p-5 overflow-auto animate-fade-slide">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <Activity size={14} /> 执行结果
            </h4>
            {phase > 0 && <span className="text-xs text-gray-500 font-mono">{phases[phase - 1]?.label}</span>}
          </div>
          <pre className="text-sm text-gray-100 font-mono leading-relaxed whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState(0);
  const [entities, setEntities] = useState(PRESET_ENTITIES);
  const [relations, setRelations] = useState(PRESET_RELATIONS);

  const reset = () => {
    setEntities(PRESET_ENTITIES);
    setRelations(PRESET_RELATIONS);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0A1628] overflow-hidden">
      <header className="flex-shrink-0 h-16 border-b border-[#2A4066] bg-[#132035]/80 backdrop-blur-md flex items-center px-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Brain size={20} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-100" style={{ fontFamily: 'Cinzel, serif' }}>OntologyBank</h1>
            <p className="text-xs text-gray-500">本体建模 × AI智能体合规演示</p>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === i;
            const isDone = step > i;
            return (
              <div key={s.id} className="flex items-center">
                {i > 0 && <div className={`w-6 h-px ${isActive || isDone ? 'bg-emerald-500' : 'bg-[#2A4066]'}`} />}
                <button onClick={() => setStep(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : isDone ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-400'}`}>
                  {isDone ? <CheckCircle size={12} className="text-emerald-400" /> : <Icon size={12} />}
                  {s.label}
                </button>
              </div>
            );
          })}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-56 flex-shrink-0 border-r border-[#2A4066] bg-[#132035]/40 overflow-auto p-4">
          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-100 mb-0.5" style={{ fontFamily: 'Cinzel, serif' }}>{STEPS[step].label}</h2>
            <p className="text-xs text-gray-500">{STEPS[step].sub}</p>
          </div>
          <div className="space-y-1">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === i;
              const isDone = step > i;
              return (
                <button key={s.id} onClick={() => setStep(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isActive ? 'bg-emerald-500/10 border border-emerald-500/30' : 'hover:bg-[#1C2D47] border border-transparent'}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-emerald-500/20' : isDone ? 'bg-emerald-500/10' : 'bg-[#1C2D47]'}`}>
                    {isDone ? <CheckCircle size={14} className="text-emerald-400" /> : <Icon size={14} className={isActive ? 'text-emerald-400' : 'text-gray-500'} />}
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${isActive ? 'text-gray-100' : 'text-gray-400'}`}>{s.label}</div>
                    <div className="text-xs text-gray-600">{s.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>
          {step === 0 && (
            <button onClick={reset} className="mt-4 w-full flex items-center justify-center gap-2 py-2 border border-[#2A4066] rounded-xl text-xs text-gray-400 hover:bg-[#1C2D47] transition-colors">
              <Database size={13} /> 加载演示数据
            </button>
          )}
        </aside>

        <main className="flex-1 overflow-hidden p-6 flex flex-col">
          <div className="flex-1 overflow-auto animate-fade-slide" key={step}>
            {step === 0 && <OntologyEditor entities={entities} setEntities={setEntities} relations={relations} setRelations={setRelations} />}
            {step === 1 && <KnowledgeGraph />}
            {step === 2 && <SemanticLayer />}
            {step === 3 && <AgentOrchestrator />}
            {step === 4 && <ComplianceEngine />}
            {step === 5 && <SimulationPanel />}
          </div>
        </main>
      </div>
    </div>
  );
}
