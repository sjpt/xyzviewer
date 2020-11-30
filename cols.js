/**  */
'use strict';
export {COLS};
import {saveData} from './basic.js';

var {addFileTypeHandler, jsyaml, THREE, X, E, dataToMarkersGui} = window;
X.lastModified.basic = `Last modified: 2020/11/27 19:50:28
`
var COLS = X.COLS = {};

/** for now key is probably just a field name:
 * we may consider more structured keys with colour scheme names etc., maybe related to fid
 */
COLS.reader = function(data, fid) {
    data = data.trim();
    let coldata;
    if (data[0] === '{')
        coldata = JSON.parse(data);
    else
        coldata = jsyaml.safeLoad(data);
    
    for (let setn in coldata) {         // eg set is colours for given field/key
        const setv = coldata[setn];
        for (let val in setv) {      // value is a val
            const v = setv[val];     // colour name
            const c = new THREE.Color(v);
            if (c.r === undefined) {console.log(`bad colour ${v} for ${setn}/${val}, white used: in ${fid}`); c.set('white'); }
            setv[val] = c;
        }
    }
    Object.assign(COLS, coldata);
}

/** generate code for colour for field */
COLS.gencol = function(field, xyz) {
    COLS.show(xyz, field);
    if (field === 'random') return 'COLS.random()';             // random colours
    if (field === 'fixed') field = colourpick.value;
    if (COLS[field]) return `COLS["${field}"][${field}]`;       // field with defined colours
    if (xyz.namecolnstrs[field] > xyz.namecolnnum[field]) return `X.stdcol(xyz.enumI("${field}", i))`; // mainly character field, no defined colours

    const r = xyz.ranges[field];
    if (r === undefined) {
        const c = new THREE.Color(field);
        if (Object.getOwnPropertyNames(c).indexOf('r') !== -1)  // not sure how it manages c.r === 1 and 'r' in c, this is a better test
            return `{r: ${c.r}, g: ${c.g}, b: ${c.b}}`          // field a constant colour value
        throw new Error(`Field "${field}" not present.`)        // field not valid
    }
    const low = r.mean - 2*r.sd, high = r.mean + 2*r.sd, range = high - low;
    return `COLS.forrange(xyz.namecols["${field}"][i], ${low}, ${range})`;      // mainly number field
}

/** random colours */
COLS.random = function() {
    const r = Math.random;
    return {r: r(), g: r(), b: r()};
}

COLS.forrange = function(v, low, range) {
    const vv = (v - low)/range;
    return X.col3(vv, 1-vv, 1-vv);
}

/** write arbitrary cols file */
COLS.writer = async function(fid = 'test') {
    if (!fid.endsWith('.cols')) fid += '.cols';
    const d = {};
    const ns = X.currentXyz.namevseti;
    const choose = Object.keys(THREE.Color.NAMES);

    for (const fname in ns) {
        const vs = ns[fname];
        if (vs.length === 0) continue;
        const dd = d[fname] = {};
        for (const val of vs) {
            dd[val] = choose[Math.floor(Math.random() * choose.length)];
        }
    }
    const yaml = jsyaml.safeDump(d);
    await saveData(fid, yaml);
}

COLS.show = function(xyz = X.currentXyz, field = xyz.guiset.colourby) {
    let f = COLS[field];
    if (!f) {
        f = {};
        const vs = xyz.namevset[field];
        for (const k in vs) {
            f[k] = X.stdcol(vs[k]);
        }
    }
    let s = [];
    for (const k in f) {
        const c = f[k], rgb = `rgb(${c.r*255}, ${c.g*255}, ${c.b*255})`;
        s.push(`<tr><td>${k}</td><td style=" background-color: ${rgb}"></td>`);
    }
    E.colkey.innerHTML = `<table><colgroup><col><col style="width: 2em"></colgroup>${s.join('')}</table>`;
}

/** set a colour value */
COLS.set = function(f, fixed) {
    if (E.colourby.value !== f) E.colourby.value = fixed ? 'fixed' : f;
    const ofilt = '\n' + E.filterbox.value + '\n'
    let g = ofilt.match(/(.*)\nCOL:(.*?)\n(.*)/);
    if (g)
        E.filterbox.value = `${g[1]}\nCOL:${f}\n${g[3]}`.trim();
    else
        E.filterbox.value = `COL:${f}\n${ofilt}`.trim();
    dataToMarkersGui();
}

addFileTypeHandler('.cols', COLS.reader);

