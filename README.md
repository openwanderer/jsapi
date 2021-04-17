# The OpenWanderer JavaScript API.

This repo contains the OpenWanderer JavaScript API. The core API is present, in addition to various add-ons.

## The core API 

This is in the `core` directory, [here](https://github.com/openwanderer/jsapi/tree/master/core)

At present, the following classes exist:

`OpenWanderer.Viewer` - a viewer class. A thin wrapper around the `PhotoSphereViewer.Viewer` class from `photo-sphere-viewer`. Allows addition of markers and polylines using WGS84 lat/lon and elevation in metres. These are internally converted to spherical coordinates.

`OpenWanderer.Navigator` - a class allowing navigation from one pano to the next. Designed to be modular; not specifically coupled to one navigation system (e.g. pano sequences or OSM-based navigation). See comments in the class for more detail. 

## Including in your application

Please see the relevant packages for build instructions:

- [Core API](https://github.com/openwanderer/jsapi/tree/master/core)
- [Transitions](https://github.com/openwanderer/jsapi/tree/master/transitions)
- [App widget](https://github.com/openwanderer/jsapi/tree/master/owapp)

## Add-ons

At present two add-ons are available, the `transitions` API containing transitions developed by Eesger Toering, and the `openwanderer-app` API, which allows you to create a complete OpenWanderer application widget featuring navigation, panorama and map mode, login, upload and ability to move and rotate panoramas.

### Transitions API

 These produce a nice transition effect when moving from one pano to another. Note that currently there are some artefacts if point markers (representing pano locations) are present on your panorama, though polylines (representing the route of a sequence) are OK. 

See the `transitions` directory, [here](https://github.com/openwanderer/jsapi/tree/master/transitions)

#### Including the transitions API

Again, include with unpkg. You also need jQuery but this is now bundled with the transitions API.

### Application widget

See the `owapp` directory, [here](https://github.com/openwanderer/jsapi/tree/master/owapp)

## Examples

Examples can be found in the [`examples`](https://github.com/openwanderer/jsapi/tree/master/core/examples) directory within `core`. Currently there are two basic demos, one showing usage of `OpenWanderer.Viewer` and the other showing usage of `OpenWanderer.Navigator`. These are now accompanied by a walkthrough guide.
