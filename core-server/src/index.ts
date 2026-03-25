import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import { staticPlugin } from '@elysiajs/static'
import { authRoutes } from './routes/auth';
import { settingsRoutes } from './routes/settings';
import { serversRoutes } from './routes/servers';
import { startSelfMonitoring, checkRemoteAlerts } from './services/monitoring';
import db from './db';
import { join } from 'path';

const isAgent = process.env.IS_AGENT === 'true';

const app = new Elysia()
  .use(cors())
  .use(jwt({ name: 'jwt', secret: process.env.JWT_SECRET || 'secret-shhh' }))

if (!isAgent) {
  // 🪐 ROTAS DO MASTER (Front-end, Autenticação e API de Gestão)
  app
    .get('/assets/*', ({ params }) => Bun.file(`/app/webapp/dist/assets/${(params as any)['*']}`))
    .get('/favicon.svg', () => Bun.file('/app/webapp/dist/favicon.svg'))
    .get('/icons.svg', () => Bun.file('/app/webapp/dist/icons.svg'))
    .use(authRoutes)
    .get('*', ({ request }) => {
        const url = new URL(request.url);
        if (url.pathname.startsWith('/api') || url.pathname === '/ws') return;
        return Bun.file('/app/webapp/dist/index.html');
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
    );
}

// 🛰️ ROTAS COMUNS (WebSocket de Telemetria carregado em ambos!)
app.ws('/ws', {
    async open(ws: any) {
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
    },
    // 🛰️ Escuta mensagens de agentes remotos e avalia alertas
    message(_ws: any, rawMsg: any) {
      if (isAgent) return; // Agentes não processam alertas remotos
      try {
        const msg = typeof rawMsg === 'string' ? JSON.parse(rawMsg) : rawMsg;
        if (msg?.event === 'metrics-live' && msg?.data) {
          const { cpu, memory, disk } = msg.data;
          const hostUrl = msg?.host_url;
          if (!hostUrl) return;
          // Encontra o servidor remoto pelo host_url
          const srv = db.query('SELECT * FROM remote_servers WHERE host_url = ?').get(hostUrl) as any;
          if (srv) {
            checkRemoteAlerts(srv.id, cpu?.current || 0, memory?.percent || 0, disk?.percent || 0);
          }
        }
      } catch(e) {}
    }
  })
  
  .listen(process.env.PORT || 3000);

console.log(`🦊 Perfomantia Server is running at ${app.server?.hostname}:${app.server?.port}`);

startSelfMonitoring(app);