<script setup lang="ts">
import {computed} from 'vue';
import * as Diff2Html from 'diff2html';
import {createPatch} from "diff";
import {ColorSchemeType} from "diff2html/lib/types";

const props = defineProps<{
  candidate1: string;
  candidate2: string;
}>();

const diffHtml = computed(() => {
  const diff = createPatch('translation', props.candidate1, props.candidate2);
  return Diff2Html.html(diff, {
    outputFormat: 'line-by-line',
    drawFileList: false,
    matching: 'words',
    colorScheme: ColorSchemeType.DARK
  });
})
</script>

<template>
  <div>
    <div class="diff-viewer" ref="diffContainer" v-html="diffHtml"></div>
  </div>
</template>

<style scoped>
.diff-viewer {
  font-family: monospace;
  white-space: pre-wrap;
  word-wrap: break-word;

  all: unset; /* Clear inherited weird styles if any */
}
</style>
