<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import DiffView from "./DiffView.vue";
import SourceViewer from "./SourceViewer.vue";
import type { Segment, SegmentRange, TranslationDocument } from "../types/translationState.ts";
import { SimpleModelConfig, TranslationService } from "../services/translationService.ts";
import simplePrompt from '../assets/prompt-simple.txt?raw';
import mainPrompt from '../assets/prompt-main.txt?raw';
import { VueEasyMDE } from "vue3-easymde";
import { getText } from "../services/fileReaderService.ts";

const props = defineProps<{
  source: File; // The source file
  translationDoc: TranslationDocument; // Progress
}>();

const sourceViewerRef = ref<typeof SourceViewer | null>(null);
const editorContent = ref('');
const showCommentsDrawer = ref(false);
const commentEditor = ref('');

const currSegmentIdx = ref(props.translationDoc.segments.length);
const isTranslating = ref(false);
const candidate1 = ref('');
const candidate2 = ref('');
const workingSegment = reactive({
  text: '',
  range: {
    start: { row: 0, column: 0, byteOffset: 0 },
    end: { row: 0, column: 0, byteOffset: 0 }
  }
});

import.meta.env.TKN
const headers = {Authorization: "Bearer " + import.meta.env.VITE_TKN}
const simple = new SimpleModelConfig(simplePrompt, headers)
const main = new SimpleModelConfig(mainPrompt, headers)
const translator = new TranslationService(simple, main)

function handleSaveAndReload() {
  if (isNext()) {
    if (!sourceViewerRef.value) {
      console.error("SourceViewer is not loaded yet.");
      return;
    }

    const seg: SegmentRange = workingSegment.range
    const newSegment: Segment = {
      id: props.translationDoc.segments.length + 1,
      range: seg,
      translation: editorContent.value,
      comments: commentEditor.value.trim() ? [commentEditor.value.trim()] : [],
      annotations: [],
      decisions: [],
      updatedAt: Date.now(),
    }
    props.translationDoc.segments.push(newSegment)
    props.translationDoc.lastProcessedPosition = newSegment.range.end
    props.translationDoc.lastUpdatedAt = Date.now()

    currSegmentIdx.value++;
    editorContent.value = "";
    commentEditor.value = "";
    sourceViewerRef.value.loadText();

    return;
  }

  const segment = props.translationDoc.segments[currSegmentIdx.value]
  segment.translation = editorContent.value
  segment.comments = commentEditor.value.trim() ? [commentEditor.value.trim()] : []
  segment.updatedAt = Date.now()
  props.translationDoc.lastUpdatedAt = Date.now()

  goForward()
}

// Handle the segment-selected event from SourceViewer
function handleSegmentSelected(segment: { text: string; range: SegmentRange }) {
  workingSegment.text = segment.text;
  workingSegment.range = segment.range;
}

async function translate() {
  isTranslating.value = true;
  // const c1 = "boop" + Math.random();
  // const c2 = "boop" + Math.random();
  // const c1 = 'The Sandinista revolutionary must avoid the simple "revolutionary phrase"; we need to accompany this with a deep identification with revolutionary principles.';
  // const c2 = 'The Sandinista revolutionary must avoid the mere "revolutionary phrase"; we need to accompany this with a deep identification with revolutionary principles.';
  const { candidate1: c1, candidate2: c2 } = await translator.translate(workingSegment.text);
  candidate1.value = c1;
  candidate2.value = c2;
  editorContent.value = c2;
  isTranslating.value = false;
}

async function loadSegment(segment: Segment) {
  workingSegment.range = segment.range;
  workingSegment.text = (await getText(props.source, segment.range)).text
  editorContent.value = segment.translation || '';
  commentEditor.value = segment.comments.join('\n');
}

function goBack() {
  if (currSegmentIdx.value > 0) {
    currSegmentIdx.value--;
    loadSegment(props.translationDoc.segments[currSegmentIdx.value]);
  } else {
    alert("No previous segments available.");
  }
}

function goForward() {
  if (currSegmentIdx.value < props.translationDoc.segments.length) {
    currSegmentIdx.value++;
    if (isNext()) {
      editorContent.value = "";
      commentEditor.value = "";
    } else {
      loadSegment((props.translationDoc.segments[currSegmentIdx.value]));
    }
  } else {
    alert("No next segments available.");
  }
}

function isNext() {
  return currSegmentIdx.value == props.translationDoc.segments.length;
}

watch(
    () => workingSegment.text,
    async (newText) => {
      if (newText && isNext()) await translate()
    }
);
</script>

<template>
  <div class="translation-workspace">
    <div class="pane left-pane">
      <div class="source">
        <div class="toolbar">
          <button @click="goBack" :disabled="currSegmentIdx <= 0">← Previous</button>
          <button @click="goForward" :disabled="currSegmentIdx == props.translationDoc.segments.length">Next →</button>
        </div>
        <SourceViewer v-if="currSegmentIdx == props.translationDoc.segments.length"
          ref="sourceViewerRef"
          :source="props.source"
          :translationDoc="props.translationDoc"
          @segmentSelected="handleSegmentSelected"
        />
        <textarea v-else
                  v-model="workingSegment.text"
                  class="prev-segment"
        ></textarea>
      </div>
      <div class="editor"><!-- Bottom: Editable Translation -->
        <VueEasyMDE v-model="editorContent"
                    :options="{
                      spellChecker: false,
                      hideIcons: ['code', 'table', 'image', 'link']
                    }"
        />
        <button class="save-next-btn" @click="handleSaveAndReload">Save & Load Next</button>
      </div>
    </div>
    <div class="pane right-pane">
      <div class="diff-view" :class="{ 'blurred': isTranslating }"><!-- Top: Diff View -->
        <DiffView :candidate1="candidate1" :candidate2="candidate2" />
        <button
            class="floating-refresh-btn"
            @click="translate"
            :disabled="isTranslating"
            title="Refresh Translation"
        >
          🔄
        </button>
      </div>
    </div>
    <transition name="slide">
      <div class="comments-sidebar" :class="{ open: showCommentsDrawer }">
        <div class="drawer-header">
          <h3>Comments</h3>
          <button class="close-btn" @click="showCommentsDrawer = false">✕</button>
        </div>
        <textarea v-model="commentEditor" placeholder="Write a comment..."></textarea>
      </div>
    </transition>
    <div class="sidebar-toggle" @click="showCommentsDrawer = !showCommentsDrawer">
      <span>{{ showCommentsDrawer ? '→' : '←' }}</span>
    </div>
  </div>
</template>

<style scoped>
.translation-workspace {
  display: flex;
  height: 100%;
  width: 100%;
  gap: 0.25rem;
  overflow: clip;
}

.pane {
  display: flex;
  flex: 1;
  flex-direction: column;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  border-radius: 6px;
  color: var(--text-color);
  text-align: left;
  gap: 0.25rem;
}

.source,
.editor {
  display: flex;
  flex-direction: column;
  height: 50%;
  overflow: hidden;
  justify-content: space-between;
}

.source {
  background-color: var(--card-bg);
  border: 1px solid #444;
  border-radius: 6px;

  .toolbar {
    display: flex;
    background-color: var(--bg-color);
  }
}

.editor {
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.save-next-btn {
  border-top: 1px solid var(--border-color);
  border-radius: 0;
}

.prev-segment {
  color: var(--text-color);
  background: var(--card-bg);
  padding: 0.5rem 1rem;
  white-space: pre-wrap;
  line-height: 1.6;
  font-size: 1rem;
  min-height: 200px;
  flex: 1;
  text-align: left;

  border: none;
  overflow: auto;
  outline: none;
  resize: none;
  box-shadow: none;
}

.diff-view {
  position: relative;
  flex: 1;
  background: var(--card-bg);
  border: 1px solid #444;
  border-radius: 6px;
  overflow-y: auto;
  padding: 0.5rem 1rem;
}

.diff-view.blurred {
  filter: blur(2px);
}

.floating-refresh-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  z-index: 10;
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: 50%;
  height: 40px;
  width: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  transition: background-color 0.2s;
}

.floating-refresh-btn:hover {
  background-color: var(--accent-color-hover);
}

.floating-refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.floating-refresh-btn:active {
  background-color: var(--bg-color);
}

.comments-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  width: 300px;
  height: 100%;
  background: var(--card-bg);
  color: var(--text-color);
  padding: 1rem;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.4);
  z-index: 999;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
  transform: translateX(100%); /* hidden by default */
  overflow-y: auto;
}

.comments-sidebar.open {
  transform: translateX(0); /* slide in */
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.drawer-header h3 {
  margin: 0;
}

.drawer-header .close-btn {
  background: none;
  border: none;
  color: var(--text-color);
  font-size: 1.2rem;
  cursor: pointer;
}

.comments-sidebar textarea {
  margin-top: 1rem;
  resize: vertical;
  min-height: 100px;
  background: #1e1e1e;
  color: var(--text-color);
  border: 1px solid #555;
  border-radius: 4px;
  padding: 0.5rem;
}

.drawer-buttons {
  margin-top: 0.5rem;
  display: flex;
  justify-content: flex-end;
}

.drawer-buttons button {
  background-color: var(--accent-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.sidebar-toggle {
  position: fixed;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  background: var(--accent-color);
  color: white;
  padding: 0.5rem;
  border-radius: 4px 0 0 4px;
  cursor: pointer;
  z-index: 1000;
  font-weight: bold;
}
</style>
