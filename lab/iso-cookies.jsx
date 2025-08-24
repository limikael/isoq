/**
 * `useIsoCookieState` is an isomorphic state hook backed by cookies.
 *
 * It works like {@link React.useState}, returning a `[value, setValue]`
 * pair. The difference is that the value is persisted in a cookie,
 * making it available across page reloads, server-side rendering,
 * and client-side navigation.
 *
 * From the programmer’s perspective, it can be used just like `useState`:
 * you don’t need to worry whether your code is running on the server
 * or the client — the hook takes care of reading and writing cookies
 * appropriately in each environment.
 *
 * @param {string} name - The name of the cookie.
 * @param {string} [initialValue] - Optional default value if the cookie does not exist.
 * @returns {[string, (newValue: string) => void]} A stateful value and a setter.
 *
 * @example
 * function ThemeToggle() {
 *   const [theme, setTheme] = useIsoCookieState("theme", "light");
 *
 *   return (
 *     <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
 *       Current theme: {theme}
 *     </button>
 *   );
 * }
 */