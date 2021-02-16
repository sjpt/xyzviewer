'use strict';
// export {start, stop, map, paint, lassoGet, setrun, setColour, setFilter, lassos};
export {Lasso};  // lassos temorary?
// import {ggb} from './graphicsboiler.js'; // camera, renderer, addToMain, controls, nocamscene, maingroup
import {dataToMarkersGui, filterAdd, filterRemove} from './xyz.js';
import {THREE} from "./threeH.js";

const {X} = window;

let startx, lastx, starty, lasty; // assume these won't get confused between different lassos
const sv3 = new THREE.Vector3();

// temporary as we move to multiple xyzs etc

// end temp

//
class Lasso {
    constructor(gb) {
        this._gb = gb;
        this.flag = undefined;                                 

        this.lassos = []; // array of saved lassos, with camera. map etc, temp, temporarily limited to zero or one

        // make the mousedown etc available even when not called as this.
        // ??? is there a better pattern for this ???
        const self = this;
        this.rmousedown = e => self.mousedown(e);
        this.rmousemove = e => self.mousemove(e);
        this.rmouseup = () => self.mouseup();
        this.rdblclick = () => self.dblclick();
    }

    get gb() { return X.currentXyz.gb; }  // <<< temp, wrong


mousedown(e) {
    startx = lastx = e.offsetX, starty = lasty = e.offsetY;

    this.gb.renderer.domElement.addEventListener('mousemove', this.rmousemove);
    this.gb.renderer.domElement.addEventListener('mouseup', this.rmouseup);
    e.preventDefault();     // otherwise the double-click somehow selects msgbox text
}

setrun(c) {c ? this.start() : this.stop() }

/** paint a triangle */
paint(x1,y1, x2,y2, x3,y3, v = 0xff, type = 'xor') {
    const {size, map, mapt} = this.lassos[0];
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
    this.canvas.removeEventListener('mousemove', this.rmousemove);
    window.dispatchEvent(new Event('lassoUp'));
    dataToMarkersGui();
    // stop();
}

dblclick() {
    const {map, mapt} = this.lassos[0];
    map.fill(0);
    mapt.needsUpdate = true;
}

clear() {
    this.stop();
    this.lassos = [];
}

start(pflag = 0xff) {
    this.flag = pflag;
    const canvas = this.canvas = this.gb.renderer.domElement;
    canvas.addEventListener('mousedown', this.rmousedown);
    canvas.addEventListener('dblclick', this.rdblclick);
    this.gb.controls.enabled = false;

    // temp arrangement so we only get one lasso per Lasso
    if (this.lassos[0]) {
        // this.mesh.visible = true;
        this.gb.nocamscene.add(this.mesh);
        return this.gb.restoreview(this._saveview);
    }
    const size = new THREE.Vector2();
    this.gb.renderer.getSize(size);
    this.gb.setSize(size.x, size.y);    // get nocamcamera set up right ... NOT the correct way?
    const map = new Uint8Array(size.x * size.y);
    const mapt = new THREE.DataTexture(map, size.x, size.y, THREE.LuminanceFormat, THREE.UnsignedByteType);
    let material = new THREE.MeshBasicMaterial();
    material.transparent = true;
    material.opacity = 0.04;
    material.map = mapt;
    let geometry = new THREE.PlaneGeometry(size.x, size.y);
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(size.x/2, size.y/2, 0);
    // this.gb.addToMain(this.mesh, 'lasso_' + this.lassos.length, this.gb.nocamscene);
    this.gb.nocamscene.add(this.mesh);
    // mesh.scale.set(0.08,0.08,1)

    // compute the complete object position => screen (map) position matrix
    const totmat = this.totmat = new THREE.Matrix4();
    const m = () => new THREE.Matrix4();
    totmat.multiply(m().makeTranslation(size.x/2, size.y/2, 0));
    totmat.multiply(m().makeScale(size.x/2, size.y/2, 0));
    totmat.multiply(this.gb.camera.projectionMatrix);
    totmat.multiply(this.gb.camera.matrixWorldInverse);
    totmat.multiply(this.gb.maingroup.matrixWorld);

    this._saveview = this.gb.saveview(); // save for reestablish

    this.lassos.push({map, size, totmat, mapt, saveview: this._saveview});
}

stop() {
    this.canvas.removeEventListener('mousemove', this.rmousemove);
    this.canvas.removeEventListener('mousedown', this.rmousedown);
    this.canvas.removeEventListener('mouseup', this.rmouseup);
    this.canvas.removeEventListener('mouseup', this.rdblclick);
    // this.mesh.visible = false;
    this.gb.nocamscene.remove(this.mesh);

    
    this.gb.controls.enabled = true;
    window.dispatchEvent(new Event('lassoUp'));
    window.dispatchEvent(new Event('lassoStop'));
    dataToMarkersGui();
}


/** get the lasso value for a point x,y,z */
lassoGet(x,y,z, id=this.lassos.length-1) {
    const l = this.lassos[id];
    if (l === undefined) return 255;
    const {map, size, totmat} = l;
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
