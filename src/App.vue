<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { useTranslationStore } from "./store/translationStore.ts";
import TranslationWorkspace from "./components/TranslationWorkspace.vue";
import SourcePicker from "./components/SourcePicker.vue";

const store = useTranslationStore();

const isSessionStarted = ref(store.sessionStarted);
watchEffect(() => {
  isSessionStarted.value = store.sessionStarted;
});
</script>

<template>
  <nav class="app-navbar">
    <div class="navbar-title">AI Assisted Translation</div>
    <div class="navbar-buttons">
      <!-- Placeholder for future buttons -->
    </div>
  </nav>
  <main class="app-main">
    <div v-if="!isSessionStarted" class="centered-container">
      <div class="config-card">
        <h2>Select a Source File to Begin</h2>
        <SourcePicker />
      </div>
    </div>

    <div v-else class="workspace-container">
      <TranslationWorkspace />
    </div>
  </main>
</template>

<style scoped>
.app-navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--navbar-bg-color);
  padding-left: 2rem;
  color: var(--text-color);
  width: 100%;
  height: 3.5rem;
  position: fixed;
  top: 0;
  z-index: 10;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 2rem;
}

.centered-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.config-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.config-card h2 {
  color: var(--title-color);
  margin: 0;
  font-size: 1.25rem;
  text-align: center;
}

.workspace-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  margin-top: 3.5rem;
}
</style>
