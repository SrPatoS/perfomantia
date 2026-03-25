# Perfomantia

Painel de Observabilidade Multi-Servidor em Tempo Real.

Perfomantia é uma solução de monitoramento leve e plug-and-play para VPS e servidores Linux/Windows. Monitore CPU, RAM, disco, processos, containers Docker e bancos de dados, tudo em tempo real via WebSocket, sem agentes complexos.

---

## Funcionalidades

- Dashboard em tempo real (CPU, RAM, Rede, Disco)
- Suporte Multi-Servidor (Master + Agentes remotos)
- Monitoramento de Containers Docker
- Monitoramento de Bancos de Dados (MongoDB, PostgreSQL)
- Alertas por e-mail configuráveis por servidor
- Interface Web responsiva com suporte a PT-BR / EN

---

## Deploy com Docker Compose

### Modo Master (Painel Principal)

O **Master** é o servidor onde você acessa o painel web. Ele monitora a própria máquina e também recebe dados de Agentes remotos.

Crie um arquivo `docker-compose.yml`:

```yaml
version: '3.8'

services:
  perfomantia-master:
    image: srvini/perfomantia:latest
    container_name: perfomantia_master
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - perfomantia_data:/app/data
    environment:
      - JWT_SECRET=troque-por-uma-chave-segura
      - PORT=3000

volumes:
  perfomantia_data:
```

Suba o serviço:

```bash
docker compose up -d
```

Acesse o painel em: **http://seu-ip:3000**

> **Credenciais padrão:** `admin` / `admin123`

---

### Modo Agent (VPS Remota)

O **Agent** roda em VPS remotas e envia telemetria para o Master. Não expõe interface web, apenas o WebSocket de métricas.

```yaml

services:
  perfomantia-agent:
    image: srvini/perfomantia:latest
    container_name: perfomantia_agent
    restart: unless-stopped
    pid: host
    ports:
      - "3000:3000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /:/host:ro
    environment:
      - IS_AGENT=true
      - AGENT_API_KEY=sua-chave-secreta
      - HOST_PROC=/host/proc
      - HOST_SYS=/host/sys
      - HOST_ETC=/host/etc
      - PORT=3000
```

```bash
docker compose up -d
```

---

### Adicionando o Agent ao painel Master

1. Acesse o painel Master -> **Configuracoes** -> **Servidores Remotos**
2. Clique em **+ Adicionar**
3. Preencha:
   - **Nome**: ex: `VPS Frankfurt`
   - **Host URL**: ex: `http://ip-da-vps:3000`
   - **API Key**: o mesmo valor de `AGENT_API_KEY` configurado no Agent
4. Clique em **Adicionar**
5. Use o **dropdown no topo** do painel para alternar entre servidores

---

## Variaveis de Ambiente

| Variavel | Padrao | Descricao |
|---|---|---|
| `PORT` | `3000` | Porta HTTP do servidor |
| `JWT_SECRET` | `secret-shhh` | Chave secreta para autenticacao JWT (Master) |
| `IS_AGENT` | `false` | Ativa o modo Agent, desativa front-end e rotas de login |
| `AGENT_API_KEY` | — | Chave de autenticacao para conexao Agent -> Master |
| `HOST_PROC` | `/proc` | Caminho do `/proc` do host (use `/host/proc` no Docker) |
| `HOST_SYS` | `/sys` | Caminho do `/sys` do host |
| `HOST_ETC` | `/etc` | Caminho do `/etc` do host |

---

## Compatibilidade Testada

| Sistema Operacional | Versao | Modo | Status |
|---|---|---|---|
| Windows 11 | 23H2 | Master (desenvolvimento) | OK |
| Ubuntu Server | 24.04 LTS | Master + Agent (Docker) | OK |

Qualquer sistema com Docker Engine 20.10+ deve funcionar.