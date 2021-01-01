'use strict';
// permit multidimensional input and linear transformation
// also realtime lasso
export {useXShader, uniforms, xmat, vmap, settubmlerot, setmouserot, cols, MM};

const {X} = window;
import {THREE} from "./threeH.js";
import {lassos} from "./lasso.js";
import {_baseiNaN} from './xyz.js';
import {renderer, controls, plan, orbcamera} from './graphicsboiler.js';
// import {killev} from './basic.js';
let xmat = undefined;

class MM {
    constructor() {
        this.m = new Float32Array(ND*ND);
        this.id();
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

    /** multiply am, bm into me, for now, asume all square ND*ND */
    mult(am,bm) {
        const o = this.m, a = am.m, b = bm.m;
        o.fill(0);
        for (let i = 0; i<ND; i++)
            for (let j = 0; j<ND; j++)
                for (let k = 0; k<ND; k++)
                    o[i*ND+k] += a[i*ND+j] * b[j*ND+k];
        return this;
    }

    /** copy */
    copy(m) { this.m.set(m.m); return this; }

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

    /** apply a rotation */
    applyrot(i, j, d) {
        MM.tempmm1.mult(MM.tempmm2.makerot(i,j,d), this);
        this.copy(MM.tempmm1);
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

    scale(k) { this.m.forEach((x,i, t) => t[i] = x*k); return this; }
    add(a, b) { this.m.forEach((x,i, t) => t[i] = a[i] + b[i]); return this; }

    dota(i, j) {
        const o = this.m;
        let s = 0;
        for (let k = 0; k < ND; k++) s += o[i*ND + k] * o[j*ND + k];
        return s;
    }

    /** move towards orthogonality */
    toOrth(f = 0.05) {
        const o = this.m;
        const i = Math.floor(Math.random() * ND);
        let j = Math.floor(Math.random() * (ND-1));
        if (j >= i) j++;

        // i orth j
        let sf = this.dota(i, j) * f * 0.5;
        for (let k = 0; k < ND; k++) {
            o[i*ND + k] -= sf * o[j*ND + k];
            o[j*ND + k] -= sf * o[i*ND + k];
        }

        // i normal
        sf = 1 + (1 - Math.sqrt(this.dota(i,i))) * f;
        for (let k = 0; k < ND; k++) o[i*ND + k] *= sf;
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
let tumblerot = 0;
let mouserot = 0.003;
xmat = new MM();
let cols;
let vmap = [];
for (let i = 0; i < ND; i++) vmap[i] = new THREE.Vector2(0,1);
let attribs = ''; for (let i = 0; i < ND; i++) attribs += `attribute float field${i};\n`;
let attset = '';  for (let i = 0; i < ND; i++) attset += `rv[${i}] = field${i};\n`;

let tumblem = new MM().random();
// let tempmm1 = new MM(ND), tempmm2 = new MM(ND);
/** apply a tumble */
function tumble() {
    const t = tumblem.m;
    for (let i = 0; i<ND; i++) {
        for (let j = i+1; j<ND; j++) {
            xmat.applyrot(i, j, t[i*ND+j]*tumblerot);
        }
    }
    showxmat();
}
function settubmlerot(r) { tumblerot = r; if (r && !cols) useXShader(); }
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

    // apply matrix transformation
    float o[ND];
    for (int i=0; i<ND; i++) o[i] = 0.;
    for (int i=0; i<ND; i++) for (int j=0; j<ND; j++)
        o[i] += vv[j] * xmat[ND*i + j];

    // use transformed values to set up graphics
    vec3 transformed = vec3( o[0], o[1], o[2]);
    vColor.r += o[3] * 0.5 + 0.5;
    vColor.g += o[4] * 0.5 + 0.5;
    vColor.b += o[5] * 0.5 + 0.5;

    vColor.x += float(${id});  // force recompile if new id

    // lasso, find lasso value and use for filter or colouring
    vec4 sv4 = lassoTotmat * vec4(transformed, 1);
    vec2 sv2 = sv4.xy / sv4.w / size;
    float v = texture2D(lassoMap, sv2).x;

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
        gamma: {value: 0.25},
        lassoMap: { value: undefined },
        lassoTotmat: { value: new THREE.Matrix4() },
        size: { value: new THREE.Vector2(100,100)},
        psize: { value: 1},
        doLassoFilter: { value: 0.0 },
        doLassoColour: { value: 0.9 },

        vmap: { value: vmap},
        xmat: { value: xmat.m}
    }
    
    shader = new THREE.ShaderMaterial(
        {vertexShader, fragmentShader, uniforms}
    );
    return shader;
}

let noxmaterial, xmaterial;
async function useXShader(pcols, id) {
    if (pcols === true || pcols === undefined) pcols = 'combat_sampleid cd3 cd4 hla_dr broad ir191di';
    cols = typeof pcols === 'string' ? pcols.split(' ') : pcols;
    const xyz = X.currentXyz;
    const particles = xyz.particles;
    if (!noxmaterial) noxmaterial = particles.material;
    if (lastid !== id) particles.material = xmaterial = xShader(id);

    if (cols) {
        particles.material = xmaterial = xmaterial || xShader(id);  // cache and set lasso material
        particles.onBeforeRender = () => {
            // handle lasso details every frame, could just do when lasso changes?
            const lasso = lassos[lassos.length - 1];
            if (lasso) {
                uniforms.lassoMap.value = lasso.mapt;
                uniforms.lassoTotmat.value.copy(lasso.lassoTotmat);
                uniforms.size.value.copy(lasso.size);
            }
            if (tumblerot !== 0) tumble();
        }

        // handle field details on call to usexShader
        // set up attributes and uniforms to control the shader
        for (let i=0; i<ND; i++) {
            const col = cols[i];    // column name
            if (col) {
                const usealpha = xyz.namecolnstrs[col] > xyz.namecolnnum[col];
                if (!xyz.nameattcols[col]) {
                    await xyz.lazyLoadCol(col);
                    let namecol = xyz.namecols[col];
                    if (usealpha) { // for alpha columns we must generate an integer array from the NaN tags
                        let namevcol = xyz.namevcols[col];
                        const type = xyz.namevsetlen[col] <= 255 ? Uint8Array : Uint16Array;
                        const iarr = new type(namevcol.length);   // could usually use Uint8Array
                        iarr.forEach((v,n) => iarr[n] = namevcol[n] - _baseiNaN);
                        namecol = iarr;
                    }
                    xyz.nameattcols[col] = new THREE.BufferAttribute(namecol, 1);
                }                
                particles.geometry.setAttribute('field' + i, xyz.nameattcols[col]);
                const r = xyz.ranges[col];
                // map to -1..1
                if (usealpha)
                    vmap[i].set(xyz.namevsetlen[col]/2, 2/xyz.namevsetlen[col]);
                //else if(col === 'x' || col === 'y' || col === 'z') // do not normalize x,y,z, to consider ...
                //    vmap[i].set(0, 1);
                else
                    vmap[i].set(r.mean, 1/(1.5*r.sd));
                // // map to 0..1
                // if (usealpha)
                //     vmap[i].set(0, 1/xyz.namevsetlen[col]);
                // else
                //     vmap[i].set(r.mean - 1.5*r.sd, 1/3/r.sd);
            } else {
                vmap[i].x = 1e40;
            }
        }
        renderer.domElement.addEventListener('mousedown', mousedown);
        controls.enabled = false;
        plan();
        orbcamera.position.z = 3;
    } else {
        particles.material = noxmaterial;
        particles.onBeforeRender = ()=>{};
        mouseup({buttons:0});
        renderer.domElement.removeEventListener('mousedown', mousedown);
        controls.enabled = true;
    }
}

let lastx = Infinity, lasty;
function mousemove(e) {
    const dx = e.clientX - lastx, dy = e.clientY - lasty;
    lastx = e.clientX; lasty = e.clientY;
    const k = [0, 2, 3, 4, 5, 3, 4, 5];
    const i = k[e.buttons] || 2;        //
    xmat.applyrot(0, i, dx * mouserot);
    xmat.applyrot(1, i, -dy * mouserot);
    showxmat();
    // killev(e);
}
function mousedown(e) {
    if (lastx === Infinity) {
        renderer.domElement.addEventListener('mousemove', mousemove);
        renderer.domElement.addEventListener('mouseup', mouseup);
    }
    lastx = e.clientX;
    lasty = e.clientY;
}
function mouseup(e) {
    if (e.buttons === 0) {
        renderer.domElement.removeEventListener('mousemove', mousemove);
        renderer.domElement.removeEventListener('mouseup', mouseup);
        lastx = Infinity;
    }
}

function showxmat() {
    const tab=['<table>']
    for (let i = 0; i < ND; i++) {
        const row = [`<tr><td>${cols[i]}</td>`];
        for (let j = 0; j < ND; j++) {
            const v = xmat.m[i*ND + j] * 255;
            const r = v > 0 ? 0 : -v;
            const g = v > 0 ? v : 0;
            row.push(`<td style="background-color: rgb(${r}, ${g}, 0)">&nbsp;&nbsp;&nbsp;&nbsp;</td>`);
        }
        row.push('</tr>');
        tab.push(row.join(''));
    }
    tab.push('</table>');
    E.colkey.innerHTML = tab.join('\n');
    // E.colkey.blur();
    E.colkey.style.userSelect = 'none';
}
