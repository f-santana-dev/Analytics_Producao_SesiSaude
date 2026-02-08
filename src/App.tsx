import { useEffect, useState } from 'react';
import { initDuckDB } from './lib/duckdb';
import { Sidebar } from './components/Sidebar';
import { KPICard } from './components/KPICard';
import { CategoryChart, DailyRealizedChart, TopSubAreasChart, MonthlyRealizedChart, BacklogAgingChart, AvgLeadTimeSubAreaChart, TypeBarChart } from './components/Charts';

interface DashboardData {
  totalFaturamento: number;
  totalProcedimentos: number;
  totalRealizados: number;
  valorRealizado: number;
  empresasAtendidas: number;
  pessoasAtendidas: number;
  tempoMedioRealizacaoDias: number;
  taxaRealizacaoVolume: number;
  taxaRealizacaoValor: number;
  backlogTotalValor: number;
  backlogTotalQuantidade: number;
  backlogAgingData: { name: string; value: number; quantidade: number }[];
  tempoMedioSubArea: { name: string; quantidade: number; valor: number }[];
  ticketMedio: number;
  receitaFlutuante: number;
  
  // Trends (MoM)
  trendFaturamento: number | null;
  trendProcedimentos: number | null;
  trendTotalRealizados: number | null;
  trendValorRealizado: number | null;
  trendTicketMedio: number | null;
  trendTempoMedioRealizacao: number | null;
  trendReceitaFlutuante: number | null;

  dailyRealizedData: { day: number; volume: number }[];
  monthlyRealizedData: { name: string; value: number }[];
  categoryData: { name: string; quantidade: number; valor: number }[];
  serviceTypeData: { name: string; quantidade: number; valor: number }[];
  atendTypeData: { name: string; quantidade: number; valor: number }[];
  topSubAreas: { name: string; quantidade: number; valor: number }[];
}

interface Filters {
  years: number[];
  months: string[];
  units: string[];
  subUnits: string[];
  specialties: string[];
}

function App() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    totalFaturamento: 0,
    totalProcedimentos: 0,
    totalRealizados: 0,
    valorRealizado: 0,
    empresasAtendidas: 0,
    pessoasAtendidas: 0,
    tempoMedioRealizacaoDias: 0,
    taxaRealizacaoVolume: 0,
    taxaRealizacaoValor: 0,
    backlogTotalValor: 0,
    backlogTotalQuantidade: 0,
    backlogAgingData: [],
    tempoMedioSubArea: [],
    ticketMedio: 0,
    receitaFlutuante: 0,
    
    trendFaturamento: null,
    trendProcedimentos: null,
    trendTotalRealizados: null,
    trendValorRealizado: null,
    trendTicketMedio: null,
    trendTempoMedioRealizacao: null,
    trendReceitaFlutuante: null,

    dailyRealizedData: [],
    monthlyRealizedData: [],
    categoryData: [],
    serviceTypeData: [],
    atendTypeData: [],
    topSubAreas: [],
  });
  const [filters, setFilters] = useState<Filters>({
    years: [],
    months: [],
    units: [],
    subUnits: [],
    specialties: []
  });

  // Selected Filter States
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [selectedSubUnits, setSelectedSubUnits] = useState<string[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAtendTypes, setSelectedAtendTypes] = useState<string[]>([]);
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([]);

  const formatCurrency = (val: number | undefined | null) => {
      return `R$ ${(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (val: number | undefined | null) => {
      return (val || 0).toLocaleString('pt-BR');
  };

  const formatPercent = (val: number | undefined | null) => {
      return `${(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  };

  const getHealth = () => {
    const taxa = data.taxaRealizacaoVolume || 0;
    const backlog = data.backlogTotalQuantidade || 0;
    if (taxa >= 90 && backlog < 2000) return { label: 'Saudável', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
    if (taxa >= 75 && backlog < 5000) return { label: 'Atenção', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
    return { label: 'Risco', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' };
  };

  const health = getHealth();

  const MiniKPI = ({ label, value, trend, tooltip }: { label: string; value: string; trend?: number | null; tooltip?: string }) => {
    const showAlert = trend !== undefined && trend !== null && Math.abs(trend) >= 25;
    const alertSymbol = trend !== undefined && trend !== null && trend < 0 ? '▼' : '▲';
    return (
      <div className="bg-card border border-border rounded-md px-2.5 py-2 flex items-center justify-between gap-2 tooltip shadow-lg shadow-black/20 fade-slide" data-tooltip={tooltip || ''}>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] text-secondary uppercase leading-none mb-1 truncate">{label}</span>
        <span className="text-sm font-bold text-white leading-none truncate">{value}</span>
      </div>
      {trend !== undefined && trend !== null && !isNaN(trend) && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${trend >= 0 ? "text-emerald-400 bg-emerald-400/10" : "text-rose-400 bg-rose-400/10"}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
        </span>
      )}
      {showAlert && (
        <span className={`text-[9px] font-bold px-1 rounded ${trend !== undefined && trend < 0 ? 'text-rose-400 bg-rose-400/10' : 'text-amber-400 bg-amber-400/10'}`}>
          {alertSymbol}!
        </span>
      )}
    </div>
  )};

  const sqlEscape = (val: string) => val.replace(/'/g, "''");

  const inClause = (values: string[]) => {
    if (values.length === 0) return "";
    return values.map(v => `'${sqlEscape(v)}'`).join(',');
  };

  const arraysEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    const setB = new Set(b);
    return a.every(item => setB.has(item));
  };

  const toggleSelection = (value: string, current: string[], setter: (next: string[]) => void) => {
    if (current.includes(value)) {
      setter(current.filter(v => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const db = await initDuckDB();
        const conn = await db.connect();

        // Load filter options
        const yearsRes = await conn.query("SELECT DISTINCT Ano FROM producao ORDER BY Ano DESC");
        const years = yearsRes.toArray().map(r => r.Ano);
        
        const monthsRes = await conn.query("SELECT DISTINCT MesNome, MesNum FROM producao ORDER BY MesNum");
        const months = monthsRes.toArray().map(r => r.MesNome);

        const unitsRes = await conn.query("SELECT DISTINCT Unidade FROM producao ORDER BY Unidade");
        const units = unitsRes.toArray().map(r => r.Unidade);

        const subUnitsRes = await conn.query("SELECT DISTINCT SubArea FROM producao WHERE SubArea IS NOT NULL ORDER BY SubArea");
        const subUnits = subUnitsRes.toArray().map(r => r.SubArea);
        
        const specialtiesRes = await conn.query("SELECT DISTINCT NMServico FROM producao WHERE NMServico IS NOT NULL ORDER BY NMServico");
        const specialties = specialtiesRes.toArray().map(r => r.NMServico);

        setFilters({ years, months, units, subUnits, specialties });
        
        // Default Selections
        if (years.length > 0) setSelectedYears([years[0]]); // Select first year by default
        if (months.length > 0) setSelectedMonth(months[0]); // Select first month usually January if available or based on data
        
        await conn.close();
      } catch (error) {
        console.error("Failed to load initial data", error);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const refreshDependentFilters = async () => {
      try {
        const db = await initDuckDB();
        const conn = await db.connect();

        let unitFilter = "1=1";
        if (selectedUnits.length > 0) {
          unitFilter = `Unidade IN (${inClause(selectedUnits)})`;
        }

        const subUnitsRes = await conn.query(`
          SELECT DISTINCT SubArea
          FROM producao
          WHERE SubArea IS NOT NULL AND SubArea != '' AND ${unitFilter}
          ORDER BY SubArea
        `);
        const subUnits = subUnitsRes.toArray().map(r => r.SubArea as string);

        const validSelectedSubUnits = selectedSubUnits.filter(s => subUnits.includes(s));
        if (!arraysEqual(validSelectedSubUnits, selectedSubUnits)) {
          setSelectedSubUnits(validSelectedSubUnits);
        }

        let specialtyFilter = unitFilter;
        if (validSelectedSubUnits.length > 0) {
          specialtyFilter += ` AND SubArea IN (${inClause(validSelectedSubUnits)})`;
        }

        const specialtiesRes = await conn.query(`
          SELECT DISTINCT NMServico
          FROM producao
          WHERE NMServico IS NOT NULL AND NMServico != '' AND ${specialtyFilter}
          ORDER BY NMServico
        `);
        const specialties = specialtiesRes.toArray().map(r => r.NMServico as string);

        const validSelectedSpecialties = selectedSpecialties.filter(s => specialties.includes(s));
        if (!arraysEqual(validSelectedSpecialties, selectedSpecialties)) {
          setSelectedSpecialties(validSelectedSpecialties);
        }

        setFilters(prev => ({
          ...prev,
          subUnits,
          specialties
        }));

        await conn.close();
      } catch (error) {
        console.error("Failed to refresh dependent filters", error);
      }
    };

    refreshDependentFilters();
  }, [selectedUnits, selectedSubUnits, selectedSpecialties]);

  useEffect(() => {
    const fetchData = async () => {
      // Allow fetching even if filters are not set, just to verify data connectivity
      // if (!selectedYear || !selectedMonth) return;

      setLoading(true);
      try {
        const db = await initDuckDB();
        const conn = await db.connect();

        // --- Base Query Construction ---
        // Helper to build WHERE clause based on specific date columns
        const buildBaseFilter = (yearCol: string, monthCol: string) => {
            let q = `1=1`;
            if (selectedYears.length > 0) {
                const yearsStr = selectedYears.join(',');
                q += ` AND ${yearCol} IN (${yearsStr})`;
            }
            if (selectedMonth) {
                q += ` AND ${monthCol} = '${sqlEscape(selectedMonth)}'`;
            }
            if (selectedUnits.length > 0) {
                q += ` AND Unidade IN (${inClause(selectedUnits)})`;
            }
            if (selectedSubUnits.length > 0) {
                 q += ` AND SubArea IN (${inClause(selectedSubUnits)})`;
            }
            if (selectedSpecialties.length > 0) {
                 q += ` AND NMServico IN (${inClause(selectedSpecialties)})`;
            }
            if (selectedCategories.length > 0) {
                 q += ` AND Categoria IN (${inClause(selectedCategories)})`;
            }
            if (selectedAtendTypes.length > 0) {
                 q += ` AND TipoAtendimento IN (${inClause(selectedAtendTypes)})`;
            }
            if (selectedServiceTypes.length > 0) {
                 q += ` AND TipoServico IN (${inClause(selectedServiceTypes)})`;
            }
            return q;
        };

        // --- Logic for Floating Revenue (Receita Flutuante) ---
        // We need a cutoff date based on the selection to calculate accumulated history.
        // If multiple years selected, we take the max. If no month, we take Dec.
        let cutoffYear = selectedYears.length > 0 ? Math.max(...selectedYears) : new Date().getFullYear();
        let cutoffMonthNum = 12; // Default to end of year
        
        if (selectedMonth) {
            const mIdx = filters.months.indexOf(selectedMonth);
            if (mIdx >= 0) cutoffMonthNum = filters.months.indexOf(selectedMonth) + 1; // 1-based
        } else if (selectedYears.length === 0) {
             // If no filter at all, use current date
             const now = new Date();
             cutoffYear = now.getFullYear();
             cutoffMonthNum = now.getMonth() + 1;
        }

        // Construct Date String YYYY-MM-DD for comparison
        // We use the last day of the month. 
        // Simple trick: Month + 1, Day 0 gives last day of current month
        const lastDay = new Date(cutoffYear, cutoffMonthNum, 0).getDate();
        const cutoffDateStr = `${cutoffYear}-${String(cutoffMonthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        
        // Previous Period Cutoff (for Trend)
        // Logic: If Jan, go to Dec prev year. Else Month - 1.
        let prevCutoffYear = cutoffYear;
        let prevCutoffMonthNum = cutoffMonthNum - 1;
        if (prevCutoffMonthNum === 0) {
            prevCutoffYear -= 1;
            prevCutoffMonthNum = 12;
        }
        const prevLastDay = new Date(prevCutoffYear, prevCutoffMonthNum, 0).getDate();
        const prevCutoffDateStr = `${prevCutoffYear}-${String(prevCutoffMonthNum).padStart(2, '0')}-${String(prevLastDay).padStart(2, '0')}`;

        console.log(`Floating Revenue Cutoff: Current=${cutoffDateStr}, Prev=${prevCutoffDateStr}`);

        // Floating Revenue Filter (Structural Filters Only - No Date)
        // We apply date filter inside the SUM case
        let structFilter = `1=1`;
        if (selectedUnits.length > 0) structFilter += ` AND Unidade IN (${inClause(selectedUnits)})`;
        if (selectedSubUnits.length > 0) structFilter += ` AND SubArea IN (${inClause(selectedSubUnits)})`;
        if (selectedSpecialties.length > 0) structFilter += ` AND NMServico IN (${inClause(selectedSpecialties)})`;
        if (selectedCategories.length > 0) structFilter += ` AND Categoria IN (${inClause(selectedCategories)})`;
        if (selectedAtendTypes.length > 0) structFilter += ` AND TipoAtendimento IN (${inClause(selectedAtendTypes)})`;
        if (selectedServiceTypes.length > 0) structFilter += ` AND TipoServico IN (${inClause(selectedServiceTypes)})`;

        // Query for Floating Revenue
        // Floating = (Sum Confirmed <= Cutoff) - (Sum Realized <= Cutoff)
        // Note: We use DataAtendimento for Confirmed and DataRealizado for Realized
        const floatingRes = await conn.query(`
            SELECT
                -- Current Period
                SUM(CASE WHEN DataAtendimento <= DATE '${cutoffDateStr}' THEN ValorUnitario ELSE 0 END) as sold_current,
                SUM(CASE WHEN DataRealizado IS NOT NULL AND DataRealizado <= DATE '${cutoffDateStr}' THEN ValorUnitario ELSE 0 END) as realized_current,
                
                -- Previous Period
                SUM(CASE WHEN DataAtendimento <= DATE '${prevCutoffDateStr}' THEN ValorUnitario ELSE 0 END) as sold_prev,
                SUM(CASE WHEN DataRealizado IS NOT NULL AND DataRealizado <= DATE '${prevCutoffDateStr}' THEN ValorUnitario ELSE 0 END) as realized_prev
            FROM producao
            WHERE Situacao = 'Confirmado' AND ${structFilter}
        `);
        
        const floatingRow = floatingRes.toArray()[0];
        const floatCurrent = Number(floatingRow.sold_current || 0) - Number(floatingRow.realized_current || 0);
        const floatPrev = Number(floatingRow.sold_prev || 0) - Number(floatingRow.realized_prev || 0);
        
        // Trend Calculation
        // If debt increased, it's a positive trend number (more float).
        // If debt decreased, it's negative.
        // Usually, for "Revenue", Up is Good. But for "Floating/Liability", Up means more backlog.
        // We will keep standard calculation: (Curr - Prev) / Prev
        const trendFloating = floatPrev !== 0 ? ((floatCurrent - floatPrev) / floatPrev) * 100 : null;

        // 1. Confirmed View (Based on Atendimento Date)
        const confirmedFilter = buildBaseFilter('AnoAtendimento', 'MesNomeAtendimento');

        await conn.query(`DROP VIEW IF EXISTS confirmed_view`);
        // Using TRIM(Situacao) to handle potential whitespace issues
        await conn.query(`CREATE TEMP VIEW confirmed_view AS SELECT * FROM producao WHERE ${confirmedFilter} AND TRIM(Situacao) = 'Confirmado'`);

        // 2. Realized View (Based on Realizado Date)
        const realizedFilter = buildBaseFilter('AnoRealizado', 'MesNomeRealizado');
        await conn.query(`DROP VIEW IF EXISTS realized_view`);
        // Note: Realized implies DataRealizado is NOT NULL
        await conn.query(`CREATE TEMP VIEW realized_view AS SELECT * FROM producao WHERE ${realizedFilter} AND TRIM(Situacao) = 'Confirmado' AND DataRealizado IS NOT NULL`);


        // --- KPIs ---
        
        // Confirmed KPIs (From confirmed_view)
        const kpiConfirmedRes = await conn.query(`
            SELECT 
                COALESCE(SUM(ValorUnitario), 0) as totalFaturamento,
                COUNT(*) as totalProcedimentos
            FROM confirmed_view
        `);
        const kpiConfirmedArr = kpiConfirmedRes.toArray();
        const kpiConfirmed = kpiConfirmedArr.length > 0 ? kpiConfirmedArr[0] : { totalFaturamento: 0, totalProcedimentos: 0 };

        // Realized KPIs (From realized_view)
        const kpiRealizedRes = await conn.query(`
            SELECT 
                COUNT(*) as totalRealizados,
                COALESCE(SUM(ValorUnitario), 0) as valorRealizado,
                COUNT(DISTINCT CNPJ) as empresasAtendidas,
                COUNT(DISTINCT IDPaciente) as pessoasAtendidas,
                AVG(DATEDIFF('day', DataAtendimento, DataRealizado)) as tempoMedioRealizacaoDias
            FROM realized_view
        `);
        const kpiRealizedArr = kpiRealizedRes.toArray();
        const kpiRealized = kpiRealizedArr.length > 0 ? kpiRealizedArr[0] : { totalRealizados: 0, valorRealizado: 0, empresasAtendidas: 0, pessoasAtendidas: 0, tempoMedioRealizacaoDias: 0 };

        // --- Backlog Aging (Confirmado não realizado) ---
        const backlogRes = await conn.query(`
            SELECT
                COUNT(CASE WHEN DataRealizado IS NULL AND DataAtendimento <= DATE '${cutoffDateStr}' THEN 1 END) as backlog_count,
                COUNT(CASE WHEN DataRealizado IS NULL AND DataAtendimento <= DATE '${cutoffDateStr}' AND DATEDIFF('day', DataAtendimento, DATE '${cutoffDateStr}') BETWEEN 0 AND 7 THEN 1 END) as c0_7,
                COUNT(CASE WHEN DataRealizado IS NULL AND DataAtendimento <= DATE '${cutoffDateStr}' AND DATEDIFF('day', DataAtendimento, DATE '${cutoffDateStr}') BETWEEN 8 AND 15 THEN 1 END) as c8_15,
                COUNT(CASE WHEN DataRealizado IS NULL AND DataAtendimento <= DATE '${cutoffDateStr}' AND DATEDIFF('day', DataAtendimento, DATE '${cutoffDateStr}') BETWEEN 16 AND 30 THEN 1 END) as c16_30,
                COUNT(CASE WHEN DataRealizado IS NULL AND DataAtendimento <= DATE '${cutoffDateStr}' AND DATEDIFF('day', DataAtendimento, DATE '${cutoffDateStr}') >= 31 THEN 1 END) as c31_plus,
                SUM(CASE WHEN DataRealizado IS NULL AND DataAtendimento <= DATE '${cutoffDateStr}' AND DATEDIFF('day', DataAtendimento, DATE '${cutoffDateStr}') BETWEEN 0 AND 7 THEN ValorUnitario ELSE 0 END) as b0_7,
                SUM(CASE WHEN DataRealizado IS NULL AND DataAtendimento <= DATE '${cutoffDateStr}' AND DATEDIFF('day', DataAtendimento, DATE '${cutoffDateStr}') BETWEEN 8 AND 15 THEN ValorUnitario ELSE 0 END) as b8_15,
                SUM(CASE WHEN DataRealizado IS NULL AND DataAtendimento <= DATE '${cutoffDateStr}' AND DATEDIFF('day', DataAtendimento, DATE '${cutoffDateStr}') BETWEEN 16 AND 30 THEN ValorUnitario ELSE 0 END) as b16_30,
                SUM(CASE WHEN DataRealizado IS NULL AND DataAtendimento <= DATE '${cutoffDateStr}' AND DATEDIFF('day', DataAtendimento, DATE '${cutoffDateStr}') >= 31 THEN ValorUnitario ELSE 0 END) as b31_plus
            FROM producao
            WHERE TRIM(Situacao) = 'Confirmado' AND ${structFilter}
        `);
        const backlogRow = backlogRes.toArray()[0];
        const backlogTotalQuantidade = Number(backlogRow.backlog_count || 0);
        const backlogAgingData = [
          { name: '0-7 dias', value: Number(backlogRow.b0_7 || 0), quantidade: Number(backlogRow.c0_7 || 0) },
          { name: '8-15 dias', value: Number(backlogRow.b8_15 || 0), quantidade: Number(backlogRow.c8_15 || 0) },
          { name: '16-30 dias', value: Number(backlogRow.b16_30 || 0), quantidade: Number(backlogRow.c16_30 || 0) },
          { name: '30+ dias', value: Number(backlogRow.b31_plus || 0), quantidade: Number(backlogRow.c31_plus || 0) },
        ];
        const backlogTotalValor = backlogAgingData.reduce((acc, cur) => acc + cur.value, 0);

        // --- Tempo médio até realização por Subárea (Top 5 piores) ---
        const tempoSubAreaRes = await conn.query(`
            SELECT 
                SubArea as name, 
                COUNT(*) as quantidade,
                COALESCE(SUM(ValorUnitario), 0) as valor
            FROM realized_view
            WHERE SubArea IS NOT NULL AND SubArea != ''
            GROUP BY SubArea
            ORDER BY quantidade DESC
            LIMIT 5
        `);



        // --- Comparison / Trends ---
        // We need previous period filters for BOTH contexts
        
        // Helper to determine the "Previous Period" logic
        const buildPrevFilter = (yearCol: string, monthCol: string) => {
             let q = `1=1`;
             let hasPrev = false;

             // Case: Single Year Selected
             if (selectedYears.length === 1) {
                const currentYear = selectedYears[0];
                
                // Case: Single Month Selected -> Compare with Previous Month of SAME Year (or Dec of prev year)
                if (selectedMonth) {
                    const currentMonthIdx = filters.months.indexOf(selectedMonth);
                    
                    if (currentMonthIdx > 0) {
                        // Same year, previous month
                        // Ex: Feb 2026 -> Jan 2026
                        q += ` AND ${yearCol} = ${currentYear} AND ${monthCol} = '${sqlEscape(filters.months[currentMonthIdx - 1])}'`;
                        hasPrev = true;
                    } else if (currentMonthIdx === 0) {
                        // Jan 2026 -> Dec 2025
                        q += ` AND ${yearCol} = ${currentYear - 1} AND ${monthCol} = 'Dezembro'`;
                        hasPrev = true;
                    }
                } 
                // Case: Full Year Selected (No Month) -> Compare with Previous Year
                // Ex: 2026 -> 2025
                else {
                    q += ` AND ${yearCol} = ${currentYear - 1}`;
                    hasPrev = true;
                }
             }
             
             // Apply other filters (Units, SubUnits, Specialties)
             if (hasPrev) {
                if (selectedUnits.length > 0) {
                    q += ` AND Unidade IN (${inClause(selectedUnits)})`;
                }
                if (selectedSubUnits.length > 0) {
                     q += ` AND SubArea IN (${inClause(selectedSubUnits)})`;
                }
                if (selectedSpecialties.length > 0) {
                     q += ` AND NMServico IN (${inClause(selectedSpecialties)})`;
                }
                if (selectedCategories.length > 0) {
                     q += ` AND Categoria IN (${inClause(selectedCategories)})`;
                }
                if (selectedAtendTypes.length > 0) {
                     q += ` AND TipoAtendimento IN (${inClause(selectedAtendTypes)})`;
                }
                if (selectedServiceTypes.length > 0) {
                     q += ` AND TipoServico IN (${inClause(selectedServiceTypes)})`;
                }
                return q;
             }
             return null;
        };

        let trends = {
            faturamento: null as number | null,
            procedimentos: null as number | null,
            realizados: null as number | null,
            valorRealizado: null as number | null,
            ticketMedio: null as number | null,
            tempoMedioRealizacao: null as number | null,
            receitaFlutuante: trendFloating
        };

        // Prev Confirmed
        const prevConfirmedFilter = buildPrevFilter('AnoAtendimento', 'MesNomeAtendimento');
        if (prevConfirmedFilter) {
            const prevConfRes = await conn.query(`
                SELECT COALESCE(SUM(ValorUnitario), 0) as total, COUNT(*) as count 
                FROM producao WHERE ${prevConfirmedFilter} AND TRIM(Situacao) = 'Confirmado'
            `);
            const prevConf = prevConfRes.toArray()[0];
            const calcTrend = (curr: number, prev: number) => prev === 0 ? null : ((curr - prev) / prev) * 100;
            
            trends.faturamento = calcTrend(Number(kpiConfirmed.totalFaturamento), Number(prevConf.total));
            trends.procedimentos = calcTrend(Number(kpiConfirmed.totalProcedimentos), Number(prevConf.count));
        }

        // Prev Realized
        const prevRealizedFilter = buildPrevFilter('AnoRealizado', 'MesNomeRealizado');
        if (prevRealizedFilter) {
             const prevRealRes = await conn.query(`
                SELECT COALESCE(SUM(ValorUnitario), 0) as total, COUNT(*) as count 
                , AVG(DATEDIFF('day', DataAtendimento, DataRealizado)) as avgDays
                FROM producao WHERE ${prevRealizedFilter} AND TRIM(Situacao) = 'Confirmado' AND DataRealizado IS NOT NULL
            `);
            const prevReal = prevRealRes.toArray()[0];
            const calcTrend = (curr: number, prev: number) => prev === 0 ? null : ((curr - prev) / prev) * 100;

            trends.realizados = calcTrend(Number(kpiRealized.totalRealizados), Number(prevReal.count));
            trends.valorRealizado = calcTrend(Number(kpiRealized.valorRealizado), Number(prevReal.total));
            trends.tempoMedioRealizacao = calcTrend(Number(kpiRealized.tempoMedioRealizacaoDias || 0), Number(prevReal.avgDays || 0));
            
            // Ticket Medio Trend
            const currentTicket = Number(kpiRealized.totalRealizados) > 0 
                ? Number(kpiRealized.valorRealizado) / Number(kpiRealized.totalRealizados) 
                : 0;
            const prevTicket = Number(prevReal.count) > 0 
                ? Number(prevReal.total) / Number(prevReal.count) 
                : 0;
            trends.ticketMedio = calcTrend(currentTicket, prevTicket);
        }


        // --- Charts (Using Realized View - Production Analysis) ---

        // Daily Realized Volume
        const dailyRealizedRes = await conn.query(`
            SELECT DiaRealizado as day, COUNT(*) as volume 
            FROM realized_view 
            GROUP BY DiaRealizado 
            ORDER BY DiaRealizado
        `);

        // Monthly Realized Volume
        const monthlyRealizedRes = await conn.query(`
            SELECT MesNomeRealizado as name, MesNumRealizado, COUNT(*) as value
            FROM realized_view 
            GROUP BY MesNomeRealizado, MesNumRealizado 
            ORDER BY MesNumRealizado
        `);

        // Category Data
        const categoryRes = await conn.query(`
            SELECT 
                Categoria as name, 
                COUNT(*) as quantidade,
                COALESCE(SUM(ValorUnitario), 0) as valor
            FROM realized_view
            WHERE Categoria IS NOT NULL 
            GROUP BY Categoria
            ORDER BY quantidade DESC
        `);
        
        // Service Type
        const serviceTypeRes = await conn.query(`
            SELECT 
                TipoServico as name, 
                COUNT(*) as quantidade,
                COALESCE(SUM(ValorUnitario), 0) as valor
            FROM realized_view
            WHERE TipoServico IN ('Atendimento', 'Procedimento')
            GROUP BY TipoServico
            ORDER BY name
        `);

        // Attendance Type
        const atendTypeRes = await conn.query(`
            SELECT 
                TipoAtendimento as name, 
                COUNT(*) as quantidade,
                COALESCE(SUM(ValorUnitario), 0) as valor
            FROM realized_view
            WHERE TipoAtendimento IN ('Particular', 'Por Contrato')
            GROUP BY TipoAtendimento
            ORDER BY name
        `);

        // Top SubAreas
        const topSubAreasRes = await conn.query(`
            SELECT 
                SubArea as name, 
                COUNT(*) as quantidade,
                COALESCE(SUM(ValorUnitario), 0) as valor
            FROM realized_view
            WHERE SubArea IS NOT NULL AND SubArea != ''
            GROUP BY SubArea
            ORDER BY quantidade DESC
            LIMIT 10
        `);

        setData({
          totalFaturamento: Number(kpiConfirmed.totalFaturamento || 0),
          totalProcedimentos: Number(kpiConfirmed.totalProcedimentos || 0),
          totalRealizados: Number(kpiRealized.totalRealizados || 0),
          valorRealizado: Number(kpiRealized.valorRealizado || 0),
          empresasAtendidas: Number(kpiRealized.empresasAtendidas || 0),
          pessoasAtendidas: Number(kpiRealized.pessoasAtendidas || 0),
          tempoMedioRealizacaoDias: Number(kpiRealized.tempoMedioRealizacaoDias || 0),
          taxaRealizacaoVolume: Number(kpiConfirmed.totalProcedimentos || 0) > 0 ? (Number(kpiRealized.totalRealizados || 0) / Number(kpiConfirmed.totalProcedimentos || 0)) * 100 : 0,
          taxaRealizacaoValor: Number(kpiConfirmed.totalFaturamento || 0) > 0 ? (Number(kpiRealized.valorRealizado || 0) / Number(kpiConfirmed.totalFaturamento || 0)) * 100 : 0,
          backlogTotalValor,
          backlogTotalQuantidade,
          backlogAgingData,
          tempoMedioSubArea: tempoSubAreaRes.toArray().map(r => ({ name: r.name, quantidade: Number(r.quantidade), valor: Number(r.valor) })),
          ticketMedio: Number(kpiRealized.totalRealizados || 0) > 0 ? Number(kpiRealized.valorRealizado || 0) / Number(kpiRealized.totalRealizados || 0) : 0,
          receitaFlutuante: floatCurrent,
          
          trendFaturamento: trends.faturamento,
          trendProcedimentos: trends.procedimentos,
          trendTotalRealizados: trends.realizados,
          trendValorRealizado: trends.valorRealizado,
          trendTicketMedio: trends.ticketMedio,
          trendTempoMedioRealizacao: trends.tempoMedioRealizacao,
          trendReceitaFlutuante: trends.receitaFlutuante,

          dailyRealizedData: dailyRealizedRes.toArray().map(r => ({ day: r.day, volume: Number(r.volume) })),
          monthlyRealizedData: monthlyRealizedRes.toArray().map(r => ({ name: r.name, value: Number(r.value) })),
          categoryData: categoryRes.toArray().map(r => ({ name: r.name, quantidade: Number(r.quantidade), valor: Number(r.valor) })),
          serviceTypeData: serviceTypeRes.toArray().map(r => ({ name: r.name, quantidade: Number(r.quantidade), valor: Number(r.valor) })),
          atendTypeData: atendTypeRes.toArray().map(r => ({ name: r.name, quantidade: Number(r.quantidade), valor: Number(r.valor) })),
          topSubAreas: topSubAreasRes.toArray().map(r => ({ name: r.name, quantidade: Number(r.quantidade), valor: Number(r.valor) })),
        });

        await conn.close();
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYears, selectedMonth, selectedUnits, selectedSubUnits, selectedSpecialties, selectedCategories, selectedAtendTypes, selectedServiceTypes]);

  return (
    <div className="flex bg-background h-screen w-screen overflow-hidden font-sans text-text">
      {/* Sidebar */}
      <Sidebar 
        years={filters.years}
        selectedYears={selectedYears}
        onYearsChange={setSelectedYears}
        months={filters.months}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        units={filters.units}
        selectedUnits={selectedUnits}
        onUnitsChange={setSelectedUnits}
        subUnits={filters.subUnits}
        selectedSubUnits={selectedSubUnits}
        onSubUnitsChange={setSelectedSubUnits}
        specialties={filters.specialties}
        selectedSpecialties={selectedSpecialties}
        onSpecialtiesChange={setSelectedSpecialties}
      />

      {/* Main Content */}
      <div className="flex-1 ml-56 p-4 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center mb-3 shrink-0 border-b border-border pb-2">
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">Visão Geral</h1>
            <div className="flex items-center gap-2 text-secondary text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>
                Período de {selectedMonth ? selectedMonth : "Todos os meses"} {selectedYears.length > 0 ? selectedYears.join(", ") : "Todos os anos"}
              </span>
            </div>
          </div>
          <div className="text-right">
             <div className="text-secondary text-[10px]">Dados atualizados em: {new Date().toLocaleDateString()}</div>
             <div className="flex items-center justify-end mt-1">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold border border-white/20 bg-white/10 backdrop-blur-sm shadow-sm">FS</div>
             </div>
          </div>
        </div>
        <div className="mb-3">
          <span
            className={`inline-flex items-center gap-2 text-[10px] font-bold px-2.5 py-1 rounded-full border tooltip tooltip-right ${health.color}`}
            data-tooltip="Risco baseado na relação Confirmados x Realizados. Taxa baixa indica poucas realizações."
          >
            {health.label}
          </span>
        </div>

        {/* Active Filters Badges */}
        {(selectedYears.length > 0 || selectedMonth || selectedUnits.length > 0 || selectedSubUnits.length > 0 || selectedSpecialties.length > 0 || selectedCategories.length > 0 || selectedAtendTypes.length > 0 || selectedServiceTypes.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedYears.map(y => (
              <button key={`year-${y}`} onClick={() => setSelectedYears(selectedYears.filter(v => v !== y))} className="bg-slate-600/50 text-white text-[10px] px-2 py-1 rounded-full">
                Ano: {y} ×
              </button>
            ))}
            {selectedMonth && (
              <button onClick={() => setSelectedMonth('')} className="bg-indigo-500/30 text-white text-[10px] px-2 py-1 rounded-full">
                Mês: {selectedMonth} ×
              </button>
            )}
            {selectedUnits.map(u => (
              <button key={`unit-${u}`} onClick={() => setSelectedUnits(selectedUnits.filter(v => v !== u))} className="bg-cyan-500/30 text-white text-[10px] px-2 py-1 rounded-full">
                Unidade: {u} ×
              </button>
            ))}
            {selectedSubUnits.map(s => (
              <button key={`sub-${s}`} onClick={() => setSelectedSubUnits(selectedSubUnits.filter(v => v !== s))} className="bg-purple-500/30 text-white text-[10px] px-2 py-1 rounded-full">
                Subárea: {s} ×
              </button>
            ))}
            {selectedSpecialties.map(s => (
              <button key={`spec-${s}`} onClick={() => setSelectedSpecialties(selectedSpecialties.filter(v => v !== s))} className="bg-rose-500/30 text-white text-[10px] px-2 py-1 rounded-full">
                Especialidade: {s} ×
              </button>
            ))}
            {selectedCategories.map(c => (
              <button key={`cat-${c}`} onClick={() => setSelectedCategories(selectedCategories.filter(v => v !== c))} className="bg-blue-500/30 text-white text-[10px] px-2 py-1 rounded-full">
                Categoria: {c} ×
              </button>
            ))}
            {selectedAtendTypes.map(t => (
              <button key={`atend-${t}`} onClick={() => setSelectedAtendTypes(selectedAtendTypes.filter(v => v !== t))} className="bg-amber-500/30 text-white text-[10px] px-2 py-1 rounded-full">
                Tipo Atendimento: {t} ×
              </button>
            ))}
            {selectedServiceTypes.map(t => (
              <button key={`service-${t}`} onClick={() => setSelectedServiceTypes(selectedServiceTypes.filter(v => v !== t))} className="bg-emerald-500/30 text-white text-[10px] px-2 py-1 rounded-full">
                Tipo Serviço: {t} ×
              </button>
            ))}
          </div>
        )}

        {/* Resumo */}
        <div className="mb-2 text-[11px] text-secondary uppercase tracking-wide">Resumo do período</div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 mb-4">
          <MiniKPI label="Total Confirmados" value={formatNumber(data.totalProcedimentos)} trend={data.trendProcedimentos} tooltip="Quantidade de atendimentos confirmados no período." />
          <MiniKPI label="Valor Confirmado" value={formatCurrency(data.totalFaturamento)} trend={data.trendFaturamento} tooltip="Soma do valor dos atendimentos confirmados no período." />
          <MiniKPI label="Total Realizados" value={formatNumber(data.totalRealizados)} trend={data.trendTotalRealizados} tooltip="Quantidade de atendimentos realizados no período." />
          <MiniKPI label="Valor Realizado" value={formatCurrency(data.valorRealizado)} trend={data.trendValorRealizado} tooltip="Soma do valor dos atendimentos realizados no período." />
          <MiniKPI label="Taxa Realização (Volume)" value={formatPercent(data.taxaRealizacaoVolume)} tooltip="Realizados ÷ Confirmados (quantidade)." />
          <MiniKPI label="Taxa Realização (Valor)" value={formatPercent(data.taxaRealizacaoValor)} tooltip="Valor realizado ÷ Valor confirmado." />
          <MiniKPI label="Empresas Atendidas" value={formatNumber(data.empresasAtendidas)} tooltip="Quantidade de CNPJs únicos atendidos no período." />
          <MiniKPI label="Pessoas Atendidas" value={formatNumber(data.pessoasAtendidas)} tooltip="Quantidade de pacientes únicos atendidos no período." />
          <MiniKPI label="Ticket Médio" value={formatCurrency(data.ticketMedio)} trend={data.trendTicketMedio} tooltip="Valor realizado ÷ total de realizados." />
          <MiniKPI label="A Realizar" value={formatNumber(data.backlogTotalQuantidade)} tooltip="Confirmados que ainda não foram realizados." />
        </div>

        {/* Eficiência operacional */}
        <div className="mb-2 text-[11px] text-secondary uppercase tracking-wide">Eficiência operacional</div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 mb-4">
          <MiniKPI label="Tempo Médio até Realização" value={`${Math.round(data.tempoMedioRealizacaoDias || 0).toLocaleString('pt-BR')} dias`} trend={data.trendTempoMedioRealizacao} tooltip="Média de dias entre confirmação e realização." />
          <MiniKPI label="Receita Flutuante" value={formatCurrency(data.backlogTotalValor)} tooltip="Valor dos confirmados que ainda não foram realizados." />
        </div>

        {/* Charts Container - Flex Column to fill remaining space */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">
            {/* Composição */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 flex-[0.8] min-h-0">
              <div className="lg:col-span-1 h-full min-h-0">
                <CategoryChart data={data.categoryData} onBarClick={(name) => toggleSelection(name, selectedCategories, setSelectedCategories)} />
              </div>
              <div className="lg:col-span-1 h-full min-h-0">
                <TypeBarChart
                  title="TIPO SERVIÇO"
                  data={data.serviceTypeData}
                  colors={['#00cc96', '#2b7fff']}
                  onBarClick={(name) => toggleSelection(name, selectedServiceTypes, setSelectedServiceTypes)}
                  tooltipText="Valores representam a quantidade de atendimentos por tipo de Serviço."
                />
              </div>
              <div className="lg:col-span-1 h-full min-h-0">
                <TypeBarChart
                  title="TIPO ATENDIMENTO"
                  data={data.atendTypeData}
                  colors={['#ffa15a', '#636efa']}
                  onBarClick={(name) => toggleSelection(name, selectedAtendTypes, setSelectedAtendTypes)}
                  tooltipText="Valores representam a quantidade de atendimentos por tipo de Atendimento."
                />
              </div>
              <div className="lg:col-span-1 h-full min-h-0">
                <TopSubAreasChart data={data.topSubAreas} onBarClick={(name) => toggleSelection(name, selectedSubUnits, setSelectedSubUnits)} />
              </div>
            </div>

            {/* Charts Row 2 - Backlog & Lead Time */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-[0.6] min-h-0">
                <BacklogAgingChart data={data.backlogAgingData} />
                <AvgLeadTimeSubAreaChart data={data.tempoMedioSubArea} />
            </div>

            {/* Charts Row 3 - Monthly Realized (Swapped Position) */}
            <div className="grid grid-cols-1 gap-3 flex-[0.9] min-h-0">
                <MonthlyRealizedChart data={data.monthlyRealizedData} />
            </div>

            {/* Charts Row 4 - Daily Realized (Swapped Position) */}
            <div className="grid grid-cols-1 gap-3 flex-[0.9] min-h-0">
                <DailyRealizedChart data={data.dailyRealizedData} />
            </div>
        </div>
      </div>
    </div>
  );
}

export default App;
