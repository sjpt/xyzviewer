// this is not included in runtime.  Here to help typescript-like type checking.
interface MyExternals {
    THREE,  Stats, style, pdbReader, vdbReader, init,
    killev, icol, csvReader, geojsonReader,
    photoShader_clicked, addvis_clicked, spotsize, xexpbutton, expbutton, addFileTypeHandler, fileTypeHandlers, log,
    scale, maingroup, dataToMarkersGui, defaultDistance, col3, rgb, hsv, filtergui, posturiasync, refit, addscript,
    currentXyz, currentThreeObj, readply, WEBVR, ascgeom, ascmesh, plygeometry, plyobj, plymaterial, camera, cube, cubemesh, ascReader,
    enumI, enumF
    W:Window, X:MyExternals, E:MyElements;
}
interface Window extends MyExternals {};

var W = window as Window;
var E = window as MyElements;
var X = window as MyExternals;
interface MyElements {
    gui, canvas, filterbox, msgbox, visibles, photoscheck, info, colourbox, colourby, filterr, fileChooser,
    colourpick

}
interface Element { blur; }

interface EventTarget { result; }