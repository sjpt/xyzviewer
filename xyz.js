'use strict';
window.lastModified.xyz = `Last modified: 2021/02/01 12:51:11
`; console.log('>>>>xyz.js');

// import {ggb} from './graphicsboiler.js'; // addToMain, select, setBackground, setHostDOM, setSize
import {ggb, GraphicsBoiler} from './graphicsboiler.js'; // ggb

//?? import {pdbReader} from './pdbreader.js';
import {fileReader, lineSplitter, saveData, sleep, readyFiles, addFileTypeHandler, availableFileList} from './basic.js';
import {COLS} from './cols.js';
import {THREE} from "./threeH.js";
import {Lasso, lassoGet} from "./lasso.js";
import {useXShader} from './xshader.js';        // todo cleanup MD: code


//let E = window, X = window;

export {
    centrerange, // for draw centre consistency
    setPointSize,
    dataToMarkersGui,
    filtergui, filterAdd, filterRemove, applyurl,
    // particles, // for subclass pdbreader, and particles for photoshader
    XYZ,
    col3, _baseiNaN
};

const {E, X} = window;
import {addscript, log} from './basic.js';

var XLSX;

// ??? to engineer below more cleanly
const setPointSize = (a, b) => { if (X.currentXyz) X.currentXyz.setPointSize(a, b); }
const filtergui = g => { if (X.currentXyz) X.currentXyz.filtergui(g); }
const dataToMarkersGui = (type, popping) => { if (X.currentXyz) X.currentXyz.dataToMarkersGui(type, popping); }
const centrerange = new THREE.Vector3(Infinity);  // ranges for external use
const badfun = () => -9999;

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

static xyzs = {};
static autorange = true;       // why is eslint complaining here?

constructor(data, fid, owngb) {
    const self = this;
    X.currentXyz = X.currentThreeObj = this.xyz = this;
    this.fid = fid;
    this._col = new THREE.Color(1,1,1);
    this.makechainlines = undefined;
    this.guiset = baseguiset;
    this.pendread = {};  // pending async lazy reads
    this._ids = undefined;    // ids for crossfilter
    this.fields = {};
    this._onFilter = undefined;
    this._inDataToMarkers = 0;
    this._dataToMarkersQ = [];
    this.gb = owngb ? new GraphicsBoiler() : ggb;

    // make sure control= values in URL get respected (after csvReader in case yamlReader has other ideas)
    if (Object.keys(XYZ.xyzs).length === 0)
        this.guiset.filterbox = E.filterbox.value;
        
    // colourby is dropdown, colourpick is colour picker
    this.gb.select(fid, this);
    XYZ.xyzs[fid] = this;

    // catch our filter events from lasso and pass them on if wanted
    window.addEventListener('lassoUp', async function() {
        const ids = await self.getCallbacks();
        if (self._onFilter) self._onFilter(ids);
    });

    if (!data) return;  // called from pdbReader
    this.csvReader(data, fid);

}

/** load data based on gui values */
dataToMarkersGui(type, popping) {
    if (E.xshaderbox.checked) {
        useXShader('MD:');
        return;
    }
    
    if (X.currentThreeObj.xyz) {
        if (type) E.colourby.value = type;
        if (!this.guiset) this.guiset = baseguiset;   // in case of pdbreader ... todo proper subclass
        Object.assign(this.guiset, {colourby: E.colourby.value, filterbox: E.filterbox.value, colourpick: E.colourpick.value});
        if (this.makechainlines)
            this.makechainlines(E.filterbox.value);
        return this.dataToMarkers(E.filterbox.value, popping)
    } else if (X.currentThreeObj.material ) {
        X.currentThreeObj.material.color.set(E.colourpick.value);
    }
}

/** filter ids, those not in list will not be displayed */
filter(ids) {
    console.log('filter #', Object.keys(ids).length);
    this._ids = ids;
    this.dataToMarkersGui();
}

/** hide ids, those not in list will not be displayed */
hide(ids) {
    console.log('hide #', Object.keys(ids).length);
    this._ids = ids;
    this.dataToMarkersGui();
}

/** set up callback on our filter change */
onFilter(f) { this._onFilter = f; }


// dataToMarkers must be queued as it is async
// in particular, we want to make sure filter canclulation is complete before it is used.
async dataToMarkers(pfilterfun, popping, cbs) {
    this._dataToMarkersQ.push({pfilterfun, popping, cbs})
    // console.error('attempt to reenter dataToMarkers')
    if (this._inDataToMarkers) return;

    this._inDataToMarkers++;
    while (true) {
        const s = this._dataToMarkersQ.shift();
        if (!s) break;
        ({pfilterfun, popping, cbs} = s);
        await this._dataToMarkers(pfilterfun, popping, cbs);
    }
    this._inDataToMarkers--;
}


/** load the data with given filter and colour functions if required, and display as markers */
async _dataToMarkers(pfilterfun, popping, cbs) {
    const st = performance.now();
    if (!this.particles) this.setup(this.fid);  // for call from pdbReader
    const xc = this.namecols[this.getField('X')];
    const yc = this.namecols[this.getField('Y')];
    const zc = this.namecols[this.getField('Z')];
    
    const l = xc.length;
    const filterfun = await this.makefilterfun(pfilterfun, E.filterbox, 'force');
    if (filterfun === badfun) return;
    let vert = this._svert = this._svert || new Float32Array(l*3);
    let col = this._scol = this._scol || new Float32Array(l*3);
    const geometry = this.geometry = this.geometry || new THREE.BufferGeometry();
    let ii = 0;
    let noxyz = 0;
    for (let i = 0; i < this.pendread_min; i ++ ) {
        if (this._ids !== undefined && !this._ids[i+1]) continue;  // handle crossfilter
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
            if (cbs) {
                cbs[i+1] = true;
            } else {
                vert[ii] = _x;
                col[ii++] = c.r;
                vert[ii] = _y;
                col[ii++] = c.g;
                vert[ii] = _z;
                col[ii++] = c.b;
            }
        }
    }
    if (cbs) return;
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
    let ok = true;
    if (filterfun) {
        E.filtcount.innerHTML = `filter applied: #points=${ll} of ${l}, time: ${dt}ms`;
    } else if (pfilterfun) {
        E.filtcount.innerHTML = `bad filter not applied`;        // already been marked as error                  
        ok = false;
    } else {
        E.filtcount.innerHTML = `no filter applied: #points=${l} , time: ${dt}ms`;
    }
    if (ok && !popping) {
        let ll = location.href.split('&control=')[0];
        if (ll.indexOf('?') === -1) ll += '?';
        if (pfilterfun)
            ll += '&control=' + pfilterfun.split('\n').join('!!!');
        history.pushState({}, undefined, ll)
    }
    await this.makefilterfun(pfilterfun, E.filterbox, 'confirm');                 // get gui display right

    // return [ll,l];
}

/** extract the value for an element
 * This is largely a convenience function for generating filters.
 * TODO: It should be replaced by something more efficient (especially for pure numeric or pure alpha columns)
 * when compiling the filter functions.
 */
val(name, i) {
    const rv = this.namecols[name][i];
    if (!isNaN(rv)) return rv;
    // const k = NaN2i(rv);
    const k = this.namevcols[name][i] - _baseiNaN;
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
 * COL: refers to xyz._col, a prepared THREE.Colour() object . _C also used
 * This is set to a default before executing the filter
 * and may be set (eg _C.setRGB(1,0,0), or even RGB(1,0,0)) during execution of the filter
 * Handling colour this way 
 *  * reduces the need for generating new color object for each filter execution
 *  * reduces the risk of overriding contributing COLS object in complex filters
 * 
 */
async makefilterfun(filtin, box, mode='') {
    let filt = filtin;
    const msg = (m, col) => {
        E.filterr.innerHTML = `${m} <br><code> ${filt.split('\n').join('<br>')}<code>`;
        if (box) box.classList = [col];
        E.filterr.classList = [col];
    }
    if (mode === 'force') this.lastInputApplied = undefined;    // invalidate so force recompilation

    const applied = mode === 'confirm';                         // have just applied so must be OK
    if (applied || filtin === this.lastInputApplied) {
        if (applied) this.lastCodeApplied = this.lastCodeGenerated;
        this.lastInputApplied = filtin;
        filt = this.lastCodeApplied || '';   // so msg comes right
        msg('filter applied', '_applied');
        return this.lastFunction;
    }
    this.lastInputTested = filtin;
    msg('testing', '_testing');
    if (!filt) { 
        msg('empty filter, ctrl-enter to apply', '_empty');
        return undefined;
    }
    let filtfun;
    if (typeof filt === 'function')
        filtfun = filt;
    else if (typeof filt === 'string') {
        try {
            
            for (let fn in this.ranges) { // find used fields and assign (saves risk of accidental override of d.<fn>)
                if (filt.match( new RegExp('\\b' + fn + '\\b', 'g'))) {
                    const usealpha = this.namecolnstrs[fn] > this.namecolnnum[fn];
                    let fun = usealpha ? 'valEN' : XYZ.autorange ? 'valN' : 'val';
                    filt = `const ${fn} = xyz.${fun}('${fn}', i);\n${filt}`;
                    await this.lazyLoadCol(fn);
                }
                if (filt.match( new RegExp('\\b' + fn + '_R\\b', 'g'))) {
                    filt = `const ${fn}_N = xyz.val('${fn}', i, 1.5);\n${filt}`;
                    await this.lazyLoadCol(fn);
                }
                if (filt.match( new RegExp('\\b' + fn + '_N\\b', 'g'))) {
                    filt = `const ${fn}_N = xyz.valN('${fn}', i, 1.5);\n${filt}`;
                    await this.lazyLoadCol(fn);
                }
                if (filt.match( new RegExp('\\b' + fn + '_E\\b', 'g'))) {
                    filt = `const ${fn}_E = xyz.valE('${fn}', i);\n${filt}`;
                    await this.lazyLoadCol(fn);
                }
                if (filt.match( new RegExp('\\b' + fn + '_EN\\b', 'g'))) {
                    filt = `const ${fn}_EN = xyz.valEN('${fn}', i);\n${filt}`;
                    await this.lazyLoadCol(fn);
                }
            }

            filt = filt.replace(/\bVX\((.*?)\)/g, "{const k = $1; _R*=k; _G*=k; _B*=k;}");            
            filt = filt.replace(/\bRGB\(/g, "_C.setRGB(");
            filt = filt.replace(/\b_R\b/g, "_C.r");
            filt = filt.replace(/\b_G\b/g, "_C.g");
            filt = filt.replace(/\b_B\b/g, "_C.b");
            // RGB(cd3, cd4, cd16)

            // apply after VX() etc to reduce wrong bracketing risk
            filt = filt.replace(/\b_L\b/g, 'xyz._lasso(_x,_y,_z)');
            filt.replace(/\b_L([0-9])\b/g, 'xyz._lasso(_x,_y,_z,$1)')
            // if (filt.match(/\b_L[0-9]\b/)) {
            //     for (let i=0; i<=9; i++)
            //         if (filt.match(new RegExp('\\b_L' + i + '\\b', 'g'))) filt = `const _L${i} = xyz._lasso(x,y,z, ${i})\n${filt}`
            // }
            

            filt = filt.split('\n').map(l => {
                if (l[0] === '?') l = `if (!(${l.substring(1)})) return;`;
                else if (l.startsWith('COL:')) {const ll = l.substring(4).trim(); l = '_C.' + COLS.gencol(this, ll)}
                else if (l.startsWith('MD:')) l = '// ' + l;
                else if (l.startsWith('COLX:')) {const ll = l.substring(5).trim(); l = '_C.set(' + ll + ')'}
                else if (l.startsWith('X:')) l = `_x = ${l.substring(2)}`;
                else if (l.startsWith('Y:')) l = `_y = ${l.substring(2)}`;
                else if (l.startsWith('Z:')) l = `_z = ${l.substring(2)}`;
                else if (l.startsWith('R:')) l = `_C.r = ${l.substring(2)}`;
                else if (l.startsWith('G:')) l = `_C.g = ${l.substring(2)}`;
                else if (l.startsWith('B:')) l = `_C.b = ${l.substring(2)}`;
                return l;
            }).join('\n');


            // generate filter
            // if (filt.indexOf('return') === -1) filt = 'return (' + filt + ')';
            filt += '\nreturn {_x, _y, _z};'        // note, xyz._col === _C is implicit output
            // todo: make special case filters for pure number/pure alpha columns???
            filt = `"use strict";
                var _x, _y, _z, _C = xyz._col;
            ` + filt;
            this.lastCodeGenerated = filt;

            this.lastFunction = undefined;
            filtfun = new Function('xyz', 'i', filt);
            this.lastFunction = filtfun;
        } catch (e) {
            msg('invalid function: ' + e.message, '_invalid');
            return badfun;
        }
    } else {
        msg('unexpected filter type', '_unexpected');
        return badfun;
    }

    try {
        // eslint-disable-next-line no-unused-vars
        const r = filtfun(this, 0);
    } catch(e) {
        msg('function throws exception: ' + e.message, '_exception');
        return badfun;
    }
    msg('OK: ctrl-enter to apply filter', '_OK');
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
    let step = 2*1024*1024;
    const t = this.namecols[id]; if (t) return t;
    const fid = this.bfid + '_' + id + '.colbin';
    // set up the complete buffer/views to hold all data (both Float32Array and Uint32Array views)
    let fbuff = this.namecols[id] = new Float32Array(this.n);
    this.namevcols[id] = new Uint32Array(fbuff.buffer);
    const usealpha = this.namecolnstrs[id] > this.namecolnnum[id];
    const kk = 'll' + id;
    console.time(kk);

    // find the stream so we can read the data incrementally
    let stream;
    if (fid.startsWith(',,') || fid.startsWith('..')) { // NOT correct test! will work for files from server
        console.timeLog(kk);
        const resp = await fetch(fid);
        console.timeLog(kk);
        if (resp.status !== 200)
            throw new Error(`Column data ${id} not available: rc=${resp.status}<br>${fid}`)
        stream = resp.body;
    } else if (readyFiles[fid]) {   // works for a dragged drop set of files
        // fblob = readyFiles[fid];
        // if (!fblob) throw new Error('no ready file ' + fid);
        stream = readyFiles[fid].stream();
    } else if (availableFileList[fid]) {    // worked for dropped directory referenced by a file
        const makeFile = (fileEntry) =>
            new Promise(resolve => fileEntry.file(resolve));
            readyFiles[fid] = await makeFile(availableFileList[fid]);
        stream = readyFiles[fid].stream();
    } else {
        throw new Error('no ready file ' + fid);
    }

    // incrementally read the data stream
    const reader = stream.getReader();
    let p = 0;                                              // p is position, pup is position updated
    let ut = 0;                                             // ut is last update time, set to 0 so first input causes update
    const updateInterval = 1000;                            // update every second
    const att = this.nameattcols[id];
    while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        const fseg = new Float32Array(value.buffer);        // get the segment as Float32Array (hope value.buffer comes in multipes of 4)
        fbuff.set(fseg, p);                                 // and save into main buffer
        if (att) {                                          // update associated texture (if any)
            if (usealpha) {                                 // alpha ones need the unsigned bytes array updated
                const namevcol = this.namevcols[id];
                const iarr = att.array;
                for (let n = p; n < p + fseg.length; n++)
                    iarr[n] = namevcol[n] - _baseiNaN;                
            }
            const t = Date.now();                           // update the texture, but not toooften
            if (t - ut > updateInterval) {
                att.needsUpdate = true;
                ut = t;
            }
        }
        p += fseg.length;
        this.pendread[id] = p;
        this.showpendread();    
    }
    if (att) att.needsUpdate = true;
    console.timeLog(kk);
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
    this.namevcols = {};
    for (const n in namevset)
        namevseti[n] = Object.keys(namevset[n]);
    this.headerSetup();  
    
    // maybe these could be saved as is in the yaml file --- more or less duplicate code with finalize()
    this.namecolnstrs = {}; this.namecolnnum = {}; this.namecolnnull = {};
    for (let i = 0; i < header.length; i++) {
        this.namecolnstrs[header[i]] = this.colnstrs[i];
        this.namecolnnum[header[i]] = this.colnnum[i];
        this.namecolnnull[header[i]] = this.colnnull[i];
    }

    this.bfid = fid.substring(0, fid.length - 5);
    const p = [];
    let done = 0;
    this.lazyLoadCol(this.getField('X')).then(() => done++);
    this.lazyLoadCol(this.getField('Y')).then(() => done++);
    this.lazyLoadCol(this.getField('Z')).then(() => done++);
    // await Promise.all(p);

    for (let i=0; i<100; i++) {
        await dataToMarkersGui();
        this.showpendread();
        if (done === 3) break;
        await sleep(500);
    }
    this.gb.select(this.bfid, this);
}

/** show pending read status; also compute min loaded value */
showpendread() {
    const all = [], some = [];
    this.pendread_min = this.n;
    for (const col in this.pendread) {
        const p = this.pendread[col];
        if (p === this.n) {
            all.push(col);
        } else {
            some.push(`<br>${col}=${(p*100/this.n).toFixed()}%`);
            this.pendread_min = Math.min(this.pendread_min, p);
        }
    }
    E.msgbox.innerHTML = '100%: ' + all.join(' ') + some.join('');
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
    this.cols = [],         // column arrays (Float32), by number
    this.colsv = [],        // column arrays (Uint32), by number    
    this.namecols = {},     // columns arrays (Float32), by name
    this.nameattcols = {};  // column buffer attributes
    this.vset = [],         // value set, by number
    this.namevset = {};     // value set, by name, string => value set id 
    this.vsetlen = [];      // size of value set, by number
    this.namevsetlen = {};  // size of value set (# discrete string values), by name
    this.colnstrs = [];     // number of string value instances in each column
    this.colnnull = [];     // number of null string instances in each column
    this.colnnum = [];      // number of numeric values in each column
    this.namevseti = {};    // value set, value set id => string
    this.n = 0;             // count
    this.tellUpdateInterval = 10000;    // inform update insterval during long load
    this.firstUpdate = 10000;
    this.graphicsUpdateInterval = 250000;
}

// set up using input JSON object, eg injected from MLV
useJson(d) {
    this.prep();
    const header = Object.keys(d[0]);
    this.addHeader(header);
    for (const o of d) {
        // Object.values(o) almost the same,
        // but inefficient anyway and may not be reliable
        this.addRow(header.map(x => o[x]));
    }
    this.finalize('fromMLV');
}

// add header, array of names
addHeader(header) {
    header = this.header = header.map(x=>x.trim().toLowerCase().split(',')[0]);
    // experiments with saving as array, not tuple
    this.xi = header.indexOf('x');
    this.yi = header.indexOf('y');
    this.zi = header.indexOf('z');
    for (let i = 0; i < header.length; i++) {
        this.colsv[i] = new Uint32Array(1000);
        this.cols[i] = new Float32Array(this.colsv[i].buffer);
        this.vset[i] = {};
        this.vsetlen[i] = 0;
        this.colnstrs[i] = 0;
        this.colnnull[i] = 0;
        this.colnnum[i] = 0;
    }
    this.headerSetup();
}

// add a row, array of values, return new n
addRow(rowa) {
    const {cols, header, colsv} = this;
    if (!this.header) {
        this.addHeader(rowa);
        return 0;
    }
    const n = this.n;
    
    // conversion of array to tuple, plus test, increases total parse time from 300 => 2000
    // with testing 300 => 500
    // TODO: consider whether we want any xyz testing if those columns ARE present
    const xyztest = (this.fid.startsWith('StarCarr')) ? +rowa[this.xi] + +rowa[this.yi] : 99; // only test for StarCarr

    if (xyztest === 0) {
        // log('odd position', s.oid, s.x, s.y, s.z);
    } else if (isNaN(xyztest)) {
        log('odd data');
    } else {
        // extend column arrays if necessary
        const ll = cols[0].length;
        if (n >= ll) {
            for (let i = 0; i < header.length; i++) {
                const na = new Uint32Array(ll*2);
                na.set(colsv[i]);
                colsv[i] = na;
                cols[i] = new Float32Array(na.buffer);
            }
        }

        // fill in data values, allowing for number/text and hybrid columns
        for (let i = 0; i < header.length; i++) {
            let v = rowa[i];
            if (v === '') {          // '' value
                this.colnnull[i]++;
                colsv[i][n] = NaN4null;
            } else if (isNaN(v)) {   // text value
                let k = this.vset[i][v];
                if (k === undefined) {
                    k = this.vset[i][v] = this.vsetlen[i];
                    this.vsetlen[i]++;
                }
                this.colnstrs[i]++;
                colsv[i][n] = k + _baseiNaN;
            } else {                 // number value
                v = +v;
                this.colnnum[i]++;
                cols[i][n] = v;
            }
        }
        this.n++;
        this.pendread_min = this.n;
    }
    return this.n;
} // addRow

// finalize and show graphics, partial if part way through
finalize(fid, partial = false) {
    const me = this;
    const {header, cols, namecols, vset, namevset, vsetlen, namevsetlen} = this;

    this.namecolnstrs = {}; this.namecolnnum = {}; this.namecolnnull = {};
    this.namevcols = {};

    // now we have collected the data trim the columns and prepare helper derived data
    for (let i = 0; i < header.length; i++) {
        cols[i] = cols[i].slice(0, this.n);
        namecols[header[i]] = cols[i];
        this.namevcols[header[i]] = new Uint32Array(cols[i].buffer);
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
            // console.error('data does not have expected column to rebase', col, fid);
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
    this.gb.select(fid, this);
}

/** rebase a field based on centrerange (no longer set o_ values) */
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
setPointSize(eventsize, temp='') {
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
    if (size !== undefined && this.material) this.material.size = size;
    this.guiset.spotsize = size;
    const radio = E['spot'+this.guiset.spotsize];
    if (radio) radio.checked = true;
    return this.material && this.material.size;
}

/** handle changes to the gui filter for markers
   on ctrl-enter filter the markers and redisplay */
async filtergui(evt = {}) {
    const box = E.filterbox;  // dom element
    const filterr = E.filterr;  // dom element
    const boxv = box.value.trim();
    try {
        const fun = await this.makefilterfun(boxv, box);
        if (fun === badfun) return;
        if (evt.keyCode === 13) {
            this.dataToMarkersGui();
        }
    } catch (e) {
        box.style.background='#ffffd0';
        filterr.innerHTML = e.message;
    }
}

/** generate colourby and initial filter*/
headerSetup() {
    this.def = {};
    this.def.X = this.header.includes('x') ? 'x' : this.header[0];
    this.def.Y = this.header.includes('y') ? 'y' : this.header[1];
    this.def.Z = this.header.includes('z') ? 'z' : this.header[2];
    this.setField('X', this.getField('X'), false);
    this.setField('Y', this.getField('Y'), false);
    this.setField('Z', this.getField('Z'), false);

    const s = [`<option value="fixed">fixed</option>`];
    s.push(`<option value="random">random</option>`);
    for (const name of this.header)
        s.push(`<option value="${name}">${name}</option>`);
    E.colourby.innerHTML = s.join('');
}

/** generate stats from given data for a given field, or for all fields (no longer also compute three.js position) */
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
        if (centrerange.x === Infinity && lranges.x)  // centrerange is static set on first file, and use same for all subsequent files
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
    if (location.href.startsWith('file:') || location.host.startsWith('combinatronics.com')|| location.host.startsWith('mlv.') || navigator.userAgent.indexOf("Edge") > -1) {
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
    this.gb.addToMain( this.particles, fid, undefined, this );
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
    for (const k in obj) if (k[0] === '_') delete obj[k];
//     delete obj.namevset;
//     delete obj.namevsetlen;
    delete obj.namevseti;    
    delete obj.vset;
    delete obj.vsetlen;
    delete obj.nameattcols;
//    delete obj.vseti;       // ???
       
    delete obj.material;
    delete obj.geometry;
    delete obj.particles;
    delete obj.gb;
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

/** normalized values to sds (assumed numeric values) */
valN(f, i, sds=1.5) {
    const r = this.ranges[f];
    return (this.namecols[f][i] - r.mean) / (r.sd * sds * 2) + 0.5;
}

/** enum value (assumed alpha values) */
valE(f,i) {
    return this.namevcols[f][i] - _baseiNaN;
}

/** normalized enum value (assumed alpha values) */
valEN(f,i) {
    return (this.namevcols[f][i] - _baseiNaN) / this.namevsetlen[f];
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

/** get ids from lasso for callback */
async getCallbacks() {
    const cbs = {};
    const f = `
X:${this.getField('X')}
Y:${this.getField('Y')}
Z:${this.getField('Z')}
if (!xyz._lasso(_x, _y, _z)) return;
`
    await this.dataToMarkers(f, undefined, cbs);
    console.log('filtered OK ', Object.keys(cbs).length);
    // this.dataToMarkers();
    return cbs;
}

/** make a proxy, experiment that may help with MLV */
makeProxy() {
    this.pvals = [];
    for (let i=0; i < this.n; i++) {
        this.pvals[i] = new Proxy(this, {get: (targ, prop) => targ.val(prop, i)});
    }
}

/** set the field to use for a particular role */
/** TODO, handle ranges, _N, etc */
setField(fieldRole, fieldName, update=true) {
    this.fields[fieldRole] = fieldName; // .replace('_ N', '');
    const ofilt = '\n' + E.filterbox.value + '\n';
    const rx = new RegExp('^(.*)\\n' + fieldRole + ':(.*?)\\n(.*)', 's');  // was /^(.*)\nCOL:(.*?)\n(.*)/s
    let g = ofilt.match(rx);
    if (g)
        E.filterbox.value = `${g[1]}\n${fieldRole}:${fieldName}\n${g[3]}`.trim();
    else
        E.filterbox.value = `${ofilt.trim()}\n${fieldRole}:${fieldName}`.trim();
    if (update) this.dataToMarkersGui();
}

getField(fieldRole) {
    const f = this.fields[fieldRole];
    if (f) return f; // .replace('_ N', '');
    const filt = new RegExp(`${fieldRole}:(.*)`);
    const m = E.filterbox.value.match(filt);
    if (m) return m[1]; // .replace('_ N', '');
    
    const v =this.def[fieldRole];
    E.filterbox.value = `${fieldRole}:${v}\n` + E.filterbox.value;
    return v;
}

setColor(fieldName, details) { this.setField('COL', fieldName); }

/** delegate various functions to (single for now) graphicsBoider/renderer */
setBackground(r = 0, g = r, b = r, alpha = 1) { this.gb.setBackground(r, g, b, alpha); }
setHostDOM(host) {  host.appendChild(this.gb.renderer.domElement); }
getHostDOM() { return this.gb.renderer.domElement.parentElement; }

setSize(x, y) { this.gb.setSize(x, y); }

/** pending, dispose of resources */
dispose() {

}


} // end class XYZ

function filterAdd(s, end=false) {
    const l = E.filterbox.value.split('\n');
    if (l.includes(s)) return;
    if (end)
        l.push(s);
    else
        l.unshift(s);
    E.filterbox.value = l.join('\n');
    //filtergui();
    dataToMarkersGui();
}

function filterRemove(s) {
    let l = E.filterbox.value.split('\n');
    l = l.filter(ll => ll !== s);
    E.filterbox.value = l.join('\n');
    //filtergui();
    dataToMarkersGui();
}


function applyurl() {
    const con = decodeURI(location.href).split('&control=')[1] || ''; // location.search is terminated by '#' character
    E.filterbox.value = con.split('!!!').join('\n');
    dataToMarkersGui(undefined, true);
}

window.onpopstate = applyurl;
//const sv3 = new THREE.Vector3();

// for now these are intentionally INSIDE the xyz module but OUTSIDE the XYZ class.
/** code for encoding integers with NaNs, first 16 reserved */
const _kkk = new Float32Array([NaN]);
const _iii = new Uint32Array(_kkk.buffer);
// eslint-disable-next-line no-unused-vars
const _bbb = new Uint8Array(_kkk.buffer)
const iNaN = _iii[0];
const _baseiNaN = iNaN + 16;
const NaN4null = iNaN + 1;

// The functions below did not work with Firefox,
// so we are using the parallel Unit32Array/Float32Array views instead.
// function i2NaN(i) {
//     _kkk[0] = NaN;
//     _iii[0] += i+16;
//     return _kkk[0];
// }
// // eslint-disable-next-line no-unused-vars
// function NaN2i(f) {
//     _kkk[0] = f;
//     return _iii[0] - iNaN - 16;
// }

// // eslint-disable-next-line no-unused-vars
// var NaN4null = i2NaN(-15);  // const does not get seen as window.NaN4null

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