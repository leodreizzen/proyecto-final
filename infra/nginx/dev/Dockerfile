FROM nginx:1.29.3-alpine
RUN apk add --no-cache bash gettext

COPY ./nginx.conf /etc/nginx/templates/nginx.conf.template

COPY ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]