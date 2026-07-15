/* @ds-bundle: {"namespace":"Vantage","components":[{"name":"BestDays","sourcePath":"components/spotdetail/BestDays/BestDays.jsx"},{"name":"Layout","sourcePath":"components/general/Layout/Layout.jsx"},{"name":"MilkyWay","sourcePath":"components/spotdetail/MilkyWay/MilkyWay.jsx"},{"name":"SpotCard","sourcePath":"components/general/SpotCard/SpotCard.jsx"},{"name":"SpotHero","sourcePath":"components/spotdetail/SpotHero/SpotHero.jsx"},{"name":"SpotNotes","sourcePath":"components/spotdetail/SpotNotes/SpotNotes.jsx"},{"name":"SunAlignment","sourcePath":"components/spotdetail/SunAlignment/SunAlignment.jsx"}],"sourceHashes":{"components/spotdetail/BestDays/BestDays.jsx":"33b47224a941","components/spotdetail/BestDays/BestDays.d.ts":"4ff9f7dc3d30","components/spotdetail/BestDays/BestDays.prompt.md":"bcc99c655972","components/general/Layout/Layout.jsx":"f4d281354770","components/general/Layout/Layout.d.ts":"a107b35e1203","components/general/Layout/Layout.prompt.md":"f4012e244eeb","components/spotdetail/MilkyWay/MilkyWay.jsx":"cedbe9e629d7","components/spotdetail/MilkyWay/MilkyWay.d.ts":"0222f4860815","components/spotdetail/MilkyWay/MilkyWay.prompt.md":"2c8d094e8fc0","components/general/SpotCard/SpotCard.jsx":"02a8c2c085b1","components/general/SpotCard/SpotCard.d.ts":"22aaa2bd6f75","components/general/SpotCard/SpotCard.prompt.md":"2b3c40e240a1","components/spotdetail/SpotHero/SpotHero.jsx":"de7548db2896","components/spotdetail/SpotHero/SpotHero.d.ts":"e37bd7effed8","components/spotdetail/SpotHero/SpotHero.prompt.md":"93bf592bbd6b","components/spotdetail/SpotNotes/SpotNotes.jsx":"6d8b1ee8c8aa","components/spotdetail/SpotNotes/SpotNotes.d.ts":"5a39517d7d5d","components/spotdetail/SpotNotes/SpotNotes.prompt.md":"8d294cf4e826","components/spotdetail/SunAlignment/SunAlignment.jsx":"7306d66d9a06","components/spotdetail/SunAlignment/SunAlignment.d.ts":"a1a3b268eb27","components/spotdetail/SunAlignment/SunAlignment.prompt.md":"b7d22b63d879"},"inlinedExternals":["@tabler/icons-react","cookie","react-router","react-router-dom","set-cookie-parser","suncalc","zustand"],"builtBy":"cc-design-sync"} */
"use strict";
var Vantage = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // <define:import.meta.env>
  var init_define_import_meta_env = __esm({
    "<define:import.meta.env>"() {
    }
  });

  // shim:react-shim
  var require_react_shim = __commonJS({
    "shim:react-shim"(exports, module) {
      init_define_import_meta_env();
      var R = window.React;
      function np(p, k) {
        var o = {};
        for (var x in p) if (x !== "children") o[x] = p[x];
        if (k !== void 0) o.key = k;
        return o;
      }
      function jsx9(t, p, k) {
        var c = p && p.children;
        return c === void 0 ? R.createElement(t, np(p, k)) : R.createElement(t, np(p, k), c);
      }
      function jsxs8(t, p, k) {
        return R.createElement.apply(R, [t, np(p, k)].concat(p.children));
      }
      module.exports = R;
      module.exports.jsx = jsx9;
      module.exports.jsxs = jsxs8;
      module.exports.jsxDEV = function(t, p, k, s) {
        return (s ? jsxs8 : jsx9)(t, p, k);
      };
      module.exports.Fragment = R.Fragment;
    }
  });

  // node_modules/suncalc/suncalc.js
  var require_suncalc = __commonJS({
    "node_modules/suncalc/suncalc.js"(exports, module) {
      init_define_import_meta_env();
      (function() {
        "use strict";
        var PI = Math.PI, sin = Math.sin, cos = Math.cos, tan = Math.tan, asin = Math.asin, atan = Math.atan2, acos = Math.acos, rad2 = PI / 180;
        var dayMs = 1e3 * 60 * 60 * 24, J1970 = 2440588, J2000 = 2451545;
        function toJulian(date) {
          return date.valueOf() / dayMs - 0.5 + J1970;
        }
        function fromJulian(j) {
          return new Date((j + 0.5 - J1970) * dayMs);
        }
        function toDays(date) {
          return toJulian(date) - J2000;
        }
        var e = rad2 * 23.4397;
        function rightAscension(l, b) {
          return atan(sin(l) * cos(e) - tan(b) * sin(e), cos(l));
        }
        function declination(l, b) {
          return asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l));
        }
        function azimuth(H, phi, dec) {
          return atan(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi));
        }
        function altitude(H, phi, dec) {
          return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H));
        }
        function siderealTime(d, lw) {
          return rad2 * (280.16 + 360.9856235 * d) - lw;
        }
        function astroRefraction(h) {
          if (h < 0)
            h = 0;
          return 2967e-7 / Math.tan(h + 312536e-8 / (h + 0.08901179));
        }
        function solarMeanAnomaly(d) {
          return rad2 * (357.5291 + 0.98560028 * d);
        }
        function eclipticLongitude(M) {
          var C = rad2 * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 3e-4 * sin(3 * M)), P = rad2 * 102.9372;
          return M + C + P + PI;
        }
        function sunCoords(d) {
          var M = solarMeanAnomaly(d), L = eclipticLongitude(M);
          return {
            dec: declination(L, 0),
            ra: rightAscension(L, 0)
          };
        }
        var SunCalc6 = {};
        SunCalc6.getPosition = function(date, lat, lng) {
          var lw = rad2 * -lng, phi = rad2 * lat, d = toDays(date), c = sunCoords(d), H = siderealTime(d, lw) - c.ra;
          return {
            azimuth: azimuth(H, phi, c.dec),
            altitude: altitude(H, phi, c.dec)
          };
        };
        var times = SunCalc6.times = [
          [-0.833, "sunrise", "sunset"],
          [-0.3, "sunriseEnd", "sunsetStart"],
          [-6, "dawn", "dusk"],
          [-12, "nauticalDawn", "nauticalDusk"],
          [-18, "nightEnd", "night"],
          [6, "goldenHourEnd", "goldenHour"]
        ];
        SunCalc6.addTime = function(angle, riseName, setName) {
          times.push([angle, riseName, setName]);
        };
        var J0 = 9e-4;
        function julianCycle(d, lw) {
          return Math.round(d - J0 - lw / (2 * PI));
        }
        function approxTransit(Ht, lw, n) {
          return J0 + (Ht + lw) / (2 * PI) + n;
        }
        function solarTransitJ(ds, M, L) {
          return J2000 + ds + 53e-4 * sin(M) - 69e-4 * sin(2 * L);
        }
        function hourAngle(h, phi, d) {
          return acos((sin(h) - sin(phi) * sin(d)) / (cos(phi) * cos(d)));
        }
        function observerAngle(height) {
          return -2.076 * Math.sqrt(height) / 60;
        }
        function getSetJ(h, lw, phi, dec, n, M, L) {
          var w = hourAngle(h, phi, dec), a = approxTransit(w, lw, n);
          return solarTransitJ(a, M, L);
        }
        SunCalc6.getTimes = function(date, lat, lng, height) {
          height = height || 0;
          var lw = rad2 * -lng, phi = rad2 * lat, dh = observerAngle(height), d = toDays(date), n = julianCycle(d, lw), ds = approxTransit(0, lw, n), M = solarMeanAnomaly(ds), L = eclipticLongitude(M), dec = declination(L, 0), Jnoon = solarTransitJ(ds, M, L), i, len, time, h0, Jset, Jrise;
          var result = {
            solarNoon: fromJulian(Jnoon),
            nadir: fromJulian(Jnoon - 0.5)
          };
          for (i = 0, len = times.length; i < len; i += 1) {
            time = times[i];
            h0 = (time[0] + dh) * rad2;
            Jset = getSetJ(h0, lw, phi, dec, n, M, L);
            Jrise = Jnoon - (Jset - Jnoon);
            result[time[1]] = fromJulian(Jrise);
            result[time[2]] = fromJulian(Jset);
          }
          return result;
        };
        function moonCoords(d) {
          var L = rad2 * (218.316 + 13.176396 * d), M = rad2 * (134.963 + 13.064993 * d), F = rad2 * (93.272 + 13.22935 * d), l = L + rad2 * 6.289 * sin(M), b = rad2 * 5.128 * sin(F), dt = 385001 - 20905 * cos(M);
          return {
            ra: rightAscension(l, b),
            dec: declination(l, b),
            dist: dt
          };
        }
        SunCalc6.getMoonPosition = function(date, lat, lng) {
          var lw = rad2 * -lng, phi = rad2 * lat, d = toDays(date), c = moonCoords(d), H = siderealTime(d, lw) - c.ra, h = altitude(H, phi, c.dec), pa = atan(sin(H), tan(phi) * cos(c.dec) - sin(c.dec) * cos(H));
          h = h + astroRefraction(h);
          return {
            azimuth: azimuth(H, phi, c.dec),
            altitude: h,
            distance: c.dist,
            parallacticAngle: pa
          };
        };
        SunCalc6.getMoonIllumination = function(date) {
          var d = toDays(date || /* @__PURE__ */ new Date()), s = sunCoords(d), m = moonCoords(d), sdist = 149598e3, phi = acos(sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra)), inc = atan(sdist * sin(phi), m.dist - sdist * cos(phi)), angle = atan(cos(s.dec) * sin(s.ra - m.ra), sin(s.dec) * cos(m.dec) - cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra));
          return {
            fraction: (1 + cos(inc)) / 2,
            phase: 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / Math.PI,
            angle
          };
        };
        function hoursLater(date, h) {
          return new Date(date.valueOf() + h * dayMs / 24);
        }
        SunCalc6.getMoonTimes = function(date, lat, lng, inUTC) {
          var t = new Date(date);
          if (inUTC) t.setUTCHours(0, 0, 0, 0);
          else t.setHours(0, 0, 0, 0);
          var hc = 0.133 * rad2, h0 = SunCalc6.getMoonPosition(t, lat, lng).altitude - hc, h1, h2, rise, set, a, b, xe, ye, d, roots, x1, x2, dx;
          for (var i = 1; i <= 24; i += 2) {
            h1 = SunCalc6.getMoonPosition(hoursLater(t, i), lat, lng).altitude - hc;
            h2 = SunCalc6.getMoonPosition(hoursLater(t, i + 1), lat, lng).altitude - hc;
            a = (h0 + h2) / 2 - h1;
            b = (h2 - h0) / 2;
            xe = -b / (2 * a);
            ye = (a * xe + b) * xe + h1;
            d = b * b - 4 * a * h1;
            roots = 0;
            if (d >= 0) {
              dx = Math.sqrt(d) / (Math.abs(a) * 2);
              x1 = xe - dx;
              x2 = xe + dx;
              if (Math.abs(x1) <= 1) roots++;
              if (Math.abs(x2) <= 1) roots++;
              if (x1 < -1) x1 = x2;
            }
            if (roots === 1) {
              if (h0 < 0) rise = i + x1;
              else set = i + x1;
            } else if (roots === 2) {
              rise = i + (ye < 0 ? x2 : x1);
              set = i + (ye < 0 ? x1 : x2);
            }
            if (rise && set) break;
            h0 = h2;
          }
          var result = {};
          if (rise) result.rise = hoursLater(t, rise);
          if (set) result.set = hoursLater(t, set);
          if (!rise && !set) result[ye > 0 ? "alwaysUp" : "alwaysDown"] = true;
          return result;
        };
        if (typeof exports === "object" && typeof module !== "undefined") module.exports = SunCalc6;
        else if (typeof define === "function" && define.amd) define(SunCalc6);
        else window.SunCalc = SunCalc6;
      })();
    }
  });

  // ds-bundle/.bundle-entry.mjs
  var bundle_entry_exports = {};
  __export(bundle_entry_exports, {
    BestDays: () => BestDays,
    DSProvider: () => DSProvider,
    Layout: () => Layout,
    MilkyWay: () => MilkyWay,
    SpotCard: () => SpotCard,
    SpotHero: () => SpotHero,
    SpotNotes: () => SpotNotes,
    SunAlignment: () => SunAlignment,
    __dsMainNs: () => ds_entry_exports,
    sampleSpots: () => sampleSpots
  });
  init_define_import_meta_env();

  // .design-sync/preview-support.tsx
  init_define_import_meta_env();

  // node_modules/react-router/dist/development/chunk-6CSD65Y2.mjs
  init_define_import_meta_env();
  var React = __toESM(require_react_shim(), 1);
  var React2 = __toESM(require_react_shim(), 1);
  var React3 = __toESM(require_react_shim(), 1);
  var React4 = __toESM(require_react_shim(), 1);
  var React9 = __toESM(require_react_shim(), 1);
  var React8 = __toESM(require_react_shim(), 1);
  var React7 = __toESM(require_react_shim(), 1);
  var React6 = __toESM(require_react_shim(), 1);
  var React5 = __toESM(require_react_shim(), 1);
  var React10 = __toESM(require_react_shim(), 1);
  var React11 = __toESM(require_react_shim(), 1);
  var import_meta = {};
  function isLocation(obj) {
    return typeof obj === "object" && obj != null && "pathname" in obj && "search" in obj && "hash" in obj && "state" in obj && "key" in obj;
  }
  function createMemoryHistory(options = {}) {
    let { initialEntries = ["/"], initialIndex, v5Compat = false } = options;
    let entries;
    entries = initialEntries.map(
      (entry, index2) => createMemoryLocation(
        entry,
        typeof entry === "string" ? null : entry.state,
        index2 === 0 ? "default" : void 0,
        typeof entry === "string" ? void 0 : entry.mask
      )
    );
    let index = clampIndex(
      initialIndex == null ? entries.length - 1 : initialIndex
    );
    let action = "POP";
    let listener = null;
    function clampIndex(n) {
      return Math.min(Math.max(n, 0), entries.length - 1);
    }
    function getCurrentLocation() {
      return entries[index];
    }
    function createMemoryLocation(to, state = null, key, mask) {
      let location = createLocation(
        entries ? getCurrentLocation().pathname : "/",
        to,
        state,
        key,
        mask
      );
      warning(
        location.pathname.charAt(0) === "/",
        `relative pathnames are not supported in memory history: ${JSON.stringify(
          to
        )}`
      );
      return location;
    }
    function createHref2(to) {
      return typeof to === "string" ? to : createPath(to);
    }
    let history = {
      get index() {
        return index;
      },
      get action() {
        return action;
      },
      get location() {
        return getCurrentLocation();
      },
      createHref: createHref2,
      createURL(to) {
        return new URL(createHref2(to), "http://localhost");
      },
      encodeLocation(to) {
        let path = typeof to === "string" ? parsePath(to) : to;
        return {
          pathname: path.pathname || "",
          search: path.search || "",
          hash: path.hash || ""
        };
      },
      push(to, state) {
        action = "PUSH";
        let nextLocation = isLocation(to) ? to : createMemoryLocation(to, state);
        index += 1;
        entries.splice(index, entries.length, nextLocation);
        if (v5Compat && listener) {
          listener({ action, location: nextLocation, delta: 1 });
        }
      },
      replace(to, state) {
        action = "REPLACE";
        let nextLocation = isLocation(to) ? to : createMemoryLocation(to, state);
        entries[index] = nextLocation;
        if (v5Compat && listener) {
          listener({ action, location: nextLocation, delta: 0 });
        }
      },
      go(delta) {
        action = "POP";
        let nextIndex = clampIndex(index + delta);
        let nextLocation = entries[nextIndex];
        index = nextIndex;
        if (listener) {
          listener({ action, location: nextLocation, delta });
        }
      },
      listen(fn) {
        listener = fn;
        return () => {
          listener = null;
        };
      }
    };
    return history;
  }
  function invariant(value, message) {
    if (value === false || value === null || typeof value === "undefined") {
      throw new Error(message);
    }
  }
  function warning(cond, message) {
    if (!cond) {
      if (typeof console !== "undefined") console.warn(message);
      try {
        throw new Error(message);
      } catch (e) {
      }
    }
  }
  function createKey() {
    return Math.random().toString(36).substring(2, 10);
  }
  function createLocation(current, to, state = null, key, mask) {
    let location = {
      pathname: typeof current === "string" ? current : current.pathname,
      search: "",
      hash: "",
      ...typeof to === "string" ? parsePath(to) : to,
      state,
      // TODO: This could be cleaned up.  push/replace should probably just take
      // full Locations now and avoid the need to run through this flow at all
      // But that's a pretty big refactor to the current test suite so going to
      // keep as is for the time being and just let any incoming keys take precedence
      key: to && to.key || key || createKey(),
      mask
    };
    return location;
  }
  function createPath({
    pathname = "/",
    search = "",
    hash = ""
  }) {
    if (search && search !== "?")
      pathname += search.charAt(0) === "?" ? search : "?" + search;
    if (hash && hash !== "#")
      pathname += hash.charAt(0) === "#" ? hash : "#" + hash;
    return pathname;
  }
  function parsePath(path) {
    let parsedPath = {};
    if (path) {
      let hashIndex = path.indexOf("#");
      if (hashIndex >= 0) {
        parsedPath.hash = path.substring(hashIndex);
        path = path.substring(0, hashIndex);
      }
      let searchIndex = path.indexOf("?");
      if (searchIndex >= 0) {
        parsedPath.search = path.substring(searchIndex);
        path = path.substring(0, searchIndex);
      }
      if (path) {
        parsedPath.pathname = path;
      }
    }
    return parsedPath;
  }
  var _map;
  _map = /* @__PURE__ */ new WeakMap();
  function matchRoutes(routes, locationArg, basename = "/") {
    return matchRoutesImpl(routes, locationArg, basename, false);
  }
  function matchRoutesImpl(routes, locationArg, basename, allowPartial, precomputedBranches) {
    let location = typeof locationArg === "string" ? parsePath(locationArg) : locationArg;
    let pathname = stripBasename(location.pathname || "/", basename);
    if (pathname == null) {
      return null;
    }
    let branches = precomputedBranches ?? flattenAndRankRoutes(routes);
    let matches = null;
    let decoded = decodePath(pathname);
    for (let i = 0; matches == null && i < branches.length; ++i) {
      matches = matchRouteBranch(
        branches[i],
        decoded,
        allowPartial
      );
    }
    return matches;
  }
  function convertRouteMatchToUiMatch(match, loaderData) {
    let { route, pathname, params } = match;
    return {
      id: route.id,
      pathname,
      params,
      data: loaderData[route.id],
      loaderData: loaderData[route.id],
      handle: route.handle
    };
  }
  function flattenAndRankRoutes(routes) {
    let branches = flattenRoutes(routes);
    rankRouteBranches(branches);
    return branches;
  }
  function flattenRoutes(routes, branches = [], parentsMeta = [], parentPath = "", _hasParentOptionalSegments = false) {
    let flattenRoute = (route, index, hasParentOptionalSegments = _hasParentOptionalSegments, relativePath) => {
      let meta = {
        relativePath: relativePath === void 0 ? route.path || "" : relativePath,
        caseSensitive: route.caseSensitive === true,
        childrenIndex: index,
        route
      };
      if (meta.relativePath.startsWith("/")) {
        if (!meta.relativePath.startsWith(parentPath) && hasParentOptionalSegments) {
          return;
        }
        invariant(
          meta.relativePath.startsWith(parentPath),
          `Absolute route path "${meta.relativePath}" nested under path "${parentPath}" is not valid. An absolute child route path must start with the combined path of all its parent routes.`
        );
        meta.relativePath = meta.relativePath.slice(parentPath.length);
      }
      let path = joinPaths([parentPath, meta.relativePath]);
      let routesMeta = parentsMeta.concat(meta);
      if (route.children && route.children.length > 0) {
        invariant(
          // Our types know better, but runtime JS may not!
          // @ts-expect-error
          route.index !== true,
          `Index routes must not have child routes. Please remove all child routes from route path "${path}".`
        );
        flattenRoutes(
          route.children,
          branches,
          routesMeta,
          path,
          hasParentOptionalSegments
        );
      }
      if (route.path == null && !route.index) {
        return;
      }
      branches.push({
        path,
        score: computeScore(path, route.index),
        routesMeta
      });
    };
    routes.forEach((route, index) => {
      if (route.path === "" || !route.path?.includes("?")) {
        flattenRoute(route, index);
      } else {
        for (let exploded of explodeOptionalSegments(route.path)) {
          flattenRoute(route, index, true, exploded);
        }
      }
    });
    return branches;
  }
  function explodeOptionalSegments(path) {
    let segments = path.split("/");
    if (segments.length === 0) return [];
    let [first, ...rest] = segments;
    let isOptional = first.endsWith("?");
    let required = first.replace(/\?$/, "");
    if (rest.length === 0) {
      return isOptional ? [required, ""] : [required];
    }
    let restExploded = explodeOptionalSegments(rest.join("/"));
    let result = [];
    result.push(
      ...restExploded.map(
        (subpath) => subpath === "" ? required : [required, subpath].join("/")
      )
    );
    if (isOptional) {
      result.push(...restExploded);
    }
    return result.map(
      (exploded) => path.startsWith("/") && exploded === "" ? "/" : exploded
    );
  }
  function rankRouteBranches(branches) {
    branches.sort(
      (a, b) => a.score !== b.score ? b.score - a.score : compareIndexes(
        a.routesMeta.map((meta) => meta.childrenIndex),
        b.routesMeta.map((meta) => meta.childrenIndex)
      )
    );
  }
  var paramRe = /^:[\w-]+$/;
  var dynamicSegmentValue = 3;
  var indexRouteValue = 2;
  var emptySegmentValue = 1;
  var staticSegmentValue = 10;
  var splatPenalty = -2;
  var isSplat = (s) => s === "*";
  function computeScore(path, index) {
    let segments = path.split("/");
    let initialScore = segments.length;
    if (segments.some(isSplat)) {
      initialScore += splatPenalty;
    }
    if (index) {
      initialScore += indexRouteValue;
    }
    return segments.filter((s) => !isSplat(s)).reduce(
      (score, segment) => score + (paramRe.test(segment) ? dynamicSegmentValue : segment === "" ? emptySegmentValue : staticSegmentValue),
      initialScore
    );
  }
  function compareIndexes(a, b) {
    let siblings = a.length === b.length && a.slice(0, -1).every((n, i) => n === b[i]);
    return siblings ? (
      // If two routes are siblings, we should try to match the earlier sibling
      // first. This allows people to have fine-grained control over the matching
      // behavior by simply putting routes with identical paths in the order they
      // want them tried.
      a[a.length - 1] - b[b.length - 1]
    ) : (
      // Otherwise, it doesn't really make sense to rank non-siblings by index,
      // so they sort equally.
      0
    );
  }
  function matchRouteBranch(branch, pathname, allowPartial = false) {
    let { routesMeta } = branch;
    let matchedParams = {};
    let matchedPathname = "/";
    let matches = [];
    for (let i = 0; i < routesMeta.length; ++i) {
      let meta = routesMeta[i];
      let end = i === routesMeta.length - 1;
      let remainingPathname = matchedPathname === "/" ? pathname : pathname.slice(matchedPathname.length) || "/";
      let match = matchPath(
        { path: meta.relativePath, caseSensitive: meta.caseSensitive, end },
        remainingPathname
      );
      let route = meta.route;
      if (!match && end && allowPartial && !routesMeta[routesMeta.length - 1].route.index) {
        match = matchPath(
          {
            path: meta.relativePath,
            caseSensitive: meta.caseSensitive,
            end: false
          },
          remainingPathname
        );
      }
      if (!match) {
        return null;
      }
      Object.assign(matchedParams, match.params);
      matches.push({
        // TODO: Can this as be avoided?
        params: matchedParams,
        pathname: joinPaths([matchedPathname, match.pathname]),
        pathnameBase: normalizePathname(
          joinPaths([matchedPathname, match.pathnameBase])
        ),
        route
      });
      if (match.pathnameBase !== "/") {
        matchedPathname = joinPaths([matchedPathname, match.pathnameBase]);
      }
    }
    return matches;
  }
  function matchPath(pattern, pathname) {
    if (typeof pattern === "string") {
      pattern = { path: pattern, caseSensitive: false, end: true };
    }
    let [matcher, compiledParams] = compilePath(
      pattern.path,
      pattern.caseSensitive,
      pattern.end
    );
    let match = pathname.match(matcher);
    if (!match) return null;
    let matchedPathname = match[0];
    let pathnameBase = matchedPathname.replace(/(.)\/+$/, "$1");
    let captureGroups = match.slice(1);
    let params = compiledParams.reduce(
      (memo2, { paramName, isOptional }, index) => {
        if (paramName === "*") {
          let splatValue = captureGroups[index] || "";
          pathnameBase = matchedPathname.slice(0, matchedPathname.length - splatValue.length).replace(/(.)\/+$/, "$1");
        }
        const value = captureGroups[index];
        if (isOptional && !value) {
          memo2[paramName] = void 0;
        } else {
          memo2[paramName] = (value || "").replace(/%2F/g, "/");
        }
        return memo2;
      },
      {}
    );
    return {
      params,
      pathname: matchedPathname,
      pathnameBase,
      pattern
    };
  }
  function compilePath(path, caseSensitive = false, end = true) {
    warning(
      path === "*" || !path.endsWith("*") || path.endsWith("/*"),
      `Route path "${path}" will be treated as if it were "${path.replace(/\*$/, "/*")}" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to "${path.replace(/\*$/, "/*")}".`
    );
    let params = [];
    let regexpSource = "^" + path.replace(/\/*\*?$/, "").replace(/^\/*/, "/").replace(/[\\.*+^${}|()[\]]/g, "\\$&").replace(
      /\/:([\w-]+)(\?)?/g,
      (match, paramName, isOptional, index, str) => {
        params.push({ paramName, isOptional: isOptional != null });
        if (isOptional) {
          let nextChar = str.charAt(index + match.length);
          if (nextChar && nextChar !== "/") {
            return "/([^\\/]*)";
          }
          return "(?:/([^\\/]*))?";
        }
        return "/([^\\/]+)";
      }
    ).replace(/\/([\w-]+)\?(\/|$)/g, "(/$1)?$2");
    if (path.endsWith("*")) {
      params.push({ paramName: "*" });
      regexpSource += path === "*" || path === "/*" ? "(.*)$" : "(?:\\/(.+)|\\/*)$";
    } else if (end) {
      regexpSource += "\\/*$";
    } else if (path !== "" && path !== "/") {
      regexpSource += "(?:(?=\\/|$))";
    } else {
    }
    let matcher = new RegExp(regexpSource, caseSensitive ? void 0 : "i");
    return [matcher, params];
  }
  function decodePath(value) {
    try {
      return value.split("/").map((v) => decodeURIComponent(v).replace(/\//g, "%2F")).join("/");
    } catch (error) {
      warning(
        false,
        `The URL path "${value}" could not be decoded because it is a malformed URL segment. This is probably due to a bad percent encoding (${error}).`
      );
      return value;
    }
  }
  function stripBasename(pathname, basename) {
    if (basename === "/") return pathname;
    if (!pathname.toLowerCase().startsWith(basename.toLowerCase())) {
      return null;
    }
    let startIndex = basename.endsWith("/") ? basename.length - 1 : basename.length;
    let nextChar = pathname.charAt(startIndex);
    if (nextChar && nextChar !== "/") {
      return null;
    }
    return pathname.slice(startIndex) || "/";
  }
  var ABSOLUTE_URL_REGEX = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
  function resolvePath(to, fromPathname = "/") {
    let {
      pathname: toPathname,
      search = "",
      hash = ""
    } = typeof to === "string" ? parsePath(to) : to;
    let pathname;
    if (toPathname) {
      toPathname = removeDoubleSlashes(toPathname);
      if (toPathname.startsWith("/")) {
        pathname = resolvePathname(toPathname.substring(1), "/");
      } else {
        pathname = resolvePathname(toPathname, fromPathname);
      }
    } else {
      pathname = fromPathname;
    }
    return {
      pathname,
      search: normalizeSearch(search),
      hash: normalizeHash(hash)
    };
  }
  function resolvePathname(relativePath, fromPathname) {
    let segments = removeTrailingSlash(fromPathname).split("/");
    let relativeSegments = relativePath.split("/");
    relativeSegments.forEach((segment) => {
      if (segment === "..") {
        if (segments.length > 1) segments.pop();
      } else if (segment !== ".") {
        segments.push(segment);
      }
    });
    return segments.length > 1 ? segments.join("/") : "/";
  }
  function getInvalidPathError(char, field, dest, path) {
    return `Cannot include a '${char}' character in a manually specified \`to.${field}\` field [${JSON.stringify(
      path
    )}].  Please separate it out to the \`to.${dest}\` field. Alternatively you may provide the full path as a string in <Link to="..."> and the router will parse it for you.`;
  }
  function getPathContributingMatches(matches) {
    return matches.filter(
      (match, index) => index === 0 || match.route.path && match.route.path.length > 0
    );
  }
  function getResolveToMatches(matches) {
    let pathMatches = getPathContributingMatches(matches);
    return pathMatches.map(
      (match, idx) => idx === pathMatches.length - 1 ? match.pathname : match.pathnameBase
    );
  }
  function resolveTo(toArg, routePathnames, locationPathname, isPathRelative = false) {
    let to;
    if (typeof toArg === "string") {
      to = parsePath(toArg);
    } else {
      to = { ...toArg };
      invariant(
        !to.pathname || !to.pathname.includes("?"),
        getInvalidPathError("?", "pathname", "search", to)
      );
      invariant(
        !to.pathname || !to.pathname.includes("#"),
        getInvalidPathError("#", "pathname", "hash", to)
      );
      invariant(
        !to.search || !to.search.includes("#"),
        getInvalidPathError("#", "search", "hash", to)
      );
    }
    let isEmptyPath = toArg === "" || to.pathname === "";
    let toPathname = isEmptyPath ? "/" : to.pathname;
    let from;
    if (toPathname == null) {
      from = locationPathname;
    } else {
      let routePathnameIndex = routePathnames.length - 1;
      if (!isPathRelative && toPathname.startsWith("..")) {
        let toSegments = toPathname.split("/");
        while (toSegments[0] === "..") {
          toSegments.shift();
          routePathnameIndex -= 1;
        }
        to.pathname = toSegments.join("/");
      }
      from = routePathnameIndex >= 0 ? routePathnames[routePathnameIndex] : "/";
    }
    let path = resolvePath(to, from);
    let hasExplicitTrailingSlash = toPathname && toPathname !== "/" && toPathname.endsWith("/");
    let hasCurrentTrailingSlash = (isEmptyPath || toPathname === ".") && locationPathname.endsWith("/");
    if (!path.pathname.endsWith("/") && (hasExplicitTrailingSlash || hasCurrentTrailingSlash)) {
      path.pathname += "/";
    }
    return path;
  }
  var removeDoubleSlashes = (path) => path.replace(/\/\/+/g, "/");
  var joinPaths = (paths) => removeDoubleSlashes(paths.join("/"));
  var removeTrailingSlash = (path) => path.replace(/\/+$/, "");
  var normalizePathname = (pathname) => removeTrailingSlash(pathname).replace(/^\/*/, "/");
  var normalizeSearch = (search) => !search || search === "?" ? "" : search.startsWith("?") ? search : "?" + search;
  var normalizeHash = (hash) => !hash || hash === "#" ? "" : hash.startsWith("#") ? hash : "#" + hash;
  var ErrorResponseImpl = class {
    constructor(status, statusText, data2, internal = false) {
      this.status = status;
      this.statusText = statusText || "";
      this.internal = internal;
      if (data2 instanceof Error) {
        this.data = data2.toString();
        this.error = data2;
      } else {
        this.data = data2;
      }
    }
  };
  function isRouteErrorResponse(error) {
    return error != null && typeof error.status === "number" && typeof error.statusText === "string" && typeof error.internal === "boolean" && "data" in error;
  }
  function getRoutePattern(matches) {
    let parts = matches.map((m) => m.route.path).filter(Boolean);
    return joinPaths(parts) || "/";
  }
  var isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined" && typeof window.document.createElement !== "undefined";
  function parseToInfo(_to, basename) {
    let to = _to;
    if (typeof to !== "string" || !ABSOLUTE_URL_REGEX.test(to)) {
      return {
        absoluteURL: void 0,
        isExternal: false,
        to
      };
    }
    let absoluteURL = to;
    let isExternal = false;
    if (isBrowser) {
      try {
        let currentUrl = new URL(window.location.href);
        let targetUrl = to.startsWith("//") ? new URL(currentUrl.protocol + to) : new URL(to);
        let path = stripBasename(targetUrl.pathname, basename);
        if (targetUrl.origin === currentUrl.origin && path != null) {
          to = path + targetUrl.search + targetUrl.hash;
        } else {
          isExternal = true;
        }
      } catch (e) {
        warning(
          false,
          `<Link to="${to}"> contains an invalid URL which will probably break when clicked - please update to a valid URL path.`
        );
      }
    }
    return {
      absoluteURL,
      isExternal,
      to
    };
  }
  var objectProtoNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
  var validMutationMethodsArr = [
    "POST",
    "PUT",
    "PATCH",
    "DELETE"
  ];
  var validMutationMethods = new Set(
    validMutationMethodsArr
  );
  var validRequestMethodsArr = [
    "GET",
    ...validMutationMethodsArr
  ];
  var validRequestMethods = new Set(validRequestMethodsArr);
  var _routes;
  var _branches;
  var _hmrRoutes;
  var _hmrBranches;
  _routes = /* @__PURE__ */ new WeakMap();
  _branches = /* @__PURE__ */ new WeakMap();
  _hmrRoutes = /* @__PURE__ */ new WeakMap();
  _hmrBranches = /* @__PURE__ */ new WeakMap();
  var DataRouterContext = React.createContext(null);
  DataRouterContext.displayName = "DataRouter";
  var DataRouterStateContext = React.createContext(null);
  DataRouterStateContext.displayName = "DataRouterState";
  var RSCRouterContext = React.createContext(false);
  function useIsRSCRouterContext() {
    return React.useContext(RSCRouterContext);
  }
  var ViewTransitionContext = React.createContext({
    isTransitioning: false
  });
  ViewTransitionContext.displayName = "ViewTransition";
  var FetchersContext = React.createContext(
    /* @__PURE__ */ new Map()
  );
  FetchersContext.displayName = "Fetchers";
  var AwaitContext = React.createContext(null);
  AwaitContext.displayName = "Await";
  var NavigationContext = React.createContext(
    null
  );
  NavigationContext.displayName = "Navigation";
  var LocationContext = React.createContext(
    null
  );
  LocationContext.displayName = "Location";
  var RouteContext = React.createContext({
    outlet: null,
    matches: [],
    isDataRoute: false
  });
  RouteContext.displayName = "Route";
  var RouteErrorContext = React.createContext(null);
  RouteErrorContext.displayName = "RouteError";
  var ENABLE_DEV_WARNINGS = true;
  var ERROR_DIGEST_BASE = "REACT_ROUTER_ERROR";
  var ERROR_DIGEST_REDIRECT = "REDIRECT";
  var ERROR_DIGEST_ROUTE_ERROR_RESPONSE = "ROUTE_ERROR_RESPONSE";
  function decodeRedirectErrorDigest(digest) {
    if (digest.startsWith(`${ERROR_DIGEST_BASE}:${ERROR_DIGEST_REDIRECT}:{`)) {
      try {
        let parsed = JSON.parse(digest.slice(28));
        if (typeof parsed === "object" && parsed && typeof parsed.status === "number" && typeof parsed.statusText === "string" && typeof parsed.location === "string" && typeof parsed.reloadDocument === "boolean" && typeof parsed.replace === "boolean") {
          return parsed;
        }
      } catch {
      }
    }
  }
  function decodeRouteErrorResponseDigest(digest) {
    if (digest.startsWith(
      `${ERROR_DIGEST_BASE}:${ERROR_DIGEST_ROUTE_ERROR_RESPONSE}:{`
    )) {
      try {
        let parsed = JSON.parse(digest.slice(40));
        if (typeof parsed === "object" && parsed && typeof parsed.status === "number" && typeof parsed.statusText === "string") {
          return new ErrorResponseImpl(
            parsed.status,
            parsed.statusText,
            parsed.data
          );
        }
      } catch {
      }
    }
  }
  function useHref(to, { relative } = {}) {
    invariant(
      useInRouterContext(),
      // TODO: This error is probably because they somehow have 2 versions of the
      // router loaded. We can help them understand how to avoid that.
      `useHref() may be used only in the context of a <Router> component.`
    );
    let { basename, navigator } = React2.useContext(NavigationContext);
    let { hash, pathname, search } = useResolvedPath(to, { relative });
    let joinedPathname = pathname;
    if (basename !== "/") {
      joinedPathname = pathname === "/" ? basename : joinPaths([basename, pathname]);
    }
    return navigator.createHref({ pathname: joinedPathname, search, hash });
  }
  function useInRouterContext() {
    return React2.useContext(LocationContext) != null;
  }
  function useLocation() {
    invariant(
      useInRouterContext(),
      // TODO: This error is probably because they somehow have 2 versions of the
      // router loaded. We can help them understand how to avoid that.
      `useLocation() may be used only in the context of a <Router> component.`
    );
    return React2.useContext(LocationContext).location;
  }
  var navigateEffectWarning = `You should call navigate() in a React.useEffect(), not when your component is first rendered.`;
  function useIsomorphicLayoutEffect(cb) {
    let isStatic = React2.useContext(NavigationContext).static;
    if (!isStatic) {
      React2.useLayoutEffect(cb);
    }
  }
  function useNavigate() {
    let { isDataRoute } = React2.useContext(RouteContext);
    return isDataRoute ? useNavigateStable() : useNavigateUnstable();
  }
  function useNavigateUnstable() {
    invariant(
      useInRouterContext(),
      // TODO: This error is probably because they somehow have 2 versions of the
      // router loaded. We can help them understand how to avoid that.
      `useNavigate() may be used only in the context of a <Router> component.`
    );
    let dataRouterContext = React2.useContext(DataRouterContext);
    let { basename, navigator } = React2.useContext(NavigationContext);
    let { matches } = React2.useContext(RouteContext);
    let { pathname: locationPathname } = useLocation();
    let routePathnamesJson = JSON.stringify(getResolveToMatches(matches));
    let activeRef = React2.useRef(false);
    useIsomorphicLayoutEffect(() => {
      activeRef.current = true;
    });
    let navigate = React2.useCallback(
      (to, options = {}) => {
        warning(activeRef.current, navigateEffectWarning);
        if (!activeRef.current) return;
        if (typeof to === "number") {
          navigator.go(to);
          return;
        }
        let path = resolveTo(
          to,
          JSON.parse(routePathnamesJson),
          locationPathname,
          options.relative === "path"
        );
        if (dataRouterContext == null && basename !== "/") {
          path.pathname = path.pathname === "/" ? basename : joinPaths([basename, path.pathname]);
        }
        (!!options.replace ? navigator.replace : navigator.push)(
          path,
          options.state,
          options
        );
      },
      [
        basename,
        navigator,
        routePathnamesJson,
        locationPathname,
        dataRouterContext
      ]
    );
    return navigate;
  }
  var OutletContext = React2.createContext(null);
  function useOutlet(context) {
    let outlet = React2.useContext(RouteContext).outlet;
    return React2.useMemo(
      () => outlet && /* @__PURE__ */ React2.createElement(OutletContext.Provider, { value: context }, outlet),
      [outlet, context]
    );
  }
  function useResolvedPath(to, { relative } = {}) {
    let { matches } = React2.useContext(RouteContext);
    let { pathname: locationPathname } = useLocation();
    let routePathnamesJson = JSON.stringify(getResolveToMatches(matches));
    return React2.useMemo(
      () => resolveTo(
        to,
        JSON.parse(routePathnamesJson),
        locationPathname,
        relative === "path"
      ),
      [to, routePathnamesJson, locationPathname, relative]
    );
  }
  function useRoutesImpl(routes, locationArg, dataRouterOpts) {
    invariant(
      useInRouterContext(),
      // TODO: This error is probably because they somehow have 2 versions of the
      // router loaded. We can help them understand how to avoid that.
      `useRoutes() may be used only in the context of a <Router> component.`
    );
    let { navigator } = React2.useContext(NavigationContext);
    let { matches: parentMatches } = React2.useContext(RouteContext);
    let routeMatch = parentMatches[parentMatches.length - 1];
    let parentParams = routeMatch ? routeMatch.params : {};
    let parentPathname = routeMatch ? routeMatch.pathname : "/";
    let parentPathnameBase = routeMatch ? routeMatch.pathnameBase : "/";
    let parentRoute = routeMatch && routeMatch.route;
    if (ENABLE_DEV_WARNINGS) {
      let parentPath = parentRoute && parentRoute.path || "";
      warningOnce(
        parentPathname,
        !parentRoute || parentPath.endsWith("*") || parentPath.endsWith("*?"),
        `You rendered descendant <Routes> (or called \`useRoutes()\`) at "${parentPathname}" (under <Route path="${parentPath}">) but the parent route path has no trailing "*". This means if you navigate deeper, the parent won't match anymore and therefore the child routes will never render.

Please change the parent <Route path="${parentPath}"> to <Route path="${parentPath === "/" ? "*" : `${parentPath}/*`}">.`
      );
    }
    let locationFromContext = useLocation();
    let location;
    if (locationArg) {
      let parsedLocationArg = typeof locationArg === "string" ? parsePath(locationArg) : locationArg;
      invariant(
        parentPathnameBase === "/" || parsedLocationArg.pathname?.startsWith(parentPathnameBase),
        `When overriding the location using \`<Routes location>\` or \`useRoutes(routes, location)\`, the location pathname must begin with the portion of the URL pathname that was matched by all parent routes. The current pathname base is "${parentPathnameBase}" but pathname "${parsedLocationArg.pathname}" was given in the \`location\` prop.`
      );
      location = parsedLocationArg;
    } else {
      location = locationFromContext;
    }
    let pathname = location.pathname || "/";
    let remainingPathname = pathname;
    if (parentPathnameBase !== "/") {
      let parentSegments = parentPathnameBase.replace(/^\//, "").split("/");
      let segments = pathname.replace(/^\//, "").split("/");
      remainingPathname = "/" + segments.slice(parentSegments.length).join("/");
    }
    let matches = dataRouterOpts && dataRouterOpts.state.matches.length ? (
      // If we're in a data router, use the matches we've already identified but ensure
      // we have the latest route instances from the manifest in case elements have changed
      dataRouterOpts.state.matches.map(
        (m) => Object.assign(m, {
          route: dataRouterOpts.manifest[m.route.id] || m.route
        })
      )
    ) : matchRoutes(routes, { pathname: remainingPathname });
    if (ENABLE_DEV_WARNINGS) {
      warning(
        parentRoute || matches != null,
        `No routes matched location "${location.pathname}${location.search}${location.hash}" `
      );
      warning(
        matches == null || matches[matches.length - 1].route.element !== void 0 || matches[matches.length - 1].route.Component !== void 0 || matches[matches.length - 1].route.lazy !== void 0,
        `Matched leaf route at location "${location.pathname}${location.search}${location.hash}" does not have an element or Component. This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.`
      );
    }
    let renderedMatches = _renderMatches(
      matches && matches.map(
        (match) => Object.assign({}, match, {
          params: Object.assign({}, parentParams, match.params),
          pathname: joinPaths([
            parentPathnameBase,
            // Re-encode pathnames that were decoded inside matchRoutes.
            // Pre-encode `%`, `?` and `#` ahead of `encodeLocation` because it uses
            // `new URL()` internally and we need to prevent it from treating
            // them as separators
            navigator.encodeLocation ? navigator.encodeLocation(
              match.pathname.replace(/%/g, "%25").replace(/\?/g, "%3F").replace(/#/g, "%23")
            ).pathname : match.pathname
          ]),
          pathnameBase: match.pathnameBase === "/" ? parentPathnameBase : joinPaths([
            parentPathnameBase,
            // Re-encode pathnames that were decoded inside matchRoutes
            // Pre-encode `%`, `?` and `#` ahead of `encodeLocation` because it uses
            // `new URL()` internally and we need to prevent it from treating
            // them as separators
            navigator.encodeLocation ? navigator.encodeLocation(
              match.pathnameBase.replace(/%/g, "%25").replace(/\?/g, "%3F").replace(/#/g, "%23")
            ).pathname : match.pathnameBase
          ])
        })
      ),
      parentMatches,
      dataRouterOpts
    );
    if (locationArg && renderedMatches) {
      return /* @__PURE__ */ React2.createElement(
        LocationContext.Provider,
        {
          value: {
            location: {
              pathname: "/",
              search: "",
              hash: "",
              state: null,
              key: "default",
              mask: void 0,
              ...location
            },
            navigationType: "POP"
            /* Pop */
          }
        },
        renderedMatches
      );
    }
    return renderedMatches;
  }
  function DefaultErrorComponent() {
    let error = useRouteError();
    let message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : JSON.stringify(error);
    let stack = error instanceof Error ? error.stack : null;
    let lightgrey = "rgba(200,200,200, 0.5)";
    let preStyles = { padding: "0.5rem", backgroundColor: lightgrey };
    let codeStyles = { padding: "2px 4px", backgroundColor: lightgrey };
    let devInfo = null;
    if (ENABLE_DEV_WARNINGS) {
      console.error(
        "Error handled by React Router default ErrorBoundary:",
        error
      );
      devInfo = /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement("p", null, "\u{1F4BF} Hey developer \u{1F44B}"), /* @__PURE__ */ React2.createElement("p", null, "You can provide a way better UX than this when your app throws errors by providing your own ", /* @__PURE__ */ React2.createElement("code", { style: codeStyles }, "ErrorBoundary"), " or", " ", /* @__PURE__ */ React2.createElement("code", { style: codeStyles }, "errorElement"), " prop on your route."));
    }
    return /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement("h2", null, "Unexpected Application Error!"), /* @__PURE__ */ React2.createElement("h3", { style: { fontStyle: "italic" } }, message), stack ? /* @__PURE__ */ React2.createElement("pre", { style: preStyles }, stack) : null, devInfo);
  }
  var defaultErrorElement = /* @__PURE__ */ React2.createElement(DefaultErrorComponent, null);
  var RenderErrorBoundary = class extends React2.Component {
    constructor(props) {
      super(props);
      this.state = {
        location: props.location,
        revalidation: props.revalidation,
        error: props.error
      };
    }
    static getDerivedStateFromError(error) {
      return { error };
    }
    static getDerivedStateFromProps(props, state) {
      if (state.location !== props.location || state.revalidation !== "idle" && props.revalidation === "idle") {
        return {
          error: props.error,
          location: props.location,
          revalidation: props.revalidation
        };
      }
      return {
        error: props.error !== void 0 ? props.error : state.error,
        location: state.location,
        revalidation: props.revalidation || state.revalidation
      };
    }
    componentDidCatch(error, errorInfo) {
      if (this.props.onError) {
        this.props.onError(error, errorInfo);
      } else {
        console.error(
          "React Router caught the following error during render",
          error
        );
      }
    }
    render() {
      let error = this.state.error;
      if (this.context && typeof error === "object" && error && "digest" in error && typeof error.digest === "string") {
        const decoded = decodeRouteErrorResponseDigest(error.digest);
        if (decoded) error = decoded;
      }
      let result = error !== void 0 ? /* @__PURE__ */ React2.createElement(RouteContext.Provider, { value: this.props.routeContext }, /* @__PURE__ */ React2.createElement(
        RouteErrorContext.Provider,
        {
          value: error,
          children: this.props.component
        }
      )) : this.props.children;
      if (this.context) {
        return /* @__PURE__ */ React2.createElement(RSCErrorHandler, { error }, result);
      }
      return result;
    }
  };
  RenderErrorBoundary.contextType = RSCRouterContext;
  var errorRedirectHandledMap = /* @__PURE__ */ new WeakMap();
  function RSCErrorHandler({
    children,
    error
  }) {
    let { basename } = React2.useContext(NavigationContext);
    if (typeof error === "object" && error && "digest" in error && typeof error.digest === "string") {
      let redirect2 = decodeRedirectErrorDigest(error.digest);
      if (redirect2) {
        let existingRedirect = errorRedirectHandledMap.get(error);
        if (existingRedirect) throw existingRedirect;
        let parsed = parseToInfo(redirect2.location, basename);
        if (isBrowser && !errorRedirectHandledMap.get(error)) {
          if (parsed.isExternal || redirect2.reloadDocument) {
            window.location.href = parsed.absoluteURL || parsed.to;
          } else {
            const redirectPromise = Promise.resolve().then(
              () => window.__reactRouterDataRouter.navigate(parsed.to, {
                replace: redirect2.replace
              })
            );
            errorRedirectHandledMap.set(error, redirectPromise);
            throw redirectPromise;
          }
        }
        return /* @__PURE__ */ React2.createElement(
          "meta",
          {
            httpEquiv: "refresh",
            content: `0;url=${parsed.absoluteURL || parsed.to}`
          }
        );
      }
    }
    return children;
  }
  function RenderedRoute({ routeContext, match, children }) {
    let dataRouterContext = React2.useContext(DataRouterContext);
    if (dataRouterContext && dataRouterContext.static && dataRouterContext.staticContext && (match.route.errorElement || match.route.ErrorBoundary)) {
      dataRouterContext.staticContext._deepestRenderedBoundaryId = match.route.id;
    }
    return /* @__PURE__ */ React2.createElement(RouteContext.Provider, { value: routeContext }, children);
  }
  function _renderMatches(matches, parentMatches = [], dataRouterOpts) {
    let dataRouterState = dataRouterOpts?.state;
    if (matches == null) {
      if (!dataRouterState) {
        return null;
      }
      if (dataRouterState.errors) {
        matches = dataRouterState.matches;
      } else if (parentMatches.length === 0 && !dataRouterState.initialized && dataRouterState.matches.length > 0) {
        matches = dataRouterState.matches;
      } else {
        return null;
      }
    }
    let renderedMatches = matches;
    let errors = dataRouterState?.errors;
    if (errors != null) {
      let errorIndex = renderedMatches.findIndex(
        (m) => m.route.id && errors?.[m.route.id] !== void 0
      );
      invariant(
        errorIndex >= 0,
        `Could not find a matching route for errors on route IDs: ${Object.keys(
          errors
        ).join(",")}`
      );
      renderedMatches = renderedMatches.slice(
        0,
        Math.min(renderedMatches.length, errorIndex + 1)
      );
    }
    let renderFallback = false;
    let fallbackIndex = -1;
    if (dataRouterOpts && dataRouterState) {
      renderFallback = dataRouterState.renderFallback;
      for (let i = 0; i < renderedMatches.length; i++) {
        let match = renderedMatches[i];
        if (match.route.HydrateFallback || match.route.hydrateFallbackElement) {
          fallbackIndex = i;
        }
        if (match.route.id) {
          let { loaderData, errors: errors2 } = dataRouterState;
          let needsToRunLoader = match.route.loader && !loaderData.hasOwnProperty(match.route.id) && (!errors2 || errors2[match.route.id] === void 0);
          if (match.route.lazy || needsToRunLoader) {
            if (dataRouterOpts.isStatic) {
              renderFallback = true;
            }
            if (fallbackIndex >= 0) {
              renderedMatches = renderedMatches.slice(0, fallbackIndex + 1);
            } else {
              renderedMatches = [renderedMatches[0]];
            }
            break;
          }
        }
      }
    }
    let onErrorHandler = dataRouterOpts?.onError;
    let onError = dataRouterState && onErrorHandler ? (error, errorInfo) => {
      onErrorHandler(error, {
        location: dataRouterState.location,
        params: dataRouterState.matches?.[0]?.params ?? {},
        pattern: getRoutePattern(dataRouterState.matches),
        errorInfo
      });
    } : void 0;
    return renderedMatches.reduceRight(
      (outlet, match, index) => {
        let error;
        let shouldRenderHydrateFallback = false;
        let errorElement = null;
        let hydrateFallbackElement = null;
        if (dataRouterState) {
          error = errors && match.route.id ? errors[match.route.id] : void 0;
          errorElement = match.route.errorElement || defaultErrorElement;
          if (renderFallback) {
            if (fallbackIndex < 0 && index === 0) {
              warningOnce(
                "route-fallback",
                false,
                "No `HydrateFallback` element provided to render during initial hydration"
              );
              shouldRenderHydrateFallback = true;
              hydrateFallbackElement = null;
            } else if (fallbackIndex === index) {
              shouldRenderHydrateFallback = true;
              hydrateFallbackElement = match.route.hydrateFallbackElement || null;
            }
          }
        }
        let matches2 = parentMatches.concat(renderedMatches.slice(0, index + 1));
        let getChildren = () => {
          let children;
          if (error) {
            children = errorElement;
          } else if (shouldRenderHydrateFallback) {
            children = hydrateFallbackElement;
          } else if (match.route.Component) {
            children = /* @__PURE__ */ React2.createElement(match.route.Component, null);
          } else if (match.route.element) {
            children = match.route.element;
          } else {
            children = outlet;
          }
          return /* @__PURE__ */ React2.createElement(
            RenderedRoute,
            {
              match,
              routeContext: {
                outlet,
                matches: matches2,
                isDataRoute: dataRouterState != null
              },
              children
            }
          );
        };
        return dataRouterState && (match.route.ErrorBoundary || match.route.errorElement || index === 0) ? /* @__PURE__ */ React2.createElement(
          RenderErrorBoundary,
          {
            location: dataRouterState.location,
            revalidation: dataRouterState.revalidation,
            component: errorElement,
            error,
            children: getChildren(),
            routeContext: { outlet: null, matches: matches2, isDataRoute: true },
            onError
          }
        ) : getChildren();
      },
      null
    );
  }
  function getDataRouterConsoleError(hookName) {
    return `${hookName} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
  }
  function useDataRouterContext(hookName) {
    let ctx = React2.useContext(DataRouterContext);
    invariant(ctx, getDataRouterConsoleError(hookName));
    return ctx;
  }
  function useDataRouterState(hookName) {
    let state = React2.useContext(DataRouterStateContext);
    invariant(state, getDataRouterConsoleError(hookName));
    return state;
  }
  function useRouteContext(hookName) {
    let route = React2.useContext(RouteContext);
    invariant(route, getDataRouterConsoleError(hookName));
    return route;
  }
  function useCurrentRouteId(hookName) {
    let route = useRouteContext(hookName);
    let thisRoute = route.matches[route.matches.length - 1];
    invariant(
      thisRoute.route.id,
      `${hookName} can only be used on routes that contain a unique "id"`
    );
    return thisRoute.route.id;
  }
  function useRouteId() {
    return useCurrentRouteId(
      "useRouteId"
      /* UseRouteId */
    );
  }
  function useNavigation() {
    let state = useDataRouterState(
      "useNavigation"
      /* UseNavigation */
    );
    return React2.useMemo(() => {
      let { matches, historyAction, ...rest } = state.navigation;
      return rest;
    }, [state.navigation]);
  }
  function useMatches() {
    let { matches, loaderData } = useDataRouterState(
      "useMatches"
      /* UseMatches */
    );
    return React2.useMemo(
      () => matches.map((m) => convertRouteMatchToUiMatch(m, loaderData)),
      [matches, loaderData]
    );
  }
  function useRouteError() {
    let error = React2.useContext(RouteErrorContext);
    let state = useDataRouterState(
      "useRouteError"
      /* UseRouteError */
    );
    let routeId = useCurrentRouteId(
      "useRouteError"
      /* UseRouteError */
    );
    if (error !== void 0) {
      return error;
    }
    return state.errors?.[routeId];
  }
  function useNavigateStable() {
    let { router } = useDataRouterContext(
      "useNavigate"
      /* UseNavigateStable */
    );
    let id = useCurrentRouteId(
      "useNavigate"
      /* UseNavigateStable */
    );
    let activeRef = React2.useRef(false);
    useIsomorphicLayoutEffect(() => {
      activeRef.current = true;
    });
    let navigate = React2.useCallback(
      async (to, options = {}) => {
        warning(activeRef.current, navigateEffectWarning);
        if (!activeRef.current) return;
        if (typeof to === "number") {
          await router.navigate(to);
        } else {
          await router.navigate(to, { fromRouteId: id, ...options });
        }
      },
      [router, id]
    );
    return navigate;
  }
  var alreadyWarned = {};
  function warningOnce(key, cond, message) {
    if (!cond && !alreadyWarned[key]) {
      alreadyWarned[key] = true;
      warning(false, message);
    }
  }
  var USE_OPTIMISTIC = "useOptimistic";
  var useOptimisticImpl = React3[USE_OPTIMISTIC];
  var MemoizedDataRoutes = React3.memo(DataRoutes2);
  function DataRoutes2({
    routes,
    manifest,
    future,
    state,
    isStatic,
    onError
  }) {
    return useRoutesImpl(routes, void 0, {
      manifest,
      state,
      isStatic,
      onError,
      future
    });
  }
  function MemoryRouter({
    basename,
    children,
    initialEntries,
    initialIndex,
    useTransitions
  }) {
    let historyRef = React3.useRef();
    if (historyRef.current == null) {
      historyRef.current = createMemoryHistory({
        initialEntries,
        initialIndex,
        v5Compat: true
      });
    }
    let history = historyRef.current;
    let [state, setStateImpl] = React3.useState({
      action: history.action,
      location: history.location
    });
    let setState = React3.useCallback(
      (newState) => {
        if (useTransitions === false) {
          setStateImpl(newState);
        } else {
          React3.startTransition(() => setStateImpl(newState));
        }
      },
      [useTransitions]
    );
    React3.useLayoutEffect(() => history.listen(setState), [history, setState]);
    return /* @__PURE__ */ React3.createElement(
      Router,
      {
        basename,
        children,
        location: state.location,
        navigationType: state.action,
        navigator: history,
        useTransitions
      }
    );
  }
  function Outlet(props) {
    return useOutlet(props.context);
  }
  function Router({
    basename: basenameProp = "/",
    children = null,
    location: locationProp,
    navigationType = "POP",
    navigator,
    static: staticProp = false,
    useTransitions
  }) {
    invariant(
      !useInRouterContext(),
      `You cannot render a <Router> inside another <Router>. You should never have more than one in your app.`
    );
    let basename = basenameProp.replace(/^\/*/, "/");
    let navigationContext = React3.useMemo(
      () => ({
        basename,
        navigator,
        static: staticProp,
        useTransitions,
        future: {}
      }),
      [basename, navigator, staticProp, useTransitions]
    );
    if (typeof locationProp === "string") {
      locationProp = parsePath(locationProp);
    }
    let {
      pathname = "/",
      search = "",
      hash = "",
      state = null,
      key = "default",
      mask
    } = locationProp;
    let locationContext = React3.useMemo(() => {
      let trailingPathname = stripBasename(pathname, basename);
      if (trailingPathname == null) {
        return null;
      }
      return {
        location: {
          pathname: trailingPathname,
          search,
          hash,
          state,
          key,
          mask
        },
        navigationType
      };
    }, [basename, pathname, search, hash, state, key, navigationType, mask]);
    warning(
      locationContext != null,
      `<Router basename="${basename}"> is not able to match the URL "${pathname}${search}${hash}" because it does not start with the basename, so the <Router> won't render anything.`
    );
    if (locationContext == null) {
      return null;
    }
    return /* @__PURE__ */ React3.createElement(NavigationContext.Provider, { value: navigationContext }, /* @__PURE__ */ React3.createElement(LocationContext.Provider, { children, value: locationContext }));
  }
  var defaultMethod = "get";
  var defaultEncType = "application/x-www-form-urlencoded";
  function isHtmlElement(object) {
    return typeof HTMLElement !== "undefined" && object instanceof HTMLElement;
  }
  function isButtonElement(object) {
    return isHtmlElement(object) && object.tagName.toLowerCase() === "button";
  }
  function isFormElement(object) {
    return isHtmlElement(object) && object.tagName.toLowerCase() === "form";
  }
  function isInputElement(object) {
    return isHtmlElement(object) && object.tagName.toLowerCase() === "input";
  }
  function isModifiedEvent(event) {
    return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
  }
  function shouldProcessLinkClick(event, target) {
    return event.button === 0 && // Ignore everything but left clicks
    (!target || target === "_self") && // Let browser handle "target=_blank" etc.
    !isModifiedEvent(event);
  }
  var _formDataSupportsSubmitter = null;
  function isFormDataSubmitterSupported() {
    if (_formDataSupportsSubmitter === null) {
      try {
        new FormData(
          document.createElement("form"),
          // @ts-expect-error if FormData supports the submitter parameter, this will throw
          0
        );
        _formDataSupportsSubmitter = false;
      } catch (e) {
        _formDataSupportsSubmitter = true;
      }
    }
    return _formDataSupportsSubmitter;
  }
  var supportedFormEncTypes = /* @__PURE__ */ new Set([
    "application/x-www-form-urlencoded",
    "multipart/form-data",
    "text/plain"
  ]);
  function getFormEncType(encType) {
    if (encType != null && !supportedFormEncTypes.has(encType)) {
      warning(
        false,
        `"${encType}" is not a valid \`encType\` for \`<Form>\`/\`<fetcher.Form>\` and will default to "${defaultEncType}"`
      );
      return null;
    }
    return encType;
  }
  function getFormSubmissionInfo(target, basename) {
    let method;
    let action;
    let encType;
    let formData;
    let body;
    if (isFormElement(target)) {
      let attr = target.getAttribute("action");
      action = attr ? stripBasename(attr, basename) : null;
      method = target.getAttribute("method") || defaultMethod;
      encType = getFormEncType(target.getAttribute("enctype")) || defaultEncType;
      formData = new FormData(target);
    } else if (isButtonElement(target) || isInputElement(target) && (target.type === "submit" || target.type === "image")) {
      let form = target.form;
      if (form == null) {
        throw new Error(
          `Cannot submit a <button> or <input type="submit"> without a <form>`
        );
      }
      let attr = target.getAttribute("formaction") || form.getAttribute("action");
      action = attr ? stripBasename(attr, basename) : null;
      method = target.getAttribute("formmethod") || form.getAttribute("method") || defaultMethod;
      encType = getFormEncType(target.getAttribute("formenctype")) || getFormEncType(form.getAttribute("enctype")) || defaultEncType;
      formData = new FormData(form, target);
      if (!isFormDataSubmitterSupported()) {
        let { name, type, value } = target;
        if (type === "image") {
          let prefix = name ? `${name}.` : "";
          formData.append(`${prefix}x`, "0");
          formData.append(`${prefix}y`, "0");
        } else if (name) {
          formData.append(name, value);
        }
      }
    } else if (isHtmlElement(target)) {
      throw new Error(
        `Cannot submit element that is not <form>, <button>, or <input type="submit|image">`
      );
    } else {
      method = defaultMethod;
      action = null;
      encType = defaultEncType;
      body = target;
    }
    if (formData && encType === "text/plain") {
      body = formData;
      formData = void 0;
    }
    return { action, method: method.toLowerCase(), encType, formData, body };
  }
  var objectProtoNames2 = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
  var ESCAPE_LOOKUP = {
    "&": "\\u0026",
    ">": "\\u003e",
    "<": "\\u003c",
    "\u2028": "\\u2028",
    "\u2029": "\\u2029"
  };
  var ESCAPE_REGEX = /[&><\u2028\u2029]/g;
  function escapeHtml(html) {
    return html.replace(ESCAPE_REGEX, (match) => ESCAPE_LOOKUP[match]);
  }
  function invariant2(value, message) {
    if (value === false || value === null || typeof value === "undefined") {
      throw new Error(message);
    }
  }
  function singleFetchUrl(reqUrl, basename, trailingSlashAware, extension) {
    let url = typeof reqUrl === "string" ? new URL(
      reqUrl,
      // This can be called during the SSR flow via PrefetchPageLinksImpl so
      // don't assume window is available
      typeof window === "undefined" ? "server://singlefetch/" : window.location.origin
    ) : reqUrl;
    if (trailingSlashAware) {
      if (url.pathname.endsWith("/")) {
        url.pathname = `${url.pathname}_.${extension}`;
      } else {
        url.pathname = `${url.pathname}.${extension}`;
      }
    } else {
      if (url.pathname === "/") {
        url.pathname = `_root.${extension}`;
      } else if (basename && stripBasename(url.pathname, basename) === "/") {
        url.pathname = `${removeTrailingSlash(basename)}/_root.${extension}`;
      } else {
        url.pathname = `${removeTrailingSlash(url.pathname)}.${extension}`;
      }
    }
    return url;
  }
  async function loadRouteModule(route, routeModulesCache) {
    if (route.id in routeModulesCache) {
      return routeModulesCache[route.id];
    }
    try {
      let routeModule = await import(
        /* @vite-ignore */
        /* webpackIgnore: true */
        route.module
      );
      routeModulesCache[route.id] = routeModule;
      return routeModule;
    } catch (error) {
      console.error(
        `Error loading route module \`${route.module}\`, reloading page...`
      );
      console.error(error);
      if (window.__reactRouterContext && window.__reactRouterContext.isSpaMode && // @ts-expect-error
      import_meta.hot) {
        throw error;
      }
      window.location.reload();
      return new Promise(() => {
      });
    }
  }
  function isPageLinkDescriptor(object) {
    return object != null && typeof object.page === "string";
  }
  function isHtmlLinkDescriptor(object) {
    if (object == null) {
      return false;
    }
    if (object.href == null) {
      return object.rel === "preload" && typeof object.imageSrcSet === "string" && typeof object.imageSizes === "string";
    }
    return typeof object.rel === "string" && typeof object.href === "string";
  }
  async function getKeyedPrefetchLinks(matches, manifest, routeModules) {
    let links = await Promise.all(
      matches.map(async (match) => {
        let route = manifest.routes[match.route.id];
        if (route) {
          let mod = await loadRouteModule(route, routeModules);
          return mod.links ? mod.links() : [];
        }
        return [];
      })
    );
    return dedupeLinkDescriptors(
      links.flat(1).filter(isHtmlLinkDescriptor).filter((link) => link.rel === "stylesheet" || link.rel === "preload").map(
        (link) => link.rel === "stylesheet" ? { ...link, rel: "prefetch", as: "style" } : { ...link, rel: "prefetch" }
      )
    );
  }
  function getNewMatchesForLinks(page, nextMatches, currentMatches, manifest, location, mode) {
    let isNew = (match, index) => {
      if (!currentMatches[index]) return true;
      return match.route.id !== currentMatches[index].route.id;
    };
    let matchPathChanged = (match, index) => {
      return (
        // param change, /users/123 -> /users/456
        currentMatches[index].pathname !== match.pathname || // splat param changed, which is not present in match.path
        // e.g. /files/images/avatar.jpg -> files/finances.xls
        currentMatches[index].route.path?.endsWith("*") && currentMatches[index].params["*"] !== match.params["*"]
      );
    };
    if (mode === "assets") {
      return nextMatches.filter(
        (match, index) => isNew(match, index) || matchPathChanged(match, index)
      );
    }
    if (mode === "data") {
      return nextMatches.filter((match, index) => {
        let manifestRoute = manifest.routes[match.route.id];
        if (!manifestRoute || !manifestRoute.hasLoader) {
          return false;
        }
        if (isNew(match, index) || matchPathChanged(match, index)) {
          return true;
        }
        if (match.route.shouldRevalidate) {
          let routeChoice = match.route.shouldRevalidate({
            currentUrl: new URL(
              location.pathname + location.search + location.hash,
              window.origin
            ),
            currentParams: currentMatches[0]?.params || {},
            nextUrl: new URL(page, window.origin),
            nextParams: match.params,
            defaultShouldRevalidate: true
          });
          if (typeof routeChoice === "boolean") {
            return routeChoice;
          }
        }
        return true;
      });
    }
    return [];
  }
  function getModuleLinkHrefs(matches, manifest, { includeHydrateFallback } = {}) {
    return dedupeHrefs(
      matches.map((match) => {
        let route = manifest.routes[match.route.id];
        if (!route) return [];
        let hrefs = [route.module];
        if (route.clientActionModule) {
          hrefs = hrefs.concat(route.clientActionModule);
        }
        if (route.clientLoaderModule) {
          hrefs = hrefs.concat(route.clientLoaderModule);
        }
        if (includeHydrateFallback && route.hydrateFallbackModule) {
          hrefs = hrefs.concat(route.hydrateFallbackModule);
        }
        if (route.imports) {
          hrefs = hrefs.concat(route.imports);
        }
        return hrefs;
      }).flat(1)
    );
  }
  function dedupeHrefs(hrefs) {
    return [...new Set(hrefs)];
  }
  function sortKeys(obj) {
    let sorted = {};
    let keys = Object.keys(obj).sort();
    for (let key of keys) {
      sorted[key] = obj[key];
    }
    return sorted;
  }
  function dedupeLinkDescriptors(descriptors, preloads) {
    let set = /* @__PURE__ */ new Set();
    let preloadsSet = new Set(preloads);
    return descriptors.reduce((deduped, descriptor) => {
      let alreadyModulePreload = preloads && !isPageLinkDescriptor(descriptor) && descriptor.as === "script" && descriptor.href && preloadsSet.has(descriptor.href);
      if (alreadyModulePreload) {
        return deduped;
      }
      let key = JSON.stringify(sortKeys(descriptor));
      if (!set.has(key)) {
        set.add(key);
        deduped.push({ key, link: descriptor });
      }
      return deduped;
    }, []);
  }
  function useDataRouterContext2() {
    let context = React8.useContext(DataRouterContext);
    invariant2(
      context,
      "You must render this element inside a <DataRouterContext.Provider> element"
    );
    return context;
  }
  function useDataRouterStateContext() {
    let context = React8.useContext(DataRouterStateContext);
    invariant2(
      context,
      "You must render this element inside a <DataRouterStateContext.Provider> element"
    );
    return context;
  }
  var FrameworkContext = React8.createContext(void 0);
  FrameworkContext.displayName = "FrameworkContext";
  function useFrameworkContext() {
    let context = React8.useContext(FrameworkContext);
    invariant2(
      context,
      "You must render this element inside a <HydratedRouter> element"
    );
    return context;
  }
  function usePrefetchBehavior(prefetch, theirElementProps) {
    let frameworkContext = React8.useContext(FrameworkContext);
    let [maybePrefetch, setMaybePrefetch] = React8.useState(false);
    let [shouldPrefetch, setShouldPrefetch] = React8.useState(false);
    let { onFocus, onBlur, onMouseEnter, onMouseLeave, onTouchStart } = theirElementProps;
    let ref = React8.useRef(null);
    React8.useEffect(() => {
      if (prefetch === "render") {
        setShouldPrefetch(true);
      }
      if (prefetch === "viewport") {
        let callback = (entries) => {
          entries.forEach((entry) => {
            setShouldPrefetch(entry.isIntersecting);
          });
        };
        let observer = new IntersectionObserver(callback, { threshold: 0.5 });
        if (ref.current) observer.observe(ref.current);
        return () => {
          observer.disconnect();
        };
      }
    }, [prefetch]);
    React8.useEffect(() => {
      if (maybePrefetch) {
        let id = setTimeout(() => {
          setShouldPrefetch(true);
        }, 100);
        return () => {
          clearTimeout(id);
        };
      }
    }, [maybePrefetch]);
    let setIntent = () => {
      setMaybePrefetch(true);
    };
    let cancelIntent = () => {
      setMaybePrefetch(false);
      setShouldPrefetch(false);
    };
    if (!frameworkContext) {
      return [false, ref, {}];
    }
    if (prefetch !== "intent") {
      return [shouldPrefetch, ref, {}];
    }
    return [
      shouldPrefetch,
      ref,
      {
        onFocus: composeEventHandlers(onFocus, setIntent),
        onBlur: composeEventHandlers(onBlur, cancelIntent),
        onMouseEnter: composeEventHandlers(onMouseEnter, setIntent),
        onMouseLeave: composeEventHandlers(onMouseLeave, cancelIntent),
        onTouchStart: composeEventHandlers(onTouchStart, setIntent)
      }
    ];
  }
  function composeEventHandlers(theirHandler, ourHandler) {
    return (event) => {
      theirHandler && theirHandler(event);
      if (!event.defaultPrevented) {
        ourHandler(event);
      }
    };
  }
  function PrefetchPageLinks({ page, ...linkProps }) {
    let rsc = useIsRSCRouterContext();
    let { router } = useDataRouterContext2();
    let matches = React8.useMemo(
      () => matchRoutes(router.routes, page, router.basename),
      [router.routes, page, router.basename]
    );
    if (!matches) {
      return null;
    }
    if (rsc) {
      return /* @__PURE__ */ React8.createElement(RSCPrefetchPageLinksImpl, { page, matches, ...linkProps });
    }
    return /* @__PURE__ */ React8.createElement(PrefetchPageLinksImpl, { page, matches, ...linkProps });
  }
  function useKeyedPrefetchLinks(matches) {
    let { manifest, routeModules } = useFrameworkContext();
    let [keyedPrefetchLinks, setKeyedPrefetchLinks] = React8.useState([]);
    React8.useEffect(() => {
      let interrupted = false;
      void getKeyedPrefetchLinks(matches, manifest, routeModules).then(
        (links) => {
          if (!interrupted) {
            setKeyedPrefetchLinks(links);
          }
        }
      );
      return () => {
        interrupted = true;
      };
    }, [matches, manifest, routeModules]);
    return keyedPrefetchLinks;
  }
  function RSCPrefetchPageLinksImpl({
    page,
    matches: nextMatches,
    ...linkProps
  }) {
    let location = useLocation();
    let { future } = useFrameworkContext();
    let { basename } = useDataRouterContext2();
    let dataHrefs = React8.useMemo(() => {
      if (page === location.pathname + location.search + location.hash) {
        return [];
      }
      let url = singleFetchUrl(
        page,
        basename,
        future.v8_trailingSlashAwareDataRequests,
        "rsc"
      );
      let hasSomeRoutesWithShouldRevalidate = false;
      let targetRoutes = [];
      for (let match of nextMatches) {
        if (typeof match.route.shouldRevalidate === "function") {
          hasSomeRoutesWithShouldRevalidate = true;
        } else {
          targetRoutes.push(match.route.id);
        }
      }
      if (hasSomeRoutesWithShouldRevalidate && targetRoutes.length > 0) {
        url.searchParams.set("_routes", targetRoutes.join(","));
      }
      return [url.pathname + url.search];
    }, [
      basename,
      future.v8_trailingSlashAwareDataRequests,
      page,
      location,
      nextMatches
    ]);
    return /* @__PURE__ */ React8.createElement(React8.Fragment, null, dataHrefs.map((href) => /* @__PURE__ */ React8.createElement("link", { key: href, rel: "prefetch", as: "fetch", href, ...linkProps })));
  }
  function PrefetchPageLinksImpl({
    page,
    matches: nextMatches,
    ...linkProps
  }) {
    let location = useLocation();
    let { future, manifest, routeModules } = useFrameworkContext();
    let { basename } = useDataRouterContext2();
    let { loaderData, matches } = useDataRouterStateContext();
    let newMatchesForData = React8.useMemo(
      () => getNewMatchesForLinks(
        page,
        nextMatches,
        matches,
        manifest,
        location,
        "data"
      ),
      [page, nextMatches, matches, manifest, location]
    );
    let newMatchesForAssets = React8.useMemo(
      () => getNewMatchesForLinks(
        page,
        nextMatches,
        matches,
        manifest,
        location,
        "assets"
      ),
      [page, nextMatches, matches, manifest, location]
    );
    let dataHrefs = React8.useMemo(() => {
      if (page === location.pathname + location.search + location.hash) {
        return [];
      }
      let routesParams = /* @__PURE__ */ new Set();
      let foundOptOutRoute = false;
      nextMatches.forEach((m) => {
        let manifestRoute = manifest.routes[m.route.id];
        if (!manifestRoute || !manifestRoute.hasLoader) {
          return;
        }
        if (!newMatchesForData.some((m2) => m2.route.id === m.route.id) && m.route.id in loaderData && routeModules[m.route.id]?.shouldRevalidate) {
          foundOptOutRoute = true;
        } else if (manifestRoute.hasClientLoader) {
          foundOptOutRoute = true;
        } else {
          routesParams.add(m.route.id);
        }
      });
      if (routesParams.size === 0) {
        return [];
      }
      let url = singleFetchUrl(
        page,
        basename,
        future.v8_trailingSlashAwareDataRequests,
        "data"
      );
      if (foundOptOutRoute && routesParams.size > 0) {
        url.searchParams.set(
          "_routes",
          nextMatches.filter((m) => routesParams.has(m.route.id)).map((m) => m.route.id).join(",")
        );
      }
      return [url.pathname + url.search];
    }, [
      basename,
      future.v8_trailingSlashAwareDataRequests,
      loaderData,
      location,
      manifest,
      newMatchesForData,
      nextMatches,
      page,
      routeModules
    ]);
    let moduleHrefs = React8.useMemo(
      () => getModuleLinkHrefs(newMatchesForAssets, manifest),
      [newMatchesForAssets, manifest]
    );
    let keyedPrefetchLinks = useKeyedPrefetchLinks(newMatchesForAssets);
    return /* @__PURE__ */ React8.createElement(React8.Fragment, null, dataHrefs.map((href) => /* @__PURE__ */ React8.createElement("link", { key: href, rel: "prefetch", as: "fetch", href, ...linkProps })), moduleHrefs.map((href) => /* @__PURE__ */ React8.createElement("link", { key: href, rel: "modulepreload", href, ...linkProps })), keyedPrefetchLinks.map(({ key, link }) => (
      // these don't spread `linkProps` because they are full link descriptors
      // already with their own props
      /* @__PURE__ */ React8.createElement(
        "link",
        {
          key,
          nonce: linkProps.nonce,
          ...link,
          crossOrigin: link.crossOrigin ?? linkProps.crossOrigin
        }
      )
    )));
  }
  function mergeRefs(...refs) {
    return (value) => {
      refs.forEach((ref) => {
        if (typeof ref === "function") {
          ref(value);
        } else if (ref != null) {
          ref.current = value;
        }
      });
    };
  }
  var isBrowser2 = typeof window !== "undefined" && typeof window.document !== "undefined" && typeof window.document.createElement !== "undefined";
  try {
    if (isBrowser2) {
      window.__reactRouterVersion = // @ts-expect-error
      "7.17.0";
    }
  } catch (e) {
  }
  function HistoryRouter({
    basename,
    children,
    history,
    useTransitions
  }) {
    let [state, setStateImpl] = React10.useState({
      action: history.action,
      location: history.location
    });
    let setState = React10.useCallback(
      (newState) => {
        if (useTransitions === false) {
          setStateImpl(newState);
        } else {
          React10.startTransition(() => setStateImpl(newState));
        }
      },
      [useTransitions]
    );
    React10.useLayoutEffect(() => history.listen(setState), [history, setState]);
    return /* @__PURE__ */ React10.createElement(
      Router,
      {
        basename,
        children,
        location: state.location,
        navigationType: state.action,
        navigator: history,
        useTransitions
      }
    );
  }
  HistoryRouter.displayName = "unstable_HistoryRouter";
  var ABSOLUTE_URL_REGEX2 = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
  var Link = React10.forwardRef(
    function LinkWithRef({
      onClick,
      discover = "render",
      prefetch = "none",
      relative,
      reloadDocument,
      replace: replace2,
      mask,
      state,
      target,
      to,
      preventScrollReset,
      viewTransition,
      defaultShouldRevalidate,
      ...rest
    }, forwardedRef) {
      let { basename, navigator, useTransitions } = React10.useContext(NavigationContext);
      let isAbsolute = typeof to === "string" && ABSOLUTE_URL_REGEX2.test(to);
      let parsed = parseToInfo(to, basename);
      to = parsed.to;
      let href = useHref(to, { relative });
      let location = useLocation();
      let maskedHref = null;
      if (mask) {
        let resolved = resolveTo(
          mask,
          [],
          location.mask ? location.mask.pathname : "/",
          true
        );
        if (basename !== "/") {
          resolved.pathname = resolved.pathname === "/" ? basename : joinPaths([basename, resolved.pathname]);
        }
        maskedHref = navigator.createHref(resolved);
      }
      let [shouldPrefetch, prefetchRef, prefetchHandlers] = usePrefetchBehavior(
        prefetch,
        rest
      );
      let internalOnClick = useLinkClickHandler(to, {
        replace: replace2,
        mask,
        state,
        target,
        preventScrollReset,
        relative,
        viewTransition,
        defaultShouldRevalidate,
        useTransitions
      });
      function handleClick(event) {
        if (onClick) onClick(event);
        if (!event.defaultPrevented) {
          internalOnClick(event);
        }
      }
      let isSpaLink = !(parsed.isExternal || reloadDocument);
      let link = (
        // eslint-disable-next-line jsx-a11y/anchor-has-content
        /* @__PURE__ */ React10.createElement(
          "a",
          {
            ...rest,
            ...prefetchHandlers,
            href: (isSpaLink ? maskedHref : void 0) || parsed.absoluteURL || href,
            onClick: isSpaLink ? handleClick : onClick,
            ref: mergeRefs(forwardedRef, prefetchRef),
            target,
            "data-discover": !isAbsolute && discover === "render" ? "true" : void 0
          }
        )
      );
      return shouldPrefetch && !isAbsolute ? /* @__PURE__ */ React10.createElement(React10.Fragment, null, link, /* @__PURE__ */ React10.createElement(PrefetchPageLinks, { page: href })) : link;
    }
  );
  Link.displayName = "Link";
  var NavLink = React10.forwardRef(
    function NavLinkWithRef({
      "aria-current": ariaCurrentProp = "page",
      caseSensitive = false,
      className: classNameProp = "",
      end = false,
      style: styleProp,
      to,
      viewTransition,
      children,
      ...rest
    }, ref) {
      let path = useResolvedPath(to, { relative: rest.relative });
      let location = useLocation();
      let routerState = React10.useContext(DataRouterStateContext);
      let { navigator, basename } = React10.useContext(NavigationContext);
      let isTransitioning = routerState != null && // Conditional usage is OK here because the usage of a data router is static
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useViewTransitionState(path) && viewTransition === true;
      let toPathname = navigator.encodeLocation ? navigator.encodeLocation(path).pathname : path.pathname;
      let locationPathname = location.pathname;
      let nextLocationPathname = routerState && routerState.navigation && routerState.navigation.location ? routerState.navigation.location.pathname : null;
      if (!caseSensitive) {
        locationPathname = locationPathname.toLowerCase();
        nextLocationPathname = nextLocationPathname ? nextLocationPathname.toLowerCase() : null;
        toPathname = toPathname.toLowerCase();
      }
      if (nextLocationPathname && basename) {
        nextLocationPathname = stripBasename(nextLocationPathname, basename) || nextLocationPathname;
      }
      const endSlashPosition = toPathname !== "/" && toPathname.endsWith("/") ? toPathname.length - 1 : toPathname.length;
      let isActive = locationPathname === toPathname || !end && locationPathname.startsWith(toPathname) && locationPathname.charAt(endSlashPosition) === "/";
      let isPending = nextLocationPathname != null && (nextLocationPathname === toPathname || !end && nextLocationPathname.startsWith(toPathname) && nextLocationPathname.charAt(toPathname.length) === "/");
      let renderProps = {
        isActive,
        isPending,
        isTransitioning
      };
      let ariaCurrent = isActive ? ariaCurrentProp : void 0;
      let className;
      if (typeof classNameProp === "function") {
        className = classNameProp(renderProps);
      } else {
        className = [
          classNameProp,
          isActive ? "active" : null,
          isPending ? "pending" : null,
          isTransitioning ? "transitioning" : null
        ].filter(Boolean).join(" ");
      }
      let style = typeof styleProp === "function" ? styleProp(renderProps) : styleProp;
      return /* @__PURE__ */ React10.createElement(
        Link,
        {
          ...rest,
          "aria-current": ariaCurrent,
          className,
          ref,
          style,
          to,
          viewTransition
        },
        typeof children === "function" ? children(renderProps) : children
      );
    }
  );
  NavLink.displayName = "NavLink";
  var Form = React10.forwardRef(
    ({
      discover = "render",
      fetcherKey,
      navigate,
      reloadDocument,
      replace: replace2,
      state,
      method = defaultMethod,
      action,
      onSubmit,
      relative,
      preventScrollReset,
      viewTransition,
      defaultShouldRevalidate,
      ...props
    }, forwardedRef) => {
      let { useTransitions } = React10.useContext(NavigationContext);
      let submit = useSubmit();
      let formAction = useFormAction(action, { relative });
      let formMethod = method.toLowerCase() === "get" ? "get" : "post";
      let isAbsolute = typeof action === "string" && ABSOLUTE_URL_REGEX2.test(action);
      let submitHandler = (event) => {
        onSubmit && onSubmit(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        let submitter = event.nativeEvent.submitter;
        let submitMethod = submitter?.getAttribute("formmethod") || method;
        let doSubmit = () => submit(submitter || event.currentTarget, {
          fetcherKey,
          method: submitMethod,
          navigate,
          replace: replace2,
          state,
          relative,
          preventScrollReset,
          viewTransition,
          defaultShouldRevalidate
        });
        if (useTransitions && navigate !== false) {
          React10.startTransition(() => doSubmit());
        } else {
          doSubmit();
        }
      };
      return /* @__PURE__ */ React10.createElement(
        "form",
        {
          ref: forwardedRef,
          method: formMethod,
          action: formAction,
          onSubmit: reloadDocument ? onSubmit : submitHandler,
          ...props,
          "data-discover": !isAbsolute && discover === "render" ? "true" : void 0
        }
      );
    }
  );
  Form.displayName = "Form";
  function ScrollRestoration({
    getKey,
    storageKey,
    ...props
  }) {
    let remixContext = React10.useContext(FrameworkContext);
    let { basename } = React10.useContext(NavigationContext);
    let location = useLocation();
    let matches = useMatches();
    useScrollRestoration({ getKey, storageKey });
    let ssrKey = React10.useMemo(
      () => {
        if (!remixContext || !getKey) return null;
        let userKey = getScrollRestorationKey(
          location,
          matches,
          basename,
          getKey
        );
        return userKey !== location.key ? userKey : null;
      },
      // Nah, we only need this the first time for the SSR render
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    );
    if (!remixContext || remixContext.isSpaMode) {
      return null;
    }
    let restoreScroll = ((storageKey2, restoreKey) => {
      if (!window.history.state || !window.history.state.key) {
        let key = Math.random().toString(32).slice(2);
        window.history.replaceState({ key }, "");
      }
      try {
        let positions = JSON.parse(sessionStorage.getItem(storageKey2) || "{}");
        let storedY = positions[restoreKey || window.history.state.key];
        if (typeof storedY === "number") {
          window.scrollTo(0, storedY);
        }
      } catch (error) {
        console.error(error);
        sessionStorage.removeItem(storageKey2);
      }
    }).toString();
    return /* @__PURE__ */ React10.createElement(
      "script",
      {
        ...props,
        suppressHydrationWarning: true,
        dangerouslySetInnerHTML: {
          __html: `(${restoreScroll})(${escapeHtml(
            JSON.stringify(storageKey || SCROLL_RESTORATION_STORAGE_KEY)
          )}, ${escapeHtml(JSON.stringify(ssrKey))})`
        }
      }
    );
  }
  ScrollRestoration.displayName = "ScrollRestoration";
  function getDataRouterConsoleError2(hookName) {
    return `${hookName} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
  }
  function useDataRouterContext3(hookName) {
    let ctx = React10.useContext(DataRouterContext);
    invariant(ctx, getDataRouterConsoleError2(hookName));
    return ctx;
  }
  function useDataRouterState2(hookName) {
    let state = React10.useContext(DataRouterStateContext);
    invariant(state, getDataRouterConsoleError2(hookName));
    return state;
  }
  function useLinkClickHandler(to, {
    target,
    replace: replaceProp,
    mask,
    state,
    preventScrollReset,
    relative,
    viewTransition,
    defaultShouldRevalidate,
    useTransitions
  } = {}) {
    let navigate = useNavigate();
    let location = useLocation();
    let path = useResolvedPath(to, { relative });
    return React10.useCallback(
      (event) => {
        if (shouldProcessLinkClick(event, target)) {
          event.preventDefault();
          let replace2 = replaceProp !== void 0 ? replaceProp : createPath(location) === createPath(path);
          let doNavigate = () => navigate(to, {
            replace: replace2,
            mask,
            state,
            preventScrollReset,
            relative,
            viewTransition,
            defaultShouldRevalidate
          });
          if (useTransitions) {
            React10.startTransition(() => doNavigate());
          } else {
            doNavigate();
          }
        }
      },
      [
        location,
        navigate,
        path,
        replaceProp,
        mask,
        state,
        target,
        to,
        preventScrollReset,
        relative,
        viewTransition,
        defaultShouldRevalidate,
        useTransitions
      ]
    );
  }
  var fetcherId = 0;
  var getUniqueFetcherId = () => `__${String(++fetcherId)}__`;
  function useSubmit() {
    let { router } = useDataRouterContext3(
      "useSubmit"
      /* UseSubmit */
    );
    let { basename } = React10.useContext(NavigationContext);
    let currentRouteId = useRouteId();
    let routerFetch = router.fetch;
    let routerNavigate = router.navigate;
    return React10.useCallback(
      async (target, options = {}) => {
        let { action, method, encType, formData, body } = getFormSubmissionInfo(
          target,
          basename
        );
        if (options.navigate === false) {
          let key = options.fetcherKey || getUniqueFetcherId();
          await routerFetch(key, currentRouteId, options.action || action, {
            defaultShouldRevalidate: options.defaultShouldRevalidate,
            preventScrollReset: options.preventScrollReset,
            formData,
            body,
            formMethod: options.method || method,
            formEncType: options.encType || encType,
            flushSync: options.flushSync
          });
        } else {
          await routerNavigate(options.action || action, {
            defaultShouldRevalidate: options.defaultShouldRevalidate,
            preventScrollReset: options.preventScrollReset,
            formData,
            body,
            formMethod: options.method || method,
            formEncType: options.encType || encType,
            replace: options.replace,
            state: options.state,
            fromRouteId: currentRouteId,
            flushSync: options.flushSync,
            viewTransition: options.viewTransition
          });
        }
      },
      [routerFetch, routerNavigate, basename, currentRouteId]
    );
  }
  function useFormAction(action, { relative } = {}) {
    let { basename } = React10.useContext(NavigationContext);
    let routeContext = React10.useContext(RouteContext);
    invariant(routeContext, "useFormAction must be used inside a RouteContext");
    let [match] = routeContext.matches.slice(-1);
    let path = { ...useResolvedPath(action ? action : ".", { relative }) };
    let location = useLocation();
    if (action == null) {
      path.search = location.search;
      let params = new URLSearchParams(path.search);
      let indexValues = params.getAll("index");
      let hasNakedIndexParam = indexValues.some((v) => v === "");
      if (hasNakedIndexParam) {
        params.delete("index");
        indexValues.filter((v) => v).forEach((v) => params.append("index", v));
        let qs = params.toString();
        path.search = qs ? `?${qs}` : "";
      }
    }
    if ((!action || action === ".") && match.route.index) {
      path.search = path.search ? path.search.replace(/^\?/, "?index&") : "?index";
    }
    if (basename !== "/") {
      path.pathname = path.pathname === "/" ? basename : joinPaths([basename, path.pathname]);
    }
    return createPath(path);
  }
  var SCROLL_RESTORATION_STORAGE_KEY = "react-router-scroll-positions";
  var savedScrollPositions = {};
  function getScrollRestorationKey(location, matches, basename, getKey) {
    let key = null;
    if (getKey) {
      if (basename !== "/") {
        key = getKey(
          {
            ...location,
            pathname: stripBasename(location.pathname, basename) || location.pathname
          },
          matches
        );
      } else {
        key = getKey(location, matches);
      }
    }
    if (key == null) {
      key = location.key;
    }
    return key;
  }
  function useScrollRestoration({
    getKey,
    storageKey
  } = {}) {
    let { router } = useDataRouterContext3(
      "useScrollRestoration"
      /* UseScrollRestoration */
    );
    let { restoreScrollPosition, preventScrollReset } = useDataRouterState2(
      "useScrollRestoration"
      /* UseScrollRestoration */
    );
    let { basename } = React10.useContext(NavigationContext);
    let location = useLocation();
    let matches = useMatches();
    let navigation = useNavigation();
    React10.useEffect(() => {
      window.history.scrollRestoration = "manual";
      return () => {
        window.history.scrollRestoration = "auto";
      };
    }, []);
    usePageHide(
      React10.useCallback(() => {
        if (navigation.state === "idle") {
          let key = getScrollRestorationKey(location, matches, basename, getKey);
          savedScrollPositions[key] = window.scrollY;
        }
        try {
          sessionStorage.setItem(
            storageKey || SCROLL_RESTORATION_STORAGE_KEY,
            JSON.stringify(savedScrollPositions)
          );
        } catch (error) {
          warning(
            false,
            `Failed to save scroll positions in sessionStorage, <ScrollRestoration /> will not work properly (${error}).`
          );
        }
        window.history.scrollRestoration = "auto";
      }, [navigation.state, getKey, basename, location, matches, storageKey])
    );
    if (typeof document !== "undefined") {
      React10.useLayoutEffect(() => {
        try {
          let sessionPositions = sessionStorage.getItem(
            storageKey || SCROLL_RESTORATION_STORAGE_KEY
          );
          if (sessionPositions) {
            savedScrollPositions = JSON.parse(sessionPositions);
          }
        } catch (e) {
        }
      }, [storageKey]);
      React10.useLayoutEffect(() => {
        let disableScrollRestoration = router?.enableScrollRestoration(
          savedScrollPositions,
          () => window.scrollY,
          getKey ? (location2, matches2) => getScrollRestorationKey(location2, matches2, basename, getKey) : void 0
        );
        return () => disableScrollRestoration && disableScrollRestoration();
      }, [router, basename, getKey]);
      React10.useLayoutEffect(() => {
        if (restoreScrollPosition === false) {
          return;
        }
        if (typeof restoreScrollPosition === "number") {
          window.scrollTo(0, restoreScrollPosition);
          return;
        }
        try {
          if (location.hash) {
            let el = document.getElementById(
              decodeURIComponent(location.hash.slice(1))
            );
            if (el) {
              el.scrollIntoView();
              return;
            }
          }
        } catch {
          warning(
            false,
            `"${location.hash.slice(
              1
            )}" is not a decodable element ID. The view will not scroll to it.`
          );
        }
        if (preventScrollReset === true) {
          return;
        }
        window.scrollTo(0, 0);
      }, [location, restoreScrollPosition, preventScrollReset]);
    }
  }
  function usePageHide(callback, options) {
    let { capture } = options || {};
    React10.useEffect(() => {
      let opts = capture != null ? { capture } : void 0;
      window.addEventListener("pagehide", callback, opts);
      return () => {
        window.removeEventListener("pagehide", callback, opts);
      };
    }, [callback, capture]);
  }
  function useViewTransitionState(to, { relative } = {}) {
    let vtContext = React10.useContext(ViewTransitionContext);
    invariant(
      vtContext != null,
      "`useViewTransitionState` must be used within `react-router-dom`'s `RouterProvider`.  Did you accidentally import `RouterProvider` from `react-router`?"
    );
    let { basename } = useDataRouterContext3(
      "useViewTransitionState"
      /* useViewTransitionState */
    );
    let path = useResolvedPath(to, { relative });
    if (!vtContext.isTransitioning) {
      return false;
    }
    let currentPath = stripBasename(vtContext.currentLocation.pathname, basename) || vtContext.currentLocation.pathname;
    let nextPath = stripBasename(vtContext.nextLocation.pathname, basename) || vtContext.nextLocation.pathname;
    return matchPath(path.pathname, nextPath) != null || matchPath(path.pathname, currentPath) != null;
  }

  // node_modules/react-router/dist/development/index.mjs
  init_define_import_meta_env();

  // src/data/spots/tampa-bay.ts
  init_define_import_meta_env();

  // src/data/spot-media/tampa-bay.ts
  init_define_import_meta_env();
  var SPOT_MEDIA = {
    "bayshore-boulevard": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Skyline_of_Tampa%2C_Florida_from_Bayshore_Blvd.jpg/1280px-Skyline_of_Tampa%2C_Florida_from_Bayshore_Blvd.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Skyline_of_Tampa%2C_Florida_from_Bayshore_Blvd.jpg/500px-Skyline_of_Tampa%2C_Florida_from_Bayshore_Blvd.jpg",
        "caption": "Downtown skyline beyond the curving balustrade",
        "credit": "Original uploader was user:Tampa Gator at en.wikipedia",
        "license": "Public domain",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ASkyline_of_Tampa%2C_Florida_from_Bayshore_Blvd.jpg",
        "light": "daytime",
        "camera": "Nikon E885",
        "focalLengthMm": 8,
        "fNumber": 7.6,
        "shutter": "1/289",
        "iso": 100
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Tampa_Bayshore_Blvd_looking_north01.jpg/1280px-Tampa_Bayshore_Blvd_looking_north01.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Tampa_Bayshore_Blvd_looking_north01.jpg/500px-Tampa_Bayshore_Blvd_looking_north01.jpg",
        "caption": "WPA balustrade leading down the bayfront path",
        "credit": "Ebyabe",
        "license": "CC BY 2.5",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ATampa_Bayshore_Blvd_looking_north01.jpg",
        "light": "daytime",
        "camera": "Eastman Kodak C875",
        "focalLengthMm": 7.8,
        "fNumber": 4,
        "shutter": "1/640",
        "iso": 64
      }
    ],
    "ballast-point-park": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/View_of_Downtown_Tampa_from_the_Pier_at_Ballast_Point_Park.JPG/1280px-View_of_Downtown_Tampa_from_the_Pier_at_Ballast_Point_Park.JPG",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/View_of_Downtown_Tampa_from_the_Pier_at_Ballast_Point_Park.JPG/500px-View_of_Downtown_Tampa_from_the_Pier_at_Ballast_Point_Park.JPG",
        "caption": "Downtown skyline across the bay",
        "credit": "Heditor6",
        "license": "CC BY-SA 3.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AView_of_Downtown_Tampa_from_the_Pier_at_Ballast_Point_Park.JPG",
        "light": "daytime",
        "camera": "Canon PowerShot S3 IS",
        "focalLengthMm": 19,
        "fNumber": 8,
        "shutter": "1/250"
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Fishing_Pier_at_Ballast_Point_Park.JPG/1280px-Fishing_Pier_at_Ballast_Point_Park.JPG",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Fishing_Pier_at_Ballast_Point_Park.JPG/500px-Fishing_Pier_at_Ballast_Point_Park.JPG",
        "caption": "Fishing pier leading into stormy bay",
        "credit": "Heditor6",
        "license": "CC BY-SA 3.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AFishing_Pier_at_Ballast_Point_Park.JPG",
        "light": "daytime",
        "camera": "Canon PowerShot S3 IS",
        "focalLengthMm": 7.6,
        "fNumber": 4.5,
        "shutter": "1/2000"
      }
    ],
    "davis-islands-beach": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Davis_Islands%2CTampa%2CFlorida%2CUSA._-_panoramio.jpg/1280px-Davis_Islands%2CTampa%2CFlorida%2CUSA._-_panoramio.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Davis_Islands%2CTampa%2CFlorida%2CUSA._-_panoramio.jpg/500px-Davis_Islands%2CTampa%2CFlorida%2CUSA._-_panoramio.jpg",
        "caption": "Moored sailboats with skyline backdrop over basin",
        "credit": "Roman Eugeniusz",
        "license": "CC BY-SA 3.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ADavis_Islands%2CTampa%2CFlorida%2CUSA._-_panoramio.jpg",
        "light": "evening-golden",
        "camera": "Nikon D5100",
        "focalLengthMm": 125,
        "fNumber": 8,
        "shutter": "1/250",
        "iso": 110
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Davis_Islands%2CTampa%2CFlorida%2CUSA._-_panoramio_%281%29.jpg/1280px-Davis_Islands%2CTampa%2CFlorida%2CUSA._-_panoramio_%281%29.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Davis_Islands%2CTampa%2CFlorida%2CUSA._-_panoramio_%281%29.jpg/500px-Davis_Islands%2CTampa%2CFlorida%2CUSA._-_panoramio_%281%29.jpg",
        "caption": "Yacht basin and downtown skyline beyond",
        "credit": "Roman Eugeniusz",
        "license": "CC BY-SA 3.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ADavis_Islands%2CTampa%2CFlorida%2CUSA._-_panoramio_(1).jpg",
        "light": "daytime",
        "camera": "Nikon D5100",
        "focalLengthMm": 48,
        "fNumber": 8,
        "shutter": "1/250",
        "iso": 180
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/0/04/Summer_Storm_rolling_behind_downtown_Tampa_from_Davis_Island.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Summer_Storm_rolling_behind_downtown_Tampa_from_Davis_Island.jpg/500px-Summer_Storm_rolling_behind_downtown_Tampa_from_Davis_Island.jpg",
        "caption": "Tampa skyline across the bay, stormy sky",
        "credit": "Robert Neff",
        "license": "CC BY 2.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ASummer_Storm_rolling_behind_downtown_Tampa_from_Davis_Island.jpg",
        "light": "daytime",
        "camera": "Nikon D7000",
        "focalLengthMm": 24,
        "fNumber": 5,
        "shutter": "1/100",
        "iso": 400
      }
    ],
    "curtis-hixon-waterfront-park": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Curtis_Hixon_Park_Tampa_Florida_United_States_-_panoramio_%282%29.jpg/1280px-Curtis_Hixon_Park_Tampa_Florida_United_States_-_panoramio_%282%29.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Curtis_Hixon_Park_Tampa_Florida_United_States_-_panoramio_%282%29.jpg/500px-Curtis_Hixon_Park_Tampa_Florida_United_States_-_panoramio_%282%29.jpg",
        "caption": "Fountains and skyline glowing at blue hour",
        "credit": "Michelle Maria",
        "license": "CC BY 3.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ACurtis_Hixon_Park_Tampa_Florida_United_States_-_panoramio_(2).jpg",
        "light": "blue-hour",
        "camera": "Samsung Galaxy Nexus",
        "focalLengthMm": 3.4,
        "fNumber": 2.8,
        "shutter": "1/8"
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Curtis_Hixon_Park_Tampa_Florida_United_States_-_panoramio_%281%29.jpg/1280px-Curtis_Hixon_Park_Tampa_Florida_United_States_-_panoramio_%281%29.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Curtis_Hixon_Park_Tampa_Florida_United_States_-_panoramio_%281%29.jpg/500px-Curtis_Hixon_Park_Tampa_Florida_United_States_-_panoramio_%281%29.jpg",
        "caption": "Downtown towers and palms at dusk",
        "credit": "Michelle Maria",
        "license": "CC BY 3.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ACurtis_Hixon_Park_Tampa_Florida_United_States_-_panoramio_(1).jpg",
        "light": "blue-hour",
        "camera": "Samsung Galaxy Nexus",
        "focalLengthMm": 3.4,
        "fNumber": 2.8,
        "shutter": "1/15"
      }
    ],
    "tampa-riverwalk": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Tampa_Riverwalk_01.jpg/1280px-Tampa_Riverwalk_01.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Tampa_Riverwalk_01.jpg/500px-Tampa_Riverwalk_01.jpg",
        "caption": "Lit Riverwalk path leading to glowing skyline",
        "credit": "Miosotis Jade",
        "license": "CC BY-SA 4.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ATampa_Riverwalk_01.jpg",
        "light": "blue-hour",
        "camera": "Canon PowerShot SX130 IS",
        "focalLengthMm": 8.7,
        "fNumber": 8,
        "shutter": "1.6",
        "iso": 200
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Tampa_Riverwalk_03.jpg/1280px-Tampa_Riverwalk_03.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Tampa_Riverwalk_03.jpg/500px-Tampa_Riverwalk_03.jpg",
        "caption": "Skyline mirrored in the river at dusk",
        "credit": "Miosotis Jade",
        "license": "CC BY-SA 4.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ATampa_Riverwalk_03.jpg",
        "light": "blue-hour",
        "camera": "Canon PowerShot SX130 IS",
        "focalLengthMm": 5,
        "fNumber": 8,
        "shutter": "5",
        "iso": 200
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Tampa_Riverwalk_02.jpg/1280px-Tampa_Riverwalk_02.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Tampa_Riverwalk_02.jpg/500px-Tampa_Riverwalk_02.jpg",
        "caption": "Downtown towers reflected across the river",
        "credit": "Miosotis Jade",
        "license": "CC BY-SA 4.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ATampa_Riverwalk_02.jpg",
        "light": "blue-hour",
        "camera": "Canon PowerShot SX130 IS",
        "focalLengthMm": 5,
        "fNumber": 8,
        "shutter": "3.2",
        "iso": 200
      }
    ],
    "plant-park-ut-minarets": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Old_Tampa_Bay_Hotel_spire04.jpg/1280px-Old_Tampa_Bay_Hotel_spire04.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Old_Tampa_Bay_Hotel_spire04.jpg/500px-Old_Tampa_Bay_Hotel_spire04.jpg",
        "caption": "Silver minaret dome against vivid blue sky",
        "credit": "Ebyabe",
        "license": "CC BY 2.5",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AOld_Tampa_Bay_Hotel_spire04.jpg",
        "light": "daytime",
        "camera": "Eastman Kodak C875",
        "focalLengthMm": 24,
        "fNumber": 5,
        "shutter": "1/800",
        "iso": 64
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/e/ee/Tampa_Bay_Hotel_2.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/e/ee/Tampa_Bay_Hotel_2.jpg",
        "caption": "Golden domes and palm at dusk",
        "credit": "Zeng8r at English Wikipedia",
        "license": "CC BY-SA 3.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ATampa_Bay_Hotel_2.jpg",
        "light": "evening-golden",
        "camera": "Olympus X550,D545Z,C480Z",
        "focalLengthMm": 13,
        "fNumber": 4,
        "shutter": "1/200",
        "iso": 50
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Old_Tampa_Bay_Hotel_spire02.jpg/1280px-Old_Tampa_Bay_Hotel_spire02.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Old_Tampa_Bay_Hotel_spire02.jpg/500px-Old_Tampa_Bay_Hotel_spire02.jpg",
        "caption": "Three silver minarets above brick facade",
        "credit": "Ebyabe",
        "license": "CC BY 2.5",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AOld_Tampa_Bay_Hotel_spire02.jpg",
        "light": "daytime",
        "camera": "Eastman Kodak C875",
        "focalLengthMm": 15,
        "fNumber": 4.5,
        "shutter": "1/500",
        "iso": 64
      }
    ],
    "henry-b-plant-museum": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Old_Tampa_Bay_Hotel.jpg/1280px-Old_Tampa_Bay_Hotel.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Old_Tampa_Bay_Hotel.jpg/500px-Old_Tampa_Bay_Hotel.jpg",
        "caption": "Moorish minarets over brick facade and gardens",
        "credit": "Ebyabe",
        "license": "CC BY 2.5",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AOld_Tampa_Bay_Hotel.jpg",
        "light": "daytime",
        "camera": "Eastman Kodak C875",
        "focalLengthMm": 7.8,
        "fNumber": 2.8,
        "shutter": "1/640",
        "iso": 64
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Henry_B_Plant_Museum.jpg/1280px-Henry_B_Plant_Museum.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Henry_B_Plant_Museum.jpg/500px-Henry_B_Plant_Museum.jpg",
        "caption": "Silver minaret towers framed by palms",
        "credit": "Tsya 42",
        "license": "CC BY-SA 4.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AHenry_B_Plant_Museum.jpg",
        "light": "evening-golden",
        "camera": "Nikon Coolpix S9900",
        "focalLengthMm": 5.2,
        "fNumber": 3.7,
        "shutter": "1/500",
        "iso": 125
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Henry_Plant_Museum_Fletcher_Lounge_ballroom_rotunda.jpg/1280px-Henry_Plant_Museum_Fletcher_Lounge_ballroom_rotunda.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Henry_Plant_Museum_Fletcher_Lounge_ballroom_rotunda.jpg/500px-Henry_Plant_Museum_Fletcher_Lounge_ballroom_rotunda.jpg",
        "caption": "Ornate Gilded-Age rotunda dome ceiling",
        "credit": "PeaceLoveHarmony",
        "license": "CC BY-SA 4.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AHenry_Plant_Museum_Fletcher_Lounge_ballroom_rotunda.jpg",
        "light": "daytime",
        "camera": "samsung SM-G930VL",
        "focalLengthMm": 4.2,
        "fNumber": 1.7,
        "shutter": "1/60",
        "iso": 160
      }
    ],
    "sacred-heart-catholic-church": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/9/92/Tampa_Sacred_Heart_Church04.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Tampa_Sacred_Heart_Church04.jpg/500px-Tampa_Sacred_Heart_Church04.jpg",
        "caption": "Marble facade and rose window against clouds",
        "credit": "Ebyabe",
        "license": "CC BY 2.5",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ATampa_Sacred_Heart_Church04.jpg",
        "light": "daytime"
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Interior_Sacred_Heart_Catholic_Church%2C_Tampa%2C_Florida.jpg/1280px-Interior_Sacred_Heart_Catholic_Church%2C_Tampa%2C_Florida.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Interior_Sacred_Heart_Catholic_Church%2C_Tampa%2C_Florida.jpg/500px-Interior_Sacred_Heart_Catholic_Church%2C_Tampa%2C_Florida.jpg",
        "caption": "Ornate nave and marble columns to altar",
        "credit": "Boston Public Library",
        "license": "CC BY 2.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AInterior_Sacred_Heart_Catholic_Church%2C_Tampa%2C_Florida.jpg",
        "camera": "Epson Exp10000XL10000"
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Tampa_Sacred_Heart_Church06.jpg/1280px-Tampa_Sacred_Heart_Church06.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Tampa_Sacred_Heart_Church06.jpg/500px-Tampa_Sacred_Heart_Church06.jpg",
        "caption": "Front-quarter view with dome on Florida Ave",
        "credit": "Ebyabe",
        "license": "CC BY-SA 3.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ATampa_Sacred_Heart_Church06.jpg",
        "light": "daytime",
        "camera": "Eastman Kodak Easyshare C195",
        "focalLengthMm": 5.9,
        "fNumber": 8,
        "shutter": "1/160",
        "iso": 64
      }
    ],
    "tampa-theatre": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Tampa_Theatre_2013.jpg/1280px-Tampa_Theatre_2013.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Tampa_Theatre_2013.jpg/500px-Tampa_Theatre_2013.jpg",
        "caption": "Neon marquee and blade sign glowing at night",
        "credit": "MarieG33",
        "license": "CC BY-SA 3.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ATampa_Theatre_2013.jpg",
        "light": "night-astro",
        "camera": "Nikon D60",
        "focalLengthMm": 18,
        "fNumber": 3.5,
        "shutter": "1/15",
        "iso": 400
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/TampaTheatre_front05.jpg/1280px-TampaTheatre_front05.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/TampaTheatre_front05.jpg/500px-TampaTheatre_front05.jpg",
        "caption": "Iconic vertical TAMPA blade sign from below",
        "credit": "Ebyabe",
        "license": "CC BY 2.5",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ATampaTheatre_front05.jpg",
        "light": "daytime",
        "camera": "Eastman Kodak C875",
        "focalLengthMm": 7.8,
        "fNumber": 2.8,
        "shutter": "1/100",
        "iso": 64
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/a/a4/TampaTheatre01.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/TampaTheatre01.jpg/500px-TampaTheatre01.jpg",
        "caption": "Marquee and office building with palms",
        "credit": "Ebyabe",
        "license": "CC BY 2.5",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ATampaTheatre01.jpg",
        "light": "daytime"
      }
    ],
    "ybor-city": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/White_tower_in_Ybor_City%2C_Tampa_Florida.jpg/1280px-White_tower_in_Ybor_City%2C_Tampa_Florida.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/White_tower_in_Ybor_City%2C_Tampa_Florida.jpg/500px-White_tower_in_Ybor_City%2C_Tampa_Florida.jpg",
        "caption": "Historic corner building with green-tiled tower",
        "credit": "psyberartist",
        "license": "CC BY 2.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AWhite_tower_in_Ybor_City%2C_Tampa_Florida.jpg",
        "light": "daytime",
        "camera": "Canon Eos 6D",
        "focalLengthMm": 62,
        "fNumber": 22,
        "shutter": "1/160",
        "iso": 400
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Centro_Ybor%2C_Ybor_City%2C_Tampa%2C_Florida.jpg/1280px-Centro_Ybor%2C_Ybor_City%2C_Tampa%2C_Florida.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Centro_Ybor%2C_Ybor_City%2C_Tampa%2C_Florida.jpg/500px-Centro_Ybor%2C_Ybor_City%2C_Tampa%2C_Florida.jpg",
        "caption": "Centro Ybor facade with vintage streetcar",
        "credit": "Peter K Burian",
        "license": "CC BY-SA 4.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ACentro_Ybor%2C_Ybor_City%2C_Tampa%2C_Florida.jpg",
        "light": "daytime",
        "camera": "Nikon D800",
        "focalLengthMm": 38,
        "fNumber": 4,
        "shutter": "1/1250",
        "iso": 500
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Ybor_City_Museum_State_Park%2C_Tampa%2C_Florida.jpg/1280px-Ybor_City_Museum_State_Park%2C_Tampa%2C_Florida.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Ybor_City_Museum_State_Park%2C_Tampa%2C_Florida.jpg/500px-Ybor_City_Museum_State_Park%2C_Tampa%2C_Florida.jpg",
        "caption": "Yellow-brick Ybor City Museum with flags",
        "credit": "Peter K Burian",
        "license": "CC BY-SA 4.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AYbor_City_Museum_State_Park%2C_Tampa%2C_Florida.jpg",
        "light": "daytime",
        "camera": "Nikon D800",
        "focalLengthMm": 40,
        "fNumber": 6.3,
        "shutter": "1/400",
        "iso": 400
      }
    ],
    "lettuce-lake-park": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Great_Blue_Heron_%2849111167428%29.jpg/1280px-Great_Blue_Heron_%2849111167428%29.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Great_Blue_Heron_%2849111167428%29.jpg/500px-Great_Blue_Heron_%2849111167428%29.jpg",
        "caption": "Great blue heron perched over still water",
        "credit": "Trish Hartmann from Tampa, Florida, USA",
        "license": "CC BY 2.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AGreat_Blue_Heron_(49111167428).jpg",
        "light": "morning-golden",
        "camera": "Nikon D850",
        "focalLengthMm": 300,
        "fNumber": 5.6,
        "shutter": "1/750",
        "iso": 160
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Kayaking_on_the_Hillsborough_River.jpg/1280px-Kayaking_on_the_Hillsborough_River.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Kayaking_on_the_Hillsborough_River.jpg/500px-Kayaking_on_the_Hillsborough_River.jpg",
        "caption": "Cypress and palm mirrored in calm river",
        "credit": "Mwanner",
        "license": "CC BY-SA 3.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AKayaking_on_the_Hillsborough_River.jpg",
        "light": "daytime"
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Barred_Owl_at_Lettuce_Lake_%2812735495095%29.jpg/1280px-Barred_Owl_at_Lettuce_Lake_%2812735495095%29.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Barred_Owl_at_Lettuce_Lake_%2812735495095%29.jpg/500px-Barred_Owl_at_Lettuce_Lake_%2812735495095%29.jpg",
        "caption": "Barred owl on a mossy branch",
        "credit": "Trish Hartmann from Tampa, Florida, USA",
        "license": "CC BY 2.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ABarred_Owl_at_Lettuce_Lake_(12735495095).jpg",
        "light": "open-shade",
        "camera": "Nikon D5100",
        "focalLengthMm": 200,
        "fNumber": 5.6,
        "shutter": "1/320",
        "iso": 400
      }
    ],
    "usf-botanical-gardens": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Dyckia_Red2_USF_Asit.jpg/1280px-Dyckia_Red2_USF_Asit.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Dyckia_Red2_USF_Asit.jpg/500px-Dyckia_Red2_USF_Asit.jpg",
        "caption": "Vivid red bromeliad rosette, exotic collection",
        "credit": "Asit K. Ghosh Thaumaturgist",
        "license": "CC BY-SA 3.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ADyckia_Red2_USF_Asit.jpg",
        "light": "daytime",
        "camera": "Sony DSC-H9",
        "focalLengthMm": 6.8,
        "fNumber": 4,
        "shutter": "1/200",
        "iso": 100
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/BalsamPear02_USF_Asit.JPG/1280px-BalsamPear02_USF_Asit.JPG",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/BalsamPear02_USF_Asit.JPG/500px-BalsamPear02_USF_Asit.JPG",
        "caption": "Backlit orange fruit glowing in foliage",
        "credit": "asitkghosh@yahoo.com Thaumaturgist",
        "license": "CC BY-SA 3.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ABalsamPear02_USF_Asit.JPG",
        "light": "daytime",
        "camera": "Sony DSC-H9",
        "focalLengthMm": 19,
        "fNumber": 4.5,
        "shutter": "1/500",
        "iso": 100
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/BalsamPear04_USF_Asit.JPG/1280px-BalsamPear04_USF_Asit.JPG",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/BalsamPear04_USF_Asit.JPG/500px-BalsamPear04_USF_Asit.JPG",
        "caption": "Bright orange bloom among lush greenery",
        "credit": "asitkghosh@yahoo.com Thaumaturgist",
        "license": "CC BY-SA 3.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ABalsamPear04_USF_Asit.JPG",
        "light": "daytime",
        "camera": "Sony DSC-H9",
        "focalLengthMm": 14,
        "fNumber": 4.5,
        "shutter": "1/400",
        "iso": 100
      }
    ],
    "sunken-gardens": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/0/09/Coy_pond_at_the_entrance_to_the_Sunken_Gardens-_St._Petersburg%2C_Florida_%288527270077%29.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Coy_pond_at_the_entrance_to_the_Sunken_Gardens-_St._Petersburg%2C_Florida_%288527270077%29.jpg/500px-Coy_pond_at_the_entrance_to_the_Sunken_Gardens-_St._Petersburg%2C_Florida_%288527270077%29.jpg",
        "caption": "Grotto waterfall over koi-and-lily pond",
        "credit": "Florida Memory",
        "license": "Public domain",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ACoy_pond_at_the_entrance_to_the_Sunken_Gardens-_St._Petersburg%2C_Florida_(8527270077).jpg",
        "light": "daytime"
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/3/35/Scarlet_Ibis_at_Sunken_Gardens-_St._Petersburg%2C_Florida_%288528405744%29.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Scarlet_Ibis_at_Sunken_Gardens-_St._Petersburg%2C_Florida_%288528405744%29.jpg/500px-Scarlet_Ibis_at_Sunken_Gardens-_St._Petersburg%2C_Florida_%288528405744%29.jpg",
        "caption": "Scarlet ibis portrait in soft shade",
        "credit": "Florida Memory",
        "license": "Public domain",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AScarlet_Ibis_at_Sunken_Gardens-_St._Petersburg%2C_Florida_(8528405744).jpg",
        "light": "open-shade"
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/St._Petersburg_FL_Sunken_Gardens_gate01.jpg/1280px-St._Petersburg_FL_Sunken_Gardens_gate01.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/St._Petersburg_FL_Sunken_Gardens_gate01.jpg/500px-St._Petersburg_FL_Sunken_Gardens_gate01.jpg",
        "caption": "Gate framed by bougainvillea and palms",
        "credit": "Ebyabe",
        "license": "CC BY-SA 3.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ASt._Petersburg_FL_Sunken_Gardens_gate01.jpg",
        "light": "open-shade",
        "camera": "Eastman Kodak Easyshare C195",
        "focalLengthMm": 5.9,
        "fNumber": 3.3,
        "shutter": "1/60",
        "iso": 64
      }
    ],
    "fort-de-soto-park": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Sunset_on_North_Beach_at_Fort_De_Soto_Park.jpg/1280px-Sunset_on_North_Beach_at_Fort_De_Soto_Park.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Sunset_on_North_Beach_at_Fort_De_Soto_Park.jpg/500px-Sunset_on_North_Beach_at_Fort_De_Soto_Park.jpg",
        "caption": "Gulf sunset over calm North Beach surf",
        "credit": "Christopher Hollis",
        "license": "Public domain",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ASunset_on_North_Beach_at_Fort_De_Soto_Park.jpg",
        "light": "sunset",
        "camera": "Sony Cybershot",
        "focalLengthMm": 7,
        "fNumber": 4.8,
        "shutter": "1/470",
        "iso": 100
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Fort_de_Soto_Park_%40_St.Petersburg_%28Florida_-_Gulfcoast%29_%2815684290600%29.jpg/1280px-Fort_de_Soto_Park_%40_St.Petersburg_%28Florida_-_Gulfcoast%29_%2815684290600%29.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Fort_de_Soto_Park_%40_St.Petersburg_%28Florida_-_Gulfcoast%29_%2815684290600%29.jpg/500px-Fort_de_Soto_Park_%40_St.Petersburg_%28Florida_-_Gulfcoast%29_%2815684290600%29.jpg",
        "caption": "White-sand spit and lagoon with passing yacht",
        "credit": "Reinhard Link from Germany",
        "license": "CC BY-SA 2.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AFort_de_Soto_Park_%40_St.Petersburg_(Florida_-_Gulfcoast)_(15684290600).jpg",
        "light": "daytime",
        "camera": "Casio EX-H15",
        "focalLengthMm": 22,
        "fNumber": 5.2,
        "shutter": "1/800",
        "iso": 64
      }
    ],
    "honeymoon-island-sp": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Honeymoon_Island_State_Park_%28Image_1%29.jpg/1280px-Honeymoon_Island_State_Park_%28Image_1%29.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Honeymoon_Island_State_Park_%28Image_1%29.jpg/500px-Honeymoon_Island_State_Park_%28Image_1%29.jpg",
        "caption": "Turquoise Gulf surf on shell beach",
        "credit": "Christopher Hollis",
        "license": "Public domain",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AHoneymoon_Island_State_Park_(Image_1).jpg",
        "light": "daytime",
        "camera": "Sony Cybershot",
        "focalLengthMm": 7,
        "fNumber": 8,
        "shutter": "1/985",
        "iso": 100
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Honeymoon_Island_State_Park_%28Image_3%29.jpg/1280px-Honeymoon_Island_State_Park_%28Image_3%29.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Honeymoon_Island_State_Park_%28Image_3%29.jpg/500px-Honeymoon_Island_State_Park_%28Image_3%29.jpg",
        "caption": "Wooden swing facing the Gulf",
        "credit": "Christopher Hollis",
        "license": "Public domain",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AHoneymoon_Island_State_Park_(Image_3).jpg",
        "light": "daytime",
        "camera": "Sony Cybershot",
        "focalLengthMm": 7,
        "fNumber": 8,
        "shutter": "1/985",
        "iso": 100
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Honeymoon_Island_State_Park_%28Image_2%29.jpg/1280px-Honeymoon_Island_State_Park_%28Image_2%29.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Honeymoon_Island_State_Park_%28Image_2%29.jpg/500px-Honeymoon_Island_State_Park_%28Image_2%29.jpg",
        "caption": "Leaning tree over shell shoreline",
        "credit": "Christopher Hollis",
        "license": "Public domain",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AHoneymoon_Island_State_Park_(Image_2).jpg",
        "light": "daytime",
        "camera": "Sony Cybershot",
        "focalLengthMm": 7,
        "fNumber": 8,
        "shutter": "1/985",
        "iso": 100
      }
    ],
    "sunshine-skyway-fishing-piers": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/d/d5/Sunshine_Skyway_Bridge.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/d/d5/Sunshine_Skyway_Bridge.jpg",
        "caption": "Lit Skyway span over the bay at dusk",
        "credit": "The original uploader was Caltrop at English Wikipedia .",
        "license": "Public domain",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ASunshine_Skyway_Bridge.jpg",
        "light": "blue-hour"
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/2010-09-10_Sunshine_Skyway_Bridge.jpg/1280px-2010-09-10_Sunshine_Skyway_Bridge.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/2010-09-10_Sunshine_Skyway_Bridge.jpg/500px-2010-09-10_Sunshine_Skyway_Bridge.jpg",
        "caption": "Yellow cables fanning to the tower",
        "credit": "Joe King",
        "license": "CC BY 2.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3A2010-09-10_Sunshine_Skyway_Bridge.jpg",
        "light": "daytime",
        "camera": "Olympus u720SW,S720SW",
        "focalLengthMm": 6.7,
        "fNumber": 5,
        "shutter": "1/320",
        "iso": 64
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/a/ab/Sunshine_Skyway_Bridge_1SC_2563.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Sunshine_Skyway_Bridge_1SC_2563.jpg/500px-Sunshine_Skyway_Bridge_1SC_2563.jpg",
        "caption": "Bridge silhouette with cargo ship at golden hour",
        "credit": "Robert Neff",
        "license": "CC BY 2.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ASunshine_Skyway_Bridge_1SC_2563.jpg",
        "light": "evening-golden",
        "camera": "Nikon D7000",
        "focalLengthMm": 60,
        "fNumber": 16,
        "shutter": "1/160",
        "iso": 100
      }
    ],
    "st-pete-pier": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/2021_St._Pete_Pier_1.jpg/1280px-2021_St._Pete_Pier_1.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/2021_St._Pete_Pier_1.jpg/500px-2021_St._Pete_Pier_1.jpg",
        "caption": "Modern pier head with palms, blue sky",
        "credit": "Beyond My Ken",
        "license": "CC BY-SA 4.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3A2021_St._Pete_Pier_1.jpg",
        "light": "daytime",
        "camera": "Apple iPhone 8",
        "focalLengthMm": 4,
        "fNumber": 1.8,
        "shutter": "1/2558"
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/St._Pete_Pier_-_West.jpg/1280px-St._Pete_Pier_-_West.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/St._Pete_Pier_-_West.jpg/500px-St._Pete_Pier_-_West.jpg",
        "caption": "Bending Arc net sculpture overhead",
        "credit": "Jackdude101",
        "license": "CC BY-SA 4.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ASt._Pete_Pier_-_West.jpg",
        "light": "daytime",
        "camera": "Sony DSC-W830",
        "focalLengthMm": 4.5,
        "fNumber": 8,
        "shutter": "1/200",
        "iso": 80
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/St._Pete_Pier_head_structure.jpg/1280px-St._Pete_Pier_head_structure.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/St._Pete_Pier_head_structure.jpg/500px-St._Pete_Pier_head_structure.jpg",
        "caption": "Pier head structure over the bay",
        "credit": "Adog",
        "license": "CC BY-SA 4.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ASt._Pete_Pier_head_structure.jpg",
        "light": "daytime",
        "camera": "Apple iPhone 11",
        "focalLengthMm": 4.3,
        "fNumber": 1.8,
        "shutter": "1/2315",
        "iso": 32
      }
    ],
    "vinoy-park": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/St._Pete_Vinoy_pano01.jpg/1280px-St._Pete_Vinoy_pano01.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/St._Pete_Vinoy_pano01.jpg/500px-St._Pete_Vinoy_pano01.jpg",
        "caption": "Pink Vinoy hotel framed by palms",
        "credit": "Ebyabe",
        "license": "CC BY-SA 3.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ASt._Pete_Vinoy_pano01.jpg",
        "light": "daytime"
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/The_Vinoy_Hotel_04.jpg/1280px-The_Vinoy_Hotel_04.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/The_Vinoy_Hotel_04.jpg/500px-The_Vinoy_Hotel_04.jpg",
        "caption": "Ornate VINOY window with palm",
        "credit": "MiaCass16",
        "license": "CC BY-SA 4.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AThe_Vinoy_Hotel_04.jpg",
        "light": "daytime",
        "camera": "Sony DSC-H300",
        "focalLengthMm": 4.5,
        "fNumber": 3,
        "shutter": "1/1000",
        "iso": 80
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/St._Pete_Vinoy_detail02.jpg/1280px-St._Pete_Vinoy_detail02.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/St._Pete_Vinoy_detail02.jpg/500px-St._Pete_Vinoy_detail02.jpg",
        "caption": "Pink facade detail against blue sky",
        "credit": "Ebyabe",
        "license": "CC BY-SA 3.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ASt._Pete_Vinoy_detail02.jpg",
        "light": "daytime",
        "camera": "Eastman Kodak C875",
        "focalLengthMm": 24,
        "fNumber": 5,
        "shutter": "1/500",
        "iso": 64
      }
    ],
    "dali-museum": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Salvador_Dali_Museum_-_panoramio_%2817%29.jpg/1280px-Salvador_Dali_Museum_-_panoramio_%2817%29.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Salvador_Dali_Museum_-_panoramio_%2817%29.jpg/500px-Salvador_Dali_Museum_-_panoramio_%2817%29.jpg",
        "caption": "Enigma glass bubble framed by cypress, dramatic sky",
        "credit": "Art Anderson",
        "license": "CC BY-SA 3.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ASalvador_Dali_Museum_-_panoramio_(17).jpg",
        "light": "evening-golden",
        "camera": "Canon PowerShot S120",
        "focalLengthMm": 6,
        "fNumber": 3.5,
        "shutter": "1/2000",
        "iso": 160
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Salvador_Dal%C3%AD_Museum.JPG/1280px-Salvador_Dal%C3%AD_Museum.JPG",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Salvador_Dal%C3%AD_Museum.JPG/500px-Salvador_Dal%C3%AD_Museum.JPG",
        "caption": "Full Enigma bubble and concrete museum, palms",
        "credit": "Taty2007",
        "license": "CC BY 3.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ASalvador_Dal%C3%AD_Museum.JPG",
        "light": "daytime",
        "camera": "Canon Eos 50D",
        "focalLengthMm": 28,
        "fNumber": 7.1,
        "shutter": "1/160",
        "iso": 100
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/d/d0/Atrium_of_Salvador_Dal%C3%AD_Museum_in_Florida.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Atrium_of_Salvador_Dal%C3%AD_Museum_in_Florida.jpg/500px-Atrium_of_Salvador_Dal%C3%AD_Museum_in_Florida.jpg",
        "caption": "Helical staircase under the geodesic glass dome",
        "credit": "LovelyLillith",
        "license": "CC BY-SA 4.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AAtrium_of_Salvador_Dal%C3%AD_Museum_in_Florida.jpg",
        "light": "daytime",
        "camera": "Nokia Lumia 925",
        "fNumber": 2,
        "shutter": "1/1299",
        "iso": 100
      }
    ],
    "weedon-island-preserve": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Weedon_Island_preserve_-_panoramio.jpg/1280px-Weedon_Island_preserve_-_panoramio.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Weedon_Island_preserve_-_panoramio.jpg/500px-Weedon_Island_preserve_-_panoramio.jpg",
        "caption": "Mangrove boardwalk leading into the preserve",
        "credit": "jesseasmith",
        "license": "CC BY-SA 3.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AWeedon_Island_preserve_-_panoramio.jpg",
        "light": "daytime",
        "camera": "Nikon D5000",
        "focalLengthMm": 10,
        "fNumber": 10,
        "shutter": "1/250",
        "iso": 200
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Weedon_Island_preserve_-_panoramio_%282%29.jpg/1280px-Weedon_Island_preserve_-_panoramio_%282%29.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Weedon_Island_preserve_-_panoramio_%282%29.jpg/500px-Weedon_Island_preserve_-_panoramio_%282%29.jpg",
        "caption": "Boardwalk vanishing under towering cumulus clouds",
        "credit": "jesseasmith",
        "license": "CC BY-SA 3.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AWeedon_Island_preserve_-_panoramio_(2).jpg",
        "light": "daytime",
        "camera": "Nikon D5000",
        "focalLengthMm": 10,
        "fNumber": 11,
        "shutter": "1/640",
        "iso": 200
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/3/3b/Weeden_Island01.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Weeden_Island01.jpg/500px-Weeden_Island01.jpg",
        "caption": "Mangrove wetlands and bay from tower",
        "credit": "Ebyabe",
        "license": "CC BY 2.5",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AWeeden_Island01.jpg",
        "light": "daytime"
      }
    ],
    "cathedral-st-peter-episcopal": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/1/1f/St_Petersburg%2C_FL_-_Downtown_St_Petersburg_Historic_District_-_Cathedral_Church_of_St_Peter_%28Episcopal%29_%283%29.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/St_Petersburg%2C_FL_-_Downtown_St_Petersburg_Historic_District_-_Cathedral_Church_of_St_Peter_%28Episcopal%29_%283%29.jpg/500px-St_Petersburg%2C_FL_-_Downtown_St_Petersburg_Historic_District_-_Cathedral_Church_of_St_Peter_%28Episcopal%29_%283%29.jpg",
        "caption": "Brick gable, stained glass and spire",
        "credit": "Jrozwado",
        "license": "CC BY-SA 4.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ASt_Petersburg%2C_FL_-_Downtown_St_Petersburg_Historic_District_-_Cathedral_Church_of_St_Peter_(Episcopal)_(3).jpg",
        "light": "evening-golden",
        "camera": "Nikon D7100",
        "focalLengthMm": 24,
        "fNumber": 16,
        "shutter": "1/1000",
        "iso": 1250
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/St._Pete_Episc_Cathedral03.jpg/1280px-St._Pete_Episc_Cathedral03.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/St._Pete_Episc_Cathedral03.jpg/500px-St._Pete_Episc_Cathedral03.jpg",
        "caption": "Blonde-brick spire against blue sky",
        "credit": "Ebyabe",
        "license": "CC BY-SA 3.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ASt._Pete_Episc_Cathedral03.jpg",
        "light": "daytime",
        "camera": "Eastman Kodak C875",
        "focalLengthMm": 7.8,
        "fNumber": 4,
        "shutter": "1/800",
        "iso": 64
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/c/c8/Cathedral_Church_of_St._Peter_at_140_4th_St._N._in_St._Petersburg%2C_Florida.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Cathedral_Church_of_St._Peter_at_140_4th_St._N._in_St._Petersburg%2C_Florida.jpg/500px-Cathedral_Church_of_St._Peter_at_140_4th_St._N._in_St._Petersburg%2C_Florida.jpg",
        "caption": "Full three-quarter view of cathedral",
        "credit": "Joseph Janney Steinmetz",
        "license": "Public domain",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ACathedral_Church_of_St._Peter_at_140_4th_St._N._in_St._Petersburg%2C_Florida.jpg",
        "light": "daytime"
      }
    ],
    "cathedral-st-jude-apostle": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Cathedral_of_Saint_Jude_the_Apostle_%28St._Petersburg%2C_Florida%29_-_sanctuary_2.jpg/1280px-Cathedral_of_Saint_Jude_the_Apostle_%28St._Petersburg%2C_Florida%29_-_sanctuary_2.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Cathedral_of_Saint_Jude_the_Apostle_%28St._Petersburg%2C_Florida%29_-_sanctuary_2.jpg/500px-Cathedral_of_Saint_Jude_the_Apostle_%28St._Petersburg%2C_Florida%29_-_sanctuary_2.jpg",
        "caption": "Altar and crucifix with modern stained glass",
        "credit": "Nheyob",
        "license": "CC0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ACathedral_of_Saint_Jude_the_Apostle_(St._Petersburg%2C_Florida)_-_sanctuary_2.jpg",
        "light": "daytime",
        "camera": "Canon PowerShot G9 X",
        "focalLengthMm": 11,
        "fNumber": 2.8,
        "shutter": "1/30",
        "iso": 125
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Cathedral_of_Saint_Jude_the_Apostle_%28St._Petersburg%2C_Florida%29_-_nave.jpg/1280px-Cathedral_of_Saint_Jude_the_Apostle_%28St._Petersburg%2C_Florida%29_-_nave.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Cathedral_of_Saint_Jude_the_Apostle_%28St._Petersburg%2C_Florida%29_-_nave.jpg/500px-Cathedral_of_Saint_Jude_the_Apostle_%28St._Petersburg%2C_Florida%29_-_nave.jpg",
        "caption": "Nave pews toward the altar",
        "credit": "Nheyob",
        "license": "CC0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ACathedral_of_Saint_Jude_the_Apostle_(St._Petersburg%2C_Florida)_-_nave.jpg",
        "light": "daytime",
        "camera": "Canon PowerShot G9 X",
        "focalLengthMm": 10,
        "fNumber": 2.2,
        "shutter": "1/60",
        "iso": 125
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Cathedral_of_Saint_Jude_the_Apostle_%28St._Petersburg%2C_Florida%29_-_exterior.jpg/1280px-Cathedral_of_Saint_Jude_the_Apostle_%28St._Petersburg%2C_Florida%29_-_exterior.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Cathedral_of_Saint_Jude_the_Apostle_%28St._Petersburg%2C_Florida%29_-_exterior.jpg/500px-Cathedral_of_Saint_Jude_the_Apostle_%28St._Petersburg%2C_Florida%29_-_exterior.jpg",
        "caption": "Orange spire and cathedral name sign",
        "credit": "Nheyob",
        "license": "CC0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ACathedral_of_Saint_Jude_the_Apostle_(St._Petersburg%2C_Florida)_-_exterior.jpg",
        "light": "daytime",
        "camera": "Canon PowerShot G9 X",
        "focalLengthMm": 10,
        "fNumber": 4,
        "shutter": "1/100",
        "iso": 160
      }
    ],
    "stpete-shine-murals": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Before_I_Die_Mural.jpg/1280px-Before_I_Die_Mural.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Before_I_Die_Mural.jpg/500px-Before_I_Die_Mural.jpg",
        "caption": '"Before I die" wall with bikes, people',
        "credit": "Xrzt",
        "license": "CC BY-SA 4.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3ABefore_I_Die_Mural.jpg",
        "light": "daytime",
        "camera": "Nikon D7000",
        "focalLengthMm": 50,
        "fNumber": 6.3,
        "shutter": "1/2000",
        "iso": 200
      }
    ],
    "fred-howard-park": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Howard_Park_Tarpon.jpg/1280px-Howard_Park_Tarpon.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Howard_Park_Tarpon.jpg/500px-Howard_Park_Tarpon.jpg",
        "caption": "Gulf sunset behind beach palm silhouettes",
        "credit": "VitaleBaby at English Wikipedia",
        "license": "Public domain",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3AHoward_Park_Tarpon.jpg",
        "light": "sunset",
        "camera": "Canon PowerShot Elph 350 HS",
        "focalLengthMm": 20,
        "fNumber": 5,
        "shutter": "1/500",
        "iso": 250
      },
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Porsche_and_parasail.jpg/1280px-Porsche_and_parasail.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Porsche_and_parasail.jpg/500px-Porsche_and_parasail.jpg",
        "caption": "Kite-surfer rig over windy causeway",
        "credit": "Xrzt",
        "license": "CC BY-SA 4.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File%3APorsche_and_parasail.jpg",
        "light": "daytime",
        "camera": "Nikon D7000",
        "focalLengthMm": 180,
        "fNumber": 9,
        "shutter": "1/1250",
        "iso": 200
      }
    ],
    "azure-tampa-edition": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/EditionTampa.jpg/1280px-EditionTampa.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/EditionTampa.jpg/500px-EditionTampa.jpg",
        "caption": "The Tampa EDITION \u2014 home of the Azure rooftop",
        "credit": "Chiefmiz",
        "license": "CC0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:EditionTampa.jpg",
        "light": "daytime"
      }
    ],
    "beacon-jw-marriott": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Downtown_Tampa%2C_Florida.jpg/1280px-Downtown_Tampa%2C_Florida.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Downtown_Tampa%2C_Florida.jpg/500px-Downtown_Tampa%2C_Florida.jpg",
        "caption": "Downtown Tampa skyline \u2014 the kind of view from the rooftop",
        "credit": "Cl\xE9ment Bardot",
        "license": "CC BY-SA 4.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Downtown_Tampa,_Florida.jpg",
        "light": "daytime",
        "camera": "Nikon D5100",
        "focalLengthMm": 22,
        "fNumber": 7.1,
        "shutter": "1/1600",
        "iso": 400
      }
    ],
    "mbird-armature-works": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Tampa_Skyline_-_Eric_Statzer.jpg/1280px-Tampa_Skyline_-_Eric_Statzer.jpg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Tampa_Skyline_-_Eric_Statzer.jpg/500px-Tampa_Skyline_-_Eric_Statzer.jpg",
        "caption": "Downtown skyline across the water from the Heights",
        "credit": "Eric Statzer",
        "license": "CC BY-SA 4.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Tampa_Skyline_-_Eric_Statzer.jpg",
        "light": "daytime",
        "camera": "Apple iPhone X",
        "focalLengthMm": 4,
        "fNumber": 1.8,
        "shutter": "1/1919"
      }
    ],
    "edge-epicurean": [
      {
        "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Downtown_Tampa_%2858977580%29.jpeg/1280px-Downtown_Tampa_%2858977580%29.jpeg",
        "thumb": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Downtown_Tampa_%2858977580%29.jpeg/500px-Downtown_Tampa_%2858977580%29.jpeg",
        "caption": "The distant downtown skyline at golden hour",
        "credit": "Steven Buehler",
        "license": "CC BY 3.0",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Downtown_Tampa_(58977580).jpeg",
        "light": "evening-golden",
        "camera": "Nikon Coolpix L820",
        "focalLengthMm": 76,
        "fNumber": 5.7,
        "shutter": "1/125",
        "iso": 125
      }
    ],
    "tampa-murals": [
      {
        "src": "https://live.staticflickr.com/3875/14492170902_aeffc419dd_b.jpg",
        "thumb": "https://live.staticflickr.com/3875/14492170902_aeffc419dd_z.jpg",
        "caption": "The 'Tampa Postcard' mural (by Carl Cowden III) at golden hour",
        "credit": "Photomatt28 (Flickr)",
        "license": "CC BY-NC-ND 2.0",
        "sourceUrl": "https://www.flickr.com/photos/46837385@N03/14492170902",
        "light": "evening-golden"
      }
    ]
  };

  // src/data/spots/tampa-bay.ts
  var WK = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  var clk = (time) => ({ at: "clock", time });
  var sr = (offsetMin) => ({ at: "sunrise", offsetMin });
  var ss = (offsetMin) => ({ at: "sunset", offsetMin });
  var iv = (from, to) => ({ from, to });
  var open = (...intervals) => ({ open: "hours", intervals });
  var H24 = { open: "24h" };
  var CLOSED = { open: "closed" };
  function days(fallback, overrides = {}) {
    const d = {};
    for (const w of WK) d[w] = overrides[w] ?? fallback;
    return { days: d };
  }
  var SPOTS = [
    {
      id: "bayshore-boulevard",
      name: "Bayshore Boulevard",
      category: "skyline",
      city: "Tampa",
      region: "tampa-bay",
      bestFor: ["skyline across water", "portraits", "balustrade leading line"],
      bestLight: ["sunrise", "blue-hour"],
      lat: 27.9165,
      lng: -82.4827,
      address: "Bayshore Blvd at Bay-to-Bay Blvd, Tampa, FL 33629",
      facing: 36,
      feeUSD: 0,
      isFree: true,
      feeNote: "Free street parking at the Bay-to-Bay corner",
      driveMinutes: 6,
      hours: days(H24),
      phone: null,
      notes: "A 4.5-mile continuous sidewalk along Hillsborough Bay; brass distance medallions every half mile. Downtown skyline to the northeast is front-lit at sunrise.",
      craft: {
        lightStrategy: "Shoot northeast toward downtown at sunrise for warm front-lit towers; the same view silhouettes against a glowing sky at sunset.",
        whatToShoot: ["downtown skyline across the bay", "the curving WPA balustrade as a leading line", "runners + palms for foreground"],
        signatureShots: [
          { id: "balustrade", label: "Curving balustrade leading to the skyline", bestLight: "sunrise" },
          { id: "reflection", label: "Skyline reflected in calm dawn water", bestLight: "blue-hour" }
        ],
        compositionTips: ["Get low and use the balustrade to pull the eye toward downtown", "Calm mornings give the cleanest water reflections"],
        gear: { lens: "24-70mm; 70-200 to compress the skyline", tripod: true, filters: ["ND for long exposure"], settingsHint: "f/8, ISO 100, bracket for the bright sky" },
        ifCloudy: "Switch to portraits along the balustrade or detail shots of the medallions.",
        pairWith: ["ballast-point-park", "davis-islands-beach"]
      },
      media: []
    },
    {
      id: "ballast-point-park",
      name: "Ballast Point Park",
      category: "skyline",
      city: "Tampa",
      region: "tampa-bay",
      bestFor: ["skyline", "sunrise over the bay"],
      bestLight: ["sunrise", "blue-hour"],
      lat: 27.8893,
      lng: -82.4818,
      address: "5300 Interbay Blvd, Tampa, FL 33611",
      facing: 20,
      feeUSD: 0,
      isFree: true,
      driveMinutes: 7,
      hours: days(open(iv(clk("06:00"), clk("20:00")))),
      phone: null,
      notes: "South end of Bayshore (5300 Interbay Blvd); skyline + Davis Islands across the bay with color on the water at sunrise.",
      caveats: "The 600-ft pier and fitness center are closed since the 2024 hurricanes \u2014 shoot from shore.",
      craft: {
        lightStrategy: "Arrive before the 6 a.m. opening light; the skyline to the north catches first warm sun.",
        whatToShoot: ["skyline + Davis Islands across the bay", "color reflecting off calm water"],
        signatureShots: [{ id: "dawn-skyline", label: "Skyline over mirror-calm dawn water", bestLight: "sunrise" }],
        compositionTips: ["Use foreground rocks or the closed pier railing for depth"],
        gear: { lens: "24-105mm", tripod: true, settingsHint: "f/11, ISO 100 for star-burst city lights at blue hour" },
        ifCloudy: "Overcast still works for moody long exposures of the bay.",
        pairWith: ["bayshore-boulevard"]
      },
      media: []
    },
    {
      id: "davis-islands-beach",
      name: "Davis Islands Beach & Yacht Basin",
      category: "skyline",
      city: "Tampa",
      region: "tampa-bay",
      bestFor: ["skyline backdrop", "sunset"],
      bestLight: ["sunset", "evening-golden"],
      lat: 27.9112,
      lng: -82.453,
      address: "864 Severn Ave, Tampa, FL 33606",
      facing: 350,
      feeUSD: 0,
      isFree: true,
      driveMinutes: 12,
      hours: days(open(iv(sr(), ss()))),
      phone: null,
      notes: "Small free beach (864 Severn Ave) with the skyline as a backdrop; a local favorite for sunset.",
      craft: {
        lightStrategy: "The skyline sits to the north, so evening light rakes across the towers before the sky lights up over the bay.",
        whatToShoot: ["skyline backdrop over the basin", "sailboats + palms"],
        signatureShots: [{ id: "skyline-dusk", label: "Skyline + boats at dusk", bestLight: "sunset" }],
        compositionTips: ["Include a moored boat in the foreground for scale"],
        gear: { lens: "35-85mm", tripod: false, settingsHint: "Open up for handheld blue hour, raise ISO" },
        ifCloudy: "Flat light suits portraits on the quiet beach."
      },
      media: []
    },
    {
      id: "curtis-hixon-waterfront-park",
      name: "Curtis Hixon Waterfront Park",
      category: "skyline",
      city: "Tampa",
      region: "tampa-bay",
      bestFor: ["skyline", "UT minarets", "blue hour", "fountains"],
      bestLight: ["evening-golden", "sunset", "blue-hour"],
      lat: 27.9487,
      lng: -82.4625,
      address: "600 N Ashley Dr, Tampa, FL 33602",
      facing: 270,
      feeUSD: 0,
      isFree: true,
      driveMinutes: 14,
      hours: days(open(iv(clk("07:00"), clk("22:00")))),
      phone: null,
      notes: "600 N Ashley Dr; the downtown lawn looks WEST across the river \u2014 THE spot for the sun setting behind the silver UT minarets, plus blue-hour fountains and skyline.",
      craft: {
        lightStrategy: "Stand on the lawn looking west; the sun drops directly behind the University of Tampa minarets at sunset, then the fountains and skyline glow at blue hour.",
        whatToShoot: ["sun setting behind the UT minarets", "fountains + skyline at blue hour", "reflections from the Riverwalk"],
        signatureShots: [
          { id: "sunburst-minaret", label: "Sunburst behind the center minaret", bestLight: "sunset" },
          { id: "fountain-blue", label: "Long-exposure fountain at blue hour", bestLight: "blue-hour" }
        ],
        compositionTips: ["Use a small aperture (f/16) for a sunstar on the minaret", "Stay 20-30 min past sunset for the best blue-hour balance"],
        gear: { lens: "24-70mm", tripod: true, filters: ["ND for fountain blur"], settingsHint: "f/8 base, f/16 for sunstar, ISO 100" },
        ifCloudy: "Skip the sunset; shoot the fountains and the minaret detail in soft light.",
        pairWith: ["tampa-riverwalk", "plant-park-ut-minarets"]
      },
      media: [],
      logistics: {
        parking: { label: "Poe Garage, Ashley Dr", lat: 27.9466, lng: -82.4609 },
        restrooms: true,
        crowdTiming: "Quiet on weekday evenings, busy during festivals"
      }
    },
    {
      id: "tampa-riverwalk",
      name: "Tampa Riverwalk",
      category: "skyline",
      city: "Tampa",
      region: "tampa-bay",
      bestFor: ["skyline reflections", "blue hour"],
      bestLight: ["blue-hour", "sunset", "night-astro"],
      lat: 27.9468,
      lng: -82.4618,
      address: "Tampa Riverwalk, Tampa, FL 33602",
      facing: 270,
      feeUSD: 0,
      isFree: true,
      driveMinutes: 14,
      hours: days(H24),
      phone: null,
      notes: "2.4-mile lit waterfront path from Armature Works to the Tampa Bay History Center; superb blue-hour reflections of the skyline and the UT minarets.",
      craft: {
        lightStrategy: "Walk the lit path after sunset; still water gives mirror reflections of the skyline and minarets through blue hour.",
        whatToShoot: ["skyline reflections", "the minarets across the river", "lit bridges"],
        signatureShots: [{ id: "mirror-skyline", label: "Skyline mirrored in the river", bestLight: "blue-hour" }],
        compositionTips: ["Find a still inlet for the cleanest reflection", "Frame between railings for leading lines"],
        gear: { lens: "16-35mm", tripod: true, settingsHint: "f/11, ISO 100, 2-10s exposures" },
        ifCloudy: "Low cloud reflecting city light can make moodier frames.",
        pairWith: ["curtis-hixon-waterfront-park"]
      },
      media: []
    },
    {
      id: "plant-park-ut-minarets",
      name: "Plant Park / UT Minarets",
      category: "architecture",
      city: "Tampa",
      region: "tampa-bay",
      bestFor: ["minarets up close", "exterior architecture"],
      bestLight: ["morning-golden", "evening-golden"],
      lat: 27.9459,
      lng: -82.4646,
      address: "Plant Park, 401 W Kennedy Blvd, Tampa, FL 33606",
      facing: null,
      feeUSD: 0,
      isFree: true,
      driveMinutes: 13,
      hours: days(open(iv(sr(), ss()))),
      phone: null,
      notes: "Free grounds around the University of Tampa's Moorish silver minarets \u2014 Tampa's most iconic architecture. Golden hour lights the silver domes.",
      craft: {
        lightStrategy: "Golden hour sidelights the silver domes and warms the brick; shoot from the lawns and the riverside path.",
        whatToShoot: ["silver minaret domes", "Moorish arches + brickwork", "palms framing the towers"],
        signatureShots: [{ id: "minaret-golden", label: "Domes glowing at golden hour", bestLight: "evening-golden" }],
        compositionTips: ["Use palm fronds to frame a single minaret", "Shoot up the arches for symmetry"],
        gear: { lens: "24-105mm", tripod: false, settingsHint: "f/8 for sharp detail across the facade" },
        ifCloudy: "Soft light is fine for the architecture; go for clean, even detail shots.",
        pairWith: ["henry-b-plant-museum", "curtis-hixon-waterfront-park"]
      },
      media: []
    },
    {
      id: "henry-b-plant-museum",
      name: "Henry B. Plant Museum",
      category: "architecture",
      city: "Tampa",
      region: "tampa-bay",
      bestFor: ["Moorish/Gilded-Age interior", "exterior minarets"],
      bestLight: ["daytime", "evening-golden"],
      lat: 27.9463,
      lng: -82.4641,
      address: "401 W Kennedy Blvd, Tampa, FL 33606",
      facing: null,
      feeUSD: 12,
      isFree: false,
      feeNote: "$12 adult; exterior + Plant Park free; free Thomas Garage parking ~5-min walk",
      driveMinutes: 13,
      hours: days(open(iv(clk("10:00"), clk("17:00"))), { mon: CLOSED, sun: open(iv(clk("12:00"), clk("17:00"))) }),
      phone: null,
      notes: "401 W Kennedy Blvd, inside UT's 1891 Plant Hall. Walk-in photography of the opulent Moorish interior is fine; authentic dim 1891 lighting.",
      caveats: "December Victorian Christmas Stroll alters hours. Last admission 4:30pm.",
      craft: {
        lightStrategy: "Interiors use original dim 1891 lighting \u2014 bring a fast lens and steady hands; window light is best mid-morning.",
        whatToShoot: ["opulent period rooms", "ornate furnishings + mirrors", "arched corridors"],
        signatureShots: [{ id: "gilded-room", label: "Gilded-age room in window light", bestLight: "daytime" }],
        compositionTips: ["Brace on a doorway; the light is dim", "Look for symmetry down the corridors"],
        gear: { lens: "fast prime (35/1.4 or 24/1.8)", tripod: false, settingsHint: "High ISO; check tripod/flash policy at the desk" },
        accessTips: "Closed Mondays. Tripods/flash may be restricted \u2014 ask at the desk.",
        pairWith: ["plant-park-ut-minarets"]
      },
      media: [],
      logistics: { parking: { label: "Thomas Parking Garage (free)", lat: 27.9472, lng: -82.4647 }, restrooms: true, feeDetail: "$12 adult, $7 youth" }
    },
    {
      id: "sacred-heart-catholic-church",
      name: "Sacred Heart Catholic Church",
      category: "interiors",
      city: "Tampa",
      region: "tampa-bay",
      bestFor: ["ornate interior", "stained glass", "marble columns"],
      bestLight: ["morning-golden", "daytime"],
      lat: 27.9494,
      lng: -82.4572,
      address: "509 N Florida Ave, Tampa, FL 33602",
      facing: null,
      feeUSD: 0,
      isFree: true,
      driveMinutes: 14,
      hours: days(open(iv(clk("07:00"), clk("15:00"))), { sat: CLOSED, sun: CLOSED }),
      phone: "813-229-1595",
      notes: "509 N Florida Ave; the top-priority interior in the city. Walk in to photograph weekdays until 3pm, outside Mass times. Be discreet and yield to worship.",
      caveats: "No published photography policy. Holy Days / Christmas / Gasparilla alter hours \u2014 call to confirm.",
      services: [
        { day: "Mon\u2013Fri", time: "07:00", label: "Weekday Mass" },
        { day: "Mon\u2013Fri", time: "12:10", label: "Weekday Mass" },
        { day: "Sat", time: "17:30", label: "Vigil Mass" },
        { day: "Sun", time: "07:30", label: "Mass" },
        { day: "Sun", time: "10:30", label: "Mass" }
      ],
      craft: {
        lightStrategy: "Mid-morning sun lights the stained glass and the marble nave; shoot weekdays before 3pm between Masses.",
        whatToShoot: ["cathedral-like nave", "stained glass + gold trim", "marble columns receding to the altar"],
        signatureShots: [
          { id: "nave", label: "Symmetrical nave to the altar", bestLight: "daytime" },
          { id: "glass", label: "Stained glass lit from outside", bestLight: "morning-golden" }
        ],
        compositionTips: ["Center the aisle for symmetry", "Expose for the windows, lift shadows later"],
        gear: { lens: "16-35mm wide; fast prime for the glass", tripod: false, settingsHint: "Handheld, ISO 1600+, brace on a pew" },
        accessTips: "Avoid 7am and 12:10pm weekday Masses; closed weekends to walk-ins. Call 813-229-1595 to confirm."
      },
      media: [],
      logistics: { restrooms: false, crowdTiming: "Quietest mid-morning weekdays between Masses" }
    },
    {
      id: "tampa-theatre",
      name: "Tampa Theatre",
      category: "architecture",
      city: "Tampa",
      region: "tampa-bay",
      bestFor: ["atmospheric movie palace", "marquee at night"],
      bestLight: ["night-astro", "blue-hour"],
      lat: 27.9504,
      lng: -82.4589,
      address: "711 N Franklin St, Tampa, FL 33602",
      facing: null,
      feeUSD: 0,
      isFree: true,
      feeNote: "Marquee from the sidewalk is free; interior is tour-ticket or movie/event-ticket only",
      driveMinutes: 14,
      hours: days({ open: "tour-only", note: "No walk-in photography. Monthly Balcony-to-Backstage tour (~11:30am) or buy a show ticket. Marquee always shootable from the sidewalk." }),
      phone: null,
      notes: "711 N Franklin St; a 1926 Eberson atmospheric palace with a twinkling-star ceiling, 1,250 seats.",
      caveats: "Duncan Auditorium under restoration early Mar\u2013end Sep 2026; Balcony-to-Backstage tours paused during that window.",
      craft: {
        lightStrategy: "The neon marquee + vertical blade sign pop at blue hour and after dark from the public sidewalk.",
        whatToShoot: ["neon marquee + blade sign", "the atmospheric auditorium ceiling (on a tour)"],
        signatureShots: [{ id: "marquee-night", label: "Lit marquee against deep blue sky", bestLight: "blue-hour" }],
        compositionTips: ["Shoot the marquee straight-on or from a low angle", "Catch wet pavement after rain for reflections"],
        gear: { lens: "24-70mm", tripod: true, settingsHint: "f/8, ISO 100, bracket the neon highlights" },
        accessTips: "Interior is tour-only / ticket-only; tours paused Mar\u2013Sep 2026."
      },
      media: []
    },
    {
      id: "ybor-city",
      name: "Ybor City Historic District",
      category: "architecture",
      city: "Tampa",
      region: "tampa-bay",
      bestFor: ["historic brick architecture", "empty streets", "social-club facades"],
      bestLight: ["morning-golden", "open-shade"],
      lat: 27.9606,
      lng: -82.4376,
      address: "E 7th Ave at 16th St, Ybor City, Tampa, FL 33605",
      facing: null,
      feeUSD: 0,
      isFree: true,
      driveMinutes: 16,
      hours: days(H24),
      phone: null,
      notes: "National Historic Landmark cigar-factory district with wrought-iron balconies. Best 7\u20139am for empty, atmospheric streets. Social-club facades (Cuban Club, Italian Club, Centro Asturiano) are event venues \u2014 exteriors only.",
      craft: {
        lightStrategy: "Come at 7\u20139am before crowds; low side light rakes the brick and casts long shadows down empty streets.",
        whatToShoot: ["wrought-iron balconies", "brick cigar-factory facades", "empty 7th Ave streetscape", "social-club exteriors"],
        signatureShots: [
          { id: "empty-7th", label: "Empty 7th Ave at dawn", bestLight: "morning-golden" },
          { id: "balcony", label: "Wrought-iron balcony detail", bestLight: "open-shade" }
        ],
        compositionTips: ["Use the long street as a vanishing-point line", "Open shade flatters the ironwork detail"],
        gear: { lens: "35mm + 85mm", tripod: false, settingsHint: "f/5.6, watch for blown highlights on pale brick" },
        ifCloudy: "Overcast is great for even-toned facade and detail shots."
      },
      media: []
    },
    {
      id: "mbird-armature-works",
      name: "M.Bird (Armature Works rooftop)",
      category: "rooftop",
      city: "Tampa",
      region: "tampa-bay",
      bestFor: ["rooftop skyline", "river views"],
      bestLight: ["sunset", "blue-hour"],
      lat: 27.9612,
      lng: -82.464,
      address: "Armature Works, 1910 N Ola Ave, Tampa, FL 33602",
      facing: 162,
      feeUSD: 0,
      isFree: true,
      feeNote: "Free entry (buy a drink); 21+ after 6pm Thu\u2013Sat",
      driveMinutes: 15,
      hours: days(open(iv(clk("16:00"), clk("24:00"))), {
        thu: open(iv(clk("16:00"), clk("27:00"))),
        fri: open(iv(clk("15:00"), clk("27:00"))),
        sat: open(iv(clk("11:00"), clk("27:00"))),
        sun: open(iv(clk("11:00"), clk("24:00")))
      }),
      phone: null,
      notes: "Deco rooftop atop Armature Works in Tampa Heights with downtown + river views. Arrive 45\u201360 min before sunset for a rail table.",
      craft: {
        lightStrategy: "Downtown sits to the south; grab a rail seat for the skyline as it lights up through sunset and blue hour.",
        whatToShoot: ["elevated skyline + river", "deco rooftop details", "city lights at blue hour"],
        signatureShots: [{ id: "rooftop-skyline", label: "Skyline from the rail at blue hour", bestLight: "blue-hour" }],
        compositionTips: ["Shoot over the rail to avoid the foreground crowd", "A mini tripod or steady rail helps after dark"],
        gear: { lens: "24-70mm", tripod: false, settingsHint: "Brace on the rail, ISO 800-1600 for handheld blue hour" },
        accessTips: "First-come bar seating; 21+ after 6pm Thu\u2013Sat.",
        pairWith: ["tampa-riverwalk"]
      },
      media: [],
      logistics: { dressCode: "Casual", crowdTiming: "Packed at sunset on weekends \u2014 arrive ~an hour early" }
    },
    {
      id: "beacon-jw-marriott",
      name: "Beacon (JW Marriott, 27th floor)",
      category: "rooftop",
      city: "Tampa",
      region: "tampa-bay",
      bestFor: ["highest rooftop skyline", "270\xB0 bay views"],
      bestLight: ["sunset", "blue-hour"],
      lat: 27.9407,
      lng: -82.4545,
      address: "JW Marriott Tampa Water Street, 510 Water St, Tampa, FL 33602",
      facing: 315,
      feeUSD: 0,
      isFree: true,
      feeNote: "Free entry; dress code enforced",
      driveMinutes: 15,
      hours: days(open(iv(clk("17:00"), clk("24:00"))), { fri: open(iv(clk("17:00"), clk("25:00"))), sat: open(iv(clk("17:00"), clk("25:00"))) }),
      phone: null,
      notes: "510 Water St; Tampa's highest public rooftop (27th floor), opened Oct 2023, with 270\xB0 skyline + bay views.",
      craft: {
        lightStrategy: "From up high the skyline and bay wrap around you; the NW outlook catches sunset color over the city.",
        whatToShoot: ["270\xB0 skyline + bay panorama", "aerial-style city grid", "sunset over downtown"],
        signatureShots: [{ id: "high-pano", label: "Wide skyline panorama at dusk", bestLight: "sunset" }],
        compositionTips: ["Shoot through clean glass straight-on to cut reflections", "Cup a lens hood against the glass after dark"],
        gear: { lens: "16-35mm + 50mm", tripod: false, settingsHint: "Lens against the glass, high ISO; bring a rubber hood" },
        accessTips: "Dress code: no athletic wear, t-shirts, hats, flip-flops."
      },
      media: [],
      logistics: { dressCode: "Smart casual enforced (no athletic wear, hats, flip-flops)" }
    },
    {
      id: "azure-tampa-edition",
      name: "Azure at The Tampa EDITION",
      category: "rooftop",
      city: "Tampa",
      region: "tampa-bay",
      bestFor: ["rooftop skyline", "poolside city views"],
      bestLight: ["sunset", "blue-hour"],
      lat: 27.9437,
      lng: -82.4511,
      address: "The Tampa EDITION, 500 Channelside Dr, Tampa, FL 33602",
      facing: 315,
      feeUSD: 0,
      isFree: true,
      feeNote: "Open to non-hotel guests; reservations recommended near sunset",
      driveMinutes: 15,
      hours: days(open(iv(clk("11:00"), clk("23:00"))), { fri: open(iv(clk("11:00"), clk("26:00"))), sat: open(iv(clk("11:00"), clk("26:00"))) }),
      phone: "813-771-8022",
      notes: "500 Channelside Dr; the EDITION rooftop venue (9th-floor pool deck) with floor-to-ceiling city views.",
      craft: {
        lightStrategy: "Poolside on the 9th floor with the skyline to the NW \u2014 golden hour reflects in the water and glass.",
        whatToShoot: ["pool deck + skyline", "reflections in the pool", "design details"],
        signatureShots: [{ id: "pool-skyline", label: "Skyline mirrored in the pool", bestLight: "evening-golden" }],
        compositionTips: ["Use the pool as a reflective foreground", "Shoot low to the water line"],
        gear: { lens: "24-70mm", tripod: false, settingsHint: "Handheld; polarizer to manage pool glare" },
        accessTips: "Reserve near sunset; call 813-771-8022."
      },
      media: []
    },
    {
      id: "edge-epicurean",
      name: "EDGE Rooftop (Epicurean Hotel)",
      category: "rooftop",
      city: "Tampa",
      region: "tampa-bay",
      bestFor: ["smaller SoHo rooftop skyline"],
      bestLight: ["sunset", "blue-hour"],
      lat: 27.9382,
      lng: -82.4838,
      address: "Epicurean Hotel, 1207 S Howard Ave, Tampa, FL 33606",
      facing: null,
      feeUSD: 0,
      isFree: true,
      feeNote: "Free entry; buy a drink",
      driveMinutes: 10,
      hours: days({ open: "call-ahead", note: "Hours vary seasonally; Yelp lists Tue\u2013Thu 5pm\u201312a, Fri\u2013Sat 5pm\u20131a, closed Sun\u2013Mon. Call to confirm." }),
      phone: "813-999-8700",
      notes: "1207 S Howard Ave (Epicurean Hotel, SoHo); a smaller neighborhood rooftop.",
      caveats: "The hotel does not publish set hours \u2014 call (813) 999-8700 before going.",
      craft: {
        lightStrategy: "A SoHo-level rooftop for warm evening light over the leafy neighborhood and a distant skyline edge.",
        whatToShoot: ["SoHo rooftop ambiance", "distant skyline at dusk"],
        signatureShots: [{ id: "soho-dusk", label: "Rooftop drinks scene at dusk", bestLight: "sunset" }],
        compositionTips: ["Foreground the bar/string lights for atmosphere"],
        gear: { lens: "35mm", tripod: false, settingsHint: "Fast prime for low light ambiance" },
        accessTips: "Call ahead \u2014 hours vary seasonally; often closed Sun\u2013Mon."
      },
      media: []
    },
    {
      id: "lettuce-lake-park",
      name: "Lettuce Lake Park",
      category: "nature",
      city: "Tampa",
      region: "tampa-bay",
      bestFor: ["cypress swamp", "wildlife", "boardwalk"],
      bestLight: ["morning-golden", "sunrise"],
      lat: 28.0699,
      lng: -82.3701,
      address: "6920 E Fletcher Ave, Tampa, FL 33637",
      facing: null,
      feeUSD: 2,
      isFree: false,
      feeNote: "$2/car",
      driveMinutes: 25,
      hours: days(open(iv(clk("08:00"), clk("18:00")))),
      phone: null,
      notes: "6920 E Fletcher Ave; a cypress-swamp boardwalk along the Hillsborough River \u2014 herons, turtles, gators. Early morning for wildlife and misty light.",
      caveats: "Late-2025: parts of the boardwalk and the observation tower are closed for reconstruction; the newer right-side section has reopened.",
      craft: {
        lightStrategy: "First light through the cypress creates mist and warm backlight on the water; mornings are best for active wildlife.",
        whatToShoot: ["herons + wading birds", "cypress knees + reflections", "gators + turtles", "misty boardwalk"],
        signatureShots: [
          { id: "misty-cypress", label: "Backlit mist through the cypress", bestLight: "sunrise" },
          { id: "heron", label: "Heron hunting at the water edge", bestLight: "morning-golden" }
        ],
        compositionTips: ["Get low to the water for reflections", "Use a long lens and patience for the birds"],
        gear: { lens: "100-400mm for wildlife; 16-35 for the swamp", tripod: true, settingsHint: "Fast shutter for birds; f/8 for the scene" },
        ifCloudy: "Overcast is ideal for even-toned forest and reflection shots.",
        pairWith: ["weedon-island-preserve"]
      },
      media: [],
      logistics: { restrooms: true, feeDetail: "$2 per car", crowdTiming: "Quiet at opening (8am); busier midday on weekends" }
    },
    {
      id: "usf-botanical-gardens",
      name: "USF Botanical Gardens",
      category: "gardens",
      city: "Tampa",
      region: "tampa-bay",
      bestFor: ["gardens", "portraits"],
      bestLight: ["evening-golden", "morning-golden"],
      lat: 28.061,
      lng: -82.4255,
      address: "12210 USF Pine Dr, Tampa, FL 33612",
      facing: null,
      feeUSD: 5,
      isFree: false,
      feeNote: "$5 general; free with USF ID; free Tuesdays",
      driveMinutes: 22,
      hours: days(open(iv(clk("09:00"), clk("16:00"))), { mon: CLOSED }),
      phone: "813-974-2329",
      notes: "12210 USF Pine Dr; 16 acres of native + exotic collections. Photography is explicitly permitted. Closes at 4pm, so golden hour is tight.",
      craft: {
        lightStrategy: "It closes at 4pm \u2014 front-load the last open hour for the warmest light, or come at 9am open.",
        whatToShoot: ["exotic plant collections", "portraits among the greenery", "flowers + pollinators"],
        signatureShots: [{ id: "garden-portrait", label: "Portrait in dappled garden light", bestLight: "evening-golden" }],
        compositionTips: ["Backlight foliage for glow", "Use a wide aperture to separate the subject"],
        gear: { lens: "85mm for portraits; 100mm macro for flowers", tripod: false, settingsHint: "f/2.8 for separation" },
        ifCloudy: "Open shade / overcast is perfect for even flower and portrait light.",
        accessTips: "Closed Mondays; closes 4pm (before sunset)."
      },
      media: [],
      logistics: { restrooms: true, feeDetail: "$5, free on Tuesdays" }
    },
    {
      id: "sunken-gardens",
      name: "Sunken Gardens",
      category: "gardens",
      city: "St. Petersburg",
      region: "tampa-bay",
      bestFor: ["lush gardens", "flamingos", "portraits"],
      bestLight: ["open-shade", "daytime"],
      lat: 27.79,
      lng: -82.6383,
      address: "1825 4th St N, St. Petersburg, FL 33704",
      facing: null,
      feeUSD: 18,
      isFree: false,
      feeNote: "$18 adult; free parking",
      driveMinutes: 35,
      hours: days(open(iv(clk("10:00"), clk("16:30"))), { sun: open(iv(clk("12:00"), clk("16:30"))) }),
      phone: null,
      notes: "1825 4th St N; a century-old ravine garden with flamingos, koi, a rainbow eucalyptus and a wedding lawn. Dense canopy gives lovely open shade so midday works.",
      craft: {
        lightStrategy: "The dense canopy creates soft open shade all day \u2014 midday is workable, which is rare for a garden.",
        whatToShoot: ["flamingos", "rainbow eucalyptus bark", "koi + lily ponds", "portraits on the wedding lawn"],
        signatureShots: [
          { id: "flamingo", label: "Flamingo portrait in soft shade", bestLight: "open-shade" },
          { id: "eucalyptus", label: "Rainbow eucalyptus bark detail", bestLight: "daytime" }
        ],
        compositionTips: ["Fill the frame with the bird or bark texture", "Use the lush green as a clean backdrop"],
        gear: { lens: "70-200mm for flamingos; 35mm for scenes", tripod: false, settingsHint: "f/4, raise ISO under the canopy" },
        ifCloudy: "Even better \u2014 overcast removes harsh dapple."
      },
      media: [],
      logistics: { restrooms: true, feeDetail: "$18 adult, free parking", accessibility: "Paved paths; some slopes" }
    },
    {
      id: "fort-de-soto-park",
      name: "Fort De Soto Park",
      category: "beach",
      city: "Tierra Verde",
      region: "tampa-bay",
      darkSky: true,
      // darkest accessible sky in the bay area — the local astro spot
      bestFor: ["beaches", "Skyway views", "North Beach sunset"],
      bestLight: ["sunset", "sunrise", "night-astro"],
      lat: 27.6396,
      lng: -82.7253,
      address: "3500 Pinellas Bayway S, Tierra Verde, FL 33715",
      facing: 270,
      feeUSD: 6,
      isFree: false,
      feeNote: "$6/car (since 2025) + Pinellas Bayway toll",
      driveMinutes: 50,
      hours: days(open(iv(sr(), ss()))),
      phone: null,
      tideStationId: "8726520",
      notes: "3500 Pinellas Bayway S; 1,136 acres across five keys. North Beach (reopened 2025) is the classic white-sand sunset spot; East Beach faces Tampa Bay with Skyway views.",
      caveats: "Recovering from 2024 hurricanes; North Beach reopened Feb 2025. Gates close at dusk \u2014 Milky Way nights need a campground reservation.",
      craft: {
        lightStrategy: "North Beach faces west for Gulf sunsets; check the tide \u2014 low tide opens up reflective wet sand and tide pools.",
        whatToShoot: ["Gulf sunset over white sand", "Skyway bridge from East Beach", "tide pools + birds"],
        signatureShots: [
          { id: "gulf-sunset", label: "Gulf sunset over wet sand", bestLight: "sunset" },
          { id: "skyway", label: "Sunshine Skyway from East Beach", bestLight: "sunrise" }
        ],
        compositionTips: ["Use wet-sand reflections at low tide", "Find a tide pool or shell for foreground"],
        gear: { lens: "16-35mm", tripod: true, filters: ["ND + grad ND"], settingsHint: "f/11, ISO 100, bracket the sky" },
        ifCloudy: "Shoot the Skyway in moody light, or shells and textures.",
        accessTips: "East Beach is the fallback for shooting the Skyway if the fishing piers are closed."
      },
      media: [],
      logistics: { restrooms: true, feeDetail: "$6/car + Bayway toll", crowdTiming: "Sunsets draw crowds; arrive early for parking" }
    },
    {
      id: "honeymoon-island-sp",
      name: "Honeymoon Island State Park",
      category: "beach",
      city: "Dunedin",
      region: "tampa-bay",
      bestFor: ["driftwood / dead-tree area", "Gulf sunset", "long exposures"],
      bestLight: ["sunset", "evening-golden"],
      lat: 28.0745,
      lng: -82.834,
      address: "1 Causeway Blvd, Dunedin, FL 34698",
      facing: 270,
      feeUSD: 8,
      isFree: false,
      feeNote: "$8/car, $4 single-occupant",
      driveMinutes: 45,
      hours: days(open(iv(clk("08:00"), ss()))),
      phone: null,
      tideStationId: "8726724",
      notes: "1 Causeway Blvd; weathered bare trees on the beach at the north end (Osprey Trail) are the signature subject \u2014 superb at sunset and for long exposures.",
      caveats: 'An erosion "cut" has separated the northernmost mile \u2014 do not wade across.',
      craft: {
        lightStrategy: "Head to the north-end dead-tree area for sunset; the bare driftwood trees make dramatic silhouettes and long-exposure subjects.",
        whatToShoot: ["weathered driftwood trees", "Gulf sunset silhouettes", "long-exposure surf"],
        signatureShots: [
          { id: "driftwood-sunset", label: "Lone dead tree against the sunset", bestLight: "sunset" },
          { id: "long-exposure", label: "Silky surf around the driftwood", bestLight: "evening-golden" }
        ],
        compositionTips: ["Frame a single sculptural tree against the sky", "Use a 1-30s exposure to smooth the surf"],
        gear: { lens: "16-35mm + 70-200mm", tripod: true, filters: ["10-stop ND", "grad ND"], settingsHint: "f/11, ISO 100, ND for long exposure" },
        ifCloudy: "Driftwood + moody surf works in flat light; go black-and-white."
      },
      media: [],
      logistics: { restrooms: true, feeDetail: "$8/car, $4 single occupant", crowdTiming: "Park opens 8am; sunset is busiest" }
    },
    {
      id: "sunshine-skyway-fishing-piers",
      name: "Sunshine Skyway Fishing Piers (South)",
      category: "nature",
      city: "Palmetto",
      region: "tampa-bay",
      bestFor: ["bridge", "fishing", "water"],
      bestLight: ["sunrise", "sunset"],
      lat: 27.621,
      lng: -82.6562,
      address: "South Skyway Fishing Pier, 7901 US-19, Palmetto, FL 34221",
      facing: null,
      feeUSD: 8,
      isFree: false,
      feeNote: "$4/car + $4/person + Skyway toll",
      driveMinutes: 45,
      hours: days(H24),
      phone: null,
      notes: "Old Skyway bridge spans converted to fishing piers. The South Pier (Palmetto side, 7901 US-19) is the longer span and reaches closest to the main bridge \u2014 walk out toward the tip and shoot north along the old roadway into the cables. The shorter North Pier (St. Pete side, 11101 34th St S) also works.",
      caveats: "2025\u201326 closure: access beyond the bait shop is restricted; confirm status before going. If closed, shoot the bridge from Fort De Soto East Beach.",
      craft: {
        lightStrategy: "The soaring Skyway catches gold at both ends of the day; sunrise and sunset both light the cables.",
        whatToShoot: ["Skyway bridge + cables", "anglers in silhouette", "pelicans + water"],
        signatureShots: [{ id: "skyway-cables", label: "Bridge cables glowing at sunrise", bestLight: "sunrise" }],
        compositionTips: ["Use the bridge as a strong diagonal", "Silhouette an angler for human scale"],
        gear: { lens: "24-105mm", tripod: true, settingsHint: "f/8, bracket toward the bright sky" },
        accessTips: "Confirm pier access (2025\u201326 closures). Fall back to Fort De Soto East Beach."
      },
      media: []
    },
    {
      id: "st-pete-pier",
      name: "St. Pete Pier",
      category: "skyline",
      city: "St. Petersburg",
      region: "tampa-bay",
      bestFor: ["skyline", "modern design", "Bending Arc sculpture"],
      bestLight: ["sunrise", "sunset", "blue-hour"],
      lat: 27.7707,
      lng: -82.6198,
      address: "St. Pete Pier, 800 2nd Ave NE, St. Petersburg, FL 33701",
      facing: 100,
      feeUSD: 0,
      isFree: true,
      feeNote: "Free to walk; paid parking ~$2.50/hr",
      driveMinutes: 38,
      hours: days(open(iv(sr(-30), clk("23:00")))),
      phone: null,
      notes: "800 2nd Ave NE; a modern pier with skyline + bay views. Sunrise and sunset are both excellent. (Its 'Bending Arc' net sculpture is currently down \u2014 see caveats.)",
      caveats: "The 'Bending Arc' net sculpture has been down since Hurricane Milton (Oct 2024); as of early 2026 the city aimed to reinstall it within ~6 months \u2014 confirm it's back before making it your subject.",
      craft: {
        lightStrategy: "Sunrise lights the bay to the east; the modern pier architecture and approach lawn shine at blue hour (the Bending Arc, when installed, glows magenta from below).",
        whatToShoot: ["sunrise over the bay", "modern pier architecture + skyline", "the 'Bending Arc' net sculpture (when reinstalled)"],
        signatureShots: [
          { id: "pier-sunrise", label: "Sunrise over the bay from the pier", bestLight: "sunrise" },
          { id: "bending-arc", label: "Bending Arc from below (when reinstalled)", bestLight: "blue-hour" }
        ],
        compositionTips: ["Use the pier rails + walkways as leading lines", "When the net sculpture is up, shoot straight up through it for graphic lines"],
        gear: { lens: "16-35mm + 50mm", tripod: true, settingsHint: "f/11 for sunstars on the pier lights" },
        ifCloudy: "The pier architecture works under any sky.",
        pairWith: ["vinoy-park"]
      },
      media: [],
      logistics: { restrooms: true, feeDetail: "Free entry; paid parking", crowdTiming: "Sunrise is quiet; evenings busy" }
    },
    {
      id: "vinoy-park",
      name: "Vinoy Park & North Straub Park",
      category: "skyline",
      city: "St. Petersburg",
      region: "tampa-bay",
      bestFor: ["waterfront", "palms", "sunrise over the bay"],
      bestLight: ["sunrise", "blue-hour"],
      lat: 27.7793,
      lng: -82.6268,
      address: "Vinoy Park, 701 Bayshore Dr NE, St. Petersburg, FL 33701",
      facing: 90,
      feeUSD: 0,
      isFree: true,
      driveMinutes: 38,
      hours: days(open(iv(sr(-30), clk("23:00")))),
      phone: null,
      notes: "Free waterfront lawns with palms and the Vinoy hotel; great for sunrise over the bay.",
      craft: {
        lightStrategy: "Face east over the bay for sunrise; palms and the historic Vinoy make strong foregrounds.",
        whatToShoot: ["sunrise over the bay", "palms silhouetted at dawn", "the pink Vinoy hotel"],
        signatureShots: [{ id: "palm-sunrise", label: "Palms against a bay sunrise", bestLight: "sunrise" }],
        compositionTips: ["Silhouette palm fronds against the warm sky", "Include a boat or sailmast for scale"],
        gear: { lens: "24-70mm", tripod: true, settingsHint: "Grad ND to hold the sunrise sky" },
        ifCloudy: "Shoot the Vinoy facade or palm details instead.",
        pairWith: ["st-pete-pier"]
      },
      media: []
    },
    {
      id: "dali-museum",
      name: "The Dal\xED Museum",
      category: "architecture",
      city: "St. Petersburg",
      region: "tampa-bay",
      bestFor: ["'Enigma' geodesic glass", "waterfront architecture"],
      bestLight: ["evening-golden", "blue-hour"],
      lat: 27.766,
      lng: -82.6314,
      address: "The Dal\xED Museum, 1 Dali Blvd, St. Petersburg, FL 33701",
      facing: null,
      feeUSD: 0,
      isFree: true,
      feeNote: "Exterior + grounds free; interior ticketed",
      driveMinutes: 38,
      hours: days(open(iv(clk("10:00"), clk("18:00"))), { thu: open(iv(clk("10:00"), clk("20:00"))) }),
      phone: null,
      notes: "1 Dali Blvd; the wild 'Enigma' geodesic glass bubble + waterfront make a great free exterior subject at golden hour. Interior personal photography allowed on the first floor and gardens.",
      caveats: "Strict no-drone zone.",
      craft: {
        lightStrategy: "Golden hour warms the concrete and lights the glass bubble; blue hour with interior lights glowing through the glass is the magic window.",
        whatToShoot: ["the 'Enigma' glass bubble", "the spiral staircase (interior)", "waterfront + museum geometry"],
        signatureShots: [
          { id: "enigma-blue", label: "Glass bubble glowing at blue hour", bestLight: "blue-hour" },
          { id: "spiral", label: "Helical staircase (interior)", bestLight: "daytime" }
        ],
        compositionTips: ["Shoot the bubble against a clean sky", "Use the geometry for symmetry"],
        gear: { lens: "16-35mm", tripod: true, settingsHint: "f/8; balance interior glow vs sky at blue hour" },
        accessTips: "Exterior free anytime; interior photo OK on 1st floor + gardens. No drones."
      },
      media: []
    },
    {
      id: "weedon-island-preserve",
      name: "Weedon Island Preserve",
      category: "nature",
      city: "St. Petersburg",
      region: "tampa-bay",
      bestFor: ["boardwalks", "observation tower", "birds"],
      bestLight: ["sunrise", "morning-golden"],
      lat: 27.8476,
      lng: -82.6012,
      address: "1800 Weedon Dr NE, St. Petersburg, FL 33702",
      facing: null,
      feeUSD: 0,
      isFree: true,
      driveMinutes: 30,
      hours: days(open(iv(clk("07:00"), ss(-15)))),
      phone: null,
      notes: "1800 Weedon Dr NE; 3,000+ acres of mangroves, boardwalks, a 45-ft observation tower and paddling trails. Early morning for birds (roseate spoonbills in season). Pets not allowed.",
      craft: {
        lightStrategy: "Early morning light through the mangroves + active birds; climb the tower for elevated wetland views.",
        whatToShoot: ["mangrove boardwalks", "roseate spoonbills + wading birds", "wetland from the 45-ft tower"],
        signatureShots: [
          { id: "spoonbill", label: "Roseate spoonbill in morning light", bestLight: "morning-golden" },
          { id: "tower-view", label: "Wetland patterns from the tower", bestLight: "sunrise" }
        ],
        compositionTips: ["Long lens for the shy birds", "From the tower, look for abstract water/mangrove patterns"],
        gear: { lens: "100-400mm for birds; 24-70 for scenes", tripod: true, settingsHint: "Fast shutter for birds in flight" },
        ifCloudy: "Soft light is ideal for the mangrove tunnels.",
        pairWith: ["lettuce-lake-park"]
      },
      media: [],
      logistics: { restrooms: true, crowdTiming: "Best at 7am opening for birds and quiet" }
    },
    {
      id: "cathedral-st-peter-episcopal",
      name: "Cathedral Church of St. Peter",
      category: "interiors",
      city: "St. Petersburg",
      region: "tampa-bay",
      bestFor: ["blonde-brick exterior", "scissor-truss ceiling", "stained glass"],
      bestLight: ["daytime"],
      lat: 27.7733,
      lng: -82.6389,
      address: "140 4th St N, St. Petersburg, FL 33701",
      facing: null,
      feeUSD: 0,
      isFree: true,
      driveMinutes: 36,
      hours: days({ open: "call-ahead", note: "Office Mon\u2013Thu 9am\u20134pm. Best chance to see the interior is around service times or by calling the office." }),
      phone: "727-822-4173",
      notes: "140 4th St N; a handsome blonde-brick building with a tall spire, scissor-truss ceiling and stained glass.",
      services: [
        { day: "Sun", time: "08:00", label: "Rite I (chapel)" },
        { day: "Sun", time: "10:15", label: "Rite II" },
        { day: "Wed", time: "12:05", label: "Midweek Eucharist" }
      ],
      craft: {
        lightStrategy: "Interior access is best around service times; midday sun lights the stained glass and the timber scissor-truss ceiling.",
        whatToShoot: ["scissor-truss ceiling", "stained glass", "blonde-brick exterior + spire"],
        signatureShots: [{ id: "truss", label: "Looking up the scissor-truss ceiling", bestLight: "daytime" }],
        compositionTips: ["Shoot straight up for the ceiling geometry", "Exterior: include the spire against blue sky"],
        gear: { lens: "16-35mm", tripod: false, settingsHint: "Brace and shoot wide; high ISO indoors" },
        accessTips: "Call 727-822-4173 (office Mon\u2013Thu 9\u20134) or visit around service times."
      },
      media: []
    },
    {
      id: "cathedral-st-jude-apostle",
      name: "Cathedral of St. Jude the Apostle",
      category: "interiors",
      city: "St. Petersburg",
      region: "tampa-bay",
      bestFor: ["cathedral interior"],
      bestLight: ["daytime"],
      lat: 27.7778,
      lng: -82.7137,
      address: "5815 5th Ave N, St. Petersburg, FL 33710",
      facing: null,
      feeUSD: 0,
      isFree: true,
      driveMinutes: 42,
      hours: days({ open: "call-ahead", note: "Interior most reliably accessible around Mass/adoration times. Thu adoration 11:30am\u20136:30pm is a long reliable window." }),
      phone: "727-347-9702",
      notes: "5815 5th Ave N; seat of the Diocese of St. Petersburg.",
      services: [
        { day: "Mon\u2013Fri", time: "11:00", label: "Mass (cathedral)" },
        { day: "Thu", time: "11:30", label: "Adoration (\u20136:30pm)" },
        { day: "Sun", time: "09:30", label: "Mass" }
      ],
      craft: {
        lightStrategy: "Thursday adoration (11:30am\u20136:30pm) is the longest reliable window for the lit interior.",
        whatToShoot: ["cathedral nave + altar", "modern stained glass"],
        signatureShots: [{ id: "jude-nave", label: "Nave toward the altar", bestLight: "daytime" }],
        compositionTips: ["Center for symmetry; expose for the windows"],
        gear: { lens: "16-35mm", tripod: false, settingsHint: "High ISO; brace on a pew" },
        accessTips: "Call 727-347-9702; aim for Thursday adoration or around Mass."
      },
      media: []
    },
    {
      id: "st-paul-ame",
      name: "St. Paul AME Church (historic \u2014 exterior only)",
      category: "architecture",
      city: "Tampa",
      region: "tampa-bay",
      bestFor: ["red-brick Gothic Revival exterior"],
      bestLight: ["morning-golden", "evening-golden"],
      lat: 27.9536,
      lng: -82.4584,
      address: "506 E Harrison St, Tampa, FL 33602",
      facing: null,
      feeUSD: 0,
      isFree: true,
      driveMinutes: 14,
      hours: days(H24),
      phone: null,
      notes: "506 E Harrison St; the oldest African American church in Tampa (founded 1870; present building 1906\u20131914; MLK visited Nov 1961). Now a community center \u2014 exterior only.",
      caveats: "Not walk-in \u2014 a private community/life center. Exterior subject only.",
      craft: {
        lightStrategy: "Warm low side light at golden hour brings out the red-brick Gothic Revival detail; exterior only.",
        whatToShoot: ["red-brick Gothic Revival facade", "arched windows + spire detail"],
        signatureShots: [{ id: "facade-golden", label: "Brick facade in golden side light", bestLight: "evening-golden" }],
        compositionTips: ["Shoot from across the street for the full facade", "Low angle emphasizes the spire"],
        gear: { lens: "24-70mm", tripod: false, settingsHint: "f/8 for sharp facade detail" },
        accessTips: "Exterior only \u2014 the building is a private community center."
      },
      media: []
    },
    {
      id: "tampa-murals",
      name: "Tampa Murals (Heights / Florida Ave)",
      category: "nature",
      city: "Tampa",
      region: "tampa-bay",
      bestFor: ["street art", "lettering murals", "walkable mural tour"],
      bestLight: ["morning-golden", "open-shade"],
      lat: 27.956,
      lng: -82.4596,
      address: "1102 N Florida Ave, Tampa, FL 33602",
      facing: null,
      feeUSD: 0,
      isFree: true,
      driveMinutes: 14,
      hours: days(H24),
      phone: null,
      notes: "Standouts: the 'Tampa Postcard' mural at 1102 N Florida Ave; 'For the Love of THIS City' at 1001 N Florida Ave; Robertson's Billiards murals on N Franklin St; 'Stay Curious' at the Poe Garage. The Heights Walls program maps dozens more.",
      caveats: "Coordinates are an anchor for the Heights/Florida Ave cluster \u2014 individual murals span several addresses.",
      craft: {
        lightStrategy: "Soft morning light or open shade keeps mural colors saturated and even; avoid harsh midday glare and shadows.",
        whatToShoot: ["the 'Tampa Postcard' lettering mural", "'Stay Curious'", "people interacting with the walls"],
        signatureShots: [{ id: "postcard", label: "'Tampa Postcard' lettering mural", bestLight: "open-shade" }],
        compositionTips: ["Shoot straight-on to keep lettering square", "Add a person for scale and life"],
        gear: { lens: "24-70mm", tripod: false, settingsHint: "Polarizer to cut wall glare; f/8" },
        ifCloudy: "Ideal \u2014 overcast gives the most even mural color."
      },
      media: []
    },
    {
      id: "stpete-shine-murals",
      name: "St. Petersburg Murals (SHINE district)",
      category: "nature",
      city: "St. Petersburg",
      region: "tampa-bay",
      bestFor: ["street art", "walkable mural districts"],
      bestLight: ["morning-golden", "open-shade"],
      lat: 27.7663,
      lng: -82.6629,
      address: "ArtsXchange, 515 22nd St S, St. Petersburg, FL 33712",
      facing: null,
      feeUSD: 0,
      isFree: true,
      driveMinutes: 36,
      hours: days(H24),
      phone: null,
      notes: "The SHINE festival has created ~200 murals since 2015, concentrated in the Central Ave / Warehouse Arts / Grand Central districts. Walkable and free.",
      caveats: "Coordinates anchor the Central Ave / Warehouse Arts district \u2014 murals are spread across it.",
      craft: {
        lightStrategy: "Walk the Central Ave + Warehouse Arts blocks in soft morning light or open shade for saturated, even mural color.",
        whatToShoot: ["large-scale murals", "colorful alley walls", "people + walls"],
        signatureShots: [{ id: "warehouse-wall", label: "Large warehouse-district mural", bestLight: "open-shade" }],
        compositionTips: ["Square up to the wall", "Use a figure for scale"],
        gear: { lens: "24-70mm", tripod: false, settingsHint: "Polarizer; f/8" },
        ifCloudy: "Perfect for even mural light."
      },
      media: []
    },
    {
      id: "fred-howard-park",
      name: "Fred Howard Park",
      category: "beach",
      city: "Tarpon Springs",
      region: "tampa-bay",
      bestFor: ["causeway beach", "Gulf sunset", "kites + wind"],
      bestLight: ["sunset", "evening-golden"],
      lat: 28.1531,
      lng: -82.801,
      address: "1700 Sunset Dr, Tarpon Springs, FL 34689",
      facing: 270,
      feeUSD: 0,
      isFree: true,
      driveMinutes: 55,
      hours: days(open(iv(clk("07:00"), ss()))),
      phone: null,
      tideStationId: "8726724",
      notes: "A causeway beach in Tarpon Springs, west-facing \u2014 good for sunset and kite/wind subjects.",
      craft: {
        lightStrategy: "West-facing causeway beach for clean Gulf sunsets, with open sky and water for big color.",
        whatToShoot: ["Gulf sunset over open water", "kite-surfers + wind", "causeway palms"],
        signatureShots: [{ id: "causeway-sunset", label: "Sunset along the open causeway", bestLight: "sunset" }],
        compositionTips: ["Use the long causeway as a leading line", "Catch kite-surfers as silhouettes"],
        gear: { lens: "16-35mm + 70-200mm", tripod: true, filters: ["grad ND"], settingsHint: "f/11; ND for silky water" },
        ifCloudy: "Shoot wind/kite action or moody water."
      },
      media: []
    }
  ];
  for (const s of SPOTS) {
    const m = SPOT_MEDIA[s.id];
    if (m && m.length) s.media = m;
  }
  var tampa_bay_default = SPOTS;

  // .design-sync/preview-support.tsx
  var import_jsx_runtime = __toESM(require_react_shim(), 1);
  function DSProvider({ children }) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MemoryRouter, { children });
  }
  var byId = (id) => {
    const s = tampa_bay_default.find((x) => x.id === id);
    if (!s) throw new Error(`preview fixture spot missing: ${id}`);
    return s;
  };
  var sampleSpots = {
    /** skyline park with seeded Commons photos — hero/media previews */
    curtisHixon: byId("curtis-hixon-waterfront-park"),
    /** dark-sky beach with tides + facing — MilkyWay/BestDays/SunAlignment */
    fortDeSoto: byId("fort-de-soto-park"),
    /** free 24h skyline walk, facing set — the "plain" card */
    bayshore: byId("bayshore-boulevard")
  };

  // .design-sync/ds-entry.ts
  var ds_entry_exports = {};
  __export(ds_entry_exports, {
    BestDays: () => BestDays,
    Layout: () => Layout,
    MilkyWay: () => MilkyWay,
    SpotCard: () => SpotCard,
    SpotHero: () => SpotHero,
    SpotNotes: () => SpotNotes,
    SunAlignment: () => SunAlignment
  });
  init_define_import_meta_env();

  // src/ui/SpotCard.tsx
  init_define_import_meta_env();
  var import_react2 = __toESM(require_react_shim(), 1);

  // src/spots/types.ts
  init_define_import_meta_env();
  var CATEGORY_COLOR = {
    skyline: "#378ADD",
    rooftop: "#E0922F",
    architecture: "#7F77DD",
    interiors: "#D4537E",
    gardens: "#1D9E75",
    beach: "#D85A30",
    nature: "#888780"
  };

  // src/ui/icons.tsx
  init_define_import_meta_env();

  // node_modules/@tabler/icons-react/dist/esm/tabler-icons-react.mjs
  init_define_import_meta_env();

  // node_modules/@tabler/icons-react/dist/esm/createReactComponent.mjs
  init_define_import_meta_env();
  var import_react = __toESM(require_react_shim(), 1);

  // node_modules/@tabler/icons-react/dist/esm/defaultAttributes.mjs
  init_define_import_meta_env();
  var defaultAttributes = {
    outline: {
      xmlns: "http://www.w3.org/2000/svg",
      width: 24,
      height: 24,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round"
    },
    filled: {
      xmlns: "http://www.w3.org/2000/svg",
      width: 24,
      height: 24,
      viewBox: "0 0 24 24",
      fill: "currentColor",
      stroke: "none"
    }
  };

  // node_modules/@tabler/icons-react/dist/esm/createReactComponent.mjs
  var createReactComponent = (type, iconName, iconNamePascal, iconNode) => {
    const Component4 = (0, import_react.forwardRef)(
      ({ color = "currentColor", size = 24, stroke = 2, title, className, children, ...rest }, ref) => (0, import_react.createElement)(
        "svg",
        {
          ref,
          ...defaultAttributes[type],
          width: size,
          height: size,
          className: [`tabler-icon`, `tabler-icon-${iconName}`, className].join(" "),
          ...type === "filled" ? {
            fill: color
          } : {
            strokeWidth: stroke,
            stroke: color
          },
          ...rest
        },
        [
          title && (0, import_react.createElement)("title", { key: "svg-title" }, title),
          ...iconNode.map(([tag, attrs]) => (0, import_react.createElement)(tag, attrs)),
          ...Array.isArray(children) ? children : [children]
        ]
      )
    );
    Component4.displayName = `${iconNamePascal}`;
    return Component4;
  };

  // node_modules/@tabler/icons-react/dist/esm/icons/IconBeach.mjs
  init_define_import_meta_env();
  var __iconNode = [["path", { "d": "M17.553 16.75a7.5 7.5 0 0 0 -10.606 0", "key": "svg-0" }], ["path", { "d": "M18 3.804a6 6 0 0 0 -8.196 2.196l10.392 6a6 6 0 0 0 -2.196 -8.196", "key": "svg-1" }], ["path", { "d": "M16.732 10c1.658 -2.87 2.225 -5.644 1.268 -6.196c-.957 -.552 -3.075 1.326 -4.732 4.196", "key": "svg-2" }], ["path", { "d": "M15 9l-3 5.196", "key": "svg-3" }], ["path", { "d": "M3 19.25a2.4 2.4 0 0 1 1 -.25a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 1 .25", "key": "svg-4" }]];
  var IconBeach = createReactComponent("outline", "beach", "Beach", __iconNode);

  // node_modules/@tabler/icons-react/dist/esm/icons/IconBuildingCastle.mjs
  init_define_import_meta_env();
  var __iconNode2 = [["path", { "d": "M15 19v-2a3 3 0 0 0 -6 0v2a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1v-14h4v3h3v-3h4v3h3v-3h4v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1", "key": "svg-0" }], ["path", { "d": "M3 11l18 0", "key": "svg-1" }]];
  var IconBuildingCastle = createReactComponent("outline", "building-castle", "BuildingCastle", __iconNode2);

  // node_modules/@tabler/icons-react/dist/esm/icons/IconBuildingChurch.mjs
  init_define_import_meta_env();
  var __iconNode3 = [["path", { "d": "M3 21l18 0", "key": "svg-0" }], ["path", { "d": "M10 21v-4a2 2 0 0 1 4 0v4", "key": "svg-1" }], ["path", { "d": "M10 5l4 0", "key": "svg-2" }], ["path", { "d": "M12 3l0 5", "key": "svg-3" }], ["path", { "d": "M6 21v-7m-2 2l8 -8l8 8m-2 -2v7", "key": "svg-4" }]];
  var IconBuildingChurch = createReactComponent("outline", "building-church", "BuildingChurch", __iconNode3);

  // node_modules/@tabler/icons-react/dist/esm/icons/IconBuildingSkyscraper.mjs
  init_define_import_meta_env();
  var __iconNode4 = [["path", { "d": "M3 21l18 0", "key": "svg-0" }], ["path", { "d": "M5 21v-14l8 -4v18", "key": "svg-1" }], ["path", { "d": "M19 21v-10l-6 -4", "key": "svg-2" }], ["path", { "d": "M9 9l0 .01", "key": "svg-3" }], ["path", { "d": "M9 12l0 .01", "key": "svg-4" }], ["path", { "d": "M9 15l0 .01", "key": "svg-5" }], ["path", { "d": "M9 18l0 .01", "key": "svg-6" }]];
  var IconBuildingSkyscraper = createReactComponent("outline", "building-skyscraper", "BuildingSkyscraper", __iconNode4);

  // node_modules/@tabler/icons-react/dist/esm/icons/IconCalendarEvent.mjs
  init_define_import_meta_env();
  var __iconNode5 = [["path", { "d": "M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12", "key": "svg-0" }], ["path", { "d": "M16 3l0 4", "key": "svg-1" }], ["path", { "d": "M8 3l0 4", "key": "svg-2" }], ["path", { "d": "M4 11l16 0", "key": "svg-3" }], ["path", { "d": "M8 15h2v2h-2l0 -2", "key": "svg-4" }]];
  var IconCalendarEvent = createReactComponent("outline", "calendar-event", "CalendarEvent", __iconNode5);

  // node_modules/@tabler/icons-react/dist/esm/icons/IconFeather.mjs
  init_define_import_meta_env();
  var __iconNode6 = [["path", { "d": "M4 20l10 -10m0 -5v5h5m-9 -1v5h5m-9 -1v5h5m-5 -5l4 -4l4 -4", "key": "svg-0" }], ["path", { "d": "M19 10c.638 -.636 1 -1.515 1 -2.486a3.515 3.515 0 0 0 -3.517 -3.514c-.97 0 -1.847 .367 -2.483 1m-3 13l4 -4l4 -4", "key": "svg-1" }]];
  var IconFeather = createReactComponent("outline", "feather", "Feather", __iconNode6);

  // node_modules/@tabler/icons-react/dist/esm/icons/IconGlassCocktail.mjs
  init_define_import_meta_env();
  var __iconNode7 = [["path", { "d": "M8 21h8", "key": "svg-0" }], ["path", { "d": "M12 15v6", "key": "svg-1" }], ["path", { "d": "M5 5a7 2 0 1 0 14 0a7 2 0 1 0 -14 0", "key": "svg-2" }], ["path", { "d": "M5 5v.388c0 .432 .126 .853 .362 1.206l5 7.509c.633 .951 1.88 1.183 2.785 .517c.191 -.141 .358 -.316 .491 -.517l5 -7.509c.236 -.353 .362 -.774 .362 -1.206v-.388", "key": "svg-3" }]];
  var IconGlassCocktail = createReactComponent("outline", "glass-cocktail", "GlassCocktail", __iconNode7);

  // node_modules/@tabler/icons-react/dist/esm/icons/IconListSearch.mjs
  init_define_import_meta_env();
  var __iconNode8 = [["path", { "d": "M11 15a4 4 0 1 0 8 0a4 4 0 1 0 -8 0", "key": "svg-0" }], ["path", { "d": "M18.5 18.5l2.5 2.5", "key": "svg-1" }], ["path", { "d": "M4 6h16", "key": "svg-2" }], ["path", { "d": "M4 12h4", "key": "svg-3" }], ["path", { "d": "M4 18h4", "key": "svg-4" }]];
  var IconListSearch = createReactComponent("outline", "list-search", "ListSearch", __iconNode8);

  // node_modules/@tabler/icons-react/dist/esm/icons/IconLock.mjs
  init_define_import_meta_env();
  var __iconNode9 = [["path", { "d": "M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6", "key": "svg-0" }], ["path", { "d": "M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0", "key": "svg-1" }], ["path", { "d": "M8 11v-4a4 4 0 1 1 8 0v4", "key": "svg-2" }]];
  var IconLock = createReactComponent("outline", "lock", "Lock", __iconNode9);

  // node_modules/@tabler/icons-react/dist/esm/icons/IconMap2.mjs
  init_define_import_meta_env();
  var __iconNode10 = [["path", { "d": "M12 18.5l-3 -1.5l-6 3v-13l6 -3l6 3l6 -3v7.5", "key": "svg-0" }], ["path", { "d": "M9 4v13", "key": "svg-1" }], ["path", { "d": "M15 7v5.5", "key": "svg-2" }], ["path", { "d": "M21.121 20.121a3 3 0 1 0 -4.242 0c.418 .419 1.125 1.045 2.121 1.879c1.051 -.89 1.759 -1.516 2.121 -1.879", "key": "svg-3" }], ["path", { "d": "M19 18v.01", "key": "svg-4" }]];
  var IconMap2 = createReactComponent("outline", "map-2", "Map2", __iconNode10);

  // node_modules/@tabler/icons-react/dist/esm/icons/IconMoonStars.mjs
  init_define_import_meta_env();
  var __iconNode11 = [["path", { "d": "M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454l0 .008", "key": "svg-0" }], ["path", { "d": "M17 4a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2", "key": "svg-1" }], ["path", { "d": "M19 11h2m-1 -1v2", "key": "svg-2" }]];
  var IconMoonStars = createReactComponent("outline", "moon-stars", "MoonStars", __iconNode11);

  // node_modules/@tabler/icons-react/dist/esm/icons/IconPhoto.mjs
  init_define_import_meta_env();
  var __iconNode12 = [["path", { "d": "M15 8h.01", "key": "svg-0" }], ["path", { "d": "M3 6a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12", "key": "svg-1" }], ["path", { "d": "M3 16l5 -5c.928 -.893 2.072 -.893 3 0l5 5", "key": "svg-2" }], ["path", { "d": "M14 14l1 -1c.928 -.893 2.072 -.893 3 0l3 3", "key": "svg-3" }]];
  var IconPhoto = createReactComponent("outline", "photo", "Photo", __iconNode12);

  // node_modules/@tabler/icons-react/dist/esm/icons/IconPlant2.mjs
  init_define_import_meta_env();
  var __iconNode13 = [["path", { "d": "M2 9a10 10 0 1 0 20 0", "key": "svg-0" }], ["path", { "d": "M12 19a10 10 0 0 1 10 -10", "key": "svg-1" }], ["path", { "d": "M2 9a10 10 0 0 1 10 10", "key": "svg-2" }], ["path", { "d": "M12 4a9.7 9.7 0 0 1 2.99 7.5", "key": "svg-3" }], ["path", { "d": "M9.01 11.5a9.7 9.7 0 0 1 2.99 -7.5", "key": "svg-4" }]];
  var IconPlant2 = createReactComponent("outline", "plant-2", "Plant2", __iconNode13);

  // node_modules/@tabler/icons-react/dist/esm/icons/IconStar.mjs
  init_define_import_meta_env();
  var __iconNode14 = [["path", { "d": "M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873l-6.158 -3.245", "key": "svg-0" }]];
  var IconStar = createReactComponent("outline", "star", "Star", __iconNode14);

  // node_modules/@tabler/icons-react/dist/esm/icons/IconSun.mjs
  init_define_import_meta_env();
  var __iconNode15 = [["path", { "d": "M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0", "key": "svg-0" }], ["path", { "d": "M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7", "key": "svg-1" }]];
  var IconSun = createReactComponent("outline", "sun", "Sun", __iconNode15);

  // node_modules/@tabler/icons-react/dist/esm/icons/IconSunrise.mjs
  init_define_import_meta_env();
  var __iconNode16 = [["path", { "d": "M3 17h1m16 0h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7m-9.7 5.7a4 4 0 0 1 8 0", "key": "svg-0" }], ["path", { "d": "M3 21l18 0", "key": "svg-1" }], ["path", { "d": "M12 9v-6l3 3m-6 0l3 -3", "key": "svg-2" }]];
  var IconSunrise = createReactComponent("outline", "sunrise", "Sunrise", __iconNode16);

  // node_modules/@tabler/icons-react/dist/esm/icons/IconSunset2.mjs
  init_define_import_meta_env();
  var __iconNode17 = [["path", { "d": "M3 13h1", "key": "svg-0" }], ["path", { "d": "M20 13h1", "key": "svg-1" }], ["path", { "d": "M5.6 6.6l.7 .7", "key": "svg-2" }], ["path", { "d": "M18.4 6.6l-.7 .7", "key": "svg-3" }], ["path", { "d": "M8 13a4 4 0 1 1 8 0", "key": "svg-4" }], ["path", { "d": "M3 17h18", "key": "svg-5" }], ["path", { "d": "M7 20h5", "key": "svg-6" }], ["path", { "d": "M16 20h1", "key": "svg-7" }], ["path", { "d": "M12 5v-1", "key": "svg-8" }]];
  var IconSunset2 = createReactComponent("outline", "sunset-2", "Sunset2", __iconNode17);

  // src/ui/icons.tsx
  var CategoryIcon = {
    skyline: IconBuildingSkyscraper,
    rooftop: IconGlassCocktail,
    architecture: IconBuildingCastle,
    interiors: IconBuildingChurch,
    gardens: IconPlant2,
    beach: IconBeach,
    nature: IconFeather
  };

  // src/ui/SpotCard.tsx
  var import_jsx_runtime2 = __toESM(require_react_shim(), 1);
  function SpotCard({
    spot,
    badge,
    reason,
    meta,
    onPress
  }) {
    const nav = useNavigate();
    const [imgFailed, setImgFailed] = (0, import_react2.useState)(false);
    const Icon = CategoryIcon[spot.category];
    const photo = imgFailed ? void 0 : spot.media[0]?.thumb ?? spot.media[0]?.src;
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "spotcard", onClick: onPress ?? (() => nav(`/spot/${spot.id}`)), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "body", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "thumbicon", children: photo ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("img", { src: photo, alt: "", loading: "lazy", decoding: "async", onError: () => setImgFailed(true) }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { size: 22, color: CATEGORY_COLOR[spot.category] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "row-spread", style: { gap: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "nm", children: spot.name }),
          badge && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: `pill ${badge.kind}`, children: badge.label })
        ] }),
        reason && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "sub", children: reason }),
        spot.bestFor.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "cardwhy", children: spot.bestFor.slice(0, 3).join(" \xB7 ") }),
        meta && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "meta", children: meta })
      ] })
    ] }) });
  }

  // src/ui/SpotDetail/SpotHero.tsx
  init_define_import_meta_env();
  var import_react3 = __toESM(require_react_shim(), 1);

  // src/spots/media-specs.ts
  init_define_import_meta_env();
  function cleanCredit(credit) {
    return credit.replace(/^Original uploader was (.+?) at (\S+)$/i, "$1 ($2)");
  }
  function mediaSpecs(m) {
    const parts = [];
    if (m.camera) parts.push(m.camera);
    if (m.focalLengthMm != null) parts.push(`${m.focalLengthMm}mm`);
    if (m.fNumber != null) parts.push(`f/${m.fNumber}`);
    if (m.shutter) parts.push(m.shutter.endsWith("s") ? m.shutter : `${m.shutter}s`);
    if (m.iso != null) parts.push(`ISO ${m.iso}`);
    return parts.length ? parts.join(" \xB7 ") : null;
  }

  // src/ui/SpotDetail/SpotHero.tsx
  var import_jsx_runtime3 = __toESM(require_react_shim(), 1);
  function SpotHero({ media }) {
    const [active, setActive] = (0, import_react3.useState)(0);
    const trackRef = (0, import_react3.useRef)(null);
    if (media.length === 0) {
      return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "hero", style: { background: "var(--amber)" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(IconPhoto, { size: 30 }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "cap", children: "Add your own photo from this spot" })
      ] });
    }
    const onScroll = () => {
      const el = trackRef.current;
      if (!el) return;
      const i = Math.round(el.scrollLeft / el.clientWidth);
      if (i !== active) setActive(Math.max(0, Math.min(media.length - 1, i)));
    };
    const goTo = (i) => {
      const el = trackRef.current;
      if (!el) return;
      setActive(i);
      el.scrollTo?.({ left: i * el.clientWidth, behavior: "smooth" });
    };
    const cur = media[active] ?? media[0];
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "carousel", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "carousel-track", ref: trackRef, onScroll, tabIndex: 0, role: "group", "aria-label": "Spot photos (scroll horizontally)", children: media.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "slide", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("img", { src: m.src, alt: m.caption, loading: i === 0 ? "eager" : "lazy" }) }, m.src + i)) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "slide-cap", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "cap-text", children: cur.caption }),
        mediaSpecs(cur) && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "cap-specs", children: mediaSpecs(cur) }),
        cur.sourceUrl ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("a", { className: "cap-credit", href: cur.sourceUrl, target: "_blank", rel: "noreferrer", children: [
          cleanCredit(cur.credit),
          " \xB7 ",
          cur.license
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "cap-credit", children: [
          cleanCredit(cur.credit),
          " \xB7 ",
          cur.license
        ] })
      ] }),
      media.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "carousel-dots", children: media.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "button",
        {
          className: `dot ${i === active ? "on" : ""}`,
          onClick: () => goTo(i),
          "aria-label": `Photo ${i + 1} of ${media.length}`,
          "aria-current": i === active
        },
        m.src + i
      )) })
    ] });
  }

  // src/ui/Layout.tsx
  init_define_import_meta_env();

  // src/state/store.ts
  init_define_import_meta_env();

  // node_modules/zustand/esm/vanilla.mjs
  init_define_import_meta_env();
  var createStoreImpl = (createState) => {
    let state;
    const listeners = /* @__PURE__ */ new Set();
    const setState = (partial, replace2) => {
      const nextState = typeof partial === "function" ? partial(state) : partial;
      if (!Object.is(nextState, state)) {
        const previousState = state;
        state = (replace2 != null ? replace2 : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
        listeners.forEach((listener) => listener(state, previousState));
      }
    };
    const getState = () => state;
    const getInitialState = () => initialState;
    const subscribe = (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    };
    const api = { setState, getState, getInitialState, subscribe };
    const initialState = state = createState(setState, getState, api);
    return api;
  };
  var createStore = ((createState) => createState ? createStoreImpl(createState) : createStoreImpl);

  // node_modules/zustand/esm/react.mjs
  init_define_import_meta_env();
  var import_react4 = __toESM(require_react_shim(), 1);
  var identity = (arg) => arg;
  function useStore(api, selector = identity) {
    const slice = import_react4.default.useSyncExternalStore(
      api.subscribe,
      import_react4.default.useCallback(() => selector(api.getState()), [api, selector]),
      import_react4.default.useCallback(() => selector(api.getInitialState()), [api, selector])
    );
    import_react4.default.useDebugValue(slice);
    return slice;
  }
  var createImpl = (createState) => {
    const api = createStore(createState);
    const useBoundStore = (selector) => useStore(api, selector);
    Object.assign(useBoundStore, api);
    return useBoundStore;
  };
  var create = ((createState) => createState ? createImpl(createState) : createImpl);

  // node_modules/zustand/esm/middleware.mjs
  init_define_import_meta_env();
  function createJSONStorage(getStorage, options) {
    let storage;
    try {
      storage = getStorage();
    } catch (e) {
      return;
    }
    const persistStorage = {
      getItem: (name) => {
        var _a;
        const parse = (str2) => {
          if (str2 === null) {
            return null;
          }
          return JSON.parse(str2, options == null ? void 0 : options.reviver);
        };
        const str = (_a = storage.getItem(name)) != null ? _a : null;
        if (str instanceof Promise) {
          return str.then(parse);
        }
        return parse(str);
      },
      setItem: (name, newValue) => storage.setItem(name, JSON.stringify(newValue, options == null ? void 0 : options.replacer)),
      removeItem: (name) => storage.removeItem(name)
    };
    return persistStorage;
  }
  var toThenable = (fn) => (input) => {
    try {
      const result = fn(input);
      if (result instanceof Promise) {
        return result;
      }
      return {
        then(onFulfilled) {
          return toThenable(onFulfilled)(result);
        },
        catch(_onRejected) {
          return this;
        }
      };
    } catch (e) {
      return {
        then(_onFulfilled) {
          return this;
        },
        catch(onRejected) {
          return toThenable(onRejected)(e);
        }
      };
    }
  };
  var persistImpl = (config, baseOptions) => (set, get, api) => {
    let options = {
      storage: createJSONStorage(() => window.localStorage),
      partialize: (state) => state,
      version: 0,
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState
      }),
      ...baseOptions
    };
    let hasHydrated = false;
    let hydrationVersion = 0;
    const hydrationListeners = /* @__PURE__ */ new Set();
    const finishHydrationListeners = /* @__PURE__ */ new Set();
    let storage = options.storage;
    if (!storage) {
      return config(
        (...args) => {
          console.warn(
            `[zustand persist middleware] Unable to update item '${options.name}', the given storage is currently unavailable.`
          );
          set(...args);
        },
        get,
        api
      );
    }
    const setItem = () => {
      const state = options.partialize({ ...get() });
      return storage.setItem(options.name, {
        state,
        version: options.version
      });
    };
    const savedSetState = api.setState;
    api.setState = (state, replace2) => {
      savedSetState(state, replace2);
      return setItem();
    };
    const configResult = config(
      (...args) => {
        set(...args);
        return setItem();
      },
      get,
      api
    );
    api.getInitialState = () => configResult;
    let stateFromStorage;
    const hydrate = () => {
      var _a, _b;
      if (!storage) return;
      const currentVersion = ++hydrationVersion;
      hasHydrated = false;
      hydrationListeners.forEach((cb) => {
        var _a2;
        return cb((_a2 = get()) != null ? _a2 : configResult);
      });
      const postRehydrationCallback = ((_b = options.onRehydrateStorage) == null ? void 0 : _b.call(options, (_a = get()) != null ? _a : configResult)) || void 0;
      return toThenable(storage.getItem.bind(storage))(options.name).then((deserializedStorageValue) => {
        if (deserializedStorageValue) {
          if (typeof deserializedStorageValue.version === "number" && deserializedStorageValue.version !== options.version) {
            if (options.migrate) {
              const migration = options.migrate(
                deserializedStorageValue.state,
                deserializedStorageValue.version
              );
              if (migration instanceof Promise) {
                return migration.then((result) => [true, result]);
              }
              return [true, migration];
            }
            console.error(
              `State loaded from storage couldn't be migrated since no migrate function was provided`
            );
          } else {
            return [false, deserializedStorageValue.state];
          }
        }
        return [false, void 0];
      }).then((migrationResult) => {
        var _a2;
        if (currentVersion !== hydrationVersion) {
          return;
        }
        const [migrated, migratedState] = migrationResult;
        stateFromStorage = options.merge(
          migratedState,
          (_a2 = get()) != null ? _a2 : configResult
        );
        set(stateFromStorage, true);
        if (migrated) {
          return setItem();
        }
      }).then(() => {
        if (currentVersion !== hydrationVersion) {
          return;
        }
        postRehydrationCallback == null ? void 0 : postRehydrationCallback(get(), void 0);
        stateFromStorage = get();
        hasHydrated = true;
        finishHydrationListeners.forEach((cb) => cb(stateFromStorage));
      }).catch((e) => {
        if (currentVersion !== hydrationVersion) {
          return;
        }
        postRehydrationCallback == null ? void 0 : postRehydrationCallback(void 0, e);
      });
    };
    api.persist = {
      setOptions: (newOptions) => {
        options = {
          ...options,
          ...newOptions
        };
        if (newOptions.storage) {
          storage = newOptions.storage;
        }
      },
      clearStorage: () => {
        storage == null ? void 0 : storage.removeItem(options.name);
      },
      getOptions: () => options,
      rehydrate: () => hydrate(),
      hasHydrated: () => hasHydrated,
      onHydrate: (cb) => {
        hydrationListeners.add(cb);
        return () => {
          hydrationListeners.delete(cb);
        };
      },
      onFinishHydration: (cb) => {
        finishHydrationListeners.add(cb);
        return () => {
          finishHydrationListeners.delete(cb);
        };
      }
    };
    if (!options.skipHydration) {
      hydrate();
    }
    return stateFromStorage || configResult;
  };
  var persist = persistImpl;

  // src/data/home.config.ts
  init_define_import_meta_env();
  var DEFAULT_HOME = {
    label: "Downtown Tampa",
    address: "Downtown Tampa, Tampa, FL",
    lat: 27.9477,
    lng: -82.4584
  };

  // src/data/regions.ts
  init_define_import_meta_env();

  // src/spots/distance.ts
  init_define_import_meta_env();

  // src/data/regions.ts
  var DEFAULT_REGION = "tampa-bay";
  var REGIONS = {
    "tampa-bay": {
      id: "tampa-bay",
      label: "Tampa Bay",
      timeZone: "America/New_York",
      center: { lat: 27.94, lng: -82.55 },
      bounds: { latMin: 27.4, latMax: 28.3, lngMin: -83, lngMax: -82.25 },
      defaultHome: DEFAULT_HOME
    },
    philadelphia: {
      id: "philadelphia",
      label: "Philadelphia",
      timeZone: "America/New_York",
      center: { lat: 39.9526, lng: -75.1652 },
      bounds: { latMin: 39.8, latMax: 40.15, lngMin: -75.45, lngMax: -74.9 },
      defaultHome: {
        label: "Philadelphia City Hall",
        address: "Philadelphia City Hall, Philadelphia, PA 19107",
        lat: 39.9526,
        lng: -75.1635
      }
    }
  };
  function getRegion(id) {
    return id && REGIONS[id] || REGIONS[DEFAULT_REGION];
  }
  var REGION_LIST = Object.values(REGIONS);
  var REGION_IDS = REGION_LIST.map((r) => r.id);
  function regionContains(region, lat, lng) {
    const b = region.bounds;
    return lat >= b.latMin && lat <= b.latMax && lng >= b.lngMin && lng <= b.lngMax;
  }

  // src/state/store.ts
  function applyTheme(theme) {
    const el = document.documentElement;
    if (theme === "auto") el.removeAttribute("data-theme");
    else el.setAttribute("data-theme", theme);
  }
  var EMPTY_FILTERS = {
    query: "",
    categories: [],
    lights: [],
    openNow: false,
    freeOnly: false,
    wishlistOnly: false,
    maxDriveMin: null,
    sort: "nearest"
  };
  var toggle = (list, id) => list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  function healStaleHome(home) {
    if (!home) return DEFAULT_HOME;
    if (home.label !== "Current location" && !home.address) return DEFAULT_HOME;
    if (/Leona/i.test(home.address ?? "") || /Leona/i.test(home.label)) return DEFAULT_HOME;
    return home;
  }
  var useStore2 = create()(
    persist(
      (set) => ({
        wishlist: [],
        visited: [],
        checklist: {},
        spotNotes: {},
        savedPlans: [],
        filters: EMPTY_FILTERS,
        home: DEFAULT_HOME,
        region: "tampa-bay",
        units: "imperial",
        mapsApp: "apple",
        theme: "auto",
        introSeen: false,
        listsSeenAt: null,
        newClientResponse: false,
        toggleWishlist: (id) => set((s) => ({ wishlist: toggle(s.wishlist, id) })),
        toggleVisited: (id) => set((s) => ({ visited: toggle(s.visited, id) })),
        toggleShot: (spotId, shotId) => set((s) => ({ checklist: { ...s.checklist, [spotId]: toggle(s.checklist[spotId] ?? [], shotId) } })),
        setSpotNote: (spotId, note) => set((s) => {
          const spotNotes = { ...s.spotNotes };
          const trimmed = note.trim();
          if (trimmed) spotNotes[spotId] = trimmed;
          else delete spotNotes[spotId];
          return { spotNotes };
        }),
        savePlan: (plan) => {
          const id = crypto.randomUUID();
          set((s) => ({
            savedPlans: [
              { ...plan, id, createdAt: (/* @__PURE__ */ new Date()).toISOString() },
              ...s.savedPlans
            ].slice(0, 50)
            // sanity cap
          }));
          return id;
        },
        deletePlan: (id) => set((s) => ({ savedPlans: s.savedPlans.filter((p) => p.id !== id) })),
        setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
        resetFilters: () => set({ filters: EMPTY_FILTERS }),
        setHome: (home) => set({ home }),
        setUnits: (units) => set({ units }),
        setMapsApp: (mapsApp) => set({ mapsApp }),
        setTheme: (theme) => {
          applyTheme(theme);
          set({ theme });
        },
        // Switch city; move home to the new region's default unless the current
        // home is already in that region (user's own in-city pin is kept).
        // Unknown ids (stale persisted value, removed city) fall back to default.
        setRegion: (region) => set((s) => {
          const r = REGIONS[region] ?? REGIONS[DEFAULT_REGION];
          const id = REGIONS[region] ? region : DEFAULT_REGION;
          return { region: id, home: regionContains(r, s.home.lat, s.home.lng) ? s.home : r.defaultHome };
        }),
        dismissIntro: () => set({ introSeen: true }),
        markListsSeen: () => set({ listsSeenAt: (/* @__PURE__ */ new Date()).toISOString(), newClientResponse: false }),
        setNewClientResponse: (newClientResponse) => set({ newClientResponse })
      }),
      {
        name: "photo-scout",
        storage: createJSONStorage(() => localStorage),
        version: 1,
        // Filters (search text, chips, sort) are transient session UI — persisting
        // them meant a days-old "Sunset" filter still narrowed Browse on relaunch.
        // The new-response dot is recomputed from the server at each app open.
        partialize: (s) => {
          const { filters: _filters, newClientResponse: _dot, ...rest } = s;
          return rest;
        },
        migrate: (persisted) => {
          const s = persisted;
          if (s && typeof s === "object") s.home = healStaleHome(s.home);
          return s;
        }
      }
    )
  );

  // src/ui/ScrollReset.tsx
  init_define_import_meta_env();
  var import_react5 = __toESM(require_react_shim(), 1);
  function ScrollReset() {
    const { pathname } = useLocation();
    (0, import_react5.useEffect)(() => {
      try {
        window.scrollTo(0, 0);
      } catch {
      }
    }, [pathname]);
    return null;
  }

  // src/ui/Layout.tsx
  var import_jsx_runtime4 = __toESM(require_react_shim(), 1);
  function Tab({ to, icon, label, dot }) {
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(NavLink, { to, end: to === "/", className: ({ isActive }) => isActive ? "active" : "", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "tabicon", children: [
        icon,
        dot && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "tabdot", "aria-hidden": true })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: label })
    ] });
  }
  function Layout() {
    const hasNewResponse = useStore2((s) => s.newClientResponse);
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(ScrollReset, {}),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Outlet, {}),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("nav", { className: "tabbar", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Tab, { to: "/", icon: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(IconSun, { size: 22 }), label: "Today" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Tab, { to: "/browse", icon: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(IconListSearch, { size: 22 }), label: "Browse" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Tab, { to: "/map", icon: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(IconMap2, { size: 22 }), label: "Map" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Tab, { to: "/plan", icon: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(IconCalendarEvent, { size: 22 }), label: "Plan" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Tab, { to: "/saved", icon: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(IconStar, { size: 22 }), label: "Saved", dot: hasNewResponse })
      ] })
    ] });
  }

  // src/ui/SpotDetail/BestDays.tsx
  init_define_import_meta_env();
  var import_react6 = __toESM(require_react_shim(), 1);

  // src/spots/best-days.ts
  init_define_import_meta_env();

  // src/astro/sun-times.ts
  init_define_import_meta_env();
  var import_suncalc = __toESM(require_suncalc(), 1);
  import_suncalc.default.addTime(6, "goldenMorningEnd", "goldenEveningStart");
  import_suncalc.default.addTime(-4, "goldenMorningStart", "goldenEveningEnd");
  function computeSunTimes(date, lat, lng) {
    const t = import_suncalc.default.getTimes(date, lat, lng);
    return {
      sunrise: t.sunrise,
      sunset: t.sunset,
      solarNoon: t.solarNoon,
      goldenHourMorning: { start: t.goldenMorningStart, end: t.goldenMorningEnd },
      goldenHourEvening: { start: t.goldenEveningStart, end: t.goldenEveningEnd },
      blueHourMorning: { start: t.dawn, end: t.goldenMorningStart },
      blueHourEvening: { start: t.goldenEveningEnd, end: t.dusk },
      civilDawn: t.dawn,
      civilDusk: t.dusk,
      nauticalDawn: t.nauticalDawn,
      nauticalDusk: t.nauticalDusk,
      astronomicalDawn: t.nightEnd,
      astronomicalDusk: t.night
    };
  }

  // src/astro/sun-position.ts
  init_define_import_meta_env();
  var import_suncalc2 = __toESM(require_suncalc(), 1);
  function sunPosition(date, lat, lng) {
    const p = import_suncalc2.default.getPosition(date, lat, lng);
    const azimuth = (p.azimuth * 180 / Math.PI + 180 + 360) % 360;
    const elevation = p.altitude * 180 / Math.PI;
    return { azimuth, elevation };
  }

  // src/astro/moon.ts
  init_define_import_meta_env();
  var import_suncalc3 = __toESM(require_suncalc(), 1);
  function moonPhaseName(phase) {
    const x = (phase % 1 + 1) % 1;
    if (x < 0.03 || x > 0.97) return "new";
    if (x < 0.22) return "waxing crescent";
    if (x < 0.28) return "first quarter";
    if (x < 0.47) return "waxing gibbous";
    if (x < 0.53) return "full";
    if (x < 0.72) return "waning gibbous";
    if (x < 0.78) return "last quarter";
    return "waning crescent";
  }
  function moonInfo(date, lat, lng) {
    const ill = import_suncalc3.default.getMoonIllumination(date);
    const times = import_suncalc3.default.getMoonTimes(date, lat, lng);
    const pos = import_suncalc3.default.getMoonPosition(date, lat, lng);
    return {
      phase: ill.phase,
      illumination: Math.round(ill.fraction * 100),
      phaseName: moonPhaseName(ill.phase),
      rise: times.rise ?? null,
      set: times.set ?? null,
      azimuth: (pos.azimuth * 180 / Math.PI + 180 + 360) % 360,
      elevation: pos.altitude * 180 / Math.PI
    };
  }

  // src/spots/hours.ts
  init_define_import_meta_env();

  // src/util/tz.ts
  init_define_import_meta_env();
  var deviceTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
  var WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  function zoneParts(instant, timeZone) {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "short",
      hour12: false
    });
    const p = {};
    for (const part of dtf.formatToParts(instant)) p[part.type] = part.value;
    return {
      year: +p.year,
      month: +p.month,
      day: +p.day,
      hour: p.hour === "24" ? 0 : +p.hour,
      minute: +p.minute,
      second: +p.second,
      weekday: WD[p.weekday] ?? 0
    };
  }
  function offsetMs(instant, timeZone) {
    const z = zoneParts(new Date(instant), timeZone);
    return Date.UTC(z.year, z.month - 1, z.day, z.hour, z.minute, z.second) - instant;
  }
  function zonedWallToInstant(year, month0, day, hour, minute, timeZone) {
    const utcGuess = Date.UTC(year, month0, day, hour, minute);
    const off1 = offsetMs(utcGuess, timeZone);
    let instant = utcGuess - off1;
    const off2 = offsetMs(instant, timeZone);
    if (off2 !== off1) instant = utcGuess - off2;
    return new Date(instant);
  }
  function startOfDayInZone(instant, timeZone) {
    const z = zoneParts(instant, timeZone);
    return zonedWallToInstant(z.year, z.month - 1, z.day, 0, 0, timeZone);
  }
  function fmtClock(d, timeZone) {
    if (!d) return "\u2014";
    const z = zoneParts(d, timeZone ?? deviceTimeZone());
    let h = z.hour % 12;
    if (h === 0) h = 12;
    return `${h}:${String(z.minute).padStart(2, "0")} ${z.hour >= 12 ? "PM" : "AM"}`;
  }

  // src/spots/hours.ts
  var WEEK = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  function resolveTimeRef(ref, dayStart, sun, tz) {
    if (ref.at === "clock") {
      const [h, m] = ref.time.split(":").map(Number);
      const z = zoneParts(dayStart, tz);
      return zonedWallToInstant(z.year, z.month - 1, z.day, h, m, tz);
    }
    const base = ref.at === "sunrise" ? sun.sunrise : sun.sunset;
    return new Date(base.getTime() + (ref.offsetMin ?? 0) * 6e4);
  }
  function dayIntervals(sched, dayStart, sun, tz) {
    if (sched.open === "24h") {
      const z = zoneParts(dayStart, tz);
      return [{ from: dayStart, to: zonedWallToInstant(z.year, z.month - 1, z.day + 1, 0, 0, tz), allDay: true }];
    }
    if (sched.open === "hours") {
      return sched.intervals.map((iv2) => ({
        from: resolveTimeRef(iv2.from, dayStart, sun, tz),
        to: resolveTimeRef(iv2.to, dayStart, sun, tz)
      }));
    }
    return [];
  }
  var weekdayOf = (instant, tz) => WEEK[zoneParts(instant, tz).weekday];
  function resolveOpenStatus(hours, now, sunTimesFor, timeZone = deviceTimeZone()) {
    const tz = timeZone;
    const todaySched = hours.days[weekdayOf(now, tz)];
    if (todaySched.open === "tour-only") return { state: "tour-only" };
    if (todaySched.open === "call-ahead") return { state: "call-ahead" };
    const today = startOfDayInZone(now, tz);
    const todayIv = dayIntervals(todaySched, today, sunTimesFor(today), tz);
    const yest = startOfDayInZone(new Date(today.getTime() - 12 * 3600 * 1e3), tz);
    const yestIv = dayIntervals(hours.days[weekdayOf(yest, tz)], yest, sunTimesFor(yest), tz).filter(
      (iv2) => iv2.to.getTime() > today.getTime()
    );
    const todayAll = [...yestIv, ...todayIv].sort((a, b) => a.from.getTime() - b.from.getTime());
    const current = todayAll.find((iv2) => now.getTime() >= iv2.from.getTime() && now.getTime() < iv2.to.getTime());
    if (current) return { state: "open", closesAt: current.to, allDay: current.allDay };
    for (let offset = 0; offset <= 7; offset++) {
      const day = startOfDayInZone(new Date(today.getTime() + offset * 24 * 3600 * 1e3), tz);
      const sched = hours.days[weekdayOf(day, tz)];
      if (sched.open === "tour-only" || sched.open === "call-ahead") continue;
      const ivs = dayIntervals(sched, day, sunTimesFor(day), tz).sort((a, b) => a.from.getTime() - b.from.getTime());
      const next = ivs.find((iv2) => iv2.from.getTime() > now.getTime());
      if (next) return { state: "closed", opensAt: next.from };
    }
    return { state: "closed", opensAt: null };
  }

  // src/spots/best-days.ts
  function primeWindow(spot) {
    if (spot.category === "interiors" || spot.category === "gardens") return "daytime";
    const primary = spot.bestLight[0];
    if (primary === "evening-golden" || primary === "sunset" || primary === "blue-hour") return "evening";
    if (primary === "morning-golden" || primary === "sunrise") return "morning";
    if (primary === "night-astro") return "night";
    return "daytime";
  }
  function windowTime(kind, t) {
    const mid = (w) => new Date((w.start.getTime() + w.end.getTime()) / 2);
    if (kind === "evening") return mid(t.goldenHourEvening);
    if (kind === "morning") return mid(t.goldenHourMorning);
    if (kind === "night") return t.astronomicalDusk;
    return t.solarNoon;
  }
  function windowTimeFor(spot, date, lat, lng) {
    const tz = getRegion(spot.region).timeZone;
    const day = zonedWallToInstant(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, tz);
    return windowTime(primeWindow(spot), computeSunTimes(day, lat, lng));
  }
  var angDist = (a, b) => {
    const d = ((a - b) % 360 + 360) % 360;
    return d > 180 ? 360 - d : d;
  };
  var clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  function scoreBestDay(spot, date, lat, lng, inputs = {}) {
    const tz = getRegion(spot.region).timeZone;
    const day = zonedWallToInstant(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, tz);
    const t = computeSunTimes(day, lat, lng);
    const kind = primeWindow(spot);
    const wt = windowTime(kind, t);
    const sunTimesFor = (d) => {
      const tt = computeSunTimes(new Date(d.getTime() + 12 * 3600 * 1e3), lat, lng);
      return { sunrise: tt.sunrise, sunset: tt.sunset };
    };
    const open2 = resolveOpenStatus(spot.hours, wt, sunTimesFor, tz).state !== "closed";
    if (!open2) {
      return { date, windowKind: kind, windowStart: wt, score: 6, reasons: ["Closed at the prime window"], open: false, forecast: false };
    }
    const reasons = [];
    let score = 45;
    if (spot.facing != null && (kind === "evening" || kind === "morning")) {
      const sun = sunPosition(wt, lat, lng);
      if (sun.elevation > -2) {
        const align = clamp(1 - angDist(sun.azimuth, spot.facing) / 40, 0, 1);
        score += align * 25;
        if (align >= 0.6) reasons.push("Sun lines up behind the subject");
      }
    }
    let forecast = false;
    if (inputs.skyScore != null) {
      forecast = true;
      score += (inputs.skyScore - 50) / 100 * 30;
      if (inputs.skyScore >= 70) reasons.push(`Strong ${kind === "morning" ? "sunrise" : "sunset"} sky forecast`);
    }
    const moon = moonInfo(day, lat, lng);
    if (kind === "night") {
      score += (1 - moon.illumination / 100) * 20;
      if (moon.illumination <= 10) reasons.push("New moon \u2014 dark skies");
    } else if (kind === "evening" && moon.illumination >= 90 && moon.rise) {
      const dm = Math.abs(moon.rise.getTime() - t.blueHourEvening.end.getTime()) / 6e4;
      if (dm <= 90) {
        score += 10;
        reasons.push("Full moon rises at blue hour");
      }
    }
    if (inputs.lowTideMin != null) {
      score += clamp(1 - inputs.lowTideMin / 90, 0, 1) * 20;
      if (inputs.lowTideMin <= 60) reasons.push("Low tide near golden hour");
    }
    return { date, windowKind: kind, windowStart: wt, score: Math.round(clamp(score, 0, 100)), reasons, open: true, forecast };
  }
  function rankBestDays(spot, dates, lat, lng, inputsFor) {
    return dates.map((d) => scoreBestDay(spot, d, lat, lng, inputsFor?.(d) ?? {})).sort((a, b) => b.score - a.score);
  }

  // src/weather/open-meteo.ts
  init_define_import_meta_env();

  // src/weather/sunset-score.ts
  init_define_import_meta_env();
  var clamp2 = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  function idealBand(x) {
    if (x <= 0) return 0;
    if (x < 30) return x / 30;
    if (x <= 70) return 1;
    return Math.max(0, (100 - x) / 30);
  }
  function combinedCover(mid, high) {
    const m = clamp2(mid / 100, 0, 1);
    const h = clamp2(high / 100, 0, 1);
    return (1 - (1 - m) * (1 - h)) * 100;
  }
  function sunsetScore({ cloudLow, cloudMid, cloudHigh, humidity }) {
    const band = idealBand(combinedCover(cloudMid, cloudHigh));
    const lowPenalty = 1 - 0.7 * clamp2(cloudLow / 100, 0, 1);
    const humidPenalty = 1 - 0.4 * clamp2((humidity - 75) / 25, 0, 1);
    const score01 = clamp2(band * lowPenalty * humidPenalty, 0, 1);
    return Math.round(score01 * 100);
  }

  // src/weather/open-meteo.ts
  var fin = (x, fallback) => typeof x === "number" && Number.isFinite(x) ? x : fallback;
  function hourMs(t) {
    if (typeof t === "number") return t * 1e3;
    return new Date(String(t)).getTime();
  }
  function parseSkyHourly(j) {
    const h = (j ?? {}).hourly ?? {};
    const num = (a) => Array.isArray(a) ? a.map((x) => fin(x, 0)) : [];
    const time = Array.isArray(h.time) ? h.time.map((x) => hourMs(x) / 1e3) : [];
    return { time, low: num(h.cloud_cover_low), mid: num(h.cloud_cover_mid), high: num(h.cloud_cover_high), humidity: num(h.relative_humidity_2m) };
  }
  function skyScoreAt(h, time) {
    if (!h.time.length) return null;
    const target = time.getTime();
    let best = 0, bestD = Infinity;
    h.time.forEach((t, i) => {
      const d = Math.abs(t * 1e3 - target);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (bestD > 12 * 3600 * 1e3) return null;
    return sunsetScore({ cloudLow: h.low[best] ?? 0, cloudMid: h.mid[best] ?? 0, cloudHigh: h.high[best] ?? 0, humidity: h.humidity[best] ?? 0 });
  }
  async function fetchSkyForecast(lat, lng, fetchImpl = fetch) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=cloud_cover_low,cloud_cover_mid,cloud_cover_high,relative_humidity_2m&timeformat=unixtime&timezone=auto&forecast_days=16`;
    const res = await fetchImpl(url);
    if (!res.ok) throw new Error(`weather ${res.status}`);
    return parseSkyHourly(await res.json());
  }

  // src/weather/tides.ts
  init_define_import_meta_env();
  function parseMarineTides(j) {
    const h = (j ?? {}).hourly ?? {};
    const time = Array.isArray(h.time) ? h.time.map((x) => Number(x)).filter((n) => Number.isFinite(n)) : [];
    const height = Array.isArray(h.sea_level_height_msl) ? h.sea_level_height_msl.map((x) => Number(x)) : [];
    return { time, height };
  }
  function lowTideMinutesNear(s, when) {
    const { time, height } = s;
    if (time.length < 3 || height.length < 3) return null;
    const target = when.getTime();
    let best = null;
    for (let i = 1; i < height.length - 1; i++) {
      if (Number.isFinite(height[i]) && height[i] < height[i - 1] && height[i] <= height[i + 1]) {
        const dm = Math.abs(time[i] * 1e3 - target) / 6e4;
        if (best == null || dm < best) best = dm;
      }
    }
    return best == null ? null : Math.round(best);
  }
  async function fetchMarineTides(lat, lng, fetchImpl = fetch) {
    const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&hourly=sea_level_height_msl&timeformat=unixtime&timezone=auto&forecast_days=16`;
    try {
      const res = await fetchImpl(url);
      if (!res.ok) return { time: [], height: [] };
      return parseMarineTides(await res.json());
    } catch {
      return { time: [], height: [] };
    }
  }

  // src/util/format.ts
  init_define_import_meta_env();
  function fmtTime(d, tz) {
    if (tz) return fmtClock(d, tz);
    if (!d) return "\u2014";
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
  }
  function fmtRange(a, b, tz) {
    return `${fmtTime(a, tz)} \u2013 ${fmtTime(b, tz)}`;
  }
  function fmtDay(d, tz) {
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", ...tz ? { timeZone: tz } : {} });
  }

  // src/ui/SpotDetail/BestDays.tsx
  var import_jsx_runtime5 = __toESM(require_react_shim(), 1);
  var chipKind = (score) => score >= 75 ? "go" : score >= 55 ? "maybe" : "info";
  function BestDays({ spot }) {
    const tz = getRegion(spot.region).timeZone;
    const [sky, setSky] = (0, import_react6.useState)(null);
    const [tides, setTides] = (0, import_react6.useState)(null);
    (0, import_react6.useEffect)(() => {
      let alive = true;
      fetchSkyForecast(spot.lat, spot.lng).then((s) => {
        if (alive) setSky(s);
      }).catch(() => {
      });
      if (spot.tideStationId) {
        fetchMarineTides(spot.lat, spot.lng).then((t) => {
          if (alive) setTides(t);
        }).catch(() => {
        });
      }
      return () => {
        alive = false;
      };
    }, [spot.lat, spot.lng, spot.tideStationId]);
    const days2 = (0, import_react6.useMemo)(() => {
      const now = /* @__PURE__ */ new Date();
      const dates = Array.from({ length: 30 }, (_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + i));
      return rankBestDays(spot, dates, spot.lat, spot.lng, (d) => {
        const wt = windowTimeFor(spot, d, spot.lat, spot.lng);
        return {
          skyScore: sky ? skyScoreAt(sky, wt) : null,
          lowTideMin: tides ? lowTideMinutesNear(tides, wt) : null
        };
      }).filter((d) => d.open).slice(0, 5);
    }, [spot, sky, tides]);
    if (!days2.length) return null;
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { className: "h3", children: "Best days this month" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "card list", children: days2.map((d) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "row", style: { alignItems: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "rowleft", style: { flexDirection: "column", alignItems: "flex-start", gap: 2, minWidth: 0 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { fontWeight: 500 }, children: fmtDay(d.date, tz) }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "small tertiary", children: [
            d.reasons.length ? d.reasons.join(" \xB7 ") : "Open \xB7 workable light",
            !d.forecast ? " \xB7 no forecast yet" : ""
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: `pill ${chipKind(d.score)}`, children: d.score })
      ] }, d.date.toISOString())) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: "small tertiary", style: { margin: "6px 2px 0", lineHeight: 1.5 }, children: [
        "Scored on sun alignment, moon",
        tides && tides.time.length ? ", tide" : "",
        " & access; the next ~16 days also factor the weather forecast."
      ] })
    ] });
  }

  // src/ui/SpotDetail/SunAlignment.tsx
  init_define_import_meta_env();
  var import_react7 = __toESM(require_react_shim(), 1);

  // src/spots/sun-align.ts
  init_define_import_meta_env();
  var import_suncalc4 = __toESM(require_suncalc(), 1);
  var angDist2 = (a, b) => {
    const d = ((a - b) % 360 + 360) % 360;
    return d > 180 ? 360 - d : d;
  };
  function sunAlignmentDates(facing, lat, lng, timeZone, from, { toleranceDeg = 2, count = 5, horizonDays = 366, kinds = ["sunrise", "sunset"] } = {}) {
    const hits = [];
    const start = zoneParts(from, timeZone);
    for (let i = 0; i < horizonDays && hits.length < count; i++) {
      const noon = zonedWallToInstant(start.year, start.month - 1, start.day + i, 12, 0, timeZone);
      const times = import_suncalc4.default.getTimes(noon, lat, lng);
      for (const kind of kinds) {
        const at = times[kind];
        if (!at || Number.isNaN(at.getTime()) || at < from) continue;
        const { azimuth } = sunPosition(at, lat, lng);
        const delta = angDist2(azimuth, facing);
        if (delta <= toleranceDeg) hits.push({ at, kind, bearing: azimuth, delta });
      }
    }
    return hits.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, count);
  }

  // src/ui/SpotDetail/SunAlignment.tsx
  var import_jsx_runtime6 = __toESM(require_react_shim(), 1);
  function SunAlignment({ spot, from }) {
    const tz = getRegion(spot.region).timeZone;
    const hits = (0, import_react7.useMemo)(
      () => spot.facing == null ? [] : sunAlignmentDates(spot.facing, spot.lat, spot.lng, tz, from ?? /* @__PURE__ */ new Date()),
      [spot.facing, spot.lat, spot.lng, tz, from]
    );
    if (!hits.length) return null;
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { className: "h3", children: "Sun-behind-the-subject dates" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "card list", children: hits.map((h) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "row", style: { alignItems: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "rowleft", style: { alignItems: "center", gap: 8 }, children: [
          h.kind === "sunset" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(IconSunset2, { size: 16, color: "var(--terracotta)" }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(IconSunrise, { size: 16, color: "var(--gold)" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { fontWeight: 500 }, children: fmtDay(h.at, tz) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "small tertiary", children: [
          h.kind,
          " at ",
          Math.round(h.bearing),
          "\xB0 \xB7 ",
          h.delta < 1 ? "dead on" : `\xB1${Math.round(h.delta)}\xB0`
        ] })
      ] }, h.at.toISOString())) }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: "small tertiary", style: { margin: "6px 2px 0", lineHeight: 1.5 }, children: [
        "The sun ",
        hits[0].kind === "sunset" ? "sets" : "rises",
        " within 2\xB0 of this spot's shooting line on these dates \u2014 henge light."
      ] })
    ] });
  }

  // src/ui/SpotDetail/MilkyWay.tsx
  init_define_import_meta_env();
  var import_react8 = __toESM(require_react_shim(), 1);

  // src/astro/milky-way.ts
  init_define_import_meta_env();
  var import_suncalc5 = __toESM(require_suncalc(), 1);
  var CORE_RA_DEG = 266.4168;
  var CORE_DEC_DEG = -29.0078;
  var rad = (d) => d * Math.PI / 180;
  var deg = (r) => r * 180 / Math.PI;
  function gmstDeg(date) {
    const d = (date.getTime() - Date.UTC(2e3, 0, 1, 12)) / 864e5;
    return ((280.46061837 + 360.98564736629 * d) % 360 + 360) % 360;
  }
  function galacticCoreAltAz(date, lat, lng) {
    const lst = (gmstDeg(date) + lng + 360) % 360;
    const ha = rad((lst - CORE_RA_DEG + 540) % 360 - 180);
    const \u03C6 = rad(lat);
    const \u03B4 = rad(CORE_DEC_DEG);
    const alt = Math.asin(Math.sin(\u03C6) * Math.sin(\u03B4) + Math.cos(\u03C6) * Math.cos(\u03B4) * Math.cos(ha));
    const az = Math.atan2(Math.sin(ha), Math.cos(ha) * Math.sin(\u03C6) - Math.tan(\u03B4) * Math.cos(\u03C6));
    return { altitude: deg(alt), azimuth: (deg(az) + 180 + 360) % 360 };
  }
  var STEP_MIN = 10;
  function coreWindow(nightOf, lat, lng, timeZone, minAltitude = 15) {
    const day = zoneParts(nightOf, timeZone);
    const noon = zonedWallToInstant(day.year, day.month - 1, day.day, 12, 0, timeZone);
    const scanStart = noon.getTime();
    const scanEnd = scanStart + 24 * 36e5;
    let best = null;
    let cur = null;
    for (let t = scanStart; t <= scanEnd; t += STEP_MIN * 6e4) {
      const at = new Date(t);
      const sunAlt = deg(import_suncalc5.default.getPosition(at, lat, lng).altitude);
      const coreAlt = galacticCoreAltAz(at, lat, lng).altitude;
      const good = sunAlt <= -18 && coreAlt >= minAltitude;
      if (good) {
        if (!cur) cur = { start: t, end: t };
        cur.end = t;
      } else if (cur) {
        if (!best || cur.end - cur.start > best.end - best.start) best = cur;
        cur = null;
      }
    }
    if (cur && (!best || cur.end - cur.start > best.end - best.start)) best = cur;
    if (!best || best.end === best.start) return null;
    let peak = best.start;
    let peakAltitude = -90;
    for (let t = best.start; t <= best.end; t += STEP_MIN * 6e4) {
      const alt = galacticCoreAltAz(new Date(t), lat, lng).altitude;
      if (alt > peakAltitude) {
        peakAltitude = alt;
        peak = t;
      }
    }
    const peakDate = new Date(peak);
    const moon = moonInfo(peakDate, lat, lng);
    return {
      start: new Date(best.start),
      end: new Date(best.end),
      peak: peakDate,
      peakAltitude: Math.round(peakAltitude),
      peakAzimuth: Math.round(galacticCoreAltAz(peakDate, lat, lng).azimuth),
      moonIllumination: moon.illumination,
      moonUp: moon.elevation > 0
    };
  }
  function nextCoreWindow(from, lat, lng, timeZone, maxNights = 250) {
    for (let i = 0; i < maxNights; i++) {
      const night = new Date(from.getTime() + i * 864e5);
      const w = coreWindow(night, lat, lng, timeZone);
      if (w && w.end > from) return { window: w, nightsAway: i };
    }
    return null;
  }

  // src/ui/SpotDetail/MilkyWay.tsx
  var import_jsx_runtime7 = __toESM(require_react_shim(), 1);
  var compass = (az) => {
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return dirs[Math.round(az / 45) % 8];
  };
  function MilkyWay({ spot, from }) {
    const astro = spot.darkSky === true;
    const tz = getRegion(spot.region).timeZone;
    const next = (0, import_react8.useMemo)(
      () => astro ? nextCoreWindow(from ?? /* @__PURE__ */ new Date(), spot.lat, spot.lng, tz) : null,
      [astro, from, spot.lat, spot.lng, tz]
    );
    if (!astro || !next) return null;
    const { window: w, nightsAway } = next;
    const moonBad = w.moonUp && w.moonIllumination >= 30;
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h3", { className: "h3", children: "Milky Way core" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "card list", children: [
        nightsAway === 0 ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "row", style: { alignItems: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: "rowleft", style: { alignItems: "center", gap: 8 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(IconMoonStars, { size: 16, color: "var(--gold)" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { style: { fontWeight: 500 }, children: [
              "Tonight \xB7 ",
              fmtRange(w.start, w.end, tz)
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: "small tertiary", children: [
            "peaks ",
            w.peakAltitude,
            "\xB0 ",
            compass(w.peakAzimuth),
            " at ",
            fmtTime(w.peak, tz)
          ] })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "row", style: { alignItems: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: "rowleft", style: { alignItems: "center", gap: 8 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(IconMoonStars, { size: 16, color: "var(--gold)" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { style: { fontWeight: 500 }, children: [
              "Next core window \xB7 ",
              fmtDay(w.start, tz)
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "small tertiary", children: fmtRange(w.start, w.end, tz) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: `small ${moonBad ? "" : "tertiary"}`, style: { margin: "4px 12px 10px", color: moonBad ? "var(--skip-ink)" : void 0 }, children: moonBad ? `${w.moonIllumination}% moon is up \u2014 the core will be washed out; aim for a darker night` : w.moonUp ? `${w.moonIllumination}% moon up \u2014 thin enough to keep shooting` : `${w.moonIllumination}% moon, below the horizon \u2014 dark skies` })
      ] })
    ] });
  }

  // src/ui/SpotDetail/SpotNotes.tsx
  init_define_import_meta_env();
  var import_jsx_runtime8 = __toESM(require_react_shim(), 1);
  function SpotNotes({ spotId }) {
    const note = useStore2((s) => s.spotNotes[spotId] ?? "");
    const setSpotNote = useStore2((s) => s.setSpotNote);
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { className: "h3", children: "My notes" }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        "textarea",
        {
          className: "notesbox",
          "aria-label": "My notes for this spot",
          placeholder: "Gate codes, contacts, the angle that worked \u2014 only you see this.",
          defaultValue: note,
          onChange: (e) => setSpotNote(spotId, e.target.value),
          rows: 3
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("p", { className: "small tertiary", style: { margin: "4px 2px 0", display: "flex", alignItems: "center", gap: 4 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(IconLock, { size: 12 }),
        " Private \u2014 syncs with your account, never shared."
      ] })
    ] });
  }
  return __toCommonJS(bundle_entry_exports);
})();
/*! Bundled license information:

react-router/dist/development/chunk-6CSD65Y2.mjs:
react-router/dist/development/index.mjs:
  (**
   * react-router v7.17.0
   *
   * Copyright (c) Remix Software Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE.md file in the root directory of this source tree.
   *
   * @license MIT
   *)

@tabler/icons-react/dist/esm/defaultAttributes.mjs:
@tabler/icons-react/dist/esm/createReactComponent.mjs:
@tabler/icons-react/dist/esm/icons/IconBeach.mjs:
@tabler/icons-react/dist/esm/icons/IconBuildingCastle.mjs:
@tabler/icons-react/dist/esm/icons/IconBuildingChurch.mjs:
@tabler/icons-react/dist/esm/icons/IconBuildingSkyscraper.mjs:
@tabler/icons-react/dist/esm/icons/IconCalendarEvent.mjs:
@tabler/icons-react/dist/esm/icons/IconFeather.mjs:
@tabler/icons-react/dist/esm/icons/IconGlassCocktail.mjs:
@tabler/icons-react/dist/esm/icons/IconListSearch.mjs:
@tabler/icons-react/dist/esm/icons/IconLock.mjs:
@tabler/icons-react/dist/esm/icons/IconMap2.mjs:
@tabler/icons-react/dist/esm/icons/IconMoonStars.mjs:
@tabler/icons-react/dist/esm/icons/IconPhoto.mjs:
@tabler/icons-react/dist/esm/icons/IconPlant2.mjs:
@tabler/icons-react/dist/esm/icons/IconStar.mjs:
@tabler/icons-react/dist/esm/icons/IconSun.mjs:
@tabler/icons-react/dist/esm/icons/IconSunrise.mjs:
@tabler/icons-react/dist/esm/icons/IconSunset2.mjs:
@tabler/icons-react/dist/esm/tabler-icons-react.mjs:
  (**
   * @license @tabler/icons-react v3.44.0 - MIT
   *
   * This source code is licensed under the MIT license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
window.Vantage=Vantage.__dsMainNs?Object.assign({},Vantage,Vantage.__dsMainNs,{__dsMainNs:undefined}):Vantage;
