"use strict";

/* Business details */

const WHATSAPP_NUMBER = "96171963311";
const WHISH_NUMBER = "+961 71 963 311";
const BUSINESS_EMAIL = "heartifact.lb@gmail.com";

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

const PRODUCT_NAMES = {
    Small: "Small la casa de la memoria — بيت الذكريات",
    Large: "Large la casa de la memoria — بيت الذكريات"
};

/* Designs */

const themeOptions = {
    "Special Moments": [
        "Christmas",
        "Valentine's Day",
        "Wedding Day",
        "Engagement Day",
        "Anniversary",
        "Honeymoon",
        "Proposal",
        "Our First Date",
        "Lovely Home",
        "Birthday",
        "Graduation",
        "Any Moment You Want"
    ],

    "Friends & Family": [
        "Vacation",
        "Family",
        "Any Memory You Want"
    ],

    Locations: [
        "Paris",
        "Dubai",
        "Rome",
        "New York City",
        "Santorini",
        "London",
        "Tokyo",
        "Bali",
        "Hawaii",
        "Any Location You Choose"
    ],

    Jobs: [
        "Doctor",
        "Lawyer",
        "Teacher",
        "Artist",
        "Business Owner",
        "Architect",
        "Engineer",
        "Any Job You Want"
    ]
};

/* State */

const byId = id => document.getElementById(id);

let selectedSize = null;
let selectedDimensions = null;
let selectedPrice = null;
let selectedTheme = null;
let selectedPayment = null;

let uploadedPhotos = [];
let previewUrls = [];
let preparedOrder = null;

let sharingPhotos = false;
let toastTimer;
let cart = [];

/* Restore the cart, including carts saved by the previous website. */

try {
    const saved = JSON.parse(
        localStorage.getItem("heartifactCart") || "[]"
    );

    if (Array.isArray(saved)) {
        cart = saved
            .filter(item => {
                return (
                    item &&
                    ["Small", "Big", "Large"].includes(item.size) &&
                    typeof item.option === "string" &&
                    typeof item.theme === "string"
                );
            })
            .map(item => {
                const size = item.size === "Big" ? "Large" : item.size;

                return {
                    size,
                    dimensions:
                        size === "Small" ? "20 × 20 cm" : "30 × 30 cm",
                    price: size === "Small" ? 30 : 40,
                    theme: item.theme,
                    option: item.option
                };
            });
    }
} catch {
    cart = [];
}

/* Helpers */

function scrollToSection(id) {
    const element = byId(id);

    if (!element) {
        return;
    }

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    element.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start"
    });
}

function showToast(message = "Added to your cart ♡") {
    clearTimeout(toastTimer);

    const toast = byId("toast");
    toast.textContent = message;
    toast.classList.add("show");

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 4200);
}

function invalidateOrder() {
    preparedOrder = null;
    byId("order-next").hidden = true;

    const oldCopy = byId("order-copy-text");

    if (oldCopy) {
        oldCopy.remove();
    }

    updateShareButton();
}

/* Size selection */

function chooseSize(size, dimensions, price, button) {
    selectedSize = size;
    selectedDimensions = dimensions;
    selectedPrice = price;
    selectedTheme = null;

    document.querySelectorAll(".product-card").forEach(card => {
        card.classList.remove("selected");
    });

    document
        .querySelectorAll(".product-card button[aria-pressed]")
        .forEach(control => {
            control.setAttribute("aria-pressed", "false");
        });

    button.closest(".product-card").classList.add("selected");
    button.setAttribute("aria-pressed", "true");

    byId("size-message").textContent =
        `Selected: ${PRODUCT_NAMES[size]} (${dimensions}). ` +
        "Choose your story.";

    document.querySelectorAll(".theme-card").forEach(card => {
        card.classList.remove("selected");
        card.setAttribute("aria-pressed", "false");
    });

    byId("options-container").replaceChildren();
    byId("options-title").textContent = "Choose Your Design";
    byId("options-text").textContent =
        "Choose a theme to see your designs.";

    scrollToSection("themes");
}

/* Theme selection */

function chooseTheme(theme, button) {
    if (!selectedSize) {
        showToast("Choose a size first.");
        scrollToSection("products");
        return;
    }

    selectedTheme = theme;

    document.querySelectorAll(".theme-card").forEach(card => {
        card.classList.remove("selected");
        card.setAttribute("aria-pressed", "false");
    });

    button.classList.add("selected");
    button.setAttribute("aria-pressed", "true");

    showOptions(theme);
    scrollToSection("options");
}

/* Display designs */

function showOptions(theme) {
    const container = byId("options-container");

    container.replaceChildren();

    byId("options-title").textContent = theme;
    byId("options-text").textContent =
        "Tap a design to add it to your order.";

    themeOptions[theme].forEach(option => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "option-card";
        button.textContent = option;

        if (option.startsWith("Any ")) {
            button.classList.add("custom-option");
        }

        button.addEventListener("click", () => {
            addToCart(option);
        });

        container.append(button);
    });
}

/* Cart */

function addToCart(option) {
    if (!selectedSize || !selectedTheme) {
        return;
    }

    cart.push({
        size: selectedSize,
        dimensions: selectedDimensions,
        price: selectedPrice,
        theme: selectedTheme,
        option
    });

    invalidateOrder();
    saveCart();
    updateCart();

    showToast("Added to your cart ♡");
    scrollToSection("cart");
}

function saveCart() {
    try {
        localStorage.setItem(
            "heartifactCart",
            JSON.stringify(cart)
        );
    } catch {
        // The current cart still works if browser storage is unavailable.
    }
}

function updateCart() {
    const container = byId("cart-items");
    container.replaceChildren();

    if (cart.length === 0) {
        const empty = document.createElement("div");

        empty.className = "empty-cart";
        empty.innerHTML = `
            <span aria-hidden="true">♡</span>
            <h3>Your cart is waiting for your story.</h3>
            <p>Choose a size, theme and design above.</p>
        `;

        container.append(empty);
    }

    cart.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "cart-item";

        const details = document.createElement("div");

        const title = document.createElement("h3");
        title.textContent = item.option;

        const description = document.createElement("p");
        description.textContent =
            `${item.theme} · ${PRODUCT_NAMES[item.size]} · ` +
            item.dimensions;

        details.append(title, description);

        const price = document.createElement("div");
        price.className = "cart-price";

        const amount = document.createElement("strong");
        amount.textContent = `$${item.price.toFixed(2)}`;

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "remove-btn";
        remove.textContent = "Remove";
        remove.setAttribute(
            "aria-label",
            `Remove ${item.option}`
        );

        remove.addEventListener("click", () => {
            removeItem(index);
        });

        price.append(amount, remove);
        row.append(details, price);
        container.append(row);
    });

    const total = cart
        .reduce((sum, item) => sum + item.price, 0)
        .toFixed(2);

    byId("cart-count").textContent = cart.length;
    byId("cart-total").textContent = total;
    byId("grand-total").textContent = total;
}

function removeItem(index) {
    cart.splice(index, 1);

    invalidateOrder();
    saveCart();
    updateCart();
}

function clearCart() {
    if (cart.length === 0) {
        showToast("Your cart is already empty.");
        return;
    }

    if (confirm("Clear your HEARTIFACT cart?")) {
        cart = [];

        invalidateOrder();
        saveCart();
        updateCart();
    }
}

/* Photo selection */

function previewPhotos(event) {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
        return;
    }

    if (files.length > MAX_PHOTOS) {
        event.target.value = "";

        showToast(
            "Choose up to 5 photos. Your previous selection is kept."
        );

        return;
    }

    const acceptedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    const invalidFile = files.some(file => {
        return (
            !acceptedTypes.includes(file.type) ||
            file.size > MAX_PHOTO_BYTES ||
            file.size === 0
        );
    });

    if (invalidFile) {
        event.target.value = "";

        showToast(
            "Use JPG, PNG or WEBP photos, up to 10 MB each."
        );

        return;
    }

    uploadedPhotos = files;

    invalidateOrder();
    renderPhotos();
}

function renderPhotos() {
    previewUrls.forEach(url => {
        URL.revokeObjectURL(url);
    });

    previewUrls = [];

    const container = byId("photo-preview");
    container.replaceChildren();

    uploadedPhotos.forEach((file, index) => {
        const box = document.createElement("div");
        box.className = "preview-image";

        const image = document.createElement("img");
        image.alt = `Reference photo ${index + 1}`;

        const url = URL.createObjectURL(file);
        previewUrls.push(url);
        image.src = url;

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "remove-photo";
        remove.textContent = "×";

        remove.setAttribute(
            "aria-label",
            `Remove reference photo ${index + 1}`
        );

        remove.addEventListener("click", () => {
            uploadedPhotos.splice(index, 1);
            byId("photo-upload").value = "";

            invalidateOrder();
            renderPhotos();
        });

        box.append(image, remove);
        container.append(box);
    });

    byId("photo-count").textContent =
        `${uploadedPhotos.length} / ${MAX_PHOTOS} photos selected`;

    updateShareButton();
}

/* Native photo sharing */

function canSharePhotos() {
    try {
        return (
            uploadedPhotos.length > 0 &&
            typeof navigator.share === "function" &&
            typeof navigator.canShare === "function" &&
            navigator.canShare({
                files: uploadedPhotos
            })
        );
    } catch {
        return false;
    }
}

function updateShareButton() {
    const button = byId("share-photos-button");
    const status = byId("photo-share-status");

    button.disabled =
        !preparedOrder ||
        uploadedPhotos.length === 0 ||
        sharingPhotos ||
        !canSharePhotos();

    button.textContent = sharingPhotos
        ? "Opening share options…"
        : "Share selected photos";

    if (uploadedPhotos.length === 0) {
        status.textContent =
            "Choose up to 5 photos. Sharing becomes available " +
            "after you prepare your order.";

        return;
    }

    if (!canSharePhotos()) {
        status.textContent =
            "This browser cannot share photos directly. " +
            "After sending your order, attach these photos " +
            "in our WhatsApp chat.";

        return;
    }

    if (!preparedOrder) {
        status.textContent =
            "Photos ready. Complete your details and tap " +
            "Send Order on WhatsApp first.";

        return;
    }

    status.textContent =
        "Tap Share selected photos, choose WhatsApp, " +
        "then our chat: +961 71 963 311.";
}

async function sharePhotos() {
    if (sharingPhotos) {
        return;
    }

    if (!preparedOrder) {
        showToast("Send your order details first.");
        return;
    }

    if (!canSharePhotos()) {
        updateShareButton();

        showToast(
            "Attach your photos directly in our WhatsApp chat."
        );

        return;
    }

    const orderNumber = preparedOrder.number;
    const files = [...uploadedPhotos];

    sharingPhotos = true;
    updateShareButton();

    try {
        // This must be called directly from the customer's tap.
        await navigator.share({
            files,
            title: `HEARTIFACT ${orderNumber}`,
            text:
                `Reference photos for HEARTIFACT order ${orderNumber}. ` +
                "Please match these with my order details."
        });

        byId("photo-share-status").textContent =
            "Share window closed. Check our WhatsApp chat " +
            "to make sure you sent every photo.";
    } catch (error) {
        if (error.name === "AbortError") {
            byId("photo-share-status").textContent =
                "Sharing cancelled. Your photos are still selected; " +
                "tap again when ready.";
        } else {
            byId("photo-share-status").textContent =
                "Photo sharing could not open. Attach these photos " +
                "directly in our WhatsApp chat.";
        }
    } finally {
        sharingPhotos = false;

        byId("share-photos-button").disabled =
            !preparedOrder || !canSharePhotos();

        byId("share-photos-button").textContent =
            "Share selected photos";
    }
}

/* Payment selection */

function selectPayment(payment, button) {
    selectedPayment = payment;
    invalidateOrder();

    document.querySelectorAll(".payment-card").forEach(card => {
        card.classList.remove("active");
        card.setAttribute("aria-pressed", "false");
    });

    button.classList.add("active");
    button.setAttribute("aria-pressed", "true");

    if (payment === "Cash") {
        byId("payment-result").textContent =
            "Cash on delivery selected.";
    } else {
        byId("payment-result").textContent =
            `Whish Money selected: ${WHISH_NUMBER}. ` +
            "Payment will be confirmed in WhatsApp.";
    }
}

/* Order preparation */

function createOrderNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const suffix = Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase();

    return `HF-${timestamp}-${suffix}`;
}

function checkout() {
    if (cart.length === 0) {
        showToast("Choose a design before ordering.");
        scrollToSection("products");
        return;
    }

    if (uploadedPhotos.length === 0) {
        showToast("Choose at least one reference photo.");
        byId("photo-upload").focus();
        scrollToSection("photo-upload");
        return;
    }

    const values = {};

    for (const key of ["name", "phone", "area", "address"]) {
        const input = byId(`customer-${key}`);
        values[key] = input.value.trim();

        input.setAttribute(
            "aria-invalid",
            String(!values[key])
        );

        if (!values[key]) {
            showToast("Please complete your delivery details.");
            input.focus();
            return;
        }
    }

    const phoneDigits = values.phone.replace(/\D/g, "");

    if (phoneDigits.length < 7) {
        byId("customer-phone").setAttribute(
            "aria-invalid",
            "true"
        );

        byId("customer-phone").focus();
        showToast("Please enter a valid phone number.");
        return;
    }

    if (!selectedPayment) {
        showToast("Choose Cash or Whish Money.");
        document.querySelector(".payment-card").focus();
        return;
    }

    if (!preparedOrder) {
        const number = createOrderNumber();

        const items = cart
            .map((item, index) => {
                return [
                    `${index + 1}. ${item.option}`,
                    `Theme: ${item.theme}`,
                    `Product: ${PRODUCT_NAMES[item.size]}`,
                    `Dimensions: ${item.dimensions}`,
                    `Price: $${item.price.toFixed(2)}`
                ].join("\n");
            })
            .join("\n\n");

        const total = cart.reduce(
            (sum, item) => sum + item.price,
            0
        );

        const instructions =
            byId("instructions").value.trim() || "None";

        const paymentDetails =
            selectedPayment === "Whish Money"
                ? `Payment: Whish Money\nWhish: ${WHISH_NUMBER}`
                : "Payment: Cash";

        const message = [
            "Hello HEARTIFACT! ♡",
            "I would like to place an order.",
            "",
            `ORDER: ${number}`,
            "",
            "CUSTOMER",
            `Name: ${values.name}`,
            `Phone: ${values.phone}`,
            `Area: ${values.area}`,
            `Address: ${values.address}`,
            "",
            "ITEMS",
            items,
            "",
            `Special instructions: ${instructions}`,
            paymentDetails,
            "Delivery: FREE across Lebanon",
            "Estimated time: 4–5 business days",
            `TOTAL: $${total.toFixed(2)}`,
            "",
            `Reference photos: ${uploadedPhotos.length}.`,
            `I will send the photos for order ${number} in this chat.`
        ].join("\n");

        preparedOrder = {
            number,
            message
        };
    }

    byId("order-next").hidden = false;

    byId("order-reference").textContent =
        `Order ${preparedOrder.number} · ` +
        `WhatsApp: ${WHISH_NUMBER}`;

    byId("order-status").textContent =
        "Send the order message in WhatsApp, then return here " +
        "to share your photos. Your cart stays here until you clear it.";

    updateShareButton();
    openPreparedOrder();
    scrollToSection("photo-share-status");
}

/* Open WhatsApp */

function openWhatsApp(message) {
    const url =
        `https://wa.me/${WHATSAPP_NUMBER}` +
        `?text=${encodeURIComponent(message)}`;

    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );
}

function openPreparedOrder() {
    if (!preparedOrder) {
        return;
    }

    openWhatsApp(preparedOrder.message);
}

/* Copy order fallback */

async function copyOrder() {
    if (!preparedOrder) {
        return;
    }

    const message = preparedOrder.message;

    try {
        await navigator.clipboard.writeText(message);

        byId("order-status").textContent =
            "Order copied. Paste it into our WhatsApp chat " +
            "and tap Send.";
    } catch {
        let text = byId("order-copy-text");

        if (!text) {
            text = document.createElement("textarea");
            text.id = "order-copy-text";
            text.readOnly = true;

            text.setAttribute(
                "aria-label",
                "Order details to copy"
            );

            byId("order-next").append(text);
        }

        text.value = message;
        text.focus();
        text.select();

        byId("order-status").textContent =
            "Select and copy the order details below, then " +
            "paste them into our WhatsApp chat.";
    }
}

/* Invalidate the prepared message whenever delivery details change. */

document
    .querySelectorAll(".form-grid input, #instructions")
    .forEach(input => {
        input.addEventListener("input", invalidateOrder);
    });

/* Start */

updateCart();
renderPhotos();