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

The application widget (the `openwanderer-app` package on NPM) allows you to easily create a simple, yet full, OpenWanderer-based application featuring navigation, map view (OpenStreetMap maps provided by OpenTopoMap), login and signup functionality, upload functionality, controls to adjust the pan, tilt and roll of the current panorama, and controls to select, rotate, drag and delete any panorama on the map view. **It will only work with a [server](https://github.com/openwanderer/server) set up.**

You need to create an `OWApp.App` object. Quite a few options must be specified. In particular, you need to specify the icons to be used for controls, and the containers needed for the widget's UI elements. **It is up to you to style and position these containers and provide the icons - the package will not do it for you**. Here is an example:

```
const app = new OWApp.App({
    controlIcons: {
        'select': 'images/cursor-default-click.png',
        'rotate': 'images/baseline_rotate_right_white_18dp.png',    
        'drag'  : 'images/drag-variant.png',
        'delete': 'images/baseline_delete_white_18dp.png',
        'search': 'images/search.png',
        'switchMode' : [
            'images/baseline_panorama_white_18dp.png',
            'images/baseline_map_white_18dp.png',
        ]
    },
    cameraIcon: 'images/camera.png',
    loginContainer: 'loginContainer',
    controlContainer: 'controlContainer',
    searchContainer: 'searchContainer',
    rotateControlsContainer: 'rotateControlsContainer',
    uploadContainer: 'uploadContainer',
    dialogParent: 'main'
});
```

Note the options. All are required unless marked as optional.

- `controlIcons` : an object specifying the icons to use for various UI controls. Most should be self-explanatory: `switchMode` is the control used to switch between "panorama" mode and "map" mode. It takes an array containing the icons for each.

- `cameraIcon`: the icon to use when showing the location of panoramas on the map.

- `loginContainer`: a container element to hold the "Login" and "Signup" links, and the "Logged in as..." message.

- `controlContainer`: a container to hold the UI controls (as described in `controlIcons`, above)

- `searchContainer`: a container to hold the search functionality.

- `rotateControlsContainer` : a container to hold the pan, tilt and roll adjustment controls.

- `uploadContainer` : a container to hold the upload form:

- `dialogParent` (optional) : various dialogs are created, notably for signup and login. This is the element which will act as the parent element to the dialogs created. If not specified, `document.body` will be used.

- `navigator` (optional) : an `OpenWanderer.Navigator` object to use for displaying and navigating between panoramas. If not specified, a navigator will be created for you. The navigator can later be accessed using the `navigator` property of the `App` object.

## Examples

Examples can be found in the [`examples`](https://github.com/openwanderer/jsapi/tree/master/core/examples) directory within `core`. Currently there are two basic demos, one showing usage of `OpenWanderer.Viewer` and the other showing usage of `OpenWanderer.Navigator`. These are now accompanied by a walkthrough guide.
