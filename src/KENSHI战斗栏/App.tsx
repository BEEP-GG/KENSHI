import { waitUntil } from 'async-wait-until';
import _ from 'lodash';
import {
  Activity,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Crosshair,
  Eye,
  Flag,
  Heart,
  Settings,
  Shield,
  Skull,
  Sword,
} from 'lucide-react';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

type Faction = 'friendly' | 'enemy';
type SubFaction = 'squad' | 'ally';
type Attributes = {
  STR: number;
  DEX: number;
  PER: number;
  TGH: number;
  WIL: number;
  INT: number;
  CHA: number;
};

type BattleCharacter = {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  startHp: number;
  fractured: boolean;
  faction: Faction;
  subFaction?: SubFaction;
  intent?: string;
  state: string;
  attributes: Attributes;
  weapon: {
    name: string;
    type: string;
    damageDice: string;
    damageType: string;
  };
  subWeapon: {
    name: string;
    type: string;
    damageDice: string;
    damageType: string;
  };
  armorDR: number;
  traumaParts: Record<'左臂' | '右臂' | '左腿' | '右腿', number>;
  traumaAccumulated: Record<'左臂' | '右臂' | '左腿' | '右腿', number>;
  bleedLayers: number;
  shockTurns: number;
  hasDowned: boolean;
  attackCount: number;
  noBlockNextRound: boolean;
  defenseBonus: number;
  escaped: boolean;
  hitBonusAgainst: Record<string, number>;
  raceName: string;
  backpackItems: Record<string, { 介绍?: string; 数量?: number; 重量?: number; 价值?: number }>;
  weaponRaw: any;
  subWeaponRaw: any;
  armorRaw: any;
  attributesRaw: any;
  traumaRaw: any;
};

type ActionType = { id: string; label: string; icon: React.ElementType; color: string; glow: string };

type BattleState = {
  round: number;
  units: BattleCharacter[];
  logs: string[];
  result: 'victory' | 'defeat' | null;
  endReason?: 'normal' | 'surrender';
};

type BattleOutcome =
  | '酣畅大胜'
  | '略处上风'
  | '血战险胜'
  | '势均力敌'
  | '血战惜败'
  | '略处下风'
  | '悲惨失败'
  | '史诗大捷'
  | '投降';

const OUTCOME_DESCRIPTIONS: Record<BattleOutcome, string> = {
  酣畅大胜: '我军势如破竹，以极微伤亡将敌主力全线击溃，赢得酣畅淋漓。',
  略处上风: '大战后互有折损，我军最终将敌阵逼退，艰难掌控了战场主动权。',
  血战险胜: '踩着尸山血海拼死击退强敌，我军虽惨烈取胜，将士已伤亡殆尽。',
  势均力敌: '战局陷入死斗，双方伤亡相当皆已力竭，依然僵持不下。',
  血战惜败: '将士浴血死战，虽令敌军付出惨重代价，仍因力竭而抱憾败退。',
  略处下风: '战阵交锋遭到压制，我方未占优势，不敌敌手。',
  悲惨失败: '阵线土崩瓦解，我方沦为敌方脚下的待宰羔羊，败得惨绝人寰。',
  史诗大捷: '绝境中以少胜多，战胜强于己方的敌人，铸就载入史册的神话。',
  投降: '我军选择了投降，是生是死全看敌方了，真是可悲啊。',
};

const OUTCOME_STYLES: Record<BattleOutcome, { title: string; glow: string; aura: string }> = {
  酣畅大胜: {
    title: 'text-emerald-300 drop-shadow-[0_0_12px_rgba(16,185,129,0.9)]',
    glow: 'shadow-[0_0_50px_rgba(16,185,129,0.35)]',
    aura: 'bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.25),_transparent_60%)]',
  },
  略处上风: {
    title: 'text-emerald-300 drop-shadow-[0_0_10px_rgba(16,185,129,0.75)]',
    glow: 'shadow-[0_0_45px_rgba(16,185,129,0.3)]',
    aura: 'bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.2),_transparent_60%)]',
  },
  血战险胜: {
    title: 'text-emerald-200 drop-shadow-[0_0_10px_rgba(52,211,153,0.7)]',
    glow: 'shadow-[0_0_40px_rgba(16,185,129,0.28)]',
    aura: 'bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_60%)]',
  },
  势均力敌: {
    title: 'text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.85)]',
    glow: 'shadow-[0_0_50px_rgba(251,191,36,0.35)]',
    aura: 'bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.25),_transparent_60%)]',
  },
  血战惜败: {
    title: 'text-rose-300 drop-shadow-[0_0_12px_rgba(248,113,113,0.85)]',
    glow: 'shadow-[0_0_50px_rgba(248,113,113,0.35)]',
    aura: 'bg-[radial-gradient(circle_at_top,_rgba(248,113,113,0.22),_transparent_60%)]',
  },
  略处下风: {
    title: 'text-rose-300 drop-shadow-[0_0_10px_rgba(248,113,113,0.75)]',
    glow: 'shadow-[0_0_45px_rgba(248,113,113,0.3)]',
    aura: 'bg-[radial-gradient(circle_at_top,_rgba(248,113,113,0.2),_transparent_60%)]',
  },
  悲惨失败: {
    title: 'text-red-300 drop-shadow-[0_0_14px_rgba(239,68,68,0.9)]',
    glow: 'shadow-[0_0_55px_rgba(239,68,68,0.4)]',
    aura: 'bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.25),_transparent_60%)]',
  },
  史诗大捷: {
    title: 'text-amber-200 drop-shadow-[0_0_16px_rgba(250,204,21,1)] animate-pulse',
    glow: 'shadow-[0_0_70px_rgba(250,204,21,0.55)]',
    aura: 'bg-[conic-gradient(from_180deg_at_50%_0%,_rgba(250,204,21,0.35),_rgba(251,191,36,0.15),_rgba(250,204,21,0.35))]',
  },
  投降: {
    title: 'text-stone-300 drop-shadow-[0_0_12px_rgba(148,163,184,0.7)]',
    glow: 'shadow-[0_0_40px_rgba(148,163,184,0.25)]',
    aura: 'bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.2),_transparent_60%)]',
  },
};

const BATTLE_RULES = `战斗轮结构:
1. 顺位阶段:
   - 逻辑: 按角色的【敏捷】值从高到低排序。
   - 特殊: 敏捷相同者，【感知】高者优先；若仍相同，同时行动。

2. 行动阶段:
   - 逻辑: 角色根据武器种类和敏捷等级，执行其对应的【攻击次数】。
   - 流程: 每次攻击都需独立完成“攻击-对抗-结算”循环。

攻击与对抗流程:
第一步_闪避:
  - 防守方闪避值: (敏捷 * 0.5) + (感知 * 0.2)，最高不超过70
  - 进攻方投掷: D100（大型武器90-100为大失败，其余95-100为大失败）
  - 判定: 防守方闪避值 ≤ 进攻方投掷结果
  - 结果: 失败则本次攻击落空；成功则进入【对抗防御】阶段。

第二步_属性对抗防御:
  - 防御方基础值:
      武器格挡: “(敏捷 * 0.5 + 力量 * 0.2)”
      空手闪避: “(敏捷 * 0.6 + 感知 * 0.2)”
  - 对抗修正:
      最终防御成功 = 防御方基础值 + (防御方敏捷 - 攻击方敏捷)
  - 防御判定: 防御方投掷 D100 <= 最终防御。
  - 防御结果:
      闪避成功: 免疫全部伤害，攻击结束。
      格挡成功: 免疫 100% 切割伤害，受到 50% 钝伤。
      防御失败: 进入【伤害结算】阶段。

伤害结算流程:
第一步_伤害计算:
  - 面板计算: “武器基础骰子结果 + (力量 - 20) * 0.4”
  - 伤害拆分: 根据武器比例，将面板伤害拆分为【切割伤害】与【钝伤伤害】。

第二步_护甲过滤:
  - 切割结算: “max(0, 切割伤害 - 护甲固定减伤DR)”
  - 钝伤结算: 直接透传 (无视DR)
  - 最终伤害: “切割结算 + 钝伤结算”

第三步_状态与生命结算:
  - 逻辑: 从目标 HP 中扣除最终伤害。
  - 创伤判定 (脚本触发条件):
      条件A: 本次最终伤害 > (目标体质 * 0.4)
      条件B: 攻击方命中检定为大成功 (01-07)
      满足任一条件，随机部位【创伤等级】+1，并触发相应层级的残废/减值效果。
  - 濒死判定:
      HP > 0: 继续战斗。
      HP <= 0 (首次倒地): 触发韧性检定。

特殊规则:
- 连击机制: 若角色拥有多次攻击次数，防御方在同一轮内防御后续攻击时，【最终防御成功率】每下累积 -10。
- 大成功与大失败:
    攻击大成功 (01-07): 伤害结算x1.5且无法格挡。
    攻击大失败 (大型武器90-100，其余95-100): 攻击者失去平衡，下一轮无法执行格挡，且防御方可获得一次即时反击。
- 濒死与韧性:
    倒地判定: 当 HP 归零时，角色需进行一次【体质】检定。
    成功: 保持清醒（可尝试爬行逃跑或装死）。
    失败: 陷入休克状态。

`;

const PANEL_TUTORIAL = `战斗面板教程：
（待补充）`;

const WEAPON_CATEGORY_GUIDE = `武器类别详解：

武士刀：
- 每次对目标造成未被DR格挡的切割伤害时，对目标施加1层“流血”。流血每回合开始时造成1点直接伤害，可叠加。

军刀：
- 装备军刀类武器时，“武器格挡”基础值+7。

砍刀：
- 无视对方5点DR。
- 攻击检定大成功（01-07）时触发“破甲”：目标DR降低10。

长柄类：
- 每次攻击时可选择最多3个敌人进行攻击检定；每多一个目标，攻击检定-7。

钝器：
- 攻击检定大成功（01-07）时，强制目标进行一次【体质】中等检定；失败则进入“骨折”，逃跑检定-25、力量/敏捷-15，直到夹板包清除。

大型武器：
- 每次攻击时对2个敌人进行攻击检定。
- 攻击检定大失败（90-100）或两名目标均被【闪避】时，进入失衡，防御检定-15。

弩：
- 基础效果：无视对方7点DR。
- 大失败不会触发反击，而是误伤队友。
- 弩矢效果后续补充。

弓：
- 大失败不会触发反击，而是误伤队友。
- 箭矢效果后续补充。`;

const TRAUMA_RULES = `创伤与状态详解：

基础流程：
- 每次命中随机一个部位（左臂/右臂/左腿/右腿），该部位阈值会被本次伤害削减。
- 阈值降到0会升级到下一等级，超额会继续抵扣下一等级阈值。

升级条件（TGH=体质，HPmax=最大生命值）：
- 0→1：攻击大成功 或 单次伤害 > TGH*0.6 或 阈值归零
- 1→2：攻击大成功 或 单次伤害 > TGH*0.6 或 阈值归零
- 2→3：单次伤害 > TGH*0.6 或 阈值归零
- 3→4：单次伤害 > TGH*0.3 或 阈值归零
- 任意等级→3：单次伤害 ≥ HPmax*0.5
- 任意等级→4：单次伤害 ≥ HPmax*0.7

创伤效果：
- 0 无效果
- 1 擦伤：臂命中/防御-5；腿躲避/逃跑-5
- 2 负伤：臂命中/防御-10；腿躲避/逃跑-10
- 3 重创：臂命中/防御-25；腿躲避/逃跑-25
- 4 断肢：左臂失去副武器/右臂失去主武器；腿无法躲避/逃跑

士气规则（意志WIL）：
- WIL>80：士气不下降，不会逃跑/投降。
- 判定时机：每回合开始 + 受伤后。
- 士气= 20 + WIL*1 + HP比例*35 − 创伤惩罚(1:-3/2:-7/3:-12/4:-18) − 损失惩罚(死亡-13/休克-8/逃跑-6)。
- 阈值：<40撤退；撤退失败两次后进行1d6，1-3投降，4-6决死战斗。

状态提示：
- 失衡/流血/骨折/眩晕/休克/死亡等会在面板状态栏显示。`;

const SETTLEMENT_LOG = '【结算】点击查看战斗总结';

type DamageRatio = { cut: number; blunt: number };

type TutorialStep = {
  key: 'auto' | 'attack' | 'tactics' | 'surrender' | 'end_round';
  title: string;
  quote: string;
  description: string;
};

const tutorialSteps: TutorialStep[] = [
  {
    key: 'auto',
    title: '自动选择',
    quote: '“我只想让ai帮我选”',
    description: '每个小队成员角色会自动选择攻击目标。',
  },
  {
    key: 'attack',
    title: '攻击',
    quote: '“看谁不爽就干谁”',
    description: '点击左侧角色，选择右侧敌方成员干死他。',
  },
  {
    key: 'tactics',
    title: '战术',
    quote: '“让我想想做点什么”',
    description: '选择相应的战术，进行抉择。',
  },
  {
    key: 'surrender',
    title: '投降',
    quote: '“我不打了，对我做什么都可以哦~”',
    description: '直接判定失败。',
  },
  {
    key: 'end_round',
    title: '回合结束',
    quote: '“字面意思”',
    description: '字面意思。',
  },
];

const actions: ActionType[] = [
  {
    id: 'attack',
    label: '攻击',
    icon: Crosshair,
    color: 'text-red-400 border-red-900/50 hover:bg-red-950/40 hover:border-red-500/50',
    glow: 'group-hover:shadow-[0_0_20px_rgba(248,113,113,0.3)]',
  },
  {
    id: 'tactics',
    label: '战术',
    icon: BookOpen,
    color: 'text-blue-400 border-blue-900/50 hover:bg-blue-950/40 hover:border-blue-500/50',
    glow: 'group-hover:shadow-[0_0_20px_rgba(96,165,250,0.3)]',
  },
  {
    id: 'surrender',
    label: '投降',
    icon: Flag,
    color: 'text-stone-400 border-stone-700/50 hover:bg-stone-800/40 hover:border-stone-400/50',
    glow: 'group-hover:shadow-[0_0_20px_rgba(168,162,158,0.3)]',
  },
  {
    id: 'end_round',
    label: '回合结束',
    icon: ChevronRight,
    color: 'text-fuchsia-300 border-fuchsia-900/50 hover:bg-fuchsia-950/40 hover:border-fuchsia-500/50',
    glow: 'group-hover:shadow-[0_0_20px_rgba(217,70,239,0.35)]',
  },
];

const d100 = () => _.random(1, 100);

const rollDice = (dice: string) => {
  const match = dice.match(/(\d+)d(\d+)/i);
  if (!match) return _.toNumber(dice) || 0;
  const count = Number(match[1]) || 1;
  const sides = Number(match[2]) || 6;
  return _.sum(Array.from({ length: count }, () => _.random(1, sides)));
};

const parseDamageTypeRatio = (damageType: string): DamageRatio | null => {
  if (!damageType) return null;
  const entries = damageType
    .split('/')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const [rawKey, rawValue] = part.split(':');
      if (!rawKey || rawValue === undefined) return null;
      const key = rawKey.trim();
      const valueStr = rawValue.trim();
      if (!valueStr) return null;
      let value = Number.parseFloat(valueStr.replace('%', ''));
      if (Number.isNaN(value)) return null;
      if (valueStr.includes('%')) value /= 100;
      return { key, value };
    })
    .filter(Boolean) as { key: string; value: number }[];

  if (!entries.length) return null;

  let cut = 0;
  let blunt = 0;

  for (const entry of entries) {
    if (entry.key.includes('切割')) cut += entry.value;
    if (entry.key.includes('钝伤') || entry.key.includes('破甲')) blunt += entry.value;
  }

  const total = cut + blunt;
  if (total <= 0) return null;

  return {
    cut: _.round(cut / total, 4),
    blunt: _.round(blunt / total, 4),
  };
};

const getDamageRatio = (weaponType: string, damageType: string) => {
  const parsed = parseDamageTypeRatio(damageType);
  if (parsed) return parsed;
  const type = (weaponType || '').toLowerCase();
  if (/(锤|棍|棒|锏|钝|拳|破甲|钉锤)/.test(type)) return { cut: 0.2, blunt: 0.8 };
  if (/(斧|刀|剑|匕|镰|刃|长刀)/.test(type)) return { cut: 0.8, blunt: 0.2 };
  if (/(枪|矛|长枪)/.test(type)) return { cut: 0.6, blunt: 0.4 };
  return { cut: 0.5, blunt: 0.5 };
};

const isRangedWeapon = (weaponType: string) => /(弓|弩|远程|枪)/.test(weaponType || '');

const toNumber = (value: unknown, fallback = 0) => {
  const num = _.toNumber(value);
  return Number.isFinite(num) ? num : fallback;
};

const sumHpByFaction = (units: BattleCharacter[], faction: Faction, field: 'hp' | 'startHp') =>
  units
    .filter(unit => unit.faction === faction)
    .reduce((total, unit) => total + Math.max(0, toNumber(unit[field], 0)), 0);

const getBattleTotals = (units: BattleCharacter[]) => {
  const friendlyStart = sumHpByFaction(units, 'friendly', 'startHp');
  const enemyStart = sumHpByFaction(units, 'enemy', 'startHp');
  const friendlyEnd = sumHpByFaction(units, 'friendly', 'hp');
  const enemyEnd = sumHpByFaction(units, 'enemy', 'hp');
  const friendlyLossRate = friendlyStart > 0 ? _.clamp(1 - friendlyEnd / friendlyStart, 0, 1) : 1;
  const enemyLossRate = enemyStart > 0 ? _.clamp(1 - enemyEnd / enemyStart, 0, 1) : 1;
  const strengthRatio = enemyStart > 0 ? friendlyStart / enemyStart : 1;
  const friendlyAlive = friendlyEnd > 0.01;
  const enemyAlive = enemyEnd > 0.01;

  return {
    friendlyStart,
    enemyStart,
    friendlyEnd,
    enemyEnd,
    friendlyLossRate,
    enemyLossRate,
    strengthRatio,
    friendlyAlive,
    enemyAlive,
  };
};

const getFactionLossRate = (units: BattleCharacter[], faction: Faction) => {
  const start = sumHpByFaction(units, faction, 'startHp');
  const end = sumHpByFaction(units, faction, 'hp');
  return start > 0 ? _.clamp(1 - end / start, 0, 1) : 1;
};

const getFactionLossPenalty = (units: BattleCharacter[], faction: Faction) => {
  const factionUnits = units.filter(unit => unit.faction === faction);
  const deaths = factionUnits.filter(unit => unit.state === '死亡').length;
  const shocks = factionUnits.filter(unit => unit.state === '休克').length;
  const escaped = factionUnits.filter(unit => unit.escaped).length;
  return deaths * 13 + shocks * 8 + escaped * 6;
};

const getTraumaPenaltyByLevel = (level: number) => {
  if (level >= 4) return 18;
  if (level === 3) return 12;
  if (level === 2) return 7;
  if (level === 1) return 3;
  return 0;
};

const getTraumaPenalty = (unit: BattleCharacter) =>
  _.sum(
    Object.values(unit.traumaParts || { 左臂: 0, 右臂: 0, 左腿: 0, 右腿: 0 }).map(level =>
      getTraumaPenaltyByLevel(level),
    ),
  );

const getMoraleScore = (unit: BattleCharacter, units: BattleCharacter[]) => {
  if (unit.attributes.WIL > 80) return 100;
  const hpRatio = unit.maxHp > 0 ? _.clamp(unit.hp / unit.maxHp, 0, 1) : 0;
  const traumaPenalty = getTraumaPenalty(unit);
  const lossPenalty = getFactionLossPenalty(units, unit.faction);
  const morale = 20 + unit.attributes.WIL * 1 + hpRatio * 100 * 0.35 - traumaPenalty - lossPenalty;
  return _.clamp(morale, 0, 100);
};

const applyMoraleOutcome = (
  units: BattleCharacter[],
  unit: BattleCharacter,
  logs: string[],
  reason: 'round' | 'damage',
) => {
  if (unit.attributes.WIL > 80) return units;
  if (unit.subFaction === 'squad') return units;
  if (unit.hp <= 0 || unit.escaped) return units;
  const morale = getMoraleScore(unit, units);
  if (morale < 40) {
    const failKey = 'morale_escape_failures';
    const currentFails = unit.hitBonusAgainst[failKey] || 0;
    const updatedFails = currentFails + 1;
    let updated = { ...unit, escaped: true, hitBonusAgainst: { ...unit.hitBonusAgainst, [failKey]: updatedFails } };
    appendLog(logs, `${unit.name}: 士气不足，选择撤退(${reason === 'round' ? '回合开始' : '受伤'}判定)。`);

    if (updatedFails >= 2) {
      const roll = _.random(1, 6);
      if (roll <= 3) {
        updated = {
          ...updated,
          escaped: true,
          state: '投降',
          hitBonusAgainst: { ...updated.hitBonusAgainst, [failKey]: 0 },
        };
        appendLog(logs, `${unit.name}: 撤退失败过多，投降(1d6=${roll})。`);
      } else {
        updated = { ...updated, escaped: false, hitBonusAgainst: { ...updated.hitBonusAgainst, [failKey]: 0 } };
        appendLog(logs, `${unit.name}: 撤退失败过多，决死战斗(1d6=${roll})。`);
      }
    }

    return replaceUnit(units, updated);
  }
  return units;
};

const getBattleOutcome = (units: BattleCharacter[]): BattleOutcome => {
  const { friendlyLossRate, enemyLossRate, strengthRatio, friendlyAlive, enemyAlive } = getBattleTotals(units);

  if (friendlyAlive && !enemyAlive) {
    if (strengthRatio <= 0.7) return '史诗大捷';
    if (friendlyLossRate <= 0.15) return '酣畅大胜';
    if (friendlyLossRate <= 0.45) return '略处上风';
    return '血战险胜';
  }

  if (!friendlyAlive && enemyAlive) {
    if (enemyLossRate >= 0.6) return '血战惜败';
    if (enemyLossRate >= 0.3) return '略处下风';
    return '悲惨失败';
  }

  if (friendlyAlive && enemyAlive) {
    const lossDiff = Math.abs(friendlyLossRate - enemyLossRate);
    if (lossDiff <= 0.15) return '势均力敌';
    if (friendlyLossRate < enemyLossRate) {
      return friendlyLossRate <= 0.45 ? '略处上风' : '血战险胜';
    }
    return enemyLossRate >= 0.6 ? '血战惜败' : '略处下风';
  }

  return '势均力敌';
};

const getTraumaThresholdByLevel = (tgh: number, level: number) => {
  if (level >= 4) return 0;
  if (level <= 1) return tgh * 0.7;
  if (level === 2) return tgh * 0.9;
  return tgh * 0.4;
};

const getAttributeValue = (value: unknown, fallback = 30) => {
  if (value && typeof value === 'object') {
    const base = toNumber(_.get(value, ['基础']), 0);
    const bonus = toNumber(_.get(value, ['加成']), 0);
    const total = base + bonus;
    return Number.isFinite(total) && total > 0 ? total : fallback;
  }
  return toNumber(value, fallback);
};

const normalizeAttributes = (raw: any): Attributes => ({
  STR: getAttributeValue(_.get(raw, ['属性', 'STR']), 30),
  DEX: getAttributeValue(_.get(raw, ['属性', 'DEX']), 30),
  PER: getAttributeValue(_.get(raw, ['属性', 'PER']), 30),
  TGH: getAttributeValue(_.get(raw, ['属性', 'TGH']), 30),
  WIL: getAttributeValue(_.get(raw, ['属性', 'WIL']), 30),
  INT: getAttributeValue(_.get(raw, ['属性', 'INT']), 30),
  CHA: getAttributeValue(_.get(raw, ['属性', 'CHA']), 30),
});

const normalizeCharacter = (
  raw: any,
  name: string,
  faction: Faction,
  subFaction?: SubFaction,
): BattleCharacter | null => {
  if (!raw || typeof raw !== 'object') return null;
  const attributes = normalizeAttributes(raw);
  const level = Math.max(1, toNumber(_.get(raw, ['等级']), 1));
  const hp = Math.max(0, toNumber(_.get(raw, ['血量', '当前']), 100));
  const maxHp = Math.max(1, toNumber(_.get(raw, ['血量', '最大']), hp || 100));
  const weapon = _.get(raw, ['主武器'], {});
  const weaponType = _.get(weapon, ['种类'], '无');
  const weaponName = _.get(weapon, ['名字'], weaponType);
  const weaponDice = _.get(weapon, ['伤害骰'], '1d6');
  const weaponDamageType = _.get(weapon, ['伤害类型'], '');
  const subWeapon = _.get(raw, ['副武器'], {});
  const subWeaponType = _.get(subWeapon, ['种类'], '无');
  const subWeaponName = _.get(subWeapon, ['名字'], subWeaponType);
  const subWeaponDice = _.get(subWeapon, ['伤害骰'], '0d0');
  const subWeaponDamageType = _.get(subWeapon, ['伤害类型'], '');
  const armorRaw = _.get(raw, ['护甲'], {});
  const armorBaseDR = toNumber(_.get(armorRaw, ['防护能力(DR)']), toNumber(_.get(armorRaw, ['防护能力']), 0));
  const armorFeatureDR = toNumber(_.get(armorRaw, ['特性', 'DR']), 0);
  const armorDR = Math.max(0, armorBaseDR + armorFeatureDR);
  const traumaRaw = _.get(raw, ['创伤'], {});
  const getTraumaLevel = (part: '左臂' | '右臂' | '左腿' | '右腿') =>
    _.clamp(Math.floor(toNumber(_.get(traumaRaw, [part, '等级']), 0)), 0, 4);
  const getTraumaAccumulated = (part: '左臂' | '右臂' | '左腿' | '右腿') =>
    Math.max(0, toNumber(_.get(traumaRaw, [part, '累积受伤']), 0));
  const traumaParts = {
    左臂: getTraumaLevel('左臂'),
    右臂: getTraumaLevel('右臂'),
    左腿: getTraumaLevel('左腿'),
    右腿: getTraumaLevel('右腿'),
  };
  const traumaAccumulated = {
    左臂: Math.max(0, getTraumaThresholdByLevel(attributes.TGH, traumaParts.左臂) - getTraumaAccumulated('左臂')),
    右臂: Math.max(0, getTraumaThresholdByLevel(attributes.TGH, traumaParts.右臂) - getTraumaAccumulated('右臂')),
    左腿: Math.max(0, getTraumaThresholdByLevel(attributes.TGH, traumaParts.左腿) - getTraumaAccumulated('左腿')),
    右腿: Math.max(0, getTraumaThresholdByLevel(attributes.TGH, traumaParts.右腿) - getTraumaAccumulated('右腿')),
  };
  const bleedLayers = Math.max(0, Math.floor(toNumber(_.get(raw, ['流血', '层数']), 0)));
  const shockTurns = Math.max(0, Math.floor(toNumber(_.get(raw, ['状态', '休克回合']), 0)));
  const baseAttackCount = Math.floor(toNumber(_.get(raw, ['攻击次数']), 0));
  const isHeavyOrBlunt = /大型|钝器/.test(weaponType);
  const attackCount = Math.max(1, (isHeavyOrBlunt ? 1 : 2) + baseAttackCount);
  const raceName = String(_.get(raw, ['种族', '名称'], ''));
  const backpackItems = (_.get(raw, ['背包', '物品'], {}) || {}) as Record<
    string,
    { 介绍?: string; 数量?: number; 重量?: number; 价值?: number }
  >;

  return {
    id: String(_.get(raw, ['id'], name) || name),
    name,
    level,
    hp,
    maxHp,
    startHp: hp,
    fractured: false,
    faction,
    subFaction,
    intent: _.get(raw, ['意图'], undefined),
    state: _.get(raw, ['状态'], '正常'),
    attributes,
    weapon: {
      name: weaponName || weaponType || '无',
      type: weaponType || '无',
      damageDice: weaponDice || '1d6',
      damageType: weaponDamageType || '',
    },
    subWeapon: {
      name: subWeaponName || subWeaponType || '无',
      type: subWeaponType || '无',
      damageDice: subWeaponDice || '0d0',
      damageType: subWeaponDamageType || '',
    },
    armorDR,
    traumaParts,
    traumaAccumulated,
    bleedLayers,
    shockTurns,
    hasDowned: false,
    attackCount,
    noBlockNextRound: false,
    defenseBonus: 0,
    escaped: false,
    hitBonusAgainst: {},
    raceName,
    backpackItems,
    weaponRaw: weapon,
    subWeaponRaw: subWeapon,
    armorRaw,
    attributesRaw: _.get(raw, ['属性'], {}),
    traumaRaw,
  };
};

const buildUnitsFromStat = (stat: any) => {
  const units: BattleCharacter[] = [];
  const usedIds = new Set<string>();

  const pushUnit = (unit: BattleCharacter | null) => {
    if (!unit) return;
    if (unit.hp <= 0) return;
    if (usedIds.has(unit.id)) return;
    usedIds.add(unit.id);
    units.push(unit);
  };

  const current = _.get(stat, ['当前角色']);
  const currentName = _.get(current, ['id'], '玩家') || '玩家';
  pushUnit(normalizeCharacter(current, currentName, 'friendly', 'squad'));

  const squad = _.get(stat, ['小队成员'], {});
  _.forEach(squad, (value, key) => {
    if (value === '待初始化') return;
    pushUnit(normalizeCharacter(value, String(key), 'friendly', 'squad'));
  });

  const vision = _.get(stat, ['视野'], {});
  _.forEach(vision, (value, key) => {
    if (value === '待初始化') return;
    const stance = _.get(value, ['立场'], '中立');
    if (stance === '敌方') {
      pushUnit(normalizeCharacter(value, String(key), 'enemy'));
    } else if (stance === '友方') {
      pushUnit(normalizeCharacter(value, String(key), 'friendly', 'ally'));
    }
  });

  return {
    units,
    playerId: String(_.get(current, ['id'], currentName || '玩家')),
  };
};

const buildTurnOrder = (units: BattleCharacter[]) =>
  [...units]
    .filter(unit => unit.hp > 0 && !unit.escaped)
    .sort((a, b) => {
      if (a.attributes.DEX !== b.attributes.DEX) return b.attributes.DEX - a.attributes.DEX;
      if (a.attributes.PER !== b.attributes.PER) return b.attributes.PER - a.attributes.PER;
      return a.name.localeCompare(b.name, 'zh-Hans');
    });

const cloneUnits = (units: BattleCharacter[]) =>
  units.map(unit => ({
    ...unit,
    hitBonusAgainst: { ...unit.hitBonusAgainst },
  }));

const rollInjuryPart = () => ['左臂', '右臂', '左腿', '右腿'][_.random(0, 3)] as '左臂' | '右臂' | '左腿' | '右腿';

const getTraumaStageLabel = (level: number) => ['未受损', '擦伤', '负伤', '重创', '断肢'][_.clamp(level, 0, 4)];

const getMaxTraumaLevel = (unit: BattleCharacter) =>
  Math.max(0, ...Object.values(unit.traumaParts || { 左臂: 0, 右臂: 0, 左腿: 0, 右腿: 0 }));

const getArmTraumaLevel = (unit: BattleCharacter) => Math.max(unit.traumaParts?.左臂 || 0, unit.traumaParts?.右臂 || 0);

const getLegTraumaLevel = (unit: BattleCharacter) => Math.max(unit.traumaParts?.左腿 || 0, unit.traumaParts?.右腿 || 0);

const getArmPenalty = (level: number) => {
  if (level >= 4) return 9999;
  if (level >= 3) return 25;
  if (level >= 2) return 10;
  if (level >= 1) return 5;
  return 0;
};

const getLegPenalty = (level: number) => {
  if (level >= 4) return 9999;
  if (level >= 3) return 25;
  if (level >= 2) return 10;
  if (level >= 1) return 5;
  return 0;
};

const getKillExpByLevel = (level: number) => {
  if (level > 80) return 30 + level * 3;
  if (level > 50) return 30 + level * 2.5;
  return 30 + level * 2;
};

const getDownExpByLevel = (level: number) => {
  if (level > 80) return 10 + level * 3;
  if (level > 50) return 10 + level * 2.5;
  return 10 + level * 2;
};

const getEscapeExpByLevel = (level: number) => getDownExpByLevel(level) * 0.3;

const getMediumCheckSuccess = (tgh: number) => {
  const chance = _.clamp((tgh - 30) / 2, 0, 100);
  return d100() <= chance;
};

const getUnit = (units: BattleCharacter[], id: string) => units.find(unit => unit.id === id);

const replaceUnit = (units: BattleCharacter[], updated: BattleCharacter) =>
  units.map(unit => (unit.id === updated.id ? updated : unit));

const setUnitIntent = (units: BattleCharacter[], id: string, intent: string) => {
  const unit = getUnit(units, id);
  if (!unit) return units;
  return replaceUnit(units, { ...unit, intent });
};

const pickRandomTarget = (units: BattleCharacter[], faction: Faction) => {
  const candidates = units.filter(unit => unit.faction === faction && unit.hp > 0 && !unit.escaped);
  if (candidates.length === 0) return null;
  return candidates[_.random(0, candidates.length - 1)];
};

const getAttackPenalty = (unit: BattleCharacter) => {
  const armLevel = getArmTraumaLevel(unit);
  return getArmPenalty(armLevel);
};

const getDefensePenalty = (unit: BattleCharacter, useBlock: boolean) => {
  if (useBlock) {
    return getArmPenalty(getArmTraumaLevel(unit));
  }
  return getLegPenalty(getLegTraumaLevel(unit));
};

const getEscapePenalty = (unit: BattleCharacter) => {
  const penalty = getLegPenalty(getLegTraumaLevel(unit));
  if (unit.fractured) return penalty + 25;
  return penalty;
};

const getEscapeTraumaPenalty = (unit: BattleCharacter) => {
  const maxTrauma = getMaxTraumaLevel(unit);
  if (maxTrauma >= 4) return 9999;
  if (maxTrauma >= 3) return 25;
  if (maxTrauma >= 2) return 15;
  if (maxTrauma >= 1) return 5;
  return 0;
};

const getEscapeStatusPenalty = (unit: BattleCharacter) => {
  if (unit.state === '休克' || unit.state === '昏迷') return 9999;
  if (unit.hp <= 0 && unit.state !== '死亡') return 30;
  return 0;
};

const getAttackAttribute = (attacker: BattleCharacter) => {
  const fracturePenalty = attacker.fractured ? 15 : 0;
  const str = Math.max(1, attacker.attributes.STR - fracturePenalty);
  const dex = Math.max(1, attacker.attributes.DEX - fracturePenalty);
  const base = isRangedWeapon(attacker.weapon.type) ? attacker.attributes.PER : (str + dex) / 2;
  const penalty = getAttackPenalty(attacker);
  return Math.max(1, base - penalty);
};

const getDefenseBase = (defender: BattleCharacter, useBlock: boolean) => {
  const fracturePenalty = defender.fractured ? 15 : 0;
  const str = Math.max(1, defender.attributes.STR - fracturePenalty);
  const dex = Math.max(1, defender.attributes.DEX - fracturePenalty);
  const base = useBlock ? dex * 0.5 + str * 0.2 : dex * 0.6 + defender.attributes.PER * 0.2;
  const blockBonus = useBlock && /军刀/.test(defender.weapon.type) ? 7 : 0;
  const penalty = getDefensePenalty(defender, useBlock);
  return base + blockBonus + (defender.defenseBonus || 0) - penalty;
};

const getDefenseMode = (defender: BattleCharacter) => defender.weapon.type !== '无';

const applyDamage = (defender: BattleCharacter, damage: number) => {
  const newHp = Math.max(0, _.round(defender.hp - damage, 2));
  return { ...defender, hp: newHp };
};

const appendLog = (logs: string[], line: string) => {
  logs.push(line);
};

const CharacterCard = ({
  character,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
  onOpenDetail,
}: {
  character: BattleCharacter;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect?: () => void;
  onOpenDetail?: (type: 'weapon' | 'armor' | 'attributes' | 'trauma', character: BattleCharacter) => void;
}) => {
  const hpPercentage = Math.max(0, Math.min(100, (character.hp / character.maxHp) * 100));
  const isEnemy = character.faction === 'enemy';
  const statusLabel = (() => {
    if (character.state === '休克' && character.shockTurns > 0) return `休克·剩${character.shockTurns}回合`;
    if (character.hp > 0) return '';
    if (['死亡', '昏迷'].includes(character.state)) return character.state;
    return '';
  })();
  const raceLabel = character.raceName ? character.raceName : '';

  const getFactionLabel = () => {
    if (isEnemy) return { text: '敌方', color: 'text-red-400 border-red-900/50 bg-red-950/30' };
    if (character.subFaction === 'squad')
      return { text: '小队成员', color: 'text-blue-400 border-blue-900/50 bg-blue-950/30' };
    return { text: '友军', color: 'text-emerald-400 border-emerald-900/50 bg-emerald-950/30' };
  };

  const labelInfo = getFactionLabel();

  return (
    <div
      className={`relative group overflow-hidden rounded-sm border cursor-pointer ${
        isEnemy
          ? 'border-red-900/20 bg-gradient-to-br from-red-950/10 to-black/40'
          : 'border-blue-900/20 bg-gradient-to-br from-blue-950/10 to-black/40'
      } backdrop-blur-sm p-4 transition-all duration-500 hover:border-stone-500/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)] animate-fade-in-up ${
        isExpanded ? 'border-stone-500/50 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : ''
      } ${isSelected ? 'ring-2 ring-amber-400/60' : ''}`}
      onClick={() => {
        onSelect?.();
        onToggle();
      }}
    >
      <div
        className={`absolute top-0 left-0 w-[2px] h-full transition-all duration-300 group-hover:w-1 ${isEnemy ? 'bg-red-800/60' : 'bg-blue-800/60'}`}
      ></div>

      <div className="flex justify-between items-start mb-3 pl-3">
        <div>
          <h3 className="text-lg font-serif text-stone-200 tracking-wider drop-shadow-md">
            {character.name}
            {character.escaped ? <span className="ml-2 text-xs text-stone-500">(已逃跑)</span> : null}
            {statusLabel ? <span className="ml-2 text-xs text-rose-300">({statusLabel})</span> : null}
          </h3>
          {raceLabel ? <div className="mt-0.5 text-[10px] text-stone-500">{raceLabel}</div> : null}
          {character.intent && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs font-mono text-amber-400/90 bg-amber-950/20 px-2 py-0.5 rounded-sm border border-amber-900/30 w-fit">
              <Eye size={12} className="animate-pulse" /> 意图: {character.intent}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-sm border ${labelInfo.color}`}
          >
            {labelInfo.text}
          </span>
          {isExpanded ? (
            <ChevronUp size={16} className="text-stone-500" />
          ) : (
            <ChevronDown size={16} className="text-stone-500" />
          )}
        </div>
      </div>

      <div className="pl-3 mb-2">
        <div className="flex justify-between text-xs mb-1.5 font-mono text-stone-400">
          <span className="flex items-center gap-1.5">
            <Heart size={12} className={isEnemy ? 'text-red-500' : 'text-emerald-500'} /> 生命值
          </span>
          <span>
            {character.hp} <span className="text-stone-600">/ {character.maxHp}</span>
          </span>
        </div>
        <div className="h-1 w-full bg-stone-900/80 rounded-full overflow-hidden border border-stone-800/50">
          <div
            className={`h-full transition-all duration-1000 ease-out ${
              isEnemy
                ? 'bg-gradient-to-r from-red-800 to-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]'
                : 'bg-gradient-to-r from-emerald-800 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]'
            }`}
            style={{ width: `${hpPercentage}%` }}
          ></div>
        </div>
      </div>

      <div
        className={`pl-3 grid grid-cols-2 gap-3 transition-all duration-500 overflow-hidden ${
          isExpanded
            ? 'max-h-[400px] opacity-100 mt-4 pt-4 border-t border-stone-800/50'
            : 'max-h-0 opacity-0 mt-0 pt-0 border-transparent'
        }`}
      >
        <button
          type="button"
          onClick={event => {
            event.stopPropagation();
            onOpenDetail?.('weapon', character);
          }}
          className="bg-stone-900/40 border border-stone-800/50 rounded-sm p-2.5 hover:bg-stone-800/40 transition-colors text-left"
        >
          <h4 className="text-[10px] font-serif text-stone-400 flex items-center gap-1.5 mb-1.5">
            <Sword size={12} className="text-stone-500" /> 武器与装备
          </h4>
          <div className="text-xs font-mono text-stone-500 truncate">
            {character.weapon.name} ({character.weapon.damageDice})
          </div>
        </button>
        <button
          type="button"
          onClick={event => {
            event.stopPropagation();
            onOpenDetail?.('attributes', character);
          }}
          className="bg-stone-900/40 border border-stone-800/50 rounded-sm p-2.5 hover:bg-stone-800/40 transition-colors text-left"
        >
          <h4 className="text-[10px] font-serif text-stone-400 flex items-center gap-1.5 mb-1.5">
            <Activity size={12} className="text-stone-500" /> 七维属性
          </h4>
          <div className="text-[10px] font-mono text-stone-500">
            STR {character.attributes.STR} · DEX {character.attributes.DEX} · PER {character.attributes.PER}
          </div>
        </button>
        <button
          type="button"
          onClick={event => {
            event.stopPropagation();
            onOpenDetail?.('armor', character);
          }}
          className="bg-stone-900/40 border border-stone-800/50 rounded-sm p-2.5 hover:bg-stone-800/40 transition-colors text-left"
        >
          <h4 className="text-[10px] font-serif text-stone-400 flex items-center gap-1.5 mb-1.5">
            <Shield size={12} className="text-stone-500" /> 护甲与抗性
          </h4>
          <div className="text-xs font-mono text-stone-500 truncate">DR {character.armorDR}</div>
        </button>
        <button
          type="button"
          onClick={event => {
            event.stopPropagation();
            onOpenDetail?.('trauma', character);
          }}
          className="bg-stone-900/40 border border-stone-800/50 rounded-sm p-2.5 hover:bg-stone-800/40 transition-colors text-left"
        >
          <h4 className="text-[10px] font-serif text-stone-400 flex items-center gap-1.5 mb-1.5">
            <Skull size={12} className="text-stone-500" /> 生理创伤
          </h4>
          <div className="text-xs font-mono text-stone-500 truncate">
            左臂{character.traumaParts.左臂} 右臂{character.traumaParts.右臂}
          </div>
        </button>
      </div>
    </div>
  );
};

const BattleResultModal = ({
  outcome,
  outcomeDescription,
  logs,
  onCopy,
}: {
  outcome: BattleOutcome;
  outcomeDescription: string;
  logs: string[];
  onCopy: () => void;
}) => {
  const styles = OUTCOME_STYLES[outcome];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"></div>
      <div
        className={`relative glass-panel w-full max-w-md rounded-sm overflow-hidden border border-stone-700/40 shadow-[0_0_80px_rgba(0,0,0,0.9)] animate-fade-in-up ${styles.glow}`}
      >
        <div className={`absolute inset-0 pointer-events-none ${styles.aura}`}></div>
        <div className="relative p-10 text-center space-y-4">
          <div className={`text-3xl font-serif tracking-[0.3em] ${styles.title}`}>{outcome}</div>
          <div className="text-sm font-mono text-stone-400 tracking-widest">战斗结束</div>
          <div className="text-xs text-stone-300 leading-relaxed">{outcomeDescription}</div>
          <button
            onClick={onCopy}
            className="mx-auto mt-6 flex items-center justify-center gap-2 px-6 py-3 text-sm font-serif tracking-widest text-white bg-fuchsia-600 hover:bg-fuchsia-500 transition-all rounded-sm"
          >
            <span>发送战斗总结</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoModal = ({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity" onClick={onClose}></div>
    <div className="relative glass-panel w-full max-w-4xl rounded-sm overflow-hidden border border-stone-700/40 shadow-[0_0_80px_rgba(0,0,0,0.9)] animate-fade-in-up">
      <div className="p-6 border-b border-stone-800/60 bg-gradient-to-r from-stone-900/90 to-transparent flex items-center justify-between">
        <h2 className="text-xl font-serif text-stone-100 tracking-[0.2em]">{title}</h2>
        <button onClick={onClose} className="text-stone-500 hover:text-stone-200 transition-colors px-2 py-1">
          关闭
        </button>
      </div>
      {children}
    </div>
  </div>
);

const OUTCOME_UIDS: Record<BattleOutcome, number> = {
  酣畅大胜: 575,
  略处上风: 576,
  势均力敌: 577,
  血战险胜: 578,
  血战惜败: 579,
  略处下风: 580,
  悲惨失败: 581,
  史诗大捷: 582,
  投降: 583,
};
const SURRENDER_UID = 583;
const ALL_OUTCOME_UIDS = [...Object.values(OUTCOME_UIDS), SURRENDER_UID];

const applyBattleOutcomeWorldbook = async (uid: number) => {
  try {
    const charWorldbook = getCharWorldbookNames('current');
    const wbName = charWorldbook.primary;
    if (!wbName) return;
    await updateWorldbookWith(wbName, entries =>
      entries.map(entry => {
        if (ALL_OUTCOME_UIDS.includes(entry.uid)) {
          return { ...entry, enabled: entry.uid === uid };
        }
        return entry;
      }),
    );
  } catch (error) {
    console.error('触发战斗结局世界书条目失败', error);
  }
};

export default function App() {
  const [battleState, setBattleState] = useState<BattleState>({
    round: 1,
    units: [],
    logs: [],
    result: null,
    endReason: 'normal',
  });
  const battleOutcome = useMemo(() => getBattleOutcome(battleState.units), [battleState.units]);
  const displayOutcome: BattleOutcome = battleState.endReason === 'surrender' ? '投降' : battleOutcome;
  const battleOutcomeDescription = OUTCOME_DESCRIPTIONS[displayOutcome];
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const [expandedCharId, setExpandedCharId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [plannedActions, setPlannedActions] = useState<
    Record<
      string,
      {
        actionId: string;
        targetId?: string;
        targetIds?: string[];
        tactic?: 'taunt' | 'defense' | 'medical' | 'escape';
        itemName?: string;
      }
    >
  >({});
  const [tacticsOpen, setTacticsOpen] = useState(false);
  const [medicalSelecting, setMedicalSelecting] = useState(false);
  const [medicalItemSelecting, setMedicalItemSelecting] = useState(false);
  const [medicalActorId, setMedicalActorId] = useState<string | null>(null);
  const [selectedMedicalTargetId, setSelectedMedicalTargetId] = useState<string | null>(null);
  const [selectedMedicalItem, setSelectedMedicalItem] = useState<string | null>(null);
  const [roundLimit, setRoundLimit] = useState<number | null>(10);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [infoModal, setInfoModal] = useState<null | 'rules' | 'round' | 'tutorial' | 'weapon' | 'trauma'>(null);
  const [detailModal, setDetailModal] = useState<null | {
    type: 'weapon' | 'armor' | 'attributes' | 'trauma';
    character: BattleCharacter;
  }>(null);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [targetingMode, setTargetingMode] = useState<'attack' | null>(null);
  const [attackSelectionIds, setAttackSelectionIds] = useState<string[]>([]);
  const [attackSelectionActorId, setAttackSelectionActorId] = useState<string | null>(null);
  const [spotlightRect, setSpotlightRect] = useState<null | {
    left: number;
    top: number;
    width: number;
    height: number;
  }>(null);
  const [tooltipPos, setTooltipPos] = useState<null | { left: number; top: number }>(null);
  const actionButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const autoSelectRef = useRef<HTMLButtonElement | null>(null);
  const outcomeTriggeredRef = useRef(false);
  const cancelledRef = useRef(false);
  const [surrenderConfirmOpen, setSurrenderConfirmOpen] = useState(false);
  const [resultConfirmed, setResultConfirmed] = useState(false);
  const isMobile = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const byUa = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(ua);
    const byWidth =
      typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(max-width: 1024px)').matches : false;
    return byUa || byWidth;
  }, []);

  const friendlyUnits = useMemo(
    () => battleState.units.filter(unit => unit.faction === 'friendly'),
    [battleState.units],
  );
  const enemyUnits = useMemo(() => battleState.units.filter(unit => unit.faction === 'enemy'), [battleState.units]);
  const unitNameMap = useMemo(() => {
    const map = new Map<string, BattleCharacter>();
    battleState.units.forEach(unit => map.set(unit.name, unit));
    return map;
  }, [battleState.units]);
  const friendlyAliveCount = useMemo(
    () =>
      friendlyUnits.filter(unit => unit.hp > 0 && !unit.escaped && unit.state !== '死亡' && unit.state !== '休克')
        .length,
    [friendlyUnits],
  );
  const enemyAliveCount = useMemo(
    () =>
      enemyUnits.filter(unit => unit.hp > 0 && !unit.escaped && unit.state !== '死亡' && unit.state !== '休克').length,
    [enemyUnits],
  );
  const getLogLineClass = (line: string) => {
    if (line.startsWith('---')) return 'text-stone-400 mt-4';
    if (line.startsWith(SETTLEMENT_LOG)) return 'text-amber-300';
    const match = line.match(/^([^:：]+)[:：]/);
    if (!match) return 'text-stone-200';
    const unit = unitNameMap.get(match[1].trim());
    if (!unit) return 'text-stone-200';
    if (unit.faction === 'enemy') return 'text-red-300';
    if (unit.faction === 'friendly' && unit.subFaction === 'squad') return 'text-sky-300';
    if (unit.faction === 'friendly') return 'text-emerald-300';
    return 'text-stone-200';
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    handleFullscreenChange();
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch (error) {
      console.error('切换全屏失败', error);
    }
  };

  useEffect(() => {
    if (!battleState.result || !resultConfirmed) {
      outcomeTriggeredRef.current = false;
      return;
    }
    if (outcomeTriggeredRef.current) return;
    outcomeTriggeredRef.current = true;
    if (battleState.endReason === 'surrender') {
      applyBattleOutcomeWorldbook(SURRENDER_UID);
      return;
    }
    const uid = OUTCOME_UIDS[battleOutcome];
    if (uid) applyBattleOutcomeWorldbook(uid);
  }, [battleOutcome, battleState.endReason, battleState.result, resultConfirmed]);

  const loadBattleState = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      await waitGlobalInitialized('Mvu');
      const resolveMessageId = () => (typeof getCurrentMessageId === 'function' ? getCurrentMessageId() : 'latest');
      const getMvuDataSafe = (messageId: number | 'latest') =>
        Mvu.getMvuData({ type: 'message', message_id: messageId });

      await waitUntil(
        () => {
          const currentId = resolveMessageId();
          const currentData = getMvuDataSafe(currentId);
          if (_.has(currentData, 'stat_data')) return true;
          if (currentId !== 'latest') {
            const latestData = getMvuDataSafe('latest');
            return _.has(latestData, 'stat_data');
          }
          return false;
        },
        { timeout: 10000, intervalBetweenAttempts: 200 },
      );
      const currentId = resolveMessageId();
      let mvuData = getMvuDataSafe(currentId);
      if (!_.has(mvuData, 'stat_data') && currentId !== 'latest') {
        mvuData = getMvuDataSafe('latest');
      }
      const stat = _.get(mvuData, ['stat_data'], {});
      const { units, playerId } = buildUnitsFromStat(stat);
      if (cancelledRef.current) return;
      setBattleState({ round: 1, units, logs: [], result: null, endReason: 'normal' });
      setPlayerId(playerId);
      setResultConfirmed(false);
      setSelectedActorId(playerId);
      setSelectedTargetId(units.find(unit => unit.faction === 'enemy')?.id ?? null);
      setPlannedActions({});
      setLoading(false);
    } catch (err) {
      if (cancelledRef.current) return;
      if (!isMobile) {
        setBattleState(prev => ({
          ...prev,
          logs: [...prev.logs, `无法读取 MVU 变量: ${String(err)}`],
        }));
      }
      setLoadError(String(err));
      setLoading(false);
    }
  };

  useEffect(() => {
    cancelledRef.current = false;
    loadBattleState();
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const handleRetryLoad = () => {
    loadBattleState();
  };

  useEffect(() => {
    if (infoModal === 'tutorial') {
      setTutorialStep(0);
    }
  }, [infoModal]);

  useLayoutEffect(() => {
    if (infoModal !== 'tutorial') return;
    const step = tutorialSteps[tutorialStep];
    const target = step?.key === 'auto' ? autoSelectRef.current : actionButtonRefs.current[step?.key || ''];
    if (!target) {
      setSpotlightRect(null);
      setTooltipPos(null);
      return;
    }
    const rect = target.getBoundingClientRect();
    const spotlight = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    const maxWidth = 320;
    const tooltipHeight = 180;
    const margin = 16;
    let left = rect.left + rect.width + margin;
    let top = rect.top;
    if (left + maxWidth > window.innerWidth - margin) {
      left = Math.max(margin, rect.left - maxWidth - margin);
    }
    if (top + tooltipHeight > window.innerHeight - margin) {
      top = Math.max(margin, window.innerHeight - tooltipHeight - margin);
    }
    setSpotlightRect(spotlight);
    setTooltipPos({ left, top });
  }, [infoModal, tutorialStep]);

  useEffect(() => {
    if (infoModal !== 'tutorial') return;
    const handleResize = () => {
      const step = tutorialSteps[tutorialStep];
      const target = step?.key === 'auto' ? autoSelectRef.current : actionButtonRefs.current[step?.key || ''];
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const spotlight = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
      const maxWidth = 320;
      const tooltipHeight = 180;
      const margin = 16;
      let left = rect.left + rect.width + margin;
      let top = rect.top;
      if (left + maxWidth > window.innerWidth - margin) {
        left = Math.max(margin, rect.left - maxWidth - margin);
      }
      if (top + tooltipHeight > window.innerHeight - margin) {
        top = Math.max(margin, window.innerHeight - tooltipHeight - margin);
      }
      setSpotlightRect(spotlight);
      setTooltipPos({ left, top });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [infoModal, tutorialStep]);

  const handleToggleExpand = (id: string) => {
    setExpandedCharId(prev => (prev === id ? null : id));
  };

  const handleSelectActor = (id: string) => {
    setSelectedActorId(id);
  };

  const updateUnitIntent = (id: string, intent: string) => {
    setBattleState(prev => ({
      ...prev,
      units: setUnitIntent(prev.units, id, intent),
    }));
  };

  const planAction = (actionId: string) => {
    const actorId = selectedActorId || playerId;
    if (!actorId) return;
    const actor = getUnit(battleState.units, actorId);
    if (!actor || actor.subFaction !== 'squad' || actor.escaped) return;

    if (actionId === 'attack') {
      if (targetingMode === 'attack' && attackSelectionActorId === actorId && attackSelectionIds.length > 0) {
        setPlannedActions(prev => ({
          ...prev,
          [actorId]: { actionId: 'attack', targetIds: attackSelectionIds },
        }));
        updateUnitIntent(actorId, `攻击 ${attackSelectionIds.join('、')}`);
        setTargetingMode(null);
        setAttackSelectionIds([]);
        setAttackSelectionActorId(null);
        return;
      }
      setTargetingMode('attack');
      setAttackSelectionActorId(actorId);
      setAttackSelectionIds([]);
      updateUnitIntent(actorId, '选择攻击目标');
      return;
    }

    if (actionId === 'tactics') {
      setTacticsOpen(true);
      return;
    }

    if (actionId === 'surrender') {
      setSurrenderConfirmOpen(true);
      return;
    }
  };

  const confirmSurrender = () => {
    const actorId = selectedActorId || playerId;
    const actor = actorId ? getUnit(battleState.units, actorId) : null;
    const name = actor?.name ? `${actor.name}` : '我军';
    setBattleState(prev => ({
      ...prev,
      logs: [...prev.logs, `${name}: 选择投降，战斗结束。`],
      result: 'defeat',
      endReason: 'surrender',
    }));
    setPlannedActions({});
    setSurrenderConfirmOpen(false);
  };

  const applyTactic = (tactic: 'taunt' | 'defense' | 'medical' | 'escape') => {
    const actorId = selectedActorId || playerId;
    if (!actorId) return;
    const actor = getUnit(battleState.units, actorId);
    if (!actor || actor.subFaction !== 'squad' || actor.escaped) return;

    if (tactic === 'medical') {
      setMedicalActorId(actorId);
      setSelectedMedicalTargetId(null);
      setSelectedMedicalItem(null);
      setMedicalSelecting(true);
      setMedicalItemSelecting(false);
      updateUnitIntent(actorId, '选择医疗目标');
      setPlannedActions(prev => ({
        ...prev,
        [actorId]: { actionId: 'tactics', tactic },
      }));
      setTacticsOpen(false);
      return;
    }

    if (tactic === 'taunt') {
      const target = selectedTargetId ? getUnit(battleState.units, selectedTargetId) : null;
      if (target && target.faction === 'enemy' && !target.escaped) {
        setPlannedActions(prev => ({
          ...prev,
          [actorId]: { actionId: 'tactics', tactic: 'taunt', targetId: target.id },
        }));
        updateUnitIntent(actorId, `嘲弄 ${target.name}`);
      } else {
        updateUnitIntent(actorId, '嘲弄失败');
      }
      setTacticsOpen(false);
      return;
    }

    setPlannedActions(prev => ({
      ...prev,
      [actorId]: { actionId: 'tactics', tactic },
    }));
    const intentMap = { defense: '防御', medical: '医疗', escape: '逃跑' } as const;
    updateUnitIntent(actorId, intentMap[tactic]);
    setTacticsOpen(false);
  };

  const applyBleedAndShock = (units: BattleCharacter[], logs: string[]) => {
    let working = units;
    working.forEach(unit => {
      if (unit.escaped) return;
      if (unit.bleedLayers > 0) {
        const bleedDamage = unit.bleedLayers;
        const newHp = Math.max(0, unit.hp - bleedDamage);
        const updated = { ...unit, hp: newHp };
        working = replaceUnit(working, updated);
        appendLog(logs, `${unit.name}: 流血造成 ${bleedDamage} 伤害。`);
      }
      if (unit.state === '休克' && unit.shockTurns > 0) {
        const nextTurns = unit.shockTurns - 1;
        const updated = { ...unit, shockTurns: Math.max(0, nextTurns) };
        working = replaceUnit(working, updated);
        if (nextTurns <= 0) {
          const dead = { ...updated, state: '死亡' };
          working = replaceUnit(working, dead);
          appendLog(logs, `${unit.name}: 休克时间耗尽，死亡。`);
        }
      }
    });
    return working;
  };

  const autoSelectTargets = () => {
    const updates: Record<string, { actionId: string; targetId?: string }> = {};
    battleState.units.forEach(unit => {
      if (unit.faction !== 'friendly' || unit.subFaction !== 'squad' || unit.escaped || unit.hp <= 0) return;
      const target = pickRandomTarget(battleState.units, 'enemy');
      if (target) {
        updates[unit.id] = { actionId: 'attack', targetId: target.id };
        updateUnitIntent(unit.id, `攻击 ${target.name}`);
      } else {
        updates[unit.id] = { actionId: 'attack' };
        updateUnitIntent(unit.id, '无有效目标');
      }
    });
    setPlannedActions(prev => ({ ...prev, ...updates }));
  };

  type AttackResult = {
    units: BattleCharacter[];
    attacker: BattleCharacter;
    defender: BattleCharacter;
    dodged?: boolean;
  };

  const applyAttack = (
    units: BattleCharacter[],
    attacker: BattleCharacter,
    defender: BattleCharacter,
    attackIndex: number,
    logs: string[],
    attackPenaltyExtra = 0,
  ): AttackResult => {
    const hitBonus = attacker.hitBonusAgainst[defender.id] || 0;
    if (attacker.hitBonusAgainst[defender.id]) {
      attacker.hitBonusAgainst[defender.id] = 0;
    }

    const rawRoll = d100();
    const attackRoll = rawRoll + hitBonus - attackPenaltyExtra;
    const evadeBase = defender.attributes.DEX * 0.5 + defender.attributes.PER * 0.2;
    const evadeValue = Math.min(70, evadeBase);
    const isCrit = rawRoll <= 7;
    const isHeavyWeapon = /大型/.test(attacker.weapon.type);
    const isFumble = rawRoll >= (isHeavyWeapon ? 90 : 95);

    if (isFumble) {
      appendLog(logs, `${attacker.name}: 攻击检定大失败 (判定 ${rawRoll})`);
      if (/(弩|弓)/.test(attacker.weapon.type)) {
        const allyTargets = units.filter(
          unit => unit.faction === attacker.faction && unit.id !== attacker.id && unit.hp > 0 && !unit.escaped,
        );
        const ally = allyTargets.length ? allyTargets[_.random(0, allyTargets.length - 1)] : null;
        if (ally) {
          appendLog(logs, `${attacker.name}: 大失败！误伤队友 ${ally.name}。`);
          const ratio = getDamageRatio(attacker.weapon.type, attacker.weapon.damageType);
          const baseDamage =
            rollDice(attacker.weapon.damageDice) +
            rollDice(attacker.subWeapon.damageDice) +
            (attacker.attributes.STR - 20) * 0.4;
          const rawDamage = Math.max(0, baseDamage);
          const finalDamage = rawDamage;
          const cutDamage = Math.round(finalDamage * ratio.cut);
          const bluntDamage = Math.round(finalDamage * ratio.blunt);
          const drIgnore = /弩/.test(attacker.weapon.type) ? 7 : 0;
          const effectiveDR = Math.max(0, ally.armorDR - drIgnore);
          const cutAfterDR = Math.max(0, Math.round(cutDamage - effectiveDR));
          const totalDamage = Math.round(cutAfterDR + bluntDamage);
          const updatedAlly = applyDamage(ally, totalDamage);
          appendLog(logs, `${attacker.name}: 误伤${ally.name}，造成 ${totalDamage} 伤害。`);
          return {
            units: replaceUnit(replaceUnit(units, attacker), updatedAlly),
            attacker,
            defender: updatedAlly,
          };
        }
        return { units, attacker, defender };
      }
      if (isHeavyWeapon) {
        attacker.defenseBonus -= 15;
        appendLog(logs, `${attacker.name}: 失衡，防御检定-15。`);
      }
      appendLog(logs, `${attacker.name}: 大失败！下一轮无法格挡，触发${defender.name}反击。`);
      attacker.noBlockNextRound = true;
      return applyAttack(units, defender, attacker, 0, logs);
    }

    if (attackRoll < evadeValue) {
      appendLog(logs, `${attacker.name}: 攻击落空 (判定 ${attackRoll.toFixed(0)} < ${evadeValue.toFixed(0)})`);
      return { units, attacker, defender, dodged: true };
    }

    appendLog(logs, `${attacker.name}: 通过闪避判定 (判定 ${attackRoll.toFixed(0)} >= ${evadeValue.toFixed(0)})`);

    if (isHeavyWeapon && attackPenaltyExtra === 0) {
      const targetPool = units.filter(unit => unit.faction === defender.faction && unit.hp > 0 && !unit.escaped);
      if (targetPool.length === 0) {
        return { units, attacker, defender };
      }
      let newTarget = defender;
      if (targetPool.length > 1) {
        const candidates = targetPool.filter(unit => unit.id !== defender.id);
        if (candidates.length) newTarget = candidates[_.random(0, candidates.length - 1)];
      }
      const heavyResult = applyAttack(units, attacker, newTarget, attackIndex, logs, attackPenaltyExtra);
      return { units: heavyResult.units, attacker, defender: heavyResult.defender };
    }

    let useBlock = getDefenseMode(defender);
    if (defender.noBlockNextRound) useBlock = false;
    const defensePenalty = attackIndex * 10;
    const defenseBase = getDefenseBase(defender, useBlock);
    const defenseChance = defenseBase + (defender.attributes.DEX - attacker.attributes.DEX) - defensePenalty;
    const defenseRoll = d100();
    const defenseSuccess = defenseRoll <= defenseChance && !(isCrit && useBlock);

    if (defenseSuccess) {
      if (!useBlock) {
        appendLog(logs, `${defender.name}: 闪避成功 (判定 ${defenseRoll} <= ${defenseChance.toFixed(0)})`);
        if (defenseRoll <= 7) {
          defender.hitBonusAgainst[attacker.id] = 20;
          appendLog(logs, `${defender.name}: 闪避大成功，下一次攻击${attacker.name}命中+20。`);
        }
        return { units, attacker, defender, dodged: true };
      }
      appendLog(logs, `${defender.name}: 格挡成功 (判定 ${defenseRoll} <= ${defenseChance.toFixed(0)})`);
    }

    const baseDamage = rollDice(attacker.weapon.damageDice) + (attacker.attributes.STR - 20) * 0.4;
    const rawDamage = Math.max(0, baseDamage);
    const critMultiplier = isCrit ? 1.5 : 1;
    const finalDamage = rawDamage * critMultiplier;
    const ratio = getDamageRatio(attacker.weapon.type, attacker.weapon.damageType);
    let cutDamage = Math.round(finalDamage * ratio.cut);
    let bluntDamage = Math.round(finalDamage * ratio.blunt);

    if (defenseSuccess && useBlock) {
      cutDamage = 0;
      bluntDamage = Math.round(bluntDamage * 0.5);
    }

    const drIgnore = /砍刀/.test(attacker.weapon.type) ? 5 : /弩/.test(attacker.weapon.type) ? 7 : 0;
    const effectiveDR = Math.max(0, defender.armorDR - drIgnore);
    const cutAfterDR = Math.max(0, Math.round(cutDamage - effectiveDR));
    const totalDamage = Math.round(cutAfterDR + bluntDamage);
    const armorAbsorbed = Math.round(Math.max(0, cutDamage - cutAfterDR));

    const hpBefore = defender.hp;
    const updatedDefender = applyDamage(defender, totalDamage);
    const hpAfter = updatedDefender.hp;
    const hitPart = rollInjuryPart();
    const baseThreshold = getTraumaThresholdByLevel(defender.attributes.TGH, defender.traumaParts[hitPart] || 0);
    const currentRemaining = updatedDefender.traumaAccumulated?.[hitPart] ?? baseThreshold;
    const newRemaining = currentRemaining - totalDamage;
    updatedDefender.traumaAccumulated = {
      ...updatedDefender.traumaAccumulated,
      [hitPart]: _.round(newRemaining, 2),
    };
    const damageText = `造成 ${totalDamage} 伤害 (切割 ${cutDamage}(减伤${armorAbsorbed}) / 破甲 ${bluntDamage})`;
    appendLog(logs, `${attacker.name}: 命中${defender.name}(${hitPart})，${damageText}`);

    if (/武士刀/.test(attacker.weapon.type) && cutAfterDR > 0) {
      updatedDefender.bleedLayers += 1;
      appendLog(logs, `${defender.name}: 武士刀追加流血层数+1。`);
    }

    if (/砍刀/.test(attacker.weapon.type) && isCrit) {
      const reduced = Math.max(0, updatedDefender.armorDR - 10);
      updatedDefender.armorDR = reduced;
      appendLog(logs, `${defender.name}: 破甲效果触发，DR降低10。`);
    }

    if (/钝器/.test(attacker.weapon.type) && isCrit) {
      const toughSuccess = getMediumCheckSuccess(defender.attributes.TGH);
      if (!toughSuccess) {
        updatedDefender.fractured = true;
        appendLog(logs, `${defender.name}: 骨折！力量/敏捷-15，逃跑检定-25，需夹板包处理。`);
      }
    }

    const traumaThreshold = defender.attributes.TGH * 0.4;
    let traumaIncreased = false;
    if (totalDamage > traumaThreshold || isCrit) {
      traumaIncreased = true;
    }

    if (updatedDefender.hp <= 0 && defender.hp > 0 && !defender.hasDowned) {
      updatedDefender.hasDowned = true;
    }

    if (traumaIncreased) {
      const partLevel = updatedDefender.traumaParts[hitPart] || 0;
      const maxHp = Math.max(1, defender.maxHp || 1);
      const tgh = Math.max(1, defender.attributes.TGH || 1);
      let nextLevel = partLevel;
      let remaining = updatedDefender.traumaAccumulated[hitPart] || 0;

      const immediateUpgrade =
        (partLevel <= 1 && (isCrit || totalDamage > tgh * 0.6)) ||
        (partLevel === 2 && totalDamage > tgh * 0.6) ||
        (partLevel === 3 && totalDamage > tgh * 0.3);
      if (immediateUpgrade) remaining = Math.min(remaining, 0);

      if (totalDamage >= maxHp * 0.7) {
        nextLevel = 4;
        remaining = 0;
      } else if (totalDamage >= maxHp * 0.5 && nextLevel < 3) {
        nextLevel = 3;
        remaining = getTraumaThresholdByLevel(tgh, 3) + Math.min(0, remaining);
      }

      while (nextLevel < 4 && remaining <= 0) {
        nextLevel += 1;
        if (nextLevel >= 4) {
          remaining = 0;
          break;
        }
        remaining += getTraumaThresholdByLevel(tgh, nextLevel);
      }

      updatedDefender.traumaAccumulated = {
        ...updatedDefender.traumaAccumulated,
        [hitPart]: _.round(Math.max(0, remaining), 2),
      };

      if (nextLevel > partLevel) {
        updatedDefender.traumaParts = { ...updatedDefender.traumaParts, [hitPart]: nextLevel };
        updatedDefender.bleedLayers = Math.max(0, updatedDefender.bleedLayers + 1);
        appendLog(logs, `${defender.name}: ${hitPart}${getTraumaStageLabel(nextLevel)}，流血层数+1。`);
      }
    }

    if (hpAfter <= 0 && hpBefore > 0) {
      appendLog(logs, `${defender.name}: HP ${hpBefore.toFixed(0)} → ${hpAfter.toFixed(0)}，触发体质检定。`);
      const toughSuccess = getMediumCheckSuccess(defender.attributes.TGH);
      if (toughSuccess) {
        updatedDefender.state = '昏迷';
        appendLog(logs, `${defender.name}: 体质检定成功，陷入昏迷。`);
      } else {
        updatedDefender.state = '死亡';
        appendLog(logs, `${defender.name}: 体质检定失败，确认死亡。`);
      }
    }

    const moraleUnits = applyMoraleOutcome(units, updatedDefender, logs, 'damage');
    return {
      units: replaceUnit(replaceUnit(moraleUnits, attacker), updatedDefender),
      attacker,
      defender: updatedDefender,
    };
  };

  const runRound = () => {
    if (!playerId) return;

    setBattleState(prev => {
      if (prev.result) return prev;
      const logs: string[] = [];
      let workingUnits = cloneUnits(prev.units).map(unit => ({ ...unit, defenseBonus: 0 }));
      appendLog(logs, `--- 第 ${prev.round} 回合 ---`);
      workingUnits = applyBleedAndShock(workingUnits, logs);
      workingUnits = workingUnits.reduce((acc, unit) => applyMoraleOutcome(acc, unit, logs, 'round'), workingUnits);

      const player = getUnit(workingUnits, playerId);
      if (!player || player.hp <= 0) {
        appendLog(logs, '玩家无法行动。');
        appendLog(logs, SETTLEMENT_LOG);
        return { ...prev, logs: [...prev.logs, ...logs], result: 'defeat', endReason: 'normal' };
      }

      const tauntTargets: Record<string, string> = {};
      Object.entries(plannedActions).forEach(([actorId, action]) => {
        if (action.actionId === 'tactics' && action.tactic === 'taunt' && action.targetId) {
          const target = getUnit(workingUnits, action.targetId);
          const actor = getUnit(workingUnits, actorId);
          if (target && actor && !target.escaped && !actor.escaped && target.hp > 0 && actor.hp > 0) {
            tauntTargets[target.id] = actor.id;
          }
        }
      });

      const enemyTargetMap: Record<string, string> = {};
      workingUnits
        .filter(unit => unit.faction === 'enemy' && unit.hp > 0 && !unit.escaped)
        .forEach(enemy => {
          const tauntedBy = tauntTargets[enemy.id];
          const taunter = tauntedBy ? getUnit(workingUnits, tauntedBy) : null;
          const target =
            taunter && !taunter.escaped && taunter.hp > 0 ? taunter : pickRandomTarget(workingUnits, 'friendly');
          if (target) {
            enemyTargetMap[enemy.id] = target.id;
            workingUnits = setUnitIntent(workingUnits, enemy.id, `攻击 ${target.name}`);
          } else {
            workingUnits = setUnitIntent(workingUnits, enemy.id, '无有效目标');
          }
        });

      const turnOrderIds = buildTurnOrder(workingUnits).map(unit => unit.id);

      for (const actorId of turnOrderIds) {
        const actor = getUnit(workingUnits, actorId);
        if (!actor || actor.hp <= 0) continue;

        if (actor.faction === 'friendly') {
          if (actor.subFaction === 'squad') {
            const planned = plannedActions[actor.id];

            if (planned?.actionId === 'tactics' && planned.tactic === 'taunt') {
              appendLog(logs, `${actor.name}: 使用嘲弄，本回合不攻击。`);
              continue;
            }

            if (planned?.actionId === 'tactics' && planned.tactic === 'defense') {
              workingUnits = replaceUnit(workingUnits, { ...actor, defenseBonus: 10 });
              workingUnits = setUnitIntent(workingUnits, actor.id, '防御');
              appendLog(logs, `${actor.name}: 进入防御姿态，格挡基础+10。`);
              continue;
            }

            if (planned?.actionId === 'tactics' && planned.tactic === 'medical') {
              const targetId =
                selectedMedicalTargetId && getUnit(workingUnits, selectedMedicalTargetId)?.faction === 'friendly'
                  ? selectedMedicalTargetId
                  : actor.id;
              const target = getUnit(workingUnits, targetId) ?? actor;
              const isSkeleton = (target.raceName || '').includes('骨人');
              const chosenItem = planned.itemName || selectedMedicalItem || '';

              const actorItemCounts = (name: string) => toNumber(actor.backpackItems[name]?.数量, 0);

              const consumeItem = (unit: BattleCharacter, itemName: string) => {
                const current = toNumber(unit.backpackItems[itemName]?.数量, 0);
                const next = Math.max(0, current - 1);
                const nextItems = {
                  ...unit.backpackItems,
                  [itemName]: { ...unit.backpackItems[itemName], 数量: next },
                };
                return { ...unit, backpackItems: nextItems };
              };

              const hasAnyItem = [
                '基础急救包',
                '标准急救包',
                '高级急救包',
                '普通夹板包',
                '高级夹板包',
                '骨人修理包',
                '骨人修理箱',
              ].some(name => actorItemCounts(name) > 0);

              if (!hasAnyItem) {
                workingUnits = setUnitIntent(workingUnits, actor.id, '医疗失败');
                appendLog(logs, `${actor.name}: 此角色背包没有可用医疗物品。`);
                continue;
              }

              if (!chosenItem) {
                workingUnits = setUnitIntent(workingUnits, actor.id, '未选择医疗物品');
                appendLog(logs, `${actor.name}: 未选择医疗物品。`);
                continue;
              }

              if (actorItemCounts(chosenItem) <= 0) {
                workingUnits = setUnitIntent(workingUnits, actor.id, '物品不足');
                appendLog(logs, `${actor.name}: 选择的${chosenItem}不足。`);
                continue;
              }

              const isSkeletonItem = ['骨人修理包', '骨人修理箱'].includes(chosenItem);
              if (isSkeletonItem && !isSkeleton) {
                workingUnits = setUnitIntent(workingUnits, actor.id, '物品不可用');
                appendLog(logs, `${actor.name}: ${chosenItem}仅可用于骨人。`);
                continue;
              }
              if (!isSkeletonItem && isSkeleton) {
                workingUnits = setUnitIntent(workingUnits, actor.id, '物品不可用');
                appendLog(logs, `${actor.name}: 非骨人医疗物品无法用于骨人。`);
                continue;
              }

              let updatedTarget = target;
              let updatedActor = actor;
              let healAmount = 0;
              let traumaReduce = 0;

              if (['基础急救包', '标准急救包', '高级急救包', '骨人修理包', '骨人修理箱'].includes(chosenItem)) {
                if (chosenItem === '基础急救包') healAmount = Math.round(target.maxHp * 0.1);
                if (chosenItem === '标准急救包') healAmount = Math.round(target.maxHp * 0.2);
                if (chosenItem === '高级急救包') healAmount = Math.round(target.maxHp * 0.35);
                if (chosenItem === '骨人修理包') healAmount = Math.round(target.maxHp * 0.15);
                if (chosenItem === '骨人修理箱') healAmount = Math.round(target.maxHp * 0.3);

                const newHp = Math.min(target.maxHp, Math.max(0, target.hp + healAmount));
                updatedTarget = { ...updatedTarget, hp: newHp };
                updatedActor = consumeItem(updatedActor, chosenItem);
                appendLog(logs, `${actor.name}: 对${target.name}使用${chosenItem}，恢复${healAmount}生命。`);
              }

              if (['普通夹板包', '高级夹板包'].includes(chosenItem)) {
                traumaReduce = chosenItem === '高级夹板包' ? 2 : 1;
                const entries = Object.entries(updatedTarget.traumaParts) as Array<
                  ['左臂' | '右臂' | '左腿' | '右腿', number]
                >;
                const [partToHeal] = entries.sort((a, b) => b[1] - a[1])[0] || ['左臂', 0];
                const currentLevel = updatedTarget.traumaParts[partToHeal] || 0;
                const nextLevel = Math.max(0, currentLevel - traumaReduce);
                updatedTarget = {
                  ...updatedTarget,
                  traumaParts: { ...updatedTarget.traumaParts, [partToHeal]: nextLevel },
                  fractured: false,
                };
                updatedActor = consumeItem(updatedActor, chosenItem);
                appendLog(
                  logs,
                  `${actor.name}: 对${target.name}使用${chosenItem}，${partToHeal}创伤降低${traumaReduce}级并解除骨折。`,
                );
              }

              if (updatedActor.id === updatedTarget.id) {
                const merged = { ...updatedTarget, backpackItems: updatedActor.backpackItems };
                workingUnits = replaceUnit(workingUnits, merged);
              } else {
                workingUnits = replaceUnit(workingUnits, updatedActor);
                workingUnits = replaceUnit(workingUnits, updatedTarget);
              }
              workingUnits = setUnitIntent(workingUnits, actor.id, `医疗 ${target.name}`);
              continue;
            }

            if (planned?.actionId === 'tactics' && planned.tactic === 'escape') {
              const targetedCount = Object.values(enemyTargetMap).filter(targetId => targetId === actor.id).length;
              const escapeRoll = d100();
              const traumaPenalty = getEscapeTraumaPenalty(actor);
              const statusPenalty = getEscapeStatusPenalty(actor);
              if (traumaPenalty >= 9999 || statusPenalty >= 9999) {
                workingUnits = setUnitIntent(workingUnits, actor.id, '逃跑失败');
                appendLog(logs, `${actor.name}: 逃跑失败，无法移动。`);
                continue;
              }
              const escapePenalty = getEscapePenalty(actor) + targetedCount * 20 + traumaPenalty + statusPenalty;
              const escapeChance = 60 - escapePenalty;
              const criticalEscape = escapeRoll <= 5 && traumaPenalty < 25 && statusPenalty < 30;
              if (escapeRoll <= escapeChance || criticalEscape) {
                workingUnits = replaceUnit(workingUnits, { ...actor, escaped: true });
                workingUnits = setUnitIntent(workingUnits, actor.id, '逃跑成功');
                appendLog(logs, `${actor.name}: 逃跑成功，退出战斗。`);
              } else {
                workingUnits = setUnitIntent(workingUnits, actor.id, '逃跑失败');
                appendLog(logs, `${actor.name}: 逃跑失败，被敌人锁定。`);
              }
              continue;
            }

            if (planned?.actionId === 'surrender') {
              workingUnits = setUnitIntent(workingUnits, actor.id, '投降');
              appendLog(logs, `${actor.name}: 选择投降，战斗结束。`);
              appendLog(logs, SETTLEMENT_LOG);
              return { ...prev, logs: [...prev.logs, ...logs], result: 'defeat', endReason: 'surrender' };
            }

            let target: BattleCharacter | null = null;
            const plannedTargetIds = planned?.actionId === 'attack' ? planned.targetIds || [] : [];
            if (planned?.actionId === 'attack' && planned.targetId) {
              target = getUnit(workingUnits, planned.targetId) ?? null;
            }
            if (!target || target.hp <= 0 || target.escaped) {
              target = pickRandomTarget(workingUnits, 'enemy');
            }
            if (!target) {
              workingUnits = setUnitIntent(workingUnits, actor.id, '无有效目标');
              continue;
            }

            workingUnits = setUnitIntent(workingUnits, actor.id, `攻击 ${target.name}`);
            const currentTarget = target;
            const isPolearm = /长柄/.test(actor.weapon.type);
            const isHeavyWeapon = /大型/.test(actor.weapon.type);
            const explicitTargets = plannedTargetIds
              .map((id: string) => getUnit(workingUnits, id))
              .filter((unit: BattleCharacter | undefined | null): unit is BattleCharacter =>
                Boolean(unit && unit.hp > 0 && !unit.escaped),
              );
            const extraTargets = isPolearm
              ? workingUnits.filter(
                  unit => unit.faction === 'enemy' && unit.id !== currentTarget.id && unit.hp > 0 && !unit.escaped,
                )
              : [];
            const poleTargets = isPolearm
              ? explicitTargets.length
                ? explicitTargets
                : [currentTarget, ...extraTargets.slice(0, 2)]
              : [currentTarget];
            for (const [index, poleTarget] of poleTargets.entries()) {
              const extraPenalty = isPolearm ? index * 7 : 0;
              const perAttackTargets = isHeavyWeapon
                ? [
                    poleTarget,
                    ...workingUnits
                      .filter(
                        unit => unit.faction === 'enemy' && unit.id !== poleTarget.id && unit.hp > 0 && !unit.escaped,
                      )
                      .slice(0, 1),
                  ]
                : [poleTarget];
              for (let i = 0; i < actor.attackCount; i += 1) {
                let allDodged = isHeavyWeapon;
                for (const targetPick of perAttackTargets) {
                  const result = applyAttack(workingUnits, actor, targetPick, i, logs, extraPenalty);
                  workingUnits = result.units;
                  if (isHeavyWeapon && !result.dodged) allDodged = false;
                }
                if (isHeavyWeapon && perAttackTargets.length > 0 && allDodged) {
                  const latestActor = getUnit(workingUnits, actor.id);
                  if (latestActor) {
                    const updatedActor = {
                      ...latestActor,
                      defenseBonus: (latestActor.defenseBonus || 0) - 15,
                    };
                    workingUnits = replaceUnit(workingUnits, updatedActor);
                    appendLog(logs, `${latestActor.name}: 被闪避导致失衡，防御检定-15。`);
                  }
                }
              }
            }
          } else {
            const target = pickRandomTarget(workingUnits, 'enemy');
            if (!target) {
              workingUnits = setUnitIntent(workingUnits, actor.id, '无有效目标');
              continue;
            }
            workingUnits = setUnitIntent(workingUnits, actor.id, `攻击 ${target.name}`);
            const currentTarget = target;
            const isPolearm = /长柄/.test(actor.weapon.type);
            const isHeavyWeapon = /大型/.test(actor.weapon.type);
            const extraTargets = isPolearm
              ? workingUnits.filter(
                  unit => unit.faction === 'enemy' && unit.id !== currentTarget.id && unit.hp > 0 && !unit.escaped,
                )
              : [];
            const poleTargets = isPolearm ? [currentTarget, ...extraTargets.slice(0, 2)] : [currentTarget];
            for (const [index, poleTarget] of poleTargets.entries()) {
              const extraPenalty = isPolearm ? index * 7 : 0;
              const perAttackTargets = isHeavyWeapon
                ? [
                    poleTarget,
                    ...workingUnits
                      .filter(
                        unit => unit.faction === 'enemy' && unit.id !== poleTarget.id && unit.hp > 0 && !unit.escaped,
                      )
                      .slice(0, 1),
                  ]
                : [poleTarget];
              for (let i = 0; i < actor.attackCount; i += 1) {
                let allDodged = isHeavyWeapon;
                for (const targetPick of perAttackTargets) {
                  const result = applyAttack(workingUnits, actor, targetPick, i, logs, extraPenalty);
                  workingUnits = result.units;
                  if (isHeavyWeapon && !result.dodged) allDodged = false;
                }
                if (isHeavyWeapon && perAttackTargets.length > 0 && allDodged) {
                  const latestActor = getUnit(workingUnits, actor.id);
                  if (latestActor) {
                    const updatedActor = {
                      ...latestActor,
                      defenseBonus: (latestActor.defenseBonus || 0) - 15,
                    };
                    workingUnits = replaceUnit(workingUnits, updatedActor);
                    appendLog(logs, `${latestActor.name}: 被闪避导致失衡，防御检定-15。`);
                  }
                }
              }
            }
          }
        } else {
          const targetId = enemyTargetMap[actor.id];
          const target = targetId ? getUnit(workingUnits, targetId) : null;
          if (!target) {
            workingUnits = setUnitIntent(workingUnits, actor.id, '无有效目标');
            continue;
          }
          const currentTarget = target;
          const isPolearm = /长柄/.test(actor.weapon.type);
          const isHeavyWeapon = /大型/.test(actor.weapon.type);
          const extraTargets = isPolearm
            ? workingUnits.filter(
                unit => unit.faction === 'friendly' && unit.id !== currentTarget.id && unit.hp > 0 && !unit.escaped,
              )
            : [];
          const poleTargets = isPolearm ? [currentTarget, ...extraTargets.slice(0, 2)] : [currentTarget];
          for (const [index, poleTarget] of poleTargets.entries()) {
            const extraPenalty = isPolearm ? index * 7 : 0;
            const perAttackTargets = isHeavyWeapon
              ? [
                  poleTarget,
                  ...workingUnits
                    .filter(
                      unit => unit.faction === 'friendly' && unit.id !== poleTarget.id && unit.hp > 0 && !unit.escaped,
                    )
                    .slice(0, 1),
                ]
              : [poleTarget];
            for (let i = 0; i < actor.attackCount; i += 1) {
              let allDodged = isHeavyWeapon;
              for (const targetPick of perAttackTargets) {
                const result = applyAttack(workingUnits, actor, targetPick, i, logs, extraPenalty);
                workingUnits = result.units;
                if (isHeavyWeapon && !result.dodged) allDodged = false;
              }
              if (isHeavyWeapon && perAttackTargets.length > 0 && allDodged) {
                const latestActor = getUnit(workingUnits, actor.id);
                if (latestActor) {
                  const updatedActor = {
                    ...latestActor,
                    defenseBonus: (latestActor.defenseBonus || 0) - 15,
                  };
                  workingUnits = replaceUnit(workingUnits, updatedActor);
                  appendLog(logs, `${latestActor.name}: 被闪避导致失衡，防御检定-15。`);
                }
              }
            }
          }
        }
      }

      const friendAlive = workingUnits.some(unit => unit.faction === 'friendly' && unit.hp > 0 && !unit.escaped);
      const enemyAlive = workingUnits.some(unit => unit.faction === 'enemy' && unit.hp > 0 && !unit.escaped);
      let result: BattleState['result'] = enemyAlive ? (friendAlive ? null : 'defeat') : 'victory';

      if (roundLimit && prev.round >= roundLimit) {
        appendLog(logs, `达到回合上限 ${roundLimit}，战斗结束。`);
        if (enemyAlive && friendAlive) {
          result = 'defeat';
        }
      }

      if (result) {
        appendLog(logs, SETTLEMENT_LOG);
      }

      return {
        round: prev.round + 1,
        units: workingUnits,
        logs: [...prev.logs, ...logs],
        result,
        endReason: result ? 'normal' : prev.endReason,
      };
    });
  };

  const handleActionClick = (action: ActionType) => {
    if (action.id === 'end_round') {
      runRound();
      return;
    }
    planAction(action.id);
  };

  const handleCopyLogs = async () => {
    const buildStatusLabel = (unit: BattleCharacter) => {
      if (unit.escaped) return '已逃跑';
      if (unit.state === '死亡') return '死亡';
      if (unit.state === '休克') return '休克';
      if (unit.state === '昏迷') return '昏迷';
      if (unit.hp <= 0) return '濒死';
      return '正常';
    };

    const getTraumaLabelByLevel = (level: number) => {
      if (level >= 4) return '断肢';
      if (level >= 3) return '重创';
      if (level >= 2) return '负伤';
      if (level >= 1) return '擦伤';
      return '无伤';
    };

    const getTraumaDetailLabel = (unit: BattleCharacter) => {
      const parts: Array<{ name: string; level: number }> = [
        { name: '左臂', level: unit.traumaParts.左臂 },
        { name: '右臂', level: unit.traumaParts.右臂 },
        { name: '左腿', level: unit.traumaParts.左腿 },
        { name: '右腿', level: unit.traumaParts.右腿 },
      ];
      return parts.map(part => `${part.name}${getTraumaLabelByLevel(part.level)}`).join('，');
    };

    const enemyUnits = battleState.units.filter(unit => unit.faction === 'enemy');
    const totalExp = _.sumBy(enemyUnits, unit => {
      if (unit.escaped) return getEscapeExpByLevel(unit.level);
      if (unit.state === '死亡') return getKillExpByLevel(unit.level);
      if (unit.hasDowned || unit.state === '昏迷' || unit.hp <= 0) return getDownExpByLevel(unit.level);
      return 0;
    });

    const expReceivers = battleState.units.filter(
      unit => unit.faction === 'friendly' && unit.subFaction === 'squad' && !unit.escaped,
    );
    const perMemberExp = expReceivers.length > 0 ? Math.round(totalExp / expReceivers.length) : 0;
    const expMap = new Map<string, number>();
    expReceivers.forEach(unit => {
      expMap.set(unit.id, perMemberExp);
    });

    const summarizeUnit = (unit: BattleCharacter) => {
      const baseHp = Number.isFinite(unit.startHp) ? unit.startHp : unit.hp;
      const damageTaken = Math.max(0, Math.round(baseHp - unit.hp));
      const currentHp = Math.max(0, Math.round(unit.hp));
      const traumaLabel = getTraumaDetailLabel(unit);
      const expText = expMap.has(unit.id) ? `，获得${expMap.get(unit.id)}经验` : '';
      return `${unit.name}: 受到伤害${damageTaken}, 当前血量${currentHp}, 创伤(${traumaLabel}), 状态${buildStatusLabel(unit)}${expText}`;
    };

    const friendLines = battleState.units
      .filter(unit => unit.faction === 'friendly')
      .map(summarizeUnit)
      .join('\n');
    const enemyLines = battleState.units
      .filter(unit => unit.faction === 'enemy')
      .map(summarizeUnit)
      .join('\n');

    const outcome = displayOutcome;
    const outcomeDescription = OUTCOME_DESCRIPTIONS[outcome];

    const summary = `战斗总结\n\n【${outcome}】：${outcomeDescription}\n\n我方：\n${friendLines || '无'}\n\n敌方：\n${enemyLines || '无'}\n\n请根据以上战后内容，描写述说这一战斗过程，不要在正文出现数值相关内容，这场战斗我方【${outcome}】`;

    try {
      await createChatMessages([{ role: 'user', message: summary }]);
      await triggerSlash('/trigger');
    } catch (error) {
      navigator.clipboard.writeText(summary);
      setBattleState(prev => ({
        ...prev,
        logs: [...prev.logs, `发送总结失败，已复制到剪贴板: ${String(error)}`],
      }));
    }
  };

  const openDetailModal = (type: 'weapon' | 'armor' | 'attributes' | 'trauma', character: BattleCharacter) => {
    setDetailModal({ type, character });
  };

  const getTraumaStatus = (unit: BattleCharacter) => {
    const states: string[] = [];
    if (getMaxTraumaLevel(unit) >= 1) states.push('失衡');
    if (unit.bleedLayers > 0) states.push(`流血${unit.bleedLayers}`);
    if (unit.fractured) states.push('骨折');
    if (unit.state === '休克') states.push('休克');
    if (unit.state === '昏迷') states.push('眩晕');
    if (unit.state === '死亡') states.push('死亡');
    if (unit.hp <= 0 && unit.state !== '死亡') states.push('濒死');
    if (states.length === 0) return '无';
    return states.join(' · ');
  };

  const getTraumaThreshold = (tgh: number, level: number) => getTraumaThresholdByLevel(tgh, level);

  const renderDetailContent = () => {
    if (!detailModal) return null;
    const { type, character } = detailModal;
    const armorFeatureDR = toNumber(_.get(character.armorRaw, ['特性', 'DR']), 0);
    const armorBaseDR = toNumber(
      _.get(character.armorRaw, ['防护能力(DR)']),
      toNumber(_.get(character.armorRaw, ['防护能力']), 0),
    );
    const tghValue = Math.max(1, character.attributes.TGH || 1);
    const getRemaining = (part: '左臂' | '右臂' | '左腿' | '右腿') =>
      character.traumaParts[part] >= 4
        ? 0
        : Math.round(
            Math.max(
              0,
              character.traumaAccumulated?.[part] ?? getTraumaThreshold(tghValue, character.traumaParts[part]),
            ),
          );
    const traumaThresholdText = `左臂${getRemaining('左臂')} 右臂${getRemaining('右臂')} 左腿${getRemaining('左腿')} 右腿${getRemaining(
      '右腿',
    )}`;
    const traumaStageText = `左臂${getTraumaStageLabel(character.traumaParts.左臂)} 右臂${getTraumaStageLabel(
      character.traumaParts.右臂,
    )} 左腿${getTraumaStageLabel(character.traumaParts.左腿)} 右腿${getTraumaStageLabel(character.traumaParts.右腿)}`;
    const traumaStatus = getTraumaStatus(character);

    if (type === 'weapon') {
      return (
        <div className="p-6 grid gap-4 text-sm">
          <div className="text-xs text-stone-400">武器信息</div>
          <div className="space-y-2 font-mono text-stone-200">
            <div>名称：{character.weapon.name}</div>
            <div>类型：{character.weapon.type}</div>
            <div>伤害骰：{character.weapon.damageDice}</div>
            <div>伤害类型：{character.weapon.damageType || '未定义'}</div>
          </div>
        </div>
      );
    }

    if (type === 'attributes') {
      return (
        <div className="p-6 grid gap-4 text-sm">
          <div className="text-xs text-stone-400">七维属性</div>
          <div className="grid grid-cols-2 gap-3 font-mono text-stone-200">
            <div>STR：{character.attributes.STR}</div>
            <div>DEX：{character.attributes.DEX}</div>
            <div>PER：{character.attributes.PER}</div>
            <div>TGH：{character.attributes.TGH}</div>
            <div>WIL：{character.attributes.WIL}</div>
            <div>INT：{character.attributes.INT}</div>
            <div>CHA：{character.attributes.CHA}</div>
          </div>
        </div>
      );
    }

    if (type === 'armor') {
      return (
        <div className="p-6 grid gap-4 text-sm">
          <div className="text-xs text-stone-400">护甲信息</div>
          <div className="space-y-2 font-mono text-stone-200">
            <div>总DR：{character.armorDR}</div>
            <div>基础DR：{armorBaseDR}</div>
            <div>特性DR：{armorFeatureDR}</div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 grid gap-4 text-sm">
        <div className="text-xs text-stone-400">创伤与状态</div>
        <div className="space-y-2 font-mono text-stone-200">
          <div>阈值：{traumaThresholdText}</div>
          <div>创伤：{traumaStageText}</div>
          <div>状态：{traumaStatus}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-[100svh] min-h-[100svh] lg:h-auto lg:aspect-[16/9] lg:min-h-[720px] bg-[#050505] text-stone-300 font-sans selection:bg-stone-700 selection:text-white flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-900/20 via-[#050505] to-black pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>

      {isMobile && loadError && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
          <div className="w-full max-w-sm rounded-sm border border-amber-900/60 bg-stone-900/90 p-4 text-center">
            <div className="text-amber-300 text-sm font-mono">无法读取 MVU 变量</div>
            <div className="mt-2 text-xs text-stone-400 font-mono break-all">{loadError}</div>
            <button
              type="button"
              onClick={handleRetryLoad}
              disabled={loading}
              className={`mt-4 px-4 py-2 text-xs font-mono border rounded-sm transition-colors ${
                loading
                  ? 'text-stone-600 border-stone-800/60 cursor-not-allowed'
                  : 'text-amber-200 border-amber-900/60 hover:bg-amber-900/30'
              }`}
            >
              {loading ? '重试中...' : '重试读取'}
            </button>
          </div>
        </div>
      )}

      <header className="relative z-20 px-4 py-3 lg:px-8 lg:py-5 border-b border-stone-800/40 bg-black/40 backdrop-blur-md flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-sm border border-stone-700/50 flex items-center justify-center bg-stone-900/80 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            <Sword size={16} className="text-stone-400" />
          </div>
          <div className="text-2xl font-serif text-stone-200 tracking-[0.25em] text-shadow-glow">终末之诗</div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-lg font-serif text-stone-400 tracking-widest border-l border-stone-800 pl-6 flex items-center gap-2 relative">
            回合数
            <span className="text-stone-200 font-mono text-2xl">
              {roundLimit
                ? `${String(battleState.round).padStart(2, '0')}/${String(roundLimit).padStart(2, '0')}`
                : String(battleState.round).padStart(2, '0')}
            </span>
            <button
              onClick={() => setSettingsOpen(prev => !prev)}
              className="text-stone-500 hover:text-stone-200 transition-colors"
            >
              <Settings size={16} />
            </button>
            {settingsOpen && (
              <>
                <button
                  type="button"
                  aria-label="关闭设置"
                  onClick={() => setSettingsOpen(false)}
                  className="fixed inset-0 z-10 cursor-default"
                />
                <div className="absolute z-20 mt-32 right-4 bg-stone-900/90 border border-stone-700/60 rounded-sm shadow-lg p-2 text-xs font-mono w-52">
                  <button
                    onClick={() => {
                      setSettingsOpen(false);
                      setInfoModal('rules');
                    }}
                    className="block w-full text-left px-3 py-2 rounded-sm hover:bg-stone-800/60 text-stone-300"
                  >
                    战斗流程规则详解
                  </button>
                  <button
                    onClick={() => {
                      setSettingsOpen(false);
                      toggleFullscreen();
                    }}
                    className="block w-full text-left px-3 py-2 rounded-sm hover:bg-stone-800/60 text-stone-300"
                  >
                    {isFullscreen ? '退出全屏' : '进入全屏'}
                  </button>
                  <button
                    onClick={() => {
                      setSettingsOpen(false);
                      setInfoModal('round');
                    }}
                    className="block w-full text-left px-3 py-2 rounded-sm hover:bg-stone-800/60 text-stone-300"
                  >
                    回合数量选择
                  </button>
                  <button
                    onClick={() => {
                      setSettingsOpen(false);
                      setInfoModal('tutorial');
                    }}
                    className="block w-full text-left px-3 py-2 rounded-sm hover:bg-stone-800/60 text-stone-300"
                  >
                    战斗面板教程
                  </button>
                  <button
                    onClick={() => {
                      setSettingsOpen(false);
                      setInfoModal('weapon');
                    }}
                    className="block w-full text-left px-3 py-2 rounded-sm hover:bg-stone-800/60 text-stone-300"
                  >
                    武器类别详解
                  </button>
                  <button
                    onClick={() => {
                      setSettingsOpen(false);
                      setInfoModal('trauma');
                    }}
                    className="block w-full text-left px-3 py-2 rounded-sm hover:bg-stone-800/60 text-stone-300"
                  >
                    创伤与状态详解
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {infoModal === 'rules' && (
        <InfoModal title="战斗流程规则详解" onClose={() => setInfoModal(null)}>
          <div className="p-6 max-h-[70vh] overflow-y-auto font-mono text-sm whitespace-pre-wrap text-stone-300">
            {BATTLE_RULES}
          </div>
        </InfoModal>
      )}
      {infoModal === 'tutorial' && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {spotlightRect && (
            <div
              className="absolute rounded-sm"
              style={{
                left: spotlightRect.left - 6,
                top: spotlightRect.top - 6,
                width: spotlightRect.width + 12,
                height: spotlightRect.height + 12,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.6), 0 0 30px rgba(251,191,36,0.85)',
                border: '1px solid rgba(251,191,36,0.8)',
              }}
            />
          )}
          <div
            className="absolute max-w-[320px] bg-stone-900/95 border border-amber-900/60 rounded-sm shadow-[0_0_40px_rgba(0,0,0,0.8)] p-4 text-stone-200 pointer-events-auto"
            style={
              tooltipPos
                ? { left: tooltipPos.left, top: tooltipPos.top }
                : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
            }
          >
            <div className="text-sm font-serif text-amber-200 tracking-[0.15em]">
              {tutorialSteps[tutorialStep].title}
            </div>
            <div className="mt-3 text-xs text-stone-300 leading-relaxed">
              <div className="text-amber-100/90">{tutorialSteps[tutorialStep].quote}</div>
              <div className="mt-1">{tutorialSteps[tutorialStep].description}</div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[10px] font-mono text-stone-500">
                {tutorialStep + 1} / {tutorialSteps.length}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setInfoModal(null)} className="text-[10px] text-stone-400 hover:text-stone-200">
                  跳过
                </button>
                <button
                  onClick={() => setTutorialStep(prev => Math.max(0, prev - 1))}
                  className={`px-3 py-1 text-xs font-mono border rounded-sm ${
                    tutorialStep <= 0
                      ? 'text-stone-600 border-stone-800/60 cursor-not-allowed'
                      : 'text-stone-300 border-stone-700/60 hover:bg-stone-800/40'
                  }`}
                  disabled={tutorialStep <= 0}
                >
                  上一步
                </button>
                <button
                  onClick={() => {
                    if (tutorialStep >= tutorialSteps.length - 1) {
                      setInfoModal(null);
                      return;
                    }
                    setTutorialStep(prev => Math.min(prev + 1, tutorialSteps.length - 1));
                  }}
                  className="px-3 py-1 text-xs font-mono text-amber-200 border border-amber-900/60 rounded-sm hover:bg-amber-900/30"
                >
                  {tutorialStep >= tutorialSteps.length - 1 ? '完成' : '下一步'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {infoModal === 'weapon' && (
        <InfoModal title="武器类别详解" onClose={() => setInfoModal(null)}>
          <div className="p-6 max-h-[70vh] overflow-y-auto font-mono text-sm whitespace-pre-wrap text-stone-300">
            {WEAPON_CATEGORY_GUIDE}
          </div>
        </InfoModal>
      )}
      {infoModal === 'trauma' && (
        <InfoModal title="创伤与状态详解" onClose={() => setInfoModal(null)}>
          <div className="p-6 max-h-[70vh] overflow-y-auto font-mono text-sm whitespace-pre-wrap text-stone-300">
            {TRAUMA_RULES}
          </div>
        </InfoModal>
      )}
      {infoModal === 'round' && (
        <InfoModal title="回合数量选择" onClose={() => setInfoModal(null)}>
          <div className="p-6 max-h-[70vh] overflow-y-auto font-mono text-sm text-stone-300">
            <div className="text-xs text-stone-400 mb-4">当前回合上限：{roundLimit ? roundLimit : '无上限'}</div>
            <div className="grid gap-2">
              {[5, 10, 15].map(limit => (
                <button
                  key={limit}
                  onClick={() => {
                    setRoundLimit(limit);
                    setInfoModal(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-sm border border-stone-700/60 hover:bg-stone-800/60 ${
                    roundLimit === limit ? 'text-emerald-300' : 'text-stone-300'
                  }`}
                >
                  上限 {limit}
                </button>
              ))}
              <button
                onClick={() => {
                  setRoundLimit(null);
                  setInfoModal(null);
                }}
                className={`w-full text-left px-3 py-2 rounded-sm border border-stone-700/60 hover:bg-stone-800/60 ${
                  roundLimit === null ? 'text-emerald-300' : 'text-stone-300'
                }`}
              >
                无上限
              </button>
            </div>
          </div>
        </InfoModal>
      )}

      <main className="flex-1 min-h-0 relative z-10 flex flex-col lg:flex-row overflow-hidden">
        {targetingMode === 'attack' && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="absolute left-0 top-0 h-full w-[28%] min-w-[300px] bg-black/50" />
          </div>
        )}
        <div
          className="order-1 lg:order-none w-full lg:w-[28%] lg:min-w-[300px] max-h-[28vh] lg:max-h-none p-4 lg:p-6 overflow-y-auto border-b border-stone-800/30 lg:border-b-0 lg:border-r lg:border-stone-800/30 bg-gradient-to-r from-black/80 to-transparent scrollbar-hide flex flex-col min-h-0 overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        >
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-stone-800/50">
            <h2 className="text-sm font-serif text-stone-400 tracking-[0.2em] flex items-center gap-3">
              <div className="w-1.5 h-4 bg-blue-600 rounded-sm shadow-[0_0_10px_rgba(37,99,235,0.8)]"></div>
              友方阵营
            </h2>
            <span className="text-xs font-mono text-stone-600">
              {friendlyAliveCount}/{friendlyUnits.length} 单位
            </span>
          </div>
          <div className="flex flex-col gap-4 flex-1">
            {friendlyUnits.map(unit => (
              <CharacterCard
                key={unit.id}
                character={unit}
                isExpanded={expandedCharId === unit.id}
                isSelected={medicalSelecting ? selectedMedicalTargetId === unit.id : selectedActorId === unit.id}
                onToggle={() => handleToggleExpand(unit.id)}
                onSelect={() => {
                  if (medicalSelecting) {
                    if (!unit.escaped) {
                      setSelectedMedicalTargetId(unit.id);
                      const actorId = medicalActorId || selectedActorId || playerId;
                      if (actorId) updateUnitIntent(actorId, `医疗 ${unit.name}`);
                      setMedicalSelecting(false);
                      setMedicalItemSelecting(true);
                    }
                    return;
                  }
                  if (unit.subFaction === 'squad' && !unit.escaped) handleSelectActor(unit.id);
                }}
                onOpenDetail={openDetailModal}
              />
            ))}
          </div>
        </div>

        <div className="order-2 lg:order-none flex-1 min-h-0 p-4 lg:p-8 flex flex-col relative">
          <div className="absolute inset-0 bg-stone-950/40 backdrop-blur-sm m-4 lg:m-8 rounded-sm border border-stone-800/40 shadow-[inset_0_0_60px_rgba(0,0,0,0.8)]"></div>

          <div
            className="relative z-10 flex-1 overflow-y-auto p-6 lg:p-10 font-serif text-base leading-[1.8] text-stone-300 space-y-3 scrollbar-hide overscroll-contain"
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
          >
            <div className="text-center mb-6">
              <span className="inline-block px-4 py-1 border border-stone-800/60 rounded-sm text-xs font-mono text-stone-500 tracking-widest bg-stone-900/30">
                战斗日志
              </span>
            </div>

            {!isMobile && loadError ? (
              <div className="space-y-3 text-center">
                <div className="text-amber-300 text-sm font-mono">无法读取 MVU 变量</div>
                <div className="text-xs text-stone-500 font-mono break-all">{loadError}</div>
                <button
                  type="button"
                  onClick={handleRetryLoad}
                  disabled={loading}
                  className={`mx-auto px-4 py-2 text-xs font-mono border rounded-sm transition-colors ${
                    loading
                      ? 'text-stone-600 border-stone-800/60 cursor-not-allowed'
                      : 'text-amber-200 border-amber-900/60 hover:bg-amber-900/30'
                  }`}
                >
                  {loading ? '重试中...' : '重试读取'}
                </button>
              </div>
            ) : battleState.logs.length === 0 ? (
              <div className="text-center text-stone-500 text-sm font-mono">等待你的指令...</div>
            ) : (
              <div className="space-y-2 font-mono text-sm whitespace-pre-wrap">
                {battleState.logs.map((line, index) => {
                  const isSettlement = line.startsWith(SETTLEMENT_LOG);
                  return (
                    <div
                      key={`${line}-${index}`}
                      className={`${getLogLineClass(line)} ${isSettlement ? 'cursor-pointer text-base sm:text-lg text-center' : ''}`}
                      onClick={() => {
                        if (isSettlement) setResultConfirmed(true);
                      }}
                    >
                      {line}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div
          className="order-3 lg:order-none w-full lg:w-[28%] lg:min-w-[300px] max-h-[28vh] lg:max-h-none p-4 lg:p-6 overflow-y-auto border-t border-stone-800/30 lg:border-t-0 lg:border-l lg:border-stone-800/30 bg-gradient-to-l from-black/80 to-transparent scrollbar-hide flex flex-col min-h-0 overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        >
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-stone-800/50">
            <span className="text-xs font-mono text-stone-600">
              {enemyAliveCount}/{enemyUnits.length} 单位
            </span>
            <h2 className="text-sm font-serif text-stone-400 tracking-[0.2em] flex items-center gap-3">
              敌方阵营
              <div className="w-1.5 h-4 bg-red-600 rounded-sm shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
            </h2>
          </div>
          <div className="flex flex-col gap-4 flex-1">
            {enemyUnits.map(unit => (
              <CharacterCard
                key={unit.id}
                character={unit}
                isExpanded={expandedCharId === unit.id}
                isSelected={
                  selectedTargetId === unit.id || (targetingMode === 'attack' && attackSelectionIds.includes(unit.id))
                }
                onToggle={() => handleToggleExpand(unit.id)}
                onSelect={() => {
                  setSelectedTargetId(unit.id);
                  if (targetingMode === 'attack') {
                    const actorId = selectedActorId || playerId;
                    const actor = actorId ? getUnit(battleState.units, actorId) : null;
                    if (
                      actorId &&
                      actor &&
                      actor.subFaction === 'squad' &&
                      !actor.escaped &&
                      unit.hp > 0 &&
                      !unit.escaped
                    ) {
                      if (/长柄/.test(actor.weapon.type)) {
                        setAttackSelectionIds(prev => {
                          const next = prev.includes(unit.id)
                            ? prev.filter(id => id !== unit.id)
                            : [...prev, unit.id].slice(0, 3);
                          if (next.length >= 3) {
                            setPlannedActions(actionPrev => ({
                              ...actionPrev,
                              [actorId]: { actionId: 'attack', targetIds: next },
                            }));
                            updateUnitIntent(actorId, `攻击 ${next.join('、')}`);
                            setTargetingMode(null);
                            setAttackSelectionActorId(null);
                          }
                          return next;
                        });
                      } else {
                        setPlannedActions(prev => ({
                          ...prev,
                          [actorId]: { actionId: 'attack', targetId: unit.id },
                        }));
                        updateUnitIntent(actorId, `攻击 ${unit.name}`);
                        setTargetingMode(null);
                        setAttackSelectionIds([]);
                        setAttackSelectionActorId(null);
                      }
                    }
                  }
                }}
                onOpenDetail={openDetailModal}
              />
            ))}
          </div>
        </div>
      </main>

      <footer className="relative z-20 border-t border-stone-800/50 bg-black/60 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto p-3 lg:p-4 flex items-center justify-center gap-4 lg:gap-6">
          <button
            ref={autoSelectRef}
            onClick={autoSelectTargets}
            className="group relative flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-sm border bg-stone-900/40 backdrop-blur-md transition-all duration-300 text-amber-300 border-amber-900/50 hover:bg-amber-950/40 hover:border-amber-500/50 group-hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-30 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-30 group-hover:opacity-100 transition-opacity"></div>
            <Crosshair
              size={28}
              className="mb-2 sm:mb-3 group-hover:-translate-y-1 group-hover:scale-110 transition-transform duration-300"
            />
            <span className="text-xs sm:text-sm font-serif tracking-[0.2em]">自动选择</span>
          </button>
          {actions.map(action => (
            <button
              key={action.id}
              ref={el => {
                actionButtonRefs.current[action.id] = el;
              }}
              onClick={() => handleActionClick(action)}
              className={`group relative flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-sm border bg-stone-900/40 backdrop-blur-md transition-all duration-300 ${action.color} ${action.glow} overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-30 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-30 group-hover:opacity-100 transition-opacity"></div>

              <action.icon
                size={28}
                className="mb-2 sm:mb-3 group-hover:-translate-y-1 group-hover:scale-110 transition-transform duration-300"
              />
              <span className="text-xs sm:text-sm font-serif tracking-[0.2em]">{action.label}</span>
            </button>
          ))}
        </div>
      </footer>

      {detailModal && (
        <InfoModal
          title={`${detailModal.character.name} · ${
            detailModal.type === 'weapon'
              ? '武器与装备'
              : detailModal.type === 'armor'
                ? '护甲与抗性'
                : detailModal.type === 'attributes'
                  ? '七维属性'
                  : '创伤与状态'
          }`}
          onClose={() => setDetailModal(null)}
        >
          {renderDetailContent()}
        </InfoModal>
      )}
      {battleState.result && resultConfirmed && (
        <BattleResultModal
          outcome={displayOutcome}
          outcomeDescription={battleOutcomeDescription}
          logs={battleState.logs}
          onCopy={handleCopyLogs}
        />
      )}
      {surrenderConfirmOpen && !battleState.result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
            onClick={() => setSurrenderConfirmOpen(false)}
          ></div>
          <div className="relative glass-panel w-full max-w-md rounded-sm overflow-hidden border border-stone-700/40 shadow-[0_0_80px_rgba(0,0,0,0.9)] animate-fade-in-up">
            <div className="p-6 border-b border-stone-800/60 bg-gradient-to-r from-stone-900/90 to-transparent flex items-center justify-between">
              <h2 className="text-lg font-serif text-stone-100 tracking-[0.2em]">投降确认</h2>
              <button
                onClick={() => setSurrenderConfirmOpen(false)}
                className="text-stone-500 hover:text-stone-200 transition-colors px-2 py-1"
              >
                关闭
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm font-mono text-stone-300">
              <div>投降意味着全军覆没，生死全由对方了。</div>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setSurrenderConfirmOpen(false)}
                  className="px-4 py-2 border border-stone-700/60 rounded-sm text-stone-300 hover:bg-stone-800/60"
                >
                  否
                </button>
                <button
                  onClick={confirmSurrender}
                  className="px-4 py-2 border border-rose-700/60 rounded-sm text-rose-200 hover:bg-rose-950/40"
                >
                  是
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {tacticsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
            onClick={() => setTacticsOpen(false)}
          ></div>
          <div className="relative glass-panel w-full max-w-md rounded-sm overflow-hidden border border-stone-700/40 shadow-[0_0_80px_rgba(0,0,0,0.9)] animate-fade-in-up">
            <div className="p-6 border-b border-stone-800/60 bg-gradient-to-r from-stone-900/90 to-transparent flex items-center justify-between">
              <h2 className="text-lg font-serif text-stone-100 tracking-[0.2em]">战术指令</h2>
              <button
                onClick={() => setTacticsOpen(false)}
                className="text-stone-500 hover:text-stone-200 transition-colors px-2 py-1"
              >
                关闭
              </button>
            </div>
            <div className="p-6 space-y-3 text-sm font-mono">
              <button
                onClick={() => applyTactic('taunt')}
                className="w-full text-left px-4 py-2 border border-stone-700/60 rounded-sm hover:bg-stone-800/60"
              >
                嘲弄：强制选中的敌人攻击我，本回合不攻击
              </button>
              <button
                onClick={() => applyTactic('defense')}
                className="w-full text-left px-4 py-2 border border-stone-700/60 rounded-sm hover:bg-stone-800/60"
              >
                防御：格挡基础+10，本回合不攻击
              </button>
              <button
                onClick={() => applyTactic('medical')}
                className="w-full text-left px-4 py-2 border border-stone-700/60 rounded-sm hover:bg-stone-800/60"
              >
                医疗：选择目标与物品
              </button>
              <button
                onClick={() => applyTactic('escape')}
                className="w-full text-left px-4 py-2 border border-stone-700/60 rounded-sm hover:bg-stone-800/60"
              >
                逃跑：若未被敌人锁定则退出战斗
              </button>
            </div>
          </div>
        </div>
      )}
      {medicalItemSelecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
            onClick={() => setMedicalItemSelecting(false)}
          ></div>
          <div className="relative glass-panel w-full max-w-md rounded-sm overflow-hidden border border-stone-700/40 shadow-[0_0_80px_rgba(0,0,0,0.9)] animate-fade-in-up">
            <div className="p-6 border-b border-stone-800/60 bg-gradient-to-r from-stone-900/90 to-transparent flex items-center justify-between">
              <h2 className="text-lg font-serif text-stone-100 tracking-[0.2em]">选择医疗物品</h2>
              <button
                onClick={() => setMedicalItemSelecting(false)}
                className="text-stone-500 hover:text-stone-200 transition-colors px-2 py-1"
              >
                关闭
              </button>
            </div>
            <div className="p-6 space-y-3 text-sm font-mono">
              {(() => {
                const actor = medicalActorId ? getUnit(battleState.units, medicalActorId) : null;
                if (!actor) return <div className="text-stone-500">未选择执行者</div>;
                const items = actor.backpackItems || {};
                const hasItem = (name: string) => toNumber(items[name]?.数量, 0) > 0;
                const list: string[] = [];
                [
                  '基础急救包',
                  '标准急救包',
                  '高级急救包',
                  '普通夹板包',
                  '高级夹板包',
                  '骨人修理包',
                  '骨人修理箱',
                ].forEach(name => {
                  if (hasItem(name)) list.push(name);
                });
                if (list.length === 0) {
                  return <div className="text-stone-500">此角色背包没有可用医疗物品</div>;
                }
                return list.map(name => (
                  <button
                    key={name}
                    onClick={() => {
                      setSelectedMedicalItem(name);
                      setMedicalItemSelecting(false);
                      const actorId = medicalActorId || selectedActorId || playerId;
                      if (actorId) {
                        setPlannedActions(prev => ({
                          ...prev,
                          [actorId]: {
                            ...prev[actorId],
                            actionId: 'tactics',
                            tactic: 'medical',
                            itemName: name,
                          },
                        }));
                        updateUnitIntent(actorId, `医疗物品 ${name}`);
                      }
                    }}
                    className="w-full text-left px-4 py-2 border border-stone-700/60 rounded-sm hover:bg-stone-800/60"
                  >
                    {name}x{toNumber(items[name]?.数量, 0)}
                  </button>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
