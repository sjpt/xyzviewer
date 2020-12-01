'use strict';
var posturiasync, handlerForFid, refit, lastModified, addToFilelist;
lastModified.archstart = `Last modified: 2020/12/01 14:20:01
`
var filelist = `
StarCarr_Flint.csv
StarCarr_Fungi.csv
StarCarr_Stones.csv
SC13-15_wood_data.csv
StarCarr_BirchBarkRolls.csv
StarCarr_Faunal.csv
StarCarr_FishHandCollected.csv
contours.geojson
feature.geojson
fishseived.geojson
starcarrsurf.geojson
trenches.geojson
woodplanned.geojson
sample.cols
vp10_dr004.dxf`.trim().split('\n');
filelist.forEach(n => addToFilelist('StarCarr/'+n, 'StarCarr/'+n, n));

document.title = 'Star Carr: xyzviewer';
const starturi = 'StarCarr/StarCarr_Flint.csv';
posturiasync(starturi, function(data, puri) {
    handlerForFid(starturi)(data, puri);
    refit();
    posturiasync('StarCarr/contours.geojson');
    window.plan();
});

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

window.ack.innerHTML = archhh;

setTimeout(() => window.ack.style.display = "none", 10000)
window.xexpbutton.style.display = 'none';

// appendNodeFromHTML(window.document.body, archhh);
