// =====================================================
// DASH WORLD DEMON LIST
// =====================================================

// ВСТАВЬ СЮДА СВОИ ДВЕ СТРОКИ ИЗ СТАРОГО script.js
const SUPABASE_URL = "https://irxkvnromngihugetrwf.supabase.co";
const SUPABASE_KEY = "sb_publishable_R7MlVHvKXHn9n49mRPpo3g_-J2lwfWR";

let supabaseClient = null;

if (
    window.supabase &&
    SUPABASE_URL !== "PASTE_YOUR_EXISTING_SUPABASE_URL_HERE" &&
    SUPABASE_KEY !== "PASTE_YOUR_EXISTING_PUBLISHABLE_OR_ANON_KEY_HERE"
) {
    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );
}

let editingLevelId = null;
let adminPanelOpen = false;


// =====================================================
// PAGE NAVIGATION
// =====================================================

function hideAllPages() {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.add("hidden");
    });
}

function showPage(page) {
    hideAllPages();

    const pageMap = {
        list: "listPage",
        submit: "submitPage",
        adminLogin: "adminLoginPage",
        admin: "adminPage"
    };

    const element = document.getElementById(pageMap[page]);

    if (element) {
        element.classList.remove("hidden");
    }
}

async function openAdminLogin() {

    if (!supabaseClient) {
        showPage("adminLogin");
        return;
    }

    const { data } =
        await supabaseClient.auth.getSession();

    if (data.session) {

        const { data: isAdmin } =
            await supabaseClient.rpc("is_admin");

        if (isAdmin === true) {

            adminPanelOpen = true;

            document
                .getElementById("adminPanelButton")
                .classList.remove("hidden");

            showPage("admin");

            await loadAdminLevels();

            return;
        }
    }

    showPage("adminLogin");
}


async function toggleAdminPanel() {

    if (!supabaseClient) {
        return;
    }

    const { data } =
        await supabaseClient.auth.getSession();

    if (!data.session) {

        adminPanelOpen = false;

        document
            .getElementById("adminPanelButton")
            .classList.add("hidden");

        showPage("adminLogin");

        return;
    }

    const { data: isAdmin } =
        await supabaseClient.rpc("is_admin");

    if (isAdmin !== true) {

        adminPanelOpen = false;

        document
            .getElementById("adminPanelButton")
            .classList.add("hidden");

        showPage("adminLogin");

        return;
    }

    adminPanelOpen = !adminPanelOpen;

    if (adminPanelOpen) {

        showPage("admin");

        await loadAdminLevels();

    } else {

        showPage("list");

        await loadLevels();
    }
}


// =====================================================
// LOAD LEVELS
// =====================================================

async function loadLevels() {

    const container =
        document.getElementById("levels-container");

    if (!container) return;

    if (!supabaseClient) {

        container.innerHTML =
            "<p>Supabase is not connected.</p>";

        return;
    }

    const { data, error } =
        await supabaseClient
            .from("levels")
            .select("*")
            .order("position", {
                ascending: true
            });

    if (error) {

        console.error(error);

        container.innerHTML =
            "<p>Could not load levels.</p>";

        return;
    }

    renderLevels(data || []);
}


// =====================================================
// SECURITY
// =====================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// =====================================================
// RENDER LEVELS
// =====================================================

function renderLevels(levels) {

    const container =
        document.getElementById("levels-container");

    if (!levels.length) {

        container.innerHTML =
            '<div class="card"><p>No levels have been added yet.</p></div>';

        return;
    }

    container.innerHTML =
        levels.map(level => {

            const youtube =
                level.youtube_url
                    ? `<a href="${escapeHTML(level.youtube_url)}" target="_blank" rel="noopener">YouTube Preview</a>`
                    : "";

            return `
                <div class="level rank-${escapeHTML(level.position)}">

                    <div class="rank">
                        #${escapeHTML(level.position)}
                    </div>

                    <div class="level-info">

                        <h3>
                            ${escapeHTML(level.level_name)}
                        </h3>

                        <p>
                            ID: ${escapeHTML(level.level_id)}
                        </p>

                        <p>
                            Creator:
                            ${escapeHTML(level.creator_name)}
                        </p>

                        <p>
                            Difficulty:
                            ${escapeHTML(level.difficulty)}
                        </p>

                        ${youtube}

                    </div>

                </div>
            `;

        }).join("");
}


// =====================================================
// ADMIN LOGIN
// =====================================================

async function adminLogin() {

    const message =
        document.getElementById("adminLoginMessage");

    const email =
        document.getElementById("adminId")
            .value
            .trim();

    const password =
        document.getElementById("adminPassword")
            .value;

    if (!supabaseClient) {

        message.textContent =
            "Supabase is not connected.";

        return;
    }

    if (!email || !password) {

        message.textContent =
            "Please enter your email and password.";

        return;
    }

    message.textContent =
        "Logging in...";

    const { error } =
        await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

    if (error) {

        console.error(error);

        message.textContent =
            "Login failed. Check your email and password.";

        return;
    }

    const { data: isAdmin, error: adminError } =
        await supabaseClient.rpc("is_admin");

    if (
        adminError ||
        isAdmin !== true
    ) {

        await supabaseClient.auth.signOut();

        message.textContent =
            "This account does not have administrator access.";

        return;
    }

    message.textContent = "";

    document
        .getElementById("adminPanelButton")
        .classList.remove("hidden");

    adminPanelOpen = true;

    showPage("admin");

    await loadAdminLevels();
}


// =====================================================
// AUTOMATIC POSITION NUMBERING
// =====================================================

async function normalizePositions() {

    const { data, error } =
        await supabaseClient
            .from("levels")
            .select("id, position")
            .order("position", {
                ascending: true
            })
            .order("id", {
                ascending: true
            });

    if (error) {

        console.error(error);

        return false;
    }

    for (
        let i = 0;
        i < data.length;
        i++
    ) {

        const wantedPosition =
            i + 1;

        if (
            Number(data[i].position) !==
            wantedPosition
        ) {

            const { error: updateError } =
                await supabaseClient
                    .from("levels")
                    .update({
                        position: wantedPosition
                    })
                    .eq("id", data[i].id);

            if (updateError) {

                console.error(updateError);

                return false;
            }
        }
    }

    return true;
}


async function getNextPosition() {

    const { count, error } =
        await supabaseClient
            .from("levels")
            .select("id", {
                count: "exact",
                head: true
            });

    if (error) {

        console.error(error);

        return null;
    }

    return Number(count || 0) + 1;
}


// =====================================================
// ADD / EDIT LEVEL
// =====================================================

async function saveLevel() {

    const message =
        document.getElementById("addLevelMessage");

    const levelName =
        document.getElementById("levelName")
            .value
            .trim();

    const levelId =
        document.getElementById("levelId")
            .value
            .trim();

    const creatorName =
        document.getElementById("creatorName")
            .value
            .trim();

    const difficulty =
        document.getElementById("difficulty")
            .value
            .trim();

    const youtubeUrl =
        document.getElementById("youtubeUrl")
            .value
            .trim();


    if (!supabaseClient) {

        message.textContent =
            "Supabase is not connected.";

        return;
    }


    if (
        !levelName ||
        !levelId ||
        !creatorName ||
        !difficulty
    ) {

        message.textContent =
            "Please fill in all required fields.";

        return;
    }


    const { data: sessionData } =
        await supabaseClient.auth.getSession();


    if (!sessionData.session) {

        message.textContent =
            "You are not logged in.";

        return;
    }


    const { data: isAdmin, error: adminError } =
        await supabaseClient.rpc("is_admin");


    if (
        adminError ||
        isAdmin !== true
    ) {

        message.textContent =
            "You do not have administrator access.";

        return;
    }


    // =================================================
    // EDIT EXISTING LEVEL
    // =================================================

    if (editingLevelId !== null) {

        message.textContent =
            "Saving changes...";


        const { error } =
            await supabaseClient
                .from("levels")
                .update({

                    level_name: levelName,

                    level_id: levelId,

                    creator_name: creatorName,

                    difficulty: difficulty,

                    youtube_url:
                        youtubeUrl || null

                })
                .eq(
                    "id",
                    editingLevelId
                );


        if (error) {

            console.error(error);

            message.textContent =
                "Could not save changes.";

            return;
        }


        message.textContent =
            "Level updated successfully!";


        cancelEdit(false);

        await loadLevels();

        await loadAdminLevels();

        return;
    }


    // =================================================
    // ADD NEW LEVEL
    // =================================================

    message.textContent =
        "Adding level...";


    const normalized =
        await normalizePositions();


    if (!normalized) {

        message.textContent =
            "Could not prepare level positions.";

        return;
    }


    const position =
        await getNextPosition();


    if (position === null) {

        message.textContent =
            "Could not calculate the next position.";

        return;
    }


    const { error } =
        await supabaseClient
            .from("levels")
            .insert({

                level_name: levelName,

                level_id: levelId,

                creator_name: creatorName,

                difficulty: difficulty,

                position: position,

                youtube_url:
                    youtubeUrl || null

            });


    if (error) {

        console.error(error);

        message.textContent =
            "Could not add the level.";

        return;
    }


    message.textContent =
        `Level added successfully as #${position}!`;


    clearLevelForm();


    await loadLevels();

    await loadAdminLevels();
}


// =====================================================
// START EDIT
// =====================================================

async function startEditLevel(id) {

    if (!supabaseClient) {
        return;
    }


    const { data: isAdmin } =
        await supabaseClient.rpc("is_admin");


    if (isAdmin !== true) {
        return;
    }


    const { data, error } =
        await supabaseClient
            .from("levels")
            .select("*")
            .eq("id", id)
            .single();


    if (error || !data) {

        console.error(error);

        return;
    }


    editingLevelId = id;


    document.getElementById("levelName")
        .value =
        data.level_name || "";


    document.getElementById("levelId")
        .value =
        data.level_id || "";


    document.getElementById("creatorName")
        .value =
        data.creator_name || "";


    document.getElementById("difficulty")
        .value =
        data.difficulty || "";


    document.getElementById("youtubeUrl")
        .value =
        data.youtube_url || "";


    document.getElementById("formTitle")
        .textContent =
        `Edit Level #${data.position}`;


    document.getElementById("saveLevelButton")
        .textContent =
        "Save Changes";


    document.getElementById("cancelEditButton")
        .classList
        .remove("hidden");


    document.getElementById("addLevelMessage")
        .textContent =
        "Editing this level.";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// =====================================================
// CANCEL EDIT
// =====================================================

function cancelEdit(showMessage = true) {

    editingLevelId = null;


    clearLevelForm();


    document.getElementById("formTitle")
        .textContent =
        "Add Level";


    document.getElementById("saveLevelButton")
        .textContent =
        "Add Level";


    document.getElementById("cancelEditButton")
        .classList
        .add("hidden");


    if (showMessage) {

        document.getElementById("addLevelMessage")
            .textContent = "";
    }
}


// =====================================================
// CLEAR FORM
// =====================================================

function clearLevelForm() {

    document.getElementById("levelName")
        .value = "";

    document.getElementById("levelId")
        .value = "";

    document.getElementById("creatorName")
        .value = "";

    document.getElementById("difficulty")
        .value = "";

    document.getElementById("youtubeUrl")
        .value = "";
}


// =====================================================
// DELETE LEVEL
// =====================================================

async function deleteLevel(
    id,
    levelName
) {

    if (!supabaseClient) {
        return;
    }


    const confirmed =
        confirm(
            `Delete "${levelName}"?`
        );


    if (!confirmed) {
        return;
    }


    const { data: isAdmin } =
        await supabaseClient.rpc("is_admin");


    if (isAdmin !== true) {

        alert(
            "You do not have administrator access."
        );

        return;
    }


    const { error } =
        await supabaseClient
            .from("levels")
            .delete()
            .eq("id", id);


    if (error) {

        console.error(error);

        alert(
            "Could not delete the level."
        );

        return;
    }


    // После удаления номера станут
    // снова 1, 2, 3, 4...
    await normalizePositions();


    await loadLevels();

    await loadAdminLevels();
}


// =====================================================
// ADMIN LEVEL LIST
// =====================================================

async function loadAdminLevels() {

    const container =
        document.getElementById(
            "admin-levels-container"
        );


    if (
        !container ||
        !supabaseClient
    ) {
        return;
    }


    const { data, error } =
        await supabaseClient
            .from("levels")
            .select("*")
            .order("position", {
                ascending: true
            });


    if (error) {

        console.error(error);

        container.innerHTML =
            "<p>Could not load admin levels.</p>";

        return;
    }


    if (
        !data ||
        !data.length
    ) {

        container.innerHTML =
            "<p>No levels yet.</p>";

        return;
    }


    container.innerHTML =
        data.map(level => {

            const safeName =
                escapeHTML(
                    level.level_name
                );

            const safeId =
                Number(level.id);


            return `
                <div class="admin-level">

                    <div class="admin-level-info">

                        <strong>
                            #${escapeHTML(level.position)}
                            —
                            ${safeName}
                        </strong>

                        <span>
                            ID:
                            ${escapeHTML(level.level_id)}

                            · Creator:
                            ${escapeHTML(level.creator_name)}

                            ·
                            ${escapeHTML(level.difficulty)}
                        </span>

                    </div>


                    <div class="admin-actions">

                        <button
                            class="edit-button"
                            onclick="startEditLevel(${safeId})">

                            Edit

                        </button>


                        <button
                            class="delete-button"
                            onclick="deleteLevel(
                                ${safeId},
                                '${safeName.replaceAll(
                                    "'",
                                    "\\'"
                                )}'
                            )">

                            Delete

                        </button>

                    </div>

                </div>
            `;

        }).join("");
}


// =====================================================
// SUBMIT LEVEL
// =====================================================

async function submitLevel() {

    const message =
        document.getElementById(
            "submitMessage"
        );


    if (!supabaseClient) {

        message.textContent =
            "Supabase is not connected.";

        return;
    }


    const { data: sessionData } =
        await supabaseClient.auth.getSession();


    if (!sessionData.session) {

        message.textContent =
            "Please log in with a player account before submitting.";

        return;
    }


    const levelName =
        document.getElementById(
            "submitLevelName"
        ).value.trim();


    const levelId =
        document.getElementById(
            "submitLevelId"
        ).value.trim();


    const creatorName =
        document.getElementById(
            "submitCreatorName"
        ).value.trim();


    const youtubeUrl =
        document.getElementById(
            "submitYoutube"
        ).value.trim();


    if (
        !levelName ||
        !levelId ||
        !creatorName
    ) {

        message.textContent =
            "Please fill in all required fields.";

        return;
    }


    message.textContent =
        "Submitting...";


    const { error } =
        await supabaseClient
            .from("submissions")
            .insert({

                user_id:
                    sessionData.session.user.id,

                level_name:
                    levelName,

                level_id:
                    levelId,

                creator_name:
                    creatorName,

                youtube_url:
                    youtubeUrl || null

            });


    if (error) {

        console.error(error);

        message.textContent =
            "Could not submit the level.";

        return;
    }


    message.textContent =
        "Level submitted successfully!";


    document.getElementById(
        "submitLevelName"
    ).value = "";


    document.getElementById(
        "submitLevelId"
    ).value = "";


    document.getElementById(
        "submitCreatorName"
    ).value = "";


    document.getElementById(
        "submitYoutube"
    ).value = "";
}


// =====================================================
// ADMIN LOGOUT
// =====================================================

async function adminLogout() {

    if (supabaseClient) {

        await supabaseClient.auth.signOut();
    }


    adminPanelOpen = false;

    editingLevelId = null;


    document.getElementById(
        "adminPanelButton"
    )
        .classList
        .add("hidden");


    document.getElementById(
        "adminPassword"
    ).value = "";


    showPage("list");

    await loadLevels();
}


// =====================================================
// SEARCH
// =====================================================

document
    .getElementById("searchInput")
    .addEventListener(
        "input",
        async function () {

            const search =
                this.value
                    .trim()
                    .toLowerCase();


            if (!supabaseClient) {
                return;
            }


            const { data, error } =
                await supabaseClient
                    .from("levels")
                    .select("*")
                    .order("position", {
                        ascending: true
                    });


            if (error) {

                console.error(error);

                return;
            }


            const filtered =
                (data || []).filter(level =>

                    String(level.level_name)
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(level.level_id)
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(level.creator_name)
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(level.difficulty)
                        .toLowerCase()
                        .includes(search)

                );


            renderLevels(filtered);
        }
    );


// =====================================================
// RESTORE ADMIN SESSION
// =====================================================

async function checkAdminSession() {

    if (!supabaseClient) {

        showPage("list");

        return;
    }


    const { data } =
        await supabaseClient.auth.getSession();


    if (!data.session) {

        showPage("list");

        return;
    }


    const { data: isAdmin } =
        await supabaseClient.rpc(
            "is_admin"
        );


    if (isAdmin === true) {

        document
            .getElementById(
                "adminPanelButton"
            )
            .classList
            .remove("hidden");

    } else {

        document
            .getElementById(
                "adminPanelButton"
            )
            .classList
            .add("hidden");
    }


    showPage("list");
}


// =====================================================
// START
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await checkAdminSession();

        await loadLevels();

    }
);