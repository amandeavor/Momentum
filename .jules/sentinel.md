## 2024-05-24 - Redux Persistence Security
**Vulnerability:** The `auth` slice containing the sensitive Supabase session (including access tokens) was being persisted to unencrypted `AsyncStorage` via `redux-persist`, despite Supabase already managing secure persistence internally.
**Learning:** Double-persistence (once by auth provider, once by state manager) can re-introduce vulnerabilities that the auth provider had already solved.
**Prevention:** Always verify if state management persistence is necessary for auth state when the auth provider has its own persistence mechanism. Prefer the auth provider's secure implementation.
