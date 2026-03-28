import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/study', name: 'Study', component: () => import('../views/Study.vue') },
  { path: '/quiz', name: 'QuizSetup', component: () => import('../views/QuizSetup.vue') },
  { path: '/quiz/play', name: 'QuizPlay', component: () => import('../views/QuizPlay.vue') },
  { path: '/quiz/result', name: 'QuizResult', component: () => import('../views/QuizResult.vue') },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
