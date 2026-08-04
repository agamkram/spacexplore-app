/**
 * SpaceXplore live data — LL2 + Open-Meteo + Starlink availability.
 * Merges into SPACEHUB_DATA; keeps last desk data if the network fails.
 * LL2: The Space Devs. Starlink markets: starlink.com public availability.
 */
(function (global) {
  "use strict";

  const LL2 = "https://ll.thespacedevs.com/2.2.0";
  const LSP_SPACEX = 121;
  const STARLINK_AVAIL =
    "https://www.starlink.com/public-files/availability.json";
  const CACHE_MS = 12 * 60 * 1000; /* ~12 min — polite for free tier */
  const WX_CACHE_MS = 20 * 60 * 1000;
  const MARKETS_CACHE_MS = 6 * 60 * 60 * 1000; /* 6 h */

  let cache = {
    at: 0,
    agency: null,
    upcoming: [],
    previous: [],
    markets: null,
    marketsAt: 0,
  };
  let wxCache = {}; /* key lat,lon -> { at, data } */

  const PROG_ORDER = [
    "machine",
    "falcon9",
    "heavy",
    "starship",
    "dragon",
    "starlink",
  ];

  function yearStartIso() {
    const y = new Date().getUTCFullYear();
    return y + "-01-01T00:00:00Z";
  }

  function fetchJson(url) {
    const ctrl =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer =
      ctrl &&
      setTimeout(function () {
        try {
          ctrl.abort();
        } catch (_) {}
      }, 20000);
    return fetch(url, {
      headers: { Accept: "application/json" },
      signal: ctrl ? ctrl.signal : undefined,
    })
      .then(function (res) {
        if (timer) clearTimeout(timer);
        if (!res.ok) throw new Error("HTTP " + res.status + " " + url);
        return res.json();
      })
      .catch(function (err) {
        if (timer) clearTimeout(timer);
        throw err;
      });
  }

  function cfgName(launch) {
    const c = (launch.rocket && launch.rocket.configuration) || {};
    return c.full_name || c.name || "";
  }

  function missionName(launch) {
    if (launch.mission && launch.mission.name) return launch.mission.name;
    const n = launch.name || "";
    const parts = n.split("|");
    return (parts[1] || parts[0] || n).trim();
  }

  function isFalcon9(launch) {
    const n = cfgName(launch);
    return /Falcon\s*9/i.test(n) && !/Heavy/i.test(n);
  }

  function isHeavy(launch) {
    return /Heavy/i.test(cfgName(launch));
  }

  function isStarship(launch) {
    return /Starship/i.test(cfgName(launch)) || /Starship/i.test(launch.name || "");
  }

  function isFalconFamily(launch) {
    return isFalcon9(launch) || isHeavy(launch);
  }

  function isStarlink(launch) {
    const n = (launch.name || "") + " " + missionName(launch);
    return /Starlink/i.test(n);
  }

  function isDragon(launch) {
    const n = (launch.name || "") + " " + missionName(launch);
    const stages = (launch.rocket && launch.rocket.spacecraft_stage) || [];
    if (stages.length) {
      const sn = JSON.stringify(stages);
      if (/Dragon/i.test(sn)) return true;
    }
    return /Dragon|Crew-\d|CRS-|Ax-\d|Axiom/i.test(n);
  }

  function precisionFromLaunch(launch) {
    const p = launch.net_precision;
    if (!p) return "hour";
    const a = (p.abbrev || p.name || "").toUpperCase();
    if (a === "MIN" || /MINUTE/i.test(a)) return "minute";
    if (a === "HR" || /HOUR/i.test(a)) return "hour";
    if (a === "DAY" || /DAY/i.test(a)) return "day";
    if (a === "QTR" || /QUARTER|MONTH|YEAR/i.test(a)) return "month";
    return "hour";
  }

  function statusLabel(launch) {
    const s = (launch.status && launch.status.name) || "";
    if (/Go for Launch/i.test(s)) return "Go";
    if (/Hold/i.test(s)) return "Hold";
    if (/In Flight/i.test(s)) return "In flight";
    if (/Partial/i.test(s)) return "Partial";
    if (/Success/i.test(s)) return "Success";
    if (/Fail/i.test(s)) return "Failure";
    if (/TBD|To Be Determined/i.test(s)) return "TBC";
    if (/TBC|To Be Confirmed/i.test(s)) return "TBC";
    return s || "TBC";
  }

  function webcastUrl(launch) {
    const vids = launch.vidURLs || launch.vid_urls || [];
    if (vids.length) {
      const sorted = vids.slice().sort(function (a, b) {
        return (a.priority || 99) - (b.priority || 99);
      });
      return sorted[0].url || null;
    }
    return null;
  }

  function mapSiteId(padName, locationName) {
    const s = ((padName || "") + " " + (locationName || "")).toLowerCase();
    if (/slc-?6|slick.?six|6 west|complex 6/.test(s)) return "slc6";
    if (/slc-?37|complex 37/.test(s)) return "slc37";
    if (/39a|lc-39a|launch complex 39a/.test(s)) {
      if (/starship|ship|super.?heavy/i.test(s)) return "39a-ship";
      return "39a";
    }
    if (/slc-?40|complex 40/.test(s)) return "slc40";
    if (/slc-?4e|4 east/.test(s)) return "slc4e";
    if (/slc-?4w|4 west|lz-?4|landing zone 4/.test(s)) return "lz4";
    if (/pad\s*1|olp-?1|olit-?1/.test(s)) return "starbase-pad1";
    if (/starbase|boca chica|olp|pad\s*2|pad a|orbital launch/.test(s)) {
      return "starbase-pad2";
    }
    if (/vandenberg|vsfb|vafb/.test(s)) return "slc4e";
    if (/kennedy|ksc/.test(s)) return "39a";
    if (/cape canaveral|ccsfs/.test(s)) return "slc40";
    return null;
  }

  /** Short pad codes only: LC-39A · SLC-40 · SLC-4E · Pad 2 */
  function padLabel(pad) {
    if (!pad) return "—";
    const name = pad.name || "";
    const loc = (pad.location && pad.location.name) || "";
    const s = name + " " + loc;
    if (/39A|Launch Complex 39A/i.test(s) || (/Kennedy|KSC/i.test(s) && !/40|37/i.test(s))) {
      return "LC-39A";
    }
    if (/SLC-?40|Complex 40/i.test(s)) return "SLC-40";
    if (/SLC-?37|Complex 37/i.test(s)) return "SLC-37";
    if (/SLC-?6|Slick.?Six|Complex 6/i.test(s)) return "SLC-6";
    if (/4E|4 East|SLC-?4E/i.test(s)) return "SLC-4E";
    if (/4W|4 West|SLC-?4W|LZ-?4/i.test(s)) return "LZ-4";
    if (/Pad\s*1|OLP-?1|OLIT-?1/i.test(s)) return "Pad 1";
    if (/Starbase|Boca Chica|OLP|Pad 2|Orbital Launch/i.test(s)) return "Pad 2";
    if (/Vandenberg|VSFB|VAFB/i.test(s)) return "SLC-4E";
    if (/Kennedy|KSC/i.test(s)) return "LC-39A";
    if (/CCSFS|Cape Canaveral/i.test(s)) return "SLC-40";
    return name || loc || "—";
  }

  function padShort(pad) {
    return padLabel(pad);
  }

  function padWxKey(pad) {
    return padLabel(pad);
  }

  function programIdForLaunch(launch) {
    /* Order: Ship / Heavy / Dragon / Starlink before generic F9 */
    if (isStarship(launch)) return "starship";
    if (isHeavy(launch)) return "heavy";
    if (isDragon(launch)) return "dragon";
    if (isStarlink(launch)) return "starlink";
    if (isFalcon9(launch)) return "falcon9";
    return "machine";
  }

  function launchToNext(launch) {
    const pad = launch.pad || {};
    const loc = pad.location || {};
    const rocket = (launch.rocket && launch.rocket.configuration) || {};
    const mission = launch.mission || {};
    const orbit = (mission.orbit && mission.orbit.name) || "";
    const mtype = mission.type || "";
    const siteId = mapSiteId(pad.name, loc.name);
    const prec = precisionFromLaunch(launch);
    return {
      name: missionName(launch),
      rocket: rocket.full_name || rocket.name || "",
      pad: padShort(pad),
      siteId: siteId,
      programId: programIdForLaunch(launch),
      net: launch.net,
      windowEnd: launch.window_end || null,
      windowStart: launch.window_start || null,
      precision: prec,
      status: statusLabel(launch),
      statusNote: launch.holdreason || launch.weather_concerns || "",
      webcast: webcastUrl(launch),
      missionType: [mtype, orbit].filter(Boolean).join(" · ") || "",
      probability: launch.probability,
      weather_concerns: launch.weather_concerns,
      padLat: pad.latitude != null ? Number(pad.latitude) : null,
      padLon: pad.longitude != null ? Number(pad.longitude) : null,
      _raw: launch,
    };
  }

  function filterUpcoming(list, programId) {
    return list.filter(function (L) {
      if (programId === "machine" || programId === "fleet") return true;
      if (programId === "falcon9") return isFalcon9(L);
      if (programId === "heavy") return isHeavy(L);
      if (programId === "starship") return isStarship(L);
      if (programId === "dragon") return isDragon(L);
      if (programId === "starlink") return isStarlink(L);
      return true;
    });
  }

  function filterPrevious(list, programId) {
    return filterUpcoming(list, programId);
  }

  function padBlob(launch) {
    const pad = launch.pad || {};
    const loc = (pad.location && pad.location.name) || "";
    return (pad.name || "") + " " + loc;
  }

  /** East (FL) vs West (CA) for Falcon coastal split */
  function isWestCoast(launch) {
    return /Vandenberg|VSFB|VAFB|4E|4W|California/i.test(padBlob(launch));
  }

  function isCrewDragon(launch) {
    const n = (launch.name || "") + " " + missionName(launch);
    return /Crew-\d|Crew Dragon|Axiom|Ax-\d|Polaris|Fram2/i.test(n);
  }

  function isCargoDragon(launch) {
    return isDragon(launch) && !isCrewDragon(launch);
  }

  function isRideshare(launch) {
    const n = (launch.name || "") + " " + missionName(launch);
    return /Transporter|Bandwagon|Rideshare/i.test(n);
  }

  function cadencePerWeek(ytd) {
    if (!ytd) return "—";
    return ((ytd / Math.max(1, dayOfYear())) * 7).toFixed(1) + " /wk";
  }

  function computeStats(previous, agency) {
    const ytd = previous.length;
    let f9 = 0,
      fh = 0,
      ship = 0,
      sl = 0,
      drag = 0,
      crew = 0,
      cargo = 0,
      rideshare = 0,
      east = 0,
      west = 0;
    let reuseNum = 0,
      reuseDen = 0;
    let landOk = 0,
      landAtt = 0;
    let success = 0;
    let topFlights = 0;
    let topSerial = "";

    previous.forEach(function (L) {
      if (isStarship(L)) ship++;
      else if (isHeavy(L)) fh++;
      else if (isFalcon9(L)) f9++;
      if (isStarlink(L)) sl++;
      if (isDragon(L)) {
        drag++;
        if (isCrewDragon(L)) crew++;
        else cargo++;
      }
      if (isRideshare(L)) rideshare++;
      if (isFalconFamily(L)) {
        if (isWestCoast(L)) west++;
        else east++;
      }

      const st = (L.status && L.status.name) || "";
      if (/Success/i.test(st)) success++;

      if (isFalconFamily(L)) {
        const stages = (L.rocket && L.rocket.launcher_stage) || [];
        if (stages.length) {
          reuseDen++;
          const reflown = stages.some(function (s) {
            if (s.reused === true || s.reused === 1 || s.reused === "true") {
              return true;
            }
            const launcher = s.launcher || {};
            const flights =
              launcher.flights != null
                ? Number(launcher.flights)
                : s.launcher_flight_number != null
                  ? Number(s.launcher_flight_number)
                  : null;
            /* flights counts this mission — >1 means booster had prior flights */
            return Number.isFinite(flights) && flights > 1;
          });
          if (reflown) reuseNum++;
        }
        stages.forEach(function (s) {
          const land = s.landing || {};
          if (land.attempt || land.success === true || land.success === false) {
            landAtt++;
            if (land.success === true) landOk++;
          }
          const launcher = s.launcher || {};
          const flights =
            launcher.flights != null
              ? Number(launcher.flights)
              : s.launcher_flight_number != null
                ? Number(s.launcher_flight_number)
                : null;
          const serial = launcher.serial_number || launcher.serial || "";
          if (flights != null && flights > topFlights) {
            topFlights = flights;
            topSerial = serial || topSerial;
          }
        });
      }
    });

    const reusePct =
      reuseDen > 0 ? Math.round((1000 * reuseNum) / reuseDen) / 10 : null;
    const successPct = ytd > 0 ? Math.round((1000 * success) / ytd) / 10 : null;
    const streak =
      agency && agency.consecutive_successful_launches != null
        ? agency.consecutive_successful_launches
        : null;

    return {
      ytd: ytd,
      f9: f9,
      fh: fh,
      ship: ship,
      starlink: sl,
      dragon: drag,
      crew: crew,
      cargo: cargo,
      rideshare: rideshare,
      east: east,
      west: west,
      reusePct: reusePct,
      landOk: landOk,
      landAtt: landAtt,
      successPct: successPct,
      streak: streak,
      success: success,
      topFlights: topFlights || null,
      topSerial: topSerial || null,
    };
  }

  function setSpec(prog, key, v, s) {
    const cell = (prog.specs || []).find(function (x) {
      return x.k === key;
    });
    if (!cell) return;
    if (v != null) cell.v = v;
    if (s != null) cell.s = s;
  }

  /** Keep narrative tap copy (d) from seed when live rebuilds ops tiles */
  function withTileDesc(prog, tiles) {
    const seedD = {};
    (prog.tiles || []).forEach(function (t) {
      if (t && t.k && t.d) seedD[t.k] = t.d;
    });
    return (tiles || []).map(function (t) {
      if (t && t.k && !t.d && seedD[t.k]) t.d = seedD[t.k];
      return t;
    });
  }

  function landingModeFromNext(n) {
    if (!n || !n._raw) return null;
    const stages = (n._raw.rocket && n._raw.rocket.launcher_stage) || [];
    for (let i = 0; i < stages.length; i++) {
      const land = stages[i].landing || {};
      const loc = (land.landing_location && land.landing_location.name) || "";
      const type = (land.landing_type && land.landing_type.abbrev) || land.type || "";
      if (/ASDS|drone|Of Course|Just Read|Shortfall|A Shortfall/i.test(loc + type))
        return { v: "ASDS", s: loc || "droneship recovery" };
      if (/LZ|Landing Zone|RTLS|land/i.test(loc + type))
        return { v: "RTLS", s: loc || "land pad recovery" };
    }
    return null;
  }

  function batchSatsFromNext(n) {
    if (!n) return null;
    const blob = [n.name, n.statusNote, n.missionType].join(" ");
    const m = blob.match(/(\d{2})\s*sat/i) || blob.match(/Group[^\d]*(\d+)/i);
    if (m && n.name && /Starlink/i.test(n.name)) {
      /* prefer explicit sat count in note */
    }
    const m2 = blob.match(/(\d{1,2})\s*satellites?/i);
    if (m2) return m2[1];
    if (/Starlink/i.test(n.name || "")) return "20–28";
    return null;
  }

  /**
   * Simple POV proxy from surface weather (NOT official 45th product).
   * Higher = worse. Rough heuristic for display only.
   */
  function proxyPov(wx) {
    if (!wx) return null;
    let score = 10;
    const wind = parseFloat(String(wx.wind || "").replace(/[^\d.]/g, ""));
    const cloud = parseFloat(String(wx.cloud || "").replace(/[^\d.]/g, ""));
    const precip = parseFloat(String(wx.precip || "").replace(/[^\d.]/g, ""));
    if (!Number.isNaN(wind)) {
      if (wind > 25) score += 35;
      else if (wind > 18) score += 20;
      else if (wind > 12) score += 10;
    }
    if (!Number.isNaN(cloud)) {
      if (cloud > 80) score += 20;
      else if (cloud > 50) score += 10;
    }
    if (!Number.isNaN(precip)) {
      if (precip > 40) score += 30;
      else if (precip > 15) score += 15;
      else if (precip > 5) score += 8;
    }
    return Math.min(85, Math.max(5, Math.round(score / 5) * 5));
  }

  function fetchWeather(lat, lon) {
    if (lat == null || lon == null || Number.isNaN(lat) || Number.isNaN(lon)) {
      return Promise.resolve(null);
    }
    const key = lat.toFixed(2) + "," + lon.toFixed(2);
    const hit = wxCache[key];
    if (hit && Date.now() - hit.at < WX_CACHE_MS) {
      return Promise.resolve(hit.data);
    }
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=" +
      lat +
      "&longitude=" +
      lon +
      "&current=temperature_2m,precipitation,cloud_cover,wind_speed_10m" +
      "&wind_speed_unit=mph&timezone=auto";
    return fetchJson(url)
      .then(function (d) {
        const c = d.current || {};
        const data = {
          wind:
            c.wind_speed_10m != null
              ? Math.round(c.wind_speed_10m) + " mph"
              : "—",
          cloud: c.cloud_cover != null ? Math.round(c.cloud_cover) + "%" : "—",
          precip:
            c.precipitation != null
              ? (Math.round(c.precipitation * 10) / 10) + " mm"
              : "—",
          temp: c.temperature_2m,
        };
        data.pov = proxyPov(data);
        data.povNote =
          "Desk estimate from surface weather · not official range POV";
        wxCache[key] = { at: Date.now(), data: data };
        return data;
      })
      .catch(function () {
        return null;
      });
  }

  function dayOfYear() {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 0));
    const diff = now - start;
    return Math.floor(diff / 86400000);
  }

  function fetchPagedResults(url, acc, pagesLeft) {
    acc = acc || [];
    pagesLeft = pagesLeft == null ? 4 : pagesLeft;
    return fetchJson(url).then(function (data) {
      const chunk = data.results || [];
      acc = acc.concat(chunk);
      if (data.next && pagesLeft > 1 && chunk.length) {
        return fetchPagedResults(data.next, acc, pagesLeft - 1);
      }
      return acc;
    });
  }

  function loadStarlinkMarkets() {
    if (
      cache.markets != null &&
      cache.marketsAt &&
      Date.now() - cache.marketsAt < MARKETS_CACHE_MS
    ) {
      return Promise.resolve(cache.markets);
    }
    return fetchJson(STARLINK_AVAIL)
      .then(function (d) {
        const a0 = d.admin0 || {};
        let live = 0;
        Object.keys(a0).forEach(function (code) {
          const st = a0[code] && a0[code].status;
          if (st === "available" || st === "launched") live++;
        });
        cache.markets = live || null;
        cache.marketsAt = Date.now();
        return cache.markets;
      })
      .catch(function () {
        return cache.markets;
      });
  }

  function loadLl2() {
    if (cache.at && Date.now() - cache.at < CACHE_MS && cache.upcoming.length) {
      return Promise.resolve(cache);
    }
    const y0 = yearStartIso();
    const qUpcoming =
      LL2 +
      "/launch/upcoming/?lsp__id=" +
      LSP_SPACEX +
      "&limit=40&mode=detailed&ordering=net";
    const qPrevious =
      LL2 +
      "/launch/previous/?lsp__id=" +
      LSP_SPACEX +
      "&net__gte=" +
      encodeURIComponent(y0) +
      "&limit=100&mode=detailed&ordering=-net";
    const qAgency = LL2 + "/agencies/" + LSP_SPACEX + "/";

    /*
     * Upcoming is critical for Next flight. Do not let previous/agency/markets
     * rate-limits (429) abort the whole refresh and leave July seed NETs stuck.
     */
    return fetchJson(qUpcoming)
      .then(function (up) {
        const upcoming = up.results || [];
        return Promise.all([
          Promise.resolve(upcoming),
          fetchPagedResults(qPrevious).catch(function (err) {
            console.warn("LL2 previous failed — keep prior cache", err);
            return cache.previous || [];
          }),
          fetchJson(qAgency).catch(function (err) {
            console.warn("LL2 agency failed — keep prior cache", err);
            return cache.agency || null;
          }),
          loadStarlinkMarkets().catch(function () {
            return cache.markets;
          }),
        ]);
      })
      .then(function (parts) {
        cache = {
          at: Date.now(),
          upcoming: parts[0] || [],
          previous: parts[1] || cache.previous || [],
          agency: parts[2] != null ? parts[2] : cache.agency || null,
          markets: parts[3] != null ? parts[3] : cache.markets,
          marketsAt: cache.marketsAt || Date.now(),
        };
        return cache;
      });
  }

  function applyLiveToData(base, live) {
    const DATA = base;
    const stats = computeStats(live.previous, live.agency);
    const year = new Date().getUTCFullYear();
    const markets =
      live.markets != null
        ? live.markets
        : cache.markets != null
          ? cache.markets
          : null;
    const marketsLabel = markets != null ? String(markets) : "160+";

    DATA.year = year;
    DATA.fleetYtd = stats.ytd;
    DATA.lastUpdated = new Date(live.at || Date.now()).toISOString();
    DATA.live = true;
    DATA.starlinkMarkets = markets;

    PROG_ORDER.forEach(function (id) {
      const prog = DATA.programs[id];
      if (!prog) return;
      const up = filterUpcoming(live.upcoming, id);
      const prev = filterPrevious(live.previous, id);
      const st = computeStats(
        id === "machine" ? live.previous : prev,
        live.agency
      );

      if (up.length) {
        prog.next = launchToNext(up[0]);
        /* Second upcoming = “Next up” when first is still In flight / Success */
        prog.nextUp = up.length > 1 ? launchToNext(up[1]) : null;
        /* Clear seed weather risk until enrichWeather fills */
        if (prog.weather) {
          prog.weather.risk = "—";
          prog.weather.wind = "—";
          prog.weather.cloud = "—";
          prog.weather.precip = "—";
        }
      } else {
        /* Live window empty — don't keep a stale seed NET/countdown */
        prog.next = {
          name: "No upcoming in window",
          rocket: "",
          pad: "—",
          siteId: null,
          programId: id === "machine" ? null : id,
          net: null,
          windowEnd: null,
          windowStart: null,
          precision: "month",
          status: "TBD",
          statusNote: "",
          webcast: "",
          missionType: "",
          probability: null,
          weather_concerns: null,
          padLat: null,
          padLon: null,
        };
        prog.nextUp = null;
        if (prog.weather) {
          prog.weather.risk = "—";
          prog.weather.pov = null;
          prog.weather.povNote = "No upcoming launch in the live window";
        }
      }

      prog.ytd =
        id === "machine"
          ? stats.ytd
          : id === "falcon9"
            ? stats.f9
            : id === "heavy"
              ? stats.fh
              : id === "starship"
                ? stats.ship
                : id === "starlink"
                  ? stats.starlink
                  : id === "dragon"
                    ? stats.dragon
                    : prev.length;

      /* Scale band: program-scoped where we have it */
      if (id === "machine") {
        prog.streak = stats.streak != null ? stats.streak : prog.streak;
        prog.landingsYtd = stats.landOk;
        prog.successRate =
          stats.successPct != null ? stats.successPct : prog.successRate;
      } else if (id === "falcon9" || id === "heavy" || id === "starlink") {
        prog.landingsYtd = st.landOk;
        prog.successRate =
          st.successPct != null ? st.successPct : prog.successRate;
        prog.streak = stats.streak != null ? stats.streak : prog.streak;
      } else if (id === "starship") {
        prog.successRate =
          st.successPct != null ? st.successPct : prog.successRate;
        prog.landingsYtd = "—";
        prog.streak = st.ytd || prog.streak;
      } else if (id === "dragon") {
        prog.successRate =
          st.successPct != null ? st.successPct : prog.successRate;
        prog.landingsYtd = st.ytd; /* splashdowns ≈ missions when successful */
        prog.streak = st.ytd || prog.streak;
      }

      if (id === "machine") {
        const reuseCell = (prog.specs || []).find(function (s) {
          return s.k === "Reuse";
        });
        if (reuseCell) {
          const pct =
            stats.reusePct != null ? Math.round(stats.reusePct) : null;
          if (pct != null) {
            reuseCell.v = pct + "%";
            reuseCell.s = "F9+FH · YTD";
            reuseCell.d =
              "YTD " +
              pct +
              "% of Falcon (F9 + Heavy) flights used a booster that had already flown. Reuse is the core of SpaceX cadence and cost: recover, inspect, reflown. Starship aims at tower catch and rapid restack — still maturing. Fairing halves are recovered by boat when attempted.";
          } else if (!reuseCell.v || reuseCell.v === "—" || reuseCell.v === "-") {
            reuseCell.v = "High";
            reuseCell.s = "F9+FH · typical YTD";
          }
        }
        prog.stats = [
          { k: "Falcon 9", v: String(stats.f9) },
          { k: "Falcon Heavy", v: String(stats.fh) },
          { k: "Starship", v: String(stats.ship) },
        ];
        prog.tiles = withTileDesc(prog, [
          {
            k: "YTD launches",
            v: String(stats.ytd),
            s: "of " + (prog.yearGoal || DATA.fleetGoal) + " year target",
          },
          {
            k: "Cadence",
            v: cadencePerWeek(stats.ytd),
            s: "YTD pace",
          },
          {
            k: "Success streak",
            v: stats.streak != null ? String(stats.streak) : "—",
            s: "launches",
          },
          {
            k: "Landings YTD",
            v: String(stats.landOk),
            s: "Falcon recoveries",
          },
          {
            k: "Starlink share",
            v:
              stats.ytd > 0
                ? Math.round((100 * stats.starlink) / stats.ytd) + "%"
                : "—",
            s: "of launches YTD",
          },
          {
            k: "Markets",
            v: marketsLabel,
            s: "Starlink live",
          },
        ]);
      } else if (id === "falcon9") {
        const slOnF9 = prev.filter(isStarlink).length;
        const other = Math.max(0, stats.f9 - slOnF9);
        const rs = prev.filter(isRideshare).length;
        prog.stats = [
          { k: "Starlink", v: String(slOnF9) },
          { k: "Other", v: String(other) },
          { k: "Rideshare", v: String(rs) },
          { k: "YTD", v: String(stats.f9) },
        ];
        const land = landingModeFromNext(prog.next);
        prog.tiles = withTileDesc(prog, [
          {
            k: "Top core",
            v: st.topSerial && st.topFlights ? st.topSerial : "—",
            s:
              st.topSerial && st.topFlights
                ? st.topFlights + " flights · YTD high"
                : "busiest booster YTD",
          },
          {
            k: "YTD",
            v: String(stats.f9),
            s: "of " + (prog.yearGoal || "—") + " year target",
          },
          {
            k: "Reuse",
            v: st.reusePct != null ? Math.round(st.reusePct) + "%" : "—",
            s: "boosters already flown · YTD",
          },
          {
            k: "Landings",
            v: String(st.landOk),
            s: "successful recoveries YTD",
          },
          {
            k: "East / West",
            v: st.east + "/" + st.west,
            s: "Florida / Vandenberg YTD",
          },
          {
            k: "Next landing",
            v: land ? land.v : "—",
            s: land ? land.s : "from next mission profile",
          },
        ]);
      } else if (id === "heavy") {
        const pad =
          (prog.next && prog.next.pad) || "LC-39A · Kennedy";
        prog.stats = [
          { k: "YTD", v: String(stats.fh) },
          { k: "Year target", v: String(prog.yearGoal || "—") },
          { k: "Landings", v: String(st.landOk) },
          { k: "Pad", v: "39A" },
        ];
        prog.tiles = withTileDesc(prog, [
          {
            k: "This year",
            v: stats.fh + " / " + (prog.yearGoal || "—"),
            s: "flights vs year target",
          },
          {
            k: "Landings YTD",
            v: String(st.landOk),
            s: "side + center recoveries",
          },
          {
            k: "Success",
            v: st.successPct != null ? st.successPct + "%" : "—",
            s: "Heavy flights YTD",
          },
          {
            k: "Pad",
            v: "39A",
            s: pad,
          },
          {
            k: "Side boosters",
            v: "×2",
            s: "usually recovered",
          },
          {
            k: "Center core",
            v: "ASDS / exp.",
            s: "mission dependent",
          },
        ]);
      } else if (id === "starship") {
        prog.stats = [
          { k: "Flights YTD", v: String(stats.ship) },
          { k: "Year target", v: String(prog.yearGoal || "—") },
          { k: "Success", v: st.successPct != null ? st.successPct + "%" : "—" },
          { k: "Catch", v: "Tower" },
        ];
        prog.tiles = withTileDesc(prog, [
          {
            k: "Flights YTD",
            v: String(stats.ship),
            s: "of " + (prog.yearGoal || "—") + " year target",
          },
          {
            k: "Cadence",
            v: cadencePerWeek(stats.ship),
            s: "YTD pace",
          },
          {
            k: "Success",
            v: st.successPct != null ? st.successPct + "%" : "—",
            s: "YTD flight outcomes",
          },
          {
            k: "Catch",
            v: "Tower",
            s: "Mechazilla · Starbase",
          },
          {
            k: "Sites",
            v: "TX · FL",
            s: "Starbase now · 39A path",
          },
          {
            k: "Next",
            v: prog.next && prog.next.pad ? "Pad 2" : "—",
            s: (prog.next && prog.next.pad) || "Starbase",
          },
        ]);
      } else if (id === "dragon") {
        prog.stats = [
          { k: "Crew YTD", v: String(st.crew) },
          { k: "Cargo YTD", v: String(st.cargo) },
          { k: "Total", v: String(stats.dragon) },
          { k: "Year target", v: String(prog.yearGoal || "—") },
        ];
        prog.tiles = withTileDesc(prog, [
          {
            k: "Crew / Cargo",
            v: st.crew + " / " + st.cargo,
            s: "missions flown YTD",
          },
          {
            k: "YTD",
            v: String(stats.dragon),
            s: "of " + (prog.yearGoal || "—") + " year target",
          },
          {
            k: "Success",
            v: st.successPct != null ? st.successPct + "%" : "—",
            s: "Dragon flights YTD",
          },
          {
            k: "Destination",
            v: "ISS",
            s: "docks at station",
          },
          {
            k: "Pad",
            v: "39A",
            s: (prog.next && prog.next.pad) || "LC-39A · Kennedy",
          },
          {
            k: "Next",
            v: (prog.next && prog.next.name) || "—",
            s: (prog.next && prog.next.status) || "from manifest",
          },
        ]);
      } else if (id === "starlink") {
        const batch = batchSatsFromNext(prog.next);
        const share =
          stats.ytd > 0
            ? Math.round((100 * stats.starlink) / stats.ytd) + "%"
            : "—";
        setSpec(
          prog,
          "Coverage",
          marketsLabel + " mkts",
          "globally"
        );
        prog.stats = [
          { k: "Missions YTD", v: String(stats.starlink) },
          { k: "Year target", v: String(prog.yearGoal || "—") },
          { k: "of fleet", v: share },
          { k: "Markets", v: marketsLabel },
        ];
        prog.tiles = withTileDesc(prog, [
          {
            k: "Missions YTD",
            v: String(stats.starlink),
            s: "of " + (prog.yearGoal || "—") + " year target",
          },
          {
            k: "of fleet",
            v: share,
            s: "share of all launches YTD",
          },
          {
            k: "This batch",
            v: batch || "—",
            s: "sats on next stack",
          },
          {
            k: "Markets",
            v: marketsLabel,
            s: "Starlink live",
          },
          {
            k: "Cadence",
            v: cadencePerWeek(stats.starlink),
            s: "YTD pace",
          },
          {
            k: "Landings",
            v: String(st.landOk),
            s: "booster recoveries",
          },
        ]);
      }
    });

    DATA.fleetYtd = stats.ytd;
    return DATA;
  }

  function enrichWeather(DATA) {
    const jobs = [];
    PROG_ORDER.forEach(function (id) {
      const prog = DATA.programs[id];
      if (!prog || !prog.next) return;
      const n = prog.next;
      let lat = n.padLat;
      let lon = n.padLon;
      if ((lat == null || lon == null) && n.siteId && DATA.sites) {
        const site = DATA.sites.find(function (s) {
          return s.id === n.siteId;
        });
        if (site) {
          lat = site.lat;
          lon = site.lon;
        }
      }
      jobs.push(
        fetchWeather(lat, lon).then(function (wx) {
          if (!wx) return;
          prog.weather = prog.weather || {};
          prog.weather.pad = padWxKey(
            n._raw && n._raw.pad ? n._raw.pad : { name: n.pad }
          );
          prog.weather.wind = wx.wind;
          prog.weather.cloud = wx.cloud;
          prog.weather.precip = wx.precip;
          if (n.probability != null && !Number.isNaN(Number(n.probability))) {
            const go = Number(n.probability);
            prog.weather.pov = Math.max(5, Math.min(90, 100 - go));
            prog.weather.povNote =
              "From Launch Library probability · not official range POV";
          } else {
            prog.weather.pov = wx.pov;
            prog.weather.povNote = wx.povNote;
          }
          prog.weather.risk = n.weather_concerns || "—";
        })
      );
    });
    return Promise.all(jobs).then(function () {
      return DATA;
    });
  }

  function formatUsdPrice(n) {
    if (n == null || !Number.isFinite(n)) return "—";
    return (
      "$" +
      n.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  function formatMarketCap(n) {
    if (n == null || !Number.isFinite(n)) return "—";
    if (n >= 1e12) return "$" + (n / 1e12).toFixed(2) + "T";
    if (n >= 1e9) return "$" + (n / 1e9).toFixed(0) + "B";
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(0) + "M";
    return "$" + Math.round(n).toLocaleString("en-US");
  }

  function formatChangePct(n) {
    if (n == null || !Number.isFinite(n)) return "NASDAQ · SPCX";
    const sign = n > 0 ? "+" : "";
    return sign + n.toFixed(2) + "% · SPCX";
  }

  let quoteCache = { at: 0, quote: null };
  const QUOTE_CACHE_MS = 60 * 1000; /* 1 min */
  const QUOTE_TIMEOUT_MS = 8000;

  function loadSpcxQuote() {
    if (
      quoteCache.quote &&
      quoteCache.at &&
      Date.now() - quoteCache.at < QUOTE_CACHE_MS
    ) {
      return Promise.resolve(quoteCache.quote);
    }
    /* Absolute same-origin path so it works from any route */
    const url =
      (typeof location !== "undefined" && location.origin
        ? location.origin
        : "") + "/api/spcx";
    const ctrl =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer =
      ctrl &&
      setTimeout(function () {
        try {
          ctrl.abort();
        } catch (_) {}
      }, QUOTE_TIMEOUT_MS);
    return fetch(url, {
      headers: { Accept: "application/json" },
      signal: ctrl ? ctrl.signal : undefined,
    })
      .then(function (res) {
        if (timer) clearTimeout(timer);
        if (!res.ok) throw new Error("HTTP " + res.status + " /api/spcx");
        return res.json();
      })
      .then(function (body) {
        if (!body || !body.ok || !body.quote) throw new Error("quote fail");
        quoteCache = { at: Date.now(), quote: body.quote };
        return body.quote;
      })
      .catch(function (err) {
        if (timer) clearTimeout(timer);
        console.warn("SPCX quote failed", err);
        return quoteCache.quote || null;
      });
  }

  function applySpcxQuote(DATA, quote) {
    if (!quote || !DATA.programs || !DATA.programs.machine) return;
    const prog = DATA.programs.machine;
    const priceCell = (prog.specs || []).find(function (s) {
      return s.k === "SPCX price";
    });
    const mcapCell = (prog.specs || []).find(function (s) {
      return s.k === "Market cap";
    });
    if (priceCell) {
      priceCell.v = formatUsdPrice(quote.price);
      priceCell.s = formatChangePct(quote.changePct);
      priceCell.d =
        "SpaceX (NASDAQ: SPCX) last sale " +
        formatUsdPrice(quote.price) +
        (quote.changePct != null
          ? " (" + formatChangePct(quote.changePct).replace(" · SPCX", "") + ")"
          : "") +
        (quote.asOf ? ". As of " + quote.asOf + "." : ".") +
        " Live market data via desk quote proxy.";
    }
    if (mcapCell) {
      mcapCell.v = formatMarketCap(quote.marketCap);
      mcapCell.s = "SPCX market cap";
      mcapCell.d =
        "SpaceX market capitalization " +
        formatMarketCap(quote.marketCap) +
        " (NASDAQ). " +
        (quote.price != null
          ? "Implied from last sale " + formatUsdPrice(quote.price) + ". "
          : "") +
        "Live when the desk quote proxy is available.";
    }
    DATA.spcx = quote;
  }

  function refresh(opts) {
    const base = global.SPACEHUB_DATA;
    if (!base) return Promise.reject(new Error("No SPACEHUB_DATA"));
    opts = opts || {};
    const onQuote = typeof opts.onQuote === "function" ? opts.onQuote : null;
    const onLl2 = typeof opts.onLl2 === "function" ? opts.onLl2 : null;

    /* Quote and LL2 are independent — paint each as soon as it lands */
    const ll2P = loadLl2()
      .then(function (live) {
        applyLiveToData(base, live);
        base.live = true;
        if (onLl2) {
          try {
            onLl2({ phase: "data" });
          } catch (_) {}
        }
        return enrichWeather(base)
          .then(function () {
            if (onLl2) {
              try {
                onLl2({ phase: "weather" });
              } catch (_) {}
            }
            return base;
          })
          .catch(function (err) {
            console.warn("SpaceXplore weather failed", err);
            if (onLl2) {
              try {
                onLl2({ phase: "weather" });
              } catch (_) {}
            }
            return base;
          });
      })
      .catch(function (err) {
        console.warn("SpaceXplore LL2 failed — keeping seed ops", err);
        base.live = false;
        return base;
      });

    const quoteP = loadSpcxQuote()
      .then(function (quote) {
        if (quote) {
          applySpcxQuote(base, quote);
          if (onQuote) {
            try {
              onQuote(quote);
            } catch (_) {}
          }
        }
        return quote;
      })
      .catch(function (err) {
        console.warn("SpaceXplore SPCX quote failed", err);
        return null;
      });

    return Promise.all([ll2P, quoteP]).then(function () {
      const liveOk = !!base.live;
      return {
        ok: liveOk,
        live: liveOk,
        data: base,
        at: cache.at,
        spcx: !!base.spcx,
      };
    });
  }

  global.SpaceXploreLive = {
    refresh: refresh,
    loadLl2: loadLl2,
    loadSpcxQuote: loadSpcxQuote,
    fetchWeather: fetchWeather,
  };
})(typeof window !== "undefined" ? window : globalThis);
