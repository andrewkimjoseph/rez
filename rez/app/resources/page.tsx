"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, LayoutGrid } from "lucide-react";
import Image from "next/image";
import { ForumArticleCard } from "@/components/forum-article-card";
import { forumArticles } from "@/data/forumArticles";
import { resources, RESOURCE_TYPES, type Resource } from "@/data/resources";
import { downloadResourceBySlug } from "@/lib/client-storage";
import { useState, useMemo } from "react";
import { useAmplitudeEvents } from "@/hooks/use-amplitude-events";
import { toast } from "sonner";
import { ResourceCard } from "@/components/resource-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function Resources() {
  const [activeTab, setActiveTab] = useState("overview");
  const [resourceLoading, setResourceLoading] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { playbookDownloadClicked, guideDownloadClicked } = useAmplitudeEvents();

  const filteredResources = useMemo(() => {
    let list = resources;
    if (typeFilter !== "all") {
      list = list.filter((r) => r.type === typeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [typeFilter, searchQuery]);

  const handleDownload = async (resource: Resource) => {
    if (resourceLoading) return;
    setResourceLoading(resource.id);
    const toastId = `download-${resource.id}`;
    toast.loading("Downloading…", { id: toastId });
    try {
      if (resource.downloadSlug === "playbook") {
        playbookDownloadClicked({
          file_name: resource.downloadFilename,
          file_size_mb: 77,
          source: "resources_page",
        });
      } else {
        guideDownloadClicked({
          file_name: resource.downloadFilename,
          file_size_mb: 9,
          source: "resources_page",
        });
      }
      await downloadResourceBySlug(resource.downloadSlug, resource.downloadFilename);
      toast.success("Download started", { id: toastId, duration: 2500 });
    } catch (error) {
      console.error("Failed to download:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to download",
        { id: toastId }
      );
    } finally {
      setResourceLoading(null);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
          Resource Library
        </h1>
        <p className="text-muted-foreground mt-1">
          Browse guides, reports, and resources — filter by type or topic to find
          what you need.
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
            value="guides"
            className="data-[state=active]:bg-[#5C29A3] data-[state=active]:text-white data-[state=active]:shadow-sm px-4 py-2.5 rounded-md transition-all duration-200 text-sm font-medium"
          >
            <FileText className="h-4 w-4 mr-2" />
            Guides & Reports
          </TabsTrigger>
          <TabsTrigger
            value="articles"
            className="data-[state=active]:bg-[#5C29A3] data-[state=active]:text-white data-[state=active]:shadow-sm px-4 py-2.5 rounded-md transition-all duration-200 text-sm font-medium"
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Articles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 space-y-6">
          {/* Hero Banner */}
          <div className="enterprise-card rounded-xl overflow-hidden border-0">
            <div className="relative w-full h-64 md:h-80">
              <Image
                src="/resources.jpg"
                alt="Resources"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <button
              onClick={() => setActiveTab("guides")}
              className="text-left group"
            >
              <div className="enterprise-card p-5 h-full flex items-start gap-4 border-0 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                    Guides & Reports
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Browse downloadable guides and reports — surveys, research, and methodology resources.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </TabsContent>

        <TabsContent value="guides" className="mt-0 space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-9">
                <SelectValue placeholder="All content types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All content types</SelectItem>
                {RESOURCE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Search resources…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm h-9"
            />
          </div>

          {/* Resource Grid */}
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Showing {filteredResources.length} resource
              {filteredResources.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onDownload={handleDownload}
                  isLoading={resourceLoading === resource.id}
                />
              ))}
            </div>
            {filteredResources.length === 0 && (
              <p className="text-muted-foreground text-center py-12">
                No resources match your filters.
              </p>
            )}
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
