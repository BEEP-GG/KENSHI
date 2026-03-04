import React from 'react';
import { motion } from 'motion/react';
import { waitUntil } from 'async-wait-until';
import { CharacterData } from '../types';
import { SCENARIOS, REGIONS, RACES, TRAITS } from '../data';

interface FinalSummaryProps {
  data: CharacterData;
}

export const FinalSummary: React.FC<FinalSummaryProps> = ({ data }) => {
  const [saved, setSaved] = React.useState(false);
  const [isStarting, setIsStarting] = React.useState(false);

  const scenario = SCENARIOS.find(s => s.id === data.scenario);
  const region = REGIONS.find(r => r.id === data.region);
  const race = RACES.find(r => r.id === data.race);
  const subrace = race?.subraces.find(s => s.id === data.subrace);

  const attributeLabels: Record<keyof CharacterData['attributes'], string> = {
    strength: '力量',
    dexterity: '敏捷',
    perception: '感知',
    constitution: '体质',
    willpower: '意志',
    intelligence: '智力',
    charisma: '魅力',
  };

  const traitText = data.traits
    .map(traitId => {
      const trait = TRAITS.find(t => t.id === traitId);
      return trait ? `${trait.title}：${trait.description}` : traitId;
    })
    .concat(data.customTraits ? [data.customTraits] : [])
    .join('；');

  const raceTraitSource = [race?.description ?? '', subrace?.description ?? ''].join(' ');
  const raceTraits = Array.from(new Set(raceTraitSource.match(/[^。！？\n]+（[^）]+）/g) || []));


  const buildTraitsRecord = () => {
    const traits: Record<string, string> = {};
    data.traits.forEach(traitId => {
      const trait = TRAITS.find(t => t.id === traitId);
      if (trait) {
        traits[trait.title] = trait.description;
      }
    });
    if (data.customTraits) {
      traits['自定义特质'] = data.customTraits;
    }
    return traits;
  };

  const buildEquipmentSummary = () => {
    const equipmentList = scenario?.equipment ?? [];
    const weaponItem = equipmentList.find(item => /刀|剑|棒|斧|弓|弩|锤|枪/.test(item));
    const armorItem = equipmentList.find(item => /衣|甲|护|裤|靴|袍|盔/.test(item));
    return {
      主武器: {
        名字: weaponItem ?? '无',
        种类: weaponItem ? '武器' : '无',
        品质: '普通',
        介绍: weaponItem ?? '',
        伤害骰: '1d4',
        伤害类型: '钝伤:1.0',
        特效: {},
        价值: 0,
      },
      副武器: {
        名字: '无',
        种类: '无',
        品质: '普通',
        介绍: '',
        伤害骰: '1d4',
        伤害类型: '钝伤:1.0',
        特效: {},
        价值: 0,
      },
      护甲: {
        种类: armorItem ?? '无',
        '防护能力(DR)': 0,
        介绍: armorItem ?? '',
        特性: {},
      },
      背包物品: equipmentList.filter(item => item !== weaponItem && item !== armorItem),
    };
  };

  const buildAttributesRecord = () => ({
    STR: { 基础: data.attributes.strength, 加成: 0 },
    DEX: { 基础: data.attributes.dexterity, 加成: 0 },
    PER: { 基础: data.attributes.perception, 加成: 0 },
    TGH: { 基础: data.attributes.constitution, 加成: 0 },
    WIL: { 基础: data.attributes.willpower, 加成: 0 },
    INT: { 基础: data.attributes.intelligence, 加成: 0 },
    CHA: { 基础: data.attributes.charisma, 加成: 0 },
  });

  const updateMvuVariables = async (messageId: number | 'latest' = getCurrentMessageId()) => {
    await waitGlobalInitialized('Mvu');
    await waitUntil(() => _.has(getVariables({ type: 'message', message_id: messageId }), 'stat_data'));

    const mvuData = Mvu.getMvuData({ type: 'message', message_id: messageId });
    const equipment = buildEquipmentSummary();

    _.set(mvuData, 'stat_data.当前角色.id', data.name || '无名氏');
    _.set(mvuData, 'stat_data.当前角色.性别', data.gender === 'male' ? '男' : data.gender === 'female' ? '女' : '其他');
    _.set(mvuData, 'stat_data.当前角色.年龄', data.age);
    _.set(mvuData, 'stat_data.当前角色.外貌', data.appearance.description || '');
    _.set(mvuData, 'stat_data.当前角色.体型', `${(data.appearance.height / 100).toFixed(2)}m`);
    _.set(mvuData, 'stat_data.当前角色.种族.名称', race?.title || '人类');
    _.set(mvuData, 'stat_data.当前角色.属性', buildAttributesRecord());
    _.set(mvuData, 'stat_data.当前角色.特质', buildTraitsRecord());
    _.set(mvuData, 'stat_data.当前角色.主武器', equipment.主武器);
    _.set(mvuData, 'stat_data.当前角色.副武器', equipment.副武器);
    _.set(mvuData, 'stat_data.当前角色.护甲', equipment.护甲);

    if (equipment.背包物品.length > 0) {
      const backpackItems: Record<string, { 介绍: string; 数量: number; 重量: number; 价值: number }> = {};
      equipment.背包物品.forEach(item => {
        backpackItems[item] = { 介绍: item, 数量: 1, 重量: 0, 价值: 0 };
      });
      _.set(mvuData, 'stat_data.当前角色.背包.物品', backpackItems);
    }

    _.set(mvuData, 'stat_data.世界.区域', region?.title || data.region || '未知区域');
    _.set(mvuData, 'stat_data.世界.城镇', data.town || '未知城镇');
    _.set(mvuData, 'stat_data.世界.金钱', scenario?.money ?? 0);

    const hostileFactions = (scenario as any)?.hostileFactions ?? [];
    const alliedFactions = (scenario as any)?.alliedFactions ?? [];
    const hostility: Record<string, string> = {};
    const allies: Record<string, string> = {};
    hostileFactions.forEach((name: string) => {
      hostility[name] = '敌对';
    });
    alliedFactions.forEach((name: string) => {
      allies[name] = '友好';
    });
    _.set(mvuData, 'stat_data.局势.敌对派系', hostility);
    _.set(mvuData, 'stat_data.局势.友方派系', allies);
    if (hostileFactions.length > 0 || alliedFactions.length > 0) {
      _.set(
        mvuData,
        'stat_data.局势.世界局势',
        `${hostileFactions.length > 0 ? `敌对：${hostileFactions.join('、')}` : ''}${
          hostileFactions.length > 0 && alliedFactions.length > 0 ? '；' : ''
        }${alliedFactions.length > 0 ? `友方：${alliedFactions.join('、')}` : ''}`,
      );
    }

    await Mvu.replaceMvuData(mvuData, { type: 'message', message_id: messageId });
  };

  const buildStartPrompt = () => {
    const equipmentList = scenario?.equipment ?? [];
    const lines: string[] = [];
    const attributeLine = Object.entries(data.attributes)
      .map(([key, value]) => `${attributeLabels[key as keyof CharacterData['attributes']]}=${value}`)
      .join('，');
    lines.push('请根据以下角色与开局信息，生成一段开场剧情：');
    lines.push(`角色名：${data.name || '无名氏'}`);
    lines.push(`性别：${data.gender === 'male' ? '男' : data.gender === 'female' ? '女' : '其他'}`);
    lines.push(`年龄：${data.age}`);
    lines.push(`种族：${race?.title || '未选择'}${subrace?.title ? ` - ${subrace.title}` : ''}`);
    lines.push(`开局剧本：${scenario?.title || '未选择'}`);
    lines.push(`初始装备：${equipmentList.length > 0 ? equipmentList.join('、') : '无'}`);
    lines.push(`初始资金：${scenario?.money ?? 0} c`);
    lines.push(`出生区域：${region?.title || '未知区域'}`);
    lines.push(`城镇：${data.town || '未知城镇'}`);
    lines.push(`特质：${traitText || '无'}`);
    lines.push(`七维属性（以此为准，不得自行改动）：${attributeLine || '无'}`);
    lines.push(
      `外貌描述：${data.appearance.description || '无'}；身高 ${(data.appearance.height / 100).toFixed(2)}m；体态 ${
        data.appearance.bodyType || '无'
      }；眼睛 ${data.appearance.eyes || '无'}；发型 ${data.appearance.hairStyle || '无'}；发色 ${
        data.appearance.hairColor || '无'
      }`,
    );
    lines.push('要求：以第二人称叙事，节奏明快，给出明确的当前处境与可推进的动作；禁止在剧情中虚构或修改属性数值。');
    return lines.join('\n');
  };

  const exitFrontend = () => {
    const iframe = window.frameElement as HTMLElement | null;
    if (iframe?.parentElement) {
      iframe.parentElement.removeChild(iframe);
      return;
    }
    window.close();
  };

  const handleStart = async () => {
    if (isStarting) return;
    setIsStarting(true);
    await updateMvuVariables();
    const startText = await generate({ user_input: buildStartPrompt(), should_silence: true });
    await createChatMessages([{ role: 'assistant', message: startText }], { insert_before: 'end' });
    await updateMvuVariables('latest');
    setSaved(true);
    exitFrontend();
  };

  return (
    <div className="h-full flex flex-col items-center justify-center max-w-3xl mx-auto text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-black/60 border border-[#C2B280] p-10 rounded-2xl shadow-[0_0_50px_rgba(194,178,128,0.1)] w-full relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C2B280] to-transparent opacity-50" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C2B280] to-transparent opacity-50" />

        <h2 className="text-5xl font-serif text-[#C2B280] mb-2">角色已创建</h2>
        <p className="text-white/50 font-serif tracking-widest uppercase mb-10">准备进入废土</p>

        <div className="grid grid-cols-2 gap-8 text-left mb-10">
          <div className="space-y-4">
            <div>
              <span className="text-xs uppercase text-white/40 tracking-wider">姓名</span>
              <div className="text-xl font-serif text-white">{data.name || '无名氏'}</div>
            </div>
            <div>
              <span className="text-xs uppercase text-white/40 tracking-wider">种族</span>
              <div className="text-lg text-white/80">
                {race?.title}
                {subrace?.title ? ` - ${subrace.title}` : ''}
              </div>
            </div>
            <div>
              <span className="text-xs uppercase text-white/40 tracking-wider">开局</span>
              <div className="text-lg text-white/80">{scenario?.title}</div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <span className="text-xs uppercase text-white/40 tracking-wider">出生地</span>
              <div className="text-lg text-white/80">{region?.title}</div>
            </div>
            <div>
              <span className="text-xs uppercase text-white/40 tracking-wider">城镇</span>
              <div className="text-lg text-white/80">{data.town || '荒野'}</div>
            </div>
            <div>
              <span className="text-xs uppercase text-white/40 tracking-wider">主要特质</span>
              <div className="flex gap-2 mt-1 flex-wrap">
                {data.traits.map(t => {
                  const trait = TRAITS.find(item => item.id === t);
                  return (
                    <span key={t} className="px-2 py-1 bg-white/10 rounded text-xs text-[#C2B280]">
                      {trait?.title ?? t}
                    </span>
                  );
                })}
                {data.customTraits && (
                  <span className="px-2 py-1 bg-white/10 rounded text-xs text-[#C2B280]">自定义特质</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={isStarting}
          className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#C2B280] text-black font-bold font-serif tracking-wider rounded transition-all hover:bg-[#d4c490] hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isStarting ? '启程中...' : saved ? '已启程' : '启程'}
        </button>

        <p className="mt-4 text-xs text-white/30">点击启程后会生成开场剧情并退出前端界面。</p>
      </motion.div>
    </div>
  );
};
