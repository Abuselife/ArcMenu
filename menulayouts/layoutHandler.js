import {MenuLayout} from '../constants.js';

import {Layout as ArcMenuLayout} from './arcmenu.js';
import {Layout as AzLayout} from './az.js';
import {Layout as BriskLayout} from './brisk.js';
import {Layout as BudgieLayout} from './budgie.js';
import {Layout as ChromebookLayout} from './chromebook.js';
import {Layout as ElementaryLayout} from './elementary.js';
import {Layout as ElevenLayout} from './eleven.js';
import {Layout as EnterpriseLayout} from './enterprise.js';
import {Layout as GnomeMenuLayout} from './gnomemenu.js';
import {Layout as InsiderLayout} from './insider.js';
import {Layout as MintLayout} from './mint.js';
import {Layout as PlasmaLayout} from './plasma.js';
import {Layout as PopLayout} from './pop.js';
import {Layout as RavenLayout} from './raven.js';
import {Layout as RedmondLayout} from './redmond.js';
import {Layout as RunnerLayout} from './runner.js';
import {Layout as TogneeLayout} from './tognee.js';
import {Layout as UnityLayout} from './unity.js';
import {Layout as WhiskerLayout} from './whisker.js';
import {Layout as WindowsLayout} from './windows.js';

export class LayoutHandler {
    constructor(menuButton) {
        this._menuButton = menuButton;
    }

    getMenuLayout(layoutEnum, isStandaloneRunner) {
        if (layoutEnum === MenuLayout.GNOME_OVERVIEW)
            return null;

        switch (layoutEnum) {
        case MenuLayout.ARCMENU:
            return new ArcMenuLayout(this._menuButton);
        case MenuLayout.AZ:
            return new AzLayout(this._menuButton);
        case MenuLayout.BRISK:
            return new BriskLayout(this._menuButton);
        case MenuLayout.BUDGIE:
            return new BudgieLayout(this._menuButton);
        case MenuLayout.CHROMEBOOK:
            return new ChromebookLayout(this._menuButton);
        case MenuLayout.ELEMENTARY:
            return new ElementaryLayout(this._menuButton);
        case MenuLayout.ELEVEN:
            return new ElevenLayout(this._menuButton);
        case MenuLayout.ENTERPRISE:
            return new EnterpriseLayout(this._menuButton);
        case MenuLayout.GNOME_MENU:
            return new GnomeMenuLayout(this._menuButton);
        case MenuLayout.INSIDER:
            return new InsiderLayout(this._menuButton);
        case MenuLayout.MINT:
            return new MintLayout(this._menuButton);
        case MenuLayout.PLASMA:
            return new PlasmaLayout(this._menuButton);
        case MenuLayout.POP:
            return new PopLayout(this._menuButton);
        case MenuLayout.RAVEN:
            return new RavenLayout(this._menuButton);
        case MenuLayout.REDMOND:
            return new RedmondLayout(this._menuButton);
        case MenuLayout.RUNNER:
            return new RunnerLayout(this._menuButton, isStandaloneRunner);
        case MenuLayout.TOGNEE:
            return new TogneeLayout(this._menuButton);
        case MenuLayout.UNITY:
            return new UnityLayout(this._menuButton);
        case MenuLayout.WHISKER:
            return new WhiskerLayout(this._menuButton);
        case MenuLayout.WINDOWS:
            return new WindowsLayout(this._menuButton);
        default:
            return new ArcMenuLayout(this._menuButton);
        }
    }
}
