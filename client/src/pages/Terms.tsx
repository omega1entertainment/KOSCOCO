import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col">
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl uppercase tracking-wide mb-4">
              Terms and Conditions
            </h1>
            <p className="text-base md:text-lg text-muted-foreground">
              Content Policy and Community Guidelines
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-destructive">
                  <AlertTriangle className="w-6 h-6" />
                  ZERO-TOLERANCE CONTENT POLICY
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-md">
                  <p className="font-semibold text-lg mb-3">
                    MANDATORY DIRECTIVE: ZERO-TOLERANCE CONTENT POLICY ENFORCEMENT 🚨
                  </p>
                  <p className="text-sm leading-relaxed">
                    This is a SEVERE WARNING regarding non-compliance with the foundational rules of this platform. 
                    The uploading of prohibited material is not merely discouraged—it is FORBIDDEN. 
                    Failure to adhere to these rules will result in IMMEDIATE AND IRREVERSIBLE PENALTIES.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4">DO NOT UPLOAD THE FOLLOWING CONTENT:</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-lg mb-2 text-destructive">
                        1. Political Propaganda & Adversarial Content
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Content focused on promoting, aggressively campaigning for, or attacking any political figure, 
                        party, or highly contentious political ideology. This explicitly includes any video or image 
                        content designed to oppose, undermine, or incite dissent against the sitting government or its 
                        policies. This platform is not a political soapbox or an engine for instability.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-lg mb-2 text-destructive">
                        2. Sexual Explicitness (Nudity/Obscenity)
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Any video or image containing nudity, pornographic material, sexually suggestive acts, or 
                        obscene imagery. This is a complete violation of public decency and will be dealt with harshly.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-lg mb-2 text-destructive">
                        3. Hate Speech & Discrimination
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Any language, text, or imagery that attacks, degrades, threatens, or incites hatred against 
                        individuals or groups based on protected characteristics (e.g., race, religion, gender, ethnicity). 
                        This behavior is intolerable.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-lg mb-2 text-destructive">
                        4. Incitement to Violence & Illegal Acts
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Content that encourages, explicitly instructs, promotes, or glorifies violence, illegal activity, 
                        or acts of self-harm. Spreading dangerous material is grounds for immediate termination.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6 mt-6">
                  <h3 className="text-xl font-bold mb-4">Enforcement & Consequences</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                    <li>All uploaded content is subject to automated review using AI-powered content moderation</li>
                    <li>Videos violating these policies will be AUTOMATICALLY BLOCKED from display</li>
                    <li>Repeated violations may result in account suspension or permanent ban</li>
                    <li>We reserve the right to remove content and take action without prior notice</li>
                    <li>Appeals can be submitted through our support channels for review by human moderators</li>
                  </ul>
                </div>

                <div className="border-t pt-6 mt-6">
                  <h3 className="text-xl font-bold mb-4">Content Guidelines</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    We encourage creative, entertaining, and educational content that:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Respects the dignity and rights of all individuals</li>
                    <li>Promotes positive community engagement</li>
                    <li>Showcases talent, creativity, and cultural expression</li>
                    <li>Adheres to legal standards and community norms</li>
                    <li>Is suitable for a general audience</li>
                  </ul>
                </div>

                <div className="bg-muted p-4 rounded-md mt-6">
                  <p className="text-sm font-semibold">
                    By uploading content to this platform, you acknowledge that you have read, understood, and agree 
                    to comply with these Terms and Conditions. Violation of these terms constitutes breach of agreement 
                    and will be enforced accordingly.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact & Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  If you have questions about our content policy or believe your content was incorrectly flagged, 
                  please contact our support team. We review all appeals carefully and work to ensure fair enforcement 
                  of our policies.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
