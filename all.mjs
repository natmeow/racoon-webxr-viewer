(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @api private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {Mixed} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Boolean} exists Only check if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event, exists) {
  var evt = prefix ? prefix + event : event
    , available = this._events[evt];

  if (exists) return !!available;
  if (!available) return [];
  if (available.fn) return [available.fn];

  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
    ee[i] = available[i].fn;
  }

  return ee;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Remove the listeners of a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {Mixed} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
         listeners.fn === fn
      && (!once || listeners.once)
      && (!context || listeners.context === context)
    ) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
           listeners[i].fn !== fn
        || (once && !listeners[i].once)
        || (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {String|Symbol} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],2:[function(require,module,exports){
(function (Buffer){
var jsfx;
(function (jsfx) {
    var Filter = (function () {
        function Filter(vertexSource, fragmentSource) {
            if (vertexSource === void 0) { vertexSource = null; }
            if (fragmentSource === void 0) { fragmentSource = null; }
            this.vertexSource = vertexSource;
            this.fragmentSource = fragmentSource;
            this.properties = {};
        }
        /**
         * Returns all the properties of the shader. Useful for drawWebGl when are are just passing along data
         * to the shader.
         *
         * @returns {{}|*}
         */
        Filter.prototype.getProperties = function () {
            return this.properties;
        };
        /**
         * The javascript implementation of the filter
         *
         * @param imageData
         */
        Filter.prototype.drawCanvas = function (imageData) {
            throw new Error("Must be implemented");
        };
        /**
         * The WebGL implementation of the filter
         *
         * @param renderer
         */
        Filter.prototype.drawWebGL = function (renderer) {
            var shader = renderer.getShader(this);
            var properties = this.getProperties();
            renderer.getTexture().use();
            renderer.getNextTexture().drawTo(function () {
                shader.uniforms(properties).drawRect();
            });
        };
        Filter.prototype.getVertexSource = function () {
            return this.vertexSource;
        };
        Filter.prototype.getFragmentSource = function () {
            return this.fragmentSource;
        };
        Filter.clamp = function (low, value, high) {
            return Math.max(low, Math.min(value, high));
        };
        return Filter;
    })();
    jsfx.Filter = Filter;
})(jsfx || (jsfx = {}));
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var jsfx;
(function (jsfx) {
    var IterableFilter = (function (_super) {
        __extends(IterableFilter, _super);
        function IterableFilter() {
            _super.apply(this, arguments);
        }
        IterableFilter.prototype.drawCanvas = function (imageData) {
            return IterableFilter.drawCanvas([this], imageData);
        };
        IterableFilter.prototype.iterateCanvas = function (imageData) {
            throw new Error("Must be implemented");
        };
        IterableFilter.drawCanvas = function (filters, imageData) {
            var helper;
            for (var i = 0; i < imageData.data.length; i += 4) {
                helper = new jsfx.util.ImageDataHelper(imageData, i);
                for (var j = 0; j < filters.length; j++) {
                    filters[j].iterateCanvas(helper);
                }
                helper.save();
            }
            return imageData;
        };
        return IterableFilter;
    })(jsfx.Filter);
    jsfx.IterableFilter = IterableFilter;
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var hasWebGL = (function () {
        try {
            var canvas = document.createElement("canvas");
            return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
        }
        catch (e) {
            return false;
        }
    })();
    function Renderer(type) {
        if (!type) {
            type = hasWebGL ? "webgl" : "canvas";
        }
        if (type === "webgl") {
            return new jsfx.webgl.Renderer();
        }
        return new jsfx.canvas.Renderer();
    }
    jsfx.Renderer = Renderer;
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var Source = (function () {
        function Source(element) {
            this.element = element;
        }
        Object.defineProperty(Source.prototype, "width", {
            get: function () {
                return this.element.width;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Source.prototype, "height", {
            get: function () {
                return this.element.height;
            },
            enumerable: true,
            configurable: true
        });
        return Source;
    })();
    jsfx.Source = Source;
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var canvas;
    (function (canvas) {
        var Renderer = (function () {
            function Renderer() {
                this.canvas = jsfx.canvas.Renderer.createCanvas();
                this.ctx = this.canvas.getContext("2d");
                this.source = null;
                this.imageData = null;
            }
            Renderer.prototype.setSource = function (source) {
                // first, clean up
                if (this.source) {
                    this.cleanUp();
                }
                // re-set data and start rendering
                this.source = source;
                this.canvas.width = source.width;
                this.canvas.height = source.height;
                // draw the image on to a canvas we can manipulate
                this.ctx.drawImage(source.element, 0, 0, source.width, source.height);
                // store the pixels
                this.imageData = this.ctx.getImageData(0, 0, source.width, source.height);
                return this;
            };
            Renderer.prototype.getSource = function () {
                return this.source;
            };
            Renderer.prototype.applyFilter = function (filter) {
                this.imageData = filter.drawCanvas(this.imageData);
                return this;
            };
            Renderer.prototype.applyFilters = function (filters) {
                var stack = [];
                var filter;
                for (var i = 0; i < filters.length; i++) {
                    filter = filters[i];
                    if (filter instanceof jsfx.IterableFilter) {
                        stack.push(filter);
                    }
                    else {
                        // if there if something in the stack, apply that first
                        if (stack.length > 0) {
                            this.applyFilterStack(stack);
                            stack = [];
                        }
                        // apply current filter
                        this.applyFilter(filter);
                    }
                }
                // if there is still a stack left, apply it
                if (stack.length > 0) {
                    this.applyFilterStack(stack);
                }
                return this;
            };
            Renderer.prototype.applyFilterStack = function (stack) {
                this.imageData = jsfx.IterableFilter.drawCanvas(stack, this.imageData);
                return this;
            };
            Renderer.prototype.render = function () {
                this.ctx.putImageData(this.imageData, 0, 0);
            };
            Renderer.prototype.getCanvas = function () {
                return this.canvas;
            };
            Renderer.prototype.cleanUp = function () {
                this.imageData = null;
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            };
            Renderer.createCanvas = function () {
                return typeof Buffer !== "undefined" && typeof window === "undefined" ?
                    // Commented out, since it was causing require failures.
                    // new (require("canvas"))(100, 100) :
                    null :
                    document.createElement("canvas");
            };
            return Renderer;
        })();
        canvas.Renderer = Renderer;
    })(canvas = jsfx.canvas || (jsfx.canvas = {}));
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var filter;
    (function (filter) {
        /**
         * @filter         Blur
         * @description    This is the TriangleBlur from glfx, but for the canvas implementation, we are cheating by
         *                 using StackBlur. The implementations are obviously very different, but the results are very close.
         * @param radius   The radius of the pyramid convolved with the image.
         */
        var Blur = (function (_super) {
            __extends(Blur, _super);
            function Blur(radius) {
                _super.call(this, null, "\n            uniform sampler2D texture;\n            uniform vec2 delta;\n            varying vec2 texCoord;\n\n            void main() {\n                vec4 color = vec4(0.0);\n                float total = 0.0;\n\n                /* randomize the lookup values to hide the fixed number of samples */\n                //float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);\n\n                vec3 scale = vec3(12.9898, 78.233, 151.7182);\n                float offset = fract(sin(dot(gl_FragCoord.xyz + 0.0, scale)) * 43758.5453 + 0.0);\n\n                for (float t = -30.0; t <= 30.0; t++) {\n                    float percent = (t + offset - 0.5) / 30.0;\n                    float weight = 1.0 - abs(percent);\n                    vec4 sample = texture2D(texture, texCoord + delta * percent);\n\n                    /* switch to pre-multiplied alpha to correctly blur transparent images */\n                    sample.rgb *= sample.a;\n\n                    color += sample * weight;\n                    total += weight;\n                }\n\n                gl_FragColor = color / total;\n\n                /* switch back from pre-multiplied alpha */\n                gl_FragColor.rgb /= gl_FragColor.a + 0.00001;\n            }\n        ");
                // set properties
                this.properties.radius = radius;
            }
            Blur.prototype.drawWebGL = function (renderer) {
                var shader = renderer.getShader(this);
                var firstPass = { delta: [this.properties.radius / renderer.getSource().width, 0] };
                var secondPass = { delta: [0, this.properties.radius / renderer.getSource().height] };
                renderer.getTexture().use();
                renderer.getNextTexture().drawTo(function () {
                    shader.uniforms(firstPass).drawRect();
                });
                renderer.getTexture().use();
                renderer.getNextTexture().drawTo(function () {
                    shader.uniforms(secondPass).drawRect();
                });
            };
            Blur.prototype.drawCanvas = function (imageData) {
                var pixels = imageData.data;
                var radius = this.properties.radius;
                var width = imageData.width;
                var height = imageData.height;
                var x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum, a_sum, r_out_sum, g_out_sum, b_out_sum, a_out_sum, r_in_sum, g_in_sum, b_in_sum, a_in_sum, pr, pg, pb, pa, rbs;
                var div = radius + radius + 1;
                var widthMinus1 = width - 1;
                var heightMinus1 = height - 1;
                var radiusPlus1 = radius + 1;
                var sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2;
                var stackStart = new BlurStack();
                var stack = stackStart;
                for (i = 1; i < div; i++) {
                    stack = stack.next = new BlurStack();
                    if (i == radiusPlus1)
                        var stackEnd = stack;
                }
                stack.next = stackStart;
                var stackIn = null;
                var stackOut = null;
                yw = yi = 0;
                var mul_sum = mul_table[radius];
                var shg_sum = shg_table[radius];
                for (y = 0; y < height; y++) {
                    r_in_sum = g_in_sum = b_in_sum = a_in_sum = r_sum = g_sum = b_sum = a_sum = 0;
                    r_out_sum = radiusPlus1 * (pr = pixels[yi]);
                    g_out_sum = radiusPlus1 * (pg = pixels[yi + 1]);
                    b_out_sum = radiusPlus1 * (pb = pixels[yi + 2]);
                    a_out_sum = radiusPlus1 * (pa = pixels[yi + 3]);
                    r_sum += sumFactor * pr;
                    g_sum += sumFactor * pg;
                    b_sum += sumFactor * pb;
                    a_sum += sumFactor * pa;
                    stack = stackStart;
                    for (i = 0; i < radiusPlus1; i++) {
                        stack.r = pr;
                        stack.g = pg;
                        stack.b = pb;
                        stack.a = pa;
                        stack = stack.next;
                    }
                    for (i = 1; i < radiusPlus1; i++) {
                        p = yi + ((widthMinus1 < i ? widthMinus1 : i) << 2);
                        r_sum += (stack.r = (pr = pixels[p])) * (rbs = radiusPlus1 - i);
                        g_sum += (stack.g = (pg = pixels[p + 1])) * rbs;
                        b_sum += (stack.b = (pb = pixels[p + 2])) * rbs;
                        a_sum += (stack.a = (pa = pixels[p + 3])) * rbs;
                        r_in_sum += pr;
                        g_in_sum += pg;
                        b_in_sum += pb;
                        a_in_sum += pa;
                        stack = stack.next;
                    }
                    stackIn = stackStart;
                    stackOut = stackEnd;
                    for (x = 0; x < width; x++) {
                        pixels[yi + 3] = pa = (a_sum * mul_sum) >> shg_sum;
                        if (pa != 0) {
                            pa = 255 / pa;
                            pixels[yi] = ((r_sum * mul_sum) >> shg_sum) * pa;
                            pixels[yi + 1] = ((g_sum * mul_sum) >> shg_sum) * pa;
                            pixels[yi + 2] = ((b_sum * mul_sum) >> shg_sum) * pa;
                        }
                        else {
                            pixels[yi] = pixels[yi + 1] = pixels[yi + 2] = 0;
                        }
                        r_sum -= r_out_sum;
                        g_sum -= g_out_sum;
                        b_sum -= b_out_sum;
                        a_sum -= a_out_sum;
                        r_out_sum -= stackIn.r;
                        g_out_sum -= stackIn.g;
                        b_out_sum -= stackIn.b;
                        a_out_sum -= stackIn.a;
                        p = (yw + ((p = x + radius + 1) < widthMinus1 ? p : widthMinus1)) << 2;
                        r_in_sum += (stackIn.r = pixels[p]);
                        g_in_sum += (stackIn.g = pixels[p + 1]);
                        b_in_sum += (stackIn.b = pixels[p + 2]);
                        a_in_sum += (stackIn.a = pixels[p + 3]);
                        r_sum += r_in_sum;
                        g_sum += g_in_sum;
                        b_sum += b_in_sum;
                        a_sum += a_in_sum;
                        stackIn = stackIn.next;
                        r_out_sum += (pr = stackOut.r);
                        g_out_sum += (pg = stackOut.g);
                        b_out_sum += (pb = stackOut.b);
                        a_out_sum += (pa = stackOut.a);
                        r_in_sum -= pr;
                        g_in_sum -= pg;
                        b_in_sum -= pb;
                        a_in_sum -= pa;
                        stackOut = stackOut.next;
                        yi += 4;
                    }
                    yw += width;
                }
                for (x = 0; x < width; x++) {
                    g_in_sum = b_in_sum = a_in_sum = r_in_sum = g_sum = b_sum = a_sum = r_sum = 0;
                    yi = x << 2;
                    r_out_sum = radiusPlus1 * (pr = pixels[yi]);
                    g_out_sum = radiusPlus1 * (pg = pixels[yi + 1]);
                    b_out_sum = radiusPlus1 * (pb = pixels[yi + 2]);
                    a_out_sum = radiusPlus1 * (pa = pixels[yi + 3]);
                    r_sum += sumFactor * pr;
                    g_sum += sumFactor * pg;
                    b_sum += sumFactor * pb;
                    a_sum += sumFactor * pa;
                    stack = stackStart;
                    for (i = 0; i < radiusPlus1; i++) {
                        stack.r = pr;
                        stack.g = pg;
                        stack.b = pb;
                        stack.a = pa;
                        stack = stack.next;
                    }
                    yp = width;
                    for (i = 1; i <= radius; i++) {
                        yi = (yp + x) << 2;
                        r_sum += (stack.r = (pr = pixels[yi])) * (rbs = radiusPlus1 - i);
                        g_sum += (stack.g = (pg = pixels[yi + 1])) * rbs;
                        b_sum += (stack.b = (pb = pixels[yi + 2])) * rbs;
                        a_sum += (stack.a = (pa = pixels[yi + 3])) * rbs;
                        r_in_sum += pr;
                        g_in_sum += pg;
                        b_in_sum += pb;
                        a_in_sum += pa;
                        stack = stack.next;
                        if (i < heightMinus1) {
                            yp += width;
                        }
                    }
                    yi = x;
                    stackIn = stackStart;
                    stackOut = stackEnd;
                    for (y = 0; y < height; y++) {
                        p = yi << 2;
                        pixels[p + 3] = pa = (a_sum * mul_sum) >> shg_sum;
                        if (pa > 0) {
                            pa = 255 / pa;
                            pixels[p] = ((r_sum * mul_sum) >> shg_sum) * pa;
                            pixels[p + 1] = ((g_sum * mul_sum) >> shg_sum) * pa;
                            pixels[p + 2] = ((b_sum * mul_sum) >> shg_sum) * pa;
                        }
                        else {
                            pixels[p] = pixels[p + 1] = pixels[p + 2] = 0;
                        }
                        r_sum -= r_out_sum;
                        g_sum -= g_out_sum;
                        b_sum -= b_out_sum;
                        a_sum -= a_out_sum;
                        r_out_sum -= stackIn.r;
                        g_out_sum -= stackIn.g;
                        b_out_sum -= stackIn.b;
                        a_out_sum -= stackIn.a;
                        p = (x + (((p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1) * width)) << 2;
                        r_sum += (r_in_sum += (stackIn.r = pixels[p]));
                        g_sum += (g_in_sum += (stackIn.g = pixels[p + 1]));
                        b_sum += (b_in_sum += (stackIn.b = pixels[p + 2]));
                        a_sum += (a_in_sum += (stackIn.a = pixels[p + 3]));
                        stackIn = stackIn.next;
                        r_out_sum += (pr = stackOut.r);
                        g_out_sum += (pg = stackOut.g);
                        b_out_sum += (pb = stackOut.b);
                        a_out_sum += (pa = stackOut.a);
                        r_in_sum -= pr;
                        g_in_sum -= pg;
                        b_in_sum -= pb;
                        a_in_sum -= pa;
                        stackOut = stackOut.next;
                        yi += width;
                    }
                }
                return imageData;
            };
            return Blur;
        })(jsfx.Filter);
        filter.Blur = Blur;
        var mul_table = [
            512, 512, 456, 512, 328, 456, 335, 512, 405, 328, 271, 456, 388, 335, 292, 512,
            454, 405, 364, 328, 298, 271, 496, 456, 420, 388, 360, 335, 312, 292, 273, 512,
            482, 454, 428, 405, 383, 364, 345, 328, 312, 298, 284, 271, 259, 496, 475, 456,
            437, 420, 404, 388, 374, 360, 347, 335, 323, 312, 302, 292, 282, 273, 265, 512,
            497, 482, 468, 454, 441, 428, 417, 405, 394, 383, 373, 364, 354, 345, 337, 328,
            320, 312, 305, 298, 291, 284, 278, 271, 265, 259, 507, 496, 485, 475, 465, 456,
            446, 437, 428, 420, 412, 404, 396, 388, 381, 374, 367, 360, 354, 347, 341, 335,
            329, 323, 318, 312, 307, 302, 297, 292, 287, 282, 278, 273, 269, 265, 261, 512,
            505, 497, 489, 482, 475, 468, 461, 454, 447, 441, 435, 428, 422, 417, 411, 405,
            399, 394, 389, 383, 378, 373, 368, 364, 359, 354, 350, 345, 341, 337, 332, 328,
            324, 320, 316, 312, 309, 305, 301, 298, 294, 291, 287, 284, 281, 278, 274, 271,
            268, 265, 262, 259, 257, 507, 501, 496, 491, 485, 480, 475, 470, 465, 460, 456,
            451, 446, 442, 437, 433, 428, 424, 420, 416, 412, 408, 404, 400, 396, 392, 388,
            385, 381, 377, 374, 370, 367, 363, 360, 357, 354, 350, 347, 344, 341, 338, 335,
            332, 329, 326, 323, 320, 318, 315, 312, 310, 307, 304, 302, 299, 297, 294, 292,
            289, 287, 285, 282, 280, 278, 275, 273, 271, 269, 267, 265, 263, 261, 259];
        var shg_table = [
            9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17,
            17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19,
            19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20,
            20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21,
            21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
            21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22,
            22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
            22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23,
            23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
            23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
            23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
            23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
            24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
            24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
            24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
            24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24];
        var BlurStack = (function () {
            function BlurStack() {
                this.r = 0;
                this.g = 0;
                this.b = 0;
                this.a = 0;
                this.next = null;
            }
            return BlurStack;
        })();
    })(filter = jsfx.filter || (jsfx.filter = {}));
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var filter;
    (function (filter) {
        /**
         * @filter           Brightness
         * @description      Provides additive brightness control.
         * @param brightness -1 to 1 (-1 is solid black, 0 is no change, and 1 is solid white)
         */
        var Brightness = (function (_super) {
            __extends(Brightness, _super);
            function Brightness(brightness) {
                _super.call(this, null, "\n            uniform sampler2D texture;\n            uniform float brightness;\n            varying vec2 texCoord;\n\n            void main() {\n                vec4 color = texture2D(texture, texCoord);\n                color.rgb += brightness;\n\n                gl_FragColor = color;\n            }\n        ");
                // set properties
                this.properties.brightness = jsfx.Filter.clamp(-1, brightness, 1) || 0;
            }
            Brightness.prototype.iterateCanvas = function (helper) {
                var brightness = this.properties.brightness;
                helper.r += brightness;
                helper.g += brightness;
                helper.b += brightness;
            };
            return Brightness;
        })(jsfx.IterableFilter);
        filter.Brightness = Brightness;
    })(filter = jsfx.filter || (jsfx.filter = {}));
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var filter;
    (function (filter) {
        /**
         * @filter           Contrast
         * @description      Provides multiplicative contrast control.
         * @param contrast   -1 to 1 (-1 is solid gray, 0 is no change, and 1 is maximum contrast)
         */
        var Contrast = (function (_super) {
            __extends(Contrast, _super);
            function Contrast(contrast) {
                _super.call(this, null, "\n            uniform sampler2D texture;\n            uniform float contrast;\n            varying vec2 texCoord;\n\n            void main() {\n                vec4 color = texture2D(texture, texCoord);\n\n                if (contrast > 0.0) {\n                    color.rgb = (color.rgb - 0.5) / (1.0 - contrast) + 0.5;\n                } else {\n                    color.rgb = (color.rgb - 0.5) * (1.0 + contrast) + 0.5;\n                }\n\n                gl_FragColor = color;\n            }\n        ");
                // set properties
                this.properties.contrast = jsfx.Filter.clamp(-1, contrast, 1) || 0;
            }
            Contrast.prototype.iterateCanvas = function (helper) {
                var contrast = this.properties.contrast;
                if (contrast > 0) {
                    helper.r = (helper.r - 0.5) / (1 - contrast) + 0.5;
                    helper.g = (helper.g - 0.5) / (1 - contrast) + 0.5;
                    helper.b = (helper.b - 0.5) / (1 - contrast) + 0.5;
                }
                else {
                    helper.r = (helper.r - 0.5) * (1 + contrast) + 0.5;
                    helper.g = (helper.g - 0.5) * (1 + contrast) + 0.5;
                    helper.b = (helper.b - 0.5) * (1 + contrast) + 0.5;
                }
            };
            return Contrast;
        })(jsfx.IterableFilter);
        filter.Contrast = Contrast;
    })(filter = jsfx.filter || (jsfx.filter = {}));
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var filter;
    (function (filter) {
        /**
         * @filter      Curves
         * @description A powerful mapping tool that transforms the colors in the image
         *              by an arbitrary function. The function is interpolated between
         *              a set of 2D points using splines. The curves filter can take
         *              either one or three arguments which will apply the mapping to
         *              either luminance or RGB values, respectively.
         * @param red   A list of points that define the function for the red channel.
         *              Each point is a list of two values: the value before the mapping
         *              and the value after the mapping, both in the range 0 to 1. For
         *              example, [[0,1], [1,0]] would invert the red channel while
         *              [[0,0], [1,1]] would leave the red channel unchanged. If green
         *              and blue are omitted then this argument also applies to the
         *              green and blue channels.
         * @param green (optional) A list of points that define the function for the green
         *              channel (just like for red).
         * @param blue  (optional) A list of points that define the function for the blue
         *              channel (just like for red).
         */
        var Curves = (function (_super) {
            __extends(Curves, _super);
            function Curves(red, green, blue) {
                _super.call(this, null, "\n            uniform sampler2D texture;\n            uniform sampler2D map;\n            varying vec2 texCoord;\n\n            void main() {\n                vec4 color = texture2D(texture, texCoord);\n                color.r = texture2D(map, vec2(color.r)).r;\n                color.g = texture2D(map, vec2(color.g)).g;\n                color.b = texture2D(map, vec2(color.b)).b;\n                gl_FragColor = color;\n            }\n        ");
                this.red = red;
                this.green = green;
                this.blue = blue;
                // interpolate
                red = Curves.splineInterpolate(red);
                if (arguments.length == 1) {
                    green = blue = red;
                }
                else {
                    green = Curves.splineInterpolate(green);
                    blue = Curves.splineInterpolate(blue);
                }
                this.red = red;
                this.green = green;
                this.blue = blue;
            }
            Curves.prototype.drawCanvas = function (imageData) {
                var pixels = imageData.data;
                var amount = this.properties.amount;
                var r, g, b;
                for (var i = 0; i < pixels.length; i += 4) {
                    // get color values
                    r = pixels[i] / 255;
                    g = pixels[i + 1] / 255;
                    b = pixels[i + 2] / 255;
                    r = Math.min(1.0, (r * (1 - (0.607 * amount))) + (g * (0.769 * amount)) + (b * (0.189 * amount)));
                    g = Math.min(1.0, (r * 0.349 * amount) + (g * (1 - (0.314 * amount))) + (b * 0.168 * amount));
                    b = Math.min(1.0, (r * 0.272 * amount) + (g * 0.534 * amount) + (b * (1 - (0.869 * amount))));
                    // set values
                    pixels[i] = r * 255;
                    pixels[i + 1] = g * 255;
                    pixels[i + 2] = b * 255;
                }
                return imageData;
            };
            Curves.splineInterpolate = function (points) {
                var interpolator = new jsfx.util.SplineInterpolator(points);
                var array = [];
                for (var i = 0; i < 256; i++) {
                    array.push(jsfx.Filter.clamp(0, Math.floor(interpolator.interpolate(i / 255) * 256), 255));
                }
                return array;
            };
            return Curves;
        })(jsfx.Filter);
        filter.Curves = Curves;
    })(filter = jsfx.filter || (jsfx.filter = {}));
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var filter;
    (function (filter) {
        /**
         * @filter           Hue / Saturation
         * @description      Provides rotational hue control. RGB color space
         *                   can be imagined as a cube where the axes are the red, green, and blue color
         *                   values. Hue changing works by rotating the color vector around the grayscale
         *                   line, which is the straight line from black (0, 0, 0) to white (1, 1, 1).
         * @param hue        -1 to 1 (-1 is 180 degree rotation in the negative direction, 0 is no change,
         *                   and 1 is 180 degree rotation in the positive direction)
         */
        var Hue = (function (_super) {
            __extends(Hue, _super);
            function Hue(hue) {
                _super.call(this, null, "\n            uniform sampler2D texture;\n            uniform float hue;\n            varying vec2 texCoord;\n\n            void main() {\n                vec4 color = texture2D(texture, texCoord);\n\n                /* hue adjustment, wolfram alpha: RotationTransform[angle, {1, 1, 1}][{x, y, z}] */\n                float angle = hue * 3.14159265;\n                float s = sin(angle), c = cos(angle);\n                vec3 weights = (vec3(2.0 * c, -sqrt(3.0) * s - c, sqrt(3.0) * s - c) + 1.0) / 3.0;\n                color.rgb = vec3(\n                    dot(color.rgb, weights.xyz),\n                    dot(color.rgb, weights.zxy),\n                    dot(color.rgb, weights.yzx)\n                );\n\n                gl_FragColor = color;\n            }\n        ");
                // set properties
                this.properties.hue = jsfx.Filter.clamp(-1, hue, 1) || 0;
                // pre-calculate data for canvas iteration
                var angle = hue * 3.14159265;
                var sin = Math.sin(angle);
                var cos = Math.cos(angle);
                this.weights = new jsfx.util.Vector3(2 * cos, -Math.sqrt(3.0) * sin - cos, Math.sqrt(3.0) * sin - cos)
                    .addScalar(1.0)
                    .divideScalar(3.0);
            }
            Hue.prototype.iterateCanvas = function (helper) {
                var rgb = helper.toVector3();
                helper.r = rgb.dot(this.weights);
                helper.g = rgb.dotScalars(this.weights.z, this.weights.x, this.weights.y);
                helper.b = rgb.dotScalars(this.weights.y, this.weights.z, this.weights.x);
            };
            return Hue;
        })(jsfx.IterableFilter);
        filter.Hue = Hue;
    })(filter = jsfx.filter || (jsfx.filter = {}));
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var filter;
    (function (filter) {
        /**
         * @filter           Hue / Saturation
         * @description      Provides multiplicative saturation control. RGB color space
         *                   can be imagined as a cube where the axes are the red, green, and blue color
         *                   values.
         *                   Saturation is implemented by scaling all color channel values either toward
         *                   or away from the average color channel value.
         * @param saturation -1 to 1 (-1 is solid gray, 0 is no change, and 1 is maximum contrast)
         */
        var Saturation = (function (_super) {
            __extends(Saturation, _super);
            function Saturation(saturation) {
                _super.call(this, null, "\n            uniform sampler2D texture;\n            uniform float saturation;\n            varying vec2 texCoord;\n\n            void main() {\n                vec4 color = texture2D(texture, texCoord);\n\n                float average = (color.r + color.g + color.b) / 3.0;\n                if (saturation > 0.0) {\n                    color.rgb += (average - color.rgb) * (1.0 - 1.0 / (1.001 - saturation));\n                } else {\n                    color.rgb += (average - color.rgb) * (-saturation);\n                }\n\n                gl_FragColor = color;\n            }\n        ");
                // set properties
                this.properties.saturation = jsfx.Filter.clamp(-1, saturation, 1) || 0;
            }
            Saturation.prototype.iterateCanvas = function (helper) {
                var saturation = this.properties.saturation;
                var average = (helper.r + helper.g + helper.b) / 3;
                if (saturation > 0) {
                    helper.r += (average - helper.r) * (1 - 1 / (1.001 - saturation));
                    helper.g += (average - helper.g) * (1 - 1 / (1.001 - saturation));
                    helper.b += (average - helper.b) * (1 - 1 / (1.001 - saturation));
                }
                else {
                    helper.r += (average - helper.r) * (-saturation);
                    helper.g += (average - helper.g) * (-saturation);
                    helper.b += (average - helper.b) * (-saturation);
                }
            };
            return Saturation;
        })(jsfx.IterableFilter);
        filter.Saturation = Saturation;
    })(filter = jsfx.filter || (jsfx.filter = {}));
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var filter;
    (function (filter) {
        /**
         * @filter         Sepia
         * @description    Gives the image a reddish-brown monochrome tint that imitates an old photograph.
         * @param amount   0 to 1 (0 for no effect, 1 for full sepia coloring)
         */
        var Sepia = (function (_super) {
            __extends(Sepia, _super);
            function Sepia(amount) {
                _super.call(this, null, "\n            uniform sampler2D texture;\n            uniform float amount;\n            varying vec2 texCoord;\n\n            void main() {\n                vec4 color = texture2D(texture, texCoord);\n                float r = color.r;\n                float g = color.g;\n                float b = color.b;\n\n                color.r = min(1.0, (r * (1.0 - (0.607 * amount))) + (g * (0.769 * amount)) + (b * (0.189 * amount)));\n                color.g = min(1.0, (r * 0.349 * amount) + (g * (1.0 - (0.314 * amount))) + (b * 0.168 * amount));\n                color.b = min(1.0, (r * 0.272 * amount) + (g * 0.534 * amount) + (b * (1.0 - (0.869 * amount))));\n\n                gl_FragColor = color;\n            }\n        ");
                // set properties
                this.properties.amount = jsfx.Filter.clamp(-1, amount, 1) || 0;
            }
            Sepia.prototype.iterateCanvas = function (helper) {
                var r = helper.r;
                var g = helper.g;
                var b = helper.b;
                var amount = this.properties.amount;
                helper.r = Math.min(1.0, (r * (1.0 - (0.607 * amount))) + (g * (0.769 * amount)) + (b * (0.189 * amount)));
                helper.g = Math.min(1.0, (r * 0.349 * amount) + (g * (1.0 - (0.314 * amount))) + (b * 0.168 * amount));
                helper.b = Math.min(1.0, (r * 0.272 * amount) + (g * 0.534 * amount) + (b * (1.0 - (0.869 * amount))));
            };
            return Sepia;
        })(jsfx.IterableFilter);
        filter.Sepia = Sepia;
    })(filter = jsfx.filter || (jsfx.filter = {}));
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var filter;
    (function (filter) {
        /**
         * @filter         Unsharp Mask
         * @description    A form of image sharpening that amplifies high-frequencies in the image. It
         *                 is implemented by scaling pixels away from the average of their neighbors.
         * @param radius   0 to 180 - The blur radius that calculates the average of the neighboring pixels.
         * @param strength A scale factor where 0 is no effect and higher values cause a stronger effect.
         * @note           Could potentially be converted to an IterableFilter, but we somehow need the original ImageData
         */
        var UnsharpMask = (function (_super) {
            __extends(UnsharpMask, _super);
            function UnsharpMask(radius, strength) {
                _super.call(this, null, "\n            uniform sampler2D blurredTexture;\n            uniform sampler2D originalTexture;\n            uniform float strength;\n            uniform float threshold;\n            varying vec2 texCoord;\n\n            void main() {\n                vec4 blurred = texture2D(blurredTexture, texCoord);\n                vec4 original = texture2D(originalTexture, texCoord);\n                gl_FragColor = mix(blurred, original, 1.0 + strength);\n            }\n        ");
                // set properties
                this.properties.radius = radius;
                this.properties.strength = strength;
            }
            UnsharpMask.prototype.drawWebGL = function (renderer) {
                var shader = renderer.getShader(this);
                var radius = this.properties.radius;
                var strength = this.properties.strength;
                // create a new texture
                var extraTexture = renderer.createTexture();
                // use a texture and draw to it
                renderer.getTexture().use();
                extraTexture.drawTo(renderer.getDefaultShader().drawRect.bind(renderer.getDefaultShader()));
                // blur current texture
                extraTexture.use(1);
                // draw the blur
                var blur = new filter.Blur(radius);
                blur.drawWebGL(renderer);
                // use the stored texture to detect edges
                shader.textures({
                    originalTexture: 1
                });
                renderer.getTexture().use();
                renderer.getNextTexture().drawTo(function () {
                    shader.uniforms({ strength: strength }).drawRect();
                });
                extraTexture.unuse(1);
            };
            UnsharpMask.prototype.drawCanvas = function (imageData) {
                var pixels = imageData.data;
                // props
                var radius = this.properties.radius;
                var strength = this.properties.strength + 1;
                // clone of data
                // @todo: declared my own Uint8ClampedArray above since I am having issues with TypeScript.
                // additionally, my previous called imageData.data.set(original) (which I also can't here because of TS mapping)
                var original = new Uint8ClampedArray(imageData.data);
                imageData.data = original;
                // blur image
                var blur = new filter.Blur(radius);
                blur.drawCanvas(imageData);
                // trying to replicate mix() from webgl, which is basically x * (1 -a)
                for (var i = 0; i < pixels.length; i += 4) {
                    pixels[i] = pixels[i] * (1 - strength) + original[i] * strength;
                    pixels[i + 1] = pixels[i + 1] * (1 - strength) + original[i + 1] * strength;
                    pixels[i + 2] = pixels[i + 2] * (1 - strength) + original[i + 2] * strength;
                }
                return imageData;
            };
            return UnsharpMask;
        })(jsfx.Filter);
        filter.UnsharpMask = UnsharpMask;
    })(filter = jsfx.filter || (jsfx.filter = {}));
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var util;
    (function (util) {
        var ImageDataHelper = (function () {
            function ImageDataHelper(imageData, index) {
                this.imageData = imageData;
                this.index = index;
                this.r = this.imageData.data[index] / 255;
                this.g = this.imageData.data[index + 1] / 255;
                this.b = this.imageData.data[index + 2] / 255;
                this.a = this.imageData.data[index + 3] / 255;
            }
            ImageDataHelper.prototype.getImageData = function () {
                return this.imageData;
            };
            ImageDataHelper.prototype.save = function () {
                this.imageData.data[this.index] = this.r * 255;
                this.imageData.data[this.index + 1] = this.g * 255;
                this.imageData.data[this.index + 2] = this.b * 255;
                this.imageData.data[this.index + 3] = this.a * 255;
            };
            ImageDataHelper.prototype.toVector3 = function () {
                return new jsfx.util.Vector3(this.r, this.g, this.b);
            };
            ImageDataHelper.prototype.fromVector3 = function (v) {
                this.r = v.x;
                this.g = v.y;
                this.b = v.z;
            };
            return ImageDataHelper;
        })();
        util.ImageDataHelper = ImageDataHelper;
    })(util = jsfx.util || (jsfx.util = {}));
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var util;
    (function (util) {
        /**
         * From SplineInterpolator.cs in the Paint.NET source code
         */
        var SplineInterpolator = (function () {
            function SplineInterpolator(points) {
                this.points = points;
                var n = points.length;
                var i;
                this.xa = [];
                this.ya = [];
                this.u = [];
                this.y2 = [];
                points.sort(function (a, b) {
                    return a[0] - b[0];
                });
                for (i = 0; i < n; i++) {
                    this.xa.push(points[i][0]);
                    this.ya.push(points[i][1]);
                }
                this.u[0] = 0;
                this.y2[0] = 0;
                for (i = 1; i < n - 1; ++i) {
                    // This is the decomposition loop of the tri-diagonal algorithm.
                    // y2 and u are used for temporary storage of the decomposed factors.
                    var wx = this.xa[i + 1] - this.xa[i - 1];
                    var sig = (this.xa[i] - this.xa[i - 1]) / wx;
                    var p = sig * this.y2[i - 1] + 2.0;
                    this.y2[i] = (sig - 1.0) / p;
                    var ddydx = (this.ya[i + 1] - this.ya[i]) / (this.xa[i + 1] - this.xa[i]) -
                        (this.ya[i] - this.ya[i - 1]) / (this.xa[i] - this.xa[i - 1]);
                    this.u[i] = (6.0 * ddydx / wx - sig * this.u[i - 1]) / p;
                }
                this.y2[n - 1] = 0;
                // This is the back-substitution loop of the tri-diagonal algorithm
                for (i = n - 2; i >= 0; --i) {
                    this.y2[i] = this.y2[i] * this.y2[i + 1] + this.u[i];
                }
            }
            SplineInterpolator.prototype.interpolate = function (x) {
                var n = this.ya.length;
                var klo = 0;
                var khi = n - 1;
                // We will find the right place in the table by means of
                // bisection. This is optimal if sequential calls to this
                // routine are at random values of x. If sequential calls
                // are in order, and closely spaced, one would do better
                // to store previous values of klo and khi.
                while (khi - klo > 1) {
                    var k = (khi + klo) >> 1;
                    if (this.xa[k] > x) {
                        khi = k;
                    }
                    else {
                        klo = k;
                    }
                }
                var h = this.xa[khi] - this.xa[klo];
                var a = (this.xa[khi] - x) / h;
                var b = (x - this.xa[klo]) / h;
                // Cubic spline polynomial is now evaluated.
                return a * this.ya[klo] + b * this.ya[khi] +
                    ((a * a * a - a) * this.y2[klo] + (b * b * b - b) * this.y2[khi]) * (h * h) / 6.0;
            };
            return SplineInterpolator;
        })();
        util.SplineInterpolator = SplineInterpolator;
    })(util = jsfx.util || (jsfx.util = {}));
})(jsfx || (jsfx = {}));
/**
 * Vector3 Utility Class
 *  -> Taken from https://github.com/mrdoob/three.js/blob/master/src/math/Vector3.js with only the functions we need.
 */
var jsfx;
(function (jsfx) {
    var util;
    (function (util) {
        var Vector3 = (function () {
            function Vector3(x, y, z) {
                this.x = x;
                this.y = y;
                this.z = z;
            }
            Vector3.prototype.addScalar = function (s) {
                this.x += s;
                this.y += s;
                this.z += s;
                return this;
            };
            Vector3.prototype.multiplyScalar = function (s) {
                this.x *= s;
                this.y *= s;
                this.z *= s;
                return this;
            };
            Vector3.prototype.divideScalar = function (s) {
                if (s !== 0) {
                    var invScalar = 1 / s;
                    this.x *= invScalar;
                    this.y *= invScalar;
                    this.z *= invScalar;
                }
                else {
                    this.x = 0;
                    this.y = 0;
                    this.z = 0;
                }
                return this;
            };
            Vector3.prototype.length = function () {
                return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
            };
            Vector3.prototype.dot = function (v) {
                return this.x * v.x + this.y * v.y + this.z * v.z;
            };
            Vector3.prototype.dotScalars = function (x, y, z) {
                return this.x * x + this.y * y + this.z * z;
            };
            return Vector3;
        })();
        util.Vector3 = Vector3;
    })(util = jsfx.util || (jsfx.util = {}));
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var webgl;
    (function (webgl) {
        var Renderer = (function () {
            function Renderer() {
                this.canvas = document.createElement("canvas");
                this.gl = this.canvas.getContext("experimental-webgl", { premultipliedAlpha: false });
                this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
                // variables to store the source
                this.source = null;
                this.sourceTexture = null;
                // store the textures and buffers
                this.textures = null;
                this.currentTexture = 0;
                // initialize a shader cache
                this.gl.shaderCache = {};
            }
            Renderer.prototype.setSource = function (source) {
                // first, clean up
                if (this.source) {
                    this.cleanUp();
                }
                // re-initialize renderer for rendering with new source
                this.source = source;
                this.sourceTexture = jsfx.webgl.Texture.fromElement(this.gl, source.element);
                // initialize the renderer textures
                this.initialize();
                // draw the source texture onto the first texture
                this.sourceTexture.use();
                this.getTexture().drawTo(this.getDefaultShader().drawRect.bind(this.getDefaultShader()));
                return this;
            };
            Renderer.prototype.getSource = function () {
                return this.source;
            };
            Renderer.prototype.applyFilter = function (filter) {
                filter.drawWebGL(this);
                return this;
            };
            Renderer.prototype.applyFilters = function (filters) {
                var _this = this;
                filters.forEach(function (filter) {
                    filter.drawWebGL(_this);
                });
                return this;
            };
            Renderer.prototype.render = function () {
                this.getTexture().use();
                this.getFlippedShader().drawRect();
            };
            Renderer.prototype.getCanvas = function () {
                return this.canvas;
            };
            Renderer.prototype.getTexture = function () {
                return this.textures[this.currentTexture % 2];
            };
            Renderer.prototype.getNextTexture = function () {
                return this.textures[++this.currentTexture % 2];
            };
            Renderer.prototype.createTexture = function () {
                return new jsfx.webgl.Texture(this.gl, this.source.width, this.source.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE);
            };
            Renderer.prototype.getShader = function (filter) {
                var cacheKey = filter.getVertexSource() + filter.getFragmentSource();
                return this.gl.shaderCache.hasOwnProperty(cacheKey) ?
                    this.gl.shaderCache[cacheKey] :
                    new jsfx.webgl.Shader(this.gl, filter.getVertexSource(), filter.getFragmentSource());
            };
            Renderer.prototype.getDefaultShader = function () {
                if (!this.gl.shaderCache.def) {
                    this.gl.shaderCache.def = new jsfx.webgl.Shader(this.gl);
                }
                return this.gl.shaderCache.def;
            };
            Renderer.prototype.getFlippedShader = function () {
                if (!this.gl.shaderCache.flipped) {
                    this.gl.shaderCache.flipped = new jsfx.webgl.Shader(this.gl, null, "\n                uniform sampler2D texture;\n                varying vec2 texCoord;\n\n                void main() {\n                    gl_FragColor = texture2D(texture, vec2(texCoord.x, 1.0 - texCoord.y));\n                }\n            ");
                }
                return this.gl.shaderCache.flipped;
            };
            Renderer.prototype.initialize = function () {
                this.canvas.width = this.source.width;
                this.canvas.height = this.source.height;
                // initialize the textures
                var textures = [];
                for (var i = 0; i < 2; i++) {
                    textures.push(this.createTexture());
                }
                this.textures = textures;
            };
            Renderer.prototype.cleanUp = function () {
                // destroy source texture
                this.sourceTexture.destroy();
                // destroy textures used for filters
                for (var i = 0; i < 2; i++) {
                    this.textures[i].destroy();
                }
                // re-set textures
                this.textures = null;
            };
            return Renderer;
        })();
        webgl.Renderer = Renderer;
    })(webgl = jsfx.webgl || (jsfx.webgl = {}));
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var webgl;
    (function (webgl) {
        var Shader = (function () {
            function Shader(gl, vertexSource, fragmentSource) {
                this.gl = gl;
                // get the shader source
                this.vertexSource = vertexSource || Shader.defaultVertexSource;
                this.fragmentSource = fragmentSource || Shader.defaultFragmentSource;
                // set precision
                this.fragmentSource = "precision highp float;" + this.fragmentSource;
                // init vars
                this.vertexAttribute = null;
                this.texCoordAttribute = null;
                // create the program
                this.program = gl.createProgram();
                // attach the shaders
                gl.attachShader(this.program, compileSource(gl, gl.VERTEX_SHADER, this.vertexSource));
                gl.attachShader(this.program, compileSource(gl, gl.FRAGMENT_SHADER, this.fragmentSource));
                // link the program and ensure it worked
                gl.linkProgram(this.program);
                if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
                    throw "link error: " + gl.getProgramInfoLog(this.program);
                }
            }
            /**
             * textures are uniforms too but for some reason can't be specified by this.gl.uniform1f,
             * even though floating point numbers represent the integers 0 through 7 exactly
             *
             * @param textures
             * @returns {Shader}
             */
            Shader.prototype.textures = function (textures) {
                this.gl.useProgram(this.program);
                for (var name in textures) {
                    if (!textures.hasOwnProperty(name)) {
                        continue;
                    }
                    this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), textures[name]);
                }
                return this;
            };
            Shader.prototype.uniforms = function (uniforms) {
                this.gl.useProgram(this.program);
                for (var name in uniforms) {
                    if (!uniforms.hasOwnProperty(name)) {
                        continue;
                    }
                    var location = this.gl.getUniformLocation(this.program, name);
                    if (location === null) {
                        // will be null if the uniform isn't used in the shader
                        continue;
                    }
                    var value = uniforms[name];
                    if (isArray(value)) {
                        switch (value.length) {
                            case 1:
                                this.gl.uniform1fv(location, new Float32Array(value));
                                break;
                            case 2:
                                this.gl.uniform2fv(location, new Float32Array(value));
                                break;
                            case 3:
                                this.gl.uniform3fv(location, new Float32Array(value));
                                break;
                            case 4:
                                this.gl.uniform4fv(location, new Float32Array(value));
                                break;
                            case 9:
                                this.gl.uniformMatrix3fv(location, false, new Float32Array(value));
                                break;
                            case 16:
                                this.gl.uniformMatrix4fv(location, false, new Float32Array(value));
                                break;
                            default:
                                throw "dont't know how to load uniform \"" + name + "\" of length " + value.length;
                        }
                    }
                    else if (isNumber(value)) {
                        this.gl.uniform1f(location, value);
                    }
                    else {
                        throw "attempted to set uniform \"" + name + "\" to invalid value " + (value || "undefined").toString();
                    }
                }
                return this;
            };
            Shader.prototype.drawRect = function (left, top, right, bottom) {
                var undefined;
                var viewport = this.gl.getParameter(this.gl.VIEWPORT);
                top = top !== undefined ? (top - viewport[1]) / viewport[3] : 0;
                left = left !== undefined ? (left - viewport[0]) / viewport[2] : 0;
                right = right !== undefined ? (right - viewport[0]) / viewport[2] : 1;
                bottom = bottom !== undefined ? (bottom - viewport[1]) / viewport[3] : 1;
                if (!this.gl.vertexBuffer) {
                    this.gl.vertexBuffer = this.gl.createBuffer();
                }
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.vertexBuffer);
                this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([left, top, left, bottom, right, top, right, bottom]), this.gl.STATIC_DRAW);
                if (!this.gl.texCoordBuffer) {
                    this.gl.texCoordBuffer = this.gl.createBuffer();
                    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.texCoordBuffer);
                    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([0, 0, 0, 1, 1, 0, 1, 1]), this.gl.STATIC_DRAW);
                }
                if (this.vertexAttribute == null) {
                    this.vertexAttribute = this.gl.getAttribLocation(this.program, "vertex");
                    this.gl.enableVertexAttribArray(this.vertexAttribute);
                }
                if (this.texCoordAttribute == null) {
                    this.texCoordAttribute = this.gl.getAttribLocation(this.program, "_texCoord");
                    this.gl.enableVertexAttribArray(this.texCoordAttribute);
                }
                this.gl.useProgram(this.program);
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.vertexBuffer);
                this.gl.vertexAttribPointer(this.vertexAttribute, 2, this.gl.FLOAT, false, 0, 0);
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.texCoordBuffer);
                this.gl.vertexAttribPointer(this.texCoordAttribute, 2, this.gl.FLOAT, false, 0, 0);
                this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
            };
            Shader.prototype.destroy = function () {
                this.gl.deleteProgram(this.program);
                this.program = null;
            };
            Shader.defaultVertexSource = "\nattribute vec2 vertex;\nattribute vec2 _texCoord;\nvarying vec2 texCoord;\n\nvoid main() {\n    texCoord = _texCoord;\n    gl_Position = vec4(vertex * 2.0 - 1.0, 0.0, 1.0);\n}";
            Shader.defaultFragmentSource = "\nuniform sampler2D texture;\nvarying vec2 texCoord;\n\nvoid main() {\n    gl_FragColor = texture2D(texture, texCoord);\n}";
            return Shader;
        })();
        webgl.Shader = Shader;
        function compileSource(gl, type, source) {
            var shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                throw "compile error: " + gl.getShaderInfoLog(shader);
            }
            return shader;
        }
        function isArray(obj) {
            return Object.prototype.toString.call(obj) === "[object Array]";
        }
        function isNumber(obj) {
            return Object.prototype.toString.call(obj) === "[object Number]";
        }
    })(webgl = jsfx.webgl || (jsfx.webgl = {}));
})(jsfx || (jsfx = {}));
var jsfx;
(function (jsfx) {
    var webgl;
    (function (webgl) {
        var Texture = (function () {
            function Texture(gl, width, height, format, type) {
                if (format === void 0) { format = gl.RGBA; }
                if (type === void 0) { type = gl.UNSIGNED_BYTE; }
                this.gl = gl;
                this.width = width;
                this.height = height;
                this.format = format;
                this.type = type;
                this.id = gl.createTexture();
                this.element = null;
                gl.bindTexture(gl.TEXTURE_2D, this.id);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                if (width && height) {
                    gl.texImage2D(gl.TEXTURE_2D, 0, this.format, width, height, 0, this.format, this.type, null);
                }
            }
            Texture.prototype.loadContentsOf = function (element) {
                this.element = element;
                this.width = element.width;
                this.height = element.height;
                this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);
                this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.format, this.format, this.type, element);
            };
            Texture.prototype.initFromBytes = function (width, height, data) {
                this.width = width;
                this.height = height;
                this.format = this.gl.RGBA;
                this.type = this.gl.UNSIGNED_BYTE;
                this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);
                this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.type, new Uint8Array(data));
            };
            Texture.prototype.use = function (unit) {
                this.gl.activeTexture(this.gl.TEXTURE0 + (unit || 0));
                this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);
            };
            Texture.prototype.unuse = function (unit) {
                this.gl.activeTexture(this.gl.TEXTURE0 + (unit || 0));
                this.gl.bindTexture(this.gl.TEXTURE_2D, null);
            };
            Texture.prototype.drawTo = function (callback) {
                // create and bind frame buffer
                this.gl.frameBuffer = this.gl.frameBuffer || this.gl.createFramebuffer();
                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.gl.frameBuffer);
                this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.id, 0);
                // ensure there was no error
                if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
                    throw new Error("incomplete framebuffer");
                }
                // set the viewport
                this.gl.viewport(0, 0, this.width, this.height);
                // do the drawing
                callback();
                // stop rendering to this texture
                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
            };
            Texture.prototype.destroy = function () {
                this.gl.deleteTexture(this.id);
                this.id = null;
            };
            Texture.fromElement = function (gl, element) {
                var texture = new Texture(gl, 0, 0);
                texture.loadContentsOf(element);
                return texture;
            };
            return Texture;
        })();
        webgl.Texture = Texture;
    })(webgl = jsfx.webgl || (jsfx.webgl = {}));
})(jsfx || (jsfx = {}));

module.exports = jsfx;

}).call(this,require("buffer").Buffer)

},{"buffer":8}],3:[function(require,module,exports){
var Emitter = require('./emitter');

function Dropzone(el) {
  var self = this;
  var input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('multiple', true);
  input.style.display = 'none';
  input.addEventListener('change', function(e) {
    self.onFile_(e);
  });
  el.appendChild(input);

  el.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.stopPropagation();
    el.classList.add('dragover');
  });

  el.addEventListener('dragleave', function(e) {
    e.preventDefault();
    e.stopPropagation();
    el.classList.remove('dragover');
  });

  el.addEventListener('drop', function(e) {
    file = self.getFile_(e);
    e.preventDefault();
    e.stopPropagation();
    el.classList.remove('dragover');
    if (file) {
      self.onFile_(e);
    }
  });

  el.addEventListener('click', function() {
    // TODO: Figure out about re-enabling click to upload.
    //input.value = null;
    //input.click();
  });
}

Dropzone.prototype = new Emitter();

Dropzone.prototype.getFile_ = function(e) {
  var files;
  if (e.dataTransfer) {
    files = e.dataTransfer.files;
  } else if(e.target) {
    files = e.target.files;
  }

  if (files.length > 1) {
    this.emit('error', 'Multiple files dropped. Please convert one at a time.');
    return null;
  } else {
    // Just take the first file.
    return files[0];
  }
};

Dropzone.prototype.onFile_ = function(e) {
  var file = this.getFile_(e);
  if (!file.name.endsWith('jpg')) {
    this.emit('error', 'Dropped file must have the .jpg extension');
  } else {
    this.emit('file', file);
  }
};

module.exports = Dropzone;

},{"./emitter":4}],4:[function(require,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


function Emitter() {
  this.initEmitter();
}

Emitter.prototype.initEmitter = function() {
  this.callbacks = {};
};

Emitter.prototype.emit = function(eventName) {
  var callbacks = this.callbacks[eventName];
  if (!callbacks) {
    console.log('No valid callback specified.');
    return;
  }
  var args = [].slice.call(arguments)
  // Eliminate the first param (the callback).
  args.shift();
  for (var i = 0; i < callbacks.length; i++) {
    callbacks[i].apply(this, args);
  }
};

Emitter.prototype.on = function(eventName, callback) {
  if (eventName in this.callbacks) {
    var cbs = this.callbacks[eventName]
    if (cbs.indexOf(callback) == -1) {
      cbs.push(callback);
    }
  } else {
    this.callbacks[eventName] = [callback];
  }
};

Emitter.prototype.removeListener = function(eventName, callback) {
  if (!(eventName in this.callbacks)) {
    return;
  }
  var cbs = this.callbacks[eventName];
  var ind = cbs.indexOf(callback);
  if (ind == -1) {
    console.warn('No matching callback found');
    return;
  }
  cbs.splice(ind, 1);
};

module.exports = Emitter;

},{}],5:[function(require,module,exports){
var OdsConverter = require('./ods-converter');
// var Dropzone = require('./dropzone');

var TARGET_SIZE = 4096;

// var dz = document.querySelector('#dropzone');
// var dropzone = new Dropzone(dz);
// dropzone.on('file', onFileDropped);
// dropzone.on('error', onDropError);
//
// // const converter = new OdsConverter();
// // converter.on('convert', onOdsConverted);
// // converter.on('error', onOdsConversionError);
//
// // Make all dialogs disappear if clicked out of.
// dz.addEventListener('click', function(e) {
//   if (e.target.nodeName.toLowerCase() == 'dialog') {
//     if (dialog.open) {
//       dialog.close();
//     }
//   }
// });

// Hook up the open file link.
// document.querySelector('#openfile').addEventListener('click', onOpenClicked);
//
// var filename;
//
// function onFileDropped(file) {
//   // Show a new dialog.
//   showDialog('progress');
//
//   console.log('onFileDropped', file.name);
//   filename = file.name;
//
//   var reader = new FileReader();
//   reader.onload = function(e) {
//     var arrayBuffer = reader.result;
//     // Kick off the conversion process.
//     converter.convert(arrayBuffer);
//   }
//
//   reader.readAsArrayBuffer(file);
// }
//
// function onOdsConverted(canvas, audio) {
//   console.log('onOdsConverted, %s x %s', canvas.width, canvas.height);
//
//   canvas.toBlob(function(blob) {
//     var dlImage = document.querySelector('#dl-image');
//     dlImage.disabled = false;
//     dlImage.addEventListener('click', onImageClick);
//     function onImageClick() {
//       createLink(URL.createObjectURL(blob), getConvertedFilename(filename)).click();
//       dlImage.removeEventListener('click', onImageClick);
//     }
//
//     var dlAudio = document.querySelector('#dl-audio');
//     dlAudio.disabled = false;
//     dlAudio.addEventListener('click', onAudioClick);
//     function onAudioClick() {
//       createLink(audio, getConvertedFilename(filename, '.mp4')).click();
//       dlAudio.removeEventListener('click', onAudioClick);
//     }
//
//     showDialog('success');
//   }, 'image/jpeg');
//
// }

// function createLink(url, filename) {
//   var link = document.createElement('a');
//   link.download = filename;
//   link.href = url;
//   return link;
// }

// function onOdsConversionError(error) {
//   console.log('onOdsConversionError', error);
//   showDialog('fail')
//   setErrorMessage('Conversion error: ' + error);
// }
//
// function onDropError(error) {
//   console.log('onDropError', error);
//   showDialog('fail')
//   setErrorMessage('Drop error: ' + error);
// }

// function getConvertedFilename(filename, opt_ext) {
//   var extIndex = filename.lastIndexOf('.');
//   var basename = filename.substring(0, extIndex);
//   var ext = opt_ext || filename.substring(extIndex);
//   return basename + '-converted' + ext;
// }
//
// function showDialog(id) {
//   // Close previously open dialog (if it exists).
//   if (window.dialog && dialog.open) {
//     dialog.close();
//   }
//   dialog = document.querySelector('#' + id);
//   dialog.showModal();
// }

// function setErrorMessage(errorMessage) {
//   var error = document.querySelector('#error');
//   error.innerHTML = errorMessage;
// }

// function onOpenClicked(e) {
//   var input = document.createElement('input');
//   input.type = 'file';
//   input.click();
//   input.addEventListener('change', onFilePicked);
// }

// function onFilePicked(e) {
//   // TODO: Validation.
//   var file = e.path[0].files[0];
//   onFileDropped(file);
// };

},{"./dropzone":3,"./ods-converter":6}],6:[function(require,module,exports){
var EventEmitter3 = require('eventemitter3');
var jsfx = require('jsfx');


var startParsing;

var width = 640;

var M_SOI = 0xd8;
var M_APP1 = 0xe1;
var M_SOS = 0xda;

var XMP_SIGNATURE = 'http://ns.adobe.com/xap/1.0/';
var EXTENSTION_SIGNATURE = 'http://ns.adobe.com/xmp/extension/';
var EXT_PREFIX_LENGTH = 71;


var TARGET_SIZE = 4096;

function OdsConverter() {
  this.lastWidth = null;
}

OdsConverter.prototype = new EventEmitter3();

OdsConverter.prototype.convert = function(arrayBuffer) {
  this.decode_(arrayBuffer);
};

/**
 * Given the last converted Cardboard Camera image, this method returns the
 * best pow-of-two width for the image.
 */
OdsConverter.prototype.getOptimalWidth = function() {
  if (!this.lastWidth) {
    return -1;
  }
  return Math.ceil(Math.log(this.lastWidth)/Math.log(2))
};

OdsConverter.prototype.decode_ = function(arrayBuffer) {
  var scope = this;

  if (!arrayBuffer) {
    return;
  }
  startParsing = Date.now();
  console.log('Started parsing');
  var bytes = new Uint8Array(arrayBuffer);
  var doc = extractXMP(bytes, function(e) {
    scope.emit('error', e);
  });
  if (!doc) {
    // No valid doc, so we quit.
    return;
  }
  var gPano = getObjectMeta(doc, 'GPano');
  var gImage = getObjectMeta(doc, 'GImage');
  var gAudio = getObjectMeta(doc, 'GAudio');
  var image = makeImageFromBinary('image/jpeg', bytes);
  var audio = makeAudio(gAudio.Mime, gAudio.Data);

  image.onload = function () {
    this.setupScene_(gPano, gImage, image, audio);
  }.bind(this);

}

OdsConverter.prototype.setupScene_ = function(gPano, gImage, leftImage, audio) {
  // Ensure the right image is valid.
  if (!gImage.Mime || !gImage.Data) {
    this.emit('error', 'No valid right eye image found in the XMP metadata. This might not be a valid Cardboard Camera image.');
    return;
  }

  var rightImage = makeImage(gImage.Mime, gImage.Data);
  rightImage.onload = function () {
    console.log('Parsing took ' + (Date.now() - startParsing) + ' ms');
    this.buildImage_(leftImage, rightImage, gPano, audio);
  }.bind(this);
}

OdsConverter.prototype.buildImage_ = function(leftImage, rightImage, gPano, audio) {
  var fullWidth = parseInt(gPano['FullPanoWidthPixels']);
  var cropLeft = parseInt(gPano['CroppedAreaLeftPixels']);
  var cropTop = parseInt(gPano['CroppedAreaTopPixels']);
  var cropWidth = parseInt(gPano['CroppedAreaImageWidthPixels']);
  var initialHeadingDeg = parseInt(gPano['InitialViewHeadingDegrees']);

  var ratio = TARGET_SIZE / fullWidth;

  // Handle partial panos.
  var scaleWidth = 1;
  if (cropWidth != fullWidth) {
    scaleWidth = cropWidth / fullWidth;
  }

  // A canvas for the over-under rendering.
  var canvas = document.createElement('canvas');
  canvas.width = TARGET_SIZE;
  canvas.height = TARGET_SIZE;

  // Scaled dimensions for left and right eye images.
  var imageWidth = TARGET_SIZE * scaleWidth;
  var imageHeight = leftImage.height * ratio;

  // Save the original size of the most recently converted image.
  this.lastWidth = canvas.width;

  // Offsets for where to render each image. For partial panos (ie. imageWidth <
  // TARGET_SIZE), render the image centered.
  var offsetX = (TARGET_SIZE - imageWidth) / 2;
  var x = Math.floor(cropLeft * ratio) + offsetX;
  var y = Math.floor(cropTop * ratio);
  var ctx = canvas.getContext('2d');

  // Clear the canvas.
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the left and right images onto the canvas.
  ctx.drawImage(leftImage, x, y, imageWidth, imageHeight);
  ctx.drawImage(rightImage, x, y + canvas.height/2, imageWidth, imageHeight);

  var halfHeight = Math.floor(canvas.height / 2);
  // Offsets are the offsets for each eye.
  var offsets = [0, halfHeight];

  // Calculate how much to blur the image.
  var blurRadius = imageHeight / 2;

  for (var i = 0; i < offsets.length; i++) {
    var offset = offsets[i];

    // Calculate the dimensions of the actual image.
    var top = offset + y;
    var bottom = offset + y + imageHeight - 1;

    // Repeat the top part.
    repeatImage(canvas, top, offset);

    // Repeat the bottom part.
    repeatImage(canvas, bottom, offset + halfHeight);
  }
  var blurCanvas = blurImage(canvas, blurRadius);

  // Copy the blurred canvas onto the regular one.
  ctx.drawImage(blurCanvas, 0, 0);

  // Re-render the images themselves.
  ctx.drawImage(leftImage, x, y, imageWidth, imageHeight);
  ctx.drawImage(rightImage, x, y + canvas.height/2, imageWidth, imageHeight);

  this.emit('convert', canvas, audio);
}

function repeatImage(canvas, startY, endY) {
  var ctx = canvas.getContext('2d');

  var y = Math.min(startY, endY);
  var height = Math.abs(startY - endY);

  // Repeat the start line through the whole range.
  ctx.drawImage(canvas, 0, startY, canvas.width, 1,
                        0, y, canvas.width, height);

}

function blurImage(canvas, radius) {
  var source = new jsfx.Source(canvas);

  //var blurFilter = new jsfx.filter.Brightness(0.5);
  var blurFilter = new jsfx.filter.Blur(radius);

  var renderer = new jsfx.Renderer();
  renderer.setSource(source)
      .applyFilters([blurFilter])
      .render();

  return renderer.getCanvas();
}

function makeImage(mime, data) {
  var img = new Image();
  img.src = 'data:' + mime + ';base64,' + data;
  return img;
}

function makeImageFromBinary(mime, bytes) {
  var blob = new Blob([bytes], {type: mime});
  var url = URL.createObjectURL(blob);
  var img = new Image();
  img.src = url;
  return img;
}

function makeAudio(mime, data) {
  return 'data:' + mime + ';base64,' + data;
}

function byteToString(bytes, start, end) {
  var s = '';
  start = start || 0;
  end = end || bytes.length;
  for (var i = start; i < end; i++) {
    if (bytes[i]) {
      var c = String.fromCharCode(bytes[i]);
      s += c;
    }
  }
  return s;
}

function getObjectMeta (doc, tag) {
  var meta = {};
  var descriptions = doc.querySelectorAll('Description');
  for (var i = 0; i < descriptions.length; i++) {
    var node = descriptions[i];
    for (var j in node.attributes) {
      var attr = node.attributes[j];
      if (attr.prefix == tag) {
        meta[attr.localName] = attr.value;
      }
    }
  }
  return meta;
}

function extractXMP(bytes, errorCallback) {
  var sections = parseJpeg(bytes, true);
  if (sections === null) {
    errorCallback('No XMP metadata found in specified image file. This might not be a valid Cardboard Camera image.');
    return;
  }
  var xml = '';
  var visitedExtended = false;
  for (var i = 0; i < sections.length; i++) {
    var isXmp = true;
    var isExt = true;
    var section = sections[i];
    for (var j = 0; j < section.data.length; j++) {
      var a = String.fromCharCode(section.data[j]);
      if (isXmp && a != XMP_SIGNATURE[j]) {
        isXmp = false;
      }
      if (isExt && a != EXTENSTION_SIGNATURE[j]) {
        isExt = false;
      }
      if (!isExt || !isXmp) {
        break;
      }
    }

    if (isXmp) {
      var str = byteToString(section.data);
      var re = new RegExp('<x:xmpmeta([\\s\\S]*)</x:xmpmeta>');
      xml = str.match(re)[0];
    }
    else if (isExt) {
      var len = EXT_PREFIX_LENGTH;
      if (visitedExtended) {
        len +=4;
      }
      visitedExtended = true;
      xml += byteToString(section.data, len);
    }
  }
  var parser = new DOMParser();
  var doc = parser.parseFromString('<xml>' + xml + '</xml>', 'text/xml');
  return doc;
}

function binaryToBase64 (bytes) {
  var b64 = [];
  var pageSize = 100000;
  for (var i = 0; i < bytes.length; i += pageSize) {
    b64.push(btoa(String.fromCharCode.apply(null,
                                            bytes.subarray(i, i + pageSize))));
  }
  return b64.join('');
}

function parseJpeg (bytes, readMetaOnly) {
  var c;
  var i = 0;
  var read = function() {
    return i < bytes.length ? bytes[i++] : -1;
  };

  if (read() != 0xff || read() != M_SOI) {
    return null;
  }
  var sections = [];
  while((c = read()) != -1) {
    if (c != 0xff) {
      return null;
    }
    while((c = read()) == 0xff) {
    }

    if (c == -1) {
      return null
    }
    var marker = c;
    if (marker == M_SOS) {
      // M_SOS indicates that image data will follow and no metadata after
      // that so read all data at one time.
      if (!readMetaOnly) {
        var section = {
          marker: marker,
          length: -1,
          data: bytes.subarray(i)
        };
        sections.push(section);
      }
      return sections;
    }
    var lh = read();
    var ll = read();
    if (lh == -1 || ll == -1) {
      return null;
    }
    var length = lh << 8 | ll;
    if (!readMetaOnly || c == M_APP1) {
      var section = {
        marker: marker,
        length: length,
        data: bytes.subarray(i, i + length - 2)
      };
      sections.push(section);
    }
    // Move i to end of section.
    i += length - 2;
  }
  return sections;
}

module.exports = OdsConverter;
window.OdsConverter = OdsConverter;

},{"eventemitter3":1,"jsfx":2}],7:[function(require,module,exports){
'use strict'

exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

function init () {
  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i]
    revLookup[code.charCodeAt(i)] = i
  }

  revLookup['-'.charCodeAt(0)] = 62
  revLookup['_'.charCodeAt(0)] = 63
}

init()

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0

  // base64 is 4/3 + up to two characters of the original data
  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],8:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; i++) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  that.write(string, encoding)
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

function arrayIndexOf (arr, val, byteOffset, encoding) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var foundIndex = -1
  for (var i = 0; byteOffset + i < arrLength; i++) {
    if (read(arr, byteOffset + i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
      if (foundIndex === -1) foundIndex = i
      if (i - foundIndex + 1 === valLength) return (byteOffset + foundIndex) * indexSize
    } else {
      if (foundIndex !== -1) i -= i - foundIndex
      foundIndex = -1
    }
  }
  return -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  if (Buffer.isBuffer(val)) {
    // special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(this, val, byteOffset, encoding)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset, encoding)
  }

  throw new TypeError('val must be string, number or Buffer')
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; i++) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; i++) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"base64-js":7,"ieee754":9,"isarray":10}],9:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],10:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2hvbWVicmV3L2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIm5vZGVfbW9kdWxlcy9ldmVudGVtaXR0ZXIzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2pzZngvYnVpbGQvanNmeC5qcyIsInNyYy9kcm9wem9uZS5qcyIsInNyYy9lbWl0dGVyLmpzIiwic3JjL21haW4uanMiLCJzcmMvb2RzLWNvbnZlcnRlci5qcyIsIi4uLy4uLy4uL2hvbWVicmV3L2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jhc2U2NC1qcy9saWIvYjY0LmpzIiwiLi4vLi4vLi4vaG9tZWJyZXcvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwiLi4vLi4vLi4vaG9tZWJyZXcvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvaWVlZTc1NC9pbmRleC5qcyIsIi4uLy4uLy4uL2hvbWVicmV3L2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2lzYXJyYXkvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbFRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM1dkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM3R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQy9xREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5XG4gICwgcHJlZml4ID0gJ34nO1xuXG4vKipcbiAqIENvbnN0cnVjdG9yIHRvIGNyZWF0ZSBhIHN0b3JhZ2UgZm9yIG91ciBgRUVgIG9iamVjdHMuXG4gKiBBbiBgRXZlbnRzYCBpbnN0YW5jZSBpcyBhIHBsYWluIG9iamVjdCB3aG9zZSBwcm9wZXJ0aWVzIGFyZSBldmVudCBuYW1lcy5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBFdmVudHMoKSB7fVxuXG4vL1xuLy8gV2UgdHJ5IHRvIG5vdCBpbmhlcml0IGZyb20gYE9iamVjdC5wcm90b3R5cGVgLiBJbiBzb21lIGVuZ2luZXMgY3JlYXRpbmcgYW5cbi8vIGluc3RhbmNlIGluIHRoaXMgd2F5IGlzIGZhc3RlciB0aGFuIGNhbGxpbmcgYE9iamVjdC5jcmVhdGUobnVsbClgIGRpcmVjdGx5LlxuLy8gSWYgYE9iamVjdC5jcmVhdGUobnVsbClgIGlzIG5vdCBzdXBwb3J0ZWQgd2UgcHJlZml4IHRoZSBldmVudCBuYW1lcyB3aXRoIGFcbi8vIGNoYXJhY3RlciB0byBtYWtlIHN1cmUgdGhhdCB0aGUgYnVpbHQtaW4gb2JqZWN0IHByb3BlcnRpZXMgYXJlIG5vdFxuLy8gb3ZlcnJpZGRlbiBvciB1c2VkIGFzIGFuIGF0dGFjayB2ZWN0b3IuXG4vL1xuaWYgKE9iamVjdC5jcmVhdGUpIHtcbiAgRXZlbnRzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgLy9cbiAgLy8gVGhpcyBoYWNrIGlzIG5lZWRlZCBiZWNhdXNlIHRoZSBgX19wcm90b19fYCBwcm9wZXJ0eSBpcyBzdGlsbCBpbmhlcml0ZWQgaW5cbiAgLy8gc29tZSBvbGQgYnJvd3NlcnMgbGlrZSBBbmRyb2lkIDQsIGlQaG9uZSA1LjEsIE9wZXJhIDExIGFuZCBTYWZhcmkgNS5cbiAgLy9cbiAgaWYgKCFuZXcgRXZlbnRzKCkuX19wcm90b19fKSBwcmVmaXggPSBmYWxzZTtcbn1cblxuLyoqXG4gKiBSZXByZXNlbnRhdGlvbiBvZiBhIHNpbmdsZSBldmVudCBsaXN0ZW5lci5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgbGlzdGVuZXIgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBjb250ZXh0IFRoZSBjb250ZXh0IHRvIGludm9rZSB0aGUgbGlzdGVuZXIgd2l0aC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW29uY2U9ZmFsc2VdIFNwZWNpZnkgaWYgdGhlIGxpc3RlbmVyIGlzIGEgb25lLXRpbWUgbGlzdGVuZXIuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBFRShmbiwgY29udGV4dCwgb25jZSkge1xuICB0aGlzLmZuID0gZm47XG4gIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gIHRoaXMub25jZSA9IG9uY2UgfHwgZmFsc2U7XG59XG5cbi8qKlxuICogTWluaW1hbCBgRXZlbnRFbWl0dGVyYCBpbnRlcmZhY2UgdGhhdCBpcyBtb2xkZWQgYWdhaW5zdCB0aGUgTm9kZS5qc1xuICogYEV2ZW50RW1pdHRlcmAgaW50ZXJmYWNlLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQGFwaSBwdWJsaWNcbiAqL1xuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbn1cblxuLyoqXG4gKiBSZXR1cm4gYW4gYXJyYXkgbGlzdGluZyB0aGUgZXZlbnRzIGZvciB3aGljaCB0aGUgZW1pdHRlciBoYXMgcmVnaXN0ZXJlZFxuICogbGlzdGVuZXJzLlxuICpcbiAqIEByZXR1cm5zIHtBcnJheX1cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZXZlbnROYW1lcyA9IGZ1bmN0aW9uIGV2ZW50TmFtZXMoKSB7XG4gIHZhciBuYW1lcyA9IFtdXG4gICAgLCBldmVudHNcbiAgICAsIG5hbWU7XG5cbiAgaWYgKHRoaXMuX2V2ZW50c0NvdW50ID09PSAwKSByZXR1cm4gbmFtZXM7XG5cbiAgZm9yIChuYW1lIGluIChldmVudHMgPSB0aGlzLl9ldmVudHMpKSB7XG4gICAgaWYgKGhhcy5jYWxsKGV2ZW50cywgbmFtZSkpIG5hbWVzLnB1c2gocHJlZml4ID8gbmFtZS5zbGljZSgxKSA6IG5hbWUpO1xuICB9XG5cbiAgaWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMpIHtcbiAgICByZXR1cm4gbmFtZXMuY29uY2F0KE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMoZXZlbnRzKSk7XG4gIH1cblxuICByZXR1cm4gbmFtZXM7XG59O1xuXG4vKipcbiAqIFJldHVybiB0aGUgbGlzdGVuZXJzIHJlZ2lzdGVyZWQgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gZXhpc3RzIE9ubHkgY2hlY2sgaWYgdGhlcmUgYXJlIGxpc3RlbmVycy5cbiAqIEByZXR1cm5zIHtBcnJheXxCb29sZWFufVxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbiBsaXN0ZW5lcnMoZXZlbnQsIGV4aXN0cykge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudFxuICAgICwgYXZhaWxhYmxlID0gdGhpcy5fZXZlbnRzW2V2dF07XG5cbiAgaWYgKGV4aXN0cykgcmV0dXJuICEhYXZhaWxhYmxlO1xuICBpZiAoIWF2YWlsYWJsZSkgcmV0dXJuIFtdO1xuICBpZiAoYXZhaWxhYmxlLmZuKSByZXR1cm4gW2F2YWlsYWJsZS5mbl07XG5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBhdmFpbGFibGUubGVuZ3RoLCBlZSA9IG5ldyBBcnJheShsKTsgaSA8IGw7IGkrKykge1xuICAgIGVlW2ldID0gYXZhaWxhYmxlW2ldLmZuO1xuICB9XG5cbiAgcmV0dXJuIGVlO1xufTtcblxuLyoqXG4gKiBDYWxscyBlYWNoIG9mIHRoZSBsaXN0ZW5lcnMgcmVnaXN0ZXJlZCBmb3IgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHJldHVybnMge0Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgZXZlbnQgaGFkIGxpc3RlbmVycywgZWxzZSBgZmFsc2VgLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gZW1pdChldmVudCwgYTEsIGEyLCBhMywgYTQsIGE1KSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHJldHVybiBmYWxzZTtcblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF1cbiAgICAsIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGhcbiAgICAsIGFyZ3NcbiAgICAsIGk7XG5cbiAgaWYgKGxpc3RlbmVycy5mbikge1xuICAgIGlmIChsaXN0ZW5lcnMub25jZSkgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXJzLmZuLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgc3dpdGNoIChsZW4pIHtcbiAgICAgIGNhc2UgMTogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0KSwgdHJ1ZTtcbiAgICAgIGNhc2UgMjogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSksIHRydWU7XG4gICAgICBjYXNlIDM6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyKSwgdHJ1ZTtcbiAgICAgIGNhc2UgNDogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzKSwgdHJ1ZTtcbiAgICAgIGNhc2UgNTogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzLCBhNCksIHRydWU7XG4gICAgICBjYXNlIDY6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQsIGE1KSwgdHJ1ZTtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGkgPCBsZW47IGkrKykge1xuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgfVxuXG4gICAgbGlzdGVuZXJzLmZuLmFwcGx5KGxpc3RlbmVycy5jb250ZXh0LCBhcmdzKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgbGVuZ3RoID0gbGlzdGVuZXJzLmxlbmd0aFxuICAgICAgLCBqO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAobGlzdGVuZXJzW2ldLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVyc1tpXS5mbiwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgICAgc3dpdGNoIChsZW4pIHtcbiAgICAgICAgY2FzZSAxOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCk7IGJyZWFrO1xuICAgICAgICBjYXNlIDI6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSk7IGJyZWFrO1xuICAgICAgICBjYXNlIDM6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSwgYTIpOyBicmVhaztcbiAgICAgICAgY2FzZSA0OiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEsIGEyLCBhMyk7IGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlmICghYXJncykgZm9yIChqID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaiAtIDFdID0gYXJndW1lbnRzW2pdO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxpc3RlbmVyc1tpXS5mbi5hcHBseShsaXN0ZW5lcnNbaV0uY29udGV4dCwgYXJncyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vKipcbiAqIEFkZCBhIGxpc3RlbmVyIGZvciBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFN5bWJvbH0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgbGlzdGVuZXIgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBbY29udGV4dD10aGlzXSBUaGUgY29udGV4dCB0byBpbnZva2UgdGhlIGxpc3RlbmVyIHdpdGguXG4gKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSBgdGhpc2AuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gb24oZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHZhciBsaXN0ZW5lciA9IG5ldyBFRShmbiwgY29udGV4dCB8fCB0aGlzKVxuICAgICwgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSB0aGlzLl9ldmVudHNbZXZ0XSA9IGxpc3RlbmVyLCB0aGlzLl9ldmVudHNDb3VudCsrO1xuICBlbHNlIGlmICghdGhpcy5fZXZlbnRzW2V2dF0uZm4pIHRoaXMuX2V2ZW50c1tldnRdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlIHRoaXMuX2V2ZW50c1tldnRdID0gW3RoaXMuX2V2ZW50c1tldnRdLCBsaXN0ZW5lcl07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFkZCBhIG9uZS10aW1lIGxpc3RlbmVyIGZvciBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFN5bWJvbH0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgbGlzdGVuZXIgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBbY29udGV4dD10aGlzXSBUaGUgY29udGV4dCB0byBpbnZva2UgdGhlIGxpc3RlbmVyIHdpdGguXG4gKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSBgdGhpc2AuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbiBvbmNlKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICB2YXIgbGlzdGVuZXIgPSBuZXcgRUUoZm4sIGNvbnRleHQgfHwgdGhpcywgdHJ1ZSlcbiAgICAsIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgdGhpcy5fZXZlbnRzW2V2dF0gPSBsaXN0ZW5lciwgdGhpcy5fZXZlbnRzQ291bnQrKztcbiAgZWxzZSBpZiAoIXRoaXMuX2V2ZW50c1tldnRdLmZuKSB0aGlzLl9ldmVudHNbZXZ0XS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZSB0aGlzLl9ldmVudHNbZXZ0XSA9IFt0aGlzLl9ldmVudHNbZXZ0XSwgbGlzdGVuZXJdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgdGhlIGxpc3RlbmVycyBvZiBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFN5bWJvbH0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBPbmx5IHJlbW92ZSB0aGUgbGlzdGVuZXJzIHRoYXQgbWF0Y2ggdGhpcyBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IGNvbnRleHQgT25seSByZW1vdmUgdGhlIGxpc3RlbmVycyB0aGF0IGhhdmUgdGhpcyBjb250ZXh0LlxuICogQHBhcmFtIHtCb29sZWFufSBvbmNlIE9ubHkgcmVtb3ZlIG9uZS10aW1lIGxpc3RlbmVycy5cbiAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9IGB0aGlzYC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihldmVudCwgZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgcmV0dXJuIHRoaXM7XG4gIGlmICghZm4pIHtcbiAgICBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMCkgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICAgIGVsc2UgZGVsZXRlIHRoaXMuX2V2ZW50c1tldnRdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1tldnRdO1xuXG4gIGlmIChsaXN0ZW5lcnMuZm4pIHtcbiAgICBpZiAoXG4gICAgICAgICBsaXN0ZW5lcnMuZm4gPT09IGZuXG4gICAgICAmJiAoIW9uY2UgfHwgbGlzdGVuZXJzLm9uY2UpXG4gICAgICAmJiAoIWNvbnRleHQgfHwgbGlzdGVuZXJzLmNvbnRleHQgPT09IGNvbnRleHQpXG4gICAgKSB7XG4gICAgICBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMCkgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICAgICAgZWxzZSBkZWxldGUgdGhpcy5fZXZlbnRzW2V2dF07XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGZvciAodmFyIGkgPSAwLCBldmVudHMgPSBbXSwgbGVuZ3RoID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoXG4gICAgICAgICAgIGxpc3RlbmVyc1tpXS5mbiAhPT0gZm5cbiAgICAgICAgfHwgKG9uY2UgJiYgIWxpc3RlbmVyc1tpXS5vbmNlKVxuICAgICAgICB8fCAoY29udGV4dCAmJiBsaXN0ZW5lcnNbaV0uY29udGV4dCAhPT0gY29udGV4dClcbiAgICAgICkge1xuICAgICAgICBldmVudHMucHVzaChsaXN0ZW5lcnNbaV0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vXG4gICAgLy8gUmVzZXQgdGhlIGFycmF5LCBvciByZW1vdmUgaXQgY29tcGxldGVseSBpZiB3ZSBoYXZlIG5vIG1vcmUgbGlzdGVuZXJzLlxuICAgIC8vXG4gICAgaWYgKGV2ZW50cy5sZW5ndGgpIHRoaXMuX2V2ZW50c1tldnRdID0gZXZlbnRzLmxlbmd0aCA9PT0gMSA/IGV2ZW50c1swXSA6IGV2ZW50cztcbiAgICBlbHNlIGlmICgtLXRoaXMuX2V2ZW50c0NvdW50ID09PSAwKSB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gICAgZWxzZSBkZWxldGUgdGhpcy5fZXZlbnRzW2V2dF07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIGFsbCBsaXN0ZW5lcnMsIG9yIHRob3NlIG9mIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBbZXZlbnRdIFRoZSBldmVudCBuYW1lLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbiByZW1vdmVBbGxMaXN0ZW5lcnMoZXZlbnQpIHtcbiAgdmFyIGV2dDtcblxuICBpZiAoZXZlbnQpIHtcbiAgICBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuICAgIGlmICh0aGlzLl9ldmVudHNbZXZ0XSkge1xuICAgICAgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgICAgIGVsc2UgZGVsZXRlIHRoaXMuX2V2ZW50c1tldnRdO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gICAgdGhpcy5fZXZlbnRzQ291bnQgPSAwO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vL1xuLy8gQWxpYXMgbWV0aG9kcyBuYW1lcyBiZWNhdXNlIHBlb3BsZSByb2xsIGxpa2UgdGhhdC5cbi8vXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXI7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbjtcblxuLy9cbi8vIFRoaXMgZnVuY3Rpb24gZG9lc24ndCBhcHBseSBhbnltb3JlLlxuLy9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24gc2V0TWF4TGlzdGVuZXJzKCkge1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8vXG4vLyBFeHBvc2UgdGhlIHByZWZpeC5cbi8vXG5FdmVudEVtaXR0ZXIucHJlZml4ZWQgPSBwcmVmaXg7XG5cbi8vXG4vLyBFeHBvc2UgdGhlIG1vZHVsZS5cbi8vXG5pZiAoJ3VuZGVmaW5lZCcgIT09IHR5cGVvZiBtb2R1bGUpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG59XG4iLCJ2YXIganNmeDtcclxuKGZ1bmN0aW9uIChqc2Z4KSB7XHJcbiAgICB2YXIgRmlsdGVyID0gKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBmdW5jdGlvbiBGaWx0ZXIodmVydGV4U291cmNlLCBmcmFnbWVudFNvdXJjZSkge1xyXG4gICAgICAgICAgICBpZiAodmVydGV4U291cmNlID09PSB2b2lkIDApIHsgdmVydGV4U291cmNlID0gbnVsbDsgfVxyXG4gICAgICAgICAgICBpZiAoZnJhZ21lbnRTb3VyY2UgPT09IHZvaWQgMCkgeyBmcmFnbWVudFNvdXJjZSA9IG51bGw7IH1cclxuICAgICAgICAgICAgdGhpcy52ZXJ0ZXhTb3VyY2UgPSB2ZXJ0ZXhTb3VyY2U7XHJcbiAgICAgICAgICAgIHRoaXMuZnJhZ21lbnRTb3VyY2UgPSBmcmFnbWVudFNvdXJjZTtcclxuICAgICAgICAgICAgdGhpcy5wcm9wZXJ0aWVzID0ge307XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFJldHVybnMgYWxsIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBzaGFkZXIuIFVzZWZ1bCBmb3IgZHJhd1dlYkdsIHdoZW4gYXJlIGFyZSBqdXN0IHBhc3NpbmcgYWxvbmcgZGF0YVxyXG4gICAgICAgICAqIHRvIHRoZSBzaGFkZXIuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcmV0dXJucyB7e318Kn1cclxuICAgICAgICAgKi9cclxuICAgICAgICBGaWx0ZXIucHJvdG90eXBlLmdldFByb3BlcnRpZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnByb3BlcnRpZXM7XHJcbiAgICAgICAgfTtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBUaGUgamF2YXNjcmlwdCBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgZmlsdGVyXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcGFyYW0gaW1hZ2VEYXRhXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgRmlsdGVyLnByb3RvdHlwZS5kcmF3Q2FudmFzID0gZnVuY3Rpb24gKGltYWdlRGF0YSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IGJlIGltcGxlbWVudGVkXCIpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhlIFdlYkdMIGltcGxlbWVudGF0aW9uIG9mIHRoZSBmaWx0ZXJcclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEBwYXJhbSByZW5kZXJlclxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIEZpbHRlci5wcm90b3R5cGUuZHJhd1dlYkdMID0gZnVuY3Rpb24gKHJlbmRlcmVyKSB7XHJcbiAgICAgICAgICAgIHZhciBzaGFkZXIgPSByZW5kZXJlci5nZXRTaGFkZXIodGhpcyk7XHJcbiAgICAgICAgICAgIHZhciBwcm9wZXJ0aWVzID0gdGhpcy5nZXRQcm9wZXJ0aWVzKCk7XHJcbiAgICAgICAgICAgIHJlbmRlcmVyLmdldFRleHR1cmUoKS51c2UoKTtcclxuICAgICAgICAgICAgcmVuZGVyZXIuZ2V0TmV4dFRleHR1cmUoKS5kcmF3VG8oZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgc2hhZGVyLnVuaWZvcm1zKHByb3BlcnRpZXMpLmRyYXdSZWN0KCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgRmlsdGVyLnByb3RvdHlwZS5nZXRWZXJ0ZXhTb3VyY2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZlcnRleFNvdXJjZTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIEZpbHRlci5wcm90b3R5cGUuZ2V0RnJhZ21lbnRTb3VyY2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZyYWdtZW50U291cmNlO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgRmlsdGVyLmNsYW1wID0gZnVuY3Rpb24gKGxvdywgdmFsdWUsIGhpZ2gpIHtcclxuICAgICAgICAgICAgcmV0dXJuIE1hdGgubWF4KGxvdywgTWF0aC5taW4odmFsdWUsIGhpZ2gpKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBGaWx0ZXI7XHJcbiAgICB9KSgpO1xyXG4gICAganNmeC5GaWx0ZXIgPSBGaWx0ZXI7XHJcbn0pKGpzZnggfHwgKGpzZnggPSB7fSkpO1xyXG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IGZ1bmN0aW9uIChkLCBiKSB7XHJcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcclxuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxyXG4gICAgX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGU7XHJcbiAgICBkLnByb3RvdHlwZSA9IG5ldyBfXygpO1xyXG59O1xyXG52YXIganNmeDtcclxuKGZ1bmN0aW9uIChqc2Z4KSB7XHJcbiAgICB2YXIgSXRlcmFibGVGaWx0ZXIgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xyXG4gICAgICAgIF9fZXh0ZW5kcyhJdGVyYWJsZUZpbHRlciwgX3N1cGVyKTtcclxuICAgICAgICBmdW5jdGlvbiBJdGVyYWJsZUZpbHRlcigpIHtcclxuICAgICAgICAgICAgX3N1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIEl0ZXJhYmxlRmlsdGVyLnByb3RvdHlwZS5kcmF3Q2FudmFzID0gZnVuY3Rpb24gKGltYWdlRGF0YSkge1xyXG4gICAgICAgICAgICByZXR1cm4gSXRlcmFibGVGaWx0ZXIuZHJhd0NhbnZhcyhbdGhpc10sIGltYWdlRGF0YSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBJdGVyYWJsZUZpbHRlci5wcm90b3R5cGUuaXRlcmF0ZUNhbnZhcyA9IGZ1bmN0aW9uIChpbWFnZURhdGEpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTXVzdCBiZSBpbXBsZW1lbnRlZFwiKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIEl0ZXJhYmxlRmlsdGVyLmRyYXdDYW52YXMgPSBmdW5jdGlvbiAoZmlsdGVycywgaW1hZ2VEYXRhKSB7XHJcbiAgICAgICAgICAgIHZhciBoZWxwZXI7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW1hZ2VEYXRhLmRhdGEubGVuZ3RoOyBpICs9IDQpIHtcclxuICAgICAgICAgICAgICAgIGhlbHBlciA9IG5ldyBqc2Z4LnV0aWwuSW1hZ2VEYXRhSGVscGVyKGltYWdlRGF0YSwgaSk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGZpbHRlcnMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJzW2pdLml0ZXJhdGVDYW52YXMoaGVscGVyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGhlbHBlci5zYXZlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGltYWdlRGF0YTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiBJdGVyYWJsZUZpbHRlcjtcclxuICAgIH0pKGpzZnguRmlsdGVyKTtcclxuICAgIGpzZnguSXRlcmFibGVGaWx0ZXIgPSBJdGVyYWJsZUZpbHRlcjtcclxufSkoanNmeCB8fCAoanNmeCA9IHt9KSk7XHJcbnZhciBqc2Z4O1xyXG4oZnVuY3Rpb24gKGpzZngpIHtcclxuICAgIHZhciBoYXNXZWJHTCA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7XHJcbiAgICAgICAgICAgIHJldHVybiAhIShjYW52YXMuZ2V0Q29udGV4dChcIndlYmdsXCIpIHx8IGNhbnZhcy5nZXRDb250ZXh0KFwiZXhwZXJpbWVudGFsLXdlYmdsXCIpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0pKCk7XHJcbiAgICBmdW5jdGlvbiBSZW5kZXJlcih0eXBlKSB7XHJcbiAgICAgICAgaWYgKCF0eXBlKSB7XHJcbiAgICAgICAgICAgIHR5cGUgPSBoYXNXZWJHTCA/IFwid2ViZ2xcIiA6IFwiY2FudmFzXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlID09PSBcIndlYmdsXCIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBqc2Z4LndlYmdsLlJlbmRlcmVyKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBuZXcganNmeC5jYW52YXMuUmVuZGVyZXIoKTtcclxuICAgIH1cclxuICAgIGpzZnguUmVuZGVyZXIgPSBSZW5kZXJlcjtcclxufSkoanNmeCB8fCAoanNmeCA9IHt9KSk7XHJcbnZhciBqc2Z4O1xyXG4oZnVuY3Rpb24gKGpzZngpIHtcclxuICAgIHZhciBTb3VyY2UgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGZ1bmN0aW9uIFNvdXJjZShlbGVtZW50KSB7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShTb3VyY2UucHJvdG90eXBlLCBcIndpZHRoXCIsIHtcclxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LndpZHRoO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgICAgICB9KTtcclxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoU291cmNlLnByb3RvdHlwZSwgXCJoZWlnaHRcIiwge1xyXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuaGVpZ2h0O1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gU291cmNlO1xyXG4gICAgfSkoKTtcclxuICAgIGpzZnguU291cmNlID0gU291cmNlO1xyXG59KShqc2Z4IHx8IChqc2Z4ID0ge30pKTtcclxudmFyIGpzZng7XHJcbihmdW5jdGlvbiAoanNmeCkge1xyXG4gICAgdmFyIGNhbnZhcztcclxuICAgIChmdW5jdGlvbiAoY2FudmFzKSB7XHJcbiAgICAgICAgdmFyIFJlbmRlcmVyID0gKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZnVuY3Rpb24gUmVuZGVyZXIoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNhbnZhcyA9IGpzZnguY2FudmFzLlJlbmRlcmVyLmNyZWF0ZUNhbnZhcygpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdHggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNvdXJjZSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmltYWdlRGF0YSA9IG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgUmVuZGVyZXIucHJvdG90eXBlLnNldFNvdXJjZSA9IGZ1bmN0aW9uIChzb3VyY2UpIHtcclxuICAgICAgICAgICAgICAgIC8vIGZpcnN0LCBjbGVhbiB1cFxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc291cmNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGVhblVwKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyByZS1zZXQgZGF0YSBhbmQgc3RhcnQgcmVuZGVyaW5nXHJcbiAgICAgICAgICAgICAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2FudmFzLndpZHRoID0gc291cmNlLndpZHRoO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gc291cmNlLmhlaWdodDtcclxuICAgICAgICAgICAgICAgIC8vIGRyYXcgdGhlIGltYWdlIG9uIHRvIGEgY2FudmFzIHdlIGNhbiBtYW5pcHVsYXRlXHJcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5kcmF3SW1hZ2Uoc291cmNlLmVsZW1lbnQsIDAsIDAsIHNvdXJjZS53aWR0aCwgc291cmNlLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAvLyBzdG9yZSB0aGUgcGl4ZWxzXHJcbiAgICAgICAgICAgICAgICB0aGlzLmltYWdlRGF0YSA9IHRoaXMuY3R4LmdldEltYWdlRGF0YSgwLCAwLCBzb3VyY2Uud2lkdGgsIHNvdXJjZS5oZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFJlbmRlcmVyLnByb3RvdHlwZS5nZXRTb3VyY2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zb3VyY2U7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFJlbmRlcmVyLnByb3RvdHlwZS5hcHBseUZpbHRlciA9IGZ1bmN0aW9uIChmaWx0ZXIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW1hZ2VEYXRhID0gZmlsdGVyLmRyYXdDYW52YXModGhpcy5pbWFnZURhdGEpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFJlbmRlcmVyLnByb3RvdHlwZS5hcHBseUZpbHRlcnMgPSBmdW5jdGlvbiAoZmlsdGVycykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0YWNrID0gW107XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlsdGVyO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmaWx0ZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyID0gZmlsdGVyc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZmlsdGVyIGluc3RhbmNlb2YganNmeC5JdGVyYWJsZUZpbHRlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKGZpbHRlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGVyZSBpZiBzb21ldGhpbmcgaW4gdGhlIHN0YWNrLCBhcHBseSB0aGF0IGZpcnN0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGFjay5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcGx5RmlsdGVyU3RhY2soc3RhY2spO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2sgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhcHBseSBjdXJyZW50IGZpbHRlclxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcGx5RmlsdGVyKGZpbHRlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gaWYgdGhlcmUgaXMgc3RpbGwgYSBzdGFjayBsZWZ0LCBhcHBseSBpdFxyXG4gICAgICAgICAgICAgICAgaWYgKHN0YWNrLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcGx5RmlsdGVyU3RhY2soc3RhY2spO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFJlbmRlcmVyLnByb3RvdHlwZS5hcHBseUZpbHRlclN0YWNrID0gZnVuY3Rpb24gKHN0YWNrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmltYWdlRGF0YSA9IGpzZnguSXRlcmFibGVGaWx0ZXIuZHJhd0NhbnZhcyhzdGFjaywgdGhpcy5pbWFnZURhdGEpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFJlbmRlcmVyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5wdXRJbWFnZURhdGEodGhpcy5pbWFnZURhdGEsIDAsIDApO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBSZW5kZXJlci5wcm90b3R5cGUuZ2V0Q2FudmFzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FudmFzO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBSZW5kZXJlci5wcm90b3R5cGUuY2xlYW5VcCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW1hZ2VEYXRhID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgUmVuZGVyZXIuY3JlYXRlQ2FudmFzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBCdWZmZXIgIT09IFwidW5kZWZpbmVkXCIgJiYgdHlwZW9mIHdpbmRvdyA9PT0gXCJ1bmRlZmluZWRcIiA/XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ29tbWVudGVkIG91dCwgc2luY2UgaXQgd2FzIGNhdXNpbmcgcmVxdWlyZSBmYWlsdXJlcy5cclxuICAgICAgICAgICAgICAgICAgICAvLyBuZXcgKHJlcXVpcmUoXCJjYW52YXNcIikpKDEwMCwgMTAwKSA6XHJcbiAgICAgICAgICAgICAgICAgICAgbnVsbCA6XHJcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgcmV0dXJuIFJlbmRlcmVyO1xyXG4gICAgICAgIH0pKCk7XHJcbiAgICAgICAgY2FudmFzLlJlbmRlcmVyID0gUmVuZGVyZXI7XHJcbiAgICB9KShjYW52YXMgPSBqc2Z4LmNhbnZhcyB8fCAoanNmeC5jYW52YXMgPSB7fSkpO1xyXG59KShqc2Z4IHx8IChqc2Z4ID0ge30pKTtcclxudmFyIGpzZng7XHJcbihmdW5jdGlvbiAoanNmeCkge1xyXG4gICAgdmFyIGZpbHRlcjtcclxuICAgIChmdW5jdGlvbiAoZmlsdGVyKSB7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQGZpbHRlciAgICAgICAgIEJsdXJcclxuICAgICAgICAgKiBAZGVzY3JpcHRpb24gICAgVGhpcyBpcyB0aGUgVHJpYW5nbGVCbHVyIGZyb20gZ2xmeCwgYnV0IGZvciB0aGUgY2FudmFzIGltcGxlbWVudGF0aW9uLCB3ZSBhcmUgY2hlYXRpbmcgYnlcclxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgdXNpbmcgU3RhY2tCbHVyLiBUaGUgaW1wbGVtZW50YXRpb25zIGFyZSBvYnZpb3VzbHkgdmVyeSBkaWZmZXJlbnQsIGJ1dCB0aGUgcmVzdWx0cyBhcmUgdmVyeSBjbG9zZS5cclxuICAgICAgICAgKiBAcGFyYW0gcmFkaXVzICAgVGhlIHJhZGl1cyBvZiB0aGUgcHlyYW1pZCBjb252b2x2ZWQgd2l0aCB0aGUgaW1hZ2UuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdmFyIEJsdXIgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xyXG4gICAgICAgICAgICBfX2V4dGVuZHMoQmx1ciwgX3N1cGVyKTtcclxuICAgICAgICAgICAgZnVuY3Rpb24gQmx1cihyYWRpdXMpIHtcclxuICAgICAgICAgICAgICAgIF9zdXBlci5jYWxsKHRoaXMsIG51bGwsIFwiXFxuICAgICAgICAgICAgdW5pZm9ybSBzYW1wbGVyMkQgdGV4dHVyZTtcXG4gICAgICAgICAgICB1bmlmb3JtIHZlYzIgZGVsdGE7XFxuICAgICAgICAgICAgdmFyeWluZyB2ZWMyIHRleENvb3JkO1xcblxcbiAgICAgICAgICAgIHZvaWQgbWFpbigpIHtcXG4gICAgICAgICAgICAgICAgdmVjNCBjb2xvciA9IHZlYzQoMC4wKTtcXG4gICAgICAgICAgICAgICAgZmxvYXQgdG90YWwgPSAwLjA7XFxuXFxuICAgICAgICAgICAgICAgIC8qIHJhbmRvbWl6ZSB0aGUgbG9va3VwIHZhbHVlcyB0byBoaWRlIHRoZSBmaXhlZCBudW1iZXIgb2Ygc2FtcGxlcyAqL1xcbiAgICAgICAgICAgICAgICAvL2Zsb2F0IG9mZnNldCA9IHJhbmRvbSh2ZWMzKDEyLjk4OTgsIDc4LjIzMywgMTUxLjcxODIpLCAwLjApO1xcblxcbiAgICAgICAgICAgICAgICB2ZWMzIHNjYWxlID0gdmVjMygxMi45ODk4LCA3OC4yMzMsIDE1MS43MTgyKTtcXG4gICAgICAgICAgICAgICAgZmxvYXQgb2Zmc2V0ID0gZnJhY3Qoc2luKGRvdChnbF9GcmFnQ29vcmQueHl6ICsgMC4wLCBzY2FsZSkpICogNDM3NTguNTQ1MyArIDAuMCk7XFxuXFxuICAgICAgICAgICAgICAgIGZvciAoZmxvYXQgdCA9IC0zMC4wOyB0IDw9IDMwLjA7IHQrKykge1xcbiAgICAgICAgICAgICAgICAgICAgZmxvYXQgcGVyY2VudCA9ICh0ICsgb2Zmc2V0IC0gMC41KSAvIDMwLjA7XFxuICAgICAgICAgICAgICAgICAgICBmbG9hdCB3ZWlnaHQgPSAxLjAgLSBhYnMocGVyY2VudCk7XFxuICAgICAgICAgICAgICAgICAgICB2ZWM0IHNhbXBsZSA9IHRleHR1cmUyRCh0ZXh0dXJlLCB0ZXhDb29yZCArIGRlbHRhICogcGVyY2VudCk7XFxuXFxuICAgICAgICAgICAgICAgICAgICAvKiBzd2l0Y2ggdG8gcHJlLW11bHRpcGxpZWQgYWxwaGEgdG8gY29ycmVjdGx5IGJsdXIgdHJhbnNwYXJlbnQgaW1hZ2VzICovXFxuICAgICAgICAgICAgICAgICAgICBzYW1wbGUucmdiICo9IHNhbXBsZS5hO1xcblxcbiAgICAgICAgICAgICAgICAgICAgY29sb3IgKz0gc2FtcGxlICogd2VpZ2h0O1xcbiAgICAgICAgICAgICAgICAgICAgdG90YWwgKz0gd2VpZ2h0O1xcbiAgICAgICAgICAgICAgICB9XFxuXFxuICAgICAgICAgICAgICAgIGdsX0ZyYWdDb2xvciA9IGNvbG9yIC8gdG90YWw7XFxuXFxuICAgICAgICAgICAgICAgIC8qIHN3aXRjaCBiYWNrIGZyb20gcHJlLW11bHRpcGxpZWQgYWxwaGEgKi9cXG4gICAgICAgICAgICAgICAgZ2xfRnJhZ0NvbG9yLnJnYiAvPSBnbF9GcmFnQ29sb3IuYSArIDAuMDAwMDE7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgXCIpO1xyXG4gICAgICAgICAgICAgICAgLy8gc2V0IHByb3BlcnRpZXNcclxuICAgICAgICAgICAgICAgIHRoaXMucHJvcGVydGllcy5yYWRpdXMgPSByYWRpdXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgQmx1ci5wcm90b3R5cGUuZHJhd1dlYkdMID0gZnVuY3Rpb24gKHJlbmRlcmVyKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc2hhZGVyID0gcmVuZGVyZXIuZ2V0U2hhZGVyKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0UGFzcyA9IHsgZGVsdGE6IFt0aGlzLnByb3BlcnRpZXMucmFkaXVzIC8gcmVuZGVyZXIuZ2V0U291cmNlKCkud2lkdGgsIDBdIH07XHJcbiAgICAgICAgICAgICAgICB2YXIgc2Vjb25kUGFzcyA9IHsgZGVsdGE6IFswLCB0aGlzLnByb3BlcnRpZXMucmFkaXVzIC8gcmVuZGVyZXIuZ2V0U291cmNlKCkuaGVpZ2h0XSB9O1xyXG4gICAgICAgICAgICAgICAgcmVuZGVyZXIuZ2V0VGV4dHVyZSgpLnVzZSgpO1xyXG4gICAgICAgICAgICAgICAgcmVuZGVyZXIuZ2V0TmV4dFRleHR1cmUoKS5kcmF3VG8oZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNoYWRlci51bmlmb3JtcyhmaXJzdFBhc3MpLmRyYXdSZWN0KCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJlbmRlcmVyLmdldFRleHR1cmUoKS51c2UoKTtcclxuICAgICAgICAgICAgICAgIHJlbmRlcmVyLmdldE5leHRUZXh0dXJlKCkuZHJhd1RvKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBzaGFkZXIudW5pZm9ybXMoc2Vjb25kUGFzcykuZHJhd1JlY3QoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBCbHVyLnByb3RvdHlwZS5kcmF3Q2FudmFzID0gZnVuY3Rpb24gKGltYWdlRGF0YSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHBpeGVscyA9IGltYWdlRGF0YS5kYXRhO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJhZGl1cyA9IHRoaXMucHJvcGVydGllcy5yYWRpdXM7XHJcbiAgICAgICAgICAgICAgICB2YXIgd2lkdGggPSBpbWFnZURhdGEud2lkdGg7XHJcbiAgICAgICAgICAgICAgICB2YXIgaGVpZ2h0ID0gaW1hZ2VEYXRhLmhlaWdodDtcclxuICAgICAgICAgICAgICAgIHZhciB4LCB5LCBpLCBwLCB5cCwgeWksIHl3LCByX3N1bSwgZ19zdW0sIGJfc3VtLCBhX3N1bSwgcl9vdXRfc3VtLCBnX291dF9zdW0sIGJfb3V0X3N1bSwgYV9vdXRfc3VtLCByX2luX3N1bSwgZ19pbl9zdW0sIGJfaW5fc3VtLCBhX2luX3N1bSwgcHIsIHBnLCBwYiwgcGEsIHJicztcclxuICAgICAgICAgICAgICAgIHZhciBkaXYgPSByYWRpdXMgKyByYWRpdXMgKyAxO1xyXG4gICAgICAgICAgICAgICAgdmFyIHdpZHRoTWludXMxID0gd2lkdGggLSAxO1xyXG4gICAgICAgICAgICAgICAgdmFyIGhlaWdodE1pbnVzMSA9IGhlaWdodCAtIDE7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmFkaXVzUGx1czEgPSByYWRpdXMgKyAxO1xyXG4gICAgICAgICAgICAgICAgdmFyIHN1bUZhY3RvciA9IHJhZGl1c1BsdXMxICogKHJhZGl1c1BsdXMxICsgMSkgLyAyO1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0YWNrU3RhcnQgPSBuZXcgQmx1clN0YWNrKCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3RhY2sgPSBzdGFja1N0YXJ0O1xyXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMTsgaSA8IGRpdjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhY2sgPSBzdGFjay5uZXh0ID0gbmV3IEJsdXJTdGFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpID09IHJhZGl1c1BsdXMxKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3RhY2tFbmQgPSBzdGFjaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHN0YWNrLm5leHQgPSBzdGFja1N0YXJ0O1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0YWNrSW4gPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0YWNrT3V0ID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHl3ID0geWkgPSAwO1xyXG4gICAgICAgICAgICAgICAgdmFyIG11bF9zdW0gPSBtdWxfdGFibGVbcmFkaXVzXTtcclxuICAgICAgICAgICAgICAgIHZhciBzaGdfc3VtID0gc2hnX3RhYmxlW3JhZGl1c107XHJcbiAgICAgICAgICAgICAgICBmb3IgKHkgPSAwOyB5IDwgaGVpZ2h0OyB5KyspIHtcclxuICAgICAgICAgICAgICAgICAgICByX2luX3N1bSA9IGdfaW5fc3VtID0gYl9pbl9zdW0gPSBhX2luX3N1bSA9IHJfc3VtID0gZ19zdW0gPSBiX3N1bSA9IGFfc3VtID0gMDtcclxuICAgICAgICAgICAgICAgICAgICByX291dF9zdW0gPSByYWRpdXNQbHVzMSAqIChwciA9IHBpeGVsc1t5aV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGdfb3V0X3N1bSA9IHJhZGl1c1BsdXMxICogKHBnID0gcGl4ZWxzW3lpICsgMV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGJfb3V0X3N1bSA9IHJhZGl1c1BsdXMxICogKHBiID0gcGl4ZWxzW3lpICsgMl0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGFfb3V0X3N1bSA9IHJhZGl1c1BsdXMxICogKHBhID0gcGl4ZWxzW3lpICsgM10pO1xyXG4gICAgICAgICAgICAgICAgICAgIHJfc3VtICs9IHN1bUZhY3RvciAqIHByO1xyXG4gICAgICAgICAgICAgICAgICAgIGdfc3VtICs9IHN1bUZhY3RvciAqIHBnO1xyXG4gICAgICAgICAgICAgICAgICAgIGJfc3VtICs9IHN1bUZhY3RvciAqIHBiO1xyXG4gICAgICAgICAgICAgICAgICAgIGFfc3VtICs9IHN1bUZhY3RvciAqIHBhO1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrID0gc3RhY2tTdGFydDtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcmFkaXVzUGx1czE7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFjay5yID0gcHI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrLmcgPSBwZztcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2suYiA9IHBiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFjay5hID0gcGE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrID0gc3RhY2submV4dDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMTsgaSA8IHJhZGl1c1BsdXMxOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcCA9IHlpICsgKCh3aWR0aE1pbnVzMSA8IGkgPyB3aWR0aE1pbnVzMSA6IGkpIDw8IDIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByX3N1bSArPSAoc3RhY2suciA9IChwciA9IHBpeGVsc1twXSkpICogKHJicyA9IHJhZGl1c1BsdXMxIC0gaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdfc3VtICs9IChzdGFjay5nID0gKHBnID0gcGl4ZWxzW3AgKyAxXSkpICogcmJzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiX3N1bSArPSAoc3RhY2suYiA9IChwYiA9IHBpeGVsc1twICsgMl0pKSAqIHJicztcclxuICAgICAgICAgICAgICAgICAgICAgICAgYV9zdW0gKz0gKHN0YWNrLmEgPSAocGEgPSBwaXhlbHNbcCArIDNdKSkgKiByYnM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJfaW5fc3VtICs9IHByO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnX2luX3N1bSArPSBwZztcclxuICAgICAgICAgICAgICAgICAgICAgICAgYl9pbl9zdW0gKz0gcGI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFfaW5fc3VtICs9IHBhO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFjayA9IHN0YWNrLm5leHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrSW4gPSBzdGFja1N0YXJ0O1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrT3V0ID0gc3RhY2tFbmQ7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh4ID0gMDsgeCA8IHdpZHRoOyB4KyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGl4ZWxzW3lpICsgM10gPSBwYSA9IChhX3N1bSAqIG11bF9zdW0pID4+IHNoZ19zdW07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYSAhPSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYSA9IDI1NSAvIHBhO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGl4ZWxzW3lpXSA9ICgocl9zdW0gKiBtdWxfc3VtKSA+PiBzaGdfc3VtKSAqIHBhO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGl4ZWxzW3lpICsgMV0gPSAoKGdfc3VtICogbXVsX3N1bSkgPj4gc2hnX3N1bSkgKiBwYTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBpeGVsc1t5aSArIDJdID0gKChiX3N1bSAqIG11bF9zdW0pID4+IHNoZ19zdW0pICogcGE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwaXhlbHNbeWldID0gcGl4ZWxzW3lpICsgMV0gPSBwaXhlbHNbeWkgKyAyXSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgcl9zdW0gLT0gcl9vdXRfc3VtO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnX3N1bSAtPSBnX291dF9zdW07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJfc3VtIC09IGJfb3V0X3N1bTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYV9zdW0gLT0gYV9vdXRfc3VtO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByX291dF9zdW0gLT0gc3RhY2tJbi5yO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnX291dF9zdW0gLT0gc3RhY2tJbi5nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiX291dF9zdW0gLT0gc3RhY2tJbi5iO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhX291dF9zdW0gLT0gc3RhY2tJbi5hO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwID0gKHl3ICsgKChwID0geCArIHJhZGl1cyArIDEpIDwgd2lkdGhNaW51czEgPyBwIDogd2lkdGhNaW51czEpKSA8PCAyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByX2luX3N1bSArPSAoc3RhY2tJbi5yID0gcGl4ZWxzW3BdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ19pbl9zdW0gKz0gKHN0YWNrSW4uZyA9IHBpeGVsc1twICsgMV0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiX2luX3N1bSArPSAoc3RhY2tJbi5iID0gcGl4ZWxzW3AgKyAyXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFfaW5fc3VtICs9IChzdGFja0luLmEgPSBwaXhlbHNbcCArIDNdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcl9zdW0gKz0gcl9pbl9zdW07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdfc3VtICs9IGdfaW5fc3VtO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiX3N1bSArPSBiX2luX3N1bTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYV9zdW0gKz0gYV9pbl9zdW07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrSW4gPSBzdGFja0luLm5leHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJfb3V0X3N1bSArPSAocHIgPSBzdGFja091dC5yKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ19vdXRfc3VtICs9IChwZyA9IHN0YWNrT3V0LmcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiX291dF9zdW0gKz0gKHBiID0gc3RhY2tPdXQuYik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFfb3V0X3N1bSArPSAocGEgPSBzdGFja091dC5hKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcl9pbl9zdW0gLT0gcHI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdfaW5fc3VtIC09IHBnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiX2luX3N1bSAtPSBwYjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYV9pbl9zdW0gLT0gcGE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrT3V0ID0gc3RhY2tPdXQubmV4dDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeWkgKz0gNDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgeXcgKz0gd2lkdGg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBmb3IgKHggPSAwOyB4IDwgd2lkdGg7IHgrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGdfaW5fc3VtID0gYl9pbl9zdW0gPSBhX2luX3N1bSA9IHJfaW5fc3VtID0gZ19zdW0gPSBiX3N1bSA9IGFfc3VtID0gcl9zdW0gPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIHlpID0geCA8PCAyO1xyXG4gICAgICAgICAgICAgICAgICAgIHJfb3V0X3N1bSA9IHJhZGl1c1BsdXMxICogKHByID0gcGl4ZWxzW3lpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZ19vdXRfc3VtID0gcmFkaXVzUGx1czEgKiAocGcgPSBwaXhlbHNbeWkgKyAxXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYl9vdXRfc3VtID0gcmFkaXVzUGx1czEgKiAocGIgPSBwaXhlbHNbeWkgKyAyXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYV9vdXRfc3VtID0gcmFkaXVzUGx1czEgKiAocGEgPSBwaXhlbHNbeWkgKyAzXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcl9zdW0gKz0gc3VtRmFjdG9yICogcHI7XHJcbiAgICAgICAgICAgICAgICAgICAgZ19zdW0gKz0gc3VtRmFjdG9yICogcGc7XHJcbiAgICAgICAgICAgICAgICAgICAgYl9zdW0gKz0gc3VtRmFjdG9yICogcGI7XHJcbiAgICAgICAgICAgICAgICAgICAgYV9zdW0gKz0gc3VtRmFjdG9yICogcGE7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhY2sgPSBzdGFja1N0YXJ0O1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCByYWRpdXNQbHVzMTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrLnIgPSBwcjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2suZyA9IHBnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFjay5iID0gcGI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrLmEgPSBwYTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2sgPSBzdGFjay5uZXh0O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB5cCA9IHdpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDE7IGkgPD0gcmFkaXVzOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeWkgPSAoeXAgKyB4KSA8PCAyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByX3N1bSArPSAoc3RhY2suciA9IChwciA9IHBpeGVsc1t5aV0pKSAqIChyYnMgPSByYWRpdXNQbHVzMSAtIGkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnX3N1bSArPSAoc3RhY2suZyA9IChwZyA9IHBpeGVsc1t5aSArIDFdKSkgKiByYnM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJfc3VtICs9IChzdGFjay5iID0gKHBiID0gcGl4ZWxzW3lpICsgMl0pKSAqIHJicztcclxuICAgICAgICAgICAgICAgICAgICAgICAgYV9zdW0gKz0gKHN0YWNrLmEgPSAocGEgPSBwaXhlbHNbeWkgKyAzXSkpICogcmJzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByX2luX3N1bSArPSBwcjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ19pbl9zdW0gKz0gcGc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJfaW5fc3VtICs9IHBiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhX2luX3N1bSArPSBwYTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2sgPSBzdGFjay5uZXh0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaSA8IGhlaWdodE1pbnVzMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeXAgKz0gd2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgeWkgPSB4O1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrSW4gPSBzdGFja1N0YXJ0O1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrT3V0ID0gc3RhY2tFbmQ7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh5ID0gMDsgeSA8IGhlaWdodDsgeSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHAgPSB5aSA8PCAyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwaXhlbHNbcCArIDNdID0gcGEgPSAoYV9zdW0gKiBtdWxfc3VtKSA+PiBzaGdfc3VtO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGEgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYSA9IDI1NSAvIHBhO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGl4ZWxzW3BdID0gKChyX3N1bSAqIG11bF9zdW0pID4+IHNoZ19zdW0pICogcGE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwaXhlbHNbcCArIDFdID0gKChnX3N1bSAqIG11bF9zdW0pID4+IHNoZ19zdW0pICogcGE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwaXhlbHNbcCArIDJdID0gKChiX3N1bSAqIG11bF9zdW0pID4+IHNoZ19zdW0pICogcGE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwaXhlbHNbcF0gPSBwaXhlbHNbcCArIDFdID0gcGl4ZWxzW3AgKyAyXSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgcl9zdW0gLT0gcl9vdXRfc3VtO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnX3N1bSAtPSBnX291dF9zdW07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJfc3VtIC09IGJfb3V0X3N1bTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYV9zdW0gLT0gYV9vdXRfc3VtO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByX291dF9zdW0gLT0gc3RhY2tJbi5yO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnX291dF9zdW0gLT0gc3RhY2tJbi5nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiX291dF9zdW0gLT0gc3RhY2tJbi5iO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhX291dF9zdW0gLT0gc3RhY2tJbi5hO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwID0gKHggKyAoKChwID0geSArIHJhZGl1c1BsdXMxKSA8IGhlaWdodE1pbnVzMSA/IHAgOiBoZWlnaHRNaW51czEpICogd2lkdGgpKSA8PCAyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByX3N1bSArPSAocl9pbl9zdW0gKz0gKHN0YWNrSW4uciA9IHBpeGVsc1twXSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnX3N1bSArPSAoZ19pbl9zdW0gKz0gKHN0YWNrSW4uZyA9IHBpeGVsc1twICsgMV0pKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYl9zdW0gKz0gKGJfaW5fc3VtICs9IChzdGFja0luLmIgPSBwaXhlbHNbcCArIDJdKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFfc3VtICs9IChhX2luX3N1bSArPSAoc3RhY2tJbi5hID0gcGl4ZWxzW3AgKyAzXSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFja0luID0gc3RhY2tJbi5uZXh0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByX291dF9zdW0gKz0gKHByID0gc3RhY2tPdXQucik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdfb3V0X3N1bSArPSAocGcgPSBzdGFja091dC5nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYl9vdXRfc3VtICs9IChwYiA9IHN0YWNrT3V0LmIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhX291dF9zdW0gKz0gKHBhID0gc3RhY2tPdXQuYSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJfaW5fc3VtIC09IHByO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnX2luX3N1bSAtPSBwZztcclxuICAgICAgICAgICAgICAgICAgICAgICAgYl9pbl9zdW0gLT0gcGI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFfaW5fc3VtIC09IHBhO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFja091dCA9IHN0YWNrT3V0Lm5leHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHlpICs9IHdpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBpbWFnZURhdGE7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHJldHVybiBCbHVyO1xyXG4gICAgICAgIH0pKGpzZnguRmlsdGVyKTtcclxuICAgICAgICBmaWx0ZXIuQmx1ciA9IEJsdXI7XHJcbiAgICAgICAgdmFyIG11bF90YWJsZSA9IFtcclxuICAgICAgICAgICAgNTEyLCA1MTIsIDQ1NiwgNTEyLCAzMjgsIDQ1NiwgMzM1LCA1MTIsIDQwNSwgMzI4LCAyNzEsIDQ1NiwgMzg4LCAzMzUsIDI5MiwgNTEyLFxyXG4gICAgICAgICAgICA0NTQsIDQwNSwgMzY0LCAzMjgsIDI5OCwgMjcxLCA0OTYsIDQ1NiwgNDIwLCAzODgsIDM2MCwgMzM1LCAzMTIsIDI5MiwgMjczLCA1MTIsXHJcbiAgICAgICAgICAgIDQ4MiwgNDU0LCA0MjgsIDQwNSwgMzgzLCAzNjQsIDM0NSwgMzI4LCAzMTIsIDI5OCwgMjg0LCAyNzEsIDI1OSwgNDk2LCA0NzUsIDQ1NixcclxuICAgICAgICAgICAgNDM3LCA0MjAsIDQwNCwgMzg4LCAzNzQsIDM2MCwgMzQ3LCAzMzUsIDMyMywgMzEyLCAzMDIsIDI5MiwgMjgyLCAyNzMsIDI2NSwgNTEyLFxyXG4gICAgICAgICAgICA0OTcsIDQ4MiwgNDY4LCA0NTQsIDQ0MSwgNDI4LCA0MTcsIDQwNSwgMzk0LCAzODMsIDM3MywgMzY0LCAzNTQsIDM0NSwgMzM3LCAzMjgsXHJcbiAgICAgICAgICAgIDMyMCwgMzEyLCAzMDUsIDI5OCwgMjkxLCAyODQsIDI3OCwgMjcxLCAyNjUsIDI1OSwgNTA3LCA0OTYsIDQ4NSwgNDc1LCA0NjUsIDQ1NixcclxuICAgICAgICAgICAgNDQ2LCA0MzcsIDQyOCwgNDIwLCA0MTIsIDQwNCwgMzk2LCAzODgsIDM4MSwgMzc0LCAzNjcsIDM2MCwgMzU0LCAzNDcsIDM0MSwgMzM1LFxyXG4gICAgICAgICAgICAzMjksIDMyMywgMzE4LCAzMTIsIDMwNywgMzAyLCAyOTcsIDI5MiwgMjg3LCAyODIsIDI3OCwgMjczLCAyNjksIDI2NSwgMjYxLCA1MTIsXHJcbiAgICAgICAgICAgIDUwNSwgNDk3LCA0ODksIDQ4MiwgNDc1LCA0NjgsIDQ2MSwgNDU0LCA0NDcsIDQ0MSwgNDM1LCA0MjgsIDQyMiwgNDE3LCA0MTEsIDQwNSxcclxuICAgICAgICAgICAgMzk5LCAzOTQsIDM4OSwgMzgzLCAzNzgsIDM3MywgMzY4LCAzNjQsIDM1OSwgMzU0LCAzNTAsIDM0NSwgMzQxLCAzMzcsIDMzMiwgMzI4LFxyXG4gICAgICAgICAgICAzMjQsIDMyMCwgMzE2LCAzMTIsIDMwOSwgMzA1LCAzMDEsIDI5OCwgMjk0LCAyOTEsIDI4NywgMjg0LCAyODEsIDI3OCwgMjc0LCAyNzEsXHJcbiAgICAgICAgICAgIDI2OCwgMjY1LCAyNjIsIDI1OSwgMjU3LCA1MDcsIDUwMSwgNDk2LCA0OTEsIDQ4NSwgNDgwLCA0NzUsIDQ3MCwgNDY1LCA0NjAsIDQ1NixcclxuICAgICAgICAgICAgNDUxLCA0NDYsIDQ0MiwgNDM3LCA0MzMsIDQyOCwgNDI0LCA0MjAsIDQxNiwgNDEyLCA0MDgsIDQwNCwgNDAwLCAzOTYsIDM5MiwgMzg4LFxyXG4gICAgICAgICAgICAzODUsIDM4MSwgMzc3LCAzNzQsIDM3MCwgMzY3LCAzNjMsIDM2MCwgMzU3LCAzNTQsIDM1MCwgMzQ3LCAzNDQsIDM0MSwgMzM4LCAzMzUsXHJcbiAgICAgICAgICAgIDMzMiwgMzI5LCAzMjYsIDMyMywgMzIwLCAzMTgsIDMxNSwgMzEyLCAzMTAsIDMwNywgMzA0LCAzMDIsIDI5OSwgMjk3LCAyOTQsIDI5MixcclxuICAgICAgICAgICAgMjg5LCAyODcsIDI4NSwgMjgyLCAyODAsIDI3OCwgMjc1LCAyNzMsIDI3MSwgMjY5LCAyNjcsIDI2NSwgMjYzLCAyNjEsIDI1OV07XHJcbiAgICAgICAgdmFyIHNoZ190YWJsZSA9IFtcclxuICAgICAgICAgICAgOSwgMTEsIDEyLCAxMywgMTMsIDE0LCAxNCwgMTUsIDE1LCAxNSwgMTUsIDE2LCAxNiwgMTYsIDE2LCAxNyxcclxuICAgICAgICAgICAgMTcsIDE3LCAxNywgMTcsIDE3LCAxNywgMTgsIDE4LCAxOCwgMTgsIDE4LCAxOCwgMTgsIDE4LCAxOCwgMTksXHJcbiAgICAgICAgICAgIDE5LCAxOSwgMTksIDE5LCAxOSwgMTksIDE5LCAxOSwgMTksIDE5LCAxOSwgMTksIDE5LCAyMCwgMjAsIDIwLFxyXG4gICAgICAgICAgICAyMCwgMjAsIDIwLCAyMCwgMjAsIDIwLCAyMCwgMjAsIDIwLCAyMCwgMjAsIDIwLCAyMCwgMjAsIDIwLCAyMSxcclxuICAgICAgICAgICAgMjEsIDIxLCAyMSwgMjEsIDIxLCAyMSwgMjEsIDIxLCAyMSwgMjEsIDIxLCAyMSwgMjEsIDIxLCAyMSwgMjEsXHJcbiAgICAgICAgICAgIDIxLCAyMSwgMjEsIDIxLCAyMSwgMjEsIDIxLCAyMSwgMjEsIDIxLCAyMiwgMjIsIDIyLCAyMiwgMjIsIDIyLFxyXG4gICAgICAgICAgICAyMiwgMjIsIDIyLCAyMiwgMjIsIDIyLCAyMiwgMjIsIDIyLCAyMiwgMjIsIDIyLCAyMiwgMjIsIDIyLCAyMixcclxuICAgICAgICAgICAgMjIsIDIyLCAyMiwgMjIsIDIyLCAyMiwgMjIsIDIyLCAyMiwgMjIsIDIyLCAyMiwgMjIsIDIyLCAyMiwgMjMsXHJcbiAgICAgICAgICAgIDIzLCAyMywgMjMsIDIzLCAyMywgMjMsIDIzLCAyMywgMjMsIDIzLCAyMywgMjMsIDIzLCAyMywgMjMsIDIzLFxyXG4gICAgICAgICAgICAyMywgMjMsIDIzLCAyMywgMjMsIDIzLCAyMywgMjMsIDIzLCAyMywgMjMsIDIzLCAyMywgMjMsIDIzLCAyMyxcclxuICAgICAgICAgICAgMjMsIDIzLCAyMywgMjMsIDIzLCAyMywgMjMsIDIzLCAyMywgMjMsIDIzLCAyMywgMjMsIDIzLCAyMywgMjMsXHJcbiAgICAgICAgICAgIDIzLCAyMywgMjMsIDIzLCAyMywgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LFxyXG4gICAgICAgICAgICAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCxcclxuICAgICAgICAgICAgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsXHJcbiAgICAgICAgICAgIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LFxyXG4gICAgICAgICAgICAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0LCAyNCwgMjQsIDI0XTtcclxuICAgICAgICB2YXIgQmx1clN0YWNrID0gKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZnVuY3Rpb24gQmx1clN0YWNrKCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yID0gMDtcclxuICAgICAgICAgICAgICAgIHRoaXMuZyA9IDA7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmIgPSAwO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hID0gMDtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dCA9IG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIEJsdXJTdGFjaztcclxuICAgICAgICB9KSgpO1xyXG4gICAgfSkoZmlsdGVyID0ganNmeC5maWx0ZXIgfHwgKGpzZnguZmlsdGVyID0ge30pKTtcclxufSkoanNmeCB8fCAoanNmeCA9IHt9KSk7XHJcbnZhciBqc2Z4O1xyXG4oZnVuY3Rpb24gKGpzZngpIHtcclxuICAgIHZhciBmaWx0ZXI7XHJcbiAgICAoZnVuY3Rpb24gKGZpbHRlcikge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBmaWx0ZXIgICAgICAgICAgIEJyaWdodG5lc3NcclxuICAgICAgICAgKiBAZGVzY3JpcHRpb24gICAgICBQcm92aWRlcyBhZGRpdGl2ZSBicmlnaHRuZXNzIGNvbnRyb2wuXHJcbiAgICAgICAgICogQHBhcmFtIGJyaWdodG5lc3MgLTEgdG8gMSAoLTEgaXMgc29saWQgYmxhY2ssIDAgaXMgbm8gY2hhbmdlLCBhbmQgMSBpcyBzb2xpZCB3aGl0ZSlcclxuICAgICAgICAgKi9cclxuICAgICAgICB2YXIgQnJpZ2h0bmVzcyA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XHJcbiAgICAgICAgICAgIF9fZXh0ZW5kcyhCcmlnaHRuZXNzLCBfc3VwZXIpO1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBCcmlnaHRuZXNzKGJyaWdodG5lc3MpIHtcclxuICAgICAgICAgICAgICAgIF9zdXBlci5jYWxsKHRoaXMsIG51bGwsIFwiXFxuICAgICAgICAgICAgdW5pZm9ybSBzYW1wbGVyMkQgdGV4dHVyZTtcXG4gICAgICAgICAgICB1bmlmb3JtIGZsb2F0IGJyaWdodG5lc3M7XFxuICAgICAgICAgICAgdmFyeWluZyB2ZWMyIHRleENvb3JkO1xcblxcbiAgICAgICAgICAgIHZvaWQgbWFpbigpIHtcXG4gICAgICAgICAgICAgICAgdmVjNCBjb2xvciA9IHRleHR1cmUyRCh0ZXh0dXJlLCB0ZXhDb29yZCk7XFxuICAgICAgICAgICAgICAgIGNvbG9yLnJnYiArPSBicmlnaHRuZXNzO1xcblxcbiAgICAgICAgICAgICAgICBnbF9GcmFnQ29sb3IgPSBjb2xvcjtcXG4gICAgICAgICAgICB9XFxuICAgICAgICBcIik7XHJcbiAgICAgICAgICAgICAgICAvLyBzZXQgcHJvcGVydGllc1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wZXJ0aWVzLmJyaWdodG5lc3MgPSBqc2Z4LkZpbHRlci5jbGFtcCgtMSwgYnJpZ2h0bmVzcywgMSkgfHwgMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBCcmlnaHRuZXNzLnByb3RvdHlwZS5pdGVyYXRlQ2FudmFzID0gZnVuY3Rpb24gKGhlbHBlcikge1xyXG4gICAgICAgICAgICAgICAgdmFyIGJyaWdodG5lc3MgPSB0aGlzLnByb3BlcnRpZXMuYnJpZ2h0bmVzcztcclxuICAgICAgICAgICAgICAgIGhlbHBlci5yICs9IGJyaWdodG5lc3M7XHJcbiAgICAgICAgICAgICAgICBoZWxwZXIuZyArPSBicmlnaHRuZXNzO1xyXG4gICAgICAgICAgICAgICAgaGVscGVyLmIgKz0gYnJpZ2h0bmVzcztcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgcmV0dXJuIEJyaWdodG5lc3M7XHJcbiAgICAgICAgfSkoanNmeC5JdGVyYWJsZUZpbHRlcik7XHJcbiAgICAgICAgZmlsdGVyLkJyaWdodG5lc3MgPSBCcmlnaHRuZXNzO1xyXG4gICAgfSkoZmlsdGVyID0ganNmeC5maWx0ZXIgfHwgKGpzZnguZmlsdGVyID0ge30pKTtcclxufSkoanNmeCB8fCAoanNmeCA9IHt9KSk7XHJcbnZhciBqc2Z4O1xyXG4oZnVuY3Rpb24gKGpzZngpIHtcclxuICAgIHZhciBmaWx0ZXI7XHJcbiAgICAoZnVuY3Rpb24gKGZpbHRlcikge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBmaWx0ZXIgICAgICAgICAgIENvbnRyYXN0XHJcbiAgICAgICAgICogQGRlc2NyaXB0aW9uICAgICAgUHJvdmlkZXMgbXVsdGlwbGljYXRpdmUgY29udHJhc3QgY29udHJvbC5cclxuICAgICAgICAgKiBAcGFyYW0gY29udHJhc3QgICAtMSB0byAxICgtMSBpcyBzb2xpZCBncmF5LCAwIGlzIG5vIGNoYW5nZSwgYW5kIDEgaXMgbWF4aW11bSBjb250cmFzdClcclxuICAgICAgICAgKi9cclxuICAgICAgICB2YXIgQ29udHJhc3QgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xyXG4gICAgICAgICAgICBfX2V4dGVuZHMoQ29udHJhc3QsIF9zdXBlcik7XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIENvbnRyYXN0KGNvbnRyYXN0KSB7XHJcbiAgICAgICAgICAgICAgICBfc3VwZXIuY2FsbCh0aGlzLCBudWxsLCBcIlxcbiAgICAgICAgICAgIHVuaWZvcm0gc2FtcGxlcjJEIHRleHR1cmU7XFxuICAgICAgICAgICAgdW5pZm9ybSBmbG9hdCBjb250cmFzdDtcXG4gICAgICAgICAgICB2YXJ5aW5nIHZlYzIgdGV4Q29vcmQ7XFxuXFxuICAgICAgICAgICAgdm9pZCBtYWluKCkge1xcbiAgICAgICAgICAgICAgICB2ZWM0IGNvbG9yID0gdGV4dHVyZTJEKHRleHR1cmUsIHRleENvb3JkKTtcXG5cXG4gICAgICAgICAgICAgICAgaWYgKGNvbnRyYXN0ID4gMC4wKSB7XFxuICAgICAgICAgICAgICAgICAgICBjb2xvci5yZ2IgPSAoY29sb3IucmdiIC0gMC41KSAvICgxLjAgLSBjb250cmFzdCkgKyAwLjU7XFxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XFxuICAgICAgICAgICAgICAgICAgICBjb2xvci5yZ2IgPSAoY29sb3IucmdiIC0gMC41KSAqICgxLjAgKyBjb250cmFzdCkgKyAwLjU7XFxuICAgICAgICAgICAgICAgIH1cXG5cXG4gICAgICAgICAgICAgICAgZ2xfRnJhZ0NvbG9yID0gY29sb3I7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgXCIpO1xyXG4gICAgICAgICAgICAgICAgLy8gc2V0IHByb3BlcnRpZXNcclxuICAgICAgICAgICAgICAgIHRoaXMucHJvcGVydGllcy5jb250cmFzdCA9IGpzZnguRmlsdGVyLmNsYW1wKC0xLCBjb250cmFzdCwgMSkgfHwgMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBDb250cmFzdC5wcm90b3R5cGUuaXRlcmF0ZUNhbnZhcyA9IGZ1bmN0aW9uIChoZWxwZXIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb250cmFzdCA9IHRoaXMucHJvcGVydGllcy5jb250cmFzdDtcclxuICAgICAgICAgICAgICAgIGlmIChjb250cmFzdCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBoZWxwZXIuciA9IChoZWxwZXIuciAtIDAuNSkgLyAoMSAtIGNvbnRyYXN0KSArIDAuNTtcclxuICAgICAgICAgICAgICAgICAgICBoZWxwZXIuZyA9IChoZWxwZXIuZyAtIDAuNSkgLyAoMSAtIGNvbnRyYXN0KSArIDAuNTtcclxuICAgICAgICAgICAgICAgICAgICBoZWxwZXIuYiA9IChoZWxwZXIuYiAtIDAuNSkgLyAoMSAtIGNvbnRyYXN0KSArIDAuNTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGhlbHBlci5yID0gKGhlbHBlci5yIC0gMC41KSAqICgxICsgY29udHJhc3QpICsgMC41O1xyXG4gICAgICAgICAgICAgICAgICAgIGhlbHBlci5nID0gKGhlbHBlci5nIC0gMC41KSAqICgxICsgY29udHJhc3QpICsgMC41O1xyXG4gICAgICAgICAgICAgICAgICAgIGhlbHBlci5iID0gKGhlbHBlci5iIC0gMC41KSAqICgxICsgY29udHJhc3QpICsgMC41O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZXR1cm4gQ29udHJhc3Q7XHJcbiAgICAgICAgfSkoanNmeC5JdGVyYWJsZUZpbHRlcik7XHJcbiAgICAgICAgZmlsdGVyLkNvbnRyYXN0ID0gQ29udHJhc3Q7XHJcbiAgICB9KShmaWx0ZXIgPSBqc2Z4LmZpbHRlciB8fCAoanNmeC5maWx0ZXIgPSB7fSkpO1xyXG59KShqc2Z4IHx8IChqc2Z4ID0ge30pKTtcclxudmFyIGpzZng7XHJcbihmdW5jdGlvbiAoanNmeCkge1xyXG4gICAgdmFyIGZpbHRlcjtcclxuICAgIChmdW5jdGlvbiAoZmlsdGVyKSB7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQGZpbHRlciAgICAgIEN1cnZlc1xyXG4gICAgICAgICAqIEBkZXNjcmlwdGlvbiBBIHBvd2VyZnVsIG1hcHBpbmcgdG9vbCB0aGF0IHRyYW5zZm9ybXMgdGhlIGNvbG9ycyBpbiB0aGUgaW1hZ2VcclxuICAgICAgICAgKiAgICAgICAgICAgICAgYnkgYW4gYXJiaXRyYXJ5IGZ1bmN0aW9uLiBUaGUgZnVuY3Rpb24gaXMgaW50ZXJwb2xhdGVkIGJldHdlZW5cclxuICAgICAgICAgKiAgICAgICAgICAgICAgYSBzZXQgb2YgMkQgcG9pbnRzIHVzaW5nIHNwbGluZXMuIFRoZSBjdXJ2ZXMgZmlsdGVyIGNhbiB0YWtlXHJcbiAgICAgICAgICogICAgICAgICAgICAgIGVpdGhlciBvbmUgb3IgdGhyZWUgYXJndW1lbnRzIHdoaWNoIHdpbGwgYXBwbHkgdGhlIG1hcHBpbmcgdG9cclxuICAgICAgICAgKiAgICAgICAgICAgICAgZWl0aGVyIGx1bWluYW5jZSBvciBSR0IgdmFsdWVzLCByZXNwZWN0aXZlbHkuXHJcbiAgICAgICAgICogQHBhcmFtIHJlZCAgIEEgbGlzdCBvZiBwb2ludHMgdGhhdCBkZWZpbmUgdGhlIGZ1bmN0aW9uIGZvciB0aGUgcmVkIGNoYW5uZWwuXHJcbiAgICAgICAgICogICAgICAgICAgICAgIEVhY2ggcG9pbnQgaXMgYSBsaXN0IG9mIHR3byB2YWx1ZXM6IHRoZSB2YWx1ZSBiZWZvcmUgdGhlIG1hcHBpbmdcclxuICAgICAgICAgKiAgICAgICAgICAgICAgYW5kIHRoZSB2YWx1ZSBhZnRlciB0aGUgbWFwcGluZywgYm90aCBpbiB0aGUgcmFuZ2UgMCB0byAxLiBGb3JcclxuICAgICAgICAgKiAgICAgICAgICAgICAgZXhhbXBsZSwgW1swLDFdLCBbMSwwXV0gd291bGQgaW52ZXJ0IHRoZSByZWQgY2hhbm5lbCB3aGlsZVxyXG4gICAgICAgICAqICAgICAgICAgICAgICBbWzAsMF0sIFsxLDFdXSB3b3VsZCBsZWF2ZSB0aGUgcmVkIGNoYW5uZWwgdW5jaGFuZ2VkLiBJZiBncmVlblxyXG4gICAgICAgICAqICAgICAgICAgICAgICBhbmQgYmx1ZSBhcmUgb21pdHRlZCB0aGVuIHRoaXMgYXJndW1lbnQgYWxzbyBhcHBsaWVzIHRvIHRoZVxyXG4gICAgICAgICAqICAgICAgICAgICAgICBncmVlbiBhbmQgYmx1ZSBjaGFubmVscy5cclxuICAgICAgICAgKiBAcGFyYW0gZ3JlZW4gKG9wdGlvbmFsKSBBIGxpc3Qgb2YgcG9pbnRzIHRoYXQgZGVmaW5lIHRoZSBmdW5jdGlvbiBmb3IgdGhlIGdyZWVuXHJcbiAgICAgICAgICogICAgICAgICAgICAgIGNoYW5uZWwgKGp1c3QgbGlrZSBmb3IgcmVkKS5cclxuICAgICAgICAgKiBAcGFyYW0gYmx1ZSAgKG9wdGlvbmFsKSBBIGxpc3Qgb2YgcG9pbnRzIHRoYXQgZGVmaW5lIHRoZSBmdW5jdGlvbiBmb3IgdGhlIGJsdWVcclxuICAgICAgICAgKiAgICAgICAgICAgICAgY2hhbm5lbCAoanVzdCBsaWtlIGZvciByZWQpLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHZhciBDdXJ2ZXMgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xyXG4gICAgICAgICAgICBfX2V4dGVuZHMoQ3VydmVzLCBfc3VwZXIpO1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBDdXJ2ZXMocmVkLCBncmVlbiwgYmx1ZSkge1xyXG4gICAgICAgICAgICAgICAgX3N1cGVyLmNhbGwodGhpcywgbnVsbCwgXCJcXG4gICAgICAgICAgICB1bmlmb3JtIHNhbXBsZXIyRCB0ZXh0dXJlO1xcbiAgICAgICAgICAgIHVuaWZvcm0gc2FtcGxlcjJEIG1hcDtcXG4gICAgICAgICAgICB2YXJ5aW5nIHZlYzIgdGV4Q29vcmQ7XFxuXFxuICAgICAgICAgICAgdm9pZCBtYWluKCkge1xcbiAgICAgICAgICAgICAgICB2ZWM0IGNvbG9yID0gdGV4dHVyZTJEKHRleHR1cmUsIHRleENvb3JkKTtcXG4gICAgICAgICAgICAgICAgY29sb3IuciA9IHRleHR1cmUyRChtYXAsIHZlYzIoY29sb3IucikpLnI7XFxuICAgICAgICAgICAgICAgIGNvbG9yLmcgPSB0ZXh0dXJlMkQobWFwLCB2ZWMyKGNvbG9yLmcpKS5nO1xcbiAgICAgICAgICAgICAgICBjb2xvci5iID0gdGV4dHVyZTJEKG1hcCwgdmVjMihjb2xvci5iKSkuYjtcXG4gICAgICAgICAgICAgICAgZ2xfRnJhZ0NvbG9yID0gY29sb3I7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgXCIpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZWQgPSByZWQ7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdyZWVuID0gZ3JlZW47XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJsdWUgPSBibHVlO1xyXG4gICAgICAgICAgICAgICAgLy8gaW50ZXJwb2xhdGVcclxuICAgICAgICAgICAgICAgIHJlZCA9IEN1cnZlcy5zcGxpbmVJbnRlcnBvbGF0ZShyZWQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGdyZWVuID0gYmx1ZSA9IHJlZDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGdyZWVuID0gQ3VydmVzLnNwbGluZUludGVycG9sYXRlKGdyZWVuKTtcclxuICAgICAgICAgICAgICAgICAgICBibHVlID0gQ3VydmVzLnNwbGluZUludGVycG9sYXRlKGJsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZWQgPSByZWQ7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdyZWVuID0gZ3JlZW47XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJsdWUgPSBibHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIEN1cnZlcy5wcm90b3R5cGUuZHJhd0NhbnZhcyA9IGZ1bmN0aW9uIChpbWFnZURhdGEpIHtcclxuICAgICAgICAgICAgICAgIHZhciBwaXhlbHMgPSBpbWFnZURhdGEuZGF0YTtcclxuICAgICAgICAgICAgICAgIHZhciBhbW91bnQgPSB0aGlzLnByb3BlcnRpZXMuYW1vdW50O1xyXG4gICAgICAgICAgICAgICAgdmFyIHIsIGcsIGI7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBpeGVscy5sZW5ndGg7IGkgKz0gNCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGdldCBjb2xvciB2YWx1ZXNcclxuICAgICAgICAgICAgICAgICAgICByID0gcGl4ZWxzW2ldIC8gMjU1O1xyXG4gICAgICAgICAgICAgICAgICAgIGcgPSBwaXhlbHNbaSArIDFdIC8gMjU1O1xyXG4gICAgICAgICAgICAgICAgICAgIGIgPSBwaXhlbHNbaSArIDJdIC8gMjU1O1xyXG4gICAgICAgICAgICAgICAgICAgIHIgPSBNYXRoLm1pbigxLjAsIChyICogKDEgLSAoMC42MDcgKiBhbW91bnQpKSkgKyAoZyAqICgwLjc2OSAqIGFtb3VudCkpICsgKGIgKiAoMC4xODkgKiBhbW91bnQpKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZyA9IE1hdGgubWluKDEuMCwgKHIgKiAwLjM0OSAqIGFtb3VudCkgKyAoZyAqICgxIC0gKDAuMzE0ICogYW1vdW50KSkpICsgKGIgKiAwLjE2OCAqIGFtb3VudCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGIgPSBNYXRoLm1pbigxLjAsIChyICogMC4yNzIgKiBhbW91bnQpICsgKGcgKiAwLjUzNCAqIGFtb3VudCkgKyAoYiAqICgxIC0gKDAuODY5ICogYW1vdW50KSkpKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBzZXQgdmFsdWVzXHJcbiAgICAgICAgICAgICAgICAgICAgcGl4ZWxzW2ldID0gciAqIDI1NTtcclxuICAgICAgICAgICAgICAgICAgICBwaXhlbHNbaSArIDFdID0gZyAqIDI1NTtcclxuICAgICAgICAgICAgICAgICAgICBwaXhlbHNbaSArIDJdID0gYiAqIDI1NTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBpbWFnZURhdGE7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIEN1cnZlcy5zcGxpbmVJbnRlcnBvbGF0ZSA9IGZ1bmN0aW9uIChwb2ludHMpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpbnRlcnBvbGF0b3IgPSBuZXcganNmeC51dGlsLlNwbGluZUludGVycG9sYXRvcihwb2ludHMpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGFycmF5ID0gW107XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDI1NjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJyYXkucHVzaChqc2Z4LkZpbHRlci5jbGFtcCgwLCBNYXRoLmZsb29yKGludGVycG9sYXRvci5pbnRlcnBvbGF0ZShpIC8gMjU1KSAqIDI1NiksIDI1NSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFycmF5O1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZXR1cm4gQ3VydmVzO1xyXG4gICAgICAgIH0pKGpzZnguRmlsdGVyKTtcclxuICAgICAgICBmaWx0ZXIuQ3VydmVzID0gQ3VydmVzO1xyXG4gICAgfSkoZmlsdGVyID0ganNmeC5maWx0ZXIgfHwgKGpzZnguZmlsdGVyID0ge30pKTtcclxufSkoanNmeCB8fCAoanNmeCA9IHt9KSk7XHJcbnZhciBqc2Z4O1xyXG4oZnVuY3Rpb24gKGpzZngpIHtcclxuICAgIHZhciBmaWx0ZXI7XHJcbiAgICAoZnVuY3Rpb24gKGZpbHRlcikge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEBmaWx0ZXIgICAgICAgICAgIEh1ZSAvIFNhdHVyYXRpb25cclxuICAgICAgICAgKiBAZGVzY3JpcHRpb24gICAgICBQcm92aWRlcyByb3RhdGlvbmFsIGh1ZSBjb250cm9sLiBSR0IgY29sb3Igc3BhY2VcclxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgICBjYW4gYmUgaW1hZ2luZWQgYXMgYSBjdWJlIHdoZXJlIHRoZSBheGVzIGFyZSB0aGUgcmVkLCBncmVlbiwgYW5kIGJsdWUgY29sb3JcclxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgICB2YWx1ZXMuIEh1ZSBjaGFuZ2luZyB3b3JrcyBieSByb3RhdGluZyB0aGUgY29sb3IgdmVjdG9yIGFyb3VuZCB0aGUgZ3JheXNjYWxlXHJcbiAgICAgICAgICogICAgICAgICAgICAgICAgICAgbGluZSwgd2hpY2ggaXMgdGhlIHN0cmFpZ2h0IGxpbmUgZnJvbSBibGFjayAoMCwgMCwgMCkgdG8gd2hpdGUgKDEsIDEsIDEpLlxyXG4gICAgICAgICAqIEBwYXJhbSBodWUgICAgICAgIC0xIHRvIDEgKC0xIGlzIDE4MCBkZWdyZWUgcm90YXRpb24gaW4gdGhlIG5lZ2F0aXZlIGRpcmVjdGlvbiwgMCBpcyBubyBjaGFuZ2UsXHJcbiAgICAgICAgICogICAgICAgICAgICAgICAgICAgYW5kIDEgaXMgMTgwIGRlZ3JlZSByb3RhdGlvbiBpbiB0aGUgcG9zaXRpdmUgZGlyZWN0aW9uKVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHZhciBIdWUgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xyXG4gICAgICAgICAgICBfX2V4dGVuZHMoSHVlLCBfc3VwZXIpO1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBIdWUoaHVlKSB7XHJcbiAgICAgICAgICAgICAgICBfc3VwZXIuY2FsbCh0aGlzLCBudWxsLCBcIlxcbiAgICAgICAgICAgIHVuaWZvcm0gc2FtcGxlcjJEIHRleHR1cmU7XFxuICAgICAgICAgICAgdW5pZm9ybSBmbG9hdCBodWU7XFxuICAgICAgICAgICAgdmFyeWluZyB2ZWMyIHRleENvb3JkO1xcblxcbiAgICAgICAgICAgIHZvaWQgbWFpbigpIHtcXG4gICAgICAgICAgICAgICAgdmVjNCBjb2xvciA9IHRleHR1cmUyRCh0ZXh0dXJlLCB0ZXhDb29yZCk7XFxuXFxuICAgICAgICAgICAgICAgIC8qIGh1ZSBhZGp1c3RtZW50LCB3b2xmcmFtIGFscGhhOiBSb3RhdGlvblRyYW5zZm9ybVthbmdsZSwgezEsIDEsIDF9XVt7eCwgeSwgen1dICovXFxuICAgICAgICAgICAgICAgIGZsb2F0IGFuZ2xlID0gaHVlICogMy4xNDE1OTI2NTtcXG4gICAgICAgICAgICAgICAgZmxvYXQgcyA9IHNpbihhbmdsZSksIGMgPSBjb3MoYW5nbGUpO1xcbiAgICAgICAgICAgICAgICB2ZWMzIHdlaWdodHMgPSAodmVjMygyLjAgKiBjLCAtc3FydCgzLjApICogcyAtIGMsIHNxcnQoMy4wKSAqIHMgLSBjKSArIDEuMCkgLyAzLjA7XFxuICAgICAgICAgICAgICAgIGNvbG9yLnJnYiA9IHZlYzMoXFxuICAgICAgICAgICAgICAgICAgICBkb3QoY29sb3IucmdiLCB3ZWlnaHRzLnh5eiksXFxuICAgICAgICAgICAgICAgICAgICBkb3QoY29sb3IucmdiLCB3ZWlnaHRzLnp4eSksXFxuICAgICAgICAgICAgICAgICAgICBkb3QoY29sb3IucmdiLCB3ZWlnaHRzLnl6eClcXG4gICAgICAgICAgICAgICAgKTtcXG5cXG4gICAgICAgICAgICAgICAgZ2xfRnJhZ0NvbG9yID0gY29sb3I7XFxuICAgICAgICAgICAgfVxcbiAgICAgICAgXCIpO1xyXG4gICAgICAgICAgICAgICAgLy8gc2V0IHByb3BlcnRpZXNcclxuICAgICAgICAgICAgICAgIHRoaXMucHJvcGVydGllcy5odWUgPSBqc2Z4LkZpbHRlci5jbGFtcCgtMSwgaHVlLCAxKSB8fCAwO1xyXG4gICAgICAgICAgICAgICAgLy8gcHJlLWNhbGN1bGF0ZSBkYXRhIGZvciBjYW52YXMgaXRlcmF0aW9uXHJcbiAgICAgICAgICAgICAgICB2YXIgYW5nbGUgPSBodWUgKiAzLjE0MTU5MjY1O1xyXG4gICAgICAgICAgICAgICAgdmFyIHNpbiA9IE1hdGguc2luKGFuZ2xlKTtcclxuICAgICAgICAgICAgICAgIHZhciBjb3MgPSBNYXRoLmNvcyhhbmdsZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndlaWdodHMgPSBuZXcganNmeC51dGlsLlZlY3RvcjMoMiAqIGNvcywgLU1hdGguc3FydCgzLjApICogc2luIC0gY29zLCBNYXRoLnNxcnQoMy4wKSAqIHNpbiAtIGNvcylcclxuICAgICAgICAgICAgICAgICAgICAuYWRkU2NhbGFyKDEuMClcclxuICAgICAgICAgICAgICAgICAgICAuZGl2aWRlU2NhbGFyKDMuMCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgSHVlLnByb3RvdHlwZS5pdGVyYXRlQ2FudmFzID0gZnVuY3Rpb24gKGhlbHBlcikge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJnYiA9IGhlbHBlci50b1ZlY3RvcjMoKTtcclxuICAgICAgICAgICAgICAgIGhlbHBlci5yID0gcmdiLmRvdCh0aGlzLndlaWdodHMpO1xyXG4gICAgICAgICAgICAgICAgaGVscGVyLmcgPSByZ2IuZG90U2NhbGFycyh0aGlzLndlaWdodHMueiwgdGhpcy53ZWlnaHRzLngsIHRoaXMud2VpZ2h0cy55KTtcclxuICAgICAgICAgICAgICAgIGhlbHBlci5iID0gcmdiLmRvdFNjYWxhcnModGhpcy53ZWlnaHRzLnksIHRoaXMud2VpZ2h0cy56LCB0aGlzLndlaWdodHMueCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHJldHVybiBIdWU7XHJcbiAgICAgICAgfSkoanNmeC5JdGVyYWJsZUZpbHRlcik7XHJcbiAgICAgICAgZmlsdGVyLkh1ZSA9IEh1ZTtcclxuICAgIH0pKGZpbHRlciA9IGpzZnguZmlsdGVyIHx8IChqc2Z4LmZpbHRlciA9IHt9KSk7XHJcbn0pKGpzZnggfHwgKGpzZnggPSB7fSkpO1xyXG52YXIganNmeDtcclxuKGZ1bmN0aW9uIChqc2Z4KSB7XHJcbiAgICB2YXIgZmlsdGVyO1xyXG4gICAgKGZ1bmN0aW9uIChmaWx0ZXIpIHtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAZmlsdGVyICAgICAgICAgICBIdWUgLyBTYXR1cmF0aW9uXHJcbiAgICAgICAgICogQGRlc2NyaXB0aW9uICAgICAgUHJvdmlkZXMgbXVsdGlwbGljYXRpdmUgc2F0dXJhdGlvbiBjb250cm9sLiBSR0IgY29sb3Igc3BhY2VcclxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgICBjYW4gYmUgaW1hZ2luZWQgYXMgYSBjdWJlIHdoZXJlIHRoZSBheGVzIGFyZSB0aGUgcmVkLCBncmVlbiwgYW5kIGJsdWUgY29sb3JcclxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgICB2YWx1ZXMuXHJcbiAgICAgICAgICogICAgICAgICAgICAgICAgICAgU2F0dXJhdGlvbiBpcyBpbXBsZW1lbnRlZCBieSBzY2FsaW5nIGFsbCBjb2xvciBjaGFubmVsIHZhbHVlcyBlaXRoZXIgdG93YXJkXHJcbiAgICAgICAgICogICAgICAgICAgICAgICAgICAgb3IgYXdheSBmcm9tIHRoZSBhdmVyYWdlIGNvbG9yIGNoYW5uZWwgdmFsdWUuXHJcbiAgICAgICAgICogQHBhcmFtIHNhdHVyYXRpb24gLTEgdG8gMSAoLTEgaXMgc29saWQgZ3JheSwgMCBpcyBubyBjaGFuZ2UsIGFuZCAxIGlzIG1heGltdW0gY29udHJhc3QpXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdmFyIFNhdHVyYXRpb24gPSAoZnVuY3Rpb24gKF9zdXBlcikge1xyXG4gICAgICAgICAgICBfX2V4dGVuZHMoU2F0dXJhdGlvbiwgX3N1cGVyKTtcclxuICAgICAgICAgICAgZnVuY3Rpb24gU2F0dXJhdGlvbihzYXR1cmF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBfc3VwZXIuY2FsbCh0aGlzLCBudWxsLCBcIlxcbiAgICAgICAgICAgIHVuaWZvcm0gc2FtcGxlcjJEIHRleHR1cmU7XFxuICAgICAgICAgICAgdW5pZm9ybSBmbG9hdCBzYXR1cmF0aW9uO1xcbiAgICAgICAgICAgIHZhcnlpbmcgdmVjMiB0ZXhDb29yZDtcXG5cXG4gICAgICAgICAgICB2b2lkIG1haW4oKSB7XFxuICAgICAgICAgICAgICAgIHZlYzQgY29sb3IgPSB0ZXh0dXJlMkQodGV4dHVyZSwgdGV4Q29vcmQpO1xcblxcbiAgICAgICAgICAgICAgICBmbG9hdCBhdmVyYWdlID0gKGNvbG9yLnIgKyBjb2xvci5nICsgY29sb3IuYikgLyAzLjA7XFxuICAgICAgICAgICAgICAgIGlmIChzYXR1cmF0aW9uID4gMC4wKSB7XFxuICAgICAgICAgICAgICAgICAgICBjb2xvci5yZ2IgKz0gKGF2ZXJhZ2UgLSBjb2xvci5yZ2IpICogKDEuMCAtIDEuMCAvICgxLjAwMSAtIHNhdHVyYXRpb24pKTtcXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yLnJnYiArPSAoYXZlcmFnZSAtIGNvbG9yLnJnYikgKiAoLXNhdHVyYXRpb24pO1xcbiAgICAgICAgICAgICAgICB9XFxuXFxuICAgICAgICAgICAgICAgIGdsX0ZyYWdDb2xvciA9IGNvbG9yO1xcbiAgICAgICAgICAgIH1cXG4gICAgICAgIFwiKTtcclxuICAgICAgICAgICAgICAgIC8vIHNldCBwcm9wZXJ0aWVzXHJcbiAgICAgICAgICAgICAgICB0aGlzLnByb3BlcnRpZXMuc2F0dXJhdGlvbiA9IGpzZnguRmlsdGVyLmNsYW1wKC0xLCBzYXR1cmF0aW9uLCAxKSB8fCAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFNhdHVyYXRpb24ucHJvdG90eXBlLml0ZXJhdGVDYW52YXMgPSBmdW5jdGlvbiAoaGVscGVyKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc2F0dXJhdGlvbiA9IHRoaXMucHJvcGVydGllcy5zYXR1cmF0aW9uO1xyXG4gICAgICAgICAgICAgICAgdmFyIGF2ZXJhZ2UgPSAoaGVscGVyLnIgKyBoZWxwZXIuZyArIGhlbHBlci5iKSAvIDM7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2F0dXJhdGlvbiA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBoZWxwZXIuciArPSAoYXZlcmFnZSAtIGhlbHBlci5yKSAqICgxIC0gMSAvICgxLjAwMSAtIHNhdHVyYXRpb24pKTtcclxuICAgICAgICAgICAgICAgICAgICBoZWxwZXIuZyArPSAoYXZlcmFnZSAtIGhlbHBlci5nKSAqICgxIC0gMSAvICgxLjAwMSAtIHNhdHVyYXRpb24pKTtcclxuICAgICAgICAgICAgICAgICAgICBoZWxwZXIuYiArPSAoYXZlcmFnZSAtIGhlbHBlci5iKSAqICgxIC0gMSAvICgxLjAwMSAtIHNhdHVyYXRpb24pKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGhlbHBlci5yICs9IChhdmVyYWdlIC0gaGVscGVyLnIpICogKC1zYXR1cmF0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICBoZWxwZXIuZyArPSAoYXZlcmFnZSAtIGhlbHBlci5nKSAqICgtc2F0dXJhdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgaGVscGVyLmIgKz0gKGF2ZXJhZ2UgLSBoZWxwZXIuYikgKiAoLXNhdHVyYXRpb24pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZXR1cm4gU2F0dXJhdGlvbjtcclxuICAgICAgICB9KShqc2Z4Lkl0ZXJhYmxlRmlsdGVyKTtcclxuICAgICAgICBmaWx0ZXIuU2F0dXJhdGlvbiA9IFNhdHVyYXRpb247XHJcbiAgICB9KShmaWx0ZXIgPSBqc2Z4LmZpbHRlciB8fCAoanNmeC5maWx0ZXIgPSB7fSkpO1xyXG59KShqc2Z4IHx8IChqc2Z4ID0ge30pKTtcclxudmFyIGpzZng7XHJcbihmdW5jdGlvbiAoanNmeCkge1xyXG4gICAgdmFyIGZpbHRlcjtcclxuICAgIChmdW5jdGlvbiAoZmlsdGVyKSB7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQGZpbHRlciAgICAgICAgIFNlcGlhXHJcbiAgICAgICAgICogQGRlc2NyaXB0aW9uICAgIEdpdmVzIHRoZSBpbWFnZSBhIHJlZGRpc2gtYnJvd24gbW9ub2Nocm9tZSB0aW50IHRoYXQgaW1pdGF0ZXMgYW4gb2xkIHBob3RvZ3JhcGguXHJcbiAgICAgICAgICogQHBhcmFtIGFtb3VudCAgIDAgdG8gMSAoMCBmb3Igbm8gZWZmZWN0LCAxIGZvciBmdWxsIHNlcGlhIGNvbG9yaW5nKVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHZhciBTZXBpYSA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XHJcbiAgICAgICAgICAgIF9fZXh0ZW5kcyhTZXBpYSwgX3N1cGVyKTtcclxuICAgICAgICAgICAgZnVuY3Rpb24gU2VwaWEoYW1vdW50KSB7XHJcbiAgICAgICAgICAgICAgICBfc3VwZXIuY2FsbCh0aGlzLCBudWxsLCBcIlxcbiAgICAgICAgICAgIHVuaWZvcm0gc2FtcGxlcjJEIHRleHR1cmU7XFxuICAgICAgICAgICAgdW5pZm9ybSBmbG9hdCBhbW91bnQ7XFxuICAgICAgICAgICAgdmFyeWluZyB2ZWMyIHRleENvb3JkO1xcblxcbiAgICAgICAgICAgIHZvaWQgbWFpbigpIHtcXG4gICAgICAgICAgICAgICAgdmVjNCBjb2xvciA9IHRleHR1cmUyRCh0ZXh0dXJlLCB0ZXhDb29yZCk7XFxuICAgICAgICAgICAgICAgIGZsb2F0IHIgPSBjb2xvci5yO1xcbiAgICAgICAgICAgICAgICBmbG9hdCBnID0gY29sb3IuZztcXG4gICAgICAgICAgICAgICAgZmxvYXQgYiA9IGNvbG9yLmI7XFxuXFxuICAgICAgICAgICAgICAgIGNvbG9yLnIgPSBtaW4oMS4wLCAociAqICgxLjAgLSAoMC42MDcgKiBhbW91bnQpKSkgKyAoZyAqICgwLjc2OSAqIGFtb3VudCkpICsgKGIgKiAoMC4xODkgKiBhbW91bnQpKSk7XFxuICAgICAgICAgICAgICAgIGNvbG9yLmcgPSBtaW4oMS4wLCAociAqIDAuMzQ5ICogYW1vdW50KSArIChnICogKDEuMCAtICgwLjMxNCAqIGFtb3VudCkpKSArIChiICogMC4xNjggKiBhbW91bnQpKTtcXG4gICAgICAgICAgICAgICAgY29sb3IuYiA9IG1pbigxLjAsIChyICogMC4yNzIgKiBhbW91bnQpICsgKGcgKiAwLjUzNCAqIGFtb3VudCkgKyAoYiAqICgxLjAgLSAoMC44NjkgKiBhbW91bnQpKSkpO1xcblxcbiAgICAgICAgICAgICAgICBnbF9GcmFnQ29sb3IgPSBjb2xvcjtcXG4gICAgICAgICAgICB9XFxuICAgICAgICBcIik7XHJcbiAgICAgICAgICAgICAgICAvLyBzZXQgcHJvcGVydGllc1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wZXJ0aWVzLmFtb3VudCA9IGpzZnguRmlsdGVyLmNsYW1wKC0xLCBhbW91bnQsIDEpIHx8IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgU2VwaWEucHJvdG90eXBlLml0ZXJhdGVDYW52YXMgPSBmdW5jdGlvbiAoaGVscGVyKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgciA9IGhlbHBlci5yO1xyXG4gICAgICAgICAgICAgICAgdmFyIGcgPSBoZWxwZXIuZztcclxuICAgICAgICAgICAgICAgIHZhciBiID0gaGVscGVyLmI7XHJcbiAgICAgICAgICAgICAgICB2YXIgYW1vdW50ID0gdGhpcy5wcm9wZXJ0aWVzLmFtb3VudDtcclxuICAgICAgICAgICAgICAgIGhlbHBlci5yID0gTWF0aC5taW4oMS4wLCAociAqICgxLjAgLSAoMC42MDcgKiBhbW91bnQpKSkgKyAoZyAqICgwLjc2OSAqIGFtb3VudCkpICsgKGIgKiAoMC4xODkgKiBhbW91bnQpKSk7XHJcbiAgICAgICAgICAgICAgICBoZWxwZXIuZyA9IE1hdGgubWluKDEuMCwgKHIgKiAwLjM0OSAqIGFtb3VudCkgKyAoZyAqICgxLjAgLSAoMC4zMTQgKiBhbW91bnQpKSkgKyAoYiAqIDAuMTY4ICogYW1vdW50KSk7XHJcbiAgICAgICAgICAgICAgICBoZWxwZXIuYiA9IE1hdGgubWluKDEuMCwgKHIgKiAwLjI3MiAqIGFtb3VudCkgKyAoZyAqIDAuNTM0ICogYW1vdW50KSArIChiICogKDEuMCAtICgwLjg2OSAqIGFtb3VudCkpKSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHJldHVybiBTZXBpYTtcclxuICAgICAgICB9KShqc2Z4Lkl0ZXJhYmxlRmlsdGVyKTtcclxuICAgICAgICBmaWx0ZXIuU2VwaWEgPSBTZXBpYTtcclxuICAgIH0pKGZpbHRlciA9IGpzZnguZmlsdGVyIHx8IChqc2Z4LmZpbHRlciA9IHt9KSk7XHJcbn0pKGpzZnggfHwgKGpzZnggPSB7fSkpO1xyXG52YXIganNmeDtcclxuKGZ1bmN0aW9uIChqc2Z4KSB7XHJcbiAgICB2YXIgZmlsdGVyO1xyXG4gICAgKGZ1bmN0aW9uIChmaWx0ZXIpIHtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAZmlsdGVyICAgICAgICAgVW5zaGFycCBNYXNrXHJcbiAgICAgICAgICogQGRlc2NyaXB0aW9uICAgIEEgZm9ybSBvZiBpbWFnZSBzaGFycGVuaW5nIHRoYXQgYW1wbGlmaWVzIGhpZ2gtZnJlcXVlbmNpZXMgaW4gdGhlIGltYWdlLiBJdFxyXG4gICAgICAgICAqICAgICAgICAgICAgICAgICBpcyBpbXBsZW1lbnRlZCBieSBzY2FsaW5nIHBpeGVscyBhd2F5IGZyb20gdGhlIGF2ZXJhZ2Ugb2YgdGhlaXIgbmVpZ2hib3JzLlxyXG4gICAgICAgICAqIEBwYXJhbSByYWRpdXMgICAwIHRvIDE4MCAtIFRoZSBibHVyIHJhZGl1cyB0aGF0IGNhbGN1bGF0ZXMgdGhlIGF2ZXJhZ2Ugb2YgdGhlIG5laWdoYm9yaW5nIHBpeGVscy5cclxuICAgICAgICAgKiBAcGFyYW0gc3RyZW5ndGggQSBzY2FsZSBmYWN0b3Igd2hlcmUgMCBpcyBubyBlZmZlY3QgYW5kIGhpZ2hlciB2YWx1ZXMgY2F1c2UgYSBzdHJvbmdlciBlZmZlY3QuXHJcbiAgICAgICAgICogQG5vdGUgICAgICAgICAgIENvdWxkIHBvdGVudGlhbGx5IGJlIGNvbnZlcnRlZCB0byBhbiBJdGVyYWJsZUZpbHRlciwgYnV0IHdlIHNvbWVob3cgbmVlZCB0aGUgb3JpZ2luYWwgSW1hZ2VEYXRhXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdmFyIFVuc2hhcnBNYXNrID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcclxuICAgICAgICAgICAgX19leHRlbmRzKFVuc2hhcnBNYXNrLCBfc3VwZXIpO1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBVbnNoYXJwTWFzayhyYWRpdXMsIHN0cmVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBfc3VwZXIuY2FsbCh0aGlzLCBudWxsLCBcIlxcbiAgICAgICAgICAgIHVuaWZvcm0gc2FtcGxlcjJEIGJsdXJyZWRUZXh0dXJlO1xcbiAgICAgICAgICAgIHVuaWZvcm0gc2FtcGxlcjJEIG9yaWdpbmFsVGV4dHVyZTtcXG4gICAgICAgICAgICB1bmlmb3JtIGZsb2F0IHN0cmVuZ3RoO1xcbiAgICAgICAgICAgIHVuaWZvcm0gZmxvYXQgdGhyZXNob2xkO1xcbiAgICAgICAgICAgIHZhcnlpbmcgdmVjMiB0ZXhDb29yZDtcXG5cXG4gICAgICAgICAgICB2b2lkIG1haW4oKSB7XFxuICAgICAgICAgICAgICAgIHZlYzQgYmx1cnJlZCA9IHRleHR1cmUyRChibHVycmVkVGV4dHVyZSwgdGV4Q29vcmQpO1xcbiAgICAgICAgICAgICAgICB2ZWM0IG9yaWdpbmFsID0gdGV4dHVyZTJEKG9yaWdpbmFsVGV4dHVyZSwgdGV4Q29vcmQpO1xcbiAgICAgICAgICAgICAgICBnbF9GcmFnQ29sb3IgPSBtaXgoYmx1cnJlZCwgb3JpZ2luYWwsIDEuMCArIHN0cmVuZ3RoKTtcXG4gICAgICAgICAgICB9XFxuICAgICAgICBcIik7XHJcbiAgICAgICAgICAgICAgICAvLyBzZXQgcHJvcGVydGllc1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9wZXJ0aWVzLnJhZGl1cyA9IHJhZGl1cztcclxuICAgICAgICAgICAgICAgIHRoaXMucHJvcGVydGllcy5zdHJlbmd0aCA9IHN0cmVuZ3RoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFVuc2hhcnBNYXNrLnByb3RvdHlwZS5kcmF3V2ViR0wgPSBmdW5jdGlvbiAocmVuZGVyZXIpIHtcclxuICAgICAgICAgICAgICAgIHZhciBzaGFkZXIgPSByZW5kZXJlci5nZXRTaGFkZXIodGhpcyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmFkaXVzID0gdGhpcy5wcm9wZXJ0aWVzLnJhZGl1cztcclxuICAgICAgICAgICAgICAgIHZhciBzdHJlbmd0aCA9IHRoaXMucHJvcGVydGllcy5zdHJlbmd0aDtcclxuICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSBhIG5ldyB0ZXh0dXJlXHJcbiAgICAgICAgICAgICAgICB2YXIgZXh0cmFUZXh0dXJlID0gcmVuZGVyZXIuY3JlYXRlVGV4dHVyZSgpO1xyXG4gICAgICAgICAgICAgICAgLy8gdXNlIGEgdGV4dHVyZSBhbmQgZHJhdyB0byBpdFxyXG4gICAgICAgICAgICAgICAgcmVuZGVyZXIuZ2V0VGV4dHVyZSgpLnVzZSgpO1xyXG4gICAgICAgICAgICAgICAgZXh0cmFUZXh0dXJlLmRyYXdUbyhyZW5kZXJlci5nZXREZWZhdWx0U2hhZGVyKCkuZHJhd1JlY3QuYmluZChyZW5kZXJlci5nZXREZWZhdWx0U2hhZGVyKCkpKTtcclxuICAgICAgICAgICAgICAgIC8vIGJsdXIgY3VycmVudCB0ZXh0dXJlXHJcbiAgICAgICAgICAgICAgICBleHRyYVRleHR1cmUudXNlKDEpO1xyXG4gICAgICAgICAgICAgICAgLy8gZHJhdyB0aGUgYmx1clxyXG4gICAgICAgICAgICAgICAgdmFyIGJsdXIgPSBuZXcgZmlsdGVyLkJsdXIocmFkaXVzKTtcclxuICAgICAgICAgICAgICAgIGJsdXIuZHJhd1dlYkdMKHJlbmRlcmVyKTtcclxuICAgICAgICAgICAgICAgIC8vIHVzZSB0aGUgc3RvcmVkIHRleHR1cmUgdG8gZGV0ZWN0IGVkZ2VzXHJcbiAgICAgICAgICAgICAgICBzaGFkZXIudGV4dHVyZXMoe1xyXG4gICAgICAgICAgICAgICAgICAgIG9yaWdpbmFsVGV4dHVyZTogMVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZW5kZXJlci5nZXRUZXh0dXJlKCkudXNlKCk7XHJcbiAgICAgICAgICAgICAgICByZW5kZXJlci5nZXROZXh0VGV4dHVyZSgpLmRyYXdUbyhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2hhZGVyLnVuaWZvcm1zKHsgc3RyZW5ndGg6IHN0cmVuZ3RoIH0pLmRyYXdSZWN0KCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGV4dHJhVGV4dHVyZS51bnVzZSgxKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgVW5zaGFycE1hc2sucHJvdG90eXBlLmRyYXdDYW52YXMgPSBmdW5jdGlvbiAoaW1hZ2VEYXRhKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGl4ZWxzID0gaW1hZ2VEYXRhLmRhdGE7XHJcbiAgICAgICAgICAgICAgICAvLyBwcm9wc1xyXG4gICAgICAgICAgICAgICAgdmFyIHJhZGl1cyA9IHRoaXMucHJvcGVydGllcy5yYWRpdXM7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3RyZW5ndGggPSB0aGlzLnByb3BlcnRpZXMuc3RyZW5ndGggKyAxO1xyXG4gICAgICAgICAgICAgICAgLy8gY2xvbmUgb2YgZGF0YVxyXG4gICAgICAgICAgICAgICAgLy8gQHRvZG86IGRlY2xhcmVkIG15IG93biBVaW50OENsYW1wZWRBcnJheSBhYm92ZSBzaW5jZSBJIGFtIGhhdmluZyBpc3N1ZXMgd2l0aCBUeXBlU2NyaXB0LlxyXG4gICAgICAgICAgICAgICAgLy8gYWRkaXRpb25hbGx5LCBteSBwcmV2aW91cyBjYWxsZWQgaW1hZ2VEYXRhLmRhdGEuc2V0KG9yaWdpbmFsKSAod2hpY2ggSSBhbHNvIGNhbid0IGhlcmUgYmVjYXVzZSBvZiBUUyBtYXBwaW5nKVxyXG4gICAgICAgICAgICAgICAgdmFyIG9yaWdpbmFsID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGltYWdlRGF0YS5kYXRhKTtcclxuICAgICAgICAgICAgICAgIGltYWdlRGF0YS5kYXRhID0gb3JpZ2luYWw7XHJcbiAgICAgICAgICAgICAgICAvLyBibHVyIGltYWdlXHJcbiAgICAgICAgICAgICAgICB2YXIgYmx1ciA9IG5ldyBmaWx0ZXIuQmx1cihyYWRpdXMpO1xyXG4gICAgICAgICAgICAgICAgYmx1ci5kcmF3Q2FudmFzKGltYWdlRGF0YSk7XHJcbiAgICAgICAgICAgICAgICAvLyB0cnlpbmcgdG8gcmVwbGljYXRlIG1peCgpIGZyb20gd2ViZ2wsIHdoaWNoIGlzIGJhc2ljYWxseSB4ICogKDEgLWEpXHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBpeGVscy5sZW5ndGg7IGkgKz0gNCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBpeGVsc1tpXSA9IHBpeGVsc1tpXSAqICgxIC0gc3RyZW5ndGgpICsgb3JpZ2luYWxbaV0gKiBzdHJlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICBwaXhlbHNbaSArIDFdID0gcGl4ZWxzW2kgKyAxXSAqICgxIC0gc3RyZW5ndGgpICsgb3JpZ2luYWxbaSArIDFdICogc3RyZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgcGl4ZWxzW2kgKyAyXSA9IHBpeGVsc1tpICsgMl0gKiAoMSAtIHN0cmVuZ3RoKSArIG9yaWdpbmFsW2kgKyAyXSAqIHN0cmVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGltYWdlRGF0YTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgcmV0dXJuIFVuc2hhcnBNYXNrO1xyXG4gICAgICAgIH0pKGpzZnguRmlsdGVyKTtcclxuICAgICAgICBmaWx0ZXIuVW5zaGFycE1hc2sgPSBVbnNoYXJwTWFzaztcclxuICAgIH0pKGZpbHRlciA9IGpzZnguZmlsdGVyIHx8IChqc2Z4LmZpbHRlciA9IHt9KSk7XHJcbn0pKGpzZnggfHwgKGpzZnggPSB7fSkpO1xyXG52YXIganNmeDtcclxuKGZ1bmN0aW9uIChqc2Z4KSB7XHJcbiAgICB2YXIgdXRpbDtcclxuICAgIChmdW5jdGlvbiAodXRpbCkge1xyXG4gICAgICAgIHZhciBJbWFnZURhdGFIZWxwZXIgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBJbWFnZURhdGFIZWxwZXIoaW1hZ2VEYXRhLCBpbmRleCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbWFnZURhdGEgPSBpbWFnZURhdGE7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmluZGV4ID0gaW5kZXg7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnIgPSB0aGlzLmltYWdlRGF0YS5kYXRhW2luZGV4XSAvIDI1NTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZyA9IHRoaXMuaW1hZ2VEYXRhLmRhdGFbaW5kZXggKyAxXSAvIDI1NTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYiA9IHRoaXMuaW1hZ2VEYXRhLmRhdGFbaW5kZXggKyAyXSAvIDI1NTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYSA9IHRoaXMuaW1hZ2VEYXRhLmRhdGFbaW5kZXggKyAzXSAvIDI1NTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBJbWFnZURhdGFIZWxwZXIucHJvdG90eXBlLmdldEltYWdlRGF0YSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmltYWdlRGF0YTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgSW1hZ2VEYXRhSGVscGVyLnByb3RvdHlwZS5zYXZlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbWFnZURhdGEuZGF0YVt0aGlzLmluZGV4XSA9IHRoaXMuciAqIDI1NTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW1hZ2VEYXRhLmRhdGFbdGhpcy5pbmRleCArIDFdID0gdGhpcy5nICogMjU1O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbWFnZURhdGEuZGF0YVt0aGlzLmluZGV4ICsgMl0gPSB0aGlzLmIgKiAyNTU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmltYWdlRGF0YS5kYXRhW3RoaXMuaW5kZXggKyAzXSA9IHRoaXMuYSAqIDI1NTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgSW1hZ2VEYXRhSGVscGVyLnByb3RvdHlwZS50b1ZlY3RvcjMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IGpzZngudXRpbC5WZWN0b3IzKHRoaXMuciwgdGhpcy5nLCB0aGlzLmIpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBJbWFnZURhdGFIZWxwZXIucHJvdG90eXBlLmZyb21WZWN0b3IzID0gZnVuY3Rpb24gKHYpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuciA9IHYueDtcclxuICAgICAgICAgICAgICAgIHRoaXMuZyA9IHYueTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYiA9IHYuejtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgcmV0dXJuIEltYWdlRGF0YUhlbHBlcjtcclxuICAgICAgICB9KSgpO1xyXG4gICAgICAgIHV0aWwuSW1hZ2VEYXRhSGVscGVyID0gSW1hZ2VEYXRhSGVscGVyO1xyXG4gICAgfSkodXRpbCA9IGpzZngudXRpbCB8fCAoanNmeC51dGlsID0ge30pKTtcclxufSkoanNmeCB8fCAoanNmeCA9IHt9KSk7XHJcbnZhciBqc2Z4O1xyXG4oZnVuY3Rpb24gKGpzZngpIHtcclxuICAgIHZhciB1dGlsO1xyXG4gICAgKGZ1bmN0aW9uICh1dGlsKSB7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogRnJvbSBTcGxpbmVJbnRlcnBvbGF0b3IuY3MgaW4gdGhlIFBhaW50Lk5FVCBzb3VyY2UgY29kZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHZhciBTcGxpbmVJbnRlcnBvbGF0b3IgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBTcGxpbmVJbnRlcnBvbGF0b3IocG9pbnRzKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvaW50cyA9IHBvaW50cztcclxuICAgICAgICAgICAgICAgIHZhciBuID0gcG9pbnRzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHZhciBpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy54YSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy55YSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy51ID0gW107XHJcbiAgICAgICAgICAgICAgICB0aGlzLnkyID0gW107XHJcbiAgICAgICAgICAgICAgICBwb2ludHMuc29ydChmdW5jdGlvbiAoYSwgYikge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhWzBdIC0gYlswXTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IG47IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMueGEucHVzaChwb2ludHNbaV1bMF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMueWEucHVzaChwb2ludHNbaV1bMV0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy51WzBdID0gMDtcclxuICAgICAgICAgICAgICAgIHRoaXMueTJbMF0gPSAwO1xyXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMTsgaSA8IG4gLSAxOyArK2kpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBkZWNvbXBvc2l0aW9uIGxvb3Agb2YgdGhlIHRyaS1kaWFnb25hbCBhbGdvcml0aG0uXHJcbiAgICAgICAgICAgICAgICAgICAgLy8geTIgYW5kIHUgYXJlIHVzZWQgZm9yIHRlbXBvcmFyeSBzdG9yYWdlIG9mIHRoZSBkZWNvbXBvc2VkIGZhY3RvcnMuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHd4ID0gdGhpcy54YVtpICsgMV0gLSB0aGlzLnhhW2kgLSAxXTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc2lnID0gKHRoaXMueGFbaV0gLSB0aGlzLnhhW2kgLSAxXSkgLyB3eDtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcCA9IHNpZyAqIHRoaXMueTJbaSAtIDFdICsgMi4wO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMueTJbaV0gPSAoc2lnIC0gMS4wKSAvIHA7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRkeWR4ID0gKHRoaXMueWFbaSArIDFdIC0gdGhpcy55YVtpXSkgLyAodGhpcy54YVtpICsgMV0gLSB0aGlzLnhhW2ldKSAtXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICh0aGlzLnlhW2ldIC0gdGhpcy55YVtpIC0gMV0pIC8gKHRoaXMueGFbaV0gLSB0aGlzLnhhW2kgLSAxXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51W2ldID0gKDYuMCAqIGRkeWR4IC8gd3ggLSBzaWcgKiB0aGlzLnVbaSAtIDFdKSAvIHA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLnkyW24gLSAxXSA9IDA7XHJcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBiYWNrLXN1YnN0aXR1dGlvbiBsb29wIG9mIHRoZSB0cmktZGlhZ29uYWwgYWxnb3JpdGhtXHJcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSBuIC0gMjsgaSA+PSAwOyAtLWkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnkyW2ldID0gdGhpcy55MltpXSAqIHRoaXMueTJbaSArIDFdICsgdGhpcy51W2ldO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFNwbGluZUludGVycG9sYXRvci5wcm90b3R5cGUuaW50ZXJwb2xhdGUgPSBmdW5jdGlvbiAoeCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG4gPSB0aGlzLnlhLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHZhciBrbG8gPSAwO1xyXG4gICAgICAgICAgICAgICAgdmFyIGtoaSA9IG4gLSAxO1xyXG4gICAgICAgICAgICAgICAgLy8gV2Ugd2lsbCBmaW5kIHRoZSByaWdodCBwbGFjZSBpbiB0aGUgdGFibGUgYnkgbWVhbnMgb2ZcclxuICAgICAgICAgICAgICAgIC8vIGJpc2VjdGlvbi4gVGhpcyBpcyBvcHRpbWFsIGlmIHNlcXVlbnRpYWwgY2FsbHMgdG8gdGhpc1xyXG4gICAgICAgICAgICAgICAgLy8gcm91dGluZSBhcmUgYXQgcmFuZG9tIHZhbHVlcyBvZiB4LiBJZiBzZXF1ZW50aWFsIGNhbGxzXHJcbiAgICAgICAgICAgICAgICAvLyBhcmUgaW4gb3JkZXIsIGFuZCBjbG9zZWx5IHNwYWNlZCwgb25lIHdvdWxkIGRvIGJldHRlclxyXG4gICAgICAgICAgICAgICAgLy8gdG8gc3RvcmUgcHJldmlvdXMgdmFsdWVzIG9mIGtsbyBhbmQga2hpLlxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGtoaSAtIGtsbyA+IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgayA9IChraGkgKyBrbG8pID4+IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMueGFba10gPiB4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGtoaSA9IGs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBrbG8gPSBrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciBoID0gdGhpcy54YVtraGldIC0gdGhpcy54YVtrbG9dO1xyXG4gICAgICAgICAgICAgICAgdmFyIGEgPSAodGhpcy54YVtraGldIC0geCkgLyBoO1xyXG4gICAgICAgICAgICAgICAgdmFyIGIgPSAoeCAtIHRoaXMueGFba2xvXSkgLyBoO1xyXG4gICAgICAgICAgICAgICAgLy8gQ3ViaWMgc3BsaW5lIHBvbHlub21pYWwgaXMgbm93IGV2YWx1YXRlZC5cclxuICAgICAgICAgICAgICAgIHJldHVybiBhICogdGhpcy55YVtrbG9dICsgYiAqIHRoaXMueWFba2hpXSArXHJcbiAgICAgICAgICAgICAgICAgICAgKChhICogYSAqIGEgLSBhKSAqIHRoaXMueTJba2xvXSArIChiICogYiAqIGIgLSBiKSAqIHRoaXMueTJba2hpXSkgKiAoaCAqIGgpIC8gNi4wO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZXR1cm4gU3BsaW5lSW50ZXJwb2xhdG9yO1xyXG4gICAgICAgIH0pKCk7XHJcbiAgICAgICAgdXRpbC5TcGxpbmVJbnRlcnBvbGF0b3IgPSBTcGxpbmVJbnRlcnBvbGF0b3I7XHJcbiAgICB9KSh1dGlsID0ganNmeC51dGlsIHx8IChqc2Z4LnV0aWwgPSB7fSkpO1xyXG59KShqc2Z4IHx8IChqc2Z4ID0ge30pKTtcclxuLyoqXHJcbiAqIFZlY3RvcjMgVXRpbGl0eSBDbGFzc1xyXG4gKiAgLT4gVGFrZW4gZnJvbSBodHRwczovL2dpdGh1Yi5jb20vbXJkb29iL3RocmVlLmpzL2Jsb2IvbWFzdGVyL3NyYy9tYXRoL1ZlY3RvcjMuanMgd2l0aCBvbmx5IHRoZSBmdW5jdGlvbnMgd2UgbmVlZC5cclxuICovXHJcbnZhciBqc2Z4O1xyXG4oZnVuY3Rpb24gKGpzZngpIHtcclxuICAgIHZhciB1dGlsO1xyXG4gICAgKGZ1bmN0aW9uICh1dGlsKSB7XHJcbiAgICAgICAgdmFyIFZlY3RvcjMgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBWZWN0b3IzKHgsIHksIHopIHtcclxuICAgICAgICAgICAgICAgIHRoaXMueCA9IHg7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnkgPSB5O1xyXG4gICAgICAgICAgICAgICAgdGhpcy56ID0gejtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBWZWN0b3IzLnByb3RvdHlwZS5hZGRTY2FsYXIgPSBmdW5jdGlvbiAocykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy54ICs9IHM7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnkgKz0gcztcclxuICAgICAgICAgICAgICAgIHRoaXMueiArPSBzO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFZlY3RvcjMucHJvdG90eXBlLm11bHRpcGx5U2NhbGFyID0gZnVuY3Rpb24gKHMpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMueCAqPSBzO1xyXG4gICAgICAgICAgICAgICAgdGhpcy55ICo9IHM7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnogKj0gcztcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBWZWN0b3IzLnByb3RvdHlwZS5kaXZpZGVTY2FsYXIgPSBmdW5jdGlvbiAocykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHMgIT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaW52U2NhbGFyID0gMSAvIHM7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy54ICo9IGludlNjYWxhcjtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnkgKj0gaW52U2NhbGFyO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMueiAqPSBpbnZTY2FsYXI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnggPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMueSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy56ID0gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBWZWN0b3IzLnByb3RvdHlwZS5sZW5ndGggPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueSArIHRoaXMueiAqIHRoaXMueik7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFZlY3RvcjMucHJvdG90eXBlLmRvdCA9IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy54ICogdi54ICsgdGhpcy55ICogdi55ICsgdGhpcy56ICogdi56O1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBWZWN0b3IzLnByb3RvdHlwZS5kb3RTY2FsYXJzID0gZnVuY3Rpb24gKHgsIHksIHopIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnggKiB4ICsgdGhpcy55ICogeSArIHRoaXMueiAqIHo7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHJldHVybiBWZWN0b3IzO1xyXG4gICAgICAgIH0pKCk7XHJcbiAgICAgICAgdXRpbC5WZWN0b3IzID0gVmVjdG9yMztcclxuICAgIH0pKHV0aWwgPSBqc2Z4LnV0aWwgfHwgKGpzZngudXRpbCA9IHt9KSk7XHJcbn0pKGpzZnggfHwgKGpzZnggPSB7fSkpO1xyXG52YXIganNmeDtcclxuKGZ1bmN0aW9uIChqc2Z4KSB7XHJcbiAgICB2YXIgd2ViZ2w7XHJcbiAgICAoZnVuY3Rpb24gKHdlYmdsKSB7XHJcbiAgICAgICAgdmFyIFJlbmRlcmVyID0gKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZnVuY3Rpb24gUmVuZGVyZXIoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdsID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dChcImV4cGVyaW1lbnRhbC13ZWJnbFwiLCB7IHByZW11bHRpcGxpZWRBbHBoYTogZmFsc2UgfSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdsLnBpeGVsU3RvcmVpKHRoaXMuZ2wuVU5QQUNLX1BSRU1VTFRJUExZX0FMUEhBX1dFQkdMLCAxKTtcclxuICAgICAgICAgICAgICAgIC8vIHZhcmlhYmxlcyB0byBzdG9yZSB0aGUgc291cmNlXHJcbiAgICAgICAgICAgICAgICB0aGlzLnNvdXJjZSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNvdXJjZVRleHR1cmUgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgLy8gc3RvcmUgdGhlIHRleHR1cmVzIGFuZCBidWZmZXJzXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRleHR1cmVzID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRleHR1cmUgPSAwO1xyXG4gICAgICAgICAgICAgICAgLy8gaW5pdGlhbGl6ZSBhIHNoYWRlciBjYWNoZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5nbC5zaGFkZXJDYWNoZSA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFJlbmRlcmVyLnByb3RvdHlwZS5zZXRTb3VyY2UgPSBmdW5jdGlvbiAoc291cmNlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBmaXJzdCwgY2xlYW4gdXBcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYW5VcCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gcmUtaW5pdGlhbGl6ZSByZW5kZXJlciBmb3IgcmVuZGVyaW5nIHdpdGggbmV3IHNvdXJjZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNvdXJjZVRleHR1cmUgPSBqc2Z4LndlYmdsLlRleHR1cmUuZnJvbUVsZW1lbnQodGhpcy5nbCwgc291cmNlLmVsZW1lbnQpO1xyXG4gICAgICAgICAgICAgICAgLy8gaW5pdGlhbGl6ZSB0aGUgcmVuZGVyZXIgdGV4dHVyZXNcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5pdGlhbGl6ZSgpO1xyXG4gICAgICAgICAgICAgICAgLy8gZHJhdyB0aGUgc291cmNlIHRleHR1cmUgb250byB0aGUgZmlyc3QgdGV4dHVyZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5zb3VyY2VUZXh0dXJlLnVzZSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5nZXRUZXh0dXJlKCkuZHJhd1RvKHRoaXMuZ2V0RGVmYXVsdFNoYWRlcigpLmRyYXdSZWN0LmJpbmQodGhpcy5nZXREZWZhdWx0U2hhZGVyKCkpKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBSZW5kZXJlci5wcm90b3R5cGUuZ2V0U291cmNlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc291cmNlO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBSZW5kZXJlci5wcm90b3R5cGUuYXBwbHlGaWx0ZXIgPSBmdW5jdGlvbiAoZmlsdGVyKSB7XHJcbiAgICAgICAgICAgICAgICBmaWx0ZXIuZHJhd1dlYkdMKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFJlbmRlcmVyLnByb3RvdHlwZS5hcHBseUZpbHRlcnMgPSBmdW5jdGlvbiAoZmlsdGVycykge1xyXG4gICAgICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICAgICAgICAgIGZpbHRlcnMuZm9yRWFjaChmdW5jdGlvbiAoZmlsdGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyLmRyYXdXZWJHTChfdGhpcyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBSZW5kZXJlci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5nZXRUZXh0dXJlKCkudXNlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdldEZsaXBwZWRTaGFkZXIoKS5kcmF3UmVjdCgpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBSZW5kZXJlci5wcm90b3R5cGUuZ2V0Q2FudmFzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FudmFzO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBSZW5kZXJlci5wcm90b3R5cGUuZ2V0VGV4dHVyZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRleHR1cmVzW3RoaXMuY3VycmVudFRleHR1cmUgJSAyXTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgUmVuZGVyZXIucHJvdG90eXBlLmdldE5leHRUZXh0dXJlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudGV4dHVyZXNbKyt0aGlzLmN1cnJlbnRUZXh0dXJlICUgMl07XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFJlbmRlcmVyLnByb3RvdHlwZS5jcmVhdGVUZXh0dXJlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBqc2Z4LndlYmdsLlRleHR1cmUodGhpcy5nbCwgdGhpcy5zb3VyY2Uud2lkdGgsIHRoaXMuc291cmNlLmhlaWdodCwgdGhpcy5nbC5SR0JBLCB0aGlzLmdsLlVOU0lHTkVEX0JZVEUpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBSZW5kZXJlci5wcm90b3R5cGUuZ2V0U2hhZGVyID0gZnVuY3Rpb24gKGZpbHRlcikge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNhY2hlS2V5ID0gZmlsdGVyLmdldFZlcnRleFNvdXJjZSgpICsgZmlsdGVyLmdldEZyYWdtZW50U291cmNlKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nbC5zaGFkZXJDYWNoZS5oYXNPd25Qcm9wZXJ0eShjYWNoZUtleSkgP1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2wuc2hhZGVyQ2FjaGVbY2FjaGVLZXldIDpcclxuICAgICAgICAgICAgICAgICAgICBuZXcganNmeC53ZWJnbC5TaGFkZXIodGhpcy5nbCwgZmlsdGVyLmdldFZlcnRleFNvdXJjZSgpLCBmaWx0ZXIuZ2V0RnJhZ21lbnRTb3VyY2UoKSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFJlbmRlcmVyLnByb3RvdHlwZS5nZXREZWZhdWx0U2hhZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmdsLnNoYWRlckNhY2hlLmRlZikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2wuc2hhZGVyQ2FjaGUuZGVmID0gbmV3IGpzZngud2ViZ2wuU2hhZGVyKHRoaXMuZ2wpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2wuc2hhZGVyQ2FjaGUuZGVmO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBSZW5kZXJlci5wcm90b3R5cGUuZ2V0RmxpcHBlZFNoYWRlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5nbC5zaGFkZXJDYWNoZS5mbGlwcGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nbC5zaGFkZXJDYWNoZS5mbGlwcGVkID0gbmV3IGpzZngud2ViZ2wuU2hhZGVyKHRoaXMuZ2wsIG51bGwsIFwiXFxuICAgICAgICAgICAgICAgIHVuaWZvcm0gc2FtcGxlcjJEIHRleHR1cmU7XFxuICAgICAgICAgICAgICAgIHZhcnlpbmcgdmVjMiB0ZXhDb29yZDtcXG5cXG4gICAgICAgICAgICAgICAgdm9pZCBtYWluKCkge1xcbiAgICAgICAgICAgICAgICAgICAgZ2xfRnJhZ0NvbG9yID0gdGV4dHVyZTJEKHRleHR1cmUsIHZlYzIodGV4Q29vcmQueCwgMS4wIC0gdGV4Q29vcmQueSkpO1xcbiAgICAgICAgICAgICAgICB9XFxuICAgICAgICAgICAgXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2wuc2hhZGVyQ2FjaGUuZmxpcHBlZDtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgUmVuZGVyZXIucHJvdG90eXBlLmluaXRpYWxpemUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHRoaXMuc291cmNlLndpZHRoO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gdGhpcy5zb3VyY2UuaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgLy8gaW5pdGlhbGl6ZSB0aGUgdGV4dHVyZXNcclxuICAgICAgICAgICAgICAgIHZhciB0ZXh0dXJlcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAyOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlcy5wdXNoKHRoaXMuY3JlYXRlVGV4dHVyZSgpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMudGV4dHVyZXMgPSB0ZXh0dXJlcztcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgUmVuZGVyZXIucHJvdG90eXBlLmNsZWFuVXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBkZXN0cm95IHNvdXJjZSB0ZXh0dXJlXHJcbiAgICAgICAgICAgICAgICB0aGlzLnNvdXJjZVRleHR1cmUuZGVzdHJveSgpO1xyXG4gICAgICAgICAgICAgICAgLy8gZGVzdHJveSB0ZXh0dXJlcyB1c2VkIGZvciBmaWx0ZXJzXHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDI7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGV4dHVyZXNbaV0uZGVzdHJveSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gcmUtc2V0IHRleHR1cmVzXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRleHR1cmVzID0gbnVsbDtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgcmV0dXJuIFJlbmRlcmVyO1xyXG4gICAgICAgIH0pKCk7XHJcbiAgICAgICAgd2ViZ2wuUmVuZGVyZXIgPSBSZW5kZXJlcjtcclxuICAgIH0pKHdlYmdsID0ganNmeC53ZWJnbCB8fCAoanNmeC53ZWJnbCA9IHt9KSk7XHJcbn0pKGpzZnggfHwgKGpzZnggPSB7fSkpO1xyXG52YXIganNmeDtcclxuKGZ1bmN0aW9uIChqc2Z4KSB7XHJcbiAgICB2YXIgd2ViZ2w7XHJcbiAgICAoZnVuY3Rpb24gKHdlYmdsKSB7XHJcbiAgICAgICAgdmFyIFNoYWRlciA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIFNoYWRlcihnbCwgdmVydGV4U291cmNlLCBmcmFnbWVudFNvdXJjZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5nbCA9IGdsO1xyXG4gICAgICAgICAgICAgICAgLy8gZ2V0IHRoZSBzaGFkZXIgc291cmNlXHJcbiAgICAgICAgICAgICAgICB0aGlzLnZlcnRleFNvdXJjZSA9IHZlcnRleFNvdXJjZSB8fCBTaGFkZXIuZGVmYXVsdFZlcnRleFNvdXJjZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZnJhZ21lbnRTb3VyY2UgPSBmcmFnbWVudFNvdXJjZSB8fCBTaGFkZXIuZGVmYXVsdEZyYWdtZW50U291cmNlO1xyXG4gICAgICAgICAgICAgICAgLy8gc2V0IHByZWNpc2lvblxyXG4gICAgICAgICAgICAgICAgdGhpcy5mcmFnbWVudFNvdXJjZSA9IFwicHJlY2lzaW9uIGhpZ2hwIGZsb2F0O1wiICsgdGhpcy5mcmFnbWVudFNvdXJjZTtcclxuICAgICAgICAgICAgICAgIC8vIGluaXQgdmFyc1xyXG4gICAgICAgICAgICAgICAgdGhpcy52ZXJ0ZXhBdHRyaWJ1dGUgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgdGhpcy50ZXhDb29yZEF0dHJpYnV0ZSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAvLyBjcmVhdGUgdGhlIHByb2dyYW1cclxuICAgICAgICAgICAgICAgIHRoaXMucHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0oKTtcclxuICAgICAgICAgICAgICAgIC8vIGF0dGFjaCB0aGUgc2hhZGVyc1xyXG4gICAgICAgICAgICAgICAgZ2wuYXR0YWNoU2hhZGVyKHRoaXMucHJvZ3JhbSwgY29tcGlsZVNvdXJjZShnbCwgZ2wuVkVSVEVYX1NIQURFUiwgdGhpcy52ZXJ0ZXhTb3VyY2UpKTtcclxuICAgICAgICAgICAgICAgIGdsLmF0dGFjaFNoYWRlcih0aGlzLnByb2dyYW0sIGNvbXBpbGVTb3VyY2UoZ2wsIGdsLkZSQUdNRU5UX1NIQURFUiwgdGhpcy5mcmFnbWVudFNvdXJjZSkpO1xyXG4gICAgICAgICAgICAgICAgLy8gbGluayB0aGUgcHJvZ3JhbSBhbmQgZW5zdXJlIGl0IHdvcmtlZFxyXG4gICAgICAgICAgICAgICAgZ2wubGlua1Byb2dyYW0odGhpcy5wcm9ncmFtKTtcclxuICAgICAgICAgICAgICAgIGlmICghZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcih0aGlzLnByb2dyYW0sIGdsLkxJTktfU1RBVFVTKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IFwibGluayBlcnJvcjogXCIgKyBnbC5nZXRQcm9ncmFtSW5mb0xvZyh0aGlzLnByb2dyYW0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiB0ZXh0dXJlcyBhcmUgdW5pZm9ybXMgdG9vIGJ1dCBmb3Igc29tZSByZWFzb24gY2FuJ3QgYmUgc3BlY2lmaWVkIGJ5IHRoaXMuZ2wudW5pZm9ybTFmLFxyXG4gICAgICAgICAgICAgKiBldmVuIHRob3VnaCBmbG9hdGluZyBwb2ludCBudW1iZXJzIHJlcHJlc2VudCB0aGUgaW50ZWdlcnMgMCB0aHJvdWdoIDcgZXhhY3RseVxyXG4gICAgICAgICAgICAgKlxyXG4gICAgICAgICAgICAgKiBAcGFyYW0gdGV4dHVyZXNcclxuICAgICAgICAgICAgICogQHJldHVybnMge1NoYWRlcn1cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIFNoYWRlci5wcm90b3R5cGUudGV4dHVyZXMgPSBmdW5jdGlvbiAodGV4dHVyZXMpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZ2wudXNlUHJvZ3JhbSh0aGlzLnByb2dyYW0pO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgbmFtZSBpbiB0ZXh0dXJlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghdGV4dHVyZXMuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2wudW5pZm9ybTFpKHRoaXMuZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHRoaXMucHJvZ3JhbSwgbmFtZSksIHRleHR1cmVzW25hbWVdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBTaGFkZXIucHJvdG90eXBlLnVuaWZvcm1zID0gZnVuY3Rpb24gKHVuaWZvcm1zKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdsLnVzZVByb2dyYW0odGhpcy5wcm9ncmFtKTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIG5hbWUgaW4gdW5pZm9ybXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXVuaWZvcm1zLmhhc093blByb3BlcnR5KG5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB2YXIgbG9jYXRpb24gPSB0aGlzLmdsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnByb2dyYW0sIG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChsb2NhdGlvbiA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3aWxsIGJlIG51bGwgaWYgdGhlIHVuaWZvcm0gaXNuJ3QgdXNlZCBpbiB0aGUgc2hhZGVyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSB1bmlmb3Jtc1tuYW1lXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh2YWx1ZS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgMTpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdsLnVuaWZvcm0xZnYobG9jYXRpb24sIG5ldyBGbG9hdDMyQXJyYXkodmFsdWUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdsLnVuaWZvcm0yZnYobG9jYXRpb24sIG5ldyBGbG9hdDMyQXJyYXkodmFsdWUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgMzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdsLnVuaWZvcm0zZnYobG9jYXRpb24sIG5ldyBGbG9hdDMyQXJyYXkodmFsdWUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgNDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdsLnVuaWZvcm00ZnYobG9jYXRpb24sIG5ldyBGbG9hdDMyQXJyYXkodmFsdWUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgOTpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdsLnVuaWZvcm1NYXRyaXgzZnYobG9jYXRpb24sIGZhbHNlLCBuZXcgRmxvYXQzMkFycmF5KHZhbHVlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIDE2OlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ2wudW5pZm9ybU1hdHJpeDRmdihsb2NhdGlvbiwgZmFsc2UsIG5ldyBGbG9hdDMyQXJyYXkodmFsdWUpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJkb250J3Qga25vdyBob3cgdG8gbG9hZCB1bmlmb3JtIFxcXCJcIiArIG5hbWUgKyBcIlxcXCIgb2YgbGVuZ3RoIFwiICsgdmFsdWUubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGlzTnVtYmVyKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdsLnVuaWZvcm0xZihsb2NhdGlvbiwgdmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJhdHRlbXB0ZWQgdG8gc2V0IHVuaWZvcm0gXFxcIlwiICsgbmFtZSArIFwiXFxcIiB0byBpbnZhbGlkIHZhbHVlIFwiICsgKHZhbHVlIHx8IFwidW5kZWZpbmVkXCIpLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFNoYWRlci5wcm90b3R5cGUuZHJhd1JlY3QgPSBmdW5jdGlvbiAobGVmdCwgdG9wLCByaWdodCwgYm90dG9tKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICAgICAgdmFyIHZpZXdwb3J0ID0gdGhpcy5nbC5nZXRQYXJhbWV0ZXIodGhpcy5nbC5WSUVXUE9SVCk7XHJcbiAgICAgICAgICAgICAgICB0b3AgPSB0b3AgIT09IHVuZGVmaW5lZCA/ICh0b3AgLSB2aWV3cG9ydFsxXSkgLyB2aWV3cG9ydFszXSA6IDA7XHJcbiAgICAgICAgICAgICAgICBsZWZ0ID0gbGVmdCAhPT0gdW5kZWZpbmVkID8gKGxlZnQgLSB2aWV3cG9ydFswXSkgLyB2aWV3cG9ydFsyXSA6IDA7XHJcbiAgICAgICAgICAgICAgICByaWdodCA9IHJpZ2h0ICE9PSB1bmRlZmluZWQgPyAocmlnaHQgLSB2aWV3cG9ydFswXSkgLyB2aWV3cG9ydFsyXSA6IDE7XHJcbiAgICAgICAgICAgICAgICBib3R0b20gPSBib3R0b20gIT09IHVuZGVmaW5lZCA/IChib3R0b20gLSB2aWV3cG9ydFsxXSkgLyB2aWV3cG9ydFszXSA6IDE7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZ2wudmVydGV4QnVmZmVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nbC52ZXJ0ZXhCdWZmZXIgPSB0aGlzLmdsLmNyZWF0ZUJ1ZmZlcigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5nbC5iaW5kQnVmZmVyKHRoaXMuZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLmdsLnZlcnRleEJ1ZmZlcik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdsLmJ1ZmZlckRhdGEodGhpcy5nbC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkoW2xlZnQsIHRvcCwgbGVmdCwgYm90dG9tLCByaWdodCwgdG9wLCByaWdodCwgYm90dG9tXSksIHRoaXMuZ2wuU1RBVElDX0RSQVcpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmdsLnRleENvb3JkQnVmZmVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nbC50ZXhDb29yZEJ1ZmZlciA9IHRoaXMuZ2wuY3JlYXRlQnVmZmVyKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nbC5iaW5kQnVmZmVyKHRoaXMuZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLmdsLnRleENvb3JkQnVmZmVyKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdsLmJ1ZmZlckRhdGEodGhpcy5nbC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkoWzAsIDAsIDAsIDEsIDEsIDAsIDEsIDFdKSwgdGhpcy5nbC5TVEFUSUNfRFJBVyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy52ZXJ0ZXhBdHRyaWJ1dGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmVydGV4QXR0cmlidXRlID0gdGhpcy5nbC5nZXRBdHRyaWJMb2NhdGlvbih0aGlzLnByb2dyYW0sIFwidmVydGV4XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkodGhpcy52ZXJ0ZXhBdHRyaWJ1dGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudGV4Q29vcmRBdHRyaWJ1dGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGV4Q29vcmRBdHRyaWJ1dGUgPSB0aGlzLmdsLmdldEF0dHJpYkxvY2F0aW9uKHRoaXMucHJvZ3JhbSwgXCJfdGV4Q29vcmRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSh0aGlzLnRleENvb3JkQXR0cmlidXRlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuZ2wudXNlUHJvZ3JhbSh0aGlzLnByb2dyYW0pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5nbC5iaW5kQnVmZmVyKHRoaXMuZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLmdsLnZlcnRleEJ1ZmZlcik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdsLnZlcnRleEF0dHJpYlBvaW50ZXIodGhpcy52ZXJ0ZXhBdHRyaWJ1dGUsIDIsIHRoaXMuZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZ2wuYmluZEJ1ZmZlcih0aGlzLmdsLkFSUkFZX0JVRkZFUiwgdGhpcy5nbC50ZXhDb29yZEJ1ZmZlcik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdsLnZlcnRleEF0dHJpYlBvaW50ZXIodGhpcy50ZXhDb29yZEF0dHJpYnV0ZSwgMiwgdGhpcy5nbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5nbC5kcmF3QXJyYXlzKHRoaXMuZ2wuVFJJQU5HTEVfU1RSSVAsIDAsIDQpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBTaGFkZXIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdsLmRlbGV0ZVByb2dyYW0odGhpcy5wcm9ncmFtKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucHJvZ3JhbSA9IG51bGw7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFNoYWRlci5kZWZhdWx0VmVydGV4U291cmNlID0gXCJcXG5hdHRyaWJ1dGUgdmVjMiB2ZXJ0ZXg7XFxuYXR0cmlidXRlIHZlYzIgX3RleENvb3JkO1xcbnZhcnlpbmcgdmVjMiB0ZXhDb29yZDtcXG5cXG52b2lkIG1haW4oKSB7XFxuICAgIHRleENvb3JkID0gX3RleENvb3JkO1xcbiAgICBnbF9Qb3NpdGlvbiA9IHZlYzQodmVydGV4ICogMi4wIC0gMS4wLCAwLjAsIDEuMCk7XFxufVwiO1xyXG4gICAgICAgICAgICBTaGFkZXIuZGVmYXVsdEZyYWdtZW50U291cmNlID0gXCJcXG51bmlmb3JtIHNhbXBsZXIyRCB0ZXh0dXJlO1xcbnZhcnlpbmcgdmVjMiB0ZXhDb29yZDtcXG5cXG52b2lkIG1haW4oKSB7XFxuICAgIGdsX0ZyYWdDb2xvciA9IHRleHR1cmUyRCh0ZXh0dXJlLCB0ZXhDb29yZCk7XFxufVwiO1xyXG4gICAgICAgICAgICByZXR1cm4gU2hhZGVyO1xyXG4gICAgICAgIH0pKCk7XHJcbiAgICAgICAgd2ViZ2wuU2hhZGVyID0gU2hhZGVyO1xyXG4gICAgICAgIGZ1bmN0aW9uIGNvbXBpbGVTb3VyY2UoZ2wsIHR5cGUsIHNvdXJjZSkge1xyXG4gICAgICAgICAgICB2YXIgc2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKHR5cGUpO1xyXG4gICAgICAgICAgICBnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzb3VyY2UpO1xyXG4gICAgICAgICAgICBnbC5jb21waWxlU2hhZGVyKHNoYWRlcik7XHJcbiAgICAgICAgICAgIGlmICghZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHNoYWRlciwgZ2wuQ09NUElMRV9TVEFUVVMpKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBcImNvbXBpbGUgZXJyb3I6IFwiICsgZ2wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBzaGFkZXI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGlzQXJyYXkob2JqKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gXCJbb2JqZWN0IEFycmF5XVwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBpc051bWJlcihvYmopIHtcclxuICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopID09PSBcIltvYmplY3QgTnVtYmVyXVwiO1xyXG4gICAgICAgIH1cclxuICAgIH0pKHdlYmdsID0ganNmeC53ZWJnbCB8fCAoanNmeC53ZWJnbCA9IHt9KSk7XHJcbn0pKGpzZnggfHwgKGpzZnggPSB7fSkpO1xyXG52YXIganNmeDtcclxuKGZ1bmN0aW9uIChqc2Z4KSB7XHJcbiAgICB2YXIgd2ViZ2w7XHJcbiAgICAoZnVuY3Rpb24gKHdlYmdsKSB7XHJcbiAgICAgICAgdmFyIFRleHR1cmUgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBUZXh0dXJlKGdsLCB3aWR0aCwgaGVpZ2h0LCBmb3JtYXQsIHR5cGUpIHtcclxuICAgICAgICAgICAgICAgIGlmIChmb3JtYXQgPT09IHZvaWQgMCkgeyBmb3JtYXQgPSBnbC5SR0JBOyB9XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZSA9PT0gdm9pZCAwKSB7IHR5cGUgPSBnbC5VTlNJR05FRF9CWVRFOyB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdsID0gZ2w7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuICAgICAgICAgICAgICAgIHRoaXMuZm9ybWF0ID0gZm9ybWF0O1xyXG4gICAgICAgICAgICAgICAgdGhpcy50eXBlID0gdHlwZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaWQgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGhpcy5pZCk7XHJcbiAgICAgICAgICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTElORUFSKTtcclxuICAgICAgICAgICAgICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5MSU5FQVIpO1xyXG4gICAgICAgICAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfUywgZ2wuQ0xBTVBfVE9fRURHRSk7XHJcbiAgICAgICAgICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9ULCBnbC5DTEFNUF9UT19FREdFKTtcclxuICAgICAgICAgICAgICAgIGlmICh3aWR0aCAmJiBoZWlnaHQpIHtcclxuICAgICAgICAgICAgICAgICAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIHRoaXMuZm9ybWF0LCB3aWR0aCwgaGVpZ2h0LCAwLCB0aGlzLmZvcm1hdCwgdGhpcy50eXBlLCBudWxsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBUZXh0dXJlLnByb3RvdHlwZS5sb2FkQ29udGVudHNPZiA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xyXG4gICAgICAgICAgICAgICAgdGhpcy53aWR0aCA9IGVsZW1lbnQud2lkdGg7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhlaWdodCA9IGVsZW1lbnQuaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5nbC5iaW5kVGV4dHVyZSh0aGlzLmdsLlRFWFRVUkVfMkQsIHRoaXMuaWQpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5nbC50ZXhJbWFnZTJEKHRoaXMuZ2wuVEVYVFVSRV8yRCwgMCwgdGhpcy5mb3JtYXQsIHRoaXMuZm9ybWF0LCB0aGlzLnR5cGUsIGVsZW1lbnQpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBUZXh0dXJlLnByb3RvdHlwZS5pbml0RnJvbUJ5dGVzID0gZnVuY3Rpb24gKHdpZHRoLCBoZWlnaHQsIGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5mb3JtYXQgPSB0aGlzLmdsLlJHQkE7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnR5cGUgPSB0aGlzLmdsLlVOU0lHTkVEX0JZVEU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdsLmJpbmRUZXh0dXJlKHRoaXMuZ2wuVEVYVFVSRV8yRCwgdGhpcy5pZCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdsLnRleEltYWdlMkQodGhpcy5nbC5URVhUVVJFXzJELCAwLCB0aGlzLmdsLlJHQkEsIHdpZHRoLCBoZWlnaHQsIDAsIHRoaXMuZ2wuUkdCQSwgdGhpcy50eXBlLCBuZXcgVWludDhBcnJheShkYXRhKSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFRleHR1cmUucHJvdG90eXBlLnVzZSA9IGZ1bmN0aW9uICh1bml0KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdsLmFjdGl2ZVRleHR1cmUodGhpcy5nbC5URVhUVVJFMCArICh1bml0IHx8IDApKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZ2wuYmluZFRleHR1cmUodGhpcy5nbC5URVhUVVJFXzJELCB0aGlzLmlkKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgVGV4dHVyZS5wcm90b3R5cGUudW51c2UgPSBmdW5jdGlvbiAodW5pdCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5nbC5hY3RpdmVUZXh0dXJlKHRoaXMuZ2wuVEVYVFVSRTAgKyAodW5pdCB8fCAwKSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdsLmJpbmRUZXh0dXJlKHRoaXMuZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFRleHR1cmUucHJvdG90eXBlLmRyYXdUbyA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgLy8gY3JlYXRlIGFuZCBiaW5kIGZyYW1lIGJ1ZmZlclxyXG4gICAgICAgICAgICAgICAgdGhpcy5nbC5mcmFtZUJ1ZmZlciA9IHRoaXMuZ2wuZnJhbWVCdWZmZXIgfHwgdGhpcy5nbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5nbC5iaW5kRnJhbWVidWZmZXIodGhpcy5nbC5GUkFNRUJVRkZFUiwgdGhpcy5nbC5mcmFtZUJ1ZmZlcik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKHRoaXMuZ2wuRlJBTUVCVUZGRVIsIHRoaXMuZ2wuQ09MT1JfQVRUQUNITUVOVDAsIHRoaXMuZ2wuVEVYVFVSRV8yRCwgdGhpcy5pZCwgMCk7XHJcbiAgICAgICAgICAgICAgICAvLyBlbnN1cmUgdGhlcmUgd2FzIG5vIGVycm9yXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5nbC5jaGVja0ZyYW1lYnVmZmVyU3RhdHVzKHRoaXMuZ2wuRlJBTUVCVUZGRVIpICE9PSB0aGlzLmdsLkZSQU1FQlVGRkVSX0NPTVBMRVRFKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaW5jb21wbGV0ZSBmcmFtZWJ1ZmZlclwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIHNldCB0aGUgdmlld3BvcnRcclxuICAgICAgICAgICAgICAgIHRoaXMuZ2wudmlld3BvcnQoMCwgMCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgLy8gZG8gdGhlIGRyYXdpbmdcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICAvLyBzdG9wIHJlbmRlcmluZyB0byB0aGlzIHRleHR1cmVcclxuICAgICAgICAgICAgICAgIHRoaXMuZ2wuYmluZEZyYW1lYnVmZmVyKHRoaXMuZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBUZXh0dXJlLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5nbC5kZWxldGVUZXh0dXJlKHRoaXMuaWQpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFRleHR1cmUuZnJvbUVsZW1lbnQgPSBmdW5jdGlvbiAoZ2wsIGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgIHZhciB0ZXh0dXJlID0gbmV3IFRleHR1cmUoZ2wsIDAsIDApO1xyXG4gICAgICAgICAgICAgICAgdGV4dHVyZS5sb2FkQ29udGVudHNPZihlbGVtZW50KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0ZXh0dXJlO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZXR1cm4gVGV4dHVyZTtcclxuICAgICAgICB9KSgpO1xyXG4gICAgICAgIHdlYmdsLlRleHR1cmUgPSBUZXh0dXJlO1xyXG4gICAgfSkod2ViZ2wgPSBqc2Z4LndlYmdsIHx8IChqc2Z4LndlYmdsID0ge30pKTtcclxufSkoanNmeCB8fCAoanNmeCA9IHt9KSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGpzZng7XHJcbiIsInZhciBFbWl0dGVyID0gcmVxdWlyZSgnLi9lbWl0dGVyJyk7XG5cbmZ1bmN0aW9uIERyb3B6b25lKGVsKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdmFyIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgaW5wdXQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ2ZpbGUnKTtcbiAgaW5wdXQuc2V0QXR0cmlidXRlKCdtdWx0aXBsZScsIHRydWUpO1xuICBpbnB1dC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbihlKSB7XG4gICAgc2VsZi5vbkZpbGVfKGUpO1xuICB9KTtcbiAgZWwuYXBwZW5kQ2hpbGQoaW5wdXQpO1xuXG4gIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgZnVuY3Rpb24oZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGVsLmNsYXNzTGlzdC5hZGQoJ2RyYWdvdmVyJyk7XG4gIH0pO1xuXG4gIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdsZWF2ZScsIGZ1bmN0aW9uKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBlbC5jbGFzc0xpc3QucmVtb3ZlKCdkcmFnb3ZlcicpO1xuICB9KTtcblxuICBlbC5hZGRFdmVudExpc3RlbmVyKCdkcm9wJywgZnVuY3Rpb24oZSkge1xuICAgIGZpbGUgPSBzZWxmLmdldEZpbGVfKGUpO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGVsLmNsYXNzTGlzdC5yZW1vdmUoJ2RyYWdvdmVyJyk7XG4gICAgaWYgKGZpbGUpIHtcbiAgICAgIHNlbGYub25GaWxlXyhlKTtcbiAgICB9XG4gIH0pO1xuXG4gIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgLy8gVE9ETzogRmlndXJlIG91dCBhYm91dCByZS1lbmFibGluZyBjbGljayB0byB1cGxvYWQuXG4gICAgLy9pbnB1dC52YWx1ZSA9IG51bGw7XG4gICAgLy9pbnB1dC5jbGljaygpO1xuICB9KTtcbn1cblxuRHJvcHpvbmUucHJvdG90eXBlID0gbmV3IEVtaXR0ZXIoKTtcblxuRHJvcHpvbmUucHJvdG90eXBlLmdldEZpbGVfID0gZnVuY3Rpb24oZSkge1xuICB2YXIgZmlsZXM7XG4gIGlmIChlLmRhdGFUcmFuc2Zlcikge1xuICAgIGZpbGVzID0gZS5kYXRhVHJhbnNmZXIuZmlsZXM7XG4gIH0gZWxzZSBpZihlLnRhcmdldCkge1xuICAgIGZpbGVzID0gZS50YXJnZXQuZmlsZXM7XG4gIH1cblxuICBpZiAoZmlsZXMubGVuZ3RoID4gMSkge1xuICAgIHRoaXMuZW1pdCgnZXJyb3InLCAnTXVsdGlwbGUgZmlsZXMgZHJvcHBlZC4gUGxlYXNlIGNvbnZlcnQgb25lIGF0IGEgdGltZS4nKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfSBlbHNlIHtcbiAgICAvLyBKdXN0IHRha2UgdGhlIGZpcnN0IGZpbGUuXG4gICAgcmV0dXJuIGZpbGVzWzBdO1xuICB9XG59O1xuXG5Ecm9wem9uZS5wcm90b3R5cGUub25GaWxlXyA9IGZ1bmN0aW9uKGUpIHtcbiAgdmFyIGZpbGUgPSB0aGlzLmdldEZpbGVfKGUpO1xuICBpZiAoIWZpbGUubmFtZS5lbmRzV2l0aCgnanBnJykpIHtcbiAgICB0aGlzLmVtaXQoJ2Vycm9yJywgJ0Ryb3BwZWQgZmlsZSBtdXN0IGhhdmUgdGhlIC5qcGcgZXh0ZW5zaW9uJyk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5lbWl0KCdmaWxlJywgZmlsZSk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRHJvcHpvbmU7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cbmZ1bmN0aW9uIEVtaXR0ZXIoKSB7XG4gIHRoaXMuaW5pdEVtaXR0ZXIoKTtcbn1cblxuRW1pdHRlci5wcm90b3R5cGUuaW5pdEVtaXR0ZXIgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5jYWxsYmFja3MgPSB7fTtcbn07XG5cbkVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbihldmVudE5hbWUpIHtcbiAgdmFyIGNhbGxiYWNrcyA9IHRoaXMuY2FsbGJhY2tzW2V2ZW50TmFtZV07XG4gIGlmICghY2FsbGJhY2tzKSB7XG4gICAgY29uc29sZS5sb2coJ05vIHZhbGlkIGNhbGxiYWNrIHNwZWNpZmllZC4nKTtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cylcbiAgLy8gRWxpbWluYXRlIHRoZSBmaXJzdCBwYXJhbSAodGhlIGNhbGxiYWNrKS5cbiAgYXJncy5zaGlmdCgpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgIGNhbGxiYWNrc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxufTtcblxuRW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbihldmVudE5hbWUsIGNhbGxiYWNrKSB7XG4gIGlmIChldmVudE5hbWUgaW4gdGhpcy5jYWxsYmFja3MpIHtcbiAgICB2YXIgY2JzID0gdGhpcy5jYWxsYmFja3NbZXZlbnROYW1lXVxuICAgIGlmIChjYnMuaW5kZXhPZihjYWxsYmFjaykgPT0gLTEpIHtcbiAgICAgIGNicy5wdXNoKGNhbGxiYWNrKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5jYWxsYmFja3NbZXZlbnROYW1lXSA9IFtjYWxsYmFja107XG4gIH1cbn07XG5cbkVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnROYW1lLCBjYWxsYmFjaykge1xuICBpZiAoIShldmVudE5hbWUgaW4gdGhpcy5jYWxsYmFja3MpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBjYnMgPSB0aGlzLmNhbGxiYWNrc1tldmVudE5hbWVdO1xuICB2YXIgaW5kID0gY2JzLmluZGV4T2YoY2FsbGJhY2spO1xuICBpZiAoaW5kID09IC0xKSB7XG4gICAgY29uc29sZS53YXJuKCdObyBtYXRjaGluZyBjYWxsYmFjayBmb3VuZCcpO1xuICAgIHJldHVybjtcbiAgfVxuICBjYnMuc3BsaWNlKGluZCwgMSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVtaXR0ZXI7XG4iLCJ2YXIgT2RzQ29udmVydGVyID0gcmVxdWlyZSgnLi9vZHMtY29udmVydGVyJyk7XG52YXIgRHJvcHpvbmUgPSByZXF1aXJlKCcuL2Ryb3B6b25lJyk7XG5cbnZhciBUQVJHRVRfU0laRSA9IDQwOTY7XG5cbnZhciBkeiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNkcm9wem9uZScpO1xudmFyIGRyb3B6b25lID0gbmV3IERyb3B6b25lKGR6KTtcbmRyb3B6b25lLm9uKCdmaWxlJywgb25GaWxlRHJvcHBlZCk7XG5kcm9wem9uZS5vbignZXJyb3InLCBvbkRyb3BFcnJvcik7XG5cbmNvbnZlcnRlciA9IG5ldyBPZHNDb252ZXJ0ZXIoKTtcbmNvbnZlcnRlci5vbignY29udmVydCcsIG9uT2RzQ29udmVydGVkKTtcbmNvbnZlcnRlci5vbignZXJyb3InLCBvbk9kc0NvbnZlcnNpb25FcnJvcik7XG5cbi8vIE1ha2UgYWxsIGRpYWxvZ3MgZGlzYXBwZWFyIGlmIGNsaWNrZWQgb3V0IG9mLlxuZHouYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gIGlmIChlLnRhcmdldC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpID09ICdkaWFsb2cnKSB7XG4gICAgaWYgKGRpYWxvZy5vcGVuKSB7XG4gICAgICBkaWFsb2cuY2xvc2UoKTtcbiAgICB9XG4gIH1cbn0pO1xuXG4vLyBIb29rIHVwIHRoZSBvcGVuIGZpbGUgbGluay5cbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNvcGVuZmlsZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgb25PcGVuQ2xpY2tlZCk7XG5cbnZhciBmaWxlbmFtZTtcblxuZnVuY3Rpb24gb25GaWxlRHJvcHBlZChmaWxlKSB7XG4gIC8vIFNob3cgYSBuZXcgZGlhbG9nLlxuICBzaG93RGlhbG9nKCdwcm9ncmVzcycpO1xuXG4gIGNvbnNvbGUubG9nKCdvbkZpbGVEcm9wcGVkJywgZmlsZS5uYW1lKTtcbiAgZmlsZW5hbWUgPSBmaWxlLm5hbWU7XG5cbiAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbihlKSB7XG4gICAgdmFyIGFycmF5QnVmZmVyID0gcmVhZGVyLnJlc3VsdDtcbiAgICAvLyBLaWNrIG9mZiB0aGUgY29udmVyc2lvbiBwcm9jZXNzLlxuICAgIGNvbnZlcnRlci5jb252ZXJ0KGFycmF5QnVmZmVyKTtcbiAgfVxuXG4gIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihmaWxlKTtcbn1cblxuZnVuY3Rpb24gb25PZHNDb252ZXJ0ZWQoY2FudmFzLCBhdWRpbykge1xuICBjb25zb2xlLmxvZygnb25PZHNDb252ZXJ0ZWQsICVzIHggJXMnLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXG4gIGNhbnZhcy50b0Jsb2IoZnVuY3Rpb24oYmxvYikge1xuICAgIHZhciBkbEltYWdlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2RsLWltYWdlJyk7XG4gICAgZGxJbWFnZS5kaXNhYmxlZCA9IGZhbHNlO1xuICAgIGRsSW1hZ2UuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBvbkltYWdlQ2xpY2spO1xuICAgIGZ1bmN0aW9uIG9uSW1hZ2VDbGljaygpIHtcbiAgICAgIGNyZWF0ZUxpbmsoVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKSwgZ2V0Q29udmVydGVkRmlsZW5hbWUoZmlsZW5hbWUpKS5jbGljaygpO1xuICAgICAgZGxJbWFnZS5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIG9uSW1hZ2VDbGljayk7XG4gICAgfVxuXG4gICAgdmFyIGRsQXVkaW8gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZGwtYXVkaW8nKTtcbiAgICBkbEF1ZGlvLmRpc2FibGVkID0gZmFsc2U7XG4gICAgZGxBdWRpby5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIG9uQXVkaW9DbGljayk7XG4gICAgZnVuY3Rpb24gb25BdWRpb0NsaWNrKCkge1xuICAgICAgY3JlYXRlTGluayhhdWRpbywgZ2V0Q29udmVydGVkRmlsZW5hbWUoZmlsZW5hbWUsICcubXA0JykpLmNsaWNrKCk7XG4gICAgICBkbEF1ZGlvLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgb25BdWRpb0NsaWNrKTtcbiAgICB9XG5cbiAgICBzaG93RGlhbG9nKCdzdWNjZXNzJyk7XG4gIH0sICdpbWFnZS9qcGVnJyk7XG5cbn1cblxuZnVuY3Rpb24gY3JlYXRlTGluayh1cmwsIGZpbGVuYW1lKSB7XG4gIHZhciBsaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICBsaW5rLmRvd25sb2FkID0gZmlsZW5hbWU7XG4gIGxpbmsuaHJlZiA9IHVybDtcbiAgcmV0dXJuIGxpbms7XG59XG5cbmZ1bmN0aW9uIG9uT2RzQ29udmVyc2lvbkVycm9yKGVycm9yKSB7XG4gIGNvbnNvbGUubG9nKCdvbk9kc0NvbnZlcnNpb25FcnJvcicsIGVycm9yKTtcbiAgc2hvd0RpYWxvZygnZmFpbCcpXG4gIHNldEVycm9yTWVzc2FnZSgnQ29udmVyc2lvbiBlcnJvcjogJyArIGVycm9yKTtcbn1cblxuZnVuY3Rpb24gb25Ecm9wRXJyb3IoZXJyb3IpIHtcbiAgY29uc29sZS5sb2coJ29uRHJvcEVycm9yJywgZXJyb3IpO1xuICBzaG93RGlhbG9nKCdmYWlsJylcbiAgc2V0RXJyb3JNZXNzYWdlKCdEcm9wIGVycm9yOiAnICsgZXJyb3IpO1xufVxuXG5mdW5jdGlvbiBnZXRDb252ZXJ0ZWRGaWxlbmFtZShmaWxlbmFtZSwgb3B0X2V4dCkge1xuICB2YXIgZXh0SW5kZXggPSBmaWxlbmFtZS5sYXN0SW5kZXhPZignLicpO1xuICB2YXIgYmFzZW5hbWUgPSBmaWxlbmFtZS5zdWJzdHJpbmcoMCwgZXh0SW5kZXgpO1xuICB2YXIgZXh0ID0gb3B0X2V4dCB8fCBmaWxlbmFtZS5zdWJzdHJpbmcoZXh0SW5kZXgpO1xuICByZXR1cm4gYmFzZW5hbWUgKyAnLWNvbnZlcnRlZCcgKyBleHQ7XG59XG5cbmZ1bmN0aW9uIHNob3dEaWFsb2coaWQpIHtcbiAgLy8gQ2xvc2UgcHJldmlvdXNseSBvcGVuIGRpYWxvZyAoaWYgaXQgZXhpc3RzKS5cbiAgaWYgKHdpbmRvdy5kaWFsb2cgJiYgZGlhbG9nLm9wZW4pIHtcbiAgICBkaWFsb2cuY2xvc2UoKTtcbiAgfVxuICBkaWFsb2cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJyArIGlkKTtcbiAgZGlhbG9nLnNob3dNb2RhbCgpO1xufVxuXG5mdW5jdGlvbiBzZXRFcnJvck1lc3NhZ2UoZXJyb3JNZXNzYWdlKSB7XG4gIHZhciBlcnJvciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNlcnJvcicpO1xuICBlcnJvci5pbm5lckhUTUwgPSBlcnJvck1lc3NhZ2U7XG59XG5cbmZ1bmN0aW9uIG9uT3BlbkNsaWNrZWQoZSkge1xuICB2YXIgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICBpbnB1dC50eXBlID0gJ2ZpbGUnO1xuICBpbnB1dC5jbGljaygpO1xuICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBvbkZpbGVQaWNrZWQpO1xufVxuXG5mdW5jdGlvbiBvbkZpbGVQaWNrZWQoZSkge1xuICAvLyBUT0RPOiBWYWxpZGF0aW9uLlxuICB2YXIgZmlsZSA9IGUucGF0aFswXS5maWxlc1swXTtcbiAgb25GaWxlRHJvcHBlZChmaWxlKTtcbn07XG4iLCJ2YXIgRXZlbnRFbWl0dGVyMyA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjMnKTtcbnZhciBqc2Z4ID0gcmVxdWlyZSgnanNmeCcpO1xuXG5cbnZhciBzdGFydFBhcnNpbmc7XG5cbnZhciB3aWR0aCA9IDY0MDtcblxudmFyIE1fU09JID0gMHhkODtcbnZhciBNX0FQUDEgPSAweGUxO1xudmFyIE1fU09TID0gMHhkYTtcblxudmFyIFhNUF9TSUdOQVRVUkUgPSAnaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyc7XG52YXIgRVhURU5TVElPTl9TSUdOQVRVUkUgPSAnaHR0cDovL25zLmFkb2JlLmNvbS94bXAvZXh0ZW5zaW9uLyc7XG52YXIgRVhUX1BSRUZJWF9MRU5HVEggPSA3MTtcblxuXG52YXIgVEFSR0VUX1NJWkUgPSA0MDk2O1xuXG5mdW5jdGlvbiBPZHNDb252ZXJ0ZXIoKSB7XG4gIHRoaXMubGFzdFdpZHRoID0gbnVsbDtcbn1cblxuT2RzQ29udmVydGVyLnByb3RvdHlwZSA9IG5ldyBFdmVudEVtaXR0ZXIzKCk7XG5cbk9kc0NvbnZlcnRlci5wcm90b3R5cGUuY29udmVydCA9IGZ1bmN0aW9uKGFycmF5QnVmZmVyKSB7XG4gIHRoaXMuZGVjb2RlXyhhcnJheUJ1ZmZlcik7XG59O1xuXG4vKipcbiAqIEdpdmVuIHRoZSBsYXN0IGNvbnZlcnRlZCBDYXJkYm9hcmQgQ2FtZXJhIGltYWdlLCB0aGlzIG1ldGhvZCByZXR1cm5zIHRoZVxuICogYmVzdCBwb3ctb2YtdHdvIHdpZHRoIGZvciB0aGUgaW1hZ2UuXG4gKi9cbk9kc0NvbnZlcnRlci5wcm90b3R5cGUuZ2V0T3B0aW1hbFdpZHRoID0gZnVuY3Rpb24oKSB7XG4gIGlmICghdGhpcy5sYXN0V2lkdGgpIHtcbiAgICByZXR1cm4gLTE7XG4gIH1cbiAgcmV0dXJuIE1hdGguY2VpbChNYXRoLmxvZyh0aGlzLmxhc3RXaWR0aCkvTWF0aC5sb2coMikpXG59O1xuXG5PZHNDb252ZXJ0ZXIucHJvdG90eXBlLmRlY29kZV8gPSBmdW5jdGlvbihhcnJheUJ1ZmZlcikge1xuICB2YXIgc2NvcGUgPSB0aGlzO1xuXG4gIGlmICghYXJyYXlCdWZmZXIpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgc3RhcnRQYXJzaW5nID0gRGF0ZS5ub3coKTtcbiAgY29uc29sZS5sb2coJ1N0YXJ0ZWQgcGFyc2luZycpO1xuICB2YXIgYnl0ZXMgPSBuZXcgVWludDhBcnJheShhcnJheUJ1ZmZlcik7XG4gIHZhciBkb2MgPSBleHRyYWN0WE1QKGJ5dGVzLCBmdW5jdGlvbihlKSB7XG4gICAgc2NvcGUuZW1pdCgnZXJyb3InLCBlKTtcbiAgfSk7XG4gIGlmICghZG9jKSB7XG4gICAgLy8gTm8gdmFsaWQgZG9jLCBzbyB3ZSBxdWl0LlxuICAgIHJldHVybjtcbiAgfVxuICB2YXIgZ1Bhbm8gPSBnZXRPYmplY3RNZXRhKGRvYywgJ0dQYW5vJyk7XG4gIHZhciBnSW1hZ2UgPSBnZXRPYmplY3RNZXRhKGRvYywgJ0dJbWFnZScpO1xuICB2YXIgZ0F1ZGlvID0gZ2V0T2JqZWN0TWV0YShkb2MsICdHQXVkaW8nKTtcbiAgdmFyIGltYWdlID0gbWFrZUltYWdlRnJvbUJpbmFyeSgnaW1hZ2UvanBlZycsIGJ5dGVzKTtcbiAgdmFyIGF1ZGlvID0gbWFrZUF1ZGlvKGdBdWRpby5NaW1lLCBnQXVkaW8uRGF0YSk7XG5cbiAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc2V0dXBTY2VuZV8oZ1Bhbm8sIGdJbWFnZSwgaW1hZ2UsIGF1ZGlvKTtcbiAgfS5iaW5kKHRoaXMpO1xuXG59XG5cbk9kc0NvbnZlcnRlci5wcm90b3R5cGUuc2V0dXBTY2VuZV8gPSBmdW5jdGlvbihnUGFubywgZ0ltYWdlLCBsZWZ0SW1hZ2UsIGF1ZGlvKSB7XG4gIC8vIEVuc3VyZSB0aGUgcmlnaHQgaW1hZ2UgaXMgdmFsaWQuXG4gIGlmICghZ0ltYWdlLk1pbWUgfHwgIWdJbWFnZS5EYXRhKSB7XG4gICAgdGhpcy5lbWl0KCdlcnJvcicsICdObyB2YWxpZCByaWdodCBleWUgaW1hZ2UgZm91bmQgaW4gdGhlIFhNUCBtZXRhZGF0YS4gVGhpcyBtaWdodCBub3QgYmUgYSB2YWxpZCBDYXJkYm9hcmQgQ2FtZXJhIGltYWdlLicpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciByaWdodEltYWdlID0gbWFrZUltYWdlKGdJbWFnZS5NaW1lLCBnSW1hZ2UuRGF0YSk7XG4gIHJpZ2h0SW1hZ2Uub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgIGNvbnNvbGUubG9nKCdQYXJzaW5nIHRvb2sgJyArIChEYXRlLm5vdygpIC0gc3RhcnRQYXJzaW5nKSArICcgbXMnKTtcbiAgICB0aGlzLmJ1aWxkSW1hZ2VfKGxlZnRJbWFnZSwgcmlnaHRJbWFnZSwgZ1Bhbm8sIGF1ZGlvKTtcbiAgfS5iaW5kKHRoaXMpO1xufVxuXG5PZHNDb252ZXJ0ZXIucHJvdG90eXBlLmJ1aWxkSW1hZ2VfID0gZnVuY3Rpb24obGVmdEltYWdlLCByaWdodEltYWdlLCBnUGFubywgYXVkaW8pIHtcbiAgdmFyIGZ1bGxXaWR0aCA9IHBhcnNlSW50KGdQYW5vWydGdWxsUGFub1dpZHRoUGl4ZWxzJ10pO1xuICB2YXIgY3JvcExlZnQgPSBwYXJzZUludChnUGFub1snQ3JvcHBlZEFyZWFMZWZ0UGl4ZWxzJ10pO1xuICB2YXIgY3JvcFRvcCA9IHBhcnNlSW50KGdQYW5vWydDcm9wcGVkQXJlYVRvcFBpeGVscyddKTtcbiAgdmFyIGNyb3BXaWR0aCA9IHBhcnNlSW50KGdQYW5vWydDcm9wcGVkQXJlYUltYWdlV2lkdGhQaXhlbHMnXSk7XG4gIHZhciBpbml0aWFsSGVhZGluZ0RlZyA9IHBhcnNlSW50KGdQYW5vWydJbml0aWFsVmlld0hlYWRpbmdEZWdyZWVzJ10pO1xuXG4gIHZhciByYXRpbyA9IFRBUkdFVF9TSVpFIC8gZnVsbFdpZHRoO1xuXG4gIC8vIEhhbmRsZSBwYXJ0aWFsIHBhbm9zLlxuICB2YXIgc2NhbGVXaWR0aCA9IDE7XG4gIGlmIChjcm9wV2lkdGggIT0gZnVsbFdpZHRoKSB7XG4gICAgc2NhbGVXaWR0aCA9IGNyb3BXaWR0aCAvIGZ1bGxXaWR0aDtcbiAgfVxuXG4gIC8vIEEgY2FudmFzIGZvciB0aGUgb3Zlci11bmRlciByZW5kZXJpbmcuXG4gIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgY2FudmFzLndpZHRoID0gVEFSR0VUX1NJWkU7XG4gIGNhbnZhcy5oZWlnaHQgPSBUQVJHRVRfU0laRTtcblxuICAvLyBTY2FsZWQgZGltZW5zaW9ucyBmb3IgbGVmdCBhbmQgcmlnaHQgZXllIGltYWdlcy5cbiAgdmFyIGltYWdlV2lkdGggPSBUQVJHRVRfU0laRSAqIHNjYWxlV2lkdGg7XG4gIHZhciBpbWFnZUhlaWdodCA9IGxlZnRJbWFnZS5oZWlnaHQgKiByYXRpbztcblxuICAvLyBTYXZlIHRoZSBvcmlnaW5hbCBzaXplIG9mIHRoZSBtb3N0IHJlY2VudGx5IGNvbnZlcnRlZCBpbWFnZS5cbiAgdGhpcy5sYXN0V2lkdGggPSBjYW52YXMud2lkdGg7XG5cbiAgLy8gT2Zmc2V0cyBmb3Igd2hlcmUgdG8gcmVuZGVyIGVhY2ggaW1hZ2UuIEZvciBwYXJ0aWFsIHBhbm9zIChpZS4gaW1hZ2VXaWR0aCA8XG4gIC8vIFRBUkdFVF9TSVpFKSwgcmVuZGVyIHRoZSBpbWFnZSBjZW50ZXJlZC5cbiAgdmFyIG9mZnNldFggPSAoVEFSR0VUX1NJWkUgLSBpbWFnZVdpZHRoKSAvIDI7XG4gIHZhciB4ID0gTWF0aC5mbG9vcihjcm9wTGVmdCAqIHJhdGlvKSArIG9mZnNldFg7XG4gIHZhciB5ID0gTWF0aC5mbG9vcihjcm9wVG9wICogcmF0aW8pO1xuICB2YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgLy8gQ2xlYXIgdGhlIGNhbnZhcy5cbiAgY3R4LmZpbGxTdHlsZSA9ICcjMDAwJztcbiAgY3R4LmZpbGxSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG5cbiAgLy8gRHJhdyB0aGUgbGVmdCBhbmQgcmlnaHQgaW1hZ2VzIG9udG8gdGhlIGNhbnZhcy5cbiAgY3R4LmRyYXdJbWFnZShsZWZ0SW1hZ2UsIHgsIHksIGltYWdlV2lkdGgsIGltYWdlSGVpZ2h0KTtcbiAgY3R4LmRyYXdJbWFnZShyaWdodEltYWdlLCB4LCB5ICsgY2FudmFzLmhlaWdodC8yLCBpbWFnZVdpZHRoLCBpbWFnZUhlaWdodCk7XG5cbiAgdmFyIGhhbGZIZWlnaHQgPSBNYXRoLmZsb29yKGNhbnZhcy5oZWlnaHQgLyAyKTtcbiAgLy8gT2Zmc2V0cyBhcmUgdGhlIG9mZnNldHMgZm9yIGVhY2ggZXllLlxuICB2YXIgb2Zmc2V0cyA9IFswLCBoYWxmSGVpZ2h0XTtcblxuICAvLyBDYWxjdWxhdGUgaG93IG11Y2ggdG8gYmx1ciB0aGUgaW1hZ2UuXG4gIHZhciBibHVyUmFkaXVzID0gaW1hZ2VIZWlnaHQgLyAyO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgb2Zmc2V0cy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBvZmZzZXQgPSBvZmZzZXRzW2ldO1xuXG4gICAgLy8gQ2FsY3VsYXRlIHRoZSBkaW1lbnNpb25zIG9mIHRoZSBhY3R1YWwgaW1hZ2UuXG4gICAgdmFyIHRvcCA9IG9mZnNldCArIHk7XG4gICAgdmFyIGJvdHRvbSA9IG9mZnNldCArIHkgKyBpbWFnZUhlaWdodCAtIDE7XG5cbiAgICAvLyBSZXBlYXQgdGhlIHRvcCBwYXJ0LlxuICAgIHJlcGVhdEltYWdlKGNhbnZhcywgdG9wLCBvZmZzZXQpO1xuXG4gICAgLy8gUmVwZWF0IHRoZSBib3R0b20gcGFydC5cbiAgICByZXBlYXRJbWFnZShjYW52YXMsIGJvdHRvbSwgb2Zmc2V0ICsgaGFsZkhlaWdodCk7XG4gIH1cbiAgdmFyIGJsdXJDYW52YXMgPSBibHVySW1hZ2UoY2FudmFzLCBibHVyUmFkaXVzKTtcblxuICAvLyBDb3B5IHRoZSBibHVycmVkIGNhbnZhcyBvbnRvIHRoZSByZWd1bGFyIG9uZS5cbiAgY3R4LmRyYXdJbWFnZShibHVyQ2FudmFzLCAwLCAwKTtcblxuICAvLyBSZS1yZW5kZXIgdGhlIGltYWdlcyB0aGVtc2VsdmVzLlxuICBjdHguZHJhd0ltYWdlKGxlZnRJbWFnZSwgeCwgeSwgaW1hZ2VXaWR0aCwgaW1hZ2VIZWlnaHQpO1xuICBjdHguZHJhd0ltYWdlKHJpZ2h0SW1hZ2UsIHgsIHkgKyBjYW52YXMuaGVpZ2h0LzIsIGltYWdlV2lkdGgsIGltYWdlSGVpZ2h0KTtcblxuICB0aGlzLmVtaXQoJ2NvbnZlcnQnLCBjYW52YXMsIGF1ZGlvKTtcbn1cblxuZnVuY3Rpb24gcmVwZWF0SW1hZ2UoY2FudmFzLCBzdGFydFksIGVuZFkpIHtcbiAgdmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gIHZhciB5ID0gTWF0aC5taW4oc3RhcnRZLCBlbmRZKTtcbiAgdmFyIGhlaWdodCA9IE1hdGguYWJzKHN0YXJ0WSAtIGVuZFkpO1xuXG4gIC8vIFJlcGVhdCB0aGUgc3RhcnQgbGluZSB0aHJvdWdoIHRoZSB3aG9sZSByYW5nZS5cbiAgY3R4LmRyYXdJbWFnZShjYW52YXMsIDAsIHN0YXJ0WSwgY2FudmFzLndpZHRoLCAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgMCwgeSwgY2FudmFzLndpZHRoLCBoZWlnaHQpO1xuXG59XG5cbmZ1bmN0aW9uIGJsdXJJbWFnZShjYW52YXMsIHJhZGl1cykge1xuICB2YXIgc291cmNlID0gbmV3IGpzZnguU291cmNlKGNhbnZhcyk7XG5cbiAgLy92YXIgYmx1ckZpbHRlciA9IG5ldyBqc2Z4LmZpbHRlci5CcmlnaHRuZXNzKDAuNSk7XG4gIHZhciBibHVyRmlsdGVyID0gbmV3IGpzZnguZmlsdGVyLkJsdXIocmFkaXVzKTtcblxuICB2YXIgcmVuZGVyZXIgPSBuZXcganNmeC5SZW5kZXJlcigpO1xuICByZW5kZXJlci5zZXRTb3VyY2Uoc291cmNlKVxuICAgICAgLmFwcGx5RmlsdGVycyhbYmx1ckZpbHRlcl0pXG4gICAgICAucmVuZGVyKCk7XG5cbiAgcmV0dXJuIHJlbmRlcmVyLmdldENhbnZhcygpO1xufVxuXG5mdW5jdGlvbiBtYWtlSW1hZ2UobWltZSwgZGF0YSkge1xuICB2YXIgaW1nID0gbmV3IEltYWdlKCk7XG4gIGltZy5zcmMgPSAnZGF0YTonICsgbWltZSArICc7YmFzZTY0LCcgKyBkYXRhO1xuICByZXR1cm4gaW1nO1xufVxuXG5mdW5jdGlvbiBtYWtlSW1hZ2VGcm9tQmluYXJ5KG1pbWUsIGJ5dGVzKSB7XG4gIHZhciBibG9iID0gbmV3IEJsb2IoW2J5dGVzXSwge3R5cGU6IG1pbWV9KTtcbiAgdmFyIHVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG4gIHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgaW1nLnNyYyA9IHVybDtcbiAgcmV0dXJuIGltZztcbn1cblxuZnVuY3Rpb24gbWFrZUF1ZGlvKG1pbWUsIGRhdGEpIHtcbiAgcmV0dXJuICdkYXRhOicgKyBtaW1lICsgJztiYXNlNjQsJyArIGRhdGE7XG59XG5cbmZ1bmN0aW9uIGJ5dGVUb1N0cmluZyhieXRlcywgc3RhcnQsIGVuZCkge1xuICB2YXIgcyA9ICcnO1xuICBzdGFydCA9IHN0YXJ0IHx8IDA7XG4gIGVuZCA9IGVuZCB8fCBieXRlcy5sZW5ndGg7XG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgaWYgKGJ5dGVzW2ldKSB7XG4gICAgICB2YXIgYyA9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0pO1xuICAgICAgcyArPSBjO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcztcbn1cblxuZnVuY3Rpb24gZ2V0T2JqZWN0TWV0YSAoZG9jLCB0YWcpIHtcbiAgdmFyIG1ldGEgPSB7fTtcbiAgdmFyIGRlc2NyaXB0aW9ucyA9IGRvYy5xdWVyeVNlbGVjdG9yQWxsKCdEZXNjcmlwdGlvbicpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGRlc2NyaXB0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBub2RlID0gZGVzY3JpcHRpb25zW2ldO1xuICAgIGZvciAodmFyIGogaW4gbm9kZS5hdHRyaWJ1dGVzKSB7XG4gICAgICB2YXIgYXR0ciA9IG5vZGUuYXR0cmlidXRlc1tqXTtcbiAgICAgIGlmIChhdHRyLnByZWZpeCA9PSB0YWcpIHtcbiAgICAgICAgbWV0YVthdHRyLmxvY2FsTmFtZV0gPSBhdHRyLnZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbWV0YTtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdFhNUChieXRlcywgZXJyb3JDYWxsYmFjaykge1xuICB2YXIgc2VjdGlvbnMgPSBwYXJzZUpwZWcoYnl0ZXMsIHRydWUpO1xuICBpZiAoc2VjdGlvbnMgPT09IG51bGwpIHtcbiAgICBlcnJvckNhbGxiYWNrKCdObyBYTVAgbWV0YWRhdGEgZm91bmQgaW4gc3BlY2lmaWVkIGltYWdlIGZpbGUuIFRoaXMgbWlnaHQgbm90IGJlIGEgdmFsaWQgQ2FyZGJvYXJkIENhbWVyYSBpbWFnZS4nKTtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIHhtbCA9ICcnO1xuICB2YXIgdmlzaXRlZEV4dGVuZGVkID0gZmFsc2U7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc2VjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgaXNYbXAgPSB0cnVlO1xuICAgIHZhciBpc0V4dCA9IHRydWU7XG4gICAgdmFyIHNlY3Rpb24gPSBzZWN0aW9uc1tpXTtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IHNlY3Rpb24uZGF0YS5sZW5ndGg7IGorKykge1xuICAgICAgdmFyIGEgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHNlY3Rpb24uZGF0YVtqXSk7XG4gICAgICBpZiAoaXNYbXAgJiYgYSAhPSBYTVBfU0lHTkFUVVJFW2pdKSB7XG4gICAgICAgIGlzWG1wID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoaXNFeHQgJiYgYSAhPSBFWFRFTlNUSU9OX1NJR05BVFVSRVtqXSkge1xuICAgICAgICBpc0V4dCA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKCFpc0V4dCB8fCAhaXNYbXApIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGlzWG1wKSB7XG4gICAgICB2YXIgc3RyID0gYnl0ZVRvU3RyaW5nKHNlY3Rpb24uZGF0YSk7XG4gICAgICB2YXIgcmUgPSBuZXcgUmVnRXhwKCc8eDp4bXBtZXRhKFtcXFxcc1xcXFxTXSopPC94OnhtcG1ldGE+Jyk7XG4gICAgICB4bWwgPSBzdHIubWF0Y2gocmUpWzBdO1xuICAgIH1cbiAgICBlbHNlIGlmIChpc0V4dCkge1xuICAgICAgdmFyIGxlbiA9IEVYVF9QUkVGSVhfTEVOR1RIO1xuICAgICAgaWYgKHZpc2l0ZWRFeHRlbmRlZCkge1xuICAgICAgICBsZW4gKz00O1xuICAgICAgfVxuICAgICAgdmlzaXRlZEV4dGVuZGVkID0gdHJ1ZTtcbiAgICAgIHhtbCArPSBieXRlVG9TdHJpbmcoc2VjdGlvbi5kYXRhLCBsZW4pO1xuICAgIH1cbiAgfVxuICB2YXIgcGFyc2VyID0gbmV3IERPTVBhcnNlcigpO1xuICB2YXIgZG9jID0gcGFyc2VyLnBhcnNlRnJvbVN0cmluZygnPHhtbD4nICsgeG1sICsgJzwveG1sPicsICd0ZXh0L3htbCcpO1xuICByZXR1cm4gZG9jO1xufVxuXG5mdW5jdGlvbiBiaW5hcnlUb0Jhc2U2NCAoYnl0ZXMpIHtcbiAgdmFyIGI2NCA9IFtdO1xuICB2YXIgcGFnZVNpemUgPSAxMDAwMDA7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpICs9IHBhZ2VTaXplKSB7XG4gICAgYjY0LnB1c2goYnRvYShTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ5dGVzLnN1YmFycmF5KGksIGkgKyBwYWdlU2l6ZSkpKSk7XG4gIH1cbiAgcmV0dXJuIGI2NC5qb2luKCcnKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VKcGVnIChieXRlcywgcmVhZE1ldGFPbmx5KSB7XG4gIHZhciBjO1xuICB2YXIgaSA9IDA7XG4gIHZhciByZWFkID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGkgPCBieXRlcy5sZW5ndGggPyBieXRlc1tpKytdIDogLTE7XG4gIH07XG5cbiAgaWYgKHJlYWQoKSAhPSAweGZmIHx8IHJlYWQoKSAhPSBNX1NPSSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHZhciBzZWN0aW9ucyA9IFtdO1xuICB3aGlsZSgoYyA9IHJlYWQoKSkgIT0gLTEpIHtcbiAgICBpZiAoYyAhPSAweGZmKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgd2hpbGUoKGMgPSByZWFkKCkpID09IDB4ZmYpIHtcbiAgICB9XG5cbiAgICBpZiAoYyA9PSAtMSkge1xuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gICAgdmFyIG1hcmtlciA9IGM7XG4gICAgaWYgKG1hcmtlciA9PSBNX1NPUykge1xuICAgICAgLy8gTV9TT1MgaW5kaWNhdGVzIHRoYXQgaW1hZ2UgZGF0YSB3aWxsIGZvbGxvdyBhbmQgbm8gbWV0YWRhdGEgYWZ0ZXJcbiAgICAgIC8vIHRoYXQgc28gcmVhZCBhbGwgZGF0YSBhdCBvbmUgdGltZS5cbiAgICAgIGlmICghcmVhZE1ldGFPbmx5KSB7XG4gICAgICAgIHZhciBzZWN0aW9uID0ge1xuICAgICAgICAgIG1hcmtlcjogbWFya2VyLFxuICAgICAgICAgIGxlbmd0aDogLTEsXG4gICAgICAgICAgZGF0YTogYnl0ZXMuc3ViYXJyYXkoaSlcbiAgICAgICAgfTtcbiAgICAgICAgc2VjdGlvbnMucHVzaChzZWN0aW9uKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzZWN0aW9ucztcbiAgICB9XG4gICAgdmFyIGxoID0gcmVhZCgpO1xuICAgIHZhciBsbCA9IHJlYWQoKTtcbiAgICBpZiAobGggPT0gLTEgfHwgbGwgPT0gLTEpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICB2YXIgbGVuZ3RoID0gbGggPDwgOCB8IGxsO1xuICAgIGlmICghcmVhZE1ldGFPbmx5IHx8IGMgPT0gTV9BUFAxKSB7XG4gICAgICB2YXIgc2VjdGlvbiA9IHtcbiAgICAgICAgbWFya2VyOiBtYXJrZXIsXG4gICAgICAgIGxlbmd0aDogbGVuZ3RoLFxuICAgICAgICBkYXRhOiBieXRlcy5zdWJhcnJheShpLCBpICsgbGVuZ3RoIC0gMilcbiAgICAgIH07XG4gICAgICBzZWN0aW9ucy5wdXNoKHNlY3Rpb24pO1xuICAgIH1cbiAgICAvLyBNb3ZlIGkgdG8gZW5kIG9mIHNlY3Rpb24uXG4gICAgaSArPSBsZW5ndGggLSAyO1xuICB9XG4gIHJldHVybiBzZWN0aW9ucztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBPZHNDb252ZXJ0ZXI7XG4iLCIndXNlIHN0cmljdCdcblxuZXhwb3J0cy50b0J5dGVBcnJheSA9IHRvQnl0ZUFycmF5XG5leHBvcnRzLmZyb21CeXRlQXJyYXkgPSBmcm9tQnl0ZUFycmF5XG5cbnZhciBsb29rdXAgPSBbXVxudmFyIHJldkxvb2t1cCA9IFtdXG52YXIgQXJyID0gdHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnID8gVWludDhBcnJheSA6IEFycmF5XG5cbmZ1bmN0aW9uIGluaXQgKCkge1xuICB2YXIgY29kZSA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJ1xuICBmb3IgKHZhciBpID0gMCwgbGVuID0gY29kZS5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGxvb2t1cFtpXSA9IGNvZGVbaV1cbiAgICByZXZMb29rdXBbY29kZS5jaGFyQ29kZUF0KGkpXSA9IGlcbiAgfVxuXG4gIHJldkxvb2t1cFsnLScuY2hhckNvZGVBdCgwKV0gPSA2MlxuICByZXZMb29rdXBbJ18nLmNoYXJDb2RlQXQoMCldID0gNjNcbn1cblxuaW5pdCgpXG5cbmZ1bmN0aW9uIHRvQnl0ZUFycmF5IChiNjQpIHtcbiAgdmFyIGksIGosIGwsIHRtcCwgcGxhY2VIb2xkZXJzLCBhcnJcbiAgdmFyIGxlbiA9IGI2NC5sZW5ndGhcblxuICBpZiAobGVuICUgNCA+IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RyaW5nLiBMZW5ndGggbXVzdCBiZSBhIG11bHRpcGxlIG9mIDQnKVxuICB9XG5cbiAgLy8gdGhlIG51bWJlciBvZiBlcXVhbCBzaWducyAocGxhY2UgaG9sZGVycylcbiAgLy8gaWYgdGhlcmUgYXJlIHR3byBwbGFjZWhvbGRlcnMsIHRoYW4gdGhlIHR3byBjaGFyYWN0ZXJzIGJlZm9yZSBpdFxuICAvLyByZXByZXNlbnQgb25lIGJ5dGVcbiAgLy8gaWYgdGhlcmUgaXMgb25seSBvbmUsIHRoZW4gdGhlIHRocmVlIGNoYXJhY3RlcnMgYmVmb3JlIGl0IHJlcHJlc2VudCAyIGJ5dGVzXG4gIC8vIHRoaXMgaXMganVzdCBhIGNoZWFwIGhhY2sgdG8gbm90IGRvIGluZGV4T2YgdHdpY2VcbiAgcGxhY2VIb2xkZXJzID0gYjY0W2xlbiAtIDJdID09PSAnPScgPyAyIDogYjY0W2xlbiAtIDFdID09PSAnPScgPyAxIDogMFxuXG4gIC8vIGJhc2U2NCBpcyA0LzMgKyB1cCB0byB0d28gY2hhcmFjdGVycyBvZiB0aGUgb3JpZ2luYWwgZGF0YVxuICBhcnIgPSBuZXcgQXJyKGxlbiAqIDMgLyA0IC0gcGxhY2VIb2xkZXJzKVxuXG4gIC8vIGlmIHRoZXJlIGFyZSBwbGFjZWhvbGRlcnMsIG9ubHkgZ2V0IHVwIHRvIHRoZSBsYXN0IGNvbXBsZXRlIDQgY2hhcnNcbiAgbCA9IHBsYWNlSG9sZGVycyA+IDAgPyBsZW4gLSA0IDogbGVuXG5cbiAgdmFyIEwgPSAwXG5cbiAgZm9yIChpID0gMCwgaiA9IDA7IGkgPCBsOyBpICs9IDQsIGogKz0gMykge1xuICAgIHRtcCA9IChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDE4KSB8IChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA8PCAxMikgfCAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAyKV0gPDwgNikgfCByZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDMpXVxuICAgIGFycltMKytdID0gKHRtcCA+PiAxNikgJiAweEZGXG4gICAgYXJyW0wrK10gPSAodG1wID4+IDgpICYgMHhGRlxuICAgIGFycltMKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgaWYgKHBsYWNlSG9sZGVycyA9PT0gMikge1xuICAgIHRtcCA9IChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDIpIHwgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldID4+IDQpXG4gICAgYXJyW0wrK10gPSB0bXAgJiAweEZGXG4gIH0gZWxzZSBpZiAocGxhY2VIb2xkZXJzID09PSAxKSB7XG4gICAgdG1wID0gKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMTApIHwgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldIDw8IDQpIHwgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMildID4+IDIpXG4gICAgYXJyW0wrK10gPSAodG1wID4+IDgpICYgMHhGRlxuICAgIGFycltMKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIGFyclxufVxuXG5mdW5jdGlvbiB0cmlwbGV0VG9CYXNlNjQgKG51bSkge1xuICByZXR1cm4gbG9va3VwW251bSA+PiAxOCAmIDB4M0ZdICsgbG9va3VwW251bSA+PiAxMiAmIDB4M0ZdICsgbG9va3VwW251bSA+PiA2ICYgMHgzRl0gKyBsb29rdXBbbnVtICYgMHgzRl1cbn1cblxuZnVuY3Rpb24gZW5jb2RlQ2h1bmsgKHVpbnQ4LCBzdGFydCwgZW5kKSB7XG4gIHZhciB0bXBcbiAgdmFyIG91dHB1dCA9IFtdXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSArPSAzKSB7XG4gICAgdG1wID0gKHVpbnQ4W2ldIDw8IDE2KSArICh1aW50OFtpICsgMV0gPDwgOCkgKyAodWludDhbaSArIDJdKVxuICAgIG91dHB1dC5wdXNoKHRyaXBsZXRUb0Jhc2U2NCh0bXApKVxuICB9XG4gIHJldHVybiBvdXRwdXQuam9pbignJylcbn1cblxuZnVuY3Rpb24gZnJvbUJ5dGVBcnJheSAodWludDgpIHtcbiAgdmFyIHRtcFxuICB2YXIgbGVuID0gdWludDgubGVuZ3RoXG4gIHZhciBleHRyYUJ5dGVzID0gbGVuICUgMyAvLyBpZiB3ZSBoYXZlIDEgYnl0ZSBsZWZ0LCBwYWQgMiBieXRlc1xuICB2YXIgb3V0cHV0ID0gJydcbiAgdmFyIHBhcnRzID0gW11cbiAgdmFyIG1heENodW5rTGVuZ3RoID0gMTYzODMgLy8gbXVzdCBiZSBtdWx0aXBsZSBvZiAzXG5cbiAgLy8gZ28gdGhyb3VnaCB0aGUgYXJyYXkgZXZlcnkgdGhyZWUgYnl0ZXMsIHdlJ2xsIGRlYWwgd2l0aCB0cmFpbGluZyBzdHVmZiBsYXRlclxuICBmb3IgKHZhciBpID0gMCwgbGVuMiA9IGxlbiAtIGV4dHJhQnl0ZXM7IGkgPCBsZW4yOyBpICs9IG1heENodW5rTGVuZ3RoKSB7XG4gICAgcGFydHMucHVzaChlbmNvZGVDaHVuayh1aW50OCwgaSwgKGkgKyBtYXhDaHVua0xlbmd0aCkgPiBsZW4yID8gbGVuMiA6IChpICsgbWF4Q2h1bmtMZW5ndGgpKSlcbiAgfVxuXG4gIC8vIHBhZCB0aGUgZW5kIHdpdGggemVyb3MsIGJ1dCBtYWtlIHN1cmUgdG8gbm90IGZvcmdldCB0aGUgZXh0cmEgYnl0ZXNcbiAgaWYgKGV4dHJhQnl0ZXMgPT09IDEpIHtcbiAgICB0bXAgPSB1aW50OFtsZW4gLSAxXVxuICAgIG91dHB1dCArPSBsb29rdXBbdG1wID4+IDJdXG4gICAgb3V0cHV0ICs9IGxvb2t1cFsodG1wIDw8IDQpICYgMHgzRl1cbiAgICBvdXRwdXQgKz0gJz09J1xuICB9IGVsc2UgaWYgKGV4dHJhQnl0ZXMgPT09IDIpIHtcbiAgICB0bXAgPSAodWludDhbbGVuIC0gMl0gPDwgOCkgKyAodWludDhbbGVuIC0gMV0pXG4gICAgb3V0cHV0ICs9IGxvb2t1cFt0bXAgPj4gMTBdXG4gICAgb3V0cHV0ICs9IGxvb2t1cFsodG1wID4+IDQpICYgMHgzRl1cbiAgICBvdXRwdXQgKz0gbG9va3VwWyh0bXAgPDwgMikgJiAweDNGXVxuICAgIG91dHB1dCArPSAnPSdcbiAgfVxuXG4gIHBhcnRzLnB1c2gob3V0cHV0KVxuXG4gIHJldHVybiBwYXJ0cy5qb2luKCcnKVxufVxuIiwiLyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8ZmVyb3NzQGZlcm9zcy5vcmc+IDxodHRwOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuLyogZXNsaW50LWRpc2FibGUgbm8tcHJvdG8gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbnZhciBiYXNlNjQgPSByZXF1aXJlKCdiYXNlNjQtanMnKVxudmFyIGllZWU3NTQgPSByZXF1aXJlKCdpZWVlNzU0JylcbnZhciBpc0FycmF5ID0gcmVxdWlyZSgnaXNhcnJheScpXG5cbmV4cG9ydHMuQnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLlNsb3dCdWZmZXIgPSBTbG93QnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcblxuLyoqXG4gKiBJZiBgQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRgOlxuICogICA9PT0gdHJ1ZSAgICBVc2UgVWludDhBcnJheSBpbXBsZW1lbnRhdGlvbiAoZmFzdGVzdClcbiAqICAgPT09IGZhbHNlICAgVXNlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiAobW9zdCBjb21wYXRpYmxlLCBldmVuIElFNilcbiAqXG4gKiBCcm93c2VycyB0aGF0IHN1cHBvcnQgdHlwZWQgYXJyYXlzIGFyZSBJRSAxMCssIEZpcmVmb3ggNCssIENocm9tZSA3KywgU2FmYXJpIDUuMSssXG4gKiBPcGVyYSAxMS42KywgaU9TIDQuMisuXG4gKlxuICogRHVlIHRvIHZhcmlvdXMgYnJvd3NlciBidWdzLCBzb21ldGltZXMgdGhlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiB3aWxsIGJlIHVzZWQgZXZlblxuICogd2hlbiB0aGUgYnJvd3NlciBzdXBwb3J0cyB0eXBlZCBhcnJheXMuXG4gKlxuICogTm90ZTpcbiAqXG4gKiAgIC0gRmlyZWZveCA0LTI5IGxhY2tzIHN1cHBvcnQgZm9yIGFkZGluZyBuZXcgcHJvcGVydGllcyB0byBgVWludDhBcnJheWAgaW5zdGFuY2VzLFxuICogICAgIFNlZTogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9Njk1NDM4LlxuICpcbiAqICAgLSBDaHJvbWUgOS0xMCBpcyBtaXNzaW5nIHRoZSBgVHlwZWRBcnJheS5wcm90b3R5cGUuc3ViYXJyYXlgIGZ1bmN0aW9uLlxuICpcbiAqICAgLSBJRTEwIGhhcyBhIGJyb2tlbiBgVHlwZWRBcnJheS5wcm90b3R5cGUuc3ViYXJyYXlgIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgYXJyYXlzIG9mXG4gKiAgICAgaW5jb3JyZWN0IGxlbmd0aCBpbiBzb21lIHNpdHVhdGlvbnMuXG5cbiAqIFdlIGRldGVjdCB0aGVzZSBidWdneSBicm93c2VycyBhbmQgc2V0IGBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVGAgdG8gYGZhbHNlYCBzbyB0aGV5XG4gKiBnZXQgdGhlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiwgd2hpY2ggaXMgc2xvd2VyIGJ1dCBiZWhhdmVzIGNvcnJlY3RseS5cbiAqL1xuQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgPSBnbG9iYWwuVFlQRURfQVJSQVlfU1VQUE9SVCAhPT0gdW5kZWZpbmVkXG4gID8gZ2xvYmFsLlRZUEVEX0FSUkFZX1NVUFBPUlRcbiAgOiB0eXBlZEFycmF5U3VwcG9ydCgpXG5cbi8qXG4gKiBFeHBvcnQga01heExlbmd0aCBhZnRlciB0eXBlZCBhcnJheSBzdXBwb3J0IGlzIGRldGVybWluZWQuXG4gKi9cbmV4cG9ydHMua01heExlbmd0aCA9IGtNYXhMZW5ndGgoKVxuXG5mdW5jdGlvbiB0eXBlZEFycmF5U3VwcG9ydCAoKSB7XG4gIHRyeSB7XG4gICAgdmFyIGFyciA9IG5ldyBVaW50OEFycmF5KDEpXG4gICAgYXJyLmZvbyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIDQyIH1cbiAgICByZXR1cm4gYXJyLmZvbygpID09PSA0MiAmJiAvLyB0eXBlZCBhcnJheSBpbnN0YW5jZXMgY2FuIGJlIGF1Z21lbnRlZFxuICAgICAgICB0eXBlb2YgYXJyLnN1YmFycmF5ID09PSAnZnVuY3Rpb24nICYmIC8vIGNocm9tZSA5LTEwIGxhY2sgYHN1YmFycmF5YFxuICAgICAgICBhcnIuc3ViYXJyYXkoMSwgMSkuYnl0ZUxlbmd0aCA9PT0gMCAvLyBpZTEwIGhhcyBicm9rZW4gYHN1YmFycmF5YFxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuZnVuY3Rpb24ga01heExlbmd0aCAoKSB7XG4gIHJldHVybiBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVFxuICAgID8gMHg3ZmZmZmZmZlxuICAgIDogMHgzZmZmZmZmZlxufVxuXG5mdW5jdGlvbiBjcmVhdGVCdWZmZXIgKHRoYXQsIGxlbmd0aCkge1xuICBpZiAoa01heExlbmd0aCgpIDwgbGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0ludmFsaWQgdHlwZWQgYXJyYXkgbGVuZ3RoJylcbiAgfVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZSwgZm9yIGJlc3QgcGVyZm9ybWFuY2VcbiAgICB0aGF0ID0gbmV3IFVpbnQ4QXJyYXkobGVuZ3RoKVxuICAgIHRoYXQuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICB9IGVsc2Uge1xuICAgIC8vIEZhbGxiYWNrOiBSZXR1cm4gYW4gb2JqZWN0IGluc3RhbmNlIG9mIHRoZSBCdWZmZXIgY2xhc3NcbiAgICBpZiAodGhhdCA9PT0gbnVsbCkge1xuICAgICAgdGhhdCA9IG5ldyBCdWZmZXIobGVuZ3RoKVxuICAgIH1cbiAgICB0aGF0Lmxlbmd0aCA9IGxlbmd0aFxuICB9XG5cbiAgcmV0dXJuIHRoYXRcbn1cblxuLyoqXG4gKiBUaGUgQnVmZmVyIGNvbnN0cnVjdG9yIHJldHVybnMgaW5zdGFuY2VzIG9mIGBVaW50OEFycmF5YCB0aGF0IGhhdmUgdGhlaXJcbiAqIHByb3RvdHlwZSBjaGFuZ2VkIHRvIGBCdWZmZXIucHJvdG90eXBlYC4gRnVydGhlcm1vcmUsIGBCdWZmZXJgIGlzIGEgc3ViY2xhc3Mgb2ZcbiAqIGBVaW50OEFycmF5YCwgc28gdGhlIHJldHVybmVkIGluc3RhbmNlcyB3aWxsIGhhdmUgYWxsIHRoZSBub2RlIGBCdWZmZXJgIG1ldGhvZHNcbiAqIGFuZCB0aGUgYFVpbnQ4QXJyYXlgIG1ldGhvZHMuIFNxdWFyZSBicmFja2V0IG5vdGF0aW9uIHdvcmtzIGFzIGV4cGVjdGVkIC0tIGl0XG4gKiByZXR1cm5zIGEgc2luZ2xlIG9jdGV0LlxuICpcbiAqIFRoZSBgVWludDhBcnJheWAgcHJvdG90eXBlIHJlbWFpbnMgdW5tb2RpZmllZC5cbiAqL1xuXG5mdW5jdGlvbiBCdWZmZXIgKGFyZywgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIGlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgJiYgISh0aGlzIGluc3RhbmNlb2YgQnVmZmVyKSkge1xuICAgIHJldHVybiBuZXcgQnVmZmVyKGFyZywgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgLy8gQ29tbW9uIGNhc2UuXG4gIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykge1xuICAgIGlmICh0eXBlb2YgZW5jb2RpbmdPck9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ0lmIGVuY29kaW5nIGlzIHNwZWNpZmllZCB0aGVuIHRoZSBmaXJzdCBhcmd1bWVudCBtdXN0IGJlIGEgc3RyaW5nJ1xuICAgICAgKVxuICAgIH1cbiAgICByZXR1cm4gYWxsb2NVbnNhZmUodGhpcywgYXJnKVxuICB9XG4gIHJldHVybiBmcm9tKHRoaXMsIGFyZywgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxufVxuXG5CdWZmZXIucG9vbFNpemUgPSA4MTkyIC8vIG5vdCB1c2VkIGJ5IHRoaXMgaW1wbGVtZW50YXRpb25cblxuLy8gVE9ETzogTGVnYWN5LCBub3QgbmVlZGVkIGFueW1vcmUuIFJlbW92ZSBpbiBuZXh0IG1ham9yIHZlcnNpb24uXG5CdWZmZXIuX2F1Z21lbnQgPSBmdW5jdGlvbiAoYXJyKSB7XG4gIGFyci5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIHJldHVybiBhcnJcbn1cblxuZnVuY3Rpb24gZnJvbSAodGhhdCwgdmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1widmFsdWVcIiBhcmd1bWVudCBtdXN0IG5vdCBiZSBhIG51bWJlcicpXG4gIH1cblxuICBpZiAodHlwZW9mIEFycmF5QnVmZmVyICE9PSAndW5kZWZpbmVkJyAmJiB2YWx1ZSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUJ1ZmZlcih0aGF0LCB2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gZnJvbVN0cmluZyh0aGF0LCB2YWx1ZSwgZW5jb2RpbmdPck9mZnNldClcbiAgfVxuXG4gIHJldHVybiBmcm9tT2JqZWN0KHRoYXQsIHZhbHVlKVxufVxuXG4vKipcbiAqIEZ1bmN0aW9uYWxseSBlcXVpdmFsZW50IHRvIEJ1ZmZlcihhcmcsIGVuY29kaW5nKSBidXQgdGhyb3dzIGEgVHlwZUVycm9yXG4gKiBpZiB2YWx1ZSBpcyBhIG51bWJlci5cbiAqIEJ1ZmZlci5mcm9tKHN0clssIGVuY29kaW5nXSlcbiAqIEJ1ZmZlci5mcm9tKGFycmF5KVxuICogQnVmZmVyLmZyb20oYnVmZmVyKVxuICogQnVmZmVyLmZyb20oYXJyYXlCdWZmZXJbLCBieXRlT2Zmc2V0WywgbGVuZ3RoXV0pXG4gKiovXG5CdWZmZXIuZnJvbSA9IGZ1bmN0aW9uICh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBmcm9tKG51bGwsIHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG59XG5cbmlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICBCdWZmZXIucHJvdG90eXBlLl9fcHJvdG9fXyA9IFVpbnQ4QXJyYXkucHJvdG90eXBlXG4gIEJ1ZmZlci5fX3Byb3RvX18gPSBVaW50OEFycmF5XG4gIGlmICh0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wuc3BlY2llcyAmJlxuICAgICAgQnVmZmVyW1N5bWJvbC5zcGVjaWVzXSA9PT0gQnVmZmVyKSB7XG4gICAgLy8gRml4IHN1YmFycmF5KCkgaW4gRVMyMDE2LiBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL3B1bGwvOTdcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLCBTeW1ib2wuc3BlY2llcywge1xuICAgICAgdmFsdWU6IG51bGwsXG4gICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KVxuICB9XG59XG5cbmZ1bmN0aW9uIGFzc2VydFNpemUgKHNpemUpIHtcbiAgaWYgKHR5cGVvZiBzaXplICE9PSAnbnVtYmVyJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wic2l6ZVwiIGFyZ3VtZW50IG11c3QgYmUgYSBudW1iZXInKVxuICB9XG59XG5cbmZ1bmN0aW9uIGFsbG9jICh0aGF0LCBzaXplLCBmaWxsLCBlbmNvZGluZykge1xuICBhc3NlcnRTaXplKHNpemUpXG4gIGlmIChzaXplIDw9IDApIHtcbiAgICByZXR1cm4gY3JlYXRlQnVmZmVyKHRoYXQsIHNpemUpXG4gIH1cbiAgaWYgKGZpbGwgIT09IHVuZGVmaW5lZCkge1xuICAgIC8vIE9ubHkgcGF5IGF0dGVudGlvbiB0byBlbmNvZGluZyBpZiBpdCdzIGEgc3RyaW5nLiBUaGlzXG4gICAgLy8gcHJldmVudHMgYWNjaWRlbnRhbGx5IHNlbmRpbmcgaW4gYSBudW1iZXIgdGhhdCB3b3VsZFxuICAgIC8vIGJlIGludGVycHJldHRlZCBhcyBhIHN0YXJ0IG9mZnNldC5cbiAgICByZXR1cm4gdHlwZW9mIGVuY29kaW5nID09PSAnc3RyaW5nJ1xuICAgICAgPyBjcmVhdGVCdWZmZXIodGhhdCwgc2l6ZSkuZmlsbChmaWxsLCBlbmNvZGluZylcbiAgICAgIDogY3JlYXRlQnVmZmVyKHRoYXQsIHNpemUpLmZpbGwoZmlsbClcbiAgfVxuICByZXR1cm4gY3JlYXRlQnVmZmVyKHRoYXQsIHNpemUpXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBmaWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICogYWxsb2Moc2l6ZVssIGZpbGxbLCBlbmNvZGluZ11dKVxuICoqL1xuQnVmZmVyLmFsbG9jID0gZnVuY3Rpb24gKHNpemUsIGZpbGwsIGVuY29kaW5nKSB7XG4gIHJldHVybiBhbGxvYyhudWxsLCBzaXplLCBmaWxsLCBlbmNvZGluZylcbn1cblxuZnVuY3Rpb24gYWxsb2NVbnNhZmUgKHRoYXQsIHNpemUpIHtcbiAgYXNzZXJ0U2l6ZShzaXplKVxuICB0aGF0ID0gY3JlYXRlQnVmZmVyKHRoYXQsIHNpemUgPCAwID8gMCA6IGNoZWNrZWQoc2l6ZSkgfCAwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgIHRoYXRbaV0gPSAwXG4gICAgfVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbi8qKlxuICogRXF1aXZhbGVudCB0byBCdWZmZXIobnVtKSwgYnkgZGVmYXVsdCBjcmVhdGVzIGEgbm9uLXplcm8tZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqICovXG5CdWZmZXIuYWxsb2NVbnNhZmUgPSBmdW5jdGlvbiAoc2l6ZSkge1xuICByZXR1cm4gYWxsb2NVbnNhZmUobnVsbCwgc2l6ZSlcbn1cbi8qKlxuICogRXF1aXZhbGVudCB0byBTbG93QnVmZmVyKG51bSksIGJ5IGRlZmF1bHQgY3JlYXRlcyBhIG5vbi16ZXJvLWZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKi9cbkJ1ZmZlci5hbGxvY1Vuc2FmZVNsb3cgPSBmdW5jdGlvbiAoc2l6ZSkge1xuICByZXR1cm4gYWxsb2NVbnNhZmUobnVsbCwgc2l6ZSlcbn1cblxuZnVuY3Rpb24gZnJvbVN0cmluZyAodGhhdCwgc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAodHlwZW9mIGVuY29kaW5nICE9PSAnc3RyaW5nJyB8fCBlbmNvZGluZyA9PT0gJycpIHtcbiAgICBlbmNvZGluZyA9ICd1dGY4J1xuICB9XG5cbiAgaWYgKCFCdWZmZXIuaXNFbmNvZGluZyhlbmNvZGluZykpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImVuY29kaW5nXCIgbXVzdCBiZSBhIHZhbGlkIHN0cmluZyBlbmNvZGluZycpXG4gIH1cblxuICB2YXIgbGVuZ3RoID0gYnl0ZUxlbmd0aChzdHJpbmcsIGVuY29kaW5nKSB8IDBcbiAgdGhhdCA9IGNyZWF0ZUJ1ZmZlcih0aGF0LCBsZW5ndGgpXG5cbiAgdGhhdC53cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlMaWtlICh0aGF0LCBhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB0aGF0ID0gY3JlYXRlQnVmZmVyKHRoYXQsIGxlbmd0aClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIHRoYXRbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheUJ1ZmZlciAodGhhdCwgYXJyYXksIGJ5dGVPZmZzZXQsIGxlbmd0aCkge1xuICBhcnJheS5ieXRlTGVuZ3RoIC8vIHRoaXMgdGhyb3dzIGlmIGBhcnJheWAgaXMgbm90IGEgdmFsaWQgQXJyYXlCdWZmZXJcblxuICBpZiAoYnl0ZU9mZnNldCA8IDAgfHwgYXJyYXkuYnl0ZUxlbmd0aCA8IGJ5dGVPZmZzZXQpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXFwnb2Zmc2V0XFwnIGlzIG91dCBvZiBib3VuZHMnKVxuICB9XG5cbiAgaWYgKGFycmF5LmJ5dGVMZW5ndGggPCBieXRlT2Zmc2V0ICsgKGxlbmd0aCB8fCAwKSkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdcXCdsZW5ndGhcXCcgaXMgb3V0IG9mIGJvdW5kcycpXG4gIH1cblxuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBhcnJheSA9IG5ldyBVaW50OEFycmF5KGFycmF5LCBieXRlT2Zmc2V0KVxuICB9IGVsc2Uge1xuICAgIGFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXksIGJ5dGVPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlLCBmb3IgYmVzdCBwZXJmb3JtYW5jZVxuICAgIHRoYXQgPSBhcnJheVxuICAgIHRoYXQuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICB9IGVsc2Uge1xuICAgIC8vIEZhbGxiYWNrOiBSZXR1cm4gYW4gb2JqZWN0IGluc3RhbmNlIG9mIHRoZSBCdWZmZXIgY2xhc3NcbiAgICB0aGF0ID0gZnJvbUFycmF5TGlrZSh0aGF0LCBhcnJheSlcbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBmcm9tT2JqZWN0ICh0aGF0LCBvYmopIHtcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihvYmopKSB7XG4gICAgdmFyIGxlbiA9IGNoZWNrZWQob2JqLmxlbmd0aCkgfCAwXG4gICAgdGhhdCA9IGNyZWF0ZUJ1ZmZlcih0aGF0LCBsZW4pXG5cbiAgICBpZiAodGhhdC5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB0aGF0XG4gICAgfVxuXG4gICAgb2JqLmNvcHkodGhhdCwgMCwgMCwgbGVuKVxuICAgIHJldHVybiB0aGF0XG4gIH1cblxuICBpZiAob2JqKSB7XG4gICAgaWYgKCh0eXBlb2YgQXJyYXlCdWZmZXIgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgIG9iai5idWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikgfHwgJ2xlbmd0aCcgaW4gb2JqKSB7XG4gICAgICBpZiAodHlwZW9mIG9iai5sZW5ndGggIT09ICdudW1iZXInIHx8IGlzbmFuKG9iai5sZW5ndGgpKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVCdWZmZXIodGhhdCwgMClcbiAgICAgIH1cbiAgICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKHRoYXQsIG9iailcbiAgICB9XG5cbiAgICBpZiAob2JqLnR5cGUgPT09ICdCdWZmZXInICYmIGlzQXJyYXkob2JqLmRhdGEpKSB7XG4gICAgICByZXR1cm4gZnJvbUFycmF5TGlrZSh0aGF0LCBvYmouZGF0YSlcbiAgICB9XG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKCdGaXJzdCBhcmd1bWVudCBtdXN0IGJlIGEgc3RyaW5nLCBCdWZmZXIsIEFycmF5QnVmZmVyLCBBcnJheSwgb3IgYXJyYXktbGlrZSBvYmplY3QuJylcbn1cblxuZnVuY3Rpb24gY2hlY2tlZCAobGVuZ3RoKSB7XG4gIC8vIE5vdGU6IGNhbm5vdCB1c2UgYGxlbmd0aCA8IGtNYXhMZW5ndGhgIGhlcmUgYmVjYXVzZSB0aGF0IGZhaWxzIHdoZW5cbiAgLy8gbGVuZ3RoIGlzIE5hTiAod2hpY2ggaXMgb3RoZXJ3aXNlIGNvZXJjZWQgdG8gemVyby4pXG4gIGlmIChsZW5ndGggPj0ga01heExlbmd0aCgpKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gYWxsb2NhdGUgQnVmZmVyIGxhcmdlciB0aGFuIG1heGltdW0gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgJ3NpemU6IDB4JyArIGtNYXhMZW5ndGgoKS50b1N0cmluZygxNikgKyAnIGJ5dGVzJylcbiAgfVxuICByZXR1cm4gbGVuZ3RoIHwgMFxufVxuXG5mdW5jdGlvbiBTbG93QnVmZmVyIChsZW5ndGgpIHtcbiAgaWYgKCtsZW5ndGggIT0gbGVuZ3RoKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZXFlcWVxXG4gICAgbGVuZ3RoID0gMFxuICB9XG4gIHJldHVybiBCdWZmZXIuYWxsb2MoK2xlbmd0aClcbn1cblxuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gaXNCdWZmZXIgKGIpIHtcbiAgcmV0dXJuICEhKGIgIT0gbnVsbCAmJiBiLl9pc0J1ZmZlcilcbn1cblxuQnVmZmVyLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlIChhLCBiKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGEpIHx8ICFCdWZmZXIuaXNCdWZmZXIoYikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgbXVzdCBiZSBCdWZmZXJzJylcbiAgfVxuXG4gIGlmIChhID09PSBiKSByZXR1cm4gMFxuXG4gIHZhciB4ID0gYS5sZW5ndGhcbiAgdmFyIHkgPSBiLmxlbmd0aFxuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBNYXRoLm1pbih4LCB5KTsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKGFbaV0gIT09IGJbaV0pIHtcbiAgICAgIHggPSBhW2ldXG4gICAgICB5ID0gYltpXVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbkJ1ZmZlci5pc0VuY29kaW5nID0gZnVuY3Rpb24gaXNFbmNvZGluZyAoZW5jb2RpbmcpIHtcbiAgc3dpdGNoIChTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgIGNhc2UgJ3Jhdyc6XG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbkJ1ZmZlci5jb25jYXQgPSBmdW5jdGlvbiBjb25jYXQgKGxpc3QsIGxlbmd0aCkge1xuICBpZiAoIWlzQXJyYXkobGlzdCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RcIiBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMnKVxuICB9XG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5hbGxvYygwKVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZW5ndGggKz0gbGlzdFtpXS5sZW5ndGhcbiAgICB9XG4gIH1cblxuICB2YXIgYnVmZmVyID0gQnVmZmVyLmFsbG9jVW5zYWZlKGxlbmd0aClcbiAgdmFyIHBvcyA9IDBcbiAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgYnVmID0gbGlzdFtpXVxuICAgIGlmICghQnVmZmVyLmlzQnVmZmVyKGJ1ZikpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wibGlzdFwiIGFyZ3VtZW50IG11c3QgYmUgYW4gQXJyYXkgb2YgQnVmZmVycycpXG4gICAgfVxuICAgIGJ1Zi5jb3B5KGJ1ZmZlciwgcG9zKVxuICAgIHBvcyArPSBidWYubGVuZ3RoXG4gIH1cbiAgcmV0dXJuIGJ1ZmZlclxufVxuXG5mdW5jdGlvbiBieXRlTGVuZ3RoIChzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIoc3RyaW5nKSkge1xuICAgIHJldHVybiBzdHJpbmcubGVuZ3RoXG4gIH1cbiAgaWYgKHR5cGVvZiBBcnJheUJ1ZmZlciAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIEFycmF5QnVmZmVyLmlzVmlldyA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgKEFycmF5QnVmZmVyLmlzVmlldyhzdHJpbmcpIHx8IHN0cmluZyBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSkge1xuICAgIHJldHVybiBzdHJpbmcuYnl0ZUxlbmd0aFxuICB9XG4gIGlmICh0eXBlb2Ygc3RyaW5nICE9PSAnc3RyaW5nJykge1xuICAgIHN0cmluZyA9ICcnICsgc3RyaW5nXG4gIH1cblxuICB2YXIgbGVuID0gc3RyaW5nLmxlbmd0aFxuICBpZiAobGVuID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIFVzZSBhIGZvciBsb29wIHRvIGF2b2lkIHJlY3Vyc2lvblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgIC8vIERlcHJlY2F0ZWRcbiAgICAgIGNhc2UgJ3Jhdyc6XG4gICAgICBjYXNlICdyYXdzJzpcbiAgICAgICAgcmV0dXJuIGxlblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICBjYXNlIHVuZGVmaW5lZDpcbiAgICAgICAgcmV0dXJuIHV0ZjhUb0J5dGVzKHN0cmluZykubGVuZ3RoXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gbGVuICogMlxuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGxlbiA+Pj4gMVxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgcmV0dXJuIHV0ZjhUb0J5dGVzKHN0cmluZykubGVuZ3RoIC8vIGFzc3VtZSB1dGY4XG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5CdWZmZXIuYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGhcblxuZnVuY3Rpb24gc2xvd1RvU3RyaW5nIChlbmNvZGluZywgc3RhcnQsIGVuZCkge1xuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuXG4gIC8vIE5vIG5lZWQgdG8gdmVyaWZ5IHRoYXQgXCJ0aGlzLmxlbmd0aCA8PSBNQVhfVUlOVDMyXCIgc2luY2UgaXQncyBhIHJlYWQtb25seVxuICAvLyBwcm9wZXJ0eSBvZiBhIHR5cGVkIGFycmF5LlxuXG4gIC8vIFRoaXMgYmVoYXZlcyBuZWl0aGVyIGxpa2UgU3RyaW5nIG5vciBVaW50OEFycmF5IGluIHRoYXQgd2Ugc2V0IHN0YXJ0L2VuZFxuICAvLyB0byB0aGVpciB1cHBlci9sb3dlciBib3VuZHMgaWYgdGhlIHZhbHVlIHBhc3NlZCBpcyBvdXQgb2YgcmFuZ2UuXG4gIC8vIHVuZGVmaW5lZCBpcyBoYW5kbGVkIHNwZWNpYWxseSBhcyBwZXIgRUNNQS0yNjIgNnRoIEVkaXRpb24sXG4gIC8vIFNlY3Rpb24gMTMuMy4zLjcgUnVudGltZSBTZW1hbnRpY3M6IEtleWVkQmluZGluZ0luaXRpYWxpemF0aW9uLlxuICBpZiAoc3RhcnQgPT09IHVuZGVmaW5lZCB8fCBzdGFydCA8IDApIHtcbiAgICBzdGFydCA9IDBcbiAgfVxuICAvLyBSZXR1cm4gZWFybHkgaWYgc3RhcnQgPiB0aGlzLmxlbmd0aC4gRG9uZSBoZXJlIHRvIHByZXZlbnQgcG90ZW50aWFsIHVpbnQzMlxuICAvLyBjb2VyY2lvbiBmYWlsIGJlbG93LlxuICBpZiAoc3RhcnQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgaWYgKGVuZCA9PT0gdW5kZWZpbmVkIHx8IGVuZCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgfVxuXG4gIGlmIChlbmQgPD0gMCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgLy8gRm9yY2UgY29lcnNpb24gdG8gdWludDMyLiBUaGlzIHdpbGwgYWxzbyBjb2VyY2UgZmFsc2V5L05hTiB2YWx1ZXMgdG8gMC5cbiAgZW5kID4+Pj0gMFxuICBzdGFydCA+Pj49IDBcblxuICBpZiAoZW5kIDw9IHN0YXJ0KSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9ICd1dGY4J1xuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGJpbmFyeVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdXRmMTZsZVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9IChlbmNvZGluZyArICcnKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG4vLyBUaGUgcHJvcGVydHkgaXMgdXNlZCBieSBgQnVmZmVyLmlzQnVmZmVyYCBhbmQgYGlzLWJ1ZmZlcmAgKGluIFNhZmFyaSA1LTcpIHRvIGRldGVjdFxuLy8gQnVmZmVyIGluc3RhbmNlcy5cbkJ1ZmZlci5wcm90b3R5cGUuX2lzQnVmZmVyID0gdHJ1ZVxuXG5mdW5jdGlvbiBzd2FwIChiLCBuLCBtKSB7XG4gIHZhciBpID0gYltuXVxuICBiW25dID0gYlttXVxuICBiW21dID0gaVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXAxNiA9IGZ1bmN0aW9uIHN3YXAxNiAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgMiAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgMTYtYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gMikge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDEpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwMzIgPSBmdW5jdGlvbiBzd2FwMzIgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDQgIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDMyLWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDQpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyAzKVxuICAgIHN3YXAodGhpcywgaSArIDEsIGkgKyAyKVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aCB8IDBcbiAgaWYgKGxlbmd0aCA9PT0gMCkgcmV0dXJuICcnXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIDAsIGxlbmd0aClcbiAgcmV0dXJuIHNsb3dUb1N0cmluZy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24gZXF1YWxzIChiKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyJylcbiAgaWYgKHRoaXMgPT09IGIpIHJldHVybiB0cnVlXG4gIHJldHVybiBCdWZmZXIuY29tcGFyZSh0aGlzLCBiKSA9PT0gMFxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluc3BlY3QgPSBmdW5jdGlvbiBpbnNwZWN0ICgpIHtcbiAgdmFyIHN0ciA9ICcnXG4gIHZhciBtYXggPSBleHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTXG4gIGlmICh0aGlzLmxlbmd0aCA+IDApIHtcbiAgICBzdHIgPSB0aGlzLnRvU3RyaW5nKCdoZXgnLCAwLCBtYXgpLm1hdGNoKC8uezJ9L2cpLmpvaW4oJyAnKVxuICAgIGlmICh0aGlzLmxlbmd0aCA+IG1heCkgc3RyICs9ICcgLi4uICdcbiAgfVxuICByZXR1cm4gJzxCdWZmZXIgJyArIHN0ciArICc+J1xufVxuXG5CdWZmZXIucHJvdG90eXBlLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlICh0YXJnZXQsIHN0YXJ0LCBlbmQsIHRoaXNTdGFydCwgdGhpc0VuZCkge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0YXJnZXQpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIH1cblxuICBpZiAoc3RhcnQgPT09IHVuZGVmaW5lZCkge1xuICAgIHN0YXJ0ID0gMFxuICB9XG4gIGlmIChlbmQgPT09IHVuZGVmaW5lZCkge1xuICAgIGVuZCA9IHRhcmdldCA/IHRhcmdldC5sZW5ndGggOiAwXG4gIH1cbiAgaWYgKHRoaXNTdGFydCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpc1N0YXJ0ID0gMFxuICB9XG4gIGlmICh0aGlzRW5kID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzRW5kID0gdGhpcy5sZW5ndGhcbiAgfVxuXG4gIGlmIChzdGFydCA8IDAgfHwgZW5kID4gdGFyZ2V0Lmxlbmd0aCB8fCB0aGlzU3RhcnQgPCAwIHx8IHRoaXNFbmQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdvdXQgb2YgcmFuZ2UgaW5kZXgnKVxuICB9XG5cbiAgaWYgKHRoaXNTdGFydCA+PSB0aGlzRW5kICYmIHN0YXJ0ID49IGVuZCkge1xuICAgIHJldHVybiAwXG4gIH1cbiAgaWYgKHRoaXNTdGFydCA+PSB0aGlzRW5kKSB7XG4gICAgcmV0dXJuIC0xXG4gIH1cbiAgaWYgKHN0YXJ0ID49IGVuZCkge1xuICAgIHJldHVybiAxXG4gIH1cblxuICBzdGFydCA+Pj49IDBcbiAgZW5kID4+Pj0gMFxuICB0aGlzU3RhcnQgPj4+PSAwXG4gIHRoaXNFbmQgPj4+PSAwXG5cbiAgaWYgKHRoaXMgPT09IHRhcmdldCkgcmV0dXJuIDBcblxuICB2YXIgeCA9IHRoaXNFbmQgLSB0aGlzU3RhcnRcbiAgdmFyIHkgPSBlbmQgLSBzdGFydFxuICB2YXIgbGVuID0gTWF0aC5taW4oeCwgeSlcblxuICB2YXIgdGhpc0NvcHkgPSB0aGlzLnNsaWNlKHRoaXNTdGFydCwgdGhpc0VuZClcbiAgdmFyIHRhcmdldENvcHkgPSB0YXJnZXQuc2xpY2Uoc3RhcnQsIGVuZClcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKHRoaXNDb3B5W2ldICE9PSB0YXJnZXRDb3B5W2ldKSB7XG4gICAgICB4ID0gdGhpc0NvcHlbaV1cbiAgICAgIHkgPSB0YXJnZXRDb3B5W2ldXG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIGlmICh4IDwgeSkgcmV0dXJuIC0xXG4gIGlmICh5IDwgeCkgcmV0dXJuIDFcbiAgcmV0dXJuIDBcbn1cblxuZnVuY3Rpb24gYXJyYXlJbmRleE9mIChhcnIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgdmFyIGluZGV4U2l6ZSA9IDFcbiAgdmFyIGFyckxlbmd0aCA9IGFyci5sZW5ndGhcbiAgdmFyIHZhbExlbmd0aCA9IHZhbC5sZW5ndGhcblxuICBpZiAoZW5jb2RpbmcgIT09IHVuZGVmaW5lZCkge1xuICAgIGVuY29kaW5nID0gU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgaWYgKGVuY29kaW5nID09PSAndWNzMicgfHwgZW5jb2RpbmcgPT09ICd1Y3MtMicgfHxcbiAgICAgICAgZW5jb2RpbmcgPT09ICd1dGYxNmxlJyB8fCBlbmNvZGluZyA9PT0gJ3V0Zi0xNmxlJykge1xuICAgICAgaWYgKGFyci5sZW5ndGggPCAyIHx8IHZhbC5sZW5ndGggPCAyKSB7XG4gICAgICAgIHJldHVybiAtMVxuICAgICAgfVxuICAgICAgaW5kZXhTaXplID0gMlxuICAgICAgYXJyTGVuZ3RoIC89IDJcbiAgICAgIHZhbExlbmd0aCAvPSAyXG4gICAgICBieXRlT2Zmc2V0IC89IDJcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZWFkIChidWYsIGkpIHtcbiAgICBpZiAoaW5kZXhTaXplID09PSAxKSB7XG4gICAgICByZXR1cm4gYnVmW2ldXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBidWYucmVhZFVJbnQxNkJFKGkgKiBpbmRleFNpemUpXG4gICAgfVxuICB9XG5cbiAgdmFyIGZvdW5kSW5kZXggPSAtMVxuICBmb3IgKHZhciBpID0gMDsgYnl0ZU9mZnNldCArIGkgPCBhcnJMZW5ndGg7IGkrKykge1xuICAgIGlmIChyZWFkKGFyciwgYnl0ZU9mZnNldCArIGkpID09PSByZWFkKHZhbCwgZm91bmRJbmRleCA9PT0gLTEgPyAwIDogaSAtIGZvdW5kSW5kZXgpKSB7XG4gICAgICBpZiAoZm91bmRJbmRleCA9PT0gLTEpIGZvdW5kSW5kZXggPSBpXG4gICAgICBpZiAoaSAtIGZvdW5kSW5kZXggKyAxID09PSB2YWxMZW5ndGgpIHJldHVybiAoYnl0ZU9mZnNldCArIGZvdW5kSW5kZXgpICogaW5kZXhTaXplXG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChmb3VuZEluZGV4ICE9PSAtMSkgaSAtPSBpIC0gZm91bmRJbmRleFxuICAgICAgZm91bmRJbmRleCA9IC0xXG4gICAgfVxuICB9XG4gIHJldHVybiAtMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiBpbmRleE9mICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIGlmICh0eXBlb2YgYnl0ZU9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbmNvZGluZyA9IGJ5dGVPZmZzZXRcbiAgICBieXRlT2Zmc2V0ID0gMFxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPiAweDdmZmZmZmZmKSB7XG4gICAgYnl0ZU9mZnNldCA9IDB4N2ZmZmZmZmZcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0IDwgLTB4ODAwMDAwMDApIHtcbiAgICBieXRlT2Zmc2V0ID0gLTB4ODAwMDAwMDBcbiAgfVxuICBieXRlT2Zmc2V0ID4+PSAwXG5cbiAgaWYgKHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4gLTFcbiAgaWYgKGJ5dGVPZmZzZXQgPj0gdGhpcy5sZW5ndGgpIHJldHVybiAtMVxuXG4gIC8vIE5lZ2F0aXZlIG9mZnNldHMgc3RhcnQgZnJvbSB0aGUgZW5kIG9mIHRoZSBidWZmZXJcbiAgaWYgKGJ5dGVPZmZzZXQgPCAwKSBieXRlT2Zmc2V0ID0gTWF0aC5tYXgodGhpcy5sZW5ndGggKyBieXRlT2Zmc2V0LCAwKVxuXG4gIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgIHZhbCA9IEJ1ZmZlci5mcm9tKHZhbCwgZW5jb2RpbmcpXG4gIH1cblxuICBpZiAoQnVmZmVyLmlzQnVmZmVyKHZhbCkpIHtcbiAgICAvLyBzcGVjaWFsIGNhc2U6IGxvb2tpbmcgZm9yIGVtcHR5IHN0cmluZy9idWZmZXIgYWx3YXlzIGZhaWxzXG4gICAgaWYgKHZhbC5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiAtMVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKHRoaXMsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpXG4gIH1cbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUICYmIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mLmNhbGwodGhpcywgdmFsLCBieXRlT2Zmc2V0KVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKHRoaXMsIFsgdmFsIF0sIGJ5dGVPZmZzZXQsIGVuY29kaW5nKVxuICB9XG5cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcigndmFsIG11c3QgYmUgc3RyaW5nLCBudW1iZXIgb3IgQnVmZmVyJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbmNsdWRlcyA9IGZ1bmN0aW9uIGluY2x1ZGVzICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiB0aGlzLmluZGV4T2YodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykgIT09IC0xXG59XG5cbmZ1bmN0aW9uIGhleFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgb2Zmc2V0ID0gTnVtYmVyKG9mZnNldCkgfHwgMFxuICB2YXIgcmVtYWluaW5nID0gYnVmLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG5cbiAgLy8gbXVzdCBiZSBhbiBldmVuIG51bWJlciBvZiBkaWdpdHNcbiAgdmFyIHN0ckxlbiA9IHN0cmluZy5sZW5ndGhcbiAgaWYgKHN0ckxlbiAlIDIgIT09IDApIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBoZXggc3RyaW5nJylcblxuICBpZiAobGVuZ3RoID4gc3RyTGVuIC8gMikge1xuICAgIGxlbmd0aCA9IHN0ckxlbiAvIDJcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHBhcnNlZCA9IHBhcnNlSW50KHN0cmluZy5zdWJzdHIoaSAqIDIsIDIpLCAxNilcbiAgICBpZiAoaXNOYU4ocGFyc2VkKSkgcmV0dXJuIGlcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSBwYXJzZWRcbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiB1dGY4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGY4VG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBhc2NpaVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYXNjaWlUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGJpbmFyeVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGFzY2lpV3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBiYXNlNjRXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGJhc2U2NFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gdWNzMldyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmMTZsZVRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uIHdyaXRlIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZykge1xuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nKVxuICBpZiAob2Zmc2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICBlbmNvZGluZyA9ICd1dGY4J1xuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBlbmNvZGluZylcbiAgfSBlbHNlIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgIGVuY29kaW5nID0gb2Zmc2V0XG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIG9mZnNldFssIGxlbmd0aF1bLCBlbmNvZGluZ10pXG4gIH0gZWxzZSBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgICBpZiAoaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgbGVuZ3RoID0gbGVuZ3RoIHwgMFxuICAgICAgaWYgKGVuY29kaW5nID09PSB1bmRlZmluZWQpIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgfSBlbHNlIHtcbiAgICAgIGVuY29kaW5nID0gbGVuZ3RoXG4gICAgICBsZW5ndGggPSB1bmRlZmluZWRcbiAgICB9XG4gIC8vIGxlZ2FjeSB3cml0ZShzdHJpbmcsIGVuY29kaW5nLCBvZmZzZXQsIGxlbmd0aCkgLSByZW1vdmUgaW4gdjAuMTNcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAnQnVmZmVyLndyaXRlKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldFssIGxlbmd0aF0pIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQnXG4gICAgKVxuICB9XG5cbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCB8fCBsZW5ndGggPiByZW1haW5pbmcpIGxlbmd0aCA9IHJlbWFpbmluZ1xuXG4gIGlmICgoc3RyaW5nLmxlbmd0aCA+IDAgJiYgKGxlbmd0aCA8IDAgfHwgb2Zmc2V0IDwgMCkpIHx8IG9mZnNldCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gd3JpdGUgb3V0c2lkZSBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBiaW5hcnlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICAvLyBXYXJuaW5nOiBtYXhMZW5ndGggbm90IHRha2VuIGludG8gYWNjb3VudCBpbiBiYXNlNjRXcml0ZVxuICAgICAgICByZXR1cm4gYmFzZTY0V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHVjczJXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04gKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdCdWZmZXInLFxuICAgIGRhdGE6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2FyciB8fCB0aGlzLCAwKVxuICB9XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKHN0YXJ0ID09PSAwICYmIGVuZCA9PT0gYnVmLmxlbmd0aCkge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1Zi5zbGljZShzdGFydCwgZW5kKSlcbiAgfVxufVxuXG5mdW5jdGlvbiB1dGY4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG4gIHZhciByZXMgPSBbXVxuXG4gIHZhciBpID0gc3RhcnRcbiAgd2hpbGUgKGkgPCBlbmQpIHtcbiAgICB2YXIgZmlyc3RCeXRlID0gYnVmW2ldXG4gICAgdmFyIGNvZGVQb2ludCA9IG51bGxcbiAgICB2YXIgYnl0ZXNQZXJTZXF1ZW5jZSA9IChmaXJzdEJ5dGUgPiAweEVGKSA/IDRcbiAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4REYpID8gM1xuICAgICAgOiAoZmlyc3RCeXRlID4gMHhCRikgPyAyXG4gICAgICA6IDFcblxuICAgIGlmIChpICsgYnl0ZXNQZXJTZXF1ZW5jZSA8PSBlbmQpIHtcbiAgICAgIHZhciBzZWNvbmRCeXRlLCB0aGlyZEJ5dGUsIGZvdXJ0aEJ5dGUsIHRlbXBDb2RlUG9pbnRcblxuICAgICAgc3dpdGNoIChieXRlc1BlclNlcXVlbmNlKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBpZiAoZmlyc3RCeXRlIDwgMHg4MCkge1xuICAgICAgICAgICAgY29kZVBvaW50ID0gZmlyc3RCeXRlXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4MUYpIDw8IDB4NiB8IChzZWNvbmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3Rikge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweEMgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4NiB8ICh0aGlyZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGRiAmJiAodGVtcENvZGVQb2ludCA8IDB4RDgwMCB8fCB0ZW1wQ29kZVBvaW50ID4gMHhERkZGKSkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBmb3VydGhCeXRlID0gYnVmW2kgKyAzXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAoZm91cnRoQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHgxMiB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHhDIHwgKHRoaXJkQnl0ZSAmIDB4M0YpIDw8IDB4NiB8IChmb3VydGhCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHhGRkZGICYmIHRlbXBDb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb2RlUG9pbnQgPT09IG51bGwpIHtcbiAgICAgIC8vIHdlIGRpZCBub3QgZ2VuZXJhdGUgYSB2YWxpZCBjb2RlUG9pbnQgc28gaW5zZXJ0IGFcbiAgICAgIC8vIHJlcGxhY2VtZW50IGNoYXIgKFUrRkZGRCkgYW5kIGFkdmFuY2Ugb25seSAxIGJ5dGVcbiAgICAgIGNvZGVQb2ludCA9IDB4RkZGRFxuICAgICAgYnl0ZXNQZXJTZXF1ZW5jZSA9IDFcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA+IDB4RkZGRikge1xuICAgICAgLy8gZW5jb2RlIHRvIHV0ZjE2IChzdXJyb2dhdGUgcGFpciBkYW5jZSlcbiAgICAgIGNvZGVQb2ludCAtPSAweDEwMDAwXG4gICAgICByZXMucHVzaChjb2RlUG9pbnQgPj4+IDEwICYgMHgzRkYgfCAweEQ4MDApXG4gICAgICBjb2RlUG9pbnQgPSAweERDMDAgfCBjb2RlUG9pbnQgJiAweDNGRlxuICAgIH1cblxuICAgIHJlcy5wdXNoKGNvZGVQb2ludClcbiAgICBpICs9IGJ5dGVzUGVyU2VxdWVuY2VcbiAgfVxuXG4gIHJldHVybiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkocmVzKVxufVxuXG4vLyBCYXNlZCBvbiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yMjc0NzI3Mi82ODA3NDIsIHRoZSBicm93c2VyIHdpdGhcbi8vIHRoZSBsb3dlc3QgbGltaXQgaXMgQ2hyb21lLCB3aXRoIDB4MTAwMDAgYXJncy5cbi8vIFdlIGdvIDEgbWFnbml0dWRlIGxlc3MsIGZvciBzYWZldHlcbnZhciBNQVhfQVJHVU1FTlRTX0xFTkdUSCA9IDB4MTAwMFxuXG5mdW5jdGlvbiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkgKGNvZGVQb2ludHMpIHtcbiAgdmFyIGxlbiA9IGNvZGVQb2ludHMubGVuZ3RoXG4gIGlmIChsZW4gPD0gTUFYX0FSR1VNRU5UU19MRU5HVEgpIHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNvZGVQb2ludHMpIC8vIGF2b2lkIGV4dHJhIHNsaWNlKClcbiAgfVxuXG4gIC8vIERlY29kZSBpbiBjaHVua3MgdG8gYXZvaWQgXCJjYWxsIHN0YWNrIHNpemUgZXhjZWVkZWRcIi5cbiAgdmFyIHJlcyA9ICcnXG4gIHZhciBpID0gMFxuICB3aGlsZSAoaSA8IGxlbikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFxuICAgICAgU3RyaW5nLFxuICAgICAgY29kZVBvaW50cy5zbGljZShpLCBpICs9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKVxuICAgIClcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldICYgMHg3RilcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGJpbmFyeVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGhleFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcblxuICBpZiAoIXN0YXJ0IHx8IHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIGlmICghZW5kIHx8IGVuZCA8IDAgfHwgZW5kID4gbGVuKSBlbmQgPSBsZW5cblxuICB2YXIgb3V0ID0gJydcbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBvdXQgKz0gdG9IZXgoYnVmW2ldKVxuICB9XG4gIHJldHVybiBvdXRcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGJ5dGVzID0gYnVmLnNsaWNlKHN0YXJ0LCBlbmQpXG4gIHZhciByZXMgPSAnJ1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0gKyBieXRlc1tpICsgMV0gKiAyNTYpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gc2xpY2UgKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gfn5zdGFydFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IGxlbiA6IH5+ZW5kXG5cbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ICs9IGxlblxuICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICB9IGVsc2UgaWYgKHN0YXJ0ID4gbGVuKSB7XG4gICAgc3RhcnQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCAwKSB7XG4gICAgZW5kICs9IGxlblxuICAgIGlmIChlbmQgPCAwKSBlbmQgPSAwXG4gIH0gZWxzZSBpZiAoZW5kID4gbGVuKSB7XG4gICAgZW5kID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgdmFyIG5ld0J1ZlxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICBuZXdCdWYgPSB0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpXG4gICAgbmV3QnVmLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgfSBlbHNlIHtcbiAgICB2YXIgc2xpY2VMZW4gPSBlbmQgLSBzdGFydFxuICAgIG5ld0J1ZiA9IG5ldyBCdWZmZXIoc2xpY2VMZW4sIHVuZGVmaW5lZClcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNsaWNlTGVuOyBpKyspIHtcbiAgICAgIG5ld0J1ZltpXSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuZXdCdWZcbn1cblxuLypcbiAqIE5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgYnVmZmVyIGlzbid0IHRyeWluZyB0byB3cml0ZSBvdXQgb2YgYm91bmRzLlxuICovXG5mdW5jdGlvbiBjaGVja09mZnNldCAob2Zmc2V0LCBleHQsIGxlbmd0aCkge1xuICBpZiAoKG9mZnNldCAlIDEpICE9PSAwIHx8IG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdvZmZzZXQgaXMgbm90IHVpbnQnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gbGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVHJ5aW5nIHRvIGFjY2VzcyBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRMRSA9IGZ1bmN0aW9uIHJlYWRVSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRCRSA9IGZ1bmN0aW9uIHJlYWRVSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG4gIH1cblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdXG4gIHZhciBtdWwgPSAxXG4gIHdoaWxlIChieXRlTGVuZ3RoID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbiByZWFkVUludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2QkUgPSBmdW5jdGlvbiByZWFkVUludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgOCkgfCB0aGlzW29mZnNldCArIDFdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkxFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICgodGhpc1tvZmZzZXRdKSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikpICtcbiAgICAgICh0aGlzW29mZnNldCArIDNdICogMHgxMDAwMDAwKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdICogMHgxMDAwMDAwKSArXG4gICAgKCh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgIHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludExFID0gZnVuY3Rpb24gcmVhZEludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludEJFID0gZnVuY3Rpb24gcmVhZEludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoXG4gIHZhciBtdWwgPSAxXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0taV1cbiAgd2hpbGUgKGkgPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1pXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDggPSBmdW5jdGlvbiByZWFkSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICBpZiAoISh0aGlzW29mZnNldF0gJiAweDgwKSkgcmV0dXJuICh0aGlzW29mZnNldF0pXG4gIHJldHVybiAoKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gcmVhZEludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIDFdIHwgKHRoaXNbb2Zmc2V0XSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyTEUgPSBmdW5jdGlvbiByZWFkSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdKSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10gPDwgMjQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiByZWFkSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDI0KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0TEUgPSBmdW5jdGlvbiByZWFkRmxvYXRMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0QkUgPSBmdW5jdGlvbiByZWFkRmxvYXRCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24gcmVhZERvdWJsZUJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgNTIsIDgpXG59XG5cbmZ1bmN0aW9uIGNoZWNrSW50IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJidWZmZXJcIiBhcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyIGluc3RhbmNlJylcbiAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJ2YWx1ZVwiIGFyZ3VtZW50IGlzIG91dCBvZiBib3VuZHMnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBtYXhCeXRlcyA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSAtIDFcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBtYXhCeXRlcywgMClcbiAgfVxuXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBtYXhCeXRlcyA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSAtIDFcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBtYXhCeXRlcywgMClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50OCA9IGZ1bmN0aW9uIHdyaXRlVUludDggKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHhmZiwgMClcbiAgaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkgdmFsdWUgPSBNYXRoLmZsb29yKHZhbHVlKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5mdW5jdGlvbiBvYmplY3RXcml0ZVVJbnQxNiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4pIHtcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmYgKyB2YWx1ZSArIDFcbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihidWYubGVuZ3RoIC0gb2Zmc2V0LCAyKTsgaSA8IGo7IGkrKykge1xuICAgIGJ1ZltvZmZzZXQgKyBpXSA9ICh2YWx1ZSAmICgweGZmIDw8ICg4ICogKGxpdHRsZUVuZGlhbiA/IGkgOiAxIC0gaSkpKSkgPj4+XG4gICAgICAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSAqIDhcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweGZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlICYgMHhmZilcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5mdW5jdGlvbiBvYmplY3RXcml0ZVVJbnQzMiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4pIHtcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmZmZmZmICsgdmFsdWUgKyAxXG4gIGZvciAodmFyIGkgPSAwLCBqID0gTWF0aC5taW4oYnVmLmxlbmd0aCAtIG9mZnNldCwgNCk7IGkgPCBqOyBpKyspIHtcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSAodmFsdWUgPj4+IChsaXR0bGVFbmRpYW4gPyBpIDogMyAtIGkpICogOCkgJiAweGZmXG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50TEUgPSBmdW5jdGlvbiB3cml0ZUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gMFxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICBpZiAodmFsdWUgPCAwICYmIHN1YiA9PT0gMCAmJiB0aGlzW29mZnNldCArIGkgLSAxXSAhPT0gMCkge1xuICAgICAgc3ViID0gMVxuICAgIH1cbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50QkUgPSBmdW5jdGlvbiB3cml0ZUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IDBcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICBpZiAodmFsdWUgPCAwICYmIHN1YiA9PT0gMCAmJiB0aGlzW29mZnNldCArIGkgKyAxXSAhPT0gMCkge1xuICAgICAgc3ViID0gMVxuICAgIH1cbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uIHdyaXRlSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweDdmLCAtMHg4MClcbiAgaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkgdmFsdWUgPSBNYXRoLmZsb29yKHZhbHVlKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmYgKyB2YWx1ZSArIDFcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlICYgMHhmZilcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuZnVuY3Rpb24gY2hlY2tJRUVFNzU0IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxuICBpZiAob2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRmxvYXQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgNCwgMy40MDI4MjM0NjYzODUyODg2ZSszOCwgLTMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgpXG4gIH1cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgMjMsIDQpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdExFID0gZnVuY3Rpb24gd3JpdGVGbG9hdExFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0QkUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gd3JpdGVEb3VibGUgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgOCwgMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgsIC0xLjc5NzY5MzEzNDg2MjMxNTdFKzMwOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCA1MiwgOClcbiAgcmV0dXJuIG9mZnNldCArIDhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUxFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlQkUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG4vLyBjb3B5KHRhcmdldEJ1ZmZlciwgdGFyZ2V0U3RhcnQ9MCwgc291cmNlU3RhcnQ9MCwgc291cmNlRW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiBjb3B5ICh0YXJnZXQsIHRhcmdldFN0YXJ0LCBzdGFydCwgZW5kKSB7XG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCAmJiBlbmQgIT09IDApIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXRTdGFydCA+PSB0YXJnZXQubGVuZ3RoKSB0YXJnZXRTdGFydCA9IHRhcmdldC5sZW5ndGhcbiAgaWYgKCF0YXJnZXRTdGFydCkgdGFyZ2V0U3RhcnQgPSAwXG4gIGlmIChlbmQgPiAwICYmIGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydFxuXG4gIC8vIENvcHkgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuIDBcbiAgaWYgKHRhcmdldC5sZW5ndGggPT09IDAgfHwgdGhpcy5sZW5ndGggPT09IDApIHJldHVybiAwXG5cbiAgLy8gRmF0YWwgZXJyb3IgY29uZGl0aW9uc1xuICBpZiAodGFyZ2V0U3RhcnQgPCAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3RhcmdldFN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICB9XG4gIGlmIChzdGFydCA8IDAgfHwgc3RhcnQgPj0gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdzb3VyY2VTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgaWYgKGVuZCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdzb3VyY2VFbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgLy8gQXJlIHdlIG9vYj9cbiAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0IDwgZW5kIC0gc3RhcnQpIHtcbiAgICBlbmQgPSB0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgKyBzdGFydFxuICB9XG5cbiAgdmFyIGxlbiA9IGVuZCAtIHN0YXJ0XG4gIHZhciBpXG5cbiAgaWYgKHRoaXMgPT09IHRhcmdldCAmJiBzdGFydCA8IHRhcmdldFN0YXJ0ICYmIHRhcmdldFN0YXJ0IDwgZW5kKSB7XG4gICAgLy8gZGVzY2VuZGluZyBjb3B5IGZyb20gZW5kXG4gICAgZm9yIChpID0gbGVuIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0U3RhcnRdID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9IGVsc2UgaWYgKGxlbiA8IDEwMDAgfHwgIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgLy8gYXNjZW5kaW5nIGNvcHkgZnJvbSBzdGFydFxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgdGFyZ2V0W2kgKyB0YXJnZXRTdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgVWludDhBcnJheS5wcm90b3R5cGUuc2V0LmNhbGwoXG4gICAgICB0YXJnZXQsXG4gICAgICB0aGlzLnN1YmFycmF5KHN0YXJ0LCBzdGFydCArIGxlbiksXG4gICAgICB0YXJnZXRTdGFydFxuICAgIClcbiAgfVxuXG4gIHJldHVybiBsZW5cbn1cblxuLy8gVXNhZ2U6XG4vLyAgICBidWZmZXIuZmlsbChudW1iZXJbLCBvZmZzZXRbLCBlbmRdXSlcbi8vICAgIGJ1ZmZlci5maWxsKGJ1ZmZlclssIG9mZnNldFssIGVuZF1dKVxuLy8gICAgYnVmZmVyLmZpbGwoc3RyaW5nWywgb2Zmc2V0WywgZW5kXV1bLCBlbmNvZGluZ10pXG5CdWZmZXIucHJvdG90eXBlLmZpbGwgPSBmdW5jdGlvbiBmaWxsICh2YWwsIHN0YXJ0LCBlbmQsIGVuY29kaW5nKSB7XG4gIC8vIEhhbmRsZSBzdHJpbmcgY2FzZXM6XG4gIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgIGlmICh0eXBlb2Ygc3RhcnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlbmNvZGluZyA9IHN0YXJ0XG4gICAgICBzdGFydCA9IDBcbiAgICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZW5kID09PSAnc3RyaW5nJykge1xuICAgICAgZW5jb2RpbmcgPSBlbmRcbiAgICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gICAgfVxuICAgIGlmICh2YWwubGVuZ3RoID09PSAxKSB7XG4gICAgICB2YXIgY29kZSA9IHZhbC5jaGFyQ29kZUF0KDApXG4gICAgICBpZiAoY29kZSA8IDI1Nikge1xuICAgICAgICB2YWwgPSBjb2RlXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChlbmNvZGluZyAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBlbmNvZGluZyAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2VuY29kaW5nIG11c3QgYmUgYSBzdHJpbmcnKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIGVuY29kaW5nID09PSAnc3RyaW5nJyAmJiAhQnVmZmVyLmlzRW5jb2RpbmcoZW5jb2RpbmcpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgdmFsID0gdmFsICYgMjU1XG4gIH1cblxuICAvLyBJbnZhbGlkIHJhbmdlcyBhcmUgbm90IHNldCB0byBhIGRlZmF1bHQsIHNvIGNhbiByYW5nZSBjaGVjayBlYXJseS5cbiAgaWYgKHN0YXJ0IDwgMCB8fCB0aGlzLmxlbmd0aCA8IHN0YXJ0IHx8IHRoaXMubGVuZ3RoIDwgZW5kKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ091dCBvZiByYW5nZSBpbmRleCcpXG4gIH1cblxuICBpZiAoZW5kIDw9IHN0YXJ0KSB7XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHN0YXJ0ID0gc3RhcnQgPj4+IDBcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgPyB0aGlzLmxlbmd0aCA6IGVuZCA+Pj4gMFxuXG4gIGlmICghdmFsKSB2YWwgPSAwXG5cbiAgdmFyIGlcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgZm9yIChpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgdGhpc1tpXSA9IHZhbFxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgYnl0ZXMgPSBCdWZmZXIuaXNCdWZmZXIodmFsKVxuICAgICAgPyB2YWxcbiAgICAgIDogdXRmOFRvQnl0ZXMobmV3IEJ1ZmZlcih2YWwsIGVuY29kaW5nKS50b1N0cmluZygpKVxuICAgIHZhciBsZW4gPSBieXRlcy5sZW5ndGhcbiAgICBmb3IgKGkgPSAwOyBpIDwgZW5kIC0gc3RhcnQ7IGkrKykge1xuICAgICAgdGhpc1tpICsgc3RhcnRdID0gYnl0ZXNbaSAlIGxlbl1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpc1xufVxuXG4vLyBIRUxQRVIgRlVOQ1RJT05TXG4vLyA9PT09PT09PT09PT09PT09XG5cbnZhciBJTlZBTElEX0JBU0U2NF9SRSA9IC9bXitcXC8wLTlBLVphLXotX10vZ1xuXG5mdW5jdGlvbiBiYXNlNjRjbGVhbiAoc3RyKSB7XG4gIC8vIE5vZGUgc3RyaXBzIG91dCBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSBcXG4gYW5kIFxcdCBmcm9tIHRoZSBzdHJpbmcsIGJhc2U2NC1qcyBkb2VzIG5vdFxuICBzdHIgPSBzdHJpbmd0cmltKHN0cikucmVwbGFjZShJTlZBTElEX0JBU0U2NF9SRSwgJycpXG4gIC8vIE5vZGUgY29udmVydHMgc3RyaW5ncyB3aXRoIGxlbmd0aCA8IDIgdG8gJydcbiAgaWYgKHN0ci5sZW5ndGggPCAyKSByZXR1cm4gJydcbiAgLy8gTm9kZSBhbGxvd3MgZm9yIG5vbi1wYWRkZWQgYmFzZTY0IHN0cmluZ3MgKG1pc3NpbmcgdHJhaWxpbmcgPT09KSwgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHdoaWxlIChzdHIubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgIHN0ciA9IHN0ciArICc9J1xuICB9XG4gIHJldHVybiBzdHJcbn1cblxuZnVuY3Rpb24gc3RyaW5ndHJpbSAoc3RyKSB7XG4gIGlmIChzdHIudHJpbSkgcmV0dXJuIHN0ci50cmltKClcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJylcbn1cblxuZnVuY3Rpb24gdG9IZXggKG4pIHtcbiAgaWYgKG4gPCAxNikgcmV0dXJuICcwJyArIG4udG9TdHJpbmcoMTYpXG4gIHJldHVybiBuLnRvU3RyaW5nKDE2KVxufVxuXG5mdW5jdGlvbiB1dGY4VG9CeXRlcyAoc3RyaW5nLCB1bml0cykge1xuICB1bml0cyA9IHVuaXRzIHx8IEluZmluaXR5XG4gIHZhciBjb2RlUG9pbnRcbiAgdmFyIGxlbmd0aCA9IHN0cmluZy5sZW5ndGhcbiAgdmFyIGxlYWRTdXJyb2dhdGUgPSBudWxsXG4gIHZhciBieXRlcyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGNvZGVQb2ludCA9IHN0cmluZy5jaGFyQ29kZUF0KGkpXG5cbiAgICAvLyBpcyBzdXJyb2dhdGUgY29tcG9uZW50XG4gICAgaWYgKGNvZGVQb2ludCA+IDB4RDdGRiAmJiBjb2RlUG9pbnQgPCAweEUwMDApIHtcbiAgICAgIC8vIGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoIWxlYWRTdXJyb2dhdGUpIHtcbiAgICAgICAgLy8gbm8gbGVhZCB5ZXRcbiAgICAgICAgaWYgKGNvZGVQb2ludCA+IDB4REJGRikge1xuICAgICAgICAgIC8vIHVuZXhwZWN0ZWQgdHJhaWxcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2UgaWYgKGkgKyAxID09PSBsZW5ndGgpIHtcbiAgICAgICAgICAvLyB1bnBhaXJlZCBsZWFkXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHZhbGlkIGxlYWRcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIDIgbGVhZHMgaW4gYSByb3dcbiAgICAgIGlmIChjb2RlUG9pbnQgPCAweERDMDApIHtcbiAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gdmFsaWQgc3Vycm9nYXRlIHBhaXJcbiAgICAgIGNvZGVQb2ludCA9IChsZWFkU3Vycm9nYXRlIC0gMHhEODAwIDw8IDEwIHwgY29kZVBvaW50IC0gMHhEQzAwKSArIDB4MTAwMDBcbiAgICB9IGVsc2UgaWYgKGxlYWRTdXJyb2dhdGUpIHtcbiAgICAgIC8vIHZhbGlkIGJtcCBjaGFyLCBidXQgbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgIH1cblxuICAgIGxlYWRTdXJyb2dhdGUgPSBudWxsXG5cbiAgICAvLyBlbmNvZGUgdXRmOFxuICAgIGlmIChjb2RlUG9pbnQgPCAweDgwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDEpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goY29kZVBvaW50KVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHg4MDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiB8IDB4QzAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDMpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgfCAweEUwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSA0KSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHgxMiB8IDB4RjAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29kZSBwb2ludCcpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIC8vIE5vZGUncyBjb2RlIHNlZW1zIHRvIGJlIGRvaW5nIHRoaXMgYW5kIG5vdCAmIDB4N0YuLlxuICAgIGJ5dGVBcnJheS5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpICYgMHhGRilcbiAgfVxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVUb0J5dGVzIChzdHIsIHVuaXRzKSB7XG4gIHZhciBjLCBoaSwgbG9cbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG5cbiAgICBjID0gc3RyLmNoYXJDb2RlQXQoaSlcbiAgICBoaSA9IGMgPj4gOFxuICAgIGxvID0gYyAlIDI1NlxuICAgIGJ5dGVBcnJheS5wdXNoKGxvKVxuICAgIGJ5dGVBcnJheS5wdXNoKGhpKVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBiYXNlNjRUb0J5dGVzIChzdHIpIHtcbiAgcmV0dXJuIGJhc2U2NC50b0J5dGVBcnJheShiYXNlNjRjbGVhbihzdHIpKVxufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyIChzcmMsIGRzdCwgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGlmICgoaSArIG9mZnNldCA+PSBkc3QubGVuZ3RoKSB8fCAoaSA+PSBzcmMubGVuZ3RoKSkgYnJlYWtcbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV1cbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiBpc25hbiAodmFsKSB7XG4gIHJldHVybiB2YWwgIT09IHZhbCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNlbGYtY29tcGFyZVxufVxuIiwiZXhwb3J0cy5yZWFkID0gZnVuY3Rpb24gKGJ1ZmZlciwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG1cbiAgdmFyIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBuQml0cyA9IC03XG4gIHZhciBpID0gaXNMRSA/IChuQnl0ZXMgLSAxKSA6IDBcbiAgdmFyIGQgPSBpc0xFID8gLTEgOiAxXG4gIHZhciBzID0gYnVmZmVyW29mZnNldCArIGldXG5cbiAgaSArPSBkXG5cbiAgZSA9IHMgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgcyA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gZUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBlID0gZSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIG0gPSBlICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIGUgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IG1MZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgbSA9IG0gKiAyNTYgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBpZiAoZSA9PT0gMCkge1xuICAgIGUgPSAxIC0gZUJpYXNcbiAgfSBlbHNlIGlmIChlID09PSBlTWF4KSB7XG4gICAgcmV0dXJuIG0gPyBOYU4gOiAoKHMgPyAtMSA6IDEpICogSW5maW5pdHkpXG4gIH0gZWxzZSB7XG4gICAgbSA9IG0gKyBNYXRoLnBvdygyLCBtTGVuKVxuICAgIGUgPSBlIC0gZUJpYXNcbiAgfVxuICByZXR1cm4gKHMgPyAtMSA6IDEpICogbSAqIE1hdGgucG93KDIsIGUgLSBtTGVuKVxufVxuXG5leHBvcnRzLndyaXRlID0gZnVuY3Rpb24gKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLCBjXG4gIHZhciBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgcnQgPSAobUxlbiA9PT0gMjMgPyBNYXRoLnBvdygyLCAtMjQpIC0gTWF0aC5wb3coMiwgLTc3KSA6IDApXG4gIHZhciBpID0gaXNMRSA/IDAgOiAobkJ5dGVzIC0gMSlcbiAgdmFyIGQgPSBpc0xFID8gMSA6IC0xXG4gIHZhciBzID0gdmFsdWUgPCAwIHx8ICh2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPCAwKSA/IDEgOiAwXG5cbiAgdmFsdWUgPSBNYXRoLmFicyh2YWx1ZSlcblxuICBpZiAoaXNOYU4odmFsdWUpIHx8IHZhbHVlID09PSBJbmZpbml0eSkge1xuICAgIG0gPSBpc05hTih2YWx1ZSkgPyAxIDogMFxuICAgIGUgPSBlTWF4XG4gIH0gZWxzZSB7XG4gICAgZSA9IE1hdGguZmxvb3IoTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjIpXG4gICAgaWYgKHZhbHVlICogKGMgPSBNYXRoLnBvdygyLCAtZSkpIDwgMSkge1xuICAgICAgZS0tXG4gICAgICBjICo9IDJcbiAgICB9XG4gICAgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICB2YWx1ZSArPSBydCAvIGNcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgKz0gcnQgKiBNYXRoLnBvdygyLCAxIC0gZUJpYXMpXG4gICAgfVxuICAgIGlmICh2YWx1ZSAqIGMgPj0gMikge1xuICAgICAgZSsrXG4gICAgICBjIC89IDJcbiAgICB9XG5cbiAgICBpZiAoZSArIGVCaWFzID49IGVNYXgpIHtcbiAgICAgIG0gPSAwXG4gICAgICBlID0gZU1heFxuICAgIH0gZWxzZSBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIG0gPSAodmFsdWUgKiBjIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IGUgKyBlQmlhc1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gdmFsdWUgKiBNYXRoLnBvdygyLCBlQmlhcyAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSAwXG4gICAgfVxuICB9XG5cbiAgZm9yICg7IG1MZW4gPj0gODsgYnVmZmVyW29mZnNldCArIGldID0gbSAmIDB4ZmYsIGkgKz0gZCwgbSAvPSAyNTYsIG1MZW4gLT0gOCkge31cblxuICBlID0gKGUgPDwgbUxlbikgfCBtXG4gIGVMZW4gKz0gbUxlblxuICBmb3IgKDsgZUxlbiA+IDA7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IGUgJiAweGZmLCBpICs9IGQsIGUgLz0gMjU2LCBlTGVuIC09IDgpIHt9XG5cbiAgYnVmZmVyW29mZnNldCArIGkgLSBkXSB8PSBzICogMTI4XG59XG4iLCJ2YXIgdG9TdHJpbmcgPSB7fS50b1N0cmluZztcblxubW9kdWxlLmV4cG9ydHMgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChhcnIpIHtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwoYXJyKSA9PSAnW29iamVjdCBBcnJheV0nO1xufTtcbiJdfQ==
