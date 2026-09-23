/* =========================
   OPEN WHEN
========================= */

let openWhenData = [];


/* =========================
   LOAD OPEN WHEN
========================= */

async function loadOpenWhen() {

    const container =
        document.getElementById(
            "open-when-list"
        );

    if (!container) return;

    try {

        const { data, error } = await db
            .from("open_when")
            .select("*")
            .order("created_at", {
                ascending: true
            });

        if (error) {
            throw error;
        }

        openWhenData = data || [];

        renderOpenWhen();

    } catch (error) {

        console.error(
            "Error loading Open When:",
            error
        );

        container.innerHTML = `
            <p class="open-when-loading">
                Failed to load our letters.
            </p>
        `;

    }

}


/* =========================
   RENDER OPEN WHEN
========================= */

async function renderOpenWhen() {

    const container =
        document.getElementById(
            "open-when-list"
        );

    if (!container) return;


    const {
        data: {
            user
        }
    } = await db.auth.getUser();


    if (!openWhenData.length) {

        container.innerHTML = `
            <p class="open-when-loading">
                No letters have been added yet.
            </p>
        `;

        await updateOpenWhenActions();

        return;
    }


    container.innerHTML =
        openWhenData.map(letter => {

            const isOwner =
                user &&
                letter.created_by === user.id;


            return `
                <article
                    class="open-when-card"
                    data-id="${letter.id}"
                >

                    <h3 class="open-when-card-title">
                        Open when ${escapeOpenWhen(
                            letter.title
                        )}
                    </h3>

                    <button
                        type="button"
                        class="open-when-card-button"
                        data-action="open"
                        data-id="${letter.id}"
                    >
                        Open Letter
                    </button>

                    ${
                        isOwner
                        ? `
                            <div class="open-when-card-actions">

                                <button
                                    type="button"
                                    class="open-when-edit"
                                    data-action="edit"
                                    data-id="${letter.id}"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    class="open-when-delete"
                                    data-action="delete"
                                    data-id="${letter.id}"
                                >
                                    Delete
                                </button>

                            </div>
                        `
                        : ""
                    }

                </article>
            `;

        }).join("");


    attachOpenWhenActions();

    await updateOpenWhenActions();

}


/* =========================
   UPDATE ADD BUTTON
========================= */

async function updateOpenWhenActions() {

    const actions =
        document.getElementById(
            "open-when-actions"
        );

    if (!actions) return;


    const {
        data: {
            user
        }
    } = await db.auth.getUser();


    actions.style.display =
        user
        ? "block"
        : "none";

}


/* =========================
   PREPARE ADD
========================= */

function prepareAddOpenWhen() {

    const modal =
        document.getElementById(
            "open-when-modal"
        );

    const modalTitle =
        document.getElementById(
            "open-when-modal-title"
        );

    const form =
        document.getElementById(
            "open-when-form"
        );

    const idInput =
        document.getElementById(
            "open-when-id"
        );

    const titleInput =
        document.getElementById(
            "open-when-title"
        );

    const messageInput =
        document.getElementById(
            "open-when-message"
        );

    const message =
        document.getElementById(
            "open-when-form-message"
        );

    const submitButton =
        document.getElementById(
            "open-when-submit-btn"
        );


    if (
        !modal ||
        !modalTitle ||
        !form ||
        !idInput ||
        !titleInput ||
        !messageInput
    ) {
        return;
    }


    modalTitle.textContent =
        "Add a Letter";

    idInput.value = "";

    titleInput.value = "";

    messageInput.value = "";

    if (message) {
        message.textContent = "";
    }

    form.style.display = "";


    if (submitButton) {
        submitButton.style.display = "";
        submitButton.textContent = "Save Letter";
    }


    const letterContent =
        modal.querySelector(
            ".open-when-letter-content"
        );

    if (letterContent) {
        letterContent.remove();
    }


    modal.style.display = "flex";

    document.body.style.overflow = "hidden";

}


/* =========================
   PREPARE EDIT
========================= */

function prepareEditOpenWhen(id) {

    const letter =
        openWhenData.find(
            item => item.id === id
        );

    if (!letter) return;


    const modal =
        document.getElementById(
            "open-when-modal"
        );

    const modalTitle =
        document.getElementById(
            "open-when-modal-title"
        );

    const form =
        document.getElementById(
            "open-when-form"
        );

    const idInput =
        document.getElementById(
            "open-when-id"
        );

    const titleInput =
        document.getElementById(
            "open-when-title"
        );

    const messageInput =
        document.getElementById(
            "open-when-message"
        );

    const formMessage =
        document.getElementById(
            "open-when-form-message"
        );

    const submitButton =
        document.getElementById(
            "open-when-submit-btn"
        );


    if (
        !modal ||
        !modalTitle ||
        !form ||
        !idInput ||
        !titleInput ||
        !messageInput
    ) {
        return;
    }


    modalTitle.textContent =
        "Edit Letter";

    idInput.value =
        letter.id;

    titleInput.value =
        letter.title;

    messageInput.value =
        letter.message || "";


    if (formMessage) {
        formMessage.textContent = "";
    }


    form.style.display = "";


    if (submitButton) {
        submitButton.style.display = "";
        submitButton.textContent = "Update Letter";
    }


    const letterContent =
        modal.querySelector(
            ".open-when-letter-content"
        );

    if (letterContent) {
        letterContent.remove();
    }


    modal.style.display = "flex";

    document.body.style.overflow = "hidden";

}


/* =========================
   SAVE LETTER
========================= */

async function saveOpenWhen(event) {

    event.preventDefault();


    const id =
        document.getElementById(
            "open-when-id"
        ).value;

    const title =
        document.getElementById(
            "open-when-title"
        ).value.trim();

    const message =
        document.getElementById(
            "open-when-message"
        ).value.trim();

    const formMessage =
        document.getElementById(
            "open-when-form-message"
        );

    const submitButton =
        document.getElementById(
            "open-when-submit-btn"
        );


    if (!title) {

        if (formMessage) {
            formMessage.textContent =
                "Please enter when this letter should be opened.";
        }

        return;
    }


    try {

        const {
            data: {
                user
            }
        } = await db.auth.getUser();


        if (!user) {

            if (formMessage) {
                formMessage.textContent =
                    "You must be logged in to add a letter.";
            }

            return;
        }


        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Saving...";
        }


        if (id) {

            const { error } =
                await db
                    .from("open_when")
                    .update({
                        title: title,
                        message: message
                    })
                    .eq("id", id)
                    .eq("created_by", user.id);


            if (error) {
                throw error;
            }

        } else {

            const { error } =
                await db
                    .from("open_when")
                    .insert([
                        {
                            title: title,
                            message: message,
                            created_by: user.id
                        }
                    ]);


            if (error) {
                throw error;
            }

        }


        closeOpenWhenModal();

        await loadOpenWhen();


    } catch (error) {

        console.error(
            "Error saving Open When:",
            error
        );

        if (formMessage) {
            formMessage.textContent =
                error.message ||
                "Failed to save the letter.";
        }

    } finally {

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent =
                id
                ? "Update Letter"
                : "Save Letter";
        }

    }

}


/* =========================
   DELETE LETTER
========================= */

async function deleteOpenWhen(id) {

    const letter =
        openWhenData.find(
            item => item.id === id
        );

    if (!letter) return;


    const confirmed =
        confirm(
            "Are you sure you want to delete this letter?"
        );


    if (!confirmed) return;


    try {

        const { error } =
            await db
                .from("open_when")
                .delete()
                .eq("id", id);


        if (error) {
            throw error;
        }


        await loadOpenWhen();


    } catch (error) {

        console.error(
            "Error deleting Open When:",
            error
        );

        alert(
            "Failed to delete the letter."
        );

    }

}


/* =========================
   OPEN LETTER
========================= */

function openOpenWhenLetter(id) {

    const letter =
        openWhenData.find(
            item => item.id === id
        );

    if (!letter) return;


    const modal =
        document.getElementById(
            "open-when-modal"
        );

    const modalTitle =
        document.getElementById(
            "open-when-modal-title"
        );

    const form =
        document.getElementById(
            "open-when-form"
        );


    if (
        !modal ||
        !modalTitle ||
        !form
    ) {
        return;
    }


    modalTitle.textContent =
        `Open when ${letter.title}`;


    form.style.display = "none";


    const oldContent =
        modal.querySelector(
            ".open-when-letter-content"
        );

    if (oldContent) {
        oldContent.remove();
    }


    const letterContent =
        document.createElement("div");

    letterContent.className =
        "open-when-letter-content";


    letterContent.innerHTML = `
        <p>
            ${escapeOpenWhen(
                letter.message || ""
            ).replace(/\n/g, "<br>")}
        </p>
    `;


    modalTitle.after(letterContent);


    modal.style.display = "flex";

    document.body.style.overflow = "hidden";

}


/* =========================
   CLOSE MODAL
========================= */

function closeOpenWhenModal() {

    const modal =
        document.getElementById(
            "open-when-modal"
        );

    if (!modal) return;


    modal.style.display = "none";

    document.body.style.overflow = "";


    const form =
        document.getElementById(
            "open-when-form"
        );

    if (form) {
        form.style.display = "";
    }


    const submitButton =
        document.getElementById(
            "open-when-submit-btn"
        );

    if (submitButton) {
        submitButton.style.display = "";
    }


    const letterContent =
        modal.querySelector(
            ".open-when-letter-content"
        );

    if (letterContent) {
        letterContent.remove();
    }

}


/* =========================
   ESCAPE HTML
========================= */

function escapeOpenWhen(text) {

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================
   ATTACH ACTIONS
========================= */

function attachOpenWhenActions() {

    const buttons =
        document.querySelectorAll(
            ".open-when-card-button"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                openOpenWhenLetter(
                    button.dataset.id
                );

            }
        );

    });


    const editButtons =
        document.querySelectorAll(
            ".open-when-edit"
        );


    editButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                prepareEditOpenWhen(
                    button.dataset.id
                );

            }
        );

    });


    const deleteButtons =
        document.querySelectorAll(
            ".open-when-delete"
        );


    deleteButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                deleteOpenWhen(
                    button.dataset.id
                );

            }
        );

    });

}


/* =========================
   INITIALIZE
========================= */

async function initializeOpenWhen() {

    const addButton =
        document.getElementById(
            "add-open-when-btn"
        );

    const closeButton =
        document.getElementById(
            "open-when-modal-close"
        );

    const form =
        document.getElementById(
            "open-when-form"
        );


    if (addButton) {

        addButton.addEventListener(
            "click",
            prepareAddOpenWhen
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeOpenWhenModal
        );

    }


    if (form) {

        form.addEventListener(
            "submit",
            saveOpenWhen
        );

    }


    const modal =
        document.getElementById(
            "open-when-modal"
        );


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    closeOpenWhenModal();

                }

            }
        );

    }


    await updateOpenWhenActions();

    await loadOpenWhen();

}


document.addEventListener(
    "DOMContentLoaded",
    initializeOpenWhen
);
