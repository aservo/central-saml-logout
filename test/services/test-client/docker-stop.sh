#!/bin/bash

set -euo pipefail

docker stop client-apache2-slo-test-container &
docker stop client-nginx-slo-test-container &

wait

exit 0
