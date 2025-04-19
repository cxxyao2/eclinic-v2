import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthorizationComponent } from './authorization.component';

import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { UserRole, UsersService } from '@libs/api-client';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';

class MockUsersService {
  apiUsersGet = jest.fn().mockReturnValue(of([
    { userID: 1, userName: 'John Doe', role: UserRole.NUMBER_1 },
    { userID: 2, userName: 'Jane Smith', role: UserRole.NUMBER_2 }
  ]));
}

describe('AuthorizationComponent', () => {
  let component: AuthorizationComponent;
  let fixture: ComponentFixture<AuthorizationComponent>;
  let usersService: MockUsersService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatTableModule,
        NoopAnimationsModule,
        AuthorizationComponent
      ],
      providers: [
        { provide: UsersService, useClass: MockUsersService },
        { provide: Router, useValue: { navigate: jest.fn() } }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthorizationComponent);
    component = fixture.componentInstance;
    usersService = TestBed.inject(UsersService) as unknown as MockUsersService;
    router = TestBed.inject(Router);
    fixture.detectChanges(); // Trigger initial change detection
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    expect(usersService.apiUsersGet).toHaveBeenCalled();
    expect(component.dataSource.data.length).toBe(2);
    expect(component.dataSource.data[0].userName).toBe('John Doe');
  });

  it('should update user role', () => {
    const user = component.dataSource.data[0];

    const selectElement: HTMLDivElement = fixture.nativeElement.querySelector('mat-select>div');

    expect(selectElement).toBeTruthy();

    selectElement.click();
    fixture.detectChanges();

    const listboxDiv = document.querySelector('div[role="listbox"]');
    expect(listboxDiv).toBeTruthy();


    if (listboxDiv) {
      const allElements = listboxDiv.querySelectorAll('mat-option');
      expect(allElements.length).toBe(4);

      (allElements[3] as HTMLOptionElement).click();
      fixture.detectChanges();

      expect(component.originalData[0].role).toBe(UserRole.NUMBER_1);
      expect(user.role).toBe(UserRole.NUMBER_3);
    }

  });

});