
/** @type {NodeListOf<HTMLDivElement>} */
const doorsEle = document.querySelectorAll(".door");

/** @type {HTMLDivElement} */
const promptEle = document.querySelector(".prompt");

/** @type {HTMLDivElement} */
const overlayEle = document.querySelector(".overlay");

/** @type {HTMLDivElement} */
const acceptBtnEle = document.querySelector(".accept");
/** @type {HTMLDivElement} */
const declineBtnEle = document.querySelector(".decline");

const [totalScore, wonScore, lostScore] = [...document.querySelectorAll(".score")];

const playBtn = document.querySelector(".play-btn");
const switchBtn = document.querySelector(".switch-btn");
const resetBtn = document.querySelector(".reset-stats-btn");

let canSelect = true;
let auto = false;
let autoChange = true;
let selectedDoor = -1;

let winns = 0;
let total = 0;

function deselectAll() {
    doorsEle.forEach(v => v.classList.remove("selected"));
}

playBtn.addEventListener("click", _ => {
    auto = !auto;
    if(auto) {
        playBtn.classList.add("running");
    } else {
        playBtn.classList.remove("running");
    }
});

switchBtn.addEventListener("click", _ => {
    autoChange = !autoChange;
    if(autoChange) {
        switchBtn.innerHTML = "mit wechsel";
    } else {
        switchBtn.innerHTML = "ohne wechsel";
    }
});

resetBtn.addEventListener("click", _ => {
    auto = false;
    playBtn.classList.remove("running");

    winns = 0;
    total = 0;
    updateStats();
});

function selectDoor(i) {
    deselectAll();
    doorsEle[i].classList.add("selected");
    selectedDoor = i;
}

/**
 * 
 * @param {number} idx 
 */
function openDoor(idx) {
    doorsEle[idx].classList.add("open");
}

function openAll() {
    doorsEle.forEach(v => v.classList.add("open"));
}

function randomRange(max, min = 0) { return Math.floor(Math.random() * (1 - Number.EPSILON) * (max - min)); }

function genrateDoors() {
    let doors = [false, false, false];
    doors[randomRange(3)] = true;
    doorsEle.forEach((v, i) => { if(doors[i]) { v.classList.add("price"); } else { v.classList.remove("price"); } });
    return doors;
}

function getOpen(selected, doors) {
    return doors.findIndex((v, i) => !v && selected !== i);
}

function getOther(selected, opened) {
    for(let i = 0; i < 3; i++) {
        if(i !== selected && i !== opened) { return i; }
    }
    throw new Error("error");
}

function resetAll() {
    canSelect = true;
    deselectAll();
    doorsEle.forEach(v => v.classList.remove("open"));
}

/**
 * 
 * @param {boolean} auto 
 */
function* play() {
    const doors = genrateDoors();
    promptEle.innerHTML = "wählen sie eine tür";
    let selected = yield;
    promptEle.innerHTML = "---";
    canSelect = false;
    const open = getOpen(selected, doors);
    openDoor(open);
    const answer = yield;
    if(answer) { selected = getOther(selected, open); }
    selectDoor(selected);
    openAll();
    promptEle.innerHTML = doors[selected] ? "gewonnen" : "verloren";
    winns += doors[selected] ? 1 : 0;
    total++;
}

function getSelection() {
    if(auto) {
        return Promise.resolve(randomRange(3));
    }
    return new Promise((res) => {
        doorsEle.forEach((v, i) => v.addEventListener("click", _ => {
            if(canSelect) { selectDoor(i); res(i); }
            doorsEle.forEach(v => v.removeEventListener("click", _ => {}, { once: true }));
        }, { once: true }));
    });
}

function askForChange() {
    if(auto) { return Promise.resolve(autoChange); }

    overlayEle.classList.add("visible");
    return new Promise(res => {
        acceptBtnEle.addEventListener("click", _ => { overlayEle.classList.remove("visible"); res(true); });
        declineBtnEle.addEventListener("click", _ => { overlayEle.classList.remove("visible"); res(false); });
    });
}

function wait(t) { return new Promise((res) => setTimeout(_ => res(), t)) }

function waitForClick() {
    return new Promise(res => {
        document.body.addEventListener("click", ev => { ev.preventDefault(); res(); }, { once: true });
    });
}

function updateStats() {
    totalScore.innerHTML = `${total}`;
    wonScore.innerHTML = `${winns} (${(winns / total * 100 || 0).toFixed(2)}%)`;
    lostScore.innerHTML = `${total - winns} (${((total - winns) / total * 100 || 0).toFixed(2)}%)`;
}

// steps
//      select door
//      reveal other door
//      ask for change
//      reveal winning door + add to statistics

const fast = location.search.includes("fast");

async function run() {
    while(true) {
        const game = play();

        game.next();
        game.next(await getSelection());
        game.next(await askForChange());

        await wait(auto ? (fast ? 0 : 100) : 1000);

        updateStats();
        resetAll();
    }
}

run();
