// speech input for xyz
//
import {OrganicSpeech} from './speech.js';
import {orbcamera, plan, elevation, controls} from './graphicsboiler.js';
const {E} = window;
//OrganicSpeech.commands = {};
//OrganicSpeech.replace = {};

{
    let mode = '';
    let rate = 1;
    let panrate = 0.1;
    let o = OrganicSpeech;
    let c = o.commands;
    'forward back left right up down'.split(' ').forEach(k => c[k] = () => mode = k);
    c.stop = c.newsound = () => mode = '';
    c.faster = () => rate *= 2;
    c.slower = () => rate /= 2;
    c.elevation = () => elevation()
    c.plan = () => plan()
    c['go to centre'] = () => orbcamera.position.set(0,0,0)
    c['go to outside'] = () => orbcamera.position.set(0,0,30)
    c['look at centre'] = () => controls.target.set(0,0,0)

    window.xyzspeechupdate = () => {
        try {
            switch(mode) {
                case 'forward': controls.panForward(-rate * panrate); break;
                case 'back': controls.panForward(rate * panrate); break;
                case 'left': controls.panLeft(rate * panrate); break;
                case 'right': controls.panLeft(-rate * panrate); break;
                case 'up': controls.panUp(rate * panrate); break;
                case 'down': controls.panUp(-rate * panrate); break;
            }
        } catch (e) {
            console.error('bad command', mode, e);
        }
    }

    E.speechhelp.innerHTML = `
Check box for speech input.<br>
Available commands:<br>
<ul><li>
${Object.keys(c).join('</li><li>')}
</li></ul>
`
}

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


