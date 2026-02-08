import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, ComposedChart } from 'recharts';

const formatCurrencyBR = (val: number) =>
  `R$ ${Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
          <p>Porcentagem: <span className="font-mono font-bold">{percentage}%</span></p>
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

// Custom Tooltip for Donut Chart
const DonutTooltip = ({ active, payload, total }: any) => {
  return (
    <StandardTooltip
      active={active}
      payload={payload}
      total={total}
      valueFormatter={(v) => Number(v).toLocaleString('pt-BR')}
      totalFormatter={(v) => Number(v).toLocaleString('pt-BR')}
      showTotal={false}
    />
  );
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
        <p className="text-xs mb-1">
          Porcentagem: <span className="font-mono font-bold">{total > 0 ? ((Number(current?.value || 0) / total) * 100).toFixed(1) : '0.0'}%</span>
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
  data: { name: string; value: number; trend?: number }[];
}

export function MonthlyRealizedChart({ data }: MonthlyRealizedChartProps) {
  // Pre-calculate trends if not present (simple MoM)
  const chartData = data.map((item, index) => {
      let trend = 0;
      if (index > 0) {
          const prev = data[index - 1].value;
          if (prev > 0) trend = ((item.value - prev) / prev) * 100;
      }
      return { ...item, trend: index === 0 ? null : trend };
  });

  return (
    <div className="bg-card border border-border rounded-lg p-2 h-full flex flex-col">
      <h3 className="text-white text-xs font-bold mb-1 flex items-center gap-2">
        <span className="w-1 h-3 bg-primary rounded-full"></span>
        REALIZADO POR MÊS (Com Tendência)
        <span className="tooltip text-[10px] text-secondary border border-border rounded-full w-4 h-4 inline-flex items-center justify-center" data-tooltip="Valores representam a quantidade de atendimentos realizados por mês.">i</span>
      </h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
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
                <Tooltip content={<MonthlyTooltip total={chartData.reduce((acc, cur) => acc + (cur.value || 0), 0)} />} cursor={{fill: '#2d303e', opacity: 0.4}} />
                
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
  data: { day: number; volume: number }[];
}

export function DailyRealizedChart({ data }: DailyRealizedChartProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-2 h-full flex flex-col">
      <h3 className="text-white text-xs font-bold mb-1 flex items-center gap-2">
        <span className="w-1 h-3 bg-primary rounded-full"></span>
        REALIZADO POR DIA
        <span className="tooltip text-[10px] text-secondary border border-border rounded-full w-4 h-4 inline-flex items-center justify-center" data-tooltip="Valores representam a quantidade de atendimentos realizados por dia.">i</span>
      </h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
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
            <Tooltip content={<CustomTooltip total={data.reduce((acc, cur) => acc + (cur.volume || 0), 0)} valueFormatter={(v: number) => Number(v).toLocaleString('pt-BR')} totalFormatter={(v: number) => Number(v).toLocaleString('pt-BR')} />} cursor={{fill: '#2d303e', opacity: 0.4}} />
            <Bar dataKey="volume" fill="#2b7fff" radius={[2, 2, 0, 0]} label={{ position: 'top', fill: '#fff', fontSize: 9 }} />
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
}

export function CategoryChart({ data, onBarClick }: CategoryChartProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-2 h-full flex flex-col">
      <h3 className="text-white text-xs font-bold mb-1 flex items-center gap-2">
        <span className="w-1 h-3 bg-primary rounded-full"></span>
        POR CATEGORIA
        <span className="tooltip tooltip-right text-[10px] text-secondary border border-border rounded-full w-4 h-4 inline-flex items-center justify-center" data-tooltip="Valores representam a quantidade de atendimentos por categoria.">i</span>
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
                      <p>Porcentagem: <span className="font-mono font-bold">{percentage}%</span></p>
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

// --- Donut Chart (Generic) ---
interface DonutChartProps {
  title: string;
  data: { name: string; quantidade: number; valor: number }[];
  colors: string[];
  onSliceClick?: (name: string) => void;
  tooltipText?: string;
}

export function DonutChart({ title, data, colors, onSliceClick, tooltipText }: DonutChartProps) {
  const totalVolume = data.reduce((acc, curr) => acc + (curr.quantidade || 0), 0);

  return (
    <div className="bg-card border border-border rounded-lg p-2 h-full flex flex-col">
      <h3 className="text-white text-xs font-bold mb-1 flex items-center gap-2">
         <span className="w-1 h-3 bg-orange-500 rounded-full"></span>
         {title}
         <span className="tooltip text-[10px] text-secondary border border-border rounded-full w-4 h-4 inline-flex items-center justify-center" data-tooltip={tooltipText || "Valores representam a quantidade de atendimentos por tipo de Serviço."}>i</span>
      </h3>
      <div className="flex-1 min-h-0 relative">
         <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={34}
                    outerRadius={52}
                    paddingAngle={2}
                    dataKey="quantidade"
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                    onClick={(e: any) => {
                      const name = e?.name;
                      if (name && onSliceClick) onSliceClick(name);
                    }}
                    label={({ cx, cy, midAngle, outerRadius, value }) => {
                      const v = Number(value || 0);
                      if (v === 0) return '';
                      const RAD = Math.PI / 180;
                      const radius = outerRadius + 12;
                      const x = (cx as number) + radius * Math.cos(-midAngle * RAD);
                      const y = (cy as number) + radius * Math.sin(-midAngle * RAD);
                      const textAnchor = x > (cx as number) ? 'start' : 'end';
                      return (
                        <text x={x} y={y} textAnchor={textAnchor} dominantBaseline="central" fill="#cfd8dc" fontSize={10}>
                          {v.toLocaleString('pt-BR')}
                        </text>
                      );
                    }}
                    labelLine={{ stroke: '#2d303e', strokeWidth: 1 }}
                >
                    {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const row = payload[0]?.payload as { name?: string; quantidade?: number; valor?: number; fill?: string };
                    const valor = Number(row?.valor || 0);
                    const quantidade = Number(row?.quantidade || 0);
                    const percentage = totalVolume > 0 ? ((quantidade / totalVolume) * 100).toFixed(1) : '0.0';
                    return (
                      <div className="bg-card border border-border p-2 rounded shadow-xl text-white text-xs z-50">
                        <p className="font-bold mb-1" style={{ color: row?.fill || '#7CFFB2' }}>{row?.name}</p>
                        <div className="flex flex-col gap-0.5">
                          <p>Valor: <span className="font-mono font-bold">{formatCurrencyBR(valor)}</span></p>
                          <p>Porcentagem: <span className="font-mono font-bold">{percentage}%</span></p>
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend 
                    verticalAlign="bottom" 
                    height={24} 
                    iconType="circle"
                    formatter={(value) => <span className="text-gray-300 ml-1 text-[10px]">{value}</span>}
                />
            </PieChart>
         </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- Top SubAreas Chart (Horizontal Bars) ---
interface TopSubAreasChartProps {
  data: { name: string; quantidade: number; valor: number }[];
  onBarClick?: (name: string) => void;
}

export function TopSubAreasChart({ data, onBarClick }: TopSubAreasChartProps) {
  const totalVolume = data.reduce((acc, cur) => acc + (cur.quantidade || 0), 0);
  return (
    <div className="bg-card border border-border rounded-lg p-2 h-full flex flex-col">
      <h3 className="text-white text-xs font-bold mb-1 flex items-center gap-2">
        <span className="w-1 h-3 bg-purple-500 rounded-full"></span>
        PRODUÇÃO POR SUBÁREA
        <span className="tooltip text-[10px] text-secondary border border-border rounded-full w-4 h-4 inline-flex items-center justify-center" data-tooltip="Valores representam a quantidade de atendimentos por subárea.">i</span>
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
                      <p>Porcentagem: <span className="font-mono font-bold">{percentage}%</span></p>
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
}

export function BacklogAgingChart({ data }: BacklogAgingChartProps) {
  const totalQuantidade = data.reduce((acc, cur) => acc + (cur.quantidade || 0), 0);
  return (
    <div className="bg-card border border-border rounded-lg p-2 h-full flex flex-col">
      <h3 className="text-white text-xs font-bold mb-1 flex items-center gap-2">
        <span className="w-1 h-3 bg-emerald-500 rounded-full"></span>
        BACKLOG POR FAIXA (VALOR)
        <span className="tooltip text-[10px] text-secondary border border-border rounded-full w-4 h-4 inline-flex items-center justify-center" data-tooltip="Valores representam o total em R$ dos confirmados ainda não realizados, por faixa de dias.">i</span>
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
                      <p>Porcentagem: <span className="font-mono font-bold">{percentage}%</span></p>
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
}

export function AvgLeadTimeSubAreaChart({ data }: AvgLeadTimeSubAreaChartProps) {
  const totalVolume = data.reduce((acc, cur) => acc + (cur.quantidade || 0), 0);
  return (
    <div className="bg-card border border-border rounded-lg p-2 h-full flex flex-col">
      <h3 className="text-white text-xs font-bold mb-1 flex items-center gap-2">
        <span className="w-1 h-3 bg-yellow-500 rounded-full"></span>
        PRODUÇÃO POR SUBÁREA (TOP 5)
        <span className="tooltip text-[10px] text-secondary border border-border rounded-full w-4 h-4 inline-flex items-center justify-center" data-tooltip="Valores representam a quantidade de atendimentos realizados por subárea.">i</span>
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
                      <p>Porcentagem: <span className="font-mono font-bold">{percentage}%</span></p>
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
