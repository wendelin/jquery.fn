# jquery.fn
Auxiliary jQuery plugins

# License
Copyright (c) 2014 Wendelin Thomas.
See the [LICENSE](LICENSE.md) file for license rights and limitations (MIT).

##jquery.draw.js:

### $.draw(source, target, options)
Drawing method takes visual data from a single given source and "draws" it into each element
of the context jQuery element set.

Supported sources are:
- HTMLVideoElement
- HTMLCanvasElement
- HTMLImageElement
- File, containing imagery data that can be put into a HTMLImageElement
- Blob, "
- URL, any valid URL will do: dataURL, Blob URL, normal URL, whatever

Supported targets
- HTMLCanvasElement
- HTMLImageElement

Note:
  If the source is a HTMLVideoElement then a video still image is taken and drawn into 
  the target or each item in the target set.

If successful the deferred object is resolved with the target.

options:
- type {String} MimeType to be used when drawing img[s]
- width {Integer} Resize width
- height {Integer} Resize height
- scale {Boolean} Resize scaling/keep aspect ratio when resizing
- async {Boolean} Async mode (enables File and Blob sources) method will return $.Deferred for chaining
- maxWidth {Integer} Max width constraint
- maxHeight {Integer} Max height constraint


```
@public
@method $.draw
@param source {URL || HTMLElement || jQuery set || File || Blob}
@param target {HTMLElement || jQuery set} If undefined a new HTMLCanvasElement is used
@param options {Object} Options: type, width, height, scale, async
@returns {Object} target or if async=true $.Deferred instance that when successful returns the target
```

### $.blob(source, options)
Get a Blob

Options:
- multiple {Boolean} override, force support for multiple files from single source => see: <input type="file" multiple />
- async {Boolean} Wrap response in a $.Deferred
- type {String} Image mimetype to default to or if (convert) to enforce
- convert {Boolean} Conversion to be forced: image mimeType and width && height
- width {Integer} Resize image width
- height {Integer} Resize image height

```
@method $.blob
@param source {File || Blob || HTMLVideoElement || HTMLCanvasElement || HTMLImageElement}
@param options {Object} Options: multiple, convert, async, width, height, type
@return {Blob || File || $.Deferred()}
```


### $.dataURL(source, options)
Get dataURL[s]

Options:
- multiple {Boolean} override, force support for multiple files from single source => see: <input type="file" multiple />
- async {Boolean} Wrap response in a $.Deferred
- type {String} Image mimetype to default to or if (convert) to enforce
- convert {Boolean} Conversion to be forced: image mimeType and width && height
- width {Integer} Resize image width
- height {Integer} Resize image height

```
@method $.dataURL
@param source {File || Blob || HTMLVideoElement || HTMLCanvasElement || HTMLImageElement}
@param options {Object} Options: multiple, convert, async, width, height, type
@return {Blob || File || $.Deferred()}
```
