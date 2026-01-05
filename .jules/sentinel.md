## 2024-05-24 - Critical Git Ignore Gap
**Vulnerability:** The `.gitignore` file was missing entries for `.env` files, leaving configuration and potential secrets exposed to version control.
**Learning:** Even when project documentation claims "configuration is enforced to be untracked", technical controls (git config) must be verified manually. Trust nothing, verify everything.
**Prevention:** Always verify `.gitignore` content in new projects immediately, specifically checking for secret-carrying file patterns like `.env`.
