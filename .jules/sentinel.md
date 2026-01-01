## 2024-05-23 - Critical: Committing Environment Variables
**Vulnerability:** The `.gitignore` file was missing `.env` patterns, placing sensitive API keys and configuration secrets at immediate risk of being committed to version control.
**Learning:** Even in projects using framework-specific tools (like Expo), standard security patterns like ignoring env files must be explicitly verified. Automatic generation tools might not always include them if not configured or if the file was created manually.
**Prevention:** Always check `.gitignore` as the first step of any security audit. Use a template that includes standard exclusion patterns for environment variables.
