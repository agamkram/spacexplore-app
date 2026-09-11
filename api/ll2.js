/**
 * Shared Launch Library 2 cache. Browsers must not hit LL2 directly
 * (free-tier 429s after publish). Same shape as local serve-https.py /api/ll2
 */
const LL2 = "https://ll.thespacedevs.com/2.2.0";
const LSP = 121;
const CACHE_MS = 12 * 60 * 1000;

let mem = {
  at: 0,
  upcoming: [],
  previous: [],
  previousOk: false,
  agency: null,
};

function yearStartIso() {
  return new Date().getUTCFullYear() + "-01-01T00:00:00Z";
}

async function getJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "SpaceXplore/1.0 (https://spacexplore.markmaga.com)",
    },
  });
  if (!res.ok) throw new Error("HTTP " + res.status + " " + url);
  return res.json();
}

async function fetchPaged(url, maxPages) {
  let acc = [];
  let next = url;
  for (let i = 0; i < maxPages && next; i++) {
    const data = await getJson(next);
    acc = acc.concat(data.results || []);
    next = data.next || null;
  }
  return acc;
}

async function loadFresh() {
  const y0 = yearStartIso();
  const qUpcoming =
    LL2 +
    "/launch/upcoming/?lsp__id=" +
    LSP +
    "&limit=40&mode=detailed&ordering=net";
  const qPrevious =
    LL2 +
    "/launch/previous/?lsp__id=" +
    LSP +
    "&net__gte=" +
    encodeURIComponent(y0) +
    "&limit=100&mode=detailed&ordering=-net";
  const qAgency = LL2 + "/agencies/" + LSP + "/";

  const up = await getJson(qUpcoming);
  const upcoming = up.results || [];

  let previous = mem.previous || [];
  let previousOk = false;
  try {
    previous = await fetchPaged(qPrevious, 4);
    previousOk = true;
  } catch (_) {
    previousOk = !!(mem.previousOk && mem.previous && mem.previous.length);
    previous = previousOk ? mem.previous : [];
  }

  let agency = mem.agency;
  try {
    agency = await getJson(qAgency);
  } catch (_) {
    agency = mem.agency || null;
  }

  mem = {
    at: Date.now(),
    upcoming: upcoming,
    previous: previous,
    previousOk: previousOk,
    agency: agency,
  };
  return mem;
}

async function getBundle() {
  if (mem.at && Date.now() - mem.at < CACHE_MS && mem.upcoming && mem.upcoming.length) {
    return mem;
  }
  return loadFresh();
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    "public, max-age=60, s-maxage=180, stale-while-revalidate=60"
  );
  try {
    const b = await getBundle();
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        ok: true,
        at: b.at,
        upcoming: b.upcoming,
        previous: b.previous,
        previousOk: b.previousOk,
        agency: b.agency,
      })
    );
  } catch (err) {
    if (mem.upcoming && mem.upcoming.length) {
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          ok: true,
          at: mem.at,
          upcoming: mem.upcoming,
          previous: mem.previous,
          previousOk: mem.previousOk,
          agency: mem.agency,
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
