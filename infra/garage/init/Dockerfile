FROM alpine:latest

ARG GARAGE_VERSION=v2.1.0
ARG ARCH=x86_64-unknown-linux-musl

RUN apk add --no-cache curl jq

# Instalamos el cliente
RUN curl --fail -L -o /usr/local/bin/garage "https://garagehq.deuxfleurs.fr/_releases/${GARAGE_VERSION}/${ARCH}/garage" \
    && chmod +x /usr/local/bin/garage

COPY init-garage.sh /usr/local/bin/init-garage
RUN chmod +x /usr/local/bin/init-garage

# AQUÍ EL CAMBIO:
# Ejecuta el script y cuando el script termina (exit 0), el contenedor muere.
CMD ["/usr/local/bin/init-garage"]