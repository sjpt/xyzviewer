// speech input for xyz
//  
var OrganicSpeech, controls, maingroup;
//OrganicSpeech.commands = {};
//OrganicSpeech.replace = {};

{
    let mode = '';
    let rate = 1;
    let panrate = 0.1;
    let o = OrganicSpeech;
    o.commands.forward = () => mode = 'forward';
    o.commands.back = () => mode = 'back';
    o.commands.stop = () => mode = '';
    o.commands.faster = () => rate *= 2;
    o.commands.slower = () => rate /= 2;
    o.commands.elevation = () => maingroup.rotation.set(Math.PI/2,0,0)
    o.commands.plan = () => maingroup.rotation.set(0,0,0)

    window.xyzspeechupdate = () => {
        switch(mode) {
            case 'forward': controls.panForward(-rate * panrate); break;
            case 'back': controls.panForward(rate * panrate); break;
        }
    }
}




