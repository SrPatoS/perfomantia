import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import { staticPlugin } from '@elysiajs/static'
import { authRoutes } from './routes/auth';
import { settingsRoutes } from './routes/settings';
import { serversRoutes } from './routes/servers';
import { startSelfMonitoring } from './services/monitoring';
import { join } from 'path';

const app = new Elysia()
  .use(cors())
  .use(jwt({ name: 'jwt', secret: process.env.JWT_SECRET || 'secret-shhh' }))
  
  // 🛰️ Servir Arquivos Estáticos Manualmente para Evitar Bugs no Docker
  .get('/assets/*', ({ params }) => Bun.file(`/app/webapp/dist/assets/${(params as any)['*']}`))
  .get('/favicon.svg', () => Bun.file('/app/webapp/dist/favicon.svg'))
  .get('/icons.svg', () => Bun.file('/app/webapp/dist/icons.svg'))

  .use(authRoutes)
  
  // 🛰️ SPA Fallback para React (Garante que se não for asset ou api, devolve index.html)
  .get('*', ({ request }) => {
      const url = new URL(request.url);
      if (url.pathname.startsWith('/api') || url.pathname === '/ws') return;
      
      const file = Bun.file('/app/webapp/dist/index.html');
      return file;
  })
  
  .ws('/ws', {
    async open(ws) {
      const type = (ws.data.query as any)?.type;
      const token = (ws.data.query as any)?.token; 
      if (type === 'dashboard') {
        if (!token) { ws.close(); return; }
        
        const isUser = await (ws.data as any).jwt.verify(token);
        const agentKey = process.env.AGENT_API_KEY || 'secret-agent-key';
        
        if (isUser || token === agentKey) {
          ws.subscribe('dashboards');
        } else {
          ws.close();
        }
      }
    }
  })
  
  .group('/api', app => app
    .onBeforeHandle(async ({ jwt, headers, set }) => {
      const auth = headers.authorization;
      if (!auth || !auth.startsWith('Bearer ')) { set.status = 401; return { error: 'Unauthorized' }; }
      const token = auth.replace('Bearer ', '');
      const claims = await jwt.verify(token);
      if (!claims) { set.status = 401; return { error: 'Unauthorized' }; }
    })
    .use(serversRoutes)
    .use(settingsRoutes)
  )
  .listen(process.env.PORT || 3000);

console.log(`🦊 Perfomantia Server is running at ${app.server?.hostname}:${app.server?.port}`);

startSelfMonitoring(app);