import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

interface CategoryCardProps {
  title: string;
  image: string;
  subcategories: string[];
  entryCount: number;
  onClick?: () => void;
}

export default function CategoryCard({ title, image, subcategories, entryCount, onClick }: CategoryCardProps) {
  return (
    <Card 
      className="overflow-hidden hover-elevate active-elevate-2 cursor-pointer transition-transform duration-200"
      onClick={onClick}
      data-testid={`card-category-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="aspect-video relative overflow-hidden bg-muted">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      
      <div className="p-6">
        <h3 className="font-display text-3xl mb-3 tracking-wide uppercase">
          {title}
        </h3>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {subcategories.slice(0, 3).map((sub, idx) => (
            <Badge 
              key={idx} 
              variant="secondary" 
              className="text-xs"
              data-testid={`badge-subcategory-${idx}`}
            >
              {sub}
            </Badge>
          ))}
          {subcategories.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{subcategories.length - 3}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground" data-testid="text-entry-count">
            {entryCount} entries
          </span>
          <ArrowRight className="w-5 h-5 text-primary" />
        </div>
      </div>
    </Card>
  );
}
