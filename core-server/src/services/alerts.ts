import nodemailer from 'nodemailer';
import { decrypt } from '../crypto';

export const HOSTNAME = 'Perfomantia-Host';

export async function sendAlertEmail(config: any, cpu: number, mem: number, disk: number = 0) {
   if (!config.smtp_host || !config.email_to) return;
   try {
      const transporter = nodemailer.createTransport({
         host: config.smtp_host,
         port: config.smtp_port || 587,
         secure: Number(config.smtp_port) === 465,
         auth: { user: config.smtp_user, pass: decrypt(config.smtp_pass) }
      });
      await transporter.sendMail({
         from: `"Perfomantia Monitor" <${config.smtp_user}>`,
         to: config.email_to.split(',').map((e: string) => e.trim()).filter(Boolean).join(','),
         subject: `⚠️ [ALERT] High Resource Usage on ${HOSTNAME}`,
         html: `
            <h3>🚨 Performance Alert</h3>
            <p>Your VPS <b>${HOSTNAME}</b> is crossing configured thresholds:</p>
            <ul>
               <li><b>CPU Load:</b> ${cpu}% (Threshold: ${config.cpu_threshold || 80}%)</li>
               <li><b>Memory Usage:</b> ${mem}% (Threshold: ${config.mem_threshold || 85}%)</li>
               <li><b>Disk Space:</b> ${disk}% (Threshold: ${config.disk_threshold || 85}%)</li>
            </ul>
            <br/>
            <p>Please check your dashboard: <a href="http://localhost:5173">Perfomantia</a></p>
         `
      });
      console.log('✅ Alert email sent successfully to', config.email_to);
   } catch (e: any) {
      console.error('❌ Failed to send alert email:', e.message);
   }
}