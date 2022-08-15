# `openwanderer-app` : the OpenWanderer application widget

The application widget (the `openwanderer-app` package on NPM) allows you to easily create a simple, yet full, OpenWanderer-based application featuring navigation, map view (OpenStreetMap maps provided by OpenTopoMap by default, but can be changed via the `mapUrl` parameter; also note the `mapAttribution` parameter for specifying map attribution), login and signup functionality, upload functionality, controls to adjust the pan, tilt and roll of the current panorama, and controls to select, rotate, drag and delete any panorama on the map view. **It will only work with a [server](https://github.com/openwanderer/server) set up.**

You need to create an `OWApp.App` object. Quite a few options must be specified. In particular, you need to specify the icons to be used for controls, and the containers needed for the widget's UI elements. **It is up to you to style and position these containers and provide the icons - the package will not do it for you**. This is a deliberate decision, to avoid imposing a particular visual design and layout on apps making use of this package (though the signup and login dialogs do have default, albeit customisable, styles). Here is an example:

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

- `uploadContainer` (optional) : a container to hold the upload form. If not supplied, it is assuming you are providing your own upload functionality (e.g. via an upload dialog). If this is the case, **you must subclass the `OWApp.App` object and override the `setupUpload()` method to include your own upload functionality**. If you do not, the application will throw an error.

- `dialogParent` (optional) : various dialogs are created, notably for signup and login. This is the element which will act as the parent element to the dialogs created. If not specified, `document.body` will be used.

- `navigator` (optional) : an `OpenWanderer.Navigator` object to use for displaying and navigating between panoramas. If not specified, a navigator will be created for you. The navigator can later be accessed using the `navigator` property of the `App` object.

- `dialogStyle` (optional) : allows you to setup the background and text colours of the signup and login dialogs, otherwise default colours will be used. For example:

- `splitPath`, `svgEffects`, `panoMarkers` : these are passed directly to the `Navigator` to control its behaviour.

```
const app = new OWApp.App({
    // ...,
    dialogStyle: {
        backgroundColor: 'rgba(128,64,0)',
        color: 'white'
    }
});
```

- `css` (optional) : allows you to specify CSS rules for the signup and login dialogs and the map preview window (a small map visible in panorama mode showing your current location). For example:

```
const app = new OWApp.App({
    // ...,
    css: { 
         signup: 'left: 25%; top: 10%; width: 600px; height: 400px; ', 
         login: 'left: 37%; top: 25%; width: 25%; height: 288px; ',
         mapPreview: 'left: calc(100% - 200px); bottom: 0px; width:200px; height: 200px; display: block; position: absolute'
    };
});
```

- `api` (optional) : object, allowing specification of APIs to be used for functionality such as login/logout, signup, and panorama move, rotation and deletion. By default the endpoints provided by the OpenWanderer server can be used but they can be customised. Note that the API specifications use the `{id}` placeholder for panorama ID. The accepted suboptions of `api` are:
    - `move` : API for moving panoramas (default `panorama/{id}/move`)
    - `rotate` : API for moving panoramas (default `panorama/{id}/rotate`)
    - `del` : API for deleting panoramas (default `panorama/{id}/delete`)
    - `login` : API for logging in/getting information about the current user (default `user/login`)
    - `logout` : API for logging out (default `user/logout`)
    - `signup` : API for signing up (default `user/signup`)
    - `panos` : API for providing all panos within a bounding box (default `panos`; takes a `bbox` parameter containing w,s,e,n)

## Events

The application widget emits certain events. Event handlers can be setup with `on()`, for example:

```
app.on('login', userinfo => {
    console.log(`Logged in as ${userinfo.username}, admin status ${userinfo.isadmin}`);
});
```

The events which can be handled are:

- `login`: when a user successfully logs in, see above for example.
- `logout`: when a user logs out.
- `deletePano`: when a pano is successfully deleted. Event handler takes the pano ID as a parameter.
- `rotationSaved`: when a new rotation correction has been successfully saved to the server. The event handler takes an object with `pan`, `tilt` and `roll` properties as a parameter. 


## Including in your application

For version 0.0.10 or above, you should use `npm` to install, e.g. in your package.json:
```
{
    "dependencies": {
        "openwanderer-app": "^0.0.10"
    }
}
```
Then `import` it into your application:
```
import * as OWApp from 'openwanderer-app';
```
and use a build tool such as Webpack to build it. 

## Example

The full example app now uses `openwanderer-app`. See [here](https://github.com/openwanderer/example-app/tree/master/full). Note how the JavaScript needed to create a full app is minimal as the functionality is encapsulated by this package; however also note how the example app needs to setup the required containers in HTML and CSS, and include the required images.
