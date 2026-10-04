"use strict";

const $ = id => document.getElementById(id);

const PRODUCTS = {
  Mini: { name: "Mini · The Memory House", price: 30 },
  Grand: { name: "Grand · The Memory House", price: 40 }
};

const THEMES = {
  "Special Moments": [
    "Christmas", "Valentine’s Day", "Wedding Day",
    "Engagement Day", "Anniversary", "Honeymoon",
    "Proposal", "Our First Date", "Lovely Home",
    "Birthday", "Graduation", "Anything customized"
  ],
  "Friends & Family": [
    "Vacation", "Family", "Anything customized"
  ],
  Locations: [
    "Paris", "Dubai", "Rome", "New York City",
    "Santorini", "London", "Tokyo", "Bali",
    "Hawaii", "Anything customized"
  ],
  Jobs: [
    "Doctor", "Lawyer", "Teacher", "Artist",
    "Business Owner", "Architect", "Engineer",
    "Anything customized"
  ],
  Custom: ["Anything customized"]
};

const freshOrder = () => ({
  size: "",
  theme: "",
  design: "",
  quantity: 1,
  instructions: "",
  name: "",
  phone: "",
  area: "",
  address: "",
  payment: "Cash",
  orderId: ""
});

let state = freshOrder();
let step = 0;
let activePage = "shop";
let advanceTimer;
let submittedOrder = null;
let fallbackOrder = null;
let whatsappOpened = false;
let photosVerified = false;

const isCustom = () => state.design === "Anything customized";
const total = () => (PRODUCTS[state.size]?.price || 0) * state.quantity;

function edited() {
  state.orderId = "";
  fallbackOrder = null;
  $("upload-fallback").hidden = true;
  $("error").textContent = "";
  updateSummary();
}

function updateSummary() {
  $("quantity").textContent = state.quantity;
  $("running-total").textContent = state.size ? `$${total()}` : "";
  $("summary-name").textContent = PRODUCTS[state.size]?.name || "The Memory House";
  $("summary-quantity").textContent = state.quantity;
  $("summary-total").textContent = `$${total()}`;
}

function selected(selector, key, value) {
  document.querySelectorAll(selector).forEach(button => {
    const active = button.dataset[key] === value;
    button.classList.toggle("selected", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function validate(index) {
  if (index === 0 && !PRODUCTS[state.size]) {
    return "Choose Mini or Grand to start.";
  }

  if (index === 1 && !THEMES[state.theme]) {
    return "Choose your theme first.";
  }

  if (index === 2) {
    if (!THEMES[state.theme]?.includes(state.design)) {
      return "Choose a design first.";
    }

    if (isCustom() && !state.instructions.trim()) {
      return "Tell us about your customized idea first.";
    }
  }

  return "";
}

function showStep(index) {
  clearTimeout(advanceTimer);

  for (let n = 0; n < index; n++) {
    const message = validate(n);

    if (message) {
      showStep(n);
      $("error").textContent = message;
      return;
    }
  }

  const backwards = index < step;
  step = index;
  showPage("shop");

  document.querySelectorAll("[data-step]").forEach(panel => {
    const active = Number(panel.dataset.step) === step;
    panel.hidden = !active;
    panel.classList.remove("enter-forward", "enter-back");

    if (active) {
      void panel.offsetWidth;
      panel.classList.add(backwards ? "enter-back" : "enter-forward");
      panel.scrollTop = 0;
      panel.querySelector("h1,h2")?.focus({ preventScroll: true });
    }
  });

  document.querySelectorAll("[data-go]").forEach(button => {
    const n = Number(button.dataset.go);
    button.classList.toggle("complete", n < step);

    if (n === step) {
      button.setAttribute("aria-current", "step");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  $("flow-hint").textContent = step === 0
    ? "Made for your memories ♡"
    : "Tap a step above to edit your choices";

  $("error").textContent = "";
  updateSummary();

  history.replaceState(null, "", step === 0 ? "#home" : "#create");
}

function showPage(page) {
  if (page === "thank-you" && !whatsappOpened) return;

  clearTimeout(advanceTimer);
  activePage = page;

  document.querySelectorAll(".page").forEach(panel => {
    panel.hidden = panel.id !== page;
  });

  document.querySelectorAll("nav [data-page]").forEach(button => {
    const active = page === "shop"
      ? button.dataset.page === (step === 0 ? "home" : "products")
      : button.dataset.page === page;

    button.classList.toggle("active", active);

    if (active) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  if (page !== "shop") {
    history.replaceState(null, "", `#${page}`);
    $(page).querySelector("h2")?.focus({ preventScroll: true });
  }
}

function slideAfterChoice(index) {
  clearTimeout(advanceTimer);
  advanceTimer = setTimeout(() => showStep(index), 450);
}

function drawDesigns() {
  $("design-grid").replaceChildren();

  (THEMES[state.theme] || []).forEach(design => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "design-card";
    button.dataset.design = design;

    if (design === "Anything customized") {
      button.classList.add("custom-design");
    }

    const icon = document.createElement("span");
    icon.textContent = design === "Anything customized" ? "✧" : "♡";
    icon.setAttribute("aria-hidden", "true");

    const title = document.createElement("strong");
    title.textContent = design;

    button.append(icon, title);

    button.addEventListener("click", () => {
      clearTimeout(advanceTimer);
      state.design = design;

      edited();
      selected("[data-design]", "design", design);
      updateNote();

      if (isCustom() && !state.instructions.trim()) {
        $("error").textContent = "Tell us about your customized idea first.";
        $("instructions").focus();
        return;
      }

      slideAfterChoice(3);
    });

    $("design-grid").append(button);
  });

  selected("[data-design]", "design", state.design);
  updateNote();
}

function updateNote() {
  const required = isCustom() || state.theme === "Custom";

  $("note-optional").textContent = required
    ? "(required for your custom idea)"
    : "(optional)";

  $("design-hint").textContent = required
    ? "Describe your idea, then tap Anything customized to continue."
    : "Add a note if you like, then tap a design to continue.";
}

function phoneNumber(raw) {
  let digits = raw.replace(/\D/g, "");

  if (raw.trim().startsWith("00")) {
    digits = digits.slice(2);
  }

  if (raw.trim().startsWith("+") || raw.trim().startsWith("00")) {
    return `+${digits}`;
  }

  if (digits.startsWith("961") && digits.length >= 10) {
    return `+${digits}`;
  }

  if (digits.length === 8 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (digits.length === 7 || digits.length === 8) {
    return `+961${digits}`;
  }

  return "";
}

function readDetails() {
  for (const key of ["name", "phone", "area", "address", "payment"]) {
    state[key] = $(key).value.trim();
  }
}

function orderDetails() {
  const product = PRODUCTS[state.size];

  return [
    `Product: ${product.name} — بيت الذكريات`,
    `Theme: ${state.theme}`,
    `Design: ${state.design}`,
    `Quantity: ${state.quantity}`,
    `Unit price: $${product.price.toFixed(2)}`,
    `Total: $${total().toFixed(2)}`,
    `Customer: ${state.name}`,
    `Phone: ${phoneNumber(state.phone)}`,
    `Area: ${state.area}`,
    `Address: ${state.address}`,
    `Payment: ${state.payment}`,
    ...(state.payment === "Whish Money"
      ? ["Whish number: +961 71 963 311"]
      : []),
    `Instructions: ${state.instructions.trim() || "None"}`
  ].join("\n");
}

function openWhatsApp(message) {
  window.open(
    `https://wa.me/96171963311?text=${encodeURIComponent(message)}`,
    "_blank",
    "noopener,noreferrer"
  );
}

function uploadedPhotoCount(payload) {
  if (!Array.isArray(payload?.fields)) return null;

  const uploads = payload.fields.filter(field => {
    return field.type === "FILE_UPLOAD";
  });

  if (!uploads.length) return null;

  let count = 0;

  for (const field of uploads) {
    const files =
      field.answer?.value ??
      field.value ??
      field.answer?.raw;

    if (files === null || files === undefined) {
      return null;
    }

    if (Array.isArray(files)) {
      count += files.length;
    } else if (Array.isArray(files.files)) {
      count += files.files.length;
    } else if (
      typeof files === "object" &&
      (files.url || files.name || files.id)
    ) {
      count++;
    } else {
      return null;
    }
  }

  return count;
}

function sendCopy(order, verified) {
  if (!order) return;

  let photoLine;

  if (verified) {
    photoLine = Number.isInteger(order.photoCount)
      ? `Photos submitted: ${order.photoCount}`
      : "Photos submitted in Tally.";
  } else {
    photoLine = "Please match this order with my Tally photo submission.";
  }

  openWhatsApp(
    `Hello HEARTIFACT! ♡\n\n${order.details}\n\n${photoLine}`
  );
}

function showWhatsAppStep(order, verified) {
  submittedOrder = order;
  photosVerified = verified;
  whatsappOpened = false;
  showPage("confirmation");
}

function openPhotoForm() {
  readDetails();

  for (let n = 0; n < 3; n++) {
    const message = validate(n);

    if (message) {
      showStep(n);
      $("error").textContent = message;
      return;
    }
  }

  if (!/^\+[1-9]\d{7,14}$/.test(phoneNumber(state.phone))) {
    $("error").textContent =
      "Please enter a valid phone number. Use your country code if outside Lebanon.";

    $("phone").focus();
    return;
  }

  if (!state.orderId) {
    state.orderId =
      `HF-${Date.now().toString(36).toUpperCase()}-` +
      Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  const order = {
    id: state.orderId,
    details: orderDetails()
  };

  fallbackOrder = order;

  const fields = {
    customer_name: state.name,
    customer_phone: phoneNumber(state.phone),
    order_id: order.id,
    order_details: order.details
  };

  const url = new URL("https://tally.so/r/KYdbyD");

  Object.entries(fields).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  $("fallback-link").href = url.toString();

  const fallback = () => {
    $("upload-fallback").hidden = false;
    $("upload-fallback").scrollIntoView({ block: "nearest" });
  };

  if (!window.Tally?.openPopup) {
    fallback();
    return;
  }

  $("upload-fallback").hidden = true;
  $("error").textContent = "";

  let sent = false;

  try {
    window.Tally.openPopup("KYdbyD", {
      layout: "modal",
      width: 640,
      overlay: true,
      hiddenFields: fields,

      onSubmit: payload => {
        if (sent) return;

        sent = true;
        order.photoCount = uploadedPhotoCount(payload);

        window.Tally.closePopup?.("KYdbyD");
        showWhatsAppStep(order, true);
      },

      onClose: () => {
        if (!sent) {
          $("error").textContent =
            "Upload your photos and press Submit to finish your order.";
        }
      }
    });
  } catch {
    fallback();
  }
}

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    const page = button.dataset.page;

    if (page === "home" || page === "products") {
      showStep(0);
    } else {
      showPage(page);
    }
  });
});

document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => {
    showStep(Number(button.dataset.go));
  });
});

document.querySelectorAll("[data-size]").forEach(button => {
  button.addEventListener("click", () => {
    state.size = button.dataset.size;

    edited();
    selected("[data-size]", "size", state.size);
    slideAfterChoice(1);
  });
});

document.querySelectorAll("[data-theme]").forEach(button => {
  button.addEventListener("click", () => {
    if (state.theme !== button.dataset.theme) {
      state.design = "";
    }

    state.theme = button.dataset.theme;

    edited();
    selected("[data-theme]", "theme", state.theme);
    drawDesigns();
    slideAfterChoice(2);
  });
});

$("instructions").addEventListener("input", event => {
  clearTimeout(advanceTimer);
  state.instructions = event.target.value;
  edited();
});

$("instructions").addEventListener("focus", () => {
  clearTimeout(advanceTimer);
});

for (const key of ["name", "phone", "area", "address", "payment"]) {
  $(key).addEventListener("input", () => {
    state[key] = $(key).value;

    edited();
    $("whish-note").hidden = state.payment !== "Whish Money";
  });
}

function adjustQuantity(change) {
  clearTimeout(advanceTimer);
  state.quantity = Math.max(1, Math.min(10, state.quantity + change));
  edited();
}

$("quantity-minus").addEventListener("click", () => adjustQuantity(-1));
$("quantity-plus").addEventListener("click", () => adjustQuantity(1));

$("details-form").addEventListener("submit", event => {
  event.preventDefault();
  openPhotoForm();
});

$("custom-size").addEventListener("click", () => {
  openWhatsApp(
    "Hello HEARTIFACT! I’d like a quote for a customized Memory House size."
  );
});

$("contact-whatsapp").addEventListener("click", () => {
  openWhatsApp(
    "Hello HEARTIFACT! I have an idea for a customized Memory House."
  );
});

$("send-whatsapp").addEventListener("click", () => {
  if (!submittedOrder) return;

  sendCopy(submittedOrder, photosVerified);
  whatsappOpened = true;
  showPage("thank-you");
});

$("fallback-whatsapp").addEventListener("click", () => {
  if (fallbackOrder) {
    showWhatsAppStep(fallbackOrder, false);
  }
});

$("new-order").addEventListener("click", () => {
  state = freshOrder();
  submittedOrder = null;
  fallbackOrder = null;
  whatsappOpened = false;
  photosVerified = false;

  $("details-form").reset();
  $("instructions").value = "";
  $("whish-note").hidden = true;

  selected("[data-size]", "size", "");
  selected("[data-theme]", "theme", "");

  drawDesigns();
  edited();
  showStep(0);
});

let touchStart = null;

$("slide-area").addEventListener("touchstart", event => {
  if (event.target.closest("input,textarea,select,button,a")) {
    touchStart = null;
    return;
  }

  const touch = event.touches[0];

  touchStart = {
    x: touch.clientX,
    y: touch.clientY
  };
}, { passive: true });

$("slide-area").addEventListener("touchend", event => {
  if (!touchStart || activePage !== "shop") return;

  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;

  touchStart = null;

  if (Math.abs(dx) < 65 || Math.abs(dx) < Math.abs(dy) * 1.5) {
    return;
  }

  if (dx > 0 && step > 0) {
    showStep(step - 1);
  } else if (dx < 0 && step < 3) {
    showStep(step + 1);
  }
}, { passive: true });

window.addEventListener("hashchange", () => {
  const page = location.hash.slice(1);

  if (page === "about" || page === "contact") {
    showPage(page);
  } else if (page === "confirmation" && submittedOrder) {
    showPage(page);
  } else if (page === "thank-you" && whatsappOpened) {
    showPage(page);
  } else {
    showStep(0);
  }
});

const initialPage = location.hash.slice(1);

updateSummary();
showStep(0);

if (["about", "contact"].includes(initialPage)) {
  showPage(initialPage);
}