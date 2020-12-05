'use strict';
/** dynamic expansion, todo add easier scripting */
import {centrerange, spotsizeset} from '../xyz.js';
import {posturiasync} from '../basic.js';

import {expandchain, pdbReader} from '../plugins/pdbreader.js';
import {fullcanvas, orbcamera} from '../graphicsboiler.js';
import {COLS} from '../cols.js';

let folddemo_st;  // folddemo start time to help script
function folddemofun(tt = 10000, gap = 2000) {
    if (centrerange.x === Infinity) {  // no data yet, read data and pend
        posturiasync('data/4bcufullCA.pdb',
            (d,f) => { pdbReader(d,f); folddemofun(); });
        return;
    }
    spotsizeset(5);
    COLS.set('resname');
    orbcamera.position.set(0,0,250);
    fullcanvas(true);

    if (!folddemo_st) requestAnimationFrame(foldframe);
    folddemo_st = Date.now();
    function foldframe() {
        const t = Date.now() - folddemo_st;
        if (t > 2 * tt + gap) { expandchain(0,0); folddemo_st = undefined; return; }
        if (t < tt) {
            const dt = t / tt;
            expandchain(0.5 + 0.5 * dt, 0.5 - 0.5 * dt);
        } else if (t > tt + gap) {
            const dt = (t - tt - gap) / tt;
             expandchain(1-dt, 0);
        }
        requestAnimationFrame(foldframe);
    }
    document.title = 'xyzviewer: fold demo';
}

folddemofun();
// //document.addEventListener("DOMContentLoaded",()=>{
//     const expbutton = document.createElement('button');
//     expbutton.id = 'xexpbutton';
//     E.gui.appendChild(expbutton);
//     expbutton.textContent = 'fold demo';
//     var exphelp =  `<span class="help">Run demo of folding virus</span>`
//     W.appendNodeFromHTML(window.gui, exphelp);
//     expbutton.onclick = () => folddemofun();
// //});
