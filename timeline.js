/* =========================
   OUR TIMELINE
========================= */

let timelineData = [];
let editingTimelineId = null;


/* =========================
   LOAD TIMELINE
========================= */

async function loadTimeline() {

    const container = document.getElementById("timeline-list");

    if (!container) return;

    try {

        const { data, error } = await db
            .from("timeline")
            .select("*")
            .order("event_date", {
                ascending: true
            });

        if (error) {
            throw error;
        }

        timelineData = data || [];

        renderTimeline();

    } catch (error) {

        console.error(
            "Error loading timeline:",
            error
        );

        container.innerHTML = `
            <p class="timeline-loading">
                Failed to load our timeline.
            </p>
        `;
    }
}


/* =========================
   RENDER TIMELINE
========================= */

async function renderTimeline() {

    const container =
        document.getElementById("timeline-list");

    if (!container) return;

    if (!timelineData || timelineData.length === 0) {

        container.innerHTML = `
            <p class="timeline-loading">
                Our timeline hasn't been added yet.
            </p>
        `;

        return;
    }

    let currentUser = null;

    const {
        data: {
            user
        }
    } = await db.auth.getUser();

    currentUser = user;


    /* =========================
       CREATE TIMELINE ROWS
    ========================= */

    const itemsPerRow = 4;

    const rows = [];

    for (
        let i = 0;
        i < timelineData.length;
        i += itemsPerRow
    ) {

        rows.push(
            timelineData.slice(
                i,
                i + itemsPerRow
            )
        );

    }


    /* =========================
       RENDER ROWS
    ========================= */

    container.innerHTML = rows
        .map((row, rowIndex) => {

            const isReversed =
                rowIndex % 2 === 1;

            const displayRow =
                isReversed
                    ? [...row].reverse()
                    : row;

            return `
                <div
                    class="timeline-row ${
                        isReversed
                            ? "timeline-row-reverse"
                            : "timeline-row-normal"
                    }"
                >

                    ${displayRow
                        .map((item) => {

                            const date =
                                new Date(
                                    item.event_date
                                );

                            const formattedDate =
                                date.toLocaleDateString(
                                    "en-US",
                                    {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric"
                                    }
                                );

                            const isOwner =
                                currentUser &&
                                item.created_by ===
                                    currentUser.id;


                            return `
                                <article
                                    class="timeline-item"
                                >

                                    <div
                                        class="timeline-dot"
                                    ></div>

                                    <div
                                        class="timeline-content"
                                    >

                                        <p
                                            class="timeline-date"
                                        >
                                            ${formattedDate}
                                        </p>

                                        <h3>
                                            ${escapeTimelineHTML(
                                                item.title
                                            )}
                                        </h3>

                                        ${
                                            item.location
                                                ? `
                                                    <p
                                                        class="timeline-location"
                                                    >
                                                        ${escapeTimelineHTML(
                                                            item.location
                                                        )}
                                                    </p>
                                                `
                                                : ""
                                        }

                                        ${
                                            item.story
                                                ? `
                                                    <p
                                                        class="timeline-story"
                                                    >
                                                        ${escapeTimelineHTML(
                                                            item.story
                                                        )}
                                                    </p>
                                                `
                                                : ""
                                        }

                                        ${
                                            item.image_url
                                                ? `
                                                    <img
                                                        src="${escapeTimelineAttribute(
                                                            item.image_url
                                                        )}"
                                                        alt="${escapeTimelineAttribute(
                                                            item.title
                                                        )}"
                                                        class="timeline-image"
                                                    >
                                                `
                                                : ""
                                        }

                                        ${
                                            isOwner
                                                ? `
                                                    <div
                                                        class="timeline-card-actions"
                                                    >

                                                        <button
                                                            type="button"
                                                            class="timeline-edit-btn"
                                                            data-id="${item.id}"
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            class="timeline-delete-btn"
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

                        })
                        .join("")}

                </div>
            `;

        })
        .join("");


    attachTimelineActions();
}

/* =========================
   AUTH CHECK
========================= */

async function updateTimelineActions() {

    const actions =
        document.getElementById("timeline-actions");

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
   MODAL
========================= */

function openTimelineModal() {

    const modal =
        document.getElementById("timeline-modal");

    const modalTitle =
        document.getElementById(
            "timeline-modal-title"
        );

    const formMessage =
        document.getElementById(
            "timeline-form-message"
        );

    if (!modal) return;

    modal.style.display = "flex";

    if (modalTitle) {
        modalTitle.textContent =
            editingTimelineId
                ? "Edit This Moment"
                : "Add a New Moment";
    }

    if (formMessage) {
        formMessage.textContent = "";
    }

    document.body.style.overflow = "hidden";
}


function closeTimelineModal() {

    const modal =
        document.getElementById("timeline-modal");

    const form =
        document.getElementById("timeline-form");

    if (!modal) return;

    modal.style.display = "none";

    document.body.style.overflow = "";

    editingTimelineId = null;

    if (form) {
        form.reset();
    }

    const idInput =
        document.getElementById("timeline-id");

    if (idInput) {
        idInput.value = "";
    }

    const modalTitle =
        document.getElementById(
            "timeline-modal-title"
        );

    if (modalTitle) {
        modalTitle.textContent =
            "Add a New Moment";
    }
}


/* =========================
   ADD TIMELINE
========================= */

function prepareAddTimeline() {

    editingTimelineId = null;

    const form =
        document.getElementById("timeline-form");

    if (form) {
        form.reset();
    }

    const idInput =
        document.getElementById("timeline-id");

    if (idInput) {
        idInput.value = "";
    }

    openTimelineModal();
}


/* =========================
   EDIT TIMELINE
========================= */

function prepareEditTimeline(id) {

    const item =
        timelineData.find(
            timeline => timeline.id === id
        );

    if (!item) return;

    editingTimelineId = id;

    document.getElementById("timeline-id").value =
        item.id;

    document.getElementById("timeline-date").value =
        item.event_date || "";

    document.getElementById("timeline-title").value =
        item.title || "";

    document.getElementById("timeline-location").value =
        item.location || "";

    document.getElementById("timeline-story").value =
        item.story || "";

    document.getElementById("timeline-image").value =
        item.image_url || "";

    openTimelineModal();
}


/* =========================
   SAVE TIMELINE
========================= */

async function saveTimeline(event) {

    event.preventDefault();

    const submitButton =
        document.getElementById(
            "timeline-submit-btn"
        );

    const message =
        document.getElementById(
            "timeline-form-message"
        );

    const date =
        document.getElementById(
            "timeline-date"
        ).value;

    const title =
        document.getElementById(
            "timeline-title"
        ).value.trim();

    const location =
        document.getElementById(
            "timeline-location"
        ).value.trim();

    const story =
        document.getElementById(
            "timeline-story"
        ).value.trim();

    const imageUrl =
        document.getElementById(
            "timeline-image"
        ).value.trim();


    if (!date || !title) {

        message.textContent =
            "Date and title are required.";

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

        const timelinePayload = {

            event_date: date,

            title: title,

            story: story || null,

            location: location || null,

            image_url: imageUrl || null

        };


        if (editingTimelineId) {

            const {
                error
            } = await db
                .from("timeline")
                .update(timelinePayload)
                .eq(
                    "id",
                    editingTimelineId
                )
                .eq(
                    "created_by",
                    user.id
                );

            if (error) {
                throw error;
            }

        } else {

            timelinePayload.created_by =
                user.id;

            const {
                error
            } = await db
                .from("timeline")
                .insert([
                    timelinePayload
                ]);

            if (error) {
                throw error;
            }
        }


        closeTimelineModal();

        await loadTimeline();


    } catch (error) {

        console.error(
            "Error saving timeline:",
            error
        );

        message.textContent =
            error.message ||
            "Failed to save timeline.";

    } finally {

        submitButton.disabled = false;

        submitButton.textContent =
            "Save Timeline";
    }
}


/* =========================
   DELETE TIMELINE
========================= */

async function deleteTimeline(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this timeline?"
        );

    if (!confirmed) return;


    const {
        data: {
            user
        }
    } = await db.auth.getUser();


    if (!user) {

        alert("Please login first.");

        return;
    }


    try {

        const {
            error
        } = await db
            .from("timeline")
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


        await loadTimeline();


    } catch (error) {

        console.error(
            "Error deleting timeline:",
            error
        );

        alert(
            error.message ||
            "Failed to delete timeline."
        );
    }
}


/* =========================
   BUTTON EVENTS
========================= */

function attachTimelineActions() {

    const addButton =
        document.getElementById(
            "add-timeline-btn"
        );

    if (addButton) {

        addButton.onclick =
            prepareAddTimeline;
    }


    document
        .querySelectorAll(
            ".timeline-edit-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    prepareEditTimeline(
                        button.dataset.id
                    );

                }
            );

        });


    document
        .querySelectorAll(
            ".timeline-delete-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteTimeline(
                        button.dataset.id
                    );

                }
            );

        });
}


/* =========================
   ESCAPE HTML
========================= */

function escapeTimelineHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeTimelineAttribute(value) {

    return escapeTimelineHTML(value);
}


/* =========================
   MODAL EVENTS
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const closeButton =
            document.getElementById(
                "timeline-modal-close"
            );

        const modal =
            document.getElementById(
                "timeline-modal"
            );

        const form =
            document.getElementById(
                "timeline-form"
            );


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closeTimelineModal
            );

        }


        if (modal) {

            modal.addEventListener(
                "click",
                (event) => {

                    if (
                        event.target === modal
                    ) {

                        closeTimelineModal();

                    }

                }
            );

        }


        if (form) {

            form.addEventListener(
                "submit",
                saveTimeline
            );

        }

    }
);


/* =========================
   INITIAL LOAD
========================= */

async function initializeTimeline() {

    await updateTimelineActions();

    await loadTimeline();
}


initializeTimeline();

