## 2024-05-23 - [Redundant Insecure Persistence]
**Vulnerability:** Redux state (including Auth tokens) was being persisted to unencrypted `AsyncStorage` via `redux-persist`, while Supabase client was also handling session persistence securely via `SecureStore`.
**Learning:** Duplicate persistence mechanisms can introduce security gaps. Even if one layer is secure (Supabase), another (Redux) might expose the same data insecurely.
**Prevention:** Audit state management and persistence libraries to ensure sensitive data is not being stored redundantly in insecure locations. Explicitly blacklist or exclude sensitive slices from general persistence.
