/**
 * @name InMyVoice
 * @author arg0NNY
 * @authorLink https://github.com/arg0NNY/DiscordPlugins
 * @invite M8DBtcZjXD
 * @version 1.1.3.1
 * @description Shows if a person in the text chat is also in a voice chat you're in.
 * @website https://github.com/CallMeMM/InMyVoiceUpdated/tree/main/InMyVoice-Updated
 * @source https://github.com/CallMeMM/InMyVoiceUpdated/blob/main/InMyVoice-Updated/InMyVoice-Updated.plugin.js
 * @updateUrl https://raw.githubusercontent.com/CallMeMM/InMyVoiceUpdated/main/InMyVoice-Updated/InMyVoice-Updated.plugin.js
 */

module.exports = (() => {
    const config = {
        "info": {
            "name": "InMyVoice",
            "authors": [
                {
                    "name": "Author: arg0NNY | Modded by: CallMeM",
                    "discord_id": '224538553944637440',
                    "github_username": 'arg0NNY'
                }
            ],
            "version": "1.1.3",
            "description": "Shows if a person in the text chat is also in a voice chat you're in.",
            github: "https://github.com/CallMeMM/InMyVoiceUpdated/tree/main/InMyVoice-Updated",
            github_raw: "https://raw.githubusercontent.com/CallMeMM/InMyVoiceUpdated/main/InMyVoice-Updated/InMyVoice-Updated.plugin.js"
        },
        "changelog": [
            {
                "type": "added",
                "title": "New Features",
                "items": [
                    "Users can now **change the background color** of the tag.",
                    "Added an option to **adjust the transparency** of the background.",
                    "Option to **make the background completely transparent**, removing the background color."
                ]
            },
            {
                "type": "fixed",
                "title": "Bug Fixes",
                "items": [
                    "Fixed a bug where the **text doesn't show**. This will be fixed ASAP."
                ]
            }
        ],
        "defaultConfig": [
    {
        type: 'textbox',
        id: 'text',
        name: 'Tag Text',
        note: 'Sets up tag\'s text near user\'s name.',
        value: 'In voice'
    },
    {
        type: 'category',
        id: 'appearance',
        name: 'CallMeM New Settings', // Title for the dropdown
        note: 'Customize the appearance of the tag.',
        settings: [
            {
                type: 'color',
                id: 'backgroundColor',
                name: 'Background Color',
                note: 'Changes the background color of the icon container.',
                value: '#7289da'
            },
            {
                type: 'switch',
                id: 'transparentBackground',
                name: 'Transparent Background',
                note: 'Toggle to make the background transparent, showing only the icon.',
                value: false
            },
            {
                type: 'slider',
                id: 'backgroundAlpha',
                name: 'Background Alpha',
                note: 'Adjusts the transparency of the background color (0 = fully transparent, 100 = fully opaque).',
                value: 100,
                min: 0,
                max: 100,
                step: 1
            }
        ]
    }
]
    };

    return !global.ZeresPluginLibrary ? class {
        constructor() {
            this._config = config;
        }

        getName() { return config.info.name; }
        getAuthor() { return config.info.authors.map(a => a.name).join(", "); }
        getDescription() { return config.info.description; }
        getVersion() { return config.info.version; }

        load() {
            BdApi.UI.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
                confirmText: "Download Now",
                cancelText: "Cancel",
                onConfirm: () => {
                    require("request").get("https://raw.githubusercontent.com/zerebos/BDPluginLibrary/master/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.app/Download?id=9");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                    });
                }
            });
        }
        start() { }
        stop() { }
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Api) => {
            const {
                WebpackModules,
                Patcher,
                Utilities,
                DiscordModules
            } = Api;

            const {
                Webpack
            } = BdApi;

            const {
                React,
                UserStore,
                ChannelStore,
                SelectedChannelStore
            } = DiscordModules;

            const Selectors = {
                BotTag: {
                    ...WebpackModules.getByProps('botTagCozy'),
                    botTagVerified: WebpackModules.getByProps('botTagVerified').botTagVerified
                }
            };

            const UNIQUE_TAG = 'InMyVoiceTag';

            const VoiceChannelStore = WebpackModules.getByProps('getVoiceStatesForChannel');
            const MessageHeader = [...Webpack.getWithKey(Webpack.Filters.byStrings('decorations', 'withMentionPrefix'))];
            const BotTag = [...Webpack.getWithKey(m => m?.Types?.SYSTEM_DM)];
            const useStateFromStores = Webpack.getModule(Webpack.Filters.byStrings('useStateFromStores'), { searchExports: true });

            function isInMyVoice(user) {
                const voiceChannelId = useStateFromStores([SelectedChannelStore], () => SelectedChannelStore.getVoiceChannelId());
                const currentUser = useStateFromStores([UserStore], () => UserStore.getCurrentUser());
                const channel = useStateFromStores([ChannelStore], () => voiceChannelId && ChannelStore.getChannel(voiceChannelId));
                const voiceState = useStateFromStores([VoiceChannelStore], () => channel && VoiceChannelStore.getVoiceStatesForChannel(channel));

                if (currentUser.id === user.id || !channel) return false;

                const values = Object.values(voiceState);
                return values.findIndex(x => x.user?.id === user.id) !== -1;
            }

            function InVoiceTag({ user }) {
                if (!isInMyVoice(user)) return null;
            
                const { backgroundColor, transparentBackground, backgroundAlpha } = this.settings.appearance;
            
                // If transparentBackground is enabled, set the background to 'transparent'
                const backgroundStyle = transparentBackground ? 'transparent' : backgroundColor || '#7289da';
            
                // Parse the background color to RGBA
                const alpha = backgroundAlpha / 100; // Convert to a fraction (0-1)
                const hexToRgb = (hex) => {
                    // Ensure hex is formatted correctly
                    if (hex.startsWith('#')) hex = hex.slice(1);
                    const bigint = parseInt(hex, 16);
                    const r = (bigint >> 16) & 255;
                    const g = (bigint >> 8) & 255;
                    const b = bigint & 255;
            
                    return `rgba(${r}, ${g}, ${b}, ${transparentBackground ? 0 : alpha})`; // Set transparency
                };
            
                const colorWithAlpha = hexToRgb(backgroundStyle);
            
                return React.createElement('div', {
                    className: `${Selectors.BotTag.botTagCozy} ${UNIQUE_TAG}`,
                    style: {
                        backgroundColor: colorWithAlpha, // Set background color with transparency
                        display: 'inline-flex',
                        alignItems: 'center',
                        borderRadius: '5px',
                        color: '#ffffff',  // Ensure text is visible
                        padding: '0px', // Remove padding to reduce size
                        margin: '0 3px', // Add small margin for spacing
                        height: '19px', // Set a default height
                        lineHeight: '13px' // Align text vertically
                    }
                }, 
                this.buildInVoiceIcon() // Render the icon directly
                );
            }            

            return class InMyVoice extends Plugin {
                onStart() {
                    this.patches();
                }

                patches() {
                    this.patchMessages();
                    this.patchBotTags();
                }

                patchMessages() {
                    Patcher.before(...MessageHeader, (self, [{ decorations, message }]) => {
                        if (!decorations || typeof decorations[1] !== 'object' || !'length' in decorations[1]) return;

                        decorations[1].unshift(
                          React.createElement(InVoiceTag.bind(this), { user: message.author })
                        );
                    });
                }

                patchBotTags() {
                    Patcher.after(...BotTag, (self, _, value) => {
                        if (!value.props?.className?.includes(UNIQUE_TAG)) return;

                        // Ensure only one instance of the tag is added
                        const TagContainer = Utilities.findInReactTree(value, e => e.children?.some(c => typeof c?.props?.children === 'string'));
                        if (TagContainer.children.some(c => c.props?.className?.includes(UNIQUE_TAG))) return;

                        TagContainer.children.unshift(React.createElement(InVoiceTag.bind(this), { user: value.props.user }));
                    });
                }

                buildInVoiceIcon() {
                    return React.createElement(
                        'svg',
                        {
                            className: Selectors.BotTag.botTagVerified,
                            width: 16,
                            height: 15,
                            viewBox: '0 0 28 25',
                            style: {
                                marginLeft: '2px', // Spacing between icon and text
                            }
                        },
                        React.createElement('path', {
                            fill: 'currentColor',
                            d: 'M3 10v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71V6.41c0-.89-1.08-1.34-1.71-.71L7 9H4c-.55 0-1 .45-1 1zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 4.45v.2c0 .38.25.71.6.85C17.18 6.53 19 9.06 19 12s-1.82 5.47-4.4 6.5c-.36.14-.6.47-.6.85v.2c0 .63.63 1.07 1.21.85C18.6 19.11 21 15.84 21 12s-2.4-7.11-5.79-8.4c-.58-.23-1.21.22-1.21.85z'
                        })
                    );
                }

                onStop() {
                    Patcher.unpatchAll();
                }

                getSettingsPanel() {
                    const settingsPanel = document.createElement('div');
                
                    settingsPanel.appendChild(this.buildSettingsPanel().getElement());
                    
                    return settingsPanel;
                }                
            }
        }

        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
