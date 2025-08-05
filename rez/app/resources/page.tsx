"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users } from "lucide-react";
import Image from "next/image";
import { ForumArticleCard } from "@/components/forum-article-card";
import { forumArticles } from "@/data/forumArticles";
import Link from "next/link";
import { useState } from "react";

export default function Resources() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen pb-20 sm:p-4 font-[family-name:var(--font-sen)] p-4">
      {/* Title */}
      <div className="mb-2">
        <h1 className="text-3xl md:text-4xl font-bold mb-1">Research Resources</h1>
        <p className="text-base md:text-lg text-gray-600">Access articles, guides, community forums, and more to help advance your research.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
        <TabsList className="bg-white">
          <TabsTrigger
            value="overview"
            className="
              data-[state=active]:bg-[#363062] data-[state=active]:text-white
              data-[state=inactive]:bg-white data-[state=inactive]:text-[#363062]
            "
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="articles"
            className="
              data-[state=active]:bg-[#363062] data-[state=active]:text-white
              data-[state=inactive]:bg-white data-[state=inactive]:text-[#363062]
            "
          >
            Articles
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          {/* Hero Banner with Community CTA */}
          <div className="w-full rounded-xl overflow-hidden bg-white shadow mb-8">
            <div className="relative w-full h-80 md:h-[28rem]">
              <Image
                src="/resources.jpg"
                alt="Community"
                fill
                className="object-cover"
                priority
              />
              {/* Overlay Banner */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[95%] md:w-[85%] lg:w-[70%] bg-gradient-to-r from-orange-400 to-pink-500 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between px-6 py-4 gap-4 mt-4 md:mt-0">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-30 rounded-full p-2">
                   <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-lg md:text-xl">Join our active community of 5,000+ researchers</div>
                    <div className="text-white text-sm md:text-base opacity-90">Share insights, ask questions, and collaborate on research challenges</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href="#" className="bg-white text-pink-600 font-semibold px-4 py-2 rounded-lg shadow hover:bg-gray-100 transition">Browse Topics</a>
                  <a href="#" className="bg-blue-900 text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-blue-800 transition">Join Community</a>
                </div>
              </div>
            </div>
          </div>

          {/* Resource Cards */}

          <button 
            onClick={() => setActiveTab("articles")}
            className="w-full text-left"
          >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow p-5 flex items-start gap-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
              <div className="bg-blue-100 text-blue-600 rounded-full p-2">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" fill="#3B82F6" fillOpacity=".15"/><path d="M8 8h8M8 12h8M8 16h4" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <div>
                <div className="font-semibold text-base md:text-lg mb-1">Articles & Blogs</div>
                <div className="text-gray-600 text-sm md:text-base">Discover the latest research trends, methodologies, and insights from experts.</div>
              </div>
            </div>
          </div>
          </button>
        </TabsContent>
        <TabsContent value="articles">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

            {/* Forum Articles */}
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
