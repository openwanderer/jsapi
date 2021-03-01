# OpenWanderer jsapi - the core API 

This is in the `core` directory.
At present, the following classes exist:

`OpenWanderer.Viewer` - a viewer class. A thin wrapper around the `PhotoSphereViewer.Viewer` class from `photo-sphere-viewer`. Allows addition of markers and polylines using WGS84 lat/lon and elevation in metres. These are internally converted to spherical coordinates.

`OpenWanderer.Navigator` - a class allowing navigation from one pano to the next. Designed to be modular; not specifically coupled to one navigation system (e.g. pano sequences or OSM-based navigation). See comments in the class for more detail. The `OpenWanderer.Navigator` must be used with a *sequence provider* of some kind. A sequence provider is a function that will return a sequence, which can be displayed and navigated along. Details of what data the sequence provider must return are included in the source code. *Note that OpenWanderer.Navigator requires a server component to work correctly* - details to follow.

