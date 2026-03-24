import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "dashboard": "Dashboard",
      "administrator": "Administrator",
      "logout": "Logout",
      "my_dashboard": "My Dashboard",
      "search_metrics": "Search metrics...",
      "cpu_load": "CPU Load",
      "ram_usage": "RAM Usage",
      "network_rx": "Network RX",
      "network_tx": "Network TX",
      "host_perf_history": "Host Performance History",
      "real_time_telemetry": "Real-time telemetry distribution mapping",
      "host_os_details": "Host OS Details",
      "filters": "Filters",
      "connecting": "Connecting...",
      "tracking_uptime": "Tracking Uptime",
      "node_alias": "Node Alias",
      "inbound_traffic": "Inbound Traffic",
      "outbound_traffic": "Outbound Traffic",
      "live_processing": "Live processing core ticks",
      "volatile_allocation": "Volatile allocation",
      "minutes": "Minutes",
      "top_processes": "Top Resource Processes",
      "process_name": "Process",
      "process_cpu": "CPU",
      "process_ram": "RAM",
      "login_access": "Perfomantia / Access",
      "username": "Username",
      "password": "Password",
      "authenticate": "Authenticate",
      "language": "EN"
    }
  },
  pt: {
    translation: {
      "dashboard": "Painel de Controle",
      "administrator": "Administrador",
      "logout": "Sair",
      "my_dashboard": "Meu Painel",
      "search_metrics": "Buscar métricas...",
      "cpu_load": "Carga do Processador",
      "ram_usage": "Uso de Memória RAM",
      "network_rx": "Rede Entrando",
      "network_tx": "Rede Saindo",
      "host_perf_history": "Histórico de Performance",
      "real_time_telemetry": "Mapeamento em tempo real da telemetria",
      "host_os_details": "Detalhes do Servidor",
      "filters": "Filtros",
      "connecting": "Conectando...",
      "tracking_uptime": "Tempo Ativo",
      "node_alias": "Identificador da Máquina",
      "inbound_traffic": "Tráfego de Entrada",
      "outbound_traffic": "Tráfego de Saída",
      "live_processing": "Ciclos de processamento local",
      "volatile_allocation": "Alocação de memória volátil",
      "minutes": "minutos",
      "top_processes": "Processos mais pesados (Top)",
      "process_name": "Processo",
      "process_cpu": "CPU",
      "process_ram": "RAM",
      "login_access": "Perfomantia / Acesso Seguro",
      "username": "Usuário",
      "password": "Senha secreta",
      "authenticate": "Acessar Sistema",
      "language": "PTBR"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "pt", // Set PT-BR as default
    fallbackLng: "en",
    interpolation: { escapeValue: false }
  });

export default i18n;
