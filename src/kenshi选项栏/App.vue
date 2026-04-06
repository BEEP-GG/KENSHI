<template>
  <div class="options-root">
    <div v-if="options.length" class="interactive-options-container" :class="`option-count-${options.length}`">
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
        :class="['trpg-option fade-in-up', { 'fight-option': isFightOption(opt) }]"
        :style="{ animationDelay: `${index * 0.1}s` }"
        type="button"
        @click="handleOptionClick(opt, $event)"
      >
        <div class="option-badge">
          <span>{{ opt.number }}</span>
        </div>
        <div class="option-text">
          <span v-if="isFightOption(opt)" class="fight-tag">战斗</span>
          {{ opt.text }}
        </div>
      </button>
    </div>

    <div v-else class="empty-state">未检测到选项文本</div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

type OptionItem = {
  number: string;
  text: string;
};

const options = ref<OptionItem[]>([]);
const isSpecialMenuOpen = ref(false);
const specialActions = ['暗杀', '偷窃', '休息', '医疗', '搜索', '交易', '战斗'];

const optionLineRegex = /^[^\S\n]*(?:[（(【]?\s*(\d+)\s*[.、:：]\s*(.*?))(?:[）)】])?\s*$/;
const optionFallbackLineRegex = /^[^\S\n]*(\d+)\s+[、.．]\s*(.*?)\s*$/;

function parseOptionsFromText(text: string): OptionItem[] {
  if (!text) return [];
  const lines = text.split(/\r?\n/);
  const blocks: OptionItem[][] = [];
  let currentBlock: OptionItem[] = [];

  for (const line of lines) {
    const match = line.match(optionLineRegex) || line.match(optionFallbackLineRegex);
    if (match) {
      const number = match[1]?.trim();
      const optionText = match[2]?.trim();
      if (number && optionText) {
        currentBlock.push({ number, text: optionText });
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

  return blocks.length ? blocks[blocks.length - 1] : [];
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

function toggleSpecialMenu() {
  isSpecialMenuOpen.value = !isSpecialMenuOpen.value;
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

function handleOptionClick(opt: OptionItem, event: MouseEvent) {
  const target = event.currentTarget as HTMLElement;
  createRipple(event, target);
  if (isFightOption(opt)) {
    triggerFightBattle();
    return;
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
  fillInput(action);
  closeSpecialMenu();
}

function handleDocumentClick() {
  if (isSpecialMenuOpen.value) {
    closeSpecialMenu();
  }
}

let eventListenerStop: { stop: () => void } | null = null;

onMounted(() => {
  renderOptions();
  document.addEventListener('click', handleDocumentClick);
  eventListenerStop = eventOn(tavern_events.MESSAGE_UPDATED, messageId => {
    if (messageId === getCurrentMessageId()) {
      renderOptions();
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
  padding: 28px 24px 24px 24px;
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
  padding: 24px 20px 20px 20px;
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

.fight-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  margin-right: 10px;
  border-radius: 999px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.6);
  color: #ffd6d6;
  font-size: 0.8rem;
  letter-spacing: 2px;
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
