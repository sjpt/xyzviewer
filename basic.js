export {addFileTypeHandler, showfirstdata, posturiasync, streamReader};
const {killev, addFileTypeHandler, E, X} = window;  // killev from OrbitControls ???
X.lastModified.basic = `Last modified: 2020/11/21 18:11:14
`
X.posturiasync = posturiasync;
X.handlerForFid = handlerForFid;
X.streamReader = streamReader;

X.proxy = '/remote/';

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
    if (window.location.search.startsWith('?arch')) {
        window.addscript("archstart.js");
    }
    const {startcode, startdata, pdb} = queryVariables;
    if (startcode) eval(startcode);
    if (pdb) posturiasync('https://files.rcsb.org/download/' + pdb + '.pdb');
    if (!startdata) return;
    const startlist = startdata
        .split("'").join('').split('"').join('')  // in case of old style interpret usage
        .split(',');
    startlist.forEach(s => {
        // this is special case to get around some CORS issues
        if (s.startsWith('http') && location.hostname === 'localhost')
            s = X.proxy + s;
        posturiasync(s);  // <<< WRONG, they get processed async so maybe wrong order
    });
}

document.ondragover = docdragover;
document.ondrop = docdroppaste;
document.onpaste = docdroppaste;


/** post a uri and process callback  */
function posturiasync(puri, callb='auto', data='') {
    console.time('load: '+puri);
    const binary = puri.endsWith('.ply');
    if (callb === 'auto') callb = handlerForFid(puri);
    var req = new XMLHttpRequest();
    req.open("GET", puri, true);
    if (binary) req.responseType = 'arraybuffer';
    req.setRequestHeader("Content-type", binary ? "application/octet-stream" : "text/plain;charset=UTF-8");
    req.send(data);
    req.onload = function () { 
        console.timeEnd('load: '+puri);
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
function docdroppaste(evt) {
    var dt = evt.dataTransfer || evt.clipboardData;
    if (!dt) { console.error("unexpected dragdrop"); return killev(evt); }
    dt.dropEffect = 'copy';

    var data = dt.getData("text/plain");

    if (dt.files.length > 0) {   // file dragdrop
        openfiles(dt.files);
    } else if (data !== "") { // data drag/drop TODO
        try {
            if (data.startsWith('http:') || data.startsWith('https:'))
                posturiasync(X.proxy + data)
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

/** code for streaming input from http  */
function streamReader(url, chunkProcess, endProcess) {
    const td = new TextDecoder("ascii")
    const log = console.log
    let n = 0, len, reader;
    function processText({done, value}) {
        if (done) {
            log(url, 'done', n, len);
            if (endProcess) endProcess(n, len);
            return;
        }
        n += value.length;
        chunkProcess(td.decode(value), n, len);
        return reader.read().then(processText);
    }

    fetch(url).then(resp => {
        resp.headers.forEach((...x) => console.log(x));
        len = +resp.headers.get('content-length');
        reader = resp.body.getReader()
        reader.read().then(processText);
    })
}
// e.g. streamReader("StarCarr/StarCarr_Flint.csv", (x,n,len) => log('... ', x.length, n, len, x.substring(0,20)), () => log('END'))



/** code for encoding integers with NaNs */
var _kkk = new Float32Array([NaN]);
var _iii = new Uint32Array(_kkk.buffer);
var _bbb = new Uint8Array(_kkk.buffer)
var iNaN = _iii[0];
function i2NaN(i) {
    _kkk[0] = NaN;
    _iii[0] += i;
    return _kkk[0];
}
function NaN2i(f) {
    _kkk[0] = f;
    return _iii[0] - iNaN;
}


