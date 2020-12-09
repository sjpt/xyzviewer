// very basic controls for VR

export {vrstart, vrframe}
import {renderer, maingroup, outerscene, controls} from "./graphicsboiler.js";
// import {THREE} from './threeH.js';

let controller1, controller2;
function vrstart() {
    controller1 = renderer.xr.getController( 0 );
    controller1.addEventListener( 'selectstart', onSelectStart );
    controller1.addEventListener( 'selectend', onSelectEnd );

    // controller1.addEventListener('select', onSessionEvent);
    // controller1.addEventListener('selectstart', onSessionEvent);
    // controller1.addEventListener('selectend', onSessionEvent);
    // controller1.addEventListener('squeeze', onSessionEvent);
    // controller1.addEventListener('squeezestart', onSessionEvent);
    // controller1.addEventListener('squeezeend', onSessionEvent);
    // controller1.addEventListener('end', onSessionEvent); // onSessionEnd);

    // controller1.addEventListener( 'connected', function ( event ) {
    //     this.add( buildController( event.data ) );
    // } );
    // controller1.addEventListener( 'disconnected', function () {
    //     this.remove( this.children[ 0 ] );
    // } );

    maingroup.add( controller1 );

    controller2 = renderer.xr.getController( 1 );
    controller2.addEventListener( 'selectstart', onSelectStart2 );
    controller2.addEventListener( 'selectend', onSelectEnd2 );
    outerscene.add( controller2 );
}

let select = false;
function onSelectStart() {
    select = true;
    // console.log('select start', e)
}
function onSelectEnd() {
    select = false;
    // console.log('select end', e)
}

function onSelectStart2() {
    controller2.attach(maingroup);
}
function onSelectEnd2() {
    outerscene.attach(maingroup);
}


// move in controller pointer direction
function vrframe() {
    let panDelta = -1, zoomDelta = -0.01;
    const session = renderer.xr.getSession();
    if (!session || session.inputSources.length === 0) return;
    // the gamepad style information such as buttons comes (when available) from the session inputSources
    const igp1 = session.inputSources[0].gamepad;
    if (!select && !igp1) return;

    const m = controller1.matrix.elements;

    let d = panDelta;
    if (igp1 && igp1.axes && igp1.buttons[2].pressed) d *= -igp1.axes[1];  // works for Vive on Chrome
    else if (!select) d = 0;                     // plain select works with very basic three.js choices
    controls.pan(-m[8]*d, m[9]*d, m[10]*d);     // -1 for x as controls.pan is designed for different use style?

    // ~~ scale
    const igp2 = session.inputSources[1].gamepad;
    if (!igp2) return;
    if (igp2.axes && igp2.buttons[2].pressed) 
        maingroup.scale.multiplyScalar(1 + zoomDelta * igp2.axes[1]);



}

// function onSessionEvent(e) {
//     console.log('sessionevent', e)
// }

// function buildController( data ) {
//     let geometry, material;
//     switch ( data.targetRayMode ) {
//         case 'tracked-pointer':
//             geometry = new THREE.BufferGeometry();
//             geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0, 0, 0, - 1 ], 3 ) );
//             geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( [ 0.5, 0.5, 0.5, 0, 0, 0 ], 3 ) );

//             material = new THREE.LineBasicMaterial( { vertexColors: true, blending: THREE.AdditiveBlending } );
//             return new THREE.Line( geometry, material );

//         case 'gaze':
//             geometry = new THREE.RingBufferGeometry( 0.02, 0.04, 32 ).translate( 0, 0, - 1 );
//             material = new THREE.MeshBasicMaterial( { opacity: 0.5, transparent: true } );
//             return new THREE.Mesh( geometry, material );
//     }
// }

