import { Component, OnInit } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { SearchService } from '../search/search.service';
import { AuthService } from '../auth/auth.service';
import { VideoTutorialService } from '../util/video-tutorial.service';

@Component({
//   moduleId: module.id.toString(),
  selector: 'app-header',
  templateUrl: 'header.component.html'
})
export class HeaderComponent implements OnInit {
  searchService: SearchService;
  authService: AuthService;
  tutorialService: VideoTutorialService;
  siteTitle: string;
  isFullScreen: boolean;

  constructor(
    private router: Router,
    searchService: SearchService,
    authService: AuthService,
    tutorialService: VideoTutorialService
  ) {
    this.searchService = searchService;
    this.authService = authService;
    this.tutorialService = tutorialService;

    router.events.subscribe(e => {
        if (e instanceof NavigationStart) {
          this.searchService.relevantMlsContext = '';
        }
    });
  }

  ngOnInit() {
    this.siteTitle = 'HomeInvestorTool.com';
    this.isFullScreen = false;
    if (this.authService.isAuthenticated()) {
        this.searchService.getWatchlistProperties((error:any, caught: Observable<any>) => {
          console.log(error);
          return caught;
        });
    }
  }

  toggleFullscreen() {
    this.isFullScreen = !this.isFullScreen;
  }

  cancelFullScreen() {
    this.isFullScreen = false;
  }

  logout() {
    this.authService.handleLogout();
    this.router.navigate(['/login']);
  }

  tutorial() {
    if (this.tutorialService.showVideo) {
      this.tutorialService.hide();
    } else {
      this.tutorialService.showIfValid();
    }
  }
}
