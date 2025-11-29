import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FAQ() {
  const { t, language } = useLanguage();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const faqData = {
    en: [
      {
        id: "general-1",
        category: "General Information",
        question: "What is KOSCOCO?",
        answer: "KOSCOCO (KOZZII Short Content Competition) is a premier video competition platform designed for Cameroonian content creators. Operated by KOZZII INC, a company based in Limbe, we host regular competitions across multiple categories with substantial cash prizes, aiming to discover and celebrate talent from Cameroon."
      },
      {
        id: "general-2",
        category: "General Information",
        question: "Where is KOSCOCO based?",
        answer: "KOSCOCO is run by KOZZII based in Cameroon, specifically in Limbe, South West Region (Bonjo Street). We serve creators across Cameroon and beyond."
      },
      {
        id: "general-3",
        category: "General Information",
        question: "How can I contact KOSCOCO for support?",
        answer: "You can reach us via: WhatsApp: +237 676 951 397 | Email: support@kozzii.africa | Visit our contact page for more options."
      },
      {
        id: "registration-1",
        category: "Registration & Participation",
        question: "How do I register for a competition?",
        answer: "Visit the Categories page, select your desired category, and click 'Register.' You'll need to be logged in to your account. After registration, complete the payment (if applicable) to confirm your participation."
      },
      {
        id: "registration-2",
        category: "Registration & Participation",
        question: "Do I need to verify my email to participate?",
        answer: "Yes, email verification is required to create an account and participate in competitions. Check your inbox for the verification email and click the confirmation link."
      },
      {
        id: "registration-3",
        category: "Registration & Participation",
        question: "Can I register for multiple categories?",
        answer: "Yes! You can register and submit videos to multiple categories. Each category may have separate entry fees."
      },
      {
        id: "registration-4",
        category: "Registration & Participation",
        question: "What is the registration fee?",
        answer: "Registration fees vary by category. Check the category details page to see the specific fee for your chosen category."
      },
      {
        id: "video-1",
        category: "Video Submission",
        question: "What video formats are accepted?",
        answer: "We accept MP4, WebM, and MOV formats. Ensure your video meets our technical specifications before uploading."
      },
      {
        id: "video-2",
        category: "Video Submission",
        question: "What are the video duration limits?",
        answer: "Video duration depends on your category. Most categories accept videos between 15 seconds and 5 minutes. Check your category-specific requirements."
      },
      {
        id: "video-3",
        category: "Video Submission",
        question: "What is the maximum file size for video uploads?",
        answer: "The maximum file size is typically 500MB per video. If your file exceeds this, compress it using video editing software."
      },
      {
        id: "video-4",
        category: "Video Submission",
        question: "Can I upload AI-generated or deepfake content?",
        answer: "No. AI-generated or deepfake content is strictly prohibited and will result in immediate disqualification from the competition."
      },
      {
        id: "video-5",
        category: "Video Submission",
        question: "What happens if my video doesn't meet the requirements?",
        answer: "Videos are reviewed by our moderation team. If your video doesn't meet requirements, you'll receive a notification with specific issues. You can resubmit a corrected version."
      },
      {
        id: "video-6",
        category: "Video Submission",
        question: "How long does it take for my video to be approved?",
        answer: "Most videos are approved within 24-48 hours. You'll receive a notification once your video is approved and live on the platform."
      },
      {
        id: "voting-1",
        category: "Voting & Judging",
        question: "How does the voting system work?",
        answer: "The competition has two voting components: Public Voting (anyone can vote) and Judge Scoring (professional judges score videos). The combination of both determines the final ranking."
      },
      {
        id: "voting-2",
        category: "Voting & Judging",
        question: "Is public voting free?",
        answer: "Yes, each user gets free votes daily. For additional votes, you can purchase vote packages using Flutterwave payment."
      },
      {
        id: "voting-3",
        category: "Voting & Judging",
        question: "Can I vote for my own video?",
        answer: "No, you cannot vote for your own video. The system prevents self-voting to ensure fair competition."
      },
      {
        id: "voting-5",
        category: "Voting & Judging",
        question: "How are judge scores calculated?",
        answer: "Judges score submissions based on creativity, technical quality, relevance to category, and overall impact. Scores are averaged and combined with public voting results."
      },
      {
        id: "phases-1",
        category: "Competition Phases",
        question: "What are the competition phases?",
        answer: "Competitions progress through 5 phases: TOP 100, TOP 50, TOP 10, TOP 3, and GRAND FINALE. Videos are filtered and advanced based on voting in each phase."
      },
      {
        id: "phases-2",
        category: "Competition Phases",
        question: "How long does each phase last?",
        answer: "Each phase duration varies. Check the active competition details for specific timeline information."
      },
      {
        id: "phases-3",
        category: "Competition Phases",
        question: "What happens if my video doesn't advance to the next phase?",
        answer: "Only the highest-voted videos advance. If your video doesn't advance, you can watch the winners and consider submitting to the next competition."
      },
      {
        id: "prizes-1",
        category: "Prizes & Rewards",
        question: "What are the prize amounts?",
        answer: "Prize amounts vary by category and competition. Winners in each category receive cash prizes for 1st, 2nd, and 3rd place. Check the Prizes page for specific amounts."
      },
      {
        id: "prizes-2",
        category: "Prizes & Rewards",
        question: "How are prizes distributed?",
        answer: "Prizes are distributed directly to winners' registered email addresses. We use bank transfer or mobile money options for payment."
      },
      {
        id: "prizes-3",
        category: "Prizes & Rewards",
        question: "When will I receive my prize if I win?",
        answer: "Prizes are typically distributed within 7-14 days after the competition ends. You'll receive notification of your winnings and payment details."
      },
      {
        id: "technical-1",
        category: "Technical Issues",
        question: "My upload keeps failing. What should I do?",
        answer: "Check your internet connection, file format, and file size. Try uploading a compressed version or use a different browser. Contact support if issues persist."
      },
      {
        id: "technical-2",
        category: "Technical Issues",
        question: "The platform isn't loading properly. How do I fix this?",
        answer: "Try clearing your browser cache, disabling extensions, or using an incognito/private window. If problems continue, contact support@kozzii.africa."
      },
      {
        id: "technical-3",
        category: "Technical Issues",
        question: "Can I edit or delete my submitted video?",
        answer: "Yes! Go to your Creator Dashboard > My Videos tab. You can edit video details or delete submissions before they're voted on."
      },
      {
        id: "account-1",
        category: "Account & Profile",
        question: "How do I reset my password?",
        answer: "Click 'Forgot Password' on the login page, enter your email, and follow the instructions sent to your inbox."
      },
      {
        id: "account-2",
        category: "Account & Profile",
        question: "Can I change my registered email address?",
        answer: "Currently, email changes require contacting support. Email support@kozzii.africa with your account details and new email address."
      },
      {
        id: "account-3",
        category: "Account & Profile",
        question: "How do I update my profile information?",
        answer: "Go to Creator Dashboard > Profile tab to update your name, location, age, username, and other profile details."
      },
      {
        id: "account-4",
        category: "Account & Profile",
        question: "How do I delete my account?",
        answer: "Contact support@kozzii.africa with your account details to request account deletion. Note: This is permanent and cannot be undone."
      },
      {
        id: "affiliate-1",
        category: "Affiliate Program",
        question: "What is the KOSCOCO Affiliate Program?",
        answer: "Our affiliate program lets you earn 20% commission on every new user you refer. Share your unique referral link, and earn rewards when people sign up and pay through your link."
      },
      {
        id: "affiliate-2",
        category: "Affiliate Program",
        question: "How do I join the affiliate program?",
        answer: "Go to Creator Dashboard > Earnings tab or visit /affiliate. Click 'Join Program' to get started. It's free to join!"
      },
      {
        id: "affiliate-3",
        category: "Affiliate Program",
        question: "How much can I earn as an affiliate?",
        answer: "You earn 20% commission on every paying registration from your referrals. Earnings are unlimited - the more you refer, the more you earn."
      },
      {
        id: "affiliate-4",
        category: "Affiliate Program",
        question: "How do I withdraw my affiliate earnings?",
        answer: "Go to Affiliate Dashboard > Payout History. Submit a payout request when you have sufficient balance (minimum amount applies). Payouts are processed within 7 days."
      },
      {
        id: "affiliate-5",
        category: "Affiliate Program",
        question: "Can non-participants earn as affiliates?",
        answer: "Yes! You don't need to be a contestant to join the affiliate program. Anyone can sign up and start earning commissions."
      },
      {
        id: "judge-1",
        category: "Becoming a Judge",
        question: "How can I become a judge?",
        answer: "If you're an industry expert or established content creator, reach out to us at support@kozzii.africa with your credentials and experience."
      },
      {
        id: "voting-4",
        category: "Voting & Judging",
        question: "Who are the judges?",
        answer: "Judges are industry professionals, content creators, and experts in their respective categories."
      },
      {
        id: "judge-2",
        category: "Becoming a Judge",
        question: "What are the requirements to be a judge?",
        answer: "Judges should have significant experience in their category, proven expertise, and good standing in their respective fields."
      },
      {
        id: "payment-1",
        category: "Payment & Billing",
        question: "What payment methods do you accept?",
        answer: "We accept payment via Flutterwave, which supports mobile money, credit/debit cards, and bank transfers."
      },
      {
        id: "payment-2",
        category: "Payment & Billing",
        question: "Is my payment information secure?",
        answer: "Yes. We use Flutterwave, a secure PCI-compliant payment processor. Your payment details are encrypted and secure."
      },
      {
        id: "payment-3",
        category: "Payment & Billing",
        question: "Can I get a refund if I change my mind?",
        answer: "Refund policies vary by category and competition. Check the specific competition terms or contact support@kozzii.africa for refund inquiries."
      },
      {
        id: "content-1",
        category: "Content Guidelines",
        question: "What content is not allowed?",
        answer: "Content that is violent, hateful, sexually explicit, promotes illegal activity, or violates intellectual property rights is not allowed. AI-generated or deepfake content is also prohibited."
      },
      {
        id: "content-2",
        category: "Content Guidelines",
        question: "Can I submit copyrighted music in my video?",
        answer: "You can use royalty-free music or music you have permission to use. Ensure you have proper licenses or permissions before submission."
      },
      {
        id: "content-3",
        category: "Content Guidelines",
        question: "Can I use other people in my videos?",
        answer: "Yes, but ensure you have permission from anyone featured in your video. Respect privacy and obtain necessary consents."
      },
      {
        id: "newsletter-1",
        category: "Newsletter & Updates",
        question: "How do I subscribe to the KOSCOCO newsletter?",
        answer: "Scroll to the footer on any page and enter your email in the newsletter signup section. You'll receive updates about competitions, tips, and exclusive opportunities."
      },
      {
        id: "newsletter-2",
        category: "Newsletter & Updates",
        question: "Can I unsubscribe from the newsletter?",
        answer: "Yes! Every newsletter email includes an unsubscribe link. Click it to remove yourself from our mailing list."
      },
      {
        id: "other-1",
        category: "Other Questions",
        question: "Is KOSCOCO available on mobile?",
        answer: "Yes! KOSCOCO is fully responsive and works great on mobile devices. You can browse, register, upload, and vote from your phone."
      },
      {
        id: "other-2",
        category: "Other Questions",
        question: "Are there language options available?",
        answer: "Yes! KOSCOCO supports both English and French. Toggle the language using the language selector in the top navigation."
      },
      {
        id: "other-3",
        category: "Other Questions",
        question: "Can international creators participate?",
        answer: "KOSCOCO is designed for Cameroonian creators, but international creators based in Cameroon or with Cameroonian ties are welcome to participate."
      }
    ],
    fr: [
      {
        id: "general-1",
        category: "Informations Générales",
        question: "Qu'est-ce que KOSCOCO ?",
        answer: "KOSCOCO (KOZZII Short Content Competition) est une plateforme de compétition vidéo de premier plan conçue pour les créateurs de contenu camerounais. Exploitée par KOZZII INC, une entreprise basée à Limbé, nous organisons des compétitions régulières dans plusieurs catégories avec des prix en espèces substantiels, dans le but de découvrir et de célébrer les talents du Cameroun."
      },
      {
        id: "general-2",
        category: "Informations Générales",
        question: "Où se trouve KOSCOCO ?",
        answer: "KOSCOCO est gérée par KOZZII basée au Cameroun, spécifiquement à Limbé, Région du Sud-Ouest (Bonjo Street). Nous servons les créateurs du Cameroun et au-delà."
      },
      {
        id: "general-3",
        category: "Informations Générales",
        question: "Comment puis-je contacter KOSCOCO pour obtenir de l'aide ?",
        answer: "Vous pouvez nous joindre via : WhatsApp : +237 676 951 397 | Email : support@kozzii.africa | Visitez notre page de contact pour plus d'options."
      },
      {
        id: "registration-1",
        category: "Inscription et Participation",
        question: "Comment m'inscrire à une compétition ?",
        answer: "Visitez la page Catégories, sélectionnez votre catégorie souhaitée et cliquez sur 'S'inscrire'. Vous devez être connecté à votre compte. Après inscription, effectuez le paiement (le cas échéant) pour confirmer votre participation."
      },
      {
        id: "registration-2",
        category: "Inscription et Participation",
        question: "Dois-je vérifier mon email pour participer ?",
        answer: "Oui, la vérification par email est requise pour créer un compte et participer aux compétitions. Vérifiez votre boîte de réception pour l'email de vérification et cliquez sur le lien de confirmation."
      },
      {
        id: "registration-3",
        category: "Inscription et Participation",
        question: "Puis-je m'inscrire à plusieurs catégories ?",
        answer: "Oui ! Vous pouvez vous inscrire et soumettre des vidéos à plusieurs catégories. Chaque catégorie peut avoir des frais d'inscription distincts."
      },
      {
        id: "registration-4",
        category: "Inscription et Participation",
        question: "Quel est le tarif d'inscription ?",
        answer: "Les frais d'inscription varient selon la catégorie. Consultez la page détails de la catégorie pour voir les frais spécifiques de votre catégorie choisie."
      },
      {
        id: "video-1",
        category: "Soumission de Vidéos",
        question: "Quels formats vidéo sont acceptés ?",
        answer: "Nous acceptons les formats MP4, WebM et MOV. Assurez-vous que votre vidéo répond à nos spécifications techniques avant le téléchargement."
      },
      {
        id: "video-2",
        category: "Soumission de Vidéos",
        question: "Quelles sont les limites de durée vidéo ?",
        answer: "La durée vidéo dépend de votre catégorie. La plupart des catégories acceptent des vidéos entre 15 secondes et 5 minutes. Vérifiez les exigences spécifiques de votre catégorie."
      },
      {
        id: "video-3",
        category: "Soumission de Vidéos",
        question: "Quelle est la taille maximale de fichier pour les téléchargements vidéo ?",
        answer: "La taille maximale de fichier est généralement 500 Mo par vidéo. Si votre fichier dépasse cette limite, compressez-le à l'aide d'un logiciel de montage vidéo."
      },
      {
        id: "video-4",
        category: "Soumission de Vidéos",
        question: "Puis-je télécharger du contenu généré par l'IA ou des deepfakes ?",
        answer: "Non. Le contenu généré par l'IA ou les deepfakes sont strictement interdits et entraîneront une disqualification immédiate de la compétition."
      },
      {
        id: "video-5",
        category: "Soumission de Vidéos",
        question: "Que se passe-t-il si ma vidéo ne répond pas aux exigences ?",
        answer: "Les vidéos sont examinées par notre équipe de modération. Si votre vidéo ne répond pas aux exigences, vous recevrez une notification avec les problèmes spécifiques. Vous pouvez renvoyer une version corrigée."
      },
      {
        id: "video-6",
        category: "Soumission de Vidéos",
        question: "Combien de temps faut-il pour que ma vidéo soit approuvée ?",
        answer: "La plupart des vidéos sont approuvées dans les 24 à 48 heures. Vous recevrez une notification une fois que votre vidéo aura été approuvée et mise en ligne."
      },
      {
        id: "voting-1",
        category: "Votation et Jugement",
        question: "Comment fonctionne le système de vote ?",
        answer: "La compétition comporte deux composantes de vote : Vote public (n'importe qui peut voter) et Notation des juges (les juges professionnels notent les vidéos). La combinaison des deux détermine le classement final."
      },
      {
        id: "voting-2",
        category: "Votation et Jugement",
        question: "Le vote public est-il gratuit ?",
        answer: "Oui, chaque utilisateur obtient des votes gratuits quotidiens. Pour des votes supplémentaires, vous pouvez acheter des packages de votes à l'aide du paiement Flutterwave."
      },
      {
        id: "voting-3",
        category: "Votation et Jugement",
        question: "Puis-je voter pour ma propre vidéo ?",
        answer: "Non, vous ne pouvez pas voter pour votre propre vidéo. Le système empêche l'auto-vote pour garantir une compétition équitable."
      },
      {
        id: "voting-4",
        category: "Votation et Jugement",
        question: "Qui sont les juges ?",
        answer: "Les juges sont des professionnels de l'industrie, des créateurs de contenu et des experts dans leurs catégories respectives."
      },
      {
        id: "voting-5",
        category: "Votation et Jugement",
        question: "Comment les notes des juges sont-elles calculées ?",
        answer: "Les juges notent les soumissions en fonction de la créativité, de la qualité technique, de la pertinence par rapport à la catégorie et de l'impact global. Les notes sont moyennées et combinées avec les résultats du vote public."
      },
      {
        id: "phases-1",
        category: "Phases de Compétition",
        question: "Quelles sont les phases de compétition ?",
        answer: "Les compétitions progressent à travers 5 phases : TOP 100, TOP 50, TOP 10, TOP 3 et GRANDE FINALE. Les vidéos sont filtrées et avancées en fonction du vote dans chaque phase."
      },
      {
        id: "phases-2",
        category: "Phases de Compétition",
        question: "Combien de temps dure chaque phase ?",
        answer: "La durée de chaque phase varie. Consultez les détails de la compétition active pour des informations chronologiques spécifiques."
      },
      {
        id: "phases-3",
        category: "Phases de Compétition",
        question: "Que se passe-t-il si ma vidéo n'avance pas à la phase suivante ?",
        answer: "Seules les vidéos les plus votées avancent. Si votre vidéo n'avance pas, vous pouvez regarder les gagnants et envisager de participer à la prochaine compétition."
      },
      {
        id: "prizes-1",
        category: "Prix et Récompenses",
        question: "Quels sont les montants des prix ?",
        answer: "Les montants des prix varient selon la catégorie et la compétition. Les gagnants de chaque catégorie reçoivent des prix en espèces pour les places 1ère, 2ème et 3ème. Consultez la page Prix pour les montants spécifiques."
      },
      {
        id: "prizes-2",
        category: "Prix et Récompenses",
        question: "Comment les prix sont-ils distribués ?",
        answer: "Les prix sont distribués directement aux adresses email enregistrées des gagnants. Nous utilisons virement bancaire ou options d'argent mobile pour le paiement."
      },
      {
        id: "prizes-3",
        category: "Prix et Récompenses",
        question: "Quand recevrai-je mon prix si je gagne ?",
        answer: "Les prix sont généralement distribués dans les 7 à 14 jours après la fin de la compétition. Vous recevrez une notification de vos gains et des détails de paiement."
      },
      {
        id: "technical-1",
        category: "Problèmes Techniques",
        question: "Mon téléchargement n'arrête pas d'échouer. Que devrais-je faire ?",
        answer: "Vérifiez votre connexion Internet, le format de fichier et la taille du fichier. Essayez de télécharger une version compressée ou utilisez un navigateur différent. Contactez le support si les problèmes persistent."
      },
      {
        id: "technical-2",
        category: "Problèmes Techniques",
        question: "La plateforme ne se charge pas correctement. Comment corriger cela ?",
        answer: "Essayez de vider le cache de votre navigateur, de désactiver les extensions ou d'utiliser une fenêtre incognito/privée. Si les problèmes persistent, contactez support@kozzii.africa."
      },
      {
        id: "technical-3",
        category: "Problèmes Techniques",
        question: "Puis-je modifier ou supprimer ma vidéo soumise ?",
        answer: "Oui ! Allez à Tableau de bord créateur > Onglet Mes vidéos. Vous pouvez modifier les détails vidéo ou supprimer les soumissions avant qu'elles ne soient votées."
      },
      {
        id: "account-1",
        category: "Compte et Profil",
        question: "Comment réinitialiser mon mot de passe ?",
        answer: "Cliquez sur 'Mot de passe oublié' sur la page de connexion, entrez votre email et suivez les instructions envoyées à votre boîte de réception."
      },
      {
        id: "account-2",
        category: "Compte et Profil",
        question: "Puis-je changer mon adresse email enregistrée ?",
        answer: "Actuellement, les modifications d'email nécessitent de contacter le support. Envoyez un email à support@kozzii.africa avec les détails de votre compte et la nouvelle adresse email."
      },
      {
        id: "account-3",
        category: "Compte et Profil",
        question: "Comment mettre à jour mon profil ?",
        answer: "Allez à Tableau de bord créateur > Onglet Profil pour mettre à jour votre nom, localisation, âge, nom d'utilisateur et autres détails de profil."
      },
      {
        id: "account-4",
        category: "Compte et Profil",
        question: "Comment supprimer mon compte ?",
        answer: "Contactez support@kozzii.africa avec les détails de votre compte pour demander la suppression du compte. Remarque : C'est permanent et ne peut pas être annulé."
      },
      {
        id: "affiliate-1",
        category: "Programme d'Affiliation",
        question: "Qu'est-ce que le Programme d'Affiliation KOSCOCO ?",
        answer: "Notre programme d'affiliation vous permet de gagner 20% de commission sur chaque nouvel utilisateur que vous parrainez. Partagez votre lien de parrainage unique et gagnez des récompenses lorsque des gens s'inscrivent et paient via votre lien."
      },
      {
        id: "affiliate-2",
        category: "Programme d'Affiliation",
        question: "Comment puis-je rejoindre le programme d'affiliation ?",
        answer: "Allez à Tableau de bord créateur > Onglet Revenus ou visitez /affiliate. Cliquez sur 'Rejoindre le programme' pour commencer. C'est gratuit de rejoindre !"
      },
      {
        id: "affiliate-3",
        category: "Programme d'Affiliation",
        question: "Combien puis-je gagner en tant qu'affilié ?",
        answer: "Vous gagnez 20% de commission sur chaque inscription payante de vos parrainage. Les gains sont illimités - plus vous parrainez, plus vous gagnez."
      },
      {
        id: "affiliate-4",
        category: "Programme d'Affiliation",
        question: "Comment puis-je retirer mes gains d'affiliation ?",
        answer: "Allez à Tableau de bord d'affiliation > Historique des paiements. Soumettez une demande de paiement lorsque vous avez un solde suffisant (montant minimum applicable). Les paiements sont traités dans un délai de 7 jours."
      },
      {
        id: "affiliate-5",
        category: "Programme d'Affiliation",
        question: "Les non-participants peuvent-ils gagner en tant qu'affiliés ?",
        answer: "Oui ! Vous n'avez pas besoin d'être un concurrent pour rejoindre le programme d'affiliation. N'importe qui peut s'inscrire et commencer à gagner des commissions."
      },
      {
        id: "judge-1",
        category: "Devenir Juge",
        question: "Comment puis-je devenir juge ?",
        answer: "Si vous êtes un expert de l'industrie ou un créateur de contenu établi, contactez-nous à support@kozzii.africa avec vos références et votre expérience."
      },
      {
        id: "judge-2",
        category: "Devenir Juge",
        question: "Quelles sont les conditions pour être juge ?",
        answer: "Les juges doivent avoir une expérience significative dans leur catégorie, une expertise éprouvée et une bonne réputation dans leurs domaines respectifs."
      },
      {
        id: "payment-1",
        category: "Paiement et Facturation",
        question: "Quels moyens de paiement acceptez-vous ?",
        answer: "Nous acceptons les paiements via Flutterwave, qui prend en charge l'argent mobile, les cartes de crédit/débit et les virements bancaires."
      },
      {
        id: "payment-2",
        category: "Paiement et Facturation",
        question: "Mes informations de paiement sont-elles sécurisées ?",
        answer: "Oui. Nous utilisons Flutterwave, un processeur de paiement conforme PCI sécurisé. Vos données de paiement sont chiffrées et sécurisées."
      },
      {
        id: "payment-3",
        category: "Paiement et Facturation",
        question: "Puis-je obtenir un remboursement si je change d'avis ?",
        answer: "Les politiques de remboursement varient selon la catégorie et la compétition. Consultez les conditions spécifiques de la compétition ou contactez support@kozzii.africa pour les demandes de remboursement."
      },
      {
        id: "content-1",
        category: "Directives de Contenu",
        question: "Quel contenu n'est pas autorisé ?",
        answer: "Le contenu violent, haineux, sexuellement explicite, promouvant des activités illégales ou violant les droits d'auteur n'est pas autorisé. Le contenu généré par l'IA ou les deepfakes sont également interdits."
      },
      {
        id: "content-2",
        category: "Directives de Contenu",
        question: "Puis-je soumettre de la musique protégeée par le droit d'auteur dans ma vidéo ?",
        answer: "Vous pouvez utiliser de la musique libre de droits ou de la musique pour laquelle vous avez la permission de l'utiliser. Assurez-vous d'avoir les licences ou permissions appropriées avant soumission."
      },
      {
        id: "content-3",
        category: "Directives de Contenu",
        question: "Puis-je utiliser d'autres personnes dans mes vidéos ?",
        answer: "Oui, mais assurez-vous d'avoir la permission de toute personne figurant dans votre vidéo. Respectez la vie privée et obtenez les consentements nécessaires."
      },
      {
        id: "newsletter-1",
        category: "Infolettre et Mises à Jour",
        question: "Comment m'abonner à l'infolettre KOSCOCO ?",
        answer: "Faites défiler jusqu'au bas de n'importe quelle page et entrez votre email dans la section d'inscription à l'infolettre. Vous recevrez des mises à jour sur les compétitions, des conseils et des opportunités exclusives."
      },
      {
        id: "newsletter-2",
        category: "Infolettre et Mises à Jour",
        question: "Puis-je me désabonner de l'infolettre ?",
        answer: "Oui ! Chaque email d'infolettre inclut un lien de désabonnement. Cliquez dessus pour vous retirer de notre liste de diffusion."
      },
      {
        id: "other-1",
        category: "Autres Questions",
        question: "KOSCOCO est-il disponible sur mobile ?",
        answer: "Oui ! KOSCOCO est entièrement responsive et fonctionne très bien sur les appareils mobiles. Vous pouvez naviguer, vous inscrire, télécharger et voter depuis votre téléphone."
      },
      {
        id: "other-2",
        category: "Autres Questions",
        question: "Y a-t-il des options de langue disponibles ?",
        answer: "Oui ! KOSCOCO prend en charge l'anglais et le français. Basculez la langue à l'aide du sélecteur de langue dans la navigation supérieure."
      },
      {
        id: "other-3",
        category: "Autres Questions",
        question: "Les créateurs internationaux peuvent-ils participer ?",
        answer: "KOSCOCO est conçue pour les créateurs camerounais, mais les créateurs internationaux basés au Cameroun ou ayant des liens camerounais sont invités à participer."
      }
    ]
  };

  const currentFAQs = language === 'fr' ? faqData.fr : faqData.en;
  const categories = Array.from(new Set(currentFAQs.map(item => item.category)));

  const toggleItem = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4" data-testid="heading-faq">
            {language === 'fr' ? 'Questions Fréquemment Posées' : 'Frequently Asked Questions'}
          </h1>
          <p className="text-lg text-muted-foreground">
            {language === 'fr' 
              ? 'Trouvez les réponses à vos questions sur KOSCOCO, l\'inscription, les vidéos, les votes et plus.'
              : 'Find answers to your questions about KOSCOCO, registration, videos, voting, and more.'}
          </p>
        </div>

        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category} className="space-y-4">
              <h2 className="text-2xl font-bold text-primary" data-testid={`heading-category-${category}`}>
                {category}
              </h2>
              
              <div className="space-y-3">
                {currentFAQs
                  .filter(item => item.category === category)
                  .map((item) => (
                    <div 
                      key={item.id}
                      className="border rounded-lg transition-colors"
                      data-testid={`faq-item-${item.id}`}
                    >
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
                        data-testid={`button-toggle-${item.id}`}
                      >
                        <span className="font-semibold text-base">{item.question}</span>
                        <ChevronDown 
                          className={`w-5 h-5 transition-transform duration-200 ${
                            expandedItems.includes(item.id) ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      
                      {expandedItems.includes(item.id) && (
                        <div 
                          className="px-6 py-4 bg-muted/30 border-t text-muted-foreground"
                          data-testid={`answer-${item.id}`}
                        >
                          {item.answer}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 bg-primary/10 rounded-lg text-center">
          <h3 className="text-xl font-bold mb-2">
            {language === 'fr' ? "Vous n'avez pas trouvé la réponse ?" : "Didn't find your answer?"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {language === 'fr'
              ? 'Contactez-nous directement pour obtenir de l\'aide.'
              : 'Contact us directly for support.'}
          </p>
          <a 
            href="mailto:support@kozzii.africa"
            className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
            data-testid="button-contact-support"
          >
            {language === 'fr' ? 'Contactez le Support' : 'Contact Support'}
          </a>
        </div>
      </div>
    </div>
  );
}
