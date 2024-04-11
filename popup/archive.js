const archives_filename = "/arch.txt";
//const browser = chrome;
console.log(PSIcons);
// helper
function getPokemonIcon(pokemonString) {
  //const resourcePrefex = 'popup';
  function getPokemonIconNum(id) {
    let num = 0;
    if (PSIcons.BattlePokemonSprites?.[id]?.num) {
      num = PSIcons.BattlePokemonSprites[id].num;
    } else if (PSIcons.BattlePokedex?.[id]?.num) {
      num = PSIcons.BattlePokedex[id].num;
    }
    if (num < 0) num = 0;
    if (num > 1025) num = 0;

    if (PSIcons.BattlePokemonIconIndexes?.[id]) {
      num = PSIcons.BattlePokemonIconIndexes[id];
    }
    return num;
  }

  let id = ("" + pokemonString).toLowerCase().replace(/[^a-z0-9]+/g, "");

  let num = getPokemonIconNum(id);

  let top = Math.floor(num / 12) * 30;
  let left = (num % 12) * 40;
  return `background:transparent url(pokemonicons-sheet.png?v16) no-repeat scroll -${left}px -${top}px`;
}

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
  results["num_teams"] = (teamString.match(/\n/g) || []).length + 1;
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
        console.error(`Error@archive: ${error}`);
      });
  };
}

function handle_remove_remote(team) {
  return (e) => {
    webdav_client(async (client) => {
      let exist_content = await client.getFileContents(archives_filename, {
        format: "text",
      });
      //console.log('try remove:'+team.raw.length);
      let tryRemoveContent = exist_content.replace(team.raw + "\n", "");
      if (tryRemoveContent.length < exist_content.length) {
        exist_content = tryRemoveContent;
      } else {
        exist_content = exist_content.replace(team.raw, "");
        exist_content = exist_content.trimEnd();
      }
      await client.putFileContents(archives_filename, exist_content);
    });
    // remove the team div
    let li = e.target.parentNode.parentNode;
    if (li.tagName === "LI") li.replaceWith("");
  };
}

// append selected button: select team to archive
document.getElementById("arv-p").addEventListener("click", async (e) => {
  const ul = document.getElementById("arv-teams");
  ul.innerHTML = ""; // clear

  let curTeams = await browser.tabs
    .query({ currentWindow: true, active: true })
    .then((tabs) => {
      return browser.tabs.sendMessage(tabs[0].id, { command: "reload" });
    });
  let popupWindow = window.open(
    "",
    "",
    "popup=1,width=320,height=400,top=0,left=0"
  );

  let popupForm = document.createElement("form");
  // init a checkbox form with submit button
  let local_arv_info = parse_team_info(curTeams.data);
  // append displayable team
  for (let team of local_arv_info.displayable) {
    let oneTeamDiv = document.createElement("div");
    oneTeamDiv.style = "display:block;clear:both";
    let input = document.createElement("input");
    input.type = "checkbox";
    input.name = team.TeamNameWithFormat;
    input.id = team.TeamNameWithFormat;
    input.value = team.raw;
    oneTeamDiv.appendChild(input);
    let label = document.createElement("label");
    label.setAttribute("for", input.id);
    label.innerText = `${team.TeamName} - ${team.FormatName}`;
    let previewDiv = document.createElement("div");
    for (let i = 0; i < team.PMNames.length; i++) {
      let span1 = document.createElement("span");
      span1.style = `display:inline-block;width: 40px;height:30px;margin: 0 -3px;float:left;overflow:visible;${getPokemonIcon(
        team.IconNames[i]
      )}`;
      previewDiv.appendChild(span1);
    }
    label.appendChild(previewDiv);
    oneTeamDiv.appendChild(label);
    popupForm.appendChild(oneTeamDiv);
  }

  // append text-only team
  for (let team of local_arv_info["text-only"]) {
    let oneTeamDiv = document.createElement("div");
    oneTeamDiv.style = "display:block;clear:both";
    let input = document.createElement("input");
    input.type = "checkbox";
    input.name = team.TeamNameWithFormat;
    input.id = team.TeamNameWithFormat;
    input.value = team.raw;
    let label = document.createElement("label");
    label.setAttribute("for", input.id);
    label.innerText = team.TeamNameWithFormat;
    oneTeamDiv.appendChild(input);
    oneTeamDiv.appendChild(label);
    popupForm.appendChild(oneTeamDiv);
  }

  // submit button
  popupForm.appendChild(document.createElement("br"));
  let submitBtn = popupWindow.document.createElement("input");
  submitBtn.type = "submit";
  submitBtn.className = "popup-sel-btn";
  submitBtn.value = "Submit";

  // handle submit data
  popupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    //let formData = Object.fromEntries(new FormData(e.target).entries());
    let teamsToJoin = [];
    for (let [key, value] of new FormData(e.target).entries()) {
      teamsToJoin.push(value);
    }
    let appendStr = teamsToJoin.join("\n");
    console.log(appendStr);

    // combine append content
    let appendContent = appendStr;
    let appendCount = teamsToJoin.length;
    // remote append
    webdav_client(async (client) => {
      if ((await client.exists(archives_filename)) === true) {
        // do the merge
        let exist_content = await client.getFileContents(archives_filename, {
          format: "text",
        });
        let { str: newContent, appendCount: mergeCount } = merge_teams(
          exist_content,
          appendContent
        );
        await client.putFileContents(archives_filename, newContent);
        appendCount = mergeCount;
      } else {
        await client.putFileContents(archives_filename, appendContent);
      }
      browser.notifications.create("PokemonShowdown Sync", {
        type: "basic",
        iconUrl: "../icons/s1.png",
        title: "Archive team",
        message: `${appendCount} new team in selected archived.`,
      });
      //console.log(appendCount);
    });
    popupWindow.close();
  });
  popupForm.appendChild(submitBtn);
  let popupBody = popupWindow.document.body;
  popupBody.appendChild(popupForm);
  popupWindow.focus();
});

// helper function to merge teams
function merge_teams(sourceTeamStr, newTeamStr) {
  let exist_teams = sourceTeamStr.split("\n");
  let append_teams = newTeamStr.split("\n");
  let append_count = 0;

  for (let new_team of append_teams) {
    // check is a new team?
    if (exist_teams.indexOf(new_team) < 0) {
      exist_teams.push(new_team);
      append_count += 1;
    }
  }
  return { str: exist_teams.join("\n"), appendCount: append_count };
}

// merge from backup button: merge backup to archive
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
      let { str: newContent, appendCount: append_count } = merge_teams(
        exist_content,
        append_content
      );
      await client.putFileContents(archives_filename, newContent);

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
        alert("There is no team data on remote, please backup first");
      }
    }
  });
});

// load team button: download team
document.getElementById("arv-pull").addEventListener("click", (e) => {
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
      let info_li = document.createElement("li");
      info_li.innerText = `Pulled ${remote_arv_info.num_teams} teams`;
      ul.appendChild(info_li);
      // append displayable team
      for (let team of remote_arv_info.displayable) {
        let li = document.createElement("li");
        li.innerHTML = `<span class="arv-team-name">${team.TeamName}</span><span class="arv-team-format">(${team.FormatName})</span>`;
        let p = document.createElement("p");
        p.className = "arv-team-preview";
        for (let i = 0; i < team.PMNames.length; i++) {
          let span1 = document.createElement("span");
          span1.style = `${getPokemonIcon(team.IconNames[i])}`;
          span1.className = "arv-pm-preview";
          p.appendChild(span1);
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
        p.className = "arv-team-no-preview";
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
