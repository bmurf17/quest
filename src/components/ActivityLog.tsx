import { useEffect, useRef } from "react";

interface Props {
  activityLog: string[];
}

export default function ActivityLog({ activityLog }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activityLog]);

  return (
    <div className="col-span-4 bg-gray-900 rounded p-2 overflow-y-auto">
      {activityLog.map((log, i) => (
        <div key={i} className="text-sm">
          {log}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}