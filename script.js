const googleFormConfig = {
    action: "https://docs.google.com/forms/d/e/1FAIpQLSeG0zz1fmTy42PdRzJwe8bLmxFs8m565E10Zm7smUTuFWjDmQ/formResponse",
    entries: {
        patientName: "entry.933560228",
        phone: "entry.1033184670",
        email: "entry.736476138",
        city: "entry.571871749",
        careNeed: "entry.839975472",
        plan: "entry.1220890850",
        selectedPrice: "entry.793302882",
        preferredDate: "entry.27890053",
        paymentMethod: "entry.151245104",
        paymentReference: "entry.1355811",
        message: "entry.1609637832"
    },
    whatsappNumber: "9711130991"
};

document.addEventListener("DOMContentLoaded", () => {
    const menuButton = document.querySelector(".menu-button");
    const navLinks = document.querySelector(".nav-links");

    menuButton?.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("active");
        menuButton.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks?.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("active");
            menuButton?.setAttribute("aria-expanded", "false");
        });
    });

    const planSelect = document.getElementById("planSelect");
    const selectedPrice = document.getElementById("selectedPrice");

    const syncPrice = () => {
        const option = planSelect?.selectedOptions?.[0];
        selectedPrice.value = option?.dataset.price || "";
    };

    planSelect?.addEventListener("change", syncPrice);

    document.querySelectorAll(".btn-plan").forEach((button) => {
        button.addEventListener("click", () => {
            const card = button.closest(".plan-card");
            const plan = card?.dataset.plan;

            if (planSelect && plan) {
                planSelect.value = plan;
                syncPrice();
            }

            document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
        });
    });

    const form = document.getElementById("bookingForm");
    const submitButton = document.getElementById("submitButton");
    const formMessage = document.getElementById("formMessage");

    form?.addEventListener("submit", async (event) => {
        event.preventDefault();
        syncPrice();

        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending request';
        formMessage.textContent = "";
        formMessage.className = "form-message";

        const data = Object.fromEntries(new FormData(form).entries());

        try {
            if (googleFormConfig.action) {
                await submitToGoogleForm(data);
            } else {
                console.table(data);
            }

            // WhatsApp integration disabled
            form.reset();
            selectedPrice.value = "";
            formMessage.textContent = googleFormConfig.action
                ? "Booking request submitted. We will contact you shortly."
                : "Online booking is being activated. Please contact the care team directly to confirm this request.";
            formMessage.classList.add("success");
        } catch (error) {
            console.error("Booking submission failed", error);
            formMessage.textContent = "Unable to submit right now. Please call or message Consulting CTVS directly.";
            formMessage.classList.add("error");
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit booking request';
        }
    });
});

async function submitToGoogleForm(data) {
    return new Promise((resolve, reject) => {
        try {
            // Create a hidden iframe to receive the form post
            const iframeName = "hidden_gform_iframe_" + Date.now();
            const iframe = document.createElement("iframe");
            iframe.name = iframeName;
            iframe.style.display = "none";
            document.body.appendChild(iframe);

            // Create a hidden form targeting the iframe
            const form = document.createElement("form");
            form.method = "POST";
            form.action = googleFormConfig.action;
            form.target = iframeName;
            form.style.display = "none";

            // Add all form fields as hidden inputs
            Object.entries(googleFormConfig.entries).forEach(([field, entryId]) => {
                if (!entryId || !Object.prototype.hasOwnProperty.call(data, field)) {
                    return;
                }

                if (field === "preferredDate" && data[field]) {
                    const [year, month, day] = data[field].split("-");
                    addHiddenInput(form, entryId + "_year", year);
                    addHiddenInput(form, entryId + "_month", month);
                    addHiddenInput(form, entryId + "_day", day);
                    return;
                }

                addHiddenInput(form, entryId, data[field] || "");
            });

            document.body.appendChild(form);

            // Resolve after iframe loads (submission complete)
            iframe.addEventListener("load", () => {
                // Clean up
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    document.body.removeChild(form);
                }, 500);
                resolve();
            });

            iframe.addEventListener("error", () => {
                document.body.removeChild(iframe);
                document.body.removeChild(form);
                reject(new Error("Form submission failed"));
            });

            // Submit the form
            form.submit();
        } catch (err) {
            reject(err);
        }
    });
}

function addHiddenInput(form, name, value) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
}

function maybeOpenWhatsapp(data) {
    if (!googleFormConfig.whatsappNumber) {
        return;
    }

    const message = [
        "New Consulting CTVS booking request",
        `Patient: ${data.patientName}`,
        `Phone: ${data.phone}`,
        `Email: ${data.email}`,
        `City: ${data.city}`,
        `Care need: ${data.careNeed}`,
        `Plan: ${data.plan}`,
        `Price: INR ${data.selectedPrice || "N/A"}`,
        `Preferred date: ${data.preferredDate}`,
        `Payment: ${data.paymentMethod}`,
        `Reference: ${data.paymentReference || "N/A"}`,
        `Context: ${data.message || "N/A"}`
    ].join("\n");

    window.open(`https://wa.me/${googleFormConfig.whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
}
