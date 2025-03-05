import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

type Prefecture = { prefCode: number; prefName: string };
type ApiResponse = { result: Prefecture[] };
type PopulationData = { year: number; value: number };
type PopulationComposition = { label: string; data: PopulationData[] };
type PopulationResponse = { result:  { data: PopulationComposition[] } };
type PopulationDataObject = { [key: number]: PopulationComposition[] };

const API_END_POINT = 'https://yumemi-frontend-engineer-codecheck-api.vercel.app';
const API_KEY = import.meta.env.VITE_API_KEY;

function App() {
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrefCode, setSelectedPrefCode] = useState<number[]>([]);
  const [populationData, setPopulationData] = useState<PopulationDataObject>({});

  useEffect(() => {
    axios.get<ApiResponse>(`${API_END_POINT}/api/v1/prefectures`, {
      headers: { 'X-API-KEY': API_KEY }
    })
      .then(res => {
        setPrefectures(res.data.result);
        setLoading(false);
      })
      .catch(err => {
        setError(`データの取得に失敗しました: ${err.message || 'Unknown error'}`);
        setLoading(false);
        console.error(err);
      });
  }, []);

  const handleCheckBoxChange = (prefCode: number, checked: boolean) => {
    if (checked) {
      setSelectedPrefCode(prev => [...prev, prefCode]);
      fetchPopulationData(prefCode);
    } else {
      setSelectedPrefCode(prev => prev.filter(code => code !== prefCode));
    }
  };

  const fetchPopulationData = (prefCode: number) => {
    if (populationData[prefCode]) return;

    axios.get<PopulationResponse>(`${API_END_POINT}/api/v1/population/composition/perYear`, {
      headers: { 'X-API-KEY': API_KEY },
      params: { prefCode }
    })
      .then(res => {
        setPopulationData({
          ...populationData,
          [prefCode]: res.data.result.data
        });
        console.log(`${prefCode}のデータを取得しました`);
        console.log(res.data.result.data);
      })
      .catch(err => {
        setError(`データの取得に失敗しました: ${err.message || 'Unknown error'}`);
        console.error(err);
      });
  };

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
            checked={selectedPrefCode.includes(pref.prefCode)}
            onChange={e => handleCheckBoxChange(pref.prefCode, e.target.checked)}
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
