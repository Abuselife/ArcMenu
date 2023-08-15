import {EventEmitter} from 'resource:///org/gnome/shell/misc/signals.js';
import {InjectionManager} from 'resource:///org/gnome/shell/extensions/extension.js';
import {SearchController} from 'resource:///org/gnome/shell/ui/searchController.js';

/**
 * Override SearchController addProvider() and removeProvider() methods to emit signals
 * when called. Allows ArcMenu to use custom search providers from extensions that use these methods.
 */

export class SearchProviderEmitter extends EventEmitter {
    constructor() {
        super();

        this._injectionManager = new InjectionManager();

        this._injectionManager.overrideMethod(SearchController.prototype, 'addProvider', originalMethod => {
            /* eslint-disable no-invalid-this */
            return function (provider) {
                originalMethod.call(this, provider);
                this.emit('search-provider-added');
            };
        });

        this._injectionManager.overrideMethod(SearchController.prototype, 'removeProvider', originalMethod => {
            /* eslint-disable no-invalid-this */
            return function (provider) {
                originalMethod.call(this, provider);
                this.emit('search-provider-removed');
            };
        });
    }

    destroy() {
        this._injectionManager.restoreMethod(SearchController.prototype, 'addProvider');
        this._injectionManager.restoreMethod(SearchController.prototype, 'removeProvider');
    }
}
