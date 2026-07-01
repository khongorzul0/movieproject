// ==============================
// dashboard.js
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

// title-ийг түр хадгалах — засах/устгахад ашиглана
let currentMovies = [];

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

  currentMovies = data || [];
  renderMovies(currentMovies);
}

function renderMovies(movies) {
  if (!moviesGrid) return;

  if (!movies || movies.length === 0) {
    moviesGrid.innerHTML = `<p class="empty-text">Одоогоор кино нэмэгдээгүй байна. Дээрх форм ашиглан эхний киногоо нэмнэ үү.</p>`;
    return;
  }

  moviesGrid.innerHTML = movies.map((movie) => renderMovieCard(movie)).join("");
}

function renderMovieCard(movie) {
  const rating = movie.rating != null ? `⭐ ${movie.rating}/10` : "Үнэлгээгүй";
  const review = movie.review ? escapeHtml(movie.review) : "Сэтгэгдэл алга";
  // data-id-д title ашиглана (id багана байхгүй тул)
  const safeTitle = encodeURIComponent(movie.title);

  return `
    <div class="movie-card" data-id="${safeTitle}">
      <img src="${escapeHtml(movie.poster_url)}" alt="${escapeHtml(movie.title)}" onerror="this.src='https://via.placeholder.com/180x240?text=No+Image'" />
      <div class="movie-card-body">
        <div class="movie-card-title">${escapeHtml(movie.title)}</div>
        <div class="movie-card-static" data-field="static">
          <div class="movie-card-rating">${rating}</div>
          <div class="movie-card-review">${review}</div>
        </div>
      </div>
      <div class="movie-card-actions" data-field="actions">
        <button class="btn btn-secondary edit-btn" data-id="${safeTitle}">Засах</button>
        <button class="btn btn-danger delete-btn" data-id="${safeTitle}">Устгах</button>
      </div>
    </div>
  `;
}

function renderEditForm(movie) {
  return `
    <div class="form-group">
      <label>Үнэлгээ (1-10)</label>
      <input type="number" class="edit-rating-input" min="1" max="10" step="0.1" value="${movie.rating ?? ""}" />
    </div>
    <div class="form-group">
      <label>Сэтгэгдэл</label>
      <textarea class="edit-review-input" rows="3">${movie.review ? escapeHtml(movie.review) : ""}</textarea>
    </div>
  `;
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ==============================
// Засах / Устгах товчны логик
// ==============================

if (moviesGrid) {
  moviesGrid.addEventListener("click", async (e) => {
    const editBtn = e.target.closest(".edit-btn");
    const deleteBtn = e.target.closest(".delete-btn");
    const saveBtn = e.target.closest(".save-edit-btn");
    const cancelBtn = e.target.closest(".cancel-edit-btn");

    if (editBtn) {
      enterEditMode(editBtn.dataset.id);
      return;
    }

    if (cancelBtn) {
      exitEditMode(cancelBtn.dataset.id);
      return;
    }

    if (saveBtn) {
      await saveEdit(saveBtn.dataset.id);
      return;
    }

    if (deleteBtn) {
      await deleteMovie(deleteBtn.dataset.id);
      return;
    }
  });
}

function enterEditMode(movieId) {
  const movie = currentMovies.find((m) => encodeURIComponent(m.title) === movieId);
  const cardEl = moviesGrid.querySelector(`.movie-card[data-id="${movieId}"]`);
  if (!movie || !cardEl) return;

  const staticEl = cardEl.querySelector('[data-field="static"]');
  const actionsEl = cardEl.querySelector('[data-field="actions"]');

  staticEl.innerHTML = renderEditForm(movie);
  actionsEl.innerHTML = `
    <button class="btn btn-primary save-edit-btn" data-id="${movieId}">Хадгалах</button>
    <button class="btn btn-secondary cancel-edit-btn" data-id="${movieId}">Цуцлах</button>
  `;
}

function exitEditMode(movieId) {
  const movie = currentMovies.find((m) => encodeURIComponent(m.title) === movieId);
  const cardEl = moviesGrid.querySelector(`.movie-card[data-id="${movieId}"]`);
  if (!movie || !cardEl) return;

  const rating = movie.rating != null ? `⭐ ${movie.rating}/10` : "Үнэлгээгүй";
  const review = movie.review ? escapeHtml(movie.review) : "Сэтгэгдэл алга";

  cardEl.querySelector('[data-field="static"]').innerHTML = `
    <div class="movie-card-rating">${rating}</div>
    <div class="movie-card-review">${review}</div>
  `;
  cardEl.querySelector('[data-field="actions"]').innerHTML = `
    <button class="btn btn-secondary edit-btn" data-id="${movieId}">Засах</button>
    <button class="btn btn-danger delete-btn" data-id="${movieId}">Устгах</button>
  `;
}

/**
 * Засварыг Supabase рүү илгээж хадгална
 * id багана байхгүй тул user_id + title-аар filter хийнэ
 */
async function saveEdit(movieId) {
  const cardEl = moviesGrid.querySelector(`.movie-card[data-id="${movieId}"]`);
  if (!cardEl) return;

  const movie = currentMovies.find((m) => encodeURIComponent(m.title) === movieId);
  if (!movie) return;

  const ratingRaw = cardEl.querySelector(".edit-rating-input").value;
  const review = cardEl.querySelector(".edit-review-input").value.trim();
  const saveBtn = cardEl.querySelector(".save-edit-btn");

  if (ratingRaw && !isValidRating(ratingRaw)) {
    alert("Үнэлгээ 1-10 хооронд байх ёстой.");
    return;
  }

  setButtonLoading(saveBtn, true, "Хадгалж байна...");

  // id-ийн оронд user_id + title-аар filter
  const { error } = await supabaseClient
    .from("movies")
    .update({
      rating: ratingRaw ? Number(ratingRaw) : null,
      review: review || null,
    })
    .eq("user_id", currentUser.id)
    .eq("title", movie.title);

  setButtonLoading(saveBtn, false);

  if (error) {
    alert("Засварыг хадгалахад алдаа гарлаа: " + error.message);
    return;
  }

  await loadMovies();
}

/**
 * Кино устгах
 * id-ийн оронд user_id + title-аар filter хийнэ
 */
async function deleteMovie(movieId) {
  const movie = currentMovies.find((m) => encodeURIComponent(m.title) === movieId);
  const title = movie ? movie.title : "энэ кино";

  const confirmed = confirm(`"${title}"-г устгахдаа итгэлтэй байна уу?`);
  if (!confirmed) return;

  // id-ийн оронд user_id + title-аар filter
  const { error } = await supabaseClient
    .from("movies")
    .delete()
    .eq("user_id", currentUser.id)
    .eq("title", movie.title);

  if (error) {
    alert("Устгахад алдаа гарлаа: " + error.message);
    return;
  }

  await loadMovies();
}