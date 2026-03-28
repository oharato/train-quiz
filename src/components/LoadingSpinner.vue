<template>
  <div class="flex items-center justify-center py-8">
    <div
      class="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"
    />
    <span v-if="message" class="ml-3 text-gray-600">{{ message }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ message?: string }>();
</script>
