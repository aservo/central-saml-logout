#!/bin/bash

set -euo pipefail

docker stop apache2-slo-test-container
docker stop nginx-slo-test-container

exit 0
