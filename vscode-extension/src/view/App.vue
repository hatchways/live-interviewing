<template>
  <div class="flex items-center flex-col w-3/4 mx-auto">
    <hr class="border-white w-full mt-4 mb-8">

    <div class="flex gap-4">
      <input v-model="name" placeholder="Your Name" />

      <button
      class="w-1/2"
      @click="submitName"
    >
      Submit
    </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Button from './components/Button.vue'

const name = ref('')

const submitName = () => {
	vscode.postMessage({
		command: 'openFileExample',
		text: name.value
	})
}

// Example of handling messages sent from the extension to the webview
// window.addEventListener('message', (event) => {
// 	const message = event.data // The JSON data our extension sent

// 	switch (message.command) {
// 	case 'setCurrentFileExample':
// 		lastFile.value = currentFile.value
// 		currentFile.value = message.text
// 		return
// 	}
// })


</script>
