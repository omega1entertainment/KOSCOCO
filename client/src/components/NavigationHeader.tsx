import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import logo from "@assets/kOSCOCO_1762050897989.png";

interface NavigationHeaderProps {
  currentPhase?: string;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
}

export default function NavigationHeader({ 
  currentPhase = "PHASE 2: TOP 50 ACTIVE",
  onLoginClick,
  onRegisterClick
}: NavigationHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navItems = ['Categories', 'How It Works', 'Leaderboard', 'Prizes'];
  
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <img src={logo} alt="KOSCOCO" className="h-8" data-testid="img-logo" />
            
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <button
                  key={item}
                  className="text-sm font-medium hover-elevate px-3 py-2 rounded-md transition-colors"
                  onClick={() => console.log(`Navigate to ${item}`)}
                  data-testid={`link-${item.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <Badge variant="destructive" className="font-bold text-xs tracking-wide" data-testid="badge-phase">
              {currentPhase}
            </Badge>
            <Button 
              variant="ghost" 
              onClick={onLoginClick}
              data-testid="button-login"
            >
              Login
            </Button>
            <Button 
              onClick={onRegisterClick}
              data-testid="button-register"
            >
              Register
            </Button>
          </div>
          
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="flex flex-col p-4 gap-2">
            {navItems.map((item) => (
              <button
                key={item}
                className="text-left px-4 py-3 hover-elevate rounded-md"
                onClick={() => {
                  console.log(`Navigate to ${item}`);
                  setMobileMenuOpen(false);
                }}
              >
                {item}
              </button>
            ))}
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t">
              <Button variant="ghost" onClick={onLoginClick}>Login</Button>
              <Button onClick={onRegisterClick}>Register</Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
