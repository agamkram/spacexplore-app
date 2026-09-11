/**
 * Starlink working-sat count. Browsers must not scrape KeepTrack.
 * Same shape as local serve-https.py /api/starlink
 */
const SRC = "https://keeptrack.space/starlink-satellite-count";
const CACHE_MS = 60 * 60 * 1000;

let mem = { at: 0, working: null, inOrbit: null };

function parseCount(html) {
  const text = String(html || "");
  const m = text.match(
    /([\d,]+)\s+Starlink satellites in orbit[\s\S]{0,120}?([\d,]+)\s+working/i
  );
  if (!m) return null;
  const inOrbit = parseInt(String(m[1]).replace(/,/g, ""), 10);
  const working = parseInt(String(m[2]).replace(/,/g, ""), 10);
  if (!Number.isFinite(working) || working < 1000) return null;
  return {
    working: working,
    inOrbit: Number.isFinite(inOrbit) ? inOrbit : working,
  };
}

async function loadFresh() {
  const res = await fetch(SRC, {
    headers: {
      Accept: "text/html",
      "User-Agent": "SpaceXplore/1.0 (https://spacexplore.markmaga.com)",
    },
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const parsed = parseCount(await res.text());
  if (!parsed) throw new Error("starlink count parse failed");
  mem = { at: Date.now(), working: parsed.working, inOrbit: parsed.inOrbit };
  return mem;
}

async function getBundle() {
  if (mem.at && Date.now() - mem.at < CACHE_MS && mem.working != null) {
    return mem;
  }
  return loadFresh();
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    "public, max-age=300, s-maxage=1800, stale-while-revalidate=600"
  );
  try {
    const b = await getBundle();
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        ok: true,
        at: b.at,
        working: b.working,
        inOrbit: b.inOrbit,
      })
    );
  } catch (err) {
    if (mem.working != null) {
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          ok: true,
          at: mem.at,
          working: mem.working,
          inOrbit: mem.inOrbit,
          stale: true,
        })
      );
      return;
    }
    res.statusCode = 502;
    res.end(
      JSON.stringify({
        ok: false,
        error: String((err && err.message) || err),
      })
    );
  }
};
