import {
	App,
	Editor,
	MarkdownView,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

interface BetterPastePluginSettings {
	mergeHyphenatedWords: boolean;
}

const DEFAULT_SETTINGS: BetterPastePluginSettings = {
	mergeHyphenatedWords: true,
};

export default class BetterPastePlugin extends Plugin {
	settings: BetterPastePluginSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "paste-cleaned-text",
			name: "Paste Cleaned Text",
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				await this.pasteCleanedText(editor);
			},
		});

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor, view) => {
				menu.addItem((item) => {
					item.setIcon("clipboard");
					item.setTitle("Paste Cleaned Text");
					item.onClick(async () => {
						await this.pasteCleanedText(editor);
					});
				});
			})
		);

		this.addSettingTab(new BetterPasteSettingTab(this.app, this));
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
		let cleanedText = text;
		if (this.settings.mergeHyphenatedWords) {
			cleanedText = text.replace(/-\s*\n\s*/g, ""); // Merge hyphenated words
		}

		cleanedText = cleanedText
			.replace(/(\r\n|\n|\r)/gm, " ") // Replace all newlines with spaces
			.replace(/\s{2,}/g, " ") // Replace multiple spaces with a single space
			.trim();

		return cleanedText;
	}
}

class BetterPasteSettingTab extends PluginSettingTab {
	plugin: BetterPastePlugin;

	constructor(app: App, plugin: BetterPastePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Merge hyphenated words")
			.setDesc(
				"Merge words that are hyphenated across multiple lines. E.g. 'hyphen-\nated' will become 'hyphenated'. Note this could potentially get rid of intentional dashes."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.mergeHyphenatedWords)
					.onChange(async (value) => {
						this.plugin.settings.mergeHyphenatedWords = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
