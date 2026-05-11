const googleFormConfig = {
    action: "",
    entries: {
        patientName: "",
        phone: "",
        email: "",
        city: "",
        careNeed: "",
        plan: "",
        selectedPrice: "",
        preferredDate: "",
        paymentMethod: "",
        paymentReference: "",
        message: ""
    },
    whatsappNumber: ""
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

            maybeOpenWhatsapp(data);
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
    const params = new URLSearchParams();

    Object.entries(googleFormConfig.entries).forEach(([field, entryId]) => {
        if (!entryId || !Object.prototype.hasOwnProperty.call(data, field)) {
            return;
        }

        if (field === "preferredDate" && data[field]) {
            const [year, month, day] = data[field].split("-");
            params.append(`${entryId}_year`, year);
            params.append(`${entryId}_month`, month);
            params.append(`${entryId}_day`, day);
            return;
        }

        params.append(entryId, data[field] || "");
    });

    await fetch(googleFormConfig.action, {
        method: "POST",
        mode: "no-cors",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params
    });
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
