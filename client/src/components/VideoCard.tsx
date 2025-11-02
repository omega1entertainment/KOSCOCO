import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play, Heart, Eye, Share2 } from "lucide-react";
import { useState } from "react";

interface VideoCardProps {
  id: string;
  title: string;
  thumbnail: string;
  creator: {
    name: string;
    avatar?: string;
  };
  category: string;
  votes: number;
  views: number;
  onPlay?: () => void;
  onVote?: () => void;
  onShare?: () => void;
}

export default function VideoCard({
  id,
  title,
  thumbnail,
  creator,
  category,
  votes: initialVotes,
  views,
  onPlay,
  onVote,
  onShare
}: VideoCardProps) {
  const [votes, setVotes] = useState(initialVotes);
  const [hasVoted, setHasVoted] = useState(false);
  
  const handleVote = () => {
    if (!hasVoted) {
      setVotes(v => v + 1);
      setHasVoted(true);
      onVote?.();
    }
  };
  
  return (
    <Card className="overflow-hidden hover-elevate transition-transform duration-200" data-testid={`card-video-${id}`}>
      <div 
        className="aspect-video relative overflow-hidden bg-muted cursor-pointer group"
        onClick={onPlay}
      >
        <img 
          src={thumbnail} 
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
            <Play className="w-8 h-8 text-primary-foreground fill-current ml-1" />
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={creator.avatar} />
            <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1 truncate" data-testid="text-video-title">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground" data-testid="text-creator-name">
              {creator.name}
            </p>
          </div>
        </div>
        
        <Badge variant="secondary" className="mb-3 text-xs" data-testid="badge-category">
          {category}
        </Badge>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1" data-testid="text-vote-count">
              <Heart className="w-4 h-4" /> {votes}
            </span>
            <span className="flex items-center gap-1" data-testid="text-view-count">
              <Eye className="w-4 h-4" /> {views}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              size="icon" 
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onShare?.();
              }}
              data-testid="button-share"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button 
              size="sm"
              variant={hasVoted ? "secondary" : "default"}
              onClick={(e) => {
                e.stopPropagation();
                handleVote();
              }}
              disabled={hasVoted}
              data-testid="button-vote"
            >
              <Heart className="w-4 h-4 mr-1" />
              Vote
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
