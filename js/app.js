let book;
let chapters = [];
let chapter = [];
let index = 0;
let isPaused = true;
let wpm = 250;
let fontSize = 40;
let isFullScreen = false;

function displayPage(page) {
    window.scrollTo({ top: 0, left: 0 });
    if (page === "upload") {
        document.getElementById("upload").className = "";
        document.getElementById("content").className = "d-none";
        return;
    }
    if (page === "content") {
        document.getElementById("content").className = "";
        document.getElementById("upload").className = "d-none";
        return;
    }
}

async function loadChapter(href) {
    let start;
    try {
        const section = await book.spine.get(href);
        const content = await section.load(book.load.bind(book));
        section.unload();
        if (href.includes("#")) {
            start = content.ownerDocument.getElementById(href.split("#")[1]);
        } else {
            start = content;
        }
    } catch (err) {
        document.getElementById("error").innerHTML = JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
        return;
    }
    if (!start) {
        document.getElementById("error").innerHTML = `Chapter not found: ${href}.`;
        return;
    }
    let text = start.innerText;
    let nextSibling = start.nextSibling;
    while (nextSibling && nextSibling.nodeName !== start.nodeName) {
        text += nextSibling.innerText ?? "";
        nextSibling = nextSibling.nextSibling;
    }
    chapter = text
        .replace("...", "... ")
        .replace("…", "… ")
        .replace(/[\s\-\—]+/g, " ")
        .trim()
        .split(" ");
    displayChapter();
}

function displayChapter() {
    displayPage("content");
    index = 0;
    isPaused = true;
    displayWord(false);
}

function displayWord(play = true) {
    if ((play && isPaused) || index >= chapter.length) {
        return;
    }
    let word = chapter[index].split("");
    if (word.length % 2 === 0) {
        word.unshift("&nbsp;");
    }
    const middleIndex = Math.floor(word.length / 2);
    word[middleIndex] = `<span class="text-red">${word[middleIndex]}</span>`;
    word = word.join("");
    document.getElementById("word").innerHTML = word;
    index += 1;
    document.getElementById("progress").value = Math.round(index * 100 / chapter.length);
    if (play) {
        let timeout = (1 / wpm) * 60 * 1000;
        timeout = /[^A-Za-z0-9]/.test(word.at(-1)) ? timeout * 3 : timeout;
        setTimeout(displayWord, Math.round(timeout));
    }
}

function play() {
    isPaused ? resume() : pause();
    displayWord();
}

function resume() {
    isPaused = false;
    document.getElementById("header-buttons").className = "d-none";
    document.getElementById("progress").className = "w-100 d-none";
    document.getElementById("footer-buttons").className = "m-0 d-none";
}

function pause() {
    isPaused = true;
    document.getElementById("header-buttons").className = "d-flex";
    document.getElementById("progress").className = "w-100";
    document.getElementById("footer-buttons").className = "m-0";
}

function nextWord() {
    displayWord(false);
}

function prevWord() {
    index = Math.max(0, index - 2);
    displayWord(false);
}

function faster() {
    wpm = Math.min(500, wpm + 25);
    document.getElementById("wpm").innerHTML = wpm;
}

function slower() {
    wpm = Math.max(0, wpm - 25);
    document.getElementById("wpm").innerHTML = wpm;
}

function smaller() {
    fontSize = Math.max(0, fontSize - 5);
    document.getElementById("word").style.fontSize = fontSize + "px";
    document.getElementById("font-size").innerHTML = fontSize;
}

function larger() {
    fontSize = Math.min(200, fontSize + 5);
    document.getElementById("word").style.fontSize = fontSize + "px";
    document.getElementById("font-size").innerHTML = fontSize;
}

function fullScreen() {
    if (isFullScreen) {
        document.exitFullscreen();
        isFullScreen = false;
    } else {
        document.documentElement.requestFullscreen();
        isFullScreen = true;
    }
}

function addChapter(chapter) {
    chapters.push(`
        <a href="#${chapter.href}">
            <p onclick="loadChapter('${chapter.href}')">
                ${chapter.label.trim()}
            </p>
        </a>
    `);
    chapter.subitems.forEach(item => addChapter(item));
}

document.getElementById("file-upload").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    book = ePub(file);
    await book.ready;

    chapters = [];
    const navigation = await book.loaded.navigation;
    navigation.toc.forEach((chapter) => addChapter(chapter));
    document.getElementById("chapters").innerHTML = chapters.join("");
});
