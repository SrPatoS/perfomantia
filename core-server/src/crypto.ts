import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = (process.env.JWT_SECRET || 'perfomantia_dashboard_secret_key_32_bytes_long_fallback!').substring(0, 32).padEnd(32, '0');

export function encrypt(text: string) {
   if (!text) return '';
   const iv = crypto.randomBytes(16);
   const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
   let encrypted = cipher.update(text);
   encrypted = Buffer.concat([encrypted, cipher.final()]);
   return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string) {
   if (!text) return '';
   try {
      const textParts = text.split(':');
      if (textParts.length < 2) return text; // fallback if not encrypted yet!
      const iv = Buffer.from(textParts.shift()!, 'hex');
      const encryptedText = Buffer.from(textParts.join(':'), 'hex');
      const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString();
   } catch (e) {
      return text; // Fallback if decryption fails (e.g. was plain text before modification!)
   }
}
