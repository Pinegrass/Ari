# Account deletion — Play Store compliance checklist

Google Play **requires** any app that allows account creation to also offer account deletion. This is enforced via the Data Safety form on the store listing. Apps that claim compliance without actually supporting it can have their listing removed.

## What's in this PR

| Surface | File | What it does | Status |
|---|---|---|---|
| **In-app UI** | `src/screens/Settings/DeleteAccountScreen.tsx` | Settings screen with friction (type DELETE), confirmation, sign-out on success | Code-complete |
| **API client** | `src/api/account.ts` | Frontend stub calling `DELETE /api/account` | Code-complete, needs `setApiClient()` wired to your auth fetch wrapper |
| **Backend spec** | `docs/backend/delete-account-endpoint.md` | Full endpoint contract: behavior, edge cases, audit, test plan | **Backend dev must implement** |
| **Web form** | `docs/web/account-deletion-request.html` | Public page so users without the app can request deletion | **Must be deployed to a public URL** |
| **Listing form URL** | (Play Console) | URL of the web form goes in **Store listing → Account deletion URL** | **Must be set in Play Console** |

## Three things that must be true before submitting to Play

1. **Backend endpoint exists and works.**
   - `DELETE /api/account` returns 200 with a valid `completesAt` payload.
   - Test from the app: a deleted user is signed out and cannot sign back in with the same credentials.
   - Test from the app: re-registering the same email creates a fresh account with no inherited data.

2. **In-app deletion path is discoverable.**
   - Settings → Account → Delete account (or similar — no more than 3 taps from the home screen).
   - Hook `DeleteAccountScreen` into your navigation. On `onDeleted`, call your existing sign-out flow and navigate to the Auth stack with a confirmation toast: "Your account will be fully deleted by {completesAt}."

3. **Public web form is reachable.**
   - Host `docs/web/account-deletion-request.html` at a stable URL (e.g. `https://pinegrass.app/delete-account` or a Railway static route).
   - **The form's `action=` URL** in the HTML currently points at `web-production-7c65f.up.railway.app/api/account/deletion-request` — implement that endpoint or update the URL.
   - **The Play Console field** for "Account deletion URL" must point at this page.

## Wiring the screen into navigation

For React Navigation:

```tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DeleteAccountScreen } from './src/screens/Settings';

const Stack = createNativeStackNavigator();

<Stack.Screen
  name="DeleteAccount"
  options={{ title: 'Delete account' }}
>
  {({ navigation }) => (
    <DeleteAccountScreen
      onDeleted={(completesAt) => {
        signOut();                          // your existing sign-out
        navigation.reset({                  // back to auth stack
          index: 0,
          routes: [{ name: 'SignIn', params: { deletedAt: completesAt } }],
        });
      }}
      onCancel={() => navigation.goBack()}
    />
  )}
</Stack.Screen>
```

For Expo Router (`app/(settings)/delete-account.tsx`):

```tsx
import { router } from 'expo-router';
import { DeleteAccountScreen } from '@/src/screens/Settings';

export default function DeleteAccountRoute() {
  return (
    <DeleteAccountScreen
      onDeleted={() => {
        signOut();
        router.replace('/sign-in');
      }}
      onCancel={() => router.back()}
    />
  );
}
```

## Wiring the API client

Once at app startup (e.g. in `App.tsx` or wherever you configure your existing fetch):

```ts
import { setApiClient } from './src/api/account';
import { authedFetch } from './src/api/client';  // your existing wrapper

setApiClient(authedFetch);
```

`authedFetch` should be your existing function that injects the bearer token. It needs to return a `Response`-shaped object that supports `res.ok`, `res.status`, `res.text()`, and `res.json()`.

## What the dev still owns

1. Implement the backend endpoint per `docs/backend/delete-account-endpoint.md`.
2. Deploy `docs/web/account-deletion-request.html` to a public URL.
3. Implement the corresponding backend route that consumes the form POST (`/api/account/deletion-request` — email confirmation flow).
4. Add the public URL to Play Console.
5. Hook `DeleteAccountScreen` into navigation.
6. Wire `setApiClient()` at app startup.

## Time estimate

- Backend endpoint: 1–2 hours for the dev who already knows the schema.
- Deploy static HTML: 15 min on Railway / Vercel / Cloudflare Pages.
- Email confirmation flow for the web form: 30–60 min.
- Navigation wiring: 15 min.

**Total: ~3 hours of dev work to clear this launch-blocking item.**
