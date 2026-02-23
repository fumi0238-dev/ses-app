import 'dotenv/config';
import xlsx from '../node_modules/xlsx/xlsx.js';
import { PrismaClient } from '../src/generated/prisma/index.js';
import { PrismaLibSQL } from '../node_modules/@prisma/adapter-libsql/dist/index.js';
import { createClient } from '../node_modules/@libsql/client/dist/node.js';

// Better-sqlite3経由でPrismaを使う
// 直接better-sqlite3で操作する
import Database from '../node_modules/better-sqlite3/build/Release/better_sqlite3.node';
