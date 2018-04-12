'use strict';

var container, stats;
var camera, outerscene, renderer, particles, geometry, materials = [], parameters, i, h,
    color, sprite, size, refit, WEBVR, controls, canvas, camscene, display, nobutton, showfirstdata;
var log = console.log;
var defaultDistance = 50;
var autoClear = true;

window.onload = init;

/** initial call to read data and set up graphics */
function init() {

    // container = document.getElementById('container');
    container = document.body;

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 2000 );
    camera.position.z = 2;
    camscene = new THREE.Scene();
    camscene.add(camera);

    outerscene = new THREE.Scene();

    geometry = new THREE.Geometry();
    var sprite1;
    var textureLoader = new THREE.TextureLoader();
    sprite1 = textureLoader.load( "../xyz/sprites/circle.png" );

    sprite = sprite1;
    size   = 1;
    // materials[i] = new THREE.PointsMaterial( { size: size, map: sprite, /**blending: THREE.AdditiveBlending, **/ depthTest: true, transparent : true, alphaTest: 0.3, vertexColors: THREE.VertexColors } );
    materials[i] = new THREE.PointsMaterial( { size  } );

    particles = new THREE.Points( new THREE.Geometry(), materials[i] );
    addvis(particles, 'particles');
    outerscene.add( particles );

    renderer = new THREE.WebGLRenderer( {antialias: false} );  // <<< without the 'antialias' the minitor canvas flashes while in VR
    navigator.getVRDisplays().then(
    function ( displays ) {
        log('display found');
        display = displays[0];
        renderer.vr.setDevice(display);
    });

    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.vr.enabled = true;   // will be overwritten frame by frame
    renderer.autoClear = autoClear;
    canvas = renderer.domElement;
    container.appendChild(canvas);
    canvas.id = 'canvas';

    stats = new Stats();
    container.appendChild( stats.dom );

    document.addEventListener( 'keydown', onDocumentKeyDown, false );
    if (!nobutton && WEBVR) document.body.appendChild( WEBVR.createButton( renderer ) );
    animate();
}

/** start the animation loop, managed by three.js */
function animate() {
	renderer.animate( render );
}

var framenum = 0;
/** callback function from three.js to render each frame */
function render() {
    framenum++;
    if (stats) stats.update();
    if (outerscene.children.length) {
        renderer.render( outerscene, camera );
    } else {  // temporary alternative for performance debug
        if (renderer.autoClear) renderer.clear();
        display.submitFrame();
    }
}

/** onkyedown only used so far to support 'Q' for toggling gui information */
function onDocumentKeyDown(evt) {
    const k = String.fromCharCode(evt.keyCode);
    // console.log('key', k);
    if (k === 'Q') fullcanvas();
    if (evt.key === 'F2') {
        display.requestPresent( [ { source: renderer.domElement } ] );
    }
    if (evt.key === 'F4') {
        display.exitPresent();
    }
}


/** change VR resolution, 1 is 1080x1200 per eye, 1.4 is 'standard' for Vive */
function vrres(k) {
    RRRATIO = k;
    display.requestPresent( [ { source: renderer.domElement } ] );
}


/** function to add visibility gui */
function addvis(obj, name) {
    obj.name = name;
    let item= addvis.list[name];
    if (!window.visibles) {
        gui.innerHTML = "<b>visible: </b><span id='visibles'></span><br>" + gui.innerHTML;
        window.visibles = document.getElementById('visibles');
    }
    if (!item) {
        visibles.innerHTML += `${name}<input type="checkbox" checked="checked" onclick="addvis.clicked(event)" name="${name}"/>`
        item = addvis.list[name] = {name, obj};
    }
    item.obj = obj;
}

/** function called on click of visibility checkbox */
addvis.clicked = function(evt) {
    const src = evt.target;
    addvis.list[src.name].obj.visible = src.checked;
}
addvis.list = {};
