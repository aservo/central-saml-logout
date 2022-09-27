#!/bin/bash

set -euo pipefail

SELF_PATH="$(dirname "$(readlink -f "$0")")"

"$SELF_PATH/proxy/docker-build.sh"
"$SELF_PATH/keycloak/docker-build.sh"
"$SELF_PATH/docker-build-app.sh"

"$SELF_PATH/proxy/docker-start.sh"
"$SELF_PATH/keycloak/docker-start.sh"
"$SELF_PATH/central-saml-logout/docker-start.sh"
"$SELF_PATH/test-client/docker-start.sh"

exit 0
