# xyzviewer
## Summary
Simple viewer for 3d files, including csv, goejson and pdb

examples:
Star Carr archaeology: https://sjpt.github.io/xyz/xyz.html?arch
pdb viewing: https://sjpt.github.io/xyz/xyz.html?pdb=2ayo
60-fold virus symmetry: https://sjpt.github.io/xyz/xyz.html?fold

xyzviewer is a generic program for 3d and VR viewing of xyz based data. We have two major applications, for archaeology and for molecular point clouds.

xyzviewer is browser based and can accept data from URLs, or from local files (using drag/drop); you can start a session with no query string and drag/drop local files.
empty start session: https://sjpt.github.io/xyz/xyz.html

xyzviewer provides simple filtering and colouring choices.

##Implementation
xyzviewer was originally designed as a very simple viewer for relatively small archaeology finds files, with a few tens of thousands of finds. The data was held internally in 'natural' Javascript objects.

The molecular clouds have many millions of points, with over 50 attributes each. We moved the xyzviewer internals to have much more efficient column based storage; and that storage can optionally be used for the external data storage as well.

This permits us to load one million points in under 1 second; with addition attribute (column) data loaded on demand.


