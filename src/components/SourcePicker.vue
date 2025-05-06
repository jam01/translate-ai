<script setup lang="ts">
import { useTranslationStore } from '../store/translationStore.ts';

const store = useTranslationStore();

async function handleFileSelection(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  store.setSourceFile(file); // Set the selected file to the store
}
</script>

<template>
  <div class="source-picker">
    <label for="fileInput">Select Source File:</label>
    <input id="fileInput" type="file" @change="handleFileSelection" accept=".txt" />
  </div>
</template>

<style scoped>
.source-picker {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1rem;
}
</style>
