var touchPanes = (function() {
  var panesWrapper = document.getElementById('panes'),
    singlePaneWidth = parseInt(window.getComputedStyle(panesWrapper.parentNode).width),
    panesInner = document.getElementById('inner_panes'),
    panes = Array.prototype.slice.call(panesInner.children),
    totalPaneWidth = panes.length * singlePaneWidth,
    finalPos = -(totalPaneWidth - singlePaneWidth),
    tabs = Array.prototype.slice.call(document.getElementById('infotabs').children),
    currentTabIdx = 0,
    segmentsQty = totalPaneWidth / singlePaneWidth,
    segmentCoordinates;

  panesInner.dataset.offset = 0;

  return {
    getSegmentCoordinates: function(qty, portionWidth, totalWidth) {
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
    },

    generatePrefixedCss: function(element, rule, value) {
      var prefixes = ['webkit', 'Moz', 'ms'];

      for (var i = 0; i < prefixes.length; i++) {
        var prefixedProp = prefixes[i] + rule;
        element.style[prefixedProp] = value;
      }

      element.style[rule.toLowerCase()] = value;
    },

    changePane: function(newPaneIndex) {
      var scrollPos = segmentCoordinates[newPaneIndex].start;

      panesInner.classList.add('transition');
      this.generatePrefixedCss(panesInner, 'Transform', 'translateX(-' + scrollPos + 'px)');
      //panesInner.style.transform = 'translateX(-' + scrollPos + 'px)';
      panesInner.dataset.offset = -scrollPos;

      tabs.forEach(function(tab) {
        tab.classList.remove('active');
      });

      panes.forEach(function(pane) {
        pane.classList.remove('active');
      });

      tabs[newPaneIndex].classList.add('active');
      panes[newPaneIndex].classList.add('active');

      currentTabIdx = newPaneIndex;
    },

    touch: function() {
      var myTouchPanes = new swinch(panesWrapper, {
        onMove: function(distance, direction) {
          var currentOffset = panesInner.dataset.offset;
          panesInner.classList.remove('transition');

          if (currentOffset == 0 && direction == 'right') {
            // at start, can't move to the left
          } else if (currentOffset == finalPos && direction == 'left') {
            // at end, can't move to the right
          } else {
            var move = distance + parseInt(currentOffset);

            //this.generatePrefixedCss(panesInner, 'Transform', 'translateX(' + move + 'px)'); //this is proving too slow for 1:1 translating
            panesInner.style.webkitTransform = 'translateX(' + move + 'px)';
            panesInner.style.MozTransform = 'translateX(' + move + 'px)';
            panesInner.style.msTransform = 'translateX(' + move + 'px)';
            panesInner.style.transform = 'translateX(' + move + 'px)';
          }
        },

        onEnd: function(distance, direction, time) {
          var currentOffset = parseInt(panesInner.dataset.offset);

          if (currentOffset == 0 && direction == 'right') {
            //
          } else if (currentOffset == finalPos && direction == 'left') {
            //
          } else {
            panesInner.classList.add('transition');
            var posDistance = distance < 0 ? -distance : distance;

            if (posDistance > singlePaneWidth / 2 || time > 50 && time < 200 && posDistance > singlePaneWidth / 4) {
              if (direction === 'left') {
                var newOffset = currentOffset - singlePaneWidth;

                currentTabIdx += 1;
              } else {
                var newOffset = currentOffset + singlePaneWidth;

                if (currentTabIdx != 0)
                  currentTabIdx -= 1;
              }

              touchPanes.changePane(currentTabIdx);
              panesInner.dataset.offset = newOffset;
            } else {
              //this.generatePrefixedCss(panesInner, 'Transform', 'translateX(' + currentOffset + 'px)');
              panesInner.style.webkitTransform = 'translateX(' + currentOffset + 'px)';
              panesInner.style.MozTransform = 'translateX(' + currentOffset + 'px)';
              panesInner.style.msTransform = 'translateX(' + currentOffset + 'px)';
              panesInner.style.transform = 'translateX(' + currentOffset + 'px)';
            }
          }
        }
      });
    },

    nonTouch: function() {
      tabs.forEach(function(tab, tabIndex) {
        tab.addEventListener('click', function() {
          touchPanes.changePane(tabIndex);
        });
      });
    },

    setupPanes: function() {
      segmentCoordinates = touchPanes.getSegmentCoordinates(segmentsQty, singlePaneWidth, totalPaneWidth);

      panes.forEach(function(pane) {
        pane.children[0].style.width = singlePaneWidth + 'px';
      });
    },

    resize: function() {
      window.onresize = function() {
        singlePaneWidth = parseInt(window.getComputedStyle(panesWrapper.parentNode).width);
        totalPaneWidth = panes.length * singlePaneWidth;

        touchPanes.setupPanes();
        touchPanes.changePane(currentTabIdx);
      };
    },

    init: function() {
      panes[0].classList.add('active');
      tabs[0].classList.add('active');

      this.setupPanes();
      this.nonTouch();
      this.resize();
      this.touch();
    }
  };
})();

touchPanes.init();
