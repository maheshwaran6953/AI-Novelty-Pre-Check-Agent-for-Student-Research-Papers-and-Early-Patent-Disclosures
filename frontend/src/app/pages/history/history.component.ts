import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { JobService } from '../../services/job.service';
import { Job, JobStatus } from '../../models/job.model';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container">
      <div class="history-header">
        <h1>Pre-Check History</h1>
        <p class="subtitle text-muted">Past novelty analysis jobs run by this agent.</p>
      </div>

      <div class="card" *ngIf="jobs.length > 0">
        <table class="history-table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let job of jobs">
              <td class="filename">{{ job.originalFilename }}</td>
              <td>
                <span class="status-badge" [ngClass]="job.status.toLowerCase()">
                  {{ job.status }}
                </span>
              </td>
              <td class="mono text-muted">{{ job.createdAt | date:'short' }}</td>
              <td>
                <a *ngIf="job.status === 'COMPLETED'" [routerLink]="['/report', job.jobId]" class="action-link">View Report</a>
                <a *ngIf="job.status === 'RUNNING' || job.status === 'QUEUED'" [routerLink]="['/status', job.jobId]" class="action-link">View Progress</a>
                <span *ngIf="job.status === 'FAILED'" class="text-error" [title]="job.errorMessage">Failed</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div *ngIf="jobs.length === 0 && !isLoading" class="no-history">
        <p class="text-muted">No analysis jobs found.</p>
        <button class="btn-primary" routerLink="/">Start New Pre-Check</button>
      </div>
      
      <div *ngIf="isLoading" class="loading-state">
        Loading history...
      </div>
    </div>
  `,
  styles: [`
    .history-header {
      margin-bottom: 2rem;
    }
    
    .subtitle {
      font-size: 1.1rem;
    }
    
    .text-muted {
      color: var(--text-muted);
    }
    
    .history-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    
    .history-table th {
      padding: 1rem;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-secondary);
      font-weight: 500;
    }
    
    .history-table td {
      padding: 1rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    
    .history-table tr:last-child td {
      border-bottom: none;
    }
    
    .history-table tr:hover td {
      background-color: var(--bg-surface-hover);
    }
    
    .filename {
      font-weight: 500;
    }
    
    .status-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }
    
    .status-badge.completed {
      background-color: rgba(16, 185, 129, 0.15);
      color: var(--status-success);
    }
    
    .status-badge.running, .status-badge.queued {
      background-color: rgba(99, 102, 241, 0.15);
      color: var(--accent-primary);
    }
    
    .status-badge.failed {
      background-color: rgba(239, 68, 68, 0.15);
      color: var(--status-error);
    }
    
    .action-link {
      font-size: 0.9rem;
      font-weight: 500;
    }
    
    .text-error {
      color: var(--status-error);
      font-size: 0.9rem;
    }
    
    .no-history {
      text-align: center;
      padding: 4rem;
    }
    
    .no-history button {
      margin-top: 1.5rem;
    }
    
    .loading-state {
      text-align: center;
      padding: 4rem;
      color: var(--text-muted);
    }
  `]
})
export class HistoryComponent implements OnInit {
  jobs: Job[] = [];
  isLoading = true;

  constructor(private jobService: JobService) {}

  ngOnInit() {
    this.jobService.getJobHistory().subscribe({
      next: (jobs) => {
        this.jobs = jobs;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load history', err);
        this.isLoading = false;
      }
    });
  }
}
