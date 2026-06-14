#!/bin/sh
# Map generic DNS_API_* to provider-specific env vars based on DNS_PROVIDER
# Add new providers here — no code changes needed elsewhere

case "${DNS_PROVIDER:-west_cn}" in
  west_cn)
    export WEST_Username="$DNS_API_USER"
    export WEST_Key=$(printf '%s' "$DNS_API_KEY" | md5sum | cut -d' ' -f1)
    ;;
  cloudflare)
    export CF_Token="$DNS_API_KEY"
    ;;
  aliyun)
    export Ali_Key="$DNS_API_USER"
    export Ali_Secret="$DNS_API_KEY"
    ;;
  *)
    echo "Unknown DNS_PROVIDER: $DNS_PROVIDER" >&2
    exit 1
    ;;
esac
