import { ArrowUpCircle, ChevronRight, Coins, Edit3, Factory, MapPin, Shield, Users } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState } from 'react';
import { FACILITY_BLUEPRINTS } from '../data';
import { GameState, Outpost } from '../types';
import Modal from './Modal';

export default function Outposts({
  state,
  onSelectOutpost,
  onUpdateOutpost,
  onCreateOutpost,
  testMode,
}: {
  state: GameState;
  onSelectOutpost: (id: string) => void;
  onUpdateOutpost?: (id: string, updates: any, cost?: Record<string, number>) => void;
  onCreateOutpost?: (name: string, location: string) => void;
  testMode?: boolean;
}) {
  const [renamingOutpost, setRenamingOutpost] = useState<Outpost | null>(null);
  const [upgradingOutpost, setUpgradingOutpost] = useState<Outpost | null>(null);
  const [newName, setNewName] = useState('');
  const [isCreatingOutpost, setIsCreatingOutpost] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createLocation, setCreateLocation] = useState('');

  const handleRenameSubmit = () => {
    if (renamingOutpost && newName.trim() && onUpdateOutpost) {
      onUpdateOutpost(renamingOutpost.id, { name: newName.trim() });
      setRenamingOutpost(null);
    }
  };

  const tryUpgradeOutpost = (outpost: Outpost, e: React.MouseEvent) => {
    e.stopPropagation();
    setUpgradingOutpost(outpost);
  };

  const applyUpgrade = () => {
    if (!upgradingOutpost || !onUpdateOutpost) return;

    const currentLevel = upgradingOutpost.level || 1;
    if (currentLevel >= 5) return;

    let cost = 0;
    if (currentLevel === 1) {
      cost = 5;
    } else if (currentLevel === 2) {
      cost = 8;
    } else if (currentLevel === 3) {
      cost = 12;
    } else if (currentLevel === 4) {
      cost = 20;
    }

    onUpdateOutpost(upgradingOutpost.id, { level: currentLevel + 1 }, { 古代科技书: cost });
    setUpgradingOutpost(null);
  };

  return (
    <div className="p-8">
      <div className="mb-8 border-b border-white/5 pb-6">
        <h2 className="text-3xl font-light text-slate-100 tracking-wider">资产与据点管理</h2>
        <p className="text-slate-500 text-sm mt-1">监控所有领地资产的运行状态与资源分配</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {state.outposts.map(outpost => {
          const isActive = outpost.id === state.currentOutpostId;
          const outpostFacilities = state.facilities.filter(f => f.outpostId === outpost.id);
          const outpostEmployees = state.employees.filter(e => e.outpostId === outpost.id);
          const currentLevel = outpost.level || 1;

          const outpostSafety = outpostFacilities.reduce((acc, fac) => {
            if (fac.status !== 'active') return acc;
            const bp = FACILITY_BLUEPRINTS.find(b => b.id === fac.blueprintId);
            if (!bp) return acc;
            const levelData = bp.levels[fac.level];
            if (
              levelData &&
              typeof levelData.productionRate === 'string' &&
              levelData.productionRate.includes('安全度')
            ) {
              return acc + (parseInt(levelData.productionRate) || 0);
            }
            return acc;
          }, 0);

          const outpostIncome = outpostFacilities.reduce((acc, fac) => {
            if (fac.status !== 'active') return acc;
            const bp = FACILITY_BLUEPRINTS.find(b => b.id === fac.blueprintId);
            if (!bp) return acc;
            const levelData = bp.levels[fac.level];
            if (levelData && levelData.productionType === 'Cats/天') {
              const rate =
                typeof levelData.productionRate === 'number'
                  ? levelData.productionRate
                  : parseInt(levelData.productionRate.toString()) || 0;
              return acc + rate;
            }
            return acc;
          }, 0);

          return (
            <motion.div
              key={outpost.id}
              whileHover={{ scale: 1.01 }}
              className={`glass-panel p-6 border transition-all cursor-pointer group flex flex-col ${
                isActive ? 'border-amber-500/50 ring-1 ring-amber-500/20' : 'border-white/10 hover:border-white/20'
              }`}
              onClick={() => onSelectOutpost(outpost.id)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1 text-slate-500">
                    <MapPin size={16} className={isActive ? 'text-amber-500' : ''} />
                    <span className="text-xs font-mono tracking-widest">{outpost.location}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-500 border border-amber-500/20 shadow-[0_0_10px_rgba(217,119,6,0.1)]">
                      Lv.{currentLevel}{' '}
                      {{ 1: '房屋', 2: '哨站', 3: '村庄', 4: '村庄', 5: '城镇' }[currentLevel] || '未知'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <h3 className="text-xl text-slate-100 font-medium group-hover:text-amber-400 transition-colors mr-2">
                      {outpost.name}
                    </h3>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setRenamingOutpost(outpost);
                        setNewName(outpost.name);
                      }}
                      className="text-slate-500 hover:text-amber-400 pb-1"
                      title="重命名据点"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                </div>

                {currentLevel < 5 && (
                  <button
                    onClick={e => tryUpgradeOutpost(outpost, e)}
                    className="flex items-center space-x-1 px-3 py-1 bg-black/40 border border-white/10 hover:border-amber-500/50 hover:text-amber-400 text-slate-400 text-xs rounded transition-colors"
                  >
                    <ArrowUpCircle size={14} />
                    <span>升级</span>
                  </button>
                )}
              </div>

              <p className="text-sm text-slate-400 mb-6 line-clamp-2 flex-grow">{outpost.description}</p>

              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                  <div className="flex items-center space-x-2 text-slate-500 mb-1">
                    <Factory size={14} />
                    <span className="text-xs">设施</span>
                  </div>
                  <div className="text-lg font-mono text-slate-200">{outpostFacilities.length}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                  <div className="flex items-center space-x-2 text-slate-500 mb-1">
                    <Users size={14} />
                    <span className="text-xs">常驻</span>
                  </div>
                  <div className="text-lg font-mono text-slate-200">{outpostEmployees.length}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                  <div className="flex items-center space-x-2 text-slate-500 mb-1">
                    <Coins size={14} />
                    <span className="text-xs">收益</span>
                  </div>
                  <div className="text-lg font-mono text-amber-500">+{outpostIncome}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                  <div className="flex items-center space-x-2 text-slate-500 mb-1">
                    <Shield size={14} />
                    <span className="text-xs">安全度</span>
                  </div>
                  <div className="text-lg font-mono text-emerald-400">{outpostSafety}</div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <span
                  className={`text-xs font-medium ${isActive ? 'text-amber-500' : 'text-slate-500 group-hover:text-slate-300'}`}
                >
                  {isActive ? '当前选中的据点' : '点击切换至此据点'}
                </span>
                <ChevronRight size={16} className={isActive ? 'text-amber-500' : 'text-slate-600'} />
              </div>
            </motion.div>
          );
        })}

        <div
          onClick={() => {
            setCreateName('新避难所');
            setCreateLocation('大沙漠');
            setIsCreatingOutpost(true);
          }}
          className="border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center group hover:border-amber-500/40 hover:bg-amber-500/5 transition-all cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-0.5"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-amber-500/15 transition-all">
            <MapPin size={24} className="text-slate-400 group-hover:text-amber-500 animate-pulse" />
          </div>
          <h3 className="text-slate-300 font-medium mb-1 group-hover:text-amber-400 transition-colors">建立新据点</h3>
          <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
            消耗: 3,000 开币 与 10 金属材料
          </p>
        </div>
      </div>

      <Modal
        isOpen={isCreatingOutpost}
        onClose={() => setIsCreatingOutpost(false)}
        title="建立新据点"
        icon={<MapPin size={20} />}
      >
        <div className="space-y-5">
          <div className="p-4 rounded-lg bg-black/40 border border-white/5 space-y-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">建造成本核算</h4>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div
                className={`p-2 rounded flex justify-between items-center text-xs ${testMode || state.squadCats >= 3000 ? 'bg-emerald-950/20 text-emerald-400' : 'bg-red-950/20 text-red-400'}`}
              >
                <span>小队资金 (cats)</span>
                <span className="font-mono">3,000 / {state.squadCats.toLocaleString()}</span>
              </div>
              <div
                className={`p-2 rounded flex justify-between items-center text-xs ${testMode || (state.resources['金属材料'] || 0) >= 10 ? 'bg-emerald-950/20 text-emerald-400' : 'bg-red-950/20 text-red-400'}`}
              >
                <span>金属材料</span>
                <span className="font-mono">10 / {state.resources['金属材料'] || 0}</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic pt-1 text-center">
              新建据点初始建筑登记为：Lv.1 房屋。最高统御阶层称为【老大】。
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-medium text-slate-400">基地初始名</label>
              <input
                type="text"
                value={createName}
                onChange={e => setCreateName(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-lg p-3 text-slate-200 text-sm focus:outline-none focus:border-amber-500/50"
                placeholder="例如：新希望小屋"
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-medium text-slate-400">选择落脚地</label>
              <input
                type="text"
                value={createLocation}
                onChange={e => setCreateLocation(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-lg p-3 text-slate-200 text-sm focus:outline-none focus:border-amber-500/50"
                placeholder="例如：闪击之野"
              />
              <div className="flex gap-2 pt-1">
                {['极度荒原', '闪击之野', '恒镇郊外', '无光沼泽', '大沙漠'].map(loc => (
                  <button
                    key={loc}
                    onClick={() => setCreateLocation(loc)}
                    className="text-[10px] text-amber-500/70 hover:text-amber-400 border border-amber-500/15 hover:border-amber-500/40 px-2 py-0.5 rounded transition-all font-mono"
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-5 border-t border-white/10">
            <button
              onClick={() => setIsCreatingOutpost(false)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              disabled={
                !(testMode || (state.squadCats >= 3000 && (state.resources['金属材料'] || 0) >= 10)) ||
                !createName.trim() ||
                !createLocation.trim()
              }
              onClick={() => {
                if (onCreateOutpost) {
                  onCreateOutpost(createName.trim(), createLocation.trim());
                }
                setIsCreatingOutpost(false);
              }}
              className={`px-5 py-2 rounded text-xs font-semibold tracking-wider transition-colors ${
                (testMode || (state.squadCats >= 3000 && (state.resources['金属材料'] || 0) >= 10)) &&
                createName.trim() &&
                createLocation.trim()
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_15px_rgba(217,119,6,0.2)]'
                  : 'bg-red-950/20 border border-red-500/10 text-red-300/40 cursor-not-allowed'
              }`}
            >
              {testMode || (state.squadCats >= 3000 && (state.resources['金属材料'] || 0) >= 10)
                ? '确认执照与组建'
                : '资源不足，无法组建'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!renamingOutpost}
        onClose={() => setRenamingOutpost(null)}
        title="重命名据点"
        icon={<Edit3 size={20} />}
      >
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label className="text-sm text-slate-400">据点名称</label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-amber-500/50"
              autoFocus
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
            <button
              onClick={() => setRenamingOutpost(null)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleRenameSubmit}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-sm transition-colors"
            >
              确认修改
            </button>
          </div>
        </div>
      </Modal>

      {upgradingOutpost &&
        (() => {
          const currentLevel = upgradingOutpost.level || 1;
          const nextLevel = currentLevel + 1;

          let cost = 0;
          let reqFacilities = 0;
          let reqEnt = 0;
          if (currentLevel === 1) {
            cost = 5;
          } else if (currentLevel === 2) {
            cost = 8;
            reqFacilities = 4;
          } else if (currentLevel === 3) {
            cost = 12;
          } else if (currentLevel === 4) {
            cost = 20;
            reqFacilities = 7;
            reqEnt = 3;
          }

          const outpostFacilities = state.facilities.filter(f => f.outpostId === upgradingOutpost.id);
          const entFacilities = outpostFacilities.filter(f => {
            const bp = FACILITY_BLUEPRINTS.find(b => b.id === f.blueprintId);
            return bp?.category === '娱乐';
          });

          const hasCost = testMode || (state.resources['古代科技书'] || 0) >= cost;
          const hasFac = outpostFacilities.length >= reqFacilities;
          const hasEnt = entFacilities.length >= reqEnt;
          const canUpgrade = hasCost && hasFac && hasEnt;

          const unlockedBlueprints: string[] = [];
          FACILITY_BLUEPRINTS.forEach(bp => {
            Object.values(bp.levels).forEach(l => {
              if (l.requiredOutpostLevel === nextLevel) {
                unlockedBlueprints.push(l.name);
              }
            });
          });

          return (
            <Modal
              isOpen={true}
              onClose={() => setUpgradingOutpost(null)}
              title={`升级据点至 Lv.${nextLevel}`}
              icon={<ArrowUpCircle size={20} />}
            >
              <div className="space-y-4">
                <div className="bg-black/30 p-4 border border-white/10 rounded-lg">
                  <h4 className="text-sm font-medium text-amber-500 mb-2">解锁新内容</h4>
                  <ul className="text-xs text-slate-300 list-inside list-disc space-y-1">
                    {unlockedBlueprints.length > 0 ? (
                      unlockedBlueprints.map(name => <li key={name}>{name}</li>)
                    ) : (
                      <li className="text-slate-500">此级别无新蓝图解锁</li>
                    )}
                    {nextLevel === 2 && <li>据点名称变为 哨站</li>}
                    {nextLevel === 3 && <li>据点名称变为 村庄</li>}
                    {nextLevel === 5 && <li>据点名称变为 城镇</li>}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-300">升级要求</h4>

                  <div
                    className={`flex justify-between items-center p-2 rounded text-xs ${hasCost ? 'bg-emerald-900/20 text-emerald-400' : 'bg-red-900/20 text-red-500'}`}
                  >
                    <span>古代科技书</span>
                    <span>
                      x{cost} (当前: {state.resources['古代科技书'] || 0})
                    </span>
                  </div>

                  {reqFacilities > 0 && (
                    <div
                      className={`flex justify-between items-center p-2 rounded text-xs ${hasFac ? 'bg-emerald-900/20 text-emerald-400' : 'bg-red-900/20 text-red-500'}`}
                    >
                      <span>设施数量</span>
                      <span>
                        {reqFacilities} 个 (当前: {outpostFacilities.length})
                      </span>
                    </div>
                  )}

                  {reqEnt > 0 && (
                    <div
                      className={`flex justify-between items-center p-2 rounded text-xs ${hasEnt ? 'bg-emerald-900/20 text-emerald-400' : 'bg-red-900/20 text-red-500'}`}
                    >
                      <span>娱乐设施数量</span>
                      <span>
                        {reqEnt} 个 (当前: {entFacilities.length})
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => setUpgradingOutpost(null)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    取消
                  </button>
                  <button
                    disabled={!canUpgrade}
                    onClick={applyUpgrade}
                    className={`px-4 py-2 rounded text-sm transition-colors ${canUpgrade ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-red-900/50 text-red-200/50 cursor-not-allowed'}`}
                  >
                    {canUpgrade ? '确认升级' : '条件不足'}
                  </button>
                </div>
              </div>
            </Modal>
          );
        })()}
    </div>
  );
}
