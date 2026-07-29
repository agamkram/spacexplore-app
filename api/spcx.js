/**
 * Vercel serverless: live SPCX price + market cap (NASDAQ).
 * Same shape as local serve-https.py /api/spcx
 */
const NASDAQ_SUMMARY =
  "https://api.nasdaq.com/api/quote/SPCX/summary?assetclass=stocks";
const NASDAQ_INFO =
  "https://api.nasdaq.com/api/quote/SPCX/info?assetclass=stocks";
const YAHOO_CHART =
  "https://query1.finance.yahoo.com/v8/finance/chart/SPCX?interval=1d&range=1d";
const SPCX_SHARES = 13_090_854_846;

async function getJson(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; SpaceXplore/1.0)",
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error("HTTP " + res.status + " " + url);
  return res.json();
}

async function fetchSpcxQuote() {
  let price = null;
  let change = null;
  let changePct = null;
  let mcap = null;
  let asOf = null;

  try {
    const info = await getJson(NASDAQ_INFO);
    const pd = (info.data && info.data.primaryData) || {};
    const raw = String(pd.lastSalePrice || "")
      .replace("$", "")
      .replace(/,/g, "");
    if (raw) price = parseFloat(raw);
    const nc = String(pd.netChange || "").replace(/,/g, "");
    if (nc && nc !== "N/A") change = parseFloat(nc);
    const pc = String(pd.percentageChange || "")
      .replace("%", "")
      .replace(/,/g, "");
    if (pc && pc !== "N/A") changePct = parseFloat(pc);
    asOf = pd.lastTradeTimestamp || null;
  } catch (_) {}

  try {
    const summ = await getJson(NASDAQ_SUMMARY);
    const sd = (summ.data && summ.data.summaryData) || {};
    const mc = sd.MarketCap && sd.MarketCap.value;
    if (mc && mc !== "N/A") mcap = parseFloat(String(mc).replace(/,/g, ""));
    if (price == null && sd.PreviousClose && sd.PreviousClose.value) {
      const prev = String(sd.PreviousClose.value)
        .replace("$", "")
        .replace(/,/g, "");
      if (prev) price = parseFloat(prev);
    }
  } catch (_) {}

  if (price == null) {
    try {
      const chart = await getJson(YAHOO_CHART);
      const meta =
        chart.chart &&
        chart.chart.result &&
        chart.chart.result[0] &&
        chart.chart.result[0].meta;
      if (meta && meta.regularMarketPrice != null) {
        price = Number(meta.regularMarketPrice);
      }
      if (
        meta &&
        meta.chartPreviousClose != null &&
        price != null &&
        change == null
      ) {
        change = price - Number(meta.chartPreviousClose);
        if (meta.chartPreviousClose) {
          changePct = (100 * change) / Number(meta.chartPreviousClose);
        }
      }
    } catch (_) {}
  }

  if (mcap == null && price != null) mcap = price * SPCX_SHARES;
  if (price == null) return null;

  return {
    symbol: "SPCX",
    price,
    change,
    changePct,
    marketCap: mcap,
    asOf,
    currency: "USD",
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  try {
    const quote = await fetchSpcxQuote();
    if (!quote) {
      res.statusCode = 502;
      res.end(JSON.stringify({ ok: false, error: "no quote" }));
      return;
    }
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, quote }));
  } catch (err) {
    res.statusCode = 502;
    res.end(JSON.stringify({ ok: false, error: String(err && err.message || err) }));
  }
};
