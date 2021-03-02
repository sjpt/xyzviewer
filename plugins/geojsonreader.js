'use strict';
window.lastModified.geojson = `Last modified: 2021/03/02 15:05:36
`
// code for display of geojson data
export  {geojsonReader};
import {ggb} from '../graphicsboiler.js'; // addToMain
import {centrerange} from '../xyz.js';
import {addFileTypeHandler, log} from '../basic.js';
import {THREE} from "../threeH.js";

addFileTypeHandler('.geojson', geojsonReader);

var geolines;

function geojsonReader(json, fid) {
    const sss = JSON.parse(json);
    const features = sss.features;

    // now prepare groups as graphics
    const linegeom = new THREE.BufferGeometry(), vertices = [];

    const cx=centrerange.x, cy=centrerange.y, cz=centrerange.z;
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
                    pushp(mv(line[l]));
                    pushp(mv(line[l+1]));
                }
            }
        } else if (type === 'LineString') {
            for (let i=0; i < coords.length-1; i++) {
                pushp(mv(coords[i]));
                pushp(mv(coords[i+1]));
           }
        } else if (type === 'Point') {
            pushp(mv(coords));
            const n = pushp(mv(coords));
            vertices[n-2] += 0.01; // ?????
        } else {
            log(`Unexpected type ${type} for geometry`);
        }
    }
    function pushp(l) {return vertices.push(l.x, l.y, l.z);}

    linegeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));

    const linemat = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1, linewidth: 1 } );
    // if (geolines) maingroup.remove(geolines);
    geolines = new THREE.LineSegments(linegeom, linemat);

    ggb().addToMain(geolines, fid);
    log(fid + `features=${features.length} segs=${vertices.length}`);

}

