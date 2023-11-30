import { Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { PropertyService } from './property.service';
import { NotesService } from './notes.service';
import { SearchService } from '../search/search.service';
import { GoogleStreetviewComponent } from '../map/google-streetview.component';
import * as moment from 'moment/moment';


@Component({
//   moduleId: module.id.toString(),
  selector: 'app-property-general',
  templateUrl: 'property-general.component.html',
  styleUrls: ['property.component.css']
})
export class PropertyGeneralComponent implements OnInit {
  propertyService: PropertyService;
  searchService: SearchService;
  notesService: NotesService;
  photoCount: number;
  taxTab: number;
  remarksTab: number;
  auctionTab: number;
  curYear: number;
  viewedAccordions: boolean;
  viewedAccordion;
  oldMls: boolean = false;
  photosUpload: FileList = null;
  schoolType: string = null;

  constructor(propertyService: PropertyService,
        searchService: SearchService,
        notesService: NotesService) {
    this.propertyService = propertyService;
    this.searchService = searchService;
    this.notesService = notesService;
  }

  ngOnInit() {
    this.photoCount = 0;
    this.taxTab = 1;
    this.remarksTab = 1;
    this.auctionTab = 1;
    this.curYear = moment().year();
    this.viewedAccordions = false;
    this.viewedAccordion = -1;
    this.oldMls = false;

    for (let pf of this.propertyService.getPropertyFlags()) {
      if (pf.flag == 'oldmls') {
        this.oldMls = true;
      }
    }
  }

  doChange() {
    // Do nothing, just trigger update cycle; this prevents an issue with
    // clicking on a tab other than general, then clicking back to general.
    return true;
  }

  downloadNote(note) {
    if (!note.download) {
      return;
    }

    var link = (<any> document).createElement('a');
    link.download = note.downloadName;
    link.href = note.download;
    link.click();
  }

  isMapActive() {
    let prop = this.propertyService.getCurrentProperty();
    return prop && prop.location && prop.location.latitude && prop.location.longitude;
  }

  useAttomSchools() {
    if (this.schoolType) {
      return this.schoolType == 'attom';
    }

    let prop = this.propertyService.getCurrentProperty('mls');

    if (prop && prop.mls && prop.mls.school) {
      this.schoolType = 'mls';
      return false;
    }

    // Use ATTOM schools, and trigger that request now
    this.propertyService.getAttomSchools(this.propertyService.getAttomId(), () => {}, () => {});
    this.schoolType = 'attom';
    return true;
  }

// --- This should really be extracted to its own object
  handlePhotoInput(files: FileList) {
    this.photosUpload = files;
  }

  onPhotoUpload(inputfield) {
    if (this.photosUpload == null) {
      return;
    }

    this.notesService.postGalleryPhotos(this.propertyService.getPropertyId(), this.photosUpload, uploadedUrls => {
      inputfield.value = null;
      this.photosUpload = null;
      this.propertyService.appendUserPhotos(uploadedUrls.replace('[', '').replace(']', '').trim().split(/,\s*/));
    }, () => {
      console.log('Photo upload failed');
    });
  }
// ---

  setTaxTab(tab: number) {
    this.taxTab = tab;
  }

  setRemarksTab(tab: number) {
    this.remarksTab = tab;
  }

  setAuctionTab(tab: number) {
    this.auctionTab = tab;
  }
}
