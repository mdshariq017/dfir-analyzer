import React from 'react'
import { FaFacebookF, FaBehance, FaInstagram, FaDribbble, FaGithub, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-[#0a0a14] text-gray-300 py-16">
      <div className="w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
 
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">DF</span>
            </div>
            <span className="text-white font-semibold text-[24px]">DFIR Analyzer</span>
          </div> 
      
          <p className="text-gray-400">
            Advanced digital forensics and incident response for modern investigations.
          </p>
   
          <div className="flex gap-4 mt-4">
            <a href="#" className="hover:text-purple-400 transition"><FaGithub size={20} /></a>
            <a href="#" className="hover:text-purple-400 transition"><FaLinkedin size={20} /></a>
            <a href="#" className="hover:text-purple-400 transition"><FaDribbble size={20} /></a>
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-semibold text-white mb-2">Features</h3>
          <a href="#" className="hover:text-white transition">RAW Image Analysis</a>
          <a href="#" className="hover:text-white transition">AI Threat Detection</a>
          <a href="#" className="hover:text-white transition">Timeline Visualization</a>
          <a href="#" className="hover:text-white transition">Multi-Format Export</a>
        </div>

        {/* Resources */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-semibold text-white mb-2">Resources</h3>
          <a href="#" className="hover:text-white transition">Documentation</a>
          <a href="#" className="hover:text-white transition">API Reference</a>
          <a href="#" className="hover:text-white transition">Case Studies</a>
          <a href="#" className="hover:text-white transition">Best Practices</a>
        </div>
 
        {/* Company */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-semibold text-white mb-2">Company</h3>
          <a href="#" className="hover:text-white transition">About Us</a>
          <a href="#" className="hover:text-white transition">Contact</a>
          <a href="#" className="hover:text-white transition">Privacy Policy</a>
          <a href="#" className="hover:text-white transition">Terms of Service</a>
        </div>

      </div>

      {/* Newsletter */}
      <div className="mt-12 max-w-2xl mx-auto px-6 text-center">
        <h4 className="text-xl font-semibold text-white mb-4">Stay Updated</h4>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <input 
            type="email" 
            placeholder="Enter your email address" 
            className="px-4 py-3 rounded-lg bg-[#1f1c2e] border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white w-full sm:w-auto flex-1"
          />
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition">
            Subscribe
          </button>
        </div>
      </div>

      {/* Bottom */}
      <div className="mt-12 border-t border-gray-700 pt-6 text-center text-gray-500 text-sm">
        &copy; 2025 DFIR Analyzer. All rights reserved.
      </div>
    </footer>
  )
}

export default Footer