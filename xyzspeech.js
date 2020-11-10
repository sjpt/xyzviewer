// speech input for xyz
//  
var OrganicSpeech, controls, maingroup, orbcamera;
//OrganicSpeech.commands = {};
//OrganicSpeech.replace = {};

{
    let mode = '';
    let rate = 1;
    let panrate = 0.1;
    let o = OrganicSpeech;
    let c = o.commands;
    'forward back left right up down'.split(' ').forEach(k => c[k] = () => mode = k);
    c.stop = () => mode = '';
    c.faster = () => rate *= 2;
    c.slower = () => rate /= 2;
    c.elevation = () => maingroup.rotation.set(Math.PI/2,0,0)
    c.plan = () => maingroup.rotation.set(0,0,0)
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

    window.speechhelp.innerHTML = `
Check box for speech input.<br>
Available commands:<br>
<ul><li>
${Object.keys(c).join('</li><li>')}
</li></ul>
`
}

/**
 * note: 
 * to change camera position,  orbcamera.position.set(x,y,z)
 * to change look at,          
 * 
 */


