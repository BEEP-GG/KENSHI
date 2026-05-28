import { GameState, Employee, GameEvent, Facility, FacilityBlueprint, Outpost } from './types';

export const FACILITY_BLUEPRINTS: FacilityBlueprint[] = [
  {
    id: 'defensive-gate',
    category: '防御',
    icon: 'Shield',
    statScaling: ['力量', '体质'],
    levels: {
      1: { level: 1, name: '临时大门', description: '由废金属板组成，顶部有倒钩铁丝网。勉强能阻挡饥饿的强盗。', productionRate: '30 安全度', productionType: '防御建筑', maxWorkers: 2, upgradeCost: {'建筑材料': 5}, requiredOutpostLevel: 1 },
      2: { level: 2, name: '2级防御大门', description: '墙体变得更高更厚，大门拥有更强的结构。', productionRate: '50 安全度', productionType: '防御建筑', maxWorkers: 4, upgradeCost: {'建筑材料': 10, '铁原板': 5}, requiredOutpostLevel: 2 },
      3: { level: 3, name: '3级防御大门', description: '墙体变得更高更厚，大门拥有更强结构。', productionRate: '60 安全度', productionType: '防御建筑', maxWorkers: 4, upgradeCost: {'建筑材料': 15, '铁原板': 10}, requiredOutpostLevel: 3 },
      4: { level: 4, name: '4级防御大门', description: '极其坚固的双层装甲门。', productionRate: '90 安全度', productionType: '防御建筑', maxWorkers: 6, upgradeCost: {'建筑材料': 25, '铁原板': 20, '钢筋': 5}, requiredOutpostLevel: 4 },
      5: { level: 5, name: '5级防御大门', description: '最高级别的要塞大门，几乎不可摧毁。', productionRate: '120 安全度', productionType: '防御建筑', maxWorkers: 8, requiredOutpostLevel: 5 }
    }
  },
  {
    id: 'defensive-wall',
    category: '防御',
    icon: 'BrickWall',
    statScaling: ['体质', '敏捷'],
    levels: {
      1: { level: 1, name: '临时墙', description: '由废金属板组成。不能在上面行走或放置炮塔。', productionRate: '20 安全度', productionType: '防护墙', maxWorkers: 0, upgradeCost: {'建筑材料': 3}, requiredOutpostLevel: 1 },
      2: { level: 2, name: '2级防御墙', description: '允许在上方放置炮塔以及行走，拥有连接件。', productionRate: '40 安全度', productionType: '防护墙', maxWorkers: 0, upgradeCost: {'建筑材料': 6, '铁原板': 2}, requiredOutpostLevel: 2 },
      3: { level: 3, name: '3级防御墙', description: '墙体变得更高更厚，可以部署弩炮。', productionRate: '60 安全度', productionType: '防护墙', maxWorkers: 0, upgradeCost: {'建筑材料': 10, '铁原板': 5}, requiredOutpostLevel: 3 },
      4: { level: 4, name: '4级防御墙', description: '重型装甲墙，提供极佳的视野优势。', productionRate: '80 安全度', productionType: '防护墙', maxWorkers: 0, upgradeCost: {'建筑材料': 15, '铁原板': 10, '钢筋': 2}, requiredOutpostLevel: 4 },
      5: { level: 5, name: '5级防御墙', description: '要塞级别的城墙，足以抵挡利维坦的撞击。', productionRate: '100 安全度', productionType: '防护墙', maxWorkers: 0, requiredOutpostLevel: 5 }
    }
  },
  {
    id: 'turret',
    category: '防御',
    icon: 'ShieldAlert',
    statScaling: ['感知', '敏捷'],
    levels: {
      1: { level: 1, name: '十字弩', description: '简陋的防卫器械，发射普通弩箭。', productionRate: '10 安全度', productionType: '炮塔', maxWorkers: 1, upgradeCost: {'建筑材料': 2, '铁原板': 1}, requiredOutpostLevel: 1 },
      2: { level: 2, name: '大型弩箭炮塔', description: '威力更大的弩炮，可以轻易贯穿轻甲。', productionRate: '25 安全度', productionType: '炮塔', maxWorkers: 1, upgradeCost: {'铁原板': 5}, requiredOutpostLevel: 3 },
      3: { level: 3, name: '鱼叉炮塔', description: '恐怖的致命武器，能够发射重型鱼叉钉在敌人身上。', productionRate: '50 安全度', productionType: '炮塔', maxWorkers: 1, upgradeCost: {'铁原板': 10, '钢筋': 2}, requiredOutpostLevel: 4 },
      4: { level: 4, name: '双管鱼叉炮台', description: '科技的结晶，连续发射两发致命的鱼叉。', productionRate: '90 安全度', productionType: '炮塔', maxWorkers: 1, upgradeCost: {'钢筋': 5, '电子元件': 2}, requiredOutpostLevel: 5 }
    }
  },
  {
    id: 'cooking-stove',
    category: '生产',
    icon: 'Utensils',
    statScaling: ['感知', '体质'],
    levels: {
      1: { level: 1, name: '营地生火', description: '简单的石头火堆，可以烤肉，勉强果腹。', productionRate: 15, productionType: '食物/天', maxWorkers: 1, upgradeCost: {'建筑材料': 2} },
      2: { level: 2, name: '废土烹饪炉', description: '专用的金属炉灶，能烹饪烤肉棒、米饭和甚至口粮包。', productionRate: 40, productionType: '食物/天', maxWorkers: 2, upgradeCost: {'铁原板': 10} }
    }
  },
  {
    id: 'stone-mine',
    category: '生产',
    icon: 'Pickaxe',
    statScaling: ['力量'],
    levels: {
      1: { level: 1, name: '人工采石场', description: '露天敲击岩石，极其费力和低效。', productionRate: 15, productionType: '石材/天', maxWorkers: 3, upgradeCost: {'建筑材料': 3} },
      2: { level: 2, name: '混合矿场', description: '效率更高的采石工具，更深层的开采。', productionRate: 40, productionType: '石材/天', maxWorkers: 2, upgradeCost: {'建筑材料': 8, '铁原板': 2} }
    }
  },
  {
    id: 'ore-drill',
    category: '生产',
    icon: 'Activity',
    statScaling: ['感知'],
    levels: {
      1: { level: 1, name: '矿石钻机', description: '蒸汽动力的钻机，能挖掘深埋的生铁和铜矿。', productionRate: 50, productionType: '生铁/天', maxWorkers: 2, upgradeCost: {'建筑材料': 10, '铁原板': 5} },
      2: { level: 2, name: '全自动矿井', description: '电力驱动全自动采掘。', productionRate: 120, productionType: '生铁/天', maxWorkers: 1, upgradeCost: {'铁原板': 15, '电子元件': 2} }
    }
  },
  {
    id: 'steel-refinery',
    category: '生产',
    icon: 'Factory',
    statScaling: ['力量', '智力'],
    levels: {
      1: { level: 1, name: '炼钢炉', description: '将铁原板锻造为坚硬的钢筋。', productionRate: 20, productionType: '钢筋/天', maxWorkers: 2, upgradeCost: {'建筑材料': 10, '铁原板': 10} }
    }
  },
  {
    id: 'imprisonment-cage',
    category: '囚禁',
    icon: 'Shield',
    statScaling: ['力量'],
    levels: {
      1: { level: 1, name: '囚笼', description: '锁住强盗或者野生动物铁笼。', productionRate: '1人', productionType: '囚犯容量', maxWorkers: 0, upgradeCost: {'铁原板': 3} }
    }
  },
  {
    id: 'research-bench',
    category: '基建',
    icon: 'Bot',
    statScaling: ['智力'],
    levels: {
      1: { level: 1, name: '初级研究台', description: '用来研究新技术，升级据点的必要设施。', productionRate: '解锁蓝图', productionType: '研究力', maxWorkers: 1, upgradeCost: {'建筑材料': 10} },
      2: { level: 2, name: '古代科技研究台', description: '能够消耗古人遗留的古代科学书进行高级研究。', productionRate: '解锁高级蓝图', productionType: '古代研究力', maxWorkers: 2, upgradeCost: {'铁原板': 10, '电子元件': 5} }
    }
  },
  {
    id: 'grain-silo',
    category: '生产',
    icon: 'Wheat',
    statScaling: ['力量', '感知'],
    levels: {
      1: { level: 1, name: '面粉碾磨机', description: '使用畜力或人力推动的碾磨轮，能把小麦转化成面粉。', productionRate: 20, productionType: '面粉/天', maxWorkers: 2, upgradeCost: {'建筑材料': 10, '铁原板': 2} },
      2: { level: 2, name: '面包烤炉', description: '将面粉和水在窑炉中烤制成营养丰富的干面包。', productionRate: 50, productionType: '食物/天', maxWorkers: 2, upgradeCost: {'建筑材料': 15, '电子元件': 1} }
    }
  },
  {
    id: 'brewery',
    category: '生产',
    icon: 'Beer',
    statScaling: ['智力', '感知'],
    levels: {
      1: { level: 1, name: '简易蒸馏器', description: '一套劣质的蒸馏设备，由大麻、水或小麦酿出低浓度酒精。', productionRate: 10, productionType: '酒水/天', maxWorkers: 1, upgradeCost: {'铁原板': 10} },
      2: { level: 2, name: '格洛格酒酿造机', description: '高效率发酵罐，能够批量酿造高级清酒、朗姆酒或格洛格酒。', productionRate: 35, productionType: '酒水/天', maxWorkers: 2, upgradeCost: {'铁原板': 20, '铜合金': 5} }
    }
  },
  {
    id: 'hydroponic-hemp',
    category: '生产',
    icon: 'Leaf',
    statScaling: ['智力', '感知'],
    levels: {
      1: { level: 1, name: '简易麻叶盆栽', description: '简单的室内麻叶种植盆，产量低下。', productionRate: 50, productionType: '麻叶/天', maxWorkers: 1, upgradeCost: {'建筑材料': 4, '水': 10}, requiredOutpostLevel: 1 },
      2: { level: 2, name: '水培温室', description: '利用古代科技的水培系统室内种植大麻。', productionRate: 155, productionType: '麻叶/天', maxWorkers: 4, upgradeCost: {'建筑材料': 10, '电子元件': 2}, requiredOutpostLevel: 2 },
      3: { level: 3, name: '大型灌溉层', description: '占据整个楼层的大型灌溉系统，产量极大。', productionRate: 350, productionType: '麻叶/天', maxWorkers: 6, upgradeCost: {'建筑材料': 20, '电子元件': 5, '钢筋': 5}, requiredOutpostLevel: 3 },
      4: { level: 4, name: '高级水培阵列', description: '完全自动化的水光温控系统，产量惊人。', productionRate: 800, productionType: '麻叶/天', maxWorkers: 8, upgradeCost: {'建筑材料': 30, '电子元件': 10, '钢筋': 10}, requiredOutpostLevel: 4 },
      5: { level: 5, name: '古代遗迹水培工厂', description: '发掘自远古遗迹的庞大水培机械矩阵，产量惊人。', productionRate: 1500, productionType: '麻叶/天', maxWorkers: 10, requiredOutpostLevel: 5 }
    }
  },
  {
    id: 'hashish-production',
    category: '生产',
    icon: 'Droplet',
    statScaling: ['智力', '敏捷'],
    levels: {
      1: { level: 1, name: '大麻膏压制机', description: '粗糙的机械，将麻叶压制成低品质大麻膏。', productionRate: 20, productionType: '大麻膏/天', maxWorkers: 1, upgradeCost: {'铁原板': 5} },
      2: { level: 2, name: '大麻膏加工器', description: '复杂的蒸汽机械，提炼成高纯度大麻膏。', productionRate: 50, productionType: '大麻膏/天', maxWorkers: 2, upgradeCost: {'铁原板': 15, '钢筋': 5} },
      3: { level: 3, name: '工业大麻膏提炼炉', description: '极大提升了提纯速度和质量。', productionRate: 120, productionType: '大麻膏/天', maxWorkers: 4 }
    }
  },
  {
    id: 'iron-refinery',
    category: '生产',
    icon: 'Wrench',
    statScaling: ['力量', '体质'],
    levels: {
      1: { level: 1, name: '人工砸铁石', description: '极其费力的露天作业。', productionRate: 15, productionType: '铁原板/天', maxWorkers: 2, upgradeCost: {'建筑材料': 10}, requiredOutpostLevel: 1 },
      2: { level: 2, name: '铁矿精炼炉', description: '标准精炼炉，增加提炼效率。', productionRate: 30, productionType: '铁原板/天', maxWorkers: 3, upgradeCost: {'建筑材料': 15, '铁原板': 5}, requiredOutpostLevel: 2 },
      3: { level: 3, name: '自动铁矿精炼炉', description: '由风力或电力驱动，无需人工敲打。', productionRate: 80, productionType: '铁原板/天', maxWorkers: 1, upgradeCost: {'建筑材料': 20, '铁原板': 10, '电子元件': 1}, requiredOutpostLevel: 3 },
      4: { level: 4, name: '工业连式精炼机', description: '大型工业设备，吞吐量极大。', productionRate: 150, productionType: '铁原板/天', maxWorkers: 2, upgradeCost: {'钢筋': 10, '建筑材料': 20, '电子元件': 5}, requiredOutpostLevel: 4 },
      5: { level: 5, name: '多管复合炼铁中心', description: '完美提炼废土上的铁矿，足以支撑整个城镇的发展。', productionRate: 300, productionType: '铁原板/天', maxWorkers: 4, requiredOutpostLevel: 5 }
    }
  },
  {
    id: 'stone-processor',
    category: '生产',
    icon: 'Pickaxe',
    statScaling: ['力量', '韧性'],
    levels: {
      1: { level: 1, name: '手动石材加工机', description: '人工将石头敲打成建筑材料。', productionRate: 10, productionType: '建筑材料/天', maxWorkers: 3, upgradeCost: {'铁原板': 5}, requiredOutpostLevel: 1 },
      2: { level: 2, name: '石材加工机 II', description: '半自动加工机。', productionRate: 25, productionType: '建筑材料/天', maxWorkers: 2, upgradeCost: {'铁原板': 10, '电子元件': 1}, requiredOutpostLevel: 2 },
      3: { level: 3, name: '全自动石材厂', description: '只要电力充足就能源源不断产出建材。', productionRate: 60, productionType: '建筑材料/天', maxWorkers: 1, upgradeCost: {'铁原板': 20, '钢筋': 5, '电子元件': 3}, requiredOutpostLevel: 3 },
      4: { level: 4, name: '重型建材粉碎阵列', description: '不仅产量高，加工出的建材也更加坚固。', productionRate: 120, productionType: '建筑材料/天', maxWorkers: 2, upgradeCost: {'建筑材料': 20, '钢筋': 10, '电子元件': 5}, requiredOutpostLevel: 4 },
      5: { level: 5, name: '古代巨型粉碎机', description: '保留下来的庞然大物，能将任何矿石砸成粉末。', productionRate: 300, productionType: '建筑材料/天', maxWorkers: 3, requiredOutpostLevel: 5 }
    }
  },
  {
    id: 'fabric-loom',
    category: '生产',
    icon: 'Scissors',
    statScaling: ['敏捷', '感知'],
    levels: {
      1: { level: 1, name: '手动布料织机', description: '需要人工手摇，可将棉花或大麻叶缓慢纺织成布料。', productionRate: 15, productionType: '布料/天', maxWorkers: 2, upgradeCost: {'建筑材料': 5, '铁原板': 2}, requiredOutpostLevel: 1 },
      2: { level: 2, name: '自动织机', description: '电力驱动的织机，能全自动且高效地生产高质量布料。', productionRate: 45, productionType: '布料/天', maxWorkers: 1, upgradeCost: {'铁原板': 10, '电子元件': 2}, requiredOutpostLevel: 2 }
    }
  },
  {
    id: 'tanning-bench',
    category: '生产',
    icon: 'Box',
    statScaling: ['力量', '体质'],
    levels: {
      1: { level: 1, name: '皮革鞣制工作台', description: '处理生肉和动物皮，生产皮革的粗重活。气味难闻。', productionRate: 10, productionType: '皮革/天', maxWorkers: 1, upgradeCost: {'建筑材料': 3, '铁原板': 2}, requiredOutpostLevel: 1 },
      2: { level: 2, name: '皮革抛光作坊', description: '改进的制皮工艺，产出不仅快而且皮革更坚韧。', productionRate: 30, productionType: '皮革/天', maxWorkers: 2, upgradeCost: {'铁原板': 8}, requiredOutpostLevel: 2 }
    }
  },
  {
    id: 'electronics-bench',
    category: '锻造',
    icon: 'Cpu',
    statScaling: ['智力', '感知'],
    levels: {
      1: { level: 1, name: '基础电子工作台', description: '用于手工拼组散落的电子元件。', productionRate: 2, productionType: '电子元件/天', maxWorkers: 1, upgradeCost: {'铁原板': 10, '铜合金': 5}, requiredOutpostLevel: 2 },
      2: { level: 2, name: '精密电子制造台', description: '拥有显微仪器，能批量生产复杂的微型芯片。', productionRate: 8, productionType: '电子元件/天', maxWorkers: 2, upgradeCost: {'铁原板': 15, '钢筋': 5, '电子元件': 3}, requiredOutpostLevel: 3 }
    }
  },
  {
    id: 'armor-smithy',
    category: '锻造',
    icon: 'Shirt',
    statScaling: ['智力', '力量'],
    levels: {
      1: { level: 1, name: '简易衣物工作台', description: '用布料缝制基本衬衫与布甲。', productionRate: 20, productionType: 'Cats/天', maxWorkers: 1, upgradeCost: {'建筑材料': 4}, requiredOutpostLevel: 1 },
      2: { level: 2, name: '皮铠甲与链甲台', description: '能整合皮革与铁链加工出防护性不错的护甲。', productionRate: 60, productionType: 'Cats/天', maxWorkers: 2, upgradeCost: {'铁原板': 12, '电子元件': 1}, requiredOutpostLevel: 2 },
      3: { level: 3, name: '重甲锻造工坊', description: '最高级的铁匠铺，锻造沉重而完美的武士重甲。出售利润极高。', productionRate: 180, productionType: 'Cats/天', maxWorkers: 2, requiredOutpostLevel: 3 }
    }
  },
  {
    id: 'weapon-smithy',
    category: '锻造',
    icon: 'Sword',
    statScaling: ['力量', '感知'],
    levels: {
      1: { level: 1, name: '铁匠铺', description: '敲打废铁打造劣质的大刀或铁管。', productionRate: 25, productionType: 'Cats/天', maxWorkers: 1, upgradeCost: {'建筑材料': 5, '铁原板': 5}, requiredOutpostLevel: 1 },
      2: { level: 2, name: '标准武器锻造炉', description: '拥有更好的火候掌控，能生产利刃猫刀。', productionRate: 75, productionType: 'Cats/天', maxWorkers: 2, upgradeCost: {'建筑材料': 10, '钢筋': 5}, requiredOutpostLevel: 2 },
      3: { level: 3, name: '刃行者锻造台', description: '传说级别的工坊，武器极其锋利。', productionRate: 220, productionType: 'Cats/天', maxWorkers: 2, requiredOutpostLevel: 3 }
    }
  },
  {
    id: 'robotics-bench',
    category: '锻造',
    icon: 'Bot',
    statScaling: ['智力', '感知'],
    levels: {
      1: { level: 1, name: '机械仿生工作台', description: '精密科技，用电子元件和钢筋修复与制作极其昂贵的机械假肢。', productionRate: 150, productionType: 'Cats/天', maxWorkers: 1, upgradeCost: {'铁原板': 20, '电子元件': 10, '钢筋': 10}, requiredOutpostLevel: 3 },
      2: { level: 2, name: '精密义肢总成厂', description: '流水线制作侦查腿、工业臂。巨额利润保障，对智力要求极高。', productionRate: 400, productionType: 'Cats/天', maxWorkers: 2, upgradeCost: {'钢筋': 20, '电子元件': 15}, requiredOutpostLevel: 4 }
    }
  },
  {
    id: 'storm-house',
    category: '基建',
    icon: 'Home',
    statScaling: ['力量'],
    levels: {
      1: { level: 1, name: '破片棚屋', description: '用废铁皮和木板勉强搭起的避风处。', productionRate: '2人', productionType: '容量', maxWorkers: 0, upgradeCost: {'建筑材料': 5}, requiredOutpostLevel: 1 },
      2: { level: 2, name: '暴风屋', description: '标准的Kenshi世界建筑，防风沙。', productionRate: '4人', productionType: '容量', maxWorkers: 0, upgradeCost: {'建筑材料': 15}, requiredOutpostLevel: 2 },
      3: { level: 3, name: '斯铁芬屋', description: '宽敞的L型双层建筑。', productionRate: '8人', productionType: '容量', maxWorkers: 0, upgradeCost: {'建筑材料': 25, '铁原板': 10}, requiredOutpostLevel: 3 },
      4: { level: 4, name: '蜗牛堡垒屋', description: '巨大的圆顶建筑，提供极佳的居住环境和充足的空间。', productionRate: '15人', productionType: '容量', maxWorkers: 0, upgradeCost: {'建筑材料': 40, '铁原板': 20}, requiredOutpostLevel: 4 },
      5: { level: 5, name: '驻防要塞楼', description: '宏伟的特大建筑，可作为城镇中心使用。', productionRate: '30人', productionType: '容量', maxWorkers: 0, requiredOutpostLevel: 5 }
    }
  },
  {
    id: 'bar',
    category: '娱乐',
    icon: 'Coffee',
    statScaling: ['魅力', '智力'],
    levels: {
      1: { level: 1, name: '简易酒棚', description: '提供廉价酒水和劣质肉干的露天吧台。', productionRate: '10名', productionType: '每天最多访客', maxWorkers: 2, upgradeCost: {'建筑材料': 10, '铁原板': 5}, requiredOutpostLevel: 1 },
      2: { level: 2, name: '废土酒馆', description: '标准的室内酒吧，昏暗灯光吸引着雇佣兵和流浪者。', productionRate: '25名', productionType: '每天最多访客', maxWorkers: 3, upgradeCost: {'建筑材料': 15, '电子元件': 1}, requiredOutpostLevel: 2 },
      3: { level: 3, name: '闹市大酒馆', description: '喧杂繁华，包含各类饮品，甚至能雇佣到高级赏金猎人。', productionRate: '50名', productionType: '每天最多访客', maxWorkers: 5, upgradeCost: {'建筑材料': 30, '电子元件': 5}, requiredOutpostLevel: 3 },
      4: { level: 4, name: '贵族角斗场酒吧', description: '供有钱人挥霍的娱乐场所，充满狂欢与血腥。', productionRate: '100名', productionType: '每天最多访客', maxWorkers: 8, upgradeCost: {'建筑材料': 40, '铁原板': 20, '电子元件': 8}, requiredOutpostLevel: 4 },
      5: { level: 5, name: '巅峰贵族大酒厅', description: '极其奢华的地方，各路贵族与商阀流连忘返的核心娱乐中心。', productionRate: '200名', productionType: '每天最多访客', maxWorkers: 12, requiredOutpostLevel: 5 }
    }
  },
  {
    id: 'shop',
    category: '娱乐',
    icon: 'Store',
    statScaling: ['魅力', '感知'],
    levels: {
      1: { level: 1, name: '破旧摊位', description: '摆在木板上的杂货，只能吸引路过的穷鬼。', productionRate: '100', productionType: 'Cats/天', maxWorkers: 1, upgradeCost: {'建筑材料': 5}, requiredOutpostLevel: 1 },
      2: { level: 2, name: '标准杂货铺', description: '带有商品柜台的商店，能稳定出售多余物资。', productionRate: '350', productionType: 'Cats/天', maxWorkers: 2, upgradeCost: {'建筑材料': 15, '铁原板': 5}, requiredOutpostLevel: 2 },
      3: { level: 3, name: '大型贸易行', description: '规模颇大，不仅出售货物，还会吸引商队主动前来交易。', productionRate: '800', productionType: 'Cats/天', maxWorkers: 3, upgradeCost: {'建筑材料': 25, '铁原板': 15}, requiredOutpostLevel: 3 },
      4: { level: 4, name: '总会驿站', description: '物资集散中心，垄断了周边区域的各种商品交易。', productionRate: '2000', productionType: 'Cats/天', maxWorkers: 5, upgradeCost: {'建筑材料': 40, '铁原板': 25, '电子元件': 5}, requiredOutpostLevel: 4 },
      5: { level: 5, name: '极星贸易总局', description: '城镇级别的顶级商铺，交易额极其庞大。', productionRate: '5000', productionType: 'Cats/天', maxWorkers: 8, requiredOutpostLevel: 5 }
    }
  },
  {
    id: 'inn',
    category: '娱乐',
    icon: 'Bed',
    statScaling: ['魅力'],
    levels: {
      1: { level: 1, name: '席地铺盖', description: '在地上铺几张破睡袋，恢复速度极慢。', productionRate: 'x4', productionType: '回血倍率', maxWorkers: 0, upgradeCost: {'建筑材料': 2}, requiredOutpostLevel: 1 },
      2: { level: 2, name: '标准营地床', description: '提供正经的床铺，可以让受伤的队员快速恢复血量。也可租给过路客赚小钱。', productionRate: 'x8', productionType: '回血倍率', maxWorkers: 1, upgradeCost: {'建筑材料': 10, '麻叶': 10}, requiredOutpostLevel: 2 },
      3: { level: 3, name: '舒适休息套间', description: '干净的房间和棉花床垫，令人心情愉悦。', productionRate: 'x16', productionType: '回血倍率', maxWorkers: 2, upgradeCost: {'建筑材料': 20, '布料': 10}, requiredOutpostLevel: 3 },
      4: { level: 4, name: '古代医疗维生床', description: '从危险的远古遗迹中抢救出的医疗设备，能极快治愈重伤。', productionRate: 'x32', productionType: '回血倍率', maxWorkers: 2, upgradeCost: {'建筑材料': 30, '电子元件': 5, '钢筋': 5}, requiredOutpostLevel: 4 },
      5: { level: 5, name: '远古全自动手术舱', description: '彻底失传的远古黑科技，只要人没死就能迅速拼装完好。', productionRate: 'x64', productionType: '回血倍率', maxWorkers: 3, requiredOutpostLevel: 5 }
    }
  },
  {
    id: 'prison',
    category: '囚禁',
    icon: 'Lock',
    statScaling: ['力量', '韧性'],
    levels: {
      1: { level: 1, name: '简易绑缚柱', description: '几根木桩系上绳子，勉强绑住俘虏。', productionRate: '1名', productionType: '关押上限', maxWorkers: 0, upgradeCost: {'建筑材料': 3}, requiredOutpostLevel: 1 },
      2: { level: 2, name: '铁笼', description: '用铁条焊死的笼子，防止犯人逃跑。', productionRate: '3名', productionType: '关押上限', maxWorkers: 1, upgradeCost: {'铁原板': 10}, requiredOutpostLevel: 2 },
      3: { level: 3, name: '地牢羁押室', description: '坚固的监牢，能够稳定关押具有危险性的犯人。', productionRate: '10名', productionType: '关押上限', maxWorkers: 2, upgradeCost: {'建筑材料': 20, '铁原板': 15}, requiredOutpostLevel: 3 },
      4: { level: 4, name: '重型枷锁囚林', description: '布满倒刺铁笼与重装钢柱的戒严区，被抓进去插翅难飞。', productionRate: '25名', productionType: '关押上限', maxWorkers: 3, upgradeCost: {'钢筋': 15, '电子元件': 5}, requiredOutpostLevel: 4 },
      5: { level: 5, name: '极高安保死罪铁狱', description: '最高安全级别，充满绝望的死牢，城镇秩序的残酷象征。', productionRate: '50名', productionType: '关押上限', maxWorkers: 5, requiredOutpostLevel: 5 }
    }
  },
  {
    id: 'brothel',
    category: '娱乐',
    icon: 'Heart',
    statScaling: ['魅力'],
    levels: {
      1: { level: 1, name: '破落皮肉帐篷', description: '极其简陋的寻欢之所，仅能吸引底层的流浪汉。', productionRate: '150', productionType: 'Cats/天', maxWorkers: 1, upgradeCost: {'布料': 5, '建筑材料': 2}, requiredOutpostLevel: 1 },
      2: { level: 2, name: '霓虹暗巷馆', description: '提供廉价安慰的昏暗房间，常有佣兵光顾。', productionRate: '400', productionType: 'Cats/天', maxWorkers: 2, upgradeCost: {'建筑材料': 10, '布料': 10}, requiredOutpostLevel: 2 },
      3: { level: 3, name: '销金窟乐子馆', description: '热闹非凡的娱乐场所，为疲惫的废土客提供精神与肉体的慰藉。利润丰厚。', productionRate: '1000', productionType: 'Cats/天', maxWorkers: 4, upgradeCost: {'建筑材料': 20, '电子元件': 2}, requiredOutpostLevel: 3 },
      4: { level: 4, name: '极乐百花楼', description: '充满异国情调和迷幻香气的高级庭院，令富贵人家流连忘返。', productionRate: '2500', productionType: 'Cats/天', maxWorkers: 8, upgradeCost: {'建筑材料': 30, '电子元件': 5, '布料': 30}, requiredOutpostLevel: 4 },
      5: { level: 5, name: '云端极乐殿', description: '只为军阀贵胄开放的终极享乐天堂，能榨干客人身上的最后一枚开币。', productionRate: '8000', productionType: 'Cats/天', maxWorkers: 15, requiredOutpostLevel: 5 }
    }
  }
];

export const initialOutposts: Outpost[] = [
  {
    id: 'out-1',
    name: '边境枢纽站',
    location: '枢纽站 (The Hub)',
    status: 'operational',
    description: '最初的据点，位于风力充足的边境山区。虽然简陋但交通便利。',
    level: 3
  },
  {
    id: 'out-2',
    name: '海边哨所',
    location: '死地 (The Deadlands)',
    status: 'operational',
    description: '为了获取酸性水源和古代科技而建立的前哨基地。环境恶劣但资源丰富。',
    level: 1
  }
];

export const initialFacilities: Facility[] = [
  {
    id: 'fac-1',
    blueprintId: 'hydroponic-hemp',
    outpostId: 'out-1',
    level: 2,
    workers: ['emp-1', 'emp-3'],
    status: 'active',
  },
  {
    id: 'fac-2',
    blueprintId: 'hashish-production',
    outpostId: 'out-1',
    level: 1,
    workers: ['emp-2'],
    status: 'active',
  },
  {
    id: 'fac-3',
    blueprintId: 'iron-refinery',
    outpostId: 'out-1',
    level: 2,
    workers: [],
    status: 'idle',
  },
  {
    id: 'fac-4',
    blueprintId: 'defensive-gate',
    outpostId: 'out-1',
    level: 1,
    workers: [],
    status: 'active'
  },
  {
    id: 'fac-5',
    blueprintId: 'stone-processor',
    outpostId: 'out-2',
    level: 1,
    workers: [],
    status: 'active'
  }
];

export const initialEmployees: Employee[] = [
  { id: 'emp-1', name: '哔噗', race: '蜂巢族工蜂', role: '见习武圣', status: 'working', facilityId: 'fac-1', outpostId: 'out-1', traits: ['跑得极快', '蜂巢族', '四肢缺失'], hp: 75, maxHp: 75, stats: { 力量: 8, 敏捷: 15, 感知: 12, 体质: 6, 智力: 10, 韧性: 18, 魅力: 20 } },
  { id: 'emp-2', name: '阿格努', race: '骨人', role: '重装打手', status: 'working', facilityId: 'fac-2', outpostId: 'out-1', traits: ['无需食物', '天气免疫', '无法说话'], hp: 200, maxHp: 200, stats: { 力量: 16, 敏捷: 8, 感知: 9, 体质: 18, 智力: 7, 韧性: 14, 魅力: 4 } },
  { id: 'emp-3', name: '康', race: '沙克族', role: '精锐战士', status: 'working', facilityId: 'fac-1', outpostId: 'out-1', traits: ['天生狂战士', '大胃王', '高血量'], hp: 125, maxHp: 125, stats: { 力量: 18, 敏捷: 10, 感知: 11, 体质: 16, 智力: 8, 韧性: 15, 魅力: 10 } },
  { id: 'emp-4', name: '绿', race: '焦土之子', role: '炮塔射手', status: 'idle', outpostId: 'out-1', traits: ['神射手', '嗜酒', '生肉食用'], hp: 80, maxHp: 80, stats: { 力量: 9, 敏捷: 17, 感知: 18, 体质: 9, 智力: 12, 韧性: 10, 魅力: 8 } },
];

export const initialEvents: GameEvent[] = [];

export const initialGameState: GameState = {
  cats: 4520,
  resources: {
    '建筑材料': 35,
    '铁原板': 50,
    '电子元件': 24,
    '水': 50,
    '钢筋': 32,
    '麻叶': 120,
    '大麻膏': 15,
    '古代科技书': 50
  },
  day: 42,
  currentOutpostId: 'out-1',
  outposts: initialOutposts,
  facilities: initialFacilities,
  employees: initialEmployees,
  events: initialEvents
};
