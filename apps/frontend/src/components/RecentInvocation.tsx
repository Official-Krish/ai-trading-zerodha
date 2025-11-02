import { ScrollArea } from "@/components/ui/scroll-area";

type Invocation = {
  id: string;
  response: string;
  createdAt: string | Date;
  model?: { name?: string };
  toolCalls?: { toolCallType: string; metadata: string; createdAt: string | Date }[];
};

type Props = {
  data: Invocation[] | null;
};

export default function RecentInvocations({ data }: Props) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground font-medium animate-pulse">Loading recent invocations...</p>
      </div>
    );
  }

  const items = data.map((inv) => ({
    id: inv.id,
    modelName: inv.model?.name ?? "Unknown Model",
    createdAt: new Date(inv.createdAt),
    response: inv.response,
    toolCalls: (inv.toolCalls ?? []).map((tc) => ({
      type: tc.toolCallType,
      createdAt: new Date(tc.createdAt as any),
      metadata: tc.metadata,
    })),
  }));

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="flex flex-col gap-4">
        {items.map((it, index) => (
          <details
            key={it.id}
            className="group rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-all duration-300 animate-slide-in shadow-sm hover:shadow-elegant"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <summary className="flex justify-between items-center cursor-pointer select-none list-none p-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-foreground group-open:text-primary transition-colors">
                  {it.modelName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {it.createdAt.toLocaleString()}
                </span>
              </div>
              <span className="text-muted-foreground text-sm group-open:rotate-90 transform transition-transform duration-300">
                ▶
              </span>
            </summary>

            <div className="px-4 pb-4 border-t border-border/50 mt-2 pt-3">
              {/* Tool Calls */}
              {it.toolCalls && it.toolCalls.length > 0 && (
                <div className="mb-3">
                  <div className="font-semibold text-foreground text-xs uppercase tracking-wide mb-2 opacity-80">
                    Tool Calls
                  </div>
                  <div className="flex flex-col gap-2">
                    {it.toolCalls.map((tc, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-border bg-card p-3 shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="text-xs font-medium text-foreground bg-primary/10 px-2 py-0.5 rounded">
                            {tc.type}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {tc.createdAt.toLocaleString()}
                          </span>
                        </div>
                        <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                          {tc.metadata}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Response */}
              <div>
                <div className="font-semibold text-foreground text-xs uppercase tracking-wide mb-2 opacity-80">
                  Response
                </div>
                <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
                  <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                    {it.response}
                  </pre>
                </div>
              </div>
            </div>
          </details>
        ))}
      </div>
    </ScrollArea>
  );
}
