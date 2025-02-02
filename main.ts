import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

// Remember to rename these classes and interfaces!

interface BetterPastePluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: BetterPastePluginSettings = {
	mySetting: "default",
};

export default class BetterPastePlugin extends Plugin {
	settings: BetterPastePluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"dice",
			"Paste Plugin",
			(evt: MouseEvent) => {
				// Called when the user clicks the icon.
				new Notice("This is a notice!");
			}
		);

		this.addCommand({
			id: "paste-cleaned-text",
			name: "Paste Cleaned Text",
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				await this.pasteCleanedText(editor);
			},
			hotkeys: [
				{
					modifiers: ["Mod", "Shift"],
					key: "v",
				},
			],
		});
		// Look at how paste is handled here: https://github.com/denolehov/obsidian-url-into-selection/blob/master/src/main.ts

		// This adds a settings tab so the user can configure various aspects of the plugin
		// this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			console.log("click", evt);
		});
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async pasteCleanedText(editor: Editor): Promise<void> {
		const clipboardText = await navigator.clipboard.readText();
		const cleanedText = this.cleanText(clipboardText);
		editor.replaceSelection(cleanedText);
	}

	cleanText(text: string): string {
		// TODO: look at making it more customizable
		const cleanedText = text
			.replace(/-\s*\n\s*/g, "") // Merge hyphenated words
			.replace(/(\r\n|\n|\r)/gm, " ") // Replace all newlines with spaces
			.replace(/\s{2,}/g, " ") // Replace multiple spaces with a single space
			.trim();
		return cleanedText;
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: BetterPastePlugin;

	constructor(app: App, plugin: BetterPastePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
