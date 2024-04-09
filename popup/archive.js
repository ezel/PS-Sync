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
  let results = { displayable: [], "text-only": [] };
  let teamStrArray = teamString.split("\n");
  infos = teamStrArray.map((i) => {
    let team = i.split("|");
    return {
      nameWithFormat: team[0],
      splitLen: team.length,
      data: team.splice(1),
      raw: i,
    };
  });

  for (let team of infos) {
    if (team.splitLen == 68) {
      // assume is a valid team full of 6 pms
      let res = {
        TeamNameWithFormat: team.nameWithFormat,
        TeamName: "",
        FormatName: "",
        PMNames: [],
        IconNames: [],
        raw: team.raw,
      };
      // parse name, format
      let formatPos = team.nameWithFormat.indexOf("]");
      if (formatPos > 0) {
        res.TeamName = team.nameWithFormat.substring(
          formatPos + 1,
          team.nameWithFormat.length
        );
        res.FormatName = team.nameWithFormat.substring(0, formatPos);
      } else {
        res.TeamName = team.nameWithFormat;
      }
      // parse pm names and icons
      for (let i = 0; i < 68 - 11; i += 11) {
        let tmp = team.data[i];
        let name = tmp.substring(tmp.indexOf("]") + 1, tmp.length);
        res.PMNames.push(name);
        res.IconNames.push(name);
      }
      results.displayable.push(res);
    } else {
      results["text-only"].push({
        TeamNameWithFormat: team.nameWithFormat,
        raw: team.raw,
      });
    }
  }
  return results;
}

function handle_unarchive(team) {
  return (e) => {
    browser.tabs
      .query({
        currentWindow: true,
        active: true,
      })
      .then((tabs) => {
        browser.tabs.sendMessage(tabs[0].id, {
          command: "unarchive",
          data: team.raw,
        });
        browser.notifications.create("PokemonShowdown Sync", {
          type: "basic",
          iconUrl: "../icons/s1.png",
          title: "Unarchive team",
          message: `${team.FormatName} team: ${team.TeamName} unarchived.`,
        });
      })
      .catch((error) => {
        console.error(`Error@sync-upload: ${error}`);
      });
  };
}

function handle_remove_remote(team) {
  return (e) => {
    //console.log('click remove team:'+team.raw);
    webdav_client(async (client) => {
      let exist_content = await client.getFileContents(archives_filename, {
        format: "text",
      });
      exist_content = exist_content.replace(team.raw + "\n", "");
      await client.putFileContents(archives_filename, exist_content);
    });
    // remove the team div
    let li = e.target.parentNode.parentNode;
    if (li.tagName === "LI") li.replaceWith("");
  };
}

// copy from backup button: merge backup to archive
document.getElementById("arv-cp").addEventListener("click", (e) => {
  const ul = document.getElementById("arv-teams");
  ul.innerHTML = ""; // clear

  webdav_client(async (client) => {
    if ((await client.exists(archives_filename)) === true) {
      // do the merge
      let append_content = await client.getFileContents(
        remote_filename["teams"],
        { format: "text" }
      );
      let exist_content = await client.getFileContents(archives_filename, {
        format: "text",
      });
      // is a new team ?
      let exist_teams = exist_content.split("\n");
      let append_teams = append_content.split("\n");
      let append_count = 0;
      for (let new_team of append_teams) {
        if (exist_teams.indexOf(new_team) < 0) {
          // check is a new team
          exist_content += "\n" + new_team;
          append_count += 1;
        }
      }
      await client.putFileContents(archives_filename, exist_content);

      browser.notifications.create("PokemonShowdown Sync", {
        type: "basic",
        iconUrl: "../icons/s1.png",
        title: "Archive team",
        message: `${append_count} new team archived.`,
      });
    } else {
      // just copy
      if ((await client.exists(remote_filename["teams"])) === true) {
        // just do the copy
        await client.copyFile(remote_filename["teams"], archives_filename);
        browser.notifications.create("PokemonShowdown Sync", {
          type: "basic",
          iconUrl: "../icons/s1.png",
          title: "Archive team",
          message: `All backup team archived.`,
        });
      } else {
        // alert
        alert("There is no team data on remote, please backup first");
      }
    }
  });
});

// load team button: download team
document.getElementById("arv-download").addEventListener("click", (e) => {
  // get remote webdav file info
  webdav_client(async (client) => {
    if ((await client.exists(archives_filename)) === true) {
      // download data from remote webdav
      var remote_content = await client.getFileContents(archives_filename, {
        format: "text",
      });
      let remote_arv_info = parse_team_info(remote_content);

      //console.log(remote_arv_info);
      const ul = document.getElementById("arv-teams");
      ul.innerHTML = ""; // clear
      //
      // append displayable team
      for (let team of remote_arv_info.displayable) {
        let li = document.createElement("li");
        li.innerHTML = `<span class="arv-team-name">${team.TeamName}</span><span class="arv-team-format">(${team.FormatName})</span>`;
        let p = document.createElement("p");
        p.className = "arv-team-preview";
        for (let i = 0; i < team.PMNames.length; i++) {
          let img = document.createElement("img");
          //img.src = `https://play.pokemonshowdown.com/sprites/gen5/${team.IconNames[i]}.png`
          img.alt = team.PMNames[i];
          //p.appendChild(img);
        }
        let unarchiveBtn = document.createElement("input");
        unarchiveBtn.type = "button";
        unarchiveBtn.className = "arv-un-btn";
        unarchiveBtn.value = "Unarchive";
        unarchiveBtn.addEventListener("click", handle_unarchive(team));
        let removeBtn = document.createElement("input");
        removeBtn.type = "button";
        removeBtn.className = "arv-rm-btn";
        removeBtn.value = "Remove";
        removeBtn.addEventListener("click", handle_remove_remote(team));
        p.appendChild(unarchiveBtn);
        p.appendChild(removeBtn);
        li.appendChild(p);
        ul.appendChild(li);
      }

      // append text-only team
      for (let team of remote_arv_info["text-only"]) {
        let li = document.createElement("li");
        li.innerText = team.TeamNameWithFormat;
        let p = document.createElement("p");
        let unarchiveBtn = document.createElement("input");
        unarchiveBtn.type = "button";
        unarchiveBtn.className = "arv-un-btn";
        unarchiveBtn.value = "Unarchive";
        unarchiveBtn.addEventListener("click", handle_unarchive(team));
        let removeBtn = document.createElement("input");
        removeBtn.type = "button";
        removeBtn.className = "arv-rm-btn";
        removeBtn.value = "Remove";
        removeBtn.addEventListener("click", handle_remove_remote(team));
        p.appendChild(unarchiveBtn);
        p.appendChild(removeBtn);
        li.appendChild(p);
        ul.appendChild(li);
      }
    } else {
      sync_div.innerText = "no archived file on webdav!";
    }
  });
});
