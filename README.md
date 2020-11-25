# xyzviewer
Simple viewer for 3d files, including csv, goejson and pdb

xyzviewer is a generic program for 3d and VR viewing of xyz based data.
We have two major applications, for archaeology and for molecular point clouds.

xyzviewer provides simple filtering and colouring choices.

Implementation
It was originally designed as a very simple view for relative small archaeology finds files,
with a few tens of thousands of finds.
The data was held internally in 'natural' Javascript objects.

The molecular clouds have over a million points, with over 50 attributes each.
We moved the xyzviewer internals to have much more efficient column based storage;
and that storage can optionally be used for the external data storage as well.
This permits us to load one million points in under 1 second;
with addition attribute (column) data loaded on demand.


