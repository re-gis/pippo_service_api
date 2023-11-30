import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Base64, SearchService } from '../search/search.service';
import { PropertyService } from '../property/property.service';
import { VideoTutorialService } from '../util/video-tutorial.service';

declare let numeral:any;

@Component({
//   moduleId: module.id.toString(),
  selector: 'app-dashboard',
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  searchService: SearchService;
  propertyService: PropertyService;
  tutorialService: VideoTutorialService;
  pageTitle:string;
  hoveredArticle: any = null;
  backgroundOffset: number = 0;
  backgroundName: string = 'background1.jpg';
  backgroundPosition: string = 'center 60%';
  backgroundLabel: string = '';
  private backgroundPositions: Array<number> = [102, 3, 76, 10, 44, 70, 102, 94];
  private backgroundLabels: Array<string> = ["Dallas, TX", "Austin, TX", "Houston, TX", "Dallas, TX", "Amarillo, TX", "Houston, TX", "San Antonio, TX", "Galveston, TX"];
  animation = true;
  @ViewChild('pwHar') public pwHar: ElementRef;
  @ViewChild('pwNtreis') public pwNtreis: ElementRef;
  resetScroll: boolean = false;
  newNtreis: any = null;
  newHar: any = null;

  constructor(
    private router: Router,
    searchService: SearchService,
    propertyService: PropertyService,
    tutorialService: VideoTutorialService
  ) {
    this.searchService = searchService;
    this.propertyService = propertyService;
    this.tutorialService = tutorialService;
  }

  ngOnInit() {
    this.pageTitle = "Dashboard";
    this.setBackgroundImage();
    this.searchService.watchlistPage = 0;
    this.searchService.getFullWatchlistProperties((error:any, caught: Observable<any>) => {
      return caught;
    });
    this.searchService.getNewProperties('NTREIS', data => {
      this.newNtreis = data;
      this.resetScroll = true;
    }, (error:any, caught: Observable<any>) => {
      return caught;
    });
    this.searchService.getNewProperties('HAR', data => {
      this.newHar = data;
      this.resetScroll = true;
    }, (error:any, caught: Observable<any>) => {
      return caught;
    });
    
    this.searchService.getAuctionMetadata(10);
//    this.searchService.getCraigslistMetadata();
    this.tutorialService.setVideo('https://www.youtube-nocookie.com/embed/THV6J256jas?rel=0&amp;showinfo=0', 'Dashboard Introduction');
  }

  defaultSearch(region) {
    let encodedQuery = Base64.encode(JSON.stringify(this.searchService.getDefaultSearch(region)));
    this.searchService.backToSearch = false;
    this.router.navigate(['/search-results', encodedQuery]);
  }

  scrollHorizontal(w) {
    if (w && w.nativeElement) {
      if (this.resetScroll || w.nativeElement.scrollLeft >= w.nativeElement.scrollWidth - w.nativeElement.clientWidth) {
        w.nativeElement.scrollTo({
          left: 0,
          behavior: 'smooth'
        });
      } else {
        w.nativeElement.scrollTo({
          left: w.nativeElement.scrollLeft + 360,
          behavior: 'smooth'
        });
      }
    }
  }

  ngAfterViewInit(): void {
    Observable.interval(3000)
      .takeWhile(tick => this.animation)
      .repeat(99)
      .map(() => {
        this.scrollHorizontal(this.pwHar);
        this.scrollHorizontal(this.pwNtreis);
        this.resetScroll = false;
      })
      .subscribe();
  }

  toggleWatchlistSearchListing(id: any) {
    this.searchService.toggleWatchlistSearchListing(id, (error:any, caught: Observable<any>) => {
      return caught;
    });
  }

  viewProperty(property: any) {
    this.router.navigate(['/property', this.searchService.getPropertyId(property, false)]);
  }

  viewAuctionCounty(acm: any) {
    this.router.navigate(['/auction-search', 'county=' + acm.county]);
  }

  viewCraigslist(region: any) {
    this.router.navigate(['/cl-list', 'region=' + region + '&page=1']);
  }

  roundDom(dom) {
    for (let i = 14; i < 365; i += 14) if (dom < i) return '< ' + i;
    return '> 365';
  }

  calculatePriceChange(property): number {
    if (!property.mls || !property.mls.originalListPrice || !property.mls.listPrice) {
      return 0;
    }
    const originalPrice = property.mls.originalListPrice;
    const lastPrice = property.mls.listPrice;

    return Math.sign(((originalPrice - lastPrice) / originalPrice) * 100);
  }

  private offsetBackgroundImage() {
    ++this.backgroundOffset;
    this.setBackgroundImage();
  }

  private setBackgroundImage() {
    let o = Math.floor((new Date().getDate() + this.backgroundOffset) % 8);
    this.backgroundName = 'background' + (o + 1) + '.jpg';
    this.backgroundPosition = 'center ' + this.backgroundPositions[o] + '%';
    this.backgroundLabel = this.backgroundLabels[o];
  }
}

