FROM nginx:1.29.3-alpine
RUN apk add --no-cache certbot openssl bash curl gettext

RUN mkdir -p /var/www/certbot

COPY ./nginx.prod.conf /etc/nginx/templates/nginx.conf.template

COPY ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]