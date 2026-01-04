# Rez - MVP Specification

> **Rez by Canvassing** - A research task management platform that connects researchers with real users (particularly stablecoin users in emerging markets) to complete surveys, test applications, and participate in research activities.

---

## Table of Contents

1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Data Models](#data-models)
4. [Authentication & Authorization](#authentication--authorization)
5. [Pages & Routes](#pages--routes)
6. [Features & Business Logic](#features--business-logic)
7. [UI/UX Specifications](#uiux-specifications)
8. [API Endpoints](#api-endpoints)
9. [State Management](#state-management)
10. [Integrations](#integrations)
11. [Environment Variables](#environment-variables)
12. [Tech Stack Recommendations](#tech-stack-recommendations)

---

## Overview

### What is Rez?

Rez is a web application for **researchers** (called "Task Masters") to create and manage research tasks that are completed by participants through a companion mobile app called **Pax**. The platform enables:

- **Task Creation**: Researchers create tasks (surveys, app testing, video interviews)
- **Task Management**: View, track, and monitor task completions
- **Analytics**: Visualize task completion data and participant demographics
- **Organization Management**: Researchers belong to organizations

### Target Users

- **Primary**: Researchers, UX teams, product managers who need user feedback
- **Secondary**: Organizations conducting market research in emerging markets
- **Focus Area**: Users who actively use stablecoins and digital payments (Africa-focused)

### Key Value Proposition

"Reach real users who actively use stablecoins in their daily lives."

---

## Core Concepts

### Task Master
A researcher or user of the Rez platform who creates and manages tasks.

### Organization
A company or team that Task Masters belong to. Each Task Master must create or join an organization during onboarding.

### Task
A research activity that participants complete. Tasks have types:
- **Fill a Form**: Survey/questionnaire completion
- **Check Out App**: Product/app testing with feedback
- **Do Video Interview**: Qualitative research (coming soon)

### Task Completion
A record of a participant completing a task, tracked in the system.

### Pax
The companion mobile app where participants discover and complete tasks. Rez is the admin/researcher dashboard.

---

## Data Models

### TaskMaster

```typescript
interface TaskMaster {
  id: string;                      // Unique identifier (use auth provider's user ID)
  name: string | null;             // Display name
  emailAddress: string | null;     // Email address
  profilePictureURI: string | null; // Avatar URL
  organizationId: string | null;   // Reference to Organization
  timeCreated: Timestamp;          // When account was created
  timeUpdated: Timestamp;          // Last update time
}
```

### Organization

```typescript
interface Organization {
  id: string;                      // Unique identifier
  taskMasterId: string | null;     // Creator's TaskMaster ID
  name: string | null;             // Organization name
  country: string | null;          // Country of operation
  teamSize: string | null;         // Team size category
  timeCreated: Timestamp;
  timeUpdated: Timestamp;
}

// Team size options: "< 2" | "2 - 5" | "5 - 10" | "10 - 50" | "50+"
```

### Task

```typescript
interface Task {
  id: string;
  taskMasterId: string;                    // System task master ID (for Pax integration)
  rezTaskMasterEmailAddress: string | null; // Creator's email (for filtering)
  
  // Core Details
  title: string;
  type: 'fillAForm' | 'checkOutApp' | 'doVideoInterview';
  category: 'Finance' | 'Climate' | 'Education' | 'Health' | 'Technology' | 'Other';
  levelOfDifficulty: 'Easy' | 'Medium' | 'Hard';
  
  // Task Content
  link: string | null;              // URL to form or product
  instructions: string | null;      // Instructions for participants
  feedback: string | null;          // Feedback form URL (for checkOutApp)
  
  // Participant Settings
  targetNumberOfParticipants: number;
  estimatedTimeOfCompletionInMinutes: number;
  targetCountry: string;            // "ALL" or specific country code
  
  // Rewards (managed by Pax system)
  rewardAmountPerParticipant: number;
  rewardCurrencyId: number;
  managerContractAddress: string;   // Smart contract for payments
  
  // Status & Timing
  isAvailable: boolean;
  isTest: boolean;
  deadline: Timestamp;
  numberOfCooldownHours: number;
  paymentTerms: 'immediate' | 'delayed';
  
  // Timestamps
  timeCreated: Timestamp;
  timeUpdated: Timestamp;
}
```

### TaskCompletion

```typescript
interface TaskCompletion {
  id: string;
  taskId: string;                  // Reference to Task
  participantId: string;           // Pax participant ID
  screeningId: string | null;      // Optional screening reference
  timeCreated: Timestamp;
  timeUpdated: Timestamp;
  timeCompleted: Timestamp | null;
}
```

---

## Authentication & Authorization

### Authentication Flow

1. **Sign In**: Google OAuth (or your preferred auth provider)
2. **New User Detection**: Check if TaskMaster record exists
3. **Organization Check**: Verify if user has an organization
4. **Routing**:
   - No account → Create TaskMaster → Organization Onboarding
   - Account, no org → Organization Onboarding
   - Account + org → Dashboard

### Protected Routes

All routes except `/sign-in` require authentication.

### Middleware Logic

```typescript
// Pseudocode for route protection
function middleware(request) {
  const path = request.pathname;
  const authToken = getCookie('authToken');
  const orgId = getCookie('organizationId');
  
  // Redirect root to dashboard
  if (path === '/') redirect('/dashboard');
  
  // Public routes
  if (path === '/sign-in') {
    if (authToken) {
      if (!orgId) redirect('/organization-onboarding');
      else redirect('/dashboard');
    }
    return next();
  }
  
  // Protected routes - require auth
  if (!authToken) redirect('/sign-in');
  
  // Organization check
  if (orgId && path === '/organization-onboarding') redirect('/dashboard');
  if (!orgId && path !== '/organization-onboarding') redirect('/organization-onboarding');
  
  return next();
}
```

### Cookie Management

Store after successful authentication:
- `authToken` - Authentication token
- `organizationId` - User's organization ID (after onboarding)

Clear on sign out:
- Remove all auth-related cookies

---

## Pages & Routes

### 1. Sign In Page (`/sign-in`)

**Purpose**: User authentication entry point

**Layout**:
- Split screen design (left: form, right: marketing image)
- Centered card with gradient border
- App logo prominently displayed

**Components**:
- App logo
- Welcome message with gradient text
- "Continue with Google" button
- Error message display
- Marketing tagline: "Reach real users who actively use stablecoins in their daily lives."
- Decorative image of people

**Behavior**:
- On successful sign-in:
  - Check if TaskMaster exists → create if not
  - Check if has organization → redirect accordingly
- Handle errors gracefully (cancelled sign-in, auth failures)

---

### 2. Organization Onboarding (`/organization-onboarding`)

**Purpose**: Collect organization details for new users

**Layout**:
- Split screen (left: form, right: marketing image)
- Form card with validation

**Form Fields**:

| Field | Type | Validation | Options |
|-------|------|------------|---------|
| Organization Name | Text Input | Min 2 characters | - |
| Organization Country | Country Dropdown | Required | All countries with flags |
| Team Size | Select | Required | < 2, 2-5, 5-10, 10-50, 50+ |

**Behavior**:
- Pre-fill greeting with user's name if available
- On submit:
  - Create Organization record
  - Update TaskMaster with organizationId
  - Set organizationId cookie
  - Redirect to Dashboard
- Show loading state during submission

**Marketing Message**: "Launch surveys and start receiving results within hours."

---

### 3. Dashboard (`/dashboard`)

**Purpose**: Overview of tasks and quick actions

**Layout**:
- Header with title, subtitle, and refresh button
- Stats cards row
- Quick actions section

**Components**:

#### Stats Cards (3 cards)
1. **Total Tasks**: Count of all tasks ever created
2. **Active Tasks**: Count of tasks where `isAvailable === true`
3. **Total Task Completions**: Sum of all completions across tasks

#### Quick Actions
- "Create New Task" card → Links to `/tasks`

#### Refresh Button
- 30-minute cooldown between refreshes
- Shows countdown timer when on cooldown
- Animated spinner while loading

**Data Fetching**:
- Fetch tasks filtered by current user's email
- Fetch task completions for those tasks

---

### 4. Tasks Page (`/tasks`)

**Purpose**: Create and view tasks

**Layout**:
- Tab-based interface
- Two tabs: "Create New Task" | "View Tasks"

#### Tab 1: Create New Task

**Multi-step wizard** (4 steps):

##### Step 1: Task Type
Select one of three types:
- **Fill a Form** - Users fill out forms/surveys
- **Check Out App** - Users test mobile/web applications
- **Do Video Interview** - (Coming Soon - disabled)

Display as clickable cards with selection state.

##### Step 2: Task Details

| Field | Type | Options |
|-------|------|---------|
| Title | Text Input | Free text |
| Category | Select | Finance, Climate, Education, Health, Technology, Other |
| Difficulty | Select | Easy, Medium, Hard |

##### Step 3: Questions & Tasks

**For "Fill a Form":**
- Link to form (URL input)

**For "Check Out App":**
- Link to product (URL input)
- Instructions (Textarea)
- Link to feedback form (URL input)

##### Step 4: Review
Display all entered data for confirmation before submission.

**Stepper UI**:
- Visual step indicator (1-4)
- Back/Continue navigation
- Finish button on step 4

**Rate Limiting**:
- Users can only create **1 task per week**
- Show banner with countdown if limit reached
- Display when user can create next task

**On Submit**:
- Call create task API
- Send notification (Telegram)
- Refresh tasks list
- Reset form

#### Tab 2: View Tasks

**Table with columns**:
| Column | Description |
|--------|-------------|
| # | Row number |
| Title | Task title (truncated) |
| Type | Badge showing task type |
| Category | Badge showing category |
| Status | Active/Inactive badge |
| Time Created | Formatted date/time |
| Target Participants | Number |
| Total Completions | Calculated count |
| Complete | Yes/No badge (completions >= target) |

**Sorting**: By deadline, latest first

**Refresh**: Same 30-minute cooldown as dashboard

---

### 5. Analytics Page (`/analytics`)

**Purpose**: Visualize task completion data

**Layout**:
- 2x2 grid of chart cards

**Charts** (can use placeholder/mock data initially):

1. **Task Completions Over Time**
   - Line chart
   - X-axis: Months
   - Y-axis: Completion count

2. **Time of Task Completions**
   - Shows distribution by time of day

3. **Gender Distribution**
   - Pie/donut chart of participant genders

4. **Country Distribution**
   - Geographic breakdown of participants

---

### 6. Resources Page (`/resources`)

**Purpose**: Educational content and research articles

**Layout**:
- Tab interface: "Overview" | "Articles"

#### Overview Tab
- Hero banner with community image
- Resource type cards (Articles & Blogs card)
- Clicking navigates to Articles tab

#### Articles Tab
- Grid of article cards (responsive: 1-4 columns)

**Article Card Structure**:
```typescript
interface ForumArticle {
  id: string;
  title: string;
  description: string;
  date: string;           // YYYY-MM-DD format
  imageUrl: string;       // Local image path
  postUrl: string;        // External link (e.g., forum post)
  category: string;       // Badge label
}
```

**Card Features**:
- Image with category badge overlay
- Title and description (truncated)
- Date with calendar icon
- "Read More" button
- Opens external URL in new tab

---

### 7. Account Page (`/account`)

**Purpose**: View and manage profile

**Layout**:
- Tab interface (single "Profile" tab)
- Two-column layout: Avatar | Form

**Profile Photo Section**:
- Large avatar display
- Shows user's profile picture from auth provider

**Personal Information Form** (Read-only for MVP):
- Full Name
- Email

**Note**: Fields are disabled/read-only as they come from auth provider.

---

### 8. Pax Page (`/pax`)

**Purpose**: Embedded analytics dashboard

**Layout**:
- Full-height iframe embedding external analytics
- Header with title and description

**Content**:
- Embedded Looker Studio report (or similar BI tool)
- Provides participant-level analytics

---

## Features & Business Logic

### Task Creation Defaults

When creating a task, apply these defaults:

```typescript
const taskDefaults = {
  taskMasterId: "SYSTEM_TASK_MASTER_ID",        // Your system's master ID
  estimatedTimeOfCompletionInMinutes: 5,
  targetNumberOfParticipants: 100,
  rewardAmountPerParticipant: 0.15,
  rewardCurrencyId: 2,
  isAvailable: true,
  isTest: false,
  deadline: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
  targetCountry: "ALL",
  numberOfCooldownHours: 2,
  paymentTerms: 'delayed',
  managerContractAddress: "YOUR_CONTRACT_ADDRESS"
};
```

### Default Instructions for Form Tasks

```text
Hi there! Thanks for taking the time to complete this form. We really appreciate thoughtful, genuine responses - they help us understand how to better support you. Please answer each question as clearly as you can. Your authentic input matters to us and helps maintain the quality of our service for everyone.
```

### Task Creation Rate Limiting

- **Limit**: 1 task per 7 days per user
- **Check**: Query user's tasks, find most recent, compare timestamp
- **UI**: Show rate limit banner with countdown when blocked

### Data Refresh Cooldown

- **Global cooldown**: 30 minutes across all pages
- **Persisted**: Store last refresh time in local storage
- **UI**: Countdown timer showing time remaining

### Task Completion Calculation

```typescript
function isTaskComplete(task: Task, completions: TaskCompletion[]): boolean {
  const taskCompletions = completions.filter(c => c.taskId === task.id);
  return task.targetNumberOfParticipants > 0 && 
         taskCompletions.length >= task.targetNumberOfParticipants;
}
```

---

## UI/UX Specifications

### Design System

#### Colors

| Name | Value | Usage |
|------|-------|-------|
| Primary | `#363062` | Buttons, active states, branding |
| Primary Light | `#363062/5%` | Selected card backgrounds |
| Accent Pink | `#ef5366` | Sign-in page accent |
| Gradient | `#ff9966 → #f857a6 → #ff5858` | Welcome text, decorative borders |
| Background | `#ECECEC` | Main content area |
| Card Background | `#FFFFFF` | Cards, forms |

#### Typography

- **Font Family**: Sen (Google Font)
- **Headings**: Bold, various sizes (text-4xl for page titles)
- **Body**: Regular weight

#### Component Patterns

**Cards**:
- White background
- Subtle shadow
- Rounded corners (radius ~0.625rem)
- Hover states with shadow increase

**Buttons**:
- Primary: Purple background (#363062), white text
- Outline: White background, border
- Ghost: No background

**Badges**:
- Rounded pill shape
- Various colors for different states

**Form Inputs**:
- Border with focus ring
- Label above input
- Error messages below

### Layout Structure

```
┌─────────────────────────────────────────────────┐
│ Sidebar (collapsible) │ Main Content Area       │
│                       │ ┌─────────────────────┐ │
│ - Logo                │ │ Navbar              │ │
│ - Dashboard           │ │ - Avatar + Greeting │ │
│ - Tasks               │ │ - Settings Dropdown │ │
│ - Resources           │ └─────────────────────┘ │
│ - Account             │ ┌─────────────────────┐ │
│ - Pax                 │ │                     │ │
│                       │ │   Page Content      │ │
│                       │ │                     │ │
│                       │ └─────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Sidebar Navigation Items

| Item | Icon | Route |
|------|------|-------|
| Dashboard | LayoutDashboard | /dashboard |
| Tasks | ListTodo | /tasks |
| Resources | BookOpen | /resources |
| Account | Settings | /account |
| Pax | Custom Image | /pax |

### Responsive Behavior

- **Mobile**: Sidebar collapses to hamburger menu
- **Tablet**: Sidebar can be toggled
- **Desktop**: Sidebar always visible (can collapse to icons)

### Loading States

- **Skeleton loaders** for stat cards
- **Spinner icons** for buttons during loading
- **Loading text** for data tables

### Toast Notifications

Use for:
- Success messages (task created, data refreshed)
- Error messages (failed operations)
- Info messages (sign out confirmation)

---

## API Endpoints

### Task Management

#### Create Task
```
POST /api/createTask

Request Body:
{
  type: string,
  title: string,
  category: string,
  difficulty: string,
  link?: string,
  instructions?: string,
  feedback?: string,
  rezTaskMasterEmailAddress: string
}

Response:
{
  success: boolean,
  taskId: string,
  message: string
}
```

#### Fetch Tasks for User
```
GET /api/fetchAllTasksForRezTaskMaster?rezTaskMasterEmailAddress={email}

Response:
{
  tasks: Task[]
}
```

#### Fetch Task Completions for User
```
GET /api/fetchAllTaskCompletionsForRezTaskMaster?rezTaskMasterEmailAddress={email}

Response:
{
  taskCompletions: TaskCompletion[]
}
```

### Notifications

#### Notify New Task (Internal)
```
POST /api/notifyRezTotifierOfNewTask

Request Body:
{
  taskId: string,
  title: string,
  type: string,
  category: string,
  difficulty: string,
  rezTaskMasterEmailAddress: string,
  estimatedTimeOfCompletionInMinutes: number,
  targetNumberOfParticipants: number,
  rewardAmountPerParticipant: number
}

Response:
{
  success: boolean,
  message: string
}
```

---

## State Management

Use a client-side state management solution (Zustand, Redux, Jotai, etc.)

### Stores Required

#### TaskMaster Store
```typescript
interface TaskMasterStore {
  user: TaskMaster | null;
  setUser: (user: TaskMaster | null) => void;
}
// Persist to localStorage
```

#### Organization Store
```typescript
interface OrganizationStore {
  organization: Organization | null;
  setOrganization: (org: Organization | null) => void;
}
// Persist to localStorage
```

#### Tasks Store
```typescript
interface TasksStore {
  tasks: Task[];
  taskCompletions: TaskCompletion[];
  isLoading: boolean;
  error: string | null;
  fetchTasksAndCompletions: () => Promise<void>;
  setTasks: (tasks: Task[]) => void;
  setTaskCompletions: (completions: TaskCompletion[]) => void;
  clearTasksAndCompletions: () => void;
}
// Persist tasks and completions to localStorage
```

#### New Task Store (Wizard State)
```typescript
interface NewTaskStore {
  step: 1 | 2 | 3 | 4;
  data: {
    type?: 'fillAForm' | 'checkOutApp' | 'doVideoInterview';
    title?: string;
    category?: string;
    difficulty?: string;
    link?: string;
    instructions?: string;
    feedback?: string;
  };
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (data: Partial<NewTaskData>) => void;
  reset: () => void;
}
// Persist to localStorage (allows resuming incomplete forms)
```

#### Refresh Store
```typescript
interface RefreshStore {
  globalLastRefreshTime: number;
  updateRefreshTime: () => void;
  checkCanRefresh: () => {
    canRefresh: boolean;
    timeRemaining: number;
    formattedTime: string;
  };
}
// Persist lastRefreshTime to localStorage
// Cooldown: 30 minutes
```

---

## Integrations

### 1. Authentication Provider
- **Recommended**: Google OAuth
- **Requirements**: 
  - Sign in with popup
  - Get user profile (name, email, photo)
  - Sign out functionality

### 2. Telegram Notifications
- **Purpose**: Alert admins when new tasks are created
- **Setup**: Bot token + Chat ID
- **Message Format**: Markdown with task details

```typescript
// Example notification message
`🎯 *New Rez Task Created!*

*Task ID:* ${taskId}
*Title:* ${title}
*Type:* ${type}
*Category:* ${category}
*Difficulty:* ${difficulty}
*Creator Email:* ${email}
*Estimated Time:* ${minutes} minutes
*Target Participants:* ${target}
*Reward per Participant:* $${reward}
*Created At:* ${timestamp}`
```

### 3. Tally.so (Support Widget)
- **Purpose**: Floating support button for user feedback
- **Implementation**: Embed Tally script, open popup on click
- **Position**: Fixed bottom-left corner

### 4. Analytics (Amplitude)
- **Purpose**: Track user behavior and events
- **Key Events**:
  - `sign_in_with_google_clicked/complete/failed`
  - `sign_out_clicked/complete/failed`
  - `organization_onboarding_clicked/complete/failed`
  - `create_new_task_clicked/complete/failed`
  - `view_tasks_tab_clicked`
  - `refresh_clicked`

### 5. Error Tracking (Sentry)
- **Purpose**: Monitor and track errors
- **Setup**: Client-side and server-side error capturing

### 6. External Analytics Dashboard
- **Tool**: Looker Studio (or similar)
- **Integration**: Embedded iframe in Pax page

---

## Environment Variables

```bash
# Authentication
NEXT_PUBLIC_AUTH_DOMAIN=
NEXT_PUBLIC_AUTH_CLIENT_ID=

# Database/Backend
DATABASE_PROJECT_ID=
DATABASE_CLIENT_EMAIL=
DATABASE_PRIVATE_KEY=

# App Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Telegram Notifications
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Analytics
NEXT_PUBLIC_AMPLITUDE_API_KEY=

# Error Tracking
SENTRY_DSN=

# Task System Constants
TASK_MASTER_ID=                    # System task master ID
TASK_MANAGER_CONTRACT_ADDRESS=     # Smart contract address
```

---

## Tech Stack Recommendations

### Frontend (Required)
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4+
- **UI Components**: shadcn/ui (Radix primitives)
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation
- **State**: Zustand with persist middleware
- **Icons**: Lucide React

### Backend (Flexible - Choose One)

#### Option A: Firebase
- Authentication: Firebase Auth
- Database: Firestore
- Good for: Rapid prototyping, real-time updates

#### Option B: Supabase
- Authentication: Supabase Auth
- Database: PostgreSQL
- Good for: SQL familiarity, row-level security

#### Option C: Custom Backend
- Authentication: Auth.js/NextAuth
- Database: PostgreSQL/MySQL with Prisma
- Good for: Full control, custom requirements

### Deployment
- **Platform**: Vercel (recommended for Next.js)
- **Alternative**: Any Node.js hosting platform

---

## Sample Data

### Forum Articles (for Resources page)

```typescript
const forumArticles = [
  {
    id: "article_1",
    title: "How Africa's Digital Payment Landscape Is Evolving",
    description: "The digital payment revolution in Africa is unfolding at different paces...",
    date: "2025-03-05",
    imageUrl: "/forumArticles/payments.png",
    postUrl: "https://example.com/article-1",
    category: "Payments"
  },
  {
    id: "article_2",
    title: "Stablecoin and Cryptocurrency Adoption: Comparing Kenya and Nigeria",
    description: "The cryptocurrency landscape across Africa is developing at different rates...",
    date: "2025-04-07",
    imageUrl: "/forumArticles/crypto.png",
    postUrl: "https://example.com/article-2",
    category: "Stablecoins"
  },
  // Add more articles as needed
];
```

---

## Implementation Checklist

### Phase 1: Core Setup
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Tailwind CSS and shadcn/ui
- [ ] Configure authentication provider
- [ ] Set up database and data models
- [ ] Implement middleware for route protection

### Phase 2: Authentication Flow
- [ ] Sign-in page with Google OAuth
- [ ] Organization onboarding page
- [ ] Auth state hydration component
- [ ] Cookie management

### Phase 3: Main Features
- [ ] Sidebar and navbar layout
- [ ] Dashboard with stats cards
- [ ] Task creation wizard (4 steps)
- [ ] Task listing table
- [ ] Rate limiting for task creation

### Phase 4: Supporting Pages
- [ ] Account/Profile page
- [ ] Resources page with articles
- [ ] Analytics page with charts
- [ ] Pax embedded analytics page

### Phase 5: Integrations
- [ ] Telegram notifications
- [ ] Tally.so support widget
- [ ] Amplitude analytics
- [ ] Sentry error tracking

### Phase 6: Polish
- [ ] Loading states and skeletons
- [ ] Toast notifications
- [ ] Error handling
- [ ] Mobile responsiveness
- [ ] Performance optimization

---

## Notes

1. **Pax Integration**: This app is designed to work with a companion mobile app (Pax) where participants complete tasks. The `taskMasterId` and `managerContractAddress` fields connect tasks to the Pax reward system.

2. **Scalability**: The task completions query uses batching (chunks of 30) to handle Firestore's `in` query limitation. Adjust based on your database.

3. **Security**: Implement proper server-side validation for all API endpoints. The `rezTaskMasterEmailAddress` filter ensures users only see their own data.

4. **Extensibility**: The "Do Video Interview" task type is stubbed out for future implementation.

---

*Last Updated: December 2024*
*Version: 1.0.0*



