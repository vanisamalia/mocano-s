/* =========================
   RANDOM MEMORY
========================= */


/* =========================
   GET RANDOM MEMORY
========================= */

async function getRandomMemory() {

    const { data, error } = await db
        .from("memories")
        .select(
            "id, title, story, event_date"
        );

    if (error) {

        console.error(
            "Gagal mengambil memories:",
            error
        );

        return null;

    }

    if (!data || data.length === 0) {

        return null;

    }

    const randomIndex =
        Math.floor(
            Math.random() * data.length
        );

    return data[randomIndex];

}


/* =========================
   GET MEMORY PHOTO
========================= */

async function getRandomMemoryPhoto(memoryId) {

    if (!memoryId) {

        return null;

    }


    const { data, error } = await db
        .from("memory_photos")
        .select(
            "photo_url, photo_path, created_at"
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
        )
        .limit(1);


    if (error) {

        console.error(
            "Gagal mengambil foto memory:",
            error
        );

        return null;

    }


    if (!data || data.length === 0) {

        return null;

    }


    const photo = data[0];


    /* =========================
       TRY SIGNED URL
    ========================= */

    if (photo.photo_path) {

        const {
            data: signedData,
            error: signedError
        } = await db.storage
            .from("memory-photos")
            .createSignedUrl(
                photo.photo_path,
                3600
            );


        if (
            !signedError &&
            signedData &&
            signedData.signedUrl
        ) {

            return signedData.signedUrl;

        }

    }


    /* =========================
       FALLBACK PUBLIC URL
    ========================= */

    if (photo.photo_url) {

        return photo.photo_url;

    }


    return null;

}


/* =========================
   SHOW RANDOM MEMORY
========================= */

async function showRandomMemory() {

    const result =
        document.getElementById(
            "random-memory-result"
        );

    const modal =
        document.getElementById(
            "random-memory-modal"
        );


    if (!result || !modal) {

        return;

    }


    /* =========================
       LOADING
    ========================= */

    result.innerHTML = `
        <p class="random-memory-empty">
            Loading memory...
        </p>
    `;


    modal.style.display = "flex";

    document.body.style.overflow = "hidden";


    /* =========================
       GET RANDOM MEMORY
    ========================= */

    const memory =
        await getRandomMemory();


    if (!memory) {

        result.innerHTML = `
            <p class="random-memory-empty">
                No memories available yet.
            </p>
        `;

        return;

    }


    /* =========================
       GET PHOTO
    ========================= */

    const imageURL =
        await getRandomMemoryPhoto(
            memory.id
        );


    /* =========================
       FORMAT DATE
    ========================= */

    let formattedDate = "";


    if (memory.event_date) {

        const date =
            new Date(
                memory.event_date
            );


        formattedDate =
            date.toLocaleDateString(
                "en-US",
                {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }
            );

    }


    /* =========================
       IMAGE HTML
    ========================= */

    const imageHTML =
        imageURL
        ? `
            <div class="random-memory-image">
                <img
                    src="${imageURL}"
                    alt="${memory.title || "Memory"}"
                >
            </div>
        `
        : "";


    /* =========================
       DATE HTML
    ========================= */

    const dateHTML =
        formattedDate
        ? `
            <p class="random-memory-date">
                ${formattedDate}
            </p>
        `
        : "";


    /* =========================
       TITLE HTML
    ========================= */

    const titleHTML =
        memory.title
        ? `
            <h3>
                ${memory.title}
            </h3>
        `
        : "";


    /* =========================
       STORY HTML
    ========================= */

    const storyHTML =
        memory.story
        ? `
            <p class="random-memory-story">
                ${memory.story}
            </p>
        `
        : "";


    /* =========================
       RENDER
    ========================= */

    result.innerHTML = `
        ${imageHTML}

        <div class="random-memory-text">

            ${dateHTML}

            ${titleHTML}

            ${storyHTML}

        </div>
    `;

}


/* =========================
   CLOSE MODAL
========================= */

function closeRandomMemory() {

    const modal =
        document.getElementById(
            "random-memory-modal"
        );


    if (!modal) {

        return;

    }


    modal.style.display = "none";

    document.body.style.overflow = "";

}


/* =========================
   INITIALIZE
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const randomButton =
            document.getElementById(
                "random-memory-btn"
            );


        const againButton =
            document.getElementById(
                "random-memory-again"
            );


        const closeButton =
            document.getElementById(
                "random-memory-close"
            );


        const modal =
            document.getElementById(
                "random-memory-modal"
            );


        /* =========================
           RANDOM BUTTON
        ========================= */

        if (randomButton) {

            randomButton.addEventListener(
                "click",
                showRandomMemory
            );

        }


        /* =========================
           AGAIN BUTTON
        ========================= */

        if (againButton) {

            againButton.addEventListener(
                "click",
                showRandomMemory
            );

        }


        /* =========================
           CLOSE BUTTON
        ========================= */

        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closeRandomMemory
            );

        }


        /* =========================
           CLOSE OUTSIDE MODAL
        ========================= */

        if (modal) {

            modal.addEventListener(
                "click",
                event => {

                    if (
                        event.target === modal
                    ) {

                        closeRandomMemory();

                    }

                }
            );

        }

    }
);
