#!/bin/bash

# Required variables
: "${DOMAIN:?Error: DOMAIN environment variable not set.}"
: "${CERTBOT_EMAIL:?Error: CERTBOT_EMAIL environment variable not set.}"

# Optional Staging variable
STAGING_ARG=""
if [ "$STAGING" = "1" ]; then
    STAGING_ARG="--staging"
    echo "Using Let's Encrypt staging environment"
fi

# Substitute configuration
envsubst '${DOMAIN}' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf

# Create dummy certificate if not present so nginx can start
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "No certificate found. Creating a dummy certificate for $DOMAIN..."
    mkdir -p /etc/letsencrypt/live/$DOMAIN

    openssl req -x509 -nodes -newkey rsa:4096 -days 1 \
        -keyout "/etc/letsencrypt/live/$DOMAIN/privkey.pem" \
        -out "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" \
        -subj "/CN=localhost"
fi

# Certbot background process
(
    echo "Waiting for Nginx to load..."
    # Wait for Nginx (retry 30 times, 1 sec delay)
    if curl --head --fail --silent --retry 30 --retry-connrefused --retry-delay 1 -H "Host: $DOMAIN" http://127.0.0.1 > /dev/null; then
        echo "Nginx online"

        # If it's the dummy cert (localhost), request the real one
        if openssl x509 -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" -noout -issuer | grep -q "localhost"; then
            echo "Requesting SSL certificate for $DOMAIN (Staging: ${STAGING:-0})..."

            # Delete dummy certificate
            rm -rf "/etc/letsencrypt/live/$DOMAIN"
            rm -rf "/etc/letsencrypt/archive/$DOMAIN"
            rm -rf "/etc/letsencrypt/renewal/$DOMAIN.conf"

            certbot certonly --webroot -w /var/www/certbot \
                $STAGING_ARG \
                -d "$DOMAIN" --email "$CERTBOT_EMAIL" \
                --agree-tos --no-eff-email --non-interactive

            if [ $? -eq 0 ]; then
                echo "SSL certificate obtained successfully."
                nginx -s reload
            else
                echo "Error obtaining SSL certificate."
            fi
        fi

        # Renewal loop
        while :; certbot renew --deploy-hook "nginx -s reload"; do sleep 12h; done
    else
        echo "Timed out waiting for Nginx to start."
        kill 1
    fi
) &

# Start Nginx in the foreground
exec nginx -g "daemon off;"