(function () {
  const captureCard = document.getElementById("captureCard");
  const leadForm = document.getElementById("leadForm");
  const loadingScreen = document.getElementById("loadingScreen");
  const approvedScreen = document.getElementById("approvedScreen");
  const formError = document.getElementById("formError");
  const submitBtn = document.getElementById("submitBtn");
  const approvedLine1 = document.getElementById("approvedLine1");
  const approvedLine2 = document.getElementById("approvedLine2");
  const loadingTitle = document.getElementById("loadingTitle");
  const loadingSub = document.getElementById("loadingSub");

  const LOADING_STEPS = [
    { title: "Checking coverage", sub: "Matching your postcode with local professionals…", at: 0 },
    { title: "Almost there", sub: "Finding the best match in your area…", at: 1100 },
    { title: "All set", sub: "Confirming your details…", at: 2000 },
  ];
  const MIN_LOADING_MS = 2400;

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

  let stepTimers = [];
  function startLoadingSteps() {
    stepTimers.forEach((t) => clearTimeout(t));
    stepTimers = [];
    LOADING_STEPS.forEach((step) => {
      const id = window.setTimeout(() => {
        loadingTitle.textContent = step.title;
        loadingSub.textContent = step.sub;
      }, step.at);
      stepTimers.push(id);
    });
  }

  function stopLoadingSteps() {
    stepTimers.forEach((t) => clearTimeout(t));
    stepTimers = [];
  }

  function setLoading(on) {
    if (on) {
      loadingScreen.classList.remove("hidden");
      loadingScreen.removeAttribute("hidden");
      submitBtn.disabled = true;
      startLoadingSteps();
    } else {
      loadingScreen.classList.add("hidden");
      loadingScreen.setAttribute("hidden", "");
      submitBtn.disabled = false;
      stopLoadingSteps();
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
      window.scrollTo({ top: 0, behavior: "smooth" });
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

    let serverOk = false;
    let serverError = null;

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        serverOk = true;
      } else {
        const data = await res.json().catch(() => ({}));
        console.error("Lead submit failed:", res.status, data);
        const detail = data.detail
          ? String(data.detail).slice(0, 300)
          : "";
        serverError = detail
          ? `${data.error || "Server error"} — ${detail}`
          : data.error || `Server returned ${res.status}.`;
      }
    } catch (err) {
      serverError = "Could not reach the server. Please try again.";
      console.error("Lead submit network error:", err);
    }

    const elapsed = performance.now() - started;
    if (elapsed < MIN_LOADING_MS) {
      await new Promise((r) => window.setTimeout(r, MIN_LOADING_MS - elapsed));
    }

    setLoading(false);

    if (serverOk) {
      if (window.fbq) fbq('track', 'Lead');
      showApproved(fn);
    } else {
      showError(serverError || "Something went wrong. Please try again.");
    }
  });
})();
