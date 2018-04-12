'use strict';
// code for display of geojson data

var datas, scene, rgroups, geolines;

function geojson() {
    if (!datas) {setTimeout(geojson, 100); return; }
    loaddrop('contours.geojson');
}

function geojsonReader(json, fid) {
    const sss = JSON.parse(json);
    const features = sss.features;

    // now prepare groups as graphics
    const linegeom = new THREE.Geometry();

    const cx=ranges.x.mean, cy=ranges.y.mean, cz=ranges.z.mean;
    for(let f = 0; f < features.length; f++) {
        const type = features[f].geometry.type; 
        const coords = features[f].geometry.coordinates;
        if (type === 'MultiLineString' || type === 'Polygon') {
            for (let i=0; i < coords.length; i++) {
                let line = coords[i];
                if (!Array.isArray(line)) line = [line];
                for (let l=0; l < line.length - 1; l++) {
                    linegeom.vertices.push(new THREE.Vector3(line[l][0] - cx, line[l][1] - cy, 0));
                    linegeom.vertices.push(new THREE.Vector3(line[l+1][0] - cx, line[l+1][1] - cy, 0));
                }
            }
        } else if (type === 'LineString') {
            for (let i=0; i < coords.length-1; i++) {
                linegeom.vertices.push(new THREE.Vector3(coords[i][0] - cx, coords[i][1] - cy, 0));
                linegeom.vertices.push(new THREE.Vector3(coords[i+1][0] - cx, coords[i+1][1] - cy, 0));    
           }
        } else if (type === 'Point') {
            linegeom.vertices.push(new THREE.Vector3(coords[0] - cx, coords[1] - cy, coords[2] - cz));
            linegeom.vertices.push(new THREE.Vector3(coords[0]+0.01 - cx, coords[1] - cy, coords[2] - cz));    
        } else {
            log(`Unexpected type ${type} for geometry`);
        }
    }

    const linemat = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1, linewidth: 1 } );
    if (geolines) maingroup.remove(geolines);
    geolines = new THREE.LineSegments(linegeom, linemat);

    maingroup.add(geolines);
    addvis(geolines, 'geojson');
    log(fid + `features=${features.length} segs=${linegeom.vertices.length}`);

}

