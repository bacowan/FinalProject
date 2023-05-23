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
        func: lookupWord
        //args: [ info.selectionText ]
    });
}

function lookupWord() {
    const sentenceEndingRegex = /[。！？\n]/;
    
    // get the selected text and context
    const selection = window.getSelection();
    const text = selection.toString();
    const context = getContext(selection);

    // create the html
    var iframe = document.createElement("iframe");
    let url = chrome.runtime.getURL("dialog.html") + "?word=" + encodeURIComponent(text);
    if (context != null) {
        url += "&context=" + encodeURIComponent(context);
    }
    iframe.src = url;
    var dialog = document.createElement("dialog");
    dialog.appendChild(iframe);
    document.body.appendChild(dialog);
    dialog.showModal();

    // set up events for closing the dialog
    function closeDialogEventListener(event) {
        dialog.close();
    }

    dialog.addEventListener("close", (event) => {
        window.removeEventListener("message", closeDialogEventListener);
    });
    window.addEventListener("message", closeDialogEventListener);


    // Helper functions
    function getContext(selection) {
        const initialNode = selection.anchorNode;
        if (initialNode.nodeType === Node.TEXT_NODE) {
    
            // look through all siblings, then through parents' siblings, etc. for anything to the left
            let leftContextSplit = getLeftContextFromText(initialNode.textContent.substring(0, selection.anchorOffset));
            let leftContext = leftContextSplit.context;
            let currentNode = initialNode;
            
            while (!leftContextSplit.splitFound && !isTextContainerElement(currentNode)) {
                if (currentNode.previousSibling == null) {
                    currentNode = currentNode.parentNode;
                }
                else {
                    currentNode = currentNode.previousSibling;
                    leftContextSplit = getLeftContextFromText(currentNode.textContent);
                    leftContext = leftContextSplit.context + leftContext;
                }
            }
    
            // repeat for the right
            let rightContextSplit = getRightContextFromText(initialNode.textContent.substring(selection.anchorOffset + selection.toString().length));
            let rightContext = rightContextSplit.context;
            currentNode = initialNode;
    
            // look through all siblings, then through parents' siblings, etc. for anything to the left
            while (!rightContextSplit.splitFound && !isTextContainerElement(currentNode)) {
                if (currentNode.nextSibling == null) {
                    currentNode = currentNode.parentNode;
                }
                else {
                    currentNode = currentNode.nextSibling;
                    rightContextSplit = getRightContextFromText(currentNode.textContent);
                    rightContext = rightContext + rightContextSplit.context;
                }
            }
    
            return leftContext + selection.toString() + rightContext;
        }
        else {
            return null;
        }
    }

    function isTextContainerElement(currentNode) {
        return ["H1","H2","H3","H4","H5","H6","P","DIV"].includes(currentNode.nodeName);
    }

    function getLeftContextFromText(text) {
        if (sentenceEndingRegex.test(text)) {
            const splitText = text.split(sentenceEndingRegex);
            return {
                context: splitText[splitText.length - 1],
                splitFound: true
            };
        }
        else {
            return {
                context: text,
                splitFound: false
            };
        }
    }

    function getRightContextFromText(text) {
        if (sentenceEndingRegex.test(text)) {
            const splitText = text.split(sentenceEndingRegex);
            return {
                context: splitText[0],
                splitFound: true
            };
        }
        else {
            return {
                context: text,
                splitFound: false
            };
        }
    }
}