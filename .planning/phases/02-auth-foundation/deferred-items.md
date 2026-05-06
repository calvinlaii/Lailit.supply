# Deferred Items — Phase 02 Auth Foundation

## Out-of-scope discoveries during 02-03 execution

### Test failures in login-form.test.tsx (02-02 scope)

**Discovered during:** Task 2 verification (npm test)
**Files affected:** src/components/marketing/__tests__/login-form.test.tsx, src/components/marketing/login-form.tsx
**Root cause:** The 02-02 parallel executor added tests for `aria-describedby` on the email input and for error-clearing behavior. These tests appear to be failing because the login-form.tsx implementation doesn't yet implement aria-describedby linking or the error state is not wiring correctly.
**Failing tests:**
1. "clears error when user types after an error" — Unhandled error from cookies() called outside request scope
2. "error message is linked to input via aria-describedby" — aria-describedby attribute missing

**Action:** Deferred to 02-02 resolution. These failures are pre-existing (introduced by 02-02 changes) and not caused by 02-03 dashboard shell files.
