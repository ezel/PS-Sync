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
    //alert('init-script-running');

    browser.runtime.onMessage.addListener(message => {
        //console.debug("Message from the background script:");
        //console.debug(message);
        if (message.command === 'reload') {
            let data = window.localStorage.getItem('showdown_teams');
            return Promise.resolve({data: data});
        } else if (message.command === 'update') {
            let new_team = message.data;
            // update data in localStorage
            window.localStorage.setItem('showdown_teams', new_team);

            // cross-browser use inject
            // create inject tag
            var inject_tag = document.createElement('script');
            inject_tag.textContent = `( function(){
              window.Storage.loadTeams();
              let room = window.room;
              if (room.selectFolder) {
                room.curFolderKeep ="";
                room.curFolder ="";
                room.updateFolderList();
                room.updateTeamList(true);
                
                room.update();  
              }
            })()`;
            //console.debug(inject_tag.textContent);
            // add and remove inject tag
            (document.head || document.documentElement).appendChild(inject_tag);
            inject_tag.parentNode.removeChild(inject_tag);
        }
      });
})();

//alert('content-script-loaded');
