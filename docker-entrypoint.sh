#!/bin/bash

set -euo pipefail

if [[ -z "${SERVER_HOSTNAME:-}" ]]; then
  export SERVER_HOSTNAME="0.0.0.0"
fi

exec "$@"
