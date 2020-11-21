// ex port {csv};
// use this to get csv_parser into browser
// browserify csvparser.js -o build/csvparserbundle.js
window.csv = require('csv-parser')
window.fs = require('fs')