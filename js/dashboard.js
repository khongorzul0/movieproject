// ==============================
// dashboard.js
// Одоогийн шат: Кино нэмэх (мэдээлэл + постер зураг)
// Дараагийн шатанд: жагсаалт харуулах, засах, устгах функцууд нэмэгдэнэ
// ==============================

let currentUser = null;

// -------- Хуудас ачаалахад нэвтэрсэн хэрэглэгчийг шалгах --------
document.addEventListener("DOMContentLoaded", async () => {
  const { data, error } = await supabaseClient.auth.getUser();

  if (error || !data?.user) {
    // index.html (нэвтрэх хуудас) хараахан бэлэн болоогүй үед энэ мөр алдаа өгч болзошгүй,
    // auth.js бэлэн болмогц идэвхжинэ
    window.location.href = "index.html";
    return;
  }

  currentUser = data.user;
  const emailEl = document.getElementById("userEmail");
  if (emailEl) emailEl.textContent = currentUser.email;
});

// -------- Гарах товч --------
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "index.html";
  });
}

// -------- Постерийн зургийг урьдчилан харуулах --------
const posterUrlInput = document.getElementById("posterUrl");
const posterPreview = document.getElementById("posterPreview");

if (posterUrlInput) {
  posterUrlInput.addEventListener("input", () => {
    const url = posterUrlInput.value.trim();
    if (url) {
      posterPreview.src = url;
      posterPreview.style.display = "block";
      posterPreview.onerror = () => {
        posterPreview.style.display = "none";
      };
    } else {
      posterPreview.style.display = "none";
    }
  });
}

// -------- Кино нэмэх форм --------
const addMovieForm = document.getElementById("addMovieForm");

if (addMovieForm) {
  addMovieForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("movieTitle").value.trim();
    const posterUrl = document.getElementById("posterUrl").value.trim();
    const ratingRaw = document.getElementById("movieRating").value;
    const review = document.getElementById("movieReview").value.trim();
    const submitBtn = document.getElementById("addMovieBtn");

    // -------- Оролтын шалгалт --------
    if (!title || !posterUrl) {
      showMessage("addMovieMessage", "Киноны нэр болон постер зургийн URL заавал шаардлагатай.", "error");
      return;
    }

    if (ratingRaw && !isValidRating(ratingRaw)) {
      showMessage("addMovieMessage", "Үнэлгээ 1-10 хооронд байх ёстой.", "error");
      return;
    }

    if (!currentUser) {
      showMessage("addMovieMessage", "Хэрэглэгчийн мэдээлэл олдсонгүй. Дахин нэвтэрнэ үү.", "error");
      return;
    }

    setButtonLoading(submitBtn, true, "Нэмж байна...");

    const { error } = await supabaseClient.from("movies").insert({
      user_id: currentUser.id,
      title: title,
      poster_url: posterUrl,
      rating: ratingRaw ? Number(ratingRaw) : null,
      review: review || null,
    });

    setButtonLoading(submitBtn, false);

    if (error) {
      showMessage("addMovieMessage", "Кино нэмэхэд алдаа гарлаа: " + error.message, "error");
      return;
    }

    showMessage("addMovieMessage", `"${title}" амжилттай нэмэгдлээ.`, "success");
    addMovieForm.reset();
    posterPreview.style.display = "none";

    // Жагсаалтыг дараагийн шатанд шинэчилж харуулах функц энд дуудагдана
    // await loadMovies();
  });
}