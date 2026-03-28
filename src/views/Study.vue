<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useTrainsStore, type Train, type QuizCategory } from '../store/trains';
import AppButton from '../components/AppButton.vue';

type StudyMode = 'image-to-name' | 'name-to-image';

const store = useTrainsStore();

const mode = ref<StudyMode>('image-to-name');
const selectedCategory = ref<QuizCategory>('all');
const currentIndex = ref(0);
const isFlipped = ref(false);

const categories: QuizCategory[] = ['all', '新幹線', 'JR在来線', '私鉄', '地下鉄'];
const categoryLabels: Record<QuizCategory, string> = {
  all: 'すべて',
  新幹線: '新幹線',
  JR在来線: 'JR在来線',
  私鉄: '私鉄',
  地下鉄: '地下鉄',
};

const filteredTrains = computed<Train[]>(() => store.byCategory(selectedCategory.value));

const currentTrain = computed<Train | null>(
  () => filteredTrains.value[currentIndex.value] ?? null,
);

function selectCategory(cat: QuizCategory) {
  selectedCategory.value = cat;
  currentIndex.value = 0;
  isFlipped.value = false;
}

function selectMode(m: StudyMode) {
  mode.value = m;
  isFlipped.value = false;
}

function jumpTo(index: number) {
  currentIndex.value = index;
  isFlipped.value = false;
}

function prev() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    isFlipped.value = false;
  }
}

function next() {
  if (currentIndex.value < filteredTrains.value.length - 1) {
    currentIndex.value++;
    isFlipped.value = false;
  }
}

function flip() {
  isFlipped.value = !isFlipped.value;
}

function handleKey(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') prev();
  else if (e.key === 'ArrowRight') next();
  else if (e.key === ' ') {
    e.preventDefault();
    flip();
  }
}

onMounted(async () => {
  await store.fetchTrains();
  window.addEventListener('keydown', handleKey);
});
onUnmounted(() => window.removeEventListener('keydown', handleKey));
</script>

<template>
  <div class="container mx-auto p-4 max-w-2xl">
    <!-- ヘッダー -->
    <div class="flex items-center justify-between mb-6">
      <router-link to="/" class="text-blue-600 hover:underline text-sm">← ホームへ</router-link>
      <h1 class="text-2xl font-bold">📖 学習モード</h1>
      <div class="w-16" />
    </div>

    <!-- モード選択 -->
    <div class="flex gap-2 mb-4 justify-center">
      <button
        v-for="m in (['image-to-name', 'name-to-image'] as StudyMode[])"
        :key="m"
        class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
        :class="
          mode === m
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        "
        @click="selectMode(m)"
      >
        {{ m === 'image-to-name' ? '写真 → 名前' : '名前 → 写真' }}
      </button>
    </div>

    <!-- カテゴリフィルタ -->
    <div class="flex flex-wrap gap-2 mb-6 justify-center">
      <button
        v-for="cat in categories"
        :key="cat"
        class="px-3 py-1 rounded-full text-sm transition-colors"
        :class="
          selectedCategory === cat
            ? 'bg-green-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        "
        @click="selectCategory(cat)"
      >
        {{ categoryLabels[cat] }}
      </button>
    </div>

    <!-- ローディング -->
    <div v-if="store.loading" class="text-center py-16 text-gray-500">読み込み中...</div>

    <template v-else-if="currentTrain">
      <!-- カウンター -->
      <p class="text-center text-sm text-gray-500 mb-4">
        {{ currentIndex + 1 }} / {{ filteredTrains.length }}
      </p>

      <!-- フリップカード -->
      <div style="perspective: 1000px" class="mb-4" @click="flip">
        <div
          class="relative w-full transition-transform duration-500 cursor-pointer"
          style="transform-style: preserve-3d; height: 340px"
          :style="{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }"
        >
          <!-- 表面 -->
          <div
            class="absolute inset-0 rounded-2xl overflow-hidden shadow-lg flex flex-col"
            style="backface-visibility: hidden"
            :class="mode === 'image-to-name' ? 'bg-gray-900' : 'bg-white'"
          >
            <template v-if="mode === 'image-to-name'">
              <div class="flex-1 relative">
                <img
                  :src="currentTrain.image_url"
                  :alt="currentTrain.name"
                  class="absolute inset-0 w-full h-full object-contain"
                />
              </div>
              <p class="text-center text-gray-400 text-xs py-2 bg-gray-800/80">
                クリックまたはスペースキーで名前を表示
              </p>
            </template>
            <template v-else>
              <div class="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <p class="text-4xl font-bold text-gray-800 mb-2">{{ currentTrain.name }}</p>
                <p v-if="currentTrain.nickname" class="text-xl text-blue-600 font-medium mb-2">
                  「{{ currentTrain.nickname }}」
                </p>
                <p class="text-gray-500 text-lg">{{ currentTrain.operator }}</p>
              </div>
              <p class="text-center text-gray-400 text-xs py-2 bg-gray-50 border-t">
                クリックまたはスペースキーで写真を表示
              </p>
            </template>
          </div>

          <!-- 裏面 -->
          <div
            class="absolute inset-0 rounded-2xl overflow-hidden shadow-lg flex flex-col"
            style="backface-visibility: hidden; transform: rotateY(180deg)"
            :class="mode === 'name-to-image' ? 'bg-gray-900' : 'bg-blue-50'"
          >
            <template v-if="mode === 'image-to-name'">
              <div class="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <p class="text-4xl font-bold text-gray-800 mb-1">{{ currentTrain.name }}</p>
                <p v-if="currentTrain.nickname" class="text-xl text-blue-600 font-medium mb-2">
                  「{{ currentTrain.nickname }}」
                </p>
                <p class="text-gray-600 mb-1 text-lg">{{ currentTrain.operator }}</p>
                <p class="text-gray-500 text-sm">{{ currentTrain.line }}</p>
                <span
                  class="mt-3 inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                >{{ currentTrain.category }}</span>
              </div>
            </template>
            <template v-else>
              <div class="flex-1 relative">
                <img
                  :src="currentTrain.image_url"
                  :alt="currentTrain.name"
                  class="absolute inset-0 w-full h-full object-contain"
                />
              </div>
              <p class="text-center text-gray-300 text-xs py-2 bg-gray-800/80">
                {{ currentTrain.line }}
              </p>
            </template>
          </div>
        </div>
      </div>

      <!-- ナビゲーションボタン -->
      <div class="flex items-center justify-between mb-6">
        <AppButton variant="secondary" size="sm" :disabled="currentIndex === 0" @click="prev">
          ← 前へ
        </AppButton>
        <button class="text-sm text-blue-600 hover:underline" @click="flip">
          {{ isFlipped ? '表に戻す' : 'めくる' }}
        </button>
        <AppButton
          variant="secondary"
          size="sm"
          :disabled="currentIndex === filteredTrains.length - 1"
          @click="next"
        >
          次へ →
        </AppButton>
      </div>

      <!-- サムネイルグリッド -->
      <div class="grid grid-cols-6 gap-1 sm:grid-cols-8">
        <button
          v-for="(train, i) in filteredTrains"
          :key="train.id"
          class="aspect-square rounded overflow-hidden border-2 transition-all"
          :class="
            i === currentIndex
              ? 'border-blue-500 scale-110 z-10 relative'
              : 'border-transparent hover:border-gray-300 opacity-70 hover:opacity-100'
          "
          :title="train.name"
          @click="jumpTo(i)"
        >
          <img :src="train.image_url" :alt="train.name" class="w-full h-full object-cover" />
        </button>
      </div>

      <!-- キーボードヒント -->
      <p class="text-center text-xs text-gray-400 mt-4">
        ← → キーで移動、スペースキーで表裏切り替え
      </p>
    </template>
  </div>
</template>
