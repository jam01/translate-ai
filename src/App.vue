<script setup lang="ts">
import TextViewer from './components/TextViewer.vue'

// Mock File for demonstration purposes
const mockFileContent = `This is the first paragraph. It provides some example text to demonstrate the highlighting functionality.
 
This is the second paragraph. It should load after the first one is processed by the TextViewer component.`

// Convert the mock string into a File object (browser-compatible demo)
const mockFile = new File([mockFileContent], "mockFile.txt", { type: "text/plain" })
</script>

<template>
  <div id="app">
    <header>
      <h1>TextViewer Demo</h1>
    </header>
<!--    <main>-->
      <TextViewer :file="mockFile" />
<!--    </main>-->
  </div>
</template>

<style scoped>
#app {
  font-family: Arial, sans-serif;
  text-align: center;
  margin: 2rem;
}

header {
  margin-bottom: 1rem;
}

h1 {
  font-size: 2rem;
  color: #333;
}

main {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
</style>
