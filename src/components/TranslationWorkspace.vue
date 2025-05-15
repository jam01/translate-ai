<script setup lang="ts">
import { ref } from "vue";
import SourceViewer from "./SourceViewer.vue";
import type { Segment, SegmentRange, TranslationDocument } from "../types/translationState.ts";

const props = defineProps<{
  source: File; // The source file
  translationDoc: TranslationDocument; // Progress
}>();

const sourceViewerRef = ref<typeof SourceViewer | null>(null);
const editorContent = ref('');
const workingSegment = {
  text: '',
  range: {
    start: { row: 0, column: 0, byteOffset: 0 },
    end: { row: 0, column: 0, byteOffset: 0 }
  }
};

function handleSaveAndReload() {
  if (!sourceViewerRef.value) {
    console.error("SourceViewer is not loaded yet.");
    return;
  }

  if (!editorContent.value.trim()) {
    alert("Translation content cannot be empty!");
    return;
  }

  const seg: SegmentRange = workingSegment.range
  const newSegment: Segment = {
    id: props.translationDoc.segments.length + 1,
    range: seg,
    translation: editorContent.value,
    comments: [],
    annotations: [],
    decisions: [],
    updatedAt: Date.now(),
  }
  props.translationDoc.segments.push(newSegment)
  props.translationDoc.lastProcessedPosition = newSegment.range.end
  props.translationDoc.lastUpdatedAt = Date.now()

  editorContent.value = "";
  sourceViewerRef.value.loadText();
}

// Handle the segment-selected event from SourceViewer
function handleSegmentSelected(segment: { text: string; range: SegmentRange }) {
  workingSegment.text = segment.text;
  workingSegment.range = segment.range;

  editorContent.value = segment.text; // Pre-fill the editor with the selected text
}
</script>

<template>
  <div class="translation-workspace">
    <div class="pane source-pane">
     <SourceViewer
         ref="sourceViewerRef"
         :source="props.source"
         :translationDoc="props.translationDoc"
         @segmentSelected="handleSegmentSelected"
     />
    </div>
    <div class="pane right-pane">
      <!-- Top: Diff View -->
      <div class="diff-view">
        <div class="diff-placeholder">This area will contain side-by-side diff views or AI-generated suggestions.</div>
      </div>
      <!-- Bottom: Editable Translation -->
      <div class="editor">
        <textarea
          v-model="editorContent"
          class="translation-editor"
          placeholder="Start editing your translation here..."
        ></textarea>
        <button @click="handleSaveAndReload">Save & Load Next</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.translation-workspace {
  display: flex;
  height: 100%;
  width: 100%;
  gap: 0.25rem;
}

.pane {
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  border-radius: 6px;
  color: var(--text-color);
}

.source-pane {
  width: 50%;
  background: var(--card-bg);
  border-right: 1px solid #444;
  overflow-y: auto; /* Scrolling only inside the pane */
  padding: 0; /* Removed extra padding */
}

.right-pane {
  width: 50%;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.diff-view {
  flex: 1;
  background: var(--card-bg);
  border: 1px solid #444;
  border-radius: 6px;
  overflow-y: auto;
}

.editor {
  flex: 1;
  display: flex;
  flex-direction: column;
}

textarea.translation-editor {
  flex: 1;
  background: #1e1e1e;
  border: 1px solid #555;
  border-radius: 4px;
  padding: 0.5rem;
  color: var(--text-color);
  font-size: 1rem;
  resize: none;
}

.no-source-placeholder {
  text-align: center;
  padding: 2rem;
  color: #999;
  font-style: italic;
}

textarea.translation-editor,
.source-pane,
.diff-view {
  max-height: 100%; /* Prevent overflowing */
}
</style>
