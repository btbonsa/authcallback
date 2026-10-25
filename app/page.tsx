"use client";

import { useEffect, useRef, useState } from "react";

function getParam(search: URLSearchParams, fragment: URLSearchParams, name: string) {
  return search.get(name) ?? fragment.get(name);
}

export default function HomePage() {
  const [appUrl, setAppUrl] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const currentUrl = new URL(window.location.href);
    const fragment = new URLSearchParams(currentUrl.hash.slice(1));
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
      const value = getParam(currentUrl.searchParams, fragment, name);
      if (value) callbackParams.set(name, value);
    }

    const hasSessionTokens =
      callbackParams.has("access_token") && callbackParams.has("refresh_token");
    if (!callbackParams.has("code") && !callbackParams.has("token_hash") && !hasSessionTokens) return;

    const target = `localbite://auth/callback?${callbackParams.toString()}`;
    window.history.replaceState(null, "", currentUrl.pathname);
    let openTimeout: number | undefined;
    const revealTimeout = window.setTimeout(() => {
      setAppUrl(target);
      openTimeout = window.setTimeout(() => window.location.replace(target), 250);
    }, 0);
    return () => {
      window.clearTimeout(revealTimeout);
      if (openTimeout !== undefined) window.clearTimeout(openTimeout);
    };
  }, []);

  return (
    <main className="page-shell">
      <section className="card">
        <div className="brand-mark" aria-hidden="true">
          🍲
        </div>
        <p className="eyebrow">LOCALBITE</p>
        {appUrl ? (
          <>
            <h1>Opening LocalBite…</h1>
            <p className="description">
              Your sign-in link is ready. If the app doesn’t open automatically,
              use the button below.
            </p>
            <a className="text-link" href={appUrl}>
              Open LocalBite
            </a>
          </>
        ) : (
          <>
            <h1>Email confirmation</h1>
            <p className="description">
              This page receives LocalBite email confirmation links. Open the
              newest confirmation link from your email to continue. Opening this
              page directly cannot confirm an email.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
