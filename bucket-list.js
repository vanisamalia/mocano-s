/* =========================
   BUCKET LIST
========================= */

let bucketListData = [];


/* =========================
   LOAD BUCKET LIST
========================= */

async function loadBucketList() {

    const container =
        document.getElementById(
            "bucket-list-container"
        );

    if (!container) return;

    try {

        const { data, error } = await db
            .from("bucket_list")
            .select("*")
            .order("created_at", {
                ascending: true
            });

        if (error) {
            throw error;
        }

        bucketListData = data || [];

        await renderBucketList();

    } catch (error) {

        console.error(
            "Error loading Bucket List:",
            error
        );

        container.innerHTML = `
            <p class="bucket-list-loading">
                Failed to load our bucket list.
            </p>
        `;

    }

}


/* =========================
   RENDER BUCKET LIST
========================= */

async function renderBucketList() {

    const container =
        document.getElementById(
            "bucket-list-container"
        );

    if (!container) return;


    const {
        data: {
            user
        }
    } = await db.auth.getUser();


    if (!bucketListData.length) {

        container.innerHTML = `
            <p class="bucket-list-loading">
                Nothing on our bucket list yet.
            </p>
        `;

        await updateBucketListActions();

        return;
    }


    container.innerHTML =
        bucketListData.map(item => {

            const isOwner =
                user &&
                item.created_by === user.id;


            return `
                <article
                    class="bucket-list-card ${
                        item.is_completed
                        ? "completed"
                        : ""
                    }"
                    data-id="${item.id}"
                >

                    <div class="bucket-list-card-header">

                        <button
                            type="button"
                            class="bucket-list-check"
                            data-action="toggle"
                            data-id="${item.id}"
                            aria-label="Toggle completed status"
                        ></button>

                        <div>

                            <h3 class="bucket-list-card-title">
                                ${escapeBucketList(
                                    item.title
                                )}
                            </h3>

                        </div>

                    </div>


                    ${
                        item.description
                        ? `
                            <p class="bucket-list-card-description">
                                ${escapeBucketList(
                                    item.description
                                ).replace(/\n/g, "<br>")}
                            </p>
                        `
                        : ""
                    }


                    <p class="bucket-list-status">

                        ${
                            item.is_completed
                            ? "Completed"
                            : "Not yet"
                        }

                    </p>


                    ${
                        isOwner
                        ? `
                            <div class="bucket-list-card-actions">

                                <button
                                    type="button"
                                    class="bucket-list-edit"
                                    data-action="edit"
                                    data-id="${item.id}"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    class="bucket-list-delete"
                                    data-action="delete"
                                    data-id="${item.id}"
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


    attachBucketListActions();

    await updateBucketListActions();

}


/* =========================
   UPDATE ADD BUTTON
========================= */

async function updateBucketListActions() {

    const actions =
        document.getElementById(
            "bucket-list-actions"
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

function prepareAddBucketList() {

    const modal =
        document.getElementById(
            "bucket-list-modal"
        );

    const modalTitle =
        document.getElementById(
            "bucket-list-modal-title"
        );

    const form =
        document.getElementById(
            "bucket-list-form"
        );

    const idInput =
        document.getElementById(
            "bucket-list-id"
        );

    const titleInput =
        document.getElementById(
            "bucket-list-title"
        );

    const descriptionInput =
        document.getElementById(
            "bucket-list-description"
        );

    const formMessage =
        document.getElementById(
            "bucket-list-form-message"
        );

    const submitButton =
        document.getElementById(
            "bucket-list-submit-btn"
        );


    if (
        !modal ||
        !modalTitle ||
        !form ||
        !idInput ||
        !titleInput ||
        !descriptionInput
    ) {
        return;
    }


    modalTitle.textContent =
        "Add to Our Bucket List";

    idInput.value = "";

    titleInput.value = "";

    descriptionInput.value = "";


    if (formMessage) {
        formMessage.textContent = "";
    }


    if (submitButton) {
        submitButton.textContent =
            "Save Bucket List";
        submitButton.disabled = false;
    }


    modal.style.display = "flex";

    document.body.style.overflow =
        "hidden";

}


/* =========================
   PREPARE EDIT
========================= */

function prepareEditBucketList(id) {

    const item =
        bucketListData.find(
            bucket => bucket.id === id
        );

    if (!item) return;


    const modal =
        document.getElementById(
            "bucket-list-modal"
        );

    const modalTitle =
        document.getElementById(
            "bucket-list-modal-title"
        );

    const form =
        document.getElementById(
            "bucket-list-form"
        );

    const idInput =
        document.getElementById(
            "bucket-list-id"
        );

    const titleInput =
        document.getElementById(
            "bucket-list-title"
        );

    const descriptionInput =
        document.getElementById(
            "bucket-list-description"
        );

    const formMessage =
        document.getElementById(
            "bucket-list-form-message"
        );

    const submitButton =
        document.getElementById(
            "bucket-list-submit-btn"
        );


    if (
        !modal ||
        !modalTitle ||
        !form ||
        !idInput ||
        !titleInput ||
        !descriptionInput
    ) {
        return;
    }


    modalTitle.textContent =
        "Edit Bucket List";

    idInput.value =
        item.id;

    titleInput.value =
        item.title;

    descriptionInput.value =
        item.description || "";


    if (formMessage) {
        formMessage.textContent = "";
    }


    if (submitButton) {
        submitButton.textContent =
            "Update Bucket List";
        submitButton.disabled = false;
    }


    modal.style.display = "flex";

    document.body.style.overflow =
        "hidden";

}


/* =========================
   SAVE BUCKET LIST
========================= */

async function saveBucketList(event) {

    event.preventDefault();


    const id =
        document.getElementById(
            "bucket-list-id"
        ).value;

    const title =
        document.getElementById(
            "bucket-list-title"
        ).value.trim();

    const description =
        document.getElementById(
            "bucket-list-description"
        ).value.trim();

    const formMessage =
        document.getElementById(
            "bucket-list-form-message"
        );

    const submitButton =
        document.getElementById(
            "bucket-list-submit-btn"
        );


    if (!title) {

        if (formMessage) {
            formMessage.textContent =
                "Please enter something for your bucket list.";
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
                    "You must be logged in to add a bucket list item.";
            }

            return;
        }


        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent =
                "Saving...";
        }


        if (id) {

            const { error } =
                await db
                    .from("bucket_list")
                    .update({
                        title: title,
                        description: description
                    })
                    .eq("id", id)
                    .eq("created_by", user.id);


            if (error) {
                throw error;
            }

        } else {

            const { error } =
                await db
                    .from("bucket_list")
                    .insert([
                        {
                            title: title,
                            description: description,
                            is_completed: false,
                            created_by: user.id
                        }
                    ]);


            if (error) {
                throw error;
            }

        }


        closeBucketListModal();

        await loadBucketList();


    } catch (error) {

        console.error(
            "Error saving Bucket List:",
            error
        );

        if (formMessage) {
            formMessage.textContent =
                error.message ||
                "Failed to save bucket list.";
        }

    } finally {

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent =
                id
                ? "Update Bucket List"
                : "Save Bucket List";
        }

    }

}


/* =========================
   TOGGLE COMPLETED
========================= */

async function toggleBucketList(id) {

    const item =
        bucketListData.find(
            bucket => bucket.id === id
        );

    if (!item) return;


    try {

        const {
            data: {
                user
            }
        } = await db.auth.getUser();


        if (!user) {
            return;
        }


        const { error } =
            await db
                .from("bucket_list")
                .update({
                    is_completed:
                        !item.is_completed
                })
                .eq("id", id)
                .eq("created_by", user.id);


        if (error) {
            throw error;
        }


        await loadBucketList();


    } catch (error) {

        console.error(
            "Error updating Bucket List:",
            error
        );

        alert(
            "Failed to update the bucket list."
        );

    }

}


/* =========================
   DELETE
========================= */

async function deleteBucketList(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this bucket list item?"
        );


    if (!confirmed) return;


    try {

        const {
            data: {
                user
            }
        } = await db.auth.getUser();


        if (!user) {
            return;
        }


        const { error } =
            await db
                .from("bucket_list")
                .delete()
                .eq("id", id)
                .eq("created_by", user.id);


        if (error) {
            throw error;
        }


        await loadBucketList();


    } catch (error) {

        console.error(
            "Error deleting Bucket List:",
            error
        );

        alert(
            "Failed to delete the bucket list item."
        );

    }

}


/* =========================
   CLOSE MODAL
========================= */

function closeBucketListModal() {

    const modal =
        document.getElementById(
            "bucket-list-modal"
        );

    if (!modal) return;


    modal.style.display = "none";

    document.body.style.overflow = "";


    const form =
        document.getElementById(
            "bucket-list-form"
        );

    if (form) {
        form.reset();
    }


    const idInput =
        document.getElementById(
            "bucket-list-id"
        );

    if (idInput) {
        idInput.value = "";
    }


    const formMessage =
        document.getElementById(
            "bucket-list-form-message"
        );

    if (formMessage) {
        formMessage.textContent = "";
    }

}


/* =========================
   ESCAPE HTML
========================= */

function escapeBucketList(text) {

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

function attachBucketListActions() {

    const toggleButtons =
        document.querySelectorAll(
            ".bucket-list-check"
        );


    toggleButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                toggleBucketList(
                    button.dataset.id
                );

            }
        );

    });


    const editButtons =
        document.querySelectorAll(
            ".bucket-list-edit"
        );


    editButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                prepareEditBucketList(
                    button.dataset.id
                );

            }
        );

    });


    const deleteButtons =
        document.querySelectorAll(
            ".bucket-list-delete"
        );


    deleteButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                deleteBucketList(
                    button.dataset.id
                );

            }
        );

    });

}


/* =========================
   INITIALIZE
========================= */

async function initializeBucketList() {

    const addButton =
        document.getElementById(
            "add-bucket-list-btn"
        );

    const closeButton =
        document.getElementById(
            "bucket-list-modal-close"
        );

    const form =
        document.getElementById(
            "bucket-list-form"
        );


    if (addButton) {

        addButton.addEventListener(
            "click",
            prepareAddBucketList
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeBucketListModal
        );

    }


    if (form) {

        form.addEventListener(
            "submit",
            saveBucketList
        );

    }


    const modal =
        document.getElementById(
            "bucket-list-modal"
        );


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    closeBucketListModal();

                }

            }
        );

    }


    await updateBucketListActions();

    await loadBucketList();

}


document.addEventListener(
    "DOMContentLoaded",
    initializeBucketList
);
