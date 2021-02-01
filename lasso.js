'use strict';
// export {start, stop, map, paint, lassoGet, setrun, setColour, setFilter, lassos};
export {Lasso, lassos, setrun, setFilter, setColour, lassoGet};  // lassos temorary?
// import {ggb} from './graphicsboiler.js'; // camera, renderer, addToMain, controls, nocamscene, maingroup
import {dataToMarkersGui, filterAdd, filterRemove} from './xyz.js';
import {THREE} from "./threeH.js";

let startx, lastx, starty, lasty; // assume these won't get confused between different lassos
const sv3 = new THREE.Vector3();

// temporary as we move to multiple xyzs etc
const lassos = [];
function setrun(c) { return glasso.setrun(c) }
function setFilter(bool) { return glasso.setFilter(bool); }
function setColour(bool) { return glasso.setColour(bool); }
function lassoGet(x,y,z, id=glasso.lassos.length-1) { return glasso.lassoGet(x,y,z,id); }


// end temp

//
class Lasso {
    constructor(gb) {
        this._gb = gb;
        this.size = new THREE.Vector2();
        this.flag = undefined;                                 

        // let map, mapt, size = new THREE.Vector2(), startx, starty, lastx, lasty, flag, canvas;
        this.lassos = lassos;   // temporary
        // this.lassos = [];  // array of saved lassos, with camera. map etc
    }

    get gb() { return window.currentXyz.gb; }  // <<< temp, wrong


mousedown(e) {
    startx = lastx = e.offsetX, starty = lasty = e.offsetY;

    this.gb.renderer.domElement.addEventListener('mousemove', e => this.mousemove(e));
    this.gb.renderer.domElement.addEventListener('mouseup', () => this.mouseup());
    e.preventDefault();     // otherwise the double-click somehow selects msgbox text
}

setrun(c) {c ? this.start() : this.stop() }

/** paint a triangle */
paint(x1,y1, x2,y2, x3,y3, v = 0xff, type = 'xor') {
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
            const o = (this.size.y - y) * this.size.x + x;
            if (type === 'xor')
                this.map[o] ^= v;
            else
                this.map[o] = v;
        }
    }
    this.mapt.needsUpdate = true;
}

mousemove(e) {
    let nowx = e.offsetX, nowy = e.offsetY;
    const r = () => 0.5; // 0.027; // Math.random;
    let v = this.flag, type = 'set';
    if (e.ctrlKey || e.buttons === 4) type = 'xor';
    else if (e.altKey || e.buttons === 2) v = 0;

    this.paint(nowx, nowy + r(), lastx, lasty + r(), startx, starty + r(), v, type);
    lastx = nowx; lasty = nowy;
    if (e.shiftKey) {
        dataToMarkersGui();
    }
}

mouseup() {
    window.dispatchEvent(new Event('lassoUp'));
    this.canvas.removeEventListener('mousemove', this.mousemove);
    dataToMarkersGui();
    // stop();
}

dblclick() {
    this.map.fill(0);
    this.mapt.needsUpdate = true;
}

start(pflag = 0xff) {
    this.flag = pflag;
    const canvas = this.canvas = this.gb.renderer.domElement;
    canvas.addEventListener('mousedown', e => this.mousedown(e));
    canvas.addEventListener('dblclick', () => this.dblclick());
    this.gb.controls.enabled = false;

    this.gb.renderer.getSize(this.size);
    this.gb.setSize(this.size.x, this.size.y);    // get nocamcamera set up right ... NOT the correct way?
    this.map = new Uint8Array(this.size.x * this.size.y);
    this.mapt = new THREE.DataTexture(this.map, this.size.x, this.size.y, THREE.LuminanceFormat, THREE.UnsignedByteType);
    let material = new THREE.MeshBasicMaterial();
    material.transparent = true;
    material.opacity = 0.04;
    material.map = this.mapt;
    let geometry = new THREE.PlaneGeometry(this.size.x, this.size.y);
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(this.size.x/2, this.size.y/2, 0);
    this.gb.addToMain(mesh, 'lasso_' + this.lassos.length, this.gb.nocamscene);
    // mesh.scale.set(0.08,0.08,1)

    // compute the complete object position => screen (map) position matrix
    const totmat = new THREE.Matrix4();
    const m = () => new THREE.Matrix4();
    totmat.multiply(m().makeTranslation(this.size.x/2, this.size.y/2, 0));
    totmat.multiply(m().makeScale(this.size.x/2, this.size.y/2, 0));
    totmat.multiply(this.gb.camera.projectionMatrix);
    totmat.multiply(this.gb.camera.matrixWorldInverse);
    totmat.multiply(this.gb.maingroup.matrixWorld);

    this.lassos.push({map: this.map, size: this.size, totmat, mapt: this.mapt})
}

stop() {
    this.canvas.removeEventListener('mousemove', this.mousemove);
    this.canvas.removeEventListener('mousedown', this.mousedown);
    this.canvas.removeEventListener('mouseup', this.mouseup);
    this.canvas.removeEventListener('mouseup', this.dblclick);
    
    this.gb.controls.enabled = true;
    window.dispatchEvent(new Event('lassoStop'));
    dataToMarkersGui();

}


/** get the lasso value for a point x,y,z,  */
lassoGet(x,y,z, id=this.lassos.length-1) {
    const {map, size, totmat} = this.lassos[id];
    sv3.set(x,y,z).applyMatrix4(totmat);
    sv3.x = Math.round(sv3.x);
    sv3.y = Math.round(sv3.y);

    if (sv3.x < 0 || sv3.x >= size.x || sv3.y < 0 || sv3.y >= size.y) return 0;
    return map[sv3.x + sv3.y * size.x];
}

setColour(bool) {
    (bool ? filterAdd : filterRemove)('VX(0.5 + _L/255 * 0.5);', true);
}

setFilter(bool) {
    (bool ? filterAdd : filterRemove)('?_L', true);    
}

}   // end class Lasso

let glasso = new Lasso();
