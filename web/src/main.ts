import "./app.css";
import { mount } from "svelte";
import App from "./App.svelte";

const target = document.getElementById("app");
if (target === null) throw new Error("#app 要素が見つかりません");
const app = mount(App, { target });

export default app;
