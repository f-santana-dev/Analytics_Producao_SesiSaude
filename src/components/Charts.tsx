import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, ComposedChart } from 'recharts';
import { Download } from 'lucide-react';

const formatCurrencyBR = (val: number) =>
  `R$ ${Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ExportButton = ({ onClick }: { onClick?: () => void }) => {
  if (!onClick) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      title="Exportar Excel"
      className="ml-auto text-secondary hover:text-white transition-colors"
    >
      <Download className="w-3.5 h-3.5" />
    </button>
  );
};

const StandardTooltip = ({
  active,
  payload,
  label,
  total,
  valueFormatter,
  totalFormatter,
  showTotal = true,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  total: number;
  valueFormatter: (v: number) => string;
  totalFormatter?: (v: number) => string;
  showTotal?: boolean;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const value = Number(data.value || 0);
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
    return (
      <div className="bg-card border border-border p-2 rounded shadow-xl text-white text-xs z-50">
        <p className="font-bold mb-1" style={{ color: data.payload?.fill || data.color || '#7CFFB2' }}>
          {label || data.name}
        </p>
        <div className="flex flex-col gap-0.5">
          <p>Valor: <span className="font-mono font-bold">{valueFormatter(value)}</span></p>
                    <p className="text-[10px] text-gray-400">Isso representa {percentage}% do total.</p>
          {showTotal && (
            <>
              <hr className="border-border my-1" />
              <p className="text-gray-400">Total: <span className="font-mono">{(totalFormatter || valueFormatter)(total)}</span></p>
            </>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// Tooltip with Trend for Monthly Chart
const MonthlyTooltip = ({ active, payload, label, total }: any) => {
  if (active && payload && payload.length) {
    const current = payload.find((p: any) => p.dataKey === 'value');
    const trend = current?.payload?.trend;
    return (
      <div className="bg-card border border-border p-2 rounded shadow-xl text-white z-50">
        <p className="font-bold text-xs mb-1">{label}</p>
        <p className="text-xs mb-1">
          Valor: <span className="font-mono font-bold text-white">{Number(current?.value || 0).toLocaleString('pt-BR')}</span>
        </p>
                <p className="text-[10px] text-gray-400">Total: <span className="font-mono">{Number(total || 0).toLocaleString('pt-BR')}</span></p>
        {trend !== undefined && trend !== null && (
          <div className={`flex items-center text-xs font-bold ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            <span className="mr-1">{trend >= 0 ? '▲' : '▼'}</span>
            {Math.abs(trend).toFixed(1)}% vs mês anterior
          </div>
        )}
      </div>
    );
  }
  return null;
};

// Generic Tooltip for Bar Charts (Standard)
const CustomTooltip = ({ active, payload, label, total, valueFormatter, totalFormatter }: any) => {
  return (
    <StandardTooltip
      active={active}
      payload={payload}
      label={label}
      total={total}
      valueFormatter={valueFormatter}
      totalFormatter={totalFormatter}
    />
  );
};

// --- Monthly Realized Chart ---
interface MonthlyRealizedChartProps {
  data: { name: string; value: number; valor: number; trend?: number }[];
  onExport?: () => void;
}

export function MonthlyRealizedChart({ data, onExport }: MonthlyRealizedChartProps) {
  // Pre-calculate trends if not present (simple MoM)
  const chartData = data.map((item, index) => {
      let trend = 0;
      if (index > 0) {
          const prev = data[index - 1].value;
          if (prev > 0) trend = ((item.value - prev) / prev) * 100;
      }
      return { ...item, trend: index === 0 ? null : trend };
  });
  const totalValor = chartData.reduce((acc, cur) => acc + (cur.valor || 0), 0);

  return (
    <div className="bg-card border border-border rounded-lg p-2 h-full flex flex-col shadow-xl shadow-black/20 fade-slide">
      <h3 className="text-white text-xs font-bold mb-1 flex items-center gap-2">
        <span className="w-1 h-3 bg-primary rounded-full"></span>
        REALIZADO POR MÊS
        <span className="tooltip text-[10px] text-secondary border border-border rounded-full w-4 h-4 inline-flex items-center justify-center" data-tooltip="Valores representam a quantidade de atendimentos realizados por mês.">i</span>
        <ExportButton onClick={onExport} />
      </h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 14, right: 10, left: 10, bottom: 0 }}>
                <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#a0a0a0', fontSize: 10 }} 
                    tickLine={false} 
                    axisLine={false}
                    interval={0}
                />
                <YAxis 
                    yAxisId="left"
                    hide={true}
                    tick={{ fill: '#a0a0a0', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.15)]}
                />
                {/* Secondary Y Axis for Line if needed, or just overlay */}
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const row = payload[0]?.payload as { valor?: number };
                    const valor = Number(row?.valor || 0);
                    const percentage = totalValor > 0 ? ((valor / totalValor) * 100).toFixed(1) : '0.0';
                    return (
                      <div className="bg-card border border-border p-2 rounded shadow-xl text-white text-xs z-50">
                        <p className="font-bold mb-1">{label}</p>
                        <div className="flex flex-col gap-0.5">
                          <p>Valor: <span className="font-mono font-bold">{formatCurrencyBR(valor)}</span></p>
                          <p className="text-[10px] text-gray-400">Isso representa {percentage}% do total.</p>
                        </div>
                      </div>
                    );
                  }}
                  cursor={{fill: '#2d303e', opacity: 0.4}}
                />
                
                <Bar yAxisId="left" dataKey="value" fill="#2b7fff" radius={[2, 2, 0, 0]} label={{ position: 'top', fill: '#fff', fontSize: 9 }}>
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.value > (data[index-1]?.value || 0) ? '#2b7fff' : '#2b7fff'} />
                    ))}
                </Bar>
                
                {/* Trend Line Overlay */}
                <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="value" 
                    stroke="#ffa15a" 
                    strokeWidth={2} 
                    dot={{ r: 3, fill: '#ffa15a', strokeWidth: 0 }} 
                    activeDot={{ r: 5 }}
                />
            </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- Daily Realized Chart ---
interface DailyRealizedChartProps {
  data: { day: number; volume: number; valor: number }[];
  onExport?: () => void;
}

export function DailyRealizedChart({ data, onExport }: DailyRealizedChartProps) {
  const totalValor = data.reduce((acc, cur) => acc + (cur.valor || 0), 0);
  return (
    <div className="bg-card border border-border rounded-lg p-2 h-full flex flex-col shadow-xl shadow-black/20 fade-slide">
      <h3 className="text-white text-xs font-bold mb-1 flex items-center gap-2">
        <span className="w-1 h-3 bg-primary rounded-full"></span>
        REALIZADO POR DIA
        <span className="tooltip text-[10px] text-secondary border border-border rounded-full w-4 h-4 inline-flex items-center justify-center" data-tooltip="Valores representam a quantidade de atendimentos realizados por dia.">i</span>
        <ExportButton onClick={onExport} />
      </h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 14, right: 10, left: 10, bottom: 0 }}>
            <XAxis 
                dataKey="day" 
                tick={{ fill: '#a0a0a0', fontSize: 10 }} 
                tickLine={false} 
                axisLine={false}
            />
            <YAxis 
                hide={true}
                tick={{ fill: '#a0a0a0', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
            />
            <Tooltip
              cursor={{fill: '#2d303e', opacity: 0.4}}
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const row = payload[0]?.payload as { valor?: number };
                const valor = Number(row?.valor || 0);
                const percentage = totalValor > 0 ? ((valor / totalValor) * 100).toFixed(1) : '0.0';
                return (
                  <div className="bg-card border border-border p-2 rounded shadow-xl text-white text-xs z-50">
                    <p className="font-bold mb-1">Dia {label}</p>
                    <div className="flex flex-col gap-0.5">
                      <p>Valor: <span className="font-mono font-bold">{formatCurrencyBR(valor)}</span></p>
                      <p className="text-[10px] text-gray-400">Isso representa {percentage}% do total.</p>
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="volume" fill="#2b7fff" radius={[2, 2, 0, 0]} label={{ position: 'top', fill: '#fff', fontSize: 9 }} />
            </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- Compare Monthly Chart ---
interface CompareMonthlyChartProps {
  data: { name: string; value: number; valor: number; color: string }[];
  onExport?: () => void;
}

export function CompareMonthlyChart({ data, onExport }: CompareMonthlyChartProps) {
  const totalValor = data.reduce((acc, cur) => acc + (cur.valor || 0), 0);
  return (
    <div className="bg-card border border-border rounded-lg p-2 h-full flex flex-col shadow-xl shadow-black/20 fade-slide">
      <h3 className="text-white text-xs font-bold mb-1 flex items-center gap-2">
        <span className="w-1 h-3 bg-primary rounded-full"></span>
        COMPARACAO ENTRE MESES
        <span className="tooltip text-[10px] text-secondary border border-border rounded-full w-4 h-4 inline-flex items-center justify-center" data-tooltip="Comparacao visual limitada a 2 meses.">i</span>
        <ExportButton onClick={onExport} />
      </h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 14, right: 10, left: 10, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fill: '#a0a0a0', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={0}
            />
            <YAxis hide domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.2)]} />
            <Tooltip
              cursor={{ fill: '#2d303e', opacity: 0.4 }}
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const row = payload[0]?.payload as { valor?: number };
                const valor = Number(row?.valor || 0);
                const percentage = totalValor > 0 ? ((valor / totalValor) * 100).toFixed(1) : '0.0';
                return (
                  <div className="bg-card border border-border p-2 rounded shadow-xl text-white text-xs z-50">
                    <p className="font-bold mb-1">{label}</p>
                    <div className="flex flex-col gap-0.5">
                      <p>Valor: <span className="font-mono font-bold">{formatCurrencyBR(valor)}</span></p>
                      <p className="text-[10px] text-gray-400">Isso representa {percentage}% do total.</p>
                    </div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="value"
              radius={[2, 2, 0, 0]}
              label={{ position: 'top', fill: '#fff', fontSize: 9, formatter: (v: any) => Number(v).toLocaleString('pt-BR') }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || '#2b7fff'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- Compare Daily Chart ---
interface CompareDailyChartProps {
  data: { day: number; a: number; b: number; aValor: number; bValor: number }[];
  labelA: string;
  labelB: string;
  onExport?: () => void;
}

export function CompareDailyChart({ data, labelA, labelB, onExport }: CompareDailyChartProps) {
  const totalAValor = data.reduce((acc, cur) => acc + (cur.aValor || 0), 0);
  const totalBValor = data.reduce((acc, cur) => acc + (cur.bValor || 0), 0);
  return (
    <div className="bg-card border border-border rounded-lg p-2 h-full flex flex-col shadow-xl shadow-black/20 fade-slide">
      <h3 className="text-white text-xs font-bold mb-1 flex items-center gap-2">
        <span className="w-1 h-3 bg-primary rounded-full"></span>
        REALIZADO POR DIA (COMPARACAO)
        <span className="tooltip text-[10px] text-secondary border border-border rounded-full w-4 h-4 inline-flex items-center justify-center" data-tooltip="Comparacao visual limitada a 2 meses.">i</span>
        <ExportButton onClick={onExport} />
      </h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 14, right: 10, left: 10, bottom: 0 }} barGap={0} barCategoryGap="0%">
            <XAxis
              dataKey="day"
              tick={{ fill: '#a0a0a0', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis hide domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.2)]} />
            <Tooltip
              cursor={{ fill: '#2d303e', opacity: 0.4 }}
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const row = payload[0]?.payload as { aValor?: number; bValor?: number };
                const valA = Number(row?.aValor || 0);
                const valB = Number(row?.bValor || 0);
                const pctA = totalAValor > 0 ? ((valA / totalAValor) * 100).toFixed(1) : '0.0';
                const pctB = totalBValor > 0 ? ((valB / totalBValor) * 100).toFixed(1) : '0.0';
                return (
                  <div className="bg-card border border-border p-2 rounded shadow-xl text-white text-xs z-50">
                    <p className="font-bold mb-1">Dia {label}</p>
                    <div className="flex flex-col gap-0.5">
                      <p style={{ color: '#2b7fff' }}>
                        {labelA}: <span className="font-mono font-bold">{formatCurrencyBR(valA)}</span>
                      </p>
                      <p className="text-[10px] text-gray-400">Isso representa {pctA}% do total de {labelA}.</p>
                      <p style={{ color: '#ffa15a' }}>
                        {labelB}: <span className="font-mono font-bold">{formatCurrencyBR(valB)}</span>
                      </p>
                      <p className="text-[10px] text-gray-400">Isso representa {pctB}% do total de {labelB}.</p>
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="a" fill="#2b7fff" radius={[2, 2, 0, 0]} barSize={24} label={{ position: 'top', fill: '#fff', fontSize: 8, formatter: (v: any) => Number(v).toLocaleString('pt-BR') }} />
            <Bar dataKey="b" fill="#ffa15a" radius={[2, 2, 0, 0]} barSize={24} label={{ position: 'top', fill: '#fff', fontSize: 8, formatter: (v: any) => Number(v).toLocaleString('pt-BR') }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- Category Chart (Horizontal Bar for Readability) ---
interface CategoryChartProps {
  data: { name: string; quantidade: number; valor: number }[];
  onBarClick?: (name: string) => void;
  onExport?: () => void;
}

export function CategoryChart({ data, onBarClick, onExport }: CategoryChartProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-2 h-full flex flex-col shadow-xl shadow-black/20 fade-slide">
      <h3 className="text-white text-xs font-bold mb-1 flex items-center gap-2">
        <span className="w-1 h-3 bg-primary rounded-full"></span>
        POR CATEGORIA
        <span className="tooltip tooltip-right text-[10px] text-secondary border border-border rounded-full w-4 h-4 inline-flex items-center justify-center" data-tooltip="Valores representam a quantidade de atendimentos por categoria.">i</span>
        <ExportButton onClick={onExport} />
      </h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart 
                data={data} 
                layout="vertical"
                margin={{ top: 5, right: 40, left: 0, bottom: 5 }}
            >
            <XAxis type="number" hide />
            <YAxis 
                dataKey="name" 
                type="category"
                width={90}
                tick={{ fill: '#a0a0a0', fontSize: 10 }} 
                tickLine={false}
                axisLine={{ stroke: '#2d303e' }}
                interval={0}
            />
            <Tooltip 
              cursor={{fill: '#2d303e', opacity: 0.4}} 
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const row = payload[0]?.payload as { valor?: number };
                const totalValor = data.reduce((acc, cur) => acc + (cur.valor || 0), 0);
                const valor = Number(row?.valor || 0);
                const percentage = totalValor > 0 ? ((valor / totalValor) * 100).toFixed(1) : '0.0';
                return (
                  <div className="bg-card border border-border p-2 rounded shadow-xl text-white text-xs z-50">
                    <p className="font-bold mb-1" style={{ color: '#7CFFB2' }}>{label}</p>
                    <div className="flex flex-col gap-0.5">
                      <p>Valor: <span className="font-mono font-bold">{formatCurrencyBR(valor)}</span></p>
                                <p className="text-[10px] text-gray-400">Isso representa {percentage}% do total.</p>
                    </div>
                  </div>
                );
              }}
            />
            <Bar 
              dataKey="quantidade" 
              fill="#2b7fff" 
              radius={[0, 4, 4, 0]} 
              barSize={18} 
              label={{ position: 'right', fill: '#fff', fontSize: 9, formatter: (v: any) => Number(v).toLocaleString('pt-BR') }}
              onClick={(e: any) => {
                const name = e?.payload?.name;
                if (name && onBarClick) onBarClick(name);
              }}
            />
            </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- Tipo Servi?o / Tipo Atendimento (Bar Chart) ---
interface TypeBarChartProps {
  title: string;
  data: { name: string; quantidade: number; valor: number }[];
  colors: string[];
  onBarClick?: (name: string) => void;
  tooltipText?: string;
  onExport?: () => void;
}

export function TypeBarChart({ title, data, colors, onBarClick, tooltipText, onExport }: TypeBarChartProps) {
  const totalVolume = data.reduce((acc, cur) => acc + (cur.quantidade || 0), 0);
  return (
    <div className="bg-card border border-border rounded-lg p-2 h-full flex flex-col shadow-xl shadow-black/20 fade-slide">
      <h3 className="text-white text-xs font-bold mb-1 flex items-center gap-2">
        <span className="w-1 h-3 bg-orange-500 rounded-full"></span>
        {title}
        <span className="tooltip text-[10px] text-secondary border border-border rounded-full w-4 h-4 inline-flex items-center justify-center" data-tooltip={tooltipText || "Valores representam a quantidade de atendimentos por tipo de Servi?o."}>i</span>
        <ExportButton onClick={onExport} />
      </h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              width={90}
              tick={{ fill: '#e0e0e0', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: '#2d303e', opacity: 0.4 }}
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const row = payload[0]?.payload as { valor?: number; quantidade?: number };
                const valor = Number(row?.valor || 0);
                const quantidade = Number(row?.quantidade || 0);
                const percentage = totalVolume > 0 ? ((quantidade / totalVolume) * 100).toFixed(1) : '0.0';
                return (
                  <div className="bg-card border border-border p-2 rounded shadow-xl text-white text-xs z-50">
                    <p className="font-bold mb-1" style={{ color: '#7CFFB2' }}>{label}</p>
                    <div className="flex flex-col gap-0.5">
                      <p>Valor: <span className="font-mono font-bold">{formatCurrencyBR(valor)}</span></p>
                                <p className="text-[10px] text-gray-400">Isso representa {percentage}% do total.</p>
                    </div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="quantidade"
              fill={colors[0]}
              radius={[0, 4, 4, 0]}
              barSize={20}
              label={{ position: 'right', fill: '#fff', fontSize: 9, formatter: (v: any) => Number(v).toLocaleString('pt-BR') }}
              onClick={(e: any) => {
                const name = e?.payload?.name;
                if (name && onBarClick) onBarClick(name);
              }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- Top SubAreas Chart (Horizontal Bars) ---
interface TopSubAreasChartProps {
  data: { name: string; quantidade: number; valor: number }[];
  onBarClick?: (name: string) => void;
  onExport?: () => void;
}

export function TopSubAreasChart({ data, onBarClick, onExport }: TopSubAreasChartProps) {
  const totalVolume = data.reduce((acc, cur) => acc + (cur.quantidade || 0), 0);
  return (
    <div className="bg-card border border-border rounded-lg p-2 h-full flex flex-col shadow-xl shadow-black/20 fade-slide">
      <h3 className="text-white text-xs font-bold mb-1 flex items-center gap-2">
        <span className="w-1 h-3 bg-purple-500 rounded-full"></span>
        PRODUÇÃO POR SUBÁREA
        <span className="tooltip text-[10px] text-secondary border border-border rounded-full w-4 h-4 inline-flex items-center justify-center" data-tooltip="Valores representam a quantidade de atendimentos por subárea.">i</span>
        <ExportButton onClick={onExport} />
      </h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart 
            data={data} 
            layout="vertical" 
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
            <XAxis type="number" hide />
            <YAxis 
                dataKey="name" 
                type="category" 
                width={90}
                tick={{ fill: '#e0e0e0', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
            />
            <Tooltip 
              cursor={{fill: '#2d303e', opacity: 0.4}} 
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const row = payload[0]?.payload as { valor?: number; quantidade?: number };
                const valor = Number(row?.valor || 0);
                const quantidade = Number(row?.quantidade || 0);
                const percentage = totalVolume > 0 ? ((quantidade / totalVolume) * 100).toFixed(1) : '0.0';
                return (
                  <div className="bg-card border border-border p-2 rounded shadow-xl text-white text-xs z-50">
                    <p className="font-bold mb-1" style={{ color: '#7CFFB2' }}>{label}</p>
                    <div className="flex flex-col gap-0.5">
                      <p>Valor: <span className="font-mono font-bold">{formatCurrencyBR(valor)}</span></p>
                                <p className="text-[10px] text-gray-400">Isso representa {percentage}% do total.</p>
                    </div>
                  </div>
                );
              }}
            />
            <Bar 
              dataKey="quantidade" 
              fill="#636efa" 
              radius={[0, 4, 4, 0]} 
              barSize={20} 
              label={{ position: 'right', fill: '#fff', fontSize: 9, formatter: (v: any) => Number(v).toLocaleString('pt-BR') }}
              onClick={(e: any) => {
                const name = e?.payload?.name;
                if (name && onBarClick) onBarClick(name);
              }}
            />
            </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- Backlog Aging Chart ---
interface BacklogAgingChartProps {
  data: { name: string; value: number; quantidade: number }[];
  onExport?: () => void;
}

export function BacklogAgingChart({ data, onExport }: BacklogAgingChartProps) {
  const totalQuantidade = data.reduce((acc, cur) => acc + (cur.quantidade || 0), 0);
  return (
    <div className="bg-card border border-border rounded-lg p-2 h-full flex flex-col shadow-xl shadow-black/20 fade-slide">
      <h3 className="text-white text-xs font-bold mb-1 flex items-center gap-2">
        <span className="w-1 h-3 bg-emerald-500 rounded-full"></span>
        BACKLOG POR FAIXA (VALOR)
        <span className="tooltip text-[10px] text-secondary border border-border rounded-full w-4 h-4 inline-flex items-center justify-center" data-tooltip="Valores representam o total em R$ dos confirmados ainda não realizados, por faixa de dias.">i</span>
        <ExportButton onClick={onExport} />
      </h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 10, left: 10, bottom: 0 }}>
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#a0a0a0', fontSize: 10 }} 
              tickLine={false} 
              axisLine={false}
            />
            <YAxis hide domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.25)]} />
            <Tooltip 
              cursor={{fill: '#2d303e', opacity: 0.4}} 
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const row = payload[0]?.payload as { quantidade?: number };
                const quantidade = Number(row?.quantidade || 0);
                const percentage = totalQuantidade > 0 ? ((quantidade / totalQuantidade) * 100).toFixed(1) : '0.0';
                return (
                  <div className="bg-card border border-border p-2 rounded shadow-xl text-white text-xs z-50">
                    <p className="font-bold mb-1" style={{ color: '#7CFFB2' }}>Faixa: {label}</p>
                    <div className="flex flex-col gap-0.5">
                      <p>Volume: <span className="font-mono font-bold">{quantidade.toLocaleString('pt-BR')}</span></p>
                                <p className="text-[10px] text-gray-400">Isso representa {percentage}% do total.</p>
                    </div>
                  </div>
                );
              }}
            />
            <Bar 
              dataKey="value" 
              fill="#00cc96" 
              radius={[2, 2, 0, 0]} 
              maxBarSize={34}
              label={(props: any) => {
                const { x, y, width, value } = props;
                if (value == null) return null;
                return (
                  <text x={x + (width ? width / 2 : 0)} y={y - 6} textAnchor="middle" fill="#fff" fontSize={9}>
                    {formatCurrencyBR(Number(value))}
                  </text>
                );
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- Avg Lead Time by SubArea ---
interface AvgLeadTimeSubAreaChartProps {
  data: { name: string; quantidade: number; valor: number }[];
  onExport?: () => void;
}

export function AvgLeadTimeSubAreaChart({ data, onExport }: AvgLeadTimeSubAreaChartProps) {
  const totalVolume = data.reduce((acc, cur) => acc + (cur.quantidade || 0), 0);
  return (
    <div className="bg-card border border-border rounded-lg p-2 h-full flex flex-col shadow-xl shadow-black/20 fade-slide">
      <h3 className="text-white text-xs font-bold mb-1 flex items-center gap-2">
        <span className="w-1 h-3 bg-yellow-500 rounded-full"></span>
        PRODUÇÃO POR SUBÁREA
        <span className="tooltip text-[10px] text-secondary border border-border rounded-full w-4 h-4 inline-flex items-center justify-center" data-tooltip="Valores representam a quantidade de atendimentos realizados por subárea.">i</span>
        <ExportButton onClick={onExport} />
      </h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            layout="vertical"
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={90}
              tick={{ fill: '#e0e0e0', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              cursor={{fill: '#2d303e', opacity: 0.4}} 
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const row = payload[0]?.payload as { valor?: number; quantidade?: number };
                const valor = Number(row?.valor || 0);
                const quantidade = Number(row?.quantidade || 0);
                const percentage = totalVolume > 0 ? ((quantidade / totalVolume) * 100).toFixed(1) : '0.0';
                return (
                  <div className="bg-card border border-border p-2 rounded shadow-xl text-white text-xs z-50">
                    <p className="font-bold mb-1" style={{ color: '#7CFFB2' }}>{label}</p>
                    <div className="flex flex-col gap-0.5">
                      <p>Valor: <span className="font-mono font-bold">{formatCurrencyBR(valor)}</span></p>
                                <p className="text-[10px] text-gray-400">Isso representa {percentage}% do total.</p>
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="quantidade" fill="#ffa15a" radius={[0, 4, 4, 0]} barSize={20} label={{ position: 'right', fill: '#fff', fontSize: 9, formatter: (v: any) => Number(v).toLocaleString('pt-BR') }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
