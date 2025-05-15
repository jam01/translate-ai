<script setup lang="ts">
import { computed, ref } from "vue";
import type { TranslationDocument } from "../types/translationState.ts";

const emit = defineEmits<{
  (e: "start-translation", source: File, translationDoc: TranslationDocument | null): void;
}>();

const sourceFile = ref<File | null>(null);
const progressFile = ref<File | null>(null);
let translationDoc: TranslationDocument | null = null;

const sourceFileName = computed(() => sourceFile.value?.name || "");
const progressFileName = computed(() => progressFile.value?.name || "");

function handleSourceFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  sourceFile.value = file;
}

async function handleProgressFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  progressFile.value = file;

  try {
    const content = await file.text();
    translationDoc = JSON.parse(content);
  } catch (error) {
    alert("Failed to parse translation progress file.");
    console.error(error);
  }
}

function startTranslation() {
  if (!sourceFile.value) return;
  emit("start-translation", sourceFile.value, translationDoc);
}
</script>

<template>
  <div class="source-picker">
    <!-- Source File Picker -->
    <div class="file-input-group">
      <label for="source-file">Source Document:</label>
      <input
          id="source-file"
          type="file"
          accept=".txt,.md,.rtf"
          @change="handleSourceFileChange"
      />
      <p class="file-hint">Supported formats: .txt, .md, .rtf</p>
      <p v-if="sourceFileName" class="file-selected">Selected: {{ sourceFileName }}</p>
    </div>

    <!-- Progress File Picker (Optional) -->
    <div class="file-input-group">
      <label for="progress-file">Translation Progress (Optional):</label>
      <input
          id="progress-file"
          type="file"
          accept=".json"
          @change="handleProgressFileChange"
      />
      <p class="file-hint">Saved session file (.json)</p>
      <p v-if="progressFileName" class="file-selected">Selected: {{ progressFileName }}</p>
    </div>

    <!-- Start Button -->
    <button
        class="start-button"
        :disabled="!sourceFile"
        @click="startTranslation"
    >
      Start Translation
    </button>
  </div>
</template>


<style scoped>
.source-picker {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.file-input-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
}

label {
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #ffffff;
}

input[type="file"] {
  padding: 0.5rem;
  background-color: #2d2d2d;
  border: 1px solid #444;
  border-radius: 4px;
  color: #f0f0f0;
  width: 100%;
  box-sizing: border-box;
}

.file-hint {
  font-size: 0.85rem;
  color: #aaa;
  margin-top: 0.25rem;
}

.file-selected {
  font-style: italic;
  color: #42b983;
  margin-top: 0.25rem;
}

.start-button {
  padding: 0.75rem 1.5rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  align-self: flex-start;
  transition: background-color 0.2s ease;
}

.start-button:hover {
  background-color: #369d6d;
}

.start-button:disabled {
  background-color: #555;
  cursor: not-allowed;
}
</style>
