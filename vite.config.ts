import { defineConfig } from 'vite';

// GitHub Pages는 https://<user>.github.io/fake-work/ 에서 서빙되므로 base 필요.
// 로컬 dev 서버에서는 '/'가 편해서 빌드 시에만 적용한다.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/fake-work/' : '/',
}));
