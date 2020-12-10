// speech input for xyz
//
import {OrganicSpeech} from './speech.js';
import {orbcamera, plan, elevation, controls, maingroup, setxyzspeechupdate, renderer, camera} from './graphicsboiler.js';
import {THREE} from './threeH.js';
const {E} = window;
//OrganicSpeech.commands = {};
OrganicSpeech.replace = {4: 'for', fore: 'for', forward: 'for', forwards: 'for'};
let zoomDelta=0.01;

let mode = '';
let rate = 1;
let panrate = 0.05;
let o = OrganicSpeech;
let c = o.commands;
'for back left right up down bigger smaller'.split(' ').forEach(k => c[k] = () => mode = k);
c.stop = c.newsound = () => mode = '';
c.faster = () => rate *= 2;
c.slower = () => rate /= 2;
c.elevation = () => elevation()
c.plan = () => plan()
c['go to centre'] = () => { orbcamera.position.set(0,0,0); controls.target.set(0,0,-1); }
c['go to outside'] = () => orbcamera.position.set(0,0,30)
c['look at centre'] = () => controls.target.set(0,0,0)

let vrmat;
const imat = new THREE.Matrix4();
const mat3 = new THREE.Matrix3();
const v3 = new THREE.Vector3();
setxyzspeechupdate( () => {
    if (!mode) return;
    if (renderer.xr.isPresenting && !vrmat)
        vrmat = renderer.xr.getCamera(camera).cameras[0].matrix;
    mat3.setFromMatrix4(renderer.xr.isPresenting ? vrmat : imat);
    const r = rate*panrate;
    try {
        switch(mode) {
            case 'for': controls.pan3(v3.set(0,0,-r).applyMatrix3(mat3)); break;
            case 'back': controls.pan3(v3.set(0,0,r).applyMatrix3(mat3)); break;
            case 'left':  controls.pan3(v3.set(-r,0,0).applyMatrix3(mat3)); break;
            case 'right': controls.pan3(v3.set(r,0,0).applyMatrix3(mat3)); break;
            case 'up': controls.pan3(v3.set(0,r,0).applyMatrix3(mat3)); break;
            case 'down': controls.pan3(v3.set(0,-r,0).applyMatrix3(mat3)); break;
            case 'bigger': maingroup.scale.multiplyScalar(1 + zoomDelta); break;
            case 'smaller': maingroup.scale.multiplyScalar(1 - zoomDelta); break;
        }
    } catch (e) {
        console.error('bad command', mode, e);
    }
});

    E.speechhelp.innerHTML = `
Check box for speech input.<br>
Available commands:<br>
<ul><li>
${Object.keys(c).join('</li><li>')}
</li></ul>
`

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// not really speech, but to help with phones
function touch(event) {
    if (!event || event.touches.length >= 4) {
        const s = E.gui.style;
        const sb = E.speechbox.style;
        if (s.fontSize) {
            s.fontSize = ''; s.transform=''; s.transformOrigin=''
            sb.transform = ''
        } else {
            s.fontSize = '40%'; s.transform='scale(6)'; s.transformOrigin='top left'
            sb.transform = 'scale(2)';  sb.transformOrigin='top left'
        }
    }
}
window.document.addEventListener( 'touchstart', touch, false );


/**
 * note: 
 * to change camera position,  orbcamera.position.set(x,y,z)
 * to change look at,          
 * 
 */


