"use client"

import { useState, useEffect } from "react"
import { Menu, MessageSquare, Users, Home } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { useRouter, usePathname } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ServerRail } from "@/components/layout/server-rail"
import { ChannelSidebar } from "@/components/layout/channel-sidebar"
import { DmSidebar } from "@/components/layout/dm-sidebar"

export function MobileNavigation() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { dmView, setDmView, selectedServer, setSelectedServer, setSelectedChannel } = useAppStore()

  // Close drawer on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <div className="md:hidden flex flex-col h-full overflow-hidden border-t border-border-subtle bg-bg-secondary">
       <div className="flex items-center justify-around h-16 shrink-0 border-b border-border-subtle bg-bg-primary">
          <Button 
            variant="ghost" 
            size="icon" 
            className={!dmView && selectedServer ? "text-accent-primary" : "text-text-muted"}
            onClick={() => {
              setDmView(false)
              if (servers.length > 0 && !selectedServer) {
                setSelectedServer(servers[0])
              }
              router.push("/app")
            }}
          >
             <Home className="size-6" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className={dmView ? "text-accent-primary" : "text-text-muted"}
            onClick={() => {
              setDmView(true)
              router.push("/app/friends")
            }}
          >
             <MessageSquare className="size-6" />
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="text-text-muted" />}>
              <Menu className="size-6" />
            </SheetTrigger>
            <SheetContent side="left" className="p-0 flex h-full w-[300px] border-r-0 bg-transparent gap-0" showCloseButton={false}>
               <div className="flex h-full w-full">
                  {/* Reuse existing layout components in a simplified mobile version if needed */}
                  {/* For now, just render them in the drawer */}
                  <div className="contents" onClick={() => setOpen(false)}>
                     {/* We need to handle the state inside the drawer */}
                  </div>
               </div>
            </SheetContent>
          </Sheet>
       </div>
    </div>
  )
}
