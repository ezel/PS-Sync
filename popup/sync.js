// init part
const AuthType = window.WebDAV.AuthType;
const createClient = window.WebDAV.createClient;

(function init() {
    //console.debug("all config:")
    //let all_config = browser.storage.local.get().then((item)=>{console.debug(item);});

    browser.storage.local.get("webdav_conf").then((item)=>{
        let webdav_conf = item['webdav_conf'];
        if (webdav_conf) {
            document.getElementById("webdav-url").value = webdav_conf['url'] || '';
            document.getElementById("webdav-username").value = webdav_conf['username'] || '';
            document.getElementById("webdav-password").value = webdav_conf['password'] || '';
        }
    });
})();

const remote_filename = {
    "teams": "/team.txt",
    "prefs": "/preference.txt"
}
const local_div= document.getElementById("local-team");
const remote_div= document.getElementById("remote-team");
// end init part

// helper functions
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
    browser.storage.local.clear();
});

// remote download button
document.getElementById("remote-download").addEventListener("click", (e) => {
    webdav_client(async (client) => {
        if (await client.exists(remote_filename['teams']) === true) {
            var rcontent = await client.getFileContents(remote_filename['teams'], { format: "text" });
            let remote_team_info = get_team_info(rcontent);
            remote_div.data = rcontent;
            remote_div.innerText = 
                `${remote_team_info['num_teams']} Team,
                ${remote_team_info['num_pms']} Pokemon.`;
        } else {
            remote_div.innerText = 'no file on server';
        }
    });
});

// remote upload button
document.getElementById("remote-upload").addEventListener("click", async (e) => {
    webdav_client(async (client) => {
        let str = remote_div.data;
        await client.putFileContents(remote_filename['teams'], str);
    });
});

// exchange button
document.getElementById("local-remote-exchange").addEventListener("click", (e) => {
    let tmp = {
        text : local_div.innerText,
        data : local_div.data
    }
    local_div.innerText = remote_div.innerText;
    local_div.data = remote_div.data;
    remote_div.innerText = tmp['text'];
    remote_div.data = tmp['data'];
});

// local reload button
function sendMessageToTabs(tabs) {
    browser.tabs.sendMessage(
    tabs[0].id,
    {command: "reload"}
    ).then(response => {
    let local_team_info = get_team_info(response.data);
    local_div.data = response.data;
    local_div.innerText = 
        `${local_team_info['num_teams']} Team,
        ${local_team_info['num_pms']} Pokemon.`;
    }).catch((error)=>{console.error(`Error: ${error}`);});
}

document.getElementById("local-load").addEventListener("click", (e) => {
    browser.tabs.query({
        currentWindow: true,
        active: true
      }).then(sendMessageToTabs)
      .catch((error)=>{console.error(`Error: ${error}`);});
});

// local update button
document.getElementById("local-update").addEventListener("click", (e) => {
    browser.tabs.query({
        currentWindow: true,
        active: true
      }).then((tabs)=>{
        browser.tabs.sendMessage(tabs[0].id,
            {
                command: "update",
                data: local_div.data
            }
            );
      })
      .catch((error)=>{console.error(`Error: ${error}`);});
});
