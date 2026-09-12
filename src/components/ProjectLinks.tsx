import React from 'react';
import { ProjectLinks as LinksType } from '../types';
import { Globe, FileText, Send, Disc as DiscordIcon, Instagram } from 'lucide-react';

interface ProjectLinksProps {
  links: LinksType;
}

export const ProjectLinks: React.FC<ProjectLinksProps> = ({ links }) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {links.website && (
        <a
          href={links.website}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-white transition-all hover:scale-105"
          title="Website"
        >
          <Globe className="w-4 h-4" />
        </a>
      )}

      {links.twitter && (
        <a
          href={links.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-white transition-all hover:scale-105"
          title="Twitter / X"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
      )}

      {links.instagram && (
        <a
          href={links.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-pink-400 transition-all hover:scale-105"
          title="Instagram"
        >
          <Instagram className="w-4 h-4" />
        </a>
      )}

      {links.telegram && (
        <a
          href={links.telegram}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-sky-400 transition-all hover:scale-105"
          title="Telegram Official"
        >
          <Send className="w-3.5 h-3.5" />
        </a>
      )}

      {links.telegramChat && (
        <a
          href={links.telegramChat}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-xs font-medium text-slate-300 hover:text-sky-300 transition-all hover:scale-105"
          title="Telegram Global Chat"
        >
          <Send className="w-4 h-4 text-sky-400" />
        </a>
      )}

      {links.discord && (
        <a
          href={links.discord}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-indigo-400 transition-all hover:scale-105"
          title="Discord"
        >
          <DiscordIcon className="w-4 h-4" />
        </a>
      )}

      {links.whitepaper && (
        links.whitepaper === 'TBA' || !links.whitepaper.startsWith('http') ? (
          <span
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs font-medium text-slate-500 cursor-not-allowed"
            title="Whitepaper Coming Soon"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            <span>Whitepaper (Soon)</span>
          </span>
        ) : (
          <a
            href={links.whitepaper}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-xs font-medium text-slate-300 hover:text-white transition-all hover:scale-105"
            title="Whitepaper"
          >
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Whitepaper</span>
          </a>
        )
      )}
    </div>
  );
};
