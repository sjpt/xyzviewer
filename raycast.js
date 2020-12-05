'use strict';
export {};
import {outerscene, camera} from './graphicsboiler.js';
import {dataToMarkersGui} from './xyz.js';
const {E, X} = window;
import {THREE} from "./threeH.js"; // import * as THREE from "./jsdeps/three121.module.js";

/** raycasting */
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
document.onmousemove = onMouseMove;
document.onclick = onMouseMove;
let onMouseMove_lastface;

function onMouseMove( event ) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    if (event.target !== E.canvas || !(event.ctrlKey || event.type === 'click'))  return;
    mouse.x = ( event.offsetX / E.canvas.style.width.replace('px','') ) * 2 - 1;
    mouse.y = - ( event.offsetY / E.canvas.style.height.replace('px','') ) * 2 + 1;

    // ~~~~~~~~ each frame?
    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera( mouse, camera );
    const th = X.raywidth || 0.2;
    raycaster.params.Points.threshold = th;
    raycaster.params.Line.threshold = th;   // ?? have the three.js rules changed ??
    // raycaster.linePrecision = th;

    // calculate objects intersecting the picking ray
    console.time('inter')
    var intersects = raycaster.intersectObjects( outerscene.children, true );
    console.timeEnd('inter')
    const num = intersects.length;
    intersects = intersects.splice(0, 10);

    //for ( var i = 0; i < intersects.length; i++ ) {
    //    //intersects[ i ].object.material.color.set( 0xff0000 );
    //
    //}
    E.msgbox.innerHTML = `hits ${num} shown ${intersects.length}. Hover for details.<br>`;
    intersects.forEach(function(ii) {
    //const ii = intersects[0];
        if (ii && ii.object.name === 'pdbpolygonmesh') {    // TODO wrong dependency here ....
            const face = ii.face;
            if (onMouseMove_lastface !== face) {
                if (onMouseMove_lastface)
                    onMouseMove_lastface.color.copy(onMouseMove_lastface.ocol);
                if (!face.ocol) face.ocol = face.color.clone();
                face.color.setRGB(1,1,0);
                ii.object.geometry.colorsNeedUpdate = true;
                const chainsa = Array.from(face.chainset);
                console.log(face, chainsa);
                E.filterbox.value = '[' + chainsa + '].includes(chainn)';
                dataToMarkersGui();
                onMouseMove_lastface = face;
            }
        }
        const xyz = ii.object.xyz;
        let frow;
        if (xyz) {
            const s = [];
            const i = ii.index;
            // const row = xyz.datas[ii.index];
            for (const name in xyz.namecols) { 
                const v = xyz.val(name, i); 
                if (typeof v !== 'object') 
                    s.push(name + ': ' + v);
            }
            frow = s.join('<br>');
        } else {
            frow = 'no detailed information';
        }
        E.msgbox.innerHTML += `<span>${ii.object.name}:${ii.index} ${ii.point.x.toFixed()}, ${ii.point.y.toFixed()}, ${ii.point.z.toFixed()}</span>
            <span class="help">${frow}</span><br>
        `;
   });


    // console.log(ii ? ii.object : 'nohit');
    if (onMouseMove_lastface && !intersects.length) {
        onMouseMove_lastface.color.copy(onMouseMove_lastface.ocol);
        E.filterbox.value = '';
        dataToMarkersGui();
        onMouseMove_lastface = undefined;
    }
}
