const SUPABASE_URL = "ВСТАВЬ_СЮДА_API_URL";
const SUPABASE_KEY = "ВСТАВЬ_СЮДА_PUBLISHABLE_KEY";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ================================
// DEMON LIST
// ================================

let levels = [];

async function loadLevels() {

    const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: true });

    if (error) {
        console.error(error);
        return;
    }

    levels = data || [];

    displayLevels(levels);
}


function displayLevels(list) {

    const container = document.getElementById("levels");

    if (!container) return;

    container.innerHTML = "";

    list.forEach((level, index) => {

        const element = document.createElement("div");

        element.className = "level";

        let videoHTML = "";

        if (
            level.youtube_url &&
            level.video_status !== "rejected"
        ) {

            videoHTML = `
                <a
                    class="youtube-preview"
                    href="${level.youtube_url}"
                    target="_blank">

                    <img
                        src="https://img.youtube.com/vi/${getYouTubeID(level.youtube_url)}/hqdefault.jpg">

                    <div class="play-button">
                        ▶
                    </div>

                </a>
            `;

        } else {

            videoHTML = `
                <div class="youtube-preview no-video">
                    No video
                </div>
            `;

        }


        element.innerHTML = `

            ${videoHTML}

            <div class="rank">
                #${index + 1}
            </div>

            <div class="level-info">

                <h3>
                    ${escapeHTML(level.level_name)}
                </h3>

                <p>
                    Creator:
                    ${escapeHTML(level.creator_name)}
                </p>

                <p class="difficulty">
                    Extreme Demon
                </p>

            </div>

        `;

        container.appendChild(element);

    });

}


function getYouTubeID(url) {

    try {

        const parsed = new URL(url);

        if (parsed.hostname.includes("youtu.be")) {

            return parsed.pathname.substring(1);

        }

        return parsed.searchParams.get("v");

    } catch {

        return "";

    }

}


function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text || "";

    return div.innerHTML;

}


// ================================
// PAGE NAVIGATION
// ================================

function showPage(pageID) {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.add("hidden");

        });


    const page = document.getElementById(pageID);

    if (page) {
        page.classList.remove("hidden");
    }

}


// ================================
// SEARCH
// ================================

function searchLevels() {

    const search = document
        .getElementById("search")
        .value
        .toLowerCase();


    const filtered = levels.filter(level =>

        level.level_name
            .toLowerCase()
            .includes(search)

        ||

        level.creator_name
            .toLowerCase()
            .includes(search)

    );


    displayLevels(filtered);

}


// ================================
// INITIAL LOAD
// ================================

loadLevels();