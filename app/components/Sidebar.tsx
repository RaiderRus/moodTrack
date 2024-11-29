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
      <Button
        variant="ghost"
        className={cn(
          "fixed left-0 top-4 z-50 h-12 w-12 p-0.5 rounded-r-full bg-background/95 shadow-md border border-border/40 backdrop-blur transition-colors hover:bg-accent group",
          isCollapsed && "translate-x-[60px]"
        )}
        onClick={() => onCollapsedChange(!isCollapsed)}
      >
        <PanelLeftOpen 
          className={cn(
            "h-8 w-8 transition-transform text-muted-foreground/50 group-hover:text-muted-foreground",
            !isCollapsed && "rotate-180"
          )} 
        />
      </Button>

      <div
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 pt-20',
          isCollapsed ? 'w-[60px]' : 'w-[300px]'
        )}
      >
        <div 
          className={cn(
            'flex-1 overflow-auto space-y-4 custom-scrollbar',
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
