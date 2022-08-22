/*********************************************************************************
 *  Game: Pyramind 2000 (pyramid-2k)
 *  file: game.js

  Function Lookup by Tag in Alphabetical Order...

  TAG                     FUNCTION                  DESCRIPTION
  ============            ==========                ===================

  #app_object_init        n/a                       Initialize app object
  #global_declarations    n/a
  #key_proc__             keyProc()
  #key_proc_2             keyProc2()
  #page_resize            pageResize()
  #page_setup             pageSetup()

 *********************************************************************************/

// #global_declarations
const Q = '"';
const sInputPrompt = ":"; // : for TRS-80 Level 1 and 2, > for TRS-80 Color Computer
let cmdArea
let cmdLineNd;
let cntrNd,goldChromeNd,insetNd,thumbNailNd,gameViewportNd,outerFrameNd,innerFrameNd,historyNd;
let tintNd,splashNd,diaNd;
let sUserAgent,db,dbProc;

/*
   Item Room id notes:

      0            = nowhere right now
      positive num = number of room it resides in
     -1            = in player's possesion
 */
const app = {};
const playerInfo = {};

const SCREENREZ_AUTO = 0;
const SCREENREZ_IPHONE_PLUS = 1
app.screenRezMode = SCREENREZ_AUTO;

const DB_VERSION_NUM = 1;
const MAX_PLAY_LOG_ENTRIES = 10000;
const ENTER_KEY = 13;
const F2_KEY = 113;

// #app_object_init
app.gamesSaveable = true;
app.dbOpen = false;
app.dbErrReason = "";
app.lastGameId = ""; // only has value after loading/saving a saved game!
app.currentGameName = ""; // only has value after loading/saving a saved game!
app.gamesListByIndex = [];
app.gamesListByName = []; //  used to check if game save by name already exists
app.gamesListById = [];  // 
app.playLogByIndex = [];
app.selGameId = "";
app.selGameNd = undefined;





/********************************************************************************* 
 * #page_setup
 *********************************************************************************/
function pageSetup() {
    console.log("pageSetup() run")
    cmdAreaNd = document.getElementById("cmdArea");
    cmdLineNd = document.getElementById("cmdLine");
    cntrNd = document.getElementById("cntr");
    goldChromeNd = document.getElementById("goldChrome");
    insetNd = document.getElementById("inset");
    thumbNailNd = document.getElementById("thumbNail");
    gameViewportNd = document.getElementById("gameViewport");
    outerFrameNd = document.getElementById("outerFrame");
    innerFrameNd = document.getElementById("innerFrame");
    historyNd = document.getElementById("history");
    
    app.initialHistory = historyNd.innerHTML;

    tintNd = document.getElementById("tint");
    splashNd = document.getElementById("splash");
    diaNd = document.getElementById("dia");

    sUserAgent = navigator.userAgent.toLowerCase();

    if (sUserAgent.indexOf("mobile") > -1) {
        app.mobileDevice = true;
        insetNd.style.width = "100px";
        insetNd.style.height = "100px";
        insetNd.style.borderBottomRightRadius = "45px";
        thumbNailNd.width = "80";
        thumbNailNd.height = "80";
    } // end if

    cmdLineNd.addEventListener('keyup', keyProc);
    cmdLineNd.addEventListener('focus', cmdInputFocus);
    cmdLineNd.addEventListener('blur', cmdInputBlur);

    document.addEventListener('keydown', keyProc2)
    dbProc = new DbProc();
    
    openDb(finalGameSetupPart1);

    pageResize();

    
    
    
} // end of function pageSetup()



/********************************************************************************* 
 * #page_resize
 *********************************************************************************/
function pageResize() {
    w = window.innerWidth;
    h = window.innerHeight;

    //alert(w + " x "+h)
    cntrNd.style.width = (w)+"px";
    cntrNd.style.height = (h)+"px";

    if (app.screenRezMode === SCREENREZ_IPHONE_PLUS) {
        w = 414;
        h = 622;
    } // end if

    goldChromeNd.style.width = (w)+"px";
    goldChromeNd.style.height = (h)+"px";

    //
    gameViewportNd.style.width = (w-38)+"px";
    gameViewportNd.style.height = (h-38)+"px";

    outerFrameNd.style.height = (h-90)+"px";
    innerFrameNd.style.height = (h-92)+"px";

    let w2 = w - 120;

    if (w2 < 700) {
        w2 = 700;
    } // end if

    //console.log("w2="+w2)
    cmdLineNd.style.width = (w2)+"px";
    cmdLineNd.focus();
} // end of function pageResize()




/********************************************************************************* 
 * #key_proc__
 * 
 * Called by cmdLineNd's 'keyup' event listener which is set up in pageSetup()
 *********************************************************************************/
function keyProc(evt) {
    if (evt.keyCode===ENTER_KEY) {
        // Enter/Return key was pressed...
        ProcTextEntry();
        return;
    } // end if
} // end of function keyProc()



/********************************************************************************* 
 * #key_proc_2
 *********************************************************************************/
function keyProc2(evt) {
    if (evt.keyCode===F2_KEY) {
        // F2 key was pressed...

        if (app.lastGameId !== "") {
            localStorage.setItem('F2 key', 'Y');
            location.reload();
            return;
        } // end if
        
    } // end if
} // end of function keyProc2()



/********************************************************************************* 
 *********************************************************************************/
function cmdInputFocus(evt) {
    console.log("focus event fired");
    cmdLineNd.placeholder = "Type in your command and press ENTER";
} // end of function cmdInputFocus()


/********************************************************************************* 
 *********************************************************************************/
function cmdInputBlur(evt) {
    console.log("blur event fired");
    cmdLineNd.placeholder = "Select here to type in your game commands";
} // end of function cmdInputBlur()







/********************************************************************************* 
 *********************************************************************************/
function attemptToDropItem(sWords, sOptions) {

    if (sWords.length > 2  ) {
        let s = "You aren't carrying it.";
        logPlay(s);
        return;
    } // end if

    const itmObj = playerInfo.itemsByName[sWords[1]];

    if (typeof itmObj === "object") {
        // if itmObj is an object then it found item in player's inventory
        // otherwise it will be undefined.

        if (itmObj.isGettable) {
            if (typeof sOptions === "undefined") {
                logPlay("OK.");
            } // end if

            const roomObj = getExistingRoomObj(playerInfo.currentRoom);

            // add item to current room
            itmObj.currentLocation = playerInfo.currentRoom;
            roomObj.itemsByName = setItmKeyVal(roomObj.itemsByName,itmObj,itmObj);
            roomObj.itemsByIndex.push(itmObj);

            // remove item from player's inventory
            playerInfo.itemsByName = setItmKeyVal(playerInfo.itemsByName,itmObj,undefined);
            playerInfo.itemsByIndex = processIndexedArrayGameItems(playerInfo.itemsByIndex, true);
            
            if (itmObj.isLamp) {
                playerInfo.hasLamp = false;  // player no longer has the lamp in their possession!
            } // end if

            if (itmObj.isScepter) {
                playerInfo.hasScepture = false;
            } // end if

            if (itmObj.isBox) {
                playerInfo.hasBox = false;
            } // end if

            if (itmObj.isGold) {
                playerInfo.hasGold = false;
            } // end if

        } // end if  (itmObj.isGettable) 
    } else {
        // player is not carrying item specified
        let s = "You aren't carrying it.";
        logPlay(s);
        return;
    } // end if (typeof itmObj === "object")  / else
    
} // end of function attemptToDropItem()





/********************************************************************************* 
 *********************************************************************************/
function attemptToGetItem(sWords) {
    if (sWords.length === 2) {
        const roomObj = getExistingRoomObj(playerInfo.currentRoom);
        const itmObj = roomObj.itemsByName[sWords[1]];

        if (typeof itmObj === "object") {
            if (itmObj.isGettable) {

                if (itmObj.isBirdGod && playerInfo.hasScepture) {
                    const a = [];
                    a.push("As you approach the statue,")
                    a.push("it comes to life and flies")
                    a.push("across the chamber where it")
                    a.push("lands and returns to stone.")
                    logPlay(a.join(" "));
                    return;
                } // end if

                logPlay("OK.");
                itmObj.currentLocation = -1; // item object is now in the player's possession!
                
                // make the item be part of player's inventory
                playerInfo.itemsByName = setItmKeyVal(playerInfo.itemsByName,itmObj,itmObj);
                playerInfo.itemsByIndex.push(itmObj);

                // make item no long be a part of the room
                roomObj.itemsByName = setItmKeyVal(roomObj.itemsByName,itmObj,undefined);
                roomObj.itemsByIndex = processIndexedArrayGameItems(roomObj.itemsByIndex, false);  // May 6, 2020 

                if (itmObj.isLamp) {
                    playerInfo.hasLamp = true;  // player now has the lamp in their possession!
                } // end if

                if (itmObj.isScepter) {
                    playerInfo.hasScepture = true;
                } // end if

                if (itmObj.isBox) {
                    playerInfo.hasBox = true;
                } // end if

                if (itmObj.isGold) {
                    playerInfo.hasGold = true;
                } // end if

                return;
            } else {
                if (itmObj.customNoGetMsg !== "") {
                    logPlay(itmObj.customNoGetMsg);
                    return;
                } // end if

                logPlay("generic not gettable msg goes here.");
                return;
            } // end if
        } else {
            // 
            let s = "I see no "+sWords[sWords.length-1]+" here.";
            logPlay(s);
            return;
        } // end if  (typeof itmObj === "object") /else
    }  // end if  (sWords.length === 2) else

} // end of function attemptToGetItem()


/********************************************************************************* 
 *  Go through objects in game where data can be saved and build a:
 *  'baselineValues' property with copies of the values of properties
 *  that can change, and have their values saved.
 * 
 *  Called by:    finalGameSetupPart2()
 * 
 *********************************************************************************/
function baselineObjects() {
    console.log("📮📮📮baselineObjects() called");
//debugger;
    baselineArray(app.roomsByIndex, "for rooms");
    baselineArray(app.itemsByIndex, "for items");

    function baselineArray(arr, sComment) {
        console.log(" -- baselineArray() called "+sComment);
        const nMax1 = arr.length;
        for (let n1=0;n1<nMax1;n1++) {
            const obj = arr[n1];
            obj.baselineValues = {};

            for (prop in obj) {
                if (prop !== "id" && prop !== "baselineValues") {
                    const propValue = obj[prop];

                    if (typeof propValue === "string") {
                        obj.baselineValues[prop] = propValue+"";
                    } // end if

                    if (typeof propValue === "number") {
                        obj.baselineValues[prop] = propValue-0;
                    } // end if
                    
                    if (typeof propValue === "boolean") {
                        if (propValue === true) {
                            obj.baselineValues[prop] = true;
                        } else {
                            obj.baselineValues[prop] = false;
                        } // end if/else

                    } // end if
                } // end if
            } // next prop

        } // next n1
    } // end of function baselineArray(arr)

    console.log("baselineObjects() call Completed!");

} // end of function baselineObjects()




/********************************************************************************* 
 *  [Save Game] button was clicked from Save Game dialog panel!
 * 
 *  HTML Markup to generate the Save Game dialog was created by the:
 *     showSaveDialog() function.
 * 
 *********************************************************************************/
function beginGameSave(siGameName) {
    console.log("beginGameSave() called");

    let sGameName;
    let gameNameNd,diaSaveInfoNd,saveBtnNd;
    let bResaveExistingGame = false;
    
    if (typeof siGameName === "string") {
        sGameName = siGameName;
        bResaveExistingGame = true;
    } else {
        gameNameNd = document.getElementById("gameName");
        diaSaveInfoNd = document.getElementById("diaSaveInfo");
        saveBtnNd = document.getElementById("saveBtn");

        sGameName = gameNameNd.value.trim().toUpperCase();

    } // end if/else
    

    if (sGameName.length<3) {
        diaSaveInfoNd.innerHTML = "The Game Name must be at least 3 characters long.";
        gameNameNd.focus();
        return;
    } // end if

    if (!bResaveExistingGame) {
        gameNameNd.readonly = true;
        diaSaveInfoNd.innerHTML = "Saving Game...";
        saveBtnNd.disabled = false;
    } // end if
    
    app.currentGameName = sGameName; 

    setTimeout(saveCurrentGamePart1, 20);
    
} // end of function beginGameSave()



/********************************************************************************* 
 *********************************************************************************/
function DbProc() {
    console.log("DbProc() constructor called.")
    dbProc = this;
    let processQueue = [];
    let processResults = [];
    let waitingQueue = [];
    let bProcessingRequests = false;

    dbProc.addObjectToSaveRequest = function(params1) {
        console.log("-- addObjectToSaveRequest method called");
        const proc = {};
        proc.procType = "saveRequest";
        proc.key = params1.key;
        proc.value = params1.value;
        proc.result = "incomplete";
        proc.resultData = "";

        if (!bProcessingRequests) {
            processQueue.push(proc);
        } else {
            waitingQueue.push(proc);
        } // end if/else

    } // end of addObjectToSaveRequest() method

    dbProc.addGetObjectByKeyRequest = function(params1) {
        console.log("-- addGetObjectByKeyRequest method called");
        const proc = {};
        proc.procType = "getRequest";
        proc.key = params1.key;
        proc.result = "incomplete";
        proc.resultData = "";

        if (!bProcessingRequests) {
            processQueue.push(proc);
        } else {
            waitingQueue.push(proc);
        } // end if/else

    } // end of addGetObjectByKeyRequest()


    dbProc.addDeleteObjectByKeyRequest = function(params1) {
        console.log("-- addGetObjectByKeyRequest method called");
        const proc = {};
        proc.procType = "deleteRequest";
        proc.key = params1.key;
        proc.result = "incomplete";
        proc.resultData = "";

        if (!bProcessingRequests) {
            processQueue.push(proc);
        } else {
            waitingQueue.push(proc);
        } // end if/else

    } // end of addDeleteObjectByKeyRequest()


    dbProc.processRequests = function(fnSuccess, fnFailure) {
        console.log("processRequests method called");
        bProcessingRequests = true;
        processResults = [];
        const proc = {};
        proc.procType = "processRequests";
        proc.successFunction = fnSuccess;
        proc.failureFunction = fnFailure;
        proc.result = "tbd";
        proc.resultData = "";
        processQueue.push(proc);
        processNextRequest();
    } // end of processRequests() method


    function processNextRequest() {
        console.log("processing next db request...");

        const proc = processQueue.shift();
        console.log("proc taken out of queue FIFO");

        // Last thing to be processed:
        if (proc.procType === "processRequests") {
            console.log("procType='processRequests'");
            proc.result = "completed";
            processResults.push(proc);

            bProcessingRequests = false;

            if (typeof proc.successFunction === "function") {
                console.log("about to call Success function...");
                proc.successFunction(processResults);
                return;
            } // end if            
        } // end if (proc.procType === "processRequests") 

        if (proc.procType === "getRequest") {
            console.log("procType='getRequest'");
            const objectStore = db.transaction(['games'],"readonly").objectStore("games"); 
            console.log("objectStore object created");
            let getRequest; // here to maintain proper scope

            try {
                console.log("about to request a Get from the database for the key: '"+proc.key+"'");
                getRequest = objectStore.get(proc.key);
                console.log("we got past the objectStore.get() call...");
            } catch(err) {
                console.log(err);
                debugger;
            } // end of try/catch block

            
            getRequest.onsuccess = function() {
                console.log("getRequest.onsuccess fired");
                proc.resultData = getRequest.result;
                proc.result = "data read";

                if (typeof proc.resultData === "undefined") {
                    proc.result = "key does not exist";
                } // end if

                processResults.push(proc);

                if (processQueue.length>0) {
                    console.log("more stuff left in queue... going to get another one");
                    processNextRequest();
                } // end if
            } // end of getRequest.onsuccess
            
            getRequest.onerror = function() {
                console.log("getRequest.onerror fired");
                const err = getRequest.error;
                console.log(err)
                debugger;
            } // end of getRequest.onerror

            //debugger
        } // end if getRequest

        if (proc.procType === "saveRequest") {
            console.log("procType='saveRequest'");
            const objectStore = db.transaction(['games'],"readwrite").objectStore("games"); 
            console.log("{objectStore} object created");


            if (typeof proc.key !== "undefined") {
                proc.id = proc.key;
            } // end if

            let putRequest;

            /*
               NOTE:

               The key parameter on the [put] method below is left out because
               the id property has been defined as the key field, and that property's
               value has already been set, so it will know the key value to use.

               If you pass in the key on the put method, when the key property is set,
               it will throw an error.
             */

            try {
                console.log("about to request a Put from the database for the key: '"+proc.id+"'...");
                putRequest = objectStore.put(proc.value);
                console.log("we got past the objectStore.put() call...");
            } catch(err) {
                console.log(err);
                debugger;
            } // end of try/catch block
            

            putRequest.onsuccess = function() {
                console.log("putRequest.onsuccess fired");
                proc.result = "data saved";
                processResults.push(proc);

                if (processQueue.length>0) {
                    console.log("more stuff left in queue... going to get another one");
                    processNextRequest();
                } // end if

            } // end of putRequest.onsuccess


            putRequest.onerror = function() {
                console.log("putRequest.onerror fired");
                const err = getRequest.error;
                console.log(err)
                debugger;
            } // end of putRequest.onerror


        } // end if saveRequest

        //
        if (proc.procType === "deleteRequest") {
            console.log("procType='saveRequest'");
            const objectStore = db.transaction(['games'],"readwrite").objectStore("games"); 
            console.log("{objectStore} object created");

            if (typeof proc.key !== "undefined") {
                proc.id = proc.key;
            } // end if

            let deleteRequest;
            
            deleteRequest = objectStore.delete(proc.id);

            deleteRequest.onsuccess = function() {
                console.log("deleteRequest.onsuccess fired");
                proc.result = "data deleted";
                processResults.push(proc);

                if (processQueue.length>0) {
                    console.log("more stuff left in queue... going to get another one");
                    processNextRequest();
                } // end if

            } // end of deleteRequest.onsuccess


            deleteRequest.onerror = function() {
                console.log("deleteRequest.onerror fired");
                const err = getRequest.error;
                console.log(err)
                debugger;
            } // end of deleteRequest.onerror

        } // end if deleteRequest

    } // end of function processNextRequest()


} // end of Constructor function DbProc()




/********************************************************************************* 
 *    called when  "Delete Game" button is clicked.
 *********************************************************************************/
function deleteGame() {
    console.log("deleteGame() called")

    const selGameLstItm = app.gamesListById[app.selGameId];
    let sMsg = "The game you selected to delete is named:<br><i>"+selGameLstItm.gameName+"</i>.<br><br>";
    sMsg = sMsg + "Are you <i>Sure</i> that you want to Delete this Game?";


    msgBoxLib.msgBox({title:"Delete Game",
                      msg:sMsg,
                      buttons:[{caption:"Yes, Delete Game",fn:deleteGame2},{caption:"Cancel"}]})
} // end of function deleteGame



/********************************************************************************* 
 *    Actually deletes game selected from the IndexedDb database and
 *    refreshes the game list being displayed for the "Load Games" display.
 *********************************************************************************/
function deleteGame2() {
    console.log("deleteGame2() called")

    const newGameSaveList = [];
    const nMax = app.gamesListByIndex.length;
    for (let n=0;n<nMax;n++) {
        const gameLstItem = app.gamesListByIndex[n];

        if (gameLstItem.id !== app.selGameId) {
            newGameSaveList.push(gameLstItem);
        } // end if

    } // next n

    const gameSaveList = {};
    gameSaveList.id = "gameList";
    gameSaveList.objType = "gameList";
    gameSaveList.gameListByIndex = newGameSaveList;

    app.gamesListByIndex = newGameSaveList; // revise indexed array
    delete app.gamesListById[app.selGameId]; // delete lookup

    dbProc.addDeleteObjectByKeyRequest({key:app.selGameId}); // delete the selected saved game
    dbProc.addObjectToSaveRequest({key:"gameList",value:gameSaveList}); // save revised game list
    dbProc.processRequests(deleteGame3);
    
} // end of function deleteGame2()


/********************************************************************************* 
 *********************************************************************************/
function deleteGame3() {
    console.log("deleteGame3() called")
    app.selGameId = ""; // nothing anymore is selected!
    const loadBtnNd = document.getElementById("loadBtn");
    const delBtnNd = document.getElementById("delBtn");

    loadBtnNd.disabled = true;
    delBtnNd.disabled = true;

    loadGameList();
} // end of function deleteGame3()



/********************************************************************************* 
 *   check if there is a special Developer command,
 *   and, if there is, process it!
 * 
 *   called by:   ProcTextEntry()
 *********************************************************************************/
function devCommands(sCmd) {
    // return false; // un-comment out this line when done developing/debugging


    if (sCmd === "RUN SIM") {
        let s=[];
        s.push("Run version of game on Color Computer Simulator:&nbsp;&nbsp;&nbsp;");
        s.push("<a href='https://computerarcheology.com/CoCo/Pyramid/' class='lnkBtn' target='runSim'>Click to Run Sim</a>")
        logPlay(s.join(""), "none");
        return true;
    } // end if
    
    /*
       comment IF block below out when done working on game!
     */
    if (sCmd === "DEBUGGER") {
        logPlay("Gone into debug mode.");

        /* 
           @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
           variables of interest:

               playerInfo
               app
               sUserAgent
           @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
        */
        debugger;
        return true;
    } // end if
    // #################################################################

    return false;
} // end of function devCommands()




/********************************************************************************* 
 *********************************************************************************/
function displayInventory() {
    if (playerInfo.itemsByIndex.length === 0) {
        logPlay("You're not carrying anything.");
        return;
    } // end if

    logPlay("You are currently holding the following:");

    const nMax = playerInfo.itemsByIndex.length;

    for (let n=0;n<nMax;n++) {
        itmObj = playerInfo.itemsByIndex[n];
        if (itmObj.invName === "") {
            itmObj.invName =itmObj.shortName;
        } // end if

        logPlay(itmObj.invName);
    } // next n

} // end of function displayInventory()





/********************************************************************************* 
 *    Display current room description if there is no need for a light,
 *    or the user has the lamp and it is lit, and display the items that
 *    currently are in the room.
 * 
 *    If there is no light in the room, display a warning msg about it being
 *    pitch dark.
 *********************************************************************************/
function displayRoomInfo(nRoomNum) {
    console.log("displayRoomInfo() called");

    const roomObj = getExistingRoomObj(nRoomNum);

    if (roomObj.needLight && (!playerInfo.hasLamp || !playerInfo.lampLit)) {
        logPlay("It is now pitch dark. If you proceed, you will likely fall into a pit.");
        return;
    } // end if

    // DISPLAY ROOM DESCRIPTION:
    logPlay(roomObj.descr.join(" "));

    if (roomObj.hasSerpent) {
        logPlay("A huge green serpent bars the way!");
    } // end if

    // DISPLAY LIST OF ITEMS THAT ARE IN THE ROOM:
    const nMax2 = roomObj.itemsByIndex.length;
    
    for (let n=0;n<nMax2;n++) {
        const itmObj = roomObj.itemsByIndex[n];
        logPlay(itmObj.longName);

        if (itmObj.isBottle && itmObj.hasWater) {
            logPlay("THERE IS WATER IN THE BOTTLE.");
        } // end if

    } // next n

} // end of function displayRoomInfo()  




/********************************************************************************* 
 *********************************************************************************/
function displayScore() {
    let s = "you scored "+padZeroes(playerInfo.score)+" out of 0220, using "+padZeroes(playerInfo.turnCount)+" turns."
    logPlay(s);
} // end of function displayScore()




/********************************************************************************* 
 *   if you typed in a navigation command, 
 *    - it checks to see if you can currently navigate in that way 
 *    - if so, it changes the current room variable to the new location
 *      and displays the new locations longName and any items that are currently
 *      located there!
 * 
 *   It is called from:    ProcTextEntry()
 *********************************************************************************/
function doNav(sCmd) {

    const roomObj = getExistingRoomObj(playerInfo.currentRoom);

    if (roomObj.hasSerpent) {
        logPlay("Serpent blocks you.");
        return;
    } // end if

    let navObj = roomObj.moveByDirection[sCmd];

    if (typeof navObj === "undefined") {
        logPlay("There is no way for you to go that direction.");
        return;
    } // end if

    if (!navObj.allowNav) {
        let s = "There is no way for you to go that direction.";

        if (navObj.blockMsg !== "") {
            s = navObj.blockMsg;
        } // end if

        logPlay(s);
        return;
    } // end if

    let nNewRoomId = navObj.roomNum;

    if (typeof nNewRoomId === "number") {
        nLastRoom = playerInfo.currentRoom;
        playerInfo.currentRoom = nNewRoomId;
        displayRoomInfo(playerInfo.currentRoom);
        return;
    } else {
        logPlay("There is no way for you to go that direction.");
        return;
    } // end if else

} // end of function doNav()



/********************************************************************************* 
 *********************************************************************************/
function filterTilda(evt) {
    console.log("filterTilda() called");

    if (evt.keyCode === 192) {
        console.log("keystroke filtered");
        evt.preventDefault();
    } // end if

} // end of function filterTilda(evt)



/********************************************************************************* 
 *********************************************************************************/
function finalGameSetupPart1() {
    console.log("finalGameSetupPart1() called");

    dbProc.addGetObjectByKeyRequest({key:"gameList"});
    dbProc.addGetObjectByKeyRequest({key:"lastGame"});
    dbProc.processRequests(finalGameSetupPart2);

} // end of function finalGameSetupPart1()



/********************************************************************************* 
 *  when db process to get game list is complete it will call this
 *  function 
 *********************************************************************************/
function finalGameSetupPart2(results) {
    console.log("finalGameSetupPart2() called");

    let request = results[0];

    if (request.result === "data read") {
        processGameList(request.resultData);
    } // end if

    request = results[1];
    if (request.result === "data read") {
        app.lastGameId = request.resultData.gameKey;
    } // end if

    newGame();
    
    const sFlag = localStorage.getItem('F2 key');

    if (sFlag === null) {
        console.log("flag is null")
    } else {
        console.log("flag is NOT null")
        localStorage.removeItem('F2 key');

        if (app.lastGameId !== "") {
            loadGame1(app.lastGameId);
            return;
        } // end if
        
    } // end if/else
    
    setTimeout(finalGameSetupPart3, 200)
} // end of function finalGameSetupPart2()



/********************************************************************************* 
 *  called by a setTimeout in finalGameSetupPart2()
 *********************************************************************************/
function finalGameSetupPart3() {
    console.log("finalGameSetupPart3() called");
    cmdLineNd.focus();
} // end of function finalGameSetupPart3()




/********************************************************************************* 
 *********************************************************************************/
function gameIntro() {
    console.log("gameIntro() called");

    logPlay("Welcome to Pyramid!!","glow","red")
    logPlay("");
    logPlay("this is my remake of the 1979 adventure game: \"Pyramid 2000\" that came out","glow","lightblue")
    logPlay("for the radio shack trs-80 computer.","glow","lightblue")
    logPlay("");
    logPlay("");
    displayRoomInfo(playerInfo.currentRoom);
} // end of function gameIntro()





/********************************************************************************* 
 *********************************************************************************/
function getExistingRoomObj(nRoomNum) {
    const sId = "room_"+nRoomNum;

    const roomObj = app.roomsById[sId];

    return roomObj;
} // end of function getExistingRoomObj()



/********************************************************************************* 
 *  
 *********************************************************************************/
function hideDialog(sItemName) {
    tintNd.style.display = "none";
    diaNd.style.display = "none";
    diaNd.style.maxHeight = "";
    diaNd.innerHTML = "";  // free up memory
    app.selGameId = ""; // reset if needed

    if (typeof sItemName === "string") {
        logPlay("Game "+sItemName+" was canceled.")
    } // endif

    cmdLineNd.focus();
} // end of function hideDialog()



/********************************************************************************* 
 *   get initial game state set up
 *   note that mapping items to rooms is done separately
 *   because it is done on new games right away, but has to be done
 *   AFTER delta data from a game load has been loaded into memory!!
 *********************************************************************************/
function initStartingGameState() {
    console.log("initStartingGameState() called")
    app.roomsByIndex = [];
    app.roomsById = [];
    app.itemsByIndex = [];
    app.itemsByName = [];
    app.itemsByKey = [];
    app.gameLogByIndex = [];
    app.playLogByIndex = [];

    playerInfo.currentRoom = 1;
    playerInfo.lastRoom = 1;
    playerInfo.turnCount = 0;
    playerInfo.score = 0;

    // general player state:
    playerInfo.hasLamp = false;
    playerInfo.hasBox = false;
    playerInfo.lampLit = false;
    playerInfo.hasScepture = false;
    playerInfo.hasGold = false;

    playerInfo.itemsByIndex = []; // player's inventory
    playerInfo.itemsByName = [];

    setupItems();
    setupRooms();

    

   // historyNd.innerHTML = app.initialHistory;

} // end of function initStartingGameState()






/********************************************************************
 * CREATE GENERIC ITEM OBJ
 ********************************************************************/
function ItemObj(sKey, nStartRoom) {
    const itmObj = this;

    itmObj.objType = "item";
    itmObj.keyName = sKey;
    itmObj.shortName = "??? shortName ??? - for key: '"+sKey+"'"; // inventory name & name used for GET, DROP, TAKE, THROW, EAT, ..etc
    itmObj.longName = "??? longName ??? - for key: '"+sKey+"'"; // description shown in room
    itmObj.invName = "";
    itmObj.alternateNames = [];
    itmObj.insideOf = ""; // key of item that This item is inside of
    itmObj.isGettable = false;
    itmObj.customNoGetMsg = "";
    itmObj.isTreasure = false;
    itmObj.startLocation = 0; // 0 = nowhere
    itmObj.currentLocation = 0; // 0 = nowhere

    // QUICK FLAGS:
    itmObj.isLamp = false;
    itmObj.isBox = false;
    itmObj.isScepter = false;
    itmObj.isGold = false;
    itmObj.isBirdGod = false;
    itmObj.isBottle = false;
    itmObj.hasWater = false;
    itmObj.isPlant = false;
    itmObj.isBatteries = false;
    

    // nStartRoom.  This is the room# that the item starts in for the game...
    if (typeof nStartRoom === "number") {
        itmObj.startLocation = nStartRoom;
        itmObj.currentLocation = nStartRoom;
    } // end if

    app.itemsByIndex.push(itmObj);
    app.itemsByKey[itmObj.keyName] = itmObj;

} // end of function ItemObj()




/********************************************************************************* 
 *  run After user picks a game to load.
 *  loads data for game out of indexedDb database and starts it for the 
 *  player to play!
 *********************************************************************************/
function loadGame1(sGameId) {
    console.log("loadGame1() called")
    initStartingGameState();

    dbProc.addGetObjectByKeyRequest({key:sGameId});
    setLastGameInfo(sGameId);
    dbProc.processRequests(loadGame2);

    
} // end of function loadGame1()


/********************************************************************************* 
 *********************************************************************************/
function loadGame2(results) {
    console.log("loadGame2() called")
    const data = results[0].resultData;
    let sProp;
    const s=[];

    for (sProp in data.playerInfo) {
        playerInfo[sProp] = data.playerInfo[sProp];
    } // next sProp in data.playerInfo

    let nMax = data.gameObjChangesByIndex.length;
    for (let n=0; n<nMax;n++) {
        const gameObjChange = data.gameObjChangesByIndex[n];
        const sObjType = gameObjChange.objType;
        let gameObj;

        if (sObjType === "item") {
            gameObj = app.itemsByKey[gameObjChange.keyName];
        } // end if

        if (sObjType === "roomsById") {
            gameObj = app.itemsByKey[gameObjChange.keyName];
        } // end if

        for (sProp in gameObjChange) {
            if (sProp !== "objType" && sProp !== "keyName") {
                gameObj[sProp] = gameObjChange[sProp];
            } // end if
        } // next sProp in gameObjChange

    } // next n

    setupInventoryForPlayer();

    //  in retrospect, saving play log was not a good idea. loading it up on a game load is confusing to the user!

    /*
    for (let n=0;n<108;n++) {
        s.push("<li>&nbsp;</li>");
    } // next n

    app.playLogByIndex = data.playLogByIndex;
    nMax = app.playLogByIndex.length;
    for (let n=0; n<nMax;n++) {
        const playLogEntry = app.playLogByIndex[n];
        let sColor = playLogEntry.textColor;
        s.push("<li ");

        if (sColor !== "white") {
            s.push("style=");
            s.push(Q);
            s.push("color:"+sColor+";");
            s.push(Q);
        } // end if

        s.push(">");
        s.push(playLogEntry.text);

        s.push("</li>");
    } // next n

    historyNd.innerHTML = s.join("");

    */

    setupRoomsForItems();

    hideDialog()
   // debugger;
    logPlay("Game Loaded!");
} // end of function loadGame2()


/********************************************************************************* 
 *********************************************************************************/
function loadGameList() {
    console.log("loadGameList() called")
    let gameListNd = document.getElementById("gameList");
    const s=[]; // 
    let nMax = app.gamesListByIndex.length;
    for (let n=0;n<nMax;n++) {
        let game = app.gamesListByIndex[n];
        s.push("<li class='gameListItm' ");
        s.push("data-id='"+game.id+"' ");
        s.push(">&nbsp;"+game.gameName);

        s.push("</li>")
    } // next n

    gameListNd.innerHTML = s.join("");
} // end of function loadGameList()



/********************************************************************************* 
 *********************************************************************************/
function loadSelectedGame() {
    console.log("loadSelectedGame() called")
    loadGame1(app.selGameId);
} // end of function loadSelectedGame()



/********************************************************************************* 
 *  Output text to the screen...
 *********************************************************************************/
function logPlay(sText, sOpt1, sOpt2) {
    console.log("logPlay() called ")
    const logEntry = document.createElement("li");
    let sColor = "white";
    let bGlow = false;
    let bNone = false;
    

    if (typeof sOpt1 === "string") {
        if (sOpt1 === "glow") {
           // logEntry.className = "textGlow";
            bGlow = true;
        } // end if

        if (sOpt1 === "none") {
            bNone = true;
        } // end if

    } // end if

    if (bNone) {
        logEntry.innerHTML = sText;
    } else {
        logEntry.innerHTML = sText.toUpperCase().trim();
    } // end if / else
    

    if (typeof sOpt2 === "string") {
        logEntry.style.color = sOpt2;
        sColor = sOpt2;
        logEntry.className = "";

        if (bGlow) {
            let sStyle = "-1px -1px 5px "+sOpt2+", 1px 1px 5px "+sOpt2+", -1px 1px 5px "+sOpt2+", 1px -1px 5px "+sOpt2;
         //   logEntry.style.textShadow = sStyle;
        } // end if

    } // end if

    playLogEntry = {};
    playLogEntry.timestamp = new Date(); // just because! :P
    playLogEntry.text = sText.toUpperCase().trim();
    playLogEntry.textColor = sColor;

    app.playLogByIndex.push(playLogEntry);

    //text-shadow: 0 0 10px
    historyNd.appendChild(logEntry);  
    
    if (app.playLogByIndex.length > MAX_PLAY_LOG_ENTRIES) {
        console.log("### removing oldest play log entry.")
        app.playLogByIndex.shift(); // remove oldest entry
        historyNd.removeChild(historyNd.firstChild); // ditto but in DOM.
    } // end if

    innerFrameNd.scrollTo(0,innerFrameNd.scrollHeight); // pageResize() has to run First (at least once) before this works!
} // end of function logPlay()







/********************************************************************************* 
 *   set up navigation information about moving a certain way
 * 
 *   .roomNum will contain the room number to navigate to if the navigation is 
 *            successful.
 * 
 *   .allowNav needs to be [true] in order for the navigation to be carried out
 *********************************************************************************/
function navInfo(params) {
    const navInfoObj = {};

    navInfoObj.resultsInDeath = false; // when true, if player moves this way, it results in their death!!
    navInfoObj.deathMsg = "";
    navInfoObj.allowNav = true;
    navInfoObj.blockMsg = "";

    if (typeof params === "number") {
        navInfoObj.roomNum = params;
        return navInfoObj;
    } // end if

    return navInfoObj;

} // end of function navInfo()




/********************************************************************************* 
 *    Start up a brand new game where nothing has been done in it by the
 *    player yet.
 *********************************************************************************/
function newGame() {
    console.log("newGame() called")
    initStartingGameState();
    
    setupRoomsForItems();

    baselineObjects();

    gameIntro();
} // end of function newGame()


/********************************************************************************* 
 *   Open up indexedDb to be able to save and load games from...
 *   Refs:
 *      - https://javascript.info/indexeddb
 * 
 *********************************************************************************/
function openDb(fnOpenSuccess) {
    console.log("calling openDb() function");

    if (! "indexedDB" in window) {
        app.gamesSaveable = false;
        app.dbErrReason = "Browser does not support indexedDb";
        console.log(app.dbErrReason);
        return;
    } // end if

    const openDbRequest = window.indexedDB.open("savedGames", DB_VERSION_NUM);

    // error handler:
    /********************************************************************************* 
     *********************************************************************************/
    openDbRequest.onerror = function() {
        app.gamesSaveable = false;
        app.dbErrReason = "Database Failed to open";
        console.log(app.dbErrReason);
    } // end of openDbRequest.onerror() block

    /********************************************************************************* 
     *********************************************************************************/
    openDbRequest.onsuccess = function() {
        console.log("Database opened successfully.");

        db = openDbRequest.result;
        app.dbOpen = true;

        db.onerror = function(event) {
            // Generic error handler for all errors targeted at this database's
            // requests (after db was opened successfully)!
            console.error("Database error: " + event.target.errorCode);
        };

        if (typeof fnOpenSuccess === "function") {
            console.log("calling Open Success function...");
            fnOpenSuccess();
        } // end if

    } // openDbRequest.onsuccess() block



    /********************************************************************************* 
     *********************************************************************************/
    openDbRequest.onblocked = function() {
        console.log("Open Database BLOCKED due to being already open in another tab/window.");
        app.dbErrReason = "Database open Blocked";
        app.gamesSaveable = false;
        console.log(app.dbErrReason);
    } // openDbRequest.onblocked block




    /********************************************************************************* 
     *   Different Game Key Types:                Key's [Values]
     *   -------------------------
     *   'lastGameId'                             String of last game name
     *   'gameList'                               Array of game names
     *   'gameSummary~' + game name               Object with game name and timestamp
     *   'gameDetail~' + game name                Object containing all the game data
     * 
     *   Note that on the first run,
     *   onupgradeneeded block will run BEFORE onsuccess block!
     *********************************************************************************/
    openDbRequest.onupgradeneeded = function(evt) {
        console.log("upgrade needed event fired!");
        const db = evt.target.result;  // db local to this block in this case!
        db.createObjectStore("games", {keyPath:'id', autoIncrement:false});
        console.log("Database setup complete.")
    } // end of openDbRequest.onupgradeneeded() block

} // end of function openDb()



/********************************************************************************* 
 *********************************************************************************/
function padZeroes(nNum) {
    let sNum = nNum+"";
    let nPadding = 4 - sNum.length;
    for (let n=0;n<nPadding;n++) {
        sNum = "0"+sNum;
    } // next n

    return sNum;

} // end of function padZeroes()



/********************************************************************************* 
 *  take game list retrieved from indexedDb and update app state with it!
 *  
 *  Called from:    finalGameSetupPart2()
 *********************************************************************************/
function processGameList(resultData) {
    console.log("processGameList() called")

    app.gamesListByIndex = resultData.gameListByIndex;
    app.gamesListById = [];

    const nMax = app.gamesListByIndex.length;
    for(let n=0;n<nMax;n++) {
        const gameListItem = app.gamesListByIndex[n];
        app.gamesListById[gameListItem.id] = gameListItem;
    } // next n

    //debugger;
} // end of function processGameList()




/********************************************************************************* 
 *********************************************************************************/
function procGameNameInput() {
    console.log("procGameNameInput() called")

    const diaSaveInfoNd = document.getElementById("diaSaveInfo");
    diaSaveInfoNd.innerHTML = "";

} // end of function procGameNameInput()




/********************************************************************************* 
 *  rebuilds array of items for either the player's inventory or
 *  the current room's items.
 * 
 *  This happens After either taking an item or dropping an item!
 * 
 *********************************************************************************/
function processIndexedArrayGameItems(arr, bIncludePlayersItem) {
    const nMax =arr.length;
    const newArr = [];

    for (let n=0;n<nMax;n++) {
        itmObj = arr[n];

        if (itmObj.currentLocation === -1) {
            if (bIncludePlayersItem) {
                newArr.push(itmObj);
            } // end if
        } else {
            if (!bIncludePlayersItem) {
                newArr.push(itmObj);
            } // end if
        } // end if / else

    } // next n

    return newArr;
} // end of function processIndexedArrayGameItems()




/********************************************************************************* 
 *********************************************************************************/
function ProcTextEntry() {
    console.log("📚ProcTextEntry() called 📚")
    let sCmd = cmdLineNd.value.toUpperCase().trim();

    if (sCmd === "") {
        return; // nothing was entered.
    } // end if

    console.log(" -- cmd: "+sCmd);

    playerInfo.turnCount = playerInfo.turnCount + 1;

    let sText = sInputPrompt+sCmd;
    logPlay(sText,"glow","lightblue");
    cmdLineNd.value = "";

    // process any development/debugging commands
    if (devCommands(sCmd)) {
        return;
    } // end if

    if ((sCmd === "SAVE" || sCmd === "LOAD") && !app.gamesSaveable) {
        logPlay("You can't save or load your games in this browser.");

        return;
    } // end if

    if (sCmd === "RESTART") {
        msgBoxLib.msgBox({title:"Restart Game",
                      msg:"Are you sure that you want to restart<br>your game back to the beginning?",
                      buttons:[{caption:"Yes, Restart Game",fn:restartGame},{caption:"Cancel",fn:restartGamCanceled}]})
        return;
    } // end if


    if (sCmd === "SAVE") {
        showSaveDialog();
        return;
    } // end if

    if (sCmd === "SAVE AS") {
        showSaveDialog("AS");
        return;
    } // end if

    if (sCmd === "LOAD") {
        showLoadDialog();
        return;
    } // end if

    //app.lastGameId

    if (sCmd === "LOAD LAST") {
        if (app.lastGameId === "") {
            logPlay("There is no game to load yet.");
            return;
        } // end if
        
        loadGame1(app.lastGameId);
        return;
    } // end if


    if (sCmd === "HELP") {
        logPlay("I'm as confused as you are!");
        return;
    } // end if

    if (sCmd === "FIND") {
        logPlay("I can only tell you what you see as you move about and manipulate things.");
        logPlay("I cannot tell you where remote things are.");
        return;
    } // end if

    if (sCmd==="LOOK") {
        displayRoomInfo(playerInfo.currentRoom);
        return;
    } // end if

    // does DROP work too??
    if (sCmd==="THROW BIRD" || sCmd==="THROW STATUE") {
        const roomObj = getExistingRoomObj(playerInfo.currentRoom);

        if (roomObj.hasSerpent) {
            const s=[];
            s.push("The bird statue comes to life and attacks the serpent and in an");
            s.push("astounding flurry, drives the serpent away. the bird turns back");
            s.push("into a statue.");
            logPlay(s.join(" "));
            attemptToDropItem("BIRD", "suppress OK logging");
            roomObj.hasSerpent = false;
            return;
        } // end if
    } // end if


    if (sCmd==="QUIT") {
        displayScore();
        cmdAreaNd.style.display = "none"; // allow no more inputs
        return;
    } // end if

    if (sCmd==="SCORE") {
        displayScore();        
        return;
    } // end if

    if (sCmd==="GO NORTH" || sCmd==="NORTH") {
        sCmd = "N";
    } // end if

    if (sCmd==="GO SOUTH" || sCmd==="SOUTH") {
        sCmd = "S";
    } // end if

    if (sCmd==="GO EAST" || sCmd==="EAST") {
        sCmd = "E";
    } // end if

    if (sCmd==="GO WEST" || sCmd==="WEST") {
        sCmd = "W";
    } // end if

    if (sCmd==="GO UP" || sCmd==="CLIMB UP" || sCmd==="UP") {
        sCmd = "U";
    } // end if

    if (sCmd==="GO DOWN" || sCmd==="CLIMB DOWN" || sCmd==="DOWN") {
        sCmd = "D";
    } // end if

    if (sCmd==="GO IN") {
        sCmd = "IN";
    } // end if

    if (sCmd==="GO OUT") {
        sCmd = "OUT";
    } // end if

    // *** NAV related commands:
    // ----------------------------------------------------------------------------------------
    if (sCmd==="N" || sCmd==="S" || sCmd==="E" || sCmd==="W" || sCmd=== "U" || sCmd==="D" || sCmd==="IN" || sCmd==="OUT") {
        doNav(sCmd.toLowerCase());
        return;
    } // end if

    if (sCmd==="NE" || sCmd==="SE" || sCmd==="NW" || sCmd==="SW" || sCmd=== "U" || sCmd==="D" || sCmd==="PANEL") {
        doNav(sCmd.toLowerCase());
        return;
    } // end if
    // ----------------------------------------------------------------------------------------

    if (sCmd==="INV") {
        logPlay("what?");
        return;
    } // end if

    if (sCmd==="INVENTORY") {
        displayInventory();
        return;
    } // end if

    if (!playerInfo.hasLamp) {
        if (sCmd==="ON" || sCmd==="OFF" || sCmd==="LIGHT LAMP") {
            logPlay("You have no source of light.");
            return;
        } // end if
    } // end if

    if (sCmd==="ON") {
        if (playerInfo.hasLamp) {
            if (!playerInfo.lampLit) {
                playerInfo.lampLit = true;
                logPlay("Your lamp is now on.");
                return;
            } else {
                // original game makes no distinction if the lamp is already on or off.
                logPlay("Your lamp is now on.");
                return;
            } // end if / else
        } // end if
    } // end if

    if (sCmd==="OFF" && playerInfo.hasLampHasLamp) {
        if (playerInfo.lampLit) {
            playerInfo.lampLit = false;
            logPlay("Your lamp is now off.");
            return;
        } else {
            // original game makes no distinction if the lamp is already on or off.
            logPlay("Your lamp is now off.");
        } // end if / else
    } // end if

    let sWords = sCmd.split(" ");
    let bVerb = false;

    if (sWords[0] === "TAKE" || sWords[0] === "GET") {
        bVerb = true;
        attemptToGetItem(sWords);
        return;
    } // end if

    if (sWords[0] === "DROP") {
        bVerb = true;
        attemptToDropItem(sWords);
        return;
    } // end if

    if (sWords[0] === "DRINK") {
        bVerb = true;
    } // end if

    if (sWords[0] === "EAT") {
        bVerb = true;
    } // end if

    if (sWords[0] === "THROW") {
        bVerb = true;
    } // end if

    if (sWords[0] === "KILL") {
        bVerb = true;
    } // end if

    if (sWords[0] === "LIGHT") {
        bVerb = true;
    } // end if

    if (sWords.length === 1) {
        if (bVerb) {
            logPlay(sWords[0]+" what?");
            return;
        } // end if (bVerb)

        logPlay("I don't know that word.");
        return;
    } // end if

    if (sWords.length > 1) {

        logPlay("I don't understand.");
        return;
    } // end if
} // end of function ProcTextEntry()


function restartGame() {
    logPlay("*** Game restarted to the beginning...");
    newGame();
} // end of function restartGame()



function restartGameCanceled() {
    logPlay("*** Game restart canceled...");
} // end of function restartGameCanceled()



/********************************************************************************* 
 *    set up a generic Room object with its unique id and add it to
 *    arrays by index, and id.
 * 
 *********************************************************************************/
function RoomObj(nRoomNum) {
    const roomObj = this;

    roomObj.id = "room_"+nRoomNum;
    roomObj.descr = [];
    roomObj.objType = "room";
    roomObj.needLight = true;
    roomObj.hasSerpent = false;
    roomObj.itemsByIndex = [];
    roomObj.itemsByName = []; // the item's shortName!
    roomObj.itemsByKey = [];
    roomObj.moveByDirection = [];

    app.roomsByIndex.push(roomObj);
    app.roomsById[roomObj.id] = roomObj;
} // end of function RoomObj()



/********************************************************************************* 
 * 
 *  see:   openDb() 
 *             +- onupdateneeded() code to see how database was set up!
 * 
 * need to save objects for these keys:
 *              "gameList"
 *              "lastGameId"
 *              "gameSummary~"+sGameName
 *              "gameDetail~"+sGameName
 *********************************************************************************/
function saveCurrentGamePart1() {
    const gameDetailObj = {};
    const gameListItmObj = {};

    let sGameName = app.currentGameName;

    // *** SAVE / MODIFY GAME'S DATA
    // -------------------------------------------------
    gameDetailObj.id = "gameDetail~"+sGameName;
    gameDetailObj.objType = "gameDetail";
    gameDetailObj.gameName = sGameName;
    gameDetailObj.savedAt = new Date();
  //  gameDetailObj.playLogByIndex = app.playLogByIndex;
  //  in retrospect, saving play log was not a good idea. loading it up on a game load is confusing to the user!
    gameDetailObj.playerInfo = {};

    let sProp;

    for (sProp in playerInfo) {
        let propValue = playerInfo[sProp];
        let sType = typeof propValue;
        
        if (sType !== "object" && sType !== "array") {
            gameDetailObj.playerInfo[sProp] = propValue;
        } // end if
    } // next sProp

    let gameObjChangesByIndex = [];

    let nMax1 = app.roomsByIndex.length;
    for (let n1=0;n1<nMax1;n1++) {
        const room = app.roomsByIndex[n1];
        collectObjChanges(gameObjChangesByIndex, room);
    } // next n1

    let nMax2 = app.itemsByIndex.length;
    for (let n2=0;n2<nMax2;n2++) {
        const item = app.itemsByIndex[n2];
        collectObjChanges(gameObjChangesByIndex, item);
    } // next n1

    gameDetailObj.gameObjChangesByIndex = gameObjChangesByIndex;

    // $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$


    // *** MODIFY GAMES LIST
    // -------------------------------------------------
    gameListItmObj.id = gameDetailObj.id;
    gameListItmObj.gameName = sGameName;

    if (typeof app.gamesListByName[sGameName] === "undefined") {        
        app.gamesListByIndex.push(gameListItmObj);
        //app.gamesListById[gameListItmObj.id] = gameListItmObj;
    } // end if

    const gameSaveList = {};
    gameSaveList.id = "gameList";
    gameSaveList.objType = "gameList";
    gameSaveList.gameListByIndex = app.gamesListByIndex;

    app.gamesListByName[sGameName] = gameListItmObj;


    dbProc.addObjectToSaveRequest({key:gameDetailObj.id,value:gameDetailObj});
    setLastGameInfo(gameDetailObj.id);
    dbProc.addObjectToSaveRequest({key:"gameList",value:gameSaveList});
    dbProc.processRequests(saveCurrentGamePart2);
    
    /********************************************************************************* 
     *********************************************************************************/
    function collectObjChanges(arr, obj) {
        let bChangeFound = false;
        let changeObj;

        if (typeof obj.baselineValues !== "object") {
            return;
        } // end if

        let baselineValues = obj.baselineValues;

        for (sProp in baselineValues) {
            if (obj[sProp] !== baselineValues[sProp]) {
                // Delta found

                if (!bChangeFound) {
                    changeObj = {};
                    changeObj.objType = obj.objType;

                    if (changeObj.objType === "room") {
                        changeObj.id =obj.id;
                    } // end if

                    if (changeObj.objType === "item") {
                        changeObj.keyName =obj.keyName;
                    } // end if

                    bChangeFound = true;
                } // end if

                changeObj[sProp] = obj[sProp];
            } // end if
        } // next sProp

        if (bChangeFound) {
            arr.push(changeObj);
        } // end if
    } // end of function collectObjChanges()


} // end of function saveCurrentGamePart1()




/********************************************************************************* 
 *********************************************************************************/
function saveCurrentGamePart2() {
    console.log("saveCurrentGamePart2() called")
    
    logPlay("Game Saved!");
    hideDialog();
} // end of function saveCurrentGamePart2()



/********************************************************************************* 
 *********************************************************************************/
function setItmKeyVal(arrByKey,itmObj,vNewValue) {
    arrByKey[itmObj.shortName] = vNewValue;
    const nMax = itmObj.alternateNames.length;

    for (let n=0;n<nMax;n++) {
        arrByKey[itmObj.alternateNames[n]] = vNewValue;
    } // next n

    return arrByKey;
} // end of function setItmKeyVal()





/********************************************************************************* 

   
   
 *********************************************************************************/



 /********************************************************************************* 
  *   do in middle of dbProc ing!
  *********************************************************************************/
 function setLastGameInfo(sGameId) {
    console.log("setLastGameInfo() called")
    const lastGame = {};
    lastGame.id = "lastGame"
    lastGame.objType = "lastGame";
    lastGame.gameKey = sGameId;
    app.lastGameId = sGameId;
    dbProc.addObjectToSaveRequest({key:"lastGame",value:lastGame});
 } // end of setLastGameInfo()



/********************************************************************************* 
 *   below used when loading a saved game
 * 
 *   Called from:    loadGame2()
 * 
 *   Called after loading Game object changes!
 * 
 *********************************************************************************/
 function setupInventoryForPlayer() {
    console.log("📝 setupInventoryForPlayer() called")
    const nMax = app.itemsByIndex.length;

    for (let n=0;n<nMax;n++) {
        const itmObj = app.itemsByIndex[n];
        
        if (itmObj.currentLocation === -1) {
            playerInfo.itemsByIndex.push(itmObj);
        } // end if

    } // next n

 } // end of function setupInventoryForPlayer()


/********************************************************************************* 
 *********************************************************************************/
function setupItems() {
    console.log("setupItems() called")
    let itmObj;

    itmObj = new ItemObj("#bridge_15");
    itmObj.shortName = "Stone bridge";
    itmObj = new ItemObj("#bridge_18");
    itmObj.shortName = "Stone bridge";
    itmObj = new ItemObj("#MACHINE", 51);
    itmObj.shortName = "Vending Machine";
    itmObj.longName = "THERE IS A massive vending machine here. The instructions on it read- \"drop coins here to receive fresh batteries\"."
    itmObj = new ItemObj("#PLANT_A", 81);
    itmObj.shortName = "Tiny Plant";
    itmObj.isPlant = true;
    itmObj.longName = "There is a tiny plant in the pit, murmering \"water, water, ...\"";
    itmObj = new ItemObj("#PLANT_B");
    itmObj.shortName = "Twelve foot beanstalk";
    itmObj.longName = "There is a twelve foot bean stalk stretching up out of the pit, bellowing \"water... water...\"";
    itmObj = new ItemObj("#PLANT_C");
    itmObj.shortName = "Giant beanstalk";
    itmObj = new ItemObj("#SERPENT", 16);
    itmObj.shortName = "Serpent bars the way";

    itmObj = new ItemObj("#LAMP", 2);
    itmObj.isGettable = true;
    itmObj.isLamp = true;
    itmObj.lampOn = false;
    itmObj.shortName = "LAMP";
    itmObj.invName = "BRASS LANTERN";
    itmObj.longName = "THERE IS A SHINY BRASS LAMP NEARBY."
    
    itmObj = new ItemObj("#BOX", 8);
    itmObj.shortName = "BOX";
    itmObj.longName = "There is a small statue box discarded nearby.";
    itmObj.invName = "Statue Box";
    itmObj.isGettable = true;
    itmObj.isBox = true;

    itmObj = new ItemObj("#SCEPTER", 9);
    itmObj.shortName = "Scepter";
    itmObj.longName = "A three foot scepter with an ankh on an end lies nearby.";
    itmObj.invName = "Scepter";
    itmObj.isGettable = true;
    itmObj.isScepter = true;

    itmObj = new ItemObj("#PILLOW", 72);
    itmObj.shortName = "Pillow";
    itmObj.isGettable = true;

    itmObj = new ItemObj("#BIRD", 11);
    itmObj.shortName = "bird";
    itmObj.longName = "A statute of the bird god is sitting here.";
    itmObj.isGettable = true; // will be made false if you have the sc
    itmObj.isBirdGod = true;
    itmObj.alternateNames.push("statue");

    itmObj = new ItemObj("#POTTERY");
    itmObj = new ItemObj("#PEARL");
    itmObj = new ItemObj("#SARCOPH", 61);

    itmObj = new ItemObj("#MAGAZINES", 59);

    itmObj = new ItemObj("#FOOD", 2);
    itmObj.longName = "THERE IS FOOD HERE."

    itmObj = new ItemObj("#BOTTLE", 2);
    itmObj.isGettable = true;
    itmObj.shortName = "BOTTLE";
    itmObj.longName = "THERE IS A BOTTLE HERE."
    itmObj.isBottle = true;
    itmObj.hasWater = true;

    itmObj = new ItemObj("#WATER");
    itmObj.insideOf = "#BOTTLE";
    itmObj.longName = "THERE IS WATER IN THE BOTTLE."
    itmObj = new ItemObj("#STREAM_56", 56);
    itmObj = new ItemObj("#EMERALD", 76);
    itmObj = new ItemObj("#VASE_pillow");
    itmObj = new ItemObj("#VASE_solo", 73);
    itmObj = new ItemObj("#KEY", 68);
    itmObj = new ItemObj("#BATTERIES");
    

    itmObj = new ItemObj("#GOLD", 14);
    itmObj.isGettable = true;
    itmObj.isGold = true;
    itmObj.shortName = "gold";
    itmObj.alternateNames.push("nugget");
    itmObj.longName = "THERE IS A LARGE SPARKLING NUGGET OF GOLD HERE!"

    itmObj = new ItemObj("#DIAMONDS", 17);
    itmObj = new ItemObj("#SILVER", 25);
    itmObj = new ItemObj("#JEWELRY", 18);
    itmObj = new ItemObj("#COINS", 24);
    itmObj = new ItemObj("#CHEST");
    itmObj = new ItemObj("#NEST", 71);
    itmObj = new ItemObj("#LAMP_dead");


} // end of function setupItems()







/********************************************************************************* 
 * 
 * Refs:
       http://computerarcheology.com/CoCo/Pyramid/Code.html#room-descriptions
       Note: rooms 67 and 69 seem to be missing!

 *********************************************************************************/
function setupRooms() {
    let room;
    const sInDesert = "YOU ARE IN THE DESERT.";
    const sDeadEnd = "DEAD END.";
    const sTwisty = "YOU ARE IN A MAZE OF TWISTY PASSAGES, ALL ALIKE.";

    // room: 1
    room = new RoomObj(1);
    room.descr.push("YOU ARE STANDING BEFORE THE ENTRANCE OF A PYRAMID. AROUND YOU IS A DESERT.");
    room.moveByDirection["n"] = navInfo(2);
    room.moveByDirection["e"] = navInfo(3);
    room.moveByDirection["s"] = navInfo(4);
    room.moveByDirection["w"] = navInfo(5);
    room.moveByDirection["in"] = navInfo(2);
    room.needLight = false;

    // room: 2
    room = new RoomObj(2);
    room.descr.push("YOU ARE IN THE ENTRANCE TO THE PYRAMID. A HOLE IN THE FLOOR LEADS TO A PASSAGE BENEATH THE");
    room.descr.push("SURFACE.");
    room.moveByDirection["s"] = navInfo(1);
    room.moveByDirection["d"] = navInfo(7);
    room.moveByDirection["out"] = navInfo(1);
    const panelNav = navInfo(26);
    room.moveByDirection["panel"] = panelNav;
    room.needLight = false;

    // ==============================
    // room: 3
    room = new RoomObj(3);    
    room.descr.push(sInDesert);
    room.moveByDirection["n"] = navInfo(6);
    room.moveByDirection["e"] = navInfo(3);
    room.moveByDirection["s"] = navInfo(4);
    room.moveByDirection["w"] = navInfo(1);
    room.needLight = false;

    // room: 4
    room = new RoomObj(4);    
    room.descr.push(sInDesert);
    room.moveByDirection["n"] = navInfo(1);
    room.moveByDirection["e"] = navInfo(3);
    room.moveByDirection["s"] = navInfo(4);
    room.moveByDirection["w"] = navInfo(5);

    // room: 5
    room = new RoomObj(5);    
    room.descr.push(sInDesert);
    room.moveByDirection["n"] = navInfo(6);
    room.moveByDirection["e"] = navInfo(1);
    room.moveByDirection["s"] = navInfo(4);
    room.moveByDirection["w"] = navInfo(5);
    room.needLight = false;

    // room: 6
    room = new RoomObj(6);    
    room.descr.push(sInDesert);
    room.moveByDirection["n"] = navInfo(6);
    room.moveByDirection["e"] = navInfo(3);
    room.moveByDirection["s"] = navInfo(1);
    room.moveByDirection["w"] = navInfo(5);
    room.needLight = false;
    // ==============================

    // room: 7
    room = new RoomObj(7);    
    room.descr.push("YOU ARE IN A SMALL CHAMBER BENEATH A HOLE FROM THE SURFACE. A LOW CRAWL LEADS INWARD TO THE WEST.");
    room.descr.push("HIEROGLYPHICS ON THE WALL TRANSLATE, "+ Q + "CURSE ALL WHO ENTER THIS SACRED CRYPT."+Q);
    room.moveByDirection["u"] = navInfo(2);
    room.moveByDirection["out"] = navInfo(2);
    room.moveByDirection["w"] = navInfo(8);
    room.moveByDirection["in"] = navInfo(8);
    room.needLight = false;

    // room: 8
    room = new RoomObj(8);  
    room.descr.push("YOU ARE CRAWLING OVER PEBBLES IN A LOW PASSAGE. THERE IS A DIM LIGHT AT THE EAST END OF THE");
    room.descr.push("PASSAGE.");
    room.moveByDirection["e"] = navInfo(7);
    room.moveByDirection["out"] = navInfo(7);
    room.moveByDirection["w"] = navInfo(9);
    room.moveByDirection["in"] = navInfo(9);

    // room: 9
    room = new RoomObj(9);  
    room.descr.push("YOU ARE IN A ROOM FILLED WITH BROKEN POTTERY SHARDS OF ANCIENT EGYPTIAN CRAFTS. AN AWKWARD CORRIDOR ");
    room.descr.push("LEADS UPWARD AND WEST.");
    room.moveByDirection["e"] = navInfo(8);
    room.moveByDirection["in"] = navInfo(10);
    room.moveByDirection["u"] = navInfo(10);
    room.moveByDirection["w"] = navInfo(10);
    
    // room: 10
    room = new RoomObj(10);  
    room.descr.push("YOU ARE IN AN AWKWARD SLOPING EAST/WEST CORRIDOR.");
    room.moveByDirection["d"] = navInfo(9);
    room.moveByDirection["e"] = navInfo(9);
    room.moveByDirection["in"] = navInfo(11);
    room.moveByDirection["w"] = navInfo(11);
    room.moveByDirection["u"] = navInfo(11);
    

    // room: 11
    room = new RoomObj(11); 
    room.descr.push("YOU ARE IN A SPLENDID CHAMBER THIRTY FEET HIGH. THE WALLS ARE FROZEN RIVERS OF ORANGE STONE. AN ");
    room.descr.push("AWKWARD CORRIDOR AND A GOOD PASSAGE EXIT FROM THE EAST AND WEST SIDES OF THE CHAMBER.");
    room.moveByDirection["e"] = navInfo(10);
    room.moveByDirection["w"] = navInfo(12);

    // room: 12
    room = new RoomObj(12); 
    room.descr.push("AT YOUR FEET IS A SMALL PIT BREATHING TRACES OF WHITE MIST. AN EAST PASSAGE ENDS HERE EXCEPT FOR A");
    room.descr.push("SMALL CRACK LEADING ON. ROUGH STONE STEPS LEAD DOWN THE PIT.");
    room.moveByDirection["e"] = navInfo(11);
    // --- come back to directions on this room!

    // room: 13
    room = new RoomObj(13); 
    room.descr.push("YOU ARE AT ONE END OF A VAST HALL STRETCHING FORWARD OUT OF SIGHT TO THE WEST. THERE ARE OPENINGS TO");
    room.descr.push("EITHER SIDE. NEARBY, A WIDE STONE STAIRCASE LEADS DOWNWARD. THE HALL IS VERY MUSTY AND A COLD WIND");
    room.descr.push("BLOWS UP THE STAIRCASE. THERE IS A PASSAGE AT THE TOP OF A DOME BEHIND YOU. ROUGH STONE STEPS LEAD");
    room.descr.push("UP THE DOME.");
    room.moveByDirection["s"] = navInfo(14);
    room.moveByDirection["w"] = navInfo(15);
    room.moveByDirection["d"] = navInfo(16);
    room.moveByDirection["n"] = navInfo(16);
    // --- come back to directions on this room!

    //room.descr.push("");

    // room: 14
    room = new RoomObj(14); 
    room.descr.push("THIS IS A LOW ROOM WITH A HIEROGLYPH ON THE WALL. IT TRANSLATES "+Q+"YOU WON'T GET IT UP THE STEPS"+Q+".");
    room.moveByDirection["s"] = navInfo(14);
// probably Gold is the item... we will see!!

    const sSerpentMsg = "A huge green serpent bars the way!";
     
    // room: 15
    room = new RoomObj(15); 
    room.descr.push("YOU ARE ON THE EAST BANK OF A BOTTOMLESS PIT STRETCHING ACROSS THE HALL. THE MIST IS QUITE THICK");
    room.descr.push("HERE, AND THE PIT IS TOO WIDE TO JUMP.");
    // dropping the scepture here for usage later is a good idea!  (7:25)

    // room: 16
    room = new RoomObj(16);
    room.hasSerpent = true;
    room.descr.push("YOU ARE IN THE PHARAOH'S CHAMBER, WITH PASSAGES OFF IN ALL DIRECTIONS.");
    room.moveByDirection["s"] = navInfo(17);
    // "A huge green serpent bars the way!"
    // "Throw bird" command solve serpent problem.

    /*
     The bird statue comes to life and attacks the serpent and in an
     astounding flurry, drives the serpent away. the bird turns back
     into a statue.

     (7:48)
     */

    // room: 17
    room = new RoomObj(17);
    room.descr.push("YOU ARE IN THE SOUTH SIDE CHAMBER.");

    //room.descr.push("");

    // room: 18
    room = new RoomObj(18);
    room.descr.push("YOU ARE ON THE WEST SIDE OF THE BOTTOMLESS PIT IN THE HALL OF GODS.");

    // room: 19
    room = new RoomObj(19);
    room.descr.push("YOU ARE AT THE WEST END OF THE HALL OF GODS. A LOW WIDE PASS CONTINUES WEST AND ANOTHER GOES NORTH.");
    room.descr.push("TO THE SOUTH IS A LITTLE PASSAGE SIX FEET OFF THE FLOOR.");

    // room: 20
    room = new RoomObj(20);
    room.descr.push("YOU ARE AT EAST END OF A VERY LONG HALL APPARENTLY WITHOUT SIDE CHAMBERS. TO THE EAST A LOW WIDE");
    room.descr.push("CRAWL SLANTS UP. TO THE NORTH A ROUND TWO FOOT HOLE SLANTS DOWN.");

    // room: 21
    room = new RoomObj(21);
    room.descr.push("YOU ARE AT THE WEST END OF A VERY LONG FEATURELESS HALL. THE HALL JOINS UP WITH A NARROW NORTH/SOUTH");
    room.descr.push("PASSAGE.");

    //room.descr.push("");

    // room: 22
    room = new RoomObj(22);
    room.descr.push("YOU ARE AT A CROSSOVER OF A HIGH N/S PASSAGE AND A LOW E/W ONE.");

    
    // room: 23
    room = new RoomObj(23);
    room.descr.push(sDeadEnd);

    // room: 24
    room = new RoomObj(24);
    room.descr.push("YOU ARE IN THE WEST THRONE CHAMBER. A PASSAGE CONTINUES WEST AND UP FROM HERE.");

    // room: 25
    room = new RoomObj(25);
    room.descr.push("YOU ARE IN A LOW N/S PASSAGE AT A HOLE IN THE FLOOR. THE HOLE GOES DOWN TO AN E/W PASSAGE.");

    // room: 26
    room = new RoomObj(26);
    room.descr.push("YOU ARE IN A LARGE ROOM, WITH A PASSAGE TO THE SOUTH, AND A WALL OF BROKEN ROCK TO THE EAST. THERE");
    room.descr.push("IS A PANEL ON THE NORTH WALL.");
    
    // room: 27
    room = new RoomObj(27);
    room.descr.push("YOU ARE IN THE CHAMBER OF ANUBIS.");

    // room: 28
    room = new RoomObj(28);
    room.descr.push(sTwisty);

    // room: 29
    room = new RoomObj(29);
    room.descr.push(sTwisty);

    // room: 30
    room = new RoomObj(30);
    room.descr.push(sTwisty);

    // room: 31
    room = new RoomObj(31);
    room.descr.push(sTwisty);

    // room: 32
    room = new RoomObj(32);
    room.descr.push(sTwisty);

    // room: 33
    room = new RoomObj(33);
    room.descr.push(sTwisty);

    // room: 34
    room = new RoomObj(34);
    room.descr.push(sTwisty);

    // room: 35
    room = new RoomObj(35);
    room.descr.push(sTwisty);

    // room: 36
    room = new RoomObj(36);
    room.descr.push(sTwisty);

    // room: 37
    room = new RoomObj(37);
    room.descr.push(sTwisty);

    // room: 38
    room = new RoomObj(38);
    room.descr.push(sTwisty);

    // room: 39
    room = new RoomObj(39);
    room.descr.push(sTwisty);

    // room: 40
    room = new RoomObj(40);
    room.descr.push(sTwisty);

    // room: 41
    room = new RoomObj(41);
    room.descr.push(sTwisty);

    // room: 42
    room = new RoomObj(42);
    room.descr.push(sDeadEnd);

    // room: 43
    room = new RoomObj(43);
    room.descr.push(sDeadEnd);

    // room: 44
    room = new RoomObj(44);
    room.descr.push(sDeadEnd);

    // room: 45
    room = new RoomObj(45);
    room.descr.push(sDeadEnd);

    // room: 46
    room = new RoomObj(46);
    room.descr.push(sDeadEnd);

    // room: 47
    room = new RoomObj(47);
    room.descr.push(sDeadEnd);

    // room: 48
    room = new RoomObj(48);
    room.descr.push(sDeadEnd);

    // room: 49
    room = new RoomObj(49);
    room.descr.push(sDeadEnd);

    // room: 50
    room = new RoomObj(50);
    room.descr.push(sDeadEnd);

    // room: 51
    room = new RoomObj(51);
    room.descr.push(sDeadEnd);

    // room: 52
    room = new RoomObj(52);
    room.descr.push("YOU ARE ON THE BRINK OF A LARGE PIT. YOU COULD CLIMB DOWN, BUT YOU WOULD NOT BE ABLE TO CLIMB BACK");
    room.descr.push("UP. THE MAZE CONTINUES ON THIS LEVEL.");

    // room: 53
    room = new RoomObj(53);
    room.descr.push(sDeadEnd);

    // room: 54
    room = new RoomObj(54);
    room.descr.push("YOU ARE IN A DIRTY BROKEN PASSAGE. TO THE EAST IS A CRAWL. TO THE WEST IS A LARGE PASSAGE. ABOVE YOU");
    room.descr.push("IS A HOLE TO ANOTHER PASSAGE.");

    // room: 55
    room = new RoomObj(55);
    room.descr.push("YOU ARE ON THE BRINK OF A SMALL CLEAN CLIMBABLE PIT. A CRAWL LEADS WEST.");

    // room: 56
    room = new RoomObj(56);
    room.descr.push("YOU ARE IN THE BOTTOM OF A SMALL PIT WITH A LITTLE STREAM, WHICH ENTERS AND EXITS THROUGH TINY");
    room.descr.push("SLITS.");

    // room: 57
    room = new RoomObj(57);
    room.descr.push("YOU ARE IN A THE ROOM OF BES, WHOSE PICTURE IS ON THE WALL. THERE IS A BIG HOLE IN THE FLOOR. THERE");
    room.descr.push("IS A PASSAGE LEADING EAST.");

    // room: 58
    room = new RoomObj(58);
    room.descr.push("YOU ARE AT A COMPLEX JUNCTION. A LOW HANDS AND KNEES PASSAGE FROM THE NORTH JOINS A HIGHER CRAWL");
    room.descr.push("FROM THE EAST TO MAKE A WALKING PASSAGE GOING WEST. THERE IS ALSO A LARGE ROOM ABOVE. THE AIR IS");
    room.descr.push("DAMP HERE.");

    // room: 59
    room = new RoomObj(59);
    room.descr.push("YOU ARE IN THE UNDERWORLD ANTEROOM OF SEKER. PASSAGES GO EAST, WEST, AND UP. HUMAN BONES ARE STREWN");
    room.descr.push("ABOUT ON THE FLOOR. HIEROGLYPHICS ON THE WALL ROUGHLY TRANSLATE TO "+Q+"THOSE WHO PROCEED EAST MAY NEVER");
    room.descr.push("RETURN."+Q);

    // room: 60
    room = new RoomObj(60);
    room.descr.push("YOU ARE AT THE LAND OF DEAD. PASSAGES LEAD OFF IN &gt;ALL&lt; DIRECTIONS.");

    // room: 61
    room = new RoomObj(61);
    room.descr.push("YOU'RE IN A LARGE ROOM WITH ANCIENT DRAWINGS ON ALL WALLS. THE PICTURES DEPICT ATUM, A PHARAOH");
    room.descr.push("WEARING THE DOUBLE CROWN. A SHALLOW PASSAGE PROCEEDS DOWNWARD, AND A SOMEWHAT STEEPER ONE LEADS UP.");
    room.descr.push("A LOW HANDS AND KNEES PASSAGE ENTERS FROM THE SOUTH.");

    // room: 62
    room = new RoomObj(62);
    room.descr.push("YOU ARE IN A CHAMBER WHOSE WALL CONTAINS A PICTURE OF A MAN WEARING THE LUNAR DISK ON HIS HEAD.  HE");
    room.descr.push("IS THE GOD KHONS, THE MOON GOD.");

    // room: 63
    room = new RoomObj(63);
    room.descr.push("YOU ARE IN A LONG SLOPING CORRIDOR WITH RAGGED WALLS.");

    // room: 64
    room = new RoomObj(64);
    room.descr.push("YOU ARE IN A CUL-DE-SAC ABOUT EIGHT FEET ACROSS.");

    // room: 65
    room = new RoomObj(65);
    room.descr.push("YOU ARE IN THE CHAMBER OF HORUS, A LONG EAST/WEST PASSAGE WITH HOLES EVERYWHERE. TO EXPLORE AT");
    room.descr.push("RANDOM, SELECT NORTH, SOUTH, UP, OR DOWN.");

    // room: 66
    room = new RoomObj(66);
    room.descr.push("YOU ARE IN A LARGE LOW CIRCULAR CHAMBER WHOSE FLOOR IS AN IMMENSE SLAB FALLEN FROM THE CEILING. EAST");
    room.descr.push("AND WEST THERE ONCE WERE LARGE PASSAGES, BUT THEY ARE NOW FILLED WITH SAND. LOW SMALL PASSAGES GO");
    room.descr.push("NORTH AND SOUTH.");

    // room: 67  ???
    //room = new RoomObj(67);
    //room.descr.push("");


    // room: 68
    room = new RoomObj(68);
    room.descr.push("YOU ARE IN THE CHAMBER OF NEKHEBET, A WOMAN WITH THE HEAD OF A VULTURE, WEARING THE CROWN OF EGYPT.");
    room.descr.push("A PASSAGE EXITS TO THE SOUTH.");

    // room: 69  ???
    //room = new RoomObj(69);
    //room.descr.push("");

    // room: 70
    room = new RoomObj(70);
    room.descr.push("THE PASSAGE HERE IS BLOCKED BY A FALLEN BLOCK.");

    // room: 71
    room = new RoomObj(71);
    room.descr.push("YOU ARE IN THE CHAMBER OF OSIRIS. THE CEILING IS TOO HIGH UP FOR YOUR LAMP TO SHOW IT. PASSAGES LEAD");
    room.descr.push("EAST, NORTH, AND SOUTH.");

    // room: 72
    room = new RoomObj(72);
    room.descr.push("YOU ARE IN THE PRIEST'S BEDROOM. THE WALLS ARE COVERED WITH CURTAINS, THE FLOOR WITH A THICK PILE");
    room.descr.push("CARPET. MOSS COVERS THE CEILING.");

    // room: 73
    room = new RoomObj(73);
    room.descr.push("THIS IS THE CHAMBER OF THE HIGH PRIEST. ANCIENT DRAWINGS COVER THE WALLS. AN EXTREMELY TIGHT TUNNEL");
    room.descr.push("LEADS WEST. IT LOOKS LIKE A TIGHT SQUEEZE. ANOTHER PASSAGE LEADS SE.");

    // room: 74
    room = new RoomObj(74);
    room.descr.push("");

    // room: 75
    room = new RoomObj(75);
    room.descr.push("");
    
    // room: 76
    room = new RoomObj(76);
    room.descr.push("YOU ARE IN THE HIGH PRIEST'S TREASURE ROOM LIT BY AN EERIE GREEN LIGHT. A NARROW TUNNEL EXITS TO THE");
    room.descr.push("EAST.");

    // room: 77
    room = new RoomObj(77);
    room.descr.push("YOU ARE IN A LONG, NARROW CORRIDOR STRETCHING OUT OF SIGHT TO THE WEST. AT THE EASTERN END IS A HOLE");
    room.descr.push("THROUGH WHICH YOU CAN SEE A PROFUSION OF LEAVES.");

    // room: 78
    room = new RoomObj(78);
    room.descr.push("YOU ARE AT THE EAST END OF THE TWOPIT ROOM. THE FLOOR HERE IS LITTERED WITH THIN ROCK SLABS, WHICH");
    room.descr.push("MAKE IT EASY TO DESCEND THE PITS. THERE IS A PATH HERE BYPASSING THE PITS TO CONNECT PASSAGES EAST");
    room.descr.push("AND WEST. THERE ARE HOLES ALL OVER, BUT THE ONLY BIG ONE IS ON THE WALL DIRECTLY OVER THE WEST PIT");
    room.descr.push("WHERE YOU CAN'T GET TO IT.");
    room.needLight = false;

    // room: 79
    room = new RoomObj(79);
    room.descr.push("YOU ARE AT THE BOTTOM OF THE EASTERN PIT IN THE TWOPIT ROOM.");

    // room: 80
    room = new RoomObj(80);
    room.descr.push("YOU ARE AT THE WEST END OF THE TWOPIT ROOM. THERE IS A LARGE HOLE IN THE WALL ABOVE THE PIT AT THIS");
    room.descr.push("END OF THE ROOM.");

    // room: 81
    room = new RoomObj(81);
    room.descr.push("YOU ARE AT THE BOTTOM OF THE WEST PIT IN THE TWOPIT ROOM. THERE IS A LARGE HOLE IN THE WALL ABOUT");
    room.descr.push("TWENTY FIVE FEET ABOVE YOU.");

    //room.descr.push("");

} // end of function setupRooms()







/****************************************************************************************************************************
 * take our array of item objects and make sure that they are assigned as items to rooms based on their starting room id.
 * (where the starting room id is greater than zero)! 
 ****************************************************************************************************************************/
function setupRoomsForItems() {
    console.log("🗂 setupRoomsForItems() called")
    const nMax = app.itemsByIndex.length;

    for (let n=0;n<nMax;n++) {
        const itmObj = app.itemsByIndex[n];

        if (itmObj.startLocation > 0) {
            const roomObj = getExistingRoomObj(itmObj.startLocation);
            roomObj.itemsByIndex.push(itmObj);
            roomObj.itemsByName[itmObj.shortName.toUpperCase()] = itmObj;
            roomObj.itemsByKey[itmObj.keyName] = itmObj;

            const nMax2 = itmObj.alternateNames.length;

            if (nMax2 > 0) {
                for (let n2=0;n2<nMax2;n2++) {
                    roomObj.itemsByName[itmObj.alternateNames[n2].toUpperCase()] = itmObj;
                } // next n2
            } // end if
        } // end if
    } // next n

} // end of function setupRoomsForItems()






/********************************************************************************* 
 *  
 *********************************************************************************/
function showDialog(sMarkup) {
    showTint();

    diaNd.innerHTML = sMarkup;
    diaNd.style.display = "block";

} // end of function showDialog();



/********************************************************************************* 
 *  
 *********************************************************************************/
function showLoadDialog() {
    let s=[];

    s.push("<div class='loadGamePrompt'>Load Previous Game:</div>");

    s.push("<div class='gameListCntr'>");
        s.push("<ul id='gameList'>");
        s.push("</ul>"); 
    s.push("</div>"); // gameListCntr

    s.push("<center>");
    s.push("<div class='btnArea2'>");
        s.push("<button class='pnlBtn' id='loadBtn' disabled ");
        s.push("onclick='loadSelectedGame()'");
        s.push(">Load Game</button>");

        s.push("<button class='pnlBtn' id='delBtn' disabled ");
        s.push("onclick='deleteGame()'");
        s.push(">Delete Game</button>");

        s.push("<button  class='pnlBtn' ");
        s.push("onclick='hideDialog(\"Load\")'");
        s.push(">Cancel</button>");
    s.push("</center>");
    s.push("</div>"); // btnArea2

    showDialog(s.join(""));

    diaNd.style.maxHeight = "600px";

    let gameListNd = document.getElementById("gameList");
    loadGameList();

    gameListNd.addEventListener('click', selGame);


    /********************************************************************************* 
     *  
     *********************************************************************************/
    function selGame(evt) {
        
        if (typeof evt.target.dataset.id === "string") {
            if (app.selGameId !== "") {
                app.selGameNd.className = "gameListItm"; // unhighlight previously highlighted item
            } // end if

            app.selGameId = evt.target.dataset.id;
            evt.target.className = "gameListItmSel";
            app.selGameNd = evt.target;

            const loadBtnNd = document.getElementById("loadBtn")
            loadBtnNd.disabled = false;
            const delBtnNd = document.getElementById("delBtn")
            delBtnNd.disabled = false;
            
        } // end if

    } // end of function selGame()

} // end of function showLoadDialog()




/********************************************************************************* 
 *  
 *********************************************************************************/
function showSaveDialog(sOption) {
    const s=[];

    if (app.currentGameName !== "" && sOption !== "AS") {
        return;
    } // end if

    s.push("<div class='gameSavePrompt'>Enter Game Name to Save:</div>");
    s.push("<input id='gameName' ");
    s.push("autocomplete='off' ");
    s.push("onkeyup='procGameNameInput()' ");
    s.push(">");

    // buttons:
    s.push("<center>");
    s.push("<div class='btnArea'>");
        s.push("<button class='pnlBtn' id='saveBtn' ");
        s.push("onclick='beginGameSave()'");
        s.push(">Save Game</button>");
        s.push("<button  class='pnlBtn' ");
        s.push("onclick='hideDialog(\"Save\")'");
        s.push(">Cancel</button>");
    s.push("</center>");
    s.push("</div>"); // btnArea

    s.push("<div id='diaSaveInfo'>");
    s.push("</div>"); // diaSaveInfo

    

    showDialog(s.join(""));
    

    const gameNameNd = document.getElementById("gameName");

    gameNameNd.addEventListener('keydown', filterTilda);

    if (app.currentGameName !== "") {
        gameNameNd.value = app.currentGameName;
    } // end if

    gameNameNd.focus();

} // end of function showSaveDialog()







/********************************************************************************* 
 *  
 *********************************************************************************/
function showTint() {
    tintNd.style.display = "block";
} // end of function showTint()


