import {
  Activity,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  Shield,
  Sparkles,
  Upload,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
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
  will: { label: '韧性', icon: Sparkles, desc: '增加伤害减免与战斗承受力' },
  intelligence: { label: '智力', icon: Sparkles, desc: '影响科研速度和医疗效率' },
  charisma: { label: '魅力', icon: Activity, desc: '影响交易价格和招募成功率' },
};

const TOTAL_ATTRIBUTE_POINTS = 168;
const SKELETON_ATTRIBUTE_POINTS = 144;
const ATTRIBUTE_MIN = 1;
const ATTRIBUTE_MAX = Number.POSITIVE_INFINITY;
const GOD_MODE_ATTRIBUTE_MAX = 130;
const GOD_MODE_MIN_LEVEL = 1;
const GOD_MODE_MAX_LEVEL = 100;
const GOD_MODE_POINTS_PER_LEVEL = 5;
const SQUAD_LEVEL_POINTS_PER_LEVEL = 5;
const CONTINUOUS_STEP_INTERVAL = 35;
const CONTINUOUS_TICK_INTERVAL = 90;
const CONTINUOUS_START_DELAY = 120;
const CONTINUOUS_MAX_BATCH_STEPS = 3;

const SCENARIO_START_LEVELS: Record<string, number> = {
  monster_hunter: 30,
  apex_hunter: 40,
  officer_son: 20,
  holy_crusade: 20,
  false_savior: 30,
};

const getDefaultHeightByRaceSubrace = (raceId: string, subraceId: string) => {
  if (raceId === 'ailu' || subraceId === 'ailu' || subraceId === 'ailu_folk') return 100;
  if (subraceId === 'ratfolk') return 140;
  return 175;
};

const SCENARIO_EXCLUSIVE_TRAITS: Record<
  string,
  { name?: string; description?: string; traits?: Array<{ name: string; description: string }> }
> = {
  monster_hunter: {
    name: '怪物猎人',
    description: '你对巨兽怀有近乎本能的战意，不会因其压迫感而退缩，并且更容易捕捉到它们留下的踪迹。',
  },
  slave_master: {
    name: '奴隶主',
    description: '你深谙驱使与驯化他人的手段，对脏乱贫苦的难民群体抱有天然的轻蔑与疏离。',
  },
  heretic_fire: {
    name: '异端之火',
    description:
      '你见证过异族被人类文明猎杀、奴役与羞辱的惨剧。如今远古血盟接纳了你，复仇信念让你面对人类势力时更加冷硬而决绝。',
  },
  officer_son: {
    name: '贵族之子',
    description: '旧日门第的烙印仍在你身上，言行举止间总会不自觉流露出贵族式的习惯与傲气。',
  },
  apex_hunter: {
    name: '顶级猎手',
    description: '长期浸泡于血与火的厮杀中，你的情绪不会被外界撼动，并在战斗中感到近乎兴奋的愉悦。',
  },
  holy_commoner: {
    name: '圣民',
    description: '你对外界的认知几乎都来自圣国祭司的教导，未知之地在你眼中既危险又充满不可名状的威胁。',
  },
  holy_crusade: {
    traits: [
      {
        name: '奥克兰赐福',
        description: '奥克兰赐福了你，你十分厌恶那些异种和异端，生理和心理的双重恶心，杀了他们你才能心情愉悦。',
      },
      {
        name: '圣言',
        description: '奥克兰赐福了你，你具有洗脑能力，能够将那群定力不足的迷茫之徒让其听信于你，让其为你献上一切。',
      },
    ],
  },
};

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
  韧性: 'will',
  智力: 'intelligence',
  魅力: 'charisma',
};

const UNKNOWN_DREAM_SCENARIO_ID = 'unknown_dream';
const UNKNOWN_DREAM_UID = 595473;
const UTILITY_TOOL_OPTIONS = [
  {
    key: 'bugModeUid881',
    label: 'BUG模式',
    uid: 944141,
    description:
      '怎么欢乐怎么来，没有bug就捏造bug，把所有游戏bug都可以套过来，即“万物皆可BUG，特性无处不在”，请拥抱混乱。',
  },
  {
    key: 'machineTranslationWorldUid882',
    label: '机翻大世界',
    uid: 697213,
    description:
      '欢迎来到“机翻大世界”！本世界的所有语言协议均已损坏。所有对话、描述和名称都经过了一个极其廉价且充满错误的翻译软件进行处理。NPC们认为自己说话很正常，但实际上……祝你好运。',
  },
  {
    key: 'customCharacterNameUid883',
    label: '自定义角色名字',
    uid: 202872,
    description: '我希望这些角色名字，可以作为随机npc随机的出现在这个世界里，属性随机，种族随机。',
  },
  {
    key: 'threeKingdomsCharacterNameUid884',
    label: '三国角色名字',
    uid: 811397,
    description: '启用三国风格角色名字池。',
  },
  {
    key: 'celebrityCharacterNameUid885',
    label: '梁山好汉',
    uid: 437229,
    description: '启用梁山好汉风格角色名字池。',
  },
  {
    key: 'warhammerCharacterNameUid886',
    label: '战国七雄名字大全',
    uid: 88271,
    description: '启用战国七雄风格角色名字池。',
  },
  {
    key: 'cyberpunkCharacterNameUid887',
    label: '楚汉之争',
    uid: 131725,
    description: '启用楚汉之争风格角色名字池。',
  },
  {
    key: 'inflationUid889',
    label: '通货膨胀',
    uid: 54040,
    description:
      '世界经济数据库发生灾难性溢出。一个程序员在修改物价时，手滑多打了三个“0”。我们决定不修复它，并称之为“特色”。欢迎来到一个所有价格都上涨1000倍的废土。你问这合不合理？请看你的钱包，它非常不合理。',
  },
  {
    key: 'kenshiRandomNamesUid892',
    label: 'kenshi随机名字大全',
    uid: 890090,
    description: 'kenshiMOD的名字大全',
  },
] as const;
const UNKNOWN_DREAM_WEAPON_TYPES = ['武士刀类', '钝器类', '军刀类', '砍刀类', '长柄刀类', '大型类', '弓', '弩'];
const UNKNOWN_DREAM_ARMOR_TYPES = ['轻甲', '中甲', '重甲'];
const CHARACTER_TEMPLATE_VERSION = 1;
const CHARACTER_TEMPLATE_FILE_PREFIX = 'kenshi-character-template';

type CharacterTemplateData = Pick<
  CharacterData,
  | 'race'
  | 'subrace'
  | 'attributes'
  | 'name'
  | 'gender'
  | 'age'
  | 'appearance'
  | 'traits'
  | 'customTraitName'
  | 'customTraitDescription'
> & {
  raceTraitName?: string;
  raceTraitDescription?: string;
};

const sanitizeFilenamePart = (value: string) =>
  (value || '无名角色')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 40) || '无名角色';

const buildCharacterTemplatePayload = (template: CharacterTemplateData) => ({
  type: 'kenshi-character-template',
  version: CHARACTER_TEMPLATE_VERSION,
  savedAt: new Date().toISOString(),
  character: template,
});

const normalizeImportedTemplate = (raw: unknown): CharacterTemplateData => {
  const source =
    raw && typeof raw === 'object' && 'character' in raw && (raw as { character?: unknown }).character
      ? (raw as { character: unknown }).character
      : raw;

  if (!source || typeof source !== 'object') {
    throw new Error('invalid character template');
  }

  const value = source as Partial<CharacterTemplateData>;
  return {
    race: typeof value.race === 'string' ? value.race : '',
    subrace: typeof value.subrace === 'string' ? value.subrace : '',
    attributes: { ...INITIAL_ATTRIBUTES, ...(value.attributes ?? {}) },
    name: typeof value.name === 'string' ? value.name : '',
    gender: value.gender === 'female' || value.gender === 'other' ? value.gender : 'male',
    age: Math.max(1, Math.min(100, Number(value.age) || 25)),
    appearance: { ...INITIAL_APPEARANCE, ...(value.appearance ?? {}) },
    traits: Array.isArray(value.traits) ? value.traits.filter(item => typeof item === 'string') : [],
    customTraitName: typeof value.customTraitName === 'string' ? value.customTraitName : '',
    customTraitDescription: typeof value.customTraitDescription === 'string' ? value.customTraitDescription : '',
    raceTraitName: typeof value.raceTraitName === 'string' ? value.raceTraitName : '',
    raceTraitDescription: typeof value.raceTraitDescription === 'string' ? value.raceTraitDescription : '',
  };
};
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
- 最终伤害：切割伤害按DR结算后 + 钝伤×0.5。
- 肢体伤害：切割部分×1.2；钝伤部分先按×0.5参与总伤，再按肢体系数×1。

军刀：
- 主武器为军刀类时，“武器格挡”基础值+12。
- 副武器为军刀类时，“武器格挡”基础值+6（可与主武器加成叠加，最高+18）。
- 基础攻速为2。
- 最终伤害：切割伤害按DR结算后 + 钝伤×0.6。
- 肢体伤害：切割部分×1.2；钝伤部分先按×0.6参与总伤，再按肢体系数×1。

砍刀：
- 无视对方7点DR。
- 基础攻速为2。
- 攻击检定大成功（93-100）时触发“破甲”：目标DR降低8（可叠加，对该目标全局生效）。
- 最终伤害：切割伤害按“DR-7”结算后 + 钝伤×0.7。
- 肢体伤害：切割部分×1.4；钝伤部分先按×0.7参与总伤，再按肢体系数×1。

长柄类：
- 每次攻击时可选择最多3个敌人进行攻击检定；每多一个目标，攻击检定-5。
- 基础攻速为2。
- 多目标时：第一个目标按格挡逻辑结算，后续目标按闪避逻辑结算。
- 最终伤害：切割伤害按DR结算后 + 钝伤×0.6。
- 肢体伤害：切割部分×1.2；钝伤部分先按×0.6参与总伤，再按肢体系数×1。

钝器：
- 基础攻速为1。
- 攻击检定大成功（93-100）时，目标必定获得1层“骨折”；每层骨折使力量/敏捷-10、逃跑检定-15（可叠加，直到夹板包清除）。
- 最终伤害：切割伤害按DR结算后 + 钝伤×1。
- 肢体伤害：切割部分×1.2；钝伤部分先按×1参与总伤，再按肢体系数×1.4。

大型武器：
- 每次攻击时对2个敌人进行攻击检定。
- 基础攻速为1。
- 攻击检定大失败（90-100）或两名目标均被【闪避】时，进入失衡，防御检定-15。
- 最终伤害：切割伤害按DR结算后 + 钝伤×0.7。
- 肢体伤害：切割部分×1.2；钝伤部分先按×0.7参与总伤，再按肢体系数×1。

弩：
- 基础效果：无视对方7点DR。
- 基础攻速为1。
- 大失败不会触发反击，而是误伤队友。
- 最终伤害：切割伤害按“DR-7”结算后 + 钝伤×1.4。
- 若变量里未单独配置伤害比例，则按默认切割50% / 钝伤50%计算；即 最终伤害 = （总伤害×0.5 - 有效DR，最低为0） + 总伤害×0.5×1.4。
- 肢体伤害：切割部分×1.2；钝伤部分先按×1.4参与总伤，再按肢体系数×1。

弓：
- 基础攻速为2。
- 大失败不会触发反击，而是误伤队友。
- 当弓/弩作为主武器且无副武器时，防御时只能闪避不能格挡；若有副武器则可正常防御。
- 对弓/弩攻击只能闪避，无法格挡。
- 最终伤害：切割伤害按DR结算后 + 钝伤×0.7。
- 若变量里未单独配置伤害比例，则按默认切割50% / 钝伤50%计算。
- 肢体伤害：切割部分×1.2；钝伤部分先按×0.7参与总伤，再按肢体系数×1。

武术：
- 识别种类为“武术”。
- 速度型（DEX>=STR）：基础攻速3；大成功区间93-100，触发额外攻击2次。
- 重击型（STR>DEX）：基础攻速2；无视5点DR；大成功区间93-100，伤害x2.2。
- 两种武术的伤害比例均沿用变量中的伤害比例。
- 默认最终伤害：若变量未配置伤害比例，则按切割50% / 钝伤50%计算；速度型按DR正常结算，重击型按“DR-5”结算；钝伤倍率为0.7。
- 默认肢体伤害：切割部分×1.2；钝伤部分先按×0.7参与总伤，再按肢体系数×1。
- 大失败与其他武器一致。`,
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

  const getRaceExclusiveTraits = React.useCallback((raceId: string, subraceId: string) => {
    const traits: Array<{ title: string; description: string }> = [];

    if (raceId === 'west_hive') {
      traits.push(
        { title: '脆弱肢体', description: '十分灵敏但肢体在战斗中更容易受损' },
        { title: '经商头脑', description: '对于交易更敏感，不愿吃亏' },
      );
    }

    if (raceId === 'xeno_hive') {
      traits.push(
        { title: '脆弱肢体', description: '十分灵敏但肢体在战斗中更容易受损' },
        { title: '坚韧虫壳', description: '暗紫色表壳比普通蜂巢族更坚硬，更能承受正面冲击。' },
      );
    }

    if (raceId === 'south_hive') {
      traits.push(
        { title: '脆弱肢体', description: '十分灵敏但肢体在战斗中更容易受损' },
        { title: '战斗狂热', description: '对厮杀、战斗、入侵更有本能倾向' },
      );
    }

    if (raceId === 'dark_hive') {
      traits.push(
        { title: '脆弱肢体', description: '十分灵敏但肢体在战斗中更容易受损' },
        { title: '古老基因', description: '更善于与队友进行配合作战' },
      );
    }

    if (subraceId === 'greenlander') {
      traits.push({ title: '快速学习', description: '学习能力强，能够快速补足短板' });
    }

    if (subraceId === 'scorchlander') {
      traits.push({ title: '自由者', description: '天生不喜欢被约束，向往自由' });
    }

    if (subraceId === 'keter_descendant') {
      traits.push({ title: '种族歧视', description: '难以信任其他种族，只相信人类' });
    }

    if (subraceId === 'narko_child') {
      traits.push({ title: '诅咒血脉', description: '外貌和体液即是神赐也是罪孽的导火索' });
    }

    if (subraceId === 'hive_prince') {
      traits.push({ title: '天生领袖', description: '更擅长协调、组织与理解复杂局势做出对策。' });
    }

    if (subraceId === 'hive_worker') {
      traits.push({ title: '劳作本能', description: '服从、执行、忍耐，已经刻入血液中，更为坚强。' });
    }

    if (subraceId === 'hive_soldier') {
      traits.push({ title: '士兵', description: '相对于其他亚种战斗能力更出色' });
    }

    if (raceId === 'shek') {
      traits.push({ title: '骨板护体', description: '天然的骨板赐予你防御能力同时也影响了灵敏能力' });
    }

    if (subraceId === 'shek_royal') {
      traits.push({ title: '正统血脉', description: '天生的领袖，更有统治者气场' });
    }

    if (subraceId === 'lizardfolk_base') {
      traits.push({ title: '荒野猎手', description: '防御能力更为出色的同时敏捷也不在话下' });
    }

    if (subraceId === 'goatfolk') {
      traits.push(
        { title: '铁胃牧民', description: '体魄强健，能消化腐肉并在崎岖地形中稳定生存' },
        { title: '暴怒', description: '天生脾气暴躁' },
      );
    }

    if (subraceId === 'ratfolk') {
      traits.push(
        { title: '毒素抗性', description: '长期生活在阴暗遗迹与恶劣环境中，对毒素更能适应' },
        { title: '挖地洞', description: '擅长在地下、缝隙和狭窄空间中活动与藏身' },
      );
    }

    if (subraceId === 'ailu_folk') {
      traits.push({ title: '厚毛自愈', description: '伤口恢复速度与疼痛耐受力都远超普通种族' });
    }

    if (subraceId === 'ilo') {
      traits.push(
        { title: '灵猫平衡', description: '灵敏的兽耳与猫尾让她们具备极强平衡感与闪避天赋' },
        { title: '发情期', description: '会周期性进入发情状态，情绪与行为更容易受到本能影响' },
      );
    }

    if (raceId === 'skeleton') {
      traits.push({ title: '机械之躯', description: '不会饥饿，不受天气影响，也无法游泳，只能在水下步行' });
    }

    if (subraceId === 'skeleton_foxwalker') {
      traits.push({ title: '渗透侦察', description: '轻量化骨架与稳定器让其更擅长高速潜行与野外侦察' });
    }

    if (subraceId === 'skeleton_camera') {
      traits.push({ title: '监视单元', description: '多重光学传感器让其更容易在恶劣环境中发现远处威胁' });
    }

    if (subraceId === 'skeleton_lionhead') {
      traits.push({ title: '重型突破', description: '厚重机体与液压单元赋予强大正面突破能力，但灵活性较差' });
    }

    if (subraceId === 'skeleton_false_savior') {
      traits.push({
        title: '邪念',
        description: '当附近存在非骨人单位时，系统会持续发出强制杀戮指令，嗜血杀人或者远离非骨人单位。',
      });
    }

    return traits;
  }, []);
  const baseAttributePoints = isSkeleton ? SKELETON_ATTRIBUTE_POINTS : TOTAL_ATTRIBUTE_POINTS;
  const scenarioStartLevel = SCENARIO_START_LEVELS[data.scenario] ?? 1;
  const godModeLevel = Math.max(
    GOD_MODE_MIN_LEVEL,
    Math.min(GOD_MODE_MAX_LEVEL, data.godModeLevel || GOD_MODE_MIN_LEVEL),
  );
  const effectiveLevel = data.godModeEnabled ? godModeLevel : scenarioStartLevel;
  const levelBonusPoints = (effectiveLevel - 1) * GOD_MODE_POINTS_PER_LEVEL;
  const totalAttributePoints = baseAttributePoints + levelBonusPoints;
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

    const regex = /(力量|敏捷|感知|体质|韧性|智力|魅力)\s*([+-]\s*\d+)/g;
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

    if (data.scenario === 'holy_crusade') {
      base.strength += 5;
      base.dexterity += 5;
      base.perception += 5;
      base.constitution += 5;
      base.will += 5;
      base.intelligence += 5;
      base.charisma += 10;
    }

    return base;
  }, [data.scenario]);

  const traitAttributeBonus = React.useMemo(() => {
    const base: Record<Attribute, number> = {
      strength: 0,
      dexterity: 0,
      perception: 0,
      constitution: 0,
      will: 0,
      intelligence: 0,
      charisma: 0,
    };

    data.traits.forEach(traitId => {
      const trait = [...TRAITS.attribute, ...TRAITS.life, ...TRAITS.fun].find(item => item.id === traitId);
      if (!trait) return;
      const regex = /(力量|敏捷|感知|体质|韧性|智力|魅力)\s*([+-]\s*\d+)/g;
      let match = regex.exec(trait.description);
      while (match) {
        const attrKey = ATTRIBUTE_LABEL_TO_KEY[match[1]];
        const delta = parseInt(match[2].replace(/\s+/g, ''), 10);
        if (attrKey && !Number.isNaN(delta)) {
          base[attrKey] += delta;
        }
        match = regex.exec(trait.description);
      }
    });

    return base;
  }, [data.traits]);

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

  const buildRandomAttributesByTotalPoints = (
    targetTotalPoints: number,
    lockWillTo100: boolean,
    maxPerAttribute: number,
  ): Attributes => {
    const keys = (Object.keys(INITIAL_ATTRIBUTES) as Attribute[]).filter(attr => !(lockWillTo100 && attr === 'will'));
    const attributes = (Object.keys(INITIAL_ATTRIBUTES) as Attribute[]).reduce((acc, key) => {
      acc[key] = ATTRIBUTE_MIN;
      return acc;
    }, {} as Attributes);

    if (lockWillTo100) {
      attributes.will = 100;
    }

    const pointsCapacity = keys.length * (maxPerAttribute - ATTRIBUTE_MIN);
    let remaining = Math.max(0, Math.min(pointsCapacity, Math.floor(targetTotalPoints)));

    while (remaining > 0) {
      const available = keys.filter(key => attributes[key] < maxPerAttribute);
      if (available.length === 0) break;
      const selected = available[Math.floor(Math.random() * available.length)];
      attributes[selected] += 1;
      remaining -= 1;
    }

    return attributes;
  };

  const randomizeMainAttributes = () => {
    updateData({
      attributes: buildRandomAttributesByTotalPoints(totalAttributePoints, isSkeleton, attributeUpperLimit),
    });
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
    updateData({ traits: [...currentTraits, traitId] });
  };

  const selectedRace = RACES.find(race => race.id === data.race);
  const selectedSubrace = selectedRace?.subraces.find(subrace => subrace.id === data.subrace);
  const raceExclusiveTraits = getRaceExclusiveTraits(data.race, data.subrace);
  const raceTraits = raceExclusiveTraits.map(trait => `${trait.title}：${trait.description}`);
  const autoRaceTraitName = raceExclusiveTraits.map(item => item.title).join('、');
  const autoRaceTraitDescription = raceExclusiveTraits.map(item => `${item.title}：${item.description}`).join('；');
  const selectedScenario = SCENARIOS.find(scenario => scenario.id === data.scenario) as
    | {
        allowedGenders?: Array<CharacterData['gender']>;
        companions?: SquadMemberData[];
        lockCompanionRaceSubrace?: boolean;
      }
    | undefined;
  const allowedGenders = selectedScenario?.allowedGenders;
  const companionMembers = selectedScenario?.companions ?? [];
  const allowSquadMembers = data.scenario === 'freedom_seekers' || companionMembers.length > 0;
  const lockCompanionRaceSubrace = selectedScenario?.lockCompanionRaceSubrace ?? false;
  const subraceAllowedGenders = (selectedSubrace as { allowedGenders?: Array<CharacterData['gender']> })
    ?.allowedGenders;
  const isUnknownDream = data.scenario === UNKNOWN_DREAM_SCENARIO_ID;
  const isMonsterHunterScenario = data.scenario === 'monster_hunter';
  const isApexHunterScenario = data.scenario === 'apex_hunter';
  const [isSavingUnknownDreamScript, setIsSavingUnknownDreamScript] = React.useState(false);
  const [unknownDreamScriptSaved, setUnknownDreamScriptSaved] = React.useState(false);
  const [showBeepPresetConfirm, setShowBeepPresetConfirm] = React.useState(false);
  const [showUnknownDreamTutorial, setShowUnknownDreamTutorial] = React.useState(false);
  const [unknownDreamTutorialStep, setUnknownDreamTutorialStep] = React.useState(0);
  const [utilityToolsCollapsed, setUtilityToolsCollapsed] = React.useState(true);
  const [utilityItemExpanded, setUtilityItemExpanded] = React.useState<Record<number, boolean>>({});
  const [isSavingUtilityCustomNames, setIsSavingUtilityCustomNames] = React.useState(false);
  const [utilityCustomNamesSaved, setUtilityCustomNamesSaved] = React.useState(false);
  const [currentSquadPage, setCurrentSquadPage] = React.useState(0);
  const [mainTraitCards, setMainTraitCards] = React.useState<{ attribute: string[]; life: string[]; fun: string[] }>({
    attribute: [],
    life: [],
    fun: [],
  });
  const [squadTraitCards, setSquadTraitCards] = React.useState<
    Record<number, { attribute: string[]; life: string[]; fun: string[] }>
  >({});

  const drawTraitCards = React.useCallback(
    <T extends { id: string }>(source: T[], selectedIds: string[], count: number = 5): T[] => {
      const selectedSet = new Set(selectedIds);
      const selected = source.filter(item => selectedSet.has(item.id));
      const unselected = source.filter(item => !selectedSet.has(item.id));
      const shuffled = [...unselected];
      for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return [...selected, ...shuffled].slice(0, Math.min(count, source.length));
    },
    [],
  );

  const redrawMainTraitCards = React.useCallback(() => {
    setMainTraitCards({
      attribute: drawTraitCards(
        TRAITS.attribute,
        data.traits.filter(id => TRAITS.attribute.some(t => t.id === id)),
      ).map(t => t.id),
      life: drawTraitCards(
        TRAITS.life,
        data.traits.filter(id => TRAITS.life.some(t => t.id === id)),
      ).map(t => t.id),
      fun: drawTraitCards(
        TRAITS.fun,
        data.traits.filter(id => TRAITS.fun.some(t => t.id === id)),
      ).map(t => t.id),
    });
  }, [data.traits, drawTraitCards]);

  const redrawMainTraitCategory = React.useCallback(
    (category: 'attribute' | 'life' | 'fun') => {
      setMainTraitCards(prev => ({
        ...prev,
        [category]: drawTraitCards(
          TRAITS[category],
          data.traits.filter(id => TRAITS[category].some(t => t.id === id)),
        ).map(t => t.id),
      }));
    },
    [data.traits, drawTraitCards],
  );

  React.useEffect(() => {
    if (mainTraitCards.attribute.length === 0 && mainTraitCards.life.length === 0 && mainTraitCards.fun.length === 0) {
      redrawMainTraitCards();
    }
  }, [mainTraitCards.attribute.length, mainTraitCards.fun.length, mainTraitCards.life.length, redrawMainTraitCards]);

  const ensureSquadTraitCards = React.useCallback(
    (memberIndex: number, member: SquadMemberData) => {
      setSquadTraitCards(prev => {
        if (prev[memberIndex]) return prev;
        return {
          ...prev,
          [memberIndex]: {
            attribute: drawTraitCards(
              TRAITS.attribute,
              member.traits.filter(id => TRAITS.attribute.some(t => t.id === id)),
            ).map(t => t.id),
            life: drawTraitCards(
              TRAITS.life,
              member.traits.filter(id => TRAITS.life.some(t => t.id === id)),
            ).map(t => t.id),
            fun: drawTraitCards(
              TRAITS.fun,
              member.traits.filter(id => TRAITS.fun.some(t => t.id === id)),
            ).map(t => t.id),
          },
        };
      });
    },
    [drawTraitCards],
  );

  const redrawSquadTraitCards = React.useCallback(
    (memberIndex: number, member: SquadMemberData) => {
      setSquadTraitCards(prev => ({
        ...prev,
        [memberIndex]: {
          attribute: drawTraitCards(
            TRAITS.attribute,
            member.traits.filter(id => TRAITS.attribute.some(t => t.id === id)),
          ).map(t => t.id),
          life: drawTraitCards(
            TRAITS.life,
            member.traits.filter(id => TRAITS.life.some(t => t.id === id)),
          ).map(t => t.id),
          fun: drawTraitCards(
            TRAITS.fun,
            member.traits.filter(id => TRAITS.fun.some(t => t.id === id)),
          ).map(t => t.id),
        },
      }));
    },
    [drawTraitCards],
  );

  const redrawSquadTraitCategory = React.useCallback(
    (memberIndex: number, member: SquadMemberData, category: 'attribute' | 'life' | 'fun') => {
      setSquadTraitCards(prev => ({
        ...prev,
        [memberIndex]: {
          ...(prev[memberIndex] ?? { attribute: [], life: [], fun: [] }),
          [category]: drawTraitCards(
            TRAITS[category],
            member.traits.filter(id => TRAITS[category].some(t => t.id === id)),
          ).map(t => t.id),
        },
      }));
    },
    [drawTraitCards],
  );

  const updateCustomStart = (updates: Partial<CharacterData['customStart']>) => {
    setUnknownDreamScriptSaved(false);
    updateData({
      customStart: {
        ...data.customStart,
        ...updates,
      },
    });
  };

  const updateUtilityTool = (key: keyof CharacterData['utilityTools'], enabled: boolean) => {
    updateData({
      utilityTools: {
        ...data.utilityTools,
        [key]: enabled,
      },
    });
  };

  const buildUtilityCustomNamesWorldbookContent = () => {
    const names = data.utilityCustomNames?.trim() || '未填写';
    return `我希望这些角色名字，可以作为随机npc随机的出现在这个世界里，属性随机，种族随机。
${names}`;
  };

  const saveUtilityCustomNames = async () => {
    if (isSavingUtilityCustomNames) return;
    setIsSavingUtilityCustomNames(true);
    setUtilityCustomNamesSaved(false);
    try {
      const charWorldbook = getCharWorldbookNames('current');
      const wbName = charWorldbook.primary;
      if (!wbName) throw new Error('worldbook not found');

      const content = buildUtilityCustomNamesWorldbookContent();
      await updateWorldbookWith(wbName, entries =>
        entries.map(entry => {
          if (Number(entry.uid) === 202872) {
            return { ...entry, enabled: Boolean(data.utilityTools.customCharacterNameUid883), content };
          }
          return entry;
        }),
      );
      setUtilityCustomNamesSaved(true);
    } catch (error) {
      console.error('保存自定义角色名字失败', error);
      toastr.error('保存失败，请查看控制台');
    } finally {
      setIsSavingUtilityCustomNames(false);
    }
  };

  const buildUnknownDreamWorldbookContent = () => {
    const script = data.customStart.script?.trim() || '未填写';
    return `这是对于【未知梦想】剧本的自定义背景故事：\n${script}`;
  };

  const buildMainPerspectiveWorldbookContent = React.useCallback(() => {
    const mainCharacterName = data.name?.trim() || '无名氏';
    const mainSquadName = data.mainSquadName?.trim() || '小队1';
    return `主控小队的派系名字是：无名者\n  -派系描述：无\n  -派系主旨：无\n  -派系规矩：无\n当前主角是：【${mainCharacterName}】\n\n后续所有故事情节基于小队【${mainSquadName}】的视角来进行`;
  }, [data.name, data.mainSquadName]);

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
    const syncMainPerspectiveWorldbook = async () => {
      try {
        const charWorldbook = getCharWorldbookNames('current');
        const wbName = charWorldbook.primary;
        if (!wbName) return;

        const content = buildMainPerspectiveWorldbookContent();
        await updateWorldbookWith(wbName, entries =>
          entries.map(entry => {
            if (Number(entry.uid) === 524087) {
              return { ...entry, enabled: true, content };
            }
            return entry;
          }),
        );
      } catch (error) {
        console.error('同步主控视角 UID524087 失败', error);
      }
    };

    const timer = window.setTimeout(syncMainPerspectiveWorldbook, 300);
    return () => window.clearTimeout(timer);
  }, [buildMainPerspectiveWorldbookContent]);

  React.useEffect(() => {
    const isFalseSaviorSubrace = data.subrace === 'skeleton_false_savior';
    if (isSkeleton && !isFalseSaviorSubrace && data.gender !== 'other') {
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
  }, [allowedGenders, data.gender, isSkeleton, data.subrace, subraceAllowedGenders, updateData]);

  React.useEffect(() => {}, []);

  React.useEffect(() => {
    const scenarioTrait = SCENARIO_EXCLUSIVE_TRAITS[data.scenario];
    const traitList = scenarioTrait?.traits ?? [];
    const nextName = traitList.length > 0 ? traitList.map(item => item.name).join('、') : scenarioTrait?.name || '';
    const nextDesc =
      traitList.length > 0
        ? traitList.map(item => `${item.name}：${item.description}`).join('；')
        : scenarioTrait?.description || '';
    if (data.scenarioTraitName !== nextName || data.scenarioTraitDescription !== nextDesc) {
      updateData({
        scenarioTraitName: nextName,
        scenarioTraitDescription: nextDesc,
      });
    }
  }, [data.scenario, data.scenarioTraitDescription, data.scenarioTraitName, updateData]);

  const updateSquadMember = (index: number, updates: Partial<SquadMemberData>) => {
    updateData({
      squadMembers: data.squadMembers.map((member, idx) => (idx === index ? { ...member, ...updates } : member)),
    });
  };

  React.useEffect(() => {
    if (!allowSquadMembers) {
      if (currentSquadPage !== 0) {
        setCurrentSquadPage(0);
      }
      const hasResidualMembers = data.squadMembers.some(member => member.name || member.race || member.subrace);
      if (hasResidualMembers) {
        const resetMembers: SquadMemberData[] = Array.from({ length: 4 }, () => ({
          race: '',
          subrace: '',
          level: 1,
          attributes: { ...INITIAL_ATTRIBUTES },
          name: '',
          gender: 'male',
          age: 25,
          appearance: { ...INITIAL_APPEARANCE },
          traits: [],
          customTraitName: '',
          customTraitDescription: '',
          scenarioTraitName: '',
          scenarioTraitDescription: '',
        }));
        updateData({ squadMembers: resetMembers });
      }
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
  }, [allowSquadMembers, companionMembers, currentSquadPage, data.squadMembers, updateData]);

  React.useEffect(() => {
    let cancelled = false;
    const syncUtilityToolsWorldbook = async () => {
      try {
        const charWorldbook = getCharWorldbookNames('current');
        const wbName = charWorldbook.primary;
        if (!wbName) return;

        await updateWorldbookWith(wbName, entries =>
          entries.map(entry => {
            const uid = Number(entry.uid);
            const option = UTILITY_TOOL_OPTIONS.find(item => item.uid === uid);
            if (!option) return entry;
            const enabled = Boolean(data.utilityTools[option.key]);
            if (uid === 202872) {
              return entry.enabled === enabled ? entry : { ...entry, enabled };
            }
            return entry.enabled === enabled ? entry : { ...entry, enabled };
          }),
        );
      } catch (error) {
        if (!cancelled) {
          console.error('同步小工具世界书开关失败', error);
        }
      }
    };

    syncUtilityToolsWorldbook();
    return () => {
      cancelled = true;
    };
  }, [data.utilityTools]);

  React.useEffect(() => {
    if (currentSquadPage > data.squadMembers.length - 1) {
      setCurrentSquadPage(Math.max(0, data.squadMembers.length - 1));
    }
  }, [currentSquadPage, data.squadMembers.length]);

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

  const buildRandomMemberAttributes = (memberLevel: number, lockWillTo100 = false): Attributes => {
    const clampedLevel = Math.max(1, Math.min(100, Number(memberLevel || 1)));
    const memberBasePoints = lockWillTo100 ? SKELETON_ATTRIBUTE_POINTS : TOTAL_ATTRIBUTE_POINTS;
    const memberTotalPoints = memberBasePoints + (clampedLevel - 1) * SQUAD_LEVEL_POINTS_PER_LEVEL;
    return buildRandomAttributesByTotalPoints(memberTotalPoints, lockWillTo100, GOD_MODE_ATTRIBUTE_MAX);
  };

  const buildMainCharacterTemplate = (): CharacterTemplateData => ({
    race: data.race,
    subrace: data.subrace,
    attributes: { ...data.attributes },
    name: data.name,
    gender: data.gender,
    age: data.age,
    appearance: { ...data.appearance },
    traits: [...data.traits],
    customTraitName: data.customTraitName,
    customTraitDescription: data.customTraitDescription,
  });

  const buildSquadMemberTemplate = (member: SquadMemberData): CharacterTemplateData => ({
    race: member.race,
    subrace: member.subrace,
    attributes: { ...member.attributes },
    name: member.name,
    gender: member.gender,
    age: member.age,
    appearance: { ...member.appearance },
    traits: [...member.traits],
    customTraitName: member.customTraitName,
    customTraitDescription: member.customTraitDescription,
  });

  const downloadCharacterTemplate = (template: CharacterTemplateData, suffix = '') => {
    const payload = buildCharacterTemplatePayload(template);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${CHARACTER_TEMPLATE_FILE_PREFIX}-${sanitizeFilenamePart(template.name)}${suffix}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const applyTemplateToMainCharacter = (template: CharacterTemplateData) => {
    updateData({
      race: template.race,
      subrace: template.subrace,
      attributes: { ...template.attributes },
      name: template.name,
      gender: template.gender,
      age: template.age,
      appearance: { ...template.appearance },
      traits: [...template.traits],
      customTraitName: template.customTraitName,
      customTraitDescription: template.customTraitDescription,
    });
  };

  const applyTemplateToSquadMember = (index: number, template: CharacterTemplateData) => {
    const raceTraits = getRaceExclusiveTraits(template.race, template.subrace);
    const templateIsSkeleton = template.race === 'skeleton';
    updateSquadMember(index, {
      race: template.race,
      subrace: template.subrace,
      attributes: {
        ...template.attributes,
        will: templateIsSkeleton ? 100 : Math.min(template.attributes.will, GOD_MODE_ATTRIBUTE_MAX),
      },
      name: template.name,
      gender: templateIsSkeleton ? 'other' : template.gender,
      age: template.age,
      appearance: { ...template.appearance },
      traits: [...template.traits],
      customTraitName: template.customTraitName,
      customTraitDescription: template.customTraitDescription,
      scenarioTraitName: raceTraits.map(item => item.title).join('、'),
      scenarioTraitDescription: raceTraits.map(item => `${item.title}：${item.description}`).join('；'),
    });
  };

  const readCharacterTemplateFile = async (file: File) => {
    const text = await file.text();
    return normalizeImportedTemplate(JSON.parse(text));
  };

  const handleImportMainCharacter = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      applyTemplateToMainCharacter(await readCharacterTemplateFile(file));
      toastr.success('已导入到当前角色');
    } catch (error) {
      console.error('导入当前角色模板失败', error);
      toastr.error('导入失败：文件格式不正确');
    }
  };

  const handleImportSquadMember = async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      applyTemplateToSquadMember(index, await readCharacterTemplateFile(file));
      toastr.success(`已导入到队员 ${index + 1}`);
    } catch (error) {
      console.error('导入队员模板失败', error);
      toastr.error('导入失败：文件格式不正确');
    }
  };

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto pr-2 pb-20">
      {/* Left Column: Stats & Traits */}
      <div className="space-y-8">
        {/* Attributes Section */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-2xl font-serif text-[#C2B280] flex items-center gap-2">
              <Activity className="text-[#C2B280]" />
              七维属性
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => downloadCharacterTemplate(buildMainCharacterTemplate())}
                className="inline-flex items-center gap-1 rounded border border-[#C2B280]/50 px-3 py-1.5 text-xs text-[#C2B280] transition-colors hover:bg-[#C2B280]/10"
                title="保存详细设定，并按当前种族记录种族特质；不保存剧本专属特质"
              >
                <Download size={13} />
                保存当前角色
              </button>
              <label
                className="inline-flex cursor-pointer items-center gap-1 rounded border border-white/25 px-3 py-1.5 text-xs text-white/75 transition-colors hover:border-[#C2B280]/60 hover:text-[#C2B280]"
                title="导入到当前角色；种族特质会按导入角色的种族自动生成，不导入剧本专属特质"
              >
                <Upload size={13} />
                导入当前角色
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={handleImportMainCharacter}
                  className="hidden"
                />
              </label>
            </div>
          </div>

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
                  <label className="text-white/60">自定义等级</label>
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
                  <span className="text-green-400">
                    实际等级 {effectiveLevel}，额外 +{levelBonusPoints} 属性点
                  </span>
                </>
              )}
            </div>
            <div className="rounded border border-white/10 bg-black/30 px-3 py-2 text-[10px] leading-relaxed text-white/45">
              <div className="text-[#C2B280]">
                初始等级：{scenarioStartLevel} 级{scenarioStartLevel > 1 ? '（由当前剧本赋予）' : '（无剧本加成）'}
                ；等级会影响可分配属性点。
              </div>
              <div>
                注意：废土不会把起跑线当作功绩。故事探索中每提升 10
                级可获得特质点，用于某些特殊地方；开局等级不发放特质点。
              </div>
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
              <button
                onClick={randomizeMainAttributes}
                className="rounded border border-[#C2B280]/40 px-3 py-1.5 text-xs text-[#C2B280] transition-colors hover:bg-[#C2B280]/10"
              >
                随机属性点
              </button>
            </div>
            <p className="text-[10px] text-white/40">
              按游戏加点逻辑：默认 1 点，+1 消耗 1 点，-1 返还 1 点；普通模式使用剧本初始等级。上帝模式可设置自定义等级
              1-100，并以自定义等级为准；例如怪物猎人可改回 1 级来减少开局属性点。上帝模式单项上限为
              130，且可直接输入数值分配。长按 +/- 可连续加点。
            </p>
            {(isMonsterHunterScenario ||
              isApexHunterScenario ||
              data.scenario === 'officer_son' ||
              data.scenario === 'holy_crusade' ||
              data.scenario === 'false_savior') && (
              <p className="text-[10px] text-[#C2B280]">
                剧本初始等级：
                {isMonsterHunterScenario ? '利维坦猎人 30 级' : ''}
                {isApexHunterScenario ? '顶级猎手 40 级' : ''}
                {data.scenario === 'officer_son' ? '贵族之子 20 级' : ''}
                {data.scenario === 'holy_crusade' ? '十字军 20 级' : ''}
                {data.scenario === 'false_savior' ? '虚伪者 30 级' : ''}
              </p>
            )}
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
                      {raceAttributeBonus[attr] + scenarioAttributeBonus[attr] + traitAttributeBonus[attr] !== 0 && (
                        <span
                          className={
                            raceAttributeBonus[attr] + scenarioAttributeBonus[attr] + traitAttributeBonus[attr] > 0
                              ? 'text-green-400'
                              : 'text-red-400'
                          }
                        >
                          (
                          {raceAttributeBonus[attr] + scenarioAttributeBonus[attr] + traitAttributeBonus[attr] > 0
                            ? `+${raceAttributeBonus[attr] + scenarioAttributeBonus[attr] + traitAttributeBonus[attr]}`
                            : raceAttributeBonus[attr] + scenarioAttributeBonus[attr] + traitAttributeBonus[attr]}
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
                  {isLocked && <div className="text-[10px] text-white/40 mt-1">骨人韧性固定为 100</div>}

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
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                <button
                  type="button"
                  onClick={() => setCurrentSquadPage(prev => Math.max(0, prev - 1))}
                  disabled={currentSquadPage === 0}
                  className="rounded border border-white/20 px-3 py-1 text-xs text-white/70 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10"
                >
                  上一位
                </button>
                <div className="text-xs text-[#C2B280] font-mono">
                  队员 {Math.min(currentSquadPage + 1, data.squadMembers.length)} / {data.squadMembers.length}
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentSquadPage(prev => Math.min(data.squadMembers.length - 1, prev + 1))}
                  disabled={currentSquadPage === data.squadMembers.length - 1}
                  className="rounded border border-white/20 px-3 py-1 text-xs text-white/70 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10"
                >
                  下一位
                </button>
              </div>

              {data.squadMembers
                .filter((_, index) => index === currentSquadPage)
                .map((member, index) => {
                  const realIndex = currentSquadPage;
                  const memberRace = RACES.find(race => race.id === member.race);
                  const memberSubraces = (memberRace?.subraces ?? []).filter(subrace => {
                    if ((subrace as { hidden?: boolean }).hidden) return false;
                    const unlockScenarios = (subrace as { unlockScenarios?: string[] }).unlockScenarios;
                    if (unlockScenarios && !unlockScenarios.includes(data.scenario)) return false;
                    return true;
                  });
                  const memberSubrace = memberSubraces.find(subrace => subrace.id === member.subrace);
                  const memberLevel = Math.max(1, Math.min(100, Number(member.level || 1)));
                  const memberIsSkeleton = member.race === 'skeleton';
                  const memberBaseAttributePoints = memberIsSkeleton
                    ? SKELETON_ATTRIBUTE_POINTS
                    : TOTAL_ATTRIBUTE_POINTS;
                  const memberTotalAttributePoints =
                    memberBaseAttributePoints + (memberLevel - 1) * SQUAD_LEVEL_POINTS_PER_LEVEL;
                  const memberUsedPoints = (Object.keys(member.attributes) as Attribute[]).reduce((sum, attr) => {
                    if (memberIsSkeleton && attr === 'will') return sum;
                    return sum + (member.attributes[attr] - ATTRIBUTE_MIN);
                  }, 0);
                  const memberRemainingPoints = Math.max(0, memberTotalAttributePoints - memberUsedPoints);
                  const memberSubraceAllowedGenders = (
                    memberSubrace as { allowedGenders?: Array<CharacterData['gender']> }
                  )?.allowedGenders;
                  return (
                    <div key={realIndex} className="border border-white/10 rounded-xl p-4 bg-black/30">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-[#C2B280] font-serif flex items-center gap-2 flex-wrap">
                          <span>队员 {realIndex + 1}</span>
                          {(() => {
                            const memberRaceSummary =
                              (memberSubrace as { attributeSummary?: string })?.attributeSummary || '';
                            const memberTraitSummary = member.traits
                              .map(
                                traitId =>
                                  [...TRAITS.attribute, ...TRAITS.life, ...TRAITS.fun].find(
                                    trait => trait.id === traitId,
                                  )?.description || '',
                              )
                              .flatMap(description =>
                                Array.from(
                                  description.matchAll(/(力量|敏捷|感知|体质|韧性|智力|魅力)\s*[+-]\s*\d+/g),
                                ).map(match => match[0].replace(/\s+/g, '')),
                              )
                              .join('、');
                            const summaryText = [memberRaceSummary, memberTraitSummary].filter(Boolean).join('；');
                            return summaryText ? (
                              <span className="text-[10px] text-white/50 font-sans">{summaryText}</span>
                            ) : null;
                          })()}
                        </div>
                        {companionMembers.length > 0 ? (
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                downloadCharacterTemplate(buildSquadMemberTemplate(member), `-队员${realIndex + 1}`)
                              }
                              className="inline-flex items-center gap-1 rounded border border-[#C2B280]/40 px-2 py-1 text-xs text-[#C2B280] transition-colors hover:bg-[#C2B280]/10"
                              title="保存该队员详细设定，并按当前种族记录种族特质；不保存剧本专属特质"
                            >
                              <Download size={12} />
                              保存
                            </button>
                            <label
                              className="inline-flex cursor-pointer items-center gap-1 rounded border border-white/20 px-2 py-1 text-xs text-white/60 transition-colors hover:border-[#C2B280]/60 hover:text-[#C2B280]"
                              title="导入到该队员；种族特质会按导入角色的种族自动生成，不导入剧本专属特质"
                            >
                              <Upload size={12} />
                              导入
                              <input
                                type="file"
                                accept="application/json,.json"
                                onChange={event => handleImportSquadMember(realIndex, event)}
                                className="hidden"
                              />
                            </label>
                            <span className="text-xs text-white/40">固定成员</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                downloadCharacterTemplate(buildSquadMemberTemplate(member), `-队员${realIndex + 1}`)
                              }
                              className="inline-flex items-center gap-1 rounded border border-[#C2B280]/40 px-2 py-1 text-xs text-[#C2B280] transition-colors hover:bg-[#C2B280]/10"
                              title="保存该队员详细设定，并按当前种族记录种族特质；不保存剧本专属特质"
                            >
                              <Download size={12} />
                              保存
                            </button>
                            <label
                              className="inline-flex cursor-pointer items-center gap-1 rounded border border-white/20 px-2 py-1 text-xs text-white/60 transition-colors hover:border-[#C2B280]/60 hover:text-[#C2B280]"
                              title="导入到该队员；种族特质会按导入角色的种族自动生成，不导入剧本专属特质"
                            >
                              <Upload size={12} />
                              导入
                              <input
                                type="file"
                                accept="application/json,.json"
                                onChange={event => handleImportSquadMember(realIndex, event)}
                                className="hidden"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => resetSquadMember(realIndex)}
                              className="text-xs text-white/40 hover:text-white transition-colors"
                            >
                              重置
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-white/60 mb-1">姓名</label>
                          <input
                            type="text"
                            value={member.name}
                            onChange={e => updateSquadMember(realIndex, { name: e.target.value })}
                            className="w-full bg-black/50 border border-white/20 rounded p-2 text-white focus:border-[#C2B280] focus:outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-white/60 mb-1">性别</label>
                            <select
                              value={member.gender}
                              onChange={e => updateSquadMember(realIndex, { gender: e.target.value as any })}
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
                              onChange={e => updateSquadMember(realIndex, { age: parseInt(e.target.value) })}
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
                              updateSquadMember(realIndex, {
                                level: Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1)),
                              })
                            }
                            className="w-full bg-black/50 border border-white/20 rounded p-2 text-white focus:border-[#C2B280] focus:outline-none"
                          />
                          {isMonsterHunterScenario && (
                            <p className="mt-1 text-[10px] text-[#C2B280]">怪物猎人伙伴推荐 15 级（仅推荐，不锁定）</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-xs text-white/60 mb-1">种族</label>
                          <select
                            value={member.race}
                            onChange={e => {
                              const nextRace = e.target.value;
                              updateSquadMember(realIndex, {
                                race: nextRace,
                                subrace: '',
                                attributes: {
                                  ...member.attributes,
                                  will:
                                    nextRace === 'skeleton'
                                      ? 100
                                      : Math.min(member.attributes.will, GOD_MODE_ATTRIBUTE_MAX),
                                },
                                gender: nextRace === 'skeleton' ? 'other' : member.gender,
                                appearance: {
                                  ...member.appearance,
                                  height: getDefaultHeightByRaceSubrace(nextRace, ''),
                                },
                              });
                            }}
                            className="w-full bg-black/50 border border-white/20 rounded p-2 text-white focus:border-[#C2B280] focus:outline-none"
                            disabled={companionMembers.length > 0 && lockCompanionRaceSubrace}
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
                              const nextGender =
                                allowed && !allowed.includes(member.gender) ? allowed[0] : member.gender;
                              updateSquadMember(realIndex, {
                                subrace: nextSubrace,
                                attributes: {
                                  ...member.attributes,
                                  will:
                                    member.race === 'skeleton'
                                      ? 100
                                      : Math.min(member.attributes.will, GOD_MODE_ATTRIBUTE_MAX),
                                },
                                gender: member.race === 'skeleton' ? 'other' : nextGender,
                                appearance: {
                                  ...member.appearance,
                                  height: getDefaultHeightByRaceSubrace(member.race, nextSubrace),
                                },
                              });
                            }}
                            className="w-full bg-black/50 border border-white/20 rounded p-2 text-white focus:border-[#C2B280] focus:outline-none"
                            disabled={!member.race || (companionMembers.length > 0 && lockCompanionRaceSubrace)}
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
                              updateSquadMember(realIndex, {
                                attributes: buildRandomMemberAttributes(memberLevel, memberIsSkeleton),
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
                                max={GOD_MODE_ATTRIBUTE_MAX}
                                value={memberIsSkeleton && attr === 'will' ? 100 : member.attributes[attr]}
                                disabled={memberIsSkeleton && attr === 'will'}
                                onChange={e =>
                                  updateSquadMemberAttributes(realIndex, {
                                    [attr]: Math.max(
                                      ATTRIBUTE_MIN,
                                      Math.min(GOD_MODE_ATTRIBUTE_MAX, parseInt(e.target.value) || ATTRIBUTE_MIN),
                                    ),
                                  })
                                }
                                className="w-full bg-black/50 border border-white/20 rounded p-2 text-white focus:border-[#C2B280] focus:outline-none disabled:opacity-60"
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-white/40 mt-2">
                          每位队员基础 {memberBaseAttributePoints} 点属性；等级每提升 1 级额外 +5 点（当前等级{' '}
                          {memberLevel}，总计 {memberTotalAttributePoints}
                          点）；单项上限 130，骨人韧性固定为 100 且不消耗属性点；可手动分配，或点击“随机该队员”生成。
                        </p>
                      </div>

                      <div className="mt-4">
                        <div className="text-xs text-white/60 mb-2">外貌与性格</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={member.appearance.eyes}
                            onChange={e => updateSquadMemberAppearance(realIndex, { eyes: e.target.value })}
                            className="w-full bg-black/50 border border-white/20 rounded p-2 text-white focus:border-[#C2B280] focus:outline-none"
                            placeholder="眼睛"
                          />
                          <input
                            type="text"
                            value={member.appearance.hairColor}
                            onChange={e => updateSquadMemberAppearance(realIndex, { hairColor: e.target.value })}
                            className="w-full bg-black/50 border border-white/20 rounded p-2 text-white focus:border-[#C2B280] focus:outline-none"
                            placeholder="发色"
                          />
                          <input
                            type="text"
                            value={member.appearance.bodyType}
                            onChange={e => updateSquadMemberAppearance(realIndex, { bodyType: e.target.value })}
                            className="w-full bg-black/50 border border-white/20 rounded p-2 text-white focus:border-[#C2B280] focus:outline-none"
                            placeholder="性格"
                          />
                          <input
                            type="text"
                            value={member.appearance.hairStyle}
                            onChange={e => updateSquadMemberAppearance(realIndex, { hairStyle: e.target.value })}
                            className="w-full bg-black/50 border border-white/20 rounded p-2 text-white focus:border-[#C2B280] focus:outline-none"
                            placeholder="发型"
                          />
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-[11px] mb-1 text-white/70">
                            <span>身高</span>
                            <span className="font-mono text-[#C2B280]">
                              {((member.appearance.height || 0) / 100).toFixed(2)} m
                            </span>
                          </div>
                          <input
                            type="range"
                            min="80"
                            max="300"
                            step="1"
                            value={member.appearance.height || 175}
                            onChange={e =>
                              updateSquadMemberAppearance(realIndex, {
                                height: parseInt(e.target.value, 10) || 175,
                              })
                            }
                            className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-[#C2B280]"
                          />
                          <div className="flex justify-between text-[10px] text-white/30 mt-1">
                            <span>0.80m</span>
                            <span>3.00m</span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="block text-[10px] text-white/50 mb-1">外貌描述</label>
                          <textarea
                            value={member.appearance.description}
                            onChange={e => updateSquadMemberAppearance(realIndex, { description: e.target.value })}
                            rows={3}
                            className="w-full resize-y rounded border border-white/20 bg-black/50 p-2 text-sm text-white focus:border-[#C2B280] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <span className="text-xs text-white/60">特质</span>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <div className="mb-1 flex items-center justify-between">
                              <div className="text-[10px] text-white/50">属性类</div>
                              <button
                                type="button"
                                onClick={() => redrawSquadTraitCategory(realIndex, member, 'attribute')}
                                className="inline-flex items-center justify-center rounded border border-[#C2B280]/40 p-1 text-[#C2B280] hover:bg-[#C2B280]/10"
                                title="重抽属性类"
                              >
                                <RotateCcw size={10} />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {(squadTraitCards[realIndex]?.attribute ?? []).map(traitId => {
                                const trait = TRAITS.attribute.find(t => t.id === traitId);
                                if (!trait) return null;
                                const isAnimalCompanion = member.race === 'canine' || member.race === 'pack_beast';
                                return (
                                  <button
                                    key={trait.id}
                                    onClick={() => toggleSquadMemberTrait(realIndex, trait.id, 'attribute')}
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
                          <div>
                            <div className="mb-1 flex items-center justify-between">
                              <div className="text-[10px] text-white/50">生活类</div>
                              <button
                                type="button"
                                onClick={() => redrawSquadTraitCategory(realIndex, member, 'life')}
                                className="inline-flex items-center justify-center rounded border border-[#C2B280]/40 p-1 text-[#C2B280] hover:bg-[#C2B280]/10"
                                title="重抽生活类"
                              >
                                <RotateCcw size={10} />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {(squadTraitCards[realIndex]?.life ?? []).map(traitId => {
                                const trait = TRAITS.life.find(t => t.id === traitId);
                                if (!trait) return null;
                                const isAnimalCompanion = member.race === 'canine' || member.race === 'pack_beast';
                                return (
                                  <button
                                    key={trait.id}
                                    onClick={() => toggleSquadMemberTrait(realIndex, trait.id, 'life')}
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
                          <div>
                            <div className="mb-1 flex items-center justify-between">
                              <div className="text-[10px] text-white/50">整活类</div>
                              <button
                                type="button"
                                onClick={() => redrawSquadTraitCategory(realIndex, member, 'fun')}
                                className="inline-flex items-center justify-center rounded border border-[#C2B280]/40 p-1 text-[#C2B280] hover:bg-[#C2B280]/10"
                                title="重抽整活类"
                              >
                                <RotateCcw size={10} />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {(squadTraitCards[realIndex]?.fun ?? []).map(traitId => {
                                const trait = TRAITS.fun.find(t => t.id === traitId);
                                if (!trait) return null;
                                const isAnimalCompanion = member.race === 'canine' || member.race === 'pack_beast';
                                return (
                                  <button
                                    key={trait.id}
                                    onClick={() => toggleSquadMemberTrait(realIndex, trait.id, 'fun')}
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
                              onChange={e => updateSquadMember(realIndex, { customTraitName: e.target.value })}
                              className="w-full rounded border border-white/20 bg-black/50 p-2 text-sm text-white focus:border-[#C2B280] focus:outline-none"
                              placeholder="特质名称"
                              disabled={member.race === 'canine' || member.race === 'pack_beast'}
                            />
                            <textarea
                              value={member.customTraitDescription || ''}
                              onChange={e => updateSquadMember(realIndex, { customTraitDescription: e.target.value })}
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
          <button
            type="button"
            onClick={() => setUtilityToolsCollapsed(prev => !prev)}
            className="w-full flex items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-2">
              <Wrench className="text-[#C2B280]" size={18} />
              <h3 className="text-2xl font-serif text-[#C2B280]">小工具</h3>
            </div>
            <span className="text-white/60 text-xs inline-flex items-center gap-1">
              {utilityToolsCollapsed ? '展开' : '收起'}
              {utilityToolsCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            </span>
          </button>

          {!utilityToolsCollapsed && (
            <div className="mt-4 grid grid-cols-1 gap-2">
              {UTILITY_TOOL_OPTIONS.map(option => {
                const enabled = Boolean(data.utilityTools[option.key]);
                const expanded = Boolean(utilityItemExpanded[option.uid]);
                return (
                  <div
                    key={option.uid}
                    className={`flex items-center justify-between rounded border px-3 py-2 text-sm transition-all ${
                      enabled
                        ? 'border-[#C2B280]/60 bg-[#C2B280]/10 text-[#E7D8A6]'
                        : 'border-white/15 bg-black/30 text-white/70 hover:border-white/30'
                    }`}
                  >
                    <div className="w-full">
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setUtilityItemExpanded(prev => ({ ...prev, [option.uid]: !expanded }))}
                          className="inline-flex items-center gap-2 text-left"
                        >
                          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          <span>{option.label}</span>
                        </button>
                        <span className="inline-flex items-center gap-2">
                          <span className={`text-xs ${enabled ? 'text-emerald-300' : 'text-white/50'}`}>
                            {enabled ? '开启' : '关闭'}
                          </span>
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={e => updateUtilityTool(option.key, e.target.checked)}
                            className="h-4 w-4 rounded border-white/30 bg-black/50"
                          />
                        </span>
                      </div>

                      {expanded && (
                        <div className="mt-2 rounded border border-white/10 bg-black/30 p-2 text-xs leading-6 text-white/75 whitespace-pre-line">
                          {option.description}
                        </div>
                      )}

                      {expanded && option.uid === 202872 && (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={data.utilityCustomNames}
                            onChange={e => {
                              setUtilityCustomNamesSaved(false);
                              updateData({ utilityCustomNames: e.target.value });
                            }}
                            rows={4}
                            className="w-full resize-y rounded border border-white/20 bg-black/50 p-2 text-xs text-white focus:border-[#C2B280] focus:outline-none"
                            placeholder={'例如：\n刘备\n周瑜\n阿斯塔特\nV'}
                          />
                          <div className="rounded border border-white/10 bg-black/40 p-2 text-[11px] text-white/70 whitespace-pre-line">
                            {buildUtilityCustomNamesWorldbookContent()}
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={saveUtilityCustomNames}
                              disabled={isSavingUtilityCustomNames}
                              className="rounded border border-[#C2B280]/60 px-3 py-1.5 text-xs text-[#C2B280] hover:bg-[#C2B280]/10 disabled:opacity-50"
                            >
                              {isSavingUtilityCustomNames
                                ? '保存中...'
                                : utilityCustomNamesSaved
                                  ? '已保存到自定义角色名字'
                                  : '保存自定义角色名字'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-black/40 border border-[#C2B280]/25 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-serif text-[#C2B280]">角色模板</h3>
              <p className="mt-1 text-xs text-white/45">
                手动点击按钮才会保存或导入；填写内容本身不会自动保存。会保存当前种族对应的种族特质，不保存剧本专属特质。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => downloadCharacterTemplate(buildMainCharacterTemplate())}
                className="inline-flex items-center gap-1 rounded border border-[#C2B280]/60 px-4 py-2 text-sm text-[#C2B280] transition-colors hover:bg-[#C2B280]/10"
              >
                <Download size={14} />
                保存角色
              </button>
              <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-white/25 px-4 py-2 text-sm text-white/75 transition-colors hover:border-[#C2B280]/60 hover:text-[#C2B280]">
                <Upload size={14} />
                导入角色
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={handleImportMainCharacter}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

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

            <div>
              <label className="block text-sm text-white/60 mb-2">主控小队名字</label>
              <input
                type="text"
                value={data.mainSquadName}
                onChange={e => updateData({ mainSquadName: e.target.value })}
                className="w-full bg-black/50 border border-white/20 rounded p-3 text-white focus:border-[#C2B280] focus:outline-none font-serif tracking-wide"
                placeholder="例如：小队1、流亡者、第一远征队"
              />
              <div className="text-[10px] text-white/40 mt-1">
                启程后会写入主控变量、小队名称，并同步到 524087 世界书的小队视角。
              </div>
            </div>

            {/* Gender & Age */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">性别</label>
                <select
                  value={data.gender}
                  onChange={e => updateData({ gender: e.target.value as any })}
                  className="w-full bg-black/50 border border-white/20 rounded p-3 text-white focus:border-[#C2B280] focus:outline-none"
                  disabled={isSkeleton && data.subrace !== 'skeleton_false_savior'}
                >
                  <option
                    value="male"
                    disabled={
                      (isSkeleton && data.subrace !== 'skeleton_false_savior') ||
                      (allowedGenders ? !allowedGenders.includes('male') : false) ||
                      (subraceAllowedGenders ? !subraceAllowedGenders.includes('male') : false)
                    }
                  >
                    男性
                  </option>
                  <option
                    value="female"
                    disabled={
                      (isSkeleton && data.subrace !== 'skeleton_false_savior') ||
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
                {isSkeleton && data.subrace !== 'skeleton_false_savior' && (
                  <div className="text-[10px] text-white/40 mt-1">骨人无性别</div>
                )}
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
              <div className="text-xs text-white/50">无限制选择</div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs text-white/60">属性类</div>
                  <button
                    type="button"
                    onClick={() => redrawMainTraitCategory('attribute')}
                    className="inline-flex items-center justify-center rounded border border-[#C2B280]/40 p-1 text-[#C2B280] hover:bg-[#C2B280]/10"
                    title="重抽属性类"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {mainTraitCards.attribute
                    .map(traitId => TRAITS.attribute.find(t => t.id === traitId))
                    .filter(Boolean)
                    .map(trait => (
                      <button
                        key={trait!.id}
                        onClick={() => toggleTrait(trait!.id, 'attribute')}
                        className={`
                        p-3 rounded border text-left text-sm transition-all
                        ${
                          data.traits.includes(trait!.id)
                            ? 'bg-[#C2B280]/20 border-[#C2B280] text-[#C2B280]'
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed'
                        }
                      `}
                      >
                        <div className="font-bold mb-1">{trait!.title}</div>
                        <div className="text-[10px] opacity-70">{trait!.description}</div>
                      </button>
                    ))}
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs text-white/60">生活类</div>
                  <button
                    type="button"
                    onClick={() => redrawMainTraitCategory('life')}
                    className="inline-flex items-center justify-center rounded border border-[#C2B280]/40 p-1 text-[#C2B280] hover:bg-[#C2B280]/10"
                    title="重抽生活类"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {mainTraitCards.life
                    .map(traitId => TRAITS.life.find(t => t.id === traitId))
                    .filter(Boolean)
                    .map(trait => (
                      <button
                        key={trait!.id}
                        onClick={() => toggleTrait(trait!.id, 'life')}
                        className={`
                        p-3 rounded border text-left text-sm transition-all
                        ${
                          data.traits.includes(trait!.id)
                            ? 'bg-[#C2B280]/20 border-[#C2B280] text-[#C2B280]'
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed'
                        }
                      `}
                      >
                        <div className="font-bold mb-1">{trait!.title}</div>
                        <div className="text-[10px] opacity-70">{trait!.description}</div>
                      </button>
                    ))}
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs text-white/60">整活类</div>
                  <button
                    type="button"
                    onClick={() => redrawMainTraitCategory('fun')}
                    className="inline-flex items-center justify-center rounded border border-[#C2B280]/40 p-1 text-[#C2B280] hover:bg-[#C2B280]/10"
                    title="重抽整活类"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {mainTraitCards.fun
                    .map(traitId => TRAITS.fun.find(t => t.id === traitId))
                    .filter(Boolean)
                    .map(trait => (
                      <button
                        key={trait!.id}
                        onClick={() => toggleTrait(trait!.id, 'fun')}
                        className={`
                        p-3 rounded border text-left text-sm transition-all
                        ${
                          data.traits.includes(trait!.id)
                            ? 'bg-[#C2B280]/20 border-[#C2B280] text-[#C2B280]'
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
                        }
                      `}
                      >
                        <div className="font-bold mb-1">{trait!.title}</div>
                        <div className="text-[10px] opacity-70">{trait!.description}</div>
                      </button>
                    ))}
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">剧本专属特质（自动写入，不可修改）</label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {(() => {
                    const scenarioTrait = SCENARIO_EXCLUSIVE_TRAITS[data.scenario];
                    const traitList = scenarioTrait?.traits ?? [];
                    if (traitList.length > 0) {
                      return traitList.map(item => (
                        <div key={item.name} className="rounded border border-[#C2B280]/30 bg-black/40 p-3">
                          <div className="text-sm font-semibold text-[#C2B280]">{item.name}</div>
                          <div className="mt-1 text-xs text-white/80 leading-relaxed">{item.description}</div>
                        </div>
                      ));
                    }
                    if (scenarioTrait?.name && scenarioTrait?.description) {
                      return (
                        <div className="rounded border border-[#C2B280]/30 bg-black/40 p-3 lg:col-span-2">
                          <div className="text-sm font-semibold text-[#C2B280]">{scenarioTrait.name}</div>
                          <div className="mt-1 text-xs text-white/80 leading-relaxed">{scenarioTrait.description}</div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {!SCENARIO_EXCLUSIVE_TRAITS[data.scenario] && (
                    <div className="rounded border border-[#C2B280]/30 bg-black/40 p-3 text-sm text-white/60">
                      当前剧本无专属特质
                    </div>
                  )}
                </div>
                <p className="mt-2 text-[11px] text-[#C2B280]/75">该区域随剧本自动生成，不能手动编辑。</p>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">自定义特质（仅 1 个）</label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <input
                    value={data.customTraitName || ''}
                    onChange={e => updateData({ customTraitName: e.target.value })}
                    className="w-full rounded border border-white/20 bg-black/40 p-3 text-sm text-white/80 focus:border-[#C2B280] focus:outline-none"
                    placeholder="特质名称"
                  />
                  <textarea
                    value={data.customTraitDescription || ''}
                    onChange={e => updateData({ customTraitDescription: e.target.value })}
                    rows={3}
                    className="w-full resize-y rounded border border-white/20 bg-black/40 p-3 text-sm text-white/80 focus:border-[#C2B280] focus:outline-none"
                    placeholder="特质描述"
                  />
                </div>
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
                <label className="block text-sm text-white/60 mb-2">性格</label>
                <input
                  type="text"
                  value={data.appearance.bodyType}
                  onChange={e => updateData({ appearance: { ...data.appearance, bodyType: e.target.value } })}
                  className="w-full bg-black/50 border border-white/20 rounded p-3 text-white focus:border-[#C2B280] focus:outline-none"
                  placeholder="例如：谨慎、暴躁、沉默寡言"
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
