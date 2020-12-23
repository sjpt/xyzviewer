'use strict';
// make a points material with lasso filter or colour (from lasso texture)
export {useLassoShader, uniforms};

const {X} = window;
import {THREE} from "./threeH.js";
import {lassos} from "./lasso.js";

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

void main() {
    vColor = color;
    vec3 transformed = vec3( position );

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

void main() {
    // vec2 uv = ( /** uvTransform * **/ vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;  // 0..1
    // float id = vColor.x;                            // temp code using x from colour to choose id, range 0..1
    // id = floor(id * lassonum.x * lassonum.y);       // to integer range
    // float idx = mod(id, lassonum.x) / lassonum.x;   //
    // float idy = floor(id / lassonum.x) / lassonum.y;
    // uv = vec2(idx, idy) + uv / lassonum;

    // vec4 mapTexel = texture2D( map, uv );
    vec4 diffuseColor = vec4(vColor, 1.);
    gl_FragColor = sqrt(diffuseColor);
}
    `;

    uniforms = {
        map: { value: undefined },
        totmat: { value: new THREE.Matrix4() },
        size: { value: new THREE.Vector2(100,100)},
        psize: { value: 1},
        dofilter: { value: 0.0 },
        docolour: { value: 0.9 }
    }
    
    shader = new THREE.ShaderMaterial(
        {vertexShader, fragmentShader, uniforms}
    );
    return shader;
}

let nolassomaterial, lassomaterial;
function useLassoShader(bool) {
    const particles = X.currentXyz.particles;
    if (!nolassomaterial) nolassomaterial = particles.material;

    if (bool) {
        particles.material = lassomaterial = lassomaterial || lassoShader();  // cache and set lasso material
        particles.onBeforeRender = () => {
            const lasso = lassos[lassos.length - 1];
            if (lasso) {
                uniforms.map.value = lasso.mapt;
                uniforms.totmat.value.copy(lasso.totmat);
                uniforms.size.value.copy(lasso.size);
            }
        }
    } else {
        particles.material = nolassomaterial;
        particles.onBeforeRender = ()=>{};
    }
}
