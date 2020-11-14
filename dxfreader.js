export {dxfReader};
import {addToMain} from './graphicsboiler.js';
import {centrerange} from './xyz.js';

const {THREE, X, E, addFileTypeHandler} = window;
addFileTypeHandler('.dxf', dxfReader);

// X.readdxf = readdxf;  // initial experiments
// let DxfParser;

/** main function for handling dxf data */
async function dxfReader(data, fid) {
    if (!window.DxfParser) {
        await addscript('jsdeps/dxf-parser.js')
    }
    const parser = new window.DxfParser();
    const dxff = parser.parseSync(data);
    let xoff = centrerange.x, yoff = centrerange.y;

    const dxfscene = window.currentObj = new THREE.Scene();
    const dxfmaterial = new THREE.LineBasicMaterial();
    dxfscene.material = dxfmaterial;                    // to satisfy obj level has material
    dxfscene.name = fid;
    let nent = 0, nvert = 0;
    for (const ent of dxff.entities) {
        if (ent.type !== 'LWPOLYLINE') continue;
        var geometry = new THREE.Geometry();
        var verts = ent.vertices.map(v => new THREE.Vector3(v.x - xoff, v.y - yoff, 0));
        nent++;
        nvert += verts.length;
        geometry.vertices = verts;
        const lsegs = new THREE.Line(geometry, dxfmaterial);
        lsegs.name = fid + ent.handle;
        dxfscene.add(lsegs);
    }
    addToMain(dxfscene, fid);
    Object.assign(X, {dxff, dxfscene, dxfmaterial})
    console.log(`added ${nent} entities with total ${nvert} vertices`)
    // X.currentXyz = new dxf(dxff, fid);
}

