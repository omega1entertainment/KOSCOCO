import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Instagram } from "lucide-react";
import { SiTiktok, SiX } from "react-icons/si";
import { useState } from "react";
import { Link } from "wouter";
import logo from "@assets/kOSCOCO_1762050897989.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Footer() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  
  const subscribeMutation = useMutation({
    mutationFn: async (emailAddress: string) => {
      return await apiRequest("/api/newsletter/subscribe", "POST", {
        email: emailAddress,
      });
    },
    onSuccess: () => {
      toast({
        title: "Thank You For Subscribing!",
        description: "Welcome to the KOSCOCO Newsletter. You'll receive exciting updates about competitions, creator tips, and exclusive opportunities.",
        variant: "default",
      });
      setEmail('');
    },
    onError: (error: any) => {
      if (error.message?.includes("already subscribed")) {
        toast({
          title: "Already Subscribed",
          description: "This email is already subscribed to our newsletter.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Subscription Failed",
          description: "Please try again later or contact support@kozzii.africa",
          variant: "destructive",
        });
      }
    },
  });
  
  const categories = [
    { key: 'prizes.categories.musicDance' },
    { key: 'prizes.categories.comedyPerforming' },
    { key: 'prizes.categories.fashionLifestyle' },
    { key: 'prizes.categories.educationLearning' },
    { key: 'prizes.categories.gospelChoirs' },
  ];
  
  const support = [
    { key: 'footer.contact' },
    { key: 'footer.help' },
    { key: 'footer.faq' },
    { key: 'footer.howItWorks' },
    { key: 'footer.rules' },
    { key: 'footer.termsOfService' },
    { key: 'footer.privacyPolicy' },
  ];
  
  return (
    <footer className="bg-card border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div>
            <img src={logo} alt={t('footer.logoAlt')} className="h-8 mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              {t('footer.description')}
            </p>
            <div className="flex items-center gap-2">
              <a href="https://web.facebook.com/kozziientertainment" target="_blank" rel="noopener noreferrer" data-testid="link-social-facebook">
                <Button size="icon" variant="ghost">
                  <Facebook className="w-5 h-5" />
                </Button>
              </a>
              <a href="https://www.instagram.com/kozzii_237/" target="_blank" rel="noopener noreferrer" data-testid="link-social-instagram">
                <Button size="icon" variant="ghost">
                  <Instagram className="w-5 h-5" />
                </Button>
              </a>
              <a href="https://www.tiktok.com/@kozzii_entertainment" target="_blank" rel="noopener noreferrer" data-testid="link-social-tiktok">
                <Button size="icon" variant="ghost">
                  <SiTiktok className="w-5 h-5" />
                </Button>
              </a>
              <a href="https://x.com/KozziiEnte14391" target="_blank" rel="noopener noreferrer" data-testid="link-social-x">
                <Button size="icon" variant="ghost">
                  <SiX className="w-5 h-5" />
                </Button>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold mb-4">{t('footer.categoriesHeading')}</h3>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.key}>
                  <button 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => console.log(`Navigate to ${t(cat.key)}`)}
                  >
                    {t(cat.key)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-4">{t('footer.supportHeading')}</h3>
            <ul className="space-y-2">
              {support.map((item) => {
                // Map footer items to their routes
                const routeMap: { [key: string]: string } = {
                  'footer.contact': '/contact',
                  'footer.help': '/help',
                  'footer.faq': '/faq',
                  'footer.howItWorks': '/how-it-works',
                  'footer.rules': '/rules',
                  'footer.termsOfService': '/terms-of-service',
                  'footer.privacyPolicy': '/privacy-policy',
                  'footer.competitionRules': '/rules',
                };
                const route = routeMap[item.key];
                
                return (
                  <li key={item.key}>
                    {route ? (
                      <a 
                        href={route}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors block"
                        data-testid={`link-footer-${item.key}`}
                      >
                        {item.key === 'footer.help' ? 'Help' : t(item.key)}
                      </a>
                    ) : (
                      <button 
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => console.log(`Navigate to ${item.key === 'footer.help' ? 'Help' : t(item.key)}`)}
                      >
                        {item.key === 'footer.help' ? 'Help' : t(item.key)}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-4">{t('footer.newsletterHeading')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('footer.newsletterDescription')}
            </p>
            <div className="flex gap-2">
              <Input 
                placeholder={t('footer.emailPlaceholder')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-newsletter-email"
              />
              <Button 
                onClick={() => {
                  if (!email || !email.includes('@')) {
                    toast({
                      title: "Invalid Email",
                      description: "Please enter a valid email address.",
                      variant: "destructive",
                    });
                    return;
                  }
                  subscribeMutation.mutate(email);
                }}
                disabled={subscribeMutation.isPending || !email}
                data-testid="button-subscribe"
              >
                {subscribeMutation.isPending ? 'Subscribing...' : t('footer.subscribe')}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground">
            {t('footer.copyrightText')} |{' '}
            <a href="mailto:support@kozzii.africa" className="hover:text-foreground transition-colors">
              {t('nav.support')}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
