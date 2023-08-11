import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import * as Constants from './constants.js';
import * as Controller from './controller.js';
import * as Theming from './theming.js';

export default class ArcMenu extends Extension {
    constructor(metaData) {
        super(metaData);
        this._realHasOverview = Main.sessionMode.hasOverview;
    }

    enable() {
        this._settings = this.getSettings();

        const hideOverviewOnStartup = this._settings.get_boolean('hide-overview-on-startup');
        if (hideOverviewOnStartup && Main.layoutManager._startingUp) {
            Main.sessionMode.hasOverview = false;
            Main.layoutManager.connect('startup-complete', () => {
                Main.sessionMode.hasOverview = this._realHasOverview;
            });
            // handle Ubuntu's method
            if (Main.layoutManager.startInOverview)
                Main.layoutManager.startInOverview = false;
        }

        this._settings.connect('changed::multi-monitor', () => this._reload());
        this._settings.connect('changed::dash-to-panel-standalone', () => this._reload());
        this._settingsControllers = [];

        Theming.createStylesheet(this._settings);

        this._enableButtons();

        // dash to panel might get enabled after ArcMenu
        this._extensionChangedId = Main.extensionManager.connect('extension-state-changed', (data, extension) => {
            if (extension.uuid === Constants.DASH_TO_PANEL_UUID || extension.uuid === Constants.AZTASKBAR_UUID) {
                this._disconnectExtensionSignals();
                this._connectExtensionSignals();
                this._reload();
            }
        });

        // listen to dash to panel if they are compatible and already enabled
        this._connectExtensionSignals();
    }

    disable() {
        Main.sessionMode.hasOverview = this._realHasOverview;

        if (this._extensionChangedId) {
            Main.extensionManager.disconnect(this._extensionChangedId);
            this._extensionChangedId = null;
        }

        Theming.deleteStylesheet();
        delete this.customStylesheet;

        this._disconnectExtensionSignals();

        this._disableButtons();
        this._settingsControllers = null;

        this._settings.run_dispose();
        delete this._settings;
    }

    _connectExtensionSignals() {
        if (global.dashToPanel)
            global.dashToPanel._panelsCreatedId = global.dashToPanel.connect('panels-created', () => this._reload());

        if (global.azTaskbar)
            global.azTaskbar._panelsCreatedId = global.azTaskbar.connect('panels-created', () => this._reload());
    }

    _disconnectExtensionSignals() {
        if (global.dashToPanel?._panelsCreatedId) {
            global.dashToPanel.disconnect(global.dashToPanel._panelsCreatedId);
            delete global.dashToPanel._panelsCreatedId;
        }
        if (global.azTaskbar?._panelsCreatedId) {
            global.azTaskbar.disconnect(global.azTaskbar._panelsCreatedId);
            delete global.azTaskbar._panelsCreatedId;
        }
    }

    _reload() {
        this._disableButtons();
        this._enableButtons();
    }

    _enableButtons() {
        const multiMonitor = this._settings.get_boolean('multi-monitor');

        let panelExtensionEnabled = false;
        let panels;

        if (global.dashToPanel && global.dashToPanel.panels) {
            panels = global.dashToPanel.panels.map(pw => pw);
            panelExtensionEnabled = true;
        } else if (global.azTaskbar && global.azTaskbar.panels) {
            panels = global.azTaskbar.panels.map(pw => pw);
            panels.unshift(Main.panel);
            panelExtensionEnabled = true;
        } else {
            panels = [Main.panel];
        }

        const panelLength = multiMonitor ? panels.length : 1;
        for (var i = 0; i < panelLength; i++) {
            // Dash to Panel and AzTaskbar don't store the actual 'panel' in their global 'panels' object
            let panel = panels[i].panel ?? panels[i];
            const panelParent = panels[i].panel ? panels[i] : Main.panel;

            let panelBox;
            if (panels[i].panelBox) // case Dash To Panel
                panelBox = panels[i].panelBox;
            else if (panels[i].panel) // case AzTaskbar
                panelBox = panels[i];
            else
                panelBox = Main.layoutManager.panelBox;

            // Place ArcMenu in main top panel when
            // Dash to Panel setting "Keep original gnome-shell top panel" is on
            const isStandalone = this._settings.get_boolean('dash-to-panel-standalone') &&
                                 global.dashToPanel && panelExtensionEnabled;
            if (isStandalone && ('isPrimary' in panelParent && panelParent.isPrimary) && panelParent.isStandalone)
                panel = Main.panel;

            const isPrimaryPanel = i === 0;
            const settingsController = new Controller.MenuSettingsController(this._settingsControllers,
                panel, panelBox, panelParent, isPrimaryPanel);

            settingsController.monitorIndex = panelParent.monitor?.index ?? 0;

            if (panelExtensionEnabled)
                panel._amDestroyId = panel.connect('destroy', () => this._disableButton(settingsController));

            settingsController.enableButton();
            settingsController.connectSettingsEvents();
            this._settingsControllers.push(settingsController);
        }
    }

    _disableButtons() {
        for (let i = this._settingsControllers.length - 1; i >= 0; --i) {
            const sc = this._settingsControllers[i];
            this._disableButton(sc);
        }
    }

    _disableButton(controller) {
        if (controller.panel?._amDestroyId) {
            controller.panel.disconnect(controller.panel._amDestroyId);
            delete controller.panel._amDestroyId;
        }

        this._settingsControllers.splice(this._settingsControllers.indexOf(controller), 1);
        controller.destroy();
    }
}
