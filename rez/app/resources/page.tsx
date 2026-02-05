"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, LayoutGrid } from "lucide-react";
import Image from "next/image";
import { ForumArticleCard } from "@/components/forum-article-card";
import { forumArticles } from "@/data/forumArticles";
import { useState } from "react";
import { useAmplitudeEvents } from "@/hooks/use-amplitude-events";

export default function Resources() {
  const [activeTab, setActiveTab] = useState("overview");
  const { playbookDownloadClicked, guideDownloadClicked } = useAmplitudeEvents();

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
            className="data-[state=active]:bg-[#5C29A3] data-[state=active]:text-white data-[state=active]:shadow-sm px-4 py-2.5 rounded-md transition-all duration-200 text-sm font-medium"
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="articles"
            className="data-[state=active]:bg-[#5C29A3] data-[state=active]:text-white data-[state=active]:shadow-sm px-4 py-2.5 rounded-md transition-all duration-200 text-sm font-medium"
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
                  Research Resources
                </h2>
                <p className="text-white/80 text-sm md:text-base max-w-lg">
                  Access articles, research insights, and practical guides to help you design better surveys and conduct effective research.
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
            
            <div
              onClick={async (e) => {
                e.preventDefault();
                playbookDownloadClicked({ file_name: "rez-playbook.pdf", file_size_mb: 77, source: "resources_page" });
                try {
                  const { downloadFileFromStorage } = await import('@/lib/client-storage');
                  await downloadFileFromStorage('website_assets/playbook.pdf', 'rez-playbook.pdf');
                } catch (error) {
                  console.error('Failed to download playbook:', error);
                }
              }}
              className="text-left group cursor-pointer"
            >
              <div className="enterprise-card p-5 h-full flex items-start gap-4 border-0 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-primary/10 group-hover:bg-primary/15 transition-colors">
                  <Image
                    src="/covers/playbook.png"
                    alt="African Digital Finance Insights"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                    African Digital Finance Insights
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Perspectives on mobile money, blockchain, and financial inclusion across Kenya and Nigeria
                  </p>
                </div>
              </div>
            </div>
            
            <div
              onClick={async (e) => {
                e.preventDefault();
                guideDownloadClicked({ file_name: "rez-user-guide.pdf", file_size_mb: 9, source: "resources_page" });
                try {
                  const { downloadFileFromStorage } = await import('@/lib/client-storage');
                  await downloadFileFromStorage('website_assets/guide.pdf', 'rez-user-guide.pdf');
                } catch (error) {
                  console.error('Failed to download guide:', error);
                }
              }}
              className="text-left group cursor-pointer"
            >
              <div className="enterprise-card p-5 h-full flex items-start gap-4 border-0 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-primary/10 group-hover:bg-primary/15 transition-colors">
                  <Image
                    src="/covers/guide.png"
                    alt="How to Design Surveys for Quality Responses"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                    How to Design Surveys for Quality Responses
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A 6-section practical guide for researchers using The Mom Test methodology
                  </p>
                </div>
              </div>
            </div>
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
