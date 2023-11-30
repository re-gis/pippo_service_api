//  Custom Functions
jQuery.fn.selectText = function() {
  var range, selection;
  return this.each(function() {
    if (document.body.createTextRange) {
      range = document.body.createTextRange();
      range.moveToElementText(this);
      range.select();
    } else if (window.getSelection) {
      selection = window.getSelection();
      range = document.createRange();
      range.selectNodeContents(this);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  });
};

//  ------------------------------------------------
//  Dashboard
//  Dashboard :hover effects
$('.dashboard article').mouseenter(
  function(e) {
    e.preventDefault();
		$(this).addClass('is-preview').siblings().addClass('is-dimmed');
	}	
);
$('.dashboard article').mouseleave(
  function(e) {
    e.preventDefault();
		$(this).removeClass('is-preview').siblings().removeClass('is-dimmed');
	}	
);



//  ------------------------------------------------
//  Table
//  Watchlist
$('.widget.table .watchlist-select').click(
  function(e) {
    e.preventDefault();
    $(this).parent('tr').toggleClass('is-watchlisted');
  }
);



//  ------------------------------------------------
//  Modals
//  Add Column Modal
/*
$('.table .add-column').click(
  function(e) {
    e.preventDefault();
    $.get('modals/add-column.html', function(data) {
      $('.modal-container').append(data).addClass('is-active');
    });
  }
);
*/
$('.open-modal').click(
  function(e) {
    e.preventDefault();
    var modal_link = $(this).data('open');
    $.get(modal_link, function(data) {
      $('.modal-container').append(data).addClass('is-active');
    });
    var modal_height = $('.modal').outerHeight();
    var window_height = $(window).height();
    if (modal_height >= window_height) {
//       $('.modal-container').addClass(modal_height);
//       console.log(modal_height);
    } else {
//       $('.modal-container').addClass(modal_height);
//       console.log(modal_height);
    }
  }
);
//  Close Modal
$(document).on('click', '.modal .close', function(e) {
    e.preventDefault();
    $('.modal').remove();
    $('.modal-container').toggleClass('is-active');
  }
);



//  ------------------------------------------------
//  Accordions
/*
$(document).on('click', '.accordion > header', function(e) {
    e.preventDefault();
    $(this).parent().toggleClass('is-open');
  }
);
*/


//  ------------------------------------------------
//  Widget Selection
$(document).on('click', '.select', function(e) {
    e.preventDefault();
    e.stopPropagation();
    $(this).toggleClass('is-selected');
  }
);

//  ------------------------------------------------
//  Tabs
$('.tab-selector li').click(
  function(e) {
    e.preventDefault();
    $(this).addClass('is-active').siblings().removeClass('is-active');
    var targetID = $(this).data('show');
    if (targetID) {
// 			var targetID = $(this).data('show');
			$('#'+targetID).addClass('is-active').siblings().removeClass('is-active');
    }
  }
);
$('.tab-selector2 li').click(
  function(e) {
    e.preventDefault();
    $(this).addClass('is-active').siblings().removeClass('is-active');
    var targetID = $(this).data('show');
    if (targetID) {
// 			var targetID = $(this).data('show');
			$('#'+targetID).addClass('is-active').siblings().removeClass('is-active');
    }
  }
);
//  Actions
$('.tab-selector .actions .button').click(
  function(e) {
    e.preventDefault();
    $(this).siblings('.popup').toggleClass('is-visible');
  }
);
$('.tab-selector .actions .popup a').click(
  function(e) {
    e.preventDefault();
    $(this).parent().parent().parent('.popup').removeClass('is-visible');
  }
);

//  ------------------------------------------------
//  Calculator
/*
$('.calculator .editable').click(
  function() {
//     $(this).children('[contenteditable="true"').focus();
    $('.calculator .editable').removeClass('is-focus');
    $(this).addClass('is-focus');
    $('.calculator [contenteditable="true"]').focus(function() {
      $(this).children('[contentditable="true"]').selectText();
    });
  }
);
*/

/*
$('.calculator [contenteditable="true"]:focus').focus(
  function() {
//     $(this).hide();
  }
);
*/
$( ".value" ).delegate( "*", "focus blur", function() {
  var elem = $(this);
  $('[contenteditable="true"]').focus(function() {
    $(this).selectText();
  });
  
//   $(this).parent().addClass('is-focus');
//   var elem = $( this ).parent();
  setTimeout(function() {
    elem.toggleClass( "is-focus", elem.is( ":focus" ) );
    elem.parent().toggleClass( "is-focus", elem.is( ":focus" ) );
  }, 0 );
});

$('.calculator .checkbox input').click(
  function() {
    $(this).parent().parent().parent().toggleClass('is-dimmed');
  }
);

$('.calculator .icon-lock').click(
  function() {
    $(this).closest('.group').toggleClass('is-locked');
  }
);



//  Select Dropdown
$('.calculator .select .value').click(
  function() {
//     e.preventDefault();
    $(this).siblings('.select-dropdown').toggleClass('is-visible');
  }
);
$('.select-dropdown .value').click(
  function() {
    var text = $(this).text();
/*
    if ($(this).hasClass('input')) {
      $(this).keypress(function(e) {
        if(e.which === 13) {
          $(this).siblings().removeClass('is-active');
          $(this).parent().toggleClass('is-visible');
          $(this).parent().siblings('.value').text(text);      
        }
      });
    } else {
*/
      $(this).addClass('is-active').siblings().removeClass('is-active');
      $(this).parent().toggleClass('is-visible');
      $(this).parent().siblings('.value').text(text);      
//     }
  }
);

//  ------------------------------------------------
//  Map & Narrow table

var $mapWidth = $(window).width();
$('.widget.map.full-width').css(
  {
    width: $mapWidth,
  }
);
var $tableWidth = $(window).width() - 160;
$('.widget.table.narrow.full-width').css(
  {
    width: $tableWidth,
  }
);
var $noticeWidth = $(window).width() - 160;
$('.widget.notice.full-width').css(
  {
    width: $noticeWidth,
  }
);
// fade gallery init
function initSlideShow() {
	jQuery('div.slideshow').fadeGallery({
		slides: 'div.slide',
		btnPrev: 'a.btn-prev',
		btnNext: 'a.btn-next',
		pagerLinks: '.pagination li',
		event: 'click',
		autoRotation: true,
		switchTime: 6000,
		autoHeight: true,
		animSpeed: 600
	});
}

// clear inputs on focus
function initInputs() {
	PlaceholderInput.replaceByOptions({
		// filter options
		clearInputs: true,
		clearTextareas: true,
		clearPasswords: true,
		skipClass: 'default',
		
		// input options
		wrapWithElement: false,
		showUntilTyping: false,
		getParentByClass: false,
		placeholderAttr: 'value'
	});
}

/*
 * jQuery SlideShow plugin
 */
;(function($){
	function FadeGallery(options) {
		this.options = $.extend({
			slides: 'ul.slideset > li',
			activeClass:'active',
			disabledClass:'disabled',
			btnPrev: 'a.btn-prev',
			btnNext: 'a.btn-next',
			generatePagination: false,
			pagerList: '<ul>',
			pagerListItem: '<li><a href="#"></a></li>',
			pagerListItemText: 'a',
			pagerLinks: '.pagination li',
			currentNumber: 'span.current-num',
			totalNumber: 'span.total-num',
			btnPlay: '.btn-play',
			btnPause: '.btn-pause',
			btnPlayPause: '.btn-play-pause',
			galleryReadyClass: 'gallery-js-ready',
			autorotationActiveClass: 'autorotation-active',
			autorotationDisabledClass: 'autorotation-disabled',
			autorotationStopAfterClick: false,
			circularRotation: true,
			switchSimultaneously: true,
			disableWhileAnimating: false,
			disableFadeIE: false,
			autoRotation: false,
			pauseOnHover: true,
			autoHeight: false,
			useSwipe: false,
			switchTime: 4000,
			animSpeed: 600,
			event:'click'
		}, options);
		this.init();
	}
	FadeGallery.prototype = {
		init: function() {
			if(this.options.holder) {
				this.findElements();
				this.initStructure();
				this.attachEvents();
				this.refreshState(true);
				this.autoRotate();
				this.makeCallback('onInit', this);
			}
		},
		findElements: function() {
			// control elements
			this.gallery = $(this.options.holder).addClass(this.options.galleryReadyClass);
			this.slides = this.gallery.find(this.options.slides);
			this.slidesHolder = this.slides.eq(0).parent();
			this.stepsCount = this.slides.length;
			this.btnPrev = this.gallery.find(this.options.btnPrev);
			this.btnNext = this.gallery.find(this.options.btnNext);
			this.currentIndex = 0;
			
			// disable fade effect in old IE
			if(this.options.disableFadeIE && !$.support.opacity) {
				this.options.animSpeed = 0;
			}
			
			// create gallery pagination
			if(typeof this.options.generatePagination === 'string') {
				this.pagerHolder = this.gallery.find(this.options.generatePagination).empty();
				this.pagerList = $(this.options.pagerList).appendTo(this.pagerHolder);
				for(var i = 0; i < this.stepsCount; i++) {
					$(this.options.pagerListItem).appendTo(this.pagerList).find(this.options.pagerListItemText).text(i+1);
				}
				this.pagerLinks = this.pagerList.children();
			} else {
				this.pagerLinks = this.gallery.find(this.options.pagerLinks);
			}
			
			// get start index
			var activeSlide = this.slides.filter('.'+this.options.activeClass);
			if(activeSlide.length) {
				this.currentIndex = this.slides.index(activeSlide);
			}
			this.prevIndex = this.currentIndex;
			
			// autorotation control buttons
			this.btnPlay = this.gallery.find(this.options.btnPlay);
			this.btnPause = this.gallery.find(this.options.btnPause);
			this.btnPlayPause = this.gallery.find(this.options.btnPlayPause);
			
			// misc elements
			this.curNum = this.gallery.find(this.options.currentNumber);
			this.allNum = this.gallery.find(this.options.totalNumber);
			
			// handle flexible layout
			$(window).bind('load resize orientationchange', $.proxy(this.onWindowResize, this));
		},
		initStructure: function() {
			this.slides.css({display:'block',opacity:0}).eq(this.currentIndex).css({
				opacity:''
			});
		},
		attachEvents: function() {
			var self = this;
			this.btnPrev.bind(this.options.event, function(e){
				self.prevSlide();
				if(self.options.autorotationStopAfterClick) {
					self.stopRotation();
				}
				e.preventDefault();
			});
			this.btnNext.bind(this.options.event, function(e){
				self.nextSlide();
				if(self.options.autorotationStopAfterClick) {
					self.stopRotation();
				}
				e.preventDefault();
			});
			this.pagerLinks.each(function(ind, obj){
				$(obj).bind(self.options.event, function(e){
					self.numSlide(ind);
					if(self.options.autorotationStopAfterClick) {
						self.stopRotation();
					}
					e.preventDefault();
				});
			});
			
			// autorotation buttons handler
			this.btnPlay.bind(this.options.event, function(e){
				self.startRotation();
				e.preventDefault();
			});
			this.btnPause.bind(this.options.event, function(e){
				self.stopRotation();
				e.preventDefault();
			});
			this.btnPlayPause.bind(this.options.event, function(e){
				if(!self.gallery.hasClass(self.options.autorotationActiveClass)) {
					self.startRotation();
				} else {
					self.stopRotation();
				}
				e.preventDefault();
			});

			// swipe gestures handler
			if(this.options.useSwipe && $.fn.swipe) {
				this.gallery.swipe({
					excludedElements: '',
					fallbackToMouseEvents: false,
					swipeLeft: function() {
						self.nextSlide();
					},
					swipeRight: function() {
						self.prevSlide();
					}
				});
			}
			
			// pause on hover handling
			if(this.options.pauseOnHover) {
				this.gallery.hover(function(){
					if(self.options.autoRotation) {
						self.galleryHover = true;
						self.pauseRotation();
					}
				}, function(){
					if(self.options.autoRotation) {
						self.galleryHover = false;
						self.resumeRotation();
					}
				});
			}
		},
		onWindowResize: function(){
			if(this.options.autoHeight) {
				this.slidesHolder.css({height: this.slides.eq(this.currentIndex).outerHeight(true) });
			}
		},
		prevSlide: function() {
			if(!(this.options.disableWhileAnimating && this.galleryAnimating)) {
				this.prevIndex = this.currentIndex;
				if(this.currentIndex > 0) {
					this.currentIndex--;
					this.switchSlide();
				} else if(this.options.circularRotation) {
					this.currentIndex = this.stepsCount - 1;
					this.switchSlide();
				}
			}
		},
		nextSlide: function(fromAutoRotation) {
			if(!(this.options.disableWhileAnimating && this.galleryAnimating)) {
				this.prevIndex = this.currentIndex;
				if(this.currentIndex < this.stepsCount - 1) {
					this.currentIndex++;
					this.switchSlide();
				} else if(this.options.circularRotation || fromAutoRotation === true) {
					this.currentIndex = 0;
					this.switchSlide();
				}
			}
		},
		numSlide: function(c) {
			if(this.currentIndex != c) {
				this.prevIndex = this.currentIndex;
				this.currentIndex = c;
				this.switchSlide();
			}
		},
		switchSlide: function() {
			var self = this;
			if(this.slides.length > 1) {
				this.galleryAnimating = true;
				if(!this.options.animSpeed) {
					this.slides.eq(this.prevIndex).css({opacity:0});
				} else {
					this.slides.eq(this.prevIndex).stop().animate({opacity:0},{duration: this.options.animSpeed});
				}
				
				this.switchNext = function() {
					if(!self.options.animSpeed) {
						self.slides.eq(self.currentIndex).css({opacity:''});
					} else {
						self.slides.eq(self.currentIndex).stop().animate({opacity:1},{duration: self.options.animSpeed});
					}
					setTimeout(function() {
						self.slides.eq(self.currentIndex).css({opacity:''});
						self.galleryAnimating = false;
						self.autoRotate();
						
						// onchange callback
						self.makeCallback('onChange', self);
					}, self.options.animSpeed);
				}
				
				if(this.options.switchSimultaneously) {
					self.switchNext();
				} else {
					clearTimeout(this.switchTimer);
					this.switchTimer = setTimeout(function(){
						self.switchNext();
					}, this.options.animSpeed);
				}
				this.refreshState();
				
				// onchange callback
				this.makeCallback('onBeforeChange', this);
			}
		},
		refreshState: function(initial) {
			this.slides.removeClass(this.options.activeClass).eq(this.currentIndex).addClass(this.options.activeClass);
			this.pagerLinks.removeClass(this.options.activeClass).eq(this.currentIndex).addClass(this.options.activeClass);
			this.curNum.html(this.currentIndex+1);
			this.allNum.html(this.stepsCount);
			
			// initial refresh
			if(this.options.autoHeight) {
				if(initial) {
					this.slidesHolder.css({height: this.slides.eq(this.currentIndex).outerHeight(true) });
				} else {
					this.slidesHolder.stop().animate({height: this.slides.eq(this.currentIndex).outerHeight(true)}, {duration: this.options.animSpeed});
				}
			}
			
			// disabled state
			if(!this.options.circularRotation) {
				this.btnPrev.add(this.btnNext).removeClass(this.options.disabledClass);
				if(this.currentIndex === 0) this.btnPrev.addClass(this.options.disabledClass);
				if(this.currentIndex === this.stepsCount - 1) this.btnNext.addClass(this.options.disabledClass);
			}
		},
		startRotation: function() {
			this.options.autoRotation = true;
			this.galleryHover = false;
			this.autoRotationStopped = false;
			this.resumeRotation();
		},
		stopRotation: function() {
			this.galleryHover = true;
			this.autoRotationStopped = true;
			this.pauseRotation();
		},
		pauseRotation: function() {
			this.gallery.addClass(this.options.autorotationDisabledClass);
			this.gallery.removeClass(this.options.autorotationActiveClass);
			clearTimeout(this.timer);
		},
		resumeRotation: function() {
			if(!this.autoRotationStopped) {
				this.gallery.addClass(this.options.autorotationActiveClass);
				this.gallery.removeClass(this.options.autorotationDisabledClass);
				this.autoRotate();
			}
		},
		autoRotate: function() {
			var self = this;
			clearTimeout(this.timer);
			if(this.options.autoRotation && !this.galleryHover && !this.autoRotationStopped) {
				this.gallery.addClass(this.options.autorotationActiveClass);
				this.timer = setTimeout(function(){
					self.nextSlide(true);
				}, this.options.switchTime);
			} else {
				this.pauseRotation();
			}
		},
		makeCallback: function(name) {
			if(typeof this.options[name] === 'function') {
				var args = Array.prototype.slice.call(arguments);
				args.shift();
				this.options[name].apply(this, args);
			}
		}
	}

	// jquery plugin
	$.fn.fadeGallery = function(opt){
		return this.each(function(){
			$(this).data('FadeGallery', new FadeGallery($.extend(opt,{holder:this})));
		});
	}
}(jQuery));