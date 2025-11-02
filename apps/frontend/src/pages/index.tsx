import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Activity, TrendingUp, Clock } from "lucide-react";
import PerformanceChart from "@/components/PerformanceChart";
import RecentInvocations from "@/components/RecentInvocation";
import StatsCard from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const BACKEND_URL = "http://localhost:3000";
const AUTO_REFRESH_INTERVAL = 30000; 

interface PerformanceData {
  portfolioValue: number;
  totalReturn: number;
  totalInvocations: number;
  successRate: number;
  chartData: any[];
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
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [invocationsData, setInvocationsData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
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
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const handleRefresh = () => {
    fetchData(true);
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
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Performance Dashboard
              </h1>
              <p className="text-muted-foreground mt-2 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Real-time portfolio & invocation analytics
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg border border-border shadow-elegant">
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
                <Label htmlFor="auto-refresh" className="text-sm cursor-pointer">
                  Auto-refresh
                </Label>
              </div>
              
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                size="icon"
                className="shadow-elegant"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
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
              value={`$${performanceData.portfolioValue.toLocaleString()}`}
              icon={TrendingUp}
              trend={performanceData.totalReturn}
              gradient="from-primary to-primary-glow"
            />
            <StatsCard
              title="Total Return"
              value={`${performanceData.totalReturn >= 0 ? '+' : ''}${performanceData.totalReturn.toFixed(2)}%`}
              icon={Activity}
              trend={performanceData.totalReturn}
              gradient="from-secondary to-primary"
            />
            <StatsCard
              title="Total Invocations"
              value={performanceData.totalInvocations.toLocaleString()}
              icon={Clock}
              gradient="from-accent to-primary"
            />
            <StatsCard
              title="Success Rate"
              value={`${performanceData.successRate.toFixed(1)}%`}
              icon={Activity}
              gradient="from-success to-secondary"
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
              <PerformanceChart data={performanceData?.chartData || []} />
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
              {lastUpdated.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}