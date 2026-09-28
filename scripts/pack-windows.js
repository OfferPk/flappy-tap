#!/usr/bin/env node
const { execFileSync } = require('child_process');
const path = require('path');
execFileSync('python3', [path.join(__dirname, 'pack-windows.py')], { stdio: 'inherit' });
