## 2024-02-21 - [CRITICAL] Tracked .env file in git
**Vulnerability:** The `.env` file containing Supabase configuration keys was committed to the git repository.
**Learning:** Developers often forget to add `.env` to `.gitignore` when initializing a project, or `expo-cli` generation might not include it by default in all templates.
**Prevention:** Always check `.gitignore` before the first commit. Use `.env.example` for templates. Add a pre-commit hook to scan for potential secrets or `.env` files being committed.
