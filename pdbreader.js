'use strict';
export {pdbReader, makechainlines, expandchain};
import {addToMain, usePhotoShader, orbcamera, renderer,
    outerscene, camera} from './graphicsboiler.js';
import {dataToMarkersGui, XYZ} from './xyz.js';
const {THREE, addFileTypeHandler, log, col3, E} = window;  // killev from OrbitControls ????


addFileTypeHandler('.pdb', pdbReader);
addFileTypeHandler('.vdb', pdbReader);

let pdbdatas, polygonmesh, rlines, groupgeom, chainlines, myxyz;

/** call pdbReader when pdb data read and ready to be parsed */
function pdbReader(data, fid) {
    myxyz = new XYZ(undefined, fid);  // will become current
    const lines = data.split('\n');
    const format = [
    [1,4, 'atom'], //    “ATOM”        character
    [7,11, 'atid'], //    Atom serial number    right    integer
    [13,16, 'atname'], //    Atom name    left*    character
    [17,17, 'altloc'], //    Alternate location indicator        character
    [18,20, 'resname'], // §    Residue name    right    character
    [22,22, 'chain'], //     Chain identifier        character
    [23,26, 'resid'], //     Residue sequence number    right    integer
    //[27,27, 'insert'], //     Code for insertions of residues        character
    [31,38, 'x'], //     X orthogonal Å coordinate    right    real (8.3)
    [39,46, 'y'], //     Y orthogonal Å coordinate    right    real (8.3)
    [47,54, 'z'], //     Z orthogonal Å coordinate    right    real (8.3)
    //[55,60,    'occupancy'], // Occupancy    right    real (6.2)
    [61,66,    'tempfac'], // Temperature factor    right    real (6.2)
    //[73,76,    'segid'], // Segment identifier¶    left    character
    //[77,78, 'elesym'], //     Element symbol    right    character
    0]; format.pop();                     // dummy to make ending , easier

    myxyz.header = format.map(f => f[2]);

    // process the pdb file to get the data
    pdbdatas = [];
    lines.forEach( l => {
        if (l.substr(0,4) !== 'ATOM') return;
        const d = {};
        format.forEach( f => {
            if (!f) return;  // final dummy one
            let v = l.substring(f[0] - 1, f[1]).trim();
            if (!isNaN(v)) v = +v;
            d[f[2]] = v;
        });
        pdbdatas.push(d);
    });

    // process the format and data to get the ranges
    // const ranges = myxyz.genstats(pdbdatas);
    // add our special colourby
    E.colourby.innerHTML += `<option value="pdbcol">pdbcol</option>`;


    // push data to main graphics
    // maingroup.remove(rlines);
    myxyz.setvals(pdbdatas);  // will also do a genstats
    myxyz.finalize(fid);
    
    dataToMarkersGui();
    if (fid === 'data/4bcufullCA.pdb') {
        chaindists();
        virusshow();
    }
    document.title = '3dv: ' + fid;
}
// var vdbReader = pdbReader;  // so we can read vdb files with same function

/** set up to show virus */
function virusshow() {
    E.colourbox.value = 'icol(chainn%7)';
    E.colourby.value = 'custom';
    if (usePhotoShader) {  // quick demo for Steve
        myxyz.spotsize(2);
        E.colourby.value = 'random';
    }
    dataToMarkersGui();
    if (!renderer.xr.getDevice()) orbcamera.position.z = 200;
}

/**
Hydrogen = White.
Oxygen = Red.
Chlorine = Green.
Nitrogen = Blue.
Carbon = Grey.
Sulphur = Yellow.
Phosphorus = Orange.
Other = Varies - mostly Dark Red/Pink/Maroon.
**/
/** colour PDB data by conventional colours * /
function pdbcol(d) {
    const cols = { H: col3(1,1,1), O: col3(1,0,0), N: col3(0,0,1), C: col3(0.5,0.5,0.5), S: col3(1,1,0) };
    const col = cols[d.atname[0]];
    return col || col3(1,0,1);
}
******/

let chains = [];

/** make chains based on backbone distances > l, and compute centroids and other chain stats */
function makechains(l = 5, data = pdbdatas) {
    chains = [];
    let c = -1;
    let s = new THREE.Vector3(), near=s, far=s,  i = -1;
    startc();

    function startc() {
        c++;
        s = new THREE.Vector3();
        near = new THREE.Vector3(1e9,1e9,1e9);
        far = new THREE.Vector3(0,0,0);
        chains[c] = {start: i+1, s, near, far};
    }
    for (i = 0; i < data.length; i++) {
        data[i].chainn = c;
        const posi = data[i].pos;
        s.addVectors(s, posi);
        const dummyend = i === data.length - 1;
        const d = dummyend ? 99999 : posi.distanceTo(data[i+1].pos);
        if (posi.length() < near.length()) near.copy(posi);
        if (posi.length() > far.length()) far.copy(posi);
        if (d > l) {  // complete chainn
            const ch = chains[c];
            ch.n = i - ch.start + 1;
            ch.centroid = s.multiplyScalar(1/ch.n);
            ch.end = i;
            if (!dummyend) startc();
        }
    }

    log('number of chains for separation', l, 'is',  c);
    myxyz.ranges.chainn = myxyz.genstats(data, 'chainn');
}

/** make graphics for chain as lines */
function makechainlines(pfilterfun = E.filterbox.value, pcolourfun = E.colourby.value) {
    if (chainlines && chainlines.visible === false) return;
    if (!pdbdatas) return;
    const filterfun = myxyz.makefilterfun(pfilterfun, E.filterbox);
    const colourfun = myxyz.makecolourfun(pcolourfun, E.colourby);
    if (chains.length === 0) makechains();
    var geom = new THREE.Geometry;

    const linemat = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1, linewidth: 1, vertexColors: THREE.VertexColors } );
    // maingroup.remove(chainlines);
    if (!chainlines) {
        chainlines = new THREE.LineSegments(geom, linemat);
        addToMain(chainlines, 'chainlines');
    }

    chains.forEach(chain => {
        if (filterfun && !filterfun(pdbdatas[chain.start])) return;
        for (let i = chain.start; i < chain.end; i++) {
            geom.vertices.push(pdbdatas[i].pos);
            geom.vertices.push(pdbdatas[i+1].pos);
            //const col = col3(1,1,1); // temp
            geom.colors.push(colourfun(pdbdatas[i]));
            geom.colors.push(colourfun(pdbdatas[i+1]));
        }
    });
    chainlines.geometry = geom;
}

/** expand all the chains out from their trimer, pentagon and centroid */
function expandchain(trik = 0, pentk = 0, cenk = 0) {
    if (!rlines) chaindists();
    pdbdatas.forEach(d => {
        const ch = chains[d.chainn];
        const cen = ch.centroid.clone().multiplyScalar(cenk);
        const tri = ch.tripos.clone().multiplyScalar(trik);
        const pent = ch.pentpos.clone().multiplyScalar(pentk);
        d.pos = cen.add(tri).add(pent).add(d.o_pos);
        d.x = d.pos.x;
        d.y = d.pos.y;
        d.z = d.pos.z;
    });
    dataToMarkersGui();  // << could optimize this to avoid remake
}

/** compute chain distances,
 * perform related topology to find groups
 * and draw graphics,
 * This has some distances very specific to 4bcu built in to the analysis; (in cols)
sc is scale.  1 will have the near particles on the vertices */
function chaindists(sc = 1) {
    if (chains.length === 0) makechains();
    const dds = []; // all close distances

    if (!groupgeom) {
        groupgeom = new THREE.Group();
        addToMain(groupgeom, 'pdbgroup');
    }
    groupgeom.scale.set(sc,sc,sc);
    // find the close pairs
    var linegeom = new THREE.Geometry();

    chains.forEach(c => c.close=[]);
    // cols is based on the known centroid distances for 4bcu
    const cols = { 30: col3(1,1,1), 34: col3(1,1,0), 42: col3(1,0,0), 49: col3(0,0,1) }; // colours for known lengths
    for (let i=0; i < chains.length; i++) {
        const chi = chains[i];
        for (let j=i+1; j < chains.length; j++) {
            const chj = chains[j];
            const d = chi.centroid.distanceTo(chj.centroid);
            dds.push({i, j, d});
            if (d < 50) {   // close enough to be of interest, collect the info and draw the line
                chi.close.push(j);
                chj.close.push(i);
                linegeom.vertices.push(chi.near);
                linegeom.vertices.push(chj.near);
                const colx = cols[Math.floor(d)]
                const col = colx ? colx.clone() : col3(0,1,0);
                linegeom.colors.push(col);
                linegeom.colors.push(col);
            }
        }
    }
    const linemat = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1, linewidth: 1, vertexColors: THREE.VertexColors } );
    //maingroup.remove(rlines);
    groupgeom.remove(rlines);
    rlines = new THREE.LineSegments(linegeom, linemat);
    addToMain(rlines, 'poly lines', groupgeom);

    // refine dds to get found close distances; result was used (manually) in setting up cols above
    dds.sort((a,b) => a.d - b.d);
    const ds = dds.map(s => s.d);
    const dists = ds.filter(function(v,i,a) { if(v < a[i-1]+0.2) return 0; return 1; });
    log('discrete distances found, ascending order', dists);

    // find triangles
    // classify them into types according to distances
    // group triangles into pentagons where appropriate
    // draw solid with triangles
    var trigeom = new THREE.Geometry();
    //let groups = [];
    let n = 0;
    for (let i=0; i < chains.length; i++) {
        const chi = chains[i];
        const cl = chi.close;
        const a = chi.centroid;
        cl.forEach(j => {
            const chj = chains[j];
            const b = chj.centroid;
            if (j <= i) return;
            cl.forEach(k => {
                if (k <= j) return;
                if (chj.close.indexOf(k) === -1) return;

                   const chk = chains[k];
                const c = chk.centroid;

                // classify the face, and collect pentagons if appropriate
                let chainset = new Set([i,j,k]);  // for triangle this is it, for pentagon it will be extended or replaced
                const ds = [ Math.floor(a.distanceTo(b)), Math.floor(a.distanceTo(c)), Math.floor(b.distanceTo(c))];
                const ck = ds.sort().join('');
                let col;
                switch(ck) {
                    case '304949': {             // this will be one long trianlge across pentagon
                        col=cols[30];
                        let pentagon = chi.pentagon || chj.pentagon || chk.pentagon || chainset;
                        pentagon.add(i).add(j).add(k);
                        chi.pentagon = chj.pentagon = chk.pentagon = pentagon;
                        chainset = pentagon;
                        }
                        break;
                    case '303049': return; // col=cols[30]; break;  // ignore wide triangle from pentagon, reduce overcoverage
                    case '424242':
                        chi.trimer = chj.trimer = chk.trimer = chainset;
                        col=cols[42];
                        break;    // this is a trimer (red)
                    case '303442': col=cols[49]; break;
                    default: col=cols[49]; break;
                }

                // collect the face as graphics object
                trigeom.vertices.push(chi.near); // (a);
                trigeom.vertices.push(chj.near); // b);
                trigeom.vertices.push(chk.near); // c);

                const face = new THREE.Face3(n++, n++, n++, undefined, col.clone());
                face.chainset = chainset;
                trigeom.faces.push(face);
            });
        });
    }

    // convert pentagon and trimers to arrays and compute their centres. quite a bit of duplicated work below
    for (let i=0; i < chains.length; i++) {
        const chi = chains[i];
        const tri = chi.trimer = Array.from(chi.trimer);
        chi.tripos =  tri.reduce( (a,v) => a.addVectors(a,chains[v].centroid), new THREE.Vector3()).multiplyScalar(1/3);
        const pent = chi.pentagon = Array.from(chi.pentagon);
        chi.pentpos =  pent.reduce( (a,v) => a.addVectors(a,chains[v].centroid), new THREE.Vector3()).multiplyScalar(1/5);
    }
    log('chain tripos etc computed in chaindists');

    // finish off the mesh ready for drawing
    trigeom.computeFaceNormals();
    const meshmat = new THREE.MeshPhongMaterial( { color: 0xffffff, opacity: 1, vertexColors: THREE.VertexColors, side: THREE.DoubleSide } );
    if (polygonmesh) groupgeom.remove(polygonmesh);
    polygonmesh = new THREE.Mesh(trigeom, meshmat);
    addToMain(polygonmesh, 'polygon', groupgeom);

    return dds;
}

/** raycasting */
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
document.onmousemove = onMouseMove;
document.onclick = onMouseMove;
let onMouseMove_lastface;

function onMouseMove( event ) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    if (event.target !== E.canvas || !(event.ctrlKey || event.type === 'click'))  return;
    mouse.x = ( event.offsetX / E.canvas.style.width.replace('px','') ) * 2 - 1;
    mouse.y = - ( event.offsetY / E.canvas.style.height.replace('px','') ) * 2 + 1;

    // ~~~~~~~~ each frame?
    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera( mouse, camera );
    const th = 0.2;
    raycaster.params.Points.threshold = th;
    raycaster.params.Line.threshold = th;   // ?? have the three.js rules changed ??
    // raycaster.linePrecision = th;

    // calculate objects intersecting the picking ray
    console.time('inter')
    var intersects = raycaster.intersectObjects( outerscene.children, true );
    console.timeEnd('inter')
    const num = intersects.length;
    intersects = intersects.splice(0, 10);

    //for ( var i = 0; i < intersects.length; i++ ) {
    //    //intersects[ i ].object.material.color.set( 0xff0000 );
    //
    //}
    E.msgbox.innerHTML = `hits ${num} shown ${intersects.length}. Hover for details.<br>`;
    intersects.forEach(function(ii) {
    //const ii = intersects[0];
        if (ii && ii.object === polygonmesh) {
            const face = ii.face;
            if (onMouseMove_lastface !== face) {
                if (onMouseMove_lastface)
                    onMouseMove_lastface.color.copy(onMouseMove_lastface.ocol);
                if (!face.ocol) face.ocol = face.color.clone();
                face.color.setRGB(1,1,0);
                polygonmesh.geometry.colorsNeedUpdate = true;
                const chainsa = Array.from(face.chainset);
                console.log(face, chainsa);
                E.filterbox.value = '[' + chainsa + '].includes(chainn)';
                dataToMarkersGui();
                onMouseMove_lastface = face;
            }
        }
        const xyz = ii.object.xyz;
        let frow;
        if (xyz) {
            const s = [];
            const row = xyz.datas[ii.index];
            for (const n in row) { const v = row[n]; if (typeof v !== 'object') s.push(n + ': ' + v); }
            frow = s.join('<br>');
        } else {
            frow = 'no detailed information';
        }
        E.msgbox.innerHTML += `<span>${ii.object.name}:${ii.index} ${ii.point.x.toFixed()}, ${ii.point.y.toFixed()}, ${ii.point.z.toFixed()}</span>
            <span class="help">${frow}</span><br>
        `;
   });


    // console.log(ii ? ii.object : 'nohit');
    if (onMouseMove_lastface && !intersects.length) {
        onMouseMove_lastface.color.copy(onMouseMove_lastface.ocol);
        E.filterbox.value = '';
        dataToMarkersGui();
        onMouseMove_lastface = undefined;
    }
}
