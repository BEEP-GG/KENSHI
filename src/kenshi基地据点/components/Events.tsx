import { Clock, Dices, Percent, Shield, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { FACILITY_BLUEPRINTS } from '../data';
import { GameState } from '../types';

// 模拟后端随机事件池 (Kenshi 风格)
// common 字段表示该事件不依赖区域与区域专属派系，适合作为基地建设通用概率事件。
const MOCK_EVENT_POOL = {
  neutral: [
    { title: '宁静的废土', desc: '除了呼啸的风卷起几只风滚草，荒野难得的平静，没有异常。', type: 'neutral', days: 1 },
  ],
  good_minor: [
    { title: '路过的流浪汉', desc: '一个友好的流浪汉路过，并留下了一些搜刮来的零碎物资。', type: 'good', days: 1 },
    {
      title: '零散拾荒者',
      desc: '几名拾荒者经过据点附近，愿意用少量废料换取水和休息处。',
      type: 'good',
      days: 1,
      common: true,
    },
    {
      title: '旧物可用',
      desc: '巡逻成员在外围发现一批还能修补利用的旧零件，可作为临时建设材料。',
      type: 'good',
      days: 1,
      common: true,
    },
  ],
  good_moderate: [
    { title: '路过商队', desc: '一支流浪商队即将在附近扎营，带来了一些商品和小道消息。', type: 'good', days: 2 },
    { title: '科技猎人小队', desc: '几位科技猎人请求借宿，并支付了一点报酬。', type: 'good', days: 2 },
    {
      title: '商人到来',
      desc: '一队商人计划抵达据点，可能带来食物、药品、建材和可交易的杂货。',
      type: 'good',
      days: 2,
      common: true,
    },
    {
      title: '工匠求宿',
      desc: '几名手艺人请求在据点短暂停留，愿意用维修、加工或劳务抵扣住宿。',
      type: 'good',
      days: 2,
      common: true,
    },
    {
      title: '漂流者入住',
      desc: '几名漂流者希望加入据点生活，他们愿意承担基础劳作来换取庇护。',
      type: 'good',
      days: 2,
      common: true,
    },
  ],
  good_severe: [
    {
      title: '商队大亨',
      desc: '一支满载货物的贸易大商队决定在此补给，这将是一次绝佳的交易机会。',
      type: 'good',
      days: 3,
    },
    { title: '远古宝藏', desc: '在沙暴过后，地表暴露出了一处极其罕见的古代科技遗物箱。', type: 'good', days: 1 },
    {
      title: '大型贸易机会',
      desc: '一支规模可观的商队正在寻找安全补给点，若接待顺利，据点可获得大量交易收益。',
      type: 'good',
      days: 3,
      common: true,
    },
    {
      title: '建设热潮',
      desc: '一批流民和劳工愿意临时加入建设，只要提供基础食宿，就能显著推进设施工程。',
      type: 'good',
      days: 2,
      common: true,
    },
  ],
  bad_minor: [
    { title: '饥饿的流浪汉', desc: '几个食不果腹的流浪汉在据点外徘徊，可能会偷盗外围物品。', type: 'bad', days: 1 },
    {
      title: '小偷试探',
      desc: '有陌生人在外围观察仓库和防线，若不加强巡逻，可能发生小规模盗窃。',
      type: 'bad',
      days: 1,
      common: true,
    },
    {
      title: '设备磨损',
      desc: '据点内几处常用设施出现磨损迹象，需要安排维护，否则效率会暂时下降。',
      type: 'bad',
      days: 1,
      common: true,
    },
  ],
  bad_moderate: [
    { title: '野生骨犬群', desc: '一群饥饿的骨犬寻着血腥味靠近，他们很快就会发起攻击！', type: 'urgent', days: 2 },
    { title: '酸雨云团聚集', desc: '重度酸雨即将覆盖这片区域，无防护的血肉之躯将遭到持续伤害。', type: 'bad', days: 3 },
    {
      title: '土匪骚扰',
      desc: '一伙土匪在据点附近游荡，可能袭击落单成员、抢夺物资或试探防线。',
      type: 'urgent',
      days: 2,
      common: true,
    },
    {
      title: '物资短缺',
      desc: '关键消耗品的库存低于安全线，若不尽快补充，生产和防御都会受到影响。',
      type: 'bad',
      days: 2,
      common: true,
    },
  ],
  bad_severe: [
    {
      title: '土匪入侵',
      desc: '一支土匪队伍正在集结，目标很可能是据点仓库与生活区，必须尽快组织防御。',
      type: 'urgent',
      days: 3,
      common: true,
    },
    {
      title: '内部崩盘风险',
      desc: '长期压力、补给不足与防务漏洞同时爆发，据点可能出现停工、逃散或严重损失。',
      type: 'bad',
      days: 2,
      common: true,
    },
  ],
};

const REGION_PROFILES: Record<string, { danger: number; habitability: number; summary: string }> = {
  大沙漠: {
    danger: 60,
    habitability: 40,
    summary: '联合城、商人行会、奴隶商人、砂之忍者与农民反抗团活跃，商队和拾荒者很多。',
  },
  沼泽地: { danger: 80, habitability: 25, summary: '猎犬帮、石鼠帮、格雷帮、沼泽忍者与血蜘蛛横行。' },
  洼地泻湖: { danger: 35, habitability: 60, summary: '科技猎人和中立冒险者众多，是重要补给站。' },
  闪域: { danger: 55, habitability: 50, summary: '喙嘴兽很多但资源丰富，四色剑客团、白眉土匪和游牧民活跃。' },
  复仇之谷: { danger: 90, habitability: 5, summary: '白天轨道激光致命，骨人土匪与无头骨人在此游荡。' },
  灰色沙漠: { danger: 50, habitability: 20, summary: '有科技猎人中继站，鲜血劫掠团和索黑教武僧偶尔经过。' },
  目之地: { danger: 65, habitability: 15, summary: '永恒沙尘暴和饥饿骨犬是主要威胁。' },
  恒域: { danger: 45, habitability: 70, summary: '联合城与商人行会核心区，城市内安全。' },
  巴斯特: { danger: 85, habitability: 10, summary: '圣国与联合城的永恒战场，双方军队、难民和拾荒者混战。' },
  斯托伯的冒险: { danger: 75, habitability: 20, summary: '火山地貌致命，大量陆地蝙蝠群和夜魔活动。' },
  食人族平原: { danger: 90, habitability: 5, summary: '食人族部落的领地，生者只是猎物。' },
  皇家山谷: { danger: 85, habitability: 15, summary: '南部蜂巢绝对领地，酸雨环境下会攻击非蜂巢生物。' },
  奥克兰之傲: { danger: 30, habitability: 85, summary: '圣国腹地富饶，但对异族、女性和科技使用者极度危险。' },
  奥克兰之臂: { danger: 40, habitability: 30, summary: '圣国天然屏障，山道崎岖，有圣骑士巡逻。' },
  奥克兰之谷: { danger: 40, habitability: 35, summary: '连接圣国与联合城的沙漠地带，双方巡逻队时有冲突。' },
  奥克兰之湾: { danger: 65, habitability: 25, summary: '圣国抵御雾人入侵的前线。' },
  重生镇: { danger: 70, habitability: 0, summary: '圣国露天劳改营，对被囚禁者是绝地。' },
  边境之地: { danger: 60, habitability: 45, summary: '三大势力三不管地带，冲突不断。' },
  斯坦沙漠: { danger: 65, habitability: 40, summary: '沙克王国家园，内部派系内斗明显。' },
  虚荣谷: { danger: 70, habitability: 35, summary: '西部蜂巢家园，惨爪兽和黑暗蜂巢叛军潜伏。' },
  雾岛: { danger: 95, habitability: 5, summary: '浓雾笼罩，遍地雾人，蒙格勒是唯一避难所。' },
  阿拉克: { danger: 95, habitability: 0, summary: '虫之主巢穴，除了蜘蛛还是蜘蛛。' },
  灰烬之地: { danger: 100, habitability: 0, summary: '工业灰烬和毒气让有机生命几乎无法生存。' },
  钩子海滨: { danger: 50, habitability: 65, summary: '斯威士国首都所在地，雨林茂密且治安复杂。' },
  鱼形人之岛: { danger: 80, habitability: 15, summary: '鱼形人对所有外来者都极具攻击性。' },
  斯托伯的花园: { danger: 70, habitability: 30, summary: '鲜血掠夺者、索黑教、科技猎人和海盗在此冲突。' },
  黑色沙漠: { danger: 95, habitability: 5, summary: '致命黑色毒气云弥漫，黑龙忍者团总部设在此地。' },
  死亡之地: { danger: 100, habitability: 0, summary: '永恒强酸雨和闪电是骨人的天堂、血肉之躯的地狱。' },
  飞掠沙漠: { danger: 65, habitability: 25, summary: '圣国与联合城冲突区，沙下还藏着食腐虫。' },
  南方湿地: { danger: 60, habitability: 40, summary: '奴隶市场和帮派活动频繁，野生沼泽乌龟与血蜘蛛很多。' },
  风暴口海岸: { danger: 55, habitability: 45, summary: '联合城沿海村落，但异教徒和草之海盗活动频繁。' },
  辛昆半岛: { danger: 70, habitability: 20, summary: '农民反抗团、食人族猎手和食人族在此混战。' },
  隐匿森林: { danger: 45, habitability: 55, summary: '浪忍团大本营，庇护逃奴。' },
  偏远之地: { danger: 65, habitability: 35, summary: '黑犬帮、西斯海盗、鲜血掠夺者和联合城争夺遗迹。' },
  禁岛: { danger: 85, habitability: 5, summary: '酸雨不停，古代铁蜘蛛与草之海盗遍布。' },
  绿色海岸: { danger: 60, habitability: 45, summary: '海盗兄弟会与螃蟹掠夺者地盘，风景不错但随时开战。' },
  北部海岸: { danger: 75, habitability: 15, summary: '食人族时常抓人，环境恶劣。' },
  蜘蛛平原: { danger: 80, habitability: 10, summary: '阿拉克蜘蛛蔓延前线，遍布蜘蛛和沙克战士的战场。' },
  利维坦海岸: { danger: 70, habitability: 30, summary: '利维坦巨兽和铁蜘蛛很多，也是狩猎者天堂。' },
  铁之径: { danger: 70, habitability: 10, summary: '陨落蜂巢族和铁蜘蛛领地，极度排外。' },
  紫色沙漠: { danger: 60, habitability: 10, summary: '永恒沙尘暴中有食人族与喙嘴兽出没。' },
  狂战士之国: { danger: 75, habitability: 15, summary: '被流放的沙克狂战士国度，崇尚战斗。' },
  尖叫森林: { danger: 75, habitability: 20, summary: '伊洛帝国会抓捕男性，对闯入者也会攻击。' },
  服从之地: { danger: 80, habitability: 5, summary: '巨型骨人坟场，遍布薄雾雾人。' },
  渣滓之地: { danger: 40, habitability: 30, summary: '贫瘠荒凉，只有死猫流民在此苟延残喘。' },
  守望者之环: { danger: 60, habitability: 25, summary: '赏金猎人和科技猎人监视虫之主的营地。' },
  舜: { danger: 70, habitability: 30, summary: '黑暗蜂巢隐居家园，野外有人皮蜘蛛和喙嘴猩猩。' },
  方格山: { danger: 80, habitability: 0, summary: '旧帝国变异遗迹，怪物横行。' },
  环形山: { danger: 80, habitability: 0, summary: '巨大陨石坑内部有鬼堡和古代机械蜘蛛。' },
  燃烧森林: { danger: 65, habitability: 35, summary: '酸雨丛林中有沼泽乌龟、血蜘蛛和DJ忍者。' },
  剥皮人的漫游: { danger: 55, habitability: 25, summary: '空旷平原，有圣国军队、饥饿土匪和铁骸猛龙。' },
  黑暗之指: { danger: 85, habitability: 10, summary: '肉主食人族部落领地，到处是食人族。' },
  咆哮迷宫岛: { danger: 75, habitability: 5, summary: '复杂迷宫地形中盘踞大量螃蟹。' },
  伽特: { danger: 70, habitability: 25, summary: '景色美丽但喙嘴兽群庞大，偷蛋风险极高。' },
  铁之谷: { danger: 95, habitability: 5, summary: '强酸雨和致命机械是常态。' },
  极恶之地: { danger: 70, habitability: 15, summary: '螃蟹掠夺者和骨人土匪的战场。' },
  峭壁山: { danger: 75, habitability: 20, summary: '各路土匪混战之地。' },
  温德河: { danger: 40, habitability: 45, summary: '圣国母亲河沿岸有巡逻队，也潜伏漫游骨人。' },
  暗黑苍穹: { danger: 90, habitability: 5, summary: '人皮土匪帮的狩猎场，第二帝国也有据点。' },
  骗子捷径: { danger: 65, habitability: 10, summary: '看似捷径，实则遍布旧时代警卫铁蜘蛛。' },
  骸骨荒原: { danger: 65, habitability: 35, summary: '遍地巨兽骸骨，联合城据点和冒险者很多。' },
  勇气峡谷: { danger: 60, habitability: 40, summary: '商路要道，鲜血劫掠团和砂之忍者经常伏击商队。' },
  洪泛地: { danger: 75, habitability: 5, summary: '终年大雨的工业废墟，食人族、雾人和远古机械潜伏。' },
};

export type RolledEventPayload = {
  id: number;
  title: string;
  desc: string;
  type: 'neutral' | 'good' | 'bad' | 'urgent';
  days: number;
  rolledNumber: number;
  categoryStr: string;
  common?: boolean;
};

export default function Events({
  state,
  onRollEvent,
}: {
  state: GameState;
  onRollEvent: (event: RolledEventPayload) => void;
}) {
  const [rollResult, setRollResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [flashingNumber, setFlashingNumber] = useState<number>(0);
  const [revealedEvent, setRevealedEvent] = useState<RolledEventPayload | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<RolledEventPayload[]>([]);

  const currentOutpost = state.outposts.find(outpost => outpost.id === state.currentOutpostId) || state.outposts[0];
  const currentRegionName = currentOutpost?.location || '未知区域';
  const currentRegionProfile = REGION_PROFILES[currentRegionName] || null;

  // 计算安全度
  const safety = state.facilities.reduce((acc, fac) => {
    const bp = FACILITY_BLUEPRINTS.find(b => b.id === fac.blueprintId);
    if (!bp) return acc;
    const levelData = bp.levels[fac.level];
    if (levelData && typeof levelData.productionRate === 'string' && levelData.productionRate.includes('安全度')) {
      return acc + (parseInt(levelData.productionRate) || 0);
    }
    return acc;
  }, 0);

  // 安全值影响好事件，危险度大于 65 时提升坏事件基底
  // 危险度小于 65 时，根据宜居度适度增加少部分基础好事件概率
  const safetyModifier = safety;
  const regionDanger = currentRegionProfile?.danger || 50;
  const regionHabitability = currentRegionProfile?.habitability || 50;
  const dangerPenalty = regionDanger > 65 ? (regionDanger - 65) / 3 : 0;
  const habitabilityBonus = regionDanger < 65 ? Math.max(0, regionHabitability - 40) / 5 : 0;

  const pNeutral = 0;
  const pGoodMinor = Math.max(1, 15 + safetyModifier * 0.1 + habitabilityBonus * 0.8 - dangerPenalty * 0.4);
  const pGoodModerate = Math.max(1, 8 + safetyModifier * 0.05 + habitabilityBonus * 0.5 - dangerPenalty * 0.2);
  const pGoodSevere = Math.max(1, 3 + safetyModifier * 0.02 + habitabilityBonus * 0.25 - dangerPenalty * 0.1);
  const pBadMinor = Math.max(1, 38 - safetyModifier * 0.15 + dangerPenalty * 0.8);
  const pBadModerate = Math.max(12, 21 - safetyModifier * 0.05 + dangerPenalty * 0.65);
  const pBadSevere = Math.max(0, 15 + dangerPenalty * 0.45 - habitabilityBonus * 0.1);

  const totalWeight = pNeutral + pGoodMinor + pGoodModerate + pGoodSevere + pBadMinor + pBadModerate + pBadSevere;
  const factor = 100 / totalWeight;

  const probabilities = {
    neutral: Math.round(pNeutral * factor),
    good_minor: Math.round(pGoodMinor * factor),
    good_moderate: Math.round(pGoodModerate * factor),
    good_severe: Math.round(pGoodSevere * factor),
    bad_minor: Math.round(pBadMinor * factor),
    bad_moderate: Math.round(pBadModerate * factor),
    bad_severe: Math.round(pBadSevere * factor),
  };

  const CategoryNameMap: Record<string, string> = {
    neutral: '平淡无奇',
    good_minor: '微小增益',
    good_moderate: '可观收获',
    good_severe: '绝佳机遇',
    bad_minor: '轻微危机',
    bad_moderate: '中度威胁',
    bad_severe: '致命灾难',
  };

  const handleRoll = () => {
    setIsRolling(true);
    setRollResult(null);
    setRevealedEvent(null);

    const flashInterval = setInterval(() => {
      setFlashingNumber(Math.floor(Math.random() * 900) + 100);
    }, 50);

    setTimeout(() => {
      clearInterval(flashInterval);
      const result = Math.floor(Math.random() * 100) + 1;
      setRollResult(result);

      let category = '';
      let accum = 0;

      if (result <= (accum += probabilities.neutral)) category = 'neutral';
      else if (result <= (accum += probabilities.good_minor)) category = 'good_minor';
      else if (result <= (accum += probabilities.good_moderate)) category = 'good_moderate';
      else if (result <= (accum += probabilities.good_severe)) category = 'good_severe';
      else if (result <= (accum += probabilities.bad_minor)) category = 'bad_minor';
      else if (result <= (accum += probabilities.bad_moderate)) category = 'bad_moderate';
      else category = 'bad_severe';

      const pool = MOCK_EVENT_POOL[category as keyof typeof MOCK_EVENT_POOL];
      const fallbackPool = MOCK_EVENT_POOL.bad_moderate;
      const chosenPool = pool.length > 0 ? pool : fallbackPool;
      const randomEventTemplate = chosenPool[Math.floor(Math.random() * chosenPool.length)] as Omit<
        RolledEventPayload,
        'id' | 'rolledNumber' | 'categoryStr'
      >;

      const newEvent: RolledEventPayload = {
        ...randomEventTemplate,
        id: Date.now(),
        rolledNumber: result,
        categoryStr: category,
      };
      setRevealedEvent(newEvent);
      setUpcomingEvents(prev => [newEvent, ...prev]);
      onRollEvent(newEvent);

      setIsRolling(false);
    }, 1500);
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-end gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-light tracking-wide text-slate-100 flex items-center">
            <Dices className="mr-3 text-amber-500" size={28} />
            命运事件
          </h2>
          <p className="text-slate-400 mt-2 text-sm tracking-wider">
            废土由混乱的因果编织。进行预测，决定据点接下来的运势。
          </p>
          <p className="text-xs text-slate-500 mt-2">
            当前区域：<span className="text-amber-400">{currentRegionName}</span>
            {currentRegionProfile
              ? `｜危险度 ${currentRegionProfile.danger}% ｜宜居度 ${currentRegionProfile.habitability}%`
              : ''}
          </p>
          {currentRegionProfile && (
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">{currentRegionProfile.summary}</p>
          )}
        </div>
        <div className="flex items-center bg-black/40 px-4 py-2 rounded-lg border border-white/5">
          <Shield className="text-emerald-500 mr-2" size={20} />
          <div>
            <div className="text-xs text-slate-500">据点安全值</div>
            <div className="text-lg font-mono text-emerald-400 leading-none mt-1">
              {safety} <span className="text-sm opacity-50 font-sans ml-1 text-slate-400">正在干涉运势</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-8 rounded-xl border-amber-900/30 shadow-[0_0_40px_rgba(217,119,6,0.05)] relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>

          <h3 className="text-xl text-slate-200 mb-6 flex items-center font-medium">
            <Sparkles size={18} className="text-amber-500 mr-2" />
            观星与预测
          </h3>

          <div className="mb-6 bg-black/40 rounded p-4 border border-white/5 text-xs grid grid-cols-2 gap-x-8 gap-y-2">
            <div className="col-span-2 text-amber-500/80 mb-2 font-mono flex items-center border-b border-white/5 pb-2">
              <Percent size={14} className="mr-1" /> 当前事件概率池
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-400">微小增益</span>
              <span className="font-mono text-emerald-300">{probabilities.good_minor}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-orange-400">轻微危机</span>
              <span className="font-mono text-orange-300">{probabilities.bad_minor}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-500">可观收获</span>
              <span className="font-mono text-emerald-400">{probabilities.good_moderate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-400">中度威胁</span>
              <span className="font-mono text-red-300">{probabilities.bad_moderate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-600">绝佳机遇</span>
              <span className="font-mono text-emerald-500">{probabilities.good_severe}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-500 font-bold">致命灾难</span>
              <span className="font-mono text-red-500">{probabilities.bad_severe}%</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-6 bg-black/40 rounded-xl border border-white/5 mb-6 min-h-[220px]">
            <AnimatePresence mode="wait">
              {isRolling ? (
                <motion.div
                  key="rolling"
                  className="text-amber-500 drop-shadow-[0_0_20px_rgba(217,119,6,0.6)] flex flex-col items-center justify-center"
                >
                  <div className="text-6xl font-mono font-bold tracking-widest">{flashingNumber}</div>
                  <div className="text-xs text-amber-500/50 mt-4 tracking-widest animate-pulse">连接因果...</div>
                </motion.div>
              ) : rollResult !== null && revealedEvent !== null ? (
                <motion.div
                  key="result"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring' }}
                  className="flex flex-col items-center w-full px-6"
                >
                  <div className="w-full bg-white/5 border border-white/10 p-4 rounded text-left relative overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 ${revealedEvent.type === 'urgent' ? 'bg-red-500' : revealedEvent.type === 'bad' ? 'bg-orange-500' : revealedEvent.type === 'good' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    />
                    <div className="flex justify-between items-start pl-2">
                      <div>
                        <div className="text-xs text-amber-500/80 mb-1 font-mono tracking-widest">
                          判定类型: {CategoryNameMap[revealedEvent.categoryStr]}
                        </div>
                        <div className="text-lg text-slate-200">{revealedEvent.title}</div>
                      </div>
                      <div className="text-amber-400 font-mono text-sm border border-amber-500/30 bg-amber-950/40 px-2 py-1 rounded flex items-center shrink-0 ml-2">
                        <Clock size={14} className="mr-1" /> {revealedEvent.days} 天后
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mt-2 pl-2">{revealedEvent.desc}</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  className="text-slate-700 hover:text-slate-500 transition-colors cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  onClick={!isRolling ? handleRoll : undefined}
                >
                  <Dices size={64} />
                  <div className="text-center mt-4 text-sm font-mono tracking-widest opacity-50">CLICK_TO_ROLL</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="text-center mt-auto">
            <button
              onClick={handleRoll}
              disabled={isRolling}
              className={`w-full py-4 rounded text-lg tracking-widest font-medium transition-all ${isRolling ? 'bg-amber-900/50 text-amber-900 cursor-not-allowed' : 'bg-amber-600 text-white hover:bg-amber-500 shadow-[0_0_20px_rgba(217,119,6,0.3)]'}`}
            >
              {isRolling ? '连接因果链...' : '预测事件'}
            </button>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-xl h-[600px] flex flex-col">
          <h3 className="text-xl text-slate-200 mb-6 flex items-center font-medium">
            <Clock size={18} className="text-amber-500 mr-2" />
            既定未来 (Upcoming)
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-12 text-slate-500 border border-white/5 border-dashed rounded h-full flex flex-col items-center justify-center">
                <Clock size={32} className="mb-4 opacity-20" />
                观测日志一片空白。
                <br />
                请掷骰索取未来的碎片。
              </div>
            ) : (
              upcomingEvents.map(ev => (
                <div
                  key={ev.id}
                  className="p-4 bg-black/40 border border-white/5 rounded-lg relative overflow-hidden group shrink-0"
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${ev.type === 'urgent' ? 'bg-red-500' : ev.type === 'bad' ? 'bg-orange-500' : ev.type === 'good' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  />
                  <div className="flex justify-between items-start pl-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-slate-200">{ev.title}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed pr-4 line-clamp-2">{ev.desc}</p>
                    </div>
                    <div className="shrink-0 text-center bg-black/60 px-3 py-1 rounded">
                      <div className="text-xl font-mono text-amber-500 leading-none">{ev.days}</div>
                      <div className="text-[10px] text-amber-500/60 uppercase tracking-widest mt-1">Days</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
