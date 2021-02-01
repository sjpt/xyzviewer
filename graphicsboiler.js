'use strict';

window.lastModified.graphicsboiler = `Last modified: 2021/01/31 20:21:30
`; console.log('>>>>graphicsboiler.js');
import {log} from './basic.js';
import {VRButton} from './jsdeps/VRButton.js';
import {setPointSize, col3} from './xyz.js';
import {THREE} from "./threeH.js";
import {} from "./raycast.js";

import {OrbitControls} from './jsdeps/OrbitControls.js';
import {vrstart, vrframe} from './vrcontrols.js';
export {ggb, GraphicsBoiler};


// export {addToMain, framenum, makeCircle, this.renderer as renderer, fullcanvas, this.maingroup, this.nocamscene as nocamscene, setxyzspeechupdate, 
//     setBackground, setHostDOM, setSize,
//     this.camera as camera, this.usePhotoShader as usePhotoShader, this.orbcamera as orbcamera, this.outerscene as outerscene, plan, elevation, scale, addvis_clicked, select, this.controls as controls, onWindowResize};
const {E, X, Stats} = window;
let gbid = 0;

//?if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
class GraphicsBoiler {
    constructor(id = 'gb' + gbid++) {
        this.id = id;
        this.init();
    }

// this.xyzcontainer
// let this.stats;
// let this.camera, this.main3group, this.outerscene, this.renderer,
//     this.controls, this.canvas, this.orbcamera, this.camscene, display,
//     this.usePhotoShader = false, this.light0, this.light1;
//const this.nocamcamera = new THREE.OrthographicCamera(0, 200, 100, 0, -100, 100);
//const this.nocamscene = new THREE.Scene(); this.nocamscene.name = this.id + 'nocamscene';
// let this.autoClear = false;
// let this.xyzspeechupdate;        // called each frame for speech control. ? todo arrange event mechanism
setxyzspeechupdate(f) {this.xyzspeechupdate = f;}

// window.onload = init;  // do in html

//?? let i; // very odd, to check
/** initial call to read data and set up graphics */
init() {
    const self = this;
    X.defaultDistance = 50;
    this.framenum = 0;
    this.addvisList = {};

    // make sure all spotsize elements ready for appropriate events
    document.getElementsByName('spotsize').forEach(e => {
        e.onmouseenter = (e) => setPointSize(e, 'in'); 
        e.onmouseleave = (e) => setPointSize(e, 'out'); 
        e.onclick = setPointSize;
    });

    // interpretSearchString();
    this.xyzcontainer = document.getElementById('xyzcontainer');

    this.nocamcamera = new THREE.OrthographicCamera(0, 200, 100, 0, -100, 100);
    this.nocamscene = new THREE.Scene(); this.nocamscene.name = this.id + 'nocamscene';
    this.autoClear = false;


    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 2000 ); this.camera.name = this.id + 'camera';
    this.camera.position.z = 0;
    this.orbcamera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 2000 ); this.orbcamera.name = this.id + 'orbcamera';
    this.orbcamera.position.z = X.defaultDistance;
    this.camscene = new THREE.Scene(); this.camscene.name = this.id + 'camscene';
    this.camscene.add(this.camera);

    this.maingroup = new THREE.Group(); this.maingroup.name = this.id + 'maingroup';
    this.maingroup.rotateX(3.14159/2);   // so we see elevation z up by default
	// scene.background = new THREE.Color( 0x505050 );
    // scene.add(camera);

    this.outerscene = new THREE.Scene(); this.outerscene.name = this.id + 'outerscene';
    this.outerscene.add(this.maingroup);
    this.outerscene.fog = new THREE.FogExp2( 0x000000, 0.0008 );

    // prepare lights to help the mesh (currently fixed as camera moves)
    this.outerscene.remove(this.light0);
    this.light0 = new THREE.DirectionalLight(col3(1,1,1), 1);
    this.light0.target.position.set(0,0,0);
    this.light0.position.set(1,1,-1);
    this.outerscene.add(this.light0);

    this.outerscene.remove(this.light1);
    this.light1 = new THREE.DirectionalLight(col3(1,1,1), 1);
    this.light1.target.position.set(0,0,0);
    this.light1.position.set(-1,-1,1);
    this.outerscene.add(this.light1);
    this.vrdisplay = undefined;

    // showfirstdata();

    this.renderer = new THREE.WebGLRenderer( {antialias: false, alpha: true, preserveDrawingBuffer: false} );  
    // <<< without the 'antialias' setting the monitor canvas flashes while in VR
    // preserveDrawingBuffer can help copy image to another canvas
    //   but if done at once it is not needed
    if (navigator.getVRDisplays) {
        navigator.getVRDisplays().then(
        function ( displays ) {
            log('display found');
            self.vrdisplay = displays[0];
            self.renderer.xr.setDevice(self.vrdisplay);
        });
    }

    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.renderer.xr.enabled = true;   // will NOT??? be overwritten frame by frame
    this.renderer.autoClear = this.autoClear;
    this.canvas = this.renderer.domElement;
    this.xyzcontainer.appendChild(this.canvas);
    this.canvas.id = 'xyzcanvas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.onclick = () => document.activeElement.blur();  // so keys such as cursor keys don't force tabbing over the gui elements

    if (Stats) {
        this.stats = new Stats();
        this.xyzcontainer.appendChild( this.stats.dom );
        this.stats.dom.style.bottom = '0'; this.stats.dom.style.top = ''
    }

    document.addEventListener( 'keydown', this.onDocumentKeyDown, false );

    this.maingroup.scale.set(1,1,1);
    window.addEventListener( 'resize', this.onWindowResize, false );

    if (OrbitControls) {
        this.controls = new OrbitControls(this.orbcamera, this.renderer.domElement);
        this.controls.autoRotate = false;  // was is_webgl
    }

    // three.js default (at 106) is 'local-floor', which should be supported but is not on Chrome 79.0.3942.0 and 81.0.4006.0
    if (this.renderer.xr.setReferenceSpaceType)
        this.renderer.xr.setReferenceSpaceType('local'); // ('bounded-floor');

    
//    setTimeout(() => {  // temp test for startup with esbuild
        document.body.appendChild(VRButton.createButton(this.renderer));
        this.animate();
//    }, 100);
}   // init

// add an object to parent, default this.maingroup, and add a selection/visibility icon
addToMain(obj, name, parent = this.maingroup, xyz) {
    parent.add(obj);
    this.addvis(obj, name, xyz);
}

/** start the animation loop, managed by three.js */
animate() {
	this.renderer.setAnimationLoop( () => this.render() );
}

/** callback from three.js to render each frame */
render() {
    this.framenum++;
    if (this.stats) this.stats.update();
    vrframe();
    /**********/
    // If we are not presenting we don't want the VR headset camera to override nonVR navigation
    // We still need more navigation for VR, and smooth handover between nonVR and VR.
    // renderer.xr.enabled = renderer.xr.getDevice() && renderer.xr.getDevice().isPresenting;

    if (this.controls) {
        this.controls.update(); // ??? (0.1);
        if (document.activeElement === document.body) this.controls.usekeys();  // use keys becuase of continuous mode
        this.orbcamera.updateMatrix(); // orbcamera.updateMatrixWorld();
        if (this.xyzspeechupdate) this.xyzspeechupdate();
    }
    //    outerscene.matrixAutoUpdate = false;
    //    outerscene.matrix.getInverse(orbcamera.matrix);
    //    outerscene.matrixWorldNeedsUpdate = true;
    this.camscene.matrixAutoUpdate = false;
    this.camscene.matrix.fromArray(this.orbcamera.matrix.elements);
    this.camscene.matrixWorldNeedsUpdate = true;
    this.camscene.updateMatrixWorld(true);

    /***********/
    this.renderer.clear();   // if three.js does not see anything it doesn't clear???
    this.renderer.render( this.outerscene, this.camera );
    if (this.nocamscene.children.length !== 0) {
        //nocamcamera.right = window.innerWidth; //   // ??? now done on resize() ?
        //nocamcamera.top = window.innerHeight;
        //nocamcamera.updateProjectionMatrix();
        this.renderer.render(this.nocamscene, this.nocamcamera);
    }
    // test w.i.p. 31/01/2021 towards multiple canvas MLV
    // const ctx = E.testcanvas.getContext('2d');
    // ctx.clearRect(0,0,999999999999,9999999);
    // ctx.drawImage(this.renderer.domElement,0,0)
}   // render

/** onkyedown only used so far to support 'Q' for toggling gui information */
onDocumentKeyDown(evt) {
    const k = String.fromCharCode(evt.keyCode);
    // console.log('key', k);
    if (k === 'Q') this.fullcanvas();
    if (evt.key === 'F2') {
        this.vrdisplay.requestPresent( [ { source: this.renderer.domElement } ] );
    }
    if (evt.key === 'F4') {
        this.vrdisplay.exitPresent();
    }
}

/** show the full canvas */
fullcanvas(full = E.info.style.display !== 'none' ) {
    E.info.style.display = full ? 'none' : '';
    E.ack.style.display = E.info.style.display
    // canvas.style.top = full ? '0' : '0';
    this.canvas.focus();
}

/** make sure camera tracks window changes */
onWindowResize() {
    let w, h;
    if (this.renderer.domElement.parentElement.id === 'xyzcontainer') {  // standalone xyz
        w = window.innerWidth; h = window.innerHeight;
    } else {                                                        // xyz owned by some other app
        const hhh = this.renderer.domElement.parentElement;
        w = hhh.offsetWidth; h = hhh.offsetHeight;
    }
    this.setSize(w, h);
}

// /** make a circle */
// makeCircle(s = 64) {
//     var d = new Uint8Array(s * s * 4);
//     let i = 0;
//     for (let x = -s/2 + 0.5; x < s/2; x++) {
//         for (let y = -s/2 + 0.5; y < s/2; y++) {
//             const v = +(x*x + y*y < s*s/4) * 255;
//             d[i++] = v;
//             d[i++] = v;
//             d[i++] = v;
//             d[i++] = v;
//         }
//     }

//     var texture = new THREE.DataTexture(d, s, s, THREE.RGBAFormat,
//         THREE.UnsignedByteType, undefined,
//         THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.NearestFilter, 1);
//     texture.needsUpdate = true;
//     return texture;
// }

/** set the background */
setBackground(r = 0, g = r, b = r, alpha = 1) {
    this.renderer.setClearColor(new THREE.Color(r, g, b));
    this.renderer.setClearAlpha(alpha);
}

setSize(w, h) {
    if (w[0]) [w, h] = w;
    this.camera.aspect = w/h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize( w, h );

    this.nocamcamera.right = w;
    this.nocamcamera.top = h;
    this.nocamcamera.updateProjectionMatrix();
}

/** to add visibility gui and photo swapper */
addvis(obj, bname, xyz) {
    let name;
    // make a new name if needed for duplicate load
    for(let i = 0; i < 20; i++) {
        name = this.id + bname + (i===0 ? '' : '_'+i);
        if (!this.addvisList[name]) break;
    }
    obj.name = this.id + name;
    const sfid = name.split('\\').pop().split('/').pop();
    E.visibles.innerHTML += `
        <span id="${name}_k" onclick="GG.gb.select('${name}')">${sfid}:</span>
        <span class="help">click on the item to select for filter/colour etc selection</span>
        <input type="checkbox" checked="checked" id="${name}_cb" onclick="GG.gb.addvis_clicked(event)" name="${name}"/>
        <span class="help">make item visible/invisible</span>
    `;
    // attempt to add them later and avoid global GG.gb can sometimes create them,
    // only to have them taken away again soon after.
    // const cbs = () => {
    //     if ((!E[`${name}_k`]) || (!E[`${name}_cb`])) return setTimeout(cbs,10);
    //     E[`${name}_k`].onclick = () => select(name);
    //     E[`${name}_cb`].onclick = event => addvis_clicked(event);
    // }
    // cbs();

    // const item = 
    this.addvisList[name] = {name, sfid, obj, xyz};
    //?item.obj = obj;
    if (xyz) {
        //?item.xyz = xyz;
        xyz.name = this.id + name;
        xyz.sfid = sfid;
    }
}

/** select given object, w.i.p */
select(fid, xyz) {
    for (const f in this.addvisList)
        E[f+'_k'].style.color = f === fid ? 'lightgreen' : 'white';
    const avl = this.addvisList[fid];
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
            if (xyz.material) xyz.setPointSize(guiset.spotsize)
            // E['spot'+guiset.spotsize].checked = true;
        }
    }
}

/** called on click of visibility checkbox */
addvis_clicked(evt) {
    const src = evt.target;
    const ele = this.addvisList[src.name];
    ele.obj.visible = src.checked;
    //window.currentThreeObj = ele.obj;
    //if (ele.obj.xyz) window.currentXyz = ele.obj.xyz;
}

/** set the sacel in x,y,z */
scale(x,y=x,z=y) {
    this.maingroup.scale.set(x,y,z);
}


// helpers, global
plan() {
    this.maingroup.rotation.set(0,0,0);
    this.home();
}

elevation() {
    this.maingroup.rotation.set(Math.PI/2,0,0);
    this.home();
}

home() {
    this.controls.home();
}


} // end class

let ggb;
function start() {
    console.log('document loaded');
    E.lastmod.textContent = window.lastModified.xyzhtml;
    ggb = new GraphicsBoiler();
    vrstart();

    // ggb.init();
    // setTimeout(init, 1000); // temp test for esbuild
}

if (document.readyState === 'complete' || document.readyState === 'interactive')
    start(); 
else
    document.onload = start;
document.addEventListener("DOMContentLoaded",()=>{console.log('DOMContentLoaded loaded')});

// convenience for matrix display
// to use in DevTools, settings/Preferences/Console/Enable custom formatters
// @ts-ignore
window.devtoolsFormatters = [{
    header: function(obj) {
        return obj.isMatrix4 ? ['div', {}, obj.toString()] : null  },
    hasBody: ()=>false
    }]

THREE.Matrix4.prototype.toString = function(sep = '   ') {
    const mm = Array.from(this.elements).map(e => ' ' + e.toFixed(3).replace('.000', ''));
    return 'mat4:' + sep + '[' +
       [mm.slice(0,4),
       mm.slice(4,8),
       mm.slice(8,12),
       mm.slice(12,16)].join(sep)
       + ']'
}
