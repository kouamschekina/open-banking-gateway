import { Component, EventEmitter, Output } from '@angular/core';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UntypedFormControl } from '@angular/forms';

@Component({
    selector: 'app-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.scss'],
    standalone: false
})
export class SearchComponent {
  @Output() keyword = new EventEmitter();
  searchTerm = new UntypedFormControl('adorsys');

  constructor() {
    this.searchTerm.valueChanges.pipe(debounceTime(500), distinctUntilChanged()).subscribe(inputData => {
      this.keyword.emit(inputData);
    });
  }
}
