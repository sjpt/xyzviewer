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
    for (let fi = 0; fi < features.length; fi++) {
        const feature = features[fi];
        const type = feature.geometry.type;
        const coords = feature.geometry.coordinates;
        const contour = (feature.properties && feature.properties.CONTOUR) ? feature.properties.CONTOUR - cz : 0;
        const mv = l => new THREE.Vector3(l[0] - cx, l[1] - cy, 2 in l ? l[2] - cz : contour);
        if (type === 'MultiLineString' || type === 'Polygon') {
            for (let i=0; i < coords.length; i++) {
                let line = coords[i];
                if (!Array.isArray(line)) line = [line];
                for (let l=0; l < line.length - 1; l++) {
                    linegeom.vertices.push(mv(line[l]));
                    linegeom.vertices.push(mv(line[l+1]));
                }
            }
        } else if (type === 'LineString') {
            for (let i=0; i < coords.length-1; i++) {
                linegeom.vertices.push(mv(coords[i]));
                linegeom.vertices.push(mv(coords[i+1]));
           }
        } else if (type === 'Point') {
            linegeom.vertices.push(mv(coords));
            const n = linegeom.vertices.push(mv(coords));
            linegeom.vertices[n].x += 0.01;
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

