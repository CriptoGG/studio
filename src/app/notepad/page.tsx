
"use client";

import Link from 'next/link';
import { Notebook } from 'lucide-react';
import { MarkdownEditor } from '@/components/Notepad/MarkdownEditor';
import type { Metadata } from 'next';

export default function NotepadPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="py-6 px-4 sm:px-6 lg:px-8 border-b">
        <div className="container mx-auto">
          <Link href="/" className="inline-block">
            <div className="flex items-center space-x-3 cursor-pointer group">
              <Notebook className="h-10 w-10 text-primary group-hover:text-accent transition-colors" />
              <h1 className="text-4xl font-headline font-bold text-foreground group-hover:text-accent transition-colors">
                Markdown Notepad
              </h1>
            </div>
          </Link>
          <p className="text-muted-foreground mt-1 text-lg">
            Your notes are saved automatically to your browser's local storage.
          </p>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MarkdownEditor />
      </main>

      <footer className="text-center py-6 text-sm text-muted-foreground border-t">
        <p>&copy; {new Date().getFullYear()} Notepad Demo. Happy writing!</p>
      </footer>
    </div>
  );
}

    