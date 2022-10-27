FROM node:16-slim

WORKDIR /app
RUN npm i -g serve

COPY . .

CMD ["serve", "public"]