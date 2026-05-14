<template>
  <div class="options-root">
    <div v-if="options.length" class="interactive-options-container" :class="`option-count-${options.length}`">
      <div class="actor-selector" :class="{ active: isActorMenuOpen }">
        <button class="actor-selector-toggle" type="button" @click.stop="toggleActorMenu">
          <span class="actor-arrow">》</span>
          <span class="actor-name">{{ selectedActorName }}</span>
        </button>
        <div class="actor-selector-menu">
          <button
            v-for="actor in actorOptions"
            :key="actor.name"
            class="actor-selector-item"
            :class="{ selected: actor.name === selectedActorName }"
            type="button"
            @click.stop="selectActor(actor.name)"
          >
            {{ actor.name }}
          </button>
        </div>
      </div>

      <button class="legacy-toggle-btn" type="button" :class="{ active: isLegacyMode }" @click.stop="toggleLegacyMode">
        {{ isLegacyMode ? '新版' : '旧版' }}
      </button>

      <button class="action-gear-btn" type="button" @click.stop="toggleSpecialMenu">
        <i class="ri-settings-4-fill"></i>
      </button>
      <div class="special-actions-menu" :class="{ active: isSpecialMenuOpen }">
        <button
          v-for="action in specialActions"
          :key="action"
          class="special-action-item"
          type="button"
          @click.stop="handleSpecialAction(action)"
        >
          {{ action }}
        </button>
      </div>

      <button
        v-for="(opt, index) in options"
        :key="`${opt.number}-${opt.text}`"
        :class="[
          'trpg-option fade-in-up',
          { 'fight-option': isFightOption(opt), 'dc-option': !isLegacyMode && !!parseDcCheckMeta(opt.text) },
        ]"
        :style="{ animationDelay: `${index * 0.1}s` }"
        type="button"
        @click="handleOptionClick(opt, $event)"
      >
        <div class="option-badge">
          <span>{{ opt.number }}</span>
        </div>
        <div class="option-text">
          <span v-if="isFightOption(opt)" class="fight-tag">战斗</span>
          <span v-else-if="!isLegacyMode && parseDcCheckMeta(opt.text)" class="dc-tag">判定</span>
          {{ opt.text }}
        </div>
      </button>
    </div>

    <div v-else class="empty-state">未检测到选项文本</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

type OptionItem = {
  number: string;
  prefix: string;
  text: string;
};

type ActorOption = {
  name: string;
  data: Record<string, any> | null;
};

const options = ref<OptionItem[]>([]);
const isSpecialMenuOpen = ref(false);
const isActorMenuOpen = ref(false);
const selectedActorName = ref('');
const actorOptions = ref<ActorOption[]>([]);
const isLegacyMode = ref(false);
const specialActions = ['战斗', '营地系统'];

const optionLineRegex = /^[^\S\n]*(?:[（(【]?\s*([A-Za-z])\s*[.、:：]\s*(.*?))\s*$/;
const optionFallbackLineRegex = /^[^\S\n]*([A-Za-z])\s+[、.．]\s*(.*?)\s*$/;

function parseOptionsFromText(text: string): OptionItem[] {
  if (!text) return [];
  const lines = text.split(/\r?\n/);
  const blocks: OptionItem[][] = [];
  let currentBlock: OptionItem[] = [];

  for (const line of lines) {
    const match = line.match(optionLineRegex) || line.match(optionFallbackLineRegex);
    if (match) {
      const prefix = match[1]?.trim();
      const optionText = match[2]?.trim();
      if (prefix && optionText) {
        currentBlock.push({ number: prefix, prefix, text: optionText });
        continue;
      }
    }
    if (currentBlock.length) {
      blocks.push(currentBlock);
      currentBlock = [];
    }
  }

  if (currentBlock.length) {
    blocks.push(currentBlock);
  }

  const lastBlock = blocks.length ? blocks[blocks.length - 1] : [];
  return lastBlock.map((item, index) => ({
    number: String(index + 1),
    prefix: item.number,
    text: item.text,
  }));
}

function getCurrentMessageText(): string {
  const messageId = getCurrentMessageId();
  const messages = getChatMessages(messageId);
  if (!messages.length) return '';
  const message = messages[0];
  if (message.role !== 'assistant') return '';
  return message.message ?? '';
}

function renderOptions() {
  const rawText = getCurrentMessageText();
  options.value = parseOptionsFromText(rawText);
}

function toggleActorMenu() {
  isActorMenuOpen.value = !isActorMenuOpen.value;
  if (isActorMenuOpen.value) {
    closeSpecialMenu();
  }
}

function closeActorMenu() {
  isActorMenuOpen.value = false;
}

function selectActor(name: string) {
  selectedActorName.value = name;
  closeActorMenu();
}

function toggleLegacyMode() {
  isLegacyMode.value = !isLegacyMode.value;
}

function toggleSpecialMenu() {
  isSpecialMenuOpen.value = !isSpecialMenuOpen.value;
  if (isSpecialMenuOpen.value) {
    closeActorMenu();
  }
}

function closeSpecialMenu() {
  isSpecialMenuOpen.value = false;
}

function createRipple(event: MouseEvent, element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const keyframes = [
    { backgroundPosition: `${x}px ${y}px`, boxShadow: '0 0 0 0 rgba(198, 166, 100, 0.25)' },
    { backgroundPosition: `${x}px ${y}px`, boxShadow: '0 0 0 20px rgba(198, 166, 100, 0)' },
  ];
  element.animate(keyframes, { duration: 320, easing: 'ease-out' });
}

function getParentJquery(): JQueryStatic | null {
  const parent$ = (window.parent as { $?: JQueryStatic } | undefined)?.$;
  if (parent$ && typeof parent$ === 'function') return parent$;
  if (typeof $ === 'function') return $;
  return null;
}

function findInputElement(): HTMLTextAreaElement | null {
  const parentDoc = window.parent?.document;
  if (parentDoc) {
    const el = parentDoc.querySelector<HTMLTextAreaElement>('#send_textarea, textarea#send_textarea');
    if (el) return el;
  }
  return document.querySelector<HTMLTextAreaElement>('#send_textarea, textarea#send_textarea');
}

function fillInput(text: string) {
  const textareaEl = findInputElement();
  if (!textareaEl) return;

  textareaEl.value = text;
  textareaEl.dispatchEvent(new Event('input', { bubbles: true }));
  textareaEl.focus();
  textareaEl.setSelectionRange(text.length, text.length);

  const jq = getParentJquery();
  if (jq) {
    const $textarea = jq(textareaEl);
    $textarea.trigger('input');
    $textarea.trigger('focus');
  }
}

async function sendUserMessage(text: string) {
  if (typeof createChatMessages !== 'function') {
    fillInput(text);
    return;
  }

  try {
    await createChatMessages([{ role: 'user', message: text }]);
    if (typeof triggerSlash === 'function') {
      await triggerSlash('/trigger');
    }
  } catch (error) {
    console.error('[kenshi选项栏] 发送用户消息失败:', error);
    fillInput(text);
  }
}

type DcCheckMeta = {
  attribute: string;
  purpose: string;
  behavior: string;
  dc: number;
};

const ATTRIBUTE_KEY_MAP: Record<string, string> = {
  力量: 'STR',
  敏捷: 'DEX',
  感知: 'PER',
  体质: 'TGH',
  意志: 'WIL',
  智力: 'INT',
  魅力: 'CHA',
};

function getOptionDisplayText(opt: OptionItem): string {
  return `${opt.prefix}. ${opt.text}`;
}

function normalizeOptionText(text: string): string {
  return text.replace(/["“”'’]+$/g, '').trim();
}

function parseDcCheckMeta(text: string): DcCheckMeta | null {
  if (isLegacyMode.value) return null;
  const normalizedText = normalizeOptionText(text);
  const attributeMatch = normalizedText.match(/(?:\[|【)\s*([^\]】]+?)\s*(?:\]|】)/);
  const purposeMatch = normalizedText.match(/[（(]\s*([^()（）]*?)(?:判定)?\s*DC\s*(\d+)\s*(?:[）)])?\s*$/i);
  const attribute = attributeMatch?.[1]?.trim();
  const purpose = purposeMatch?.[1]?.trim();
  const dc = Number(purposeMatch?.[2] ?? NaN);
  if (!attribute || !purpose || !Number.isFinite(dc)) return null;
  const behavior = normalizedText
    .replace(/^[^[【]*[[【]\s*[^\]】]+\s*[\]】]\s*/, '')
    .replace(/[（(]\s*[^()（）]*?(?:判定)?\s*DC\s*\d+\s*(?:[）)])?\s*$/i, '')
    .trim();
  if (!behavior) return null;
  return { attribute, purpose, behavior, dc };
}

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

function getVariableData(): Record<string, any> | null {
  const messageId = typeof getCurrentMessageId === 'function' ? getCurrentMessageId() : 'latest';
  const currentData =
    typeof getVariables === 'function' ? getVariables({ type: 'message', message_id: messageId }) : null;
  const latestData =
    typeof getVariables === 'function' ? getVariables({ type: 'message', message_id: 'latest' }) : null;
  return currentData?.stat_data ?? latestData?.stat_data ?? null;
}

function getActorName(actor: Record<string, any> | null, fallback: string): string {
  const name = actor?.名字 ?? actor?.name ?? fallback;
  return String(name || fallback);
}

function refreshActorOptions() {
  const statData = getVariableData();
  const nextActors: ActorOption[] = [];
  const currentCharacter = statData?.当前角色;
  if (currentCharacter && currentCharacter !== '待初始化') {
    nextActors.push({ name: getActorName(currentCharacter, '当前角色'), data: currentCharacter });
  }

  const teammates = statData?.小队成员;
  if (teammates && typeof teammates === 'object') {
    for (const [fallbackName, teammate] of Object.entries(teammates)) {
      if (!teammate || teammate === '待初始化') continue;
      const actorData = teammate as Record<string, any>;
      const name = getActorName(actorData, fallbackName);
      if (!nextActors.some(actor => actor.name === name)) {
        nextActors.push({ name, data: actorData });
      }
    }
  }

  actorOptions.value = nextActors;
  if (!selectedActorName.value || !nextActors.some(actor => actor.name === selectedActorName.value)) {
    selectedActorName.value = nextActors[0]?.name ?? '当前角色';
  }
}

const selectedActor = computed(() => {
  return actorOptions.value.find(actor => actor.name === selectedActorName.value) ?? actorOptions.value[0] ?? null;
});

function getCurrentCharacterData(): Record<string, any> | null {
  return selectedActor.value?.data ?? getVariableData()?.当前角色 ?? null;
}

function getAttributeModifier(attributeName: string, characterData: Record<string, any> | null): number {
  const attrKey = ATTRIBUTE_KEY_MAP[attributeName];
  const rawAttr = attrKey
    ? (characterData?.属性?.[attrKey] ?? characterData?.属性?.[attributeName])
    : characterData?.属性?.[attributeName];

  if (typeof rawAttr === 'number') {
    return Math.floor((rawAttr - 20) / 10);
  }

  const baseValue = Number(rawAttr?.基础 ?? 30);
  const bonusValue = Number(rawAttr?.加成 ?? 0);
  return Math.floor((baseValue + bonusValue - 20) / 10);
}

function getCleanOptionText(text: string): string {
  return text.replace(/^[^[【]*([[【].*)$/, '$1').trim();
}

function buildJudgementMessage(
  opt: OptionItem,
  meta: DcCheckMeta,
  actorName: string,
  baseRoll: number,
  modifier: number,
  total: number,
  outcome: string,
): string {
  const formula = `${baseRoll}${modifier >= 0 ? '+' : ''}${modifier}(${meta.attribute})`;
  return `${actorName}. 选择了：${getCleanOptionText(opt.text)}\n\n<Destiny>\n行为: ${meta.behavior}\n目的:"${meta.purpose}"\n类型:"${meta.attribute}"\n基础骰:${baseRoll}\n掷骰公式: ${formula}\n结果：${total}\nDC: ${meta.dc}\n结果: "${outcome}"\n</Destiny>`;
}

async function handleDcOption(opt: OptionItem, meta: DcCheckMeta) {
  try {
    if (typeof waitGlobalInitialized === 'function') {
      await waitGlobalInitialized('Mvu');
    }
  } catch (error) {
    console.warn('[kenshi选项栏] 等待 Mvu 初始化失败，改为使用兜底属性:', error);
  }

  const characterData = getCurrentCharacterData();
  const baseRoll = rollD20();
  const modifier = getAttributeModifier(meta.attribute, characterData);
  const total = baseRoll + modifier;
  const outcome = baseRoll === 1 ? '大失败' : baseRoll === 20 ? '大成功' : total >= meta.dc ? '成功' : '失败';
  const actorName = selectedActor.value?.name ?? selectedActorName.value ?? '当前角色';
  const finalText = buildJudgementMessage(opt, meta, actorName, baseRoll, modifier, total, outcome);
  await sendUserMessage(finalText);
}

function isFightOption(opt: OptionItem): boolean {
  return /战斗判定/.test(opt.text);
}

function getCharacterMeta(): { name: string; avatar?: string } {
  const parent = window.parent as any;
  if (parent?.chat) {
    const chat = parent.chat;
    if (Array.isArray(chat.characters) && chat.characters.length > 0) {
      const character = chat.characters[0];
      return { name: character.name || character.title || 'Assistant', avatar: character.avatar };
    }
    if (chat.character) {
      const character = chat.character;
      return { name: character.name || character.title || 'Assistant', avatar: character.avatar };
    }
    if (Array.isArray(chat.messages) && chat.messages.length > 0) {
      const last = chat.messages[chat.messages.length - 1];
      if (last && last.name && !last.is_user) {
        return { name: last.name, avatar: last.avatar };
      }
    }
  }
  if (parent?.character) {
    const character = parent.character;
    return { name: character.name || character.title || 'Assistant', avatar: character.avatar };
  }
  return { name: 'Assistant' };
}

async function triggerFightBattle() {
  if (typeof triggerSlash !== 'function') {
    console.warn('[kenshi选项栏] triggerSlash 不可用，无法触发战斗栏');
    return;
  }
  const { name, avatar } = getCharacterMeta();
  const command = `/sendas name="${name}"${avatar ? ` avatar="${avatar}"` : ''} <FIGHT>`;
  try {
    await triggerSlash(command);
  } catch (error) {
    console.error('[kenshi选项栏] 触发战斗栏失败:', error);
  }
}

async function triggerCampSystem() {
  if (typeof triggerSlash !== 'function') {
    console.warn('[kenshi选项栏] triggerSlash 不可用，无法触发营地系统');
    return;
  }
  const { name, avatar } = getCharacterMeta();
  const command = `/sendas name="${name}"${avatar ? ` avatar="${avatar}"` : ''} <营地系统>`;
  try {
    await triggerSlash(command);
  } catch (error) {
    console.error('[kenshi选项栏] 触发营地系统失败:', error);
  }
}

async function handleOptionClick(opt: OptionItem, event: MouseEvent) {
  const target = event.currentTarget as HTMLElement;
  createRipple(event, target);
  if (isFightOption(opt)) {
    await triggerFightBattle();
    return;
  }
  if (!isLegacyMode.value) {
    const dcMeta = parseDcCheckMeta(opt.text);
    if (dcMeta) {
      await handleDcOption(opt, dcMeta);
      return;
    }
  }
  const text = opt.text;
  setTimeout(() => {
    fillInput(text);
  }, 200);
}

function handleSpecialAction(action: string) {
  if (action === '战斗') {
    triggerFightBattle();
    closeSpecialMenu();
    return;
  }
  if (action === '营地系统') {
    triggerCampSystem();
    closeSpecialMenu();
    return;
  }
  fillInput(action);
  closeSpecialMenu();
}

function handleDocumentClick() {
  if (isSpecialMenuOpen.value) {
    closeSpecialMenu();
  }
  if (isActorMenuOpen.value) {
    closeActorMenu();
  }
}

let eventListenerStop: { stop: () => void } | null = null;

onMounted(() => {
  renderOptions();
  refreshActorOptions();
  document.addEventListener('click', handleDocumentClick);
  eventListenerStop = eventOn(tavern_events.MESSAGE_UPDATED, messageId => {
    if (messageId === getCurrentMessageId()) {
      renderOptions();
      refreshActorOptions();
    }
  });
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
  if (eventListenerStop) {
    eventListenerStop.stop();
  }
});
</script>

<style lang="scss" scoped>
:global(:root) {
  --kenshi-sand: #d5c7b2;
  --kenshi-rust: #b85331;
  --bg3-gold: #c6a664;
  --bg3-dark: #0f0e11;
  --panel-bg: rgba(20, 18, 22, 0.75);
  --border-glow: rgba(198, 166, 100, 0.3);
  --rust-glow: rgba(184, 83, 49, 0.5);
}

@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=Noto+Serif+SC:wght@400;700&display=swap');
@import url('https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css');

.options-root {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 0;
}

.interactive-options-container {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--panel-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 8px;
  padding: 58px 24px 24px 24px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  font-family: 'Noto Serif SC', 'Outfit', serif;
}

.interactive-options-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--bg3-gold), transparent);
  opacity: 0.6;
}

.actor-selector {
  position: absolute;
  top: 10px;
  left: 14px;
  z-index: 10;
}

.actor-selector-toggle {
  min-width: 118px;
  height: 34px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(15, 14, 17, 0.9);
  border: 1px solid rgba(147, 197, 253, 0.45);
  border-radius: 999px;
  color: #d9efff;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.45);
  font-family: 'Noto Serif SC', 'Outfit', serif;
}

.actor-arrow {
  color: #93c5fd;
  transition: transform 0.2s ease;
}

.actor-selector.active .actor-arrow {
  transform: rotate(90deg);
}

.actor-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.9rem;
  letter-spacing: 1px;
}

.actor-selector-menu {
  position: absolute;
  top: 42px;
  left: 0;
  min-width: 150px;
  max-height: min(50vh, 280px);
  overflow-y: auto;
  padding: 8px 0;
  background: rgba(15, 14, 17, 0.95);
  border: 1px solid rgba(147, 197, 253, 0.35);
  border-radius: 8px;
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.65);
  opacity: 0;
  pointer-events: none;
  transform: translateY(-10px) scale(0.96);
  transform-origin: top left;
  transition: all 0.22s ease;
}

.actor-selector.active .actor-selector-menu {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0) scale(1);
}

.actor-selector-item {
  width: 100%;
  padding: 9px 14px;
  background: transparent;
  border: none;
  color: var(--kenshi-sand);
  text-align: left;
  cursor: pointer;
  letter-spacing: 1px;
}

.actor-selector-item:hover,
.actor-selector-item.selected {
  background: rgba(96, 165, 250, 0.16);
  color: #e0f2fe;
}

.legacy-toggle-btn {
  position: absolute;
  top: 10px;
  right: 58px;
  height: 34px;
  min-width: 58px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid rgba(198, 166, 100, 0.45);
  background: linear-gradient(180deg, rgba(44, 37, 31, 0.95), rgba(24, 20, 18, 0.95));
  color: #e5d1a4;
  font-size: 0.84rem;
  letter-spacing: 1px;
  cursor: pointer;
  box-shadow:
    0 6px 14px rgba(0, 0, 0, 0.45),
    inset 0 1px 1px rgba(255, 255, 255, 0.08);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
  z-index: 10;
}

.legacy-toggle-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(198, 166, 100, 0.72);
  color: #fff4d6;
  box-shadow:
    0 8px 18px rgba(0, 0, 0, 0.55),
    0 0 10px rgba(198, 166, 100, 0.15);
}

.legacy-toggle-btn.active {
  border-color: rgba(184, 83, 49, 0.72);
  color: #ffd7c9;
  background: linear-gradient(180deg, rgba(90, 47, 36, 0.95), rgba(43, 23, 20, 0.95));
  box-shadow:
    0 8px 18px rgba(0, 0, 0, 0.55),
    0 0 12px rgba(184, 83, 49, 0.2);
}

.action-gear-btn {
  position: absolute;
  top: 10px;
  right: 14px;
  width: 36px;
  height: 36px;
  background: radial-gradient(circle at 30% 30%, #3a332e, #1a1514 70%);
  border: 1px solid rgba(198, 166, 100, 0.65);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #e5d1a4;
  cursor: pointer;
  box-shadow:
    0 6px 14px rgba(0, 0, 0, 0.55),
    inset 0 1px 2px rgba(255, 255, 255, 0.15),
    inset 0 -1px 2px rgba(0, 0, 0, 0.5);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    background 0.25s ease;
  z-index: 10;
}

.action-gear-btn::before {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 1px solid rgba(198, 166, 100, 0.25);
  box-shadow: 0 0 10px rgba(198, 166, 100, 0.2);
}

.action-gear-btn:hover {
  transform: rotate(25deg) scale(1.05);
  background: radial-gradient(circle at 30% 30%, #5a2f24, #2b1714 70%);
  color: #fff4d6;
  border-color: rgba(184, 83, 49, 0.8);
  box-shadow:
    0 8px 18px rgba(0, 0, 0, 0.6),
    0 0 10px rgba(184, 83, 49, 0.35);
}

.special-actions-menu {
  position: absolute;
  top: 52px;
  right: 14px;
  background: rgba(15, 14, 17, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(198, 166, 100, 0.3);
  border-radius: 6px;
  padding: 8px 0;
  min-width: 120px;
  max-height: min(60vh, 360px);
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.8);
  z-index: 9;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-15px) scale(0.95);
  transform-origin: top right;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.special-actions-menu.active {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0) scale(1);
}

.special-action-item {
  width: 100%;
  padding: 10px 20px;
  color: var(--kenshi-sand);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  text-align: center;
  letter-spacing: 2px;
  background: transparent;
  border: none;
}

.option-count-4 .special-actions-menu,
.option-count-5 .special-actions-menu,
.option-count-6 .special-actions-menu,
.option-count-7 .special-actions-menu,
.option-count-8 .special-actions-menu {
  max-height: min(50vh, 300px);
}

.option-count-4 .special-action-item,
.option-count-5 .special-action-item,
.option-count-6 .special-action-item,
.option-count-7 .special-action-item,
.option-count-8 .special-action-item {
  padding: 8px 16px;
  font-size: 0.88rem;
  letter-spacing: 1.5px;
}

.option-count-4 .interactive-options-container,
.option-count-5 .interactive-options-container,
.option-count-6 .interactive-options-container,
.option-count-7 .interactive-options-container,
.option-count-8 .interactive-options-container {
  gap: 10px;
  padding: 58px 20px 20px 20px;
}

.special-action-item:hover {
  background: linear-gradient(90deg, transparent, rgba(184, 83, 49, 0.4), transparent);
  color: #fff;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}

.trpg-option {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.02) 0%, transparent 100%);
  border-left: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  cursor: pointer;
  transition:
    transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
    box-shadow 0.3s ease,
    border-color 0.3s ease,
    background 0.3s ease;
  position: relative;
  overflow: hidden;
  text-decoration: none;
  color: var(--kenshi-sand);
  text-align: left;
  border: none;
  background-size: 1px 1px;
  background-repeat: no-repeat;
}

.trpg-option:hover {
  transform: translateX(12px);
  background: linear-gradient(90deg, rgba(184, 83, 49, 0.15) 0%, rgba(198, 166, 100, 0.05) 100%);
  border-left: 3px solid var(--kenshi-rust);
  box-shadow: -6px 0 20px -5px var(--rust-glow);
}

.fight-option {
  border-left: 3px solid rgba(239, 68, 68, 0.85);
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.12) 0%, rgba(198, 166, 100, 0.05) 100%);
  box-shadow: 0 0 18px rgba(239, 68, 68, 0.25);
}

.fight-option:hover {
  transform: translateX(12px) scale(1.01);
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.22) 0%, rgba(198, 166, 100, 0.08) 100%);
  border-left: 3px solid rgba(239, 68, 68, 1);
  box-shadow: -6px 0 26px rgba(239, 68, 68, 0.45);
}

.dc-option {
  border-left: 3px solid rgba(96, 165, 250, 0.95);
  background: linear-gradient(
    90deg,
    rgba(96, 165, 250, 0.18) 0%,
    rgba(125, 211, 252, 0.08) 55%,
    rgba(198, 166, 100, 0.04) 100%
  );
  box-shadow: 0 0 18px rgba(96, 165, 250, 0.24);
}

.dc-option:hover {
  transform: translateX(12px) scale(1.01);
  background: linear-gradient(
    90deg,
    rgba(96, 165, 250, 0.28) 0%,
    rgba(125, 211, 252, 0.12) 55%,
    rgba(198, 166, 100, 0.06) 100%
  );
  border-left: 3px solid rgba(147, 197, 253, 1);
  box-shadow: -6px 0 26px rgba(96, 165, 250, 0.4);
}

.fight-tag,
.dc-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  margin-right: 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  letter-spacing: 2px;
}

.fight-tag {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.6);
  color: #ffd6d6;
}

.dc-tag {
  background: rgba(96, 165, 250, 0.18);
  border: 1px solid rgba(147, 197, 253, 0.65);
  color: #d9efff;
  box-shadow: 0 0 10px rgba(96, 165, 250, 0.18);
}

.option-badge {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 28px;
  height: 28px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid var(--bg3-gold);
  color: var(--bg3-gold);
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-size: 0.9rem;
  border-radius: 4px;
  margin-right: 16px;
  flex-shrink: 0;
  transition: all 0.3s ease;
  transform: rotate(45deg);
}

.option-badge span {
  transform: rotate(-45deg);
}

.trpg-option:hover .option-badge {
  background: var(--kenshi-rust);
  color: #fff;
  border-color: var(--kenshi-rust);
  box-shadow: 0 0 12px var(--rust-glow);
}

.option-text {
  flex-grow: 1;
  font-size: 1.05rem;
  letter-spacing: 0.5px;
  z-index: 1;
  line-height: 1.5;
}

.ripple {
  display: none;
}

.fade-in-up {
  animation: fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.empty-state {
  width: 100%;
  padding: 12px 16px;
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  font-size: 0.95rem;
}
</style>
