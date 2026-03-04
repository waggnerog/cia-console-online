import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // Vite uses index.html at root as entry point
    publicDir: 'public',
    esbuild: {
      drop: ['console', 'debugger'],
    },
    build: {
      outDir: 'dist',
      minify: 'esbuild',
      sourcemap: false,
      // Warn if single chunk is very large (B64 module data is intentionally large)
      chunkSizeWarningLimit: 4000,
    },
    // Expose only VITE_* prefixed env vars to client
    define: {
      // Safety guard: fail at build time if required vars are missing
      '__SUPABASE_URL_CHECK__': JSON.stringify(
        env.VITE_SUPABASE_URL ||
        '!! MISSING: set VITE_SUPABASE_URL in .env.local !!'
      ),
    },
  };
});
