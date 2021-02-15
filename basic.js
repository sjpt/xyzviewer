export {addFileTypeHandler, handlerForFid, showfirstdata, posturiasync, streamReader, fileReader, lineSplitter, 
    writeFile, saveData, sleep, readyFiles, addToFilelist, addscript, availableFileList, loaddrop, queryVariables, log, waitev, killev, fireev};
window.lastModified.basic = `Last modified: 2021/02/15 10:57:20
`
const {E, X} = window;
import {THREE} from './threeH.js';
import {ggb} from './graphicsboiler.js'; // plan, orbcamera
import {XYZ} from './xyz.js';
const queryVariables = {};
var readyFiles = {};

var fileTypeHandlers; //  = {};
// eslint-disable-next-line no-unused-vars
function addFileTypeHandler(ftype, fun) {
    if (!fileTypeHandlers) fileTypeHandlers = {};
    fileTypeHandlers[ftype] = fun;
}

/** log function shared for shorthand, also allows console.log to change as Edge brings up/closes developer tools */
var log;
log = function() {
    console.log.apply(console, arguments);
}
log('main.js initial log established');



/** get query variables from search string */
function getQueryVariables() {
    var query = window.location.search.substring(1);
    var vars = query.split('&');

    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        /** @type {any} */ let p = pair[1];
        if (p === undefined) p = true;
        else if (!isNaN(p)) p = +p;
        else if (p === 'true') p = true;
        else if (p === 'false') p = false;
        queryVariables[decodeURIComponent(pair[0])] = p;
    }
}
getQueryVariables();

/** load and show the initial data, called from the graphics boilerplate code at startup  */
async function showfirstdata() {
    const wls = window.location.search;
    if (wls.startsWith('?arch')) await import("./StarCarr/archstart.js");
    if (wls.startsWith('?fold')) await import('./extras/folddemo.js');
    if (wls.startsWith('?ox')) {      
        if (location.host.startsWith('csynth'))
            if (wls.startsWith('?ox7m'))
                queryVariables.startdata='../xyzdata/COVID19_CyTOF/_Steve_UMAP3_allcells.txt.yaml"';
            else
                queryVariables.startdata='../xyzdata/cytof/cytof_1.5million_anonymised.txt.yaml';
        if (location.host.startsWith('localhost') || location.href.startsWith('127.0.0.1')) 
            if (wls.startsWith('?ox7m'))
                queryVariables.startdata=',,/,,/,,/,,/BigPointData/t1-data/user/erepapi/Fellowship/COVID19_CyTOF/_Steve_UMAP3_allcells.txt.yaml"';
            else if (wls.startsWith('?oxm'))
                queryVariables.startdata=',,/,,/,,/,,/BigPointData/fromMLV/fromMLV.yaml';
            else
                queryVariables.startdata=',,/,,/,,/,,/BigPointData/cytof/cytof_1.5million_anonymised.txt.yaml';

            XYZ.baseguiset.spotsize = 0.02;
            // XYZ.baseconstructorDone =async () => {
            //     // (await import('./cols.js')).COLS.set('batch'); // no, leave that to url
            //     X.currentXyz.setPointSize(0.02);
            //     ggb.plan();
            // };
    } 

    const {startcode, startdata, pdb} = queryVariables;
    if (startcode) eval(startcode);
    if (pdb) posturiasync('https://files.rcsb.org/download/' + pdb + '.pdb');
    if (startdata) {
        const startlist = startdata
            .split("'").join('').split('"').join('')  // in case of old style interpret usage
            .split(';');
        startlist.forEach(s => {
            // this is special case to get around some CORS issues
            if (s.startsWith('http') && location.hostname === 'localhost')
                s = X.proxy + s;
            posturiasync(s);  // <<< WRONG, they get processed async so maybe wrong order
        });
    }
}

document.ondragover = docdragover;
document.ondrop = docdroppaste;
document.onpaste = docdroppaste;


/** post a uri and process callback  */
async function posturiasync(puri, callb, data = '') {
    console.time('load: ' + puri);
    if (!callb) callb = await handlerForFid(puri);
    const binary = puri.endsWith('.ply');
    return new Promise( resolve => {
        var req = new XMLHttpRequest();
        req.open("GET", puri, true);
        if (binary) req.responseType = 'arraybuffer';
        req.setRequestHeader("Content-type", binary ? "application/octet-stream" : "text/plain;charset=UTF-8");
        req.send(data);
        req.onload = function () { 
            console.timeEnd('load: '+puri);
            callb(binary ? req.response : req.responseText, puri);
            resolve();
        }   // eslint-disable-line no-unused-vars
        req.onerror = function (oEvent) { console.error('cannot load', puri, oEvent); }
        req.ontimeout = function (oEvent) { console.error('timeout error, cannot load', puri, oEvent); }
        // req.onprogress = function (e) { console.log('progress', puri, e.loaded, e.total); }
    });
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
    openfiles(evtp.target);
}

var lastdroptarget;
/** handle the input file selection */
function openfiles(droptarget = lastdroptarget) {
    lastdroptarget = droptarget;
    let {files, items} = droptarget;
    if (!items) items = {};             // for file open
    for (let f=0; f<files.length; f++) 
        openfile(files[f], items[f]);
}

/** get the correct handler for a file name, autoload if necessary */
async function handlerForFid(fid) {
    const ext = getFileExtension(fid);
    let handler = fileTypeHandlers[ext];
    if (!handler) {  // <<< TODO catch
        await import('./plugins/' + ext.substring(1) + 'reader.js');
        handler = fileTypeHandlers[ext];
    }

    // if (!handler) handler = window[ext.substring(1) + 'Reader'];
    return handler;
}

/** read and process a single file, given a File object */
async function openfile(file, item) {
    // const getAsEntry = window.getAsEntry || window.webkitGetAsEntry;
    if (document.title === 'xyzviewer') document.title += ': ' + file.name;
    if (item) {
        const entry = item.webkitGetAsEntry();
        file.fullPath = entry.fullPath;
        if (entry.isDirectory) return openDirectory(entry);
    }
    readyFiles[file.fullPath] = file;

    console.time('load file: ' + file.fullPath)
    const handler = await handlerForFid(file.fullPath);

    if (handler && handler.rawhandler) {
        handler(file, file.fullPath);
    } else if (handler) {
        var reader = new FileReader();
        // ??? reader.fff = f;
        // Closure to capture the file information.
        reader.onload = function(e) {
            var data = e.target.result;
            console.timeEnd('load file: ' + file.fullPath)
            // @ts-ignore
            log('load', file.name, data.length);
            handler(data, file.fullPath);
        };
        reader.onerror = function(e) {
            console.error('failure reading', file.fullPath, e)
        }
        const ext = getFileExtension(file.fullPath);
        if (ext === '.tif' || ext === '.ply')   // TODO need to arrange this differently
            reader.readAsArrayBuffer(file);        // start read in the data file
        else if (ext === '.xlsx')   // TODO need to arrange this differently
            reader.readAsBinaryString(file);        // start read in the data file
        else
            reader.readAsText(file);        // start read in the data file
    } else {
        console.error("attempt to open file of wrong filetype " + file.fullPath);
    }
}

/** helper for docdrop to scan directories, top level for debug,
returns full list but does not process
N.b. it seems that you can drop mixed files/directories, but CANNOT open them (ctrl-o)
*/
async function _scanFiles(item, availableFileList = {}, directoryEntries = {}) {
    return new Promise( (resolve) => {
        // log('entry item', item)
        if (item.isDirectory) {
            directoryEntries[item.fullPath] = item;
            // const key = 'xxx' + Math.random();
            let directoryReader = item.createReader();
            let getEntries = async function() {
                directoryReader.readEntries(async function(entries) {
                    if (entries.length === 0) { 
                        resolve(); 
                        return;
                    }
                    for(const entry of entries) {
                        await _scanFiles(entry, availableFileList, directoryEntries);
                    }
                    getEntries();
                });
            };
            getEntries();
        } else if (item.isFile) {
            // log('file found', item);
            availableFileList[item.fullPath] = item;
            // readyFiles[item.fullPath] = item; // no, it is a fileEntry
            resolve();
        }
    });
}

const availableFileList = {};
async function openDirectory(entry) {
    let directoryEntries= {};
    await _scanFiles(entry, availableFileList, directoryEntries);  // <<<< this kills dt.files
    //??? window.availableFileList = availableFileList;

    // await Promise.all(promises);
    log('found files:', Object.keys(availableFileList), Object.keys(directoryEntries));
    for (const fullPath in availableFileList) {
        const handler = await handlerForFid(fullPath);
        if (handler && !handler.hidden)
            addToFilelist(fullPath, availableFileList[fullPath]);
    }
}

/** add an item to selectableFileList 
 * for start url is fullPath (key), url string (usually relative)
 * for directory is fullPath (key), fileEntry
*/
var selectableFileList = {};
function addToFilelist(fullPath, fileEntry, displayName) {
    E.filedropbox.innerHTML = E.filedropbox.innerHTML.replace('none available', 'none selected');
    displayName = displayName || (typeof fileEntry === 'string' ? fileEntry : fileEntry.name);
    E.filedropbox.innerHTML += `<option value="${fullPath}" title="${fullPath}">${displayName}</option>`;
    selectableFileList[fullPath] = fileEntry;
}

/** process a file from the dropdown list, maybe a fid, or a FileEntry */
function loaddrop() {
    // @ts-ignore
    const fid = document.getElementById('filedropbox').value;
    if (fid === '!none!') return;
    const fileEntryUrl = selectableFileList[fid];
    if (fileEntryUrl.isFile) {
        fileEntryUrl.file( file => {file.fullPath = fid; openfile(file);});   // is fileEntry
    } else {
        posturiasync(fileEntryUrl);     // is string URL
    }
}


// write a file to local file storage, assuming running via our local server 
function writeFile(fid, text, append=false) {
    var oReq = new XMLHttpRequest();
    oReq.open("POST", append ? "appendfile.php" : "savefile.php", false);
    oReq.setRequestHeader("Content-Disposition", fid);
    oReq.send(text);
    log("writetextremote", fid, "response text", oReq.responseText);
}

/** document drop, if ctrl key keep dragDropDispobj which may be used by loader
dragOverDispobj will be destroyed too soon because of asynchronous loader */
function docdroppaste(evt) {
    if (evt.srcElement instanceof HTMLTextAreaElement) return;
    var dt = evt.dataTransfer || evt.clipboardData;
    if (!dt) { console.error("unexpected dragdrop"); return killev(evt); }
    dt.dropEffect = 'copy';

    var data = dt.getData("text/plain");

    if (dt.files.length > 0) {   // file dragdrop
        log('dragdrop', dt.files)
        openfiles(dt);
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
        resp.headers.forEach((...x) => log(x));
        len = +resp.headers.get('content-length');
        reader = resp.body.getReader()
        reader.read().then(processText);
    })
}
// e.g. streamReader("StarCarr/Flint.csv", (x,n,len) => log('... ', x.length, n, len, x.substring(0,20)), () => log('END'))

/** read file in chunks and submit chunks to chunkProcess(chunk, bytesSoFar, length) */
async function fileReader(file, chunkProcess = log, endProcess = () => log('end'), chunksize = 2**17) {
    let off = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const slice = file.slice(off, off + chunksize);
        const chunk = await slice.text();
        if (chunk.length === 0) break;
        off += chunksize;
        chunkProcess(chunk, off, file.size);
    }
    endProcess();
}

/** read file in chunks, break into lines, and submit lines to lineProcess(line, numLines, bytesProcessedSoFar, bytesReadSoFar, length) */
function lineSplitter(lineProcess = (l,n, b, bsf, len) => {if (n%100 === 0) log(n, l, b, bsf, len);} ) {
    let pend = '';
    let lines = 0, bytes = 0;
    return function(chunk, bytesSoFar, length) {
        const ll = chunk.split('\n');
        ll[0] = pend + ll[0];
        pend = ll[ll.length-1];
        for (let i = 0; i < ll.length-1; i++) {
            bytes += ll[i].length + 1;
            lineProcess(ll[i], ++lines, bytes, bytesSoFar, length);
        }
    }
}
// fileReader(xxfile, lineSplitter)

// save data as a downloaded file (typically downloads directory)
function saveData(fileName, ...data) { // does the same as FileSaver.js
    const blob = new Blob(data);
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";

    var url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
}

// permit await sleep(xxx)
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

/////
const xx = new THREE.EventDispatcher();
function waitev(type) { return new Promise(resolve => {
    var r = (s) => {
        xx.removeEventListener(type, r); 
        resolve(s.data)
    }; 
    xx.addEventListener(type, r) });
}
function fireev(type, data) {xx.dispatchEvent({type, data})}

/** add a script dynamically */
// eslint-disable-next-line no-unused-vars
// this can support modules, but better just use import() instead
function addscript(src, type = 'text/javascript') {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = type;
    script.src = src;
    head.appendChild(script);

    return new Promise(resolve => {
        script.onload = () => {
            resolve();
        }
    });
}

function killev(event) {
	event.stopPropagation();
	event.preventDefault();
	return true;
}

// GG gives the handlers in this file access to necessary functions
// while limiting pollution to the global scope.
var {GG} = window;
(async function() {
    GG.gb = (await import('./graphicsboiler.js')).ggb;
    GG.cols = (await import('./cols.js')).COLS;
    GG.ps = await import('./photoshader.js');
    GG.tdata = await import('./tdata.js');
    GG.xyz = await import('./xyz.js');
    GG.basic = await import('./basic.js');
    GG.lasso = (await import('./lasso.js'));
    GG.lassoshader = (await import('./lassoshader.js'));
    GG.xshader = (await import('./xshader.js'));
    GG.raycast = (await import('./raycast.js'));
    GG.expose = () => { for (const f in GG) Object.assign(window, GG[f]) } // expose lots of details as global for debug
    // put off speech till last, Firefox does not support it
    GG.ospeech = (await import('./speech.js')).OrganicSpeech;
    GG.xyzspeech = (await import('./xyzspeech.js'));

    GG.test = () => {
        let s = location.href.split('?')[0] + '?';
        const test = k => open(s + k, '_blank')
        test('ox');
        test('arch');
        test('pdb=6vxx');
        test('fold');
        
        s = s.replace('/xyz.html', '/xyz4.html');
        test('');
    }

    showfirstdata();
    
    window.dispatchEvent(new Event('GGLoaded'));
})();
