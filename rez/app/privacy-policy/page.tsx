"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export default function PrivacyPolicyPage() {
  const router = useRouter();

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
                Privacy <span className="rez-gradient-text">Policy</span>
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
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Canvassing ("we," "us," or "our") operates Rez, a research management platform. 
                We are committed to protecting your privacy and ensuring the security of your personal 
                information. This Privacy Policy explains how we collect, use, disclose, and safeguard 
                your information when you use our service.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                By using Rez, you agree to the collection and use of information in accordance with 
                this policy. If you do not agree with our policies and practices, please do not use 
                our service.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold mb-3 mt-6">2.1 Information You Provide</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>
                  <strong>Account Information:</strong> When you sign in with Google, we collect your 
                  name, email address, and profile picture from your Google account.
                </li>
                <li>
                  <strong>Organization Information:</strong> When you create an organization, we 
                  collect your organization name, country, and team size.
                </li>
                <li>
                  <strong>Research Data:</strong> We collect the research tasks, task completions, 
                  and other content you create through the service.
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Automatically Collected Information</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When you use our service, we automatically collect certain information, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>
                  <strong>Usage Data:</strong> Information about how you interact with the service, 
                  including pages visited, features used, and time spent on the platform.
                </li>
                <li>
                  <strong>Device Information:</strong> Information about your device, including IP 
                  address, browser type, operating system, and device identifiers.
                </li>
                <li>
                  <strong>Log Data:</strong> Server logs containing information such as access times, 
                  requested pages, and error messages.
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">2.3 Cookies and Tracking Technologies</h3>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar tracking technologies to track activity on our service and 
                hold certain information. Cookies are files with a small amount of data that may include 
                an anonymous unique identifier. You can instruct your browser to refuse all cookies or 
                to indicate when a cookie is being sent.
              </p>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use the information we collect for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>To provide, maintain, and improve our service</li>
                <li>To authenticate your identity and manage your account</li>
                <li>To process and complete your research tasks</li>
                <li>To send you service-related communications and updates</li>
                <li>To respond to your inquiries and provide customer support</li>
                <li>To detect, prevent, and address technical issues and security threats</li>
                <li>To analyze usage patterns and improve user experience</li>
                <li>To comply with legal obligations and enforce our terms of service</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We do not sell your personal information. We may share your information in the following 
                circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>
                  <strong>Within Your Organization:</strong> Information you provide may be visible to 
                  other members of your organization.
                </li>
                <li>
                  <strong>Service Providers:</strong> We may share information with third-party service 
                  providers who perform services on our behalf, such as hosting, analytics, and customer 
                  support. These providers are contractually obligated to protect your information.
                </li>
                <li>
                  <strong>Legal Requirements:</strong> We may disclose your information if required to 
                  do so by law or in response to valid requests by public authorities.
                </li>
                <li>
                  <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale 
                  of assets, your information may be transferred to the acquiring entity.
                </li>
                <li>
                  <strong>With Your Consent:</strong> We may share your information with your explicit 
                  consent or at your direction.
                </li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  We implement appropriate technical and organizational security measures to protect 
                  your personal information against unauthorized access, alteration, disclosure, or 
                  destruction. These measures include:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security assessments and updates</li>
                  <li>Access controls and authentication mechanisms</li>
                  <li>Secure data storage and backup procedures</li>
                </ul>
                <p>
                  However, no method of transmission over the Internet or electronic storage is 100% 
                  secure. While we strive to use commercially acceptable means to protect your 
                  information, we cannot guarantee absolute security.
                </p>
              </div>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal information for as long as necessary to fulfill the purposes 
                outlined in this Privacy Policy, unless a longer retention period is required or 
                permitted by law. When you delete your account, we will delete or anonymize your 
                personal information, except where we are required to retain it for legal or 
                regulatory purposes.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Your Rights and Choices</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Depending on your location, you may have certain rights regarding your personal 
                information, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>
                  <strong>Access:</strong> The right to access and receive a copy of your personal 
                  information.
                </li>
                <li>
                  <strong>Correction:</strong> The right to correct inaccurate or incomplete 
                  information.
                </li>
                <li>
                  <strong>Deletion:</strong> The right to request deletion of your personal 
                  information.
                </li>
                <li>
                  <strong>Portability:</strong> The right to receive your information in a structured, 
                  commonly used format.
                </li>
                <li>
                  <strong>Objection:</strong> The right to object to processing of your information 
                  for certain purposes.
                </li>
                <li>
                  <strong>Withdrawal of Consent:</strong> The right to withdraw consent where 
                  processing is based on consent.
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                To exercise these rights, please contact us using the information provided in the 
                "Contact Us" section below.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our service is not intended for individuals under the age of 18. We do not knowingly 
                collect personal information from children under 18. If you become aware that a child 
                has provided us with personal information, please contact us, and we will take steps 
                to delete such information from our systems.
              </p>
            </section>

            {/* International Data Transfers */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your information may be transferred to and processed in countries other than your 
                country of residence. These countries may have data protection laws that differ from 
                those in your country. By using our service, you consent to the transfer of your 
                information to these countries. We take appropriate measures to ensure that your 
                information receives an adequate level of protection.
              </p>
            </section>

            {/* Changes to Privacy Policy */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes 
                by posting the new Privacy Policy on this page and updating the "Last updated" date. 
                You are advised to review this Privacy Policy periodically for any changes. Changes to 
                this Privacy Policy are effective when they are posted on this page.
              </p>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our service may contain links to third-party websites or services that are not owned 
                or controlled by us. We have no control over, and assume no responsibility for, the 
                privacy policies or practices of any third-party websites or services. We encourage 
                you to review the privacy policies of those third-party services.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our 
                privacy practices, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">
                  <strong>Email:</strong>{" "}
                  <a href="mailto:admin@thecanvassing.xyz" className="text-primary hover:underline">
                    admin@thecanvassing.xyz
                  </a>
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>General Support:</strong>{" "}
                  <a href="mailto:admin@thecanvassing.xyz" className="text-primary hover:underline">
                    admin@thecanvassing.xyz
                  </a>
                </p>
              </div>
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

