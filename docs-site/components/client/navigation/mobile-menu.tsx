"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  links: Array<{
    href: string
    label: string
    external?: boolean
  }>
}

export function MobileMenu({ isOpen, onClose, links }: MobileMenuProps) {
  
  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-in-out",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-4/5 max-w-sm bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b">
            <span className="text-lg font-semibold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
              v0 MCP Server
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {links.map((link) => (
              <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className="block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 min-h-[44px] flex items-center text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  {...(link.external && { target: "_blank", rel: "noopener noreferrer" })}
                >
                  <span className="flex items-center justify-between w-full">
                    {link.label}
                    {link.external && (
                      <svg className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    )}
                  </span>
                </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  )
}