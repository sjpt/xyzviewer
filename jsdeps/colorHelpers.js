// Various colour helper functions not specific to xyzviewer.
window.lastModified.xyz = `Last modified: 2020/12/05 09:56:02
`; console.log('>>>>colorHelpers.js');

// CIElab code drom https://raw.githubusercontent.com/antimatter15/rgb-lab/master/color.js
// the following functions are based off of the pseudocode
// found on www.easyrgb.com
export {eqcols};

import {THREE} from "../threeH.js"; // import * as THREE from "./three121.module.js";


// eslint-disable-next-line no-unused-vars
function lab2rgb(lab){
  var y = (lab[0] + 16) / 116,
      x = lab[1] / 500 + y,
      z = y - lab[2] / 200,
      r, g, b;

  x = 0.95047 * ((x * x * x > 0.008856) ? x * x * x : (x - 16/116) / 7.787);
  y = 1.00000 * ((y * y * y > 0.008856) ? y * y * y : (y - 16/116) / 7.787);
  z = 1.08883 * ((z * z * z > 0.008856) ? z * z * z : (z - 16/116) / 7.787);

  r = x *  3.2406 + y * -1.5372 + z * -0.4986;
  g = x * -0.9689 + y *  1.8758 + z *  0.0415;
  b = x *  0.0557 + y * -0.2040 + z *  1.0570;

  r = (r > 0.0031308) ? (1.055 * Math.pow(r, 1/2.4) - 0.055) : 12.92 * r;
  g = (g > 0.0031308) ? (1.055 * Math.pow(g, 1/2.4) - 0.055) : 12.92 * g;
  b = (b > 0.0031308) ? (1.055 * Math.pow(b, 1/2.4) - 0.055) : 12.92 * b;

  return [Math.max(0, Math.min(1, r)),  // note: * 255 removed
          Math.max(0, Math.min(1, g)), 
          Math.max(0, Math.min(1, b))]
}


function rgb2lab(rgb){
  var r = rgb[0],     // note: / 255 removed 
      g = rgb[1],
      b = rgb[2],
      x, y, z;

  r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

  x = (x > 0.008856) ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
  y = (y > 0.008856) ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
  z = (z > 0.008856) ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;

  return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)]
}

// calculate the perceptual distance between colors in CIELAB
// https://github.com/THEjoezack/ColorMine/blob/master/ColorMine/ColorSpaces/Comparisons/Cie94Comparison.cs

function deltaE(labA, labB){
  var deltaL = labA[0] - labB[0];
  var deltaA = labA[1] - labB[1];
  var deltaB = labA[2] - labB[2];
  var c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2]);
  var c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2]);
  var deltaC = c1 - c2;
  var deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
  deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
  var sc = 1.0 + 0.045 * c1;
  var sh = 1.0 + 0.015 * c1;
  var deltaLKlsl = deltaL / (1.0);
  var deltaCkcsc = deltaC / (sc);
  var deltaHkhsh = deltaH / (sh);
  var i = deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh;
  return i < 0 ? 0 : Math.sqrt(i);
}

/** perceptual distance RGB */
// eslint-disable-next-line no-unused-vars
function deltaRGB(r1, r2) {
  return deltaE(rgb2lab(r1), rgb2lab(r2))
}

/** perceptual distance HSV */
function deltaHSV(h1, h2) {
  return deltaE(rgb2lab(hsv2rgb(h1)), rgb2lab(hsv2rgb(h2)))
}

/** generate an equi-perceptual set of hues (experimental) */
// eslint-disable-next-line no-unused-vars
function makeColeq() {
    const n = 500;    // number of distinct elements in the arrays
    let s = 0, cd = [];

    // generate candidates and find total distance
    for (let i = 0; i < n; i++) {
      const h = i/n, h1 = (i+1)/n;
      const d = deltaHSV([h,1,0.33], [h1,1,0.33]);
      cd[i] = s;
      s += d;
    }
    cd = cd.map(v => v/s);
    cd.push(9999);  // just in case of overrun
    cd[-1] = 2*cd[0] - cd[1];

    // scan to make equal map ~~~~~~~~~~~~~~~~~~~
    let k = 0;
    const o = []; // output rgb
    const oh = []; // output hue
    for (let i = 0; i < n; i++) {
      const tcd = i/n;
      while(cd[k] < tcd) k++;
      const cdl = cd[k-1];
      const cdh = cd[k];
      let h = oh[i] = (k - 1 + (tcd-cdl)/(cdh-cdl))/n;
      // h = i/n;
      const oo = o[i] = hsv2rgb(h,1,1);
      let gamma = 1/2.2;
      //gamma = 1;
      oo.r = oo.r**gamma;
      oo.g = oo.g**gamma;
      oo.b = oo.b**gamma;
    }

    // // check map
    // for (let i = 0; i < n-1; i++) {
    //   const h = oh[i], h1 = oh[i+1];
    //   console.log(i, h, deltaHSV([h,1,1], [h1,1,1]), oh[i+1]-oh[i])
    // }
    // COLS.eqh = oh;      // save for debug
    return o;
}
const eqcols = makeColeq();

/**  http://snipplr.com/view.php?codeview&id=14590
* HSV to RGB color conversion
*
* H, S, V run from 0 to 1
*
* Ported from the excellent java algorithm by Eugene Vishnevsky at:
* http://www.cs.rit.edu/~ncs/color/t_convert.html
*/
function hsv2rgb(h, s, v, ret) {
  let arr = false;
  if (Array.isArray(h)) { s = h[1]; v = h[2]; h = h[0]; arr = true; }
  if (typeof (h) !== "number") { s = h.s; v = h.v; h = h.h; }
  let r, g, b;
  let i;
  let f, p, q, t;

  // Make sure our arguments stay in-range
  h = h % 1 * 360;
  s = Math.max(0, Math.min(1, s));
  //v = Math.max(0, Math.min(1, v));

  if (s === 0) {
      // Achromatic (grey)
      r = g = b = v;
      // return new THREEA.Color(r, g, b);
  } else {
      h /= 60; // sector 0 to 5
      i = Math.floor(h);
      f = h - i; // factorial part of h
      p = v * (1 - s);
      q = v * (1 - s * f);
      t = v * (1 - s * (1 - f));

      switch (i) {
          case 0:
              r = v;
              g = t;
              b = p;
              break;

          case 1:
              r = q;
              g = v;
              b = p;
              break;

          case 2:
              r = p;
              g = v;
              b = t;
              break;

          case 3:
              r = p;
              g = q;
              b = v;
              break;

          case 4:
              r = t;
              g = p;
              b = v;
              break;

          default: // case 5:
              r = v;
              g = p;
              b = q;
      }
  }
  if (arr) return [r,g,b];
  if (!ret) ret = new THREE.Color();
  ret.setRGB(r,g,b);
  return ret;
}


/** from http://stackoverflow.com/questions/8022885/rgb-to-hsv-color-in-javascript
* changed for input range 0..1 and output range 0..1 */
// eslint-disable-next-line no-unused-vars
function rgb2hsv(r, g, b) {
  let arr = false;
  if (Array.isArray(r)) { g = r[1]; b = r[2]; r = r[0]; arr = true; }
  if (typeof (r) !== "number") { g = r.g; b = r.b; r = r.r; }
  let rr, gg, bb,
      h, s,
      v = Math.max(r, g, b),
      diff = v - Math.min(r, g, b),
      diffc = function (c) {
          return (v - c) / 6 / diff + 1 / 2;
      };

  if (diff === 0) {
      h = s = 0;
  } else {
      s = diff / v;
      rr = diffc(r);
      gg = diffc(g);
      bb = diffc(b);

      if (r === v) {
          h = bb - gg;
      } else if (g === v) {
          h = (1 / 3) + rr - bb;
      } else if (b === v) {
          h = (2 / 3) + gg - rr;
      }
      if (h < 0) {
          h += 1;
      } else if (h > 1) {
          h -= 1;
      }
  }
  if (arr) return [h,s,v];
  return { h: h, s: s, v: v };
}

