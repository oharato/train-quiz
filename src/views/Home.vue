<script setup lang="ts">
import AppButton from '../components/AppButton.vue';
</script>

<template>
  <div class="container mx-auto p-4 text-center max-w-lg">
    <h1 class="text-4xl font-bold my-8">🚃 電車クイズ</h1>
    <p class="text-gray-600 mb-8">電車の写真を見て、4択で車両名を当てよう！</p>
    <div class="space-y-4">
      <router-link to="/study" class="block w-full max-w-sm mx-auto">
        <AppButton variant="success" full-width size="lg">電車を学習する</AppButton>
      </router-link>
      <router-link to="/quiz" class="block w-full max-w-sm mx-auto">
        <AppButton variant="primary" full-width size="lg">クイズをはじめる</AppButton>
      </router-link>
    </div>
  </div>
</template>
