import { Elysia } from 'elysia';
import db from '../db';
import { encrypt } from '../crypto';

export const settingsRoutes = new Elysia({ prefix: '/settings' })
  .get('/alerts', () => {
     return db.query('SELECT * FROM alert_settings WHERE id = 1').get() || {};
  })
  .get('/databases', () => {
     return db.query('SELECT * FROM server_databases').all();
  })
  .post('/databases', ({ body }) => {
     const b = body as any;
     const secureUri = encrypt(b.uri);
     db.query('INSERT INTO server_databases (name, type, uri) VALUES (?, ?, ?)').run(b.name, b.type, secureUri);
     return { success: true };
  })
  .delete('/databases/:id', ({ params }) => {
     db.query('DELETE FROM server_databases WHERE id = ?').run(params.id);
     return { success: true };
  })
  .post('/alerts', ({ body }) => {
     const b = body as any;
     const securePass = encrypt(b.smtp_pass || '');
     db.query(`
        UPDATE alert_settings 
        SET smtp_host = ?, smtp_port = ?, smtp_user = ?, smtp_pass = ?, email_to = ?, 
            cpu_threshold = ?, mem_threshold = ?, disk_threshold = ?, enabled = ?, cooldown_mins = ?,
            mongo_uri = ?
        WHERE id = 1
     `).run(b.smtp_host, b.smtp_port, b.smtp_user, securePass, b.email_to, b.cpu_threshold, b.mem_threshold, b.disk_threshold || 85, b.enabled ? 1 : 0, b.cooldown_mins || 15, b.mongo_uri || null);
     return { success: true };
  });