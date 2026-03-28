import { defineConfig } from 'vite-plus';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: '/train-quiz/',
  plugins: [vue()],
  lint: {
    options: { typeAware: true, typeCheck: true },
  },
  fmt: {
    singleQuote: true,
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
  },
  css: {
    postcss: {
      plugins: [
        // @ts-ignore
        (await import('@tailwindcss/postcss')).default,
      ],
    },
  },
});
