import { Activity, Eye, Heart, Minus, Plus, Shield, Sparkles, Users, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';
import { RACES, SCENARIOS, TRAITS } from '../data';
import {
  Attribute,
  Attributes,
  CharacterData,
  INITIAL_APPEARANCE,
  INITIAL_ATTRIBUTES,
  SquadMemberData,
} from '../types';

interface StepDetailsProps {
  data: CharacterData;
  updateData: (updates: Partial<CharacterData>) => void;
}

const ATTRIBUTE_CONFIG: Record<Attribute, { label: string; icon: any; desc: string }> = {
  strength: { label: '力量', icon: Shield, desc: '影响近战伤害和负重能力' },
  dexterity: { label: '敏捷', icon: Zap, desc: '影响攻击速度和格挡几率' },
  perception: { label: '感知', icon: Eye, desc: '影响远程精度和侦察能力' },
  constitution: { label: '体质', icon: Heart, desc: '影响生命值和抗击打能力' },
  will: { label: '意志', icon: Sparkles, desc: '影响战斗士气与胆量' },
  intelligence: { label: '智力', icon: Sparkles, desc: '影响科研速度和医疗效率' },
  charisma: { label: '魅力', icon: Activity, desc: '影响交易价格和招募成功率' },
};

const TOTAL_ATTRIBUTE_POINTS = 168;
const SKELETON_ATTRIBUTE_POINTS = 144;
const ATTRIBUTE_MIN = 1;
const ATTRIBUTE_MAX = 50;
const GOD_MODE_ATTRIBUTE_MAX = 130;
const GOD_MODE_MIN_LEVEL = 1;
const GOD_MODE_MAX_LEVEL = 100;
const GOD_MODE_POINTS_PER_LEVEL = 7;
const CONTINUOUS_INTERVAL = 35;

const ATTRIBUTE_PRESETS: Array<{ id: string; label: string; values: Attributes; note: string }> = [
  {
    id: 'default1',
    label: '默认 1 点',
    values: {
      strength: 1,
      dexterity: 1,
      perception: 1,
      constitution: 1,
      will: 1,
      intelligence: 1,
      charisma: 1,
    },
    note: '每项基础值为 1',
  },
  {
    id: 'balanced25',
    label: '模板均衡 25',
    values: {
      strength: 25,
      dexterity: 25,
      perception: 25,
      constitution: 25,
      will: 25,
      intelligence: 25,
      charisma: 25,
    },
    note: '每项 25（总消耗 168）',
  },
];

const ATTRIBUTE_LABEL_TO_KEY: Record<string, Attribute> = {
  力量: 'strength',
  敏捷: 'dexterity',
  感知: 'perception',
  体质: 'constitution',
  意志: 'will',
  智力: 'intelligence',
  魅力: 'charisma',
};

export const StepDetails: React.FC<StepDetailsProps> = ({ data, updateData }) => {
  const isSkeleton = data.race === 'skeleton';
  const baseAttributePoints = isSkeleton ? SKELETON_ATTRIBUTE_POINTS : TOTAL_ATTRIBUTE_POINTS;
  const godModeLevel = Math.max(
    GOD_MODE_MIN_LEVEL,
    Math.min(GOD_MODE_MAX_LEVEL, data.godModeLevel || GOD_MODE_MIN_LEVEL),
  );
  const godModeBonusPoints = data.godModeEnabled ? (godModeLevel - 1) * GOD_MODE_POINTS_PER_LEVEL : 0;
  const totalAttributePoints = baseAttributePoints + godModeBonusPoints;
  const attributeUpperLimit = data.godModeEnabled ? GOD_MODE_ATTRIBUTE_MAX : ATTRIBUTE_MAX;
  const usedPoints = Object.entries(data.attributes).reduce((sum, [key, value]) => {
    if (isSkeleton && key === 'will') return sum;
    return sum + (value - ATTRIBUTE_MIN);
  }, 0);
  const remainingPoints = totalAttributePoints - usedPoints;

  const raceAttributeBonus = React.useMemo(() => {
    const base: Record<Attribute, number> = {
      strength: 0,
      dexterity: 0,
      perception: 0,
      constitution: 0,
      will: 0,
      intelligence: 0,
      charisma: 0,
    };

    const selectedRace = RACES.find(race => race.id === data.race);
    const selectedSubrace = selectedRace?.subraces.find(subrace => subrace.id === data.subrace);
    const raceSummary = (selectedRace as { attributeSummary?: string })?.attributeSummary ?? '';
    const subraceSummary = (selectedSubrace as { attributeSummary?: string })?.attributeSummary ?? '';
    const subraceTitle = selectedSubrace?.title ?? '';
    const subraceInRaceDescription = selectedRace?.description?.includes(subraceTitle)
      ? (selectedRace?.description ?? '')
      : '';
    const textSource = [
      selectedRace?.description ?? '',
      subraceInRaceDescription,
      selectedSubrace?.description ?? '',
      raceSummary,
      subraceSummary,
    ].join(' ');

    const regex = /(力量|敏捷|感知|体质|意志|智力|魅力)\s*([+-]\s*\d+)/g;
    let match = regex.exec(textSource);
    while (match) {
      const attrKey = ATTRIBUTE_LABEL_TO_KEY[match[1]];
      const delta = parseInt(match[2].replace(/\s+/g, ''), 10);
      if (attrKey && !Number.isNaN(delta)) {
        base[attrKey] += delta;
      }
      match = regex.exec(textSource);
    }

    return base;
  }, [data.race, data.subrace]);

  const scenarioAttributeBonus = React.useMemo(() => {
    const base: Record<Attribute, number> = {
      strength: 0,
      dexterity: 0,
      perception: 0,
      constitution: 0,
      will: 0,
      intelligence: 0,
      charisma: 0,
    };

    const selectedScenario = SCENARIOS.find(scenario => scenario.id === data.scenario);
    const textSource = selectedScenario?.description ?? '';

    const regex = /(力量|敏捷|感知|体质|意志|智力|魅力)\s*([+-]\s*\d+)/g;
    let match = regex.exec(textSource);
    while (match) {
      const attrKey = ATTRIBUTE_LABEL_TO_KEY[match[1]];
      const delta = parseInt(match[2].replace(/\s+/g, ''), 10);
      if (attrKey && !Number.isNaN(delta)) {
        base[attrKey] += delta;
      }
      match = regex.exec(textSource);
    }

    return base;
  }, [data.scenario]);

  const holdTimerRef = React.useRef<number | null>(null);
  const attributesRef = React.useRef(data.attributes);
  const remainingRef = React.useRef(remainingPoints);
  const prevSkeletonRef = React.useRef(isSkeleton);

  React.useEffect(() => {
    attributesRef.current = data.attributes;
    remainingRef.current = remainingPoints;
  }, [data.attributes, remainingPoints]);

  React.useEffect(() => {
    if (isSkeleton && data.attributes.will !== 100) {
      updateData({ attributes: { ...data.attributes, will: 100 } });
    }
    if (!isSkeleton && prevSkeletonRef.current) {
      updateData({ attributes: { ...data.attributes, will: ATTRIBUTE_MIN } });
    }
    prevSkeletonRef.current = isSkeleton;
  }, [data.attributes, isSkeleton, updateData]);

  const stopContinuousAdjust = React.useCallback(() => {
    if (holdTimerRef.current !== null) {
      window.clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    const stop = () => stopContinuousAdjust();
    window.addEventListener('mouseup', stop);
    window.addEventListener('touchend', stop);
    window.addEventListener('blur', stop);

    return () => {
      window.removeEventListener('mouseup', stop);
      window.removeEventListener('touchend', stop);
      window.removeEventListener('blur', stop);
      stopContinuousAdjust();
    };
  }, [stopContinuousAdjust]);

  const adjustByDelta = React.useCallback(
    (attr: Attribute, delta: 1 | -1) => {
      if (isSkeleton && attr === 'will') return;
      const currentAttrs = attributesRef.current;
      const currentValue = currentAttrs[attr];

      if (delta > 0 && (currentValue >= attributeUpperLimit || remainingRef.current <= 0)) {
        return;
      }
      if (delta < 0 && currentValue <= ATTRIBUTE_MIN) {
        return;
      }

      const nextValue = currentValue + delta;
      const nextAttrs = {
        ...currentAttrs,
        [attr]: nextValue,
      };

      attributesRef.current = nextAttrs;
      remainingRef.current = remainingRef.current - delta;
      updateData({ attributes: nextAttrs });
    },
    [attributeUpperLimit, isSkeleton, updateData],
  );

  const startContinuousAdjust = (attr: Attribute, delta: 1 | -1) => {
    adjustByDelta(attr, delta);
    stopContinuousAdjust();
    holdTimerRef.current = window.setInterval(() => {
      adjustByDelta(attr, delta);
    }, CONTINUOUS_INTERVAL);
  };

  const applyPreset = (presetValues: Attributes) => {
    updateData({ attributes: { ...presetValues, will: isSkeleton ? 100 : presetValues.will } });
  };

  const handleGodModeAttributeInput = (attr: Attribute, rawValue: string) => {
    if (!data.godModeEnabled) return;
    if (isSkeleton && attr === 'will') return;

    const currentAttrs = attributesRef.current;
    const currentValue = currentAttrs[attr];
    const parsed = parseInt(rawValue, 10);
    const nextRaw = Number.isNaN(parsed) ? ATTRIBUTE_MIN : parsed;

    const maxByPoints = currentValue + remainingRef.current;
    const nextValue = Math.max(ATTRIBUTE_MIN, Math.min(attributeUpperLimit, maxByPoints, nextRaw));

    if (nextValue === currentValue) return;

    const nextAttrs = {
      ...currentAttrs,
      [attr]: nextValue,
    };

    attributesRef.current = nextAttrs;
    remainingRef.current = remainingRef.current - (nextValue - currentValue);
    updateData({ attributes: nextAttrs });
  };

  const toggleTrait = (traitId: string, category: 'attribute' | 'life' | 'fun') => {
    const currentTraits = data.traits;
    if (currentTraits.includes(traitId)) {
      updateData({ traits: currentTraits.filter(t => t !== traitId) });
      return;
    }
    const selectedTraits = currentTraits
      .map(id => [...TRAITS.attribute, ...TRAITS.life, ...TRAITS.fun].find(trait => trait.id === id))
      .filter(Boolean) as Array<{ category: 'attribute' | 'life' | 'fun' }>;
    const attributeCount = selectedTraits.filter(trait => trait.category === 'attribute').length;
    const lifeCount = selectedTraits.filter(trait => trait.category === 'life').length;
    if (category === 'attribute' && attributeCount >= 2) return;
    if (category === 'life' && lifeCount >= 2) return;
    updateData({ traits: [...currentTraits, traitId] });
  };

  const selectedRace = RACES.find(race => race.id === data.race);
  const selectedSubrace = selectedRace?.subraces.find(subrace => subrace.id === data.subrace);
  const raceTraitSource = [selectedRace?.description ?? '', selectedSubrace?.description ?? ''].join(' ');
  const raceTraits = Array.from(new Set(raceTraitSource.match(/[^。！？\n]+（[^）]+）/g) || []));
  const selectedScenario = SCENARIOS.find(scenario => scenario.id === data.scenario) as
    | { allowedGenders?: Array<CharacterData['gender']>; companions?: SquadMemberData[] }
    | undefined;
  const allowedGenders = selectedScenario?.allowedGenders;
  const companionMembers = selectedScenario?.companions ?? [];
  const allowSquadMembers = data.scenario === 'freedom_seekers' || companionMembers.length > 0;
  const subraceAllowedGenders = (selectedSubrace as { allowedGenders?: Array<CharacterData['gender']> })
    ?.allowedGenders;

  React.useEffect(() => {
    if (isSkeleton && data.gender !== 'other') {
      updateData({ gender: 'other' });
      return;
    }
    if (allowedGenders && !allowedGenders.includes(data.gender)) {
      updateData({ gender: allowedGenders[0] });
      return;
    }
    if (subraceAllowedGenders && !subraceAllowedGenders.includes(data.gender)) {
      updateData({ gender: subraceAllowedGenders[0] });
    }
  }, [allowedGenders, data.gender, isSkeleton, subraceAllowedGenders, updateData]);

  const updateSquadMember = (index: number, updates: Partial<SquadMemberData>) => {
    updateData({
      squadMembers: data.squadMembers.map((member, idx) => (idx === index ? { ...member, ...updates } : member)),
    });
  };

  React.useEffect(() => {
    if (!allowSquadMembers) {
      return;
    }

    const hasUserEdits = data.squadMembers.some(member => member.name || member.race || member.subrace);
    const shouldSeedCompanions = companionMembers.length > 0 && !hasUserEdits;
    const baseMembers = shouldSeedCompanions ? companionMembers : data.squadMembers;
    let changed = shouldSeedCompanions || baseMembers.length !== data.squadMembers.length;
    const nextMembers = baseMembers.map(member => {
      const memberRace = RACES.find(race => race.id === member.race);
      const memberSubrace = memberRace?.subraces.find(subrace => subrace.id === member.subrace);
      const allowed = (memberSubrace as { allowedGenders?: Array<CharacterData['gender']> })?.allowedGenders;
      if (allowed && !allowed.includes(member.gender)) {
        changed = true;
        return { ...member, gender: allowed[0] };
      }
      return member;
    });

    if (changed) {
      updateData({ squadMembers: nextMembers });
    }
  }, [allowSquadMembers, companionMembers, data.squadMembers, updateData]);

  const updateSquadMemberAppearance = (index: number, updates: Partial<SquadMemberData['appearance']>) => {
    const member = data.squadMembers[index];
    updateSquadMember(index, {
      appearance: { ...member.appearance, ...updates },
    });
  };

  const updateSquadMemberAttributes = (index: number, updates: Partial<Attributes>) => {
    const member = data.squadMembers[index];
    updateSquadMember(index, {
      attributes: { ...member.attributes, ...updates },
    });
  };

  const toggleSquadMemberTrait = (index: number, traitId: string, category: 'attribute' | 'life' | 'fun') => {
    const member = data.squadMembers[index];
    const currentTraits = member.traits;
    if (currentTraits.includes(traitId)) {
      updateSquadMember(index, { traits: currentTraits.filter(t => t !== traitId) });
      return;
    }
    const selectedTraits = currentTraits
      .map(id => [...TRAITS.attribute, ...TRAITS.life, ...TRAITS.fun].find(trait => trait.id === id))
      .filter(Boolean) as Array<{ category: 'attribute' | 'life' | 'fun' }>;
    const attributeCount = selectedTraits.filter(trait => trait.category === 'attribute').length;
    const lifeCount = selectedTraits.filter(trait => trait.category === 'life').length;
    if (category === 'attribute' && attributeCount >= 2) return;
    if (category === 'life' && lifeCount >= 2) return;
    updateSquadMember(index, { traits: [...currentTraits, traitId] });
  };

  const resetSquadMember = (index: number) => {
    updateSquadMember(index, {
      name: '',
      gender: 'male',
      age: 25,
      race: '',
      subrace: '',
      attributes: { ...INITIAL_ATTRIBUTES },
      appearance: { ...INITIAL_APPEARANCE },
      traits: [],
      customTraitName: '',
      customTraitDescription: '',
    });
  };

  const buildRandomMemberAttributes = (): Attributes => {
    const keys = Object.keys(INITIAL_ATTRIBUTES) as Attribute[];
    const attributes = keys.reduce((acc, key) => {
      acc[key] = ATTRIBUTE_MIN;
      return acc;
    }, {} as Attributes);
    let remaining = TOTAL_ATTRIBUTE_POINTS;
    const perMax = ATTRIBUTE_MAX - ATTRIBUTE_MIN;

    while (remaining > 0) {
      const available = keys.filter(key => attributes[key] - ATTRIBUTE_MIN < perMax);
      if (available.length === 0) break;
      const selected = available[Math.floor(Math.random() * available.length)];
      attributes[selected] += 1;
      remaining -= 1;
    }

    return attributes;
  };

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto pr-2 pb-20">
      {/* Left Column: Stats & Traits */}
      <div className="space-y-8">
        {/* Attributes Section */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-6">
          <h3 className="text-2xl font-serif text-[#C2B280] mb-6 flex items-center gap-2">
            <Activity className="text-[#C2B280]" />
            七维属性
          </h3>

          <div className="mb-4 space-y-3 rounded-lg border border-white/10 bg-black/30 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-white/60">基础属性点：{totalAttributePoints}</span>
              <span className="text-[#C2B280] font-mono">
                已分配 {usedPoints} / 剩余 {remainingPoints}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded border border-[#C2B280]/30 bg-black/40 px-3 py-2 text-xs">
              <label className="inline-flex cursor-pointer items-center gap-2 text-[#C2B280]">
                <input
                  type="checkbox"
                  checked={data.godModeEnabled}
                  onChange={e => updateData({ godModeEnabled: e.target.checked })}
                  className="h-3.5 w-3.5 rounded border-white/30 bg-black/50"
                />
                上帝模式
              </label>
              {data.godModeEnabled && (
                <>
                  <label className="text-white/60">等级</label>
                  <input
                    type="number"
                    min={GOD_MODE_MIN_LEVEL}
                    max={GOD_MODE_MAX_LEVEL}
                    value={godModeLevel}
                    onChange={e => {
                      const parsed = parseInt(e.target.value, 10);
                      const nextLevel = Number.isNaN(parsed)
                        ? GOD_MODE_MIN_LEVEL
                        : Math.max(GOD_MODE_MIN_LEVEL, Math.min(GOD_MODE_MAX_LEVEL, parsed));
                      updateData({ godModeLevel: nextLevel });
                    }}
                    className="w-20 rounded border border-white/20 bg-black/50 px-2 py-1 text-white focus:border-[#C2B280] focus:outline-none"
                  />
                  <span className="text-white/50">(1-100)</span>
                  <span className="text-green-400">额外 +{godModeBonusPoints} 属性点</span>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {ATTRIBUTE_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.values)}
                  className="rounded border border-[#C2B280]/40 px-3 py-1.5 text-xs text-[#C2B280] transition-colors hover:bg-[#C2B280]/10"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-white/40">
              按游戏加点逻辑：默认 1 点，+1 消耗 1 点，-1 返还 1 点；普通模式单项最高 50 点。上帝模式可设置等级 1-100，
              每升 1 级额外 +7 属性点，单项上限提升到 130，且可直接输入数值分配。长按 +/- 可连续加点。
            </p>
          </div>

          <div className="space-y-4">
            {(Object.keys(data.attributes) as Attribute[]).map(attr => {
              const config = ATTRIBUTE_CONFIG[attr];
              const Icon = config.icon;
              const value = data.attributes[attr];
              const isLocked = isSkeleton && attr === 'will';
              const canMinus = value > ATTRIBUTE_MIN && !isLocked;
              const canPlus = value < attributeUpperLimit && remainingPoints > 0 && !isLocked;
              const barMax = data.godModeEnabled ? GOD_MODE_ATTRIBUTE_MAX : ATTRIBUTE_MAX;

              return (
                <div key={attr} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-white/90">
                      <Icon size={14} className="text-white/50" />
                      {config.label}
                    </label>
                    <span className="text-[#C2B280] font-mono inline-flex items-center gap-2">
                      {data.godModeEnabled ? (
                        <input
                          type="number"
                          min={ATTRIBUTE_MIN}
                          max={attributeUpperLimit}
                          value={value}
                          onChange={e => handleGodModeAttributeInput(attr, e.target.value)}
                          disabled={isLocked}
                          className="w-20 rounded border border-white/20 bg-black/50 px-2 py-0.5 text-[#C2B280] focus:border-[#C2B280] focus:outline-none disabled:opacity-60"
                        />
                      ) : (
                        <>{value}</>
                      )}
                      {raceAttributeBonus[attr] + scenarioAttributeBonus[attr] !== 0 && (
                        <span
                          className={
                            raceAttributeBonus[attr] + scenarioAttributeBonus[attr] > 0
                              ? 'text-green-400'
                              : 'text-red-400'
                          }
                        >
                          (
                          {raceAttributeBonus[attr] + scenarioAttributeBonus[attr] > 0
                            ? `+${raceAttributeBonus[attr] + scenarioAttributeBonus[attr]}`
                            : raceAttributeBonus[attr] + scenarioAttributeBonus[attr]}
                          )
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-[42px_1fr_42px] items-center gap-3">
                    <button
                      type="button"
                      onMouseDown={() => startContinuousAdjust(attr, -1)}
                      onTouchStart={e => {
                        e.preventDefault();
                        startContinuousAdjust(attr, -1);
                      }}
                      onMouseLeave={stopContinuousAdjust}
                      className="h-10 w-10 rounded border border-white/20 bg-black/50 text-white/70 transition hover:border-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      disabled={!canMinus}
                    >
                      <Minus size={16} className="mx-auto" />
                    </button>

                    <div className="h-2 rounded bg-white/10 overflow-hidden">
                      <motion.div
                        animate={{ width: `${((value - ATTRIBUTE_MIN) / Math.max(1, barMax - ATTRIBUTE_MIN)) * 100}%` }}
                        transition={{ duration: 0.12 }}
                        className="h-full bg-[#C2B280]"
                      />
                    </div>

                    <button
                      type="button"
                      onMouseDown={() => startContinuousAdjust(attr, 1)}
                      onTouchStart={e => {
                        e.preventDefault();
                        startContinuousAdjust(attr, 1);
                      }}
                      onMouseLeave={stopContinuousAdjust}
                      className="h-10 w-10 rounded border border-[#C2B280]/50 bg-black/50 text-[#C2B280] transition hover:bg-[#C2B280]/10 disabled:opacity-30 disabled:cursor-not-allowed"
                      disabled={!canPlus}
                    >
                      <Plus size={16} className="mx-auto" />
                    </button>
                  </div>
                  {isLocked && <div className="text-[10px] text-white/40 mt-1">骨人意志固定为 100</div>}

                  <p className="text-[10px] text-white/40 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {config.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Squad Members Section */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-serif text-[#C2B280] flex items-center gap-2">
              <Users size={18} className="text-[#C2B280]" />
              小队成员设定
            </h3>
            {allowSquadMembers ? (
              <span className="text-xs text-white/50">
                {companionMembers.length > 0 ? '该剧本自带队友' : '仅追求自由者可编辑'}
              </span>
            ) : (
              <span className="text-xs text-white/40">需选择“追求自由者”剧本解锁</span>
            )}
          </div>

          {!allowSquadMembers && (
            <p className="text-xs text-white/40">只有选择“追求自由者”剧本，才可在此设置其余 4 位队员的详细信息。</p>
          )}

          {allowSquadMembers && (
            <div className="space-y-6">
              {data.squadMembers.map((member, index) => {
                const memberRace = RACES.find(race => race.id === member.race);
                const memberSubraces = memberRace?.subraces ?? [];
                const memberSubrace = memberSubraces.find(subrace => subrace.id === member.subrace);
                const memberSubraceAllowedGenders = (
                  memberSubrace as { allowedGenders?: Array<CharacterData['gender']> }
                )?.allowedGenders;
                return (
                  <div key={index} className="border border-white/10 rounded-xl p-4 bg-black/30">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-[#C2B280] font-serif">队员 {index + 1}</div>
                      {companionMembers.length > 0 ? (
                        <span className="text-xs text-white/40">固定成员</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => resetSquadMember(index)}
                          className="text-xs text-white/40 hover:text-white transition-colors"
                        >
                          重置
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-white/60 mb-1">姓名</label>
                        <input
                          type="text"
                          value={member.name}
                          onChange={e => updateSquadMember(index, { name: e.target.value })}
                          className="w-full bg-black/50 border border-white/20 rounded p-2 text-white focus:border-[#C2B280] focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-white/60 mb-1">性别</label>
                          <select
                            value={member.gender}
                            onChange={e => updateSquadMember(index, { gender: e.target.value as any })}
                            className="w-full bg-black/50 border border-white/20 rounded p-2 text-white focus:border-[#C2B280] focus:outline-none"
                          >
                            <option
                              value="male"
                              disabled={
                                memberSubraceAllowedGenders ? !memberSubraceAllowedGenders.includes('male') : false
                              }
                            >
                              男性
                            </option>
                            <option
                              value="female"
                              disabled={
                                memberSubraceAllowedGenders ? !memberSubraceAllowedGenders.includes('female') : false
                              }
                            >
                              女性
                            </option>
                            <option
                              value="other"
                              disabled={
                                memberSubraceAllowedGenders ? !memberSubraceAllowedGenders.includes('other') : false
                              }
                            >
                              其他
                            </option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-white/60 mb-1">年龄</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={member.age}
                            onChange={e => updateSquadMember(index, { age: parseInt(e.target.value) })}
                            className="w-full bg-black/50 border border-white/20 rounded p-2 text-white focus:border-[#C2B280] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-xs text-white/60 mb-1">种族</label>
                        <select
                          value={member.race}
                          onChange={e => updateSquadMember(index, { race: e.target.value, subrace: '' })}
                          className="w-full bg-black/50 border border-white/20 rounded p-2 text-white focus:border-[#C2B280] focus:outline-none"
                          disabled={companionMembers.length > 0}
                        >
                          <option value="">未选择</option>
                          {(companionMembers.length > 0
                            ? RACES
                            : RACES.filter(race => !(race as { hidden?: boolean }).hidden)
                          ).map(race => (
                            <option key={race.id} value={race.id}>
                              {race.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-white/60 mb-1">亚种</label>
                        <select
                          value={member.subrace}
                          onChange={e => {
                            const nextSubrace = e.target.value;
                            const nextSubraceData = memberSubraces.find(subrace => subrace.id === nextSubrace);
                            const allowed = (nextSubraceData as { allowedGenders?: Array<CharacterData['gender']> })
                              ?.allowedGenders;
                            const nextGender = allowed && !allowed.includes(member.gender) ? allowed[0] : member.gender;
                            updateSquadMember(index, { subrace: nextSubrace, gender: nextGender });
                          }}
                          className="w-full bg-black/50 border border-white/20 rounded p-2 text-white focus:border-[#C2B280] focus:outline-none"
                          disabled={!member.race || companionMembers.length > 0}
                        >
                          <option value="">未选择</option>
                          {memberSubraces.map(subrace => (
                            <option key={subrace.id} value={subrace.id}>
                              {subrace.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/60 mb-2">
                        <span>属性分配</span>
                        <span className="text-[#C2B280] font-mono">
                          已分配{' '}
                          {Object.values(member.attributes).reduce((sum, value) => sum + (value - ATTRIBUTE_MIN), 0)} /
                          剩余{' '}
                          {TOTAL_ATTRIBUTE_POINTS -
                            Object.values(member.attributes).reduce((sum, value) => sum + (value - ATTRIBUTE_MIN), 0)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateSquadMember(index, {
                              attributes: buildRandomMemberAttributes(),
                            })
                          }
                          className="rounded border border-[#C2B280]/40 px-2 py-1 text-[10px] text-[#C2B280] transition-colors hover:bg-[#C2B280]/10"
                        >
                          随机该队员
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(Object.keys(member.attributes) as Attribute[]).map(attr => (
                          <div key={attr}>
                            <label className="block text-[10px] text-white/50 mb-1">
                              {ATTRIBUTE_CONFIG[attr].label}
                            </label>
                            <input
                              type="number"
                              min={ATTRIBUTE_MIN}
                              max={ATTRIBUTE_MAX}
                              value={member.attributes[attr]}
                              onChange={e =>
                                updateSquadMemberAttributes(index, {
                                  [attr]: Math.max(
                                    ATTRIBUTE_MIN,
                                    Math.min(ATTRIBUTE_MAX, parseInt(e.target.value) || ATTRIBUTE_MIN),
                                  ),
                                })
                              }
                              className="w-full bg-black/50 border border-white/20 rounded p-2 text-white focus:border-[#C2B280] focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-white/40 mt-2">
                        每位队员同样拥有 168 点基础属性点；可手动分配，或点击“随机该队员”生成。
                      </p>
                    </div>

                    <div className="mt-4">
                      <div className="text-xs text-white/60 mb-2">外貌</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={member.appearance.eyes}
                          onChange={e => updateSquadMemberAppearance(index, { eyes: e.target.value })}
                          className="w-full bg-black/50 border border-white/20 rounded p-2 text-white focus:border-[#C2B280] focus:outline-none"
                          placeholder="眼睛"
                        />
                        <input
                          type="text"
                          value={member.appearance.hairColor}
                          onChange={e => updateSquadMemberAppearance(index, { hairColor: e.target.value })}
                          className="w-full bg-black/50 border border-white/20 rounded p-2 text-white focus:border-[#C2B280] focus:outline-none"
                          placeholder="发色"
                        />
                        <input
                          type="text"
                          value={member.appearance.bodyType}
                          onChange={e => updateSquadMemberAppearance(index, { bodyType: e.target.value })}
                          className="w-full bg-black/50 border border-white/20 rounded p-2 text-white focus:border-[#C2B280] focus:outline-none"
                          placeholder="体态"
                        />
                        <input
                          type="text"
                          value={member.appearance.hairStyle}
                          onChange={e => updateSquadMemberAppearance(index, { hairStyle: e.target.value })}
                          className="w-full bg-black/50 border border-white/20 rounded p-2 text-white focus:border-[#C2B280] focus:outline-none"
                          placeholder="发型"
                        />
                      </div>
                      <div className="mt-3">
                        <label className="block text-[10px] text-white/50 mb-1">外貌描述</label>
                        <textarea
                          value={member.appearance.description}
                          onChange={e => updateSquadMemberAppearance(index, { description: e.target.value })}
                          rows={3}
                          className="w-full resize-y rounded border border-white/20 bg-black/50 p-2 text-sm text-white focus:border-[#C2B280] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="text-xs text-white/60">特质</span>
                        <span className="text-[10px] text-white/40">
                          属性类 {member.traits.filter(id => TRAITS.attribute.some(t => t.id === id)).length}/2 · 生活类{' '}
                          {member.traits.filter(id => TRAITS.life.some(t => t.id === id)).length}/2 · 整活类不限
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="text-[10px] text-white/50 mb-1">属性类（可选 2）</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {TRAITS.attribute.map(trait => {
                              const isAnimalCompanion = member.race === 'canine' || member.race === 'pack_beast';
                              return (
                                <button
                                  key={trait.id}
                                  onClick={() => toggleSquadMemberTrait(index, trait.id, 'attribute')}
                                  disabled={
                                    isAnimalCompanion ||
                                    (!member.traits.includes(trait.id) &&
                                      member.traits.filter(id => TRAITS.attribute.some(t => t.id === id)).length >= 2)
                                  }
                                  className={
                                    `p-2 rounded border text-left text-xs transition-all ` +
                                    (member.traits.includes(trait.id)
                                      ? 'bg-[#C2B280]/20 border-[#C2B280] text-[#C2B280]'
                                      : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed')
                                  }
                                >
                                  <div className="font-bold mb-1">{trait.title}</div>
                                  <div className="text-[10px] opacity-70">{trait.description}</div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-white/50 mb-1">生活类（可选 2）</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {TRAITS.life.map(trait => {
                              const isAnimalCompanion = member.race === 'canine' || member.race === 'pack_beast';
                              return (
                                <button
                                  key={trait.id}
                                  onClick={() => toggleSquadMemberTrait(index, trait.id, 'life')}
                                  disabled={
                                    isAnimalCompanion ||
                                    (!member.traits.includes(trait.id) &&
                                      member.traits.filter(id => TRAITS.life.some(t => t.id === id)).length >= 2)
                                  }
                                  className={
                                    `p-2 rounded border text-left text-xs transition-all ` +
                                    (member.traits.includes(trait.id)
                                      ? 'bg-[#C2B280]/20 border-[#C2B280] text-[#C2B280]'
                                      : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed')
                                  }
                                >
                                  <div className="font-bold mb-1">{trait.title}</div>
                                  <div className="text-[10px] opacity-70">{trait.description}</div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-white/50 mb-1">整活类（不限）</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {TRAITS.fun.map(trait => {
                              const isAnimalCompanion = member.race === 'canine' || member.race === 'pack_beast';
                              return (
                                <button
                                  key={trait.id}
                                  onClick={() => toggleSquadMemberTrait(index, trait.id, 'fun')}
                                  disabled={isAnimalCompanion}
                                  className={
                                    `p-2 rounded border text-left text-xs transition-all ` +
                                    (member.traits.includes(trait.id)
                                      ? 'bg-[#C2B280]/20 border-[#C2B280] text-[#C2B280]'
                                      : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed')
                                  }
                                >
                                  <div className="font-bold mb-1">{trait.title}</div>
                                  <div className="text-[10px] opacity-70">{trait.description}</div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="block text-[10px] text-white/50 mb-1">自定义特质（仅 1 个）</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            value={member.customTraitName || ''}
                            onChange={e => updateSquadMember(index, { customTraitName: e.target.value })}
                            className="w-full rounded border border-white/20 bg-black/50 p-2 text-sm text-white focus:border-[#C2B280] focus:outline-none"
                            placeholder="特质名称"
                            disabled={member.race === 'canine' || member.race === 'pack_beast'}
                          />
                          <textarea
                            value={member.customTraitDescription || ''}
                            onChange={e => updateSquadMember(index, { customTraitDescription: e.target.value })}
                            rows={2}
                            className="w-full resize-y rounded border border-white/20 bg-black/50 p-2 text-sm text-white focus:border-[#C2B280] focus:outline-none"
                            placeholder="特质描述"
                            disabled={member.race === 'canine' || member.race === 'pack_beast'}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Identity & Appearance */}
      <div className="space-y-8">
        <div className="bg-black/40 border border-white/10 rounded-xl p-6">
          <h3 className="text-2xl font-serif text-[#C2B280] mb-6">身份设定</h3>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm text-white/60 mb-2">姓名</label>
              <input
                type="text"
                value={data.name}
                onChange={e => updateData({ name: e.target.value })}
                className="w-full bg-black/50 border border-white/20 rounded p-3 text-white focus:border-[#C2B280] focus:outline-none font-serif tracking-wide"
                placeholder="输入角色姓名..."
              />
            </div>

            {/* Gender & Age */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">性别</label>
                <select
                  value={data.gender}
                  onChange={e => updateData({ gender: e.target.value as any })}
                  className="w-full bg-black/50 border border-white/20 rounded p-3 text-white focus:border-[#C2B280] focus:outline-none"
                  disabled={isSkeleton}
                >
                  <option
                    value="male"
                    disabled={
                      isSkeleton ||
                      (allowedGenders ? !allowedGenders.includes('male') : false) ||
                      (subraceAllowedGenders ? !subraceAllowedGenders.includes('male') : false)
                    }
                  >
                    男性
                  </option>
                  <option
                    value="female"
                    disabled={
                      isSkeleton ||
                      (allowedGenders ? !allowedGenders.includes('female') : false) ||
                      (subraceAllowedGenders ? !subraceAllowedGenders.includes('female') : false)
                    }
                  >
                    女性
                  </option>
                  <option
                    value="other"
                    disabled={
                      (allowedGenders ? !allowedGenders.includes('other') : false) ||
                      (subraceAllowedGenders ? !subraceAllowedGenders.includes('other') : false)
                    }
                  >
                    无性别
                  </option>
                </select>
                {isSkeleton && <div className="text-[10px] text-white/40 mt-1">骨人无性别</div>}
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">年龄</label>
                <input
                  type="number"
                  min="16"
                  max="100"
                  value={data.age}
                  onChange={e => updateData({ age: parseInt(e.target.value) })}
                  className="w-full bg-black/50 border border-white/20 rounded p-3 text-white focus:border-[#C2B280] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Race Traits Section */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-serif text-[#C2B280]">种族特质</h3>
              <span className="text-xs text-white/50">来自种族/亚种描述</span>
            </div>
            {raceTraits.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {raceTraits.map(trait => (
                  <span
                    key={trait}
                    className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white/70"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/40">当前种族暂无特质描述。</p>
            )}
          </div>

          {/* Traits Section */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="text-2xl font-serif text-[#C2B280]">特质</h3>
              <div className="text-xs text-white/50">
                属性类已选 {data.traits.filter(id => TRAITS.attribute.some(t => t.id === id)).length}/2 · 生活类已选{' '}
                {data.traits.filter(id => TRAITS.life.some(t => t.id === id)).length}/2 · 整活类不限
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-white/60 mb-2">属性类（可选 2）</div>
                <div className="grid grid-cols-1 gap-3">
                  {TRAITS.attribute.map(trait => (
                    <button
                      key={trait.id}
                      onClick={() => toggleTrait(trait.id, 'attribute')}
                      disabled={
                        !data.traits.includes(trait.id) &&
                        data.traits.filter(id => TRAITS.attribute.some(t => t.id === id)).length >= 2
                      }
                      className={`
                        p-3 rounded border text-left text-sm transition-all
                        ${
                          data.traits.includes(trait.id)
                            ? 'bg-[#C2B280]/20 border-[#C2B280] text-[#C2B280]'
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed'
                        }
                      `}
                    >
                      <div className="font-bold mb-1">{trait.title}</div>
                      <div className="text-[10px] opacity-70">{trait.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-white/60 mb-2">生活类（可选 2）</div>
                <div className="grid grid-cols-1 gap-3">
                  {TRAITS.life.map(trait => (
                    <button
                      key={trait.id}
                      onClick={() => toggleTrait(trait.id, 'life')}
                      disabled={
                        !data.traits.includes(trait.id) &&
                        data.traits.filter(id => TRAITS.life.some(t => t.id === id)).length >= 2
                      }
                      className={`
                        p-3 rounded border text-left text-sm transition-all
                        ${
                          data.traits.includes(trait.id)
                            ? 'bg-[#C2B280]/20 border-[#C2B280] text-[#C2B280]'
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed'
                        }
                      `}
                    >
                      <div className="font-bold mb-1">{trait.title}</div>
                      <div className="text-[10px] opacity-70">{trait.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-white/60 mb-2">整活类（不限）</div>
                <div className="grid grid-cols-1 gap-3">
                  {TRAITS.fun.map(trait => (
                    <button
                      key={trait.id}
                      onClick={() => toggleTrait(trait.id, 'fun')}
                      className={`
                        p-3 rounded border text-left text-sm transition-all
                        ${
                          data.traits.includes(trait.id)
                            ? 'bg-[#C2B280]/20 border-[#C2B280] text-[#C2B280]'
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
                        }
                      `}
                    >
                      <div className="font-bold mb-1">{trait.title}</div>
                      <div className="text-[10px] opacity-70">{trait.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-white/60 mb-2">自定义特质（仅 1 个）</label>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <input
                  value={data.customTraitName || ''}
                  onChange={e => updateData({ customTraitName: e.target.value })}
                  className="w-full rounded border border-white/20 bg-black/50 p-3 text-sm text-white focus:border-[#C2B280] focus:outline-none"
                  placeholder="特质名称"
                />
                <textarea
                  value={data.customTraitDescription || ''}
                  onChange={e => updateData({ customTraitDescription: e.target.value })}
                  rows={2}
                  className="w-full resize-y rounded border border-white/20 bg-black/50 p-3 text-sm text-white focus:border-[#C2B280] focus:outline-none"
                  placeholder="特质描述（可含属性加成）"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Appearance Sliders */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-6">
          <h3 className="text-2xl font-serif text-[#C2B280] mb-6">外貌特征</h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">眼睛</label>
                <input
                  type="text"
                  value={data.appearance.eyes}
                  onChange={e => updateData({ appearance: { ...data.appearance, eyes: e.target.value } })}
                  className="w-full bg-black/50 border border-white/20 rounded p-3 text-white focus:border-[#C2B280] focus:outline-none"
                  placeholder="例如：金色竖瞳"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">发色</label>
                <input
                  type="text"
                  value={data.appearance.hairColor}
                  onChange={e => updateData({ appearance: { ...data.appearance, hairColor: e.target.value } })}
                  className="w-full bg-black/50 border border-white/20 rounded p-3 text-white focus:border-[#C2B280] focus:outline-none"
                  placeholder="例如：黑色、银白、赤红"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">体态</label>
                <input
                  type="text"
                  value={data.appearance.bodyType}
                  onChange={e => updateData({ appearance: { ...data.appearance, bodyType: e.target.value } })}
                  className="w-full bg-black/50 border border-white/20 rounded p-3 text-white focus:border-[#C2B280] focus:outline-none"
                  placeholder="例如：弯腰、驼背"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">发型</label>
                <input
                  type="text"
                  value={data.appearance.hairStyle}
                  onChange={e => updateData({ appearance: { ...data.appearance, hairStyle: e.target.value } })}
                  className="w-full bg-black/50 border border-white/20 rounded p-3 text-white focus:border-[#C2B280] focus:outline-none"
                  placeholder="例如：光头、短发、长发"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2 text-white/80">
                <span>身高</span>
                <span className="font-mono text-[#C2B280]">{(data.appearance.height / 100).toFixed(2)} m</span>
              </div>
              <input
                type="range"
                min="80"
                max="300"
                step="1"
                value={data.appearance.height}
                onChange={e => updateData({ appearance: { ...data.appearance, height: parseInt(e.target.value) } })}
                className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-[#C2B280]"
              />
              <div className="flex justify-between text-xs text-white/30 mt-1">
                <span>0.80m</span>
                <span>3.00m</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">外貌描述</label>
              <textarea
                value={data.appearance.description}
                onChange={e => updateData({ appearance: { ...data.appearance, description: e.target.value } })}
                rows={4}
                className="w-full resize-y rounded border border-white/20 bg-black/50 p-3 text-sm text-white focus:border-[#C2B280] focus:outline-none"
                placeholder="例如：左脸有疤、浅色短发、眼神冷峻……"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
