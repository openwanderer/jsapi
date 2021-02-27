# The OpenWanderer JavaScript API.

This repo contains the OpenWanderer JavaScript API. The core API is present, in addition to various add-ons.

## The core API 

This is in the `core` directory.
At present, the following classes exist:

`OpenWanderer.Viewer` - a viewer class. A thin wrapper around the `PhotoSphereViewer.Viewer` class from `photo-sphere-viewer`. Allows addition of markers and polylines using WGS84 lat/lon and elevation in metres. These are internally converted to spherical coordinates.

`OpenWanderer.Navigator` - a class allowing navigation from one pano to the next. Designed to be modular; not specifically coupled to one navigation system (e.g. pano sequences or OSM-based navigation). See comments in the class for more detail. The `OpenWanderer.Navigator` must be used with a *sequence provider* of some kind. A sequence provider is a function that will return a sequence, which can be displayed and navigated along. Details of what data the sequence provider must return are included in the source code. *Note that OpenWanderer.Navigator requires a server component to work correctly* - details to follow.

`OpenWanderer.SimpleSequenceProvider` - a class which provides a simple sequence from an API which returns a sequence containing an array of pano objects as JSON, see the source for more detail. 

## Add-ons

At present only one add-on API is available, the `transitions` API containing transitions developed by Eesger Toering. These produce a nice transition effect when moving from one pano to another. Note that currently there are some artefacts if point markers (representing pano locations) are present on your panorama, though polylines (representing the route of a sequence) are OK. 

## Demos

Demos can be found in the `examples` directory. Currently there are two basic demos, one showing usage of `OpenWanderer.Viewer` and the other showing usage of `OpenWanderer.Navigator`.