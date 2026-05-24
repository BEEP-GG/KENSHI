import { waitUntil } from 'async-wait-until';
import _ from 'lodash';
import {
  Activity,
  Anchor,
  Bone,
  Bug,
  Cpu,
  Eye,
  Flame,
  Ghost,
  Hammer,
  Heart,
  HeartCrack,
  Hexagon,
  Lock,
  Shield,
  Skull,
  Smile,
  Sword,
  Users,
  Wind,
  WineOff,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { cloneElement, useState } from 'react';

// --- Data Models ---

interface BlessingStat {
  name: '力量' | '敏捷' | '感知' | '体质' | '意志' | '智力' | '魅力';
  value: number;
}

interface BlessingOption {
  id: string;
  title: string;
  description: string;
  traitDescription?: string;
  displayRarity?: string;
  rarity: '普通' | '稀有' | '史诗' | '传说';
  icon: React.ReactNode;
  stats?: BlessingStat[];
}

const legendaryUnlockBlessingIds = ['okran_15', 'kral_16', 'narko_15', 'yuri_15'];

interface GodTheme {
  id: string;
  name: string;
  title: string;
  description: string;
  fullDescription: string;
  colorFrom: string;
  colorTo: string;
  borderGlow: string;
  bgGlow: string;
  icon: React.ReactNode;
  blessings: BlessingOption[];
}

const godsData: GodTheme[] = [
  {
    id: 'okran',
    name: '奥克兰',
    title: '光明之神',
    description: '光明与烈火的主宰，赐予纯洁者无上的力量。',
    fullDescription:
      '在这个腐朽的废土上，唯有奥克兰的圣火能净化一切异端。向圣王祈祷，你的利刃将燃起不灭的圣炎，但狂信的代价往往是盲目。',
    colorFrom: 'from-amber-600',
    colorTo: 'to-yellow-300',
    borderGlow: 'hover:border-amber-500',
    bgGlow: 'bg-amber-900/20',
    icon: <Flame className="w-12 h-12 text-amber-500" />,
    blessings: [
      {
        id: 'okran_1',
        title: '圣火之怒',
        description: '所有你持有的武器，都将获得神圣火焰，使非人生物感到恐惧。',
        rarity: '传说',
        icon: <Flame className="w-8 h-8 text-amber-400" />,
        stats: [
          { name: '力量', value: 15 },
          { name: '魅力', value: 6 },
        ],
      },
      {
        id: 'okran_2',
        title: '极致的奥克兰信徒',
        description: '你的信仰坚如神圣胸甲，但大脑也因此拒绝理解除了奥克兰圣典以外的任何复杂事物。',
        rarity: '史诗',
        icon: <Lock className="w-8 h-8 text-yellow-300" />,
        stats: [
          { name: '意志', value: 10 },
          { name: '智力', value: -9 },
        ],
      },
      {
        id: 'okran_3',
        title: '圣火之躯',
        description: '圣洁的火焰重铸了你的骨肉，你成为了行走在废土上的活圣人，水火不侵，百毒不避。',
        rarity: '传说',
        icon: <Shield className="w-8 h-8 text-yellow-200" />,
        stats: [
          { name: '体质', value: 20 },
          { name: '意志', value: 10 },
        ],
      },
      {
        id: 'okran_4',
        title: '惩戒之怒',
        description: '你每次受到攻击，都会激发内心狂热的自毁倾向，以放弃防御为代价进行狂暴反击。',
        rarity: '稀有',
        icon: <Sword className="w-8 h-8 text-amber-300" />,
        stats: [
          { name: '力量', value: 8 },
          { name: '体质', value: -6 },
        ],
      },
      {
        id: 'okran_5',
        title: '圣地的守护巨雕',
        description: '沉浸在保卫圣地的狂热中，挥舞武器的双手充满力量，但过于狂热的眼神令人感到不安。',
        rarity: '史诗',
        icon: <Eye className="w-8 h-8 text-amber-500" />,
        stats: [
          { name: '力量', value: 8 },
          { name: '魅力', value: -8 },
        ],
      },
      {
        id: 'okran_6',
        title: '绝念清修',
        description:
          '拒绝肉体欢愉与一切黑暗诱惑，造物主的爱赋予你超越世俗的坚定意志与洞察力，但你愈发难以共情凡人的情感交涉。',
        rarity: '传说',
        icon: <Heart className="w-8 h-8 text-yellow-300" />,
        stats: [
          { name: '意志', value: 12 },
          { name: '感知', value: 8 },
          { name: '魅力', value: -10 },
        ],
      },
      {
        id: 'okran_7',
        title: '神圣共荣',
        description:
          '铭记绝不伤害同胞的神圣誓约。这份谦卑化作牢不可破的守护力量。你在抵御外敌时坚韧无比，却削弱了对外挥刃杀戮的决意。',
        rarity: '史诗',
        icon: <Users className="w-8 h-8 text-amber-200" />,
        stats: [
          { name: '体质', value: 20 },
          { name: '意志', value: 8 },
          { name: '力量', value: -15 },
        ],
      },
      {
        id: 'okran_8',
        title: '戒缚狂心',
        description:
          '戒除酒精与致幻之物，黑暗再也无法捕食你受约束的大脑，心智如堡垒般坚固。但时刻紧绷的绝对压抑，让你丧失了肉体的轻盈与灵动。',
        rarity: '稀有',
        icon: <WineOff className="w-8 h-8 text-yellow-400" />,
        stats: [
          { name: '意志', value: 20 },
          { name: '敏捷', value: -12 },
        ],
      },
      {
        id: 'okran_9',
        title: '圣火振击',
        description: '奥克兰圣教的招架武艺。在完美格挡的刹那自剑柄引导滚烫的高热，令敌刃连带其手臂剧烈震颤而露出空隙。',
        rarity: '普通',
        icon: <Sword className="w-8 h-8 text-amber-400" />,
        stats: [
          { name: '力量', value: 3 },
          { name: '意志', value: 2 },
        ],
      },
      {
        id: 'okran_10',
        title: '虔诚防守堡垒',
        description: '神圣庄严的完美防守架势。遵循圣教典籍的扎实步法与神圣巨盾，于不可攻破的严防中寻回内心的安宁。',
        rarity: '普通',
        icon: <Shield className="w-8 h-8 text-yellow-300" />,
        stats: [
          { name: '体质', value: 3 },
          { name: '意志', value: 2 },
        ],
      },
      {
        id: 'okran_11',
        title: '金光十字破',
        description: '奥克兰骑士团的突围绝艺。利刃飞速交叉划出耀眼的金光十字，宛若神圣烈焰的屏障般席卷并扫清周边敌人。',
        rarity: '史诗',
        icon: <Flame className="w-8 h-8 text-amber-500" />,
        stats: [
          { name: '敏捷', value: 6 },
          { name: '意志', value: 4 },
        ],
      },
      {
        id: 'okran_12',
        title: '圣教典耀',
        description:
          '奥克兰正统武学。不含任何机甲或神怪诡变，全凭千锤百炼出的身法平衡与关节卸力。以至简至刚的黄金斜角荡开敌方重劈，反手予以正气凛然的制敌一击。',
        rarity: '传说',
        icon: <Sword className="w-8 h-8 text-yellow-200" />,
        stats: [
          { name: '力量', value: 8 },
          { name: '敏捷', value: 5 },
        ],
      },
      {
        id: 'okran_13',
        title: '晨祷吐息',
        description: '每日黎明前的长祷与缓息训练，让你的胸腔与心神都更加稳定。面对混乱时，你更能守住自己的节奏。',
        rarity: '普通',
        icon: <Heart className="w-8 h-8 text-amber-300" />,
        stats: [
          { name: '意志', value: 3 },
          { name: '体质', value: 2 },
        ],
      },
      {
        id: 'okran_14',
        title: '圣印稳握',
        description: '长期持握圣徽与兵刃祷告，使你的手腕更稳、出手更正。你的每次起势都少了一分犹疑，多了一分庄严。',
        rarity: '普通',
        icon: <Shield className="w-8 h-8 text-yellow-300" />,
        stats: [
          { name: '力量', value: 2 },
          { name: '意志', value: 3 },
        ],
      },
      {
        id: 'okran_15',
        title: '圣火誓印',
        description:
          '将奥克兰的圣火誓印烙入灵魂。奖励：自此获得承载奥克兰传说赐福的资格。代价：你的灵魂会被圣火认作唯一火种，未来将难以再被克拉尔、娜尔可与比拉克接纳。此项不消耗特质点，请在赐予角色时再次确认。',
        traitDescription: '奥克兰的圣火誓印已烙入灵魂。你被认作圣火的唯一火种，自此获得承载奥克兰传说赐福的资格。',
        displayRarity: '传说（解锁前置）',
        rarity: '传说',
        icon: <Flame className="w-8 h-8 text-amber-400" />,
      },
    ],
  },
  {
    id: 'kral',
    name: '克拉尔',
    title: '荣誉之神',
    description: '力量与荣耀的化身，在鲜血与碎骨中寻找不朽。',
    fullDescription:
      '懦夫才会寻求庇护！克拉尔护佑着那些在绝境中依然挥舞武器的勇士。流血，怒吼，抛弃可悲的理智与谎言，用敌人的头骨铸就你的王座！',
    colorFrom: 'from-red-900',
    colorTo: 'to-red-500',
    borderGlow: 'hover:border-red-600',
    bgGlow: 'bg-red-950/30',
    icon: <Skull className="w-12 h-12 text-red-500" />,
    blessings: [
      {
        id: 'kral_1',
        title: '不屈战魂',
        description: '在无尽的厮杀中，你逐渐忘却了思考与疼痛。每一次重创只会让你的灵魂更加坚韧，肉体愈发不可摧毁。',
        rarity: '传说',
        icon: <Anchor className="w-8 h-8 text-red-600" />,
        stats: [
          { name: '体质', value: 15 },
          { name: '意志', value: 15 },
          { name: '智力', value: -8 },
        ],
      },
      {
        id: 'kral_3',
        title: '断骨狂怒',
        description:
          '每当你的一根骨头断裂或受到重创，你就会陷入无法克制的嗜血狂怒，力量暴增。但此时你将彻底丧失理智，只知道进攻。',
        rarity: '稀有',
        icon: <Activity className="w-8 h-8 text-orange-200" />,
        stats: [
          { name: '力量', value: 12 },
          { name: '智力', value: -8 },
        ],
      },
      {
        id: 'kral_4',
        title: '蛮荒恶兽',
        description:
          '完全退化成了只懂杀戮的猛兽。代价是你彻底丧失了作为智慧生物沟通与思考的可能，变成了在废土上漫无目的游荡、只靠本能撕咬的骇人怪物。',
        rarity: '传说',
        icon: <Skull className="w-8 h-8 text-red-500" />,
        stats: [
          { name: '力量', value: 20 },
          { name: '体质', value: 18 },
          { name: '意志', value: 18 },
          { name: '智力', value: -30 },
          { name: '魅力', value: -30 },
        ],
      },
      {
        id: 'kral_5',
        title: '血肉狂欢',
        description: '你杀死敌人的鲜血会使你身躯变得更为灵活，但也让你沉醉于血腥味中，忽略了潜藏在暗处的危机。',
        rarity: '稀有',
        icon: <Zap className="w-8 h-8 text-red-400" />,
        stats: [
          { name: '敏捷', value: 7 },
          { name: '感知', value: -5 },
        ],
      },
      {
        id: 'kral_6',
        title: '决斗之誓',
        description:
          '荣誉就是光明正大的对决。你摒弃了所有阴险的潜行与偷袭，永远只从正面宣告死斗的到来。你的力量如破竹之势，但隐秘行动对你而言彻底成为不可能。',
        rarity: '史诗',
        icon: <Sword className="w-8 h-8 text-red-400" />,
        stats: [
          { name: '力量', value: 12 },
          { name: '敏捷', value: -12 },
        ],
      },
      {
        id: 'kral_7',
        title: '破釜的狂吼',
        description:
          '逃兵是克拉尔信徒最大的耻辱。你截断了自己一切逃跑的念头，即使面对深渊也能爆发出不可撼动的狂热意志，但也由于永不退缩而丧失了机动拉扯的能力。',
        rarity: '传说',
        icon: <Activity className="w-8 h-8 text-red-500" />,
        stats: [
          { name: '意志', value: 20 },
          { name: '敏捷', value: -15 },
        ],
      },
      {
        id: 'kral_8',
        title: '无畏迎击',
        description:
          '任何躲藏与掩护都是对荣誉的亵渎。你本能地用胸膛迎向敌人的利刃，这种不要命的刚猛让你体魄强横，却也彻底放弃了所有闪避防守的技巧。',
        rarity: '稀有',
        icon: <Shield className="w-8 h-8 text-orange-400" />,
        stats: [
          { name: '体质', value: 12 },
          { name: '敏捷', value: -8 },
        ],
      },
      {
        id: 'kral_9',
        title: '傲立重击',
        description: '以最为蛮横无脑的硬碰硬武艺。用万钧之势正面劈下，凭借纯粹的力量强行剥夺对手所有的招架空间。',
        rarity: '普通',
        icon: <Sword className="w-8 h-8 text-red-400" />,
        stats: [{ name: '力量', value: 8 }],
      },
      {
        id: 'kral_10',
        title: '不退者',
        description: '誓死不退的磐石招架。双足重重踩入地表，以不退、不避、不偏的绝对钢骨顶着对手的武器正面反震。',
        rarity: '普通',
        icon: <Shield className="w-8 h-8 text-red-300" />,
        stats: [{ name: '体质', value: 8 }],
      },
      {
        id: 'kral_11',
        title: '角斗士的狂澜舞',
        description:
          '在毫无保留的正面比武死斗中汲取战意。刀锋化为连绵不断的恐怖重劈，强硬格挡敌方武器的同时，以无可阻挡的攻势将其压制致死。',
        rarity: '史诗',
        icon: <Activity className="w-8 h-8 text-orange-400" />,
        stats: [
          { name: '力量', value: 6 },
          { name: '体质', value: 4 },
        ],
      },
      {
        id: 'kral_12',
        title: '无上王座',
        description:
          '将生命与荣誉燃烧殆尽。正面完美碰碎格开敌方兵刃的同时爆震全身筋骨，瞬间劈出将山河与生灵斩断的绝命一斩。',
        rarity: '传说',
        icon: <Sword className="w-8 h-8 text-red-600" />,
        stats: [
          { name: '力量', value: 10 },
          { name: '意志', value: 5 },
        ],
      },
      {
        id: 'kral_13',
        title: '孤狼浴血',
        description:
          '继承了克拉尔率领数人殿后面对数万大军的孤高死战意志。敌人越多你反而越不怕，越能在战斗中厮杀敌军，你的痛觉会完全被昂扬战意阻断，然而，这种孤僻的自负也令你脾气暴烈排外。',
        rarity: '史诗',
        icon: <Skull className="w-8 h-8 text-red-500" />,
        stats: [
          { name: '体质', value: 6 },
          { name: '意志', value: 12 },
          { name: '魅力', value: -14 },
        ],
      },
      {
        id: 'kral_14',
        title: '裂骨踏步',
        description: '你学会了以沉重踏步逼近对手，哪怕脚下尽是碎骨与血泥，也绝不让气势有半分后退。',
        rarity: '普通',
        icon: <Activity className="w-8 h-8 text-red-300" />,
        stats: [
          { name: '力量', value: 4 },
          { name: '体质', value: 2 },
        ],
      },
      {
        id: 'kral_15',
        title: '战吼聚血',
        description: '短促而凶狠的战吼能让你的血更快热起来。吼声未必吓得住敌人，却足以让你自己先凶上三分。',
        rarity: '普通',
        icon: <Skull className="w-8 h-8 text-orange-300" />,
        stats: [
          { name: '意志', value: 3 },
          { name: '力量', value: 3 },
        ],
      },
      {
        id: 'kral_16',
        title: '王血战契',
        description:
          '将克拉尔的战契刻入骨髓。奖励：自此获得承载克拉尔传说赐福的资格。代价：你的荣耀会被钉死在正面厮杀的王道上，未来将难以再被奥克兰、娜尔可与比拉克真正接纳。此项不消耗特质点，请在赐予角色时再次确认。',
        traitDescription:
          '克拉尔的王血战契已刻入骨髓。你的荣耀被绑定在正面对决的王道之上，自此获得承载克拉尔传说赐福的资格。',
        displayRarity: '传说（解锁前置）',
        rarity: '传说',
        icon: <Skull className="w-8 h-8 text-red-500" />,
      },
    ],
  },
  {
    id: 'narko',
    name: '娜尔可',
    title: '黑暗之神',
    description: '潜藏于阴影中的魔神，赐予那些敢于直面深渊之人狡诈与幻化。',
    fullDescription:
      '光明太过刺眼，它掩盖了谎言。投入黑夜的怀抱吧，娜尔可将教导你如何在敌人的影子里起舞，或者在无声中诡异地活下去。',
    colorFrom: 'from-purple-950',
    colorTo: 'to-indigo-500',
    borderGlow: 'hover:border-indigo-500',
    bgGlow: 'bg-purple-950/30',
    icon: <Ghost className="w-12 h-12 text-indigo-400" />,
    blessings: [
      {
        id: 'narko_1',
        title: '虚空潜行',
        description: '在阴影中完全隐身，如同鬼魅一般收割生命。',
        rarity: '传说',
        icon: <Eye className="w-8 h-8 text-indigo-300" />,
        stats: [{ name: '敏捷', value: 20 }],
      },
      {
        id: 'narko_2',
        title: '梦魇化身',
        description:
          '你的存在本身就是一种恐惧，直视你双眼的生物会感到一种刺骨的阴森。不过，连你的盟友也会由于生理不适对你敬而远之。',
        rarity: '史诗',
        icon: <Ghost className="w-8 h-8 text-purple-400" />,
        stats: [
          { name: '感知', value: 10 },
          { name: '魅力', value: -10 },
        ],
      },
      {
        id: 'narko_3',
        title: '原罪诱惑',
        description:
          '你散发着迷人又危险的深渊气息，能轻易蛊惑意志薄弱的敌人听命于你，但也会引起狂热者的欲望，对你进行过度占有，占有你的一切。',
        rarity: '稀有',
        icon: <Activity className="w-8 h-8 text-violet-300" />,
        stats: [
          { name: '魅力', value: 12 },
          { name: '意志', value: -8 },
        ],
      },
      {
        id: 'narko_4',
        title: '暗夜收割者',
        description: '在黑夜中杀戮能为你提供源源不断的精力，你的动作会变得异常敏捷，但当黎明降临时你会变得虚弱无力。',
        rarity: '史诗',
        icon: <Wind className="w-8 h-8 text-indigo-200" />,
        stats: [
          { name: '敏捷', value: 10 },
          { name: '体质', value: -8 },
        ],
      },
      {
        id: 'narko_5',
        title: '毒刃之吻',
        description: '你所持有的武器都将获得毒液。',
        rarity: '稀有',
        icon: <Sword className="w-8 h-8 text-purple-500" />,
        stats: [{ name: '敏捷', value: 4 }],
      },
      {
        id: 'narko_6',
        title: '阴影重塑',
        description: '当你处于阴影中时，你的伤口会以肉眼可见的速度愈合，代价是哪怕一点点阳光也会灼伤你的皮肤。',
        rarity: '史诗',
        icon: <Shield className="w-8 h-8 text-violet-400" />,
        stats: [
          { name: '体质', value: 8 },
          { name: '力量', value: -8 },
        ],
      },
      {
        id: 'narko_7',
        title: '梦魇狂呓',
        description:
          '如果敌人惧怕你，就能够使敌人在梦中感受到你的恐惧，让其陷入噩梦循环，痛不欲生。作为代偿，你自己的眼睑也将被缝入无边的黑夜，无法再忍受哪怕一丝的烈目直视。',
        rarity: '传说',
        icon: <Smile className="w-8 h-8 text-fuchsia-400" />,
        stats: [
          { name: '魅力', value: 15 },
          { name: '意志', value: -15 },
        ],
      },
      {
        id: 'narko_8',
        title: '暗巷毒蛇',
        description:
          '你完全拥抱了黑暗的狡诈。你习惯像肮脏的老鼠一样潜伏，精通常人所不齿的撒沙子、涂劣毒与背后敲闷棍。长期的低劣老千生活让你的身法异常灵活，但也使你的肉体越发佝偻虚弱不堪。',
        rarity: '传说',
        icon: <Skull className="w-8 h-8 text-purple-500" />,
        stats: [
          { name: '敏捷', value: 15 },
          { name: '感知', value: 12 },
          { name: '体质', value: -15 },
        ],
      },
      {
        id: 'narko_9',
        title: '落影佯退步',
        description:
          '极具欺骗性的娜尔可流步法。在兵刃相碰时做出一副气力不支倒退数步的狼狈滑步，诱骗对手露头急追，实则蓄势待发。',
        rarity: '普通',
        icon: <Wind className="w-8 h-8 text-indigo-400" />,
        stats: [{ name: '敏捷', value: 5 }],
      },
      {
        id: 'narko_10',
        title: '诡计佯格',
        description: '故意在防御中留出重大空门引诱合击，让敌刃擦破残影，而你的副手早已如同毒蛇吐信在暗度陈仓。',
        rarity: '普通',
        icon: <Sword className="w-8 h-8 text-violet-400" />,
        stats: [{ name: '感知', value: 5 }],
      },
      {
        id: 'narko_11',
        title: '回马毒刺',
        description:
          '黑暗的以退为进武艺之精髓。在完美卸下力道的闪避中，借由诡异无序的反转腰肌折回，以致命的剧毒短刃斜刺急躁追兵的薄弱缝隙。',
        rarity: '史诗',
        icon: <Activity className="w-8 h-8 text-purple-400" />,
        stats: [
          { name: '敏捷', value: 7 },
          { name: '感知', value: 3 },
        ],
      },
      {
        id: 'narko_12',
        title: '魅影流沙',
        description:
          '赐予你能够在战斗中无形散播令人精神恍惚的迷雾幻影，令当面的敌手混淆真实与幻象。虚虚实实让人完全无法捉摸踪迹。完美招架敌刃的同时进行最狠辣阴毒的反噬一击。',
        rarity: '传说',
        icon: <Ghost className="w-8 h-8 text-indigo-300" />,
        stats: [
          { name: '敏捷', value: 12 },
          { name: '感知', value: 5 },
        ],
      },
      {
        id: 'narko_13',
        title: '影隙贴步',
        description: '你习惯在阴影边缘挪步借位，让自己的轮廓总比别人预想中更淡一拍，仿佛总差半寸才会被抓住。',
        rarity: '普通',
        icon: <Wind className="w-8 h-8 text-violet-300" />,
        stats: [
          { name: '敏捷', value: 3 },
          { name: '感知', value: 2 },
        ],
      },
      {
        id: 'narko_14',
        title: '夜瞳余辉',
        description: '在昏暗环境里待得太久，你的眼睛已经学会追逐微弱反光。黑夜未必属于你，但你比常人更不怕它。',
        rarity: '普通',
        icon: <Eye className="w-8 h-8 text-indigo-300" />,
        stats: [
          { name: '感知', value: 5 },
          { name: '意志', value: 1 },
        ],
      },
      {
        id: 'narko_15',
        title: '暗夜圣痕',
        description:
          '让娜尔可的暗夜圣痕覆盖你的影子。奖励：自此获得承载娜尔可传说赐福的资格。代价：你的灵魂会逐渐与黑夜同流，未来将难以再被奥克兰、克拉尔与比拉克真正接纳。此项不消耗特质点，请在赐予角色时再次确认。',
        traitDescription: '娜尔可的暗夜圣痕已覆盖你的影子。你的灵魂被黑夜接纳，自此获得承载娜尔可传说赐福的资格。',
        displayRarity: '传说（解锁前置）',
        rarity: '传说',
        icon: <Ghost className="w-8 h-8 text-indigo-300" />,
      },
    ],
  },
  {
    id: 'chitrin',
    name: '奇特林',
    title: '拾荒者',
    description: '迷失于旧帝国废墟中的幽魂，掌握着被遗忘的伟大科技。',
    fullDescription:
      '血肉苦弱，唯有钢铁永存！奇特林并非神明，而是文明的残响。他将指引你发掘旧日的主宰，用极端的方式拥抱机械意志。',
    colorFrom: 'from-emerald-950',
    colorTo: 'to-teal-400',
    borderGlow: 'hover:border-teal-400',
    bgGlow: 'bg-emerald-950/30',
    icon: <Cpu className="w-12 h-12 text-teal-400" />,
    blessings: [
      {
        id: 'chitrin_1',
        title: '维基百科云玩家',
        description: '你脑子里装着整个世界的科技蓝图和秘密，但长期脱离体力劳动让你变得手无缚鸡之力。',
        rarity: '传说',
        icon: <Hexagon className="w-8 h-8 text-teal-300" />,
        stats: [
          { name: '智力', value: 25 },
          { name: '力量', value: -10 },
          { name: '体质', value: -10 },
          { name: '意志', value: -10 },
        ],
      },
      {
        id: 'chitrin_3',
        title: 'AI寻路大师',
        description: '你总能找到地图的“最优解”，以诡异步伐高速移动，但这种非人感让你产生了严重的社交障碍。',
        rarity: '稀有',
        icon: <Activity className="w-8 h-8 text-emerald-400" />,
        stats: [
          { name: '敏捷', value: 9 },
          { name: '魅力', value: -8 },
        ],
      },
      {
        id: 'chitrin_4',
        title: '废铁义体改造',
        description:
          '你丧心病狂地用生锈的骨人零件替换了自己完好的肢体，获得了不知疲倦的金属力量，但持续的排异反应总是让你痛不欲生。',
        rarity: '稀有',
        icon: <Cpu className="w-8 h-8 text-teal-200" />,
        stats: [
          { name: '力量', value: 12 },
          { name: '体质', value: -6 },
        ],
      },
      {
        id: 'chitrin_5',
        title: '超重型装甲偏执狂',
        description: '你把所有能找到的铁板都焊在了身上，防御力惊人得像个移动的铁罐头，但也笨重得像个装满矿石的背篓。',
        rarity: '史诗',
        icon: <Shield className="w-8 h-8 text-emerald-300" />,
        stats: [
          { name: '体质', value: 18 },
          { name: '敏捷', value: -12 },
        ],
      },
      {
        id: 'chitrin_6',
        title: '重心流线斜架',
        description:
          '一门寻常的持械斜挡架势。在兵刃相碰时稍微偏转一下刃面倒角，让迎面砸下的蛮力顺着倾斜方向滑离少许，免去了蛮力硬撞。',
        rarity: '普通',
        icon: <Cpu className="w-8 h-8 text-teal-300" />,
        stats: [{ name: '智力', value: 5 }],
      },
      {
        id: 'chitrin_7',
        title: '借力打力',
        description:
          '一招简单的借力反推。在双方兵仗胶着角力的一刹那，顺着对手发力不稳时的方向顺势推挡，使其重心微晃从而抢回些许周旋主动。',
        rarity: '普通',
        icon: <Zap className="w-8 h-8 text-emerald-300" />,
        stats: [{ name: '力量', value: 5 }],
      },
      {
        id: 'chitrin_8',
        title: '破招腕隙击',
        description: '精确定位对手出招变式时的发力死角并以巧劲击之，可以引导其中途换招不顺、被迫回防。',
        rarity: '史诗',
        icon: <Activity className="w-8 h-8 text-teal-400" />,
        stats: [
          { name: '智力', value: 6 },
          { name: '敏捷', value: 4 },
        ],
      },
      {
        id: 'chitrin_9',
        title: '料敌机先',
        description: '通过洞悉对手微妙的战术趋向，在对方出招前的一瞬即做出了完美的拦截和闪避，达成料敌机先的神异妙用。',
        rarity: '传说',
        icon: <Hexagon className="w-8 h-8 text-emerald-200" />,
        stats: [
          { name: '智力', value: 10 },
          { name: '感知', value: 5 },
        ],
      },
      {
        id: 'chitrin_10',
        title: '蛛母芯片',
        description:
          '奇特林指引你在大脑中编译了旧帝国仿生机械蜘蛛的微缩蓝图。你可以用废弃铁片、骨人遗骸和劣质电池制作出一只听从你的小型军用铁蜘蛛，代价是你将失去了对温情、浪漫及凡人哀乐的感受。',
        rarity: '史诗',
        icon: <Cpu className="w-8 h-8 text-teal-400" />,
        stats: [
          { name: '智力', value: 19 },
          { name: '感知', value: -12 },
        ],
      },
      {
        id: 'chitrin_11',
        title: '静电防卫',
        description:
          '你现在的身体周围带有轻微电流，在战斗中它可以静电触发使对方的投掷物发生微小扭转，使其偏离原先轨迹，靠近你的人会受到轻微电击但不致命，难以与你相拥。',
        rarity: '史诗',
        icon: <Zap className="w-8 h-8 text-emerald-300" />,
        stats: [
          { name: '敏捷', value: 14 },
          { name: '魅力', value: -10 },
        ],
      },
      {
        id: 'chitrin_12',
        title: '精校备件',
        description: '你能在交锋间隙迅速校准关节与传动结构，让每一次动作都更精确顺滑。',
        rarity: '普通',
        icon: <Cpu className="w-8 h-8 text-emerald-300" />,
        stats: [
          { name: '智力', value: 2 },
          { name: '敏捷', value: 3 },
        ],
      },
      {
        id: 'chitrin_13',
        title: '扭矩校准',
        description: '你对发力角度和承重点有着近乎本能的计算习惯。哪怕是最朴素的一次格挡，也会被你调整到更省力的位置。',
        rarity: '普通',
        icon: <Cpu className="w-8 h-8 text-teal-300" />,
        stats: [
          { name: '智力', value: 3 },
          { name: '力量', value: 3 },
        ],
      },
    ],
  },
  {
    id: 'yuri',
    name: '比拉克',
    title: '恶魔亲王',
    description: '来自异世的扭曲恶魔，用理智与容貌换取血肉恩赐。',
    fullDescription:
      '不要直视它的全貌。比拉克是来自未知维度的深渊亲王，它乐于赐予凡人无可匹敌的绝对单项力量，前提是你愿意接受肢体的异化、感官的扭曲与灵魂的哀嚎。',
    colorFrom: 'from-fuchsia-900',
    colorTo: 'to-pink-600',
    borderGlow: 'hover:border-pink-600',
    bgGlow: 'bg-fuchsia-950/30',
    icon: <Bug className="w-12 h-12 text-pink-500" />,
    blessings: [
      {
        id: 'yuri_1',
        title: '喙嘴猩猩之手',
        description:
          '双手异化成了如同喙嘴猩猩般臃肿粗壮的畸形巨爪。狂暴的肌肉纤维使你的抓握力强大，足以生生握碎精铁铠甲；但骨骼与关节结构的彻底异化变粗，精细度操作对你而言完全成了灾难。',
        rarity: '传说',
        icon: <Bug className="w-8 h-8 text-pink-400" />,
        stats: [
          { name: '力量', value: 18 },
          { name: '敏捷', value: -8 },
          { name: '魅力', value: -12 },
        ],
      },
      {
        id: 'yuri_2',
        title: '骨犬之首',
        description:
          '你的头颅硬生生变异成了骨犬的模样，撕咬力惊人且获得了野兽感官，但你现在只能发出令人毛骨悚然的咆哮，并经常不受控制地流出恶臭口水。',
        rarity: '史诗',
        icon: <Skull className="w-8 h-8 text-fuchsia-400" />,
        stats: [
          { name: '力量', value: 18 },
          { name: '智力', value: -8 },
          { name: '魅力', value: -14 },
        ],
      },
      {
        id: 'yuri_3',
        title: '喙嘴盲壳',
        description:
          '你的眼睛退化融合，面部和胸口长出了喙嘴兽般坚硬的肿胀角质层。你几乎免疫了头部的致命伤，但视野变得极其狭窄且外貌骇人。',
        rarity: '史诗',
        icon: <Shield className="w-8 h-8 text-pink-300" />,
        stats: [
          { name: '体质', value: 22 },
          { name: '感知', value: -14 },
          { name: '魅力', value: -14 },
        ],
      },
      {
        id: 'yuri_4',
        title: '猩红触手增生',
        description:
          '每当受到重伤，你的伤口会爆发出令人作呕的肉色触手进行高速重组。这让你获得超速再生，但每次增生都会伴杂着精神剧痛，让你离人类越来越远。',
        rarity: '传说',
        icon: <Activity className="w-8 h-8 text-fuchsia-500" />,
        stats: [
          { name: '体质', value: 25 },
          { name: '意志', value: -14 },
          { name: '魅力', value: -25 },
        ],
      },
      {
        id: 'yuri_5',
        title: '寄生复眼丛聚',
        description:
          '你的脸颊和脖颈上长出了密密麻麻的深紫色寄生复眼，这赋予了你极其夸张的全方位动态视力，但也让所有看到你的人感到强烈的生理恶心。',
        rarity: '稀有',
        icon: <Eye className="w-8 h-8 text-pink-200" />,
        stats: [
          { name: '感知', value: 22 },
          { name: '敏捷', value: 8 },
          { name: '魅力', value: -25 },
        ],
      },
      {
        id: 'yuri_6',
        title: '乌龟身躯',
        description: '身躯变为沼泽乌龟的龟壳，你的胸与背被龟壳包围，获得沉重的龟壳重甲保护。但也因此行动缓慢。',
        rarity: '史诗',
        icon: <Shield className="w-8 h-8 text-pink-500" />,
        stats: [
          { name: '体质', value: 15 },
          { name: '意志', value: 10 },
          { name: '敏捷', value: -12 },
        ],
      },
      {
        id: 'yuri_7',
        title: '骨骼倒生逆抓',
        description:
          '多关节倒生的扭曲逆手缠斗绝学。你的双肩与腕部可以任意脱臼，以非人的绝对诡异姿态死死绞住缠紧对方的武器。',
        rarity: '普通',
        icon: <Bug className="w-8 h-8 text-pink-300" />,
        stats: [{ name: '体质', value: 5 }],
      },
      {
        id: 'yuri_8',
        title: '厚皮爆弹',
        description:
          '当厚厚的几层角质异变体表在受创受劈时瞬间隆起抗压，爆发出刺耳的血肉挤压撕裂声，以纯粹弹性力道反震将利刃弹开。',
        rarity: '普通',
        icon: <Bone className="w-8 h-8 text-fuchsia-300" />,
        stats: [{ name: '体质', value: 5 }],
      },
      {
        id: 'yuri_9',
        title: '裂吻狂噬',
        description:
          '以身体突兀裂开的骨刺大嘴或是狂狂生长的畸形副手，生生卡死劈来的长枪大剑。在骨骼的剧烈滑擦火花中暴虐反嘴撕裂对方筋膜。',
        rarity: '史诗',
        icon: <Skull className="w-8 h-8 text-pink-400" />,
        stats: [
          { name: '力量', value: 6 },
          { name: '体质', value: 4 },
        ],
      },
      {
        id: 'yuri_10',
        title: '戮战刺椎',
        description:
          '比拉克赐予的畸变肉身斗技。当你架刀格挡时，体侧肋下突兀暴长出数根狰狞尖锐的角质硬刺，如闭合的巨兽之吻般死死夹咬住对方的长兵重击，并顺势进行毁灭性撕扯。',
        rarity: '传说',
        icon: <Bug className="w-8 h-8 text-fuchsia-500" />,
        stats: [
          { name: '体质', value: 10 },
          { name: '力量', value: 5 },
        ],
      },
      {
        id: 'yuri_11',
        title: '角质偏振',
        description: '异变角质会在受击前短促收缩并偏导冲击，缓和正面打击带来的创伤，让你在混战中更能硬抗一线。',
        rarity: '普通',
        icon: <Shield className="w-8 h-8 text-pink-300" />,
        stats: [
          { name: '体质', value: 3 },
          { name: '敏捷', value: 1 },
        ],
      },
      {
        id: 'yuri_12',
        title: '副肢痉挛',
        description:
          '你的腋下与肋侧会在激战时短暂鼓起畸形肉芽，像是有什么副肢即将破体而出。它们尚未真正成形，却已足够干扰对手的判断并帮你在贴身缠斗中抢出半拍先机。',
        rarity: '普通',
        icon: <Bug className="w-8 h-8 text-pink-300" />,
        stats: [
          { name: '敏捷', value: 2 },
          { name: '力量', value: 1 },
        ],
      },
      {
        id: 'yuri_13',
        title: '副肢破茧',
        description:
          '原本只会痉挛鼓起的畸形肉芽终于撕开皮肉，长成数根短促而暴躁的半成形副肢。它们还不足以独立挥击，却已能在贴身纠缠时替你撕、扯、架、绊，让你比先前更加危险。',
        rarity: '史诗',
        icon: <Bug className="w-8 h-8 text-fuchsia-400" />,
        stats: [
          { name: '敏捷', value: 5 },
          { name: '力量', value: 3 },
          { name: '体质', value: 2 },
        ],
      },
      {
        id: 'yuri_14',
        title: '副肢暴君',
        description:
          '那些半成形副肢终于不再满足于贴身撕扯。它们彻底破体而出，沿着肋侧与背脊长成数根粗暴、神经质且充满恶意的畸变副臂。它们会在你格挡、抱缠与扑杀时同时发力，让你宛如一头多肢掠食的深渊怪物。',
        rarity: '传说',
        icon: <Bug className="w-8 h-8 text-pink-500" />,
        stats: [
          { name: '力量', value: 8 },
          { name: '敏捷', value: 6 },
          { name: '体质', value: 4 },
          { name: '魅力', value: -10 },
        ],
      },
      {
        id: 'yuri_15',
        title: '渊胎契印',
        description:
          '让比拉克将渊胎契印缝入你的血肉。奖励：自此获得承载比拉克传说赐福的资格。代价：你的身躯会被深渊视作孕育畸变的温床，未来将难以再被奥克兰、克拉尔与娜尔可真正接纳。此项不消耗特质点，请在赐予角色时再次确认。',
        traitDescription: '比拉克的渊胎契印已缝入你的血肉。你的身躯被深渊认作温床，自此获得承载比拉克传说赐福的资格。',
        displayRarity: '传说（解锁前置）',
        rarity: '传说',
        icon: <HeartCrack className="w-8 h-8 text-pink-400" />,
      },
    ],
  },
  {
    id: 'beep',
    name: '比普',
    title: '欢乐之神',
    description: '废土最强（自封）战士，带来打破第四面墙的离谱恩赐。',
    fullDescription:
      '哔！比普是最强的！跟随比普的脚步，你将获得打破第四面墙的奇妙力量。别太把这个烂世界当回事，毕竟快乐才是废土生存的第一法则！',
    colorFrom: 'from-lime-500',
    colorTo: 'to-green-400',
    borderGlow: 'hover:border-green-500',
    bgGlow: 'bg-lime-950/30',
    icon: <Smile className="w-12 h-12 text-green-400" />,
    blessings: [
      {
        id: 'beep_kral_2',
        title: '脑干缺失的狂战士',
        description: '你把所有时间都用来挥舞重武器，肌肉填满了本该属于大脑的空间，数数超过10个指头就会头痛。',
        rarity: '史诗',
        icon: <Bone className="w-8 h-8 text-red-400" />,
        stats: [
          { name: '力量', value: 10 },
          { name: '智力', value: -9 },
        ],
      },
      {
        id: 'beep_chitrin_2',
        title: '机械飞升狂热症',
        description: '你坚信“血肉苦弱，机械飞升”，用钢铁意志强迫自己无视痛苦，但也因此搞垮了脆弱的肉体。',
        rarity: '史诗',
        icon: <Hammer className="w-8 h-8 text-teal-400" />,
        stats: [
          { name: '意志', value: 9 },
          { name: '体质', value: -8 },
        ],
      },
      {
        id: 'beep_1',
        title: '废土纸片忍者',
        description: '你的速度快如鬼魅，但骨头脆得像饼干，可能一阵风就能让你骨折。',
        rarity: '史诗',
        icon: <Wind className="w-8 h-8 text-green-300" />,
        stats: [
          { name: '敏捷', value: 10 },
          { name: '体质', value: -9 },
        ],
      },
      {
        id: 'beep_2',
        title: '迫害妄想狙击手',
        description: '你总觉得有人要害你，因此练就了鹰一般的锐利视力，但你那多疑的眼神和鬼祟的举止让所有人都躲着你。',
        rarity: '稀有',
        icon: <Eye className="w-8 h-8 text-lime-300" />,
        stats: [
          { name: '感知', value: 9 },
          { name: '魅力', value: -9 },
        ],
      },
      {
        id: 'beep_3',
        title: '虚荣谷的娇贵偶像',
        description: '你的容貌是这片废土上唯一的亮色，人见人爱，但身体也像温室花朵般脆弱，淋点酸雨就可能当场去世。',
        rarity: '史诗',
        icon: <Ghost className="w-8 h-8 text-lime-200" />,
        stats: [
          { name: '魅力', value: 9 },
          { name: '体质', value: -10 },
        ],
      },
      {
        id: 'beep_4',
        title: '蜂巢传销之王',
        description: '你的口才堪比最顶级的蜂巢族商人，能把沙子卖给沙匪，但自尊心像玻璃一样脆弱，一句重话就能让你崩溃。',
        rarity: '稀有',
        icon: <Activity className="w-8 h-8 text-green-500" />,
        stats: [
          { name: '魅力', value: 10 },
          { name: '意志', value: -8 },
        ],
      },
      {
        id: 'beep_5',
        title: '读档预知者',
        description: '你似乎能预见“读档”前的未来以避开危险，但也因此十分依赖“SL大法”，稍有不顺就想放弃。',
        rarity: '传说',
        icon: <Eye className="w-8 h-8 text-lime-400" />,
        stats: [
          { name: '感知', value: 10 },
          { name: '意志', value: -10 },
        ],
      },
      {
        id: 'beep_6',
        title: '迷之自信',
        description:
          '从比普那里领悟到的绝伦勇气。即使面对最强之敌，你也能坚信自己已然天下无敌并大模大样地宣告此言，这匪夷所思的狂妄气势会强行干涉对手理智，令对方满脸困惑并产生战术迟疑。',
        rarity: '传说',
        icon: <Smile className="w-8 h-8 text-green-400" />,
        stats: [
          { name: '魅力', value: 12 },
          { name: '智力', value: -12 },
        ],
      },
      {
        id: 'beep_7',
        title: '‘看，有大铁块！’',
        description:
          '在白刃交锋最胶着的刹那，你突然伸手指着敌手背后，面露极其生动的惊愕大喊有情况。由于演技过于饱满，部分敌人会极其白痴地分神并试图转头查看。',
        rarity: '普通',
        icon: <Smile className="w-8 h-8 text-green-300" />,
        stats: [{ name: '魅力', value: 5 }],
      },
      {
        id: 'beep_8',
        title: '侧步巧摔',
        description:
          '在进行刀法腾挪或战术闪退时，由于步法错乱而极其狼狈地向前绊倒。但这种极具喜剧效果且出其不意的倒地姿势，却往往能奇迹般偏开头颅避开致命重斩，甚至刚好摔出去绊倒急停的追逐强敌。',
        rarity: '普通',
        icon: <Activity className="w-8 h-8 text-lime-300" />,
        stats: [{ name: '敏捷', value: 5 }],
      },
      {
        id: 'beep_9',
        title: '至强虚架',
        description:
          '大张旗鼓地摆出充满神秘威严的至强武学起手姿势。用不可一世的至强傲气震慑并吸引敌方的全副眼光，趁其一头雾水并试图防备你这旷世绝学的电光石火间突然出手。',
        rarity: '史诗',
        icon: <Smile className="w-8 h-8 text-lime-400" />,
        stats: [
          { name: '魅力', value: 6 },
          { name: '敏捷', value: 4 },
        ],
      },
      {
        id: 'beep_10',
        title: '乱阵疯魔本能舞',
        description:
          '在退无可退的极危刹那，触发最纯粹惊慌的乱抡自保。闭上双眼拼命将手中兵刃转成风车般的无套路狂抡，由于在混沌心境中连你都全然不知下一寸劈向哪里，即便是宗师武学也常常无从剖解应对。',
        rarity: '传说',
        icon: <Wind className="w-8 h-8 text-green-500" />,
        stats: [
          { name: '敏捷', value: 10 },
          { name: '魅力', value: 5 },
        ],
      },
      {
        id: 'beep_11',
        title: '附魔师的元素之力',
        description: '你坚信自己掌握了元素附魔，挥刃时总带着华丽幻光。威慑感上升，但心神也更容易被炫目幻象分散。',
        rarity: '史诗',
        icon: <Zap className="w-8 h-8 text-lime-400" />,
        stats: [
          { name: '魅力', value: 4 },
          { name: '感知', value: 2 },
          { name: '意志', value: -2 },
        ],
      },
      {
        id: 'beep_12',
        title: '自带BGM的幸存者',
        description: '你的脑海里总在播放激昂战歌。节奏感让出手更果断，但也会偶尔上头冒进。',
        rarity: '普通',
        icon: <Activity className="w-8 h-8 text-green-400" />,
        stats: [
          { name: '敏捷', value: 3 },
          { name: '意志', value: 2 },
          { name: '智力', value: -2 },
        ],
      },
      {
        id: 'beep_13',
        title: '蜂巢族顶级VIP',
        description: '你和蜂巢商路有着说不清的关系，走到哪都像熟客。谈判更顺，但也容易被当成冤大头盯上。',
        rarity: '普通',
        icon: <Users className="w-8 h-8 text-lime-300" />,
        stats: [
          { name: '魅力', value: 4 },
          { name: '智力', value: 1 },
          { name: '体质', value: -1 },
        ],
      },
      {
        id: 'beep_14',
        title: '物理超度光环',
        description: '你把“超度”理解成了高强度物理劝导。挥击更有压迫感，但说服能力并未随之增长。',
        rarity: '史诗',
        icon: <Hammer className="w-8 h-8 text-green-500" />,
        stats: [
          { name: '力量', value: 4 },
          { name: '意志', value: 1 },
          { name: '魅力', value: -2 },
        ],
      },
      {
        id: 'beep_15',
        title: '异次元口袋',
        description: '你总能从“口袋”里掏出奇怪但刚好有用的东西。临场应变变快，但专注度会被杂念拉低。',
        rarity: '普通',
        icon: <Hexagon className="w-8 h-8 text-lime-400" />,
        stats: [
          { name: '感知', value: 3 },
          { name: '智力', value: 2 },
          { name: '意志', value: -2 },
        ],
      },
      {
        id: 'beep_16',
        title: '卡墙bug',
        description: '你偶尔能借地形做出离谱走位，短暂避开致命角度，但失败时会把自己送进更糟的位置。',
        rarity: '普通',
        icon: <Bug className="w-8 h-8 text-lime-300" />,
        stats: [
          { name: '敏捷', value: 2 },
          { name: '感知', value: -1 },
        ],
      },
      {
        id: 'beep_17',
        title: '沼泽绝命毒师',
        description: '你在沼泽学会了粗糙但有效的药剂处理，面对混乱局面时更冷静，却带着挥之不去的毒瘾后遗。',
        rarity: '普通',
        icon: <Flame className="w-8 h-8 text-green-400" />,
        stats: [
          { name: '智力', value: 3 },
          { name: '意志', value: 2 },
          { name: '体质', value: -2 },
        ],
      },
      {
        id: 'beep_18',
        title: '抖M',
        description: '疼痛阈值被你练到离谱，挨打时反而不容易崩溃，但战斗判断会受情绪影响出现偏差。',
        rarity: '普通',
        icon: <Skull className="w-8 h-8 text-lime-400" />,
        stats: [
          { name: '体质', value: 4 },
          { name: '意志', value: 1 },
          { name: '智力', value: -2 },
        ],
      },
      {
        id: 'beep_19',
        title: '沼泽淫纹',
        description: '诡异纹路会在情绪波动时发亮，能扰乱对手注意力，也让你更难维持稳定心态。',
        rarity: '史诗',
        icon: <HeartCrack className="w-8 h-8 text-green-300" />,
        stats: [
          { name: '魅力', value: 4 },
          { name: '敏捷', value: 1 },
          { name: '意志', value: -2 },
        ],
      },
      {
        id: 'beep_20',
        title: '嚼沙者',
        description: '你把风沙当调味料，恶劣环境反而让你安心。续航更稳，但多少影响了正常思考。',
        rarity: '普通',
        icon: <Wind className="w-8 h-8 text-lime-300" />,
        stats: [
          { name: '体质', value: 2 },
          { name: '智力', value: -1 },
        ],
      },
    ],
  },
  {
    id: 'ken',
    name: '肯恩',
    title: '回忆之神',
    description: '为你植入一段子虚乌有的离奇过往，让你掌握对应能力。',
    fullDescription:
      '虚假的记忆也是记忆，只要你坚信不疑。肯恩会在你的脑海中强行塞入一段段荒诞而又无比真实的过往经历。你将继承这些“记忆”带来的肌肉习惯和独特能力，当然，也包括由此引发的精神创伤与性格扭曲。',
    colorFrom: 'from-blue-900',
    colorTo: 'to-cyan-400',
    borderGlow: 'hover:border-cyan-400',
    bgGlow: 'bg-blue-950/30',
    icon: <Activity className="w-12 h-12 text-cyan-400" />,
    blessings: [
      {
        id: 'ken_1',
        title: '轮回谷的终极沙袋',
        description: '你记得自己在重生镇当了十年奴隶，你的皮被打得比盔甲还厚，但常年的殴打也让你关节僵硬，动作迟缓。',
        rarity: '稀有',
        icon: <Shield className="w-8 h-8 text-blue-300" />,
        stats: [
          { name: '体质', value: 10 },
          { name: '敏捷', value: -9 },
        ],
      },
      {
        id: 'ken_2',
        title: '尸体负重马拉松选手',
        description:
          '你的脑海里充满了进行“扛尸逃课法”的虚假记忆，你获得了怪物般的力量，但养成了低头看脚下的习惯，经常对周围的危险视而不见。',
        rarity: '稀有',
        icon: <Activity className="w-8 h-8 text-cyan-300" />,
        stats: [
          { name: '力量', value: 9 },
          { name: '感知', value: -8 },
        ],
      },
      {
        id: 'ken_3',
        title: '剥皮屋的狂热学徒',
        description:
          '脑内盘旋着在剥皮屋剥制“人皮外衣”的惊悚记忆。你继承了对生物外皮与关节解剖熟练的技术，战斗中总能精准顺着敌人防具缝隙和肌肉受力死角进行冷酷的拆卸割裂。代价是这种执念让你神色诡异。',
        rarity: '史诗',
        icon: <Bug className="w-8 h-8 text-cyan-400" />,
        stats: [
          { name: '敏捷', value: 12 },
          { name: '智力', value: 10 },
          { name: '魅力', value: -15 },
        ],
      },
      {
        id: 'ken_4',
        title: '沼泽镇的千胜赌神',
        description:
          '你坚信自己曾在沼泽镇连续赢了一千把赌局，这种虚妄的经历让你信心爆棚，甚至连死神都敢直视，但也让你狂妄自大，常常做出送命的决策。',
        rarity: '传说',
        icon: <Hexagon className="w-8 h-8 text-blue-400" />,
        stats: [
          { name: '意志', value: 20 },
          { name: '魅力', value: 10 },
          { name: '感知', value: -15 },
        ],
      },
      {
        id: 'ken_5',
        title: '迷雾区幸存者',
        description:
          '明明没有离开过骨人城，你却有在迷雾岛被雾人追杀了三年的记忆。你已经对所有的恐惧与痛楚都感到麻木，但深夜里脑海总是回响着惨叫。',
        rarity: '史诗',
        icon: <Ghost className="w-8 h-8 text-cyan-200" />,
        stats: [
          { name: '意志', value: 15 },
          { name: '体质', value: 12 },
          { name: '智力', value: -12 },
        ],
      },
      {
        id: 'ken_6',
        title: '余烬幽魂走马斩',
        description:
          '在刀剑寒芒亮起时走马灯地闪过古战场不传剑谱，鬼使神差、神游物外地使出恰置虚空的一记平淡斩击，优雅且轻巧地破除死局。',
        rarity: '普通',
        icon: <Ghost className="w-8 h-8 text-cyan-300" />,
        stats: [{ name: '意志', value: 5 }],
      },
      {
        id: 'ken_7',
        title: '顶级消力式',
        description:
          '你突然领悟了过去一位师傅教导的消力技巧。现在对手重剑砸来、大刀横劈的电光时刻，可以顶级消力使肌肉微小震颤借向滑导，将致死重击全数卸散导入大地。',
        rarity: '史诗',
        icon: <Lock className="w-8 h-8 text-blue-300" />,
        stats: [
          { name: '意志', value: 15 },
          { name: '体质', value: 5 },
          { name: '敏捷', value: 10 },
        ],
      },
      {
        id: 'ken_8',
        title: '沼泽客赌命闪截',
        description:
          '在长兵相胶、刀光过眼的千钧一发时刻爆发出狂徒的赌瘾。上盘不着防守全凭神闪，身形以近乎擦地的低姿势飞速滑铲而过，专挑其立足不稳的下盘关节直接横扫。',
        rarity: '史诗',
        icon: <Sword className="w-8 h-8 text-cyan-400" />,
        stats: [
          { name: '敏捷', value: 6 },
          { name: '意志', value: 4 },
        ],
      },
      {
        id: 'ken_9',
        title: '百劫忘死化境御',
        description:
          '脑海中模拟并承受过上千重古怪而凄惨死法的你，在真正的战场上已然能做到古井无波。任何莫测凶险的对攻杀路，在你眼中皆不过是重演千万遍的无趣图景，自能本能出招，御力于无形去克敌。',
        rarity: '传说',
        icon: <Ghost className="w-8 h-8 text-blue-200" />,
        stats: [
          { name: '意志', value: 8 },
          { name: '感知', value: 8 },
          { name: '敏捷', value: 8 },
        ],
      },
      {
        id: 'ken_10',
        title: '旧伤预判',
        description: '苦难留下的伤痕成了警钟。你总能更早捕捉敌手重击的前兆，在生死一线前先一步做出应对。',
        rarity: '普通',
        icon: <Eye className="w-8 h-8 text-cyan-300" />,
        stats: [
          { name: '感知', value: 2 },
          { name: '力量', value: 1 },
        ],
      },
      {
        id: 'ken_11',
        title: '苦役步伐',
        description: '长期苦役磨出的省力步法，让你在负重拉扯与缠斗换位时依然稳得住呼吸和节奏。',
        rarity: '普通',
        icon: <Activity className="w-8 h-8 text-blue-300" />,
        stats: [
          { name: '体质', value: 1 },
          { name: '敏捷', value: 3 },
        ],
      },
      {
        id: 'ken_12',
        title: '血蜘蛛寄生共生体',
        description: '你记得自己曾被血蜘蛛寄生后侥幸活下。那段噩梦让你的伤口愈合反应更顽强，但精神时常被饥饿幻觉啃噬。',
        rarity: '史诗',
        icon: <Bug className="w-8 h-8 text-cyan-300" />,
        stats: [
          { name: '体质', value: 7 },
          { name: '意志', value: 3 },
          { name: '智力', value: -4 },
        ],
      },
      {
        id: 'ken_13',
        title: '圣国暗娼',
        description: '你脑中被植入在圣国阴影街巷讨生的记忆：你学会了察言观色与自保交易，也留下了挥不去的羞耻与戒惧。',
        rarity: '普通',
        icon: <Smile className="w-8 h-8 text-cyan-200" />,
        stats: [
          { name: '魅力', value: 7 },
          { name: '感知', value: 3 },
          { name: '意志', value: -3 },
        ],
      },
      {
        id: 'ken_14',
        title: '荒野游医',
        description: '你曾在荒野战线替雇佣兵缝合断肢、止血续命。见过太多濒死目光后，你的手更稳，心也更硬。',
        rarity: '普通',
        icon: <Heart className="w-8 h-8 text-cyan-300" />,
        stats: [
          { name: '智力', value: 6 },
          { name: '意志', value: 2 },
          { name: '魅力', value: -2 },
        ],
      },
      {
        id: 'ken_15',
        title: '异种表演',
        description: '你记得自己曾在异种竞技场被迫公开表演求生。那份屈辱换来了极端环境下的应变本能与扭曲的舞台感。',
        rarity: '史诗',
        icon: <Users className="w-8 h-8 text-blue-300" />,
        stats: [
          { name: '魅力', value: 5 },
          { name: '敏捷', value: 4 },
          { name: '意志', value: 2 },
        ],
      },
      {
        id: 'ken_16',
        title: '大漠行者',
        description: '你曾独自行过盐碱热风与缺水长途。漫长荒行锻出了耐久与方向感，也把你的情绪烤得沉默寡淡。',
        rarity: '普通',
        icon: <Wind className="w-8 h-8 text-cyan-300" />,
        stats: [
          { name: '体质', value: 6 },
          { name: '感知', value: 3 },
          { name: '魅力', value: -2 },
        ],
      },
    ],
  },
  {
    id: 'evil',
    name: '恶念',
    title: '罪恶',
    description: '献祭你的最爱，在这个绝望的废土上换取扭曲而令人胆寒的禁忌力量。',
    fullDescription:
      '那些曾经并肩作战、托付背后的伙伴，在你眼中逐渐变成了通向极致力量的祭品。向恶念献上你相处最久的挚爱亲朋，你将获得对应七宗罪的恐怖力量，但你的灵魂与肉体也将在罪恶中彻底扭曲。',
    colorFrom: 'from-fuchsia-950',
    colorTo: 'to-pink-600',
    borderGlow: 'hover:border-pink-600',
    bgGlow: 'bg-fuchsia-950/30',
    icon: <HeartCrack className="w-12 h-12 text-pink-500" />,
    blessings: [
      {
        id: 'evil_1',
        title: '傲慢之躯',
        description:
          '献祭小队所有成员。你坚信自己已被神明选中，获得了凌驾一切的绝对力量，但你的傲慢让你再也无法容忍任何人的同行，你只能独自前行。',
        traitDescription:
          '你坚信自己已被神明选中，获得了凌驾一切的绝对力量，但你的傲慢让你再也无法容忍任何人的同行，你只能独自前行。',
        rarity: '传说',
        icon: <Shield className="w-8 h-8 text-pink-500" />,
        stats: [
          { name: '力量', value: 45 },
          { name: '敏捷', value: 45 },
          { name: '体质', value: 45 },
          { name: '意志', value: 45 },
          { name: '感知', value: 45 },
          { name: '智力', value: 45 },
          { name: '魅力', value: -50 },
        ],
      },
      {
        id: 'evil_2',
        title: '暴怒之血',
        description:
          '亲手肢解与你出生入死的兄弟。极致的痛苦化作了焚尽理智的狂怒，你获得了撕裂一切的破坏力，但也彻底沦为一头只知杀戮、不分敌我的野兽。',
        traitDescription:
          '极致的痛苦化作了焚尽理智的狂怒，你获得了撕裂一切的破坏力，但也彻底沦为一头只知杀戮、不分敌我的野兽。',
        rarity: '传说',
        icon: <Flame className="w-8 h-8 text-fuchsia-500" />,
        stats: [
          { name: '力量', value: 60 },
          { name: '智力', value: -30 },
        ],
      },
      {
        id: 'evil_3',
        title: '贪婪之手',
        description:
          '切断队伍里你最信任伙伴的双手。自私自利的无尽占有欲将你彻底侵吞。为了将战场上的一切先手、生机、乃至视线所及的微末资源据为己有，你的双手与双足在贪婪的渴望驱使下化作掠夺的惊人残影，爆发出超凡的极速，疯狂而利己地攫取并死守一切。作为代价，你的灵魂也将永生受困于无论如何也填不满的虚无深渊。',
        traitDescription:
          '自私自利的无尽占有欲将你彻底侵吞。为了将战场上的一切先手、生机、乃至视线所及的微末资源据为己有，你的双手与双足在贪婪的渴望驱使下化作掠夺的惊人残影，爆发出超凡的极速，疯狂而利己地攫取并死守一切。作为代价，你的灵魂也将永生受困于无论如何也填不满的虚无深渊。',
        rarity: '史诗',
        icon: <Activity className="w-8 h-8 text-pink-400" />,
        stats: [
          { name: '敏捷', value: 45 },
          { name: '意志', value: -25 },
        ],
      },
      {
        id: 'evil_4',
        title: '嫉妒之眼',
        description:
          '挖去队伍里最美丽动人的伙伴的双眼。这让你能看破一切弱点并复制敌人的招式，但一旦身边有人表现出善意或丝毫的闪光点，你就会感受到钻心的痛苦。',
        traitDescription:
          '这让你能看破一切弱点并复制敌人的招式，但一旦身边有人表现出善意或丝毫的闪光点，你就会感受到钻心的痛苦。',
        rarity: '史诗',
        icon: <Eye className="w-8 h-8 text-fuchsia-400" />,
        stats: [
          { name: '感知', value: 50 },
          { name: '魅力', value: -30 },
        ],
      },
      {
        id: 'evil_5',
        title: '暴食之口',
        description:
          '生啖队伍里体格最为健壮的挚友。暴食同类的扭曲活性使你的血肉获得了异常强大的修复机能。战斗中不论皮肉受何等开膛撕裂之伤，伤口都将在一阵毛骨悚然的血肉惊颤中自我缓慢愈合，但宿命的饥肠辘辘将损耗你的心智。',
        traitDescription:
          '食同类的扭曲活性使你的血肉获得了异常强大的修复机能。战斗中不论皮肉受何等开膛撕裂之伤，伤口都将在一阵毛骨悚然的血肉惊颤中自我缓慢愈合，但宿命的饥肠辘辘将损耗你的心智。',
        rarity: '传说',
        icon: <Bone className="w-8 h-8 text-pink-500" />,
        stats: [
          { name: '体质', value: 50 },
          { name: '智力', value: -30 },
        ],
      },
      {
        id: 'evil_6',
        title: '色欲之魅',
        description:
          '亲手挖出队伍中与你最亲密的爱人心脏。你散发出无法抗拒的诡异魅力，甚至能让敌人满怀痴迷地为你赴死。作为代价，你的内心将彻底荒芜，永远丧失感知任何温情的能力。',
        traitDescription:
          '你散发出无法抗拒的诡异魅力，甚至能让敌人满怀痴迷地为你赴死。作为代价，你的内心将彻底荒芜，永远丧失感知任何温情的能力。',
        rarity: '传说',
        icon: <Smile className="w-8 h-8 text-fuchsia-300" />,
        stats: [
          { name: '魅力', value: 50 },
          { name: '意志', value: -30 },
        ],
      },
      {
        id: 'evil_7',
        title: '怠惰之梦',
        description:
          '将队伍里最勤恳死忠的同伴作为活祭品生埋。极端的游离惫懒竟让你的危机神视发生了质跃：你能在脑海中宛如走马灯预先看到未来两秒的格斗交锋幻境。作为代价，你再也无法感到世间冷暖，任何事物都无法触动你。',
        traitDescription:
          '极端的游离惫懒竟让你的危机神视发生了质跃：你能在脑海中宛如走马灯预先看到未来两秒的格斗交锋幻境。作为代价，你再也无法感到世间冷暖，任何事物都无法触动你。',
        rarity: '传说',
        icon: <Anchor className="w-8 h-8 text-pink-400" />,
        stats: [
          { name: '意志', value: 50 },
          { name: '敏捷', value: -30 },
        ],
      },
    ],
  },
];

// --- Components ---

const GodCard = ({
  god,
  onClick,
  alignment,
  delay = 0,
  isActive = false,
}: {
  god: GodTheme;
  onClick: () => void;
  alignment: 'left' | 'right';
  delay?: number;
  isActive?: boolean;
  key?: any;
}) => {
  return (
    <motion.div
      onClick={onClick}
      className={`god-item p-4 md:p-6 flex items-center gap-4 ${alignment === 'right' ? 'flex-row-reverse text-right pr-4 md:pr-6' : 'pl-4 md:pl-6'}`}
      data-alignment={alignment}
      data-active={isActive ? 'true' : undefined}
      initial={{ opacity: 0, x: alignment === 'left' ? -50 : 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }}
    >
      <div className={`shrink-0 opacity-80 ${god.colorFrom.replace('from-', 'text-')}`}>
        {cloneElement(god.icon as React.ReactElement<{ className?: string }>, { className: 'w-10 h-10' })}
      </div>
      <div>
        <h3 className="text-xl md:text-2xl font-bold mb-1" style={{ color: 'var(--kenshi-gold)' }}>
          {god.name}
        </h3>
        <p className="text-[10px] md:text-xs opacity-60 leading-relaxed text-[var(--kenshi-text)]">
          {god.title}：{god.description}
        </p>
      </div>
    </motion.div>
  );
};

const BlessingModal = ({
  god,
  currentBlessings,
  onClose,
  onSelect,
}: {
  god: GodTheme;
  currentBlessings: BlessingOption[];
  onClose: () => void;
  onSelect: (b: BlessingOption) => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 md:p-12 bg-black/90 backdrop-blur-sm"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
        className="relative z-10 w-full max-w-5xl flex flex-col"
      >
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--kenshi-gold)' }}>
            神启：{god.name}的恩典
          </h2>
          <p className="text-zinc-500 tracking-widest text-xs md:text-sm max-w-2xl mx-auto">{god.fullDescription}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full max-h-[60vh] overflow-y-auto px-2">
          {currentBlessings.map((blessing, idx) => (
            <div
              key={blessing.id}
              className="reward-card p-6 md:p-8 flex flex-col items-center text-center cursor-pointer"
              onClick={() => onSelect(blessing)}
              style={{ animationDelay: `${idx * 100}ms`, animation: `fadeInUp 0.5s ease backwards` }}
            >
              <div
                className="blessing-icon mb-4"
                style={god.id === 'yuri' ? { borderColor: '#ec4899', color: '#ec4899' } : {}}
              >
                {blessing.title.charAt(0)}
              </div>
              <h4 className="text-lg md:text-xl font-bold mb-3 text-white">{blessing.title}</h4>

              {blessing.stats && blessing.stats.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4 justify-center relative z-10">
                  {blessing.stats.map(stat => (
                    <span
                      key={stat.name}
                      className={`text-[11px] font-bold px-2 py-0.5 border bg-zinc-950/80 backdrop-blur-sm ${
                        stat.value > 0
                          ? 'text-emerald-400 border-emerald-900 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
                          : 'text-rose-400 border-rose-900 shadow-[0_0_8px_rgba(244,63,94,0.15)]'
                      }`}
                    >
                      {stat.name} {stat.value > 0 ? `+${stat.value}` : stat.value}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-xs md:text-sm text-zinc-400 flex-1 leading-relaxed text-left opacity-80 border-t border-zinc-800/50 pt-4 w-full">
                {blessing.description}
              </p>

              <div className="mt-8 w-full flex items-center justify-between pt-4 border-t border-zinc-800/50">
                <div className="shrink-0 opacity-70" style={{ color: 'var(--kenshi-gold)' }}>
                  {cloneElement(blessing.icon as React.ReactElement<{ className?: string }>, {
                    className: 'w-5 h-5',
                  })}
                </div>
                <div
                  className={`text-[10px] md:text-xs font-bold py-1 px-3 border bg-zinc-950/80
                  ${
                    blessing.rarity === '传说'
                      ? 'text-yellow-500 border-yellow-900 shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                      : blessing.rarity === '史诗'
                        ? 'text-purple-400 border-purple-900 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                        : 'text-zinc-400 border-zinc-800'
                  }`}
                >
                  稀有度：{blessing.rarity}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8 md:mt-12">
          <button
            className="text-zinc-600 hover:text-zinc-400 transition-colors text-xs tracking-widest uppercase underline"
            onClick={onClose}
          >
            放弃恩赐 (Esc)
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

interface SquadMember {
  id: string;
  name: string;
  role: string;
}

interface RuntimeSquadMember extends SquadMember {
  squadName: string;
  memberName: string;
  level?: number;
  traitTitles?: string[];
}

interface RitualWarning {
  title: string;
  content: string;
}

const initialSquad: SquadMember[] = [
  { id: 'char_1', name: '无名 (你)', role: '流浪者' },
  { id: 'char_2', name: '雷恩', role: '坚韧的佣兵' },
  { id: 'char_3', name: '伊拉', role: '独眼射手' },
  { id: 'char_4', name: '阿木', role: '拾荒窃贼' },
];

const TargetSelectModal = ({
  god,
  blessing,
  squad,
  onSelect,
  onClose,
  mode = 'target',
}: {
  god: GodTheme;
  blessing: BlessingOption;
  squad: SquadMember[];
  onSelect: (id: string) => void;
  onClose: () => void;
  mode?: 'target' | 'sacrifice';
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 md:p-12 bg-black/95 backdrop-blur-sm"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
        className="relative z-10 w-full max-w-3xl flex flex-col"
      >
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: 'var(--kenshi-gold)' }}>
            {mode === 'sacrifice' ? '献祭同伴' : '降下恩赐'}
          </h2>
          <p className="text-zinc-500 tracking-widest text-xs md:text-sm max-w-2xl mx-auto">
            {mode === 'sacrifice' ? (
              <>
                谁将被献祭给 <span className="text-white font-bold">恶念</span>，以换取{' '}
                <span className="text-white font-bold">{blessing.title}</span>？
              </>
            ) : (
              <>
                谁将承受 <span className="text-white font-bold">{blessing.title}</span> 的力量与诅咒？
              </>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
          {squad.map((member, idx) => (
            <div
              key={member.id}
              className="reward-card p-6 flex flex-col items-center text-center cursor-pointer hover:bg-zinc-900/50"
              onClick={() => onSelect(member.id)}
              style={{ animationDelay: `${idx * 100}ms`, animation: `fadeInUp 0.5s ease backwards` }}
            >
              <h4 className="text-lg font-bold mb-2 text-white">{member.name}</h4>
              <p className="text-xs text-zinc-500">{member.role}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-8 md:mt-12">
          <button
            className="text-zinc-600 hover:text-zinc-400 transition-colors text-xs tracking-widest uppercase underline"
            onClick={onClose}
          >
            返回重新选择
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const RitualWarningModal = ({ warning, onClose }: { warning: RitualWarning; onClose: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4 md:p-12 bg-black/95 backdrop-blur-sm"
    >
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
        className="relative z-10 w-full max-w-2xl reward-card p-6 md:p-8 border border-rose-900/80 bg-gradient-to-b from-rose-950/30 to-black"
      >
        <div className="text-center mb-6">
          <p className="text-[10px] tracking-[0.3em] uppercase text-rose-400/80 mb-2">禁忌仪式中断</p>
          <h3
            className="text-2xl md:text-3xl font-black text-rose-300 mb-3"
            style={{ fontFamily: "'Zhi Mang Xing', cursive" }}
          >
            {warning.title}
          </h3>
          <p className="text-sm md:text-base text-zinc-300 leading-relaxed whitespace-pre-line">{warning.content}</p>
        </div>
        <div className="text-center">
          <button
            className="px-6 py-2 border border-rose-700/70 text-rose-300 hover:bg-rose-950/40 transition-all tracking-widest text-xs uppercase"
            onClick={onClose}
          >
            收束恶念
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function App() {
  const [selectedGod, setSelectedGod] = useState<{ god: GodTheme; currentBlessings: BlessingOption[] } | null>(null);
  const [selectingTarget, setSelectingTarget] = useState<{ god: GodTheme; blessing: BlessingOption } | null>(null);
  const [selectingSacrifice, setSelectingSacrifice] = useState<{
    god: GodTheme;
    blessing: BlessingOption;
    characterId: string;
  } | null>(null);
  const [pickedBlessings, setPickedBlessings] = useState<
    { god: GodTheme; blessing: BlessingOption; characterId: string; sacrificeId?: string }[]
  >([]);
  const [runtimeSquad, setRuntimeSquad] = useState<RuntimeSquadMember[]>(
    initialSquad.map(m => ({ ...m, squadName: '', memberName: '' })),
  );
  const [isJourneyStarted, setIsJourneyStarted] = useState(false);
  const [ritualWarning, setRitualWarning] = useState<RitualWarning | null>(null);
  const [fixedBlessingPool, setFixedBlessingPool] = useState<Record<string, BlessingOption[]>>({});
  const [showGodRulePanel, setShowGodRulePanel] = useState(false);

  const resolveMessageId = () => (typeof getCurrentMessageId === 'function' ? getCurrentMessageId() : 'latest');

  const getRuntimeSquadFromMvu = async (messageId: number | 'latest' = resolveMessageId()) => {
    await waitGlobalInitialized('Mvu');
    await waitUntil(() => _.has(getVariables({ type: 'message', message_id: messageId }), 'stat_data'), {
      timeout: 10000,
      intervalBetweenAttempts: 200,
    });

    const mvuData = Mvu.getMvuData({ type: 'message', message_id: messageId });
    const squads = _.get(mvuData, 'stat_data.小队成员', {});
    const members: RuntimeSquadMember[] = [];

    _.forEach(squads, (squadData, squadName) => {
      const squadMembers = _.get(squadData, '成员', {});
      _.forEach(squadMembers, (memberData, memberName) => {
        if (!memberData || memberData === '待初始化') return;
        const displayName = _.get(memberData, '名字', memberName) || String(memberName);
        const identity = _.get(memberData, '身份', '小队成员');
        members.push({
          id: `${String(squadName)}::${String(memberName)}`,
          name: String(displayName),
          role: String(identity),
          squadName: String(squadName),
          memberName: String(memberName),
          level: Number(_.get(memberData, '等级', 1)) || 1,
          traitTitles: Object.keys(_.get(memberData, '特质', {}) || {}),
        });
      });
    });

    return members;
  };

  const formatBlessingStatText = (stats?: BlessingStat[]) => {
    if (!stats || stats.length === 0) return '';
    const attrNameMap: Record<BlessingStat['name'], string> = {
      力量: '力量',
      敏捷: '敏捷',
      感知: '感知',
      体质: '体质',
      意志: '意志',
      智力: '智力',
      魅力: '魅力',
    };
    return stats.map(stat => `${attrNameMap[stat.name]}${stat.value >= 0 ? '+' : ''}${stat.value}`).join('，');
  };

  const applyBlessingsToMvu = async (messageId: number | 'latest' = resolveMessageId()) => {
    await waitGlobalInitialized('Mvu');
    await waitUntil(() => _.has(getVariables({ type: 'message', message_id: messageId }), 'stat_data'), {
      timeout: 10000,
      intervalBetweenAttempts: 200,
    });

    const mvuData = Mvu.getMvuData({ type: 'message', message_id: messageId });
    const attrKeyMap: Record<BlessingStat['name'], string> = {
      力量: 'STR',
      敏捷: 'DEX',
      感知: 'PER',
      体质: 'TGH',
      意志: 'WIL',
      智力: 'INT',
      魅力: 'CHA',
    };

    pickedBlessings.forEach(({ god, blessing, characterId, sacrificeId }) => {
      const [squadName, memberName] = characterId.split('::');
      if (!squadName || !memberName) return;
      const memberPath = `stat_data.小队成员.${squadName}.成员.${memberName}`;
      const memberData = _.get(mvuData, memberPath);
      if (!memberData || memberData === '待初始化') return;

      const traitPath = `${memberPath}.特质.${blessing.title}`;
      _.set(mvuData, traitPath, blessing.traitDescription || blessing.description || '');

      const traitPointPath = `${memberPath}.特质点`;
      const currentTraitPoint = Number(_.get(mvuData, traitPointPath, 0));
      _.set(mvuData, traitPointPath, Math.max(0, (Number.isFinite(currentTraitPoint) ? currentTraitPoint : 0) - 1));

      blessing.stats?.forEach(stat => {
        const attrKey = attrKeyMap[stat.name];
        if (!attrKey) return;
        const attrPath = `${memberPath}.属性.${attrKey}`;
        const currentAttr = _.get(mvuData, attrPath);

        if (_.isPlainObject(currentAttr)) {
          const currentBonus = Number(_.get(currentAttr, '加成', 0)) || 0;
          _.set(mvuData, `${attrPath}.加成`, currentBonus + stat.value);
          return;
        }

        const currentValue = Number(currentAttr);
        _.set(mvuData, attrPath, (Number.isFinite(currentValue) ? currentValue : 30) + stat.value);
      });

      if (god.id === 'evil' && sacrificeId) {
        const [sacrificeSquadName, sacrificeMemberName] = sacrificeId.split('::');
        if (!sacrificeSquadName || !sacrificeMemberName) return;
        const sacrificePath = `stat_data.小队成员.${sacrificeSquadName}.成员.${sacrificeMemberName}`;
        const sacrificeData = _.get(mvuData, sacrificePath);
        if (!sacrificeData || sacrificeData === '待初始化') return;
        _.set(mvuData, `${sacrificePath}.状态`, '死亡');
        _.set(mvuData, `stat_data.往事.死亡名单.${_.get(sacrificeData, '名字', sacrificeMemberName)}`, '死亡');
      }
    });

    await Mvu.replaceMvuData(mvuData, { type: 'message', message_id: messageId });
  };

  const buildPrayerSummary = () => {
    const blessingLines = pickedBlessings
      .map(({ god, blessing, characterId, sacrificeId }) => {
        const target = runtimeSquad.find(m => m.id === characterId);
        const sacrifice = runtimeSquad.find(m => m.id === sacrificeId);
        const roleName = target?.name || '未知角色';
        if (god.id === 'evil') {
          const sacrificeName = sacrifice?.name || '未知祭品';
          const evilRitualMap: Record<string, string> = {
            evil_1: '对三位最信任且功勋卓著的同伴进行斩首，以鲜血见证唯我独尊的王座',
            evil_2: '亲手肢解与你出生入死的兄弟',
            evil_3: '切断队伍里你最信任伙伴的双手',
            evil_4: '挖去队伍里最美丽动人的伙伴的双眼',
            evil_5: '生啖队伍里体格最为健壮的挚友',
            evil_6: '亲手挖出队伍中与你最亲密的爱人心脏',
            evil_7: '将队伍里最勤恳死忠的同伴作为活祭品生埋',
          };
          const ritualText = evilRitualMap[blessing.id] || '献上禁忌祭品';
          return `${roleName}向心中的【罪恶】祈祷，要求${ritualText}，于是${roleName}杀死了${sacrificeName}将其献祭给【恶念】，得到了【${blessing.title}】${blessing.description}。`;
        }
        if (god.id === 'yuri') {
          const yuriMutationMap: Record<string, string> = {
            yuri_1: `${roleName}的双手异化成喙嘴猩猩般的畸形巨爪`,
            yuri_2: `${roleName}的头颅异化为骨犬之首，牙口与嗅觉都变得更为凶暴`,
            yuri_3: `${roleName}的眼部退化融合，面部与胸口增生出坚硬角质盲壳`,
            yuri_4: `${roleName}的伤口周围增生出猩红触手组织并开始高速重组`,
            yuri_5: `${roleName}的脸颊与颈侧丛生出寄生复眼`,
            yuri_6: `${roleName}的胸背被沉重龟壳包裹，身躯进一步甲壳化`,
            yuri_7: `${roleName}的肩腕关节出现倒生异变，形成逆抓骨骼结构`,
            yuri_8: `${roleName}的体表角质层在受击时会瞬间隆起并反震`,
            yuri_9: `${roleName}的体侧裂开骨刺裂吻，形成可撕扯兵刃的异口`,
            yuri_10: `${roleName}的肋下增生出狰狞刺椎，能在格挡时夹咬敌兵`,
            yuri_11: `${roleName}的胸腹与前臂角质层增生为同心鳞甲，并出现偏振收缩反应，可偏导正面冲击`,
          };
          const mutationText = yuriMutationMap[blessing.id] || `${roleName}的血肉发生了诡异异变`;
          const godDisplayName = `${god.title}${god.name}`;
          return `${roleName}向【${godDisplayName}】祈祷，得到了赐福【${blessing.title}】${blessing.description}。与此同时，${mutationText}。`;
        }
        const godDisplayName = `${god.title}${god.name}`;
        return `${roleName}向【${godDisplayName}】祈祷，得到了赐福【${blessing.title}】${blessing.description}。`;
      })
      .join('\n');

    return `【神明赐福】\n${blessingLines}\n\n请根据上述内容，描写这一段伙伴们向诸位众神祈祷赐福的过程`;
  };

  // Split 8 gods: 4 on the left, 4 on the right
  const leftColumn = godsData.slice(0, 4);
  const rightColumn = godsData.slice(4, 8);

  const getMaxSquadLevel = () => {
    const levels = runtimeSquad.map(member => Number(member.level || 1)).filter(n => Number.isFinite(n));
    return levels.length > 0 ? Math.max(...levels) : 1;
  };

  const getAllowedRaritiesByMaxLevel = (maxLevel: number): BlessingOption['rarity'][] => {
    if (maxLevel < 40) return ['普通'];
    if (maxLevel <= 50) return ['普通', '史诗'];
    return ['普通', '史诗', '传说'];
  };

  const getAllowedRaritiesByPersonalLevel = (level: number): BlessingOption['rarity'][] => {
    if (level < 40) return ['普通'];
    if (level <= 50) return ['普通', '史诗'];
    return ['普通', '史诗', '传说'];
  };

  const isLegendaryUnlockBlessing = (blessingId: string) => legendaryUnlockBlessingIds.includes(blessingId);

  const specialGodConfigs = {
    okran: {
      unlockId: 'okran_15',
      traitTitle: '圣火誓印',
      rejectTitle: '圣火逐异',
      rejectText: '奥克兰的圣火看穿了你灵魂中早已烙下的他神印记。被异誓污染的火种，不配再踏上圣焰之路。',
    },
    kral: {
      unlockId: 'kral_16',
      traitTitle: '王血战契',
      rejectTitle: '荣耀不侍二主',
      rejectText: '克拉尔只承认一条流血到底的誓路。骨血里若已刻下别神的名讳，荣耀便不会再回应你。',
    },
    narko: {
      unlockId: 'narko_15',
      traitTitle: '暗夜圣痕',
      rejectTitle: '黑夜厌弃伪信者',
      rejectText: '娜尔可的黑夜已经看见你影子里寄宿的旧誓。向别神屈膝过的人，学不会真正的隐没。',
    },
    yuri: {
      unlockId: 'yuri_15',
      traitTitle: '渊胎契印',
      rejectTitle: '深渊拒收杂血',
      rejectText: '比拉克嗅到了你血肉中属于别神的烙印。深渊只会豢养纯粹的怪物，不会收留摇摆不定的祭品。',
    },
  } as const;

  const isSpecialGod = (godId: string): godId is keyof typeof specialGodConfigs => godId in specialGodConfigs;

  const getPendingBrandGodId = (characterId: string) => {
    const pending = pickedBlessings.find(
      item => item.characterId === characterId && isLegendaryUnlockBlessing(item.blessing.id),
    );
    if (!pending) return null;
    const matched = Object.entries(specialGodConfigs).find(([, config]) => config.unlockId === pending.blessing.id);
    return matched?.[0] || null;
  };

  const getBrandGodIdFromMember = (member: RuntimeSquadMember | undefined) => {
    if (!member) return null;
    const fromTrait = Object.entries(specialGodConfigs).find(([, config]) =>
      member.traitTitles?.includes(config.traitTitle),
    );
    if (fromTrait) return fromTrait[0];
    return getPendingBrandGodId(member.id);
  };

  const hasEligibleTargetForGod = (godId: string) => {
    if (!isSpecialGod(godId)) return true;
    return runtimeSquad.some(member => {
      const brandGodId = getBrandGodIdFromMember(member);
      return !brandGodId || brandGodId === godId;
    });
  };

  const canOpenEvilGod = () => {
    const maxLevel = getMaxSquadLevel();
    return maxLevel >= 20;
  };

  const hasAnySacrificeCandidate = () => {
    return runtimeSquad.length >= 2;
  };

  const handleGodClick = (god: GodTheme) => {
    if (god.id === 'evil' && !canOpenEvilGod()) {
      setRitualWarning({
        title: '七罪未允你觐见',
        content:
          '你体内的贪婪尚浅，愤怒未熟，傲慢亦未加冕。\n恶念在黑暗中低语：等你跨过20级门槛，再来献上第一滴真正有分量的血。',
      });
      return;
    }

    if (isSpecialGod(god.id) && !hasEligibleTargetForGod(god.id)) {
      const config = specialGodConfigs[god.id];
      setRitualWarning({
        title: config.rejectTitle,
        content: config.rejectText,
      });
      return;
    }

    const cached = fixedBlessingPool[god.id];
    if (cached && cached.length > 0) {
      setSelectedGod({ god, currentBlessings: cached });
      if (god.id === 'evil' && !hasAnySacrificeCandidate()) {
        setRitualWarning({
          title: '祭品不足',
          content: '当前小队没有可献祭对象（至少需要2名成员）。你仍可查看恶念赐福。',
        });
      }
      return;
    }

    const maxLevel = getMaxSquadLevel();
    const allowedBySquad = getAllowedRaritiesByMaxLevel(maxLevel);
    const sourcePool =
      god.id === 'evil' || god.id === 'beep'
        ? [...god.blessings]
        : god.blessings.filter(b => allowedBySquad.includes(b.rarity));
    const fallbackPool = sourcePool.length > 0 ? sourcePool : [...god.blessings];
    const randomBlessings = [...fallbackPool].sort(() => 0.5 - Math.random()).slice(0, 3);

    setFixedBlessingPool(prev => ({ ...prev, [god.id]: randomBlessings }));
    setSelectedGod({ god, currentBlessings: randomBlessings });

    if (god.id === 'evil' && !hasAnySacrificeCandidate()) {
      setRitualWarning({
        title: '祭品不足',
        content: '当前小队没有可献祭对象（至少需要2名成员）。你仍可查看恶念赐福。',
      });
    }
  };

  const handleBlessingSelect = (blessing: BlessingOption) => {
    if (selectedGod) {
      if (selectedGod.god.id !== 'evil' && selectedGod.god.id !== 'beep') {
        const targetLevels = runtimeSquad.map(m => Number(m.level || 1)).filter(n => Number.isFinite(n));
        const highestPersonalLevel = targetLevels.length > 0 ? Math.max(...targetLevels) : 1;
        const allowed = getAllowedRaritiesByPersonalLevel(highestPersonalLevel);
        if (!allowed.includes(blessing.rarity)) {
          setRitualWarning({
            title: '恩赐超出承载极限',
            content: `当前可承载稀有度：${allowed.join(' / ')}。\n所选【${blessing.title}】为${blessing.rarity}，请提升角色等级后再尝试。`,
          });
          return;
        }
      }
      setSelectingTarget({ god: selectedGod.god, blessing });
      setSelectedGod(null);
    }
  };

  const handleTargetSelect = (characterId: string) => {
    const checkAndSelect = async () => {
      if (!selectingTarget) return;

      if (selectingTarget.god.id !== 'evil' && selectingTarget.god.id !== 'beep') {
        const target = runtimeSquad.find(member => member.id === characterId);
        const personalLevel = Number(target?.level || 1);
        const allowed = getAllowedRaritiesByPersonalLevel(personalLevel);
        if (!allowed.includes(selectingTarget.blessing.rarity)) {
          setRitualWarning({
            title: '个体无法承载该恩赐',
            content: `${target?.name || '该角色'} 当前等级为 ${personalLevel}。\n可选择稀有度：${allowed.join(' / ')}。`,
          });
          return;
        }
      }

      await waitGlobalInitialized('Mvu');
      const messageId = resolveMessageId();
      await waitUntil(() => _.has(getVariables({ type: 'message', message_id: messageId }), 'stat_data'), {
        timeout: 10000,
        intervalBetweenAttempts: 200,
      });
      const mvuData = Mvu.getMvuData({ type: 'message', message_id: messageId });
      const [squadName, memberName] = characterId.split('::');
      const traitPointPath = `stat_data.小队成员.${squadName}.成员.${memberName}.特质点`;
      const traitPoints = Number(_.get(mvuData, traitPointPath, 0));
      const targetName = runtimeSquad.find(member => member.id === characterId)?.name || memberName || '该角色';
      const targetMember = runtimeSquad.find(member => member.id === characterId);
      const brandGodId = getBrandGodIdFromMember(targetMember);

      if (isSpecialGod(selectingTarget.god.id)) {
        if (brandGodId && brandGodId !== selectingTarget.god.id) {
          const config = specialGodConfigs[selectingTarget.god.id];
          setRitualWarning({
            title: config.rejectTitle,
            content: `${targetName} 已被【${specialGodConfigs[brandGodId as keyof typeof specialGodConfigs].traitTitle}】烙印。\n${config.rejectText}`,
          });
          return;
        }

        if (isLegendaryUnlockBlessing(selectingTarget.blessing.id) && !(Number(targetMember?.level || 1) > 50)) {
          setRitualWarning({
            title: '印契尚未成熟',
            content: `${targetName} 当前等级为 ${Number(targetMember?.level || 1)}。\n只有角色等级 >50，才有资格承受这道传说前置之印。`,
          });
          return;
        }

        if (selectingTarget.blessing.rarity === '传说' && !isLegendaryUnlockBlessing(selectingTarget.blessing.id)) {
          const unlockTitle = specialGodConfigs[selectingTarget.god.id].traitTitle;
          const hasUnlock = brandGodId === selectingTarget.god.id;
          if (!hasUnlock) {
            setRitualWarning({
              title: '传说仍被封印',
              content: `${targetName} 尚未接受【${unlockTitle}】。\n若想承载该神真正的传说赐福，必须先选择对应的“传说（解锁前置）”特质。`,
            });
            return;
          }
        }
      }

      if (!isLegendaryUnlockBlessing(selectingTarget.blessing.id) && !(traitPoints > 0)) {
        setRitualWarning({
          title: '神恩被拒',
          content: `${targetName} 的特质点不足（当前 ${Number.isFinite(traitPoints) ? traitPoints : 0} 点）。\n每个赐福都需要消耗1点特质点。`,
        });
        return;
      }

      if (selectingTarget.god.id === 'evil') {
        setSelectingSacrifice({ god: selectingTarget.god, blessing: selectingTarget.blessing, characterId });
        setSelectingTarget(null);
        return;
      }
      setPickedBlessings(prev => [
        ...prev,
        { god: selectingTarget.god, blessing: selectingTarget.blessing, characterId },
      ]);
      setSelectingTarget(null);
    };

    checkAndSelect().catch(() => {
      setRitualWarning({
        title: '神谕中断',
        content: '未能读取角色特质点数据，请稍后重试。',
      });
    });
  };

  const handleSacrificeSelect = (sacrificeId: string) => {
    const checkRequirement = async () => {
      if (!selectingSacrifice) return;

      await waitGlobalInitialized('Mvu');
      const messageId = resolveMessageId();
      await waitUntil(() => _.has(getVariables({ type: 'message', message_id: messageId }), 'stat_data'), {
        timeout: 10000,
        intervalBetweenAttempts: 200,
      });

      const mvuData = Mvu.getMvuData({ type: 'message', message_id: messageId });
      const [targetSquadName, targetMemberName] = selectingSacrifice.characterId.split('::');
      const [sacrificeSquadName, sacrificeMemberName] = sacrificeId.split('::');
      if (!targetSquadName || !targetMemberName || !sacrificeSquadName || !sacrificeMemberName) return;

      const targetPath = `stat_data.小队成员.${targetSquadName}.成员.${targetMemberName}`;
      const sacrificePath = `stat_data.小队成员.${sacrificeSquadName}.成员.${sacrificeMemberName}`;
      const sacrificeData = _.get(mvuData, sacrificePath, {});
      const targetData = _.get(mvuData, targetPath, {});

      const getRelation = (memberData: any) =>
        String(_.get(memberData, '关系', _.get(memberData, '关系类型', '')) || '').trim();
      const getFavor = (memberData: any) => {
        const direct = Number(_.get(memberData, '好感度'));
        if (Number.isFinite(direct)) return direct;
        const relationFavor = Number(_.get(memberData, '关系数值'));
        if (Number.isFinite(relationFavor)) return relationFavor;
        const fromMap = _.get(memberData, ['人际关系', _.get(targetData, '名字', targetMemberName), '好感度']);
        const mapNum = Number(fromMap);
        return Number.isFinite(mapNum) ? mapNum : -9999;
      };
      const getAttr = (memberData: any, key: string) => {
        const raw = _.get(memberData, ['属性', key]);
        if (_.isPlainObject(raw)) {
          const base = Number(_.get(raw, '基础', 0));
          const bonus = Number(_.get(raw, '加成', 0));
          return (Number.isFinite(base) ? base : 0) + (Number.isFinite(bonus) ? bonus : 0);
        }
        const num = Number(raw);
        return Number.isFinite(num) ? num : 0;
      };

      const blessingId = selectingSacrifice.blessing.id;
      const sacrificeFavor = getFavor(sacrificeData);
      const relation = getRelation(sacrificeData);
      const sameSquadAsTarget = targetSquadName === sacrificeSquadName;

      const fail = (title: string, content: string) => {
        setRitualWarning({ title, content });
      };

      if (!sameSquadAsTarget) {
        fail('祭坛拒绝异队血契', '恶念要求祭品必须来自同一支主控小队。\n请在同队成员中重新选择祭品。');
        return;
      }

      if (blessingId === 'evil_1') {
        const squadMembers = _.get(mvuData, `stat_data.小队成员.${targetSquadName}.成员`, {});
        const qualifiedCount = _.values(squadMembers).filter((member: any) => {
          if (!member || member === '待初始化') return false;
          const favor = Number(_.get(member, '好感度'));
          const level = Number(_.get(member, '等级'));
          return Number.isFinite(favor) && favor > 150 && Number.isFinite(level) && level > 40;
        }).length;
        if (qualifiedCount < 3) {
          fail(
            '傲慢之躯未被唤醒',
            `仪式条件不足：主控小队中需至少3名成员满足“好感>150 且 等级>40”。\n当前仅检测到 ${qualifiedCount} 名符合者。`,
          );
          return;
        }
      }

      const evilRules: Record<
        string,
        { attr?: string; minFavor?: number; minAttr?: number; relationRule?: boolean; title: string; req: string }
      > = {
        evil_2: {
          attr: 'STR',
          minFavor: 120,
          minAttr: 50,
          title: '暴怒之血条件未达成',
          req: '需祭品满足：好感>120，且力量>50。',
        },
        evil_3: {
          attr: 'DEX',
          minFavor: 120,
          minAttr: 50,
          title: '贪婪之手条件未达成',
          req: '需祭品满足：好感>120，且敏捷>50。',
        },
        evil_4: {
          attr: 'CHA',
          minFavor: 120,
          minAttr: 50,
          title: '嫉妒之眼条件未达成',
          req: '需祭品满足：好感>120，且魅力>50。',
        },
        evil_5: {
          attr: 'TGH',
          minFavor: 120,
          minAttr: 50,
          title: '暴食之口条件未达成',
          req: '需祭品满足：好感>120，且体质>50。',
        },
        evil_6: {
          relationRule: true,
          title: '色欲之魅条件未达成',
          req: '需祭品满足：好感>250；或 好感>150 且关系为“爱人/情侣”。',
        },
        evil_7: {
          attr: 'WIL',
          minFavor: 120,
          minAttr: 50,
          title: '怠惰之梦条件未达成',
          req: '需祭品满足：好感>120，且意志>50。',
        },
      };

      const rule = evilRules[blessingId];
      if (rule) {
        if (rule.relationRule) {
          const pass = sacrificeFavor > 250 || (sacrificeFavor > 150 && ['爱人', '情侣'].includes(relation));
          if (!pass) {
            fail(rule.title, `当前祭品好感：${sacrificeFavor}，关系：${relation || '无'}。\n${rule.req}`);
            return;
          }
        } else if (rule.attr) {
          const attrValue = getAttr(sacrificeData, rule.attr);
          if (!(sacrificeFavor > (rule.minFavor || 0) && attrValue > (rule.minAttr || 0))) {
            fail(rule.title, `当前祭品好感：${sacrificeFavor}，属性值：${attrValue}。\n${rule.req}`);
            return;
          }
        }
      }

      setPickedBlessings(prev => [
        ...prev,
        {
          god: selectingSacrifice.god,
          blessing: selectingSacrifice.blessing,
          characterId: selectingSacrifice.characterId,
          sacrificeId,
        },
      ]);
      setSelectingSacrifice(null);
    };

    checkRequirement().catch(() => {
      setRitualWarning({
        title: '祭祀回响中断',
        content: '未能读取祭品契约所需的数据。\n请稍后重试，或确认当前楼层变量已初始化。',
      });
    });
  };

  const handleStartJourney = async () => {
    await applyBlessingsToMvu();
    const summary = buildPrayerSummary();
    if (summary) {
      await createChatMessages([{ role: 'user', message: summary }]);
      await triggerSlash('/trigger');
    }
    setIsJourneyStarted(true);
  };

  React.useEffect(() => {
    getRuntimeSquadFromMvu()
      .then(members => {
        if (members.length > 0) {
          setRuntimeSquad(members);
        }
      })
      .catch(() => {
        setRuntimeSquad(initialSquad.map(m => ({ ...m, squadName: '主角小队', memberName: m.name })));
      });
  }, []);

  if (isJourneyStarted) {
    return (
      <div className="kenshi-frame min-h-screen flex flex-col items-center justify-center p-4 bg-black overflow-hidden relative selection:bg-zinc-800">
        <div className="ornament ornament-tl"></div>
        <div className="ornament ornament-br"></div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, ease: 'easeOut' }}
          className="text-center z-10"
        >
          <h1
            className="text-5xl md:text-7xl font-black mb-6 text-white tracking-widest drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]"
            style={{ fontFamily: "'Zhi Mang Xing', cursive" }}
          >
            旅程继续
          </h1>
          <p className="text-zinc-400 max-w-lg mx-auto leading-relaxed md:text-lg mb-8 tracking-widest font-serif text-center whitespace-pre-line">
            {'神的低语在风中彻底消散\n神明降下了恩典，却没有指明前路。\n我们，真的选对了吗.....'}
          </p>
        </motion.div>
        <div
          className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(196,164,132,0.1)_0%,transparent_70%)] opacity-30 animate-pulse"
          style={{ animationDuration: '4s' }}
        ></div>
      </div>
    );
  }

  return (
    <div className="kenshi-frame min-h-screen flex flex-col p-4 md:p-8 overflow-x-hidden selection:bg-zinc-800">
      <div className="ornament ornament-tl hidden md:block"></div>
      <div className="ornament ornament-br hidden md:block"></div>

      <header className="relative z-10 text-center mb-8 md:mb-12 mt-4 md:mt-8">
        <h1
          className="text-4xl md:text-5xl font-black tracking-widest mb-2 opacity-90 drop-shadow-lg"
          style={{ fontFamily: "'Zhi Mang Xing', cursive", color: 'var(--kenshi-gold)' }}
        >
          旧帝国遗迹之赐福
        </h1>
        <div className="h-px w-32 md:w-64 bg-gradient-to-r from-transparent via-current to-transparent mx-auto mb-2 opacity-30 text-[var(--kenshi-gold)]"></div>
        <p className="text-[10px] md:text-sm tracking-widest uppercase opacity-50">
          Echoes of the Old Empire: Divine Providence
        </p>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 w-full max-w-7xl mx-auto items-center">
        <div className="lg:col-span-4 flex flex-col gap-6 justify-center">
          {leftColumn.map((god, index) => (
            <GodCard
              key={god.id}
              god={god}
              isActive={pickedBlessings.some(item => god.blessings.some(gb => gb.id === item.blessing.id))}
              onClick={() => handleGodClick(god)}
              alignment="left"
              delay={1.2 + index * 0.15}
            />
          ))}
        </div>

        <div className="lg:col-span-4 flex flex-col items-center justify-center my-8 lg:my-0 order-first lg:order-none">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="w-48 h-48 md:w-64 md:h-64 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center relative overflow-hidden"
          >
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border border-zinc-700 animate-pulse"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="text-7xl md:text-9xl opacity-10 select-none"
                style={{ fontFamily: "'Zhi Mang Xing', cursive" }}
              >
                神
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-8 text-center max-w-sm px-4"
          >
            <p className="text-xs md:text-sm italic opacity-40 leading-relaxed font-serif">
              "在灰烬与铁锈的荒原上，只有被选中的灵魂能听到旧神的回响。选择你的命运。"
            </p>
            <button
              onClick={() => setShowGodRulePanel(true)}
              className="mt-4 text-[10px] md:text-xs tracking-[0.2em] uppercase px-4 py-2 border border-zinc-700/80 text-zinc-300 hover:text-[var(--kenshi-gold)] hover:border-[var(--kenshi-gold)] transition-all"
            >
              点击聆听神谕
            </button>
          </motion.div>

          <AnimatePresence>
            {pickedBlessings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mt-6 font-serif flex flex-col items-center gap-2"
              >
                <div className="text-[10px] uppercase text-zinc-500 tracking-widest mb-1">小队抉择已完成</div>
                <button
                  onClick={handleStartJourney}
                  className="px-8 py-3 bg-[var(--kenshi-gold)] text-black border border-transparent font-bold tracking-widest text-sm hover:bg-opacity-80 transition-all active:scale-95 shadow-[0_0_15px_rgba(196,164,132,0.3)] hover:shadow-[0_0_25px_rgba(196,164,132,0.6)]"
                >
                  接受恩赐 / 启程
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6 justify-center">
          {rightColumn.map((god, index) => (
            <GodCard
              key={god.id}
              god={god}
              isActive={pickedBlessings.some(item => god.blessings.some(gb => gb.id === item.blessing.id))}
              onClick={() => handleGodClick(god)}
              alignment="right"
              delay={1.2 + index * 0.15}
            />
          ))}
        </div>
      </main>

      <footer className="relative z-10 p-4 pb-0 mt-12 flex flex-col md:flex-row justify-end items-center md:items-end border-t border-zinc-900 text-[8px] md:text-[10px] tracking-widest uppercase opacity-40">
        <div className="mt-2 md:mt-0">Location: Ashlands / Sector 7</div>
      </footer>

      <AnimatePresence>
        {selectedGod && (
          <BlessingModal
            god={selectedGod.god}
            currentBlessings={selectedGod.currentBlessings}
            onClose={() => setSelectedGod(null)}
            onSelect={handleBlessingSelect}
          />
        )}
        {selectingTarget && (
          <TargetSelectModal
            god={selectingTarget.god}
            blessing={selectingTarget.blessing}
            squad={runtimeSquad}
            onSelect={handleTargetSelect}
            onClose={() => {
              setSelectingTarget(null);
            }}
          />
        )}
        {selectingSacrifice && (
          <TargetSelectModal
            god={selectingSacrifice.god}
            blessing={selectingSacrifice.blessing}
            squad={runtimeSquad.filter(member => member.id !== selectingSacrifice.characterId)}
            onSelect={handleSacrificeSelect}
            onClose={() => {
              setSelectingSacrifice(null);
            }}
            mode="sacrifice"
          />
        )}
        {ritualWarning && <RitualWarningModal warning={ritualWarning} onClose={() => setRitualWarning(null)} />}
        {showGodRulePanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          >
            <div className="absolute inset-0" onClick={() => setShowGodRulePanel(false)} />
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
              className="relative z-10 w-full max-w-2xl reward-card p-6 md:p-8 border border-zinc-700/80 bg-black"
            >
              <h3
                className="text-2xl md:text-3xl mb-4 text-center"
                style={{ fontFamily: "'Zhi Mang Xing', cursive", color: 'var(--kenshi-gold)' }}
              >
                神之分野与降福律令
              </h3>
              <p className="text-sm md:text-base text-zinc-300 leading-relaxed whitespace-pre-line">
                {`赐福等级规则：
队伍最高等级 <40：仅刷新普通
队伍最高等级 40~50：刷新普通+史诗
队伍最高等级 >50：刷新普通+史诗+传说

个人选择规则：
个人等级 <40：仅可选择普通
个人等级 40~50：可选择普通+史诗
个人等级 >50：可选择全部

比普/恶念：始终显示全稀有度；恶念需队伍最高等级≥20才能进入。

特质点规则：每个赐福消耗1点特质点；若目标角色特质点为0，则无法赐福。

四神传说前置：奥克兰 / 克拉尔 / 娜尔可 / 比拉克 各自拥有“传说（解锁前置）”。
该前置不消耗特质点，但只有角色等级 >50 才能承受；未取得此前置者，不能选择对应神系的真正传说赐福。`}
              </p>
              <div className="text-center mt-6">
                <button
                  className="px-6 py-2 border border-zinc-600 text-zinc-200 hover:text-[var(--kenshi-gold)] hover:border-[var(--kenshi-gold)] transition-all tracking-widest text-xs uppercase"
                  onClick={() => setShowGodRulePanel(false)}
                >
                  我已知晓
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
