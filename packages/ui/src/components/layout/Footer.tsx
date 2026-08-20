import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-pm-burgundy text-white mt-auto">
      <div className="section-container py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-pm-md bg-pm-gold flex items-center justify-center">
                <span className="text-white font-bold text-sm">PM</span>
              </div>
              <span className="text-xl font-bold">Pete<span className="text-pm-gold">Mart</span></span>
            </div>
            <p className="text-pm-small text-white/70 leading-relaxed">Bringing Old Bangalore&apos;s Pete Markets to Your Doorstep.</p>
          </div>

          <div>
            <h4 className="font-semibold text-pm-small mb-4 text-pm-gold">Quick Links</h4>
            <ul className="space-y-2">
              {['Home', 'Markets', 'How It Works', 'About Us', 'Contact'].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-pm-small text-white/70 hover:text-pm-gold transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-pm-small mb-4 text-pm-gold">Our Markets</h4>
            <ul className="space-y-2">
              {['Chickpet', 'Balepet', 'Raja Market', 'Mamulpet', 'Cubbonpet'].map((item) => (
                <li key={item}>
                  <Link href={`/markets/${item.toLowerCase().replace(/\s+/g, '-')}`} className="text-pm-small text-white/70 hover:text-pm-gold transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-pm-small mb-4 text-pm-gold">Get the App</h4>
            <div className="space-y-2">
              <button className="w-full bg-white/10 hover:bg-white/20 text-white text-pm-small px-4 py-2.5 rounded-pm-md transition-colors text-left">📱 Download for Android</button>
              <button className="w-full bg-white/10 hover:bg-white/20 text-white text-pm-small px-4 py-2.5 rounded-pm-md transition-colors text-left">📱 Download for iOS</button>
            </div>
            <div className="flex gap-3 mt-4">
              {['Instagram', 'Facebook', 'YouTube', 'WhatsApp'].map((social) => (
                <Link key={social} href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-pm-tiny text-white/70 hover:bg-pm-gold hover:text-white transition-all">{social[0]}</Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-pm-tiny text-white/50">&copy; {new Date().getFullYear()} PeteMart. All rights reserved.</p>
          <div className="flex gap-4 text-pm-tiny text-white/50">
            <Link href="#">Privacy Policy</Link>
            <Link href="#">Terms of Service</Link>
            <Link href="#">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
