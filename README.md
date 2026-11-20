<div align="center">

# Sequence3

**The marketing website for Sequence3, AI-powered conversation workspaces for SMEs.**

A unified inbox and explainable AI assistant that brings Facebook, Instagram and website chat into one place, with AI reply drafts, sentiment analysis and automation.

[![Website](https://img.shields.io/badge/sq3.io-live-22c55e?style=for-the-badge&logo=vercel&logoColor=white)](https://sq3.io)
[![sequence3.se](https://img.shields.io/badge/sequence3.se-live-22c55e?style=for-the-badge&logo=googlechrome&logoColor=white)](https://sequence3.se)
[![sq3.one](https://img.shields.io/badge/sq3.one-live-22c55e?style=for-the-badge&logo=googlechrome&logoColor=white)](https://sq3.one)

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-149ECA?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=flat-square&logo=shadcnui&logoColor=white)
![Motion](https://img.shields.io/badge/Motion-FFF312?style=flat-square&logo=framer&logoColor=black)
![GSAP](https://img.shields.io/badge/GSAP-0AE448?style=flat-square&logo=greensock&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-F38020?style=flat-square&logo=cloudflare&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat-square&logo=openai&logoColor=white)
![Pinecone](https://img.shields.io/badge/Pinecone-000000?style=flat-square&logo=pinecone&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

![SDGP](https://img.shields.io/badge/IIT-SDGP_·_CS--22-6366f1?style=flat-square)
![License](https://img.shields.io/badge/license-proprietary-ef4444?style=flat-square)

</div>

---

## Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Team](#team)
- [Copyright](#copyright)

## Features

**Landing page**

- Hero, product video, bento grid, feature slideshow, growth, pricing, testimonials, FAQ and call-to-action sections
- Waitlist sign-up, an interactive globe, marquee logos and animated bento cards
- Light and dark themes

**SQ3 Assistant**

- A chat widget on the site that answers questions about Sequence3
- Retrieval-augmented generation: site knowledge is embedded with OpenAI `text-embedding-3-small`, stored in Pinecone and passed to `gpt-4o-mini` as context
- Streaming replies and suggested questions built with AI Elements components

**Blog and dashboard**

- Public blog with Markdown posts, syntax highlighting (Shiki) and YouTube embeds
- Protected dashboard for writing and editing posts, behind Supabase Auth
- Post editor with keyboard shortcuts and undo
- Cover images uploaded to Cloudflare R2

**SEO and platform**

- Generated sitemap, Open Graph image, web manifest and JSON-LD structured data
- HTTPS redirect and dashboard auth checks in middleware
- Daily Vercel cron job that keeps the Supabase project active

## Tech Stack

| Area | Tools |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui, Radix UI, tw-animate-css |
| Animation | Motion, GSAP, cobe (globe), NumberFlow |
| AI | OpenAI, Pinecone, AI Elements (Vercel AI SDK) |
| Content | Supabase (Postgres + Auth), react-markdown, Shiki |
| Storage | Cloudflare R2 (S3-compatible) |
| Hosting | Vercel (with Cron Jobs) |

## Project Structure

```text
src/
├── app/
│   ├── api/            # chat, image upload/delete, cron keep-alive
│   ├── blog/           # public blog
│   ├── dashboard/      # protected post editor and settings
│   └── utils/          # embeddings, Pinecone and RAG context helpers
├── components/
│   ├── sections/       # landing page sections
│   ├── sq3-assistant/  # chat widget
│   ├── ai-elements/    # chat UI building blocks
│   └── ui/             # shadcn/ui components
├── features/blog/      # blog data, types and renderers
├── hooks/
└── lib/                # site config, Supabase and R2 clients
scripts/
└── load-rag-data.ts    # embeds scripts/sq3.txt into Pinecone
supabase-schema.sql     # posts table
```

## Getting Started

**Prerequisites:** Node.js 20+, pnpm, and accounts for Supabase, Cloudflare R2, OpenAI and Pinecone.

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create `.env.local` with the variables listed below.

3. Create the `posts` table by running `supabase-schema.sql` in the Supabase SQL editor.

4. Load the assistant's knowledge base into Pinecone:

   ```bash
   pnpm load-rag-data
   ```

5. Start the dev server and open http://localhost:3000:

   ```bash
   pnpm dev
   ```

## Environment Variables

| Variable | Used for |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Public site URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `OPENAI_API_KEY` | Chat completions and embeddings |
| `PINECONE_API_KEY` | Pinecone access |
| `PINECONE_INDEX` | Pinecone index name or host |
| `PINECONE_NAMESPACE` | Pinecone namespace for the knowledge base |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET_NAME` | R2 bucket for blog images |
| `NEXT_PUBLIC_R2_DOMAIN` | Public domain that serves R2 images |

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Build for production |
| `pnpm start` | Run the production build |
| `pnpm lint` | Lint the project |
| `pnpm load-rag-data` | Embed `scripts/sq3.txt` and upload it to Pinecone |

## Deployment

The site is deployed on Vercel. Add the environment variables in the Vercel project settings. `vercel.json` schedules `/api/cron/keep-alive` to run daily at midnight UTC so the Supabase project is not paused for inactivity.

## Team

Built by team **CS-22** for the Software Development Group Project (SDGP) at the [Informatics Institute of Technology (IIT)](https://www.iit.ac.lk), Sri Lanka.

## Copyright

© 2025 Sequence3 // CS-22. All rights reserved.

This is the marketing website for Sequence3. All content, design and code are proprietary and protected by copyright law. No license is granted to copy, modify or distribute this project.
