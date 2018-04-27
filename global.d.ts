// this is not included in runtime.  Here to help typescript-like type checking.
interface MyExternals {
    THREE,  Stats, style, pdbReader, vdbReader,
    killev, cvsReader, icol, csvReader, geojsonReader,
    photoShader_clicked, addvis_clicked, spotsize, xexpbutton, expbutton, addFileTypeHandler, fileTypeHandlers, log,
    scale, maingroup, dataToMarkersGui, defaultDistance, col3, rgb, hsv, filtergui, posturiasync, refit, addscript,
    current, readply, WEBVR,
    W:Window, X:MyExternals, E:MyElements;
}
interface Window extends MyExternals {};

let W = window as Window;
let E = window as MyElements;
let X = window as MyExternals;
interface MyElements {
    gui, canvas, filterbox, msgbox, visibles, photoscheck, info, colourbox, colourby, filterr, fileChooser,
    colourpick

}
interface Element { blur; }

interface EventTarget { result; }