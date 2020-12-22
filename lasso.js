'use strict';
export {start, stop, map, paint, lassoGet, setrun, setColour, setFilter};
import {camera, renderer, addToMain, controls, nocamscene, maingroup} from './graphicsboiler.js';
import {dataToMarkersGui, filterAdd, filterRemove} from './xyz.js';
const {E} = window;
import {THREE} from "./threeH.js";

let map, mapt, size = new THREE.Vector2(), startx, starty, lastx, lasty, flag, canvas;
const lassos = [];  // array of saved lassos, with camera. map etc

function mousedown(e) {
    startx = lastx = e.offsetX, starty = lasty = e.offsetY;

    renderer.domElement.addEventListener('mousemove', mousemove);
    renderer.domElement.addEventListener('mouseup', mouseup);
    e.preventDefault();     // otherwise the double-click somehow selects msgbox text
}

function setrun(c) {c ? this.start() : this.stop() }

/** paint a triangle */
function paint(x1,y1, x2,y2, x3,y3, v = 0xff, type = 'xor') {
    const miny = Math.min(y1, y2, y3), maxy = Math.max(y1, y2, y3);
    // console.log('paint', x1,y1, x2,y2, x3,y3, 'y...', miny, maxy, Math.ceil(miny), Math.ceil(maxy))
    for (let y = Math.ceil(miny); y < Math.ceil(maxy); y++) {
        let minx = Infinity, maxx = -Infinity;
        if ((y1 < y && y <= y2) || (y1 >= y && y > y2)) {
            let x = x1 + (x2 - x1) * (y - y1) / (y2 - y1);
            minx = Math.min(minx, x); maxx = Math.max(maxx, x);
        }
        if ((y1 < y && y <= y3) || (y1 >= y && y > y3)) {
            let x = x1 + (x3 - x1) * (y - y1) / (y3 - y1);
            minx = Math.min(minx, x); maxx = Math.max(maxx, x);
        }
        if ((y2 < y && y <= y3) || (y2 >= y && y > y3)) {
            let x = x2 + (x3 - x2) * (y - y2) / (y3 - y2);
            minx = Math.min(minx, x); maxx = Math.max(maxx, x);
        }
        for (let x = Math.ceil(minx); x < Math.ceil(maxx); x++) {
            const o = (size.y - y) * size.x + x;
            if (type === 'xor')
                map[o] ^= v;
            else
                map[o] = v;
        }
    }
    mapt.needsUpdate = true;
}

function mousemove(e) {
    let nowx = e.offsetX, nowy = e.offsetY;
    const r = () => 0.5; // 0.027; // Math.random;
    let v = flag, type = 'set';
    if (e.ctrlKey || e.buttons === 4) type = 'xor';
    else if (e.altKey || e.buttons === 2) v = 0;

    paint(nowx, nowy + r(), lastx, lasty + r(), startx, starty + r(), v, type);
    lastx = nowx; lasty = nowy;
    if (e.shiftKey) {
        dataToMarkersGui();
        E.filterbox.value = E.filterbox.value = "COLX: lasso ? 'white' : 'green'";
    }
}

function mouseup() {
    canvas.removeEventListener('mousemove', mousemove);
    // stop();
}

function dblclick() {
    map.fill(0);
    mapt.needsUpdate = true;
}

function start(pflag = 0xff) {
    flag = pflag;
    canvas = renderer.domElement;
    canvas.addEventListener('mousedown', mousedown);
    canvas.addEventListener('dblclick', dblclick);
    controls.enabled = false;

    renderer.getSize(size);
    map = new Uint8Array(size.x * size.y);
    mapt = new THREE.DataTexture(map, size.x, size.y, THREE.LuminanceFormat, THREE.UnsignedByteType);
    let material = new THREE.MeshBasicMaterial();
    material.transparent = true;
    material.opacity = 0.1;
    material.map = mapt;
    let geometry = new THREE.PlaneGeometry(size.x, size.y);
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(size.x/2, size.y/2, 0);
    addToMain(mesh, 'lasso_' + lassos.length, nocamscene);
    // mesh.scale.set(0.08,0.08,1)

    // compute the complete object position => screen (map) position matrix
    const totmat = new THREE.Matrix4();
    const m = () => new THREE.Matrix4();
    totmat.multiply(m().makeTranslation(size.x/2, size.y/2, 0));
    totmat.multiply(m().makeScale(size.x/2, size.y/2, 0));
    totmat.multiply(camera.projectionMatrix);
    totmat.multiply(camera.matrixWorldInverse);
    totmat.multiply(maingroup.matrixWorld);

    lassos.push({map, size, totmat})
}

function stop() {
    canvas.removeEventListener('mousemove', mousemove);
    canvas.removeEventListener('mousedown', mousedown);
    canvas.removeEventListener('mouseup', mouseup);
    canvas.removeEventListener('mouseup', dblclick);
    
    controls.enabled = true;
    if (E.filterbox.value.indexOf('lasso') === -1) 
        E.filterbox.value = '?lasso\n' + E.filterbox.value;
    dataToMarkersGui();

}

const sv3 = new THREE.Vector3();
// const sv3a = new THREE.Vector3();

/** get the lasso value for a point x,y,z,  */
function lassoGet(x,y,z, id=lassos.length-1) {
    const {map, size, totmat} = lassos[id];
    sv3.set(x,y,z).applyMatrix4(totmat);
    sv3.x = Math.round(sv3.x);
    sv3.y = Math.round(sv3.y);

    if (sv3.x < 0 || sv3.x >= size.x || sv3.y < 0 || sv3.y >= size.y) return 0;
    return map[sv3.x + sv3.y * size.x];
}

function setColour(bool) {
    (bool ? filterAdd : filterRemove)('VX(0.5 + _L * 0.5);', true);
}

function setFilter(bool) {
    (bool ? filterAdd : filterRemove)('?_L');    
}

/*
l = await import('./lasso.js'); l.start()
map = l.map
material = mesh.material
mapt = material.map
map.fill(0); mapt.needsUpdate = true
mesh.scale.set(0.08,0.08,1)
map.fill(0); mapt.needsUpdate = true
map.fill(0); mapt.needsUpdate = true
k=2; for (i=0; i<20; i+=k) {
    l.paint(0,0, 400, i, 400,i+k); l.map.filter(x=>x);  mapt.needsUpdate = true
}


map.fill(0);
l.paint(400,200, 800, 200, 600,180);
l.paint(400,200, 800, 200, 600,220);


l.paint(0,0, 400, 400, 400,0); l.map.filter(x=>x);  mapt.needsUpdate = true
l.paint(0,0, 400, 50, 400,100); l.map.filter(x=>x);  mapt.needsUpdate = true
l.paint(0,0, 400, 50, 400,100); l.map.filter(x=>x);  mapt.needsUpdate = true

 *  */
