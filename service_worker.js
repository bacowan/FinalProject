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
    var iframe = document.createElement("iframe");
    iframe.src = chrome.runtime.getURL("dialog.html") + "?word=" + encodeURIComponent(text);
    var dialog = document.createElement("dialog");
    dialog.appendChild(iframe);
    /*var button = document.createElement("button");
    button.textContent = "Close";
    iframe.appendChild(button);
    button.addEventListener("click", function() {
        dialog.close();
    });*/
    document.body.appendChild(dialog);
    dialog.showModal();
}