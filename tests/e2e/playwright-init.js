// Playwright test initialization script
// Sets test mode and disables IntersectionObserver to prevent auto-loading

window.__TEST_MODE = true;
window.IntersectionObserver = undefined;
