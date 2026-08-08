## 2024-05-23 - Redux Persist Security Risk
**Vulnerability:** The `auth` slice containing sensitive Supabase session tokens was being persisted to unencrypted `AsyncStorage` via Redux Persist.
**Learning:** Redux Persist's default storage engines (like AsyncStorage) are often unencrypted. Whitelisting entire slices can accidentally expose sensitive data (tokens, PII) that should only live in memory or SecureStore.
**Prevention:**
1. Never whitelist `auth` or sensitive slices in Redux Persist if using unencrypted storage.
2. Rely on the auth provider's SDK (e.g., Supabase, Firebase) for secure session persistence.
3. If specific non-sensitive auth fields (like "hasSeenOnboarding") need persistence, separate them into a different slice or use Redux Persist transforms to filter sensitive keys.
