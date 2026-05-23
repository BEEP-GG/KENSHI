import { GameState } from '../types';
import { ShieldCheck, Factory, AlertTriangle, Zap, Coins, Users, CheckCircle } from 'lucide-react';
import { FACILITY_BLUEPRINTS } from '../data';

export default function Dashboard({ state, onCollectIncome, hasCollectedIncome }: { state: GameState, onCollectIncome: () => void, hasCollectedIncome: boolean }) {
  const currentFacilities = state.facilities.filter(f => f.outpostId === state.currentOutpostId);
  const currentEmployees = state.employees.filter(e => e.outpostId === state.currentOutpostId);
  const activeFacilities = currentFacilities.filter(f => f.status === 'active').length;
  const criticalEvents = state.events.filter(e => e.type === 'urgent').length;
  const workingStaff = currentEmployees.filter(e => e.status === 'working').length;

  return (
    <div className="p-8">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-light tracking-wide text-slate-100 flex items-center">
            {state.outposts.find(o => o.id === state.currentOutpostId)?.name || '基地统御核心'} - 运作概览
          </h2>
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-sm text-slate-400 font-mono tracking-widest">{state.outposts.find(o => o.id === state.currentOutpostId)?.location || '未知区域'}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-500 border border-amber-500/20 shadow-[0_0_10px_rgba(217,119,6,0.1)]">
              Lv.{state.outposts.find(o => o.id === state.currentOutpostId)?.level || 1} { {1: '房屋', 2: '哨站', 3: '村庄', 4: '村庄', 5: '城镇'}[state.outposts.find(o => o.id === state.currentOutpostId)?.level || 1] || '未知' }
            </span>
          </div>
          <p className="text-slate-400 mt-2 text-sm tracking-wider">
            {(() => {
              const lvl = state.outposts.find(o => o.id === state.currentOutpostId)?.level || 1;
              if (lvl === 1) return '老大，这里是您掌控这间房屋的小天地。请发号施令。';
              if (lvl === 2) return '长官，这里是您指挥安全防线的哨所中心。请明智决断。';
              if (lvl === 3 || lvl === 4) return '村长，这里是您管理全村生产与生活的管理所。请引领大家走向繁荣。';
              return '城主，这里是您统御整座城镇发展的领主大厅。请下达您的至高政令。';
            })()}
          </p>
        </div>
        <button 
          onClick={onCollectIncome}
          disabled={hasCollectedIncome}
          className={`${hasCollectedIncome ? 'bg-slate-700 text-slate-400 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'} px-6 py-2.5 rounded-lg font-medium tracking-widest text-sm flex items-center transition-colors`}
        >
          {hasCollectedIncome ? (
            <>
              <CheckCircle size={16} className="mr-2" />
              今日已领取
            </>
          ) : (
            <>
              <Coins size={16} className="mr-2" />
              清算所有收益
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="glass-card p-6 rounded-xl border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start">
            <h3 className="text-slate-400 text-sm tracking-widest font-medium">基建指数</h3>
            <Factory size={20} className="text-emerald-500/50" />
          </div>
          <div className="text-3xl font-mono text-slate-100 mt-2">{activeFacilities} <span className="text-lg text-slate-500">/ {currentFacilities.length}</span></div>
          <div className="text-xs text-emerald-400 mt-2 flex items-center"><Zap size={12} className="mr-1"/> 运行效率良好</div>
        </div>

        <div className="glass-card p-6 rounded-xl border-l-4 border-l-amber-500">
          <div className="flex justify-between items-start">
            <h3 className="text-slate-400 text-sm tracking-widest font-medium">资金库藏</h3>
            <Coins size={20} className="text-amber-500/50" />
          </div>
          <div className="text-3xl font-mono text-amber-500 text-glow mt-2">{state.cats.toLocaleString()}</div>
          <div className="text-xs text-slate-400 mt-2 text-amber-500/70">总记账开币 (Cats)</div>
        </div>

        <div className="glass-card p-6 rounded-xl border-l-4 border-l-blue-500">
          <div className="flex justify-between items-start">
            <h3 className="text-slate-400 text-sm tracking-widest font-medium">可用人力</h3>
            <Users size={20} className="text-blue-500/50" />
          </div>
          <div className="text-3xl font-mono text-slate-100 mt-2">{workingStaff} <span className="text-lg text-slate-500">/ {currentEmployees.length}</span></div>
          <div className="text-xs text-slate-400 mt-2">当前处于指派状态</div>
        </div>

        <div className="glass-card p-6 rounded-xl border-l-4 border-l-red-500">
          <div className="flex justify-between items-start">
            <h3 className="text-slate-400 text-sm tracking-widest font-medium">紧急危机</h3>
            <ShieldCheck size={20} className="text-red-500/50" />
          </div>
          <div className="text-3xl font-mono text-red-500 mt-2">{criticalEvents}</div>
          <div className="text-xs text-red-400 mt-2 flex items-center animate-pulse"><AlertTriangle size={12} className="mr-1"/> 需要您的即时决策</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIwLjIiIGZpbGw9Im5vbmUiPjxwYXRoIGQ9Ik0wIDE0TDE0IDB6bTQ2IDBoMTRtMC0xNEw0NiAweiIgLz48L2c+PC9zdmc+')] opacity-10 pointer-events-none"></div>
          <h3 className="text-xl text-slate-200 mb-6 flex items-center">
            <Zap size={20} className="mr-2 text-amber-500" /> 最新生产报告 ({state.outposts.find(o => o.id === state.currentOutpostId)?.name})
          </h3>
          <div className="space-y-4">
            {currentFacilities.filter(f => f.status === 'active').map(fac => {
              const bp = FACILITY_BLUEPRINTS.find(b => b.id === fac.blueprintId);
              const levelData = bp?.levels[fac.level];
              return (
              <div key={fac.id} className="flex justify-between items-center p-4 rounded-lg bg-white/5 border border-white/5">
                <div>
                  <h4 className="text-slate-200 font-medium">{levelData?.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">分配人员: {fac.workers.length}</p>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-mono">+{levelData?.productionRate}</div>
                  <div className="text-xs text-slate-500">{levelData?.productionType}</div>
                </div>
              </div>
            )})}
            {currentFacilities.filter(f => f.status === 'active').length === 0 && (
              <div className="text-center py-10 text-slate-600 italic text-sm">
                当前据点无正在运行的生产设施
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl">
          <h3 className="text-xl text-slate-200 mb-6 flex items-center">
             资产总库藏
          </h3>
          <div className="space-y-3">
            {Object.keys(state.resources).length > 0 ? (
              Object.entries(state.resources).map(([resName, amount]) => (
                <div key={resName} className="flex justify-between items-center bg-black/30 p-3 rounded border border-white/5">
                  <span className="text-sm text-slate-300">{resName}</span>
                  <span className="font-mono text-emerald-400 font-medium">{amount}</span>
                </div>
              ))
            ) : (
               <div className="text-center py-10 text-slate-600 italic text-sm">
                 库藏空空如也
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
