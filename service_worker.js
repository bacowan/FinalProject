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
    iframe.style.userSelect = "none";
    iframe.style.height = "100%";
    iframe.style.width = "100%";
    let url = chrome.runtime.getURL("dialog.html") + "?word=" + encodeURIComponent(text);
    if (context != null) {
        url += "&contextLeft=" + encodeURIComponent(context.left) + "&contextRight=" + encodeURIComponent(context.right);
    }
    iframe.src = url;
    var dialog = document.createElement("dialog");
    dialog.style.padding = 11;
    dialog.style.overflow = "hidden";
    dialog.appendChild(iframe);
    setupDrag(dialog, iframe);
    setupResize(dialog);
    document.body.appendChild(dialog);
    dialog.showModal();

    const dialogRect = dialog.getBoundingClientRect();
    const left = dialogRect.left + "px";
    const top = dialogRect.top + "px";
    console.log(top);
    console.log(left);
    dialog.style.margin = 0;
    dialog.style.left = left;
    dialog.style.top = top;

    // set up events for closing the dialog
    function closeDialogEventListener(event) {
        dialog.close();
        dialog.remove();
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

            return {
                left: leftContext,
                right: rightContext
            };
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

    // see https://stackoverflow.com/a/24050777
    function setupDrag(element, iframe) {
        var isDown = false;
        var offset = [0,0];
        element.addEventListener('mousedown', function(e) {
            const elementRect = element.getBoundingClientRect();
            const styles = window.getComputedStyle(element);
            const topPadding = parseInt(styles.paddingTop);
            console.log(topPadding);
            if (elementRect.x < e.clientX && elementRect.x + elementRect.width >= e.clientX
                && elementRect.y < e.clientY && elementRect.y + topPadding >= e.clientY) {
                    iframe.style.pointerEvents = "none";
                    isDown = true;
                    offset = [
                        element.offsetLeft - e.clientX,
                        element.offsetTop - e.clientY
                    ];
                }
        }, true);
        
        element.addEventListener('mouseup', function() {
            iframe.style.pointerEvents = "auto";
            isDown = false;
        }, true);
        
        element.addEventListener('mousemove', function(event) {
            event.preventDefault();
            if (isDown) {
                mousePosition = {
                    x : event.clientX,
                    y : event.clientY
        
                };
                element.style.left = (mousePosition.x + offset[0]) + 'px';
                element.style.top  = (mousePosition.y + offset[1]) + 'px';
            }
        }, true);
    }

    function setupResize(element) {
        element.style.resize = "both";
    }
}