import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';

// 定义通用的属性/技能解析正则表达式
const MODIFIER_REGEX = /(力量|敏捷|感知|体质|意志|智力|魅力|STR|DEX|PER|TGH|WIL|INT|CHA|潜行|运动|偷窃|撬锁|暗杀|侦查|科学|工程学|战地急救|机器人学|交易|说服|烹饪|火焰抗性|寒冷抗性|酸蚀抗性|毒素抗性|闪避|防护能力|DR)(?:属性|检定|加成|减益)?\s*([+-]\s*\d+)/gi;

// 定义一个辅助函数，用于将伤害类型中的百分比转换为小数
const parseDamageType = (damageTypeStr: string) => {
  if (!damageTypeStr || !damageTypeStr.includes('%')) {
    return damageTypeStr;
  }
  return damageTypeStr
    .split('/')
    .map(part => {
      const [type, value] = part.split(':');
      const trimmedType = type ? type.trim() : '';
      const trimmedValue = value ? value.trim() : '';

      if (trimmedType && trimmedValue && trimmedValue.endsWith('%')) {
        const num = parseFloat(trimmedValue.slice(0, -1));
        if (!Number.isNaN(num)) {
          return `${trimmedType}:${(num / 100).toString()}`;
        }
      }
      return part;
    })
    .join('/');
};

// 定义武器结构
const WeaponSchema = z
  .object({
    名字: z.string().prefault(''),
    种类: z.string().prefault('无'),
    品质: z.string().prefault('普通'),
    介绍: z.string().prefault(''),
    伤害骰: z.string().prefault('1d4'),
    伤害类型: z.string().transform(parseDamageType).prefault('钝伤:1.0'),
    特效: z.record(z.string(), z.any()).prefault({}),
    价值: z.coerce.number().prefault(0),
  })
  .transform(weaponData => {
    if (!weaponData.介绍) return weaponData;
    const desc = weaponData.介绍;
    const effects = weaponData.特效 || {};
    let match: RegExpExecArray | null;

    const combatEffectRegex = /对\s*\[?([^\]\s]+)\]?\s*(?:造成)?(?:的)?(?:额外)?伤害\s*([+-]\s*\d+)|(?<!额外)伤害\s*([+-]\s*\d+)|无视\s*(?:护甲|DR)\s*(\d*)|造成\s*(流血|骨折|中毒|燃烧)/g;
    while ((match = combatEffectRegex.exec(desc)) !== null) {
      if (match[1]) {
        if (!effects.conditionalDamage) effects.conditionalDamage = [];
        effects.conditionalDamage.push({ target: match[1].trim(), value: parseInt(match[2].replace(/\s/g, ''), 10) });
      } else if (match[3]) {
        effects.damageModifier = parseInt(match[3].replace(/\s/g, ''), 10);
      } else if (match[4] !== undefined) {
        effects.ignoreArmor = match[4] ? parseInt(match[4], 10) : true;
      } else if (match[5]) {
        if (!effects.applyStatus) effects.applyStatus = [];
        if (!effects.applyStatus.includes(match[5])) effects.applyStatus.push(match[5]);
      }
    }

    MODIFIER_REGEX.lastIndex = 0;
    while ((match = MODIFIER_REGEX.exec(desc)) !== null) {
      let key = match[1].trim();
      const value = parseInt(match[2].replace(/\s/g, ''), 10);
      if (key === '防护能力') key = 'DR';
      effects[key] = (effects[key] || 0) + value;
    }

    weaponData.特效 = effects;
    return weaponData;
  });

// 定义护甲结构
const ArmorSchema = z
  .object({
    种类: z.string().prefault('无'),
    '防护能力(DR)': z.coerce.number().prefault(0),
    介绍: z.string().prefault(''),
    特性: z.record(z.string(), z.any()).prefault({}),
  })
  .transform(armorData => {
    if (!armorData.介绍) return armorData;
    const desc = armorData.介绍;
    const features = armorData.特性 || {};
    let match: RegExpExecArray | null;
    MODIFIER_REGEX.lastIndex = 0;
    while ((match = MODIFIER_REGEX.exec(desc)) !== null) {
      let key = match[1].trim();
      const value = parseInt(match[2].replace(/\s/g, ''), 10);
      if (key === '防护能力') key = 'DR';
      features[key] = (features[key] || 0) + value;
    }
    armorData.特性 = features;
    return armorData;
  });

// 定义属性详细结构
const AttributeDetailSchema = z
  .object({
    基础: z.coerce.number().prefault(30),
    加成: z.coerce.number().prefault(0),
  })
  .prefault({ 基础: 30, 加成: 0 });

// 角色基础“蓝图”定义
const CharacterSchemaBase = z
  .object({
    id: z.string().prefault(''),
    性别: z.string().prefault('男'),
    年龄: z.union([z.coerce.number(), z.string()]).prefault(20),
    外貌: z.string().prefault(''),
    体型: z.string().prefault('1.75m'),
    状态: z.string().prefault('正常'),
    立场: z.enum(['友方', '中立', '敌方']).prefault('中立'),
    派系: z.string().prefault('无派系'),
    等级: z.coerce.number().transform(v => _.clamp(v, 1, 100)).prefault(1),
    经验值: z
      .object({
        当前: z.coerce.number().prefault(0),
        升级所需: z.coerce.number().prefault(110),
      })
      .prefault({ 当前: 0, 升级所需: 110 }),
    属性点: z.coerce.number().prefault(0),
    特质点: z.coerce.number().prefault(0),
    攻击次数: z.coerce.number().prefault(1),
    主武器: WeaponSchema.prefault({}),
    副武器: WeaponSchema.prefault({}),
    护甲: ArmorSchema.prefault({}),
    血量: z
      .object({
        当前: z.coerce.number().prefault(100),
        最大: z.coerce.number().prefault(100),
      })
      .prefault({ 当前: 100, 最大: 100 }),
    心智: z
      .object({
        当前: z.coerce.number().prefault(100),
        最大: z.coerce.number().prefault(100),
      })
      .prefault({ 当前: 100, 最大: 100 }),
    种族: z
      .object({
        名称: z.string().prefault('人类'),
        基础生命值: z.coerce.number().prefault(20),
        基础心智: z.coerce.number().optional().prefault(20),
      })
      .prefault({ 名称: '人类', 基础生命值: 20, 基础心智: 20 }),
    属性: z
      .record(z.string(), z.union([z.coerce.number(), AttributeDetailSchema]))
      .transform(input => {
        const defaultAttrs = { STR: 30, DEX: 30, PER: 30, TGH: 30, WIL: 30, INT: 30, CHA: 30 };
        const attrMap: Record<string, string> = {
          力量: 'STR',
          敏捷: 'DEX',
          感知: 'PER',
          体质: 'TGH',
          意志: 'WIL',
          智力: 'INT',
          魅力: 'CHA',
        };
        const finalOutput: Record<string, { 基础: number; 加成: number }> = {};
        for (const key in defaultAttrs) {
          finalOutput[key] = { 基础: defaultAttrs[key as keyof typeof defaultAttrs], 加成: 0 };
        }
        for (const rawKey in input) {
          const stdKey = attrMap[rawKey] || rawKey.toUpperCase();
          if (Object.prototype.hasOwnProperty.call(defaultAttrs, stdKey)) {
            const value = input[rawKey];
            if (typeof value === 'object' && value !== null && '基础' in value) {
              finalOutput[stdKey] = { 基础: Number(value.基础) || defaultAttrs[stdKey as keyof typeof defaultAttrs], 加成: Number(value.加成) || 0 };
            } else if (value !== undefined && value !== null && !Number.isNaN(Number(value))) {
              finalOutput[stdKey] = { 基础: Number(value), 加成: 0 };
            }
          }
        }
        return finalOutput;
      })
      .prefault({}),
    特质: z.record(z.string(), z.string()).prefault({}),
    创伤: z
      .object({
        等级: z.coerce.number().transform(v => _.clamp(v, 0, 4)).prefault(0),
        描述: z.string().prefault(''),
      })
      .prefault({ 等级: 0, 描述: '' }),
    背包: z
      .object({
        负重: z
          .object({
            当前: z.coerce.number().prefault(0),
            最大: z.coerce.number().prefault(100),
          })
          .prefault({ 当前: 0, 最大: 100 }),
        物品: z
          .record(
            z.string().describe('物品名'),
            z.object({
              介绍: z.string().prefault(''),
              数量: z.coerce.number().prefault(1),
              重量: z.coerce.number().prefault(0),
              价值: z.coerce.number().prefault(0),
            }),
          )
          .transform(data => _.pickBy(data, ({ 数量 }) => 数量 > 0))
          .prefault({}),
      })
      .prefault({}),
  });

// 包含所有自动计算逻辑的“规则”函数
const characterTransform = (data: any) => {
  if (typeof data !== 'object' || data === null) return data;
  const attrMap: Record<string, string> = {
    力量: 'STR',
    敏捷: 'DEX',
    感知: 'PER',
    体质: 'TGH',
    意志: 'WIL',
    智力: 'INT',
    魅力: 'CHA',
    STR: 'STR',
    DEX: 'DEX',
    PER: 'PER',
    TGH: 'TGH',
    WIL: 'WIL',
    INT: 'INT',
    CHA: 'CHA',
  };

  if (!data.属性) data.属性 = {};
  for (const key in { STR: 1, DEX: 1, PER: 1, TGH: 1, WIL: 1, INT: 1, CHA: 1 }) {
    if (data.属性[key]) data.属性[key].加成 = 0;
  }

  for (const desc of _.values(data.特质)) {
    if (!desc) continue;
    MODIFIER_REGEX.lastIndex = 0;
    const matches = desc.matchAll(MODIFIER_REGEX);
    for (const match of matches) {
      const attrName = match[1].toUpperCase();
      const value = parseInt(match[2].replace(/\s/g, ''), 10);
      const standardAttr = attrMap[attrName] || attrName;
      if (standardAttr && data.属性[standardAttr]) {
        data.属性[standardAttr].加成 += value;
      }
    }
  }

  const equipmentSources = [data.护甲?.特性, data.主武器?.特效, data.副武器?.特效];
  for (const source of equipmentSources) {
    if (!source) continue;
    for (const key in source) {
      const standardAttr = attrMap[key.toUpperCase()] || key.toUpperCase();
      if (standardAttr && data.属性[standardAttr] && typeof source[key] === 'number') {
        data.属性[standardAttr].加成 += source[key];
      }
    }
  }

  const finalAttrs: Record<string, number> = {};
  for (const key in data.属性) {
    finalAttrs[key] = (data.属性[key]?.基础 || 0) + (data.属性[key]?.加成 || 0);
  }

  while (data.经验值.当前 >= data.经验值.升级所需 && data.等级 < 100) {
    data.经验值.当前 -= data.经验值.升级所需;
    data.等级 += 1;
    data.属性点 += 5;
    if (data.等级 % 10 === 0) data.特质点 += 1;
    data.经验值.升级所需 = Math.floor(data.等级 * 10 + 100);
  }

  // --- 最大生命值计算 ---
  const getBodySizeModifier = (sizeStr: string) => {
    const size = parseFloat(sizeStr) || 0;
    if (size < 1.3) return -15;
    if (size < 1.6) return -8;
    if (size < 1.9) return 0;
    if (size < 2.2) return 8;
    return 15;
  };
  const bodySizeHpModifier = getBodySizeModifier(data.体型);
  let hpTraitModifier = 0;
  const hpModifierRegex = /(?:最大生命值|HP|血量)\s*[^\d\r\n]*([+-]?\s*\d+)/i;
  _.values(data.特质).forEach((desc: any) => {
    if (!desc) return;
    const match = desc.match(hpModifierRegex);
    if (match && match[1] && !/属性/.test(desc) && !/(?:固定为|设定为|就是)/.test(desc)) {
      hpTraitModifier += parseInt(match[1].replace(/\s/g, ''), 10);
    }
  });
  data.血量.最大 = Math.floor((data.种族.基础生命值 || 20) + finalAttrs.TGH * 0.4 + data.等级 * 2.5 + bodySizeHpModifier + hpTraitModifier);
  const hpFixedRegex = /(?:最大生命值).*(?:固定为|设定为|就是)\s*(\d+)/i;
  for (const desc of _.values(data.特质)) {
    if (!desc) continue;
    const match = desc.match(hpFixedRegex);
    if (match && match[1]) {
      data.血量.最大 = parseInt(match[1], 10);
      break;
    }
  }

  // --- 最大心智计算 ---
  if ((data.种族.名称 || '').includes('骨人')) {
    data.心智.最大 = 0;
  } else {
    let mindTraitModifier = 0;
    const mindModifierRegex = /(?:最大心智|心智)\s*[^\d\r\n]*([+-]?\s*\d+)/i;
    _.values(data.特质).forEach((desc: any) => {
      if (!desc) return;
      const match = desc.match(mindModifierRegex);
      if (match && match[1] && !/属性/.test(desc) && !/(?:固定为|设定为|就是)/.test(desc)) {
        mindTraitModifier += parseInt(match[1].replace(/\s/g, ''), 10);
      }
    });
    data.心智.最大 = Math.floor((data.种族.基础心智 || 20) + finalAttrs.WIL * 0.4 + data.等级 * 2.5 + 0 + mindTraitModifier);
    const mindFixedRegex = /(?:最大心智).*(?:固定为|设定为|就是)\s*(\d+)/i;
    for (const desc of _.values(data.特质)) {
      if (!desc) continue;
      const match = desc.match(mindFixedRegex);
      if (match && match[1]) {
        data.心智.最大 = parseInt(match[1], 10);
        break;
      }
    }
  }

  // --- 负重计算 ---
  const baseMaxWeight = Math.floor(finalAttrs.STR * 1.5);
  const traitWeightModifier = _.sumBy(_.values(data.特质), (desc: any) => {
    if (!desc) return 0;
    const match = desc.match(/(?:最大负重|负重上限)\s*([+-]\s*\d+)/);
    return match ? parseInt(match[1].replace(/\s/g, ''), 10) : 0;
  });
  data.背包.负重.最大 = baseMaxWeight + traitWeightModifier;
  data.背包.负重.当前 = _.round(
    _.sumBy(_.values(data.背包.物品), item => (item.重量 || 0) * (item.数量 || 0)),
    2,
  );

  // --- 最终数值约束 ---
  data.血量.当前 = _.clamp(data.血量.当前, 0, data.血量.最大);
  data.心智.当前 = _.clamp(data.心智.当前, 0, data.心智.最大);

  return data;
};

const CharacterSchema = CharacterSchemaBase.transform(characterTransform);

// [新增] 定义“往事”条目的结构
const PastEventSchema = z.object({
  日期: z.coerce.number().prefault(1),
  描述: z.string().prefault(''),
});

export const Schema = z.object({
  世界: z
    .object({
      天数: z.coerce.number().prefault(1),
      区域: z.string().prefault('未知区域'),
      城镇: z.string().prefault('未知城镇'),
      时间: z.string().prefault('上午'),
      金钱: z.coerce.number().prefault(0),
      当前事件: z.string().prefault(''),
    })
    .prefault({}),
  我方派系名称: z.string().prefault('无派系'),
  当前角色: CharacterSchemaBase.extend({
    立场: z.enum(['友方', '中立', '敌方']).prefault('友方'),
  })
    .transform(characterTransform)
    .prefault({}),
  小队成员: z.record(z.string(), CharacterSchema.or(z.literal('待初始化'))).prefault({}),
  视野: z.record(z.string(), CharacterSchema.or(z.literal('待初始化'))).prefault({}),
  局势: z
    .object({
      敌对派系: z.record(z.string(), z.string()).prefault({}),
      友方派系: z.record(z.string(), z.string()).prefault({}),
      世界局势: z.string().prefault(''),
    })
    .prefault({}),
  任务系统: z
    .record(
      z.string(),
      z
        .object({
          描述: z.string().prefault(''),
          奖励: z.string().prefault(''),
          主任务状态: z.string().prefault('进行中'),
          子任务: z
            .record(
              z.string(),
              z
                .object({
                  进度: z
                    .object({
                      当前: z.coerce.number().prefault(0),
                      目标: z.coerce.number().prefault(1),
                    })
                    .prefault({}),
                  状态: z.string().prefault('进行中'),
                })
                .prefault({}),
            )
            .prefault({}),
        })
        .transform(data => ({
          ...data,
          主任务状态:
            Object.keys(data.子任务).length > 0 && _(data.子任务).values().every(task => task.状态 === '已完成')
              ? '已完成'
              : '进行中',
        })),
    )
    .prefault({}),
  // [新增] 添加“往事”字段
  往事: z.array(PastEventSchema).prefault([]),
  闲言: z
    .object({
      当前内容: z.string().prefault(''),
    })
    .prefault({}),
});

$(() => {
  registerMvuSchema(Schema);
});
