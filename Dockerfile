# 🐳 Dockerfile Unificado (Front-end + Back-end)

# --- 🛠️ ESTÁGIO 1: Build do Front-End ---
FROM oven/bun:latest AS builder
WORKDIR /app/webapp

# Instalar dependências do Vite
COPY webapp/package.json ./
RUN bun install

# Copiar arquivos e compilar o build estático
COPY webapp/ ./
RUN bun run build

# --- 🚀 ESTÁGIO 2: Servidor Back-End ---
FROM oven/bun:latest
WORKDIR /app

# 🛠️ Instalar pacote ps (procps) para permitir leitura de processos da VPS
RUN apt-get update && apt-get install -y procps && rm -rf /var/lib/apt/lists/*

# Criar estrutura de pastas adjacentes para bater com o core-server
RUN mkdir -p webapp core-server

# Copiar o build estático do primeiro estágio para webapp/dist
COPY --from=builder /app/webapp/dist ./webapp/dist

WORKDIR /app/core-server

# Instalar dependências do Elysia/Bun
COPY core-server/package.json ./
RUN bun install

# Copiar código fonte do back-end
COPY core-server/ ./

# Expor a porta 3000 (onde roda o Elysia)
EXPOSE 3000

# Comando para rodar o Core-Server
CMD ["bun", "run", "src/index.ts"]
