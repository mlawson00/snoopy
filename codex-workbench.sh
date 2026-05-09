#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${repo_root}"

export HOST_UID="${HOST_UID:-$(id -u)}"
export HOST_GID="${HOST_GID:-$(id -g)}"
export COMPOSE_IGNORE_ORPHANS="${COMPOSE_IGNORE_ORPHANS:-true}"

if [[ "$#" -eq 0 ]]; then
  set -- codex --sandbox danger-full-access
elif [[ "$1" == "shell" ]]; then
  shift
  set -- bash -l "$@"
fi

if [[ "${CODEX_WORKBENCH_BUILD:-0}" == "1" ]] || ! docker image inspect snoopy_codex_workbench >/dev/null 2>&1; then
  docker compose build codex_workbench
fi

exec docker compose run --rm codex_workbench "$@"
