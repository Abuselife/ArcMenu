const Me = imports.misc.extensionUtils.getCurrentExtension();

const { Clutter, GObject, St } = imports.gi;
const { BaseMenuLayout } = Me.imports.menulayouts.baseMenuLayout;
const Constants = Me.imports.constants;
const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const MW = Me.imports.menuWidgets;
const _ = Gettext.gettext;

function getMenuLayoutEnum() { return Constants.MenuLayout.BUDGIE; }

var Menu = class ArcMenu_BudgieLayout extends BaseMenuLayout{
    static {
        GObject.registerClass(this);
    }

    constructor(menuButton) {
        super(menuButton, {
            has_search: true,
            is_dual_panel: true,
            display_type: Constants.DisplayType.LIST,
            search_display_type: Constants.DisplayType.LIST,
            column_spacing: 0,
            row_spacing: 0,
            supports_category_hover_activation: true,
            vertical: true,
            category_icon_size: Constants.ICON_HIDDEN,
            apps_icon_size: Constants.EXTRA_SMALL_ICON_SIZE,
            quicklinks_icon_size: Constants.SMALL_ICON_SIZE,
            buttons_icon_size: Constants.EXTRA_SMALL_ICON_SIZE,
            pinned_apps_icon_size: Constants.MEDIUM_ICON_SIZE,
        });

        this._mainBox = new St.BoxLayout({
            vertical: false,
            x_expand: true,
            y_expand: true,
            y_align: Clutter.ActorAlign.FILL,
        });
        this.add_child(this._mainBox);

        this.rightBox = new St.BoxLayout({
            vertical: true,
            x_expand: true,
            y_expand: true,
            y_align: Clutter.ActorAlign.FILL
        });

        this.applicationsBox = new St.BoxLayout({ vertical: true });
        this.applicationsScrollBox = this._createScrollBox({
            y_align: Clutter.ActorAlign.START,
            style_class: (this._disableFadeEffect ? '' : 'small-vfade'),
        });
        this.applicationsScrollBox.set_policy(St.PolicyType.NEVER, St.PolicyType.EXTERNAL);
        this.applicationsScrollBox.add_actor(this.applicationsBox);
        this.rightBox.add_child(this.applicationsScrollBox);

        this.leftBox = new St.BoxLayout({
            vertical: true,
            x_expand: true,
            y_expand: true,
            y_align: Clutter.ActorAlign.FILL
        });

        const verticalSeparator = new MW.ArcMenuSeparator(Constants.SeparatorStyle.MEDIUM, Constants.SeparatorAlignment.VERTICAL);
        const horizontalFlip = Me.settings.get_boolean("enable-horizontal-flip");
        this._mainBox.add_child(horizontalFlip ? this.rightBox : this.leftBox);
        this._mainBox.add_child(verticalSeparator);
        this._mainBox.add_child(horizontalFlip ? this.leftBox : this.rightBox);

        this.categoriesScrollBox = this._createScrollBox({
            x_expand: true,
            y_expand: true,
            y_align: Clutter.ActorAlign.START,
            style_class: (this._disableFadeEffect ? '' : 'small-vfade'),
        });
        this.leftBox.add_child(this.categoriesScrollBox);

        this.categoriesBox = new St.BoxLayout({ vertical: true });
        this.categoriesScrollBox.add_actor(this.categoriesBox);

        if(Me.settings.get_boolean('enable-activities-shortcut')){
            this.activitiesBox = new St.BoxLayout({
                vertical: true,
                x_expand: true,
                y_expand: true,
                y_align: Clutter.ActorAlign.END
            });
            this.activities = new MW.ActivitiesMenuItem(this);
            this.activitiesBox.add_child(this.activities);
            this.leftBox.add_child(this.activitiesBox);
        }

        const searchBarLocation = Me.settings.get_enum('searchbar-default-top-location');
        if(searchBarLocation === Constants.SearchbarLocation.TOP){
            const separator = new MW.ArcMenuSeparator(Constants.SeparatorStyle.MAX, Constants.SeparatorAlignment.HORIZONTAL);
            separator.style += "margin-bottom: 6px;";

            this.searchBox.add_style_class_name('arcmenu-search-top');
            this.searchBox.style = "margin-bottom: 0px;";

            this.insert_child_at_index(this.searchBox, 0);
            this.insert_child_at_index(separator, 1);
        }
        else if(searchBarLocation === Constants.SearchbarLocation.BOTTOM){
            const separator = new MW.ArcMenuSeparator(Constants.SeparatorStyle.MAX, Constants.SeparatorAlignment.HORIZONTAL);
            separator.style += "margin-top: 6px;";

            this.searchBox.add_style_class_name('arcmenu-search-bottom');
            this.searchBox.style = "margin-top: 0px;";

            this.add_child(separator);
            this.add_child(this.searchBox);
        }

        this.updateWidth();
        this.loadCategories();
        this.loadPinnedApps();
        this.setDefaultMenuView();
    }

    updateWidth(setDefaultMenuView){
        const leftPanelWidthOffset = -70;
        const rightPanelWidthOffset = 70;
        super.updateWidth(setDefaultMenuView, leftPanelWidthOffset, rightPanelWidthOffset);
    }

    setDefaultMenuView(){
        super.setDefaultMenuView();
        this.displayCategories();

        const topCategory = this.categoryDirectories.values().next().value;
        topCategory.displayAppList();
        this.setActiveCategory(topCategory);
    }

    loadCategories(){
        this.categoryDirectories = null;
        this.categoryDirectories = new Map();

        const extraCategories = Me.settings.get_value("extra-categories").deep_unpack();

        for(let i = 0; i < extraCategories.length; i++){
            const categoryEnum = extraCategories[i][0];
            const shouldShow = extraCategories[i][1];
            if(shouldShow){
                const categoryMenuItem = new MW.CategoryMenuItem(this, categoryEnum, Constants.DisplayType.LIST);
                this.categoryDirectories.set(categoryEnum, categoryMenuItem);
            }
        }

        super.loadCategories();
    }

    displayCategories(){
        super.displayCategories(this.categoriesBox);
    }
}