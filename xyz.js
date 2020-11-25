'use strict';
import {addToMain} from './graphicsboiler.js';
import {makechainlines, pdbReader} from './pdbreader.js';
import {fileReader, lineSplitter, writeFile, saveData, sleep, readyFiles} from './basic.js';
//let E = window, X = window;
window.lastModified.xyz = `Last modified: 2020/11/24 10:20:58
`

export {
    centrerange, // for draw centre consistency
    spotsize,
    dataToMarkersGui,
    // particles, // for subclass pdbreader, and particles for photoshader
    XYZ,
    stdcols, stdcol,
    csvReader
};
// temporary below
// let filtergui;


const {THREE, addFileTypeHandler, col3, E, X, addscript, currentObj, csv, NaN4null, i2NaN, NaN2i} = window;
// let E = window, X = window;
X.xyzs = {};
const {log} = window;
const stdcols = [
    col3(0.5, 0.5, 0.5),
    col3(1,0,0),
    col3(0,1,0),
    col3(0,0,1),
    col3(0,1,1),
    col3(1,0,1),
    col3(1,1,0),
    col3(1,1,1)
    ];
const stdcol = X.stdcol = n => stdcols[n%8];

// bridge to access current members
// currentObj
// current 
/** */
const spotsize = a => {
    if (X.currentXyz) X.currentXyz.spotsize(a);
    //if (X.plymaterial) X.plymaterial.size = a;
}
const filtergui = g => { if (X.currentXyz) X.currentXyz.filtergui(g); }
const dataToMarkersGui = type => X.currentXyz.dataToMarkersGui(type);
const centrerange = X.centrerange = new THREE.Vector3('unset');  // ranges for external use

/***/
X.spotsize = spotsize;
X.dataToMarkersGui = dataToMarkersGui;
X.filtergui = filtergui;
X.csvReader = csvReader;
X.pdbReader = pdbReader;
addFileTypeHandler('.csv', csvReader);
addFileTypeHandler('.txt', csvReader);
addFileTypeHandler('.xlsx', csvReader);
addFileTypeHandler('.yaml', csvReader);
const binnop = () => {};
binnop.rawhandler = true;
addFileTypeHandler('.colbin', binnop);

var usePhotoShader;
function csvReader(data, fid) { return new XYZ(data, fid); }
csvReader.rawhandler = true;

class XYZ {
    // comment in line below for typescript checking, comment out for js runtime
    // header, da tas, ranges, particles, material;
//var header; // header, as array
//var ranges; // data ranges, as structure of min/max
// let particles, material;


constructor(data, fid) {
    window.currentXyz = this;
    this.fid = fid;
    if (!data) return;  // called from pdbReader
    this.csvReader(data, fid);
    X.xyzs[fid] = this;
}

/** load data based on gui values */
dataToMarkersGui(type) {
    if (X.currentObj.xyz) {
        if (type) E.colourby.value = type;
        makechainlines(E.filterbox.value, E.colourby.value);
        return this.dataToMarkers(E.filterbox.value, E.colourby.value)
    } else if (X.currentObj.material ) {
        E.colourbox.value = E.colourpick.value;
        currentObj.material.color.set(E.colourbox.value);
    }
}

/** load the data with given filter and colour functions if required, and display as markers */
async dataToMarkers(pfilterfun, pcolourfun) {
    if (!this.particles) this.setup('dataToMarkers');  // for call from pdbReader
    const xc = this.namecols.x, yc = this.namecols.y, zc = this.namecols.z;
    const l = xc.length;
    const filterfun = await this.makefilterfun(pfilterfun, E.filterbox);
    const colourfun = await this.makecolourfun(pcolourfun, E.colourbox);
    let vert = new Float32Array(l*3);
    let col = new Float32Array(l*3);
    const geometry = this.geometry = new THREE.BufferGeometry();
    let ii = 0;
    let noxyz = 0;
    for (let i = 0; i < l; i ++ ) {
        let du;
        if (filterfun) {
            const df = filterfun(this, i);
            if (!df) continue;
            if (typeof df === 'object') du = df;
        }
        if (!du) du = {x: xc[i], y: yc[i], z: zc[i]};
        const r = Math.random;
        let c = colourfun ? colourfun(this, i) : col3(r(), r(), r());
        if (!c) c = {r:1, g:1, b:1};            // ??? patch for hybrid numeric/alpha ???
        let x = 'x' in du ? du.x : xc[i];
        let y = 'y' in du ? du.y : yc[i];
        let z = 'z' in du ? du.z : zc[i];
        if (x === undefined || y === undefined || z === undefined) {
            noxyz++;
        } else {            
            vert[ii] = x;
            col[ii++] = 'r' in du ? du.r : c.r;
            vert[ii] = y;
            col[ii++] = 'g' in du ? du.g : c.g;
            vert[ii] = z;
            col[ii++] = 'b' in du ? du.b : c.b;
        }
    }
    const ll = ii/3;
    if (ll !== l) {
        vert = vert.slice(0, ii);
        col = col.slice(0, ii);
    }
    if (noxyz) console.log('ddata/filter failed to give xyz for', noxyz, 'elements');
    if (ll === 0) {console.log('ddata/filter failed to give any xyz'); }
    const verta = new THREE.BufferAttribute(vert , 3);
    const cola = new THREE.BufferAttribute(col , 3);
    geometry.setAttribute('position', verta);
    geometry.setAttribute('color', cola);
    this.particles.geometry = geometry;
    if (filterfun)
        E.filtcount.innerHTML = `filter applied: #points=${ll} of ${l}`;
    else 
        E.filtcount.innerHTML = 'no filter applied: #points=' + l;
    await this.makefilterfun(pfilterfun, E.filterbox, true);                 // get gui display right

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

/** make a colour function for a field.
 * the input may be just field name,
 * or a structure with field fn (field name) and optional low and high values
 * If low and high are not given they are used as 1.5 standard deviations from the mean.
 * We may later add low and high colour values for greater flexibility.
 */
async makecolourfun(fn, box) {
    if (typeof fn === 'function') return fn;
    if (fn === undefined || fn === '' || fn === 'random') return ()=>col3(Math.random(),Math.random(),Math.random());
    if (fn === 'choose') {
        const cc = new THREE.Color().setStyle(E.colourpick.value);
        E.colourbox.value = E.colourpick.value;
        return ()=>cc;
    }
    if (fn === 'custom')
        try {
            const c = E.colourbox.value;
            if (c[0] === '#') {
                const cc = new THREE.Color().setStyle(c);
                E.colourpick.value = '#' + cc.getHexString();
                return ()=>cc;
            }
            const f = await this.makefilterfun(c, box);
            //const col = f(da tas[0]);  // test
            return f;
        } catch(e) {
            return undefined;
        }
    if (typeof fn === 'string' && typeof (window[fn]) === 'function') return window[fn];  // need better formalization
    if (typeof fn === 'string') fn = { fn }
    const r = this.ranges[fn.fn];               // range
    const name = fn.fn;
    let col = await this.lazyLoadCol(name);
    if (isNaN(r.sd)) {
        const cf = function colourbyEnum(xyz, i) {    // colorby enumerated column
            const v = col[i];    // raw value
            const ii = NaN2i(v);                // just use the  valueset index
            return stdcol(ii);
        }
        return cf;
    } else {                            // colorby value column
        if (fn.low === undefined) fn.low = r.mean - 1.5 * r.sd;
        if (fn.high === undefined) fn.high = r.mean + 1.5 * r.sd;
        const low = fn.low;
        const range = fn.high - fn.low;

        const cf = function colourbyVal(xyz, i) {
            const v = col[i];    // raw value
            const nv = ( v - low) / range;      // normalized value
            return col3(nv, 1-nv, 1-nv);        // colour
        }
        return cf;
    }
}

/** make a function for a filter
 * If the value is a string it is converted to a function, using d as the input data row.
 * so a valid string could be 'd.x > 17'.
 * Also allows just x > 17
 * Flags any failure in E.filterr.innerHTML and returns undefined
 * If applied === true the filter has been applied, record the fact
 */
async makefilterfun(filtin, box, applied=false) {
    let filt = filtin;
    const msg = (m, col) => {
        E.filterr.innerHTML = `${m} <br><code> ${filt.split('\n').join('<br>')}<code>`;
        if (box) box.style.background = col;
        E.filterr.style.color = col;
    }

    if (applied || filtin === box.lastInputApplied) {
        if (applied) box.lastCodeApplied = box.lastCodeGenerated;
        box.lastInputApplied = filtin;
        filt = box.lastCodeApplied || '';   // so msg comes right
        return msg('filter applied', 'white');
    }
    box.lastInputTested = filtin;
    msg('testing', '#101010');
    if (!filt) { 
        msg('empty filter', '#d0ffd0');
        return undefined;
    }
    let filtfun;
    if (typeof filt === 'function')
        filtfun = filt;
    else if (typeof filt === 'string') {
        const used = [];
        for (let fn in this.ranges) // find used fields and assign (saves risk of accidental override of d.<fn>)
            if (filt.match( new RegExp('\\b' + fn + '\\b', 'g'))) {
                used.push(fn);
                await this.lazyLoadCol(fn);
            }

        // generate filter
        if (filt.indexOf('return') === -1) filt = 'return (' + filt + ')';
        // todo: make special case filters for pure number/pure alpha columns???
        const uu = used.map(u => `var ${u} = xyz.val('${u}', i);`).join('\n');
        filt = `
            var x = 0, y = 0, z = 0, r = 1, g = 1, b = 1;
            ${uu}\n
        ` + filt;
        box.lastCodeGenerated = filt;
        try {
            filtfun = new Function('xyz', 'i', filt);
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
    if (!window.XLSX) {
        await addscript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.14.3/xlsx.full.min.js");
        console.log('loaded', window.XLSX);
        // window.XLSX = XLSX;
    }
    let XLSXX = window.XLSX;
    let workbook = XLSXX.read(raw, {type: 'binary'});
    let firstSheet = workbook.SheetNames[0];
    let ss = workbook.Sheets[firstSheet];
    // could be made much more efficient if needed
    // also neither this nor main line allows for empty header field name, or repeated ones
    this.extocsv = XLSXX.utils.sheet_to_csv(ss);
    return this.csvReader(this.extocsv, fid + '!');
}

/** lazy load a columns and return it */
async lazyLoadCol(id) {
    const t = this.namecols[id]; if (t) return t;

    const fid = this.bfid + '_' + id + '.colbin'
    const f = readyFiles[fid];
    if (!f) return console.error('no ready file', fid);
    const buff = await f.arrayBuffer();
    return this.namecols[id] = new Float32Array(buff);
}

async yamlReader(raw, fid) { 
    this.prep();
    X.currentObj = X.currentXyz = this.xyz = this;
    // get information available in yaml
    const yaml = await raw.text();
    Object.assign(this, X.jsyaml.safeLoad(yaml));

    // and synthesize some more
    const {namevset, namevseti} = this;
    this.namecols = {};
    for (const n in namevset)
        namevseti[n] = Object.keys(namevset[n]);
    this.gencolby();   

    this.bfid = fid.substring(0, fid.length - 5);
    await this.lazyLoadCol('x');
    await this.lazyLoadCol('y');
    await this.lazyLoadCol('z');

    dataToMarkersGui();
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
    
    window.newparse = false;    // separate tests rather than if else to allow both for quick performance comparison
    window.oldparse = true;

    let header;
    if (window.newparse) {    // use csv-parser, appears to be about twice as slow as using split (but more correct for ,")
        console.time('newparse');
        const separator = raw.substring(0,100).indexOf('\t') === -1 ? ',' : '\t';

        const csvp = csv({
            separator, 
            // quote: undefined, raw: false,
            mapHeaders: ({header}) => header.toLowerCase().trim().split(',')[0]
        }); // get a parser

        csvp.on('data', (s) => {
            if (!this.header) this.addHeader(Object.keys(s));
            this.addRow(Object.values(s));  // what a waste making an object and destroying it again, but ...
        });
        // process in chunks, simulate continiuous read, and maybe avoid some sillies in parser?
        const chl = 1000;
        for (let i=0; i < raw.length; i += chl)
            csvp.write(raw.substr(i, chl));
        csvp.end();
        header = this.header = csvp.headers;
        console.timeEnd('newparse');
        // csvp.destroy();
    }
    if (window.oldparse) {
        X.currentObj = X.currentXyz = this; this.xyz = this;
        let sep;
        const st = Date.now();
        this.line = function linex(row, numLines, bytesProcessedSoFar, bytesReadSoFar, length) {
            this.byteLength = length;
            if (row.trim() === '') return;
            // TODO proper comma parsing
            if (!sep) {                     // first non-empty row is treated as header
                sep = row.indexOf('\t') === -1 ? ',' : '\t';
                header = this.header = row.split(sep).map(x=>x.trim().toLowerCase().split(',')[0]);
                this.addHeader(header);
                return;
            }
            const rowa = row.split(sep);    // rowa row as array
            this.addRow(rowa);
            if (this.n % this.tellUpdateInterval === 0) {
                const dt = ((Date.now() - st)/1000).toFixed();
                E.msgbox.innerHTML = `reading file ${fid}, line ${this.n}, bytes ${bytesProcessedSoFar} of ${length}, ${(bytesProcessedSoFar/length*100).toFixed()}%, ${dt} secs`;
            }
            if (this.n % this.graphicsUpdateInterval === 0 || this.n === this.firstUpdate)
                this.finalize(fid, true); // needs some but NOT all
        }

        if (raw instanceof File) {
            console.time('oldparsestream');
            await fileReader(raw, lineSplitter((line, numLines, bytesProcessedSoFar, bytesReadSoFar, length) => 
                this.line(line, numLines, bytesProcessedSoFar, bytesReadSoFar, length)));
            console.timeEnd('oldparsestream');
        } else {
            console.time('oldparse');
            const length = raw.length;
            //console.profile('oldparse');
            const data = raw.split('\n');           // data is array of rows as strings
            let bytesProcessedSoFar = 0;
            for (let row of data) {             // row is row as string
                bytesProcessedSoFar += row.length + 1;
                this.line(row, this.n, bytesProcessedSoFar, length, length);
            }
            //console.profileEnd('oldparse');
            console.timeEnd('oldparse');
        }
        const dt = ((Date.now() - st)/1000).toFixed();
        E.msgbox.innerHTML = `read ${fid} lines ${this.n}, bytes ${this.byteLength}, ${dt} secs`;
        setTimeout( () => E.msgbox.innerHTML = '', 5000);
    }

    console.time('finalize');
    this.finalize(fid);
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

    // now we have collected the data trim the columns and prepare helper derived data
    for (let i = 0; i < header.length; i++) {
        cols[i] = cols[i].slice(0, this.n);
        namecols[header[i]] = cols[i];
        namevset[header[i]] = vset[i];
        namevsetlen[header[i]] = vsetlen[i];
        this.namevseti[header[i]] = Object.keys(vset[i]);
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
}

/** rebase a field based on centrerange, set o_ values */
rebase(fn) {
    const c = centrerange[fn];
    // we used to keep extra columns for original data
    // and also three vectors for position, but overhead too high
    const col = this.namecols[fn];
    for (let i = 0; i < col.length; i++) col[i] -= c;
    this.ranges[fn] = this.genstats(undefined, fn);     // could be more efficient here and just modify old stats
}

/** convenience function for iterating fields of an object  */
sForEach(fun) {
    const s = this;
    for (let i in s) {
        const v = s[i];
        fun(v);
    }
}


/** set/get the spotsize.  TODO, allow for number of pixels so value has similar effect on different devices */
spotsize(size) {
    if (usePhotoShader) {
        const k = 1000;
        const r = this.material.uniforms.size.value / k;
        if (size !== undefined) this.material.uniforms.size.value = size * k;
        return r;
    }
    const r = this.material.size;
    if (size !== undefined) this.material.size = size;
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
    E.colourby.innerHTML = `<option value="choose">choose</option>`;
    E.colourby.innerHTML += `<option value="random">random</option>`;
    E.colourby.innerHTML += `<option value="custom">custom</option>`;
    for (const name of this.header)
        E.colourby.innerHTML += `<option value="${name}">${name}</option>`;
}

/** generate stats from given data for a given field, or for all fields, also compute three.js position */
genstats(datalsNO = this.NOdatas, name = undefined) {
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
            lranges[name] = this.genstats(datalsNO, name);
        }
        if (centrerange.x === 'unset')  // centrerange is static set on first file, and use same for all subsequent files
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
    this.gencolby();

    return {name, mean: sum / n, sd, mid: (min + max) / 2, range: (max - min), min, max, sum, sum2, n};
}

/** setvals, for use with pdbreader, later to be subclass */
setvals(vals) {
    this.datas = vals;
    this.ranges = this.genstats();
    // this.ranges = vals.ranges;
    // ({this.ranges, this.data s} = vals);  // checker does not like this with this.
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
    this.material = new THREE.PointsMaterial( { size: size, map: sprite, /** blending: THREE.AdditiveBlending, **/ depthTest: true, transparent : true, alphaTest: 0.3, vertexColors: THREE.VertexColors } );
    X.currentObj = this.particles = new THREE.Points(new THREE.Geometry(), this.material);
    this.particles.xyz = this;
    addToMain( this.particles, fid );
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
    delete obj.vseti;       // ???
       
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

} // end class XYZ

// helpers, global
function enumI(d,f) {
    if (f.substring(0,2) === 'd.') f=f.substring(2); 
    return X.currentXyz.namevset[f][d];
}
function enumF(d,f) {
    if (f.substring(0,2) === 'd.') f=f.substring(2); 
    return X.currentXyz.namevset[f][d] / X.currentXyz.namevsetlen[f];
}
X.enumI = enumI; X.enumF = enumF; 

function plan() {
    window.maingroup.rotation.set(0,0,0);
    home();
}

function elevation() {
    window.maingroup.rotation.set(Math.PI/2,0,0);
    home();
}
X.plan = plan; X.elevation = elevation; 

function home() {
    window.controls.home();
}


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

*/