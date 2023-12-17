import {
  useIsoRef,
  y
} from "./chunk-TYZ7JE3X.js";

// src/LazyPage.jsx
function LazyPage() {
  let ref = useIsoRef();
  console.log("rendering lazy page, ref=" + ref.current);
  if (!ref.current) {
    ref.current = "hello world";
  }
  return /* @__PURE__ */ y("div", null, "this is a lazy page");
}
export {
  LazyPage as default
};
//# sourceMappingURL=LazyPage-ZIAJH5KD.js.map
