#!/bin/sh
set -e

# config package
echo "Building @ultimate-leads/config..."
cd /app/packages/config
npx tsc || true
mkdir -p dist src
if [ -d dist ]; then cp -r dist/. src/; fi
if [ -d src ]; then cp -r src/. dist/; fi
echo "config: done"

# shared package
echo "Building @ultimate-leads/shared..."
cd /app/packages/shared
npx tsc || true
mkdir -p dist src
if [ -d dist ]; then cp -r dist/. src/; fi
if [ -d src ]; then cp -r src/. dist/; fi
echo "shared: done"

# database package - no tsconfig, write compiled CJS directly
echo "Building @ultimate-leads/database..."
mkdir -p /app/packages/database/src /app/packages/database/dist

cat > /app/packages/database/src/prisma.js << 'JSEOF'
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
__exportStar(require("@prisma/client"), exports);
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma || (new client_1.PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
}));
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = exports.prisma;
}
JSEOF

cat > /app/packages/database/src/index.js << 'JSEOF'
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var prisma_1 = require("./prisma");
Object.keys(prisma_1).forEach(function (k) {
    if (k !== "default" && !Object.prototype.hasOwnProperty.call(exports, k)) {
        Object.defineProperty(exports, k, { enumerable: true, get: function() { return prisma_1[k]; } });
    }
});
JSEOF

cp -r /app/packages/database/src/. /app/packages/database/dist/

echo "database: done"
echo "All workspace packages built."