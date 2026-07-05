import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, timer, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { JobService } from '../../services/job.service';
import { Job, JobStatus, PipelineStage } from '../../models/job.model';

@Component({
  selector: 'app-job-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <div class="status-header">
        <h1>Agent Pipeline Status</h1>
        <p class="mono text-muted">Job ID: {{ jobId }}</p>
      </div>

      <div *ngIf="job" class="pipeline-container">
        <div class="stages-list">
          <div *ngFor="let stage of stageSequence; let i = index" 
               class="stage-item"
               [ngClass]="getStageClass(stage)">
            
            <div class="stage-icon">
              <svg *ngIf="isCompleted(stage)" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <div *ngIf="isActive(stage)" class="active-dot"></div>
              <div *ngIf="isPending(stage)" class="pending-dot"></div>
            </div>

            <div class="stage-content">
              <h3 class="stage-name">{{ getStageName(stage) }}</h3>
              <p *ngIf="isActive(stage)" class="stage-progress mono text-accent">
                {{ job.progressMessage || 'Working...' }}
              </p>
            </div>
            
          </div>
        </div>

        <div *ngIf="job.status === 'FAILED'" class="error-banner">
          <h3>Pipeline Failed</h3>
          <p class="mono">{{ job.errorMessage }}</p>
        </div>
      </div>
      
      <div *ngIf="!job" class="loading-state">
        Connecting to agent...
      </div>
    </div>
  `,
  styles: [`
    .status-header {
      margin-bottom: 3rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 1rem;
    }
    .text-muted {
      color: var(--text-muted);
      font-size: 0.9rem;
    }
    .text-accent {
      color: var(--accent-primary);
    }
    
    .pipeline-container {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .stages-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .stage-item {
      display: flex;
      align-items: flex-start;
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid transparent;
      transition: all 0.3s ease;
    }
    
    .stage-item.completed {
      opacity: 0.7;
    }
    .stage-item.completed .stage-icon {
      color: var(--status-success);
    }
    
    .stage-item.active {
      background-color: var(--bg-surface);
      border-color: var(--border-color);
      box-shadow: 0 0 15px var(--accent-primary-glow);
    }
    
    .stage-item.pending {
      opacity: 0.4;
    }
    
    .stage-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 1.5rem;
      flex-shrink: 0;
    }
    
    .active-dot {
      width: 12px;
      height: 12px;
      background-color: var(--accent-primary);
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }
    
    .pending-dot {
      width: 8px;
      height: 8px;
      background-color: var(--text-muted);
      border-radius: 50%;
    }
    
    .stage-name {
      margin-bottom: 0.25rem;
      font-size: 1.1rem;
    }
    
    .stage-progress {
      font-size: 0.9rem;
      margin: 0;
    }
    
    .error-banner {
      background-color: rgba(239, 68, 68, 0.1);
      border: 1px solid var(--status-error);
      color: var(--status-error);
      padding: 1.5rem;
      border-radius: 6px;
      margin-top: 2rem;
    }
    .error-banner h3 {
      color: var(--status-error);
      margin-top: 0;
    }
    
    .loading-state {
      text-align: center;
      padding: 3rem;
      color: var(--text-muted);
    }
    
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 var(--accent-primary-glow);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(99, 102, 241, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
      }
    }
  `]
})
export class JobStatusComponent implements OnInit, OnDestroy {
  jobId: string = '';
  job: Job | null = null;
  private pollSub?: Subscription;

  readonly stageSequence: PipelineStage[] = [
    PipelineStage.INGEST,
    PipelineStage.EXTRACT,
    PipelineStage.PLAN_QUERIES,
    PipelineStage.RETRIEVE,
    PipelineStage.FILTER_DEDUP,
    PipelineStage.SCORE,
    PipelineStage.EXPLAIN,
    PipelineStage.DELIVER
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private jobService: JobService
  ) {}

  ngOnInit() {
    this.jobId = this.route.snapshot.paramMap.get('id') || '';
    
    // Poll every 3 seconds
    this.pollSub = timer(0, 3000).pipe(
      switchMap(() => this.jobService.getJobStatus(this.jobId).pipe(
        catchError(err => {
          console.warn('Temporary polling error (backend busy), retrying...', err);
          return of(null);
        })
      ))
    ).subscribe({
      next: (job) => {
        if (!job) return; // Ignore failed polling attempts
        
        this.job = job;
        
        if (job.status === JobStatus.COMPLETED) {
          this.router.navigate(['/report', this.jobId]);
        }
        
        if (job.status === JobStatus.FAILED) {
          this.pollSub?.unsubscribe();
        }
      },
      error: (err) => {
        console.error('Fatal error in polling stream', err);
      }
    });
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }

  private getStageIndex(stage: PipelineStage): number {
    return this.stageSequence.indexOf(stage);
  }

  private getCurrentStageIndex(): number {
    if (!this.job) return -1;
    return this.getStageIndex(this.job.stage);
  }

  isCompleted(stage: PipelineStage): boolean {
    if (!this.job) return false;
    if (this.job.status === JobStatus.COMPLETED) return true;
    return this.getStageIndex(stage) < this.getCurrentStageIndex();
  }

  isActive(stage: PipelineStage): boolean {
    if (!this.job || this.job.status === JobStatus.COMPLETED || this.job.status === JobStatus.FAILED) return false;
    return this.job.stage === stage;
  }

  isPending(stage: PipelineStage): boolean {
    if (!this.job || this.job.status === JobStatus.COMPLETED) return false;
    if (this.job.status === JobStatus.FAILED) return this.getStageIndex(stage) > this.getCurrentStageIndex();
    return this.getStageIndex(stage) > this.getCurrentStageIndex();
  }

  getStageClass(stage: PipelineStage): string {
    if (this.isCompleted(stage)) return 'completed';
    if (this.isActive(stage)) return 'active';
    return 'pending';
  }

  getStageName(stage: PipelineStage): string {
    const names: Record<PipelineStage, string> = {
      [PipelineStage.INGEST]: 'Ingest Document',
      [PipelineStage.EXTRACT]: 'Extract Claims',
      [PipelineStage.PLAN_QUERIES]: 'Plan Search Queries',
      [PipelineStage.RETRIEVE]: 'Retrieve Candidates (arXiv / Semantic Scholar)',
      [PipelineStage.FILTER_DEDUP]: 'Filter & Deduplicate',
      [PipelineStage.SCORE]: 'Score Semantic Similarity',
      [PipelineStage.EXPLAIN]: 'Generate Explanations (LLM)',
      [PipelineStage.DELIVER]: 'Deliver Report'
    };
    return names[stage];
  }
}
