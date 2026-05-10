import { waitUntil } from 'async-wait-until';
import _ from 'lodash';
import {
  Activity,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Crosshair,
  Eye,
  Flag,
  Heart,
  Settings,
  Shield,
  Skull,
  Sword,
} from 'lucide-react';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

type Faction = 'friendly' | 'enemy';
type SubFaction = 'squad' | 'ally';
type Attributes = {
  STR: number;
  DEX: number;
  PER: number;
  TGH: number;
  WIL: number;
  INT: number;
  CHA: number;
};

type BackpackItem = {
  浠嬬粛?: string;
  鏁伴噺?: number;
  閲嶉噺?: number;
  浠峰€?: number;
  瀛愬垎绫?: string;
};

type BattleCharacter = {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  startHp: number;
  fractureStacks: number;
  faction: Faction;
  subFaction?: SubFaction;
  intent?: string;
  state: string;
  attributes: Attributes;
  weapon: {
    name: string;
    type: string;
    damageDice: string;
    damageType: string;
  };
  subWeapon: {
    name: string;
    type: string;
    damageDice: string;
    damageType: string;
  };
  armorDR: number;
  traumaParts: Record<'宸﹁噦' | '鍙宠噦' | '宸﹁吙' | '鍙宠吙', number>;
  traumaAccumulated: Record<'宸﹁噦' | '鍙宠噦' | '宸﹁吙' | '鍙宠吙', number>;
  bleedLayers: number;
  shockTurns: number;
  hasDowned: boolean;
  attackCount: number;
  mainWeaponAttackCount: number;
  subWeaponAttackCount: number;
  noBlockNextRound: boolean;
  defenseBonus: number;
  escaped: boolean;
  lowHpTraumaBoostUsed: boolean;
  hitBonusAgainst: Record<string, number>;
  raceName: string;
  backpackItems: Record<string, BackpackItem>;
  weaponRaw: any;
  subWeaponRaw: any;
  armorRaw: any;
  attributesRaw: any;
  traumaRaw: any;
};

type ActionType = { id: string; label: string; icon: React.ElementType; color: string; glow: string };

type BattleState = {
  round: number;
  units: BattleCharacter[];
  logs: string[];
  result: 'victory' | 'defeat' | null;
  endReason?: 'normal' | 'surrender';
  lastRoundAttackersCount: Record<string, number>;
  nonLethalActorIds: string[]; // 闈炶嚧鍛芥ā寮忥細鎸夎鑹叉寕閽?};

type BattleOutcome =
  | '閰ｇ晠澶ц儨'
  | '鐣ュ涓婇'
  | '琛€鎴橀櫓鑳?
  | '鍔垮潎鍔涙晫'
  | '琛€鎴樻儨璐?
  | '鐣ュ涓嬮'
  | '鎮叉儴澶辫触'
  | '鍙茶瘲澶ф嵎'
  | '鎶曢檷';

const OUTCOME_DESCRIPTIONS: Record<BattleOutcome, string> = {
  閰ｇ晠澶ц儨: '鎴戝啗鍔垮鐮寸锛屼互鏋佸井浼や骸灏嗘晫涓诲姏鍏ㄧ嚎鍑绘簝锛岃耽寰楅叄鐣呮穻婕撱€?,
  鐣ュ涓婇: '澶ф垬鍚庝簰鏈夋姌鎹燂紝鎴戝啗鏈€缁堝皢鏁岄樀閫奸€€锛岃壈闅炬帉鎺т簡鎴樺満涓诲姩鏉冦€?,
  琛€鎴橀櫓鑳? '韪╃潃灏稿北琛€娴锋嫾姝诲嚮閫€寮烘晫锛屾垜鍐涜櫧鎯ㄧ儓鍙栬儨锛屽皢澹凡浼や骸娈嗗敖銆?,
  鍔垮潎鍔涙晫: '鎴樺眬闄峰叆姝绘枟锛屽弻鏂逛激浜＄浉褰撶殕宸插姏绔紝渚濈劧鍍垫寔涓嶄笅銆?,
  琛€鎴樻儨璐? '灏嗗＋娴磋姝绘垬锛岃櫧浠ゆ晫鍐涗粯鍑烘儴閲嶄唬浠凤紝浠嶅洜鍔涚鑰屾姳鎲捐触閫€銆?,
  鐣ュ涓嬮: '鎴橀樀浜ら攱閬埌鍘嬪埗锛屾垜鏂规湭鍗犱紭鍔匡紝涓嶆晫鏁屾墜銆?,
  鎮叉儴澶辫触: '闃电嚎鍦熷穿鐡﹁В锛屾垜鏂规拨涓烘晫鏂硅剼涓嬬殑寰呭缇旂緤锛岃触寰楁儴缁濅汉瀵般€?,
  鍙茶瘲澶ф嵎: '缁濆涓互灏戣儨澶氾紝鎴樿儨寮轰簬宸辨柟鐨勬晫浜猴紝閾稿氨杞藉叆鍙插唽鐨勭璇濄€?,
  鎶曢檷: '鎴戝啗閫夋嫨浜嗘姇闄嶏紝鏄敓鏄鍏ㄧ湅鏁屾柟浜嗭紝鐪熸槸鍙偛鍟娿€?,
};

const OUTCOME_STYLES: Record<BattleOutcome, { title: string; glow: string; aura: string }> = {
  閰ｇ晠澶ц儨: {
    title: 'text-emerald-300 drop-shadow-[0_0_12px_rgba(16,185,129,0.9)]',
    glow: 'shadow-[0_0_50px_rgba(16,185,129,0.35)]',
    aura: 'bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.25),_transparent_60%)]',
  },
  鐣ュ涓婇: {
    title: 'text-emerald-300 drop-shadow-[0_0_10px_rgba(16,185,129,0.75)]',
    glow: 'shadow-[0_0_45px_rgba(16,185,129,0.3)]',
    aura: 'bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.2),_transparent_60%)]',
  },
  琛€鎴橀櫓鑳? {
    title: 'text-emerald-200 drop-shadow-[0_0_10px_rgba(52,211,153,0.7)]',
    glow: 'shadow-[0_0_40px_rgba(16,185,129,0.28)]',
    aura: 'bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_60%)]',
  },
  鍔垮潎鍔涙晫: {
    title: 'text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.85)]',
    glow: 'shadow-[0_0_50px_rgba(251,191,36,0.35)]',
    aura: 'bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.25),_transparent_60%)]',
  },
  琛€鎴樻儨璐? {
    title: 'text-rose-300 drop-shadow-[0_0_12px_rgba(248,113,113,0.85)]',
    glow: 'shadow-[0_0_50px_rgba(248,113,113,0.35)]',
    aura: 'bg-[radial-gradient(circle_at_top,_rgba(248,113,113,0.22),_transparent_60%)]',
  },
  鐣ュ涓嬮: {
    title: 'text-rose-300 drop-shadow-[0_0_10px_rgba(248,113,113,0.75)]',
    glow: 'shadow-[0_0_45px_rgba(248,113,113,0.3)]',
    aura: 'bg-[radial-gradient(circle_at_top,_rgba(248,113,113,0.2),_transparent_60%)]',
  },
  鎮叉儴澶辫触: {
    title: 'text-red-300 drop-shadow-[0_0_14px_rgba(239,68,68,0.9)]',
    glow: 'shadow-[0_0_55px_rgba(239,68,68,0.4)]',
    aura: 'bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.25),_transparent_60%)]',
  },
  鍙茶瘲澶ф嵎: {
    title: 'text-amber-200 drop-shadow-[0_0_16px_rgba(250,204,21,1)] animate-pulse',
    glow: 'shadow-[0_0_70px_rgba(250,204,21,0.55)]',
    aura: 'bg-[conic-gradient(from_180deg_at_50%_0%,_rgba(250,204,21,0.35),_rgba(251,191,36,0.15),_rgba(250,204,21,0.35))]',
  },
  鎶曢檷: {
    title: 'text-stone-300 drop-shadow-[0_0_12px_rgba(148,163,184,0.7)]',
    glow: 'shadow-[0_0_40px_rgba(148,163,184,0.25)]',
    aura: 'bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.2),_transparent_60%)]',
  },
};

const BATTLE_RULES = `鎴樻枟杞粨鏋?
1. 椤轰綅闃舵:
   - 閫昏緫: 鎸夎鑹茬殑銆愭晱鎹枫€戝€间粠楂樺埌浣庢帓搴忋€?   - 鐗规畩: 鏁忔嵎鐩稿悓鑰咃紝銆愭劅鐭ャ€戦珮鑰呬紭鍏堬紱鑻ヤ粛鐩稿悓锛屽悓鏃惰鍔ㄣ€?
2. 琛屽姩闃舵:
   - 閫昏緫: 瑙掕壊鏍规嵁姝﹀櫒绉嶇被鍜屾晱鎹风瓑绾э紝鎵ц鍏跺搴旂殑銆愭敾鍑绘鏁般€戙€?   - 娴佺▼: 姣忔鏀诲嚮閮介渶鐙珛瀹屾垚鈥滄敾鍑?瀵规姉-缁撶畻鈥濆惊鐜€?
鏀诲嚮涓庡鎶楁祦绋?
绗竴姝闂伩:
  - 闃插畧鏂归棯閬垮€? (鏁忔嵎 * 0.5) + (鎰熺煡 * 0.2)锛屾渶楂樹笉瓒呰繃70
  - 杩涙敾鏂规姇鎺? D100锛?1-05涓哄ぇ澶辫触锛?  - 鍒ゅ畾: 闃插畧鏂归棯閬垮€?鈮?杩涙敾鏂规姇鎺风粨鏋?  - 缁撴灉: 澶辫触鍒欐湰娆℃敾鍑昏惤绌猴紱鎴愬姛鍒欒繘鍏ャ€愬鎶楅槻寰°€戦樁娈点€?
绗簩姝灞炴€у鎶楅槻寰?
  - 闃插尽鏂瑰熀纭€鍊?
      姝﹀櫒鏍兼尅: 鈥?鏁忔嵎 * 0.5 + 鍔涢噺 * 0.2)鈥?      绌烘墜闂伩: 鈥?鏁忔嵎 * 0.6 + 鎰熺煡 * 0.2)鈥?  - 瀵规姉淇:
      鏈€缁堥槻寰℃垚鍔?= 闃插尽鏂瑰熀纭€鍊?+ (闃插尽鏂规晱鎹?- 鏀诲嚮鏂规晱鎹?
  - 闃插尽鍒ゅ畾: 闃插尽鏂规姇鎺?D100 <= 鏈€缁堥槻寰°€?  - 闃插尽缁撴灉:
      闂伩鎴愬姛: 鍏嶇柅鍏ㄩ儴浼ゅ锛屾敾鍑荤粨鏉熴€?      鏍兼尅鎴愬姛: 鍏嶇柅 100% 鍒囧壊浼ゅ锛屽彈鍒?50% 閽濅激銆?      闃插尽澶辫触: 杩涘叆銆愪激瀹崇粨绠椼€戦樁娈点€?
浼ゅ缁撶畻娴佺▼:
绗竴姝浼ゅ璁＄畻:
  - 闈㈡澘璁＄畻: 鈥滄鍣ㄥ熀纭€楠板瓙缁撴灉 + (鍔涢噺 - 20) * 0.4鈥?  - 浼ゅ鎷嗗垎: 鏍规嵁姝﹀櫒姣斾緥锛屽皢闈㈡澘浼ゅ鎷嗗垎涓恒€愬垏鍓蹭激瀹炽€戜笌銆愰挐浼や激瀹炽€戙€?
绗簩姝鎶ょ敳杩囨护:
  - 鍒囧壊缁撶畻: 鈥渕ax(0, 鍒囧壊浼ゅ - 鎶ょ敳鍥哄畾鍑忎激DR)鈥?  - 閽濅激缁撶畻: 鐩存帴閫忎紶 (鏃犺DR)
  - 鏈€缁堜激瀹? 鈥滃垏鍓茬粨绠?+ 閽濅激缁撶畻鈥?
绗笁姝鐘舵€佷笌鐢熷懡缁撶畻:
  - 閫昏緫: 浠庣洰鏍?HP 涓墸闄ゆ渶缁堜激瀹炽€?  - 鍒涗激鍒ゅ畾 (鑴氭湰瑙﹀彂鏉′欢):
      鏉′欢A: 鏈鏈€缁堜激瀹?> (鐩爣浣撹川 * 0.4)
      鏉′欢B: 鏀诲嚮鏂瑰懡涓瀹氫负澶ф垚鍔?(01-07)
      婊¤冻浠讳竴鏉′欢锛岄殢鏈洪儴浣嶃€愬垱浼ょ瓑绾с€?1锛屽苟瑙﹀彂鐩稿簲灞傜骇鐨勬畫搴?鍑忓€兼晥鏋溿€?  - 婵掓鍒ゅ畾:
      HP > 0: 缁х画鎴樻枟銆?      HP <= 0 (棣栨鍊掑湴): 瑙﹀彂闊ф€ф瀹氥€?
鐗规畩瑙勫垯:
- 杩炲嚮鏈哄埗: 鑻ヨ鑹叉嫢鏈夊娆℃敾鍑绘鏁帮紝闃插尽鏂瑰湪鍚屼竴杞唴闃插尽鍚庣画鏀诲嚮鏃讹紝銆愭渶缁堥槻寰℃垚鍔熺巼銆戞瘡涓嬬疮绉?-10銆?- 澶ф垚鍔熶笌澶уけ璐?
    鏀诲嚮澶ф垚鍔?(01-07): 浼ゅ缁撶畻x1.5涓旀棤娉曟牸鎸°€?    姝︽湳渚嬪:
      閫熷害鍨?DEX>=STR): 澶ф垚鍔熷尯闂?1-10锛岃Е鍙戦澶栨敾鍑?娆°€?      閲嶅嚮鍨?STR>DEX): 澶ф垚鍔熷尯闂?1-07锛屼激瀹硏2涓旀棤瑙?鐐笵R銆?    鏀诲嚮澶уけ璐?(01-05): 鏀诲嚮鑰呭け鍘诲钩琛★紝涓嬩竴杞棤娉曟墽琛屾牸鎸★紝涓旈槻寰℃柟鍙幏寰椾竴娆″嵆鏃跺弽鍑汇€?- 婵掓涓庨煣鎬?
    鍊掑湴鍒ゅ畾: 褰?HP 褰掗浂鏃讹紝瑙掕壊闇€杩涜涓€娆°€愪綋璐ㄣ€戞瀹氥€?    鎴愬姛: 淇濇寔娓呴啋锛堝彲灏濊瘯鐖閫冭窇鎴栬姝伙級銆?    澶辫触: 闄峰叆浼戝厠鐘舵€併€?- 閫冭窇:
    瑙掕壊閫夋嫨鈥滈€冭窇鈥濇椂锛屽厛鎺蜂竴娆?d100銆?    鎶娾€滃熀纭€閫冭窇鎯╃綒 + 琚攣瀹氭儵缃?+ 鍒涗激鎯╃綒 + 鐘舵€佹儵缃氣€濆姞鎬伙紝鎴愬姛鐜?= 60 鈭?鎬绘儵缃氥€傝嫢鎺烽鍊?鈮?鎴愬姛鐜囧垯閫冭窇鎴愬姛锛?    鍙﹀鏈夊皬鎴愬姛淇濆簳锛氭幏楠?鈮?5 涓斿垱浼ゆ儵缃?< 25 涓旂姸鎬佹儵缃?< 30 涔熺畻鎴愬姛銆傝嫢鍒涗激鎯╃綒鎴栫姸鎬佹儵缃氳揪鍒扳€滄棤娉曠Щ鍔ㄢ€濈殑绾у埆锛屽垯鐩存帴鍒ゅ畾澶辫触銆?
`;

const PANEL_TUTORIAL = `鎴樻枟闈㈡澘鏁欑▼锛?锛堝緟琛ュ厖锛塦;

const WEAPON_CATEGORY_GUIDE = `姝﹀櫒绫诲埆璇﹁В锛?
姝﹀＋鍒€锛?- 姣忔瀵圭洰鏍囬€犳垚鏈DR鏍兼尅鐨勫垏鍓蹭激瀹虫椂锛屽鐩爣鏂藉姞1灞傗€滄祦琛€鈥濄€傛祦琛€姣忓洖鍚堝紑濮嬫椂閫犳垚1鐐圭洿鎺ヤ激瀹筹紝鍙彔鍔犮€?- 鍩虹鏀婚€熶负3銆?
鍐涘垁锛?- 瑁呭鍐涘垁绫绘鍣ㄦ椂锛屸€滄鍣ㄦ牸鎸♀€濆熀纭€鍊?12銆?
鐮嶅垁锛?- 鏃犺瀵规柟7鐐笵R銆?- 鏀诲嚮妫€瀹氬ぇ鎴愬姛锛?1-07锛夋椂瑙﹀彂鈥滅牬鐢测€濓細鐩爣DR闄嶄綆8锛堝彲鍙犲姞锛屽璇ョ洰鏍囧叏灞€鐢熸晥锛夈€?
闀挎焺绫伙細
- 姣忔鏀诲嚮鏃跺彲閫夋嫨鏈€澶?涓晫浜鸿繘琛屾敾鍑绘瀹氾紱姣忓涓€涓洰鏍囷紝鏀诲嚮妫€瀹?7銆?
閽濆櫒锛?- 鏀诲嚮妫€瀹氬ぇ鎴愬姛锛?1-07锛夋椂锛岀洰鏍囧繀瀹氳幏寰?灞傗€滈鎶樷€濓紱姣忓眰楠ㄦ姌浣垮姏閲?鏁忔嵎-10銆侀€冭窇妫€瀹?15锛堝彲鍙犲姞锛岀洿鍒板す鏉垮寘娓呴櫎锛夈€?
澶у瀷姝﹀櫒锛?- 姣忔鏀诲嚮鏃跺2涓晫浜鸿繘琛屾敾鍑绘瀹氥€?- 鏀诲嚮妫€瀹氬ぇ澶辫触锛?0-100锛夋垨涓ゅ悕鐩爣鍧囪銆愰棯閬裤€戞椂锛岃繘鍏ュけ琛★紝闃插尽妫€瀹?15銆?
寮╋細
- 鍩虹鏁堟灉锛氭棤瑙嗗鏂?鐐笵R銆?- 鍩虹鏀婚€熶负1銆?- 澶уけ璐ヤ笉浼氳Е鍙戝弽鍑伙紝鑰屾槸璇激闃熷弸銆?- 寮╃煝鏁堟灉鍚庣画琛ュ厖銆?
寮擄細
- 澶уけ璐ヤ笉浼氳Е鍙戝弽鍑伙紝鑰屾槸璇激闃熷弸銆?- 绠煝鏁堟灉鍚庣画琛ュ厖銆?- 褰撳紦/寮╀綔涓轰富姝﹀櫒涓旀棤鍓鍣ㄦ椂锛岄槻寰℃椂鍙兘闂伩涓嶈兘鏍兼尅锛涜嫢鏈夊壇姝﹀櫒鍒欏彲姝ｅ父闃插尽銆?- 瀵瑰紦/寮╂敾鍑诲彧鑳介棯閬匡紝鏃犳硶鏍兼尅銆?
姝︽湳锛?- 璇嗗埆绉嶇被涓衡€滄鏈€濄€?- 閫熷害鍨嬶紙DEX>=STR锛夛細鍩虹鏀婚€?锛涘ぇ鎴愬姛鍖洪棿01-10锛岃Е鍙戦澶栨敾鍑?娆°€?- 閲嶅嚮鍨嬶紙STR>DEX锛夛細鍩虹鏀婚€?锛涙棤瑙?鐐笵R锛涘ぇ鎴愬姛鍖洪棿01-07锛屼激瀹硏2銆?- 涓ょ姝︽湳鐨勪激瀹虫瘮渚嬪潎娌跨敤鍙橀噺涓殑浼ゅ姣斾緥銆?- 澶уけ璐ヤ笌鍏朵粬姝﹀櫒涓€鑷淬€俙;

const TRAUMA_RULES = `鍒涗激涓庣姸鎬佽瑙ｏ細

鍩虹娴佺▼锛?- 姣忔鍛戒腑闅忔満涓€涓儴浣嶏紙宸﹁噦/鍙宠噦/宸﹁吙/鍙宠吙锛夛紝璇ラ儴浣嶉槇鍊间細琚湰娆′激瀹冲墛鍑忋€?- 闃堝€奸檷鍒?浼氬崌绾у埌涓嬩竴绛夌骇锛岃秴棰濅細缁х画鎶垫墸涓嬩竴绛夌骇闃堝€笺€?
鍗囩骇鏉′欢锛圱GH=浣撹川锛孒Pmax=鏈€澶х敓鍛藉€硷級锛?- 0鈫?锛氭敾鍑诲ぇ鎴愬姛 鎴?闃堝€煎綊闆讹紙闃堝€?0.85*TGH锛?- 1鈫?锛氭敾鍑诲ぇ鎴愬姛 鎴?鍗曟浼ゅ > TGH*0.45 鎴?闃堝€煎綊闆讹紙闃堝€?0.55*TGH锛?- 2鈫?锛氬崟娆′激瀹?> TGH*0.4 鎴?闃堝€煎綊闆讹紙闃堝€?0.45*TGH锛?- 3鈫?锛氬崟娆′激瀹?> TGH*0.3 鎴?闃堝€煎綊闆?- 浠绘剰绛夌骇鈫?锛氬崟娆′激瀹?鈮?HPmax*0.5
- 浠绘剰绛夌骇鈫?锛氬崟娆′激瀹?鈮?HPmax*0.7
- 浣庤鍔犳垚锛氳嫢鏈鍙楀嚮鍚?HP 鈮?HPmax*0.3锛屽垯鏁村満鎴樻枟浠呴娆¤Е鍙戜竴娆￠澶?1鍒涗激鍗囩骇锛堟渶澶氬埌4锛?
鍒涗激鏁堟灉锛?- 0 鏃犳晥鏋?- 1 鎿︿激锛氳噦鍛戒腑/闃插尽-5锛涜吙韬查伩/閫冭窇-5
- 2 璐熶激锛氳噦鍛戒腑/闃插尽-10锛涜吙韬查伩/閫冭窇-10
- 3 閲嶅垱锛氳噦鍛戒腑/闃插尽-25锛涜吙韬查伩/閫冭窇-25
- 4 鏂偄锛氬乏鑷傚け鍘诲壇姝﹀櫒/鍙宠噦澶卞幓涓绘鍣紱鑵挎棤娉曡翰閬?閫冭窇

澹皵瑙勫垯锛堟剰蹇梂IL锛夛細
- WIL>80锛氬＋姘斾笉涓嬮檷锛屼笉浼氶€冭窇/鎶曢檷銆?- 鍒ゅ畾鏃舵満锛氭瘡鍥炲悎寮€濮?+ 鍙椾激鍚庛€?- 澹皵= 20 + WIL*1 + HP姣斾緥*35 鈭?鍒涗激鎯╃綒(1:-3/2:-7/3:-12/4:-18) 鈭?鎹熷け鎯╃綒(姝讳骸-13/浼戝厠-8/閫冭窇-6)銆?- 闃堝€硷細<40鎾ら€€锛涙挙閫€澶辫触涓ゆ鍚庤繘琛?d6锛?-3鎶曢檷锛?-6鍐虫鎴樻枟銆?
鐘舵€佹彁绀猴細
- 澶辫　/娴佽/楠ㄦ姌/鐪╂檿/浼戝厠/姝讳骸绛変細鍦ㄩ潰鏉跨姸鎬佹爮鏄剧ず銆俙;

const SETTLEMENT_LOG = '銆愮粨绠椼€戠偣鍑绘煡鐪嬫垬鏂楁€荤粨';

type DamageRatio = { cut: number; blunt: number };

type TutorialStep = {
  key: 'auto' | 'attack' | 'tactics' | 'surrender' | 'end_round';
  title: string;
  quote: string;
  description: string;
};

const tutorialSteps: TutorialStep[] = [
  {
    key: 'auto',
    title: '鑷姩閫夋嫨',
    quote: '鈥滄垜鍙兂璁゛i甯垜閫夆€?,
    description: '姣忎釜灏忛槦鎴愬憳瑙掕壊浼氳嚜鍔ㄩ€夋嫨鏀诲嚮鐩爣銆?,
  },
  {
    key: 'attack',
    title: '鏀诲嚮',
    quote: '鈥滅湅璋佷笉鐖藉氨骞茶皝鈥?,
    description: '鐐瑰嚮宸︿晶瑙掕壊锛岄€夋嫨鍙充晶鏁屾柟鎴愬憳骞叉浠栥€?,
  },
  {
    key: 'tactics',
    title: '鎴樻湳',
    quote: '鈥滆鎴戞兂鎯冲仛鐐逛粈涔堚€?,
    description: '閫夋嫨鐩稿簲鐨勬垬鏈紝杩涜鎶夋嫨銆?,
  },
  {
    key: 'surrender',
    title: '鎶曢檷',
    quote: '鈥滄垜涓嶆墦浜嗭紝瀵规垜鍋氫粈涔堥兘鍙互鍝鈥?,
    description: '鐩存帴鍒ゅ畾澶辫触銆?,
  },
  {
    key: 'end_round',
    title: '鍥炲悎缁撴潫',
    quote: '鈥滃瓧闈㈡剰鎬濃€?,
    description: '瀛楅潰鎰忔€濄€?,
  },
];

const actions: ActionType[] = [
  {
    id: 'attack',
    label: '鏀诲嚮',
    icon: Crosshair,
    color: 'text-red-400 border-red-900/50 hover:bg-red-950/40 hover:border-red-500/50',
    glow: 'group-hover:shadow-[0_0_20px_rgba(248,113,113,0.3)]',
  },
  {
    id: 'subdue',
    label: '鍒舵湇',
    icon: Shield,
    color: 'text-emerald-400 border-emerald-900/50 hover:bg-emerald-950/40 hover:border-emerald-500/50',
    glow: 'group-hover:shadow-[0_0_20px_rgba(52,211,153,0.3)]',
  },
  {
    id: 'tactics',
    label: '鎴樻湳',
    icon: BookOpen,
    color: 'text-blue-400 border-blue-900/50 hover:bg-blue-950/40 hover:border-blue-500/50',
    glow: 'group-hover:shadow-[0_0_20px_rgba(96,165,250,0.3)]',
  },
  {
    id: 'surrender',
    label: '鎶曢檷',
    icon: Flag,
    color: 'text-stone-400 border-stone-700/50 hover:bg-stone-800/40 hover:border-stone-400/50',
    glow: 'group-hover:shadow-[0_0_20px_rgba(168,162,158,0.3)]',
  },
  {
    id: 'end_round',
    label: '鍥炲悎缁撴潫',
    icon: ChevronRight,
    color: 'text-fuchsia-300 border-fuchsia-900/50 hover:bg-fuchsia-950/40 hover:border-fuchsia-500/50',
    glow: 'group-hover:shadow-[0_0_20px_rgba(217,70,239,0.35)]',
  },
];

const d100 = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return (buffer[0] % 100) + 1;
  }
  return Math.floor(Math.random() * 100) + 1;
};

const rollDice = (dice: string) => {
  const match = dice.match(/(\d+)d(\d+)/i);
  if (!match) return _.toNumber(dice) || 0;
  const count = Number(match[1]) || 1;
  const sides = Number(match[2]) || 6;
  return _.sum(Array.from({ length: count }, () => _.random(1, sides)));
};

const parseDamageTypeRatio = (damageType: string): DamageRatio | null => {
  if (!damageType) return null;
  const normalized = damageType.replace(/锛?g, '/').replace(/銆?g, '/');
  const entries = normalized
    .split('/')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const [rawKey, rawValue] = part.split(':');
      if (!rawKey || rawValue === undefined) return null;
      const key = rawKey.trim();
      const valueStr = rawValue.trim();
      if (!valueStr) return null;
      let value = Number.parseFloat(valueStr.replace('%', ''));
      if (Number.isNaN(value)) return null;
      if (valueStr.includes('%')) value /= 100;
      return { key, value };
    })
    .filter(Boolean) as { key: string; value: number }[];

  if (!entries.length) return null;

  let cut = 0;
  let blunt = 0;

  for (const entry of entries) {
    if (entry.key.includes('鍒囧壊')) cut += entry.value;
    if (entry.key.includes('閽濅激') || entry.key.includes('鐮寸敳')) blunt += entry.value;
  }

  const total = cut + blunt;
  if (total <= 0) return null;

  return {
    cut: _.round(cut / total, 4),
    blunt: _.round(blunt / total, 4),
  };
};

const getDamageRatio = (weaponType: string, damageType: string) => {
  const parsed = parseDamageTypeRatio(damageType);
  if (parsed) return parsed;
  const type = (weaponType || '').toLowerCase();
  if (/(閿妫峾妫抾閿弢閽潀鎷硘鐮寸敳|閽夐敜)/.test(type)) return { cut: 0.2, blunt: 0.8 };
  if (/(鏂鍒€|鍓憒鍖晐闀皘鍒億闀垮垁)/.test(type)) return { cut: 0.8, blunt: 0.2 };
  if (/(鏋獆鐭泑闀挎灙)/.test(type)) return { cut: 0.6, blunt: 0.4 };
  return { cut: 0.5, blunt: 0.5 };
};

const isRangedWeapon = (weaponType: string) => /(寮搢寮﹟杩滅▼|鏋?/.test(weaponType || '');
const isBowOrCrossbow = (weaponType: string) => /(寮搢寮?/.test(weaponType || '');

const toNumber = (value: unknown, fallback = 0) => {
  const num = _.toNumber(value);
  return Number.isFinite(num) ? num : fallback;
};

const LEGACY_ITEM_SUBCATEGORY_MAP: Record<string, string> = {
  瑁呭: '鎶ょ敳',
  姝﹀櫒鏉愭枡: '鐭跨煶',
  鎶ょ敳鏉愭枡: '甯冩枡',
};

const normalizeItemSubCategory = (subCategory: unknown) => {
  const value = String(subCategory || '').trim();
  if (!value) return '';
  return LEGACY_ITEM_SUBCATEGORY_MAP[value] || value;
};

const normalizeBackpackItems = (items: unknown): Record<string, BackpackItem> => {
  if (!items || typeof items !== 'object') return {};
  return Object.entries(items as Record<string, BackpackItem>).reduce<Record<string, BackpackItem>>(
    (acc, [name, item]) => {
      const source = item && typeof item === 'object' ? item : {};
      acc[name] = {
        ...source,
        瀛愬垎绫? normalizeItemSubCategory((source as BackpackItem).瀛愬垎绫?,
      };
      return acc;
    },
    {},
  );
};

const MEDICAL_ITEM_NAMES = [
  '鍩虹鎬ユ晳鍖?,
  '鏍囧噯鎬ユ晳鍖?,
  '楂樼骇鎬ユ晳鍖?,
  '鏅€氬す鏉垮寘',
  '楂樼骇澶规澘鍖?,
  '楠ㄤ汉淇悊鍖?,
  '楠ㄤ汉淇悊绠?,
];

const isMedicalBackpackItem = (name: string, item: BackpackItem | undefined) => {
  if (MEDICAL_ITEM_NAMES.includes(name)) return true;
  return normalizeItemSubCategory(item?.瀛愬垎绫? === '鍖荤枟鐢ㄥ搧';
};

const sumHpByFaction = (units: BattleCharacter[], faction: Faction, field: 'hp' | 'startHp') =>
  units
    .filter(unit => unit.faction === faction)
    .reduce((total, unit) => total + Math.max(0, toNumber(unit[field], 0)), 0);

const getBattleTotals = (units: BattleCharacter[]) => {
  const friendlyStart = sumHpByFaction(units, 'friendly', 'startHp');
  const enemyStart = sumHpByFaction(units, 'enemy', 'startHp');
  const friendlyEnd = sumHpByFaction(units, 'friendly', 'hp');
  const enemyEnd = sumHpByFaction(units, 'enemy', 'hp');
  const friendlyLossRate = friendlyStart > 0 ? _.clamp(1 - friendlyEnd / friendlyStart, 0, 1) : 1;
  const enemyLossRate = enemyStart > 0 ? _.clamp(1 - enemyEnd / enemyStart, 0, 1) : 1;
  const strengthRatio = enemyStart > 0 ? friendlyStart / enemyStart : 1;
  const friendlyAlive = friendlyEnd > 0.01;
  const enemyAlive = enemyEnd > 0.01;

  return {
    friendlyStart,
    enemyStart,
    friendlyEnd,
    enemyEnd,
    friendlyLossRate,
    enemyLossRate,
    strengthRatio,
    friendlyAlive,
    enemyAlive,
  };
};

const getFactionLossRate = (units: BattleCharacter[], faction: Faction) => {
  const start = sumHpByFaction(units, faction, 'startHp');
  const end = sumHpByFaction(units, faction, 'hp');
  return start > 0 ? _.clamp(1 - end / start, 0, 1) : 1;
};

const getFactionLossPenalty = (units: BattleCharacter[], faction: Faction) => {
  const factionUnits = units.filter(unit => unit.faction === faction);
  const deaths = factionUnits.filter(unit => unit.state === '姝讳骸').length;
  const shocks = factionUnits.filter(unit => unit.state === '浼戝厠').length;
  const escaped = factionUnits.filter(unit => unit.escaped).length;
  return deaths * 13 + shocks * 8 + escaped * 6;
};

const getTraumaPenaltyByLevel = (level: number) => {
  if (level >= 4) return 18;
  if (level === 3) return 12;
  if (level === 2) return 7;
  if (level === 1) return 3;
  return 0;
};

const getTraumaPenalty = (unit: BattleCharacter) =>
  _.sum(
    Object.values(unit.traumaParts || { 宸﹁噦: 0, 鍙宠噦: 0, 宸﹁吙: 0, 鍙宠吙: 0 }).map(level =>
      getTraumaPenaltyByLevel(level),
    ),
  );

const getMoraleScore = (unit: BattleCharacter, units: BattleCharacter[]) => {
  if (unit.attributes.WIL > 80) return 100;
  const hpRatio = unit.maxHp > 0 ? _.clamp(unit.hp / unit.maxHp, 0, 1) : 0;
  const traumaPenalty = getTraumaPenalty(unit);
  const lossPenalty = getFactionLossPenalty(units, unit.faction);
  const morale = 20 + unit.attributes.WIL * 1 + hpRatio * 100 * 0.35 - traumaPenalty - lossPenalty;
  return _.clamp(morale, 0, 100);
};

const applyMoraleOutcome = (
  units: BattleCharacter[],
  unit: BattleCharacter,
  logs: string[],
  reason: 'round' | 'damage',
  lastRoundAttackersCount: Record<string, number>,
) => {
  if (unit.attributes.WIL > 80) return units;
  if (unit.subFaction === 'squad') return units;
  if (unit.hp <= 0 || unit.escaped) return units;
  const morale = getMoraleScore(unit, units);
  if (morale < 40) {
    const failKey = 'morale_escape_failures';
    const currentFails = unit.hitBonusAgainst[failKey] || 0;
    const updatedFails = currentFails + 1;
    let updated = { ...unit, escaped: false, hitBonusAgainst: { ...unit.hitBonusAgainst, [failKey]: updatedFails } };
    appendLog(logs, `${unit.name}: 澹皵涓嶈冻锛岄€夋嫨鎾ら€€(${reason === 'round' ? '鍥炲悎寮€濮? : '鍙椾激'}鍒ゅ畾)銆俙);

    const escapeRoll = d100();
    const traumaPenalty = getEscapeTraumaPenalty(unit);
    const statusPenalty = getEscapeStatusPenalty(unit);
    const attackersCount = lastRoundAttackersCount[unit.id] ?? 0;

    if (traumaPenalty >= 9999 || statusPenalty >= 9999) {
      appendLog(logs, `${unit.name}: 鎾ら€€澶辫触锛屾棤娉曠Щ鍔ㄣ€俙);
    } else {
      const escapePenalty = getEscapePenalty(unit) + attackersCount * 15 + traumaPenalty + statusPenalty;
      const escapeChance = 70 - escapePenalty;
      const criticalEscape = escapeRoll <= 5 && traumaPenalty < 25 && statusPenalty < 30;
      appendLog(logs, `${unit.name}: 鎾ら€€鍒ゅ畾 d100=${escapeRoll} 鎴愬姛鐜?${Math.max(0, Math.round(escapeChance))}銆俙);
      if (escapeRoll <= escapeChance || criticalEscape) {
        updated = { ...updated, escaped: true };
        appendLog(logs, `${unit.name}: 鎾ら€€鎴愬姛(${escapeRoll}<${Math.max(0, Math.round(escapeChance))})銆俙);
      } else {
        appendLog(logs, `${unit.name}: 鎾ら€€澶辫触(${escapeRoll}>=${Math.max(0, Math.round(escapeChance))})銆俙);
      }
    }

    if (updatedFails >= 2) {
      const roll = _.random(1, 6);
      if (roll <= 3) {
        updated = {
          ...updated,
          escaped: true,
          state: '鎶曢檷',
          hitBonusAgainst: { ...updated.hitBonusAgainst, [failKey]: 0 },
        };
        appendLog(logs, `${unit.name}: 鎾ら€€澶辫触杩囧锛屾姇闄?1d6=${roll})銆俙);
      } else {
        updated = { ...updated, escaped: false, hitBonusAgainst: { ...updated.hitBonusAgainst, [failKey]: 0 } };
        appendLog(logs, `${unit.name}: 鎾ら€€澶辫触杩囧锛屽喅姝绘垬鏂?1d6=${roll})銆俙);
      }
    }

    return replaceUnit(units, updated);
  }
  return units;
};

const getBattleOutcome = (units: BattleCharacter[]): BattleOutcome => {
  const { friendlyLossRate, enemyLossRate, strengthRatio, friendlyAlive, enemyAlive } = getBattleTotals(units);

  if (friendlyAlive && !enemyAlive) {
    if (strengthRatio <= 0.7) return '鍙茶瘲澶ф嵎';
    if (friendlyLossRate <= 0.15) return '閰ｇ晠澶ц儨';
    if (friendlyLossRate <= 0.45) return '鐣ュ涓婇';
    return '琛€鎴橀櫓鑳?;
  }

  if (!friendlyAlive && enemyAlive) {
    if (enemyLossRate >= 0.6) return '琛€鎴樻儨璐?;
    if (enemyLossRate >= 0.3) return '鐣ュ涓嬮';
    return '鎮叉儴澶辫触';
  }

  if (friendlyAlive && enemyAlive) {
    const lossDiff = Math.abs(friendlyLossRate - enemyLossRate);
    if (lossDiff <= 0.15) return '鍔垮潎鍔涙晫';
    if (friendlyLossRate < enemyLossRate) {
      return friendlyLossRate <= 0.45 ? '鐣ュ涓婇' : '琛€鎴橀櫓鑳?;
    }
    return enemyLossRate >= 0.6 ? '琛€鎴樻儨璐? : '鐣ュ涓嬮';
  }

  return '鍔垮潎鍔涙晫';
};

const getTraumaThresholdByLevel = (tgh: number, level: number) => {
  if (level >= 4) return 0;
  if (level <= 0) return tgh * 0.85;
  if (level === 1) return tgh * 0.55;
  if (level === 2) return tgh * 0.45;
  return tgh * 0.4;
};

const getAttributeValue = (value: unknown, fallback = 30) => {
  if (value && typeof value === 'object') {
    const base = toNumber(_.get(value, ['鍩虹']), 0);
    const bonus = toNumber(_.get(value, ['鍔犳垚']), 0);
    const total = base + bonus;
    return Number.isFinite(total) && total > 0 ? total : fallback;
  }
  return toNumber(value, fallback);
};

const normalizeAttributes = (raw: any): Attributes => ({
  STR: getAttributeValue(_.get(raw, ['灞炴€?, 'STR']), 30),
  DEX: getAttributeValue(_.get(raw, ['灞炴€?, 'DEX']), 30),
  PER: getAttributeValue(_.get(raw, ['灞炴€?, 'PER']), 30),
  TGH: getAttributeValue(_.get(raw, ['灞炴€?, 'TGH']), 30),
  WIL: getAttributeValue(_.get(raw, ['灞炴€?, 'WIL']), 30),
  INT: getAttributeValue(_.get(raw, ['灞炴€?, 'INT']), 30),
  CHA: getAttributeValue(_.get(raw, ['灞炴€?, 'CHA']), 30),
});

const VALID_SUB_WEAPON_TYPE_REGEX = /(姝﹀＋鍒€|鐮嶅垁|鍐涘垁|澶у瀷|闀挎焺|閽濆櫒|寮搢寮﹟鐩剧墝)/;

const normalizeCharacter = (
  raw: any,
  name: string,
  faction: Faction,
  subFaction?: SubFaction,
): BattleCharacter | null => {
  if (!raw || typeof raw !== 'object') return null;
  const attributes = normalizeAttributes(raw);
  const level = Math.max(1, toNumber(_.get(raw, ['绛夌骇']), 1));
  const hp = Math.max(0, toNumber(_.get(raw, ['琛€閲?, '褰撳墠']), 100));
  const maxHp = Math.max(1, toNumber(_.get(raw, ['琛€閲?, '鏈€澶?]), hp || 100));
  const weapon = _.get(raw, ['涓绘鍣?], {});
  const weaponType = _.get(weapon, ['绉嶇被'], '鏃?);
  const weaponName = _.get(weapon, ['鍚嶅瓧'], weaponType);
  const weaponDice = _.get(weapon, ['浼ゅ楠?], '1d6');
  const weaponDamageType = _.get(weapon, ['浼ゅ绫诲瀷'], '');
  const subWeapon = _.get(raw, ['鍓鍣?], {});
  const subWeaponTypeRaw = _.get(subWeapon, ['绉嶇被'], '鏃?);
  const subWeaponNameRaw = _.get(subWeapon, ['鍚嶅瓧'], subWeaponTypeRaw);
  const subWeaponDiceRaw = _.get(subWeapon, ['浼ゅ楠?], '0d0');
  const subWeaponDamageTypeRaw = _.get(subWeapon, ['浼ゅ绫诲瀷'], '');
  const hasValidSubWeaponType = VALID_SUB_WEAPON_TYPE_REGEX.test(String(subWeaponTypeRaw || ''));
  const subWeaponType = hasValidSubWeaponType ? subWeaponTypeRaw : '鏃?;
  const subWeaponName = hasValidSubWeaponType ? subWeaponNameRaw : '鏃?;
  const subWeaponDice = hasValidSubWeaponType ? subWeaponDiceRaw : '0d0';
  const subWeaponDamageType = hasValidSubWeaponType ? subWeaponDamageTypeRaw : '';
  const armorRaw = _.get(raw, ['鎶ょ敳'], {});
  const armorBaseDR = toNumber(_.get(armorRaw, ['闃叉姢鑳藉姏(DR)']), toNumber(_.get(armorRaw, ['闃叉姢鑳藉姏']), 0));
  const armorDR = Math.max(0, armorBaseDR);
  const traumaRaw = _.get(raw, ['鍒涗激'], {});
  const getTraumaLevel = (part: '宸﹁噦' | '鍙宠噦' | '宸﹁吙' | '鍙宠吙') =>
    _.clamp(Math.floor(toNumber(_.get(traumaRaw, [part, '绛夌骇']), 0)), 0, 4);
  const getTraumaAccumulated = (part: '宸﹁噦' | '鍙宠噦' | '宸﹁吙' | '鍙宠吙') =>
    Math.max(0, toNumber(_.get(traumaRaw, [part, '绱Н鍙椾激']), 0));
  const traumaParts = {
    宸﹁噦: getTraumaLevel('宸﹁噦'),
    鍙宠噦: getTraumaLevel('鍙宠噦'),
    宸﹁吙: getTraumaLevel('宸﹁吙'),
    鍙宠吙: getTraumaLevel('鍙宠吙'),
  };
  const traumaAccumulated = {
    宸﹁噦: Math.max(0, getTraumaThresholdByLevel(attributes.TGH, traumaParts.宸﹁噦) - getTraumaAccumulated('宸﹁噦')),
    鍙宠噦: Math.max(0, getTraumaThresholdByLevel(attributes.TGH, traumaParts.鍙宠噦) - getTraumaAccumulated('鍙宠噦')),
    宸﹁吙: Math.max(0, getTraumaThresholdByLevel(attributes.TGH, traumaParts.宸﹁吙) - getTraumaAccumulated('宸﹁吙')),
    鍙宠吙: Math.max(0, getTraumaThresholdByLevel(attributes.TGH, traumaParts.鍙宠吙) - getTraumaAccumulated('鍙宠吙')),
  };
  const bleedLayers = Math.max(0, Math.floor(toNumber(_.get(raw, ['娴佽', '灞傛暟']), 0)));
  const shockTurns = Math.max(0, Math.floor(toNumber(_.get(raw, ['鐘舵€?, '浼戝厠鍥炲悎']), 0)));
  const variableAttackCount = Math.max(1, Math.floor(toNumber(_.get(raw, ['鏀诲嚮娆℃暟']), 0)) || 1);
  const isHeavyOrBlunt = /澶у瀷|閽濆櫒/.test(weaponType);
  const isMartialArts = /姝︽湳/.test(weaponType);
  const martialBaseAttackRate = attributes.DEX >= attributes.STR ? 3 : 2;
  const mainBaseAttackRate = isMartialArts
    ? martialBaseAttackRate
    : /姝﹀＋鍒€/.test(weaponType)
      ? 3
      : /寮?.test(weaponType)
        ? 1
        : isHeavyOrBlunt
          ? 1
          : 2;
  const mainWeaponAttackCount = variableAttackCount + mainBaseAttackRate;
  const subWeaponAttackCount = subWeaponType === '鐩剧墝' ? 1 : subWeaponType !== '鏃? ? variableAttackCount : 0;
  const attackCount = Math.max(1, mainWeaponAttackCount + subWeaponAttackCount);
  const raceName = String(_.get(raw, ['绉嶆棌', '鍚嶇О'], ''));
  const backpackItems = normalizeBackpackItems(_.get(raw, ['鑳屽寘', '鐗╁搧'], {}) || {});

  return {
    id: String(_.get(raw, ['id'], name) || name),
    name,
    level,
    hp,
    maxHp,
    startHp: hp,
    fractureStacks: 0,
    faction,
    subFaction,
    intent: _.get(raw, ['鎰忓浘'], undefined),
    state: _.get(raw, ['鐘舵€?], '姝ｅ父'),
    attributes,
    weapon: {
      name: weaponName || weaponType || '鏃?,
      type: weaponType || '鏃?,
      damageDice: weaponDice || '1d6',
      damageType: weaponDamageType || '',
    },
    subWeapon: {
      name: subWeaponName || subWeaponType || '鏃?,
      type: subWeaponType || '鏃?,
      damageDice: subWeaponDice || '0d0',
      damageType: subWeaponDamageType || '',
    },
    armorDR,
    traumaParts,
    traumaAccumulated,
    bleedLayers,
    shockTurns,
    hasDowned: false,
    attackCount,
    mainWeaponAttackCount,
    subWeaponAttackCount,
    noBlockNextRound: false,
    defenseBonus: 0,
    escaped: false,
    lowHpTraumaBoostUsed: false,
    hitBonusAgainst: {},
    raceName,
    backpackItems,
    weaponRaw: weapon,
    subWeaponRaw: subWeapon,
    armorRaw,
    attributesRaw: _.get(raw, ['灞炴€?], {}),
    traumaRaw,
  };
};

const buildUnitsFromStat = (stat: any) => {
  const units: BattleCharacter[] = [];
  const usedIds = new Set<string>();

  const pushUnit = (unit: BattleCharacter | null) => {
    if (!unit) return;
    if (unit.hp <= 0) return;
    if (usedIds.has(unit.id)) return;
    usedIds.add(unit.id);
    units.push(unit);
  };

  const current = _.get(stat, ['褰撳墠瑙掕壊']);
  const currentName = _.get(current, ['鍚嶅瓧'], _.get(current, ['鍚嶇О'], _.get(current, ['id'], '褰撳墠瑙掕壊'))) || '褰撳墠瑙掕壊';
  pushUnit(normalizeCharacter(current, currentName, 'friendly', 'squad'));

  const squad = _.get(stat, ['灏忛槦鎴愬憳'], {});
  _.forEach(squad, (value, key) => {
    if (value === '寰呭垵濮嬪寲') return;
    pushUnit(normalizeCharacter(value, String(key), 'friendly', 'squad'));
  });

  const vision = _.get(stat, ['瑙嗛噹'], {});
  _.forEach(vision, (value, key) => {
    if (value === '寰呭垵濮嬪寲') return;
    const stance = _.get(value, ['绔嬪満'], '涓珛');
    if (stance === '鏁屾柟') {
      pushUnit(normalizeCharacter(value, String(key), 'enemy'));
    } else if (stance === '鍙嬫柟') {
      pushUnit(normalizeCharacter(value, String(key), 'friendly', 'ally'));
    }
  });

  return {
    units,
    playerId: String(_.get(current, ['id'], currentName || '褰撳墠瑙掕壊')),
  };
};

const buildTurnOrder = (units: BattleCharacter[]) =>
  [...units]
    .filter(unit => unit.hp > 0 && !unit.escaped && !['姝讳骸', '浼戝厠', '鏄忚糠', '宸茶鍒舵湇'].includes(unit.state))
    .sort((a, b) => {
      if (a.attributes.DEX !== b.attributes.DEX) return b.attributes.DEX - a.attributes.DEX;
      if (a.attributes.PER !== b.attributes.PER) return b.attributes.PER - a.attributes.PER;
      return a.name.localeCompare(b.name, 'zh-Hans');
    });

const cloneUnits = (units: BattleCharacter[]) =>
  units.map(unit => ({
    ...unit,
    hitBonusAgainst: { ...unit.hitBonusAgainst },
  }));

const rollInjuryPart = () => ['宸﹁噦', '鍙宠噦', '宸﹁吙', '鍙宠吙'][_.random(0, 3)] as '宸﹁噦' | '鍙宠噦' | '宸﹁吙' | '鍙宠吙';

const getTraumaStageLabel = (level: number) => ['鏈彈鎹?, '鎿︿激', '璐熶激', '閲嶅垱', '鏂偄'][_.clamp(level, 0, 4)];

const getMaxTraumaLevel = (unit: BattleCharacter) =>
  Math.max(0, ...Object.values(unit.traumaParts || { 宸﹁噦: 0, 鍙宠噦: 0, 宸﹁吙: 0, 鍙宠吙: 0 }));

const getArmTraumaLevel = (unit: BattleCharacter) => Math.max(unit.traumaParts?.宸﹁噦 || 0, unit.traumaParts?.鍙宠噦 || 0);

const getLegTraumaLevel = (unit: BattleCharacter) => Math.max(unit.traumaParts?.宸﹁吙 || 0, unit.traumaParts?.鍙宠吙 || 0);

const getArmPenalty = (level: number) => {
  if (level >= 4) return 9999;
  if (level >= 3) return 25;
  if (level >= 2) return 10;
  if (level >= 1) return 5;
  return 0;
};

const getLegPenalty = (level: number) => {
  if (level >= 4) return 9999;
  if (level >= 3) return 25;
  if (level >= 2) return 10;
  if (level >= 1) return 5;
  return 0;
};

const getKillExpByLevel = (level: number) => {
  if (level > 80) return 30 + level * 3;
  if (level > 50) return 30 + level * 2.5;
  return 30 + level * 2;
};

const getDownExpByLevel = (level: number) => {
  if (level > 80) return 10 + level * 3;
  if (level > 50) return 10 + level * 2.5;
  return 10 + level * 2;
};

const getEscapeExpByLevel = (level: number) => getDownExpByLevel(level) * 0.3;

const getMediumCheckSuccess = (tgh: number) => {
  const chance = _.clamp((tgh - 30) / 2, 0, 100);
  return d100() <= chance;
};

const getUnit = (units: BattleCharacter[], id: string) => units.find(unit => unit.id === id);

const replaceUnit = (units: BattleCharacter[], updated: BattleCharacter) =>
  units.map(unit => (unit.id === updated.id ? updated : unit));

const setUnitIntent = (units: BattleCharacter[], id: string, intent: string) => {
  const unit = getUnit(units, id);
  if (!unit) return units;
  return replaceUnit(units, { ...unit, intent });
};

const isCombatReadyUnit = (unit: BattleCharacter) =>
  unit.hp > 0 && !unit.escaped && !['姝讳骸', '浼戝厠', '鏄忚糠', '宸茶鍒舵湇'].includes(unit.state);

const pickRandomTarget = (units: BattleCharacter[], faction: Faction) => {
  const candidates = units.filter(unit => unit.faction === faction && isCombatReadyUnit(unit));
  if (candidates.length === 0) return null;
  return candidates[_.random(0, candidates.length - 1)];
};

const getAttackPenalty = (unit: BattleCharacter) => {
  const armLevel = getArmTraumaLevel(unit);
  return getArmPenalty(armLevel);
};

const getDefensePenalty = (unit: BattleCharacter, useBlock: boolean) => {
  if (useBlock) {
    return getArmPenalty(getArmTraumaLevel(unit));
  }
  return getLegPenalty(getLegTraumaLevel(unit));
};

const getEscapePenalty = (unit: BattleCharacter) => {
  const penalty = getLegPenalty(getLegTraumaLevel(unit));
  if ((unit.fractureStacks || 0) > 0) return penalty + unit.fractureStacks * 15;
  return penalty;
};

const getEscapeTraumaPenalty = (unit: BattleCharacter) => {
  const maxTrauma = getMaxTraumaLevel(unit);
  if (maxTrauma >= 4) return 9999;
  if (maxTrauma >= 3) return 25;
  if (maxTrauma >= 2) return 15;
  if (maxTrauma >= 1) return 5;
  return 0;
};

const getEscapeStatusPenalty = (unit: BattleCharacter) => {
  if (unit.state === '浼戝厠' || unit.state === '鏄忚糠') return 9999;
  if (unit.hp <= 0 && unit.state !== '姝讳骸') return 30;
  return 0;
};

const getAttackAttribute = (attacker: BattleCharacter) => {
  const fracturePenalty = (attacker.fractureStacks || 0) * 10;
  const str = Math.max(1, attacker.attributes.STR - fracturePenalty);
  const dex = Math.max(1, attacker.attributes.DEX - fracturePenalty);
  const base = isRangedWeapon(attacker.weapon.type) ? attacker.attributes.PER : (str + dex) / 2;
  const penalty = getAttackPenalty(attacker);
  return Math.max(1, base - penalty);
};

const getDefenseBase = (defender: BattleCharacter, useBlock: boolean) => {
  const fracturePenalty = (defender.fractureStacks || 0) * 10;
  const str = Math.max(1, defender.attributes.STR - fracturePenalty);
  const dex = Math.max(1, defender.attributes.DEX - fracturePenalty);
  const base = useBlock ? dex * 0.5 + str * 0.2 : dex * 0.6 + defender.attributes.PER * 0.2;
  const mainBlockBonus = useBlock && /鍐涘垁/.test(defender.weapon.type) ? 12 : 0;
  const subBlockBonus = useBlock && /鍐涘垁/.test(defender.subWeapon.type) ? 6 : 0;
  const shieldBonus = useBlock && /鐩剧墝/.test(defender.subWeapon.type) ? 12 : 0;
  const blockBonus = mainBlockBonus + subBlockBonus + shieldBonus;
  const rangedMainWithSubPenalty =
    useBlock && isBowOrCrossbow(defender.weapon.type) && defender.subWeapon.type !== '鏃? ? 8 : 0;
  const penalty = getDefensePenalty(defender, useBlock) + rangedMainWithSubPenalty;
  return base + blockBonus + (defender.defenseBonus || 0) - penalty;
};

const getDefenseMode = (defender: BattleCharacter, attackerWeaponType: string) => {
  const hasMainWeapon = defender.weapon.type !== '鏃?;
  const hasSubWeapon = defender.subWeapon.type !== '鏃?;
  if (!hasMainWeapon) return false;
  if (isBowOrCrossbow(attackerWeaponType)) return false;
  const defenderMainIsBowOrCrossbow = isBowOrCrossbow(defender.weapon.type);
  if (defenderMainIsBowOrCrossbow && !hasSubWeapon) return false;
  return true;
};

const applyDamage = (defender: BattleCharacter, damage: number) => {
  const newHp = Math.max(0, _.round(defender.hp - damage, 2));
  return { ...defender, hp: newHp };
};

const appendLog = (logs: string[], line: string) => {
  logs.push(line);
};

const CharacterCard = ({
  character,
  isExpanded,
  isSelected,
  nonLethalEnabled,
  onToggle,
  onSelect,
  onOpenDetail,
}: {
  character: BattleCharacter;
  isExpanded: boolean;
  isSelected: boolean;
  nonLethalEnabled?: boolean;
  onToggle: () => void;
  onSelect?: () => void;
  onOpenDetail?: (type: 'weapon' | 'armor' | 'attributes' | 'trauma', character: BattleCharacter) => void;
}) => {
  const hpPercentage = Math.max(0, Math.min(100, (character.hp / character.maxHp) * 100));
  const isEnemy = character.faction === 'enemy';
  const statusLabel = (() => {
    if (character.state === '浼戝厠' && character.shockTurns > 0) return `浼戝厠路鍓?{character.shockTurns}鍥炲悎`;
    if (character.hp > 0) return '';
    if (['姝讳骸', '鏄忚糠'].includes(character.state)) return character.state;
    return '';
  })();
  const raceLabel = character.raceName ? character.raceName : '';

  const getFactionLabel = () => {
    if (isEnemy) return { text: '鏁屾柟', color: 'text-red-400 border-red-900/50 bg-red-950/30' };
    if (character.subFaction === 'squad')
      return { text: '灏忛槦鎴愬憳', color: 'text-blue-400 border-blue-900/50 bg-blue-950/30' };
    return { text: '鍙嬪啗', color: 'text-emerald-400 border-emerald-900/50 bg-emerald-950/30' };
  };

  const labelInfo = getFactionLabel();

  return (
    <div
      className={`relative group overflow-hidden rounded-sm border cursor-pointer min-w-[74vw] max-w-[320px] lg:min-w-0 lg:max-w-none ${
        isEnemy
          ? 'border-red-900/20 bg-gradient-to-br from-red-950/10 to-black/40'
          : 'border-blue-900/20 bg-gradient-to-br from-blue-950/10 to-black/40'
      } backdrop-blur-sm p-4 transition-all duration-500 hover:border-stone-500/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)] animate-fade-in-up ${
        isExpanded ? 'border-stone-500/50 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : ''
      } ${isSelected ? 'ring-2 ring-amber-400/60' : ''}`}
      onClick={() => {
        onSelect?.();
        onToggle();
      }}
    >
      <div
        className={`absolute top-0 left-0 w-[2px] h-full transition-all duration-300 group-hover:w-1 ${isEnemy ? 'bg-red-800/60' : 'bg-blue-800/60'}`}
      ></div>

      <div className="flex justify-between items-start mb-3 pl-3">
        <div>
          <h3 className="text-lg font-serif text-stone-200 tracking-wider drop-shadow-md">
            {character.name}
            {nonLethalEnabled ? <span className="ml-2 text-xs text-fuchsia-300">锛堝紑鍚潪鑷村懡锛?/span> : null}
            {character.escaped ? <span className="ml-2 text-xs text-stone-500">(宸查€冭窇)</span> : null}
            {statusLabel ? <span className="ml-2 text-xs text-rose-300">({statusLabel})</span> : null}
          </h3>
          {raceLabel ? <div className="mt-0.5 text-[10px] text-stone-500">{raceLabel}</div> : null}
          {character.intent && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs font-mono text-amber-400/90 bg-amber-950/20 px-2 py-0.5 rounded-sm border border-amber-900/30 w-fit">
              <Eye size={12} className="animate-pulse" /> 鎰忓浘: {character.intent}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-sm border ${labelInfo.color}`}
          >
            {labelInfo.text}
          </span>
          {isExpanded ? (
            <ChevronUp size={16} className="text-stone-500" />
          ) : (
            <ChevronDown size={16} className="text-stone-500" />
          )}
        </div>
      </div>

      <div className="pl-3 mb-2">
        <div className="flex justify-between text-xs mb-1.5 font-mono text-stone-400">
          <span className="flex items-center gap-1.5">
            <Heart size={12} className={isEnemy ? 'text-red-500' : 'text-emerald-500'} /> 鐢熷懡鍊?          </span>
          <span>
            {character.hp} <span className="text-stone-600">/ {character.maxHp}</span>
          </span>
        </div>
        <div className="h-1 w-full bg-stone-900/80 rounded-full overflow-hidden border border-stone-800/50">
          <div
            className={`h-full transition-all duration-1000 ease-out ${
              isEnemy
                ? 'bg-gradient-to-r from-red-800 to-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]'
                : 'bg-gradient-to-r from-emerald-800 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]'
            }`}
            style={{ width: `${hpPercentage}%` }}
          ></div>
        </div>
      </div>

      <div
        className={`pl-3 grid grid-cols-2 gap-3 transition-all duration-500 overflow-hidden ${
          isExpanded
            ? 'max-h-[400px] opacity-100 mt-4 pt-4 border-t border-stone-800/50'
            : 'max-h-0 opacity-0 mt-0 pt-0 border-transparent'
        }`}
      >
        <button
          type="button"
          onClick={event => {
            event.stopPropagation();
            onOpenDetail?.('weapon', character);
          }}
          className="bg-stone-900/40 border border-stone-800/50 rounded-sm p-2.5 hover:bg-stone-800/40 transition-colors text-left"
        >
          <h4 className="text-[10px] font-serif text-stone-400 flex items-center gap-1.5 mb-1.5">
            <Sword size={12} className="text-stone-500" /> 姝﹀櫒涓庤澶?          </h4>
          <div className="text-xs font-mono text-stone-500 truncate">
            涓伙細{character.weapon.name} ({character.weapon.damageDice})
          </div>
          {character.subWeapon.type !== '鏃? ? (
            <div className="text-xs font-mono text-stone-500 truncate">
              鍓細{character.subWeapon.name} ({character.subWeapon.damageDice})
            </div>
          ) : null}
        </button>
        <button
          type="button"
          onClick={event => {
            event.stopPropagation();
            onOpenDetail?.('attributes', character);
          }}
          className="bg-stone-900/40 border border-stone-800/50 rounded-sm p-2.5 hover:bg-stone-800/40 transition-colors text-left"
        >
          <h4 className="text-[10px] font-serif text-stone-400 flex items-center gap-1.5 mb-1.5">
            <Activity size={12} className="text-stone-500" /> 涓冪淮灞炴€?          </h4>
          <div className="text-[10px] font-mono text-stone-500">
            STR {character.attributes.STR} 路 DEX {character.attributes.DEX} 路 PER {character.attributes.PER}
          </div>
        </button>
        <button
          type="button"
          onClick={event => {
            event.stopPropagation();
            onOpenDetail?.('armor', character);
          }}
          className="bg-stone-900/40 border border-stone-800/50 rounded-sm p-2.5 hover:bg-stone-800/40 transition-colors text-left"
        >
          <h4 className="text-[10px] font-serif text-stone-400 flex items-center gap-1.5 mb-1.5">
            <Shield size={12} className="text-stone-500" /> 鎶ょ敳涓庢姉鎬?          </h4>
          <div className="text-xs font-mono text-stone-500 truncate">DR {character.armorDR}</div>
        </button>
        <button
          type="button"
          onClick={event => {
            event.stopPropagation();
            onOpenDetail?.('trauma', character);
          }}
          className="bg-stone-900/40 border border-stone-800/50 rounded-sm p-2.5 hover:bg-stone-800/40 transition-colors text-left"
        >
          <h4 className="text-[10px] font-serif text-stone-400 flex items-center gap-1.5 mb-1.5">
            <Skull size={12} className="text-stone-500" /> 鐢熺悊鍒涗激
          </h4>
          <div className="text-xs font-mono text-stone-500 truncate">
            宸﹁噦{character.traumaParts.宸﹁噦} 鍙宠噦{character.traumaParts.鍙宠噦}
          </div>
        </button>
      </div>
    </div>
  );
};

const BattleResultModal = ({
  outcome,
  outcomeDescription,
  logs,
  onCopy,
}: {
  outcome: BattleOutcome;
  outcomeDescription: string;
  logs: string[];
  onCopy: () => void;
}) => {
  const styles = OUTCOME_STYLES[outcome];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"></div>
      <div
        className={`relative glass-panel w-full max-w-md rounded-sm overflow-hidden border border-stone-700/40 shadow-[0_0_80px_rgba(0,0,0,0.9)] animate-fade-in-up ${styles.glow}`}
      >
        <div className={`absolute inset-0 pointer-events-none ${styles.aura}`}></div>
        <div className="relative p-10 text-center space-y-4">
          <div className={`text-3xl font-serif tracking-[0.3em] ${styles.title}`}>{outcome}</div>
          <div className="text-sm font-mono text-stone-400 tracking-widest">鎴樻枟缁撴潫</div>
          <div className="text-xs text-stone-300 leading-relaxed">{outcomeDescription}</div>
          <button
            onClick={onCopy}
            className="mx-auto mt-6 flex items-center justify-center gap-2 px-6 py-3 text-sm font-serif tracking-widest text-white bg-fuchsia-600 hover:bg-fuchsia-500 transition-all rounded-sm"
          >
            <span>鍙戦€佹垬鏂楁€荤粨</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoModal = ({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity" onClick={onClose}></div>
    <div className="relative glass-panel w-full max-w-4xl rounded-sm overflow-hidden border border-stone-700/40 shadow-[0_0_80px_rgba(0,0,0,0.9)] animate-fade-in-up">
      <div className="p-6 border-b border-stone-800/60 bg-gradient-to-r from-stone-900/90 to-transparent flex items-center justify-between">
        <h2 className="text-xl font-serif text-stone-100 tracking-[0.2em]">{title}</h2>
        <button onClick={onClose} className="text-stone-500 hover:text-stone-200 transition-colors px-2 py-1">
          鍏抽棴
        </button>
      </div>
      {children}
    </div>
  </div>
);

const OUTCOME_UIDS: Record<BattleOutcome, number> = {
  閰ｇ晠澶ц儨: 575,
  鐣ュ涓婇: 576,
  鍔垮潎鍔涙晫: 577,
  琛€鎴橀櫓鑳? 578,
  琛€鎴樻儨璐? 579,
  鐣ュ涓嬮: 580,
  鎮叉儴澶辫触: 581,
  鍙茶瘲澶ф嵎: 582,
  鎶曢檷: 583,
};
const SURRENDER_UID = 583;
const ALL_OUTCOME_UIDS = [...Object.values(OUTCOME_UIDS), SURRENDER_UID];

const applyBattleOutcomeWorldbook = async (uid: number) => {
  try {
    const charWorldbook = getCharWorldbookNames('current');
    const wbName = charWorldbook.primary;
    if (!wbName) return;
    await updateWorldbookWith(wbName, entries =>
      entries.map(entry => {
        if (ALL_OUTCOME_UIDS.includes(entry.uid)) {
          return { ...entry, enabled: entry.uid === uid };
        }
        return entry;
      }),
    );
  } catch (error) {
    console.error('瑙﹀彂鎴樻枟缁撳眬涓栫晫涔︽潯鐩け璐?, error);
  }
};

export default function App() {
  const [battleState, setBattleState] = useState<BattleState>({
    round: 1,
    units: [],
    logs: [],
    result: null,
    endReason: 'normal',
    lastRoundAttackersCount: {},
    nonLethalActorIds: [],
  });
  const battleOutcome = useMemo(() => getBattleOutcome(battleState.units), [battleState.units]);
  const displayOutcome: BattleOutcome = battleState.endReason === 'surrender' ? '鎶曢檷' : battleOutcome;
  const battleOutcomeDescription = OUTCOME_DESCRIPTIONS[displayOutcome];
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const [expandedCharId, setExpandedCharId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [plannedActions, setPlannedActions] = useState<
    Record<
      string,
      {
        actionId: string;
        targetId?: string;
        targetIds?: string[];
        tactic?: 'taunt' | 'defense' | 'medical' | 'escape';
        itemName?: string;
      }
    >
  >({});
  const [tacticsOpen, setTacticsOpen] = useState(false);
  const [medicalSelecting, setMedicalSelecting] = useState(false);
  const [medicalItemSelecting, setMedicalItemSelecting] = useState(false);
  const [medicalActorId, setMedicalActorId] = useState<string | null>(null);
  const [selectedMedicalTargetId, setSelectedMedicalTargetId] = useState<string | null>(null);
  const [selectedMedicalItem, setSelectedMedicalItem] = useState<string | null>(null);
  const [nonLethalMenuOpen, setNonLethalMenuOpen] = useState(false);
  const [roundLimit, setRoundLimit] = useState<number | null>(10);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [infoModal, setInfoModal] = useState<null | 'rules' | 'round' | 'tutorial' | 'weapon' | 'trauma'>(null);
  const [detailModal, setDetailModal] = useState<null | {
    type: 'weapon' | 'armor' | 'attributes' | 'trauma';
    character: BattleCharacter;
  }>(null);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [targetingMode, setTargetingMode] = useState<'attack' | 'subdue' | null>(null);
  const [attackSelectionIds, setAttackSelectionIds] = useState<string[]>([]);
  const [attackSelectionActorId, setAttackSelectionActorId] = useState<string | null>(null);
  const [spotlightRect, setSpotlightRect] = useState<null | {
    left: number;
    top: number;
    width: number;
    height: number;
  }>(null);
  const [tooltipPos, setTooltipPos] = useState<null | { left: number; top: number }>(null);
  const actionButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const autoSelectRef = useRef<HTMLButtonElement | null>(null);
  const logScrollRef = useRef<HTMLDivElement | null>(null);
  const pendingScrollToBottomRef = useRef(false);
  const outcomeTriggeredRef = useRef(false);
  const cancelledRef = useRef(false);
  const [surrenderConfirmOpen, setSurrenderConfirmOpen] = useState(false);
  const [resultConfirmed, setResultConfirmed] = useState(false);
  const [showCurrentRoundOnly, setShowCurrentRoundOnly] = useState(false);
  const [mobileLogCollapsed, setMobileLogCollapsed] = useState(false);
  const isMobile = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const byUa = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(ua);
    const byWidth =
      typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(max-width: 1024px)').matches : false;
    const byTouch =
      typeof navigator !== 'undefined' &&
      typeof window !== 'undefined' &&
      (navigator.maxTouchPoints || 0) > 0 &&
      window.matchMedia &&
      window.matchMedia('(hover: none)').matches;
    return byUa || byWidth || byTouch;
  }, []);

  const friendlyUnits = useMemo(
    () => battleState.units.filter(unit => unit.faction === 'friendly'),
    [battleState.units],
  );
  const enemyUnits = useMemo(() => battleState.units.filter(unit => unit.faction === 'enemy'), [battleState.units]);
  const unitNameMap = useMemo(() => {
    const map = new Map<string, BattleCharacter>();
    battleState.units.forEach(unit => map.set(unit.name, unit));
    return map;
  }, [battleState.units]);
  const friendlyAliveCount = useMemo(
    () =>
      friendlyUnits.filter(unit => isCombatReadyUnit(unit))
        .length,
    [friendlyUnits],
  );
  const enemyAliveCount = useMemo(
    () =>
      enemyUnits.filter(unit => isCombatReadyUnit(unit)).length,
    [enemyUnits],
  );
  const displayedLogs = useMemo(() => {
    if (!showCurrentRoundOnly) return battleState.logs;
    const roundMarkerRegex = /^---\s*绗琝s*\d+\s*鍥炲悎\s*---$/;
    let markerIndex = -1;
    for (let i = battleState.logs.length - 1; i >= 0; i -= 1) {
      if (roundMarkerRegex.test(battleState.logs[i].trim())) {
        markerIndex = i;
        break;
      }
    }
    return markerIndex >= 0 ? battleState.logs.slice(markerIndex) : battleState.logs;
  }, [battleState.logs, showCurrentRoundOnly]);
  const getLogLineClass = (line: string) => {
    if (line.startsWith('---')) return 'text-stone-400 mt-4';
    if (line.startsWith(SETTLEMENT_LOG)) return 'text-amber-300';
    const match = line.match(/^([^:锛歖+)[:锛歖/);
    if (!match) return 'text-stone-200';
    const unit = unitNameMap.get(match[1].trim());
    if (!unit) return 'text-stone-200';
    if (unit.faction === 'enemy') return 'text-red-300';
    if (unit.faction === 'friendly' && unit.subFaction === 'squad') return 'text-sky-300';
    if (unit.faction === 'friendly') return 'text-emerald-300';
    return 'text-stone-200';
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    handleFullscreenChange();
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch (error) {
      console.error('鍒囨崲鍏ㄥ睆澶辫触', error);
    }
  };

  useEffect(() => {
    if (!battleState.result || !resultConfirmed) {
      outcomeTriggeredRef.current = false;
      return;
    }
    if (outcomeTriggeredRef.current) return;
    outcomeTriggeredRef.current = true;
    if (battleState.endReason === 'surrender') {
      applyBattleOutcomeWorldbook(SURRENDER_UID);
      return;
    }
    const uid = OUTCOME_UIDS[battleOutcome];
    if (uid) applyBattleOutcomeWorldbook(uid);
  }, [battleOutcome, battleState.endReason, battleState.result, resultConfirmed]);

  const loadBattleState = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      await waitGlobalInitialized('Mvu');
      const resolveMessageId = () => (typeof getCurrentMessageId === 'function' ? getCurrentMessageId() : 'latest');
      const getMvuDataSafe = (messageId: number | 'latest') =>
        Mvu.getMvuData({ type: 'message', message_id: messageId });

      await waitUntil(
        () => {
          const currentId = resolveMessageId();
          const currentData = getMvuDataSafe(currentId);
          if (_.has(currentData, 'stat_data')) return true;
          if (currentId !== 'latest') {
            const latestData = getMvuDataSafe('latest');
            return _.has(latestData, 'stat_data');
          }
          return false;
        },
        { timeout: 10000, intervalBetweenAttempts: 200 },
      );
      const currentId = resolveMessageId();
      let mvuData = getMvuDataSafe(currentId);
      if (!_.has(mvuData, 'stat_data') && currentId !== 'latest') {
        mvuData = getMvuDataSafe('latest');
      }
      const stat = _.get(mvuData, ['stat_data'], {});
      const { units, playerId } = buildUnitsFromStat(stat);
      if (cancelledRef.current) return;
      setBattleState({
        round: 1,
        units,
        logs: [],
        result: null,
        endReason: 'normal',
        lastRoundAttackersCount: {},
        nonLethalActorIds: [],
      });
      setPlayerId(playerId);
      setResultConfirmed(false);
      setSelectedActorId(playerId);
      setSelectedTargetId(units.find(unit => unit.faction === 'enemy')?.id ?? null);
      setPlannedActions({});
      setLoading(false);
    } catch (err) {
      if (cancelledRef.current) return;
      if (!isMobile) {
        setBattleState(prev => ({
          ...prev,
          logs: [...prev.logs, `鏃犳硶璇诲彇 MVU 鍙橀噺: ${String(err)}`],
        }));
      }
      setLoadError(String(err));
      setLoading(false);
    }
  };

  useEffect(() => {
    cancelledRef.current = false;
    loadBattleState();
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const handleRetryLoad = () => {
    loadBattleState();
  };

  useEffect(() => {
    if (infoModal === 'tutorial') {
      setTutorialStep(0);
    }
  }, [infoModal]);

  useLayoutEffect(() => {
    if (infoModal !== 'tutorial') return;
    const step = tutorialSteps[tutorialStep];
    const target = step?.key === 'auto' ? autoSelectRef.current : actionButtonRefs.current[step?.key || ''];
    if (!target) {
      setSpotlightRect(null);
      setTooltipPos(null);
      return;
    }
    const rect = target.getBoundingClientRect();
    const spotlight = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    const maxWidth = 320;
    const tooltipHeight = 180;
    const margin = 16;
    let left = rect.left + rect.width + margin;
    let top = rect.top;
    if (left + maxWidth > window.innerWidth - margin) {
      left = Math.max(margin, rect.left - maxWidth - margin);
    }
    if (top + tooltipHeight > window.innerHeight - margin) {
      top = Math.max(margin, window.innerHeight - tooltipHeight - margin);
    }
    setSpotlightRect(spotlight);
    setTooltipPos({ left, top });
  }, [infoModal, tutorialStep]);

  useEffect(() => {
    if (infoModal !== 'tutorial') return;
    const handleResize = () => {
      const step = tutorialSteps[tutorialStep];
      const target = step?.key === 'auto' ? autoSelectRef.current : actionButtonRefs.current[step?.key || ''];
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const spotlight = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
      const maxWidth = 320;
      const tooltipHeight = 180;
      const margin = 16;
      let left = rect.left + rect.width + margin;
      let top = rect.top;
      if (left + maxWidth > window.innerWidth - margin) {
        left = Math.max(margin, rect.left - maxWidth - margin);
      }
      if (top + tooltipHeight > window.innerHeight - margin) {
        top = Math.max(margin, window.innerHeight - tooltipHeight - margin);
      }
      setSpotlightRect(spotlight);
      setTooltipPos({ left, top });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [infoModal, tutorialStep]);

  useEffect(() => {
    if (!pendingScrollToBottomRef.current) return;
    if (showCurrentRoundOnly) {
      pendingScrollToBottomRef.current = false;
      return;
    }
    const container = logScrollRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
    pendingScrollToBottomRef.current = false;
  }, [battleState.logs, showCurrentRoundOnly]);

  const handleToggleExpand = (id: string) => {
    setExpandedCharId(prev => (prev === id ? null : id));
  };

  const handleSelectActor = (id: string) => {
    setSelectedActorId(id);
  };

  const updateUnitIntent = (id: string, intent: string) => {
    setBattleState(prev => ({
      ...prev,
      units: setUnitIntent(prev.units, id, intent),
    }));
  };

  const planAction = (actionId: string) => {
    const actorId = selectedActorId || playerId;
    if (!actorId) return;
    const actor = getUnit(battleState.units, actorId);
    if (!actor || actor.subFaction !== 'squad' || actor.escaped) return;

    if (actionId === 'attack') {
      if (targetingMode === 'attack' && attackSelectionActorId === actorId && attackSelectionIds.length > 0) {
        setPlannedActions(prev => ({
          ...prev,
          [actorId]: { actionId: 'attack', targetIds: attackSelectionIds },
        }));
        updateUnitIntent(actorId, `鏀诲嚮 ${attackSelectionIds.join('銆?)}`);
        setTargetingMode(null);
        setAttackSelectionIds([]);
        setAttackSelectionActorId(null);
        return;
      }
      setTargetingMode('attack');
      setAttackSelectionActorId(actorId);
      setAttackSelectionIds([]);
      updateUnitIntent(actorId, '閫夋嫨鏀诲嚮鐩爣');
      return;
    }

    if (actionId === 'tactics') {
      setTacticsOpen(true);
      return;
    }

    if (actionId === 'surrender') {
      setSurrenderConfirmOpen(true);
      return;
    }

    if (actionId === 'subdue') {
      if (targetingMode === 'subdue' && attackSelectionActorId === actorId && attackSelectionIds.length > 0) {
        setPlannedActions(prev => ({
          ...prev,
          [actorId]: { actionId: 'subdue', targetIds: attackSelectionIds },
        }));
        updateUnitIntent(actorId, `鍒舵湇 ${attackSelectionIds.join('銆?)}`);
        setTargetingMode(null);
        setAttackSelectionIds([]);
        setAttackSelectionActorId(null);
        return;
      }
      setTargetingMode('subdue');
      setAttackSelectionActorId(actorId);
      setAttackSelectionIds([]);
      updateUnitIntent(actorId, '閫夋嫨鍒舵湇鐩爣');
      return;
    }
  };

  const confirmSurrender = () => {
    const actorId = selectedActorId || playerId;
    const actor = actorId ? getUnit(battleState.units, actorId) : null;
    const name = actor?.name ? `${actor.name}` : '鎴戝啗';
    setBattleState(prev => ({
      ...prev,
      logs: [...prev.logs, `${name}: 閫夋嫨鎶曢檷锛屾垬鏂楃粨鏉熴€俙, SETTLEMENT_LOG],
      result: 'defeat',
      endReason: 'surrender',
    }));
    setPlannedActions({});
    setSurrenderConfirmOpen(false);
  };

  const applyTactic = (tactic: 'taunt' | 'defense' | 'medical' | 'escape') => {
    const actorId = selectedActorId || playerId;
    if (!actorId) return;
    const actor = getUnit(battleState.units, actorId);
    if (!actor || actor.subFaction !== 'squad' || actor.escaped) return;

    if (tactic === 'medical') {
      setMedicalActorId(actorId);
      setSelectedMedicalTargetId(null);
      setSelectedMedicalItem(null);
      setMedicalSelecting(true);
      setMedicalItemSelecting(false);
      updateUnitIntent(actorId, '閫夋嫨鍖荤枟鐩爣');
      setPlannedActions(prev => ({
        ...prev,
        [actorId]: { actionId: 'tactics', tactic },
      }));
      setTacticsOpen(false);
      return;
    }

    if (tactic === 'taunt') {
      const target = selectedTargetId ? getUnit(battleState.units, selectedTargetId) : null;
      if (target && target.faction === 'enemy' && isCombatReadyUnit(target)) {
        setPlannedActions(prev => ({
          ...prev,
          [actorId]: { actionId: 'tactics', tactic: 'taunt', targetId: target.id },
        }));
        updateUnitIntent(actorId, `鍢插紕 ${target.name}`);
      } else {
        updateUnitIntent(actorId, '鍢插紕澶辫触');
      }
      setTacticsOpen(false);
      return;
    }

    setPlannedActions(prev => ({
      ...prev,
      [actorId]: { actionId: 'tactics', tactic },
    }));
    const intentMap = { defense: '闃插尽', medical: '鍖荤枟', escape: '閫冭窇' } as const;
    updateUnitIntent(actorId, intentMap[tactic]);
    setTacticsOpen(false);
  };

  const applyBleedAndShock = (
    units: BattleCharacter[],
    logs: string[],
    nonLethalActorIds: string[] = [],
  ) => {
    let working = units;
    working.forEach(unit => {
      if (unit.escaped) return;
      if (unit.bleedLayers > 0) {
        const bleedDamage = unit.bleedLayers;
        const shouldKeepAlive = nonLethalActorIds.length > 0 && unit.faction === 'enemy';
        const hpFloor = shouldKeepAlive ? 1 : 0;
        const newHp = Math.max(hpFloor, unit.hp - bleedDamage);
        const updated = { ...unit, hp: newHp, bleedLayers: 0 };
        working = replaceUnit(working, updated);
        appendLog(logs, `${unit.name}: 娴佽閫犳垚 ${bleedDamage} 浼ゅ銆俙);
      }
      if (unit.state === '浼戝厠' && unit.shockTurns > 0) {
        const nextTurns = unit.shockTurns - 1;
        const updated = { ...unit, shockTurns: Math.max(0, nextTurns) };
        working = replaceUnit(working, updated);
        if (nextTurns <= 0) {
          const dead = { ...updated, state: '姝讳骸' };
          working = replaceUnit(working, dead);
          appendLog(logs, `${unit.name}: 浼戝厠鏃堕棿鑰楀敖锛屾浜°€俙);
        }
      }
    });
    return working;
  };

  const autoSelectTargets = () => {
    const updates: Record<string, { actionId: string; targetId?: string }> = {};
    battleState.units.forEach(unit => {
      if (unit.faction !== 'friendly' || unit.subFaction !== 'squad' || unit.escaped || unit.hp <= 0) return;
      const target = pickRandomTarget(battleState.units, 'enemy');
      if (target) {
        updates[unit.id] = { actionId: 'attack', targetId: target.id };
        updateUnitIntent(unit.id, `鏀诲嚮 ${target.name}`);
      } else {
        updates[unit.id] = { actionId: 'attack' };
        updateUnitIntent(unit.id, '鏃犳湁鏁堢洰鏍?);
      }
    });
    setPlannedActions(prev => ({ ...prev, ...updates }));
  };

  type AttackResult = {
    units: BattleCharacter[];
    attacker: BattleCharacter;
    defender: BattleCharacter;
    dodged?: boolean;
  };

  const applySubdue = (
    units: BattleCharacter[],
    attacker: BattleCharacter,
    defender: BattleCharacter,
    logs: string[],
    lastRoundAttackersCount: Record<string, number>,
  ): AttackResult => {
    appendLog(logs, `${attacker.name}: 灏濊瘯鍒舵湇 ${defender.name}銆俙);

    // 璁＄畻琛€閲忛毦搴︿慨姝?    const hpRatio = defender.hp / defender.maxHp;
    let hpDifficulty = 0;
    if (hpRatio > 0.2) {
      hpDifficulty = 60;
    } else if (hpRatio <= 0.2 && hpRatio > 0.1) {
      hpDifficulty = 5;
    } else if (hpRatio <= 0.1) {
      hpDifficulty = -15;
    }

    // 璁＄畻绛夌骇宸?    const levelDiff = defender.level - attacker.level;

    // 鎴戞柟鍔犳垚: D100 + 鍔涢噺(姣?0灞炴€?1淇) + 榄呭姏(姣?灞炴€?1淇)
    const myRoll = d100();
    const myBonus = Math.round(attacker.attributes.STR / 20) + Math.round(attacker.attributes.CHA / 5);
    const myTotal = Math.round(myRoll + myBonus);

    // 鏁屾柟鍔犳垚: D100 + 鎰忓織(姣?0灞炴€?1淇) + 浣撹川(姣?0灞炴€?1淇) + 棰濆闅惧害 - 鍙屾柟绛夌骇宸?    const enemyRoll = d100();
    const enemyBonus = Math.round(defender.attributes.WIL / 10) + Math.round(defender.attributes.TGH / 20);
    const enemyTotal = Math.round(enemyRoll + enemyBonus + hpDifficulty - levelDiff);

    appendLog(
      logs,
      `${attacker.name}: 鍒舵湇妫€瀹?- 鎴戞柟[${myRoll}+${myBonus}=${myTotal}] vs 鏁屾柟[${enemyRoll}+${enemyBonus}+${hpDifficulty}-${levelDiff}=${enemyTotal}]`,
    );

    if (myTotal > enemyTotal) {
      // 鍒舵湇鎴愬姛
      const updatedDefender = { ...defender, state: '宸茶鍒舵湇' };
      appendLog(logs, `${attacker.name}: 鍒舵湇鎴愬姛锛?{defender.name}锛堝凡琚埗鏈嶏級銆俙);

      const moraleUnits = applyMoraleOutcome(units, updatedDefender, logs, 'damage', lastRoundAttackersCount);
      const nextUnits = replaceUnit(replaceUnit(moraleUnits, attacker), updatedDefender);

      return {
        units: nextUnits,
        attacker,
        defender: updatedDefender,
      };
    } else {
      // 鍒舵湇澶辫触
      appendLog(logs, `${attacker.name}: 鍒舵湇澶辫触銆俙);

      // 鍒舵湇澶辫触鍙兘浣挎敾鍑昏€呴櫡鍏ュけ琛?      if (d100() <= 20) {
        const updatedAttacker = { ...attacker, defenseBonus: (attacker.defenseBonus || 0) - 10 };
        appendLog(logs, `${attacker.name}: 鍒舵湇澶辫触瀵艰嚧澶辫　锛岄槻寰℃瀹?10銆俙);
        const nextUnits = replaceUnit(units, updatedAttacker);
        return { units: nextUnits, attacker: updatedAttacker, defender };
      }

      return { units, attacker, defender };
    }
  };

  const applyAttack = (
    units: BattleCharacter[],
    attacker: BattleCharacter,
    defender: BattleCharacter,
    defenseIndex: number,
    logs: string[],
    lastRoundAttackersCount: Record<string, number>,
    attackPenaltyExtra = 0,
    targetIndex?: number,
    targetCount?: number,
    allowMartialExtraAttack = true,
    nonLethalActorIds: string[] = [],
    attackWeapon?: BattleCharacter['weapon'],
  ): AttackResult => {
    const hitBonus = attacker.hitBonusAgainst[defender.id] || 0;
    const currentWeapon = attackWeapon || attacker.weapon;
    if (attacker.hitBonusAgainst[defender.id]) {
      attacker.hitBonusAgainst[defender.id] = 0;
    }

    const targetLabel =
      targetCount && targetCount > 1 && targetIndex !== undefined ? `路鐩爣${targetIndex + 1}/${targetCount}` : '';

    const rawRoll = d100();
    const attackRoll = rawRoll + hitBonus - attackPenaltyExtra;
    const evadeBase = defender.attributes.DEX * 0.5 + defender.attributes.PER * 0.2;
    const multiTargetPenalty = Math.max(0, (lastRoundAttackersCount[defender.id] || 0) - 1) * 8;
    const evadeValue = Math.max(0, Math.min(70, evadeBase) - multiTargetPenalty);
    const isMartialArts = /姝︽湳/.test(currentWeapon.type);
    const isMartialSpeed = isMartialArts && attacker.attributes.DEX >= attacker.attributes.STR;
    const isMartialHeavy = isMartialArts && attacker.attributes.STR > attacker.attributes.DEX;
    const isCrit = rawRoll >= 93;
    const isHeavyWeapon = /澶у瀷/.test(currentWeapon.type);
    const isFumble = rawRoll <= (isHeavyWeapon ? 10 : 5);

    if (isFumble) {
      appendLog(logs, `${attacker.name}: 鏀诲嚮妫€瀹氬ぇ澶辫触 (鍒ゅ畾 ${rawRoll})`);
      if (/(寮﹟寮?/.test(currentWeapon.type)) {
        const allyTargets = units.filter(
          unit => unit.faction === attacker.faction && unit.id !== attacker.id && isCombatReadyUnit(unit),
        );
        const ally = allyTargets.length ? allyTargets[_.random(0, allyTargets.length - 1)] : null;
        if (ally) {
          appendLog(logs, `${attacker.name}: 澶уけ璐ワ紒璇激闃熷弸 ${ally.name}銆俙);
          const ratio = getDamageRatio(currentWeapon.type, currentWeapon.damageType);
          const baseDamage =
            rollDice(currentWeapon.damageDice) +
            (isBowOrCrossbow(currentWeapon.type)
              ? (attacker.attributes.STR - 40 + attacker.attributes.PER - 30) * 0.4
              : (attacker.attributes.STR - 35 + attacker.attributes.DEX * 0.35) * 0.4);
          const rawDamage = Math.max(0, baseDamage);
          const finalDamage = rawDamage;
          const cutDamage = Math.round(finalDamage * ratio.cut);
          const bluntDamage = Math.round(finalDamage * ratio.blunt);
          const drIgnore = /寮?.test(currentWeapon.type) ? 7 : 0;
          const effectiveDR = Math.max(0, ally.armorDR - drIgnore);
          const cutAfterDR = Math.max(0, Math.round(cutDamage - effectiveDR));
          const bluntScale = /閽濆櫒|鐩剧墝/.test(currentWeapon.type) ? 1 : /寮?.test(currentWeapon.type) ? 1.2 : /姝﹀＋鍒€/.test(currentWeapon.type) ? 0.5 : /(鍐涘垁|闀挎焺)/.test(currentWeapon.type) ? 0.6 : 0.7;
    const bluntAfterScale = Math.round(bluntDamage * bluntScale);
    const totalDamage = Math.round(cutAfterDR + bluntAfterScale);
          const updatedAlly = applyDamage(ally, totalDamage);
          appendLog(logs, `${attacker.name}: 璇激${ally.name}锛岄€犳垚 ${totalDamage} 浼ゅ銆俙);
          return {
            units: replaceUnit(replaceUnit(units, attacker), updatedAlly),
            attacker,
            defender: updatedAlly,
          };
        }
        return { units, attacker, defender };
      }
      if (isHeavyWeapon) {
        attacker.defenseBonus -= 15;
        appendLog(logs, `${attacker.name}: 澶辫　锛岄槻寰℃瀹?15銆俙);
      }
      appendLog(logs, `${attacker.name}: 澶уけ璐ワ紒涓嬩竴杞棤娉曟牸鎸★紝瑙﹀彂${defender.name}鍙嶅嚮銆俙);
      attacker.noBlockNextRound = true;
      return applyAttack(units, defender, attacker, 0, logs, lastRoundAttackersCount, 0, undefined, undefined, true, nonLethalActorIds);
    }

    appendLog(logs, `${attacker.name}: 鏀诲嚮${defender.name}锛堢${defenseIndex + 1}鍑?{targetLabel}锛氬垽瀹?${rawRoll}锛塦);

    if (attackRoll < evadeValue) {
      appendLog(logs, `${attacker.name}: 鏀诲嚮钀界┖ (鍒ゅ畾 ${attackRoll.toFixed(0)} < ${evadeValue.toFixed(0)})`);
      return { units, attacker, defender, dodged: true };
    }

    appendLog(logs, `${defender.name}: 闂伩鍒ゅ畾澶辫触 (鍒ゅ畾 ${attackRoll.toFixed(0)} >= ${evadeValue.toFixed(0)})`);

    let useBlock = getDefenseMode(defender, currentWeapon.type);
    if (defender.noBlockNextRound) useBlock = false;
    const defensePenalty = defenseIndex * 10;
    const defenseBase = getDefenseBase(defender, useBlock);
    const defenseChance =
      defenseBase +
      (defender.attributes.DEX - attacker.attributes.DEX) -
      defensePenalty -
      multiTargetPenalty;
    const defenseRoll = d100();
    const defenseSuccess = defenseRoll <= defenseChance && !(isCrit && useBlock);

    if (defenseSuccess) {
      if (!useBlock) {
        appendLog(logs, `${defender.name}: 闂伩鎴愬姛 (鍒ゅ畾 ${defenseRoll} <= ${defenseChance.toFixed(0)})`);
        if (defenseRoll <= 7) {
          defender.hitBonusAgainst[attacker.id] = 20;
          appendLog(logs, `${defender.name}: 闂伩澶ф垚鍔燂紝涓嬩竴娆℃敾鍑?{attacker.name}鍛戒腑+20銆俙);
        }
        return { units, attacker, defender, dodged: true };
      }
      appendLog(logs, `${defender.name}: 鏍兼尅鎴愬姛 (鍒ゅ畾 ${defenseRoll} <= ${defenseChance.toFixed(0)})`);
    }

    const baseDamage =
      rollDice(currentWeapon.damageDice) +
      (isBowOrCrossbow(currentWeapon.type)
        ? (attacker.attributes.STR - 40 + attacker.attributes.PER - 30) * 0.4
        : (attacker.attributes.STR - 35 + attacker.attributes.DEX * 0.35) * 0.4);
    const rawDamage = Math.max(0, baseDamage);
    const critMultiplier = isCrit ? (isMartialHeavy ? 2 : isMartialSpeed ? 1 : 1.5) : 1;
    const finalDamage = rawDamage * critMultiplier;
    const ratio = getDamageRatio(currentWeapon.type, currentWeapon.damageType);
    let cutDamage = Math.round(finalDamage * ratio.cut);
    let bluntDamage = Math.round(finalDamage * ratio.blunt);

    if (defenseSuccess && useBlock) {
      cutDamage = 0;
      bluntDamage = Math.round(bluntDamage * 0.5);
    }

    const drIgnore = /鐮嶅垁/.test(currentWeapon.type)
      ? 7
      : /寮?.test(currentWeapon.type)
        ? 7
        : isMartialHeavy
          ? 5
          : 0;
    const effectiveDR = Math.max(0, defender.armorDR - drIgnore);
    const cutAfterDR = Math.max(0, Math.round(cutDamage - effectiveDR));
    const bluntScale = /閽濆櫒|鐩剧墝/.test(currentWeapon.type) ? 1 : /寮?.test(currentWeapon.type) ? 1.2 : /姝﹀＋鍒€/.test(currentWeapon.type) ? 0.5 : /(鍐涘垁|闀挎焺)/.test(currentWeapon.type) ? 0.6 : 0.7;
          const bluntAfterScale = Math.round(bluntDamage * bluntScale);
    const totalDamage = Math.round(cutAfterDR + bluntAfterScale);
    const armorAbsorbed = Math.round(Math.max(0, cutDamage - cutAfterDR));

    const hpBefore = defender.hp;
    let actualDamage = totalDamage;

    // 闈炶嚧鍛芥ā寮忥細浼ゅ浣跨洰鏍囪閲忛攣瀹氫负1
    if (nonLethalActorIds.length > 0 && defender.faction !== attacker.faction) {
      const isAttackerNonLethal = nonLethalActorIds.includes(attacker.id);

      if (isAttackerNonLethal) {
        // 璁＄畻瀹為檯浼ゅ锛屼絾纭繚鐩爣琛€閲忎笉浣庝簬1
        const potentialHpAfter = Math.max(0, defender.hp - totalDamage);
        if (potentialHpAfter < 1) {
          actualDamage = Math.max(0, defender.hp - 1);
        }
      }
    }

    const updatedDefender = applyDamage(defender, actualDamage);
    const hpAfter = updatedDefender.hp;
    const hitPart = rollInjuryPart();
    const baseThreshold = getTraumaThresholdByLevel(defender.attributes.TGH, defender.traumaParts[hitPart] || 0);
    const currentRemaining = updatedDefender.traumaAccumulated?.[hitPart] ?? baseThreshold;
    const limbCutScale = /鐮嶅垁/.test(currentWeapon.type) ? 1.4 : 1.2;
    const limbBluntScale = /閽濆櫒|鐩剧墝/.test(currentWeapon.type) ? 1.4 : 1;
    const limbDamage = _.round(cutAfterDR * limbCutScale + bluntAfterScale * limbBluntScale, 2);
    const newRemaining = currentRemaining - limbDamage;
    updatedDefender.traumaAccumulated = {
      ...updatedDefender.traumaAccumulated,
      [hitPart]: _.round(newRemaining, 2),
    };
    const damageText = `閫犳垚 ${totalDamage} 浼ゅ (鍒囧壊 ${cutDamage}(鍑忎激${armorAbsorbed}) / 鐮寸敳 ${bluntDamage})锛岃偄浣撲激瀹?${limbDamage}`;
    appendLog(logs, `${attacker.name}: 鍛戒腑${defender.name}(${hitPart})锛?{damageText}`);

    if (/姝﹀＋鍒€/.test(currentWeapon.type) && cutAfterDR > 0) {
      updatedDefender.bleedLayers += 1;
      appendLog(logs, `${defender.name}: 姝﹀＋鍒€杩藉姞娴佽灞傛暟+1銆俙);
    }

    if (/鐮嶅垁/.test(currentWeapon.type) && isCrit) {
      const reduced = Math.max(0, updatedDefender.armorDR - 8);
      updatedDefender.armorDR = reduced;
      appendLog(logs, `${defender.name}: 鐮寸敳鏁堟灉瑙﹀彂锛孌R闄嶄綆8銆俙);
    }

    if (/閽濆櫒/.test(attacker.weapon.type) && isCrit) {
      updatedDefender.fractureStacks = Math.max(0, (updatedDefender.fractureStacks || 0) + 1);
      appendLog(
        logs,
        `${defender.name}: 楠ㄦ姌灞傛暟+1锛堝綋鍓?{updatedDefender.fractureStacks}灞傦紝鍔涢噺/鏁忔嵎姣忓眰-10锛岄€冭窇鎯╃綒姣忓眰-15锛夈€俙,
      );
    }

    const traumaThreshold = defender.attributes.TGH * 0.4;
    let traumaIncreased = false;
    if (newRemaining <= 0 || totalDamage > traumaThreshold || isCrit) {
      traumaIncreased = true;
    }

    if (updatedDefender.hp <= 0 && defender.hp > 0 && !defender.hasDowned) {
      updatedDefender.hasDowned = true;
    }

    if (traumaIncreased) {
      const partLevel = updatedDefender.traumaParts[hitPart] || 0;
      const maxHp = Math.max(1, defender.maxHp || 1);
      const tgh = Math.max(1, defender.attributes.TGH || 1);
      let nextLevel = partLevel;
      let remaining = updatedDefender.traumaAccumulated[hitPart] || 0;
      let lowHpBonusTrigger = hpAfter > 0 && hpAfter <= maxHp * 0.3 && !updatedDefender.lowHpTraumaBoostUsed;

      const immediateUpgrade =
        (partLevel === 0 && isCrit) ||
        (partLevel === 1 && (isCrit || totalDamage > tgh * 0.45)) ||
        (partLevel === 2 && totalDamage > tgh * 0.4) ||
        (partLevel === 3 && totalDamage > tgh * 0.3);
      if (immediateUpgrade) remaining = Math.min(remaining, 0);

      if (totalDamage >= maxHp * 0.7) {
        nextLevel = 4;
        remaining = 0;
      } else if (totalDamage >= maxHp * 0.5 && nextLevel < 3) {
        nextLevel = 3;
        remaining = getTraumaThresholdByLevel(tgh, 3) + Math.min(0, remaining);
      }

      while (nextLevel < 4 && remaining <= 0) {
        nextLevel += 1;
        if (nextLevel >= 4) {
          remaining = 0;
          break;
        }
        remaining += getTraumaThresholdByLevel(tgh, nextLevel);
      }

      if (lowHpBonusTrigger && nextLevel <= partLevel) {
        lowHpBonusTrigger = false;
      }

      if (lowHpBonusTrigger && nextLevel < 4) {
        nextLevel += 1;
        updatedDefender.lowHpTraumaBoostUsed = true;
        if (nextLevel >= 4) {
          remaining = 0;
        } else {
          remaining = Math.min(remaining, getTraumaThresholdByLevel(tgh, nextLevel));
        }
      }

      updatedDefender.traumaAccumulated = {
        ...updatedDefender.traumaAccumulated,
        [hitPart]: _.round(Math.max(0, remaining), 2),
      };

      if (nextLevel > partLevel) {
        updatedDefender.traumaParts = { ...updatedDefender.traumaParts, [hitPart]: nextLevel };
        updatedDefender.bleedLayers = Math.max(0, updatedDefender.bleedLayers + 1);
        appendLog(logs, `${defender.name}: ${hitPart}${getTraumaStageLabel(nextLevel)}锛屾祦琛€灞傛暟+1銆俙);
      }
    }

    if (hpAfter <= 0 && hpBefore > 0) {
      appendLog(logs, `${defender.name}: HP ${hpBefore.toFixed(0)} 鈫?${hpAfter.toFixed(0)}锛岃Е鍙戜綋璐ㄦ瀹氥€俙);
      const toughSuccess = getMediumCheckSuccess(defender.attributes.TGH);
      if (toughSuccess) {
        updatedDefender.state = '鏄忚糠';
        appendLog(logs, `${defender.name}: 浣撹川妫€瀹氭垚鍔燂紝闄峰叆鏄忚糠銆俙);
      } else {
        updatedDefender.state = '姝讳骸';
        appendLog(logs, `${defender.name}: 浣撹川妫€瀹氬け璐ワ紝纭姝讳骸銆俙);
      }
    }

    const moraleUnits = applyMoraleOutcome(units, updatedDefender, logs, 'damage', lastRoundAttackersCount);
    const nextUnits = replaceUnit(replaceUnit(moraleUnits, attacker), updatedDefender);

    if (isMartialSpeed && isCrit && allowMartialExtraAttack && updatedDefender.hp > 0 && attacker.hp > 0) {
      appendLog(logs, `${attacker.name}: 姝︽湳澶ф垚鍔燂紝瑙﹀彂棰濆鏀诲嚮1娆°€俙);
      const nextAttacker = getUnit(nextUnits, attacker.id);
      const nextDefender = getUnit(nextUnits, defender.id);
      if (nextAttacker && nextDefender && nextAttacker.hp > 0 && nextDefender.hp > 0) {
        return applyAttack(
          nextUnits,
          nextAttacker,
          nextDefender,
          0,
          logs,
          lastRoundAttackersCount,
          0,
          undefined,
          undefined,
          false,
          nonLethalActorIds,
        );
      }
    }

    return {
      units: nextUnits,
      attacker,
      defender: updatedDefender,
    };
  };

  const runRound = () => {
    if (!playerId) return;

    setBattleState(prev => {
      if (prev.result) return prev;
      const logs: string[] = [];
      let workingUnits = cloneUnits(prev.units).map(unit => ({ ...unit, defenseBonus: 0 }));
      const defenderDefenseCount: Record<string, number> = {};
      const lastRoundAttackersCount: Record<string, number> = { ...prev.lastRoundAttackersCount };
      const lastRoundAttackersMap = new Map<string, Set<string>>();
      appendLog(logs, `--- 绗?${prev.round} 鍥炲悎 ---`);
      workingUnits = applyBleedAndShock(workingUnits, logs, prev.nonLethalActorIds);
      workingUnits = workingUnits.reduce(
        (acc, unit) => applyMoraleOutcome(acc, unit, logs, 'round', lastRoundAttackersCount),
        workingUnits,
      );

      const friendlySquadReady = workingUnits.some(
        unit => unit.faction === 'friendly' && unit.subFaction === 'squad' && isCombatReadyUnit(unit),
      );
      if (!friendlySquadReady) {
        appendLog(logs, '鎴戞柟宸叉棤浜哄彲鎴樸€?);
        appendLog(logs, SETTLEMENT_LOG);
        return {
          ...prev,
          logs: [...prev.logs, ...logs],
          result: 'defeat',
          endReason: 'normal',
          lastRoundAttackersCount: prev.lastRoundAttackersCount,
        };
      }

      const tauntTargets: Record<string, string> = {};
      Object.entries(plannedActions).forEach(([actorId, action]) => {
        if (action.actionId === 'tactics' && action.tactic === 'taunt' && action.targetId) {
          const target = getUnit(workingUnits, action.targetId);
          const actor = getUnit(workingUnits, actorId);
          if (target && actor && isCombatReadyUnit(target) && isCombatReadyUnit(actor)) {
            tauntTargets[target.id] = actor.id;
          }
        }
      });

      const enemyTargetMap: Record<string, string> = {};
      workingUnits
        .filter(unit => unit.faction === 'enemy' && isCombatReadyUnit(unit))
        .forEach(enemy => {
          const tauntedBy = tauntTargets[enemy.id];
          const taunter = tauntedBy ? getUnit(workingUnits, tauntedBy) : null;
          const target =
            taunter && !taunter.escaped && taunter.hp > 0 ? taunter : pickRandomTarget(workingUnits, 'friendly');
          if (target) {
            enemyTargetMap[enemy.id] = target.id;
            workingUnits = setUnitIntent(workingUnits, enemy.id, `鏀诲嚮 ${target.name}`);
          } else {
            workingUnits = setUnitIntent(workingUnits, enemy.id, '鏃犳湁鏁堢洰鏍?);
          }
        });

      const turnOrderIds = buildTurnOrder(workingUnits).map(unit => unit.id);
      const attackPlans = new Map<
        string,
        { actionId: string; targetId?: string; plannedTargetIds?: string[]; targetFaction: Faction }
      >();

      for (const actorId of turnOrderIds) {
        const actor = getUnit(workingUnits, actorId);
        if (!actor || !isCombatReadyUnit(actor)) continue;

        if (actor.faction === 'friendly') {
          if (actor.subFaction === 'squad') {
            const planned = plannedActions[actor.id];

            if (planned?.actionId === 'tactics' && planned.tactic === 'taunt') {
              appendLog(logs, `${actor.name}: 浣跨敤鍢插紕锛屾湰鍥炲悎涓嶆敾鍑汇€俙);
              continue;
            }

            if (planned?.actionId === 'tactics' && planned.tactic === 'defense') {
              workingUnits = replaceUnit(workingUnits, { ...actor, defenseBonus: 15 });
              workingUnits = setUnitIntent(workingUnits, actor.id, '闃插尽');
              appendLog(logs, `${actor.name}: 杩涘叆闃插尽濮挎€侊紝鏍兼尅鍩虹+15銆俙);
              continue;
            }

            if (planned?.actionId === 'tactics' && planned.tactic === 'medical') {
              const targetId =
                selectedMedicalTargetId && getUnit(workingUnits, selectedMedicalTargetId)?.faction === 'friendly'
                  ? selectedMedicalTargetId
                  : actor.id;
              const target = getUnit(workingUnits, targetId) ?? actor;
              const isSkeleton = (target.raceName || '').includes('楠ㄤ汉');
              const chosenItem = planned.itemName || selectedMedicalItem || '';

              const actorItemCounts = (name: string) => toNumber(actor.backpackItems[name]?.鏁伴噺, 0);

              const consumeItem = (unit: BattleCharacter, itemName: string) => {
                const current = toNumber(unit.backpackItems[itemName]?.鏁伴噺, 0);
                const next = Math.max(0, current - 1);
                const nextItems = {
                  ...unit.backpackItems,
                  [itemName]: { ...unit.backpackItems[itemName], 鏁伴噺: next },
                };
                return { ...unit, backpackItems: nextItems };
              };

              const hasAnyItem = Object.entries(actor.backpackItems || {}).some(([name, item]) => {
                if (!isMedicalBackpackItem(name, item)) return false;
                return actorItemCounts(name) > 0;
              });

              if (!hasAnyItem) {
                workingUnits = setUnitIntent(workingUnits, actor.id, '鍖荤枟澶辫触');
                appendLog(logs, `${actor.name}: 姝よ鑹茶儗鍖呮病鏈夊彲鐢ㄥ尰鐤楃墿鍝併€俙);
                continue;
              }

              if (!chosenItem) {
                workingUnits = setUnitIntent(workingUnits, actor.id, '鏈€夋嫨鍖荤枟鐗╁搧');
                appendLog(logs, `${actor.name}: 鏈€夋嫨鍖荤枟鐗╁搧銆俙);
                continue;
              }

              if (actorItemCounts(chosenItem) <= 0) {
                workingUnits = setUnitIntent(workingUnits, actor.id, '鐗╁搧涓嶈冻');
                appendLog(logs, `${actor.name}: 閫夋嫨鐨?{chosenItem}涓嶈冻銆俙);
                continue;
              }

              const isSkeletonItem = ['楠ㄤ汉淇悊鍖?, '楠ㄤ汉淇悊绠?].includes(chosenItem);
              if (isSkeletonItem && !isSkeleton) {
                workingUnits = setUnitIntent(workingUnits, actor.id, '鐗╁搧涓嶅彲鐢?);
                appendLog(logs, `${actor.name}: ${chosenItem}浠呭彲鐢ㄤ簬楠ㄤ汉銆俙);
                continue;
              }
              if (!isSkeletonItem && isSkeleton) {
                workingUnits = setUnitIntent(workingUnits, actor.id, '鐗╁搧涓嶅彲鐢?);
                appendLog(logs, `${actor.name}: 闈為浜哄尰鐤楃墿鍝佹棤娉曠敤浜庨浜恒€俙);
                continue;
              }

              let updatedTarget = target;
              let updatedActor = actor;
              let healAmount = 0;
              let traumaReduce = 0;

              if (['鍩虹鎬ユ晳鍖?, '鏍囧噯鎬ユ晳鍖?, '楂樼骇鎬ユ晳鍖?, '楠ㄤ汉淇悊鍖?, '楠ㄤ汉淇悊绠?].includes(chosenItem)) {
                if (chosenItem === '鍩虹鎬ユ晳鍖?) healAmount = Math.round(target.maxHp * 0.1);
                if (chosenItem === '鏍囧噯鎬ユ晳鍖?) healAmount = Math.round(target.maxHp * 0.2);
                if (chosenItem === '楂樼骇鎬ユ晳鍖?) healAmount = Math.round(target.maxHp * 0.35);
                if (chosenItem === '楠ㄤ汉淇悊鍖?) healAmount = Math.round(target.maxHp * 0.15);
                if (chosenItem === '楠ㄤ汉淇悊绠?) healAmount = Math.round(target.maxHp * 0.3);

                const newHp = Math.min(target.maxHp, Math.max(0, target.hp + healAmount));
                updatedTarget = { ...updatedTarget, hp: newHp };
                updatedActor = consumeItem(updatedActor, chosenItem);
                appendLog(logs, `${actor.name}: 瀵?{target.name}浣跨敤${chosenItem}锛屾仮澶?{healAmount}鐢熷懡銆俙);
              }

              if (['鏅€氬す鏉垮寘', '楂樼骇澶规澘鍖?].includes(chosenItem)) {
                traumaReduce = chosenItem === '楂樼骇澶规澘鍖? ? 2 : 1;
                const entries = Object.entries(updatedTarget.traumaParts) as Array<
                  ['宸﹁噦' | '鍙宠噦' | '宸﹁吙' | '鍙宠吙', number]
                >;
                const [partToHeal] = entries.sort((a, b) => b[1] - a[1])[0] || ['宸﹁噦', 0];
                const currentLevel = updatedTarget.traumaParts[partToHeal] || 0;
                const nextLevel = Math.max(0, currentLevel - traumaReduce);
                updatedTarget = {
                  ...updatedTarget,
                  traumaParts: { ...updatedTarget.traumaParts, [partToHeal]: nextLevel },
                  fractureStacks: 0,
                };
                updatedActor = consumeItem(updatedActor, chosenItem);
                appendLog(
                  logs,
                  `${actor.name}: 瀵?{target.name}浣跨敤${chosenItem}锛?{partToHeal}鍒涗激闄嶄綆${traumaReduce}绾у苟瑙ｉ櫎楠ㄦ姌銆俙,
                );
              }

              if (updatedActor.id === updatedTarget.id) {
                const merged = { ...updatedTarget, backpackItems: updatedActor.backpackItems };
                workingUnits = replaceUnit(workingUnits, merged);
              } else {
                workingUnits = replaceUnit(workingUnits, updatedActor);
                workingUnits = replaceUnit(workingUnits, updatedTarget);
              }
              workingUnits = setUnitIntent(workingUnits, actor.id, `鍖荤枟 ${target.name}`);
              continue;
            }

            if (planned?.actionId === 'tactics' && planned.tactic === 'escape') {
              const attackersCount = lastRoundAttackersCount[actor.id] ?? 0;
              const escapeRoll = d100();
              const traumaPenalty = getEscapeTraumaPenalty(actor);
              const statusPenalty = getEscapeStatusPenalty(actor);
              if (traumaPenalty >= 9999 || statusPenalty >= 9999) {
                workingUnits = setUnitIntent(workingUnits, actor.id, '閫冭窇澶辫触');
                appendLog(logs, `${actor.name}: 閫冭窇澶辫触锛屾棤娉曠Щ鍔ㄣ€俙);
                continue;
              }
              const escapePenalty = getEscapePenalty(actor) + attackersCount * 15 + traumaPenalty + statusPenalty;
              const escapeChance = 70 - escapePenalty;
              const criticalEscape = escapeRoll <= 5 && traumaPenalty < 25 && statusPenalty < 30;
              appendLog(
                logs,
                `${actor.name}: 閫冭窇鍒ゅ畾 d100=${escapeRoll} 鎴愬姛鐜?${Math.max(0, Math.round(escapeChance))}銆俙,
              );
              if (escapeRoll <= escapeChance || criticalEscape) {
                workingUnits = replaceUnit(workingUnits, { ...actor, escaped: true });
                workingUnits = setUnitIntent(workingUnits, actor.id, '閫冭窇鎴愬姛');
                appendLog(
                  logs,
                  `${actor.name}: 閫冭窇鎴愬姛(${escapeRoll}<${Math.max(0, Math.round(escapeChance))})锛岄€€鍑烘垬鏂椼€俙,
                );
              } else {
                workingUnits = setUnitIntent(workingUnits, actor.id, '閫冭窇澶辫触');
                appendLog(
                  logs,
                  `${actor.name}: 閫冭窇澶辫触(${escapeRoll}>=${Math.max(0, Math.round(escapeChance))})锛岃鏁屼汉閿佸畾銆俙,
                );
              }
              continue;
            }

            if (planned?.actionId === 'surrender') {
              workingUnits = setUnitIntent(workingUnits, actor.id, '鎶曢檷');
              appendLog(logs, `${actor.name}: 閫夋嫨鎶曢檷锛屾垬鏂楃粨鏉熴€俙);
              appendLog(logs, SETTLEMENT_LOG);
              return {
                ...prev,
                logs: [...prev.logs, ...logs],
                result: 'defeat',
                endReason: 'surrender',
                lastRoundAttackersCount: prev.lastRoundAttackersCount,
              };
            }

            if (planned?.actionId === 'subdue') {
              const plannedTargetIds = planned.targetIds || [];
              let target: BattleCharacter | null = null;
              if (planned.targetId) {
                target = getUnit(workingUnits, planned.targetId) ?? null;
              }
              if (!target || !isCombatReadyUnit(target)) {
                target = pickRandomTarget(workingUnits, 'enemy');
              }
              if (!target) {
                workingUnits = setUnitIntent(workingUnits, actor.id, '鏃犳湁鏁堢洰鏍?);
                continue;
              }

              workingUnits = setUnitIntent(workingUnits, actor.id, `鍒舵湇 ${target.name}`);
              attackPlans.set(actor.id, {
                actionId: 'subdue',
                targetId: target.id,
                plannedTargetIds,
                targetFaction: 'enemy',
              });
              continue;
            }

            let target: BattleCharacter | null = null;
            const plannedTargetIds = planned?.actionId === 'attack' ? planned.targetIds || [] : [];
            if (planned?.actionId === 'attack' && planned.targetId) {
              target = getUnit(workingUnits, planned.targetId) ?? null;
            }
            if (!target || !isCombatReadyUnit(target)) {
              target = pickRandomTarget(workingUnits, 'enemy');
            }
            if (!target) {
              workingUnits = setUnitIntent(workingUnits, actor.id, '鏃犳湁鏁堢洰鏍?);
              continue;
            }

            workingUnits = setUnitIntent(workingUnits, actor.id, `鏀诲嚮 ${target.name}`);
            attackPlans.set(actor.id, {
              actionId: 'attack',
              targetId: target.id,
              plannedTargetIds,
              targetFaction: 'enemy',
            });
          } else {
            const target = pickRandomTarget(workingUnits, 'enemy');
            if (!target) {
              workingUnits = setUnitIntent(workingUnits, actor.id, '鏃犳湁鏁堢洰鏍?);
              continue;
            }
            workingUnits = setUnitIntent(workingUnits, actor.id, `鏀诲嚮 ${target.name}`);
            attackPlans.set(actor.id, {
              actionId: 'attack',
              targetId: target.id,
              plannedTargetIds: [],
              targetFaction: 'enemy',
            });
          }
        } else {
          const targetId = enemyTargetMap[actor.id];
          const target = targetId ? getUnit(workingUnits, targetId) : null;
          if (!target) {
            workingUnits = setUnitIntent(workingUnits, actor.id, '鏃犳湁鏁堢洰鏍?);
            continue;
          }
          attackPlans.set(actor.id, {
            actionId: 'attack',
            targetId: target.id,
            plannedTargetIds: [],
            targetFaction: 'friendly',
          });
        }
      }

      const maxAttackCount = Math.max(
        0,
        ...Array.from(attackPlans.keys()).map(actorId => {
          const actor = getUnit(workingUnits, actorId);
          return actor ? actor.attackCount : 0;
        }),
      );

      for (let attackIndex = 0; attackIndex < maxAttackCount; attackIndex += 1) {
        for (const actorId of turnOrderIds) {
          const plan = attackPlans.get(actorId);
          if (!plan) continue;
          const actor = getUnit(workingUnits, actorId);
          if (!actor || !isCombatReadyUnit(actor)) continue;
          if (attackIndex >= actor.attackCount) continue;
          const useMainWeaponThisHit = attackIndex < (actor.mainWeaponAttackCount || 0);
          const activeWeapon = useMainWeaponThisHit ? actor.weapon : actor.subWeapon;
          if (!activeWeapon || activeWeapon.type === "鏃?) continue;

          const targetFaction = actor.faction === 'friendly' ? 'enemy' : 'friendly';
          let target = plan.targetId ? getUnit(workingUnits, plan.targetId) : null;
          if (!target || !isCombatReadyUnit(target) || target.faction !== targetFaction) {
            target = pickRandomTarget(workingUnits, targetFaction);
            plan.targetId = target?.id;
          }
          if (!target) continue;

          const isPolearm = /闀挎焺/.test(actor.weapon.type);
          const isHeavyWeapon = /澶у瀷/.test(actor.weapon.type);
          const plannedTargetIds = plan.plannedTargetIds || [];
          const explicitTargets = plannedTargetIds
            .map((id: string) => getUnit(workingUnits, id))
            .filter((unit: BattleCharacter | undefined | null): unit is BattleCharacter =>
              Boolean(unit && isCombatReadyUnit(unit)),
            );
          const extraTargets = isPolearm
            ? workingUnits.filter(
                unit => unit.faction === targetFaction && unit.id !== target.id && isCombatReadyUnit(unit),
              )
            : [];
          const poleTargets = isPolearm
            ? explicitTargets.length
              ? explicitTargets
              : [target, ...extraTargets.slice(0, 2)]
            : [target];

          // 鍒舵湇妯″紡鍙敾鍑诲崟涓洰鏍囷紝涓嶄娇鐢ㄩ暱鏌勬垨閲嶆鍣ㄧ殑鐗规畩閫昏緫
          if (plan.actionId === 'subdue') {
            const result = applySubdue(workingUnits, actor, target, logs, lastRoundAttackersCount);
            workingUnits = result.units;
            if (!result.dodged) {
              const attackerSet = (lastRoundAttackersMap.get(target.id) ?? new Set<string>()) as Set<string>;
              attackerSet.add(actor.id);
              lastRoundAttackersMap.set(target.id, attackerSet);
            }
          } else {
            for (const [index, poleTarget] of poleTargets.entries()) {
              const extraPenalty = isPolearm ? index * 7 : 0;
              const perAttackTargets = isHeavyWeapon
                ? [
                    poleTarget,
                    ...workingUnits
                      .filter(
                        unit =>
                          unit.faction === targetFaction &&
                          unit.id !== poleTarget.id &&
                          isCombatReadyUnit(unit),
                      )
                      .slice(0, 1),
                  ]
                : [poleTarget];
              let allDodged = isHeavyWeapon;
              for (const [targetIndex, targetPick] of perAttackTargets.entries()) {
                const defenseSeq = defenderDefenseCount[targetPick.id] || 0;
                defenderDefenseCount[targetPick.id] = defenseSeq + 1;
                const result = applyAttack(
                  workingUnits,
                  actor,
                  targetPick,
                  defenseSeq,
                  logs,
                  lastRoundAttackersCount,
                  extraPenalty,
                  targetIndex,
                  perAttackTargets.length,
                  true,
                  prev.nonLethalActorIds,
                  activeWeapon,
                );
                workingUnits = result.units;
                if (!result.dodged) {
                  const attackerSet = (lastRoundAttackersMap.get(targetPick.id) ?? new Set<string>()) as Set<string>;
                  attackerSet.add(actor.id);
                  lastRoundAttackersMap.set(targetPick.id, attackerSet);
                }
                if (isHeavyWeapon && !result.dodged) allDodged = false;
              }
              if (isHeavyWeapon && perAttackTargets.length > 0 && allDodged) {
                const latestActor = getUnit(workingUnits, actor.id);
                if (latestActor) {
                  const updatedActor = {
                    ...latestActor,
                    defenseBonus: (latestActor.defenseBonus || 0) - 15,
                  };
                  workingUnits = replaceUnit(workingUnits, updatedActor);
                  appendLog(logs, `${latestActor.name}: 琚棯閬垮鑷村け琛★紝闃插尽妫€瀹?15銆俙);
                }
              }
            }
          }
        }
      }

      const friendAlive = workingUnits.some(unit => unit.faction === 'friendly' && isCombatReadyUnit(unit));
      const enemyAlive = workingUnits.some(unit => unit.faction === 'enemy' && isCombatReadyUnit(unit));
      let result: BattleState['result'] = enemyAlive ? (friendAlive ? null : 'defeat') : 'victory';

      if (roundLimit && prev.round >= roundLimit) {
        appendLog(logs, `杈惧埌鍥炲悎涓婇檺 ${roundLimit}锛屾垬鏂楃粨鏉熴€俙);
        if (enemyAlive && friendAlive) {
          result = 'defeat';
        }
      }

      if (result) {
        appendLog(logs, SETTLEMENT_LOG);
      }

      const nextLastRoundAttackersCount = Object.fromEntries(
        Array.from(lastRoundAttackersMap.entries()).map(([targetId, attackers]) => [targetId, attackers.size]),
      ) as Record<string, number>;

      return {
        round: prev.round + 1,
        units: workingUnits,
        logs: [...prev.logs, ...logs],
        result,
        endReason: result ? 'normal' : prev.endReason,
        lastRoundAttackersCount: nextLastRoundAttackersCount,
        nonLethalActorIds: prev.nonLethalActorIds,
      };
    });
  };

  const handleActionClick = (action: ActionType) => {
    if (action.id === 'end_round') {
      if (!showCurrentRoundOnly) pendingScrollToBottomRef.current = true;
      runRound();
      return;
    }
    planAction(action.id);
  };

  const handleCopyLogs = async () => {
    const buildStatusLabel = (unit: BattleCharacter) => {
      if (unit.escaped) return '宸查€冭窇';
      if (unit.state === '宸茶鍒舵湇') return '銆愯鍒舵湇銆?;
      if (unit.state === '姝讳骸') return '姝讳骸';
      if (unit.state === '浼戝厠') return '浼戝厠';
      if (unit.state === '鏄忚糠') return '鏄忚糠';
      if (unit.hp <= 0) return '婵掓';
      return '姝ｅ父';
    };

    const getTraumaLabelByLevel = (level: number) => {
      if (level >= 4) return '鏂偄';
      if (level >= 3) return '閲嶅垱';
      if (level >= 2) return '璐熶激';
      if (level >= 1) return '鎿︿激';
      return '鏃犱激';
    };

    const getTraumaDetailLabel = (unit: BattleCharacter) => {
      const parts: Array<{ name: string; level: number }> = [
        { name: '宸﹁噦', level: unit.traumaParts.宸﹁噦 },
        { name: '鍙宠噦', level: unit.traumaParts.鍙宠噦 },
        { name: '宸﹁吙', level: unit.traumaParts.宸﹁吙 },
        { name: '鍙宠吙', level: unit.traumaParts.鍙宠吙 },
      ];
      return parts.map(part => `${part.name}${getTraumaLabelByLevel(part.level)}`).join('锛?);
    };

    const enemyUnits = battleState.units.filter(unit => unit.faction === 'enemy');
    const totalExp = _.sumBy(enemyUnits, unit => {
      if (unit.escaped) return getEscapeExpByLevel(unit.level);
      if (unit.state === '姝讳骸') return getKillExpByLevel(unit.level);
      if (unit.hasDowned || unit.state === '鏄忚糠' || unit.hp <= 0) return getDownExpByLevel(unit.level);
      return 0;
    });

    const expReceivers = battleState.units.filter(
      unit => unit.faction === 'friendly' && unit.subFaction === 'squad' && !unit.escaped,
    );
    const perMemberExp = expReceivers.length > 0 ? Math.round(totalExp / expReceivers.length) : 0;
    const expMap = new Map<string, number>();
    expReceivers.forEach(unit => {
      expMap.set(unit.id, perMemberExp);
    });

    const damageDealtMap = new Map<string, number>();
    const killMap = new Map<string, number>();
    const lastAttackerByTarget = new Map<string, string>();

    battleState.logs.forEach(line => {
      const hit = line.match(/^([^:锛歖+)[:锛歖\s*鍛戒腑([^锛?锛?锛?]+).*?閫犳垚\s*(\d+)\s*浼ゅ/);
      if (hit) {
        const attackerName = (hit[1] || '').trim();
        const defenderName = (hit[2] || '').trim();
        const dmg = Number(hit[3] || 0);
        if (attackerName) {
          damageDealtMap.set(attackerName, (damageDealtMap.get(attackerName) || 0) + (Number.isFinite(dmg) ? dmg : 0));
        }
        if (attackerName && defenderName) {
          lastAttackerByTarget.set(defenderName, attackerName);
        }
        return;
      }
      const death = line.match(/^([^:锛歖+)[:锛歖.*纭姝讳骸/);
      if (death) {
        const deadName = (death[1] || '').trim();
        const killer = deadName ? lastAttackerByTarget.get(deadName) : undefined;
        if (killer) {
          killMap.set(killer, (killMap.get(killer) || 0) + 1);
        }
      }
    });

    const summarizeUnit = (unit: BattleCharacter) => {
      const baseHp = Number.isFinite(unit.startHp) ? unit.startHp : unit.hp;
      const damageTaken = Math.max(0, Math.round(baseHp - unit.hp));
      const currentHp = Math.max(0, Math.round(unit.hp));
      const traumaLabel = getTraumaDetailLabel(unit);
      const expText = expMap.has(unit.id) ? `锛岃幏寰?{expMap.get(unit.id)}缁忛獙` : '';
      const dealtDamage = Math.max(0, Math.round(damageDealtMap.get(unit.name) || 0));
      const killCount = Math.max(0, Math.round(killMap.get(unit.name) || 0));
      const combatStatText = `锛岄€犳垚浼ゅ${dealtDamage}锛屽嚮鏉€${killCount}`;
      const consumedMedicalText = (() => {
        const escapedName = _.escapeRegExp(unit.name);
        const usage = battleState.logs.reduce<Record<string, number>>((acc, line) => {
          const m = line.match(new RegExp(`^${escapedName}:\\s*瀵?+?浣跨敤(.+?)(?:锛寍,|銆倈$)`));
          if (!m) return acc;
          const itemName = (m[1] || '').trim();
          if (!itemName) return acc;
          acc[itemName] = (acc[itemName] || 0) + 1;
          return acc;
        }, {});
        const entries = Object.entries(usage);
        if (entries.length === 0) return '';
        return `锛屾秷鑰椾簡${entries.map(([name, count]) => `${name}X${count}`).join('锛?)}`;
      })();
      return `${unit.name}: 鍙楀埌浼ゅ${damageTaken}, 褰撳墠琛€閲?{currentHp}, 鍒涗激(${traumaLabel}), 鐘舵€?{buildStatusLabel(unit)}${combatStatText}${expText}${consumedMedicalText}`;
    };

    const friendLines = battleState.units
      .filter(unit => unit.faction === 'friendly')
      .map(summarizeUnit)
      .join('\n');
    const enemyLines = battleState.units
      .filter(unit => unit.faction === 'enemy')
      .map(summarizeUnit)
      .join('\n');

    const outcome = displayOutcome;
    const outcomeDescription = OUTCOME_DESCRIPTIONS[outcome];

    const summary = `銆愭垬鏂楁€荤粨銆慭n\n銆?{outcome}銆戯細${outcomeDescription}\n\n鎴戞柟锛歕n${friendLines || '鏃?}\n\n鏁屾柟锛歕n${enemyLines || '鏃?}\n\n璇锋牴鎹互涓婃垬鍚庡唴瀹癸紝鎻忓啓杩拌杩欎竴鎴樻枟杩囩▼锛屼笉瑕佸湪姝ｆ枃鍑虹幇鏁板€肩浉鍏冲唴瀹癸紝杩欏満鎴樻枟鎴戞柟銆?{outcome}銆慲;

    try {
      await createChatMessages([{ role: 'user', message: summary }]);
      await triggerSlash('/trigger');
    } catch (error) {
      navigator.clipboard.writeText(summary);
      setBattleState(prev => ({
        ...prev,
        logs: [...prev.logs, `鍙戦€佹€荤粨澶辫触锛屽凡澶嶅埗鍒板壀璐存澘: ${String(error)}`],
      }));
    }
  };

  const openDetailModal = (type: 'weapon' | 'armor' | 'attributes' | 'trauma', character: BattleCharacter) => {
    setDetailModal({ type, character });
  };

  const getTraumaStatus = (unit: BattleCharacter) => {
    const states: string[] = [];
    if (getMaxTraumaLevel(unit) >= 1) states.push('澶辫　');
    if (unit.bleedLayers > 0) states.push(`娴佽${unit.bleedLayers}`);
    if ((unit.fractureStacks || 0) > 0) states.push(`楠ㄦ姌${unit.fractureStacks}`);
    if (unit.state === '浼戝厠') states.push('浼戝厠');
    if (unit.state === '鏄忚糠') states.push('鐪╂檿');
    if (unit.state === '姝讳骸') states.push('姝讳骸');
    if (unit.hp <= 0 && unit.state !== '姝讳骸') states.push('婵掓');
    if (states.length === 0) return '鏃?;
    return states.join(' 路 ');
  };

  const getTraumaThreshold = (tgh: number, level: number) => getTraumaThresholdByLevel(tgh, level);

  const renderDetailContent = () => {
    if (!detailModal) return null;
    const { type, character } = detailModal;
    const armorBaseDR = toNumber(
      _.get(character.armorRaw, ['闃叉姢鑳藉姏(DR)']),
      toNumber(_.get(character.armorRaw, ['闃叉姢鑳藉姏']), 0),
    );
    const tghValue = Math.max(1, character.attributes.TGH || 1);
    const getRemaining = (part: '宸﹁噦' | '鍙宠噦' | '宸﹁吙' | '鍙宠吙') =>
      character.traumaParts[part] >= 4
        ? 0
        : Math.round(
            Math.max(
              0,
              character.traumaAccumulated?.[part] ?? getTraumaThreshold(tghValue, character.traumaParts[part]),
            ),
          );
    const traumaThresholdText = `宸﹁噦${getRemaining('宸﹁噦')} 鍙宠噦${getRemaining('鍙宠噦')} 宸﹁吙${getRemaining('宸﹁吙')} 鍙宠吙${getRemaining(
      '鍙宠吙',
    )}`;
    const traumaStageText = `宸﹁噦${getTraumaStageLabel(character.traumaParts.宸﹁噦)} 鍙宠噦${getTraumaStageLabel(
      character.traumaParts.鍙宠噦,
    )} 宸﹁吙${getTraumaStageLabel(character.traumaParts.宸﹁吙)} 鍙宠吙${getTraumaStageLabel(character.traumaParts.鍙宠吙)}`;
    const traumaStatus = getTraumaStatus(character);

    if (type === 'weapon') {
      return (
        <div className="p-6 grid gap-4 text-sm">
          <div className="text-xs text-stone-400">姝﹀櫒淇℃伅</div>
          <div className="space-y-2 font-mono text-stone-200">
            <div className="pt-1">涓绘鍣?/div>
            <div>鍚嶇О锛歿character.weapon.name}</div>
            <div>绫诲瀷锛歿character.weapon.type}</div>
            <div>浼ゅ楠帮細{character.weapon.damageDice}</div>
            <div>浼ゅ绫诲瀷锛歿character.weapon.damageType || '鏈畾涔?}</div>
            {character.subWeapon.type !== '鏃? ? (
              <>
                <div className="pt-2 border-t border-stone-800/50">鍓鍣?/div>
                <div>鍚嶇О锛歿character.subWeapon.name}</div>
                <div>绫诲瀷锛歿character.subWeapon.type}</div>
                <div>浼ゅ楠帮細{character.subWeapon.damageDice}</div>
                <div>浼ゅ绫诲瀷锛歿character.subWeapon.damageType || '鏈畾涔?}</div>
              </>
            ) : null}
          </div>
        </div>
      );
    }

    if (type === 'attributes') {
      return (
        <div className="p-6 grid gap-4 text-sm">
          <div className="text-xs text-stone-400">涓冪淮灞炴€?/div>
          <div className="grid grid-cols-2 gap-3 font-mono text-stone-200">
            <div>STR锛歿character.attributes.STR}</div>
            <div>DEX锛歿character.attributes.DEX}</div>
            <div>PER锛歿character.attributes.PER}</div>
            <div>TGH锛歿character.attributes.TGH}</div>
            <div>WIL锛歿character.attributes.WIL}</div>
            <div>INT锛歿character.attributes.INT}</div>
            <div>CHA锛歿character.attributes.CHA}</div>
          </div>
        </div>
      );
    }

    if (type === 'armor') {
      return (
        <div className="p-6 grid gap-4 text-sm">
          <div className="text-xs text-stone-400">鎶ょ敳淇℃伅</div>
          <div className="space-y-2 font-mono text-stone-200">
            <div>鎬籇R锛歿character.armorDR}</div>
            <div>鍩虹DR锛歿armorBaseDR}</div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 grid gap-4 text-sm">
        <div className="text-xs text-stone-400">鍒涗激涓庣姸鎬?/div>
        <div className="space-y-2 font-mono text-stone-200">
          <div>闃堝€硷細{traumaThresholdText}</div>
          <div>鍒涗激锛歿traumaStageText}</div>
          <div>鐘舵€侊細{traumaStatus}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-auto aspect-[9/16] sm:aspect-[3/4] lg:aspect-[16/9] bg-[#050505] text-stone-300 font-sans selection:bg-stone-700 selection:text-white flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-900/20 via-[#050505] to-black pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>

      {isMobile && loadError && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
          <div className="w-full max-w-sm rounded-sm border border-amber-900/60 bg-stone-900/90 p-4 text-center">
            <div className="text-amber-300 text-sm font-mono">鏃犳硶璇诲彇 MVU 鍙橀噺</div>
            <div className="mt-2 text-xs text-stone-400 font-mono break-all">{loadError}</div>
            <button
              type="button"
              onClick={handleRetryLoad}
              disabled={loading}
              className={`mt-4 px-4 py-2 text-xs font-mono border rounded-sm transition-colors ${
                loading
                  ? 'text-stone-600 border-stone-800/60 cursor-not-allowed'
                  : 'text-amber-200 border-amber-900/60 hover:bg-amber-900/30'
              }`}
            >
              {loading ? '閲嶈瘯涓?..' : '鍒犻櫎姝ゆ秷鎭紝閲嶆柊鐐瑰嚮鎴樻枟鏍忥紝澶氳瘯鍑犳锛屾垜涓烘鎰熷埌寰堟姳姝?}
            </button>
          </div>
        </div>
      )}

      <header className="relative z-20 px-3 py-2.5 lg:px-8 lg:py-5 border-b border-stone-800/40 bg-black/40 backdrop-blur-md flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-sm border border-stone-700/50 flex items-center justify-center bg-stone-900/80 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            <Sword size={14} className="text-stone-400 lg:w-4 lg:h-4" />
          </div>
          <div className="text-xl lg:text-2xl font-serif text-stone-200 tracking-[0.15em] lg:tracking-[0.25em] text-shadow-glow">
            缁堟湯涔嬭瘲
          </div>
        </div>
        <div className="flex items-center gap-3 lg:gap-6">
          <div className="text-sm lg:text-lg font-serif text-stone-400 tracking-widest border-l border-stone-800 pl-3 lg:pl-6 flex items-center gap-1.5 lg:gap-2 relative">
            鍥炲悎鏁?            <span className="text-stone-200 font-mono text-xl lg:text-2xl">
              {roundLimit
                ? `${String(battleState.round).padStart(2, '0')}/${String(roundLimit).padStart(2, '0')}`
                : String(battleState.round).padStart(2, '0')}
            </span>
            <button
              onClick={() => setSettingsOpen(prev => !prev)}
              className="text-stone-500 hover:text-stone-200 transition-colors"
            >
              <Settings size={16} />
            </button>
            {settingsOpen && (
              <>
                <button
                  type="button"
                  aria-label="鍏抽棴璁剧疆"
                  onClick={() => setSettingsOpen(false)}
                  className="fixed inset-0 z-10 cursor-default"
                />
                <div className="absolute z-20 mt-32 right-4 bg-stone-900/90 border border-stone-700/60 rounded-sm shadow-lg p-2 text-xs font-mono w-52">
                  <button
                    onClick={() => {
                      setSettingsOpen(false);
                      setInfoModal('rules');
                    }}
                    className="block w-full text-left px-3 py-2 rounded-sm hover:bg-stone-800/60 text-stone-300"
                  >
                    鎴樻枟娴佺▼瑙勫垯璇﹁В
                  </button>
                  <button
                    onClick={() => {
                      setSettingsOpen(false);
                      toggleFullscreen();
                    }}
                    className="block w-full text-left px-3 py-2 rounded-sm hover:bg-stone-800/60 text-stone-300"
                  >
                    {isFullscreen ? '閫€鍑哄叏灞? : '杩涘叆鍏ㄥ睆'}
                  </button>
                  <button
                    onClick={() => {
                      setSettingsOpen(false);
                      setInfoModal('round');
                    }}
                    className="block w-full text-left px-3 py-2 rounded-sm hover:bg-stone-800/60 text-stone-300"
                  >
                    鍥炲悎鏁伴噺閫夋嫨
                  </button>
                  <button
                    onClick={() => {
                      setSettingsOpen(false);
                      setInfoModal('tutorial');
                    }}
                    className="block w-full text-left px-3 py-2 rounded-sm hover:bg-stone-800/60 text-stone-300"
                  >
                    鎴樻枟闈㈡澘鏁欑▼
                  </button>
                  <button
                    onClick={() => {
                      setSettingsOpen(false);
                      setInfoModal('weapon');
                    }}
                    className="block w-full text-left px-3 py-2 rounded-sm hover:bg-stone-800/60 text-stone-300"
                  >
                    姝﹀櫒绫诲埆璇﹁В
                  </button>
                  <button
                    onClick={() => {
                      setSettingsOpen(false);
                      setInfoModal('trauma');
                    }}
                    className="block w-full text-left px-3 py-2 rounded-sm hover:bg-stone-800/60 text-stone-300"
                  >
                    鍒涗激涓庣姸鎬佽瑙?                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {infoModal === 'rules' && (
        <InfoModal title="鎴樻枟娴佺▼瑙勫垯璇﹁В" onClose={() => setInfoModal(null)}>
          <div className="p-6 max-h-[70vh] overflow-y-auto font-mono text-sm whitespace-pre-wrap text-stone-300">
            {BATTLE_RULES}
          </div>
        </InfoModal>
      )}
      {infoModal === 'tutorial' && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {spotlightRect && (
            <div
              className="absolute rounded-sm"
              style={{
                left: spotlightRect.left - 6,
                top: spotlightRect.top - 6,
                width: spotlightRect.width + 12,
                height: spotlightRect.height + 12,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.6), 0 0 30px rgba(251,191,36,0.85)',
                border: '1px solid rgba(251,191,36,0.8)',
              }}
            />
          )}
          <div
            className="absolute max-w-[320px] bg-stone-900/95 border border-amber-900/60 rounded-sm shadow-[0_0_40px_rgba(0,0,0,0.8)] p-4 text-stone-200 pointer-events-auto"
            style={
              tooltipPos
                ? { left: tooltipPos.left, top: tooltipPos.top }
                : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
            }
          >
            <div className="text-sm font-serif text-amber-200 tracking-[0.15em]">
              {tutorialSteps[tutorialStep].title}
            </div>
            <div className="mt-3 text-xs text-stone-300 leading-relaxed">
              <div className="text-amber-100/90">{tutorialSteps[tutorialStep].quote}</div>
              <div className="mt-1">{tutorialSteps[tutorialStep].description}</div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[10px] font-mono text-stone-500">
                {tutorialStep + 1} / {tutorialSteps.length}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setInfoModal(null)} className="text-[10px] text-stone-400 hover:text-stone-200">
                  璺宠繃
                </button>
                <button
                  onClick={() => setTutorialStep(prev => Math.max(0, prev - 1))}
                  className={`px-3 py-1 text-xs font-mono border rounded-sm ${
                    tutorialStep <= 0
                      ? 'text-stone-600 border-stone-800/60 cursor-not-allowed'
                      : 'text-stone-300 border-stone-700/60 hover:bg-stone-800/40'
                  }`}
                  disabled={tutorialStep <= 0}
                >
                  涓婁竴姝?                </button>
                <button
                  onClick={() => {
                    if (tutorialStep >= tutorialSteps.length - 1) {
                      setInfoModal(null);
                      return;
                    }
                    setTutorialStep(prev => Math.min(prev + 1, tutorialSteps.length - 1));
                  }}
                  className="px-3 py-1 text-xs font-mono text-amber-200 border border-amber-900/60 rounded-sm hover:bg-amber-900/30"
                >
                  {tutorialStep >= tutorialSteps.length - 1 ? '瀹屾垚' : '涓嬩竴姝?}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {infoModal === 'weapon' && (
        <InfoModal title="姝﹀櫒绫诲埆璇﹁В" onClose={() => setInfoModal(null)}>
          <div className="p-6 max-h-[70vh] overflow-y-auto font-mono text-sm whitespace-pre-wrap text-stone-300">
            {WEAPON_CATEGORY_GUIDE}
          </div>
        </InfoModal>
      )}
      {infoModal === 'trauma' && (
        <InfoModal title="鍒涗激涓庣姸鎬佽瑙? onClose={() => setInfoModal(null)}>
          <div className="p-6 max-h-[70vh] overflow-y-auto font-mono text-sm whitespace-pre-wrap text-stone-300">
            {TRAUMA_RULES}
          </div>
        </InfoModal>
      )}
      {infoModal === 'round' && (
        <InfoModal title="鍥炲悎鏁伴噺閫夋嫨" onClose={() => setInfoModal(null)}>
          <div className="p-6 max-h-[70vh] overflow-y-auto font-mono text-sm text-stone-300">
            <div className="text-xs text-stone-400 mb-4">褰撳墠鍥炲悎涓婇檺锛歿roundLimit ? roundLimit : '鏃犱笂闄?}</div>
            <div className="grid gap-2">
              {[5, 10, 15].map(limit => (
                <button
                  key={limit}
                  onClick={() => {
                    setRoundLimit(limit);
                    setInfoModal(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-sm border border-stone-700/60 hover:bg-stone-800/60 ${
                    roundLimit === limit ? 'text-emerald-300' : 'text-stone-300'
                  }`}
                >
                  涓婇檺 {limit}
                </button>
              ))}
              <button
                onClick={() => {
                  setRoundLimit(null);
                  setInfoModal(null);
                }}
                className={`w-full text-left px-3 py-2 rounded-sm border border-stone-700/60 hover:bg-stone-800/60 ${
                  roundLimit === null ? 'text-emerald-300' : 'text-stone-300'
                }`}
              >
                鏃犱笂闄?              </button>
            </div>
          </div>
        </InfoModal>
      )}

      <main className="flex-1 min-h-0 relative z-10 flex flex-col lg:flex-row overflow-hidden">
        {(targetingMode === 'attack' || targetingMode === 'subdue') && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="absolute left-0 top-0 h-full w-[28%] min-w-[300px] bg-black/50" />
          </div>
        )}
        <div
          className="order-1 lg:order-none shrink-0 min-h-[156px] lg:min-h-0 w-full lg:w-[28%] lg:min-w-[300px] p-2.5 lg:p-6 overflow-x-auto overflow-y-visible lg:overflow-x-hidden lg:overflow-y-auto border-b border-stone-800/30 lg:border-b-0 lg:border-r lg:border-stone-800/30 bg-gradient-to-r from-black/80 to-transparent scrollbar-hide flex flex-col min-h-0 overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
        >
          <div className="flex items-center justify-between mb-3 lg:mb-6 pb-2 border-b border-stone-800/50">
            <h2 className="text-sm font-serif text-stone-400 tracking-[0.2em] flex items-center gap-3">
              <div className="w-1.5 h-4 bg-blue-600 rounded-sm shadow-[0_0_10px_rgba(37,99,235,0.8)]"></div>
              鍙嬫柟闃佃惀
            </h2>
            <span className="text-xs font-mono text-stone-600">
              {friendlyAliveCount}/{friendlyUnits.length} 鍗曚綅
            </span>
          </div>
          <div className="flex flex-row lg:flex-col gap-3 lg:gap-4 flex-1 min-w-max lg:min-w-0 pb-1 lg:pb-0">
            {friendlyUnits.map(unit => (
              <CharacterCard
                key={unit.id}
                character={unit}
                isExpanded={expandedCharId === unit.id}
                isSelected={medicalSelecting ? selectedMedicalTargetId === unit.id : selectedActorId === unit.id}
                nonLethalEnabled={battleState.nonLethalActorIds.includes(unit.id)}
                onToggle={() => handleToggleExpand(unit.id)}
                onSelect={() => {
                  if (medicalSelecting) {
                    if (!unit.escaped) {
                      setSelectedMedicalTargetId(unit.id);
                      const actorId = medicalActorId || selectedActorId || playerId;
                      if (actorId) updateUnitIntent(actorId, `鍖荤枟 ${unit.name}`);
                      setMedicalSelecting(false);
                      setMedicalItemSelecting(true);
                    }
                    return;
                  }
                  if (unit.subFaction === 'squad' && !unit.escaped) handleSelectActor(unit.id);
                }}
                onOpenDetail={openDetailModal}
              />
            ))}
          </div>
        </div>

        <div
          className={`order-2 lg:order-none flex flex-col relative ${
            isMobile && mobileLogCollapsed
              ? 'flex-none h-[44px] min-h-0 p-0'
              : 'flex-1 min-h-[28vh] lg:min-h-0 p-2.5 lg:p-8'
          }`}
        >
          {!(isMobile && mobileLogCollapsed) && (
            <div className="absolute inset-0 bg-stone-950/40 backdrop-blur-sm m-2.5 lg:m-8 rounded-sm border border-stone-800/40 shadow-[inset_0_0_60px_rgba(0,0,0,0.8)]"></div>
          )}

          <button
            type="button"
            aria-label={mobileLogCollapsed ? '灞曞紑鎴樻枟鏃ュ織' : '鎶樺彔鎴樻枟鏃ュ織'}
            onClick={() => setMobileLogCollapsed(prev => !prev)}
            className={`${isMobile ? 'grid' : 'hidden'} absolute right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-sm border border-stone-700/70 bg-black/60 text-stone-200 hover:bg-black/80 active:bg-black/90 transition-colors place-items-center shadow-[0_0_18px_rgba(0,0,0,0.6)]`}
          >
            {mobileLogCollapsed ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {!(isMobile && mobileLogCollapsed) && (
            <div
              ref={logScrollRef}
              className="relative z-10 flex-1 overflow-y-auto p-6 lg:p-10 font-serif text-base leading-[1.8] text-stone-300 space-y-3 scrollbar-hide overscroll-contain"
              style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
            >
              <div className="mb-4 lg:mb-6 flex items-center justify-center gap-2.5">
                <span className="inline-block px-4 py-1 border border-stone-800/60 rounded-sm text-xs font-mono text-stone-500 tracking-widest bg-stone-900/30">
                  鎴樻枟鏃ュ織
                </span>
                <button
                  type="button"
                  onClick={() => setShowCurrentRoundOnly(prev => !prev)}
                  className="px-3 py-1 border border-stone-800/70 rounded-sm text-[11px] font-mono text-stone-400 bg-stone-900/40 hover:text-stone-200 hover:border-stone-600/70 transition-colors"
                >
                  {showCurrentRoundOnly ? '鏄剧ず鍏ㄩ儴' : '鏄剧ず褰撳墠鍥炲悎'}
                </button>
              </div>

              {!isMobile && loadError ? (
                <div className="space-y-3 text-center">
                  <div className="text-amber-300 text-sm font-mono">鏃犳硶璇诲彇 MVU 鍙橀噺</div>
                  <div className="text-xs text-stone-500 font-mono break-all">{loadError}</div>
                  <button
                    type="button"
                    onClick={handleRetryLoad}
                    disabled={loading}
                    className={`mx-auto px-4 py-2 text-xs font-mono border rounded-sm transition-colors ${
                      loading
                        ? 'text-stone-600 border-stone-800/60 cursor-not-allowed'
                        : 'text-amber-200 border-amber-900/60 hover:bg-amber-900/30'
                    }`}
                  >
                    {loading ? '閲嶈瘯涓?..' : '鍒犻櫎姝ゆ秷鎭紝閲嶆柊鐐瑰嚮鎴樻枟鏍忥紝澶氳瘯鍑犳锛屾垜涓烘鎰熷埌寰堟姳姝?}
                  </button>
                </div>
              ) : displayedLogs.length === 0 ? (
                <div className="text-center text-stone-500 text-sm font-mono">绛夊緟浣犵殑鎸囦护...</div>
              ) : (
                <div className="space-y-2 font-mono text-sm whitespace-pre-wrap">
                  {displayedLogs.map((line, index) => {
                    const isSettlement = line.startsWith(SETTLEMENT_LOG);
                    return (
                      <div
                        key={`${line}-${index}`}
                        className={`${getLogLineClass(line)} ${isSettlement ? 'cursor-pointer text-base sm:text-lg text-center' : ''}`}
                        onClick={() => {
                          if (isSettlement) setResultConfirmed(true);
                        }}
                      >
                        {line}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className="order-3 lg:order-none shrink-0 h-[188px] lg:h-auto lg:min-h-0 w-full lg:w-[28%] lg:min-w-[300px] p-2.5 lg:p-6 overflow-x-auto overflow-y-visible lg:overflow-x-hidden lg:overflow-y-auto border-t border-stone-800/30 lg:border-t-0 lg:border-l lg:border-stone-800/30 bg-gradient-to-l from-black/80 to-transparent scrollbar-hide flex flex-col min-h-0 overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
        >
          <div className="flex items-center justify-between mb-3 lg:mb-6 pb-2 border-b border-stone-800/50">
            <span className="text-xs font-mono text-stone-600">
              {enemyAliveCount}/{enemyUnits.length} 鍗曚綅
            </span>
            <h2 className="text-sm font-serif text-stone-400 tracking-[0.2em] flex items-center gap-3">
              鏁屾柟闃佃惀
              <div className="w-1.5 h-4 bg-red-600 rounded-sm shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
            </h2>
          </div>
          <div className="flex flex-row items-end lg:items-stretch lg:flex-col gap-3 lg:gap-4 flex-1 min-w-max lg:min-w-0 pb-1 lg:pb-0">
            {enemyUnits.map(unit => (
              <CharacterCard
                key={unit.id}
                character={unit}
                isExpanded={expandedCharId === unit.id}
                isSelected={selectedTargetId === unit.id || (!!targetingMode && attackSelectionIds.includes(unit.id))}
                nonLethalEnabled={false}
                onToggle={() => handleToggleExpand(unit.id)}
                onSelect={() => {
                  setSelectedTargetId(unit.id);
                  if (targetingMode === 'attack' || targetingMode === 'subdue') {
                    const actorId = selectedActorId || playerId;
                    const actor = actorId ? getUnit(battleState.units, actorId) : null;
                    if (
                      actorId &&
                      actor &&
                      actor.subFaction === 'squad' &&
                      isCombatReadyUnit(actor) &&
                      isCombatReadyUnit(unit)
                    ) {
                      if (targetingMode === 'subdue') {
                        setPlannedActions(prev => ({
                          ...prev,
                          [actorId]: { actionId: 'subdue', targetId: unit.id },
                        }));
                        updateUnitIntent(actorId, `鍒舵湇 ${unit.name}`);
                        setTargetingMode(null);
                        setAttackSelectionIds([]);
                        setAttackSelectionActorId(null);
                      } else if (/闀挎焺/.test(actor.weapon.type)) {
                        setAttackSelectionIds(prev => {
                          const next = prev.includes(unit.id)
                            ? prev.filter(id => id !== unit.id)
                            : [...prev, unit.id].slice(0, 3);
                          if (next.length >= 3) {
                            setPlannedActions(actionPrev => ({
                              ...actionPrev,
                              [actorId]: { actionId: 'attack', targetIds: next },
                            }));
                            updateUnitIntent(actorId, `鏀诲嚮 ${next.join('銆?)}`);
                            setTargetingMode(null);
                            setAttackSelectionActorId(null);
                          }
                          return next;
                        });
                      } else {
                        setPlannedActions(prev => ({
                          ...prev,
                          [actorId]: { actionId: 'attack', targetId: unit.id },
                        }));
                        updateUnitIntent(actorId, `鏀诲嚮 ${unit.name}`);
                        setTargetingMode(null);
                        setAttackSelectionIds([]);
                        setAttackSelectionActorId(null);
                      }
                    }
                  }
                }}
                onOpenDetail={openDetailModal}
              />
            ))}
            {enemyUnits.length === 0 && enemyAliveCount === 0 ? (
              <div className="w-full min-w-[74vw] max-w-[320px] lg:min-w-0 lg:max-w-none rounded-sm border border-red-800/60 bg-red-950/25 px-3 py-4 text-center font-mono text-xs leading-relaxed text-red-200 shadow-[0_0_20px_rgba(220,38,38,0.25)]">
                <span>銆愯鏌ョ湅鐘舵€佹爮鈥滆閲庘€濇槸鍚︽湁鈥?/span>
                <span className="text-red-400 font-semibold">鏁屽绔嬪満</span>
                <span>鈥濄€?/span>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      <footer className="relative z-20 mt-10 lg:mt-0 border-t border-stone-800/50 bg-black/60 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-4xl mx-auto p-2.5 lg:p-4 flex items-center justify-center gap-2.5 lg:gap-6">
          <div className="relative">
            <button
              onClick={() => setNonLethalMenuOpen(!nonLethalMenuOpen)}
              className="group relative flex flex-col items-center justify-center w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-sm border bg-stone-900/40 backdrop-blur-md transition-all duration-300 text-fuchsia-300 border-fuchsia-900/50 hover:bg-fuchsia-950/40 hover:border-fuchsia-500/50 group-hover:shadow-[0_0_20px_rgba(217,70,239,0.3)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-30 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-30 group-hover:opacity-100 transition-opacity"></div>
              <Shield
                size={22}
                className="mb-2 sm:mb-3 group-hover:-translate-y-1 group-hover:scale-110 transition-transform duration-300"
              />
              <span className="text-[11px] sm:text-sm font-serif tracking-[0.15em]">闈炶嚧鍛?/span>
            </button>
            {nonLethalMenuOpen && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded-sm border border-stone-700/60 bg-stone-900/95 shadow-[0_0_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden">
                <div className="p-2 space-y-1">
                  <div className="text-xs font-mono text-stone-400 px-3 py-2 border-b border-stone-800/60">
                    闈炶嚧鍛芥ā寮?                  </div>
                  <button
                    onClick={() => {
                      setBattleState(prev => ({
                        ...prev,
                        nonLethalActorIds: prev.units
                          .filter(unit => unit.faction === 'friendly')
                          .map(unit => unit.id),
                      }));
                      setNonLethalMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-sm text-sm font-mono ${
                      battleState.nonLethalActorIds.length > 0 &&
                      friendlyUnits.length > 0 &&
                      friendlyUnits.every(unit => battleState.nonLethalActorIds.includes(unit.id))
                        ? 'text-emerald-300 bg-emerald-900/30'
                        : 'text-stone-300 hover:bg-stone-800/60'
                    }`}
                  >
                    鎵€鏈夊弸鏂规垚鍛樺紑鍚?                  </button>
                  <button
                    onClick={() => {
                      const actorId = selectedActorId || playerId;
                      if (!actorId) return;
                      setBattleState(prev => {
                        const next = new Set(prev.nonLethalActorIds);
                        next.add(actorId);
                        return { ...prev, nonLethalActorIds: Array.from(next) };
                      });
                      setNonLethalMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-sm text-sm font-mono ${
                      (() => {
                        const actorId = selectedActorId || playerId;
                        return !!actorId && battleState.nonLethalActorIds.includes(actorId);
                      })()
                        ? 'text-emerald-300 bg-emerald-900/30'
                        : 'text-stone-300 hover:bg-stone-800/60'
                    }`}
                  >
                    褰撳墠瑙掕壊寮€鍚?                  </button>
                  <button
                    onClick={() => {
                      const actorId = selectedActorId || playerId;
                      if (!actorId) return;
                      setBattleState(prev => ({
                        ...prev,
                        nonLethalActorIds: prev.nonLethalActorIds.filter(id => id !== actorId),
                      }));
                      setNonLethalMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-sm text-sm font-mono ${
                      (() => {
                        const actorId = selectedActorId || playerId;
                        return !!actorId && !battleState.nonLethalActorIds.includes(actorId);
                      })()
                        ? 'text-emerald-300 bg-emerald-900/30'
                        : 'text-stone-300 hover:bg-stone-800/60'
                    }`}
                  >
                    褰撳墠瑙掕壊鍏抽棴
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            ref={autoSelectRef}
            onClick={autoSelectTargets}
            className="group relative flex flex-col items-center justify-center w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-sm border bg-stone-900/40 backdrop-blur-md transition-all duration-300 text-amber-300 border-amber-900/50 hover:bg-amber-950/40 hover:border-amber-500/50 group-hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-30 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-30 group-hover:opacity-100 transition-opacity"></div>
            <Crosshair
              size={22}
              className="mb-2 sm:mb-3 group-hover:-translate-y-1 group-hover:scale-110 transition-transform duration-300"
            />
            <span className="text-[11px] sm:text-sm font-serif tracking-[0.15em]">鑷姩閫夋嫨</span>
          </button>
          {actions.map(action => (
            <button
              key={action.id}
              ref={el => {
                actionButtonRefs.current[action.id] = el;
              }}
              onClick={() => handleActionClick(action)}
              className={`group relative flex flex-col items-center justify-center w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-sm border bg-stone-900/40 backdrop-blur-md transition-all duration-300 ${action.color} ${action.glow} overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-30 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-30 group-hover:opacity-100 transition-opacity"></div>

              <action.icon
                size={22}
                className="mb-2 sm:mb-3 group-hover:-translate-y-1 group-hover:scale-110 transition-transform duration-300"
              />
              <span className="text-[11px] sm:text-sm font-serif tracking-[0.15em]">{action.label}</span>
            </button>
          ))}
        </div>
      </footer>

      {detailModal && (
        <InfoModal
          title={`${detailModal.character.name} 路 ${
            detailModal.type === 'weapon'
              ? '姝﹀櫒涓庤澶?
              : detailModal.type === 'armor'
                ? '鎶ょ敳涓庢姉鎬?
                : detailModal.type === 'attributes'
                  ? '涓冪淮灞炴€?
                  : '鍒涗激涓庣姸鎬?
          }`}
          onClose={() => setDetailModal(null)}
        >
          {renderDetailContent()}
        </InfoModal>
      )}
      {battleState.result && resultConfirmed && (
        <BattleResultModal
          outcome={displayOutcome}
          outcomeDescription={battleOutcomeDescription}
          logs={battleState.logs}
          onCopy={handleCopyLogs}
        />
      )}
      {surrenderConfirmOpen && !battleState.result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
            onClick={() => setSurrenderConfirmOpen(false)}
          ></div>
          <div className="relative glass-panel w-full max-w-md rounded-sm overflow-hidden border border-stone-700/40 shadow-[0_0_80px_rgba(0,0,0,0.9)] animate-fade-in-up">
            <div className="p-6 border-b border-stone-800/60 bg-gradient-to-r from-stone-900/90 to-transparent flex items-center justify-between">
              <h2 className="text-lg font-serif text-stone-100 tracking-[0.2em]">鎶曢檷纭</h2>
              <button
                onClick={() => setSurrenderConfirmOpen(false)}
                className="text-stone-500 hover:text-stone-200 transition-colors px-2 py-1"
              >
                鍏抽棴
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm font-mono text-stone-300">
              <div>鎶曢檷鎰忓懗鐫€鍏ㄥ啗瑕嗘病锛岀敓姝诲叏鐢卞鏂逛簡銆?/div>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setSurrenderConfirmOpen(false)}
                  className="px-4 py-2 border border-stone-700/60 rounded-sm text-stone-300 hover:bg-stone-800/60"
                >
                  鍚?                </button>
                <button
                  onClick={confirmSurrender}
                  className="px-4 py-2 border border-rose-700/60 rounded-sm text-rose-200 hover:bg-rose-950/40"
                >
                  鏄?                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {tacticsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
            onClick={() => setTacticsOpen(false)}
          ></div>
          <div className="relative glass-panel w-full max-w-md rounded-sm overflow-hidden border border-stone-700/40 shadow-[0_0_80px_rgba(0,0,0,0.9)] animate-fade-in-up">
            <div className="p-6 border-b border-stone-800/60 bg-gradient-to-r from-stone-900/90 to-transparent flex items-center justify-between">
              <h2 className="text-lg font-serif text-stone-100 tracking-[0.2em]">鎴樻湳鎸囦护</h2>
              <button
                onClick={() => setTacticsOpen(false)}
                className="text-stone-500 hover:text-stone-200 transition-colors px-2 py-1"
              >
                鍏抽棴
              </button>
            </div>
            <div className="p-6 space-y-3 text-sm font-mono">
              <button
                onClick={() => applyTactic('taunt')}
                className="w-full text-left px-4 py-2 border border-stone-700/60 rounded-sm hover:bg-stone-800/60"
              >
                鍢插紕锛氬己鍒堕€変腑鐨勬晫浜烘敾鍑绘垜锛屾湰鍥炲悎涓嶆敾鍑?              </button>
              <button
                onClick={() => applyTactic('defense')}
                className="w-full text-left px-4 py-2 border border-stone-700/60 rounded-sm hover:bg-stone-800/60"
              >
                闃插尽锛氭牸鎸″熀纭€+15锛屾湰鍥炲悎涓嶆敾鍑?              </button>
              <button
                onClick={() => applyTactic('medical')}
                className="w-full text-left px-4 py-2 border border-stone-700/60 rounded-sm hover:bg-stone-800/60"
              >
                鍖荤枟锛氶€夋嫨鐩爣涓庣墿鍝?              </button>
              <button
                onClick={() => applyTactic('escape')}
                className="w-full text-left px-4 py-2 border border-stone-700/60 rounded-sm hover:bg-stone-800/60"
              >
                閫冭窇锛氳嫢鏈鏁屼汉閿佸畾鍒欓€€鍑烘垬鏂?              </button>
            </div>
          </div>
        </div>
      )}
      {medicalItemSelecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
            onClick={() => setMedicalItemSelecting(false)}
          ></div>
          <div className="relative glass-panel w-full max-w-md rounded-sm overflow-hidden border border-stone-700/40 shadow-[0_0_80px_rgba(0,0,0,0.9)] animate-fade-in-up">
            <div className="p-6 border-b border-stone-800/60 bg-gradient-to-r from-stone-900/90 to-transparent flex items-center justify-between">
              <h2 className="text-lg font-serif text-stone-100 tracking-[0.2em]">閫夋嫨鍖荤枟鐗╁搧</h2>
              <button
                onClick={() => setMedicalItemSelecting(false)}
                className="text-stone-500 hover:text-stone-200 transition-colors px-2 py-1"
              >
                鍏抽棴
              </button>
            </div>
            <div className="p-6 space-y-3 text-sm font-mono">
              {(() => {
                const actor = medicalActorId ? getUnit(battleState.units, medicalActorId) : null;
                if (!actor) return <div className="text-stone-500">鏈€夋嫨鎵ц鑰?/div>;
                const items = actor.backpackItems || {};
                const hasItem = (name: string) => toNumber(items[name]?.鏁伴噺, 0) > 0;
                const list: string[] = [];
                MEDICAL_ITEM_NAMES.forEach(name => {
                  if (hasItem(name)) list.push(name);
                });
                Object.entries(items).forEach(([name, item]) => {
                  if (list.includes(name)) return;
                  if (isMedicalBackpackItem(name, item) && hasItem(name)) {
                    list.push(name);
                  }
                });
                if (list.length === 0) {
                  return <div className="text-stone-500">姝よ鑹茶儗鍖呮病鏈夊彲鐢ㄥ尰鐤楃墿鍝?/div>;
                }
                return list.map(name => (
                  <button
                    key={name}
                    onClick={() => {
                      setSelectedMedicalItem(name);
                      setMedicalItemSelecting(false);
                      const actorId = medicalActorId || selectedActorId || playerId;
                      if (actorId) {
                        setPlannedActions(prev => ({
                          ...prev,
                          [actorId]: {
                            ...prev[actorId],
                            actionId: 'tactics',
                            tactic: 'medical',
                            itemName: name,
                          },
                        }));
                        updateUnitIntent(actorId, `鍖荤枟鐗╁搧 ${name}`);
                      }
                    }}
                    className="w-full text-left px-4 py-2 border border-stone-700/60 rounded-sm hover:bg-stone-800/60"
                  >
                    {name}x{toNumber(items[name]?.鏁伴噺, 0)}
                  </button>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

