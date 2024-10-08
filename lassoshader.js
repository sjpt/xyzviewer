'use strict';
// make a points material with lasso filter or colour (from lasso texture)
export {useLassoShader, uniforms};

const {X} = window;
import {THREE} from "./threeH.js";
import {XYZ, _baseiNaN} from './xyz.js';

let uniforms, shader;
let lastid; // id used to force rebuild of shader for experiments

/*********** */
function lassoShader(id=0) {
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
uniform sampler2D map;
uniform mat4 totmat;
uniform float dofilter;
uniform float docolour;

attribute float field1;
uniform vec2 vmap1;
uniform vec3 lcol1;
uniform vec3 hcol1;
attribute float field2;
uniform vec2 vmap2;
uniform vec3 lcol2;
uniform vec3 hcol2;
attribute float field3;
uniform vec2 vmap3;
uniform vec3 lcol3;
uniform vec3 hcol3;

/** compute field normalized value for object and use associated colours to increment vColour  */
void fcol(float field, vec2 vmap, vec3 lcol, vec3 hcol) {
    if (vmap.x > 9e30) return;
    float v = clamp((field - vmap.x) * vmap.y, 0., 1.);
    vColor += mix(lcol, hcol, v);
}
void main() {
    vColor = color;
    vec3 transformed = vec3( position );

    fcol(field1, vmap1, lcol1, hcol1);
    fcol(field2, vmap2, lcol2, hcol2);
    fcol(field3, vmap3, lcol3, hcol3);

    vColor.x += float(${id});  // force recompile if new id

    // lasso
    float v;
    if (size.x > 0.) {
        vec4 sv4 = totmat * vec4(position, 1);
        vec2 sv2 = sv4.xy / sv4.w / size;
        v = texture2D(map, sv2).x;
    } else {
        v = 1.0;
    }

    if (dofilter != 0. && v == 0.) transformed = vec3(1e20);
    vColor *= (1. - docolour + v*docolour);

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
    // vec2 uv = ( /** uvTransform * **/ vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;  // 0..1
    // float id = vColor.x;                            // temp code using x from colour to choose id, range 0..1
    // id = floor(id * lassonum.x * lassonum.y);       // to integer range
    // float idx = mod(id, lassonum.x) / lassonum.x;   //
    // float idy = floor(id / lassonum.x) / lassonum.y;
    // uv = vec2(idx, idy) + uv / lassonum;

    // vec4 mapTexel = texture2D( map, uv );
    vec4 diffuseColor = vec4(vColor, 1.);
    gl_FragColor = pow(diffuseColor, vec4(gamma));
}
    `;

    uniforms = {
        gamma: {value: 0.5},
        map: { value: undefined },
        totmat: { value: new THREE.Matrix4() },
        size: { value: new THREE.Vector2(100,100)},
        psize: { value: 1},
        dofilter: { value: 0.0 },
        docolour: { value: 0.9 },
        
        vmap1: { value: new THREE.Vector2(0, 1)},
        lcol1: { value: new THREE.Color(0,0,0)},
        hcol1: { value: new THREE.Color(1,0,0)},

        vmap2: { value: new THREE.Vector2(0, 1)},
        lcol2: { value: new THREE.Color(0,0,0)},
        hcol2: { value: new THREE.Color(0,1,0)},

        vmap3: { value: new THREE.Vector2(0, 1)},
        lcol3: { value: new THREE.Color(0,0,0)},
        hcol3: { value: new THREE.Color(0,0,1)}
    }
    
    shader = new THREE.ShaderMaterial(
        {vertexShader, fragmentShader, uniforms}
    );
    shader.name = 'lasso';
    return shader;
}

/**
 * @param {boolean | any[]} cols    // may be false, true, or list of columns
 * @param {any} id                  // not used, to allow multiple versions
 * @param {XYZ} xyz                 // xyz to which this applies
 */
async function useLassoShader(cols, id, xyz = X.currentXyz) {
    const tdata =xyz.tdata;
    if (cols === true) cols = [xyz.getField('X') || 'cd3', xyz.getField('Y') || 'cd4', xyz.getField('Z') || 'cd16'];
    const particles = xyz.particles;


    if (cols) {
        if (!xyz.lassoMaterial) xyz.lassoMaterial = lassoShader(id);
        particles.material = xyz.lassoMaterial;
        particles.onBeforeRender = () => {
            // handle lasso details every frame, could just do when lasso changes?
            const lasso = xyz.gb.lasso.lassos[0];
            if (lasso) {
                uniforms.map.value = lasso.mapt;
                uniforms.totmat.value.copy(lasso.totmat);
                uniforms.size.value.copy(lasso.size);
            } else {
                uniforms.size.value.x = -1;
            }
        }

        // handle field details on call to useLassoShader
        // set up attributes and uniforms to control the shader
        for (let i=1; i<=3; i++) {
            const col = cols[i-1];    // column name
            if (col) {
                const usealpha = tdata.ranges[col].numStrs > tdata.ranges[col].numNum;
                if (!tdata.attcols[col]) {
                    await tdata.lazyLoadCol(col);
                    let namecol = tdata.fvals[col];
                    if (usealpha) { // for alpha columns we must generate an integer array from the NaN tags
                        let uval = tdata.uvals[col];
                        const type = tdata.vsetlen[col] <= 255 ? Uint8Array : Uint16Array;
                        const iarr = new type(uval.length);   // could usually use Uint8Array
                        iarr.forEach((v,n) => iarr[n] = uval[n] - _baseiNaN);
                        namecol = iarr;
                    }
                    tdata.attcols[col] = new THREE.BufferAttribute(namecol, 1);
                }                
                particles.geometry.setAttribute('field' + i, tdata.attcols[col]);
                const r = tdata.ranges[col];
                if (usealpha)
                    uniforms['vmap' + i].value.set(0, 1/tdata.vsetlen[col]);
                else
                    uniforms['vmap' + i].value.set(r.mean - 1.5*r.sd, 1/3/r.sd);
            } else {
                uniforms['vmap' + i].value.x = 1e40;
            }
        }

    } else {
        particles.material = xyz.defaultMaterial;
        particles.onBeforeRender = ()=>{};
    }
    E.lassoshaderbox.checked = !!cols;
}
