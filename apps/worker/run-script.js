#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const [,, scriptName, ...args] = process.argv;

if (!scriptName) {
    console.error('You must provide the script name to run');
    process.exit(1);
}

const env = process.env.NODE_ENV || 'development';

const envPath = path.resolve(process.cwd(), `.env.${env}`);
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const argsString = args.map(arg => `"${arg}"`).join(' ');

try {
    execSync(`tsx scripts/${scriptName} ${argsString}`, { stdio: 'inherit', env: process.env });
} catch (err) {
    if (err.stderr) {
        const message = Buffer.isBuffer(err.stderr) ? err.stderr.toString() : err.stderr;
        console.error(message);
    } else {
        console.error(err.message);
    }
    process.exit(err.status || 1);
}
