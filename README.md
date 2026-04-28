This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

npm run db:migrate

in your terminal. This will automatically compare your schema to the existing database, generate a new SQL migration script for you just like Flyway, and apply it safely.

## Database Management

Since PostgreSQL is installed locally on your Mac via Homebrew (version 14), you can easily start and stop it using these terminal commands:

**Start Database Background Service:**

```bash
brew services start postgresql@14
```

**Stop Database Background Service:**

```bash
brew services stop postgresql@14
```

_(Note: Once started with Homebrew, the database typically restarts automatically when you reboot your Mac)._

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

Migration script:
Update prisma/schema.prisma with your new table or line.
Run

npm run db:migrate

in your terminal. This will automatically compare your schema to the existing database, generate a new SQL migration script for you just like Flyway, and apply it safely.

Service Command

Start Postgres: brew services start postgresql@14
Stripe: stripe listen --forward-to localhost:3000/api/webhook/stripe
Worker (SMP): npm run worker
App: npm run dev
