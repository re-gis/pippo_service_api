import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import { environment } from '../environment';
import * as moment from 'moment/moment';

@Injectable()
export class VideoTutorialService {
  public showVideo: boolean = false;
  public videoTitle: string = null;
  public videoUrl: string = null;
  public sanitizedVideoUrl: any = null;
  private sanitizer: DomSanitizer;

  constructor(sanitizer: DomSanitizer) {
    console.log("Init video-tutorial service");
    this.sanitizer = sanitizer;
  }

  isShown() {
    return this.showVideo;
  }

  show() {
    if (this.showVideo) {
      return;
    }

    this.toggle();
  }

  showIfValid() {
    if (this.videoUrl && !this.showVideo) {
      this.toggle();
    }
  }

  hide() {
    if (!this.showVideo) {
      return;
    }

    this.toggle();
  }

  toggle() {
    this.showVideo = !this.showVideo;
  }

  setVideo(url: string, title: string = null) {
    this.hide();
    this.videoUrl = url;
    this.videoTitle = title;
    this.sanitizedVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.videoUrl);
    console.log('Set video to ' + title + ', ' + url);
  }
}
