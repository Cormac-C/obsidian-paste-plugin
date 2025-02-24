import {
	App,
	Editor,
	MarkdownView,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

interface PDFPastePluginSettings {
	mergeHyphenatedWords: boolean;
}

const DEFAULT_SETTINGS: PDFPastePluginSettings = {
	mergeHyphenatedWords: true,
};

export default class PDFPastePlugin extends Plugin {
	settings: PDFPastePluginSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "paste-cleaned-text",
			name: "Paste cleaned text",
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				await this.pasteCleanedText(editor);
			},
		});

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor, view) => {
				menu.addItem((item) => {
					item.setIcon("clipboard");
					item.setTitle("Paste cleaned text");
					item.onClick(async () => {
						await this.pasteCleanedText(editor);
					});
				});
			})
		);

		this.addSettingTab(new PDFPasteSettingTab(this.app, this));
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

class PDFPasteSettingTab extends PluginSettingTab {
	plugin: PDFPastePlugin;

	constructor(app: App, plugin: PDFPastePlugin) {
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
