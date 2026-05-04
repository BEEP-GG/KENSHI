/* eslint-disable */
// @ts-nocheck
import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';

// 定义通用的属性/技能解析正则表达式
const MODIFIER_REGEX =
  /(全属性|力量|敏捷|感知|体质|意志|智力|魅力|STR|DEX|PER|TGH|WIL|INT|CHA|潜行|运动|偷窃|撬锁|暗杀|侦查|科学|工程学|战地急救|机器人学|交易|说服|烹饪|火焰抗性|寒冷抗性|酸蚀抗性|毒素抗性|闪避|防护能力|DR)(?:属性|检定|加成|减益)?\s*([+-]\s*\d+)/gi;

// 定义一个辅助函数，用于将伤害类型中的百分比转换为小数
const parseDamageType = damageTypeStr => {
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
        if (!isNaN(num)) {
          return `${trimmedType}:${(num / 100).toString()}`;
        }
      }
      return part;
    })
    .join('/');
};

// 定义武器结构
const WeaponSchema = z.object({
  名字: z.string().prefault(''),
  种类: z.string().prefault('无'),
  品质: z.string().prefault('普通'),
  介绍: z.string().prefault(''),
  伤害骰: z.string().prefault('1d4'),
  伤害类型: z.string().transform(parseDamageType).prefault('钝伤:1.0'),
  价值: z.coerce.number().prefault(0),
});

// 定义护甲结构
const ArmorSchema = z.object({
  种类: z.enum(['重甲', '中甲', '轻甲', '无甲']).prefault('无甲'),
  '防护能力(DR)': z.coerce.number().prefault(0),
  介绍: z.string().prefault(''),
});

// 定义属性详细结构
const AttributeDetailSchema = z
  .object({
    基础: z.coerce.number().prefault(30),
    加成: z.coerce.number().prefault(0),
  })
  .prefault({ 基础: 30, 加成: 0 });

// 定义部位创伤结构
const PartTraumaSchema = z
  .object({
    等级: z.coerce
      .number()
      .transform(v => _.clamp(v, 0, 4))
      .prefault(0),
    描述: z.string().prefault(''),
  })
  .prefault({ 等级: 0, 描述: '' });

// 定义临时特质结构
const TemporaryTraitSchema = z
  .object({
    描述: z.string().prefault(''),
    消除: z.string().prefault(''),
  })
  .prefault({ 描述: '', 消除: '' });

// 角色基础“蓝图”定义
const CharacterSchemaBase = z.object({
  名字: z.string().prefault(''),
  性别: z.string().prefault('男'),
  年龄: z.union([z.coerce.number(), z.string()]).prefault(20),
  身份: z.string().prefault('自由人'),
  外貌: z.string().prefault(''),
  体型: z.string().prefault('1.75m'),
  状态: z.string().prefault('正常'),
  立场: z.enum(['友方', '中立', '敌方']).prefault('中立'),
  派系: z.string().prefault('无派系'),
  好感度: z.coerce.number().prefault(0),
  态度: z.string().prefault('陌生'),
  等级: z.coerce
    .number()
    .transform(v => _.clamp(v, 1, 100))
    .prefault(1),
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
      当前: z.coerce.number().prefault(1000),
      最大: z.coerce.number().prefault(1000),
    })
    .prefault({ 当前: 1000, 最大: 1000 }),
  心情: z
    .object({
      当前: z.coerce.number().prefault(100),
      最大: z.coerce.number().prefault(100),
      变化描述: z.array(z.string()).prefault([]),
    })
    .prefault({ 当前: 100, 最大: 100, 变化描述: [] }),
  种族: z
    .object({
      名称: z.string().prefault('人类'),
    })
    .prefault({ 名称: '人类' }),
  属性: z
    .record(z.string(), z.union([z.coerce.number(), AttributeDetailSchema]))
    .transform(input => {
      const defaultAttrs = { STR: 30, DEX: 30, PER: 30, TGH: 30, WIL: 30, INT: 30, CHA: 30 };
      const attrMap = { 力量: 'STR', 敏捷: 'DEX', 感知: 'PER', 体质: 'TGH', 意志: 'WIL', 智力: 'INT', 魅力: 'CHA' };
      const finalOutput = {};
      for (const key in defaultAttrs) {
        finalOutput[key] = { 基础: defaultAttrs[key], 加成: 0 };
      }
      for (const rawKey in input) {
        const stdKey = attrMap[rawKey] || rawKey.toUpperCase();
        if (defaultAttrs.hasOwnProperty(stdKey)) {
          const value = input[rawKey];
          if (typeof value === 'object' && value !== null && '基础' in value) {
            finalOutput[stdKey] = { 基础: Number(value.基础) || defaultAttrs[stdKey], 加成: Number(value.加成) || 0 };
          } else if (value !== undefined && value !== null && !isNaN(Number(value))) {
            finalOutput[stdKey] = { 基础: Number(value), 加成: 0 };
          }
        }
      }
      return finalOutput;
    })
    .prefault({}),
  特质: z.record(z.string(), z.string()).prefault({}),
  临时特质: z.record(z.string().describe('临时特质名'), TemporaryTraitSchema).prefault({}),
  创伤: z.record(z.string().describe('部位名称'), PartTraumaSchema).prefault({}),
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
            子分类: z
              .enum([
                '食物',
                '饮品',
                '武器',
                '装备',
                '医疗用品',
                '科研道具',
                '任务道具',
                '矿石',
                '布料',
                '原材料',
                '其他',
              ])
              .prefault('其他'),
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
const characterTransform = data => {
  if (typeof data !== 'object' || data === null) return data;
  const attrMap = {
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
    潜行: '潜行',
    运动: '运动',
    偷窃: '偷窃',
    撬锁: '撬锁',
    暗杀: '暗杀',
    侦查: '侦查',
    科学: '科学',
    工程学: '工程学',
    战地急救: '战地急救',
    机器人学: '机器人学',
    交易: '交易',
    说服: '说服',
    烹饪: '烹饪',
  };
  const coreAttributes = ['STR', 'DEX', 'PER', 'TGH', 'WIL', 'INT', 'CHA'];

  if (!data.属性) data.属性 = {};
  for (const key in { STR: 1, DEX: 1, PER: 1, TGH: 1, WIL: 1, INT: 1, CHA: 1 }) {
    if (data.属性[key]) data.属性[key].加成 = 0;
  }

  if (!data.临时特质) data.临时特质 = {};

  // 根据当前心情动态分配特质
  delete data.临时特质['心情低落'];
  delete data.临时特质['濒临崩溃'];
  delete data.临时特质['绝望'];
  delete data.临时特质['心情愉悦'];

  const currentMood = data.心情?.当前 !== undefined ? data.心情.当前 : 100;
  const maxMood = data.心情?.最大 !== undefined ? data.心情.最大 : 100;

  if (currentMood <= 10) {
    data.临时特质['绝望'] = { 描述: '全属性-50', 消除: '心情恢复到大于10' };
  } else if (currentMood < 25) {
    data.临时特质['濒临崩溃'] = { 描述: '全属性-30', 消除: '心情恢复到20及以上' };
  } else if (currentMood < 40) {
    data.临时特质['心情低落'] = { 描述: '全属性-15', 消除: '心情恢复到40及以上' };
  } else if (currentMood > maxMood * 0.9) {
    data.临时特质['心情愉悦'] = { 描述: '全属性+5', 消除: '心情比例降至90%及以下' };
  }

  // 根据护甲种类动态分配护甲重量特质
  delete data.临时特质['重甲妨碍'];
  delete data.临时特质['中甲妨碍'];
  delete data.临时特质['轻甲妨碍'];
  delete data.临时特质['无甲灵动'];

  const armorType = data.护甲?.种类;
  if (armorType === '重甲') {
    data.临时特质['重甲妨碍'] = { 描述: '敏捷-30', 消除: '卸下或更换重甲' };
  } else if (armorType === '中甲') {
    data.临时特质['中甲妨碍'] = { 描述: '敏捷-15', 消除: '卸下或更换中甲' };
  } else if (armorType === '轻甲') {
    data.临时特质['轻甲妨碍'] = { 描述: '敏捷-5', 消除: '卸下或更换轻甲' };
  } else if (armorType === '无甲') {
    data.临时特质['无甲灵动'] = { 描述: '敏捷+5', 消除: '穿上护甲' };
  }

  // 统一提取所有特质
  const permanentTraitDescs = _.values(data.特质);
  const temporaryTraitDescs = data.临时特质 ? _.map(_.values(data.临时特质), '描述') : [];
  const allDescriptions = [...permanentTraitDescs, ...temporaryTraitDescs];

  // 汇总来自特质的属性加成
  for (const desc of allDescriptions) {
    if (!desc) continue;
    MODIFIER_REGEX.lastIndex = 0;
    let match;
    while ((match = MODIFIER_REGEX.exec(desc)) !== null) {
      const rawAttrName = match[1].trim();
      const value = parseInt(match[2].replace(/\s/g, ''), 10);

      if (rawAttrName === '全属性') {
        for (const attr of coreAttributes) {
          if (data.属性[attr]) {
            data.属性[attr].加成 += value;
          }
        }
      } else {
        const standardAttr = attrMap[rawAttrName] || rawAttrName.toUpperCase();
        if (standardAttr && data.属性[standardAttr]) {
          data.属性[standardAttr].加成 += value;
        }
      }
    }
  }

  const finalAttrs = {};
  for (const key in data.属性) {
    finalAttrs[key] = (data.属性[key]?.基础 || 0) + (data.属性[key]?.加成 || 0);
  }

  // 骨人种族特殊规则：强制意志为100
  if ((data.种族?.名称 || '').includes('骨人')) {
    finalAttrs.WIL = 100;
  }

  // 升级逻辑与经验值校准
  if (data.经验值) {
    data.经验值.升级所需 = Math.floor(data.等级 * 10 + 100);
    while (data.经验值.当前 >= data.经验值.升级所需 && data.等级 < 100) {
      data.经验值.当前 -= data.经验值.升级所需;
      data.等级 += 1;
      data.属性点 += 7;
      if (data.等级 % 10 === 0) data.特质点 += 1;
      data.经验值.升级所需 = Math.floor(data.等级 * 10 + 100);
    }
  }

  // 攻击次数计算
  let baseAttacks = 1;
  const weaponType = data.主武器?.种类 || '空手';
  const dex = finalAttrs.DEX || 0;

  if (['武士刀类', '军刀类', '特殊远程'].includes(weaponType)) {
    if (dex < 40) baseAttacks = 1;
    else if (dex < 60) baseAttacks = 2;
    else if (dex < 85) baseAttacks = 3;
    else baseAttacks = 4;
  } else if (['钝器类', '大型类', '弩'].includes(weaponType)) {
    if (dex < 85) baseAttacks = 1;
    else baseAttacks = 2;
  } else if (dex < 60) baseAttacks = 1;
  else if (dex < 80) baseAttacks = 2;
  else baseAttacks = 3;

  if (dex >= 100) {
    baseAttacks += 1;
  }

  let attackModifier = 0;
  const attackModifierRegex = /攻击次数\s*([+-]\s*\d+)/i;
  allDescriptions.forEach(desc => {
    if (!desc) return;
    const match = desc.match(attackModifierRegex);
    if (match && match[1]) {
      attackModifier += parseInt(match[1].replace(/\s/g, ''), 10);
    }
  });
  data.攻击次数 = _.clamp(baseAttacks + attackModifier, 1, 99);

  // 最大生命值计算
  const getBodySizeModifier = sizeStr => {
    const size = parseFloat(sizeStr) || 0;
    if (size < 1.3) return -15;
    if (size < 1.6) return -8;
    if (size < 1.9) return 0;
    if (size < 2.2) return 8;
    return 15;
  };
  const bodySizeHpModifier = getBodySizeModifier(data.体型);
  let hpTraitModifier = 0;
  const hpModifierRegex = /(?:最大生命值|最大血量|HP|血量)\s*[^\d\r\n]*([+-]?\s*\d+)/i;
  allDescriptions.forEach(desc => {
    if (!desc) return;
    const match = desc.match(hpModifierRegex);
    if (match && match[1] && !/属性/.test(desc) && !/(?:固定为|固定|设定为|就是)/.test(desc)) {
      hpTraitModifier += parseInt(match[1].replace(/\s/g, ''), 10);
    }
  });
  data.血量.最大 = Math.floor(50 + finalAttrs.TGH * 2 + data.等级 * 1 + bodySizeHpModifier + hpTraitModifier);
  const hpFixedRegex = /(?:最大生命值|最大血量|HP|血量).*(?:固定为|固定|设定为|就是)\s*(\d+)/i;
  for (const desc of allDescriptions) {
    if (!desc) continue;
    const match = desc.match(hpFixedRegex);
    if (match && match[1]) {
      data.血量.最大 = parseInt(match[1], 10);
      break;
    }
  }

  // 最大心情值计算
  let moodTraitModifier = 0;
  const moodModifierRegex = /(?:最大心情值|心情上限)\s*[^\d\r\n]*([+-]?\s*\d+)/i;
  allDescriptions.forEach(desc => {
    if (!desc) return;
    const match = desc.match(moodModifierRegex);
    if (match && match[1] && !/属性/.test(desc) && !/(?:固定为|固定|设定为|就是)/.test(desc)) {
      moodTraitModifier += parseInt(match[1].replace(/\s/g, ''), 10);
    }
  });
  data.心情.最大 = Math.floor(50 + finalAttrs.WIL * 1.5 + moodTraitModifier);
  const moodFixedRegex = /(?:最大心情值|心情).*(?:固定为|固定|设定为|就是)\s*(\d+)/i;
  for (const desc of allDescriptions) {
    if (!desc) continue;
    const match = desc.match(moodFixedRegex);
    if (match && match[1]) {
      data.心情.最大 = parseInt(match[1], 10);
      break;
    }
  }

  // 负重计算
  const baseMaxWeight = Math.floor(finalAttrs.STR * 1.5);
  const traitWeightModifier = _.sumBy(allDescriptions, desc => {
    if (!desc) return 0;
    const match = desc.match(/(?:最大负重|负重上限)\s*([+-]\s*\d+)/);
    return match ? parseInt(match[1].replace(/\s/g, ''), 10) : 0;
  });
  data.背包.负重.最大 = baseMaxWeight + traitWeightModifier;
  data.背包.负重.当前 = _.round(
    _.sumBy(_.values(data.背包.物品), item => (item.重量 || 0) * (item.数量 || 0)),
    2,
  );

  // 最终数值约束
  data.血量.当前 = _.clamp(data.血量.当前, 0, data.血量.最大);
  data.心情.当前 = _.clamp(data.心情.当前, 0, data.心情.最大);

  // --- 骨人心智锁定特殊规则 ---
  // 覆盖计算，确保骨人不受其他特质和情绪计算影响
  if ((data.种族?.名称 || '').includes('骨人')) {
    data.心情.最大 = 100;
    data.心情.当前 = 100;
  }

  return data;
};

// 为视野内角色/通用NPC/小队成员定义的Schema
const CharacterSchema = CharacterSchemaBase.transform(characterTransform);
const TeammateCharacterSchema = CharacterSchema;
const RemoteCharacterSchema = CharacterSchemaBase.extend({
  所处地址: z.string().prefault('未知'),
}).transform(characterTransform);

// 定义“往事”基础条目的结构
const PastEventSchema = z.object({
  日期: z.coerce.number().prefault(1),
  描述: z.string().prefault(''),
});

export const Schema = z.object({
  世界: z.object({
    天数: z.coerce.number().prefault(1),
    区域: z.string().prefault('未知区域'),
    城镇: z.string().prefault('未知城镇'),
    时间: z.string().prefault('上午'),
    金钱: z.coerce.number().prefault(0),
    当前事件: z.string().prefault(''),
  }),
  我方派系名称: z.string(),
  当前角色: CharacterSchemaBase.extend({
    立场: z.enum(['友方', '中立', '敌方']).prefault('友方'),
  }).transform(characterTransform),
  小队成员: z.record(z.string(), TeammateCharacterSchema.or(z.literal('待初始化'))),
  视野: z.record(z.string(), CharacterSchema.or(z.literal('待初始化'))),
  异地: z.record(z.string(), RemoteCharacterSchema.or(z.literal('待初始化'))),
  局势: z.object({
    已知派系: z
      .record(
        z.string().describe('派系名称'),
        z.object({
          好感度: z.coerce
            .number()
            .transform(v => _.clamp(v, -100, 100))
            .prefault(0),
        }),
      )
      .prefault({}),
    敌对派系: z
      .record(
        z.string().describe('派系名称'),
        z.object({
          好感度: z.coerce.number().prefault(0),
          敌对原因: z.string().prefault(''),
        }),
      )
      .prefault({}),
    友方派系: z
      .record(
        z.string().describe('派系名称'),
        z.object({
          好感度: z.coerce.number().prefault(0),
          结盟原因: z.string().prefault(''),
        }),
      )
      .prefault({}),
  }),
  任务系统: z.record(
    z.string(),
    z
      .object({
        描述: z.string().prefault(''),
        奖励: z.string().prefault(''),
        主任务状态: z.string().prefault('进行中'),
        子任务: z
          .record(
            z.string(),
            z.object({
              进度: z
                .object({
                  当前: z.coerce.number().prefault(0),
                  目标: z.coerce.number().prefault(1),
                })
                .prefault({}),
              状态: z.string().prefault('进行中'),
            }),
          )
          .prefault({}),
      })
      .transform(data => ({
        ...data,
        主任务状态:
          Object.keys(data.子任务).length > 0 &&
          _(data.子任务)
            .values()
            .every(task => task.状态 === '已完成')
            ? '已完成'
            : '进行中',
      })),
  ),
  往事: z
    .object({
      交友记录: z.array(PastEventSchema).prefault([]),
      城镇记录: z.array(PastEventSchema).prefault([]),
      击杀记录: z.array(PastEventSchema).prefault([]),
    })
    .prefault({ 交友记录: [], 城镇记录: [], 击杀记录: [] }),
  闲言: z.object({
    当前内容: z.string().prefault(''),
  }),
});

$(() => {
  registerMvuSchema(Schema);
});
