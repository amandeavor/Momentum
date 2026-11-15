## 2026-01-18 - Redux Persist Auth Token Leak
**Vulnerability:** The `auth` slice was whitelisted in Redux Persist, causing sensitive session tokens to be stored in unencrypted `AsyncStorage` on Android/iOS, duplicating the secure storage provided by Supabase.
**Learning:** Redux Persist indiscriminately serializes whitelisted state to the configured storage engine. When using `AsyncStorage`, this exposes all persisted data in plaintext.
**Prevention:** Explicitly exclude authentication state from Redux Persist whitelists. Rely on the authentication provider's (Supabase) native persistence mechanisms which are often more secure (using `SecureStore`/Keychain).
