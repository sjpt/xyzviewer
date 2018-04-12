'use strict';

var pdbdatas, polygonmesh, rlines, light0, light1, groupgeom, chainlines;

/** call pdbReader when pdb data read and ready to be parsed */
var pdbReader = function(data, fid) {
    const lines = data.split('\n');
    const format = [
    [1,4, 'atom'], //	“ATOM”		character
    [7,11, 'atid'], //	Atom serial number	right	integer
    [13,16, 'atname'], //	Atom name	left*	character
    [17,17, 'altloc'], //	Alternate location indicator		character
    [18,20, 'resname'], // §	Residue name	right	character
    [22,22, 'chain'], // 	Chain identifier		character
    [23,26, 'resid'], // 	Residue sequence number	right	integer
    //[27,27, 'insert'], // 	Code for insertions of residues		character
    [31,38, 'x'], // 	X orthogonal Å coordinate	right	real (8.3)
    [39,46, 'y'], // 	Y orthogonal Å coordinate	right	real (8.3)
    [47,54, 'z'], // 	Z orthogonal Å coordinate	right	real (8.3)
    //[55,60,	'occupancy'], // Occupancy	right	real (6.2)
    [61,66,	'tempfac'], // Temperature factor	right	real (6.2)
    //[73,76,	'segid'], // Segment identifier¶	left	character
    //[77,78, 'elesym'], // 	Element symbol	right	character
    0]; format.pop();                     // dummy to make ending , easier

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
    ranges = genstats(pdbdatas);
    // add our special colourby
    document.getElementById('colourby').innerHTML += `<option value="pdbcol">pdbcol</option>`;


    // push data to main graphics
    maingroup.remove(rlines);
    datas = pdbdatas;
    try {
        dataToMarkersGui();
    } catch(e) {
        dataToMarkers();
    }
    document.title = '3dv: ' + fid;
    virusshow();
}
var vdbReader = pdbReader;  // so we can read vdb files with same function

/** set up to show virus */
function virusshow() {
    chaindists();
    colourbox.value = 'icol(chainn%7)';
    colourby.value = 'custom';
	if (usePhotoShader) {  // quick demo for Steve
		spotsize(2);
		colourby.value = 'random';
    }
    dataToMarkersGui();
    if (!renderer.vr.getDevice()) orbcamera.position.z = 200;


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
/** colour PDB data by conventional colours */
function pdbcol(d) {
    const cols = { H: col3(1,1,1), O: col3(1,0,0), N: col3(0,0,1), C: col3(0.5,0.5,0.5), S: col3(1,1,0) };
    const col = cols[d.atname[0]];
    return col || col3(1,0,1);
}

let chains = [];

/** make chains based on backbone distances > l, and compute centroids and other chain stats */
function makechains(l = 5, data = datas) {
    chains = [];
    let c = -1;
    let near, far, s, i = -1;
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
    ranges.chainn = genstats(data, 'chainn');
}

/** make graphics for chain as lines */
function makechainlines(pfilterfun = filterbox.value, pcolourfun = colourby.value) {
	if (chainlines && chainlines.visible === false) return;
    const filterfun = makefilterfun(pfilterfun);
    const colourfun = makecolourfun(pcolourfun);
    if (chains.length === 0) makechains();
    var geom = new THREE.Geometry;

    const linemat = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1, linewidth: 1, vertexColors: THREE.VertexColors } );
    maingroup.remove(chainlines);
    chainlines = new THREE.LineSegments(geom, linemat); addvis(chainlines, 'chainlines');
    maingroup.add(chainlines);

    chains.forEach(chain => {
    	if (filterfun && !filterfun(datas[chain.start])) return;
    	for (let i = chain.start; i < chain.end; i++) {
    		geom.vertices.push(datas[i].c_pos);
    		geom.vertices.push(datas[i+1].c_pos);
    		const col = col3(1,1,1); // temp
			geom.colors.push(colourfun(datas[i]));
			geom.colors.push(colourfun(datas[i+1]));
    	}
    });
}

/** expand all the chains out from their trimer, pentagon and centroid */
function expandchain(trik = 0, pentk = 0, cenk = 0) {
    if (chains.length === 0) makechains();
    datas.forEach(d => {
    	const ch = chains[d.chainn];
    	const cen = ch.centroid.clone().multiplyScalar(cenk);
    	const tri = ch.tripos.clone().multiplyScalar(trik);
    	const pent = ch.pentpos.clone().multiplyScalar(pentk);
    	d.c_pos = cen.add(tri).add(pent).add(d.pos);
    	d.c_x = d.c_pos.x;
    	d.c_y = d.c_pos.y;
    	d.c_z = d.c_pos.z;
	});
    dataToMarkersGui();  // << could optimize this to avoid remake
}

/** dynamic expansion, todo add easier scripting */
function folddemo(tt = 10000, gap = 2000) {
	if (!ranges || !ranges.atom) {
        posturiasync('data/4bcufullCA.pdb',
        	(d,f) => { pdbReader(d,f); folddemo(); });
        spotsize(5);
        return;
	}
    orbcamera.position.set(0,0,250);
    fullcanvas(true);

    if (!folddemo.st) requestAnimationFrame(foldframe);
    folddemo.st = Date.now();
    function foldframe() {
    	const t = Date.now() - folddemo.st;
    	if (t > 2 * tt + gap) { expandchain(0,0); folddemo.st = undefined; return; }
    	if (t < tt) {
    		const dt = t / tt;
    		expandchain(0.5 + 0.5 * dt, 0.5 - 0.5 * dt);
    	} else if (t > tt + gap) {
    		const dt = (t - tt - gap) / tt;
    		 expandchain(1-dt, 0);
    	}
    	requestAnimationFrame(foldframe);
    }
}

var expbutton = document.createElement('button');
gui.appendChild(expbutton);
expbutton.textContent = 'fold demo';
expbutton.onclick = () => folddemo();

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
        maingroup.add(groupgeom);
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
                const col = cols[Math.floor(d)].clone();
                linegeom.colors.push(col);
                linegeom.colors.push(col);
            }
        }
    }
    const linemat = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1, linewidth: 1, vertexColors: THREE.VertexColors } );
    maingroup.remove(rlines);
    groupgeom.remove(rlines);
    rlines = new THREE.LineSegments(linegeom, linemat); addvis(rlines, 'poly lines');
    groupgeom.add(rlines);

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
    let groups = [];
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
                    case '304949':              // this will be one long trianlge across pentagon
                        col=cols[30];
                        let pentagon = chi.pentagon || chj.pentagon || chk.pentagon || chainset;
                        pentagon.add(i).add(j).add(k);
                        chi.pentagon = chj.pentagon = chk.pentagon = pentagon;
                        chainset = pentagon;
                        break;
                    case '303049': return; // col=cols[30]; break;  // ignore wide triangle from pentagon, reduce overcoverage
                    case '424242':
                    	chi.trimer = chj.trimer = chk.trimer = chainset;
						col=cols[42];
                    	break;	// this is a trimer (red)
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


    // finish off the mesh ready for drawing
    trigeom.computeFaceNormals();
    const meshmat = new THREE.MeshPhongMaterial( { color: 0xffffff, opacity: 1, vertexColors: THREE.VertexColors, side: THREE.DoubleSide } );
    if (polygonmesh) groupgeom.remove(polygonmesh);
    polygonmesh = new THREE.Mesh(trigeom, meshmat); addvis(polygonmesh, 'polygon');
    groupgeom.add(polygonmesh);

    // prepare lights to help the mesh (currently fixed as camera moves)
    outerscene.remove(light0);
    light0 = new THREE.DirectionalLight(col3(1,1,1), 1);
    light0.target.position.set(0,0,0);
    light0.position.set(1,1,-1);
    outerscene.add(light0);

    outerscene.remove(light1);
    light1 = new THREE.DirectionalLight(col3(1,1,1), 1);
    light1.target.position.set(0,0,0);
    light1.position.set(-1,-1,1);
    outerscene.add(light1);

    return dds;
}

/** raycasting */
var raycaster = new THREE.Raycaster();
raycaster.linePrecision=0.1;
var mouse = new THREE.Vector2();
document.onmousemove = onMouseMove;

function onMouseMove( event ) {
	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components
	if (event.target !== canvas || ! event.ctrlKey) return;
	mouse.x = ( event.offsetX / canvas.style.width.replace('px','') ) * 2 - 1;
	mouse.y = - ( event.offsetY / canvas.style.height.replace('px','') ) * 2 + 1;

    // ~~~~~~~~ each frame?
	// update the picking ray with the camera and mouse position
	raycaster.setFromCamera( mouse, camera );

	// calculate objects intersecting the picking ray
	var intersects = raycaster.intersectObjects( outerscene.children, true );

	//for ( var i = 0; i < intersects.length; i++ ) {
	//	//intersects[ i ].object.material.color.set( 0xff0000 );
    //
	//}
    const ii = intersects[0];
	if (ii && ii.object === polygonmesh) {
		const face = ii.face;
		if (onMouseMove.lastface !== face) {
			if (onMouseMove.lastface)
				onMouseMove.lastface.color.copy(onMouseMove.lastface.ocol);
			if (!face.ocol) face.ocol = face.color.clone();
			face.color.setRGB(1,1,0);
			polygonmesh.geometry.colorsNeedUpdate = true;
			const chainsa = Array.from(face.chainset);
			console.log(face, chainsa);
			filterbox.value = '[' + chainsa + '].includes(chainn)';
			dataToMarkersGui();
			onMouseMove.lastface = face;
		}
	}
	msgbox.innerHTML = 'hit at ' + (ii ? ii.object.name : 'nohit') + '  t=' + Date.now();
	// console.log(ii ? ii.object : 'nohit');
	if (onMouseMove.lastface && !ii) {
		onMouseMove.lastface.color.copy(onMouseMove.lastface.ocol);
		filterbox.value = '';
		dataToMarkersGui();
		onMouseMove.lastface = undefined;
	}
}