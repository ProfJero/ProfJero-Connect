import { z } from 'zod';

export const ProjectStatusSchema = z.enum(['active', 'suspended', 'archived']);
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  contactEmail: z.string().email().nullable(),
  contactPhone: z.string().nullable(),
  status: ProjectStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string(),
  updatedBy: z.string(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const CreateProjectInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().max(30).nullable().optional(),
});
export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>;

export const UpdateProjectInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().max(30).nullable().optional(),
  status: ProjectStatusSchema.optional(),
});
export type UpdateProjectInput = z.infer<typeof UpdateProjectInputSchema>;

export const ProjectListResponseSchema = z.object({
  projects: z.array(ProjectSchema),
  count: z.number().int().nonnegative(),
});
export type ProjectListResponse = z.infer<typeof ProjectListResponseSchema>;

export const ProjectResponseSchema = z.object({
  project: ProjectSchema,
});
export type ProjectResponse = z.infer<typeof ProjectResponseSchema>;