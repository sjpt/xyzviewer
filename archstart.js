'use strict';
var appendNodeFromHTML, posturiasync, handlerForFid, refit, lastModified;
lastModified.main = `Last modified: 2020/11/06 19:10:08
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
woodplanned.geojson`.trim().split('\n');
let filedrop = filelist.map(x=>`<option value="${x}">${x}</option>`).join();
let hh = `<span><br><b>File choice:</b><select onchange="loaddrop();" id="filedropbox">${filedrop}</select></span>`
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
});

let archhh = `
<div iD="archhh">
xyzviewer code:
<ul>
<li>Goldsmiths, University of London</li>
</ul>
Star Carr Data and Support:
<ul>
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

window.ack.innerHTML = 
`<a href="https://archaeologydataservice.ac.uk/archives/view/postglacial_2013/index.cfm" target="_blank">
Star Carr data from these sources and contributors
</a>` + archhh;

setTimeout(() => window.archhh.style.display = "none", 10000)

// appendNodeFromHTML(window.document.body, archhh);
