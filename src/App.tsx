import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
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
    <div className="bg-gray-50">
      <header className="bg-gray-800 text-white shadow-md">
        <div className="container mx-auto p-4">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-center md:text-left">
            都道府県別人口推移
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {loading && (
          <div className="flex justify-center items-center py-12">
            <p className="text-lg text-gray-600">データ取得中...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-1/3">
              <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
                  都道府県一覧
                </h2>
                <div className="flex flex-wrap -mx-1">
                  {prefectures.map(pref => (
                    <div key={pref.prefCode} className="w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/2 xl:w-1/3 px-1 mb-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`prefecture-${pref.prefCode}`}
                          name={`prefecture-${pref.prefCode}`}
                          checked={selectedPrefCode.includes(pref.prefCode)}
                          onChange={e => handleCheckBoxChange(pref.prefCode, e.target.checked)}
                          className="mr-2 h-4 w-4 text-blue-600"
                        />
                        <label
                          htmlFor={`prefecture-${pref.prefCode}`}
                          className="text-sm md:text-base truncate"
                        >
                          {pref.prefName}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
                  人口種別
                </h2>
                <div className="flex flex-wrap gap-4">
                  {POPULATION_TYPES.map(type => (
                    <div key={type} className="flex items-center">
                      <input
                        type="radio"
                        id={`type-${type}`}
                        name="populationType"
                        value={type}
                        checked={selectedPopulationType === type}
                        onChange={() => handlePopulationTypeChange(type)}
                        className="mr-2 h-4 w-4 text-blue-600"
                      />
                      <label
                        htmlFor={`type-${type}`}
                        className="text-sm md:text-base"
                      >
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full lg:w-2/3">
              <div className="bg-white p-4 rounded-lg shadow-sm h-full">
                <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
                  {selectedPopulationType}の推移グラフ
                </h2>

                {selectedPrefCode.length > 0 ? (
                  <div className="h-96 md:h-[450px] lg:h-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
                      >
                        <XAxis
                          dataKey="year"
                          label={{ value: '年度', position: 'insideBottomRight', offset: -5 }}
                          ticks={[1970, 1980, 1990, 2000, 2010, 2020]}
                          tick={{ fontSize: 15 }}
                          tickMargin={2}
                        />
                        <YAxis
                          label={{ value: '人口数', angle: -90, position: 'insideLeft' }}
                          width={60}
                          tickFormatter={(value) => {
                            if (value >= 1000) {
                              return (value / 1000000).toFixed(1) + 'M';
                            }
                            return value;
                          }}
                          tick={{ fontSize: 15 }}
                        />
                        <Tooltip
                          formatter={(value) => new Intl.NumberFormat('ja-JP').format(value as number)}
                          labelFormatter={(label) => `${label}年`}
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
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-80 bg-gray-50 rounded-md border border-gray-200">
                    <p className="text-gray-500">都道府県を選択してください</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
