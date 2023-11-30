import { Injectable, NgZone } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import { environment } from '../environment';
import { AuthService } from '../auth/auth.service';
import { SearchService } from '../search/search.service';
import * as moment from 'moment/moment';

@Injectable()
export class NotesService {
  ngZone: NgZone;
  authService: AuthService;
  searchService: SearchService;
  notes: Array<any>;
  newnote: string;
  page: number;
  size: number;
  photoAddendum: Array<any>;
  savedCompalator: any;
  private queuedBippoId: string;
  private loadedBippoId: string;
  public static readonly noteAttachmentDownloads: Array<string> = ["spreadsheet module"];

  constructor(private _http: Http, ngZone: NgZone, authService: AuthService, searchService: SearchService) {
    console.log("Init notes service!");
    this.ngZone = ngZone;
    this.authService = authService;
    this.searchService = searchService;
    this.notes = [];
    this.newnote = "";
    this.size = 20;
    this.page = 0;
    this.photoAddendum = null;
    this.savedCompalator = null;
    this.queuedBippoId = null;
    this.loadedBippoId = null;
  }

  formatNoteSource(noteType) {
    switch (noteType) {
      case 'TEXTUAL':
        return 'textual';
      case 'SYSTEM':
        return 'system';
    }

    return '';
  }

  formatNoteTimestamp(timeMillis) {
    let date = new Date(timeMillis);
    return date.toLocaleDateString("en-US") + ' ' + date.toLocaleTimeString("en-US");
  }

  getPropertyNotes(bippoId, errorHandler) {
    let headers = new Headers({"Authorization": "Bearer " + this.authService.getToken()});
    this.queuedBippoId = bippoId;

    return this._http.get(environment.API_ENDPOINT + 'property/' + encodeURIComponent(bippoId) + '/notes', {headers: headers})
      .subscribe(
        res => {
          let data:any = res.json();

          this.loadedBippoId = this.queuedBippoId;
          this.notes = [];

          for (let note in data) {
            this.notes.push(data[note]);
          }

          this.notes.reverse();
          this.notes = this.notes.filter(a => Boolean(a));

          for (let note of this.notes) {
            if (note.attachment && note.attachment.length > 0) {
              for (let att of note.attachment) {
                if (NotesService.noteAttachmentDownloads.indexOf(att.type) >= 0) {
                  note.downloadName = att.filename;
                  note.download = 'data:text/csv,' + encodeURIComponent(att.description);
                  break;
                }
              }
            }
          }

          console.log("Setting property notes", this.notes);
        },
        error => errorHandler
      );
  }

  savePropertyNote(bippoId, errorHandler, clearNote: boolean = true) {
    if ("" !== this.newnote) {
        let headers = new Headers({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this.authService.getToken()
        });
        let options = new RequestOptions({ headers: headers });
        let method = "post";
        let data = {
          content: this.newnote
        };

        return this._http[method](environment.API_ENDPOINT + 'property/' + encodeURIComponent(bippoId) + '/notes', JSON.stringify(data), options)
          .subscribe(
            res => {
                if (this.loadedBippoId && bippoId == this.loadedBippoId) {
                  console.log('Recaching notes for ' + bippoId + ' as we have saved a note to it..');
                  this.getPropertyNotes(bippoId, (error, caught) => {
                    console.log(error);
                    return caught;
                  });
                }

                if (clearNote) {
                  this.newnote = "";
                }

                this.searchService.triggerWatchlistClientSide(bippoId);
                return null;
            },
            error => errorHandler
          );
      }
  }

  getPhotoAddendum(bippoId, successHandler, errorHandler) {
    let headers = new Headers({ "Authorization": "Bearer " + this.authService.getToken() });

    return this._http.get(environment.API_ENDPOINT + 'notes/addendum/' + encodeURIComponent(bippoId), { headers: headers })
      .subscribe(
        res => {
          let data:any = res.json();

          if (data.photos) {
            this.photoAddendum = data.photos;
          } else {
            this.photoAddendum = null;
          }

          successHandler(this.photoAddendum);
        },
        error => errorHandler
      );
  }

  postPhotoAddendum(photoAddendumPayload, successHandler, errorHandler) {
    let headers = new Headers({
      "Authorization": "Bearer " + this.authService.getToken(),
      "Content-Type": "application/json"
    });
    this._http.post(environment.API_ENDPOINT + 'notes/addendum', JSON.stringify(photoAddendumPayload), { headers: headers })
      .subscribe(
        res => {
          // Photo addendum only operates on the current property, so we do not need to check (nor are we given) a bippoId
          if (this.loadedBippoId) {
            console.log('Recaching notes for ' + this.loadedBippoId + ' as we have saved a note to it..');
            this.getPropertyNotes(this.loadedBippoId, (error, caught) => {
              console.log(error);
              return caught;
            });
          }

          if (Math.floor(res["status"] / 100) == 2) {
            this.searchService.triggerWatchlistClientSide(this.loadedBippoId);
            successHandler();
          } else {
            errorHandler('Got status code ' + res["status"], null);
          }
        },
        error => errorHandler
      );
  }

  postGalleryPhotos(bippoId, files: FileList, successHandler, errorHandler) {
    let headers = new Headers({ "Authorization": "Bearer " + this.authService.getToken() });

    const formData: FormData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append('files', files.item(i));
    }

    this._http.post(environment.API_ENDPOINT + 'photos/' + encodeURIComponent(bippoId) + '/upload', formData, { headers: headers })
      .subscribe(
        res => {
          successHandler(res.text());
        },
        error => errorHandler
      );
  }

  getCompalatorDetails(bippoId, successHandler, errorHandler) {
    let headers = new Headers({ "Authorization": "Bearer " + this.authService.getToken() });

    return this._http.get(environment.API_ENDPOINT + 'notes/compalator/' + encodeURIComponent(bippoId), { headers: headers })
      .subscribe(
        res => {
          let data = null;

          try {
            data = res.json();
          } catch (e) {
            // response may have been empty
          }

          if (data && data.subjectInfo && data.selected) {
            this.savedCompalator = data;
          } else {
            this.savedCompalator = null;
          }

          successHandler(this.savedCompalator);
        },
        error => errorHandler
      );
  }

  postCompalatorDetails(compalatorDetailsPayload, successHandler, errorHandler) {
    let headers = new Headers({
      "Authorization": "Bearer " + this.authService.getToken(),
      "Content-Type": "application/json"
    });
    this._http.post(environment.API_ENDPOINT + 'notes/compalator', JSON.stringify(compalatorDetailsPayload), { headers: headers })
      .subscribe(
        res => {
          // Compalator only operates on the current property, so we do not need to check (nor are we given) a bippoId
          if (this.loadedBippoId) {
            console.log('Recaching notes for ' + this.loadedBippoId + ' as we have saved a note to it..');
            this.getPropertyNotes(this.loadedBippoId, (error, caught) => {
              console.log(error);
              return caught;
            });
          }

          if (Math.floor(res["status"] / 100) == 2) {
            this.searchService.triggerWatchlistClientSide(this.loadedBippoId);
            successHandler();
          } else {
            errorHandler('Got status code ' + res["status"], null)
          }
        },
        error => errorHandler
      );
  }

  postQuickEquity(bippoId, payload, successHandler, errorHandler) {
    let headers = new Headers({
      "Authorization": "Bearer " + this.authService.getToken(),
      "Content-Type": "application/json"
    });
    this._http.post(environment.API_ENDPOINT + 'notes/quickequity', JSON.stringify({ bippoId: bippoId, details: payload }), { headers: headers })
      .subscribe(
        res => {
          if (this.loadedBippoId) {
            console.log('Recaching notes for ' + this.loadedBippoId + ' as we have saved a note to it..');
            this.getPropertyNotes(this.loadedBippoId, (error, caught) => {
              console.log(error);
              return caught;
            });
          }

          if (Math.floor(res["status"] / 100) == 2) {
            this.searchService.triggerWatchlistClientSide(this.loadedBippoId);
            successHandler();
          } else {
            errorHandler('Got status code ' + res["status"], null)
          }
        },
        error => errorHandler
      );
  }

  postArv(bippoId, payload, successHandler, errorHandler) {
    let headers = new Headers({
      "Authorization": "Bearer " + this.authService.getToken(),
      "Content-Type": "application/json"
    });
    this._http.post(environment.API_ENDPOINT + 'notes/arv', JSON.stringify({ bippoId: bippoId, details: payload }), { headers: headers })
      .subscribe(
        res => {
          if (this.loadedBippoId) {
            console.log('Recaching notes for ' + this.loadedBippoId + ' as we have saved a note to it..');
            this.getPropertyNotes(this.loadedBippoId, (error, caught) => {
              console.log(error);
              return caught;
            });
          }

          if (Math.floor(res["status"] / 100) == 2) {
            this.searchService.triggerWatchlistClientSide(this.loadedBippoId);
            successHandler();
          } else {
            errorHandler('Got status code ' + res["status"], null)
          }
        },
        error => errorHandler
      );
  }

  getFlip(bippoId, successHandler, errorHandler) {
    let headers = new Headers({
      "Authorization": "Bearer " + this.authService.getToken(),
      "Content-Type": "application/json"
    });
    this._http.get(environment.API_ENDPOINT + 'notes/flip/' + encodeURIComponent(bippoId), { headers: headers })
      .subscribe(
        res => {
          let data = null;

          try {
            data = res.json();
          } catch (e) {
            // response may have been empty
          }

          if (data) {
            successHandler(data);
          } else {
            errorHandler('Empty result', null);
          }
        },
        error => errorHandler
      );
  }

  postFlip(bippoId, payload, successHandler, errorHandler) {
    let headers = new Headers({
      "Authorization": "Bearer " + this.authService.getToken(),
      "Content-Type": "application/json"
    });
    this._http.post(environment.API_ENDPOINT + 'notes/flip', JSON.stringify({ bippoId: bippoId, details: payload }), { headers: headers })
      .subscribe(
        res => {
          if (this.loadedBippoId) {
            console.log('Recaching notes for ' + this.loadedBippoId + ' as we have saved a note to it..');
            this.getPropertyNotes(this.loadedBippoId, (error, caught) => {
              console.log(error);
              return caught;
            });
          }

          if (Math.floor(res["status"] / 100) == 2) {
            if (bippoId && payload) this.searchService.triggerWatchlistClientSide(this.loadedBippoId);

            successHandler();
          } else {
            errorHandler('Got status code ' + res["status"], null)
          }
        },
        error => errorHandler
      );
  }

  getHold(bippoId, successHandler, errorHandler) {
    let headers = new Headers({
      "Authorization": "Bearer " + this.authService.getToken(),
      "Content-Type": "application/json"
    });
    this._http.get(environment.API_ENDPOINT + 'notes/hold/' + encodeURIComponent(bippoId), { headers: headers })
      .subscribe(
        res => {
          let data = null;

          try {
            data = res.json();
          } catch (e) {
            // response may have been empty
          }

          if (data) {
            successHandler(data);
          } else {
            errorHandler('Empty result', null);
          }
        },
        error => errorHandler
      );
  }

  postHold(bippoId, payload, successHandler, errorHandler) {
    let headers = new Headers({
      "Authorization": "Bearer " + this.authService.getToken(),
      "Content-Type": "application/json"
    });
    this._http.post(environment.API_ENDPOINT + 'notes/hold', JSON.stringify({ bippoId: bippoId, details: payload }), { headers: headers })
      .subscribe(
        res => {
          if (this.loadedBippoId) {
            console.log('Recaching notes for ' + this.loadedBippoId + ' as we have saved a note to it..');
            this.getPropertyNotes(this.loadedBippoId, (error, caught) => {
              console.log(error);
              return caught;
            });
          }

          if (Math.floor(res["status"] / 100) == 2) {
            if (bippoId && payload) this.searchService.triggerWatchlistClientSide(this.loadedBippoId);

            successHandler();
          } else {
            errorHandler('Got status code ' + res["status"], null);
          }
        },
        error => errorHandler
      );
  }

  getRR(bippoId, successHandler, errorHandler) {
    let headers = new Headers({
      "Authorization": "Bearer " + this.authService.getToken(),
      "Content-Type": "application/json"
    });
    this._http.get(environment.API_ENDPOINT + 'notes/rr/' + encodeURIComponent(bippoId), { headers: headers })
      .subscribe(
        res => {
          let data = null;

          try {
            data = res.json();
          } catch (e) { 
            // response may have been empty
          }

          if (data) {
            successHandler(data);
          } else {
            errorHandler('Empty result', null);
          }
        },
        error => errorHandler
      );
  }

  postRR(bippoId, payload, successHandler, errorHandler) {
    let headers = new Headers({
      "Authorization": "Bearer " + this.authService.getToken(),
      "Content-Type": "application/json"
    });
    this._http.post(environment.API_ENDPOINT + 'notes/rr', JSON.stringify({ bippoId: bippoId, details: payload }), { headers: headers })
      .subscribe(
        res => {
          if (this.loadedBippoId) {
            console.log('Recaching notes for ' + this.loadedBippoId + ' as we have saved a note to it..');
            this.getPropertyNotes(this.loadedBippoId, (error, caught) => {
              console.log(error);
              return caught;
            });
          }

          if (Math.floor(res["status"] / 100) == 2) {
            if (bippoId && payload) this.searchService.triggerWatchlistClientSide(this.loadedBippoId);

            successHandler();
          } else {
            errorHandler('Got status code ' + res["status"], null);
          }
        },
        error => errorHandler
      );
  }

  loadSpreadsheetModule(propertyId, moduleTitle, successHandler, errorHandler) {
    let headers = new Headers({
      "Authorization": "Bearer " + this.authService.getToken(),
      "Content-Type": "application/json"
    });
    this._http.get(environment.API_ENDPOINT + 'spm/load/' + encodeURIComponent(propertyId) + '/' + encodeURIComponent(moduleTitle), { headers: headers })
      .subscribe(
        res => {
          if (Math.floor(res["status"] / 100) == 2) {
            successHandler(res.json());
          } else {
            errorHandler('Got status code ' + res["status"], null);
          }
        },
        error => errorHandler
      );
  }

  saveSpreadsheetModule(propertyId, moduleTitle, csv, csvClean, outputs, successHandler, errorHandler) {
    let headers = new Headers({
      "Authorization": "Bearer " + this.authService.getToken(),
      "Content-Type": "application/json"
    });
    let payload = {
      bippoId: propertyId,
      moduleTitle: moduleTitle,
      spreadsheetCsv: csv,
      spreadsheetCsvClean: csvClean,
      spreadsheetOutputs: JSON.stringify(outputs)
    };
    this._http.post(environment.API_ENDPOINT + 'spm/save', JSON.stringify(payload), { headers: headers })
      .subscribe(
        res => {
          if (Math.floor(res["status"] / 100) == 2) {
            if (this.loadedBippoId) {
              console.log('Recaching notes for ' + this.loadedBippoId + ' as we have saved a note to it..');
              this.getPropertyNotes(this.loadedBippoId, (error, caught) => {
                console.log(error);
                return caught;
              });
            }

            this.searchService.triggerWatchlistClientSide(propertyId);
            successHandler(res["status"]);
          } else {
            errorHandler('Got status code ' + res["status"], null);
          }
        },
        error => errorHandler
      );
  }

  loadSpreadsheetSettings(moduleTitles, successHandler, errorHandler) {
    let headers = new Headers({
      "Authorization": "Bearer " + this.authService.getToken(),
      "Content-Type": "application/json"
    });
    this._http.get(environment.API_ENDPOINT + 'spm/settings/load?' + moduleTitles.map(a => "module=" + encodeURIComponent(a)).join(','), { headers: headers })
      .subscribe(
        res => {
          if (Math.floor(res["status"] / 100) == 2) {
            successHandler(res.json());
          } else {
            errorHandler('Got status code ' + res["status"], null);
          }
        },
        error => errorHandler
      );
  }

  saveSpreadsheetSetting(moduleTitle, userData, successHandler, errorHandler) {
    let headers = new Headers({
      "Authorization": "Bearer " + this.authService.getToken(),
      "Content-Type": "application/json"
    });
    this._http.post(environment.API_ENDPOINT + 'spm/settings/save', JSON.stringify({ moduleTitle: moduleTitle, userData: JSON.stringify(userData) }), { headers: headers })
      .subscribe(
        res => {
          if (Math.floor(res["status"] / 100) == 2) {
            successHandler(res["status"]);
          } else {
            errorHandler('Got status code ' + res["status"], null);
          }
        },
        error => errorHandler
      );
  }
}
