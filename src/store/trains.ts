import { defineStore } from 'pinia';

export interface Train {
  id: string;
  name: string;
  nickname: string;
  operator: string;
  line: string;
  category: '新幹線' | 'JR在来線' | '私鉄' | '地下鉄';
  image_url: string;
}

export type QuizCategory = 'all' | '新幹線' | 'JR在来線' | '私鉄' | '地下鉄';

export const useTrainsStore = defineStore('trains', {
  state: () => ({
    trains: [] as Train[],
    loading: false,
    error: null as string | null,
  }),
  actions: {
    async fetchTrains(forceReload = false) {
      if (this.trains.length > 0 && !forceReload) return;
      this.loading = true;
      this.error = null;
      try {
        const res = await fetch('/trains.json');
        if (!res.ok) throw new Error('データの取得に失敗しました');
        this.trains = await res.json();
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'データの読み込みに失敗しました';
      } finally {
        this.loading = false;
      }
    },
  },
  getters: {
    byCategory: (state) => (category: QuizCategory) =>
      category === 'all' ? state.trains : state.trains.filter((t) => t.category === category),
  },
});
