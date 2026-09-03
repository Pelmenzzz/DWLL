// ======================================================
// DASH WORLD DEMON LIST
// ======================================================


// ======================================================
// SUPABASE
// ======================================================

// ВСТАВЬ СЮДА СВОИ СТАРЫЕ ЗНАЧЕНИЯ

const SUPABASE_URL =
    "https://irxkvnromngihugetrwf.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_R7MlVHvKXHn9n49mRPpo3g_-J2lwfWR";


let supabaseClient = null;

if (
    window.supabase &&
    SUPABASE_URL !== "https://irxkvnromngihugetrwf.supabase.co" &&
    SUPABASE_KEY !== "sb_publishable_R7MlVHvKXHn9n49mRPpo3g_-J2lwfWR"
) {

    supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );
}


// ======================================================
// VARIABLES
// ======================================================

let currentUser = null;
let currentProfile = null;

let editingLevelId = null;


// ======================================================
// SHORTCUT
// ======================================================

function $(id) {
    return document.getElementById(id);
}


// ======================================================
// HTML SECURITY
// ======================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ======================================================
// MESSAGES
// ======================================================

function message(id, text, success = false) {

    const element = $(id);

    if (!element) return;

    element.textContent = text;

    element.style.color =
        success ? "#4ade80" : "";

}


// ======================================================
// PAGE SYSTEM
// ======================================================

async function showPage(page) {

    document
        .querySelectorAll(".page")
        .forEach(element => {

            element.classList.add("hidden");

        });


    const pages = {

        list: "listPage",

        submit: "submitPage",

        login: "loginPage",

        register: "registerPage",

        profile: "profilePage",

        adminLogin: "adminLoginPage",

        admin: "adminPage"

    };


    // Submit requires login

    if (
        page === "submit" &&
        !currentUser
    ) {

        page = "login";

        message(
            "loginMessage",
            "Please log in before submitting a level."
        );

    }


    // Profile requires login

    if (
        page === "profile" &&
        !currentUser
    ) {

        page = "login";

    }


    // Admin page requires admin

    if (page === "admin") {

        const admin =
            await isAdmin();

        if (!admin) {

            page = "adminLogin";

        }

    }


    const element =
        $(pages[page]);

    if (element) {

        element.classList.remove("hidden");

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    // Load page data

    if (page === "list") {

        await loadLevels();

    }

    if (page === "profile") {

        await loadProfile();

    }

    if (page === "admin") {

        await loadAdminSubmissions();

        await loadAdminLevels();

    }

}


// ======================================================
// AUTH UI
// ======================================================

function updateAuthUI() {

    const loggedIn =
        !!currentUser;


    $("loginNavButton")
        ?.classList.toggle(
            "hidden",
            loggedIn
        );


    $("registerNavButton")
        ?.classList.toggle(
            "hidden",
            loggedIn
        );


    $("profileNavButton")
        ?.classList.toggle(
            "hidden",
            !loggedIn
        );


    $("logoutNavButton")
        ?.classList.toggle(
            "hidden",
            !loggedIn
        );


    const admin =
        currentProfile?.role === "admin";


    $("adminPanelButton")
        ?.classList.toggle(
            "hidden",
            !admin
        );

}


// ======================================================
// CURRENT USER
// ======================================================

async function loadCurrentUser() {

    if (!supabaseClient) {

        console.error(
            "Supabase is not configured."
        );

        return;

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .getSession();


    if (error) {

        console.error(error);

        return;

    }


    currentUser =
        data.session?.user || null;


    if (currentUser) {

        await loadCurrentProfile();

    }


    updateAuthUI();

}


// ======================================================
// PROFILE
// ======================================================

async function loadCurrentProfile() {

    if (!currentUser) {

        currentProfile = null;

        return;

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .maybeSingle();


    if (error) {

        console.error(error);

        return;

    }


    currentProfile = data;

    updateAuthUI();

}


// ======================================================
// ADMIN CHECK
// ======================================================

async function isAdmin() {

    if (
        !supabaseClient ||
        !currentUser
    ) {

        return false;

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .rpc("is_admin");


    if (error) {

        console.error(error);

        return false;

    }


    return data === true;

}


// ======================================================
// PLAYER LOGIN
// ======================================================

async function playerLogin() {

    if (!supabaseClient) {

        message(
            "loginMessage",
            "Supabase is not configured."
        );

        return;

    }


    const email =
        $("loginEmail")
            .value
            .trim();


    const password =
        $("loginPassword")
            .value;


    if (!email || !password) {

        message(
            "loginMessage",
            "Enter email and password."
        );

        return;

    }


    message(
        "loginMessage",
        "Logging in..."
    );


    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .signInWithPassword({

                email: email,

                password: password

            });


    if (error) {

        console.error(error);

        message(
            "loginMessage",
            error.message
        );

        return;

    }


    currentUser =
        data.user;


    await loadCurrentProfile();


    message(
        "loginMessage",
        "Login successful!",
        true
    );


    updateAuthUI();


    await showPage("profile");

}


// ======================================================
// REGISTER
// ======================================================

async function registerPlayer() {

    if (!supabaseClient) {

        message(
            "registerMessage",
            "Supabase is not configured."
        );

        return;

    }


    const username =
        $("registerUsername")
            .value
            .trim();


    const email =
        $("registerEmail")
            .value
            .trim();


    const password =
        $("registerPassword")
            .value;


    if (
        !username ||
        !email ||
        !password
    ) {

        message(
            "registerMessage",
            "Fill in all fields."
        );

        return;

    }


    if (username.length < 3) {

        message(
            "registerMessage",
            "Username must contain at least 3 characters."
        );

        return;

    }


    if (password.length < 6) {

        message(
            "registerMessage",
            "Password must contain at least 6 characters."
        );

        return;

    }


    message(
        "registerMessage",
        "Creating account..."
    );


    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .signUp({

                email: email,

                password: password,

                options: {

                    data: {

                        username: username

                    }

                }

            });


    if (error) {

        console.error(error);

        message(
            "registerMessage",
            error.message
        );

        return;

    }


    // Email confirmation may be enabled

    if (!data.session) {

        message(
            "registerMessage",
            "Account created! Check your email if confirmation is required.",
            true
        );

        return;

    }


    currentUser =
        data.user;


    await loadCurrentProfile();


    updateAuthUI();


    await showPage("profile");

}


// ======================================================
// LOGOUT
// ======================================================

async function playerLogout() {

    if (supabaseClient) {

        await supabaseClient
            .auth
            .signOut();

    }


    currentUser = null;

    currentProfile = null;

    editingLevelId = null;


    updateAuthUI();


    await showPage("list");

}


// ======================================================
// PROFILE PAGE
// ======================================================

async function loadProfile() {

    if (!currentUser) return;


    await loadCurrentProfile();


    $("profileUsername")
        .textContent =
            currentProfile?.username ||
            "Player";


    $("profileEmail")
        .textContent =
            currentUser.email ||
            "";


    $("profileRole")
        .textContent =
            currentProfile?.role ||
            "player";


    await loadMySubmissions();

}


// ======================================================
// MY SUBMISSIONS
// ======================================================

async function loadMySubmissions() {

    const container =
        $("my-submissions");


    if (
        !container ||
        !currentUser
    ) {

        return;

    }


    container.innerHTML =
        "<p>Loading...</p>";


    const {
        data,
        error
    } =
        await supabaseClient
            .from("submissions")
            .select("*")
            .eq(
                "user_id",
                currentUser.id
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(error);

        container.innerHTML =
            "<p>Could not load submissions.</p>";

        return;

    }


    if (!data || data.length === 0) {

        container.innerHTML =
            "<p>You have no submissions yet.</p>";

        return;

    }


    container.innerHTML =
        data.map(submission => {

            return `

                <div class="submission-card">

                    <h3>
                        ${escapeHTML(
                            submission.level_name
                        )}
                    </h3>

                    <p>
                        ID:
                        ${escapeHTML(
                            submission.level_id
                        )}
                    </p>

                    <p>
                        Creator:
                        ${escapeHTML(
                            submission.creator_name
                        )}
                    </p>

                    <p>
                        Difficulty:
                        ${escapeHTML(
                            submission.difficulty ||
                            "Unknown"
                        )}
                    </p>

                    <p>
                        Status:
                        <strong>
                            ${escapeHTML(
                                submission.status ||
                                "pending"
                            )}
                        </strong>
                    </p>

                    ${
                        submission.admin_message
                        ?
                        `<p>
                            Admin:
                            ${escapeHTML(
                                submission.admin_message
                            )}
                        </p>`
                        :
                        ""
                    }

                </div>

            `;

        }).join("");

}


// ======================================================
// SUBMIT LEVEL
// ======================================================

async function submitLevel() {

    if (!supabaseClient) {

        message(
            "submitMessage",
            "Supabase is not configured."
        );

        return;

    }


    if (!currentUser) {

        message(
            "submitMessage",
            "Please log in first."
        );

        return;

    }


    const levelName =
        $("submitLevelName")
            .value
            .trim();


    const levelId =
        $("submitLevelId")
            .value
            .trim();


    const creatorName =
        $("submitCreatorName")
            .value
            .trim();


    const difficulty =
        $("submitDifficulty")
            .value
            .trim();


    const youtubeUrl =
        $("submitYoutube")
            .value
            .trim();


    if (
        !levelName ||
        !levelId ||
        !creatorName ||
        !difficulty
    ) {

        message(
            "submitMessage",
            "Fill in all required fields."
        );

        return;

    }


    message(
        "submitMessage",
        "Submitting..."
    );


    const {
        error
    } =
        await supabaseClient
            .from("submissions")
            .insert({

                user_id:
                    currentUser.id,

                level_name:
                    levelName,

                level_id:
                    levelId,

                creator_name:
                    creatorName,

                difficulty:
                    difficulty,

                youtube_url:
                    youtubeUrl ||
                    null,

                status:
                    "pending",

                video_status:
                    youtubeUrl
                        ? "pending"
                        : "pending"

            });


    if (error) {

        console.error(error);

        message(
            "submitMessage",
            "Could not submit: " +
            error.message
        );

        return;

    }


    $("submitLevelName").value = "";

    $("submitLevelId").value = "";

    $("submitCreatorName").value = "";

    $("submitDifficulty").value = "";

    $("submitYoutube").value = "";


    message(
        "submitMessage",
        "Level submitted successfully!",
        true
    );

}


// ======================================================
// LOAD LEVELS
// ======================================================

async function loadLevels() {

    const container =
        $("levels-container");


    if (!container) return;


    if (!supabaseClient) {

        container.innerHTML =
            "<p>Supabase is not configured.</p>";

        return;

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("levels")
            .select("*")
            .order(
                "position",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(error);

        container.innerHTML =
            "<p>Could not load levels.</p>";

        return;

    }


    renderLevels(data || []);

}


// ======================================================
// RENDER LEVELS
// ======================================================

function renderLevels(levels) {

    const container =
        $("levels-container");


    if (!container) return;


    if (!levels.length) {

        container.innerHTML =
            `

            <div class="card">

                <p>
                    No levels have been added yet.
                </p>

            </div>

            `;

        return;

    }


    container.innerHTML =
        levels.map(level => {

            let youtube = "";

            if (level.youtube_url) {

                youtube = `

                    <a
                        href="${escapeHTML(
                            level.youtube_url
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        YouTube Preview
                    </a>

                `;

            }


            return `

                <div class="level">

                    <div class="rank">
                        #${escapeHTML(
                            level.position
                        )}
                    </div>

                    <div class="level-info">

                        <h3>
                            ${escapeHTML(
                                level.level_name
                            )}
                        </h3>

                        <p>
                            ID:
                            ${escapeHTML(
                                level.level_id
                            )}
                        </p>

                        <p>
                            Creator:
                            ${escapeHTML(
                                level.creator_name
                            )}
                        </p>

                        <p>
                            Difficulty:
                            ${escapeHTML(
                                level.difficulty ||
                                "Unknown"
                            )}
                        </p>

                        ${youtube}

                    </div>

                </div>

            `;

        }).join("");

}


// ======================================================
// ADMIN LOGIN
// ======================================================

async function openAdminLogin() {

    if (await isAdmin()) {

        await showPage("admin");

        return;

    }


    await showPage("adminLogin");

}


// ======================================================
// ADMIN LOGIN
// ======================================================

async function adminLogin() {

    if (!supabaseClient) {

        message(
            "adminLoginMessage",
            "Supabase is not configured."
        );

        return;

    }


    const email =
        $("adminId")
            .value
            .trim();


    const password =
        $("adminPassword")
            .value;


    if (!email || !password) {

        message(
            "adminLoginMessage",
            "Enter email and password."
        );

        return;

    }


    message(
        "adminLoginMessage",
        "Logging in..."
    );


    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .signInWithPassword({

                email: email,

                password: password

            });


    if (error) {

        console.error(error);

        message(
            "adminLoginMessage",
            "Login failed."
        );

        return;

    }


    currentUser =
        data.user;


    await loadCurrentProfile();


    if (!(await isAdmin())) {

        await supabaseClient
            .auth
            .signOut();


        currentUser = null;

        currentProfile = null;


        message(
            "adminLoginMessage",
            "This account is not an administrator."
        );


        updateAuthUI();

        return;

    }


    updateAuthUI();


    await showPage("admin");

}


// ======================================================
// ADMIN LOGOUT
// ======================================================

async function adminLogout() {

    await playerLogout();

}


// ======================================================
// NORMALIZE POSITIONS
// ======================================================

async function normalizePositions() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("levels")
            .select("id, position")
            .order(
                "position",
                {
                    ascending: true
                }
            )
            .order(
                "id",
                {
                    ascending: true
                }
            );


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
            Number(
                data[i].position
            )
            !==
            wantedPosition
        ) {

            const {
                error: updateError
            } =
                await supabaseClient
                    .from("levels")
                    .update({

                        position:
                            wantedPosition

                    })
                    .eq(
                        "id",
                        data[i].id
                    );


            if (updateError) {

                console.error(
                    updateError
                );

                return false;

            }

        }

    }


    return true;

}


// ======================================================
// NEXT POSITION
// ======================================================

async function getNextPosition() {

    const {
        count,
        error
    } =
        await supabaseClient
            .from("levels")
            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            );


    if (error) {

        console.error(error);

        return null;

    }


    return Number(count || 0) + 1;

}


// ======================================================
// SAVE / ADD LEVEL
// ======================================================

async function saveLevel() {

    if (!(await isAdmin())) {

        message(
            "addLevelMessage",
            "You do not have administrator access."
        );

        return;

    }


    const levelName =
        $("levelName")
            .value
            .trim();


    const levelId =
        $("levelId")
            .value
            .trim();


    const creatorName =
        $("creatorName")
            .value
            .trim();


    const difficulty =
        $("difficulty")
            .value
            .trim();


    const youtubeUrl =
        $("youtubeUrl")
            .value
            .trim();


    if (
        !levelName ||
        !levelId ||
        !creatorName ||
        !difficulty
    ) {

        message(
            "addLevelMessage",
            "Fill in all required fields."
        );

        return;

    }


    // EDIT

    if (editingLevelId !== null) {

        const {
            error
        } =
            await supabaseClient
                .from("levels")
                .update({

                    level_name:
                        levelName,

                    level_id:
                        levelId,

                    creator_name:
                        creatorName,

                    difficulty:
                        difficulty,

                    youtube_url:
                        youtubeUrl ||
                        null

                })
                .eq(
                    "id",
                    editingLevelId
                );


        if (error) {

            console.error(error);

            message(
                "addLevelMessage",
                "Could not update level."
            );

            return;

        }


        message(
            "addLevelMessage",
            "Level updated!",
            true
        );


        cancelEdit(false);

    }

    // ADD

    else {

        await normalizePositions();


        const position =
            await getNextPosition();


        if (position === null) {

            message(
                "addLevelMessage",
                "Could not calculate position."
            );

            return;

        }


        const {
            error
        } =
            await supabaseClient
                .from("levels")
                .insert({

                    level_name:
                        levelName,

                    level_id:
                        levelId,

                    creator_name:
                        creatorName,

                    difficulty:
                        difficulty,

                    position:
                        position,

                    youtube_url:
                        youtubeUrl ||
                        null

                });


        if (error) {

            console.error(error);

            message(
                "addLevelMessage",
                "Could not add level: " +
                error.message
            );

            return;

        }


        message(
            "addLevelMessage",
            `Level added as #${position}!`,
            true
        );


        clearLevelForm();

    }


    await normalizePositions();

    await loadLevels();

    await loadAdminLevels();

}


// ======================================================
// EDIT LEVEL
// ======================================================

async function startEditLevel(id) {

    if (!(await isAdmin())) return;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("levels")
            .select("*")
            .eq("id", id)
            .single();


    if (error || !data) {

        console.error(error);

        return;

    }


    editingLevelId =
        id;


    $("levelName").value =
        data.level_name || "";


    $("levelId").value =
        data.level_id || "";


    $("creatorName").value =
        data.creator_name || "";


    $("difficulty").value =
        data.difficulty || "";


    $("youtubeUrl").value =
        data.youtube_url || "";


    $("formTitle").textContent =
        `Edit Level #${data.position}`;


    $("saveLevelButton").textContent =
        "Save Changes";


    $("cancelEditButton")
        .classList
        .remove("hidden");


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ======================================================
// CANCEL EDIT
// ======================================================

function cancelEdit(clearMessage = true) {

    editingLevelId = null;


    clearLevelForm();


    $("formTitle").textContent =
        "Add Level";


    $("saveLevelButton").textContent =
        "Add Level";


    $("cancelEditButton")
        .classList
        .add("hidden");


    if (clearMessage) {

        $("addLevelMessage")
            .textContent = "";

    }

}


// ======================================================
// CLEAR FORM
// ======================================================

function clearLevelForm() {

    $("levelName").value = "";

    $("levelId").value = "";

    $("creatorName").value = "";

    $("difficulty").value = "";

    $("youtubeUrl").value = "";

}


// ======================================================
// DELETE LEVEL
// ======================================================

async function deleteLevel(id, levelName) {

    if (!(await isAdmin())) {

        alert(
            "You do not have administrator access."
        );

        return;

    }


    if (
        !confirm(
            `Delete "${levelName}"?`
        )
    ) {

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from("levels")
            .delete()
            .eq("id", id);


    if (error) {

        console.error(error);

        alert(
            "Could not delete level."
        );

        return;

    }


    await normalizePositions();

    await loadLevels();

    await loadAdminLevels();

}


// ======================================================
// ADMIN LEVELS
// ======================================================

async function loadAdminLevels() {

    const container =
        $("admin-levels-container");


    if (!container) return;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("levels")
            .select("*")
            .order(
                "position",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(error);

        container.innerHTML =
            "<p>Could not load levels.</p>";

        return;

    }


    if (!data.length) {

        container.innerHTML =
            "<p>No levels yet.</p>";

        return;

    }


    container.innerHTML =
        data.map(level => {

            return `

                <div class="admin-level">

                    <h3>
                        #${escapeHTML(
                            level.position
                        )}
                        —
                        ${escapeHTML(
                            level.level_name
                        )}
                    </h3>

                    <p>
                        ID:
                        ${escapeHTML(
                            level.level_id
                        )}
                    </p>

                    <p>
                        Creator:
                        ${escapeHTML(
                            level.creator_name
                        )}
                    </p>

                    <p>
                        Difficulty:
                        ${escapeHTML(
                            level.difficulty
                        )}
                    </p>

                    <button
                        onclick="startEditLevel(
                            ${Number(level.id)}
                        )"
                    >
                        Edit
                    </button>

                    <button
                        onclick="deleteLevel(
                            ${Number(level.id)},
                            ${JSON.stringify(
                                level.level_name
                            )}
                        )"
                    >
                        Delete
                    </button>

                </div>

            `;

        }).join("");

}


// ======================================================
// ADMIN SUBMISSIONS
// ======================================================

async function loadAdminSubmissions() {

    const container =
        $("admin-submissions-container");


    if (!container) return;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("submissions")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(error);

        container.innerHTML =
            "<p>Could not load submissions.</p>";

        return;

    }


    if (!data.length) {

        container.innerHTML =
            "<p>No submissions.</p>";

        return;

    }


    container.innerHTML =
        data.map(submission => {

            return `

                <div class="admin-submission">

                    <h3>
                        ${escapeHTML(
                            submission.level_name
                        )}
                    </h3>

                    <p>
                        ID:
                        ${escapeHTML(
                            submission.level_id
                        )}
                    </p>

                    <p>
                        Creator:
                        ${escapeHTML(
                            submission.creator_name
                        )}
                    </p>

                    <p>
                        Difficulty:
                        ${escapeHTML(
                            submission.difficulty ||
                            "Unknown"
                        )}
                    </p>

                    <p>
                        Status:
                        <strong>
                            ${escapeHTML(
                                submission.status
                            )}
                        </strong>
                    </p>

                    ${
                        submission.youtube_url
                        ?
                        `<p>
                            <a
                                href="${escapeHTML(
                                    submission.youtube_url
                                )}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Open YouTube Video
                            </a>
                        </p>`
                        :
                        ""
                    }


                    <button
                        onclick="approveSubmission(
                            ${Number(submission.id)}
                        )"
                    >
                        Approve
                    </button>


                    <button
                        onclick="rejectSubmission(
                            ${Number(submission.id)}
                        )"
                    >
                        Reject
                    </button>


                    ${
                        submission.youtube_url
                        ?
                        `

                        <button
                            onclick="approveVideo(
                                ${Number(submission.id)}
                            )"
                        >
                            Approve Video
                        </button>

                        <button
                            onclick="rejectVideo(
                                ${Number(submission.id)}
                            )"
                        >
                            Reject Video
                        </button>

                        `
                        :
                        ""
                    }


                    <button
                        onclick="deleteSubmission(
                            ${Number(submission.id)}
                        )"
                    >
                        Delete
                    </button>

                </div>

            `;

        }).join("");

}


// ======================================================
// APPROVE SUBMISSION
// ======================================================

async function approveSubmission(id) {

    if (!(await isAdmin())) return;


    const {
        data: submission,
        error: getError
    } =
        await supabaseClient
            .from("submissions")
            .select("*")
            .eq("id", id)
            .single();


    if (getError || !submission) {

        alert(
            "Submission not found."
        );

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from("submissions")
            .update({

                status:
                    "approved"

            })
            .eq(
                "id",
                id
            );


    if (error) {

        console.error(error);

        alert(
            "Could not approve submission."
        );

        return;

    }


    // Check whether level already exists

    const {
        data: existing
    } =
        await supabaseClient
            .from("levels")
            .select("id")
            .eq(
                "level_id",
                submission.level_id
            )
            .maybeSingle();


    if (!existing) {

        const position =
            await getNextPosition();


        const {
            error: levelError
        } =
            await supabaseClient
                .from("levels")
                .insert({

                    level_name:
                        submission.level_name,

                    level_id:
                        submission.level_id,

                    creator_name:
                        submission.creator_name,

                    difficulty:
                        submission.difficulty ||
                        "Unknown",

                    position:
                        position,

                    youtube_url:
                        submission.youtube_url ||
                        null

                });


        if (levelError) {

            console.error(
                levelError
            );

            alert(
                "Submission approved, but level could not be added."
            );

            return;

        }

    }


    await normalizePositions();

    await loadAdminSubmissions();

    await loadAdminLevels();

    await loadLevels();

}


// ======================================================
// REJECT SUBMISSION
// ======================================================

async function rejectSubmission(id) {

    if (!(await isAdmin())) return;


    const reason =
        prompt(
            "Reason for rejection (optional):"
        );


    const {
        error
    } =
        await supabaseClient
            .from("submissions")
            .update({

                status:
                    "rejected",

                admin_message:
                    reason ||
                    null

            })
            .eq(
                "id",
                id
            );


    if (error) {

        console.error(error);

        alert(
            "Could not reject submission."
        );

        return;

    }


    await loadAdminSubmissions();

}


// ======================================================
// APPROVE VIDEO
// ======================================================

async function approveVideo(id) {

    if (!(await isAdmin())) return;


    const {
        error
    } =
        await supabaseClient
            .from("submissions")
            .update({

                video_status:
                    "approved",

                video_rejection_reason:
                    null

            })
            .eq(
                "id",
                id
            );


    if (error) {

        console.error(error);

        alert(
            "Could not approve video."
        );

        return;

    }


    await loadAdminSubmissions();

}


// ======================================================
// REJECT VIDEO
// ======================================================

async function rejectVideo(id) {

    if (!(await isAdmin())) return;


    const reason =
        prompt(
            "Reason for video rejection:"
        );


    const {
        error
    } =
        await supabaseClient
            .from("submissions")
            .update({

                video_status:
                    "rejected",

                video_rejection_reason:
                    reason ||
                    "Video did not pass review."

            })
            .eq(
                "id",
                id
            );


    if (error) {

        console.error(error);

        alert(
            "Could not reject video."
        );

        return;

    }


    await loadAdminSubmissions();

}


// ======================================================
// DELETE SUBMISSION
// ======================================================

async function deleteSubmission(id) {

    if (!(await isAdmin())) return;


    if (
        !confirm(
            "Delete this submission?"
        )
    ) {

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from("submissions")
            .delete()
            .eq(
                "id",
                id
            );


    if (error) {

        console.error(error);

        alert(
            "Could not delete submission."
        );

        return;

    }


    await loadAdminSubmissions();

}


// ======================================================
// SEARCH
// ======================================================

function setupSearch() {

    const input =
        $("searchInput");


    if (!input) return;


    input.addEventListener(
        "input",
        async function () {

            const query =
                input.value
                    .trim()
                    .toLowerCase();


            const {
                data,
                error
            } =
                await supabaseClient
                    .from("levels")
                    .select("*")
                    .order(
                        "position",
                        {
                            ascending: true
                        }
                    );


            if (error) {

                console.error(error);

                return;

            }


            const filtered =
                data.filter(level => {

                    return (

                        String(
                            level.level_name ||
                            ""
                        )
                        .toLowerCase()
                        .includes(query)

                        ||

                        String(
                            level.level_id ||
                            ""
                        )
                        .toLowerCase()
                        .includes(query)

                        ||

                        String(
                            level.creator_name ||
                            ""
                        )
                        .toLowerCase()
                        .includes(query)

                        ||

                        String(
                            level.difficulty ||
                            ""
                        )
                        .toLowerCase()
                        .includes(query)

                    );

                });


            renderLevels(filtered);

        }
    );

}


// ======================================================
// START
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        setupSearch();


        if (supabaseClient) {

            supabaseClient
                .auth
                .onAuthStateChange(
                    function (
                        event,
                        session
                    ) {

                        currentUser =
                            session?.user ||
                            null;

                        updateAuthUI();

                    }
                );


            await loadCurrentUser();

        }


        updateAuthUI();


        await showPage("list");

    }
);


// ======================================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// ======================================================

window.showPage = showPage;

window.playerLogin = playerLogin;

window.registerPlayer = registerPlayer;

window.playerLogout = playerLogout;

window.submitLevel = submitLevel;

window.openAdminLogin = openAdminLogin;

window.adminLogin = adminLogin;

window.adminLogout = adminLogout;

window.saveLevel = saveLevel;

window.startEditLevel = startEditLevel;

window.cancelEdit = cancelEdit;

window.deleteLevel = deleteLevel;

window.approveSubmission = approveSubmission;

window.rejectSubmission = rejectSubmission;

window.approveVideo = approveVideo;

window.rejectVideo = rejectVideo;

window.deleteSubmission = deleteSubmission;