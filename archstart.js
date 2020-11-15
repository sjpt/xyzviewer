'use strict';
var appendNodeFromHTML, posturiasync, handlerForFid, refit, lastModified;
lastModified.archstart = `Last modified: 2020/11/15 20:35:12
`
var filelist = `
contours.geojson
feature.geojson
fishseived.geojson
SC13-15_wood_data.csv
starcarrsurf.geojson
StarCarr_BirchBarkRolls.csv
StarCarr_Faunal.csv
StarCarr_FishHandCollected.csv
StarCarr_Flint.csv
StarCarr_Fungi.csv
StarCarr_Stones.csv
trenches.geojson
woodplanned.geojson
vp10_dr004.dxf`.trim().split('\n');
let filedrop = filelist.map(x=>`<option value="${x}">${x}</option>`).join();
let hh = `
<span><span><br><b>File choice:</b><select onchange="loaddrop();" id="filedropbox">${filedrop}</select></span>
<span class="help">Load additional datasets from those available at our host.
<br>
The dropdown has a list of all such available datasets.
<br>
<br>
You can also load additional datasets from your local filesystem
<br>
by drag/drop from explorer or similar onto the canvas.
<br>
<br>
For some odd reason copy/paste works for text (including URLs), but does NOT work for files.
<br>
<br>
In future we also hope to be able to drag/drop or copy/paste URLs from the Star Carr archive.
</span></span>
`
appendNodeFromHTML(window.gui, hh);
//filedropbox.innerHTML = filedrop;
// filehtml = '<select onchange="loaddrop();" id="colourby">' + filedrop + '</select>';
window.loaddrop = function loaddrop() {
    const fid = document.getElementById('filedropbox').value;
    posturiasync('StarCarr/' + fid);
}

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
