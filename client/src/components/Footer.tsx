import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { useState } from "react";
import logo from "@assets/kOSCOCO_1762050897989.png";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  
  const categories = [
    { key: 'prizes.categories.musicDance' },
    { key: 'prizes.categories.comedyPerforming' },
    { key: 'prizes.categories.fashionLifestyle' },
    { key: 'prizes.categories.educationLearning' },
    { key: 'prizes.categories.gospelChoirs' },
  ];
  
  const support = [
    { key: 'footer.contact' },
    { key: 'footer.faq' },
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
              <Button size="icon" variant="ghost" data-testid="button-facebook">
                <Facebook className="w-5 h-5" />
              </Button>
              <Button size="icon" variant="ghost" data-testid="button-twitter">
                <Twitter className="w-5 h-5" />
              </Button>
              <Button size="icon" variant="ghost" data-testid="button-instagram">
                <Instagram className="w-5 h-5" />
              </Button>
              <Button size="icon" variant="ghost" data-testid="button-youtube">
                <Youtube className="w-5 h-5" />
              </Button>
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
              {support.map((item) => (
                <li key={item.key}>
                  <button 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => console.log(`Navigate to ${t(item.key)}`)}
                  >
                    {t(item.key)}
                  </button>
                </li>
              ))}
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
                  console.log('Subscribe:', email);
                  setEmail('');
                }}
                data-testid="button-subscribe"
              >
                {t('footer.subscribe')}
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
