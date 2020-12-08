
'use strict';
window.lastModified.xyz = `Last modified: 2020/12/08 11:22:40
`; console.log('>>>>xyz.js');
import {addToMain, select} from './graphicsboiler.js';
//?? import {pdbReader} from './pdbreader.js';
import {fileReader, lineSplitter, saveData, sleep, readyFiles, addFileTypeHandler, availableFileList} from './basic.js';
import {COLS} from './cols.js';
// import {THREE} from "./threeH.js"; // import * as THREE from "./jsdeps/three121.module.js";
import {THREE} from "./threeH.js";
import {lassoGet} from "./lasso.js";

//let E = window, X = window;

export {
    centrerange, // for draw centre consistency
    spotsizeset,
    dataToMarkersGui,
    filtergui,
    // particles, // for subclass pdbreader, and particles for photoshader
    XYZ,
    col3
};

const {E, X} = window;
import {addscript} from './basic.js';
// const xyzs = {};
const {log} = window;

var XLSX;

// ??? to engineer below more cleanly
const spotsizeset = (a, b) => { if (X.currentXyz) X.currentXyz.spotsizeset(a, b); }
const filtergui = g => { if (X.currentXyz) X.currentXyz.filtergui(g); }
const dataToMarkersGui = type => X.currentXyz.dataToMarkersGui(type);
const centrerange = new THREE.Vector3(Infinity);  // ranges for external use
//X.centrerange

/***/
//X.csvReader = csvReader;
//X.pdbReader = pdbReader;
addFileTypeHandler('.csv', csvReader);
addFileTypeHandler('.txt', csvReader);
addFileTypeHandler('.xlsx', csvReader);
addFileTypeHandler('.yaml', csvReader);
const binnop = () => {};
binnop.rawhandler = true;
binnop.hidden = true;
addFileTypeHandler('.colbin', binnop);

var usePhotoShader;
function csvReader(data, fid) { return new XYZ(data, fid); }
csvReader.rawhandler = true;
const baseguiset = {spotsize: 0.2, colourby: 'fixed', colourpick: '#ffffff', filterbox: ''};

class XYZ {
    // comment in line below for typescript checking, comment out for js runtime
    // header, da tas, ranges, particles, material;
//var header; // header, as array
//var ranges; // data ranges, as structure of min/max
// let particles, material;

constructor(data, fid) {
    X.currentXyz = X.currentThreeObj = this.xyz = this;
    this.fid = fid;
    if (!data) return;  // called from pdbReader
    this.csvReader(data, fid);
    // colourby is dropdown, colourpick is colour picker
    this.guiset = baseguiset;
    select(fid, this);
    this._col = new THREE.Color(1,1,1);

    this.makechainlines = undefined;
}

/** load data based on gui values */
dataToMarkersGui(type) {
    if (X.currentThreeObj.xyz) {
        if (type) E.colourby.value = type;
        if (!this.guiset) this.guiset = baseguiset;   // in case of pdbreader ... todo proper subclass
        Object.assign(this.guiset, {colourby: E.colourby.value, filterbox: E.filterbox.value, colourpick: E.colourpick.value});
        if (this.makechainlines)
            this.makechainlines(E.filterbox.value);
        return this.dataToMarkers(E.filterbox.value)
    } else if (X.currentThreeObj.material ) {
        X.currentThreeObj.material.color.set(E.colourpick.value);
    }
}


/** load the data with given filter and colour functions if required, and display as markers */
async dataToMarkers(pfilterfun) {
    const st = performance.now();
    if (!this.particles) this.setup(this.fid);  // for call from pdbReader
    const xc = this.namecols.x, yc = this.namecols.y, zc = this.namecols.z;
    const l = xc.length;
    const filterfun = await this.makefilterfun(pfilterfun, E.filterbox, 'force');
    let vert = this._svert = this._svert || new Float32Array(l*3);
    let col = this._scol = this._scol || new Float32Array(l*3);
    const geometry = this.geometry = this.geometry || new THREE.BufferGeometry();
    let ii = 0;
    let noxyz = 0;
    for (let i = 0; i < l; i ++ ) {
        let du;
        if (filterfun) {
            this._col.setRGB(0.3, 0.3, 0.3);
            const df = filterfun(this, i);
            if (!df) continue;
            if (typeof df === 'object') du = df;
        } else {
            this._col.setRGB(1,1,1);
        }
        if (!du) du = {_x: xc[i], _y: yc[i], _z: zc[i]};
        let c = this._col; 
        let _x = du._x !== undefined ? du._x : xc[i];
        let _y = du._y !== undefined ? du._y : yc[i];
        let _z = du._z !== undefined ? du._z : zc[i];
        if (_x === undefined || _y === undefined || _z === undefined) {
            noxyz++;
        } else {            
            vert[ii] = _x;
            col[ii++] = c.r;
            vert[ii] = _y;
            col[ii++] = c.g;
            vert[ii] = _z;
            col[ii++] = c.b;
        }
    }
    const ll = ii/3;
    // if (ll !== l) {
    //     vert = vert.slice(0, ii);
    //     col = col.slice(0, ii);
    // }
    if (noxyz) console.log('ddata/filter failed to give xyz for', noxyz, 'elements');
    if (ll === 0) {console.log('ddata/filter failed to give any xyz'); }
    const verta = this._verta = this._verta || new THREE.BufferAttribute(vert, 3);
    const cola = this._cola = this._cola || new THREE.BufferAttribute(col, 3);
    verta.needsUpdate = cola.needsUpdate = true;
    geometry.setAttribute('position', verta);
    geometry.setAttribute('color', cola);
    geometry.setDrawRange(0, ll);
    // @ts-ignore geometry is BufferGeometry, particles.geometry might want Geometry
    this.particles.geometry = geometry;
    const dt = Math.round(performance.now() - st);
    if (filterfun)
        E.filtcount.innerHTML = `filter applied: #points=${ll} of ${l}, time: ${dt}ms`;
    else 
        E.filtcount.innerHTML = `no filter applied: #points=${l} , time: ${dt}ms`;
    await this.makefilterfun(pfilterfun, E.filterbox, 'confirm');                 // get gui display right

    return [ll,l];
}

/** extract the value for an element
 * This is largely a convenience function for generating filters.
 * TODO: It should be replaced by something more efficient (especially for pure numeric or pure alpha columns)
 * when compiling the filter functions.
 */
val(name, i) {
    const rv = this.namecols[name][i];
    if (!isNaN(rv)) return rv;
    const k = NaN2i(rv);
    if (k === -15) return '';
    return this.namevseti[name][k];
}

/** make a function for a filter (also colouring etc)
 * If the value is a string it is converted to a function
 * Flags any failure in E.filterr.innerHTML and returns undefined
 * mode may be 'force' to force recompilation (eg after new colour file loaded), 
 * or 'confirm' to confirm this filter has been applied
 * 
 * Filter understands special cases of X,Y,Z and COL
 * X,Y,Z refer to _x,_y,_z are local variables in the filter
 * 
 * COL: refers to xyz._col, a prepared THREE.Colour() object 
 * This is set to a default before executing the filter
 * and may be set (eg xyz._col.setRGB(1,0,0)) during execution of the filter
 * Handling colour this way 
 *  * reduces the need for generating new color object for each filter execution
 *  * reduces the risk of overriding contributing COLS object in complex filters
 * 
 */
async makefilterfun(filtin, box, mode='') {
    let filt = filtin;
    const msg = (m, col) => {
        E.filterr.innerHTML = `${m} <br><code> ${filt.split('\n').join('<br>')}<code>`;
        if (box) box.style.background = col;
        E.filterr.style.color = col;
    }
    if (mode === 'force') this.lastInputApplied = undefined;    // invalidate so force recompilation

    const applied = mode === 'confirm';                         // have just applied so must be OK
    if (applied || filtin === this.lastInputApplied) {
        if (applied) this.lastCodeApplied = this.lastCodeGenerated;
        this.lastInputApplied = filtin;
        filt = this.lastCodeApplied || '';   // so msg comes right
        msg('filter applied', 'white');
        return this.lastFunction;
    }
    this.lastInputTested = filtin;
    msg('testing', '#101010');
    if (!filt) { 
        msg('empty filter', '#d0ffd0');
        return undefined;
    }
    let filtfun;
    if (typeof filt === 'function')
        filtfun = filt;
    else if (typeof filt === 'string') {
        try {
            const used = [];
            filt = filt.replace(/\blasso\b/g, 'xyz._lasso(x,y,z)');
            for (let fn in this.ranges) // find used fields and assign (saves risk of accidental override of d.<fn>)
                if (filt.match( new RegExp('\\b' + fn + '\\b', 'g'))) {
                    used.push(fn);
                    await this.lazyLoadCol(fn);
                }

            filt = filt.split('\n').map(l => {
                if (l[0] === '?') l = `if (!(${l.substring(1)})) return;`;
                else if (l.startsWith('COL:')) {const ll = l.substring(4).trim(); l = 'xyz._col.set(' + COLS.gencol(this, ll) + ')'}
                else if (l.startsWith('COLX:')) {const ll = l.substring(5).trim(); l = 'xyz._col.set(' + ll + ')'}
                else if (l.startsWith('X:')) l = `_x = ${l.substring(2)}`;
                else if (l.startsWith('Y:')) l = `_y = ${l.substring(2)}`;
                else if (l.startsWith('Z:')) l = `_z = ${l.substring(2)}`;
                return l;
            }).join('\n');


            // generate filter
            // if (filt.indexOf('return') === -1) filt = 'return (' + filt + ')';
            filt += '\nreturn {_x, _y, _z};'        // note, xyz._col is implicit output
            // todo: make special case filters for pure number/pure alpha columns???
            const uu = used.map(u => `var ${u} = xyz.val('${u}', i);`).join('\n');
            filt = `"use strict";
                var _x, _y, _z;
                ${uu}\n
            ` + filt;
            this.lastCodeGenerated = filt;

            filtfun = new Function('xyz', 'i', filt);
            this.lastFunction = filtfun;
        } catch (e) {
            msg('invalid function: ' + e.message, '#ffd0d0');
            return undefined;
        }
    } else {
        msg('unexpected filter type', '#ff4040');
    return undefined;
    }

    try {
        // eslint-disable-next-line no-unused-vars
        const r = filtfun(this, 0);
    } catch(e) {
        msg('function throws exception: ' + e.message, '#d0d0ff');
        return undefined;
    }
    msg('OK: ctrl-enter to apply filter', '#d0ffd0');
    return filtfun;
}

/** parse xlsl */
async xlsxReader(raw, fid) {
    // only load this converter plugin if needed
    if (!XLSX) {
        await addscript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.14.3/xlsx.full.min.js");
        console.log('loaded', XLSX);
    }
    let workbook = XLSX.read(raw, {type: 'binary'});
    let firstSheet = workbook.SheetNames[0];
    let ss = workbook.Sheets[firstSheet];
    // could be made much more efficient if needed
    // also neither this nor main line allows for empty header field name, or repeated ones
    this.extocsv = XLSX.utils.sheet_to_csv(ss);
    return this.csvReader(this.extocsv, fid + '!');
}

/** lazy load a columns and return it
 * May be from a File or from a url. TODO Also to handle case of FileEntry, after dropping of Directory
 * Test for which is temporary, and the split should maybe be made somewhere more generic.
 */
async lazyLoadCol(id) {
    const t = this.namecols[id]; if (t) return t;
    const fid = this.bfid + '_' + id + '.colbin';
    let fblob;
    if (fid.startsWith(',,') || fid.startsWith('..')) { // NOT correct test!
        const resp = await fetch(fid);
        fblob = await resp.blob();
    } else if (readyFiles[fid]) {
        fblob = readyFiles[fid];
        // if (!fblob) throw new Error('no ready file ' + fid);
    } else if (availableFileList[fid]) {
        const makeFile = (fileEntry) =>
            new Promise(resolve => fileEntry.file(resolve));
        const file = await makeFile(availableFileList[fid]);
        fblob = readyFiles[fid] = file;
    } else {
        throw new Error('no ready file ' + fid);
    }
    const buff = await fblob.arrayBuffer();
    return this.namecols[id] = new Float32Array(buff);
}

async yamlReader(raw, fid) { 
    this.prep();
    X.currentThreeObj = X.currentXyz = this.xyz = this;
    // get information available in yaml
    const yaml = typeof raw === 'string' ? raw : await raw.text();
    Object.assign(this, X.jsyaml.safeLoad(yaml));

    // and synthesize some more
    const {namevset, namevseti, header} = this;
    this.namecols = {};
    for (const n in namevset)
        namevseti[n] = Object.keys(namevset[n]);
    this.gencolby();  
    
    // maybe these could be saved as is in the yaml file --- more or less duplicate code with finalize()
    this.namecolnstrs = {}; this.namecolnnum = {}; this.namecolnnull = {};
    for (let i = 0; i < header.length; i++) {
        this.namecolnstrs[header[i]] = this.colnstrs[i];
        this.namecolnnum[header[i]] = this.colnnum[i];
        this.namecolnnull[header[i]] = this.colnnull[i];
    }

    this.bfid = fid.substring(0, fid.length - 5);
    const p = [];
    p.push(this.lazyLoadCol('x'));
    p.push(this.lazyLoadCol('y'));
    p.push(this.lazyLoadCol('z'));
    await Promise.all(p);

    dataToMarkersGui();
    select(this.bfid, this);
}

/** load the data as an array of arrays, and separate out header 
 * raw may file file contents, or a File object
*/
async csvReader(raw, fid) {
    log('csvReader', fid);
    if (fid.endsWith('.xlsx')) return this.xlsxReader(raw, fid);
    if (fid.endsWith('.yaml')) return this.yamlReader(raw, fid);

    this.prep();
    // let {cols, namecols, vset, namevset} = this;
    
    // newparse = false;    // separate tests rather than if else to allow both for quick performance comparison
    var oldparse = true;

    let header;
    // csv-parser not used ... never completely integrated and slower
    // if (newparse) {    // use csv-parser, appears to be about twice as slow as using split (but more correct for ,")
    //     console.time('newparse');
    //     const separator = raw.substring(0,100).indexOf('\t') === -1 ? ',' : '\t';

    //     const csvp = csv({
    //         separator, 
    //         // quote: undefined, raw: false,
    //         mapHeaders: ({header}) => header.toLowerCase().trim().split(',')[0]
    //     }); // get a parser

    //     csvp.on('data', (s) => {
    //         if (!this.header) this.addHeader(Object.keys(s));
    //         this.addRow(Object.values(s));  // what a waste making an object and destroying it again, but ...
    //     });
    //     // process in chunks, simulate continiuous read, and maybe avoid some sillies in parser?
    //     const chl = 1000;
    //     for (let i=0; i < raw.length; i += chl)
    //         csvp.write(raw.substr(i, chl));
    //     csvp.end();
    //     header = this.header = csvp.headers;
    //     console.timeEnd('newparse');
    //     // csvp.destroy();
    // }
    const me = this;  // the this references inside this.lien = linex  were ok, but typescript s=does not seem to like them so use me
    if (oldparse) {
        X.currentThreeObj = X.currentXyz = this; this.xyz = this;
        let sep;
        const st = Date.now();
        let byteLength;
        const linex = function linex(row, numLines, bytesProcessedSoFar, bytesReadSoFar, length) {
            byteLength = length;
            if (row.trim() === '') return;
            // TODO proper comma parsing
            if (!sep) {                     // first non-empty row is treated as header
                sep = row.indexOf('\t') === -1 ? ',' : '\t';
                header = me.header = row.split(sep).map(x=>x.trim().toLowerCase().split(',')[0]);
                me.addHeader(header);
                return;
            }
            const rowa = row.split(sep);    // rowa row as array
            me.addRow(rowa);
            if (me.n % me.tellUpdateInterval === 0) {
                const dt = ((Date.now() - st)/1000).toFixed();
                E.msgbox.innerHTML = `reading file ${fid}, line ${me.n}, bytes ${bytesProcessedSoFar} of ${length}, ${(bytesProcessedSoFar/length*100).toFixed()}%, ${dt} secs`;
            }
            if (me.n % me.graphicsUpdateInterval === 0 || me.n === me.firstUpdate)
                me.finalize(fid, true); // needs some but NOT all
        }

        if (raw instanceof File) {
            console.time('oldparsestream');
            await fileReader(raw, lineSplitter((line, numLines, bytesProcessedSoFar, bytesReadSoFar, length) => 
                linex(line, numLines, bytesProcessedSoFar, bytesReadSoFar, length)));
            console.timeEnd('oldparsestream');
        } else {
            console.time('oldparse');
            const length = raw.length;
            //console.profile('oldparse');
            const data = raw.split('\n');           // data is array of rows as strings
            let bytesProcessedSoFar = 0;
            for (let row of data) {             // row is row as string
                bytesProcessedSoFar += row.length + 1;
                linex(row, me.n, bytesProcessedSoFar, length, length);
            }
            //console.profileEnd('oldparse');
            console.timeEnd('oldparse');
        }
        const dt = ((Date.now() - st)/1000).toFixed();
        E.msgbox.innerHTML = `read ${fid} lines ${me.n}, bytes ${byteLength}, ${dt} secs`;
        setTimeout( () => E.msgbox.innerHTML = '', 5000);
    }

    console.time('finalize');
    me.finalize(fid);
    console.timeEnd('finalize');
}   // csvReader

// prepare to add header/data
prep() {
    this.cols = [],
    this.namecols = {}, 
    this.vset = [], 
    this.namevset = {};
    this.vsetlen = [];
    this.namevsetlen = {};
    this.colnstrs = [];
    this.colnnull = [];
    this.colnnum = [];
    this.namevseti = {};
    this.n = 0;
    this.tellUpdateInterval = 10000;
    this.firstUpdate = 10000;
    this.graphicsUpdateInterval = 250000;
}

// add header, array of names
addHeader(header) {
    header = this.header = header.map(x=>x.trim().toLowerCase().split(',')[0]);
    // experiments with saving as array, not tuple
    this.xi = header.indexOf('x');
    this.yi = header.indexOf('y');
    this.zi = header.indexOf('z');
    for (let i = 0; i < header.length; i++) {
        this.cols[i] = new Float32Array(1000);
        this.vset[i] = {};
        this.vsetlen[i] = 0;
        this.colnstrs[i] = 0;
        this.colnnull[i] = 0;
        this.colnnum[i] = 0;
    }
    this.gencolby();
}

// add a row, array of values, return new n
addRow(rowa) {
    const cols = this.cols, header = this.header;
    if (!this.header) {
        this.addHeader(rowa);
        return 0;
    }
    const n = this.n;
    
    // conversion of array to tuple, plus test, increases total parse time from 300 => 2000
    // with testing 300 => 500
    const xyztest = +rowa[this.xi] + +rowa[this.yi] //  + +rowa[zi] // when not makiong tuples
    if (xyztest === 0) {
        // log('odd position', s.oid, s.x, s.y, s.z);
    } else if (isNaN(xyztest)) {
        log('odd data');
    } else {
        // extend column arrays if necessary
        const ll = cols[0].length;
        if (n >= ll) {
            for (let i = 0; i < header.length; i++) {
                const na = new Float32Array(ll*2);
                na.set(cols[i]);
                cols[i] = na;
            }
        }

        // fill in data values, allowing for number/text and hybrid columns
        for (let i = 0; i < header.length; i++) {
            let v = rowa[i];
            if (v === '') {          // '' value
                this.colnnull[i]++;
                v = NaN4null;
            } else if (isNaN(v)) {   // text value
                let k = this.vset[i][v];
                if (k === undefined) {
                    k = this.vset[i][v] = this.vsetlen[i];
                    this.vsetlen[i]++;
                }
                v = i2NaN(k);
                this.colnstrs[i]++;
            } else {                 // number value
                v = +v;
                this.colnnum[i]++;
            }
            cols[i][n] = v;
        }
        this.n++;
    }
    return this.n;
} // addRow

// finalize and show graphics, partial if part way through
finalize(fid, partial = false) {
    const me = this;
    const {header, cols, namecols, vset, namevset, vsetlen, namevsetlen} = this;

    this.namecolnstrs = {}; this.namecolnnum = {}; this.namecolnnull = {};

    // now we have collected the data trim the columns and prepare helper derived data
    for (let i = 0; i < header.length; i++) {
        cols[i] = cols[i].slice(0, this.n);
        namecols[header[i]] = cols[i];
        namevset[header[i]] = vset[i];
        namevsetlen[header[i]] = vsetlen[i];
        this.namevseti[header[i]] = Object.keys(vset[i]);

        this.namecolnstrs[header[i]] = this.colnstrs[i];
        this.namecolnnum[header[i]] = this.colnnum[i];
        this.namecolnnull[header[i]] = this.colnnull[i];
    }

    // delete some number based fields; they have done their work during preparation, no longer needed
    // they aren't using much space as the big things they point to are pointed to from namecols etc
    if (!partial) {
        delete this.cols;
        delete this.vset;
        delete this.vsetlen;
    }
    
    
    if (!this.ranges || !partial) {
        this.ranges = this.genstats();  // only generate ranges for first input so all are consistent
    }
    
    function finish(col) {
        if (me.header.includes(col)) {
            me.rebase(col);
        } else {
            console.error('data does not have expected column', col, fid);
        }
    }
    if (!partial) {
        finish('x');
        finish('y');
        finish('z');
    }

    this.ranges.forEach = this.sForEach;
    this.setup(fid);
    this.filtergui({keyCode: 13});    // display as markers
    select(fid, this);
}

/** rebase a field based on centrerange, set o_ values */
rebase(fn) {
    const c = centrerange[fn];
    // we used to keep extra columns for original data
    // and also three vectors for position, but overhead too high
    const col = this.namecols[fn];
    for (let i = 0; i < col.length; i++) col[i] -= c;
    this.ranges[fn] = this.genstats(fn);     // could be more efficient here and just modify old stats
}

/** convenience function for iterating fields of an object  */
sForEach(fun) {
    const s = this;
    for (let i in s) {
        const v = s[i];
        fun(v);
    }
}

// code below enables hover to perform temporary spotsize change

/** set/get the spotsize. input may be size or may be event from spotsize gui
TODO, allow for number of pixels so value has similar effect on different devices */
spotsizeset(eventsize, temp='') {
    let size = eventsize.srcElement ? +eventsize.srcElement.id.substring(4) : +eventsize;
    if (temp === 'out') size = this.permspotsize || this.guiset.spotsize;
    this.permspotsize = (temp === 'in') ? this.guiset.spotsize : size;
    this.guiset.spotsize = size;
    if (usePhotoShader) {
        const k = 1000;
        // @ts-ignore standard xyz.material does not have uniforms, but we have overriddem it with one that DOES 
        const sizeUniform = this.material.uniforms.size;
        const r = sizeUniform.value / k;
        if (size !== undefined) sizeUniform.value = size * k;
        return r;
    }
    const r = this.material.size;
    if (size !== undefined) this.material.size = size;
    this.guiset.spotsize = size;
    const radio = E['spot'+this.guiset.spotsize];
    if (radio) radio.checked = true;
    return r;
}

/** handle changes to the gui filter for markers
   on ctrl-enter filter the markers and redisplay */
async filtergui(evt = {}) {
    const box = E.filterbox;  // dom element
    const filterr = E.filterr;  // dom element
    const boxv = box.value.trim();
    try {
        const fun = await this.makefilterfun(boxv, box);
        if (!fun && boxv !== '') return;
        if (evt.keyCode === 13) {
            this.dataToMarkersGui();
        }
    } catch (e) {
        box.style.background='#ffffd0';
        filterr.innerHTML = e.message;
    }
}

/** generate colourby */
gencolby() {
    const s = [`<option value="fixed">fixed</option>`];
    s.push(`<option value="random">random</option>`);
    for (const name of this.header)
        s.push(`<option value="${name}">${name}</option>`);
    E.colourby.innerHTML = s.join('');
}

/** generate stats from given data for a given field, or for all fields, also compute three.js position */
genstats(name = undefined) {
    // function tothreepos(datals) {
    //     for (const d of datals) { 
    //         d.pos = new THREE.Vector3(d.x, d.y, d.z); 
    //         d.o_pos = d.pos.clone(); 
    //     };
    // }
    // tothreepos(datals); // do not keep pos, overhead of all those Vector3 too high
    if (!name) {   // repeat for all fields
        const lranges = {};
        for (name of this.header)  {
            lranges[name] = this.genstats(name);
        }
        if (centrerange.x === Infinity)  // centrerange is static set on first file, and use same for all subsequent files
            centrerange.set(lranges.x.mean, lranges.y.mean, lranges.z.mean);
        return lranges;
    }

    const data = this.namecols[name];   // just extract this field
    let sum = 0, sum2 = 0, n = 0;
    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;
    if (isNaN(data[0])) {min = max = data[0]}
    data.forEach(v => {
        if (!v) return;  // '' or 0 are sometimes used for missing/undefined (not for pdb chains, never mind ...!!!)
        if (isNaN(v)) {
            //
        } else {
            sum += +v;
            sum2 += v*v;
            n++;
            if (v < min) min = v;  // do not use Math.max as doesn't work for alpha
            if (v > max) max = v;
            max = Math.max(max, v);
        }
    });

    const sd = Math.sqrt((sum2 - 1/n * sum*sum) / n);
    return {name, mean: sum / n, sd, mid: (min + max) / 2, range: (max - min), min, max, sum, sum2, n};
}

setup(fid) {
    if (this.material) return;
    // options for sprite1:
    // 1: load as image defined in html, will not work for file: from chrome unless you set the flag --allow-file-access-from-files will do it but inconvenient
    // 2: load as image using textureLoader, will not work for file: from chrome as for 1
    // 3: load from base4, seems to work always, but not very convenient
    // 4: leave undefined, we see squares of approriate size on screen
    let sprite;
    if (location.href.startsWith('file:') || location.host.startsWith('combinatronics.com') || navigator.userAgent.indexOf("Edge") > -1) {
        // Chrome is too fussy with file: loading, so use this instead
        // the data was converted from circle.png using https://www.base64-image.de/
        // Edge did not assume sprite subdirectory authenticated even when higher level one OK
        var image = new Image();
        image.src = 'data:image/png;base64,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'
        sprite = new THREE.Texture();
        sprite.image = image;
        image.onload = function() { sprite.needsUpdate = true; };
    } else {
        var textureLoader = new THREE.TextureLoader();
        sprite = textureLoader.load( "sprites/circle.png", spr => { // TODO; check changes with three.js revisions
            this.material.map = spr;
            this.material.needsUpdate = true;
        });
    }
    const size = 0.3;
    this.material = new THREE.PointsMaterial( { size: size, map: sprite, /** blending: THREE.AdditiveBlending, **/ 
        depthTest: true, transparent : true, alphaTest: 0.3, vertexColors: true } );
    X.currentThreeObj = this.particles = new THREE.Points(new THREE.Geometry(), this.material);
    this.particles.frustumCulled = false;
    this.particles.xyz = this;
    addToMain( this.particles, fid, undefined, this );
    // xyzs[this.name] = this;
} // setup

// save the xyz as separate column files
async savefiles() {
    const saver = saveData; // for download eg to downloads, could be writeFile if we have local server
    // make an object with most metadata but no data
    var xxx = this;
    var obj = Object.assign({}, xxx);
    delete obj.cols;
    delete obj.namecols;
    delete obj.xyz;
//     delete obj.namevset;
//     delete obj.namevsetlen;
    delete obj.namevseti;    
    delete obj.vset;
    delete obj.vsetlen;
//    delete obj.vseti;       // ???
       
    delete obj.material;
    delete obj.geometry;
    delete obj.particles;
    var yaml = X.jsyaml.safeDump(obj, {skipInvalid: true})
    console.log('yaml size', yaml.length);

    saver(this.fid + '.yaml', yaml);
    for (const n in this.namecols) {
        await sleep(200);
        const fid = this.fid + '_' + n + '.colbin';
        log('save', fid);
        await saver(fid, this.namecols[n]);
    }
    log('saves done');
}  // savefiles

enumI(f,i) {
    return NaN2i(this.namecols[f][i]);
}
enumF(f,i) {
    return NaN2i(this.namecols[f][i]) / this.namevsetlen[f];
}
// X.en umI = en umI; X.en umF = en umF; 

// /** screen position; working towards lasso filter */
// spos(x,y,z) {
//     sv3.set(x,y,z).project(camera);
//     sv3.x = (sv3.x + 1) * 0.5 * window.innerWidth;
//     sv3.y = (sv3.y + 1) * 0.5 * window.innerHeight;
//     return sv3;
// }
/** lasso value, can be used for filter or color */
_lasso(x,y,z,id) {
    return lassoGet(x,y,z,id);
}


} // end class XYZ

//const sv3 = new THREE.Vector3();

// for now these are intentionally INSIDE the xyz moduke but OUTSIDE the XYZ class.
/** code for encoding integers with NaNs, first 16 reserved */
var _kkk = new Float32Array([NaN]);
var _iii = new Uint32Array(_kkk.buffer);
// eslint-disable-next-line no-unused-vars
var _bbb = new Uint8Array(_kkk.buffer)
var iNaN = _iii[0];
function i2NaN(i) {
    _kkk[0] = NaN;
    _iii[0] += i+16;
    return _kkk[0];
}
// eslint-disable-next-line no-unused-vars
function NaN2i(f) {
    _kkk[0] = f;
    return _iii[0] - iNaN - 16;
}

// eslint-disable-next-line no-unused-vars
var NaN4null = i2NaN(-15);  // const does not get seen as window.NaN4null

/** convenience function for rgb colour */
function col3(r, g=r, b=g) { return new THREE.Color().setRGB(r, g, b); }
// // eslint-disable-next-line no-unused-vars
// function hsv(h, s, v) { return new THREE.Color().setHSV(h, s, v); }


/* reminder to me
nb 
http://localhost:8800/,,/xyz/xyz.html?startdata=/!C:/Users/Organic/Downloads/small_test_UMAP3A.csv
http://localhost:8800/,,/xyz/xyz.html?startdata=https://files.rcsb.org/download/6Z9P.pdb
https://sjpt.github.io/xyz/xyz.html?startdata=data/4bcufullCA.pdb
https://sjpt.github.io/xyz/xyz.html?startdata=data/small_test.csv
https://sjpt.github.io/xyz/xyz?startdata=https://sjpt.github.io/xyz/data/small_test.csv

http://localhost:8800/,,/xyz/xyz.html?startdata=/remote/https://userweb.molbiol.ox.ac.uk//public/staylor/cyto/Steve_test_UMAP3_cyto_xyz.txt

also
https://gitcdn.link/cdn/sjpt/xyzviewer/master/xyz.html
https://combinatronics.com/sjpt/xyzviewer/master/xyz.html?arch 
   (better, but corrupted the circle.png file) 
   BAD https://combinatronics.com/sjpt/xyzviewer/master/sprites/circle.png
   GOOD https://sjpt.github.io/xyz/sprites/circle.png
   GOOD https://gitcdn.link/cdn/sjpt/xyzviewer/master/sprites/circle.png


http://localhost:8800/,,/xyz/xyz.html?startdata=,,/,,/,,/,,/BigPointData/cytof/cytof_1.5million_anonymised.txt.yaml
*/