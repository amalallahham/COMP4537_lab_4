window.addEventListener("DOMContentLoaded", () => {
  document.title = window.MESSAGES.title;
  document.getElementById("pageTitle").textContent = window.MESSAGES.title;

  document.getElementById("welcomeHeader").textContent = window.MESSAGES.homeWelcomeHeader;
  document.getElementById("welcomeWord").textContent = window.MESSAGES.homeWelcomeWord;
  document.getElementById("welcomeDefinition").textContent = window.MESSAGES.homeWelcomeDefinition;

  document.getElementById("searchBtn").textContent = window.MESSAGES.homeSearchBtn;
  document.getElementById("storeBtn").textContent = window.MESSAGES.homeStoreBtn;
});
