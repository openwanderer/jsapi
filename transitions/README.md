# The Transitions API

The `transitions` API contains transitions developed by Eesger Toering. These produce a nice transition effect when moving from one pano to another. Note that currently there are some artefacts if point markers (representing pano locations) are present on your panorama, though polylines (representing the route of a sequence) are OK. 

## Including the transitions API

Include with unpkg. You also need jQuery as the transitions API requires it; use jQuery's own CDN for this. For example:
```html
<script src="https://code.jquery.com/jquery-3.5.1.min.js"
			  integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0="
			  crossorigin="anonymous"></script>
<script type='text/javascript' src='https://unpkg.com/openwanderer-jsapi-transitions'></script>
```
