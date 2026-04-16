/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChevronLeft, ChevronRight, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { FinalSummary } from './components/FinalSummary';
import { CharacterData, INITIAL_CHARACTER } from './types';

// Steps definition
const STEPS = [{ id: 'summary', title: '完成' }];

const TUTORIAL_TOPICS = [
  {
    id: 'history',
    title: '故事历史',
    subTopics: [
      {
        id: 'ancient',
        title: '远古时期古人',
        content:
          '远古时期古人（几千年前）\n第一帝国：一个强大而且技术先进的文明，有自动化工厂、卫星、基因工程、巨型机器人和太空电梯技术。不知道他们存在了多久，他们的敌人是什么，他们的势力范围有多远，甚至他们是否是 Kenshi 世界的本土生物都不清楚。与现代相比，第一帝国的科技发展已经到了神级的水平。研究表明在第一帝国时期存在着两个文明，第一个文明发展极为先进也更成熟，分布较为集中。另一个文明主要在洪泛地的北部（也许是现今的食人族平原），科技比前一个时代落后一点。\n\n巨兽之战：在某些时候，第一帝国和一个未知的敌人爆发了一场战争（也许就是上文的另一个文明），擎天的巨兽参与了战争。战争造成了巨大的破坏，古人们开始担心使用它们的后果。\n服从之地：由于他们害怕巨兽，古人们决定把他们处理掉。利用机器的绝对忠诚，古人命令巨兽们进入一个巨大的坑，然后用滚烫的金属杀死了他们的仆人。\n混沌时代：这个时期发生了许多的灾难，从危险的天体活动，到自然灾害，到瘟疫，再到骨人叛乱。目前还不清楚究竟发生了什么，但它使古人的伟大帝国轰然倒塌，人类濒临灭绝。《牺牲之书》记载道“伟大之父”奇特林“为心爱的孩子牺牲了自己。为了给他们一个新的生活机会，他清理了这个星球的疾病。”长者声称，名为“伟大的斯托伯”的骨人烈士是“人类瘟疫的灭绝者”，并且由于他在“人类战争”中的牺牲，帮助“将土地重置为原来的纯洁”。（存疑，因为玩家骨人角色与长者对话时还说“这只是一个谎言”。）',
      },
      {
        id: 'second_empire',
        title: '第二帝国（3000多年前）',
        content:
          '第二帝国成立：在混沌时代之后数百或数千年，为了在人类的眼中为他们过去的行为赎罪，卡特龙和他的追随者们建立了一个帝国并研究古代帝国的遗迹，尝试重建以前的科技，重建骨人和人类和平共处的局面。卡特龙的手下有蒋将军、帽子-12 将军、犀牛机器人、农业之首，这五人也许就是第二帝国的中流砥柱。\n食人族自相残杀：在某个无法确定的时间因为无法确定的原因，居住在西北的人类有了易子相食的行为，开始尝试食用新鲜人肉。大批人类开始自相残杀并相互食用。卡特龙帝国花费了大批的资源来对抗这些食人族。后来还产生了一个广为人知的军事团体“液压骑士”。食人族的传说里描绘过一个“不可食之人”的骨人战士。这个人有极大的可能就是液压骑士之一，液压骑士的领袖就是蒋将军。\n第二帝国崩溃之始：虽然建立的目的很好，但为了保持表面的和平，帝国变得越来越残暴。不能判定道德标准的犀牛机器人将儿童关进监狱。帽子-12 将军打击宗教信仰，蒋将军为了清除海盗和食人族大批屠杀人类，甚至是自己人，大大加剧了民众之间的紧张关系。虽然科学和考古学蓬勃发展，但仍是表面现象。意外发生了，方格地发生爆炸，爆炸造就了环形山。\n\n第二帝国的沦陷，圣国的建立：虽然这个时期的细节很少（而且大多存疑），但正是在这个时候，一位伟大的人类领袖站了出来，聚集了他的追随者，发动了叛乱。传说称他为菲尼克斯，菲尼克斯是奥克兰最强的战士，是永恒圣火的持有者。第二帝国不能平定叛乱，开始分崩离析。叛军驱逐了卡特龙和他的追随者，新建立了一个帝国，这个帝国将成为历史上最悠久的帝国之一。\n黑色沙漠城的建立：骨人幸存者受到了奥克兰人的严重迫害，被迫为犯下的反人类罪付出代价。许多骨人联合起来，撤退到世界上最危险的土地之一，在那里，没有人追捕他们，他们隐藏多年，与世界完全隔离，反思着是什么导致了他们现在的处境，直到现在。',
      },
      {
        id: 'mid_history',
        title: '中期（100-3000年前）',
        content:
          '蜂巢族的出现：目前尚不清楚蜂巢族是何时出现或如何出现的，但很明显他们在卡特龙帝国时期并不存在，至少不像现在蜂巢族的外貌。无论它们是从人类变异而来，还是仅仅来自大洋彼岸的另一片土地，它们都出现了，并从此成为土地的居民。后面他们内部分裂了许多部族，疯狂斗争。\n沙克族的出现：虽然在卡特龙帝国期间可能存在沙克族，甚至追溯到远古时代都可能存在，但他们以前和现在的样子大有区别。他们以前更像是正常人类，还没有现如今的角。那时的沙克族被称为执法者。不知道他们在帝国扮演什么角色。被赋予这个称号，他们可能是军人阶级，保护主人也许就是他们的任务。如果他们在菲尼克斯反抗期间参与了镇压的话，那这可以解释为什么奥克兰人认为他们是“黑暗的仆人”。然而，真相已经随着时间的流逝而消失了。\n克拉尔之死：从人们记事开始，沙克就是生活在荒野中的简单部落，经常分裂和交战。有一段时间，一个名叫克拉尔的伟大武士把部落统一成一个强大的王国，教给他的追随者一个荣誉和力量的准则，并带领他们走上征服的征程。然而最终，他在与敌军的战斗中被杀，传说敌军的人数超过他百倍。他死后，追随者们对他的崇拜达到了近乎神一般的程度，他们只想在一场像他这样的伟大战斗中死去。因此，从那时起，他们对待邻居的方式，就一直是战争和掠夺。',
      },
      {
        id: 'modern',
        title: '近代史（0-100年）',
        content:
          '菲尼克斯六十二世的诞生：作为圣国的传统，第 62 任菲尼克斯在出生后不久就被从他的亲生父母身边带走，由大祭司单独抚养长大。在这里，他被灌输了奥克兰宗教的理念，并教授他统治帝国所需的所有技能。据说第 62 代菲尼克斯是神圣国家历史上最残忍的菲尼克斯，在 16 岁时审判自己的家人，并判处他们在圣火中净化。\n红色叛乱：几十年前，南方平原遭受了一场严重的干旱，导致了一场严重的饥荒，几乎使联合城所有人集体屈服。由于饥荒，南方城市被迫依靠商人行会给他们带来生存所需的物资，不幸的是，强盗和沙克袭击者封锁了路线，并抢走了这些物资。在贵族们的互相博弈中，他们无动于衷，下层阶级被迫挨饿而发动叛乱。由此引发的战斗夺去了许多人的生命，包括许多贵族，甚至先皇，安西皇帝本人也死亡，但叛军最终没能成功，存活下来的人被奴役。贵族圈子里选出了一位新皇帝——天狗皇帝，一个以缺乏常识而闻名的残忍而冲动的人。\n巴斯特城的毁灭：巴斯特曾经是一个繁荣富饶的地区，到处都是可供交易的农田和城镇。然而，当圣国发动攻击时，一切都改变了。圣国的军队入侵了联合城的巴斯特城，“仅在一天之内”就将其摧毁，活活烧死了那里的贵族，并将年轻人抓走送往重生镇。从那以后，这片土地就成了一个战争地带。\n卢金的复仇：卢金和他的家人在很小的时候就被卖为奴隶，在那里他们因在矿场工作而遭受殴打，常常饥饿疲惫。最终，他的父亲屈服于可怕的环境，要杀死卢金和他的母亲。他的母亲设计了一个逃脱计划来救她的儿子，最终以牺牲自己的生命为代价，她成功地让卢金逃了出去。14 岁时，饥寒交迫的他独自一人在沙漠中，被一群忍者发现并收留，忍者训练他潜行和暗杀的艺术。7 年后，他回到家乡寻仇，用他的技能追踪和暗杀一个又一个贵族。最终卢金被逮捕，并作为罪犯在街上游行，然后被送往天狗的地牢，在那里他遭受了许多酷刑，包括被迫写一本书向天狗皇帝致敬。\n沼泽地的纷争：在大格琳成为沼泽地的老大以前，沼泽地最大的统治者是大哈希和他的跟踪者帮。然而大格琳暗中挑拨黑色转换者和跟踪者帮的关系，促使两个帮派的矛盾越来越深。直到大格琳的猎犬帮与黑色转换者联手密谋埋伏了大哈希，使得跟踪者帮被一举击溃，大格琳终于夺取了沼泽地老大的位置，其他各帮派都听命于她。\n推翻沙格尔国王：沙格尔是上任沙克国王。像大多数沙克族一样，他把战斗视为荣誉，战死是最高的荣誉。在他的统治下，沙克族不断与圣国和联合城的战斗，大量沙克族死亡，沙克王国正在崩溃。沙格尔王提出了近乎自杀的最后方案，不管剩下有什么战士。对此，战士巴彦大声疾呼抗议。沙格尔怒不可遏，但是艾萨塔，石魔出来喊道：“这个人说的是实话。你想要巴彦闭嘴，就从我的尸体上跨过去”。刀光剑影后，石魔赢得胜利，那天标志着石魔统治的开始，巴彦在她身边辅助她。她把她的战士们从前线拉出来，与联合城和平相处，并开放边境与其他种族进行贸易。虽然她的一些战士提出了抗议，但她决心确保她的人民生存到未来，即使这意味着摧毁他们一些长期持有的理想和传统。',
      },
      {
        id: 'end_poem',
        title: '终末之诗',
        content:
          '圣国改革：出现了一位锻造大师，集武器锻造和盔甲锻造于一身的天才，他不仅加强了圣国盔甲，更是提高了圣国的武器水平。由于人们富足，奥克兰地区建起了一做新城——瑞斯特，并且周边的农村也得到了发展。为了加强政教合一，圣国祭司建立了朝圣城镇——恩勒门特，用来弘扬和培养奥克兰的接班人。\n联合城改革：不甘示弱建立了两座堡垒，为了补给这两座堡垒而建立起来的城镇——珍珠镇靠着独特的地理优势一跃成为了仅次于赫夫特的联合城城镇。为了加强补给，联合城也引入新军阀，其中最大的就是汉城。联合城的实力进一步扩大，工艺技术也得到了提高，精锐士兵的盔甲也变成了黑金武士甲。\n沙克王国改革：同属三大国的沙克王国也不甘落后，发展出了属于自己的牧场经济，并用斯坦沙漠中特有的青铜矿锻造出了精锐穿的青铜甲。石魔也戴上了沙克王国祖传的沙克王冠，并成为了沙克皇族。狂战士因为疯狂的战斗吸引了大批的沙克族加入，成为了数一数二的土匪势力，并迁居到了狂战士之国区域，飞牛率领的克拉尔之选也展露出了獠牙。\n斯威士国创立：在夹缝中生存的圣国逃犯越聚越多，逐渐占领了枢纽城等周边小哨站，一部分成立了女拳，越过沼泽和南方湿地到了钩子海岸建立起了斯威士教国，成为了女性为尊的盗版圣国。\n雾岛进化：雾岛深处也发生了异变，雾人因为缺少女王而导致退化，但五十年过去，有一个蜂巢王子转化为了雾人女王，所有雾人都获得了进化，并且智力也得到了提高。在服从地区的雾人因为受到死去的巨型骨人干扰，逐渐机械化，最终进化出了薄雾之母，一个新型种族，并且更加残暴，蒙格勒也变得更加不安全。\n黑暗蜂巢诞生：曾经四大古老蜂巢（死寂、西、南、黑暗）之一的黑暗蜂巢也逐渐展现在世人面前，可惜势力已经进入到了暮年，导致很多黑暗蜂巢叛离了黑暗女王，成立了自己的土匪势力黑暗掠夺者。死寂蜂巢流亡者进化为异种蜂巢，成立陨落蜂巢族，当年的事情皆在这个势力当中留存。\n食人族分化：食人族在时间的流逝中分裂为各个部落，一方是大巫部落，另一方是肉主部落，互为死敌。\n沙丘叛军复仇：曾经在红色叛乱中失去贵族身份的贵族终于发展出了自己的势力沙丘叛军，并开始对联合城进行复仇。\n索黑教成立：初衷就是自由民主，去解放奴隶，消灭贪嗔痴，感化南部蜂巢，同时历练己身，以武会友。\n海盗回归：第二帝国时期被击溃的海盗遗迹被人发现，海盗王和绿胡子共同开发遗迹，导致海盗势力突飞猛进。绿胡子率领的草之海盗因为不愿臣服于海盗王，接在禁岛建立基地，海盗王则是在绿色海滩附近成立了最大的海盗城镇。\n沼泽壮大：沼泽势力也开始壮大，因为沼泽的无秩序，导致很多逃犯跑到沼泽地落草为寇并和赤色军刀团与一个神秘高手领袖——彩虹组成了四色刀客团。同时沼泽地中的猎犬建立了大麻基地，黑色转换者建立了金库，双刃团建立了一个城镇，格雷剥皮帮建立了一个走私黑市，曾经被消灭的追踪者家族也死灰复燃，沼泽居民为了求生，跟随堕落贵族建立了根源镇。',
      },
    ],
  },
  {
    id: 'background',
    title: '本卡特点',
    description:
      'KENSHI-终末之诗改编自【STEAM】游戏的 Kenshi 以及模组【终末之诗】内容，你将踏足一片广袤大陆。\n18 个剧本开局各不相同，各有各的传奇故事。\n30+ 派系林立：大派系内有腐朽与叛乱，外有强敌伺机而动。你可以选择加入一方协助称霸大陆，也可自立门户，从无名之辈到名震大陆。30+ 区域风貌各异，地貌环境与新派系完全不同，确保不落同质化，让每一段冒险都新鲜。\n180+ 特殊角色让你遇到的每个人都鲜活真实，表面特质与世界书语料、性格设定相互呼应——是与他们战斗夺取装备，还是深入了解、共赴恋情或一统冒险，由你决定。\n目前已有 10+ 阵营任务可参与。\n\n独立的战斗系统让你无需担心 AI 计算失误；武器与护甲体系让每一种装备各司其职；特殊肢体创伤机制意味着一旦失去，或许就再也回不来了。',
  },
  {
    id: 'survival',
    title: '游玩注意',
    description:
      '【本卡为免费制作为爱发电】\n\n问：世界书条目好多，会不会爆 token\n答：作者自玩时候暂时未出现爆 token 情况，本卡强烈建议使用【额外模型解析】，作者使用【2.5pro】暂无出现变量无法更新情况，【3F】也可以试试。\n\n问：好多灰色条目，是不是忘开了\n答：大部分内容交给脚本处理，因此没开的世界书不要开。\n\n问：游玩时候，AI 会不会媚 users，导致战斗的天平总是导向玩家，失去乐趣\n答：并不会，战斗内容为独立前端，不交给 AI，所以不用担心。战斗教程可以点开【酒馆】的第二开局直接进行【预览】，查看状态栏、战斗栏、选项栏的区别。\n\n问：我一定要战斗吗？我不想打架，只想种田或者曹丕\n答：不用。生活也是 Kenshi 的一部分。我有时候玩累了就行造个家、跑个商。曹丕嘛，搞点外挂【世界书】；虽然有 NSFW 开局，但目前没有专门制作【后面会做】。游戏内特殊选项有暗杀和偷窃，可以体验一下【作者没有测试暗杀】。\n\n问：AI 的血量变量写了 180，可实际只要 150 或者更低\n答：如果是【最大血量】则不用担心，交给脚本计算你的属性值从而得到的【最大血量】；如果是【当前血量】可能是 AI 算错了，差得不大就先不管了吧嘻嘻。\n\n问：我怎么进入战斗栏界面？\n答：在【选项栏】有专门的选择，如果没有可以查看选项栏 AI 是不是写错了，因为进入战斗的前提必须是有 <options> 包裹且有【战斗判定】4 个字。\n\n注意事项：\n1. 作者数值用脚填的，后期会修。\n2. 半手工制作，人物条目已经大幅度修改，后期会继续杀残存八股（已经杀了 3 天了），城镇和区域栏目也会查杀，避免造成八股大军。',
  },
  {
    id: 'combat',
    title: '鸣谢',
    description:
      '本卡【战斗栏】借鉴学习由【vin】佬的【性斗学院重置板】，已得到作者【允许】学习。我操，神！！！\n本卡【前端】学习于【𝗣𝗢𝗔𝗥𝗜𝗘𝗦】老师的【史上最完整的写卡教程|不可能还有人看不懂！】，我操，神！！！\n\n本卡【MVU】用于【三明月】老师的【【明月秋青】在酒馆使用IDE的方式写卡吧！】，我操，神！！！',
  },
];

export default function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [characterData, setCharacterData] = useState<CharacterData>(INITIAL_CHARACTER);
  const [isStarted, setIsStarted] = useState(false);
  const [isTutorial, setIsTutorial] = useState(false);
  const [tutorialTopicId, setTutorialTopicId] = useState(TUTORIAL_TOPICS[0]?.id ?? '');
  const [tutorialSubTopicId, setTutorialSubTopicId] = useState(TUTORIAL_TOPICS[0]?.subTopics?.[0]?.id ?? '');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      window.dispatchEvent(new Event('resize'));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldOpenTutorial = params.get('tutorial') === '1';
    if (shouldOpenTutorial) {
      setIsStarted(true);
      setIsTutorial(true);
      setTutorialTopicId(TUTORIAL_TOPICS[0]?.id ?? '');
      setTutorialSubTopicId(TUTORIAL_TOPICS[0]?.subTopics?.[0]?.id ?? '');
    }
  }, []);

  useEffect(() => {
    const triggerResize = () => window.dispatchEvent(new Event('resize'));
    requestAnimationFrame(triggerResize);
    setTimeout(triggerResize, 50);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      await document.documentElement.requestFullscreen();
    } catch {
      // ignore fullscreen errors from browser policy
    }
  };

  const updateData = (updates: Partial<CharacterData>) => {
    setCharacterData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  // Start Screen
  if (!isStarted) {
    return (
      <div className="relative w-full h-full min-h-full overflow-hidden bg-black flex items-center justify-center">
        <button
          onClick={toggleFullscreen}
          className="absolute right-4 top-4 z-30 inline-flex items-center gap-2 rounded border border-[#C2B280]/60 bg-black/40 px-3 py-1.5 text-xs text-[#C2B280] backdrop-blur-sm transition-colors hover:bg-[#C2B280]/15"
          title={isFullscreen ? '退出全屏' : '全屏显示'}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          <span>{isFullscreen ? '退出全屏' : '全屏显示'}</span>
        </button>

        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-[url('https://picsum.photos/seed/kenshi_desert/1920/1080?grayscale')] bg-cover bg-center opacity-40 scale-105 animate-pulse-slow"
          style={{ animationDuration: '20s' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="relative z-10 text-center flex flex-col items-center"
        >
          <h1 className="text-7xl md:text-9xl font-serif text-[#C2B280] tracking-widest mb-4 drop-shadow-lg">KENSHI</h1>
          <p className="text-xl md:text-2xl text-white/60 font-serif tracking-[0.35em] mb-12">终末之诗</p>

          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(194, 178, 128, 0.08)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setIsStarted(true);
              setIsTutorial(true);
              setTutorialTopicId(TUTORIAL_TOPICS[0]?.id ?? '');
              setTutorialSubTopicId(TUTORIAL_TOPICS[0]?.subTopics?.[0]?.id ?? '');
            }}
            className="mt-4 px-12 py-4 border border-[#C2B280]/70 text-[#C2B280] font-serif text-base md:text-lg tracking-[0.32em] rounded hover:shadow-[0_0_16px_rgba(194,178,128,0.25)] transition-all"
          >
            查看书籍
          </motion.button>

          <div className="mt-8 flex gap-4 text-xs text-white/30 font-mono">
            <span>VER 0.9.2</span>
            <span>•</span>
            <span>LLM INTERFACE READY</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main Interface
  return (
    <div className="relative w-full h-full min-h-full bg-[#0a0a0a] text-white flex flex-col">
      {/* Background Texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none" />

      {/* Header / Nav */}
      <header className="relative z-20 h-20 border-b border-white/10 bg-black/50 backdrop-blur-md flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-serif text-[#C2B280] tracking-widest">KENSHI</h1>
          <div className="h-6 w-px bg-white/20" />
          <span className="text-sm text-white/50 font-mono uppercase">Character Creation</span>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {isTutorial ? (
            <div className="flex items-center">
              <div className="flex items-center gap-2 px-3 py-1 rounded border border-[#C2B280]/30 text-[#C2B280] bg-[#C2B280]/10">
                <span className="text-xs font-mono">00</span>
                <span className="text-sm font-serif hidden md:block">查看书籍</span>
              </div>
            </div>
          ) : (
            STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`
                    flex items-center gap-2 px-3 py-1 rounded transition-all duration-500
                    ${
                      idx === currentStep
                        ? 'text-[#C2B280] bg-[#C2B280]/10 border border-[#C2B280]/30'
                        : idx < currentStep
                          ? 'text-white/40'
                          : 'text-white/20'
                    }
                  `}
                >
                  <span className="text-xs font-mono">0{idx + 1}</span>
                  <span className="text-sm font-serif hidden md:block">{step.title}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`w-8 h-px mx-1 ${idx < currentStep ? 'bg-[#C2B280]/50' : 'bg-white/10'}`} />
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1 rounded border border-[#C2B280]/40 px-2 py-1 text-xs text-[#C2B280] hover:bg-[#C2B280]/10 transition-colors"
            title={isFullscreen ? '退出全屏' : '全屏显示'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span className="hidden md:inline">{isFullscreen ? '退出全屏' : '全屏'}</span>
          </button>
          <button
            onClick={() => setCharacterData(INITIAL_CHARACTER)}
            className="p-2 text-white/40 hover:text-white transition-colors"
            title="Reset"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden p-8">
        <div className="max-w-[92rem] mx-auto h-full relative z-10">
          {isTutorial ? (
            <motion.div
              key="tutorial"
              initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.4, ease: 'circOut' }}
              className="min-h-full"
            >
              <div className="h-full flex flex-col lg:flex-row gap-10">
                <div className="w-full lg:w-1/4 flex flex-col gap-5 overflow-y-auto pr-3">
                  <h2 className="text-4xl font-serif text-white mb-4">查看书籍</h2>
                  {TUTORIAL_TOPICS.map((topic, index) => (
                    <motion.div
                      key={topic.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => {
                        setTutorialTopicId(topic.id);
                        setTutorialSubTopicId(topic.subTopics?.[0]?.id ?? '');
                      }}
                      className={`
                        p-4 rounded-lg border transition-all duration-300
                        ${
                          tutorialTopicId === topic.id
                            ? 'bg-white/10 border-[#C2B280] text-white'
                            : 'bg-black/40 border-white/10 text-white/60'
                        }
                        cursor-pointer hover:bg-white/5
                      `}
                    >
                      <h3 className="font-serif font-bold text-xl">{topic.title}</h3>
                    </motion.div>
                  ))}
                </div>

                <div className="flex-1 bg-black/40 border border-white/10 rounded-xl p-8 relative overflow-hidden">
                  {TUTORIAL_TOPICS.find(topic => topic.id === tutorialTopicId) ? (
                    <motion.div
                      key={tutorialTopicId}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="h-full flex flex-col"
                    >
                      <div className="absolute top-0 right-0 p-32 bg-[#C2B280] opacity-5 blur-[100px] rounded-full pointer-events-none" />

                      {(() => {
                        const selectedTopic = TUTORIAL_TOPICS.find(topic => topic.id === tutorialTopicId);
                        const selectedSubTopic = selectedTopic?.subTopics?.find(item => item.id === tutorialSubTopicId);
                        return (
                          <>
                            <h2 className="text-5xl font-serif text-[#C2B280] mb-5">{selectedTopic?.title}</h2>
                            {selectedTopic?.description && (
                              <p className="text-xl text-white/80 leading-relaxed mb-6 max-w-3xl whitespace-pre-line">
                                {selectedTopic.description}
                              </p>
                            )}
                            {selectedTopic?.subTopics?.length ? (
                              <div className="mt-auto">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                  {selectedTopic.subTopics.map(sub => (
                                    <button
                                      key={sub.id}
                                      onClick={() => setTutorialSubTopicId(sub.id)}
                                      className={`
                                        text-left px-4 py-3 rounded border transition-all
                                        ${
                                          tutorialSubTopicId === sub.id
                                            ? 'bg-[#C2B280] text-black border-[#C2B280] font-bold'
                                            : 'bg-black/60 border-white/20 text-white/70'
                                        }
                                        hover:border-white/50
                                      `}
                                    >
                                      <div className="font-semibold">{sub.title}</div>
                                    </button>
                                  ))}
                                </div>
                                {selectedSubTopic?.content && (
                                  <p className="text-xl text-white/85 leading-relaxed whitespace-pre-line max-w-4xl">
                                    {selectedSubTopic.content}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="mt-auto text-xs text-white/40 font-mono">阅读完成后可返回标题。</div>
                            )}
                          </>
                        );
                      })()}
                    </motion.div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-white/30 italic font-serif">
                      请从左侧选择一个书籍主题...
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
                transition={{ duration: 0.4, ease: 'circOut' }}
                className="min-h-full"
              >
                {currentStep === 0 && <FinalSummary data={characterData} />}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* Footer / Controls */}
      <footer className="relative z-20 h-20 border-t border-white/10 bg-black/80 backdrop-blur-md flex items-center justify-between px-8">
        <button
          onClick={() => {
            if (isTutorial) {
              setIsTutorial(false);
              setIsStarted(false);
              setCurrentStep(0);
              return;
            }
            if (currentStep === 0) {
              setIsStarted(false);
              setCurrentStep(0);
              return;
            }
            prevStep();
          }}
          className="flex items-center gap-2 px-6 py-3 rounded font-serif tracking-wider transition-all text-white/60 hover:text-white hover:bg-white/5"
        >
          <ChevronLeft size={18} />
          {isTutorial ? '回到标题处' : currentStep === 0 ? '回到标题处' : '返回'}
        </button>

        {isTutorial ? (
          <div />
        ) : currentStep < STEPS.length - 1 ? (
          <button
            onClick={nextStep}
            className="flex items-center gap-2 px-8 py-3 bg-[#C2B280] text-black font-bold font-serif tracking-wider rounded hover:bg-[#d4c490] hover:shadow-[0_0_15px_rgba(194,178,128,0.3)] transition-all active:scale-95"
          >
            下一步
            <ChevronRight size={18} />
          </button>
        ) : (
          <div /> // Spacer
        )}
      </footer>
    </div>
  );
}
