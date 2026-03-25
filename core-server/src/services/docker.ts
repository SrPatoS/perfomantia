import { exec } from 'child_process';

export const getDockerSizes = () => new Promise<Record<string, any>>((resolve) => {
   exec('docker ps -a -s --format "{{.ID}}={{.Size}}"', (err, stdout) => {
      if(err) return resolve({});
      const map: Record<string, any> = {};
      stdout.split('\n').filter(Boolean).forEach(line => {
         const [id, sizeStr] = line.split('=');
         if(id && sizeStr) {
            const match = sizeStr.match(/(.+?)\s*\(virtual\s*(.+?)\)/);
            if(match) map[id] = { rw: match[1].trim(), root: match[2].trim() };
            else map[id] = { rw: sizeStr.trim(), root: '' };
         }
      });
      resolve(map);
   });
});

export const getDockerStats = () => new Promise<Record<string, any>>((resolve) => {
   const query = 'docker stats --no-stream --format "{{.ID}}={{.CPUPerc}}={{.MemPerc}}={{.MemUsage}}={{.NetIO}}={{.BlockIO}}={{.PIDs}}"';
   exec(query, (err, stdout) => {
      if(err) return resolve({});
      const map: Record<string, any> = {};
      stdout.split('\n').filter(Boolean).forEach(line => {
         const parts = line.split('=');
         if(parts.length >= 7) {
            const [id, cpu, memPercent, memUsage, netIO, blockIO, pids] = parts;
            const [netRX, netWX] = netIO.split('/').map(s => s.trim());
            const [blockR, blockW] = blockIO.split('/').map(s => s.trim());
            map[id] = { 
               cpu: parseFloat(cpu.replace('%', '')) || 0, 
               mem: parseFloat(memPercent.replace('%', '')) || 0, 
               memUsageStr: memUsage, 
               netRX: netRX || '0B', 
               netWX: netWX || '0B', 
               blockR: blockR || '0B', 
               blockW: blockW || '0B', 
               pids: parseInt(pids) || 0 
            };
         }
      });
      resolve(map);
   });
});

export const getDockerVolumes = () => new Promise<any[]>((resolve) => {
   exec('docker system df -v --format "{{json .Volumes}}"', (err, stdout) => {
      if(err || !stdout.trim()) return resolve([]);
      try {
         const json = JSON.parse(stdout);
         resolve(Array.isArray(json) ? json : []);
      } catch(e) { resolve([]); }
   });
});