import { waitUntil } from 'async-wait-until';
import _ from 'lodash';
import {
  Activity,
  ArrowRightLeft,
  Book,
  Brain,
  ChevronLeft,
  Dices,
  Dumbbell,
  Eye,
  Flame,
  HandHeart,
  Heart,
  Maximize2,
  MessageSquare,
  Minimize2,
  Shield,
  ShoppingBag,
  Skull,
  Smile,
  Star,
  Swords,
  Tent,
  Users,
  Wind,
  Wrench,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useState } from 'react';

// --- 数据定义 ---

type TrainingResult = '大失败' | '失败' | '成功' | '大成功';

interface SubCategory {
  id: string;
  name: string;
  desc: string;
}

interface MainCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  subcategories: SubCategory[];
}

interface Member {
  id: string;
  name: string;
  status: string;
  race: string;
  identity?: string;
  rawIntelligence?: number;
  stats: Record<string, number>;
}

const DEMO_MEMBERS: Member[] = [
  {
    id: 'm1',
    name: '无名之辈 (Nameless)',
    status: '健康',
    race: '人类',
    stats: {
      strength: 1,
      agility: 0,
      perception: 1,
      constitution: 0,
      willpower: 1,
      intelligence: 1,
      charisma: 1,
      special: 0,
      combat: 1,
      heal: 0,
      bond: 1,
      prep: 1,
      fun: 0,
    },
  },
  {
    id: 'm2',
    name: '沙克族狂战士 (Shek Warrior)',
    status: '轻伤',
    race: '沙克族',
    stats: {
      strength: 4,
      agility: -1,
      perception: 0,
      constitution: 3,
      willpower: 0,
      intelligence: -1,
      charisma: -2,
      special: 0,
      combat: 4,
      heal: 2,
      bond: -1,
      prep: -1,
      fun: 2,
    },
  },
  {
    id: 'm3',
    name: '蜂巢族工蜂 (Hiver Worker)',
    status: '饥饿',
    race: '蜂巢族',
    stats: {
      strength: -2,
      agility: 4,
      perception: 2,
      constitution: -2,
      willpower: -1,
      intelligence: 1,
      charisma: -1,
      special: 1,
      combat: -1,
      heal: -1,
      bond: 1,
      prep: 4,
      fun: 0,
    },
  },
];

const bodyParts = [
  { id: 'bp1', name: '左臂' },
  { id: 'bp2', name: '右臂' },
  { id: 'bp3', name: '左腿' },
  { id: 'bp4', name: '右腿' },
  { id: 'bp5', name: '头部' },
  { id: 'bp6', name: '心脏' },
];

const craftItems: Record<string, { id: string; name: string; requirements: string }[]> = {
  pr5: [
    { id: 'w1', name: '武士刀类', requirements: '矿石x2, 布料x2' },
    { id: 'w2', name: '钝器类', requirements: '矿石x2, 布料x2' },
    { id: 'w3', name: '大型类', requirements: '矿石x2, 布料x2' },
    { id: 'w4', name: '砍刀类', requirements: '矿石x2, 布料x2' },
    { id: 'w5', name: '长柄刀类', requirements: '矿石x2, 布料x2' },
    { id: 'w6', name: '军刀类', requirements: '矿石x2, 布料x2' },
    { id: 'w7', name: '弩', requirements: '矿石x2, 布料x2' },
    { id: 'w8', name: '弓', requirements: '矿石x2, 布料x2' },
  ],
  pr6: [
    { id: 'a1', name: '轻甲', requirements: '布料x4' },
    { id: 'a2', name: '中甲', requirements: '布料x5, 矿石x2' },
    { id: 'a3', name: '重甲', requirements: '布料x3, 矿石x5' },
  ],
  pr7: [
    { id: 'c1', name: '基础急救包', requirements: '原材料x2, 布料x1' },
    { id: 'c2', name: '标准急救包', requirements: '原材料x3, 布料x2' },
    { id: 'c3', name: '普通夹板包', requirements: '原材料x2, 布料x2, 矿石x1' },
    { id: 'c4', name: '骨人修理包', requirements: '原材料x2, 布料x3, 矿石x3' },
  ],
  pr8: [
    { id: 'c5', name: '高级急救包', requirements: '原材料x5, 布料x4' },
    { id: 'c6', name: '高级夹板包', requirements: '原材料x3, 布料x3, 矿石x2' },
    { id: 'c7', name: '骨人修理箱', requirements: '原材料x5, 布料x5, 矿石x5' },
  ],
  pr9: [
    { id: 'hw1', name: '武士刀类', requirements: '矿石x4, 布料x3' },
    { id: 'hw2', name: '钝器类', requirements: '矿石x4, 布料x3' },
    { id: 'hw3', name: '大型类', requirements: '矿石x4, 布料x3' },
    { id: 'hw4', name: '砍刀类', requirements: '矿石x4, 布料x3' },
    { id: 'hw5', name: '长柄刀类', requirements: '矿石x4, 布料x3' },
    { id: 'hw6', name: '军刀类', requirements: '矿石x4, 布料x3' },
    { id: 'hw7', name: '弩', requirements: '矿石x4, 布料x3' },
    { id: 'hw8', name: '弓', requirements: '矿石x4, 布料x3' },
  ],
  pr10: [
    { id: 'ha1', name: '轻甲', requirements: '布料x6' },
    { id: 'ha2', name: '中甲', requirements: '布料x7, 矿石x2' },
    { id: 'ha3', name: '重甲', requirements: '布料x5, 矿石x7' },
  ],
};

const getTradeRate = (subId: string) => {
  if (subId === 't1') return 0.5;
  if (subId === 't2') return 1;
  if (subId === 't3') return 1.5;
  return 1;
};

const calcTradeOutcome = (
  subId: string,
  type: TrainingResult,
  listedItems: { name: string; quantity: number; unitValue: number }[],
) => {
  if (type === '失败') return '没卖出东西';
  if (type === '大失败') {
    const stolen = listedItems.find(i => i.quantity > 0);
    if (!stolen) return '没卖出东西';
    return `有东西被偷了（${stolen.name}x1）`;
  }

  const rate = getTradeRate(subId);
  const bonus = type === '大成功' ? 1.2 : 1;
  const soldList = listedItems.filter(i => i.quantity > 0).map(i => `${i.name}x${i.quantity}`);
  const income = listedItems.reduce((acc, i) => acc + i.unitValue * i.quantity * rate * bonus, 0);
  const soldText = soldList.length > 0 ? soldList.join('，') : '无';
  return `卖出了【${soldText}】，获得${Math.floor(income)}开币`;
};

const attrMap: Record<string, string> = {
  strength: '力量',
  agility: '敏捷',
  perception: '感知',
  constitution: '体质',
  willpower: '意志',
  intelligence: '智力',
  charisma: '魅力',
  special: '特殊',
  combat: '战斗',
};

const restAttrMap: Record<string, string> = {
  heal: '状态',
  bond: '心情',
  prep: '后勤',
  fun: '精神',
  trade: '交易',
  intimate: '好感度',
  slave_mgmt: '手段',
};

const calcStatModifier = (attrValue: number) => {
  // 按需求：35 -> 0，50 -> +1，15 -> -2；并且对小数执行“远离0取整”
  // 例：-0.5 -> -1，-1.1 -> -2，+0.1 -> +1
  const raw = (attrValue - 35) / 10;
  if (raw === 0) return 0;
  return raw > 0 ? Math.ceil(raw) : Math.floor(raw);
};

const buildMemberFromData = (value: any, fallbackId: string): Member | null => {
  if (!value || value === '待初始化') return null;

  const attr = _.get(value, ['属性'], {});
  const getAttr = (k: string) => {
    const item = _.get(attr, [k]);
    if (typeof item === 'number') return item;
    const base = Number(_.get(item, ['基础'], 30)) || 30;
    const bonus = Number(_.get(item, ['加成'], 0)) || 0;
    return base + bonus;
  };

  return {
    id: String(_.get(value, ['名字'], fallbackId)),
    name: String(_.get(value, ['名字'], fallbackId)),
    status: String(_.get(value, ['状态'], '正常')),
    race: String(_.get(value, ['种族', '名称'], '未知')),
    identity: String(_.get(value, ['身份'], '')),
    rawIntelligence: getAttr('INT'),
    stats: {
      strength: calcStatModifier(getAttr('STR')),
      agility: calcStatModifier(getAttr('DEX')),
      perception: calcStatModifier(getAttr('PER')),
      constitution: calcStatModifier(getAttr('TGH')),
      willpower: calcStatModifier(getAttr('WIL')),
      intelligence: calcStatModifier(getAttr('INT')),
      charisma: calcStatModifier(getAttr('CHA')),
      special: 0,
      combat: 0,
      heal: 0,
      bond: 0,
      prep: 0,
      fun: 0,
    },
  };
};

const calcRecoveryBonusByType = (type: TrainingResult, subId: string) => {
  if (subId === 'pr4') {
    if (type === '大失败') return -20;
    if (type === '失败') return -10;
    if (type === '成功') return 0;
    return 20;
  }

  if (type === '大失败') return -30;
  if (type === '失败') return -10;
  if (type === '成功') return 0;
  return 30;
};

const parseRequirement = (txt: string) => {
  const result = { ore: 0, cloth: 0, raw: 0 };
  if (!txt) return result;
  const regex = /(矿石|布料|原材料)x(\d+)/g;
  let m: RegExpExecArray | null = null;
  while ((m = regex.exec(txt)) !== null) {
    const n = Number(m[2]) || 0;
    if (m[1] === '矿石') result.ore += n;
    if (m[1] === '布料') result.cloth += n;
    if (m[1] === '原材料') result.raw += n;
  }
  return result;
};

const consumeFromPool = (
  pool: { name: string; quantity: number; subCategory: string }[],
  need: number,
  matcher: (sub: string) => boolean,
) => {
  let left = need;
  const parts: string[] = [];
  for (const it of pool) {
    if (left <= 0) break;
    if (!matcher(it.subCategory)) continue;
    const used = Math.min(left, it.quantity);
    if (used > 0) {
      parts.push(`${used}个${it.name}`);
      left -= used;
    }
  }
  return { text: parts.join('+'), fulfilled: left <= 0 };
};

const getForgeQuality = (subId: string, intVal: number, actorName: string) => {
  if (subId === 'pr5') return intVal > 50 ? '普通' : '垃圾';
  if (subId === 'pr9') {
    if (intVal > 90) return `${actorName}大师`;
    if (intVal > 70) return '杰出';
    if (intVal > 50) return '普通';
    return '垃圾';
  }
  return '普通';
};

const buildMemberRuntimeData = (value: any): MemberRuntimeData => {
  const raceName = String(_.get(value, ['种族', '名称'], ''));
  const isSkeleton = raceName.includes('骨人');
  const items = _.get(value, ['背包', '物品'], {}) as Record<string, any>;
  const traumas = _.get(value, ['创伤'], {}) as Record<string, any>;

  let hasFoodOrDrink = false;
  let hasMedical = false;
  let hasSplintKit = false;

  _.forEach(items, (item, itemName) => {
    const count = Number(_.get(item, ['数量'], 0)) || 0;
    if (count <= 0) return;
    const sub = String(_.get(item, ['子分类'], ''));
    if (sub === '食物' || sub === '饮品') hasFoodOrDrink = true;
    if (sub === '医疗用品') {
      const n = String(itemName || '');
      const isSplint = n.includes('夹板包');
      const isSkeletonMedical = n.includes('骨人修理箱') || n.includes('骨人修理包');
      if (isSplint) hasSplintKit = true;
      if (isSkeleton) {
        if (isSkeletonMedical) hasMedical = true;
      } else {
        hasMedical = true;
      }
    }
  });

  const hpCurrent = Number(_.get(value, ['血量', '当前'], 0)) || 0;
  const hpMax = Number(_.get(value, ['血量', '最大'], 0)) || 0;

  let hasAnyTrauma = false;
  const repairableTraumaParts: string[] = [];
  _.forEach(traumas, (partTrauma, partName) => {
    const lvl = Number(_.get(partTrauma, ['等级'], 0)) || 0;
    if (lvl > 0) hasAnyTrauma = true;
    if (lvl === 1 || lvl === 2) {
      if (hasMedical) repairableTraumaParts.push(String(partName));
    } else if (lvl === 3) {
      if (hasSplintKit) repairableTraumaParts.push(String(partName));
    }
  });

  const sellableItems: { name: string; quantity: number; unitValue: number }[] = [];
  const inventoryItems: { name: string; quantity: number; subCategory: string }[] = [];
  _.forEach(items, (item, itemName) => {
    const quantity = Number(_.get(item, ['数量'], 0)) || 0;
    const unitValue = Number(_.get(item, ['价值'], 0)) || 0;
    const subCategory = String(_.get(item, ['子分类'], ''));
    if (quantity > 0) {
      inventoryItems.push({ name: String(itemName || ''), quantity, subCategory });
    }
    if (quantity <= 0 || unitValue <= 0) return;
    sellableItems.push({ name: String(itemName || ''), quantity, unitValue });
  });

  return {
    hpCurrent,
    hpMax,
    hasFoodOrDrink,
    hasMedical,
    hasSplintKit,
    hasAnyTrauma,
    repairableTraumaParts,
    sellableItems,
    inventoryItems,
  };
};

const dcMap: Record<string, number> = {
  s1: 13,
  s3: 17,
  a3: 13,
  a4: 15,
  a5: 16,
  a6: 18,
  a7: 20,
  p1: 14,
  p2: 15,
  p3: 12,
  p4: 18,
  c1: 19,
  c2: 15,
  c3: 13,
  w1: 20,
  w2: 12,
  w3: 16,
  i1: 16,
  i2: 14,
  ch1: 10,
  ch2: 12,
  ch3: 18,
  ch4: 13,
  sp1: 18,
  sp2: 18,
  sp3: 18,
  sp4: 18,
  sp5: 18,
  sp6: 16,
  sp7: 18,
  co1: 15,
  co2: 15,
  h1: 8,
  b1: 8,
  b2: 10,
  pr4: 8,
  pr5: 12,
  pr6: 12,
  pr7: 10,
  pr8: 15,
  pr9: 18,
  pr10: 18,
  f1: 10,
  f2: 8,
  f3: 10,
  t1: 10,
  t2: 15,
  t3: 20,
  in1: 12,
  in2: 15,
  in3: 18,
};

const restCategories: MainCategory[] = [
  {
    id: 'heal',
    name: '修养身心',
    icon: Heart,
    subcategories: [
      {
        id: 'h1',
        name: '整顿休息',
        desc: '找个相对安全的角落裹紧睡袋，包扎自己的伤口并补充食物或饮品，进行一次彻底的个人修整。注意：选择了整顿休息后，该角色本轮将无法再参与任何训练或其他活动。',
      },
    ],
  },
  {
    id: 'bond',
    name: '促进感情',
    icon: MessageSquare,
    subcategories: [
      {
        id: 'b1',
        name: '篝火夜话',
        desc: '坐在篝火旁，讲述自己曾经的过往，与同伴交流心声，并在这片废土中探讨对未来的期望。',
      },
      {
        id: 'b2',
        name: '分享物品',
        desc: '交换各自在废土上搜刮来的奇怪玩意，或者分享相对干净的口粮，在苦涩中体会团队的温暖。',
      },
    ],
  },
  {
    id: 'prep',
    name: '营地杂务',
    icon: Wrench,
    subcategories: [
      { id: 'pr4', name: '给别人包扎伤口', desc: '拿出仅存的医疗包，细心地为受伤的同伴清理和缝合伤口。' },
      { id: 'pr5', name: '武器锻造', desc: '在简陋的火炉旁敲击废铁，尝试打造出能用的防身武器。' },
      { id: 'pr6', name: '护甲锻造', desc: '裁剪皮革和铁片，为队伍修补或制作可以抵御刀剑的护甲。' },
      { id: 'pr7', name: '基础医药制作', desc: '利用随处可见的草药和破布，制作基础的医疗用品。（角色无智力要求）' },
      {
        id: 'pr8',
        name: '高级医药制作',
        desc: '利用提纯的材料和精密的仪器，制作高级医疗骨架或血袋。（要求角色智力>50）',
      },
      { id: 'pr9', name: '高级武器锻造', desc: '在精密的锻造台上，尝试打造出高品质的致命武器。' },
      { id: 'pr10', name: '高级护甲锻造', desc: '使用高级材料，制作具备极高防御性能的护甲。' },
    ],
  },
  {
    id: 'fun',
    name: '消遣娱乐',
    icon: Flame,
    subcategories: [
      { id: 'f3', name: '清点开币', desc: '把可怜的几枚开币翻来覆去地数，幻想能买得起一条机械臂。' },
      {
        id: 'f1',
        name: '掷骨骰',
        desc: '用不知名生物的指骨刻成简易骰子，拿仅剩的几个开币或者是明天的口粮作筹码赌一把。',
      },
      { id: 'f2', name: '发呆冥想', desc: '看着废土的夕阳发呆，思考存在的意义。' },
    ],
  },
  {
    id: 'trade',
    name: '贩物叫卖',
    icon: ShoppingBag,
    subcategories: [
      {
        id: 't1',
        name: '贱卖物品',
        desc: '因急需资金周转，主动放低姿态，慌忙拦住路人进行清仓大甩卖，以远低市场价的金额迅速换取现款。',
      },
      {
        id: 't2',
        name: '正常推销',
        desc: '秉持和气生财的原则，向买家耐心展示商品成色，进行正规客观的推销，按标准市场价稳健地完成公平交易。',
      },
      {
        id: 't3',
        name: '恶意抬价',
        desc: '敏锐洞察到对方物资匮乏、处境窘迫，立刻趁火打劫化身黑心奸商，摆出傲慢姿态疯狂哄抬物价，狠狠敲对方一笔竹杠。',
      },
    ],
  },
  {
    id: 'intimate',
    name: '深入交流',
    icon: HandHeart,
    subcategories: [
      { id: 'in1', name: '亲密互动', desc: '在无人的角落与小队同伴进行更深层的肢体接触，互相抚慰疲惫的身心。' },
      { id: 'in2', name: '灵魂倾诉', desc: '在废土寒冷的夜里相拥，互相倾诉生命中最深处的秘密与恐惧。' },
      { id: 'in3', name: '极乐宣泄', desc: '放下一切克制，用彼此的躯干去填补在这个疯狂世界里活着的虚无感。' },
    ],
  },
];

const slaveCategories: MainCategory[] = [
  {
    id: 'slave_mgmt',
    name: '奴隶管理',
    icon: Skull,
    subcategories: [
      {
        id: 'sm1',
        name: '性处理',
        desc: '对俘虏/奴隶进行特殊的审问与关照，通过身体与精神的双重压迫，让他们认清现实并融入队伍。',
      },
      {
        id: 'sm2',
        name: '肢体移除',
        desc: '出于医疗（或实验）目的，对俘虏的特定部位（肢体/头部/心脏）进行极端的应急切割治疗。',
      },
    ],
  },
  {
    id: 'slave_coach',
    name: '奴隶教练',
    icon: Swords,
    subcategories: [
      { id: 'sc1', name: '力量挑战', desc: '利用奴隶作为负重靶子，进行高强度的力量压制和击打训练。' },
      { id: 'sc2', name: '敏捷戏耍', desc: '把奴隶当作活动障碍物或投掷目标，练习闪避和出手速度。' },
      { id: 'sc3', name: '感知洞察', desc: '让奴隶在暗处躲藏或发动偷袭，训练对杀气的感知。' },
      { id: 'sc4', name: '体质挨揍', desc: '让强大的奴隶单方面殴打你，用肉身硬抗伤害以提升体格。' },
      { id: 'sc5', name: '意志对峙', desc: '在残酷的牢笼里与凶悍的奴隶生死对视，锻炼胆识与精神抗性。' },
      { id: 'sc6', name: '智力解构', desc: '从奴隶的战斗方式和破绽中研究战斗力学与人体弱点结构。' },
      { id: 'sc7', name: '魅力震慑', desc: '去笼子旁边，对抓来的土匪软硬兼施，一会威胁一会许诺，练习话术。' },
    ],
  },
  {
    id: 'slave_work',
    name: '奴隶工作',
    icon: Wrench,
    subcategories: [
      { id: 'sw1', name: '苦力挖矿', desc: '驱使奴隶去开采矿石，榨干他们的最后一丝体力。' },
      { id: 'sw2', name: '荒野采集', desc: '跟着奴隶一起去废土上搜刮资源，以防他们偷懒或逃跑。' },
    ],
  },
];

const categories: MainCategory[] = [
  {
    id: 'strength',
    name: '力量训练',
    icon: Dumbbell,
    subcategories: [
      { id: 's1', name: '负重行军', desc: '背满大重量物品长途行走，锻炼核心力量。' },
      { id: 's3', name: '重型武器挥舞', desc: '拿一把重型武器或者大重量物品，进行挥舞。' },
    ],
  },
  {
    id: 'agility',
    name: '敏捷训练',
    icon: Wind,
    subcategories: [
      { id: 'a3', name: '轻装徒手格斗', desc: '不使用武器，以极快的速度进行连续打击练习。' },
      { id: 'a4', name: '撬废锁', desc: '找一堆从废墟捡来的烂锁和箱子，用铁丝反复练习开锁，弄坏了就换下一个。' },
      { id: 'a5', name: '潜行蹲走', desc: '蹲在地上围着营地边缘绕圈，练习不出声的步伐。' },
      { id: 'a6', name: '逃跑', desc: '在被什么都不存在的风沙追赶的幻想中，发疯般狂奔。' },
      { id: 'a7', name: '撬高级锁', desc: '尝试用粗糙的工具撬开设计复杂的精密锁。' },
    ],
  },
  {
    id: 'perception',
    name: '感知训练',
    icon: Eye,
    subcategories: [
      { id: 'p1', name: '夜间放哨', desc: '在漆黑的荒野中凝视，试图在暗影中分辨出远处物体的轮廓。' },
      { id: 'p2', name: '弩箭射击靶场', desc: '使用老旧的弩箭瞄准远处的废料堆进行射击。' },
      { id: 'p3', name: '盯人', desc: '闲着没事就死死盯着营地里其他队员或俘虏，看他们手往哪放，眼睛往哪瞟。' },
      { id: 'p4', name: '蒙眼躲闪', desc: '闭上双眼，仅凭直觉与虚空中的致命敌人进行殊死对抗与躲闪。' },
    ],
  },
  {
    id: 'constitution',
    name: '体质训练',
    icon: Shield,
    subcategories: [
      { id: 'c1', name: '挨打沙袋', desc: '自己拿着武器或者钝器往身上不断重击，练习抗击打能力与肌肉硬度。' },
      { id: 'c2', name: '恶劣狂风', desc: '在恶劣环境中静坐，让皮肤适应这残酷的世界。' },
      { id: 'c3', name: '极限长跑', desc: '什么都不带，光着脚在沙地或崎岖地形上一刻不停地跑，跑到呕吐为止。' },
    ],
  },
  {
    id: 'willpower',
    name: '意志训练',
    icon: Brain,
    subcategories: [
      { id: 'w1', name: '失血清醒', desc: '自己割开伤口，在痛苦和失血中保持清醒，拒绝昏迷。' },
      { id: 'w2', name: '噪音适应', desc: '故意找一个吵闹的环境旁边强行打坐、睡觉。' },
      { id: 'w3', name: '绝食', desc: '不吃一点食物，练习抗压挨饿。' },
    ],
  },
  {
    id: 'intelligence',
    name: '智力训练',
    icon: Book,
    subcategories: [
      { id: 'i1', name: '研读古籍', desc: '在昏暗的油灯下解析旧帝国遗留下来的科技蓝图。' },
      { id: 'i2', name: '医疗实践', desc: '用粗糙的绷带为受伤的沙鼠包扎，了解基础解剖学。' },
    ],
  },
  {
    id: 'charisma',
    name: '魅力训练',
    icon: Smile,
    subcategories: [
      { id: 'ch1', name: '放肆吹嘘', desc: '没人理的时候，对着木桩子大声演讲、练习脏话或者吹嘘自己的战绩。' },
      { id: 'ch2', name: '装可怜', desc: '穿上最破的破布，躺在营地门口地上装残废，练习怎么引起别人的同情。' },
      { id: 'ch4', name: '倒卖破烂', desc: '拿着一堆垃圾，尝试在队友或路过的流浪者之间互相推销，交易。' },
    ],
  },
  {
    id: 'special',
    name: '特殊训练',
    icon: Star,
    subcategories: [
      {
        id: 'sp1',
        name: '特殊魅力：诱惑/勾引',
        desc: '对着营地里的队友或者路过的陌生人，强行抛媚眼、讲荤段子、进行言语挑逗（色诱）。',
      },
      {
        id: 'sp2',
        name: '特殊感知：蒙眼夜游',
        desc: '用破布把眼睛死死蒙住，在遍布熟睡队友的营地里瞎走，纯靠听脚步声、听呼噜声和闻队友几天没洗澡的体味来辨别方向。',
      },
      {
        id: 'sp3',
        name: '特殊力量：活体深蹲',
        desc: '闲着没事干，像发癫一样突然把营地里最胖/装备最重的队友扛在肩膀上做深蹲。',
      },
      {
        id: 'sp4',
        name: '特殊敏捷：指缝插刀',
        desc: '一个人坐在营地篝火旁，把手按在桌上，拿匕首在指缝间疯狂猛扎（俄罗斯轮盘刀）。',
      },
      {
        id: 'sp5',
        name: '特殊体质：异食癖',
        desc: '故意去翻营地里的垃圾桶/腐烂食物桶，吃发臭的生肉和不明生物的内脏。',
      },
      {
        id: 'sp6',
        name: '特殊智力：机械冥想',
        desc: '对着营地里嗡嗡作响的发电机或损坏的机械残肢自言自语，试图通过“冥想”理解机械内部的运转逻辑。',
      },
      {
        id: 'sp7',
        name: '特殊意志：抖M训练',
        desc: '要求小队成员围成一圈，对着自己用废土上最恶毒的脏话进行长达数小时的人身攻击（辱骂抗压）；或者自己去盯着营地最刺眼的火炉底座/直视烈日，眼睛流泪了也不眨眼。',
      },
    ],
  },
  {
    id: 'combat',
    name: '战斗训练',
    icon: Swords,
    subcategories: [
      { id: 'co1', name: '互相博弈', desc: '挑选一名小队成员，你与他共同进行实战对战训练。' },
      { id: 'co2', name: '战术推演', desc: '挑选一名小队成员，你与他共同进行战术推演训练。' },
    ],
  },
];

// --- 实用组件 ---

const BackgroundNoise = () => (
  <div
    className="fixed inset-0 pointer-events-none opacity-[0.05] z-[99]"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
    }}
  />
);

type MemberStatusData = {
  training?: { text: string; type: TrainingResult; isFullAction?: boolean; actionKey?: string }[];
  rest?: { text: string; type: TrainingResult; isFullAction?: boolean; actionKey?: string }[];
};

type CampLogSection = '休息交谈' | '训练终端' | '奴隶处置';

type CampActionLog = {
  section: CampLogSection;
  memberName: string;
  mainCategoryName: string;
  subCategoryName: string;
  resultType: TrainingResult;
  resultDesc: string;
  resultEffect: string;
};

type MemberRuntimeData = {
  hpCurrent: number;
  hpMax: number;
  hasFoodOrDrink: boolean;
  hasMedical: boolean;
  hasSplintKit: boolean;
  hasAnyTrauma: boolean;
  repairableTraumaParts: string[];
  sellableItems: { name: string; quantity: number; unitValue: number }[];
  inventoryItems: { name: string; quantity: number; subCategory: string }[];
};

const trainingEffects: Record<string, { [key in TrainingResult]?: (attrName: string) => string }> = {
  s1: { 大失败: a => `${a}-1`, 失败: a => `${a}无提升`, 成功: a => `${a}+1`, 大成功: a => `${a}+2` },
  s3: { 大失败: a => `${a}-2`, 失败: a => `${a}无提升`, 成功: a => `${a}+2`, 大成功: a => `${a}+3` },
  a3: { 大失败: a => `${a}-1`, 失败: a => `${a}无提升`, 成功: a => `${a}+1`, 大成功: a => `${a}+2` },
  a4: { 大失败: a => `${a}无提升`, 失败: a => `${a}无提升`, 成功: a => `${a}无提升`, 大成功: a => `${a}+1` },
  a7: { 大失败: a => `${a}-1`, 失败: a => `${a}无提升`, 成功: a => `${a}+2`, 大成功: a => `${a}+3` },
  a5: { 大失败: a => `${a}-3`, 失败: a => `${a}-2`, 成功: a => `${a}+2`, 大成功: a => `${a}+3` },
  p1: { 大失败: a => `${a}-1`, 失败: a => `${a}无提升`, 成功: a => `${a}+1`, 大成功: a => `${a}+2` },
  p2: { 大失败: a => `${a}-2`, 失败: a => `${a}-1`, 成功: a => `${a}+2`, 大成功: a => `${a}+3` },
  p3: { 大失败: a => `${a}-1`, 失败: a => `${a}无提升`, 成功: a => `${a}+1`, 大成功: a => `${a}+1` },
  p4: { 大失败: a => `${a}-3`, 失败: a => `${a}-2`, 成功: a => `${a}+3`, 大成功: a => `${a}+4` },
  c1: { 大失败: a => `${a}-4`, 失败: a => `${a}-2`, 成功: a => `${a}+3`, 大成功: a => `${a}+4` },
  c2: { 大失败: a => `${a}-2`, 失败: a => `${a}-1`, 成功: a => `${a}+1`, 大成功: a => `${a}+2` },
  c3: { 大失败: a => `${a}-1`, 失败: a => `${a}无提升`, 成功: a => `${a}+1`, 大成功: a => `${a}+1` },
  w1: { 大失败: a => `${a}-4`, 失败: a => `${a}-2`, 成功: a => `${a}+3`, 大成功: a => `${a}+4` },
  w2: { 大失败: a => `${a}-1`, 失败: a => `${a}无提升`, 成功: a => `${a}+1`, 大成功: a => `${a}+1` },
  w3: { 大失败: a => `${a}-2`, 失败: a => `${a}-1`, 成功: a => `${a}+1`, 大成功: a => `${a}+2` },
  i1: { 大失败: a => `${a}-1`, 失败: a => `${a}无提升`, 成功: a => `${a}+1`, 大成功: a => `${a}+2` },
  i2: { 大失败: a => `${a}-2`, 失败: a => `${a}-1`, 成功: a => `${a}+2`, 大成功: a => `${a}+3` },
  ch1: { 大失败: a => `${a}无提升`, 失败: a => `${a}无提升`, 成功: a => `${a}+1`, 大成功: a => `${a}+1` },
  ch2: { 大失败: a => `${a}-1`, 失败: a => `${a}无提升`, 成功: a => `${a}+1`, 大成功: a => `${a}+2` },
  ch3: { 大失败: a => `${a}-2`, 失败: a => `${a}-1`, 成功: a => `${a}+2`, 大成功: a => `${a}+2` },
  ch4: { 大失败: a => `${a}-1`, 失败: a => `${a}无提升`, 成功: a => `${a}+1`, 大成功: a => `${a}+2` },
  sp1: { 大失败: a => `${a}-2`, 失败: a => `${a}-1`, 成功: a => `${a}+2`, 大成功: a => `${a}+3` },
  sp2: { 大失败: a => `${a}-2`, 失败: a => `${a}-1`, 成功: a => `${a}+2`, 大成功: a => `${a}+3` },
  sp3: { 大失败: a => `${a}-2`, 失败: a => `${a}-1`, 成功: a => `${a}+2`, 大成功: a => `${a}+3` },
  sp4: { 大失败: a => `${a}-2`, 失败: a => `${a}-1`, 成功: a => `${a}+2`, 大成功: a => `${a}+3` },
  sp5: { 大失败: a => `${a}-2`, 失败: a => `${a}-1`, 成功: a => `${a}+2`, 大成功: a => `${a}+3` },
  sp6: { 大失败: a => `${a}-2`, 失败: a => `${a}-1`, 成功: a => `${a}+1`, 大成功: a => `${a}+2` },
  sp7: { 大失败: a => `${a}-2`, 失败: a => `${a}-1`, 成功: a => `${a}+2`, 大成功: a => `${a}+3` },
  co1: {
    大失败: () => `力/敏/体/感-2`,
    失败: () => `力/敏/体/感-1`,
    成功: () => `力/敏/体/感+1`,
    大成功: () => `力/敏/体/感+2`,
  },
  co2: { 大失败: () => `智力-3`, 失败: () => `智力-2`, 成功: () => `智力+2 EXP+100`, 大成功: () => `智力+3 EXP+250` },
};

const actionDescriptions: Record<
  string,
  { [key in TrainingResult]?: (name: string, targetName: string, craftName?: string, bodyPart?: string) => string }
> = {
  s1: {
    大失败: name => `${name}步子迈得太大，重物倾倒狠狠砸在背上，造成了严重的擦伤。`,
    失败: name => `${name}气喘吁吁，几步后就被重物压得直不起腰，只好放弃。`,
    成功: name => `${name}咬着牙走完了全程，脊背和双腿的肌肉感受到了充实的拉扯。`,
    大成功: name => `${name}健步如飞，不仅轻松负重折返，甚至感受不到一丝疲惫，肌肉力量显著提升！`,
  },
  s3: {
    大失败: name => `${name}用力过猛，关节发出令人牙酸的脆响，武器脱手飞出差点砸中自己。`,
    失败: name => `${name}虽然举起了沉重的武器，但挥舞起来毫无章法可言，纯粹在浪费体力。`,
    成功: name => `${name}稳住了腰背和肩肘，沉重挥砍终于有了章法。`,
    大成功: name => `${name}的动作行云流水，沉重的武器在手中仿佛失去了重量，每一击都伴随着破空的呼啸！`,
  },
  a3: {
    大失败: name => `${name}动作太快导致脚底打滑，重重地摔在地上，扭伤了脚踝。`,
    失败: name => `${name}胡乱挥舞着拳脚，出汗很多但准头极差。`,
    成功: name => `${name}步伐灵动，连续几套打击动作干净利落，反应速度提升了。`,
    大成功: name => `如同一阵无形的旋风，${name}的拳影甚至在空中留下了残像，完美掌控了身体的每一个细节！`,
  },
  a4: {
    大失败: name => `${name}不但折断了最后一根铁丝，锁芯里还飞出碎片扎破了手指。`,
    失败: name => `锁芯传来无意义的摩擦声，${name}捣鼓了半天也一无所获。`,
    成功: name => `伴随清脆的“咔哒”声，${name}成功拨开了烂锁，手感渐渐熟悉。`,
    大成功: name => `不可思议！${name}仅仅扫了一眼锁眼，随手一拨便将其打开，简直像呼吸一样自然！`,
  },
  a5: {
    大失败: name => `${name}一脚踩碎了地上的枯骨，清脆的响声吸引了所有的注意力，潜行极其失败。`,
    失败: name => `${name}走得太急，衣服不断摩擦发出声响。`,
    成功: name => `${name}像只幽灵一样无声无息地绕过了营地几圈。`,
    大成功: name => `${name}甚至从同伴身后紧贴着经过都没被发现，脚步完美融入了环境音！`,
  },
  a6: {
    大失败: name => `${name}在狂奔中绊倒在地，吃了一嘴的沙子还闪了腰。`,
    失败: name => `跑着跑着${name}就岔了气，蹲在地上痛苦地喘息。`,
    成功: name => `在一路狂奔的幻想中，${name}榨干了体能并突破了极限。`,
    大成功: name => `${name}宛如一头受惊的沙漠猛兽，用惊人的速度甩开了假想中的所有威胁！`,
  },
  a7: {
    大失败: name => `${name}把工具死死卡在了精密锁芯里，锁报废了，甚至触发了防盗电流。`,
    失败: name => `精密锁的内部结构过于复杂，令${name}头昏脑涨，毫无进展。`,
    成功: name => `一次惊险的尝试后，${name}成功推开内部阻针，解开了这把高级锁。`,
    大成功: name => `就像解开一道精美的谜题，${name}闭上眼睛完美地拆解了这件复杂的艺术品！`,
  },
  p1: {
    大失败: name => `在黑暗中放哨时，${name}把远处的巨木当成了怪物，引起了不小的骚动。`,
    失败: name => `夜色太深，${name}只能看见模糊的影子，眼睛除了酸痛再无其他感受。`,
    成功: name => `${name}在黑暗中静心凝视，渐渐能分辨出风吹草动中的细微轮廓。`,
    大成功: name => `宛如长着鹰眼一般，即便是极暗的黑夜也无法阻挡${name}捕捉到百米外的异动！`,
  },
  p2: {
    大失败: name => `${name}扣下扳机时弩弦崩断，猛力抽打在手臂上，留下了一道血痕。`,
    失败: name => `几发射出的弩箭全都没能射中目标，${name}只好叹气。`,
    成功: name => `${name}调整了呼吸与瞄准镜，稳稳地命中了远处的废料堆。`,
    大成功: name => `百步穿杨！${name}的箭矢正中靶心，完美的射击节奏印刻在了肌肉记忆中！`,
  },
  p3: {
    大失败: (name, target) => `${name}盯得太过火，直接惹怒了对方，差点当场起冲突。`,
    失败: (name, target) => `${name}看得眼睛都酸了，也没看出什么有用的破绽。`,
    成功: (name, target) => `通过长时间的观察，${name}发现了对方一些习惯性的小动作。`,
    大成功: (name, target) => `${name}犹如洞悉人心的猎手，从对方细微的神情和肢体中完全看透了其心理状态！`,
  },
  p4: {
    大失败: name => `${name}在盲视躲闪时一头撞上了坚固的掩体，当场眼冒金星。`,
    失败: name => `蒙着眼睛使得${name}完全失去了方向感，步伐凌乱。`,
    成功: name => `虽然看不见，但${name}凭借着直觉成功躲过了数次空气中的假想攻击。`,
    大成功: name => `令人惊叹！即便失去视觉，${name}依然能如水般化解所有袭来的虚空攻击！`,
  },
  c1: {
    大失败: name => `${name}对自己下狠手太重了，敲断了两根肋骨。`,
    失败: name => `几轮自虐般的重击让${name}痛得直不起腰，根本坚持不下去。`,
    成功: name => `咬牙忍受着钝痛，${name}的肌肉在不断的锤击下变得更加坚韧。`,
    大成功: name => `痛苦化为了力量！${name}突破了肉体极限，抗击打能力惊人地硬如钢铁！`,
  },
  c2: {
    大失败: name => `${name}在极限风沙中呆得太久，被割破了多处皮肤，感染了沙尘。`,
    失败: name => `风沙真的太折磨人了，${name}很快就逃回了帐篷。`,
    成功: name => `${name}在狂风中静坐冥想，皮肤渐渐适应了这种粗糙的割裂感。`,
    大成功: name => `风暴中${name}巍然不动，仿佛与废土的恶劣条件完全融为一体！`,
  },
  c3: {
    大失败: name => `跑到一半时${name}由于脱水过度劳累，一头栽倒在沙丘里。`,
    失败: name => `跑了一小段路，${name}就感到胸腔像火烧一样，不得不停下。`,
    成功: name => `汗水浸透了衣服，但${name}坚持跑完了这趟极限马拉松。`,
    大成功: name => `越跑越轻盈！${name}突破极点，仿佛拥有了永不枯竭的耐力！`,
  },
  w1: {
    大失败: name => `伤口大量失血，${name}很快由于失血过多陷入了休克。`,
    失败: name => `${name}尝试在失血中保持清醒，但剧痛和眩晕还是击倒了他。`,
    成功: name => `脸色苍白冷汗直流，${name}依然强撑着没有昏迷，意志进一步坚定。`,
    大成功: name => `战胜了虚弱的肉体本能！${name}的心智如同被重锤锻打过一般坚不可摧！`,
  },
  w2: {
    大失败: name => `环境实在太吵，${name}没能静心，反而变得极度暴躁抓狂。`,
    失败: name => `喧哗声不断刺激神经，${name}完全无法排除干扰。`,
    成功: name => `${name}在嘈杂声中成功闭目养神，心境不再受外界影响。`,
    大成功: name => `太奇妙了，震耳欲聋的杂音在${name}耳中都化为了助眠的白噪音！`,
  },
  w3: {
    大失败: name => `饿得胃酸倒流，${name}虚弱得吐出了胆汁，状态极差。`,
    失败: name => `饥饿本能战胜了理性，${name}绝食没能走到底。`,
    成功: name => `忍受住了胃抽筋的绞痛，${name}用理智强压下进食欲望。`,
    大成功: name => `饥饿不仅没有击倒${name}，反而让他精神更加空明透彻，意志力爆表！`,
  },
  i1: {
    大失败: name => `${name}强行解读看不懂的图纸，搞乱了资料，一怒之下把书撕成了废纸。`,
    失败: name => `复杂的理论让${name}满头大汗，完全是在看天书。`,
    成功: name => `反复推敲后，${name}终于弄懂了古代文献中几项实用原理。`,
    大成功: name => `犹如醍醐灌顶！${name}瞬间看破了蓝图上所有的机械逻辑，智力飙升！`,
  },
  i2: {
    大失败: name => `${name}没能处理好沙鼠的伤，反而用粗劣的手法一刀终结了它的生命。`,
    失败: name => `绷带缠得像死结，${name}的解剖实践弄得一团糟。`,
    成功: name => `${name}按步骤稳稳处理，伤口状态明显比之前更可控。`,
    大成功: name => `完美的手术！${name}精确避开致命神经，展现了惊艳的医学天赋。`,
  },
  ch1: {
    大失败: name => `${name}大声吹嘘时咬到了舌头，满嘴是血，引来一片嘘声。`,
    失败: name => `${name}吹得连自己都觉得尴尬。`,
    成功: name => `${name}越说越起劲，这通漫天胡扯确实锻炼了口才。`,
    大成功: name => `雄辩四方！${name}煽动性极强的演讲连周围的木桩子听了都感到热血沸腾！`,
  },
  ch2: {
    大失败: name => `${name}躺在地上装死，被路过的野兽踩在身上，极其狼狈。`,
    失败: name => `${name}躺了半天也没人停步，只吃了一嘴风沙。`,
    成功: name => `${name}凄惨的模样很逼真，成功引发了路人的少许同情。`,
    大成功: name => `闻者伤心见者流泪！${name}生动演绎的苦肉计，任何铁石心肠看了都会生出恻隐之心！`,
  },
  ch3: {
    大失败: name => `俘虏不仅不开口，反而狠狠用头撞破了${name}的鼻子，场面失控。`,
    失败: name => `${name}费尽口舌，俘虏依然是一副看傻子的眼神。`,
    成功: name => `连哄带骗下，${name}成功用言语攻势突破了俘虏的心理防线。`,
    大成功: name => `${name}如同魔鬼般的威慑力瞬间震慑了俘虏，对方连小时候的事都全盘托出！`,
  },
  ch4: {
    大失败: (name, target) => `${name}口水喷在了对方脸上，激怒了顾客，不仅没卖出还差点挨打。`,
    失败: (name, target) => `${name}推销了半天，对方只是摇摇头走开了。`,
    成功: (name, target) => `${name}通过话术，成功把一些破烂换成了零碎的开币。`,
    大成功: (name, target) => `商业奇才！${name}巧舌如簧，竟用高价把毫无价值的石头卖了出去！`,
  },
  sp1: {
    大失败: (name, target) => `${name}的挑逗像生锈齿轮一样生硬，对方只是冷冷看${name}一眼。`,
    失败: (name, target) => `${name}强行抛媚眼，但对象完全无视了这尴尬的举动。`,
    成功: (name, target) => `不知是巧合还是真情流露，${name}成功挑拨起了空气中一丝异样的暧昧。`,
    大成功: (name, target) => `魅力绝望爆表！${name}一个不经意的眼神就让对方如痴如醉陷入幻象！`,
  },
  sp2: {
    大失败: name => `${name}瞎蒙着眼乱踩，一脚踩进了火堆里，被严重烧伤。`,
    失败: name => `${name}在黑暗中晕头转向，跌跌撞撞到处碰壁。`,
    成功: name => `屏住呼吸，${name}成功通过嗅觉和听觉避开了数个障碍。`,
    大成功: name => `超越肉眼！${name}在蒙眼下如同夜魔附体，对环境风吹草动了如指掌！`,
  },
  sp3: {
    大失败: (name, target) => `${name}硬扛最重的家伙，腰部发出咔咔脆响，急性腰间盘突出痛不欲生。`,
    失败: (name, target) => `${name}扛到一半体力不支，两人狼狈地摔作一团。`,
    成功: (name, target) => `${name}像机器一样扛着重物做完了极限深蹲。`,
    大成功: (name, target) => `夸张的怪力！${name}挥洒自如地进行活体深蹲，引来全场惊呼！`,
  },
  sp4: {
    大失败: name => `刀尖精准扎穿了${name}的手背，血流如注。`,
    失败: name => `刚划破指层皮，${name}就慌乱地停下了这种赌命游戏。`,
    成功: name => `一顿操作花里胡哨，${name}毫发无伤地完成了轮盘刀。`,
    大成功: name => `神乎其技！残影中${name}的匕首在指缝间疯狂跳跃，敏捷登峰造极！`,
  },
  sp5: {
    大失败: name => `吞下内脏后${name}当场狂吐不止，脸色发青，中了极度严重的食物毒。`,
    失败: name => `嚼了一口这恶臭的东西，${name}受不了直接吐了出来。`,
    成功: name => `${name}面无表情地咽下腐烂食物，肠胃变得更加坚实。`,
    大成功: name => `不可理喻的变态食腐者！${name}将剧毒之物当甘露咽下，体质发生了非人的变异！`,
  },
  sp6: {
    大失败: name => `死盯着发电机看导致${name}眼球布满血丝，脑仁疼得仿佛要炸开。`,
    失败: name => `嗡嗡声只让${name}越发烦躁，“机械冥想”根本没效。`,
    成功: name => `${name}逐渐在发电机运转声中，领悟了某种特殊的机械逻辑。`,
    大成功: name => `真理之门大开！${name}一瞬间听懂了机械的低语，大脑算力突破极限！`,
  },
  sp7: {
    大失败: (name, target) => `${name}尝试精神压制失败，反而遭到反噬，陷入剧烈头痛。`,
    失败: (name, target) => `无意义的瞪眼比赛，${name}的双眼酸涩无比。`,
    成功: (name, target) => `在视线交锋中，${name}咬牙坚持取得了精神上的微微压制。`,
    大成功: (name, target) => `无匹的霸道精神力！${name}仅凭凌厉的眼神，就让对方在脑海中臣服发抖！`,
  },
  co1: {
    大失败: (name, target) => `在博弈中毫无保留，${name}被狠敲了一闷棍，受了重伤。`,
    失败: (name, target) => `两人根本配合不到一起，打起架来像在街头混战互殴。`,
    成功: (name, target) => `${name}与对手相互喂招，纠正了不少动作上的隐患。`,
    大成功: (name, target) => `电光火石的碰撞！每一击都妙到毫巅，${name}的战斗直觉得到了极致的洗礼！`,
  },
  co2: {
    大失败: (name, target) => `因分歧严重，${name}的推演变成了争吵和相互指责。`,
    失败: (name, target) => `纸上谈兵终究太空泛，${name}推演了半天毫无启发。`,
    成功: (name, target) => `${name}在废土破旧地图上进行了深度推演，收获了实用的战争经验。`,
    大成功: (name, target) => `仿佛预见了未来的一切变数！${name}制定的完美计划毫无破绽，连战争大师都自愧不如！`,
  },
  h1: {
    大失败: name => `${name}本想好好休整，睡袋却破了个大洞，冻了一晚状态更差了。`,
    失败: name => `${name}翻来覆去睡不着，这趟休整的效果实在令人失望。`,
    成功: name => `${name}在粗糙的睡袋里找了个舒服位置，难得打了个安稳的盹。`,
    大成功: name => `高品质的长眠！${name}在这片角落里深度放松，伤痛与疲惫一扫而空！`,
  },
  b1: {
    大失败: (name, target) => `由于分歧严重，你们在篝火前爆发了口角，甚至有人拔出了刀。情况变得更糟了。`,
    失败: (name, target) => `风沙太大，或是大家早已疲惫不堪。这只是一段死寂沉沉且毫无交流的夜话。`,
    成功: (name, target) => `你们把一些藏着的话说开了，火光下的沉默不再那么尴尬。`,
    大成功: (name, target) => `极其罕见的欢乐安宁时光！痛苦似乎暂时离去，你们甚至开始畅想那遥不可及的未来。`,
  },
  b2: {
    大失败: (name, target) => `你们分享时为了分配不均吵了起来，感觉彼此都是自私自利的混蛋。`,
    失败: (name, target) => `互相看了看对方手里劣质的黑面包，你们都没什么胃口。`,
    成功: (name, target) => `通过交换一些能用的物资，你们之间的感情拉近了些许。`,
    大成功: (name, target) => `犹如久旱逢甘霖！你们不仅交换到了梦寐以求的物资，更在互帮互助中感受到了兄弟般的情谊！`,
  },
  sm1: {
    大失败: (name, target) => `${name}强行亲吻${target}，却被${target}一把推开，反而挨了一记耳光，狼狈不堪。`,
    失败: (name, target) => `${name}在${target}耳边低语挑逗，虽然${target}没能完全抗拒，但浑身绷紧，显然很不舒服。`,
    成功: (name, target) => `${name}的撩拨让${target}面色潮红，呼吸渐乱，虽然有所抵触，但最终还是沉醉其中。`,
    大成功: (name, target) => `${name}一个深情的眼神就让${target}心神荡漾，主动靠近，两人陷入热烈的纠缠，欲罢不能！`,
  },
  sm2: {
    大失败: (name, target, craft, bp) =>
      `${name}在对${target}的${bp}进行切割时手部强烈颤抖，导致大出血，情况变得更为致命了。`,
    失败: (name, target, craft, bp) => `${name}对着${target}的${bp}研究了半天，最终还是下不去手或者找不到正确的切口。`,
    成功: (name, target, craft, bp) => `${name}冷酷而精准地处理了${target}的${bp}，手法干净利落。`,
    大成功: (name, target, craft, bp) =>
      `神医再世（物理）！${name}对${target}的${bp}的处理不仅快准狠，甚至顺手做了一点"小改良"！`,
  },
  sc1: {
    大失败: (name, target) => `${name}轻敌冒进，被作为沙包的${target}抓住机会反制，反而受了重伤。`,
    失败: (name, target) => `${name}发力过猛扭伤了腰，只能扶着墙揉了半天，训练彻底泡汤。`,
    成功: (name, target) => `在${target}身上尽情倾泻怒火，${name}的肌肉记忆与发力技巧都有所提升。`,
    大成功: (name, target) => `完美压制！${name}每一击都爆发出惊人的力量，不仅打服了${target}，甚至领悟了重击的精髓！`,
  },
  sc2: {
    大失败: (name, target) => `${target}突然暴走，${name}躲闪不及被狠狠咬咬了一口，颜面尽失。`,
    失败: (name, target) => `${name}闪得太投入，一不小心绊倒在自己的脚跟上，摔了个狗啃泥。`,
    成功: (name, target) => `借着${target}胡乱的挥舞，${name}成功进行了多次灵活的闪避练习。`,
    大成功: (name, target) => `鬼魅身法！在与${target}的较量中，${name}的身手变得如同幻影般难以捉摸！`,
  },
  sc3: {
    大失败: (name, target) => `原本是在训练预判，结果${name}反而被${target}的阴险假动作给骗得不知所措。`,
    失败: (name, target) => `${name}盯得太入神，结果把阴影里的破箱子当成了${target}，扑了个空还扭了脚。`,
    成功: (name, target) => `通过捕捉${target}在暗处的细微动静，${name}成功磨练了对杀意的感知。`,
    大成功: (name, target) => `鹰眼入微！${target}的每一个细微的肌肉颤动都在${name}的感官中无限放大！`,
  },
  sc4: {
    大失败: (name, target) => `${name}高估了自己的抗击打能力，被${target}狠狠一拳放倒，不得不进入急救状态。`,
    失败: (name, target) =>
      `${name}刚摆好姿势，${target}一拳挥来，${name}吓得闭眼偏头，结果拳头擦着耳边过去，自己却被自己的后仰动作闪了腰。`,
    成功: (name, target) => `通过硬抗${target}的攻击，${name}皮肉上的淤青转化为坚实的骨骼密度。`,
    大成功: (name, target) => `铁骨铮铮！在${target}狂风暴雨般的痛击中，${name}的抗打击能力迎来了某种质变！`,
  },
  sc5: {
    大失败: (name, target) => `刚一对视，${target}眼中极度的凶光就让${name}不寒而栗，甚至有了心理阴影。`,
    失败: (name, target) => `${name}试图用眼神压制${target}，结果自己先撑不住笑了场，气势全无。`,
    成功: (name, target) => `在阴暗的禁闭室与${target}拼死相博的气场中，${name}的胆识变得更强了。`,
    大成功: (name, target) => `霸王色震慑！${name}仅凭一个眼神就让凶悍的${target}跪地求饶，精神力达到顶峰！`,
  },
  sc6: {
    大失败: (name, target) => `因为凑得过于仔细观察，${name}被${target}迎面吐了一口带血的唾沫，恶心得不行。`,
    失败: (name, target) => `${name}盯着${target}的关节看了半天，结果完全看不懂对方的发力逻辑，反而把自己绕晕了。`,
    成功: (name, target) => `通过解析${target}的挣扎方式，${name}总结出了一些非常实用的人体力学弱点。`,
    大成功: (name, target) => `解剖级洞见！${target}的骨骼构造与肌肉破绽在${name}眼中如同透明的教科书般清晰！`,
  },
  sc7: {
    大失败: (name, target) => `俘虏不仅不开口，反而狠狠用头撞破了${name}的鼻子，场面失控。`,
    失败: (name, target) => `${name}刚摆出审讯架势，结果自己先被俘虏的眼神盯得心里发毛，结巴得说不出完整句子。`,
    成功: (name, target) => `连哄带骗下，${name}成功用言语攻势突破了俘虏的心理防线。`,
    大成功: (name, target) => `${name}如同魔鬼般的威慑力瞬间震慑了俘虏，对方连小时候的事都全盘托出！`,
  },
  sw1: {
    大失败: (name, target) => `${name}一个没盯紧，${target}借着下矿坑的机会直接溜之大吉跑路了！`,
    失败: (name, target) => `${target}在矿洞里消极怠工，忙活了半天只是在敲打普通的废土岩石，什么都没采到。`,
    成功: (name, target) => `在${name}的严密监工下，${target}乖乖敲下了一些品质尚可的矿石。`,
    大成功: (name, target) => `${target}仿佛生来就是挖矿的奇才与机器！疯狂开采了大量高品质矿石，让${name}大丰收！`,
  },
  sw2: {
    大失败: (name, target) => `${name}一个没注意，${target}竟然在危机四伏的野外找到机会逃跑了！`,
    失败: (name, target) => `跟着${target}在野外乱转了一通，结果连一根能用的废料都没采到，白费力气。`,
    成功: (name, target) => `${name}监督着${target}在垃圾堆里翻找，勉强寻回了一些布料废料和基础物资。`,
    大成功: (name, target) => `${name}跟着${target}竟然走运地发现了一个未被搜刮的资源点！满载而归大丰收！`,
  },
  pr4: {
    大失败: (name, target) => `${name}粗暴的手法把伤口扯得更大，疼得对方呲牙咧嘴倒吸凉气。`,
    失败: (name, target) => `不仅没包扎好，${name}还把干净的绷带全浪费了。`,
    成功: (name, target) => `${name}细心清理缝合，总算帮受伤的同伴把血止住了。`,
    大成功: (name, target) => `妙手回春！${name}这包扎手法简直是大师级，伤者甚至感觉不到一丝痛苦！`,
  },
  pr5: {
    大失败: (name, target, craft) =>
      `${name}试图锻造【${craft || '武器'}】时挥锤砸歪，把好不容易找来的废铁生生敲成了没用的碎渣。`,
    失败: (name, target, craft) => `废铁丝毫不听使唤，${name}累得冒汗也没打出个像样的【${craft || '武器'}】。`,
    成功: (name, target, craft) => `经过高温敲打，一把粗糙但足够致命的【${craft || '武器'}】在${name}手中成型了。`,
    大成功: (name, target, craft) => `神工百炼！炉火交响间，${name}打造出的【${craft || '武器'}】堪比名匠杰作！`,
  },
  pr6: {
    大失败: (name, target, craft) =>
      `${name}缝制【${craft || '护甲'}】时手一抖，珍贵的材料直接剪烂，被完全白白浪费了。`,
    失败: (name, target, craft) => `勉强拼凑起一套【${craft || '护甲'}】，可${name}稍微一用力它就散架了。`,
    成功: (name, target, craft) => `利用皮料和废铁，${name}将一套结实的【${craft || '护甲'}】修整成型。`,
    大成功: (name, target, craft) =>
      `严丝合缝！${name}不仅完美制作了【${craft || '护甲'}】，甚至大幅改良了它的防御厚度！`,
  },
  pr7: {
    大失败: (name, target, craft) =>
      `${name}在尝试制作【${craft || '基础药品'}】时操作失误，熬成了一摊令人作呕的有毒糊糊。`,
    失败: (name, target, craft) => `捣鼓半天，${name}想做【${craft || '基础药品'}】，弄出来的却只是毫无用处的废料。`,
    成功: (name, target, craft) => `虽然卖相难看，但${name}成功配制出了【${craft || '基础药品'}】。`,
    大成功: (name, target, craft) =>
      `神奇的配比！${name}用最捡穷的废料提炼出了药效奇佳的顶级【${craft || '基础药品'}】！`,
  },
  pr8: {
    大失败: (name, target, craft) =>
      `精密仪器操作失误负荷过高，${name}还没做成【${craft || '高级药品'}】，就毁了稀有材料，甚至引发了微型爆炸。`,
    失败: (name, target, craft) =>
      `${name}理解不了高级仪器的读数，产出的只有医疗废弃物，【${craft || '高级药品'}】制作失败。`,
    成功: (name, target, craft) => `凭借沉稳的操作，${name}成功制作出了【${craft || '高级药品'}】。`,
    大成功: (name, target, craft) =>
      `医疗专家！${name}以零误差的精密手腕，还原了旧时代顶尖质量的【${craft || '高级药品'}】！`,
  },
  pr9: {
    大失败: (name, target, craft) =>
      `精密锻压机失控，${name}不仅摧毁了昂贵的高品质材料，还险些被飞溅的高温合金刺穿，【${craft || '高级武器'}】锻造彻底宣告失败。`,
    失败: (name, target, craft) =>
      `${name}无法掌握复杂图纸的精髓，出炉的只是一块昂贵的废铁，【${craft || '高级武器'}】成型失败。`,
    成功: (name, target, craft) =>
      `火星飞溅中，${name}运用娴熟的技术，成功锻造出了一把寒气逼人的高品质【${craft || '高级武器'}】。`,
    大成功: (name, target, craft) =>
      `传说降生！${name}倾注了极致的专注，这把【${craft || '高级武器'}】的锋芒足以令整座废土闻风丧胆！`,
  },
  pr10: {
    大失败: (name, target, craft) =>
      `在处理先进装甲板时操作不当，${name}将其弄成了无法拼接的扭曲废品，【${craft || '高级护甲'}】材料全部报销。`,
    失败: (name, target, craft) =>
      `${name}试图整合繁杂的防御夹层，然而成品的防弹结构一按就瘪，无法作为合格的【${craft || '高级护甲'}】使用。`,
    成功: (name, target, craft) =>
      `通过精准的裁剪与铆接，${name}完成了一套能提供强大生存保障的高性能【${craft || '高级护甲'}】。`,
    大成功: (name, target, craft) =>
      `行走的壁垒！${name}将复合材料的潜力发挥到了极致，这套【${craft || '高级护甲'}】堪比旧世界的动力装甲外壳！`,
  },
  f1: {
    大失败: name => `手气背到极点，${name}不仅输光了开币，甚至连口粮都搭进去了。`,
    失败: name => `骰子手气不好，${name}郁闷地白扔了明天的筹码。`,
    成功: name => `骨骰叮当响，${name}小赢了几把，心情不禁轻快起来。`,
    大成功: name => `赌圣降临！${name}连战连捷大杀四方，赢的盆满钵满亢奋无比！`,
  },
  f2: {
    大失败: name => `${name}发呆时想起了痛苦的绝望回忆，精神直接坠入崩溃的深渊。`,
    失败: name => `风沙打在脸上，${name}觉得发呆冥想纯粹在白白挨饿受冻。`,
    成功: name => `放空大脑凝视废土红日，${name}难得体会到了内心的绝对平静。`,
    大成功: name => `超凡脱俗的顿悟！在深度冥想中，${name}的精神仿佛脱离了苦海，灵魂受到了极致洗涤！`,
  },
  t1: {
    大失败: (name, target) => `因为态度轻浮，${name}被路人当成骗子，不仅没卖出东西还被啐了口水。`,
    失败: (name, target) => `即便开价极低，也无人对${name}手里的这些破玩意儿感兴趣。`,
    成功: (name, target) => `顺利脱手，${name}虽然算是贱卖，多少也成功积攒了几枚开币。`,
    大成功: (name, target) => `捡漏王遇上凯子！这堆原本打算白给的垃圾，居然被${name}以不错的价格售出！`,
  },
  t2: {
    大失败: (name, target) => `${name}推销得太生硬急躁，流浪者怀疑是赃物反而吓得落荒而逃。`,
    失败: (name, target) => `${name}口水都说干了，对方依旧捂紧口袋无动于衷。`,
    成功: (name, target) => `拉扯讨价还价后，${name}顺利以市场公道价出手了杂物。`,
    大成功: (name, target) => `完美推销！${name}让对方觉得物超所值连连道谢，交易双方都感到无比愉快！`,
  },
  t3: {
    大失败: (name, target) => `${name}厚颜无耻的吸血标价激怒了路人，对方破口大骂甚至要砸场子。`,
    失败: (name, target) => `开天价宰人，别人像看精神病一样看着${name}扭头就走。`,
    成功: (name, target) => `恰好碰上个急需物资的倒霉蛋，${name}趁对方走投无路大赚一笔黑心钱！`,
    大成功: (name, target) => `令人发指的暴利！${name}成功将极低劣的东西卖上了天文数字，狠宰肥羊赚得盆满钵满！`,
  },
  in1: {
    大失败: (name, target) => `${name}鲁莽且油腻的举动冒犯了对方，换来了一记结结实实的嘴巴子和鄙夷的目光。`,
    失败: (name, target) => `两人的情感互动显得僵硬别扭，未能抚平各自内心的疲惫。`,
    成功: (name, target) => `通过温暖而克制的接触，${name}与同伴在这片残酷的废土上汲取了彼此些许的温度。`,
    大成功: (name, target) => `灵魂共鸣般的交融与抚慰！两颗伤痕累累的心紧密贴合，${name}获得了无与伦比的心灵治愈！`,
  },
  in2: {
    大失败: (name, target) => `${name}敞开心扉诉说的痛苦却成了对方攻击的把柄，信任彻底崩塌了。`,
    失败: (name, target) => `这种自揭伤疤的沟通实在沉重，让气氛变得极为压抑。`,
    成功: (name, target) => `在这漫漫长夜，语言化作了纽带，${name}与对方都获得了精神依靠。`,
    大成功: (name, target) => `至死不渝的羁绊！${name}将灵魂最深处交予对方，在相互剖析中共筑了坚不可摧的信任！`,
  },
  in3: {
    大失败: (name, target) => `疯狂的发泄导致了失控的暴力，${name}在混乱中受到了难以启齿的伤害。`,
    失败: (name, target) => `强烈的虚无感没有被填满，事后的${name}感到更加空虚和自我厌恶。`,
    成功: (name, target) => `在放纵与狂热中，${name}与对方短暂地忘却了这残酷废土上的一切烦恼。`,
    大成功: (name, target) => `极致的癫狂乐园！${name}在毫无底线的狂欢中体验到了无与伦比的极乐，身心得到了彻底的释放！`,
  },
};

export default function App() {
  const [members, setMembers] = useState<Member[]>([]);
  const [page, setPage] = useState<
    'menu' | 'training' | 'rest' | 'slave' | 'tutorial_menu' | 'tutorial_rest' | 'tutorial_training'
  >('menu');
  const [selectedMember, setSelectedMember] = useState('');
  const [activeCategory, setActiveCategory] = useState<MainCategory | null>(null);
  const [memberStatuses, setMemberStatuses] = useState<Record<string, MemberStatusData>>({});
  const [campActionLogs, setCampActionLogs] = useState<CampActionLog[]>([]);
  const [memberRuntimeMap, setMemberRuntimeMap] = useState<Record<string, MemberRuntimeData>>({});

  // 骰子状态
  const [isRolling, setIsRolling] = useState(false);
  const [rollResult, setRollResult] = useState<{
    rawRoll: number;
    modifier: number;
    total: number;
    type: TrainingResult;
    desc: string;
    targetName?: string;
  } | null>(null);
  const [rollingSub, setRollingSub] = useState<string | null>(null);
  const [targetSelectionFor, setTargetSelectionFor] = useState<string | null>(null);
  const [craftSelectionFor, setCraftSelectionFor] = useState<string | null>(null);
  const [bodyPartSelectionFor, setBodyPartSelectionFor] = useState<string | null>(null);
  const [tradeSelectionFor, setTradeSelectionFor] = useState<string | null>(null);
  const [tradeTransactions, setTradeTransactions] = useState<Record<string, number>>({});
  const [tradeSourceMemberId, setTradeSourceMemberId] = useState<string>('');
  const [multiTargets, setMultiTargets] = useState<string[]>([]);

  const activeTradeSourceId = tradeSourceMemberId || selectedMember;
  const slaveMembers = members.filter(m => m.identity === '奴隶');
  const tradeItems = (memberRuntimeMap[activeTradeSourceId]?.sellableItems || []).map((item, idx) => ({
    id: `trade-${idx}`,
    name: item.name,
    val: item.unitValue,
    myQty: item.quantity,
  }));

  const [isCompleting, setIsCompleting] = useState(false);
  const [isInfiniteConfig, setIsInfiniteConfig] = useState(false);
  const [isNoPenaltyMode, setIsNoPenaltyMode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const loadMembersFromMvu = async () => {
      try {
        await waitGlobalInitialized('Mvu');
        await waitUntil(() => {
          const currentMessageId = typeof getCurrentMessageId === 'function' ? getCurrentMessageId() : 'latest';
          const currentData = getVariables({ type: 'message', message_id: currentMessageId });
          const latestData = getVariables({ type: 'message', message_id: 'latest' });
          return _.has(currentData, 'stat_data') || _.has(latestData, 'stat_data');
        });

        const currentMessageId = typeof getCurrentMessageId === 'function' ? getCurrentMessageId() : 'latest';
        let mvuData = getVariables({ type: 'message', message_id: currentMessageId });
        if (!_.has(mvuData, 'stat_data')) {
          mvuData = getVariables({ type: 'message', message_id: 'latest' });
        }

        const parsedMembers: Member[] = [];
        const runtimeMap: Record<string, MemberRuntimeData> = {};
        const insertedIds = new Set<string>();

        // 先读取“当前角色”
        const currentCharacter = _.get(mvuData, ['stat_data', '当前角色']);
        const currentMember = buildMemberFromData(currentCharacter, '当前角色');
        if (currentMember) {
          parsedMembers.push(currentMember);
          insertedIds.add(currentMember.id);
          runtimeMap[currentMember.id] = buildMemberRuntimeData(currentCharacter);
        }

        // 再读取“小队成员”
        const squad = _.get(mvuData, ['stat_data', '小队成员'], {});
        _.forEach(squad, (value, key) => {
          const member = buildMemberFromData(value, String(key));
          if (!member) return;
          if (insertedIds.has(member.id)) return;
          parsedMembers.push(member);
          insertedIds.add(member.id);
          runtimeMap[member.id] = buildMemberRuntimeData(value);
        });

        setMembers(parsedMembers);
        setMemberRuntimeMap(runtimeMap);
      } catch (err) {
        console.error('加载小队成员失败:', err);
        setMembers([]);
      }
    };

    loadMembersFromMvu();
  }, []);

  useEffect(() => {
    if (members.length === 0) {
      setSelectedMember('');
      return;
    }
    if (!selectedMember || !members.some(m => m.id === selectedMember)) {
      setSelectedMember(members[0].id);
    }
  }, [members, selectedMember]);

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', syncFullscreenState);
    syncFullscreenState();

    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreenState);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      await document.documentElement.requestFullscreen();
    } catch (error) {
      console.error('切换全屏模式失败:', error);
      setToastMessage('无法切换全屏模式，请检查浏览器或嵌入权限。');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const FullscreenButton = () => {
    const Icon = isFullscreen ? Minimize2 : Maximize2;

    return (
      <button
        type="button"
        onClick={toggleFullscreen}
        className="fixed top-4 right-4 z-[10000] flex items-center justify-center gap-2 border-[2px] border-kenshi-rust bg-kenshi-dark/90 text-kenshi-rust hover:bg-kenshi-rust hover:text-kenshi-dark font-black tracking-[2px] uppercase py-2 px-3 transition-all duration-300 shadow-[0_0_16px_rgba(0,0,0,0.65)] backdrop-blur-sm"
        aria-label={isFullscreen ? '退出全屏模式' : '进入全屏模式'}
        title={isFullscreen ? '退出全屏模式' : '进入全屏模式'}
      >
        <Icon className="w-4 h-4" />
        <span className="hidden sm:inline text-xs">{isFullscreen ? '退出全屏' : '全屏'}</span>
      </button>
    );
  };

  const handleToggleInfinite = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setIsInfiniteConfig(isChecked);
    if (isChecked) {
      setToastMessage('现在可以一直重roll  BEEP！!');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const navigateTo = (
    target: 'menu' | 'training' | 'rest' | 'slave' | 'tutorial_menu' | 'tutorial_rest' | 'tutorial_training',
  ) => {
    setPage(target);
    setActiveCategory(null);
    setRollResult(null);
    setRollingSub(null);
    setIsRolling(false);
    setTargetSelectionFor(null);
    setMultiTargets([]);
  };

  const handleRoll = (
    subId: string,
    targetId?: string | string[],
    craftItemName?: string,
    bodyPartName?: string,
    tradePayload?: Record<string, number>,
  ) => {
    const REQUIRES_TARGET = [
      'b1',
      'b2',
      'sm1',
      'sm2',
      'pr4',
      'sp1',
      'sp3',
      'sp7',
      'co1',
      'co2',
      'in1',
      'in2',
      'in3',
      'sc1',
      'sc2',
      'sc3',
      'sc4',
      'sc5',
      'sc6',
      'sc7',
      'sw1',
      'sw2',
    ];
    const SLAVE_TARGET_ACTIONS = ['sm1', 'sm2', 'sc1', 'sc2', 'sc3', 'sc4', 'sc5', 'sc6', 'sc7', 'sw1', 'sw2'];
    if (SLAVE_TARGET_ACTIONS.includes(subId) && slaveMembers.length === 0) {
      setToastMessage('没有可用奴隶');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    if (REQUIRES_TARGET.includes(subId) && !targetId) {
      setTargetSelectionFor(subId);
      setMultiTargets([]);
      return;
    }

    if (subId === 'sm2' && targetId && !bodyPartName) {
      setTargetSelectionFor(null);
      setBodyPartSelectionFor(targetId as string);
      return;
    }

    const REQUIRES_CRAFT = ['pr5', 'pr6', 'pr7', 'pr8', 'pr9', 'pr10'];
    if (REQUIRES_CRAFT.includes(subId) && !craftItemName) {
      setCraftSelectionFor(subId);
      return;
    }

    const selected = members.find(m => m.id === selectedMember);
    if (['pr8', 'pr9', 'pr10'].includes(subId) && (selected?.rawIntelligence || 0) < 50) {
      setToastMessage('【智力<50无法使用】');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (REQUIRES_CRAFT.includes(subId) && craftItemName) {
      const recipe = craftItems[subId]?.find(i => i.name === craftItemName);
      const req = parseRequirement(recipe?.requirements || '');
      const allPool = Object.values(memberRuntimeMap).flatMap(v => v.inventoryItems || []);
      const oreCount = allPool.filter(it => it.subCategory === '矿石').reduce((sum, it) => sum + it.quantity, 0);
      const clothCount = allPool.filter(it => it.subCategory === '布料').reduce((sum, it) => sum + it.quantity, 0);
      const rawCount = allPool.filter(it => it.subCategory === '原材料').reduce((sum, it) => sum + it.quantity, 0);

      const lacks: string[] = [];
      if (req.ore > oreCount) lacks.push(`矿石x${req.ore - oreCount}`);
      if (req.cloth > clothCount) lacks.push(`布料x${req.cloth - clothCount}`);
      if (req.raw > rawCount) lacks.push(`原材料x${req.raw - rawCount}`);

      if (lacks.length > 0) {
        setToastMessage(`缺少${lacks.join('，')}`);
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
    }

    const TRADE_ACTIONS = ['t1', 't2', 't3'];
    if (TRADE_ACTIONS.includes(subId) && tradeSelectionFor !== subId) {
      setTradeSelectionFor(subId);
      setTradeSourceMemberId(selectedMember);
      setTradeTransactions({});
      return;
    }

    const currentStatus = memberStatuses[selectedMember] || {};
    const actionKey = JSON.stringify({
      subId,
      targetId: Array.isArray(targetId) ? [...targetId].sort() : targetId || '',
      craftItemName: craftItemName || '',
      bodyPartName: bodyPartName || '',
      tradePayload: tradePayload || tradeTransactions,
    });

    const trainingList = currentStatus.training || [];
    const restList = currentStatus.rest || [];
    const existingSameAction = [...trainingList, ...restList].some(s => s.actionKey === actionKey);

    const trainingCount = trainingList.length;
    const restCount = restList.length;
    const totalActions = trainingCount + restCount;
    const hasFullAction = restList.some(r => r.isFullAction) || trainingList.some(t => t.isFullAction);
    const isTryingFullAction =
      subId === 'h1' || subId === 'co1' || subId === 'co2' || subId === 'in1' || subId === 'in3';

    // 无限beep：允许“同一条已做动作”重roll，但不允许突破数量规则
    if (hasFullAction && !existingSameAction) {
      setToastMessage('已进行需要耗费全轮的活动，本轮无法再进行任何活动');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (isTryingFullAction && totalActions > 0 && !existingSameAction) {
      setToastMessage('已进行其他活动，无法再进行此项全轮活动');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (totalActions >= 2 && !existingSameAction) {
      setToastMessage('行动点已耗尽 (最多进行两项活动)');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setRollingSub(subId);
    setIsRolling(true);
    setRollResult(null);

    // 模拟掷骰子动画时间
    setTimeout(() => {
      const currentMember = members.find(m => m.id === selectedMember);
      let statKey = activeCategory?.id || '';
      let modifier = 0;

      const memberRuntime = memberRuntimeMap[selectedMember];
      const isBandageSelf = subId === 'h1';
      const isBandageOther = subId === 'pr4';
      const isTradeAction = subId === 't1' || subId === 't2' || subId === 't3';

      if (page === 'training') {
        modifier = currentMember?.stats?.[statKey as keyof typeof currentMember.stats] || 0;
      } else if (page === 'rest' || page === 'slave') {
        if (statKey === 'prep') {
          modifier = currentMember?.stats?.intelligence || 0;
        } else if (statKey === 'trade') {
          modifier = currentMember?.stats?.charisma || 0;
        } else if (statKey === 'slave_coach') {
          const coachStatMap: Record<string, keyof NonNullable<typeof currentMember>['stats']> = {
            sc1: 'strength',
            sc2: 'agility',
            sc3: 'perception',
            sc4: 'constitution',
            sc5: 'willpower',
            sc6: 'intelligence',
            sc7: 'charisma',
          };
          statKey = coachStatMap[subId] || 'strength';
          modifier = currentMember?.stats?.[statKey] || 0;
        } else if (statKey === 'slave_work') {
          const workStatMap: Record<string, keyof NonNullable<typeof currentMember>['stats']> = {
            sw1: 'strength',
            sw2: 'perception',
          };
          statKey = workStatMap[subId] || 'strength';
          modifier = currentMember?.stats?.[statKey] || 0;
        } else {
          modifier = 0;
        }
      }

      if (isBandageOther && memberRuntime && !memberRuntime.hasMedical) {
        setToastMessage('没有可用医疗用品，无法给别人包扎伤口');
        setTimeout(() => setToastMessage(null), 3000);
        setIsRolling(false);
        setRollingSub(null);
        return;
      }

      const rawRoll = Math.floor(Math.random() * 20) + 1;
      const total = rawRoll + modifier;
      const targetDc = dcMap[subId] || 15;

      let type: TrainingResult = '失败';
      if (rawRoll === 1) type = '大失败';
      else if (rawRoll === 20) type = '大成功';
      else if (total >= targetDc) type = '成功';

      let tradeResultText = '';
      const tradeSourceIdForConsume = tradeSourceMemberId || selectedMember;
      let tradeConsumeList: { name: string; quantity: number }[] = [];
      if (isTradeAction) {
        const sourceTradeItems = (memberRuntimeMap[tradeSourceIdForConsume]?.sellableItems || []).map((item, idx) => ({
          id: `trade-${idx}`,
          name: item.name,
          val: item.unitValue,
          myQty: item.quantity,
        }));
        const listed = Object.entries(tradePayload || tradeTransactions)
          .map(([id, qty]) => {
            const item = sourceTradeItems.find(i => i.id === id);
            if (!item || qty <= 0) return null;
            return { name: item.name, quantity: qty, unitValue: item.val };
          })
          .filter(Boolean) as { name: string; quantity: number; unitValue: number }[];
        tradeResultText = calcTradeOutcome(subId, type, listed);

        if (type === '成功' || type === '大成功') {
          tradeConsumeList = listed.map(i => ({ name: i.name, quantity: i.quantity }));
        } else if (type === '大失败' && listed.length > 0) {
          tradeConsumeList = [{ name: listed[0].name, quantity: 1 }];
        }
      }

      if (tradeConsumeList.length > 0) {
        setMemberRuntimeMap(prev => {
          const src = prev[tradeSourceIdForConsume];
          if (!src) return prev;
          const nextItems = src.sellableItems
            .map(item => {
              const use = tradeConsumeList.find(t => t.name === item.name)?.quantity || 0;
              return { ...item, quantity: Math.max(0, item.quantity - use) };
            })
            .filter(item => item.quantity > 0);
          return {
            ...prev,
            [tradeSourceIdForConsume]: {
              ...src,
              sellableItems: nextItems,
            },
          };
        });
      }

      let desc = '';
      let effectStr = '';
      let targetEffectStr = '';
      const rollMap = page === 'training' ? attrMap : restAttrMap;
      let attrName = activeCategory ? rollMap[activeCategory.id] : '';
      if (activeCategory?.id === 'slave_coach' || activeCategory?.id === 'slave_work') {
        attrName = attrMap[statKey] || '属性';
      }

      if (activeCategory?.id === 'special' && subId.startsWith('sp')) {
        const specialAttrMap: Record<string, string> = {
          sp1: '魅力',
          sp2: '感知',
          sp3: '力量',
          sp4: '敏捷',
          sp5: '体质',
          sp6: '智力',
          sp7: '意志',
        };
        attrName = specialAttrMap[subId] || attrName;
      }

      if (page === 'training') {
        if (trainingEffects[subId] && trainingEffects[subId][type]) {
          effectStr = trainingEffects[subId][type]!(attrName);
        } else if (type === '大失败') {
          effectStr = `${attrName}-1`;
        } else if (type === '失败') {
          effectStr = `${attrName}无提升`;
        } else if (type === '成功') {
          effectStr = `${attrName}+1`;
        } else {
          effectStr = `${attrName}+3`;
        }
      } else if (activeCategory?.id === 'slave_coach') {
        if (type === '大失败') effectStr = `${attrName}-1`;
        else if (type === '失败') effectStr = `${attrName}无提升`;
        else if (type === '成功') effectStr = `${attrName}+1`;
        else if (type === '大成功') effectStr = `${attrName}+2`;
      } else if (activeCategory?.id === 'slave_work') {
        if (type === '大失败') effectStr = `奴隶逃亡`;
        else if (type === '失败') effectStr = `无收获`;
        else if (type === '成功') effectStr = `获得物资`;
        else if (type === '大成功') effectStr = `大丰收`;
      } else if (activeCategory?.id === 'bond') {
        if (type === '大失败') effectStr = `心情值-25`;
        else if (type === '失败') effectStr = `心情值-15`;
        else if (type === '成功') effectStr = `心情值+20`;
        else if (type === '大成功') effectStr = `心情值+30`;
      } else if (activeCategory?.id === 'fun') {
        if (type === '大失败') effectStr = `心情值-20`;
        else if (type === '失败') effectStr = `心情值-10`;
        else if (type === '成功') effectStr = `心情值+25`;
        else if (type === '大成功') effectStr = `心情值+40`;
      } else if (subId === 'in1') {
        if (type === '大失败') effectStr = `好感度-20`;
        else if (type === '失败') effectStr = `好感度-10`;
        else if (type === '成功') effectStr = `好感度+10`;
        else if (type === '大成功') effectStr = `好感度+15`;
      } else if (subId === 'in2') {
        if (type === '大失败') effectStr = `好感度-30`;
        else if (type === '失败') effectStr = `好感度-20`;
        else if (type === '成功') effectStr = `好感度+15`;
        else if (type === '大成功') effectStr = `好感度+25`;
      } else if (subId === 'in3') {
        if (type === '大失败') effectStr = `好感度-50`;
        else if (type === '失败') effectStr = `好感度-30`;
        else if (type === '成功') effectStr = `好感度+25`;
        else if (type === '大成功') effectStr = `好感度+35`;
      } else if (subId === 'sm1') {
        if (type === '大失败') {
          effectStr = `心情值-10`;
          targetEffectStr = `心情值-30`;
        } else if (type === '失败') {
          effectStr = `心情值+10`;
          targetEffectStr = `心情值-20`;
        } else if (type === '成功') {
          effectStr = `心情值+15`;
          targetEffectStr = `心情值不变`;
        } else if (type === '大成功') {
          effectStr = `心情值+20`;
          targetEffectStr = `心情值+10`;
        }
      } else if (subId === 'sm2') {
        if (type === '大失败') {
          effectStr = `未获得部位`;
          targetEffectStr = `面临死亡`;
        } else if (type === '失败') {
          effectStr = `手术无法进行`;
          targetEffectStr = `手术无法进行`;
        } else if (type === '成功') {
          effectStr = `获得${bodyPartName}`;
          targetEffectStr = `失去${bodyPartName}`;
        } else if (type === '大成功') {
          effectStr = `完美获得${bodyPartName}`;
          targetEffectStr = `失去${bodyPartName}`;
        }
      } else if (type === '大失败') effectStr = `${attrName}严重下降`;
      else if (type === '失败') effectStr = attrName === '心情' ? '心情沉重' : `${attrName}无变化`;
      else if (type === '成功') effectStr = `${attrName}得到改善`;
      else if (type === '大成功') effectStr = `${attrName}极大提升`;

      if (isTradeAction) {
        effectStr = tradeResultText;
      }

      if ((subId === 'h1' || subId === 'pr4') && memberRuntime) {
        const bonus = calcRecoveryBonusByType(type, subId);
        const targetRuntime =
          subId === 'pr4' && typeof targetId === 'string' ? memberRuntimeMap[targetId] : memberRuntime;
        const runtime = targetRuntime || memberRuntime;

        let basePercent = 30;
        if (subId === 'h1') {
          if (!runtime.hasMedical) {
            if (!runtime.hasAnyTrauma && runtime.hasFoodOrDrink) basePercent = 100;
            else if (runtime.hasAnyTrauma && runtime.hasFoodOrDrink) basePercent = 50;
            else basePercent = 30;
          } else if (runtime.hasAnyTrauma && runtime.hasFoodOrDrink) basePercent = 100;
          else if (runtime.hasAnyTrauma && !runtime.hasFoodOrDrink) basePercent = 50;
          else if (!runtime.hasAnyTrauma && runtime.hasFoodOrDrink) basePercent = 100;
          else basePercent = 30;
        } else {
          basePercent = 50;
        }

        const finalPercent = _.clamp(basePercent + bonus, 0, 100);
        const recoveredHp = Math.floor(runtime.hpMax * (finalPercent / 100));

        const repairedParts = runtime.repairableTraumaParts;
        const traumaText = repairedParts.length > 0 ? `，${repairedParts.join('、')}创伤已完全恢复` : '';

        effectStr = `回复${recoveredHp}血量${traumaText}`;
        if (subId === 'h1') {
          desc =
            actionDescriptions[subId]?.[type]?.(currentMember?.name || '你', '', craftItemName, bodyPartName) || desc;
        }
      }

      if (['pr5', 'pr6', 'pr7', 'pr8', 'pr9', 'pr10'].includes(subId) && craftItemName) {
        const recipe = craftItems[subId]?.find(i => i.name === craftItemName);
        const req = parseRequirement(recipe?.requirements || '');
        const allPool = Object.values(memberRuntimeMap).flatMap(v => v.inventoryItems || []);
        const ore = consumeFromPool(allPool, req.ore, sub => sub === '矿石');
        const cloth = consumeFromPool(allPool, req.cloth, sub => sub === '布料');
        const raw = consumeFromPool(allPool, req.raw, sub => sub === '原材料');

        const usedParts: string[] = [];
        if (ore.text) usedParts.push(ore.text);
        if (cloth.text) usedParts.push(cloth.text);
        if (raw.text) usedParts.push(raw.text);
        const usedText =
          usedParts.length > 0 ? usedParts.join('+').replace(/\+/g, '+').replace(/\+$/, '') : '0个矿石+0个布料';

        if (type === '失败' || type === '大失败') {
          effectStr = `消耗${usedText}，没有锻造出任何东西`;
        } else if (subId === 'pr5' || subId === 'pr9') {
          const q = getForgeQuality(subId, currentMember?.rawIntelligence || 0, currentMember?.name || '锻造师');
          effectStr = `消耗${usedText}，锻造出了【${q}】品质的${craftItemName}类武器`;
        } else if (subId === 'pr6' || subId === 'pr10') {
          const dr = craftItemName === '轻甲' ? 15 : craftItemName === '中甲' ? 20 : 25;
          effectStr = `消耗${usedText}，锻造出${craftItemName}，DR为${dr}`;
        } else {
          effectStr = `消耗${usedText}，锻造出了${craftItemName}`;
        }
      }

      const charName = currentMember?.name || '你';
      let targetNameStr = '';
      if (Array.isArray(targetId)) {
        targetNameStr = targetId
          .map(id =>
            id === 'stranger' ? '陌生人' : id === 'self' ? charName : members.find(m => m.id === id)?.name || id,
          )
          .join(', ');
      } else if (targetId) {
        targetNameStr =
          targetId === 'stranger'
            ? '陌生人'
            : targetId === 'self'
              ? charName
              : members.find(m => m.id === targetId)?.name || '';
      }

      if (actionDescriptions[subId] && actionDescriptions[subId][type]) {
        desc = actionDescriptions[subId][type]!(charName, targetNameStr, craftItemName, bodyPartName);
      } else if (page === 'training') {
        // Fallback description
        if (type === '大失败') {
          desc = `由于用力过猛或操作不当，${charName}受到了严重的撕裂伤（或者丢掉了一条手臂）。训练效果清零，需要立刻接受治疗！`;
        } else if (type === '失败') {
          desc = `${charName}感到浑身酸痛，肌肉在悲鸣。流了许多汗，但实际上这只是一次无效的折磨。`;
        } else if (type === '成功') {
          desc = `动作标准，呼吸平稳。${charName}感觉自己的经验值有了一丝微小的跳动，这在废土上已经是个不错的进展。`;
        } else if (type === '大成功') {
          desc = `${charName}突然领悟了这项技能的真谛！动作堪称完美，这如同神启般的体验让属性获得了突飞猛进。`;
        }
      } else if (type === '大失败') {
        desc = '营地里爆发出严重的口角和冲突，有人甚至拔出了刀。情况变得更糟了。';
      } else if (type === '失败') {
        desc = '风沙太大，或是大家早已疲惫不堪。这只是一段死寂沉沉的荒废时光。';
      } else if (type === '成功') {
        desc = '难得的宁静。粗糙的活动让紧绷的神经得到了一丝微小的慰藉。';
      } else if (type === '大成功') {
        desc = '极其罕见的欢乐安宁时光！痛苦似乎暂时离去，大家甚至开始畅想那遥不可及的未来。';
      }

      if (isNoPenaltyMode && (type === '失败' || type === '大失败')) {
        effectStr = effectStr.replace(/-\d+/g, '无惩罚').replace('严重下降', '无惩罚').replace('心情沉重', '无惩罚');
        if (targetEffectStr) {
          targetEffectStr = targetEffectStr
            .replace(/-\d+/g, '无惩罚')
            .replace('严重下降', '无惩罚')
            .replace('心情沉重', '无惩罚');
        }
      }

      const subName = activeCategory?.subcategories.find(s => s.id === subId)?.name || '';
      let targetName = '';
      if (Array.isArray(targetId)) {
        targetName = targetId
          .map(id =>
            id === 'stranger' ? '陌生人' : id === 'self' ? charName : members.find(m => m.id === id)?.name || id,
          )
          .join(', ');
      } else if (targetId) {
        targetName =
          targetId === 'stranger'
            ? '陌生人'
            : targetId === 'self'
              ? charName
              : members.find(m => m.id === targetId)?.name || '';
      }

      const targetSuffix = targetName ? ` [对 ${targetName}]` : '';
      const craftSuffix = craftItemName ? ` [制作 ${craftItemName}]` : '';
      const bodyPartSuffix = bodyPartName ? ` [部位: ${bodyPartName}]` : '';

      const section: CampLogSection =
        page === 'training' ? '训练终端' : activeCategory?.id === 'slave_mgmt' ? '奴隶处置' : '休息交谈';
      setCampActionLogs(prev => [
        ...prev,
        {
          section,
          memberName: charName,
          mainCategoryName: activeCategory?.name || '',
          subCategoryName: subName,
          resultType: type,
          resultDesc: desc,
          resultEffect: targetEffectStr || effectStr,
        },
      ]);

      setMemberStatuses(prev => {
        const existing = prev[selectedMember] || {};
        const isFullAction = subId === 'h1' || subId === 'co1' || subId === 'co2' || subId === 'in1' || subId === 'in3';
        const newStatus = {
          text: `${subName}${targetSuffix}${craftSuffix}${bodyPartSuffix} ${type} (${effectStr})`,
          type: type as TrainingResult,
          isFullAction,
          actionKey,
        };

        const newTraining = existing.training ? [...existing.training] : [];
        const newRest = existing.rest ? [...existing.rest] : [];
        if (page === 'training') {
          const idx = newTraining.findIndex(s => s.actionKey === actionKey);
          if (idx >= 0) newTraining[idx] = newStatus;
          else newTraining.push(newStatus);
        } else {
          const idx = newRest.findIndex(s => s.actionKey === actionKey);
          if (idx >= 0) newRest[idx] = newStatus;
          else newRest.push(newStatus);
        }

        const nextState = {
          ...prev,
          [selectedMember]: {
            ...existing,
            ...(newTraining.length > 0 ? { training: newTraining } : {}),
            ...(newRest.length > 0 ? { rest: newRest } : {}),
          },
        };

        let finalTargets: string[] = [];
        if (Array.isArray(targetId)) finalTargets = targetId.filter(id => id !== 'stranger');
        else if (typeof targetId === 'string' && targetId !== 'stranger') finalTargets = [targetId];

        if (
          [
            'co1',
            'co2',
            'in1',
            'in2',
            'in3',
            'sm1',
            'sm2',
            'sc1',
            'sc2',
            'sc3',
            'sc4',
            'sc5',
            'sc6',
            'sc7',
            'sw1',
            'sw2',
          ].includes(subId) &&
          finalTargets.length > 0
        ) {
          finalTargets.forEach(tid => {
            const tExisting = nextState[tid] || {};
            let tSuffix = ` [被 ${currentMember?.name} 处理/陪练/驱使]`;
            if (['co1', 'co2', 'in1', 'in2', 'in3'].includes(subId)) {
              tSuffix = ` [与 ${currentMember?.name}]`;
            }
            const isFullAction = ['co1', 'co2', 'in1', 'in3'].includes(subId);
            const finalTargetEffectStr = targetEffectStr ? targetEffectStr : effectStr;
            const tStatus = {
              text: `${subName}${tSuffix} ${type} (${finalTargetEffectStr})`,
              type: type as TrainingResult,
              isFullAction,
            };

            if (['co1', 'co2'].includes(subId)) {
              const tNewTraining = tExisting.training ? [...tExisting.training] : [];
              tNewTraining.push(tStatus);
              nextState[tid] = {
                ...tExisting,
                training: tNewTraining,
              };
            } else {
              const tNewRest = tExisting.rest ? [...tExisting.rest] : [];
              tNewRest.push(tStatus);
              nextState[tid] = {
                ...tExisting,
                rest: tNewRest,
              };
            }
          });
        }

        return nextState;
      });

      setRollResult({ rawRoll, modifier, total, type, desc, targetName });
      setIsRolling(false);
    }, 1200);
  };

  const getResultColor = (type: TrainingResult) => {
    switch (type) {
      case '大失败':
        return 'text-red-500 border-red-800 bg-red-950/40';
      case '失败':
        return 'text-kenshi-danger border-kenshi-danger bg-kenshi-danger/20';
      case '成功':
        return 'text-kenshi-sand border-kenshi-sand bg-kenshi-sand/20';
      case '大成功':
        return 'text-amber-400 border-amber-500 bg-amber-950/40';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  const currentMember = members.find(m => m.id === selectedMember);

  const handleBack = () => {
    setActiveCategory(null);
    setRollResult(null);
    setIsRolling(false);
    setRollingSub(null);
  };

  const buildCampSummaryText = () => {
    const lines: string[] = [];
    lines.push('【营地整顿】：');

    const restLogs = campActionLogs.filter(item => item.section === '休息交谈');
    lines.push('  【休息交谈】：');
    if (restLogs.length === 0) {
      lines.push('    这一天，没人选择休息。');
    } else {
      restLogs.forEach(item => {
        const resultLabel =
          {
            大失败: '大失败',
            失败: '失败',
            成功: '成功',
            大成功: '大成功',
          }[item.resultType] || item.resultType;
        lines.push(
          `    ${item.memberName}进行【${item.mainCategoryName}】的【${item.subCategoryName}】。过程${resultLabel}：${item.resultDesc}。结果：${item.resultEffect || '无'}`,
        );
      });
    }

    const trainingLogs = campActionLogs.filter(item => item.section === '训练终端');
    lines.push('  【训练终端】：');
    if (trainingLogs.length === 0) {
      lines.push('    这一天，没人选择训练。');
    } else {
      trainingLogs.forEach(item => {
        const resultLabel =
          {
            大失败: '大失败',
            失败: '失败',
            成功: '成功',
            大成功: '大成功',
          }[item.resultType] || item.resultType;
        lines.push(
          `    ${item.memberName}进行【${item.mainCategoryName}】的【${item.subCategoryName}】。过程${resultLabel}：${item.resultDesc}。结果：${item.resultEffect || '无'}`,
        );
      });
    }

    const slaveLogs = campActionLogs.filter(item => item.section === '奴隶处置');
    if (slaveLogs.length > 0) {
      lines.push('  【奴隶处置】：');
      slaveLogs.forEach(item => {
        const resultLabel =
          {
            大失败: '大失败',
            失败: '失败',
            成功: '成功',
            大成功: '大成功',
          }[item.resultType] || item.resultType;
        lines.push(
          `    ${item.memberName}进行【${item.mainCategoryName}】的【${item.subCategoryName}】。过程${resultLabel}：${item.resultDesc}。结果：${item.resultEffect || '无'}`,
        );
      });
    }

    lines.push('时光荏苒，新的一天就要开始');
    lines.push('请根据上述内容，描写述说这一段【营地整顿】的故事，时间流逝8h，不要在正文出现数值相关内容');
    return lines.join('\n');
  };

  const handleComplete = async () => {
    if (isCompleting) return;
    setIsCompleting(true);

    const summary = buildCampSummaryText();
    try {
      await createChatMessages([{ role: 'user', message: summary }]);
      await triggerSlash('/trigger');
    } catch (error) {
      navigator.clipboard.writeText(summary);
      console.error('发送营地总结失败，已复制到剪贴板', error);
    }

    setTimeout(() => {
      setMemberStatuses({});
      setCampActionLogs([]);
      setRollResult(null);
      setActiveCategory(null);
      setSelectedMember(members[0]?.id || '');
      setIsCompleting(false);
    }, 3000);
  };

  if (page === 'menu' || page === 'tutorial_menu') {
    const isTutorial = page === 'tutorial_menu';
    return (
      <div className="h-screen bg-kenshi-dark flex flex-col items-center justify-center relative overflow-hidden p-6 font-sans border-0 md:border-[3px] border-kenshi-rust box-border">
        <BackgroundNoise />
        <FullscreenButton />
        <div className="text-center z-10 mb-12 flex flex-col items-center">
          <motion.div
            initial={{ y: -100, opacity: 0, scale: 0.5 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 12, delay: 0.1 }}
          >
            <Tent className="w-20 h-20 text-kenshi-rust mb-6" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-5xl md:text-7xl text-white font-black tracking-[12px] uppercase m-0 drop-shadow-lg leading-none"
          >
            {isTutorial ? '营地教程' : '营地'}
          </motion.h1>
        </div>

        <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl z-10 px-4">
          <motion.button
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5, type: 'spring' }}
            onClick={() => navigateTo(isTutorial ? 'tutorial_rest' : 'rest')}
            className="flex-1 group bg-[#111] border-[3px] border-kenshi-steel hover:border-kenshi-sand p-8 text-left transition-all duration-300 relative overflow-hidden cursor-pointer"
          >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <MessageSquare className="w-12 h-12 text-kenshi-sand mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-white text-3xl font-black tracking-[6px] mb-3">
              {isTutorial ? '教程·休息交谈' : '休息交谈'}
            </h3>
            <p className="text-[#888] text-sm md:text-base leading-relaxed tracking-wider group-hover:text-kenshi-sand transition-colors">
              包扎伤口，修理装备，围着篝火唾骂这个烂世界。修养身心，促进感情。
            </p>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6, type: 'spring' }}
            onClick={() => navigateTo(isTutorial ? 'tutorial_training' : 'training')}
            className="flex-1 group bg-[#111] border-[3px] border-kenshi-steel hover:border-kenshi-rust p-8 text-left transition-all duration-300 relative overflow-hidden cursor-pointer"
          >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Activity className="w-12 h-12 text-kenshi-rust mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-white text-3xl font-black tracking-[6px] mb-3">
              {isTutorial ? '教程·训练终端' : '训练终端'}
            </h3>
            <p className="text-[#888] text-sm md:text-base leading-relaxed tracking-wider group-hover:text-kenshi-sand transition-colors">
              打磨肉体，压榨潜力。用伤痕和断骨换取力量。唯有强者才配活到明天。
            </p>
          </motion.button>
        </div>

        {isTutorial ? (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            onClick={() => navigateTo('menu')}
            className="mt-12 text-kenshi-sand hover:text-white border-[2px] border-transparent hover:border-kenshi-sand px-6 py-2 transition-all font-bold tracking-[4px] uppercase z-10"
          >
            返回营地
          </motion.button>
        ) : (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            onClick={() => navigateTo('tutorial_menu')}
            className="mt-12 text-kenshi-rust hover:text-white border-[2px] border-transparent hover:border-kenshi-rust px-6 py-2 transition-all font-bold tracking-[4px] uppercase z-10"
          >
            营地教程
          </motion.button>
        )}
      </div>
    );
  }

  if (page.startsWith('tutorial_')) {
    const isRest = page === 'tutorial_rest';
    const tutorialCategories = isRest ? restCategories : categories;
    const tutorialTitle = isRest ? '休息交谈教程' : '训练终端教程';

    return (
      <div className="h-screen bg-kenshi-dark text-kenshi-sand font-sans overflow-hidden flex flex-col md:flex-row align-center select-none border-0 md:border-[3px] border-kenshi-rust box-border relative">
        <BackgroundNoise />
        <FullscreenButton />
        <aside className="w-full h-auto md:h-full md:w-[320px] bg-kenshi-steel border-b-[3px] md:border-b-0 md:border-r-[3px] border-kenshi-rust flex flex-col p-[20px] md:p-[30px] z-10 shrink-0">
          <h1 className="m-0 text-xl md:text-2xl tracking-[6px] text-kenshi-rust font-black uppercase mb-[5px] md:mb-[10px]">
            KENSHI
          </h1>
          <h2 className="m-0 text-[12px] md:text-[14px] tracking-[4px] text-kenshi-sand font-bold uppercase mb-[15px] opacity-80">
            {tutorialTitle}
          </h2>
          <button
            onClick={() => navigateTo('tutorial_menu')}
            className="mb-[15px] flex items-center justify-center gap-2 border border-kenshi-steel text-kenshi-sand hover:border-kenshi-sand hover:text-white font-bold tracking-[2px] py-[6px] px-2 transition-all duration-300 w-full text-center text-sm"
          >
            <ChevronLeft className="w-4 h-4" /> 返回营地教程
          </button>

          <button
            onClick={() => navigateTo(isRest ? 'tutorial_training' : 'tutorial_rest')}
            className="mb-[15px] border-[2px] border-kenshi-rust text-kenshi-rust hover:bg-kenshi-rust hover:text-kenshi-dark font-black tracking-[4px] uppercase py-[10px] px-4 transition-all duration-300 w-full text-center"
          >
            切换为 {isRest ? '训练终端' : '休息交谈'}
          </button>

          <div className="flex flex-row md:flex-col gap-4 overflow-x-auto md:overflow-y-auto pr-2 pb-2 md:pb-0 md:flex-1 mt-4">
            <div className="hidden md:block font-bold text-[14px] text-kenshi-rust border-b-[2px] border-kenshi-dark pb-2 tracking-[2px] uppercase shrink-0">
              队伍成员演示
            </div>
            <div className="flex flex-col p-[15px] border-[2px] min-w-[200px] md:min-w-0 pointer-events-none transition-all duration-300 shrink-0 bg-kenshi-rust border-kenshi-rust text-kenshi-dark shadow-[0_4px_15px_rgba(255,255,255,0.1)]">
              <div className="flex items-start gap-[15px]">
                <Users className="w-6 h-6 shrink-0 mt-0.5 text-kenshi-dark" />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-bold text-[16px] tracking-wider truncate">例子角色</span>
                  <div className="flex flex-col gap-[4px] mt-2">
                    <span className="text-[12px] font-bold tracking-widest text-[#555] opacity-60">尚未分配</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-sm text-[#888] tracking-widest font-bold leading-relaxed border-t-[2px] border-kenshi-dark pt-4">
              这里是你的小队角色，在实际界面中你可以在这里选择你要安排的成员并查看他们当前的状态。
            </div>
          </div>
        </aside>

        <main className="flex-1 w-full relative z-0 flex flex-col bg-kenshi-dark overflow-y-auto p-[20px] md:p-[40px]">
          <div className="w-full max-w-[1400px] mx-auto flex-1 flex flex-col justify-start">
            <div className="mb-8 border-l-[4px] border-kenshi-rust pl-4">
              <h3 className="text-2xl font-black text-white tracking-[4px] uppercase">{tutorialTitle} 功能说明</h3>
              <p className="text-[#888] mt-2 tracking-wider">以下是该模式下所有动作类别的简要说明：</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[25px] sm:gap-[35px]">
              {tutorialCategories.map(cat => {
                let explain = '';
                if (cat.id === 'heal')
                  explain =
                    '进行身体层面的治疗与整顿，为下一次战斗做准备。选择了整顿休息后，该角色本轮将无法再参与任何训练或其他活动。';
                if (cat.id === 'bond') explain = '团队成员间的互动，可以恢复心情值并增进羁绊。';
                if (cat.id === 'prep') explain = '为接下来的旅途准备物资、修补防具武器等杂活，部分杂务可对同伴使用。';
                if (cat.id === 'fun') explain = '自己寻找乐子，包括金钱的慰藉或发呆，主要用于恢复自身心情。';
                if (cat.id === 'trade') explain = '与小队成员或是路过的流浪者进行交易贩卖，互通有无或是借机敛财。';
                if (cat.id === 'intimate') explain = '通过各种形式进行深入交流，增加互相的好感度。';

                if (cat.id === 'strength') explain = '增加肌肉密度与负重能力。需要使用重物或特殊重武器。';
                if (cat.id === 'agility') explain = '提升攻击速度与闪避技巧。包括徒手与开锁训练。';
                if (cat.id === 'perception') explain = '训练侦查、射击精度及黑夜中的隐蔽能力。';
                if (cat.id === 'constitution') explain = '直接以肉身承受打击或极端环境，用伤痕换取抗压能力。';
                if (cat.id === 'willpower') explain = '在极度痛苦或恶劣的情况下保持理智与清醒，锻炼抗压能力。';
                if (cat.id === 'intelligence') explain = '提升分析与理解能力，通过古籍或实践掌握解剖和机械。';
                if (cat.id === 'charisma') explain = '锻炼交涉与伪装技巧，比如吹嘘自己、装可怜或审问土匪。';
                if (cat.id === 'special') explain = '这些训练极其极端或诡异，通常带有不可预料的风险和收益。';
                if (cat.id === 'combat') explain = '与其他小队成员共同进行的对战或推演，双方均会受训。';

                return (
                  <div
                    key={cat.id}
                    className="bg-kenshi-steel border-[2px] border-kenshi-rust/30 p-6 flex flex-col items-start shadow-md opacity-90"
                  >
                    <cat.icon className="w-10 h-10 text-kenshi-rust mb-4" />
                    <h4 className="text-xl font-bold tracking-[2px] text-white mb-2">{cat.name}</h4>
                    <p className="text-sm text-[#bbb] leading-relaxed tracking-wider">{explain}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const currentCategories = page === 'training' ? categories : page === 'slave' ? slaveCategories : restCategories;
  const currentTitle = page === 'training' ? '训练终端' : page === 'slave' ? '奴隶管理' : '休息交谈';

  return (
    <div className="h-screen bg-kenshi-dark text-kenshi-sand font-sans overflow-hidden flex flex-col md:flex-row align-center select-none border-0 md:border-[3px] border-kenshi-rust box-border relative">
      <BackgroundNoise />
      <FullscreenButton />

      {/* 全局 Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-[10%] md:top-6 left-1/2 z-[9999] bg-kenshi-dark border-[2px] border-kenshi-rust text-kenshi-rust font-bold tracking-[2px] px-6 py-3 shadow-[0_0_20px_rgba(0,0,0,0.8)] w-max max-w-[90vw] text-center"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 侧边栏 */}
      <aside className="w-full h-auto md:h-full md:w-[320px] bg-kenshi-steel border-b-[3px] md:border-b-0 md:border-r-[3px] border-kenshi-rust flex flex-col p-[20px] md:p-[30px] z-10 shrink-0">
        <h1 className="m-0 text-xl md:text-2xl tracking-[6px] text-kenshi-rust font-black uppercase mb-[5px] md:mb-[10px]">
          KENSHI
        </h1>
        <h2 className="m-0 text-[12px] md:text-[14px] tracking-[4px] text-kenshi-sand font-bold uppercase mb-[15px] opacity-80">
          {currentTitle}
        </h2>
        <button
          onClick={() => navigateTo('menu')}
          className="mb-[15px] flex items-center justify-center gap-2 border border-kenshi-steel text-kenshi-sand hover:border-kenshi-sand hover:text-white font-bold tracking-[2px] py-[6px] px-2 transition-all duration-300 w-full text-center text-sm"
        >
          <ChevronLeft className="w-4 h-4" /> 返回营地
        </button>
        <button
          onClick={() => {
            setActiveCategory(null);
            setMemberStatuses({});
            setRollResult(null);
          }}
          className="mb-[15px] border-[2px] border-kenshi-rust text-kenshi-rust hover:bg-kenshi-rust hover:text-kenshi-dark font-black tracking-[4px] uppercase py-[10px] px-4 transition-all duration-300 w-full text-center"
        >
          重置状态
        </button>
        <button
          onClick={() => navigateTo(page === 'training' ? 'rest' : 'training')}
          className="mb-[20px] md:mb-[40px] flex items-center justify-center gap-2 border-[2px] border-kenshi-steel text-kenshi-sand hover:bg-kenshi-sand hover:text-kenshi-dark font-black tracking-[4px] uppercase py-[10px] px-4 transition-all duration-300 w-full text-center"
        >
          <ArrowRightLeft className="w-5 h-5 shrink-0" /> 切换内容
        </button>

        <div className="flex flex-row md:flex-col gap-4 overflow-x-auto md:overflow-y-auto pr-2 pb-2 md:pb-0 md:flex-1">
          <div className="hidden md:block font-bold text-[14px] text-kenshi-rust border-b-[2px] border-kenshi-dark pb-2 tracking-[2px] uppercase shrink-0">
            成员列表
          </div>
          {members.map(m => {
            const statusData = memberStatuses[m.id];
            const tStatus = statusData?.training;
            const rStatus = statusData?.rest;

            const getStatusColor = (type: string, isSelected: boolean) => {
              if (isSelected) {
                if (type === '大失败') return 'text-red-700 font-black';
                if (type === '大成功') return 'text-amber-600 font-black';
                return 'text-kenshi-dark';
              } else {
                if (type === '大失败') return 'text-red-500';
                if (type === '失败') return 'text-[#666]';
                if (type === '成功') return 'text-kenshi-sand';
                if (type === '大成功') return 'text-amber-400';
                return 'text-[#555] opacity-60';
              }
            };

            return (
              <div
                key={m.id}
                onClick={() => setSelectedMember(m.id)}
                id={`select-m-${m.id}`}
                className={`flex flex-col p-[15px] border-[2px] min-w-[200px] md:min-w-0 cursor-pointer transition-all duration-300 shrink-0 ${selectedMember === m.id ? 'bg-kenshi-rust border-kenshi-rust text-kenshi-dark shadow-[0_4px_15px_rgba(255,255,255,0.1)]' : 'bg-kenshi-dark border-kenshi-steel text-kenshi-sand hover:border-kenshi-sand'}`}
              >
                <div className="flex items-start gap-[15px]">
                  <Users
                    className={`w-6 h-6 shrink-0 mt-0.5 ${selectedMember === m.id ? 'text-kenshi-dark' : 'text-kenshi-sand'}`}
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-bold text-[16px] tracking-wider truncate">{m.name}</span>
                    <div className="flex flex-col gap-[4px] mt-2">
                      {tStatus &&
                        tStatus.map((t, i) => (
                          <span
                            key={`t-${i}`}
                            className={`text-[12px] font-bold tracking-widest leading-relaxed ${selectedMember === m.id ? 'whitespace-normal break-words' : 'truncate'} ${getStatusColor(t.type, selectedMember === m.id)}`}
                          >
                            练{tStatus.length > 1 ? i + 1 : ''}: {t.text}
                          </span>
                        ))}
                      {rStatus &&
                        rStatus.map((r, i) => (
                          <span
                            key={`r-${i}`}
                            className={`text-[12px] font-bold tracking-widest leading-relaxed ${selectedMember === m.id ? 'whitespace-normal break-words' : 'truncate'} ${getStatusColor(r.type, selectedMember === m.id)}`}
                          >
                            休{rStatus.length > 1 ? i + 1 : ''}: {r.text}
                          </span>
                        ))}
                      {(!tStatus || tStatus.length === 0) && (!rStatus || rStatus.length === 0) && (
                        <span
                          className={`text-[12px] font-bold tracking-widest ${selectedMember === m.id ? 'whitespace-normal break-words' : 'truncate'} text-[#555] opacity-60`}
                        >
                          尚未分配
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="mt-4 flex items-center justify-between gap-2 border-[2px] border-kenshi-steel py-[10px] px-[12px] bg-[rgba(0,0,0,0.3)] shrink-0 group hover:border-kenshi-rust transition-colors cursor-pointer"
          onClick={() => {
            const nextVal = !isNoPenaltyMode;
            setIsNoPenaltyMode(nextVal);
            if (nextVal) {
              setToastMessage('现在队友出糗也不会扣属性啦！beep！');
              setTimeout(() => setToastMessage(null), 3000);
            } else {
              setToastMessage('犯错会导致“受伤”哦..BEE..P');
              setTimeout(() => setToastMessage(null), 3000);
            }
          }}
        >
          <label className="text-[14px] text-kenshi-sand font-bold tracking-widest cursor-pointer flex items-center gap-3 uppercase select-none w-full mb-0 pointer-events-none">
            <input
              type="checkbox"
              checked={isNoPenaltyMode}
              readOnly
              className="accent-kenshi-rust w-4 h-4 cursor-pointer shrink-0"
            />
            <span className="flex-1 truncate group-hover:text-white transition-colors">【无惩罚模式】</span>
          </label>
        </div>

        <div
          className="mt-2 flex items-center justify-between gap-2 border-[2px] border-kenshi-steel py-[10px] px-[12px] bg-[rgba(0,0,0,0.3)] shrink-0 group hover:border-kenshi-rust transition-colors cursor-pointer"
          onClick={() => {
            const nextVal = !isInfiniteConfig;
            setIsInfiniteConfig(nextVal);
            if (nextVal) {
              setToastMessage('现在可以一直重roll  BEEP！!');
              setTimeout(() => setToastMessage(null), 3000);
            } else {
              setToastMessage('现在不能重roll了，BEEEEEP！');
              setTimeout(() => setToastMessage(null), 3000);
            }
          }}
        >
          <label className="text-[14px] text-kenshi-sand font-bold tracking-widest cursor-pointer flex items-center gap-3 uppercase select-none w-full mb-0 pointer-events-none">
            <input
              type="checkbox"
              checked={isInfiniteConfig}
              readOnly
              className="accent-kenshi-rust w-4 h-4 cursor-pointer shrink-0"
            />
            <span className="flex-1 truncate group-hover:text-white transition-colors">【无限BEEP】</span>
          </label>
        </div>

        {page === 'rest' && (
          <button
            onClick={() => navigateTo('slave')}
            className="mt-auto md:mt-[20px] bg-transparent border-[2px] border-[#555] text-[#888] font-black tracking-[4px] uppercase py-[10px] px-4 hover:border-red-900 hover:text-red-700 transition-all duration-300 w-full text-center shrink-0"
          >
            奴隶处置
          </button>
        )}

        {page === 'slave' && (
          <button
            onClick={() => navigateTo('rest')}
            className="mt-auto md:mt-[20px] bg-transparent border-[2px] border-kenshi-rust text-kenshi-rust font-black tracking-[4px] uppercase py-[10px] px-4 hover:bg-kenshi-rust hover:text-kenshi-dark transition-all duration-300 w-full text-center shrink-0"
          >
            返回休息区
          </button>
        )}

        <button
          onClick={handleComplete}
          className={`${page === 'rest' || page === 'slave' ? 'mt-[10px]' : 'mt-[15px] md:mt-[20px]'} bg-kenshi-rust text-kenshi-dark font-black tracking-[4px] uppercase py-[12px] px-4 hover:shadow-[0_0_15px_rgba(235,213,179,0.4)] transition-all duration-300 w-full text-center shrink-0 border-[2px] border-kenshi-rust hover:bg-transparent hover:text-kenshi-rust`}
        >
          完成提交
        </button>
        {members.length === 0 && (
          <div className="mt-3 text-xs text-kenshi-sand/60 tracking-widest leading-relaxed border border-kenshi-steel/40 p-2">
            未检测到变量结构中的小队成员。
          </div>
        )}
      </aside>

      {/* 主界面 */}
      <main className="flex-1 w-full relative z-0 flex flex-col bg-kenshi-dark overflow-y-auto p-[20px] md:p-[40px]">
        <AnimatePresence mode="wait">
          {!activeCategory ? (
            <motion.section
              key="main-categories"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-[1400px] mx-auto flex-1 flex flex-col justify-start md:justify-center"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[25px] sm:gap-[35px]">
                {currentCategories.map((cat, idx) => {
                  const cardBorder = 'border-kenshi-rust';
                  const cardBgHover = 'hover:bg-white/10';
                  const cardBgAlt = 'bg-kenshi-steel';
                  const tagBg = 'bg-kenshi-rust text-kenshi-dark';

                  return (
                    <motion.div
                      key={cat.id}
                      id={`category-card-${cat.id}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      onClick={() => setActiveCategory(cat)}
                      className={`group relative ${cardBgAlt} border-2 border-solid ${cardBorder} p-[30px] min-h-[160px] sm:min-h-[200px] flex flex-col items-center justify-center gap-[15px] cursor-pointer transition-all duration-300 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.5)] ${cardBgHover}`}
                    >
                      <div
                        className={`text-[11px] px-[10px] py-[4px] uppercase absolute top-4 left-4 ${tagBg} font-bold tracking-widest`}
                      >
                        {cat.id.toUpperCase()}
                      </div>

                      <cat.icon className="text-kenshi-rust opacity-5 w-32 h-32 absolute right-[-20px] bottom-[-20px] pointer-events-none group-hover:opacity-10 transition-opacity" />

                      <h3 className="m-0 mt-6 text-[22px] sm:text-[26px] tracking-[4px] font-[900] text-white z-10 drop-shadow-md">
                        {cat.name}
                      </h3>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          ) : (
            <motion.section
              key="sub-categories"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-[1200px] mx-auto flex-1 flex flex-col"
            >
              <div className="flex items-center gap-4 sm:gap-6 mb-[30px]">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-kenshi-steel border-[2px] border-kenshi-rust text-kenshi-rust font-bold hover:bg-kenshi-rust hover:text-kenshi-dark transition-all cursor-pointer uppercase tracking-widest text-[12px] sm:text-[14px]"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  返回
                </button>
                <h2 className="text-[20px] sm:text-[28px] text-white font-black tracking-[4px] uppercase m-0 flex items-center gap-3">
                  <activeCategory.icon className="hidden sm:block w-8 h-8 text-kenshi-rust" />
                  {activeCategory.name}
                </h2>
              </div>

              <div className="flex flex-col gap-[15px] mb-[180px]">
                {activeCategory.subcategories.map((sub, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={sub.id}
                    className="border-[2px] border-kenshi-steel bg-kenshi-steel p-[20px] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-[15px] sm:gap-0 cursor-pointer hover:border-kenshi-rust hover:bg-[rgba(255,255,255,0.02)] transition-all relative overflow-hidden group"
                    onClick={() => handleRoll(sub.id)}
                    id={`roll-btn-${sub.id}`}
                  >
                    <div className="flex-1 pr-4 z-10">
                      <span className="block text-kenshi-sand text-[14px] sm:text-[16px] leading-[1.6]">
                        <strong className="text-white text-[16px] sm:text-[18px] mr-3 tracking-widest font-black uppercase inline-block mb-1 sm:mb-0">
                          {sub.name}
                        </strong>
                        {sub.desc}
                      </span>
                    </div>

                    {/* 微小反馈指示 */}
                    {isRolling && rollingSub === sub.id ? (
                      <div className="z-10 px-4 py-2 bg-transparent text-white flex items-center gap-2 text-[12px] font-bold tracking-widest uppercase justify-center sm:justify-start">
                        <Dices className="w-5 h-5 animate-spin" />
                        判定中
                      </div>
                    ) : (
                      <div className="z-10 px-4 py-2 bg-kenshi-dark border border-kenshi-rust text-kenshi-rust text-[12px] font-bold tracking-widest group-hover:bg-kenshi-rust group-hover:text-kenshi-dark transition-colors uppercase text-center sm:text-left">
                        DC {dcMap[sub.id] || 15}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* 底部固定骰子结果 */}
        <AnimatePresence>
          {rollResult && (
            <motion.div
              initial={{ opacity: 0, y: 120 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 120 }}
              className="absolute bottom-0 left-0 w-full h-auto min-h-[140px] bg-kenshi-steel border-t-[4px] border-kenshi-rust px-[20px] sm:px-[40px] py-[20px] flex gap-[20px] sm:gap-[30px] items-center shadow-[0_-10px_40px_rgba(0,0,0,0.8)] z-50"
            >
              <div
                className={`w-[70px] h-[70px] sm:w-[90px] sm:h-[90px] border-[3px] flex items-center justify-center text-[28px] sm:text-[40px] font-black shrink-0 ${getResultColor(rollResult.type).split(' ')[1]} ${getResultColor(rollResult.type).split(' ')[0]}`}
              >
                {rollResult.total}
              </div>
              <div className="flex-1 text-[14px] sm:text-[18px] text-kenshi-sand">
                <div
                  className={`font-black mb-[4px] sm:mb-[4px] text-[16px] sm:text-[20px] tracking-[2px] ${getResultColor(rollResult.type).split(' ')[0]}`}
                >
                  判定结果: {rollResult.type}
                </div>
                <div className="mb-[6px] sm:mb-[8px] text-[14px] sm:text-[16px] text-white/70 font-mono tracking-widest uppercase">
                  ( 基础D20{' '}
                  <span
                    className={
                      rollResult.rawRoll === 1
                        ? 'text-red-500 font-bold'
                        : rollResult.rawRoll === 20
                          ? 'text-amber-400 font-bold'
                          : ''
                    }
                  >
                    {rollResult.rawRoll}
                  </span>{' '}
                  {rollResult.modifier >= 0 ? '+' : '-'} {Math.abs(rollResult.modifier)} 属性修正 )
                </div>
                <p className="m-0 text-[13px] sm:text-[15px] opacity-90 leading-[1.6] sm:leading-[1.8] line-clamp-3 sm:line-clamp-none">
                  {rollResult.desc}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 完成提交的全屏遮罩动画 */}
      <AnimatePresence>
        {isCompleting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="max-w-2xl"
            >
              <Tent className="w-24 h-24 text-kenshi-rust mx-auto mb-8 opacity-80" />
              <h1 className="text-3xl md:text-5xl text-white font-black tracking-[10px] mb-6 drop-shadow-lg uppercase">
                营地记录已保存
              </h1>
              <p className="text-kenshi-sand/80 text-lg md:text-xl tracking-widest leading-relaxed">
                所有的汗水、鲜血与谈话都已经成为废土历史的一部分。
                <br />
                <br />
                时光荏苒，新的一天又将开始。
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 对象选择弹窗 */}
      <AnimatePresence>
        {targetSelectionFor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-kenshi-dark border-[3px] border-kenshi-rust p-6 max-w-sm w-full flex flex-col gap-4 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
            >
              <h3 className="text-kenshi-rust text-xl font-black tracking-widest text-center border-b-[2px] border-kenshi-steel pb-3 uppercase">
                选择互动对象
              </h3>
              <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {['sp7', 'sw1', 'sw2'].includes(targetSelectionFor || '') ? (
                  <>
                    <label className="bg-kenshi-steel/30 text-kenshi-sand border-[2px] border-kenshi-rust p-4 font-bold hover:border-kenshi-rust hover:text-white transition-colors text-left flex items-center gap-3 tracking-widest cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={multiTargets.includes('self')}
                        onChange={e => {
                          if (e.target.checked) setMultiTargets(p => [...p, 'self']);
                          else setMultiTargets(p => p.filter(id => id !== 'self'));
                        }}
                        className="w-5 h-5 accent-kenshi-rust shrink-0"
                      />
                      自己
                    </label>
                    {members
                      .filter(m => {
                        if (m.id === selectedMember) return false;
                        if (['sw1', 'sw2'].includes(targetSelectionFor || '')) return m.identity === '奴隶';
                        return true;
                      })
                      .map(m => (
                        <label
                          key={m.id}
                          className="bg-kenshi-steel/30 text-kenshi-sand border-[2px] border-kenshi-steel p-4 font-bold hover:border-kenshi-rust hover:text-white transition-colors text-left flex items-center gap-3 tracking-widest cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={multiTargets.includes(m.id)}
                            onChange={e => {
                              if (e.target.checked) setMultiTargets(p => [...p, m.id]);
                              else setMultiTargets(p => p.filter(id => id !== m.id));
                            }}
                            className="w-5 h-5 accent-kenshi-rust shrink-0"
                          />
                          {m.name}
                        </label>
                      ))}
                    <button
                      onClick={() => {
                        const subId = targetSelectionFor;
                        setTargetSelectionFor(null);
                        const finalTargets = multiTargets.length > 0 ? multiTargets : ['self'];
                        handleRoll(subId, finalTargets);
                      }}
                      className="mt-2 bg-kenshi-rust text-kenshi-dark border-[2px] border-kenshi-rust p-4 font-black hover:bg-kenshi-sand hover:border-kenshi-sand transition-colors text-center uppercase tracking-widest"
                    >
                      确认选择 (未选则默认自己)
                    </button>
                  </>
                ) : (
                  <>
                    {['sp1', 'ch4'].includes(targetSelectionFor || '') && (
                      <button
                        onClick={() => {
                          const subId = targetSelectionFor as string;
                          setTargetSelectionFor(null);
                          handleRoll(subId, 'stranger');
                        }}
                        className="bg-kenshi-steel/30 text-kenshi-sand border-[2px] border-kenshi-steel p-4 font-bold hover:border-kenshi-rust hover:text-white transition-colors text-left flex items-center gap-3 tracking-widest"
                      >
                        <Users className="w-5 h-5 text-kenshi-rust opacity-70" />
                        路过的陌生人
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const subId = targetSelectionFor as string;
                        setTargetSelectionFor(null);
                        handleRoll(subId, 'self');
                      }}
                      className="bg-kenshi-steel/30 text-kenshi-sand border-[2px] border-kenshi-rust p-4 font-bold hover:border-kenshi-rust hover:text-white transition-colors text-left flex items-center gap-3 tracking-widest"
                    >
                      <Users className="w-5 h-5 text-kenshi-rust opacity-70" />
                      自己
                    </button>
                    {members
                      .filter(m => {
                        if (m.id === selectedMember) return false;
                        if (
                          ['sm1', 'sm2', 'sc1', 'sc2', 'sc3', 'sc4', 'sc5', 'sc6', 'sc7'].includes(
                            targetSelectionFor || '',
                          )
                        ) {
                          return m.identity === '奴隶';
                        }
                        return true;
                      })
                      .map(m => (
                        <button
                          key={m.id}
                          onClick={() => {
                            const subId = targetSelectionFor as string;
                            setTargetSelectionFor(null);
                            handleRoll(subId, m.id);
                          }}
                          className="bg-kenshi-steel/30 text-kenshi-sand border-[2px] border-kenshi-steel p-4 font-bold hover:border-kenshi-rust hover:text-white transition-colors text-left flex items-center gap-3 tracking-widest"
                        >
                          <Users className="w-5 h-5 text-kenshi-rust opacity-70" />
                          {m.name}
                        </button>
                      ))}
                  </>
                )}
              </div>
              <button
                onClick={() => setTargetSelectionFor(null)}
                className="mt-4 text-kenshi-sand/60 hover:text-kenshi-sand text-[14px] font-bold tracking-widest text-center p-2 uppercase"
              >
                [ 取消 / 返回 ]
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 制作对象选择弹窗 */}
      <AnimatePresence>
        {craftSelectionFor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#141414] border-[2px] border-kenshi-steel p-6 max-w-sm w-full shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col gap-4 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-transparent via-kenshi-rust to-transparent opacity-50" />

              <div className="absolute -right-16 -top-16 opacity-[0.03] pointer-events-none">
                <Wrench className="w-64 h-64" />
              </div>

              <h3 className="text-kenshi-rust text-xl font-black tracking-widest text-center border-b-[2px] border-kenshi-steel pb-3 uppercase relative z-10">
                选择制作配方
              </h3>

              <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                {(craftItems[craftSelectionFor] || []).map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      const subId = craftSelectionFor;
                      setCraftSelectionFor(null);
                      handleRoll(subId, undefined, item.name);
                    }}
                    className="group bg-kenshi-steel/10 text-kenshi-sand border-[2px] border-kenshi-steel p-4 hover:border-kenshi-rust transition-colors text-left flex flex-col gap-2 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-kenshi-rust/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                    <div className="font-bold text-lg tracking-wider text-kenshi-sand group-hover:text-white transition-colors relative z-10">
                      {item.name}
                    </div>
                    <div className="text-sm text-kenshi-sand/60 font-mono tracking-widest relative z-10">
                      消耗: {item.requirements}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCraftSelectionFor(null)}
                className="mt-2 text-kenshi-sand/60 hover:text-kenshi-sand text-[14px] font-bold tracking-widest text-center p-2 uppercase relative z-10 transition-colors"
              >
                [ 取消 / 返回 ]
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 极刑部位选择弹窗 */}
      <AnimatePresence>
        {bodyPartSelectionFor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[115] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#141414] border-[2px] border-kenshi-steel p-6 max-w-sm w-full shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col gap-4 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-transparent via-red-900 to-transparent opacity-50" />

              <h3 className="text-red-700 text-xl font-black tracking-widest text-center border-b-[2px] border-kenshi-steel pb-3 uppercase relative z-10">
                选择处理部位
              </h3>

              <div className="grid grid-cols-2 gap-3 relative z-10">
                {bodyParts.map(part => (
                  <button
                    key={part.id}
                    onClick={() => {
                      const targetId = bodyPartSelectionFor;
                      setBodyPartSelectionFor(null);
                      handleRoll('sm2', targetId, undefined, part.name);
                    }}
                    className="bg-kenshi-steel/10 text-kenshi-sand border-[2px] border-kenshi-steel p-4 font-bold hover:border-red-900 hover:text-white transition-colors text-center tracking-widest"
                  >
                    {part.name}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setBodyPartSelectionFor(null)}
                className="mt-2 text-kenshi-sand/60 hover:text-kenshi-sand text-[14px] font-bold tracking-widest text-center p-2 uppercase relative z-10 transition-colors"
              >
                [ 取消 / 返回 ]
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 交易界面弹窗 */}
      <AnimatePresence>
        {tradeSelectionFor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#1a1a1a] border-[2px] border-kenshi-steel p-4 sm:p-6 w-full max-w-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col gap-4 relative overflow-hidden h-[80vh] flex flex-col"
            >
              <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-transparent via-kenshi-rust to-transparent opacity-50" />

              <h3 className="text-kenshi-rust text-xl sm:text-2xl font-black tracking-widest text-center border-b-[2px] border-kenshi-steel pb-3 uppercase shrink-0">
                交易
              </h3>

              <div className="flex items-center gap-2 border-b border-kenshi-steel/40 pb-2 mb-1">
                <span className="text-kenshi-sand/70 text-xs tracking-widest">背包来源</span>
                <select
                  value={activeTradeSourceId}
                  onChange={e => {
                    setTradeSourceMemberId(e.target.value);
                    setTradeTransactions({});
                  }}
                  className="bg-black border border-kenshi-steel text-kenshi-sand text-xs px-2 py-1"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <span className="text-kenshi-rust/80 text-xs">
                  售卖执行：{members.find(m => m.id === selectedMember)?.name || '当前角色'}
                </span>
              </div>

              <div className="flex justify-between px-2 text-kenshi-sand font-bold tracking-widest text-sm border-b border-kenshi-steel/50 pb-2 shrink-0 hidden sm:flex">
                <div className="flex-1">物品</div>
                <div className="w-16 text-center text-kenshi-rust">我的营地</div>
                <div className="w-16 text-center">价值</div>
                <div className="w-48 text-center text-kenshi-steel">下架/上架</div>
                <div className="w-16 text-center text-white">上架</div>
              </div>

              <div className="flex flex-col gap-1 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {tradeItems.map(item => {
                  const listedQty = tradeTransactions[item.id] || 0;
                  const newMyQty = item.myQty - listedQty;

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-2 hover:bg-kenshi-steel/10 border-b border-white/5 transition-colors group"
                    >
                      <div className="flex-1 text-kenshi-sand font-bold tracking-wider group-hover:text-white transition-colors mb-2 sm:mb-0">
                        {item.name}
                      </div>

                      {/* Mobile Labels */}
                      <div className="flex items-center justify-between sm:hidden text-xs mb-2">
                        <span className="text-kenshi-rust">营地: {newMyQty}</span>
                        <span className="text-kenshi-sand">价值: ${item.val}</span>
                        <span className="text-white">上架: {listedQty}</span>
                      </div>

                      <div className="hidden sm:block w-16 text-center text-kenshi-rust font-mono text-sm">
                        {newMyQty}
                      </div>
                      <div className="hidden sm:block w-16 text-center text-kenshi-sand font-mono text-sm">
                        ${item.val}
                      </div>

                      <div className="w-full sm:w-48 flex items-center justify-center gap-1">
                        <button
                          onClick={() => setTradeTransactions(prev => ({ ...prev, [item.id]: 0 }))}
                          disabled={listedQty === 0}
                          className="w-8 h-8 flex items-center justify-center bg-kenshi-steel/20 hover:bg-kenshi-rust/30 text-kenshi-sand border border-kenshi-steel disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                          title="全下"
                        >
                          «
                        </button>
                        <button
                          onClick={() =>
                            setTradeTransactions(prev => ({
                              ...prev,
                              [item.id]: Math.max(0, (prev[item.id] || 0) - 1),
                            }))
                          }
                          disabled={listedQty === 0}
                          className="w-8 h-8 flex items-center justify-center bg-kenshi-steel/20 hover:bg-kenshi-rust/30 text-kenshi-sand border border-kenshi-steel disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                          title="下架"
                        >
                          ‹
                        </button>

                        <div className="w-16 h-8 flex items-center justify-center bg-black border border-kenshi-steel text-kenshi-sand font-mono text-sm">
                          {listedQty > 0 ? `${listedQty}` : '0'}
                        </div>

                        <button
                          onClick={() =>
                            setTradeTransactions(prev => ({
                              ...prev,
                              [item.id]: Math.min(item.myQty, (prev[item.id] || 0) + 1),
                            }))
                          }
                          disabled={newMyQty <= 0}
                          className="w-8 h-8 flex items-center justify-center bg-kenshi-steel/20 hover:bg-kenshi-steel/50 text-white border border-kenshi-steel disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                          title="上架"
                        >
                          ›
                        </button>
                        <button
                          onClick={() => setTradeTransactions(prev => ({ ...prev, [item.id]: item.myQty }))}
                          disabled={newMyQty <= 0}
                          className="w-8 h-8 flex items-center justify-center bg-kenshi-steel/20 hover:bg-kenshi-steel/50 text-white border border-kenshi-steel disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                          title="全上"
                        >
                          »
                        </button>
                      </div>

                      <div className="hidden sm:block w-16 text-center text-white font-mono text-sm">{listedQty}</div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 pt-4 border-t-[2px] border-kenshi-steel">
                <div className="text-kenshi-sand font-mono text-sm">
                  预计收入:
                  <span className="ml-2 text-lg font-bold text-white">
                    +$
                    {Object.entries(tradeTransactions).reduce(
                      (acc, [id, qty]) => acc + (tradeItems.find(i => i.id === id)?.val || 0) * qty,
                      0,
                    )}
                  </span>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setTradeSelectionFor(null)}
                    className="flex-1 sm:flex-none text-kenshi-sand/60 hover:text-kenshi-sand border border-kenshi-steel/50 p-2 uppercase transition-colors"
                  >
                    取消交易
                  </button>
                  <button
                    onClick={() => {
                      const subId = tradeSelectionFor;
                      const payload = { ...tradeTransactions };
                      setTradeSelectionFor(null);
                      setTradeTransactions({});
                      handleRoll(subId, undefined, undefined, undefined, payload);
                    }}
                    className="flex-1 sm:flex-none bg-kenshi-rust text-kenshi-dark border border-kenshi-rust p-2 px-6 font-black hover:bg-kenshi-sand hover:border-kenshi-sand transition-colors uppercase"
                  >
                    确认交易并掷骰
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
