<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useTranslationStore } from "../store/translationStore.ts";
import { seekToParagraph } from "../services/fileReaderService.ts";
import { nextSegment } from "../services/segmenter.ts";

const store = useTranslationStore();

const textContent = ref("");
const workingRange = ref<{ start: number; end: number } | null>(null);

watch(
  () => store.sourceFile,
  async (newFile) => {
    if (newFile) {
      textContent.value = "";
      await loadNextChunk();
    }
  },
  { immediate: true }
);

async function loadNextChunk() {
  const source = store.sourceFile;
  if (!source) return;

  const result = await seekToParagraph(
      source,
      store.translationDoc.lastProcessedPosition.byteOffset,
      550); // Read 100 words max

  if (!result?.text) return;

  textContent.value = result.text;
  const segmentRange = nextSegment(textContent.value, 100);
  if (!segmentRange) {
    workingRange.value = null; // Clear highlighting
    return;
  }

  workingRange.value = { start: 0, end: segmentRange.index };
  store.setWorkingSegment({
    start: store.translationDoc.lastProcessedPosition,
    end: calculateEndPosition(textContent.value.slice(0, segmentRange.index), store.translationDoc.lastProcessedPosition)
  })
}

// Handle text selection for custom highlighting
function handleSelection() {
  const selection = window.getSelection(); // NOTE: this gets the selection independent of the whole text
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const selectedText = range.toString();
  if (!selectedText) return;

  const startOffset = textContent.value.indexOf(selectedText); // NOTE: if selected a non-unique text, first picked
  if (startOffset === -1) return;

  const endOffset = startOffset + selectedText.length;
  workingRange.value = { start: 0, end: endOffset };
  store.setWorkingSegment({
    start: store.translationDoc.lastProcessedPosition,
    end: calculateEndPosition(selectedText, store.translationDoc.lastProcessedPosition)
  })

  // Clear the selection visually
  selection.removeAllRanges();
}

/**
 * Helper: Calculate the end position (row, column, byteOffset) of the segment.
 * @param segmentText The text being processed
 * @param startPosition The starting position (`row`, `column`, `byteOffset`)
 * @returns The calculated end position as a `TextPosition`
 */
function calculateEndPosition(
    segmentText: string,
    startPosition: { row: number; column: number; byteOffset: number }
): { row: number; column: number; byteOffset: number } {
  const lines = segmentText.split('\n'); // Split text into lines to calculate rows

  // Row calculation: Add the number of extra lines from the start position
  const rowsAdded = lines.length - 1;
  const row = startPosition.row + rowsAdded;

  // Column calculation:
  const column = rowsAdded === 0
      ? startPosition.column + lines[0].length // Same row, add to the start column
      : lines[lines.length - 1].length; // New row, use last line's length

  // Byte offset calculation:
  const byteOffset = startPosition.byteOffset + new TextEncoder().encode(segmentText).length;

  return { row, column, byteOffset };
}

// Highlight text using `<mark>` tags
const highlightedText = computed(() => {
  if (!workingRange.value) return textContent.value;

  const { start, end } = workingRange.value;
  const highlighted = textContent.value.slice(start, end);
  const after = textContent.value.slice(end);

  return `<mark class="mark-source">${highlighted}</mark>${after}`;
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
<!--    <button class="load-next-btn" @click="loadNextChunk">▶ Load Next Segment</button>-->
  </div>
  <div v-else class="placeholder">
    <p>No source file selected yet. Please select a file to begin.</p>
  </div>
</template>

<style scoped>
.text-viewer {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 0;
  margin: 0;
  height: 100%;
}

.text-content {
  background-color: #1e1e1e;
  color: #f0f0f0;
  padding: 0.5rem 1rem;
  border: 1px solid #444;
  border-radius: 6px;
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.6;
  font-size: 1rem;
  min-height: 200px;
  flex: 1;
  text-align: left;
  overflow-y: auto; /* Scroll content internally */
  overflow-x: clip; /* Hide horizontal scrollbar */
}

.placeholder {
  margin-top: 1rem;
  font-style: italic;
  text-align: center;
  color: #aaa;
}

.load-next-btn {
  padding: 0.5rem 1rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  align-self: flex-start;
  transition: background-color 0.2s ease;
}

.load-next-btn:hover {
  background-color: #369d6d;
}
</style>
