import { Context } from "../context";
import { ILogger } from "the-logger";
import { Promise } from 'the-promise';
import { MySqlDriver } from '@kubevious/easy-data-store';
export interface MigratorArgs {
    logger: ILogger;
    driver: MySqlDriver;
    executeSql: (sql: string, params?: any[]) => Promise<any>;
    context: Context;
    sql: SqlBuilder;
}
export interface MigratorInfo {
    handler?: (args: MigratorArgs) => Promise<any>;
}
export declare function Migrator(): MigratorBuilder;
export declare class MigratorBuilder {
    private _data;
    handler(value: (args: MigratorArgs) => Promise<any>): this;
    _export(): MigratorInfo;
}
export declare class SqlBuilder {
    dropTable(name: string): string;
    createTable(name: string, params: SqlBuilderCreateTableParams): string;
}
export interface SqlBuilderCreateTableParams {
    columns: SqlBuilderCreateTableColumn[];
    isPartitioned?: boolean;
}
export interface SqlBuilderCreateTableColumn {
    name: string;
    type: string;
    options?: string;
    isPrimaryKey?: boolean;
    isIndexed?: boolean;
}
//# sourceMappingURL=migration.d.ts.map