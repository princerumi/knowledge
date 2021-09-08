import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';

export interface KcViewportHeaderConfig {
  canClose?: boolean,
  canCopy?: boolean,
  canGoBack?: boolean,
  canGoForward?: boolean,
  canRefresh?: boolean,
  canSave?: boolean,
  displayText?: string,
  displayTextReadOnly?: boolean,
  customClass?: string | string[],
  backgroundColor?: string,
  showSaveButton?: boolean,
  showNavButtons?: boolean,
  showActionButtons?: boolean,
  showDisplayText?: boolean
}

export interface KcViewportHeaderEvent {
  backClicked?: boolean,
  forwardClicked?: boolean,
  refreshClicked?: boolean,
  closeClicked?: boolean,
  copyClicked?: boolean,
  saveClicked?: boolean
}

@Component({
  selector: 'ks-lib-viewport-header',
  templateUrl: './viewport-header.component.html',
  styleUrls: ['./viewport-header.component.scss']
})
export class ViewportHeaderComponent implements OnInit, OnChanges {
  @Input() config!: KcViewportHeaderConfig;
  @Output() headerEvents = new EventEmitter<KcViewportHeaderEvent>();
  customClass: string = '';

  // Default tooltip strings
  closeTooltip: string = 'Close';
  copyTooltip: string = 'Copy to clipboard';

  constructor() {
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges) {
    let config = changes.config.currentValue;
    if (config.customClass) {
      this.customClass = config.customClass;
    }
  }

  back() {
    this.headerEvents.emit({backClicked: true});
  }

  close() {
    this.headerEvents.emit({closeClicked: true});
  }

  copy() {
    this.headerEvents.emit({copyClicked: true});
  }

  forward() {
    this.headerEvents.emit({forwardClicked: true});
  }

  refresh() {
    this.headerEvents.emit({refreshClicked: true});
  }

  save() {
    this.headerEvents.emit({saveClicked: true});
  }
}
