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
    console.log(browser);
    
    browser.runtime.onMessage.addListener(message => {
        console.log("Message from the background script:");
        console.log(message);
        if (message.command === 'reload') {
            //let data = window.localStorage.showdown_teams
            return Promise.resolve({data: window.localStorage.showdown_teams});
        } else if (message.command === 'update') {
            message.data
        }
      });
})();

//alert('content-script-loaded');
