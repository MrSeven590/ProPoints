#!/usr/bin/env bash
set -euo pipefail

HBX_ROOT="/home/zhang/HBuilderX"
HBX_CLI="$HBX_ROOT/cli"
HBX_MAIN="$HBX_ROOT/HBuilderX"
STATE_FILE="${HBX_TRACK_STATE:-/tmp/hbx-cli-open.pgid}"
OPEN_SLEEP="${HBX_OPEN_SLEEP:-5}"
GRACE_SLEEP="${HBX_GRACE_SLEEP:-2}"

usage() {
  cat <<'EOF'
Usage:
  compile-propoints-android.sh open        # run cli open, detect new HBuilderX PGID, launch app-android, save it
  compile-propoints-android.sh status      # show current HBuilderX-related processes and saved PGID
  compile-propoints-android.sh cleanup     # stop saved PGID safely (TERM, then KILL if needed)
  compile-propoints-android.sh cleanup-all # stop all current HBuilderX-related PGIDs under /home/zhang/HBuilderX
  compile-propoints-android.sh cycle       # open, launch, report, then cleanup in one run

Environment:
  HBX_TRACK_STATE   state file path for saved PGID (default: /tmp/hbx-cli-open.pgid)
  HBX_OPEN_SLEEP    seconds to wait after open before snapshot (default: 5)
  HBX_GRACE_SLEEP   seconds to wait after TERM before KILL (default: 2)
EOF
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

snapshot_processes() {
  ps -eo pid=,ppid=,pgid=,cmd=
}

print_relevant_processes() {
  ps -eo pid,ppid,pgid,cmd | awk -v root="$HBX_ROOT" 'index($0, root) > 0'
}

save_pgid() {
  printf '%s\n' "$1" > "$STATE_FILE"
}

load_pgid() {
  if [[ ! -s "$STATE_FILE" ]]; then
    echo "No saved PGID state at $STATE_FILE" >&2
    return 1
  fi
  cat "$STATE_FILE"
}

pgid_exists() {
  local pgid="$1"
  ps -eo pgid= | awk -v target="$pgid" '$1 == target { found=1 } END { exit(found ? 0 : 1) }'
}

list_relevant_pgids() {
  ps -eo pgid=,cmd= \
    | awk -v root="$HBX_ROOT" 'index($0, root) > 0 { print $1 }' \
    | sort -n \
    | uniq
}

terminate_pgid() {
  local pgid="$1"

  if ! pgid_exists "$pgid"; then
    return 0
  fi

  kill -TERM -"$pgid" || true
  sleep "$GRACE_SLEEP"

  if pgid_exists "$pgid"; then
    kill -KILL -"$pgid" || true
    sleep 1
  fi
}

collect_new_pgids() {
  local before_file="$1"
  local after_file="$2"

  awk '
    NR==FNR {
      seen[$0] = 1
      next
    }
    !seen[$0] {
      print
    }
  ' "$before_file" "$after_file" \
  | awk -v main="$HBX_MAIN" -v root="$HBX_ROOT" '
      index($0, main) > 0 || index($0, root) > 0 {
        print $3
      }
    ' \
  | sort -n | uniq
}

run_launch() {
  local project_path="$1"
  local launch_err="$2"
  local launch_status

  set +e
  "$HBX_CLI" launch app-android --project "$project_path" 2>"$launch_err"
  launch_status=$?
  set -e

  return "$launch_status"
}

open_and_track() {
  require_cmd ps
  require_cmd awk
  require_cmd sort
  require_cmd uniq

  local before_file after_file launch_err launch_status
  local new_pgids pgid_count target_pgid project_path retry_message
  before_file=$(mktemp)
  after_file=$(mktemp)
  launch_err=$(mktemp)
  project_path="/home/zhang/HBbuilderProjects/ProPoints"
  retry_message="未检测到已打开的HBuilderX，请先执行cli open启动HBuilderX后再重试"

  trap 'rm -f "$before_file" "$after_file" "$launch_err"' RETURN

  snapshot_processes > "$before_file"
  "$HBX_CLI" open >/dev/null 2>&1
  snapshot_processes > "$after_file"

  new_pgids=$(collect_new_pgids "$before_file" "$after_file")
  pgid_count=$(printf '%s\n' "$new_pgids" | sed '/^$/d' | wc -l)

  if [[ "$pgid_count" -eq 0 ]]; then
    return 1
  fi

  if [[ "$pgid_count" -gt 1 ]]; then
    printf '%s\n' "$new_pgids" >&2
    return 1
  fi

  target_pgid=$(printf '%s\n' "$new_pgids" | sed -n '1p')
  save_pgid "$target_pgid"

  if run_launch "$project_path" "$launch_err"; then
    return 0
  fi
  launch_status=$?

  if grep -Fq "$retry_message" "$launch_err"; then
    printf '%s\n' '检测到 HBuilderX 未就绪，正在重试...' >&2
    : > "$launch_err"
    "$HBX_CLI" open >/dev/null 2>&1

    if run_launch "$project_path" "$launch_err"; then
      return 0
    fi
    launch_status=$?
  fi

  cat "$launch_err" >&2
  return "$launch_status"
}

cleanup_tracked() {
  require_cmd ps

  local pgid
  pgid=$(load_pgid)
  terminate_pgid "$pgid"
  rm -f "$STATE_FILE"
}

cleanup_all() {
  require_cmd ps
  require_cmd sort
  require_cmd uniq

  local pgids pgid_count pgid
  pgids=$(list_relevant_pgids)
  pgid_count=$(printf '%s\n' "$pgids" | sed '/^$/d' | wc -l)

  echo "== all relevant PGIDs =="
  if [[ "$pgid_count" -eq 0 ]]; then
    echo "(none)"
    rm -f "$STATE_FILE"
    return 0
  fi
  printf '%s\n' "$pgids"
  echo

  while IFS= read -r pgid; do
    [[ -n "$pgid" ]] || continue
    terminate_pgid "$pgid"
    echo
  done <<< "$pgids"

  rm -f "$STATE_FILE"
}

show_status() {
  echo "== saved PGID =="
  if [[ -s "$STATE_FILE" ]]; then
    cat "$STATE_FILE"
  else
    echo "(none)"
  fi
  echo
  echo "== current HBuilderX-related processes =="
  print_relevant_processes || true
}

case "${1:-}" in
  open)
    open_and_track
    ;;
  cleanup)
    cleanup_tracked
    ;;
  cleanup-all)
    cleanup_all
    ;;
  status)
    show_status
    ;;
  cycle)
    open_and_track
    echo
    cleanup_tracked
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    usage >&2
    exit 1
    ;;
esac
