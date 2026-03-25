import { Elysia, t } from 'elysia';
import db from '../db';

export const authRoutes = new Elysia({ prefix: '/api/auth' })
  .post('/login', async ({ body, jwt, set }) => {
    const { username, password } = body as Record<string, string>;
    const user = db.query('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!user) { set.status = 401; return { error: 'Invalid credentials' }; }
    
    const isValid = await Bun.password.verify(password, user.password_hash);
    if (!isValid) { set.status = 401; return { error: 'Invalid credentials' }; }
    
    const token = await jwt.sign({ id: user.id, username });
    return { token, user: { username } };
  }, { body: t.Object({ username: t.String(), password: t.String() }) });