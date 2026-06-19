"use client";

import { useState, useRef } from "react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Upload, FileText, Trash2, Star,
  ChevronRight, Loader2, CheckCircle2,
  Eye, Calendar, Tag,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

interface Resume {
  id: number;
  file_name: string;
  resume_type: string;
  is_primary: boolean;
  uploaded_at: string;
}

interface UploadResult {
  message: string;
  resume_id?: number;
  resume?: Resume;
}

const RESUME_TYPES = ["General", "SDE", "Data Science", "AI/ML"];

export default function ResumesPage() {
  const queryClient = useQueryClient();
  const [dragOver, setDragOver] = useState(false);
  const [resumeType, setResumeType] = useState("General");
  const [setPrimary, setSetPrimary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: resumes = [], isLoading: loading } = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => {
      const res = await api.get<Resume[]>("/resumes/");
      return res.data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post<UploadResult>("/resumes/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("Resume uploaded and parsed!");
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Upload failed.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/resumes/${id}`);
    },
    onSuccess: () => {
      toast.success("Deleted.");
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
    },
    onError: () => {
      toast.error("Failed to delete.");
    },
  });

  const primaryMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/resumes/${id}/primary`);
    },
    onSuccess: () => {
      toast.success("Set as primary resume.");
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
    },
    onError: () => {
      toast.error("Failed to update.");
    },
  });

  const handleUpload = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are accepted.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("resume_type", resumeType);
    formData.append("set_primary", String(setPrimary));

    uploadMutation.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this resume?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSetPrimaryResume = (id: number) => {
    primaryMutation.mutate(id);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });

  return (
    <div className="max-w-4xl space-y-6">

      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Resumes</h2>
        <p className="text-gray-500 text-sm mt-1">
          Upload your resume to get your ATS score and improvement suggestions.
        </p>
      </div>

      {/* Upload area */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Upload className="w-4 h-4 text-brand-500" /> Upload New Resume
        </h3>

        {/* Options row */}
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="label">Resume type</label>
            <select
              value={resumeType}
              onChange={(e) => setResumeType(e.target.value)}
              className="input w-40"
            >
              {RESUME_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 mt-5">
            <input
              type="checkbox"
              id="setPrimary"
              checked={setPrimary}
              onChange={(e) => setSetPrimary(e.target.checked)}
              className="w-4 h-4 accent-brand-600"
            />
            <label htmlFor="setPrimary" className="text-sm text-gray-600 cursor-pointer">
              Set as primary resume
            </label>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={clsx(
            "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all",
            dragOver
              ? "border-brand-400 bg-brand-50"
              : "border-gray-200 hover:border-brand-300 hover:bg-gray-50"
          )}
        >
          {uploadMutation.isPending ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
              <p className="text-sm text-gray-500">Uploading and parsing your resume…</p>
              <p className="text-xs text-gray-400">This takes a few seconds</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center">
                <FileText className="w-7 h-7 text-brand-500" />
              </div>
              <div>
                <p className="font-medium text-gray-700">
                  {dragOver ? "Drop your PDF here" : "Drag & drop your PDF here"}
                </p>
                <p className="text-sm text-gray-400 mt-1">or click to browse · PDF only · max 10MB</p>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Parse result */}
        {uploadMutation.isSuccess && uploadMutation.data && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-green-700 font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              {uploadMutation.data.message || "Resume uploaded and is being processed in the background."}
            </div>
            <Link
              href={`/dashboard/resumes/${uploadMutation.data.resume?.id || uploadMutation.data.resume_id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
            >
              View processing status <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Resume list */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">
          Uploaded Resumes ({resumes.length})
        </h3>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 py-8 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading…
          </div>
        ) : resumes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No resumes uploaded yet.</p>
            <p className="text-gray-300 text-xs mt-1">Upload your first resume above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {resumes.map((resume) => (
              <div key={resume.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-brand-100 hover:bg-gray-50 transition-all group">

                {/* Icon */}
                <div className={clsx(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  resume.is_primary ? "bg-brand-100 text-brand-600" : "bg-gray-100 text-gray-400"
                )}>
                  <FileText className="w-5 h-5" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate text-sm">
                      {resume.file_name}
                    </p>
                    {resume.is_primary && (
                      <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Tag className="w-3 h-3" /> {resume.resume_type}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" /> {formatDate(resume.uploaded_at)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/dashboard/resumes/${resume.id}`}
                    className="p-2 rounded-lg hover:bg-brand-50 text-gray-400 hover:text-brand-600 transition-colors"
                    title="View details">
                    <Eye className="w-4 h-4" />
                  </Link>
                  {!resume.is_primary && (
                    <button
                      onClick={() => handleSetPrimaryResume(resume.id)}
                      className="p-2 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-500 transition-colors"
                      title="Set as primary">
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(resume.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}