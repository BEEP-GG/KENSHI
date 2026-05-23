import { useState } from 'react';
import { GameState, Facility, FacilityBlueprint } from '../types';
import Modal from './Modal';
import { Leaf, Droplet, Wrench, ChevronRight, Activity, Users, Settings, BrickWall, Shield, Pickaxe, ArrowUpCircle, PlusCircle, Factory, Check, Home, Coffee, Store, Bed, Scissors, Box, Cpu, Shirt, Sword, Bot, Utensils, Wheat, Beer, ShieldAlert, Lock, Heart, Edit2 } from 'lucide-react';
import { FACILITY_BLUEPRINTS } from '../data';

const IconMap: Record<string, any> = {
  Leaf,
  Droplet,
  Wrench,
  BrickWall,
  Shield,
  Pickaxe,
  Home,
  Coffee,
  Store,
  Bed,
  Scissors,
  Box,
  Cpu,
  Shirt,
  Sword,
  Bot,
  Utensils,
  Wheat,
  Beer,
  ShieldAlert,
  Lock,
  Heart
};

export default function Facilities({ 
  state, 
  testMode,
  onBuild,
  onUpgrade,
  onAssign,
  onAssignMultiple,
  onRenameFacility
}: { 
  state: GameState,
  testMode: boolean,
  onBuild: (bpId: string, cost: any, targetLevel?: number) => void,
  onUpgrade: (facId: string, cost: any) => void,
  onAssign: (empId: string, facId: string | undefined) => void,
  onAssignMultiple: (assignments: Record<string, string | undefined>) => void,
  onRenameFacility?: (facId: string, customName: string) => void
}) {
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [modalView, setModalView] = useState<'details' | 'assign' | 'upgrade' | 'build'>('details');
  const [localAssignments, setLocalAssignments] = useState<Record<string, string | undefined>>({});
  const [buildLevels, setBuildLevels] = useState<Record<string, number>>({});
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [buildCategoryFilter, setBuildCategoryFilter] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const currentOutpost = state.outposts.find(o => o.id === state.currentOutpostId);
  const outpostLevel = currentOutpost?.level || 1;

  const selectedFacility = selectedFacilityId ? state.facilities.find(f => f.id === selectedFacilityId) || null : null;
  const selectedBp = selectedFacility ? FACILITY_BLUEPRINTS.find(b => b.id === selectedFacility.blueprintId) : null;
  const selectedLevel = selectedFacility && selectedBp ? selectedBp.levels[selectedFacility.level] : null;

  const getEmpFacilityId = (empId: string) => {
    return localAssignments[empId] !== undefined ? localAssignments[empId] : state.employees.find(e => e.id === empId)?.facilityId;
  };

  const currentOutpostFacilities = state.facilities.filter(f => f.outpostId === state.currentOutpostId);
  const filteredFacilities = categoryFilter 
    ? currentOutpostFacilities.filter(f => {
        const bp = FACILITY_BLUEPRINTS.find(b => b.id === f.blueprintId);
        return bp && bp.category === categoryFilter;
      })
    : currentOutpostFacilities;

  const currentOutpostEmployees = state.employees.filter(e => e.outpostId === state.currentOutpostId);
  const categories = ['防御', '生产', '锻造', '基建', '娱乐', '囚禁'];

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-end border-b border-white/5 pb-6">
        <div>
          <h2 className="text-3xl font-light tracking-wide text-slate-100 flex items-center">
            <Factory className="mr-3 text-amber-500" size={28} />
            设施阵列 - {state.outposts.find(o => o.id === state.currentOutpostId)?.name}
          </h2>
          <p className="text-slate-400 mt-2 text-sm tracking-wider">管理基地内部建造的各类生产与加工区块，以及城墙防御规划。</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <button 
              onClick={() => setCategoryFilter(null)}
              className={`px-3 py-1 text-xs rounded transition-colors ${!categoryFilter ? 'bg-amber-500 text-black font-medium' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
            >
              全部
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 text-xs rounded transition-colors border border-transparent ${categoryFilter === cat ? 'bg-amber-500 text-black font-medium' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <button 
          onClick={() => {
            setSelectedFacilityId(null);
            setModalView('build');
            setIsRenaming(false);
          }}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 transition-colors text-white px-5 py-2.5 rounded-lg font-medium text-sm tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.3)]"
        >
          <PlusCircle size={18} />
          <span>新建蓝图</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFacilities.map(fac => {
          const bp = FACILITY_BLUEPRINTS.find(b => b.id === fac.blueprintId);
          if (!bp) return null;
          const levelData = bp.levels[fac.level];
          const Icon = IconMap[bp.icon] || Settings;
          const assignedWorkers = currentOutpostEmployees.filter(e => e.facilityId === fac.id);

          return (
            <div 
              key={fac.id}
              onClick={() => {
                setSelectedFacilityId(fac.id);
                setModalView('details');
                setIsRenaming(false);
              }}
              className="glass-card cursor-pointer p-1 rounded-xl overflow-hidden group hover:border-amber-500/30 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(217,119,6,0.1)]"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 group-hover:border-amber-500/30 transition-colors">
                    <Icon size={24} className="text-amber-500/80 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center space-x-1 mb-1">
                      <div className={`w-2 h-2 rounded-full ${fac.status === 'active' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.6)]' : 'bg-slate-600'}`} />
                      <span className="text-xs text-slate-500 ml-2 tracking-widest">{fac.status === 'active' ? '运行中' : '闲置'}</span>
                    </div>
                    <span className="text-[10px] uppercase text-slate-600 border border-slate-700/50 px-1.5 rounded">{bp.category}</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-medium text-slate-200 mb-1">{fac.customName || levelData?.name || `未定义等级 ${fac.level}`}</h3>
                <div className="text-xs text-amber-500/80 font-mono mb-4 border-b border-white/5 pb-4">
                  LVL {fac.level}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 flex items-center"><Activity size={14} className="mr-2 opacity-50" /> 预计产出</span>
                    <span className="text-emerald-400 font-mono">+{levelData?.productionRate || 0} <span className="text-xs text-slate-500">{levelData?.productionType || ''}</span></span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 flex items-center"><Users size={14} className="mr-2 opacity-50" /> 人员编制</span>
                    <span className="text-slate-300 font-mono">{assignedWorkers.length} / {levelData?.maxWorkers || 0}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 py-3 px-6 flex justify-between items-center border-t border-white/5 group-hover:bg-amber-500/10 transition-colors">
                <span className="text-xs text-slate-400 font-medium tracking-wider group-hover:text-amber-500 transition-colors">管理设施</span>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-amber-500 transition-colors" />
              </div>
            </div>
          );
        })}
      </div>

      <Modal 
        isOpen={!!selectedFacility || modalView === 'build'} 
        onClose={() => { setSelectedFacilityId(null); setModalView('details'); setIsRenaming(false); }}
        title={
          modalView === 'build' ? '蓝图工程网络' :
          modalView === 'details' ? (selectedFacility?.customName || selectedLevel?.name || '设施详情') : 
          modalView === 'upgrade' ? `科研升级许可: ${selectedLevel?.name}` :
          `部署许可: ${selectedLevel?.name}`
        }
        icon={modalView === 'build' ? <PlusCircle size={20} /> : <Settings size={20} />}
      >
        {selectedFacility && selectedBp && selectedLevel && modalView === 'details' && (
          <div className="space-y-6">
            {isRenaming ? (
              <div className="flex items-center space-x-2 bg-black/30 p-2 rounded border border-amber-500/30">
                <input 
                  type="text" 
                  value={renameValue} 
                  onChange={e => setRenameValue(e.target.value)} 
                  className="bg-black/50 border border-white/10 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-amber-400 w-full"
                  placeholder="输入自定义名称..."
                  autoFocus
                />
                <button 
                  onClick={() => {
                    if (onRenameFacility) onRenameFacility(selectedFacility.id, renameValue);
                    setIsRenaming(false);
                  }}
                  className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded transition-colors"
                >
                  <Check size={16} />
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center bg-white/5 border border-white/10 p-3 rounded group hover:border-amber-500/30 transition-colors">
                <div className="flex items-center space-x-2">
                  <span className="text-amber-500/70 text-xs font-mono tracking-widest border border-amber-500/30 px-1.5 rounded">ID</span>
                  <span className="text-slate-200 text-sm font-medium">{selectedFacility.customName || selectedLevel.name}</span>
                </div>
                <button 
                  onClick={() => {
                    setRenameValue(selectedFacility.customName || selectedLevel.name);
                    setIsRenaming(true);
                  }}
                  className="text-slate-500 hover:text-amber-400 transition-colors p-1"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            )}
            
            <p className="text-slate-300 text-sm leading-relaxed tracking-wide">
              {selectedLevel.description}
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-black/40 border border-white/5">
                <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider">产出/效能</div>
                <div className="text-2xl text-emerald-400 font-mono">+{selectedLevel.productionRate}</div>
                <div className="text-xs text-slate-400 border-t border-white/10 pt-2 mt-2">{selectedLevel.productionType}</div>
              </div>
              <div className="p-4 rounded-lg bg-black/40 border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50"></div>
                <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider flex justify-between">
                  <span>设施等级</span>
                  {selectedBp.levels[selectedFacility.level + 1] && (
                    <span className="text-amber-500 flex items-center animate-pulse"><ArrowUpCircle size={12} className="mr-1"/> 可升级</span>
                  )}
                </div>
                <div className="text-2xl text-amber-500 font-mono">{selectedFacility.level}</div>
                <div className="text-xs text-slate-400 border-t border-white/10 pt-2 mt-2">最高可升至 {Object.keys(selectedBp.levels).length} 级</div>
              </div>
            </div>

            {selectedBp.statScaling && selectedBp.statScaling.length > 0 && selectedLevel.maxWorkers > 0 && (
              <div className="bg-amber-900/10 border border-amber-500/20 rounded p-3 text-sm flex items-center">
                <Activity size={16} className="text-amber-500/80 mr-2 shrink-0" />
                <span className="text-amber-500/80 mr-2 shrink-0">收益加成属性推荐:</span>
                <span className="text-amber-400 tracking-wider font-medium">{selectedBp.statScaling.join('、')}</span>
              </div>
            )}

            {selectedLevel.maxWorkers > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-200 mb-3 border-b border-white/5 pb-2">分配的主管与劳工 ({currentOutpostEmployees.filter(e => e.facilityId === selectedFacility.id).length}/{selectedLevel.maxWorkers})</h4>
                {currentOutpostEmployees.filter(e => e.facilityId === selectedFacility.id).length > 0 ? (
                  <div className="space-y-2">
                    {currentOutpostEmployees.filter(e => e.facilityId === selectedFacility.id).map(emp => (
                      <div key={emp.id} className="flex justify-between items-center p-3 rounded bg-white/5 border border-white/5">
                        <div>
                          <div className="text-sm font-medium text-slate-200">{emp.name}</div>
                          <div className="text-xs text-slate-500">{emp.role}</div>
                        </div>
                        <div className="text-xs text-emerald-400 font-mono border border-emerald-500/20 px-2 py-1 rounded bg-emerald-950/30">
                          血量: {emp.hp}/{emp.maxHp}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-sm text-slate-500 bg-white/5 rounded border border-white/5 border-dashed">
                    当前无人员分配于此设施。
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-white/10 flex justify-end space-x-3">
              {selectedBp.levels[selectedFacility.level + 1] && (
                 <button 
                  onClick={() => setModalView('upgrade')}
                  className="px-6 py-2 rounded text-sm text-amber-500 border border-amber-500/30 hover:bg-amber-500/10 transition-colors flex items-center"
                 >
                  <ArrowUpCircle size={16} className="mr-2" />
                  工程升级
                 </button>
              )}
              {selectedLevel.maxWorkers > 0 && (
                <button 
                  onClick={() => {
                    setLocalAssignments({});
                    setModalView('assign');
                  }}
                  className="px-6 py-2 rounded bg-amber-600/20 text-amber-500 border border-amber-500/50 hover:bg-amber-600/40 hover:text-white transition-colors text-sm tracking-widest font-medium"
                >
                  人员调配
                </button>
              )}
            </div>
          </div>
        )}

        {selectedFacility && selectedBp && selectedLevel && modalView === 'upgrade' && (() => {
          const nextLevelData = selectedBp.levels[selectedFacility.level + 1];
          if (!nextLevelData) return <div className="text-slate-400">已达到最大等级或无此蓝图。</div>;
          
          const outpostLvlReq = nextLevelData.requiredOutpostLevel || 1;
          const meetsOutpostReq = outpostLevel >= outpostLvlReq;

          return (
          <div className="space-y-6">
            <div className="bg-black/30 p-5 rounded-lg border border-amber-500/20 space-y-3">
               <h3 className="text-slate-200 flex items-center">
                 <ArrowUpCircle size={18} className="text-amber-500 mr-2" />
                 升级至: {nextLevelData.name}
               </h3>
               <p className="text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-3">
                 {nextLevelData.description}
               </p>
            </div>

            <div className="grid grid-cols-2 gap-4 opacity-80">
              <div className="p-3 rounded bg-white/5 border border-white/5 text-center">
                <div className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">预期产出/效能</div>
                <div className="text-lg text-emerald-400 font-mono">+{nextLevelData.productionRate}</div>
              </div>
              <div className="p-3 rounded bg-white/5 border border-white/5 text-center">
                <div className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">人员限制</div>
                <div className="text-lg text-slate-300 font-mono">最多 {nextLevelData.maxWorkers} 人</div>
              </div>
            </div>

            <div>
               <h4 className="text-sm font-medium text-slate-300 mb-3 border-b border-white/10 pb-2">升级要求</h4>
               
               {!meetsOutpostReq && (
                 <div className="mb-3 flex justify-between items-center p-3 border border-red-500/20 bg-red-950/20 rounded">
                   <div className="text-sm text-red-400">在此据点建造此级别设施，首领要求据点等级必须达到 { {1: '房屋', 2: '哨站', 3: '村庄', 4: '村庄', 5: '城镇'}[outpostLvlReq] || `Lv.${outpostLvlReq}` }</div>
                   <Shield size={16} className="text-red-900 shrink-0" />
                 </div>
               )}

               {nextLevelData.upgradeCost ? (
                 <div className="space-y-2">
                   {Object.entries(nextLevelData.upgradeCost).map(([res, cost]) => {
                     const current = state.resources[res] || 0;
                     const isEnough = testMode || current >= cost;
                     return (
                       <div key={res} className="flex justify-between items-center p-3 border border-white/5 bg-black/40 rounded">
                         <div className="text-sm text-slate-300">{res}</div>
                         <div className="flex items-center space-x-3">
                           <span className="text-xs text-slate-500 w-16 text-right">库: <span className="font-mono">{current}</span></span>
                           <span className={`text-sm font-mono w-12 text-right ${isEnough ? 'text-emerald-400' : 'text-red-400'}`}>/{cost}</span>
                           {isEnough ? <Check size={16} className="text-emerald-500 shrink-0" /> : <Shield size={16} className="text-red-900 shrink-0" />}
                         </div>
                       </div>
                     );
                   })}
                 </div>
               ) : (
                 <div className="p-4 bg-white/5 border border-white/10 text-slate-400 text-sm rounded">无需任何材料即可升级。</div>
               )}
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end space-x-3">
              <button 
                onClick={() => setModalView('details')}
                className="px-6 py-2 rounded text-sm text-slate-300 hover:text-white transition-colors"
              >
                取消规划
              </button>
              {(() => {
                const upgradeCost = nextLevelData.upgradeCost;
                const canUpgrade = meetsOutpostReq && (testMode || !upgradeCost || Object.entries(upgradeCost).every(([res, cost]) => (state.resources[res] || 0) >= cost));
                return (
                  <button 
                    disabled={!canUpgrade}
                    onClick={() => {
                       onUpgrade(selectedFacility.id, upgradeCost);
                       setModalView('details');
                    }}
                    className={`px-6 py-2 rounded shadow-[0_0_15px_rgba(217,119,6,0.2)] transition-colors text-sm tracking-widest font-medium ${
                       canUpgrade ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    确认开始升级
                  </button>
                )
              })()}
            </div>
          </div>
          );
        })()}

        {selectedFacility && selectedBp && selectedLevel && modalView === 'assign' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-slate-300 pb-2 border-b border-white/10 flex justify-between">
                  <span>待命人员 (Idle/Other)</span>
                  <span className="text-slate-500">{currentOutpostEmployees.filter(e => getEmpFacilityId(e.id) !== selectedFacility.id).length}人</span>
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {currentOutpostEmployees.filter(e => getEmpFacilityId(e.id) !== selectedFacility.id).map(emp => {
                    const isFull = currentOutpostEmployees.filter(e => getEmpFacilityId(e.id) === selectedFacility.id).length >= selectedLevel.maxWorkers;
                    return (
                    <div key={emp.id} className="p-3 bg-black/40 border border-white/5 rounded flex justify-between items-center group hover:border-amber-500/30 transition-colors">
                      <div>
                        <div className="text-sm text-slate-200">{emp.name}</div>
                        <div className="text-xs text-amber-600/70">{emp.role} / {emp.race}</div>
                      </div>
                      <button 
                        disabled={isFull}
                        onClick={() => setLocalAssignments(prev => ({...prev, [emp.id]: selectedFacility.id}))}
                        className={`text-xs px-3 py-1.5 rounded transition-colors ${
                          isFull 
                           ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                           : 'bg-white/5 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400'
                        }`}
                      >
                        {isFull ? '编制已满' : '调配入驻'}
                      </button>
                    </div>
                  )})}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-slate-300 pb-2 border-b border-white/10 flex justify-between">
                  <span>当前部署 (Assigned)</span>
                  <span className="text-slate-500">{currentOutpostEmployees.filter(e => getEmpFacilityId(e.id) === selectedFacility.id).length}/{selectedLevel.maxWorkers}</span>
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {currentOutpostEmployees.filter(e => getEmpFacilityId(e.id) === selectedFacility.id).map(emp => (
                    <div key={emp.id} className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded flex justify-between items-center group hover:border-red-900/50 transition-colors">
                      <div>
                        <div className="text-sm text-emerald-400">{emp.name}</div>
                        <div className="text-xs text-emerald-600/70">{emp.role} / {emp.race}</div>
                      </div>
                      <button 
                        onClick={() => setLocalAssignments(prev => ({...prev, [emp.id]: undefined}))}
                        className="text-xs bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 px-3 py-1.5 rounded transition-colors border border-transparent hover:border-red-500/50"
                      >
                        撤销
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end space-x-3">
              <button 
                onClick={() => setModalView('details')}
                className="px-6 py-2 rounded text-sm text-slate-300 hover:text-white transition-colors"
              >
                取消安排
              </button>
              <button 
                onClick={() => {
                  if (Object.keys(localAssignments).length > 0) {
                    onAssignMultiple(localAssignments);
                  }
                  setModalView('details');
                }}
                className="px-6 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white transition-colors text-sm tracking-widest font-medium shadow-[0_0_15px_rgba(217,119,6,0.3)]"
              >
                确认部署变更
              </button>
            </div>
          </div>
        )}

        {/* 建设新蓝图视图 */}
        {modalView === 'build' && (
          <div className="space-y-6">
            <p className="text-sm text-slate-400 mb-2">浏览古代科技蓝图，为基地增设新的区块。前提是你拥有足够的材料和研究水平。</p>
            
            {/* 独立蓝图分类栏 */}
            <div className="flex flex-wrap gap-2 pb-3 mb-1 border-b border-white/5">
              <button 
                onClick={() => setBuildCategoryFilter(null)}
                className={`px-3 py-1.5 text-xs rounded transition-colors ${!buildCategoryFilter ? 'bg-amber-600 text-white font-medium shadow' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
              >
                全部蓝图
              </button>
              {['防御', '生产', '锻造', '基建', '娱乐', '囚禁'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setBuildCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-xs rounded transition-colors border border-transparent ${buildCategoryFilter === cat ? 'bg-amber-600 text-white font-medium shadow' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {FACILITY_BLUEPRINTS
                .filter(bp => !buildCategoryFilter || bp.category === buildCategoryFilter)
                .map(bp => {
                const Icon = IconMap[bp.icon] || Settings;
                const targetLvl = buildLevels[bp.id] || 1;
                const maxLvl = Object.keys(bp.levels).length;
                const targetLevelData = bp.levels[targetLvl];
                
                // Calculate cumulative cost up to targetLvl
                const cumulativeCost: Record<string, number> = {};
                for (let i = 1; i <= targetLvl; i++) {
                  const c = bp.levels[i].upgradeCost;
                  if (c) {
                    for (const [res, amt] of Object.entries(c)) {
                      cumulativeCost[res] = (cumulativeCost[res] || 0) + amt;
                    }
                  }
                }

                return (
                  <div key={bp.id} className="p-4 border border-white/10 bg-white/5 rounded-xl hover:bg-amber-500/5 hover:border-amber-500/30 transition-colors group flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-lg font-medium text-slate-200">{targetLevelData.name}</h4>
                        <Icon size={18} className="text-amber-500/60" />
                      </div>
                      <div className="text-xs flex justify-between items-center mb-2">
                        <span className="text-amber-500/60">{bp.category}</span>
                        <div className="flex space-x-1">
                          {[...Array(maxLvl)].map((_, i) => (
                            <button
                              key={i}
                              onClick={(e) => {
                                e.stopPropagation();
                                setBuildLevels(prev => ({ ...prev, [bp.id]: i + 1 }));
                              }}
                              className={`w-6 h-6 rounded text-xs flex items-center justify-center transition-colors ${i + 1 === targetLvl ? 'bg-amber-500 text-black font-bold' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mb-4 line-clamp-2 min-h-[32px]">{targetLevelData.description}</p>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500 mb-2 border-t border-white/5 pt-2">累积所需材料 (1至{targetLvl}级):</div>
                      {Object.keys(cumulativeCost).length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {Object.entries(cumulativeCost).map(([res, cost]) => {
                             const has = testMode || (state.resources[res] || 0) >= cost;
                             return (
                               <div key={res} className={`text-[10px] px-2 py-1 rounded font-mono ${has ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/20' : 'bg-red-900/30 text-red-400 border border-red-500/20'}`}>
                                 {res} {cost}
                               </div>
                             );
                          })}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500 mb-4">无需材料</div>
                      )}
                      
                      {(() => {
                        const requiredOutpostLvl = targetLevelData.requiredOutpostLevel || 1;
                        const meetsOutpostReq = outpostLevel >= requiredOutpostLvl;
                        const canBuild = meetsOutpostReq && (testMode || Object.entries(cumulativeCost).every(([res, cost]) => (state.resources[res] || 0) >= cost));
                        return (
                          <div className="flex flex-col gap-2">
                            {!meetsOutpostReq && (
                              <div className="text-[10px] text-red-400 mb-1">
                                需要据点达到Lv.{requiredOutpostLvl} { {1: '房屋', 2: '哨站', 3: '村庄', 4: '村庄', 5: '城镇'}[requiredOutpostLvl] || '城镇' }
                              </div>
                            )}
                            <button 
                              disabled={!canBuild}
                              onClick={() => {
                                  onBuild(bp.id, Object.keys(cumulativeCost).length > 0 ? cumulativeCost : undefined, targetLvl);
                                  setModalView('details');
                              }}
                              className={`w-full py-2 rounded text-xs tracking-widest font-medium transition-colors ${
                                canBuild 
                                  ? 'bg-white/5 border border-white/10 hover:bg-amber-600/20 hover:text-amber-400 hover:border-amber-500/30 text-slate-300' 
                                  : 'bg-red-950/20 text-red-500/50 border border-red-900/30 cursor-not-allowed'
                              }`}
                            >
                              {canBuild ? `直接建造 等级 ${targetLvl}` : (!meetsOutpostReq ? '据点等级不足' : '材料不足')}
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </Modal>
    </div>
  );
}
