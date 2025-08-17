import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      {/* Newsletter Section */}
      <div className="bg-gradient-primary py-8">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-white">
              <h3 className="text-xl font-semibold mb-1">Stay Connected</h3>
              <p className="text-white/80">Get exclusive offers and updates straight to your inbox</p>
            </div>
            <form className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur text-white placeholder-white/60 border border-white/20 focus:outline-none focus:border-white/40 flex-1 md:w-64"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-white text-[#6d02a3] font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">iTelecom</h2>
                  <p className="text-xs text-gray-400">Smart Telecom Solutions</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                Your trusted partner for all telecom needs. From mobile plans to high-speed internet, 
                we deliver cutting-edge solutions for modern connectivity.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#b12df4]" />
                  <span>1-800-TELECOM</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#b12df4]" />
                  <span>support@itelecom.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#b12df4]" />
                  <span>123 Tech Street, Digital City, DC 12345</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/products" className="hover:text-white transition-colors">
                    Products
                  </Link>
                </li>
                <li>
                  <Link to="/deals" className="hover:text-white transition-colors">
                    Special Offers
                  </Link>
                </li>
                <li>
                  <Link to="/business" className="hover:text-white transition-colors">
                    Business Solutions
                  </Link>
                </li>
                <li>
                  <Link to="/careers" className="hover:text-white transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Customer Service */}
            <div>
              <h3 className="text-white font-semibold mb-4">Customer Service</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/support" className="hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/shipping" className="hover:text-white transition-colors">
                    Shipping Info
                  </Link>
                </li>
                <li>
                  <Link to="/returns" className="hover:text-white transition-colors">
                    Returns & Exchanges
                  </Link>
                </li>
                <li>
                  <Link to="/warranty" className="hover:text-white transition-colors">
                    Warranty
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/cookies" className="hover:text-white transition-colors">
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link to="/accessibility" className="hover:text-white transition-colors">
                    Accessibility
                  </Link>
                </li>
                <li>
                  <Link to="/sitemap" className="hover:text-white transition-colors">
                    Sitemap
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 py-6">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-400">
              © {currentYear} iTelecom. All rights reserved. | Powered by{' '}
              <a
                href="https://portafuturi.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#b12df4] hover:text-white transition-colors"
              >
                Porta Futuri AI
              </a>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>

            {/* Payment Methods */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>We accept:</span>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-gray-800 rounded text-xs">Visa</span>
                <span className="px-2 py-1 bg-gray-800 rounded text-xs">Mastercard</span>
                <span className="px-2 py-1 bg-gray-800 rounded text-xs">PayPal</span>
                <span className="px-2 py-1 bg-gray-800 rounded text-xs">Apple Pay</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}