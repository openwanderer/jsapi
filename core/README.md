# The core API 

At present, the following classes exist:

`OpenWanderer.Viewer` - a viewer class. A thin wrapper around the `PhotoSphereViewer.Viewer` class from `photo-sphere-viewer`. Allows addition of markers and polylines using WGS84 lat/lon and elevation in metres. These are internally converted to spherical coordinates.

`OpenWanderer.Navigator` - a class allowing navigation from one pano to the next. Designed to be modular; not specifically coupled to one navigation system (e.g. pano sequences or OSM-based navigation). See comments in the class for more detail. 

## Including in your application

The easiest way to include is via [unpkg](https://unpkg.com), e.g. for the latest version:
```html
<script type='text/javascript' src='https://unpkg.com/openwanderer-jsapi'></script>
```

## Examples

Examples can be found in the [`examples`](https://github.com/openwanderer/jsapi/tree/master/core/examples) directory within `core`. Currently there are two basic demos, one showing usage of `OpenWanderer.Viewer` and the other showing usage of `OpenWanderer.Navigator`. These are now accompanied by a walkthrough guide.
