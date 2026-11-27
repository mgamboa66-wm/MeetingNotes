import { join } from 'node:path'

const page = Bun.file(join(import.meta.dir, '../dev-ui/index.html'))

export function startTestUi() {
  return Bun.serve({
    hostname: '127.0.0.1',
    port: 5173,
    fetch(request) {
      const path = new URL(request.url).pathname
      if (request.method !== 'GET' || (path !== '/' && path !== '/index.html')) {
        return new Response('Not found', { status: 404 })
      }
      return new Response(page, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      })
    },
  })
}
