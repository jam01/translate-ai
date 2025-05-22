<script setup lang="ts">
import {reactive, ref, watch} from "vue";
import DiffView from "./DiffView.vue";
import SourceViewer from "./SourceViewer.vue";
import type { Segment, SegmentRange, TranslationDocument } from "../types/translationState.ts";
import { SimpleModelConfig, TranslationService } from "../services/translationService.ts";

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
}

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
    "    - If a phrase is common in Spanish of the time but would sound unnatural in English, adapt it thoughtfully while preserving meaning and tone.\n" +
    "    - If a phrase appears intentionally unusual or \"weird\" even in the original context, retain it unless it severely hinders comprehension.\n" +
    "\n" +
    "Your goal is to produce a translation that is both faithful to the original  and readable to contemporary audiences , especially those engaged with radical politics, history, and revolutionary theory.",
    {
      Authorization: "Bearer " + token,
    }
)

const translate = new TranslationService(main, simple)

watch(
    () => workingSegment.text,
    async (newText) => {
      if (newText) {
        // const t1 = "boop" + Math.random();
        // const t2 = "boop" + Math.random();
        // const t1 = 'The Sandinista revolutionary must avoid the simple "revolutionary phrase"; we need to accompany this with a deep identification with revolutionary principles.';
        // const t2 = 'The Sandinista revolutionary must avoid the mere "revolutionary phrase"; we need to accompany this with a deep identification with revolutionary principles.';
        const { candidate1: c1, candidate2: c2 } = await translate.translate(newText);
        candidate1.value = c1;
        candidate2.value = c2;
        editorContent.value = c1;
      }
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
      <!-- Top: Diff View -->
      <div class="diff-view">
        <DiffView :candidate1="candidate1" :candidate2="candidate2" />
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

textarea.translation-editor,
.source-pane,
.diff-view {
  max-height: 100%; /* Prevent overflowing */
}
</style>
