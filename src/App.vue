<script setup lang="ts">
import { ref } from "vue";
import TranslationWorkspace from "./components/TranslationWorkspace.vue";
import SourcePicker from "./components/SourcePicker.vue";
import { saveProgressToFile } from "./services/fileHandler.ts";
import type { TranslationDocument } from "./types/translationState.ts";

const source = ref<File | null>(null);
let translationDoc: TranslationDocument | null = null;

function startTranslation(sourceFile: File, doc: TranslationDocument | null) {
  source.value = sourceFile;
  translationDoc = doc || {
    sourceName: sourceFile.name,
    segments: [],
    lastUpdatedAt: Date.now(),
    lastProcessedPosition: { row: 0, column: 0, byteOffset: 0 },
  }
}

function saveTranslationDocument() {
  saveProgressToFile(translationDoc!)
}
</script>

<template>
  <nav class="app-navbar">
    <div class="navbar-title">AI Assisted Translation</div>
    <div class="navbar-buttons">
      <button
        v-if="source"
        class="save-btn"
        @click="saveTranslationDocument"
      >
        Save Document
      </button>
    </div>
  </nav>
  <main class="app-main">
    <div v-if="!source" class="centered-container">
      <div class="config-card">
        <h2>Select a Source File to Begin</h2>
        <SourcePicker @startTranslation="startTranslation" />
      </div>
    </div>
    <div v-else class="workspace-container">
      <TranslationWorkspace
          :source="source!"
          :translationDoc="translationDoc!"
      />
    </div>
  </main>
</template>

<style scoped>
.app-navbar {
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--navbar-bg-color);
  padding-left: 2rem;
  padding-right: 2rem;
  color: var(--text-color);
  left: 0;
  right: 0;
  height: 3.5rem;
  position: fixed;
  top: 0;
  z-index: 10;
}

.navbar-buttons {
  display: flex;
  gap: 1rem;
}

button.save-btn {
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 1rem;
}

button.save-btn:hover {
  background-color: #369d6d;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
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
