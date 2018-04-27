'use strict';
// code for display of refit data
export {refit};
import {addToMain} from './graphicsboiler.js';
import {centrerange} from './xyz.js';
const {THREE, col3, X} = window;
X.refit = refit;

let rgroups, rlines;

// var datas, scene, rgroups, rlines;

// compute refit from preloaded data held in datas, make a refit set for each group
// and display as lines from flints to centroid of group
function refit() {
    const datas = X.current.datas;
    if (!datas) {setTimeout(refit, 100); return; }
    // data prep, find groups
    rgroups = {};
    for(let i=0; i < datas.length; i++) {
        const d = datas[i];
        const gid = d.refit_grou;
        if (gid === 0) continue;
        let gr = rgroups[gid];
        if (!gr) gr = rgroups[gid] = {gid, sx: 0, sy:0, sz: 0, n: 0, inds: []};
        gr.sx += d.x;
        gr.sy += d.y;
        gr.sz += d.z;
        gr.n++;
        gr.inds.push(i);
    }

    // data prep, complete groups, find centres
    for (let g in rgroups) {
        const gr = rgroups[g];
        gr.x = gr.sx / gr.n;
        gr.y = gr.sy / gr.n;
        gr.z = gr.sz / gr.n;
    }

    // now prepare groups as graphics
    var linegeom = new THREE.Geometry();
    for (let g in rgroups) {
        const gr = rgroups[g];
        const col = col3(Math.random(), Math.random(), Math.random());
        const cen = new THREE.Vector3(gr.x - centrerange.x, gr.y - centrerange.y, gr.z - centrerange.z);
        gr.inds.forEach( i=> {
            const d = datas[i];
            const dv = new THREE.Vector3( d.c_x,  d.c_y,  d.c_z);
            if (d.z == 0) return;
            //if (dv.distanceTo(cen) > 3)
            //    console.log('refit big', gr.gid, i, cen, dv);

            linegeom.vertices.push(cen);
            linegeom.vertices.push(dv);
            linegeom.colors.push(col);
            linegeom.colors.push(col);
            });
    }

    const linemat = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1, linewidth: 1, vertexColors: THREE.VertexColors } );
    //if (rlines) maingroup.remove(rlines);
    rlines = new THREE.LineSegments(linegeom, linemat);
    addToMain(rlines, 'refits');
}

