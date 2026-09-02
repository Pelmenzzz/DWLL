// ================= SUPABASE =================

const SUPABASE_URL = "https://irxkvnromngihugetrwf.supabase.co";
const SUPABASE_KEY = "sb_publishable_R7MlVHvKXHn9n49mRPpo3g_-J2lwfWR";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ================= LEVELS =================

let levels = [];


// ================= PAGE NAVIGATION =================

function showPage(page) {

    const pages = [
        "listPage",
        "submitPage",
        "adminLoginPage",
        "adminPage"
    ];

    pages.forEach(id => {
        const element = document.getElementById(id);

        if (element) {
            element.classList.add("hidden");
        }
    });


    if (page === "list") {
        document.getElementById("listPage").classList.remove("hidden");
        loadLevels();
    }

    if (page === "submit") {
        document.getElementById("submitPage").classList.remove("hidden");
    }

    if (page === "adminLogin") {
        document.getElementById("adminLoginPage").classList.remove("hidden");
    }

    if (page === "admin") {
        document.getElementById("adminPage").classList.remove("hidden");
    }
}


// ================= LOAD LEVELS =================

async function loadLevels() {

    const container = document.getElementById("levels-container");

    if (!container) return;

    container.innerHTML = `
        <div class="loading">
            Loading levels...
        </div>
    `;


    const { data, error } = await supabase
        .from("levels")
        .select("*")
        .order("position", { ascending: true });


    if (error) {

        console.error(error);

        container.innerHTML = `
            <div class="loading">
                No levels available yet.
            </div>
        `;

        return;
    }


    levels = data || [];

    renderLevels(levels);
}


// ================= DISPLAY LEVELS =================

function renderLevels(list) {

    const container = document.getElementById("levels-container");

    if (!container) return;


    if (list.length === 0) {

        container.innerHTML = `
            <div class="loading">
                No levels yet.
            </div>
        `;

        return;
    }


    container.innerHTML = "";


    list.forEach((level, index) => {

        const card = document.createElement("div");

        card.className = "level";


        card.innerHTML = `
            <div class="rank">
                #${index + 1}
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

                <p class="difficulty">
                    ${escapeHTML(level.difficulty)}
                </p>

            </div>
        `;


        container.appendChild(card);

    });
}


// ================= SEARCH =================

function searchLevels() {

    const input = document.getElementById("searchInput");

    if (!input) return;


    const query = input.value
        .toLowerCase()
        .trim();


    const filtered = levels.filter(level => {

        return (
            level.level_name.toLowerCase().includes(query) ||
            level.level_id.toLowerCase().includes(query) ||
            level.creator_name.toLowerCase().includes(query)
        );

    });


    renderLevels(filtered);
}


// ================= ADMIN LOGIN =================

async function adminLogin() {

    const adminId =
        document.getElementById("adminId").value.trim();

    const password =
        document.getElementById("adminPassword").value;


    const message =
        document.getElementById("adminLoginMessage");


    if (!adminId || !password) {

        message.textContent =
            "Please enter Admin ID and password.";

        return;
    }


    message.textContent =
        "Admin authentication will be connected next.";

    /*
        Настоящую авторизацию подключим через Supabase.

        Пароль НЕ хранится в этом файле.
    */
}


// ================= ADMIN LOGOUT =================

async function adminLogout() {

    await supabase.auth.signOut();

    showPage("list");
}


// ================= ADD LEVEL =================

async function addLevel() {

    const message =
        document.getElementById("addLevelMessage");


    message.textContent =
        "Admin authentication is required first.";
}


// ================= SUBMIT LEVEL =================

async function submitLevel() {

    const message =
        document.getElementById("submitMessage");


    message.textContent =
        "Player account is required to submit a level.";
}


// ================= ADD LEVEL PANEL =================

function showAddLevel() {

    const panel =
        document.getElementById("addLevelPanel");


    if (!panel) return;

    panel.classList.toggle("hidden");
}


// ================= HTML SECURITY =================

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ================= INITIALIZATION =================

document.addEventListener("DOMContentLoaded", () => {

    showPage("list");

});