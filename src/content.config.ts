import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const featureSchema = z.object({
  title: z.string(),
  description: z.string(),
  icon: z.string(),
});

const processStepSchema = z.object({
  step: z.number(),
  title: z.string(),
  description: z.string(),
});

const resultSchema = z.object({
  value: z.string(),
  description: z.string(),
});

const testimonialSchema = z.object({
  quote: z.string(),
  author: z.string(),
  role: z.string(),
  rating: z.number(),
});

const serviceIncludeSchema = z.object({
  title: z.string(),
  icon: z.string(),
  description: z.string(),
});

const serviceExampleSchema = z.object({
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
});

const servicePricingSchema = z.object({
  name: z.string(),
  price: z.string(),
  description: z.string(),
  features: z.array(z.string()),
});

const serviceFaqSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const faqSchema = z.object({
  question: z.string(),
  answer: z.string(),
  order: z.number().default(99),
  badge: z.string().optional(),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    category: z.string(),
    icon: z.string(),
    image: z.string(),
    description: z.string(),
    type: z.string(),
    platform: z.string(),
    technologies: z.string(),
    duration: z.string(),
    year: z.string(),
    role: z.string(),
    link: z.string().optional(),
    github: z.string().optional(),
    pinned: z.boolean().default(false),
    galleryFormat: z.enum(['16:9', '9:16']).optional(),
    features: z.array(featureSchema).default([]),
    process: z.array(processStepSchema).default([]),
    results: z.array(resultSchema).default([]),
    gallery: z.array(z.string()).default([]),
    testimonial: testimonialSchema.optional(),
  }),
});

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    shortTitle: z.string(),
    icon: z.string(),
    description: z.string(),
    heroSubtitle: z.string(),
    isPopular: z.boolean().default(false),
    order: z.number().default(99),
    badge: z.string().optional(),
    mascotSrc: z.string().optional(),
    mascotTitle: z.string().optional(),
    mascotDesc: z.string().optional(),
    includes: z.array(serviceIncludeSchema).default([]),
    examples: z.array(serviceExampleSchema).default([]),
    process: z.array(processStepSchema).default([]),
    technologies: z.array(z.string()).default([]),
    pricing: z.array(servicePricingSchema).default([]),
    faq: z.array(serviceFaqSchema).default([]),
  }),
});

const faqs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/faq' }),
  schema: faqSchema,
});

const specializations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/specializations' }),
  schema: z.object({
    title: z.string(),
    desc: z.string(),
    icon: z.string(),
    order: z.number().default(99),
    fullDescription: z.string().default(''),
  }),
});

export const collections = { projects, services, specializations, faqs };
