"use client";

import { useEffect, useSyncExternalStore } from "react";

type ConfirmationState =
  | { status: "checking" }
  | { status: "opening"; appUrl: string }
  | { status: "error"; message: string };

const checking: ConfirmationState = { status: "checking" };
const subscribe = () => () => {};
let cachedLocation: string | null = null;
let cachedConfirmation: ConfirmationState = checking;

function getConfirmationState(): ConfirmationState {
  const currentUrl = new URL(window.location.href);
  const locationKey = currentUrl.href;
  if (cachedLocation === locationKey) return cachedConfirmation;

  const fragment = new URLSearchParams(currentUrl.hash.slice(1));
  const errorDescription =
    fragment.get("error_description") ??
    currentUrl.searchParams.get("error_description");
  const errorCode = fragment.get("error_code") ?? currentUrl.searchParams.get("error_code");

  cachedLocation = locationKey;
  if (errorDescription) {
    cachedConfirmation = {
      status: "error",
      message: `${errorCode ? `${errorCode}: ` : ""}${errorDescription}`,
    };
    return cachedConfirmation;
  }

  const callbackParams = new URLSearchParams();
  for (const name of [
    "code",
    "token_hash",
    "type",
    "access_token",
    "refresh_token",
    "error",
    "error_code",
    "error_description",
  ]) {
    const value = currentUrl.searchParams.get(name) ?? fragment.get(name);
    if (value) callbackParams.set(name, value);
  }

  const tokenType = callbackParams.get("type");
  const hasEmailToken =
    callbackParams.has("token_hash") &&
    (tokenType === "signup" || tokenType === "email" || tokenType === "magiclink");

  if (
    callbackParams.has("code") ||
    hasEmailToken ||
    (callbackParams.has("access_token") && callbackParams.has("refresh_token"))
  ) {
    cachedConfirmation = {
      status: "opening",
      appUrl: `localbite://auth/callback?${callbackParams.toString()}`,
    };
  } else {
    cachedConfirmation = {
      status: "error",
      message:
        "This link may have expired or already been used. Return to LocalBite to sign in, or request a new confirmation email.",
    };
  }
  return cachedConfirmation;
}

export default function AuthCallbackPage() {
  const confirmation = useSyncExternalStore(
    subscribe,
    getConfirmationState,
    () => checking,
  );

  useEffect(() => {
    if (confirmation.status !== "opening") return;

    const timeout = window.setTimeout(() => {
      window.history.replaceState(
        null,
        "",
        window.location.pathname,
      );
      window.location.replace(confirmation.appUrl);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [confirmation]);

  return (
    <main className="page-shell">
      <section className="card" aria-live="polite">
        <div className="brand-mark" aria-hidden="true">
          {confirmation.status === "opening" ? "✓" : "🍲"}
        </div>
        <p className="eyebrow">LOCALBITE</p>
        {confirmation.status === "checking" ? (
          <>
            <h1>Checking your email link…</h1>
            <p className="description">Please wait a moment.</p>
          </>
        ) : confirmation.status === "opening" ? (
          <>
            <h1>Opening LocalBite…</h1>
            <p className="description">
              Your sign-in link is ready. If the app doesn’t open automatically,
              use the button below.
            </p>
            <a className="text-link" href={confirmation.appUrl}>
              Open LocalBite
            </a>
          </>
        ) : (
          <>
            <h1>We couldn’t confirm this link</h1>
            <p className="description">{confirmation.message}</p>
            <p className="hint">
              For your security, confirmation tokens are removed from the browser address bar.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
