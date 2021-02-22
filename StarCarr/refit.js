'use strict';
// code for display of refit data
export {refit};
import {ggb} from '../graphicsboiler.js'; // addToMain
import {col3} from '../xyz.js';
import {THREE} from "../threeH.js";
import {XYZ} from "../xyz.js";

const {X} = window;

let rgroups, rlines;

// var da tas, scene, rgroups, rlines;

// compute refit from preloaded data held in xyz cols, make a refit set for each group
// and display as lines from flints to centroid of group
function refit() {
    /** @type {XYZ} */
    const xyz = X.currentXyz;
    const tdata = xyz.tdata;
    const refitcol = tdata.fvals.refit_grou;
    const xc = tdata.fvals.x, yc = tdata.fvals.y, zc = tdata.fvals.z;
    if (!refitcol) {setTimeout(refit, 100); return; }
    // data prep, find groups
    rgroups = {};
    for(let i=0; i < refitcol.length; i++) {
        const gid = refitcol[i];
        if (isNaN(gid)) continue;
        let gr = rgroups[gid];
        if (!gr) gr = rgroups[gid] = {gid, sx: 0, sy:0, sz: 0, n: 0, inds: []};
        gr.sx += xc[i];
        gr.sy += yc[i];
        gr.sz += zc[i];
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
        // const cen = new THREE.Vector3(gr.x - centrerange.x, gr.y - centrerange.y, gr.z - centrerange.z); // not needed 8/11/2020, new centre scheme
        const cen = new THREE.Vector3(gr.x, gr.y, gr.z);
        gr.inds.forEach( i=> {
            const dv = new THREE.Vector3( xc[i],  yc[i],  zc[i]);
            if (dv.z == 0) return;
            //if (dv.distanceTo(cen) > 3)
            //    console.log('refit big', gr.gid, i, cen, dv);

            linegeom.vertices.push(cen);
            linegeom.vertices.push(dv);
            linegeom.colors.push(col);
            linegeom.colors.push(col);
            });
    }

    const linemat = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1, linewidth: 1, vertexColors: true /*THREE.VertexColors*/ } );
    //if (rlines) maingroup.remove(rlines);
    rlines = new THREE.LineSegments(linegeom, linemat);
    ggb().addToMain(rlines, 'refits');
}

