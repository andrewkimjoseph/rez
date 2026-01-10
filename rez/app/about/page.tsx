"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ClipboardDocumentListIcon, 
  UsersIcon, 
  ChartBarIcon, 
  CheckCircleIcon,
  GlobeAltIcon,
  BoltIcon,
  ArrowRightCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useTaskMasterStore } from "@/stores/taskmaster-store";

// Demo components (non-functional versions)
import AboutStep1TaskType from "@/components/about/AboutStep1TaskType";
import AboutStep2TaskDetails from "@/components/about/AboutStep2TaskDetails";
import AboutStep3QuestionsTasks from "@/components/about/AboutStep3QuestionsTasks";
import AboutStep4Review from "@/components/about/AboutStep4Review";

function Stepper({ currentStep }: { currentStep: number }) {
  const steps = [
    { number: 1, title: "Type" },
    { number: 2, title: "Details" },
    { number: 3, title: "Links" },
    { number: 4, title: "Review" },
  ];

  return (
    <div className="flex items-center justify-between mb-6 gap-1 sm:gap-2">
      {steps.map((step) => {
        const isCurrent = step.number === currentStep;
        const isCompleted = step.number < currentStep;
        return (
          <div
            key={step.number}
            className="flex flex-col items-center flex-1 min-w-0"
          >
            <div
              className={`rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center font-bold border-2 text-xs sm:text-sm ${
                isCurrent
                  ? "bg-[#5C29A3] text-white border-[#5C29A3]"
                  : isCompleted
                  ? "bg-[#ececec] text-[#5C29A3] border-[#5C29A3]"
                  : "bg-white text-[#5C29A3] border-[#ececec]"
              }`}
            >
              {step.number}
            </div>
            <span className="text-[10px] sm:text-xs mt-1.5 sm:mt-2 text-center break-words leading-tight px-0.5">
              {step.title}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function AboutPage() {
  const { user } = useTaskMasterStore();
  const isAuthenticated = !!user;

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10 md:space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
            <Image 
              src="/rez-logo.svg" 
              alt="Rez Logo" 
              width={48}
              height={48}
              className="shrink-0 sm:w-12 sm:h-12 md:w-16 md:h-16"
            />
            <div className="text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold rez-gradient-text">
                Rez
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">by Canvassing</p>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground px-2">
            Research Task Management Platform
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed px-2">
            Rez connects researchers with real users, particularly stablecoin users in emerging markets, 
            to complete surveys, test applications, and participate in research activities. 
            Launch your research tasks and start receiving results within hours.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 pt-4">
            <Badge variant="outline" className="text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2">
              <GlobeAltIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Africa-Focused
            </Badge>
            <Badge variant="outline" className="text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2">
              <BoltIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Stablecoin Users
            </Badge>
            <Badge variant="outline" className="text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2">
              <UsersIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Real Participants
            </Badge>
          </div>
        </div>

        {/* What is Rez Section */}
        <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 px-2">
              What is Rez?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              Rez is a web application designed for researchers (called &quot;Task Masters&quot;) 
              to create and manage research tasks that are completed by participants 
              through a companion mobile app called <strong>Pax</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="enterprise-card border-0">
              <CardHeader>
                <div className="p-3 rounded-xl bg-primary/10 w-fit mb-2">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Task Creation</CardTitle>
                <CardDescription>
                  Create surveys, app testing tasks, and research activities with ease
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="enterprise-card border-0">
              <CardHeader>
                <div className="p-3 rounded-xl bg-[#EFECFD] w-fit mb-2">
                  <ChartBarIcon className="h-6 w-6 text-[#5C29A3]" />
                </div>
                <CardTitle>Task Management</CardTitle>
                <CardDescription>
                  View, track, and monitor task completions in real-time
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="enterprise-card border-0">
              <CardHeader>
                <div className="p-3 rounded-xl bg-blue-500/10 w-fit mb-2">
                  <CheckCircleIcon className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>
                  Visualize task completion data and participant demographics
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <Separator className="my-8 sm:my-10 md:my-12" />

        {/* Key Value Proposition */}
        <section className="space-y-6">
          <Card className="enterprise-card border-0 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="text-center space-y-3 sm:space-y-4">
                <ArrowRightCircleIcon className="h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto" />
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground px-2">
                  Reach Real Users Who Actively Use Stablecoins
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
                  Connect with participants who actively use stablecoins and digital payments 
                  in their daily lives, particularly in emerging markets across Africa.
                </p>
                <div className="pt-4">
                  <Link href="/sign-in">
                    <Button size="lg" className="text-base px-8">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-8 sm:my-10 md:my-12" />

        {/* How It Works - Task Creation Guide */}
        <section className="space-y-8">
          <div className="text-center space-y-3 sm:space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground px-2">
              How to Create a Task
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              Creating a research task in Rez is simple and straightforward. 
              Follow these four steps to launch your first task.
            </p>
          </div>

          {/* Step 1: Task Type */}
          <Card className="enterprise-card border-0">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-xl bg-primary/10 shrink-0">
                  <span className="text-xl sm:text-2xl font-bold text-primary">1</span>
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl sm:text-2xl mb-2">Step 1: Select Type</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Choose the type of research activity you want to create. Rez supports three types of tasks:
                  </CardDescription>
                  <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground">
                    <li><strong>Fill a Form:</strong> Create surveys and questionnaires for participants to complete</li>
                    <li><strong>Check Out App:</strong> Have users test mobile or web applications and provide feedback</li>
                    <li><strong>Do Video Interview:</strong> Schedule qualitative research interviews (Coming Soon)</li>
                  </ul>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <Stepper currentStep={1} />
              <AboutStep1TaskType />
            </CardContent>
          </Card>

          {/* Step 2: Task Details */}
          <Card className="enterprise-card border-0">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-xl bg-primary/10 shrink-0">
                  <span className="text-xl sm:text-2xl font-bold text-primary">2</span>
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl sm:text-2xl mb-2">Step 2: Define Details</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Provide the essential information about your task:
                  </CardDescription>
                  <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground">
                    <li><strong>Title:</strong> A clear, descriptive name for your task</li>
                    <li><strong>Category:</strong> Classify your task (Finance, Climate, Education, Health, Technology, Social, or Other)</li>
                    <li><strong>Level of Difficulty:</strong> Set expectations with Easy, Medium, or Hard difficulty levels</li>
                  </ul>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <Stepper currentStep={2} />
              <AboutStep2TaskDetails />
            </CardContent>
          </Card>

          {/* Step 3: Questions & Tasks */}
          <Card className="enterprise-card border-0">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-xl bg-primary/10 shrink-0">
                  <span className="text-xl sm:text-2xl font-bold text-primary">3</span>
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl sm:text-2xl mb-2">Step 3: Add Links</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Configure the content participants will interact with:
                  </CardDescription>
                  <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 text-sm sm:text-base text-muted-foreground">
                    <div>
                      <strong>For &quot;Fill a Form&quot; tasks:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                        <li>Provide the URL to your survey or form</li>
                        <li>Participants will complete the form through the Pax mobile app</li>
                      </ul>
                    </div>
                    <div>
                      <strong>For &quot;Check Out App&quot; tasks:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                        <li>Provide the URL to your product or app</li>
                        <li>Add detailed instructions for what participants should do</li>
                        <li>Include a link to a feedback form where participants will submit their thoughts</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <Stepper currentStep={3} />
              <AboutStep3QuestionsTasks />
            </CardContent>
          </Card>

          {/* Step 4: Review */}
          <Card className="enterprise-card border-0">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-xl bg-primary/10 shrink-0">
                  <span className="text-xl sm:text-2xl font-bold text-primary">4</span>
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl sm:text-2xl mb-2">Step 4: Review & Submit</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Review all the details of your task before submitting:
                  </CardDescription>
                  <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground">
                    <li>Verify all information is correct</li>
                    <li>Check that links are working properly</li>
                    <li>Ensure instructions are clear and comprehensive</li>
                    <li>Click &quot;Finish&quot; to publish your task to the Pax platform</li>
                  </ul>
                  <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs sm:text-sm text-blue-900">
                      <strong>Note:</strong> Tasks are automatically configured with default settings including 
                      target participants (100), estimated completion time (5 minutes), and rewards. 
                      These can be adjusted by administrators if needed.
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <Stepper currentStep={4} />
              <AboutStep4Review />
            </CardContent>
          </Card>
        </section>

        <Separator className="my-8 sm:my-10 md:my-12" />

        {/* Features Section */}
        <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 px-2">
              Key Features
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="enterprise-card border-0">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <UserGroupIcon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Organization Management</CardTitle>
                </div>
                <CardDescription>
                  Task Masters belong to organizations, allowing teams to collaborate 
                  and manage research projects together.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="enterprise-card border-0">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ChartBarIcon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Real-Time Analytics</CardTitle>
                </div>
                <CardDescription>
                  Track task completions over time, view participant demographics, 
                  and analyze engagement patterns with comprehensive analytics.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="enterprise-card border-0">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <GlobeAltIcon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Global Reach</CardTitle>
                </div>
                <CardDescription>
                  Target participants from specific countries or open tasks globally. 
                  Focus on emerging markets where stablecoin adoption is growing.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="enterprise-card border-0">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CheckCircleIcon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>Quality Assurance</CardTitle>
                </div>
                <CardDescription>
                  Built-in rate limiting ensures quality research. Task Masters can 
                  create one task per week, encouraging thoughtful task design.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <Separator className="my-8 sm:my-10 md:my-12" />

        {/* Target Users Section */}
        <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 px-2">
              Who Uses Rez?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="enterprise-card border-0">
              <CardHeader>
                <CardTitle className="text-xl">Primary Users</CardTitle>
                <CardDescription className="text-base">
                  Researchers, UX teams, and product managers who need user feedback 
                  to improve their products and services.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="enterprise-card border-0">
              <CardHeader>
                <CardTitle className="text-xl">Secondary Users</CardTitle>
                <CardDescription className="text-base">
                  Organizations conducting market research in emerging markets, 
                  particularly those interested in fintech and stablecoin adoption.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="enterprise-card border-0">
              <CardHeader>
                <CardTitle className="text-xl">Focus Area</CardTitle>
                <CardDescription className="text-base">
                  Rez specializes in reaching users who actively use stablecoins 
                  and digital payments, with a particular focus on African markets.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <Separator className="my-8 sm:my-10 md:my-12" />

        {/* Call to Action */}
        <section className="space-y-6">
          <Card className="enterprise-card border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10">
            <CardContent className="p-4 sm:p-6 md:p-8 text-center space-y-4 sm:space-y-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground px-2">
                Ready to Launch Your Research?
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
                Join researchers around the world who are using Rez to connect with 
                real users and gather valuable insights. Launch your first task today!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                {!isAuthenticated && (
                  <Link href="/sign-in">
                    <Button size="lg" className="w-full sm:w-auto text-base px-8">
                      Sign In to Get Started
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard">
                  <Button size="lg" variant={isAuthenticated ? "default" : "outline"} className="w-full sm:w-auto text-base px-8">
                    View Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}