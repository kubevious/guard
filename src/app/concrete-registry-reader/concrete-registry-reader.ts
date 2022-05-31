import { ILogger } from 'the-logger';
import _ from 'the-lodash';
import { Promise } from 'the-promise';

import { Context } from '../../context'

import { ITableAccessor } from '@kubevious/easy-data-store';

import { ConcreteRegistryReaderTarget } from './types'

import { BufferUtils, UuidUtils } from '@kubevious/data-models';
import { NodeKind } from '@kubevious/entity-meta';
import { ConcreteRegistry } from '../../concrete/registry';
import { extractK8sConfigId, K8sConfig } from '@kubevious/helper-logic-processor';
import { SnapshotPropsConfig } from '@kubevious/agent-middleware';

export class ConcreteRegistryReader
{
    private _logger : ILogger;
    private _context : Context;
    private _target: ConcreteRegistryReaderTarget;

    private _dataStore : ITableAccessor;

    private _partId : number;
    private _snapshotId: Buffer;

    private _concreteRegistry : ConcreteRegistry | null = null;
    private _configHashDict : Record<string, Buffer> = {};

    constructor(logger: ILogger, context : Context, target: ConcreteRegistryReaderTarget)
    {
        this._context = context;
        this._logger = logger.sublogger('ConcreteRegistryReader');

        this._target = target;

        this._snapshotId = target.snapshotId;

        this._dataStore = context.dataStore.dataStore;

        this._partId = UuidUtils.getPartFromDatedUUIDBuf(target.snapshotId);
    }

    query() : Promise<ConcreteRegistry | null>
    {
        return this.querySnapshotRow()
            .then(snapshotRow => {
                if (!snapshotRow) {
                    return;
                }

                this._concreteRegistry = new ConcreteRegistry(this._logger, BufferUtils.toStr(this._snapshotId), new Date(snapshotRow.date!));

                this._logger.silly('[query] ', snapshotRow)

                let snapItemsOwnerId : Buffer | null = null;
                let diffItemsOwnerId : Buffer | null = null;

                if (snapshotRow.base_snapshot_id)
                {
                    snapItemsOwnerId = snapshotRow.base_snapshot_id;
                    diffItemsOwnerId = this._target.snapshotId;
                }
                else
                {
                    snapItemsOwnerId = this._target.snapshotId;
                }

                return Promise.resolve()
                    .then(() => {
                        return this._querySnapshotItems(snapItemsOwnerId!)
                            .then(items => {
                                for(const item of items)
                                {
                                    this._configHashDict[item.dn!] = item.config_hash!;
                                }
                            });    
                    })
                    .then(() => {
                        this._logger.info("configHashDict size: %s", _.keys(this._configHashDict).length);
                    })
                    .then(() => {
                        if (!diffItemsOwnerId) {
                            return;
                        }

                        return this._queryDiffItems(diffItemsOwnerId!)
                            .then(diffItems => {
                                for(const diffItem of diffItems)
                                {
                                    if (diffItem.present)
                                    {
                                        this._configHashDict[diffItem.dn!] = diffItem.config_hash!;
                                    }
                                    else
                                    {
                                        delete this._configHashDict[diffItem.dn!];
                                    }
                                }
                            })
                    })
                    .then(() => {
                        this._logger.info("configHashDict xx size: %s", _.keys(this._configHashDict).length);
                    })
                    .then(() => this._querySnapshotConfigs())
            })
            .then(() => this._concreteRegistry)
    }

    public querySnapshotRow()
    {
        return this._dataStore.table(this._context.dataStore.snapshots.Snapshots)
            .queryOne({
                part: this._partId,
                snapshot_id: this._snapshotId
            });
    }

    private _querySnapshotItems(snapshotId: Buffer)
    {
        const partId = UuidUtils.getPartFromDatedUUIDBuf(snapshotId);
        return this._dataStore.table(this._context.dataStore.snapshots.SnapItems)
            .queryMany({
                part: partId,
                snapshot_id: snapshotId,
                kind: NodeKind.resource,
                config_kind: 'props',
                name: 'config'
            }, {
                fields: {
                    fields: ['dn', 'config_hash']
                } 
            });
    }

    private _queryDiffItems(snapshotId: Buffer)
    {
        const partId = UuidUtils.getPartFromDatedUUIDBuf(snapshotId);
        return this._dataStore.table(this._context.dataStore.snapshots.DiffItems)
            .queryMany({
                part: partId,
                snapshot_id: snapshotId,
                kind: NodeKind.resource,
                config_kind: 'props',
                name: 'config'
            }, {
                fields: {
                    fields: ['dn', 'present', 'config_hash']
                } 
            });
    }

    private _querySnapshotConfigs()
    {
        return Promise.serial(_.values(this._configHashDict), x => {
            return this._querySnapshotConfig(x)
                .then(configObj => {
                    if (!configObj) {
                        return;
                    }

                    const k8sObj = configObj.config  as K8sConfig;

                    const itemId = extractK8sConfigId(k8sObj);
                    this._concreteRegistry!.add(itemId, k8sObj);
                })
        })
    }

    private _querySnapshotConfig(hash: Buffer)
    {
        return this._dataStore.table(this._context.dataStore.snapshots.SnapshotConfigs)
            .queryOne({
                part: this._partId,
                hash: hash,
            }, {
                fields: {
                    fields: ['value']
                } 
            })
            .then(row => {
                if (!row) {
                    return null;
                }
                return row.value as SnapshotPropsConfig;
            })
    }
}
