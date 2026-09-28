import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  document.body.innerHTML =
    '<div style="padding:2rem;font-family:sans-serif;">#root 요소를 찾을 수 없습니다.</div>';
} else {
  try {
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  } catch (err) {
    rootEl.innerHTML = `<div style="padding:2rem;font-family:sans-serif;max-width:32rem;">
      <p><strong>앱을 불러오지 못했습니다.</strong></p>
      <p data-error-message style="color:#666;font-size:0.875rem;"></p>
      <p style="margin-top:1rem;"><a href="/">새로고침</a></p>
    </div>`;
    // 오류 메시지는 HTML로 해석되지 않도록 텍스트로 넣는다
    const messageEl = rootEl.querySelector("[data-error-message]");
    if (messageEl) {
      messageEl.textContent = err instanceof Error ? err.message : String(err);
    }
    console.error("App mount error:", err);
  }
}
