#!/usr/bin/env bash
#
# update_oecd_cpi.sh — extract OECD CPI then load into Neon.
#
# Usage:
#   ./update_oecd_cpi.sh
#   ./update_oecd_cpi.sh --dry-run
#   ./update_oecd_cpi.sh --areas AUS,USA,GBR
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/../frontend-next16/.env.local}"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source <(grep -E '^(DB_HOST|DB_USER|DB_PASS|DB_PORT|DB_NAME|DB_SSL|DB_SSLMODE)=' "$ENV_FILE" | sed 's/\r$//')
  set +a
  case "${DB_SSLMODE:-${DB_SSL:-require}}" in
    true|TRUE|1|yes|YES) export DB_SSLMODE=require ;;
    false|FALSE|0|no|NO) export DB_SSLMODE=disable ;;
    *) export DB_SSLMODE="${DB_SSLMODE:-${DB_SSL:-require}}" ;;
  esac
fi

DRY_RUN=""
AREAS_ARG=()
PREV=""
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN="--dry-run" ;;
    --areas=*) AREAS_ARG=(--areas "${arg#*=}") ;;
    *)
      if [[ "${PREV}" == "--areas" ]]; then
        AREAS_ARG=(--areas "$arg")
      fi
      ;;
  esac
  PREV="$arg"
done

echo "[$(date -Iseconds)] extract_oecd_cpi.py ${AREAS_ARG[*]:-} $DRY_RUN"
python3 extract_oecd_cpi.py "${AREAS_ARG[@]}" $DRY_RUN

if [[ -n "$DRY_RUN" ]]; then
  echo "[$(date -Iseconds)] dry-run: skipping load"
  exit 0
fi

echo "[$(date -Iseconds)] load_oecd_cpi.py --ensure-schema"
python3 load_oecd_cpi.py --ensure-schema

echo "[$(date -Iseconds)] done"
