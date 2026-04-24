export type JobType = 'in_app' | 'call';

export type JobStatus =
  | 'pending'       // in_app: waiting for worker to respond
  | 'call_pending'  // call: customer confirmed, waiting for worker
  | 'accepted'      // worker accepted, not yet started
  | 'started'       // worker en route — tracking is live
  | 'completed'     // job done
  | 'declined'      // worker declined
  | 'cancelled';    // cancelled by either party

export interface JobWorkerSnippet {
  id: string;
  name: string;
  avatarUrl: string | null;
  phone: string;
  trades: string[];
  rating: number;
}

export interface JobCustomerSnippet {
  id: string;
  name: string;
  avatarUrl: string | null;
  phone: string;
}

export interface JobRequest {
  id: string;
  customerId: string;
  workerId: string;
  type: JobType;
  description?: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  worker?: JobWorkerSnippet;
  customer?: JobCustomerSnippet;
}

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  pending: 'Waiting for response',
  call_pending: 'Waiting for confirmation',
  accepted: 'Accepted — starting soon',
  started: 'En route',
  completed: 'Completed',
  declined: 'Declined',
  cancelled: 'Cancelled',
};

export function isActiveJob(status: JobStatus): boolean {
  return ['pending', 'call_pending', 'accepted', 'started'].includes(status);
}
