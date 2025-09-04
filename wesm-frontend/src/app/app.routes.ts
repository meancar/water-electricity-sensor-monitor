import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DetailsComponent } from './details/details.component';

export const routes: Routes = [
  { 
    path: '', 
    component: DashboardComponent,
    title: 'WESM Dashboard' 
  },
  {
    path: 'details',
    component: DetailsComponent,
    title: 'What the details'
  },
];
