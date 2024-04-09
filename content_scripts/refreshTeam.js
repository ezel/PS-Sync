window.Storage.loadTeams();
if (window.room.selectFolder) {
    window.room.curFolderKeep ="";
    window.room.curFolder ="";
    window.room.updateFolderList();
    window.room.updateTeamList(true);
    window.room.update();  
}