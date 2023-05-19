async function GetWord(word) {
    const response = await fetch("https://jisho.org/api/v1/search/words?keyword=" + encodeURIComponent(word));
    const jsonData = await response.json();
    console.log(jsonData);
}

GetWord(new URLSearchParams(window.location.search).get("word"));