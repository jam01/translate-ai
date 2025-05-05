<script setup lang="ts">
import { ref, watchEffect } from "vue";
import SourcePicker from "./components/SourcePicker.vue";
import SourceViewer from "./components/SourceViewer.vue";
import { useTranslationStore } from "./store/translationStore.ts";

// Access the store
const store = useTranslationStore();

// Check if a file has been loaded
const isFileSelected = ref(!!store.sourceFile);

// Reactively update the state when the source file changes
watchEffect(() => {
  isFileSelected.value = !!store.sourceFile;
});
</script>

<template>
  <div id="app">
    <header>
      <h1>AI Assisted Translation</h1>
    </header>
    <main>
      <!-- Show SourcePicker when no file is selected -->
      <div v-if="!isFileSelected" class="file-selection-area">
        <h2>Select a Source File to Begin</h2>
        <SourcePicker />
      </div>

      <!-- Show SourceViewer when a file is selected -->
      <div v-else class="translation-area">
        <h2>Translation Interface</h2>
        <SourceViewer />
      </div>
    </main>
  </div>
</template>

<style scoped>
#app {
  font-family: Arial, sans-serif;
  text-align: center;
  padding: 2rem;
}

header {
  margin-bottom: 1rem;
}

h1 {
  font-size: 2rem;
  color: #333;
}

main {
  margin-top: 2rem;
}

.file-selection-area,
.translation-area {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}
</style>
