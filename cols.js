/**  */
'use strict';
export {COLS};
window.lastModified.basic = `Last modified: 2021/01/15 15:37:57
`; console.log('>>>>cols.js');
import {saveData, addFileTypeHandler} from './basic.js';
import {eqcols} from './jsdeps/colorHelpers.js';
import {dataToMarkersGui} from './xyz.js';
import {useXShader} from './xshader.js';        // todo cleanup MD: code

const {X, E} = window, {jsyaml} = X;
import {THREE} from "./threeH.js";

var COLS = {};
X.COLS = COLS;  // still needed in global scope for filters 

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
    dataToMarkersGui();
}

/** make colours from equal hues */
COLS.autocol = function(xyz, field) {
    const nv = xyz.namevseti[field];
    const nn = nv.length;
    const r = COLS[field] = {};
    const eql = eqcols.length;
    for (let i = 0; i < nn; i++) {
        const v = nv[i];
        r[v] = eqcols[Math.floor( i * eql /nn)]
    }
    COLS.show(xyz, field);
}

/** generate code for setting colour for field */
COLS.gencol = function(xyz, field) {
    try{
        if (field === 'random') return 'set(COLS.random())';             // random colours
        if (field === 'fixed') field = E.colourpick.value;          // fixed colour

        if (xyz.namecolnstrs[field] > xyz.namecolnnum[field] && !COLS[field]) COLS.autocol(xyz, field);

        if (COLS[field]) return `set(COLS["${field}"][${field}])`;       // field with defined colours

        // below no longer needed, colours defined above instead
        //if (xyz.namecolnstrs[field] > xyz.namecolnnum[field]) return `stdcol(xyz.valE("${field}", i))`; // mainly character field, no defined colours


        const r = xyz.ranges[field];
        if (r === undefined) {
            const c = new THREE.Color(field);
            if (Object.getOwnPropertyNames(c).indexOf('r') !== -1)  // not sure how it manages c.r === 1 and 'r' in c, this is a better test
                return `setRGB(${c.r}, ${c.g}, ${c.b})`          // field a constant colour value
            throw new Error(`Field "${field}" not present.`)        // field not valid
        }
        const low = r.mean - 2*r.sd, high = r.mean + 2*r.sd, range = high - low;
        return `set(COLS.forrange(${field}, ${low}, ${range}))`;      // mainly number field
    } finally {
        COLS.show(xyz, field);        
    }
}

/** (inefficient) get colour for single value, mainly for debug */
COLS.colfor = function(xyz, field, i) {
    const sf = COLS.gencol(xyz, field);
    const f = new Function('xyz', 'i', `${field} = xyz.val("${field}", ${i});return xyz._col.` + sf);
    return f(xyz, i);
}

/** random colours, result should be consumed at once, reuse of object */
COLS.random = function() {
    const r = Math.random;
    return COLS._colobj.setRGB(r(), r(), r());
}

COLS._colobj = new THREE.Color('white');
/** colour from given range, result should be consumed at once, reuse of object */
COLS.forrange = function(v, low, range) {
    const vv = (v - low)/range;
    return COLS._colobj.setRGB(vv, 1-vv, 1-vv);
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
    if (xyz.namecolnstrs[field] < xyz.namecolnnum[field]) {
        E.colkey.innerHTML = '';
        return;
    }
    let f = COLS[field];
    if (!f) {
        f = {};
        // not unexpected, may be colour constant or ???
        // console.error('unexpcted field with no colour in COLS.show()', field);
    }
    let s = [];
    let i = 0;
    for (const k in f) {
        const c = f[k], rgb = `rgb(${c.r*255}, ${c.g*255}, ${c.b*255})`;
        s.push(`<tr><td>${k}</td><td style=" background-color: ${rgb}">&nbsp;&nbsp;&nbsp;&nbsp;</td></tr>`);
        if (i++ > 20) break;
    }
    E.colkey.innerHTML = `<table><tbody><colgroup><col style="max-width: 4em"><col style="width: 2em"></colgroup>${s.join('')}</tbody></table>`;
}

/** set a colour value */
COLS.set = function(f, fixed) {
    if (E.xshaderbox.checked) { // this GUI should be at a different level, outside COLS.
        E.filterbox.value = (E.filterbox.value + `\nMD:${f}`).trim();
        useXShader('MD:');
        return;
    }

    if (E.colourby.value !== f) E.colourby.value = fixed ? 'fixed' : f;
    const ofilt = '\n' + E.filterbox.value + '\n'
    let g = ofilt.match(/^(.*)\nCOL:(.*?)\n(.*)/s);
    if (g)
        E.filterbox.value = `${g[1]}\nCOL:${f}\n${g[3]}`.trim();
    else
        E.filterbox.value = `COL:${f}\n${ofilt}`.trim();
    dataToMarkersGui();
}

addFileTypeHandler('.cols', COLS.reader);
