let currentUser = null;
let editingMemory = null;


// =====================================================
// ELEMENT
// =====================================================

const form =
    document.getElementById("memory-form");

const list =
    document.getElementById("dashboard-list");

const message =
    document.getElementById("form-message");

const logoutBtn =
    document.getElementById("logout-btn");

const cancelBtn =
    document.getElementById("cancel-btn");

const photoInput =
    document.getElementById("photo");

const preview =
    document.getElementById("preview");


// =====================================================
// CHECK USER
// =====================================================

async function checkUser() {

    const {
        data,
        error
    } = await db.auth.getUser();


    if (error || !data.user) {

        window.location.href =
            "login.html";

        return;
    }


    currentUser =
        data.user;


    loadMemories();

}


// =====================================================
// LOAD SEMUA KENANGAN
// =====================================================

async function loadMemories() {

    list.innerHTML =
        "<p>Memuat cerita...</p>";


    const {
        data,
        error
    } = await db
        .from("memories")
        .select("*")
        .order(
            "event_date",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Gagal mengambil memories:",
            error
        );

        list.innerHTML =
            "<p>Gagal memuat cerita.</p>";

        return;
    }


    console.log(
        "Data memories:",
        data
    );


    if (
        !data ||
        data.length === 0
    ) {

        list.innerHTML =
            "<p>Belum ada kenangan.</p>";

        return;
    }


    // Kosongkan list
    list.innerHTML = "";


    // =================================================
    // BUAT CARD
    // =================================================

    data.forEach(
        function (memory) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "dashboard-card";


            // =========================================
            // CONTAINER FOTO
            // =========================================

            const imageContainer =
                document.createElement(
                    "div"
                );


            imageContainer.className =
                "memory-image-container";


            if (memory.image_path) {

                imageContainer.innerHTML =
                    `
                    <div class="image-loading">
                        Memuat foto...
                    </div>
                    `;

            } else {

                imageContainer.innerHTML =
                    `
                    <div class="no-image">
                        Tidak ada foto
                    </div>
                    `;

            }


            // =========================================
            // FORMAT TANGGAL
            // =========================================

            let date =
                "Tanggal tidak tersedia";


            if (memory.event_date) {

                const dateObject =
                    new Date(
                        memory.event_date
                    );


                if (
                    !isNaN(
                        dateObject.getTime()
                    )
                ) {

                    date =
                        dateObject.toLocaleDateString(
                            "id-ID",
                            {
                                day: "numeric",
                                month: "long",
                                year: "numeric"
                            }
                        );

                }

            }


            // =========================================
            // CONTENT CARD
            // =========================================

            const content =
                document.createElement(
                    "div"
                );


            content.className =
                "dashboard-card-content";


            content.innerHTML =
                `
                <h3>
                    ${escapeHtml(
                        memory.title
                    )}
                </h3>

                <p class="memory-date">
                    ${date}
                </p>

                <p class="memory-story">
                    ${escapeHtml(
                        memory.story
                    )}
                </p>

                <div class="dashboard-actions">

                    <button
                        type="button"
                        class="btn"
                        onclick="editMemory('${memory.id}')"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="btn btn-danger"
                        onclick="deleteMemory(
                            '${memory.id}',
                            '${escapeJs(
                                memory.image_path || ""
                            )}'
                        )"
                    >
                        Hapus
                    </button>

                </div>
                `;


            card.appendChild(
                imageContainer
            );


            card.appendChild(
                content
            );


            list.appendChild(
                card
            );


            // =========================================
            // LOAD FOTO
            // =========================================

            if (memory.image_path) {

                loadMemoryImage(
                    memory.image_path,
                    imageContainer,
                    memory.title
                );

            }

        }
    );

}


// =====================================================
// LOAD FOTO PRIVATE STORAGE
// =====================================================

async function loadMemoryImage(
    imagePath,
    container,
    title
) {

    try {

        const {
            data,
            error
        } = await db.storage
            .from("memory-photos")
            .createSignedUrl(
                imagePath,
                60 * 60 * 24
            );


        if (error) {

            console.error(
                "Gagal membuat signed URL:",
                error
            );


            container.innerHTML =
                `
                <div class="image-error">
                    Foto tidak dapat dimuat.
                </div>
                `;

            return;
        }


        if (
            !data ||
            !data.signedUrl
        ) {

            container.innerHTML =
                `
                <div class="image-error">
                    Foto tidak tersedia.
                </div>
                `;

            return;
        }


        const image =
            document.createElement(
                "img"
            );


        image.src =
            data.signedUrl;


        image.alt =
            title ||
            "Foto kenangan";


        image.className =
            "memory-photo";


        // =========================================
        // FOTO BERHASIL DIMUAT
        // =========================================

        image.onload =
            function () {

                container.innerHTML =
                    "";

                container.appendChild(
                    image
                );

            };


        // =========================================
        // FOTO GAGAL DIMUAT
        // =========================================

        image.onerror =
            function () {

                console.error(
                    "Foto gagal ditampilkan:",
                    imagePath
                );


                container.innerHTML =
                    `
                    <div class="image-error">
                        Foto gagal ditampilkan.
                    </div>
                    `;

            };


    } catch (error) {

        console.error(
            "Error saat memuat foto:",
            error
        );


        container.innerHTML =
            `
            <div class="image-error">
                Foto tidak dapat dimuat.
            </div>
            `;

    }

}


// =====================================================
// UPLOAD FOTO
// =====================================================

async function uploadPhoto(file) {

    if (!file) {

        return null;

    }


    // =========================================
    // CEK TIPE FILE
    // =========================================

    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        throw new Error(
            "File yang dipilih harus berupa gambar."
        );

    }


    // =========================================
    // CEK UKURAN FILE
    // Maksimal 10 MB
    // =========================================

    const maxSize =
        10 * 1024 * 1024;


    if (
        file.size > maxSize
    ) {

        throw new Error(
            "Ukuran foto maksimal 10 MB."
        );

    }


    // =========================================
    // EKSTENSI FILE
    // =========================================

    const fileExtension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    // =========================================
    // NAMA FILE UNIK
    // =========================================

    const fileName =
        `${crypto.randomUUID()}.${fileExtension}`;


    // =========================================
    // FOLDER USER
    // =========================================

    const filePath =
        `${currentUser.id}/${fileName}`;


    // =========================================
    // UPLOAD KE STORAGE
    // =========================================

    const {
        error
    } = await db.storage
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

        console.error(
            "Upload foto gagal:",
            error
        );


        throw new Error(
            "Foto gagal diupload: " +
            error.message
        );

    }


    console.log(
        "Foto berhasil diupload:",
        filePath
    );


    return {

        path: filePath

    };

}


// =====================================================
// FORM SUBMIT
// =====================================================

form.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        message.textContent =
            "Menyimpan...";


        // =========================================
        // AMBIL DATA FORM
        // =========================================

        const title =
            document
                .getElementById("title")
                .value
                .trim();


        const story =
            document
                .getElementById("story")
                .value
                .trim();


        const eventDate =
            document
                .getElementById("event-date")
                .value;


        const photo =
            photoInput.files[0];


        // =========================================
        // VALIDASI
        // =========================================

        if (!title) {

            message.textContent =
                "Judul harus diisi.";

            return;
        }


        if (!story) {

            message.textContent =
                "Cerita harus diisi.";

            return;
        }


        try {

            // =====================================
            // DATA FOTO LAMA
            // =====================================

            let imagePath =
                editingMemory
                    ? editingMemory.image_path
                    : null;


            const oldImagePath =
                editingMemory
                    ? editingMemory.image_path
                    : null;


            // =====================================
            // UPLOAD FOTO BARU
            // =====================================

            if (photo) {

                const uploaded =
                    await uploadPhoto(
                        photo
                    );


                imagePath =
                    uploaded.path;

            }


            // =====================================
            // EDIT MEMORY
            // =====================================

            if (editingMemory) {

                console.log(
                    "Mengupdate memory:",
                    editingMemory.id
                );


                const updateData = {

                    title:
                        title,

                    story:
                        story,

                    event_date:
                        eventDate || null,

                    image_url:
                        null,

                    image_path:
                        imagePath,

                    updated_at:
                        new Date()
                            .toISOString()

                };


                console.log(
                    "Data yang akan diupdate:",
                    updateData
                );


                // =================================
                // UPDATE DATABASE
                // =================================

                const {
                    error: updateError
                } = await db
                    .from("memories")
                    .update(
                        updateData
                    )
                    .eq(
                        "id",
                        editingMemory.id
                    );


                // =================================
                // CEK ERROR UPDATE
                // =================================

                if (updateError) {

                    console.error(
                        "UPDATE DATABASE GAGAL:",
                        updateError
                    );


                    // Hapus foto baru jika
                    // database gagal diperbarui

                    if (
                        photo &&
                        imagePath &&
                        imagePath !== oldImagePath
                    ) {

                        await db.storage
                            .from(
                                "memory-photos"
                            )
                            .remove([
                                imagePath
                            ]);

                    }


                    throw new Error(
                        "Gagal mengubah data: " +
                        updateError.message
                    );

                }


                // =================================
                // VERIFIKASI DATA SETELAH UPDATE
                // =================================

                const {
                    data: verifyData,
                    error: verifyError
                } = await db
                    .from("memories")
                    .select("*")
                    .eq(
                        "id",
                        editingMemory.id
                    )
                    .maybeSingle();


                if (verifyError) {

                    console.error(
                        "Gagal memverifikasi update:",
                        verifyError
                    );

                }


                console.log(
                    "Data setelah UPDATE:",
                    verifyData
                );


                // =================================
                // CEK APAKAH DATA BENAR-BENAR
                // BERUBAH
                // =================================

                if (
                    verifyData &&
                    (
                        verifyData.title !== title ||
                        verifyData.story !== story
                    )
                ) {

                    console.error(
                        "Data UPDATE tidak sesuai dengan data form."
                    );


                    message.textContent =
                        "Data belum berubah. Periksa policy UPDATE pada Supabase.";

                    return;

                }


                // =================================
                // HAPUS FOTO LAMA
                // =================================

                if (
                    photo &&
                    oldImagePath &&
                    oldImagePath !== imagePath
                ) {

                    const {
                        error: removeError
                    } = await db.storage
                        .from(
                            "memory-photos"
                        )
                        .remove([
                            oldImagePath
                        ]);


                    if (removeError) {

                        console.error(
                            "Foto lama gagal dihapus:",
                            removeError
                        );

                    }

                }


                message.textContent =
                    "Cerita berhasil diperbarui.";

            }


            // =====================================
            // TAMBAH MEMORY BARU
            // =====================================

            else {

                console.log(
                    "Membuat memory baru."
                );


                const {
                    error: insertError
                } = await db
                    .from("memories")
                    .insert({

                        title:
                            title,

                        story:
                            story,

                        event_date:
                            eventDate || null,

                        image_url:
                            null,

                        image_path:
                            imagePath,

                        created_by:
                            currentUser.id

                    });


                if (insertError) {

                    console.error(
                        "INSERT DATABASE GAGAL:",
                        insertError
                    );


                    // Hapus foto jika INSERT gagal

                    if (imagePath) {

                        await db.storage
                            .from(
                                "memory-photos"
                            )
                            .remove([
                                imagePath
                            ]);

                    }


                    throw new Error(
                        "Gagal menyimpan data: " +
                        insertError.message
                    );

                }


                console.log(
                    "Memory berhasil dibuat."
                );


                message.textContent =
                    "Kenangan berhasil ditambahkan.";

            }


            // =====================================
            // RESET FORM
            // =====================================

            resetForm();


            // =====================================
            // LOAD ULANG
            // =====================================

            await loadMemories();


        } catch (error) {

            console.error(
                "Error:",
                error
            );


            message.textContent =
                "Terjadi kesalahan: " +
                error.message;

        }

    }
);


// =====================================================
// EDIT KENANGAN
// =====================================================

async function editMemory(id) {

    console.log(
        "Mengambil memory:",
        id
    );


    const {
        data,
        error
    } = await db
        .from("memories")
        .select("*")
        .eq(
            "id",
            id
        )
        .maybeSingle();


    if (error) {

        console.error(
            "Gagal mengambil data:",
            error
        );


        alert(
            "Gagal mengambil data: " +
            error.message
        );

        return;
    }


    if (!data) {

        alert(
            "Data kenangan tidak ditemukan."
        );

        return;
    }


    console.log(
        "Memory yang diedit:",
        data
    );


    editingMemory =
        data;


    // =========================================
    // UBAH JUDUL FORM
    // =========================================

    document
        .getElementById("form-title")
        .textContent =
        "Edit kenangan";


    // =========================================
    // ISI FORM
    // =========================================

    document
        .getElementById("title")
        .value =
        data.title || "";


    document
        .getElementById("story")
        .value =
        data.story || "";


    document
        .getElementById("event-date")
        .value =
        data.event_date || "";


    document
        .getElementById("memory-id")
        .value =
        data.id;


    document
        .getElementById("old-image-path")
        .value =
        data.image_path || "";


    // =========================================
    // PREVIEW FOTO LAMA
    // =========================================

    if (data.image_path) {

        preview.style.display =
            "block";


        preview.src =
            "";


        try {

            const {
                data: signedData,
                error: signedError
            } = await db.storage
                .from(
                    "memory-photos"
                )
                .createSignedUrl(
                    data.image_path,
                    60 * 60 * 24
                );


            if (
                signedError ||
                !signedData ||
                !signedData.signedUrl
            ) {

                console.error(
                    "Preview foto gagal:",
                    signedError
                );


                preview.style.display =
                    "none";

            } else {

                preview.src =
                    signedData.signedUrl;

            }

        } catch (error) {

            console.error(
                "Gagal membuat preview:",
                error
            );


            preview.style.display =
                "none";

        }

    } else {

        preview.style.display =
            "none";


        preview.src =
            "";

    }


    // =========================================
    // TAMPILKAN TOMBOL BATAL
    // =========================================

    cancelBtn.style.display =
        "inline-block";


    // =========================================
    // SCROLL KE FORM
    // =========================================

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


// =====================================================
// DELETE KENANGAN
// =====================================================

async function deleteMemory(
    id,
    imagePath
) {

    const confirmation =
        confirm(
            "Apakah kamu yakin ingin menghapus kenangan ini?"
        );


    if (!confirmation) {

        return;

    }


    try {

        console.log(
            "Menghapus memory:",
            id
        );


        // =========================================
        // HAPUS DATA DATABASE
        // =========================================

        const {
            error
        } = await db
            .from("memories")
            .delete()
            .eq(
                "id",
                id
            );


        if (error) {

            console.error(
                "Gagal menghapus database:",
                error
            );

            throw error;

        }


        // =========================================
        // HAPUS FOTO
        // =========================================

        if (imagePath) {

            const {
                error: removeError
            } = await db.storage
                .from(
                    "memory-photos"
                )
                .remove([
                    imagePath
                ]);


            if (removeError) {

                console.error(
                    "Foto gagal dihapus:",
                    removeError
                );

            }

        }


        message.textContent =
            "Kenangan berhasil dihapus.";


        await loadMemories();


    } catch (error) {

        console.error(
            "Gagal menghapus:",
            error
        );


        alert(
            "Gagal menghapus: " +
            error.message
        );

    }

}


// =====================================================
// RESET FORM
// =====================================================

function resetForm() {

    form.reset();


    editingMemory =
        null;


    document
        .getElementById("form-title")
        .textContent =
        "Tambah kenangan";


    document
        .getElementById("memory-id")
        .value =
        "";


    document
        .getElementById("old-image-path")
        .value =
        "";


    preview.style.display =
        "none";


    preview.src =
        "";


    cancelBtn.style.display =
        "none";

}


// =====================================================
// CANCEL EDIT
// =====================================================

cancelBtn.addEventListener(
    "click",
    function () {

        resetForm();

        message.textContent =
            "";

    }
);


// =====================================================
// PREVIEW FOTO BARU
// =====================================================

photoInput.addEventListener(
    "change",
    function () {

        const file =
            photoInput.files[0];


        if (!file) {

            return;

        }


        // =========================================
        // CEK FILE
        // =========================================

        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            message.textContent =
                "File yang dipilih harus berupa gambar.";

            photoInput.value =
                "";

            return;

        }


        // =========================================
        // PREVIEW
        // =========================================

        const reader =
            new FileReader();


        reader.onload =
            function (event) {

                preview.src =
                    event.target.result;


                preview.style.display =
                    "block";

            };


        reader.readAsDataURL(
            file
        );

    }
);


// =====================================================
// LOGOUT
// =====================================================

logoutBtn.addEventListener(
    "click",
    async function () {

        await db.auth.signOut();


        window.location.href =
            "login.html";

    }
);


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

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


// =====================================================
// ESCAPE JAVASCRIPT STRING
// =====================================================

function escapeJs(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        )
        .replace(
            /"/g,
            '\\"'
        )
        .replace(
            /\n/g,
            "\\n"
        )
        .replace(
            /\r/g,
            "\\r"
        );

}


// =====================================================
// START APPLICATION
// =====================================================

checkUser();
