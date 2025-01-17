# Basic Makefile

UUID = arcmenu@arcmenu.com
BASE_MODULES = COPYING extension.js keybinder.js metadata.json README.md stylesheet.css theming.js
EXTRA_MODULES = appMenu.js arcmenuManager.js constants.js controller.js iconGrid.js menuButton.js menuWidgets.js placeDisplay.js prefs.js prefsWidgets.js recentFilesManager.js search.js standaloneRunner.js utils.js

TOLOCALIZE = $(EXTRA_MODULES) menulayouts/* settings/*

EXTRA_DIRECTORIES = icons menulayouts searchProviders settings

MSGSRC = $(wildcard po/*.po)
ifeq ($(strip $(DESTDIR)),)
	INSTALLTYPE = local
	INSTALLBASE = $(HOME)/.local/share/gnome-shell/extensions
else
	INSTALLTYPE = system
	SHARE_PREFIX = $(DESTDIR)/usr/share
	INSTALLBASE = $(SHARE_PREFIX)/gnome-shell/extensions
endif
INSTALLNAME = arcmenu@arcmenu.com

# The command line passed variable VERSION is used to set the version string
# in the metadata and in the generated zip-file. If no VERSION is passed, the
# version is pulled from the latest git tag and the current commit SHA1 is 
# added to the metadata
ifdef VERSION
	FILESUFFIX = _v$(VERSION)
else
	COMMIT = $(shell git rev-parse HEAD)
	VERSION = 
	FILESUFFIX =
endif

all: extension

clean:
	rm -f ./schemas/gschemas.compiled

extension: ./schemas/gschemas.compiled $(MSGSRC:.po=.mo)

./schemas/gschemas.compiled: ./schemas/org.gnome.shell.extensions.arcmenu.gschema.xml
	glib-compile-schemas ./schemas/

potfile: ./po/arcmenu.pot

mergepo: potfile
	for l in $(MSGSRC); do \
		msgmerge -U $$l ./po/arcmenu.pot; \
	done;

./po/arcmenu.pot: $(TOLOCALIZE)
	mkdir -p po
	xgettext -k_ -kN_ --from-code utf-8 -o po/arcmenu.pot --package-name "ArcMenu" $(TOLOCALIZE)

./po/%.mo: ./po/%.po
	msgfmt -c $< -o $@

install: install-local

install-local: _build
	rm -rf $(INSTALLBASE)/$(INSTALLNAME)
	mkdir -p $(INSTALLBASE)/$(INSTALLNAME)
	cp -r ./_build/* $(INSTALLBASE)/$(INSTALLNAME)/
ifeq ($(INSTALLTYPE),system)
	# system-wide settings and locale files
	rm -r $(INSTALLBASE)/$(INSTALLNAME)/schemas $(INSTALLBASE)/$(INSTALLNAME)/locale
	mkdir -p $(SHARE_PREFIX)/glib-2.0/schemas $(SHARE_PREFIX)/locale
	cp -r ./schemas/*gschema.* $(SHARE_PREFIX)/glib-2.0/schemas
	cp -r ./_build/locale/* $(SHARE_PREFIX)/locale
endif
	-rm -fR _build
	echo done

zip-file: _build
	cd _build ; \
	zip -qr "$(UUID)$(FILESUFFIX).zip" .
	mv _build/$(UUID)$(FILESUFFIX).zip ./
	-rm -fR _build

_build: all
	-rm -fR ./_build
	mkdir -p _build
	cp $(BASE_MODULES) $(EXTRA_MODULES) _build
	cp -r $(EXTRA_DIRECTORIES) _build
	mkdir -p _build/schemas
	cp schemas/*.xml _build/schemas/
	cp schemas/gschemas.compiled _build/schemas/
	mkdir -p _build/locale
	for l in $(MSGSRC:.po=.mo) ; do \
		lf=_build/locale/`basename $$l .mo`; \
		mkdir -p $$lf; \
		mkdir -p $$lf/LC_MESSAGES; \
		cp $$l $$lf/LC_MESSAGES/arcmenu.mo; \
	done;
ifneq ($(COMMIT),)
	sed -i '/"version": .*,/a "commit": "$(COMMIT)",'  _build/metadata.json;
else ifneq ($(VERSION),)
	sed -i 's/"version": .*,/"version": $(VERSION),/'  _build/metadata.json;
endif
