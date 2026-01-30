import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Home, Pin, Mail, Menu, Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getUnreadCount } from '@/lib/api';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Layout() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const { data: unreadData } = useQuery({
        queryKey: ['unreadCount'],
        queryFn: getUnreadCount,
        refetchInterval: 10000,
        enabled: !!user && user.role !== 'STUDENT'
    });

    const isActive = (path: string) => location.pathname === path;

    const NavIcon = ({ to, icon: Icon, active, badge }: { to: string; icon: any; active: boolean; badge?: number }) => (
        <Link to={to} className="relative group w-20 md:w-28 flex justify-center h-full items-center">
            <div className={`
                p-3 rounded-lg flex items-center justify-center transition-colors relative
                ${active ? 'text-primary' : 'text-gray-500 hover:bg-gray-100'}
            `}>
                <Icon className={`h-7 w-7 ${active ? 'fill-current' : ''}`} />
                {badge && badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-white">
                        {badge}
                    </span>
                )}
            </div>
            {active && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />
            )}
        </Link>
    );

    return (
        <div className="min-h-screen bg-background font-sans">
            {/* Sticky Header */}
            <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm h-14">
                <div className="max-w-[1920px] mx-auto px-4 h-full flex justify-between items-center">

                    {/* Left: Logo */}
                    <div className="flex items-center gap-2 w-[300px]">
                        <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-2xl">
                            M
                        </div>
                        {/* Search input could go here later */}
                    </div>

                    {/* Center: Navigation */}
                    <div className="flex h-full gap-1 items-center justify-center flex-1 max-w-2xl">
                        <NavIcon to="/app/feed" icon={Home} active={isActive('/app/feed')} />
                        <NavIcon to="/app/pinned" icon={Pin} active={isActive('/app/pinned')} />
                        {user?.role !== 'STUDENT' && (
                            <NavIcon
                                to="/app/messages"
                                icon={Mail}
                                active={isActive('/app/messages')}
                                badge={unreadData?.total}
                            />
                        )}
                    </div>

                    {/* Right: User Menu */}
                    <div className="flex items-center justify-end gap-2 w-[300px]">
                        <Button variant="ghost" size="icon" className="rounded-full bg-gray-100 hover:bg-gray-200 text-black w-10 h-10">
                            <Menu className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full bg-gray-100 hover:bg-gray-200 text-black w-10 h-10">
                            <Bell className="h-5 w-5" />
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="rounded-full p-0 w-10 h-10 ml-2 overflow-hidden">
                                    <Avatar>
                                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user?.role}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={() => logout()}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Se déconnecter</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto flex justify-center pt-6 px-0 md:px-4">
                {/* Center Feed Column */}
                <div className="w-full max-w-[680px]">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
