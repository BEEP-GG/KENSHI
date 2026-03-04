export const SCENARIOS = [
  {
    id: 'wanderer',
    title: '流浪者 (The Wanderer)',
    description: '你独自一人，身无分文，只有一把生锈的剑和背上的衣服。这是最纯粹的Kenshi体验。',
    difficulty: '普通',
    icon: 'Sword',
    equipment: ['生锈的铁棒', '破旧的裤子', '医疗包 (少量)'],
    money: 1000,
  },
  {
    id: 'holy_sword',
    title: '圣剑 (The Holy Sword)',
    description: '你偷走了传说中的圣剑。现在，整个帝国都在追捕你。你拥有强大的武器，但没有未来。',
    difficulty: '困难',
    icon: 'ShieldAlert',
    equipment: ['野太刀 (铭文)', '破旧的衣服', '通缉令 (20,000c)'],
    money: 100,
    allowedRegions: ['swamp'],
    hostileFactions: ['联合帝国', '神圣教国'],
  },
  {
    id: 'rock_bottom',
    title: '一无所有 (Rock Bottom)',
    description:
      '你在沙漠中醒来。你失去了一只手臂，饥肠辘辘，身无分文。活下去。特质：失去左手。初始属性修正：力量-10、敏捷-10、感知-10、体质-10、意志-10、智力-10、魅力-10。',
    difficulty: '极难',
    icon: 'Skull',
    equipment: ['无'],
    money: 0,
    allowedRegions: ['great_desert'],
  },
  {
    id: 'merchant',
    title: '商人 (The Merchant)',
    description: '你有一些积蓄和一头驮兽。你渴望在这个残酷的世界中建立一个贸易帝国。',
    difficulty: '简单',
    icon: 'Coins',
    equipment: ['商人的背包', '铁棒', '驮牛'],
    money: 4000,
  },
  {
    id: 'officer_son',
    title: '贵族之子（长官之子）',
    description:
      '你的父亲是联合帝国军队内一位受人尊敬的长官。他在行动中被杀了，在你寻找工作的微薄积蓄被烧之后，你发现自己身无分文且饥肠辘辘，除了你父亲可信赖的刀和你背上的衬衫之外别无他物。联合帝国邦仍然是你的盟友。',
    difficulty: '普通',
    icon: 'Crown',
    equipment: ['长官佩刀', '衬衫'],
    money: 0,
    allowedRegions: ['great_desert', 'heng'],
    hostileFactions: ['神圣教国'],
    alliedFactions: ['联合帝国'],
  },
  {
    id: 'slave',
    title: '奴隶',
    description:
      '你只是另一个奴隶，在神圣教国重生镇的坑中工作，以建造一个毫无意义的雕像，你梦想着传说中的南方自由土地，并听说了北方叛乱分子的故事。',
    difficulty: '困难',
    icon: 'Pickaxe',
    equipment: ['破布衫', '脚镣'],
    money: 0,
    allowedRegions: ['rebirth'],
    hostileFactions: ['神圣教国'],
  },
  {
    id: 'male_slave',
    title: '男奴',
    description:
      '你曾是一个风光的科技猎手，一次冒险中，误入了她们的帝国，说了对女性不忠的话，现在你只是一条狗，要听话哦~',
    difficulty: '困难',
    icon: 'VenetianMask',
    equipment: ['破布衫', '奴隶项圈'],
    money: 0,
    allowedRegions: ['south_wetlands'],
    hostileFactions: ['斯威士国'],
  },
  {
    id: 'cannibal_hunter',
    title: '食人族猎人',
    description: '“我真的很后悔来到了食人族的领地。这是个愚蠢的想法。”',
    difficulty: '极难',
    icon: 'Skull',
    equipment: ['砍刀', '急救包 (少量)'],
    money: 200,
    allowedRegions: ['cannibal_plains'],
    hostileFactions: ['食人族部落'],
  },
  {
    id: 'pirate_heir',
    title: '海盗之子',
    description: '协助海盗王，称霸这片大陆，绑定海盗之子。',
    difficulty: '困难',
    icon: 'Skull',
    equipment: ['弯刀', '破旧披风'],
    money: 300,
    allowedRegions: ['green_coast'],
  },
  {
    id: 'cannibal_unifier',
    title: '大肉食人族“呜哇呜哇!!(夺回家园!!)”',
    description: '你要统一食人族部落，夺回属于你们的家园与猎场。',
    difficulty: '极难',
    icon: 'Skull',
    equipment: ['巨骨战斧', '兽皮披肩', '干肉'],
    money: 0,
    allowedRegions: ['dark_finger'],
  },
  {
    id: 'brotherhood_prisoner',
    title: '为了兄弟会！！！消灭所有贵族！！',
    description: '听他们这样喊着，押送着我和其他几个平民。',
    difficulty: '困难',
    icon: 'Pickaxe',
    equipment: ['奴隶项圈'],
    money: 0,
    hostileFactions: ['鲜血掠夺者'],
  },
  {
    id: 'freedom_seekers',
    title: '追求自由者 (Freedom Seekers)',
    description: '你和几个朋友逃离了压迫。你们有一点物资，但没有战斗经验。',
    difficulty: '普通',
    icon: 'Users',
    equipment: ['铁棒 x3', '基础医疗包', '建筑材料'],
    money: 2000,
  },
];

export const REGIONS = [
  {
    id: 'border_zone',
    title: '边境之地',
    description: '神圣王国与沙克王国之间的缓冲地带。这里是流浪者、强盗和被流放者的家园。',
    towns: ['枢纽城', '斯昆镇'],
    danger: '中等',
  },
  {
    id: 'great_desert',
    title: '大沙漠',
    description: '联合城的中心地带。这里有巨大的财富，也有残酷的奴隶制。',
    towns: ['赫夫特城', '小巴泰镇', '白鼬镇', '巴克镇'],
    danger: '高',
  },
  {
    id: 'heng',
    title: '恒',
    description: '充满铜臭与野心的白色沙海。希望你带来了足够多的金钱。',
    towns: ['恒城', '汉城', '元城'],
    danger: '高',
  },
  {
    id: 'holy_nation',
    title: '神圣王国',
    description: '肥沃的绿地，由狂热的宗教统治。如果你是人类男性，这里是天堂；否则，这里是地狱。',
    towns: ['水泡山', '坏牙', '斯塔克'],
    danger: '极高 (对非人类)',
  },
  {
    id: 'swamp',
    title: '沼泽地',
    description: '无法无天的地带，充满了走私犯、帮派和致命的生物。',
    towns: ['鲨鱼城', '腐烂镇'],
    danger: '中等',
  },
  {
    id: 'cannibal_plains',
    title: '食人族平原',
    description: '狂乱野蛮之地，遍布饥饿的食人族。只有不停奔跑，才能免于被生吞活剥。',
    towns: ['死猫村之都'],
    danger: '极高',
  },
  {
    id: 'dark_finger',
    title: '黑暗之指',
    description: '这里主要栖息着作为土著的食人部落，是联合帝国北部的一大威胁区域。',
    towns: ['野外'],
    danger: '极高',
  },
  {
    id: 'green_coast',
    title: '绿色海岸',
    description: '危险而肥沃的土地。若想在此立足，你最好先向那群怪人或是巨蟹证明忠诚。',
    towns: ['托尔图加'],
    danger: '高',
  },
  {
    id: 'rebirth',
    title: '重生镇',
    description: '建立在岩石上的地狱。奴隶们通过无止境的劳作，试图洗刷那虚无缥缈的罪孽。',
    towns: ['重生镇'],
    danger: '极高',
  },
  {
    id: 'fog_islands',
    title: '雾岛',
    description: '浓雾笼罩的哀嚎之谷。我看不见它们，它们却能找到我。',
    towns: ['蒙格勒'],
    danger: '极高',
  },
  {
    id: 'south_wetlands',
    title: '南方湿地',
    description: '联合城与商会掌控的繁荣海滨。财富流动之余，女权主义的极端势力在此割据。',
    towns: ['漂泊终地', '斯威士之剑', '吉利之剑', '科隆斯城'],
    danger: '高',
  },
  {
    id: 'bonefields',
    title: '骸骨荒原',
    description: '遍布远古巨兽骸骨的荒原。成群的长颈鹿在此游荡，将闯入者吞入腹中。',
    towns: ['开顿城'],
    danger: '极高',
  },
];

export const TOWN_DESCRIPTIONS: Record<string, string> = {
  枢纽城: '一个因为战争被摧毁的城镇，正在等人重建。',
  斯昆镇: '坐落在一条狭窄的峡谷中的大型城镇。',
  赫夫特城: '联合城的繁荣首都。',
  小巴泰镇: '帝国大沙漠的中心地带。',
  白鼬镇: '大沙漠的贸易之城，商队必经之路。',
  巴克镇: '大沙漠的唯一沿海大城，通向帝国岛岛城的唯一港口。',
};

export const RACES = [
  {
    id: 'human',
    title: '人类',
    description: '适应性最强的种族，没有明显的短板，但也没有突出的优势。种族基础生命值：20。初始心智：20。',
    subraces: [
      {
        id: 'greenlander',
        title: '绿原之子',
        description:
          '主要来自农耕文明，学习能力强，是天生的科学家、工程师和战士。初始属性修正：智力+10。种族特质：快速学习（获取经验时额外+5）。',
      },
      {
        id: 'scorchlander',
        title: '焦土之子',
        description:
          '视自由高于一切，是极具创造力的商人和优秀的武器工匠。初始属性修正：敏捷+5、魅力-5。种族特性：沙漠之子（高温/干旱负面计算时体质+10）、经商头脑（交易检定+10）。',
      },
      {
        id: 'keter_descendant',
        title: '奇特林后裔',
        description:
          '传闻是奥克兰血脉的堕落后裔，活在贪婪和恐惧中，诉诸暴力。初始属性修正：力量+10、智力-10、意志-10。种族特质：奥克兰血脉（说服检定-15）。',
      },
    ],
  },
  {
    id: 'hive',
    title: '蜂巢族',
    description:
      '拥有棍状肢体和集体意识，通常更脆弱但行动迅速。种族基础生命值：15。初始心智：15。通用特性：敏捷+2。职业阶级说明（NPC分类或二次选择）：王子（智力+5、感知+5、力量-5）、工蜂（劳动/工程+10、力量-5、体质-5）、兵蜂（力量+10、体质+5、智力-10）。非玩家种族：雾人、薄雾雾人。',
    subraces: [
      {
        id: 'west_hive',
        title: '西部蜂巢',
        description:
          '善于经商的黄色皮肤蜂巢族，是废土上最友善的一群人。初始属性修正：魅力+10、敏捷+5、力量-10。技能加成：交易+15、说服+5。种族特性：商业头脑。',
      },
      {
        id: 'south_hive',
        title: '南部蜂巢',
        description:
          '极度排外且侵略性的血红色蜂巢族，拥有更强的军事力量。初始属性修正：力量+5、体质+5、魅力-15、智力-10。种族特性：战斗狂热（最终伤害+5）。',
      },
      {
        id: 'dark_hive',
        title: '黑暗蜂巢',
        description:
          '罕见的黑色皮肤蜂巢族，拥有更高智商与均衡实力。初始属性修正：智力+10、力量+5、敏捷+5、体质-5。种族特性：古老基因（可无惩罚使用所有武器）。',
      },
    ],
  },
  {
    id: 'shek',
    title: '沙克族',
    description: '崇尚力量与勇气的战士社会，拥有天生外骨骼。种族基础生命值：25。初始心智：30。',
    subraces: [
      {
        id: 'shek_warrior',
        title: '沙克战士',
        description:
          '标准沙克族，勇猛好斗。初始属性修正：力量+10、体质+10、敏捷-10、智力-10。种族特性：天生外骨骼（DR+5）、战斗饥渴（食物消耗×2）。',
      },
      {
        id: 'shek_royal',
        title: '沙克皇族',
        description:
          '沙克族上位种族，更健壮也更具头脑。初始属性修正：力量+15、体质+15、敏捷-5。种族特性：天生外骨骼（DR+8）、战斗饥渴（食物消耗×2）、皇族之傲（对沙克平民说服+20）。',
      },
    ],
  },
  {
    id: 'lizardfolk',
    title: '蜥蜴人',
    description:
      '强壮的爬行类战士，鳞片皮肤提供额外保护，是可怕的猎手。种族基础生命值：22。初始心智：35。初始属性修正：力量+10、敏捷+5、魅力-5。种族特性：鳞片皮肤（DR+3）、强力尾巴（运动检定+10）、捕食者（对动物伤害+2）。',
    subraces: [
      {
        id: 'lizardfolk_hunter',
        title: '蜥蜴人猎手',
        description: '典型蜥蜴人战斗者，兼具生存、追猎与近身爆发能力。',
      },
    ],
  },
  {
    id: 'cannibal',
    title: '食人族',
    description:
      '古老荒原的狩猎者，奉血与火为信条。种族基础生命值：15。初始心智：25。通用特质：食人族语言：能听到懂食人族部落之间的语言。',
    subraces: [
      {
        id: 'cannibal_brute',
        title: '食人族大只佬',
        description: '粗野巨躯的先头破阵者。初始属性修正：体质+20、智力-35、感知-15。',
      },
      {
        id: 'cannibal_warrior',
        title: '干瘦食人族',
        description: '体态干瘦却动作迅猛的前线屠戮者。初始属性修正：敏捷+15、智力-20、体质-10。',
      },
      {
        id: 'cannibal_priest',
        title: '食人族祭师',
        description: '掌管血仪与禁忌的部族智者。初始属性修正：智力+15、体质-15。',
      },
    ],
  },
  {
    id: 'skeleton',
    title: '骨人',
    description:
      '拥有数千年历史的神秘机械种族，无惧死亡，是天生的无畏战士。种族基础生命值：50。初始心智：0。通用特性：免疫饥饿/疾病/毒气/酸雨/天气、水下呼吸、机械之躯（需修理包或修理床恢复）、无情面容（魅力表情检定失败但免疫恐惧）。',
    subraces: [
      {
        id: 'skeleton_mki',
        title: 'MKI (圆头)',
        description: '初始属性修正：体质+5。',
      },
      {
        id: 'skeleton_mkii',
        title: 'MKII (摄像头)',
        description: '初始属性修正：感知+5。',
      },
      {
        id: 'skeleton_mkiii',
        title: 'MKIII (尖头)',
        description: '初始属性修正：力量+5。',
      },
    ],
  },
];

export const TRAITS = [
  { id: 'thief', title: '惯偷', description: '你习惯于顺手牵羊。潜行 +5, 偷窃 +5' },
  { id: 'tough', title: '坚韧', description: '你的皮肤像皮革一样粗糙。韧性 +5' },
  { id: 'charismatic', title: '领袖魅力', description: '人们愿意追随你。招募成本 -10%' },
  { id: 'hated', title: '被通缉', description: '你在某个派系中声名狼藉。' },
  { id: 'pacifist', title: '和平主义者', description: '你厌恶暴力。战斗技能成长 -20%, 医疗 +10' },
  { id: 'glutton', title: '暴食者', description: '你的新陈代谢极快。饥饿速度 +20%' },
];
