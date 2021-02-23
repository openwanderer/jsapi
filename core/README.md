# The OpenWanderer JavaScript API.

This repo contains the OpenWanderer JavaScript API. At present, the following
classes exist:

`OpenWanderer.Viewer` - a viewer class. A thin wrapper around the `PhotoSphereViewer.Viewer` class from `photo-sphere-viewer`. Allows addition of markers and polylines using WGS84 lat/lon and elevation in metres. These are internally converted to spherical coordinates.

`OpenWanderer.Navigator` - a class allowing navigation from one pano to the next. Designed to be modular; not specifically coupled to one navigation system (e.g. pano sequences or OSM-based navigation). See comments in the class for more detail. The `OpenWanderer.Navigator` must be used with a *sequence provider* of some kind. A sequence provider is a function that will return a sequence, which can be displayed and navigated along. Details of what data the sequence provider must return are included in the source code. *Note that OpenWanderer.Navigator requires a server component to work correctly* - details to follow.

`OpenWanderer.SimpleSequenceProvider` - a class which provides a simple sequence from an API which returns GeoJSON containing a single feature, with the sequence route as a `LineString` geometry plus the marker IDs as an `ids` array within the `properties`.

## Demos

Demos can be found in the `examples` directory. Currently there is just one demo showing basic usage of the `OpenWanderer.Viewer` API.
