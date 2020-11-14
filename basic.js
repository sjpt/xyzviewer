export {addFileTypeHandler, showfirstdata, posturiasync};
const {killev, addFileTypeHandler, E, X} = window;  // killev from OrbitControls ???
X.lastModified.basic = `Last modified: 2020/11/14 10:59:51
`
X.posturiasync = posturiasync;
X.handlerForFid = handlerForFid;

const queryVariables = {};
/** get query variables from search string */
function getQueryVariables() {
    var query = window.location.search.substring(1);
    var vars = query.split('&');

    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        queryVariables[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }
}
getQueryVariables();

/** load and show the initial data, called from the graphics boilerplate code at startup  */
function showfirstdata() {
    if (window.location.search === '?arch') {
        window.addscript("archstart.js");
        return;
    }
    const startcode = queryVariables.startcode;
    if (startcode) eval(startcode);
    const startdata = queryVariables.startdata;
    if (!startdata) return;
    const startlist = startdata
        .split("'").join('').split('"').join('')  // in case of old style interpret usage
        .split(',');
    startlist.forEach(s => posturiasync(s));  // <<< WRONG, they get processed async so maybe wrong order
}

document.ondragover = docdragover;
document.ondrop = docdrop;


/** post a uri and process callback  */
function posturiasync(puri, callb='auto', data='') {
    const binary = puri.endsWith('.ply');
    if (callb === 'auto') callb = handlerForFid(puri);
    var req = new XMLHttpRequest();
    req.open("GET", puri, true);
    if (binary) req.responseType = 'arraybuffer';
    req.setRequestHeader("Content-type", binary ? "application/octet-stream" : "text/plain;charset=UTF-8");
    req.send(data);
    req.onload = function () { 
        callb(binary ? req.response : req.responseText, puri);
    }   // eslint-disable-line no-unused-vars
    req.onerror = function (oEvent) { console.error('cannot load', puri, oEvent); }
    req.ontimeout = function (oEvent) { console.error('timeout error, cannot load', puri, oEvent); }
    // req.onprogress = function (e) { console.log('progress', puri, e.loaded, e.total); }
}

/** interpret he search string * /
function interpretSearchString() {
    var istring = unescape(location.search.substring(1));
    try {
        eval(istring);
    } catch (e) {
        alert("cannot eval search string '" + istring + ":'\n" + e);
    }
}
***/

/////////~~~~~~~~~ generic file io
E.fileChooser.onclick = function (evtp) { this.value = null; }  // eslint-disable-line no-unused-vars
E.fileChooser.onchange = function (evtp) {
    openfiles(evtp.target.files);
}
//fileChooser.click();

/** handle the input file selection */
//function openfileevt(evt) {
//    openfiles(evt.target.files);
//    return killev(evt);
//}

var lastopenfiles;
/** handle the input file selection */
function openfiles(files) {
    if (!files) files = lastopenfiles;
    lastopenfiles = files;
    for (let f=0; f<files.length; f++) openfile(files[f]);
}

/** get the correct handler for a file name */
function handlerForFid(fid) {
    const ext = getFileExtension(fid);
    let handler = X.fileTypeHandlers[ext];
    // if (!handler) handler = window[ext.substring(1) + 'Reader'];
    return handler;
}

/** read and process a single file, given a File object */
function openfile(file) {
    const handler = handlerForFid(file.name);

    if (handler && handler.rawhandler) {
        handler(file);
    } else if (handler) {
        var reader = new FileReader();
        // ??? reader.fff = f;
        // Closure to capture the file information.
        reader.onload = function(e) {
            var data = e.target.result;
            handler(data, file.name);
        };
        const ext = getFileExtension(file.name);
        if (ext === '.tif' || ext === '.ply')   // TODO need to arrange this differently
            reader.readAsArrayBuffer(file);        // start read in the data file
        else if (ext === '.xlsx')   // TODO need to arrange this differently
            reader.readAsBinaryString(file);        // start read in the data file
        else
            reader.readAsText(file);        // start read in the data file
    } else {
        console.error("attempt to open file of wrong filetype " + file.name);
    }
}

/** document drop, if ctrl key keep dragDropDispobj which may be used by loader
dragOverDispobj will be destroyed too soon because of asynchronous loader */
function docdrop(evt) {
    var dt = evt.dataTransfer;
    if (!dt) { console.error("unexpected dragdro"); return killev(evt); }
    dt.dropEffect = 'copy';

    var data = dt.getData("text/plain");

    if (dt.files.length > 0) {   // file dragdrop
        openfiles(dt.files);
    } else if (data !== "") { // data drag/drop TODO
        try {
            if (data.startsWith('http:') || data.startsWith('https:'))
                posturiasync('/remote/' + data)
            else
                eval(data);
        } catch (e) {
            console.error('problem handling dropped text', data, e);
        }
    }
    return killev(evt);
}

/** document drop  */
function docdragover(evt) {
    evt.dataTransfer.dropEffect = 'copy';
    return killev(evt);
}

/** get a filename's extension */
function getFileExtension(fid) {
    if (fid.indexOf(".") !== -1)
        return "." + fid.split('.').pop();
    else
        return ".";
}
