## 2026-01-13 - [Duplicate Insecure Auth Storage]
**Vulnerability:** The `auth` slice was being persisted to `AsyncStorage` (unencrypted) via Redux Persist, while simultaneously being managed by Supabase's secure storage adapter.
**Learning:** Redux Persist defaults to insecure storage (`AsyncStorage`) in React Native unless configured otherwise. When using a backend SDK like Supabase or Firebase that handles its own secure session storage, persisting the auth state in Redux is redundant and creates a security risk (plaintext tokens on disk).
**Prevention:** Always check `whitelist` or `blacklist` in Redux Persist configuration. Exclude authentication state if the auth provider manages its own persistence securely.
