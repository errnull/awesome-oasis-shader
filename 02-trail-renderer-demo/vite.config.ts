import reactRefresh from '@vitejs/plugin-react-refresh'
import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh(), glsl()],
  optimizeDeps: {
    exclude:["oasis-engine"]
  }
})
