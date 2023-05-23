async function Initialize(word, context) {
    // events
    document.getElementById('closeButton').addEventListener('click', closeClicked);
    document.getElementById('lookupButton').addEventListener('click', async () => await lookupClicked(word, context));
    document.getElementById('hintButton').addEventListener('click', async () => await showHintClicked(word));

    // header
    const header = document.getElementById("header");
    header.innerText = word;

    // initial content will be based on if this word has been seen before
    let lookup = (await chrome.storage.local.get(word))[word];
    if (lookup == null || lookup.lookupCount == null || lookup.lookupCount === 0) {
        // this is the first time we've seen this word
        const initialText = document.getElementById("initialText");
        initialText.classList.remove("hidden");
    }
    else {
        // we've seen this word already
        const alreadySeen = document.getElementById("alreadySeen");
        alreadySeen.classList.remove("hidden");
    }
}

function closeClicked() {
    window.parent.postMessage("close", "*");
}

async function showHintClicked(word) {
    const alreadySeen = document.getElementById("alreadySeen");
    alreadySeen.classList.add("hidden");
    const hintDiv = document.getElementById("hint");
    hintDiv.classList.remove("hidden");
    const contextParagraph = document.getElementById("contextParagraph");

    const lookup = (await chrome.storage.local.get(word))[word];

    if (lookup != null && Array.isArray(lookup.context) && lookup.context.length > 0) {
        contextParagraph.innerText = lookup.context[0];
    }
    else {
        // TODO: Error handling
    }
}

async function lookupClicked(word, context) {
    // show the loading spinner
    const initialText = document.getElementById("initialText");
    initialText.classList.add("hidden");
    const loadingSpinner = document.getElementById("loadingSpinner");
    loadingSpinner.classList.remove("hidden");

    // load the data
    const response = await fetch("https://jisho.org/api/v1/search/words?keyword=" + encodeURIComponent(word));
    const jsonData = await response.json();
    // store the word history
    await StoreWordHistory(word, context);

    // hide the loading spinner
    loadingSpinner.classList.add("hidden");
    const resultDiv = document.getElementById("result");
    resultDiv.classList.remove("hidden");

    // show the response
    const definition = GetDefinitionFromResult(jsonData, word);
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

function GetDefinitionFromResult(jsonData, word) {
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

async function StoreWordHistory(word, context) {
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

    wordData.lookupCount++;
    wordData.context.push(context);
    // TODO: max number of contexts? Maybe filter out old contexts.

    await chrome.storage.local.set({ [word]: wordData });
}

const params = new URLSearchParams(window.location.search);
const word = params.get("word");
const context = params.get("context");
console.log(window.location);
Initialize(word, context);