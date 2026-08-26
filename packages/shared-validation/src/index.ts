import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});

export type LoginInput = z.infer<typeof loginSchema>;

export const venueSearchSchema = z.object({
  city: z.string().optional(),
  area: z.string().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid calendar date format"
  }).optional(),
  guests: z.coerce.number().int().positive("Guests must be positive").optional(),
  session: z.enum(['MORNING', 'EVENING', 'FULL_DAY']).optional(),
  maxBudget: z.coerce.number().nonnegative("Budget must be non-negative").optional()
});

export type VenueSearchInput = z.infer<typeof venueSearchSchema>;

export const holdCreationSchema = z.object({
  venueSpaceId: z.string().uuid("Invalid venue space ID"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid calendar date format"
  }),
  session: z.enum(['MORNING', 'EVENING', 'FULL_DAY'])
});

export type HoldCreationInput = z.infer<typeof holdCreationSchema>;

export const paymentSimulationSchema = z.object({
  holdId: z.string().uuid("Invalid hold ID"),
  result: z.enum(['SUCCESS', 'FAILED'])
});

export type PaymentSimulationInput = z.infer<typeof paymentSimulationSchema>;
