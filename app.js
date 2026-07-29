(function () {
  "use strict";

  const DATA = window.SPACEHUB_DATA;
  const ORDER = ["machine", "falcon9", "heavy", "starship", "dragon", "starlink"];

  const SILHOUETTES = {
    machine: `<svg viewBox="0 0 56 56" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
      <rect x="8" y="18" width="40" height="26" rx="2"/>
      <path d="M14 18 V12 H42 V18 M20 44 V50 M36 44 V50 M28 8 V12"/>
      <circle cx="20" cy="31" r="3"/><circle cx="36" cy="31" r="3"/>
    </svg>`,
    falcon9: `<svg viewBox="0 0 40 90" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 3 L23 14 L23 68 L27 84 L13 84 L17 68 L17 14 Z"/>
      <path d="M17 22 H23 M17 48 H23 M14 80 H26"/>
      <path d="M18 3 H22 L23 8 H17 Z"/>
    </svg>`,
    heavy: `<svg viewBox="0 0 56 90" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M28 3 L31 14 L31 66 L35 84 L21 84 L25 66 L25 14 Z"/>
      <path d="M12 18 L15 26 L15 70 L18 84 L8 84 L11 70 L11 26 Z"/>
      <path d="M44 18 L47 26 L47 70 L50 84 L40 84 L43 70 L43 26 Z"/>
      <path d="M25 22 H31 M14 80 H42"/>
    </svg>`,
    starship: `<svg viewBox="0 0 48 90" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
      <path d="M24 2 L30 28 L30 48 L34 58 L14 58 L18 48 L18 28 Z"/>
      <path d="M14 58 L12 78 L20 86 L28 86 L36 78 L34 58"/>
      <path d="M10 52 L18 48 M38 52 L30 48"/>
      <path d="M16 70 H32 M18 36 H30"/>
    </svg>`,
    dragon: `<svg viewBox="0 0 48 70" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M24 6 C34 6 40 16 40 28 L38 48 C36 58 30 64 24 64 C18 64 12 58 10 48 L8 28 C8 16 14 6 24 6 Z"/>
      <path d="M16 30 H32 M18 42 H30"/>
      <ellipse cx="24" cy="20" rx="8" ry="5"/>
      <path d="M14 56 L10 66 M34 56 L38 66"/>
    </svg>`,
    starlink: `<svg viewBox="0 0 56 56" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
      <rect x="18" y="22" width="20" height="14" rx="2"/>
      <path d="M8 18 L18 24 M8 40 L18 34 M48 18 L38 24 M48 40 L38 34"/>
      <path d="M4 28 H12 M44 28 H52"/>
      <circle cx="28" cy="29" r="2.5"/>
      <path d="M22 26 H34"/>
    </svg>`,
  };

  let activeId = "machine";
  let tickTimer = 0;
  let mapOpen = false;
  /* Full Sites map: keep pan/zoom for the session (survive Open in Maps / repaints) */
  let fullMapView = null;

  const el = {
    picker: document.getElementById("picker"),
    statusChip: document.getElementById("status-chip"),
    missionName: document.getElementById("mission-name"),
    missionSub: document.getElementById("mission-sub"),
    missionMeta: document.getElementById("mission-meta"),
    countdown: document.getElementById("countdown"),
    countdownSub: document.getElementById("countdown-sub"),
    btnWatch: document.getElementById("btn-watch"),
    nextMapBtn: document.getElementById("next-map-btn"),
    miniMap: document.getElementById("mini-map"),
    mapOverlay: document.getElementById("map-overlay"),
    mapOverlaySub: document.getElementById("map-overlay-sub"),
    mapOverlayClose: document.getElementById("map-overlay-close"),
    fullMap: document.getElementById("full-map"),
    scalePct: document.getElementById("scale-pct"),
    scaleFrac: document.getElementById("scale-frac"),
    scaleBar: document.getElementById("scale-bar"),
    statStreak: document.getElementById("stat-streak"),
    statLand: document.getElementById("stat-land"),
    statSuccess: document.getElementById("stat-success"),
    specsTitle: document.getElementById("specs-title"),
    specsGrid: document.getElementById("specs-grid"),
    wPad: document.getElementById("w-pad"),
    wWind: document.getElementById("w-wind"),
    wCloud: document.getElementById("w-cloud"),
    wPrecip: document.getElementById("w-precip"),
    povBtn: document.getElementById("pov-btn"),
    povVal: document.getElementById("pov-val"),
    contextGrid: document.getElementById("context-grid"),
    mixGrid: document.getElementById("mix-grid"),
    mediaRail: document.getElementById("media-rail"),
    sheet: document.getElementById("sheet"),
    sheetTitle: document.getElementById("sheet-title"),
    sheetBody: document.getElementById("sheet-body"),
    sheetClose: document.getElementById("sheet-close"),
    app: document.getElementById("app"),
  };

  function program(id) {
    return DATA.programs[id] || DATA.programs.machine;
  }

  function setAccent(color) {
    document.documentElement.style.setProperty("--accent", color);
  }

  function buildPicker() {
    el.picker.innerHTML = "";
    ORDER.forEach((id) => {
      const p = program(id);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pick" + (id === activeId ? " is-active" : "");
      btn.dataset.id = id;
      btn.textContent = p.short;
      btn.setAttribute("aria-pressed", id === activeId ? "true" : "false");
      btn.addEventListener("click", () => selectProgram(id));
      el.picker.appendChild(btn);
    });
  }

  function formatNet(iso, precision) {
    if (!iso) return "NET unset";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "NET unset";
    const opts =
      precision === "minute" || precision === "hour"
        ? { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }
        : precision === "day"
          ? { month: "short", day: "numeric", year: "numeric" }
          : { month: "short", year: "numeric" };
    return d.toLocaleString(undefined, opts);
  }

  function countdownParts(iso, precision) {
    if (!iso) return { main: "—", sub: "" };
    const target = new Date(iso).getTime();
    if (Number.isNaN(target)) return { main: "—", sub: "" };

    /* Soft / day NET: keep a short date sub only — no “To launch” chrome */
    if (precision === "month" || precision === "quarter" || precision === "year") {
      return { main: formatNet(iso, precision), sub: "" };
    }

    const now = Date.now();
    let diff = target - now;
    const past = diff < 0;
    diff = Math.abs(diff);

    if (precision === "day" && diff > 86400000 * 2) {
      const days = Math.round(diff / 86400000);
      return {
        main: (past ? "T+" : "T−") + days + "d",
        sub: "",
      };
    }

    const s = Math.floor(diff / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n) => String(n).padStart(2, "0");
    let main;
    if (d > 0) main = `${past ? "T+" : "T−"}${d}d ${pad(h)}:${pad(m)}:${pad(sec)}`;
    else main = `${past ? "T+" : "T−"}${pad(h)}:${pad(m)}:${pad(sec)}`;
    return { main, sub: "" };
  }

  function statusClass(status) {
    const s = (status || "").toLowerCase();
    if (s.includes("go") && !s.includes("no")) return "is-go";
    if (s.includes("hold")) return "is-hold";
    return "is-tbc";
  }

  function renderScale(p) {
    const goal = p.yearGoal || 1;
    const ytd = p.ytd || 0;
    const pct = Math.min(100, Math.round((ytd / goal) * 1000) / 10);
    el.scalePct.textContent = pct + "%";
    el.scaleFrac.textContent = ytd + " / " + goal;
    el.scaleBar.style.width = Math.min(100, pct) + "%";
    el.statStreak.textContent = p.streak != null ? String(p.streak) : "—";
    el.statLand.textContent = p.landingsYtd != null ? String(p.landingsYtd) : "—";
    el.statSuccess.textContent =
      p.successRate != null ? p.successRate + "%" : "—";
  }

  function renderWeather(w) {
    w = w || {};
    if (el.wPad) el.wPad.textContent = w.pad || "—";
    if (el.wWind) el.wWind.textContent = w.wind || "—";
    if (el.wCloud) el.wCloud.textContent = w.cloud || "—";
    if (el.wPrecip) el.wPrecip.textContent = w.precip || "—";

    /* POV = Probability of Violation (range). Separate from pad surface cells. */
    const pov = w.pov != null ? w.pov : w.risk;
    const povNum =
      typeof pov === "number"
        ? pov
        : typeof pov === "string" && /^\d+%?$/.test(pov.trim())
          ? parseInt(pov, 10)
          : null;

    if (el.povVal) {
      if (povNum != null && !Number.isNaN(povNum)) {
        el.povVal.textContent = povNum + "%";
      } else {
        el.povVal.textContent = "—";
      }
    }

    if (el.povBtn) {
      el.povBtn.classList.remove("is-go", "is-watch", "is-nogo");
      if (povNum != null && !Number.isNaN(povNum)) {
        if (povNum <= 30) el.povBtn.classList.add("is-go");
        else if (povNum <= 50) el.povBtn.classList.add("is-watch");
        else el.povBtn.classList.add("is-nogo");
      }
      el.povBtn.dataset.pov = povNum != null ? String(povNum) : "";
      el.povBtn.dataset.pad = w.pad || "";
      el.povBtn.dataset.note = w.risk || w.povNote || "";
    }
  }

  function openPovSheet() {
    const pov = el.povBtn && el.povBtn.dataset.pov;
    const pad = (el.povBtn && el.povBtn.dataset.pad) || "next pad";
    const note = (el.povBtn && el.povBtn.dataset.note) || "";
    const pct = pov ? pov + "%" : "—";
    openFactSheet(
      "POV · range weather",
      pct + " probability of violation",
      note
        ? "Pad surface: " + pad + " · " + note
        : "Pad surface shown left · " + pad,
      "Range"
    );
    if (el.sheetBody) {
      el.sheetBody.textContent =
        "POV (Probability of Violation) is the chance that launch-commit weather " +
        "or customer rules fail during the window — the range go / no-go slice.\n\n" +
        "Shown: " +
        pct +
        (note ? " · " + note : "") +
        "\n\nPad weather (left) is surface wind, cloud, and precip at the next pad. " +
        "POV is not the same as pad surface alone.";
    }
  }

  function openFactSheet(title, value, sub) {
    el.sheetTitle.textContent = title;
    el.sheetBody.textContent = value + (sub ? "\n" + sub : "");
    el.sheet.showModal();
  }

  const SITE_KIND_LABEL = {
    hq: "Headquarters",
    build: "Manufacturing / build",
    launch: "Launch site",
    landing: "Landing zone",
    test: "Test site",
    support: "Support / recovery",
    starlink: "Starlink",
    gateway: "Starlink gateway",
    tracking: "Tracking / ground",
    office: "Office",
  };



  function bindSpecsGridClicks() {
    if (!el.specsGrid || el.specsGrid.dataset.bound === "1") return;
    el.specsGrid.dataset.bound = "1";
    el.specsGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".spec-cell");
      if (!btn || !el.specsGrid.contains(btn)) return;
      const t = (program(activeId).specs || [])[Number(btn.dataset.i)];
      if (!t) return;
      if (t.href) {
        window.open(t.href, "_blank", "noopener,noreferrer");
        return;
      }
      if (t.action === "map") {
        openMap();
        return;
      }
      if (t.d) openFactSheet(t.k, t.d);
      else openFactSheet(t.k, t.v, t.s || "");
    });
  }

  function renderSpecs(p) {
    el.specsTitle.textContent = p.specsTitle || "Specs";
    const specs = p.specs || [];
    bindSpecsGridClicks();
    const existing = el.specsGrid.querySelectorAll(".spec-cell");
    /* In-place update — avoids wipe/flash when SPCX quote lands */
    if (existing.length === specs.length && specs.length > 0) {
      specs.forEach((t, i) => {
        const btn = existing[i];
        btn.dataset.i = String(i);
        const k = btn.querySelector(".k");
        const v = btn.querySelector(".v");
        const s = btn.querySelector(".s");
        if (k) k.textContent = t.k;
        if (v) v.textContent = t.v;
        if (s) s.textContent = t.s || "";
      });
      lockSpecType();
      return;
    }
    el.specsGrid.classList.remove("is-typefit");
    el.specsGrid.innerHTML = "";
    specs.forEach((t, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "spec-cell";
      btn.dataset.i = String(i);
      btn.innerHTML =
        `<span class="k">${escapeHtml(t.k)}</span>` +
        `<span class="v">${escapeHtml(t.v)}</span>` +
        `<span class="s">${escapeHtml(t.s || "")}</span>`;
      el.specsGrid.appendChild(btn);
    });
  }

  function renderTiles(tiles) {
    if (el.contextGrid) el.contextGrid.classList.remove("is-typefit");
    el.contextGrid.innerHTML = "";
    (tiles || []).forEach((t) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tile";
      btn.innerHTML =
        `<span class="k">${escapeHtml(t.k)}</span>` +
        `<span class="v">${escapeHtml(t.v)}</span>` +
        `<span class="s">${escapeHtml(t.s || "")}</span>`;
      btn.addEventListener("click", () => {
        if (t.href) {
          window.open(t.href, "_blank", "noopener,noreferrer");
          return;
        }
        if (t.d) openFactSheet(t.k, t.d);
        else openFactSheet(t.k, t.v, t.s || "");
      });
      el.contextGrid.appendChild(btn);
    });
  }

  function renderMix(stats) {
    el.mixGrid.innerHTML = "";
    (stats || []).forEach((s) => {
      const div = document.createElement("div");
      div.className = "mix-cell";
      div.innerHTML =
        `<div class="k">${escapeHtml(s.k)}</div>` +
        `<div class="v">${escapeHtml(String(s.v))}</div>`;
      el.mixGrid.appendChild(div);
    });
  }

  /* Same 12 accounts on every program — SpaceX first */
  const ON_X_FIXED = [
    {
      handle: "@SpaceX",
      title: "SpaceX",
      url: "https://x.com/SpaceX",
    },
    {
      handle: "@joetegtmeyer",
      title: "Joe Tegtmeyer",
      url: "https://x.com/joetegtmeyer",
    },
    {
      handle: "@AJamesMcCarthy",
      title: "Andrew McCarthy",
      url: "https://x.com/AJamesMcCarthy",
    },
    {
      handle: "@Erdayastronaut",
      title: "Everyday Astronaut",
      url: "https://x.com/Erdayastronaut",
    },
    {
      handle: "@esherifftv",
      title: "Ellie in Space",
      url: "https://x.com/esherifftv",
    },
    {
      handle: "@johnkrausphotos",
      title: "John Kraus",
      url: "https://x.com/johnkrausphotos",
    },
    {
      handle: "@NASASpaceflight",
      title: "NASASpaceflight",
      url: "https://x.com/NASASpaceflight",
    },
    {
      handle: "@RGVaerialphotos",
      title: "RGV Aerial Photos",
      url: "https://x.com/RGVaerialphotos",
    },
    /* Row 3 — community that chronicles / digs the work */
    {
      handle: "@LabPadre",
      title: "LabPadre",
      url: "https://x.com/LabPadre",
    },
    {
      handle: "@FelixSchlang",
      title: "What About It",
      url: "https://x.com/FelixSchlang",
    },
    {
      handle: "@CSI_Starbase",
      title: "CSI Starbase",
      url: "https://x.com/CSI_Starbase",
    },
    {
      handle: "@mcrs987",
      title: "TheSpaceEngineer",
      url: "https://x.com/mcrs987",
    },
  ];

  function renderMedia() {
    if (el.mediaRail) el.mediaRail.classList.remove("is-typefit");
    el.mediaRail.innerHTML = "";
    ON_X_FIXED.forEach((m) => {
      const a = document.createElement("a");
      a.className = "media-card";
      a.href = m.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.innerHTML = `<span class="title">${escapeHtml(m.title)}</span>`;
      el.mediaRail.appendChild(a);
    });
  }

  /**
   * Specs: ONE global type size per role for the whole app.
   * Sized to the longest k/v/s across every program (plus SPCX probes),
   * then applied to the visible grid — Overview and Starlink match, no clip.
   */
  function lineOverflows(node) {
    return (
      !!node &&
      node.clientWidth >= 2 &&
      node.scrollWidth > node.clientWidth + 0.25
    );
  }

  const SPEC_SIZE = { k: 10, v: 18.5, s: 11 };
  const SPEC_LIVE_PROBES = {
    v: ["$12,345.67", "$999.99", "$9.99T", "$1.23T"],
    s: ["+99.99% · SPCX", "+9.99% · SPCX", "SPCX market cap"],
  };
  let specTypeReady = false;
  let specTypeWidth = 0;
  let specTypeTablet = false;
  let specStringCache = null;

  function densTablet() {
    return window.matchMedia("(min-width: 768px)").matches;
  }

  /** Phone dens vs tablet dens. Artboard is still ~390px wide on Mac/iPad —
   *  max stays bumped for short labels; min must drop to phone-like floors
   *  so long subs ("3 under construction", "working on orbit") can fit. */
  function specLimits() {
    if (densTablet()) {
      return {
        max: { k: 14.4, v: 30, s: 16.8 },
        min: { k: 7, v: 10, s: 7.5 },
      };
    }
    return {
      max: { k: 10, v: 21, s: 12 },
      min: { k: 7, v: 10, s: 8 },
    };
  }

  function opsFitLimits() {
    if (densTablet()) {
      return {
        k: [11.9, 5.5],
        v: [16.6, 8],
        s: [13.0, 5.5],
      };
    }
    return {
      k: [8.25, 5.5],
      v: [11.5, 8],
      s: [9, 5.5],
    };
  }

  function onXFitLimits() {
    return densTablet() ? [15.5, 7.5] : [9.5, 6.5];
  }

  function allSpecStrings(role) {
    if (!specStringCache) {
      const bag = { k: [], v: [], s: [] };
      const programs = (DATA && DATA.programs) || {};
      Object.keys(programs).forEach((id) => {
        (programs[id].specs || []).forEach((t) => {
          ["k", "v", "s"].forEach((r) => {
            const s = t && t[r];
            if (s != null && String(s).trim()) bag[r].push(String(s));
          });
        });
      });
      (SPEC_LIVE_PROBES.v || []).forEach((s) => bag.v.push(s));
      (SPEC_LIVE_PROBES.s || []).forEach((s) => bag.s.push(s));
      specStringCache = bag;
    }
    return specStringCache[role] || [];
  }

  function invalidateSpecType() {
    specTypeReady = false;
    specStringCache = null;
  }

  /** Mac/iPad: don't flash type until webfonts measured. Phone: show when fitted. */
  let densFontsReady =
    typeof document === "undefined" ||
    !document.fonts ||
    document.fonts.status === "loaded";

  function revealDensType() {
    if (densTablet() && document.fonts && !densFontsReady) return;
    if (el.specsGrid && el.specsGrid.children.length)
      el.specsGrid.classList.add("is-typefit");
    if (el.contextGrid && el.contextGrid.querySelector(".tile"))
      el.contextGrid.classList.add("is-typefit");
    if (el.mediaRail && el.mediaRail.querySelector(".media-card"))
      el.mediaRail.classList.add("is-typefit");
  }

  function applySpecType() {
    if (!el.specsGrid) return;
    el.specsGrid.querySelectorAll(".spec-cell").forEach((cell) => {
      const k = cell.querySelector(".k");
      const v = cell.querySelector(".v");
      const s = cell.querySelector(".s");
      if (k) k.style.fontSize = SPEC_SIZE.k + "px";
      if (v) v.style.fontSize = SPEC_SIZE.v + "px";
      if (s) s.style.fontSize = SPEC_SIZE.s + "px";
    });
    revealDensType();
  }

  function fitRoleToStrings(sampleNode, strings, maxPx, minPx) {
    if (!sampleNode || sampleNode.clientWidth < 2) return minPx;
    if (!strings || !strings.length) return maxPx;
    const saved = sampleNode.textContent;
    let lo = minPx;
    let hi = maxPx;
    let best = minPx;
    for (let i = 0; i < 16; i++) {
      const mid = (lo + hi) / 2;
      sampleNode.style.fontSize = mid + "px";
      let overflows = false;
      for (let j = 0; j < strings.length; j++) {
        sampleNode.textContent = strings[j];
        if (lineOverflows(sampleNode)) {
          overflows = true;
          break;
        }
      }
      if (overflows) hi = mid;
      else {
        best = mid;
        lo = mid;
      }
    }
    sampleNode.textContent = saved;
    return Math.max(minPx, best);
  }

  function fitRoleToGlobalStrings(sampleNode, role, maxPx, minPx) {
    return fitRoleToStrings(sampleNode, allSpecStrings(role), maxPx, minPx);
  }

  /** Visible 12-cell strings (+ quote probes) — tablet sync without whole-app longest drag */
  function gridSpecStrings(role, cells) {
    const out = [];
    (cells || []).forEach((cell) => {
      const n = cell.querySelector("." + role);
      const t = n && n.textContent;
      if (t && String(t).trim()) out.push(String(t).trim());
    });
    if (role === "v") (SPEC_LIVE_PROBES.v || []).forEach((s) => out.push(s));
    if (role === "s") (SPEC_LIVE_PROBES.s || []).forEach((s) => out.push(s));
    return out;
  }

  /**
   * iPad CSS zoom breaks scrollWidth/clientWidth — measure at zoom/transform none.
   */
  function withUnzoomedApp(fn) {
    const appEl = el.app;
    if (!appEl) return fn();
    const z = appEl.style.zoom;
    const tr = appEl.style.transform;
    appEl.style.zoom = "";
    appEl.style.transform = "";
    void appEl.offsetWidth;
    try {
      return fn();
    } finally {
      appEl.style.zoom = z;
      appEl.style.transform = tr;
    }
  }

  function lockSpecType(force) {
    if (!el.specsGrid) return;
    const cells = el.specsGrid.querySelectorAll(".spec-cell");
    if (!cells.length) return;

    const sample = cells[0];
    const sk = sample.querySelector(".k");
    const sv = sample.querySelector(".v");
    const ss = sample.querySelector(".s");
    if (!sk || !sv || !ss || sk.clientWidth < 2) return;

    const w = sk.clientWidth;
    const tablet = densTablet();
    if (
      !force &&
      !tablet &&
      specTypeReady &&
      Math.abs(w - specTypeWidth) < 1 &&
      tablet === specTypeTablet
    ) {
      applySpecType();
      return;
    }

    const lim = specLimits();
    /* One size per role across all 12 boxes — never per-cell (looks chaotic) */
    const kStr = tablet ? gridSpecStrings("k", cells) : allSpecStrings("k");
    const vStr = tablet ? gridSpecStrings("v", cells) : allSpecStrings("v");
    const sStr = tablet ? gridSpecStrings("s", cells) : allSpecStrings("s");
    SPEC_SIZE.k = fitRoleToStrings(sk, kStr, lim.max.k, lim.min.k);
    SPEC_SIZE.v = fitRoleToStrings(sv, vStr, lim.max.v, lim.min.v);
    SPEC_SIZE.s = fitRoleToStrings(ss, sStr, lim.max.s, lim.min.s);
    specTypeReady = true;
    specTypeWidth = w;
    specTypeTablet = tablet;
    applySpecType();
  }

  function fitDenseLine(node, maxPx, minPx) {
    if (!node) return;
    if (!(node.textContent || "").trim()) {
      node.style.fontSize = "";
      return;
    }
    if (node.clientWidth < 2) return;
    let lo = minPx;
    let hi = maxPx;
    let best = minPx;
    for (let i = 0; i < 16; i++) {
      const mid = (lo + hi) / 2;
      node.style.fontSize = mid + "px";
      if (lineOverflows(node)) hi = mid;
      else {
        best = mid;
        lo = mid;
      }
    }
    node.style.fontSize = Math.max(minPx, best) + "px";
  }

  function fitDenseLines(forceSpec) {
    withUnzoomedApp(function () {
      lockSpecType(!!forceSpec);
      const ops = opsFitLimits();
      const onX = onXFitLimits();
      if (el.contextGrid) {
        el.contextGrid.querySelectorAll(".tile").forEach((cell) => {
          fitDenseLine(cell.querySelector(".k"), ops.k[0], ops.k[1]);
          fitDenseLine(cell.querySelector(".v"), ops.v[0], ops.v[1]);
          fitDenseLine(cell.querySelector(".s"), ops.s[0], ops.s[1]);
        });
      }
      if (el.mediaRail) {
        el.mediaRail.querySelectorAll(".media-card").forEach((cell) => {
          fitDenseLine(cell.querySelector(".title"), onX[0], onX[1]);
        });
      }
      revealDensType();
    });
  }

  function scheduleDenseFit() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => fitDenseLines(true));
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function tickCountdown() {
    const p = program(activeId);
    const n = p.next || {};
    const c = countdownParts(n.net, n.precision);
    el.countdown.textContent = c.main;
    if (el.countdownSub) {
      const sub = (c.sub || "").trim();
      el.countdownSub.textContent = sub;
      if (sub) el.countdownSub.removeAttribute("hidden");
      else el.countdownSub.setAttribute("hidden", "");
    }
  }

  /** Vehicle line under mission name — drop redundant rocket / mission noise */
  function rocketLine(programId, rocket, missionType) {
    let r = rocket || "";
    if (programId === "falcon9" || programId === "starlink") {
      r = r.replace(/Falcon\s*9\s*/gi, "").trim();
    } else if (programId === "heavy") {
      r = r.replace(/Falcon\s*Heavy\s*/gi, "").trim();
    } else if (programId === "starship") {
      r = r.replace(/^Starship\s*[·|•]?\s*/i, "").trim();
    } else if (programId === "dragon") {
      r = r.replace(/Falcon\s*9\s*[·|•]?\s*/i, "").trim();
    }

    let mt = (missionType || "").trim();
    /* Starlink (and similar) already say the job — drop "Communications" */
    mt = mt
      .replace(/Communications\s*[·|•/,-]?\s*/gi, "")
      .replace(/^\s*[·|•]\s*|\s*[·|•]\s*$/g, "")
      .trim();

    const parts = [];
    if (r) parts.push(r);
    if (mt) parts.push(mt);
    return parts.join(" · ") || "—";
  }

  function hasHardWatch(n) {
    const prec = (n.precision || "").toLowerCase();
    const hard = prec === "minute" || prec === "hour";
    const goish = /go/i.test(n.status || "") && !/no\s*go/i.test(n.status || "");
    return hard && goish && !!(n.webcast);
  }

  function siteById(id) {
    return (DATA.sites || []).find((s) => s.id === id) || null;
  }

  function nextSite(n) {
    if (n.siteId) return siteById(n.siteId);
    return null;
  }

  function getAccentHex() {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue("--accent")
      .trim();
    return raw && raw.startsWith("#") ? raw : "#9eabb8";
  }

  /**
   * Next-pin color follows the *launch* (Starlink / Ship / Dragon…),
   * not Machine chrome (pale) — color by launch family.
   */
  function classifyNextProgramId(n) {
    if (!n) return null;
    if (n.programId && DATA.programs[n.programId]) return n.programId;
    const blob = [n.name, n.rocket, n.missionType, n.statusNote]
      .filter(Boolean)
      .join(" ");
    if (/Starship|\bIFT\b|Flight Test/i.test(blob) && !/Falcon/i.test(n.rocket || "")) {
      return "starship";
    }
    if (/Heavy/i.test(n.rocket || "") || /Falcon\s*Heavy/i.test(blob)) return "heavy";
    if (/Dragon|Crew-\d|CRS-|Ax-\d|Axiom/i.test(blob)) return "dragon";
    if (/Starlink/i.test(blob)) return "starlink";
    if (/Falcon\s*9/i.test(n.rocket || blob)) return "falcon9";
    return null;
  }

  function nextPinAccent(n) {
    const id = classifyNextProgramId(n);
    if (id && DATA.programs[id] && DATA.programs[id].accent) {
      return DATA.programs[id].accent;
    }
    if (activeId !== "machine") {
      const p = program(activeId);
      if (p && p.accent) return p.accent;
    }
    return DATA.programs.falcon9?.accent || getAccentHex() || "#9eabb8";
  }

  /*
   * Accurate shoreline: CARTO Dark tiles (OSM geometry) + local NE borders.
   * Markers always use true lat/lon (Google Maps / pad coords) — never fudged.
   * Coarse NE-only coasts painted beach pads "in water"; tiles fix that.
   */
  const MAP_TILE_URL =
    "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png";
  const GEO_COUNTRIES = "geo/countries.geojson";
  const GEO_STATES = "geo/states.geojson";

  let leafletMini = null;
  let leafletFull = null;
  let miniLayerGroup = null;
  let fullLayerGroup = null;
  let borderDataPromise = null;
  const mapsWithBorders = new WeakSet();

  function pinIcon(isNext, large, nextColor) {
    const Lref = window.L;
    if (!Lref || !Lref.divIcon) return undefined;
    /* Visible dot size vs larger hit box for mobile taps */
    const dot = large ? (isNext ? 14 : 10) : isNext ? 12 : 8;
    const hit = large ? 32 : 28;
    const color = isNext ? nextColor || nextPinAccent(null) : "#f2f5fa";
    const ring = isNext
      ? "box-shadow:0 0 0 2px rgba(4,6,10,0.95),0 0 12px " + color + ";"
      : "box-shadow:0 0 0 1px rgba(4,6,10,0.9);";
    try {
      return Lref.divIcon({
        className: "sh-pin leaflet-div-icon" + (isNext ? " is-next" : ""),
        html:
          '<span class="sh-pin-hit"><span class="sh-pin-dot" style="width:' +
          dot +
          "px;height:" +
          dot +
          "px;background:" +
          color +
          ";" +
          ring +
          '"></span></span>',
        iconSize: [hit, hit],
        iconAnchor: [hit / 2, hit / 2],
        popupAnchor: [0, -hit / 2],
      });
    } catch (e) {
      return undefined;
    }
  }

  function loadBorderGeo() {
    if (borderDataPromise) return borderDataPromise;
    borderDataPromise = Promise.all([
      fetch(GEO_COUNTRIES).then((r) => {
        if (!r.ok) throw new Error("countries " + r.status);
        return r.json();
      }),
      fetch(GEO_STATES).then((r) => {
        if (!r.ok) throw new Error("states " + r.status);
        return r.json();
      }),
    ])
      .then(([countries, states]) => ({ countries, states }))
      .catch((err) => {
        console.warn("SpaceXplore border geo failed", err);
        borderDataPromise = null;
        return null;
      });
    return borderDataPromise;
  }

  function countryBorderStyle() {
    /* Uniform weight worldwide — no bold US/Canada */
    return {
      color: "#c8d0dc",
      weight: 0.55,
      opacity: 0.55,
      fillColor: "#0a1018",
      fillOpacity: 0.03,
      interactive: false,
    };
  }

  function addWhiteBorders(map) {
    const Lref = window.L;
    if (!Lref || !map || mapsWithBorders.has(map)) return;
    loadBorderGeo().then((data) => {
      if (!data || !map || mapsWithBorders.has(map)) return;
      try {
        Lref.geoJSON(data.countries, {
          style: countryBorderStyle,
          interactive: false,
        }).addTo(map);
        Lref.geoJSON(data.states, {
          style: function () {
            return {
              color: "#b0bac8",
              weight: 0.45,
              opacity: 0.5,
              fill: false,
              interactive: false,
            };
          },
          interactive: false,
        }).addTo(map);
        mapsWithBorders.add(map);
        if (map === leafletMini && miniLayerGroup) miniLayerGroup.bringToFront();
        if (map === leafletFull && fullLayerGroup) fullLayerGroup.bringToFront();
        /* Re-frame after vectors load so mini isn't empty */
        if (map === leafletMini) frameMiniMap();
        if (map === leafletFull && mapOpen) frameFullMap(false);
      } catch (err) {
        console.warn("SpaceXplore borders draw failed", err);
      }
    });
  }

  /** Open Google Maps app if present; else Apple Maps on iOS; else geo / Google on Android & desktop. */
  function openInMaps(lat, lon, label) {
    const la = Number(lat);
    const lo = Number(lon);
    if (!Number.isFinite(la) || !Number.isFinite(lo)) return;
    const name = (label || la + ", " + lo).trim();
    const q = encodeURIComponent(name);
    const ll = la + "," + lo;
    const ua = navigator.userAgent || "";
    const isiOS =
      /iPad|iPhone|iPod/i.test(ua) ||
      (navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1);
    const isAndroid = /Android/i.test(ua);

    if (isAndroid) {
      /* geo: prefers installed maps app (usually Google) — not a browser tab */
      window.location.href =
        "geo:" + la + "," + lo + "?q=" + encodeURIComponent(ll + "(" + name + ")");
      return;
    }

    if (isiOS) {
      /*
       * Prefer Google Maps app. Only fall back to Apple Maps if we clearly
       * never left this page (Google not installed). A short timed fallback
       * opens BOTH apps when Google succeeds — cancel on hide/blur instead.
       */
      const gmaps = "comgooglemaps://?q=" + ll + "&center=" + ll + "&zoom=16";
      const apple = "maps://?ll=" + ll + "&q=" + q;
      let handedOff = false;
      let timer = 0;
      function cleanup() {
        document.removeEventListener("visibilitychange", onHide);
        window.removeEventListener("pagehide", onHide);
        window.removeEventListener("blur", onHide);
        if (timer) {
          window.clearTimeout(timer);
          timer = 0;
        }
      }
      function onHide() {
        handedOff = true;
        cleanup();
      }
      document.addEventListener("visibilitychange", onHide);
      window.addEventListener("pagehide", onHide);
      window.addEventListener("blur", onHide);
      window.location.href = gmaps;
      timer = window.setTimeout(function () {
        cleanup();
        if (handedOff || document.hidden || document.visibilityState === "hidden") {
          return;
        }
        window.location.href = apple;
      }, 2200);
      return;
    }

    /* Desktop / other: Google Maps */
    window.open(
      "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(ll),
      "_blank",
      "noopener,noreferrer"
    );
  }

  function wirePopupOpenMaps(map) {
    if (!map || map._shMapsWired) return;
    map._shMapsWired = true;
    map.on("popupopen", function (e) {
      const root = e.popup && e.popup.getElement && e.popup.getElement();
      if (!root) return;
      const btn = root.querySelector(".sh-maps-btn");
      if (!btn || btn._shBound) return;
      btn._shBound = true;
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        openInMaps(
          btn.getAttribute("data-lat"),
          btn.getAttribute("data-lon"),
          btn.getAttribute("data-label") || ""
        );
      });
    });
  }

  function worldLatLngBounds(Lref) {
    return Lref.latLngBounds(Lref.latLng(-85, -180), Lref.latLng(85, 180));
  }

  /**
   * Min zoom = most zoomed-out view that still fills the map height
   * (no empty band past N/S edges of the mercator world).
   * inside:true → viewport must stay within world bounds.
   */
  function applyGlobeFloor(map) {
    const Lref = window.L;
    if (!Lref || !map) return;
    try {
      map.invalidateSize({ pan: false });
      const world = worldLatLngBounds(Lref);
      /* inside=true: map view fits inside world — no void above/below poles */
      let z = map.getBoundsZoom(world, true);
      if (!Number.isFinite(z)) z = 1;
      /* Ceil so we never slip past the edges on integer zoom snaps */
      const floor = Math.max(1, Math.min(Math.ceil(z - 1e-9), 6));
      map.setMinZoom(floor);
      if (map.getZoom() < floor) {
        map.setZoom(floor, { animate: false });
      }
      map.setMaxBounds(world);
    } catch (_) {}
  }

  /** Center for full-globe open: next pad if known, else mean of sites. */
  function globeCenterLatLng() {
    const site = currentNextSite();
    if (site) return [site.lat, site.lon];
    const sites = DATA.sites || [];
    if (!sites.length) return [20, -40];
    let la = 0;
    let lo = 0;
    sites.forEach((s) => {
      la += s.lat;
      lo += s.lon;
    });
    return [la / sites.length, lo / sites.length];
  }

  function makeBaseMap(container, interactive) {
    const Lref = window.L;
    /* One globe only — no infinite horizontal wrap / multi-world pan */
    const worldBounds = worldLatLngBounds(Lref);
    const map = Lref.map(container, {
      zoomControl: !!interactive,
      attributionControl: false,
      dragging: !!interactive,
      scrollWheelZoom: !!interactive,
      doubleClickZoom: !!interactive,
      boxZoom: !!interactive,
      keyboard: !!interactive,
      touchZoom: !!interactive,
      preferCanvas: false,
      worldCopyJump: false,
      maxBounds: worldBounds,
      maxBoundsViscosity: 1.0,
      minZoom: 0,
      maxZoom: 18,
    });
    map.getContainer().style.background = "#04060a";
    map.setMaxBounds(worldBounds);
    /* Real shorelines from OSM via CARTO dark (not satellite) */
    Lref.tileLayer(MAP_TILE_URL, {
      maxZoom: 18,
      minZoom: 0,
      subdomains: "abcd",
      className: "sh-map-tiles",
      opacity: 1,
      noWrap: true,
      bounds: worldBounds,
    }).addTo(map);
    if (interactive) wirePopupOpenMaps(map);
    addWhiteBorders(map);
    /* Full map only: lock min zoom to edge-filling globe (mini uses regional frame) */
    if (interactive) {
      setTimeout(function () {
        applyGlobeFloor(map);
        map.setView(globeCenterLatLng(), map.getMinZoom(), { animate: false });
      }, 0);
    }
    return map;
  }

  function ensureMiniMap() {
    const Lref = window.L;
    if (!Lref || !el.miniMap || leafletMini) return leafletMini;
    try {
      leafletMini = makeBaseMap(el.miniMap, false);
      miniLayerGroup = Lref.layerGroup().addTo(leafletMini);
    } catch (err) {
      console.warn("SpaceXplore mini map init failed", err);
      leafletMini = null;
    }
    return leafletMini;
  }

  function ensureFullMap() {
    const Lref = window.L;
    if (!Lref || !el.fullMap || leafletFull) {
      if (leafletFull && !leafletFull._shViewWired) {
        leafletFull._shViewWired = true;
        leafletFull.on("moveend zoomend", rememberFullMapView);
      }
      return leafletFull;
    }
    try {
      leafletFull = makeBaseMap(el.fullMap, true);
      fullLayerGroup = Lref.layerGroup().addTo(leafletFull);
      if (!leafletFull._shViewWired) {
        leafletFull._shViewWired = true;
        leafletFull.on("moveend zoomend", rememberFullMapView);
      }
    } catch (err) {
      console.warn("SpaceXplore full map init failed", err);
      leafletFull = null;
    }
    return leafletFull;
  }

  function rememberFullMapView() {
    if (!leafletFull || !mapOpen) return;
    try {
      const c = leafletFull.getCenter();
      const z = leafletFull.getZoom();
      if (!c || !Number.isFinite(z)) return;
      fullMapView = { lat: c.lat, lng: c.lng, zoom: z };
    } catch (_) {}
  }

  function restoreFullMapView() {
    if (!leafletFull || !fullMapView) return false;
    try {
      leafletFull.invalidateSize({ pan: false });
      applyGlobeFloor(leafletFull);
      const z = Math.max(leafletFull.getMinZoom(), fullMapView.zoom);
      leafletFull.setView([fullMapView.lat, fullMapView.lng], z, {
        animate: false,
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  function syncSiteMarkers(layerGroup, highlightId, large, interactive, nextColor) {
    const Lref = window.L;
    if (!Lref || !layerGroup) return;
    const pinColor = nextColor || "#7ddea0";
    /* Avoid wiping markers every frame (breaks taps). Include pin color. */
    const key =
      (highlightId || "") +
      "|" +
      pinColor +
      "|" +
      (interactive ? "1" : "0") +
      "|" +
      (large ? "L" : "s") +
      "|" +
      ((DATA.sites && DATA.sites.length) || 0) +
      "|r" +
      (DATA.sitesRev || 0);
    if (layerGroup._shKey === key) {
      try {
        layerGroup.bringToFront();
      } catch (_) {}
      return;
    }
    layerGroup._shKey = key;
    try {
      layerGroup.clearLayers();
      (DATA.sites || []).forEach((s) => {
        const isNext = s.id === highlightId;
        const icon = pinIcon(isNext, large, pinColor);
        const opts = {
          interactive: !!interactive,
          keyboard: !!interactive,
          zIndexOffset: isNext ? 1000 : 200,
          riseOnHover: true,
        };
        if (icon) opts.icon = icon;
        const m = Lref.marker([s.lat, s.lon], opts);
        if (interactive) {
          const kind = SITE_KIND_LABEL[s.kind] || s.kind || "Site";
          const blurb = s.blurb || "SpaceX-related site pin.";
          m.bindPopup(
            "<div class='sh-pop-inner'>" +
              "<strong>" +
              escapeHtml(s.name) +
              (isNext ? " · Next" : "") +
              "</strong>" +
              "<div class='sh-pop-kind'>" +
              escapeHtml(kind) +
              "</div>" +
              "<p class='sh-pop-blurb'>" +
              escapeHtml(blurb) +
              "</p>" +
              "<button type='button' class='sh-maps-btn' data-lat='" +
              s.lat +
              "' data-lon='" +
              s.lon +
              "' data-label='" +
              escapeHtml(s.name) +
              "'>Open in Maps</button>" +
              "</div>",
            { maxWidth: 280, className: "sh-pop", autoPan: true }
          );
        }
        m.addTo(layerGroup);
      });
      layerGroup.bringToFront();
    } catch (err) {
      console.warn("SpaceXplore markers failed", err);
    }
  }

  function currentNextSite() {
    const p = program(activeId);
    return nextSite(p.next || {});
  }

  function frameMiniMap() {
    const Lref = window.L;
    if (!Lref || !leafletMini) return;
    const site = currentNextSite();
    try {
      leafletMini.invalidateSize({ pan: false });
      if (site) {
        /* Regional frame — enough land to see coasts/states, not pin-only */
        const d = 2.8;
        leafletMini.fitBounds(
          [
            [site.lat - d, site.lon - d],
            [site.lat + d, site.lon + d],
          ],
          { animate: false, maxZoom: 6, padding: [6, 6] }
        );
      } else {
        const pts = (DATA.sites || []).map((s) => [s.lat, s.lon]);
        if (pts.length) {
          leafletMini.fitBounds(Lref.latLngBounds(pts).pad(0.35), {
            animate: false,
            maxZoom: 4,
          });
        }
      }
    } catch (_) {}
  }

  function frameFullMap(force) {
    if (!leafletFull) return;
    try {
      leafletFull.invalidateSize({ pan: false });
      applyGlobeFloor(leafletFull);
      /* Keep the user's pan/zoom unless forcing globe home */
      if (!force && restoreFullMapView()) return;
      leafletFull.setView(globeCenterLatLng(), leafletFull.getMinZoom(), {
        animate: false,
      });
    } catch (_) {}
  }

  let paintMapsTimer = 0;
  function schedulePaintMaps() {
    clearTimeout(paintMapsTimer);
    paintMapsTimer = setTimeout(paintMaps, 40);
  }

  function paintMaps() {
    try {
      const Lref = window.L;
      if (!Lref || !DATA) return;

      const p = program(activeId);
      const n = (p && p.next) || {};
      const site = currentNextSite();
      const hid = site ? site.id : null;
      const pinColor = nextPinAccent(n);
      document.documentElement.style.setProperty("--next-pin", pinColor);

      ensureMiniMap();
      if (leafletMini) {
        syncSiteMarkers(miniLayerGroup, hid, false, false, pinColor);
        frameMiniMap();
      }

      if (mapOpen) {
        ensureFullMap();
        if (leafletFull) {
          syncSiteMarkers(fullLayerGroup, hid, true, true, pinColor);
          frameFullMap(false);
          /* Layout settle after overlay open — restore, don't snap to globe */
          setTimeout(function () {
            if (!mapOpen || !leafletFull) return;
            frameFullMap(false);
          }, 50);
          setTimeout(function () {
            if (!mapOpen || !leafletFull) return;
            frameFullMap(false);
          }, 200);
        }
        if (el.mapOverlaySub) {
          el.mapOverlaySub.textContent = site
            ? "Next · " + site.name
            : "Next site not set";
        }
        const countEl = document.getElementById("map-site-count");
        if (countEl) {
          countEl.textContent = (DATA.sites || []).length + " sites";
        }
      }
    } catch (err) {
      console.warn("SpaceXplore paintMaps failed", err);
    }
  }

  function openMap() {
    mapOpen = true;
    if (el.mapOverlay) {
      el.mapOverlay.hidden = false;
      el.mapOverlay.removeAttribute("hidden");
      el.mapOverlay.classList.add("is-open");
      el.mapOverlay.setAttribute("aria-hidden", "false");
    }
    /* Wait until overlay has real height, then init/size Leaflet */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        paintMaps();
        setTimeout(paintMaps, 100);
        setTimeout(paintMaps, 300);
      });
    });
  }

  function closeMap() {
    mapOpen = false;
    try {
      if (leafletFull) leafletFull.closePopup();
    } catch (_) {}
    if (el.mapOverlay) {
      el.mapOverlay.hidden = true;
      el.mapOverlay.setAttribute("hidden", "");
      el.mapOverlay.classList.remove("is-open");
      el.mapOverlay.setAttribute("aria-hidden", "true");
    }
  }

  function renderProgram(id) {
    const p = program(id);
    const n = p.next || {};
    setAccent(p.accent || "#9eabb8");

    el.statusChip.textContent = n.status || "—";
    el.statusChip.className = "status-chip " + statusClass(n.status);

    el.missionName.textContent = n.name || "—";
    el.missionSub.textContent = rocketLine(id, n.rocket, n.missionType);
    el.missionMeta.textContent = n.pad || "—";

    tickCountdown();

    /* Watch only when hard clock + link — not permanent chrome */
    if (hasHardWatch(n)) {
      el.btnWatch.hidden = false;
      el.btnWatch.classList.remove("is-hidden");
      el.btnWatch.href = n.webcast;
    } else {
      el.btnWatch.hidden = true;
      el.btnWatch.classList.add("is-hidden");
      el.btnWatch.removeAttribute("href");
    }

    renderScale(p);
    renderSpecs(p);
    renderWeather(p.weather || {});
    renderTiles(p.tiles);
    renderMix(p.stats);
    renderMedia();
    fitDenseLines();
    /* Debounced mini-map — don’t block chip switches */
    schedulePaintMaps();

    el.picker.querySelectorAll(".pick").forEach((btn) => {
      const on = btn.dataset.id === id;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function selectProgram(id) {
    activeId = id;
    renderProgram(id);
  }

  /**
   * Viewport fit
   * - Safari tab (phone): pin stage to visualViewport (SolarDashboard).
   * - PWA A2HS (phone/iPad): Bug B — lock to screen fill height (SuperMoon).
   *   VV alone leaves ~5/16" black under the layout box.
   */
  function isStandaloneShell() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      (typeof navigator !== "undefined" && navigator.standalone === true)
    );
  }

  function isPhoneShell() {
    return (
      window.matchMedia("(max-width: 500px)").matches ||
      (window.matchMedia("(pointer: coarse)").matches &&
        Math.min(window.innerWidth, window.innerHeight) <= 500)
    );
  }

  function isTouchLike() {
    return (
      (navigator.maxTouchPoints || 0) > 0 ||
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(hover: none)").matches
    );
  }

  function readSafeInsetBottom() {
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:fixed;visibility:hidden;pointer-events:none;padding-bottom:env(safe-area-inset-bottom,0px)";
    document.body.appendChild(probe);
    const px = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
    probe.remove();
    return px;
  }

  function pwaFillHeightPx() {
    const iw = window.innerWidth || 0;
    const ih = window.innerHeight || 0;
    const sw = window.screen.width || 0;
    const sh = window.screen.height || 0;
    const screenMax = Math.max(sw, sh);
    const screenMin = Math.min(sw, sh);
    /* Portrait: tall axis; landscape: short screen axis for height */
    return ih >= iw ? Math.max(ih, screenMax) : Math.max(ih, screenMin);
  }

  function pwaExtraBottomPx() {
    const iw = window.innerWidth || 0;
    const ih = window.innerHeight || 0;
    const sw = window.screen.width || 0;
    const sh = window.screen.height || 0;
    const screenMax = Math.max(sw, sh);
    /* iPad: screen can undershoot CSS inner — need a little extra */
    if (Math.min(iw, ih) < 600) return 0;
    if (screenMax >= ih - 10) return 0;
    return Math.max(readSafeInsetBottom(), 20);
  }

  function syncPwaFillHeight() {
    const root = document.documentElement;
    if (!isStandaloneShell()) {
      root.classList.remove("pwa-standalone");
      root.style.removeProperty("--pwa-fill-h");
      root.style.removeProperty("--pwa-extra-b");
      return 0;
    }
    root.classList.add("pwa-standalone");
    const fillH = pwaFillHeightPx();
    const extra = pwaExtraBottomPx();
    root.style.setProperty("--pwa-fill-h", fillH + "px");
    root.style.setProperty("--pwa-extra-b", extra + "px");
    return fillH + extra;
  }

  /* —— Starfield (full stage, paints into former strip) —— */
  let stars = [];
  let starRaf = 0;

  function seedStars(w, h) {
    const count = Math.min(220, Math.max(90, Math.floor((w * h) / 2800)));
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() < 0.12 ? 1.35 : Math.random() < 0.4 ? 0.9 : 0.55,
        a: 0.25 + Math.random() * 0.7,
        tw: Math.random() * Math.PI * 2,
        sp: 0.4 + Math.random() * 1.2,
      });
    }
  }

  function paintStarfield() {
    const canvas = document.getElementById("starfield");
    const stage = document.getElementById("fit-stage");
    if (!canvas || !stage) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(stage.clientWidth));
    const h = Math.max(1, Math.round(stage.clientHeight));
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      seedStars(w, h);
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#04060a";
    ctx.fillRect(0, 0, w, h);
    /* soft glows */
    const g1 = ctx.createRadialGradient(w * 0.5, 0, 0, w * 0.5, 0, h * 0.55);
    g1.addColorStop(0, "rgba(90,140,200,0.14)");
    g1.addColorStop(1, "rgba(4,6,10,0)");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, w, h);
    const g2 = ctx.createRadialGradient(w, h, 0, w, h, w * 0.7);
    g2.addColorStop(0, "rgba(232,140,70,0.06)");
    g2.addColorStop(1, "rgba(4,6,10,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, w, h);

    const t = performance.now() * 0.001;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.55 + 0.45 * Math.sin(t * s.sp + s.tw);
      ctx.beginPath();
      ctx.fillStyle = "rgba(220,230,255," + (s.a * tw).toFixed(3) + ")";
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loopStars() {
    if (document.visibilityState === "hidden") {
      starRaf = 0;
      return;
    }
    paintStarfield();
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      starRaf = 0;
      return;
    }
    starRaf = requestAnimationFrame(loopStars);
  }

  function ensureStarLoop() {
    if (starRaf) return;
    if (document.visibilityState === "hidden") return;
    loopStars();
  }

  let fitRaf = 0;
  let lastFitKey = "";
  let hasRevealed = false;

  function revealApp() {
    if (hasRevealed) return;
    hasRevealed = true;
    el.app.classList.add("is-fitted");
  }

  function fitArtboard() {
    const stage = document.getElementById("fit-stage");
    const appEl = el.app;
    if (!stage || !appEl) return;

    const phone = isPhoneShell();
    const vv = window.visualViewport;
    const standalone = isStandaloneShell();
    document.documentElement.dataset.shell = standalone ? "standalone" : "browser";
    document.documentElement.dataset.layout = phone ? "phone" : "wide";

    if (phone) {
      appEl.style.transform = "";
      appEl.style.zoom = "";
      appEl.style.width = "";
      appEl.style.height = "";
      appEl.style.maxWidth = "";

      stage.classList.add("fit-stage--fluid");
      stage.classList.toggle("fit-stage--standalone", standalone);
      stage.classList.toggle("fit-stage--browser", !standalone);
      stage.style.position = "fixed";
      stage.style.margin = "0";
      stage.style.right = "auto";
      stage.style.bottom = "auto";

      if (standalone) {
        /* Bug B: fill to screen height — not short VV/inner layout box */
        const total = syncPwaFillHeight();
        stage.classList.remove("fit-stage--vv");
        stage.style.top = "0";
        stage.style.left = "0";
        stage.style.width = "100%";
        stage.style.height = total > 0 ? total + "px" : "100%";
      } else if (vv && vv.height > 0) {
        /* Safari tab: exact visual viewport */
        document.documentElement.classList.remove("pwa-standalone");
        stage.classList.add("fit-stage--vv");
        stage.style.top = Math.round(vv.offsetTop) + "px";
        stage.style.left = Math.round(vv.offsetLeft) + "px";
        stage.style.width = Math.round(vv.width) + "px";
        stage.style.height = Math.round(vv.height) + "px";
      } else {
        stage.classList.remove("fit-stage--vv");
        stage.style.inset = "0";
        stage.style.width = "";
        stage.style.height = "";
        stage.style.top = "";
        stage.style.left = "";
      }

      const fitKey =
        (standalone ? "pwa:" + pwaFillHeightPx() : "vv") +
        ":" +
        stage.clientWidth +
        "x" +
        stage.clientHeight;
      if (fitKey !== lastFitKey) {
        lastFitKey = fitKey;
        seedStars(stage.clientWidth, stage.clientHeight);
        fitDenseLines(true);
      }
      paintStarfield();
      revealApp();
      return;
    }

    /* Desktop / tablet — proportional artboard */
    stage.classList.remove(
      "fit-stage--vv",
      "fit-stage--standalone",
      "fit-stage--browser",
      "fit-stage--fluid"
    );
    stage.style.position = "fixed";
    stage.style.margin = "";

    /*
     * Bug B (Desktop Bottom:full bleed.txt): iPad PWA must keep screen
     * fill + extraB. Removing pwa-standalone here left the ~5/16" strip.
     */
    if (standalone) {
      const total = syncPwaFillHeight();
      stage.style.inset = "";
      stage.style.top = "0";
      stage.style.left = "0";
      stage.style.right = "auto";
      stage.style.bottom = "auto";
      stage.style.width = "100%";
      stage.style.height = total > 0 ? total + "px" : "100%";
    } else {
      document.documentElement.classList.remove("pwa-standalone");
      document.documentElement.style.removeProperty("--pwa-fill-h");
      document.documentElement.style.removeProperty("--pwa-extra-b");
      stage.style.inset = "0";
      stage.style.top = "";
      stage.style.left = "";
      stage.style.right = "";
      stage.style.bottom = "";
      stage.style.width = "";
      stage.style.height = "";
    }

    const ART_W = 390;
    const ART_H = 844;
    appEl.style.width = ART_W + "px";
    appEl.style.height = ART_H + "px";
    appEl.style.maxWidth = "none";

    const sw = stage.clientWidth;
    const sh = stage.clientHeight;
    if (sw < 2 || sh < 2) {
      revealApp();
      return;
    }

    const fitKey =
      (standalone ? "pwa-wide:" + pwaFillHeightPx() + "+" + pwaExtraBottomPx() : "wide") +
      ":" +
      sw +
      "x" +
      sh;
    if (fitKey !== lastFitKey) {
      lastFitKey = fitKey;
      seedStars(sw, sh);
      fitDenseLines(true);
    }

    const scale = Math.min(sw / ART_W, sh / ART_H, 1.35);
    if (isTouchLike() && typeof CSS !== "undefined" && CSS.supports?.("zoom", "1")) {
      appEl.style.transform = "";
      appEl.style.zoom = String(scale);
    } else {
      appEl.style.zoom = "";
      appEl.style.transform = "scale(" + scale + ")";
    }
    paintStarfield();
    revealApp();
  }

  function scheduleFit() {
    cancelAnimationFrame(fitRaf);
    fitRaf = requestAnimationFrame(() => {
      fitRaf = requestAnimationFrame(fitArtboard);
    });
  }

  function initFit() {
    if (isStandaloneShell()) syncPwaFillHeight();
    scheduleFit();
    loopStars();
    window.addEventListener("resize", scheduleFit);
    window.addEventListener("orientationchange", () => {
      setTimeout(scheduleFit, 50);
      setTimeout(scheduleFit, 300);
    });
    window.visualViewport?.addEventListener("resize", scheduleFit);
    window.visualViewport?.addEventListener("scroll", scheduleFit);
    window.matchMedia("(display-mode: standalone)").addEventListener?.("change", scheduleFit);
    window.addEventListener("pageshow", scheduleFit);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        scheduleFit();
        ensureStarLoop();
      }
    });
    /* DM Sans / Plex — wait, then fit once (avoids Mac big→small on font swap) */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        densFontsReady = true;
        invalidateSpecType();
        fitDenseLines(true);
      });
    } else {
      densFontsReady = true;
    }
    setTimeout(() => {
      el.app.classList.add("is-fitted");
      scheduleFit();
    }, 100);
    setTimeout(scheduleFit, 400);
  }

  let liveRefreshTimer = 0;
  let liveRefreshing = false;
  let livePullQueued = false;

  function paintLiveDesk() {
    invalidateSpecType();
    renderProgram(activeId);
  }

  function pullLive(reason) {
    const Live = window.SpaceXploreLive;
    if (!Live || typeof Live.refresh !== "function") {
      return Promise.resolve({ ok: false, skipped: true });
    }
    if (liveRefreshing) {
      livePullQueued = true;
      return Promise.resolve({ ok: false, busy: true });
    }
    liveRefreshing = true;
    /* Quote and LL2 each paint when ready — neither waits on the other */
    return Live.refresh({
      onQuote: function () {
        try {
          paintLiveDesk();
        } catch (err) {
          console.warn("SpaceXplore quote paint failed", err);
        }
      },
      onLl2: function () {
        try {
          paintLiveDesk();
        } catch (err) {
          console.warn("SpaceXplore LL2 paint failed", err);
        }
      },
    })
      .then(function (result) {
        liveRefreshing = false;
        if (result && result.live) {
          DATA.live = true;
          if (result.at) {
            DATA.lastUpdated = new Date(result.at).toISOString();
          }
        } else {
          DATA.live = false;
        }
        if (livePullQueued) {
          livePullQueued = false;
          return pullLive("queued");
        }
        return result;
      })
      .catch(function (err) {
        liveRefreshing = false;
        console.warn("SpaceXplore live pull failed", reason || "", err);
        try {
          paintLiveDesk();
        } catch (_) {}
        if (livePullQueued) {
          livePullQueued = false;
          return pullLive("queued");
        }
        return { ok: false, error: err };
      });
  }

  function scheduleLiveRefresh() {
    if (liveRefreshTimer) window.clearInterval(liveRefreshTimer);
    /* Align with live.js CACHE_MS (~12 min) */
    liveRefreshTimer = window.setInterval(function () {
      pullLive("interval");
    }, 12 * 60 * 1000);
  }

  /* Always show desk even if later code throws */
  if (el.app) el.app.classList.add("is-fitted");

  try {
    el.sheetClose?.addEventListener("click", () => el.sheet?.close());
    el.sheet?.addEventListener("click", (e) => {
      if (e.target === el.sheet) el.sheet.close();
    });

    el.nextMapBtn?.addEventListener("click", openMap);
    el.nextMapBtn?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openMap();
      }
    });
    el.mapOverlayClose?.addEventListener("click", closeMap);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mapOpen) {
        e.preventDefault();
        closeMap();
      }
    });
    el.povBtn?.addEventListener("click", openPovSheet);

    buildPicker();
    renderProgram(activeId);
    initFit();
    tickTimer = window.setInterval(tickCountdown, 1000);
    window.addEventListener("resize", () => {
      try {
        if (leafletMini) leafletMini.invalidateSize({ pan: false });
        if (leafletFull && mapOpen) {
          leafletFull.invalidateSize({ pan: false });
          applyGlobeFloor(leafletFull);
        }
      } catch (_) {}
    });
    setTimeout(paintMaps, 400);
    setTimeout(paintMaps, 1000);

    /* Live layer: paint desk data first, then merge LL2 + Open-Meteo */
    pullLive("boot").then(function () {
      scheduleLiveRefresh();
    });
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") {
        pullLive("visible");
      }
    });
  } catch (err) {
    console.error("SpaceXplore boot failed", err);
    if (el.app) el.app.classList.add("is-fitted");
  }
})();
