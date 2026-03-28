<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppButton from '../components/AppButton.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import type { QuizCategory } from '../store/trains';
import { useTrainsStore } from '../store/trains';
import { useQuizStore } from '../store/quiz';

const router = useRouter();
const trainsStore = useTrainsStore();
const quizStore = useQuizStore();

const category = ref<QuizCategory>(quizStore.category);
const numberOfQuestions = ref(quizStore.numberOfQuestions);

const categories: { value: QuizCategory; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: '新幹線', label: '新幹線' },
  { value: 'JR在来線', label: 'JR在来線' },
  { value: '私鉄', label: '私鉄' },
  { value: '地下鉄', label: '地下鉄' },
];

onMounted(() => trainsStore.fetchTrains());

const availableCount = () => trainsStore.byCategory(category.value).length;

const startQuiz = () => {
  if (availableCount() < 4) return;
  quizStore.setup(category.value, numberOfQuestions.value);
  router.push('/quiz/play');
};
</script>

<template>
  <div class="container mx-auto p-4 max-w-lg">
    <router-link to="/" class="text-blue-500 hover:underline">← ホームへ</router-link>
    <h2 class="text-3xl font-bold my-6 text-center">クイズ設定</h2>

    <LoadingSpinner v-if="trainsStore.loading" message="データ読み込み中..." />

    <div
      v-else-if="trainsStore.error"
      class="p-4 bg-red-50 border border-red-300 rounded text-red-700"
    >
      {{ trainsStore.error }}
      <button class="ml-2 underline" @click="trainsStore.fetchTrains(true)">再試行</button>
    </div>

    <form v-else class="space-y-6" @submit.prevent="startQuiz">
      <div>
        <label class="block text-lg font-medium text-gray-700 mb-2">カテゴリ</label>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <label
            v-for="cat in categories"
            :key="cat.value"
            class="flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors"
            :class="
              category === cat.value
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            "
          >
            <input v-model="category" type="radio" :value="cat.value" class="sr-only" />
            <span class="font-medium">{{ cat.label }}</span>
          </label>
        </div>
        <p class="mt-1 text-sm text-gray-500">対象: {{ availableCount() }} 車両</p>
      </div>

      <div>
        <label for="numQ" class="block text-lg font-medium text-gray-700 mb-2">問題数</label>
        <select
          id="numQ"
          v-model.number="numberOfQuestions"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option :value="5">5問</option>
          <option :value="10">10問</option>
          <option :value="20">20問</option>
          <option :value="999">全問</option>
        </select>
      </div>

      <AppButton
        type="submit"
        variant="secondary"
        size="lg"
        full-width
        :disabled="availableCount() < 4"
      >
        {{ availableCount() < 4 ? 'このカテゴリは車両が少なすぎます' : 'クイズスタート！' }}
      </AppButton>
    </form>
  </div>
</template>
