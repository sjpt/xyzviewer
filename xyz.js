'use strict';
window.lastModified.xyz = `Last modified: 2021/02/19 15:00:12
`; console.log('>>>>xyz.js');

// import {ggb} from './graphicsboiler.js'; // addToMain, select, setBackground, setHostDOM, setSize
import {ggb, GraphicsBoiler} from './graphicsboiler.js'; // ggb

//?? import {pdbReader} from './pdbreader.js';
import {sleep} from './basic.js';
import {COLS} from './cols.js';
import {THREE} from "./threeH.js";
import {useXShader} from './xshader.js';        // todo cleanup MD: code
// import {useLassoShader} from './lassoshader.js'

import {TData, _baseiNaN} from './tdata.js';

export {
    setPointSize,
    dataToMarkersGui,
    filtergui, filterAdd, filterRemove,
    // particles, // for subclass pdbreader, and particles for photoshader
    XYZ,
    col3, _baseiNaN,
    centrerange // for draw centre consistency, more global than just xyz
};

const {E, X} = window;
import {addscript, log} from './basic.js';


// ??? to engineer below more cleanly
const setPointSize = (a, b) => { if (X.currentXyz) X.currentXyz.setPointSize(a, b); }
const filtergui = g => { if (X.currentXyz) X.currentXyz.filtergui(g); }
const dataToMarkersGui = (type, popping) => { if (X.currentXyz) X.currentXyz.dataToMarkersGui(type, popping); }
const centrerange = new THREE.Vector3(Infinity);  // ranges for external use
const badfun = () => -9999;

var usePhotoShader;

class XYZ {

static baseguiset = {spotsize: 0.2, colourby: 'fixed', colourpick: '#ffffff', filterbox: ''};

/**
 * @param {any} pdata
 * @param {string} fid
 * @param {boolean} [owngb]
 */
constructor(pdata, fid, owngb) {
    X.currentXyz = X.currentThreeObj = this.xyz = this;

    const tdata = this.tdata = TData.get(pdata, fid, this);
    /** @type {GraphicsBoiler} */ this.gb = owngb ? new GraphicsBoiler() : ggb();
    this._col = new THREE.Color(1,1,1);
    this._col1 = new THREE.Color(1,1,1);
    this._ret = new Float32Array(6);        // used for return from filter function
    // this._ccr = {_col: this._col, _col1: this._col1, _ret: this._ret};  //fixed structure for optimized call to fiterfun
    this._ids = undefined;    // ids for crossfilter
    this.fields = {};
    this._onFilter = undefined;
    this._inDataToMarkers = 0;
    this._dataToMarkersQ = [];
    this.fid = fid;
    this.makechainlines = undefined;
    this.guiset = XYZ.baseguiset;
    this.guiset.filterbox = applyurl();
    // this.headerSetup(); // too soon for MLV

    // catch our filter events from lasso and pass them on if wanted
    const me = this;
    window.addEventListener('lassoUp', async function() {
        if (me._onFilter) {
            const ids = await me.getCallbacks();
            me._onFilter(ids);
        }
    });
    
    // make sure control= values in URL get respected (after csvReader in case yamlReader has other ideas)
    // #### need to check if this is right place
    if (Object.keys(tdata.xyzs).length === 0)
        this.guiset.filterbox = E.filterbox.value;
    
    // colourby is dropdown, colourpick is colour picker
    this.gb.select(fid, this);

    // tdata.lazyLoadCol(this.getField('X'));
    // tdata.lazyLoadCol(this.getField('Y'));
    // tdata.lazyLoadCol(this.getField('Z'));

    if (pdata)
        this.finalize(fid); // #### check when to do this

    if (XYZ.constructorDone) XYZ.constructorDone(this);

    // make sure all spotsize elements ready for appropriate events
    // NOT probably the best place
    document.getElementsByName('spotsize').forEach(e => {
        e.onmouseenter = (e) => setPointSize(e, 'in'); 
        e.onmouseleave = (e) => setPointSize(e, 'out'); 
        e.onclick = setPointSize;
    });


} // XYZ constructor

static autorange = true;

static constructorDone = undefined;

/**
 * Once data understood, prepare graphics and display
 * (maybe incrementally as real data is loaded)
 * @param {string} fid 
 */
finalize(fid) {
    if (this.tdata.header) this.headerSetup(); // ####????

    this.setupGraphics(fid);
    this.gb.select(fid, this);
    this.watchload(); // #### check when to do this
    // this.filtergui({keyCode: 13});    // display as markers
}

/**
 * load data based on gui values
 * @param {string | undefined} type 
 * @param {boolean} popping 
 */
dataToMarkersGui(type = undefined, popping = false) {
    this.group.remove(this.lines);  // may be overridden for default shader
    this.group.add(this.particles);
    if (E.xshaderbox.checked) { useXShader('MD:'); return; }
    // if (E.lassoshaderbox.checked) { useLassoShader(true, undefined, this); return; } // no, this does need CPU position etc

    if (!this.def) this.headerSetup();
    
    if (X.currentThreeObj.xyz) {
        if (type) E.colourby.value = type;
        if (!this.guiset) this.guiset = XYZ.baseguiset;   // in case of pdbreader ... todo proper subclass
        Object.assign(this.guiset, {colourby: E.colourby.value, filterbox: E.filterbox.value, colourpick: E.colourpick.value});
        if (this.makechainlines)
            this.makechainlines(E.filterbox.value);
        return this.dataToMarkers(E.filterbox.value, popping)
    } else if (X.currentThreeObj.material ) {
        X.currentThreeObj.material.color.set(E.colourpick.value);
    }
}

/**
     * filter ids, those not in list will not be displayed
     * @param {{}} ids
     */
filter(ids) {
    console.log('filter #', Object.keys(ids).length);
    this._ids = ids;
    this.dataToMarkersGui();
}

/**
     * hide ids, those not in list will not be displayed
     * @param {{}} ids
     */
hide(ids) {
    console.log('hide #', Object.keys(ids).length);
    this._ids = ids;
    this.dataToMarkersGui();
}

/**
     * set up callback on our filter change
     * @param {any} f
     */
onFilter(f) { this._onFilter = f; }

/**
 * draw the data according to the filter rules
 * dataToMarkers must be queued as it is async
 * in particular, we want to make sure filter canclulation is complete before it is used.
 * 
 * @param {string} pfilterfun 
 * @param {boolean} popping 
 * @param {*} cbs 
 */
async dataToMarkers(pfilterfun, popping, cbs) {
    this._dataToMarkersQ.push({pfilterfun, popping, cbs})
    // console.error('attempt to reenter dataToMarkers')
    if (this._inDataToMarkers) return;

    this._inDataToMarkers++;
    try {
        while (true) {
            const s = this._dataToMarkersQ.shift();
            if (!s) break;
            ({pfilterfun, popping, cbs} = s);
            await this._dataToMarkers(pfilterfun, popping, cbs);
        }
    } finally {
        this._inDataToMarkers--;
    }
}

/** experimental fast simplified version of _dataToMarkers;
 * invoked if the filter starts with  //fast
 * 
 * partly used as experiment towards doing core work in Rust
 * actually the simplified cases are probably much more efficiently handled by shader implementation anyway?
 * n.b. does not work on character heavy columns
 */
async _dataToMarkersFast() {
    const st = performance.now();
    const tdata = this.tdata;

    let vert = this._svert;
    let col = this._scol;
    let ii = 0;
    const xf = this.getField('X'), yf = this.getField('Y'), zf = this.getField('Z'), cf = this.getField('COL');
    tdata.lazyLoadCol(xf);
    tdata.lazyLoadCol(yf);
    tdata.lazyLoadCol(zf);
    tdata.lazyLoadCol(cf);

    const xc = tdata.namecols[xf];
    const yc = tdata.namecols[yf];
    const zc = tdata.namecols[zf];
    const cc = tdata.namecols[cf];
    if (!xc || !yc || !zc || !cc) {
        throw new Error(`at least one value not a valid column in _dataToMarkersFast, ${xf}, ${yf}, ${zf}, ${cf}`)
    }
    // >>> todo check here for charer heavy columns, this only works on number columns
    
    const sds = 1.5;
    const r = tdata.ranges;
    // x,y,z to range -1..1, col to range 0..1
    const xd = r[xf].mean, xs = 1 / (r[xf].sd * sds);
    const yd = r[yf].mean, ys = 1 / (r[yf].sd * sds);
    const zd = r[zf].mean, zs = 1 / (r[zf].sd * sds);
    const cd = r[cf].mean - r[cf].sd * sds, cs = 1 / (r[cf].sd * sds * 2);

    tdata.showpendread();
    const l = tdata.pendread_min;
    for (let i = 0; i < l; i ++ ) {
        const c =  (cc[i] - cd) * cs;
        vert[ii] = (xc[i] - xd) * xs;
        col[ii++] = c;
        vert[ii] = (yc[i] - yd) * ys;
        col[ii++] = 1-c;
        vert[ii] = (zc[i] - zd) * zs;
        col[ii++] = 1-c;
    }
    const dt = performance.now() - st;
    E.filtcount.innerHTML = `fast filter applied: #points=${l} of ${tdata.n}, time: ${dt}ms`;
    log(E.filtcount.innerHTML);
    E.filterbox.classList = ['_fast'];
    this.usevertcol(l, false);
}


/** load the data with given filter and colour functions if required, and display as markers */
/**
 * 
 * @param {string} pfilterfun 
 * @param {boolean} popping 
 * @param {[any]} cbs ?? 
 */
async _dataToMarkers(pfilterfun = E.filterbox.value, popping, cbs) {
    if (!this.particles) this.setupGraphics(this.fid);  // for call from pdbReader
    const tdata = this.tdata;
    const l = tdata.n; // xc.length;
    let vert = this._svert;
    let col = this._scol;
    const _namecols = tdata.namecols;
    
    if (pfilterfun.startsWith('//fast')) return this._dataToMarkersFast();
    const st = performance.now();
    const xc = _namecols[this.getField('X')];
    const yc = _namecols[this.getField('Y')];
    const zc = _namecols[this.getField('Z')];
   
    const filterfun = await this.makefilterfun(pfilterfun, E.filterbox, 'force');
    tdata.showpendread();
    if (filterfun === badfun) return;
    let ii = 0;
    let noxyz = 0;
    let lines = false;
    const me = this;
    const q = this._ret;
    const c = this._col; 
    const c1 = this._col1;
    const did = _namecols.id;
    for (let i = 0; i < tdata.pendread_min; i ++ ) {
        if (me._ids !== undefined && !me._ids[did[i]]) continue;  // handle incoming crossfilter
        q[0] = q[3] = NaN;
        c.setRGB(0.3, 0.3, 0.3);
        if (filterfun) {
            c1.setRGB(undefined, undefined, undefined);
            const df = filterfun(this/*. _ccr*/, i, _namecols);
            if (typeof df !== 'object') continue;
            // [q[0], q[1], q[2]] = df;
        } else {
            q[0] = xc[i]; q[1] = yc[i]; q[2] = zc[i];
        }
        if (isNaN(q[0])) { //  === undefined || q[1] === undefined || q[2] === undefined) {
            noxyz++;
        } else {            
            if (cbs) {
                cbs[did[i]] = true;     // outgoing crossfilter
            } else {
                vert[ii] = q[0];
                col[ii++] = c.r;
                vert[ii] = q[1];
                col[ii++] = c.g;
                vert[ii] = q[2];
                col[ii++] = c.b;
                if (!isNaN(q[3])) {
                    lines = true;
                    const cx = c1.r === undefined ? c : c1;
                    vert[ii] = q[3];
                    col[ii++] = cx.r;
                    vert[ii] = q[4];
                    col[ii++] = cx.g;
                    vert[ii] = q[5];
                    col[ii++] = cx.b;   
                }
            }
        }
    }
    const dt = Math.round(performance.now() - st);

    if (cbs) return;
    const ll = ii/(lines ? 6 : 3);
    if (noxyz) console.log('ddata/filter failed to give xyz for', noxyz, 'elements');
    this.usevertcol(ll, lines);

    let ok = true;
    if (filterfun) {
        if (lines)
            E.filtcount.innerHTML = `filter applied: #lines=${ll} of ${l}, time: ${dt}ms`;
        else
            E.filtcount.innerHTML = `filter applied: #points=${ll} of ${l}, time: ${dt}ms`;
    } else if (pfilterfun) {
        E.filtcount.innerHTML = `bad filter not applied`;        // already been marked as error                  
        ok = false;
    } else {
        E.filtcount.innerHTML = `no filter applied: #points=${l} , time: ${dt}ms`;
    }
    log(E.filtcount.innerHTML);
    if (ok && !popping) {
        let ll = location.href.split('&control=')[0];
        if (ll.indexOf('?') === -1) ll += '?';
        if (pfilterfun)
            ll += '&control=' + pfilterfun.split('\n').join('!!!');
        if (ll !== location.href)
            history.pushState({}, undefined, ll)
    }
    await this.makefilterfun(pfilterfun, E.filterbox, 'confirm');                 // get gui display right
}

/** once vert and col are computed, use them to populate the graphics
     * @param {number} ll
     * @param {boolean} lines
     */
usevertcol(ll, lines) {
    const geometry = this.geometry;

    if (ll === 0) {console.log('ddata/filter failed to give any xyz'); }
    const verta = this._verta;
    const cola = this._cola;
    verta.needsUpdate = cola.needsUpdate = true;
    geometry.setDrawRange(0, ll);

    if (lines) {
        this.group.remove(this.particles);
        this.group.add(this.lines);
    } else {
        this.group.remove(this.lines);
        this.group.add(this.particles);
    }
}

/** make a function for a filter (also colouring etc)
 * If the value is a string it is converted to a function
 * Flags any failure in E.filterr.innerHTML and returns undefined
 * mode may be 'force' to force recompilation (eg after new colour file loaded), 
 * or 'confirm' to confirm this filter has been applied
 * 
 * Filter understands special cases of X,Y,Z and COL
 * X,Y,Z refer to q[0],q[1],q[2] are local variables in the filter
 * 
 * COL: refers to xyz._col, a prepared THREE.Colour() object . _C also used
 * This is set to a default before executing the filter
 * and may be set (eg _C.setRGB(1,0,0), or even RGB(1,0,0)) during execution of the filter
 * Handling colour this way 
 *  * reduces the need for generating new color object for each filter execution
 *  * reduces the risk of overriding contributing COLS object in complex filters
 * 
 */
/**
 * 
 * @param {string} filtin 
 * @param {*} box 
 * @param {string} mode 
 */
async makefilterfun(filtin, box, mode='') {
    const tdata = this.tdata;
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
        filt = '//';  // phasing out special code for empty filter, which didn't allow for scale
        //msg('empty filter, ctrl-enter to apply', '_empty');
        //return undefined;
    }
    let filterfun;
    if (typeof filt === 'function')
        filterfun = filt;
    else if (typeof filt === 'string') {
        try {
            if (!filt.match(/^Z:/m)) filt = `Z:${this.getField('Z')}\n${filt}`;
            if (!filt.match(/^Y:/m)) filt = `Y:${this.getField('Y')}\n${filt}`;
            if (!filt.match(/^X:/m)) filt = `X:${this.getField('X')}\n${filt}`;
        
            
            for (let fn of tdata.header) { // find used fields and assign (saves risk of accidental override of d.<fn>)
                
                // these do over-global automatic choice, upset COL:
                //const usealpha = this.namecolnstrs[fn] > this.namecolnnum[fn];
                //let use = usealpha ? '_EN' : XYZ.autorange ? '_N' : '_R';
                //filt = filt.replace( new RegExp('\\b(' + fn + ')\\b', 'g'), fn + use);

                const sds = 1.5;
                // const r = this.ranges[fn], l = r.mean - sds * r.sd, ss = 1 / (2 * sds * r.sd);
                // range to -1..1
                const r = tdata.ranges[fn], l = r.mean, ss = 1 / (sds * r.sd);
                
                
                if (filt.match( new RegExp('\\b' + fn + '\\b', 'g'))) {
                    const usealpha = tdata.namecolnstrs[fn] > tdata.namecolnnum[fn];
                    // let fun = usealpha ? 'valEN' : XYZ.autorange ? 'valN' : 'val';
                    // filt = `const ${fn} = xyz.${fun}('${fn}', i);\n${filt}`;
                    if (usealpha)
                        filt = `const ${fn} = xyz.tdata.valEN('${fn}', i);\n${filt}`;
                    else if (XYZ.autorange)
                        filt = `const ${fn} = (_namecols['${fn}'][i] - ${l}) * ${ss};\n${filt}`;
                    else
                        filt = `const ${fn} = _namecols['${fn}'][i];\n${filt}`;

                    tdata.lazyLoadCol(fn);
                }

                if (filt.match( new RegExp('\\b' + fn + '_R\\b', 'g'))) {
                    filt = `const ${fn}_R = xyz.tdata.val('${fn}', i, 1.5);\n${filt}`;
                    tdata.lazyLoadCol(fn);
                }
                if (filt.match( new RegExp('\\b' + fn + '_C\\b', 'g'))) {
                    filt = `const ${fn}_C = xyz.tdata.valC('${fn}', i, 1.5);\n${filt}`;
                    tdata.lazyLoadCol(fn);
                }
                if (filt.match( new RegExp('\\b' + fn + '_N\\b', 'g'))) {
//                    filt = `const ${fn}_N = xyz.tdata.valN('${fn}', i, 1.5);\n${filt}`;
                    filt = `const ${fn}_N = (_namecols['${fn}'][i] - ${l}) * ${ss};\n${filt}`;
                    tdata.lazyLoadCol(fn);
                }
                if (filt.match( new RegExp('\\b' + fn + '_E\\b', 'g'))) {
                    filt = `const ${fn}_E = xyz.tdata.valE('${fn}', i);\n${filt}`;
                    await tdata.lazyLoadCol(fn);
                }
                if (filt.match( new RegExp('\\b' + fn + '_EN\\b', 'g'))) {
                    filt = `const ${fn}_EN = xyz.tdata.valEN('${fn}', i);\n${filt}`;
                    await tdata.lazyLoadCol(fn);
                }
            }

            filt = filt.replace(/\bVX\((.*?)\)/g, "{const k = $1; _R*=k; _G*=k; _B*=k;}");            
            filt = filt.replace(/\bRGB\(/g, "_C.setRGB(");
            filt = filt.replace(/\b_R\b/g, "_C.r");
            filt = filt.replace(/\b_G\b/g, "_C.g");
            filt = filt.replace(/\b_B\b/g, "_C.b");
            // RGB(cd3, cd4, cd16)

            // apply after VX() etc to reduce wrong bracketing risk
            filt = filt.replace(/\b_L\b/g, 'xyz._lasso(q[0],q[1],q[2])');
            filt.replace(/\b_L([0-9])\b/g, 'xyz._lasso(q[0],q[1],q[2],$1)')
            // if (filt.match(/\b_L[0-9]\b/)) {
            //     for (let i=0; i<=9; i++)
            //         if (filt.match(new RegExp('\\b_L' + i + '\\b', 'g'))) filt = `const _L${i} = xyz._lasso(x,y,z, ${i})\n${filt}`
            // }
            

            filt = filt.split('\n').map(l => {
                if (l[0] === '?') return `if (!(${l.substring(1)})) return;`;
                const [k, _ll] = l.split(':');
                if (_ll === undefined) return l;
                const ll = _ll.trim();
                let done = true;
                switch (k) {
                    case 'COL': l = COLS.gencol('_C', tdata, ll); break;
                    case 'COL1': l = COLS.gencol('_C1',tdata, ll); break;
                    case 'MD': l = '// ' + l; break;
                    case 'COLX': l = '_C.set(' + ll + ')'; break;
                    case 'COLX1': l = '_C1.set(' + ll + ')'; break;
                    case 'X': l = `q[0] = ${ll}`; break;
                    case 'Y': l = `q[1] = ${ll}`; break;
                    case 'Z': l = `q[2] = ${ll}`; break;
                    case 'X1': l = `q[3] = ${ll}`; break;
                    case 'Y1': l = `q[4] = ${ll}`; break;
                    case 'Z1': l = `q[5] = ${ll}`; break;
                    case 'R': l = `_C.r = ${ll}`; break;
                    case 'G': l = `_C.g = ${ll}`; break;
                    case 'B': l = `_C.b = ${ll}`; break;
                    case 'R1': l = `_C1.r = ${ll}`; break;
                    case 'G1': l = `_C1.g = ${ll}`; break;
                    case 'B1': l = `_C1.b = ${ll}`; break;
                    default: done = false;
                }
                if (done) this.setField(k, ll, false);
                return l;
            }).join('\n');


            // generate filter
            // if (filt.indexOf('return') === -1) filt = 'return (' + filt + ')';
            filt += `\nreturn q;`        // note, xyz. _col === _C is implicit output
            
            // todo: make special case filters for pure number/pure alpha columns???
            filt = `"use strict";
            const q = xyz._ret;
            var _C = xyz._col, _C1 = xyz._col1;
            ` + filt;
            if (this.lastCodeGenerated === filt) {
                filterfun = this.lastFunction;
            } else {
                this.lastCodeGenerated = filt;

                this.lastFunction = undefined;
                filterfun = new Function('xyz', 'i', '_namecols', filt);
                console.log('filtfun function rebuilt');
                this.lastFunction = filterfun;
            }
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
        const r = filterfun(this/*. _ccr*/, 0, tdata.namecols);
    } catch(e) {
        msg('function throws exception: ' + e.message, '_exception');
        return badfun;
    }
    msg('OK: ctrl-enter to apply filter', '_OK');
    return filterfun;
}


// code below enables hover to perform temporary spotsize change

/** set/get the spotsize. input may be size or may be event from spotsize gui
TODO, allow for number of pixels so value has similar effect on different devices */
setPointSize(eventsize, temp='') {
    let size = eventsize.srcElement ? +eventsize.srcElement.id.substring(4) : +eventsize;
    if (temp === 'out') size = this.permspotsize || this.guiset.spotsize;
    if (temp === 'in' && size*size * this.tdata.n > 400000) return;  // don't do overexpensive hover, could give feedback?
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
        if (evt.keyCode === 13 && evt.ctrlKey) {
            this.dataToMarkersGui();
        }
    } catch (e) {
        box.style.background='#ffffd0';
        filterr.innerHTML = e.message;
    }
}

/**
 * set up the graphics for this XYZ view.
 * @param {string} fid 
 */
setupGraphics(fid) {
    if (this.material) return;
    // options for sprite1:
    // 1: load as image defined in html, will not work for file: from chrome unless you set the flag --allow-file-access-from-files will do it but inconvenient
    // 2: load as image using textureLoader, will not work for file: from chrome as for 1
    // 3: load from base4, seems to work always, but not very convenient
    // 4: leave undefined, we see squares of approriate size on screen
    let sprite;
    if (location.href.startsWith('file:') || location.host.startsWith('combinatronics.com')
        || location.host.startsWith('mlv.') || location.href.indexOf('CIV') !== -1 || navigator.userAgent.indexOf("Edge") > -1) {
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
    
    // to handle lines and points we prepare for both
    // and create a group which will hold whichever is valid at a particular time
    X.currentThreeObj = this.group = new THREE.Group(); this.group.name = fid + 'group'; this.group.xyz = this;
    const size = 0.3;
    this.material = new THREE.PointsMaterial( { size: size, map: sprite, /** blending: THREE.AdditiveBlending, **/ 
        depthTest: true, transparent : true, alphaTest: 0.3, vertexColors: true } );
    this.defaultMaterial = this.material;
    this.lassoMaterial = undefined;
    this.XMaterial = undefined;
    this.linematerial = new THREE.LineBasicMaterial( { depthTest: true, transparent : true, alphaTest: 0.3, vertexColors: true } );
    this.geometry = new THREE.BufferGeometry();
    this.particles = new THREE.Points(this.geometry, this.material);
    this.particles.frustumCulled = false;
    this.particles.xyz = this;
    this.lines = new THREE.LineSegments(this.geometry, this.linematerial);
    this.lines.frustumCulled = false;
    this.lines.xyz = this;
    this.gb.addToMain( this.group, fid, undefined, this );

    let l = this.tdata.n;
    let vert = this._svert = new Float32Array(l*3); // <<< allow for lines ???
    let col = this._scol = new Float32Array(l*3);

    // owing to stupidities in three.js we need a position attribute even for shaders that don't use it
    // so just set up these now
    const verta = this._verta = new THREE.BufferAttribute(vert, 3);
    const cola = this._cola = new THREE.BufferAttribute(col, 3);
    verta.needsUpdate = cola.needsUpdate = true;
    this.geometry.setAttribute('position', verta);
    this.geometry.setAttribute('color', cola);

    // xyzs[this.name] = this;
} // setup

/** lasso value, can be used for filter or color */
_lasso(x,y,z,id) {
    return this.gb.lasso.lassoGet(x,y,z,id);
}

/** get ids from lasso for callback */
async getCallbacks() {
    const cbs = {};
    const f = `
X:${this.getField('X')}
Y:${this.getField('Y')}
Z:${this.getField('Z')}
if (!xyz._lasso(q[0], q[1], q[2])) return;
`
    await this.dataToMarkers(f, undefined, cbs);
    console.log('filtered OK ', Object.keys(cbs).length);
    // this.dataToMarkers();
    return cbs;
}

/**
     * set the field to use for a particular role
     * TODO, handle ranges, _N, etc
     * @param {string} fieldRole
     * @param {string} fieldName
     * @param {boolean} update
     */
    setField(fieldRole, fieldName, update=true) {
        fieldName = fieldName.trim();
        if (this.fields[fieldRole] === fieldName) return;
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
    
    /**
         * @param {string} fieldRole
         * @returns {any}
         */
    getField(fieldRole) {
        const f = this.fields[fieldRole];
        if (f) return f.trim(); // .replace('_ N', '');
        const filt = new RegExp(`${fieldRole}:(.*)`);
        const m = E.filterbox.value.match(filt);
        if (m) return m[1].trim(); // .replace('_ N', '');
        
        const v =this.def[fieldRole];
        E.filterbox.value = `${E.filterbox.value}\n${fieldRole}:${v}`;
        return v;
    }
    
    setColor(fieldName, details) { this.setField('COL', fieldName); }
    
    /** delegate various functions to (single for now) graphicsBoider/renderer */
    setBackground(r = 0, g = r, b = r, alpha = 1) { this.gb.setBackground(r, g, b, alpha); }
    setHostDOM(host) {  
        host.appendChild(this.gb.renderer.domElement);
        const gb = this.gb;
        const renderer = gb.renderer;
        host.addEventListener('resize', gb.onWindowResize);
        gb.onWindowResize();
        renderer.domElement.style.zIndex = 999;
        renderer.domElement.style.position = 'relative';
        // give access to our GUI, toggled by double-click on our canvas
        renderer.domElement.ondblclick = () => E.xyzviewergui.style.display = E.xyzviewergui.style.display ? '' : 'none';
    
    }
    getHostDOM() { return this.gb.renderer.domElement.parentElement; }
    
    setSize(x, y) { this.gb.setSize(x, y); }

    /** generate colourby and initial filter*/
headerSetup() {
    const tdata = this.tdata;
    this.def = {};
    this.def.X = tdata.header.includes('x') ? 'x' : tdata.header[0];
    this.def.Y = tdata.header.includes('y') ? 'y' : tdata.header[1];
    this.def.Z = tdata.header.includes('z') ? 'z' : tdata.header[2];
    this.setField('X', this.getField('X'), false);
    this.setField('Y', this.getField('Y'), false);
    this.setField('Z', this.getField('Z'), false);

    const s = [`<option value="fixed">fixed</option>`];
    s.push(`<option value="random">random</option>`);
    for (const name of tdata.header)
        s.push(`<option value="${name}">${name}</option>`);
    E.colourby.innerHTML = s.join('');
}

async watchload() {
    // watch while they load, 
    // and update the graphics every now and then
    // when this.pendread_min === tdata.n they are all fully loaded
    const tdata = this.tdata;
    while (!tdata.header) {await sleep(10);}  // eg from MLV
    for (let i=0; i<100; i++) {
        // tdata.showpendread(); // done better in dataToMarkersGui()
        await dataToMarkersGui();
        log('pending', i, tdata.pendread_min, tdata.n);
        if (tdata.pendread_min === tdata.n) break;
        await sleep(500);
    }
    this.gb.select(tdata.bfid, this);
}

useJson(j) {return this.tdata.useJson(j); }
   

} // class XYZ


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
    return con.split('!!!').join('\n');
    // E.filterbox.value = con.split('!!!').join('\n');
    // dataToMarkersGui(undefined, true);
}

//const sv3 = new THREE.Vector3();

/** convenience function for rgb colour */
function col3(r, g=r, b=g) { return new THREE.Color().setRGB(r, g, b); }
// // eslint-disable-next-line no-unused-vars
// function hsv(h, s, v) { return new THREE.Color().setHSV(h, s, v); }
