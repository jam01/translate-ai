<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useTranslationStore } from "../store/translationStore.ts";
import { seekToParagraph } from "../services/fileReaderService.ts";
import { nextSegment } from "../services/segmenter.ts";

const store = useTranslationStore();

// Local state
const textContent = ref("");
const workingRange = ref<{ start: number; end: number } | null>(null);

// Watch the `sourceFile` in case it changes
watch(
  () => store.sourceFile,
  async (newFile) => {
    if (newFile) {
      // Reset any state when a new file is selected
      textContent.value = "";

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

  const result = await seekToParagraph(
      source,
      store.translationDoc.lastProcessedPosition.byteOffset,
      100); // Read 100 words max

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
<!--    <button @click="loadNextChunk">Load More</button>-->
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
