'use strict';
var startdata = '', usePhotoShader;

/** load and show the initial data, called from the graphics boilerplate code at startup  */
function showfirstdata() {
    interpretSearchString();
    if (!startdata) return;
    // if (location.href.indexOf('arch') === -1 && !startdata) startdata = 'data/4bcufullCA.pdb';
    if (startdata) {
        posturiasync(startdata, pdbReader);
        spotsize(5);
        // setTimeout( () => {colourby.value='tempfac'; dataToMarkersGui()}, 5000);
        return;
    }
    loaddata();         // load the data ready for display
    // done by the lower level ... dataToMarkers();    // display as markers
    // if (sc04_15)  refit();        // and compute and display refit data // just do in archstart
}

/** load data based on gui values */
function dataToMarkersGui() {
    makechainlines(document.getElementById('filterbox').value, document.getElementById('colourby').value);
    return dataToMarkers(document.getElementById('filterbox').value, document.getElementById('colourby').value)
}

/** load the data with given filter and colour functions if requred, and display as markers */
function dataToMarkers(pfilterfun, pcolourfun) {
    const filterfun = makefilterfun(pfilterfun);
    const colourfun = makecolourfun(pcolourfun);
    geometry = new THREE.Geometry();
    geometry.vertices = [];
    geometry.colors = [];
    for (let i = 0; i < datas.length; i ++ ) {
        const d = datas[i];
        if (filterfun && !filterfun(d)) continue;
        const vertex = new THREE.Vector3();
        vertex.x = d.c_x || d.x;  // todo, change recentre mechanism
        vertex.y = d.c_y || d.y;
        vertex.z = d.c_z || d.z;

        geometry.vertices.push( vertex );
        const r = Math.random;
        if (colourfun)
            geometry.colors.push(colourfun(d));
        else
            geometry.colors.push(col3(r(), r(), r()));
    }
    geometry.verticesNeedUpdate = true;
    particles.geometry = geometry;
    console.log('vertices generated',  geometry.vertices.length);
    return geometry.vertices.length;
}

/** make a colour function for a field.
 * the input may be just field name,
 * or a structure with field fn (field name) and optional low and high values
 * If low and high are not given they are used as 1.5 standard deviations from the mean.
 * We may later add low and high colour values for greater flexibility.
 */
function makecolourfun(fn) {
    if (typeof fn === 'function') return fn;
    if (fn === undefined || fn === '' || fn === 'random') return ()=>col3(Math.random(),Math.random(),Math.random());
    if (fn === 'custom')
        try {
            const f = makefilterfun(colourbox.value);
            const col = f(datas[0]);  // test
            return f;
        } catch(e) {
            return undefined;
        }
    if (typeof fn === 'string' && typeof window[fn] === 'function') return window[fn];  // need better formalization
    if (typeof fn === 'string') fn = { fn }
    const r = ranges[fn.fn];               // range
    if (fn.low === undefined) fn.low = r.mean - 1.5 * r.sd;
    if (fn.high === undefined) fn.high = r.mean + 1.5 * r.sd;
    const low = fn.low;
    const range = fn.high - fn.low;
    const name = fn.fn;

    const cf = function cfx(d) {
        const v = d[name];                // raw value
        const nv = ( v - low) / range;  // normalized value
        return col3(nv, 1-nv, 1-nv);    // colour
    }
    return cf;
}

/** make a function for a filter
 * If the value is a string it is converted to a function, using d as the input data row.
 * so a valid string could be 'd.x > 17'.
 */
function makefilterfun(filt) {
    if (typeof filt === 'function') return  filt;
    if (!filt) return undefined;
    if (typeof filt === 'string') {
        for (let fn in ranges)
            // filt = filt.split(fn).join('d.' + fn);
            filt = filt.replace( new RegExp('\\b' + fn + '\\b', 'g'), 'd.' + fn);
        filt = filt.split('.d.').join('.');  // so things like ranges.x.mean will get correct
        const filtfun = new Function('d', 'return (' + filt + ')');
        return filtfun;
    }
}

/** convenience function for rgb colour */
function col3(r, g, b) { return new THREE.Color().setRGB(r, g, b); }

var sc04_15;    // data as long string
var header; // header, as array
var dataa;  // data as array
var datas;  // data as structure
var ranges; // data ranges, as structure of min/max


/** load the initial data */
function loaddata() {
    csvReader(sc04_15 || orientdata, 'initialdata');
}
/** load the data as an array of arrays, and separate out header */
function csvReader(raw, fid) {
    const data = raw.split('\n');
    if (data[0] === '') data.splice(0,1);  // in case of initial empty line
    if (data.slice(-1)[0] === '')
        data.splice(-1, 1);  // remove blank line at end if any
    dataa = [];
    data.forEach( x=> dataa.push(x.split('\t')));
    header = data[0].toLowerCase().split('\t').map(x=>x.split(',')[0]);
    dataa.splice(0, 1);  // remove header

    // convert data to an array of structures, and compute ranges
    datas = [];
    dataa.forEach(x => {
       const s = {};
       for (let i=0; i<header.length; i++) {
           const fn = header[i];
           const rv = x[i].trim();  // raw value
           const v = isNaN(rv) ? rv : +rv;
           s[fn] = v;

       }
       if (s.x * s.y * s.z === 0) {
           // log('odd position', s.oid, s.x, s.y, s.z);
       } else if (isNaN(s.x * s.y * s.z)) {
           log('odd data');
       } else {
           datas.push(s);
       }
    });

    if (!ranges) ranges = genstats();  // only generate ranges for first input so all are consistent

    rebase('x');
    rebase('y');
    rebase('z');

    ranges.forEach = sForEach;
    dataToMarkers();    // display as markers
}

/** rebase a field based on mean, set c_ values */
function rebase(fn) {
    const r = ranges[fn];
    datas.forEach(s => {
        s['c_' + fn] = (s[fn] - r.mean);
    });
    ranges[fn].min = -r.range/2;
    ranges[fn].max = r.range/2;
    ranges[fn].mid = 0;
}

/** convenience function for interating fields of an object  */
function sForEach(fun) {
    const s = this;
    for (let i in s) {
        const v = s[i];
        fun(v);
    }
}

/** set the sacel in x,y,z */
function scale(x,y,z) {
    maingroup.scale.set(x,y,z);
}

/** set/get the spotsize.  TODO, allow for number of pixels so value has similar effect on different devices */
function spotsize(size) {
    if (usePhotoShader) {
        const k = 1000;
        const r = materials[0].uniforms.size.value / k;
        if (size !== undefined) materials[0].uniforms.size.value = size * k;
        return r;
    }
    const r = materials[0].size;
    if (size !== undefined) materials[0].size = size;
    return r;
}

/** handle changes to the gui filter for markers
   on ctrl-enter filter the markers and redisplay */
function filtergui(evt) {
    const box = document.getElementById('filterbox');  // dom element
    const errbox = document.getElementById('filterr');  // dom element
    const ff = box.value;
    try {
        const f = new Function('d', 'return ' + ff);
        box.style.background='#d0ffd0';
        errbox.textContent = 'ctrl-enter to apply filter';
        if (evt.keyCode === 13) {
            filtergui.lastn = dataToMarkersGui();
            filtergui.last = ff;
        }
        if (ff.trim() === filtergui.last.trim()) {
            box.style.background='#ffffff';
            errbox.textContent = 'filter applied: #points=' + filtergui.lastn;
            return;
        }
    } catch (e) {
        box.style.background='#ffd0d0';
        errbox.textContent = e.message;
    }
}

/** generate stats from given data for a given field, or for all fields, also compute three.js position */
function genstats(datals = datas, name = undefined) {
    datals.forEach(d => { d.pos = new THREE.Vector3(d.x, d.y, d.z); d.c_pos = d.pos.clone(); });
    if (!name) {   // repeat for all fields
        const lranges = {};name
        document.getElementById('colourby').innerHTML = `<option value="random">random</option>`;
        document.getElementById('colourby').innerHTML += `<option value="custom">custom</option>`;
        for (name in datals[0])  {
            lranges[name] = genstats(datals, name);
        }
        return lranges;
    }


    const data = datals.map(d => d[name]);  // just extract this field
    let sum = 0, sum2 = 0, n = 0;
    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;
    if (isNaN(data[0])) {min = max = data[0]};
    data.forEach(v => {
        if (!v) return;  // '' or 0 are sometimes used for missing/undefined
        sum += +v;
        sum2 += v*v;
        n++;
        if (v < min) min = v;  // do not use Math.max as doesn't work for alpha
        if (v > max) max = v;
        max = Math.max(max, v);
    });

    const sd = Math.sqrt((sum2 - 1/n * sum*sum) / n);
    if (!isNaN(sd) && sd !== 0) {
        const n = `<option value="${name}">${name}</option>`;
        if (document.getElementById('colourby').innerHTML.indexOf(n) === -1)
            document.getElementById('colourby').innerHTML += `<option value="${name}">${name}</option>`;
    }

    return {name, mean: sum / n, sd, mid: (min + max) / 2, range: (max - min), min, max, sum, sum2, n};
}

filtergui.last = '';

/////////~~~~~~~~~ generic file io
fileChooser.onclick = function (evtp) { this.value = null; }
fileChooser.onchange = function (evtp) {
    openfiles(evtp.target.files);
}
//fileChooser.click();

/** handle the input file selection */
function openfileevt(evt) {
    openfiles(evt.target.files);
    return killev(evt);
}

var lastopenfiles;
/** handle the input file selection */
function openfiles(files) {
    if (!files) files = lastopenfiles;
    lastopenfiles = files;
    for (let f=0; f<files.length; f++) openfile(files[f]);
}

var fileTypeHandlers = {};
/** read and process a single file, given a File object */
function openfile(file) {
    var ext = getFileExtension(file.name);
    var handler = fileTypeHandlers[ext];
    if (!handler) handler = window[ext.substring(1) + 'Reader'];

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
        if (ext === '.tif')
            reader.readAsArrayBuffer(file);        // start read in the data file
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
    if (!dt) { serious("unexpected dragdro"); return killev(evt); }
    dt.dropEffect = 'copy';

    var data = dt.getData("text/plain");

    if (dt.files.length > 0) {   // file dragdrop
        openfiles(dt.files);
    } else if (data !== "") { // data drag/drop TODO
        try {
            msgfix('evaluate', data);
            var r = eval(data);
            msgfix('evaluate', data, 'result', r);
        } catch (e) {
            msgfix('evaluate', data, 'failed', e.message);
        }
        // Poem.start(data); for now disable poem start by text drop
        // does not work, 5 Mar 2014
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

document.ondragover = docdragover;
document.ondrop = docdrop;


/** post a uri and process callback  */
function posturiasync(puri, callb, data='' ) {
    var req = new XMLHttpRequest();
    req.open("GET", puri, true);
    req.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
    req.send(data);
    req.onload = function (oEvent) { callb(req.responseText); }
    req.onerror = function (oEvent) { console.error('cannot load', puri, oEvent); }
    req.ontimeout = function (oEvent) { console.error('timeout error, cannot load', puri, oEvent); }
    // req.onprogress = function (e) { console.log('progress', puri, e.loaded, e.total); }
}

/** interpret he search string */
function interpretSearchString() {
    var istring = unescape(location.search.substring(1));
    try {
        eval(istring);
    } catch (e) {
        alert("cannot eval search string '" + istring + ":'\n" + e);
    }
}

/** convenience function for a few standard colours (integer based) */
function icol(k) {
	let cols = [col3(0.5,0.5,0.5), col3(1,0,0), col3(0,1,0), col3(1,1,0), col3(0,0,1), col3(1,0,1), col3(0,1,1), col3(1,1,1)];
	let col = cols[Math.round(k)];
	if (!col) col = cols[0];
	return col.clone();
}

