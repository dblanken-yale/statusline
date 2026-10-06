#!/bin/bash
# Pipes sample JSON into statusline.sh and checks the ⏱ duration format.
cd "$(dirname "$0")/.." || exit 1
export CLAUDE_STATUSLINE_CONFIG=/nonexistent HOME=$(mktemp -d)
fail=0
check() {  # $1 = cost json, $2 = expected
  got=$(echo "{\"rate_limits\":{},\"cost\":$1}" | bash statusline.sh | tail -n1 | sed 's/.*⏱  //')
  [ "$got" = "$2" ] && echo "ok   $1 -> $2" || { echo "FAIL $1: got '$got', want '$2'"; fail=1; }
}
check '{"active_duration_ms":65000}' '1m 5s'
check '{"active_duration_ms":7380000}' '2h 3m'
check '{"active_duration_ms":5000}' '5s'
check '{"total_api_duration_ms":65000,"total_duration_ms":999999999}' '1m 5s'
check '{"total_duration_ms":65000}' '1m 5s'
exit $fail
