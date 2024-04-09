window.Storage.loadTeams();
let room = window.room;
if (room.selectFolder) {
    room.curFolderKeep ="";
    room.curFolder ="";
    room.updateFolderList();
    room.updateTeamList(true);
    room.update();  
}