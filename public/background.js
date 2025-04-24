chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "add-to-prompt-manager",
    title: "Add to Prompt Manager",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "add-to-prompt-manager" && info.selectionText) {
    chrome.storage.local.set({
      tempPrompt: info.selectionText
    }, () => {
      chrome.action.openPopup();
    });
  }
}); 