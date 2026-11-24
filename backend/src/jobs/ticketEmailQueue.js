import { sendTicketConfirmationEmail } from '../services/emailService.js';

/**
 * Asynchronous Ticket Confirmation Email Queue
 * 
 * Offloads email transmission and QR rendering from the main HTTP response thread.
 * Features automatic retries (up to 3 attempts) and non-blocking in-memory execution.
 */

class TicketEmailQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.maxRetries = 3;
  }

  /**
   * Enqueue a ticket confirmation email payload
   */
  enqueue(payload) {
    if (!payload || !payload.to) {
      console.warn('[TicketEmailQueue] Ignored job with missing recipient email');
      return;
    }

    this.queue.push({
      payload,
      attempts: 0,
      createdAt: new Date(),
    });

    // Trigger queue processor
    this.processNext();
  }

  async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const currentJob = this.queue.shift();

    try {
      currentJob.attempts++;
      console.log(`[TicketEmailQueue] Processing ticket email for: ${currentJob.payload.to} (Attempt ${currentJob.attempts})`);

      await sendTicketConfirmationEmail(currentJob.payload);

      console.log(`[TicketEmailQueue] Successfully sent ticket email to: ${currentJob.payload.to}`);
    } catch (error) {
      console.error(`[TicketEmailQueue] Failed to send ticket email to ${currentJob.payload.to}:`, error.message);

      if (currentJob.attempts < this.maxRetries) {
        // Re-enqueue with delay
        setTimeout(() => {
          this.queue.push(currentJob);
          this.processNext();
        }, 3000 * currentJob.attempts);
      } else {
        console.error(`[TicketEmailQueue] Max retries exhausted for ticket email to ${currentJob.payload.to}`);
      }
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        setImmediate(() => this.processNext());
      }
    }
  }

  getQueueLength() {
    return this.queue.length;
  }
}

export const ticketEmailQueue = new TicketEmailQueue();

export const enqueueTicketEmail = (ticketData) => {
  ticketEmailQueue.enqueue(ticketData);
};

export default {
  ticketEmailQueue,
  enqueueTicketEmail,
};
