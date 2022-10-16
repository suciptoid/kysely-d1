import {
  CompiledQuery,
  DatabaseConnection,
  DatabaseIntrospector,
  Dialect,
  Driver,
  Kysely,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
  QueryCompiler,
  QueryResult,
} from 'kysely';

/**
 * Config for the D1 dialect. Pass your D1 instance to this object that you bound in wrangler.toml
 */
export interface D1DialectConfig {
  database: D1Database;
}

/**
 * PlanetScale dialect that uses the [PlanetScale Serverless Driver for JavaScript][0].
 * The constructor takes an instance of {@link Config} from `@planetscale/database`.
 *
 * ```typescript
 * new PlanetScaleDialect({
 *   host: '<host>',
 *   username: '<username>',
 *   password: '<password>',
 * })
 *
 * // or with a connection URL
 *
 * new PlanetScaleDialect({
 *   url: process.env.DATABASE_URL ?? 'mysql://<username>:<password>@<host>/<database>'
 * })
 * ```
 *
 * See the [`@planetscale/database` documentation][1] for more information.
 *
 * [0]: https://github.com/planetscale/database-js
 * [1]: https://github.com/planetscale/database-js#readme
 */
export class D1Dialect implements Dialect {
  #config: D1DialectConfig;

  constructor(config: D1DialectConfig) {
    this.#config = config;
  }

  createAdapter() {
    return new SqliteAdapter();
  }

  createDriver(): Driver {
    return new D1Driver(this.#config);
  }

  createQueryCompiler(): QueryCompiler {
    return new SqliteQueryCompiler();
  }

  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return new SqliteIntrospector(db);
  }
}

class D1Driver implements Driver {
  #config: D1DialectConfig;

  constructor(config: D1DialectConfig) {
    this.#config = config;
  }

  async init(): Promise<void> {}

  async acquireConnection(): Promise<DatabaseConnection> {
    return new D1Connection(this.#config);
  }

  async beginTransaction(conn: D1Connection): Promise<void> {
    return await conn.beginTransaction();
  }

  async commitTransaction(conn: D1Connection): Promise<void> {
    return await conn.commitTransaction();
  }

  async rollbackTransaction(conn: D1Connection): Promise<void> {
    return await conn.rollbackTransaction();
  }

  async releaseConnection(_conn: D1Connection): Promise<void> {}

  async destroy(): Promise<void> {}
}

class D1Connection implements DatabaseConnection {
  #config: D1DialectConfig;
  //   #transactionClient?: D1Connection

  constructor(config: D1DialectConfig) {
    this.#config = config;
  }

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    // Transactions are not supported yet.
    // if (this.#transactionClient) return this.#transactionClient.executeQuery(compiledQuery)

    const results = await this.#config.database
      .prepare(compiledQuery.sql)
      .bind(...compiledQuery.parameters)
      .all();
    if (results.error) {
      throw new Error(results.error);
    }

    return {
      insertId: results.lastRowId !== null ? BigInt(results.lastRowId) : undefined,
      rows: (results?.results as O[]) || [],
      numUpdatedOrDeletedRows: results.changes > 0 ? BigInt(results.changes) : undefined,
    };
  }

  async beginTransaction() {
    // this.#transactionClient = this.#transactionClient ?? new PlanetScaleConnection(this.#config)
    // this.#transactionClient.#conn.execute('BEGIN')
    throw new Error('Transactions are not supported yet.');
  }

  async commitTransaction() {
    // if (!this.#transactionClient) throw new Error('No transaction to commit')
    // this.#transactionClient.#conn.execute('COMMIT')
    // this.#transactionClient = undefined
    throw new Error('Transactions are not supported yet.');
  }

  async rollbackTransaction() {
    // if (!this.#transactionClient) throw new Error('No transaction to rollback')
    // this.#transactionClient.#conn.execute('ROLLBACK')
    // this.#transactionClient = undefined
    throw new Error('Transactions are not supported yet.');
  }

  async *streamQuery<O>(_compiledQuery: CompiledQuery, _chunkSize: number): AsyncIterableIterator<QueryResult<O>> {
    throw new Error('D1 Driver does not support streaming');
  }
}