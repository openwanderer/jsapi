# The OpenWanderer JavaScript API.

This repo contains the OpenWanderer JavaScript API. The core API is present, in addition to various add-ons.

## The core API 

This is in the `core` directory.
At present, the following classes exist:

`OpenWanderer.Viewer` - a viewer class. A thin wrapper around the `PhotoSphereViewer.Viewer` class from `photo-sphere-viewer`. Allows addition of markers and polylines using WGS84 lat/lon and elevation in metres. These are internally converted to spherical coordinates.

`OpenWanderer.Navigator` - a class allowing navigation from one pano to the next. Designed to be modular; not specifically coupled to one navigation system (e.g. pano sequences or OSM-based navigation). See comments in the class for more detail. 

## Add-ons

At present only one add-on API is available, the `transitions` API containing transitions developed by Eesger Toering. These produce a nice transition effect when moving from one pano to another. Note that currently there are some artefacts if point markers (representing pano locations) are present on your panorama, though polylines (representing the route of a sequence) are OK. 

## Examples

Examples can be found in the `examples` directory within `core`. Currently there are two basic demos, one showing usage of `OpenWanderer.Viewer` and the other showing usage of `OpenWanderer.Navigator`. These are now accompanied by a walkthrough guide.
