<template>
  <div class="encyclopedia-screen">
    <button
      class="fullscreen-toggle"
      type="button"
      :title="isFullscreen ? '退出全屏' : '全屏显示'"
      @click="toggleFullscreen"
    >
      <span class="fullscreen-icon">{{ isFullscreen ? '⤫' : '⤢' }}</span>
      <span>{{ isFullscreen ? '退出全屏' : '全屏显示' }}</span>
    </button>

    <button v-if="showTutorial" class="back-button" type="button" @click="showTutorial = false">返回</button>

    <div v-if="!showTutorial" class="home-view">
      <div class="background-layer" />
      <div class="overlay overlay-vertical" />
      <div class="overlay overlay-horizontal" />

      <div class="content">
        <h1 class="title">KENSHI</h1>
        <p class="subtitle">终末之诗</p>

        <button class="encyclopedia-button" type="button" @click="showTutorial = true">百科全书</button>

        <div class="meta">
          <span>VER 0.9.2</span>
          <span>•</span>
          <span>LORE ENCYCLOPEDIA</span>
        </div>
      </div>
    </div>

    <div v-else class="tutorial-view">
      <iframe class="tutorial-frame" title="Kenshi Tutorial" src="../kenshi开局/index.html?tutorial=1" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

const isFullscreen = ref(false);
const showTutorial = ref(false);

const updateFullscreenState = () => {
  isFullscreen.value = Boolean(document.fullscreenElement);
  window.dispatchEvent(new Event('resize'));
};

const toggleFullscreen = async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await document.documentElement.requestFullscreen();
  } catch {
    // ignore browser fullscreen policy errors
  }
};

onMounted(() => {
  updateFullscreenState();
  document.addEventListener('fullscreenchange', updateFullscreenState);
  requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
});

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', updateFullscreenState);
});
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800;900&family=Inter:wght@200;300;400;500;600;700&display=swap');

:global(html, body) {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

:global(#app) {
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
}

:global(body) {
  background-color: #050505;
  color: #e5e5e5;
  font-family: 'Inter', sans-serif;
}

:global(:fullscreen #app) {
  height: 100%;
}

.encyclopedia-screen {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.home-view {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tutorial-view {
  position: absolute;
  inset: 0;
  background: #000;
}

.tutorial-frame {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
  background: #000;
}

.back-button {
  position: absolute;
  left: 16px;
  top: 16px;
  z-index: 4;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(194, 178, 128, 0.6);
  background: rgba(0, 0, 0, 0.4);
  color: #c2b280;
  font-size: 12px;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: background 0.2s ease;
}

.back-button:hover {
  background: rgba(194, 178, 128, 0.15);
}

.fullscreen-toggle {
  position: absolute;
  right: 16px;
  top: 16px;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(194, 178, 128, 0.6);
  background: rgba(0, 0, 0, 0.4);
  color: #c2b280;
  font-size: 12px;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: background 0.2s ease;
}

.fullscreen-toggle:hover {
  background: rgba(194, 178, 128, 0.15);
}

.fullscreen-icon {
  font-size: 12px;
}

.background-layer {
  position: absolute;
  inset: 0;
  background-image: url('https://picsum.photos/seed/kenshi_desert/1920/1080?grayscale');
  background-size: cover;
  background-position: center;
  opacity: 0.4;
  transform: scale(1.05);
  animation: slowPulse 20s ease-in-out infinite;
}

.overlay {
  position: absolute;
  inset: 0;
}

.overlay-vertical {
  background: linear-gradient(to bottom, #000 0%, transparent 40%, #000 100%);
}

.overlay-horizontal {
  background: linear-gradient(to right, rgba(0, 0, 0, 0.8), transparent 40%, rgba(0, 0, 0, 0.8));
}

.content {
  position: relative;
  z-index: 2;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeUp 1.4s ease-out;
}

.title {
  font-family: 'Cinzel', serif;
  font-size: clamp(48px, 10vw, 120px);
  letter-spacing: 0.35em;
  color: #c2b280;
  margin: 0 0 12px;
  text-shadow: 0 0 24px rgba(194, 178, 128, 0.25);
}

.subtitle {
  font-family: 'Cinzel', serif;
  font-size: clamp(16px, 2.5vw, 28px);
  letter-spacing: 0.35em;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 48px;
}

.encyclopedia-button {
  padding: 16px 52px;
  border-radius: 6px;
  border: 1px solid #c2b280;
  background: transparent;
  color: #c2b280;
  font-family: 'Cinzel', serif;
  font-size: 20px;
  letter-spacing: 0.3em;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.encyclopedia-button:hover {
  transform: scale(1.05);
  background: rgba(194, 178, 128, 0.1);
  box-shadow: 0 0 20px rgba(194, 178, 128, 0.3);
}

.encyclopedia-button:active {
  transform: scale(0.97);
}

.meta {
  margin-top: 28px;
  display: flex;
  gap: 10px;
  font-size: 12px;
  letter-spacing: 0.2em;
  color: rgba(255, 255, 255, 0.3);
  font-family: 'Inter', sans-serif;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slowPulse {
  0%,
  100% {
    opacity: 0.35;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
