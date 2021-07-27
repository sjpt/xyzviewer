'use strict';
export {pdbReader};
import {ggb} from '../graphicsboiler.js'; // addToMain
import {dataToMarkersGui, XYZ} from '../xyz.js';
import {addFileTypeHandler, queryVariables} from '../basic.js';
const {E} = window;
import {THREE} from "../threeH.js";


addFileTypeHandler('.pdb', pdbReader);
addFileTypeHandler('.vdb', pdbReader);

let chainlines;
/** @type {XYZ} */ let myxyz;

/** call pdbReader when pdb data read and ready to be parsed */
function pdbReader(data, fid) {
    myxyz = new XYZ(undefined, fid);  // will become current
    myxyz.makechainlines = makechainlines;
    const lines = data.split('\n');
    /** @type {any[][]} */
    const format = [
    // [1,4, 'atom'], //    “ATOM”        character
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
    [99,99, 'reslen']   // length of residue, will be computed later, this reserves data slots
    ];

    myxyz.tdata.prep();
    myxyz.tdata.addHeader(format.map(f => f[2]));

    // process the pdb file to get the data
    window.xxxyz = myxyz;  // debug help
    
    lines.forEach( l => {
        if (l.substr(0,4) !== 'ATOM') return;
        const d = [];
        format.forEach( f => {
            if (!f) return;  // final dummy one
            let v = l.substring(+f[0] - 1, f[1]).trim();
            if (f[2] === 'atid' && v.match(/[abcdef]/))
                v = parseInt(v, 16);
            d.push(v);
        });
        if (!(queryVariables.ca && d[1] !== 'CA'))
            myxyz.tdata.addRow(d);
    });

    // process the format and data to get the ranges
    // add our special colourby
    E.colourby.innerHTML += `<option value="pdbcol">pdbcol</option>`;


    // push data to main graphics
    // maingroup.remove(rlines);
    myxyz.tdata.finalize(fid);
    // myxyz.setField('COL', 'resname', false);

    // compute residue lengths
    const rid = myxyz.tdata.fvals.resid;
    const rlen =  myxyz.tdata.fvals.reslen;
    const rl = [];
    for (const v of rid) rl[v] = (rl[v] || 0) + 1;
    for (let i = 0; i < rlen.length; i++) rlen[i] = rl[rid[i]];
    
    // finalize will do this ... dataToMarkersGui();
    document.title = 'xyzviewer: ' + fid;
    XYZ.autorange = false;
    const r = myxyz.tdata.ranges;
    const max = Math.max(r.x.range, r.y.range, r.z.range);
    const ggg = ggb();
    ggg.defaultDistance = max*2;
    ggg.camera.far = max*5; // ? should this be somehwere more generic
    ggg.camera.updateProjectionMatrix();
    ggg.outerscene.fog.density = 1- 0.5**(1/ggg.defaultDistance)
    ggg.defaultFov = 50;
    ggg.home();
    myxyz.setPointSize(2);

    myxyz.dataToMarkersGui();
    return myxyz;
}
// var vdbReader = pdbReader;  // so we can read vdb files with same function

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

/** make graphics for chain as lines; this joins atoms in the order of the pdb file,  * NOT full pairs  
 * It can do sensible backbone if ca option is specified in queryVariables
 * TODO: if we want to use this seriously we need to keep additional information and make sensible chains
 * */
async function makechainlines(pfilterfun = E.filterbox.value, maxd2 = 800) {
    if (chainlines && chainlines.visible === false) return;
    const tdata = myxyz.tdata;
    if (!tdata.fvals) return;
    const filterfun = await myxyz.makefilterfun(pfilterfun, E.filterbox);
    var geom = new THREE.BufferGeometry(), vertices = [], colors = [];


    const linemat = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1, linewidth: 1, vertexColors: true }); // THREE.VertexColors } );
    // maingroup.remove(chainlines);
    if (!chainlines) {
        chainlines = new THREE.LineSegments(geom, linemat);
        ggb().addToMain(chainlines, 'chainlines');
    }

    const xc = tdata.fvals['x'], yc = tdata.fvals['y'], zc = tdata.fvals['z'];

    for (let i = 0; i < tdata.n - 1; i++) {
        if (myxyz.tdata.val('chain', i) !== myxyz.tdata.val('chain', i+1)) continue;
        // patch missing data ... maybe clearer not to
        // if (residc[i] !== residc[i+1] && residc[i]+1 !== residc[i+1]) continue;
        // if ((xc[i]-xc[i+1])**2 + (xc[i]-xc[i+1])**2 + (xc[i]-xc[i+1])**2 > maxdsq) continue;
        const x = xc[i], y = yc[i], z = zc[i];
        const x1 = xc[i+1], y1 = yc[i+1], z1 = zc[i+1];
        if (maxd2 && (x-x1)**2 + (y-y1)**2 + (z-z1)**2 > maxd2) continue;

        myxyz._col.setRGB(0.3, 0.3, 0.3);
        if (filterfun) if (!filterfun(myxyz, i, tdata.fvals)) continue;
        const col1 = myxyz._col.clone();
        myxyz._col.setRGB(0.3, 0.3, 0.3);
        if (filterfun) if (!filterfun(myxyz, i+1, tdata.fvals)) continue;
        const col2 = myxyz._col.clone();

        vertices.push(x, y, z, x1, y1, z1);
        colors.push(col1.r, col1.g, col1.b);
        colors.push(col2.r, col2.g, col2.b);
    }
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));

    chainlines.geometry = geom;
}

