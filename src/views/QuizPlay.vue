<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppButton from '../components/AppButton.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import type { Train } from '../store/trains';
import { useQuizStore } from '../store/quiz';

const router = useRouter();
const quizStore = useQuizStore();

const elapsedTime = ref(0);
let timer: ReturnType<typeof setInterval>;

const selectedIndex = ref(0);
const imageLoaded = ref(false);
const imageError = ref(false);

const resetImageState = () => {
  imageLoaded.value = false;
  imageError.value = false;
};

watch(
  () => quizStore.currentQuestionIndex,
  () => {
    selectedIndex.value = 0;
    resetImageState();
  },
);

onMounted(() => {
  if (quizStore.questions.length === 0) {
    router.push('/quiz');
    return;
  }
  quizStore.startQuiz();
  timer = setInterval(() => {
    elapsedTime.value = Math.floor((Date.now() - quizStore.startTime) / 1000);
  }, 1000);
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  clearInterval(timer);
  window.removeEventListener('keydown', handleKeydown);
});

watch(
  () => quizStore.endTime,
  (val) => {
    if (val > 0) {
      clearInterval(timer);
      router.push('/quiz/result');
    }
  },
);

const handleKeydown = (e: KeyboardEvent) => {
  if (!quizStore.currentQuestion || !imageLoaded.value) return;
  const len = quizStore.currentQuestion.options.length;
  const isMobile = window.innerWidth < 768;

  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault();
      selectedIndex.value = isMobile
        ? Math.max(0, selectedIndex.value - 1)
        : selectedIndex.value <= 1
          ? selectedIndex.value
          : selectedIndex.value - 2;
      break;
    case 'ArrowDown':
      e.preventDefault();
      selectedIndex.value = isMobile
        ? Math.min(len - 1, selectedIndex.value + 1)
        : selectedIndex.value >= len - 2
          ? selectedIndex.value
          : selectedIndex.value + 2;
      break;
    case 'ArrowLeft':
      e.preventDefault();
      if (!isMobile && selectedIndex.value % 2 === 1) selectedIndex.value--;
      break;
    case 'ArrowRight':
      e.preventDefault();
      if (!isMobile && selectedIndex.value % 2 === 0 && selectedIndex.value < len - 1)
        selectedIndex.value++;
      break;
    case 'Enter': {
      e.preventDefault();
      const opt = quizStore.currentQuestion.options[selectedIndex.value];
      if (opt) handleAnswer(opt);
      break;
    }
  }
};

const handleAnswer = (option: Train) => {
  if (!imageLoaded.value) return;
  quizStore.answerQuestion(option.id);
};
</script>

<template>
  <div class="container mx-auto p-4 max-w-3xl">
    <div v-if="quizStore.currentQuestion">
      <div class="flex justify-between items-center mb-6">
        <div class="text-xl font-bold">
          問題 {{ quizStore.currentQuestionIndex + 1 }} / {{ quizStore.questions.length }}
        </div>
        <div class="text-xl font-bold">{{ elapsedTime }}秒</div>
      </div>

      <div
        class="relative text-center p-4 border-2 border-gray-300 rounded-lg shadow-lg bg-gray-100 min-h-[240px] flex items-center justify-center"
      >
        <LoadingSpinner v-if="!imageLoaded && !imageError" message="" />
        <div v-if="imageError" class="text-gray-400 text-sm">画像を読み込めませんでした</div>
        <img
          :src="quizStore.currentQuestion.correctAnswer.image_url"
          :alt="'電車の写真'"
          class="max-h-56 max-w-full object-contain rounded"
          :class="{ 'opacity-0 absolute': !imageLoaded && !imageError }"
          loading="eager"
          @load="imageLoaded = true"
          @error="
            imageError = true;
            imageLoaded = true;
          "
        />
      </div>

      <p class="text-center text-sm text-gray-500 mt-2">この電車の名前は？</p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <button
          v-for="(option, index) in quizStore.currentQuestion.options"
          :key="option.id"
          :disabled="!imageLoaded"
          class="p-4 border-2 rounded-lg text-left transition-all focus:outline-none"
          :class="{
            'border-indigo-500 ring-2 ring-indigo-500 bg-indigo-50':
              selectedIndex === index && imageLoaded,
            'border-gray-300 bg-gray-50 hover:bg-gray-100': selectedIndex !== index && imageLoaded,
            'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50': !imageLoaded,
            'max-md:border-gray-300 max-md:ring-0 max-md:bg-gray-50': selectedIndex === index,
          }"
          @click="handleAnswer(option)"
          @mouseenter="selectedIndex = index"
        >
          <span class="text-lg font-medium">{{ option.name }}</span>
          <span v-if="option.nickname" class="block text-sm text-blue-600">「{{ option.nickname }}」</span>
          <span class="block text-sm text-gray-500">{{ option.operator }}</span>
        </button>
      </div>
    </div>

    <div v-else class="text-center py-10">
      <p>クイズデータがありません</p>
      <AppButton variant="primary" class="mt-4" @click="router.push('/quiz')">設定に戻る</AppButton>
    </div>
  </div>
</template>
