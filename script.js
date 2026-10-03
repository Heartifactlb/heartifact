/* =====================================
   HEARTIFACT
===================================== */


/* BUSINESS */

const WHATSAPP_NUMBER =
    "96171963311";

const WHISH_NUMBER =
    "+961 71 963 311";

const BUSINESS_EMAIL =
    "heloukevin961@gmail.com";

const WEBSITE =
    "heartifactlb.com";

const MAX_PHOTOS =
    5;


/* CURRENT SELECTION */

let selectedSize =
    null;

let selectedDimensions =
    null;

let selectedPrice =
    null;

let selectedTheme =
    null;

let selectedPayment =
    null;

let uploadedPhotos =
    [];


/* CART */

let cart =
    JSON.parse(
        localStorage.getItem(
            "heartifactCart"
        )
    ) || [];


/* THEME OPTIONS */

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


    "Locations": [

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


    "Jobs": [

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


/* CUSTOM OPTION */

function isCustomOption(
    option
) {

    return (

        option.includes(
            "Any Moment"
        )

        ||

        option.includes(
            "Any Memory"
        )

        ||

        option.includes(
            "Any Location"
        )

        ||

        option.includes(
            "Any Job"
        )

    );

}


/* CHOOSE SIZE */

function chooseSize(
    size,
    dimensions,
    price,
    button
) {

    selectedSize =
        size;


    selectedDimensions =
        dimensions;


    selectedPrice =
        price;


    selectedTheme =
        null;


    document
        .querySelectorAll(
            ".product-card"
        )
        .forEach(
            card => {

                card.classList.remove(
                    "selected"
                );

            }
        );


    button
        .closest(
            ".product-card"
        )
        .classList.add(
            "selected"
        );


    document.getElementById(
        "size-message"
    ).textContent =

        `You selected ${size} — ${dimensions}. Now choose your story.`;


    document
        .querySelectorAll(
            ".theme-card"
        )
        .forEach(
            card => {

                card.classList.remove(
                    "selected"
                );

            }
        );


    document.getElementById(
        "options-container"
    ).innerHTML =
        "";


    document.getElementById(
        "themes"
    ).scrollIntoView({

        behavior:
            "smooth"

    });

}


/* CHOOSE THEME */

function chooseTheme(
    theme,
    button
) {

    if (
        !selectedSize
    ) {

        alert(
            "Please choose your HEARTIFACT size first."
        );


        document.getElementById(
            "products"
        ).scrollIntoView({

            behavior:
                "smooth"

        });


        return;

    }


    selectedTheme =
        theme;


    document
        .querySelectorAll(
            ".theme-card"
        )
        .forEach(
            card => {

                card.classList.remove(
                    "selected"
                );

            }
        );


    button.classList.add(
        "selected"
    );


    showOptions(
        theme
    );


    document.getElementById(
        "options"
    ).scrollIntoView({

        behavior:
            "smooth"

    });

}


/* SHOW OPTIONS */

function showOptions(
    theme
) {

    const container =
        document.getElementById(
            "options-container"
        );


    container.innerHTML =
        "";


    document.getElementById(
        "options-title"
    ).textContent =
        theme;


    document.getElementById(
        "options-text"
    ).textContent =

        "Choose a design and we'll add it directly to your cart.";


    themeOptions[
        theme
    ].forEach(

        (
            option,
            index
        ) => {


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "option-card";


            card.textContent =
                option;


            card.style.animationDelay =
                `${index * 0.05}s`;


            if (
                isCustomOption(
                    option
                )
            ) {

                card.classList.add(
                    "custom-option"
                );


                card.onclick =
                    () => {

                        openWhatsApp(

                            `Hello HEARTIFACT! I would like a custom ${theme} design.`

                        );

                    };

            }

            else {

                card.onclick =
                    () => {

                        addToCart(
                            option
                        );

                    };

            }


            container.appendChild(
                card
            );

        }

    );

}


/* ADD TO CART */

function addToCart(
    option
) {

    if (
        !selectedSize
        ||
        !selectedTheme
    ) {

        return;

    }


    const item = {

        id:
            Date.now(),

        size:
            selectedSize,

        dimensions:
            selectedDimensions,

        theme:
            selectedTheme,

        option:
            option,

        price:
            selectedPrice

    };


    cart.push(
        item
    );


    saveCart();


    updateCart();


    animateCart();


    showToast();


    setTimeout(
        () => {

            document.getElementById(
                "cart"
            ).scrollIntoView({

                behavior:
                    "smooth"

            });

        },
        350
    );

}


/* SAVE CART */

function saveCart() {

    localStorage.setItem(

        "heartifactCart",

        JSON.stringify(
            cart
        )

    );

}


/* UPDATE CART */

function updateCart() {

    const container =
        document.getElementById(
            "cart-items"
        );


    container.innerHTML =
        "";


    let total =
        0;


    if (
        cart.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-cart">

                <span>
                    ♡
                </span>

                <h3>
                    Your cart is waiting for your story.
                </h3>

                <p>
                    Choose a size, theme and design above.
                </p>

            </div>

        `;

    }


    cart.forEach(

        (
            item,
            index
        ) => {


            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "cart-item";


            element.innerHTML = `

                <div>

                    <h3>

                        ${item.option}

                    </h3>

                    <p>

                        ${item.theme}

                        <br>

                        ${item.size}
                        — ${item.dimensions}

                    </p>

                </div>


                <div class="cart-price">

                    <strong>

                        $${item.price.toFixed(2)}

                    </strong>

                    <button
                        class="remove-btn"
                        onclick="removeItem(${index})"
                    >

                        Remove

                    </button>

                </div>

            `;


            container.appendChild(
                element
            );


            total +=
                item.price;

        }

    );


    document.getElementById(
        "cart-count"
    ).textContent =
        cart.length;


    document.getElementById(
        "cart-total"
    ).textContent =
        total.toFixed(2);


    document.getElementById(
        "grand-total"
    ).textContent =
        total.toFixed(2);

}


/* REMOVE ITEM */

function removeItem(
    index
) {

    cart.splice(
        index,
        1
    );


    saveCart();


    updateCart();

}


/* CLEAR CART */

function clearCart() {

    if (
        cart.length === 0
    ) {

        alert(
            "Your cart is already empty."
        );


        return;

    }


    if (
        confirm(
            "Clear your HEARTIFACT cart?"
        )
    ) {

        cart =
            [];


        saveCart();


        updateCart();

    }

}


/* PHOTOS */

function previewPhotos(
    event
) {

    const files =
        Array.from(
            event.target.files
        );


    if (
        files.length >
        MAX_PHOTOS
    ) {

        alert(
            "You can upload a maximum of 5 photos."
        );


        event.target.value =
            "";


        uploadedPhotos =
            [];


        document.getElementById(
            "photo-preview"
        ).innerHTML =
            "";


        updatePhotoCount();


        return;

    }


    uploadedPhotos =
        files;


    const container =
        document.getElementById(
            "photo-preview"
        );


    container.innerHTML =
        "";


    files.forEach(
        file => {


            const reader =
                new FileReader();


            reader.onload =
                event => {


                    const box =
                        document.createElement(
                            "div"
                        );


                    box.className =
                        "preview-image";


                    box.innerHTML = `

                        <img
                            src="${event.target.result}"
                            alt="Customer reference"
                        >

                    `;


                    container.appendChild(
                        box
                    );

                };


            reader.readAsDataURL(
                file
            );

        }

    );


    updatePhotoCount();

}


/* PHOTO COUNT */

function updatePhotoCount() {

    document.getElementById(
        "photo-count"
    ).textContent =

        `${uploadedPhotos.length} / ${MAX_PHOTOS} photos selected`;

}


/* PAYMENT */

function selectPayment(
    payment,
    button
) {

    selectedPayment =
        payment;


    document
        .querySelectorAll(
            ".payment-card"
        )
        .forEach(
            card => {

                card.classList.remove(
                    "active"
                );

            }
        );


    button.classList.add(
        "active"
    );


    document.getElementById(
        "payment-result"
    ).textContent =

        `Payment method: ${payment}`;

}


/* ORDER NUMBER */

function createOrderNumber() {

    return (

        "HF-" +

        Date.now()
            .toString()
            .slice(-6)

    );

}


/* CHECKOUT */

function checkout() {

    if (
        cart.length === 0
    ) {

        alert(
            "Your cart is empty."
        );


        return;

    }


    if (
        uploadedPhotos.length === 0
    ) {

        alert(
            "Please choose at least one reference photo."
        );


        return;

    }


    const name =
        document.getElementById(
            "customer-name"
        ).value.trim();


    const phone =
        document.getElementById(
            "customer-phone"
        ).value.trim();


    const area =
        document.getElementById(
            "customer-area"
        ).value.trim();


    const address =
        document.getElementById(
            "customer-address"
        ).value.trim();


    const instructions =
        document.getElementById(
            "instructions"
        ).value.trim();


    if (
        !name
        ||
        !phone
        ||
        !area
        ||
        !address
    ) {

        alert(
            "Please complete all delivery details."
        );


        return;

    }


    if (
        !selectedPayment
    ) {

        alert(
            "Please choose Cash or Whish Money."
        );


        return;

    }


    const orderNumber =
        createOrderNumber();


    let total =
        0;


    let orderText =
        "";


    cart.forEach(

        (
            item,
            index
        ) => {


            total +=
                item.price;


            orderText += `

${index + 1}. ${item.option}
Theme: ${item.theme}
Size: ${item.size} (${item.dimensions})
Price: $${item.price.toFixed(2)}`;

        }

    );


    let message =

`Hello HEARTIFACT! ♡

I would like to place an order.

ORDER NUMBER: ${orderNumber}

CUSTOMER
Name: ${name}
Phone: ${phone}
Area: ${area}
Address: ${address}

ORDER
${orderText}

Reference photos selected: ${uploadedPhotos.length}

Special Instructions:
${instructions || "None"}

Payment: ${selectedPayment}

Delivery: FREE across Lebanon
Estimated time: 4–5 business days

TOTAL: $${total.toFixed(2)}`;


    if (
        selectedPayment ===
        "Whish Money"
    ) {

        message += `

Whish Money:
${WHISH_NUMBER}`;

    }


    message += `

I will send my reference photos here on WhatsApp.`;


    openWhatsApp(
        message
    );

}


/* WHATSAPP */

function openWhatsApp(
    message
) {

    const url =

        "https://wa.me/" +

        WHATSAPP_NUMBER +

        "?text=" +

        encodeURIComponent(
            message
        );


    window.open(
        url,
        "_blank"
    );

}


/* CART ANIMATION */

function animateCart() {

    const cartCount =
        document.getElementById(
            "cart-count"
        );


    cartCount.animate(

        [

            {
                transform:
                    "scale(1)"
            },

            {
                transform:
                    "scale(1.8) rotate(10deg)"
            },

            {
                transform:
                    "scale(1)"
            }

        ],

        {
            duration:
                500
        }

    );

}


/* TOAST */

function showToast() {

    const toast =
        document.getElementById(
            "toast"
        );


    toast.classList.add(
        "show"
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        2200
    );

}


/* SCROLL ANIMATIONS */

const observer =
    new IntersectionObserver(

        entries => {


            entries.forEach(
                entry => {


                    if (
                        entry.isIntersecting
                    ) {

                        entry.target.classList.add(
                            "active"
                        );

                    }

                }
            );

        },

        {
            threshold:
                .1
        }

    );


document
    .querySelectorAll(
        ".reveal"
    )
    .forEach(
        element => {

            observer.observe(
                element
            );

        }
    );


/* START */

updateCart();

updatePhotoCount();