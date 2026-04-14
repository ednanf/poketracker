import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 1. Path Resolution for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Constants
const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const NATIONAL_DEX_URL = `${POKEAPI_BASE}/pokedex/1`;

// 3. Types for internal script safety
interface RawPokeApiEntry {
    entry_number: number;
    pokemon_species: {
        name: string;
        url: string;
    };
}

interface CatalogEntry {
    id: string; // e.g., "001-base"
    name: string; // e.g., "bulbasaur"
}

interface DexCatalog {
    national: {
        total: number;
        entries: CatalogEntry[];
    };
    regional: Record<string, undefined>; // Placeholder for future MVP expansions
}

async function generateCatalog() {
    console.log('Initiating PokeAPI Extraction Protocol...');

    try {
        // ==========================================
        // PHASE 1: EXTRACTION
        // ==========================================
        console.log(`Fetching National Dex data from: ${NATIONAL_DEX_URL}`);
        const response = await fetch(NATIONAL_DEX_URL);

        if (!response.ok) {
            console.error(
                `\nCRITICAL FAILURE: PokeAPI responded with status: ${response.status}`,
            );
            process.exit(1);
        }

        const data = await response.json();
        const rawEntries: RawPokeApiEntry[] = data.pokemon_entries;

        console.log(`Successfully extracted ${rawEntries.length} raw entries.`);

        // ==========================================
        // PHASE 2: TRANSFORMATION
        // ==========================================
        console.log(
            'Transforming data to strict identifier schema ([ID]-base)...',
        );

        const nationalEntries: CatalogEntry[] = rawEntries.map((entry) => {
            // Pad the National Dex ID to 3 digits (e.g., 1 -> "001", 25 -> "025")
            // Expand padding to 4 digits if ID > 999
            const paddedId = String(entry.entry_number).padStart(3, '0');

            return {
                // Enforce the composite string identifier required by MongoDB
                id: `${paddedId}-base`,
                name: entry.pokemon_species.name,
            };
        });

        const catalog: DexCatalog = {
            national: {
                total: nationalEntries.length,
                entries: nationalEntries,
            },
            regional: {}, // We will map specific Switch games here in V2
        };

        // ==========================================
        // PHASE 3: LOADING (Writing Artifact)
        // ==========================================
        // Navigating up from: apps/backend/scripts -> apps/backend -> apps -> root
        const outputPath = path.join(
            __dirname,
            '../../../packages/shared/data/dex-catalog.json',
        );

        console.log(`Ensuring directory exists: ${path.dirname(outputPath)}`);
        await fs.mkdir(path.dirname(outputPath), { recursive: true });

        console.log(
            'Writing highly compressed JSON artifact to shared package...',
        );
        // We intentionally do not use formatting spaces (JSON.stringify(..., null, 2))
        // to minimize the file size for browser caching.
        await fs.writeFile(outputPath, JSON.stringify(catalog));

        console.log(`\nSUCCESS: Architecture unblocked. Catalog generated at:`);
        console.log(outputPath);
    } catch (error) {
        console.error('\nCRITICAL FAILURE during catalog generation:');
        console.error(error);
        process.exit(1);
    }
}

// Execute
await generateCatalog();
