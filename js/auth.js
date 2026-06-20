// ==============================
// auth.js
// Нэвтрэх, бүртгүүлэх, session шалгах логик
// ==============================

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const showRegisterBtn = document.getElementById("showRegister");
const showLoginBtn = document.getElementById("showLogin");

// -------- Хуудас ачаалахад аль хэдийн нэвтэрсэн эсэхийг шалгах --------
document.addEventListener("DOMContentLoaded", async () => {
  const { data } = await supabaseClient.auth.getUser();
  if (data?.user) {
    window.location.href = "dashboard.html";
  }
});

// -------- Нэвтрэх / Бүртгүүлэх хэлбэрийг сэлгэх --------
if (showRegisterBtn) {
  showRegisterBtn.addEventListener("click", (e) => {
    if (e.target.tagName !== "A") return;
    loginForm.style.display = "none";
    registerForm.style.display = "flex";
    showRegisterBtn.style.display = "none";
    showLoginBtn.style.display = "block";
    showMessage("authMessage", "");
  });
}

if (showLoginBtn) {
  showLoginBtn.addEventListener("click", (e) => {
    if (e.target.tagName !== "A") return;
    registerForm.style.display = "none";
    loginForm.style.display = "flex";
    showLoginBtn.style.display = "none";
    showRegisterBtn.style.display = "block";
    showMessage("authMessage", "");
  });
}

// -------- Нэвтрэх --------
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const btn = document.getElementById("loginBtn");

    if (!email || !password) {
      showMessage("authMessage", "И-мэйл болон нууц үгээ оруулна уу.", "error");
      return;
    }

    setButtonLoading(btn, true, "Нэвтэрч байна...");

    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    setButtonLoading(btn, false);

    if (error) {
      showMessage("authMessage", "Нэвтрэхэд алдаа гарлаа: " + error.message, "error");
      return;
    }

    window.location.href = "dashboard.html";
  });
}

// -------- Бүртгүүлэх --------
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const btn = document.getElementById("registerBtn");

    if (!email || password.length < 6) {
      showMessage("authMessage", "И-мэйл зөв бөгөөд нууц үг 6-с дээш тэмдэгттэй байх ёстой.", "error");
      return;
    }

    setButtonLoading(btn, true, "Бүртгэж байна...");

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
    });

    setButtonLoading(btn, false);

    if (error) {
      showMessage("authMessage", "Бүртгэхэд алдаа гарлаа: " + error.message, "error");
      return;
    }

    // Supabase тохиргооноос хамаарч и-мэйл баталгаажуулалт шаардагдаж болно
    if (data?.session) {
      window.location.href = "dashboard.html";
    } else {
      showMessage(
        "authMessage",
        "Бүртгэл амжилттай! И-мэйл хаягаа шалгаж баталгаажуулна уу, дараа нь нэвтэрнэ үү.",
        "success"
      );
      registerForm.reset();
    }
  });
}