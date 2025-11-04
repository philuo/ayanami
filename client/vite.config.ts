import path from 'node:path';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import AutoImport from 'unplugin-auto-import/vite';

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  },
  plugins: [
    solid(),
    AutoImport({
      imports: [
        'solid-js',
        {
          from: 'solid-js',
          imports: ['JSX', 'Accessor', 'Setter', 'Component'],
          type: true
        },
        {
          from: 'solid-transition-group',
          imports: ['Transition', 'TransitionGroup']
        },
        {
          'solid-js': [
            'getOwner',
            'runWithOwner'
          ],
          'solid-js/web': ['insert'],
          '@solid-primitives/mouse': [
            'createMousePosition',
            'createPositionToElement',
            'useMousePosition',
            'getPositionToElement',
            'getPositionInElement',
            'getPositionToScreen',
            'makeMousePositionListener',
            'makeMouseInsideListener'
          ],
          '@solid-primitives/event-listener': [
            'makeEventListener',
            'makeEventListenerStack',
            'createEventListener',
            'createEventSignal',
            'createEventListenerMap',
            'preventDefault',
            'stopPropagation',
            'stopImmediatePropagation',
            'WindowEventListener',
            'DocumentEventListener',
          ]
        }
      ],
      dirs: [
        './src/directives/index.ts',
        './src/utils/index.ts',
        './src/components/**/index.tsx'
      ],
      dts: './types/auto-imports.d.ts'
    })
  ],
  css: {
    transformer: 'lightningcss' as const,
    lightningcss: {
      cssModules: {
        pattern: '[local]_[hash]'
      }
    },
    preprocessorOptions: {
      scss: {
        additionalData: '@use "@/assets/styles/function.scss" as *;'
      }
    }
  },
  build: {
    target: 'es2015',
    cssTarget: 'chrome80',
    minify: true,
    sourcemap: false,
    cssMinify: 'lightningcss' as const,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 2000
  },
  server: {
    host: true,
    port: 8001,
    https: {
      key: readFileSync(path.resolve(__dirname, 'certs', 'localhost.key')),
      cert: readFileSync(path.resolve(__dirname, 'certs', 'localhost.pem'))
    },
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      // "Cross-Origin-Resource-Policy": "cross-origin"
    },
    proxy: {
      '/api': {
        changeOrigin: true,
        target: 'http://10.160.11.178:8081',
        rewrite: url => url.replace(/^\/api/, '')
      },
      '/ws': {
        target: 'ws://10.160.11.203:8095',
        ws: true,               // 开启 websocket 代理
        changeOrigin: true,
        secure: false,
        timeout: 30000,         // 30秒超时
        headers: {
          'Connection': 'Upgrade',
          'Upgrade': 'websocket'
        },
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('WebSocket proxy error:', err.message);
          });
          proxy.on('proxyReqWs', (proxyReq, req, socket) => {
            console.log('WebSocket proxy request:', req.url);
          });
          proxy.on('close', (res, socket, head) => {
            console.log('WebSocket proxy connection closed');
          });
        }
      }
    }
  }
});
