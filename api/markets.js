/**
 * Starlink markets count from the public availability file.
 * Browser CORS blocks starlink.com — same pattern as /api/starlink.
 */
const SRC = "https://www.starlink.com/public-files/availability.json";
const CACHE_MS = 60 * 60 * 1000;

let mem = { at: 0, markets: null };

async function loadFresh() {
  const res = await fetch(SRC, {
    headers: {
      Accept: "application/json",
      "User-Agent": "SpaceXplore/1.0 (https://spacexplore.markmaga.com)",
    },
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  const a0 = (data && data.admin0) || {};
  let live = 0;
  Object.keys(a0).forEach(function (code) {
    const st = a0[code] && a0[code].status;
    if (st === "available" || st === "launched") live++;
  });
  if (!live) throw new Error("markets parse failed");
  mem = { at: Date.now(), markets: live };
  return mem;
}

async function getBundle() {
  if (mem.at && Date.now() - mem.at < CACHE_MS && mem.markets != null) {
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
        markets: b.markets,
      })
    );
  } catch (err) {
    if (mem.markets != null) {
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          ok: true,
          at: mem.at,
          markets: mem.markets,
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
