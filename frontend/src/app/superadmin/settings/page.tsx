"use client";

import { useState } from "react";
import { Settings, ShieldCheck, Mail, Database, Server, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [signupEnabled, setSignupEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // Mock save delay
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Platform settings saved successfully.");
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-brand-600" />
            Platform Settings
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Global configuration and system health for the enterprise platform.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary flex items-center gap-2"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* General Configuration */}
          <div className="card bg-white space-y-6">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-brand-500" />
              Access Control
            </h3>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">Global Maintenance Mode</p>
                <p className="text-sm text-gray-500 mt-0.5">Disable access for all non-superadmin users.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">Public Tenant Signup</p>
                <p className="text-sm text-gray-500 mt-0.5">Allow colleges to register themselves via the public landing page.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={signupEnabled}
                  onChange={(e) => setSignupEnabled(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
              </label>
            </div>
          </div>

          {/* Email Settings */}
          <div className="card bg-white space-y-6">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Mail className="w-5 h-5 text-brand-500" />
              SMTP Configuration
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">SMTP Host</label>
                <input type="text" defaultValue="smtp.sendgrid.net" className="input" />
              </div>
              <div>
                <label className="label">SMTP Port</label>
                <input type="number" defaultValue={587} className="input" />
              </div>
              <div className="col-span-2">
                <label className="label">From Email Address</label>
                <input type="email" defaultValue="noreply@placement-platform.com" className="input" />
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="space-y-6">
          <div className="card bg-gray-50 border-gray-100 space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Server className="w-5 h-5 text-gray-500" />
              System Health
            </h3>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-600">CPU Usage</span>
                  <span className="text-gray-500">12%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: "12%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-600">Memory Usage</span>
                  <span className="text-gray-500">4.2 GB / 16 GB</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: "26%" }}></div>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-200 flex items-center gap-2 text-xs font-medium text-green-600">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                All Systems Operational
              </div>
            </div>
          </div>

          <div className="card bg-gray-50 border-gray-100 space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Database className="w-5 h-5 text-gray-500" />
              Database Storage
            </h3>
            <p className="text-sm text-gray-600">PostgreSQL (Primary)</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-gray-900">4.1</span>
              <span className="text-gray-500 pb-1 font-medium">GB used</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Last backed up: 2 hours ago</p>
          </div>
        </div>
      </div>
    </div>
  );
}
