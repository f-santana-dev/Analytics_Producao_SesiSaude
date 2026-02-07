import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
    mvp: {
        mainModule: duckdb_wasm,
        mainWorker: mvp_worker,
    },
    eh: {
        mainModule: duckdb_eh,
        mainWorker: eh_worker,
    },
};

let dbInstance: duckdb.AsyncDuckDB | null = null;

export const initDuckDB = async () => {
    if (dbInstance) return dbInstance;

    // Hardcode bundle selection to MVP to avoid selection issues
    const bundle = MANUAL_BUNDLES.mvp;
    
    // Instantiate the asynchronus version of DuckDB-wasm
    const worker = new Worker(bundle.mainWorker);
    const logger = new duckdb.ConsoleLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule);

    // Register Parquet file
    const res = await fetch('/dados_producao.parquet');
    const arrayBuffer = await res.arrayBuffer();
    await db.registerFileBuffer('dados_producao.parquet', new Uint8Array(arrayBuffer));
    
    // Create connection and load table
    const conn = await db.connect();
    
    // Create table directly from parquet file
    // TRY/CATCH block added for debugging sql errors in console
    try {
        // Use a single CREATE TABLE statement with computed columns to avoid UPDATE issues
        await conn.query(`
            CREATE TABLE producao AS 
            SELECT 
                *,
                CAST(year(DataAtendimento) AS INTEGER) as AnoAtendimento,
                CAST(month(DataAtendimento) AS INTEGER) as MesNumAtendimento,
                CASE CAST(month(DataAtendimento) AS INTEGER)
                    WHEN 1 THEN 'Janeiro'
                    WHEN 2 THEN 'Fevereiro'
                    WHEN 3 THEN 'Março'
                    WHEN 4 THEN 'Abril'
                    WHEN 5 THEN 'Maio'
                    WHEN 6 THEN 'Junho'
                    WHEN 7 THEN 'Julho'
                    WHEN 8 THEN 'Agosto'
                    WHEN 9 THEN 'Setembro'
                    WHEN 10 THEN 'Outubro'
                    WHEN 11 THEN 'Novembro'
                    WHEN 12 THEN 'Dezembro'
                END as MesNomeAtendimento,
                
                CAST(year(DataRealizado) AS INTEGER) as AnoRealizado,
                CAST(month(DataRealizado) AS INTEGER) as MesNumRealizado,
                CAST(day(DataRealizado) AS INTEGER) as DiaRealizado,
                CASE CAST(month(DataRealizado) AS INTEGER)
                    WHEN 1 THEN 'Janeiro'
                    WHEN 2 THEN 'Fevereiro'
                    WHEN 3 THEN 'Março'
                    WHEN 4 THEN 'Abril'
                    WHEN 5 THEN 'Maio'
                    WHEN 6 THEN 'Junho'
                    WHEN 7 THEN 'Julho'
                    WHEN 8 THEN 'Agosto'
                    WHEN 9 THEN 'Setembro'
                    WHEN 10 THEN 'Outubro'
                    WHEN 11 THEN 'Novembro'
                    WHEN 12 THEN 'Dezembro'
                END as MesNomeRealizado
            FROM 'dados_producao.parquet';
        `);

        // Check if data actually loaded
        const countRes = await conn.query("SELECT COUNT(*) as c FROM producao");
        const count = Number(countRes.toArray()[0].c);
        console.log("Total rows loaded:", count);

        if (count === 0) {
            console.warn("Table 'producao' is empty! Check parquet file content.");
        }

        // Add alias columns for compatibility
        // We can do this via ALTER TABLE since the data is already there and we are just copying valid columns
        await conn.query(`
            ALTER TABLE producao ADD COLUMN Ano INTEGER;
            UPDATE producao SET Ano = AnoAtendimento;

            ALTER TABLE producao ADD COLUMN MesNum INTEGER;
            UPDATE producao SET MesNum = MesNumAtendimento;

            ALTER TABLE producao ADD COLUMN MesNome VARCHAR;
            UPDATE producao SET MesNome = MesNomeAtendimento;
        `);

    } catch (e) {
        console.error("DuckDB SQL Error:", e);
    }
    
    await conn.close();

    dbInstance = db;
    return db;
};

export const getDb = () => {
    if (!dbInstance) throw new Error("DB not initialized");
    return dbInstance;
};
