import prisma from '../plugins/prisma';
import { VenueSearchInput } from 'shared-validation';
import { Session, InvStatus, VenueSearchItemDTO, VenueDetailsDTO, SessionAvailabilityDTO } from 'shared-types';
import { availabilityService } from './availability.service';

export class VenueService {
  
  async searchVenues(query: VenueSearchInput) {
    const { city, area, date, guests, session, maxBudget } = query;

    // 1. Build the Property & VenueSpace filter
    const spaceWhere: any = {};
    const propertyWhere: any = {};

    if (city) propertyWhere.city = city;
    if (area) propertyWhere.area = area;
    if (guests) spaceWhere.capacity = { gte: guests };
    if (maxBudget) spaceWhere.price = { lte: maxBudget };

    // Avoid N+1: Query spaces with property and their inventory for the requested date
    const targetDate = date ? new Date(date) : undefined;
    
    const spaces = await prisma.venueSpace.findMany({
      where: {
        ...spaceWhere,
        property: Object.keys(propertyWhere).length > 0 ? propertyWhere : undefined,
      },
      include: {
        property: true,
        // If a date is provided, eagerly load the inventory for that date to check availability
        inventories: targetDate ? {
          where: { date: targetDate },
          include: { holds: { where: { status: 'ACTIVE' } } }
        } : false
      }
    });

    const items: VenueSearchItemDTO[] = [];

    for (const space of spaces) {
      let finalAvailability = InvStatus.AVAILABLE;
      let targetSession = session || Session.FULL_DAY; // Default to FULL_DAY context if not provided

      if (targetDate) {
        // Calculate effective availability by lazy-expiring stale holds for read-only projection
        const now = new Date();
        const sessionStates = availabilityService.getAvailableSessions(
          space.inventories.map((inv: any) => {
            let actualStatus = inv.status;
            if (actualStatus === InvStatus.HOLD) {
              const activeValidHold = inv.holds?.find((h: any) => h.status === 'ACTIVE' && new Date(h.expiresAt) > now);
              if (!activeValidHold) {
                actualStatus = InvStatus.AVAILABLE;
              }
            }
            return { session: inv.session as Session, status: actualStatus as InvStatus };
          })
        );

        if (session) {
          finalAvailability = sessionStates[session];
        } else {
          // If no specific session was requested, show FULL_DAY availability as the baseline, 
          // or just mark available if ANY session is available. For simplicity, we use FULL_DAY.
          finalAvailability = sessionStates[Session.FULL_DAY];
        }

        // If the user requested a specific session and it's NOT available, 
        // we might still return the venue but with status = BOOKED/UNAVAILABLE, 
        // or filter it out. The prompt says "receive only venues that are... available for the requested date/session"
        // So we filter out unavailable ones if date AND session are provided.
        if (session && finalAvailability !== InvStatus.AVAILABLE) {
          continue; // Skip this space as it's not available for the requested slot
        }
      }

      items.push({
        propertyId: space.property.id,
        propertyName: space.property.name,
        venueSpaceId: space.id,
        venueSpaceName: space.name,
        city: space.property.city,
        area: space.property.area,
        capacity: space.capacity,
        price: Number(space.price),
        session: targetSession as Session,
        availability: finalAvailability,
        amenities: space.amenities
      });
    }

    return {
      items,
      total: items.length
    };
  }

  async getVenueDetails(venueSpaceId: string, dateStr?: string): Promise<VenueDetailsDTO | null> {
    const targetDate = dateStr ? new Date(dateStr) : undefined;

    const space = await prisma.venueSpace.findUnique({
      where: { id: venueSpaceId },
      include: {
        property: true,
        inventories: targetDate ? {
          where: { date: targetDate },
          include: { holds: { where: { status: 'ACTIVE' } } }
        } : false
      }
    });

    if (!space) return null;

    let availabilityInfo: VenueDetailsDTO['availability'] = undefined;

    if (targetDate) {
      const now = new Date();
      const sessionStates = availabilityService.getAvailableSessions(
        space.inventories.map((inv: any) => {
          let actualStatus = inv.status;
          if (actualStatus === InvStatus.HOLD) {
            const activeValidHold = inv.holds?.find((h: any) => h.status === 'ACTIVE' && new Date(h.expiresAt) > now);
            if (!activeValidHold) {
              actualStatus = InvStatus.AVAILABLE;
            }
          }
          return { session: inv.session as Session, status: actualStatus as InvStatus };
        })
      );

      const sessions: SessionAvailabilityDTO[] = Object.values(Session).map(s => {
        const effStatus = sessionStates[s as Session];
        return {
          session: s as Session,
          status: effStatus,
          isAvailable: effStatus === InvStatus.AVAILABLE
        };
      });

      availabilityInfo = {
        date: dateStr!,
        sessions
      };
    }

    return {
      property: {
        id: space.property.id,
        name: space.property.name,
        city: space.property.city,
        area: space.property.area
      },
      venueSpace: {
        id: space.id,
        name: space.name,
        capacity: space.capacity,
        price: Number(space.price),
        amenities: space.amenities
      },
      availability: availabilityInfo
    };
  }
}

export const venueService = new VenueService();
