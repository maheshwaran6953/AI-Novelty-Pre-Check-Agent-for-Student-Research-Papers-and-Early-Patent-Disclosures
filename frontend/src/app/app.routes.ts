import { Routes } from '@angular/router';
import { UploadComponent } from './pages/upload/upload.component';
import { JobStatusComponent } from './pages/job-status/job-status.component';
import { ReportComponent } from './pages/report/report.component';
import { HistoryComponent } from './pages/history/history.component';

export const routes: Routes = [
  { path: '', component: UploadComponent },
  { path: 'status/:id', component: JobStatusComponent },
  { path: 'report/:id', component: ReportComponent },
  { path: 'history', component: HistoryComponent },
  { path: '**', redirectTo: '' }
];
