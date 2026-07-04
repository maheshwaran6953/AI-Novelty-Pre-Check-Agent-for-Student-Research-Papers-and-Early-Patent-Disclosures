import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Job, FinalReport } from '../models/job.model';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private readonly baseUrl = 'http://localhost:3000/api/v1/jobs';

  constructor(private http: HttpClient) {}

  uploadFile(file: File): Observable<{ jobId: string; status: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ jobId: string; status: string }>(this.baseUrl, formData);
  }

  getJobStatus(id: string): Observable<Job> {
    return this.http.get<Job>(`${this.baseUrl}/${id}`);
  }

  getJobReport(id: string): Observable<FinalReport> {
    return this.http.get<FinalReport>(`${this.baseUrl}/${id}/report`);
  }

  getJobHistory(): Observable<Job[]> {
    return this.http.get<Job[]>(this.baseUrl);
  }
}
