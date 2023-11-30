;console.log('jquery.touchpanes.js outside declaration');(function($) {
  console.log('jquery.touchpanes.js function called');
  var touchPanes = function(panesWrapper, opts) {
    this.opts = opts || {};
    this.panesWrapper = panesWrapper;
    this.singlePaneWidth = parseInt(window.getComputedStyle(panesWrapper.parent().get(0)).width);
    this.panesInner = this.panesWrapper.find('.inner_panes');
    this.panes = this.panesInner.find('.pane');
    this.totalPaneWidth = this.panes.length * this.singlePaneWidth;
    this.finalPos = -(this.totalPaneWidth - this.singlePaneWidth);
    this.tabs = this.panesWrapper.parent().find('.infotabs').children();
    this.currentTabIdx = 0;
    this.segmentsQty = this.totalPaneWidth / this.singlePaneWidth;
    this.segmentCoordinates = {};
    this.panesInner.first().data("offset", 0);

    return this;
  };
  touchPanes.prototype.getSegmentCoordinates = function(qty, portionWidth, totalWidth) {
      var coordinates = [],
        lastStart = 0,
        lastEnd = portionWidth;

      for (var i = 0; i < qty; i++) {
        var dimensions = {};

        if (i === 0) {
          dimensions.start = lastStart;
          dimensions.end = lastEnd;
        } else {
          dimensions.start = lastEnd;
          dimensions.end = lastEnd + portionWidth;
        }

        lastStart = dimensions.end;
        lastEnd = dimensions.end;

        coordinates.push(dimensions);
      }

      return coordinates;
  };
  touchPanes.prototype.generatePrefixedCss = function(element, rule, value) {
      var prefixes = ['webkit', 'Moz', 'ms'];

      for (var i = 0; i < prefixes.length; i++) {
        var prefixedProp = prefixes[i] + rule;
        element.css(prefixedProp, value);
      }

      element.css(rule.toLowerCase(), value);
  };
  touchPanes.prototype.changePane = function(newPaneIndex) {
      var scrollPos = this.segmentCoordinates[newPaneIndex].start;

      this.panesInner.addClass('transition');
      this.generatePrefixedCss(this.panesInner, 'Transform', 'translateX(-' + scrollPos + 'px)');
      //panesInner.style.transform = 'translateX(-' + scrollPos + 'px)';
      this.panesInner.first().data("offset", -scrollPos);

      this.tabs.each(function(index, tab) {
        $(tab).removeClass('active');
      });

      this.panes.each(function(index, pane) {
        $(pane).removeClass('active');
      });

      $(this.tabs[newPaneIndex]).addClass('active');
      $(this.panes[newPaneIndex]).addClass('active');

      this.currentTabIdx = newPaneIndex;
      if ("undefined" !== typeof this.opts.change) {
        this.opts.change(newPaneIndex);
      }
  };

  touchPanes.prototype.touch = function() {
    var self = this;
    this.myTouchPanes = new swinch();
    this.myTouchPanes.init(this.panesWrapper, {
        onMove: function(distance, direction) {
          var currentOffset = self.panesInner.first().data("offset");
          self.panesInner.removeClass('transition');

          if (currentOffset == 0 && direction == 'right') {
            // at start, can't move to the left
          } else if (currentOffset == finalPos && direction == 'left') {
            // at end, can't move to the right
          } else {
            var move = distance + parseInt(currentOffset);

            self.panesInner.css({
                'webkitTransform': 'translateX(' + move + 'px)',
                'MozTransform': 'translateX(' + move + 'px)',
                'msTransform': 'translateX(' + move + 'px)',
                'transform': 'translateX(' + move + 'px)'
            });
          }
        },
        onEnd: function(distance, direction, time) {
          var currentOffset = parseInt(self.panesInner.first().data("offset"));

          if (currentOffset == 0 && direction == 'right') {
            //
          } else if (currentOffset == finalPos && direction == 'left') {
            //
          } else {
            self.panesInner.addClass('transition');
            var posDistance = distance < 0 ? -distance : distance;

            if (posDistance > self.singlePaneWidth / 2 || time > 50 && time < 200 && posDistance > self.singlePaneWidth / 4) {
              if (direction === 'left') {
                var newOffset = currentOffset - self.singlePaneWidth;

                self.currentTabIdx += 1;
              } else {
                var newOffset = currentOffset + self.singlePaneWidth;

                if (self.currentTabIdx != 0) {
                  self.currentTabIdx -= 1;
                }
              }

              self.changePane(self.currentTabIdx);
              self.panesInner.first().data("offset", newOffset);
            } else {
              self.panesInner.css({
                'webkitTransform': 'translateX(' + currentOffset + 'px)',
                'MozTransform': 'translateX(' + currentOffset + 'px)',
                'msTransform': 'translateX(' + currentOffset + 'px)',
                'transform': 'translateX(' + currentOffset + 'px)'
              });
            }
          }
        }
      });
  };

  touchPanes.prototype.nonTouch = function() {
      var self = this;
      this.tabs.each(function(tabIndex, tab) {
        $(tab).bind('click', function() {
          self.changePane(tabIndex);
        });
      });
  };

  touchPanes.prototype.setupPanes = function() {
      var self = this;
      this.segmentCoordinates = self.getSegmentCoordinates(self.segmentsQty, self.singlePaneWidth, self.totalPaneWidth);

      this.panes.each(function(index, pane) {
        $(pane).children().width(self.singlePaneWidth);
      });
  };

  touchPanes.prototype.resize = function() {
      var self = this;
      $(window).resize(function() {
        self.singlePaneWidth = parseInt(window.getComputedStyle(self.panesWrapper.parent().get(0)).width);
        self.totalPaneWidth = self.panes.length * self.singlePaneWidth;

        self.setupPanes();
        self.changePane(self.currentTabIdx);
      });
  };

  touchPanes.prototype.init = function() {
      this.panes.first().addClass('active');
      this.tabs.first().addClass('active');

      this.setupPanes();
      this.nonTouch();
      this.resize();
      this.touch();
  };

  touchPanes.prototype.destroy = function() {
    this.myTouchPanes.destroy();
    // TODO
  };

  $.fn.extend({
    "touchPanes": function(opts) {
        return new touchPanes(this, opts);
    }
  });
}(jQuery));
