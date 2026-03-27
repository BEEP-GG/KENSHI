import { waitUntil } from 'async-wait-until';
import _ from 'lodash';
import { motion } from 'motion/react';
import React from 'react';
import { RACES, REGIONS, SCENARIOS, TRAITS } from '../data';
import { CharacterData, SquadMemberData } from '../types';

interface FinalSummaryProps {
  data: CharacterData;
}

export const FinalSummary: React.FC<FinalSummaryProps> = ({ data }) => {
  const [saved, setSaved] = React.useState(false);
  const [isStarting, setIsStarting] = React.useState(false);

  const storyBackgrounds: Record<string, string> = {
    wanderer: `在这片残酷废土上，你只是微不足道的一粒沙尘。
你没有显赫的背景，没有势力的庇护，兜里的开币也早已耗尽。
此刻，全部身家只剩身上那件沾满污渍的破布单衣，以及紧紧攥在手里那把生锈卷刃、连野狗皮都未必能砍透的破铁剑。

你或许曾有过去，但在这弱肉强食的世界里没人会在乎。
干瘪的肠胃正向你发出致命警告。
在这个毫无怜悯的大地上，你唯一的任务就是用尽一切手段活过今天。
握紧你那把可悲的锈剑，你的废土求生传说，将从无名之辈的挣扎中拉开帷幕。`,
    bast_stray: `这里曾是繁华的巴斯特城，如今联合帝国与神圣教国的绞肉机战争，将它彻底化作了焦土与废墟。
你是个无家可归、饿得眼冒金星的流浪汉，身边唯一的活物，是你一时心软救下的流浪小狗。
看着这只毫无用处的小废物，饿疯了的你脑海中不止一次闪过把它炖成肉汤的念头。

但这地狱般的处境绝不会因为一锅肉而改善：北边是流着口水的食人族，西边是见人就杀的圣国行刑队，南方的帝国武士更是随时准备剿灭难民。
听说大沙漠北方有叛军在招兵买马，带着你的狗，去那里赌一把命吧。`,
    slave: `灼热的烈日无情地炙烤着后背，沉重的石块几乎要压断脊梁。
在神圣教国的“重生镇”矿坑中，你没有名字，没有过去，只是无数麻木奴隶中的一个。
你每天被强迫进行非人的劳作，只为了给虚无缥缈的神明建造一座毫无意义的巨大雕像。

“快干活！异教徒！”圣骑士的怒吼伴随着皮鞭的破空声炸响，抽得你皮开肉绽。
但在每个疼痛难忍的黑夜，你总会仰望星空，梦想着南方那传说中没有枷锁的自由土地，回忆着风中传来的、关于北方叛乱忍者势力的起义故事。
也许，反抗的火种已在坑底点燃。`,
    holy_sword: `你曾是一名四处逃窜的落魄通缉犯，为躲避各大势力赏金猎人的无尽追杀，被迫逃入了危机四伏的法外之地——沼泽地。
在前往鲨鱼城的途中，你路过了一片血肉模糊的战场残骸。
在习惯性地“摸尸”清扫时，你意外从烂泥与断肢中拔出了一件无价之宝：一把传说之剑“十字”亲手打造的传奇铭刃。
或许是之前的拾荒者眼拙错过了它，但谁在乎呢？现在，它是你的绝世好剑了。

如今，你带着这把与你落魄身份极不相符的惹眼武器，踏入了混乱无序、充斥着劣质大麻与帮派分子的鲨鱼城。
酒馆里无数贪婪阴暗的目光正悄悄打量着你，而你传奇故事，便将从这片泥潭中拉开序幕。`,
    holy_commoner: `你生于神圣教国，这片被奥克兰神明赐福的希望之地。
只要每日虔诚祈祷并对祭司保持敬畏，你就能在拥有肥沃土壤与清净水源的乐土上，享受废土罕见的安宁。

然而，日复一日的枯燥农作与刻板教条让你感到窒息，你内心燃起了对高墙外世界的渴望。
即便牧师不断警告，教国边境之外是一片充满野蛮杀戮、异端横行，且到处游荡着巨大怪物的恐怖绝地，但这反而成了催化你冒险的毒药。
今天，你终于背起行囊，站在了某座教国城镇的边缘。
带着些许对神明的敬畏与对未知的好奇，你决定打破这安逸的牢笼，去亲眼见证真实的血肉世界。`,
    rock_bottom: `毫无疑问，你的人生已经彻底跌破了谷底。
你记不清遭遇了何种厄运，此刻的你正孤身一人，饥肠辘辘地瘫倒在广袤无垠、烈日炎炎的大沙漠荒野之中。
你浑身上下一丝不挂，没有半个开币与防身武器。
更让人绝望的是，断肢处钻心的剧痛正残酷地提醒你——你刚刚永远地失去了一条手臂。

头顶是毒辣的太阳，不远处的沙丘后，随时可能窜出将人撕碎的剪嘴鸥，或是准备用镣铐将你套上颈环的游荡奴隶主。
这是一场没有任何缓冲的残忍开局，在这片埋骨无数的黄沙中，祝你好运，残缺的求生者，死神已在向你招手了。`,
    merchant: `在这个人命如草芥、强盗遍地走的废土上，多数人只求活过明天，而你却有着惊人的野心。
你坚信“开币”才是这片大地上唯一绝对的权力与真理。

此刻，你牵着一头背负行囊、偶尔打着响鼻的温顺驮兽，怀揣着辛苦攒下的第一桶金，站在大沙漠联合城某座城镇的熙攘市集边缘。
你深知在此经商无异于刀口舔血：游荡的沙漠强盗、贪得无厌的贵族、随时准备索贿的守卫，都对你的货物虎视眈眈。
但风险与暴利并存，你发誓要从倒卖廉价物资开始，在这可悲的世界中，建立起一个足以操纵势力的庞大贸易帝国。
你的商队传奇，就此启程。`,
    officer_son: `你曾是令人羡慕的军官子弟，父亲是联合帝国军队中一位功勋卓著、备受尊崇的长官。
然而命运的重击不期而至——他在一次残酷的军事行动中不幸阵亡，你原本安稳的世界瞬间崩塌。

更糟的是，一场突如其来的大火烧毁了你仅存的微薄积蓄，彻底断绝了退路。
如今，你站在大沙漠联合城繁华却冷漠的街道上，腹中饥饿难耐，身无分文。
你仅存的财产只剩单薄的衬衫，以及紧握手中、父亲生前最信赖的那把锋利佩刀。
好在，父亲的荣誉为你留下了一丝底气——帝国依然将你视为盟友。
拔出遗刃，你的家族复兴之路将从街角拉开帷幕。`,
    male_slave: `你曾是一名风光无限的科技猎手，在废土的古遗迹间自由穿梭。
但盲目的自信让你在一次探险中误入了“斯威士国”——那个绝对女权主义的严苛帝国。
仅仅因为几句对女性不敬的粗心之言，你被剥夺了一切尊严与武力，戴上了屈辱的项圈。

如今，在这座女性主导的堡垒中，你的地位甚至不如一只驮兽，只是一条必须摇尾乞怜的“公狗”。
昔日的骄傲早被皮鞭抽得粉碎，主人鞋子的清脆声响正向你逼近，“要听话哦~”的戏谑低语在耳边萦绕。
是要在摇尾中度过残生，还是隐忍蛰伏寻找机会咬断她们的喉咙？`,
    cannibal_hunter: `“我真后悔踏进这片该死的食人族领地，这绝对是我这辈子最愚蠢的想法。”
你躲在阴暗的血污角落里，浑身颤抖地听着外面令人毛骨悚然的咀嚼声与狂热的战歌。
曾经，你带领着一支雄心勃勃的猎人小队，满脑子都是斩下食人族大统领的头颅去换取天价赏金。
老罗本曾拼死警告过你，但被贪婪蒙蔽双眼的你执意不听。

现在代价来了——你的队员们已经变成了外面火堆上的烤肉，而你正困在食人族首都的心脏地带。
别发出任何声音，别被那些饥饿的野蛮人发现，用尽一切手段逃出这个人间的血肉屠宰场吧。`,
    dark_daughter: `你背负着这片大陆上最妖冶也最绝望的诅咒。作为被圣国视为异端的“黑暗一族”，你们天生对欲望有着异于常人的渴求，连体液都是致命的催情剂。这让你们成为了圣骑士眼中必须被净化的“秽物”。
为了躲避血腥屠杀，幸存的族人被迫逃入铁之谷，蜷缩在污秽的“娜尔可守望”中苟延残喘，终日不见天日。
但你的降生打破了死寂——传说中，你拥有拯救全族的力量。
擦干身上的污泥，握紧复仇的利刃吧，是时候杀出重围，夺回远胜此地百倍的荣光故乡了。`,
    cannibal_unifier: `“呜哇！呜哇哇！”狂野的怒吼在黑暗之指的荒野中回荡。你并非人类眼中的文明人，而是光荣的“肉主部落”一员。
南方来的那些虚伪的“食人族猎手”突袭了你们的营地，残忍地屠杀了你的家人。
在这片贫瘠的大地上，你们不过是为了填饱肚子活下去而已，吃什么肉又有什么错？！
复仇的火焰在你野蛮的血液中疯狂燃烧。拿起你的砍刀与骨棒，在阴影中伏击那些自诩正义的猎人吧。
把他们剥皮拆骨，将他们的头颅高高悬挂在你的部族旗帜上，让这片大陆上的所有人都只能在你的名号前颤抖！`,
    pirate_heir: `大陆上一直流传着海盗王那肆意妄为、劫掠如风的传奇故事，这让不甘平庸的你热血沸腾。
为了追寻这片法外之地的极致浪漫，你长途跋涉，终于来到了传说中的“托尔图加”——一座围绕着巨大搁浅海盗船而建的混乱海盗镇。
空气中弥漫着朗姆酒、汗臭的刺鼻气味。你站在这艘如钢铁巨兽般的废弃大船阴影下，心中暗暗发誓：你绝不在这残酷的废土上默默无闻。
无论是作为心腹去协助那位高高在上的海盗王，还是在某个月黑风高之夜拔出刀子夺取他的名号，你都要让自己的威名在大陆上名垂千古。`,
    brotherhood_prisoner: `“你是愿意当个一无所有的无名之辈，一辈子被那些脑满肠肥的贵族踩在脚下，最后像条长满寄生虫的野狗一样烂在路边？”
“还是愿意跟我一样拿起刀，去抢去杀！就算活不到三十岁，也要让所有贵族听到你的名字就吓得尿裤子！！！”
鲜血掠夺者的首领瓦拉姆站在高台上，声嘶力竭的狂热演讲在营地内回荡。
作为刚被裹挟入伙的新兵，你的血液在酒精与煽动中沸腾。
在这个只有无尽剥削与屠杀的世界里，与其屈辱地苟活，不如痛痛快快地拉几个贵族垫背。
握紧发给你的那把破刀，准备迎接属于你的血腥洗礼吧！`,
    freedom_seekers: `在这片腐朽的大陆上，你受够了城市里贵族们无休止的压榨，厌倦了那些沉重的税金和令人窒息的残酷法则。
与其在别人的屋檐下苟延残喘，不如自己创造一个乌托邦。
凭借着过人的口才与共同的信念，你集结了四名志同道合的伙伴。
你们倾尽所有积蓄，换取了满满几大背包沉甸甸的建筑材料，毅然决然地踏入了荒野。
这片废土固然危险，强盗、野兽随时会要了你们的命，但为了那份真正属于自己的自由，这一切都值得。
放下第一根钢筋的地方，就是你们新帝国的起点。`,
    mongrel_wanderer: `浓烈的灰白色雾气如同活物般在四周蠕动，遮蔽了阳光，也隔绝了希望。
这里是臭名昭著的雾岛，而你正困在这片死地中心的孤城——蒙格勒。
凄厉的惨叫声时不时穿透浓雾刺入耳膜，那是被雾人活生生啃食的倒霉蛋发出的绝望哀嚎。
你不知道自己是如何迷失在这片恐怖地带的，但城外的每一寸土地都潜伏着那些盲目、贪婪的蓝色食人怪物。
留在城里只能慢慢发疯；而想要活下去，你就必须握紧武器，依靠残存的理智与钢铁般的意志，在雾人的无尽包围中杀出一条血路又或者在这个城中衰老腐烂致死。`,
    kral_choice: `沙克的血液在你体内沸腾，先祖克拉尔的英魂在向你呼唤！
传说你是战神克拉尔的直系后裔，沙克王国真正的、也是唯一的合法领袖。
然而如今，懦弱的女皇却坐在宝座上瑟瑟发抖，面对奥克兰人的步步紧逼，她唯一的计划竟是坐以待毙！
难道骄傲的沙克族要眼睁睁等着圣国发动毁灭性的入侵吗？绝不！
此刻，你蛰伏在一个隐蔽的废弃山洞中，擦拭着沾满血迹的巨剑。
沙克人不需要怯懦的和平，去击碎那些软弱者的角，团结你的同胞，复兴沙克帝国的无上荣光！`,
    fish_island_refugee: `刺鼻的鱼腥味与血腥气混合在湿润的海风中，你的鳞片上还沾染着同胞的鲜血。
作为一名异类蜥蜴人，你刚刚经历了一场噩梦般的浩劫——恐怖的鱼形人如同潮水般摧毁了你们南方的家园。
你拼死逃过大桥，终于瘫倒在这片名为“渔网”的难民聚集地。
回头望去，彼岸的故土已经沦为那些滑腻野兽的狂欢屠宰场。
你是该放下过去，拖着疲惫的身躯远远逃离这片是非之地苟且偷生？还是拿起生锈的鱼叉，集结剩下的残兵败将反杀回那个地狱？
抉择权，就在你的手中。`,
  };

  const scenario = SCENARIOS.find(s => s.id === data.scenario);
  const region = REGIONS.find(r => r.id === data.region);
  const race = RACES.find(r => r.id === data.race);
  const subrace = race?.subraces.find(s => s.id === data.subrace);

  const attributeLabels: Record<keyof CharacterData['attributes'], string> = {
    strength: '力量',
    dexterity: '敏捷',
    perception: '感知',
    constitution: '体质',
    will: '意志',
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
    const weaponItem = equipmentList.find(item => /刀|剑|棒|斧|弓|弩|锤|枪|矛/.test(item));
    const armorItem = equipmentList.find(item => /衣|甲|护|裤|靴|袍|盔|披风|披肩|衫/.test(item));

    const resolveArmorType = (item?: string) => {
      if (!item || item === '无') return '无甲';
      if (/重|板甲|重铠/.test(item)) return '重甲';
      if (/中|链甲|锁子/.test(item)) return '中甲';
      return '轻甲';
    };

    const resolveWeaponType = (item?: string) => {
      if (!item || item === '无') return '武术';
      if (/长柄|长枪|枪|矛|鱼矛/.test(item)) return '长柄刀类';
      if (/砍刀|弯刀/.test(item)) return '砍刀类';
      if (/军刀/.test(item)) return '军刀类';
      if (/野太刀|武士刀|太刀|佩刀|刀|剑/.test(item)) return '武士刀类';
      if (/棒|锤|锏/.test(item)) return '钝器类';
      if (/斧|大剑|巨骨|巨|重|大锤/.test(item)) return '大型武器类';
      return '武士刀类';
    };

    const armorType = resolveArmorType(armorItem);
    const armorDescription = armorType === '无甲' ? '未穿戴护甲' : `只穿戴${armorItem}`;
    const weaponName = weaponItem ?? '武术';
    const weaponType = resolveWeaponType(weaponItem);

    const mainWeapon =
      scenario?.id === 'holy_sword'
        ? {
            名字: '大剑',
            种类: '重武器类',
            品质: '十字',
            介绍: '一把传奇之剑',
            伤害骰: '1d30',
            伤害类型: '切割:0.2，钝伤:0.8',
            特效: {},
            价值: 99999,
          }
        : {
            名字: weaponName,
            种类: weaponType,
            品质: '普通',
            介绍: weaponItem ?? '',
            伤害骰: '1d4',
            伤害类型: '钝伤:1.0',
            特效: {},
            价值: 0,
          };

    return {
      主武器: mainWeapon,
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
        种类: armorType,
        '防护能力(DR)': 0,
        介绍: armorDescription,
        特性: {},
      },
      背包物品: equipmentList.filter(item => item !== weaponItem && item !== armorItem),
    };
  };

  const parseAttributeModifiers = (text: string) => {
    const modifiers = {
      strength: 0,
      dexterity: 0,
      perception: 0,
      constitution: 0,
      will: 0,
      intelligence: 0,
      charisma: 0,
    };
    const regex = /(力量|敏捷|感知|体质|意志|智力|魅力)\s*([+-]\s*\d+)/g;
    let match: RegExpExecArray | null = null;
    while ((match = regex.exec(text)) !== null) {
      const key = match[1];
      const value = Number(match[2].replace(/\s+/g, '')) || 0;
      if (key === '力量') modifiers.strength += value;
      if (key === '敏捷') modifiers.dexterity += value;
      if (key === '感知') modifiers.perception += value;
      if (key === '体质') modifiers.constitution += value;
      if (key === '意志') modifiers.will += value;
      if (key === '智力') modifiers.intelligence += value;
      if (key === '魅力') modifiers.charisma += value;
    }
    return modifiers;
  };

  const buildAttributesRecord = () => {
    const raceModifiers = parseAttributeModifiers(race?.description ?? '');
    const subraceModifiers = parseAttributeModifiers(subrace?.description ?? '');
    const finalStrength = data.attributes.strength + raceModifiers.strength + subraceModifiers.strength;
    const finalDexterity = data.attributes.dexterity + raceModifiers.dexterity + subraceModifiers.dexterity;
    const finalPerception = data.attributes.perception + raceModifiers.perception + subraceModifiers.perception;
    const finalConstitution = data.attributes.constitution + raceModifiers.constitution + subraceModifiers.constitution;
    const finalWill = data.attributes.will + raceModifiers.will + subraceModifiers.will;
    const finalIntelligence = data.attributes.intelligence + raceModifiers.intelligence + subraceModifiers.intelligence;
    const finalCharisma = data.attributes.charisma + raceModifiers.charisma + subraceModifiers.charisma;
    return {
      STR: { 基础: finalStrength, 加成: 0 },
      DEX: { 基础: finalDexterity, 加成: 0 },
      PER: { 基础: finalPerception, 加成: 0 },
      TGH: { 基础: finalConstitution, 加成: 0 },
      WIL: { 基础: finalWill, 加成: 0 },
      INT: { 基础: finalIntelligence, 加成: 0 },
      CHA: { 基础: finalCharisma, 加成: 0 },
    };
  };

  const buildSquadTraitsRecord = (member: SquadMemberData) => {
    const traits: Record<string, string> = {};
    member.traits.forEach((traitId: string) => {
      const trait = TRAITS.find(t => t.id === traitId);
      if (trait) {
        traits[trait.title] = trait.description;
      }
    });
    if (member.customTraits) {
      traits['自定义特质'] = member.customTraits;
    }
    return traits;
  };

  const buildSquadAttributesRecord = (member: SquadMemberData) => {
    const memberRace = RACES.find(r => r.id === member.race);
    const memberSubrace = memberRace?.subraces.find(s => s.id === member.subrace);
    const raceModifiers = parseAttributeModifiers(memberRace?.description ?? '');
    const subraceModifiers = parseAttributeModifiers(memberSubrace?.description ?? '');
    const finalStrength = member.attributes.strength + raceModifiers.strength + subraceModifiers.strength;
    const finalDexterity = member.attributes.dexterity + raceModifiers.dexterity + subraceModifiers.dexterity;
    const finalPerception = member.attributes.perception + raceModifiers.perception + subraceModifiers.perception;
    const finalConstitution =
      member.attributes.constitution + raceModifiers.constitution + subraceModifiers.constitution;
    const finalWill = member.attributes.will + raceModifiers.will + subraceModifiers.will;
    const finalIntelligence =
      member.attributes.intelligence + raceModifiers.intelligence + subraceModifiers.intelligence;
    const finalCharisma = member.attributes.charisma + raceModifiers.charisma + subraceModifiers.charisma;

    return {
      STR: { 基础: finalStrength, 加成: 0 },
      DEX: { 基础: finalDexterity, 加成: 0 },
      PER: { 基础: finalPerception, 加成: 0 },
      TGH: { 基础: finalConstitution, 加成: 0 },
      WIL: { 基础: finalWill, 加成: 0 },
      INT: { 基础: finalIntelligence, 加成: 0 },
      CHA: { 基础: finalCharisma, 加成: 0 },
    };
  };

  const updateMvuVariables = async (messageId: number | 'latest' = getCurrentMessageId()) => {
    await waitGlobalInitialized('Mvu');
    await waitUntil(() => _.has(getVariables({ type: 'message', message_id: messageId }), 'stat_data'));

    const mvuData = Mvu.getMvuData({ type: 'message', message_id: messageId });
    const equipment = buildEquipmentSummary();

    _.set(mvuData, 'stat_data.当前角色.id', data.name || '无名氏');
    _.set(
      mvuData,
      'stat_data.当前角色.性别',
      data.race === 'skeleton' ? '无性别' : data.gender === 'male' ? '男' : data.gender === 'female' ? '女' : '其他',
    );
    _.set(mvuData, 'stat_data.当前角色.年龄', data.age);
    _.set(mvuData, 'stat_data.当前角色.外貌', '');
    _.set(mvuData, 'stat_data.当前角色.体型', `${(data.appearance.height / 100).toFixed(2)}m`);
    _.set(mvuData, 'stat_data.当前角色.种族.名称', subrace?.title || race?.title || '人类');
    _.set(mvuData, 'stat_data.当前角色.属性', buildAttributesRecord());
    _.set(mvuData, 'stat_data.当前角色.特质', buildTraitsRecord());
    if (data.scenario === 'rock_bottom') {
      _.set(mvuData, 'stat_data.当前角色.创伤.左臂', { 等级: 4, 描述: '断肢' });
    }
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

    const hasCompanions = data.squadMembers.some(member => member.name || member.race || member.subrace);
    if (data.scenario === 'freedom_seekers' || hasCompanions) {
      const squadMembers: Record<string, any> = {};
      data.squadMembers.forEach((member, index) => {
        if (!member.name && !member.race && !member.subrace && data.scenario !== 'freedom_seekers') {
          return;
        }
        const memberRace = RACES.find(r => r.id === member.race);
        const memberSubrace = memberRace?.subraces.find(s => s.id === member.subrace);
        const squadEntry: Record<string, any> = {
          id: member.name || `队员${index + 1}`,
          性别:
            member.race === 'skeleton'
              ? '无性别'
              : member.gender === 'male'
                ? '男'
                : member.gender === 'female'
                  ? '女'
                  : '其他',
          年龄: member.age,
          外貌: '',
          体型: `${(member.appearance.height / 100).toFixed(2)}m`,
          种族: {
            名称: memberSubrace?.title || memberRace?.title || '人类',
          },
          属性: buildSquadAttributesRecord(member),
          特质: buildSquadTraitsRecord(member),
        };

        if (memberSubrace?.title) {
          _.set(squadEntry, '种族.亚种', memberSubrace.title);
        }

        squadMembers[member.name || `队员${index + 1}`] = squadEntry;
      });
      _.set(mvuData, 'stat_data.小队成员', squadMembers);
    } else {
      _.set(mvuData, 'stat_data.小队成员', {});
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

  const buildBaseSettingText = () => {
    const equipmentList = scenario?.equipment ?? [];
    const lines: string[] = [];
    const attributeLine = Object.entries(data.attributes)
      .map(([key, value]) => `${attributeLabels[key as keyof CharacterData['attributes']]}=${value}`)
      .join('，');
    lines.push('当前角色基础设定');
    lines.push('基础设定');
    lines.push(`角色名：${data.name || '无名氏'}`);
    lines.push(`性别：${data.gender === 'male' ? '男' : data.gender === 'female' ? '女' : '其他'}`);
    lines.push(`年龄：${data.age}`);
    lines.push(`种族：${subrace?.title || race?.title || '未选择'}`);
    lines.push(`开局剧本：${scenario?.title || '未选择'}`);
    lines.push(`出生地：${region?.title || data.region || '未知区域'}。城镇：${data.town || '野外'}`);
    lines.push(`七维属性：${attributeLine}`);
    lines.push(
      `外貌描述：${data.appearance.description || '无'}；身高 ${(data.appearance.height / 100).toFixed(2)}m；体态 ${
        data.appearance.bodyType || '无'
      }；眼睛 ${data.appearance.eyes || '无'}；发型 ${data.appearance.hairStyle || '无'}；发色 ${
        data.appearance.hairColor || '无'
      }`,
    );
    lines.push('根据上述角色设定以及开局剧本，创建故事开局。');
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
    const baseSettingText = buildBaseSettingText();
    try {
      await createChatMessages([{ role: 'user', message: baseSettingText }]);
      await triggerSlash('/trigger');
    } catch (error) {
      navigator.clipboard.writeText(baseSettingText);
      console.error('发送基础设定失败，已复制到剪贴板', error);
    }
    await updateMvuVariables('latest');
    setSaved(true);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center max-w-3xl mx-auto text-center px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-black/60 border border-[#C2B280] p-6 sm:p-10 rounded-2xl shadow-[0_0_50px_rgba(194,178,128,0.1)] w-full relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C2B280] to-transparent opacity-50" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C2B280] to-transparent opacity-50" />

        <h2 className="text-3xl sm:text-5xl font-serif text-[#C2B280] mb-2">角色已创建</h2>
        <p className="text-white/50 font-serif tracking-widest uppercase mb-8 sm:mb-10">准备进入废土</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 text-left mb-8 sm:mb-10">
          <div className="space-y-4">
            <div>
              <span className="text-xs uppercase text-white/40 tracking-wider">姓名</span>
              <div className="text-xl font-serif text-white">{data.name || '无名氏'}</div>
            </div>
            <div>
              <span className="text-xs uppercase text-white/40 tracking-wider">种族</span>
              <div className="text-lg text-white/80">{subrace?.title || race?.title}</div>
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
          className="group relative inline-flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-[#C2B280] text-black font-bold font-serif tracking-wider rounded transition-all hover:bg-[#d4c490] hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isStarting ? '启程中...' : saved ? '已启程' : '启程'}
        </button>

        <div className="mt-6 max-w-2xl text-center mx-auto">
          <div className="text-xs uppercase tracking-[0.3em] text-[#C2B280]/80">故事背景</div>
          <p className="mt-2 text-sm text-white/70 leading-relaxed whitespace-pre-line">
            {storyBackgrounds[data.scenario] || '故事背景待补充'}
          </p>
        </div>

        <p className="mt-4 text-xs text-white/30">
          “你并非天选之子。你并不强大。你并非宇宙的中心，也不特别。这个世界并不关心你的死活——除非你拼尽全力，亲手为自己搏得这一切。”
        </p>
      </motion.div>
    </div>
  );
};
