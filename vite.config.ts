import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Using '.' instead of process.cwd() to avoid TS issues with the Process type in some environments
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // This ensures process.env.API_KEY is replaced by the actual string during build
      // We default to empty string to prevent "process is not defined" or "undefined" errors
      'process.env.API_KEY': JSON.stringify(env.API_KEY || "")
    }
  }
})