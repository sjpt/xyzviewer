'use strict';

window.lastModified.graphicsboiler = `Last modified: 2020/12/05 14:05:22
`; console.log('>>>>graphicsboiler.js');
import {showfirstdata} from './basic.js';
import {VRButton} from './jsdeps/VRButton.js';
import {spotsizeset, col3} from './xyz.js';
//const  {THREE} = window; // 
import {THREE} from "./threeH.js";
import {} from "./raycast.js";

import {OrbitControls} from './jsdeps/OrbitControls.js';


export {addToMain, framenum, makeCircle, renderer, fullcanvas,
    camera, usePhotoShader, orbcamera, outerscene, plan, elevation, scale, addvis_clicked, select, controls, THREE};
const {E, log, X, Stats} = window;

//?if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;
var camera, maingroup, outerscene, renderer,
    controls, canvas, orbcamera, camscene, display,
    usePhotoShader = false, light0, light1;
X.defaultDistance = 50;
var autoClear = false;

// window.onload = init;  // do in html

let i; // very odd, to check
/** initial call to read data and set up graphics */
function init() {
    // make sure all spotsize elements ready for appropriate events
    document.getElementsByName('spotsize').forEach(e => {
        e.onmouseenter = (e) => spotsizeset(e, 'in'); 
        e.onmouseleave = (e) => spotsizeset(e, 'out'); 
        e.onclick = spotsizeset;
    });

    // interpretSearchString();
    container = document.getElementById('container');

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 2000 );
    camera.position.z = 0;
    orbcamera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 2000 );
    orbcamera.position.z = X.defaultDistance;
    camscene = new THREE.Scene();
    camscene.add(camera);

    maingroup = new THREE.Scene();
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
            renderer.xr.setDevice(display);
        });
    }

    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.xr.enabled = true;   // will NOT??? be overwritten frame by frame
    renderer.autoClear = autoClear;
    canvas = renderer.domElement;
    container.appendChild(canvas);
    canvas.id = 'canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.onclick = () => document.activeElement.blur();  // so keys such as cursor keys don't force tabbing over the gui elements

    stats = new Stats();
    container.appendChild( stats.dom );
    stats.dom.style.bottom = '0'; stats.dom.style.top = ''

    document.addEventListener( 'keydown', onDocumentKeyDown, false );

    maingroup.scale.set(1,1,1);
    window.addEventListener( 'resize', onWindowResize, false );

    if (OrbitControls) {
        controls = new OrbitControls(orbcamera, renderer.domElement);
        controls.autoRotate = false;  // was is_webgl
    }

    // three.js default (at 106) is 'local-floor', which should be supported but is not on Chrome 79.0.3942.0 and 81.0.4006.0
    if (renderer.xr.setReferenceSpaceType)
        renderer.xr.setReferenceSpaceType('local'); // ('bounded-floor');

    document.body.appendChild(VRButton.createButton(renderer));
    animate();
    // ?? Object.assign(X, {controls, orbcamera, camera, maingroup, renderer }); // mainly for debug
}

// add an object to parent, default maingroup, and add a selection/visibility icon
function addToMain(obj, name, parent = maingroup, xyz) {
    parent.add(obj);
    addvis(obj, name, xyz);
}

/** start the animation loop, managed by three.js */
function animate() {
	renderer.setAnimationLoop( render );
}

var framenum = 0;
/** callback function from three.js to render each frame */
function render() {
    framenum++;
    if (stats) stats.update();
    // if (!da tas) return; // not ready yet
/**********/
    // If we are not presenting we don't want the VR headset camera to override nonVR navigation
    // We still need more navigation for VR, and smooth handover between nonVR and VR.
    // renderer.xr.enabled = renderer.xr.getDevice() && renderer.xr.getDevice().isPresenting;

    if (controls) {
        controls.update(0.1);
        if (document.activeElement === document.body) controls.usekeys();  // use keys becuase of continuous mode
        orbcamera.updateMatrix(); // orbcamera.updateMatrixWorld();
        if (X.xyzspeechupdate) X.xyzspeechupdate();
    }
//    outerscene.matrixAutoUpdate = false;
//    outerscene.matrix.getInverse(orbcamera.matrix);
//    outerscene.matrixWorldNeedsUpdate = true;
camscene.matrixAutoUpdate = false;
camscene.matrix.fromArray(orbcamera.matrix.elements);
camscene.matrixWorldNeedsUpdate = true;
camscene.updateMatrixWorld(true);
/***********/
//if (outerscene.children.length) {
    renderer.clear();   // if three.js does not see anything it doesn't clear???
    renderer.render( outerscene, camera );
// } else {  // temporary alternative for performance debug
//     if (renderer.autoClear) renderer.clear();
//     display.submitFrame();
// }
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
    E.info.style.display = full ? 'none' : '';
    E.ack.style.display = E.info.style.display
    // canvas.style.top = full ? '0' : '0';
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

const addvisList = {};

/** function to add visibility gui and photo swapper */
function addvis(obj, bname, xyz) {
    let name;
    // make a new name if needed for duplicate load
    for(let i = 0; i < 20; i++) {
        name = bname + (i===0 ? '' : '_'+i);
        if (!addvisList[name]) break;
    }
    obj.name = name;
    const sfid = name.split('\\').pop().split('/').pop();
    E.visibles.innerHTML += `
        <span id="${name}_k" onclick="GX.gb.select('${name}')">${sfid}:</span>
        <span class="help">click on the item to select for filter/colour etc selection</span>
        <input type="checkbox" checked="checked" id="${name}_cb" onclick="GX.gb.addvis_clicked(event)" name="${name}"/>
        <span class="help">make item visible/invisible</span>
    `;
    // attempt to add them later and avoid global GX.gb can sometimes create them,
    // only to have them taken away again soon after.
    // const cbs = () => {
    //     if ((!E[`${name}_k`]) || (!E[`${name}_cb`])) return setTimeout(cbs,10);
    //     E[`${name}_k`].onclick = () => select(name);
    //     E[`${name}_cb`].onclick = event => addvis_clicked(event);
    // }
    // cbs();

    // const item = 
    addvisList[name] = {name, sfid, obj, xyz};
    //?item.obj = obj;
    if (xyz) {
        //?item.xyz = xyz;
        xyz.name = name;
        xyz.sfid = sfid;
    }
}

/** select given object, w.i.p */
function select(fid, xyz) {
    for (const f in addvisList)
        E[f+'_k'].style.color = f === fid ? 'lightgreen' : 'white';
    const avl = addvisList[fid];
    // if (!avl) return;      // try to select before ready ???
    log('sselect', fid, avl);
    if (avl) X.currentThreeObj = avl.obj;
    xyz = xyz || avl.xyz;
    if (xyz) {
        X.currentXyz = xyz;  // this logic need thought
        const guiset = xyz.guiset;
        if (guiset) {
            E.colourby.value = guiset.colourby;
            E.filterbox.value = guiset.filterbox;
            E.colourpick.value = guiset.colourpick;
            if (xyz.material) xyz.spotsizeset(guiset.spotsize)
            // E['spot'+guiset.spotsize].checked = true;
        }
    }
}

/** function called on click of visibility checkbox */
function addvis_clicked(evt) {
    const src = evt.target;
    const ele = addvisList[src.name];
    ele.obj.visible = src.checked;
    //window.currentThreeObj = ele.obj;
    //if (ele.obj.xyz) window.currentXyz = ele.obj.xyz;
}

/** set the sacel in x,y,z */
function scale(x,y=x,z=y) {
    maingroup.scale.set(x,y,z);
}


// helpers, global
function plan() {
    maingroup.rotation.set(0,0,0);
    home();
}

function elevation() {
    maingroup.rotation.set(Math.PI/2,0,0);
    home();
}

function home() {
    controls.home();
}

const start = ()=>{
    console.log('document loaded');
    E.lastmod.textContent = window.lastModified.xyzhtml;
    init();
};
if (document.readyState === 'complete')
    start(); 
else
    document.onload = start;
document.addEventListener("DOMContentLoaded",()=>{console.log('DOMContentLoaded loaded')});
