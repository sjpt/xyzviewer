// this is not included in runtime.  Here to help typescript-like type checking.
//     W:Window, X:MyExternals, E:MyElements;
// }

// effected by .eslintrc.yaml, settings.json, tsconfig.json (if present), jsconfig.json (if not tsconfig.json)
//
// We can see what pollution globals we have introduced using a call globalPollution() in dev tools.
//
interface MyExternals {
    COLS,               // no longer needed for gui for COLS.set, but needed for scope of filter expressions
    // OrganicSpeech,      // gui

    currentXyz, currentThreeObj, 
    defaultDistance,    // tweak
    proxy,              // tweak, only instanced if set eg in dev tools
    raywidth,           // tweak, only instanced if set eg in dev tools
    xyzspeechupdate,    // should be moved and clarified
    jsyaml,  // from dependencies
    webkitSpeechRecognition
}
interface Window {lastModified; DxfParser; Stats; GG};  // THREE here not X, just more convenient
declare var WA: any, W: Window, E: MyElements, X: MyExternals;

// these are dom elements referred to by id
interface MyElements {
    gui, canvas, filterbox, msgbox, visibles, photoscheck, info, filterr, fileChooser, colkey,
    colourpick, filedropbox, colourby, filtcount, ack, speechhelp, speechbox, lastmod
}
interface Element { blur }

interface EventTarget { result; }

// current issues 4/12/2020: grid,  xyz, raycast, pdbreader, persp, plyreader, ascreader

// experiments getting our 'extensions' permitted
//class Face3 extends Face3{ocol; chainset; xyz;}

// experiments getting three module type checking right
//import * as THREE from "./jsdeps/three121.module";
//interface PointsMaterial extends Material{};
//interface Scene extends Object3D{};
//interface Scene {add};
