// test module data sharing
//import * as THREE from './jsdeps/three.js';
export {ttmod};
var refit;
//const THREE = window.THREE;
let { THREE, log, renderer } = window;
// ( { THREE } = window );
// get rrenderer() { return 5; }
let rr = { get function() {return 5;} }

log('testmodule THREE: ', THREE.FloatType);
log('refit', refit);
// console.log('this.refit', this.refit); // no this
console.log('self.refit', self.refit); // no this
log('window.refit', window.refit);
log('renderer in testmodule', renderer);

function ttmod() {
    log('testmodule THREE: ', THREE.FloatType);
    log('refit', refit);
    // console.log('this.refit', this.refit); // no this
    console.log('self.refit', self.refit); // no this
    log('window.refit', window.refit);
    log('renderer in testmodule', renderer);
    log('rr in testmodule', rr);
}
// window.ttmod = ttmod;
