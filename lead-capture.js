(function () {
  const captureCard = document.getElementById("captureCard");
  const leadForm = document.getElementById("leadForm");
  const loadingScreen = document.getElementById("loadingScreen");
  const approvedScreen = document.getElementById("approvedScreen");
  const formError = document.getElementById("formError");
  const submitBtn = document.getElementById("submitBtn");
  const approvedLine1 = document.getElementById("approvedLine1");
  const approvedLine2 = document.getElementById("approvedLine2");

  const MIN_LOADING_MS = 1600;

  function firstNameFromFull(full) {
    const t = String(full || "").trim();
    if (!t) return "";
    return t.split(/\s+/)[0];
  }

  function showError(msg) {
    formError.textContent = msg;
    formError.classList.remove("hidden");
  }

  function clearError() {
    formError.textContent = "";
    formError.classList.add("hidden");
  }

  function setLoading(on) {
    if (on) {
      loadingScreen.classList.remove("hidden");
      loadingScreen.removeAttribute("hidden");
      submitBtn.disabled = true;
    } else {
      loadingScreen.classList.add("hidden");
      loadingScreen.setAttribute("hidden", "");
      submitBtn.disabled = false;
    }
  }

  function showApproved(first) {
    const name = first || "there";
    approvedLine1.textContent = `Great news, ${name} — we cover your area.`;
    approvedLine2.textContent =
      "A local professional will be in touch shortly to arrange your free quote.";

    captureCard.classList.add("is-leaving");
    window.setTimeout(() => {
      captureCard.classList.add("hidden");
      approvedScreen.classList.remove("hidden");
      approvedScreen.removeAttribute("hidden");
    }, 320);
  }

  leadForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearError();

    const fd = new FormData(leadForm);
    const payload = {
      fullName: String(fd.get("fullName") || "").trim(),
      postcode: String(fd.get("postcode") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      address: String(fd.get("address") || "").trim(),
      service: String(fd.get("service") || "").trim(),
    };

    if (!payload.fullName || !payload.postcode || !payload.phone || !payload.address || !payload.service) {
      showError("Please fill in every field so we can check your area.");
      return;
    }

    const fn = firstNameFromFull(payload.fullName);
    const started = performance.now();
    setLoading(true);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const elapsed = performance.now() - started;
      if (elapsed < MIN_LOADING_MS) {
        await new Promise((r) => window.setTimeout(r, MIN_LOADING_MS - elapsed));
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLoading(false);
        showError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setLoading(false);
      showApproved(fn);
    } catch {
      const elapsed = performance.now() - started;
      if (elapsed < MIN_LOADING_MS) {
        await new Promise((r) => window.setTimeout(r, MIN_LOADING_MS - elapsed));
      }
      setLoading(false);
      showError("We could not reach the server. Please try again.");
    }
  });
})();
