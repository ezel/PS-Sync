const archives_filename = "/arch.txt";
//const browser = chrome;
// helper
/* parse the team string, return
   {
    "displayable": [{TeamName, FormatName, TeamNameWithFormat, PMNames[], IconNames[], raw}],
    "text-only": [{TeamNameWithFormat, raw}]
   }
*/ 
function parse_team_info(teamString) {
    function gen5name(src) {
        var gen5 = src.split(' ').join('').toLowerCase();
        gen5 = gen5.replace('-', '#');
        gen5 = gen5.replace(/-/g, '');
        gen5 = gen5.replace('#', '-');
    
        gen5 = gen5.replace('(male)','').replace('(female)','-f')
        gen5 = gen5.replace(')','').replace('(','-')
    
        return gen5;
    }
    
    let results = {"displayable":[],"text-only":[]};
    let teamStrArray = teamString.split('\n');
    infos = teamStrArray.map((i)=>{
        let team = i.split('|');
        return {nameWithFormat: team[0], splitLen: team.length, data: team.splice(1), raw:i};
    });

    for (let team of infos) {
        if (team.splitLen == 68) { // assume is a valid team full of 6 pms
            let res = {TeamNameWithFormat: team.nameWithFormat, TeamName:'', FormatName:'', PMNames:[], IconNames:[], raw: team.raw};
            // parse name, format
            let formatPos = team.nameWithFormat.indexOf(']');
            if ( formatPos > 0) {
                res.TeamName = team.nameWithFormat.substring(formatPos+1, team.nameWithFormat.length);
                res.FormatName = team.nameWithFormat.substring(0, formatPos);
            } else {
                res.TeamName = team.nameWithFormat;
            }
            // parse pm names and icons
            for (let i=0; i<68-11; i+=11) {
                let tmp = team.data[i];
                let name = tmp.substring(tmp.indexOf(']')+1, tmp.length);
                res.PMNames.push(name);
                res.IconNames.push(gen5name(name));
            }
            results.displayable.push(res);
        } else {
            results["text-only"].push({TeamNameWithFormat: team.nameWithFormat, raw: team.raw});
        }
    }
    return results;
}

function handle_unarchive(team) {
    return (e)=>{
        //alert('click unarchive team:'+team.TeamNameWithFormat);
        alert('unarchive with raw:'+team.raw.length);
        
        browser.tabs.query({
            currentWindow: true,
            active: true
        }).then((tabs)=>{
            console.log('sending message');
            browser.tabs.sendMessage(tabs[0].id,
                {
                    command: "unarchive",
                    data: team.raw
                });
            console.log('sendt message');
/*             browser.notifications.create("PokemonShowdown Sync", {
                "type": "basic",
                "iconUrl": "../icons/s1.png",
                "title": "Unarchive team",
                "message": `${team.FormatName} team: ${team.TeamName} unarchived.`
            });   */

        }).catch((error)=>{console.error(`Error@sync-upload: ${error}`);});
    };
}

function handle_remove_remote(team) {
    return (e)=>{
        alert('click remove team:'+team.TeamNameWithFormat);
        alert(team.raw);
    };
}

// load team button: download team
document.getElementById("arv-download").addEventListener("click", (e) => {
    // get remote webdav file info
    webdav_client(async (client) => {
        if (await client.exists(archives_filename) === true) {
            // download data from remote webdav
            var remote_content = await client.getFileContents(archives_filename, { format: "text" });
            let remote_arv_info = parse_team_info(remote_content);
                
            //console.log(remote_arv_info);
            const ul = document.getElementById('arv-teams');
            ul.innerHTML = '';  // clear
            //
            // append displayable team
            for (let team of remote_arv_info.displayable) {
                let li = document.createElement('li');
                li.innerHTML = `<span class="arv-team-name">${team.TeamName}</span><span class="arv-team-format">(${team.FormatName})</span>`;
                let p = document.createElement('p');
                p.className = 'arv-team-preview';
                for (let i=0; i<team.PMNames.length; i++) {
                    let img = document.createElement('img');
                    //img.src = `https://play.pokemonshowdown.com/sprites/gen5/${team.IconNames[i]}.png`
                    img.alt = team.PMNames[i];
                    p.appendChild(img);
                }
                let unarchiveBtn = document.createElement('input');
                unarchiveBtn.type = "button";
                unarchiveBtn.className = "arv-un-btn";
                unarchiveBtn.value = 'Unarchive';
                unarchiveBtn.addEventListener('click', handle_unarchive(team));
                let removeBtn = document.createElement('input');
                removeBtn.type = "button";
                removeBtn.className = "arv-rm-btn";
                removeBtn.value = 'Remove';
                removeBtn.addEventListener('click', handle_remove_remote(team));
                p.appendChild(unarchiveBtn);
                p.appendChild(removeBtn);
                li.appendChild(p);
                ul.appendChild(li);
            };

            // append text-only team
            for (let team of remote_arv_info['text-only']) {
                let li = document.createElement('li');
                li.innerText = team.TeamNameWithFormat;
                let p = document.createElement('p');
                let unarchiveBtn = document.createElement('input');
                unarchiveBtn.type = "button";
                unarchiveBtn.className = "arv-un-btn";
                unarchiveBtn.value = 'Unarchive';
                unarchiveBtn.addEventListener('click', handle_unarchive(team));
                let removeBtn = document.createElement('input');
                removeBtn.type = "button";
                removeBtn.className = "arv-rm-btn";
                removeBtn.value = 'Remove';
                removeBtn.addEventListener('click', handle_remove_remote(team));
                p.appendChild(unarchiveBtn);
                p.appendChild(removeBtn);
                li.appendChild(p);
                ul.appendChild(li);
            };
        } else {
            sync_div.innerText = 'no archived file on webdav!';
        }
    });
});