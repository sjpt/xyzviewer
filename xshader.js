'use strict';
// permit multidimensional input and linear transformation
// also realtime lasso
export {useXShader, modXShader, uniforms, xmat, vmap, settumblerotl, settumblerotr, setmouserot, cols, MM, xclick,
    checklist, usecheck, ND, showxmat, setobj};   // debug

const /** @type any */ WA = window;
const {X, math} = WA;
// const {X} = window;
// import {math} from './jsdeps/math.js';
import {THREE} from "./threeH.js";
import {XYZ, _baseiNaN} from './xyz.js';
import {ggb} from './graphicsboiler.js'; // renderer, controls, plan, orbcamera

// import * as math from 'https://cdnjs.com/libraries/mathjs/math.js';
// import * as math from './jsdeps/math.js';
// import {killev} from './basic.js';
let xmat = undefined;
let me;

class MM {
    constructor() {
        this.m = new Float32Array(ND*ND);
        this.id();
        me = this;
    }

    static tempmm1; static tempmm2; static tempmm3;
    static init() {
        MM.tempmm1 = new MM();
        MM.tempmm2 = new MM();
        MM.tempmm3 = new MM();
    }

    /** set to identity */
    id() {
        this.m.fill(0); 
        for (let i = 0; i < ND; i++) this.m[i * (ND+1)] = 1;
        if (this === xmat) showxmat();
    }

    toString() { return Array.from(this.m).map(x => x.toFixed(3)).join(' '); }

    /** multiply am, bm into me, for now, assume all square ND*ND */
    mult(am,bm) {
        const o = this.m, a = am.m, b = bm.m;
        o.fill(0);
        for (let col = 0; col<ND; col++)
            for (let row = 0; row<ND; row++)
                for (let k = 0; k<ND; k++)      // k spans different columns of a and rows of b
                o[col + row*ND] += a[k + row*ND] * b[col + k*ND];
        return this;
    }

    /* left multiply */
    lmult(am) { return this.mult(am, MM.tempmm1.copy(this)) }

    /* right multiply */
    rmult(bm) { return this.mult(MM.tempmm1.copy(this), bm) }

    /** copy */
    copy(m) { this.m.set(m.m); return this; }

    /** clone this */
    clone() { return new MM().copy(this)}


    /** make a rotation between cols i and j,  */
    makerot(i, j, d) {
        this.id();
        const c = Math.cos(d), s = Math.sin(d);
        const o = this.m;
        o[i*ND+i] = o[j*ND+j] = c;
        o[i*ND+j] = s;
        o[j*ND+i] = -s;
        return this;
    }

    /** apply a rotation to right*/
    applyrotr(i, j, d) {
        this.rmult(MM.tempmm2.makerot(i,j,d));
    }

    /** apply a rotation to left*/
    applyrotl(i, j, d) {
        this.lmult(MM.tempmm2.makerot(i,j,d));
    }
    

    /** random */
    random() {
        const o = this.m;
        for (let i = 0; i<ND; i++)
            for (let j = 0; j<ND; j++)
                o[i*ND + j] = Math.random() * 2 - 1;
        return this;
    }

    /** transpose */
    transpose() {
        MM.tempmm1.copy(this);
        const o = this.m, f = MM.tempmm1.m;
        for (let i = 0; i<ND; i++)
            for (let j = 0; j<ND; j++)
                o[i+ND*j] = f[j+ND*i];
        return this;
    }

    /* interop utilities to use math. functions in our context */
    tomath() {return math.reshape(Array.from(this.m), [ND, ND])};
    frommath(m) {this.m.set(math.reshape(m, [ND*ND])); return this; }

    /** use math library with given op */
    mat(op) {
        const x = this.tomath();
        const y = op(x);
        if (typeof y === 'number') return y;
        return this.frommath(y);
    }

    /** inverse */  inv() { return this.mat(math.inv); }
    /** sqrt */  sqrt() { return this.mat(math.sqrtm); }
    /** determinant */  det() { return this.mat(math.det); }

    scale(k) { this.m.forEach((x,i, t) => t[i] = x*k); return this; }
    add(a, b) { this.m.forEach((x,i, t) => t[i] = a[i] + b[i]); return this; }

    dotrow(r1, r2) {
        const o = this.m;
        let s = 0;
        for (let k = 0; k < ND; k++) s += o[r1*ND + k] * o[r2*ND + k];
        return s;
    }

    /** randomise 'free' elements of a row */
    randrow(row, d = 0.1) {
        const o = this.m;
        for (let col=0; col < ND; col++)
            if (getm(col, row) === undefined) o[row*ND + col] += (Math.random() - 0.5) * d;
    }

    /** get value and index for row, if any */
    vforrow(row) {
        let v;
        for (let col = 0; col < ND; col++ ) {
            if (v = getm(col, row)) return [col, v];
        }
        return undefined;
    }

    /** get value and index for col, if any */
    vforcol(col) {
        let v;
        for (let row = 0; row < ND; row++ ) {
            if (v = getm(col, row)) return [col, v];
        }
        return undefined;
    }
    

    /** move towards orthogonality */
    toOrth(f = 1) {
        console.log('=-=-  before orth', xmat.det());
        const o = this.m;
        o.map((v,i) => o[i] = isNaN(v) ? 0.2 : v > 1 ? 1 : v < -1 ? -1 : v); // brute force NaN etc removal
        this.lastm = o.slice();
        // i normal
        for (let row =0; row < ND; row++) { // of ff) {                 // i is free row
            console.log('???>>', row, this.dotrow(row,row));
            if (this.vforrow(row)) continue;
            let oda = this.dotrow(row,row);
            if (oda < 1e-10) { this.randrow(row); oda = this.dotrow(row,row); }
            let sf = 1 + (1 - Math.sqrt(oda));
            for (let k = 0; k < ND; k++) o[row*ND + k] *= sf;
             console.log('>>>>>', row, oda, this.dotrow(row,row));
        }
        

        for (let rowi =0; rowi < ND; rowi++) // of ff) {                 // i is free row
            for (let rowj = 0; rowj < ND; rowj++)  // j may be free
                console.log('~~~', rowi, rowj, this.dotrow(rowi, rowj))

        // ortho
        for (let rowi =0; rowi < ND; rowi++) { // of ff) {                 // i is free row
            if (this.vforrow(rowi)) continue;
            for (let rowj = 0; rowj < ND; rowj++) {  // j may be free
                if (rowj === rowi) continue;
                if (this.vforrow(rowj)) continue;

                // i orth j
                const ll = Math.sqrt(this.dotrow(rowi,rowi)*this.dotrow(rowj,rowj));
                let dot = this.dotrow(rowi, rowj);
                // if (Math.abs(dot) < 1e-10) {this.randrow(i); dot = this.dotrow(i,j); }

                let osf =  dot * f / ll;
                for (let k = 0; k < ND; k++) {
                    if (getm(k, rowi) === undefined)
                        o[rowi*ND + k] -= osf * o[rowj*ND + k] * 0.2; // (jfree ? 0.5 : 1);
                }
                console.log('>', rowi, rowj, dot/ll, me.dotrow(rowi,rowj));
            }
        }

        if (this.m.filter(x =>isNaN(x)).length) {
            // debugger;
            console.log('>>>> NaN error');
        }
        console.log('=-=-  after orth', xmat.det());

    }

    // get idea of rotation amount from largest non-diagonal element
    rotv() {
        let mx = 0;
        for (let k = 0; k < ND*ND; k++)
            if (k % (ND+1) !== 0)
                mx = Math.max(mx, Math.abs(this.m[k]));
        return mx;
    }

    // /** nearest orthogonal */
    // https://en.wikipedia.org/wiki/Orthogonal_matrix
    // nearestOrthogonal() {
    //     // Q[n+1] = [2M(Q[n] M +  Mtre Q[n])] ** -1
    //     //
    //     // Nn = Qn tr * Qn
    //     // Pn = 1/2 Qn Nn
    //     // Qn1 = 2 Qn + Pn Nn + 3 Pn
    //     let Q = this;
    //     let N = MM.tempmm1;
    //     let P = MM.tempmm2;
    //     let tt = MM.tempmm3;
    //     for (let i=0; i<10; i++) {
    //         N.mult(tt.copy(Q).transpose(), Q);
    //         P.mult(Q, N).scale(0.5);
    //         Q.add = 
    //     }
    // }
}
let ND = 6; // number of dimensions
MM.init();

let uniforms, shader;
let lastid; // id used to force rebuild of shader for experiments
let tumblerotl = 0, tumblerotr = 0;
let mouserot = 0.003;
xmat = new MM();
const lastxmat = new MM();

const checklist = {};   // key is i_j: usual values 1, 0, or -1
let cols;
let vmap = [];
for (let i = 0; i < ND; i++) vmap[i] = new THREE.Vector2(0,1);
let attribs = ''; for (let i = 0; i < ND; i++) attribs += `attribute float field${i};\n`;
let attset = '';  for (let i = 0; i < ND; i++) attset += `rv[${i}] = field${i};\n`;

let tumblem = new MM().random();

// let tempmm1 = new MM(ND), tempmm2 = new MM(ND);
/** apply a right tumble */
function tumbler() {
    const t = tumblem.m;
    for (let coli = 0; coli<ND; coli++) {
        if (me.vforcol(coli)) continue;
        for (let colj = coli+1; colj<ND; colj++) {
            if (me.vforcol(colj)) continue;
            xmat.applyrotr(coli, colj, t[coli*ND+colj]*tumblerotr);
        }
    }
    showxmat();
}
/** apply a left tumble */
function tumblel() {
    const t = tumblem.m;
    for (let rowi = 0; rowi<ND; rowi++) {
        if (me.vforrow(rowi)) continue;
        for (let rowj = rowi+1; rowj<ND; rowj++) {
            if (me.vforrow(rowj)) continue;
            xmat.applyrotl(rowi, rowj, t[rowi*ND+rowj]*tumblerotl);
        }
    }
    showxmat();
}


function settumblerotr(r) { tumblerotr = r; if (r && !cols) useXShader(); }
function settumblerotl(r) { tumblerotl = r; if (r && !cols) useXShader(); }
function setmouserot(r) { mouserot = r; }


/*********** */
function xShader(id=0) {
    lastid = id;
    const vertexShader = /*glsl*/`
/*
precision highp float;
precision highp int;
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat3 normalMatrix;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
*/
attribute vec3 color;
varying vec3 vColor;

uniform float psize;
uniform vec2 size;
uniform sampler2D lassoMap;
uniform mat4 lassoTotmat;
uniform float doLassoFilter;
uniform float doLassoColour;
#define ND ${ND}
uniform float xmat[ND*ND];

${attribs} // attribute float field0; etc
uniform vec2 vmap[ND];
//uniform vec3 lcol[ND];
//uniform vec3 hcol[ND];

void main() {
    vColor = vec3(0); // color;
    // collect input attributes (no attribute arrays)
    float rv[ND];
    ${attset}       // rv[0] = field0; etv

    // normalize as specified in vmap (typically 1.5 sds each side of mean)
    float vv[ND];
    for (int i=0; i<ND; i++) vv[i] = (rv[i] - vmap[i].x) * vmap[i].y;

    // apply matrix transformation to left of column data
    // p.s. ?WHY do graphics conventions work right to left rather than left to right?
    float o[ND];
    for (int row = 0; row < ND; row++) {    // each row of the column data
        float v = 0.;
        for (int k = 0; k < ND; k++)        // k is column of matrix, row of input data
            v += xmat[k + row*ND] * vv[k];
        o[row] = v;
    }

    // use transformed values to set up graphics
    vec3 transformed = vec3( o[0], o[1], o[2]);
    vColor.r += o[3] * 0.5 + 0.5;
    vColor.g += o[4] * 0.5 + 0.5;
    vColor.b += o[5] * 0.5 + 0.5;

    vColor.r += float(${id});  // force recompile if new id

    // lasso
    float v;
    if (size.x > 0.) {
        vec4 sv4 = lassoTotmat * vec4(transformed, 1);
        vec2 sv2 = sv4.xy / sv4.w / size;
        v = texture2D(lassoMap, sv2).x;
    } else {
        v = 1.0;
    }
    

    if (doLassoFilter != 0. && v == 0.) transformed = vec3(1e20);
    vColor *= (1. - doLassoColour + v*doLassoColour);


    vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = psize / - mvPosition.z ;
}
`;

    const fragmentShader = /*glsl*/`
/*
precision highp float;
precision highp int;
*/
varying vec3 vColor;
uniform float gamma;

void main() {
    vec4 diffuseColor = vec4(vColor, 1.);
    gl_FragColor = pow(diffuseColor, vec4(gamma));
}
    `;


    uniforms = {
        gamma: {value: 1},
        lassoMap: { value: undefined },
        lassoTotmat: { value: new THREE.Matrix4() },
        size: { value: new THREE.Vector2(100,100)},
        psize: { value: 1},
        doLassoFilter: { value: 0.0 },
        doLassoColour: { value: 0.0 },

        vmap: { value: vmap},
        xmat: { value: xmat.m}
    }
    
    shader = new THREE.ShaderMaterial(
        {vertexShader, fragmentShader, uniforms}
    );
    shader.name = 'xshader';
    return shader;
}

async function useXShader(/** @type any */ pcols = [],  id, /** @type {XYZ} */ xyz = X.currentXyz) {
    ///** @type {XYZ} */
    //const xyz = X.currentXyz;
    if (pcols === false) return;
    const tdata = xyz.tdata;
    const ranges = tdata.ranges;
    const allnum = []
    for (const r in tdata.ranges) if (ranges[r].numNum === tdata.n) allnum.push(r);
    let nf = 0;
    while (true) {
        pcols = E.filterbox.value.split('\n').filter(x => x.startsWith('MD:')).map(x => x.substring(3).trim());
        if (pcols.length >= ND || nf >= allnum.length) break;
        xyz.setField('MD', allnum[nf++], false);
    }
    for (let i = ND; i < pcols.length; i++) xyz.commentField('MD', pcols[i], false);
    cols = typeof pcols === 'string' ? pcols.split(' ') : pcols;
    const particles = xyz.particles;

    if (cols) {
        ggb().controls.enabled = false;
        ggb().plan();
        ggb().camera.position.z = 3;

        if (!particles.xmaterial) particles.xmaterial = xShader(id);
        particles.material = particles.xmaterial;
        particles.onBeforeRender = () => {
            // handle lasso details every frame, could just do when lasso changes?
            const lasso = xyz.gb.lasso.lassos[0];
            if (lasso) {
                uniforms.lassoMap.value = lasso.mapt;
                uniforms.lassoTotmat.value.copy(lasso.totmat);
                uniforms.size.value.copy(lasso.size);
            } else {
                uniforms.size.value.x = -1;
            }
            if (tumblerotr !== 0) tumbler();
            if (tumblerotl !== 0) tumblel();

            // // move to checklist target
            // const d = 0.01;
            // const o = xmat.m;
            // for (const x in checklist) {
            //     const i = +x[0];
            //     const j = +x[2];
            //     const v = checklist[x];
            //     for (let k = 0; k < ND; k++) {
            //         o[i*ND + k] = +(k === j) * d * v + o[i*ND + k] * (1-d);
            //         o[k*ND + j] = +(k === i) * d * v + o[k*ND + j] * (1-d);
            //     }
            // }
            // xmat.toOrth();
            showxmat();

            particles.geometry.setDrawRange(0, tdata.pendread_min);
        }

        // handle field details on call to usexShader
        // set up attributes and uniforms to control the shader
        for (let i=0; i<ND; i++) {
            const col = cols[i];    // column name
            particles.geometry.deleteAttribute('field' + i);    // ? safe ?, until otherwise proven
            if (col) {
                if (!tdata.ranges[col]) {
                    console.error('Missing column ignored', col);
                    xyz.commentField('MD', col);
                    continue;
                }
                if (tdata.ranges[col].range === 0) {
                    console.error('Column with 0 range ignored', col);
                    xyz.commentField('MD', col);
                    continue;
                }
                const usealpha = tdata.ranges[col].numStrs > tdata.ranges[col].numNum;
                if (!tdata.attcols[col]) {
                    tdata.lazyLoadCol(col);       // don't await, we'll see data as it arrives
                    let fval = tdata.fvals[col];
                    if (usealpha) { // for alpha columns we must generate an integer array from the NaN tags
                        let uval = tdata.uvals[col];
                        const type = tdata.vsetlen[col] <= 255 ? Uint8Array : Uint16Array;
                        const iarr = new type(uval.length);
                        fval = iarr;
                    }
                    tdata.attcols[col] = new THREE.BufferAttribute(fval, 1);
                }                
                particles.geometry.setAttribute('field' + i, tdata.attcols[col]);
                const r = tdata.ranges[col];
                // map to -1..1
                if (usealpha)
                    vmap[i].set(tdata.vsetlen[col]/2, 2/tdata.vsetlen[col]);
                //else if(col === 'x' || col === 'y' || col === 'z') // do not normalize x,y,z, to consider ...
                //    vmap[i].set(0, 1);
                else
                    vmap[i].set(r.mean, 1/(1.5*r.sd));
                // // map to 0..1
                // if (usealpha)
                //     vmap[i].set(0, 1/tdata.name vsetlen[col]);
                // else
                //     vmap[i].set(r.mean - 1.5*r.sd, 1/3/r.sd);
            } else {
                vmap[i].x = 1e40;
            }
        }
        ggb().renderer.domElement.addEventListener('mousedown', mousedown);
    } else {
        particles.material = particles.defaultMaterial;
        particles.onBeforeRender = ()=>{};
        mouseup({buttons:0});
        ggb().renderer.domElement.removeEventListener('mousedown', mousedown);
        ggb().controls.enabled = true;
    }
    E.xshaderbox.checked = !!cols;
    makeshowxmat();
}

async function modXShader(i, col) {
    cols[i] = col;
    useXShader(cols);
}

let lastx = Infinity, lasty;
function mousemove(e) {
    const dx = e.clientX - lastx, dy = e.clientY - lasty;
    lastx = e.clientX; lasty = e.clientY;
    const k = [0, 2, 3, 4, 5, 3, 4, 5];
    const i = k[e.buttons] || 2;        //
    xmat.applyrotr(0, i, dx * mouserot);
    xmat.applyrotr(1, i, -dy * mouserot);
    showxmat();
    // killev(e);
}
function mousedown(e) {
    if (lastx === Infinity) {
        ggb().renderer.domElement.addEventListener('mousemove', mousemove);
        ggb().renderer.domElement.addEventListener('mouseup', mouseup);
    }
    lastx = e.clientX;
    lasty = e.clientY;
}
function mouseup(e) {
    if (e.buttons === 0) {
        ggb().renderer.domElement.removeEventListener('mousemove', mousemove);
        ggb().renderer.domElement.removeEventListener('mouseup', mouseup);
        lastx = Infinity;
    }
}

let makeshowxmatdone = false;
function showxmat() {
    if (!makeshowxmatdone) makeshowxmat();
    const gamma = uniforms.gamma.value;
    for (let row = 0; row < ND; row++) {
        let xr, xg, xb;
        for (let col = 0; col < ND+1; col++) {
            const v = xmat.m[row*ND + col];
            let [r,g,b] = [0,0,0];
            if (col == 3) r = xr = (v+0.1)**gamma * 255;
            else if (col == 4) g = xg = (v+0.1)**gamma * 255;
            else if (col == 5) b = xb = (v+0.1)**gamma * 255;
            else if (col == 6) [r, g, b] = [xr, xg, xb];
            else {
                r = v > 0 ? 0 : -v * 255;
                g = v > 0 ? v*255 : 0;
            }
            E[`xmat${col}_${row}`].style.backgroundColor = `rgb(${r},${g},${b})`;
        }
    }
    E.xmat_det.innerHTML = xmat.det();   
}

const spaces = '&nbsp;&nbsp;&nbsp;&nbsp;'
const sppos = '&nbsp;&nbsp;+&nbsp;'
const spneg = '&nbsp;&nbsp;-&nbsp;'
function makeshowxmat() {
    const tab=['<table>']
    tab.push('<row><th>' + ('x y z r g b rgb '.split(' ').join('</th><th>')) + '</th></row>');
    const gamma = uniforms.gamma.value;
    for (let row = 0; row < ND; row++) {
        const rows = []
        rows.push(`<tr>`);
        for (let col = 0; col < ND+1; col++) {
            rows.push(`<td id="xmat${col}_${row}" onclick="GG.xshader.xclick(${col},${row})"></td>`);
        }
        rows.push(`<td>${cols[row]}</td></tr>`);
        tab.push(rows.join(''));
    }
    tab.push('</table>');
    E.colkey.innerHTML = tab.join('\n') + `<br>det=<span id="xmat_det">?</span>`;
    // E.colkey.blur();
    E.colkey.style.userSelect = 'none';
    makeshowxmatdone = true;
}

/** test if i,j checked */
function getm(col,row) { return checklist[col + '_' + row]; }

/* check or uncheck i,j, and return previous value */
function setm(col, row, checkv) {
    const r = getm(col,row);
    const k = col + '_' + row;
    if (checkv !== undefined) {
        checklist[k] = checkv; 
    } else {
        delete checklist[k];
    }
    E[`xmat${k}`].innerHTML = checkv > 0 ? '+' : checkv < 0 ? '-' :  checkv === 0 ? '.' : '';
    return r;
}

/** impose the checked values on the real matrix xmat, instant */
function usecheck() {
    const d = 0.01;
    const o = xmat.m;
    for (const x in checklist) {
        const col = +x[0];
        const row = +x[2];
        const v = checklist[x];
        o[col + row*ND] = v;
        // for (let k = 0; k < ND; k++) {
        //     // o[i*ND + k] = +(k === j) * d * v + o[i*ND + k] * (1-d);
        //     // o[k*ND + j] = +(k === i) * d * v + o[k*ND + j] * (1-d);
        //     o[row*ND + k] = +(k === col) * v;
        //     o[k*ND + col] = +(k === row) * v;
        // }
    }
    
    // juggle the non-explicit values in the matrix to make it orthonormal
    console.log('=-=-=-before orth', xmat.det());
    for (let i = 0; i < 10; i++) xmat.toOrth();
    console.log('=-=-=-after orth', xmat.det());

    // return r;
}

/** handle a click, 
 * toggle checked and swap pairs if appropriate
 * for non-checked items sort out which are 0 and which are free
 *  */
function xclick(col, row) {
    lastxmat.copy(xmat);
    if (col >= ND) return;      // may use later, or don't add click event in first place
    // console.log('click', i, j);
    const nowchecked = !getm(col, row);
    let orow = -1, ocol = -1, ovrow, ovcol, tv;
    if (nowchecked) {
        for (let k=0; k < ND; k++) {
            if (tv = setm(col,k, undefined)) { orow = k; ovrow = tv; }
            if (tv = setm(k,row, undefined)) { ocol = k; ovcol = tv; }
        }
        // if both orow and ocol set its a swap
        if (orow !== -1 && ocol !== -1) 
            setm(ocol, orow, -ovrow*ovcol);
        // else if (row !== col)
        //     check(col, row, -1);
    }
    setm(col, row, nowchecked ? 1 : undefined);

    // tidy to get the 0's right, assume undefined
    for (let col=0; col < ND; col++) {
    for (let row=0; row < ND; row++) {
        if (!getm(col, row)) setm(col,row, undefined)
    }}

    // but set 0 where needed
    for (let col=0; col < ND; col++) {
    for (let row=0; row < ND; row++) {
        if (getm(col, row)) {
            for (let cc = 0; cc < ND; cc++)
                if (cc !== col) setm(cc, row, 0);
            for (let rr = 0; rr < ND; rr++)
                if (rr !== row) setm(col, rr, 0);
        }
    }}

    usecheck();
}

/** set object as clone of another without losing object */
function setobj(to, from) {
    for (const x in to) delete to[x]; Object.assign(to, from);
}

/*
d=1e-45; xmat.id(); xmat.m[0] = -1; xmat.m[7] = -1; xmat.m[1] = -d; xmat.m[6] = d;
console.time('a'); xx=[]; xx[-1]=new MM().copy(xmat); for (i=0; i<20; i++) xx[i] = new MM().copy(xx[i-1]).sqrt(); console.timeEnd('a'); 
xmat.id(); for (i=0; i<128; i++) { xmat.copy(new MM().mult(xmat, xx[6])); await sleep(30)}

rr = () => Math.floor(Math.random()*ND); 
for (let i=0; i<10; i++) {xclick(rr(), rr()); }
*/