(function () {
  const TOKEN_KEY = "oxcore_admin_token";

  const loginPanel = document.getElementById("loginPanel");
  const dashPanel = document.getElementById("dashPanel");
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");
  const dashError = document.getElementById("dashError");
  const leadsBody = document.getElementById("leadsBody");
  const leadCount = document.getElementById("leadCount");
  const emptyHint = document.getElementById("emptyHint");
  const refreshBtn = document.getElementById("refreshBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  function setToken(t) {
    sessionStorage.setItem(TOKEN_KEY, t);
  }

  function clearToken() {
    sessionStorage.removeItem(TOKEN_KEY);
  }

  function showLogin() {
    loginPanel.classList.remove("hidden");
    dashPanel.classList.add("hidden");
  }

  function showDash() {
    loginPanel.classList.add("hidden");
    dashPanel.classList.remove("hidden");
  }

  function formatDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
  }

  function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      btn.classList.add("copied");
      btn.textContent = "Copied";
      window.setTimeout(() => {
        btn.classList.remove("copied");
        btn.textContent = "Copy";
      }, 1600);
    });
  }

  function rowCopyButton(text) {
    const td = document.createElement("td");
    td.className = "cell-copy";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-copy";
    btn.textContent = "Copy";
    btn.addEventListener("click", () => copyText(text, btn));
    td.appendChild(btn);
    return td;
  }

  function renderLeads(leads) {
    leadsBody.innerHTML = "";
    leadCount.textContent = `${leads.length} lead${leads.length === 1 ? "" : "s"}`;
    emptyHint.classList.toggle("hidden", leads.length > 0);

    leads.forEach((lead) => {
      const tr = document.createElement("tr");
      const block = [
        `Name: ${lead.fullName}`,
        `Phone: ${lead.phone}`,
        `Postcode: ${lead.postcode}`,
        `Service: ${lead.service}`,
      ].join("\n");

      tr.innerHTML = `
        <td>${formatDate(lead.createdAt)}</td>
        <td>${escapeHtml(lead.fullName)}</td>
        <td>${escapeHtml(lead.phone)}</td>
        <td>${escapeHtml(lead.postcode)}</td>
        <td>${escapeHtml(lead.service)}</td>
      `;
      tr.appendChild(rowCopyButton(block));
      leadsBody.appendChild(tr);
    });
  }

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  async function loadLeads() {
    dashError.classList.add("hidden");
    const token = getToken();
    if (!token) {
      showLogin();
      return;
    }

    const res = await fetch("/api/admin/leads", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      clearToken();
      showLogin();
      return;
    }

    if (!res.ok) {
      dashError.textContent = "Could not load leads.";
      dashError.classList.remove("hidden");
      return;
    }

    const data = await res.json();
    renderLeads(data.leads || []);
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.classList.add("hidden");
    const fd = new FormData(loginForm);
    const username = fd.get("username");
    const password = fd.get("password");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      loginError.textContent = "Invalid username or password.";
      loginError.classList.remove("hidden");
      return;
    }

    const data = await res.json();
    setToken(data.token);
    showDash();
    await loadLeads();
  });

  refreshBtn.addEventListener("click", loadLeads);

  logoutBtn.addEventListener("click", () => {
    clearToken();
    showLogin();
  });

  if (getToken()) {
    showDash();
    loadLeads();
  } else {
    showLogin();
  }
})();
