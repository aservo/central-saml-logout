#!/bin/bash

set -euo pipefail

SELF_PATH="$(dirname "$(readlink -f "$0")")"

npm --prefix "$SELF_PATH/../../" run build

docker build \
  --tag central-saml-logout:latest \
  --tag central-saml-logout:ubuntu \
  "$SELF_PATH/../../"

docker build \
  --file Dockerfile-rhel \
  --tag central-saml-logout:rhel \
  "$SELF_PATH/../../"

exit 0
