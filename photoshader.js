'use strict';
// make a points material with photo extraction from texture
//import {particles} from './xyz.js';
export {photoShader_clicked};

const {THREE, E, X} = window;
window.photoShader_clicked = photoShader_clicked;

var photos;
/*********** */
function photoShader(fid = "../xyz/sprites/mut-64-64-r90.jpg", xres=undefined, yres=undefined) {
    const vertexShader = `
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
uniform float size;
varying vec3 vColor;

void main() {
    vColor.xyz = color.xyz;
    vec3 transformed = vec3( position );

    vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = size / - mvPosition.z ;
}
`;

    const fragmentShader = `
/*
precision highp float;
precision highp int;
*/
varying vec3 vColor;
// uniform mat3 uvTransform;
uniform sampler2D map;
uniform vec2 photonum;  // number of photos in each direction
uniform float discardval;

void main() {
    vec2 uv = ( /** uvTransform * **/ vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;  // 0..1
    float id = vColor.x;                            // temp code using x from colour to choose id, range 0..1
    id = floor(id * photonum.x * photonum.y);       // to integer range
    float idx = mod(id, photonum.x) / photonum.x;   //
    float idy = floor(id / photonum.x) / photonum.y;
    uv = vec2(idx, idy) + uv / photonum;

    vec4 mapTexel = texture2D( map, uv );
    vec4 diffuseColor = mapTexel;
    // diffuseColor += vec4(1);  // test
    // diffuseColor.rgb *= vColor;  // do not use vColour for now
    if ( dot(diffuseColor.rgb, vec3(1)) <= discardval ) discard; //
    gl_FragColor = sqrt(diffuseColor);
}
    `;

    var textureLoader = new THREE.TextureLoader();
    photos = textureLoader.load(fid);

    const uniforms = {
        map: { value: photos },
        photonum: { value: new THREE.Vector2(128,128) },
        discardval: {value: 0.01},
        size: { value: 500}
    }
    const rr = fid.split('-');
    uniforms.photonum.value.x = + (xres || rr[1] || 128);
    uniforms.photonum.value.y = + (yres || rr[2] || 128);

    const shader = new THREE.ShaderMaterial(
        {vertexShader, fragmentShader, uniforms}
    );
    return shader;
}

let nophotomaterial, photomaterial;
function photoShader_clicked(evt) {
    const ele = evt  ? evt.srcElement : E.photoscheck;
    const particles = X.current.particles;
    if (!nophotomaterial) nophotomaterial = particles.material;

    if (ele.checked) {
        particles.material = photomaterial = photomaterial || photoShader();  // cahce and set photo material
    } else {
        particles.material = nophotomaterial;
    }
}