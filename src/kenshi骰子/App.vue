<template>
  <div class="page">
    <div id="dice-mount-point" class="dice-mount-point">
      <div class="dice-check-container" :class="stateClass">
        <div class="dice-check-inner">
          <div class="check-header">{{ checkName }}</div>

          <div class="check-arena">
            <div class="arena-side">
              <div class="arena-side-label">TOTAL</div>
              <div class="d20-container" :class="{ 'is-rolling': isRolling }">
                <svg class="d20-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill-opacity="0.1" />
                  <polygon points="50,5 25,40 75,40" fill-opacity="0.2" />
                  <polygon points="50,95 25,60 75,60" fill-opacity="0.2" />
                  <polygon points="25,40 75,40 95,25 95,75 75,60 25,60 5,75 5,25" fill-opacity="0.05" />
                  <line x1="50" y1="5" x2="25" y2="40" />
                  <line x1="50" y1="5" x2="75" y2="40" />
                  <line x1="5" y1="25" x2="25" y2="40" />
                  <line x1="95" y1="25" x2="75" y2="40" />
                  <line x1="25" y1="40" x2="25" y2="60" />
                  <line x1="75" y1="40" x2="75" y2="60" />
                  <line x1="25" y1="40" x2="75" y2="40" />
                  <line x1="25" y1="60" x2="75" y2="60" />
                  <line x1="50" y1="95" x2="25" y2="60" />
                  <line x1="50" y1="95" x2="75" y2="60" />
                  <line x1="5" y1="75" x2="25" y2="60" />
                  <line x1="95" y1="75" x2="75" y2="60" />
                  <line x1="25" y1="40" x2="75" y2="60" />
                </svg>
                <span class="roll-number">{{ displayNumber }}</span>
              </div>
            </div>

            <div class="vs-badge">VS</div>

            <div class="arena-side">
              <div class="arena-side-label">DC</div>
              <div class="dc-container">
                <span class="dc-number">{{ dcTarget }}</span>
              </div>
            </div>
          </div>

          <div class="result-wrapper">
            <div class="check-result" :class="{ 'is-visible': showResult }">
              {{ resultText }}
            </div>
            <div class="roll-details" :class="{ 'is-visible': showResult }">
              <div class="roll-breakdown">{{ breakdownText }}</div>
              <div class="roll-formula">掷骰基础: 1d20 + 属性修正 + 环境修正</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

type Modifier = { v: number; n: string };

type DiceParams = {
  checkName: string;
  baseRoll?: number | null;
  modifiers: Modifier[];
  dcTarget: number;
};

type DiceParamsInput = Omit<DiceParams, 'baseRoll' | 'dcTarget' | 'checkName' | 'modifiers'> & {
  checkName?: string;
  baseRoll?: number | null | 'auto' | string;
  dcTarget?: number | string;
  modifiers?: Modifier[];
  totalResult?: number | string;
  formulaText?: string;
  text?: string;
};

const checkName = ref('检定');
const baseRoll = ref<number | null>(null);
const modifiers = ref<Modifier[]>([]);
const dcTarget = ref(10);

const displayNumber = ref<string | number>('?');
const resultText = ref('...');
const breakdownText = ref('');
const stateClass = ref('');
const isRolling = ref(false);
const showResult = ref(false);

const DEFAULT_PARAMS: DiceParams = {
  checkName: '灵巧检定',
  baseRoll: 18,
  modifiers: [
    { v: 3, n: '敏捷' },
    { v: 2, n: '夜晚' },
  ],
  dcTarget: 15,
};

const clampBase = (value: number) => Math.min(20, Math.max(1, Math.floor(value)));

const stripQuotes = (value: string) => value.replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim();

const extractQuoted = (value: string): string => {
  const match = value.match(/["“”‘’](.+?)["“”‘’]/);
  return match ? match[1].trim() : '';
};

const parseTextToParams = (text: string): DiceParamsInput => {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  let actionRaw = '';
  let kindRaw = '';
  let baseRaw = '';
  let formulaRaw = '';
  let dcRaw = '';
  let outcomeRaw = '';
  let totalRaw = '';

  lines.forEach(line => {
    const match = line.match(/^([^:：]+)[:：]\s*(.+)$/);
    if (!match) return;
    const key = match[1].trim();
    const value = match[2].trim();

    if (key === '行为') actionRaw = value;
    if (key === '类型') kindRaw = value;
    if (key === '基础骰') baseRaw = value;
    if (key === '掷骰公式') formulaRaw = value;
    if (key === 'DC' || key === 'dc') dcRaw = value;
    if (key === '结果') {
      const quoted = extractQuoted(value);
      if (quoted) {
        outcomeRaw = quoted;
      } else {
        totalRaw = stripQuotes(value);
      }
    }
  });

  const result: DiceParamsInput = {};

  const action = extractQuoted(actionRaw);
  const kind = extractQuoted(kindRaw);
  if (action && kind) {
    result.checkName = `${action}（${kind}）`;
  } else if (action) {
    result.checkName = action;
  } else if (kind) {
    result.checkName = kind;
  }

  if (baseRaw) {
    result.baseRoll = stripQuotes(baseRaw);
  }

  if (dcRaw) {
    result.dcTarget = stripQuotes(dcRaw);
  }

  if (totalRaw) {
    result.totalResult = stripQuotes(totalRaw);
  }

  const formula = formulaRaw ? stripQuotes(formulaRaw) : '';
  if (formula) {
    const cleaned = formula.replace(/\s+/g, '');
    result.formulaText = cleaned;
    const leadingNumber = cleaned.match(/^(\d+)/);
    if (!baseRaw && leadingNumber) {
      result.baseRoll = leadingNumber[1];
    }
    const mods: Modifier[] = [];
    const regex = /([+-]\d+)(?:\(([^)]+)\))?/g;
    let match: RegExpExecArray | null = null;
    while ((match = regex.exec(cleaned))) {
      const value = Number(match[1]);
      const name = match[2] ? match[2].trim() : '';
      if (Number.isFinite(value)) {
        mods.push({ v: value, n: name });
      }
    }
    if (mods.length) {
      result.modifiers = mods;
    }
  }

  if (outcomeRaw) {
    if (outcomeRaw.includes('大成功')) result.baseRoll = 20;
    if (outcomeRaw.includes('大失败') || outcomeRaw.includes('大 失 败')) result.baseRoll = 1;
  }

  return result;
};

const normalizeInput = (input: DiceParamsInput): DiceParams => {
  const parsedModifiers = Array.isArray(input.modifiers)
    ? input.modifiers
        .map(item => ({
          v: Number(item.v ?? 0),
          n: String(item.n ?? ''),
        }))
        .filter(item => item.n || item.v)
    : [];

  const rawBase = input.baseRoll;
  const normalizedBase =
    typeof rawBase === 'string' ? (rawBase === 'auto' ? null : Number(rawBase)) : (rawBase ?? null);

  const dcValue = typeof input.dcTarget === 'string' ? Number(input.dcTarget) : input.dcTarget;

  return {
    checkName: String(input.checkName ?? DEFAULT_PARAMS.checkName),
    baseRoll: Number.isFinite(normalizedBase) ? clampBase(normalizedBase as number) : null,
    modifiers: parsedModifiers.length ? parsedModifiers : DEFAULT_PARAMS.modifiers,
    dcTarget: Number.isFinite(Number(dcValue)) ? Math.max(0, Math.floor(Number(dcValue))) : DEFAULT_PARAMS.dcTarget,
  };
};

const parseFromSearch = (): DiceParamsInput | null => {
  const search = new URLSearchParams(window.location.search);
  const data = search.get('data');
  if (data) {
    try {
      return JSON.parse(decodeURIComponent(data)) as DiceParamsInput;
    } catch {
      return null;
    }
  }

  const text = search.get('text');
  if (text) {
    return { text: decodeURIComponent(text) };
  }

  if (search.has('check') || search.has('base') || search.has('dc') || search.has('mods')) {
    let mods: Modifier[] = [];
    const modsRaw = search.get('mods');
    if (modsRaw) {
      try {
        mods = JSON.parse(decodeURIComponent(modsRaw)) as Modifier[];
      } catch {
        mods = modsRaw.split(',').map(item => {
          const [name, value] = item.split(':');
          return { n: name?.trim() ?? '', v: Number(value ?? 0) };
        });
      }
    }

    return {
      checkName: search.get('check') ?? undefined,
      baseRoll: search.get('base') ?? undefined,
      dcTarget: search.get('dc') ?? undefined,
      modifiers: mods,
    } as DiceParamsInput;
  }

  return null;
};

const getCurrentMessageText = (): string => {
  const messageId = getCurrentMessageId();
  const messages = getChatMessages(messageId);
  if (!messages.length) return '';
  const message = messages[0];
  if (message.role !== 'assistant') return '';
  return message.message ?? '';
};

const applyParams = (params: DiceParams) => {
  checkName.value = params.checkName;
  baseRoll.value = params.baseRoll ?? null;
  modifiers.value = params.modifiers;
  dcTarget.value = params.dcTarget;
};

const roll = (input?: DiceParamsInput) => {
  let mergedInput = input;
  if (input?.text) {
    const parsed = parseTextToParams(input.text);
    mergedInput = { ...parsed, ...input };
    delete (mergedInput as DiceParamsInput).text;
  }

  const params = normalizeInput(mergedInput ?? DEFAULT_PARAMS);
  applyParams(params);

  const actualBase = params.baseRoll ?? clampBase(Math.floor(Math.random() * 20) + 1);
  const mods = params.modifiers ?? [];

  stateClass.value = '';
  resultText.value = '...';
  breakdownText.value = '';
  displayNumber.value = '?';
  showResult.value = false;
  isRolling.value = true;

  let totalRoll = actualBase;
  let breakdownStr = `${actualBase}`;
  if (mergedInput?.formulaText) {
    breakdownStr = mergedInput.formulaText;
  }
  mods.forEach(mod => {
    totalRoll += mod.v;
    if (!mergedInput?.formulaText) {
      const sign = mod.v >= 0 ? '+' : '-';
      const label = mod.n ? `(${mod.n})` : '';
      breakdownStr += ` ${sign} ${Math.abs(mod.v)}${label}`;
    }
  });

  const totalOverrideRaw = mergedInput?.totalResult;
  if (typeof totalOverrideRaw === 'string' || typeof totalOverrideRaw === 'number') {
    const totalOverride = Number(totalOverrideRaw);
    if (Number.isFinite(totalOverride)) {
      totalRoll = totalOverride;
    }
  }

  const isCritSuccess = actualBase === 20;
  const isCritFail = actualBase === 1;

  let rollCount = 0;
  const rolling = window.setInterval(() => {
    displayNumber.value = Math.floor(Math.random() * 20) + 5;
    rollCount += 1;

    if (rollCount >= 20) {
      window.clearInterval(rolling);
      isRolling.value = false;

      if (isCritSuccess) {
        displayNumber.value = 20;
        stateClass.value = 'state-crit-success';
        resultText.value = '大 成 功 (CRITICAL)';
        breakdownText.value = '自然掷骰: 20 (无需修正，直接成功)';
      } else if (isCritFail) {
        displayNumber.value = 1;
        stateClass.value = 'state-crit-fail';
        resultText.value = '大 失 败 (FUMBLE)';
        breakdownText.value = '自然掷骰: 1 (无需修正，直接失败)';
      } else {
        displayNumber.value = totalRoll;
        breakdownText.value = `如 ${breakdownStr}`;

        if (totalRoll >= params.dcTarget) {
          stateClass.value = 'state-success';
          resultText.value = '成 功 (SUCCESS)';
        } else {
          stateClass.value = 'state-fail';
          resultText.value = '失 败 (FAILURE)';
        }
      }

      showResult.value = true;
    }
  }, 40);
};

let eventListenerStop: { stop: () => void } | null = null;

onMounted(() => {
  const messageText = getCurrentMessageText();
  if (messageText) {
    roll({ text: messageText });
  } else {
    const fromSearch = parseFromSearch();
    if (fromSearch) {
      roll(fromSearch);
    } else {
      roll(DEFAULT_PARAMS);
    }
  }

  eventListenerStop = eventOn(tavern_events.MESSAGE_UPDATED, messageId => {
    if (messageId === getCurrentMessageId()) {
      roll({ text: getCurrentMessageText() });
    }
  });

  (window as unknown as { setKenshiDiceParams?: (params: DiceParamsInput) => void }).setKenshiDiceParams = params =>
    roll(params);
});

onBeforeUnmount(() => {
  if (eventListenerStop) {
    eventListenerStop.stop();
  }
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&family=Noto+Serif+SC:wght@400;600;700;900&display=swap');

:global(:root) {
  --kenshi-sand: #d5c7b2;
  --kenshi-rust: #b85331;
  --bg3-gold: #c6a664;
  --bg3-dark: #0f0e11;
  --panel-bg: rgba(20, 18, 22, 0.85);
  --success-glow: rgba(198, 166, 100, 0.6);
  --fail-glow: rgba(184, 83, 49, 0.6);
  --crit-success-glow: rgba(0, 255, 200, 0.6);
  --crit-fail-glow: rgba(255, 0, 50, 0.6);
}

:global(body) {
  background-color: #1a181c;
  background-image: radial-gradient(circle at 50% 30%, #2a2522 0%, var(--bg3-dark) 100%);
  margin: 0;
  padding: 0;
  font-family: 'Noto Serif SC', 'Outfit', serif;
}

.page {
  width: 100%;
}

.dice-mount-point {
  width: 100%;
  max-width: 100%;
}

.dice-check-container {
  width: 100%;
  background: var(--panel-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 0;
  padding: 0;
  position: relative;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  transition: all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.dice-check-inner {
  background: linear-gradient(180deg, rgba(30, 28, 33, 0.9) 0%, rgba(15, 14, 17, 0.95) 100%);
  border-radius: 0;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
}

.dice-check-inner::before {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 0;
  width: 70%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--bg3-gold), transparent);
  opacity: 0.6;
}

.check-header {
  font-size: 1.1rem;
  color: var(--kenshi-sand);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}

.check-header::before,
.check-header::after {
  content: '';
  display: block;
  width: 40px;
  height: 2px;
  background: rgba(198, 166, 100, 0.3);
}

.check-arena {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 24px;
}

.arena-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 40%;
}

.arena-side-label {
  font-size: 0.85rem;
  color: rgba(213, 199, 178, 0.5);
  letter-spacing: 3px;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.d20-container {
  position: relative;
  width: 90px;
  height: 90px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.d20-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  stroke: var(--bg3-gold);
  stroke-width: 1.5;
  fill: rgba(0, 0, 0, 0.4);
  filter: drop-shadow(0 0 8px rgba(198, 166, 100, 0.2));
  transition: all 0.4s ease;
}

.roll-number {
  font-family: 'Outfit', sans-serif;
  font-weight: 900;
  font-size: 2.4rem;
  color: var(--bg3-gold);
  z-index: 2;
  text-shadow: 0 0 15px rgba(198, 166, 100, 0.4);
  font-variant-numeric: tabular-nums;
}

.dc-container {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(213, 199, 178, 0.2);
  transform: rotate(45deg);
  border-radius: 8px;
}

.dc-number {
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-size: 1.8rem;
  color: var(--kenshi-sand);
  transform: rotate(-45deg);
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.8);
}

.vs-badge {
  font-family: 'Outfit', sans-serif;
  font-weight: 900;
  font-style: italic;
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.15);
  letter-spacing: 2px;
}

.result-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.check-result {
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: 8px;
  color: transparent;
  opacity: 0;
  transform: scale(0.9);
  transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  background-clip: text;
  -webkit-background-clip: text;
}

.roll-details {
  margin-top: 12px;
  padding-top: 14px;
  border-top: 1px solid rgba(198, 166, 100, 0.15);
  width: 80%;
  text-align: center;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.6s ease 0.4s;
}

.roll-breakdown {
  font-family: 'Outfit', 'Noto Serif SC', sans-serif;
  color: var(--bg3-gold);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  margin-bottom: 6px;
  text-shadow: 0 0 8px rgba(198, 166, 100, 0.3);
}

.roll-formula {
  font-size: 0.8rem;
  color: rgba(213, 199, 178, 0.4);
  letter-spacing: 2px;
  font-weight: 400;
}

.check-result.is-visible {
  opacity: 1;
  transform: scale(1);
}

.roll-details.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.d20-container.is-rolling .d20-svg {
  animation: spinD20 0.8s linear infinite;
  stroke: rgba(255, 255, 255, 0.6);
  filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.5));
}

.d20-container.is-rolling .roll-number {
  color: #fff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
  filter: blur(0.5px);
}

@keyframes spinD20 {
  0% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(180deg) scale(1.1);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}

.dice-check-container.state-success {
  background: linear-gradient(135deg, rgba(198, 166, 100, 0.8), rgba(15, 14, 17, 0));
}

.state-success .d20-svg {
  stroke: var(--bg3-gold);
  fill: rgba(198, 166, 100, 0.1);
}

.state-success .roll-number {
  color: var(--bg3-gold);
  text-shadow: 0 0 20px var(--bg3-gold);
  transform: scale(1.1);
}

.state-success .check-result {
  background-image: linear-gradient(90deg, #fff, var(--bg3-gold), #fff);
  text-shadow: 0 0 20px var(--success-glow);
}

.dice-check-container.state-fail {
  background: linear-gradient(135deg, rgba(184, 83, 49, 0.8), rgba(15, 14, 17, 0));
}

.state-fail .d20-svg {
  stroke: var(--kenshi-rust);
  fill: rgba(184, 83, 49, 0.1);
}

.state-fail .roll-number {
  color: var(--kenshi-rust);
  text-shadow: 0 0 20px var(--kenshi-rust);
  transform: scale(0.95);
}

.state-fail .check-result {
  background-image: linear-gradient(90deg, #fff, var(--kenshi-rust), #fff);
  text-shadow: 0 0 20px var(--fail-glow);
}

.state-fail .roll-breakdown {
  color: var(--kenshi-rust);
  text-shadow: 0 0 8px rgba(184, 83, 49, 0.3);
}

.dice-check-container.state-crit-success {
  background: linear-gradient(135deg, rgba(0, 255, 200, 0.6), rgba(15, 14, 17, 0));
  box-shadow: 0 0 50px rgba(0, 255, 200, 0.15);
}

.state-crit-success .d20-svg {
  stroke: #00ffc8;
  fill: rgba(0, 255, 200, 0.15);
  filter: drop-shadow(0 0 10px rgba(0, 255, 200, 0.5));
}

.state-crit-success .roll-number {
  color: #00ffc8;
  text-shadow: 0 0 30px #00ffc8;
  transform: scale(1.2);
}

.state-crit-success .check-result {
  background-image: linear-gradient(90deg, #fff, #00ffc8, #fff);
  text-shadow: 0 0 20px var(--crit-success-glow);
}

.state-crit-success .roll-breakdown {
  color: #00ffc8;
  text-shadow: 0 0 10px rgba(0, 255, 200, 0.5);
}

.dice-check-container.state-crit-fail {
  background: linear-gradient(135deg, rgba(255, 0, 50, 0.8), rgba(15, 14, 17, 0));
}

.state-crit-fail .d20-svg {
  stroke: #ff0032;
  fill: rgba(255, 0, 50, 0.1);
}

.state-crit-fail .roll-number {
  color: #ff0032;
  text-shadow: 0 0 30px #ff0032;
}

.state-crit-fail .check-result {
  background-image: linear-gradient(90deg, #fff, #ff0032, #fff);
  text-shadow: 0 0 20px var(--crit-fail-glow);
}

.state-crit-fail .roll-breakdown {
  color: #ff0032;
}

@media (max-width: 540px) {
  .dice-check-inner {
    padding: 18px 18px;
  }

  .check-header {
    font-size: 1rem;
    letter-spacing: 1px;
  }

  .roll-number {
    font-size: 2rem;
  }

  .dc-number {
    font-size: 1.6rem;
  }
}
</style>
