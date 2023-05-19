function Initialize(word) {
    const header = document.getElementById("header");
    header.innerText = word;

    const paragraph = document.getElementById("paragraph");
    paragraph.innerText = "You haven't seen this word before! Would you like to look it up?";
}

async function GetWord(word) {
    const response = await fetch("https://jisho.org/api/v1/search/words?keyword=" + encodeURIComponent(word));
    const jsonData = await response.json();
    console.log(jsonData);
}

function closeClicked() {
    window.parent.postMessage("close", "*");
}

document.getElementById('closeButton').addEventListener('click', closeClicked);

const word = new URLSearchParams(window.location.search).get("word");
Initialize(word);
//GetWord(word);