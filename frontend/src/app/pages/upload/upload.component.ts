import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { JobService } from '../../services/job.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <div class="upload-header">
        <h1>AI Novelty Pre-Check Agent</h1>
        <p class="subtitle">Upload a research paper or disclosure (PDF/TXT) to begin the pipeline.</p>
      </div>

      <div class="card upload-card" 
           (dragover)="onDragOver($event)" 
           (dragleave)="onDragLeave($event)" 
           (drop)="onDrop($event)"
           [class.dragging]="isDragging">
        
        <div class="upload-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        </div>
        
        <h3 *ngIf="!selectedFile">Drag and drop your document here</h3>
        <h3 *ngIf="selectedFile" class="mono text-accent">{{ selectedFile.name }}</h3>
        
        <p *ngIf="!selectedFile" class="text-muted">or</p>
        
        <input type="file" id="fileInput" class="hidden-input" (change)="onFileSelected($event)" accept=".pdf,.txt">
        <label for="fileInput" class="btn-primary">Browse Files</label>
        
      </div>

      <div *ngIf="errorMessage" class="error-banner">
        {{ errorMessage }}
      </div>

      <div class="actions" *ngIf="selectedFile">
        <button class="btn-primary btn-large" (click)="upload()" [disabled]="isUploading">
          {{ isUploading ? 'Initializing Agent...' : 'Start Pre-Check Pipeline' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .upload-header {
      text-align: center;
      margin-bottom: 3rem;
    }
    .subtitle {
      color: var(--text-secondary);
      font-size: 1.1rem;
    }
    .upload-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      border: 2px dashed var(--border-color);
      background-color: var(--bg-surface);
      transition: all 0.3s ease;
      text-align: center;
    }
    .upload-card.dragging {
      border-color: var(--accent-primary);
      background-color: var(--bg-surface-hover);
    }
    .upload-icon {
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }
    .upload-card.dragging .upload-icon {
      color: var(--accent-primary);
    }
    .hidden-input {
      display: none;
    }
    .text-accent {
      color: var(--accent-primary);
    }
    .text-muted {
      color: var(--text-muted);
      margin: 1rem 0;
    }
    .actions {
      display: flex;
      justify-content: center;
      margin-top: 2rem;
    }
    .btn-large {
      padding: 1rem 3rem;
      font-size: 1.1rem;
    }
    .error-banner {
      background-color: rgba(239, 68, 68, 0.1);
      border: 1px solid var(--status-error);
      color: var(--status-error);
      padding: 1rem;
      border-radius: 6px;
      margin-top: 1rem;
      text-align: center;
    }
  `]
})
export class UploadComponent {
  isDragging = false;
  selectedFile: File | null = null;
  isUploading = false;
  errorMessage = '';

  constructor(private jobService: JobService, private router: Router) {}

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File) {
    this.errorMessage = '';
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'txt') {
      this.errorMessage = 'Only PDF or TXT files are supported.';
      return;
    }
    this.selectedFile = file;
  }

  upload() {
    if (!this.selectedFile) return;
    
    this.isUploading = true;
    this.errorMessage = '';
    
    this.jobService.uploadFile(this.selectedFile).subscribe({
      next: (res) => {
        this.router.navigate(['/status', res.jobId]);
      },
      error: (err) => {
        this.isUploading = false;
        this.errorMessage = err.error?.message || 'Upload failed. Ensure backend is running.';
      }
    });
  }
}
