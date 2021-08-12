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
            remote_div.innerText = rcontent;
        } else {
            remote_div.innerText = 'no file on server';
        }
    });
});

// remote upload button
document.getElementById("remote-upload").addEventListener("click", async (e) => {
    webdav_client(async (client) => {
        let str = 'some data'
        await client.putFileContents(remote_filename['teams'], str);
    });
});

// local reload button
function sendMessageToTabs(tabs) {
    browser.tabs.sendMessage(
    tabs[0].id,
    {command: "reload"}
    ).then(response => {
    console.log("Message from the content script:");
    alert(response.response);
    }).catch((error)=>{console.error(`Error: ${error}`);});
}

document.getElementById("local-load").addEventListener("click", async (e) => {
    browser.tabs.query({
        currentWindow: true,
        active: true
      }).then(sendMessageToTabs)
      .catch((error)=>{console.error(`Error: ${error}`);});
});

// local update button
document.getElementById("local-update").addEventListener("click", async (e) => {

});
