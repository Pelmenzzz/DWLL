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
        playerAuth: "playerAuthPage",
        adminLogin: "adminLoginPage",
        admin: "adminPage"
    };

    const element = document.getElementById(pageMap[page]);

    if (element) {
        element.classList.remove("hidden");
    }

    if (page === "submit") {
        checkPlayerBeforeSubmit();
    }
}


// =====================================================
// HELPERS
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
// PLAYER AUTH
// =====================================================

function showRegisterForm() {
    document.getElementById("playerLoginForm")
        .classList.add("hidden");

    document.getElementById("playerRegisterForm")
        .classList.remove("hidden");

    document.getElementById("playerAuthTitle")
        .textContent = "Create Player Account";

    document.getElementById("playerAuthMessage")
        .textContent = "";
}

function showLoginForm() {
    document.getElementById("playerRegisterForm")
        .classList.add("hidden");

    document.getElementById("playerLoginForm")
        .classList.remove("hidden");

    document.getElementById("playerAuthTitle")
        .textContent = "Player Login";

    document.getElementById("playerAuthMessage")
        .textContent = "";
}

async function playerRegister() {

    const message =
        document.getElementById("playerAuthMessage");

    if (!supabaseClient) {
        message.textContent =
            "Supabase is not connected.";

        return;
    }

    const username =
        document.getElementById("registerUsername")
            .value.trim();

    const email =
        document.getElementById("registerEmail")
            .value.trim();

    const password =
        document.getElementById("registerPassword")
            .value;

    const confirmPassword =
        document.getElementById("registerPasswordConfirm")
            .value;

    if (!username || !email || !password || !confirmPassword) {
        message.textContent =
            "Please fill in all fields.";

        return;
    }

    if (password !== confirmPassword) {
        message.textContent =
            "Passwords do not match.";

        return;
    }

    if (password.length < 6) {
        message.textContent =
            "Password must be at least 6 characters.";

        return;
    }

    message.textContent = "Creating account...";

    const { data, error } =
        await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username
                }
            }
        });

    if (error) {
        console.error(error);

        message.textContent =
            error.message || "Could not create account.";

        return;
    }

    if (!data.session) {
        message.textContent =
            "Account created! Check your email if confirmation is required.";

        return;
    }

    message.textContent =
        "Account created successfully!";

    await updateAuthUI();

    showPage("list");
}

async function playerLogin() {

    const message =
        document.getElementById("playerAuthMessage");

    if (!supabaseClient) {
        message.textContent =
            "Supabase is not connected.";

        return;
    }

    const email =
        document.getElementById("playerLoginEmail")
            .value.trim();

    const password =
        document.getElementById("playerLoginPassword")
            .value;

    if (!email || !password) {
        message.textContent =
            "Please enter your email and password.";

        return;
    }

    message.textContent = "Logging in...";

    const { error } =
        await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

    if (error) {
        console.error(error);

        message.textContent =
            "Login failed. Check your email and password.";

        return;
    }

    message.textContent = "";

    await updateAuthUI();

    showPage("list");
}

async function playerLogout() {

    if (!supabaseClient) {
        return;
    }

    await supabaseClient.auth.signOut();

    adminPanelOpen = false;
    editingLevelId = null;

    await updateAuthUI();

    showPage("list");
    await loadLevels();
}


// =====================================================
// ACCOUNT UI
// =====================================================

async function updateAuthUI() {

    if (!supabaseClient) {
        return;
    }

    const {
        data: sessionData
    } = await supabaseClient.auth.getSession();

    const playerButton =
        document.getElementById("playerAuthButton");

    const logoutButton =
        document.getElementById("playerLogoutButton");

    const userLabel =
        document.getElementById("currentUserLabel");

    const adminLoginButton =
        document.getElementById("adminLoginButton");

    const adminPanelButton =
        document.getElementById("adminPanelButton");

    if (!sessionData.session) {

        playerButton.textContent =
            "Player Login";

        playerButton.classList.remove("hidden");

        logoutButton.classList.add("hidden");

        userLabel.classList.add("hidden");

        adminLoginButton.classList.remove("hidden");

        adminPanelButton.classList.add("hidden");

        return;
    }

    const user =
        sessionData.session.user;

    let username =
        user.user_metadata?.username;

    if (!username) {

        const { data: profile } =
            await supabaseClient
                .from("profiles")
                .select("username")
                .eq("id", user.id)
                .maybeSingle();

        username =
            profile?.username || "Player";
    }

    playerButton.textContent =
        "Account";

    playerButton.classList.remove("hidden");

    logoutButton.classList.remove("hidden");

    userLabel.textContent =
        `Logged in as: ${username}`;

    userLabel.classList.remove("hidden");


    const {
        data: isAdmin
    } = await supabaseClient.rpc("is_admin");

    if (isAdmin === true) {

        adminLoginButton.classList.add("hidden");

        adminPanelButton.classList.remove("hidden");

    } else {

        adminLoginButton.classList.remove("hidden");

        adminPanelButton.classList.add("hidden");
    }
}


// =====================================================
// CHECK PLAYER BEFORE SUBMIT
// =====================================================

async function checkPlayerBeforeSubmit() {

    if (!supabaseClient) {
        return;
    }

    const {
        data
    } = await supabaseClient.auth.getSession();

    if (!data.session) {
        const message =
            document.getElementById("submitMessage");

        message.textContent =
            "Please log in with a player account before submitting.";
    }
}


// =====================================================
// DEMON LIST
// =====================================================

async function loadLevels() {

    const container =
        document.getElementById("levels-container");

    if (!container) {
        return;
    }

    if (!supabaseClient) {

        container.innerHTML =
            '<div class="card"><p>Supabase is not connected.</p></div>';

        return;
    }

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
            '<div class="card"><p>Could not load levels.</p></div>';

        return;
    }

    renderLevels(data || []);
}

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
                    ? `<a href="${escapeHTML(level.youtube_url)}"
                         target="_blank"
                         rel="noopener">
                         YouTube Preview
                       </a>`
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

async function openAdminLogin() {

    if (!supabaseClient) {
        showPage("adminLogin");
        return;
    }

    const {
        data
    } = await supabaseClient.auth.getSession();

    if (data.session) {

        const {
            data: isAdmin
        } = await supabaseClient.rpc("is_admin");

        if (isAdmin === true) {

            adminPanelOpen = true;

            document.getElementById("adminPanelButton")
                .classList.remove("hidden");

            showPage("admin");

            await loadAdminLevels();
            await loadSubmissions();

            return;
        }
    }

    showPage("adminLogin");
}

async function adminLogin() {

    const message =
        document.getElementById("adminLoginMessage");

    if (!supabaseClient) {

        message.textContent =
            "Supabase is not connected.";

        return;
    }

    const email =
        document.getElementById("adminId")
            .value.trim();

    const password =
        document.getElementById("adminPassword")
            .value;

    if (!email || !password) {

        message.textContent =
            "Please enter your email and password.";

        return;
    }

    message.textContent =
        "Logging in...";

    const {
        error
    } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {

        console.error(error);

        message.textContent =
            "Login failed. Check your email and password.";

        return;
    }

    const {
        data: isAdmin,
        error: adminError
    } = await supabaseClient.rpc("is_admin");

    if (adminError || isAdmin !== true) {

        await supabaseClient.auth.signOut();

        message.textContent =
            "This account does not have administrator access.";

        return;
    }

    message.textContent = "";

    adminPanelOpen = true;

    document.getElementById("adminPanelButton")
        .classList.remove("hidden");

    showPage("admin");

    await updateAuthUI();
    await loadAdminLevels();
    await loadSubmissions();
}

async function toggleAdminPanel() {

    if (!supabaseClient) {
        return;
    }

    const {
        data
    } = await supabaseClient.auth.getSession();

    if (!data.session) {

        adminPanelOpen = false;

        document.getElementById("adminPanelButton")
            .classList.add("hidden");

        showPage("adminLogin");

        return;
    }

    const {
        data: isAdmin
    } = await supabaseClient.rpc("is_admin");

    if (isAdmin !== true) {

        adminPanelOpen = false;

        document.getElementById("adminPanelButton")
            .classList.add("hidden");

        showPage("adminLogin");

        return;
    }

    adminPanelOpen =
        !adminPanelOpen;

    if (adminPanelOpen) {

        showPage("admin");

        await loadAdminLevels();
        await loadSubmissions();

    } else {

        showPage("list");

        await loadLevels();
    }
}


// =====================================================
// POSITION NUMBERING
// =====================================================

async function normalizePositions() {

    const {
        data,
        error
    } = await supabaseClient
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

    for (let i = 0; i < data.length; i++) {

        const wantedPosition =
            i + 1;

        if (
            Number(data[i].position) !==
            wantedPosition
        ) {

            const {
                error: updateError
            } = await supabaseClient
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

    const {
        count,
        error
    } = await supabaseClient
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
            .value.trim();

    const levelId =
        document.getElementById("levelId")
            .value.trim();

    const creatorName =
        document.getElementById("creatorName")
            .value.trim();

    const difficulty =
        document.getElementById("difficulty")
            .value.trim();

    const youtubeUrl =
        document.getElementById("youtubeUrl")
            .value.trim();

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

    const {
        data: sessionData
    } = await supabaseClient.auth.getSession();

    if (!sessionData.session) {

        message.textContent =
            "You are not logged in.";

        return;
    }

    const {
        data: isAdmin,
        error: adminError
    } = await supabaseClient.rpc("is_admin");

    if (adminError || isAdmin !== true) {

        message.textContent =
            "You do not have administrator access.";

        return;
    }

    message.textContent =
        editingLevelId !== null
            ? "Saving changes..."
            : "Adding level...";


    // EDIT

    if (editingLevelId !== null) {

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


    // ADD

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

async function startEditLevel(id) {

    if (!supabaseClient) {
        return;
    }

    const {
        data: isAdmin
    } = await supabaseClient.rpc("is_admin");

    if (isAdmin !== true) {
        return;
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("levels")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) {

        console.error(error);

        return;
    }

    editingLevelId = id;

    document.getElementById("levelName").value =
        data.level_name || "";

    document.getElementById("levelId").value =
        data.level_id || "";

    document.getElementById("creatorName").value =
        data.creator_name || "";

    document.getElementById("difficulty").value =
        data.difficulty || "";

    document.getElementById("youtubeUrl").value =
        data.youtube_url || "";

    document.getElementById("formTitle")
        .textContent = "Edit Level";

    document.getElementById("saveLevelButton")
        .textContent = "Save Changes";

    document.getElementById("cancelEditButton")
        .classList.remove("hidden");

    document.getElementById("addLevelMessage")
        .textContent = "Editing level...";
}

function clearLevelForm() {

    document.getElementById("levelName").value = "";
    document.getElementById("levelId").value = "";
    document.getElementById("creatorName").value = "";
    document.getElementById("difficulty").value = "";
    document.getElementById("youtubeUrl").value = "";
}

function cancelEdit(showMessage = true) {

    editingLevelId = null;

    document.getElementById("formTitle")
        .textContent = "Add Level";

    document.getElementById("saveLevelButton")
        .textContent = "Add Level";

    document.getElementById("cancelEditButton")
        .classList.add("hidden");

    clearLevelForm();

    if (showMessage) {

        document.getElementById("addLevelMessage")
            .textContent = "";
    }
}


// =====================================================
// DELETE LEVEL
// =====================================================

async function deleteLevel(id, levelName) {

    if (!supabaseClient) {
        return;
    }

    const {
        data: isAdmin
    } = await supabaseClient.rpc("is_admin");

    if (isAdmin !== true) {

        alert("You do not have administrator access.");

        return;
    }

    const confirmed =
        confirm(`Delete "${levelName}"?`);

    if (!confirmed) {
        return;
    }

    const {
        error
    } = await supabaseClient
        .from("levels")
        .delete()
        .eq("id", id);

    if (error) {

        console.error(error);

        alert("Could not delete the level.");

        return;
    }

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

    if (!container || !supabaseClient) {
        return;
    }

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
            "<p>Could not load admin levels.</p>";

        return;
    }

    if (!data || !data.length) {

        container.innerHTML =
            "<p>No levels yet.</p>";

        return;
    }

    container.innerHTML =
        data.map(level => `

            <div class="admin-level">

                <div class="admin-level-info">

                    <strong>
                        #${escapeHTML(level.position)}
                        —
                        ${escapeHTML(level.level_name)}
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
                        onclick="startEditLevel(${Number(level.id)})">
                        Edit
                    </button>

                    <button
                        class="delete-button"
                        onclick="deleteLevel(
                            ${Number(level.id)},
                            '${String(level.level_name)
                                .replaceAll("\\", "\\\\")
                                .replaceAll("'", "\\'")}'
                        )">
                        Delete
                    </button>

                </div>

            </div>

        `).join("");
}


// =====================================================
// SUBMIT LEVEL
// =====================================================

async function submitLevel() {

    const message =
        document.getElementById("submitMessage");

    if (!supabaseClient) {

        message.textContent =
            "Supabase is not connected.";

        return;
    }

    const {
        data: sessionData
    } = await supabaseClient.auth.getSession();

    if (!sessionData.session) {

        message.textContent =
            "Please log in with a player account before submitting.";

        return;
    }

    const levelName =
        document.getElementById("submitLevelName")
            .value.trim();

    const levelId =
        document.getElementById("submitLevelId")
            .value.trim();

    const creatorName =
        document.getElementById("submitCreatorName")
            .value.trim();

    const difficulty =
        document.getElementById("submitDifficulty")
            .value.trim();

    const youtubeUrl =
        document.getElementById("submitYoutube")
            .value.trim();

    if (!levelName || !levelId || !creatorName) {

        message.textContent =
            "Please fill in all required fields.";

        return;
    }

    message.textContent =
        "Submitting...";

    const {
        error
    } = await supabaseClient
        .from("submissions")
        .insert({
            user_id: sessionData.session.user.id,
            level_name: levelName,
            level_id: levelId,
            creator_name: creatorName,
            difficulty: difficulty || null,
            youtube_url: youtubeUrl || null
        });

    if (error) {

        console.error(error);

        message.textContent =
            "Could not submit the level.";

        return;
    }

    message.textContent =
        "Level submitted successfully!";

    document.getElementById("submitLevelName").value = "";
    document.getElementById("submitLevelId").value = "";
    document.getElementById("submitCreatorName").value = "";
    document.getElementById("submitDifficulty").value = "";
    document.getElementById("submitYoutube").value = "";
}


// =====================================================
// LOAD SUBMISSIONS
// =====================================================

async function loadSubmissions() {

    const container =
        document.getElementById(
            "submissions-container"
        );

    if (!container || !supabaseClient) {
        return;
    }

    const {
        data: isAdmin,
        error: adminError
    } = await supabaseClient.rpc("is_admin");

    if (adminError || isAdmin !== true) {

        container.innerHTML = "";

        return;
    }

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
            "<p>Could not load submissions.</p>";

        return;
    }

    if (!data || !data.length) {

        container.innerHTML =
            "<p>No submissions yet.</p>";

        return;
    }

    container.innerHTML =
        data.map(submission => {

            const youtube =
                submission.youtube_url
                    ? `<a href="${escapeHTML(submission.youtube_url)}"
                         target="_blank"
                         rel="noopener">
                         YouTube Preview
                       </a>`
                    : "";

            const status =
                submission.status || "pending";

            const buttons =
                status === "pending"
                    ? `
                        <button
                            class="approve-button"
                            onclick="approveSubmission(${Number(submission.id)})">
                            Approve
                        </button>

                        <button
                            class="reject-button"
                            onclick="rejectSubmission(${Number(submission.id)})">
                            Reject
                        </button>
                      `
                    : "";

            return `
                <div class="submission">

                    <div class="submission-info">

                        <strong>
                            ${escapeHTML(submission.level_name)}
                        </strong>

                        <span>
                            ID:
                            ${escapeHTML(submission.level_id)}
                        </span>

                        <span>
                            Creator:
                            ${escapeHTML(submission.creator_name)}
                        </span>

                        <span>
                            Difficulty:
                            ${escapeHTML(
                                submission.difficulty || "Not specified"
                            )}
                        </span>

                        ${youtube}

                        <span class="status ${escapeHTML(status)}">
                            ${escapeHTML(
                                status.charAt(0).toUpperCase() +
                                status.slice(1)
                            )}
                        </span>

                    </div>

                    <div class="submission-actions">
                        ${buttons}
                    </div>

                </div>
            `;

        }).join("");
}


// =====================================================
// APPROVE SUBMISSION
// =====================================================

async function approveSubmission(id) {

    if (!supabaseClient) {
        return;
    }

    const {
        data: isAdmin
    } = await supabaseClient.rpc("is_admin");

    if (isAdmin !== true) {

        alert("You do not have administrator access.");

        return;
    }

    const confirmed =
        confirm(
            "Approve this submission and add it to the Demon List?"
        );

    if (!confirmed) {
        return;
    }

    // Get submission

    const {
        data: submission,
        error: submissionError
    } = await supabaseClient
        .from("submissions")
        .select("*")
        .eq("id", id)
        .single();

    if (submissionError || !submission) {

        console.error(submissionError);

        alert("Could not find the submission.");

        return;
    }

    if (submission.status !== "pending") {

        alert("This submission has already been processed.");

        await loadSubmissions();

        return;
    }


    // Prepare positions

    await normalizePositions();

    const position =
        await getNextPosition();

    if (position === null) {

        alert("Could not calculate the next position.");

        return;
    }


    // Add to Demon List

    const {
        error: levelError
    } = await supabaseClient
        .from("levels")
        .insert({
            level_name: submission.level_name,
            level_id: submission.level_id,
            creator_name: submission.creator_name,
            difficulty: submission.difficulty || "Not specified",
            position: position,
            youtube_url: submission.youtube_url || null
        });

    if (levelError) {

        console.error(levelError);

        alert(
            "Could not add the level to the Demon List."
        );

        return;
    }


    // Mark submission approved

    const {
        error: updateError
    } = await supabaseClient
        .from("submissions")
        .update({
            status: "approved"
        })
        .eq("id", id);

    if (updateError) {

        console.error(updateError);

        alert(
            "The level was added, but the submission status could not be updated."
        );

        return;
    }

    alert(
        `Submission approved! The level is now #${position}.`
    );

    await loadLevels();
    await loadAdminLevels();
    await loadSubmissions();
}


// =====================================================
// REJECT SUBMISSION
// =====================================================

async function rejectSubmission(id) {

    if (!supabaseClient) {
        return;
    }

    const {
        data: isAdmin
    } = await supabaseClient.rpc("is_admin");

    if (isAdmin !== true) {

        alert("You do not have administrator access.");

        return;
    }

    const confirmed =
        confirm(
            "Reject this level submission?"
        );

    if (!confirmed) {
        return;
    }

    const {
        error
    } = await supabaseClient
        .from("submissions")
        .update({
            status: "rejected"
        })
        .eq("id", id)
        .eq("status", "pending");

    if (error) {

        console.error(error);

        alert(
            "Could not reject the submission."
        );

        return;
    }

    await loadSubmissions();
}


// =====================================================
// LOGOUT
// =====================================================

async function adminLogout() {

    if (!supabaseClient) {
        return;
    }

    await supabaseClient.auth.signOut();

    adminPanelOpen = false;
    editingLevelId = null;

    await updateAuthUI();

    showPage("list");

    await loadLevels();
}


// =====================================================
// SEARCH
// =====================================================

document.getElementById("searchInput")
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
// RESTORE SESSION
// =====================================================

async function checkAdminSession() {

    if (!supabaseClient) {

        showPage("list");

        return;
    }

    const {
        data
    } = await supabaseClient.auth.getSession();

    if (!data.session) {

        showPage("list");

        return;
    }

    const {
        data: isAdmin
    } = await supabaseClient.rpc("is_admin");

    if (isAdmin === true) {

        document.getElementById("adminPanelButton")
            .classList.remove("hidden");

    } else {

        document.getElementById("adminPanelButton")
            .classList.add("hidden");
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

        await updateAuthUI();

        await loadLevels();

    }
);