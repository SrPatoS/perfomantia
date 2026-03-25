import si from 'systeminformation';
import db from '../db';
import { getDockerSizes, getDockerStats, getDockerVolumes } from './docker';
import { getMongoStatus } from '../mongo';
import { getPostgresStatus } from '../postgres';
import { decrypt } from '../crypto';
import { sendAlertEmail, HOSTNAME } from './alerts';

export const localHistory: any[] = [];
let lastAlertSent = 0;

export async function startSelfMonitoring(appInstance: any) {
  const cpuInfo = await si.cpu();
  const baseMem = await si.mem();
  const totalMemGB = (baseMem.total / (1024 ** 3)).toFixed(1);

  setInterval(async () => {
    try {
      const [cpuLoad, mem, fs, netData, procs, dockerRaw, sizeMap, dockerVolumesRaw, statsMap] = await Promise.all([
        si.currentLoad(), si.mem(), si.fsSize(), si.networkStats(), si.processes(), si.dockerContainers(true).catch(() => []), getDockerSizes(), getDockerVolumes(), getDockerStats()
      ]);

      const topProcesses = procs.list
         .sort((a: any, b: any) => b.cpu - a.cpu)
         .slice(0, 50)
         .map((p: any) => ({ name: p.name, cpu: p.cpu, mem: p.mem, pid: p.pid, user: p.user || 'system' }));

      const numCores = require('os').cpus().length;
      const dockerContainers = (Array.isArray(dockerRaw) ? dockerRaw : []).map((c: any) => {
         const stat = (statsMap as any)[String(c.id).substring(0,12)] || {};
         return {
            id: String(c.id).substring(0, 12),
            name: c.name,
            image: c.image,
            state: c.state,
            cpu: stat.cpu || 0,
            cpuNormalized: (stat.cpu || 0) / numCores,
            mem: stat.mem || 0,
            memUsageStr: stat.memUsageStr || '0B / 0B',
            netRX: stat.netRX || '0B',
            netWX: stat.netWX || '0B',
            blockR: stat.blockR || '0B',
            blockW: stat.blockW || '0B',
            sizeRw: sizeMap[String(c.id).substring(0,12)]?.rw || '0B',
            sizeRootFs: sizeMap[String(c.id).substring(0,12)]?.root || '0B',
            pids: stat.pids || 0,
            ports: c.ports ? (typeof c.ports === 'string' ? c.ports : JSON.stringify(c.ports)) : ''
         };
      });

      const volumes = dockerVolumesRaw.map((v: any) => ({
         name: v.Name,
         driver: v.Driver,
         size: v.Size,
         links: v.Links || 0
      }));

      const config = db.query('SELECT * FROM alert_settings WHERE id = 1').get() as any;
      const dbs = db.query('SELECT * FROM server_databases WHERE enabled = 1').all() as any[];
      const databasesStatus = await Promise.all(dbs.map(async d => {
         let metrics = null;
         const secureUri = decrypt(d.uri);
         if (d.type === 'mongo') metrics = await getMongoStatus(secureUri).catch(() => null);
         if (d.type === 'postgres') metrics = await getPostgresStatus(secureUri).catch(() => null);
         return { id: d.id, name: d.name, type: d.type, metrics };
      }));

      const data = {
        hardware: {
           cpuName: `${cpuInfo.manufacturer} ${cpuInfo.brand}`,
           cores: cpuInfo.physicalCores,
           totalMemGB,
           disks: fs.filter(f => f.size > 0).map(f => ({ mount: f.mount, use: Math.round(f.use), sizeGB: (f.size / (1024 ** 3)).toFixed(1) }))
        },
        cpu: { current: Math.round(cpuLoad.currentLoad), cores: cpuLoad.cpus.map((c: any) => Math.round(c.load)) },
        memory: { total: mem.total, used: mem.used, percent: Math.round((mem.used / mem.total) * 100) },
        disk: { total: fs[0]?.size || 0, used: fs[0]?.used || 0, percent: fs[0] ? Math.round(fs[0].use) : 0 },
        network: { rx: netData[0]?.rx_sec || 0, tx: netData[0]?.tx_sec || 0 },
        processes: topProcesses,
        docker: dockerContainers,
        dockerVolumes: volumes,
        databases: databasesStatus,
        timestamp: new Date()
      };

      if (config && config.enabled === 1) {
         const currentCpu = Math.round(cpuLoad.currentLoad);
         const currentMem = Math.round((mem.used / mem.total) * 100);
         const currentDisk = fs[0] ? Math.round(fs[0].use) : 0;
         
         if (currentCpu >= (config.cpu_threshold || 80) || currentMem >= (config.mem_threshold || 85) || currentDisk >= (config.disk_threshold || 85)) {
             const now = Date.now();
             const cdMins = config.cooldown_mins || 15;
             if (now - lastAlertSent > cdMins * 60 * 1000) {
                lastAlertSent = now;
                sendAlertEmail(config, currentCpu, currentMem, currentDisk);
             }
         }
      }

      localHistory.push(data);
      if (localHistory.length > 60) localHistory.shift();

      if (appInstance.server) {
        appInstance.server.publish('dashboards', JSON.stringify({ event: 'metrics-live', vpsId: HOSTNAME, data }));
      }
    } catch (error: any) { console.error('❌ Tracking Error:', error.message); }
  }, 2000);
}