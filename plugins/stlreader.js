// read grid data from lidar
// https://environment.data.gov.uk/ds/survey/index.jsp#/survey?grid=SU42
export {stlReader};
import {ggb} from '../graphicsboiler.js'; // addToMain
import {addFileTypeHandler} from '../basic.js';
import {centrerange} from '../xyz.js';
const {X} = window;

import {THREE} from "../threeH.js";

addFileTypeHandler('.stl', stlReader);
stlReader.rawhander = true;


function stlReader(rawdata, fid) {
    const st = Date.now();
    const bytes = new Uint8Array(rawdata);
    const l = rawdata.byteLength;
    const n = (l - 84)/50;          // number of triangles, 84 bytes of header, 50 bytes per entry

    const pos = X.stlpos = new Float32Array(n*3*3);     
    const norm = new Float32Array(n*3*3);
    // set up arrays/views to help copy data
    // setting posb/normb implicitly sets pos/norm with minimal data allocation/copy
    const posb = new Uint8Array(pos.buffer);
    const normb = new Uint8Array(norm.buffer);

    for (let i = 0; i < n; i++) {
        const nn = bytes.subarray(i * 50 + 84, i * 50 + 84 + 12);
        normb.set(nn, (i * 9) * 4)
        normb.set(nn, (i * 9+3) * 4)
        normb.set(nn, (i * 9+6) * 4)

        posb.set(bytes.subarray(i * 50 + 84 + 12, i * 50 + 84 + 12 + 36), i*9*4);
    }
    console.log(`parse time ${fid}: n=${n} ms=${Date.now() - st}`);
    let geom = new THREE.BufferGeometry();
    geom.attributes.position = new THREE.BufferAttribute(pos, 3);
    geom.attributes.normal = new THREE.BufferAttribute(norm, 3);
    let material = new THREE.MeshStandardMaterial();
    let mesh = new THREE.Mesh(geom, material);
    let k = 0.01; mesh.scale.set(k,k,k);

    ggb().addToMain(mesh, fid);
    X.currentXyz = X.currentThreeObj = mesh;
    mesh.xyz = mesh;
    mesh.gb = ggb();
}
