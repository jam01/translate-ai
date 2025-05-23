<script setup lang="ts">
import {reactive, ref, watch} from "vue";
import DiffView from "./DiffView.vue";
import SourceViewer from "./SourceViewer.vue";
import type { Segment, SegmentRange, TranslationDocument } from "../types/translationState.ts";
import { SimpleModelConfig, TranslationService } from "../services/translationService.ts";
import { VueEasyMDE } from "vue3-easymde";

const props = defineProps<{
  source: File; // The source file
  translationDoc: TranslationDocument; // Progress
}>();

const sourceViewerRef = ref<typeof SourceViewer | null>(null);
const editorContent = ref('');
const workingSegment = reactive({
  text: '',
  range: {
    start: { row: 0, column: 0, byteOffset: 0 },
    end: { row: 0, column: 0, byteOffset: 0 }
  }
});

const candidate1 = ref('');
const candidate2 = ref('');
const isTranslating = ref(false);

const token = ''
const simple = new SimpleModelConfig(
    "You are a skilled translator. Your task is to translate the following passage from Spanish into English with precision and sensitivity to the original tone, intent, and context.",
    {
      Authorization: "Bearer " + token,
    }
)
const main = new SimpleModelConfig(
    "You are a skilled translator specializing in political and revolutionary texts from Latin America, with particular expertise in Sandinista ideology and the Nicaraguan revolutionary process (1926–1979). Your task is to translate the following sentence(s) written by Carlos Fonseca Amador from Spanish into English with precision and sensitivity to the original tone, intent, and ideological context.\n" +
    "\n" +
    "The text may contain terms related to Marxism-Leninism, anti-imperialism, class struggle, and guerrilla struggle. When translating:\n" +
    "\n" +
    "- Preserve the **political connotations** of key terms (e.g., “pueblo,” “lucha de clases,” “imperialismo”).\n" +
    "- Maintain the **original tone**—whether formal, urgent, inspirational, or analytical.\n" +
    "- Ensure the **rhetorical force** of slogans or ideological phrases is retained.\n" +
    "- Respect the author's stylistic and structural choices  as much as possible.\n" +
    "    - Retain sentence rhythms, especially the use of repetitive or cumulative structures like “idea, idea, idea”—do not reduce them to “idea, idea and idea,” which dilutes the cadence and rhetorical force.\n" +
    "    - If a phrase is common in Spanish of the time but would sound unnatural in English, adapt it thoughtfully while preserving meaning and tone.\n" +
    "    - If a phrase appears intentionally unusual or \"weird\" even in the original context, retain it unless it severely hinders comprehension.\n" +
    "    - Preserve all original formatting, including:\n" +
    "         Headings, subheadings, and titles.\n" +
    "         Line breaks, whitespace, and indents--including trailing.\n" +
    "         Any punctuation, emphasis (like all caps or italics), or non-standard spacing.\n" +
    "         Maintain the exact placement of pre- and post-text relative to the main passage.\n" +
    "         Do not alter the visual structure, even if it appears unconventional or repetitive.\n" +
    "     - Do not output any comments or explanations. Avoid any non-printable characters, encoding artifacts, or extraneous symbols.\n" +
    "\n" +
    "Your goal is to produce a translation that is both faithful to the original  and readable to contemporary audiences , especially those engaged with radical politics, history, and revolutionary theory.",
    {
      Authorization: "Bearer " + token,
    }
)

const translator = new TranslationService(simple, main)

const showCommentsDrawer = ref(false);
const commentEditor = ref('');

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
    comments: commentEditor.value.trim() ? [commentEditor.value.trim()] : [],
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
}

async function translate() {
  isTranslating.value = true;
  // const c1 = "boop" + Math.random();
  // const c2 = "boop" + Math.random();
  // const t1 = 'The Sandinista revolutionary must avoid the simple "revolutionary phrase"; we need to accompany this with a deep identification with revolutionary principles.';
  // const t2 = 'The Sandinista revolutionary must avoid the mere "revolutionary phrase"; we need to accompany this with a deep identification with revolutionary principles.';
  const { candidate1: c1, candidate2: c2 } = await translator.translate(workingSegment.text);
  candidate1.value = c1;
  candidate2.value = c2;
  editorContent.value = c2;
  isTranslating.value = false;
}

watch(
    () => workingSegment.text,
    async (newText) => {
      if (newText) await translate()
    }
);
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
      <div class="editor"><!-- Bottom: Editable Translation -->
        <VueEasyMDE v-model="editorContent"
                    :options="{
                      spellChecker: false,
                      hideIcons: ['code', 'table', 'image', 'link']
                    }"
        />
        <button @click="handleSaveAndReload">Save & Load Next</button>
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
}

.pane {
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  border-radius: 6px;
  color: var(--text-color);
  text-align: left;
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

textarea.translation-editor,
.source-pane,
.diff-view {
  max-height: 100%; /* Prevent overflowing */
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
