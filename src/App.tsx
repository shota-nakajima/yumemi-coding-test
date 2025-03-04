import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

type Prefecture = { prefCode: number; prefName: string };
type ApiResponse = { result: Prefecture[] };

const API_URL = 'https://yumemi-frontend-engineer-codecheck-api.vercel.app/api/v1/prefectures';
const API_KEY = import.meta.env.VITE_API_KEY;

function App() {
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios.get<ApiResponse>(API_URL, {
      headers: { 'X-API-KEY': API_KEY }
    })
      .then(res => {
        setPrefectures(res.data.result);
        setLoading(false);
      })
      .catch(err => {
        setError(`データの取得に失敗しました: ${err.message} || 'Unknown error'`);
        setLoading(false);
        console.error(err);
      });
  }, []);

  return (
    <div>
      <h1>都道府県一覧</h1>
      {loading && <p>データ取得中...</p>}
      {error && <p>{error}</p>}
      <div>
        {prefectures.map(pref => (
          <div key={pref.prefCode} >
          <input
            type="checkbox"
            id={`prefecture-${pref.prefCode}`}
            name={`prefecture-${pref.prefCode}`}
          />
          <label htmlFor={`prefecture-${pref.prefCode}`}>
            {pref.prefName}
          </label>
          </div>

        ))}
      </div>
    </div>
  );
}

export default App
