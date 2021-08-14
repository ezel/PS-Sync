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
    
    function init_buttons() {
      // backup button
      let btn_backup = document.createElement('input');
      btn_backup.type = "button";
      btn_backup.value = "Backup";

      // restore button
      let btn_restore = document.createElement('input');
      btn_restore.type = "button";
      btn_restore.value = "Restore";

      // append in pane
      div_psync.appendChild(btn_backup);
      div_psync.appendChild(btn_restore);

      //check pane
      let teampane = document.getElementsByClassName('teampane');
      if (teampane.length > 0) {
        teampane[0].appendChild(div_psync);
      } else {
        let main_teams = document.getElementsByClassName('mainmenu2');
        for (let ele of main_teams) {
          ele.addEventListener("mouseup", hook_mainteam_buttons);
        }
      }
    }
    
    function hook_mainteam_buttons(e) {
      function get_close_team_btn() {
        let btns = document.getElementsByName('closeRoom');
        for (let btn of btns) {
          if (btn.value="teambuilder")
            return btn;
        }
        return null;
      }
      setTimeout(()=>{
        let teampane = document.getElementsByClassName('teampane');
        if (teampane.length > 0) {
          teampane[0].appendChild(div_psync);

          // hook close btn
          let close_btn = get_close_team_btn();
          if (close_btn) {
            close_btn.addEventListener('click', ()=>{
              let main_teams = document.getElementsByClassName('mainmenu2');
              for (let ele of main_teams) {
                ele.addEventListener("mouseup", hook_mainteam_buttons);
              }
            });
          }
        }
      },200);
      e.target.removeEventListener("mouseup", hook_mainteam_buttons);
    }
    
    init_buttons();
    

    browser.runtime.onMessage.addListener(message => {
        console.log("Message from the background script:");
        console.log(message);
        if (message.command === 'reload') {
            let data = window.localStorage.getItem('showdown_teams');
            return Promise.resolve({data: data});
        } else if (message.command === 'update') {
            let new_team = message.data;
            // update data in localStorage
            window.localStorage.setItem('showdown_teams', new_team);
            window.wrappedJSObject.Storage.loadTeams();

            // emulate click the button of selectFolder on all
            let room = window.wrappedJSObject.room;
            if (room.selectFolder) {
              room.curFolderKeep ="";
              room.curFolder ="";
              room.updateFolderList();
              room.updateTeamList(true);
              
              room.update();   // force update the data in room
            }
        }
      });
})();

//alert('content-script-loaded');
