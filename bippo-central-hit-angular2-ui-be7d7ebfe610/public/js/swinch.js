window.noZensmooth = true;

/**
 * Zenscroll 3.2.3
 * https://github.com/zengabor/zenscroll/
 *
 * Copyright 2015?2016 Gabor Lenard
 *
 * This is free and unencumbered software released into the public domain.
 * 
 * Anyone is free to copy, modify, publish, use, compile, sell, or
 * distribute this software, either in source code form or as a compiled
 * binary, for any purpose, commercial or non-commercial, and by any
 * means.
 * 
 * In jurisdictions that recognize copyright laws, the author or authors
 * of this software dedicate any and all copyright interest in the
 * software to the public domain. We make this dedication for the benefit
 * of the public at large and to the detriment of our heirs and
 * successors. We intend this dedication to be an overt act of
 * relinquishment in perpetuity of all present and future rights to this
 * software under copyright law.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
 * OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 * 
 * For more information, please refer to <http://unlicense.org>
 *
 */

/*jshint devel:true, asi:true */

/*global define, module */


(function (root, factory) {
	if (typeof define === "function" && define.amd) {
		define([], factory())
	} else if (typeof module === "object" && module.exports) {
		module.exports = factory()
	} else {
		root.zenscroll = factory()
	}
}(this, function () {
	"use strict"

	// Exit if it�fs not a browser environment:
	if (typeof window === "undefined" || !("document" in window)) {
		return {}
	}

	var createScroller = function (scrollContainer, defaultDuration, edgeOffset) {

		defaultDuration = defaultDuration || 999 //ms
		if (!edgeOffset && edgeOffset !== 0) {
			// When scrolling, this amount of distance is kept from the edges of the scrollContainer:
			edgeOffset = 9 //px
		}

		var scrollTimeoutId
		var setScrollTimeoutId = function (newValue) {
			scrollTimeoutId = newValue
		}
		var docElem = document.documentElement
		
		// Detect if the browser already supports native smooth scrolling (e.g., Firefox 36+ and Chrome 49+) and it is enabled:
		var nativeSmoothScrollEnabled = function () {
			return ("getComputedStyle" in window) &&
				window.getComputedStyle(scrollContainer ? scrollContainer : document.body)["scroll-behavior"] === "smooth"
		}

		var getScrollTop = function () {
			if (scrollContainer) {
				return scrollContainer.scrollTop
			} else {
				return window.scrollY || docElem.scrollTop
			}
		}

		var getViewHeight = function () {
			if (scrollContainer) {
				return Math.min(scrollContainer.offsetHeight, window.innerHeight)
			} else {
				return window.innerHeight || docElem.clientHeight
			}
		}

		var getRelativeTopOf = function (elem) {
			if (scrollContainer) {
				return elem.offsetTop
			} else {
				return elem.getBoundingClientRect().top + getScrollTop() - docElem.offsetTop
			}
		}

		/**
		 * Immediately stops the current smooth scroll operation
		 */
		var stopScroll = function () {
			clearTimeout(scrollTimeoutId)
			setScrollTimeoutId(0)
		}

		/**
		 * Scrolls to a specific vertical position in the document.
		 *
		 * @param {endY} The vertical position within the document.
		 * @param {duration} Optionally the duration of the scroll operation.
		 *        If 0 or not provided it is automatically calculated based on the 
		 *        distance and the default duration.
		 */
		var scrollToY = function (endY, duration, onDone) {
			stopScroll()
			if (nativeSmoothScrollEnabled()) {
				(scrollContainer || window).scrollTo(0, endY)
				if (onDone) {
					onDone()
				}
			} else {
				var startY = getScrollTop()
				var distance = Math.max(endY,0) - startY
				duration = duration || Math.min(Math.abs(distance), defaultDuration)
				var startTime = new Date().getTime();
				(function loopScroll() {
					setScrollTimeoutId(setTimeout(function () {
						var p = Math.min((new Date().getTime() - startTime) / duration, 1) // percentage
						var y = Math.max(Math.floor(startY + distance*(p < 0.5 ? 2*p*p : p*(4 - p*2)-1)), 0)
						if (scrollContainer) {
							scrollContainer.scrollTop = y
						} else {
							window.scrollTo(0, y)
						}
						if (p < 1 && (getViewHeight() + y) < (scrollContainer || docElem).scrollHeight) {
							loopScroll()
						} else {
							setTimeout(stopScroll, 99) // with cooldown time
							if (onDone) {
								onDone()
							}
						}
					}, 9))
				})()
			}
		}

		/**
		 * Scrolls to the top of a specific element.
		 *
		 * @param {elem} The element.
		 * @param {duration} Optionally the duration of the scroll operation.
		 *        A value of 0 is ignored.
		 */
		var scrollToElem = function (elem, duration, onDone) {
			scrollToY(getRelativeTopOf(elem) - edgeOffset, duration, onDone)
		}

		/**
		 * Scrolls an element into view if necessary.
		 *
		 * @param {elem} The element.
		 * @param {duration} Optionally the duration of the scroll operation.
		 *        A value of 0 is ignored.
		 */
		var scrollIntoView = function (elem, duration, onDone) {
			var elemHeight = elem.getBoundingClientRect().height
			var elemTop = getRelativeTopOf(elem)
			var elemBottom = elemTop + elemHeight
			var containerHeight = getViewHeight()
			var containerTop = getScrollTop()
			var containerBottom = containerTop + containerHeight
			if ((elemTop - edgeOffset) < containerTop || (elemHeight + edgeOffset) > containerHeight) {
				// Element is clipped at top or is higher than screen.
				scrollToElem(elem, duration, onDone)
			} else if ((elemBottom + edgeOffset) > containerBottom) {
				// Element is clipped at the bottom.
				scrollToY(elemBottom - containerHeight + edgeOffset, duration, onDone)
			} else if (onDone) {
				onDone()
			}
		}

		/**
		 * Scrolls to the center of an element.
		 *
		 * @param {elem} The element.
		 * @param {duration} Optionally the duration of the scroll operation.
		 * @param {offset} Optionally the offset of the top of the element from the center of the screen.
		 *        A value of 0 is ignored.
		 */
		var scrollToCenterOf = function (elem, duration, offset, onDone) {
			scrollToY(
				Math.max(
					getRelativeTopOf(elem) - getViewHeight()/2 + (offset || elem.getBoundingClientRect().height/2), 
					0
				), 
				duration,
				onDone
			)
		}

		/**
		 * Changes default settings for this scroller.
		 *
		 * @param {newDefaultDuration} New value for default duration, used for each scroll method by default.
		 *        Ignored if 0 or falsy.
		 * @param {newEdgeOffset} New value for the edge offset, used by each scroll method by default.
		 */
		var setup = function (newDefaultDuration, newEdgeOffset) {
			if (newDefaultDuration) {
				defaultDuration = newDefaultDuration
			}
			if (newEdgeOffset === 0 || newEdgeOffset) {
				edgeOffset = newEdgeOffset
			}
		}

		return {
			setup: setup,
			to: scrollToElem,
			toY: scrollToY,
			intoView: scrollIntoView,
			center: scrollToCenterOf,
			stop: stopScroll,
			moving: function () { return !!scrollTimeoutId }
		}

	}

	// Create a scroller for the browser window, omitting parameters:
	var defaultScroller = createScroller();

	var replaceUrl = function (hash) {
		try {
			history.replaceState({}, "", window.location.href.split("#")[0] + hash)
		} catch (e) {
			// To avoid the Security exception in Chrome when the page was opened via the file protocol, e.g., file://index.html
		}
	};

    var addListeners = function() {
        if (!document.body) {
            setTimeout(function() {
                addListeners();
            }, 50);
            return;
        }
    	// Create listeners for the documentElement only & exclude IE8-
    	if ("addEventListener" in window && document.body.style.scrollBehavior !== "smooth" && !window.noZensmooth) {
    		window.addEventListener("click", function (event) {
    			var anchor = event.target
    			while (anchor && anchor.tagName !== "A") {
    				anchor = anchor.parentNode
    			}
    			// Only handle links that were clicked with the primary button, without modifier keys:
    			if (!anchor || event.which !== 1 || event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) {
    				return
    			}
    			var href = anchor.getAttribute("href") || ""
    			if (href.indexOf("#") === 0) {
    				if (href === "#") {
    					event.preventDefault()
    					defaultScroller.toY(0)
    					replaceUrl("")
    				} else {
    					var targetId = anchor.hash.substring(1)
    					var targetElem = document.getElementById(targetId)
    					if (targetElem) {
    						event.preventDefault()
    						defaultScroller.to(targetElem)
    						replaceUrl("#" + targetId)
    					}
    				}
    			}
    		}, false)
    	}
	};

    addListeners();

	return {
		// Expose the "constructor" that can create a new scroller:
		createScroller: createScroller,
		// Surface the methods of the default scroller:
		setup: defaultScroller.setup,
		to: defaultScroller.to,
		toY: defaultScroller.toY,
		intoView: defaultScroller.intoView,
		center: defaultScroller.center,
		stop: defaultScroller.stop,
		moving: defaultScroller.moving
	}

}));


;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.swinch = factory();
  }
}(this, function() {
'use strict';

function extend(target, source) {
    for (var prop in source) {
        target[prop] = source[prop];
    }
    return target;
}

function merge(target, source) {
    target = target || {};
    for (var prop in source) {
        if (typeof source[prop] === 'object') {
            target[prop] = extend(target[prop], source[prop]);
        } else {
            target[prop] = source[prop];
        }
    }
    return target;
}

var config = {
    /**
     * The duration of the snap, in milliseconds
     *
     * @type {Number}
     */
    duration: 500,

    /**
     * The offset of the snapping target
     *
     * @type {Number}
     */
    offset: 0,

    /**
     * Force ScrollControl to snap on a part of each section.
     *
     * null     Snap to the bottom of each section if going up & top if going down.
     * 'top'    Force snap to the top of each section
     * 'bottom' Force snap to the bottom of each section
     * 
     * @type {string|null}
     */
    snapTo: null,

    /**
     * Called before the snapping starts
     *
     * @param  {Node}   currentSection
     * @param  {Node}   nextSection
     * @param  {Object} scrollDirection {isUp: <boolean>, isDown: <boolean>}
     *
     * @return {void}
     */
    onBeforeSnap: function onBeforeSnap(currentSection, nextSection, scrollDirection) {
        //
    },

    /**
     * Called after the snapping completes
     *
     * @param  {Node}   currentSection
     * @param  {Node}   previousSection
     * @param  {Object} scrollDirection {isUp: <boolean>, isDown: <boolean>}
     *
     * @return {void}
     */
    onSnapped: function onSnapped(currentSection, previousSection, scrollDirection) {
        //
    }
};

var scroller = null;
var scrollerFactory = function(swinchInstance) {
    var self = this;
    this.config = swinchInstance.config;
    // Set zenscroll defaults
    window.zenscroll.setup(this.config.duration, this.config.offset);

    return {
        /**
         * Determine if the scroller is auto-scrolling
         *
         * @return {boolean}
         */
        isAutoScrolling: function isAutoScrolling() {
            return window.zenscroll.moving();
        },

        /**
         * Scroll to the given top coordinate
         *
         * @param  {float|Node}    top
         * @param  {function} callback
         *
         * @return {void}
         */
        scrollTo: function scrollTo(top, callback) {
            if (typeof top === 'number') {
                window.zenscroll.toY(top + self.config.offset, self.config.duration, callback);
                return;
            }

            window.zenscroll.to(top, self.config.duration, callback);
        }
    };
};

var snapper = null;
var snapperFactory = function(swinchInstance) {
    var self = this;
    this.viewport = swinchInstance.viewport;
    this.section = swinchInstance.section;
    this.scroller = swinchInstance.scroller;

    return {
        /**
         * Handle the scroll event
         *
         * @param  {object} event
         *
         * @return {void}
         */
        onScroll: function onScroll(event) {
            self.viewport.updateTop();
            self.section.updateActive();

            if (isAllowedToSnap()) {
                var args = getSnapCallbackArguments();

                self.config.onBeforeSnap.apply(undefined, args.before);

                snapToActiveSection(function onSnapped() {
                    self.config.onSnapped.apply(undefined, args.after);
                });
            }

            self.section.updateLastActive();
            self.viewport.updateLastTop();
        },

        /**
         * Handle the wheel event
         *
         * @param  {object} event
         *
         * @return {void}
         */
        onWheel: function onWheel(event) {
            // Don't allow the wheel event while auto scrolling
            if (self.scroller.isAutoScrolling()) {
                event.preventDefault();
            }
        },

        /**
         * Handle the click event
         *
         * @param  {object} event
         *
         * @return {void}
         */
        onClick: function onClick(event) {
            var anchor = event.target;
            while (anchor && anchor.tagName !== 'A') {
                anchor = anchor.parentNode;
            }

            // Only handle links that were clicked with the primary button, without modifier keys:
            if (!anchor || event.which !== 1 || event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) {
                return;
            }

            // Get the href tag
            var href = anchor.getAttribute('href') || '';

            // Return early if it's not a tag
            if (href.indexOf('#') !== 0) {
                return;
            }

            // If it's just a tag and nothing else, then go to top
            if (href === '#') {
                event.preventDefault();
                replaceUrl('');
                scrollToWithEvents(self.section[0]);

                // Return early
                return;
            }

            // Get the target
            var targetId = anchor.hash.substring(1);
            var targetElem = document.getElementById(targetId);

            // If there is a target element, then go to it!
            if (targetElem) {
                event.preventDefault();
                replaceUrl('#' + targetId);
                scrollToWithEvents(targetElem);
            }
        }
    };

    ///////////////////////
    // PRIVATE FUNCTIONS //
    ///////////////////////

    /**
     * Determine if the scroller is allowed to snap
     *
     * @return {boolean}
     */
    function isAllowedToSnap() {
        return !self.scroller.isAutoScrolling() && self.section.activeChanged();
    }

    /**
     * Get the snap callback arguments
     *
     * @return {object}
     */
    function getSnapCallbackArguments() {
        var scrollDirection = {
            isUp: self.viewport.isScrollingUp(),
            isDown: self.viewport.isScrollingDown()
        };

        return {
            before: [self.section.lastActive(), self.section.active(), scrollDirection],
            after: [self.section.active(), self.section.lastActive(), scrollDirection]
        };
    }

    /**
     * Scroll to the currently-active section
     *
     * @param  {function} callback
     *
     * @return {void}
     */
    function snapToActiveSection(callback) {
        if (self.config.snapTo !== 'bottom' && self.viewport.isScrollingDown() || self.config.snapTo === 'top') {
            self.scroller.scrollTo(
                self.viewport.top() + self.section.active().getBoundingClientRect().top,
                callback
            );
        }
        else if (self.config.snapTo !== 'top' && self.viewport.isScrollingUp() || self.config.snapTo === 'bottom') {
            self.scroller.scrollTo(
                self.viewport.top() - self.viewport.height() + self.section.active().getBoundingClientRect().bottom,
                callback
            );
        }
    }

    /**
     * Replace the url hash
     *
     * @param  {string} hash
     *
     * @return {void}
     */
    function replaceUrl(hash) {
        try {
            history.replaceState({}, '', window.location.href.split('#')[0] + hash);
        }
        catch (e) {
            // To avoid the Security exception in Chrome when the page was opened via the file protocol, e.g., file://index.html
        }
    } 

    /**
     * Scroll to a target with events
     *
     * @param  {Node} target
     *
     * @return {void}
     */
    function scrollToWithEvents(target) {
        // Get the callback arguments, with a little modification
        var args = getSnapCallbackArguments();
        args.before[1] = args.after[0] = target;

        // Customize the direction based on the current & next sections
        args.before[2] = args.after[2] = {
            isUp: args.before[0].getBoundingClientRect().top > args.before[1].getBoundingClientRect().top,
            isDown: args.before[0].getBoundingClientRect().top < args.before[1].getBoundingClientRect().top
        };

        // Scroll with callbacks
        self.config.onBeforeSnap.apply(undefined, args.before);
        self.scroller.scrollTo(target, function onScrollToHash() {
            self.config.onSnapped.apply(undefined, args.after);
        });
    }
};

var viewport;
var viewportFactory = function() {
    // Instantiate
    var self = this;
    this._top = 0;
    this._lastTop = 0;

    return {
        /**
         * Determine if the viewport is at the top of the screen
         *
         * @return {boolean}
         */
        isAtTop: function isAtTop() {
            return self._top <= 0;
        },

        /**
         * Determine if the viewport is scrolling down
         *
         * @return {boolean}
         */
        isScrollingDown: function isScrollingDown() {
            return self._top > self._lastTop;
        },

        /**
         * Determine if the viewport is scrolling up
         *
         * @return {boolean}
         */
        isScrollingUp: function isScrollingUp() {
            return self._top < self._lastTop;
        },

        /**
         * Get the height of the viewport
         *
         * @return {float}
         */
        height: function height() {
            return window.innerHeight;
        },

        /**
         * Update the top of the viewport
         *
         * @return {void}
         */
        updateTop: function updateTop() {
            self._top = window.pageYOffset;
        },

        /**
         * Update the last top of the viewport
         *
         * @return {void}
         */
        updateLastTop: function updateLastTop() {
            self._lastTop = window.pageYOffset;
        },

        /**
         * Get the top of the viewport
         *
         * @return {float}
         */
        top: function top() {
            return self._top;
        }
    };
};

var section = null;
var sectionFactory = function(swinchInstance) {
    // Instantiate
    var self = this;
    this._activeIndex = 0;
    this._lastActiveIndex = 0;
    this.viewport = swinchInstance.viewport;

    return {
        /**
         * Get the currently-active section
         *
         * @return {Node}
         */
        active: function active() {
            return this[self._activeIndex];
        },

        /**
         * Get the last active section
         *
         * @return {Node}
         */
        lastActive: function lastActive() {
            return this[self._lastActiveIndex];
        },

        /**
         * Update the currently-active section
         *
         * @return {void}
         */
        updateActive: function updateActive() {
            // Don't do anything if the viewport is at the top
            if (self.viewport.isAtTop()) {
                return;
            }

            // Copy the active index so we don't mess it up during the loops
            var index = self._activeIndex;

            // If we're scrolling down,
            // find the the first section that has its bottom below the bottom of the viewport
            if (self.viewport.isScrollingDown()) {
                for (index = 0; index < this.length; index++) {
                    if (this[index].getBoundingClientRect().bottom > self.viewport.height()) {
                        break;
                    }
                }
            }

            // If we're scrolling up,
            // find the first section that has its top above the top of the viewport
            else if (self.viewport.isScrollingUp()) {
                for (index = this.length - 1; index >= 0; index--) {
                    if (this[index].getBoundingClientRect().top < 0) {
                        break;
                    }
                }
            }

            // Set the active index, limit by the last section
            if (index >= this.length) {
                self._activeIndex = this.length - 1;
            }
            else if (index <= 0) {
                self._activeIndex = 0;
            }
            else {
                self._activeIndex = index;
            }
        },

        /**
         * Update the last active section
         *
         * @return {void}
         */
        updateLastActive: function updateLastActive() {
            self._lastActiveIndex = self._activeIndex;
        },

        /**
         * Determine if the active section changed
         *
         * @return {boolean}
         */
        activeChanged: function activeChanged() {
            return self._activeIndex !== self._lastActiveIndex;
        }
    };
};

var swinch = function() {
    this.config = {};
    this.viewport = null;

    return this;
};
swinch.prototype.init = function (sections, options) {
    // Set defaults
    sections = sections || document.querySelectorAll('section');
    options = options || {};

    // Merge config with options
    Object.assign(this.config, config);
    merge(this.config, options);

    // Initialize viewport
    this.viewport = new viewportFactory();

    // Extend the given sections with the section object
    this.section = extend(sections, new sectionFactory(this));

    // Initialize scroller
    this.scroller = new scrollerFactory(this);

    // Initialize snapper
    this.snapper = new snapperFactory(this);

    // Initialize viewport & section values
    this.viewport.updateTop();
    this.section.updateActive();
    this.section.updateLastActive();
    this.viewport.updateLastTop();
    this.snapperOnScroll = this.snapper.onScroll.bind(snapper);
    this.snapperOnWheel = this.snapper.onWheel.bind(snapper);
    this.snapperOnClick = this.snapper.onClick.bind(snapper);

    // Add event listeners
    window.addEventListener('scroll', this.snapperOnScroll, false);
    window.addEventListener('wheel', this.snapperOnWheel, false);
    window.addEventListener('click', this.snapperOnClick, false);
};

swinch.prototype.destroy = function() {
    window.removeEventListener('scroll', this.snapperOnScroll, false);
    window.removeEventListener('wheel', this.snapperOnWheel, false);
    window.removeEventListener('click', this.snapperOnClick, false);
};

return swinch;
}));
