"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useAmplitudeEvents } from "@/hooks/use-amplitude-events";

export default function TermsOfServicePage() {
  const router = useRouter();
  const { termsOfServiceViewed } = useAmplitudeEvents();

  // Track page view
  const hasTrackedPageView = useRef(false);
  useEffect(() => {
    if (!hasTrackedPageView.current) {
      termsOfServiceViewed();
      hasTrackedPageView.current = true;
    }
  }, [termsOfServiceViewed]);

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 -ml-2"
            onClick={() => router.back()}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-4 mb-4">
            <Image
              src="/rez-logo.svg"
              alt="Rez Logo"
              width={48}
              height={48}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                Terms of <span className="rez-gradient-text">Service</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <div className="bg-card rounded-xl border border-border/50 p-8 lg:p-12 shadow-sm space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to Rez, a research platform operated by Canvassing (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). 
                By accessing or using our service, you agree to be bound by these Terms of Service 
                (&quot;Terms&quot;). If you disagree with any part of these terms, you may not access the service.
              </p>
            </section>

            {/* Description of Service */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Rez is a research management platform that enables researchers and organizations to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Create and manage research tasks</li>
                <li>Connect with research participants who actively use stablecoins</li>
                <li>Track task completions and research progress</li>
                <li>Organize research activities within teams and organizations</li>
              </ul>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  To use our service, you must create an account using your Google account. You are 
                  responsible for maintaining the confidentiality of your account credentials and for 
                  all activities that occur under your account.
                </p>
                <p>
                  You agree to provide accurate, current, and complete information during registration 
                  and to update such information to keep it accurate, current, and complete.
                </p>
                <p>
                  We reserve the right to suspend or terminate your account if we determine that you 
                  have violated these Terms or engaged in fraudulent, abusive, or illegal activity.
                </p>
              </div>
            </section>

            {/* Acceptable Use */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You agree not to use the service to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Transmit any harmful, offensive, or inappropriate content</li>
                <li>Interfere with or disrupt the service or servers connected to the service</li>
                <li>Attempt to gain unauthorized access to any portion of the service</li>
                <li>Use the service for any commercial purpose not explicitly authorized by us</li>
                <li>Collect or harvest information about other users without their consent</li>
              </ul>
            </section>

            {/* Research Data and Privacy */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Research Data and Privacy</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  You are responsible for the research data you create, upload, or transmit through 
                  the service. You represent and warrant that you have all necessary rights and 
                  permissions to use such data.
                </p>
                <p>
                  Our collection and use of personal information is governed by our{" "}
                  <Link href="/privacy-policy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  , which is incorporated into these Terms by reference.
                </p>
                <p>
                  You agree to comply with all applicable data protection laws and regulations when 
                  conducting research through our platform.
                </p>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  The service, including its original content, features, and functionality, is owned 
                  by Canvassing and is protected by international copyright, trademark, patent, trade 
                  secret, and other intellectual property laws.
                </p>
                <p>
                  You retain ownership of the research data and content you create through the 
                  service. By using the service, you grant us a worldwide, non-exclusive, 
                  royalty-free license to use, store, and process your content solely for the 
                  purpose of providing and improving the service.
                </p>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  To the fullest extent permitted by law, Canvassing and its affiliates shall not be 
                  liable for any indirect, incidental, special, consequential, or punitive damages, 
                  including loss of profits, data, use, goodwill, or other intangible losses, 
                  resulting from your use of the service.
                </p>
                <p>
                  Our total liability to you for any claims arising from or related to the service 
                  shall not exceed the amount you paid us in the twelve (12) months preceding the 
                  claim, or one hundred dollars ($100), whichever is greater.
                </p>
              </div>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Indemnification</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to indemnify, defend, and hold harmless Canvassing, its affiliates, 
                officers, directors, employees, and agents from and against any claims, liabilities, 
                damages, losses, and expenses, including reasonable attorneys&apos; fees, arising out of 
                or in any way connected with your use of the service or violation of these Terms.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  We may terminate or suspend your account and access to the service immediately, 
                  without prior notice or liability, for any reason, including if you breach these 
                  Terms.
                </p>
                <p>
                  Upon termination, your right to use the service will cease immediately. You may 
                  terminate your account at any time by contacting us or using the account deletion 
                  features in the service.
                </p>
              </div>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right, at our sole discretion, to modify or replace these Terms at 
                any time. If a revision is material, we will provide at least 30 days notice prior 
                to any new terms taking effect. What constitutes a material change will be determined 
                at our sole discretion.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                By continuing to access or use our service after any revisions become effective, you 
                agree to be bound by the revised terms.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the 
                jurisdiction in which Canvassing operates, without regard to its conflict of law 
                provisions.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at{" "}
                <a href="mailto:admin@thecanvassing.xyz" className="text-primary hover:underline">
                  admin@thecanvassing.xyz
                </a>
                .
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-sm text-muted-foreground">
              <p>
                Rez is operated by Canvassing. For more information, visit{" "}
                <a href="https://thecanvassing.xyz" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  thecanvassing.xyz
                </a>
                .
              </p>
          </div>
        </div>
      </div>
    </div>
  );
}

