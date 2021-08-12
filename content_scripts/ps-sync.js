(function() {
    /**
     * Check and set a global guard variable.
     * If this content script is injected into the same page again,
     * it will do nothing next time.
     */
    if (window.hasRun) {
      return;
    }
    window.hasRun = true;
    
    function add_buttons() {
    }
    
    browser.runtime.onMessage.addListener(message => {
        console.log("Message from the background script:");
        console.log(message);
        if (message.command === 'reload') {
            let data = window.localStorage.getItem('showdown_teams');
            return Promise.resolve({data: data});
        } else if (message.command === 'update') {
            let new_team = message.data;
            window.wrappedJSObject.Storage.loadPackedTeams(new_team);
            window.localStorage.setItem('showdown_teams', new_team);
        }
      });
})();

//alert('content-script-loaded');