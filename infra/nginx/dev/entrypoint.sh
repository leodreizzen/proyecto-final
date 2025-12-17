#!/bin/bash
# Substitute configuration
envsubst '${S3_ENDPOINT}' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf
# Start Nginx in the foreground
exec nginx -g "daemon off;"