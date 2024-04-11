//alert("content-script-loaded");

function injectAndRemoveScript(file_path, tag) {
  var node = document.getElementsByTagName(tag)[0];
  var script = document.createElement("script");
  script.setAttribute("type", "text/javascript");
  script.setAttribute("src", file_path);
  node.appendChild(script);
  setTimeout(() => {
    script.parentNode.removeChild(script);
  }, 0);
}

(function () {
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;

  const browser = chrome;

  // message handler for popup extension
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    //console.log("====> Message from the background script:");
    //console.log(message);

    if (message.command === "reload") {
      let data = window.localStorage.getItem("showdown_teams");
      sendResponse({data: data});
      return true;
    } else if (message.command === "update") {
      let new_team = message.data;
      // update data in localStorage

      window.localStorage.setItem("showdown_teams", new_team);
      injectAndRemoveScript(
        chrome.runtime.getURL("content_scripts/refreshTeam.js"),
        "body"
      );
    } else if (message.command === "unarchive") {
      let append_team = message.data;
      window.localStorage.setItem(
        "showdown_teams",
        window.localStorage.getItem("showdown_teams") + "\n" + append_team
      );
      injectAndRemoveScript(
        chrome.runtime.getURL("content_scripts/refreshTeam.js"),
        "body"
      );
    }
  });
})();
