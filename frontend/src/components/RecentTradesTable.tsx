/**
 * RecentTradesTable — 유사 면적 최근 실거래 내역 테이블
 * Phase D: market_service.py extract_recent_trades() 결과 표시
 */

import type { RecentTrade } from "@/types";

interface Props {
  trades: RecentTrade[];
}

export default function RecentTradesTable({ trades }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-slate-700">
          유사 면적 최근 실거래
          <span className="ml-2 text-xs font-normal text-slate-400">
            ({trades.length}건)
          </span>
        </h3>
      </div>

      {trades.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-slate-400">
          유사 면적의 최근 거래 데이터가 없습니다.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">단지명</th>
                <th className="px-4 py-2.5 text-right font-medium">면적(m²)</th>
                <th className="px-4 py-2.5 text-right font-medium">거래가(만원)</th>
                <th className="px-4 py-2.5 text-right font-medium">층</th>
                <th className="px-4 py-2.5 text-right font-medium">거래일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trades.map((trade, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-slate-800">
                    {trade.aptNm || "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-600">
                    {trade.excluUseAr}
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium text-slate-900">
                    {trade.dealAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-600">
                    {trade.floor || "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-500">
                    {trade.dealDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
