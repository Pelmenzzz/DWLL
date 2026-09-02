// ========================================
// SUPABASE
// ========================================

const SUPABASE_URL = "https://irxkvnromngihugetrwf.supabase.co";
const SUPABASE_KEY = "sb_publishable_R7MlVHvKXHn9n49mRPpo3g_-J2lwfWR";

let supabaseClient = null;

try {
    if (
        window.supabase &&
        SUPABASE_URL.startsWith("https://") &&
        !SUPABASE_URL.includes("ТВОЙ_УЖЕ_РАБОТАЮЩИЙ") &&
        !SUPABASE_KEY.includes("ТВОЙ_УЖЕ_РАБОТАЮЩИЙ")
    ) {
        supabaseClient = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );
    }
} catch (error) {
    console.error("Supabase error:", error);
}


// ========================================
// PAGE NAVIGATION
// ========================================

function showPage(page) {

    const pages = [
        "listPage",
        "submitPage",
        "adminLoginPage",
        "adminPage",
        "resetPasswordPage"
    ];

    pages.forEach(function(id) {
        const element = document.getElementById(id);

        if (element) {
            element.classList.add("hidden");
        }
    });

    const selectedPage =
        document.getElementById(page + "Page");

    if (selectedPage) {
        selectedPage.classList.remove("hidden");
    }

    if (page === "list") {
        loadLevels();
    }
}


// ========================================
// LOAD LEVELS
// ========================================

async function loadLevels() {

    const container =
        document.getElementById("levels-container");

    if (!container) return;

    if (!supabaseClient) {
        container.innerHTML =
            `<div class="empty">Supabase is not connected.</div>`;
        return;
    }

    try {

        const { data, error } =
            await supabaseClient
                .from("levels")
                .select("*")
                .order("position", { ascending: true });

        if (error) {

            console.error(error);

            container.innerHTML =
                `<div class="empty">No levels available yet.</div>`;

            return;
        }

        renderLevels(data || []);

    } catch (error) {

        console.error(error);

        container.innerHTML =
            `<div class="empty">Unable to load levels.</div>`;
    }
}


// ========================================
// RENDER LEVELS
// ========================================

function renderLevels(levels) {

    const container =
        document.getElementById("levels-container");

    if (!container) return;

    if (levels.length === 0) {

        container.innerHTML =
            `<div class="empty">No levels available yet.</div>`;

        return;
    }

    container.innerHTML =
        levels.map(function(level) {

            let video = "";

            if (level.youtube_url) {

                video = `
                    <a class="video-button"
                       href="${escapeHTML(level.youtube_url)}"
                       target="_blank"
                       rel="noopener noreferrer">
                        ▶ YouTube
                    </a>
                `;
            }

            return `
                <div class="level">

                    <div class="rank">
                        #${escapeHTML(String(level.position))}
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

                        <span class="difficulty">
                            ${escapeHTML(level.difficulty)}
                        </span>

                        ${video}

                    </div>

                </div>
            `;

        }).join("");
}


// ========================================
// SEARCH
// ========================================

function searchLevels() {

    const input =
        document.getElementById("searchInput");

    if (!input) return;

    const search =
        input.value.toLowerCase().trim();

    const levels =
        document.querySelectorAll(".level");

    levels.forEach(function(level) {

        const text =
            level.innerText.toLowerCase();

        level.style.display =
            text.includes(search) ? "flex" : "none";

    });
}


// ========================================
// ADMIN LOGIN
// ========================================

async function adminLogin() {

    const id =
        document.getElementById("adminId").value.trim();

    const password =
        document.getElementById("adminPassword").value;

    const message =
        document.getElementById("adminLoginMessage");

    if (!id || !password) {

        message.textContent =
            "Please enter your Admin ID and password.";

        return;
    }

    if (!supabaseClient) {

        message.textContent =
            "Supabase is not connected.";

        return;
    }

    message.textContent = "Logging in...";

    try {

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: id,
                password: password
            });

        if (error) {

            console.error(error);

            message.textContent =
                "Invalid email or password.";

            return;
        }

        if (!data.user) {

            message.textContent =
                "Login failed.";

            return;
        }

        const { data: isAdmin, error: adminError } =
            await supabaseClient.rpc("is_admin");

        if (adminError) {

            console.error(adminError);

            await supabaseClient.auth.signOut();

            message.textContent =
                "Could not verify administrator.";

            return;
        }

        if (!isAdmin) {

            await supabaseClient.auth.signOut();

            message.textContent =
                "You do not have administrator access.";

            return;
        }

        message.textContent =
            "Login successful!";

        showPage("admin");

        loadAdminLevels();

    } catch (error) {

        console.error(error);

        message.textContent =
            "Something went wrong during login.";
    }
}


// ========================================
// SEND PASSWORD RESET EMAIL
// ========================================

async function sendPasswordReset() {

    const id =
        document.getElementById("adminId").value.trim();

    const message =
        document.getElementById("adminLoginMessage");

    if (!id) {

        message.textContent =
            "Enter your admin email first.";

        return;
    }

    if (!supabaseClient) {

        message.textContent =
            "Supabase is not connected.";

        return;
    }

    message.textContent =
        "Sending password reset email...";

    try {

        const { error } =
            await supabaseClient.auth.resetPasswordForEmail(
                id,
                {
                    redirectTo:
                        window.location.origin +
                        window.location.pathname
                }
            );

        if (error) {

            console.error(error);

            message.textContent =
                "Could not send reset email.";

            return;
        }

        message.textContent =
            "Password reset email sent! Check your email.";

    } catch (error) {

        console.error(error);

        message.textContent =
            "Something went wrong.";
    }
}


// ========================================
// UPDATE PASSWORD
// ========================================

async function updatePassword() {

    const password =
        document.getElementById("newPassword").value;

    const confirmPassword =
        document.getElementById("newPasswordConfirm").value;

    const message =
        document.getElementById("resetPasswordMessage");

    if (!password || !confirmPassword) {

        message.textContent =
            "Please fill in both password fields.";

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

    if (!supabaseClient) {

        message.textContent =
            "Supabase is not connected.";

        return;
    }

    message.textContent =
        "Changing password...";

    try {

        const { error } =
            await supabaseClient.auth.updateUser({
                password: password
            });

        if (error) {

            console.error(error);

            message.textContent =
                "Could not change password.";

            return;
        }

        message.textContent =
            "Password changed successfully!";

        setTimeout(function() {

            showPage("adminLogin");

        }, 1500);

    } catch (error) {

        console.error(error);

        message.textContent =
            "Something went wrong.";
    }
}


// ========================================
// ADMIN LOGOUT
// ========================================

async function adminLogout() {

    if (supabaseClient) {
        await supabaseClient.auth.signOut();
    }

    showPage("list");
}


// ========================================
// ADMIN LEVELS
// ========================================

async function loadAdminLevels() {

    const container =
        document.getElementById(
            "admin-levels-container"
        );

    if (!container || !supabaseClient) return;

    try {

        const { data, error } =
            await supabaseClient
                .from("levels")
                .select("*")
                .order("position", {
                    ascending: true
                });

        if (error) {

            console.error(error);

            container.innerHTML = "";

            return;
        }

        container.innerHTML = `
            <div class="admin-card">

                <h3>📋 Current Levels</h3>

                <p>
                    ${data.length}
                    level(s) currently in the Demon List.
                </p>

            </div>
        `;

    } catch (error) {

        console.error(error);
    }
}


// ========================================
// ADD LEVEL
// ========================================

async function addLevel() {

    const message =
        document.getElementById("addLevelMessage");

    if (!supabaseClient) {

        message.textContent =
            "Supabase is not connected.";

        return;
    }

    message.textContent =
        "Level adding will be connected next.";
}


// ========================================
// SUBMIT LEVEL
// ========================================

async function submitLevel() {

    const message =
        document.getElementById("submitMessage");

    if (!supabaseClient) {

        message.textContent =
            "Supabase is not connected.";

        return;
    }

    message.textContent =
        "Player accounts will be connected next.";
}


// ========================================
// ESCAPE HTML
// ========================================

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ========================================
// CHECK ADMIN SESSION
// ========================================

async function checkAdminSession() {

    if (!supabaseClient) return;

    try {

        const { data } =
            await supabaseClient.auth.getSession();

        if (!data.session) return;

        const { data: isAdmin } =
            await supabaseClient.rpc("is_admin");

        if (isAdmin) {
            console.log("Admin session detected.");
        }

    } catch (error) {

        console.error(error);
    }
}


// ========================================
// PASSWORD RESET SESSION
// ========================================

async function checkPasswordReset() {

    if (!supabaseClient) return;

    const hash =
        window.location.hash;

    if (
        hash.includes("type=recovery") ||
        hash.includes("access_token=")
    ) {

        showPage("resetPassword");
    }
}


// ========================================
// START
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        showPage("list");

        checkAdminSession();

        checkPasswordReset();
    }
);