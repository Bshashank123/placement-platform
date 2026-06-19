"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Trophy, TrendingUp, TrendingDown, Minus,
         Users, BarChart2, Target, Loader2, ArrowUp } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

interface MyRanking {
  rank: number;
  total: number;
  department: string;
  ats_score: number;
  percentile: string;
  above_avg: number;
  dept_avg: number;
  students_above_you: number;
  points_to_next_rank: number | null;
  top_20_threshold: number | null;
}

interface NoRanking {
  message: string;
}

export default function RankingPage() {
  const [data, setData]       = useState<MyRanking | null>(null);
  const [loading, setLoading] = useState(true);
  const [noRank, setNoRank]   = useState(false);

  useEffect(() => {
    api.get<MyRanking | NoRanking>("/students/ranking")
      .then((r) => {
        if ("message" in r.data) {
          setNoRank(true);
        } else {
          setData(r.data as MyRanking);
        }
      })
      .catch(() => setNoRank(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (noRank || !data) {
    return (
      <div className="max-w-2xl">
        <div className="card text-center py-16">
          <Trophy className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700">No ranking yet</h2>
          <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto">
            Upload a resume and get your ATS score to appear in the department ranking.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <Link href="/dashboard/resumes"
              className="btn-primary px-5 py-2.5 text-sm">
              Upload Resume
            </Link>
            <Link href="/dashboard/ats"
              className="px-5 py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              Get ATS Score
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const rankPct = Math.round(((data.total - data.rank) / data.total) * 100);
  const isAboveAvg = data.above_avg > 0;
  const top20Score = data.top_20_threshold;
  const isTop20 = data.rank <= Math.ceil(data.total * 0.2);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Department Ranking</h2>
        <p className="text-gray-500 text-sm mt-1">
          {data.department} · {data.total} students
        </p>
      </div>

      {/* Rank hero */}
      <div className="card bg-gradient-to-br from-amber-500 to-orange-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-amber-200 text-sm font-medium">Your Rank</p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-7xl font-black">#{data.rank}</span>
              <span className="text-2xl text-amber-300 mb-2">/ {data.total}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-white/20 text-white text-sm font-semibold px-3 py-1 rounded-full">
                {data.percentile}
              </span>
              <span className="text-amber-200 text-sm">of your department</span>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
              <Trophy className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{data.ats_score}</p>
          <p className="text-xs text-gray-500 mt-1">Your ATS Score</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{data.dept_avg}</p>
          <p className="text-xs text-gray-500 mt-1">Dept. Average</p>
        </div>
        <div className="card text-center">
          <div className="flex items-center justify-center gap-1">
            <p className={clsx(
              "text-3xl font-bold",
              isAboveAvg ? "text-green-600" : "text-red-500"
            )}>
              {isAboveAvg ? "+" : ""}{data.above_avg}
            </p>
            {isAboveAvg
              ? <TrendingUp className="w-5 h-5 text-green-500" />
              : data.above_avg < 0
              ? <TrendingDown className="w-5 h-5 text-red-400" />
              : <Minus className="w-5 h-5 text-gray-400" />
            }
          </div>
          <p className="text-xs text-gray-500 mt-1">vs. Dept. Avg</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{data.students_above_you}</p>
          <p className="text-xs text-gray-500 mt-1">Students Ahead</p>
        </div>
      </div>

      {/* Progress to next rank */}
      {data.points_to_next_rank !== null && data.points_to_next_rank > 0 && (
        <div className="card border-brand-100 bg-brand-50 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
            <ArrowUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-brand-900">
              {data.points_to_next_rank} more points to reach Rank #{data.rank - 1}
            </p>
            <p className="text-sm text-brand-700 mt-0.5">
              Improve your resume and re-score it to climb the ranking.
            </p>
            <Link href="/dashboard/ats"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline mt-2">
              <BarChart2 className="w-3.5 h-3.5" /> Go to ATS Analysis
            </Link>
          </div>
        </div>
      )}

      {/* Top 20 status */}
      {top20Score !== null && (
        <div className={clsx(
          "card flex items-start gap-4",
          isTop20
            ? "bg-green-50 border-green-100"
            : "bg-gray-50 border-gray-100"
        )}>
          <div className={clsx(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            isTop20 ? "bg-green-100" : "bg-gray-200"
          )}>
            <Target className={clsx("w-5 h-5", isTop20 ? "text-green-600" : "text-gray-500")} />
          </div>
          <div>
            {isTop20 ? (
              <>
                <p className="font-semibold text-green-800">You are in the Top 20% 🎉</p>
                <p className="text-sm text-green-700 mt-0.5">
                  Keep improving to maintain or advance your position.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-gray-800">
                  Top 20% threshold: {top20Score} points
                </p>
                <p className="text-sm text-gray-600 mt-0.5">
                  You need {Math.max(0, Math.round(top20Score - data.ats_score + 0.1))} more ATS
                  points to enter the top 20% of your department.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Privacy note */}
      <div className="flex items-start gap-2 text-xs text-gray-400">
        <Users className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          Your exact score is never shown to other students. Rankings are private —
          you only see your own position and department-level averages.
        </p>
      </div>
    </div>
  );
}