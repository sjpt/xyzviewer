'use strict';
//?if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;
var camera, maingroup, outerscene, renderer, particles, geometry, materials = [], parameters, i, h,
    color, sprite, size, refit, WEBVR, controls, canvas, orbcamera, camscene, display, nobutton, showfirstdata,
    photoShader, usePhotoShader = false;
var log = console.log;
var defaultDistance = 50;
var autoClear = false;

window.onload = init;

/** initial call to read data and set up graphics */
function init() {

    interpretSearchString();
    container = document.getElementById('container');

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 2000 );
    camera.position.z = 0;
    orbcamera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 2000 );
    orbcamera.position.z = defaultDistance;
    camscene = new THREE.Scene();
    camscene.add(camera);

    maingroup = new THREE.Scene();
    maingroup.rotateX(3.14159/2);   // so we see elevation z up by default
	// scene.background = new THREE.Color( 0x505050 );
    // scene.add(camera);

    outerscene = new THREE.Scene();
    outerscene.add(maingroup);
    outerscene.fog = new THREE.FogExp2( 0x000000, 0.0008 );

    geometry = new THREE.Geometry();

    // options for sprite1:
    // 1: load as image defined in html, will not work for file: from chrome unless you set the flag --allow-file-access-from-files will do it but inconvenient
    // 2: load as image using textureLoader, will not work for file: from chrome as for 1
    // 3: load from base4, seems to work always, but not very convenient
    // 4: leave undefined, we see squares of approriate size on screen
    var sprite1;
    if (location.href.startsWith('file:') || navigator.userAgent.indexOf("Edge") > -1) {
        // Chrome is too fussy with file: loading, so use this instead
        // the data was converted from circle.png using https://www.base64-image.de/
        // Edge did not assume sprite subdirectory authenticated even when higher level one OK
        var image = new Image();
        image.src = 'data:image/png;base64,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'
        sprite1 = new THREE.Texture();
        sprite1.image = image;
        image.onload = function() { sprite1.needsUpdate = true; };
    } else {
        var textureLoader = new THREE.TextureLoader();
        sprite1 = textureLoader.load( "../xyz/sprites/circle.png" );
    }
    // sprite1 = makeCircle();

    parameters = [
        [ sprite1, 0.3 ] /**,  // we may want multiple markers later so leave this as reminder
        [ sprite3, 15 ],
        [ sprite2, 10 ],
        [ sprite5, 8 ],
        [ sprite4, 5 ] /**/
    ];

    for ( i = 0; i < 1 /** parameters.length **/; i ++ ) {

        sprite = parameters[i][0];
        size   = parameters[i][1];
        materials[i] = new THREE.PointsMaterial( { size: size, map: sprite, /**blending: THREE.AdditiveBlending, **/ depthTest: true, transparent : true, alphaTest: 0.3, vertexColors: THREE.VertexColors } );
        particles = new THREE.Points( new THREE.Geometry(), materials[i] );
        addvis(particles, 'particles');
        maingroup.add( particles );
    }

    if (showfirstdata) showfirstdata();

    renderer = new THREE.WebGLRenderer( {antialias: false, alpha: true} );  // <<< without the 'antialias' the minitor canvas flashes while in VR
    if (navigator.getVRDisplays) {
        navigator.getVRDisplays().then(
        function ( displays ) {
            log('display found');
            display = displays[0];
            renderer.vr.setDevice(display);
        });
    }

    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.vr.enabled = true;   // will be overwritten frame by frame
    renderer.autoClear = autoClear;
    canvas = renderer.domElement;
    container.appendChild(canvas);
    canvas.id = 'canvas';
    canvas.style.position = 'fixed';
    canvas.onclick = () => document.activeElement.blur();  // so keys such as cursor keys don't force tabbing over the gui elements

    stats = new Stats();
    container.appendChild( stats.dom );

    document.addEventListener( 'keydown', onDocumentKeyDown, false );

    maingroup.scale.set(1,1,1);
    window.addEventListener( 'resize', onWindowResize, false );

    if (THREE.OrbitControls) {
        controls = new THREE.OrbitControls(orbcamera, renderer.domElement);
        controls.autoRotate = false;  // was is_webgl
    }

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
    // if (!datas) return; // not ready yet
/**********/
    // If we are not presenting we don't want the VR headset camera to override nonVR navigation
    // We still need more navigation for VR, and smooth handover between nonVR and VR.
    // renderer.vr.enabled = renderer.vr.getDevice() && renderer.vr.getDevice().isPresenting;

    if (controls) {
        controls.update(0.1);
        if (document.activeElement === document.body) controls.usekeys();  // use keys becuase of continuous mode
        orbcamera.updateMatrix(); // orbcamera.updateMatrixWorld();
    }
//    outerscene.matrixAutoUpdate = false;
//    outerscene.matrix.getInverse(orbcamera.matrix);
//    outerscene.matrixWorldNeedsUpdate = true;
camscene.matrixAutoUpdate = false;
camscene.matrix.fromArray(orbcamera.matrix.elements);
camscene.matrixWorldNeedsUpdate = true;
camscene.updateMatrixWorld(true);
/***********/
if (outerscene.children.length) {
    renderer.render( outerscene, camera );
} else {  // temporary alternative for performance debug
    if (renderer.autoClear) renderer.clear();
    display.submitFrame();
}
// renderer.context.viewport(0, 0, 3024, 1680);
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

/** show the full canvas */
function fullcanvas(full = window.info.style.display !== 'none' ) {
    const s = window.info.style;
    s.display = full ? 'none' : '';
    canvas.style.top = full ? '0' : '';
    canvas.focus();
}

/** make sure camera tracks window changes */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

/** make a circle */
function makeCircle(s = 64) {
    var d = new Uint8Array(s * s * 4);
    for (let x = -s/2 + 0.5; x < s/2; x++) {
        for (let y = -s/2 + 0.5; y < s/2; y++) {
            const v = (x*x + y*y < s*s/4) * 255;
            d[i++] = v;
            d[i++] = v;
            d[i++] = v;
            d[i++] = v;
        }
    }

    var texture = new THREE.DataTexture(d, s, s, THREE.RGBAFormat,
        THREE.UnsignedByteType, undefined,
        THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.NearestFilter, 1);
    texture.needsUpdate = true;
    return texture;
}

/** change VR resolution, 1 is 1080x1200 per eye, 1.4 is 'standard' for Vive */
function vrres(k) {
    RRRATIO = k;
    display.requestPresent( [ { source: renderer.domElement } ] );
}


/** function to add visibility gui and photo swapper */
function addvis(obj, name) {
    obj.name = name;
    let item= addvis.list[name];
    if (!window.visibles) {
        const v = `
            <b>visible: </b><span id="visibles"></span><br>
            <b>photos: <input id="photoscheck" type="checkbox" onclick="photoShader.clicked(event)"/></br>
        `
        gui.innerHTML = v + gui.innerHTML;
        window.visibles = document.getElementById('visibles');
        // to consider, cleaner place to add 'plugins' such as photoShader
        if (photoShader && usePhotoShader) {
            photoscheck.checked = true; photoscheck.onclick();
        }

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
