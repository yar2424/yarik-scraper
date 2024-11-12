import { config } from "./config";
import fs from "fs";

export function getDynamicIDs(filepath = config.itemIDsPath) {
    try {
        // Read the file synchronously and split content by new line
        const data = fs.readFileSync(filepath, 'utf8');
        return data.split(/\r?\n/).filter(line => line.trim() !== '');
    } catch (error) {
        console.error(`Error reading file from path ${filepath}:`, error);
        return [];
    }
}
