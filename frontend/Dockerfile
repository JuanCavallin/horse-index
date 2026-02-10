FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

ARG EXPO_PUBLIC_SUPABASE_URL
ARG EXPO_PUBLIC_SUPABASE_ANON_KEY
ARG EXPO_PUBLIC_API_URL

ENV EXPO_PUBLIC_SUPABASE_URL=$EXPO_PUBLIC_SUPABASE_URL
ENV EXPO_PUBLIC_SUPABASE_ANON_KEY=$EXPO_PUBLIC_SUPABASE_ANON_KEY
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL

RUN npx expo export --platform web

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

RUN printf 'server {\n\
  listen 80;\n\
  resolver 127.0.0.11 valid=30s;\n\
  location / {\n\
    root /usr/share/nginx/html;\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
  location /api {\n\
    set $backend http://backend:8000;\n\
    proxy_pass $backend;\n\
    proxy_set_header Host $host;\n\
    proxy_set_header X-Real-IP $remote_addr;\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]