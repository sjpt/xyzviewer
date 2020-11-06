'use strict';
import {showfirstdata} from './basic.js';

export {addToMain, framenum, makeCircle, renderer, fullcanvas,
    camera, usePhotoShader, orbcamera, outerscene};
//import {refit} from './refit.js';
const {THREE, Stats, E, log, X, col3, WEBVR} = window;
X.scale = scale;
X.init = init;


//?if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;
var camera, maingroup, outerscene, renderer,
    controls, canvas, orbcamera, camscene, display, nobutton,
    photoShader, usePhotoShader = false, light0, light1;
X.defaultDistance = 50;
var autoClear = false;

// window.onload = init;  // do in html

let i; // very odd, to check
/** initial call to read data and set up graphics */
function init() {
    // interpretSearchString();
    container = document.getElementById('container');

    X.camera = camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 2000 );
    camera.position.z = 0;
    orbcamera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 2000 );
    orbcamera.position.z = X.defaultDistance;
    camscene = new THREE.Scene();
    camscene.add(camera);

    maingroup = new THREE.Scene();
    X.maingroup = maingroup;
    maingroup.rotateX(3.14159/2);   // so we see elevation z up by default
	// scene.background = new THREE.Color( 0x505050 );
    // scene.add(camera);

    outerscene = new THREE.Scene();
    outerscene.add(maingroup);
    outerscene.fog = new THREE.FogExp2( 0x000000, 0.0008 );

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

    showfirstdata();

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
    renderer.vr.enabled = true;   // will NOT??? be overwritten frame by frame
    renderer.autoClear = autoClear;
    canvas = renderer.domElement;
    container.appendChild(canvas);
    canvas.id = 'canvas';
    canvas.style.position = 'fixed';
    canvas.onclick = () => document.activeElement.blur();  // so keys such as cursor keys don't force tabbing over the gui elements

    stats = new Stats();
    container.appendChild( stats.dom );
    stats.dom.style.bottom = '0'; stats.dom.style.top = ''

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

function addToMain(obj, name, parent = maingroup) {
    parent.add(obj);
    addvis(obj, name);
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
function fullcanvas(full = E.info.style.display !== 'none' ) {
    const s = E.info.style;
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
            const v = +(x*x + y*y < s*s/4) * 255;
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
//function vrres(k) {
//    RRRATIO = k;
//    display.requestPresent( [ { source: renderer.domElement } ] );
//}

const addvisList = {};

/** function to add visibility gui and photo swapper */
function addvis(obj, name) {
    obj.name = name;
    let item= addvisList[name];
    if (!E.photoscheck) {
        const v = `
            <b>photos:</b> <input id="photoscheck" type="checkbox" onclick="photoShader_clicked(event)"/></br>
        `
        const sp = document.createElement('span');
        sp.innerHTML = v;
        E.gui.appendChild(sp);
        // window.visibles = document.getElementById('visibles');
        // to consider, cleaner place to add 'plugins' such as photoShader
        if (photoShader && usePhotoShader) {
            E.photoscheck.checked = true; E.photoscheck.onclick();
        }

    }
    if (!item) {
        const sfid = name.split('\\').pop().split('/').pop();
        E.visibles.innerHTML += `${sfid}<input type="checkbox" checked="checked" onclick="addvis_clicked(event)" name="${sfid}"/>`
        item = addvisList[sfid] = {name: sfid, obj};
    }
    item.obj = obj;
}

/** function called on click of visibility checkbox */
function addvis_clicked(evt) {
    const src = evt.target;
    const ele = addvisList[src.name];
    ele.obj.visible = src.checked;
    if (ele.obj.xyz) window.current = ele.obj.xyz;
}
window.addvis_clicked = addvis_clicked;

/** set the sacel in x,y,z */
function scale(x,y=x,z=y) {
    maingroup.scale.set(x,y,z);
}
