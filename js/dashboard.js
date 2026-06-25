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
    window.location.href = "index.html";
    return;
  }

  currentUser = data.user;
  const emailEl = document.getElementById("userEmail");
  if (emailEl) emailEl.textContent = currentUser.email;

  await loadMovies();
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

    await loadMovies();
  });
}

// ==============================
// Киноны жагсаалтыг картаар харуулах
// ==============================

const moviesGrid = document.getElementById("moviesGrid");

/**
 * Нэвтэрсэн хэрэглэгчийн бүх киног Supabase-ээс татаж, картаар харуулна
 */
async function loadMovies() {
  if (!moviesGrid || !currentUser) return;

  moviesGrid.innerHTML = `<p class="loading-text">Ачааллаж байна...</p>`;

  const { data, error } = await supabaseClient
    .from("movies")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    moviesGrid.innerHTML = "";
    showMessage("addMovieMessage", "Жагсаалт татахад алдаа гарлаа: " + error.message, "error");
    return;
  }

  renderMovies(data);
}

/**
 * Киноны массивыг картуудад буулгаж DOM-д зурна
 * @param {Array} movies
 */
function renderMovies(movies) {
  if (!moviesGrid) return;

  if (!movies || movies.length === 0) {
    moviesGrid.innerHTML = `<p class="empty-text">Одоогоор кино нэмэгдээгүй байна. Дээрх форм ашиглан эхний киногоо нэмнэ үү.</p>`;
    return;
  }

  moviesGrid.innerHTML = movies.map((movie) => renderMovieCard(movie)).join("");
}

/**
 * Нэг киноны картын HTML-ийг үүсгэнэ
 * @param {Object} movie
 */
function renderMovieCard(movie) {
  const rating = movie.rating != null ? `⭐ ${movie.rating}/10` : "Үнэлгээгүй";
  const review = movie.review ? escapeHtml(movie.review) : "Сэтгэгдэл алга";

  return `
    <div class="movie-card" data-id="${movie.id}">
      <img src="${escapeHtml(movie.poster_url)}" alt="${escapeHtml(movie.title)}" onerror="this.src='https://via.placeholder.com/180x240?text=No+Image'" />
      <div class="movie-card-body">
        <div class="movie-card-title">${escapeHtml(movie.title)}</div>
        <div class="movie-card-rating">${rating}</div>
        <div class="movie-card-review">${review}</div>
      </div>
      <div class="movie-card-actions">
        <button class="btn btn-secondary" disabled title="Дараагийн шатанд идэвхжинэ">Засах</button>
        <button class="btn btn-danger" disabled title="Дараагийн шатанд идэвхжинэ">Устгах</button>
      </div>
    </div>
  `;
}

/**
 * HTML тусгай тэмдэгтүүдээс аюулгүй болгож escape хийх (XSS-ээс сэргийлнэ)
 * @param {string} str
 */
function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}