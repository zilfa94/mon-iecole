import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Home, Pin } from 'lucide-react';

export function Layout() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-8">
                            <h1 className="text-xl font-bold text-gray-900">Mon École</h1>
                            <div className="flex gap-4">
                                <Link to="/app/feed">
                                    <Button
                                        variant={isActive('/app/feed') ? 'default' : 'ghost'}
                                        size="sm"
                                        className="gap-2"
                                    >
                                        <Home className="h-4 w-4" />
                                        Feed
                                    </Button>
                                </Link>
                                <Link to="/app/pinned">
                                    <Button
                                        variant={isActive('/app/pinned') ? 'default' : 'ghost'}
                                        size="sm"
                                        className="gap-2"
                                    >
                                        <Pin className="h-4 w-4" />
                                        Épinglés
                                    </Button>
                                </Link>
                                {user?.role !== 'STUDENT' && (
                                    <Link to="/app/messages">
                                        <Button
                                            variant={isActive('/app/messages') ? 'default' : 'ghost'}
                                            size="sm"
                                            className="gap-2"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="h-4 w-4"
                                            >
                                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                            </svg>
                                            Messagerie
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>

                        {user && (
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">
                                        {user.firstName} {user.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500">{user.role}</p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => logout()}
                                    className="gap-2"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Déconnexion
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
}
