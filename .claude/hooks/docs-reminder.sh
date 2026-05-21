#!/usr/bin/env bash
# UserPromptSubmit hook: si el prompt menciona una librería/framework, inyecta
# un recordatorio determinista de consultar el MCP context7 para docs frescas.
set -u
p=$(jq -r '.prompt // .user_prompt // empty')
if echo "$p" | grep -iqE '(\bastro\b|gsap|vercel|tailwind|@astrojs|\breact\b|\bvue\b|svelte|solidjs)'; then
  jq -nc '{
    hookSpecificOutput: {
      hookEventName: "UserPromptSubmit",
      additionalContext: "Library/framework reference detected. Before writing code that uses these APIs, consult the context7 MCP for fresh docs: call mcp__plugin_context7_context7__resolve-library-id then mcp__plugin_context7_context7__query-docs. Do not rely on training memory for library APIs — versions and APIs evolve."
    }
  }'
fi
exit 0
