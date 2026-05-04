import { Activity, Eye, Heart, Minus, Plus, Shield, Sparkles, Users, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';
import { RACES, SCENARIOS, TRAITS } from '../data';
import {
  Attribute,
  Attributes,
  CharacterData,
  CustomArmorType,
  CustomWeaponType,
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
  will: { label: '意志', icon: Sparkles, desc: '影响心情值和胆量' },
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
const GOD_MODE_POINTS_PER_LEVEL = 5;
const SQUAD_LEVEL_POINTS_PER_LEVEL = 5;
const CONTINUOUS_STEP_INTERVAL = 35;
const CONTINUOUS_TICK_INTERVAL = 90;
const CONTINUOUS_START_DELAY = 120;
const CONTINUOUS_MAX_BATCH_STEPS = 3;

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

const UNKNOWN_DREAM_SCENARIO_ID = 'unknown_dream';
const UNKNOWN_DREAM_UID = 749;
const UNKNOWN_DREAM_WEAPON_TYPES = ['武士刀类', '钝器类', '军刀类', '砍刀类', '长柄刀类', '大型类', '弓', '弩'];
const UNKNOWN_DREAM_ARMOR_TYPES = ['轻甲', '中甲', '重甲'];
const UNKNOWN_DREAM_TUTORIAL_STEPS = [
  {
    title: '武器名称',
    content: '武器名字。点击下一步进入武器类别详解。',
  },
  {
    title: '武器类别详解',
    content: `武士刀：
- 每次对目标造成未被DR格挡的切割伤害时，对目标施加1层“流血”。流血每回合开始时造成1点直接伤害，可叠加。
- 基础攻速为3。

军刀：
- 装备军刀类武器时，“武器格挡”基础值+12。

砍刀：
- 无视对方7点DR。
- 攻击检定大成功（01-07）时触发“破甲”：目标DR降低8（可叠加，对该目标全局生效）。

长柄类：
- 每次攻击时可选择最多3个敌人进行攻击检定；每多一个目标，攻击检定-7。

钝器：
- 攻击检定大成功（01-07）时，目标必定获得1层“骨折”；每层骨折使力量/敏捷-10、逃跑检定-15（可叠加，直到夹板包清除）。

大型武器：
- 每次攻击时对2个敌人进行攻击检定。
- 攻击检定大失败（90-100）或两名目标均被【闪避】时，进入失衡，防御检定-15。

弩：
- 基础效果：无视对方7点DR。
- 基础攻速为1。
- 大失败不会触发反击，而是误伤队友。

弓：
- 大失败不会触发反击，而是误伤队友。
- 当弓/弩作为主武器且无副武器时，防御时只能闪避不能格挡；若有副武器则可正常防御。
- 对弓/弩攻击只能闪避，无法格挡。`,
  },
  {
    title: '伤害面骰数',
    content: '伤害面骰数，为一次攻击最高xx伤害。',
  },
  {
    title: '切割占比 / 钝伤占比',
    content: '切割占比：可以被护甲DR格挡的伤害；钝伤占比：不可被护甲格挡，即真实伤害。',
  },
];
const BEEP_PRESET_UNKNOWN_DREAM_SCRIPT = `黄沙掩埋了无数旧时代的骨骸，而在这片残酷的废土上，此刻却迎来了一个绝对的“异类”。
也许你是跨越星海的异世界来客，也许是远古废墟中苏醒的未知造物。你的种族不在任何势力的图鉴里，你的过往也没有任何剧本能够定义。
荒野中孤身伫立的你。
你的样貌、身份、甚至是行囊中那些根本不属于这个世界的奇特装备，全凭你一手捏造。这个世界对你的突兀降临毫无准备，但这正是你最大的特权。
随心所欲地塑造你的化身吧，打破一切常理与束缚
在这片焦土上，亲自执导属于你的第一场大戏。`;

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
  const holdDelayRef = React.useRef<number | null>(null);
  const lastAdjustTimestampRef = React.useRef<number>(0);
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
    if (holdDelayRef.current !== null) {
      window.clearTimeout(holdDelayRef.current);
      holdDelayRef.current = null;
    }
    if (holdTimerRef.current !== null) {
      window.clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    const stop = () => stopContinuousAdjust();
    window.addEventListener('mouseup', stop);
    window.addEventListener('touchend', stop);
    window.addEventListener('touchcancel', stop);
    window.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', stop);

    return () => {
      window.removeEventListener('mouseup', stop);
      window.removeEventListener('touchend', stop);
      window.removeEventListener('touchcancel', stop);
      window.removeEventListener('blur', stop);
      document.removeEventListener('visibilitychange', stop);
      stopContinuousAdjust();
    };
  }, [stopContinuousAdjust]);

  const adjustByDelta = React.useCallback(
    (attr: Attribute, delta: 1 | -1, requestedSteps: number = 1) => {
      if (isSkeleton && attr === 'will') return;
      const currentAttrs = attributesRef.current;
      const currentValue = currentAttrs[attr];
      const steps = Math.max(1, Math.min(CONTINUOUS_MAX_BATCH_STEPS, Math.floor(requestedSteps)));
      const canIncrease = Math.min(attributeUpperLimit - currentValue, remainingRef.current);
      const canDecrease = currentValue - ATTRIBUTE_MIN;
      const appliedSteps = delta > 0 ? Math.min(steps, canIncrease) : Math.min(steps, canDecrease);
      if (appliedSteps <= 0) {
        return;
      }
      const nextValue = currentValue + delta * appliedSteps;
      const nextAttrs = {
        ...currentAttrs,
        [attr]: nextValue,
      };

      attributesRef.current = nextAttrs;
      remainingRef.current = remainingRef.current - delta * appliedSteps;
      updateData({ attributes: nextAttrs });
    },
    [attributeUpperLimit, isSkeleton, updateData],
  );

  const startContinuousAdjust = (attr: Attribute, delta: 1 | -1) => {
    adjustByDelta(attr, delta);
    stopContinuousAdjust();
    lastAdjustTimestampRef.current = performance.now();
    holdDelayRef.current = window.setTimeout(() => {
      holdTimerRef.current = window.setInterval(() => {
        const now = performance.now();
        const elapsed = now - lastAdjustTimestampRef.current;
        const steps = Math.max(1, Math.round(elapsed / CONTINUOUS_STEP_INTERVAL));
        lastAdjustTimestampRef.current = now;
        adjustByDelta(attr, delta, steps);
      }, CONTINUOUS_TICK_INTERVAL);
    }, CONTINUOUS_START_DELAY);
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
  const isUnknownDream = data.scenario === UNKNOWN_DREAM_SCENARIO_ID;
  const [isSavingUnknownDreamScript, setIsSavingUnknownDreamScript] = React.useState(false);
  const [unknownDreamScriptSaved, setUnknownDreamScriptSaved] = React.useState(false);
  const [showBeepPresetConfirm, setShowBeepPresetConfirm] = React.useState(false);
  const [showUnknownDreamTutorial, setShowUnknownDreamTutorial] = React.useState(false);
  const [unknownDreamTutorialStep, setUnknownDreamTutorialStep] = React.useState(0);

  const updateCustomStart = (updates: Partial<CharacterData['customStart']>) => {
    setUnknownDreamScriptSaved(false);
    updateData({
      customStart: {
        ...data.customStart,
        ...updates,
      },
    });
  };

  const buildUnknownDreamWorldbookContent = () => {
    const script = data.customStart.script?.trim() || '未填写';
    return `这是对于【未知梦想】剧本的自定义背景故事：\n${script}`;
  };

  const saveUnknownDreamScript = async () => {
    if (!isUnknownDream || isSavingUnknownDreamScript) return;
    setIsSavingUnknownDreamScript(true);
    setUnknownDreamScriptSaved(false);
    try {
      const charWorldbook = getCharWorldbookNames('current');
      const wbName = charWorldbook.primary;
      if (!wbName) throw new Error('worldbook not found');

      const content = buildUnknownDreamWorldbookContent();
      await updateWorldbookWith(wbName, entries =>
        entries.map(entry => {
          if (entry.uid === UNKNOWN_DREAM_UID) {
            return { ...entry, enabled: true, content };
          }
          return entry;
        }),
      );
      setUnknownDreamScriptSaved(true);
    } catch (error) {
      console.error('保存未知梦想设定失败', error);
      toastr.error('保存失败，请查看控制台');
    } finally {
      setIsSavingUnknownDreamScript(false);
    }
  };

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
      level: 1,
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
              每升 1 级额外 +5 属性点，单项上限提升到 130，且可直接输入数值分配。长按 +/- 可连续加点。
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
                const memberLevel = Math.max(1, Math.min(100, Number(member.level || 1)));
                const memberTotalAttributePoints =
                  TOTAL_ATTRIBUTE_POINTS + (memberLevel - 1) * SQUAD_LEVEL_POINTS_PER_LEVEL;
                const memberUsedPoints = Object.values(member.attributes).reduce(
                  (sum, value) => sum + (value - ATTRIBUTE_MIN),
                  0,
                );
                const memberRemainingPoints = memberTotalAttributePoints - memberUsedPoints;
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

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-white/60 mb-1">
                          {data.scenario === 'slave_master' ? '奴隶等级' : '队员等级'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={member.level || 1}
                          onChange={e =>
                            updateSquadMember(index, {
                              level: Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1)),
                            })
                          }
                          className="w-full bg-black/50 border border-white/20 rounded p-2 text-white focus:border-[#C2B280] focus:outline-none"
                        />
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
                          已分配 {memberUsedPoints} / 剩余 {memberRemainingPoints}
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
                        每位队员基础 168 点属性；等级每提升 1 级额外 +5 点（当前等级 {memberLevel}，总计{' '}
                        {memberTotalAttributePoints}
                        点）；可手动分配，或点击“随机该队员”生成。
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
        {isUnknownDream && (
          <div className="bg-black/40 border border-[#C2B280]/30 rounded-xl p-6">
            <h3 className="text-2xl font-serif text-[#C2B280] mb-4">未知梦想详细设定</h3>
            <p className="text-xs text-white/50 mb-4">
              保存按钮仅会把“自定义背景故事”写入世界书 UID749。武器/护甲等参数会用于变量，不走世界书保存。
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">自定义背景故事</label>
                <textarea
                  value={data.customStart.script}
                  onChange={e => updateCustomStart({ script: e.target.value })}
                  rows={4}
                  className="w-full resize-y rounded border border-white/20 bg-black/50 p-3 text-sm text-white focus:border-[#C2B280] focus:outline-none"
                  placeholder="写入你这次未知梦想开局的背景故事"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowBeepPresetConfirm(true)}
                    className="rounded border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:border-[#C2B280] hover:text-[#C2B280]"
                  >
                    哔噗写好的
                  </button>
                </div>
                {showBeepPresetConfirm && (
                  <div className="mt-2 rounded border border-[#C2B280]/30 bg-black/60 p-3">
                    <div className="text-xs text-white/80 mb-2">beep？确定替换当前背景故事吗？</div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowBeepPresetConfirm(false)}
                        className="rounded border border-white/20 px-3 py-1 text-xs text-white/70 hover:border-white/40"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateCustomStart({ script: BEEP_PRESET_UNKNOWN_DREAM_SCRIPT });
                          setShowBeepPresetConfirm(false);
                        }}
                        className="rounded border border-[#C2B280]/60 px-3 py-1 text-xs text-[#C2B280] hover:bg-[#C2B280]/10"
                      >
                        确定替换
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <label className="block text-sm text-white/60">自定义武器名称</label>
                    <button
                      type="button"
                      onClick={() => {
                        setUnknownDreamTutorialStep(0);
                        setShowUnknownDreamTutorial(true);
                      }}
                      className="text-xs text-[#C2B280] hover:text-[#D8C79A]"
                    >
                      【自定义教程】
                    </button>
                  </div>
                  <input
                    value={data.customStart.weaponName}
                    onChange={e => updateCustomStart({ weaponName: e.target.value })}
                    className="w-full rounded border border-white/20 bg-black/50 p-3 text-sm text-white focus:border-[#C2B280] focus:outline-none"
                    placeholder="例如：裂星刃"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">武器类型</label>
                  <select
                    value={data.customStart.weaponType}
                    onChange={e => updateCustomStart({ weaponType: e.target.value as CustomWeaponType })}
                    className="w-full rounded border border-white/20 bg-black/50 p-3 text-sm text-white focus:border-[#C2B280] focus:outline-none"
                  >
                    {UNKNOWN_DREAM_WEAPON_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">伤害骰面数</label>
                  <input
                    type="number"
                    min={1}
                    value={data.customStart.weaponDiceSides}
                    onChange={e =>
                      updateCustomStart({ weaponDiceSides: Math.max(1, parseInt(e.target.value || '1', 10)) })
                    }
                    className="w-full rounded border border-white/20 bg-black/50 p-3 text-sm text-white focus:border-[#C2B280] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">武器价值</label>
                  <input
                    type="number"
                    min={0}
                    value={data.customStart.weaponValue}
                    onChange={e => updateCustomStart({ weaponValue: Math.max(0, parseInt(e.target.value || '0', 10)) })}
                    className="w-full rounded border border-white/20 bg-black/50 p-3 text-sm text-white focus:border-[#C2B280] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">切割占比（0-1）</label>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={data.customStart.weaponCut}
                    onChange={e => {
                      const cut = Math.max(0, Math.min(1, Number(e.target.value || 0)));
                      updateCustomStart({ weaponCut: cut, weaponBlunt: Number((1 - cut).toFixed(2)) });
                    }}
                    className="w-full rounded border border-white/20 bg-black/50 p-3 text-sm text-white focus:border-[#C2B280] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">钝伤占比（0-1）</label>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={data.customStart.weaponBlunt}
                    onChange={e => {
                      const blunt = Math.max(0, Math.min(1, Number(e.target.value || 0)));
                      updateCustomStart({ weaponBlunt: blunt, weaponCut: Number((1 - blunt).toFixed(2)) });
                    }}
                    className="w-full rounded border border-white/20 bg-black/50 p-3 text-sm text-white focus:border-[#C2B280] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">武器介绍</label>
                <textarea
                  value={data.customStart.weaponDescription}
                  onChange={e => updateCustomStart({ weaponDescription: e.target.value })}
                  rows={3}
                  className="w-full resize-y rounded border border-white/20 bg-black/50 p-3 text-sm text-white focus:border-[#C2B280] focus:outline-none"
                  placeholder="这把武器的背景、外观、手感"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-white/60 mb-2">护甲类型</label>
                  <select
                    value={data.customStart.armorType}
                    onChange={e => updateCustomStart({ armorType: e.target.value as CustomArmorType })}
                    className="w-full rounded border border-white/20 bg-black/50 p-3 text-sm text-white focus:border-[#C2B280] focus:outline-none"
                  >
                    {UNKNOWN_DREAM_ARMOR_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">护甲 DR</label>
                  <input
                    type="number"
                    min={0}
                    value={data.customStart.armorDr}
                    onChange={e => updateCustomStart({ armorDr: Math.max(0, parseInt(e.target.value || '0', 10)) })}
                    className="w-full rounded border border-white/20 bg-black/50 p-3 text-sm text-white focus:border-[#C2B280] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">自定义物品（每行一条）</label>
                <textarea
                  value={data.customStart.customItems}
                  onChange={e => updateCustomStart({ customItems: e.target.value })}
                  rows={4}
                  className="w-full resize-y rounded border border-white/20 bg-black/50 p-3 text-sm text-white focus:border-[#C2B280] focus:outline-none"
                  placeholder={'例如：\n古代能量芯片\n褪色地图\n未知药剂'}
                />
              </div>

              <div className="rounded border border-white/10 bg-black/40 p-3 text-xs text-white/70 whitespace-pre-line">
                {buildUnknownDreamWorldbookContent()}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={saveUnknownDreamScript}
                  disabled={isSavingUnknownDreamScript}
                  className="rounded border border-[#C2B280]/60 px-4 py-2 text-sm text-[#C2B280] hover:bg-[#C2B280]/10 disabled:opacity-50"
                >
                  {isSavingUnknownDreamScript
                    ? '保存中...'
                    : unknownDreamScriptSaved
                      ? '已保存背景到 UID749'
                      : '保存背景故事'}
                </button>
              </div>
            </div>
          </div>
        )}

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

      {isUnknownDream && showUnknownDreamTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1px] px-4">
          <div className="w-full max-w-3xl rounded-xl border border-[#C2B280]/35 bg-black/85 p-5 md:p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-white/50">
                  自定义教程 {unknownDreamTutorialStep + 1}/{UNKNOWN_DREAM_TUTORIAL_STEPS.length}
                </div>
                <h3 className="mt-1 text-xl font-serif text-[#C2B280]">
                  {UNKNOWN_DREAM_TUTORIAL_STEPS[unknownDreamTutorialStep].title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUnknownDreamTutorial(false)}
                className="rounded border border-white/20 px-2 py-1 text-xs text-white/70 hover:border-white/40"
              >
                关闭
              </button>
            </div>

            <div className="mt-4 max-h-[55vh] overflow-auto whitespace-pre-line rounded border border-white/10 bg-black/40 p-4 text-sm leading-7 text-white/85">
              {UNKNOWN_DREAM_TUTORIAL_STEPS[unknownDreamTutorialStep].content}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setUnknownDreamTutorialStep(step => Math.max(0, step - 1))}
                disabled={unknownDreamTutorialStep === 0}
                className="rounded border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:border-white/40 disabled:opacity-40"
              >
                上一步
              </button>

              {unknownDreamTutorialStep < UNKNOWN_DREAM_TUTORIAL_STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setUnknownDreamTutorialStep(step => Math.min(UNKNOWN_DREAM_TUTORIAL_STEPS.length - 1, step + 1))
                  }
                  className="rounded border border-[#C2B280]/60 px-4 py-1.5 text-xs text-[#C2B280] hover:bg-[#C2B280]/10"
                >
                  下一步
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowUnknownDreamTutorial(false)}
                  className="rounded border border-[#C2B280]/60 px-4 py-1.5 text-xs text-[#C2B280] hover:bg-[#C2B280]/10"
                >
                  完成
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
