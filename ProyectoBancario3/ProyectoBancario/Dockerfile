FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY ProyectoBancario3/ProyectoBancario/package.json ./ProyectoBancario3/ProyectoBancario/
RUN pnpm install --frozen-lockfile
COPY ProyectoBancario3/ProyectoBancario/ ./ProyectoBancario3/ProyectoBancario/
EXPOSE 3006
CMD ["node", "ProyectoBancario3/ProyectoBancario/index.js"]
