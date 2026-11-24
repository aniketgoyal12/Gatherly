// Gatherly Core TypeScript Definitions matching backend models

export type UserRole = 'super_admin' | 'organizer' | 'attendee' | 'staff';
export type UserAccountStatus = 'active' | 'suspended';

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  accountStatus: UserAccountStatus;
  phone?: string;
  avatar?: string;
  bio?: string;
  interests?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Venue {
  id?: string;
  _id?: string;
  name: string;
  address: string;
  city?: string;
  capacity: number;
  facilities: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type EventStatus =
  | 'draft'
  | 'pending_approval'
  | 'published'
  | 'rejected'
  | 'completed'
  | 'cancelled';

export interface TicketTier {
  id?: string;
  _id?: string;
  name: string;
  price: number;
  capacity: number;
  remaining?: number;
  description?: string;
}

export interface Event {
  id?: string;
  _id?: string;
  title: string;
  description: string;
  category: string;
  organizerId: string | User;
  organizerName?: string;
  venueId?: string | Venue;
  venue?: Venue | string;
  locationName?: string;
  isOnline?: boolean;
  meetingLink?: string;
  dates?: {
    startDate: string;
    endDate: string;
  };
  startDate: string;
  endDate: string;
  capacity: number;
  remainingCapacity?: number;
  ticketPrice?: number;
  ticketTiers?: TicketTier[];
  tiers?: TicketTier[];
  status: EventStatus;
  bannerUrl?: string;
  moderationReason?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Registration {
  id?: string;
  _id?: string;
  userId: string | User;
  eventId: string | Event;
  ticketTierId?: string;
  ticketTierName?: string;
  ticketType?: string;
  quantity?: number;
  totalAmount?: number;
  bookingStatus: BookingStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type TicketStatus =
  | 'valid'
  | 'checked_in'
  | 'cancelled'
  | 'refunded'
  | 'expired';

export interface Ticket {
  id?: string;
  _id?: string;
  ticketCode: string;
  registrationId?: string | Registration;
  eventId: string | Event;
  userId?: string | User;
  tokenHash?: string;
  rawQrToken?: string;
  signedTicketToken?: string;
  ticketStatus: TicketStatus;
  status?: TicketStatus;
  attendeeName?: string;
  attendeeEmail?: string;
  tierName?: string;
  price?: number;
  eventTitle?: string;
  eventDate?: string;
  venueName?: string;
  checkedInAt?: string;
  checkedInBy?: string | User;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExpenseCategory {
  category: string;
  allocated: number;
  spent: number;
}

export interface Budget {
  id?: string;
  _id?: string;
  eventId: string | Event;
  totalBudget: number;
  expenseCategories: ExpenseCategory[];
  actualExpenses?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id?: string;
  _id?: string;
  eventId: string | Event;
  assignedTo?: string | User;
  title: string;
  description?: string;
  deadline?: string;
  priority: TaskPriority;
  status: TaskStatus;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Feedback {
  id?: string;
  _id?: string;
  eventId: string | Event;
  userId: string | User;
  rating: number;
  review?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationItem {
  id?: string;
  _id?: string;
  userId?: string;
  title: string;
  message?: string;
  body?: string;
  type?: 'info' | 'success' | 'warning' | 'alert';
  readStatus?: boolean;
  read?: boolean;
  link?: string;
  createdAt?: string;
}

export interface AuditLog {
  id?: string;
  _id?: string;
  userId?: string | User;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  timestamp?: string;
  createdAt?: string;
}

export interface EventStaff {
  id?: string;
  _id?: string;
  eventId: string | Event;
  userId: string | User;
  gate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  error?: {
    code: string;
    details?: Array<{
      field: string;
      issue: string;
    }>;
  } | null;
  pagination?: {
    total: number;
    pages: number;
    current: number;
    limit: number;
  };
}
