# syntax=docker/dockerfile:1

FROM python:3.8-slim AS build
ARG ARG_ENV=development
ENV ENV=${ARG_ENV}
COPY . .
RUN python3 build.py

FROM node:16-slim
WORKDIR /app
RUN npm i -g serve
COPY --from=0 public public

CMD ["serve", "public"]