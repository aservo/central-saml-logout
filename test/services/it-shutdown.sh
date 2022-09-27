#!/bin/bash

set -euo pipefail

SELF_PATH="$(dirname "$(readlink -f "$0")")"

"$SELF_PATH/proxy/docker-stop.sh" &
"$SELF_PATH/keycloak/docker-stop.sh" &
"$SELF_PATH/central-saml-logout/docker-stop.sh" &
"$SELF_PATH/test-client/docker-stop.sh" &

wait

"$SELF_PATH/proxy/docker-remove.sh" &
"$SELF_PATH/keycloak/docker-remove.sh" &
"$SELF_PATH/central-saml-logout/docker-remove.sh" &
"$SELF_PATH/test-client/docker-remove.sh" &

wait

exit 0
