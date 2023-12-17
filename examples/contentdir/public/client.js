import {
  B,
  IsoContext_default,
  IsoErrorBoundary,
  IsoIdRoot,
  Link,
  Route,
  RouterProvider,
  g,
  parseCookie,
  stringifyCookie,
  useIsLoading,
  useLoaderData,
  y
} from "./chunk-TYZ7JE3X.js";

// src/index.jsx
function Home() {
  return /* @__PURE__ */ y("p", null, "This is the home page");
}
function SomePage() {
  let loaderData = useLoaderData();
  console.log("render some page");
  return /* @__PURE__ */ y("p", null, "This is another page, loaderData=", loaderData);
}
SomePage.loader = async () => {
  console.log("Loading some data for some page...");
  await new Promise((r) => setTimeout(r, 1e3));
  return "123";
};
function Main() {
  let loading = useIsLoading();
  let bg = loading ? "#0000ff" : "#ffffff";
  return /* @__PURE__ */ y(g, null, /* @__PURE__ */ y("div", { style: `width: 100%; height: 3px; background-color: ${bg}` }), /* @__PURE__ */ y("div", null, /* @__PURE__ */ y(Link, { href: "/" }, "Home"), "|", /* @__PURE__ */ y(Link, { href: "/somepage" }, "Some Page"), "|", /* @__PURE__ */ y(Link, { href: "/lazypage" }, "Lazy Page")), /* @__PURE__ */ y(Route, { path: "/" }, /* @__PURE__ */ y(Home, null)), /* @__PURE__ */ y(Route, { path: "/somepage", loader: SomePage.loader }, /* @__PURE__ */ y(SomePage, null)), /* @__PURE__ */ y(Route, { path: "/lazypage", lazy: () => import("./LazyPage-ZIAJH5KD.js") }));
}

// ../../src/isoq/IsoqClient.js
var IsoqClient = class {
  constructor(refs) {
    this.refs = refs;
    this.req = new Request(window.location);
    this.cookieDispatcher = new EventTarget();
  }
  getIsoRef(id) {
    return this.refs[id];
  }
  markIsoRefStale(id) {
    delete this.refs[id];
  }
  isSsr() {
    return false;
  }
  getUrl() {
    return window.location;
  }
  redirect(url) {
    window.location = url;
  }
  fetch = async (url, options = {}) => {
    if (url.startsWith("/"))
      url = new URL(this.req.url).origin + url;
    return await fetch(url, options);
  };
  getBarrier(id) {
    return () => {
    };
  }
  unresolveBarrier() {
  }
  getCookie(key) {
    let parsedCookie = parseCookie(window.document.cookie);
    return parsedCookie[key];
  }
  setCookie(key, value, options = {}) {
    document.cookie = stringifyCookie(key, value, options);
    this.cookieDispatcher.dispatchEvent(new Event(key));
  }
};

// ../../src/isoq/DefaultErrorFallback.js
function DefaultErrorFallback({ error }) {
  let style = {
    position: "fixed",
    left: "0",
    top: "0",
    width: "100%",
    height: "100%",
    zOrder: "100",
    backgroundColor: "#000000",
    color: "#ff0000",
    fontSize: "16px",
    fontFamily: "monospace",
    borderStyle: "solid",
    borderWidth: "0.5em",
    borderColor: "#ff0000",
    padding: "0.5em",
    boxSizing: "border-box",
    whiteSpace: "pre"
  };
  let message = error.toString();
  if (error.stack)
    message = error.stack;
  return y("div", { style }, message);
}

// ../../src/isoq/client.jsx
if (!window.__isoError) {
  let isoClient = new IsoqClient(window.__isoRefs);
  let content = /* @__PURE__ */ y(IsoContext_default.Provider, { value: isoClient }, /* @__PURE__ */ y(IsoErrorBoundary, { fallback: DefaultErrorFallback }, /* @__PURE__ */ y(IsoIdRoot, { name: "root" }, /* @__PURE__ */ y(RouterProvider, null, /* @__PURE__ */ y(Main, { ...window.__isoProps })))));
  B(content, document.getElementById("isoq"));
  if (Object.keys(isoClient.refs).length)
    console.log(
      "Warning, unused refs after hydration: ",
      Object.keys(isoClient.refs)
    );
}
//# sourceMappingURL=client.js.map
