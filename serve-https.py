#!/usr/bin/env python3
"""Serve SpaceXplore over HTTPS on all interfaces for multi-device LAN preview.
Also proxies /api/spcx for live NASDAQ quote (browser CORS blocks finance hosts)."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.request import Request, urlopen
import json
import re
import ssl
import sys
import time

ROOT = Path(__file__).resolve().parent
DEFAULT_PORT = 8843
CERT = ROOT / ".local-cert.pem"
KEY = ROOT / ".local-key.pem"

NASDAQ_SUMMARY = (
    "https://api.nasdaq.com/api/quote/SPCX/summary?assetclass=stocks"
)
NASDAQ_INFO = "https://api.nasdaq.com/api/quote/SPCX/info?assetclass=stocks"
YAHOO_CHART = (
    "https://query1.finance.yahoo.com/v8/finance/chart/SPCX"
    "?interval=1d&range=1d"
)
# Fallback shares if market cap missing: ~13.09B from Nasdaq mcap/price
SPCX_SHARES = 13_090_854_846


def _http_json(url):
    req = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; SpaceXplore/1.0)",
            "Accept": "application/json",
        },
    )
    with urlopen(req, timeout=12) as res:
        return json.loads(res.read().decode("utf-8"))


def fetch_spcx_quote():
    price = None
    change = None
    change_pct = None
    mcap = None
    as_of = None

    try:
        info = _http_json(NASDAQ_INFO)
        pd = (info.get("data") or {}).get("primaryData") or {}
        raw = (pd.get("lastSalePrice") or "").replace("$", "").replace(",", "")
        if raw:
            price = float(raw)
        nc = (pd.get("netChange") or "").replace(",", "")
        if nc not in ("", "N/A", None):
            try:
                change = float(nc)
            except ValueError:
                pass
        pc = (pd.get("percentageChange") or "").replace("%", "").replace(",", "")
        if pc not in ("", "N/A", None):
            try:
                change_pct = float(pc)
            except ValueError:
                pass
        as_of = pd.get("lastTradeTimestamp")
    except Exception as err:
        sys.stderr.write("nasdaq info failed: %s\n" % err)

    try:
        summ = _http_json(NASDAQ_SUMMARY)
        sd = (summ.get("data") or {}).get("summaryData") or {}
        mc = (sd.get("MarketCap") or {}).get("value")
        if mc and mc != "N/A":
            mcap = float(str(mc).replace(",", ""))
        if price is None:
            prev = (sd.get("PreviousClose") or {}).get("value") or ""
            prev = prev.replace("$", "").replace(",", "")
            if prev:
                price = float(prev)
    except Exception as err:
        sys.stderr.write("nasdaq summary failed: %s\n" % err)

    if price is None:
        try:
            chart = _http_json(YAHOO_CHART)
            meta = (chart.get("chart") or {}).get("result") or [{}]
            meta = (meta[0] or {}).get("meta") or {}
            if meta.get("regularMarketPrice") is not None:
                price = float(meta["regularMarketPrice"])
            prev = meta.get("chartPreviousClose")
            if prev is not None and price is not None and change is None:
                change = price - float(prev)
                if float(prev):
                    change_pct = 100.0 * change / float(prev)
        except Exception as err:
            sys.stderr.write("yahoo chart failed: %s\n" % err)

    if mcap is None and price is not None:
        mcap = price * SPCX_SHARES

    if price is None:
        return None

    return {
        "symbol": "SPCX",
        "price": price,
        "change": change,
        "changePct": change_pct,
        "marketCap": mcap,
        "asOf": as_of,
        "currency": "USD",
    }


LL2 = "https://ll.thespacedevs.com/2.2.0"
LL2_CACHE_MS = 12 * 60 * 1000
_ll2_mem = {"at": 0, "upcoming": [], "previous": [], "previousOk": False, "agency": None}


def _ll2_json(url):
    req = Request(
        url,
        headers={
            "User-Agent": "SpaceXplore/1.0 (https://spacexplore.markmaga.com)",
            "Accept": "application/json",
        },
    )
    with urlopen(req, timeout=20) as res:
        return json.loads(res.read().decode("utf-8"))


def _ll2_paged(url, max_pages=4):
    acc = []
    nxt = url
    for _ in range(max_pages):
        if not nxt:
            break
        data = _ll2_json(nxt)
        acc.extend(data.get("results") or [])
        nxt = data.get("next")
    return acc


def fetch_ll2_bundle():
    import datetime
    import time
    from urllib.parse import quote

    now = int(time.time() * 1000)
    if (
        _ll2_mem["at"]
        and now - _ll2_mem["at"] < LL2_CACHE_MS
        and _ll2_mem["upcoming"]
    ):
        return _ll2_mem
    y0 = "%d-01-01T00:00:00Z" % datetime.datetime.utcnow().year
    up = _ll2_json(
        LL2
        + "/launch/upcoming/?lsp__id=121&limit=40&mode=detailed&ordering=net"
    )
    upcoming = up.get("results") or []
    previous = _ll2_mem["previous"] or []
    previous_ok = False
    try:
        qprev = (
            LL2
            + "/launch/previous/?lsp__id=121&net__gte="
            + quote(y0)
            + "&limit=100&mode=detailed&ordering=-net"
        )
        previous = _ll2_paged(qprev, 4)
        previous_ok = True
    except Exception as err:
        sys.stderr.write("ll2 previous failed: %s\n" % err)
        previous_ok = bool(_ll2_mem["previousOk"] and _ll2_mem["previous"])
        previous = _ll2_mem["previous"] or []
    agency = _ll2_mem["agency"]
    try:
        agency = _ll2_json(LL2 + "/agencies/121/")
    except Exception as err:
        sys.stderr.write("ll2 agency failed: %s\n" % err)
        agency = _ll2_mem["agency"]
    _ll2_mem.update(
        {
            "at": now,
            "upcoming": upcoming,
            "previous": previous,
            "previousOk": previous_ok,
            "agency": agency,
        }
    )
    return _ll2_mem


STARLINK_COUNT_URL = "https://keeptrack.space/starlink-satellite-count"
STARLINK_CACHE_MS = 60 * 60 * 1000
_starlink_mem = {"at": 0, "working": None, "inOrbit": None}


def parse_starlink_count(html):
    m = re.search(
        r"([\d,]+)\s+Starlink satellites in orbit[\s\S]{0,120}?([\d,]+)\s+working",
        html or "",
        re.I,
    )
    if not m:
        return None
    try:
        in_orbit = int(m.group(1).replace(",", ""))
        working = int(m.group(2).replace(",", ""))
    except ValueError:
        return None
    if working < 1000:
        return None
    return {"working": working, "inOrbit": in_orbit}


def fetch_starlink_count():
    now = int(time.time() * 1000)
    if (
        _starlink_mem["at"]
        and now - _starlink_mem["at"] < STARLINK_CACHE_MS
        and _starlink_mem["working"] is not None
    ):
        return _starlink_mem
    req = Request(
        STARLINK_COUNT_URL,
        headers={
            "User-Agent": "SpaceXplore/1.0 (https://spacexplore.markmaga.com)",
            "Accept": "text/html",
        },
    )
    with urlopen(req, timeout=20) as res:
        html = res.read().decode("utf-8", "replace")
    parsed = parse_starlink_count(html)
    if not parsed:
        raise RuntimeError("starlink count parse failed")
    _starlink_mem.update(
        {"at": now, "working": parsed["working"], "inOrbit": parsed["inOrbit"]}
    )
    return _starlink_mem


class Handler(SimpleHTTPRequestHandler):
    # HTTP/1.1 keep-alive on ThreadingHTTPServer leaks a thread per idle
    # client until the process accepts sockets and answers nothing (curl 000).
    protocol_version = "HTTP/1.0"
    timeout = 8

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path == "/api/ll2" or path == "/api/ll2/":
            try:
                b = fetch_ll2_bundle()
                body = json.dumps(
                    {
                        "ok": True,
                        "at": b["at"],
                        "upcoming": b["upcoming"],
                        "previous": b["previous"],
                        "previousOk": b["previousOk"],
                        "agency": b["agency"],
                    }
                ).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            except Exception as err:
                body = json.dumps({"ok": False, "error": str(err)}).encode("utf-8")
                self.send_response(502)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            return
        if path == "/api/starlink" or path == "/api/starlink/":
            try:
                b = fetch_starlink_count()
                body = json.dumps(
                    {
                        "ok": True,
                        "at": b["at"],
                        "working": b["working"],
                        "inOrbit": b["inOrbit"],
                    }
                ).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            except Exception as err:
                if _starlink_mem["working"] is not None:
                    body = json.dumps(
                        {
                            "ok": True,
                            "at": _starlink_mem["at"],
                            "working": _starlink_mem["working"],
                            "inOrbit": _starlink_mem["inOrbit"],
                            "stale": True,
                        }
                    ).encode("utf-8")
                    self.send_response(200)
                else:
                    body = json.dumps({"ok": False, "error": str(err)}).encode("utf-8")
                    self.send_response(502)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            return
        if path == "/api/spcx" or path == "/api/spcx/":
            try:
                quote = fetch_spcx_quote()
                if not quote:
                    raise RuntimeError("no quote")
                body = json.dumps({"ok": True, "quote": quote}).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            except Exception as err:
                body = json.dumps(
                    {"ok": False, "error": str(err)}
                ).encode("utf-8")
                self.send_response(502)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            return
        # Explicit PNG touch-icon responses — iOS is picky about probes
        if path.startswith("/apple-touch-icon") or path in (
            "/icon-192.png",
            "/icon-512.png",
        ):
            rel = path.lstrip("/")
            fp = ROOT / rel
            if fp.is_file():
                data = fp.read_bytes()
                self.send_response(200)
                self.send_header("Content-Type", "image/png")
                self.send_header("Cache-Control", "public, max-age=86400")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
                return
        return super().do_GET()

    def end_headers(self):
        path = (self.path or "").split("?", 1)[0].lower()
        # iOS A2HS needs a cacheable apple-touch-icon — no-store → letter glyph
        if path.endswith(
            (
                ".png",
                ".jpg",
                ".jpeg",
                ".webp",
                ".ico",
                ".webmanifest",
            )
        ) or path.endswith("manifest.webmanifest"):
            self.send_header("Cache-Control", "public, max-age=86400")
        else:
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


def _lan_ips():
    ips = []
    try:
        import socket

        hostname = socket.gethostname()
        for info in socket.getaddrinfo(hostname, None, socket.AF_INET):
            ip = info[4][0]
            if ip and not ip.startswith("127.") and ip not in ips:
                ips.append(ip)
    except Exception:
        pass
    return ips


def main():
    mode = "https"
    argv = [a for a in sys.argv[1:] if a]
    port = DEFAULT_PORT
    if argv and argv[0] in ("--http", "http"):
        mode = "http"
        argv = argv[1:]
    if argv:
        port = int(argv[0])

    httpd = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    lan = _lan_ips()
    lan_hint = lan[0] if lan else "<this-mac-ip>"

    if mode == "https":
        if not CERT.exists() or not KEY.exists():
            print("Missing .local-cert.pem / .local-key.pem", file=sys.stderr)
            sys.exit(1)
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ctx.load_cert_chain(certfile=str(CERT), keyfile=str(KEY))
        httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)
        print("SpaceXplore HTTPS")
        print(f"  Local:  https://127.0.0.1:{port}/")
        print(f"  LAN:    https://{lan_hint}:{port}/")
        print("  Self-signed: iOS often still uses letter 'S' for A2HS.")
        print("  For a real home-screen icon locally, use HTTP mode instead:")
        print(f"    python3 serve-https.py --http {port + 1}")
    else:
        print("SpaceXplore HTTP (use this for Add to Home Screen icon test)")
        print(f"  Local:  http://127.0.0.1:{port}/")
        print(f"  LAN:    http://{lan_hint}:{port}/")
        print("  Open this URL on the phone, wait for the page, then Share → Add to Home Screen.")

    print(f"  Quote:  /api/spcx")
    print(f"  Dir:    {ROOT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")


if __name__ == "__main__":
    main()
