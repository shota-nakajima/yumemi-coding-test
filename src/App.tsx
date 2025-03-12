import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import './App.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type Prefecture = { prefCode: number; prefName: string };
type ApiResponse = { result: Prefecture[] };
type PopulationData = { year: number; value: number };
type PopulationComposition = { label: string; data: PopulationData[] };
type PopulationResponse = { result:  { data: PopulationComposition[] } };
type PopulationDataObject = { [key: number]: PopulationComposition[] };
type ChartData = {year: number; [prefName: string]: number | string };
type PopulationType = '総人口' | '年少人口' | '生産年齢人口' | '老年人口';

const API_END_POINT = 'https://yumemi-frontend-engineer-codecheck-api.vercel.app';
const API_KEY = import.meta.env.VITE_API_KEY;
const POPULATION_TYPES: PopulationType[] = ['総人口', '年少人口', '生産年齢人口', '老年人口']

function App() {
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrefCode, setSelectedPrefCode] = useState<number[]>([]);
  const [populationData, setPopulationData] = useState<PopulationDataObject>({});
  const [prefCodeToNameMap, setPrefCodeToNameMap] = useState<{ [key: number]: string }>({});
  const [selectedPopulationType, setSelectedPopulationType] = useState<PopulationType>('総人口');

  useEffect(() => {
    axios.get<ApiResponse>(`${API_END_POINT}/api/v1/prefectures`, {
      headers: { 'X-API-KEY': API_KEY }
    })
      .then(res => {
        const prefList = res.data.result;
        setPrefectures(prefList);

        const prefCodeToName: { [key: number]: string } = {};
        prefList.forEach(pref => {
          prefCodeToName[pref.prefCode] = pref.prefName;
        });
        setPrefCodeToNameMap(prefCodeToName);

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
      })
      .catch(err => {
        setError(`データの取得に失敗しました: ${err.message || 'Unknown error'}`);
        console.error(err);
      });
  };

  const handlePopulationTypeChange = (type: PopulationType) => {
    setSelectedPopulationType(type);
  };

  const chartData = useMemo(() => {
    if (Object.keys(populationData).length === 0) return [];

    const yearDataMap: { [year: number]: ChartData } = {};
    const currentYear = new Date().getFullYear();

    const startYear = 1970;
    const endYear = 2020;

    const populationTypeIndex = POPULATION_TYPES.indexOf(selectedPopulationType);
    if (populationTypeIndex === -1) return [];

    selectedPrefCode.forEach(prefCode => {
      if (!populationData[prefCode] || !prefCodeToNameMap[prefCode]) return;

      // 選択された人口種別のデータを使用
      const populationTypeData = populationData[prefCode][populationTypeIndex];
      if (!populationTypeData || !populationTypeData.data) return;

      const prefName = prefCodeToNameMap[prefCode];

      populationTypeData.data.forEach(item => {
        if (item.year >= startYear && item.year <= endYear && item.year % 10 === 0) {
          if (!yearDataMap[item.year]) {
            yearDataMap[item.year] = { year: item.year };
          }
          yearDataMap[item.year][prefName] = item.value;
        }
      });
    });

    return Object.values(yearDataMap).sort((a, b) => a.year - b.year);
  }, [populationData, selectedPrefCode, prefCodeToNameMap, selectedPopulationType]);

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

      <div>
        <h2>人口種別</h2>
        <div>
          {POPULATION_TYPES.map(type => (
            <div key={type}>
              <input
                type="radio"
                id={`type-${type}`}
                name="populationType"
                value={type}
                checked={selectedPopulationType === type}
                onChange={() => handlePopulationTypeChange(type)}
              />
              <label htmlFor={`type-${type}`}>{type}</label>
            </div>
          ))}
        </div>
      </div>

      <div>
        {selectedPrefCode.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="year"
                label={{ value: '年度', position: 'insideBottomRight', offset: -5 }}
                ticks={[1970, 1980, 1990, 2000, 2010, 2020]}
              />
              <YAxis
                label={{ value: '人口数', angle: -90, position: 'insideLeft' }}
                width={80}
                tickFormatter={(value) => Intl.NumberFormat('ja-JP').format(value)}
              />
              <Tooltip
                formatter={(value) => new Intl.   NumberFormat('ja-JP').format(value as number)}
                labelFormatter={(label) => `${label}年
                `}
              />
              <Legend />
              {selectedPrefCode.map((prefCode,index) => {
                const prefName = prefCodeToNameMap[prefCode];
                if (!prefName) return null;
                return (
                  <Line
                    key={prefCode}
                    type="monotone"
                    dataKey={prefName}
                    stroke={`hsl(${index * 360 / selectedPrefCode.length}, 70%, 50%)`}
                    activeDot={{ r: 8 }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p>都道府県を選択してください</p>
        )}
      </div>
    </div>
  );
}

export default App
