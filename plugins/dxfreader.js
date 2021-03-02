export {dxfReader};
import {ggb} from '../graphicsboiler.js'; // addToMain
import {centrerange} from '../xyz.js';

import {THREE} from "../threeH.js";
import {addFileTypeHandler, addscript} from '../basic.js';

addFileTypeHandler('.dxf', dxfReader);


/** main function for handling dxf data */
async function dxfReader(data, fid) {
    if (!window.DxfParser) {
        await addscript('./plugins/dxf-parser.js')
    }
    const parser = new window.DxfParser();
    const dxff = parser.parseSync(data);
    let xoff = centrerange.x, yoff = centrerange.y;

    const dxfscene = window.X.currentThreeObj = new THREE.Scene();
    const dxfmaterial = new THREE.LineBasicMaterial();
    // @ts-ignore
    dxfscene.material = dxfmaterial;                    // to satisfy obj level has material
    dxfscene.name = fid;
    let nent = 0, nvert = 0;
    for (const ent of dxff.entities) {
        if (ent.type !== 'LWPOLYLINE') continue;
        var geometry = new THREE.BufferGeometry(), vertices = [];
        // var verts = ent.vertices.map(v => new THREE.Vector3(v.x - xoff, v.y - yoff, 0));
        for (const v of ent.vertices) vertices.push(v.x - xoff, v.y - yoff, 0);
        nent++;
        nvert += vertices.length/3;
        // geometry.vertices = verts;
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));

        const lsegs = new THREE.Line(geometry, dxfmaterial);
        lsegs.name = fid + ent.handle;
        dxfscene.add(lsegs);
    }
    ggb().addToMain(dxfscene, fid);
    console.log(`added ${nent} entities with total ${nvert} vertices`)
}

