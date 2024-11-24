"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MoodJournal from "./MoodJournal";
import MoodStats from "./MoodStats";
import { Card } from "@/components/ui/card";

export default function TabsContainer() {
  return (
    <div className="max-w-[600px] mx-auto">
      <Card className="p-4">
        <Tabs defaultValue="journal" className="w-full">
          <TabsList className="grid w-full grid-cols-2 p-0 bg-transparent">
            <TabsTrigger 
              value="journal" 
              className="text-lg rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
            >
              Journal
            </TabsTrigger>
            <TabsTrigger 
              value="statistics" 
              className="text-lg rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-colors"
            >
              Statistics
            </TabsTrigger>
          </TabsList>
          <div className="mt-4">
            <TabsContent value="journal">
              <MoodJournal hideExpandButton={true} />
            </TabsContent>
            <TabsContent value="statistics">
              <MoodStats />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
} 