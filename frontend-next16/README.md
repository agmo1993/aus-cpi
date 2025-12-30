# AusCPI Dashboard - Next.js 15 + TypeScript + shadcn/ui

Modern frontend for the Australian Consumer Price Index (CPI) and Wage Price Index (WPI) analytics dashboard.

## Tech Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript (strict mode)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Charts**: shadcn charts (Recharts) + Highcharts + D3.js (hybrid approach)
- **Database**: PostgreSQL with typed queries
- **Validation**: Zod

## Project Structure

```
frontend-next15/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── api/                # API routes
│   ├── components/
│   │   └── ui/                 # shadcn/ui components
│   ├── lib/
│   │   ├── db.ts              # PostgreSQL client with connection pooling
│   │   ├── env.ts             # Environment variable validation
│   │   ├── colors.ts          # AusCPI color palette
│   │   └── utils.ts           # Utility functions (cn, etc.)
│   └── types/                  # TypeScript type definitions
├── public/                     # Static assets
├── tailwind.config.ts          # Tailwind + custom theme configuration
├── components.json             # shadcn/ui configuration
└── tsconfig.json               # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database with AusCPI data

### Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

2. Configure your environment variables:
   ```env
   DB_HOST=your-database-host
   DB_USER=your-database-user
   DB_PASS=your-database-password
   DB_PORT=5432
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Custom Color Scheme

The application uses a custom color palette ported from the original design:

- **Background**: `#ECEEE6` (light gray)
- **Primary**: Dark text/UI color
- **Secondary**: `#3cad92` (teal/green accent)
- **Success**: `#7596AD` (blue)
- **Danger**: `#7D8A8E` (gray)
- **Warning**: `#ffc107` (amber)
- **Info**: `#242D42` (dark blue)

### Chart Colors

10 distinct colors for multi-line charts:
- Blue, Green, Red, Purple, Orange, Teal, Pink, Brown, Gray, Black

Access colors via:
```typescript
import { colors, chartColors, getChartColor } from '@/lib/colors';
```

## Database Client

The database client uses connection pooling for optimal performance with serverless functions:

```typescript
import { query } from '@/lib/db';

const result = await query<YourType>(
  'SELECT * FROM table WHERE id = $1',
  [id]
);
```

## Type Safety

All database queries, API routes, and components are fully typed:

- Environment variables validated with Zod
- Parameterized queries for SQL injection prevention
- Strict TypeScript mode enabled
- Type-safe API routes and responses

## shadcn/ui Components

Installed components:
- `button`, `card`, `table`, `input`, `label`, `select`
- `badge`, `separator`, `skeleton`, `switch`
- `command`, `dialog`, `navigation-menu`
- `chart` (Recharts-based)

Add new components:
```bash
npx shadcn@latest add [component-name]
```

## Migration Status

### Phase 1: Setup ✅ COMPLETE
- ✅ Next.js 15 + TypeScript initialized
- ✅ Tailwind CSS configured
- ✅ shadcn/ui installed and configured
- ✅ Database client with TypeScript
- ✅ Environment validation with Zod
- ✅ Custom color scheme ported

### Next Phases
- Phase 2: Type System & Data Models
- Phase 3: API Routes Migration
- Phase 4: Component Migration
- Phase 5: Page Migration
- Phase 6: Styling & Theme
- Phase 7: Data Fetching
- Phase 8: Testing
- Phase 9: Documentation & Deployment

## Development Notes

- Uses Next.js 16 (latest) with React 19
- Tailwind CSS v3 for shadcn/ui compatibility
- Connection pooling for database queries
- Server components for data fetching
- Client components for interactivity

## Original Frontend

The original frontend is preserved at `/frontend` for comparison and rollback capability.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## License

This project is part of the AusCPI Dashboard.
