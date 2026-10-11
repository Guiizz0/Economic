import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Em desenvolvimento, serve as funções de /api (as mesmas que rodam na Vercel)
 * direto pelo Vite, assim `npm run dev` funciona sem precisar do `vercel dev`.
 */
function apiDev(): Plugin {
  return {
    name: 'economic-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? ''
        if (!url.startsWith('/api/')) return next()
        const name = url.slice(5).split('?')[0]
        if (!/^[a-z]+$/.test(name)) return next()
        try {
          const mod = await server.ssrLoadModule(`/api/${name}.ts`)
          await mod.default(req, res)
        } catch (e) {
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: String(e) }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), apiDev()],
  build: {
    chunkSizeWarningLimit: 900,
  },
})
