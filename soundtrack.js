/* =========================
   OUR SOUNDTRACK
========================= */

async function loadSoundtrack() {

    const container = document.getElementById("soundtrack-player");

    if (!container) return;

    try {

        const { data, error } = await db
            .from("spotify_playlists")
            .select("*")
            .order("created_at", {
                ascending: false
            })
            .limit(1);

        if (error) {
            throw error;
        }

        if (!data || data.length === 0) {

            container.innerHTML = `
                <p class="soundtrack-loading">
                    Our soundtrack hasn't been added yet.
                </p>
            `;

            return;
        }

        const playlist = data[0];

        const spotifyUrl = playlist.spotify_url;

        const playlistMatch =
            spotifyUrl.match(/playlist\/([a-zA-Z0-9]+)/);

        if (!playlistMatch) {

            container.innerHTML = `
                <p class="soundtrack-loading">
                    Invalid Spotify playlist link.
                </p>
            `;

            return;
        }

        const playlistId = playlistMatch[1];

       const embedUrl =
    `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`;

container.innerHTML = `
    <iframe
        data-testid="embed-iframe"
        style="border-radius:12px"
        src="${embedUrl}"
        width="100%"
        height="152"
        frameborder="0"
        allowfullscreen=""
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy">
    </iframe>
`;
    } catch (error) {

        console.error(
            "Error loading soundtrack:",
            error
        );

        container.innerHTML = `
            <p class="soundtrack-loading">
                Failed to load our soundtrack.
            </p>
        `;
    }
}

loadSoundtrack();
