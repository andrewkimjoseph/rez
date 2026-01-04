"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, LayoutGrid } from "lucide-react";
import Image from "next/image";
import { ForumArticleCard } from "@/components/forum-article-card";
import { forumArticles } from "@/data/forumArticles";
import { useState } from "react";

export default function Resources() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
          Research Resources
        </h1>
        <p className="text-muted-foreground mt-1">
          Access articles, guides, and community resources to help advance your research.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-card border border-border/50 p-1 rounded-lg h-auto mb-6">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm px-4 py-2.5 rounded-md transition-all duration-200 text-sm font-medium"
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="articles"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm px-4 py-2.5 rounded-md transition-all duration-200 text-sm font-medium"
          >
            <FileText className="h-4 w-4 mr-2" />
            Articles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 space-y-6">
          {/* Hero Banner */}
          <div className="enterprise-card rounded-xl overflow-hidden border-0">
            <div className="relative w-full h-64 md:h-80">
              <Image
                src="/resources.jpg"
                alt="Community"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-2">
                  Research Community
                </h2>
                <p className="text-white/80 text-sm md:text-base max-w-lg">
                  Join thousands of researchers sharing insights and collaborating on research challenges.
                </p>
              </div>
            </div>
          </div>

          {/* Resource Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button 
              onClick={() => setActiveTab("articles")}
              className="text-left group"
            >
              <div className="enterprise-card p-5 h-full flex items-start gap-4 border-0 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                    Articles & Blogs
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Discover the latest research trends, methodologies, and insights from experts.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </TabsContent>

        <TabsContent value="articles" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {forumArticles.map((forumArticle) => (
              <ForumArticleCard
                key={forumArticle.id}
                title={forumArticle.title}
                description={forumArticle.description}
                date={forumArticle.date}
                imageUrl={forumArticle.imageUrl}
                category={forumArticle.category}
                postUrl={forumArticle.postUrl}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
