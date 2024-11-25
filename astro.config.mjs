import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  output: 'server',
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
    includeFiles: ["src",
      'src/components/motion-cursor.js',
      'public'
    ],
  
    functionPerRoute: false,
    maxDuration: 60,
    assets: {
    
      upload: true,
    },
  
    imageService: true,
  
    middleware: true,
  }),
  vite: {
  
    build: {
      rollupOptions: {
        output: {
        
          manualChunks(id) {
            if (id.includes('motion-cursor.js')) {
              return 'cursor';
            }
          }
        }
      }
    },
  
    optimizeDeps: {
      include: ['motion-cursor.js']
    }
  }
});