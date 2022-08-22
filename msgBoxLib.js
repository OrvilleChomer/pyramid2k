
const msgBoxLib = new MsgBoxLib();

/********************************************************************************* 
 *********************************************************************************/
function MsgBoxLib() {
    console.log("MsgBoxLib() constructor called")
    const msgBoxLib = this;


    let nHighestZIndex = 999;
    let msgBoxesById = [];
    let allMsgBoxButtonsById = [];
    let nNextMsgBoxId = 0;
    let w,h;
    let currentTintLayers = [];
    let currentMsgBoxLayers = []
    let bResizeEventHandlerSet = false;

    let nBoxWidth = 600;
    let nBoxHeight = 300;

   /********************************************************************************* 
    *********************************************************************************/
    msgBoxLib.msgBox = function(params) {
        console.log("msgBox method called")
        let msgBoxObj = {};
        let s=[];
        let Q = '"';
        
        w = window.innerWidth;
        h = window.innerHeight;

        nNextMsgBoxId = nNextMsgBoxId + 1;
        msgBoxObj.msgBoxId = "msgbox"+nNextMsgBoxId;
        msgBoxObj.title = paramValue(params, "title", "string", "Alert:");
        msgBoxObj.align = paramValue(params, "align", "string", "center");
        msgBoxObj.msg = paramValue(params, "msg", "string", "Sample Message Box.");

        let defButtons = [];
        const defButton = {};
        defButton.caption = "OK";
        defButton.fn = undefined;
        defButtons.push(defButton);

        msgBoxObj.buttonsByIndex = paramValue(params, "buttons", "array", defButtons);
        msgBoxObj.buttonsById = [];

        msgBoxesById[msgBoxObj.msgBoxId] = msgBoxObj;

        const msgBoxTintNd = document.createElement("div");
        const msgBoxNd = document.createElement("div");

        nHighestZIndex = nHighestZIndex + 1;
        msgBoxTintNd.style.zIndex = nHighestZIndex+"";
        nHighestZIndex = nHighestZIndex + 1;
        msgBoxNd.style.zIndex = nHighestZIndex+"";

        msgBoxTintNd.style.backgroundColor = "black";
        msgBoxTintNd.style.opacity = "0.6";
        msgBoxTintNd.style.position = "absolute";
        msgBoxTintNd.style.left = "0px";
        msgBoxTintNd.style.top = "0px";
        msgBoxTintNd.style.overflow = "hidden";


        msgBoxNd.style.position = "absolute";
        msgBoxNd.style.backgroundColor = "silver";
        msgBoxNd.style.fontFamily = "tahoma";
        msgBoxNd.style.color = "black";
        msgBoxNd.style.width = (nBoxWidth)+"px";
        msgBoxNd.style.height = (nBoxHeight)+"px";
        msgBoxNd.style.overflow = "hidden";
        msgBoxNd.style.borderRadius = "6px";

        s.push("<div ");  // title Bar
        s.push("style="+Q);
        s.push("position:absolute;");
        s.push("left:0px;");
        s.push("top:0px;");
        s.push("width:"+(nBoxWidth)+"px;");
        s.push("text-align:center;");
        s.push("background:darkblue;");
        s.push("color:white;");
        s.push("height:25px;");
        s.push("text-height:25px;");
        s.push("font-size:14pt;");
        s.push("font-weight:bold;");
        s.push(Q);
        s.push(">");
        s.push(msgBoxObj.title);
        s.push("</div>");   // close of title Bar

        s.push("<div ");  // msg area
        s.push("style="+Q);
        s.push("position:absolute;");
        s.push("left:20px;");
        s.push("top:50px;");
        s.push("width:"+(nBoxWidth-40)+"px;");
        s.push("text-align:"+msgBoxObj.align+";");
        s.push("font-size:12pt;");
        s.push(Q);
        s.push(">");
        s.push(msgBoxObj.msg);
        s.push("</div>");   // close of msg area


        // Generate Msgbox buttons:
        s.push("<div ");  // button wrapper
        s.push("style="+Q);
        s.push("position:absolute;");
        s.push("left:0px;");
        s.push("bottom:15px;");
        s.push("width:"+(nBoxWidth)+"px;");
        s.push(Q);
        s.push(">");

        s.push("<center>");

        let nMax = msgBoxObj.buttonsByIndex.length;
        for (let n=0;n<nMax;n++) {
            let btn = msgBoxObj.buttonsByIndex[n];

            nNextMsgBoxId = nNextMsgBoxId + 1;
            const sButtonId = "msgboxBtn"+(nNextMsgBoxId);
            btn.buttonId = sButtonId;
            btn.msgbox = msgBoxObj;
            msgBoxObj.buttonsById[sButtonId] = btn;
            allMsgBoxButtonsById[sButtonId] = btn;

            s.push("<button ");
            s.push("style="+Q);
            s.push("min-width:100px;");
            s.push("font-size:12pt;");
            s.push("margin-left:6px;");
            s.push("margin-right:6px;");
            s.push("border:solid gray 1px;");
            s.push("border-radius:4px;");
            s.push(Q);

            s.push("id='"+sButtonId+"' ");
            s.push(">");
            s.push(btn.caption)
            s.push("</button>");
        } // next n

        s.push("</center>");

        s.push("</div>"); // closing button wrapper

        msgBoxNd.innerHTML = s.join("");

        msgBoxObj.tintNode = msgBoxTintNd;
        msgBoxObj.msgBoxNode = msgBoxNd;

        document.body.appendChild(msgBoxTintNd);
        document.body.appendChild(msgBoxNd);

        currentTintLayers.push(msgBoxTintNd);
        currentMsgBoxLayers.push(msgBoxNd);

        nMax = msgBoxObj.buttonsByIndex.length;
        for (let n=0;n<nMax;n++) {
            let btn = msgBoxObj.buttonsByIndex[n];
            const msgBoxBtnNd = document.getElementById(btn.buttonId);
            msgBoxBtnNd.addEventListener('click', processButtonClick);
        } // next n

        if (!bResizeEventHandlerSet) {
            document.addEventListener('resize', sizeMsgBox);
            bResizeEventHandlerSet = true;
        } // end if

        sizeMsgBox();
    } // end of msgBox method



   /********************************************************************************* 
    *********************************************************************************/
   function sizeMsgBox(evt) {
        console.log("private sizeMsgBox() function called")
       let nMax;
       w = window.innerWidth;
       h = window.innerHeight;

       nMax = currentTintLayers.length;
       for (let n=0;n<nMax;n++) {
            const msgBoxTintNd = currentTintLayers[n];
            msgBoxTintNd.style.width = (w)+"px";
            msgBoxTintNd.style.height = (h) + "px";
       } // next n

       nMax = currentMsgBoxLayers.length;
       for (let n=0;n<nMax;n++) {
            const msgBoxNd = currentMsgBoxLayers[n];
            msgBoxNd.style.top = (Math.floor((h-nBoxHeight)/2))+"px";
            msgBoxNd.style.left = (Math.floor((w-nBoxWidth)/2)) + "px";
       } // next n

       console.log("sizeMsgBox() completed")
    
   } // end of function sizeMsgBox()



   /********************************************************************************* 
    *********************************************************************************/
    function processButtonClick(evt) {
        console.log("private processButtonClick() function called")
        
        const btnNd = evt.srcElement;

        const btn = allMsgBoxButtonsById[btnNd.id];
        const msgbox = btn.msgbox;
        const msgBoxTintNd = msgbox.tintNode;
        const msgBoxNd = msgbox.msgBoxNode;

        // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
        // MAKE MSG BOX DISAPPEAR!:
        //    ... clean up after :D
        //    ... in DOM and in memory model ...
        // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
        msgBoxTintNd.style.display = "none";
        msgBoxNd.style.display = "none";

        // remove message box button event handlers...
        console.log("about to remove message box button event listeners...")
        const nMax = msgbox.buttonsByIndex.length;
        for (let n=0;n<nMax;n++) {
            const btn2 = msgbox.buttonsByIndex[n];
            const msgBoxBtnNd= document.getElementById(btn2.buttonId);
            msgBoxBtnNd.removeEventListener('click', processButtonClick);
        } // next n
        console.log("finished removing message box button event listeners...")

        msgBoxTintNd.parentElement.removeChild(msgBoxTintNd);
        msgBoxNd.parentElement.removeChild(msgBoxNd);

        currentTintLayers.pop();
        currentMsgBoxLayers.pop();

        console.log("about to delete button lookup items...")
        for (let n=0;n<nMax;n++) {
            const btn2 = msgbox.buttonsByIndex[n];
            delete allMsgBoxButtonsById[btn2.id];
        } // next n
        console.log("button lookup items deleted...")

        delete msgBoxesById[msgbox.msgBoxId];
        console.log("msgbox object deleted...")

        nHighestZIndex = nHighestZIndex - 2;
        // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@


        if (typeof btn.fn === "function") {
            console.log("about to call function for button click...")
            setTimeout(btn.fn,100); // allow for display to show msgbox disappearing first!
        } // end if

    } // end of function processButtonClick()



   /********************************************************************************* 
    *********************************************************************************/
    function paramValue(params, sParamName, sDataType, vDefaultValue) {
        console.log("private paramValue() function called")

        if (typeof params !== "object") {
            console.error("params is not an object!");
            throw "params is not an object!"
            return; // this line is here, because I am just paranoid! :D
        } // end if

        if (typeof sParamName !== "string") {
            console.error("paramName is not a string!");
            throw "paramName is not a string!"
        } // end if

        if (sParamName === "") {
            console.error("paramName is blank!");
            throw "paramName is blank!"
        } // end if

        let testValue = params[sParamName];

        if (sDataType === "array") {
            if (Array.isArray(testValue)) {
                return testValue;
            } else {
                if (!Array.isArray(vDefaultValue)) {
                    console.error("default value is not an array!");
                    throw "default value is not an array!"
                } // end if

                return vDefaultValue;
            } // end if array/else

        } else {
            // some other data type other than an array...
            if (typeof testValue === sDataType) {
                return testValue;
            } else {
                return vDefaultValue;
            } // end if/else
        } // end if / else

    } // end of function paramValue()

} // end of Constructor function MsgBoxLib()