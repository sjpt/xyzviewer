window.lastModified.threeH = `Last modified: 2021/03/25 16:53:37
`;
// everyone can import THREE from here using  'import {THREE} from "./threeH.js";'
// which helps ensure everyone is using the same THREE as we switch to modules
// and that we can switch all THREE references at this single point.
//
// The main issue with importing three as a module is that the module version
// does not contain complete THREE type information because of the way it is built,npm 
// and so gives a huge number of extraneous error messages.
//
// I haven't found a way to arrange 'import' at runtime 
// but use other source for type information within VSCode.
//
export {THREE};
const {X} = window, {THREE} = X; console.log('>>>>threeH.js global');// this behaves best for now, 13/12/2020
//import * as THREE from "./jsdeps/three126.module.js"; console.log('>>>>threeH.js module');     // gives lots of compiler errors

// import * as THREE from "./jsdeps/three127.js"; console.log('>>>>threeH.js module');     // gives lots of compiler errors

// import * as THREE from "three";
//import * as THREE from "./node_modules/three/build/three.module.js";  // gives lots of compiler errors as above
/// <reference path="node_modules/three/src/Three.d.ts" /> // this seems to be there anyway for THREE from window.
//import * as THREE from "./node_modules/three/src/Three";  // compiles ok but no THREE at runtime

// var xx = new THREE.Scene(); xx.add(); // x.fred(); // test only


/*
experiment on import
<script src="jsdeps/stats.min.js"></script>
<script src="jsdeps/js-yaml.js"></script>
<script src="jsdeps/math.js"></script>
<script src="main.js"></script>
<script src="gldebug.js"></script> 
*/

// import * as xx1 from "./jsdeps/js-yaml.js";
// import * as xx2 from "./jsdeps/math.js";
// import * as xx3 from "./main.js";
// import * as xx4 from "./gldebug.js";

