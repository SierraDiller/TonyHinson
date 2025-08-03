// Case Studies API for AI Agent Integration
// This file provides a scalable interface for managing case studies

class CaseStudiesAPI {
	constructor() {
		this.caseStudies = [];
		this.nextId = 1;
		this.loadFromStorage();
	}

	// Load case studies from localStorage (or could be from a database)
	loadFromStorage() {
		const stored = localStorage.getItem("caseStudies");
		if (stored) {
			this.caseStudies = JSON.parse(stored);
			this.nextId =
				Math.max(...this.caseStudies.map((cs) => parseInt(cs.id) || 0), 0) + 1;
		}
	}

	// Save case studies to localStorage
	saveToStorage() {
		localStorage.setItem("caseStudies", JSON.stringify(this.caseStudies));
	}

	// Generate unique ID
	generateId() {
		return `case_${this.nextId++}`;
	}

	// Add a new case study
	addCaseStudy(caseStudyData) {
		// Validate required fields
		const requiredFields = [
			"name",
			"sport",
			"goal",
			"duration",
			"highlight",
			"tags",
			"date",
		];
		const missingFields = requiredFields.filter(
			(field) => !caseStudyData[field]
		);

		if (missingFields.length > 0) {
			throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
		}

		// Create new case study with defaults
		const newCaseStudy = {
			id: caseStudyData.id || this.generateId(),
			image: caseStudyData.image || `${caseStudyData.id || "default"}-case.jpg`,
			results: caseStudyData.results || {},
			description:
				caseStudyData.description ||
				`${caseStudyData.name}'s transformation journey.`,
			beforeAfter: caseStudyData.beforeAfter || {
				before: "Before transformation",
				after: "After transformation",
			},
			...caseStudyData,
		};

		// Check for duplicate ID
		if (this.caseStudies.find((cs) => cs.id === newCaseStudy.id)) {
			throw new Error(`Case study with ID ${newCaseStudy.id} already exists`);
		}

		this.caseStudies.push(newCaseStudy);
		this.saveToStorage();
		return newCaseStudy;
	}

	// Update an existing case study
	updateCaseStudy(id, updates) {
		const index = this.caseStudies.findIndex((cs) => cs.id === id);
		if (index === -1) {
			throw new Error(`Case study with ID ${id} not found`);
		}

		this.caseStudies[index] = { ...this.caseStudies[index], ...updates };
		this.saveToStorage();
		return this.caseStudies[index];
	}

	// Delete a case study
	deleteCaseStudy(id) {
		const index = this.caseStudies.findIndex((cs) => cs.id === id);
		if (index === -1) {
			throw new Error(`Case study with ID ${id} not found`);
		}

		const deleted = this.caseStudies.splice(index, 1)[0];
		this.saveToStorage();
		return deleted;
	}

	// Get all case studies
	getAllCaseStudies() {
		return [...this.caseStudies];
	}

	// Get a specific case study
	getCaseStudy(id) {
		return this.caseStudies.find((cs) => cs.id === id);
	}

	// Search case studies
	searchCaseStudies(query, filters = {}) {
		let results = [...this.caseStudies];

		// Apply search query
		if (query) {
			const searchTerm = query.toLowerCase();
			results = results.filter(
				(cs) =>
					cs.name.toLowerCase().includes(searchTerm) ||
					cs.highlight.toLowerCase().includes(searchTerm) ||
					cs.description.toLowerCase().includes(searchTerm) ||
					cs.sport.toLowerCase().includes(searchTerm) ||
					cs.goal.toLowerCase().includes(searchTerm)
			);
		}

		// Apply tag filters
		if (filters.tags && filters.tags.length > 0) {
			results = results.filter((cs) =>
				filters.tags.some((tag) => cs.tags.includes(tag))
			);
		}

		// Apply date range
		if (filters.startDate) {
			results = results.filter(
				(cs) => new Date(cs.date) >= new Date(filters.startDate)
			);
		}
		if (filters.endDate) {
			results = results.filter(
				(cs) => new Date(cs.date) <= new Date(filters.endDate)
			);
		}

		// Apply sorting
		if (filters.sortBy) {
			results.sort((a, b) => {
				switch (filters.sortBy) {
					case "date":
						return new Date(b.date) - new Date(a.date);
					case "name":
						return a.name.localeCompare(b.name);
					case "impressive":
						return (
							this.calculateImpressiveScore(b) -
							this.calculateImpressiveScore(a)
						);
					default:
						return 0;
				}
			});
		}

		return results;
	}

	// Calculate impressive score for sorting
	calculateImpressiveScore(caseStudy) {
		let score = 0;

		const impactWords = [
			"transformed",
			"increased",
			"improved",
			"gained",
			"lost",
			"recovered",
			"achieved",
		];
		impactWords.forEach((word) => {
			if (caseStudy.highlight.toLowerCase().includes(word)) score += 10;
		});

		Object.values(caseStudy.results).forEach((result) => {
			if (result.includes("+")) score += 5;
			if (result.includes("-")) score += 3;
		});

		return score;
	}

	// Get case study statistics
	getStatistics() {
		const total = this.caseStudies.length;
		const sports = [...new Set(this.caseStudies.map((cs) => cs.sport))];
		const goals = [...new Set(this.caseStudies.map((cs) => cs.goal))];
		const tags = [...new Set(this.caseStudies.flatMap((cs) => cs.tags))];

		return {
			total,
			sports,
			goals,
			tags,
			averageDuration:
				this.caseStudies.reduce((sum, cs) => {
					const duration = parseInt(cs.duration.match(/\d+/)?.[0] || 0);
					return sum + duration;
				}, 0) / total || 0,
		};
	}

	// Export case studies for backup
	exportCaseStudies() {
		return {
			caseStudies: this.caseStudies,
			exportDate: new Date().toISOString(),
			version: "1.0",
		};
	}

	// Import case studies from backup
	importCaseStudies(data) {
		if (!data.caseStudies || !Array.isArray(data.caseStudies)) {
			throw new Error("Invalid import data format");
		}

		this.caseStudies = data.caseStudies;
		this.nextId =
			Math.max(...this.caseStudies.map((cs) => parseInt(cs.id) || 0), 0) + 1;
		this.saveToStorage();
		return this.caseStudies.length;
	}

	// Clear all case studies
	clearAll() {
		this.caseStudies = [];
		this.nextId = 1;
		this.saveToStorage();
	}
}

// AI Agent Integration Interface
class AIAgentInterface {
	constructor(api) {
		this.api = api;
	}

	// Process document and extract case study data
	async processDocument(documentText) {
		// This is where the AI agent would process the document
		// and extract relevant information
		const extractedData = await this.extractCaseStudyData(documentText);
		return this.api.addCaseStudy(extractedData);
	}

	// Extract case study data from document (placeholder for AI processing)
	async extractCaseStudyData(documentText) {
		// This would be replaced with actual AI processing
		// For now, return a template structure
		return {
			name: "Extracted Name",
			sport: "Powerlifting",
			goal: "Strength",
			duration: "6 months",
			highlight: "Achieved significant transformation",
			tags: ["powerlifting", "strength"],
			date: new Date().toISOString().split("T")[0],
			results: {},
			description: "AI-extracted case study from document.",
		};
	}

	// Get template for required case study format
	getCaseStudyTemplate() {
		return {
			id: "unique_id",
			name: "Athlete Name",
			sport: "Powerlifting",
			goal: "Strength/Injury Recovery",
			duration: "X months",
			image: "image-filename.jpg",
			results: {
				squat: "+Xlbs",
				bench: "+Xlbs",
				deadlift: "+Xlbs",
			},
			highlight: "Key achievement or transformation",
			tags: ["powerlifting", "strength", "injuries"],
			date: "YYYY-MM-DD",
			description: "Detailed description of the transformation",
			beforeAfter: {
				before: "Starting condition",
				after: "Final condition",
			},
		};
	}

	// Validate case study data format
	validateCaseStudyData(data) {
		const required = [
			"name",
			"sport",
			"goal",
			"duration",
			"highlight",
			"tags",
			"date",
		];
		const missing = required.filter((field) => !data[field]);

		if (missing.length > 0) {
			return {
				valid: false,
				errors: missing.map((field) => `Missing required field: ${field}`),
			};
		}

		return { valid: true, errors: [] };
	}
}

// Initialize the API
const caseStudiesAPI = new CaseStudiesAPI();
const aiAgentInterface = new AIAgentInterface(caseStudiesAPI);

// Make available globally
window.caseStudiesAPI = caseStudiesAPI;
window.aiAgentInterface = aiAgentInterface;

// Export for Node.js if needed
if (typeof module !== "undefined" && module.exports) {
	module.exports = { CaseStudiesAPI, AIAgentInterface };
}
