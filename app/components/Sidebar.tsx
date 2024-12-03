"use client";

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, BookOpen, BarChart } from 'lucide-react';
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
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={cn(
                    "transition-transform duration-700 ease-in-out text-muted-foreground/50 group-hover:text-muted-foreground",
                    !isCollapsed && "rotate-180"
                  )}
                >
                  <path 
                    fillRule="evenodd" 
                    clipRule="evenodd" 
                    d="M8.85719 3H15.1428C16.2266 2.99999 17.1007 2.99998 17.8086 3.05782C18.5375 3.11737 19.1777 3.24318 19.77 3.54497C20.7108 4.02433 21.4757 4.78924 21.955 5.73005C22.2568 6.32234 22.3826 6.96253 22.4422 7.69138C22.5 8.39925 22.5 9.27339 22.5 10.3572V13.6428C22.5 14.7266 22.5 15.6008 22.4422 16.3086C22.3826 17.0375 22.2568 17.6777 21.955 18.27C21.4757 19.2108 20.7108 19.9757 19.77 20.455C19.1777 20.7568 18.5375 20.8826 17.8086 20.9422C17.1008 21 16.2266 21 15.1428 21H8.85717C7.77339 21 6.89925 21 6.19138 20.9422C5.46253 20.8826 4.82234 20.7568 4.23005 20.455C3.28924 19.9757 2.52433 19.2108 2.04497 18.27C1.74318 17.6777 1.61737 17.0375 1.55782 16.3086C1.49998 15.6007 1.49999 14.7266 1.5 13.6428V10.3572C1.49999 9.27341 1.49998 8.39926 1.55782 7.69138C1.61737 6.96253 1.74318 6.32234 2.04497 5.73005C2.52433 4.78924 3.28924 4.02433 4.23005 3.54497C4.82234 3.24318 5.46253 3.11737 6.19138 3.05782C6.89926 2.99998 7.77341 2.99999 8.85719 3ZM6.35424 5.05118C5.74907 5.10062 5.40138 5.19279 5.13803 5.32698C4.57354 5.6146 4.1146 6.07354 3.82698 6.63803C3.69279 6.90138 3.60062 7.24907 3.55118 7.85424C3.50078 8.47108 3.5 9.26339 3.5 10.4V13.6C3.5 14.7366 3.50078 15.5289 3.55118 16.1458C3.60062 16.7509 3.69279 17.0986 3.82698 17.362C4.1146 17.9265 4.57354 18.3854 5.13803 18.673C5.40138 18.8072 5.74907 18.8994 6.35424 18.9488C6.97108 18.9992 7.76339 19 8.9 19H9.5V5H8.9C7.76339 5 6.97108 5.00078 6.35424 5.05118ZM11.5 5V19H15.1C16.2366 19 17.0289 18.9992 17.6458 18.9488C18.2509 18.8994 18.5986 18.8072 18.862 18.673C19.4265 18.3854 19.8854 17.9265 20.173 17.362C20.3072 17.0986 20.3994 16.7509 20.4488 16.1458C20.4992 15.5289 20.5 14.7366 20.5 13.6V10.4C20.5 9.26339 20.4992 8.47108 20.4488 7.85424C20.3994 7.24907 20.3072 6.90138 20.173 6.63803C19.8854 6.07354 19.4265 5.6146 18.862 5.32698C18.5986 5.19279 18.2509 5.10062 17.6458 5.05118C17.0289 5.00078 16.2366 5 15.1 5H11.5ZM5 8.5C5 7.94772 5.44772 7.5 6 7.5H7C7.55229 7.5 8 7.94772 8 8.5C8 9.05229 7.55229 9.5 7 9.5H6C5.44772 9.5 5 9.05229 5 8.5ZM5 12C5 11.4477 5.44772 11 6 11H7C7.55229 11 8 11.4477 8 12C8 12.5523 7.55229 13 7 13H6C5.44772 13 5 12.5523 5 12Z" 
                    fill="currentColor"
                  />
                </svg>
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
