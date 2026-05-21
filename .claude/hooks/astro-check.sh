#!/usr/bin/env bash
# PostToolUse hook: corre `astro check` tras editar .astro/.ts/.tsx.
# Exit 2 = error bloqueante (feedback al modelo). Exit 0 = silencioso.
set -u
f=$(jq -r '.tool_response.filePath // .tool_input.file_path // empty')
case "$f" in
  *.astro|*.ts|*.tsx) ;;
  *) exit 0 ;;
esac
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
out=$(npx --no-install astro check 2>&1)
rc=$?
if [ $rc -ne 0 ]; then
  echo "astro check reportó errores tras editar $f:" >&2
  echo "$out" | tail -60 >&2
  exit 2
fi
exit 0
