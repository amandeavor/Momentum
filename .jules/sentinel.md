## 2024-05-22 - [CRITICAL] Insecure Auth Persistence in Redux
**Vulnerability:** The Redux `auth` slice was included in the `redux-persist` whitelist, which was configured to use unencrypted `AsyncStorage`. This caused sensitive Supabase session tokens to be stored insecurely on the device, duplicating the secure storage managed by the Supabase client.
**Learning:** `redux-persist` is powerful but dangerous if used blindly with sensitive data. Always verify *what* is being persisted and *where*. `AsyncStorage` is not secure storage.
**Prevention:** Explicitly exclude sensitive slices (like `auth`) from `redux-persist` whitelists. Rely on the auth provider's native secure storage (e.g., Supabase's `SecureStore` adapter) and re-hydrate auth state on app launch using an initialization thunk.
