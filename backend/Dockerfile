FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/

EXPOSE 8000

CMD ["npx", "tsx", "src/app.ts"]
