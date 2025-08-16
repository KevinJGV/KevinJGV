import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
    includeFiles: ["src",
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
          // Configuraciones de chunks si es necesario
        }
      }
    }
  }
});