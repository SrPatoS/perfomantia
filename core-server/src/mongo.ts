import { MongoClient } from 'mongodb';

let client: MongoClient | null = null;
let lastStatus: any = null;
let isConnecting = false;

export async function getMongoStatus(uri: string) {
   if (!uri) return null;
   try {
      if (!client && !isConnecting) {
         isConnecting = true;
         console.log('🔌 Connecting to MongoDB...');
         client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
         await client.connect();
         isConnecting = false;
         console.log('✅ Connected to MongoDB!');
      }
      
      if (!client) return lastStatus; // still connecting or failed

      const admin = client.db('admin');
      const status = await admin.command({ serverStatus: 1 });
      
      const connections = status.connections || {};
      const opcounters = status.opcounters || {};
      const mem = status.mem || {};
      const network = status.network || {};
      
      lastStatus = {
         connections: { 
            current: connections.current || 0, 
            available: connections.available || 0, 
            active: connections.active || connections.current || 0 
         },
         ops: { 
            query: opcounters.query || 0, 
            insert: opcounters.insert || 0, 
            update: opcounters.update || 0, 
            delete: opcounters.delete || 0 
         },
         mem: { 
            resident: mem.resident || 0, 
            virtual: mem.virtual || 0 
         },
         network: { 
            bytesIn: network.bytesIn || 0, 
            bytesOut: network.bytesOut || 0 
         }
      };
      return lastStatus;
   } catch (e: any) {
      console.error('❌ Mongo Status Error:', e.message);
      if (client) {
         try { await client.close(); } catch {}
         client = null;
      }
      isConnecting = false;
      return lastStatus; // Backoff caching!
   }
}
