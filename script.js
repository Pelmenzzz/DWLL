const levels = [
    {
        rank: 1,
        name: "Example Extreme",
        creator: "ExampleCreator",
        difficulty: "Extreme Demon"
    },
    {
        rank: 2,
        name: "Darkness",
        creator: "Player2",
        difficulty: "Extreme Demon"
    },
    {
        rank: 3,
        name: "Impossible Way",
        creator: "Player3",
        difficulty: "Extreme Demon"
    },
    {
        rank: 4,
        name: "Blood Factory",
        creator: "Player4",
        difficulty: "Insane Demon"
    },
    {
        rank: 5,
        name: "Cyber World",
        creator: "Player5",
        difficulty: "Insane Demon"
    }
];


function displayLevels(list = levels) {

    const container = document.getElementById("levels");

    container.innerHTML = "";

    list.forEach(level => {

        const element = document.createElement("div");

        element.className = "level";

        element.innerHTML = `
            <div class="rank">#${level.rank}</div>

            <div class="level-info">
                <h3>${level.name}</h3>
                <p>Creator: ${level.creator}</p>
                <p class="difficulty">${level.difficulty}</p>
            </div>
        `;

        container.appendChild(element);
    });
}


function searchLevels() {

    const search = document
        .getElementById("search")
        .value
        .toLowerCase();

    const filtered = levels.filter(level =>
        level.name.toLowerCase().includes(search) ||
        level.creator.toLowerCase().includes(search)
    );

    displayLevels(filtered);
}


function showPage(pageID) {

    document.querySelectorAll(".page").forEach(page => {
        page.classList.add("hidden");
    });

    document.getElementById(pageID).classList.remove("hidden");
}


function submitLevel(event) {

    event.preventDefault();

    const name = document.getElementById("levelName").value;
    const id = document.getElementById("levelID").value;
    const creator = document.getElementById("creator").value;
    const player = document.getElementById("player").value;

    document.getElementById("submitMessage").textContent =
        `Submission received! Level "${name}" (ID: ${id}) was submitted by ${player}.`;

    console.log({
        levelName: name,
        levelID: id,
        creator: creator,
        player: player
    });
}


displayLevels();