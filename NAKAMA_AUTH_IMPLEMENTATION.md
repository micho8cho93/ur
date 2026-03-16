# Nakama Authentication Integration

## Overview

The authentication system has been successfully extended to support Nakama-compatible authentication. The implementation integrates Nakama with the existing Google OAuth and guest login flows.

## Server Configuration

**Nakama Server:** `https://nakama.urgame.live`

Configuration details:
- **Host:** nakama.urgame.live
- **Port:** 443
- **SSL:** Enabled (true)
- **Server Key:** defaultkey

## Implementation Summary

### 1. Nakama Client

Created `src/nakama/client.ts` with a pre-configured client instance.

### 2. NakamaService Enhancements

Updated `/services/nakama.ts` with:
- `authenticateGoogle(idToken, create, username)` - Authenticates users via Google ID token
- `linkGoogle(idToken)` - Links a Google account to an existing guest account
- `getAccount()` - Fetches user account information from Nakama

### 3. User Model

Extended `src/types/user.ts` to include:
- `nakamaUserId?: string` - Nakama's internal user ID

### 4. Session Storage

Updated `src/auth/sessionStorage.ts` to persist:
- `nakamaSessionToken` - Active Nakama session token
- `nakamaRefreshToken` - Refresh token for session renewal

The `saveSession()` and `loadSession()` functions now handle Nakama session tokens.

### 5. Guest Authentication

Updated `src/auth/guestAuth.ts`:
- Changed from synchronous `createGuestUser()` to async `loginAsGuest()`
- Generates UUID-based device IDs
- Calls `nakamaService.authenticateDevice()`
- Fetches and stores Nakama user profile
- Returns both user object and Nakama session

### 6. Google Authentication

Updated `src/auth/googleAuth.ts`:
- Added Nakama authentication after Google OAuth flow
- Receives Google idToken and sends to Nakama
- Fetches Nakama account info
- Returns user with Nakama session included

### 7. AuthProvider Integration

Updated `src/auth/AuthProvider.tsx`:
- **Session Restore:** On app start, validates and refreshes Nakama sessions
- **Login Flows:** Both guest and Google login now save Nakama tokens
- **Logout:** Clears both local session and Nakama session
- **Account Linking:** New `linkGoogleAccount()` method to upgrade guest to Google

### 8. AuthContext

Updated `src/auth/AuthContext.tsx`:
- Added `linkGoogleAccount()` to context value

## Authentication Flows

### Guest Login Flow

```
User clicks "Continue as Guest"
  ↓
Generate UUID device ID (guest_{uuid})
  ↓
Call nakamaService.authenticateDevice(deviceId)
  ↓
Fetch Nakama account info
  ↓
Store user + Nakama session tokens
  ↓
User authenticated
```

### Google Login Flow

```
User clicks "Sign in with Google"
  ↓
Expo Google OAuth flow
  ↓
Receive Google idToken
  ↓
Call nakamaService.authenticateGoogle(idToken)
  ↓
Fetch Nakama account info
  ↓
Store user + Nakama session tokens
  ↓
User authenticated
```

### Session Restore Flow

```
App starts
  ↓
Load stored session from SecureStore
  ↓
Check if Nakama session exists
  ↓
Restore session using Session.restore()
  ↓
Check if session expired
  ↓
If expired and refresh token exists → refresh session
  ↓
If refresh fails → clear session and show login
  ↓
If valid → restore user
```

### Account Linking Flow

```
User logged in as guest
  ↓
User clicks "Link Google Account"
  ↓
Google OAuth flow
  ↓
Receive Google idToken
  ↓
Call nakamaService.linkGoogle(idToken)
  ↓
Update user provider to 'google'
  ↓
Store updated user + new Nakama session
  ↓
Guest progress preserved, now Google account
```

## Environment Variables

Updated `.env` and `.env.example`:

```env
EXPO_PUBLIC_GAME_TRANSPORT=nakama
EXPO_PUBLIC_NAKAMA_HOST=nakama.urgame.live
EXPO_PUBLIC_NAKAMA_PORT=443
EXPO_PUBLIC_NAKAMA_USE_SSL=true
EXPO_PUBLIC_NAKAMA_SOCKET_SERVER_KEY=defaultkey
EXPO_PUBLIC_NAKAMA_TIMEOUT_MS=7000
```

## Error Handling

All Nakama calls are wrapped with try/catch blocks:
- Authentication failures display error messages
- Network errors are caught and reported
- Invalid sessions are cleared automatically
- Session refresh failures trigger re-authentication

## Network Safety

- All async operations include proper error handling
- Session validation on app start
- Automatic token refresh for expired sessions
- Graceful fallback to login screen on failures

## Testing

All authentication tests have been updated and pass:
- ✅ Guest authentication tests
- ✅ Session storage tests
- ✅ AuthProvider tests
- ✅ Integration tests

## Usage Example

### Basic Authentication

```typescript
import { useAuth } from '@/src/auth/useAuth';

function MyComponent() {
  const { user, loginAsGuest, loginWithGoogle, logout } = useAuth();

  return (
    <>
      {user ? (
        <>
          <Text>Welcome {user.username}!</Text>
          <Text>Nakama ID: {user.nakamaUserId}</Text>
          <Button onPress={logout}>Logout</Button>
        </>
      ) : (
        <>
          <Button onPress={loginAsGuest}>Continue as Guest</Button>
          <Button onPress={loginWithGoogle}>Sign in with Google</Button>
        </>
      )}
    </>
  );
}
```

### Account Linking

```typescript
import { useAuth } from '@/src/auth/useAuth';

function UpgradeAccount() {
  const { user, linkGoogleAccount } = useAuth();

  if (user?.provider !== 'guest') {
    return null; // Only show for guest users
  }

  return (
    <Button onPress={linkGoogleAccount}>
      Link Google Account to Save Progress
    </Button>
  );
}
```

## Next Steps

The authentication system is now ready for multiplayer features:
- User sessions are authenticated with Nakama
- Session tokens are persisted securely
- Account linking allows guest-to-permanent upgrades
- All existing tests pass
- Ready for socket connections and matchmaking

## Files Modified

- ✅ `/config/nakama.ts` - Updated default server config
- ✅ `/services/nakama.ts` - Added Google auth & account linking
- ✅ `/src/types/user.ts` - Added nakamaUserId field
- ✅ `/src/auth/sessionStorage.ts` - Added Nakama token storage
- ✅ `/src/auth/guestAuth.ts` - Integrated Nakama device auth
- ✅ `/src/auth/googleAuth.ts` - Integrated Nakama Google auth
- ✅ `/src/auth/AuthProvider.tsx` - Session restore & linking
- ✅ `/src/auth/AuthContext.tsx` - Added linking method
- ✅ `.env` & `.env.example` - Updated Nakama config
- ✅ All test files updated and passing

## Files Created

- ✅ `/src/nakama/client.ts` - Standalone Nakama client
- ✅ `/NAKAMA_AUTH_IMPLEMENTATION.md` - This documentation
