'use strict';
export {filelist};
window.lastModified.archstart = `Last modified: 2021/02/18 22:05:14
`
const {E, GG} = window;
import {posturiasync, addToFilelist} from '../basic.js';
import {ggb, GraphicsBoiler} from '../graphicsboiler.js'; // plan
import {refit} from './refit.js';
import {XYZ} from '../xyz.js';
XYZ.autorange = false;
ggb().defaultDistance = 50;
ggb().defaultFov = 50;
ggb().home();
var filelist = `
Flint.csv
Fungi.csv
Stones.csv
SC13-15_wood_data.csv
BirchBarkRolls.csv
Faunal.csv
FishHandCollected.csv
contours.geojson
feature.geojson
fishseived.geojson
starcarrsurf.geojson
trenches.geojson
woodplanned.geojson
sample.cols
vp10_dr004.dxf
ta02801_DSM_2M.asc
ta0280_DSM_2M.asc
ta0281_DSM_2M.asc`.trim().split('\n');
filelist.forEach(n => addToFilelist('StarCarr/'+n, 'StarCarr/'+n, n));

document.title = 'Star Carr: xyzviewer';
const starturi = 'StarCarr/Flint.csv';
(async function start() {
    await posturiasync(starturi);
    ggb().plan();
    refit();
    await posturiasync('StarCarr/contours.geojson');
    E.msgbox.innerHTML = 'StarCarr load time: ' + (Date.now() - GG.starttime);
})();

let archxref = 
`<a href="https://archaeologydataservice.ac.uk/archives/view/postglacial_2013/index.cfm" target="_blank">
Project archive and further details
</a>`

let archhh = `
<div iD="archhh">
xyzviewer code:
<ul>
<li>Goldsmiths, University of London</li>
</ul>
Star Carr Data and Support:
<ul>
<li>${archxref}</li>
<li>University of York</li>
<li>Archaeology Data Services</li>
<li>Manchester</li>
<li>erc</li>
<li>Historic England</li>
<li>British Academy</li>
<li>NERC</li>
<li>University of Chester</li>
<li>Arts and Humanities Research Council</li>
<li>UCL</li>
<li>heritage lottery fund</li>
<li>Social Sciences and Humanities, Research Council of Canada</li>
<li>Chartered Institute for Archaeologists</li>
</ul>
</div>
`

// display the acknowledgements for 10 seconds
E.ack.innerHTML = archhh;
setTimeout(() => E.ack.style.display = "none", 10000)

// appendNodeFromHTML(window.document.body, archhh);
