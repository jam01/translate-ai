<script setup lang="ts">
import {ref, onMounted, computed} from 'vue'
import { useTranslationStore } from "../store/translationStore.ts"
import { seekToParagraph } from "../services/fileReaderService.ts"
import { nextSegment } from "../services/segmenter.ts"

const store = useTranslationStore()
const props = defineProps<{
  file: File
}>()

// State
const textContent = ref('') // Complete paragraph
const currentOffset = ref(store.lastProcessedByteOffset || 0) // Byte tracking
const highlightedSegment = ref<{ start: number; end: number } | null>(null) // Track the highlighted segment

// Load the next chunk and highlight the first segment
async function loadNextChunk() {
  const result = await seekToParagraph(props.file, currentOffset.value, 100) // Limit to 100 words
  textContent.value = result.text
  currentOffset.value = result.byteOffset

  // Extract the first segment and highlight it
  const segmentInfo = nextSegment(textContent.value, 100)
  if (segmentInfo) {
    highlightedSegment.value = { start: 0, end: segmentInfo.endOffset }
  } else {
    highlightedSegment.value = null // Clear highlighting if no more segments
  }
}

// Handle text selection for custom highlighting
function handleSelection(event: Event) {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  const selectedText = range.toString() // Fetch selected text

  if (!selectedText) return

  const startOffset = textContent.value.indexOf(selectedText)
  const endOffset = startOffset + selectedText.length

  // Ensure the selection starts from the start of text
  if (startOffset === 0) {
    highlightedSegment.value = { start: startOffset, end: endOffset }
  } else {
    console.warn("Highlight must start at the beginning of the text.")
  }

  // Clear selection visually
  selection.removeAllRanges()
}

// Compute highlighted text with `<mark>` tags
const highlightedText = computed(() => {
  if (!highlightedSegment.value) return textContent.value

  const { start, end } = highlightedSegment.value
  const before = textContent.value.slice(0, start)
  const highlighted = textContent.value.slice(start, end)
  const after = textContent.value.slice(end)

  return `${before}<mark>${highlighted}</mark>${after}`
})

// Load the first chunk upon mounting
onMounted(() => {
  loadNextChunk()
})
</script>

<template>
  <div class="text-viewer">
    <div
      class="text-content"
      @mouseup="handleSelection"
      v-html="highlightedText"
      contenteditable="false"
    ></div>
    <button @click="loadNextChunk">Load More</button>
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
</style>
