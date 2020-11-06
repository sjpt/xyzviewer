'use strict';

var THREE, Stats;

var log = console.log;

var container, stats;
var camera, renderer, controls, canvas, scene, display;
var autoClear = false;
var defaultPos = V(0,0,10);

window.onload = init;

/** initial call to read data and set up graphics */
function init() {
    container = document.body; // getElementById('container');

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 2000 );
    scene = new THREE.Scene();
    scene.add(camera);

    renderer = new THREE.WebGLRenderer( {antialias: false, alpha: true} );  // <<< without the 'antialias' the minitor canvas flashes while in VR
    if (navigator.getVRDisplays) {
        navigator.getVRDisplays().then(
        function ( displays ) {
            log('display found');
            display = displays[0];
            renderer.vr.setDevice(display);
        });
    }

    renderer.autoClear = autoClear;
    canvas = renderer.domElement;
    container.appendChild(canvas);
    canvas.id = 'canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.onclick = () => document.activeElement.blur();  // so keys such as cursor keys don't force tabbing over the gui elements

    stats = new Stats();
    container.appendChild( stats.dom );
    stats.domElement.style.bottom = 0; stats.domElement.style.top = '';

    window.addEventListener( 'resize', onWindowResize, false );

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.copy(defaultPos);

    onWindowResize();


    // controls

    controls = new THREE.TrackballControls( camera, renderer.domElement );
    //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    //controls.minDistance = 101;
    //controls.maxDistance = 500;
    // controls.maxPolarAngle = Math.PI / 2;

    const col = new THREE.Color().setStyle('white');
    light = new THREE.PointLight(col, 1);
    light.position.copy(defaultPos);
    scene.add(light);
    amb = new THREE.AmbientLight(col, 0.1);
    scene.add(amb);
    scene.background = new THREE.Color(0);


    object(scene);
    distort();

    animate();
}

var cube, mat, mesh, light, amb; // , cubeb, wire, line, sline, geom, mat, mesh;
function object(size = 1) {
    mat = new THREE.MeshStandardMaterial();
    cube = new THREE.CubeGeometry(2*size,2*size,2*size);
    mesh = new THREE.Mesh(cube, mat);

    // 1,3,4,6 are the back face, we want triangles through 6
    Object.assign(cube.faces[10], {a:1, b: 6, c: 4 });
    Object.assign(cube.faces[11], {a:6, b: 1, c: 3 });
            // cube = new THREE.BoxHelper(cube);
    //cube.geometry.attributes.position.array[0] = 2;
    // cube.material.color.setRGB( 1, 1, 1 );
    // cube.matrixAutoUpdate = true;
    scene.add(mesh);

    // point = new THREE.Mesh(new THREE.CubeGeometry(0.08,0.08,0.08));
    // point.material.color.setRGB( 0, 1, 0 );
    // point.position.set(-1,-1,-1);
    // scene.add(point);

    scene.scale.set( 1, 1, 1 );

    // mesh.quaternion.set(Math.random() * 0.7,-Math.random() * 0.7,0,1).normalize()
}

function objects(n) {
    const sc = Math.min(1, n**(-1/2.5) * 3);
    bv = new THREE.CubeGeometry(2*sc,2*sc,2*sc).vertices;

    scene.children=[light, amb];
    for (let i=0; i<n; i++) {
        object(sc);
        distort(sc);
    }
}
function V(x,y,z) {return  new THREE.Vector3(x,y,z);}

let bv = new THREE.CubeGeometry(2,2,2).vertices;
function distort(sc = 1, m = 0.7, d) {
    const q = new THREE.Quaternion(Math.random() * m,-Math.random() * m,0,1).normalize()
    const e = cube.vertices;
    e.forEach((v, i) => v.copy(bv[i]).applyQuaternion(q)); // do NOT apply to bv
    // point.position.copy(e[0]);      // 1,1,1

    let s = V(), k = 0;
    for (let i=1; i < 8; i++) {
        if (i === 6) continue;
        const r = Math.random();
        s.add(e[i].clone().multiplyScalar(r));
        k += r;
    }
    s.multiplyScalar(1/k);
    s.lerp(defaultPos, d === undefined ? (0.005 -0.3*Math.random())*sc: d);
    e[6].copy(s);

    cube.computeFlatVertexNormals();
    cube.verticesNeedUpdate = true;

    const p = mesh.position;
    p.set(8*Math.random()-4, 6*Math.random()-3, 6*Math.random()-3);
    mesh.quaternion.set(0,0,0,1);
    if (p.x > 0 && p.y > 0) mesh.rotateZ(Math.PI);
    else if (p.x <= 0 && p.y > 0) mesh.rotateZ(Math.PI/2);
    else if (p.x > 0 && p.y <= 0) mesh.rotateZ(-Math.PI/2);
    mesh.updateMatrix();
}

/** start the animation loop, managed by three.js */
function animate() {
	renderer.animate( render );
}

//var framenum = 0;
/** callback function from three.js to render each frame */
function render() {
    //framenum++;
    if (stats) stats.update();

    controls.update() // (0.1);
    // if (document.activeElement === document.body) controls.usekeys();  // use keys becuase of continuous mode
    light.position.copy(camera.position);
    renderer.render( scene, camera );
}


/** make sure camera tracks window changes */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

// document.onclick = () => distort();
document.onkeydown = evt => {
    switch (evt.key) {
        case 'Home': case 'h': camera.position.copy(defaultPos); break;
        case 'End': case 'e': camera.position.copy(defaultPos); camera.position.z *= -1; break;
        case 'r': distort(); camera.position.copy(defaultPos); break;
        case '1': for (let i=0; i<1; i++) objects(1); break;
        case '2': for (let i=0; i<1; i++) objects(3); break;
        case '3': for (let i=0; i<1; i++) objects(10); break;
        case '4': for (let i=0; i<1; i++) objects(30); break;
        case '5': for (let i=0; i<1; i++) objects(100); break;
        case '6': for (let i=0; i<1; i++) objects(300); break;
        case '7': for (let i=0; i<1; i++) objects(1000); break;
    }
}

/** set the scale in x,y,z */
// function scale(x,y=x,z=y) {
//     scene.scale.set(x,y,z);
// }

// ~~~~~~~~~~~~~~~~
// if (THREE) THREE.Matrix4.prototype.toString = function(m) {
//     return 'mat4: [' +
//        [this.elements.slice(0,4),
//        this.elements.slice(4,8),
//        this.elements.slice(8,12),
//        this.elements.slice(12,16)].map(mm=>format(mm)).join('   ')
//        + ']'
// }

