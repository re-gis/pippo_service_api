import { Component, OnInit, Input } from '@angular/core';
import { VideoTutorialService } from '../util/video-tutorial.service';

@Component({
//   moduleId: module.id.toString(),
  selector: 'app-search',
  templateUrl: 'search.component.html',
  styleUrls: ['search.component.css']
})
export class SearchComponent implements OnInit {
  tutorialService: VideoTutorialService;
  activeTab: string;
  _plain: boolean = false;
  _hideable: boolean = false;
  hidden: boolean = false;
  padding: string = null;

  constructor(tutorialService: VideoTutorialService) {
    this.tutorialService = tutorialService;
  }

  @Input()
  set plain(isPlain: boolean) {
    this._plain = isPlain;
  }
  @Input()
  set hideable(isHideable: boolean) {
    this._hideable = isHideable;
    this.padding = isHideable ? '0' : null;
  }

  ngOnInit() {
    this.activeTab = 'simple';
  }

  displayActiveTab() {
    switch (this.activeTab) {
      case 'toggle-hide':
        this.hidden = true;
        break;
      case 'toggle-show':
        this.hidden = false;
        break;
      case 'advanced':
        this.tutorialService.setVideo('https://www.youtube-nocookie.com/embed/NjOC8pMQuu0?rel=0&amp;showinfo=0', 'Advanced Search');
        return;
    }

    this.tutorialService.setVideo(null);
  }
}
