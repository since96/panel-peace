import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
      "@assets": path.resolve(__dirname, "../attached_assets")
    }
  },
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'wouter', '@tanstack/react-query']
  },
  build: {
    outDir: "../server/public",
    emptyOutDir: true,
    chunkSizeWarningLimit: 800,
    reportCompressedSize: true,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          // Core React dependencies
          'react-core': ['react', 'react-dom'],
          
          // Routing and state management
          'routing': ['wouter'],
          'data-management': ['@tanstack/react-query'],
          
          // UI and utilities
          'ui-utils': ['react-helmet-async'],
          'http-client': ['axios'],
          
          // Split html2canvas into its own chunk since it's large
          'canvas': ['html2canvas'],
          
          // DOMPurify in its own chunk
          'sanitizer': ['dompurify']
        },
        // Optimize chunk names for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Enable source maps for debugging
    sourcemap: true
  },
  // Base URL configuration for production
  base: '/'
}); 