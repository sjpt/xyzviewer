'use strict';
var gui, appendNodeFromHTML, posturiasync, refit;

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
appendNodeFromHTML(gui, hh);
//filedropbox.innerHTML = filedrop;
// filehtml = '<select onchange="loaddrop();" id="colourby">' + filedrop + '</select>';
window.loaddrop = function loaddrop() {
    const fid = document.getElementById('filedropbox').value;
    posturiasync('StarCarr/' + fid);
}


posturiasync('StarCarr/StarCarr_Flint.csv');
setTimeout( () => {
    refit();
    posturiasync('StarCarr/contours.geojson');
}, 200);  // wait till data loaded
