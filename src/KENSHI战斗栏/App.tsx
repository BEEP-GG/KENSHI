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

type BackpackItem = {
  介绍?: string;
  数量?: number;
  重量?: number;
  价值?: number;
  子分类?: string;
};

type BattleCharacter = {
  id: string;
  name: string;
  gender?: string;
  level: number;
  hp: number;
  maxHp: number;
  startHp: number;
  fractureStacks: number;
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
  mainWeaponAttackCount: number;
  subWeaponAttackCount: number;
  noBlockNextRound: boolean;
  defenseBonus: number;
  blockBonus: number;
  aiDefenseCooldown: number;
  aiMedicalCooldown: number;
  playerEmergencyMedicalCooldown: number;
  escaped: boolean;
  lowHpTraumaBoostUsed: boolean;
  hitBonusAgainst: Record<string, number>;
  raceName: string;
  backpackItems: Record<string, BackpackItem>;
  weaponRaw: any;
  subWeaponRaw: any;
  armorRaw: any;
  attributesRaw: any;
  traumaRaw: any;
};

type ActionType = { id: string; label: string; icon: React.ElementType; color: string; glow: string };

type AiDecision = {
  actionId: 'attack' | 'defense' | 'escape' | 'emergency_medical';
  targetId?: string;
  reason?: string;
};

type BattleState = {
  round: number;
  units: BattleCharacter[];
  logs: string[];
  result: 'victory' | 'defeat' | null;
  endReason?: 'normal' | 'surrender';
  lastRoundAttackersCount: Record<string, number>;
  nonLethalActorIds: string[]; // 非致命模式：按角色挂钩
  aiPlans: Record<string, AiDecision>;
  playerEmergencyMedicalCooldown: number;
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
  - 防守方闪避值: (敏捷 * 0.5) + (感知 * 0.2)
  - 长柄武器溅射: 若为长柄武器攻击造成的溅射伤害，其他受波及目标闪避值 +4
  - 进攻方投掷: D100（01-05为大失败）
  - 判定: 防守方闪避值 ≤ 进攻方投掷结果
  - 结果: 失败则本次攻击落空；成功则进入【对抗防御】阶段。

第二步_属性对抗防御:
  - 防御方基础值:
      武器格挡: “(敏捷 * 0.5 + 力量 * 0.25)”
      空手闪避: “(敏捷 * 0.6 + 感知 * 0.25)”
  - 对抗修正:
      最终防御成功 = 防御方基础值 + (防御方敏捷 - 攻击方敏捷)
  - 长柄武器溅射: 若为长柄武器攻击造成的溅射伤害，其他受波及目标防御基础值 +4
  - 防御判定: 防御方投掷 D100 <= 最终防御。
  - 防御结果:
      闪避成功: 免疫全部伤害，攻击结束。
      格挡成功: 免疫 100% 切割伤害，受到 50% 钝伤。
      防御失败: 进入【伤害结算】阶段。

伤害结算流程:
第一步_伤害计算:
  - 面板计算:
      近战: “武器基础骰子结果 + max(0, (力量 * 0.65 + 敏捷 * 0.35) * 0.4)”
      远程: “武器基础骰子结果 + max(0, (力量 * 0.6 + 感知 * 0.7) * 0.4)”
  - 伤害拆分: 根据武器比例，将面板伤害拆分为【切割伤害】与【钝伤伤害】。

第二步_护甲过滤:
  - 切割结算: “max(0, 切割伤害 - 护甲固定减伤DR)”
  - 钝伤结算: 直接透传 (无视DR)
  - 最终伤害: “切割结算 + 钝伤结算”

第三步_状态与生命结算:
  - 逻辑: 从目标 HP 中扣除最终伤害。
  - 创伤判定 (脚本触发条件):
      条件A: 本次最终伤害 > (目标体质 * 0.4)
      条件B: 攻击方命中检定为大成功 (93-100)
      满足任一条件，随机部位【创伤等级】+1，并触发相应层级的残废/减值效果。
  - 濒死判定:
      HP > 0: 继续战斗。
      HP <= 0 (首次倒地): 触发韧性检定。

特殊规则:
- 连击机制: 若角色拥有多次攻击次数，防御方在同一轮内防御后续攻击时，【最终防御成功率】每下累积 -8。
- 意志减伤: 对所有成员生效；采用线性减伤，公式为“max(0, 意志 - 20) * 0.15”。
- 魅力俘虏: 仅AI生效。若攻击者 INT >= 35，且本次攻击本可杀死目标，则掷1D100。
    - 判定值: “round(目标CHA * 0.5)”；若目标为女性则额外 +20。
    - 若 D100 <= 判定值，则目标不会被杀死，HP最低保留10，并进入【已被制服】状态。
    - 【已被制服】状态下目标无法行动，直到战斗结束或制服者死亡。
- AI紧急手动医治:
    - AI动作池: 攻击 > 紧急手动医治 > 防御 > 逃跑（按权重加权判定）
    - 开启条件: 智力 INT > 50，且医疗冷却为0。
    - 恢复量: “INT * 0.4 + 1DINT”
    - 医疗冷却: AI执行一次紧急手动医治后，治疗自己则3回合内不会再次判定，治疗他人则2回合内不会再次判定。
    - 防御冷却: AI执行一次防御后，2回合内不会再次判定防御。
    - 自疗限制: 自身血量比例 > 75% 时，绝对不会把自己作为紧急手动医治目标。
    - 敌方目标优先级:
        1. 自身血量 < 25% 时，优先治疗自己。
        2. 否则优先治疗同阵营中血量比例最低者。
    - 友方/友军AI目标优先级:
        1. 当前角色血量 < 40% 时，优先治疗当前角色。
        2. 否则优先治疗血量 < 40% 的小队成员中最低血者。
        3. 再治疗血量 < 40% 的其他友军AI中最低血者。
        4. 若以上都不存在，且自身血量 ≤ 75%，才可能治疗自己。
- 大成功与大失败:
    攻击大成功 (93-100): 伤害结算x1.5且无法格挡。
    武术例外:
      速度型(DEX>=STR): 大成功区间93-100，触发额外攻击1次。
      重击型(STR>DEX): 大成功区间93-100，伤害x2且无视5点DR。
    攻击大失败 (01-05): 攻击者失去平衡，下一轮无法执行格挡，且防御方可获得一次即时反击。
- 濒死与韧性:
    倒地判定: 当 HP 归零时，角色需进行一次【体质】检定。
    成功: 保持清醒（可尝试爬行逃跑或装死）。
    失败: 陷入休克状态。
- 逃跑:
    角色选择“逃跑”时，先掷一次 d100。
    把“基础逃跑惩罚 + 被锁定惩罚 + 创伤惩罚 + 状态惩罚”加总，成功率 = 60 − 总惩罚。若掷骰值 ≤ 成功率则逃跑成功；
    另外有小成功保底：掷骰 ≤ 5 且创伤惩罚 < 25 且状态惩罚 < 30 也算成功。若创伤惩罚或状态惩罚达到“无法移动”的级别，则直接判定失败。

`;

const PANEL_TUTORIAL = `战斗面板教程：
（待补充）`;

const WEAPON_CATEGORY_GUIDE = `武器类别详解：

武士刀：
- 每次对目标造成未被DR格挡的切割伤害时，对目标施加1层“流血”。流血每回合开始时造成1点直接伤害，可叠加。
- 基础攻速为3。

军刀：
- 装备军刀类武器时，“武器格挡”基础值+12。

砍刀：
- 无视对方7点DR。
- 攻击检定大成功（93-100）时触发“破甲”：目标DR降低8（可叠加，对该目标全局生效）。

长柄类：
- 每次攻击时可选择最多3个敌人进行攻击检定；每多一个目标，攻击检定-7。

钝器：
- 攻击检定大成功（93-100）时，目标必定获得1层“骨折”；每层骨折使力量/敏捷-10、逃跑检定-15（可叠加，直到夹板包清除）。

大型武器：
- 每次攻击时对2个敌人进行攻击检定。
- 攻击检定大失败（01-10）或两名目标均被【闪避】时，进入失衡，防御检定-15。

弩：
- 基础效果：无视对方7点DR。
- 基础攻速为1。
- 大失败不会触发反击，而是误伤队友。
- 弩矢效果后续补充。

弓：
- 大失败不会触发反击，而是误伤队友。
- 箭矢效果后续补充。
- 当弓/弩作为主武器且无副武器时，防御时只能闪避不能格挡；若有副武器则可正常防御。
- 对弓/弩攻击只能闪避，无法格挡。

武术：
- 识别种类为“武术”。
- 速度型（DEX>=STR）：基础攻速3；大成功区间93-100，触发额外攻击1次。
- 重击型（STR>DEX）：基础攻速2；无视5点DR；大成功区间93-100，伤害x2。
- 武术伤害骰加成：每20点力量+1伤害骰、每30点敏捷+1伤害骰、每40点意志+1伤害骰，均向下取整。
- 两种武术的伤害比例均沿用变量中的伤害比例。
- 大失败与其他武器一致。`;

const TRAUMA_RULES = `创伤与状态详解：

基础流程：
- 每次命中随机一个部位（左臂/右臂/左腿/右腿），该部位阈值会被本次伤害削减。
- 阈值降到0会升级到下一等级，超额会继续抵扣下一等级阈值。

升级条件（TGH=体质，HPmax=最大生命值）：
- 0→1：攻击大成功 或 阈值归零（阈值=0.85*TGH）
- 1→2：攻击大成功 或 单次伤害 > TGH*0.45 或 阈值归零（阈值=0.55*TGH）
- 2→3：单次伤害 > TGH*0.4 或 阈值归零（阈值=0.45*TGH）
- 3→4：单次伤害 > TGH*0.3 或 阈值归零
- 任意等级→3：单次伤害 ≥ HPmax*0.5
- 任意等级→4：单次伤害 ≥ HPmax*0.7
- 低血加成：若本次受击后 HP ≤ HPmax*0.3，则整场战斗仅首次触发一次额外+1创伤升级（最多到4）

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
    id: 'subdue',
    label: '制服',
    icon: Shield,
    color: 'text-emerald-400 border-emerald-900/50 hover:bg-emerald-950/40 hover:border-emerald-500/50',
    glow: 'group-hover:shadow-[0_0_20px_rgba(52,211,153,0.3)]',
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

const d100 = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return (buffer[0] % 100) + 1;
  }
  return Math.floor(Math.random() * 100) + 1;
};

const rollDice = (dice: string) => {
  const match = dice.match(/(\d+)d(\d+)/i);
  if (!match) return _.toNumber(dice) || 0;
  const count = Number(match[1]) || 1;
  const sides = Number(match[2]) || 6;
  return _.sum(Array.from({ length: count }, () => _.random(1, sides)));
};

const getMartialArtsBonusDice = (attributes: Attributes) => {
  return (
    Math.floor(attributes.STR / 20) +
    Math.floor(attributes.DEX / 30) +
    Math.floor(attributes.WIL / 40)
  );
};

const parseDamageTypeRatio = (damageType: string): DamageRatio | null => {
  if (!damageType) return null;
  const normalized = damageType.replace(/，/g, '/').replace(/、/g, '/');
  const entries = normalized
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
const isBowOrCrossbow = (weaponType: string) => /(弓|弩)/.test(weaponType || '');

const toNumber = (value: unknown, fallback = 0) => {
  const num = _.toNumber(value);
  return Number.isFinite(num) ? num : fallback;
};

const LEGACY_ITEM_SUBCATEGORY_MAP: Record<string, string> = {
  装备: '护甲',
  武器材料: '矿石',
  护甲材料: '布料',
};

const normalizeItemSubCategory = (subCategory: unknown) => {
  const value = String(subCategory || '').trim();
  if (!value) return '';
  return LEGACY_ITEM_SUBCATEGORY_MAP[value] || value;
};

const normalizeBackpackItems = (items: unknown): Record<string, BackpackItem> => {
  if (!items || typeof items !== 'object') return {};
  return Object.entries(items as Record<string, BackpackItem>).reduce<Record<string, BackpackItem>>(
    (acc, [name, item]) => {
      const source = item && typeof item === 'object' ? item : {};
      acc[name] = {
        ...source,
        子分类: normalizeItemSubCategory((source as BackpackItem).子分类),
      };
      return acc;
    },
    {},
  );
};

const MEDICAL_ITEM_NAMES = [
  '基础急救包',
  '标准急救包',
  '高级急救包',
  '普通夹板包',
  '高级夹板包',
  '骨人修理包',
  '骨人修理箱',
];

const isMedicalBackpackItem = (name: string, item: BackpackItem | undefined) => {
  if (MEDICAL_ITEM_NAMES.includes(name)) return true;
  return normalizeItemSubCategory(item?.子分类) === '医疗用品';
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
  lastRoundAttackersCount: Record<string, number>,
) => {
  if (unit.attributes.WIL > 80) return units;
  if (unit.subFaction === 'squad') return units;
  if (unit.hp <= 0 || unit.escaped) return units;
  const morale = getMoraleScore(unit, units);
  if (morale < 40) {
    const failKey = 'morale_escape_failures';
    const currentFails = unit.hitBonusAgainst[failKey] || 0;
    const updatedFails = currentFails + 1;
    let updated = { ...unit, escaped: false, hitBonusAgainst: { ...unit.hitBonusAgainst, [failKey]: updatedFails } };
    appendLog(logs, `${unit.name}: 士气不足，选择撤退(${reason === 'round' ? '回合开始' : '受伤'}判定)。`);

    const escapeRoll = d100();
    const traumaPenalty = getEscapeTraumaPenalty(unit);
    const statusPenalty = getEscapeStatusPenalty(unit);
    const attackersCount = lastRoundAttackersCount[unit.id] ?? 0;

    if (traumaPenalty >= 9999 || statusPenalty >= 9999) {
      appendLog(logs, `${unit.name}: 撤退失败，无法移动。`);
    } else {
      const escapePenalty = getEscapePenalty(unit) + attackersCount * 15 + traumaPenalty + statusPenalty;
      const escapeChance = 70 - escapePenalty;
      const criticalEscape = escapeRoll <= 5 && traumaPenalty < 25 && statusPenalty < 30;
      appendLog(logs, `${unit.name}: 撤退判定 d100=${escapeRoll} 成功率=${Math.max(0, Math.round(escapeChance))}。`);
      if (escapeRoll <= escapeChance || criticalEscape) {
        updated = { ...updated, escaped: true };
        appendLog(logs, `${unit.name}: 撤退成功(${escapeRoll}<${Math.max(0, Math.round(escapeChance))})。`);
      } else {
        appendLog(logs, `${unit.name}: 撤退失败(${escapeRoll}>=${Math.max(0, Math.round(escapeChance))})。`);
      }
    }

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
  if (level <= 0) return tgh * 0.85;
  if (level === 1) return tgh * 0.55;
  if (level === 2) return tgh * 0.45;
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

const VALID_SUB_WEAPON_TYPE_REGEX = /(武士刀|砍刀|军刀|大型|长柄|钝器|弓|弩|盾牌)/;

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
  const subWeaponTypeRaw = _.get(subWeapon, ['种类'], '无');
  const subWeaponNameRaw = _.get(subWeapon, ['名字'], subWeaponTypeRaw);
  const subWeaponDiceRaw = _.get(subWeapon, ['伤害骰'], '0d0');
  const subWeaponDamageTypeRaw = _.get(subWeapon, ['伤害类型'], '');
  const hasValidSubWeaponType = VALID_SUB_WEAPON_TYPE_REGEX.test(String(subWeaponTypeRaw || ''));
  const subWeaponType = hasValidSubWeaponType ? subWeaponTypeRaw : '无';
  const subWeaponName = hasValidSubWeaponType ? subWeaponNameRaw : '无';
  const subWeaponDice = hasValidSubWeaponType ? subWeaponDiceRaw : '0d0';
  const subWeaponDamageType = hasValidSubWeaponType ? subWeaponDamageTypeRaw : '';
  const armorRaw = _.get(raw, ['护甲'], {});
  const armorBaseDR = toNumber(_.get(armorRaw, ['防护能力(DR)']), toNumber(_.get(armorRaw, ['防护能力']), 0));
  const armorDR = Math.max(0, armorBaseDR);
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
  const variableAttackCount = Math.max(1, Math.floor(toNumber(_.get(raw, ['攻击次数']), 0)) || 1);
  const isHeavyOrBlunt = /大型|钝器/.test(weaponType);
  const isMartialArts = /武术/.test(weaponType);
  const martialBaseAttackRate = attributes.DEX >= attributes.STR ? 3 : 2;
  const mainBaseAttackRate = isMartialArts
    ? martialBaseAttackRate
    : /武士刀/.test(weaponType)
      ? 3
      : /弩/.test(weaponType)
        ? 1
        : isHeavyOrBlunt
          ? 1
          : 2;
  const mainWeaponAttackCount = variableAttackCount + mainBaseAttackRate;
  const subWeaponAttackCount = subWeaponType === '盾牌' ? 1 : subWeaponType !== '无' ? variableAttackCount : 0;
  const attackCount = Math.max(1, mainWeaponAttackCount + subWeaponAttackCount);
  const raceName = String(_.get(raw, ['种族', '名称'], ''));
  const backpackItems = normalizeBackpackItems(_.get(raw, ['背包', '物品'], {}) || {});

  return {
    id: String(_.get(raw, ['id'], name) || name),
    name,
    gender: String(_.get(raw, ['性别'], '')),
    level,
    hp,
    maxHp,
    startHp: hp,
    fractureStacks: 0,
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
    mainWeaponAttackCount,
    subWeaponAttackCount,
    noBlockNextRound: false,
    defenseBonus: 0,
    blockBonus: 0,
    aiDefenseCooldown: 0,
    aiMedicalCooldown: 0,
    playerEmergencyMedicalCooldown: 0,
    escaped: false,
    lowHpTraumaBoostUsed: false,
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
  const currentName =
    _.get(current, ['名字'], _.get(current, ['名称'], _.get(current, ['id'], '当前角色'))) || '当前角色';
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
    playerId: String(_.get(current, ['id'], currentName || '当前角色')),
  };
};

const buildTurnOrder = (units: BattleCharacter[]) =>
  [...units]
    .filter(unit => unit.hp > 0 && !unit.escaped && !['死亡', '休克', '昏迷', '已被制服'].includes(unit.state))
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
  if (level > 80) return 80 + level * 4.5;
  if (level > 50) return 70 + level * 3.5;
  return 60 + level * 2.5;
};

const getDownExpByLevel = (level: number) => {
  if (level > 80) return 70 + level * 4.5;
  if (level > 50) return 60 + level * 3.5;
  return 50 + level * 2;
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

const isCombatReadyUnit = (unit: BattleCharacter) =>
  unit.hp > 0 && !unit.escaped && !['死亡', '休克', '昏迷', '已被制服'].includes(unit.state);

const pickRandomTarget = (units: BattleCharacter[], faction: Faction) => {
  const candidates = units.filter(unit => unit.faction === faction && isCombatReadyUnit(unit));
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
  if ((unit.fractureStacks || 0) > 0) return penalty + unit.fractureStacks * 15;
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
  const fracturePenalty = (attacker.fractureStacks || 0) * 10;
  const str = Math.max(1, attacker.attributes.STR - fracturePenalty);
  const dex = Math.max(1, attacker.attributes.DEX - fracturePenalty);
  const base = isRangedWeapon(attacker.weapon.type) ? attacker.attributes.PER : (str + dex) / 2;
  const penalty = getAttackPenalty(attacker);
  return Math.max(1, base - penalty);
};

const getDefenseBase = (defender: BattleCharacter, useBlock: boolean) => {
  const fracturePenalty = (defender.fractureStacks || 0) * 10;
  const str = Math.max(1, defender.attributes.STR - fracturePenalty);
  const dex = Math.max(1, defender.attributes.DEX - fracturePenalty);
  const base = useBlock ? dex * 0.5 + str * 0.2 : dex * 0.6 + defender.attributes.PER * 0.2;
  const mainBlockBonus = useBlock && /军刀/.test(defender.weapon.type) ? 12 : 0;
  const subBlockBonus = useBlock && /军刀/.test(defender.subWeapon.type) ? 6 : 0;
  const shieldBonus = useBlock && /盾牌/.test(defender.subWeapon.type) ? 12 : 0;
  const blockBonus = mainBlockBonus + subBlockBonus + shieldBonus;
  const tacticBonus = useBlock ? defender.blockBonus || 0 : defender.defenseBonus || 0;
  const rangedMainWithSubPenalty =
    useBlock && isBowOrCrossbow(defender.weapon.type) && defender.subWeapon.type !== '无' ? 8 : 0;
  const penalty = getDefensePenalty(defender, useBlock) + rangedMainWithSubPenalty;
  return base + blockBonus + tacticBonus - penalty;
};

const getDefenseMode = (defender: BattleCharacter, attackerWeaponType: string) => {
  const hasMainWeapon = defender.weapon.type !== '无';
  const hasSubWeapon = defender.subWeapon.type !== '无';
  if (!hasMainWeapon) return false;
  if (isBowOrCrossbow(attackerWeaponType)) return false;
  const defenderMainIsBowOrCrossbow = isBowOrCrossbow(defender.weapon.type);
  if (defenderMainIsBowOrCrossbow && !hasSubWeapon) return false;
  return true;
};

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
  nonLethalEnabled,
  onToggle,
  onSelect,
  onOpenDetail,
}: {
  character: BattleCharacter;
  isExpanded: boolean;
  isSelected: boolean;
  nonLethalEnabled?: boolean;
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
      className={`relative group overflow-hidden rounded-sm border cursor-pointer min-w-[74vw] max-w-[320px] lg:min-w-0 lg:max-w-none ${
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
            {nonLethalEnabled ? <span className="ml-2 text-xs text-fuchsia-300">（开启非致命）</span> : null}
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
            主：{character.weapon.name} ({character.weapon.damageDice})
          </div>
          {character.subWeapon.type !== '无' ? (
            <div className="text-xs font-mono text-stone-500 truncate">
              副：{character.subWeapon.name} ({character.subWeapon.damageDice})
            </div>
          ) : null}
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
    lastRoundAttackersCount: {},
    nonLethalActorIds: [],
    aiPlans: {},
    playerEmergencyMedicalCooldown: 0,
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
        tactic?: 'taunt' | 'defense' | 'medical' | 'emergency_medical' | 'escape';
        itemName?: string;
      }
    >
  >({});
  const [tacticsOpen, setTacticsOpen] = useState(false);
  const [medicalSelecting, setMedicalSelecting] = useState(false);
  const [medicalItemSelecting, setMedicalItemSelecting] = useState(false);
  const [medicalActorId, setMedicalActorId] = useState<string | null>(null);
  const [selectedMedicalTargetId, setSelectedMedicalTargetId] = useState<string | null>(null);
  const [battleNotice, setBattleNotice] = useState<{ text: string; tone: 'amber' | 'rose' } | null>(null);

  const getWillDamageReductionRate = (unit: BattleCharacter) => {
    return Math.max(0, unit.attributes.WIL - 20) * 0.15;
  };

  const getTacticEffectMultiplier = (unit: BattleCharacter) => 1 + (unit.attributes.INT / 20) * 0.1;
  const [selectedMedicalItem, setSelectedMedicalItem] = useState<string | null>(null);
  const [nonLethalMenuOpen, setNonLethalMenuOpen] = useState(false);
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
  const [targetingMode, setTargetingMode] = useState<'attack' | 'subdue' | null>(null);
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
  const logScrollRef = useRef<HTMLDivElement | null>(null);
  const pendingScrollToBottomRef = useRef(false);
  const outcomeTriggeredRef = useRef(false);
  const cancelledRef = useRef(false);
  const [surrenderConfirmOpen, setSurrenderConfirmOpen] = useState(false);
  const [resultConfirmed, setResultConfirmed] = useState(false);
  const [showCurrentRoundOnly, setShowCurrentRoundOnly] = useState(false);
  const [mobileLogCollapsed, setMobileLogCollapsed] = useState(false);
  const isMobile = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const byUa = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(ua);
    const byWidth =
      typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(max-width: 1024px)').matches : false;
    const byTouch =
      typeof navigator !== 'undefined' &&
      typeof window !== 'undefined' &&
      (navigator.maxTouchPoints || 0) > 0 &&
      window.matchMedia &&
      window.matchMedia('(hover: none)').matches;
    return byUa || byWidth || byTouch;
  }, []);
  const mobileDetailExpanded = isMobile && !!expandedCharId;
  const mobileBottomExpanded = isMobile && (mobileLogCollapsed || mobileDetailExpanded);

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
    () => friendlyUnits.filter(unit => isCombatReadyUnit(unit)).length,
    [friendlyUnits],
  );
  const enemyAliveCount = useMemo(() => enemyUnits.filter(unit => isCombatReadyUnit(unit)).length, [enemyUnits]);
  const displayedLogs = useMemo(() => {
    if (!showCurrentRoundOnly) return battleState.logs;
    const roundMarkerRegex = /^---\s*第\s*\d+\s*回合\s*---$/;
    let markerIndex = -1;
    for (let i = battleState.logs.length - 1; i >= 0; i -= 1) {
      if (roundMarkerRegex.test(battleState.logs[i].trim())) {
        markerIndex = i;
        break;
      }
    }
    return markerIndex >= 0 ? battleState.logs.slice(markerIndex) : battleState.logs;
  }, [battleState.logs, showCurrentRoundOnly]);
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
      // 兼容最新变量：补齐“往事.关键记忆”默认结构，避免旧存档缺字段
      _.set(stat, '往事.关键记忆', _.get(stat, '往事.关键记忆', []));
      const { units, playerId } = buildUnitsFromStat(stat);
      const initialAiPlans = units.reduce<Record<string, AiDecision>>((acc, unit) => {
        if (!isCombatReadyUnit(unit) || unit.subFaction === 'squad') return acc;
        acc[unit.id] = decideAiAction(unit, units, {});
        return acc;
      }, {});
      const initialPreviewUnits = units.map(unit => {
        if (!isCombatReadyUnit(unit)) return { ...unit, intent: undefined };
        if (unit.subFaction === 'squad') return unit;
        const decision = initialAiPlans[unit.id] || decideAiAction(unit, units, {});
        return { ...unit, intent: getAiIntentLabel(decision, unit, units) };
      });
      if (cancelledRef.current) return;
      setBattleState({
        round: 1,
        units: initialPreviewUnits,
        logs: [],
        result: null,
        endReason: 'normal',
        lastRoundAttackersCount: {},
        nonLethalActorIds: [],
        aiPlans: initialAiPlans,
        playerEmergencyMedicalCooldown: 0,
      });
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

  useEffect(() => {
    if (!pendingScrollToBottomRef.current) return;
    if (showCurrentRoundOnly) {
      pendingScrollToBottomRef.current = false;
      return;
    }
    const container = logScrollRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
    pendingScrollToBottomRef.current = false;
  }, [battleState.logs, showCurrentRoundOnly]);

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

    if (actionId === 'subdue') {
      if (targetingMode === 'subdue' && attackSelectionActorId === actorId && attackSelectionIds.length > 0) {
        setPlannedActions(prev => ({
          ...prev,
          [actorId]: { actionId: 'subdue', targetIds: attackSelectionIds },
        }));
        updateUnitIntent(actorId, `制服 ${attackSelectionIds.join('、')}`);
        setTargetingMode(null);
        setAttackSelectionIds([]);
        setAttackSelectionActorId(null);
        return;
      }
      setTargetingMode('subdue');
      setAttackSelectionActorId(actorId);
      setAttackSelectionIds([]);
      updateUnitIntent(actorId, '选择制服目标');
      return;
    }
  };

  const confirmSurrender = () => {
    const actorId = selectedActorId || playerId;
    const actor = actorId ? getUnit(battleState.units, actorId) : null;
    const name = actor?.name ? `${actor.name}` : '我军';
    setBattleState(prev => ({
      ...prev,
      logs: [...prev.logs, `${name}: 选择投降，战斗结束。`, SETTLEMENT_LOG],
      result: 'defeat',
      endReason: 'surrender',
    }));
    setPlannedActions({});
    setSurrenderConfirmOpen(false);
  };

  const applyTactic = (tactic: 'taunt' | 'defense' | 'medical' | 'emergency_medical' | 'escape') => {
    const actorId = selectedActorId || playerId;
    if (!actorId) return;
    const actor = getUnit(battleState.units, actorId);
    if (!actor || actor.subFaction !== 'squad' || actor.escaped) return;

    if (tactic === 'medical' || tactic === 'emergency_medical') {
      if (tactic === 'emergency_medical' && battleState.playerEmergencyMedicalCooldown > 0) {
        setPlannedActions(prev => {
          const next = { ...prev };
          delete next[actorId];
          return next;
        });
        updateUnitIntent(actorId, '无');
        setBattleNotice({
          text: `紧急手动医治正在冷却中，还需${battleState.playerEmergencyMedicalCooldown}回合后才能使用。`,
          tone: 'amber',
        });
        setTimeout(() => {
          setBattleNotice(current =>
            current?.text ===
            `紧急手动医治正在冷却中，还需${battleState.playerEmergencyMedicalCooldown}回合后才能使用。`
              ? null
              : current,
          );
        }, 2200);
        setTacticsOpen(false);
        return;
      }
      setMedicalActorId(actorId);
      setSelectedMedicalTargetId(null);
      setSelectedMedicalItem(null);
      setMedicalSelecting(true);
      setMedicalItemSelecting(false);
      updateUnitIntent(actorId, tactic === 'medical' ? '选择医疗目标' : '选择紧急医治目标');
      setPlannedActions(prev => ({
        ...prev,
        [actorId]: { actionId: 'tactics', tactic },
      }));
      setTacticsOpen(false);
      return;
    }

    if (tactic === 'taunt') {
      const target = selectedTargetId ? getUnit(battleState.units, selectedTargetId) : null;
      if (target && target.faction === 'enemy' && isCombatReadyUnit(target)) {
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
    const intentMap = { defense: '防御', medical: '医疗', emergency_medical: '紧急医治', escape: '逃跑' } as const;
    updateUnitIntent(actorId, intentMap[tactic]);
    setTacticsOpen(false);
  };

  const applyBleedAndShock = (units: BattleCharacter[], logs: string[], nonLethalActorIds: string[] = []) => {
    let working = units;
    working.forEach(unit => {
      if (unit.escaped) return;
      if (unit.bleedLayers > 0) {
        const bleedDamage = unit.bleedLayers;
        const shouldKeepAlive = nonLethalActorIds.length > 0 && unit.faction === 'enemy';
        const hpFloor = shouldKeepAlive ? 1 : 0;
        const newHp = Math.max(hpFloor, unit.hp - bleedDamage);
        const updated = { ...unit, hp: newHp, bleedLayers: 0 };
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

  type AiDecision = {
    actionId: 'attack' | 'defense' | 'escape' | 'emergency_medical';
    targetId?: string;
    reason?: string;
  };

  const getCombatReadyCount = (units: BattleCharacter[], faction: Faction) =>
    units.filter(unit => unit.faction === faction && isCombatReadyUnit(unit)).length;

  const getLowestHpTarget = (units: BattleCharacter[]) => {
    if (!units.length) return null;
    return [...units].sort((a, b) => a.hp / Math.max(1, a.maxHp) - b.hp / Math.max(1, b.maxHp))[0] ?? null;
  };

  const getEmergencyHealTarget = (actor: BattleCharacter, units: BattleCharacter[]) => {
    const friendlyUnits = units.filter(unit => unit.faction === actor.faction && isCombatReadyUnit(unit));
    const lowHpUnits = friendlyUnits.filter(unit => unit.hp / Math.max(1, unit.maxHp) < 0.4);
    const actorHpRate = actor.hp / Math.max(1, actor.maxHp);

    if (actor.faction === 'enemy') {
      if (actorHpRate < 0.25) return actor;
      const candidateUnits = lowHpUnits.length ? lowHpUnits : friendlyUnits;
      const filteredCandidates =
        actorHpRate > 0.75 ? candidateUnits.filter(unit => unit.id !== actor.id) : candidateUnits;
      return getLowestHpTarget(filteredCandidates.length ? filteredCandidates : candidateUnits);
    }

    const currentRole = friendlyUnits.find(unit => unit.subFaction === 'squad' && unit.id === playerId);
    if (currentRole && currentRole.hp / Math.max(1, currentRole.maxHp) < 0.4) return currentRole;

    const squadLowHp = lowHpUnits.filter(unit => unit.subFaction === 'squad');
    if (squadLowHp.length > 0) return getLowestHpTarget(squadLowHp);

    const allyLowHp = lowHpUnits.filter(unit => unit.subFaction !== 'squad');
    if (allyLowHp.length > 0) return getLowestHpTarget(allyLowHp);

    if (actorHpRate > 0.75) {
      const nonSelfCandidates = friendlyUnits.filter(unit => unit.id !== actor.id);
      if (nonSelfCandidates.length > 0) return getLowestHpTarget(nonSelfCandidates);
    }

    return actor;
  };

  const getAiIntentLabel = (decision: AiDecision, actor: BattleCharacter, units: BattleCharacter[]) => {
    if (decision.actionId === 'defense') return '防御';
    if (decision.actionId === 'escape') return '逃跑';
    if (decision.actionId === 'emergency_medical') {
      const target = decision.targetId ? getUnit(units, decision.targetId) : actor;
      return `紧急医治 ${(target || actor).name}`;
    }
    const target = decision.targetId ? getUnit(units, decision.targetId) : null;
    return target ? `攻击 ${target.name}` : '无有效目标';
  };

  const decideAiAction = (
    actor: BattleCharacter,
    units: BattleCharacter[],
    lastRoundAttackersCount: Record<string, number>,
  ): AiDecision => {
    const enemyFaction: Faction = actor.faction === 'friendly' ? 'enemy' : 'friendly';
    const hpRate = actor.hp / Math.max(1, actor.maxHp);
    const isLowHp = hpRate < 0.4;
    const allyCount = getCombatReadyCount(units, actor.faction);
    const enemyCount = getCombatReadyCount(units, enemyFaction);
    const hasNumberAdvantage = allyCount > enemyCount;
    const canEmergencyHeal = actor.attributes.INT > 50 && actor.aiMedicalCooldown <= 0;
    const emergencyHealTarget = canEmergencyHeal ? getEmergencyHealTarget(actor, units) : null;
    const lowHpTargetExists =
      !!emergencyHealTarget && emergencyHealTarget.hp / Math.max(1, emergencyHealTarget.maxHp) < 0.4;
    const veryLowHpTargetExists =
      !!emergencyHealTarget && emergencyHealTarget.hp / Math.max(1, emergencyHealTarget.maxHp) < 0.25;
    const attackTarget = pickRandomTarget(units, enemyFaction);
    const attackersCount = lastRoundAttackersCount[actor.id] ?? 0;
    const traumaPenalty = getEscapeTraumaPenalty(actor);
    const statusPenalty = getEscapeStatusPenalty(actor);
    const escapePenalty = getEscapePenalty(actor) + attackersCount * 15 + traumaPenalty + statusPenalty;
    const escapeChance = traumaPenalty >= 9999 || statusPenalty >= 9999 ? -9999 : 70 - escapePenalty;
    const canConsiderEscape = hpRate < 0.4 && actor.attributes.WIL <= 80;

    const scores = {
      attack: 60,
      emergency_medical: canEmergencyHeal ? 35 : -9999,
      defense: actor.aiDefenseCooldown > 0 ? -9999 : 22,
      escape: canConsiderEscape ? 12 : -9999,
    };

    if (hpRate >= 0.7) scores.attack += 10;
    if (isLowHp) {
      scores.attack -= 18;
      scores.defense += 22;
      if (canConsiderEscape) scores.escape += 16;
    }
    if (hpRate < 0.25) {
      scores.defense += 8;
      if (canConsiderEscape) scores.escape += 15;
    }
    if (hasNumberAdvantage) {
      scores.attack += 6;
      scores.emergency_medical += 12;
      scores.defense += 10;
      if (canConsiderEscape) scores.escape -= 18;
    }
    if (canConsiderEscape && enemyCount <= allyCount) scores.escape -= 10;
    if (canConsiderEscape && escapeChance < 20) scores.escape -= 20;
    if (lowHpTargetExists) {
      scores.emergency_medical += 24;
      scores.attack -= 12;
    }
    if (veryLowHpTargetExists) scores.emergency_medical += 16;
    if (actor.attributes.INT > 50) {
      scores.emergency_medical += 8;
      if (canConsiderEscape) scores.escape -= 8;
      scores.defense -= 6;
    }

    const rollEntries = [
      {
        actionId: 'attack' as const,
        score: Math.max(0, scores.attack + _.random(1, 10)),
        targetId: attackTarget?.id,
      },
      {
        actionId: 'emergency_medical' as const,
        score: Math.max(0, scores.emergency_medical + _.random(1, 10)),
        targetId: emergencyHealTarget?.id,
      },
      {
        actionId: 'defense' as const,
        score: Math.max(0, scores.defense + _.random(1, 10)),
      },
      {
        actionId: 'escape' as const,
        score: Math.max(0, scores.escape + _.random(1, 10)),
      },
    ].filter(entry => entry.score > 0 && (entry.actionId !== 'attack' || entry.targetId));

    const totalScore = rollEntries.reduce((sum, entry) => sum + entry.score, 0);
    if (totalScore <= 0) {
      return { actionId: 'attack', targetId: attackTarget?.id, reason: 'fallback_attack' };
    }

    let roll = _.random(1, totalScore);
    for (const entry of rollEntries) {
      roll -= entry.score;
      if (roll <= 0) {
        return {
          actionId: entry.actionId,
          targetId: entry.targetId,
          reason: `${entry.actionId}:${entry.score}/${totalScore}`,
        };
      }
    }

    return { actionId: 'attack', targetId: attackTarget?.id, reason: 'fallback_attack' };
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

  const applySubdue = (
    units: BattleCharacter[],
    attacker: BattleCharacter,
    defender: BattleCharacter,
    logs: string[],
    lastRoundAttackersCount: Record<string, number>,
  ): AttackResult => {
    appendLog(logs, `${attacker.name}: 尝试制服 ${defender.name}。`);

    // 计算血量难度修正
    const hpRatio = defender.hp / defender.maxHp;
    let hpDifficulty = 0;
    if (hpRatio > 0.2) {
      hpDifficulty = 60;
    } else if (hpRatio <= 0.2 && hpRatio > 0.1) {
      hpDifficulty = 5;
    } else if (hpRatio <= 0.1) {
      hpDifficulty = -15;
    }

    // 计算等级差
    const levelDiff = defender.level - attacker.level;

    // 我方加成: D100 + 力量(每20属性+1修正) + 魅力(每5属性+1修正)
    const myRoll = d100();
    const myBonus = Math.round(attacker.attributes.STR / 20) + Math.round(attacker.attributes.CHA / 5);
    const myTotal = Math.round(myRoll + myBonus);

    // 敌方加成: D100 + 意志(每10属性+1修正) + 体质(每20属性+1修正) + 额外难度 - 双方等级差
    const enemyRoll = d100();
    const enemyBonus = Math.round(defender.attributes.WIL / 10) + Math.round(defender.attributes.TGH / 20);
    const enemyTotal = Math.round(enemyRoll + enemyBonus + hpDifficulty - levelDiff);

    appendLog(
      logs,
      `${attacker.name}: 制服检定 - 我方[${myRoll}+${myBonus}=${myTotal}] vs 敌方[${enemyRoll}+${enemyBonus}+${hpDifficulty}-${levelDiff}=${enemyTotal}]`,
    );

    if (myTotal > enemyTotal) {
      // 制服成功
      const updatedDefender = { ...defender, state: '已被制服', hp: Math.max(10, defender.hp) };
      appendLog(logs, `${attacker.name}: 制服成功！${defender.name}（已被制服）。`);

      const moraleUnits = applyMoraleOutcome(units, updatedDefender, logs, 'damage', lastRoundAttackersCount);
      const nextUnits = replaceUnit(replaceUnit(moraleUnits, attacker), updatedDefender);

      return {
        units: nextUnits,
        attacker,
        defender: updatedDefender,
      };
    } else {
      // 制服失败
      appendLog(logs, `${attacker.name}: 制服失败。`);

      // 制服失败可能使攻击者陷入失衡
      if (d100() <= 20) {
        const updatedAttacker = { ...attacker, defenseBonus: (attacker.defenseBonus || 0) - 10 };
        appendLog(logs, `${attacker.name}: 制服失败导致失衡，防御检定-10。`);
        const nextUnits = replaceUnit(units, updatedAttacker);
        return { units: nextUnits, attacker: updatedAttacker, defender };
      }

      return { units, attacker, defender };
    }
  };

  const applyAttack = (
    units: BattleCharacter[],
    attacker: BattleCharacter,
    defender: BattleCharacter,
    defenseIndex: number,
    logs: string[],
    lastRoundAttackersCount: Record<string, number>,
    attackPenaltyExtra = 0,
    targetIndex?: number,
    targetCount?: number,
    allowMartialExtraAttack = true,
    nonLethalActorIds: string[] = [],
    attackWeapon?: BattleCharacter['weapon'],
  ): AttackResult => {
    const hitBonus = attacker.hitBonusAgainst[defender.id] || 0;
    const currentWeapon = attackWeapon || attacker.weapon;
    if (attacker.hitBonusAgainst[defender.id]) {
      attacker.hitBonusAgainst[defender.id] = 0;
    }

    const targetLabel =
      targetCount && targetCount > 1 && targetIndex !== undefined ? `·目标${targetIndex + 1}/${targetCount}` : '';

    const rawRoll = d100();
    const attackRoll = rawRoll + hitBonus - attackPenaltyExtra;
    const evadeBase = defender.attributes.DEX * 0.5 + defender.attributes.PER * 0.2;
    const multiTargetPenalty = Math.max(0, (lastRoundAttackersCount[defender.id] || 0) - 1) * 8;
    const evadeValue = Math.max(0, Math.min(70, evadeBase) - multiTargetPenalty);
    const isMartialArts = /武术/.test(currentWeapon.type);
    const isMartialSpeed = isMartialArts && attacker.attributes.DEX >= attacker.attributes.STR;
    const isMartialHeavy = isMartialArts && attacker.attributes.STR > attacker.attributes.DEX;
    const isHeavyWeapon = /大型/.test(currentWeapon.type);
    const isCrit = rawRoll >= (isHeavyWeapon ? 90 : 93);
    const isFumble = rawRoll <= (isHeavyWeapon ? 10 : 5);

    if (isFumble) {
      appendLog(logs, `${attacker.name}: 攻击检定大失败 (判定 ${rawRoll})`);
      if (/(弩|弓)/.test(currentWeapon.type)) {
        const allyTargets = units.filter(
          unit => unit.faction === attacker.faction && unit.id !== attacker.id && isCombatReadyUnit(unit),
        );
        const ally = allyTargets.length ? allyTargets[_.random(0, allyTargets.length - 1)] : null;
        if (ally) {
          appendLog(logs, `${attacker.name}: 大失败！误伤队友 ${ally.name}。`);
          const ratio = getDamageRatio(currentWeapon.type, currentWeapon.damageType);
          const martialBonusDice = isMartialArts ? getMartialArtsBonusDice(attacker.attributes) : 0;
          const baseDamage =
            rollDice(currentWeapon.damageDice) +
            martialBonusDice +
            Math.max(
              0,
              isBowOrCrossbow(currentWeapon.type)
                ? (attacker.attributes.STR * 0.45 + attacker.attributes.PER * 0.85) * 0.35
                : (attacker.attributes.STR * 0.6 + attacker.attributes.DEX * 0.4) * 0.35,
            );
          const rawDamage = Math.max(0, baseDamage);
          const finalDamage = rawDamage;
          const cutDamage = Math.round(finalDamage * ratio.cut);
          const bluntDamage = Math.round(finalDamage * ratio.blunt);
          const drIgnore = /弩/.test(currentWeapon.type) ? 8 : 0;
          const effectiveDR = Math.max(0, ally.armorDR - drIgnore);
          const cutAfterDR = Math.max(0, Math.round(cutDamage - effectiveDR));
          const bluntScale = /钝器|盾牌/.test(currentWeapon.type)
            ? 1
            : /弩/.test(currentWeapon.type)
              ? 1.2
              : /武士刀/.test(currentWeapon.type)
                ? 0.5
                : /(军刀|长柄)/.test(currentWeapon.type)
                  ? 0.6
                  : 0.7;
          const bluntAfterScale = Math.round(bluntDamage * bluntScale);
          const totalDamage = Math.round(cutAfterDR + bluntAfterScale);
          const reducedDamage = Math.max(0, Math.round(totalDamage - getWillDamageReductionRate(ally)));
          const updatedAlly = applyDamage(ally, reducedDamage);
          appendLog(logs, `${attacker.name}: 误伤${ally.name}，造成 ${reducedDamage} 伤害。`);
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
      return applyAttack(
        units,
        defender,
        attacker,
        0,
        logs,
        lastRoundAttackersCount,
        0,
        undefined,
        undefined,
        true,
        nonLethalActorIds,
      );
    }

    appendLog(logs, `${attacker.name}: 攻击${defender.name}（第${defenseIndex + 1}击${targetLabel}：判定 ${rawRoll}）`);

    if (attackRoll < evadeValue) {
      appendLog(logs, `${attacker.name}: 攻击落空 (判定 ${attackRoll.toFixed(0)} < ${evadeValue.toFixed(0)})`);
      return { units, attacker, defender, dodged: true };
    }

    appendLog(logs, `${defender.name}: 闪避判定失败 (判定 ${attackRoll.toFixed(0)} >= ${evadeValue.toFixed(0)})`);

    let useBlock = getDefenseMode(defender, currentWeapon.type);
    if (defender.noBlockNextRound) useBlock = false;
    const defensePenalty = defenseIndex * 8;
    const defenseBase = getDefenseBase(defender, useBlock);
    const defenseChance =
      defenseBase + (defender.attributes.DEX - attacker.attributes.DEX) - defensePenalty - multiTargetPenalty;
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

    const martialBonusDice = isMartialArts ? getMartialArtsBonusDice(attacker.attributes) : 0;
    const baseDamage =
      rollDice(currentWeapon.damageDice) +
      martialBonusDice +
      Math.max(
        0,
        isBowOrCrossbow(currentWeapon.type)
          ? (attacker.attributes.STR * 0.45 + attacker.attributes.PER * 0.85) * 0.35
          : (attacker.attributes.STR * 0.6 + attacker.attributes.DEX * 0.4) * 0.35,
      );
    const rawDamage = Math.max(0, baseDamage);
    const critMultiplier = isCrit ? (isMartialHeavy ? 2 : isMartialSpeed ? 1 : 1.5) : 1;
    const finalDamage = rawDamage * critMultiplier;
    const ratio = getDamageRatio(currentWeapon.type, currentWeapon.damageType);
    let cutDamage = Math.round(finalDamage * ratio.cut);
    let bluntDamage = Math.round(finalDamage * ratio.blunt);

    if (defenseSuccess && useBlock) {
      cutDamage = 0;
      bluntDamage = Math.round(bluntDamage * 0.5);
    }

    const drIgnore = /砍刀/.test(currentWeapon.type) ? 6 : /弩/.test(currentWeapon.type) ? 8 : isMartialHeavy ? 5 : 0;
    const effectiveDR = Math.max(0, defender.armorDR - drIgnore);
    const cutAfterDR = Math.max(0, Math.round(cutDamage - effectiveDR));
    const bluntScale = /钝器|盾牌/.test(currentWeapon.type)
      ? 1
      : /弩/.test(currentWeapon.type)
        ? 1.2
        : /武士刀/.test(currentWeapon.type)
          ? 0.5
          : /(军刀|长柄)/.test(currentWeapon.type)
            ? 0.6
            : 0.7;
    const bluntAfterScale = Math.round(bluntDamage * bluntScale);
    const totalDamage = Math.round(cutAfterDR + bluntAfterScale);
    const reducedDamage = Math.max(0, Math.round(totalDamage - getWillDamageReductionRate(defender)));
    const armorAbsorbed = Math.round(Math.max(0, cutDamage - cutAfterDR));

    const hpBefore = defender.hp;
    let actualDamage = reducedDamage;

    // 非致命模式：伤害使目标血量锁定为10
    if (nonLethalActorIds.length > 0 && defender.faction !== attacker.faction) {
      const isAttackerNonLethal = nonLethalActorIds.includes(attacker.id);

      if (isAttackerNonLethal) {
        // 计算实际伤害，但确保目标血量不低于10
        const potentialHpAfter = Math.max(0, defender.hp - reducedDamage);
        if (potentialHpAfter < 10) {
          actualDamage = Math.max(0, defender.hp - 10);
        }
      }
    }

    const updatedDefender = applyDamage(defender, actualDamage);
    const hpAfter = updatedDefender.hp;
    const hitPart = rollInjuryPart();
    const baseThreshold = getTraumaThresholdByLevel(defender.attributes.TGH, defender.traumaParts[hitPart] || 0);
    const currentRemaining = updatedDefender.traumaAccumulated?.[hitPart] ?? baseThreshold;
    const limbCutScale = /砍刀/.test(currentWeapon.type) ? 1.4 : 1.2;
    const limbBluntScale = /钝器|盾牌/.test(currentWeapon.type) ? 1.4 : 1;
    const limbDamage = _.round(cutAfterDR * limbCutScale + bluntAfterScale * limbBluntScale, 2);
    const newRemaining = currentRemaining - limbDamage;
    updatedDefender.traumaAccumulated = {
      ...updatedDefender.traumaAccumulated,
      [hitPart]: _.round(newRemaining, 2),
    };
    const damageText = `造成 ${totalDamage} 伤害 (切割 ${cutDamage}(减伤${armorAbsorbed}) / 破甲 ${bluntDamage})，肢体伤害 ${limbDamage}`;
    appendLog(logs, `${attacker.name}: 命中${defender.name}(${hitPart})，${damageText}`);

    if (/武士刀/.test(currentWeapon.type) && cutAfterDR > 0) {
      updatedDefender.bleedLayers += 1;
      appendLog(logs, `${defender.name}: 武士刀追加流血层数+1。`);
    }

    if (/砍刀/.test(currentWeapon.type) && isCrit) {
      const reduced = Math.max(0, updatedDefender.armorDR - 8);
      updatedDefender.armorDR = reduced;
      appendLog(logs, `${defender.name}: 破甲效果触发，DR降低8。`);
    }

    if (/钝器/.test(attacker.weapon.type) && isCrit) {
      updatedDefender.fractureStacks = Math.max(0, (updatedDefender.fractureStacks || 0) + 1);
      appendLog(
        logs,
        `${defender.name}: 骨折层数+1（当前${updatedDefender.fractureStacks}层，力量/敏捷每层-10，逃跑惩罚每层-15）。`,
      );
    }

    const traumaThreshold = defender.attributes.TGH * 0.4;
    let traumaIncreased = false;
    if (newRemaining <= 0 || totalDamage > traumaThreshold || isCrit) {
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
      let lowHpBonusTrigger = hpAfter > 0 && hpAfter <= maxHp * 0.3 && !updatedDefender.lowHpTraumaBoostUsed;

      const immediateUpgrade =
        (partLevel === 0 && isCrit) ||
        (partLevel === 1 && (isCrit || totalDamage > tgh * 0.45)) ||
        (partLevel === 2 && totalDamage > tgh * 0.4) ||
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

      if (lowHpBonusTrigger && nextLevel <= partLevel) {
        lowHpBonusTrigger = false;
      }

      if (lowHpBonusTrigger && nextLevel < 4) {
        nextLevel += 1;
        updatedDefender.lowHpTraumaBoostUsed = true;
        if (nextLevel >= 4) {
          remaining = 0;
        } else {
          remaining = Math.min(remaining, getTraumaThresholdByLevel(tgh, nextLevel));
        }
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

    const moraleUnits = applyMoraleOutcome(units, updatedDefender, logs, 'damage', lastRoundAttackersCount);
    const nextUnits = replaceUnit(replaceUnit(moraleUnits, attacker), updatedDefender);

    if (isMartialSpeed && isCrit && allowMartialExtraAttack && updatedDefender.hp > 0 && attacker.hp > 0) {
      appendLog(logs, `${attacker.name}: 武术大成功，触发额外攻击1次。`);
      const nextAttacker = getUnit(nextUnits, attacker.id);
      const nextDefender = getUnit(nextUnits, defender.id);
      if (nextAttacker && nextDefender && nextAttacker.hp > 0 && nextDefender.hp > 0) {
        return applyAttack(
          nextUnits,
          nextAttacker,
          nextDefender,
          0,
          logs,
          lastRoundAttackersCount,
          0,
          undefined,
          undefined,
          false,
          nonLethalActorIds,
        );
      }
    }

    return {
      units: nextUnits,
      attacker,
      defender: updatedDefender,
    };
  };

  const runRound = () => {
    if (!playerId) return;

    setBattleState(prev => {
      if (prev.result) return prev;
      const logs: string[] = [];
      let workingUnits = cloneUnits(prev.units).map(unit => ({
        ...unit,
        defenseBonus: 0,
        blockBonus: 0,
        aiDefenseCooldown: Math.max(0, (unit.aiDefenseCooldown || 0) - 1),
        aiMedicalCooldown: Math.max(0, (unit.aiMedicalCooldown || 0) - 1),
        playerEmergencyMedicalCooldown: Math.max(0, (unit.playerEmergencyMedicalCooldown || 0) - 1),
      }));
      const defenderDefenseCount: Record<string, number> = {};
      const lastRoundAttackersCount: Record<string, number> = { ...prev.lastRoundAttackersCount };
      const lastRoundAttackersMap = new Map<string, Set<string>>();
      appendLog(logs, `--- 第 ${prev.round} 回合 ---`);
      workingUnits = applyBleedAndShock(workingUnits, logs, prev.nonLethalActorIds);
      workingUnits = workingUnits.reduce(
        (acc, unit) => applyMoraleOutcome(acc, unit, logs, 'round', lastRoundAttackersCount),
        workingUnits,
      );

      const friendlySquadReady = workingUnits.some(
        unit => unit.faction === 'friendly' && unit.subFaction === 'squad' && isCombatReadyUnit(unit),
      );
      if (!friendlySquadReady) {
        appendLog(logs, '我方已无人可战。');
        appendLog(logs, SETTLEMENT_LOG);
        return {
          ...prev,
          logs: [...prev.logs, ...logs],
          result: 'defeat',
          endReason: 'normal',
          lastRoundAttackersCount: prev.lastRoundAttackersCount,
          aiPlans: prev.aiPlans,
          playerEmergencyMedicalCooldown: prev.playerEmergencyMedicalCooldown,
        };
      }

      const tauntTargets: Record<string, string> = {};
      Object.entries(plannedActions).forEach(([actorId, action]) => {
        if (action.actionId === 'tactics' && action.tactic === 'taunt' && action.targetId) {
          const target = getUnit(workingUnits, action.targetId);
          const actor = getUnit(workingUnits, actorId);
          if (target && actor && isCombatReadyUnit(target) && isCombatReadyUnit(actor)) {
            tauntTargets[target.id] = actor.id;
          }
        }
      });

      const enemyTargetMap: Record<string, string> = {};
      const aiDecisions = new Map<string, AiDecision>();
      workingUnits
        .filter(unit => unit.faction !== 'friendly' || unit.subFaction !== 'squad')
        .forEach(unit => {
          if (!isCombatReadyUnit(unit)) return;
          const tauntedBy = unit.faction === 'enemy' ? tauntTargets[unit.id] : undefined;
          if (tauntedBy) {
            aiDecisions.set(unit.id, { actionId: 'attack', targetId: tauntedBy, reason: 'taunted' });
            const taunter = getUnit(workingUnits, tauntedBy);
            workingUnits = setUnitIntent(workingUnits, unit.id, taunter ? `攻击 ${taunter.name}` : '无有效目标');
            if (taunter) enemyTargetMap[unit.id] = taunter.id;
            return;
          }
          const decision = prev.aiPlans[unit.id] || decideAiAction(unit, workingUnits, lastRoundAttackersCount);
          aiDecisions.set(unit.id, decision);
          workingUnits = setUnitIntent(workingUnits, unit.id, getAiIntentLabel(decision, unit, workingUnits));
          if (unit.faction === 'enemy' && decision.actionId === 'attack' && decision.targetId) {
            enemyTargetMap[unit.id] = decision.targetId;
          }
        });

      const turnOrderIds = buildTurnOrder(workingUnits).map(unit => unit.id);
      const attackPlans = new Map<
        string,
        { actionId: string; targetId?: string; plannedTargetIds?: string[]; targetFaction: Faction }
      >();

      for (const actorId of turnOrderIds) {
        const actor = getUnit(workingUnits, actorId);
        if (!actor || !isCombatReadyUnit(actor)) continue;

        if (actor.faction === 'friendly' && actor.subFaction === 'squad') {
          const planned = plannedActions[actor.id];

          if (planned?.actionId === 'tactics' && planned.tactic === 'taunt') {
            const tauntBlockBonus = _.round(12 * getTacticEffectMultiplier(actor), 2);
            workingUnits = replaceUnit(workingUnits, { ...actor, blockBonus: tauntBlockBonus });
            appendLog(logs, `${actor.name}: 使用嘲弄，强制目标攻击自己，格挡值+${tauntBlockBonus}，本回合不攻击。`);
            continue;
          }

          if (planned?.actionId === 'tactics' && planned.tactic === 'defense') {
            const blockBonus = _.round(18 * getTacticEffectMultiplier(actor), 2);
            workingUnits = replaceUnit(workingUnits, { ...actor, blockBonus });
            workingUnits = setUnitIntent(workingUnits, actor.id, '防御');
            appendLog(logs, `${actor.name}: 进入防御姿态，格挡基础+${blockBonus}。`);
            continue;
          }

          if (planned?.actionId === 'tactics' && planned.tactic === 'emergency_medical') {
            const targetId =
              selectedMedicalTargetId && getUnit(workingUnits, selectedMedicalTargetId)?.faction === 'friendly'
                ? selectedMedicalTargetId
                : actor.id;
            const target = getUnit(workingUnits, targetId) ?? actor;
            const intValue = Math.max(1, Math.round(actor.attributes.INT || 1));
            const healAmount = _.round(actor.attributes.INT * 0.4 + _.random(1, intValue), 2);
            const updatedTarget = { ...target, hp: Math.min(target.maxHp, Math.max(0, target.hp + healAmount)) };
            if (updatedTarget.id === actor.id) {
              workingUnits = replaceUnit(workingUnits, updatedTarget);
            } else {
              workingUnits = replaceUnit(workingUnits, actor);
              workingUnits = replaceUnit(workingUnits, updatedTarget);
            }
            workingUnits = setUnitIntent(workingUnits, actor.id, `紧急医治 ${target.name}`);
            appendLog(logs, `${actor.name}: 对${target.name}进行紧急手动医治，恢复${healAmount}血量。`);
            setPlannedActions(prevActions => {
              const next = { ...prevActions };
              delete next[actor.id];
              return next;
            });
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

            const hasAnyItem = Object.entries(actor.backpackItems || {}).some(([name, item]) => {
              if (!isMedicalBackpackItem(name, item)) return false;
              return actorItemCounts(name) > 0;
            });

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
            const tacticEffectMultiplier = getTacticEffectMultiplier(actor);

            if (['基础急救包', '标准急救包', '高级急救包', '骨人修理包', '骨人修理箱'].includes(chosenItem)) {
              if (chosenItem === '基础急救包') healAmount = Math.round(target.maxHp * 0.2 * tacticEffectMultiplier);
              if (chosenItem === '标准急救包') healAmount = Math.round(target.maxHp * 0.35 * tacticEffectMultiplier);
              if (chosenItem === '高级急救包') healAmount = Math.round(target.maxHp * 0.55 * tacticEffectMultiplier);
              if (chosenItem === '骨人修理包') healAmount = Math.round(target.maxHp * 0.35 * tacticEffectMultiplier);
              if (chosenItem === '骨人修理箱') healAmount = Math.round(target.maxHp * 0.65 * tacticEffectMultiplier);

              const newHp = Math.min(target.maxHp, Math.max(0, target.hp + healAmount));
              updatedTarget = { ...updatedTarget, hp: newHp };
              updatedActor = consumeItem(updatedActor, chosenItem);
              appendLog(logs, `${actor.name}: 对${target.name}使用${chosenItem}，恢复${healAmount}血量。`);
            }

            if (['普通夹板包', '高级夹板包'].includes(chosenItem)) {
              traumaReduce = Math.max(1, Math.round((chosenItem === '高级夹板包' ? 2 : 1) * tacticEffectMultiplier));
              const entries = Object.entries(updatedTarget.traumaParts) as Array<
                ['左臂' | '右臂' | '左腿' | '右腿', number]
              >;
              const [partToHeal] = entries.sort((a, b) => b[1] - a[1])[0] || ['左臂', 0];
              const currentLevel = updatedTarget.traumaParts[partToHeal] || 0;
              const nextLevel = Math.max(0, currentLevel - traumaReduce);
              updatedTarget = {
                ...updatedTarget,
                traumaParts: { ...updatedTarget.traumaParts, [partToHeal]: nextLevel },
                fractureStacks: 0,
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
            const attackersCount = lastRoundAttackersCount[actor.id] ?? 0;
            const escapeRoll = d100();
            const traumaPenalty = getEscapeTraumaPenalty(actor);
            const statusPenalty = getEscapeStatusPenalty(actor);
            if (traumaPenalty >= 9999 || statusPenalty >= 9999) {
              workingUnits = setUnitIntent(workingUnits, actor.id, '逃跑失败');
              appendLog(logs, `${actor.name}: 逃跑失败，无法移动。`);
              continue;
            }
            const escapePenalty = getEscapePenalty(actor) + attackersCount * 15 + traumaPenalty + statusPenalty;
            const escapeChance = 70 - escapePenalty;
            const criticalEscape = escapeRoll <= 5 && traumaPenalty < 25 && statusPenalty < 30;
            appendLog(
              logs,
              `${actor.name}: 逃跑判定 d100=${escapeRoll} 成功率=${Math.max(0, Math.round(escapeChance))}。`,
            );
            if (escapeRoll <= escapeChance || criticalEscape) {
              workingUnits = replaceUnit(workingUnits, { ...actor, escaped: true });
              workingUnits = setUnitIntent(workingUnits, actor.id, '逃跑成功');
              appendLog(
                logs,
                `${actor.name}: 逃跑成功(${escapeRoll}<${Math.max(0, Math.round(escapeChance))})，退出战斗。`,
              );
            } else {
              workingUnits = setUnitIntent(workingUnits, actor.id, '逃跑失败');
              appendLog(
                logs,
                `${actor.name}: 逃跑失败(${escapeRoll}>=${Math.max(0, Math.round(escapeChance))})，被敌人锁定。`,
              );
            }
            continue;
          }

          if (planned?.actionId === 'surrender') {
            workingUnits = setUnitIntent(workingUnits, actor.id, '投降');
            appendLog(logs, `${actor.name}: 选择投降，战斗结束。`);
            appendLog(logs, SETTLEMENT_LOG);
            return {
              ...prev,
              logs: [...prev.logs, ...logs],
              result: 'defeat',
              endReason: 'surrender',
              lastRoundAttackersCount: prev.lastRoundAttackersCount,
              playerEmergencyMedicalCooldown: prev.playerEmergencyMedicalCooldown,
            };
          }

          if (planned?.actionId === 'subdue') {
            const plannedTargetIds = planned.targetIds || [];
            let target: BattleCharacter | null = null;
            if (planned.targetId) {
              target = getUnit(workingUnits, planned.targetId) ?? null;
            }
            if (!target || !isCombatReadyUnit(target)) {
              target = pickRandomTarget(workingUnits, 'enemy');
            }
            if (!target) {
              workingUnits = setUnitIntent(workingUnits, actor.id, '无有效目标');
              continue;
            }
            workingUnits = setUnitIntent(workingUnits, actor.id, `制服 ${target.name}`);
            attackPlans.set(actor.id, {
              actionId: 'subdue',
              targetId: target.id,
              plannedTargetIds,
              targetFaction: 'enemy',
            });
            continue;
          }

          let target: BattleCharacter | null = null;
          const plannedTargetIds = planned?.actionId === 'attack' ? planned.targetIds || [] : [];
          if (planned?.actionId === 'attack' && planned.targetId) {
            target = getUnit(workingUnits, planned.targetId) ?? null;
          }
          if (!target || !isCombatReadyUnit(target)) {
            target = pickRandomTarget(workingUnits, 'enemy');
          }
          if (!target) {
            workingUnits = setUnitIntent(workingUnits, actor.id, '无有效目标');
            continue;
          }
          workingUnits = setUnitIntent(workingUnits, actor.id, `攻击 ${target.name}`);
          attackPlans.set(actor.id, {
            actionId: 'attack',
            targetId: target.id,
            plannedTargetIds,
            targetFaction: 'enemy',
          });
          continue;
        }

        const decision = aiDecisions.get(actor.id) || decideAiAction(actor, workingUnits, lastRoundAttackersCount);
        workingUnits = setUnitIntent(workingUnits, actor.id, getAiIntentLabel(decision, actor, workingUnits));

        if (decision.actionId === 'defense') {
          const blockBonus = _.round(18 * getTacticEffectMultiplier(actor), 2);
          workingUnits = replaceUnit(workingUnits, { ...actor, blockBonus, aiDefenseCooldown: 2 });
          appendLog(logs, `${actor.name}: 选择防御，格挡基础+${blockBonus}。`);
          continue;
        }

        if (decision.actionId === 'escape') {
          const attackersCount = lastRoundAttackersCount[actor.id] ?? 0;
          const escapeRoll = d100();
          const traumaPenalty = getEscapeTraumaPenalty(actor);
          const statusPenalty = getEscapeStatusPenalty(actor);
          if (traumaPenalty >= 9999 || statusPenalty >= 9999) {
            workingUnits = setUnitIntent(workingUnits, actor.id, '逃跑失败');
            appendLog(logs, `${actor.name}: 逃跑失败，无法移动。`);
            continue;
          }
          const escapePenalty = getEscapePenalty(actor) + attackersCount * 15 + traumaPenalty + statusPenalty;
          const escapeChance = 70 - escapePenalty;
          const criticalEscape = escapeRoll <= 5 && traumaPenalty < 25 && statusPenalty < 30;
          if (escapeRoll <= escapeChance || criticalEscape) {
            workingUnits = replaceUnit(workingUnits, { ...actor, escaped: true });
            workingUnits = setUnitIntent(workingUnits, actor.id, '逃跑成功');
            appendLog(logs, `${actor.name}: 逃跑成功(${escapeRoll}<${Math.max(0, Math.round(escapeChance))})。`);
          } else {
            workingUnits = setUnitIntent(workingUnits, actor.id, '逃跑失败');
            appendLog(logs, `${actor.name}: 逃跑失败(${escapeRoll}>=${Math.max(0, Math.round(escapeChance))})。`);
          }
          continue;
        }

        if (decision.actionId === 'emergency_medical') {
          const target = decision.targetId ? (getUnit(workingUnits, decision.targetId) ?? actor) : actor;
          const intValue = Math.max(1, Math.round(actor.attributes.INT || 1));
          const healAmount = _.round(actor.attributes.INT * 0.4 + _.random(1, intValue), 2);
          const updatedTarget = { ...target, hp: Math.min(target.maxHp, Math.max(0, target.hp + healAmount)) };
          const nextMedicalCooldown = actor.id === updatedTarget.id ? 3 : 2;
          const updatedActor =
            actor.id === updatedTarget.id
              ? { ...updatedTarget, aiMedicalCooldown: nextMedicalCooldown }
              : { ...actor, aiMedicalCooldown: nextMedicalCooldown };
          if (updatedActor.id === updatedTarget.id) {
            workingUnits = replaceUnit(workingUnits, updatedActor);
          } else {
            workingUnits = replaceUnit(workingUnits, updatedActor);
            workingUnits = replaceUnit(workingUnits, updatedTarget);
          }
          workingUnits = setUnitIntent(workingUnits, actor.id, `紧急医治 ${target.name}`);
          appendLog(logs, `${actor.name}: 对${target.name}进行紧急手动医治，恢复${healAmount}血量。`);
          continue;
        }

        const targetFaction = actor.faction === 'friendly' ? 'enemy' : 'friendly';
        const targetId = decision.targetId || (actor.faction === 'enemy' ? enemyTargetMap[actor.id] : undefined);
        const target = targetId ? getUnit(workingUnits, targetId) : pickRandomTarget(workingUnits, targetFaction);
        if (!target) {
          workingUnits = setUnitIntent(workingUnits, actor.id, '无有效目标');
          continue;
        }
        attackPlans.set(actor.id, {
          actionId: 'attack',
          targetId: target.id,
          plannedTargetIds: [],
          targetFaction,
        });
      }

      const maxAttackCount = Math.max(
        0,
        ...Array.from(attackPlans.keys()).map(actorId => {
          const actor = getUnit(workingUnits, actorId);
          return actor ? actor.attackCount : 0;
        }),
      );

      for (let attackIndex = 0; attackIndex < maxAttackCount; attackIndex += 1) {
        for (const actorId of turnOrderIds) {
          const plan = attackPlans.get(actorId);
          if (!plan) continue;
          const actor = getUnit(workingUnits, actorId);
          if (!actor || !isCombatReadyUnit(actor)) continue;
          if (attackIndex >= actor.attackCount) continue;
          const useMainWeaponThisHit = attackIndex < (actor.mainWeaponAttackCount || 0);
          const activeWeapon = useMainWeaponThisHit ? actor.weapon : actor.subWeapon;
          if (!activeWeapon || activeWeapon.type === '无') continue;

          const targetFaction = actor.faction === 'friendly' ? 'enemy' : 'friendly';
          let target = plan.targetId ? getUnit(workingUnits, plan.targetId) : null;
          if (!target || !isCombatReadyUnit(target) || target.faction !== targetFaction) {
            target = pickRandomTarget(workingUnits, targetFaction);
            plan.targetId = target?.id;
          }
          if (!target) continue;

          const isPolearm = /长柄/.test(actor.weapon.type);
          const isHeavyWeapon = /大型/.test(actor.weapon.type);
          const plannedTargetIds = plan.plannedTargetIds || [];
          const explicitTargets = plannedTargetIds
            .map((id: string) => getUnit(workingUnits, id))
            .filter((unit: BattleCharacter | undefined | null): unit is BattleCharacter =>
              Boolean(unit && isCombatReadyUnit(unit)),
            );
          const extraTargets = isPolearm
            ? workingUnits.filter(
                unit => unit.faction === targetFaction && unit.id !== target.id && isCombatReadyUnit(unit),
              )
            : [];
          const poleTargets = isPolearm
            ? explicitTargets.length
              ? explicitTargets
              : [target, ...extraTargets.slice(0, 2)]
            : [target];

          // 制服模式只攻击单个目标，不使用长柄或重武器的特殊逻辑
          if (plan.actionId === 'subdue') {
            const result = applySubdue(workingUnits, actor, target, logs, lastRoundAttackersCount);
            workingUnits = result.units;
            if (!result.dodged) {
              const attackerSet = (lastRoundAttackersMap.get(target.id) ?? new Set<string>()) as Set<string>;
              attackerSet.add(actor.id);
              lastRoundAttackersMap.set(target.id, attackerSet);
            }
          } else {
            for (const [index, poleTarget] of poleTargets.entries()) {
              const extraPenalty = isPolearm ? index * 7 : 0;
              const perAttackTargets = isHeavyWeapon
                ? [
                    poleTarget,
                    ...workingUnits
                      .filter(
                        unit => unit.faction === targetFaction && unit.id !== poleTarget.id && isCombatReadyUnit(unit),
                      )
                      .slice(0, 1),
                  ]
                : [poleTarget];
              let allDodged = isHeavyWeapon;
              for (const [targetIndex, targetPick] of perAttackTargets.entries()) {
                const defenseSeq = defenderDefenseCount[targetPick.id] || 0;
                defenderDefenseCount[targetPick.id] = defenseSeq + 1;
                const result = applyAttack(
                  workingUnits,
                  actor,
                  targetPick,
                  defenseSeq,
                  logs,
                  lastRoundAttackersCount,
                  extraPenalty,
                  targetIndex,
                  perAttackTargets.length,
                  true,
                  prev.nonLethalActorIds,
                  activeWeapon,
                );
                workingUnits = result.units;
                if (!result.dodged) {
                  const attackerSet = (lastRoundAttackersMap.get(targetPick.id) ?? new Set<string>()) as Set<string>;
                  attackerSet.add(actor.id);
                  lastRoundAttackersMap.set(targetPick.id, attackerSet);
                }
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

      const friendAlive = workingUnits.some(unit => unit.faction === 'friendly' && isCombatReadyUnit(unit));
      const enemyAlive = workingUnits.some(unit => unit.faction === 'enemy' && isCombatReadyUnit(unit));
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

      const nextLastRoundAttackersCount = Object.fromEntries(
        Array.from(lastRoundAttackersMap.entries()).map(([targetId, attackers]) => [targetId, attackers.size]),
      ) as Record<string, number>;

      let previewUnits = workingUnits;
      const nextAiPlans: Record<string, AiDecision> = {};
      if (!result) {
        const nextTauntTargets: Record<string, string> = {};
        Object.entries(plannedActions).forEach(([actorId, action]) => {
          if (action.actionId === 'tactics' && action.tactic === 'taunt' && action.targetId) {
            const target = getUnit(previewUnits, action.targetId);
            const actor = getUnit(previewUnits, actorId);
            if (target && actor && isCombatReadyUnit(target) && isCombatReadyUnit(actor)) {
              nextTauntTargets[target.id] = actor.id;
            }
          }
        });

        previewUnits = previewUnits.map(unit => {
          if (!isCombatReadyUnit(unit)) return { ...unit, intent: undefined };

          if (unit.subFaction !== 'squad') {
            const tauntedBy = nextTauntTargets[unit.id];
            if (tauntedBy) {
              nextAiPlans[unit.id] = { actionId: 'attack', targetId: tauntedBy, reason: 'taunted_preview' };
              const taunter = getUnit(previewUnits, tauntedBy);
              return { ...unit, intent: taunter ? `攻击 ${taunter.name}` : '无有效目标' };
            }
            const decision = decideAiAction(unit, previewUnits, nextLastRoundAttackersCount);
            nextAiPlans[unit.id] = decision;
            return { ...unit, intent: getAiIntentLabel(decision, unit, previewUnits) };
          }

          const planned = plannedActions[unit.id];
          if (planned?.actionId === 'tactics') {
            if (planned.tactic === 'taunt') {
              const target = planned.targetId ? getUnit(previewUnits, planned.targetId) : null;
              return { ...unit, intent: target ? `嘲弄 ${target.name}` : '嘲弄失败' };
            }
            if (planned.tactic === 'medical' || planned.tactic === 'emergency_medical') {
              const target =
                selectedMedicalTargetId && getUnit(previewUnits, selectedMedicalTargetId)?.faction === 'friendly'
                  ? getUnit(previewUnits, selectedMedicalTargetId)
                  : unit;
              return {
                ...unit,
                intent:
                  planned.tactic === 'emergency_medical'
                    ? `紧急医治 ${(target || unit).name}`
                    : `医疗 ${(target || unit).name}`,
              };
            }
            if (planned.tactic === 'defense') return { ...unit, intent: '防御' };
            if (planned.tactic === 'escape') return { ...unit, intent: '逃跑' };
          }

          if (planned?.actionId === 'subdue') {
            const target = planned.targetId
              ? getUnit(previewUnits, planned.targetId)
              : pickRandomTarget(previewUnits, 'enemy');
            return { ...unit, intent: target ? `制服 ${target.name}` : '无有效目标' };
          }

          const target = planned?.targetId
            ? getUnit(previewUnits, planned.targetId)
            : pickRandomTarget(previewUnits, 'enemy');
          return { ...unit, intent: target ? `攻击 ${target.name}` : '无有效目标' };
        });
      }

      return {
        round: prev.round + 1,
        units: previewUnits,
        logs: [...prev.logs, ...logs],
        result,
        endReason: result ? 'normal' : prev.endReason,
        lastRoundAttackersCount: nextLastRoundAttackersCount,
        nonLethalActorIds: prev.nonLethalActorIds,
        aiPlans: result ? prev.aiPlans : nextAiPlans,
        playerEmergencyMedicalCooldown:
          plannedActions[playerId]?.actionId === 'tactics' && plannedActions[playerId]?.tactic === 'emergency_medical'
            ? 1
            : Math.max(0, (prev.playerEmergencyMedicalCooldown || 0) - 1),
      };
    });
  };

  const handleActionClick = (action: ActionType) => {
    if (action.id === 'end_round') {
      if (!showCurrentRoundOnly) pendingScrollToBottomRef.current = true;
      runRound();
      return;
    }
    planAction(action.id);
  };

  const handleCopyLogs = async () => {
    const buildStatusLabel = (unit: BattleCharacter) => {
      if (unit.escaped) return '已逃跑';
      if (unit.state === '已被制服') return '【被制服】';
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
      unit => unit.faction === 'friendly' && !unit.escaped && (unit.subFaction === 'squad' || unit.id === playerId),
    );
    const perMemberExp = expReceivers.length > 0 ? Math.round(totalExp) : 0;
    const expMap = new Map<string, number>();
    expReceivers.forEach(unit => {
      expMap.set(unit.id, perMemberExp);
    });

    const damageDealtMap = new Map<string, number>();
    const killMap = new Map<string, number>();
    const lastAttackerByTarget = new Map<string, string>();

    battleState.logs.forEach(line => {
      const hit = line.match(/^([^:：]+)[:：]\s*命中([^（(，,：:]+).*?造成\s*(\d+)\s*伤害/);
      if (hit) {
        const attackerName = (hit[1] || '').trim();
        const defenderName = (hit[2] || '').trim();
        const dmg = Number(hit[3] || 0);
        if (attackerName) {
          damageDealtMap.set(attackerName, (damageDealtMap.get(attackerName) || 0) + (Number.isFinite(dmg) ? dmg : 0));
        }
        if (attackerName && defenderName) {
          lastAttackerByTarget.set(defenderName, attackerName);
        }
        return;
      }
      const death = line.match(/^([^:：]+)[:：].*确认死亡/);
      if (death) {
        const deadName = (death[1] || '').trim();
        const killer = deadName ? lastAttackerByTarget.get(deadName) : undefined;
        if (killer) {
          killMap.set(killer, (killMap.get(killer) || 0) + 1);
        }
      }
    });

    const moodRewardMap: Partial<Record<BattleOutcome, number>> = {
      酣畅大胜: 150,
      略处上风: 130,
      血战险胜: 110,
      史诗大捷: 200,
    };
    const baseMoodReward = moodRewardMap[displayOutcome] ?? 0;
    const getMoodRewardForUnit = (unit: BattleCharacter) => {
      if (baseMoodReward <= 0) return 0;
      if (unit.faction !== 'friendly') return 0;
      if (unit.escaped) return Math.round(baseMoodReward / 2);
      return baseMoodReward;
    };

    const summarizeUnit = (unit: BattleCharacter) => {
      const baseHp = Number.isFinite(unit.startHp) ? unit.startHp : unit.hp;
      const rawDamageTaken = Math.max(0, Math.round(baseHp - unit.hp));
      const currentHp = Math.max(0, Math.round(unit.hp));
      const traumaLabel = getTraumaDetailLabel(unit);
      const expText = expMap.has(unit.id) ? `，获得${expMap.get(unit.id)}经验` : '';
      const dealtDamage = Math.max(0, Math.round(damageDealtMap.get(unit.name) || 0));
      const killCount = Math.max(0, Math.round(killMap.get(unit.name) || 0));
      const combatStatText = `，造成伤害${dealtDamage}，击杀${killCount}`;
      const consumedMedicalText = (() => {
        const escapedName = _.escapeRegExp(unit.name);
        const usage = battleState.logs.reduce<Record<string, number>>((acc, line) => {
          const m = line.match(new RegExp(`^${escapedName}:\\s*对.+?使用(.+?)(?:，|,|。|$)`));
          if (!m) return acc;
          const itemName = (m[1] || '').trim();
          if (!itemName) return acc;
          acc[itemName] = (acc[itemName] || 0) + 1;
          return acc;
        }, {});
        const entries = Object.entries(usage);
        if (entries.length === 0) return '';
        return `，消耗了${entries.map(([name, count]) => `${name}X${count}`).join('，')}`;
      })();
      const totalHealed = (() => {
        const escapedName = _.escapeRegExp(unit.name);
        let healed = 0;
        for (const line of battleState.logs) {
          const m = line.match(new RegExp(`^${escapedName}:.+?恢复([0-9]+(?:\\.[0-9]+)?)血量`));
          if (!m) continue;
          healed += Number(m[1]) || 0;
        }
        return healed;
      })();
      const netDamageTaken = Math.max(0, rawDamageTaken - totalHealed);
      const healedOverflow = Math.max(0, totalHealed - rawDamageTaken);
      const displayDamageTaken = Number.isInteger(netDamageTaken) ? netDamageTaken : _.round(netDamageTaken, 2);
      const displayHealedOverflow = Number.isInteger(healedOverflow) ? healedOverflow : _.round(healedOverflow, 2);
      const damageTakenText = `受到伤害${displayDamageTaken}`;
      const healedOverflowText = healedOverflow > 0 ? `，恢复${displayHealedOverflow}血量` : '';
      const moodReward = getMoodRewardForUnit(unit);
      const moodText = moodReward > 0 ? `，心情+${moodReward}` : '';
      return `${unit.name}: ${damageTakenText}, 当前血量${currentHp}, 创伤(${traumaLabel}), 状态${buildStatusLabel(unit)}${combatStatText}${expText}${consumedMedicalText}${healedOverflowText}${moodText}`;
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

    const summary = `【战斗总结】\n\n【${outcome}】：${outcomeDescription}\n\n我方：\n${friendLines || '无'}\n\n敌方：\n${enemyLines || '无'}\n\n请根据以上战后内容，描写述说这一战斗过程，不要在正文出现数值相关内容，这场战斗我方【${outcome}】`;

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
    if ((unit.fractureStacks || 0) > 0) states.push(`骨折${unit.fractureStacks}`);
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
            <div className="pt-1">主武器</div>
            <div>名称：{character.weapon.name}</div>
            <div>类型：{character.weapon.type}</div>
            <div>伤害骰：{character.weapon.damageDice}</div>
            <div>伤害类型：{character.weapon.damageType || '未定义'}</div>
            {character.subWeapon.type !== '无' ? (
              <>
                <div className="pt-2 border-t border-stone-800/50">副武器</div>
                <div>名称：{character.subWeapon.name}</div>
                <div>类型：{character.subWeapon.type}</div>
                <div>伤害骰：{character.subWeapon.damageDice}</div>
                <div>伤害类型：{character.subWeapon.damageType || '未定义'}</div>
              </>
            ) : null}
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
    <div
      className={`w-full h-[100dvh] min-h-[100dvh] lg:h-auto lg:min-h-0 lg:aspect-[16/9] bg-[#050505] text-stone-300 font-sans selection:bg-stone-700 selection:text-white flex flex-col relative overflow-hidden ${
        isMobile && isFullscreen ? 'pb-[124px]' : 'pb-[88px]'
      } lg:pb-0`}
    >
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
              {loading ? '重试中...' : '删除此消息，重新点击战斗栏，多试几次，我为此感到很抱歉'}
            </button>
          </div>
        </div>
      )}

      <header className="relative z-20 px-3 py-2.5 lg:px-8 lg:py-5 border-b border-stone-800/40 bg-black/40 backdrop-blur-md flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-sm border border-stone-700/50 flex items-center justify-center bg-stone-900/80 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            <Sword size={14} className="text-stone-400 lg:w-4 lg:h-4" />
          </div>
          <div className="text-xl lg:text-2xl font-serif text-stone-200 tracking-[0.15em] lg:tracking-[0.25em] text-shadow-glow">
            终末之诗
          </div>
        </div>
        <div className="flex items-center gap-2 lg:gap-6 shrink-0">
          <div className="text-sm lg:text-lg font-serif text-stone-400 tracking-widest border-l border-stone-800 pl-3 lg:pl-6 flex items-center gap-1 lg:gap-2 relative shrink-0 whitespace-nowrap">
            回合数
            <span className="text-stone-200 font-mono text-xl lg:text-2xl">
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
        {(targetingMode === 'attack' || targetingMode === 'subdue') && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="absolute left-0 top-0 h-full w-[28%] min-w-[300px] bg-black/50" />
          </div>
        )}
        <div
          className="order-1 lg:order-none shrink-0 min-h-[156px] lg:min-h-0 w-full lg:w-[28%] lg:min-w-[300px] p-2.5 lg:p-6 overflow-x-auto overflow-y-visible lg:overflow-x-hidden lg:overflow-y-auto border-b border-stone-800/30 lg:border-b-0 lg:border-r lg:border-stone-800/30 bg-gradient-to-r from-black/80 to-transparent scrollbar-hide flex flex-col min-h-0 overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
        >
          <div className="flex items-center justify-between mb-3 lg:mb-6 pb-2 border-b border-stone-800/50">
            <h2 className="text-sm font-serif text-stone-400 tracking-[0.2em] flex items-center gap-3">
              <div className="w-1.5 h-4 bg-blue-600 rounded-sm shadow-[0_0_10px_rgba(37,99,235,0.8)]"></div>
              友方阵营
            </h2>
            <span className="text-xs font-mono text-stone-600">
              {friendlyAliveCount}/{friendlyUnits.length} 单位
            </span>
          </div>
          <div className="flex flex-row lg:flex-col gap-3 lg:gap-4 flex-1 min-w-max lg:min-w-0 pb-1 lg:pb-0">
            {friendlyUnits.map(unit => (
              <CharacterCard
                key={unit.id}
                character={unit}
                isExpanded={expandedCharId === unit.id}
                isSelected={medicalSelecting ? selectedMedicalTargetId === unit.id : selectedActorId === unit.id}
                nonLethalEnabled={battleState.nonLethalActorIds.includes(unit.id)}
                onToggle={() => handleToggleExpand(unit.id)}
                onSelect={() => {
                  if (medicalSelecting) {
                    if (!unit.escaped) {
                      setSelectedMedicalTargetId(unit.id);
                      const actorId = medicalActorId || selectedActorId || playerId;
                      const plannedTactic = actorId ? plannedActions[actorId]?.tactic : null;
                      if (actorId) {
                        updateUnitIntent(
                          actorId,
                          plannedTactic === 'emergency_medical' ? `紧急医治 ${unit.name}` : `医疗 ${unit.name}`,
                        );
                      }
                      setMedicalSelecting(false);
                      if (plannedTactic === 'emergency_medical') {
                        setMedicalItemSelecting(false);
                      } else {
                        setMedicalItemSelecting(true);
                      }
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

        <div
          className={`order-2 lg:order-none flex flex-col relative ${
            isMobile && mobileLogCollapsed
              ? 'flex-none h-[44px] min-h-0 px-2.5 pb-1'
              : mobileDetailExpanded
                ? 'flex-none h-[136px] min-h-0 p-2.5'
                : isMobile
                  ? 'flex-none h-[180px] min-h-0 p-2.5'
                  : 'flex-1 min-h-0 p-2.5 lg:p-8'
          }`}
        >
          {isMobile && mobileLogCollapsed ? (
            <button
              type="button"
              aria-label="关闭隐藏战斗日志"
              onClick={() => setMobileLogCollapsed(false)}
              className="relative z-10 h-full w-full rounded-sm border border-stone-800/50 bg-stone-950/70 text-center text-xs font-mono tracking-[0.2em] text-stone-400 transition-colors hover:text-stone-200 hover:border-stone-600/60"
            >
              【关闭隐藏】
            </button>
          ) : (
            <>
              <div className="absolute inset-0 bg-stone-950/40 backdrop-blur-sm m-2.5 lg:m-8 rounded-sm border border-stone-800/40 shadow-[inset_0_0_60px_rgba(0,0,0,0.8)]"></div>

              <button
                type="button"
                aria-label="隐藏战斗日志"
                onClick={() => setMobileLogCollapsed(true)}
                className={`${isMobile ? 'grid' : 'hidden'} absolute right-2 top-2 z-30 min-w-[72px] h-8 rounded-sm border border-stone-700/70 bg-black/60 px-2 text-[11px] font-mono tracking-[0.18em] text-stone-200 hover:bg-black/80 active:bg-black/90 transition-colors place-items-center shadow-[0_0_18px_rgba(0,0,0,0.6)]`}
              >
                隐藏日志
              </button>

              <div
                ref={logScrollRef}
                className={`relative z-10 flex-1 overflow-y-auto font-serif text-base leading-[1.8] text-stone-300 space-y-3 scrollbar-hide overscroll-contain ${
                  mobileDetailExpanded ? 'p-3' : 'p-6 lg:p-10'
                }`}
                style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
              >
                <div
                  className={`flex items-center justify-center gap-2.5 ${mobileDetailExpanded ? 'mb-2' : 'mb-4 lg:mb-6'}`}
                >
                  <span className="inline-block px-4 py-1 border border-stone-800/60 rounded-sm text-xs font-mono text-stone-500 tracking-widest bg-stone-900/30">
                    战斗日志
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCurrentRoundOnly(prev => !prev)}
                    className="px-3 py-1 border border-stone-800/70 rounded-sm text-[11px] font-mono text-stone-400 bg-stone-900/40 hover:text-stone-200 hover:border-stone-600/70 transition-colors"
                  >
                    {showCurrentRoundOnly ? '显示全部' : '显示当前回合'}
                  </button>
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
                      {loading ? '重试中...' : '删除此消息，重新点击战斗栏，多试几次，我为此感到很抱歉'}
                    </button>
                  </div>
                ) : displayedLogs.length === 0 ? (
                  <div
                    className={`text-center text-stone-500 font-mono ${mobileDetailExpanded ? 'text-xs' : 'text-sm'}`}
                  >
                    等待你的指令...
                  </div>
                ) : (
                  <div
                    className={`space-y-2 font-mono whitespace-pre-wrap ${mobileDetailExpanded ? 'text-xs leading-6' : 'text-sm'}`}
                  >
                    {displayedLogs.map((line, index) => {
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
            </>
          )}
        </div>

        <div
          className={`order-3 lg:order-none w-full lg:w-[28%] lg:min-w-[300px] p-2.5 lg:p-6 border-t border-stone-800/30 lg:border-t-0 lg:border-l lg:border-stone-800/30 bg-gradient-to-l from-black/80 to-transparent scrollbar-hide flex flex-col min-h-0 overscroll-contain ${
            mobileLogCollapsed
              ? 'flex-1 min-h-0 overflow-x-hidden overflow-y-auto'
              : mobileDetailExpanded
                ? 'flex-none h-auto max-h-[52dvh] overflow-x-hidden overflow-y-auto'
                : isMobile
                  ? 'shrink-0 min-h-[156px] overflow-x-auto overflow-y-visible'
                  : 'shrink-0 h-[72px] lg:h-auto lg:min-h-0 overflow-x-auto overflow-y-visible lg:overflow-x-hidden lg:overflow-y-auto'
          }`}
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: mobileLogCollapsed || mobileDetailExpanded ? 'pan-y' : 'pan-x',
          }}
        >
          <div className="flex items-center justify-between mb-3 lg:mb-6 pb-2 border-b border-stone-800/50">
            <span className="text-xs font-mono text-stone-600">
              {enemyAliveCount}/{enemyUnits.length} 单位
            </span>
            <h2 className="text-sm font-serif text-stone-400 tracking-[0.2em] flex items-center gap-3">
              敌方阵营
              <div className="w-1.5 h-4 bg-red-600 rounded-sm shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
            </h2>
          </div>
          <div
            className={`flex flex-row lg:items-stretch lg:flex-col gap-3 min-w-max lg:min-w-0 pb-1 lg:pb-0 ${
              mobileBottomExpanded || isMobile ? 'items-start content-start lg:gap-4' : 'flex-1 items-end lg:gap-4'
            }`}
          >
            {enemyUnits.map(unit => (
              <CharacterCard
                key={unit.id}
                character={unit}
                isExpanded={expandedCharId === unit.id}
                isSelected={selectedTargetId === unit.id || (!!targetingMode && attackSelectionIds.includes(unit.id))}
                nonLethalEnabled={false}
                onToggle={() => handleToggleExpand(unit.id)}
                onSelect={() => {
                  setSelectedTargetId(unit.id);
                  if (targetingMode === 'attack' || targetingMode === 'subdue') {
                    const actorId = selectedActorId || playerId;
                    const actor = actorId ? getUnit(battleState.units, actorId) : null;
                    if (
                      actorId &&
                      actor &&
                      actor.subFaction === 'squad' &&
                      isCombatReadyUnit(actor) &&
                      isCombatReadyUnit(unit)
                    ) {
                      if (targetingMode === 'subdue') {
                        setPlannedActions(prev => ({
                          ...prev,
                          [actorId]: { actionId: 'subdue', targetId: unit.id },
                        }));
                        updateUnitIntent(actorId, `制服 ${unit.name}`);
                        setTargetingMode(null);
                        setAttackSelectionIds([]);
                        setAttackSelectionActorId(null);
                      } else if (/长柄/.test(actor.weapon.type)) {
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
            {enemyUnits.length === 0 && enemyAliveCount === 0 ? (
              <div className="w-full min-w-[74vw] max-w-[320px] lg:min-w-0 lg:max-w-none rounded-sm border border-red-800/60 bg-red-950/25 px-3 py-4 text-center font-mono text-xs leading-relaxed text-red-200 shadow-[0_0_20px_rgba(220,38,38,0.25)]">
                <span>【请查看状态栏“视野”是否有“</span>
                <span className="text-red-400 font-semibold">敌对立场</span>
                <span>”】</span>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-30 lg:relative lg:bottom-auto lg:left-auto lg:right-auto border-t border-stone-800/50 bg-black/92 backdrop-blur-xl pb-[min(max(env(safe-area-inset-bottom),0px),8px)] shadow-[0_-8px_24px_rgba(0,0,0,0.65)]">
        <div
          className={`w-full px-2 py-2 lg:px-4 lg:py-4 ${
            isMobile && isFullscreen
              ? 'grid grid-cols-12 gap-2'
              : 'flex items-center justify-center gap-2 lg:gap-6 overflow-x-auto scrollbar-hide'
          } lg:flex lg:items-center lg:justify-center lg:gap-6`}
        >
          <div className={`relative ${isMobile && isFullscreen ? 'col-[1/4] row-[1/2]' : 'shrink-0'}`}>
            <button
              onClick={() => setNonLethalMenuOpen(!nonLethalMenuOpen)}
              className={`group relative flex flex-col items-center justify-center h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-sm border bg-stone-900/40 backdrop-blur-md transition-all duration-300 text-fuchsia-300 border-fuchsia-900/50 hover:bg-fuchsia-950/40 hover:border-fuchsia-500/50 group-hover:shadow-[0_0_20px_rgba(217,70,239,0.3)] overflow-hidden ${
                isMobile && isFullscreen ? 'w-full' : 'w-16 shrink-0'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-30 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-30 group-hover:opacity-100 transition-opacity"></div>
              <Shield
                size={22}
                className="mb-2 sm:mb-3 group-hover:-translate-y-1 group-hover:scale-110 transition-transform duration-300"
              />
              <span className="text-[11px] sm:text-sm font-serif tracking-[0.15em]">非致命</span>
            </button>
            {nonLethalMenuOpen && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded-sm border border-stone-700/60 bg-stone-900/95 shadow-[0_0_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden">
                <div className="p-2 space-y-1">
                  <div className="text-xs font-mono text-stone-400 px-3 py-2 border-b border-stone-800/60">
                    非致命模式
                  </div>
                  <button
                    onClick={() => {
                      setBattleState(prev => ({
                        ...prev,
                        nonLethalActorIds: prev.units.filter(unit => unit.faction === 'friendly').map(unit => unit.id),
                      }));
                      setNonLethalMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-sm text-sm font-mono ${
                      battleState.nonLethalActorIds.length > 0 &&
                      friendlyUnits.length > 0 &&
                      friendlyUnits.every(unit => battleState.nonLethalActorIds.includes(unit.id))
                        ? 'text-emerald-300 bg-emerald-900/30'
                        : 'text-stone-300 hover:bg-stone-800/60'
                    }`}
                  >
                    所有友方成员开启
                  </button>
                  <button
                    onClick={() => {
                      const actorId = selectedActorId || playerId;
                      if (!actorId) return;
                      setBattleState(prev => {
                        const next = new Set(prev.nonLethalActorIds);
                        next.add(actorId);
                        return { ...prev, nonLethalActorIds: Array.from(next) };
                      });
                      setNonLethalMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-sm text-sm font-mono ${
                      (() => {
                        const actorId = selectedActorId || playerId;
                        return !!actorId && battleState.nonLethalActorIds.includes(actorId);
                      })()
                        ? 'text-emerald-300 bg-emerald-900/30'
                        : 'text-stone-300 hover:bg-stone-800/60'
                    }`}
                  >
                    当前角色开启
                  </button>
                  <button
                    onClick={() => {
                      const actorId = selectedActorId || playerId;
                      if (!actorId) return;
                      setBattleState(prev => ({
                        ...prev,
                        nonLethalActorIds: prev.nonLethalActorIds.filter(id => id !== actorId),
                      }));
                      setNonLethalMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-sm text-sm font-mono ${
                      (() => {
                        const actorId = selectedActorId || playerId;
                        return !!actorId && !battleState.nonLethalActorIds.includes(actorId);
                      })()
                        ? 'text-emerald-300 bg-emerald-900/30'
                        : 'text-stone-300 hover:bg-stone-800/60'
                    }`}
                  >
                    当前角色关闭
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            ref={autoSelectRef}
            onClick={autoSelectTargets}
            className={`group relative flex flex-col items-center justify-center h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-sm border bg-stone-900/40 backdrop-blur-md transition-all duration-300 text-amber-300 border-amber-900/50 hover:bg-amber-950/40 hover:border-amber-500/50 group-hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] overflow-hidden ${
              isMobile && isFullscreen ? 'w-full col-[4/7] row-[1/2]' : 'w-16 shrink-0'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-30 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-30 group-hover:opacity-100 transition-opacity"></div>
            <Crosshair
              size={22}
              className="mb-2 sm:mb-3 group-hover:-translate-y-1 group-hover:scale-110 transition-transform duration-300"
            />
            <span className="text-[11px] sm:text-sm font-serif tracking-[0.15em]">自动选择</span>
          </button>
          {actions.map(action => (
            <button
              key={action.id}
              ref={el => {
                actionButtonRefs.current[action.id] = el;
              }}
              onClick={() => handleActionClick(action)}
              className={`group relative flex flex-col items-center justify-center h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-sm border bg-stone-900/40 backdrop-blur-md transition-all duration-300 ${action.color} ${action.glow} overflow-hidden ${
                isMobile && isFullscreen ? 'w-full' : 'w-16 shrink-0'
              }`}
              style={
                isMobile && isFullscreen
                  ? action.id === 'attack'
                    ? { gridColumn: '1 / 5', gridRow: '2 / 3' }
                    : action.id === 'tactics'
                      ? { gridColumn: '5 / 9', gridRow: '2 / 3' }
                      : action.id === 'end_round'
                        ? { gridColumn: '9 / 13', gridRow: '2 / 3' }
                        : action.id === 'auto'
                          ? { gridColumn: '4 / 7', gridRow: '1 / 2' }
                          : action.id === 'subdue'
                            ? { gridColumn: '7 / 10', gridRow: '1 / 2' }
                            : action.id === 'surrender'
                              ? { gridColumn: '10 / 13', gridRow: '1 / 2' }
                              : { gridColumn: '1 / 4', gridRow: '1 / 2' }
                  : undefined
              }
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-30 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-30 group-hover:opacity-100 transition-opacity"></div>

              <action.icon
                size={22}
                className="mb-2 sm:mb-3 group-hover:-translate-y-1 group-hover:scale-110 transition-transform duration-300"
              />
              <span className="text-[11px] sm:text-sm font-serif tracking-[0.15em]">{action.label}</span>
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
      {battleNotice && (
        <div className="pointer-events-none fixed left-1/2 top-24 z-50 -translate-x-1/2 px-4">
          <div
            className={`rounded-sm border px-5 py-3 text-center font-serif text-sm tracking-[0.12em] shadow-[0_0_30px_rgba(0,0,0,0.45)] backdrop-blur-md animate-fade-in-up ${
              battleNotice.tone === 'rose'
                ? 'border-rose-700/40 bg-rose-950/25 text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-rose-400 to-orange-300'
                : 'border-amber-700/40 bg-amber-950/20 text-transparent bg-clip-text bg-gradient-to-r from-stone-100 via-amber-300 to-yellow-200'
            }`}
          >
            {battleNotice.text}
          </div>
        </div>
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
                嘲弄：强制选中的敌人攻击我，格挡值+12，本回合不攻击
              </button>
              <button
                onClick={() => applyTactic('defense')}
                className="w-full text-left px-4 py-2 border border-stone-700/60 rounded-sm hover:bg-stone-800/60"
              >
                防御：格挡基础+18，本回合不攻击
              </button>
              <button
                onClick={() => applyTactic('medical')}
                className="w-full text-left px-4 py-2 border border-stone-700/60 rounded-sm hover:bg-stone-800/60"
              >
                医疗：选择目标与物品
              </button>
              <button
                onClick={() => applyTactic('emergency_medical')}
                className="w-full text-left px-4 py-2 border border-stone-700/60 rounded-sm hover:bg-stone-800/60"
              >
                紧急手动医治：恢复量=智力*0.4+1D智力
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
                MEDICAL_ITEM_NAMES.forEach(name => {
                  if (hasItem(name)) list.push(name);
                });
                Object.entries(items).forEach(([name, item]) => {
                  if (list.includes(name)) return;
                  if (isMedicalBackpackItem(name, item) && hasItem(name)) {
                    list.push(name);
                  }
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
