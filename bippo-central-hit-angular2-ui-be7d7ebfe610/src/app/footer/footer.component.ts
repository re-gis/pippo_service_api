import { Component, OnInit } from '@angular/core';

@Component({
//   moduleId: module.id.toString(),
  selector: 'app-footer',
  templateUrl: 'footer.component.html',
  styleUrls: ['footer.component.css']
})
export class FooterComponent implements OnInit {

  constructor() {}

  ngOnInit() {
  }

  getCurrentYear() {
    return new Date().getFullYear();
  }
}
