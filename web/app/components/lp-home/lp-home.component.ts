import {Component, OnDestroy, OnInit} from '@angular/core';
import {fadeInAnimation} from "../../shared/animations/lp-animations";
import {AuthenticationService} from "../../core/services/authentication.service";
import {ISubscription} from "rxjs/Subscription";
import {Router} from "@angular/router";
import {InstallationService} from "../../core/services/istallation.service";
import {LpConfirmationDialogComponent} from "../lp-confirmation-dialog/lp-confirmation-dialog.component";
import {MatDialog} from "@angular/material";
import {DomainsService} from "../../core/services/domains.service";
import {ConversationService} from "../../core/services/conversation.service";
import {AccountConfigService} from "../../core/services/account-config.service";
import {ConversationEvent} from "../../shared/models/conversation/conversationEvent.model";

@Component({
  selector: 'lp-home',
  templateUrl: './lp-home.component.html',
  styleUrls: ['./lp-home.component.scss'],
  animations: [fadeInAnimation],
  host: {'[@fadeInAnimation]': ''}
})
export class LpHomeComponent implements OnInit, OnDestroy {
  public brandId: string;
  public isAuthenticated: boolean;
  public userName: string;
  public password: string;
  public authenticationService: AuthenticationService;

  private loginSubscription: ISubscription;
  private domainSubscription: ISubscription;
  private dialogRefSubscription: ISubscription;

  constructor(private _authenticationService: AuthenticationService,
              private installationService: InstallationService,
              private domainsService: DomainsService,
              private router: Router,
              private conversationService: ConversationService,
              private accountConfigService: AccountConfigService,
              public dialog: MatDialog) {
    this.authenticationService = _authenticationService;
  }

  ngOnInit() {
    if(this.authenticationService.user){
      this.isAuthenticated = true;
    }
    this.loginSubscription = this.authenticationService.userLoggedSubject.subscribe(event => {
      if (event === 'LOGGED-IN') {
        this.isAuthenticated = true;
        this.installationService.init();
        this.conversationService.init();
        this.accountConfigService.init();

        this.goToStartConfigPage();

      }
      if (event === 'LOGGED-OUT') {
        this.isAuthenticated = false;
      }
    });


    this.conversationService.conversationRestoredSubject.subscribe( event => {
      if (event === 'RESTORED') {
          this.goToStartDemoPage();
      }
    });
    this.domainSubscription = this.domainsService.domainsSubject.subscribe( event => {
      if(event === 'READY') {
        this.authenticationService.login(this.brandId, this.userName, this.password);
      }
    });

  }

  ngOnDestroy() {
    if(this.loginSubscription) this.loginSubscription.unsubscribe();
    if(this.domainSubscription) this.domainSubscription.unsubscribe();
    if(this.dialogRefSubscription) this.dialogRefSubscription.unsubscribe();
  }

  public loadDomainsForBrand(event: any) {
    if(event && event.brandId && event.userName && event.password) {
      this.brandId = event.brandId;
      this.userName = event.userName;
      this.password = event.password;
    }
    //First of all we need to know the domains
    this.domainsService.getDomainList(this.brandId);
  }

  public goToStartConfigPage() {
    this.router.navigateByUrl('settings/start');
  }

  public goToStartDemoPage() {
    this.router.navigateByUrl('demo');
  }

  public isConversationRestored(): boolean {
    if (this.conversationService.conversation) {
      return true;
    }
    return false;
  }

  public openConfirmationDialog(): void {
    const dialogRef = this.dialog.open(LpConfirmationDialogComponent);

    dialogRef.componentInstance.title = "Logout";
    dialogRef.componentInstance.message = "This will clear all your changes. Are you sure?";

    this.dialogRefSubscription = dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.router.navigateByUrl('/logout');
      }
    });
  }

}
