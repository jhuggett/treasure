import { SubscribableEvent } from "./subscribable-event.ts";

interface ScheduledJob {
  targetTime: number;
  job: () => { repeatAfter: number } | void;
}

export class Time {
  constructor(private current: number) {}

  currentTime() {
    return this.current;
  }

  scheduledJobs: ScheduledJob[] = [];

  moveTimeForwardBy(amount: number) {
    this.current += amount;
    this.scheduledJobs = this.scheduledJobs.filter((job) => {
      if (job.targetTime <= this.current) {
        const result = job.job();
        if (result) {
          this.schedule(result.repeatAfter, job.job);
        } else {
          return false;
        }
      }
      return true;
    });
    this.onTimeChanged.emit();
  }

  schedule(delay: number, job: ScheduledJob["job"]) {
    this.scheduledJobs.push({
      targetTime: this.current + delay,
      job,
    });

    return {
      unschedule: () => this.unschedule(job),
    };
  }

  unschedule(job: () => void) {
    this.scheduledJobs = this.scheduledJobs.filter((j) => j.job !== job);
  }

  onTimeChanged = new SubscribableEvent<void>();
}
