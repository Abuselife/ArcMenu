import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GnomeDesktop from 'gi://GnomeDesktop';
import GObject from 'gi://GObject';
import GWeather from 'gi://GWeather';
import Pango from 'gi://Pango';
import Shell from 'gi://Shell';
import St from 'gi://St';

import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

import {formatTime} from 'resource:///org/gnome/shell/misc/dateUtils.js';
import {loadInterfaceXML} from 'resource:///org/gnome/shell/misc/fileUtils.js';
import * as Weather from 'resource:///org/gnome/shell/misc/weather.js';

const MAX_FORECASTS = 5;
const ClocksIntegrationIface = loadInterfaceXML('org.gnome.Shell.ClocksIntegration');
const ClocksProxy = Gio.DBusProxy.makeProxyWrapper(ClocksIntegrationIface);

/**
 * WorldClocksSection and WeatherSection are not exported in GNOME shell.
 * Copy them here. Used in Raven and Unity layouts.
 */

export const WorldClocksSection = GObject.registerClass(
class ArcMenuWorldClocksSection extends St.Button {
    _init(menuLayout) {
        super._init({
            style_class: 'world-clocks-button',
            can_focus: true,
            x_expand: true,
        });
        this._menuLayout = menuLayout;
        this._clock = new GnomeDesktop.WallClock();
        this._clockNotifyId = 0;
        this._tzNotifyId = 0;

        this._locations = [];

        const layout = new Clutter.GridLayout({orientation: Clutter.Orientation.VERTICAL});
        this._grid = new St.Widget({
            style_class: 'world-clocks-grid',
            x_expand: true,
            layout_manager: layout,
        });
        layout.hookup_style(this._grid);

        this.child = this._grid;

        this._clocksApp = null;
        this._clocksProxy = new ClocksProxy(
            Gio.DBus.session,
            'org.gnome.clocks',
            '/org/gnome/clocks',
            this._onProxyReady.bind(this),
            null /* cancellable */,
            Gio.DBusProxyFlags.DO_NOT_AUTO_START | Gio.DBusProxyFlags.GET_INVALIDATED_PROPERTIES);

        this._settings = new Gio.Settings({
            schema_id: 'org.gnome.shell.world-clocks',
        });
        this._clockChangedID = this._settings.connect('changed', this._clocksChanged.bind(this));
        this._clocksChanged();

        this._appSystem = Shell.AppSystem.get_default();
        this._syncID = this._appSystem.connect('installed-changed',
            this._sync.bind(this));
        this._sync();

        this.connect('destroy', () => this._onDestroy());
    }

    _onDestroy() {
        if (this._syncID) {
            this._appSystem.disconnect(this._syncID);
            this._syncID = null;
        }
        if (this._clockChangedID) {
            this._settings.disconnect(this._clockChangedID);
            this._clockChangedID = null;
        }
        if (this._clocksProxyID) {
            this._clocksProxy.disconnect(this._clocksProxyID);
            this._clocksProxyID = null;
        }
        if (this._clockNotifyId) {
            this._clock.disconnect(this._clockNotifyId);
            this._clockNotifyId = null;
        }
        if (this._tzNotifyId) {
            this._clock.disconnect(this._tzNotifyId);
            this._tzNotifyId = null;
        }
    }

    vfunc_clicked() {
        if (this._clocksApp)
            this._clocksApp.activate();

        this._menuLayout.arcMenu.toggle();
    }

    _sync() {
        this._clocksApp = this._appSystem.lookup_app('org.gnome.clocks.desktop');
        this.visible = this._clocksApp != null;
    }

    _clocksChanged() {
        this._grid.destroy_all_children();
        this._locations = [];

        const world = GWeather.Location.get_world();
        const clocks = this._settings.get_value('locations').deepUnpack();
        for (let i = 0; i < clocks.length; i++) {
            const l = world.deserialize(clocks[i]);
            if (l && l.get_timezone() != null)
                this._locations.push({location: l});
        }

        const unixtime = GLib.DateTime.new_now_local().to_unix();
        this._locations.sort((a, b) => {
            const tzA = a.location.get_timezone();
            const tzB = b.location.get_timezone();
            const intA = tzA.find_interval(GLib.TimeType.STANDARD, unixtime);
            const intB = tzB.find_interval(GLib.TimeType.STANDARD, unixtime);
            return tzA.get_offset(intA) - tzB.get_offset(intB);
        });

        const layout = this._grid.layout_manager;
        const title = this._locations.length === 0
            ? _('Add world clocks…')
            : _('World Clocks');
        const header = new St.Label({
            style_class: 'world-clocks-header',
            x_align: Clutter.ActorAlign.START,
            text: title,
        });
        if (this._grid.text_direction === Clutter.TextDirection.RTL)
            layout.attach(header, 2, 0, 1, 1);
        else
            layout.attach(header, 0, 0, 2, 1);
        this.label_actor = header;

        for (let i = 0; i < this._locations.length; i++) {
            const l = this._locations[i].location;

            const name = l.get_city_name() || l.get_name();
            const label = new St.Label({
                style_class: 'world-clocks-city',
                text: name,
                x_align: Clutter.ActorAlign.START,
                y_align: Clutter.ActorAlign.CENTER,
                x_expand: true,
            });

            const time = new St.Label({style_class: 'world-clocks-time'});

            const tz = new St.Label({
                style_class: 'world-clocks-timezone',
                x_align: Clutter.ActorAlign.END,
                y_align: Clutter.ActorAlign.CENTER,
            });

            time.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;
            tz.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;

            if (this._grid.text_direction === Clutter.TextDirection.RTL) {
                layout.attach(tz, 0, i + 1, 1, 1);
                layout.attach(time, 1, i + 1, 1, 1);
                layout.attach(label, 2, i + 1, 1, 1);
            } else {
                layout.attach(label, 0, i + 1, 1, 1);
                layout.attach(time, 1, i + 1, 1, 1);
                layout.attach(tz, 2, i + 1, 1, 1);
            }

            this._locations[i].timeLabel = time;
            this._locations[i].tzLabel = tz;
        }

        if (this._grid.get_n_children() > 1) {
            if (!this._clockNotifyId) {
                this._clockNotifyId =
                    this._clock.connect('notify::clock', this._updateTimeLabels.bind(this));
            }
            if (!this._tzNotifyId) {
                this._tzNotifyId =
                    this._clock.connect('notify::timezone', this._updateTimezoneLabels.bind(this));
            }
            this._updateTimeLabels();
            this._updateTimezoneLabels();
        } else {
            if (this._clockNotifyId)
                this._clock.disconnect(this._clockNotifyId);
            this._clockNotifyId = 0;

            if (this._tzNotifyId)
                this._clock.disconnect(this._tzNotifyId);
            this._tzNotifyId = 0;
        }
    }

    _getTimezoneOffsetAtLocation(location) {
        const tz = location.get_timezone();
        const localOffset = GLib.DateTime.new_now_local().get_utc_offset();
        const utcOffset = GLib.DateTime.new_now(tz).get_utc_offset();
        const offsetCurrentTz = utcOffset - localOffset;
        const offsetHours =
            Math.floor(Math.abs(offsetCurrentTz) / GLib.TIME_SPAN_HOUR);
        const offsetMinutes =
            (Math.abs(offsetCurrentTz) % GLib.TIME_SPAN_HOUR) /
            GLib.TIME_SPAN_MINUTE;

        const prefix = offsetCurrentTz >= 0 ? '+' : '-';
        const text = offsetMinutes === 0
            ? `${prefix}${offsetHours}`
            : `${prefix}${offsetHours}\u2236${offsetMinutes}`;
        return text;
    }

    _updateTimeLabels() {
        for (let i = 0; i < this._locations.length; i++) {
            const l = this._locations[i];
            const now = GLib.DateTime.new_now(l.location.get_timezone());
            l.timeLabel.text = formatTime(now, {timeOnly: true});
        }
    }

    _updateTimezoneLabels() {
        for (let i = 0; i < this._locations.length; i++) {
            const l = this._locations[i];
            l.tzLabel.text = this._getTimezoneOffsetAtLocation(l.location);
        }
    }

    _onProxyReady(proxy, error) {
        if (error) {
            log(`Failed to create GNOME Clocks proxy: ${error}`);
            return;
        }

        this._clocksProxyID = this._clocksProxy.connect('g-properties-changed',
            this._onClocksPropertiesChanged.bind(this));
        this._onClocksPropertiesChanged();
    }

    _onClocksPropertiesChanged() {
        if (this._clocksProxy.g_name_owner == null)
            return;

        this._settings.set_value('locations',
            new GLib.Variant('av', this._clocksProxy.Locations));
    }
});

export const WeatherSection = GObject.registerClass(
class ArcMenuWorldWeatherSection extends St.Button {
    _init(menuLayout) {
        super._init({
            style_class: 'weather-button',
            can_focus: true,
            x_expand: true,
        });
        this._menuLayout = menuLayout;
        this._weatherClient = new Weather.WeatherClient();

        const box = new St.BoxLayout({
            style_class: 'weather-box',
            vertical: true,
            x_expand: true,
        });

        this.child = box;

        const titleBox = new St.BoxLayout({style_class: 'weather-header-box'});
        this._titleLabel = new St.Label({
            style_class: 'weather-header',
            x_align: Clutter.ActorAlign.START,
            x_expand: true,
            y_align: Clutter.ActorAlign.END,
        });
        titleBox.add_child(this._titleLabel);
        box.add_child(titleBox);

        this._titleLocation = new St.Label({
            style_class: 'weather-header location',
            x_align: Clutter.ActorAlign.END,
            y_align: Clutter.ActorAlign.END,
        });
        titleBox.add_child(this._titleLocation);

        const layout = new Clutter.GridLayout({orientation: Clutter.Orientation.VERTICAL});
        this._forecastGrid = new St.Widget({
            style_class: 'weather-grid',
            layout_manager: layout,
        });
        layout.hookup_style(this._forecastGrid);
        box.add_child(this._forecastGrid);

        this._weatherClient.connect('changed', this._sync.bind(this));
        this._sync();
        this.connect('destroy', () => this._onDestroy());
    }

    _onDestroy() {
        this._weatherClient.disconnectAll();
        this._weatherClient = null;
        delete this._weatherClient;
    }

    vfunc_map() {
        this._weatherClient.update();
        super.vfunc_map();
    }

    vfunc_clicked() {
        this._weatherClient.activateApp();

        this._menuLayout.arcMenu.toggle();
    }

    _getInfos() {
        const forecasts = this._weatherClient.info.get_forecast_list();

        const now = GLib.DateTime.new_now_local();
        let current = GLib.DateTime.new_from_unix_local(0);
        const infos = [];
        for (let i = 0; i < forecasts.length; i++) {
            const [valid, timestamp] = forecasts[i].get_value_update();
            if (!valid || timestamp === 0)
                continue;  // 0 means 'never updated'

            const datetime = GLib.DateTime.new_from_unix_local(timestamp);
            if (now.difference(datetime) > 0)
                continue; // Ignore earlier forecasts

            if (datetime.difference(current) < GLib.TIME_SPAN_HOUR)
                continue; // Enforce a minimum interval of 1h

            if (infos.push(forecasts[i]) === MAX_FORECASTS)
                break; // Use a maximum of five forecasts

            current = datetime;
        }
        return infos;
    }

    _addForecasts() {
        const layout = this._forecastGrid.layout_manager;

        const infos = this._getInfos();
        if (this._forecastGrid.text_direction === Clutter.TextDirection.RTL)
            infos.reverse();

        let col = 0;
        infos.forEach(fc => {
            const [valid_, timestamp] = fc.get_value_update();
            const timeStr = formatTime(new Date(timestamp * 1000), {
                timeOnly: true,
                ampm: false,
            });
            const [, tempValue] = fc.get_value_temp(GWeather.TemperatureUnit.DEFAULT);
            const tempPrefix = Math.round(tempValue) >= 0 ? ' ' : '';

            const time = new St.Label({
                style_class: 'weather-forecast-time',
                text: timeStr,
                x_align: Clutter.ActorAlign.CENTER,
            });
            const icon = new St.Icon({
                style_class: 'weather-forecast-icon',
                icon_name: fc.get_symbolic_icon_name(),
                x_align: Clutter.ActorAlign.CENTER,
                x_expand: true,
            });
            const temp = new St.Label({
                style_class: 'weather-forecast-temp',
                text: `${tempPrefix}${Math.round(tempValue)}°`,
                x_align: Clutter.ActorAlign.CENTER,
            });

            temp.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;
            time.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;

            layout.attach(time, col, 0, 1, 1);
            layout.attach(icon, col, 1, 1, 1);
            layout.attach(temp, col, 2, 1, 1);
            col++;
        });
    }

    _setStatusLabel(text) {
        const layout = this._forecastGrid.layout_manager;
        const label = new St.Label({text});
        layout.attach(label, 0, 0, 1, 1);
    }

    _findBestLocationName(loc) {
        const locName = loc.get_name();

        if (loc.get_level() === GWeather.LocationLevel.CITY ||
            !loc.has_coords())
            return locName;

        const world = GWeather.Location.get_world();
        const city = world.find_nearest_city(...loc.get_coords());
        const cityName = city.get_name();

        return locName.includes(cityName) ? cityName : locName;
    }

    _updateForecasts() {
        this._forecastGrid.destroy_all_children();

        if (!this._weatherClient.hasLocation)
            return;

        const {info} = this._weatherClient;
        this._titleLocation.text = this._findBestLocationName(info.location);

        if (this._weatherClient.loading) {
            this._setStatusLabel(_('Loading…'));
            return;
        }

        if (info.is_valid()) {
            this._addForecasts();
            return;
        }

        if (info.network_error())
            this._setStatusLabel(_('Go online for weather information'));
        else
            this._setStatusLabel(_('Weather information is currently unavailable'));
    }

    _sync() {
        this.visible = this._weatherClient.available;

        if (!this.visible)
            return;

        if (this._weatherClient.hasLocation)
            this._titleLabel.text = _('Weather');
        else
            this._titleLabel.text = _('Select weather location…');

        this._forecastGrid.visible = this._weatherClient.hasLocation;
        this._titleLocation.visible = this._weatherClient.hasLocation;

        this._updateForecasts();
    }
});
