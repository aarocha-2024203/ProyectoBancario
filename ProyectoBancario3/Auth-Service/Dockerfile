FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY ProyectoBancario3/Auth-Service/package.json ./ProyectoBancario3/Auth-Service/
RUN pnpm install --frozen-lockfile
COPY ProyectoBancario3/Auth-Service/ ./ProyectoBancario3/Auth-Service/
EXPOSE 3005
CMD ["node", "ProyectoBancario3/Auth-Service/index.js"]
