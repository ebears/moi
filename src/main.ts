import "./app.css";
import { mount } from "svelte";
import App from "./App.svelte";

// Theme detection: follow OS preference
function applyTheme(dark: boolean) {
  document.body.classList.remove("light-theme", "dark-theme");
  document.body.classList.add(dark ? "dark-theme" : "light-theme");
}
const mq = window.matchMedia("(prefers-color-scheme: dark)");
applyTheme(mq.matches);
mq.addEventListener("change", (e) => applyTheme(e.matches));

const app = mount(App, {
  target: document.getElementById("app")!,
});

export default app;
