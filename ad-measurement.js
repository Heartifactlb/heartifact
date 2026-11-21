"use strict";
(() => {
  const PIXEL = "1004596066030584";
  const KEY = "heartifact-ad-measurement-v1";
  let enabled = false;
  let initialized = false;
  const sentOrders = new Set();
  const readChoice = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  const saveChoice = value => { try { localStorage.setItem(KEY, value); } catch {} };
  const panel = document.createElement("section");
  panel.className = "ad-consent";
  panel.setAttribute("aria-label", "Optional ad measurement");
  panel.innerHTML = '<strong>Optional ad measurement</strong><p>With your permission, Meta receives website activity, browser information and an advertising cookie to measure our ads. We send product selections and completed order requests, never your form answers or photos. You can order without accepting.</p><div><button type="button" data-consent="no">Decline</button><button type="button" data-consent="yes">Allow Meta measurement</button></div>';
  document.body.append(panel);
  const settings = document.createElement("button");
  settings.type = "button";
  settings.className = "ad-consent-settings";
  settings.textContent = "Ad measurement settings";
  document.querySelector("footer").append(document.createElement("br"), settings);
  function enable() {
    if (enabled) return;
    enabled = true;
    if (!initialized) {
      initialized = true;
      const f = window;
      const n = f.fbq = function() { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
      n("consent", "grant");
      n("set", "autoConfig", false, PIXEL);
      n("init", PIXEL);
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.append(script);
    } else window.fbq("consent", "grant");
    window.fbq("track", "PageView");
  }
  function decline() {
    enabled = false;
    if (window.fbq) window.fbq("consent", "revoke");
    for (const cookie of ["_fbp", "_fbc"]) {
      for (const domain of ["", ";domain=" + location.hostname, ";domain=." + location.hostname]) {
        document.cookie = cookie + "=;Max-Age=0;path=/" + domain + ";SameSite=Lax;Secure";
      }
    }
  }
  panel.querySelectorAll("[data-consent]").forEach(button => button.addEventListener("click", () => {
    const value = button.dataset.consent;
    saveChoice(value);
    if (value === "yes") enable(); else decline();
    panel.hidden = true;
  }));
  settings.addEventListener("click", () => { panel.hidden = false; panel.querySelector("button").focus(); });
  const choice = readChoice();
  panel.hidden = choice === "yes" || choice === "no";
  if (choice === "yes") enable();
  window.heartifactMeasure = (event, product, orderId) => {
    if (!enabled || typeof window.fbq !== "function") return;
    if (!["ViewContent", "InitiateCheckout", "Lead"].includes(event)) return;
    if (event === "Lead") {
      if (!orderId || sentOrders.has(orderId)) return;
      sentOrders.add(orderId);
    }
    const params = { content_name: "The Memory House", content_type: "product", currency: "USD" };
    if (product === "Mini" || product === "Grand") params.content_ids = [product];
    // Order requests are leads; no revenue, contact details, notes or photos are transmitted.
    window.fbq("track", event, params);
  };
})();

