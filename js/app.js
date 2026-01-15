let book;
let chapters = [];
let chapter = [];
let index = 0;
let isPaused = true;
let wpm = 250;
let fontSize = 40;

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
        start = content.ownerDocument.getElementById(href.split("#")[1]);
    } catch (err) {
        document.getElementById("error").innerHTML = JSON.stringify(err, Object.getOwnPropertyNames(err), 2);
        return;
    }
    let text = start.innerText;
    let nextSibling = start.nextSibling;
    while (nextSibling && nextSibling.nodeName !== start.nodeName) {
        text += nextSibling.innerText ?? "";
        nextSibling = nextSibling.nextSibling;
    }
    chapter = text.replace(/[\s\-\—]+/g, " ").trim().split(" ");
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
        let timeout = (1/wpm) * 60 * 1000;
        timeout = [".", ",", ";"].includes(word.at(-1)) ? timeout * 2 : timeout;
        setTimeout(displayWord, timeout);
    }
}

function play() {
    isPaused = !isPaused;
    displayWord();
}

function nextWord() {
    displayWord(false);
}

function prevWord() {
    index = Math.max(0, index - 2);
    displayWord(false);
}

function faster() {
    wpm = Math.min(1000, wpm + 25);
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

function addChapter(chapter, index) {
    chapters.push(`
        <p onclick="loadChapter('${chapter.href}')" class="pointer text-blue">
            ${"&nbsp;".repeat(index * 2)}${chapter.label.trim()}
        </p>
    `);
    chapter.subitems.forEach(item => addChapter(item, index + 1));
}

document.getElementById("file-upload").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    book = ePub(file);
    await book.ready;

    chapters = [];
    const navigation = await book.loaded.navigation;
    navigation.toc.forEach((chapter) => addChapter(chapter, 0));
    document.getElementById("chapters").innerHTML = chapters.join("");
});
