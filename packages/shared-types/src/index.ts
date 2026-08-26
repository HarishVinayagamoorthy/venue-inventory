export enum Role {
  CUSTOMER = 'CUSTOMER',
  PARTNER = 'PARTNER',
  ADMIN = 'ADMIN'
}

export enum Session {
  MORNING = 'MORNING',
  EVENING = 'EVENING',
  FULL_DAY = 'FULL_DAY'
}

export enum InvStatus {
  AVAILABLE = 'AVAILABLE',
  HOLD = 'HOLD',
  BOOKED = 'BOOKED',
  BLOCKED = 'BLOCKED'
}

export enum HoldStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CONVERTED = 'CONVERTED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

export enum BookingStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED'
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

export interface VenueSearchItemDTO {
  propertyId: string;
  propertyName: string;
  venueSpaceId: string;
  venueSpaceName: string;
  city: string;
  area: string;
  capacity: number;
  price: number;
  session: Session;
  availability: InvStatus;
  amenities: any;
}

export interface VenueSearchResponseDTO {
  items: VenueSearchItemDTO[];
  total: number;
}

export interface SessionAvailabilityDTO {
  session: Session;
  status: InvStatus;
  isAvailable: boolean;
}

export interface VenueDetailsDTO {
  property: {
    id: string;
    name: string;
    city: string;
    area: string;
  };
  venueSpace: {
    id: string;
    name: string;
    capacity: number;
    price: number;
    amenities: any;
  };
  availability?: {
    date: string;
    sessions: SessionAvailabilityDTO[];
  };
}

export interface HoldResponseDTO {
  holdId: string;
  inventoryId: string;
  venueSpaceId: string;
  date: string;
  session: Session;
  status: HoldStatus;
  expiresAt: string;
  remainingSeconds?: number;
}

export interface BookingDTO {
  id: string;
  bookingReference: string;
  status: string; // BookingStatus
}

export interface PaymentResponseDTO {
  paymentId: string;
  status: string; // PaymentStatus
  booking?: BookingDTO;
}
