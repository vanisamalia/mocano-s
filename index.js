// =========================
// STATE
// =========================

let currentUser = null;
let editingMemory = null;


// =========================
// ELEMENTS
// =========================

const loginLink =
    document.getElementById("login-link");

const profileMenu =
    document.getElementById("profile-menu");

const profileButton =
    document.getElementById("profile-button");

const profileDropdown =
    document.getElementById("profile-dropdown");

const logoutBtn =
    document.getElementById("logout-btn");

const memoryActions =
    document.getElementById("memory-actions");

const addMemoryBtn =
    document.getElementById("add-memory-btn");

const memoryList =
    document.getElementById("memory-list");

const memoryModal =
    document.getElementById("memory-modal");

const modalClose =
    document.getElementById("modal-close");

const cancelBtn =
    document.getElementById("cancel-btn");

const memoryForm =
    document.getElementById("memory-form");

const modalTitle =
    document.getElementById("modal-title");

const formMessage =
    document.getElementById("form-message");

const memoryIdInput =
    document.getElementById("memory-id");

const oldImagePathInput =
    document.getElementById("old-image-path");

const titleInput =
    document.getElementById("title");

const eventDateInput =
    document.getElementById("event-date");

const storyInput =
    document.getElementById("story");

const photoInput =
    document.getElementById("photo");

const preview =
    document.getElementById("preview");

const photoPreviewContainer =
    document.getElementById("photo-preview-container");


// =========================
// AUTH
// =========================

async function checkUser() {

    const { data, error } =
        await db.auth.getUser();

    if (error) {

        console.error(
            "Gagal mengambil user:",
            error
        );

        currentUser = null;

    } else {

        currentUser =
            data?.user || null;

    }

    updateNavbar();

    await loadMemories();

}


// =========================
// UPDATE NAVBAR
// =========================

function updateNavbar() {

    if (currentUser) {

        // Sudah login
        loginLink.style.display = "none";

        profileMenu.style.display = "block";

        memoryActions.style.display = "flex";

    } else {

        // Belum login
        loginLink.style.display = "inline-flex";

        profileMenu.style.display = "none";

        memoryActions.style.display = "none";

        closeProfileDropdown();
    }

}


// =========================
// PROFILE DROPDOWN
// =========================

profileButton.addEventListener(
    "click",
    function (event) {

        event.stopPropagation();

        profileDropdown.classList.toggle(
            "show"
        );

    }
);


document.addEventListener(
    "click",
    function (event) {

        if (
            !profileMenu.contains(event.target)
        ) {

            closeProfileDropdown();

        }

    }
);


function closeProfileDropdown() {

    profileDropdown.classList.remove(
        "show"
    );

}


// =========================
// LOGOUT
// =========================

logoutBtn.addEventListener(
    "click",
    async function () {

        const { error } =
            await db.auth.signOut();

        if (error) {

            console.error(
                "Logout gagal:",
                error
            );

            return;
        }

        currentUser = null;

        closeProfileDropdown();

        updateNavbar();

        await loadMemories();

    }
);


// =========================
// LOAD MEMORIES
// =========================

async function loadMemories() {

    memoryList.innerHTML =
        `<p class="memory-loading">
            Memuat memories...
        </p>`;


    const { data, error } =
        await db
            .from("memories")
            .select("*")
            .order(
                "event_date",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(error);

        memoryList.innerHTML =
            `<p class="memory-error">
                Gagal memuat cerita.
            </p>`;

        return;
    }


    if (!data || data.length === 0) {

        memoryList.innerHTML =
            `<div class="memory-empty">
                <p>Belum ada kenangan.</p>
            </div>`;

        return;
    }


    memoryList.innerHTML = "";


    for (const memory of data) {

        const card =
            await createMemoryCard(memory);

        memoryList.appendChild(card);

    }

}


// =========================
// CREATE MEMORY CARD
// =========================

async function createMemoryCard(memory) {

    const card =
        document.createElement("div");

    card.className =
        "memory-card";


    // =========================
    // IMAGE
    // =========================

    const imageContainer =
        document.createElement("div");

    imageContainer.className =
        "memory-image";


    if (memory.image_path) {

        const imageUrl =
            await getMemoryImageUrl(
                memory.image_path
            );


        if (imageUrl) {

            const image =
                document.createElement("img");

            image.src =
                imageUrl;

            image.alt =
                memory.title || "Memory";

            image.loading =
                "lazy";

            imageContainer.appendChild(
                image
            );

        } else {

            imageContainer.innerHTML =
                `<div class="image-placeholder">
                    Photo
                </div>`;

        }

    } else if (memory.image_url) {

        // Fallback jika ada data lama
        // yang masih menggunakan image_url

        const image =
            document.createElement("img");

        image.src =
            memory.image_url;

        image.alt =
            memory.title || "Memory";

        image.loading =
            "lazy";

        imageContainer.appendChild(
            image
        );

    } else {

        imageContainer.innerHTML =
            `<div class="image-placeholder">
                Photo
            </div>`;

    }


    // =========================
    // CONTENT
    // =========================

    const content =
        document.createElement("div");

    content.className =
        "memory-content";


    const date =
        formatDate(
            memory.event_date
        );


    content.innerHTML = `

        <p class="memory-date">
            ${escapeHtml(
                date.toUpperCase()
            )}
        </p>

        <h3>
            ${escapeHtml(
                memory.title || ""
            )}
        </h3>

        <p class="memory-story">
            ${escapeHtml(
                memory.story || ""
            )}
        </p>

    `;


    // =========================
    // CRUD BUTTONS
    // =========================

    /*
        Tombol Edit/Delete hanya ditampilkan
        untuk memory milik user yang sedang login.
    */

    if (
        currentUser &&
        memory.created_by === currentUser.id
    ) {

        const actions =
            document.createElement("div");

        actions.className =
            "memory-card-actions";


        const editButton =
            document.createElement("button");

        editButton.type =
            "button";

        editButton.className =
            "memory-edit-btn";

        editButton.textContent =
            "Edit";


        editButton.addEventListener(
            "click",
            function () {

                editMemory(
                    memory.id
                );

            }
        );


        const deleteButton =
            document.createElement("button");

        deleteButton.type =
            "button";

        deleteButton.className =
            "memory-delete-btn";

        deleteButton.textContent =
            "Delete";


        deleteButton.addEventListener(
            "click",
            function () {

                deleteMemory(
                    memory.id,
                    memory.image_path
                );

            }
        );


        actions.appendChild(
            editButton
        );

        actions.appendChild(
            deleteButton
        );

        content.appendChild(
            actions
        );

    }


    card.appendChild(
        imageContainer
    );

    card.appendChild(
        content
    );


    return card;

}


// =========================
// GET STORAGE IMAGE URL
// =========================

async function getMemoryImageUrl(
    imagePath
) {

    if (!imagePath) {
        return null;
    }


    const { data, error } =
        await db.storage
            .from("memory-photos")
            .createSignedUrl(
                imagePath,
                60 * 60
            );


    if (error) {

        console.error(
            "Gagal membuat signed URL:",
            error
        );

        return null;
    }


    return data?.signedUrl || null;

}


// =========================
// FORMAT DATE
// =========================

function formatDate(dateString) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(dateString);


    if (Number.isNaN(
        date.getTime()
    )) {

        return "";

    }


    return date.toLocaleDateString(
        "id-ID",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

}


// =========================
// OPEN ADD MODAL
// =========================

addMemoryBtn.addEventListener(
    "click",
    function () {

        if (!currentUser) {

            window.location.href =
                "login.html";

            return;
        }


        openAddModal();

    }
);


function openAddModal() {

    editingMemory = null;

    memoryForm.reset();

    memoryIdInput.value = "";

    oldImagePathInput.value = "";

    modalTitle.textContent =
        "Add New Memory";

    formMessage.textContent = "";

    resetPreview();

    memoryModal.style.display =
        "flex";

    document.body.classList.add(
        "modal-open"
    );


    setTimeout(
        function () {

            titleInput.focus();

        },
        100
    );

}


// =========================
// OPEN EDIT MODAL
// =========================

async function editMemory(id) {

    if (!currentUser) {
        return;
    }


    const { data, error } =
        await db
            .from("memories")
            .select("*")
            .eq("id", id)
            .single();


    if (error || !data) {

        console.error(error);

        return;
    }


    // Pastikan memory milik user
    if (
        data.created_by !==
        currentUser.id
    ) {

        return;
    }


    editingMemory =
        data;


    memoryIdInput.value =
        data.id;

    oldImagePathInput.value =
        data.image_path || "";

    titleInput.value =
        data.title || "";

    eventDateInput.value =
        data.event_date || "";

    storyInput.value =
        data.story || "";


    modalTitle.textContent =
        "Edit Memory";

    formMessage.textContent =
        "";


    // Preview foto lama

    resetPreview();


    if (data.image_path) {

        const imageUrl =
            await getMemoryImageUrl(
                data.image_path
            );


        if (imageUrl) {

            preview.src =
                imageUrl;

            photoPreviewContainer.style.display =
                "block";

        }

    }


    memoryModal.style.display =
        "flex";

    document.body.classList.add(
        "modal-open"
    );

}


// =========================
// PHOTO PREVIEW
// =========================

photoInput.addEventListener(
    "change",
    function () {

        const file =
            photoInput.files[0];


        if (!file) {

            if (
                editingMemory &&
                editingMemory.image_path
            ) {

                return;

            }

            resetPreview();

            return;
        }


        if (!file.type.startsWith(
            "image/"
        )) {

            formMessage.textContent =
                "File yang dipilih harus berupa gambar.";

            photoInput.value = "";

            return;
        }


        if (
            file.size >
            10 * 1024 * 1024
        ) {

            formMessage.textContent =
                "Ukuran foto maksimal 10 MB.";

            photoInput.value = "";

            return;
        }


        formMessage.textContent =
            "";


        const reader =
            new FileReader();


        reader.onload =
            function (event) {

                preview.src =
                    event.target.result;

                photoPreviewContainer.style.display =
                    "block";

            };


        reader.readAsDataURL(file);

    }
);


// =========================
// UPLOAD PHOTO
// =========================

async function uploadPhoto(file) {

    if (!file) {
        return null;
    }


    if (!currentUser) {

        throw new Error(
            "User belum login."
        );

    }


    if (!file.type.startsWith(
        "image/"
    )) {

        throw new Error(
            "File harus berupa gambar."
        );

    }


    if (
        file.size >
        10 * 1024 * 1024
    ) {

        throw new Error(
            "Ukuran foto maksimal 10 MB."
        );

    }


    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    const fileName =
        `${crypto.randomUUID()}.${extension}`;


    const filePath =
        `${currentUser.id}/${fileName}`;


    const { error } =
        await db.storage
            .from("memory-photos")
            .upload(
                filePath,
                file,
                {
                    cacheControl: "3600",
                    upsert: false
                }
            );


    if (error) {

        throw error;

    }


    return {
        path: filePath
    };

}


// =========================
// SAVE MEMORY
// =========================

memoryForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        if (!currentUser) {

            formMessage.textContent =
                "Silakan login terlebih dahulu.";

            return;
        }


        const title =
            titleInput.value.trim();

        const story =
            storyInput.value.trim();

        const eventDate =
            eventDateInput.value || null;

        const file =
            photoInput.files[0];


        if (!title) {

            formMessage.textContent =
                "Judul kenangan wajib diisi.";

            titleInput.focus();

            return;
        }


        if (!story) {

            formMessage.textContent =
                "Cerita wajib diisi.";

            storyInput.focus();

            return;
        }


        formMessage.textContent =
            "Menyimpan kenangan...";


        const saveButton =
            document.getElementById(
                "save-memory-btn"
            );

        saveButton.disabled =
            true;


        let uploadedPhoto =
            null;


        try {

            // =========================
            // UPLOAD FOTO BARU
            // =========================

            if (file) {

                uploadedPhoto =
                    await uploadPhoto(file);

            }


            // =========================
            // EDIT
            // =========================

            if (editingMemory) {

                const oldPath =
                    editingMemory.image_path ||
                    null;


                const newImagePath =
                    uploadedPhoto
                        ? uploadedPhoto.path
                        : oldPath;


                const { error } =
                    await db
                        .from("memories")
                        .update({

                            title: title,

                            story: story,

                            event_date:
                                eventDate,

                            image_url: null,

                            image_path:
                                newImagePath,

                            updated_at:
                                new Date().toISOString()

                        })
                        .eq(
                            "id",
                            editingMemory.id
                        )
                        .eq(
                            "created_by",
                            currentUser.id
                        );


                if (error) {

                    // Hapus foto baru jika
                    // update database gagal

                    if (uploadedPhoto) {

                        await db.storage
                            .from("memory-photos")
                            .remove([
                                uploadedPhoto.path
                            ]);

                    }

                    throw error;

                }


                // Hapus foto lama jika
                // user menggantinya

                if (
                    uploadedPhoto &&
                    oldPath &&
                    oldPath !==
                    uploadedPhoto.path
                ) {

                    await db.storage
                        .from("memory-photos")
                        .remove([
                            oldPath
                        ]);

                }


                formMessage.textContent =
                    "Kenangan berhasil diperbarui.";

            }


            // =========================
            // INSERT
            // =========================

            else {

                const { error } =
                    await db
                        .from("memories")
                        .insert({

                            title: title,

                            story: story,

                            event_date:
                                eventDate,

                            image_url: null,

                            image_path:
                                uploadedPhoto
                                    ? uploadedPhoto.path
                                    : null,

                            created_by:
                                currentUser.id

                        });


                if (error) {

                    // Jika insert gagal,
                    // hapus foto yang baru diupload

                    if (uploadedPhoto) {

                        await db.storage
                            .from("memory-photos")
                            .remove([
                                uploadedPhoto.path
                            ]);

                    }

                    throw error;

                }


                formMessage.textContent =
                    "Kenangan berhasil ditambahkan.";

            }


            // Tunggu sebentar agar
            // pesan sukses terlihat

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        500
                    )
            );


            closeMemoryModal();

            await loadMemories();


        } catch (error) {

            console.error(
                "Gagal menyimpan memory:",
                error
            );


            formMessage.textContent =
                error.message ||
                "Gagal menyimpan kenangan.";

        } finally {

            saveButton.disabled =
                false;

        }

    }
);


// =========================
// DELETE MEMORY
// =========================

async function deleteMemory(
    id,
    imagePath
) {

    if (!currentUser) {
        return;
    }


    const confirmed =
        confirm(
            "Apakah kamu yakin ingin menghapus kenangan ini?"
        );


    if (!confirmed) {
        return;
    }


    try {

        // Hapus database terlebih dahulu

        const { error } =
            await db
                .from("memories")
                .delete()
                .eq(
                    "id",
                    id
                )
                .eq(
                    "created_by",
                    currentUser.id
                );


        if (error) {

            throw error;

        }


        // Jika database berhasil dihapus,
        // hapus foto dari Storage

        if (imagePath) {

            const { error:
                storageError
            } =
                await db.storage
                    .from("memory-photos")
                    .remove([
                        imagePath
                    ]);


            if (storageError) {

                console.error(
                    "Memory terhapus, tetapi foto gagal dihapus:",
                    storageError
                );

            }

        }


        await loadMemories();


    } catch (error) {

        console.error(
            "Gagal menghapus memory:",
            error
        );

        alert(
            error.message ||
            "Gagal menghapus kenangan."
        );

    }

}


// =========================
// CLOSE MODAL
// =========================

modalClose.addEventListener(
    "click",
    closeMemoryModal
);


cancelBtn.addEventListener(
    "click",
    closeMemoryModal
);


document.querySelector(
    ".memory-modal-overlay"
).addEventListener(
    "click",
    closeMemoryModal
);


function closeMemoryModal() {

    memoryModal.style.display =
        "none";

    document.body.classList.remove(
        "modal-open"
    );

    memoryForm.reset();

    editingMemory = null;

    memoryIdInput.value = "";

    oldImagePathInput.value = "";

    formMessage.textContent = "";

    resetPreview();

}


// =========================
// ESCAPE MODAL
// =========================

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape" &&
            memoryModal.style.display !==
            "none"
        ) {

            closeMemoryModal();

        }

    }
);


// =========================
// RESET PREVIEW
// =========================

function resetPreview() {

    preview.removeAttribute(
        "src"
    );

    photoPreviewContainer.style.display =
        "none";

}


// =========================
// ESCAPE HTML
// =========================

function escapeHtml(value) {

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


// =========================
// AUTH STATE CHANGE
// =========================

db.auth.onAuthStateChange(
    function (
        event,
        session
    ) {

        currentUser =
            session?.user || null;

        updateNavbar();

    }
);


// =========================
// INITIAL LOAD
// =========================

checkUser();