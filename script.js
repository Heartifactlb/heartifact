"use strict";

const TALLY_FORM = "https://tally.so/r/KYdbyD";
const WHATSAPP_NUMBER = "96171963311";
const WHISH_NUMBER = "+961 71 963 311";
const STORAGE_KEY = "heartifactStepOrderV1";
const PRODUCTS = {
    Small: { name: "Small la casa de la memoria — بيت الذكريات", dimensions: "20 × 20 cm", price: 30 },
    Large: { name: "Large la casa de la memoria — بيت الذكريات", dimensions: "30 × 30 cm", price: 40 }
};
const THEMES = {
    "Special Moments": ["Christmas", "Valentine's Day", "Wedding Day", "Engagement Day", "Anniversary", "Honeymoon", "Proposal", "Our First Date", "Lovely Home", "Birthday", "Graduation", "Any Moment You Want"],
    "Friends & Family": ["Vacation", "Family", "Any Memory You Want"],
    Locations: ["Paris", "Dubai", "Rome", "New York City", "Santorini", "London", "Tokyo", "Bali", "Hawaii", "Any Location You Choose"],
    Jobs: ["Doctor", "Lawyer", "Teacher", "Artist", "Business Owner", "Architect", "Engineer", "Any Job You Want"]
};
const STEPS = [
    ["Choose your size", "Select Small or Large to start your story."],
    ["Choose your theme", "What would you like your HEARTIFACT to celebrate?"],
    ["Choose your design", "Pick your design and quantity."],
    ["Make it personal", "Tell us the details that make your piece yours."],
    ["Your delivery details", "Tell us where to deliver your HEARTIFACT."],
    ["Choose your payment", "Select Cash on delivery or Whish Money."],
    ["Review your order", "Check your details, then continue to upload your photos."]
];
const $ = id => document.getElementById(id);
let step = 0;
let designPage = 0;
let submittedOrder = null;
let fallbackOrder = null;
let state = { size: "", theme: "", design: "", quantity: 1, instructions: "", name: "", phone: "", area: "", address: "", payment: "", orderId: "" };

try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
    if (saved && typeof saved === "object") {
        for (const key of Object.keys(state)) {
            if (typeof saved[key] === typeof state[key]) state[key] = saved[key];
        }
        if (!Object.hasOwn(PRODUCTS, state.size)) state.size = "";
        if (!Object.hasOwn(THEMES, state.theme)) state.theme = "";
        if (!THEMES[state.theme]?.includes(state.design)) state.design = "";
        if (!["Cash", "Whish Money"].includes(state.payment)) state.payment = "";
        if (!Number.isInteger(state.quantity) || state.quantity < 1 || state.quantity > 10) state.quantity = 1;
    }
} catch { /* The form still works without browser storage. */ }

function saveState() {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Keep the current order in memory. */ }
}
function changed() {
    state.orderId = "";
    fallbackOrder = null;
    $("upload-fallback").hidden = true;
    $("step-error").textContent = "";
    saveState();
    updateTotal();
}
function total() { return (PRODUCTS[state.size]?.price || 0) * state.quantity; }
function updateTotal() { $("running-total").textContent = `$${total().toFixed(2)}`; }
function showPage(page, updateHash = true) {
    if (!["home", "products", "about", "contact", "confirmation"].includes(page)) page = "home";
    if (page === "confirmation" && !submittedOrder) page = "home";
    document.querySelectorAll(".screen").forEach(screen => { screen.hidden = screen.id !== page; });
    document.querySelectorAll("nav [data-page]").forEach(button => {
        const active = button.dataset.page === page;
        button.classList.toggle("active", active);
        if (active) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
    });
    if (updateHash) history.replaceState(null, "", `#${page}`);
    const screen = $(page);
    screen.querySelector(".screen-body").scrollTop = 0;
    screen.querySelector("h1, h2").focus({ preventScroll: true });
}
function showStep(index) {
    step = index;
    document.querySelectorAll("[data-step]").forEach(panel => { panel.hidden = Number(panel.dataset.step) !== step; });
    $("step-count").textContent = `STEP ${step + 1} OF ${STEPS.length}`;
    $("step-title").textContent = STEPS[step][0];
    $("step-description").textContent = STEPS[step][1];
    $("step-progress").value = step + 1;
    $("back-button").textContent = step === 0 ? "← Home" : "← Back";
    $("next-button").textContent = step === 6 ? "Upload photos →" : "Next →";
    $("step-error").textContent = "";
    $("step-body").scrollTop = 0;
    if (step === 6) renderSummary();
    updateTotal();
    $("step-title").focus({ preventScroll: true });
}
function populateDesigns() {
    const designs = THEMES[state.theme] || [];
    const pages = Math.max(1, Math.ceil(designs.length / 4));
    designPage = Math.min(designPage, pages - 1);
    const grid = $("design-grid");
    grid.replaceChildren();
    designs.slice(designPage * 4, designPage * 4 + 4).forEach(design => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "choice design-card";
        card.dataset.design = design;
        const icon = document.createElement("span");
        icon.className = "design-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = state.theme === "Locations" ? "◇" : state.theme === "Jobs" ? "✦" : "♡";
        const title = document.createElement("strong");
        title.textContent = design;
        const caption = document.createElement("small");
        caption.textContent = design.startsWith("Any ") ? "Your custom idea" : "Made around your story";
        card.append(icon, title, caption);
        card.addEventListener("click", () => {
            state.design = design;
            $("design").value = design;
            selectButtons("[data-design]", design, "design");
            changed();
        });
        grid.append(card);
    });
    $("design").value = state.design;
    selectButtons("[data-design]", state.design, "design");
    $("design-page").textContent = `${designPage + 1} / ${pages}`;
    $("previous-designs").disabled = designPage === 0;
    $("more-designs").disabled = designPage >= pages - 1;
}
function selectButtons(selector, value, attribute) {
    document.querySelectorAll(selector).forEach(button => {
        const selected = button.dataset[attribute] === value;
        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", String(selected));
    });
}
function normalizedPhone(raw) {
    let digits = raw.replace(/\D/g, "");
    if (raw.trim().startsWith("00")) digits = digits.slice(2);
    if (raw.trim().startsWith("+") || raw.trim().startsWith("00")) return `+${digits}`;
    if (digits.startsWith("961") && digits.length >= 10) return `+${digits}`;
    if (digits.length === 8 && digits.startsWith("0")) digits = digits.slice(1);
    if (digits.length === 7 || digits.length === 8) return `+961${digits}`;
    return "";
}
function validate(index) {
    if (index === 0 && !Object.hasOwn(PRODUCTS, state.size)) return "Please choose Small or Large.";
    if (index === 1 && !Object.hasOwn(THEMES, state.theme)) return "Please choose a theme.";
    if (index === 2) {
        if (!THEMES[state.theme]?.includes(state.design)) return "Please choose a design.";
        if (!Number.isInteger(state.quantity) || state.quantity < 1 || state.quantity > 10) return "Quantity must be a whole number from 1 to 10.";
    }
    if (index === 3 && state.design.startsWith("Any ") && !state.instructions.trim()) return "Please describe your custom idea.";
    if (index === 4) {
        if (!state.name.trim()) return "Please enter your full name.";
        if (!/^\+[1-9]\d{7,14}$/.test(normalizedPhone(state.phone))) return "Enter a valid phone number, including the country code if outside Lebanon.";
        if (!state.area.trim()) return "Please enter your area or city.";
        if (!state.address.trim()) return "Please enter your full delivery address.";
    }
    if (index === 5 && !["Cash", "Whish Money"].includes(state.payment)) return "Please select a payment method.";
    return "";
}
function nextStep() {
    for (let index = 0; index <= Math.min(step, 5); index++) {
        const error = validate(index);
        if (error) {
            showStep(index);
            $("step-error").textContent = error;
            return;
        }
    }
    if (step < 6) showStep(step + 1); else openPhotoForm();
}
function orderDetails() {
    const product = PRODUCTS[state.size];
    return [
        `ORDER: ${state.orderId || "Not submitted yet"}`,
        `Product: ${product.name}`,
        `Dimensions: ${product.dimensions}`,
        `Theme: ${state.theme}`,
        `Design: ${state.design}`,
        `Quantity: ${state.quantity}`,
        `Unit price: $${product.price.toFixed(2)}`,
        `TOTAL: $${total().toFixed(2)}`,
        "Delivery: FREE across Lebanon",
        "Estimated time: 4–5 business days",
        `Customer: ${state.name}`,
        `Phone: ${normalizedPhone(state.phone)}`,
        `Area: ${state.area}`,
        `Address: ${state.address}`,
        `Payment: ${state.payment}`,
        ...(state.payment === "Whish Money" ? [`Whish number: ${WHISH_NUMBER}`] : []),
        `Instructions: ${state.instructions.trim() || "None"}`
    ].join("\n");
}
function renderSummary() {
    const box = $("order-summary");
    box.replaceChildren();
    const heading = document.createElement("h3");
    heading.textContent = "Your HEARTIFACT";
    const details = document.createElement("p");
    details.textContent = orderDetails();
    const amount = document.createElement("div");
    amount.className = "total";
    const label = document.createElement("span"); label.textContent = "Total";
    const value = document.createElement("span"); value.textContent = `$${total().toFixed(2)}`;
    amount.append(label, value);
    box.append(heading, details, amount);
}
function openPhotoForm() {
    if (!state.orderId) {
        state.orderId = `HF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    }
    saveState();
    const url = new URL(TALLY_FORM);
    url.searchParams.set("customer_name", state.name.trim());
    url.searchParams.set("customer_phone", normalizedPhone(state.phone));
    url.searchParams.set("order_id", state.orderId);
    url.searchParams.set("order_details", orderDetails());
    const details = orderDetails();
    const order = { id: state.orderId, details };
    fallbackOrder = order;
    $("fallback-form-link").href = url.toString();
    if (!window.Tally || typeof window.Tally.openPopup !== "function") {
        showUploadFallback("Use Open photo form below, or try Upload photos again.");
        return;
    }
    $("upload-fallback").hidden = true;
    let formSubmitted = false;
    try {
        window.Tally.openPopup("KYdbyD", {
            layout: "modal", width: 640, overlay: true,
            hiddenFields: {
                customer_name: state.name.trim(),
                customer_phone: normalizedPhone(state.phone),
                order_id: state.orderId,
                order_details: details
            },
            onSubmit: () => {
                if (formSubmitted) return;
                formSubmitted = true;
                submittedOrder = order;
                $("confirmed-order").textContent = `Order ${order.id}`;
                $("whatsapp-status").textContent = "Tap the button, then press Send in WhatsApp. Photos are saved in Tally; this message includes the matching order number.";
                if (typeof window.Tally.closePopup === "function") window.Tally.closePopup("KYdbyD");
                showPage("confirmation");
            },
            onClose: () => {
                if (!formSubmitted) $("step-error").textContent = "Photo form closed. Upload your photos and press Submit to finish your order.";
            }
        });
    } catch {
        showUploadFallback("Use Open photo form below to finish your upload.");
    }
}
function showUploadFallback(message) {
    $("upload-fallback").hidden = false;
    $("step-error").textContent = message;
    $("upload-fallback").scrollIntoView({ block: "nearest" });
}
function sendOrderCopy(order, submitted = true) {
    if (!order) return;
    openWhatsApp(`Hello HEARTIFACT! ♡\nHere is my order copy.\n\n${order.details}\n\nReference photos: ${submitted ? "submitted through the Tally photo form" : "please match with my Tally photo submission"}.\nMatch the photos using order number ${order.id}.`);
}
function openWhatsApp(message) {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
}

document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
        if (button.dataset.page === "products") showStep(0);
        showPage(button.dataset.page);
    });
});
document.querySelectorAll("[data-size]").forEach(button => {
    button.addEventListener("click", () => {
        state.size = button.dataset.size;
        selectButtons("[data-size]", state.size, "size");
        changed();
    });
});
document.querySelectorAll("[data-theme]").forEach(button => {
    button.addEventListener("click", () => {
        if (state.theme !== button.dataset.theme) { state.design = ""; designPage = 0; }
        state.theme = button.dataset.theme;
        selectButtons("[data-theme]", state.theme, "theme");
        populateDesigns(); changed();
    });
});
document.querySelectorAll("[data-payment]").forEach(button => {
    button.addEventListener("click", () => {
        state.payment = button.dataset.payment;
        selectButtons("[data-payment]", state.payment, "payment"); changed();
    });
});
const INPUTS = { design: "design", quantity: "quantity", instructions: "instructions", "customer-name": "name", "customer-phone": "phone", "customer-area": "area", "customer-address": "address" };
for (const [id, key] of Object.entries(INPUTS)) {
    $(id).addEventListener("input", event => {
        state[key] = key === "quantity" ? Number(event.target.value) : event.target.value;
        changed();
    });
}
document.querySelectorAll("[data-custom]").forEach(button => button.addEventListener("click", () => {
    openWhatsApp(button.dataset.custom === "size" ? "Hello HEARTIFACT! I would like a quote for a custom size." : "Hello HEARTIFACT! I have a custom idea I would like to discuss.");
}));
$("whatsapp-summary").addEventListener("click", () => openWhatsApp(`Hello HEARTIFACT! I have a question about this planned order:\n\n${orderDetails()}`));
$("back-button").addEventListener("click", () => { if (step > 0) showStep(step - 1); else showPage("home"); });
$("next-button").addEventListener("click", nextStep);
$("send-whatsapp").addEventListener("click", () => {
    sendOrderCopy(submittedOrder);
    $("whatsapp-status").textContent = "WhatsApp opened. Press Send in our chat to deliver your order copy.";
});
$("fallback-whatsapp").addEventListener("click", () => {
    if (confirm("Have you uploaded your photos and pressed Submit in the photo form?")) sendOrderCopy(fallbackOrder, false);
});
$("new-order").addEventListener("click", () => {
    state = { size: "", theme: "", design: "", quantity: 1, instructions: "", name: "", phone: "", area: "", address: "", payment: "", orderId: "" };
    designPage = 0; submittedOrder = null; fallbackOrder = null;
    for (const [id, key] of Object.entries(INPUTS)) $(id).value = state[key];
    selectButtons("[data-size]", "", "size");
    selectButtons("[data-theme]", "", "theme");
    selectButtons("[data-payment]", "", "payment");
    populateDesigns(); changed(); showStep(0); showPage("products");
});
$("previous-designs").addEventListener("click", () => { designPage--; populateDesigns(); });
$("more-designs").addEventListener("click", () => { designPage++; populateDesigns(); });
$("quantity-minus").addEventListener("click", () => adjustQuantity(-1));
$("quantity-plus").addEventListener("click", () => adjustQuantity(1));
function adjustQuantity(change) {
    const current = Number.isInteger(state.quantity) ? state.quantity : 1;
    state.quantity = Math.max(1, Math.min(10, current + change));
    $("quantity").value = state.quantity;
    changed();
}
window.addEventListener("hashchange", () => showPage(location.hash.slice(1), false));

populateDesigns();
for (const [id, key] of Object.entries(INPUTS)) $(id).value = state[key];
selectButtons("[data-size]", state.size, "size");
selectButtons("[data-theme]", state.theme, "theme");
selectButtons("[data-payment]", state.payment, "payment");
showStep(0);
showPage(location.hash.slice(1) || "home");
