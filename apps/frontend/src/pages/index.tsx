import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Activity, TrendingUp, Clock } from "lucide-react";
import PerformanceChart from "@/components/PerformanceChart";
import RecentInvocations from "@/components/RecentInvocation";
import StatsCard from "@/components/StatsCard";
import { Button } from "@/components/ui/button";

const BACKEND_URL = "http://localhost:3000";
const AUTO_REFRESH_INTERVAL = 60000;

interface PerformanceData {
  id: string,
  modelId: string,
  netPortfolio: string,
  createdAt: string,
  updatedAt: string,
  model: {
      name: string,
      invocationCount: number
  }
}

function LoadingCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-card shadow-elegant rounded-2xl p-6 border border-border ${className}`}>
      <div className="space-y-4">
        <div className="h-6 w-1/3 rounded-md bg-muted animate-pulse" />
        <div className="h-full rounded-xl bg-linear-to-br from-muted to-muted/50 animate-pulse" />
      </div>
    </div>
  );
}

export default function Index() {
  const [performanceData, setPerformanceData] = useState<PerformanceData[] | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [invocationsData, setInvocationsData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);

    try {
      const [perfRes, invocRes] = await Promise.all([
        fetch(`${BACKEND_URL}/performance`),
        fetch(`${BACKEND_URL}/invocations?limit=30`)
      ]);

      if (!perfRes.ok || !invocRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const perfData = await perfRes.json();
      const invocData = await invocRes.json();

      setPerformanceData(perfData.data);
      setInvocationsData(invocData.data);
      setLastUpdated(new Date(perfData.lastUpdated));
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Unable to load data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {

    const interval = setInterval(() => {
      fetchData();
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData();
  };

  if (error && !performanceData) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center px-6">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <Activity className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">Connection Error</h2>
          <p className="text-muted-foreground max-w-md">{error}</p>
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-black">
                Performance Dashboard
              </h1>
              <p className="text-muted-foreground mt-2 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Real-time portfolio & invocation analytics
              </p>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <LoadingCard key={i} className="h-32" />
            ))}
          </div>
        ) : performanceData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
            <StatsCard
              title="Portfolio Value"
              value={`$${performanceData[performanceData.length - 1]?.netPortfolio}`}
              icon={TrendingUp}
              trend={performanceData.length >= 2 ?
                ((Number(performanceData[performanceData.length - 1]?.netPortfolio) - Number(performanceData[performanceData.length - 2]?.netPortfolio)) / Number(performanceData[performanceData.length - 2]?.netPortfolio)) * 100
                : 0}
              gradient="from-primary to-primary-glow"
            />
            <StatsCard
              title="Total Invocations"
              value={String(performanceData[performanceData.length - 1]?.model.invocationCount)}
              icon={Clock}
              gradient="from-accent to-primary"
            />
          </div>
        ) : null}

        {/* Main Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <LoadingCard className="lg:col-span-2 h-[500px]" />
            <LoadingCard className="h-[500px]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            <div className="lg:col-span-2 bg-card shadow-elegant rounded-2xl p-6 border border-border hover:shadow-hover transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Performance Metrics</h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
                  Live
                </div>
              </div>
              <PerformanceChart data={performanceData || []} />
            </div>

            <div className="bg-card shadow-elegant rounded-2xl p-6 border border-border hover:shadow-hover transition-all duration-300">
              <h2 className="text-xl font-semibold text-foreground mb-6">Recent Invocations</h2>
              <RecentInvocations data={invocationsData || []} />
            </div>
          </div>
        )}

        {/* Footer */}
        {lastUpdated && !isLoading && (
          <div className="mt-8 text-center text-sm text-muted-foreground animate-fade-in">
            Last updated:{" "}
            <span className="font-medium text-foreground">
              {String(lastUpdated)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}