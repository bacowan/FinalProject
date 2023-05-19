function Initialize(word) {
    // events
    document.getElementById('closeButton').addEventListener('click', closeClicked);
    document.getElementById('lookupButton').addEventListener('click', async () => await lookupClicked(word));

    // content
    const header = document.getElementById("header");
    header.innerText = word;
    const paragraph = document.getElementById("shouldLookupParagraph");
    paragraph.innerText = "You haven't seen this word before! Would you like to look it up?";
}

function closeClicked() {
    window.parent.postMessage("close", "*");
}

async function lookupClicked(word) {
    // show the loading spinner
    const initialText = document.getElementById("initialText");
    initialText.classList.add("hidden");
    const loadingSpinner = document.getElementById("loadingSpinner");
    loadingSpinner.classList.remove("hidden");

    // load the data
    const response = await fetch("https://jisho.org/api/v1/search/words?keyword=" + encodeURIComponent(word));
    const jsonData = await response.json();

    // hide the loading sinner
    loadingSpinner.classList.add("hidden");
    const resultDiv = document.getElementById("result");
    resultDiv.classList.remove("hidden");

    // show the response
    const definition = GetDefinitionFromResult(jsonData, word);
    const definitionDiv = document.getElementById("definition");
    if (typeof definition === 'string') {
        definitionDiv.innerText = definition;
    }
    else {
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

const word = new URLSearchParams(window.location.search).get("word");
Initialize(word);