// =====================================================
// DASH WORLD DEMON LIST
// Supabase configuration
// =====================================================

const SUPABASE_URL = "https://irxkvnromngihugetrwf.supabase.co";
const SUPABASE_KEY = "sb_publishable_R7MlVHvKXHn9n49mRPpo3g_-J2lwfWR";

let supabaseClient = null;

if (
    window.supabase &&
    SUPABASE_URL !== "PASTE_YOUR_EXISTING_SUPABASE_URL_HERE" &&
    SUPABASE_KEY !== "PASTE_YOUR_EXISTING_SUPABASE_PUBLISHABLE_OR_ANON_KEY_HERE"
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

    const { data } = await supabaseClient.auth.getSession();

    if (data.session) {
        const { data: isAdmin } =
            await supabaseClient.rpc("is_admin");

        if (isAdmin === true) {
            adminPanelOpen = true;
            document.getElementById("adminPanelButton")
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

    const { data } = await supabaseClient.auth.getSession();

    if (!data.session) {
        adminPanelOpen = false;

        document.getElementById("adminPanelButton")
            .classList.add("hidden");

        showPage("adminLogin");
        return;
    }

    const { data: isAdmin } =
        await supabaseClient.rpc("is_admin");

    if (isAdmin !== true) {
        adminPanelOpen = false;

        document.getElementById("adminPanelButton")
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
// LEVEL LIST
// =====================================================

async function loadLevels() {
    const container =