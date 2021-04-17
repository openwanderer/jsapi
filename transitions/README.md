# The Transitions API

The `transitions` API contains transitions developed by Eesger Toering. These produce a nice transition effect when moving from one pano to another. Note that currently there are some artefacts if point markers (representing pano locations) are present on your panorama, though polylines (representing the route of a sequence) are OK. 

## Including the transitions API

For 0.1.0 or 0.1.1, include with unpkg. jQuery is now *automatically included* as at version 0.1.1.

For version 0.1.2 or above, a bundle is no longer distributed. You should use `npm` to install, e.g. in your package.json:
```
{
	"dependencies": {
		"openwanderer-jsapi-transitions": "^0.1.2"
	}
}
```
Then `import` it into your application:
```
import * as OWTransition from 'openwanderer-jsapi-transitions';
```
and use a build tool such as Webpack to build it. 
and then use a build tool such as Webpack to build it.
