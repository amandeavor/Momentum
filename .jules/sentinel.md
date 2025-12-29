## 2024-02-14 - [.env file committed]
**Vulnerability:** The `.env` file containing `EXPO_PUBLIC_SUPABASE_ANON_KEY` and `EXPO_PUBLIC_SUPABASE_URL` was tracked in git and present in the repository.
**Learning:** Even "public" keys can be misused if developers assume `.env` is private and add other secrets later (like service role keys). Default Expo `.gitignore` does not ignore `.env` if it was created before `.gitignore` or if the user removed it.
**Prevention:** Always check `.gitignore` and `git ls-files` for `.env` files. Added `.env` to `.gitignore` and removed it from git cache. Created `.env.example`.
