import { z } from 'zod';

export const AdminRoleSchema = z.enum([
  'super_admin',
  'admin',
  'finance',
  'support',
  'viewer',
]);
export type AdminRole = z.infer<typeof AdminRoleSchema>;

export const AdminStatusSchema = z.enum(['active', 'disabled']);
export type AdminStatus = z.infer<typeof AdminStatusSchema>;

export const AdminSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  role: AdminRoleSchema,
  status: AdminStatusSchema,
  createdAt: z.string().datetime(),
});
export type Admin = z.infer<typeof AdminSchema>;

export const AdminMeResponseSchema = AdminSchema;
export type AdminMeResponse = z.infer<typeof AdminMeResponseSchema>;

export const AdminHealthResponseSchema = z.object({
  ok: z.literal(true),
  adminUid: z.string(),
  adminRole: AdminRoleSchema,
  time: z.string().datetime(),
});
export type AdminHealthResponse = z.infer<typeof AdminHealthResponseSchema>;