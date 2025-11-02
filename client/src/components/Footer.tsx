import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { useState } from "react";
import logo from "@assets/kOSCOCO_1762050897989.png";

export default function Footer() {
  const [email, setEmail] = useState('');
  
  const categories = [
    'Music & Dance',
    'Comedy & Performing Arts',
    'Fashion & Lifestyle',
    'Education & Learning',
    'Gospel Choirs',
  ];
  
  const support = ['Contact', 'FAQs', 'Competition Rules', 'Terms of Service', 'Privacy Policy'];
  
  return (
    <footer className="bg-card border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div>
            <img src={logo} alt="KOSCOCO" className="h-8 mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Cameroon's premier short content competition platform. Discover and celebrate creativity.
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
            <h3 className="font-bold mb-4">Categories</h3>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat}>
                  <button 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => console.log(`Navigate to ${cat}`)}
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-4">Support</h3>
            <ul className="space-y-2">
              {support.map((item) => (
                <li key={item}>
                  <button 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => console.log(`Navigate to ${item}`)}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-4">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get updates on competition phases and winners.
            </p>
            <div className="flex gap-2">
              <Input 
                placeholder="Your email"
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
                Subscribe
              </Button>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 KOZZII INC. All rights reserved. |{' '}
            <a href="mailto:support@kozzii.africa" className="hover:text-foreground transition-colors">
              support@kozzii.africa
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
