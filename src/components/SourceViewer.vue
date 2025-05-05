<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useTranslationStore } from "../store/translationStore.ts";
import { seekToParagraph } from "../services/fileReaderService.ts";
import { nextSegment } from "../services/segmenter.ts";

const store = useTranslationStore();

// Local state
const textContent = ref("");
const currentOffset = ref(0);
const highlightedSegment = ref<{ start: number; end: number } | null>(null);

// Watch the `sourceFile` in case it changes
watch(
  () => store.sourceFile,
  async (newFile) => {
    if (newFile) {
      // Reset any state when a new file is selected
      currentOffset.value = 0;
      textContent.value = "";
      highlightedSegment.value = null;

      // Load the first chunk of the new file
      await loadNextChunk();
    }
  },
  { immediate: true }
);

// Fetch the next text chunk
async function loadNextChunk() {
  const source = store.sourceFile;
  if (!source) return;
  const result = await seekToParagraph(source, currentOffset.value, 100); // Read 100 words max
  textContent.value = result.text;
  currentOffset.value = result.byteOffset;

  // Extract the first segment and highlight it
  const segmentInfo = nextSegment(textContent.value, 100);
  if (segmentInfo) {
    highlightedSegment.value = { start: 0, end: segmentInfo.endOffset };
  } else {
    highlightedSegment.value = null; // Clear highlighting
  }
}

// Handle text selection for custom highlighting
function handleSelection() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const selectedText = range.toString();
  if (!selectedText) return;

  const startOffset = textContent.value.indexOf(selectedText);
  if (startOffset === -1) return;

  // Ensure the selection starts from the start of text
  if (startOffset === 0) {
    highlightedSegment.value = { start: startOffset, end: endOffset };
  } else {
    console.warn("Highlight must start at the beginning of the text.");
  }

  const endOffset = startOffset + selectedText.length;
  highlightedSegment.value = { start: startOffset, end: endOffset };

  // Clear the selection visually
  selection.removeAllRanges();
}

// Highlight text using `<mark>` tags
const highlightedText = computed(() => {
  if (!highlightedSegment.value) return textContent.value;

  const { start, end } = highlightedSegment.value;
  const before = textContent.value.slice(0, start);
  const highlighted = textContent.value.slice(start, end);
  const after = textContent.value.slice(end);

  return `${before}<mark>${highlighted}</mark>${after}`;
});
</script>

<template>
  <div v-if="store.sourceFile" class="text-viewer">
    <div
      class="text-content"
      @mouseup="handleSelection"
      v-html="highlightedText"
      contenteditable="false"
    ></div>
    <button @click="loadNextChunk">Load More</button>
  </div>
  <div v-else class="placeholder">
    <p>No source file selected yet. Please select a file to begin.</p>
  </div>
</template>

<style scoped>
.text-viewer {
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 1rem;
}
.text-content {
  white-space: pre-wrap;
  word-wrap: break-word;
}
mark {
  background-color: yellow;
  color: black;
}
.placeholder {
  margin-top: 1rem;
  font-style: italic;
  text-align: center;
  color: gray;
}
</style>
