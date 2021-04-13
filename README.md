# The OpenWanderer JavaScript API.

This repo contains the OpenWanderer JavaScript API. The core API is present, in addition to various add-ons.

## The core API 

This is in the `core` directory, [here](https://github.com/openwanderer/jsapi/tree/master/core)

At present, the following classes exist:

`OpenWanderer.Viewer` - a viewer class. A thin wrapper around the `PhotoSphereViewer.Viewer` class from `photo-sphere-viewer`. Allows addition of markers and polylines using WGS84 lat/lon and elevation in metres. These are internally converted to spherical coordinates.

`OpenWanderer.Navigator` - a class allowing navigation from one pano to the next. Designed to be modular; not specifically coupled to one navigation system (e.g. pano sequences or OSM-based navigation). See comments in the class for more detail. 

## Including in your application

The easiest way to include is via [unpkg](https://unpkg.com), e.g. for the latest version:
```html
<script type='text/javascript' src='https://unpkg.com/openwanderer-jsapi'></script>
```

## Add-ons

At present two add-ons are available, the `transitions` API containing transitions developed by Eesger Toering, and the `openwanderer-app` API, which allows you to create a complete OpenWanderer application widget featuring navigation, panorama and map mode, login, upload and ability to move and rotate panoramas.

### Transitions API

 These produce a nice transition effect when moving from one pano to another. Note that currently there are some artefacts if point markers (representing pano locations) are present on your panorama, though polylines (representing the route of a sequence) are OK. 

See the `transitions` directory, [here](https://github.com/openwanderer/jsapi/tree/master/transitions)

#### Including the transitions API

Again, include with unpkg. You also need jQuery as the transitions API requires it; use jQuery's own CDN for this. For example:
```html
<script src="https://code.jquery.com/jquery-3.5.1.min.js"
			  integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0="
			  crossorigin="anonymous"></script>
<script type='text/javascript' src='https://unpkg.com/openwanderer-jsapi-transitions'></script>
```

### Application widget

TODO!

## Examples

Examples can be found in the [`examples`](https://github.com/openwanderer/jsapi/tree/master/core/examples) directory within `core`. Currently there are two basic demos, one showing usage of `OpenWanderer.Viewer` and the other showing usage of `OpenWanderer.Navigator`. These are now accompanied by a walkthrough guide.
