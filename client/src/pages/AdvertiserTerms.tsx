import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function AdvertiserTerms() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-3xl">Advertising Terms & Conditions</CardTitle>
            <CardDescription className="mt-2">
              Last updated: November 2024
            </CardDescription>
          </CardHeader>

          <CardContent className="prose prose-sm dark:prose-invert max-w-none pt-6">
            <div className="space-y-6">
              {/* 1. Introduction */}
              <section>
                <h2 className="text-xl font-bold mt-0">1. Introduction</h2>
                <p>
                  Welcome to KOSCOCO's Advertising Platform ("Platform"). These Advertising Terms & Conditions ("Terms") 
                  govern your use of the Platform as an advertiser. By creating an advertiser account and accessing the 
                  Platform, you agree to be bound by these Terms. If you do not agree with any part of these Terms, 
                  please do not use the Platform.
                </p>
                <p>
                  KOSCOCO is operated by KOZZII INC, located at Bonjo Street, Limbe, South West Region, Cameroon.
                </p>
              </section>

              {/* 2. Eligibility */}
              <section>
                <h2 className="text-xl font-bold">2. Eligibility & Account Registration</h2>
                <p>
                  To create an advertiser account, you must:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Be at least 18 years old or the legal age of majority in your jurisdiction</li>
                  <li>Represent a legitimate business or organization</li>
                  <li>Have the authority to bind your company to these Terms</li>
                  <li>Provide accurate, complete, and current information</li>
                  <li>Maintain the confidentiality of your login credentials</li>
                  <li>Comply with all applicable laws and regulations</li>
                </ul>
                <p>
                  All advertiser accounts are subject to approval by KOSCOCO. We reserve the right to reject any 
                  application without providing a reason.
                </p>
              </section>

              {/* 3. Account Approval Process */}
              <section>
                <h2 className="text-xl font-bold">3. Account Approval & Status</h2>
                <p>
                  Upon submission of your advertiser application, your account will be reviewed by our team. The approval 
                  process typically takes 2-5 business days. You will receive notification via email once your account 
                  status changes.
                </p>
                <p className="font-semibold">Account Status Types:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Pending:</strong> Your application is under review</li>
                  <li><strong>Approved:</strong> Your account is active and you can create campaigns</li>
                  <li><strong>Suspended:</strong> Your account has been temporarily disabled due to violations</li>
                  <li><strong>Inactive:</strong> Your account has been permanently closed</li>
                </ul>
              </section>

              {/* 4. Advertising Standards */}
              <section>
                <h2 className="text-xl font-bold">4. Advertising Standards & Content Policies</h2>
                <p>
                  All advertisements must comply with the following standards:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Truthful & Accurate:</strong> All claims must be truthful, substantiated, and not misleading</li>
                  <li><strong>Legally Compliant:</strong> Ads must comply with all local, national, and international laws</li>
                  <li><strong>No Prohibited Content:</strong> The following content is strictly prohibited:
                    <ul className="list-circle pl-6 mt-2 space-y-1">
                      <li>Hate speech, discrimination, or incitement to violence</li>
                      <li>Misinformation or disinformation</li>
                      <li>Illegal products or services</li>
                      <li>Counterfeit or fraudulent goods</li>
                      <li>Sexually explicit or adult content (unless age-gated appropriately)</li>
                      <li>Harassment, bullying, or defamation</li>
                      <li>Intellectual property infringement</li>
                      <li>Spyware, malware, or other harmful software</li>
                      <li>Gambling, betting, or games of chance (unless properly licensed)</li>
                      <li>Unregulated financial products or services</li>
                      <li>Medical or pharmaceutical claims (unless verified by regulatory bodies)</li>
                    </ul>
                  </li>
                  <li><strong>No Impersonation:</strong> You cannot impersonate individuals, organizations, or brands</li>
                  <li><strong>Respectful Content:</strong> Ads must be respectful and not target protected characteristics</li>
                </ul>
              </section>

              {/* 5. Intellectual Property Rights */}
              <section>
                <h2 className="text-xl font-bold">5. Intellectual Property Rights</h2>
                <p>
                  You represent and warrant that:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>You own or have the legal right to use all content in your advertisements</li>
                  <li>Your ads do not infringe upon any third-party intellectual property rights</li>
                  <li>You have obtained all necessary permissions and licenses</li>
                </ul>
                <p>
                  KOSCOCO is not responsible for any intellectual property disputes arising from your advertisements. 
                  You indemnify and hold harmless KOSCOCO from any claims related to your content.
                </p>
              </section>

              {/* 6. Wallet & Payment System */}
              <section>
                <h2 className="text-xl font-bold">6. Wallet & Payment System</h2>
                <p>
                  The Platform uses a wallet-based system for managing advertising budgets:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Wallet Balance:</strong> Your wallet holds your advertising funds and must maintain a positive balance to run campaigns</li>
                  <li><strong>Deposits:</strong> You can add funds to your wallet via Flutterwave or other approved payment methods</li>
                  <li><strong>Campaign Deductions:</strong> Campaign costs are automatically deducted from your wallet based on impressions, clicks, and other metrics</li>
                  <li><strong>Refunds:</strong> Refunds are issued to your original payment method. Processing typically takes 5-7 business days</li>
                  <li><strong>Inactive Wallets:</strong> Wallets inactive for 12 months may be subject to inactivity fees (if applicable)</li>
                </ul>
              </section>

              {/* 7. Campaign Management */}
              <section>
                <h2 className="text-xl font-bold">7. Campaign Management & Budgeting</h2>
                <p>
                  When creating campaigns, you must:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Set a campaign budget (minimum 5,000 XAF)</li>
                  <li>Define clear campaign objectives</li>
                  <li>Specify campaign duration and dates</li>
                  <li>Ensure your wallet has sufficient balance</li>
                  <li>Accept pricing terms based on ad type and placement</li>
                </ul>
                <p>
                  Campaigns will automatically pause or stop when:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Your wallet balance reaches zero</li>
                  <li>Campaign end date is reached</li>
                  <li>Campaign is manually paused or deleted</li>
                  <li>Content violates our policies (in which case it may be removed without refund)</li>
                </ul>
              </section>

              {/* 8. Pricing & Advertising Rates */}
              <section>
                <h2 className="text-xl font-bold">8. Pricing & Advertising Rates</h2>
                <p>
                  KOSCOCO offers various ad types with different pricing models:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Cost Per Impression (CPM):</strong> Charged per 1,000 impressions</li>
                  <li><strong>Cost Per Click (CPC):</strong> Charged per click on your advertisement</li>
                  <li><strong>Cost Per View (CPV):</strong> Charged per video view</li>
                  <li><strong>Fixed Rate:</strong> Fixed cost per day or campaign period</li>
                </ul>
                <p>
                  Pricing is subject to change with 30 days' notice. Existing campaigns will not be affected by price 
                  changes until renewal.
                </p>
              </section>

              {/* 9. Performance Metrics & Reporting */}
              <section>
                <h2 className="text-xl font-bold">9. Performance Metrics & Reporting</h2>
                <p>
                  KOSCOCO provides real-time analytics including:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Impressions and reach statistics</li>
                  <li>Click-through rates (CTR)</li>
                  <li>Conversion tracking (if enabled)</li>
                  <li>Demographic insights</li>
                  <li>Cost and ROI metrics</li>
                </ul>
                <p>
                  While we strive for accuracy, all metrics are provided "as is" without warranty. Minor discrepancies 
                  may occur due to technical limitations. KOSCOCO reserves the right to correct significant reporting 
                  errors retroactively.
                </p>
              </section>

              {/* 10. Ad Approval & Removal */}
              <section>
                <h2 className="text-xl font-bold">10. Ad Approval & Removal</h2>
                <p>
                  All advertisements undergo a review process before publication. KOSCOCO reserves the right to:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Reject ads that violate these Terms or our content policies</li>
                  <li>Request modifications to ads before approval</li>
                  <li>Remove ads at any time if they violate policies, even after approval</li>
                  <li>Issue refunds only if ads are removed due to KOSCOCO's error</li>
                </ul>
                <p>
                  Ads removed due to policy violations will not be refunded unless the violation was a result of 
                  misinterpretation by KOSCOCO's review team.
                </p>
              </section>

              {/* 11. Privacy & Data */}
              <section>
                <h2 className="text-xl font-bold">11. Privacy & Data Protection</h2>
                <p>
                  Your use of the Platform is governed by our Privacy Policy. By using the Platform, you consent to:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Collection and processing of your account information</li>
                  <li>Use of campaign data for analytics and reporting</li>
                  <li>Storage of payment and financial information securely</li>
                  <li>Compliance with applicable data protection regulations</li>
                </ul>
                <p>
                  For detailed information, please review our Privacy Policy.
                </p>
              </section>

              {/* 12. Disclaimers */}
              <section>
                <h2 className="text-xl font-bold">12. Disclaimers</h2>
                <p>
                  THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
                  INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR 
                  NON-INFRINGEMENT.
                </p>
                <p>
                  KOSCOCO does not guarantee:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Uninterrupted service availability</li>
                  <li>Specific ROI or performance metrics</li>
                  <li>Ad visibility or reach</li>
                  <li>Protection against ad fraud or invalid traffic</li>
                </ul>
                <p>
                  While we implement fraud detection, we cannot guarantee 100% protection against invalid traffic.
                </p>
              </section>

              {/* 13. Limitation of Liability */}
              <section>
                <h2 className="text-xl font-bold">13. Limitation of Liability</h2>
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, KOSCOCO SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
                  SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE PLATFORM, REGARDLESS OF 
                  THE CAUSE.
                </p>
                <p>
                  Our total liability shall not exceed the amount you paid to KOSCOCO in the 12 months preceding the 
                  claim.
                </p>
              </section>

              {/* 14. Indemnification */}
              <section>
                <h2 className="text-xl font-bold">14. Indemnification</h2>
                <p>
                  You agree to indemnify and hold harmless KOSCOCO, its operators, and employees from any claims, 
                  damages, or costs arising from:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Your violation of these Terms</li>
                  <li>Your advertisements or content</li>
                  <li>Your intellectual property claims</li>
                  <li>Any illegal activities or misuse of the Platform</li>
                </ul>
              </section>

              {/* 15. Prohibited Conduct */}
              <section>
                <h2 className="text-xl font-bold">15. Prohibited Conduct</h2>
                <p>
                  You shall not:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Use the Platform to distribute malware or harmful software</li>
                  <li>Engage in click fraud, impression fraud, or manipulation</li>
                  <li>Attempt to bypass security measures or access unauthorized areas</li>
                  <li>Interfere with the Platform's operation or other users' access</li>
                  <li>Create multiple accounts to circumvent policies or restrictions</li>
                  <li>Use the Platform for unlawful purposes</li>
                  <li>Reverse engineer or attempt to extract data from the Platform</li>
                  <li>Sell, transfer, or license your account to third parties</li>
                </ul>
              </section>

              {/* 16. Account Suspension & Termination */}
              <section>
                <h2 className="text-xl font-bold">16. Account Suspension & Termination</h2>
                <p>
                  KOSCOCO reserves the right to:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Suspend or terminate your account immediately for serious violations</li>
                  <li>Suspend your account temporarily for investigation of potential violations</li>
                  <li>Delete all associated campaigns and ads upon termination</li>
                  <li>Retain wallet balance for dispute resolution (up to 90 days)</li>
                  <li>Report violations to relevant authorities if necessary</li>
                </ul>
                <p>
                  You may request account termination at any time through your dashboard settings.
                </p>
              </section>

              {/* 17. Contact & Support */}
              <section>
                <h2 className="text-xl font-bold">17. Contact & Support</h2>
                <p>
                  For questions, support requests, or to report violations:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>Email:</strong> support@kozzii.africa</li>
                  <li><strong>WhatsApp:</strong> +237 676 951 397</li>
                  <li><strong>Address:</strong> Bonjo Street, Limbe, South West Region, Cameroon</li>
                </ul>
              </section>

              {/* 18. Modifications to Terms */}
              <section>
                <h2 className="text-xl font-bold">18. Modifications to These Terms</h2>
                <p>
                  KOSCOCO reserves the right to modify these Terms at any time. Significant changes will be communicated 
                  via email or through the Platform. Your continued use of the Platform constitutes acceptance of modified 
                  Terms. If you disagree with any changes, you may terminate your account.
                </p>
              </section>

              {/* 19. Governing Law */}
              <section>
                <h2 className="text-xl font-bold">19. Governing Law & Jurisdiction</h2>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of Cameroon, without regard 
                  to its conflict of law principles. You agree to submit to the exclusive jurisdiction of the courts in 
                  Cameroon.
                </p>
              </section>

              {/* 20. Severability */}
              <section>
                <h2 className="text-xl font-bold">20. Severability</h2>
                <p>
                  If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall 
                  remain in full force and effect.
                </p>
              </section>

              {/* 21. Entire Agreement */}
              <section>
                <h2 className="text-xl font-bold">21. Entire Agreement</h2>
                <p>
                  These Terms, together with our Privacy Policy and any other policies posted on the Platform, constitute 
                  the entire agreement between you and KOSCOCO regarding your use of the Platform and supersede all prior 
                  agreements and understandings.
                </p>
              </section>

              {/* 22. Acknowledgment */}
              <section>
                <h2 className="text-xl font-bold">22. Acknowledgment</h2>
                <p>
                  By clicking "I Agree" or creating an advertiser account, you acknowledge that you have read, understood, 
                  and agree to be bound by these Advertising Terms & Conditions.
                </p>
              </section>
            </div>

            <div className="mt-12 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                © 2024 KOSCOCO by KOZZII INC. All rights reserved.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
