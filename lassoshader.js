'use strict';
// make a points material with lasso filter or colour (from lasso texture)
export {useLassoShader, uniforms};

const {X} = window;
import {THREE} from "./threeH.js";
import {lassos} from "./lasso.js";
import {_baseiNaN} from './xyz.js';

let uniforms, shader;

/*********** */
function lassoShader() {
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

void fcol(float field, vec2 vmap, vec3 lcol, vec3 hcol) {
    if (vmap.x > 9e39) return;
    float v = clamp((field - vmap.x) * vmap.y, 0., 1.);
    vColor += mix(lcol, hcol, v);
}
void main() {
    vColor = color;
    vec3 transformed = vec3( position );

    fcol(field1, vmap1, lcol1, hcol1);
    fcol(field2, vmap2, lcol2, hcol2);
    fcol(field3, vmap3, lcol3, hcol3);

    // lasso
    vec4 sv4 = totmat * vec4(position, 1);
    vec2 sv2 = sv4.xy / sv4.w / size;
    float v = texture2D(map, sv2).x;

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
    return shader;
}

let nolassomaterial, lassomaterial;
async function useLassoShader(cols) {
    if (cols === true) cols = ['cd3', 'cd4', 'cd16'];
    const xyz = X.currentXyz;
    const particles = xyz.particles;
    if (!nolassomaterial) nolassomaterial = particles.material;

    if (cols) {
        particles.material = lassomaterial = lassomaterial || lassoShader();  // cache and set lasso material
        particles.onBeforeRender = () => {
            // handle lasso details every frame, could just do when lasso changes?
            const lasso = lassos[lassos.length - 1];
            if (lasso) {
                uniforms.map.value = lasso.mapt;
                uniforms.totmat.value.copy(lasso.totmat);
                uniforms.size.value.copy(lasso.size);
            }
        }

        // handle field details on call to useLassoShader
        // set up attributes and uniforms to control the shader
        for (let i=1; i<=3; i++) {
            const col = cols[i-1];    // column name
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
                    uniforms['vmap' + i].value.set(0, 1/xyz.namevsetlen[col]);
                else
                    uniforms['vmap' + i].value.set(r.mean - 1.5*r.sd, 1/3/r.sd);
            } else {
                uniforms['vmap' + i].value.x = 1e40;
            }
        }

    } else {
        particles.material = nolassomaterial;
        particles.onBeforeRender = ()=>{};
    }
}
