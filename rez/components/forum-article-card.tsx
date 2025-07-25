import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ClockIcon, UserIcon } from "lucide-react";
import Image from "next/image";

export function ForumArticleCard({
  title,
  description,
  date,
  imageUrl,
  category,
  postUrl
}: {
  title: string;
  description: string;
  date: string;
  imageUrl: string;
  category: string;
  postUrl: string;
}) {
  return (
    <a
      href={postUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
      tabIndex={0}
      aria-label={`Open article: ${title}`}
      style={{ textDecoration: 'none' }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 p-0 cursor-pointer">
        <div className="relative w-full h-48">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover w-full h-full"
            style={{ borderRadius: 0 }}
          />
          <div className="absolute top-3 left-3">
            <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
              {category}
            </span>
          </div>
        </div>
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="text-lg line-clamp-2">{title}</CardTitle>
          <CardDescription className="line-clamp-3">{description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              <span>{date}</span>
            </div>
          </div>
          <div className="flex items-center justify-end mb-4">
            <Button size="sm" variant="outline">
              Read More
            </Button>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}