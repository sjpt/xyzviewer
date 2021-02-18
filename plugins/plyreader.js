export {readply};
import {ggb} from '../graphicsboiler.js'; // addToMain
import {addFileTypeHandler} from '../basic.js';

const {X, E} = window;
import {THREE} from "../threeH.js";
import {PLYLoader} from '../jsdeps/PLYLoader.js';

addFileTypeHandler('.ply', plyReader);

/** main function for handling ply data */
function plyReader(data, fid) {
    const loader = new PLYLoader();
    const geometry = loader.parse(data);

    X.currentXyz = new PLY(geometry, fid);
}

/** test function for handling ply data */
function readply(fid = './data/p17.ply') {
    var loader = new PLYLoader();
    loader.load( fid, g => new PLY(g, fid));
}

class PLY {
    constructor(geometry, fid) {
        this.geometry = geometry;
        this.fid = fid;
        X.currentThreeObj = this.mesh = this.meshmaker(geometry, fid);
        this.setPointSize(0.05);
        if (!geometry.attributes.color)  // choose white as base if colour will be added
            this.dataToMarkersGui();
    }

    setPointSize(size) { this.mesh.material.size = size; }

    dataToMarkersGui() { this.mesh.material.color = new THREE.Color().setStyle(E.colourpick.value); }


/** core of handler, convert incoming geometry to mesh and add to visible objects */
meshmaker ( geometry, fid ) {
    const pos = geometry.attributes.position.array;

    // fix up to allow for certain invalid situations
    let bad = 0;
    for (let i =0; i < pos.length; i++ ) if (isNaN(pos[i])) { pos[i] = 0; bad++; }
    if (bad) console.error('NaNs fixed', bad);
    geometry.computeBoundingBox();  // recompute after fixing NaNs

    let material, obj;
    if (geometry.index) {
        geometry.computeVertexNormals();
        material = new THREE.MeshStandardMaterial( { color: 0xffffff, flatShading: true } );
        obj = new THREE.Mesh( geometry, material );
    } else {
        material = new THREE.PointsMaterial( { color: 0xffffff, flatShading: true } );
        obj = new THREE.Points( geometry, material );
    }
    if (geometry.attributes.color) material.vertexColors = true; // THREE.VertexColors;

    // scaling
    const basescale = 30;
    const bb = geometry.boundingBox, a = bb.min, b = bb.max;
    const sc = basescale / Math.max(b.x - a.x, b.y-a.y, b.z-a.z);
    obj.scale.multiplyScalar(sc);
    obj.position.set(a.x+b.x,  a.y+b.y, a.z+b.z);
    obj.position.multiplyScalar(-sc/2);

//    mesh.position.x = - 0.2;
//    mesh.position.y = - 0.02;
//    mesh.position.z = - 0.2;
//    mesh.scale.multiplyScalar( 0.0006 );

//    mesh.castShadow = true;
//    mesh.receiveShadow = true;

    obj.xyz = this;
    ggb().addToMain(obj, fid);
    return obj;
}
}