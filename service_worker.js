chrome.contextMenus.onClicked.addListener(onLookupClicked);

chrome.runtime.onInstalled.addListener(function () {
    chrome.contextMenus.create({
        title: "look up",
        contexts: ["selection"],
        id: "selection"
    });
});

async function onLookupClicked(info) {
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: lookupWord,
        args: [ info.selectionText ]
    });
}

function lookupWord(text) {
    const div = document.createElement("div");
    div.style.width = '150px';
    div.style.height = '150px';
    div.style.background = "red";
    div.style.position = "fixed";

    document.body.appendChild(div);
}