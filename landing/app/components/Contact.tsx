"use client";

import React, { useState } from 'react';
import { FiMail, FiUser, FiMessageSquare, FiSend } from 'react-icons/fi';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
  };

  return (
    <section id="contact" className="relative py-24 bg-[#0f1224] overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30">
        <div className="w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="absolute top-20 right-20 w-32 h-32 border border-purple-500/20 rounded-full animate-pulse" />
      <div className="absolute bottom-40 left-20 w-24 h-24 border border-purple-500/20 rounded-full animate-pulse delay-700" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Get In Touch
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Have questions about DFIR Analyzer? We're here to help you streamline your digital forensics workflow.
          </p>
        </div>

        {/* Contact Form Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Form */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-purple-400 rounded-2xl blur opacity-20"></div>
            <form 
              onSubmit={handleSubmit}
              className="relative bg-[#1a1d35] border border-white/10 rounded-2xl p-8 shadow-2xl"
            >
              {/* Name Field */}
              <div className="mb-6">
                <label htmlFor="name" className="flex items-center gap-2 text-gray-300 font-medium mb-2">
                  <FiUser className="text-purple-400" />
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  className="w-full px-4 py-3 bg-[#0f1224] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
              </div>

              {/* Email Field */}
              <div className="mb-6">
                <label htmlFor="email" className="flex items-center gap-2 text-gray-300 font-medium mb-2">
                  <FiMail className="text-purple-400" />
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  required
                  className="w-full px-4 py-3 bg-[#0f1224] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
              </div>

              {/* Message Field */}
              <div className="mb-6">
                <label htmlFor="message" className="flex items-center gap-2 text-gray-300 font-medium mb-2">
                  <FiMessageSquare className="text-purple-400" />
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us about your forensics needs..."
                  required
                  rows={5}
                  className="w-full px-4 py-3 bg-[#0f1224] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-purple-500/50"
              >
                <FiSend className="w-5 h-5" />
                Send Message
              </button>
            </form>
          </div>

          {/* Right Side - Visual & Info */}
          <div className="relative flex flex-col items-center justify-center">
            {/* Decorative Lock Image */}
            <div className="relative w-full max-w-md">
              <div className="absolute inset-0 bg-purple-600/20 rounded-full blur-3xl animate-pulse-slow"></div>
              <img 
                src="/lock.png" 
                alt="Security Illustration" 
                className="relative w-full h-auto drop-shadow-2xl"
              />
            </div>

            {/* Info Cards */}
            <div className="mt-12 space-y-4 w-full max-w-md">
              <div className="bg-[#1a1d35] border border-white/10 rounded-xl p-4 hover:border-purple-500/50 transition-all">
                <h4 className="text-white font-semibold mb-1">Quick Response</h4>
                <p className="text-gray-400 text-sm">We typically respond within 24 hours</p>
              </div>
              
              <div className="bg-[#1a1d35] border border-white/10 rounded-xl p-4 hover:border-purple-500/50 transition-all">
                <h4 className="text-white font-semibold mb-1">Expert Support</h4>
                <p className="text-gray-400 text-sm">Get help from digital forensics professionals</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0f1224] to-transparent z-5"></div>
    </section>
  );
};

export default Contact;