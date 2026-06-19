// ==============================
// Нийтлэг туслах функцууд (бүх хуудсанд ашиглагдана)
// ==============================

/**
 * Алдаа болон амжилттай мэдэгдлийг дэлгэцэнд харуулах
 * @param {string} elementId - Мэдэгдэл харуулах элементийн id
 * @param {string} message - Харуулах текст
 * @param {"error"|"success"} type - Мэдэгдлийн төрөл
 */
function showMessage(elementId, message, type = "error") {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.className = `message ${type}`;
  el.style.display = message ? "block" : "none";
}

/**
 * Огноог уншихад хялбар хэлбэрт оруулах
 * @param {string} dateString
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Оруулсан үнэлгээг 1-10 хооронд байгаа эсэхийг шалгах
 * @param {number} rating
 */
function isValidRating(rating) {
  const num = Number(rating);
  return !Number.isNaN(num) && num >= 1 && num <= 10;
}

/**
 * Товч ачаалж байгаа төлөвт оруулах / гаргах
 * @param {HTMLButtonElement} button
 * @param {boolean} isLoading
 * @param {string} loadingText
 */
function setButtonLoading(button, isLoading, loadingText = "Уншиж байна...") {
  if (!button) return;
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}