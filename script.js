// ==========================================
// DASH WORLD DEMON LIST — script.js
// ==========================================

// ---------- SUPABASE CONFIG ----------

const SUPABASE_URL = "https://irxkvnromngihugetrwf.supabase.co";
const SUPABASE_KEY = "sb_publishable_R7MlVHvKXHn9n49mRPpo3g_-J2lwfWR";

let supabaseClient = null;

if (
    SUPABASE_URL &&
    SUPABASE_KEY &&
    !SUPABASE_URL.includes("PASTE_") &&
    !SUPABASE_KEY.includes("PASTE_")
) {
    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );
} else {
    console.warn("Supabase is not configured.");
}


// ==========================================
// GLOBAL VARIABLES
// ==========================================

let currentUser = null;
let currentProfile = null;
let editingLevelId = null;


// ==========================================
// HELPERS
// ==========================================

function $(id) {
    return document.getElementById(id);
}

function escapeHTML(value) {
    if (value === null || value === undefined) return "";

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showMessage(id, message, success = false) {
    const element = $(id);

    if (!element) return;

    element.textContent = message;
    element.style.color = success ? "#6cff9b" : "#ff7373";
}

function clearMessage(id) {
    const element = $(id);

    if (element) {
        element.textContent = "";
    }
}


// ==========================================
// PAGE NAVIGATION
// ==========================================

function showPage(page) {
    document.querySelectorAll(".page").forEach((element) => {
        element.classList.add("hidden");
    });

    const pageMap = {
        list: "listPage",
        submit: "submitPage",
        login: "loginPage",
        register: "registerPage",
        profile: "profilePage",
        adminLogin: "adminLoginPage",
        admin: "adminPage"
    };

    const pageId = pageMap[page];

    if (!pageId) return;

    const target = $(pageId);

    if (!target) return;

    // Submit requires login
    if (page === "submit" && !currentUser) {
        showPage("login");
        return;
    }

    // Profile requires login
    if (page === "profile" && !currentUser) {
        showPage("login");
        return;
    }

    // Admin page requires admin
    if (page === "admin") {
        if (!currentUser || !isAdmin()) {
            showPage("adminLogin");
            return;
        }
    }

    target.classList.remove("hidden");

    if (page === "list") {
        loadLevels();
    }

    if (page === "profile") {
        loadProfile();
        loadMySubmissions();
    }

    if (page === "admin") {
        loadAdminSubmissions();
        loadAdminLevels();
    }
}


// ==========================================
// AUTH UI
// ==========================================

function updateAuthUI() {
    const loginButton = $("loginButton");
    const registerButton = $("registerButton");
    const profileButton = $("profileButton");
    const logoutButton = $("logoutButton");
    const adminPanelButton = $("adminPanelButton");

    if (currentUser) {
        if (loginButton) loginButton.classList.add("hidden");
        if (registerButton) registerButton.classList.add("hidden");

        if (profileButton) profileButton.classList.remove("hidden");
        if (logoutButton) logoutButton.classList.remove("hidden");

        if (currentProfile && currentProfile.role === "admin") {
            if (adminPanelButton) {
                adminPanelButton.classList.remove("hidden");
            }
        } else {
            if (adminPanelButton) {
                adminPanelButton.classList.add("hidden");
            }
        }
    } else {
        if (loginButton) loginButton.classList.remove("hidden");
        if (registerButton) registerButton.classList.remove("hidden");

        if (profileButton) profileButton.classList.add("hidden");
        if (logoutButton) logoutButton.classList.add("hidden");
        if (adminPanelButton) adminPanelButton.classList.add("hidden");
    }
}


// ==========================================
// LOAD CURRENT USER
// ==========================================

async function loadCurrentUser() {
    if (!supabaseClient) return;

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error) {
        console.error(error);
        return;
    }

    currentUser = user || null;

    if (currentUser) {
        await loadCurrentProfile();
    } else {
        currentProfile = null;
    }

    updateAuthUI();
}


// ==========================================
// LOAD PROFILE
// ==========================================

async function loadCurrentProfile() {
    if (!supabaseClient || !currentUser) {
        currentProfile = null;
        return;
    }

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

    if (error) {
        console.error("Profile error:", error);
        currentProfile = null;
        return;
    }

    currentProfile = data || null;
}

function isAdmin() {
    return (
        currentProfile &&
        currentProfile.role === "admin"
    );
}


// ==========================================
// PLAYER LOGIN
// ==========================================

async function playerLogin() {
    if (!supabaseClient) {
        showMessage(
            "loginMessage",
            "Supabase is not configured."
        );
        return;
    }

    const email = $("loginEmail").value.trim();
    const password = $("loginPassword").value;

    clearMessage("loginMessage");

    if (!email || !password) {
        showMessage(
            "loginMessage",
            "Enter your email and password."
        );
        return;
    }

    const {
        data,
        error
    } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        showMessage(
            "loginMessage",
            error.message
        );
        return;
    }

    currentUser = data.user;

    await loadCurrentProfile();

    updateAuthUI();

    showMessage(
        "loginMessage",
        "Login successful!",
        true
    );

    setTimeout(() => {
        showPage("list");
    }, 700);
}


// ==========================================
// PLAYER REGISTRATION
// ==========================================

async function registerPlayer() {
    if (!supabaseClient) {
        showMessage(
            "registerMessage",
            "Supabase is not configured."
        );
        return;
    }

    const username = $("registerUsername").value.trim();
    const email = $("registerEmail").value.trim();
    const password = $("registerPassword").value;

    clearMessage("registerMessage");

    if (!username || !email || !password) {
        showMessage(
            "registerMessage",
            "Fill in all fields."
        );
        return;
    }

    if (password.length < 6) {
        showMessage(
            "registerMessage",
            "Password must be at least 6 characters."
        );
        return;
    }

    const {
        data,
        error
    } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                username: username
            }
        }
    });

    if (error) {
        showMessage(
            "registerMessage",
            error.message
        );
        return;
    }

    if (data.session) {
        currentUser = data.user;

        await loadCurrentProfile();

        updateAuthUI();

        showMessage(
            "registerMessage",
            "Account created!",
            true
        );

        setTimeout(() => {
            showPage("list");
        }, 700);
    } else {
        showMessage(
            "registerMessage",
            "Account created! Check your email to confirm your account.",
            true
        );
    }
}


// ==========================================
// PLAYER LOGOUT
// ==========================================

async function playerLogout() {
    if (!supabaseClient) return;

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error(error);
        return;
    }

    currentUser = null;
    currentProfile = null;

    updateAuthUI();

    showPage("list");
}


// ==========================================
// PROFILE
// ==========================================

async function loadProfile() {
    if (!currentUser) {
        showPage("login");
        return;
    }

    await loadCurrentProfile();

    if ($("profileUsername")) {
        $("profileUsername").textContent =
            currentProfile?.username || "Player";
    }

    if ($("profileEmail")) {
        $("profileEmail").textContent =
            currentUser.email || "";
    }

    if ($("profileRole")) {
        $("profileRole").textContent =
            currentProfile?.role || "player";
    }

    updateAuthUI();
}


// ==========================================
// PLAYER SUBMISSIONS
// ==========================================

async function loadMySubmissions() {
    const container = $("my-submissions");

    if (!container || !currentUser || !supabaseClient) return;

    container.innerHTML = "Loading...";

    const {
        data,
        error
    } = await supabaseClient
        .from("submissions")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", {
            ascending: false
        });

    if (error) {
        console.error(error);

        container.innerHTML =
            "Failed to load submissions.";

        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML =
            "<p>You have no submissions yet.</p>";

        return;
    }

    container.innerHTML = data.map((submission) => {
        return `
            <div class="submission-card">
                <h3>${escapeHTML(submission.level_name)}</h3>

                <p>
                    <strong>ID:</strong>
                    ${escapeHTML(submission.level_id)}
                </p>

                <p>
                    <strong>Creator:</strong>
                    ${escapeHTML(submission.creator_name)}
                </p>

                <p>
                    <strong>Difficulty:</strong>
                    ${escapeHTML(submission.difficulty || "—")}
                </p>

                <p>
                    <strong>Status:</strong>
                    ${escapeHTML(submission.status)}
                </p>

                <p>
                    <strong>Video:</strong>
                    ${escapeHTML(submission.video_status || "pending")}
                </p>

                ${
                    submission.admin_message
                    ? `
                        <p>
                            <strong>Admin message:</strong>
                            ${escapeHTML(submission.admin_message)}
                        </p>
                    `
                    : ""
                }

                ${
                    submission.video_rejection_reason
                    ? `
                        <p>
                            <strong>Video reason:</strong>
                            ${escapeHTML(
                                submission.video_rejection_reason
                            )}
                        </p>
                    `
                    : ""
                }
            </div>
        `;
    }).join("");
}


// ==========================================
// SUBMIT LEVEL
// ==========================================

async function submitLevel() {
    if (!supabaseClient) {
        showMessage(
            "submitMessage",
            "Supabase is not configured."
        );
        return;
    }

    if (!currentUser) {
        showPage("login");
        return;
    }

    const levelName = $("submitLevelName").value.trim();
    const levelId = $("submitLevelId").value.trim();
    const creatorName = $("submitCreatorName").value.trim();
    const difficulty = $("submitDifficulty").value.trim();
    const youtubeUrl = $("submitYoutube").value.trim();

    clearMessage("submitMessage");

    if (
        !levelName ||
        !levelId ||
        !creatorName ||
        !difficulty
    ) {
        showMessage(
            "submitMessage",
            "Fill in all required fields."
        );
        return;
    }

    const {
        error
    } = await supabaseClient
        .from("submissions")
        .insert({
            user_id: currentUser.id,
            level_name: levelName,
            level_id: levelId,
            creator_name: creatorName,
            difficulty: difficulty,
            youtube_url: youtubeUrl || null,
            status: "pending",
            video_status: youtubeUrl
                ? "pending"
                : "rejected"
        });

    if (error) {
        console.error(error);

        showMessage(
            "submitMessage",
            error.message
        );

        return;
    }

    showMessage(
        "submitMessage",
        "Level submitted successfully!",
        true
    );

    $("submitLevelName").value = "";
    $("submitLevelId").value = "";
    $("submitCreatorName").value = "";
    $("submitDifficulty").value = "";
    $("submitYoutube").value = "";
}


// ==========================================
// LOAD LEVELS
// ==========================================

async function loadLevels() {
    const container = $("levels-container");

    if (!container || !supabaseClient) return;

    container.innerHTML = "Loading levels...";

    const {
        data,
        error
    } = await supabaseClient
        .from("levels")
        .select("*")
        .order("position", {
            ascending: true
        });

    if (error) {
        console.error(error);

        container.innerHTML =
            "Failed to load levels.";

        return;
    }

    renderLevels(data || []);
}


// ==========================================
// RENDER LEVELS
// ==========================================

function renderLevels(levels) {
    const container = $("levels-container");

    if (!container) return;

    if (!levels.length) {
        container.innerHTML =
            "<p>No levels have been added yet.</p>";

        return;
    }

    container.innerHTML = levels.map((level) => {
        const position = Number(level.position);

        let rankClass = "";

        if (position === 1) {
            rankClass = "rank-1";
        } else if (position === 2) {
            rankClass = "rank-2";
        } else if (position === 3) {
            rankClass = "rank-3";
        }

        return `
            <div class="level ${rankClass}">

                <div class="level-rank">
                    #${position}
                </div>

                <div class="level-info">

                    <h2>
                        ${escapeHTML(level.level_name)}
                    </h2>

                    <p>
                        ID:
                        ${escapeHTML(level.level_id)}
                    </p>

                    <p>
                        Creator:
                        ${escapeHTML(level.creator_name)}
                    </p>

                    <p>
                        Difficulty:
                        ${escapeHTML(level.difficulty)}
                    </p>

                </div>

                ${
                    level.youtube_url
                    ? `
                        <a
                            href="${escapeHTML(level.youtube_url)}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="youtube-button"
                        >
                            ▶ YouTube
                        </a>
                    `
                    : ""
                }

            </div>
        `;
    }).join("");
}


// ==========================================
// SEARCH
// ==========================================

function searchLevels() {
    const searchInput = $("searchInput");

    if (!searchInput) return;

    const query =
        searchInput.value
            .trim()
            .toLowerCase();

    document.querySelectorAll(
        "#levels-container .level"
    ).forEach((level) => {
        const text =
            level.textContent.toLowerCase();

        if (text.includes(query)) {
            level.style.display = "";
        } else {
            level.style.display = "none";
        }
    });
}


// ==========================================
// ADMIN LOGIN
// ==========================================

async function adminLogin() {
    if (!supabaseClient) {
        showMessage(
            "adminLoginMessage",
            "Supabase is not configured."
        );
        return;
    }

    const email = $("adminId").value.trim();
    const password = $("adminPassword").value;

    clearMessage("adminLoginMessage");

    if (!email || !password) {
        showMessage(
            "adminLoginMessage",
            "Enter admin email and password."
        );
        return;
    }

    const {
        data,
        error
    } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        showMessage(
            "adminLoginMessage",
            error.message
        );
        return;
    }

    currentUser = data.user;

    await loadCurrentProfile();

    if (!isAdmin()) {
        await supabaseClient.auth.signOut();

        currentUser = null;
        currentProfile = null;

        updateAuthUI();

        showMessage(
            "adminLoginMessage",
            "This account is not an admin."
        );

        return;
    }

    updateAuthUI();

    showMessage(
        "adminLoginMessage",
        "Admin login successful!",
        true
    );

    setTimeout(() => {
        showPage("admin");
    }, 700);
}


// ==========================================
// POSITION HELPERS
// ==========================================

async function getNextPosition() {
    const {
        data,
        error
    } = await supabaseClient
        .from("levels")
        .select("position")
        .order("position", {
            ascending: false
        })
        .limit(1);

    if (error) {
        console.error(error);
        return 1;
    }

    if (!data || data.length === 0) {
        return 1;
    }

    return Number(data[0].position) + 1;
}


// ==========================================
// ADMIN — ADD LEVEL
// ==========================================

async function addLevel() {
    if (!supabaseClient || !isAdmin()) return;

    const levelName = $("adminLevelName").value.trim();
    const levelId = $("adminLevelId").value.trim();
    const creatorName = $("adminCreatorName").value.trim();
    const difficulty = $("adminDifficulty").value.trim();
    const youtubeUrl = $("adminYoutube").value.trim();

    if (
        !levelName ||
        !levelId ||
        !creatorName ||
        !difficulty
    ) {
        alert("Fill in all required fields.");
        return;
    }

    const position = await getNextPosition();

    const {
        error
    } = await supabaseClient
        .from("levels")
        .insert({
            level_name: levelName,
            level_id: levelId,
            creator_name: creatorName,
            difficulty: difficulty,
            position: position,
            youtube_url: youtubeUrl || null
        });

    if (error) {
        console.error(error);
        alert(error.message);
        return;
    }

    $("adminLevelName").value = "";
    $("adminLevelId").value = "";
    $("adminCreatorName").value = "";
    $("adminDifficulty").value = "";
    $("adminYoutube").value = "";

    await loadAdminLevels();
    await loadLevels();

    alert("Level added!");
}


// ==========================================
// ADMIN — LOAD LEVELS
// ==========================================

async function loadAdminLevels() {
    const container = $("admin-levels-container");

    if (!container || !supabaseClient || !isAdmin()) {
        return;
    }

    container.innerHTML = "Loading...";

    const {
        data,
        error
    } = await supabaseClient
        .from("levels")
        .select("*")
        .order("position", {
            ascending: true
        });

    if (error) {
        console.error(error);
        container.innerHTML = error.message;
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML =
            "<p>No levels.</p>";
        return;
    }

    container.innerHTML = data.map((level) => {
        return `
            <div class="admin-level">

                <strong>
                    #${level.position}
                    ${escapeHTML(level.level_name)}
                </strong>

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

                <button
                    onclick="startEditLevel(${level.id})"
                >
                    Edit
                </button>

                <button
                    onclick="deleteLevel(${level.id})"
                >
                    Delete
                </button>

            </div>
        `;
    }).join("");
}


// ==========================================
// ADMIN — START EDIT
// ==========================================

async function startEditLevel(id) {
    if (!supabaseClient || !isAdmin()) return;

    const {
        data,
        error
    } = await supabaseClient
        .from("levels")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        alert(error.message);
        return;
    }

    editingLevelId = id;

    $("adminLevelName").value =
        data.level_name || "";

    $("adminLevelId").value =
        data.level_id || "";

    $("adminCreatorName").value =
        data.creator_name || "";

    $("adminDifficulty").value =
        data.difficulty || "";

    $("adminYoutube").value =
        data.youtube_url || "";

    const button = $("adminAddButton");

    if (button) {
        button.textContent = "Save Changes";
        button.onclick = saveEditedLevel;
    }
}


// ==========================================
// ADMIN — SAVE EDIT
// ==========================================

async function saveEditedLevel() {
    if (
        !supabaseClient ||
        !isAdmin() ||
        !editingLevelId
    ) {
        return;
    }

    const levelName = $("adminLevelName").value.trim();
    const levelId = $("adminLevelId").value.trim();
    const creatorName = $("adminCreatorName").value.trim();
    const difficulty = $("adminDifficulty").value.trim();
    const youtubeUrl = $("adminYoutube").value.trim();

    const {
        error
    } = await supabaseClient
        .from("levels")
        .update({
            level_name: levelName,
            level_id: levelId,
            creator_name: creatorName,
            difficulty: difficulty,
            youtube_url: youtubeUrl || null
        })
        .eq("id", editingLevelId);

    if (error) {
        alert(error.message);
        return;
    }

    editingLevelId = null;

    $("adminLevelName").value = "";
    $("adminLevelId").value = "";
    $("adminCreatorName").value = "";
    $("adminDifficulty").value = "";
    $("adminYoutube").value = "";

    const button = $("adminAddButton");

    if (button) {
        button.textContent = "Add Level";
        button.onclick = addLevel;
    }

    await loadAdminLevels();
    await loadLevels();

    alert("Level updated!");
}


// ==========================================
// ADMIN — DELETE LEVEL
// ==========================================

async function deleteLevel(id) {
    if (!supabaseClient || !isAdmin()) return;

    const confirmed =
        confirm("Delete this level?");

    if (!confirmed) return;

    const {
        error
    } = await supabaseClient
        .from("levels")
        .delete()
        .eq("id", id);

    if (error) {
        alert(error.message);
        return;
    }

    await normalizePositions();
    await loadAdminLevels();
    await loadLevels();
}


// ==========================================
// NORMALIZE POSITIONS
// ==========================================

async function normalizePositions() {
    const {
        data,
        error
    } = await supabaseClient
        .from("levels")
        .select("id")
        .order("position", {
            ascending: true
        });

    if (error) {
        console.error(error);
        return;
    }

    for (let i = 0; i < data.length; i++) {
        await supabaseClient
            .from("levels")
            .update({
                position: i + 1
            })
            .eq("id", data[i].id);
    }
}


// ==========================================
// ADMIN — SUBMISSIONS
// ==========================================

async function loadAdminSubmissions() {
    const container =
        $("admin-submissions-container");

    if (
        !container ||
        !supabaseClient ||
        !isAdmin()
    ) {
        return;
    }

    container.innerHTML = "Loading submissions...";

    const {
        data,
        error
    } = await supabaseClient
        .from("submissions")
        .select("*")
        .order("created_at", {
            ascending: false
        });

    if (error) {
        console.error(error);

        container.innerHTML =
            error.message;

        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML =
            "<p>No submissions.</p>";

        return;
    }

    container.innerHTML = data.map((submission) => {
        return `
            <div class="admin-submission">

                <h3>
                    ${escapeHTML(submission.level_name)}
                </h3>

                <p>
                    ID:
                    ${escapeHTML(submission.level_id)}
                </p>

                <p>
                    Creator:
                    ${escapeHTML(submission.creator_name)}
                </p>

                <p>
                    Difficulty:
                    ${escapeHTML(
                        submission.difficulty || "—"
                    )}
                </p>

                <p>
                    Status:
                    <strong>
                        ${escapeHTML(submission.status)}
                    </strong>
                </p>

                <p>
                    Video:
                    <strong>
                        ${escapeHTML(
                            submission.video_status || "pending"
                        )}
                    </strong>
                </p>

                ${
                    submission.youtube_url
                    ? `
                        <p>
                            <a
                                href="${escapeHTML(
                                    submission.youtube_url
                                )}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Open YouTube video
                            </a>
                        </p>
                    `
                    : ""
                }

                <div class="admin-actions">

                    <button
                        onclick="approveSubmission(${submission.id})"
                    >
                        Approve Level
                    </button>

                    <button
                        onclick="rejectSubmission(${submission.id})"
                    >
                        Reject Level
                    </button>

                    ${
                        submission.youtube_url
                        ? `
                            <button
                                onclick="approveVideo(${submission.id})"
                            >
                                Approve Video
                            </button>

                            <button
                                onclick="rejectVideo(${submission.id})"
                            >
                                Reject Video
                            </button>
                        `
                        : ""
                    }

                    <button
                        onclick="deleteSubmission(${submission.id})"
                    >
                        Delete
                    </button>

                </div>

            </div>
        `;
    }).join("");
}


// ==========================================
// ADMIN — APPROVE SUBMISSION
// ==========================================

async function approveSubmission(id) {
    if (!supabaseClient || !isAdmin()) return;

    const {
        data: submission,
        error: fetchError
    } = await supabaseClient
        .from("submissions")
        .select("*")
        .eq("id", id)
        .single();

    if (fetchError) {
        alert(fetchError.message);
        return;
    }

    const position = await getNextPosition();

    const {
        error: insertError
    } = await supabaseClient
        .from("levels")
        .insert({
            level_name: submission.level_name,
            level_id: submission.level_id,
            creator_name: submission.creator_name,
            difficulty: submission.difficulty || "Unknown",
            position: position,
            youtube_url: submission.youtube_url || null
        });

    if (insertError) {
        alert(insertError.message);
        return;
    }

    const {
        error: updateError
    } = await supabaseClient
        .from("submissions")
        .update({
            status: "approved"
        })
        .eq("id", id);

    if (updateError) {
        alert(updateError.message);
        return;
    }

    await loadAdminSubmissions();
    await loadAdminLevels();
    await loadLevels();

    alert("Submission approved!");
}


// ==========================================
// ADMIN — REJECT SUBMISSION
// ==========================================

async function rejectSubmission(id) {
    if (!supabaseClient || !isAdmin()) return;

    const message =
        prompt("Reason for rejection:");

    const {
        error
    } = await supabaseClient
        .from("submissions")
        .update({
            status: "rejected",
            admin_message: message || null
        })
        .eq("id", id);

    if (error) {
        alert(error.message);
        return;
    }

    await loadAdminSubmissions();

    alert("Submission rejected.");
}


// ==========================================
// ADMIN — APPROVE VIDEO
// ==========================================

async function approveVideo(id) {
    if (!supabaseClient || !isAdmin()) return;

    const {
        error
    } = await supabaseClient
        .from("submissions")
        .update({
            video_status: "approved",
            video_rejection_reason: null
        })
        .eq("id", id);

    if (error) {
        alert(error.message);
        return;
    }

    await loadAdminSubmissions();

    alert("Video approved!");
}


// ==========================================
// ADMIN — REJECT VIDEO
// ==========================================

async function rejectVideo(id) {
    if (!supabaseClient || !isAdmin()) return;

    const reason =
        prompt("Reason for video rejection:");

    const {
        error
    } = await supabaseClient
        .from("submissions")
        .update({
            video_status: "rejected",
            video_rejection_reason:
                reason || null
        })
        .eq("id", id);

    if (error) {
        alert(error.message);
        return;
    }

    await loadAdminSubmissions();

    alert("Video rejected.");
}


// ==========================================
// ADMIN — DELETE SUBMISSION
// ==========================================

async function deleteSubmission(id) {
    if (!supabaseClient || !isAdmin()) return;

    const confirmed =
        confirm("Delete this submission?");

    if (!confirmed) return;

    const {
        error
    } = await supabaseClient
        .from("submissions")
        .delete()
        .eq("id", id);

    if (error) {
        alert(error.message);
        return;
    }

    await loadAdminSubmissions();

    alert("Submission deleted.");
}


// ==========================================
// INITIALIZATION
// ==========================================

async function initializeApp() {
    if (!supabaseClient) {
        console.warn(
            "Supabase is not configured."
        );

        return;
    }

    await loadCurrentUser();

    updateAuthUI();

    showPage("list");
}


// ==========================================
// SUPABASE AUTH LISTENER
// ==========================================

if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange(
        async (event, session) => {

            currentUser =
                session?.user || null;

            if (currentUser) {
                await loadCurrentProfile();
            } else {
                currentProfile = null;
            }

            updateAuthUI();
        }
    );
}


// ==========================================
// SEARCH LISTENER
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const searchInput =
            $("searchInput");

        if (searchInput) {
            searchInput.addEventListener(
                "input",
                searchLevels
            );
        }

        initializeApp();
    }
);


// ==========================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// ==========================================

window.showPage = showPage;

window.playerLogin = playerLogin;
window.registerPlayer = registerPlayer;
window.playerLogout = playerLogout;

window.submitLevel = submitLevel;

window.adminLogin = adminLogin;

window.addLevel = addLevel;
window.startEditLevel = startEditLevel;
window.saveEditedLevel = saveEditedLevel;
window.deleteLevel = deleteLevel;

window.approveSubmission = approveSubmission;
window.rejectSubmission = rejectSubmission;

window.approveVideo = approveVideo;
window.rejectVideo = rejectVideo;

window.deleteSubmission = deleteSubmission;

window.searchLevels = searchLevels;