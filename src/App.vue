<script setup lang="ts">
import { ref, watchEffect } from "vue";
import SourcePicker from "./components/SourcePicker.vue";
import SourceViewer from "./components/SourceViewer.vue";
import { useTranslationStore } from "./store/translationStore.ts";

// Access the store
const store = useTranslationStore();

const isSessionStarted = ref(store.sessionStarted);

watchEffect(() => {
  isSessionStarted.value = store.sessionStarted;
});
</script>

<template>
  <div id="app">
    <header class="app-header">
      <h1>AI Assisted Translation</h1>
    </header>
    <main class="app-main">
      <!-- Centered File Picker -->
      <div v-if="!isSessionStarted" class="centered-container">
        <div class="config-card">
          <h2>Select a Source File to Begin</h2>
          <SourcePicker />
        </div>
      </div>

      <!-- Full-width translation workspace -->
      <div v-else class="workspace-container">
        <SourceViewer />
      </div>
    </main>
  </div>
</template>

<style scoped>
:root {
  --bg-color: #1e1e1e;
  --text-color: #f0f0f0;
  --accent-color: #42b983;
  --card-bg: #2d2d2d;
  --border-color: #444;
  --title-color: #ffffff;
}

html,
body {
  margin: 0;
  padding: 0;
  background-color: var(--bg-color);
  color: var(--text-color);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: #121212;
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
}

.app-header h1 {
  margin: 0;
  font-size: 1.75rem;
  text-align: left;
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
  margin-top: 0;
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
}

.workspace-container {
  flex: 1;
  max-width: 100%;
}
</style>
