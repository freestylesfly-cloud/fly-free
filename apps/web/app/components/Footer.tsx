'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-ink/50 border-t border-white/10 mt-20">
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-coral to-mint flex items-center justify-center">
                <span className="text-lg font-black text-white">FF</span>
              </div>
              <h3 className="font-black text-lg">Fly Free</h3>
            </div>
            <p className="text-white/60 text-sm">
              Premium t-shirts with unique designs. Express yourself with our collection of stylish and comfortable apparel.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-bold text-white">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products" className="text-white/60 hover:text-coral transition">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/products?theme=anime" className="text-white/60 hover:text-coral transition">
                  Anime Collection
                </Link>
              </li>
              <li>
                <Link href="/products?theme=marvel" className="text-white/60 hover:text-coral transition">
                  Marvel Collection
                </Link>
              </li>
              <li>
                <Link href="/designer" className="text-white/60 hover:text-coral transition">
                  Design Your Own
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="font-bold text-white">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-white/60 hover:text-coral transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-white/60 hover:text-coral transition">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-white/60 hover:text-coral transition">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/press" className="text-white/60 hover:text-coral transition">
                  Press Kit
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-bold text-white">Support</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-white/60">
                <Mail size={16} />
                <a href="mailto:support@flyfree.com" className="hover:text-coral transition">
                  support@flyfree.com
                </a>
              </li>
              <li className="flex items-center gap-2 text-white/60">
                <Phone size={16} />
                <a href="tel:+919876543210" className="hover:text-coral transition">
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-start gap-2 text-white/60">
                <MapPin size={16} className="mt-0.5" />
                <span>123 Fashion Street, Delhi 110001, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Policies and Social */}
        <div className="border-t border-white/10 pt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Legal Links */}
            <div className="flex flex-wrap gap-4 text-xs text-white/60">
              <Link href="/privacy" className="hover:text-coral transition">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-coral transition">
                Terms of Service
              </Link>
              <span>•</span>
              <Link href="/cookies" className="hover:text-coral transition">
                Cookie Policy
              </Link>
              <span>•</span>
              <Link href="/contact" className="hover:text-coral transition">
                Contact Us
              </Link>
            </div>

            {/* Social Links */}
            <div className="flex justify-md:justify-end gap-4">
              <a
                href="https://facebook.com/flyfree"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-white/10 rounded-lg transition"
                title="Facebook"
              >
                <Facebook size={18} className="text-white/60" />
              </a>
              <a
                href="https://instagram.com/flyfree"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-white/10 rounded-lg transition"
                title="Instagram"
              >
                <Instagram size={18} className="text-white/60" />
              </a>
              <a
                href="https://twitter.com/flyfree"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-white/10 rounded-lg transition"
                title="Twitter"
              >
                <Twitter size={18} className="text-white/60" />
              </a>
              <a
                href="https://linkedin.com/company/flyfree"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-white/10 rounded-lg transition"
                title="LinkedIn"
              >
                <Linkedin size={18} className="text-white/60" />
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-white/10 pt-6 text-center text-xs text-white/40">
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
        className="bg-red-500/10 border-t border-red-500/30 px-4 py-3 text-center text-sm text-red-400 hidden"
        id="offline-banner"
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
