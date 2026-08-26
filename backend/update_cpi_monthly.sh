#!/usr/bin/env bash
#
# update_cpi_monthly.sh
#
# Downloads, extracts, and loads the monthly CPI data from ABS.
# Designed to run on the last Wednesday of each month, when ABS
# publishes the Monthly CPI Indicator.
#
# The script checks whether today is the last Wednesday of the month
# before running. When called with --force it skips that check.
#
# Usage:
#   ./update_cpi_monthly.sh              # only runs on last Wednesday
#   ./update_cpi_monthly.sh --force      # runs regardless of day
#   ./update_cpi_monthly.sh --dry-run    # extract only, no DB writes
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

# ── Is today the last Wednesday of the month? ──────────────────────
is_last_wednesday() {
    local dow today next_wednesday current_month next_wed_month
    dow=$(date +%u)               # 1=Mon ... 7=Sun
    if [[ "$dow" -ne 3 ]]; then   # 3=Wednesday
        return 1
    fi
    # If adding 7 days crosses into the next month, this is the last Wednesday
    current_month=$(date +%m)
    next_wed_month=$(date -d "+7 days" +%m)
    [[ "$current_month" != "$next_wed_month" ]]
}

# ── Args ────────────────────────────────────────────────────────────
FORCE=false
DRY_RUN=""
for arg in "$@"; do
    case "$arg" in
        --force)   FORCE=true ;;
        --dry-run) DRY_RUN="--dry-run" ;;
    esac
done

# ── Gate: only run on last Wednesday unless forced ──────────────────
if [[ "$FORCE" != true ]] && ! is_last_wednesday; then
    echo "[$(date -Iseconds)] Not the last Wednesday of the month. Exiting."
    exit 0
fi

# ── Determine the ABS release month/year ────────────────────────────
# ABS publishes the release page with the current month slug, e.g.
# https://www.abs.gov.au/.../aug-2026/6401010.xlsx
MONTH=$(date +%b | tr '[:upper:]' '[:lower:]')
YEAR=$(date +%Y)

LOG_FILE="$LOG_DIR/cpi_${YEAR}_${MONTH}.log"

echo "═══════════════════════════════════════════════════════════" | tee -a "$LOG_FILE"
echo "[$(date -Iseconds)] Monthly CPI update: $MONTH $YEAR" | tee -a "$LOG_FILE"
echo "═══════════════════════════════════════════════════════════" | tee -a "$LOG_FILE"

# ── Load environment ────────────────────────────────────────────────
if [[ -f "$SCRIPT_DIR/.env" ]]; then
    set -a
    source "$SCRIPT_DIR/.env"
    set +a
    echo "[env] DB_HOST=$DB_HOST  DB_NAME=$DB_NAME" | tee -a "$LOG_FILE"
else
    echo "[error] .env not found in $SCRIPT_DIR" | tee -a "$LOG_FILE"
    exit 1
fi

# ── Check Python deps ──────────────────────────────────────────────
for pkg in pandas openpyxl psycopg2; do
    if ! python3 -c "import $pkg" 2>/dev/null; then
        echo "[error] Missing Python package: $pkg" | tee -a "$LOG_FILE"
        exit 1
    fi
done

# ── Step 1: Download and extract ────────────────────────────────────
echo "[$(date -Iseconds)] Step 1/2: Extracting monthly CPI..." | tee -a "$LOG_FILE"

if python3 "$SCRIPT_DIR/extract_cpi_monthly.py" \
        --month "$MONTH" --year "$YEAR" 2>&1 | tee -a "$LOG_FILE"; then
    echo "[$(date -Iseconds)] Extraction complete." | tee -a "$LOG_FILE"
else
    echo "[error] Extraction failed. Aborting." | tee -a "$LOG_FILE"
    exit 1
fi

# ── Step 2: Load into database ──────────────────────────────────────
if [[ -n "$DRY_RUN" ]]; then
    echo "[$(date -Iseconds)] Step 2/2: Dry run — skipping database load." | tee -a "$LOG_FILE"
    python3 "$SCRIPT_DIR/load_cpi_monthly.py" --dry-run 2>&1 | tee -a "$LOG_FILE"
else
    echo "[$(date -Iseconds)] Step 2/2: Loading into database..." | tee -a "$LOG_FILE"
    if python3 "$SCRIPT_DIR/load_cpi_monthly.py" 2>&1 | tee -a "$LOG_FILE"; then
        echo "[$(date -Iseconds)] Database load complete." | tee -a "$LOG_FILE"
    else
        echo "[error] Database load failed." | tee -a "$LOG_FILE"
        exit 1
    fi
fi

echo "[$(date -Iseconds)] ✅ Monthly CPI pipeline finished." | tee -a "$LOG_FILE"
