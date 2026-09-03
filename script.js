// ==========================================
// SUPABASE
// ==========================================

// ОСТАВЬ ЗДЕСЬ СВОИ УЖЕ РАБОТАЮЩИЕ ДАННЫЕ SUPABASE

const SUPABASE_URL = "https://irxkvnromngihugetrwf.supabase.co";
const SUPABASE_KEY = "sb_publishable_R7MlVHvKXHn9n49mRPpo3g_-J2lwfWR";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ==========================================
// GLOBAL VARIABLES
// ==========================================

let editingLevelId = null;


// ==========================================
// PAGE NAVIGATION
// ==========================================

function hideAllPages() {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.add("hidden");
    });
}


function showPage(pageName) {

    hideAllPages();

    if (pageName === "list") {
        document
            .getElementById("listPage")
            .classList.remove("hidden");

        loadLevels();
        return;
    }

    if (pageName === "submit") {
        document
            .getElementById("submitPage")
            .classList.remove("hidden");

        return;
    }

    if (pageName === "playerAuth") {
        document
            .getElementById("playerAuthPage")
            .classList.remove("hidden");

        return;
    }

    if (pageName === "adminLogin") {
        document
            .getElementById("adminLoginPage")
            .classList.remove("hidden");

        return;
    }

    if (pageName === "admin") {
        document
            .getElementById("adminPage")
            .classList.remove("hidden");

        loadAdminLevels();
        return;
    }
}


// ==========================================
// PLAYER AUTH PAGE
// ==========================================

function openPlayerAuth() {

    showPage("playerAuth");

    showLoginForm();

    document.getElementById("playerAuthMessage").textContent = "";
}


function showLoginForm() {

    document
        .getElementById("playerLoginForm")
        .classList.remove("hidden");

    document
        .getElementById("playerRegisterForm")
        .classList.add("hidden");

    document.getElementById("playerAuthMessage").textContent = "";
}


function showRegisterForm() {

    document
        .getElementById("playerLoginForm")
        .classList.add("hidden");

    document
        .getElementById("playerRegisterForm")
        .classList.remove("hidden");

    document.getElementById("playerAuthMessage").textContent = "";
}


// ==========================================
// PLAYER REGISTER
// ==========================================

async function playerRegister() {

    const username =
        document.getElementById("registerUsername")
            .value
            .trim();

    const email =
        document.getElementById("registerEmail")
            .value
            .trim();

    const password =
        document.getElementById("registerPassword")
            .value;

    const password2 =
        document.getElementById("registerPassword2")
            .value;

    const message =
        document.getElementById("playerAuthMessage");


    if (!username || !email || !password || !password2) {

        message.textContent =
            "Please fill in all fields.";

        return;
    }


    if (password !== password2) {

        message.textContent =
            "Passwords do not match.";

        return;
    }


    if (password.length < 6) {

        message.textContent =
            "Password must be at least 6 characters.";

        return;
    }


    message.textContent =
        "Creating account...";


    const { data, error } =
        await supabaseClient.auth.signUp({

            email: email,

            password: password,

            options: {
                data: {
                    username: username
                }
            }

        });


    if (error) {

        message.textContent =
            error.message;

        return;
    }


    if (!data.session) {

        message.textContent =
            "Account created! Check your email to confirm your account.";

        return;
    }


    message.textContent =
        "Account created successfully!";

    await updateAuthUI();

    showPage("list");
}


// ==========================================
// PLAYER LOGIN
// ==========================================

async function playerLogin() {

    const email =
        document.getElementById("playerLoginEmail")
            .value
            .trim();

    const password =
        document.getElementById("playerLoginPassword")
            .value;

    const message =
        document.getElementById("playerAuthMessage");


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

        message.textContent =
            error.message;

        return;
    }


    message.textContent =
        "Logged in successfully!";


    await updateAuthUI();

    showPage("list");
}


// ==========================================
// PLAYER LOGOUT
// ==========================================

async function playerLogout() {

    const { error } =
        await supabaseClient.auth.signOut();


    if (error) {

        alert(error.message);

        return;
    }


    editingLevelId = null;

    updateAuthUI();

    showPage("list");
}


// ==========================================
// ADMIN LOGIN
// ==========================================

function openAdminLogin() {

    showPage("adminLogin");

    document.getElementById("adminLoginMessage").textContent = "";
}


async function adminLogin() {

    const email =
        document.getElementById("adminEmail")
            .value
            .trim();

    const password =
        document.getElementById("adminPassword")
            .value;

    const message =
        document.getElementById("adminLoginMessage");


    if (!email || !password) {

        message.textContent =
            "Please enter email and password.";

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

        message.textContent =
            error.message;

        return;
    }


    const isAdmin =
        await checkIsAdmin();


    if (!isAdmin) {

        await supabaseClient.auth.signOut();

        message.textContent =
            "This account is not an administrator.";

        return;
    }


    message.textContent =
        "Admin login successful!";


    await updateAuthUI();

    showPage("admin");
}


// ==========================================
// ADMIN CHECK
// ==========================================

async function checkIsAdmin() {

    const { data: sessionData } =
        await supabaseClient.auth.getSession();


    if (!sessionData.session) {
        return false;
    }


    const { data, error } =
        await supabaseClient.rpc("is_admin");


    if (error) {

        console.error(
            "Admin check error:",
            error
        );

        return false;
    }


    return data === true;
}


// ==========================================
// AUTH UI
// ==========================================

async function updateAuthUI() {

    const { data } =
        await supabaseClient.auth.getSession();


    const session =
        data.session;


    const playerAuthButton =
        document.getElementById("playerAuthButton");

    const adminLoginButton =
        document.getElementById("adminLoginButton");

    const adminPanelButton =
        document.getElementById("adminPanelButton");

    const logoutButton =
        document.getElementById("playerLogoutButton");

    const currentUserLabel =
        document.getElementById("currentUserLabel");


    if (!session) {

        playerAuthButton.textContent =
            "Player Login";

        playerAuthButton.onclick =
            openPlayerAuth;


        adminLoginButton.classList.remove(
            "hidden"
        );

        adminPanelButton.classList.add(
            "hidden"
        );

        logoutButton.classList.add(
            "hidden"
        );

        currentUserLabel.textContent = "";

        return;
    }


    const user =
        session.user;


    let username =
        user.user_metadata?.username;


    if (!username) {

        const { data: profile } =
            await supabaseClient
                .from("profiles")
                .select("username")
                .eq("id", user.id)
                .maybeSingle();


        if (profile) {
            username = profile.username;
        }
    }


    if (!username) {
        username = user.email;
    }


    playerAuthButton.textContent =
        "Account";


    playerAuthButton.onclick =
        openAccountPage;


    logoutButton.classList.remove(
        "hidden"
    );


    currentUserLabel.textContent =
        `Logged in as: ${username}`;


    const isAdmin =
        await checkIsAdmin();


    if (isAdmin) {

        adminPanelButton.classList.remove(
            "hidden"
        );

    } else {

        adminPanelButton.classList.add(
            "hidden"
        );
    }


    adminLoginButton.classList.add(
        "hidden"
    );
}


// ==========================================
// ACCOUNT
// ==========================================

async function openAccountPage() {

    showPage("playerAuth");

    const loginForm =
        document.getElementById(
            "playerLoginForm"
        );

    const registerForm =
        document.getElementById(
            "playerRegisterForm"
        );

    loginForm.classList.add("hidden");
    registerForm.classList.add("hidden");


    const { data } =
        await supabaseClient.auth.getSession();


    if (!data.session) {

        showLoginForm();

        return;
    }


    const user =
        data.session.user;


    let username =
        user.user_metadata?.username ||
        user.email;


    const { data: profile } =
        await supabaseClient
            .from("profiles")
            .select("username, role")
            .eq("id", user.id)
            .maybeSingle();


    if (profile?.username) {
        username = profile.username;
    }


    const container =
        document.getElementById("playerAuthPage");


    container.innerHTML = `

        <div class="card small-card">

            <h2>Account</h2>

            <p>
                <strong>Username:</strong>
                ${escapeHtml(username)}
            </p>

            <p>
                <strong>Email:</strong>
                ${escapeHtml(user.email || "")}
            </p>

            <p>
                <strong>Role:</strong>
                ${profile?.role === "admin" ? "Admin" : "Player"}
            </p>

            <button
                class="secondary"
                onclick="restorePlayerAuthPage()"
            >
                Back
            </button>

        </div>

    `;
}


// Rebuilds the normal player auth HTML after opening Account.
function restorePlayerAuthPage() {

    location.reload();
}


// ==========================================
// ADMIN PANEL
// ==========================================

async function toggleAdminPanel() {

    const isAdmin =
        await checkIsAdmin();


    if (!isAdmin) {

        alert(
            "You do not have administrator access."
        );

        return;
    }


    const adminPage =
        document.getElementById("adminPage");


    if (
        adminPage.classList.contains(
            "hidden"
        )
    ) {

        showPage("admin");

    } else {

        showPage("list");
    }
}


// ==========================================
// LOAD PUBLIC LEVELS
// ==========================================

async function loadLevels() {

    const container =
        document.getElementById(
            "levels-container"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "<div class='card'>Loading levels...</div>";


    const searchInput =
        document.getElementById(
            "searchInput"
        );


    const search =
        searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";


    const { data, error } =
        await supabaseClient
            .from("levels")
            .select("*")
            .order("position", {
                ascending: true
            });


    if (error) {

        container.innerHTML = `
            <div class="card">
                Failed to load levels.
            </div>
        `;

        console.error(error);

        return;
    }


    let levels =
        data || [];


    if (search) {

        levels =
            levels.filter(level => {

                return (

                    String(
                        level.level_name || ""
                    )
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(
                        level.level_id || ""
                    )
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(
                        level.creator_name || ""
                    )
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(
                        level.difficulty || ""
                    )
                        .toLowerCase()
                        .includes(search)

                );

            });
    }


    if (levels.length === 0) {

        container.innerHTML = `
            <div class="card">
                No levels found.
            </div>
        `;

        return;
    }


    container.innerHTML =
        levels.map(level => {

            const position =
                Number(level.position);


            let rankClass = "";

            if (position === 1) {
                rankClass = "rank-1";
            }

            if (position === 2) {
                rankClass = "rank-2";
            }

            if (position === 3) {
                rankClass = "rank-3";
            }


            const youtube =
                level.youtube_url
                    ? `
                        <p>
                            <a
                                href="${escapeAttribute(level.youtube_url)}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                ▶ YouTube Preview
                            </a>
                        </p>
                    `
                    : "";


            return `

                <div class="level ${rankClass}">

                    <div class="rank">
                        #${position}
                    </div>

                    <div class="level-info">

                        <h3>
                            ${escapeHtml(
                                level.level_name
                            )}
                        </h3>

                        <p>
                            <strong>Level ID:</strong>
                            ${escapeHtml(
                                level.level_id
                            )}
                        </p>

                        <p>
                            <strong>Creator:</strong>
                            ${escapeHtml(
                                level.creator_name
                            )}
                        </p>

                        ${
                            level.difficulty
                                ? `
                                    <p>
                                        <strong>Difficulty:</strong>
                                        ${escapeHtml(
                                            level.difficulty
                                        )}
                                    </p>
                                `
                                : ""
                        }

                        ${youtube}

                    </div>

                </div>

            `;

        }).join("");
}


// ==========================================
// ADMIN LEVELS
// ==========================================

async function loadAdminLevels() {

    const container =
        document.getElementById(
            "admin-levels-container"
        );


    if (!container) {
        return;
    }


    const isAdmin =
        await checkIsAdmin();


    if (!isAdmin) {

        container.innerHTML = `
            <p>
                Administrator access required.
            </p>
        `;

        return;
    }


    container.innerHTML =
        "<p>Loading...</p>";


    const { data, error } =
        await supabaseClient
            .from("levels")
            .select("*")
            .order("position", {
                ascending: true
            });


    if (error) {

        container.innerHTML =
            "<p>Failed to load levels.</p>";

        console.error(error);

        return;
    }


    const levels =
        data || [];


    if (levels.length === 0) {

        container.innerHTML =
            "<p>No levels yet.</p>";

        return;
    }


    container.innerHTML =
        levels.map(level => {

            return `

                <div class="admin-level">

                    <div class="admin-level-info">

                        <strong>
                            #${level.position}
                            —
                            ${escapeHtml(
                                level.level_name
                            )}
                        </strong>

                        <span>
                            ID:
                            ${escapeHtml(
                                level.level_id
                            )}
                            |
                            Creator:
                            ${escapeHtml(
                                level.creator_name
                            )}
                            ${
                                level.difficulty
                                    ? `
                                        |
                                        Difficulty:
                                        ${escapeHtml(
                                            level.difficulty
                                        )}
                                    `
                                    : ""
                            }
                        </span>

                    </div>


                    <div class="admin-actions">

                        <button
                            class="edit-button"
                            onclick="startEditLevel(${level.id})"
                        >
                            Edit
                        </button>

                        <button
                            class="delete-button"
                            onclick="deleteLevel(${level.id})"
                        >
                            Delete
                        </button>

                    </div>

                </div>

            `;

        }).join("");
}


// ==========================================
// SAVE / ADD / EDIT LEVEL
// ==========================================

async function saveLevel() {

    const isAdmin =
        await checkIsAdmin();


    if (!isAdmin) {

        alert(
            "You do not have administrator access."
        );

        return;
    }


    const levelName =
        document.getElementById(
            "levelName"
        ).value.trim();


    const levelId =
        document.getElementById(
            "levelId"
        ).value.trim();


    const creatorName =
        document.getElementById(
            "creatorName"
        ).value.trim();


    const difficulty =
        document.getElementById(
            "difficulty"
        ).value.trim();


    const youtubeUrl =
        document.getElementById(
            "youtubeUrl"
        ).value.trim();


    const message =
        document.getElementById(
            "addLevelMessage"
        );


    if (!levelName) {

        message.textContent =
            "Level Name is required.";

        return;
    }


    if (!levelId) {

        message.textContent =
            "Level ID is required. Use unknown if necessary.";

        return;
    }


    if (!creatorName) {

        message.textContent =
            "Creator Name is required.";

        return;
    }


    message.textContent =
        "Saving...";


    // ======================================
    // EDIT EXISTING LEVEL
    // ======================================

    if (editingLevelId !== null) {

        const { error } =
            await supabaseClient
                .from("levels")
                .update({

                    level_name: levelName,

                    level_id: levelId,

                    creator_name: creatorName,

                    difficulty:
                        difficulty || "",

                    youtube_url:
                        youtubeUrl || null

                })
                .eq(
                    "id",
                    editingLevelId
                );


        if (error) {

            message.textContent =
                error.message;

            console.error(error);

            return;
        }


        message.textContent =
            "Level updated successfully!";


        editingLevelId = null;


        document.getElementById(
            "adminFormTitle"
        ).textContent =
            "Add Level";


        document.getElementById(
            "cancelEditButton"
        ).classList.add("hidden");


        clearAdminForm();


        await loadAdminLevels();

        await loadLevels();

        return;
    }


    // ======================================
    // ADD NEW LEVEL
    // ======================================

    const { data: existingLevels, error: loadError } =
        await supabaseClient
            .from("levels")
            .select("id, position")
            .order("position", {
                ascending: true
            });


    if (loadError) {

        message.textContent =
            loadError.message;

        return;
    }


    const levels =
        existingLevels || [];


    // First fix positions in case there
    // are gaps or duplicate positions.

    await normalizePositions();


    const nextPosition =
        levels.length + 1;


    const { error } =
        await supabaseClient
            .from("levels")
            .insert({

                level_name: levelName,

                level_id: levelId,

                creator_name: creatorName,

                difficulty:
                    difficulty || "",

                position:
                    nextPosition,

                youtube_url:
                    youtubeUrl || null

            });


    if (error) {

        message.textContent =
            error.message;

        console.error(error);

        return;
    }


    message.textContent =
        "Level added successfully!";


    clearAdminForm();


    await normalizePositions();

    await loadAdminLevels();

    await loadLevels();
}


// ==========================================
// EDIT LEVEL
// ==========================================

async function startEditLevel(id) {

    const isAdmin =
        await checkIsAdmin();


    if (!isAdmin) {

        alert(
            "You do not have administrator access."
        );

        return;
    }


    const { data: level, error } =
        await supabaseClient
            .from("levels")
            .select("*")
            .eq("id", id)
            .single();


    if (error || !level) {

        alert(
            "Failed to load level."
        );

        return;
    }


    editingLevelId =
        id;


    document.getElementById(
        "levelName"
    ).value =
        level.level_name || "";


    document.getElementById(
        "levelId"
    ).value =
        level.level_id || "";


    document.getElementById(
        "creatorName"
    ).value =
        level.creator_name || "";


    document.getElementById(
        "difficulty"
    ).value =
        level.difficulty || "";


    document.getElementById(
        "youtubeUrl"
    ).value =
        level.youtube_url || "";


    document.getElementById(
        "adminFormTitle"
    ).textContent =
        `Edit Level #${level.position}`;


    document.getElementById(
        "cancelEditButton"
    ).classList.remove("hidden");


    document.getElementById(
        "addLevelMessage"
    ).textContent =
        "Editing level...";


    document.getElementById(
        "levelName"
    ).focus();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ==========================================
// CANCEL EDIT
// ==========================================

function cancelEdit() {

    editingLevelId = null;

    clearAdminForm();


    document.getElementById(
        "adminFormTitle"
    ).textContent =
        "Add Level";


    document.getElementById(
        "cancelEditButton"
    ).classList.add("hidden");


    document.getElementById(
        "addLevelMessage"
    ).textContent = "";
}


// ==========================================
// CLEAR ADMIN FORM
// ==========================================

function clearAdminForm() {

    document.getElementById(
        "levelName"
    ).value = "";

    document.getElementById(
        "levelId"
    ).value = "";

    document.getElementById(
        "creatorName"
    ).value = "";

    document.getElementById(
        "difficulty"
    ).value = "";

    document.getElementById(
        "youtubeUrl"
    ).value = "";
}


// ==========================================
// DELETE LEVEL
// ==========================================

async function deleteLevel(id) {

    const isAdmin =
        await checkIsAdmin();


    if (!isAdmin) {

        alert(
            "You do not have administrator access."
        );

        return;
    }


    const confirmed =
        confirm(
            "Are you sure you want to delete this level?"
        );


    if (!confirmed) {
        return;
    }


    const { error } =
        await supabaseClient
            .from("levels")
            .delete()
            .eq("id", id);


    if (error) {

        alert(
            "Delete failed: " +
            error.message
        );

        console.error(error);

        return;
    }


    if (editingLevelId === id) {
        cancelEdit();
    }


    await normalizePositions();

    await loadAdminLevels();

    await loadLevels();
}


// ==========================================
// NORMALIZE POSITIONS
// ==========================================

async function normalizePositions() {

    const isAdmin =
        await checkIsAdmin();


    if (!isAdmin) {
        return;
    }


    const { data: levels, error } =
        await supabaseClient
            .from("levels")
            .select("id")
            .order("position", {
                ascending: true
            });


    if (error) {

        console.error(
            "Position loading error:",
            error
        );

        return;
    }


    for (
        let i = 0;
        i < levels.length;
        i++
    ) {

        const wantedPosition =
            i + 1;


        const { error: updateError } =
            await supabaseClient
                .from("levels")
                .update({
                    position:
                        wantedPosition
                })
                .eq(
                    "id",
                    levels[i].id
                );


        if (updateError) {

            console.error(
                "Position update error:",
                updateError
            );

        }
    }
}


// ==========================================
// SUBMIT LEVEL
// ==========================================

async function submitLevel() {

    const message =
        document.getElementById(
            "submitMessage"
        );


    const { data } =
        await supabaseClient.auth.getSession();


    if (!data.session) {

        message.textContent =
            "You need a player account to submit a level.";

        setTimeout(() => {
            openPlayerAuth();
        }, 700);

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


    const difficulty =
        document.getElementById(
            "submitDifficulty"
        ).value.trim();


    const youtubeUrl =
        document.getElementById(
            "submitYoutubeUrl"
        ).value.trim();


    if (!levelName) {

        message.textContent =
            "Level Name is required.";

        return;
    }


    if (!levelId) {

        message.textContent =
            "Level ID is required. Use unknown if necessary.";

        return;
    }


    if (!creatorName) {

        message.textContent =
            "Creator Name is required.";

        return;
    }


    message.textContent =
        "Submitting...";


    const { error } =
        await supabaseClient
            .from("submissions")
            .insert({

                user_id:
                    data.session.user.id,

                level_name:
                    levelName,

                level_id:
                    levelId,

                creator_name:
                    creatorName,

                difficulty:
                    difficulty || null,

                youtube_url:
                    youtubeUrl || null

            });


    if (error) {

        message.textContent =
            error.message;

        console.error(error);

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
        "submitDifficulty"
    ).value = "";

    document.getElementById(
        "submitYoutubeUrl"
    ).value = "";
}


// ==========================================
// HTML SAFETY
// ==========================================

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function escapeAttribute(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}


// ==========================================
// STARTUP
// ==========================================

async function initializeSite() {

    showPage("list");

    await updateAuthUI();


    supabaseClient.auth.onAuthStateChange(
        async () => {

            await updateAuthUI();

        }
    );
}


initializeSite();