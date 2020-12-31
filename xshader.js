'use strict';
// permit multidimensional input and linear transformation
// also realtime lasso
export {useXShader, uniforms, xmat, vmap};

const {X} = window;
import {THREE} from "./threeH.js";
import {lassos} from "./lasso.js";
import {_baseiNaN} from './xyz.js';

let uniforms, shader;
let lastid; // id used to force rebuild of shader for experiments
let ND = 6; // number of dimensions
let xmat = new Float32Array(ND*ND);
for (let i = 0; i < ND; i++) for (let j = 0; j < ND; j++) xmat[ND*i + j] = +(i === j);
let vmap = [];
for (let i = 0; i < ND; i++) vmap[i] = new THREE.Vector2(0,1);
let attribs = ''; for (let i = 0; i < ND; i++) attribs += `attribute float field${i};\n`;
let attset = '';  for (let i = 0; i < ND; i++) attset += `rv[${i}] = field${i};\n`;


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
    vColor = color;
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
        gamma: {value: 0.5},
        lassoMap: { value: undefined },
        lassoTotmat: { value: new THREE.Matrix4() },
        size: { value: new THREE.Vector2(100,100)},
        psize: { value: 1},
        doLassoFilter: { value: 0.0 },
        doLassoColour: { value: 0.9 },

        vmap: { value: vmap},
        xmat: { value: xmat}
    }
    
    shader = new THREE.ShaderMaterial(
        {vertexShader, fragmentShader, uniforms}
    );
    return shader;
}

let noxmaterial, xmaterial;
async function useXShader(cols, id) {
    if (cols === true) cols = ['x', 'y', 'z', 'cd3', 'cd4', 'cd16'];
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
                if (usealpha)
                    vmap[i].set(0, 1/xyz.namevsetlen[col]);
                else
                    vmap[i].set(r.mean - 1.5*r.sd, 1/3/r.sd);
            } else {
                vmap[i].x = 1e40;
            }
        }

    } else {
        particles.material = noxmaterial;
        particles.onBeforeRender = ()=>{};
    }
}
