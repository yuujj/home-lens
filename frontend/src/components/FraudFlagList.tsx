interface Props {
  flags: string[];
}

export default function FraudFlagList({ flags }: Props) {
  if (flags.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-red-100 bg-red-50 p-4">
      <h3 className="text-sm font-semibold text-red-800">발견된 위험 항목</h3>
      <ul className="flex flex-col gap-1.5">
        {flags.map((flag) => (
          <li key={flag} className="flex items-start gap-2 text-sm text-red-700">
            <span className="mt-0.5 shrink-0">&#9888;</span>
            <span>{flag}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
