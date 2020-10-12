# The OpenWanderer JavaScript API.

This repo contains the OpenWanderer JavaScript API. At present, the following
classes exist:

`OpenWanderer.Viewer` - a viewer class. A thin wrapper around the `PhotoSphereViewer.Viewer` class from `photo-sphere-viewer`. Allows addition of markers and polylines using WGS84 lat/lon and elevation in metres. These are internally converted to spherical coordinates.

`OpenWanderer.Navigator` - a class allowing navigation from one pano to the next. Designed to be modular; not specifically coupled to one navigation system (e.g. pano sequences or OSM-based navigation). See comments in the class for more detail.

`OSM` submodule (in the `osm/` directory). Classes specifically for handling OSM-based navigation, in other words using OSM data to auto-connect panoramas as is done in OpenTrailView currently.
