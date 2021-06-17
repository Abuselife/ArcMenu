/*
 * ArcMenu - A traditional application menu for GNOME 3
 *
 * ArcMenu Lead Developer and Maintainer
 * Andrew Zaech https://gitlab.com/AndrewZaech
 * 
 * ArcMenu Founder, Former Maintainer, and Former Graphic Designer
 * LinxGem33 https://gitlab.com/LinxGem33 - (No Longer Active)
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const Me = imports.misc.extensionUtils.getCurrentExtension();

const {Clutter, Gtk, St} = imports.gi;
const BaseMenuLayout = Me.imports.menulayouts.baseMenuLayout;
const Constants = Me.imports.constants;
const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const Main = imports.ui.main;
const MW = Me.imports.menuWidgets;
const Utils =  Me.imports.utils;
const _ = Gettext.gettext;

const RUNNER_WIDTH = 500;

var createMenu =  class extends BaseMenuLayout.BaseLayout{
    constructor(mainButton) {
        super(mainButton,{
            Search: true,
            AppType: Constants.AppDisplayType.LIST,
            SearchType: Constants.AppDisplayType.LIST,
            GridColumns: 1,
            ColumnSpacing: 0,
            RowSpacing: 0,
            VerticalMainBox: true
        });
    }

    createLayout(){
        super.createLayout();
        this.mainBox.style = `max-height: 400px;`;       

        this.dummyCursor = new St.Widget({ width: 0, height: 0, opacity: 0 });
        Main.uiGroup.add_actor(this.dummyCursor);
        this.updateLocation();

        //store old ArcMenu variables
        this.oldSourceActor = this.arcMenu.sourceActor;
        this.oldFocusActor = this.arcMenu.focusActor;
        this.oldArrowAlignment = this.arcMenu.actor._arrowAlignment;

        this.arcMenu.actor.style = "-arrow-base:0px; -arrow-rise:0px;";
        this.arcMenu.sourceActor = this.dummyCursor;
        this.arcMenu.focusActor = this.dummyCursor;
        this.arcMenu._boxPointer.setPosition(this.dummyCursor, 0.5);
        this.arcMenu.close();
        this.arcMenu._boxPointer.hide();

        this.topBox = new St.BoxLayout({
            x_expand: true,
            y_expand: true,
            vertical: false
        });
        this.topBox.style = "width: " + RUNNER_WIDTH + "px;";

        this.searchBox = new MW.SearchBox(this);
        this.searchBox.style = "margin: 5px 10px 5px 10px;";
        this._searchBoxChangedId = this.searchBox.connect('search-changed', this._onSearchBoxChanged.bind(this));
        this._searchBoxKeyPressId = this.searchBox.connect('entry-key-press', this._onSearchBoxKeyPress.bind(this));
        this._searchBoxKeyFocusInId = this.searchBox.connect('entry-key-focus-in', this._onSearchBoxKeyFocusIn.bind(this));
        this.topBox.add(this.searchBox.actor);
        this.mainBox.add(this.topBox);

        this.applicationsScrollBox = this._createScrollBox({
            x_expand: true,
            y_expand: true,
            y_align: Clutter.ActorAlign.START,
            x_align: Clutter.ActorAlign.START,
            overlay_scrollbars: true,
            style_class: 'apps-menu small-vfade',
            reactive:true
        });
        this.applicationsScrollBox.style = "width: " + RUNNER_WIDTH + "px";

        this.mainBox.add(this.applicationsScrollBox);
        this.applicationsBox = new St.BoxLayout({ vertical: true });
        this.applicationsScrollBox.add_actor(this.applicationsBox);
    }
    
    updateLocation(){
        this.arcMenu.actor.style = "-arrow-base:0px; -arrow-rise:0px;";
        this.arcMenu._boxPointer.setSourceAlignment(0.5);
        this.arcMenu._arrowAlignment = 0.5;
        
        let monitorIndex = Main.layoutManager.findIndexForActor(this.menuButton);
        let rect = Main.layoutManager.getWorkAreaForMonitor(monitorIndex);

        //Position the runner menu in the center of the current monitor, at top of screen.
        let positionX = Math.round(rect.x + (rect.width / 2));
        let positionY = rect.y;
        if(this._settings.get_enum('runner-position') == 1)
            positionY = Math.round(rect.y + (rect.height / 2) - 125);
        this.dummyCursor.set_position(positionX,  positionY);

    }
    
    updateIcons(){
        this.searchResults._reset();
    }

    updateStyle(){
        super.updateStyle();
        this.arcMenu.actor.style = "-arrow-base:0px; -arrow-rise:0px;";
    }

    updateSearch(){
        this.searchResults._reloadRemoteProviders();
    }

    loadCategories(){
    }

    destroy(isReload){
        this.arcMenu.actor.style = null;
        this.arcMenu.sourceActor = this.oldSourceActor;
        this.arcMenu.focusActor = this.oldFocusActor;
        this.arcMenu._boxPointer.setPosition(this.oldSourceActor, this.oldArrowAlignment);
        this.arcMenu.close();
        this.arcMenu._boxPointer.hide();
        Main.uiGroup.remove_actor(this.dummyCursor);
        this.dummyCursor.destroy();
        super.destroy(isReload);
    }
}
