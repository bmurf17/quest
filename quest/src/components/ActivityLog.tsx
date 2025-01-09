interface Props {
  activityLog: string[];
}

export default function ActivityLog({ activityLog }: Props) {
  return (
    <div className="col-span-4 bg-gray-900 rounded p-2">
      {activityLog.map((log, i) => (
        <div key={i} className="text-sm">
          {log}
        </div>
      ))}
    </div>
  );
}
