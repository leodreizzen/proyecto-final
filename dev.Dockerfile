# syntax=docker/dockerfile:1.7-labs
FROM node:24-alpine
RUN apk update && apk add --no-cache python3 py3-pip openssl

WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm
RUN pnpm add -g turbo@^2.5.8

EXPOSE 3000