import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CompetitionRules() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Competition Rules</h1>
          <p className="text-lg text-muted-foreground">
            KOSCOCO - KOZZI Short Content Competition Guidelines
          </p>
        </div>

        <div className="space-y-8">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                The KOZZI SHORT CONTENT COMPETITION - "KOSCOCO" is a multi-phase video competition open to creators of all backgrounds. Participants will register in one or more categories, upload their short videos, and compete for recognition and prizes.
              </p>
            </CardContent>
          </Card>

          {/* Judging Criteria */}
          <Card>
            <CardHeader>
              <CardTitle>Judging Criteria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Videos will be evaluated on three main criteria:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between items-start gap-4">
                  <span className="font-semibold">Audience Engagement:</span>
                  <span className="text-muted-foreground">60% (based on likes/votes)</span>
                </li>
                <li className="flex justify-between items-start gap-4">
                  <span className="font-semibold">Originality and Creativity:</span>
                  <span className="text-muted-foreground">30%</span>
                </li>
                <li className="flex justify-between items-start gap-4">
                  <span className="font-semibold">Video Quality:</span>
                  <span className="text-muted-foreground">10%</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Competition Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Competition Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                There are five main categories, each with its own sub-categories:
              </p>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold">Music & Dance</p>
                  <p className="text-muted-foreground ml-4">Singing, Dancing</p>
                </div>
                <div>
                  <p className="font-semibold">Comedy & Performing Arts</p>
                  <p className="text-muted-foreground ml-4">Skits, Stand-up, Monologue, Acting, Movie content</p>
                </div>
                <div>
                  <p className="font-semibold">Fashion & Lifestyle</p>
                  <p className="text-muted-foreground ml-4">Cooking, Events, Decor, Sports, Travel, Vlogging, Fashion, Hair, Makeup, Beauty, Reviews</p>
                </div>
                <div>
                  <p className="font-semibold">Education & Learning</p>
                  <p className="text-muted-foreground ml-4">DIY, Tutorials, Documentary, Business & Finance, News, Motivational Speaking</p>
                </div>
                <div>
                  <p className="font-semibold">Gospel Choirs</p>
                  <p className="text-muted-foreground ml-4">Acapella, Choir Music</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Competition Structure */}
          <Card>
            <CardHeader>
              <CardTitle>Competition Structure & Progression</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The competition will run for approximately 8-10 weeks and is divided into five phases:
              </p>
              <div className="space-y-3 text-sm">
                <div className="pl-4 border-l-2 border-primary">
                  <p className="font-semibold">Phase 1 (Top 100)</p>
                  <p className="text-muted-foreground">Initial submissions, in search of the top 100 in each category advancing.</p>
                </div>
                <div className="pl-4 border-l-2 border-primary">
                  <p className="font-semibold">Phase 2 (Top 50)</p>
                  <p className="text-muted-foreground">In search of the top 50 in each category advancing.</p>
                </div>
                <div className="pl-4 border-l-2 border-primary">
                  <p className="font-semibold">Phase 3 (Top 10)</p>
                  <p className="text-muted-foreground">In search of the top 10 in each category advancing.</p>
                </div>
                <div className="pl-4 border-l-2 border-primary">
                  <p className="font-semibold">Phase 4 (Top 3)</p>
                  <p className="text-muted-foreground">Where the top 3 participants in each category are crowned as winners. Cash prize amounts will be announced on the website.</p>
                </div>
                <div className="pl-4 border-l-2 border-primary">
                  <p className="font-semibold">Phase 5 (GRAND FINALE)</p>
                  <p className="text-muted-foreground">The top 3 winners from each of the 5 categories will compete for the "ULTIMATE PRIZE" and will be crowned Cameroon's Next Big Content Creator & Influencer.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Eligibility and Registration */}
          <Card>
            <CardHeader>
              <CardTitle>Eligibility and Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold text-sm mb-2">Eligibility</p>
                <p className="text-sm text-muted-foreground">
                  Open to all Cameroonians at home and abroad aged 18+ or supervised minors.
                </p>
              </div>
              <div>
                <p className="font-semibold text-sm mb-2">Registration Fee</p>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li>• 2,500 FCFA for a single category</li>
                  <li>• Additional 2,500 FCFA for each extra category</li>
                </ul>
                <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                  <p className="font-semibold mb-2">Examples:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• 1 category = 2,500 FCFA</li>
                    <li>• 2 categories = 5,000 FCFA</li>
                    <li>• 3 categories = 7,500 FCFA</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Submission Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Content Submission Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold text-sm mb-2">Video Limits</p>
                <p className="text-sm text-muted-foreground">
                  You can upload a maximum of two videos for each category you register for.
                </p>
              </div>

              <div>
                <p className="font-semibold text-sm mb-2">Video Requirements</p>
                <div className="ml-4 space-y-3">
                  <div>
                    <p className="font-semibold text-sm">Duration</p>
                    <p className="text-sm text-muted-foreground">Minimum 1 minute, maximum 3 minutes</p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Quality Standards</p>
                    <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                      <li>• High video resolution</li>
                      <li>• Clear audio</li>
                      <li>• Overall good production value</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Content Standards</p>
                    <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                      <li>• Must be creative and original</li>
                      <li>• Clear of profanity, nudity, sexual, violent, or defamatory content</li>
                      <li>• Participants are encouraged to think outside the box and present fresh, innovative concepts</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Exclusivity</p>
                    <p className="text-sm text-muted-foreground">
                      Submitted videos cannot be published anywhere else online or offline until the competition is over. Violation of this rule will lead to immediate disqualification.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-semibold text-sm mb-2">Referral Program</p>
                <p className="text-sm text-muted-foreground">
                  A Referral program is integrated into the website. Paid registrations through referral links will earn you a 20% commission.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* General Rules */}
          <Card>
            <CardHeader>
              <CardTitle>General Rules & Disclaimers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 font-semibold text-foreground">•</span>
                  <span>All content submitted must be original and created solely by the participant. Plagiarism or copyright infringement will lead to immediate disqualification.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 font-semibold text-foreground">•</span>
                  <span>Content must be appropriate for a general audience and must not contain any offensive, defamatory, explicit, political, violent, dangerous, or illegal material.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 font-semibold text-foreground">•</span>
                  <span>The organizers reserve the right to disqualify any participant who violates these guidelines or engages in unsportsmanlike conduct.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 font-semibold text-foreground">•</span>
                  <span>The decisions of the judges are final and binding.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 font-semibold text-foreground">•</span>
                  <span>By entering the competition, participants grant KOZZII INC. the right to use, publish, and display their submitted videos for promotional and competition-related purposes, and on all Kozzii platforms.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 font-semibold text-foreground">•</span>
                  <span>KOZZII is not responsible for any technical issues, lost entries, or connectivity problems that may hinder participation.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 font-semibold text-foreground">•</span>
                  <span>These guidelines may be subject to minor revisions or clarifications by the organizers, with notice provided to all registered participants.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                For more information about the competition rules, please contact us at{' '}
                <a
                  href="mailto:support@kozzii.africa"
                  className="text-primary hover:underline"
                  data-testid="link-rules-support-email"
                >
                  support@kozzii.africa
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
