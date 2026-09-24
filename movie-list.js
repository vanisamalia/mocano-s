/* =========================
   OUR MOVIE LIST
========================= */

let currentMovie = null;
let editingMovie = null;


/* =========================
   DOM
========================= */

const movieListContainer =
    document.getElementById("movie-list-container");

const movieListActions =
    document.getElementById("movie-list-actions");

const addMovieBtn =
    document.getElementById("add-movie-btn");

const movieModal =
    document.getElementById("movie-modal");

const movieModalClose =
    document.getElementById("movie-modal-close");

const movieCancelBtn =
    document.getElementById("movie-cancel-btn");

const movieForm =
    document.getElementById("movie-form");

const movieModalTitle =
    document.getElementById("movie-modal-title");

const movieTitle =
    document.getElementById("movie-title");

const moviePoster =
    document.getElementById("movie-poster");

const movieDescription =
    document.getElementById("movie-description");

const movieStatus =
    document.getElementById("movie-status");

const movieWatchedDate =
    document.getElementById("movie-watched-date");

const movieNote =
    document.getElementById("movie-note");

const movieFormMessage =
    document.getElementById("movie-form-message");


const movieDetailModal =
    document.getElementById("movie-detail-modal");

const movieDetailClose =
    document.getElementById("movie-detail-close");

const movieDetailLayout =
    document.getElementById("movie-detail-layout");

const movieRatings =
    document.getElementById("movie-ratings");

const movieDetailActions =
    document.getElementById("movie-detail-actions");

const editMovieBtn =
    document.getElementById("edit-movie-btn");

const deleteMovieBtn =
    document.getElementById("delete-movie-btn");


/* =========================
   AUTH
========================= */

async function getCurrentMovieUser() {

    const {
        data: { user }
    } = await db.auth.getUser();

    return user;
}


/* =========================
   LOAD MOVIES
========================= */

async function loadMovies() {

    if (!movieListContainer) return;

    const {
        data: movies,
        error
    } = await db
        .from("movies")
        .select("*")
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error(
            "Gagal mengambil movies:",
            error
        );

        movieListContainer.innerHTML = `
            <p class="movie-list-empty">
                Failed to load our movies.
            </p>
        `;

        return;
    }


    if (!movies || movies.length === 0) {

        movieListContainer.innerHTML = `
            <p class="movie-list-empty">
                No movies here yet.
            </p>
        `;

        return;
    }


    const movieCards = [];

    for (const movie of movies) {

        const ratings =
            await getMovieRatings(movie.id);

        movieCards.push(
            createMovieCard(movie, ratings)
        );
    }


    movieListContainer.innerHTML =
        movieCards.join("");


    attachMovieCardEvents();
}


/* =========================
   GET RATINGS
========================= */

async function getMovieRatings(movieId) {

    const {
        data,
        error
    } = await db
        .from("movie_ratings")
        .select("*")
        .eq("movie_id", movieId);

    if (error) {

        console.error(
            "Gagal mengambil rating:",
            error
        );

        return [];
    }

    return data || [];
}


/* =========================
   CREATE MOVIE CARD
========================= */

function createMovieCard(movie, ratings) {

    const average =
        calculateAverageRating(ratings);


    const posterHTML = movie.poster_url
        ? `
            <div class="movie-card-poster">

                <img
                    src="${escapeHTML(movie.poster_url)}"
                    alt="${escapeHTML(movie.title)}"
                >

            </div>
        `
        : `
            <div class="movie-card-poster">

                <div class="movie-card-poster-placeholder">
                    ${escapeHTML(movie.title)}
                </div>

            </div>
        `;


    const ratingHTML =
        average !== null
            ? `Our rating ${average.toFixed(1)} / 5`
            : `Not rated yet`;


    return `
        <article
            class="movie-card"
            data-movie-id="${movie.id}"
        >

            ${posterHTML}

            <div class="movie-card-info">

                <span class="movie-card-status">
                    ${escapeHTML(movie.status)}
                </span>

                <h3>
                    ${escapeHTML(movie.title)}
                </h3>

                <p class="movie-card-rating">
                    ${ratingHTML}
                </p>

            </div>

        </article>
    `;
}


/* =========================
   MOVIE CARD EVENTS
========================= */

function attachMovieCardEvents() {

    document
        .querySelectorAll(".movie-card")
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const movieId =
                        card.dataset.movieId;

                    openMovieDetail(movieId);
                }
            );

        });
}


/* =========================
   OPEN MOVIE DETAIL
========================= */

async function openMovieDetail(movieId) {

    const {
        data: movie,
        error
    } = await db
        .from("movies")
        .select("*")
        .eq("id", movieId)
        .single();


    if (error || !movie) {

        console.error(
            "Gagal mengambil movie:",
            error
        );

        return;
    }


    currentMovie = movie;


    const ratings =
        await getMovieRatings(movie.id);


    renderMovieDetail(
        movie,
        ratings
    );


    movieDetailModal.style.display = "flex";

    document.body.style.overflow = "hidden";
}


/* =========================
   RENDER DETAIL
========================= */

function renderMovieDetail(movie, ratings) {

    const posterHTML = movie.poster_url
        ? `
            <div class="movie-detail-poster">

                <img
                    src="${escapeHTML(movie.poster_url)}"
                    alt="${escapeHTML(movie.title)}"
                >

            </div>
        `
        : `
            <div class="movie-detail-poster">

                <div class="movie-card-poster-placeholder">
                    ${escapeHTML(movie.title)}
                </div>

            </div>
        `;


    const watchedDateHTML =
        movie.watched_date
            ? `
                <p class="movie-detail-date">
                    Watched on ${formatMovieDate(movie.watched_date)}
                </p>
            `
            : "";


    const descriptionHTML =
        movie.description
            ? `
                <p class="movie-detail-description">
                    ${escapeHTML(movie.description)}
                </p>
            `
            : "";


    const noteHTML =
        movie.note
            ? `
                <p class="movie-detail-note">
                    ${escapeHTML(movie.note)}
                </p>
            `
            : "";


    movieDetailLayout.innerHTML = `

        ${posterHTML}

        <div class="movie-detail-info">

            <span class="movie-detail-status">
                ${escapeHTML(movie.status)}
            </span>

            <h2>
                ${escapeHTML(movie.title)}
            </h2>

            ${watchedDateHTML}

            ${descriptionHTML}

            ${noteHTML}

        </div>

    `;


    renderMovieRatings(ratings);
}


/* =========================
   RENDER RATINGS
========================= */

async function renderMovieRatings(ratings) {

    const user =
        await getCurrentMovieUser();


    let currentUserRating = null;
    let partnerRating = null;


    if (user) {

        currentUserRating =
            ratings.find(
                rating =>
                    rating.user_id === user.id
            ) || null;

        partnerRating =
            ratings.find(
                rating =>
                    rating.user_id !== user.id
            ) || null;

    } else {

        partnerRating = ratings[0] || null;

    }


    const yourRating =
        currentUserRating
            ? currentUserRating.rating
            : null;


    const otherRating =
        partnerRating
            ? partnerRating.rating
            : null;


    const average =
        calculateAverageRating(ratings);


    movieRatings.innerHTML = `

        <div class="movie-rating-card">

            <p class="movie-rating-name">
                Your Rating
            </p>

            <div class="movie-stars">
                ${createStars(yourRating)}
            </div>

            <p class="movie-rating-value">
                ${
                    yourRating
                        ? `${yourRating} / 5`
                        : "Not rated yet"
                }
            </p>

            ${
                user
                    ? createRatingButtons(yourRating)
                    : ""
            }

        </div>


        <div class="movie-rating-card">

            <p class="movie-rating-name">
                Partner's Rating
            </p>

            <div class="movie-stars">
                ${createStars(otherRating)}
            </div>

            <p class="movie-rating-value">
                ${
                    otherRating
                        ? `${otherRating} / 5`
                        : "Not rated yet"
                }
            </p>

        </div>


        <p class="movie-average-rating">
            ${
                average !== null
                    ? `Our rating · ${average.toFixed(1)} / 5`
                    : "Our rating · Not rated yet"
            }
        </p>
    `;


    attachRatingEvents();
}


/* =========================
   RATING BUTTONS
========================= */

function createRatingButtons(currentRating) {

    let buttons = "";

    for (let i = 1; i <= 5; i++) {

        buttons += `
            <button
                type="button"
                class="${currentRating === i ? "active" : ""}"
                data-rating="${i}"
            >
                ★
            </button>
        `;
    }


    return `
        <div class="movie-rating-buttons">
            ${buttons}
        </div>
    `;
}


/* =========================
   ATTACH RATING EVENTS
========================= */

function attachRatingEvents() {

    document
        .querySelectorAll(
            ".movie-rating-buttons button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const rating =
                        Number(
                            button.dataset.rating
                        );

                    await saveMovieRating(rating);
                }
            );

        });
}


/* =========================
   SAVE RATING
========================= */

async function saveMovieRating(rating) {

    const user =
        await getCurrentMovieUser();


    if (!user || !currentMovie) {

        alert(
            "Silakan login terlebih dahulu."
        );

        return;
    }


    const {
        error
    } = await db
        .from("movie_ratings")
        .upsert(
            {
                movie_id: currentMovie.id,
                user_id: user.id,
                rating: rating,
                updated_at: new Date().toISOString()
            },
            {
                onConflict:
                    "movie_id,user_id"
            }
        );


    if (error) {

        console.error(
            "Gagal menyimpan rating:",
            error
        );

        alert(
            "Rating gagal disimpan."
        );

        return;
    }


    const ratings =
        await getMovieRatings(
            currentMovie.id
        );


    renderMovieRatings(ratings);

    await loadMovies();
}


/* =========================
   CALCULATE AVERAGE
========================= */

function calculateAverageRating(ratings) {

    if (
        !ratings ||
        ratings.length === 0
    ) {
        return null;
    }


    const total =
        ratings.reduce(
            (sum, item) =>
                sum + Number(item.rating),
            0
        );


    return total / ratings.length;
}


/* =========================
   STARS
========================= */

function createStars(rating) {

    let stars = "";

    for (let i = 1; i <= 5; i++) {

        stars +=
            i <= rating
                ? "★"
                : "☆";
    }

    return stars;
}


/* =========================
   ADD MOVIE
========================= */

if (addMovieBtn) {

    addMovieBtn.addEventListener(
        "click",
        () => {

            editingMovie = null;

            movieModalTitle.textContent =
                "Add a Movie";

            movieForm.reset();

            movieFormMessage.textContent =
                "";

            movieModal.style.display =
                "flex";

            document.body.style.overflow =
                "hidden";
        }
    );
}


/* =========================
   SAVE MOVIE
========================= */

if (movieForm) {

    movieForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const user =
                await getCurrentMovieUser();


            if (!user) {

                alert(
                    "Silakan login terlebih dahulu."
                );

                return;
            }


            const title =
                movieTitle.value.trim();

            if (!title) {

                movieFormMessage.textContent =
                    "Movie title is required.";

                return;
            }


            const movieData = {

                title: title,

                poster_url:
                    moviePoster.value.trim() || null,

                description:
                    movieDescription.value.trim() || null,

                status:
                    movieStatus.value,

                watched_date:
                    movieWatchedDate.value || null,

                note:
                    movieNote.value.trim() || null

            };


            let error;


            if (editingMovie) {

                const result =
                    await db
                        .from("movies")
                        .update(movieData)
                        .eq(
                            "id",
                            editingMovie.id
                        )
                        .eq(
                            "created_by",
                            user.id
                        );

                error = result.error;

            } else {

                const result =
                    await db
                        .from("movies")
                        .insert({
                            ...movieData,
                            created_by:
                                user.id
                        });

                error = result.error;
            }


            if (error) {

                console.error(
                    "Gagal menyimpan movie:",
                    error
                );

                movieFormMessage.textContent =
                    "Failed to save movie.";

                return;
            }


            closeMovieModal();

            await loadMovies();
        }
    );
}


/* =========================
   EDIT MOVIE
========================= */

if (editMovieBtn) {

    editMovieBtn.addEventListener(
        "click",
        () => {

            if (!currentMovie) return;

            editingMovie =
                currentMovie;


            movieTitle.value =
                currentMovie.title || "";

            moviePoster.value =
                currentMovie.poster_url || "";

            movieDescription.value =
                currentMovie.description || "";

            movieStatus.value =
                currentMovie.status ||
                "Want to Watch";

            movieWatchedDate.value =
                currentMovie.watched_date || "";

            movieNote.value =
                currentMovie.note || "";


            movieModalTitle.textContent =
                "Edit Movie";


            movieFormMessage.textContent =
                "";


            movieDetailModal.style.display =
                "none";

            movieModal.style.display =
                "flex";
        }
    );
}


/* =========================
   DELETE MOVIE
========================= */

if (deleteMovieBtn) {

    deleteMovieBtn.addEventListener(
        "click",
        async () => {

            if (!currentMovie) return;


            const user =
                await getCurrentMovieUser();


            if (!user) return;


            const confirmed =
                confirm(
                    `Delete "${currentMovie.title}"?`
                );


            if (!confirmed) return;


            const {
                error
            } = await db
                .from("movies")
                .delete()
                .eq(
                    "id",
                    currentMovie.id
                )
                .eq(
                    "created_by",
                    user.id
                );


            if (error) {

                console.error(
                    "Gagal menghapus movie:",
                    error
                );

                alert(
                    "Movie gagal dihapus."
                );

                return;
            }


            closeMovieDetail();

            await loadMovies();
        }
    );
}


/* =========================
   CLOSE MODALS
========================= */

function closeMovieModal() {

    if (!movieModal) return;

    movieModal.style.display =
        "none";

    document.body.style.overflow =
        "";

    editingMovie = null;
}


function closeMovieDetail() {

    if (!movieDetailModal) return;

    movieDetailModal.style.display =
        "none";

    document.body.style.overflow =
        "";

    currentMovie = null;
}


if (movieModalClose) {

    movieModalClose.addEventListener(
        "click",
        closeMovieModal
    );
}


if (movieCancelBtn) {

    movieCancelBtn.addEventListener(
        "click",
        closeMovieModal
    );
}


if (movieDetailClose) {

    movieDetailClose.addEventListener(
        "click",
        closeMovieDetail
    );
}


if (movieModal) {

    movieModal.addEventListener(
        "click",
        event => {

            if (
                event.target === movieModal
            ) {
                closeMovieModal();
            }

        }
    );
}


if (movieDetailModal) {

    movieDetailModal.addEventListener(
        "click",
        event => {

            if (
                event.target === movieDetailModal
            ) {
                closeMovieDetail();
            }

        }
    );
}


/* =========================
   UPDATE AUTH UI
========================= */

async function updateMovieAuthUI() {

    const user =
        await getCurrentMovieUser();


    if (!movieListActions) return;


    movieListActions.style.display =
        user ? "flex" : "none";
}


/* =========================
   HELPERS
========================= */

function formatMovieDate(dateString) {

    if (!dateString) return "";

    const date =
        new Date(dateString);

    return date.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );
}


function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================
   INIT
========================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await updateMovieAuthUI();

        await loadMovies();
    }
);
