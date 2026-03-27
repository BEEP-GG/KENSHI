import * as Icons from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';
import { SCENARIOS } from '../data';
import { CharacterData } from '../types';

interface StepScenarioProps {
  data: CharacterData;
  updateData: (updates: Partial<CharacterData>) => void;
  onNext: () => void;
}

export const StepScenario: React.FC<StepScenarioProps> = ({ data, updateData, onNext }) => {
  const scenariosPerPage = 6;
  const visibleScenarios = React.useMemo(
    () => SCENARIOS.filter(scenario => !(scenario as { hidden?: boolean }).hidden),
    [],
  );
  const totalPages = Math.max(1, Math.ceil(visibleScenarios.length / scenariosPerPage));
  const [currentPage, setCurrentPage] = React.useState(1);
  const gridRef = React.useRef<HTMLDivElement | null>(null);
  const [gridMinHeight, setGridMinHeight] = React.useState<number | null>(null);

  const SCENARIO_WB_UIDS: Record<string, number> = {
    wanderer: 558,
    holy_sword: 559,
    rock_bottom: 560,
    merchant: 561,
    officer_son: 562,
    slave: 574,
    male_slave: 563,
    cannibal_hunter: 564,
    pirate_heir: 565,
    cannibal_unifier: 566,
    brotherhood_prisoner: 567,
    freedom_seekers: 568,
    mongrel_wanderer: 569,
    holy_commoner: 570,
    dark_daughter: 571,
    kral_choice: 572,
    fish_island_refugee: 573,
    bast_stray: 549,
  };
  const ALL_SCENARIO_UIDS = Object.values(SCENARIO_WB_UIDS);

  const applyScenarioWorldbook = async (scenarioId: string) => {
    const uid = SCENARIO_WB_UIDS[scenarioId];
    if (!uid) return;
    try {
      const charWorldbook = getCharWorldbookNames('current');
      const wbName = charWorldbook.primary;
      if (!wbName) return;
      await updateWorldbookWith(wbName, entries =>
        entries.map(entry => {
          if (ALL_SCENARIO_UIDS.includes(entry.uid)) {
            return { ...entry, enabled: entry.uid === uid };
          }
          return entry;
        }),
      );
    } catch (error) {
      console.error('切换剧本世界书条目失败', error);
    }
  };

  React.useEffect(() => {
    if (!data.scenario && visibleScenarios.length > 0) {
      updateData({ scenario: visibleScenarios[0].id });
      return;
    }
    if (data.scenario) {
      applyScenarioWorldbook(data.scenario);
    }
  }, [data.scenario, updateData, visibleScenarios]);

  const pagedScenarios = React.useMemo(() => {
    const start = (currentPage - 1) * scenariosPerPage;
    return visibleScenarios.slice(start, start + scenariosPerPage);
  }, [currentPage, visibleScenarios]);

  React.useLayoutEffect(() => {
    if (!gridRef.current) return;
    setGridMinHeight(prev => (prev ? Math.max(prev, gridRef.current!.offsetHeight) : gridRef.current!.offsetHeight));
  }, [currentPage, totalPages, pagedScenarios.length]);

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="h-full flex flex-col">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <h2 className="text-4xl font-serif text-white mb-2 tracking-wider">选择你的开局</h2>
        <p className="text-white/60 font-sans max-w-2xl mx-auto">
          每一个传奇都有一个卑微（或悲惨）的开始。你将如何踏入这个残酷的世界？
        </p>
      </motion.div>

      <div
        ref={gridRef}
        style={gridMinHeight ? { minHeight: `${gridMinHeight}px` } : undefined}
        className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8"
      >
        {pagedScenarios.map((scenario, index) => {
          const Icon = (Icons as any)[scenario.icon] || Icons.HelpCircle;
          const isSelected = data.scenario === scenario.id;

          return (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => {
                updateData({ scenario: scenario.id, region: '', town: '' });
                applyScenarioWorldbook(scenario.id);
              }}
              className={`
                relative group cursor-pointer p-6 rounded-xl border transition-all duration-300
                ${
                  isSelected
                    ? 'bg-white/10 border-[#C2B280] shadow-[0_0_30px_rgba(194,178,128,0.2)]'
                    : 'bg-black/40 border-white/10 hover:border-white/30 hover:bg-white/5'
                }
              `}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`p-3 rounded-lg ${isSelected ? 'bg-[#C2B280] text-black' : 'bg-white/5 text-white/70'}`}
                >
                  <Icon size={24} />
                </div>
                <span
                  className={`text-xs uppercase tracking-widest px-2 py-1 rounded border ${
                    scenario.difficulty === '极难'
                      ? 'border-red-500/50 text-red-400'
                      : scenario.difficulty === '困难'
                        ? 'border-orange-500/50 text-orange-400'
                        : 'border-green-500/50 text-green-400'
                  }`}
                >
                  {scenario.difficulty}
                </span>
              </div>

              <h3 className={`text-xl font-serif font-bold mb-2 ${isSelected ? 'text-[#C2B280]' : 'text-white'}`}>
                {scenario.title}
              </h3>
              <p className="text-sm text-white/60 leading-relaxed mb-4">{scenario.description}</p>

              <div className="space-y-2 border-t border-white/10 pt-3">
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">初始资金</span>
                  <span className="text-[#C2B280] font-mono">{scenario.money} c.</span>
                </div>
                <div className="text-xs">
                  <span className="text-white/40 block mb-1">初始装备</span>
                  <div className="flex flex-wrap gap-1">
                    {scenario.equipment.map((item, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-white/5 rounded text-white/70 border border-white/5">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {((scenario as any).alliedFactions?.length || (scenario as any).hostileFactions?.length) && (
                <div className="mt-3 space-y-1 text-xs">
                  {(scenario as any).alliedFactions?.length > 0 && (
                    <div className="text-emerald-300/90">友好派系：{(scenario as any).alliedFactions.join('、')}</div>
                  )}
                  {(scenario as any).hostileFactions?.length > 0 && (
                    <div className="text-red-300/90">敌对派系：{(scenario as any).hostileFactions.join('、')}</div>
                  )}
                </div>
              )}

              {/* Selection Indicator */}
              {isSelected && (
                <motion.div
                  layoutId="selection-ring"
                  className="absolute inset-0 border-2 border-[#C2B280] rounded-xl pointer-events-none"
                />
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded border border-white/20 text-white/70 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10"
        >
          上一页
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-1 rounded border transition-colors ${
              page === currentPage
                ? 'border-[#C2B280] bg-[#C2B280]/15 text-[#C2B280]'
                : 'border-white/20 text-white/70 hover:bg-white/10'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded border border-white/20 text-white/70 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10"
        >
          下一页
        </button>
      </div>
    </div>
  );
};
