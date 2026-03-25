import { Client } from 'pg';

// Keep connection open per URI string (multi-db support!)
const clients: { [uri: string]: Client } = {};
const statusCache: { [uri: string]: any } = {};
const isConnecting: { [uri: string]: boolean } = {};

export async function getPostgresStatus(uri: string) {
   if (!uri) return null;
   try {
      if (!clients[uri] && !isConnecting[uri]) {
         isConnecting[uri] = true;
         console.log(`🔌 Connecting to Postgres: ${uri.split('@')[1] || uri}...`);
         const client = new Client({ 
            connectionString: uri, 
            statement_timeout: 3000,
            ssl: uri.includes('localhost') || uri.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
         });
         await client.connect();
         clients[uri] = client;
         isConnecting[uri] = false;
         console.log('✅ Connected to Postgres!');
      }

      if (!clients[uri]) return statusCache[uri] || null;

      const client = clients[uri];

      // 1. Active & Total Connections
      const activeRes = await client.query("SELECT count(*) as active FROM pg_stat_activity WHERE state = 'active'");
      const availableRes = await client.query("SELECT sum(numbackends) as total FROM pg_stat_database");

      // 2. Workload / Reads (Ops proxies)
      const opsRes = await client.query("SELECT sum(shared_blks_hit) as hits, sum(shared_blks_read) as reads FROM pg_statio_user_tables");
      
      // 3. Database Size
      const sizeRes = await client.query("SELECT sum(pg_database_size(datname)) as dbsize FROM pg_stat_database");

      const active = parseInt(activeRes.rows[0]?.active || '0');
      const total = parseInt(availableRes.rows[0]?.total || '10');
      const hits = parseInt(opsRes.rows[0]?.hits || '0');
      const size = parseInt(sizeRes.rows[0]?.dbsize || '0');

      statusCache[uri] = {
         connections: { current: active, available: 100 - active, active },
         ops: { query: hits, insert: 0, update: 0, delete: 0 },
         mem: { resident: Math.round(size / (1024 ** 2)), virtual: 0 }, // using size as resident proxy
         network: { bytesIn: 0, bytesOut: 0 }
      };
      
      return statusCache[uri];
   } catch (e: any) {
      console.error('❌ Postgres Status Error:', e.message);
      if (clients[uri]) {
         try { await clients[uri].end(); } catch {}
         delete clients[uri];
      }
      isConnecting[uri] = false;
      return statusCache[uri] || null;
   }
}
