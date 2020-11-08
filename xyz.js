'use strict';
import {addToMain} from './graphicsboiler.js';
import {makechainlines, pdbReader} from './pdbreader.js';
window.lastModified.xyz = `Last modified: 2020/11/08 20:58:59
`

export {
    centrerange, // for draw centre consistency
    spotsize,
    dataToMarkersGui,
    // particles, // for subclass pdbreader, and particles for photoshader
    XYZ,
    stdcols, stdcol,
    csvReader
};
// temporary below
// let filtergui;


const {THREE, addFileTypeHandler, E, X, col3} = window;
X.xyzs = {};
const {log} = window;
const stdcols = [
    col3(0.5, 0.5, 0.5),
    col3(1,0,0),
    col3(0,1,0),
    col3(0,0,1),
    col3(0,1,1),
    col3(1,0,1),
    col3(1,1,0),
    col3(1,1,1)
    ];
const stdcol = X.stdcol = n => stdcols[n%8];

// bridge to access current members
/** */
const spotsize = a => {
    if (X.current) X.current.spotsize(a);
    //if (X.plymaterial) X.plymaterial.size = a;
}
const filtergui = g => { if (X.current) X.current.filtergui(g); }
const dataToMarkersGui = (a,b) => X.current.dataToMarkersGui(a,b);
const centrerange = new THREE.Vector3('unset');  // ranges for external use

/***/
X.spotsize = spotsize;
X.dataToMarkersGui = dataToMarkersGui;
X.filtergui = filtergui;
X.csvReader = csvReader;
X.pdbReader = pdbReader;
addFileTypeHandler('.csv', csvReader);
addFileTypeHandler('.txt', csvReader);

var usePhotoShader;
function csvReader(data, fid) { return new XYZ(data, fid); }

class XYZ {
    // comment in line below for typescript checking, comment out for js runtime
    // header, datas, ranges, particles, material;
//var header; // header, as array
//var datas;  // data as structure
//var ranges; // data ranges, as structure of min/max
// let particles, material;

//let filtergui.lastn;
//filtergui.last = '';


constructor(data, fid) {
    window.current = this;
    this.fid = fid;
    if (!data) return;  // called from pdbReader
    this.csvReader(data, fid);
    X.xyzs[fid] = this;
}

/** load data based on gui values */
dataToMarkersGui(type) {
    if (type) E.colourby.value = type;
    makechainlines(E.filterbox.value, E.colourby.value);
    return this.dataToMarkers(E.filterbox.value, E.colourby.value)
}

/** load the data with given filter and colour functions if requred, and display as markers */
dataToMarkers(pfilterfun, pcolourfun) {
    if (!this.particles) this.setup('dataToMarkers');  // for call from pdbReader
    const l = this.datas.length;
    const filterfun = this.makefilterfun(pfilterfun, E.filterbox);
    const colourfun = this.makecolourfun(pcolourfun, E.colourbox);
    let vert = new Float32Array(l*3);
    let col = new Float32Array(l*3);
    const geometry = this.geometry = new THREE.BufferGeometry();
    let ii = 0;
    for (let i = 0; i < l; i ++ ) {
        const dd = this.datas[i];
        let du;
        if (filterfun) {
            const df = filterfun(dd);
            if (!df) continue;
            if (typeof df === 'object') du = df;
        }
        if (!du) du = {x: dd.x, y: dd.y, z: dd.z};
        const r = Math.random;
        let c = colourfun ? colourfun(dd) : col3(r(), r(), r());
        if (!c) c = {r:1, g:1, b:1};            // ??? patch for hybrid numeric/alpha ???
        vert[ii] = 'x' in du ? du.x : dd.x;  // todo, change recentre mechanism, and this is broken for du.c_x === 0
        col[ii++] = 'r' in du ? du.r : c.r;
        vert[ii] = 'y' in du ? du.y : dd.y;
        col[ii++] = 'g' in du ? du.g : c.g;
        vert[ii] = 'z' in du ? du.z : dd.z;
        col[ii++] = 'b' in du ? du.b : c.b;
    }
    const ll = ii/3;
    if (ll !== l) {
        vert = vert.slice(0, ii);
        col = col.slice(0, ii);
    }
    const verta = new THREE.BufferAttribute(vert , 3);
    const cola = new THREE.BufferAttribute(col , 3);
    geometry.addAttribute('position', verta);
    geometry.addAttribute('color', cola);
    this.particles.geometry = geometry;
    return ll;
}

/** make a colour function for a field.
 * the input may be just field name,
 * or a structure with field fn (field name) and optional low and high values
 * If low and high are not given they are used as 1.5 standard deviations from the mean.
 * We may later add low and high colour values for greater flexibility.
 */
makecolourfun(fn, box) {
    if (typeof fn === 'function') return fn;
    if (fn === undefined || fn === '' || fn === 'random') return ()=>col3(Math.random(),Math.random(),Math.random());
    if (fn === 'choose') {
        const cc = new THREE.Color().setStyle(E.colourpick.value);
        E.colourbox.value = E.colourpick.value;
        return ()=>cc;
    }
    if (fn === 'custom')
        try {
            const c = E.colourbox.value;
            if (c[0] === '#') {
                const cc = new THREE.Color().setStyle(c);
                E.colourpick.value = '#' + cc.getHexString();
                return ()=>cc;
            }
            const f = this.makefilterfun(c, box);
            //const col = f(datas[0]);  // test
            return f;
        } catch(e) {
            return undefined;
        }
    if (typeof fn === 'string' && typeof (window[fn]) === 'function') return window[fn];  // need better formalization
    if (typeof fn === 'string') fn = { fn }
    const r = this.ranges[fn.fn];               // range
    const name = fn.fn;
    if (isNaN(r.sd)) {
        const cf = function cfxval(d) {     // colorby enumerated column
            const v = d[name];                // raw value
            return stdcol(r.valueSet[v]);
        }
        return cf;
    } else {                            // colorby value column
        if (fn.low === undefined) fn.low = r.mean - 1.5 * r.sd;
        if (fn.high === undefined) fn.high = r.mean + 1.5 * r.sd;
        const low = fn.low;
        const range = fn.high - fn.low;

        const cf = function cfx(d) {
            const v = d[name];                // raw value
            const nv = ( v - low) / range;  // normalized value
            return col3(nv, 1-nv, 1-nv);    // colour
        }
        return cf;
    }
}

/** make a function for a filter
 * If the value is a string it is converted to a function, using d as the input data row.
 * so a valid string could be 'd.x > 17'.
 * Also allows just x > 17
 * Flags any failure in E.filterr.innerHTML and returns undefined
 */
makefilterfun(filt, box) {
    E.filterr.innerHTML = filt + ': testing';
    if (!filt) { 
        if (box) box.style.background='#d0ffd0'; 
        E.filterr.innerHTML = 'empty filter';
        return undefined;
    }
    let filtfun;
    if (typeof filt === 'function')
        filtfun = filt;
    else if (typeof filt === 'string') {
        const used = [];
        for (let fn in this.ranges) // find used fields and assign (saves risk of accidental override of d.<fn>)
            if (filt.match( new RegExp('\\b' + fn + '\\b', 'g'))) used.push(fn);
        if (filt.indexOf('return') === -1) filt = 'return (' + filt + ')';
        filt = `
            var x = 0, y = 0, z = 0, r = 1, g = 1, b = 1;
            var {${used.join(',')}} = d;\n
        ` + filt;
        log(filt);
        try {
            filtfun = new Function('d', filt);
        } catch (e) {
            E.filterr.innerHTML = filt + '<br>invalid function: ' + e.message;
            if (box) box.style.background='#ffd0d0'
            return undefined;
        }
    } else {
        E.filterr.innerHTML = 'unexpected filter type';
        if (box) box.style.background='#ff4040'
    return undefined;
    }

    try {
        // eslint-disable-next-line no-unused-vars
        const r = filtfun(this.datas[0]);
    } catch(e) {
        E.filterr.innerHTML = filt + '<br>function throws exception: ' + e.message;
        if (box) box.style.background='#d0d0ff'
        return undefined;
    }
    if (box) box.style.background='#d0ffd0'
    E.filterr.innerHTML = filt + '<br>OK';
    return filtfun;
}


/** load the data as an array of arrays, and separate out header */
csvReader(raw, fid) {
    log('csvReader', fid);
    const data = raw.split('\r').join('').split('\n');
    if (data[0] === '') data.splice(0,1);  // in case of initial empty line
    if (data.slice(-1)[0] === '')
        data.splice(-1, 1);  // remove blank line at end if any
    const dataa = [];  // todo remove need for intermediate saved dataa
    data.forEach( x=> dataa.push(x.split('\t')));
    this.header = data[0].toLowerCase().split('\t').map(x=>x.trim().split(',')[0]);
    dataa.splice(0, 1);  // remove header

    // convert data to an array of structures, and compute ranges
    this.datas = [];
    dataa.forEach(x => {
       const s = {};
       for (let i=0; i<this.header.length; i++) {
           const fn = this.header[i];
           const rv = x[i].trim();  // raw value
           const v = isNaN(rv) ? rv : +rv;
           s[fn] = v;

       }
       if (s.x * s.y * s.z === 0) {
           // log('odd position', s.oid, s.x, s.y, s.z);
       } else if (isNaN(s.x * s.y * s.z)) {
           log('odd data');
       } else {
           this.datas.push(s);
       }
    });

    if (!this.ranges) {
        this.ranges = this.genstats();  // only generate ranges for first input so all are consistent
    }
    this.finalize(fid);
}

finalize(fid) {
    this.rebase('x');
    this.rebase('y');
    this.rebase('z');

    this.ranges.forEach = this.sForEach;
    this.setup(fid);
    this.filtergui({keyCode: 13});    // display as markers
}

/** rebase a field based on centrerange, set o_ values */
rebase(fn) {
    const c = centrerange[fn];
    this.datas.forEach(s => {
        const o = s['o_' + fn] = s[fn];
        s[fn] = s.pos[fn] = o - c;
    });
}

/** convenience function for iterating fields of an object  */
sForEach(fun) {
    const s = this;
    for (let i in s) {
        const v = s[i];
        fun(v);
    }
}


/** set/get the spotsize.  TODO, allow for number of pixels so value has similar effect on different devices */
spotsize(size) {
    if (usePhotoShader) {
        const k = 1000;
        const r = this.material.uniforms.size.value / k;
        if (size !== undefined) this.material.uniforms.size.value = size * k;
        return r;
    }
    const r = this.material.size;
    if (size !== undefined) this.material.size = size;
    return r;
}

/** handle changes to the gui filter for markers
   on ctrl-enter filter the markers and redisplay */
filtergui(evt = {}) {
    const box = E.filterbox;  // dom element
    const errbox = E.filterr;  // dom element
    const boxv = box.value.trim();
    filtergui.last = filtergui.last || 'unset';
    try {
        errbox.innerHTML = 'ctrl-enter to apply filter';
        const fun = this.makefilterfun(boxv, box);
        if (!fun && boxv !== '') return;
        if (evt.keyCode === 13) {
            filtergui.lastn = this.dataToMarkersGui();
            errbox.innerHTML = (fun ? '' : 'no ' ) + 'filter applied: #points=' + filtergui.lastn;
            filtergui.last = boxv;
        }
        if (boxv === filtergui.last) {
            box.style.background='#ffffff';
        }
    } catch (e) {
        box.style.background='#ffffd0';
        errbox.innerHTML = e.message;
    }
}

/** generate stats from given data for a given field, or for all fields, also compute three.js position */
genstats(datals = this.datas, name = undefined) {
    datals.forEach(d => { d.pos = new THREE.Vector3(d.x, d.y, d.z); d.o_pos = d.pos.clone(); });
    if (!name) {   // repeat for all fields
        const lranges = {};
        E.colourby.innerHTML = `<option value="choose">choose</option>`;
        E.colourby.innerHTML += `<option value="random">random</option>`;
        E.colourby.innerHTML += `<option value="custom">custom</option>`;
        for (name in datals[0])  {
            lranges[name] = this.genstats(datals, name);
        }
        if (centrerange.x === 'unset')
            centrerange.set(lranges.x.mean, lranges.y.mean, lranges.z.mean);
        return lranges;
    }


    const data = datals.map(d => d[name]);  // just extract this field
    let sum = 0, sum2 = 0, n = 0;
    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;
    let valueSet = {};                  // for non-numeric vals
    if (isNaN(data[0])) {min = max = data[0]}
    data.forEach(v => {
        if (!v) return;  // '' or 0 are sometimes used for missing/undefined (not for pdb chains, never mind ...!!!)
        if (isNaN(v)) {
            valueSet[v] = true;
        } else {
            sum += +v;
            sum2 += v*v;
            n++;
            if (v < min) min = v;  // do not use Math.max as doesn't work for alpha
            if (v > max) max = v;
            max = Math.max(max, v);
        }
    });
    const valueList = Object.keys(valueSet);
    for (let i in valueList) valueSet[valueList[i]] = i;

    const sd = Math.sqrt((sum2 - 1/n * sum*sum) / n);
    if (sd !== 0) {
        const n = `<option value="${name}">${name}</option>`;
        if (E.colourby.innerHTML.indexOf(n) === -1)
        E.colourby.innerHTML += `<option value="${name}">${name}</option>`;
    }

    return {name, mean: sum / n, sd, mid: (min + max) / 2, range: (max - min), min, max, sum, sum2, n, valueSet};
}

/** setvals, for use with pdbreader, later to be subclass */
setvals(vals) {

    this.datas = vals;
    this.ranges = this.genstats(this.datas);
    // this.ranges = vals.ranges;
    // ({this.ranges, this.datas} = vals);  // checker does not like this with this.
}

setup(fid) {
    // options for sprite1:
    // 1: load as image defined in html, will not work for file: from chrome unless you set the flag --allow-file-access-from-files will do it but inconvenient
    // 2: load as image using textureLoader, will not work for file: from chrome as for 1
    // 3: load from base4, seems to work always, but not very convenient
    // 4: leave undefined, we see squares of approriate size on screen
    let sprite;
    if (location.href.startsWith('file:') || location.host.startsWith('combinatronics.com') || navigator.userAgent.indexOf("Edge") > -1) {
        // Chrome is too fussy with file: loading, so use this instead
        // the data was converted from circle.png using https://www.base64-image.de/
        // Edge did not assume sprite subdirectory authenticated even when higher level one OK
        var image = new Image();
        image.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3wgaExY5fZXYlgAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAASFUlEQVR42u1bS48bR5KOR2ZV8dHsh97WeD2Y82IxEI996YMAw/9jftb8j8ECPVgBgz74QP+AgS0YMNAtW61+kyxWZkbsIbPIYrHYLcmaxQK7BFJksyiy4osvIiPjAfD/j//bD/ySX/aXv/wFW9+LD6zmQxvP9y3461//qv+rAGgJXi96YDVBaAoo96z6OnwpMPALCl4Lxem1Sa9N6zWn1WZBLWQAAN94br6ur0sTtN8DAn4hjVNDMNtYWWvZw/HYQrHDvZ5h8IBgADx4BQ/inPNlWfrJZOIAwAFA1XiuXzdBCb8XCPwdwjfpbJLAeVoFABRjgN7O0VGR93qFZVswY27IZMhoAMEg4NIEFDSogBcJVQihEucWpXPl5eW8nExO5gBQprVIqwYptEzkk8wCP0N4bFDdNDTdS2tweHg4GI6GwyIrBsbagWHuE1GPiQogyhAxIwRGQEp3KqoaVNWpqhORUkTKEPxcJEzdwk1nZTm9PD6eTgCmADADgHkComowogbio0HAzxCeGlSvBe8DwPDo8Gg03B+OcpuPTGZGhs0OMw+JaYCEPSIuECAnjAyAyAAEAFHQAAJeQSsRXajKXCTMQpBp8OHOeXfjnLspp+XNf16e38JkcgsrMGog1sziY0DAzxDeJMHzJPjOeHw4evFitJ/n/b3M2n02Zt8Ys8tEO0g8JMI+EfUQMUdECwAGERkBUREAVFUVBEB9YkGlqqWqzIPoVEK4CyFce++vnXNXVbW4nE5nV8fHx1cAcAsAd4kRVcMsPgoE/AThuSF8DwAGALD7+vXr/cFg56Ao8kfWmsfGmANm3mPmXSIaEtEAEQsiyhHRYtQ8AwAhIAFG+WsPr6BeRb2qViJSqupcRO5CCLchhOsQwqV37sPCVR8W5eLD2dnlxWRycg0ANw021M7yQRDwE4XPk/A7Y4C9p99992gw6D/JsvyJtfaJYfOIDR8w8S4S7TBTn4gKQMgIySKiAQBGREKA5AMVQUE17fGquuYPVHQhKvMQwp2I3obgr0IIH7xz55Vz78v5/P31zc35mzdvLgDgOplF+bEg4EfSvrb3PgCMxoeHBy/29x/3er1neZ4/s9Y+ZeYnxpgDIt5jpiFRFB4RLSFZQGBCJEAkROyMBGsmJBBEVbyIOlWpRHQuItPEhMsEwm8L535dlOWvt7e3vx0fH38AgKtkEmXDL2x1jOYTbD4KPz48ePno0dNer/c8y7IX1trnxpinzHxgmPeIeUhEfUTMicgSESMiQ9I6IiIg1tI3I0GI8kcg4oOESIOIOEIpAlKPkHoUTaqIPoUyQjRARK9fv8bj4+PO8LkRQa49+IF9vmnzo/F4fPDi5bNn/V7/RZ7nL7M8e2mNfWGMeWqtfcTMu8w8ZOYeM+dEZJnIIDEzERERxn8RiRDT30jxD4zvE+HqQYjIiMhIZBAxLiIb/QmadA0JAMgY/cPLl+Ht27fS2BGWUeOrV6/ghx9+uB+AV69e1dqv9/geAAwBYH88/vPTQX/4VZ5lL22WvTTWvjDWPEmOb5eZ+8xcMHPGRIZqsVfCR6kiBIgtSZeyE0L9SYisIYhvcVq1L0nPQIQICCiGSJ49f+5//vln3xUktUEwD+z1S+1/9+13B0Vv8DTLsufGZi+MNc+N4SfMZp+Jdpi5IKKMiAwhEq6EjSJESQBT8IeIbQ8Q1RStAFUVVBUQEVQVURAFdYkXABAgkAGDAKCgIKoQVNWPRrtuPB67yWTSBYJuZUDSftvud4+Ojh7t7u0+L4reyyzLXlobac+GDzgGOz0iyonIEBEnzSMz1xQHIoKoWQJEjH8nQBARID0T4dr7tcSw2jZWrABIThUoBVUKAAGRQp7n7p///Gc7XN4wBfOA9vswhtFoNDrIsuxJZuxTY8wTZn7EzHtMPGSiHhFlzGSImFYU7xByyYLuDSg5Qai131yogAKa3OjSiRbxP7AwQ9o6oVKVMoRi/vr16/nx8XHZCpCkyQLu0D43orzdb//j28eDweB5ludfWWu/MsY8N8Y8MswjMqbPRDkxGSamhlMDYoZa80sGNEDZDs72BUtjAlSorQobJ1NV1Xh0VoAKARbD4XBxdnbm2hFizQJzT5zfG48Ph0XR38sy+8gwPzKGD5YRHlOPo80zEy9dd1PYpqDwgA9oaj/Z/cYCABARRCRlBlrtnlqoamA2uyK6EOFZZsytz7Lbx48f36XgaN7FAm5pnxqOb/fPf/73R4NB8SzLiq+Wds+8b4zZYeaCiQ0l1a/ZehK8DUQ3C6Ly7mcDtEHDVjC3llhRjYcqUChFZT4cDsuzs7NFOzB69erV2i6wHvKOx/0sy0bGZHuN2H6HiPqEmCGSQcJa+C0CIiBSS5Dk8Bo/W8vV1v7qQUCkICJASFFNAKgKgKhERKyqVlULIhow00gC77E1e5m1u/v7jy+TUmcJBKpBMB2ZHQsAxdHOft/abIeZR8Q0IsKdFN7mSGRTTIMNT32vjW9oOKp0zQRq4WttqyqoyDKEi2GBAMpyx0AAAlUlJDIoYik65QExjTjQyNpsVBT5MDnMrJGyQwBQ6mCABYB8OLR9a3jIzDuMNCTiKDwuw1taBTG0XWAiwC6/0Pr8NtOJn0vX1r537TXGwJJMikV6kQm8w8zDPLeDw8PDXgLANJOyppXUZACwYxgXbLM+MQ+IeBifqUDEDAlNI2Jd3kxkdn1TDWE3tB8p394K2wxoPogARNZ9AylFv4+KhASKWkeKFhFzXDFhQMYMhr1hFwDQCcDOUZFbMj0m7hNBDxGLOplB7RgWCRAQENZt/YHtbGMX2BAe148vbeeoqC3Q184OlgmLQBiZQNSzhS0eYsDSCeb5MGND6cRFBRHlAGAofjnhalNeJrUeEroLBIDoDBXWBUdFEJUGQWp2bP0NREStASAkI0CW4r0XTNRj5rwFAAFAoDVXmwAgshmhyZAwxzqTQ2Tqszw24o9t2l2uewIcomg+a/4BI7UR2maDnVtm4zexETYbJLSImCVzyIkoPzw8tO26RNcuYKwlg4QZImaYChuUMjm12poCNm15g+ZbGYCAHekY1foHNn1D/L+aPrNpHomKlO7TAIBFxIwIM2a21lrTLsp0AUDLc/dqUTOhsSlgGxDotPVuM4COEiG2hIfNLbL7jFH7V0IAQopHZ4QohzGGG/TfOA6vQKAlEOu1vPVIrFuClsBdr9ffw/YJdSMWQIQ1++/aKTa+GDEmXQEYARmAGHizLkkdOUKkmI5YfrCp2I8rNmCHoCt81vxABxu2s+P+3C52X0BI4QQDtz+CbQBgvFneBv3kipvec6V1CAJ9WKMPyp8OUvfjpiGEzRij/aEJgIKIKKgoaDuLop8kvq5Tepn56TjldZnAx77fcXdr5XZVFQFRAN6Qx7S+RgFAgkJQhQCylliUeAOrxNWmOldprFq72HBoS3pra+9vJUGa39UWfO11t/QxoQyxvgAAAWpZ/ELa2WLTFh4AAogGUPUaS1UhrQRC4x6hpc2Gs9g43KStTes9TB/IBHVca4MVQVptn3UyHQAk5gjVq6gTEKcqzrtlEbUTgGVzggvOiUiVanRVA4jlb9xH35Xnbnhz0JVJJGao6hoW25IgbYDuMQ1NDBAAiHVG0EpFq6BS3cKtb+cH2yYQAXCu0hAWolKq6iIB4VU1RKWrqip23XQtWLysAF3b1mqrXzOELgC2AbK+msUUFVX1oupAdSGipaiWwYVqcjJxjU6TrQxw8/l84Xd3SwkyT7X6BZA6VQ21Y0w/CqqrFHY0g6jplZ0IaNPXag3KWshwb0I00Xs7KCpNBEKkviwkVZglhLlzruwqoVPLBwQAcCcnJwvn3SxImInKTEXnEpngRCRIrNt9lMZUFFQlJjZElk5ENf2dlqounzfXA7+1qqcFEVlWlkVkJiIzH/ysAcDDDACA0lVuLiFMNeidsEw1FicrIvIqYhRRN7S/RlNZ7rIiKQBqOchtSdEmE7aDsgRHRURFREQlqKoT1VJEZyoy9SHcBR+ml5eX8w4ANnyAJAAW8/l82u8Pbq31Nyx8GyRMSWmuqoWIWiLlmKHFNTMQESCiKDTpZqBxT+ID4GG6twBJm0GqJktsr1GRmUi48yI3IYRb59x0Mpl0AQDUtQsAQPnmzZuZc9Vt8P4mhHAjIrciMpMQSlVxIhJUVURENWpgReUl/ddp3qR6UxCR+r1ujUstuOja/0+rfvi0c6VeArkOwV97567v7spmB0noMoEmCD59cDabzW6zLL8yNlyGEPaIaESEPRTJsU6OQKzZUeNmSQQk5fe6tF+f99ssuN8RRv8hDe3X1FdVLyKViMyDyF0QuQ4hXHnnr6qqunnz5rjdL7BsmqBW40ATgPnx8eWtc9W18/4yhHApQa5CSEyIP+iT9YnULAhhQ9Mbjk42r20sbX9HZEpilUa5VUQkiIgTkbmI3IlPbTTeXzjnLmazWbNrpBkIQRcDtOEI5wCTu+l0/8pau2OId4hpgAF7iJTXeYKUHDDL4yURisg9pS5IMQLcG+93275AtLil4wsi4kIIZeoeuQ4SLoL3586587KqLo+Pj28a9QD/UG2wfZSkt2/f8jd/+hNbYywjWYhpJlPX5ht5g41cyLaTizbjBNi2dW46vqTzWngfQqh7Cu9S28x77927qnKnZVW++3B1/f6Xn3++TJ1kdfOUNHuGlgD88MMP8OrVq66yEz178oSyImMiNtzo1IDY6kbrIGjz+NxVAq737Xv29VYMIJqOdBJ3PZUQQqhiM2W4CyFchRDOvfe/OudOF4vF2d3t3a//9fe/f2h0jzXtf1ke7+oP2Ego/PLLL/D1H75Gaw2vta0kwXE9y1KHyG0gNw45m5pv2X0Uetk1ldxNSP6nDCFMQwhX3vtz7/2v3rvTxcKdzmazd3/729/OU8PUNGnft7W/AUCDBRun7bdv3+Ifv/63uuxdt33QlhmAhsC6pPna+9qgfyNCTHRPB1pRXWpeQtrqFrXD8yFchiR81Hx1Wpbzs9OL0/dnv5zV1C+bpfF2p9hGj9AWEAAA9MeffoJvvvlGOXV7NAweoTPDq0s5oXmA2MqA5fYGDUdXb3MuCT8TkdsQ/GWT9tVicTqfz9+dn5+///7k+4sk/Hwb9bcC0DKF9hSH/Pjjj5pAECRaDTEoaqzXLlMZUh/a66AN1k9tqwsrhq+IvtJ4ley97hi99iFc+ODfe+/fOefOqqo6nc9nZ+fXH347+cdJl93LtmbJTgDuMYUahPD1118HIoonK8SAAEEV/CoLo6KgITnvsGp+jMK2/pZ0kAki6lOkWYnIIm1xdyGEW+9Tl6j3773z76qqOquq8nQ+L88+fPjw/uQfJxct4f026t8LQAcI7ZGW8NNPP4WXL196IvCq6ADUQUxAxCXqFMCpqgMAL7LMMHmNmg0i6uISJyIuneIWjZPcNIRwE728XIQQzr1zv4bgzypXnS0W5dl8Xr47PT09//777y86+oVlG/U/p1m6ORhRpGbpncPDw939/f2DoigOsix7ZIzZZ+Z9Zt5l4h2i1CofS1Sx0oRoGp1dAOt9wjGTszzP60yC3AXxNyHItfPuwrtwUVbzD9Pb6UXqGL/u6Bj/qNmBz2mX58Z0SN01Pnr97etRvxjs5Vm2Z43dY2t2mXnERENC7CNRj5ByJMgA0CAgA9aHsUZzU90uL1pKnBm4C0HuvA/Xwftr593VbDG7ujn77epkMrlJgk9bwxMfPTjxOQMT7db5BhDjnW+/fbxT5MWOzezIGDNk5iETD4gpltkJcwSyiMtOjWU6btkhrroIIQ5MSJBp8O6u8v7WufLm8u7m9uTNST0jMGuM0bTniOCLDUzcMy/UHJIq0uoDQP/o9dFgWAz7bO3AMPUMmx4SFYSUEYFFRKOAGCvfdYs8+NQZvvAhlEFkHhZutnCL2fn53XQyOZk1xmXK1mzAZ80N/Z6hKdwCRNYcnIIxFEc7R3me57m1NqfU6EwUu8viEVQEBEQk+BDABecqF9zicj5fTE5OmsNSZWuCbKMh+lMnxz57brBlEtiouzeHqWpAmqN0BgDMeDymoiioLMtYkZqAAEzqhIy7Z7X7fz9rWuxfMTiJHazgjoFJbk2PbhZmNld7aHKtxPU/Pjj5kUBsG6HFlvDQAYJC98jsF58h/lcNT0PH4ei+wek2CLBl6uOLD0//NxKXqwa3BaHgAAAAAElFTkSuQmCC'
        sprite = new THREE.Texture();
        sprite.image = image;
        image.onload = function() { sprite.needsUpdate = true; };
    } else {
        var textureLoader = new THREE.TextureLoader();
        sprite = textureLoader.load( "sprites/circle.png", spr => { // TODO; check changes with three.js revisions
            this.material.map = spr;
            this.material.needsUpdate = true;
        });
    }
    const size = 0.3;
    this.material = new THREE.PointsMaterial( { size: size, map: sprite, /** blending: THREE.AdditiveBlending, **/ depthTest: true, transparent : true, alphaTest: 0.3, vertexColors: THREE.VertexColors } );
    this.particles = new THREE.Points(new THREE.Geometry(), this.material);
    this.particles.xyz = this;
    addToMain( this.particles, fid );
}
} // end class XYZ

// helpers, global
function enumI(d,f) {
    if (f.substring(0,2) === 'd.') f=f.substring(2); 
    return X.current.ranges[f].valueSet[d[f]];
}
function enumF(d,f) {
    if (f.substring(0,2) === 'd.') f=f.substring(2); 
    const vs = X.current.ranges[f].valueSet;
    return vs[d[f]] / Object.keys(vs).length;
}
X.enumI = enumI; X.enumF = enumF; 

/* reminder to me
nb 
http://localhost:8800/,,/xyz/xyz.html?startdata=/!C:/Users/Organic/Downloads/small_test_UMAP3A.csv
http://localhost:8800/,,/xyz/xyz.html?startdata=https://files.rcsb.org/download/6Z9P.pdb
https://sjpt.github.io/xyz/xyz.html?startdata=data/4bcufullCA.pdb
https://sjpt.github.io/xyz/xyz.html?startdata=data/small_test.csv
https://sjpt.github.io/xyz/xyz?startdata=https://sjpt.github.io/xyz/data/small_test.csv

http://localhost:8800/,,/xyz/xyz.html?startdata=/remote/https://userweb.molbiol.ox.ac.uk//public/staylor/cyto/Steve_test_UMAP3_cyto_xyz.txt

also
https://gitcdn.link/cdn/sjpt/xyzviewer/master/xyz.html

*/