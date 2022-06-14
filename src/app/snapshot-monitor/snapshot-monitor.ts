import _ from 'the-lodash';
import { ILogger } from "the-logger";
import { BlockingResolver } from 'the-promise';
import { BufferUtils } from '@kubevious/data-models';

import { Context } from "../../context";

import { ConcreteRegistryReader } from '../concrete-registry-reader/concrete-registry-reader';
import { ConcreteRegistry } from '../../concrete/registry';

export class SnapshotMonitor
{
    private _logger : ILogger;
    private _context : Context;

    private _latestSnapshotId: string | null = null;

    private _registryResolvers : Record<string, BlockingResolver<ConcreteRegistry | null>> = {};

    constructor(context : Context)
    {
        this._context = context;
        this._logger = context.logger.sublogger("SnapshotMonitor");
    }

    get logger() {
        return this._logger;
    }

    init() 
    {
        this._context.dataStore.onConnect(this._refreshLatestSnapshotId.bind(this));
    }

    fetchCurrentRegistry() : Promise<ConcreteRegistry | null>
    {
        return Promise.resolve()
            .then(() => this._refreshLatestSnapshotId())
            .then(() => {
                if (!this._latestSnapshotId) {
                    return null;
                }
        
                const resolver = this._registryResolvers[this._latestSnapshotId];
                if (!resolver) {
                    return null;
                }
        
                return resolver.resolve();
            })
    }

    private _refreshLatestSnapshotId()
    {
        return this._context.configAccessor.getLatestSnapshotId()
            .then(snapshotId => {

                this._logger.info("[_refreshLatestSnapshotId] snapshotId: %s", snapshotId);

                if (snapshotId) {
                    return this._activateSnapshotId(snapshotId);
                }
            });
    }

    private _activateSnapshotId(snapshotId: string)
    {
        this._logger.info("[_activateSnapshot] snapshotId: %s", snapshotId);

        if (this._latestSnapshotId === snapshotId) {
            return;
        }

        this._latestSnapshotId = snapshotId;

        if (!this._latestSnapshotId) {
            return;
        }

        const resolver = new BlockingResolver<ConcreteRegistry | null>(() => {
            return this._loadSnapshot(snapshotId)
                .then(concreteRegistry => {
                    if (!this._latestSnapshotId ||
                        (this._latestSnapshotId !== snapshotId))
                    {
                        delete this._registryResolvers[snapshotId];
                    }
                    return concreteRegistry;
                })
        });

        this._registryResolvers[snapshotId] = resolver;

        return resolver.resolve();
    }

    private _loadSnapshot(snapshotId: string)
    {
        const reader = new ConcreteRegistryReader(this.logger, this._context, {
            snapshotId: BufferUtils.fromStr(snapshotId)
        });

        return reader.query()
            .then(result => {
                this.logger.info("READY!!!");

                // if (result) {
                //     this.logger.info("Concrete Registry: ", result.extractCapacity());
                // }

                return result;
            })

    }

}