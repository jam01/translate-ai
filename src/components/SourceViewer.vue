<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { seekToParagraph } from "../services/fileReaderService.ts";
import { nextSegment } from "../services/segmenter.ts";
import type { SegmentRange, TranslationDocument } from "../types/translationState.ts";

const props = defineProps<{
  source: File; // The file to be displayed (always available)
  translationDoc: TranslationDocument; // Translation document passed as a prop
}>();
const emit = defineEmits<{
  (e: "segment-selected", segment: { text: string; range: SegmentRange }): void;
}>();

const textContent = ref('');
const workingRange = ref<{ start: number; end: number } | null>(null);

// Load the next portion of text from the file.
async function loadText() {
  const position = props.translationDoc.lastProcessedPosition;
  const result = await seekToParagraph(props.source, position.byteOffset, 550); // Start from the last processed byte offset, read max 550 words

  if (!result?.text) return;

  textContent.value = result.text;
  const segmentRange = nextSegment(textContent.value, 100);
  if (!segmentRange) {
    workingRange.value = null; // Clear highlighting
    return;
  }

  const selectedText = textContent.value.slice(0, segmentRange.index);
  workingRange.value = { start: 0, end: segmentRange.index };
  emit("segment-selected", {
    text: selectedText,
    range: {
      start: props.translationDoc.lastProcessedPosition,
      end: calculateEndPosition(props.translationDoc.lastProcessedPosition, selectedText)
    }
  });
}

// Handle text selection for custom highlighting
function handleSelection() {
  const selection = window.getSelection(); // NOTE: this gets the selection independent of the whole text
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  let selectedText = range.toString();
  if (!selectedText) return;

  const startOffset = textContent.value.indexOf(selectedText); // NOTE: if selected a non-unique text, first picked
  if (startOffset === -1) return;

  const endOffset = startOffset + selectedText.length;
  selectedText = textContent.value.slice(0, endOffset);
  workingRange.value = { start: 0, end: endOffset };
  emit("segment-selected", {
      text: selectedText,
      range: {
        start: props.translationDoc.lastProcessedPosition,
        end: calculateEndPosition(props.translationDoc.lastProcessedPosition, selectedText)
      }}
  );

  // Clear the selection visually
  selection.removeAllRanges();
}

/**
 * Helper: Calculate the end position (row, column, byteOffset) of the segment.
 * @param startPosition The starting position (`row`, `column`, `byteOffset`)
 * @param segmentText The text being processed
 * @returns The calculated end position as a `TextPosition`
 */
function calculateEndPosition(
    startPosition: { row: number; column: number; byteOffset: number },
    segmentText: string
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

defineExpose({ loadText })

onMounted(() => {
  loadText(); // Load content when the component is mounted
});
</script>

<template>
  <div class="source-viewer">
    <div
        class="text-content"
        @mouseup="handleSelection"
        v-html="highlightedText"
        contenteditable="false"
    ></div>
<!--    <button class="load-next-btn" @click="loadNextChunk">▶ Load Next Segment</button>-->
  </div>
</template>

<style scoped>
.source-viewer {
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow-y: auto;
}

.text-content {
  color: var(--text-color);
  background: var(--card-bg);
  padding: 0.5rem 1rem;
  white-space: pre-wrap;
  line-height: 1.6;
  font-size: 1rem;
  min-height: 200px;
  flex: 1;
  text-align: left;
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
