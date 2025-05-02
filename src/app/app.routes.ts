import { Routes } from '@angular/router';
import { adminGuard } from '@core/guards/admin.guard';
import { authGuard } from '@core/guards/auth.guard';
import { inpatientGuard } from '@core/guards/inpatient.guard';
import { medicalStaffGuard } from '@core/guards/medical-staff.guard';
import { ActiveAccountComponent } from '@features/auth/active-account/active-account.component';
import { LoginComponent } from '@features/auth/login/login.component';
import { RegisterComponent } from '@features/auth/register/register.component';
import { MenuComponent } from '@features/layout/menu/menu.component';
import { NonFoundComponent } from '@shared/components/non-found/non-found.component';


export const routes: Routes = [
    {
        path: '',
        component: MenuComponent,
        canActivate: [authGuard],
        children: [
            {
                path: 'chat',
                loadComponent: () => import('./features/chat/chat-room-list/chat-room-list.component').then(c => c.ChatRoomListComponent),
                canActivate: [medicalStaffGuard],
            },
            {
                path: 'chat/:roomId',
                loadComponent: () => import('./features/chat/chat-room/chat-room.component').then(c => c.ChatRoomComponent)
            },
            {
                path: 'chatroom-create',
                loadComponent: () => import('./features/chat/create-chat-room/create-chat-room.component').then(c => c.CreateChatRoomComponent)
            },
            {
                path: 'dashboard',
                loadComponent: () => import('./features/dashboard/dashboard-container/dashboard-container.component').then(c => c.DashboardContainerComponent)
            },
            {
                path: 'available',
                loadComponent: () => import('./features/patient/practitioner-schedule/practitioner-schedule.component').then(c => c.PractitionerScheduleComponent)
            },
            {
                path: 'booking',
                loadComponent: () => import('./features/patient/book-appointment/book-appointment.component').then(c => c.BookAppointmentComponent),

            },
            {
                path: 'checkin',
                loadComponent: () => import('./features/patient/check-in/check-in.component').then(c => c.CheckInComponent)
            },
            {
                path: 'consultation',
                loadComponent: () => import('./features/patient/consultation-form/consultation-form.component').then(c => c.ConsultationFormComponent)
            },
            {
                path: 'waiting-list',
                loadComponent: () => import('./features/patient/waiting-list/waiting-list.component').then(c => c.WaitingListComponent)
            },
            {
                path: 'inpatient',
                loadComponent: () => import('./features/patient/inpatient-rooms/inpatient-rooms.component').then(c => c.InpatientRoomsComponent)
            },
            {
                path: "inpatient/:roomNumber",
                loadComponent: () => import('./features/patient/inpatient-bed-assign/inpatient-bed-assign.component').then(c => c.InpatientBedAssignComponent),
                canActivate: [inpatientGuard],
            },

            {
                path: 'admin',
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./features/admin/admin.component').then(c => c.AdminComponent),
                        canActivate: [adminGuard],
                    },
                    {
                        path: 'authorization',
                        loadComponent: () => import('./features/admin/authorization/authorization.component').then(c => c.AuthorizationComponent),
                        canActivate: [adminGuard],
                    },
                    {
                        path: 'login-history',
                        loadComponent: () => import('./features/admin/user-log-history/user-log-history.component').then(c => c.UserLogHistoryComponent),
                        canActivate: [adminGuard],
                    },
                ]
            }
        ]
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'register',
        component: RegisterComponent
    },
    {
        path: 'activate-account',
        component: ActiveAccountComponent
    },
    {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forget-password/forget-password.component').then(c => c.ForgetPasswordComponent)
    },
    {
        path: 'reset-password',
        loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(c => c.ResetPasswordComponent)
    },
    {
        path: 'non-found',
        component: NonFoundComponent
    },
    {
        path: '**',
        redirectTo: 'non-found'
    }
];
