import { Dna, Save, User } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';
import { RACES, SCENARIOS } from '../data';
import { CharacterData } from '../types';

interface StepRaceProps {
  data: CharacterData;
  updateData: (updates: Partial<CharacterData>) => void;
}

const UNKNOWN_DREAM_SCENARIO_ID = 'unknown_dream';
const UNKNOWN_DREAM_UID = 749;
const UNKNOWN_DREAM_CUSTOM_RACE_UID = 750;
const CUSTOM_RACE_ID = 'custom_race';

const buildCustomRaceWorldbookContent = (raceName: string, raceDescription: string) =>
  `这是对于【未知梦想】剧本的自定义种族：\n  -${raceName || '种族[写完替代]'}：${raceDescription || '介绍[写完替代]'}`;

export const StepRace: React.FC<StepRaceProps> = ({ data, updateData }) => {
  const selectedScenario = SCENARIOS.find(s => s.id === data.scenario) as
    | { allowedRaces?: string[]; allowedSubraces?: string[]; forbiddenRaces?: string[] }
    | undefined;

  const allowedRaceIds = selectedScenario?.allowedRaces;
  const allowedSubraceIds = selectedScenario?.allowedSubraces;
  const forbiddenRaceIds = selectedScenario?.forbiddenRaces ?? [];
  const scenarioForbiddenRaces =
    data.scenario === 'cannibal_unifier' || data.scenario === UNKNOWN_DREAM_SCENARIO_ID ? [] : ['cannibal'];

  const availableRaces = (allowedRaceIds ? RACES.filter(r => allowedRaceIds.includes(r.id)) : RACES)
    .filter(race => !(race as { hidden?: boolean }).hidden)
    .filter(race => !forbiddenRaceIds.includes(race.id))
    .filter(race => !scenarioForbiddenRaces.includes(race.id));

  const isUnknownDream = data.scenario === UNKNOWN_DREAM_SCENARIO_ID;
  const isCustomRaceSelected = data.race === CUSTOM_RACE_ID;
  const selectedRace = availableRaces.find(r => r.id === data.race) || availableRaces[0];
  const selectedSubrace = selectedRace?.subraces.find(subrace => subrace.id === data.subrace);

  const [isSavingCustomRace, setIsSavingCustomRace] = React.useState(false);
  const [customRaceSaved, setCustomRaceSaved] = React.useState(false);

  const updateCustomRace = (updates: Partial<CharacterData['customStart']>) => {
    updateData({
      customStart: {
        ...data.customStart,
        ...updates,
      },
    });
  };

  const getSubraceAttributeSummary = (text?: string) => {
    if (!text) return '';
    const matches = Array.from(text.matchAll(/(力量|敏捷|感知|体质|智力|魅力)\s*[+-]\s*\d+/g)).map(match =>
      match[0].replace(/\s+/g, ''),
    );
    return matches.join('、');
  };

  React.useEffect(() => {
    if (!data.race && availableRaces.length > 0) {
      const firstRace = availableRaces[0];
      updateData({ race: firstRace.id, subrace: firstRace.subraces[0]?.id ?? '' });
      return;
    }

    if (!isCustomRaceSelected && data.race && forbiddenRaceIds.includes(data.race) && availableRaces.length > 0) {
      const firstRace = availableRaces[0];
      updateData({ race: firstRace.id, subrace: firstRace.subraces[0]?.id ?? '' });
    }
  }, [data.race, availableRaces, forbiddenRaceIds, isCustomRaceSelected, updateData]);

  React.useEffect(() => {
    if (isCustomRaceSelected) return;
    if (selectedRace && !data.subrace && selectedRace.subraces.length > 0) {
      const availableSubraces = allowedSubraceIds
        ? selectedRace.subraces.filter(subrace => allowedSubraceIds.includes(subrace.id))
        : selectedRace.subraces;
      updateData({ subrace: availableSubraces[0]?.id ?? selectedRace.subraces[0].id });
    }
  }, [data.subrace, selectedRace, allowedSubraceIds, isCustomRaceSelected, updateData]);

  React.useEffect(() => {
    if (!isUnknownDream && isCustomRaceSelected && availableRaces.length > 0) {
      const firstRace = availableRaces[0];
      updateData({ race: firstRace.id, subrace: firstRace.subraces[0]?.id ?? '' });
    }
  }, [availableRaces, isCustomRaceSelected, isUnknownDream, updateData]);

  React.useEffect(() => {
    const syncCustomRaceUid = async () => {
      try {
        const charWorldbook = getCharWorldbookNames('current');
        const wbName = charWorldbook.primary;
        if (!wbName) return;
        const shouldEnable = isUnknownDream && isCustomRaceSelected;
        await updateWorldbookWith(wbName, entries =>
          entries.map(entry =>
            entry.uid === UNKNOWN_DREAM_CUSTOM_RACE_UID ? { ...entry, enabled: shouldEnable } : entry,
          ),
        );
      } catch (error) {
        console.error('同步未知梦想自定义种族 UID750 失败', error);
      }
    };
    syncCustomRaceUid();
  }, [isCustomRaceSelected, isUnknownDream]);

  const saveCustomRaceWorldbook = async () => {
    if (!isUnknownDream || isSavingCustomRace) return;

    setIsSavingCustomRace(true);
    setCustomRaceSaved(false);
    try {
      const charWorldbook = getCharWorldbookNames('current');
      const wbName = charWorldbook.primary;
      if (!wbName) throw new Error('worldbook not found');

      const customRaceContent = buildCustomRaceWorldbookContent(
        data.customStart.customRaceName.trim(),
        data.customStart.customRaceDescription.trim(),
      );

      await updateWorldbookWith(wbName, entries =>
        entries.map(entry => {
          if (entry.uid === UNKNOWN_DREAM_CUSTOM_RACE_UID) {
            return {
              ...entry,
              content: customRaceContent,
            };
          }
          if (entry.uid === UNKNOWN_DREAM_UID) {
            return {
              ...entry,
              enabled: true,
            };
          }
          return entry;
        }),
      );

      setCustomRaceSaved(true);
    } catch (error) {
      console.error('保存自定义种族失败', error);
      toastr.error('保存失败，请查看控制台');
    } finally {
      setIsSavingCustomRace(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-8">
      <div className="text-center mb-4">
        <h2 className="text-4xl font-serif text-white tracking-wider">选择种族</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-4 content-start">
          {isUnknownDream && (
            <motion.button
              key={CUSTOM_RACE_ID}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => updateData({ race: CUSTOM_RACE_ID, subrace: CUSTOM_RACE_ID })}
              className={`
                p-6 rounded-xl border text-left transition-all relative overflow-hidden group
                ${
                  isCustomRaceSelected
                    ? 'bg-white/10 border-[#C2B280] shadow-lg'
                    : 'bg-black/40 border-white/10 hover:bg-white/5'
                }
              `}
            >
              <div className="relative z-10">
                <h3 className={`text-xl font-serif font-bold mb-1 ${isCustomRaceSelected ? 'text-[#C2B280]' : 'text-white'}`}>
                  {data.customStart.customRaceName.trim() || '自定义种族'}
                </h3>
                <p className="text-xs text-white/50 line-clamp-2">
                  {data.customStart.customRaceDescription.trim() || 'xx：yyyy'}
                </p>
              </div>
              {isCustomRaceSelected && (
                <motion.div layoutId="race-glow" className="absolute inset-0 bg-gradient-to-r from-[#C2B280]/10 to-transparent" />
              )}
            </motion.button>
          )}

          {availableRaces.map(race => (
            <motion.button
              key={race.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => updateData({ race: race.id, subrace: '' })}
              className={`
                p-6 rounded-xl border text-left transition-all relative overflow-hidden group
                ${
                  data.race === race.id
                    ? 'bg-white/10 border-[#C2B280] shadow-lg'
                    : 'bg-black/40 border-white/10 hover:bg-white/5'
                }
              `}
            >
              <div className="relative z-10">
                <h3 className={`text-xl font-serif font-bold mb-1 ${data.race === race.id ? 'text-[#C2B280]' : 'text-white'}`}>
                  {race.title}
                </h3>
                <p className="text-xs text-white/50 line-clamp-2">{race.description}</p>
              </div>
              {data.race === race.id && (
                <motion.div layoutId="race-glow" className="absolute inset-0 bg-gradient-to-r from-[#C2B280]/10 to-transparent" />
              )}
            </motion.button>
          ))}
        </div>

        <div className="lg:col-span-8 bg-black/40 border border-white/10 rounded-xl p-8 relative">
          {isCustomRaceSelected && isUnknownDream ? (
            <motion.div key={CUSTOM_RACE_ID} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#C2B280]/20 rounded-lg text-[#C2B280]">
                  <User size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-serif text-white">{data.customStart.customRaceName.trim() || '自定义种族'}</h3>
                  <p className="text-white/60 whitespace-pre-line">仅在【未知梦想】剧本生效，点击保存后写入世界书 UID750。</p>
                </div>
              </div>

              <div className="rounded-xl border border-[#C2B280]/30 bg-black/50 p-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">xx：yyyy（种族）</label>
                    <input
                      value={data.customStart.customRaceName}
                      onChange={e => {
                        setCustomRaceSaved(false);
                        updateCustomRace({ customRaceName: e.target.value });
                      }}
                      className="w-full bg-black/50 border border-white/20 rounded p-2 text-white focus:border-[#C2B280] focus:outline-none"
                      placeholder="填写种族名，例如：暗裔人"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-2">种族：介绍（介绍）</label>
                    <textarea
                      value={data.customStart.customRaceDescription}
                      onChange={e => {
                        setCustomRaceSaved(false);
                        updateCustomRace({ customRaceDescription: e.target.value });
                      }}
                      rows={4}
                      className="w-full resize-y bg-black/50 border border-white/20 rounded p-2 text-white focus:border-[#C2B280] focus:outline-none"
                      placeholder="填写种族介绍"
                    />
                  </div>
                </div>

                <div className="mt-4 rounded border border-white/15 bg-black/40 p-3 text-sm text-white/80 whitespace-pre-line">
                  {buildCustomRaceWorldbookContent(
                    data.customStart.customRaceName.trim(),
                    data.customStart.customRaceDescription.trim(),
                  )}
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={saveCustomRaceWorldbook}
                    disabled={isSavingCustomRace}
                    className="inline-flex items-center gap-2 rounded border border-[#C2B280]/60 px-3 py-1.5 text-xs text-[#C2B280] transition-colors hover:bg-[#C2B280]/10 disabled:opacity-50"
                  >
                    <Save size={14} />
                    {isSavingCustomRace ? '保存中...' : customRaceSaved ? '已保存' : '保存到世界书'}
                  </button>
                </div>
              </div>

              <div className="mt-auto rounded-xl border border-[#C2B280]/30 bg-black/50 p-6 min-h-[35%]">
                <div className="text-sm text-[#C2B280] uppercase tracking-[0.3em] mb-3">种族：介绍</div>
                <h5 className="text-2xl font-serif text-white mb-4">
                  {`${data.customStart.customRaceName.trim() || '种族'}：${data.customStart.customRaceDescription.trim() || '介绍'}`}
                </h5>
                <div className="text-base leading-relaxed text-white/80 min-h-[140px]">
                  {data.customStart.customRaceDescription.trim() || '在上方填写后，点击保存。'}
                </div>
              </div>
            </motion.div>
          ) : selectedRace ? (
            <motion.div key={selectedRace.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-[#C2B280]/20 rounded-lg text-[#C2B280]">
                  <User size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-serif text-white">{selectedRace.title}</h3>
                  <p className="text-white/60 whitespace-pre-line">{selectedRace.description}</p>
                </div>
              </div>

              <div className="flex h-full flex-col gap-6">
                <h4 className="text-lg font-serif text-[#C2B280] border-b border-white/10 pb-2 flex items-center gap-2">
                  <Dna size={18} />
                  亚种选择
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(allowedSubraceIds
                    ? selectedRace.subraces.filter(subrace => allowedSubraceIds.includes(subrace.id))
                    : selectedRace.subraces
                  ).map(subrace => {
                    const lockInfo = subrace as { locked?: boolean; unlockScenarios?: string[] };
                    const allowedByScenario = lockInfo.unlockScenarios
                      ? lockInfo.unlockScenarios.includes(data.scenario)
                      : true;
                    const isLocked = Boolean(lockInfo.locked) && !allowedByScenario;
                    return (
                      <button
                        key={subrace.id}
                        onClick={() => updateData({ subrace: subrace.id })}
                        disabled={isLocked}
                        className={`
                          p-4 rounded-lg border text-left transition-all relative
                          ${
                            data.subrace === subrace.id
                              ? 'bg-[#C2B280] text-black border-[#C2B280]'
                              : 'bg-white/5 border-white/10 text-white hover:border-white/30'
                          }
                          ${isLocked ? 'opacity-50 cursor-not-allowed hover:border-white/10' : ''}
                        `}
                      >
                        <div className="font-bold font-serif mb-1 flex items-center gap-2">
                          {subrace.title}
                          {isLocked && <span className="text-[10px] uppercase tracking-[0.2em] text-white/70">锁定</span>}
                        </div>
                        <div className={`text-xs ${data.subrace === subrace.id ? 'text-black/70' : 'text-white/50'}`}>
                          {(subrace as { attributeSummary?: string }).attributeSummary ||
                            getSubraceAttributeSummary(subrace.description) ||
                            '暂无初始属性修正'}
                        </div>
                        {isLocked && (
                          <div className="mt-2 text-[10px] text-white/50">
                            {(subrace as { lockedReason?: string }).lockedReason || '需要特定剧本解锁'}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-auto rounded-xl border border-[#C2B280]/30 bg-black/50 p-6 min-h-[50%]">
                  <div className="text-sm text-[#C2B280] uppercase tracking-[0.3em] mb-3">亚种介绍</div>
                  <h5 className="text-2xl font-serif text-white mb-4">{selectedSubrace?.title || '请选择亚种'}</h5>
                  <div className="text-base leading-relaxed text-white/80 min-h-[220px]">
                    {selectedSubrace?.description || '点击上方亚种查看介绍文本。'}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-white/30">
              <User size={48} className="mb-4 opacity-50" />
              <p className="font-serif">选择一个种族以查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
