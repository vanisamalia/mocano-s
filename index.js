/* =========================================================
   MOCANO FILES
   INDEX.JS
========================================================= */


/* =========================================================
   DOM ELEMENTS
========================================================= */

const memoryList = document.getElementById("memory-list");
const memoryActions = document.getElementById("memory-actions");
const addMemoryBtn = document.getElementById("add-memory-btn");

const memoryModal = document.getElementById("memory-modal");
const memoryForm = document.getElementById("memory-form");

const modalClose = document.getElementById("modal-close");
const cancelBtn = document.getElementById("cancel-btn");

const memoryTitle = document.getElementById("title");
const memoryStory = document.getElementById("story");
const memoryDate = document.getElementById("event-date");
const memoryImage = document.getElementById("photo");

const imagePreview = document.getElementById("photo-preview-container");

/* =========================================================
   VARIABLES
========================================================= */

let currentUser = null;
let editingMemory = null;
let selectedFiles = [];
let selectedDetailMemory = null;


/* =========================================================
   AUTHENTICATION
========================================================= */

async function checkUser() {

    try {

        const {
            data,
            error
        } = await db.auth.getUser();

        if (error) {

            console.error(
                "Gagal mendapatkan user:",
                error
            );

            currentUser = null;

        } else {

            currentUser =
                data?.user || null;
        }

        updateNavbar();

        await loadMemories();

    } catch (error) {

        console.error(
            "Error checkUser:",
            error
        );

        currentUser = null;

        updateNavbar();

        await loadMemories();
    }
}


/* =========================================================
   NAVBAR
========================================================= */

function updateNavbar() {

    const profileMenu =
        document.getElementById("profile-menu");

    const loginLink =
        document.getElementById("login-link");

    const registerLink =
        document.getElementById("register-link");

    const logoutBtn =
        document.getElementById("logout-btn");


    if (currentUser) {

        if (profileMenu) {
            profileMenu.style.display = "block";
        }

        if (loginLink) {
            loginLink.style.display = "none";
        }

        if (registerLink) {
            registerLink.style.display = "none";
        }

        if (logoutBtn) {
            logoutBtn.style.display = "block";
        }

        if (memoryActions) {
            memoryActions.style.display = "flex";
        }

    } else {

        if (profileMenu) {
            profileMenu.style.display = "none";
        }

        if (loginLink) {
            loginLink.style.display = "block";
        }

        if (registerLink) {
            registerLink.style.display = "block";
        }

        if (logoutBtn) {
            logoutBtn.style.display = "none";
        }

        if (memoryActions) {
            memoryActions.style.display = "none";
        }
    }
}


/* =========================================================
   LOGOUT
   Menggunakan event delegation supaya tetap bekerja
   walaupun tombol logout muncul/diperbarui secara dinamis.
========================================================= */

document.addEventListener(
    "click",
    async function (event) {

        const logoutTarget =
            event.target.closest("#logout-btn");

        if (!logoutTarget) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (!currentUser) {
            return;
        }

        try {

            logoutTarget.style.pointerEvents =
                "none";

            const {
                error
            } = await db.auth.signOut();

            if (error) {

                console.error(
                    "Gagal logout:",
                    error
                );

                alert(
                    "Gagal logout."
                );

                logoutTarget.style.pointerEvents =
                    "";

                return;
            }

            currentUser = null;

            updateNavbar();

            await loadMemories();

        } catch (error) {

            console.error(
                "Error logout:",
                error
            );

            alert(
                "Terjadi kesalahan saat logout."
            );

            logoutTarget.style.pointerEvents =
                "";
        }
    }
);


/* =========================================================
   GET MEMORY IMAGE URL
========================================================= */

async function getMemoryImageUrl(
    imagePath
) {

    if (!imagePath) {
        return null;
    }

    try {

        /*
         * Gunakan signed URL karena bucket
         * memory-photos dapat bersifat private.
         */

        const {
            data,
            error
        } = await db.storage
            .from("memory-photos")
            .createSignedUrl(
                imagePath,
                3600
            );

        if (
            !error &&
            data?.signedUrl
        ) {

            return data.signedUrl;
        }


        /*
         * Fallback ke public URL.
         */

        const {
            data: publicData
        } = db.storage
            .from("memory-photos")
            .getPublicUrl(
                imagePath
            );

        return (
            publicData?.publicUrl ||
            null
        );

    } catch (error) {

        console.error(
            "Gagal mengambil URL gambar:",
            error
        );

        return null;
    }
}


/* =========================================================
   LOAD MEMORIES
========================================================= */

async function loadMemories() {

    if (!memoryList) {

        console.error(
            "Element #memory-list tidak ditemukan."
        );

        return;
    }

    memoryList.innerHTML = `
        <p class="memory-loading">
            Memuat memories...
        </p>
    `;


    try {

        const { data, error } = await db
    .from("memories")
    .select("*")
    .order("event_date", {
        ascending: false,
        nullsFirst: false
    });


        if (error) {

            console.error(
                "Gagal mengambil memories:",
                error
            );

            memoryList.innerHTML = `
                <p class="memory-loading">
                    Gagal memuat memories.
                </p>
            `;

            return;
        }


        if (
            !data ||
            data.length === 0
        ) {

            memoryList.innerHTML = `
                <p class="memory-loading">
                    Belum ada memories.
                </p>
            `;

            return;
        }


        memoryList.innerHTML = "";


        /*
         * createMemoryCard() adalah async.
         */

        const cards =
            await Promise.all(
                data.map(
                    function (memory) {

                        return createMemoryCard(
                            memory
                        );
                    }
                )
            );


        cards.forEach(
            function (card) {

                if (card) {

                    memoryList.appendChild(
                        card
                    );
                }
            }
        );


    } catch (error) {

        console.error(
            "Error loadMemories:",
            error
        );

        memoryList.innerHTML = `
            <p class="memory-loading">
                Gagal memuat memories.
            </p>
        `;
    }
}


/* =========================================================
   CREATE MEMORY CARD
========================================================= */

async function createMemoryCard(
    memory
) {

    if (!memory) {
        return null;
    }


    const card =
        document.createElement("article");

    card.className =
        "memory-card";


    /* =====================================================
       COVER IMAGE
    ===================================================== */

    let imageUrl = null;


    /*
     * Prioritas pertama:
     * image_path dari tabel memories.
     */

    if (memory.image_path) {

        imageUrl =
            await getMemoryImageUrl(
                memory.image_path
            );
    }


    /*
     * Jika image_path tidak berhasil,
     * ambil foto pertama dari memory_photos.
     */

    if (!imageUrl) {

        const {
            data: firstPhoto,
            error
        } = await db
            .from("memory_photos")
            .select(
                "photo_url, photo_path"
            )
            .eq(
                "memory_id",
                memory.id
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            )
            .limit(1)
            .maybeSingle();


        if (
            !error &&
            firstPhoto
        ) {

            /*
             * Prioritaskan photo_path.
             */

            if (
                firstPhoto.photo_path
            ) {

                imageUrl =
                    await getMemoryImageUrl(
                        firstPhoto.photo_path
                    );
            }


            /*
             * Fallback ke photo_url.
             */

            if (
                !imageUrl &&
                firstPhoto.photo_url
            ) {

                imageUrl =
                    firstPhoto.photo_url;
            }
        }
    }


    /* =====================================================
       FORMAT DATE
    ===================================================== */

    let formattedDate = "";


    if (memory.event_date) {

        const date =
            new Date(
                memory.event_date
            );


        if (
            !isNaN(
                date.getTime()
            )
        ) {

            formattedDate =
                date.toLocaleDateString(
                    "id-ID",
                    {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                    }
                );
        }
    }


    /* =====================================================
       CARD CONTENT
    ===================================================== */

    card.innerHTML = `
        ${
            imageUrl
                ? `
                    <div class="memory-card-image">
                        <img
                            src="${escapeHtml(imageUrl)}"
                            alt="${escapeHtml(
                                memory.title ||
                                "Memory"
                            )}"
                            loading="lazy"
                        >
                    </div>
                `
                : `
                    <div class="memory-card-image memory-card-no-image">
                        <span>No Photo</span>
                    </div>
                `
        }

        <div class="memory-card-content">

            ${
                formattedDate
                    ? `
                        <p class="memory-date">
                            ${escapeHtml(
                                formattedDate
                            )}
                        </p>
                    `
                    : ""
            }

            <h3>
                ${escapeHtml(
                    memory.title ||
                    "Untitled Memory"
                )}
            </h3>

            ${
                memory.story
                    ? `
                        <p class="memory-story">
                            ${escapeHtml(
                                memory.story
                            )}
                        </p>
                    `
                    : ""
            }

            <div class="memory-card-actions">

                ${
                    currentUser &&
                    memory.created_by ===
                    currentUser.id
                        ? `
                            <button
                                type="button"
                                class="memory-edit-btn"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                class="memory-delete-btn"
                            >
                                Delete
                            </button>
                        `
                        : ""
                }

            </div>

        </div>
    `;


    /* =====================================================
       EDIT BUTTON
    ===================================================== */

    const editBtn =
        card.querySelector(
            ".memory-edit-btn"
        );


    if (editBtn) {

        editBtn.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                openEditMemory(
                    memory
                );
            }
        );
    }


    /* =====================================================
       DELETE BUTTON
    ===================================================== */

    const deleteBtn =
        card.querySelector(
            ".memory-delete-btn"
        );


    if (deleteBtn) {

        deleteBtn.addEventListener(
            "click",
            async function (event) {

                event.preventDefault();
                event.stopPropagation();

                await deleteMemory(
                    memory
                );
            }
        );
    }


    /* =====================================================
       OPEN MEMORY DETAIL
    ===================================================== */

    card.addEventListener(
        "click",
        function (event) {

            if (
                event.target.closest(
                    ".memory-card-actions"
                ) ||
                event.target.closest(
                    "button"
                )
            ) {
                return;
            }

            openMemoryDetail(
                memory
            );
        }
    );


    return card;
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


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


/* =========================================================
   MEMORY DETAIL
========================================================= */

async function openMemoryDetail(
    memory
) {

    if (!memory) {
        return;
    }


    selectedDetailMemory =
        memory;


    const modal =
        document.getElementById(
            "memory-detail-modal"
        );

    const title =
        document.getElementById(
            "detail-memory-title"
        );

    const date =
        document.getElementById(
            "detail-memory-date"
        );

    const story =
        document.getElementById(
            "detail-memory-story"
        );

    const gallery =
        document.getElementById(
            "memory-detail-gallery"
        );

    const actions =
        document.getElementById(
            "memory-detail-actions"
        );


    if (!modal) {

        console.error(
            "Element #memory-detail-modal tidak ditemukan di index.html."
        );

        return;
    }


    /* =====================================================
       TITLE
    ===================================================== */

    if (title) {

        title.textContent =
            memory.title || "";
    }


    /* =====================================================
       DATE
    ===================================================== */

    if (date) {

        if (memory.event_date) {

            const eventDate =
                new Date(
                    memory.event_date
                );


            if (
                !isNaN(
                    eventDate.getTime()
                )
            ) {

                date.textContent =
                    eventDate.toLocaleDateString(
                        "id-ID",
                        {
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                        }
                    );

            } else {

                date.textContent =
                    "";
            }

        } else {

            date.textContent =
                "";
        }
    }


    /* =====================================================
       STORY
    ===================================================== */

    if (story) {

        story.textContent =
            memory.story || "";
    }


    /* =====================================================
       OWNER ACTION
    ===================================================== */

    if (actions) {

        if (
            currentUser &&
            memory.created_by ===
            currentUser.id
        ) {

            actions.style.display =
                "flex";

        } else {

            actions.style.display =
                "none";
        }
    }


    /* =====================================================
       OPEN MODAL
    ===================================================== */

    modal.style.display =
        "flex";

    document.body.style.overflow =
        "hidden";


    /* =====================================================
       LOADING GALLERY
    ===================================================== */

    if (gallery) {

        gallery.innerHTML = `
            <p class="memory-loading">
                Memuat foto...
            </p>
        `;
    }


    try {

        /* =================================================
           GET ALL PHOTOS
        ================================================= */

        const {
            data: photos,
            error
        } = await db
            .from("memory_photos")
            .select(
                "id, memory_id, photo_url, photo_path, created_at"
            )
            .eq(
                "memory_id",
                memory.id
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


        if (error) {

            console.error(
                "Gagal mengambil foto:",
                error
            );

            if (gallery) {

                gallery.innerHTML = `
                    <p class="memory-loading">
                        Gagal memuat foto.
                    </p>
                `;
            }

            return;
        }


        let memoryPhotos =
            photos || [];


        /* =================================================
           FALLBACK MEMORY LAMA
        ================================================= */

        if (
            memoryPhotos.length === 0 &&
            memory.image_path
        ) {

            const imageUrl =
                await getMemoryImageUrl(
                    memory.image_path
                );


            if (imageUrl) {

                memoryPhotos = [
                    {
                        id:
                            "legacy-" +
                            memory.id,

                        memory_id:
                            memory.id,

                        photo_url:
                            null,

                        photo_path:
                            memory.image_path
                    }
                ];
            }
        }


        /* =================================================
           GALLERY ELEMENT CHECK
        ================================================= */

        if (!gallery) {
            return;
        }


        gallery.innerHTML = "";


        /* =================================================
           NO PHOTO
        ================================================= */

        if (
            memoryPhotos.length === 0
        ) {

            gallery.innerHTML = `
                <p class="memory-loading">
                    Belum ada foto pada memory ini.
                </p>
            `;

            return;
        }


        /* =================================================
           RENDER ALL PHOTOS
        ================================================= */

        for (
            const photo of memoryPhotos
        ) {

            let imageUrl =
                null;


            /*
             * Gunakan photo_path sebagai sumber utama.
             * Signed URL digunakan agar foto tetap bisa
             * dimuat dari bucket private.
             */

            if (
                photo.photo_path
            ) {

                imageUrl =
                    await getMemoryImageUrl(
                        photo.photo_path
                    );
            }


            /*
             * Fallback ke photo_url.
             */

            if (
                !imageUrl &&
                photo.photo_url
            ) {

                imageUrl =
                    photo.photo_url;
            }


            /*
             * Jika URL tidak ditemukan.
             */

            if (!imageUrl) {

                console.error(
                    "URL foto tidak ditemukan:",
                    photo
                );

                continue;
            }


            /*
             * Buat elemen gambar.
             */

            const img =
                document.createElement(
                    "img"
                );


            img.src =
                imageUrl;


            img.alt =
                memory.title ||
                "Memory";


            img.loading =
                "lazy";


            img.onerror =
                function () {

                    console.error(
                        "Foto gagal dimuat:",
                        imageUrl
                    );
                };


            gallery.appendChild(
                img
            );
        }


        /*
         * Jika seluruh foto gagal dimuat.
         */

        if (
            gallery.children.length === 0
        ) {

            gallery.innerHTML = `
                <p class="memory-loading">
                    Foto tidak dapat dimuat.
                </p>
            `;
        }


    } catch (error) {

        console.error(
            "Error openMemoryDetail:",
            error
        );

        if (gallery) {

            gallery.innerHTML = `
                <p class="memory-loading">
                    Gagal memuat foto.
                </p>
            `;
        }
    }
}


/* =========================================================
   CLOSE MEMORY DETAIL
========================================================= */

function closeMemoryDetail() {

    const modal =
        document.getElementById(
            "memory-detail-modal"
        );


    if (modal) {

        modal.style.display =
            "none";
    }


    document.body.style.overflow =
        "";


    selectedDetailMemory =
        null;
}


/* =========================================================
   DETAIL CLOSE BUTTON
========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const closeButton =
            event.target.closest(
                "#memory-detail-close"
            );


        if (!closeButton) {
            return;
        }


        event.preventDefault();

        closeMemoryDetail();
    }
);


/* =========================================================
   DETAIL CLICK OUTSIDE
========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const modal =
            document.getElementById(
                "memory-detail-modal"
            );


        if (!modal) {
            return;
        }


        if (
            event.target ===
            modal
        ) {

            closeMemoryDetail();
        }
    }
);


/* =========================================================
   ADD PHOTO TO EXISTING MEMORY
========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const addPhotoButton =
            event.target.closest(
                "#detail-add-photo-btn"
            );


        if (!addPhotoButton) {
            return;
        }


        event.preventDefault();


        if (!selectedDetailMemory) {
            return;
        }


        if (!currentUser) {

            alert(
                "Silakan login terlebih dahulu."
            );

            return;
        }


        if (
            selectedDetailMemory.created_by !==
            currentUser.id
        ) {

            alert(
                "Kamu tidak memiliki izin untuk menambahkan foto."
            );

            return;
        }


        const detailPhotoInput =
            document.getElementById(
                "detail-photo-input"
            );


        if (detailPhotoInput) {

            detailPhotoInput.value =
                "";

            detailPhotoInput.click();
        }
    }
);


/* =========================================================
   UPLOAD ADDITIONAL PHOTOS
========================================================= */

document.addEventListener(
    "change",
    async function (event) {

        if (
            event.target.id !==
            "detail-photo-input"
        ) {
            return;
        }


        if (!selectedDetailMemory) {
            return;
        }


        const files =
            Array.from(
                event.target.files || []
            );


        if (
            files.length === 0
        ) {
            return;
        }


        if (!currentUser) {

            alert(
                "Silakan login terlebih dahulu."
            );

            event.target.value =
                "";

            return;
        }


        if (
            selectedDetailMemory.created_by !==
            currentUser.id
        ) {

            alert(
                "Kamu tidak memiliki izin untuk menambahkan foto."
            );

            event.target.value =
                "";

            return;
        }


        try {

            const uploadedPhotos =
                [];


            for (
                const file of files
            ) {

                if (
                    !file.type.startsWith(
                        "image/"
                    )
                ) {

                    continue;
                }


                const extension =
                    file.name
                        .split(".")
                        .pop()
                        .toLowerCase();


                const fileName =
                    `${crypto.randomUUID()}.${extension}`;


                const filePath =
                    `${currentUser.id}/${selectedDetailMemory.id}/${fileName}`;


                const {
                    error: uploadError
                } = await db.storage
                    .from("memory-photos")
                    .upload(
                        filePath,
                        file,
                        {
                            upsert: false
                        }
                    );


                if (uploadError) {
                    throw uploadError;
                }


                /*
                 * Simpan path.
                 * URL akan dibuat kembali saat foto ditampilkan.
                 */

                const {
                    data: publicData
                } = db.storage
                    .from("memory-photos")
                    .getPublicUrl(
                        filePath
                    );


                const photoUrl =
                    publicData?.publicUrl ||
                    "";


                uploadedPhotos.push({
                    memory_id:
                        selectedDetailMemory.id,

                    photo_url:
                        photoUrl,

                    photo_path:
                        filePath,

                    created_by:
                        currentUser.id
                });
            }


            if (
                uploadedPhotos.length === 0
            ) {

                alert(
                    "Tidak ada foto yang valid."
                );

                return;
            }


            /* =============================================
               INSERT KE memory_photos
            ============================================= */

            const {
                error: insertError
            } = await db
                .from("memory_photos")
                .insert(
                    uploadedPhotos
                );


            if (insertError) {
                throw insertError;
            }


            /*
             * Jika memory belum memiliki cover,
             * gunakan foto pertama sebagai cover.
             */

            if (
                !selectedDetailMemory.image_path
            ) {

                const firstPhoto =
                    uploadedPhotos[0];


                await db
                    .from("memories")
                    .update({
                        image_path:
                            firstPhoto.photo_path,

                        image_url:
                            firstPhoto.photo_url
                    })
                    .eq(
                        "id",
                        selectedDetailMemory.id
                    );


                selectedDetailMemory.image_path =
                    firstPhoto.photo_path;

                selectedDetailMemory.image_url =
                    firstPhoto.photo_url;
            }


            alert(
                `${uploadedPhotos.length} foto berhasil ditambahkan.`
            );


            /*
             * Refresh detail.
             */

            await openMemoryDetail(
                selectedDetailMemory
            );


            /*
             * Refresh card.
             */

            await loadMemories();


        } catch (error) {

            console.error(
                "Gagal menambahkan foto:",
                error
            );

            alert(
                "Foto gagal ditambahkan."
            );

        } finally {

            event.target.value =
                "";
        }
    }
);


/* =========================================================
   OPEN MEMORY MODAL
========================================================= */

function openMemoryModal() {

    if (!memoryModal) {

        console.error(
            "Element #memory-modal tidak ditemukan."
        );

        return;
    }


    memoryModal.style.display =
        "flex";

    document.body.style.overflow =
        "hidden";
}


/* =========================================================
   CLOSE MEMORY MODAL
========================================================= */

function closeMemoryModal() {

    if (!memoryModal) {
        return;
    }


    memoryModal.style.display =
        "none";


    document.body.style.overflow =
        "";


    editingMemory =
        null;


    selectedFiles =
        [];


    if (memoryForm) {

        memoryForm.reset();
    }


    if (imagePreview) {

        imagePreview.innerHTML =
            "";
    }
}


/* =========================================================
   ADD MEMORY BUTTON
========================================================= */

if (addMemoryBtn) {

    addMemoryBtn.addEventListener(
        "click",
        function () {

            editingMemory =
                null;


            if (memoryForm) {

                memoryForm.reset();
            }


            selectedFiles =
                [];


            if (imagePreview) {

                imagePreview.innerHTML =
                    "";
            }


            openMemoryModal();
        }
    );
}


/* =========================================================
   CLOSE MEMORY FORM MODAL
========================================================= */

if (modalClose) {
    modalClose.addEventListener("click", function () {
        closeMemoryModal();
    });
}

if (cancelBtn) {
    cancelBtn.addEventListener("click", function () {
        closeMemoryModal();
    });
}


/* =========================================================
   CLICK OUTSIDE MEMORY FORM MODAL
========================================================= */

if (memoryModal) {

    memoryModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                memoryModal
            ) {

                closeMemoryModal();
            }
        }
    );
}


/* =========================================================
   IMAGE INPUT
========================================================= */

if (memoryImage) {

    memoryImage.addEventListener(
        "change",
        function (event) {

            selectedFiles =
                Array.from(
                    event.target.files ||
                    []
                );


            previewSelectedImages();
        }
    );
}


/* =========================================================
   PREVIEW SELECTED IMAGES
========================================================= */

function previewSelectedImages() {

    if (!imagePreview) {
        return;
    }


    imagePreview.innerHTML =
        "";


    if (
        !selectedFiles ||
        selectedFiles.length === 0
    ) {

        return;
    }


    selectedFiles.forEach(
        function (file) {

            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                return;
            }


            const reader =
                new FileReader();


            reader.onload =
                function (event) {

                    const img =
                        document.createElement(
                            "img"
                        );


                    img.src =
                        event.target.result;


                    img.className =
                        "image-preview-item";


                    imagePreview.appendChild(
                        img
                    );
                };


            reader.readAsDataURL(
                file
            );
        }
    );
}


/* =========================================================
   UPLOAD MEMORY PHOTOS
========================================================= */

async function uploadMemoryPhotos(
    memoryId,
    files
) {

    const uploadedPhotos =
        [];


    if (
        !files ||
        files.length === 0
    ) {

        return uploadedPhotos;
    }


    if (!currentUser) {

        throw new Error(
            "User belum login."
        );
    }


    for (
        const file of files
    ) {

        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            continue;
        }


        const extension =
            file.name
                .split(".")
                .pop()
                .toLowerCase();


        const fileName =
            `${crypto.randomUUID()}.${extension}`;


        const filePath =
            `${currentUser.id}/${memoryId}/${fileName}`;


        const {
            error: uploadError
        } = await db.storage
            .from("memory-photos")
            .upload(
                filePath,
                file,
                {
                    upsert: false
                }
            );


        if (uploadError) {

            console.error(
                "Gagal upload foto:",
                uploadError
            );

            throw uploadError;
        }


        const {
            data: publicData
        } = db.storage
            .from("memory-photos")
            .getPublicUrl(
                filePath
            );


        const photoUrl =
            publicData?.publicUrl ||
            "";


        uploadedPhotos.push({
            memory_id:
                memoryId,

            photo_path:
                filePath,

            photo_url:
                photoUrl,

            created_by:
                currentUser.id
        });
    }


    return uploadedPhotos;
}


/* =========================================================
   ADD / EDIT MEMORY FORM
========================================================= */

if (memoryForm) {

    memoryForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (!currentUser) {

                alert(
                    "Silakan login terlebih dahulu."
                );

                return;
            }


            const title =
                memoryTitle?.value.trim() ||
                "";


            const story =
                memoryStory?.value.trim() ||
                "";


            const eventDate =
                memoryDate?.value ||
                "";


            if (!title) {

                alert(
                    "Judul memory wajib diisi."
                );

                return;
            }


            try {

                /* =========================================
                   EDIT MEMORY
                ========================================= */

                if (editingMemory) {

                    if (
                        editingMemory.created_by !==
                        currentUser.id
                    ) {

                        alert(
                            "Kamu tidak memiliki izin untuk mengedit memory ini."
                        );

                        return;
                    }


                    const {
                        error
                    } = await db
                        .from("memories")
                        .update({
                            title:
                                title,

                            story:
                                story,

                            event_date:
                                eventDate
                        })
                        .eq(
                            "id",
                            editingMemory.id
                        );


                    if (error) {

                        console.error(
                            "Gagal update memory:",
                            error
                        );

                        alert(
                            "Gagal mengubah memory."
                        );

                        return;
                    }


                    /*
                     * Jika ada foto baru,
                     * tambahkan ke album.
                     * Foto lama tetap ada.
                     */

                    if (
                        selectedFiles.length >
                        0
                    ) {

                        const uploadedPhotos =
                            await uploadMemoryPhotos(
                                editingMemory.id,
                                selectedFiles
                            );


                        if (
                            uploadedPhotos.length >
                            0
                        ) {

                            const {
                                error:
                                photoError
                            } = await db
                                .from(
                                    "memory_photos"
                                )
                                .insert(
                                    uploadedPhotos
                                );


                            if (photoError) {

                                console.error(
                                    "Gagal menyimpan foto tambahan:",
                                    photoError
                                );

                                alert(
                                    "Memory berhasil diubah, tetapi foto tambahan gagal disimpan."
                                );

                            } else {

                                /*
                                 * Jika belum punya cover,
                                 * gunakan foto pertama.
                                 */

                                if (
                                    !editingMemory.image_path
                                ) {

                                    const firstPhoto =
                                        uploadedPhotos[0];


                                    await db
                                        .from(
                                            "memories"
                                        )
                                        .update({
                                            image_path:
                                                firstPhoto.photo_path,

                                            image_url:
                                                firstPhoto.photo_url
                                        })
                                        .eq(
                                            "id",
                                            editingMemory.id
                                        );
                                }
                            }
                        }
                    }


                    alert(
                        "Memory berhasil diubah."
                    );


                }

                /* =========================================
                   ADD MEMORY
                ========================================= */

                else {

                    const {
                        data: newMemory,
                        error
                    } = await db
                        .from("memories")
                        .insert({
                            title:
                                title,

                            story:
                                story,

                            event_date:
                                eventDate,

                            created_by:
                                currentUser.id
                        })
                        .select()
                        .single();


                    if (error) {

                        console.error(
                            "Gagal membuat memory:",
                            error
                        );

                        alert(
                            "Gagal menambahkan memory."
                        );

                        return;
                    }


                    /*
                     * Upload foto.
                     */

                    if (
                        selectedFiles.length >
                        0
                    ) {

                        const uploadedPhotos =
                            await uploadMemoryPhotos(
                                newMemory.id,
                                selectedFiles
                            );


                        if (
                            uploadedPhotos.length >
                            0
                        ) {

                            const {
                                error:
                                photoError
                            } = await db
                                .from(
                                    "memory_photos"
                                )
                                .insert(
                                    uploadedPhotos
                                );


                            if (photoError) {

                                console.error(
                                    "Gagal menyimpan data foto:",
                                    photoError
                                );


                                /*
                                 * Hapus file yang
                                 * sudah ter-upload.
                                 */

                                const paths =
                                    uploadedPhotos
                                        .map(
                                            function (
                                                photo
                                            ) {
                                                return photo.photo_path;
                                            }
                                        )
                                        .filter(
                                            Boolean
                                        );


                                if (
                                    paths.length >
                                    0
                                ) {

                                    await db.storage
                                        .from(
                                            "memory-photos"
                                        )
                                        .remove(
                                            paths
                                        );
                                }


                                /*
                                 * Hapus memory.
                                 */

                                await db
                                    .from(
                                        "memories"
                                    )
                                    .delete()
                                    .eq(
                                        "id",
                                        newMemory.id
                                    );


                                alert(
                                    "Foto gagal disimpan. Memory dibatalkan."
                                );

                                return;
                            }


                            /*
                             * Foto pertama menjadi
                             * cover memory.
                             */

                            const firstPhoto =
                                uploadedPhotos[0];


                            const {
                                error:
                                coverError
                            } = await db
                                .from(
                                    "memories"
                                )
                                .update({
                                    image_path:
                                        firstPhoto.photo_path,

                                    image_url:
                                        firstPhoto.photo_url
                                })
                                .eq(
                                    "id",
                                    newMemory.id
                                );


                            if (coverError) {

                                console.error(
                                    "Gagal menyimpan cover memory:",
                                    coverError
                                );
                            }
                        }
                    }


                    alert(
                        "Memory berhasil ditambahkan."
                    );
                }


                closeMemoryModal();

                await loadMemories();


            } catch (error) {

                console.error(
                    "Error submit memory:",
                    error
                );

                alert(
                    "Terjadi kesalahan. Silakan periksa Console."
                );
            }
        }
    );
}


/* =========================================================
   OPEN EDIT MEMORY
========================================================= */

function openEditMemory(
    memory
) {

    if (!currentUser) {

        alert(
            "Silakan login terlebih dahulu."
        );

        return;
    }


    if (
        memory.created_by !==
        currentUser.id
    ) {

        alert(
            "Kamu tidak memiliki izin untuk mengedit memory ini."
        );

        return;
    }


    editingMemory =
        memory;


    if (memoryTitle) {

        memoryTitle.value =
            memory.title || "";
    }


    if (memoryStory) {

        memoryStory.value =
            memory.story || "";
    }


    if (memoryDate) {

        memoryDate.value =
            memory.event_date || "";
    }


    if (memoryImage) {

        memoryImage.value =
            "";
    }


    selectedFiles =
        [];


    if (imagePreview) {

        imagePreview.innerHTML = `
            <p>
                Foto baru akan ditambahkan
                ke album memory ini.
            </p>
        `;
    }


    openMemoryModal();
}


/* =========================================================
   DELETE MEMORY
========================================================= */

async function deleteMemory(
    memory
) {

    if (!currentUser) {

        alert(
            "Silakan login terlebih dahulu."
        );

        return;
    }


    if (
        memory.created_by !==
        currentUser.id
    ) {

        alert(
            "Kamu tidak memiliki izin untuk menghapus memory ini."
        );

        return;
    }


    const confirmed =
        confirm(
            `Hapus memory "${memory.title}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        /* ================================================
           GET ALL PHOTOS
        ================================================ */

        const {
            data: photos,
            error: photoFetchError
        } = await db
            .from("memory_photos")
            .select(
                "id, photo_path"
            )
            .eq(
                "memory_id",
                memory.id
            );


        if (photoFetchError) {

            console.error(
                "Gagal mengambil foto memory:",
                photoFetchError
            );
        }


        /* ================================================
           DELETE STORAGE FILES
        ================================================ */

        if (
            photos &&
            photos.length > 0
        ) {

            const paths =
                photos
                    .map(
                        function (photo) {

                            return photo.photo_path;
                        }
                    )
                    .filter(
                        Boolean
                    );


            if (
                paths.length > 0
            ) {

                const {
                    error:
                    storageError
                } = await db.storage
                    .from(
                        "memory-photos"
                    )
                    .remove(
                        paths
                    );


                if (storageError) {

                    console.error(
                        "Gagal menghapus foto dari Storage:",
                        storageError
                    );
                }
            }
        }


        /* ================================================
           DELETE MEMORY
        ================================================ */

        const {
            error
        } = await db
            .from("memories")
            .delete()
            .eq(
                "id",
                memory.id
            );


        if (error) {

            console.error(
                "Gagal menghapus memory:",
                error
            );

            alert(
                "Gagal menghapus memory."
            );

            return;
        }


        /*
         * memory_photos otomatis ikut terhapus
         * karena ON DELETE CASCADE.
         */


        if (
            selectedDetailMemory &&
            selectedDetailMemory.id ===
            memory.id
        ) {

            closeMemoryDetail();
        }


        alert(
            "Memory berhasil dihapus."
        );


        await loadMemories();


    } catch (error) {

        console.error(
            "Error deleteMemory:",
            error
        );

        alert(
            "Terjadi kesalahan saat menghapus memory."
        );
    }
}


/* =========================================================
   SUPABASE AUTH STATE
========================================================= */

db.auth.onAuthStateChange(
    function (
        event,
        session
    ) {

        currentUser =
            session?.user || null;


        updateNavbar();


        /*
         * Jangan loadMemories() di sini.
         *
         * checkUser() sudah melakukan
         * loadMemories() saat halaman pertama
         * kali dibuka.
         */
    }
);


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        /*
         * Escape untuk menutup Memory Detail.
         */

        const detailModal =
            document.getElementById(
                "memory-detail-modal"
            );


        if (
            event.key === "Escape"
        ) {

            if (
                detailModal &&
                detailModal.style.display !==
                "none"
            ) {

                closeMemoryDetail();

                return;
            }


            if (
                memoryModal &&
                memoryModal.style.display !==
                "none"
            ) {

                closeMemoryModal();

                return;
            }
        }
    }
);


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "MOCANO FILES - index.js aktif"
        );


        await checkUser();
    }
);

/* =====================================================
   PROFILE DROPDOWN
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const profileButton =
        document.getElementById("profile-button");

    const profileDropdown =
        document.getElementById("profile-dropdown");

    const profileMenu =
        document.getElementById("profile-menu");


    if (!profileButton || !profileDropdown || !profileMenu) {
        return;
    }


    /* =========================
       TOGGLE DROPDOWN
    ========================= */

    profileButton.addEventListener("click", (event) => {

        event.stopPropagation();

        profileDropdown.classList.toggle("show");

    });


    /* =========================
       CLOSE WHEN CLICK OUTSIDE
    ========================= */

    document.addEventListener("click", (event) => {

        if (!profileMenu.contains(event.target)) {

            profileDropdown.classList.remove("show");

        }

    });

});
