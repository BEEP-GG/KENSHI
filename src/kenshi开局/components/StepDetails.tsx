import React from 'react';
import { motion } from 'motion/react';
import { CharacterData, Attributes, Attribute } from '../types';
import { TRAITS, RACES, SCENARIOS } from '../data';
import { Shield, Zap, Eye, Heart, Brain, Sparkles, Activity, Minus, Plus } from 'lucide-react';

interface StepDetailsProps {
  data: CharacterData;
  updateData: (updates: Partial<CharacterData>) => void;
}

const ATTRIBUTE_CONFIG: Record<Attribute, { label: string; icon: any; desc: string }> = {
  strength: { label: '力量', icon: Shield, desc: '影响近战伤害和负重能力' },
  dexterity: { label: '敏捷', icon: Zap, desc: '影响攻击速度和格挡几率' },
  perception: { label: '感知', icon: Eye, desc: '影响远程精度和侦察能力' },
  constitution: { label: '体质', icon: Heart, desc: '影响生命值和抗击打能力' },
  willpower: { label: '意志', icon: Brain, desc: '影响精神抵抗和昏迷阈值' },
  intelligence: { label: '智力', icon: Sparkles, desc: '影响科研速度和医疗效率' },
  charisma: { label: '魅力', icon: Activity, desc: '影响交易价格和招募成功率' },
};

const TOTAL_ATTRIBUTE_POINTS = 168;
const ATTRIBUTE_MIN = 1;
const ATTRIBUTE_MAX = 50;
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
      willpower: 1,
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
      willpower: 25,
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
  意志: 'willpower',
  智力: 'intelligence',
  魅力: 'charisma',
};

export const StepDetails: React.FC<StepDetailsProps> = ({ data, updateData }) => {
  const usedPoints = (Object.values(data.attributes) as number[]).reduce((sum, value) => sum + (value - ATTRIBUTE_MIN), 0);
  const remainingPoints = TOTAL_ATTRIBUTE_POINTS - usedPoints;

  const raceAttributeBonus = React.useMemo(() => {
    const base: Record<Attribute, number> = {
      strength: 0,
      dexterity: 0,
      perception: 0,
      constitution: 0,
      willpower: 0,
      intelligence: 0,
      charisma: 0,
    };

    const selectedRace = RACES.find((race) => race.id === data.race);
    const selectedSubrace = selectedRace?.subraces.find((subrace) => subrace.id === data.subrace);
    const textSource = [selectedRace?.description ?? '', selectedSubrace?.description ?? ''].join(' ');

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
      willpower: 0,
      intelligence: 0,
      charisma: 0,
    };

    const selectedScenario = SCENARIOS.find((scenario) => scenario.id === data.scenario);
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

  React.useEffect(() => {
    attributesRef.current = data.attributes;
    remainingRef.current = remainingPoints;
  }, [data.attributes, remainingPoints]);

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
      const currentAttrs = attributesRef.current;
      const currentValue = currentAttrs[attr];

      if (delta > 0 && (currentValue >= ATTRIBUTE_MAX || remainingRef.current <= 0)) {
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
    [updateData],
  );

  const startContinuousAdjust = (attr: Attribute, delta: 1 | -1) => {
    adjustByDelta(attr, delta);
    stopContinuousAdjust();
    holdTimerRef.current = window.setInterval(() => {
      adjustByDelta(attr, delta);
    }, CONTINUOUS_INTERVAL);
  };

  const applyPreset = (presetValues: Attributes) => {
    updateData({ attributes: { ...presetValues } });
  };

  const toggleTrait = (traitId: string) => {
    const currentTraits = data.traits;
    if (currentTraits.includes(traitId)) {
      updateData({ traits: currentTraits.filter(t => t !== traitId) });
    } else if (currentTraits.length < 2) {
      updateData({ traits: [...currentTraits, traitId] });
    }
  };

  const selectedRace = RACES.find(race => race.id === data.race);
  const selectedSubrace = selectedRace?.subraces.find(subrace => subrace.id === data.subrace);
  const raceTraitSource = [selectedRace?.description ?? '', selectedSubrace?.description ?? ''].join(' ');
  const raceTraits = Array.from(new Set(raceTraitSource.match(/[^。！？\n]+（[^）]+）/g) || []));

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
              <span className="text-white/60">基础属性点：{TOTAL_ATTRIBUTE_POINTS}</span>
              <span className="text-[#C2B280] font-mono">已分配 {usedPoints} / 剩余 {remainingPoints}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ATTRIBUTE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.values)}
                  className="rounded border border-[#C2B280]/40 px-3 py-1.5 text-xs text-[#C2B280] transition-colors hover:bg-[#C2B280]/10"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-white/40">按游戏加点逻辑：默认 1 点，+1 消耗 1 点，-1 返还 1 点；单项最高 50 点。长按 +/- 可连续加点。</p>
          </div>

          <div className="space-y-4">
            {(Object.keys(data.attributes) as Attribute[]).map((attr) => {
              const config = ATTRIBUTE_CONFIG[attr];
              const Icon = config.icon;
              const value = data.attributes[attr];
              const canMinus = value > ATTRIBUTE_MIN;
              const canPlus = value < ATTRIBUTE_MAX && remainingPoints > 0;

              return (
                <div key={attr} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-white/90">
                      <Icon size={14} className="text-white/50" />
                      {config.label}
                    </label>
                    <span className="text-[#C2B280] font-mono">
                      {value}
                      {raceAttributeBonus[attr] + scenarioAttributeBonus[attr] !== 0 && (
                        <span
                          className={
                            raceAttributeBonus[attr] + scenarioAttributeBonus[attr] > 0
                              ? 'text-green-400'
                              : 'text-red-400'
                          }
                        >
                          ({
                            raceAttributeBonus[attr] + scenarioAttributeBonus[attr] > 0
                              ? `+${raceAttributeBonus[attr] + scenarioAttributeBonus[attr]}`
                              : raceAttributeBonus[attr] + scenarioAttributeBonus[attr]
                          })
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-[42px_1fr_42px] items-center gap-3">
                    <button
                      type="button"
                      onMouseDown={() => startContinuousAdjust(attr, -1)}
                      onTouchStart={(e) => {
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
                        animate={{ width: `${((value - ATTRIBUTE_MIN) / (ATTRIBUTE_MAX - ATTRIBUTE_MIN)) * 100}%` }}
                        transition={{ duration: 0.12 }}
                        className="h-full bg-[#C2B280]"
                      />
                    </div>

                    <button
                      type="button"
                      onMouseDown={() => startContinuousAdjust(attr, 1)}
                      onTouchStart={(e) => {
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

                  <p className="text-[10px] text-white/40 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {config.desc}
                  </p>
                </div>
              );
            })}
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
              {raceTraits.map((trait) => (
                <span key={trait} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white/70">
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-serif text-[#C2B280]">特质</h3>
            <span className="text-xs text-white/50">已选: {data.traits.length}/2</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TRAITS.map((trait) => (
              <button
                key={trait.id}
                onClick={() => toggleTrait(trait.id)}
                disabled={!data.traits.includes(trait.id) && data.traits.length >= 2}
                className={`
                  p-3 rounded border text-left text-sm transition-all
                  ${data.traits.includes(trait.id)
                    ? 'bg-[#C2B280]/20 border-[#C2B280] text-[#C2B280]'
                    : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed'}
                `}
              >
                <div className="font-bold mb-1">{trait.title}</div>
                <div className="text-[10px] opacity-70">{trait.description}</div>
              </button>
            ))}
          </div>
          <div className="mt-4">
            <label className="block text-sm text-white/60 mb-2">自定义特质（可选）</label>
            <textarea
              value={data.customTraits || ''}
              onChange={(e) => updateData({ customTraits: e.target.value })}
              rows={3}
              className="w-full resize-y rounded border border-white/20 bg-black/50 p-3 text-sm text-white focus:border-[#C2B280] focus:outline-none"
              placeholder="例如：坚韧意志（对恐惧免疫）、机械狂热（修理速度+10%）..."
            />
          </div>
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
                onChange={(e) => updateData({ name: e.target.value })}
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
                  onChange={(e) => updateData({ gender: e.target.value as any })}
                  className="w-full bg-black/50 border border-white/20 rounded p-3 text-white focus:border-[#C2B280] focus:outline-none"
                >
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">年龄</label>
                <input
                  type="number"
                  min="16"
                  max="100"
                  value={data.age}
                  onChange={(e) => updateData({ age: parseInt(e.target.value) })}
                  className="w-full bg-black/50 border border-white/20 rounded p-3 text-white focus:border-[#C2B280] focus:outline-none"
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
                  onChange={(e) => updateData({ appearance: { ...data.appearance, eyes: e.target.value } })}
                  className="w-full bg-black/50 border border-white/20 rounded p-3 text-white focus:border-[#C2B280] focus:outline-none"
                  placeholder="例如：金色竖瞳"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">发色</label>
                <input
                  type="text"
                  value={data.appearance.hairColor}
                  onChange={(e) => updateData({ appearance: { ...data.appearance, hairColor: e.target.value } })}
                  className="w-full bg-black/50 border border-white/20 rounded p-3 text-white focus:border-[#C2B280] focus:outline-none"
                  placeholder="例如：黑色、银白、赤红"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">体态</label>
                <input
                  type="text"
                  value={data.appearance.bodyType}
                  onChange={(e) => updateData({ appearance: { ...data.appearance, bodyType: e.target.value } })}
                  className="w-full bg-black/50 border border-white/20 rounded p-3 text-white focus:border-[#C2B280] focus:outline-none"
                  placeholder="例如：瘦高、健壮、魁梧"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">发型</label>
                <input
                  type="text"
                  value={data.appearance.hairStyle}
                  onChange={(e) => updateData({ appearance: { ...data.appearance, hairStyle: e.target.value } })}
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
                onChange={(e) => updateData({ appearance: { ...data.appearance, height: parseInt(e.target.value) } })}
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
                onChange={(e) => updateData({ appearance: { ...data.appearance, description: e.target.value } })}
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
