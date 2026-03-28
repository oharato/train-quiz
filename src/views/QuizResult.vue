<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppButton from '../components/AppButton.vue';
import { useQuizStore } from '../store/quiz';

const router = useRouter();
const quizStore = useQuizStore();

onMounted(() => {
  if (quizStore.endTime === 0) router.push('/quiz');
});
</script>

<template>
  <div class="container mx-auto p-4 max-w-3xl text-center">
    <h2 class="text-4xl font-bold my-8">🎉 クイズ終了！</h2>

    <div class="space-y-4 bg-white p-8 border-2 border-gray-300 rounded-lg shadow-lg">
      <div class="text-2xl">
        正解数:
        <span class="font-bold text-3xl"
          >{{ quizStore.correctAnswers }} / {{ quizStore.questions.length }}</span
        >
      </div>
      <div class="text-2xl">
        所要時間: <span class="font-bold text-3xl">{{ quizStore.totalTime.toFixed(1) }}</span> 秒
      </div>
      <div class="text-3xl font-bold text-indigo-600">
        スコア: <span class="text-5xl">{{ quizStore.finalScore }}</span> 点
      </div>
    </div>

    <div class="mt-10 text-left">
      <h3 class="text-2xl font-bold mb-4">回答詳細</h3>
      <div class="space-y-4">
        <div
          v-for="(record, index) in quizStore.answerHistory"
          :key="index"
          class="p-4 border rounded-lg shadow-sm"
          :class="record.isCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'"
        >
          <div class="flex items-start gap-4">
            <img
              :src="record.question.correctAnswer.image_url"
              :alt="record.question.correctAnswer.name"
              class="h-20 w-32 object-cover rounded flex-shrink-0"
            />
            <div class="text-left">
              <p class="font-bold text-lg mb-1">問題 {{ index + 1 }}</p>
              <p class="text-sm text-gray-600">
                正解:
                <span class="font-semibold text-gray-900">{{
                  record.question.correctAnswer.name
                }}</span>
                <span class="text-gray-500 ml-1"
                  >({{ record.question.correctAnswer.operator }})</span
                >
              </p>
              <p v-if="!record.isCorrect" class="text-sm mt-1">
                あなたの回答:
                <span class="text-red-700 font-semibold">
                  {{
                    record.question.options.find((o) => o.id === record.selectedId)?.name ?? '不明'
                  }}
                </span>
              </p>
              <p v-else class="text-sm text-green-700 font-semibold mt-1">✓ 正解！</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-10 space-y-4">
      <AppButton
        variant="secondary"
        full-width
        class="max-w-sm mx-auto text-lg"
        @click="router.push('/quiz')"
      >
        もう一度挑戦する
      </AppButton>
      <AppButton
        variant="gray"
        full-width
        class="max-w-sm mx-auto text-lg"
        @click="router.push('/')"
      >
        ホームへ戻る
      </AppButton>
    </div>
  </div>
</template>
