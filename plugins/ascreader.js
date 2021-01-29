// read grid data from lidar
// https://environment.data.gov.uk/ds/survey/index.jsp#/survey?grid=SU42
export {ascReader};
import {ggb} from '../graphicsboiler.js'; // addToMain
import {addFileTypeHandler} from '../basic.js';
import {centrerange} from '../xyz.js';

import {THREE} from "../threeH.js";

addFileTypeHandler('.asc', ascReader);

function ascReader(rawdata, fid) {
    let geom;
    const rows = rawdata.split('\n');
    if (rows[rows.length-1] === "") rows.pop();
    const ntest = rows.length - 6;

    const ncols = +rows[0].split(/\s+/)[1];
    const nrows = +rows[1].split(/\s+/)[1];
    const xllcorner = +rows[2].split(/\s+/)[1];
    const yllcorner = +rows[3].split(/\s+/)[1];
    const cellsize = +rows[4].split(/\s+/)[1];
    const NODATA_value = +rows[5].split(/\s+/)[1];
    if (nrows !== ntest)
        console.error('unexpected lidar data', ntest, nrows);
    const cenx = xllcorner + ncols*cellsize/2 - centrerange.x;
    const ceny = yllcorner + nrows*cellsize/2 - centrerange.y;
    const cenz = 0; // - centrerange.z;
    console.log('grid', fid, 'centre', cenx, ceny, cenz);


    // for now use standard vertex, would be much better to have just height map and custom shader
    geom = new THREE.PlaneBufferGeometry(1000,1000,ncols,nrows);
    const verts = geom.attributes.position.array; // new Float32Array(n*n*3);
    let p = 0;
    for (let i = 0; i <= nrows; i++) {
        let r;
        if (i === nrows) {
            r = rows[i+5].split(' ');
            const r2 = rows[i+4].split(' ');
            r.forEach((v,i) => r[i] = 2*v - r2[i]);
        } else {
            r = rows[i+6].split(' ');
        }
        r[ncols] = 2*r[ncols-1] - r[ncols-2];

        for (let j = 0; j <= ncols; j++) {
            verts[p++] = j - ncols/2 - 1/2;
            verts[p++] = -(i - nrows/2 - 1/2);
            let rj = +r[j];
            if (rj === NODATA_value) rj = 0;  // << not correct at extrapolated boundary
            verts[p++] = rj;
        }
    }
    geom.computeVertexNormals();    // ?? we could do a little better a edges???

    const mesh = new THREE.Mesh(geom, new THREE.MeshPhongMaterial());
    mesh.position.set(cenx, ceny, cenz);
    mesh.scale.set(cellsize, cellsize, -1);
    mesh.material.side = THREE.DoubleSide;
    // window.ascmesh = mesh;
    ggb.addToMain(mesh, fid);

}

/*********
 * note on getting data
 * catalog at https://raw.githubusercontent.com/iandees/uk-lidar/master/catalog.csv
 * sample uri
 * ??? posturiasync2("https://data.gov.uk/dataset/lidar-composite-dsm-1m1/4d0c9db2-1544-11e7-a00a-8cdcd4b4861c", ()=>{})
 * posturiasync2("https://www.geostore.com/environment-agency/rest/product/download/LIDAR-DSM-1M-2009-NT70sw.zip", ()=>{})
 * Accept request header not correct
 *
 * https://environment.data.gov.uk/DefraDataDownload/?Mode=survey
 * go to 502845 481006
 * 
 * About Star Carr, East Riding of Yorkshire (YO25 8RU)
Name: Star Carr, East Riding of Yorkshire
Place type: Other Landcover
>>> NO Location: Grid Ref: TA 1043 4669 • X/Y co-ords: 510435, 446691 • Lat/Long: 53.90459824,-0.32055479
County/Unitary Authority: East Riding of Yorkshire
Region: Yorkshire and the Humber
Country: England
Height: 2.2m
OS Explorer map: 295: Bridlington, Driffield & Hornsea

TA 08 SW
 */