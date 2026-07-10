export type QueueBackoffStrategy = 'none' | 'fixed' | 'exponential';

export type QueueJob<TPayload extends Record<string, unknown> = Record<string, unknown>> = {
  id: string;
  name: string;
  payload: TPayload;
  attempts: number;
  maxAttempts: number;
  backoffStrategy: QueueBackoffStrategy;
  createdAt: Date;
  runAt?: Date;
};

export type EnqueueJobInput<TPayload extends Record<string, unknown> = Record<string, unknown>> = {
  name: string;
  payload?: TPayload;
  runAt?: Date;
  maxAttempts?: number;
  backoffStrategy?: QueueBackoffStrategy;
};

export type RecurringJobInput<TPayload extends Record<string, unknown> = Record<string, unknown>> = EnqueueJobInput<TPayload> & {
  recurringKey: string;
  cronExpression?: string;
  intervalSeconds?: number;
};

export type QueueHandler<TPayload extends Record<string, unknown> = Record<string, unknown>> = (
  job: QueueJob<TPayload>
) => Promise<Record<string, unknown> | void>;

export type QueueProvider = {
  enqueue: <TPayload extends Record<string, unknown>>(input: EnqueueJobInput<TPayload>) => Promise<QueueJob<TPayload>>;
  scheduleRecurring: <TPayload extends Record<string, unknown>>(input: RecurringJobInput<TPayload>) => Promise<void>;
  cancelRecurring: (recurringKey: string) => Promise<void>;
  listPending: () => Promise<QueueJob[]>;
  takeReady: (limit?: number) => Promise<QueueJob[]>;
};

type RecurringRegistration = RecurringJobInput;

export class InMemoryQueueProvider implements QueueProvider {
  private readonly jobs: QueueJob[] = [];
  private readonly recurring = new Map<string, RecurringRegistration>();

  async enqueue<TPayload extends Record<string, unknown>>(input: EnqueueJobInput<TPayload>) {
    const job: QueueJob<TPayload> = {
      id: `queue-${crypto.randomUUID()}`,
      name: input.name,
      payload: input.payload ?? ({} as TPayload),
      attempts: 0,
      maxAttempts: input.maxAttempts ?? 1,
      backoffStrategy: input.backoffStrategy ?? 'exponential',
      createdAt: new Date(),
      ...(input.runAt ? { runAt: input.runAt } : {}),
    };
    this.jobs.push(job);
    return job;
  }

  async scheduleRecurring<TPayload extends Record<string, unknown>>(input: RecurringJobInput<TPayload>) {
    this.recurring.set(input.recurringKey, input);
  }

  async cancelRecurring(recurringKey: string) {
    this.recurring.delete(recurringKey);
  }

  async listPending() {
    return [...this.jobs].sort((left, right) => (left.runAt?.getTime() ?? 0) - (right.runAt?.getTime() ?? 0));
  }

  async takeReady(limit = 50) {
    const now = Date.now();
    const ready = this.jobs.filter((job) => !job.runAt || job.runAt.getTime() <= now).slice(0, limit);
    for (const job of ready) {
      const index = this.jobs.findIndex((candidate) => candidate.id === job.id);
      if (index >= 0) {
        this.jobs.splice(index, 1);
      }
    }
    return ready;
  }
}

const queueProvider = new InMemoryQueueProvider();
const queueHandlers = new Map<string, QueueHandler>();

export function getQueueProvider(): QueueProvider {
  return queueProvider;
}

export function registerQueueHandler(name: string, handler: QueueHandler) {
  queueHandlers.set(name, handler);
}

export async function executeQueuedJob(job: QueueJob) {
  const handler = queueHandlers.get(job.name);
  if (!handler) {
    throw new Error(`No queue handler registered for ${job.name}`);
  }
  return handler(job);
}

export async function executeReadyQueueJobs(limit = 50) {
  const readyJobs = await queueProvider.takeReady(limit);
  const results = [];
  for (const job of readyJobs) {
    results.push({
      job,
      result: await executeQueuedJob(job),
    });
  }
  return results;
}
