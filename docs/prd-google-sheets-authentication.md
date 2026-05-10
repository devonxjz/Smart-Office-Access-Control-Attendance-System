---
labels: needs-triage, feature, auth
title: Implement Google Sheets Authentication for Login
---

## Problem Statement

The current login page (`Login.tsx`) uses a hardcoded authentication mechanism, navigating any user to the dashboard after a 600ms timeout regardless of the credentials entered. The user has now added a `password` column to the `Employee` Google Sheet. We need to implement a real authentication process that verifies the provided email/username and password against the Google Sheet records. To ensure security, passwords must not be stored or transmitted in plain-text, and the system must prevent brute-force or spam requests that could exhaust the Google Apps Script quota.

## Solution

We will implement a secure authentication flow:
1. **Client-side Hashing:** The frontend will hash the entered password (using SHA-256) before sending it to the backend.
2. **Backend Verification:** A new Google Apps Script endpoint will verify the hashed password against the stored hash in the `Employee` Google Sheet.
3. **Session Management:** We will use `sessionStorage` so that the login state is automatically cleared when the user closes the browser tab.
4. **Rate Limiting:** A 3-5 second cooldown will be enforced on the UI after a failed login attempt to prevent spamming.

## User Stories

1. As a system user, I want to enter my registered email and password in the login form, so that I can securely authenticate.
2. As a system user, I want to see a clear error message (e.g., "Sai tài khoản hoặc mật khẩu") if I enter incorrect credentials.
3. As a system user, I want my session to expire automatically when I close the browser tab, so that my account remains secure on shared devices.
4. As a security-conscious administrator, I want password verification to happen on the server using hashed passwords (SHA-256), so that passwords are never exposed in plain-text in the database or during transmission.
5. As an administrator, I want the system to enforce a cooldown (3-5 seconds) after a failed login attempt, so that the Google Apps Script quota is protected from spam.

## Implementation Decisions

- **Security & Hashing:**
  - Passwords stored in the Google Sheet `password` column must be pre-hashed (SHA-256).
  - The React frontend will use the Web Crypto API (`crypto.subtle.digest`) to hash the user's password input before sending the API request.

- **API Layer (Google Apps Script):**
  - Create a new action endpoint: `?action=login`.
  - Accepts a request containing `email` and `hashedPassword`.
  - The script will read the `Employee` sheet, find the matching email, and perform a strict equality check on the `hashedPassword`.
  - Returns `{ success: true, data: { name, role, email } }` or `{ success: false, message: "Invalid credentials" }`.

- **UI Updates & Rate Limiting (`src/components/auth/Login.tsx`):**
  - Replace hardcoded defaults with React state (`useState`) for email and password inputs.
  - Implement a 3-5 second cooldown state (`cooldownRemaining`) that disables the submit button if the previous login attempt failed.
  - Display an error message and the cooldown countdown to the user.

- **Session Management & Routing:**
  - On successful login, store the user data in `sessionStorage` instead of `localStorage`.
  - Implement a `ProtectedRoute` wrapper for `/dashboard` that checks `sessionStorage` and redirects to `/` if unauthenticated.

## Testing Decisions

- **Unit Testing `Login.tsx`:**
  - Mock `GoogleSheetsClient` and `crypto.subtle.digest`.
  - Assert that a failed response renders an error message and triggers the 3-5s cooldown.
  - Assert that the submit button remains disabled during the cooldown period.
  - Assert that a successful response triggers `sessionStorage.setItem` and `navigate("/dashboard")`.
  
- **Unit Testing `google-sheets.client.ts`:**
  - Add tests for the new `authenticate` method to ensure the payload is correctly formatted and sent.

## Out of Scope

- "Forgot password" flow (email recovery).
- NFC login integration (this will be handled in a separate hardware integration PRD).
- Complex JWT token issuance (a simple session state in `sessionStorage` is sufficient for this prototype).

## Further Notes

- Relying on Google Sheets as an authentication database introduces slight latency. The UI must handle this gracefully with clear loading states.
