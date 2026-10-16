# Security Specification & Test Matrix: Estethmer EGX RL & News Platform

## 1. Data Invariants

1. **User Profile Invariant**: A user document in `/users/{userId}` can only be created, read, updated, or deleted by the authenticated user whose `request.auth.uid == userId`. The `uid` field is immutable.
2. **Watchlist Invariant**: Subcollection `/users/{userId}/watchlist/{symbol}` strictly inherits ownership from the parent user. Unauthenticated reads or modifications by other users are blocked.
3. **Saved Strategies Invariant**: Subcollection `/users/{userId}/savedStrategies/{strategyId}` stores hyperparameter configurations and Q-tables, fully isolated to the owning trader.
4. **Stock News Grounding Invariant**: News items in `/stockNews/{newsId}` are publicly readable by any trader to aid decision making, but can only be published or refreshed by verified authenticated requests with strict validation schemas. Deletions are forbidden to preserve the audit trail of news catalysts.
5. **Payload Bounds & Sanitization**: All strings must comply with the `maxLength` and regex pattern guards established in `firebase-blueprint.json` (e.g., symbol <= 16 chars, summary <= 1200 chars).

---

## 2. The "Dirty Dozen" Threat Vectors & Attack Payloads

1. **Spoofed User Creation**: Attempting to write `/users/victim_123` with `request.auth.uid = 'attacker_456'`. (Expected: PERMISSION_DENIED)
2. **Ghost Field Injection (Shadow Update)**: Injecting an undeclared property `isAdmin: true` into a `UserProfile`. (Expected: PERMISSION_DENIED)
3. **ID Poisoning Attack**: Passing a document ID containing special path traversal characters or 2KB length. (Expected: PERMISSION_DENIED)
4. **Watchlist Hijack**: Attempting to list or insert items into another user's watchlist `/users/other_user/watchlist/COMI`. (Expected: PERMISSION_DENIED)
5. **News Deletion**: Attempting to DELETE a news item to wipe historical news context. (Expected: PERMISSION_DENIED)
6. **Malicious News Sentiment Injection**: Sending an invalid sentiment `"EXTREMELY_BULLISH"` or decision `"ALL_IN"` not in the enum set `['BULLISH', 'BEARISH', 'NEUTRAL']`. (Expected: PERMISSION_DENIED)
7. **Denial of Wallet String Bomb**: Writing a 500KB news summary string exceeding `maxLength: 1200`. (Expected: PERMISSION_DENIED)
8. **Anonymous Write to News**: Attempting to write `/stockNews/fake_news_1` with unauthenticated request. (Expected: PERMISSION_DENIED)
9. **Strategy Snapshot Impersonation**: Overwriting another user's saved Q-learning model in `/users/alice/savedStrategies/strat_1`. (Expected: PERMISSION_DENIED)
10. **Immutable Field Tampering**: Attempting to modify `uid` in `/users/{userId}` from its created value. (Expected: PERMISSION_DENIED)
11. **Negative Numerical Poisoning**: Setting invalid negative numbers or unbounded values into numerical fields. (Expected: PERMISSION_DENIED)
12. **Catch-All Root Access**: Querying or writing directly to undeclared collections (e.g. `/system_secrets`). (Expected: PERMISSION_DENIED via Default Deny)
