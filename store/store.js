const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(null, args), delay);
  };
};

class ApiClient {
  constructor(baseUrl = "") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async postDefinition(definition, { timeoutMs = 8000 } = {}) {
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${this.baseUrl}/api/definitions`, {
        method: "POST",
        headers: this.defaultHeaders,
        body: JSON.stringify(definition),
      });
      const payload = await res.json();

      return {
        ok: res.ok,
        status: res.status,
        message: payload.message || "Definition saved successfully.",
      };
    } catch (err) {
      return {
        ok: false,
        status: res.status,
        message: err.message || "Network error",
        data: null,
      };
      return err;
    } finally {
      clearTimeout(id);
    }
  }
}

class Definition {
  constructor(word, definition) {
    this.word = word?.trim() ?? "";
    this.definition = definition?.trim() ?? "";
  }
  isValid() {
    return this.word !== "" && this.definition !== "";
  }
  toJSON() {
    return { word: this.word, definition: this.definition };
  }
}

class DefinitionStore {
  constructor() {
    this.definitions = {};
  }

  add(defObj) {
    if (!(defObj instanceof Definition)) throw new Error("Invalid object");
    if (!defObj.isValid()) return false;
    this.definitions[defObj.word] = defObj.definition;
    return true;
  }
}

class StoreUI {
  constructor() {
    this.form = document.getElementById("defForm");
    this.wordInput = document.getElementById("wordInput");
    this.definitionInput = document.getElementById("definitionInput");

    this.feedback = document.getElementById("feedback");
    this.submitBtn = document.getElementById("submitBtn");
    this.clearBtn = document.getElementById("clearBtn");
    this.btnSpinner = document.getElementById("btnSpinner");
    this.btnLabel = document.getElementById("btnLabel");

    this.store = new DefinitionStore();
    this.api = new ApiClient("https://comp4537-lab4-vof6.onrender.com/");

    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
    this.clearBtn.addEventListener("click", () => this.clearForm(true));

    const onInput = this.debouncedOnInput();
    this.wordInput.addEventListener("input", onInput);
    this.definitionInput.addEventListener("input", onInput);
  }

  debouncedOnInput() {
    return debounce(() => {
      const word = this.wordInput.value.trim();
      const def = this.definitionInput.value.trim();

      if (word.length > 0) this.wordInput.classList.remove("is-invalid");
      if (def.length > 0) this.definitionInput.classList.remove("is-invalid");
    }, 300);
  }

  async handleSubmit() {
    this.wordInput.classList.toggle(
      "is-invalid",
      this.wordInput.value.length === 0
    );
    this.definitionInput.classList.toggle(
      "is-invalid",
      this.definitionInput.value.length === 0
    );
    const defObj = new Definition(
      this.wordInput.value,
      this.definitionInput.value
    );

    if (!defObj.isValid()) {
      this.wordInput.classList.toggle("is-invalid", !defObj.word);
      this.definitionInput.classList.toggle("is-invalid", !defObj.definition);
      this.showAlert("Please fill in both fields.", "danger");
      return;
    }

    this.store.add(defObj);

    this.setSubmitting(true);

    try {
      const result = await this.api.postDefinition(defObj.toJSON());
      if (result.ok) {
        this.showAlert(result.message, "success");
        this.clearForm(true);
      } else {
        this.showAlert(`Error ${result.status}: ${result.message}`, "danger");
      }
    } catch (err) {
      this.showAlert(err.message || "Unknown error", "danger");
    } finally {
      this.setSubmitting(false);
    }
  }

  setSubmitting(isSubmitting) {
    this.submitBtn.disabled = isSubmitting;
    this.btnLabel.textContent = isSubmitting ? "Submitting..." : "Submit";
    this.btnSpinner.classList.toggle("d-none", !isSubmitting);
  }

  showAlert(message, type /* success | danger */) {
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

  clearForm(focusWord = false) {
    this.wordInput.value = "";
    this.definitionInput.value = "";
    this.wordInput.classList.remove("is-invalid");
    this.definitionInput.classList.remove("is-invalid");

    if (focusWord) this.wordInput.focus();
  }
}

window.addEventListener("DOMContentLoaded", () => new StoreUI());
