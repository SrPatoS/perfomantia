import si from 'systeminformation';
import os from 'os';

const SERVER_URL = process.env.SERVER_URL || 'ws://localhost:3000/ws';
const VPS_ID = process.env.VPS_ID || os.hostname() || 'localhost-vps';

console.log(`📡 Inicializando Bun Agent para VPS: [${VPS_ID}]`);
console.log(`🔗 Conectando ao WebSocker nativo no : ${SERVER_URL}?type=agent&vpsId=${VPS_ID}`);

let socket = new WebSocket(`${SERVER_URL}?type=agent&vpsId=${VPS_ID}`);

socket.onopen = () => {
  console.log('✅ Conectado ao Servidor Central via WebSocket Nativo Bun!');
  startMonitoring();
};

socket.onclose = () => {
  console.log('❌ Desconectado do Servidor Central. Tentando reconectar...');
  // Logic to reconnect could be here
};

socket.onerror = (e) => {
  console.error('❌ Erro WS', e);
};

let monitoringInterval: ReturnType<typeof setInterval>;

function startMonitoring() {
  if (monitoringInterval) clearInterval(monitoringInterval);
  
  monitoringInterval = setInterval(async () => {
    if (socket.readyState !== WebSocket.OPEN) return;
    
    try {
      // Coleta dados em paralelo
      const [cpuLoad, mem, fs, netData] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.fsSize(),
        si.networkStats()
      ]);

      const data = {
        cpu: {
          current: Math.round(cpuLoad.currentLoad),
          cores: cpuLoad.cpus.map(c => Math.round(c.load))
        },
        memory: {
          total: mem.total,
          used: mem.used,
          percent: Math.round((mem.used / mem.total) * 100)
        },
        disk: {
          total: fs[0]?.size || 0,
          used: fs[0]?.used || 0,
          percent: fs[0] ? Math.round(fs[0].use) : 0,
        },
        network: {
          rx: netData[0]?.rx_sec || 0, // Download
          tx: netData[0]?.tx_sec || 0  // Upload
        },
        uptime: si.time().uptime
      };

      console.log(`📤 Enviando Métricas para [${VPS_ID}] -> CPU: ${data.cpu.current}% | RAM: ${data.memory.percent}%`);
      
      socket.send(JSON.stringify({
         event: 'metrics-push',
         payload: { vpsId: VPS_ID, data: data }
      }));

    } catch (error: any) {
      console.error('❌ Erro ao coletar métricas:', error.message);
    }
  }, 2000); // Envia de 2 em 2 segundos
}