async function Initialize(word, contextLeft, contextRight) {
    // events
    document.getElementById('closeButton').addEventListener('click', closeClicked);
    document.getElementById('lookupButton').addEventListener('click', async () => await lookupClicked(word, contextLeft, contextRight));
    document.getElementById('hintShowAnswerButton').addEventListener('click', async () => await lookupClicked(word, contextLeft, contextRight));
    document.getElementById('showAnswerButton').addEventListener('click', async () => await lookupClicked(word, contextLeft, contextRight));
    
    let currentHint = 0;
    document.getElementById('hintButton').addEventListener('click', async() => nextHint(word, currentHint++));
    document.getElementById('nextHintButton').addEventListener('click', async() => nextHint(word, currentHint++));

    // header
    const header = document.getElementById("header");
    header.innerText = word;

    // encounter plot
    setupEncounterPlot(document.getElementById('plot'));

    // initial content will be based on if this word has been seen before
    let lookup = (await chrome.storage.local.get(word))[word];
    if (lookup == null || lookup.lookupCount == null || lookup.lookupCount === 0) {
        // this is the first time we've seen this word
        updateDivShown("initialText");
    }
    else {
        // we've seen this word already
        updateDivShown("alreadySeen");
    }
}

function closeClicked() {
    window.parent.postMessage({ name: "close" }, "*");
}

async function nextHint(word, currentHint) {
    updateDivShown("hint");
    const contextParagraph = document.getElementById("contextParagraph");

    const lookup = (await chrome.storage.local.get(word))[word];

    if (lookup != null && Array.isArray(lookup.context) && lookup.context.length > 0) {
        const context = lookup.context[currentHint % lookup.context.length];
        contextParagraph.innerHTML = context.left + "<mark>" + word + "</mark>" + context.right;
    }
    else {
        // TODO: Error handling
    }
}

async function lookupClicked(word, contextLeft, contextRight) {
    // show the loading spinner
    updateDivShown("loadingSpinner");

    // load the data
    const response = await fetch("https://jisho.org/api/v1/search/words?keyword=" + encodeURIComponent(word));
    const jsonData = await response.json();
    // store the word history
    await storeWordHistory(word, contextLeft, contextRight);

    // hide the loading spinner
    loadingSpinner.classList.add("hidden");
    const resultDiv = document.getElementById("result");
    resultDiv.classList.remove("hidden");

    // show the response
    const definition = getDefinitionFromResult(jsonData, word);
    const definitionDiv = document.getElementById("definition");
    if (typeof definition === 'string') {
        // nothing relevant found
        definitionDiv.innerText = definition;
    }
    else {
        // word found
        const posDiv = document.getElementById("pos");
        const furiganaDiv = document.getElementById("furigana");
        definitionDiv.innerText = definition.english.join("; ");
        posDiv.innerText = definition.parts_of_speech.join("; ");
        furiganaDiv.innerText = definition.furigana;
    }
}

function updateDivShown(divName) {
    hideAll();
    const loadingSpinner = document.getElementById(divName);
    loadingSpinner.classList.remove("hidden");
    window.parent.postMessage(
        {
            name: "resize",
            height: document.documentElement.scrollHeight,
            width: document.documentElement.scrollWidth
        },
        "*");
}

function getDefinitionFromResult(jsonData, word) {
    if (jsonData.data.length > 0) {
        let match = jsonData.data.find(j => j.slug === word);
        if (match == null) {
            match = jsonData.data[0];
        }
        if (match.japanese.length > 0 && match.senses.length > 0) {
            return {
                furigana: match.japanese[0].reading,
                english: match.senses[0].english_definitions,
                parts_of_speech: match.senses[0].parts_of_speech
            };
        }
    }
    return "No dictionary matches found";
}

async function storeWordHistory(word, contextLeft, contextRight) {
    let wordData = (await chrome.storage.local.get(word))[word];
    if (wordData == null) {
        wordData = {}
    }
    
    if (typeof wordData.lookupCount !== 'number') {
        wordData.lookupCount = 0;
    }
    if (!Array.isArray(wordData.context)) {
        wordData.context = [];
    }

    if (!wordData.context.some(c => c.left === contextLeft) || !wordData.context.some(c => c.right === contextRight)) {
        wordData.lookupCount++;
        wordData.context.push({ left: contextLeft, right: contextRight });
        // TODO: max number of contexts? Maybe filter out old contexts.
        await chrome.storage.local.set({ [word]: wordData });
    }
}

function setupEncounterPlot(div) {
    const plot = Plot.plot({
        marks: [
            Plot.rectY(
                [
                    { Date: new Date(), "Volume": 1 },
                    { Date: new Date(2023, 1, 1), "Volume": 2 },
                    { Date: new Date(2023, 1, 2), "Volume": 1 },
                    { Date: new Date(2023, 2, 1), "Volume": 1 }
                ],
                {x: "Date", interval: "week", y: "Volume"}),
            Plot.ruleY([0]),
            Plot.axisY({interval: 1, tickFormat: x => Math.floor(x).toString()})
        ]
      });
    div.append(plot);
}

function hideAll() {
    document.getElementById("initialText").classList.add("hidden");
    document.getElementById("alreadySeen").classList.add("hidden");
    document.getElementById("hint").classList.add("hidden");
    document.getElementById("result").classList.add("hidden");
}

const params = new URLSearchParams(window.location.search);
const word = params.get("word");
const contextLeft = params.get("contextLeft");
const contextRight = params.get("contextRight");
console.log(window.location);
Initialize(word, contextLeft, contextRight);