import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { JobService } from '../../services/job.service';
import { FinalReport } from '../../models/job.model';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container" *ngIf="report">
      <div class="report-header">
        <h1>AI Novelty Pre-Check Report</h1>
        <p class="mono text-muted">Generated at: {{ report.generatedAt | date:'medium' }}</p>
      </div>

      <div *ngIf="report.truncationWarning" class="warning-banner">
        <strong>Warning:</strong> {{ report.truncationWarning }}
      </div>

      <div class="card summary-card">
        <h2>Document Summary</h2>
        <p>{{ report.documentSummary }}</p>
      </div>

      <div class="claims-section">
        <h2>Claims Analysis</h2>
        
        <div *ngFor="let claim of report.claimsAnalysis; let i = index" class="claim-block">
          <div class="claim-header">
            <span class="mono text-muted">Claim {{ i + 1 }} ({{ claim.claimId }})</span>
            <p class="claim-text">{{ claim.claimText }}</p>
          </div>

          <div class="matches-list" *ngIf="claim.matches.length > 0">
            <h4>Prior Art Candidates ({{ claim.matches.length }})</h4>
            
            <div *ngFor="let match of claim.matches" class="match-card">
              <div class="match-header">
                <span class="tier-badge" [ngClass]="match.tier">
                  {{ match.tier === 'significant_overlap' ? 'Significant Overlap' : 'Related Work' }}
                </span>
                
                <div class="score-container">
                  <div class="score-bar-bg">
                    <div class="score-bar-fill" [style.width.%]="match.similarityScore * 100" [ngClass]="match.tier"></div>
                  </div>
                  <span class="mono">{{ (match.similarityScore * 100).toFixed(1) }}% Match</span>
                </div>
              </div>
              
              <h3 class="match-title">
                <a [href]="match.url" target="_blank" rel="noopener noreferrer">{{ match.title }}</a>
              </h3>
              
              <div class="match-meta mono text-muted">
                Source: {{ match.source | uppercase }}
              </div>
              
              <p class="match-explanation">{{ match.explanation }}</p>
            </div>
          </div>

          <div *ngIf="claim.matches.length === 0" class="no-matches">
            No candidates with significant semantic overlap found.
          </div>
        </div>
      </div>

      <div class="report-footer">
        <div class="sources mono text-muted">
          Sources searched: {{ report.sourcesSearched.join(', ') }}<br>
          <span *ngIf="report.sourcesSkipped.length > 0">Sources skipped (rate limit): {{ report.sourcesSkipped.join(', ') }}</span>
        </div>
        
        <div class="disclaimer">
          <strong>Disclaimer:</strong> {{ report.disclaimer }}
        </div>
        
        <div class="actions">
          <button class="btn-primary" routerLink="/">Upload New Document</button>
        </div>
      </div>
    </div>
    
    <div class="container loading-state" *ngIf="!report && !errorMessage">
      Loading report...
    </div>

    <div class="container error-banner" *ngIf="errorMessage">
      {{ errorMessage }}
    </div>
  `,
  styles: [`
    .report-header {
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 1rem;
    }
    
    .text-muted {
      color: var(--text-muted);
    }
    
    .warning-banner {
      background-color: rgba(245, 158, 11, 0.1);
      border: 1px solid var(--tier-significant);
      color: var(--tier-significant);
      padding: 1rem;
      border-radius: 6px;
      margin-bottom: 1.5rem;
    }
    
    .summary-card {
      margin-bottom: 3rem;
    }
    
    .claims-section h2 {
      margin-bottom: 1.5rem;
    }
    
    .claim-block {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      margin-bottom: 2rem;
      overflow: hidden;
    }
    
    .claim-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-color);
      background-color: var(--bg-surface-hover);
    }
    
    .claim-text {
      font-size: 1.1rem;
      margin-top: 0.5rem;
      font-weight: 500;
    }
    
    .matches-list {
      padding: 1.5rem;
    }
    
    .matches-list h4 {
      margin-bottom: 1rem;
      color: var(--text-secondary);
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .match-card {
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 1.25rem;
      margin-bottom: 1rem;
      background-color: var(--bg-base);
    }
    
    .match-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .tier-badge {
      font-size: 0.8rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: 100px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .tier-badge.significant_overlap {
      background-color: var(--tier-significant-bg);
      color: var(--tier-significant);
    }
    
    .tier-badge.related_work {
      background-color: var(--tier-related-bg);
      color: var(--tier-related);
    }
    
    .score-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.9rem;
    }
    
    .score-bar-bg {
      width: 100px;
      height: 6px;
      background-color: var(--border-color);
      border-radius: 3px;
      overflow: hidden;
    }
    
    .score-bar-fill {
      height: 100%;
      border-radius: 3px;
    }
    
    .score-bar-fill.significant_overlap {
      background-color: var(--tier-significant);
    }
    
    .score-bar-fill.related_work {
      background-color: var(--tier-related);
    }
    
    .match-title {
      font-size: 1.15rem;
      margin-bottom: 0.5rem;
    }
    
    .match-meta {
      font-size: 0.85rem;
      margin-bottom: 1rem;
    }
    
    .match-explanation {
      color: var(--text-secondary);
    }
    
    .no-matches {
      padding: 2rem;
      text-align: center;
      color: var(--text-muted);
    }
    
    .report-footer {
      margin-top: 4rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border-color);
    }
    
    .sources {
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
    }
    
    .disclaimer {
      font-size: 0.9rem;
      color: var(--text-secondary);
      background-color: var(--bg-surface);
      padding: 1rem;
      border-radius: 6px;
      border-left: 4px solid var(--text-muted);
      margin-bottom: 2rem;
    }
    
    .actions {
      text-align: center;
    }
    
    .loading-state, .error-banner {
      text-align: center;
      padding: 4rem;
    }
  `]
})
export class ReportComponent implements OnInit {
  jobId: string = '';
  report: FinalReport | null = null;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private jobService: JobService
  ) {}

  ngOnInit() {
    this.jobId = this.route.snapshot.paramMap.get('id') || '';
    if (this.jobId) {
      this.jobService.getJobReport(this.jobId).subscribe({
        next: (report) => {
          this.report = report;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Report not found or not ready.';
        }
      });
    }
  }
}
