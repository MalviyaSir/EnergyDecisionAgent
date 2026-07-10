import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const dataPathCandidates = [
    path.resolve(currentDirectory, '../../../dummy-data/meter-data.json'),
    path.resolve(currentDirectory, '../../../../../dummy-data/meter-data.json'),
];
export async function readMeterData() {
    const dataPath = await resolveDataPath();
    const file = await readFile(dataPath, 'utf-8');
    return JSON.parse(file);
}
async function resolveDataPath() {
    for (const candidate of dataPathCandidates) {
        try {
            await access(candidate);
            return candidate;
        }
        catch {
            // Try the next known runtime layout.
        }
    }
    return dataPathCandidates[0];
}
