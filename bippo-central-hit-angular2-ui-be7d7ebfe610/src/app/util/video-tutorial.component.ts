import { Component, OnInit } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, Event as NavigationEvent } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { VideoTutorialService } from './video-tutorial.service';

@Component({
//   moduleId: module.id.toString(),
  selector: 'app-video-tutorial',
  templateUrl: 'video-tutorial.component.html'
})
export class VideoTutorialComponent implements OnInit {
  tutorialService: VideoTutorialService;

  constructor(private router: Router, tutorialService: VideoTutorialService) {
    this.tutorialService = tutorialService;

    router.events.subscribe(e => {
        if (e instanceof NavigationStart) {
          this.tutorialService.setVideo(null);
        }
    });
  }

  ngOnInit() {
  }
}
