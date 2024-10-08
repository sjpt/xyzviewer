'use strict';
window.lastModified.tdata = `Last modified: 2021/03/11 15:28:37
`; console.log('>>>>xyz.js');

//?? import {pdbReader} from './pdbreader.js';
import {fileReader, lineSplitter, saveData, sleep, readyFiles, addFileTypeHandler, availableFileList, queryVariables} from './basic.js';
import {XYZ, centrerange} from './xyz.js';


export {
    TData,
    _baseiNaN
};

const {E, X} = window;
import {addscript, log} from './basic.js';

var XLSX;

/** these enable handling of files according to extension */
addFileTypeHandler('.csv', csvReader);
addFileTypeHandler('.txt', csvReader);
addFileTypeHandler('.xlsx', csvReader);
addFileTypeHandler('.yaml', csvReader);
const binnop = () => {};
binnop.rawhandler = true;
binnop.hidden = true;
addFileTypeHandler('.colbin', binnop);

function csvReader(data, fid) { return new XYZ(data, fid); }
csvReader.rawhandler = true;

class TData {

static tdatas = {};
static tellUpdateInterval = 10000;    // inform update insterval during long load
static firstUpdate = 10000;
static graphicsUpdateInterval = 250000;

// reminder, useful regexp for wrongly used _ fields:  (?<![this|me])\._

/**
     * @param {any} data
     * @param {string} fid
     */
constructor(data, fid) {
    /** @type {string} */ this.fid = fid;
    /** @type {{}} */ this.pendread = {};  // pending async lazy reads
    /** @type XYZ[] */ this.xyzs = [];

    this.fvals = {},        // columns arrays (Float32), by name
    this.uvals = {};        // column arrays (UInt32), by name
    this.attcols = {};      // three.js column buffer attributes; created outside TData but held by TData for sharing
    this.vset = {};         // value set, by name, string => value set id 
    this.vsetlen = {};      // size of value set (# discrete string values), by name
    this.vseti = {};        // value set, value set id => string
    this.n = 0;             // count of items/rows
    this.ranges = {};       // stats for each column
    
    // _ fields below only used when collecting/parsing data using column numbers
    this._vsetlen = [];     // size of value set, by number
    this._vset = [],        // value set, by number
    this._colf32 = [],      // column arrays (Float32), by number
    this._colsu32 = [],     // column arrays (Uint32), by number    
    this._colnstrs = [];    // number of string value instances in each column
    this._colnnull = [];    // number of null string instances in each column
    this._colnnum = [];     // number of numeric values in each column
    TData.tdatas[fid] = this;

    if (!data) return;  // called from pdbReader
    this.csvReader(data, fid);
}

/** get a tdata object keyed by fid, so different XYZ objects can share single data repository
 * @param {any} data  may be ready-made tdata, or somehting that can be turned into pdata
 * @param {string} fid
 * @returns {TData}
 */
static get(data, fid, xyz) {
    /** @type TData */ let tdata = (data instanceof TData) ? data : (data && data.tdata) || TData.tdatas[fid];
    if (!tdata) tdata = new TData(data, fid);
    TData.tdatas[fid] = tdata;
    tdata.xyzs.push(xyz);
    return tdata;
}


/** extract the value for an element
 * This is largely a convenience function for generating filters.
 * Mainly replaced by something more efficient (especially for pure numeric or pure alpha columns)
 * when compiling the filter functions.
 */
/**
 * 
 * @param {string} name 
 * @param {number} i 
 */
val(name, i) {
    const nc = this.fvals[name];
    if (!nc) {
        if (name === '_tdata') return this;
        this.lazyLoadCol(name); 
        return NaN;
    }
    const rv = nc[i];
    if (!isNaN(rv)) return rv;
    // const k = NaN2i(rv);
    const k = this.uvals[name][i] - _baseiNaN;
    if (k === -15) return '';
    return this.vseti[name][k];
}


/**
     * parse an xlsl file for use as a table
     * @param {any} raw
     * @param {string} fid
     * @returns {Promise<number>}
     */
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

/**
     * lazy load a column and return it
     * May be from a File or from a url. TODO Also to handle case of FileEntry, after dropping of Directory
     * Test for which is temporary, and the split should maybe be made somewhere more generic.
     * @param {string} id
     */
async lazyLoadCol(id) {
    let step = 2*1024*1024;
    const t = this.fvals[id]; 
    if (t) {    // do not complete till really loaded, todo use events
        while (this.pendread[id] !== this.n) await sleep(100);
        return t;
    }
    if (!this.ranges[id]) {
        if (id === 'id') {  // special case to help out crossfilter
            this.fvals[id] = new Float32Array(this.n);
            this.fvals[id].forEach( (x,i,a) => a[i] = i);        // silly forEach not chainable
            this.pendread[id] = this.n;
            return;
        }
        const msg = `lazyLoadCol cannot load column ${id}, not a known column`;
        console.error(msg);
        throw new Error(msg);
    }
    const fid = this.bfid + '_' + id + '.colbin';
    // set up the complete buffer/views to hold all data (both Float32Array and Uint32Array views)
    let fbuff = this.fvals[id] = new Float32Array(this.n);
    this.uvals[id] = new Uint32Array(fbuff.buffer);
    const u8buff = new Uint8Array(fbuff.buffer);        // used for loading, in case chunk has non *4 length
    const usealpha = this.ranges[id].numStrs > this.ranges[id].numNum;
    const kk = 'll ' + id;
    this.pendread[id] = 0;
    console.time(kk);

    // find the stream so we can read the data incrementally
    let stream;
    if (fid.startsWith(',,') || fid.startsWith('..') || fid.startsWith('/remote/')) { // NOT correct test! will work for files from server
        console.timeLog(kk, 'use server');
        let xfid = fid;
        if (queryVariables.nodatacache) xfid += '?' + Date.now();
        const resp = await fetch(xfid);
        console.timeLog(kk, 'await fetch done');
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
    // It almost always arrives in segments that are a multiple of 4 byes, but not quite always (testLazyLoad to test)
    // So we keep track of p, number of bytes read, and p4, number of complete 4byte words read.
    const reader = stream.getReader();
    let p = 0, p4 = 0;                                      // p is position, in bytes, p4 is position in 32 bit words
    let np = 0, np4 = 0;                                    // np, np4 are new values after segemt read
    let ut = 0;                                             // ut is last update time, set to 0 so first input causes update
    const updateInterval = 1000;                            // update every second
    const att = this.attcols[id];
    while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        const u8seg = new Uint8Array(value.buffer);         // get the segment as Float32Array (hope value.buffer comes in multipes of 4)
        u8buff.set(u8seg, p);                               // and save into main buffer
        np = p + u8seg.length;
        p4 = Math.floor(p/4);                               // p4 is in # safe 32 bit entries
        np4 = Math.floor(np/4);                             // p4 is in # safe 32 bit entries

        if (att) {                                          // update associated texture (if any)
            if (usealpha) {                                 // alpha ones need the unsigned bytes array updated
                const uval = this.uvals[id];
                const iarr = att.array;
                for (let n = p4; n < np4; n++)
                    iarr[n] = uval[n] - _baseiNaN;                
            }
            const t = Date.now();                           // update the texture, but not too often
            if (t - ut > updateInterval) {
                att.needsUpdate = true;
                ut = t;
            }
        }
        p = np;
        this.pendread[id] = np4;                            // pendread is in # safe 32 bit entries
        this.showpendread();                                // this will show progress, and compute pendread_min overall progress
    }
    if (att) att.needsUpdate = true;
    console.timeLog(kk, 'lazyLoad complete');
    console.timeEnd(kk);
}

/** test lazy load of ALL columns */
async testLazyLoad() {
    this.fvals = {}; 
    this.pendread = {}; 
    for (const h of this.header) this.lazyLoadCol(h);
}

/** read a yaml file as table
 * The yaml file will be the metadata, and hold necessary value sets
 * The 'real' data will be in seprate column files loaded on demand by lazyLoadCol
 */
async yamlReader(raw, fid) { 
    this.prep();    // obsolete
    // get information available in yaml
    const yaml = typeof raw === 'string' ? raw : await raw.text();

    // Object.assign(this, X.jsyaml.safeLoad(yaml));
    // collect specific fields from the yaml file
    // allow for rename from some old values
    const y = X.jsyaml.safeLoad(yaml);
    this.header = y.header;
    this.vset = y.vset || y.namevset;
    this.ranges = y.ranges;
    this.n = y.n;

    // and synthesize some more
    const {vset, vseti, header, vsetlen} = this;
    for (const n in vset) {
        vseti[n] = Object.keys(vset[n]);
        vsetlen[n] = vseti[n].length;
    }
    // ?? this.headerSetup(); 
    
    // for backward compatability

    
    // for backward compatibility, older files (eg cytof_1.5million_anonymised.txt.yaml for ?ox) saved in different format
    if (this.ranges[header[0]].numStrs === undefined) {

        for (let i = 0; i < header.length; i++) {
            const h = header[i];
            // if it is an old yaml file the namecolnstrs etc will be missing,
            // and the _colnstrs etc will have an old name colnstrs etc.

            this.ranges[h].numStrs = y.namecolnstrs ? y.namecolnstrs[h] : y.colnstrs[i];
            this.ranges[h].numNum = y.namecolnnum ? y.namecolnnum[h] : y.colnnum[i];
            this.ranges[h].numNull = y.namecolnnull ? y.namecolnnull[h] : y.colnnull[i];
        }
        //// @ts-ignore
        ////delete this.colnstrs; delete this.colnnum; delete this.colnnull;

    }

    this.bfid = fid.substring(0, fid.length - 5);

}

/** show pending read status; also compute min loaded value.
 * This allows incremental display as files are loaded.
 * pendread[col] shows the number of fields already loaded for the column
 */
showpendread() {
    const all = [], some = [];
    const oldPendread_min = this.pendread_min;
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

    // make sure we redraw when all data ready
    // we may refresh some xyzs unnecessarily ???
    if (this.pendread_min === this.n && oldPendread_min !== this.n) {
        for (const xyz of this.xyzs)
            xyz.dataToMarkersGui();
    }
}

/**
 * load a csv file, parse it and save the data as an array of arrays, and separate out header
     raw may file file contents, or a File object
    @param {string | File} raw
    @param {string} fid
    @return {Promise}
    */
async csvReader(raw, fid) {
    log('csvReader', fid);
    if (fid.endsWith('.xlsx')) return this.xlsxReader(raw, fid);
    if (fid.endsWith('.yaml')) return await this.yamlReader(raw, fid);

    this.prep();     // obsolete ?
    
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
        X.currentThreeObj = X.currentXyz = this; // this.xyz = this;
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
            if (me.n % TData.tellUpdateInterval === 0) {
                const dt = ((Date.now() - st)/1000).toFixed();
                E.msgbox.innerHTML = `reading file ${fid}, line ${me.n}, bytes ${bytesProcessedSoFar} of ${length}, ${(bytesProcessedSoFar/length*100).toFixed()}%, ${dt} secs`;
            }
            if (me.n % TData.graphicsUpdateInterval === 0 || me.n === TData.firstUpdate) {
                log('reading', E.msgbox.innerHTML);
                me.finalize(fid, true); // needs some but NOT all
            }
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

// prepare to add header/data, obsolete? done in constructor
/**
 * 
 */
prep() {
}

/** set up using input JSON object, eg injected from MLV
     * @param {Object} d
     */
useJson(d) {
    if (this.header) return;    // json already set up
    this.prep();     // obsolete ?
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
/**
     * @param {(string)[]} header
     */
addHeader(header) {
    header = this.header = header.map(x=>x.trim().toLowerCase().split(',')[0]);

    // prepare to collect the column based data, based on columns numbers
    for (let i = 0; i < header.length; i++) {
        this._colsu32[i] = new Uint32Array(1000);
        this._colf32[i] = new Float32Array(this._colsu32[i].buffer);
        this._vset[i] = {};
        this._vsetlen[i] = 0;
        this._colnstrs[i] = 0;
        this._colnnull[i] = 0;
        this._colnnum[i] = 0;
    }
    // this.headerSetup();
}

// add a row, array of values, return new n
/**
     * @param {any[]} rowa
     */
addRow(rowa) {
    const {_colf32: _cols, header, _colsu32: _colsv} = this;
    if (!this.header) {
        this.addHeader(rowa);
        return 0;
    }
    const n = this.n;
    
    // conversion of array to tuple, plus test, increases total parse time from 300 => 2000
    // with testing 300 => 500
    
    // special case for StarCarr 0 values. ? TODO make generic data cleansing escape
    if (this.fid.startsWith('StarCarr')) {
        const xi = header.indexOf('x'), yi = header.indexOf('y') // , zi = header.indexOf('z'), noi = header.indexOf('no');
        if (+rowa[xi] === 0) rowa[xi] = '!!!bad 0!!!';
        if (+rowa[yi] === 0) rowa[yi] = '!!!bad 0!!!';        
    }
 
    // extend column arrays if necessary
    const ll = this._colf32[0].length;
    if (n >= ll) {
        for (let i = 0; i < header.length; i++) {
            const na = new Uint32Array(ll*2);
            na.set(_colsv[i]);
            _colsv[i] = na;
            _cols[i] = new Float32Array(na.buffer);
        }
    }

    // fill in data values, allowing for number/text and hybrid columns
    for (let i = 0; i < header.length; i++) {
        let v = rowa[i];
        if (v === '') {          // '' value
            this._colnnull[i]++;
            _colsv[i][n] = NaN4null;
        } else if (isNaN(v)) {   // text value
            let k = this._vset[i][v];
            if (k === undefined) {
                k = this._vset[i][v] = this._vsetlen[i];
                this._vsetlen[i]++;
            }
            this._colnstrs[i]++;
            _colsv[i][n] = k + _baseiNaN;
        } else {                 // number value
            v = +v;
            this._colnnum[i]++;
            _cols[i][n] = v;
        }
    }
    this.n++;
    this.pendread_min = this.n;
    return this.n;
} // addRow

/** finalize and show graphics, partial if part way through
     * @param {string} fid
     */
finalize(fid, partial = false) {
    const me = this;
    const {header, _colf32: _cols, fvals: fvals, _vset, vset, _vsetlen, vsetlen} = this;

    // now we have collected the data trim the columns and prepare helper derived data
    for (let i = 0; i < header.length; i++) {
        const colname = header[i];
        _cols[i] = _cols[i].slice(0, this.n);
        fvals[colname] = _cols[i];
        this.uvals[header[i]] = new Uint32Array(_cols[i].buffer);
        vset[colname] = _vset[i];
        vsetlen[colname] = _vsetlen[i];
        this.vseti[colname] = Object.keys(_vset[i]);

        if (!this.ranges[colname]) this.ranges[colname] = {};
        const r = this.ranges[colname];
        r.numStrs = this._colnstrs[i];
        r.numNum = this._colnnum[i];
        r.numNull = this._colnnull[i];
    }

    // delete some number based fields; they have done their work during preparation, no longer needed
    // they aren't using much space as the big things they point to are pointed to from namecols etc
    if (!partial) {
        delete this._colf32;
        delete this._vset;
        delete this._vsetlen;
    }
    
    
    if (!partial) {
        Object.assign(this.ranges, this.genstats());  // only generate ranges for first input so all are consistent
    }
    
    function finish(col) {
        if (me.header.includes(col)) {
            me.rebase(col);
        }
    }
    if (!partial) {
        // ??? do we want to rebase x,y,z in general, rather than just for archaeology
        // maybe, it certainly helped with pdbdata
        finish('x');
        finish('y');
        finish('z');        
        }
    this.ranges.forEach = this.sForEach;
    for (const xyz of this.xyzs)
        xyz.finalize(fid, partial);


}

/**
     * rebase a field based on centrerange
     * @param {string} fn
     */
rebase(fn) {
    const c = centrerange[fn];
    // we used to keep extra columns for original data
    // and also three vectors for position, but overhead too high
    const col = this.fvals[fn];
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


/** generate stats from given data for a given field, or for all fields */
genstats(name = undefined) {
    // function tothreepos(datals) {
    //     for (const d of datals) { 
    //         d.pos = new THREE.Vector3(d.x, d.y, d.z); 
    //         d.o_pos = d.pos.clone(); 
    //     };
    // }
    // tothreepos(datals); // do not keep pos, overhead of all those Vector3 too high
    if (!name) {   // repeat for all fields
        const lranges = this.ranges;
        for (name of this.header)  {
            this.genstats(name);
        }
        if (centrerange.x === Infinity && lranges.x)  // centrerange is static set on first file, and use same for all subsequent files
            centrerange.set(lranges.x.mean, lranges.y.mean, lranges.z.mean);
        return lranges;
    }

    const data = this.fvals[name];   // just extract this field
    let sum = 0, sum2 = 0, n = 0;
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    // if (isNaN(data[0])) {min = max = data[0]}  // ???? what was this for ????
    data.forEach(v => {
        if (v == null) return;  // used to use !v so v=0 was not used, special StarCarr case of x/y=0, now handled elsewhere
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
    Object.assign(this.ranges[name], 
        {name, mean: sum / n, sd, mid: (min + max) / 2, range: (max - min), min, max, sum, sum2, n}
    );
    return this.ranges[name];
}


/** save the xyz internal column form as separate column files, with yaml control file.
 * This is used for example where a very large csv file has been (expensively) read,
 * and enables the more efficient column load for future (fast, lazy) loading.
 */
async savefiles(yamlonly = false) {
    const saver = saveData; // for download eg to downloads, could be writeFile if we have local server
    // make an object with most metadata but no data
    const {header, vset, ranges, n} = this;
    const obj = {header, vset, ranges, n};
       
    var yaml = X.jsyaml.safeDump(obj, {skipInvalid: true})
    console.log('yaml size', yaml.length);
    saver(this.fid + '.yaml', yaml);
    if (yamlonly) return;

    for (const n in this.fvals) {
        await sleep(200);
        const fid = this.fid + '_' + n + '.colbin';
        log('save', fid);
        await saver(fid, this.fvals[n]);
    }
    log('saves done');
}  // savefiles

/**
     * normalized values to sds (assumed numeric values)
     * @param {string} f
     * @param {number} i
     * @param {number} sds
     * @returns {number}
     */
valN(f, i, sds=1.5) {
    const r = this.ranges[f];
    return (this.fvals[f][i] - r.mean) / (r.sd * sds * 2) + 0.5;
}

/**
     * normalized values given low/high
     * @param {string} f
     * @param {number} i
     * @param {number} low
     * @param {number} high
     * @returns {number}
     */
valLH(f, i, low, high) {
    return (this.fvals[f][i] -low) / (high - low);
}

/**
     * enum value (assumed alpha values)
     * @param {string} f
     * @param {number} i
     * @returns {number}
     */
valE(f,i) {
    return this.uvals[f][i] - _baseiNaN;
}

/**
     * normalized enum value (assumed alpha values)
     * @param {string} f
     * @param {number} i
     * @returns {number}
     */
    valEN(f,i) {
    return (this.uvals[f][i] - _baseiNaN) / this.vsetlen[f];
}

/**
     * get character value
     * @param {string} f
     * @param {number} i
     * @returns {string}
     */
valC(f, i) {
    return this.vseti[f][this.uvals[f][i] - _baseiNaN];
}
// X.en umI = en umI; X.en umF = en umF; 

/** make a proxy, strictly an array of proxies, to look like JSon data
 * experiment that may help with MLV */
makeProxy() {
    const p = this.pvals = new Array(this.n);
    for (let i=0; i < this.n; i++) {
        p[i] = new Proxy(this, {
            /**
             * @param {*} targ 
             * @param {string} prop 
             * @returns 
             */
            get: (targ, prop) => targ.val(prop, i)
        });
    }
    return p;
}


/** pending, dispose of resources */
dispose() {

}


} // end class XYZ

// for now these are intentionally INSIDE the tdata module but OUTSIDE the TData class.
/** code for encoding integers with NaNs, first 16 reserved */
const _kkk = new Float32Array([NaN]);
const _iii = new Uint32Array(_kkk.buffer);
// eslint-disable-next-line no-unused-vars
const _bbb = new Uint8Array(_kkk.buffer)
const iNaN = _iii[0];
const _baseiNaN = iNaN + 16;
const NaN4null = iNaN + 1;

// The functions below did not work with Firefox,
// so we are using the parallel Uint32Array/Float32Array views instead.
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