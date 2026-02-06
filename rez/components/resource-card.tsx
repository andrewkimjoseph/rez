"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Resource } from "@/data/resources";
import { FileText, Loader2 } from "lucide-react";

interface ResourceCardProps {
  resource: Resource;
  onDownload: (resource: Resource) => Promise<void>;
  isLoading?: boolean;
}

export function ResourceCard({ resource, onDownload, isLoading }: ResourceCardProps) {
  return (
    <div className="group enterprise-card rounded-xl overflow-hidden border border-border/50 transition-all duration-200 hover:shadow-md hover:border-primary/20 flex flex-col h-full">
      <div className="relative aspect-[2/1] bg-muted/50 shrink-0">
        <Image
          src={resource.imageUrl}
          alt={resource.title}
          fill
          className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
        />
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-medium bg-background/90 backdrop-blur-sm">
            {resource.type}
          </Badge>
          {resource.numberOfPages > 0 && (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-medium bg-background/90 backdrop-blur-sm border-white/30">
              {resource.numberOfPages} pages
            </Badge>
          )}
        </div>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <div className="flex flex-wrap gap-1 mb-1">
          {resource.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] text-muted-foreground font-medium"
            >
              {tag}
              {resource.tags.indexOf(tag) < resource.tags.length - 1 && (
                <span className="mx-1">•</span>
              )}
            </span>
          ))}
        </div>
        <h3 className="font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors text-sm">
          {resource.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1 flex-1 mb-3">
          {resource.description}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-auto"
          onClick={() => onDownload(resource)}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              Downloading…
            </>
          ) : (
            <>
              <FileText className="h-3.5 w-3.5 mr-2" />
              {resource.ctaText ?? "Free Download"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
