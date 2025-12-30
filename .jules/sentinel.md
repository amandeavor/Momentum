## 2024-05-23 - [Example Entry]
**Vulnerability:** Found hardcoded API key in legacy config
**Learning:** Devs often hardcode keys during prototyping and forget to move to env vars
**Prevention:** Add pre-commit hook to scan for high-entropy strings
