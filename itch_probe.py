#!/usr/bin/env python
"""itch_probe.py — single-shot probe gate for itch.io signup availability.

Run FIRST before any signup/browser attempt (kanban task t_e85d1bfd).
Repeated hits compound the OpenResty/Cloudflare IP block, so this script
probes each endpoint exactly once, never retries, never opens a browser.

Exit codes:
  0  GATE OPEN    — /account/signup returned HTTP 200 without redirect;
                    safe to attempt the real-browser signup path
  2  RATE-LIMITED — any endpoint returned 429; back off (re-park the card),
                    do NOT touch signup
  3  UNKNOWN      — other status / redirect / network error; treat as closed

Appends one JSON line per run to evidence/probe-history.jsonl.
Stdlib only; no credentials; no money.
"""
import datetime
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
ENDPOINTS = {
    "home": "https://itch.io/",
    "profile": "https://itch.io/@derbaroser/",
    "signup": "https://itch.io/account/signup",
}


def probe(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.status, r.geturl()
    except urllib.error.HTTPError as e:
        return e.code, url
    except Exception as e:  # network error, TLS, timeout
        return None, f"{type(e).__name__}: {e}"


def main():
    now = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    results = {}
    for name, url in ENDPOINTS.items():
        code, final = probe(url)
        results[name] = {"url": url, "http": code, "final": final}
        print(f"{name}: {url} -> http={code}")

    codes = [r["http"] for r in results.values()]
    signup = results["signup"]
    if any(c == 429 for c in codes):
        gate, rc = "RATE_LIMITED", 2
    elif signup["http"] == 200 and "/account/signup" in str(signup["final"]):
        gate, rc = "OPEN", 0
    else:
        gate, rc = "UNKNOWN", 3

    account_exists = None
    if results["profile"]["http"] == 200:
        account_exists = True
    elif results["profile"]["http"] == 404:
        account_exists = False

    rec = {"ts": now, "gate": gate, "rc": rc,
           "account_exists": account_exists, "probes": results}
    ev = Path(__file__).resolve().parent / "evidence"
    ev.mkdir(exist_ok=True)
    with (ev / "probe-history.jsonl").open("a", encoding="utf-8") as f:
        f.write(json.dumps(rec) + "\n")
    print(f"GATE={gate} rc={rc} account_exists={account_exists}")
    return rc


if __name__ == "__main__":
    sys.exit(main())
