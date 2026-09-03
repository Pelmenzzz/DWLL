// ============================================================
// DASH WORLD DEMON LIST
// Main JavaScript
// ============================================================

// ------------------------------------------------------------
// SUPABASE
// ------------------------------------------------------------

const SUPABASE_URL = "https://irxkvnromngihugetrwf.supabase.co";
const SUPABASE_KEY = "sb_publishable_R7MlVHvKXHn9n49mRPpo3g_-J2lwfWR";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ------------------------------------------------------------
// GLOBAL STATE
// ------------------------------------------------------------

let currentUser = null;
let currentProfile = null;
let currentEditingLevelId = null;

const pageMap = {
    list: "page-list",
    submit: "page-submit",
    profile: "page-profile",
    adminLogin: "page-admin-login",
    admin: "page-admin"
};


// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

function escapeHTML(value) {
    if (value === null || value === undefined) return "";

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function showMessage(message, type = "info") {
    let box = document.getElementById("message-box");

    if (!box) {
        box = document.createElement("div");
        box.id = "message-box";

        box.style.position = "fixed";
        box.style.left = "50%";
        box.style.bottom = "25px";
        box.style.transform = "translateX(-50%)";
        box.style.zIndex = "99999";
        box.style.padding = "12px 18px";
        box.style.borderRadius = "10px";
        box.style.fontWeight = "700";
        box.style.maxWidth = "90%";
        box.style.textAlign = "center";
        box.style.boxShadow = "0 10px 30px rgba(0,0,0,.35)";

        document.body.appendChild(box);
    }

    box.textContent = message;

    if (type === "error") {
        box.style.background = "#7f1d1d";
        box.style.color = "#fff";
    } else if (type === "success") {
        box.style.background = "#166534";
        box.style.color = "#fff";
    } else {
        box.style.background = "#1e3a8a";
        box.style.color = "#fff";
    }

    box.style.display = "block";

    clearTimeout(box._timer);

    box._timer = setTimeout(() => {
        box.style.display = "none";
    }, 4000);
}


function getElement(id) {
    return document.getElementById(id);
}


// ------------------------------------------------------------
// PAGE NAVIGATION
// ------------------------------------------------------------

function showPage(pageName) {
    Object.values(pageMap).forEach(id => {
        const page = getElement(id);

        if (page) {
            page.style.display = "none";
        }
    });

    const targetId = pageMap[pageName];
    const target = getElement(targetId);

    if (target) {
        target.style.display = "";
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (pageName === "list") {
        loadLevels();
    }

    if (pageName === "profile") {
        loadProfile();
    }

    if (pageName === "admin") {
        checkAdminAccess();
    }
}


// ------------------------------------------------------------
// AUTH UI
// ------------------------------------------------------------

function updateAuthUI() {
    const loginButtons = document.querySelectorAll(".login-required");
    const logoutButtons = document.querySelectorAll(".logout-button");

    loginButtons.forEach(button => {
        button.style.display = currentUser ? "" : "none";
    });

    logoutButtons.forEach(button => {
        button.style.display = currentUser ? "" : "none";
    });

    const profileLinks = document.querySelectorAll(
        '[data-page="profile"], .profile-link'
    );

    profileLinks.forEach(link => {
        link.style.display = currentUser ? "" : "none";
    });

    const usernameElements = document.querySelectorAll(
        ".current-username, #current-username"
    );

    usernameElements.forEach(element => {
        element.textContent =
            currentProfile?.username ||
            currentUser?.email ||
            "Player";
    });
}


// ------------------------------------------------------------
// LOAD PROFILE
// ------------------------------------------------------------

async function loadProfile() {
    if (!currentUser) {
        showMessage("Сначала войди в аккаунт.", "error");
        showPage("list");
        return;
    }

    try {
        const { data: profile, error } = await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .maybeSingle();

        if (error) {
            console.error(error);
            showMessage("Не удалось загрузить профиль.", "error");
            return;
        }

        currentProfile = profile;

        const usernameElement = getElement("profile-username");
        const emailElement = getElement("profile-email");
        const roleElement = getElement("profile-role");

        if (usernameElement) {
            usernameElement.textContent =
                profile?.username || "Player";
        }

        if (emailElement) {
            emailElement.textContent =
                currentUser.email || "";
        }

        if (roleElement) {
            roleElement.textContent =
                profile?.role === "admin"
                    ? "Administrator"
                    : "Player";
        }

        await loadMySubmissions();

        updateAuthUI();

    } catch (error) {
        console.error(error);
        showMessage("Ошибка загрузки профиля.", "error");
    }
}


// ------------------------------------------------------------
// PLAYER SUBMISSIONS
// ------------------------------------------------------------

async function loadMySubmissions() {
    if (!currentUser) return;

    const container =
        getElement("my-submissions") ||
        getElement("profile-submissions");

    if (!container) return;

    container.innerHTML = "<p>Загрузка...</p>";

    const { data, error } = await supabaseClient
        .from("submissions")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        container.innerHTML =
            "<p>Не удалось загрузить отправленные уровни.</p>";
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML =
            "<p>Ты пока не отправлял уровни.</p>";
        return;
    }

    container.innerHTML = data.map(submission => {

        let statusText = "На проверке";
        let statusClass = "pending";

        if (submission.status === "approved") {
            statusText = "Одобрено";
            statusClass = "approved";
        }

        if (submission.status === "rejected") {
            statusText = "Отклонено";
            statusClass = "rejected";
        }

        let videoText = "";

        if (submission.youtube_url) {
            if (submission.video_status === "approved") {
                videoText =
                    '<span class="submission-video approved">Видео одобрено</span>';
            } else if (submission.video_status === "rejected") {
                videoText =
                    '<span class="submission-video rejected">Видео отклонено</span>';
            } else {
                videoText =
                    '<span class="submission-video pending">Видео на проверке</span>';
            }
        }

        const message = submission.admin_message
            ? `<div class="submission-admin-message">
                    <strong>Сообщение администратора:</strong>
                    ${escapeHTML(submission.admin_message)}
               </div>`
            : "";

        const rejectionReason = submission.video_rejection_reason
            ? `<div class="submission-admin-message">
                    <strong>Причина отклонения видео:</strong>
                    ${escapeHTML(submission.video_rejection_reason)}
               </div>`
            : "";

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

                ${
                    submission.difficulty
                        ? `<p><strong>Difficulty:</strong>
                           ${escapeHTML(submission.difficulty)}</p>`
                        : ""
                }

                <p>
                    <strong>Статус:</strong>
                    <span class="submission-status ${statusClass}">
                        ${statusText}
                    </span>
                </p>

                ${videoText}
                ${message}
                ${rejectionReason}
            </div>
        `;
    }).join("");
}


// ------------------------------------------------------------
// LOAD LEVELS
// ------------------------------------------------------------

async function loadLevels() {
    const container =
        getElement("levels-list") ||
        getElement("levels");

    if (!container) return;

    container.innerHTML =
        '<div class="loading">Loading levels...</div>';

    const { data, error } = await supabaseClient
        .from("levels")
        .select("*")
        .order("position", { ascending: true });

    if (error) {
        console.error(error);

        container.innerHTML =
            "<p>Не удалось загрузить уровни.</p>";

        return;
    }

    renderLevels(data || []);
}


// ------------------------------------------------------------
// RANK COLORS
// ------------------------------------------------------------

function getRankClass(position) {
    if (position === 1) return "rank-one";
    if (position === 2) return "rank-two";
    if (position === 3) return "rank-three";

    return "rank-normal";
}


function getRankColor(position) {
    if (position === 1) return "#ff3030";
    if (position === 2) return "#ff8a00";
    if (position === 3) return "#ffe600";

    return "#ffffff";
}


// ------------------------------------------------------------
// RENDER LEVELS
// ------------------------------------------------------------

function renderLevels(levels) {
    const container =
        getElement("levels-list") ||
        getElement("levels");

    if (!container) return;

    if (!levels.length) {
        container.innerHTML =
            "<p>Пока нет уровней.</p>";
        return;
    }

    container.innerHTML = levels.map(level => {

        const position = Number(level.position) || 0;
        const rankClass = getRankClass(position);
        const rankColor = getRankColor(position);

        const video = level.youtube_url
            ? `
                <a
                    href="${escapeHTML(level.youtube_url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="video-button"
                >
                    ▶ YouTube
                </a>
              `
            : "";

        return `
            <div
                class="level ${rankClass}"
                data-level-name="${escapeHTML(level.level_name).toLowerCase()}"
                data-level-id="${escapeHTML(level.level_id).toLowerCase()}"
            >

                <div
                    class="level-rank"
                    style="color:${rankColor}"
                >
                    #${position}
                </div>

                <div class="level-info">

                    <h2>
                        ${escapeHTML(level.level_name)}
                    </h2>

                    <p>
                        ID:
                        <strong>
                            ${escapeHTML(level.level_id)}
                        </strong>
                    </p>

                    <p>
                        Creator:
                        <strong>
                            ${escapeHTML(level.creator_name)}
                        </strong>
                    </p>

                    <p>
                        Difficulty:
                        <strong>
                            ${escapeHTML(level.difficulty || "Unknown")}
                        </strong>
                    </p>

                </div>

                <div class="level-actions">
                    ${video}
                </div>

            </div>
        `;
    }).join("");
}


// ------------------------------------------------------------
// SEARCH
// ------------------------------------------------------------

function setupSearch() {
    const searchInput =
        getElement("search-input") ||
        getElement("search");

    if (!searchInput) return;

    searchInput.addEventListener("input", () => {

        const query =
            searchInput.value
                .trim()
                .toLowerCase();

        const cards = document.querySelectorAll(".level");

        cards.forEach(card => {

            const name =
                card.dataset.levelName || "";

            const id =
                card.dataset.levelId || "";

            const visible =
                !query ||
                name.includes(query) ||
                id.includes(query);

            card.style.display =
                visible ? "" : "none";
        });
    });
}


// ------------------------------------------------------------
// LOGIN
// ------------------------------------------------------------

async function loginPlayer() {
    const email =
        getElement("login-email")?.value.trim();

    const password =
        getElement("login-password")?.value;

    if (!email || !password) {
        showMessage(
            "Введите email и пароль.",
            "error"
        );
        return;
    }

    const button =
        getElement("login-button");

    if (button) {
        button.disabled = true;
        button.textContent = "Вход...";
    }

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

    if (button) {
        button.disabled = false;
        button.textContent = "Login";
    }

    if (error) {
        console.error(error);

        showMessage(
            "Неверный email или пароль.",
            "error"
        );

        return;
    }

    currentUser = data.user;

    await loadCurrentProfile();

    showMessage(
        "Вы успешно вошли!",
        "success"
    );

    updateAuthUI();

    showPage("profile");
}


// ------------------------------------------------------------
// REGISTER
// ------------------------------------------------------------

async function registerPlayer() {
    const username =
        getElement("register-username")?.value.trim();

    const email =
        getElement("register-email")?.value.trim();

    const password =
        getElement("register-password")?.value;

    if (!username || !email || !password) {
        showMessage(
            "Заполните все поля.",
            "error"
        );
        return;
    }

    if (username.length < 3) {
        showMessage(
            "Ник должен содержать минимум 3 символа.",
            "error"
        );
        return;
    }

    if (password.length < 6) {
        showMessage(
            "Пароль должен содержать минимум 6 символов.",
            "error"
        );
        return;
    }

    const button =
        getElement("register-button");

    if (button) {
        button.disabled = true;
        button.textContent = "Создание...";
    }

    const { data, error } =
        await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username
                }
            }
        });

    if (button) {
        button.disabled = false;
        button.textContent = "Register";
    }

    if (error) {
        console.error(error);

        showMessage(
            error.message,
            "error"
        );

        return;
    }

    if (data.session) {
        currentUser = data.user;

        await loadCurrentProfile();

        showMessage(
            "Аккаунт создан!",
            "success"
        );

        updateAuthUI();
        showPage("profile");

    } else {
        showMessage(
            "Аккаунт создан! Проверь почту для подтверждения.",
            "success"
        );
    }
}


// ------------------------------------------------------------
// LOAD CURRENT PROFILE
// ------------------------------------------------------------

async function loadCurrentProfile() {
    if (!currentUser) return;

    const { data, error } =
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
}


// ------------------------------------------------------------
// LOGOUT
// ------------------------------------------------------------

async function logoutPlayer() {
    const { error } =
        await supabaseClient.auth.signOut();

    if (error) {
        console.error(error);

        showMessage(
            "Не удалось выйти.",
            "error"
        );

        return;
    }

    currentUser = null;
    currentProfile = null;

    updateAuthUI();

    showMessage(
        "Вы вышли из аккаунта.",
        "success"
    );

    showPage("list");
}


// ------------------------------------------------------------
// SUBMIT LEVEL
// ------------------------------------------------------------

async function submitLevel() {
    if (!currentUser) {
        showMessage(
            "Для отправки уровня нужно войти в аккаунт.",
            "error"
        );
        return;
    }

    const levelName =
        getElement("submit-level-name")?.value.trim();

    const levelId =
        getElement("submit-level-id")?.value.trim();

    const creatorName =
        getElement("submit-creator-name")?.value.trim();

    const difficulty =
        getElement("submit-difficulty")?.value.trim();

    const youtubeUrl =
        getElement("submit-youtube")?.value.trim();

    if (
        !levelName ||
        !levelId ||
        !creatorName ||
        !difficulty
    ) {
        showMessage(
            "Заполните все обязательные поля.",
            "error"
        );
        return;
    }

    const button =
        getElement("submit-level-button");

    if (button) {
        button.disabled = true;
        button.textContent = "Отправка...";
    }

    const { error } =
        await supabaseClient
            .from("submissions")
            .insert({
                user_id: currentUser.id,
                level_name: levelName,
                level_id: levelId,
                creator_name: creatorName,
                difficulty: difficulty,
                youtube_url: youtubeUrl || null,
                status: "pending",
                video_status:
                    youtubeUrl ? "pending" : "pending"
            });

    if (button) {
        button.disabled = false;
        button.textContent = "Submit Level";
    }

    if (error) {
        console.error(error);

        showMessage(
            "Ошибка отправки: " + error.message,
            "error"
        );

        return;
    }

    const form =
        getElement("submit-form");

    if (form) {
        form.reset();
    }

    showMessage(
        "Уровень отправлен на проверку!",
        "success"
    );

    showPage("profile");
}


// ------------------------------------------------------------
// ADMIN LOGIN
// ------------------------------------------------------------

async function adminLogin() {
    const email =
        getElement("admin-email")?.value.trim();

    const password =
        getElement("admin-password")?.value;

    if (!email || !password) {
        showMessage(
            "Введите email и пароль.",
            "error"
        );
        return;
    }

    const button =
        getElement("admin-login-button");

    if (button) {
        button.disabled = true;
        button.textContent = "Вход...";
    }

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

    if (button) {
        button.disabled = false;
        button.textContent = "Login";
    }

    if (error) {
        console.error(error);

        showMessage(
            "Неверные данные администратора.",
            "error"
        );

        return;
    }

    currentUser = data.user;

    await loadCurrentProfile();

    if (
        !currentProfile ||
        currentProfile.role !== "admin"
    ) {
        await supabaseClient.auth.signOut();

        currentUser = null;
        currentProfile = null;

        showMessage(
            "У этого аккаунта нет прав администратора.",
            "error"
        );

        return;
    }

    showMessage(
        "Вход администратора выполнен.",
        "success"
    );

    updateAuthUI();

    showPage("admin");
}


// ------------------------------------------------------------
// CHECK ADMIN ACCESS
// ------------------------------------------------------------

async function checkAdminAccess() {
    if (!currentUser) {
        showPage("adminLogin");
        return false;
    }

    await loadCurrentProfile();

    if (
        !currentProfile ||
        currentProfile.role !== "admin"
    ) {
        showMessage(
            "Доступ запрещён.",
            "error"
        );

        showPage("list");

        return false;
    }

    await loadAdminSubmissions();
    await loadAdminLevels();

    return true;
}


// ------------------------------------------------------------
// ADMIN SUBMISSIONS
// ------------------------------------------------------------

async function loadAdminSubmissions() {
    const container =
        getElement("admin-submissions");

    if (!container) return;

    container.innerHTML =
        "<p>Загрузка заявок...</p>";

    const { data, error } =
        await supabaseClient
            .from("submissions")
            .select("*")
            .order("created_at", {
                ascending: false
            });

    if (error) {
        console.error(error);

        container.innerHTML =
            "<p>Не удалось загрузить заявки.</p>";

        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML =
            "<p>Новых заявок нет.</p>";

        return;
    }

    container.innerHTML = data.map(submission => {

        const status =
            submission.status || "pending";

        const videoStatus =
            submission.video_status || "pending";

        return `
            <div
                class="admin-submission"
                data-submission-id="${submission.id}"
            >

                <h3>
                    ${escapeHTML(submission.level_name)}
                </h3>

                <p>
                    <strong>Level ID:</strong>
                    ${escapeHTML(submission.level_id)}
                </p>

                <p>
                    <strong>Creator:</strong>
                    ${escapeHTML(submission.creator_name)}
                </p>

                <p>
                    <strong>Difficulty:</strong>
                    ${escapeHTML(submission.difficulty || "Unknown")}
                </p>

                <p>
                    <strong>Status:</strong>
                    ${escapeHTML(status)}
                </p>

                ${
                    submission.youtube_url
                        ? `
                            <p>
                                <strong>YouTube:</strong>
                                <a
                                    href="${escapeHTML(submission.youtube_url)}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Open video
                                </a>
                            </p>
                          `
                        : "<p>No YouTube video.</p>"
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

                <p>
                    Video status:
                    <strong>
                        ${escapeHTML(videoStatus)}
                    </strong>
                </p>

            </div>
        `;
    }).join("");
}


// ------------------------------------------------------------
// APPROVE SUBMISSION
// ------------------------------------------------------------

async function approveSubmission(id) {
    if (!(await checkAdminAccessLight())) return;

    const { data: submission, error: getError } =
        await supabaseClient
            .from("submissions")
            .select("*")
            .eq("id", id)
            .single();

    if (getError || !submission) {
        showMessage(
            "Заявка не найдена.",
            "error"
        );
        return;
    }

    const { error } =
        await supabaseClient
            .from("submissions")
            .update({
                status: "approved"
            })
            .eq("id", id);

    if (error) {
        console.error(error);

        showMessage(
            "Не удалось одобрить заявку.",
            "error"
        );

        return;
    }

    const { data: existingLevel } =
        await supabaseClient
            .from("levels")
            .select("id")
            .eq("level_id", submission.level_id)
            .maybeSingle();

    if (!existingLevel) {
        const nextPosition =
            await getNextPosition();

        const { error: levelError } =
            await supabaseClient
                .from("levels")
                .insert({
                    level_name: submission.level_name,
                    level_id: submission.level_id,
                    creator_name: submission.creator_name,
                    difficulty:
                        submission.difficulty || "Unknown",
                    position: nextPosition,
                    youtube_url:
                        submission.youtube_url || null
                });

        if (levelError) {
            console.error(levelError);

            showMessage(
                "Заявка одобрена, но уровень не удалось добавить в список.",
                "error"
            );

            await loadAdminSubmissions();

            return;
        }
    }

    showMessage(
        "Уровень одобрен и добавлен в список!",
        "success"
    );

    await loadAdminSubmissions();
    await loadLevels();
}


// ------------------------------------------------------------
// REJECT SUBMISSION
// ------------------------------------------------------------

async function rejectSubmission(id) {
    if (!(await checkAdminAccessLight())) return;

    const reason =
        prompt("Причина отклонения (необязательно):");

    const { error } =
        await supabaseClient
            .from("submissions")
            .update({
                status: "rejected",
                admin_message: reason || null
            })
            .eq("id", id);

    if (error) {
        console.error(error);

        showMessage(
            "Не удалось отклонить заявку.",
            "error"
        );

        return;
    }

    showMessage(
        "Заявка отклонена.",
        "success"
    );

    await loadAdminSubmissions();
}


// ------------------------------------------------------------
// APPROVE VIDEO
// ------------------------------------------------------------

async function approveVideo(id) {
    if (!(await checkAdminAccessLight())) return;

    const { error } =
        await supabaseClient
            .from("submissions")
            .update({
                video_status: "approved",
                video_rejection_reason: null
            })
            .eq("id", id);

    if (error) {
        console.error(error);

        showMessage(
            "Не удалось одобрить видео.",
            "error"
        );

        return;
    }

    showMessage(
        "Видео одобрено.",
        "success"
    );

    await loadAdminSubmissions();
}


// ------------------------------------------------------------
// REJECT VIDEO
// ------------------------------------------------------------

async function rejectVideo(id) {
    if (!(await checkAdminAccessLight())) return;

    const reason =
        prompt("Причина отклонения видео:");

    const { error } =
        await supabaseClient
            .from("submissions")
            .update({
                video_status: "rejected",
                video_rejection_reason:
                    reason || "Видео не прошло проверку."
            })
            .eq("id", id);

    if (error) {
        console.error(error);

        showMessage(
            "Не удалось отклонить видео.",
            "error"
        );

        return;
    }

    showMessage(
        "Видео отклонено.",
        "success"
    );

    await loadAdminSubmissions();
}


// ------------------------------------------------------------
// DELETE SUBMISSION
// ------------------------------------------------------------

async function deleteSubmission(id) {
    if (!(await checkAdminAccessLight())) return;

    const confirmed =
        confirm(
            "Удалить эту заявку? Это действие нельзя отменить."
        );

    if (!confirmed) return;

    const { error } =
        await supabaseClient
            .from("submissions")
            .delete()
            .eq("id", id);

    if (error) {
        console.error(error);

        showMessage(
            "Не удалось удалить заявку.",
            "error"
        );

        return;
    }

    showMessage(
        "Заявка удалена.",
        "success"
    );

    await loadAdminSubmissions();
}


// ------------------------------------------------------------
// ADMIN LEVELS
// ------------------------------------------------------------

async function loadAdminLevels() {
    const container =
        getElement("admin-levels");

    if (!container) return;

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

    if (!data || data.length === 0) {
        container.innerHTML =
            "<p>Уровней пока нет.</p>";
        return;
    }

    container.innerHTML = data.map(level => {

        return `
            <div
                class="admin-level"
                data-level-id="${level.id}"
            >

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

                <div class="admin-actions">

                    <button
                        onclick="editLevel(${level.id})"
                    >
                        Edit
                    </button>

                    <button
                        onclick="deleteLevel(${level.id})"
                    >
                        Delete
                    </button>

                </div>

            </div>
        `;
    }).join("");
}


// ------------------------------------------------------------
// GET NEXT POSITION
// ------------------------------------------------------------

async function getNextPosition() {
    const { data, error } =
        await supabaseClient
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


// ------------------------------------------------------------
// NORMALIZE POSITIONS
// ------------------------------------------------------------

async function normalizePositions() {
    const { data, error } =
        await supabaseClient
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


// ------------------------------------------------------------
// SAVE / ADD LEVEL FROM ADMIN
// ------------------------------------------------------------

async function saveLevel() {
    if (!(await checkAdminAccessLight())) return;

    const levelName =
        getElement("admin-level-name")?.value.trim();

    const levelId =
        getElement("admin-level-id")?.value.trim();

    const creatorName =
        getElement("admin-creator-name")?.value.trim();

    const difficulty =
        getElement("admin-difficulty")?.value.trim();

    const youtubeUrl =
        getElement("admin-youtube")?.value.trim();

    if (
        !levelName ||
        !levelId ||
        !creatorName ||
        !difficulty
    ) {
        showMessage(
            "Заполните все обязательные поля.",
            "error"
        );
        return;
    }

    const dataToSave = {
        level_name: levelName,
        level_id: levelId,
        creator_name: creatorName,
        difficulty: difficulty,
        youtube_url: youtubeUrl || null
    };

    let error;

    if (currentEditingLevelId) {

        const result =
            await supabaseClient
                .from("levels")
                .update(dataToSave)
                .eq("id", currentEditingLevelId);

        error = result.error;

    } else {

        const position =
            await getNextPosition();

        dataToSave.position = position;

        const result =
            await supabaseClient
                .from("levels")
                .insert(dataToSave);

        error = result.error;
    }

    if (error) {
        console.error(error);

        showMessage(
            "Не удалось сохранить уровень: " +
            error.message,
            "error"
        );

        return;
    }

    currentEditingLevelId = null;

    clearAdminLevelForm();

    showMessage(
        "Уровень сохранён!",
        "success"
    );

    await normalizePositions();
    await loadLevels();
    await loadAdminLevels();
}


// ------------------------------------------------------------
// EDIT LEVEL
// ------------------------------------------------------------

async function editLevel(id) {
    if (!(await checkAdminAccessLight())) return;

    const { data, error } =
        await supabaseClient
            .from("levels")
            .select("*")
            .eq("id", id)
            .single();

    if (error || !data) {
        showMessage(
            "Уровень не найден.",
            "error"
        );
        return;
    }

    currentEditingLevelId = id;

    const name =
        getElement("admin-level-name");

    const levelId =
        getElement("admin-level-id");

    const creator =
        getElement("admin-creator-name");

    const difficulty =
        getElement("admin-difficulty");

    const youtube =
        getElement("admin-youtube");

    if (name) name.value = data.level_name;
    if (levelId) levelId.value = data.level_id;
    if (creator) creator.value = data.creator_name;
    if (difficulty) difficulty.value = data.difficulty;
    if (youtube) youtube.value = data.youtube_url || "";

    const saveButton =
        getElement("admin-save-level");

    if (saveButton) {
        saveButton.textContent = "Save Changes";
    }

    showMessage(
        "Режим редактирования включён.",
        "info"
    );
}


// ------------------------------------------------------------
// DELETE LEVEL
// ------------------------------------------------------------

async function deleteLevel(id) {
    if (!(await checkAdminAccessLight())) return;

    const confirmed =
        confirm(
            "Удалить этот уровень из Demon List?"
        );

    if (!confirmed) return;

    const { error } =
        await supabaseClient
            .from("levels")
            .delete()
            .eq("id", id);

    if (error) {
        console.error(error);

        showMessage(
            "Не удалось удалить уровень.",
            "error"
        );

        return;
    }

    await normalizePositions();

    showMessage(
        "Уровень удалён.",
        "success"
    );

    await loadLevels();
    await loadAdminLevels();
}


// ------------------------------------------------------------
// CLEAR ADMIN FORM
// ------------------------------------------------------------

function clearAdminLevelForm() {
    currentEditingLevelId = null;

    const form =
        getElement("admin-level-form");

    if (form) {
        form.reset();
    }

    [
        "admin-level-name",
        "admin-level-id",
        "admin-creator-name",
        "admin-difficulty",
        "admin-youtube"
    ].forEach(id => {
        const element = getElement(id);

        if (element) {
            element.value = "";
        }
    });

    const saveButton =
        getElement("admin-save-level");

    if (saveButton) {
        saveButton.textContent = "Add Level";
    }
}


// ------------------------------------------------------------
// LIGHT ADMIN CHECK
// ------------------------------------------------------------

async function checkAdminAccessLight() {
    if (!currentUser) {
        showMessage(
            "Нужно войти как администратор.",
            "error"
        );

        return false;
    }

    if (
        !currentProfile ||
        currentProfile.role !== "admin"
    ) {
        await loadCurrentProfile();
    }

    if (
        !currentProfile ||
        currentProfile.role !== "admin"
    ) {
        showMessage(
            "Доступ запрещён.",
            "error"
        );

        return false;
    }

    return true;
}


// ------------------------------------------------------------
// ADMIN LOGOUT
// ------------------------------------------------------------

async function adminLogout() {
    await logoutPlayer();
}


// ------------------------------------------------------------
// BUTTON / LINK EVENTS
// ------------------------------------------------------------

function setupNavigation() {

    document.querySelectorAll("[data-page]")
        .forEach(element => {

            element.addEventListener("click", event => {

                event.preventDefault();

                const page =
                    element.dataset.page;

                if (!page) return;

                if (
                    page === "profile" &&
                    !currentUser
                ) {
                    showMessage(
                        "Сначала войди в аккаунт.",
                        "error"
                    );
                    return;
                }

                showPage(page);
            });
        });


    const loginButton =
        getElement("login-button");

    if (loginButton) {
        loginButton.addEventListener(
            "click",
            loginPlayer
        );
    }


    const registerButton =
        getElement("register-button");

    if (registerButton) {
        registerButton.addEventListener(
            "click",
            registerPlayer
        );
    }


    const adminLoginButton =
        getElement("admin-login-button");

    if (adminLoginButton) {
        adminLoginButton.addEventListener(
            "click",
            adminLogin
        );
    }


    const submitButton =
        getElement("submit-level-button");

    if (submitButton) {
        submitButton.addEventListener(
            "click",
            submitLevel
        );
    }


    const logoutButton =
        getElement("logout-button");

    if (logoutButton) {
        logoutButton.addEventListener(
            "click",
            logoutPlayer
        );
    }


    const adminLogoutButton =
        getElement("admin-logout-button");

    if (adminLogoutButton) {
        adminLogoutButton.addEventListener(
            "click",
            adminLogout
        );
    }


    const saveLevelButton =
        getElement("admin-save-level");

    if (saveLevelButton) {
        saveLevelButton.addEventListener(
            "click",
            saveLevel
        );
    }


    const cancelEditButton =
        getElement("admin-cancel-edit");

    if (cancelEditButton) {
        cancelEditButton.addEventListener(
            "click",
            clearAdminLevelForm
        );
    }
}


// ------------------------------------------------------------
// ENTER KEY SUPPORT
// ------------------------------------------------------------

function setupEnterKeys() {

    const loginPassword =
        getElement("login-password");

    if (loginPassword) {
        loginPassword.addEventListener(
            "keydown",
            event => {
                if (event.key === "Enter") {
                    loginPlayer();
                }
            }
        );
    }


    const registerPassword =
        getElement("register-password");

    if (registerPassword) {
        registerPassword.addEventListener(
            "keydown",
            event => {
                if (event.key === "Enter") {
                    registerPlayer();
                }
            }
        );
    }


    const adminPassword =
        getElement("admin-password");

    if (adminPassword) {
        adminPassword.addEventListener(
            "keydown",
            event => {
                if (event.key === "Enter") {
                    adminLogin();
                }
            }
        );
    }
}


// ------------------------------------------------------------
// AUTH STATE
// ------------------------------------------------------------

function setupAuthListener() {

    supabaseClient.auth.onAuthStateChange(
        (event, session) => {

            currentUser =
                session?.user || null;

            updateAuthUI();

            if (!currentUser) {
                currentProfile = null;
            }

            if (event === "SIGNED_OUT") {
                currentUser = null;
                currentProfile = null;
                updateAuthUI();
            }
        }
    );
}


// ------------------------------------------------------------
// CHECK EXISTING SESSION
// ------------------------------------------------------------

async function checkExistingSession() {

    const { data, error } =
        await supabaseClient.auth.getSession();

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


// ------------------------------------------------------------
// STARTUP
// ------------------------------------------------------------

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "Dash World Demon List loaded."
        );

        setupNavigation();
        setupSearch();
        setupEnterKeys();
        setupAuthListener();

        await checkExistingSession();

        await loadLevels();

        // Hide every page first.
        Object.values(pageMap).forEach(id => {
            const page = getElement(id);

            if (page) {
                page.style.display = "none";
            }
        });

        // Show main page.
        const listPage =
            getElement(pageMap.list);

        if (listPage) {
            listPage.style.display = "";
        }
    }
);


// ------------------------------------------------------------
// MAKE FUNCTIONS AVAILABLE TO HTML
// ------------------------------------------------------------

window.showPage = showPage;

window.loginPlayer = loginPlayer;
window.registerPlayer = registerPlayer;
window.logoutPlayer = logoutPlayer;

window.adminLogin = adminLogin;
window.adminLogout = adminLogout;

window.submitLevel = submitLevel;

window.approveSubmission = approveSubmission;
window.rejectSubmission = rejectSubmission;

window.approveVideo = approveVideo;
window.rejectVideo = rejectVideo;

window.deleteSubmission = deleteSubmission;

window.saveLevel = saveLevel;
window.editLevel = editLevel;
window.deleteLevel = deleteLevel;

window.loadLevels = loadLevels;
window.loadProfile = loadProfile;
window.loadMySubmissions = loadMySubmissions;
window.checkAdminAccess = checkAdminAccess;