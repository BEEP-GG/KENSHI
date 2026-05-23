import { useState, useEffect } from 'react';
import { GameState } from '../types';
import { FACILITY_BLUEPRINTS } from '../data';
import { Dices, AlertTriangle, Info, Clock, ShieldAlert, Sparkles, Shield, Percent } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Modal from './Modal';

// 模拟后端随机事件池 (Kenshi 风格)
const MOCK_EVENT_POOL = {
  neutral: [
    { title: '宁静的废土', desc: '除了呼啸的风卷起几只风滚草，荒野难得的平静，没有异常。', type: 'neutral', days: 1 }
  ],
  good_minor: [
    { title: '路过的流浪汉', desc: '一个友好的流浪汉路过，并留下了一些搜刮来的零碎物资。', type: 'good', days: 1 },
    { title: '野兽残骸', desc: '发现了一些新鲜的动物尸体，可以收集些微肉类。', type: 'good', days: 1 }
  ],
  good_moderate: [
    { title: '路过商队', desc: '一支流浪商队即将在附近扎营，带来了一些商品和小道消息。', type: 'good', days: 2 },
    { title: '科技猎人小队', desc: '几位科技猎人请求借宿，并支付了一点报酬。', type: 'good', days: 2 }
  ],
  good_severe: [
    { title: '商队大亨', desc: '一支满载货物的贸易大商队决定在此补给，这将是一次绝佳的交易机会。', type: 'good', days: 3 },
    { title: '远古宝藏', desc: '在沙暴过后，地表暴露出了一处极其罕见的古代科技遗物箱。', type: 'good', days: 1 }
  ],
  bad_minor: [
    { title: '饥饿的流浪汉', desc: '几个食不果腹的流浪汉在据点外徘徊，可能会偷盗外围物品。', type: 'bad', days: 1 },
    { title: '小股沙暴', desc: '一阵沙暴即将席卷，外场工作效率会短暂下降。', type: 'bad', days: 1 }
  ],
  bad_moderate: [
    { title: '野生骨犬群', desc: '一群饥饿的骨犬寻着血腥味靠近，他们很快就会发起攻击！', type: 'urgent', days: 2 },
    { title: '酸雨云团聚集', desc: '重度酸雨即将覆盖这片区域，无防护的血肉之躯将遭到持续伤害。', type: 'bad', days: 3 }
  ],
  bad_severe: [
    { title: '狂热信徒 / 强盗大军逼近', desc: '如果未能满足要求，一支全副武装的狂热大军将踏平此地！', type: 'urgent', days: 3 },
    { title: '利维坦暴走', desc: '一头处于狂暴状态的庞然大物正无差别地摧毁它路径上的一切设施。', type: 'urgent', days: 4 },
    { title: '喙嘴兽群迁徙', desc: '极为凶暴的长颈长喙怪物正向这边移动，野外极度危险。', type: 'urgent', days: 2 }
  ]
};

export default function Events({ state, onRollEvent }: { state: GameState, onRollEvent: () => void }) {
  const [rollResult, setRollResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [flashingNumber, setFlashingNumber] = useState<number>(0);
  const [revealedEvent, setRevealedEvent] = useState<any>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

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

  // 安全值影响好事件，严重提升少幅度，中等提升较少幅度，轻微提升中等
  // 坏事，轻微降低中等，中等降低较少幅度，严重不会改变
  // 假设 100 安全度时，得到最大增益（也可以无上限，但我们做一点数学折算）
  const safetyModifier = safety; 
  
  let pNeutral = 0;
  let pGoodMinor = 15 + safetyModifier * 0.1;
  let pGoodModerate = 8 + safetyModifier * 0.05;
  let pGoodSevere = 3 + safetyModifier * 0.02;
  let pBadMinor = Math.max(0, 38 - safetyModifier * 0.15);
  let pBadModerate = Math.max(12, 21 - safetyModifier * 0.05);
  let pBadSevere = 15;
  
  const totalWeight = pNeutral + pGoodMinor + pGoodModerate + pGoodSevere + pBadMinor + pBadModerate + pBadSevere;
  const factor = 100 / totalWeight;

  const probabilities = {
    neutral: Math.round(pNeutral * factor),
    good_minor: Math.round(pGoodMinor * factor),
    good_moderate: Math.round(pGoodModerate * factor),
    good_severe: Math.round(pGoodSevere * factor),
    bad_minor: Math.round(pBadMinor * factor),
    bad_moderate: Math.round(pBadModerate * factor),
    bad_severe: Math.round(pBadSevere * factor)
  };

  const CategoryNameMap: Record<string, string> = {
    neutral: '平淡无奇',
    good_minor: '微小增益',
    good_moderate: '可观收获',
    good_severe: '绝佳机遇',
    bad_minor: '轻微危机',
    bad_moderate: '中度威胁',
    bad_severe: '致命灾难'
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
      onRollEvent();
      // Roll
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
      const randomEventTemplate = pool[Math.floor(Math.random() * pool.length)];
      
      const newEvent = { ...randomEventTemplate, id: Date.now(), rolledNumber: result, categoryStr: category };
      setRevealedEvent(newEvent);
      setUpcomingEvents(prev => [newEvent, ...prev]);
      
      setIsRolling(false);
    }, 1500);
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-light tracking-wide text-slate-100 flex items-center">
            <Dices className="mr-3 text-amber-500" size={28} />
            命运事件
          </h2>
          <p className="text-slate-400 mt-2 text-sm tracking-wider">废土由混乱的因果编织。进行预测，决定据点接下来的运势。</p>
        </div>
        <div className="flex items-center bg-black/40 px-4 py-2 rounded-lg border border-white/5">
          <Shield className="text-emerald-500 mr-2" size={20} />
          <div>
            <div className="text-xs text-slate-500">据点安全值</div>
            <div className="text-lg font-mono text-emerald-400 leading-none mt-1">{safety} <span className="text-sm opacity-50 font-sans ml-1 text-slate-400">正在干涉运势</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 掷骰区 */}
        <div className="glass-panel p-8 rounded-xl border-amber-900/30 shadow-[0_0_40px_rgba(217,119,6,0.05)] relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
          
          <h3 className="text-xl text-slate-200 mb-6 flex items-center font-medium">
             <Sparkles size={18} className="text-amber-500 mr-2" />
             观星与预测
          </h3>
          
          {/* 概率分布展示 */}
          <div className="mb-6 bg-black/40 rounded p-4 border border-white/5 text-xs grid grid-cols-2 gap-x-8 gap-y-2">
            <div className="col-span-2 text-amber-500/80 mb-2 font-mono flex items-center border-b border-white/5 pb-2">
              <Percent size={14} className="mr-1" /> 当前事件概率池
            </div>
            <div className="flex justify-between"><span className="text-emerald-400">微小增益</span> <span className="font-mono text-emerald-300">{probabilities.good_minor}%</span></div>
            <div className="flex justify-between"><span className="text-orange-400">轻微危机</span> <span className="font-mono text-orange-300">{probabilities.bad_minor}%</span></div>

            <div className="flex justify-between"><span className="text-emerald-500">可观收获</span> <span className="font-mono text-emerald-400">{probabilities.good_moderate}%</span></div>
            <div className="flex justify-between"><span className="text-red-400">中度威胁</span> <span className="font-mono text-red-300">{probabilities.bad_moderate}%</span></div>

            <div className="flex justify-between"><span className="text-emerald-600">绝佳机遇</span> <span className="font-mono text-emerald-500">{probabilities.good_severe}%</span></div>
            <div className="flex justify-between"><span className="text-red-500 font-bold">致命灾难</span> <span className="font-mono text-red-500">{probabilities.bad_severe}%</span></div>
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
                  animate={{ scale: 1, opacity: 1, type: "spring" }}
                  className="flex flex-col items-center w-full px-6"
                >
                  <div className="w-full bg-white/5 border border-white/10 p-4 rounded text-left relative overflow-hidden">
                     <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                        revealedEvent.type === 'urgent' ? 'bg-red-500' : 
                        revealedEvent.type === 'bad' ? 'bg-orange-500' : 
                        revealedEvent.type === 'good' ? 'bg-emerald-500' : 'bg-blue-500'
                      }`} />
                     <div className="flex justify-between items-start pl-2">
                        <div>
                          <div className="text-xs text-amber-500/80 mb-1 font-mono tracking-widest">判定类型: {CategoryNameMap[revealedEvent.categoryStr]}</div>
                          <div className="text-lg text-slate-200">{revealedEvent.title}</div>
                        </div>
                        <div className="text-amber-400 font-mono text-sm border border-amber-500/30 bg-amber-950/40 px-2 py-1 rounded flex items-center shrink-0 ml-2">
                          <Clock size={14} className="mr-1" /> {revealedEvent.days} 天后
                        </div>
                     </div>
                     <p className="text-sm text-slate-400 mt-2 pl-2">
                       {revealedEvent.desc}
                     </p>
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
              className={`w-full py-4 rounded text-lg tracking-widest font-medium transition-all ${
                isRolling 
                  ? 'bg-amber-900/50 text-amber-900 cursor-not-allowed' 
                  : 'bg-amber-600 text-white hover:bg-amber-500 shadow-[0_0_20px_rgba(217,119,6,0.3)]'
              }`}
            >
              {isRolling ? '连接因果链...' : '预测事件'}
            </button>
          </div>
        </div>

        {/* 待命/已知事件日志 */}
        <div className="glass-panel p-8 rounded-xl h-[600px] flex flex-col">
          <h3 className="text-xl text-slate-200 mb-6 flex items-center font-medium">
             <Clock size={18} className="text-amber-500 mr-2" />
             既定未来 (Upcoming)
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-12 text-slate-500 border border-white/5 border-dashed rounded h-full flex flex-col items-center justify-center">
                <Clock size={32} className="mb-4 opacity-20" />
                观测日志一片空白。<br/>请掷骰索取未来的碎片。
              </div>
            ) : (
              upcomingEvents.map((ev, index) => (
                <div key={ev.id} className="p-4 bg-black/40 border border-white/5 rounded-lg relative overflow-hidden group shrink-0">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    ev.type === 'urgent' ? 'bg-red-500' : 
                    ev.type === 'bad' ? 'bg-orange-500' : 
                    ev.type === 'good' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex justify-between items-start pl-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-slate-200">{ev.title}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed pr-4 line-clamp-2">
                        {ev.desc}
                      </p>
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

