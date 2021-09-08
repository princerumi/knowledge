import {Component, Inject, OnInit, SecurityContext} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {KnowledgeSource} from "projects/ks-lib/src/lib/models/knowledge.source.model";
import {DomSanitizer, SafeUrl} from "@angular/platform-browser";
import {ExtractionService} from "../../../../../ks-lib/src/lib/services/extraction/extraction.service";
import {ProjectService} from "../../../../../ks-lib/src/lib/services/projects/project.service";
import {KsQueueService} from "../ks-queue-service/ks-queue.service";
import {ProjectModel, ProjectUpdateRequest} from "projects/ks-lib/src/lib/models/project.model";
import {MatTabChangeEvent} from "@angular/material/tabs";
import {Clipboard} from "@angular/cdk/clipboard";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ElectronIpcService} from "../../../../../ks-lib/src/lib/services/electron-ipc/electron-ipc.service";
import {IpcResponse, KsBrowserViewRequest, KsThumbnailRequest} from "kc_electron/src/app/models/electron.ipc.model";
import {FormControl} from "@angular/forms";

export interface KsInfoDialogInput {
  source: 'ks-drop-list' | 'ks-queue',
  ks: KnowledgeSource
}

export interface KsInfoDialogOutput {
  ksChanged: boolean,
  ks: KnowledgeSource,
  preview: boolean
}

@Component({
  selector: 'app-ks-info-dialog',
  templateUrl: './ks-info-dialog.component.html',
  styleUrls: ['./ks-info-dialog.component.scss']
})
export class KsInfoDialogComponent implements OnInit {
  currentProject: ProjectModel | null = null;
  ks: KnowledgeSource;
  url: string | null = null;
  safeUrl: SafeUrl | undefined;
  sourceRef: 'ks-drop-list' | 'ks-queue' | 'undefined' = 'undefined';
  viewReady: boolean = false;
  ksChanged: boolean = false;
  title: string = '';
  thumbnail: string | undefined = undefined;
  selectedTab = new FormControl(0);
  previewSelected: boolean = false;

  constructor(public dialogRef: MatDialogRef<KsInfoDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public input: KsInfoDialogInput,
              private extractionService: ExtractionService,
              private projectService: ProjectService,
              private ipcService: ElectronIpcService,
              private ksQueueService: KsQueueService,
              private _sanitizer: DomSanitizer,
              private clipboard: Clipboard,
              private snackBar: MatSnackBar) {

    this.projectService.currentProject.subscribe((project) => {
      this.currentProject = project;
    });


    /**
     * This intercepts all calls to close the current dialog. Therefore, methods
     * that want to do something after the dialog has been closed must do so by
     * setting class parameters, which will be included in the output.
     * For instance, when "Preview" is clicked, set previewSelected to true.
     * The call is then responsible for following up
     */
    this.dialogRef.beforeClosed().subscribe(() => {
      let dialogOutput: KsInfoDialogOutput = {ksChanged: this.ksChanged, ks: this.ks, preview: this.previewSelected};
      this.dialogRef.close(dialogOutput);
    });

    this.ks = input.ks;
    this.title = input.ks.title;
    this.sourceRef = input.source;
  }

  ngOnInit(): void {
  }

  openInBrowser() {
    let url;
    if (typeof this.ks.accessLink === 'string')
      url = this.ks.accessLink
    else
      url = this.ks.accessLink.href;

    window.open(url);
    this.ks.dateAccessed = new Date();
    this.ksChanged = true;
  }


  saveToPdf() {
    let link: string;
    if (typeof this.ks.accessLink === 'string')
      link = this.ks.accessLink
    else
      link = this.ks.accessLink.href;
    this.extractionService.extractWebsite(link, this.ks.id.value);
    this.dialogRef.close();
  }

  importSource() {
    if (this.currentProject?.id) {
      // Set timestamp based on when the source was actually improted into the system
      // this.ks.dateCreated = new Date();
      // this.ks.dateAccessed = new Date();
      // this.ks.dateModified = new Date();

      // this.ks.notes = new KnowledgeSourceNotes();
      // this.ks.notes.text = this.notes;

      // Update the project to persist the new source
      let projectUpdate: ProjectUpdateRequest = {
        id: this.currentProject.id,
        addKnowledgeSource: [this.ks]
      }

      console.log('Adding knowledge source to project: ', this.ks);

      this.projectService.updateProject(projectUpdate);
      this.ksQueueService.remove(this.ks);
      this.dialogRef.close();
    } else {
      console.error('IMPORT SOURCE WITH NO PROJECT ID Not implemented');
    }
  }

  removeSource() {
    if (this.currentProject?.id) {
      let update: ProjectUpdateRequest = {
        id: this.currentProject.id,
        removeKnowledgeSource: [this.ks]
      }
      this.projectService.updateProject(update);
      this.dialogRef.close();
    } else {
      console.error(`Attempting to remove ${this.ks.id.value} with invalid project id...`);
    }
  }

  copyLink() {
    let link: string | URL = this.ks.accessLink;
    let message = 'Copied to clipboard:';

    if (typeof link === 'string') {
      message = message + `\
      \
      ${link}`
      this.clipboard.copy(link);
    } else {
      message = message + `\
      \
      ${link.href}`
      this.clipboard.copy(link.href);
    }
    this.snackBar.open(message, 'Dismiss', {
      duration: 3000,
      panelClass: 'kc-success',
      verticalPosition: 'bottom'
    });
  }

  updateKS() {
    if (this.ks.title.length === 0) {
      console.error('Cannot update Knowledge Source with no title...');
      return;
    }

    // Only update the KS if it's in ks-drop-list... otherwise we're in ks-queue and shouldn't update project
    if (this.currentProject?.id && this.sourceRef == 'ks-drop-list') {
      this.ks.dateModified = new Date();
      let update: ProjectUpdateRequest = {
        id: this.currentProject?.id,
        updateKnowledgeSource: [this.ks]
      }
      this.projectService.updateProject(update);
    }
  }

  ksModified(modified: boolean) {
    this.ksChanged = modified;

    console.log('Ks was modified: ', this.ks);
  }

  removeQueueItem() {
    this.ksQueueService.remove(this.ks);
    this.dialogRef.close();
  }

  openLocally() {
    if (typeof this.ks.accessLink === 'string')
      this.ipcService.openLocalFile(this.ks.accessLink).then((value) => {
        if (value) {
          this.snackBar.open('Success! Your file will open soon.', 'Dismiss', {
            duration: 3000,
            verticalPosition: 'bottom',
            panelClass: 'kc-success'
          });
          this.dialogRef.close();
        } else {
          this.snackBar.open('Oops, It appears that file can\'t be opened!', 'Dismiss', {
            duration: 3000,
            verticalPosition: 'bottom',
            panelClass: 'kc-danger-zone'
          });
        }
      });
  }

  preview() {
    this.previewSelected = true;
    this.dialogRef.close();
  }
}
