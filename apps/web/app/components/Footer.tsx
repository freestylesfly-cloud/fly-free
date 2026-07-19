'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const linkStyle = { color: 'var(--text-secondary)', transition: 'color 0.3s ease' };

  return (
    <footer className="mt-20 transition" style={{ backgroundColor: 'var(--bg-secondary)', borderTopColor: 'var(--border-color)', borderTopWidth: '1px' }}>
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-cyan-500 flex items-center justify-center">
                <span className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>FF</span>
              </div>
              <h3 className="font-black text-lg">Fly Free</h3>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Premium t-shirts with unique designs. Express yourself with our collection of stylish and comfortable apparel.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-bold">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products" className="transition hover:opacity-80" style={linkStyle}>
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/products?theme=anime" className="transition hover:opacity-80" style={linkStyle}>
                  Anime Collection
                </Link>
              </li>
              <li>
                <Link href="/products?theme=spider-man" className="transition hover:opacity-80" style={linkStyle}>
                  Spider-Man Collection
                </Link>
              </li>
              <li>
                <Link href="/designer" className="transition hover:opacity-80" style={linkStyle}>
                  Design Your Own
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="font-bold">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="transition hover:opacity-80" style={linkStyle}>
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="transition hover:opacity-80" style={linkStyle}>
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="transition hover:opacity-80" style={linkStyle}>
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/press" className="transition hover:opacity-80" style={linkStyle}>
                  Press Kit
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-bold">Support</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <Mail size={16} />
                <a href="mailto:support@flyfree.com" className="transition hover:opacity-80" style={linkStyle}>
                  support@flyfree.com
                </a>
              </li>
              <li className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <Phone size={16} />
                <a href="tel:+919876543210" className="transition hover:opacity-80" style={linkStyle}>
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                <MapPin size={16} className="mt-0.5" />
                <span>123 Fashion Street, Delhi 110001, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Policies and Social */}
        <div className="pt-8 space-y-6" style={{ borderTopColor: 'var(--border-color)', borderTopWidth: '1px' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Legal Links */}
            <div className="flex flex-wrap gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <Link href="/privacy" className="transition hover:opacity-80" style={linkStyle}>
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="/terms" className="transition hover:opacity-80" style={linkStyle}>
                Terms of Service
              </Link>
              <span>•</span>
              <Link href="/cookies" className="transition hover:opacity-80" style={linkStyle}>
                Cookie Policy
              </Link>
              <span>•</span>
              <Link href="/contact" className="transition hover:opacity-80" style={linkStyle}>
                Contact Us
              </Link>
            </div>

            {/* Social Links */}
            <div className="flex justify-md:justify-end gap-4">
              <a
                href="https://facebook.com/flyfree"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg transition"
                style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)' }}
                title="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://instagram.com/flyfree"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg transition"
                style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)' }}
                title="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://twitter.com/flyfree"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg transition"
                style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)' }}
                title="Twitter"
              >
                <Twitter size={18} />
              </a>
              <a
                href="https://linkedin.com/company/flyfree"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg transition"
                style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)' }}
                title="LinkedIn"
              >
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-6 text-center text-xs" style={{ borderTopColor: 'var(--border-color)', borderTopWidth: '1px', color: 'var(--text-tertiary)' }}>
            <p>
              © {currentYear} Fly Free. All rights reserved. Made with ❤️ for fashion lovers worldwide.
            </p>
            <p className="mt-2">
              Crafted with quality materials | Fast Delivery | Secure Checkout | 30-Day Returns
            </p>
          </div>
        </div>
      </div>

      {/* Offline Indicator */}
      <div
        className="border-t px-4 py-3 text-center text-sm hidden"
        id="offline-banner"
        style={{ backgroundColor: 'var(--bg-tertiary)', borderTopColor: 'var(--accent-primary)', color: 'var(--text-primary)' }}
      >
        ⚠️ You're currently offline. Some features may be limited.
      </div>

      <style jsx>{`
        @media (data-online: false) {
          #offline-banner {
            display: block;
          }
        }
      `}</style>
    </footer>
  );
}
