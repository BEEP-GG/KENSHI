import waitFor from 'async-wait-until';
import _ from 'lodash';
import { CheckCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Dashboard from './components/Dashboard';
import type { RolledEventPayload } from './components/Events';
import Events from './components/Events';
import Facilities from './components/Facilities';
import Modal from './components/Modal';
import Outposts from './components/Outposts';
import Personnel from './components/Personnel';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import { FACILITY_BLUEPRINTS, initialGameState } from './data';
import { Employee, EmployeeStats, Facility, GameEvent, GameState, Outpost, TabState } from './types';

const DEFAULT_EMPLOYEE_STATS: EmployeeStats = {
  力量: 10,
  敏捷: 10,
  感知: 10,
  体质: 10,
  智力: 10,
  意志: 10,
  魅力: 10,
};

const NPC_ATTRIBUTE_KEYS: Array<keyof EmployeeStats> = ['力量', '敏捷', '感知', '体质', '智力', '意志', '魅力'];

const NPC_LEVEL_BASELINES = [
  { level: 1, value: 25 },
  { level: 10, value: 32 },
  { level: 20, value: 39 },
  { level: 30, value: 46 },
  { level: 40, value: 58 },
  { level: 50, value: 68 },
  { level: 60, value: 75 },
  { level: 70, value: 83 },
  { level: 80, value: 90 },
  { level: 90, value: 97 },
  { level: 100, value: 105 },
] as const;

const NPC_WEAPON_QUALITY_RULES = {
  垃圾: { 浮动: [-5, 0] as const, 品牌名: ['垃圾'], 描述: '这把武器有几百年历史，任何可识别的标记早已生锈。' },
  劣质品: { 浮动: [-2, 2] as const, 品牌名: ['废品'], 描述: '没有特定名字，通常指代那些粗制滥造但还能用的武器。' },
  标准级: {
    浮动: [1, 5] as const,
    品牌名: ['古人', '开顿废品大师', '达摩制式', '骨人铁匠'],
    描述池: [
      '来自旧帝国时期，被重新打磨，仍保持良好优势。',
      '质量不错，遍布大陆，是现代武器生产者的基础产品。',
      '对于生锈的东西来说惊人的锋利，是沙克族的基础制式武器。',
      '来自黑色沙漠城的骨人刀刃，传遍大陆。',
    ],
  },
  高级: {
    浮动: [6, 12] as const,
    品牌名: ['达摩精锻', '开顿豪华铸剑师', '圣火精炼', '刃行者'],
    描述池: [
      '赤铜达摩耗费优质矿石铸造的沙克精锐武器。',
      '为贵族显摆而造，华丽。',
      '由圣国最好的工匠打造。',
      '古代帝国铁匠的遗作，质量远超现代武器。',
    ],
  },
} as const;

const NPC_WEAPON_TYPE_BASES = {
  武士刀类: { 基础伤害骰: '1d14', 基础伤害类型: '切割:0.9/钝伤:0.1' },
  砍刀类: { 基础伤害骰: '1d8', 基础伤害类型: '切割:0.4/钝伤:0.6' },
  钝器类: { 基础伤害骰: '1d6', 基础伤害类型: '切割:0.2/钝伤:0.8' },
  长柄类: { 基础伤害骰: '1d10', 基础伤害类型: '切割:0.7/钝伤:0.3' },
  大型类: { 基础伤害骰: '1d12', 基础伤害类型: '切割:0.4/钝伤:0.6' },
  军刀类: { 基础伤害骰: '1d10', 基础伤害类型: '切割:0.5/钝伤:0.5' },
  弩: { 基础伤害骰: '1d14', 基础伤害类型: '切割:0.2/钝伤:0.8' },
  弓: { 基础伤害骰: '1d10', 基础伤害类型: '切割:0.6/钝伤:0.4' },
} as const;

const NPC_WEAPON_LIBRARY = {
  武士刀类: [
    { 名称: '长卷刀', 伤害骰: '1d8', 伤害类型: '切割:0.6/钝伤:0.4' },
    { 名称: '忍者之刃', 伤害骰: '1d8', 伤害类型: '切割:0.7/钝伤:0.3' },
    { 名称: '无锷武士刀', 伤害骰: '1d12', 伤害类型: '切割:0.8/钝伤:0.2' },
    { 名称: '武士刀', 伤害骰: '1d16', 伤害类型: '切割:0.9/钝伤:0.1' },
    { 名称: '胁差', 伤害骰: '1d10', 伤害类型: '切割:0.65/钝伤:0.35' },
    { 名称: '野太刀', 伤害骰: '1d14', 伤害类型: '切割:0.65/钝伤:0.35' },
  ],
  军刀类: [
    { 名称: '长剑', 伤害骰: '1d8', 伤害类型: '切割:0.6/钝伤:0.4' },
    { 名称: '九环刀', 伤害骰: '1d8', 伤害类型: '切割:0.7/钝伤:0.3' },
    { 名称: '沙漠军刀', 伤害骰: '1d10', 伤害类型: '切割:0.5/钝伤:0.5' },
    { 名称: '异域军刀', 伤害骰: '1d10', 伤害类型: '切割:0.4/钝伤:0.6' },
    { 名称: '开孔军刀', 伤害骰: '1d12', 伤害类型: '切割:0.65/钝伤:0.35' },
    { 名称: '斩马军刀', 伤害骰: '1d10', 伤害类型: '切割:0.75/钝伤:0.25' },
  ],
  砍刀类: [
    { 名称: '战斗砍刀', 伤害骰: '1d10', 伤害类型: '切割:0.7/钝伤:0.3' },
    { 名称: '血肉砍刀', 伤害骰: '1d10', 伤害类型: '切割:0.8/钝伤:0.2' },
    { 名称: '长砍刀', 伤害骰: '1d12', 伤害类型: '切割:0.75/钝伤:0.25' },
    { 名称: '月刃刀', 伤害骰: '1d14', 伤害类型: '切割:0.6/钝伤:0.4' },
    { 名称: '圣骑士十字剑', 伤害骰: '1d10', 伤害类型: '切割:0.5/钝伤:0.5' },
  ],
  长柄类: [
    { 名称: '杖', 伤害骰: '1d6', 伤害类型: '切割:0.1/钝伤:0.9' },
    { 名称: '长柄刀', 伤害骰: '1d10', 伤害类型: '切割:0.8/钝伤:0.2' },
    { 名称: '长柄武士刀', 伤害骰: '1d14', 伤害类型: '切割:0.7/钝伤:0.3' },
    { 名称: '重型长柄刀', 伤害骰: '1d12', 伤害类型: '切割:0.7/钝伤:0.3' },
  ],
  钝器类: [
    { 名称: '棍棒', 伤害骰: '1d6', 伤害类型: '切割:0.0/钝伤:1.0' },
    { 名称: '铁棒', 伤害骰: '1d10', 伤害类型: '切割:0.05/钝伤:0.95' },
    { 名称: '十手', 伤害骰: '1d8', 伤害类型: '切割:0.1/钝伤:0.9' },
    { 名称: '钉头棒', 伤害骰: '1d12', 伤害类型: '切割:0.2/钝伤:0.8' },
    { 名称: '重型十手', 伤害骰: '1d10', 伤害类型: '切割:0.0/钝伤:1.0' },
  ],
  大型类: [
    { 名称: '放逐平板剑', 伤害骰: '1d12', 伤害类型: '切割:0.5/钝伤:0.5' },
    { 名称: '牛角斧', 伤害骰: '1d18', 伤害类型: '切割:0.4/钝伤:0.6' },
    { 名称: '分段斧', 伤害骰: '1d14', 伤害类型: '切割:0.6/钝伤:0.4' },
    { 名称: '平板剑', 伤害骰: '1d12', 伤害类型: '切割:0.5/钝伤:0.5' },
    { 名称: '落日', 伤害骰: '1d20', 伤害类型: '切割:0.3/钝伤:0.7' },
  ],
  弩: [
    { 名称: '牙签弩', 伤害骰: '1d10', 伤害类型: '破甲:0.2/切割:0.8' },
    { 名称: '废品弩', 伤害骰: '1d12', 伤害类型: '破甲:0.3/切割:0.7' },
    { 名称: '旧世界弩Mk1', 伤害骰: '1d12', 伤害类型: '破甲:0.3/切割:0.7' },
    { 名称: '旧世界弩Mk2', 伤害骰: '1d10', 伤害类型: '破甲:0.6/切割:0.4' },
    { 名称: '鹰之十字弩', 伤害骰: '1d16', 伤害类型: '破甲:0.8/切割:0.2' },
  ],
  弓: [
    { 名称: '短弓', 伤害骰: '1d8', 伤害类型: '破甲:0.2/切割:0.8' },
    { 名称: '长弓', 伤害骰: '1d10', 伤害类型: '破甲:0.3/切割:0.7' },
    { 名称: '猎人弓', 伤害骰: '1d12', 伤害类型: '破甲:0.4/切割:0.6' },
    { 名称: '巨弓', 伤害骰: '1d16', 伤害类型: '破甲:0.4/切割:0.6' },
  ],
  武术: [{ 名称: '武术', 伤害骰: '1d10', 伤害类型: '钝伤:0.8/切割:0.2' }],
  盾牌: [{ 名称: '盾牌', 伤害骰: '1d8', 伤害类型: '钝伤:1.0' }],
} as const;

const NPC_ARMOR_RULES = {
  轻甲: {
    描述: '主要由布料、皮革制成，更接近于服装而非铠甲。它能提供的保护有限，但不影响灵活性，甚至能强化特定能力。',
    DR范围: [0, 12] as const,
    装备池: [
      { 名字: '僧袍', 描述: '僧人的基础服装，简单朴素，便于劳作。' },
      { 名字: '贵族长袍', 描述: '由丝绸和精美布料制成，是联合城贵族的身份象征。' },
      { 名字: '防尘外衣', 描述: '高而厚的衣领能保护穿着人的颈部。' },
      { 名字: '冒险者铠甲', 描述: '由皮革、布料和少量金属片拼接而成。' },
      { 名字: '武术家军用衬衫', 描述: '类似多种武术风格的上身制服，便于活动。' },
      { 名字: '刺客裹身布', 描述: '绕在脖子和肩膀上的松散破布，局部有金属板保护。' },
      { 名字: '风衣', 描述: '由浅棕色皮革制成，拥有高大的衣领与皮带固定结构。' },
    ],
  },
  中甲: {
    描述: '通常是厚实的衣物内衬链甲，或质量尚可的板甲部件。它在防护和灵活性之间取得了平衡。',
    DR范围: [12, 28] as const,
    装备池: [
      { 名字: '人皮铠甲', 描述: '由食人族或者人皮土匪用受害者皮肤鞣制而成。' },
      { 名字: '金属夹克', 描述: '时髦的黑色皮质夹克，胸部和肩膀装有宽大金属板。' },
      { 名字: '武士布衣', 描述: '联合城武士在铠甲下穿着的厚布衣，内衬链甲。' },
      { 名字: '锁子甲衬衫', 描述: '由金属环编织而成的衬衫，可单穿或作为内衬。' },
      { 名字: '放切割夹克', 描述: '一件包裹胸腹与前臂的厚实全身皮甲。' },
      { 名字: '装甲布', 描述: '厚披肩与金属臂甲组合，胸前固定两块金属板。' },
    ],
  },
  重甲: {
    描述: '由大块的金属板材锻造而成，能提供顶级物理防护，代价是牺牲机动性。',
    DR范围: [28, 48] as const,
    装备池: [
      { 名字: '流浪武士铠甲', 描述: '主要由钢制成，具有多段夹板甲与独立胸甲。' },
      { 名字: '废铁盔甲', 描述: '一大块覆盖整个上半身的棕色废金属。' },
      { 名字: '非神圣胸甲', 描述: '由几块相互重叠的金属片组成，覆盖胸腹与大腿上部。' },
      { 名字: '护心镜', 描述: '两片被锻造成保护肩膀与心脏形状的金属片。' },
    ],
  },
} as const;

type NpcWeaponKind = keyof typeof NPC_WEAPON_LIBRARY;
type NpcWeaponQuality = keyof typeof NPC_WEAPON_QUALITY_RULES;
type NpcArmorKind = keyof typeof NPC_ARMOR_RULES;

const parseDamageDice = (damageDice: string) => {
  const match = damageDice.match(/^(\d+)d(\d+)$/i);
  if (!match) {
    return { 骰子数: 1, 面数: 4 };
  }
  return {
    骰子数: Math.max(1, Number(match[1]) || 1),
    面数: Math.max(1, Number(match[2]) || 4),
  };
};

const formatDamageDice = (diceCount: number, diceSides: number) =>
  `${Math.max(1, diceCount)}d${Math.max(1, diceSides)}`;

const rollNpcWeaponQuality = (level: number): NpcWeaponQuality => {
  const roll = Math.random();
  if (level >= 80) {
    if (roll < 0.4) return '高级';
    if (roll < 0.85) return '标准级';
    return '劣质品';
  }
  if (level >= 50) {
    if (roll < 0.2) return '高级';
    if (roll < 0.75) return '标准级';
    if (roll < 0.95) return '劣质品';
    return '垃圾';
  }
  if (level >= 20) {
    if (roll < 0.5) return '标准级';
    if (roll < 0.85) return '劣质品';
    return '垃圾';
  }
  return roll < 0.65 ? '劣质品' : '垃圾';
};

const applyWeaponQualityToDice = (damageDice: string, quality: NpcWeaponQuality) => {
  const { 骰子数, 面数 } = parseDamageDice(damageDice);
  const [minOffset, maxOffset] = NPC_WEAPON_QUALITY_RULES[quality].浮动;
  const offset = _.random(minOffset, maxOffset);
  return formatDamageDice(骰子数, Math.max(2, 面数 + offset));
};

const createNpcWeapon = (kind: NpcWeaponKind, preferredQuality?: NpcWeaponQuality, level: number = 1) => {
  const weaponPool = NPC_WEAPON_LIBRARY[kind];
  const baseWeapon = weaponPool[_.random(0, weaponPool.length - 1)];
  const quality = preferredQuality || rollNpcWeaponQuality(level);
  const qualityRule = NPC_WEAPON_QUALITY_RULES[quality];
  const qualityName = qualityRule.品牌名[_.random(0, qualityRule.品牌名.length - 1)];
  const qualityDescription =
    '描述池' in qualityRule ? qualityRule.描述池[_.random(0, qualityRule.描述池.length - 1)] : qualityRule.描述;

  return {
    名字: `${qualityName}${baseWeapon.名称}`,
    种类: kind,
    品质: quality,
    介绍: qualityDescription,
    伤害骰: applyWeaponQualityToDice(baseWeapon.伤害骰, quality),
    伤害类型: baseWeapon.伤害类型,
    价值: 0,
    重量: 1,
  };
};

const rollNpcArmorKind = (level: number): NpcArmorKind => {
  const roll = Math.random();
  if (level >= 70) {
    if (roll < 0.45) return '重甲';
    if (roll < 0.85) return '中甲';
    return '轻甲';
  }
  if (level >= 35) {
    if (roll < 0.2) return '重甲';
    if (roll < 0.7) return '中甲';
    return '轻甲';
  }
  return roll < 0.75 ? '轻甲' : '中甲';
};

const createNpcArmor = (preferredKind?: NpcArmorKind, level: number = 1) => {
  const kind = preferredKind || rollNpcArmorKind(level);
  const rule = NPC_ARMOR_RULES[kind];
  const baseArmor = rule.装备池[_.random(0, rule.装备池.length - 1)];
  const [minDr, maxDr] = rule.DR范围;
  const levelBias = level >= 70 ? 0.85 : level >= 40 ? 0.65 : level >= 20 ? 0.45 : 0.25;
  const dr = _.clamp(Math.round(minDr + (maxDr - minDr) * levelBias + _.random(-2, 2)), minDr, maxDr);

  return {
    名字: baseArmor.名字,
    种类: kind,
    '防护能力(DR)': dr,
    介绍: baseArmor.描述,
    价值: 0,
    重量: kind === '重甲' ? 3 : kind === '中甲' ? 2 : 1,
  };
};

type SightNpcGenerationProfile = {
  名字: string;
  等级: number;
  身份?: string;
  种族?: string;
  派系?: string;
  立场?: '友方' | '中立' | '敌方';
  所处地址?: string;
};

const getNpcBaselineAttribute = (level: number) => {
  const safeLevel = _.clamp(Math.round(level || 1), 1, 100);
  const exactMatch = NPC_LEVEL_BASELINES.find(item => item.level === safeLevel);
  if (exactMatch) {
    return exactMatch.value;
  }

  const upper =
    NPC_LEVEL_BASELINES.find(item => item.level >= safeLevel) || NPC_LEVEL_BASELINES[NPC_LEVEL_BASELINES.length - 1];
  const lower = [...NPC_LEVEL_BASELINES].reverse().find(item => item.level <= safeLevel) || NPC_LEVEL_BASELINES[0];

  if (upper.level === lower.level) {
    return lower.value;
  }

  const ratio = (safeLevel - lower.level) / (upper.level - lower.level);
  return Math.round(lower.value + (upper.value - lower.value) * ratio);
};

const generateAliveNpcStats = (level: number): EmployeeStats => {
  const baseline = getNpcBaselineAttribute(level);
  const variance = level > 40 ? 15 : 5;
  const offsets = _.shuffle(_.range(-variance, variance + 1)).slice(0, NPC_ATTRIBUTE_KEYS.length);

  const normalizedOffsets = offsets.map((offset, index, source) => {
    let nextOffset = offset;
    while (source.slice(0, index).includes(nextOffset) && nextOffset < variance) {
      nextOffset += 1;
    }
    while (source.slice(0, index).includes(nextOffset) && nextOffset > -variance) {
      nextOffset -= 1;
    }
    return nextOffset;
  });

  return NPC_ATTRIBUTE_KEYS.reduce(
    (result, key, index) => {
      result[key] = Math.max(1, baseline + (normalizedOffsets[index] ?? 0));
      return result;
    },
    { ...DEFAULT_EMPLOYEE_STATS },
  );
};

const buildNpcAttributeVariable = (level: number) => {
  const stats = generateAliveNpcStats(level);
  return Object.fromEntries(NPC_ATTRIBUTE_KEYS.map(key => [key, { 基础: stats[key], 加成: 0 }]));
};

const createSightNpcSkeleton = (profile: SightNpcGenerationProfile) => {
  const level = _.clamp(Math.round(profile.等级 || 1), 1, 100);
  const armor = createNpcArmor(undefined, level);
  const primaryWeaponKinds = _.without(Object.keys(NPC_WEAPON_LIBRARY), '武术', '盾牌') as NpcWeaponKind[];
  const primaryWeaponKind = primaryWeaponKinds[_.random(0, primaryWeaponKinds.length - 1)] || '军刀类';
  const secondaryWeaponKind = _.sample(['武术', '盾牌', '钝器类', '军刀类'] as NpcWeaponKind[]) || '武术';
  const primaryWeapon = createNpcWeapon(primaryWeaponKind, undefined, level);
  const hasSecondaryWeapon = Math.random() < 0.1;
  const secondaryWeapon = hasSecondaryWeapon
    ? createNpcWeapon(secondaryWeaponKind, undefined, level)
    : {
        名字: '',
        种类: '无',
        品质: '普通',
        介绍: '',
        伤害骰: '1d4',
        伤害类型: '钝伤:1.0',
        价值: 0,
        重量: 0,
      };
  const stats = generateAliveNpcStats(level);
  const maxHp = Math.floor(100 + stats.体质 * 2 + level * 1.5);

  return {
    名字: profile.名字,
    身份: profile.身份 || '流浪者',
    种族: { 名称: profile.种族 || '人类' },
    派系: profile.派系 || '中立',
    立场: profile.立场 || '中立',
    等级: level,
    状态: '正常',
    血量: {
      当前: maxHp,
      最大: maxHp,
    },
    主武器: primaryWeapon,
    副武器: secondaryWeapon,
    护甲: armor,
    属性: Object.fromEntries(NPC_ATTRIBUTE_KEYS.map(key => [key, { 基础: stats[key], 加成: 0 }])),
    所处地址: profile.所处地址 || '未知',
  };
};

const BANDIT_NAME_POOL = ['鬣狗', '断齿', '砂手', '瘦狼', '铁耳', '灰眼', '秃鹫', '裂嘴'];

const createBanditInvasionNpcs = (regionName: string) => {
  const count = _.random(3, 5);
  return Object.fromEntries(
    _.range(count).map(index => {
      const baseName = BANDIT_NAME_POOL[index % BANDIT_NAME_POOL.length] || `土匪${index + 1}`;
      const npc = createSightNpcSkeleton({
        名字: `${baseName}${index + 1}`,
        等级: 30,
        身份: '土匪',
        种族: '人类',
        派系: '无',
        立场: '敌方',
        所处地址: regionName,
      });
      return [npc.名字, npc];
    }),
  );
};

const appendTriggeredEventSight = (mvuData: any, state: GameState) => {
  const squadMap = _.get(mvuData, 'stat_data.小队成员', {});
  const firstSquadKey = Object.keys(squadMap)[0];
  if (!firstSquadKey) {
    return mvuData;
  }

  const currentOutpost = state.outposts.find(outpost => outpost.id === state.currentOutpostId) || state.outposts[0];
  const regionName = currentOutpost?.location || '未知区域';
  const currentSight = _.get(mvuData, ['stat_data', '小队成员', firstSquadKey, '视野'], {});
  const pendingInvasion = state.events.find(event => event.title.includes('入侵') && (event.target || 0) <= 0);

  if (pendingInvasion) {
    const invasionNpcs = createBanditInvasionNpcs(regionName);
    _.set(mvuData, ['stat_data', '小队成员', firstSquadKey, '视野'], {
      ...currentSight,
      ...invasionNpcs,
    });
  }

  return mvuData;
};

const ensurePendingEvent = (events: GameEvent[], input: PendingEventInput) => {
  if (events.some(event => event.title === input.title && !event.resolved)) {
    return events;
  }

  return [
    {
      id: `evt-${Date.now()}`,
      title: input.title,
      description: input.description,
      rollRequired: true,
      type: input.type,
      resolved: false,
      target: input.target,
    },
    ...events,
  ];
};

const FACILITY_CATEGORY_HINTS: Record<string, string[]> = {
  'defensive-gate': ['大门'],
  'defensive-wall': ['墙'],
  turret: ['炮塔', '弩'],
  'cooking-stove': ['烹饪', '炉', '生火'],
  'stone-mine': ['采石'],
  'ore-drill': ['矿', '钻'],
  'steel-refinery': ['炼钢'],
  'imprisonment-cage': ['囚笼', '囚犯'],
  'research-bench': ['研究'],
  'grain-silo': ['面粉', '面包', '碾磨'],
  brewery: ['酒', '酿造'],
  'hydroponic-hemp': ['麻叶', '水培', '温室'],
  'hashish-production': ['大麻膏'],
  'iron-refinery': ['铁'],
  'stone-processor': ['建材', '石材加工'],
  'fabric-loom': ['布料', '织机'],
  'tanning-bench': ['皮革'],
  'electronics-bench': ['电子'],
  'armor-smithy': ['甲', '衣物'],
  'weapon-smithy': ['武器', '铁匠'],
};

const normalizeValue = (value: unknown, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const normalizeText = (value: unknown, fallback = '') => {
  if (typeof value === 'string') return value;
  if (value == null) return fallback;
  return String(value);
};

const parseEventDaysFromText = (text: string) => {
  const match = text.match(/(\d+)\s*天/);
  return match ? Math.max(0, Number(match[1])) : 0;
};

const removeEventDaysPrefix = (text: string) => text.replace(/^\s*剩余\s*\d+\s*天[:：]?\s*/, '').trim();

const formatEventDescriptionWithDays = (description: string, days: number) => {
  const cleanedDescription = removeEventDaysPrefix(normalizeText(description));
  return `剩余${Math.max(0, days)}天：${cleanedDescription}`;
};

const inferFacilityBlueprintId = (category: string, name: string) => {
  const normalizedCategory = normalizeText(category).trim();
  const normalizedName = normalizeText(name).trim();

  const exactBlueprint = FACILITY_BLUEPRINTS.find(
    blueprint =>
      Object.values(blueprint.levels).some(
        level => level.name === normalizedCategory || level.name === normalizedName,
      ) ||
      blueprint.id === normalizedCategory ||
      blueprint.id === normalizedName,
  );
  if (exactBlueprint) {
    return exactBlueprint.id;
  }

  const combinedText = `${normalizedCategory} ${normalizedName}`;
  const hintedBlueprint = Object.entries(FACILITY_CATEGORY_HINTS).find(([, keywords]) =>
    keywords.some(keyword => combinedText.includes(keyword)),
  );

  return hintedBlueprint?.[0] || FACILITY_BLUEPRINTS[0]?.id || 'defensive-gate';
};

type MvuMember = Record<string, any>;
type RuntimeContextGetter = () => { messageId?: number } | undefined;
type RuntimeWorld = { 天数?: number };
type RuntimeVariables = { stat_data?: { 世界?: RuntimeWorld } };

type PendingEventInput = {
  title: string;
  description: string;
  type: GameEvent['type'];
  target: number;
};

type StoryLog = {
  kind: 'rename' | 'work' | 'event';
  outpostId?: string;
  facilityId?: string;
  employeeId?: string;
  title: string;
  detail: string;
};

const buildEventKey = (title: string, target?: number) => `${title}::${Math.max(0, Number(target || 0))}`;

const createBanditInvasionEvent = (): PendingEventInput => ({
  title: '土匪入侵',
  description: '一伙无派系土匪正在逼近据点，预计两天后发起入侵。',
  type: 'bad',
  target: 2,
});

const inferEmployeeRole = (member: MvuMember, facilityName?: string) => {
  if (normalizeText(member?.身份)) return normalizeText(member.身份);
  if (facilityName) return `${facilityName}成员`;
  return '成员';
};

const getRuntimeContext = (): ReturnType<RuntimeContextGetter> => {
  const maybeGetContext = (globalThis as typeof globalThis & { getContext?: RuntimeContextGetter }).getContext;
  if (typeof maybeGetContext !== 'function') {
    return undefined;
  }

  try {
    return maybeGetContext();
  } catch {
    return undefined;
  }
};

const readMvuRootState = (messageId: number | 'latest' = 'latest') => {
  try {
    return getVariables({ type: 'message', message_id: messageId }) as RuntimeVariables;
  } catch {
    return undefined;
  }
};

const calculateOfflineIncome = (facilities: Facility[], elapsedDays: number) => {
  let earnedCats = 0;
  const earnedResources: Record<string, number> = {};

  if (elapsedDays <= 0) {
    return { cats: 0, resources: {} as Record<string, number> };
  }

  facilities.forEach(fac => {
    if (fac.status !== 'active') return;
    const bp = FACILITY_BLUEPRINTS.find(b => b.id === fac.blueprintId);
    if (!bp) return;
    const levelData = bp.levels[fac.level];
    if (!levelData || !levelData.productionType) return;

    const baseRate =
      typeof levelData.productionRate === 'number'
        ? levelData.productionRate
        : parseInt(levelData.productionRate.toString()) || 0;
    const totalRate = baseRate * elapsedDays;

    if (levelData.productionType === 'Cats/天') {
      earnedCats += totalRate;
      return;
    }

    if (levelData.productionType.endsWith('/天')) {
      const resName = levelData.productionType.replace('/天', '');
      earnedResources[resName] = (earnedResources[resName] || 0) + totalRate;
    }
  });

  return { cats: earnedCats, resources: earnedResources };
};

const buildStateFromMvuOutposts = (
  rawOutposts: any,
  fallbackState: GameState,
  currentWorldDay: number,
): (GameState & { elapsedDays: number; incomeReport: { cats: number; resources: Record<string, number> } }) | null => {
  if (!rawOutposts || typeof rawOutposts !== 'object' || Array.isArray(rawOutposts)) {
    return null;
  }

  const outpostEntries = Object.entries(rawOutposts as Record<string, any>);
  if (outpostEntries.length === 0) {
    return null;
  }

  const resourceMap: Record<string, number> = {};
  const outposts: Outpost[] = [];
  const facilities: Facility[] = [];
  const employees: Employee[] = [];
  const eventMap = new Map<string, GameEvent>();
  let cats = fallbackState.cats;
  let lastIncomeDay = currentWorldDay;

  outpostEntries.forEach(([outpostName, rawOutpost], outpostIndex) => {
    const outpostId = `outpost-${outpostIndex + 1}`;
    const outpostData = rawOutpost ?? {};

    outposts.push({
      id: outpostId,
      name: outpostName,
      location: normalizeText(outpostData.所处区域, '未知区域'),
      status: 'operational',
      description: normalizeText(outpostData.描述, ''),
      level: Math.max(1, normalizeValue(outpostData.等级, 1)),
    });

    cats = normalizeValue(outpostData.资金, cats);
    lastIncomeDay = Math.min(lastIncomeDay, Math.max(0, normalizeValue(outpostData.收益天数, currentWorldDay)));

    Object.entries(outpostData?.仓库?.物品 ?? {}).forEach(([itemName, itemData]) => {
      const quantity = Math.max(0, normalizeValue((itemData as any)?.数量, 0));
      if (quantity > 0) {
        resourceMap[itemName] = (resourceMap[itemName] || 0) + quantity;
      }
    });

    const facilityIdByWorkerName = new Map<string, string>();

    Object.entries(outpostData?.设施 ?? {}).forEach(([facilityKey, facilityData], facilityIndex) => {
      const resolvedName = normalizeText((facilityData as any)?.名字 || facilityKey, facilityKey);
      const resolvedCategory = normalizeText((facilityData as any)?.分类, resolvedName);
      const blueprintId = inferFacilityBlueprintId(resolvedCategory, resolvedName);
      const facilityId = `fac-${outpostIndex + 1}-${facilityIndex + 1}`;
      const workerNames = Array.isArray((facilityData as any)?.工作成员)
        ? (facilityData as any).工作成员.map((name: unknown) => normalizeText(name)).filter(Boolean)
        : [];

      facilities.push({
        id: facilityId,
        blueprintId,
        outpostId,
        level: Math.max(1, normalizeValue((facilityData as any)?.等级, 1)),
        customName: resolvedName,
        workers: [],
        status: 'active',
      });

      workerNames.forEach((workerName: string) => {
        facilityIdByWorkerName.set(workerName, facilityId);
      });
    });

    Object.entries(outpostData?.成员 ?? {}).forEach(([memberName, memberData], memberIndex) => {
      const member = (memberData ?? {}) as MvuMember;
      const resolvedName = normalizeText(member?.名字 || memberName, memberName);
      const matchedFacilityId = facilityIdByWorkerName.get(resolvedName);

      employees.push({
        id: `emp-${outpostIndex + 1}-${memberIndex + 1}`,
        name: resolvedName,
        race: normalizeText(member?.种族?.名称, '未知'),
        role: inferEmployeeRole(
          member,
          matchedFacilityId ? facilities.find(f => f.id === matchedFacilityId)?.customName : '',
        ),
        status: matchedFacilityId ? 'working' : 'idle',
        facilityId: matchedFacilityId,
        outpostId,
        traits: Object.values(member?.特质 ?? {})
          .map(value => normalizeText(value))
          .filter(Boolean),
        hp: Math.max(0, normalizeValue(member?.血量?.当前, 100)),
        maxHp: Math.max(1, normalizeValue(member?.血量?.最大, 100)),
        stats: {
          力量: normalizeValue(member?.属性?.STR?.基础 ?? member?.属性?.力量?.基础, DEFAULT_EMPLOYEE_STATS.力量),
          敏捷: normalizeValue(member?.属性?.DEX?.基础 ?? member?.属性?.敏捷?.基础, DEFAULT_EMPLOYEE_STATS.敏捷),
          感知: normalizeValue(member?.属性?.PER?.基础 ?? member?.属性?.感知?.基础, DEFAULT_EMPLOYEE_STATS.感知),
          体质: normalizeValue(member?.属性?.TGH?.基础 ?? member?.属性?.体质?.基础, DEFAULT_EMPLOYEE_STATS.体质),
          智力: normalizeValue(member?.属性?.INT?.基础 ?? member?.属性?.智力?.基础, DEFAULT_EMPLOYEE_STATS.智力),
          意志: normalizeValue(member?.属性?.WIL?.基础 ?? member?.属性?.意志?.基础, DEFAULT_EMPLOYEE_STATS.意志),
          魅力: normalizeValue(member?.属性?.CHA?.基础 ?? member?.属性?.魅力?.基础, DEFAULT_EMPLOYEE_STATS.魅力),
        },
      });
    });

    facilities.forEach(facility => {
      if (facility.outpostId !== outpostId) return;
      facility.workers = employees.filter(employee => employee.facilityId === facility.id).map(employee => employee.id);
    });

    Object.entries(outpostData?.到来事件 ?? {}).forEach(([title, description], eventIndex) => {
      if (!eventMap.has(title)) {
        const rawDescription = normalizeText(description);
        eventMap.set(title, {
          id: `evt-${outpostIndex + 1}-${eventIndex + 1}`,
          title,
          description: removeEventDaysPrefix(rawDescription),
          rollRequired: true,
          type: 'neutral',
          resolved: false,
          target: parseEventDaysFromText(rawDescription),
        });
      }
    });
  });

  if (outposts.length === 0) {
    return null;
  }

  const elapsedDays = Math.max(0, currentWorldDay - lastIncomeDay);
  const incomeReport = calculateOfflineIncome(facilities, elapsedDays);
  const resolvedResources = Object.keys(resourceMap).length > 0 ? { ...resourceMap } : { ...fallbackState.resources };

  Object.entries(incomeReport.resources).forEach(([name, amount]) => {
    resolvedResources[name] = (resolvedResources[name] || 0) + amount;
  });

  const resolvedEvents = Array.from(eventMap.values())
    .map(event => ({
      ...event,
      target: Math.max(0, (event.target || 0) - elapsedDays),
    }))
    .filter(event => (event.target || 0) > 0);

  return {
    cats: cats + incomeReport.cats,
    resources: resolvedResources,
    day: currentWorldDay,
    currentOutpostId: outposts[0]?.id || fallbackState.currentOutpostId,
    outposts,
    facilities,
    employees,
    events: resolvedEvents,
    elapsedDays,
    incomeReport,
  };
};

export default function App() {
  const initialLoadRef = useRef<{
    elapsedDays: number;
    incomeReport: { cats: number; resources: Record<string, number> };
  } | null>(null);

  const [gameState, setGameState] = useState<GameState>(() => {
    const contextMessageId = (() => {
      const id = getRuntimeContext()?.messageId;
      return typeof id === 'number' ? id : 'latest';
    })();

    const rootState = readMvuRootState(contextMessageId);
    const currentWorldDay = Math.max(1, normalizeValue(rootState?.stat_data?.世界?.天数, initialGameState.day));
    const mvuOutposts = _.get(rootState, 'stat_data.据点');
    const builtState = buildStateFromMvuOutposts(mvuOutposts, initialGameState, currentWorldDay);

    if (builtState) {
      initialLoadRef.current = { elapsedDays: builtState.elapsedDays, incomeReport: builtState.incomeReport };
      return _.omit(builtState, ['elapsedDays', 'incomeReport']) as GameState;
    }

    return initialGameState;
  });
  const [activeTab, setActiveTab] = useState<TabState>('outposts');
  const [showCodeModal, setShowCodeModal] = useState(false);

  const [clickSeq, setClickSeq] = useState('');
  const [testMode, setTestMode] = useState(false);

  const [hasRolledEvent, setHasRolledEvent] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incomeReport, setIncomeReport] = useState<{ cats: number; resources: Record<string, number> }>({
    cats: 0,
    resources: {},
  });
  const [hasCollectedIncome, setHasCollectedIncome] = useState(false);
  const [storyLogs, setStoryLogs] = useState<StoryLog[]>([]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement));
  const fullscreenToggleLockRef = useRef(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    onFullscreenChange();

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const offlineResult = initialLoadRef.current;
    if (!offlineResult || offlineResult.elapsedDays <= 0) {
      return;
    }

    setIncomeReport(offlineResult.incomeReport);
    setHasCollectedIncome(true);
    setShowIncomeModal(true);
    initialLoadRef.current = null;
  }, []);

  const buildCharacterAttributes = (stats: EmployeeStats) => ({
    力量: { 基础: Number(stats.力量 || 0), 加成: 0 },
    敏捷: { 基础: Number(stats.敏捷 || 0), 加成: 0 },
    感知: { 基础: Number(stats.感知 || 0), 加成: 0 },
    体质: { 基础: Number(stats.体质 || 0), 加成: 0 },
    智力: { 基础: Number(stats.智力 || 0), 加成: 0 },
    意志: { 基础: Number(stats.意志 || 0), 加成: 0 },
    魅力: { 基础: Number(stats.魅力 || 0), 加成: 0 },
  });

  const buildMemberVariable = (employee: Employee) => ({
    名字: employee.name,
    身份: employee.role || '成员',
    状态: employee.status || '正常',
    种族: {
      名称: employee.race || '未知',
    },
    血量: {
      当前: Number(employee.hp || 0),
      最大: Number(employee.maxHp || 0),
    },
    属性: buildCharacterAttributes(employee.stats),
    特质: Object.fromEntries((employee.traits || []).map((trait, index) => [`特征${index + 1}`, trait])),
  });

  const buildFacilityVariable = (facility: Facility, state: GameState) => {
    const blueprint = FACILITY_BLUEPRINTS.find(item => item.id === facility.blueprintId);
    const levelData = blueprint?.levels[facility.level];
    const workerNames = state.employees
      .filter(employee => facility.workers.includes(employee.id))
      .map(employee => employee.name);

    return {
      名字: facility.customName || '',
      分类: levelData?.name || blueprint?.id || facility.blueprintId || '未分类',
      等级: Number(facility.level || 1),
      工作成员: workerNames,
    };
  };

  type WarehouseItemCategory =
    | '食物'
    | '饮品'
    | '医疗用品'
    | '科研道具'
    | '任务道具'
    | '矿石'
    | '布料'
    | '金属材料'
    | '农作物'
    | '其他';

  const getWarehouseCategory = (name: string): WarehouseItemCategory => {
    if (/电子元件|科技书|古代科技书|科研|研究|工程图|蓝图/i.test(name)) return '科研道具';
    if (/水|酒|饮品|饮料|格洛格|朗姆|清酒/i.test(name)) return '饮品';
    if (/布料|大布料|棉布|麻布|皮革/i.test(name)) return '布料';
    if (/食物|肉|口粮|面包|米饭|干粮|烤肉/i.test(name)) return '食物';
    if (/急救|医疗|绷带|夹板|修理包|药/i.test(name)) return '医疗用品';
    if (/任务|钥匙|信件|委托|凭证/i.test(name)) return '任务道具';
    if (/矿石|生铁|铜矿|铁矿|石材/i.test(name)) return '矿石';
    if (/建筑材料|铁原板|钢筋|铜合金|金属|铁板|钢材/i.test(name)) return '金属材料';
    if (/麻叶|小麦|稻米|面粉|棉花|大麻膏|农作物|作物/i.test(name)) return '农作物';
    return '其他';
  };

  const buildWarehouseItems = (resources: Record<string, number>) => {
    const warehouseItems: Record<
      string,
      { 分类: WarehouseItemCategory; 介绍: string; 数量: number; 重量: number; 价值: number }
    > = {};
    Object.entries(resources).forEach(([name, amount]) => {
      const quantity = Number(amount || 0);
      if (quantity <= 0) return;
      warehouseItems[name] = {
        分类: getWarehouseCategory(name),
        介绍: '',
        数量: quantity,
        重量: 0,
        价值: 0,
      };
    });
    return warehouseItems;
  };

  const buildDestinyEvents = (events: GameEvent[]) => {
    const mappedEvents: Record<string, string> = {};
    events.forEach((event, index) => {
      const title = event.title || `事件${index + 1}`;
      mappedEvents[title] = formatEventDescriptionWithDays(event.description || '', event.target || 0);
    });
    return mappedEvents;
  };

  const buildOutpostVariables = (state: GameState, settlementDay: number) => {
    const sharedWarehouseItems = buildWarehouseItems(state.resources);
    const sharedDestinyEvents = buildDestinyEvents(state.events);

    return Object.fromEntries(
      state.outposts.map(outpost => {
        const members = state.employees.filter(employee => employee.outpostId === outpost.id);
        const facilities = state.facilities.filter(facility => facility.outpostId === outpost.id);

        return [
          outpost.name,
          {
            等级: Number(outpost.level || 1),
            收益天数: Number(settlementDay || 1),
            所处区域: outpost.location || '未知区域',
            描述: outpost.description || '',
            资金: Number(state.cats || 0),
            成员: Object.fromEntries(members.map(member => [member.name, buildMemberVariable(member)])),
            仓库: {
              物品: sharedWarehouseItems,
            },
            设施: Object.fromEntries(
              facilities.map((facility, index) => [
                facility.customName || facility.blueprintId || `设施${index + 1}`,
                buildFacilityVariable(facility, state),
              ]),
            ),
            到来事件: sharedDestinyEvents,
          },
        ];
      }),
    );
  };

  const getCurrentMessageId = (): number | 'latest' => {
    const contextMessageId = getRuntimeContext()?.messageId;
    if (typeof contextMessageId === 'number') {
      return contextMessageId;
    }
    return 'latest';
  };

  const getCurrentWorldDay = (messageId: number | 'latest' = getCurrentMessageId()) => {
    const rootState = readMvuRootState(messageId);
    return Math.max(1, normalizeValue(rootState?.stat_data?.世界?.天数, gameState.day || initialGameState.day));
  };

  const updateMvuVariables = async (
    state: GameState,
    messageId: number | 'latest' = getCurrentMessageId(),
    settlementDay = getCurrentWorldDay(messageId),
  ) => {
    await waitGlobalInitialized('Mvu');
    await waitFor(() => _.has(getVariables({ type: 'message', message_id: messageId }), 'stat_data'));

    const mvuData = Mvu.getMvuData({ type: 'message', message_id: messageId });
    _.set(mvuData, 'stat_data.据点', buildOutpostVariables(state, settlementDay));
    appendTriggeredEventSight(mvuData, state);
    await Mvu.replaceMvuData(mvuData, { type: 'message', message_id: messageId });
  };

  const appendStoryLog = (log: StoryLog) => {
    setStoryLogs(prev => [...prev, log]);
  };

  const getFacilityDisplayName = (facility?: Facility) => {
    if (!facility) return '某处设施';
    const blueprint = FACILITY_BLUEPRINTS.find(item => item.id === facility.blueprintId);
    const levelData = blueprint?.levels[facility.level];
    return facility.customName || levelData?.name || facility.blueprintId || '某处设施';
  };

  const buildSettlementStoryText = (logs: StoryLog[], state: GameState, settlementDay: number) => {
    const currentOutpost = state.outposts.find(outpost => outpost.id === state.currentOutpostId) || state.outposts[0];
    const storyOutpostName = currentOutpost?.name || '无名据点';
    const storyRegion = currentOutpost?.location || '未知区域';
    const relevantLogs = logs.filter(log => !log.outpostId || log.outpostId === currentOutpost?.id);

    const renameLogs = relevantLogs.filter(log => log.kind === 'rename');
    const workLogs = relevantLogs.filter(log => log.kind === 'work');
    const eventLogs = relevantLogs.filter(log => log.kind === 'event');

    const lines: string[] = [];
    lines.push('【据点提交】');
    lines.push(`第${settlementDay}天，据点【${storyOutpostName}】位于【${storyRegion}】。`);

    if (renameLogs.length > 0) {
      lines.push('');
      lines.push('【改名】');
      renameLogs.forEach(log => {
        lines.push(`- ${log.detail}`);
      });
    }

    if (workLogs.length > 0) {
      lines.push('');
      lines.push('【工作】');
      workLogs.forEach(log => {
        lines.push(`- ${log.detail}`);
      });
    }

    if (eventLogs.length > 0) {
      lines.push('');
      lines.push('【事件】');
      eventLogs.forEach(log => {
        lines.push(`- ${log.detail}`);
      });
    }

    lines.push('');
    lines.push(
      '请根据以上内容，生成这个据点当日发生的故事，并帮我润色成更自然、更有废土感的叙述。重点写清：设施改名带来的变化、成员分别进行了什么工作、据点遭遇了什么事件。正文不要写成条目，不要出现代码感表述。',
    );

    return lines.join('\n');
  };

  const handleSecretClick = (char: string) => {
    setClickSeq(prev => {
      const next = (prev + char).slice(-8);
      if (next === 'CCCCDDCC' && !testMode) {
        setTestMode(true);
      }
      return next;
    });
  };

  const handleToggleFullscreen = async () => {
    if (fullscreenToggleLockRef.current) {
      return;
    }

    fullscreenToggleLockRef.current = true;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // ignore browser fullscreen policy errors
    } finally {
      window.setTimeout(() => {
        fullscreenToggleLockRef.current = false;
      }, 220);
    }
  };

  const handleBuild = (blueprintId: string, cost: Record<string, number> | undefined, targetLevel: number = 1) => {
    setGameState(prev => {
      const newResources = { ...prev.resources };
      if (!testMode && cost) {
        for (const [res, amount] of Object.entries(cost)) {
          newResources[res] = (newResources[res] || 0) - amount;
        }
      }

      return {
        ...prev,
        resources: newResources,
        facilities: [
          ...prev.facilities,
          {
            id: `fac-${Date.now()}`,
            blueprintId,
            outpostId: prev.currentOutpostId,
            level: targetLevel,
            workers: [],
            status: 'constructing',
          },
        ],
      };
    });
  };

  const handleUpgrade = (facilityId: string, cost: Record<string, number> | undefined) => {
    setGameState(prev => {
      const facility = prev.facilities.find(f => f.id === facilityId);
      if (!facility) return prev;

      const bp = FACILITY_BLUEPRINTS.find(b => b.id === facility.blueprintId);
      if (!bp || !bp.levels[facility.level + 1]) {
        return prev;
      }

      const newResources = { ...prev.resources };
      if (!testMode && cost) {
        for (const [res, amount] of Object.entries(cost)) {
          newResources[res] = (newResources[res] || 0) - amount;
        }
      }

      return {
        ...prev,
        resources: newResources,
        facilities: prev.facilities.map(f => (f.id === facilityId ? { ...f, level: f.level + 1 } : f)),
      };
    });
  };

  const handleAssign = (employeeId: string, facilityId: string | undefined) => {
    const employee = gameState.employees.find(item => item.id === employeeId);
    const facility = gameState.facilities.find(item => item.id === facilityId);
    const outpostId = employee?.outpostId || facility?.outpostId || gameState.currentOutpostId;

    setGameState(prev => {
      return {
        ...prev,
        employees: prev.employees.map(e =>
          e.id === employeeId ? { ...e, facilityId, status: facilityId ? 'working' : 'idle' } : e,
        ),
        facilities: prev.facilities.map(f => {
          const workers = f.workers.filter(id => id !== employeeId);
          if (f.id === facilityId) {
            workers.push(employeeId);
          }
          return { ...f, workers };
        }),
      };
    });

    if (employee) {
      if (facilityId && facility) {
        appendStoryLog({
          kind: 'work',
          outpostId,
          facilityId,
          employeeId,
          title: '成员工作调整',
          detail: `据点成员${employee.name}进行${getFacilityDisplayName(facility)}工作。`,
        });
      } else {
        appendStoryLog({
          kind: 'work',
          outpostId,
          employeeId,
          title: '成员工作调整',
          detail: `据点成员${employee.name}结束当前工作，暂时转入待命。`,
        });
      }
    }
  };

  const handleAssignMultiple = (assignments: Record<string, string | undefined>) => {
    const pendingLogs: StoryLog[] = Object.entries(assignments)
      .map(([empId, facId]) => {
        const employee = gameState.employees.find(item => item.id === empId);
        if (!employee) return null;
        const facility = gameState.facilities.find(item => item.id === facId);
        return {
          kind: 'work' as const,
          outpostId: employee.outpostId || facility?.outpostId || gameState.currentOutpostId,
          facilityId: facId,
          employeeId: empId,
          title: '批量工作调整',
          detail:
            facId && facility
              ? `据点成员${employee.name}进行${getFacilityDisplayName(facility)}工作。`
              : `据点成员${employee.name}结束当前工作，暂时转入待命。`,
        };
      })
      .filter(Boolean) as StoryLog[];

    setGameState(prev => {
      let newEmployees = [...prev.employees];
      let newFacilities = [...prev.facilities];

      for (const [empId, facId] of Object.entries(assignments)) {
        newEmployees = newEmployees.map(e =>
          e.id === empId ? { ...e, facilityId: facId, status: facId ? 'working' : 'idle' } : e,
        );

        newFacilities = newFacilities.map(f => {
          const workers = f.workers.filter(id => id !== empId);
          if (f.id === facId) {
            workers.push(empId);
          }
          return { ...f, workers };
        });
      }
      return {
        ...prev,
        employees: newEmployees,
        facilities: newFacilities,
      };
    });

    if (pendingLogs.length > 0) {
      setStoryLogs(prev => [...prev, ...pendingLogs]);
    }
  };

  const handleSelectOutpost = (id: string) => {
    setGameState(prev => ({ ...prev, currentOutpostId: id }));
    setActiveTab('dashboard');
  };

  const handleUpdateOutpost = (id: string, updates: any, cost?: Record<string, number>) => {
    setGameState(prev => {
      const newResources = { ...prev.resources };
      if (!testMode && cost) {
        for (const [res, amount] of Object.entries(cost)) {
          newResources[res] = (newResources[res] || 0) - amount;
        }
      }
      return {
        ...prev,
        resources: newResources,
        outposts: prev.outposts.map(o => (o.id === id ? { ...o, ...updates } : o)),
      };
    });
  };

  const handleCreateOutpost = (name: string, location: string) => {
    setGameState(prev => {
      const costCats = 3000;
      let nextCats = prev.cats;
      const nextResources = { ...prev.resources };

      if (!testMode) {
        nextCats -= costCats;
        nextResources['建筑材料'] = (nextResources['建筑材料'] || 0) - 10;
      }

      const newOutpost: Outpost = {
        id: `out-${Date.now()}`,
        name: name,
        location: location,
        status: 'operational',
        description: '一处新建的房屋基地，您的废土传奇由此续写。',
        level: 1,
      };

      return {
        ...prev,
        cats: nextCats,
        resources: nextResources,
        outposts: [...prev.outposts, newOutpost],
        currentOutpostId: newOutpost.id,
      };
    });
    setActiveTab('dashboard');
  };

  const handleGenerateCode = async () => {
    const settlementDay = getCurrentWorldDay();
    const nextEvents = ensurePendingEvent(gameState.events, createBanditInvasionEvent());
    const nextStateForSubmission: GameState = {
      ...gameState,
      events: nextEvents,
    };

    const minState = {
      day: nextStateForSubmission.day,
      cats: nextStateForSubmission.cats,
      res: nextStateForSubmission.resources,
      fac: nextStateForSubmission.facilities.map(f => ({
        id: f.id,
        bp: f.blueprintId,
        lvl: f.level,
        st: f.status,
      })),
      emp: nextStateForSubmission.employees.map(e => ({
        id: e.id,
        n: e.name,
        r: e.role,
        hp: e.hp,
        maxHp: e.maxHp,
        fac: e.facilityId || 0,
        s: e.stats,
        t: e.traits,
      })),
    };

    const rawJson = JSON.stringify(minState);
    const base64Code = btoa(unescape(encodeURIComponent(rawJson)));
    const formattedCode = `KNS-${base64Code}`;

    console.log('[Dev] 提报至后台的状态数据:', formattedCode);

    await updateMvuVariables(nextStateForSubmission, getCurrentMessageId(), settlementDay);

    const submissionEventKeys = new Set(gameState.events.map(event => buildEventKey(event.title, event.target)));
    const pendingEventLogs = nextEvents
      .filter(event => !submissionEventKeys.has(buildEventKey(event.title, event.target)))
      .map(event => ({
        kind: 'event' as const,
        outpostId: gameState.currentOutpostId,
        title: event.title,
        detail: `遇到了${event.title}，${event.description}`,
      }));

    const summary = buildSettlementStoryText(
      [...storyLogs, ...pendingEventLogs],
      nextStateForSubmission,
      settlementDay,
    );

    try {
      await createChatMessages([{ role: 'user', message: summary }]);
      await triggerSlash('/trigger');
    } catch (error) {
      navigator.clipboard.writeText(summary);
      console.error('发送据点故事失败，已复制到剪贴板', error);
    }

    setGameState(prev => ({
      ...prev,
      events: nextEvents,
      day: settlementDay,
    }));
    setHasRolledEvent(false);
    setHasCollectedIncome(false);
    setStoryLogs([]);

    setShowCodeModal(true);
  };

  const handleCollectIncome = () => {
    if (hasCollectedIncome) return;
    setHasCollectedIncome(true);
    const manualIncome = calculateOfflineIncome(gameState.facilities, 1);

    setGameState(prev => {
      const nextState = {
        ...prev,
        cats: prev.cats + manualIncome.cats,
        resources: { ...prev.resources },
      };

      Object.entries(manualIncome.resources).forEach(([name, amount]) => {
        nextState.resources[name] = (nextState.resources[name] || 0) + amount;
      });

      return nextState;
    });

    setIncomeReport(manualIncome);
    setShowIncomeModal(true);
  };

  const handleRenameFacility = (facId: string, customName: string) => {
    const facility = gameState.facilities.find(item => item.id === facId);
    const previousName = getFacilityDisplayName(facility);
    const nextName = customName.trim() || previousName;

    setGameState(prev => ({
      ...prev,
      facilities: prev.facilities.map(f => (f.id === facId ? { ...f, customName } : f)),
    }));

    appendStoryLog({
      kind: 'rename',
      outpostId: facility?.outpostId || gameState.currentOutpostId,
      facilityId: facId,
      title: '设施改名',
      detail: `我把${previousName}改名为${nextName}。`,
    });
  };

  const handleRolledEvent = (event: RolledEventPayload) => {
    setHasRolledEvent(true);
    appendStoryLog({
      kind: 'event',
      outpostId: gameState.currentOutpostId,
      title: event.title,
      detail: `遇到了${event.title}，${event.desc}`,
    });
  };

  return (
    <div
      className={`min-h-screen flex text-slate-300 overflow-hidden font-sans select-none selection:bg-amber-500/30 selection:text-white ${
        isFullscreen ? 'h-screen w-screen' : ''
      }`}
    >
      <Sidebar
        activeTab={activeTab}
        onTabChange={tab => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false);
        }}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative scroll-smooth overflow-x-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-900/10 blur-[120px] rounded-full pointer-events-none" />

        <TopBar
          state={gameState}
          onSubmitTurn={handleGenerateCode}
          onSecretClick={handleSecretClick}
          testMode={testMode}
          hasRolledEvent={hasRolledEvent}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          onToggleMenu={() => setIsMobileMenuOpen(true)}
        />

        <div className="flex-1 relative z-10 max-w-7xl mx-auto w-full pb-20">
          {activeTab === 'dashboard' && (
            <Dashboard
              state={gameState}
              onCollectIncome={handleCollectIncome}
              hasCollectedIncome={hasCollectedIncome}
            />
          )}
          {activeTab === 'outposts' && (
            <Outposts
              state={gameState}
              onSelectOutpost={handleSelectOutpost}
              onUpdateOutpost={handleUpdateOutpost}
              onCreateOutpost={handleCreateOutpost}
              testMode={testMode}
            />
          )}
          {activeTab === 'facilities' && (
            <Facilities
              state={gameState}
              testMode={testMode}
              onBuild={handleBuild}
              onUpgrade={handleUpgrade}
              onAssign={handleAssign}
              onAssignMultiple={handleAssignMultiple}
              onRenameFacility={handleRenameFacility}
            />
          )}
          {activeTab === 'personnel' && <Personnel state={gameState} />}
          {activeTab === 'events' && <Events state={gameState} onRollEvent={handleRolledEvent} />}
        </div>
      </main>

      <Modal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        title="回合状态已提交"
        icon={<CheckCircle size={20} />}
      >
        <div className="space-y-6">
          <p className="text-sm text-slate-400 leading-relaxed text-center">
            本回合的设施调配与人员部署已被记录，并流转至后端运算模块。
          </p>

          <div className="bg-black/50 border border-emerald-500/20 rounded-xl p-6 relative group overflow-hidden border-dashed">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none"></div>
            <div className="flex flex-col items-center justify-center space-y-4 relative z-10 py-4">
              <CheckCircle size={48} className="text-emerald-500 mb-2 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              <div className="text-xl text-emerald-400 tracking-widest font-mono font-medium">数据提报完成</div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 leading-loose px-2">
            本回合状态编码已写入后台日志，等待外部流程接入解析。
            <br />
            变量状态也已同步更新，据点故事摘要也已自动发送，可用于后续剧情、运算或界面联动。
          </p>

          <div className="flex justify-center">
            <button
              onClick={() => setShowCodeModal(false)}
              className="px-8 py-2.5 rounded-lg font-medium tracking-widest transition-all bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-600/40 hover:text-white shadow-[0_0_15px_rgba(16,185,129,0.1)]"
            >
              返回终端
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showIncomeModal} onClose={() => setShowIncomeModal(false)} title="本日收益结算">
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-500/20 bg-black/30 p-4">
            <div className="text-sm text-slate-400 mb-2">开币收益</div>
            <div className="text-2xl font-mono text-amber-400">+{incomeReport.cats}</div>
          </div>

          <div className="rounded-xl border border-sky-500/20 bg-black/30 p-4">
            <div className="text-sm text-slate-400 mb-2">资源收益</div>
            {Object.keys(incomeReport.resources).length === 0 ? (
              <div className="text-sm text-slate-500">今日无额外资源产出</div>
            ) : (
              <div className="space-y-2">
                {Object.entries(incomeReport.resources).map(([name, amount]) => (
                  <div key={name} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{name}</span>
                    <span className="font-mono text-emerald-400">+{amount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowIncomeModal(false)}
            className="mt-4 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded font-medium tracking-widest text-sm transition-colors border border-white/10"
          >
            确认并继续
          </button>
        </div>
      </Modal>
    </div>
  );
}
