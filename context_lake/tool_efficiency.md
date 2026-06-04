# Tool Efficiency Rules

## File Reads
- Read first 30 lines of a file before editing (imports, types, signatures)
- Use grep to find specific code, then read offset:limit (±10 lines around match)
- Never read full files unless the file is small (<100 lines)
- Batch parallel reads when multiple files are needed

## Bash
- Don't dump full file content — use read/grep instead
- Prefer targeted queries over broad output
- Chain dependent commands with `; if ($?) { }`

## Agents (task tool)
- Pass focused prompts with file paths — let agents read what they need
- Don't dump full file contents into agent prompts
- Specify exact artifact paths and formats
