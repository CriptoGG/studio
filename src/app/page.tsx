
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Gauge, LayoutGrid, ShieldCheck, Palette, Notebook, CheckSquare, LogOut, User as UserIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AsteroidIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-8 w-8 text-accent"
  >
    <path
      d="M12.83,2.25C12.5,1.42 11.5,1.42 11.17,2.25L10.05,5.32L7.5,4.5L5.63,6.37L4.82,8.93L1.75,10.05C0.92,10.38 0.92,11.38 1.75,11.71L4.82,12.83L5.63,15.38L7.5,17.25L10.05,16.43L11.17,19.5C11.5,20.33 12.5,20.33 12.83,19.5L13.95,16.43L16.5,17.25L18.37,15.38L19.18,12.83L22.25,11.71C23.08,11.38 23.08,10.38 22.25,10.05L19.18,8.93L18.37,6.37L16.5,4.5L13.95,5.32L12.83,2.25Z"
    />
  </svg>
);

const SnakeIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-8 w-8 text-accent"
    >
        <path d="M10 8a2 2 0 1 0-4 0v4a2 2 0 1 0 4 0" />
        <path d="M10 12a2 2 0 1 1-4 0v4a2 2 0 1 1 4 0" />
        <path d="M14 8a2 2 0 1 0-4 0v10a2 2 0 1 0 4 0" />
    </svg>
);


function UserNav() {
  const { user, signOut: logOut, loading } = useAuth();

  if (loading) {
    return <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />;
  }

  if (!user) {
    return (
      <Link href="/login" passHref>
        <Button variant="outline">Login</Button>
      </Link>
    );
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.toUpperCase().slice(0, 2);
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.displayName || 'Anonymous User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="py-6 px-4 sm:px-6 lg:px-8 border-b">
        <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <LayoutGrid className="text-primary h-10 w-10" />
              <h1 className="text-4xl font-headline font-bold text-foreground">App Showcase</h1>
            </div>
            <UserNav />
        </div>
        <div className="container mx-auto">
          <p className="text-muted-foreground mt-1 text-lg">
            Welcome! Explore interactive demo applications built with Next.js and Firebase Studio.
          </p>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section>
          <h2 className="text-3xl font-bold tracking-tight text-primary mb-8">
            Available Applications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Gauge className="h-8 w-8 text-accent" />
                  <CardTitle className="text-2xl font-semibold">FuzzyStat</CardTitle>
                </div>
                <CardDescription className="text-base">
                  An intelligent thermostat demo using fuzzy logic to optimize temperature settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <div className="aspect-[16/10] w-full overflow-hidden rounded-md">
                  <Image
                    src="https://placehold.co/600x375.png"
                    alt="FuzzyStat Thermostat Interface Preview"
                    width={600}
                    height={375}
                    className="object-cover w-full h-full"
                    data-ai-hint="thermostat dashboard graph"
                    priority
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Dive into an interactive experience where you can adjust settings, observe the system's reasoning, and see intelligent temperature regulation in action.
                </p>
              </CardContent>
              <CardFooter className="mt-auto">
                <Link href="/fuzzystat" passHref className="w-full">
                  <Button variant="brand" className="w-full text-md py-3">
                    Launch FuzzyStat
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck className="h-8 w-8 text-accent" />
                  <CardTitle className="text-2xl font-semibold">Secure Message Demo</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Learn how end-to-end encryption protects your messages from sender to receiver.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <div className="aspect-[16/10] w-full overflow-hidden rounded-md">
                  <Image
                    src="https://placehold.co/600x375.png"
                    alt="Secure Message Encryption Preview"
                    width={600}
                    height={375}
                    className="object-cover w-full h-full"
                    data-ai-hint="encryption security lock"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Input a message, see it "encrypted", and then "decrypt" it to understand the basic principles of E2EE.
                </p>
              </CardContent>
              <CardFooter className="mt-auto">
                <Link href="/secure-message" passHref className="w-full">
                  <Button variant="brand" className="w-full text-md py-3">
                    Launch Secure Message
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
            
            <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Palette className="h-8 w-8 text-accent" />
                  <CardTitle className="text-2xl font-semibold">Theme Customizer</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Dynamically change the look and feel of the entire application.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <div className="aspect-[16/10] w-full overflow-hidden rounded-md">
                  <Image
                    src="https://placehold.co/600x375.png"
                    alt="Theme Customizer Preview"
                    width={600}
                    height={375}
                    className="object-cover w-full h-full"
                    data-ai-hint="color palette picker"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                    Pick new colors for the primary, accent, and background elements and see the changes live.
                </p>
              </CardContent>
              <CardFooter className="mt-auto">
                <Link href="/theme-customizer" passHref className="w-full">
                  <Button variant="brand" className="w-full text-md py-3">
                    Launch Customizer
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <AsteroidIcon />
                  <CardTitle className="text-2xl font-semibold">Asteroids</CardTitle>
                </div>
                <CardDescription className="text-base">
                  A classic arcade game. Shoot asteroids and survive as long as you can.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <div className="aspect-[16/10] w-full overflow-hidden rounded-md">
                  <Image
                    src="https://placehold.co/600x375.png"
                    alt="Asteroids Game Preview"
                    width={600}
                    height={375}
                    className="object-cover w-full h-full"
                    data-ai-hint="asteroids space shooter"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Control your ship, destroy asteroids, and try to get a high score in this interactive demo.
                </p>
              </CardContent>
              <CardFooter className="mt-auto">
                <Link href="/asteroids" passHref className="w-full">
                  <Button variant="brand" className="w-full text-md py-3">
                    Launch Asteroids
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <SnakeIcon />
                  <CardTitle className="text-2xl font-semibold">Snake</CardTitle>
                </div>
                <CardDescription className="text-base">
                  A classic arcade game. Eat the food and grow your snake.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <div className="aspect-[16/10] w-full overflow-hidden rounded-md">
                  <Image
                    src="https://placehold.co/600x375.png"
                    alt="Snake Game Preview"
                    width={600}
                    height={375}
                    className="object-cover w-full h-full"
                    data-ai-hint="snake game classic"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                    Control the snake, eat the food, and avoid the walls and yourself to get a high score.
                </p>
              </CardContent>
              <CardFooter className="mt-auto">
                <Link href="/snake" passHref className="w-full">
                  <Button variant="brand" className="w-full text-md py-3">
                    Launch Snake
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Notebook className="h-8 w-8 text-accent" />
                  <CardTitle className="text-2xl font-semibold">Notepad</CardTitle>
                </div>
                <CardDescription className="text-base">
                  A simple markdown notepad that saves your notes to local storage.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <div className="aspect-[16/10] w-full overflow-hidden rounded-md">
                  <Image
                    src="https://placehold.co/600x375.png"
                    alt="Notepad App Preview"
                    width={600}
                    height={375}
                    className="object-cover w-full h-full"
                    data-ai-hint="markdown editor text"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                    Write in Markdown on one side and see the rendered output on the other. Your notes are saved automatically.
                </p>
              </CardContent>
              <CardFooter className="mt-auto">
                <Link href="/notepad" passHref className="w-full">
                  <Button variant="brand" className="w-full text-md py-3">
                    Launch Notepad
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

          </div>
        </section>
      </main>

      <footer className="text-center py-8 text-sm text-muted-foreground border-t">
        <div className="container mx-auto">
          <p>&copy; {new Date().getFullYear()} Firebase Studio Demos. Explore and Learn.</p>
        </div>
      </footer>
    </div>
  );
}

    