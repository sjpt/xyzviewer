'use strict';
export {enableRaycast};
import {ggb} from './graphicsboiler.js'; // maingroup, camera
import {dataToMarkersGui, XYZ} from './xyz.js';
const {E, X} = window;
import {THREE} from "./threeH.js";

/** raycasting */
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
//document.onmousemove = onMouseMove;
//document.onclick = onMouseMove;
let lastface, lastcol, lastint0;

function enableRaycast(bool) {
    const f = bool ? document.addEventListener : document.removeEventListener;
    f('mousemove', onMouseMove);
    f('click', onMouseMove);
}

function onMouseMove( event ) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    if (event.target !== E.xyzcanvas || !(event.ctrlKey || event.type === 'click'))  return;
    mouse.x = ( event.offsetX / E.xyzcanvas.style.width.replace('px','') ) * 2 - 1;
    mouse.y = - ( event.offsetY / E.xyzcanvas.style.height.replace('px','') ) * 2 + 1;

    // ~~~~~~~~ each frame?
    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera( mouse, ggb().camera );
    const th = X.raywidth || 0.2;
    raycaster.params.Points.threshold = th;
    raycaster.params.Line.threshold = th;   // ?? have the three.js rules changed ??
    // raycaster.linePrecision = th;

    // calculate visible objects intersecting the picking ray
    console.time('raycast')
    const visibles = []; ggb().maingroup.traverseVisible(v => visibles.push(v))
    var intersects = raycaster.intersectObjects( visibles, false );
    console.timeEnd('raycast')
    const num = intersects.length;
    intersects = intersects.splice(0, 10);

    //for ( var i = 0; i < intersects.length; i++ ) {
    //    //intersects[ i ].object.material.color.set( 0xff0000 );
    //
    //}
    E.msgbox.innerHTML = `hits ${num} shown ${intersects.length}. Hover for details.<br>`;

    // colour picked face (eg but not necessarily virus polygon)
    let int0 = intersects[0];
    let newface = int0 && int0.face;
    if (newface != lastface) {          // n.b NOT !==, sometimes mix of null and undefined
        if (lastface) {
            lastface.color.copy(lastcol);
            lastint0.object.geometry.colorsNeedUpdate = true;
        }
        if (newface) {
            lastcol = newface.color.clone();
            newface.color.setRGB(1,1,0);
            int0.object.geometry.colorsNeedUpdate = true;

            // bit below dependent on chainset link/dependency
            // TODO: change filterbox without disturbing related things such as COL:
            if (newface.chainset) {
                const chainsa = Array.from(newface.chainset);
                E.filterbox.value = '?[' + chainsa + '].includes(chainn)';
            }
        } else {
            E.filterbox.value = '';
        }
        dataToMarkersGui();
    }
    lastface = newface;
    lastint0 = int0;


    intersects.forEach(function(ii) {
    //const ii = intersects[0];
        /** @type {XYZ} */ const xyz = ii.object.xyz;
        let frow;
        if (xyz) {
            const s = [];
            const ind = ii.index;
            // const row = xyz.datas[ii.index];
            for (const name in xyz.tdata.fvals) { 
                const v = xyz.tdata.val(name, ind); 
                if (typeof v !== 'object') 
                    s.push(name + ': ' + v);
            }
            frow = s.join('<br>');
        } else {
            frow = 'no detailed information';
        }
        const indshow = ii.face ? ii.faceIndex : ii.index;
        E.msgbox.innerHTML += `<span>${ii.object.name}:${indshow} ${ii.point.x.toFixed()}, ${ii.point.y.toFixed()}, ${ii.point.z.toFixed()}</span>
            <span class="help">${frow}</span><br>
        `;
   });


    // console.log(ii ? ii.object : 'nohit');
    if (lastface && !intersects.length) {
        lastface.color.copy(lastface.ocol);
        E.filterbox.value = '';
        dataToMarkersGui();
        lastface = undefined;
    }
}
