/* =========================
   REASONS I LOVE YOU
========================= */

let loveReasonsData = [];

let editingLoveReasonId = null;


/* =========================
   LOAD LOVE REASONS
========================= */

async function loadLoveReasons() {

    const container =
        document.getElementById(
            "love-reasons-list"
        );

    if (!container) return;

    try {

        const {
            data,
            error
        } = await db
            .from("love_reasons")
            .select("*")
            .order("created_at", {
                ascending: true
            });

        if (error) {
            throw error;
        }

        loveReasonsData = data || [];

        await renderLoveReasons();

    } catch (error) {

        console.error(
            "Error loading love reasons:",
            error
        );

        container.innerHTML = `
            <p class="love-reasons-loading">
                Failed to load our reasons.
            </p>
        `;
    }
}


/* =========================
   RENDER LOVE REASONS
========================= */

async function renderLoveReasons() {

    const container =
        document.getElementById(
            "love-reasons-list"
        );

    if (!container) return;


    if (
        !loveReasonsData ||
        loveReasonsData.length === 0
    ) {

        container.innerHTML = `
            <p class="love-reasons-loading">
                Our reasons haven't been added yet.
            </p>
        `;

        return;
    }


    const {
        data: {
            user
        }
    } = await db.auth.getUser();


    container.innerHTML =
        loveReasonsData.map(
            (item, index) => {

                const isOwner =
                    user &&
                    item.created_by === user.id;


                return `
                    <article
                        class="love-reason-card"
                    >

                        <div
                            class="love-reason-number"
                        >
                            ${String(
                                index + 1
                            ).padStart(2, "0")}
                        </div>


                        <div
                            class="love-reason-content"
                        >

                            <h3>
                                ${escapeLoveReasonHTML(
                                    item.title
                                )}
                            </h3>


                            ${
                                item.description
                                ? `
                                    <p>
                                        ${escapeLoveReasonHTML(
                                            item.description
                                        )}
                                    </p>
                                `
                                : ""
                            }


                            ${
                                isOwner
                                ? `
                                    <div
                                        class="love-reason-card-actions"
                                    >

                                        <button
                                            type="button"
                                            class="love-reason-edit-btn"
                                            data-id="${item.id}"
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            class="love-reason-delete-btn"
                                            data-id="${item.id}"
                                        >
                                            Delete
                                        </button>

                                    </div>
                                `
                                : ""
                            }

                        </div>

                    </article>
                `;

            }
        ).join("");


    attachLoveReasonActions();
}


/* =========================
   AUTH / ADD BUTTON
========================= */

async function updateLoveReasonActions() {

    const actions =
        document.getElementById(
            "love-reasons-actions"
        );

    if (!actions) return;


    const {
        data: {
            user
        }
    } = await db.auth.getUser();


    if (user) {

        actions.style.display = "flex";

    } else {

        actions.style.display = "none";

    }
}


/* =========================
   OPEN MODAL
========================= */

function openLoveReasonModal() {

    const modal = document.getElementById("love-reason-modal");

    const modalTitle =
        document.getElementById("love-reason-modal-title");

    const message =
        document.getElementById("love-reason-form-message");

    if (!modal) return;

    modal.style.display = "flex";

    if (modalTitle) {
        modalTitle.textContent = editingLoveReasonId
            ? "Edit This Reason"
            : "Add a Reason";
    }

    if (message) {
        message.textContent = "";
    }

    document.body.style.overflow = "hidden";
}

/* =========================
   CLOSE MODAL
========================= */

function closeLoveReasonModal() {

    const modal =
        document.getElementById(
            "love-reason-modal"
        );

    const form =
        document.getElementById(
            "love-reason-form"
        );


    if (!modal) return;


    modal.style.display = "none";


    document.body.style.overflow = "";


    editingLoveReasonId = null;


    if (form) {

        form.reset();

    }


    const idInput =
        document.getElementById(
            "love-reason-id"
        );

    if (idInput) {

        idInput.value = "";

    }


    const modalTitle =
        document.getElementById(
            "love-reason-modal-title"
        );

    if (modalTitle) {

        modalTitle.textContent =
            "Add a Reason";

    }
}


/* =========================
   PREPARE ADD
========================= */

function prepareAddLoveReason() {

    editingLoveReasonId = null;

    const form = document.getElementById("love-reason-form");

    if (form) {
        form.reset();
    }

    const idInput = document.getElementById("love-reason-id");

    if (idInput) {
        idInput.value = "";
    }

    openLoveReasonModal();
}

/* =========================
   PREPARE EDIT
========================= */

function prepareEditLoveReason(id) {

    const item =
        loveReasonsData.find(
            reason =>
                reason.id === id
        );


    if (!item) return;


    editingLoveReasonId = id;


    document.getElementById(
        "love-reason-id"
    ).value = item.id;


    document.getElementById(
        "love-reason-title"
    ).value = item.title || "";


    document.getElementById(
        "love-reason-description"
    ).value = item.description || "";


    openLoveReasonModal();
}


/* =========================
   SAVE LOVE REASON
========================= */

async function saveLoveReason(event) {

    event.preventDefault();


    const submitButton =
        document.getElementById(
            "love-reason-submit-btn"
        );


    const message =
        document.getElementById(
            "love-reason-form-message"
        );


    const title =
        document.getElementById(
            "love-reason-title"
        ).value.trim();


    const description =
        document.getElementById(
            "love-reason-description"
        ).value.trim();


    if (!title) {

        message.textContent =
            "Reason is required.";

        return;
    }


    const {
        data: {
            user
        }
    } = await db.auth.getUser();


    if (!user) {

        message.textContent =
            "Please login first.";

        return;
    }


    submitButton.disabled = true;

    submitButton.textContent =
        "Saving...";


    try {

        const payload = {

            title: title,

            description:
                description || null

        };


        /* =========================
           UPDATE
        ========================= */

        if (editingLoveReasonId) {

            const {
                error
            } = await db
                .from("love_reasons")
                .update(payload)
                .eq(
                    "id",
                    editingLoveReasonId
                )
                .eq(
                    "created_by",
                    user.id
                );


            if (error) {

                throw error;

            }


        } else {

            /* =========================
               CREATE
            ========================= */

            payload.created_by =
                user.id;


            const {
                error
            } = await db
                .from("love_reasons")
                .insert([
                    payload
                ]);


            if (error) {

                throw error;

            }

        }


        closeLoveReasonModal();


        await loadLoveReasons();


    } catch (error) {

        console.error(
            "Error saving love reason:",
            error
        );


        message.textContent =
            error.message ||
            "Failed to save reason.";

    } finally {

        submitButton.disabled = false;

        submitButton.textContent =
            "Save Reason";

    }
}


/* =========================
   DELETE
========================= */

async function deleteLoveReason(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this reason?"
        );


    if (!confirmed) return;


    const {
        data: {
            user
        }
    } = await db.auth.getUser();


    if (!user) {

        alert(
            "Please login first."
        );

        return;
    }


    try {

        const {
            error
        } = await db
            .from("love_reasons")
            .delete()
            .eq(
                "id",
                id
            )
            .eq(
                "created_by",
                user.id
            );


        if (error) {

            throw error;

        }


        await loadLoveReasons();


    } catch (error) {

        console.error(
            "Error deleting love reason:",
            error
        );


        alert(
            error.message ||
            "Failed to delete reason."
        );
    }
}


/* =========================
   BUTTON EVENTS
========================= */

/* =========================
   BUTTON EVENTS
========================= */

function attachLoveReasonActions() {

    const addButton =
        document.getElementById(
            "add-love-reason-btn"
        );

    if (addButton) {

        addButton.onclick =
            prepareAddLoveReason;

    }


    document
        .querySelectorAll(
            ".love-reason-edit-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    prepareEditLoveReason(
                        button.dataset.id
                    );

                }
            );

        });


    document
        .querySelectorAll(
            ".love-reason-delete-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteLoveReason(
                        button.dataset.id
                    );

                }
            );

        });
}

/* =========================
   ESCAPE HTML
========================= */

function escapeLoveReasonHTML(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================
   MODAL EVENTS
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const closeButton =
            document.getElementById(
                "love-reason-modal-close"
            );


        const modal =
            document.getElementById(
                "love-reason-modal"
            );


        const form =
            document.getElementById(
                "love-reason-form"
            );


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closeLoveReasonModal
            );

        }


        if (modal) {

            modal.addEventListener(
                "click",
                event => {

                    if (
                        event.target === modal
                    ) {

                        closeLoveReasonModal();

                    }

                }
            );

        }


        if (form) {

            form.addEventListener(
                "submit",
                saveLoveReason
            );

        }

    }
);


/* =========================
   INITIALIZE
========================= */

async function initializeLoveReasons() {

    await updateLoveReasonActions();

    await loadLoveReasons();

    const addButton =
        document.getElementById(
            "add-love-reason-btn"
        );

    if (addButton) {

        addButton.addEventListener(
            "click",
            prepareAddLoveReason
        );

    }

}


document.addEventListener(
    "DOMContentLoaded",
    initializeLoveReasons
);
