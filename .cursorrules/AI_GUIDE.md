You are pair-programming on Traveline’s React Native frontend (Expo Router). Your goal is to implement features safely and quickly, following the project’s conventions, API contracts, and the product user stories. Default to minimal, composable edits and keep the app stable.

Context
- Stack: React Native 0.81, React 19, Expo 54, Expo Router 6, TypeScript 5.9.
- Entry: index.ts → expo-router/entry. Screens live under app/.
- Global state and server sync: src/context/UserContext.tsx (source of truth for auth, travel plans, places, photos, expenses, memos, flights, accommodations, supplies, tasks, members).
- API layer: src/utils/travelPlanApi.ts (business endpoints via authApi.authenticatedFetch), src/utils/authApi.ts (JWT, refresh, AsyncStorage), src/utils/cityApi.ts, src/utils/amadeusApi.ts.
- Config: app.config.js (Expo, Google Maps keys, Amadeus keys via extra.amadeus). Do not hardcode secrets in code.

Product/User Story Alignment
- Always read and align with the user stories in `traveline-userstory.md` (repo root unless otherwise noted).
- Treat `traveline-userstory.md` as the authoritative source for:
  - Scope, acceptance criteria, and business rules for each story.
  - Display copy and UX intents (prefer Korean strings as written).
  - Edge cases and non-functional requirements called out in stories.
- Traceability:
  - Reference the story ID/title in commit messages and TODOs (e.g., feat(expenses): show summary per US-12 acceptance criteria).
  - If code and story conflict, implement per the story and leave a code comment noting the divergence and rationale.
- Planning from stories:
  - Derive tasks as smallest vertical slices that can be verified against acceptance criteria.
  - Add missing domain actions in `UserContext` and corresponding DTO calls in `travelPlanApi` strictly scoped to the story.
- If `traveline-userstory.md` is missing or unclear:
  - Don’t guess business behavior; surface a concise question and implement only the safe, neutral UI scaffolding.

Absolute Must-Follow Conventions
- Go through `UserContext` for domain reads/writes. If missing, add a thin method that calls `travelPlanApi`, converts DTO→UI types, and updates state immutably.
- Respect ID types: API uses numbers; UI types often use strings. Convert at boundaries.
- Dates: API expects YYYY-MM-DD; frontend display uses YYYY.MM.DD. Reuse existing helpers.
- Auth: use `authApi.authenticatedFetch` for protected calls; it auto-refreshes tokens on 401.
- Images: render via full URLs (use `getFullImageUrl`), upload with FormData (no manual Content-Type).
- State updates: follow existing map/filter patterns and set order based on server responses.
- Errors: user-friendly messages (Korean), technical logs to console.
- UI: keep screens under `app/`, data orchestration in screens via `UserContext`, components presentational.

How to Ask for Changes
- Data flow change: add/edit a method in `src/context/UserContext.tsx` (validate input, call API, convert DTOs, update state).
- New API call: add to `src/utils/travelPlanApi.ts` using `authApi.authenticatedFetch`, return typed DTOs only. Keep conversions in `UserContext`.
- New screen: add under `app/` per Expo Router conventions; side effects via hooks that call `UserContext`.

Coding Style
- TypeScript strict. Prefer precise types over any.
- Small, pure functions; reuse shared helpers.
- Early returns for guards (auth required, missing IDs).
- Korean for user-visible copy; comments in Korean/English as present.
- No new global state libs; stick to `UserContext`.

Platform and Environment
- Dev base URLs: iOS http://localhost:8080, Android emulator http://10.0.2.2:8080.
- Production URLs placeholders—don’t change.
- Google Maps and Amadeus keys come from `app.config.js` extra; use `src/utils/amadeusApi.ts` for flight lookups.

Testing Scope for Each Edit
- Token refresh flow intact (no 401 loops).
- DTO→UI conversions correct (IDs, dates).
- State updates visible in dependent screens after create/update/delete/reorder.
- Image uploads preserve filenames; headers correct.

What Not to Do
- Don’t bypass `UserContext` from screens.
- Don’t mutate state in place.
- Don’t hardcode secrets/URLs.
- Don’t change auth refresh/storage keys.
- Don’t introduce new navigation systems.

Useful Paths
- State/actions: `src/context/UserContext.tsx`
- API: `src/utils/travelPlanApi.ts`, `src/utils/authApi.ts`, `src/utils/cityApi.ts`, `src/utils/amadeusApi.ts`
- Large screens: `app/plan-detail.tsx`, `app/expenses.tsx`

Commit Guidance
- Tie to stories: feat(expenses): implement shared/personal filter per US-12
- Separate logical changes (API vs context vs screen).

When in Doubt
- Mirror an existing `UserContext` + `travelPlanApi` flow for the same resource.
- Resolve ambiguity in favor of `traveline-userstory.md`; otherwise, raise a question and keep the edit minimal.