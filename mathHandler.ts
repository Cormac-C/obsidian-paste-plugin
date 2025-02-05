interface ClipboardData {
	text: string;
	html?: string;
	mathML?: string;
}

// The clipboard content is often missing information about the full math
// Probably need to go with an OCR approach, anything rule based will have blindspots

class MathClipboardHandler {
	async readClipboard(): Promise<ClipboardData> {
		try {
			const clipboardItems = await navigator.clipboard.read();
			const result: ClipboardData = { text: "" };

			for (const item of clipboardItems) {
				for (const type of item.types) {
					const blob = await item.getType(type);
					const content = await blob.text();

					switch (type) {
						case "text/plain":
							result.text = content;
							break;
						case "text/html":
							result.html = content;
							break;
						case "application/mathml+xml":
							result.mathML = content;
							break;
					}
				}
			}
			return result;
		} catch (e) {
			console.error(e);
			// Fallback to plain text
			const text = await navigator.clipboard.readText();
			return { text };
		}
	}

	convertToLatex(data: ClipboardData): string {
		console.log("Converting to latex", data);
		if (data.mathML) {
			return this.convertMathMLToLatex(data.mathML);
		} else if (data.html) {
			return this.convertHtmlToLatex(data.html);
		} else {
			return this.convertTextToLatex(data.text);
		}
	}

	convertMathMLToLatex(mathML: string): string {
		// Convert MathML to LaTeX
		// Basic MathML to LaTeX conversion rules
		const conversionRules = new Map([
			[/<msup>/g, "^{"],
			[/<\/msup>/g, "}"],
			[/<msub>/g, "_{"],
			[/<\/msub>/g, "}"],
			[/<mfrac>/g, "\\frac{"],
			[/<\/mfrac>/g, "}"],
			[/<mi>π<\/mi>/g, "\\pi"],
			// Add more rules as needed
		]);

		let latex = mathML;
		for (const [pattern, replacement] of conversionRules) {
			latex = latex.replace(pattern, replacement);
		}

		// Clean up remaining XML tags
		latex = latex.replace(/<[^>]+>/g, "");
		return latex;
	}

	convertHtmlToLatex(html: string): string {
		// Handle subscripts and superscripts in HTML
		let latex = html;
		latex = latex.replace(/<sup>(.*?)<\/sup>/g, "^{$1}");
		latex = latex.replace(/<sub>(.*?)<\/sub>/g, "_{$1}");
		latex = latex.replace(
			/<span class="s1" style="font: 7px Helvetica;">(.*?)<\/span>/g,
			"_{$1}"
		); // This is a hacky handling of some timescripts but might be ambiguous

		// Remove remaining HTML tags
		latex = latex.replace(/<[^>]+>/g, "");

		// Convert common Unicode math symbols
		latex = this.convertUnicodeToLatex(latex);

		return latex;
	}

	convertTextToLatex(text: string): string {
		// Convert plain text to LaTeX
		return this.convertUnicodeToLatex(text);
	}

	convertUnicodeToLatex(text: string): string {
		const unicodeToLatex = new Map([
			["²", "^{2}"],
			["³", "^{3}"],
			["₁", "_{1}"],
			["₂", "_{2}"],
			["π", "\\pi"],
			["∑", "\\sum"],
			["∫", "\\int"],
			["∞", "\\infty"],
			["×", "\\times"],
			["÷", "\\div"],
			["±", "\\pm"],
			["∈", "\\in"],
			["√", "\\sqrt"],
			["≠", "\\neq"],
			["≤", "\\leq"],
			["≥", "\\geq"],
			["∝", "\\propto"],
			["∀", "\\forall"],
			["∃", "\\exists"],
			["∅", "\\emptyset"],
			["∈", "\\in"],
			["∉", "\\notin"],
			["∩", "\\cap"],
			["∪", "\\cup"],
			["∧", "\\land"],
			["∨", "\\lor"],
			["¬", "\\lnot"],
			["⇒", "\\Rightarrow"],
			["⇔", "\\Leftrightarrow"],
			// Add more mappings as needed
		]);

		let latex = text;
		for (const [unicode, replacement] of unicodeToLatex) {
			latex = latex.replace(new RegExp(unicode, "g"), replacement + " ");
		}
		return latex;
	}
}

export default MathClipboardHandler;
