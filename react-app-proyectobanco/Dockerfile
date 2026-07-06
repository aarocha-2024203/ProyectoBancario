FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY react-app-proyectobanco/package.json ./react-app-proyectobanco/
RUN pnpm install --frozen-lockfile
COPY react-app-proyectobanco/ ./react-app-proyectobanco/
ENV VITE_API_URL=http://localhost:3005/api/v1
ENV VITE_API_BASE_URL=http://localhost:3005/api
ENV VITE_BANKING_URL=http://localhost:3006/api/v1
RUN pnpm --filter react-app-proyectobanco build

FROM nginx:alpine
COPY --from=builder /app/react-app-proyectobanco/dist /usr/share/nginx/html
COPY react-app-proyectobanco/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
