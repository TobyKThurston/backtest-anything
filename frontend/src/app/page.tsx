"use client";
import { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

export default function Home() {
  const [strategy, setStrategy] = useState("");
  const [code, setCode] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateCode = async () => {
    setLoading(true);
    const res = await fetch("http://127.0.0.1:8000/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: strategy }),
    });
    const data = await res.json();
    setCode(data.result);
    setLoading(false);
  };

  const runBacktest = async () => {
    setLoading(true);
    const res = await fetch("http://127.0.0.1:8000/backtest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setResponse(data);
    setLoading(false);
  };

  const labels = [
    "2013-04-29", "2013-04-30", "2013-05-01", "2013-05-02", "2013-05-03",
    "2013-05-04", "2013-05-05", "2013-05-06", "2013-05-07", "2013-05-08",
    "2013-05-09", "2013-05-10", "2013-05-11", "2013-05-12", "2013-05-13",
    "2013-05-14", "2013-05-15", "2013-05-16", "2013-05-17", "2013-05-18",
    "2013-05-19", "2013-05-20", "2013-05-21", "2013-05-22", "2013-05-23",
    "2013-05-24", "2013-05-25", "2013-05-26", "2013-05-27", "2013-05-28",
    "2013-05-29", "2013-05-30", "2013-05-31", "2013-06-01", "2013-06-02",
    "2013-06-03"
  ];

  const prices = [
    144.54, 139, 116.99, 105.21, 97.75, 112.5, 115.91, 112.3,
    111.5, 113.57, 112.67, 117.2, 115.24, 115, 117.98, 111.5,
    114.22, 118.76, 123.01, 123.5, 121.99, 122, 122.88, 123.88,
    126.7, 133.2, 131.98, 133.48, 129.74, 129, 132.3, 128.8,
    129, 129.3, 122.29, 122.22
  ];

  const buyIndices = response?.buy_index instanceof Array ? response.buy_index : response?.buy_index != null ? [response.buy_index] : [];
  const sellIndices = response?.sell_index instanceof Array ? response.sell_index : response?.sell_index != null ? [response.sell_index] : [];

  const datasets: any[] = [
    {
      label: "BTC Price",
      data: prices,
      borderColor: "rgba(75,192,192,1)",
      pointRadius: 2,
      tension: 0.4,
    },
    ...buyIndices.map((index: number) => ({
      label: "Buy",
      data: prices.map((_, i) => (i === index ? prices[i] : null)),
      backgroundColor: "green",
      pointRadius: 6,
      type: "line",
      borderWidth: 0,
    })),
    ...sellIndices.map((index: number) => ({
      label: "Sell",
      data: prices.map((_, i) => (i === index ? prices[i] : null)),
      backgroundColor: "red",
      pointRadius: 6,
      type: "line",
      borderWidth: 0,
    }))
  ];

  const chartData = { labels, datasets };

  return (
    <main className="p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold">Backtest Anything</h1>

      <div className="space-y-4">
        <textarea
          className="w-full p-2 border rounded"
          placeholder="Describe your strategy (e.g. Buy if BTC drops 5%)"
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
        />
        <button
          onClick={generateCode}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Generate Strategy Code
        </button>
        {code && (
          <div className="pt-4">
            <h2 className="text-lg font-semibold mb-2">Generated Code:</h2>
            <pre className="bg-black text-green-300 p-4 rounded overflow-x-auto text-sm whitespace-pre-wrap">
              {code}
            </pre>
          </div>
        )}
      </div>

      <button
        onClick={runBacktest}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        {loading ? "Running Backtest..." : "Run Backtest"}
      </button>

      {response && (
        <div className="text-sm bg-gray-100 p-4 rounded space-y-2 mt-4">
          <h2 className="text-lg font-semibold text-green-800">
            Total Profit: ${Number(response.profit).toFixed(2)}
          </h2>

            {typeof response.percent_return === "number" && (
              <p className="text-green-700">
                Return: {response.percent_return.toFixed(2)}%
              </p>
            )}          

          {Array.isArray(response.buy_date) &&
            response.buy_date.map((date: string, i: number) => (
              <p key={`buy-${i}`}>
                <strong>Buy:</strong> {date} @ ${response.buy_price?.[i]}
              </p>
            ))}

          {Array.isArray(response.sell_date) &&
            response.sell_date.map((date: string, i: number) => (
              <p key={`sell-${i}`}>
                <strong>Sell:</strong> {date} @ ${response.sell_price?.[i]}
              </p>
            ))}
        </div>
      )}


      <div className="bg-white p-4 rounded shadow mt-4">
        <Line data={chartData} />
      </div>
    </main>
  );
}








