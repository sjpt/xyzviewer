// read grid data from lidar
// https://environment.data.gov.uk/ds/survey/index.jsp#/survey?grid=SU42
export {ascReader};
import {addToMain} from './graphicsboiler.js';
const {THREE, X, addFileTypeHandler} = window;
addFileTypeHandler('.asc', ascReader);



function ascReader(rawdata, fid) {
    let geom;
    if (!X.ascgeom) {
        X.camera.position.set(0,0,800); X.camera.lookAt(0,0,0);
        X.maingroup.rotation.set(0,0,0);
    }
    if (rawdata) {
        const rows = rawdata.split('\n');
        if (rows[rows.length-1] === "") rows.pop();
        const n = rows.length - 6;
        // for now use standard vertex, would be much better to have just height map and custom shader
        const verts = new Float32Array(n*n*3);
        let p = 0;
        for (let i = 0; i < n; i++) {
            const r = rows[i+6].split(' ');
            for (let j = 0; j < n; j++) {
                verts[p++] = j - n/2;
                verts[p++] = -(i - n/2);
                verts[p++] = r[j];
            }
        }
        geom = new THREE.PlaneBufferGeometry(50,50,n-1,n-1);
        geom.attributes.position.array = verts;
        geom.computeFaceNormals();
        geom.computeVertexNormals();
    } else {
        geom = new THREE.PlaneBufferGeometry(50,50);
    }
    X.ascgeom = geom;

    //const geometry = new THREE.BufferGeometry();
    //geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( verts, 3 ) );
    const mesh = new THREE.Mesh(geom, new THREE.MeshPhongMaterial());
    mesh.material.side = THREE.DoubleSide;
    X.ascmesh = mesh;
    addToMain(mesh, fid);
}
X.ascReader = ascReader;

function cube(r=1) {
    const geom = new THREE.CubeGeometry(r,r,r);
    const mesh = new THREE.Mesh(geom, new THREE.MeshPhongMaterial());
    X.cubemesh = mesh;
    addToMain(mesh, 'cube' + r);
}
X.cube = cube

/*********
 * note on getting data
 * catalog at https://raw.githubusercontent.com/iandees/uk-lidar/master/catalog.csv
 * sample uri
 * ??? posturiasync2("https://data.gov.uk/dataset/lidar-composite-dsm-1m1/4d0c9db2-1544-11e7-a00a-8cdcd4b4861c", ()=>{})
 * posturiasync2("https://www.geostore.com/environment-agency/rest/product/download/LIDAR-DSM-1M-2009-NT70sw.zip", ()=>{})
 * Accept request header not correct
 *
 */