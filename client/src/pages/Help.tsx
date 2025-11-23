import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";

export default function Help() {
  const { t, language } = useLanguage();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const helpContent = {
    en: [
      {
        id: "getting-started",
        title: "Getting Started",
        icon: "🚀",
        subsections: [
          {
            id: "what-is-koscoco",
            heading: "What is KOSCOCO?",
            content: "KOSCOCO is a video competition platform run by KOZZII INC in Limbe, Cameroon. Creators can participate in competitions across multiple categories, earn money through competitions, attract audiences, and become content creators. The platform features public voting, professional judging, and substantial cash prizes."
          },
          {
            id: "create-account",
            heading: "How to Create an Account",
            content: "1. Click the 'Register' button in the top navigation. 2. Enter your email, password, and personal details. 3. Check your email for a verification link and click it. 4. Once verified, you can log in and start exploring. 5. You'll access your Creator Dashboard from your profile menu."
          },
          {
            id: "login",
            heading: "How to Log In",
            content: "Click the 'Login' button in the top navigation. Enter your email and password. If you forgot your password, click 'Forgot Password' to reset it via email. You'll be logged in and can access your dashboard and participate in competitions."
          }
        ]
      },
      {
        id: "browsing",
        title: "Browsing & Discovering Content",
        icon: "🎬",
        subsections: [
          {
            id: "browse-categories",
            heading: "How to Browse Competition Categories",
            content: "Visit the 'Categories' page from the main navigation. You'll see all available competition categories with real-time video counts. Click on any category to view all submitted videos, see voting information, and watch entries."
          },
          {
            id: "watch-videos",
            heading: "How to Watch Videos",
            content: "Click on any video in the categories or leaderboard. The video player opens with full features. You can watch, like, vote, see judge scores, and view polls embedded by creators. Use the Picture-in-Picture button to watch while browsing other content."
          },
          {
            id: "view-leaderboard",
            heading: "How to Check the Leaderboard",
            content: "Visit the 'Leaderboard' page to see top-ranked videos by votes and judge scores. Filter by category to see rankings within specific competitions. This shows you the current competition standings and what's popular."
          },
          {
            id: "phases",
            heading: "Understanding Competition Phases",
            content: "Competitions progress through phases: Phase 1 (Top 500) → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 (Grand Finale). Videos advance based on voting and judge scores. Check the Phase Timeline on the home page to see which phase is currently active."
          }
        ]
      },
      {
        id: "registering",
        title: "Registering & Submitting Videos",
        icon: "📝",
        subsections: [
          {
            id: "register-category",
            heading: "How to Register for a Category",
            content: "1. Go to Categories page. 2. Select your desired category. 3. Click 'Register'. 4. Complete payment if required using Flutterwave. 5. You'll receive confirmation and can start uploading videos. You can register for multiple categories."
          },
          {
            id: "upload-video",
            heading: "How to Upload a Video",
            content: "1. Click 'Upload' in the main navigation or from your dashboard. 2. Select a registered category. 3. Add video details (title, description). 4. Upload your video file (MP4, WebM, or MOV - max 500MB). 5. Create polls/quizzes if desired. 6. Submit for approval. Videos are reviewed within 24-48 hours."
          },
          {
            id: "video-requirements",
            heading: "Video Requirements & Guidelines",
            content: "✓ Format: MP4, WebM, or MOV\n✓ Size: Maximum 500MB\n✓ Duration: Typically 15 seconds to 5 minutes (varies by category)\n✗ No AI-generated or deepfake content\n✗ No copyright-infringing music without permission\n✗ No violent, hateful, or explicit content\nAlways check your category's specific requirements."
          },
          {
            id: "edit-delete",
            heading: "How to Edit or Delete Videos",
            content: "Go to Creator Dashboard → My Videos tab. Find your video and click Edit to change title/description or Delete to remove it. You can edit/delete videos before they're voted on extensively."
          }
        ]
      },
      {
        id: "voting",
        title: "Voting & Scoring System",
        icon: "🗳️",
        subsections: [
          {
            id: "public-voting",
            heading: "How to Vote for Videos",
            content: "Open any video and click the vote button. You get free votes daily. For more votes, purchase vote packages using Flutterwave payment. Votes contribute to the public voting component of the final ranking. You cannot vote for your own video."
          },
          {
            id: "judge-scoring",
            heading: "Understanding Judge Scores",
            content: "Professional judges score videos based on: Creativity, Technical Quality, Category Relevance, and Overall Impact. Judge scores are combined with public votes to determine final rankings. Access judge scores on each video's detail page under 'Judge Scores'."
          },
          {
            id: "like-system",
            heading: "How the Like System Works",
            content: "Click the heart icon to like videos. Likes show appreciation and help creators build their audience. You can like unlimited videos. Likes contribute to video engagement metrics but differ from competition votes."
          },
          {
            id: "paid-votes",
            heading: "How to Purchase Additional Votes",
            content: "Visit any video and click 'Buy Votes'. Select a vote package. Complete payment via Flutterwave (mobile money, card, or bank transfer). Votes are instantly added to your account. Use them to vote on videos throughout the competition."
          }
        ]
      },
      {
        id: "polls",
        title: "Interactive Polls & Quizzes",
        icon: "❓",
        subsections: [
          {
            id: "respond-polls",
            heading: "How to Respond to Polls",
            content: "When watching a video with polls, they appear at the specified timing. Click on your answer option to respond. You'll see instant results and feedback. One response per poll per user. Required polls must be answered before you can mark the video as watched."
          },
          {
            id: "create-polls",
            heading: "How to Create Polls (Creators)",
            content: "1. Go to Creator Dashboard → My Videos. 2. Click 'Manage Polls' on a video. 3. Create New Poll and set: Question, Poll Type (Poll or Quiz), Timing (seconds), Duration. 4. Add answer options and mark correct answers for quizzes. 5. Save and publish. Viewers can then respond while watching."
          },
          {
            id: "view-stats",
            heading: "How to View Poll Statistics",
            content: "In Creator Dashboard → My Videos → Manage Polls, click on any poll to see response statistics. View total responses, answer distribution, and response rates. This helps you understand viewer engagement and feedback."
          }
        ]
      },
      {
        id: "creator-dashboard",
        title: "Creator Dashboard",
        icon: "👤",
        subsections: [
          {
            id: "dashboard-overview",
            heading: "Creator Dashboard Overview",
            content: "Access your dashboard from your profile menu. It has 7 tabs: Overview (quick stats), My Videos (manage submissions), Profile (edit info), Competitions (registration history), Watch History (videos you've viewed), Earnings (affiliate program), and Settings (account preferences)."
          },
          {
            id: "view-stats",
            heading: "How to Check Your Statistics",
            content: "Click the Overview tab to see: Total Videos, Total Views, Total Votes Received, and Your Current Ranking. This gives you a quick snapshot of your performance in the competition."
          },
          {
            id: "manage-videos",
            heading: "How to Manage Your Videos",
            content: "In the My Videos tab, you can: View all submitted videos, Edit titles and descriptions, Delete videos, View video details and performance metrics. Click any video to see voting status, judge scores, and create/manage polls."
          },
          {
            id: "edit-profile",
            heading: "How to Edit Your Profile",
            content: "Click the Profile tab in your dashboard. Update your name, email, username, location, age, and bio. Add a profile picture. Click Save to apply changes. Your profile appears when others view your videos."
          },
          {
            id: "watch-history",
            heading: "How to View Your Watch History",
            content: "Click the Watch History tab to see the last 20 videos you've watched. Each entry shows the video, creator, watch date, and completion status. This helps you track videos you've viewed and want to revisit."
          }
        ]
      },
      {
        id: "affiliate",
        title: "Affiliate Program",
        icon: "💰",
        subsections: [
          {
            id: "join-affiliate",
            heading: "How to Join the Affiliate Program",
            content: "Click your profile → Creator Dashboard → Earnings tab. Click 'Join Affiliate Program' (free to join). You'll get a unique referral link. Share this link with friends, family, and social media. Earn 20% commission on every registration through your link."
          },
          {
            id: "share-referral",
            heading: "How to Share Your Referral Code",
            content: "In Earnings tab, your referral code is displayed with a copy button. Share the code or unique referral link on social media, WhatsApp, email, etc. When people sign up using your link, they're tracked as your referrals. You earn 20% commission on their registrations."
          },
          {
            id: "track-earnings",
            heading: "How to Track Your Earnings",
            content: "Visit Affiliate Dashboard (linked from Earnings tab). View: Total Referrals, Active Referrals, Completed Referrals, Total Earnings, Pending Balance, and Payout History. Detailed breakdown of each referral and commission earned."
          },
          {
            id: "request-payout",
            heading: "How to Request a Payout",
            content: "In Affiliate Dashboard, go to Payout History. Click 'Request Payout' when you have sufficient balance (minimum threshold applies). Choose your payment method. Submit the request. Payouts are processed within 7 days. Track payout status in your history."
          }
        ]
      },
      {
        id: "newsletter",
        title: "Newsletter & Updates",
        icon: "📧",
        subsections: [
          {
            id: "subscribe",
            heading: "How to Subscribe to the Newsletter",
            content: "Scroll to the footer on any page. Enter your email in the newsletter signup section. Click Subscribe. You'll receive a confirmation and start getting competition updates, creator tips, exclusive opportunities, and platform news."
          },
          {
            id: "unsubscribe",
            heading: "How to Unsubscribe from Newsletter",
            content: "Open any newsletter email you receive. Click the 'Unsubscribe' link at the bottom. You'll be removed from the mailing list. You can always resubscribe through the footer signup at any time."
          }
        ]
      },
      {
        id: "advertiser",
        title: "Advertiser Features",
        icon: "📢",
        subsections: [
          {
            id: "advertiser-account",
            heading: "How to Create an Advertiser Account",
            content: "Visit the Advertise page (/advertise). If not logged in, log in or register. Click 'Create Advertiser Account'. Fill in: Company name, Contact info, Business type, Country. Submit for approval. Once approved, you can create campaigns and ads."
          },
          {
            id: "manage-wallet",
            heading: "How to Manage Your Advertiser Wallet",
            content: "Access your Advertiser Dashboard. Your wallet shows: Current balance, Total spent, and Available funds. Add funds to your wallet to create and run ad campaigns. Fund your wallet through Flutterwave payment."
          },
          {
            id: "create-campaign",
            heading: "How to Create an Advertising Campaign",
            content: "In Advertiser Dashboard, click 'Create Campaign'. Set: Campaign name, Budget, Start/end dates, Target categories, and Daily budget limit. Add ads to the campaign (up to 5 different ad types). Launch and monitor performance."
          },
          {
            id: "ad-types",
            heading: "Available Advertising Options",
            content: "✓ Skippable In-Stream Video: Video ads shown before content (viewers can skip after 5s)\n✓ Overlay Banner: Text/image banner overlays on videos\nEach ad type has different engagement metrics and pricing. Choose based on your marketing goals."
          }
        ]
      },
      {
        id: "admin",
        title: "Admin Features (Admins Only)",
        icon: "⚙️",
        subsections: [
          {
            id: "admin-access",
            heading: "How to Access Admin Dashboard",
            content: "If you're an admin, click your profile → Admin Dashboard. This gives you access to moderation, user management, phase controls, advertiser approvals, and comprehensive analytics. Only accounts with admin role can access this."
          },
          {
            id: "moderate-videos",
            heading: "How to Moderate Submitted Videos",
            content: "In Admin Dashboard → Videos tab, review pending submissions. Approve videos that meet guidelines. Reject videos that violate content rules (include rejection reason). Approved videos go live for voting."
          },
          {
            id: "manage-phases",
            heading: "How to Manage Competition Phases",
            content: "In Admin Dashboard → Phases tab, control active phases. Select which phase is currently active. Only one phase runs at a time. Advance phases as competition progresses. System filters videos to the appropriate phase."
          },
          {
            id: "user-management",
            heading: "How to Manage Users",
            content: "In Admin Dashboard → Users tab, view all registered users. Search and filter by role (admin/judge/contestant). Verify email status, check join dates and locations. Manage user roles and permissions from this panel."
          }
        ]
      },
      {
        id: "account",
        title: "Account & Settings",
        icon: "🔐",
        subsections: [
          {
            id: "reset-password",
            heading: "How to Reset Your Password",
            content: "On the Login page, click 'Forgot Password'. Enter your email. Check your inbox for a reset link. Click the link and create a new password. Log in with your new password."
          },
          {
            id: "change-email",
            heading: "How to Change Your Email",
            content: "Email changes require contacting support. Email support@kozzii.africa with your current email, new email, and account details. Support will process the change. You'll need to verify your new email."
          },
          {
            id: "language-toggle",
            heading: "How to Change Language",
            content: "Click the language selector button in the top navigation (usually top-right). Choose between English and French. The entire interface will update instantly. Your preference is saved locally."
          },
          {
            id: "dark-mode",
            heading: "How to Toggle Dark/Light Mode",
            content: "Click the theme toggle button in the navigation header (sun/moon icon). Switch between dark mode and light mode. Your preference is saved and applied on future visits."
          }
        ]
      },
      {
        id: "troubleshooting",
        title: "Troubleshooting & Support",
        icon: "🆘",
        subsections: [
          {
            id: "upload-fails",
            heading: "What to Do If Video Upload Fails",
            content: "1. Check file format (MP4, WebM, MOV). 2. Verify file size is under 500MB. 3. Check internet connection. 4. Try a different browser or incognito mode. 5. Clear browser cache. If issues persist, contact support@kozzii.africa with error details."
          },
          {
            id: "loading-issues",
            heading: "What to Do If Pages Won't Load",
            content: "1. Refresh the page. 2. Clear browser cache and cookies. 3. Disable browser extensions. 4. Try incognito/private mode. 5. Try a different browser. 6. Check your internet connection. Contact support if problems continue."
          },
          {
            id: "cant-login",
            heading: "What to Do If You Can't Log In",
            content: "1. Verify email is correct. 2. Check Caps Lock is off. 3. Reset password using 'Forgot Password'. 4. Check if email is verified. 5. Clear browser cache. 6. Try a different browser. Contact support@kozzii.africa if still unable to log in."
          },
          {
            id: "contact-support",
            heading: "How to Contact Support",
            content: "WhatsApp: +237 676 951 397\nEmail: support@kozzii.africa\nContact Form: Visit /contact page\nResponse time: Usually within 24 hours during business hours."
          }
        ]
      }
    ],
    fr: [
      {
        id: "getting-started",
        title: "Démarrage",
        icon: "🚀",
        subsections: [
          {
            id: "what-is-koscoco",
            heading: "Qu'est-ce que KOSCOCO ?",
            content: "KOSCOCO est une plateforme de compétition vidéo gérée par KOZZII INC à Limbé, Cameroun. Les créateurs peuvent participer à des compétitions dans plusieurs catégories, gagner de l'argent, attirer des audiences et devenir créateurs de contenu. La plateforme dispose du vote public, du jugement professionnel et de prix en espèces substantiels."
          },
          {
            id: "create-account",
            heading: "Comment créer un compte",
            content: "1. Cliquez sur le bouton 'S'inscrire' dans la navigation supérieure. 2. Entrez votre email, mot de passe et informations personnelles. 3. Consultez votre email pour un lien de vérification et cliquez dessus. 4. Une fois vérifié, vous pouvez vous connecter et explorer. 5. Vous accèderez à votre Tableau de bord créateur depuis votre menu de profil."
          },
          {
            id: "login",
            heading: "Comment se connecter",
            content: "Cliquez sur le bouton 'Connexion' dans la navigation supérieure. Entrez votre email et mot de passe. Si vous avez oublié votre mot de passe, cliquez sur 'Mot de passe oublié' pour le réinitialiser par email. Vous serez connecté et pourrez accéder à votre tableau de bord."
          }
        ]
      },
      {
        id: "browsing",
        title: "Navigation et Découverte de Contenu",
        icon: "🎬",
        subsections: [
          {
            id: "browse-categories",
            heading: "Comment parcourir les catégories de compétition",
            content: "Visitez la page 'Catégories' dans la navigation principale. Vous verrez toutes les catégories de compétition disponibles avec les compteurs vidéo en temps réel. Cliquez sur n'importe quelle catégorie pour voir toutes les vidéos soumises, voir les informations de vote et regarder les entrées."
          },
          {
            id: "watch-videos",
            heading: "Comment regarder des vidéos",
            content: "Cliquez sur n'importe quelle vidéo dans les catégories ou le classement. Le lecteur vidéo s'ouvre avec toutes les fonctionnalités. Vous pouvez regarder, aimer, voter, voir les scores des juges et afficher les sondages créés par les créateurs. Utilisez le bouton Image dans l'image pour regarder en naviguant."
          },
          {
            id: "view-leaderboard",
            heading: "Comment vérifier le classement",
            content: "Visitez la page 'Classement' pour voir les vidéos les mieux classées par votes et scores des juges. Filtrez par catégorie pour voir les classements au sein de compétitions spécifiques. Cela montre le classement actuel de la compétition et ce qui est populaire."
          },
          {
            id: "phases",
            heading: "Comprendre les phases de compétition",
            content: "Les compétitions progressent à travers les phases : Phase 1 (Top 500) → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 (Grande Finale). Les vidéos avancent en fonction du vote et des scores des juges. Vérifiez la Chronologie des phases sur la page d'accueil pour voir quelle phase est actuellement active."
          }
        ]
      },
      {
        id: "registering",
        title: "Inscription et Soumission de Vidéos",
        icon: "📝",
        subsections: [
          {
            id: "register-category",
            heading: "Comment s'inscrire à une catégorie",
            content: "1. Allez à la page Catégories. 2. Sélectionnez votre catégorie souhaitée. 3. Cliquez sur 'S'inscrire'. 4. Complétez le paiement si nécessaire en utilisant Flutterwave. 5. Vous recevrez une confirmation et pourrez commencer à télécharger des vidéos. Vous pouvez vous inscrire à plusieurs catégories."
          },
          {
            id: "upload-video",
            heading: "Comment télécharger une vidéo",
            content: "1. Cliquez sur 'Télécharger' dans la navigation principale ou depuis votre tableau de bord. 2. Sélectionnez une catégorie enregistrée. 3. Ajoutez les détails de la vidéo (titre, description). 4. Téléchargez votre fichier vidéo (MP4, WebM ou MOV - max 500 Mo). 5. Créez des sondages/quiz si souhaité. 6. Soumettez pour approbation. Les vidéos sont examinées en 24-48 heures."
          },
          {
            id: "video-requirements",
            heading: "Exigences et directives vidéo",
            content: "✓ Format : MP4, WebM ou MOV\n✓ Taille : Maximum 500 Mo\n✓ Durée : Généralement 15 secondes à 5 minutes (varie par catégorie)\n✗ Pas de contenu généré par l'IA ou deepfake\n✗ Pas de musique protégeée sans permission\n✗ Pas de contenu violent, haineux ou explicite\nVérifiez toujours les exigences spécifiques de votre catégorie."
          },
          {
            id: "edit-delete",
            heading: "Comment modifier ou supprimer des vidéos",
            content: "Allez à Tableau de bord créateur → Onglet Mes vidéos. Trouvez votre vidéo et cliquez sur Modifier pour changer le titre/description ou Supprimer pour la supprimer. Vous pouvez modifier/supprimer les vidéos avant qu'elles ne soient trop votées."
          }
        ]
      },
      {
        id: "voting",
        title: "Système de Vote et de Notation",
        icon: "🗳️",
        subsections: [
          {
            id: "public-voting",
            heading: "Comment voter pour les vidéos",
            content: "Ouvrez n'importe quelle vidéo et cliquez sur le bouton de vote. Vous obtenez des votes gratuits quotidiens. Pour plus de votes, achetez des packages de votes en utilisant le paiement Flutterwave. Les votes contribuent à la composante de vote public du classement final. Vous ne pouvez pas voter pour votre propre vidéo."
          },
          {
            id: "judge-scoring",
            heading: "Comprendre les scores des juges",
            content: "Les juges professionnels notent les vidéos en fonction de : Créativité, Qualité technique, Pertinence par rapport à la catégorie et Impact global. Les scores des juges sont combinés avec les votes publics pour déterminer les classements finaux. Accédez aux scores des juges sur la page de détails de chaque vidéo."
          },
          {
            id: "like-system",
            heading: "Comment fonctionne le système d'aime",
            content: "Cliquez sur l'icône du cœur pour aimer les vidéos. Les aimes montrent l'appréciation et aident les créateurs à construire leur audience. Vous pouvez aimer un nombre illimité de vidéos. Les aimes contribuent aux métriques d'engagement vidéo mais diffèrent des votes de compétition."
          },
          {
            id: "paid-votes",
            heading: "Comment acheter des votes supplémentaires",
            content: "Visitez n'importe quelle vidéo et cliquez sur 'Acheter des votes'. Sélectionnez un package de votes. Complétez le paiement via Flutterwave (argent mobile, carte ou virement bancaire). Les votes sont instantanément ajoutés à votre compte. Utilisez-les pour voter sur les vidéos tout au long de la compétition."
          }
        ]
      },
      {
        id: "polls",
        title: "Sondages et Quiz Interactifs",
        icon: "❓",
        subsections: [
          {
            id: "respond-polls",
            heading: "Comment répondre aux sondages",
            content: "En regardant une vidéo avec des sondages, ils apparaissent au moment spécifié. Cliquez sur votre option de réponse pour répondre. Vous verrez les résultats et commentaires instantanés. Une réponse par sondage par utilisateur. Les sondages obligatoires doivent être répondus avant de marquer la vidéo comme regardée."
          },
          {
            id: "create-polls",
            heading: "Comment créer des sondages (Créateurs)",
            content: "1. Allez à Tableau de bord créateur → Mes vidéos. 2. Cliquez sur 'Gérer les sondages' sur une vidéo. 3. Créer un nouveau sondage et définir : Question, Type de sondage (Sondage ou Quiz), Timing (secondes), Durée. 4. Ajoutez les options de réponse et marquez les réponses correctes pour les quiz. 5. Enregistrez et publiez. Les spectateurs peuvent ensuite répondre en regardant."
          },
          {
            id: "view-stats",
            heading: "Comment afficher les statistiques des sondages",
            content: "Dans Tableau de bord créateur → Mes vidéos → Gérer les sondages, cliquez sur n'importe quel sondage pour voir les statistiques de réponse. Affichez le nombre total de réponses, la distribution des réponses et les taux de réponse. Cela vous aide à comprendre l'engagement et les retours des spectateurs."
          }
        ]
      },
      {
        id: "creator-dashboard",
        title: "Tableau de Bord Créateur",
        icon: "👤",
        subsections: [
          {
            id: "dashboard-overview",
            heading: "Aperçu du Tableau de bord créateur",
            content: "Accédez à votre tableau de bord depuis votre menu de profil. Il a 7 onglets : Aperçu (statistiques rapides), Mes vidéos (gérer les soumissions), Profil (modifier les infos), Compétitions (historique d'inscription), Historique de visionnage (vidéos que vous avez regardées), Gains (programme d'affiliation) et Paramètres (préférences de compte)."
          },
          {
            id: "view-stats",
            heading: "Comment vérifier vos statistiques",
            content: "Cliquez sur l'onglet Aperçu pour voir : Nombre total de vidéos, Vues totales, Votes totaux reçus et Votre classement actuel. Cela vous donne un aperçu rapide de vos performances dans la compétition."
          },
          {
            id: "manage-videos",
            heading: "Comment gérer vos vidéos",
            content: "Dans l'onglet Mes vidéos, vous pouvez : Afficher toutes les vidéos soumises, Modifier les titres et descriptions, Supprimer les vidéos, Afficher les détails vidéo et les métriques de performance. Cliquez sur n'importe quelle vidéo pour voir l'état du vote, les scores des juges et créer/gérer les sondages."
          },
          {
            id: "edit-profile",
            heading: "Comment modifier votre profil",
            content: "Cliquez sur l'onglet Profil dans votre tableau de bord. Mettez à jour votre nom, email, nom d'utilisateur, localisation, âge et bio. Ajoutez une photo de profil. Cliquez sur Enregistrer pour appliquer les modifications. Votre profil apparaît lorsque d'autres visualisent vos vidéos."
          },
          {
            id: "watch-history",
            heading: "Comment afficher votre historique de visionnage",
            content: "Cliquez sur l'onglet Historique de visionnage pour voir les 20 dernières vidéos que vous avez regardées. Chaque entrée affiche la vidéo, le créateur, la date de visionnage et l'état d'achèvement. Cela vous aide à suivre les vidéos que vous avez regardées et que vous souhaitez revoir."
          }
        ]
      },
      {
        id: "affiliate",
        title: "Programme d'Affiliation",
        icon: "💰",
        subsections: [
          {
            id: "join-affiliate",
            heading: "Comment rejoindre le programme d'affiliation",
            content: "Cliquez sur votre profil → Tableau de bord créateur → Onglet Gains. Cliquez sur 'Rejoindre le programme d'affiliation' (gratuit à rejoindre). Vous obtiendrez un lien de parrainage unique. Partagez ce lien avec vos amis, famille et réseaux sociaux. Gagnez 20% de commission sur chaque inscription via votre lien."
          },
          {
            id: "share-referral",
            heading: "Comment partager votre code de parrainage",
            content: "Dans l'onglet Gains, votre code de parrainage est affiché avec un bouton de copie. Partagez le code ou le lien de parrainage unique sur les réseaux sociaux, WhatsApp, email, etc. Lorsque les gens s'inscrivent en utilisant votre lien, ils sont suivis comme vos parrainages. Vous gagnez 20% de commission sur leurs inscriptions."
          },
          {
            id: "track-earnings",
            heading: "Comment suivre vos gains",
            content: "Visitez le Tableau de bord d'affiliation (lié depuis l'onglet Gains). Affichage : Parrainages totaux, Parrainages actifs, Parrainages complétés, Gains totaux, Solde en attente et Historique des paiements. Ventilation détaillée de chaque parrainage et commission gagnée."
          },
          {
            id: "request-payout",
            heading: "Comment demander un paiement",
            content: "Dans le Tableau de bord d'affiliation, allez à Historique des paiements. Cliquez sur 'Demander un paiement' lorsque vous avez un solde suffisant (montant minimum s'applique). Choisissez votre mode de paiement. Soumettez la demande. Les paiements sont traités en 7 jours. Suivez l'état du paiement dans votre historique."
          }
        ]
      },
      {
        id: "newsletter",
        title: "Infolettre et Mises à Jour",
        icon: "📧",
        subsections: [
          {
            id: "subscribe",
            heading: "Comment s'abonner à l'infolettre",
            content: "Faites défiler jusqu'au bas de n'importe quelle page. Entrez votre email dans la section d'inscription à l'infolettre. Cliquez sur S'abonner. Vous recevrez une confirmation et commencerez à recevoir les mises à jour de compétitions, les conseils des créateurs, les opportunités exclusives et les nouvelles de la plateforme."
          },
          {
            id: "unsubscribe",
            heading: "Comment vous désabonner de l'infolettre",
            content: "Ouvrez n'importe quel email d'infolettre que vous recevez. Cliquez sur le lien 'Se désabonner' en bas. Vous serez retiré de la liste de diffusion. Vous pouvez toujours vous réabonner via l'inscription au bas de page à tout moment."
          }
        ]
      },
      {
        id: "advertiser",
        title: "Fonctionnalités Annonceur",
        icon: "📢",
        subsections: [
          {
            id: "advertiser-account",
            heading: "Comment créer un compte annonceur",
            content: "Visitez la page Annonceur (/advertise). Si non connecté, connectez-vous ou inscrivez-vous. Cliquez sur 'Créer un compte annonceur'. Remplissez : Nom de l'entreprise, Informations de contact, Type d'entreprise, Pays. Soumettez pour approbation. Une fois approuvé, vous pouvez créer des campagnes et des annonces."
          },
          {
            id: "manage-wallet",
            heading: "Comment gérer votre portefeuille annonceur",
            content: "Accédez à votre Tableau de bord annonceur. Votre portefeuille affiche : Solde actuel, Total dépensé et Fonds disponibles. Ajoutez des fonds à votre portefeuille pour créer et exécuter des campagnes publicitaires. Financez votre portefeuille via le paiement Flutterwave."
          },
          {
            id: "create-campaign",
            heading: "Comment créer une campagne publicitaire",
            content: "Dans le Tableau de bord annonceur, cliquez sur 'Créer une campagne'. Définissez : Nom de la campagne, Budget, Dates de début/fin, Catégories cibles et Limite de budget quotidien. Ajoutez des annonces à la campagne (jusqu'à 5 types d'annonces différents). Lancez et suivez les performances."
          },
          {
            id: "ad-types",
            heading: "Options publicitaires disponibles",
            content: "✓ Vidéo en flux continu ignorable : Annonces vidéo affichées avant le contenu (les spectateurs peuvent ignorer après 5s)\n✓ Bannière superposée : Bannière texte/image qui se superpose sur les vidéos\nChaque type d'annonce a différentes métriques d'engagement et tarifs. Choisissez en fonction de vos objectifs marketing."
          }
        ]
      },
      {
        id: "admin",
        title: "Fonctionnalités Admin (Admins uniquement)",
        icon: "⚙️",
        subsections: [
          {
            id: "admin-access",
            heading: "Comment accéder au Tableau de bord Admin",
            content: "Si vous êtes un administrateur, cliquez sur votre profil → Tableau de bord Admin. Cela vous donne accès à la modération, la gestion des utilisateurs, les contrôles de phase, les approbations des annonceurs et les analyses complètes. Seuls les comptes avec le rôle administrateur peuvent accéder à ceci."
          },
          {
            id: "moderate-videos",
            heading: "Comment modérer les vidéos soumises",
            content: "Dans le Tableau de bord Admin → Onglet Vidéos, examinez les soumissions en attente. Approuvez les vidéos qui respectent les directives. Rejetez les vidéos qui violent les règles de contenu (incluez la raison du rejet). Les vidéos approuvées sont mises en ligne pour le vote."
          },
          {
            id: "manage-phases",
            heading: "Comment gérer les phases de compétition",
            content: "Dans le Tableau de bord Admin → Onglet Phases, contrôlez les phases actives. Sélectionnez la phase actuellement active. Une seule phase s'exécute à la fois. Avancez les phases au fur et à mesure de la progression de la compétition. Le système filtre les vidéos à la phase appropriée."
          },
          {
            id: "user-management",
            heading: "Comment gérer les utilisateurs",
            content: "Dans le Tableau de bord Admin → Onglet Utilisateurs, affichez tous les utilisateurs enregistrés. Recherchez et filtrez par rôle (admin/juge/concurrent). Vérifiez l'état de l'email, vérifiez les dates de participation et les localités. Gérez les rôles et permissions des utilisateurs à partir de ce panneau."
          }
        ]
      },
      {
        id: "account",
        title: "Compte et Paramètres",
        icon: "🔐",
        subsections: [
          {
            id: "reset-password",
            heading: "Comment réinitialiser votre mot de passe",
            content: "Sur la page de connexion, cliquez sur 'Mot de passe oublié'. Entrez votre email. Vérifiez votre boîte de réception pour un lien de réinitialisation. Cliquez sur le lien et créez un nouveau mot de passe. Connectez-vous avec votre nouveau mot de passe."
          },
          {
            id: "change-email",
            heading: "Comment changer votre email",
            content: "Les modifications d'email nécessitent de contacter le support. Envoyez un email à support@kozzii.africa avec votre email actuel, votre nouvel email et les détails de votre compte. Le support traitera la modification. Vous devrez vérifier votre nouvel email."
          },
          {
            id: "language-toggle",
            heading: "Comment changer de langue",
            content: "Cliquez sur le bouton du sélecteur de langue dans la navigation supérieure (généralement en haut à droite). Choisissez entre l'anglais et le français. L'interface entière se mettra à jour instantanément. Votre préférence est enregistrée localement."
          },
          {
            id: "dark-mode",
            heading: "Comment basculer le mode sombre/clair",
            content: "Cliquez sur le bouton de basculement de thème dans l'en-tête de navigation (icône soleil/lune). Basculez entre le mode sombre et le mode clair. Votre préférence est enregistrée et appliquée lors de futures visites."
          }
        ]
      },
      {
        id: "troubleshooting",
        title: "Dépannage et Support",
        icon: "🆘",
        subsections: [
          {
            id: "upload-fails",
            heading: "Que faire si le téléchargement vidéo échoue",
            content: "1. Vérifiez le format du fichier (MP4, WebM, MOV). 2. Vérifiez que la taille du fichier est inférieure à 500 Mo. 3. Vérifiez votre connexion Internet. 4. Essayez un navigateur différent ou le mode incognito. 5. Videz le cache du navigateur. Si les problèmes persistent, contactez support@kozzii.africa avec les détails d'erreur."
          },
          {
            id: "loading-issues",
            heading: "Que faire si les pages ne se chargent pas",
            content: "1. Actualisez la page. 2. Videz le cache du navigateur et les cookies. 3. Désactivez les extensions du navigateur. 4. Essayez le mode incognito/privé. 5. Essayez un navigateur différent. 6. Vérifiez votre connexion Internet. Contactez le support si les problèmes persistent."
          },
          {
            id: "cant-login",
            heading: "Que faire si vous ne pouvez pas vous connecter",
            content: "1. Vérifiez que l'email est correct. 2. Vérifiez que Maj est désactivé. 3. Réinitialisez le mot de passe en utilisant 'Mot de passe oublié'. 4. Vérifiez que l'email est vérifié. 5. Videz le cache du navigateur. 6. Essayez un navigateur différent. Contactez support@kozzii.africa si vous ne pouvez toujours pas vous connecter."
          },
          {
            id: "contact-support",
            heading: "Comment contacter le support",
            content: "WhatsApp : +237 676 951 397\nEmail : support@kozzii.africa\nFormulaire de contact : Visitez la page /contact\nTemps de réponse : Généralement dans les 24 heures pendant les heures d'ouverture."
          }
        ]
      }
    ]
  };

  const currentContent = language === 'fr' ? helpContent.fr : helpContent.en;

  const toggleSection = (id: string) => {
    setExpandedSections(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold" data-testid="heading-help">
              {language === 'fr' ? 'Centre d\'Aide' : 'Help Center'}
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            {language === 'fr'
              ? 'Trouvez tout ce que vous devez savoir pour utiliser KOSCOCO - des guides de démarrage aux fonctionnalités avancées.'
              : 'Find everything you need to know to use KOSCOCO - from getting started guides to advanced features.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {currentContent.map((section) => (
            <Card
              key={section.id}
              className="cursor-pointer hover-elevate transition-all"
              onClick={() => toggleSection(section.id)}
              data-testid={`help-card-${section.id}`}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{section.icon}</span>
                  <h2 className="text-xl font-bold">{section.title}</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  {language === 'fr' ? 'Cliquez pour explorer' : 'Click to explore'} ({section.subsections.length} {language === 'fr' ? 'sujets' : 'topics'})
                </p>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-8">
          {currentContent
            .filter(section => expandedSections.includes(section.id))
            .map((section) => (
              <div key={section.id} className="space-y-4">
                <div className="flex items-center gap-2 pb-4 border-b">
                  <span className="text-3xl">{section.icon}</span>
                  <h2 className="text-3xl font-bold">{section.title}</h2>
                </div>

                <div className="space-y-3">
                  {section.subsections.map((subsection) => (
                    <div
                      key={subsection.id}
                      className="border rounded-lg"
                      data-testid={`help-subsection-${subsection.id}`}
                    >
                      <div className="px-6 py-4 bg-card">
                        <h3 className="font-semibold text-base">{subsection.heading}</h3>
                      </div>
                      <div className="px-6 py-4 text-muted-foreground whitespace-pre-wrap">
                        {subsection.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>

        <div className="mt-16 p-8 bg-primary/10 rounded-lg text-center">
          <h3 className="text-xl font-bold mb-2">
            {language === 'fr' ? 'Vous avez besoin d\'aide supplémentaire ?' : 'Still need help?'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {language === 'fr'
              ? 'Consultez notre FAQ ou contactez directement notre équipe d\'assistance.'
              : 'Check out our FAQ or contact our support team directly.'}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="/faq"
              className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
              data-testid="button-visit-faq"
            >
              {language === 'fr' ? 'Visitez la FAQ' : 'Visit FAQ'}
            </a>
            <a
              href="mailto:support@kozzii.africa"
              className="inline-block px-6 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition-opacity"
              data-testid="button-email-support"
            >
              {language === 'fr' ? 'Email Support' : 'Email Support'}
            </a>
            <a
              href="https://wa.me/237676951397"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-2 bg-accent text-accent-foreground rounded-md hover:opacity-90 transition-opacity"
              data-testid="button-whatsapp-support"
            >
              {language === 'fr' ? 'WhatsApp' : 'WhatsApp'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
