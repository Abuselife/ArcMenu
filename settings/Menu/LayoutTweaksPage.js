const Me = imports.misc.extensionUtils.getCurrentExtension();
const {Adw, Gdk, GdkPixbuf, Gio, GLib, GObject, Gtk} = imports.gi;
const Constants = Me.imports.constants;
const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const PW = Me.imports.prefsWidgets;
const { SettingsUtils } = Me.imports.settings;
const _ = Gettext.gettext;

const Settings = Me.imports.settings;
const { SubPage } = Settings.Menu.SubPage;
const { ListPinnedPage } = Me.imports.settings.Menu.ListPinnedPage;
const { ListOtherPage } = Me.imports.settings.Menu.ListOtherPage;

var LayoutTweaksPage = GObject.registerClass(
class ArcMenu_LayoutTweaksPage extends SubPage {
    _init(settings, params) {
        super._init(settings, params);

        this.restoreDefaultsButton.visible = false;
        this._createLayout();
    }

    setActiveLayout(menuLayout){
        this.headerLabel.title = _(SettingsUtils.getMenuLayoutTweaksName(menuLayout));

        for(let child of this.page.children){
            this.page.remove(child);
        }
        this.page.children = [];
        this._createLayout(menuLayout);
    }

    _createLayout(menuLayout) {
        if(!menuLayout)
            menuLayout = this._settings.get_enum('menu-layout');

        switch (menuLayout) {
            case Constants.MenuLayout.ARCMENU:
                this._loadArcMenuTweaks();
                break;
            case Constants.MenuLayout.BRISK:
                this._loadBriskMenuTweaks();
                break;
            case Constants.MenuLayout.WHISKER:
                this._loadWhiskerMenuTweaks();
                break;
            case Constants.MenuLayout.GNOME_MENU:
                this._loadGnomeMenuTweaks();
                break;
            case Constants.MenuLayout.MINT:
                this._loadMintMenuTweaks();
                break;
            case Constants.MenuLayout.ELEMENTARY:
                this._loadElementaryTweaks();
                break;
            case Constants.MenuLayout.GNOME_OVERVIEW:
                this._loadGnomeOverviewTweaks();
                break;
            case Constants.MenuLayout.REDMOND:
                this._loadRedmondMenuTweaks()
                break;
            case Constants.MenuLayout.UNITY:
                this._loadUnityTweaks();
                break;
            case Constants.MenuLayout.RAVEN:
                this._loadRavenTweaks();
                break;
            case Constants.MenuLayout.BUDGIE:
                this._loadBudgieMenuTweaks();
                break;
            case Constants.MenuLayout.INSIDER:
                this._loadInsiderMenuTweaks();
                break;
            case Constants.MenuLayout.RUNNER:
                this._loadRunnerMenuTweaks();
                break;
            case Constants.MenuLayout.CHROMEBOOK:
                this._loadChromebookTweaks();
                break;
            case Constants.MenuLayout.TOGNEE:
                this._loadTogneeMenuTweaks();
                break;
            case Constants.MenuLayout.PLASMA:
                this._loadPlasmaMenuTweaks();
                break;
            case Constants.MenuLayout.WINDOWS:
                this._loadWindowsTweaks();
                break;
            case Constants.MenuLayout.ELEVEN:
                this._loadElevenTweaks();
                break;
            case Constants.MenuLayout.AZ:
                this._loadAZTweaks();
                break;
            case Constants.MenuLayout.ENTERPRISE:
                this._loadEnterpriseTweaks();
                break;
            default:
                this._loadPlaceHolderTweaks();
                break;
        }
    }

    _createVertSeparatorRow(){
        let vertSeparatorSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
            active: this._settings.get_boolean('vert-separator')
        });
        vertSeparatorSwitch.connect('notify::active', (widget) => {
            this._settings.set_boolean('vert-separator', widget.get_active());
        });
        let vertSeparatorRow = new Adw.ActionRow({
            title: _('Vertical Separator'),
            activatable_widget:  vertSeparatorSwitch
        });
        vertSeparatorRow.add_suffix(vertSeparatorSwitch);
        return vertSeparatorRow;
    }

    _createActivateOnHoverRow(){
        let hoverOptions = new Gtk.StringList();
        hoverOptions.append(_("Mouse Click"));
        hoverOptions.append(_("Mouse Hover"));

        let activateOnHoverRow = new Adw.ComboRow({
            title: _("Category Activation"),
            model: hoverOptions,
        });

        if(this._settings.get_boolean('activate-on-hover'))
            activateOnHoverRow.selected = 1;
        else
            activateOnHoverRow.selected = 0;

        activateOnHoverRow.connect('notify::selected', (widget) => {
            let activateOnHover;
            if(widget.selected === 0)
                activateOnHover = false;
            if(widget.selected === 1)
                activateOnHover = true;

            this._settings.set_boolean('activate-on-hover', activateOnHover);
        });
        return activateOnHoverRow;
    }

    _createAvatarShapeRow(){
        let avatarStyles = new Gtk.StringList();
        avatarStyles.append(_("Round"));
        avatarStyles.append(_("Square"));
        let avatarStyleRow = new Adw.ComboRow({
            title: _('Avatar Icon Shape'),
            model: avatarStyles,
            selected: this._settings.get_enum('avatar-style')
        });

        avatarStyleRow.connect('notify::selected', (widget) => {
            this._settings.set_enum('avatar-style', widget.selected);
        });
        return avatarStyleRow;
    }

    _createSearchBarLocationRow(bottomDefault){
        let searchBarLocationSetting = bottomDefault ? 'searchbar-default-bottom-location' : 'searchbar-default-top-location';

        let searchbarLocations = new Gtk.StringList();
        searchbarLocations.append(_("Bottom"));
        searchbarLocations.append(_("Top"));

        let searchbarLocationRow = new Adw.ComboRow({
            title: _("Searchbar Location"),
            model: searchbarLocations,
            selected: this._settings.get_enum(searchBarLocationSetting)
        });

        searchbarLocationRow.connect('notify::selected', (widget) => {
            this._settings.set_enum(searchBarLocationSetting , widget.selected);
        });

        return searchbarLocationRow;
    }

    _createFlipHorizontalRow(){
        let horizontalFlipSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER
        });
        horizontalFlipSwitch.set_active(this._settings.get_boolean('enable-horizontal-flip'));
        horizontalFlipSwitch.connect('notify::active', (widget) => {
            this._settings.set_boolean('enable-horizontal-flip', widget.get_active());
        });
        let horizontalFlipRow = new Adw.ActionRow({
            title: _("Flip Layout Horizontally"),
            activatable_widget: horizontalFlipSwitch
        });
        horizontalFlipRow.add_suffix(horizontalFlipSwitch);
        return horizontalFlipRow;
    }

    _disableAvatarRow(){
        let disableAvatarSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER
        });
        disableAvatarSwitch.set_active(this._settings.get_boolean('disable-user-avatar'));
        disableAvatarSwitch.connect('notify::active', (widget) => {
            this._settings.set_boolean('disable-user-avatar', widget.get_active());
        });
        let disableAvatarRow = new Adw.ActionRow({
            title: _('Disable User Avatar'),
            activatable_widget: disableAvatarSwitch
        });
        disableAvatarRow.add_suffix(disableAvatarSwitch);
        return disableAvatarRow;
    }

    _loadEnterpriseTweaks() {
        let tweaksGroup = new Adw.PreferencesGroup();
        tweaksGroup.add(this._createActivateOnHoverRow());
        tweaksGroup.add(this._createAvatarShapeRow());
        tweaksGroup.add(this._createSearchBarLocationRow());
        tweaksGroup.add(this._createFlipHorizontalRow());
        tweaksGroup.add(this._createVertSeparatorRow());
        this.add(tweaksGroup);
    }

    _loadElevenTweaks(){
        let tweaksGroup = new Adw.PreferencesGroup();
        let disableFrequentAppsSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER
        });
        disableFrequentAppsSwitch.set_active(this._settings.get_boolean('eleven-disable-frequent-apps'));
        disableFrequentAppsSwitch.connect('notify::active', (widget) => {
            this._settings.set_boolean('eleven-disable-frequent-apps', widget.get_active());
        });
        let disableFrequentAppsRow = new Adw.ActionRow({
            title: _("Disable Frequent Apps"),
            activatable_widget: disableFrequentAppsSwitch
        });
        disableFrequentAppsRow.add_suffix(disableFrequentAppsSwitch);
        tweaksGroup.add(disableFrequentAppsRow);
        this.add(tweaksGroup);

        let extraShortcutsGroup = new Adw.PreferencesGroup({
            title: _("Button Shortcuts")
        });
        let extraShortcutsPage = new ListPinnedPage(this._settings, {
            title: _('Button Shortcuts'),
            preferences_page: false,
            setting_string: 'eleven-extra-buttons',
            list_type: Constants.MenuSettingsListType.EXTRA_SHORTCUTS
        });
        extraShortcutsGroup.set_header_suffix(extraShortcutsPage.restoreDefaultsButton);
        extraShortcutsGroup.add(extraShortcutsPage);
        this.add(extraShortcutsGroup);
    }

    _loadAZTweaks(){
        let tweaksGroup = new Adw.PreferencesGroup();
        tweaksGroup.add(this._createSearchBarLocationRow());
        this.add(tweaksGroup);

        let extraShortcutsGroup = new Adw.PreferencesGroup({
            title: _("Button Shortcuts")
        });
        let extraShortcutsPage = new ListPinnedPage(this._settings, {
            title: _('Button Shortcuts'),
            preferences_page: false,
            setting_string: 'az-extra-buttons',
            list_type: Constants.MenuSettingsListType.EXTRA_SHORTCUTS
        });
        extraShortcutsGroup.set_header_suffix(extraShortcutsPage.restoreDefaultsButton);
        extraShortcutsGroup.add(extraShortcutsPage);
        this.add(extraShortcutsGroup);
    }

    _loadGnomeOverviewTweaks(){
        let tweaksGroup = new Adw.PreferencesGroup();
        let appsGridSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER
        });
        appsGridSwitch.set_active(this._settings.get_boolean('gnome-dash-show-applications'));
        appsGridSwitch.connect('notify::active', (widget) => {
            this._settings.set_boolean('gnome-dash-show-applications', widget.get_active());
        });
        let appsGridRow = new Adw.ActionRow({
            title: _("Show Apps Grid"),
            activatable_widget: appsGridSwitch
        });
        appsGridRow.add_suffix(appsGridSwitch);
        tweaksGroup.add(appsGridRow);
        this.add(tweaksGroup);
    }

    _loadWindowsTweaks(){
        let tweaksGroup = new Adw.PreferencesGroup();

        let frequentAppsSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER
        });
        frequentAppsSwitch.set_active(this._settings.get_boolean('windows-disable-frequent-apps'));
        frequentAppsSwitch.connect('notify::active', (widget) => {
            this._settings.set_boolean('windows-disable-frequent-apps', widget.get_active());
        });
        let frequentAppsRow = new Adw.ActionRow({
            title: _("Disable Frequent Apps"),
            activatable_widget: frequentAppsSwitch
        });
        frequentAppsRow.add_suffix(frequentAppsSwitch);
        tweaksGroup.add(frequentAppsRow);

        let pinnedAppsSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER
        });
        pinnedAppsSwitch.set_active(this._settings.get_boolean('windows-disable-pinned-apps'));
        pinnedAppsSwitch.connect('notify::active', (widget) => {
            this._settings.set_boolean('windows-disable-pinned-apps', widget.get_active());
        });
        let pinnedAppsRow = new Adw.ActionRow({
            title: _("Disable Pinned Apps"),
            activatable_widget: pinnedAppsSwitch
        });
        pinnedAppsRow.add_suffix(pinnedAppsSwitch);
        tweaksGroup.add(pinnedAppsRow);

        this.add(tweaksGroup);

        let extraShortcutsGroup = new Adw.PreferencesGroup({
            title: _("Button Shortcuts")
        });
        let extraShortcutsPage = new ListPinnedPage(this._settings, {
            title: _('Button Shortcuts'),
            preferences_page: false,
            setting_string: 'windows-extra-buttons',
            list_type: Constants.MenuSettingsListType.EXTRA_SHORTCUTS
        });
        extraShortcutsGroup.set_header_suffix(extraShortcutsPage.restoreDefaultsButton);
        extraShortcutsGroup.add(extraShortcutsPage);
        this.add(extraShortcutsGroup);
    }

    _loadPlasmaMenuTweaks(){
        let tweaksGroup = new Adw.PreferencesGroup();
        tweaksGroup.add(this._createSearchBarLocationRow());

        let hoverSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER
        });
        hoverSwitch.set_active(this._settings.get_boolean('plasma-enable-hover'));
        hoverSwitch.connect('notify::active', (widget) => {
            this._settings.set_boolean('plasma-enable-hover', widget.get_active());
        });
        let hoverRow = new Adw.ActionRow({
            title: _("Activate on Hover"),
            activatable_widget: hoverSwitch
        });
        hoverRow.add_suffix(hoverSwitch);
        tweaksGroup.add(hoverRow);

        this.add(tweaksGroup);
    }

    _loadBriskMenuTweaks(){
        let tweaksGroup = new Adw.PreferencesGroup();
        tweaksGroup.add(this._createActivateOnHoverRow());
        tweaksGroup.add(this._createSearchBarLocationRow());
        tweaksGroup.add(this._createFlipHorizontalRow());
        tweaksGroup.add(this._createVertSeparatorRow());
        this.add(tweaksGroup);

        let extraShortcutsGroup = new Adw.PreferencesGroup({
            title: _("Extra Shortcuts")
        });
        let extraShortcutsPage = new ListPinnedPage(this._settings, {
            title: _('Extra Shortcuts'),
            preferences_page: false,
            setting_string: 'brisk-extra-shortcuts',
            list_type: Constants.MenuSettingsListType.EXTRA_SHORTCUTS
        });
        extraShortcutsGroup.set_header_suffix(extraShortcutsPage.restoreDefaultsButton);
        extraShortcutsGroup.add(extraShortcutsPage);
        this.add(extraShortcutsGroup);

    }

    _loadChromebookTweaks(){
        let tweaksGroup = new Adw.PreferencesGroup();
        tweaksGroup.add(this._createSearchBarLocationRow());
        this.add(tweaksGroup);
    }

    _loadElementaryTweaks(){
        let tweaksGroup = new Adw.PreferencesGroup();
        tweaksGroup.add(this._createSearchBarLocationRow());
        this.add(tweaksGroup);
    }

    _loadBudgieMenuTweaks(){
        let tweaksGroup = new Adw.PreferencesGroup();
        tweaksGroup.add(this._createActivateOnHoverRow());
        tweaksGroup.add(this._createSearchBarLocationRow());
        tweaksGroup.add(this._createFlipHorizontalRow());
        tweaksGroup.add(this._createVertSeparatorRow());
        
        let enableActivitiesSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER
        });
        enableActivitiesSwitch.set_active(this._settings.get_boolean('enable-activities-shortcut'));
        enableActivitiesSwitch.connect('notify::active', (widget) => {
            this._settings.set_boolean('enable-activities-shortcut', widget.get_active());
        });
        let enableActivitiesRow = new Adw.ActionRow({
            title: _('Enable Activities Overview Shortcut'),
            activatable_widget: enableActivitiesSwitch
        });
        enableActivitiesRow.add_suffix(enableActivitiesSwitch);
        tweaksGroup.add(enableActivitiesRow);

        this.add(tweaksGroup);
    }

    _loadRunnerMenuTweaks(){
        let tweaksGroup = new Adw.PreferencesGroup();
        let runnerPositions = new Gtk.StringList();
        runnerPositions.append(_("Top"));
        runnerPositions.append(_("Centered"));
        let runnerPositionRow = new Adw.ComboRow({
            title: _('Position'),
            model: runnerPositions,
            selected: this._settings.get_enum('runner-position')
        });

        runnerPositionRow.connect('notify::selected', (widget) => {
            this._settings.set_enum('runner-position', widget.selected);
        });
        tweaksGroup.add(runnerPositionRow);

        let runnerSearchStyles = new Gtk.StringList();
        runnerSearchStyles.append(_("List"));
        runnerSearchStyles.append(_("Grid"));
        let runnerSearchStyleRow = new Adw.ComboRow({
            title: _('Search Results Display Style'),
            model: runnerSearchStyles,
            selected: this._settings.get_enum('runner-search-display-style')
        });

        runnerSearchStyleRow.connect('notify::selected', (widget) => {
            this._settings.set_enum('runner-search-display-style', widget.selected);
        });
        tweaksGroup.add(runnerSearchStyleRow);

        let runnerWidthScale = new Gtk.SpinButton({
            orientation: Gtk.Orientation.HORIZONTAL,
            adjustment: new Gtk.Adjustment({
                lower: 300,
                upper: 1000,
                step_increment: 15,
                page_increment: 15,
                page_size: 0
            }),
            digits: 0,
            valign: Gtk.Align.CENTER
        });
        runnerWidthScale.set_value(this._settings.get_int('runner-menu-width'));
        runnerWidthScale.connect('value-changed', (widget) => {
            this._settings.set_int('runner-menu-width', widget.get_value());
        });
        let runnerWidthRow = new Adw.ActionRow({
            title: _("Width"),
            activatable_widget: runnerWidthScale
        });
        runnerWidthRow.add_suffix(runnerWidthScale);
        tweaksGroup.add(runnerWidthRow);

        let runnerHeightScale = new Gtk.SpinButton({
            orientation: Gtk.Orientation.HORIZONTAL,
            adjustment: new Gtk.Adjustment({
                lower: 300,
                upper: 1000,
                step_increment: 15,
                page_increment: 15,
                page_size: 0
            }),
            digits: 0,
            valign: Gtk.Align.CENTER
        });
        runnerHeightScale.set_value(this._settings.get_int('runner-menu-height'));
        runnerHeightScale.connect('value-changed', (widget) => {
            this._settings.set_int('runner-menu-height', widget.get_value());
        });
        let runnerHeightRow = new Adw.ActionRow({
            title: _("Height"),
            activatable_widget: runnerHeightScale
        });
        runnerHeightRow.add_suffix(runnerHeightScale);
        tweaksGroup.add(runnerHeightRow);

        let runnerFontSizeScale = new Gtk.SpinButton({
            orientation: Gtk.Orientation.HORIZONTAL,
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 30,
                step_increment: 1,
                page_increment: 1,
                page_size: 0
            }),
            digits: 0,
            valign: Gtk.Align.CENTER
        });
        runnerFontSizeScale.set_value(this._settings.get_int('runner-font-size'));
        runnerFontSizeScale.connect('value-changed', (widget) => {
            this._settings.set_int('runner-font-size', widget.get_value());
        });
        let runnerFontSizeRow = new Adw.ActionRow({
            title: _("Font Size"),
            subtitle: _("%d Default Theme Value").format(0),
            activatable_widget: runnerFontSizeScale
        });
        runnerFontSizeRow.add_suffix(runnerFontSizeScale);
        tweaksGroup.add(runnerFontSizeRow);

        let frequentAppsSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER
        });
        frequentAppsSwitch.set_active(this._settings.get_boolean('runner-show-frequent-apps'));
        frequentAppsSwitch.connect('notify::active', (widget) => {
            this._settings.set_boolean('runner-show-frequent-apps', widget.get_active());
        });
        let frequentAppsRow = new Adw.ActionRow({
            title: _("Show Frequent Apps"),
            activatable_widget: frequentAppsSwitch
        });
        frequentAppsRow.add_suffix(frequentAppsSwitch);
        tweaksGroup.add(frequentAppsRow);

        this.add(tweaksGroup);
    }

    _loadUnityTweaks(){
        let tweaksGroup = new Adw.PreferencesGroup();
        this.add(tweaksGroup);

        let defaulViews = new Gtk.StringList();
        defaulViews.append(_("Home"));
        defaulViews.append(_("All Programs"));
        let defaultViewRow = new Adw.ComboRow({
            title: _("Default View"),
            model: defaulViews,
            selected: this._settings.get_boolean('enable-unity-homescreen') ? 0 : 1
        });
        defaultViewRow.connect('notify::selected', (widget) => {
            let enable =  widget.selected === 0 ? true : false;
            this._settings.set_boolean('enable-unity-homescreen', enable);
        });
        tweaksGroup.add(defaultViewRow);

        let widgetGroup = this._createWidgetsRows(Constants.MenuLayout.UNITY);
        this.add(widgetGroup);

        let extraShortcutsGroup = new Adw.PreferencesGroup({
            title: _("Button Shortcuts")
        });
        let extraShortcutsPage = new ListPinnedPage(this._settings, {
            title: _('Button Shortcuts'),
            preferences_page: false,
            setting_string: 'unity-extra-buttons',
            list_type: Constants.MenuSettingsListType.EXTRA_SHORTCUTS
        });
        extraShortcutsGroup.set_header_suffix(extraShortcutsPage.restoreDefaultsButton);
        extraShortcutsGroup.add(extraShortcutsPage);
        this.add(extraShortcutsGroup);
    }

    _loadRavenTweaks(){
        let tweaksGroup = new Adw.PreferencesGroup();
        this.add(tweaksGroup);

        let defaulViews = new Gtk.StringList();
        defaulViews.append(_("Home"));
        defaulViews.append(_("All Programs"));
        let defaultViewRow = new Adw.ComboRow({
            title: _("Default View"),
            model: defaulViews,
            selected: this._settings.get_boolean('enable-unity-homescreen') ? 0 : 1
        });
        defaultViewRow.connect('notify::selected', (widget) => {
            let enable =  widget.selected === 0 ? true : false;
            this._settings.set_boolean('enable-unity-homescreen', enable);
        });
        tweaksGroup.add(defaultViewRow);

        let runnerSearchStyles = new Gtk.StringList();
        runnerSearchStyles.append(_("List"));
        runnerSearchStyles.append(_("Grid"));
        let runnerSearchStyleRow = new Adw.ComboRow({
            title: _('Search Results Display Style'),
            model: runnerSearchStyles,
            selected: this._settings.get_enum('raven-search-display-style')
        });

        runnerSearchStyleRow.connect('notify::selected', (widget) => {
            this._settings.set_enum('raven-search-display-style', widget.selected);
        });
        tweaksGroup.add(runnerSearchStyleRow);

        let ravenPositions = new Gtk.StringList();
        ravenPositions.append(_("Left"));
        ravenPositions.append(_("Right"));
        let ravenPositionRow = new Adw.ComboRow({
            title: _('Position on Monitor'),
            model: ravenPositions,
            selected: this._settings.get_enum('raven-position')
        });
        ravenPositionRow.connect('notify::selected', (widget) => {
            this._settings.set_enum('raven-position', widget.selected);
        });
        tweaksGroup.add(ravenPositionRow);
        tweaksGroup.add(this._createActivateOnHoverRow());
        let widgetGroup = this._createWidgetsRows(Constants.MenuLayout.RAVEN);
        this.add(widgetGroup);
    }

    _loadMintMenuTweaks(){
        let tweaksGroup = new Adw.PreferencesGroup();
        tweaksGroup.add(this._createActivateOnHoverRow());
        tweaksGroup.add(this._createSearchBarLocationRow());
        tweaksGroup.add(this._createFlipHorizontalRow());
        tweaksGroup.add(this._createVertSeparatorRow());
        this.add(tweaksGroup);

        let extraShortcutsGroup = new Adw.PreferencesGroup({
            title: _("Button Shortcuts")
        });
        let extraShortcutsPage = new ListPinnedPage(this._settings, {
            title: _('Button Shortcuts'),
            preferences_page: false,
            setting_string: 'mint-extra-buttons',
            list_type: Constants.MenuSettingsListType.EXTRA_SHORTCUTS
        });
        extraShortcutsGroup.set_header_suffix(extraShortcutsPage.restoreDefaultsButton);
        extraShortcutsGroup.add(extraShortcutsPage);
        this.add(extraShortcutsGroup);
    }

    _loadWhiskerMenuTweaks(){
        let tweaksGroup = new Adw.PreferencesGroup();
        tweaksGroup.add(this._createActivateOnHoverRow());
        tweaksGroup.add(this._createAvatarShapeRow());
        tweaksGroup.add(this._createSearchBarLocationRow());
        tweaksGroup.add(this._createFlipHorizontalRow());
        tweaksGroup.add(this._createVertSeparatorRow());
        this.add(tweaksGroup);
    }

    _loadRedmondMenuTweaks(){
        let tweaksGroup = new Adw.PreferencesGroup();

        let defaulViews = new Gtk.StringList();
        defaulViews.append(_("All Programs"));
        defaulViews.append(_("Pinned Apps"));
        
        let defaultViewRow = new Adw.ComboRow({
            title: _("Default View"),
            model: defaulViews,
            selected: this._settings.get_enum('default-menu-view-redmond')
        });
        defaultViewRow.connect('notify::selected', (widget) => {
            this._settings.set_enum('default-menu-view-redmond', widget.selected);
        });
        tweaksGroup.add(defaultViewRow);

        tweaksGroup.add(this._createAvatarShapeRow());
        tweaksGroup.add(this._createSearchBarLocationRow());
        tweaksGroup.add(this._createFlipHorizontalRow());
        tweaksGroup.add(this._disableAvatarRow());
        tweaksGroup.add(this._createVertSeparatorRow());

        this.add(tweaksGroup);

        let placesGroup = new Adw.PreferencesGroup({
            title: _("Extra Shortcuts")
        });
        this.add(placesGroup);

        let externalDeviceButton = new Gtk.Switch({
            valign: Gtk.Align.CENTER
        });
        externalDeviceButton.set_active(this._settings.get_boolean('show-external-devices'));
        externalDeviceButton.connect('notify::active', (widget) => {
            this._settings.set_boolean('show-external-devices', widget.get_active());
        });
        let externalDeviceRow = new Adw.ActionRow({
            title: _("External Devices"),
            activatable_widget: externalDeviceButton
        });
        externalDeviceRow.add_suffix(externalDeviceButton);
        placesGroup.add(externalDeviceRow);

        let bookmarksButton = new Gtk.Switch({
            valign: Gtk.Align.CENTER
        });
        bookmarksButton.set_active(this._settings.get_boolean('show-bookmarks'));
        bookmarksButton.connect('notify::active', (widget) => {
            this._settings.set_boolean('show-bookmarks', widget.get_active());
        });
        let bookmarksRow = new Adw.ActionRow({
            title: _("Bookmarks"),
            activatable_widget: bookmarksButton
        });
        bookmarksRow.add_suffix(bookmarksButton);
        placesGroup.add(bookmarksRow);
    }

    _loadInsiderMenuTweaks(){
        let tweaksGroup = new Adw.PreferencesGroup();
        tweaksGroup.add(this._createAvatarShapeRow());
        this.add(tweaksGroup);

        let extraShortcutsGroup = new Adw.PreferencesGroup({
            title: _("Button Shortcuts")
        });
        let extraShortcutsPage = new ListPinnedPage(this._settings, {
            title: _('Button Shortcuts'),
            preferences_page: false,
            setting_string: 'insider-extra-buttons',
            list_type: Constants.MenuSettingsListType.EXTRA_SHORTCUTS
        });
        extraShortcutsGroup.set_header_suffix(extraShortcutsPage.restoreDefaultsButton);
        extraShortcutsGroup.add(extraShortcutsPage);
        this.add(extraShortcutsGroup);
    }

    _loadGnomeMenuTweaks(){
        let tweaksGroup = new Adw.PreferencesGroup();
        tweaksGroup.add(this._createActivateOnHoverRow());
        tweaksGroup.add(this._createFlipHorizontalRow());
        tweaksGroup.add(this._createVertSeparatorRow());
        this.add(tweaksGroup);
    }

    _loadPlaceHolderTweaks(){
        let placeHolderGroup = new Adw.PreferencesGroup();
        let placeHolderRow = new Adw.ActionRow({
            title: _("Nothing Yet!"),
        });
        placeHolderGroup.add(placeHolderRow);
        this.add(placeHolderGroup);
    }

    _loadTogneeMenuTweaks(){
        let tweaksGroup = new Adw.PreferencesGroup();

        let defaulViews = new Gtk.StringList();
        defaulViews.append(_("Categories List"));
        defaulViews.append(_("All Programs"));
        let defaultViewRow = new Adw.ComboRow({
            title: _("Default View"),
            model: defaulViews,
            selected: this._settings.get_enum('default-menu-view-tognee')
        });
        defaultViewRow.connect('notify::selected', (widget) => {
            this._settings.set_enum('default-menu-view-tognee', widget.selected);
        });
        tweaksGroup.add(defaultViewRow);

        let searchBarBottomDefault = true;
        tweaksGroup.add(this._createSearchBarLocationRow(searchBarBottomDefault));
        tweaksGroup.add(this._createFlipHorizontalRow());
        tweaksGroup.add(this._createVertSeparatorRow());
        this.add(tweaksGroup);
    }

    _loadArcMenuTweaks(){
        let tweaksGroup = new Adw.PreferencesGroup();

        let defaulViews = new Gtk.StringList();
        defaulViews.append(_("Pinned Apps"));
        defaulViews.append(_("Categories List"));
        defaulViews.append(_("Frequent Apps"));
        defaulViews.append(_("All Programs"));
        let defaultViewRow = new Adw.ComboRow({
            title: _("Default View"),
            model: defaulViews,
            selected: this._settings.get_enum('default-menu-view')
        });
        defaultViewRow.connect('notify::selected', (widget) => {
            this._settings.set_enum('default-menu-view', widget.selected);
        });
        tweaksGroup.add(defaultViewRow);

        let searchBarBottomDefault = true;
        tweaksGroup.add(this._createAvatarShapeRow());
        tweaksGroup.add(this._createSearchBarLocationRow(searchBarBottomDefault));
        tweaksGroup.add(this._createFlipHorizontalRow());
        tweaksGroup.add(this._disableAvatarRow());
        tweaksGroup.add(this._createVertSeparatorRow());
        this.add(tweaksGroup);

        let placesGroup = new Adw.PreferencesGroup({
            title: _("Extra Shortcuts")
        });

        let externalDeviceButton = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });
        externalDeviceButton.set_active(this._settings.get_boolean('show-external-devices'));
        externalDeviceButton.connect('notify::active', (widget) => {
            this._settings.set_boolean('show-external-devices', widget.get_active());
        });
        let externalDeviceRow = new Adw.ActionRow({
            title: _("External Devices"),
            activatable_widget: externalDeviceButton
        });
        externalDeviceRow.add_suffix(externalDeviceButton);
        placesGroup.add(externalDeviceRow);

        let bookmarksButton = new Gtk.Switch({
            valign: Gtk.Align.CENTER,
        });
        bookmarksButton.set_active(this._settings.get_boolean('show-bookmarks'));
        bookmarksButton.connect('notify::active', (widget) => {
            this._settings.set_boolean('show-bookmarks', widget.get_active());
        });
        let bookmarksRow = new Adw.ActionRow({
            title: _("Bookmarks"),
            activatable_widget: bookmarksButton
        });
        bookmarksRow.add_suffix(bookmarksButton);
        placesGroup.add(bookmarksRow);
        this.add(placesGroup);

        let extraCategoriesGroup = new Adw.PreferencesGroup({
            title: _("Category Quick Links"),
            description: _("Display quick links of extra categories on the home page\nMust also be enabled in 'Menu -> Extra Categories' section")
        });
        let extraCategoriesLinksBox = new ListOtherPage(this._settings, {
            preferences_page: false,
            list_type: Constants.MenuSettingsListType.QUICK_LINKS
        });
        extraCategoriesGroup.add(extraCategoriesLinksBox);
        this.add(extraCategoriesGroup);

        let extraCategoriesLocationGroup = new Adw.PreferencesGroup();
        let locations = new Gtk.StringList();
        locations.append(_("Bottom"));
        locations.append(_("Top"));
        let extraCategoriesLocationRow = new Adw.ComboRow({
            title: _("Quick Links Location"),
            model: locations,
            selected: this._settings.get_enum('arcmenu-extra-categories-links-location')
        });
        extraCategoriesLocationRow.connect('notify::selected', (widget) => {
            this._settings.set_enum('arcmenu-extra-categories-links-location' , widget.selected);
        });
        extraCategoriesLocationGroup.add(extraCategoriesLocationRow);
        this.add(extraCategoriesLocationGroup);
    }

    _createWidgetsRows(layout){
        let weatherWidgetSetting = 'enable-weather-widget-raven';
        let clockWidgetSetting = 'enable-clock-widget-raven';
        if(layout == Constants.MenuLayout.RAVEN){
            weatherWidgetSetting = 'enable-weather-widget-raven';
            clockWidgetSetting = 'enable-clock-widget-raven';
        }
        else{
            weatherWidgetSetting = 'enable-weather-widget-unity';
            clockWidgetSetting = 'enable-clock-widget-unity';
        }

        let widgetGroup = new Adw.PreferencesGroup();

        let weatherWidgetSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER
        });
        weatherWidgetSwitch.set_active(this._settings.get_boolean(weatherWidgetSetting));
        weatherWidgetSwitch.connect('notify::active', (widget) => {
            this._settings.set_boolean(weatherWidgetSetting, widget.get_active());
        });
        let weatherWidgetRow = new Adw.ActionRow({
            title: _("Enable Weather Widget"),
            activatable_widget: weatherWidgetSwitch
        });
        weatherWidgetRow.add_suffix(weatherWidgetSwitch);
        widgetGroup.add(weatherWidgetRow);

        let clockWidgetSwitch = new Gtk.Switch({
            valign: Gtk.Align.CENTER
        });
        clockWidgetSwitch.set_active(this._settings.get_boolean(clockWidgetSetting));
        clockWidgetSwitch.connect('notify::active', (widget) => {
            this._settings.set_boolean(clockWidgetSetting, widget.get_active());
        });
        let clockWidgetRow = new Adw.ActionRow({
            title: _("Enable Clock Widget"),
            activatable_widget: clockWidgetSwitch
        });
        clockWidgetRow.add_suffix(clockWidgetSwitch);
        widgetGroup.add(clockWidgetRow);

        return widgetGroup;
    }
});
