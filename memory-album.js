// =========================
// MEMORY ALBUM
// =========================

let albumPhotos = [];

let albumCurrentIndex = 0;

let currentAlbumMemory = null;


// =========================
// ELEMENTS
// =========================

const albumModal =
    document.getElementById(
        "album-modal"
    );

const albumClose =
    document.getElementById(
        "album-close"
    );

const albumImage =
    document.getElementById(
        "album-image"
    );

const albumTitle =
    document.getElementById(
        "album-title"
    );

const albumDate =
    document.getElementById(
        "album-date"
    );

const albumStory =
    document.getElementById(
        "album-story"
    );

const albumCounter =
    document.getElementById(
        "album-counter"
    );

const albumPrev =
    document.getElementById(
        "album-prev"
    );

const albumNext =
    document.getElementById(
        "album-next"
    );

const albumDownload =
    document.getElementById(
        "album-download"
    );


// =========================
// OPEN ALBUM
// =========================

async function openMemoryAlbum(
    memoryId
) {

    if (!albumModal) {
        return;
    }


    try {

        const {
            data: memory,
            error: memoryError
        } =
            await db
                .from("memories")
                .select("*")
                .eq(
                    "id",
                    memoryId
                )
                .single();


        if (
            memoryError ||
            !memory
        ) {

            console.error(
                "Gagal mengambil memory:",
                memoryError
            );

            return;

        }


        currentAlbumMemory =
            memory;


        // =====================================================
        // AMBIL SEMUA FOTO
        // =====================================================

        const {
            data: photos,
            error: photoError
        } =
            await db
                .from("memory_photos")
                .select(
                    "*"
                )
                .eq(
                    "memory_id",
                    memoryId
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );


        if (photoError) {

            console.error(
                "Gagal mengambil foto album:",
                photoError
            );

        }


        albumPhotos =
            photos || [];


        // =====================================================
        // FALLBACK FOTO LAMA
        // =====================================================

        if (
            albumPhotos.length === 0 &&
            memory.image_path
        ) {

            albumPhotos = [
                {
                    id:
                        "legacy-cover",

                    memory_id:
                        memory.id,

                    photo_path:
                        memory.image_path,

                    photo_url:
                        null

                }
            ];

        }


        if (
            albumPhotos.length === 0 &&
            memory.image_url
        ) {

            albumPhotos = [
                {
                    id:
                        "legacy-url",

                    memory_id:
                        memory.id,

                    photo_path:
                        null,

                    photo_url:
                        memory.image_url

                }
            ];

        }


        albumCurrentIndex =
            0;


        // =====================================================
        // SET INFO
        // =====================================================

        albumTitle.textContent =
            memory.title || "";


        albumDate.textContent =
            formatDate(
                memory.event_date
            ).toUpperCase();


        albumStory.textContent =
            memory.story || "";


        // =====================================================
        // OPEN MODAL
        // =====================================================

        albumModal.classList.add(
            "active"
        );


        document.body.classList.add(
            "modal-open"
        );


        await renderAlbumPhoto();


    } catch (error) {

        console.error(
            "Gagal membuka album:",
            error
        );

    }

}


// =========================
// RENDER PHOTO
// =========================

async function renderAlbumPhoto() {

    if (
        !albumPhotos.length
    ) {

        albumImage.removeAttribute(
            "src"
        );

        albumCounter.textContent =
            "0 / 0";

        albumPrev.style.display =
            "none";

        albumNext.style.display =
            "none";

        albumDownload.style.display =
            "none";

        return;

    }


    const photo =
        albumPhotos[
            albumCurrentIndex
        ];


    let imageUrl =
        null;


    // =====================================================
    // PRIORITAS PHOTO PATH
    // =====================================================

    if (
        photo.photo_path
    ) {

        imageUrl =
            await getMemoryImageUrl(
                photo.photo_path
            );

    }


    // =====================================================
    // FALLBACK PHOTO URL
    // =====================================================

    if (
        !imageUrl &&
        photo.photo_url
    ) {

        imageUrl =
            photo.photo_url;

    }


    if (!imageUrl) {

        albumImage.removeAttribute(
            "src"
        );

        albumCounter.textContent =
            `${albumCurrentIndex + 1} / ${albumPhotos.length}`;

        return;

    }


    albumImage.src =
        imageUrl;


    albumImage.alt =
        currentAlbumMemory?.title ||
        "Memory";


    albumCounter.textContent =
        `${albumCurrentIndex + 1} / ${albumPhotos.length}`;


    // =====================================================
    // NAVIGATION
    // =====================================================

    if (
        albumPhotos.length <= 1
    ) {

        albumPrev.style.display =
            "none";

        albumNext.style.display =
            "none";

    } else {

        albumPrev.style.display =
            "flex";

        albumNext.style.display =
            "flex";

    }


    albumDownload.style.display =
        "inline-flex";

}


// =========================
// PREVIOUS
// =========================

    if (albumPrev) {

    albumPrev.addEventListener(
        "click",
        function () {

            if (
                albumPhotos.length <= 1
            ) {
                return;
            }


            albumCurrentIndex--;


            if (
                albumCurrentIndex < 0
            ) {

                albumCurrentIndex =
                    albumPhotos.length - 1;

            }


            renderAlbumPhoto();

        }
    );

}


// =========================
// NEXT
// =========================

albumNext.addEventListener(
    "click",
    function () {

        if (
            albumPhotos.length <= 1
        ) {
            return;
        }


        albumCurrentIndex++;


        if (
            albumCurrentIndex >=
            albumPhotos.length
        ) {

            albumCurrentIndex =
                0;

        }


        renderAlbumPhoto();

    }
);


// =========================
// DOWNLOAD
// =========================

albumDownload.addEventListener(
    "click",
    async function () {

        if (
            !albumPhotos.length
        ) {
            return;
        }


        const photo =
            albumPhotos[
                albumCurrentIndex
            ];


        try {

            let imageUrl =
                null;


            if (
                photo.photo_path
            ) {

                imageUrl =
                    await getMemoryImageUrl(
                        photo.photo_path
                    );

            }


            if (
                !imageUrl &&
                photo.photo_url
            ) {

                imageUrl =
                    photo.photo_url;

            }


            if (!imageUrl) {
                return;
            }


            const response =
                await fetch(
                    imageUrl
                );


            if (!response.ok) {

                throw new Error(
                    "Foto tidak dapat didownload."
                );

            }


            const blob =
                await response.blob();


            const blobUrl =
                URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                blobUrl;


            link.download =
                createDownloadName(
                    currentAlbumMemory,
                    albumCurrentIndex
                );


            document.body.appendChild(
                link
            );


            link.click();


            link.remove();


            URL.revokeObjectURL(
                blobUrl
            );


        } catch (error) {

            console.error(
                "Download gagal:",
                error
            );


            /*
                Fallback jika browser
                menolak fetch/download.
            */

            let fallbackUrl =
                photo.photo_url;


            if (
                !fallbackUrl &&
                photo.photo_path
            ) {

                fallbackUrl =
                    await getMemoryImageUrl(
                        photo.photo_path
                    );

            }


            if (fallbackUrl) {

                window.open(
                    fallbackUrl,
                    "_blank"
                );

            }

        }

    }
);


// =========================
// DOWNLOAD NAME
// =========================

function createDownloadName(
    memory,
    index
) {

    const title =
        (memory?.title || "memory")
            .toLowerCase()
            .replace(
                /[^a-z0-9]+/g,
                "-"
            )
            .replace(
                /^-+|-+$/g,
                ""
            );


    return `${title || "memory"}-${index + 1}.jpg`;

}


// =========================
// CLOSE ALBUM
// =========================

function closeMemoryAlbum() {

    albumModal.classList.remove(
        "active"
    );


    document.body.classList.remove(
        "modal-open"
    );


    albumPhotos =
        [];

    currentAlbumMemory =
        null;

    albumCurrentIndex =
        0;


    albumImage.removeAttribute(
        "src"
    );

}


// =========================
// CLOSE BUTTON
// =========================

albumClose.addEventListener(
    "click",
    closeMemoryAlbum
);


// =========================
// CLICK OUTSIDE
// =========================

albumModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            albumModal
        ) {

            closeMemoryAlbum();

        }

    }
);


// =========================
// KEYBOARD
// =========================

document.addEventListener(
    "keydown",
    function (event) {

        if (
            !albumModal.classList.contains(
                "active"
            )
        ) {

            return;

        }


        if (
            event.key ===
            "Escape"
        ) {

            closeMemoryAlbum();

        }


        if (
            event.key ===
            "ArrowLeft"
        ) {

            albumPrev.click();

        }


        if (
            event.key ===
            "ArrowRight"
        ) {

            albumNext.click();

        }

    }
);
