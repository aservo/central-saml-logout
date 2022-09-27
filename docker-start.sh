#!/bin/bash

set -euo pipefail

exec node ./dist/ "$@"
