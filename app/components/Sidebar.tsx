"use client";

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, BookOpen, BarChart } from 'lucide-react';
import MoodJournal from './MoodJournal';
import MoodStatistics from './MoodStats';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from 'react';
import { playfair } from '../lib/fonts';

interface SidebarProps {
  isCollapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

type ViewType = 'journal' | 'stats';

export default function Sidebar({ isCollapsed, onCollapsedChange }: SidebarProps) {
  const [currentView, setCurrentView] = useState<ViewType>('journal');

  return (
    <>
      <div
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-700 ease-in-out',
          isCollapsed ? 'w-[60px]' : 'w-[345px]'
        )}
      >
        <div className="pt-4">
          <div className="px-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-9 w-9 p-0 transition-transform duration-700 ease-in-out hover:bg-accent group",
                )}
                onClick={() => onCollapsedChange(!isCollapsed)}
              >
                <PanelLeftOpen 
                  className={cn(
                    "h-4 w-4 transition-transform duration-700 ease-in-out text-muted-foreground/50 group-hover:text-muted-foreground",
                    !isCollapsed && "rotate-180"
                  )} 
                />
              </Button>

              <div className={cn("flex-1", isCollapsed && "invisible")}>
                <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as ViewType)}>
                  <TabsList className="w-full">
                    <TabsTrigger value="journal" className="flex-1">
                      <BookOpen className="h-4 w-4 mr-2" />
                      <span className={cn("text-sm", playfair.className)}>Journal</span>
                    </TabsTrigger>
                    <TabsTrigger value="stats" className="flex-1">
                      <BarChart className="h-4 w-4 mr-2" />
                      <span className={cn("text-sm", playfair.className)}>Statistics</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>
        </div>

        <div 
          className={cn(
            'flex-1 overflow-auto pt-4 custom-scrollbar',
            isCollapsed && 'invisible'
          )}
          style={{
            '--scrollbar-width': '8px',
            '--scrollbar-track': 'transparent',
            '--scrollbar-thumb': 'rgba(0, 0, 0, 0.1)',
            '--scrollbar-thumb-hover': 'rgba(0, 0, 0, 0.2)',
            '--scrollbar-radius': '999px',
          } as React.CSSProperties}
        >
          <div className="px-4">
            {currentView === 'journal' ? <MoodJournal /> : <MoodStatistics />}
          </div>

          <style jsx global>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: var(--scrollbar-width);
            }
            
            .custom-scrollbar::-webkit-scrollbar-track {
              background: var(--scrollbar-track);
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: var(--scrollbar-thumb);
              border-radius: var(--scrollbar-radius);
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: var(--scrollbar-thumb-hover);
            }
          `}</style>
        </div>
      </div>
    </>
  );
}
