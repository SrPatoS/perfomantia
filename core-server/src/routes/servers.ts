import { Elysia } from 'elysia';
import os from 'os';
import { localHistory } from '../services/monitoring';
import { HOSTNAME } from '../services/alerts';

export const serversRoutes = new Elysia({ prefix: '/servers' })
  .get('/', () => {
     return [{
        id: HOSTNAME,
        name: os.hostname() || 'Local Machine',
        status: 'online',
        history: localHistory
     }];
  });