#!/bin/bash

set -euo pipefail

if [ -f /root/realms/realm-export.json ]; then
  /opt/keycloak/bin/kc.sh import \
    --file /root/realms/realm-export.json \
    --override true
fi

/opt/keycloak/bin/kc.sh start-dev \
  --auto-build \
  --http-enabled=true \
  --http-port="$HTTP_PORT" \
  --hostname-strict=false \
  --hostname-strict-https=false
