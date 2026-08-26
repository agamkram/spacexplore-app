/**
 * SpaceXplore data — programs, vehicle grids, sites.
 * Specs: published / widely cited public figures. Ops merge from LL2 when live.
 */
window.SPACEHUB_DATA = {
  year: 2026,
  fleetGoal: 145,
  fleetYtd: 90,
  lastUpdated: "2026-08-26T18:00:00Z",
  sitesRev: 38,

  /*
   * SpaceX site atlas — lat/lon checked against public maps / commonly cited pad coords.
   * Pin = facility center (not gate GPS). Unofficial · not survey-grade.
   * Brownsville city center removed (was wrong — Starbase is ~17 mi east at Boca Chica).
   * Jul 2026 verify: user LZ-4 + Starbase Pad 2 / production / Massey's; other pins
   * cross-checked vs Falcon UG, Wikipedia/Wikidata, OSM, TCEQ where available.
   * Aug 2026: Starbase Louisiana (Pecan Island) — planned; pin is coastal marsh
   * south of the Hwy 82 community (no pad survey yet).
   */
  sites: [
    /* ── California ── */
    {
      id: "hawthorne",
      name: "Headquarters · Hawthorne",
      kind: "hq",
      lat: 33.92036,
      lon: -118.32803,
      blurb:
        "1 Rocket Road, Hawthorne, CA — original HQ campus; still a core engineering, mission-control, and Falcon/Dragon manufacturing site (corporate HQ later shifted emphasis to Starbase, TX).",
    },
    {
      id: "hawthorne-factory",
      name: "Hawthorne · production",
      kind: "build",
      lat: 33.9188,
      lon: -118.3268,
      blurb:
        "Hawthorne production — Falcon and Dragon manufacturing beside the Rocket Road campus (1 Rocket Road).",
    },
    {
      id: "redmond",
      name: "Redmond · Starlink",
      kind: "starlink",
      lat: 47.69325,
      lon: -122.03523,
      blurb:
        "Starlink manufacturing and engineering in Redmond, WA (Redmond Ridge / NE Alder Crest) — satellites and related hardware (not a public gateway farm).",
    },
    {
      id: "slc4e",
      name: "SLC-4E · Vandenberg",
      kind: "launch",
      lat: 34.6320,
      lon: -120.6107,
      blurb:
        "Space Launch Complex 4 East, VSFB. Primary West Coast Falcon 9 pad for polar / high-inclination missions and Starlink. (Falcon User’s Guide pad coords.)",
    },
    {
      id: "slc6",
      name: "SLC-6 · Vandenberg",
      kind: "launch",
      lat: 34.5813,
      lon: -120.6266,
      blurb:
        "Space Launch Complex 6, VSFB — leased to SpaceX for Falcon 9 / Heavy. Former Delta IV / Shuttle pad; conversion underway as a second West Coast Falcon pad beside SLC-4E.",
    },
    {
      id: "lz4",
      name: "LZ-4 · Vandenberg",
      kind: "landing",
      lat: 34.6330063,
      lon: -120.6152312,
      blurb:
        "Landing Zone 4 at Vandenberg (former SLC-4W hardstand) for Falcon first-stage RTLS recoveries after westbound missions.",
    },
    {
      id: "vsfb-mill",
      name: "VSFB SpaceX area",
      kind: "support",
      lat: 34.63658,
      lon: -120.61227,
      blurb:
        "SpaceX Vandenberg campus (731 Kelp Road) — hangars and pad logistics supporting SLC-4E / LZ-4 west-coast ops.",
    },
    {
      id: "longbeach",
      name: "Long Beach · recovery",
      kind: "support",
      lat: 33.74442,
      lon: -118.22257,
      blurb:
        "Port of Long Beach Pier T (Nimitz Road) — West Coast droneship (OCISLY) and Falcon booster recovery / turnaround hub for Vandenberg missions.",
    },
    {
      id: "irvine",
      name: "Irvine · Starshield",
      kind: "office",
      lat: 33.69222,
      lon: -117.82772,
      blurb:
        "Irvine, CA — Starshield national-security programs office (historically 96 Corporate Park). Classified / government constellation work distinct from consumer Starlink.",
    },

    /* ── Texas · Starbase (Boca Chica) ── */
    {
      /* Coords from Google Maps (user) */
      id: "starbase-pad1",
      name: "Starbase · Pad 1",
      kind: "launch",
      lat: 25.9959995,
      lon: -97.1547577,
      blurb:
        "Pad 1 (OLP-1 / OLIT-1) — original Starbase orbital launch mount. Under major rebuild for next-generation Starship ops beside Pad 2.",
    },
    {
      /* Coords from Google Maps (user) — preferred over estimates */
      id: "starbase-pad2",
      name: "Starbase · Pad 2",
      kind: "launch",
      lat: 25.9967833,
      lon: -97.1580799,
      blurb:
        "Pad 2 (OLIT-2) — Starship Flight 13 (24 Jul 2026). Tower and mount are one pin (they sit on top of each other).",
    },
    {
      id: "starbase-build",
      name: "Starbase · production",
      kind: "build",
      lat: 25.9876556,
      lon: -97.1863283,
      blurb:
        "Starbase production — primary Starship / Super Heavy factory on Boca Chica Blvd; high bays and stack flow west of the pads.",
    },
    {
      id: "massey",
      name: "Massey's test site",
      kind: "test",
      lat: 25.9520417,
      lon: -97.2497528,
      blurb:
        "Massey's — tank, structural, and engine-related testing west of the main Starbase production strip.",
    },
    {
      id: "mcgregor",
      name: "McGregor · engine test",
      kind: "test",
      lat: 31.4003359,
      lon: -97.4620614,
      blurb:
        "McGregor — Raptor engine production and Merlin/Raptor acceptance firings in central Texas (1 Rocket Road campus).",
    },
    {
      id: "bastrop",
      name: "Bastrop · Starlink factory",
      kind: "starlink",
      lat: 30.1536076,
      lon: -97.4061886,
      blurb:
        "Starlink manufacturing hub near Austin (858 FM 1209, Bastrop County) — satellites, user terminals, and electronics.",
    },

    /* ── Louisiana · Starbase (Pecan Island) — announced 25 Aug 2026 ── */
    {
      /*
       * Approximate facility-area pin: ~5–8 mi south of Pecan Island (Hwy 82)
       * toward the Gulf / Freshwater Bayou corridor. Town GNIS is
       * 29.64667°N, 92.45306°W — launch complex is planned in the marsh
       * south of that community, not at the town center. ~125k-acre tract;
       * no surveyed pad centroid yet. Unofficial.
       */
      id: "starbase-la",
      name: "Starbase Louisiana · planned",
      kind: "launch",
      lat: 29.575,
      lon: -92.45,
      blurb:
        "Starbase Louisiana (Pecan Island / Freshwater Bayou, Vermilion Parish) — planned Starship spaceport on ~125,000 acres of former Exxon coastal marsh. Announced 25 Aug 2026 with Louisiana; construction targeted 2027, first launch ~2029. Vision: multiple launch complexes, propellant production, power, vehicle processing, deep-water barge access, and employee housing. Pin is approximate coastal-marsh area south of the Hwy 82 community — not a surveyed pad.",
    },

    /* ── Florida ── */
    {
      id: "39a",
      name: "LC-39A · Kennedy",
      kind: "launch",
      lat: 28.60833,
      lon: -80.60444,
      blurb:
        "Launch Complex 39A at KSC. Falcon Heavy, Crew Dragon, and high-profile Falcon 9 missions from the historic Apollo/Shuttle pad.",
    },
    {
      id: "39a-ship",
      name: "LC-39A · Starship",
      kind: "launch",
      lat: 28.6087,
      lon: -80.6035,
      blurb:
        "Starship launch / catch tower and pad path at LC-39A — Florida Starship infrastructure beside the Falcon hardstand. Build-out in progress.",
    },
    {
      id: "slc40",
      name: "SLC-40 · Cape Canaveral",
      kind: "launch",
      lat: 28.5619,
      lon: -80.5772,
      blurb:
        "Space Launch Complex 40, CCSFS. High-cadence Falcon 9 workhorse for Starlink, commercial, and national-security flights.",
    },
    {
      id: "slc37",
      name: "SLC-37 · Cape Canaveral",
      kind: "launch",
      lat: 28.53199,
      lon: -80.56682,
      blurb:
        "Space Launch Complex 37, CCSFS — SpaceX Starship dual-pad path (former Delta IV site). Demolition / site prep underway for east-coast Starship cadence.",
    },
    {
      id: "lz1",
      name: "LZ-1 · Cape Canaveral",
      kind: "landing",
      lat: 28.4857220,
      lon: -80.5429484,
      blurb:
        "Landing Zone 1 — RTLS pad for Falcon first stages after many East Coast missions.",
    },
    {
      id: "lz2",
      name: "LZ-2 · Cape Canaveral",
      kind: "landing",
      lat: 28.4877633,
      lon: -80.5449091,
      blurb:
        "Landing Zone 2 beside LZ-1 — second RTLS pad for dual recoveries and cadence.",
    },
    {
      id: "port",
      name: "Port Canaveral · recovery",
      kind: "support",
      lat: 28.41701,
      lon: -80.62400,
      blurb:
        "Port Canaveral SpaceX barge dock — droneship (ASDS) and recovery fleet homeport for Atlantic booster catches.",
    },
    {
      id: "roberts",
      name: "Roberts Rd · KSC",
      kind: "build",
      lat: 28.54541,
      lon: -80.66510,
      blurb:
        "Roberts Road at Kennedy — Starship / Gigabay path and campus expansion north of the Visitor Complex (Falcon hangars adjacent).",
    },
    {
      id: "hangarx",
      name: "Hangar X",
      kind: "build",
      lat: 28.54278,
      lon: -80.66765,
      blurb:
        "Hangar X / Roberts Road Operations Center — Falcon booster and fairing processing, offices, and launch support on the KSC Roberts Road campus.",
    },
    {
      id: "dragon-proc",
      name: "Dragon processing · KSC",
      kind: "support",
      lat: 28.5220,
      lon: -80.6480,
      blurb:
        "Crew / cargo Dragon processing near Kennedy. Spacecraft prep, test, and stage before stacking on Falcon. (Approximate campus pin — not a surveyed hangar centroid.)",
    },
    {
      id: "ccsfs-ind",
      name: "CCSFS industrial",
      kind: "support",
      lat: 28.4880,
      lon: -80.5770,
      blurb:
        "Cape Canaveral industrial support belt around SpaceX pads — processing, logistics, and range infrastructure. (Representative pin for the industrial corridor.)",
    },

    /* ── Offices / policy ── */
    {
      id: "dc",
      name: "Washington DC",
      kind: "office",
      lat: 38.89759,
      lon: -77.02781,
      blurb:
        "National capital office (1155 F St NW) for government customers, licensing, and policy engagement.",
    },

    /*
     * ── Mission recovery / tracking (not Starlink gateways) ──
     * SpaceX does not publish a dense global TTC estate like NASA DSN.
     * Launch telemetry is largely US range + company assets; ASDS zones
     * move with the mission. These ocean pins are representative recovery
     * areas for the “one machine” story — refine with mission-specific coords.
     */
    {
      id: "atlantic-asds",
      name: "Atlantic · ASDS zone",
      kind: "landing",
      lat: 30.0,
      lon: -74.0,
      blurb:
        "Typical East Coast droneship (ASDS) station-keeping region in the Atlantic for Falcon landings after Florida launches. Exact ship position moves every mission.",
    },
    {
      id: "pacific-asds",
      name: "Pacific · ASDS zone",
      kind: "landing",
      lat: 32.5,
      lon: -122.5,
      blurb:
        "Typical West Coast droneship region in the Pacific for Falcon landings after Vandenberg (and some other) missions. Ship moves with the trajectory.",
    },
    {
      id: "io-asds",
      name: "Indian Ocean · recovery",
      kind: "landing",
      lat: -15.5,
      lon: 72.5,
      blurb:
        "Indian Ocean recovery / disposal region for some high-energy Falcon trajectories. Not a fixed pad — open ocean. Refine when you have a mission-specific pin.",
    },
  ],

  programs: {
    /* Company / footprint desk — not a vehicle. Map + On X stay. */
    machine: {
      id: "machine",
      short: "Overview",
      name: "Overview",
      accent: "#e8eef6",
      yearGoal: 145,
      ytd: 90,
      streak: 194,
      landingsYtd: 88,
      successRate: 99.4,
      specsTitle: "Profile",
      /* 1 Starbase lead · pads/factories/people · recovery/reuse · net/HQ/equity · sky */
      specs: [
        {
          k: "Starbase",
          v: "Boca Chica",
          s: "Starship",
          d: "Starbase is the center of gravity for Starship: production, stack, Pad 2 (OLP-2), tower catch path, and heavy engineering presence. OLP-1 is being rebuilt for the next vehicle generation. Boca Chica is where the company is betting the long game — multi-planet transport — while Falcon still flies the daily cadence from Florida and California. Legal / historic HQ campus remains Hawthorne (Rocket Road); Starbase is the operational heart of Starship.",
        },
        {
          k: "Launch pads",
          v: "4 active",
          s: "3 under construction",
          d: "4 active orbital launch pads: LC-39A, SLC-40, SLC-4E, Pad 2. 3 under construction or major rebuild: OLP-1 at Starbase (V3 upgrade), SLC-6 at Vandenberg (Falcon), and Florida Starship (LC-39A Ship pad path and SLC-37). Counts move as pads come online.",
        },
        {
          k: "Factories",
          v: "6",
          s: "build + engines",
          d: "Hawthorne (Falcon / Dragon + Merlin), Starbase (Starship + Raptor flow), Bastrop and Redmond (Starlink sats and terminals), McGregor (engine test and Raptor production), plus the Starship factory path at Kennedy / Roberts Road.",
        },
        {
          k: "Workforce",
          v: "22k",
          s: "company-wide",
          d: "About 22,000 people company-wide (public 2026 figure) across factories, pads, engineering, and Starlink — not just flight ops.",
        },
        {
          k: "Recovery",
          v: "Sea + land",
          s: "Droneships · LZs",
          d: "Droneships (ASDS): Of Course I Still Love You, Just Read The Instructions, and A Shortfall of Gravitas — Atlantic and Pacific station-keeping by mission. Landing zones: LZ-1 and LZ-2 at Cape Canaveral, LZ-4 at Vandenberg. Ships often homeport at Port Canaveral. Fairings: half-shells are caught or fished by recovery boats after separation when the mission tries for reuse — same reuse economy as boosters, less visible.",
        },
        {
          k: "Reuse",
          v: "98%",
          s: "F9+FH · YTD",
          d: "Share of Falcon (F9 + Heavy) flights this year that flew a booster already used before. Reuse is the core of SpaceX cadence and cost: recover, inspect, reflown. Starship aims at the next step — tower catch and rapid restack — still maturing. Live YTD rate from launch data.",
        },
        {
          k: "Ground net",
          v: "250",
          s: "gateways operational",
          d: "About 250 operational Starlink gateway earth stations (plus ~50 planned → ~300 total in public maps). Hugging Face starlink-ground-stations dataset: 303 listed (250 operational, 53 planned). Gateways link satellites to terrestrial internet; lasers reduce but don’t remove the need for them.",
        },
        {
          k: "HQ",
          v: "Hawthorne",
          s: "1 Rocket Road",
          d: "SpaceX’s original headquarters campus at 1 Rocket Road, Hawthorne. Still a core engineering, mission-control, and manufacturing site for Falcon and Dragon — stages, engines, and spacecraft build-up — even as Starbase grew into the Starship and corporate center of gravity. Large share of company headcount and day-to-day vehicle work still runs through Rocket Road.",
        },
        {
          k: "SPCX price",
          v: "—",
          s: "NASDAQ · live",
          d: "SpaceX (NASDAQ: SPCX) last sale price. Live from market data when the desk can reach the quote proxy.",
        },
        {
          k: "Market cap",
          v: "—",
          s: "SPCX · live",
          d: "SpaceX market capitalization from NASDAQ (price × shares). Live when the desk quote proxy is available.",
        },
        {
          k: "Starlink",
          v: "10.9k",
          s: "sats working on orbit",
          d: "About 10,800–10,900 working Starlink satellites on orbit (public trackers, mid/late 2026). Count moves with launches, deorbits, and shell design. Open Orbital View next for the live 3D picture.",
        },
        {
          k: "Orbital View",
          v: "Open",
          s: "3D Earth · live sats",
          d: "Open Orbital View — 3D Earth with live satellite constellations (Starlink and more), time scrub, and orbit animation.",
          href: "https://orbital.markmaga.com",
        },
      ],
      next: {
        name: "Starlink Group 17-49",
        rocket: "Falcon 9 Block 5",
        pad: "SLC-4E · Vandenberg",
        siteId: "slc4e",
        programId: "starlink",
        net: "2026-08-12T04:46:00Z",
        windowEnd: null,
        precision: "minute",
        status: "Go",
        statusNote: "West Coast · polar",
        webcast: "https://x.com/SpaceX",
        missionType: "LEO",
      },
      weather: { pad: "SLC-4E", wind: "12 mph", cloud: "18%", precip: "0%", risk: "Favorable" , pov: 20 },
      tiles: [
        {
          k: "YTD launches",
          v: "90",
          s: "of 145 year target",
          d: "Orbital launches so far this year across Falcon, Heavy, and Starship versus the public desk target. This is the machine’s annual scoreboard — cadence made visible.",
        },
        {
          k: "Cadence",
          v: "3.0 /wk",
          s: "YTD pace",
          d: "Launches per week if the year continues at the current YTD pace. High cadence is what reuse, multiple pads, and Starlink demand make possible.",
        },
        {
          k: "Success streak",
          v: "194",
          s: "launches",
          d: "Consecutive successful orbital launches from the agency record (Launch Library). A long streak is the quiet product of design margins, ops discipline, and reflight experience.",
        },
        {
          k: "Landings YTD",
          v: "88",
          s: "Falcon recoveries",
          d: "Successful Falcon booster recoveries this year — land or droneship. Every landing is inventory returned to the fleet instead of ocean expendable.",
        },
        {
          k: "Starlink share",
          v: "74%",
          s: "of launches YTD",
          d: "Fraction of this year’s launches that were Starlink missions. When the share is high, most of the factory and pad time is constellation work.",
        },
        {
          k: "Markets",
          v: "160+",
          s: "Starlink live",
          d: "Countries and territories with Starlink available or launched on the public map. Live desk count updates when the availability file is reachable.",
        },
      ],
      stats: [
        { k: "Falcon 9", v: "87" },
        { k: "Falcon Heavy", v: "1" },
        { k: "Starship", v: "2" },
      ],
      media: [
        { handle: "@SpaceX", title: "SpaceX", url: "https://x.com/SpaceX" },
      ],
    },

    falcon9: {
      id: "falcon9",
      short: "Falcon 9",
      name: "Falcon 9",
      accent: "#a892c4",
      yearGoal: 130,
      ytd: 85,
      streak: 180,
      landingsYtd: 84,
      successRate: 99.5,
      specsTitle: "Vehicle",
      /* Shared 12-slot vehicle grid with FH + Ship — toggle morphs values in place */
      specs: [
        {
          k: "Height",
          v: "70 m",
          s: "229 ft · full stack",
          d: "Falcon 9 stands about 70 meters tall with fairing or Dragon on top — roughly a 20-story building. That height is the same family as Falcon Heavy; the difference is width and thrust, not stack length.",
        },
        {
          k: "Diameter",
          v: "3.7 m",
          s: "first-stage core",
          d: "A single 3.7 m core is the basic Falcon building block. Fairings and Dragon sit on that diameter. Heavy straps two more cores beside it; Starship jumps to 9 m tanks.",
        },
        {
          k: "Stages",
          v: "2",
          s: "booster + upper",
          d: "Two stages: a reusable first stage that comes home, and a second stage that finishes orbital insertion. Payload is either a fairing pair or a Dragon spacecraft — not extra stages.",
        },
        {
          k: "Engines · boost",
          v: "9× Merlin",
          s: "sea-level Merlin 1D",
          d: "Nine sea-level Merlin 1D engines power liftoff. Octaweb layout, throttle and engine-out capability — the heart of Falcon’s reliability and of every reflight you see on the pad.",
        },
        {
          k: "Engines · upper",
          v: "1× MVac",
          s: "vacuum Merlin",
          d: "One Merlin Vacuum (MVac) on the second stage, optimized for space with a large nozzle. It restarts for multi-burn missions and leaves the stack on the right orbit.",
        },
        {
          k: "Stage 1 thrust",
          v: "7.6 MN",
          s: "liftoff class",
          d: "About 7.6 meganewtons of thrust at liftoff from nine Merlins — enough to loft the stack off Florida or Vandenberg and still leave margin for boost-back or droneship entry burns.",
        },
        {
          k: "Stage 2 thrust",
          v: "1 MN",
          s: "MVac vacuum",
          d: "Roughly a meganewton of vacuum thrust from MVac. Less dramatic than stage 1, but this is what finishes the job after the booster has separated and headed home.",
        },
        {
          k: "Fuel / ox",
          v: "RP-1 / LOX",
          s: "kerosene + LOX",
          d: "Both stages burn refined kerosene (RP-1) with liquid oxygen. Dense, flight-proven propellants that suit high cadence and reflight — different chemistry from Starship’s methalox.",
        },
        {
          k: "Liftoff mass",
          v: "549 t",
          s: "fueled stack",
          d: "A typical fueled Falcon 9 stack is on the order of 549 tonnes at liftoff. Mass varies with payload and mission profile; the number is a published class figure, not a flight ticket.",
        },
        {
          k: "Payload LEO",
          v: "22.8 t",
          s: "expendable max",
          d: "Published expendable LEO capability is about 22.8 tonnes. Real missions trade payload for reflight and recovery — Starlink batches and commercial sats usually fly well under that ceiling.",
        },
        {
          k: "Payload GTO",
          v: "8.3 t",
          s: "expendable max",
          d: "Published expendable GTO class is about 8.3 tonnes. Geostationary and high-energy customers care about this number; recovery still shapes what actually flies on a given day.",
        },
        {
          k: "Recovery",
          v: "RTLS / ASDS",
          s: "legs · grid fins",
          d: "After separation the first stage flips, burns, and lands on legs with grid-fin steering — either back at a landing zone (RTLS) or on a droneship (ASDS) downrange. That recover-and-reflight loop is why Falcon cadence works.",
        },
      ],
      next: {
        name: "Starlink Group 17-49",
        rocket: "Falcon 9 Block 5",
        pad: "SLC-4E · Vandenberg",
        siteId: "slc4e",
        programId: "starlink",
        net: "2026-08-12T04:46:00Z",
        windowEnd: null,
        precision: "minute",
        status: "Go",
        statusNote: "West Coast · polar",
        webcast: "https://x.com/SpaceX",
        missionType: "Starlink · LEO",
      },
      weather: { pad: "SLC-4E", wind: "12 mph", cloud: "18%", precip: "0%", risk: "Favorable" , pov: 20 },
      tiles: [
        {
          k: "Top core",
          v: "B1067",
          s: "36 flights · YTD high",
          d: "Highest-flight Falcon booster seen in this year’s data — serial and flight count from launch library stages. These cores are the face of reuse: inspect, turn around, fly again.",
        },
        {
          k: "YTD",
          v: "87",
          s: "of 130 year target",
          d: "Falcon 9 launches so far this year versus the desk year target. This is the workhorse count — Starlink, commercial, rideshare, and national security mixed together.",
        },
        {
          k: "Reuse",
          v: "98%",
          s: "boosters already flown",
          d: "Share of F9 flights this year that used a booster which had already flown. Near-100% means first-flight cores are rare; the fleet is mostly veterans.",
        },
        {
          k: "Landings",
          v: "86",
          s: "recoveries YTD",
          d: "Successful first-stage recovery attempts on Falcon flights this year — droneship or land zone. Landing is how reuse becomes inventory instead of expendable hardware.",
        },
        {
          k: "East / West",
          v: "40/47",
          s: "Florida / Vandenberg",
          d: "Split of F9 flights between Florida (Cape / Kennedy) and Vandenberg this year. East coast owns volume; west coast owns polar and high-inclination Starlink and other polar work.",
        },
        {
          k: "Next landing",
          v: "ASDS",
          s: "next mission profile",
          d: "Where the next F9 booster is planned to come home when the library lists a landing attempt — ASDS droneship or RTLS land pad — so you can read recovery with the countdown.",
        },
      ],
      stats: [
        { k: "Starlink", v: "68" },
        { k: "Other", v: "9" },
        { k: "Rideshare", v: "4" },
        { k: "YTD", v: "85" },
      ],
      media: [
        { handle: "@SpaceX", title: "SpaceX", url: "https://x.com/SpaceX" },
      ],
    },

    heavy: {
      id: "heavy",
      short: "Falcon Heavy",
      name: "Falcon Heavy",
      accent: "#dbb03a",
      yearGoal: 4,
      ytd: 1,
      streak: 1,
      landingsYtd: 3,
      successRate: 100,
      specsTitle: "Vehicle",
      /* Shared 12-slot vehicle grid with F9 + Ship — still 2 stages (sides = boost phase) */
      specs: [
        {
          k: "Height",
          v: "70 m",
          s: "same stack as F9",
          d: "Falcon Heavy is the same stack height as Falcon 9 — about 70 m. You are looking at more cores side-by-side, not a taller rocket. Same pad interfaces, different energy.",
        },
        {
          k: "Diameter",
          v: "3.7 m ×3",
          s: "center + two sides",
          d: "Three 3.7 m cores at liftoff: a center core and two side boosters. That is why Heavy looks wide on the pad and why recovery talks about sides versus center separately.",
        },
        {
          k: "Stages",
          v: "2",
          s: "boost · upper",
          d: "Still two stages. The “boost” phase is three cores acting together, then one upper stage (same MVac family as F9). Side boosters are not extra stages — they are extra first-stage power.",
        },
        {
          k: "Engines · boost",
          v: "27× Merlin",
          s: "9 per core",
          d: "Twenty-seven sea-level Merlins at liftoff — nine on each of three cores. That wall of engines is why Heavy owns the high-energy national-security and science missions F9 cannot comfortably take.",
        },
        {
          k: "Engines · upper",
          v: "1× MVac",
          s: "same as F9",
          d: "One Merlin Vacuum on the second stage — same upper-stage idea as Falcon 9. Heavy’s advantage is getting that upper stage higher and faster with three cores underneath.",
        },
        {
          k: "Stage 1 thrust",
          v: "22.8 MN",
          s: "27 engines",
          d: "On the order of 22.8 MN at liftoff — roughly triple F9. About 5.1 million pounds of thrust class. This is the number people mean when they say Heavy is in a different league.",
        },
        {
          k: "Stage 2 thrust",
          v: "1 MN",
          s: "MVac vacuum",
          d: "Same MVac class as Falcon 9 for the upper stage. The spectacle is stage 1; the precision work of finishing orbit still sits with one vacuum Merlin.",
        },
        {
          k: "Fuel / ox",
          v: "RP-1 / LOX",
          s: "all cores + upper",
          d: "Kerosene and liquid oxygen across all three cores and the upper stage — Falcon family chemistry, just more tanks and more engines burning at once.",
        },
        {
          k: "Liftoff mass",
          v: "1,420 t",
          s: "fueled stack",
          d: "A typical fueled Heavy stack is on the order of 1,420 tonnes — much heavier than F9 because two extra cores ride along. Mass and thrust scale together for the high-energy jobs.",
        },
        {
          k: "Payload LEO",
          v: "63.8 t",
          s: "expendable max",
          d: "Published expendable LEO class is about 63.8 tonnes. Real missions balance recovery of the side boosters (and sometimes the center) against how much payload the customer needs.",
        },
        {
          k: "Payload GTO",
          v: "26.7 t",
          s: "expendable max",
          d: "Published expendable GTO class is about 26.7 tonnes — the regime of large GEO and high-energy national security payloads that make Heavy worth flying a few times a year.",
        },
        {
          k: "Recovery",
          v: "Sides + core",
          s: "RTLS / ASDS / exp.",
          d: "Side boosters often return to land or droneships. The center core sees a harder entry and is more often expended or ASDS-attempted depending on the mission. Recovery is the chess game that makes Heavy affordable enough to fly.",
        },
      ],
      next: {
        name: "Nancy Grace Roman Space Telescope",
        rocket: "Falcon Heavy",
        pad: "LC-39A · Kennedy",
        siteId: "39a",
        programId: "heavy",
        net: "2026-11-15T00:00:00Z",
        windowEnd: null,
        precision: "month",
        status: "TBC",
        statusNote: "NASA flagship · NET often month-level",
        webcast: "https://x.com/SpaceX",
        missionType: "Science · high-energy",
      },
      weather: { pad: "LC-39A", wind: "—", cloud: "—", precip: "—", risk: "Far window", pov: null, povNote: "Window still far — pad weather not yet mission-critical" },
      tiles: [
        {
          k: "This year",
          v: "1 / 4",
          s: "vs year target",
          d: "Heavy flights so far versus the soft year target. Heavy is rare by design — each flight is a high-energy mission, not a weekly Starlink stack.",
        },
        {
          k: "Landings YTD",
          v: "2",
          s: "side + center",
          d: "Successful recovery events logged on Heavy flights this year. Side boosters are the usual recovery win; the center core is the harder story.",
        },
        {
          k: "Success",
          v: "100%",
          s: "Heavy YTD",
          d: "Mission success rate for Falcon Heavy flights this year from launch library outcomes. Sparse sample — one flight swings the percentage hard.",
        },
        {
          k: "Pad",
          v: "39A",
          s: "primary Heavy home",
          d: "LC-39A at Kennedy is Heavy’s primary home. The historic Apollo/Shuttle pad is where the triple-core stack rolls out for most of these missions.",
        },
        {
          k: "Side boosters",
          v: "×2",
          s: "usually recovered",
          d: "Two side boosters peel away after boost and typically aim for landing zones or droneships. They are F9-class cores that can cross-fly the Falcon fleet.",
        },
        {
          k: "Center core",
          v: "ASDS / exp.",
          s: "mission dependent",
          d: "The center core flies longer and reenters hotter. Missions often expend it or attempt a distant droneship catch — the expensive piece of Heavy recovery.",
        },
      ],
      stats: [
        { k: "YTD", v: "1" },
        { k: "Year target", v: "4" },
        { k: "Landings", v: "—" },
        { k: "Pad", v: "39A" },
      ],
      media: [
        { handle: "@SpaceX", title: "SpaceX", url: "https://x.com/SpaceX" },
      ],
    },

    starship: {
      id: "starship",
      short: "Starship",
      name: "Starship",
      accent: "#e85a32",
      yearGoal: 12,
      ytd: 2,
      streak: 2,
      landingsYtd: 1,
      successRate: null,
      specsTitle: "Vehicle",
      /* Shared 12-slot vehicle grid with F9 + FH — public figures · hardware still evolving */
      specs: [
        {
          k: "Height",
          v: "121 m",
          s: "full stack",
          d: "Stacked Super Heavy plus Starship is on the order of 121 meters — far taller than Falcon. That height is the visible statement of the next architecture: full-flow methalox, catch towers, and eventually rapid restack.",
        },
        {
          k: "Diameter",
          v: "9 m",
          s: "tanks",
          d: "Nine-meter tanks on booster and ship. That diameter sets payload volume, heat-shield area, and why Starship factories look like aircraft hangars scaled for stainless cylinders.",
        },
        {
          k: "Stages",
          v: "2",
          s: "Super Heavy · Ship",
          d: "Two stages with new names: Super Heavy is the booster; Starship is the upper stage and spaceship. Same two-stage idea as Falcon, different propellant, structure, and recovery plan.",
        },
        {
          k: "Engines · boost",
          v: "33× Raptor",
          s: "Super Heavy",
          d: "About thirty-three Raptors on Super Heavy at liftoff. Count and thrust class still evolve with vehicle generations — the point is a wall of methalox engines instead of nine Merlins.",
        },
        {
          k: "Engines · upper",
          v: "6× Raptor",
          s: "3 SL + 3 vac",
          d: "Ship typically flies a mix of sea-level and vacuum Raptors (often described as three plus three). That mix handles ascent, on-orbit work, and eventual entry and landing burns.",
        },
        {
          k: "Stage 1 thrust",
          v: "70+ MN",
          s: "still rising",
          d: "Booster thrust is in the tens of meganewtons — public class figures sit around 70 MN and keep climbing as Raptors improve. This is why Starship needs a different pad and tower than Falcon.",
        },
        {
          k: "Stage 2 thrust",
          v: "15 MN",
          s: "Ship class",
          d: "Ship thrust is a smaller but still huge vacuum/sea-level mix — public order-of-magnitude around 15 MN class. Enough to finish ascent and later support landing or deep-space burns as the architecture matures.",
        },
        {
          k: "Fuel / ox",
          v: "CH₄ / LOX",
          s: "methalox",
          d: "Liquid methane and liquid oxygen. Methalox supports full-flow staged combustion Raptors and, longer term, in-situ propellant ideas for Mars. Different from Falcon’s RP-1 stack in every factory and tank farm.",
        },
        {
          k: "Liftoff mass",
          v: "5,000 t",
          s: "fueled stack",
          d: "A fully fueled stack is on the order of five thousand tonnes — an order of magnitude above Falcon Heavy. That mass is why catch towers, deluge, and pad design dominate the Starbase story.",
        },
        {
          k: "Payload LEO",
          v: "100+ t",
          s: "reusable aim",
          d: "Published reusable LEO ambition is 100+ tonnes class — enough for huge Starlink batches or deep-space stack pieces. Flight test is still proving the path; the number is the goal, not today’s ticket.",
        },
        {
          k: "Payload GTO",
          v: "Depot / TLI",
          s: "beyond LEO",
          d: "Starship’s beyond-LEO story is less a single GTO number and more depot tankers, lunar landers, and high-energy transfers. Refueling in orbit is the architecture that makes those missions real.",
        },
        {
          k: "Recovery",
          v: "Tower catch",
          s: "chopsticks · tiles",
          d: "The plan is tower catch with chopstick arms on the launch tower, not Falcon-style legs on a droneship. Ship returns with a heat-tile shield. That is the next reuse problem after Falcon already solved booster RTLS/ASDS.",
        },
      ],
      next: {
        name: "Flight Test (next)",
        rocket: "Starship · Super Heavy",
        pad: "Starbase · Orbital Pad",
        siteId: "starbase-pad2",
        programId: "starship",
        net: "2026-09-01T00:00:00Z",
        windowEnd: null,
        precision: "month",
        status: "TBC",
        statusNote: "NET moves with hardware and licenses",
        webcast: "https://x.com/SpaceX",
        missionType: "Flight test",
      },
      weather: { pad: "Pad 2", wind: "14 mph", cloud: "40%", precip: "10%", risk: "Watch" , pov: 40 },
      tiles: [
        {
          k: "Flights YTD",
          v: "2",
          s: "of 12 year target",
          d: "Starship integrated flight tests so far this year versus the soft desk target. Each flight is a hardware and software experiment as much as a “launch count.”",
        },
        {
          k: "Cadence",
          v: "0.1 /wk",
          s: "YTD pace",
          d: "Annualized flight-test pace from YTD flights. Low compared with Falcon — by design while the vehicle and tower catch loop are still being proven.",
        },
        {
          k: "Success",
          v: "100%",
          s: "YTD outcomes",
          d: "How launch library scores Starship flights this year. Early IFT history is mixed by nature; watch the trend as catch and ship survival improve.",
        },
        {
          k: "Catch",
          v: "Tower",
          s: "Mechazilla",
          d: "Chopstick arms on the tower are meant to catch returning boosters (and eventually ships) instead of landing legs on a pad or droneship. That is the reuse bet unique to Starbase.",
        },
        {
          k: "Sites",
          v: "TX · FL",
          s: "Starbase · 39A path",
          d: "Starbase flies now. Florida Starship (LC-39A and SLC-37 path) is the east-coast expansion so national security and high cadence are not stuck on one Texas pad.",
        },
        {
          k: "Next",
          v: "Pad 2",
          s: "Starbase",
          d: "Next flight test is expected from Starbase Pad 2 while OLP-1 is rebuilt. NET dates move with hardware, weather, and licenses — treat soft NETs as guidance, not promises.",
        },
      ],
      stats: [
        { k: "Flights YTD", v: "2" },
        { k: "Year target", v: "12" },
        { k: "Success", v: "—" },
        { k: "Catch", v: "Tower" },
      ],
      media: [
        { handle: "@SpaceX", title: "SpaceX", url: "https://x.com/SpaceX" },
      ],
    },

    dragon: {
      id: "dragon",
      short: "Dragon",
      name: "Dragon",
      accent: "#3b8fe0",
      yearGoal: 8,
      ytd: 4,
      streak: 4,
      landingsYtd: 4,
      successRate: 100,
      specsTitle: "Spacecraft",
      specs: [
        {
          k: "Variants",
          v: "Crew · Cargo",
          s: "Dragon 2 family",
          d: "Two roles, one family: Crew Dragon flies people (NASA commercial crew and private missions); Cargo Dragon hauls supplies to the ISS. Same pressure vessel idea, different interiors and manifests.",
        },
        {
          k: "Height",
          v: "8.1 m",
          s: "with trunk",
          d: "About 8.1 m with the unpressurized trunk attached — the trunk carries cargo, solar arrays, and radiators. The capsule itself is the blunt body you see splash down.",
        },
        {
          k: "Diameter",
          v: "4 m",
          s: "capsule",
          d: "Roughly four meters across the pressure vessel. Wide enough for a crew cabin or cargo racks, narrow enough to sit on Falcon 9 under the launch abort motors.",
        },
        {
          k: "Dry mass",
          v: "12.5 t",
          s: "spacecraft alone",
          d: "On the order of 12.5 tonnes dry without cargo. Mass budgets matter for Falcon performance and for how much upmass the station can accept.",
        },
        {
          k: "Crew",
          v: "Up to 7",
          s: "NASA often 4",
          d: "Designed for up to seven seats; NASA commercial crew missions typically fly four. Private missions sometimes use different seating and training plans.",
        },
        {
          k: "Cabin vol.",
          v: "9.3 m³",
          s: "pressurized",
          d: "About 9.3 cubic meters of pressurized cabin — living and working space for crew or the pressurized cargo volume on cargo flights.",
        },
        {
          k: "Cargo up",
          v: "6 t",
          s: "to station",
          d: "Cargo Dragon class upmass is on the order of six tonnes to the ISS, mixing pressurized bags and unpressurized trunk payloads depending on the flight.",
        },
        {
          k: "Cargo down",
          v: "3 t",
          s: "return",
          d: "Return cargo is smaller — roughly three tonnes class — because splashdown mass and heat-shield limits bite harder on the way home.",
        },
        {
          k: "Abort",
          v: "SuperDraco",
          s: "launch escape",
          d: "Eight SuperDraco engines provide integrated launch escape — the capsule can pull itself off a failing Falcon without a separate tower abort system.",
        },
        {
          k: "RCS",
          v: "Draco",
          s: "orbit + dock",
          d: "Draco thrusters handle orbital maneuvering, attitude, and the careful dance of docking to the station’s IDA ports.",
        },
        {
          k: "Power",
          v: "Solar",
          s: "trunk arrays",
          d: "Solar arrays on the trunk power the vehicle on orbit. After trunk jettison for reentry, batteries carry the capsule through deorbit and splashdown.",
        },
        {
          k: "Recovery",
          v: "Ocean",
          s: "parachutes · ship",
          d: "Crew and cargo Dragons return under parachutes to ocean splashdown — Gulf or Atlantic zones set per mission — then recovery ships pick up the capsule for reuse.",
        },
      ],
      next: {
        name: "Crew-13",
        rocket: "Falcon 9 · Crew Dragon",
        pad: "LC-39A · Kennedy",
        siteId: "39a",
        programId: "dragon",
        net: "2026-09-20T12:00:00Z",
        windowEnd: "2026-09-20T12:30:00Z",
        precision: "day",
        status: "TBC",
        statusNote: "NASA commercial crew · ISS",
        webcast: "https://x.com/SpaceX",
        missionType: "Crew · ISS",
      },
      weather: { pad: "LC-39A", wind: "9 mph", cloud: "25%", precip: "5%", risk: "Favorable" , pov: 20 },
      tiles: [
        {
          k: "Crew / Cargo",
          v: "1 / 2",
          s: "missions YTD",
          d: "Split of crew versus cargo Dragon missions flown this year. Crew flights carry people; cargo flights keep the station stocked.",
        },
        {
          k: "YTD",
          v: "3",
          s: "of 8 year target",
          d: "Total Dragon missions this year versus the desk target. NASA schedules and station needs set most of this cadence.",
        },
        {
          k: "Success",
          v: "100%",
          s: "Dragon YTD",
          d: "Mission success rate for Dragon flights this year. Human spaceflight and cargo both demand a clean scoreboard.",
        },
        {
          k: "Destination",
          v: "ISS",
          s: "station docking",
          d: "Primary destination is the International Space Station, docking at IDA ports. That link is why Dragon is more than a capsule demo — it is operational logistics and crew transport.",
        },
        {
          k: "Pad",
          v: "39A",
          s: "Crew / Cargo home",
          d: "Most Dragon missions stack on Falcon 9 at LC-39A. The same pad that flies Heavy and high-profile F9 work is the usual crew/cargo gateway.",
        },
        {
          k: "Next",
          v: "Crew-13",
          s: "from manifest",
          d: "Next Dragon mission name and status from the live manifest. NETs move with NASA, weather, and station traffic — watch the Next flight band for the hard clock.",
        },
      ],
      stats: [
        { k: "Crew YTD", v: "2" },
        { k: "Cargo YTD", v: "2" },
        { k: "Total", v: "4" },
        { k: "Year target", v: "8" },
      ],
      media: [
        { handle: "@SpaceX", title: "SpaceX", url: "https://x.com/SpaceX" },
      ],
    },

    starlink: {
      id: "starlink",
      short: "Starlink",
      name: "Starlink",
      accent: "#34c97a",
      yearGoal: 100,
      ytd: 68,
      streak: 12,
      landingsYtd: 67,
      successRate: 99.2,
      specsTitle: "Constellation",
      specs: [
        {
          k: "Active sats",
          v: "10.9k",
          s: "working on orbit",
          d: "On the order of 10,800–10,900 working Starlink satellites on orbit (public trackers). That fleet is most of the active satellites above Earth — and it still grows with almost every Falcon week.",
        },
        {
          k: "Per launch",
          v: "20–28",
          s: "F9 stack",
          d: "A typical Falcon 9 Starlink mission deploys roughly twenty to twenty-eight satellites. Batch size shifts with satellite generation and fairing packing.",
        },
        {
          k: "Sat mass",
          v: "800 kg",
          s: "V2 Mini class",
          d: "V2 Mini class satellites are on the order of 800 kg each. Mass and capability climb with generation — lasers, more throughput, direct-to-cell hardware.",
        },
        {
          k: "Orbit",
          v: "540 km",
          s: "shells vary",
          d: "Operational shells sit around a few hundred kilometers (often cited near 540 km class, shell-dependent). Low altitude means bright trains in the sky and deliberate deorbit at end of life.",
        },
        {
          k: "Planes",
          v: "Many",
          s: "incl. polar",
          d: "Many orbital planes and shells build global coverage. Polar planes from Vandenberg fill high latitudes; Florida flights fill other shells and customer demand.",
        },
        {
          k: "Phased array",
          v: "Ku / Ka",
          s: "user + gateway",
          d: "Phased-array antennas talk to user terminals and gateways in Ku/Ka bands. No dish steering on the sat side — electronic beams track the ground as the satellite races overhead.",
        },
        {
          k: "ISL",
          v: "Lasers",
          s: "sat-to-sat",
          d: "Inter-satellite laser links pass traffic between spacecraft so a user can reach the network even when the nearest gateway is far away — the mesh in the sky.",
        },
        {
          k: "DTC",
          v: "Live",
          s: "direct-to-cell",
          d: "Direct-to-cell service lets ordinary phones talk to Starlink for messaging and expanding broadband features where partners enable it — a second product on the same constellation.",
        },
        {
          k: "Throughput",
          v: "High",
          s: "gen dependent",
          d: "Capacity per satellite and per cell rises with each generation. More sats, better antennas, and denser shells are how Starlink chases fiber-like experience from LEO.",
        },
        {
          k: "V3 path",
          v: "Starship",
          s: "larger sats",
          d: "Next-gen Starlink (V3 class) wants Starship’s payload bay — larger satellites, fewer launches per capacity. Falcon still builds the mesh today; Ship is the scale-up path.",
        },
        {
          k: "Disposal",
          v: "Deorbit",
          s: "end of life",
          d: "Sats are designed to deorbit and burn up at end of life. Low altitude helps: without boosts they reenter on human timescales, which is part of the debris story SpaceX has to keep clean.",
        },
        {
          k: "Coverage",
          v: "166 mkts",
          s: "globally",
          d: "Near-global coverage where regulators allow service. Ops “Markets” counts licensed countries; this cell is the constellation’s geographic ambition, not the legal map alone.",
        },
      ],
      next: {
        name: "Starlink Group 17-49",
        rocket: "Falcon 9 Block 5",
        pad: "SLC-4E · Vandenberg",
        siteId: "slc4e",
        programId: "starlink",
        net: "2026-08-12T04:46:00Z",
        windowEnd: null,
        precision: "minute",
        status: "Go",
        statusNote: "West Coast · polar",
        webcast: "https://x.com/SpaceX",
        missionType: "Constellation · LEO",
      },
      weather: { pad: "SLC-4E", wind: "12 mph", cloud: "18%", precip: "0%", risk: "Favorable" , pov: 20 },
      tiles: [
        {
          k: "Missions YTD",
          v: "68",
          s: "of 100 year target",
          d: "Starlink launch missions so far this year versus the desk target. Most of Falcon’s year is this stack — polar and mid-latitude shells filling in.",
        },
        {
          k: "of fleet",
          v: "76%",
          s: "of all launches",
          d: "Share of all SpaceX launches this year that were Starlink missions. When this is high, the machine is mostly building the constellation.",
        },
        {
          k: "This batch",
          v: "24",
          s: "next stack",
          d: "How many satellites are planned on the next Starlink Falcon when the manifest says. Batch size is the pulse of constellation growth.",
        },
        {
          k: "Markets",
          v: "166",
          s: "Starlink live",
          d: "Countries and territories where Starlink is available or launched on the public availability map. Live count when the desk can fetch that file.",
        },
        {
          k: "Cadence",
          v: "2.3 /wk",
          s: "YTD pace",
          d: "Starlink launches per week at the current YTD pace. That rhythm is what keeps the active-sat count climbing.",
        },
        {
          k: "Landings",
          v: "68",
          s: "booster recoveries",
          d: "Successful booster recoveries on Starlink missions this year. Starlink is also a reuse factory — almost every flight is a reflight core coming home.",
        },
      ],
      stats: [
        { k: "Missions YTD", v: "68" },
        { k: "Year target", v: "100" },
        { k: "of fleet", v: "76%" },
        { k: "Markets", v: "166" },
      ],
      media: [
        { handle: "@Starlink", title: "Starlink", url: "https://x.com/Starlink" },
      ],
    },
  },
};
