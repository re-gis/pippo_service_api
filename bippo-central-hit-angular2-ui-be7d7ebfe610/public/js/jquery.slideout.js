/*
    tabSlideOUt v1.3

    By William Paoli: http://wpaoli.building58.com

    To use you must have an image ready to go as your tab
    Make sure to pass in at minimum the path to the image and its dimensions:

    example:

        $('.slide-out-div').tabSlideOut({
                tabHandle: '.handle',                         //class of the element that will be your tab -doesnt have to be an anchor
                pathToTabImage: 'images/contact_tab.gif',     //relative path to the image for the tab *required*
                imageHeight: '133px',                         //height of tab image *required*
                imageWidth: '44px',                           //width of tab image *required*
        });


*/


(function($){
    $.fn.tabSlideOut = function(callerSettings) {
        var settings = $.extend({
            tabHandle: '.handle',
            speed: 300,
            action: 'click',
            tabLocation: 'left',
            topPos: '200px',
            leftPos: '20px',
            fixedPosition: false,
            positioning: 'absolute',
            pathToTabImage: null,
            imageHeight: null,
            imageWidth: null,
            onLoadSlideOut: false,
            onToggleSlide: null
        }, callerSettings||{});

        var obj = this;
        settings.tabHandle = $(this).find(settings.tabHandle);
        if (settings.fixedPosition === true) {
            settings.positioning = 'fixed';
        } else {
            settings.positioning = 'absolute';
        }

        //ie6 doesn't do well with the fixed option
        if (document.all && !window.opera && !window.XMLHttpRequest) {
            settings.positioning = 'absolute';
        }



        //set initial tabHandle css

        if (settings.pathToTabImage != null) {
            settings.tabHandle.css({
            'background-image' : 'url('+settings.pathToTabImage+')',
			'background-repeat' : 'no-repeat',
            'width' : settings.imageWidth,
            'height': settings.imageHeight,
            'textIndent' : '-99999px'
            });
        }

        settings.tabHandle.css({
            'display': 'block',
            'outline' : 'none',
            'position' : 'absolute'
        });

        obj.css({
            'line-height' : '1',
            'position' : settings.positioning
        });


        var properties = {
                    containerWidth: parseInt(obj.outerWidth(), 10) + 'px',
                    containerHeight: parseInt(obj.outerHeight(), 10) + 'px',
                    tabWidth: parseInt(settings.tabHandle.outerWidth(), 10) + 'px',
                    tabHeight: parseInt(settings.tabHandle.outerHeight(), 10) + 'px'
                };

        //set calculated css
        if(settings.tabLocation === 'top' || settings.tabLocation === 'bottom') {
            obj.css({'left' : settings.leftPos});
            settings.tabHandle.css({'right' : 0});
        }

        if(settings.tabLocation === 'top') {
            obj.css({'top' : '-' + properties.containerHeight});
            settings.tabHandle.css({'bottom' : '-' + properties.tabHeight});
        }

        if(settings.tabLocation === 'bottom') {
            obj.css({'bottom' : '-' + properties.containerHeight, 'position' : 'fixed'});
            settings.tabHandle.css({'top' : '-' + properties.tabHeight});

        }

        if(settings.tabLocation === 'left' || settings.tabLocation === 'right') {
            obj.css({
                'height' : properties.containerHeight,
                'top' : settings.topPos
            });

            settings.tabHandle.css({'top' : 0});
        }

        if(settings.tabLocation === 'left') {
            obj.css({ 'left': '-' + properties.containerWidth});
            settings.tabHandle.css({'right' : '-' + properties.tabWidth});
        }

        if(settings.tabLocation === 'right') {
            obj.css({ 'right': '-' + properties.containerWidth});
            settings.tabHandle.css({'left' : '-' + properties.tabWidth});

            $('html').css('overflow-x', 'hidden');
        }

        //functions for animation events

        settings.tabHandle.click(function(event){
            event.preventDefault();
        });

        var slideIn = function() {

            if (settings.tabLocation === 'top') {
                obj.animate({top:'-' + properties.containerHeight}, settings.speed).removeClass('open');
            } else if (settings.tabLocation === 'left') {
                obj.animate({left: '-' + properties.containerWidth}, settings.speed).removeClass('open');
            } else if (settings.tabLocation === 'right') {
                obj.animate({right: '-' + properties.containerWidth}, settings.speed).removeClass('open');
            } else if (settings.tabLocation === 'bottom') {
                obj.animate({bottom: '-' + properties.containerHeight}, settings.speed).removeClass('open');
            }

        };

        var slideOut = function() {

            if (settings.tabLocation == 'top') {
                obj.animate({top:'-3px'},  settings.speed).addClass('open');
            } else if (settings.tabLocation == 'left') {
                obj.animate({left:'0px'},  settings.speed).addClass('open');
            } else if (settings.tabLocation == 'right') {
                obj.animate({right:'0px'},  settings.speed).addClass('open');
            } else if (settings.tabLocation == 'bottom') {
                obj.animate({bottom:'-3px'},  settings.speed).addClass('open');
            }
        };

        var clickScreenToClose = function() {
            obj.click(function(event){
                event.stopPropagation();
            });

            $(document).click(function(){
                slideIn();
                if (settings.onToggleSlide) {
                    settings.onToggleSlide("in", 0);
                }
            });
        };

        var clickAction = function(){
            settings.tabHandle.click(function(event){
                if (obj.hasClass('open')) {
                    slideIn();
                    if (settings.onToggleSlide) {
                        settings.onToggleSlide("in", 0);
                    }
                } else {
                    slideOut();
                    if (settings.onToggleSlide) {
                        settings.onToggleSlide("out", properties.containerWidth);
                    }
                }
            });

            clickScreenToClose();
        };

        var hoverAction = function(){
            obj.hover(
                function(){
                    slideOut();
                    if (settings.onToggleSlide) {
                        settings.onToggleSlide("out", properties.containerWidth);
                    }
                },

                function(){
                    slideIn();
                    if (settings.onToggleSlide) {
                        settings.onToggleSlide("in", 0);
                    }
                });

                settings.tabHandle.click(function(event){
                    if (obj.hasClass('open')) {
                        slideIn();
                        if (settings.onToggleSlide) {
                            settings.onToggleSlide("in", 0);
                        }
                    }
                });
                clickScreenToClose();

        };

        var slideOutOnLoad = function(){
            slideIn();
            setTimeout(function() {
                slideOut();
                if (settings.onToggleSlide) {
                    settings.onToggleSlide("out", properties.containerWidth);
                }
            }, 500);
        };

        //choose which type of action to bind
        if (settings.action === 'click') {
            clickAction();
        }

        if (settings.action === 'hover') {
            hoverAction();
        }

        if (settings.onLoadSlideOut) {
            slideOutOnLoad();
        }

    };
})(jQuery);
