const debounce = (fn, delay = 250) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), delay);
  };
};

class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

class ApiClient {
  constructor(baseUrl = "") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.defaultHeaders = { Accept: "application/json" };
  }

  async lookup(word, { timeoutMs = 8000 } = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(
        `${this.baseUrl}/api/definitions?word=${encodeURIComponent(word)}`,
        {
          method: "GET",
          headers: this.defaultHeaders,
          signal: controller.signal,
        }
      );

      const payload = await res.json();

      if (!res.ok || payload?.success === false) {
        const message = payload?.message || "Word not found.";
        const status = payload?.status || res.status || 404;
        throw new ApiError(message, status, payload);
      }

      return payload;
    } catch (err) {
      if (err.name === "AbortError") {
        throw new ApiError("Request timed out. Please try again.", 408, null);
      }
      if (!(err instanceof ApiError)) {
        throw new ApiError(err?.message || "Network error", 0, null);
      }
      throw err;
    } finally {
      clearTimeout(id);
    }
  }
}

class Definition {
  constructor(word, definition) {
    this.word = word ?? "";
    this.definition = definition ?? "";
  }
}

class SearchUI {
  constructor() {
    this.form = document.getElementById("searchForm");
    this.searchInput = document.getElementById("searchInput");
    this.searchBtn = document.getElementById("searchBtn");
    this.btnSpinner = document.getElementById("btnSpinner");
    this.btnLabel = document.getElementById("btnLabel");
    this.clearBtn = document.getElementById("clearBtn");
    this.feedback = document.getElementById("feedback");

    this.resultWord = document.getElementById("resultWord");
    this.resultDef = document.getElementById("resultDef");
    this.requestCounterEl = document.getElementById("requestCounter");

    this.api = new ApiClient("https://comp4537-lab4-vof6.onrender.com/");
    this.requestCount = 0;

    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSearch();
    });
    this.clearBtn.addEventListener("click", () => this.clearAll());
    this.searchInput.addEventListener(
      "input",
      debounce(() => {
        if (this.searchInput.value.trim().length > 0) {
          this.searchInput.classList.remove("is-invalid");
        }
      }, 150)
    );
  }

async handleSearch() {
  const term = this.searchInput.value.trim();
  if (!term) {
    this.searchInput.classList.add("is-invalid");
    this.showAlert("Please enter a search term.", "danger");
    return;
  }

  this.setLoading(true);

  let payload = null; // ✅ Declare outside try/catch
  try {
    payload = await this.api.lookup(term);
    console.log("payload", payload);

    if (payload?.requestNumber !== undefined) {
      this.requestCounterEl.textContent = String(payload.requestNumber);
    }

    const result = payload.result || payload.data || {};
    const word = result.word ?? term;
    const definition = result.definition ?? "—";

    this.renderResult(new Definition(word, definition));
  } catch (err) {
    console.log("err", err);

    // ✅ Try to extract payload from error (if your API wrapper sets it)
    if (err.payload) {
      payload = err.payload;
    }

    // ✅ Still update request number if present
    if (payload?.requestNumber !== undefined) {
      this.requestCounterEl.textContent = String(payload.requestNumber);
    }

    const msg =
      err instanceof ApiError && err.status === 404
        ? err?.message
        : `Error: ${err.message || "Unknown error"}`;

    this.showAlert(msg, "danger");
    this.renderEmpty(term);
  } finally {
    this.setLoading(false);
  }
}

  renderResult(defObj) {
    this.resultWord.textContent = defObj.word || "—";
    this.resultDef.textContent = defObj.definition || "—";
  }

  renderEmpty(term) {
    this.resultWord.textContent = term || "—";
    this.resultDef.textContent = "—";
  }

  clearAll() {
    this.searchInput.value = "";
    this.searchInput.classList.remove("is-invalid");
    this.resultWord.textContent = "—";
    this.resultDef.textContent = "Search for a word to see its definition.";
    this.searchInput.focus();
  }

  setLoading(isLoading) {
    this.searchBtn.disabled = isLoading;
    this.btnSpinner.classList.toggle("d-none", !isLoading);
    this.btnLabel.textContent = isLoading ? "Searching..." : "Search";
  }

  showAlert(message, type) {
    this.feedback.innerHTML = "";
    this.feedback.classList.remove("d-none");
    const wrapper = document.createElement("div");
    wrapper.className = `alert alert-${type} alert-dismissible fade show`;
    wrapper.setAttribute("role", "alert");
    wrapper.innerHTML = `
      <div>${message}</div>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    this.feedback.appendChild(wrapper);

    clearTimeout(this._alertTimer);
    this._alertTimer = setTimeout(() => {
      const alertInstance = bootstrap.Alert.getOrCreateInstance(wrapper);
      alertInstance.close();
    }, 3000);
  }
}

window.addEventListener("DOMContentLoaded", () => {

  document.getElementById("backText").textContent = window.MESSAGES.back;
  document.getElementById("pageTitle").textContent = window.MESSAGES.title;
  document.getElementById("cardHeader").textContent = window.MESSAGES.cardHeader;
  document.getElementById("wordLabel").textContent = window.MESSAGES.label;
  document.getElementById("invalidFeedback").textContent = window.MESSAGES.invalidFeedback;
  document.getElementById("btnLabel").textContent = window.MESSAGES.searchBtn;
  document.getElementById("clearBtn").textContent = window.MESSAGES.clearBtn;
  document.getElementById("requestLabel").childNodes[0].textContent = window.MESSAGES.requestLabel + " ";
  document.getElementById("resultTitle").textContent = window.MESSAGES.resultTitle;
  document.getElementById("resultWord").textContent = window.MESSAGES.defaultWord;
  document.getElementById("resultDef").textContent = window.MESSAGES.defaultDefinition;
  
  new SearchUI()
});
