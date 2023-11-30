import { Directive } from "@angular/core";

var incrementingID = 0;

interface SlideshowConfig {
	count: number ;
}

@Directive({
	selector: "[simpleSlider]",
	inputs: [ "config: simpleSlider" ],
	host: {
		"[attr.data-simple-slider-id]": "id",
		"[class.simple-slider-directive]": "true"
	}
})
export class SimpleSliderDirective {

	public config: SlideshowConfig;
	public id: string;

	private styleElement: HTMLStyleElement | null;

	constructor() {
		this.id = `simple-slider-${ ++incrementingID }`;
		this.styleElement = null;
	}

	public ngOnDestroy() : void {
		if ( this.styleElement ) {
			document.head.removeChild( this.styleElement );
		}
	}

    public ngOnInit() : void {
        var count = this.config.count;

        if (count < 4) {
          count = 0;
        } else {
          count = count - 1;
        }

        var to = (count * 350) - (3 * 350 - (count * 10));
        var total = count * 3;
		var keyframes: string[] = [];

			keyframes.push(
				`
                from {
                    -webkit-transform: translateX(0px) ;
                        -ms-transform: translateX(0px) ;
                            transform: translateX(0px) ;
                }
                
                to {
                    -webkit-transform: translateX(-${to}px);
                        -ms-transform: translateX(-${to}px);
                            transform: translateX(-${to}px);
                  }
				`
			);

		this.styleElement = document.createElement( "style" );
		this.styleElement.type = "text/css";
		this.styleElement.textContent =
		`
			@keyframes ${ this.id }-keyframes {
				${ keyframes.join( "" ) }
			}
			.simple-slider-directive[ data-simple-slider-id = '${ this.id }' ] {
                animation-name: ${ this.id }-keyframes ;
                animation-duration: ${ total }s;
                animation-timing-function: linear;
                animation-iteration-count: infinite;
                animation-fill-mode: both;
                animation-direction: alternate;

                
                -webkit-animation-name: ${ this.id }-keyframes ;
                animation-name: ${ this.id }-keyframes ;
                -webkit-animation-duration: ${ total }s;
                        animation-duration: ${ total }s;
                -webkit-animation-timing-function: linear;
                        animation-timing-function: linear;
                -webkit-animation-iteration-count: infinite;
                        animation-iteration-count: infinite;
                -webkit-animation-fill-mode: both;
                        animation-fill-mode: both;
                -webkit-animation-direction: alternate;
                        animation-direction: alternate;
			}
		`;

		document.head.appendChild( this.styleElement );

	}

}
