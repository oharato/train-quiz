import { defineStore } from 'pinia';
import type { Train, QuizCategory } from './trains';
import { useTrainsStore } from './trains';

export interface Question {
  correctAnswer: Train;
  options: Train[];
}

export interface AnswerRecord {
  question: Question;
  selectedId: string;
  isCorrect: boolean;
}

export const useQuizStore = defineStore('quiz', {
  state: () => ({
    category: 'all' as QuizCategory,
    numberOfQuestions: 10,
    questions: [] as Question[],
    currentQuestionIndex: 0,
    correctAnswers: 0,
    startTime: 0,
    endTime: 0,
    answerHistory: [] as AnswerRecord[],
  }),
  actions: {
    generateQuestions() {
      const trainsStore = useTrainsStore();
      const pool = trainsStore.byCategory(this.category);
      if (pool.length < 4) return;

      const count =
        this.numberOfQuestions >= 999 ? pool.length : Math.min(this.numberOfQuestions, pool.length);
      const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
      const selected = shuffledPool.slice(0, count);

      this.questions = selected.map((correct) => {
        const others = pool
          .filter((t) => t.id !== correct.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        const options = [...others, correct].sort(() => Math.random() - 0.5);
        return { correctAnswer: correct, options };
      });
    },
    setup(category: QuizCategory, numQuestions: number) {
      this.category = category;
      this.numberOfQuestions = numQuestions;
      this.generateQuestions();
      this.answerHistory = [];
    },
    startQuiz() {
      this.correctAnswers = 0;
      this.currentQuestionIndex = 0;
      this.startTime = Date.now();
      this.endTime = 0;
    },
    answerQuestion(selectedId: string) {
      const q = this.questions[this.currentQuestionIndex];
      if (!q) return;
      const isCorrect = selectedId === q.correctAnswer.id;
      this.answerHistory.push({ question: q, selectedId, isCorrect });
      if (isCorrect) this.correctAnswers++;
      if (this.currentQuestionIndex < this.questions.length - 1) {
        this.currentQuestionIndex++;
      } else {
        this.endTime = Date.now();
      }
    },
  },
  getters: {
    currentQuestion: (state): Question | null =>
      state.questions[state.currentQuestionIndex] ?? null,
    totalTime: (state) =>
      state.startTime && state.endTime ? (state.endTime - state.startTime) / 1000 : 0,
    finalScore: (state) => {
      if (!state.startTime || !state.endTime) return 0;
      const secs = (state.endTime - state.startTime) / 1000;
      return Math.max(0, state.correctAnswers * 1000 - Math.round(secs) * 10);
    },
  },
});
