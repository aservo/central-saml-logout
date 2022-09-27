#!/bin/bash

set -euo pipefail

if [[ "$PROXY" == "apache2" ]]; then
  exec apachectl -D FOREGROUND "$@"
elif [[ "$PROXY" == "nginx" ]]; then
  exec nginx -g 'daemon off;' "$@"
else
  echo 'No proxy selected' >&2
  exit 1
fi
