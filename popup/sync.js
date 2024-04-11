// init part
const AuthType = window.WebDAV.AuthType;
const createClient = window.WebDAV.createClient;

const browser = chrome;

(function init() {
    browser.storage.local.get("webdav_conf").then((item)=>{
        let webdav_conf = item['webdav_conf'];
        if (webdav_conf) {
            document.getElementById("webdav-url").value = webdav_conf['url'] || '';
            document.getElementById("webdav-username").value = webdav_conf['username'] || '';
            document.getElementById("webdav-password").value = webdav_conf['password'] || '';
            update_synctime();
        }
    });
    
    // display sync buttons
    browser.tabs.query({
        currentWindow: true,
        active: true
        }).then(tabs=>{
            // only show the sync buttons on PS site
            if (tabs && tabs[0] && tabs[0].url && tabs[0].url.match(/play.pokemonshowdown.com/)) {
                //if (typeof browser.runtime.getBrowserInfo === "undefined") // not firefox
                    //{ browser.tabs.executeScript({file: "/popup/browser-polyfill.min.js"}); }
                //browser.tabs.executeScript({file: "/content_scripts/ps-sync.js"})
                //.then((e)=>{
                    let hiddenTags = document.getElementsByClassName('hidden');
                    for (let i=hiddenTags.length-1; i>=0; i--) {
                        hiddenTags[i].classList.remove('hidden');
                    }
                    
                //})
                //.catch(onErrorItem);
            }
    });

})();

const remote_filename = {
    "teams": "/team.txt",
    "prefs": "/preference.txt"
}
const sync_div = document.getElementById("synctime");
// end init part

// helper functions
function onErrorItem(error) { // assert correct
    alert(`Catch Error: ${error}`);
    console.error(error);
}

function update_synctime(force_remote=false) {
    function fetch_from_remote() {
        //console.debug('fetch from remote');
        webdav_client(async (client) => {
            let synctime;
            try {
                let file_info = await client.getDirectoryContents(remote_filename['teams']);
                // ensure file exist
                synctime = file_info[0]['lastmod'];
            }
            catch {
                synctime = 'no backup file on webdav!';
            }
            browser.storage.local.set({"synctime": synctime})
                .then(update_synctime);
        });
    }
    
    //console.log('pull sync time');
    if (force_remote===true) {
        fetch_from_remote();
    } else {
        browser.storage.local.get("synctime")
        .then(
            // has synctime in storage
            (item)=>{
                let synctime= item['synctime'];
                if (synctime) {
                    document.getElementById("synctime").innerText = synctime;
                } else {
                    // no local storage found
                    // fetch synctime from remote
                    fetch_from_remote();
                }
            },
            onErrorItem
        );
    }
}

function webdav_client(handle_client) {
    browser.storage.local.get("webdav_conf").then((item)=>{
        let webdav_conf = item['webdav_conf'];
        client = createClient(webdav_conf.url, {
            authType: AuthType.Password,
            username: webdav_conf.username,
            password: webdav_conf.password
        });
        // ensure client is success
        handle_client(client);
    });
}

function get_team_info(teams) {
    let info = {};
    info['num_teams'] = (teams.match(/\n/g) || [] ).length+1;
    info['num_pms'] = (teams.match(/]/g) || [] ).length;
    return info;
}

// button listener part
// test button
document.getElementById("remote-test").addEventListener("click", async (e) => {
    var webdav_conf = {
        "url": document.getElementById("webdav-url").value,
        "username": document.getElementById("webdav-username").value,
        "password": document.getElementById("webdav-password").value
    };
    let client = createClient(webdav_conf.url, {
	    authType: AuthType.Password,
	    username: webdav_conf.username,
	    password: webdav_conf.password
    });
    let testResult = await client.getDirectoryContents("/")
        .catch((e)=>{alert("WebDav Test Error:\n"+e.message);});
    if (testResult) {
        alert("WebDav Connected!");
        browser.storage.local.set({"webdav_conf": webdav_conf});
    }
    e.preventDefault();
});

// clear button
document.getElementById("remote-clear").addEventListener("click", (e) => {
    if (confirm('remove all extension storage?') === true) {
        browser.storage.local.clear();
    } else {
        e.preventDefault();
    }
});

// sync backup button: upload to remote
document.getElementById("sync-download").addEventListener("click", (e) => {
    // query tab to get localstorage
    browser.tabs.query({
        currentWindow: true,
        active: true
    }).then(tabs=>{
        browser.tabs.sendMessage(
            tabs[0].id,
            {command: "reload"}
        ).then(response => {
            let local_team_info = get_team_info(response.data);
            
            // upload to remote webdav
            webdav_client(async (client) => {
                let str = response.data;
                await client.putFileContents(remote_filename['teams'], str);
                update_synctime(true);
                let noti_msg = `${local_team_info['num_teams']} team,\nwith ${local_team_info['num_pms']} pokemon.`;
                browser.notifications.create("PokemonShowdown Sync", {
                    "type": "basic",
                    "iconUrl": "../icons/s1.png",
                    "title": "Backuping team Completed!",
                    "message": noti_msg
                });
            });
            }).catch((error)=>{console.error(`Error: ${error}`);});
    }).catch((error)=>{console.error(`Error@sync-download: ${error}`);});
});

// sync restore button: download to local
document.getElementById("sync-upload").addEventListener("click", (e) => {
    // get remote webdav file info
    webdav_client(async (client) => {
        if (await client.exists(remote_filename['teams']) === true) {
            // download data from remote webdav
            var remote_content = await client.getFileContents(remote_filename['teams'], { format: "text" });
            let remote_team_info = get_team_info(remote_content);
            
            if ((document.getElementById('setting1').checked && confirm('restore from remote?')=== true)
                || (document.getElementById('setting1').checked === false)) {
                
                // save data to PS
                browser.tabs.query({
                    currentWindow: true,
                    active: true
                }).then((tabs)=>{
                    browser.tabs.sendMessage(tabs[0].id,
                        {
                            command: "update",
                            data: remote_content
                        });
                    browser.notifications.create("PokemonShowdown Sync", {
                        "type": "basic",
                        "iconUrl": "../icons/s1.png",
                        "title": "Restoring team Completed!",
                        "message": `${remote_team_info['num_teams']} team,\n${remote_team_info['num_pms']} pokemon.`
                    });
                }).catch((error)=>{console.error(`Error@sync-upload: ${error}`);});
            }
        } else {
            sync_div.innerText = 'no backup file on webdav!';
        }
    });
});