FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install --ignore-scripts

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD sh -c "npx prisma db push --accept-data-loss && npx tsx prisma/seed.ts && npm start"
