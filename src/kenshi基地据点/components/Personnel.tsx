import { GameState } from '../types';
import { Users, Briefcase, Zap, AlertTriangle, ArrowUpDown, Filter } from 'lucide-react';
import { useState } from 'react';
import Modal from './Modal';
import { FACILITY_BLUEPRINTS } from '../data';

export default function Personnel({ state }: { state: GameState }) {
  const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
  const [filterMode, setFilterMode] = useState<'current' | 'all'>('current');
  
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDesc, setSortDesc] = useState<boolean>(false);
  const [raceFilter, setRaceFilter] = useState<string>('all');

  // 提取独特的种族列表，非预设种族归为“其他”
  const presetRaces = ['蜂巢族工蜂', '骨人', '沙克族', '焦土之子', '绿原之子'];
  const allRacesInState = Array.from(new Set(state.employees.map(e => presetRaces.includes(e.race) ? e.race : '其他')));
  const availableRaces = ['all', ...presetRaces.filter(r => state.employees.some(e => e.race === r)), '其他'];

  const STATS_LIST = ['力量', '敏捷', '感知', '体质', '智力', '意志', '魅力'];
  const [selectedStatCol, setSelectedStatCol] = useState('力量');

  let filteredEmployees = filterMode === 'current' 
    ? state.employees.filter(e => e.outpostId === state.currentOutpostId)
    : state.employees;

  if (raceFilter !== 'all') {
    filteredEmployees = filteredEmployees.filter(e => {
      if (raceFilter === '其他') {
        return !presetRaces.includes(e.race);
      }
      return e.race === raceFilter;
    });
  }

  filteredEmployees = [...filteredEmployees].sort((a, b) => {
    let valA, valB;
    if (sortBy === 'name') {
      valA = a.name; valB = b.name;
    } else if (sortBy === 'hp') {
      valA = a.hp; valB = b.hp;
    } else {
      valA = a.stats?.[sortBy] || 0;
      valB = b.stats?.[sortBy] || 0;
    }
    
    if (valA < valB) return sortDesc ? 1 : -1;
    if (valA > valB) return sortDesc ? -1 : 1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(field);
      setSortDesc(true); // default to descending for stats
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end border-b border-white/5 pb-6 gap-4">
        <div>
          <h2 className="text-3xl font-light tracking-wide text-slate-100 flex items-center">
            <Users className="mr-3 text-amber-500" size={28} />
            人员编制
          </h2>
          <p className="text-slate-400 mt-2 text-sm tracking-wider">查看、指派与管理各据点的生存者及劳工状态。</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 shrink-0 h-10 items-center px-1">
            <Filter size={14} className="text-slate-500 mx-2" />
            <select 
              value={raceFilter}
              onChange={(e) => setRaceFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-300 outline-none border-none cursor-pointer appearance-none pr-4"
            >
              <option value="all" className="bg-slate-900">所有种族</option>
              {availableRaces.filter(r => r !== 'all').map(r => (
                <option key={r} value={r} className="bg-slate-900">{r}</option>
              ))}
            </select>
          </div>
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 shrink-0">
            <button 
              onClick={() => setFilterMode('current')}
              className={`px-4 py-1.5 text-xs font-medium tracking-widest rounded-md transition-all ${
                filterMode === 'current' 
                  ? 'bg-amber-600 text-white shadow-lg' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              当前据点
            </button>
            <button 
              onClick={() => setFilterMode('all')}
              className={`px-4 py-1.5 text-xs font-medium tracking-widest rounded-md transition-all ${
                filterMode === 'all' 
                  ? 'bg-amber-600 text-white shadow-lg' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              全域列表
            </button>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden shadow-xl shadow-black/50 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-widest text-slate-400">
              <th className="px-6 py-4 font-medium cursor-pointer hover:text-slate-200" onClick={() => handleSort('name')}>
                <div className="flex items-center">名字 <ArrowUpDown size={12} className="ml-1 opacity-50" /></div>
              </th>
              <th className="px-6 py-4 font-medium min-w-[140px]">
                <div className="flex items-center space-x-2">
                  <select 
                    value={selectedStatCol}
                    onChange={(e) => {
                      setSelectedStatCol(e.target.value);
                      if (sortBy !== e.target.value) {
                         setSortBy(e.target.value);
                         setSortDesc(true);
                      }
                    }}
                    className="bg-slate-800 text-amber-500 text-xs px-2 py-1 rounded outline-none border border-amber-500/20"
                  >
                    {STATS_LIST.map(stat => <option key={stat} value={stat}>{stat}</option>)}
                  </select>
                  <ArrowUpDown 
                    size={12} 
                    className={`cursor-pointer transition-colors ${sortBy === selectedStatCol ? 'text-amber-500 opacity-100' : 'opacity-40 hover:opacity-100'}`} 
                    onClick={() => handleSort(selectedStatCol)} 
                  />
                </div>
              </th>
              <th className="px-6 py-4 font-medium transition-colors cursor-pointer hover:text-slate-200" onClick={() => handleSort('hp')}>
                 <div className="flex items-center" title="按血量排序">身体状况血量 <ArrowUpDown size={12} className="ml-1 opacity-50" /></div>
              </th>
              <th className="px-6 py-4 font-medium">工作</th>
              <th className="px-6 py-4 font-medium">据点/驻扎地</th>
              <th className="px-6 py-4 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredEmployees.map(emp => {
               const workingFac = emp.facilityId ? state.facilities.find(f => f.id === emp.facilityId) : null;
               const workingBp = workingFac ? FACILITY_BLUEPRINTS.find(b => b.id === workingFac.blueprintId) : null;
               const facName = workingBp && workingFac ? workingBp.levels[workingFac.level].name : '未知区域';
               const outpost = state.outposts.find(o => o.id === emp.outpostId);
               
               return (
                <tr key={emp.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-200">{emp.name}</div>
                    <div className="text-[10px] text-amber-500/70 mt-1">{emp.race}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-center font-bold text-amber-500 bg-amber-500/5">
                    {emp.stats?.[selectedStatCol as keyof typeof emp.stats] || 0}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3 w-40">
                      <div className="h-1.5 w-20 bg-slate-800 rounded-full overflow-hidden shrink-0">
                        <div 
                          className={`h-full ${emp.hp / emp.maxHp > 0.5 ? 'bg-emerald-500' : 'bg-red-500'}`} 
                          style={{ width: `${Math.min((emp.hp / emp.maxHp) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-slate-400 w-14 text-right shrink-0">{emp.hp}/{emp.maxHp}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 text-xs">
                      {emp.status === 'working' ? (
                        <div className="flex items-center space-x-2 text-emerald-400/80 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-900/50 max-w-[120px] truncate" title={`指派至 ${facName}`}>
                          <Zap size={14} className="shrink-0" />
                          <span className="truncate">指派至 {facName}</span>
                        </div>
                      ) : emp.status === 'idle' ? (
                        <div className="flex items-center space-x-2 text-amber-500/80 bg-amber-950/30 px-2 py-1 rounded border border-amber-900/50">
                          <Users size={14} />
                          <span>待命中</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-red-400/80 bg-red-950/30 px-2 py-1 rounded border border-red-900/50">
                          <AlertTriangle size={14} />
                          <span>重伤卧床</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-500 font-mono italic">{outpost?.name || '位置未知'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedPerson(emp)}
                      className="text-xs text-amber-500 border border-amber-500/30 px-3 py-1.5 rounded hover:bg-amber-500 hover:text-black transition-colors"
                    >
                      详情履历
                    </button>
                  </td>
                </tr>
              )
            })}
            
            {filteredEmployees.length === 0 && (
               <tr>
                 <td colSpan={8} className="px-6 py-8 text-center text-slate-500 text-sm">
                   未找到符合条件的人员。
                 </td>
               </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={!!selectedPerson}
        onClose={() => setSelectedPerson(null)}
        title="生存者档桉"
        icon={<Users size={20} />}
      >
        {selectedPerson && (
          <div className="space-y-6">
            <div className="flex items-start space-x-6">
              <div className="w-24 h-24 bg-slate-900 border border-slate-700/50 rounded-lg flex items-center justify-center relative overflow-hidden flex-shrink-0">
                <Users size={40} className="text-slate-600" />
                <div className="absolute inset-0 scanline opacity-30"></div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl text-slate-100 font-medium mb-1">{selectedPerson.name}</h3>
                <div className="text-amber-500 text-sm mb-3 tracking-widest">{selectedPerson.race}</div>
                <div className="flex gap-2 flex-wrap">
                  {selectedPerson.traits.map((t: string) => (
                    <span key={t} className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded text-slate-300">
                      特征: {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded bg-black/40 border border-white/5 flex flex-col justify-center">
                  <div className="text-xs text-slate-500 mb-2">身体状况 (HP)</div>
                  <div className="flex items-center space-x-3">
                    <div className="text-xl font-mono text-emerald-400 w-20">
                      {selectedPerson.hp}/{selectedPerson.maxHp}
                    </div>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500" 
                        style={{ width: `${Math.max(0, Math.min(100, (selectedPerson.hp / selectedPerson.maxHp) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded bg-black/40 border border-white/5">
                  <div className="text-xs text-slate-500 mb-2">个人能力测定 (七维属性)</div>
                  <div className="grid grid-cols-4 gap-y-2 gap-x-2">
                    {Object.entries(selectedPerson.stats || {}).map(([key, value]) => (
                      <div key={key} className="flex flex-col text-center bg-white/5 rounded py-1 px-0.5">
                        <span className="text-[10px] text-slate-400">{key}</span>
                        <span className="text-sm font-mono text-amber-500">{value as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button 
                onClick={() => setSelectedPerson(null)}
                className="px-6 py-2 rounded text-sm text-slate-300 hover:text-white transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
