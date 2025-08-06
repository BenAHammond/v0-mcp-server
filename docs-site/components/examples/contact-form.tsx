"use client"

import type React from "react"
import { useState } from "react"
import { Phone, Mail, MapPin, Wrench } from "lucide-react"

interface FormData {
  name: string
  phone: string
  email: string
  address: string
  serviceType: string
  urgency: string
  contactMethod: string
  message: string
}

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    address: "",
    serviceType: "",
    urgency: "",
    contactMethod: "phone",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
    // Handle form submission here
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-[600px] bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Wrench className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">AquaFix Plumbing</h1>
          </div>
          <p className="text-gray-600">Professional plumbing services you can trust</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg">
          <div className="bg-blue-600 text-white rounded-t-lg p-4">
            <h2 className="text-2xl font-semibold">Request Service</h2>
            <p className="text-blue-100 text-sm mt-1">
              Fill out the form below and we'll get back to you within 2 hours
            </p>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="John Smith"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Service Address *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      id="address"
                      type="text"
                      placeholder="123 Main St, City, State"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="service-type" className="block text-sm font-medium text-gray-700">
                    Type of Service *
                  </label>
                  <select
                    id="service-type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.serviceType}
                    onChange={(e) => handleInputChange("serviceType", e.target.value)}
                    required
                  >
                    <option value="">Select service type</option>
                    <option value="drain-cleaning">Drain Cleaning</option>
                    <option value="leak-repair">Leak Repair</option>
                    <option value="toilet-repair">Toilet Repair</option>
                    <option value="faucet-repair">Faucet Repair</option>
                    <option value="water-heater">Water Heater Service</option>
                    <option value="pipe-repair">Pipe Repair</option>
                    <option value="installation">New Installation</option>
                    <option value="emergency">Emergency Service</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="urgency" className="block text-sm font-medium text-gray-700">
                    Urgency Level *
                  </label>
                  <select
                    id="urgency"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.urgency}
                    onChange={(e) => handleInputChange("urgency", e.target.value)}
                    required
                  >
                    <option value="">Select urgency</option>
                    <option value="emergency">Emergency (Same Day)</option>
                    <option value="urgent">Urgent (Within 24 hours)</option>
                    <option value="normal">Normal (Within 2-3 days)</option>
                    <option value="flexible">Flexible (Within a week)</option>
                  </select>
                </div>
              </div>

              {/* Preferred Contact Method */}
              <div className="space-y-3">
                <span className="block text-sm font-medium text-gray-700">
                  Preferred Contact Method *
                </span>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="contactMethod"
                      value="phone"
                      checked={formData.contactMethod === "phone"}
                      onChange={(e) => handleInputChange("contactMethod", e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">Phone Call</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="contactMethod"
                      value="text"
                      checked={formData.contactMethod === "text"}
                      onChange={(e) => handleInputChange("contactMethod", e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">Text Message</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="contactMethod"
                      value="email"
                      checked={formData.contactMethod === "email"}
                      onChange={(e) => handleInputChange("contactMethod", e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">Email</span>
                  </label>
                </div>
              </div>

              {/* Additional Details */}
              <div className="space-y-2">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Describe the Problem
                </label>
                <textarea
                  id="message"
                  rows={4}
                  placeholder="Please describe the plumbing issue in detail. Include any relevant information such as when the problem started, what you've tried, and any other symptoms you've noticed."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition duration-200"
                >
                  Request Service Call
                </button>
                <p className="text-sm text-gray-500 text-center mt-2">
                  We'll contact you within 2 hours during business hours
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Contact Info Footer */}
        <div className="mt-6 text-center">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Need Immediate Help?</h3>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>Emergency: (555) 911-PIPE</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>info@aquafixplumbing.com</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Licensed • Insured • 24/7 Emergency Service Available</p>
          </div>
        </div>
      </div>
    </div>
  )
}