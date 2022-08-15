# The OpenWanderer JavaScript API.

This repo contains the OpenWanderer JavaScript API, based on [Photo Sphere Viewer](https://photo-sphere-viewer.js.org). The core API is present, in addition to various add-ons.

## The core API 

This is in the `core` directory, [here](https://github.com/openwanderer/jsapi/tree/master/core)

At present, the following classes exist:

`OpenWanderer.Viewer` - a viewer class. A thin wrapper around the `PhotoSphereViewer.Viewer` class from Photo Sphere Viewer. Allows addition of markers and polylines using WGS84 lat/lon and elevation in metres. These are internally converted to spherical coordinates.

`OpenWanderer.Navigator` - a class allowing navigation from one pano to the next. Designed to be modular; not specifically coupled to one navigation system (e.g. pano sequences or OSM-based navigation). See comments in the class for more detail. 

## Including in your application

For versions 0.1.3 or lower, the easiest way to include is via [unpkg](https://unpkg.com), e.g. for the latest version:

```html
<script type='text/javascript' src='https://unpkg.com/openwanderer-jsapi@0.1.3'></script>
```

For version 0.1.4 or above, a bundle is no longer distributed. You should use `npm` to install, e.g. in your package.json:
```
{
	"dependencies": {
		"openwanderer-jsapi": "^0.3.0"
	}
}
```
Then `import` it into your application:
```
import * as OpenWanderer from 'openwanderer-jsapi';
```
and use a build tool such as Webpack to build it. 

Note that the dependencies, notably Photo Sphere Viewer, will be included automatically: however you still need to manually include the *CSS* for Photo Sphere Viewer in your HTML:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/photo-sphere-viewer@4.2.1/dist/photo-sphere-viewer.min.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/photo-sphere-viewer@4.2.1/dist/plugins/markers.min.css"/>
```

## Examples

Examples can be found in the [`examples`](https://github.com/openwanderer/jsapi/tree/master/core/examples) directory within `core`. Currently there are two basic demos, one showing usage of `OpenWanderer.Viewer` and the other showing usage of `OpenWanderer.Navigator`. These are now accompanied by a walkthrough guide.
