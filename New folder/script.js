"use strict";

const $ = id => document.getElementById(id);
const money = cents => "$" + (cents / 100).toFixed(2);

const PRODUCTS = {
  Mini: { name: "Mini · The Memory House", cents: 2500 },
  Grand: { name: "Grand · The Memory House", cents: 3500 }
};

const THEMES = {
  Celebrations: {
    title: "Celebrations",
    caption: "The days you never forget",
    image: "celebrations",
    designs: [
      ["Christmas", "christmas"],
      ["Valentine’s Day", "valentine"],
      ["Wedding Day", "wedding"],
      ["Engagement Day", "engagement"],
      ["Anniversary", "anniversary"],
      ["Honeymoon", "honeymoon"],
      ["Proposal", "proposal"],
      ["Our First Date", "first-date"],
      ["Lovely Home", "home"],
      ["Birthday", "birthday"],
      ["Graduation", "graduation"]
    ]
  },

  "Friends & Family": {
    title: "Friends & family",
    caption: "Your favorite people",
    image: "family",
    designs: [
      ["Vacation", "vacation"],
      ["Family", "family"],
      ["Best Friends", "friends"],
      ["Pets", "pets"]
    ]
  },

  Locations: {
    title: "Locations",
    caption: "Somewhere close to your heart",
    image: "locations",
    designs: [
      ["Paris", "paris"],
      ["Dubai", "dubai"],
      ["Rome", "rome"],
      ["New York City", "new-york"],
      ["Santorini", "santorini"],
      ["London", "london"],
      ["Tokyo", "tokyo"],
      ["Bali", "bali"],
      ["Hawaii", "hawaii"],
      ["Beirut", "beirut"],
      ["Venice", "venice"]
    ]
  },

  Jobs: {
    title: "Passions & jobs",
    caption: "A little celebration of you",
    image: "business",
    designs: [
      ["Doctor", "doctor"],
      ["Lawyer", "lawyer"],
      ["Teacher", "teacher"],
      ["Artist", "artist"],
      ["Business Owner", "business"],
      ["Architect", "architect"],
      ["Engineer", "engineer"],
      ["Dentist", "dentist"],
      ["Chef", "chef"],
      ["Photographer", "photographer"],
      ["Musician", "musician"],
      ["Programmer", "programmer"],
      ["Pilot", "pilot"],
      ["Sports", "sports"],
      ["Hairdresser", "hairdresser"],
      ["Scientist", "scientist"]
    ]
  },

  Custom: {
    title: "Anything customized",
    caption: "Your idea, brought to life",
    image: "custom",
    designs: []
  }
};

const freshOrder = () => ({
  size: "",
  theme: "",
  design: "",
  quantity: 1,
  instructions: "",
  orderId: ""
});

let state = freshOrder();
let step = 0;
let activePage = "shop";
let advanceTimer;
let submittedOrder = null;
let fallbackOrder = null;
let checkoutRevision = 0;

const total = () =>
  (PRODUCTS[state.size]?.cents || 0) * state.quantity;

function choices() {
  if (!THEMES[state.theme]) return [];
  return [
    ...THEMES[state.theme].designs,
    ["Anything customized", "custom"]
  ];
}

function edited() {
  checkoutRevision++;
  submittedOrder = null;
  state.orderId = "";
  fallbackOrder = null;
  $("upload-fallback").hidden = true;
  $("error").textContent = "";
  updateSummary();
}

function updateSummary() {
  $("quantity").textContent = state.quantity;
  $("quantity-minus").disabled = state.quantity <= 1;
  $("quantity-plus").disabled = state.quantity >= 10;
  $("running-total").textContent = state.size ? money(total()) + " · Free delivery" : "";
  $("summary-name").textContent =
    PRODUCTS[state.size]?.name || "The Memory House";
  $("summary-design").textContent = [THEMES[state.theme]?.title, state.design].filter(Boolean).join(" · ");
  $("summary-quantity").textContent = state.quantity;
  $("summary-total").textContent = money(total());
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
    if (!choices().some(([name]) => name === state.design)) {
      return "Choose a design first.";
    }

    if (
      state.design === "Anything customized" &&
      !state.instructions.trim()
    ) {
      return "Tell us about your customized idea first.";
    }
  }

  return "";
}

function showPage(page) {
  if (page === "thank-you" && !submittedOrder) return;

  clearTimeout(advanceTimer);
  activePage = page;

  document.querySelectorAll(".page").forEach(panel => {
    panel.hidden = panel.id !== page;
  });

  if (page !== "shop") {
    history.replaceState(null, "", "#" + page);
    $(page).querySelector("h2")?.focus({ preventScroll: true });
    window.scrollTo?.({top: 0, behavior: "instant"});
  }
}

function showStep(index) {
  clearTimeout(advanceTimer);

  for (let n = 0; n < index; n++) {
    const error = validate(n);

    if (error) {
      showStep(n);
      $("error").textContent = error;
      return;
    }
  }

  step = Math.max(0, Math.min(3, index));
  if (step >= 2) warmPhotoForm();
  window.scrollTo?.({top: 0, behavior: "instant"});
  showPage("shop");

  document.querySelectorAll("[data-step]").forEach(panel => {
    const active = Number(panel.dataset.step) === step;
    panel.hidden = !active;
    panel.classList.remove("enter");

    if (active) {
      
      panel.classList.add("enter");
      panel.scrollTop = 0;
      panel.querySelector("h1,h2")?.focus({ preventScroll: true });
    }
  });

document.querySelectorAll("[data-go]").forEach(button => {
    if (Number(button.dataset.go) === step) {
      button.setAttribute("aria-current", "step");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  $("previous-step").hidden = step === 0;

  $("error").textContent = "";
  updateSummary();
  history.replaceState(null, "", step === 0 ? "#home" : "#create");
}

function advance(index) {
  clearTimeout(advanceTimer);
  advanceTimer = setTimeout(() => showStep(index), 120);
}

function photo(button, image) {
  button.style.setProperty("--photo", `url("assets/${image}.webp")`);
}

function drawThemes() {
  $("theme-grid").replaceChildren();

  Object.entries(THEMES).forEach(([key, theme]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-card";
    button.dataset.theme = key;
    button.setAttribute("aria-pressed", "false");
    photo(button, theme.image);

    const title = document.createElement("strong");
    title.textContent = theme.title;

    const caption = document.createElement("small");
    caption.textContent = theme.caption;

    button.append(title, caption);

    button.addEventListener("click", () => {
      if (state.theme !== key) state.design = "";
      state.theme = key;
      edited();
      selected("[data-theme]", "theme", key);
      drawDesigns();
      advance(2);
    });

    $("theme-grid").append(button);
  });
}

function updateNote() {
  const required =
    state.theme === "Custom" ||
    state.design === "Anything customized";

  $("note-optional").textContent = required
    ? "(required for your custom idea)"
    : "(optional)";

  $("design-hint").textContent = required
    ? "Describe your idea, then tap Anything customized."
    : "Add a note if you like, then tap a design to go to your details.";
}

function drawDesigns() {
  $("design-grid").replaceChildren();

  choices().forEach(([name, image]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "design-card";
    button.dataset.design = name;
    button.setAttribute("aria-pressed", "false");
    photo(button, image);

    const title = document.createElement("strong");
    title.textContent = name;
    button.append(title);

    button.addEventListener("click", () => {
      clearTimeout(advanceTimer);
      state.design = name;
      edited();
      selected("[data-design]", "design", name);
      updateNote();

      const error = validate(2);

      if (error) {
        $("error").textContent = error;
        $("instructions").focus();
        return;
      }

      advance(3);
    });

    $("design-grid").append(button);
  });

  selected("[data-design]", "design", state.design);
  updateNote();
}

function phoneNumber(raw) {
  let digits = raw.replace(/\D/g, "");

  if (raw.trim().startsWith("00")) {
    digits = digits.slice(2);
  }

  if (
    raw.trim().startsWith("+") ||
    raw.trim().startsWith("00")
  ) {
    return "+" + digits;
  }

  if (digits.startsWith("961") && digits.length >= 10) {
    return "+" + digits;
  }

  if (digits.length === 8 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (digits.length === 7 || digits.length === 8) {
    return "+961" + digits;
  }

  return "";
}

function openWhatsApp(message) {
  window.open(
    "https://wa.me/96171963311?text=" + encodeURIComponent(message),
    "_blank",
    "noopener,noreferrer"
  );
}

function photoCount(payload) {
  if (!Array.isArray(payload?.fields)) return null;

  const uploads = payload.fields.filter(
    field => field.type === "FILE_UPLOAD"
  );

  if (!uploads.length) return null;

  let count = 0;

  for (const field of uploads) {
    const files =
      field.answer?.value ??
      field.value ??
      field.answer?.raw;

    if (Array.isArray(files)) count += files.length;
    else if (Array.isArray(files?.files)) count += files.files.length;
    else if (
      files &&
      typeof files === "object" &&
      (files.url || files.name || files.id)
    ) count++;
    else return null;
  }

  return count;
}

function finishOrder(order) {
  submittedOrder = order;
  $("confirmation-reference").textContent = "Order reference: " + order.id;
  showPage("thank-you");
}

let openingPhotoForm = false;
async function openPhotoForm() {
  if (openingPhotoForm) return;
  if (!$("details-form").reportValidity()) return;

  for (let n = 0; n < 3; n++) {
    const error = validate(n);

    if (error) {
      showStep(n);
      $("error").textContent = error;
      return;
    }
  }

  const details = {};

  for (const key of ["name", "phone", "area", "address", "payment"]) {
    details[key] = $(key).value.trim();
  }

  for (const key of ["name", "area", "address"]) {
    if (!details[key]) {
      $("error").textContent = "Please complete your details.";
      $(key).focus();
      return;
    }
  }

  const phone = phoneNumber(details.phone);

  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    $("error").textContent = "Enter a valid phone number, including your country code.";
    $("phone").focus();
    return;
  }

  if (!state.orderId) {
    state.orderId =
      "HF-" +
      Date.now().toString(36).toUpperCase() +
      "-" +
      Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  const product = PRODUCTS[state.size];

  const message = [
    `Order reference: ${state.orderId}`,
    `Product: ${product.name} — بيت الذكريات`,
    `Theme: ${THEMES[state.theme].title}`,
    `Design: ${state.design}`,
    `Quantity: ${state.quantity}`,
    `Unit price: ${money(product.cents)}`,
    `Delivery: Free ($0.00)`,
    `Total: ${money(total())}`,
    `Customer: ${details.name}`,
    `Phone: ${phone}`,
    `Area: ${details.area}`,
    `Address: ${details.address}`,
    `Payment: ${details.payment}`,
    ...(details.payment === "Whish Money"
      ? ["Whish number: +961 71 963 311"]
      : []),
    `Instructions: ${state.instructions.trim() || "None"}`
  ].join("\n");

  const order = {
    id: state.orderId,
    details: message,
    photoCount: null
  };

  fallbackOrder = order;

  const fields = {
    customer_name: details.name,
    customer_phone: phone,
    order_id: order.id,
    order_details: message
  };


  const fallback = () => {
    $("upload-fallback").hidden = false;
    $("upload-fallback").scrollIntoView({ block: "nearest" });
  };

  openingPhotoForm = true;
  const uploadButton = document.querySelector(".submit-order");
  const readyLabel = uploadButton.innerHTML;
  const loadRevision = checkoutRevision;
  uploadButton.disabled = true;
  uploadButton.textContent = "Opening photo upload…";
  $("upload-status").textContent = "Loading your photo form…";
  const resetUpload = () => {
    openingPhotoForm = false;
    uploadButton.disabled = false;
    uploadButton.innerHTML = readyLabel;
    $("upload-status").textContent = "Upload your photos and press Submit in the form to send your order request.";
  };
  await waitForTally();
  if (loadRevision !== checkoutRevision) { resetUpload(); return; }
  if (!window.Tally?.openPopup) { resetUpload(); fallback(); return; }
  const loadTimeout = setTimeout(() => {
    resetUpload();
    $("upload-status").textContent = "The photo form is taking longer than usual. If it hasn’t opened, retry below.";
    fallback();
  }, 12000);

  $("upload-fallback").hidden = true;
  let sent = false;
  const revision = checkoutRevision;

  try {
    window.Tally.openPopup("KYdbyD", {
      layout: "modal",
      width: 640,
      overlay: true,
      hiddenFields: fields,

      onLoad() { clearTimeout(loadTimeout); resetUpload(); $("upload-fallback").hidden = true; },

      onSubmit(payload) {
        clearTimeout(loadTimeout); resetUpload();
        if (sent || revision !== checkoutRevision) return;
        sent = true;
        order.photoCount = photoCount(payload);
        window.Tally.closePopup?.("KYdbyD");
        finishOrder(order);
      },

      onClose() {
        clearTimeout(loadTimeout); resetUpload();
        if (!sent && revision === checkoutRevision) {
          $("error").textContent =
            "Upload your photos and press Submit to continue.";
        }
      }
    });
  } catch {
    clearTimeout(loadTimeout); resetUpload(); fallback();
  }
}


$("previous-step").addEventListener("click", () => showStep(step - 1));


document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    if (button.dataset.page === "home") showStep(0);
    else showPage(button.dataset.page);
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
    advance(1);
  });
});

$("instructions").addEventListener("focus", () => {
  clearTimeout(advanceTimer);
});

$("instructions").addEventListener("input", event => {
  clearTimeout(advanceTimer);
  state.instructions = event.target.value;
  edited();
});

for (const key of ["name", "phone", "area", "address", "payment"]) {
  $(key).addEventListener("input", () => {
    edited();
    $("whish-note").hidden = $("payment").value !== "Whish Money";
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
  openWhatsApp("Hello HEARTIFACT! I’d like a quote for a customized Memory House size.");
});

$("contact-whatsapp").addEventListener("click", () => {
  openWhatsApp("Hello HEARTIFACT! I have an idea for a customized Memory House.");
});

$("fallback-link").addEventListener("click", openPhotoForm);

$("new-order").addEventListener("click", () => {
  state = freshOrder();
  submittedOrder = null;
  fallbackOrder = null;
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
  if (event.target.closest("input,textarea,select,button,a,.memory-gallery")) {
    touchStart = null;
    return;
  }

  const touch = event.touches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
}, { passive: true });

$("slide-area").addEventListener("touchend", event => {
  if (!touchStart || activePage !== "shop") return;

  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  touchStart = null;

  if (Math.abs(dx) < 65 || Math.abs(dx) < Math.abs(dy) * 1.5) return;

  if (dx > 0 && step > 0) showStep(step - 1);
  else if (dx < 0 && step < 3) showStep(step + 1);
}, { passive: true });

window.addEventListener("hashchange", () => {
  const page = location.hash.slice(1);

  if (page === "about" || page === "contact" || page === "faq") showPage(page);
  else if (page === "thank-you" && submittedOrder) showPage(page);
  else showStep(0);
});

// Use only the five supplied photos. Respect motion preferences and allow pausing.
const galleryViews = [
  {
    "src": "assets/product-wedding.jpg",
    "caption": "For your forever kind of love.",
    "alt": "Wedding Memory House featuring a couple, white flowers and golden details"
  },
  {
    "src": "assets/product-christmas.jpg",
    "caption": "Your favorite people. Your coziest memory.",
    "alt": "Christmas Memory House with five family characters, a dog and snowy decorations"
  },
  {
    "src": "assets/product-mothers-day.jpg",
    "caption": "A little house for her biggest love.",
    "alt": "Pink Mother’s Day Memory House showing a mother embracing her son"
  },
  {
    "src": "assets/product-paris.jpg",
    "caption": "Some places stay with you forever.",
    "alt": "Romantic Memory House featuring a couple in Paris and red rose petals"
  },
  {
    "src": "assets/product-baby-girl.jpg",
    "caption": "The beginning of a beautiful little story.",
    "alt": "It’s a Girl Memory House with parents, a newborn baby and pink decorations"
  }
];
let galleryView = 0;
function showGalleryView(index) {
  galleryView = (index + galleryViews.length) % galleryViews.length;
  const view = galleryViews[galleryView];
  $("gallery-image").src = view.src;
  $("gallery-image").getAnimations().forEach(animation => animation.cancel());
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    $("gallery-image").animate([{opacity: .25}, {opacity: 1}], {duration: 240, easing: "ease-out"});
  }
  $("gallery-image").alt = view.alt;
  
}
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
let galleryTimer;
function updateGalleryPlayback() {
  clearInterval(galleryTimer);
  if (document.hidden || motionPreference.matches) return;
  galleryTimer = setInterval(() => {
    if (activePage === "shop" && step === 0) showGalleryView(galleryView + 1);
  }, 2500);
}
document.addEventListener("visibilitychange", updateGalleryPlayback);
motionPreference.addEventListener("change", updateGalleryPlayback);
// Fetch one next photo at a time rather than five originals at page load.
function preloadNextPhoto() {
  if (navigator.connection?.saveData || /(^|-)2g$/.test(navigator.connection?.effectiveType || "")) return;
  const preload = new Image(); preload.src = galleryViews[(galleryView + 1) % galleryViews.length].src;
}
$("gallery-image").addEventListener("load", preloadNextPhoto);
if ($("gallery-image").complete) preloadNextPhoto();

updateGalleryPlayback();


let photoFormWarmed = false;
function warmPhotoForm() {
  if (photoFormWarmed || navigator.connection?.saveData) return;
  photoFormWarmed = true;
  const hint = document.createElement("link");
  hint.rel = "prefetch"; hint.as = "document";
  hint.href = "https://tally.so/popup/KYdbyD";
  document.head.append(hint);
}
function waitForTally() {
  if (window.Tally?.openPopup) return Promise.resolve();
  return new Promise(resolve => {
    const deadline = Date.now() + 8000;
    const timer = setInterval(() => {
      if (window.Tally?.openPopup || Date.now() >= deadline) { clearInterval(timer); resolve(); }
    }, 100);
  });
}

const initialPage = location.hash.slice(1);
drawThemes();
showStep(0);

if (initialPage === "about" || initialPage === "contact" || initialPage === "faq") {
  showPage(initialPage);
}
